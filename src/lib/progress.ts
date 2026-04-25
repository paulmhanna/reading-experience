import { useEffect, useState, useSyncExternalStore } from "react";
import type { AnswerValue } from "@/config/questions";

const STORAGE_KEY = "salla-app-progress-v1";
const ANALYTICS_KEY = "salla-app-analytics-v2";

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
  sessionId: typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2),
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
      memoryStore = { ...emptyProgress(), ...parsed };
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
    // Avoid useless writes if reference unchanged
    if (next === memoryStore) return;
    memoryStore = next;
    persist();
  },
  reset() {
    memoryStore = emptyProgress();
    persist();
  },
  hasSavedProgress(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const p = JSON.parse(raw) as Progress;
      return !!p.studentName && p.flowStep !== "welcome" && !p.completedAt;
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
// Analytics — only TWO accurate counters:
//   - loggedIn (unique sessions that pressed "ابدأ")
//   - completed (unique sessions that reached final results)
// =====================================================================
export interface AnalyticsRecord {
  loggedIn: number;
  completed: number;
  loggedInSessions: string[];
  completedSessions: string[];
  recent: { name: string; cls: string; event: "logged_in" | "completed"; at: number }[];
}

const emptyAnalytics = (): AnalyticsRecord => ({
  loggedIn: 0,
  completed: 0,
  loggedInSessions: [],
  completedSessions: [],
  recent: [],
});

export function readAnalytics(): AnalyticsRecord {
  if (typeof window === "undefined") return emptyAnalytics();
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (raw) return { ...emptyAnalytics(), ...JSON.parse(raw) };
  } catch {}
  return emptyAnalytics();
}

function writeAnalytics(a: AnalyticsRecord) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  } catch {}
}

export function trackLoggedIn(sessionId: string, name: string, cls: string) {
  if (typeof window === "undefined" || !sessionId) return;
  const a = readAnalytics();
  if (a.loggedInSessions.includes(sessionId)) return;
  a.loggedInSessions.push(sessionId);
  a.loggedIn += 1;
  a.recent.unshift({ name, cls, event: "logged_in", at: Date.now() });
  a.recent = a.recent.slice(0, 100);
  writeAnalytics(a);
}

export function trackCompleted(sessionId: string, name: string, cls: string) {
  if (typeof window === "undefined" || !sessionId) return;
  const a = readAnalytics();
  if (a.completedSessions.includes(sessionId)) return;
  a.completedSessions.push(sessionId);
  a.completed += 1;
  a.recent.unshift({ name, cls, event: "completed", at: Date.now() });
  a.recent = a.recent.slice(0, 100);
  writeAnalytics(a);
}

// Backwards-compatible no-op for legacy callers
export function trackEvent(_event: string, _meta?: any) {
  /* deprecated — only loggedIn / completed are tracked now */
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsRecord>(() => readAnalytics());
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = readAnalytics();
      setData((prev) =>
        prev.loggedIn === next.loggedIn && prev.completed === next.completed
          ? prev
          : next
      );
    }, 2000);
    return () => window.clearInterval(id);
  }, []);
  return data;
}
