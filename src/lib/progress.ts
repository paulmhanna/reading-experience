import { useEffect, useState, useSyncExternalStore } from "react";
import type { AnswerValue } from "@/config/questions";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "salla-app-progress-v1";
const DEVICE_SESSION_KEY = "salla-app-device-session";
const ENTERED_FLAG_KEY = "salla-app-entered-flag";
const FINISHED_FLAG_KEY = "salla-app-finished-flag";

export interface Progress {
  studentName: string;
  studentClass: string;
  soundOn: boolean;
  currentChunk: number;
  currentSection: number;
  flowStep:
    | "welcome"
    | "instructions"
    | "reading"
    | "section"
    | "results";
  answers: Record<string, Record<string, AnswerValue>>;
  expressionText: string;
  researchText: string;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
  sessionId: string;
}

function getOrCreateDeviceSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = localStorage.getItem(DEVICE_SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export const emptyProgress = (): Progress => ({
  studentName: "",
  studentClass: "",
  soundOn: true,
  currentChunk: 1,
  currentSection: 0,
  flowStep: "welcome",
  answers: {},
  expressionText: "",
  researchText: "",
  startedAt: Date.now(),
  updatedAt: Date.now(),
  completedAt: null,
  sessionId: getOrCreateDeviceSessionId(),
});

let memoryStore: Progress = emptyProgress();
let initialized = false;
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Progress;
      // always keep a stable per-device sessionId
      memoryStore = { ...emptyProgress(), ...parsed, sessionId: getOrCreateDeviceSessionId() };
    } else {
      memoryStore = emptyProgress();
    }
  } catch {}
  initialized = true;
}

function persist() {
  if (typeof window === "undefined") return;
  memoryStore.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  } catch {}
  for (const l of listeners) l();
}

export const progressStore = {
  get(): Progress {
    if (!initialized) load();
    return memoryStore;
  },
  set(updater: (p: Progress) => Progress) {
    if (!initialized) load();
    const next = updater(memoryStore);
    if (next === memoryStore) return;
    memoryStore = next;
    persist();
  },
  reset() {
    // wipe progress but keep device session id (so analytics still dedupe)
    memoryStore = emptyProgress();
    try {
      localStorage.removeItem(STORAGE_KEY);
      // clear finished flag so a fresh run can be counted again only if they finish a NEW session
      localStorage.removeItem(FINISHED_FLAG_KEY);
      localStorage.removeItem(ENTERED_FLAG_KEY);
      // give a brand-new session id for the new run
      const sid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_SESSION_KEY, sid);
      memoryStore.sessionId = sid;
    } catch {}
    persist();
  },
  /** Save current progress and return to home — student can resume on this device. */
  saveAndExit() {
    persist();
  },
  hasSavedProgress(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const p = JSON.parse(raw) as Progress;
      return p.flowStep !== "welcome" && !p.completedAt;
    } catch {
      return false;
    }
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => progressStore.subscribe(cb),
    () => progressStore.get(),
    () => emptyProgress()
  );
}

// =====================================================================
// Shared analytics (Lovable Cloud) — two counters only.
// =====================================================================
export interface AnalyticsRecord {
  loggedIn: number;
  completed: number;
  fallback: boolean;
  loaded: boolean;
}

async function insertCounter(metric: "entered" | "finished", sessionId: string) {
  try {
    await supabase
      .from("analytics_counters")
      .insert({ metric, session_id: sessionId });
  } catch {
    /* unique violation = already counted; ignore */
  }
}

export async function trackLoggedIn(sessionId: string, _name?: string, _cls?: string) {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    if (localStorage.getItem(ENTERED_FLAG_KEY) === sessionId) return;
    localStorage.setItem(ENTERED_FLAG_KEY, sessionId);
  } catch {}
  await insertCounter("entered", sessionId);
}

export async function trackCompleted(sessionId: string, _name?: string, _cls?: string) {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    if (localStorage.getItem(FINISHED_FLAG_KEY) === sessionId) return;
    localStorage.setItem(FINISHED_FLAG_KEY, sessionId);
  } catch {}
  await insertCounter("finished", sessionId);
}

// Backwards-compatible no-op
export function trackEvent(_event: string, _meta?: any) {}

async function fetchCounters(): Promise<{ loggedIn: number; completed: number } | null> {
  try {
    const [enteredRes, finishedRes] = await Promise.all([
      supabase
        .from("analytics_counters")
        .select("*", { count: "exact", head: true })
        .eq("metric", "entered"),
      supabase
        .from("analytics_counters")
        .select("*", { count: "exact", head: true })
        .eq("metric", "finished"),
    ]);
    if (enteredRes.error || finishedRes.error) return null;
    return {
      loggedIn: enteredRes.count ?? 0,
      completed: finishedRes.count ?? 0,
    };
  } catch {
    return null;
  }
}

export function useAnalytics(): AnalyticsRecord {
  const [data, setData] = useState<AnalyticsRecord>({
    loggedIn: 0,
    completed: 0,
    fallback: false,
    loaded: false,
  });
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await fetchCounters();
      if (cancelled) return;
      if (res) {
        setData({ ...res, fallback: false, loaded: true });
      } else {
        setData((prev) => ({ ...prev, fallback: true, loaded: true }));
      }
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  return data;
}
