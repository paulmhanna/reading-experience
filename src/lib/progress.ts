import { useEffect, useState, useSyncExternalStore } from "react";
import type { AnswerValue } from "@/config/questions";

const STORAGE_KEY = "salla-app-progress-v1";
const ANALYTICS_KEY = "salla-app-analytics-v1";

export interface Progress {
  studentName: string;
  studentClass: string;
  soundOn: boolean;
  currentChunk: number; // 1..6
  currentSection: number; // 0..3 (0=comprehension,1=grammar,2=expression,3=research)
  flowStep:
    | "welcome"
    | "instructions"
    | "reading"
    | "section"
    | "results";
  answers: Record<string, Record<string, AnswerValue>>; // sectionId -> qId -> value
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
  sessionId: crypto.randomUUID(),
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
    memoryStore = updater(memoryStore);
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
// Analytics (localStorage fallback only — no backend dependency)
// =====================================================================
export type AnalyticsEvent =
  | "session_started"
  | "reading_started"
  | "chunk_completed"
  | "section_completed"
  | "assessment_submitted"
  | "pdf_downloaded";

export interface AnalyticsRecord {
  totalSessions: number;
  totalReadingStarted: number;
  totalAssessmentsCompleted: number;
  totalPdfDownloads: number;
  recent: { name: string; cls: string; event: AnalyticsEvent; at: number }[];
  sessionIds: string[];
}

const emptyAnalytics = (): AnalyticsRecord => ({
  totalSessions: 0,
  totalReadingStarted: 0,
  totalAssessmentsCompleted: 0,
  totalPdfDownloads: 0,
  recent: [],
  sessionIds: [],
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

export function trackEvent(event: AnalyticsEvent, meta?: { name?: string; cls?: string; sessionId?: string }) {
  if (typeof window === "undefined") return;
  const a = readAnalytics();
  const sid = meta?.sessionId;
  if (event === "session_started") {
    if (sid && !a.sessionIds.includes(sid)) {
      a.sessionIds.push(sid);
      a.totalSessions += 1;
    }
  }
  if (event === "reading_started") a.totalReadingStarted += 1;
  if (event === "assessment_submitted") a.totalAssessmentsCompleted += 1;
  if (event === "pdf_downloaded") a.totalPdfDownloads += 1;
  a.recent.unshift({
    name: meta?.name || "",
    cls: meta?.cls || "",
    event,
    at: Date.now(),
  });
  a.recent = a.recent.slice(0, 100);
  writeAnalytics(a);
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsRecord>(() => readAnalytics());
  useEffect(() => {
    const id = window.setInterval(() => setData(readAnalytics()), 1500);
    return () => window.clearInterval(id);
  }, []);
  return data;
}
