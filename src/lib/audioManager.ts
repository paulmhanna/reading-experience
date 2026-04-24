import type { ChunkAudio, AudioCue } from "@/config/lessonAudio";

type ChannelKind = "narration" | "ambience" | "effect";

interface PendingCue {
  cue: AudioCue;
  remainingMs: number; // remaining ms from "now" until firing
  scheduledAt: number; // timestamp when scheduled
}

class AudioManager {
  muted = false;
  narrationVolume = 1;
  ambienceVolume = 0.5;
  effectsVolume = 0.8;
  playbackRate = 1;

  private narrationEl: HTMLAudioElement | null = null;
  private ambienceEl: HTMLAudioElement | null = null;
  private activeEffects: HTMLAudioElement[] = [];
  private cueTimers: number[] = [];
  private fadeIntervals: number[] = [];
  private endedHandlers = new Set<() => void>();
  private listeners = new Set<() => void>();

  // For pause/resume: remaining cues
  private pendingCues: PendingCue[] = [];
  private currentChunkConfig: ChunkAudio | null = null;
  private chunkStartedAt = 0;
  private pausedAt = 0;

  isReady = typeof window !== "undefined";

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  private emit() {
    for (const l of this.listeners) l();
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolumes();
    this.emit();
  }
  setNarrationVolume(v: number) {
    this.narrationVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
    this.emit();
  }
  setAmbienceVolume(v: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
    this.emit();
  }
  setEffectsVolume(v: number) {
    this.effectsVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
    this.emit();
  }
  setPlaybackRate(r: number) {
    this.playbackRate = r;
    if (this.narrationEl) this.narrationEl.playbackRate = r;
  }

  onNarrationEnded(cb: () => void) {
    this.endedHandlers.add(cb);
    return () => this.endedHandlers.delete(cb);
  }

  private applyVolumes() {
    if (this.narrationEl) {
      this.narrationEl.volume = this.muted ? 0 : this.narrationVolume;
    }
    if (this.ambienceEl) {
      const base = (this.ambienceEl as any).__baseVolume ?? 0.5;
      this.ambienceEl.volume = this.muted ? 0 : base * this.ambienceVolume;
    }
    for (const e of this.activeEffects) {
      const base = (e as any).__baseVolume ?? 0.7;
      e.volume = this.muted ? 0 : base * this.effectsVolume;
    }
  }

  private createAudio(src: string, kind: ChannelKind, baseVolume = 1) {
    if (!this.isReady) return null;
    const a = new Audio(src);
    a.preload = "auto";
    (a as any).__kind = kind;
    (a as any).__baseVolume = baseVolume;
    a.addEventListener("error", () => {
      console.warn(`[audio] missing or failed: ${src}`);
    });
    return a;
  }

  private clearTimers() {
    for (const t of this.cueTimers) window.clearTimeout(t);
    this.cueTimers = [];
    for (const i of this.fadeIntervals) window.clearInterval(i);
    this.fadeIntervals = [];
  }

  stopAll() {
    this.clearTimers();
    this.pendingCues = [];
    this.currentChunkConfig = null;
    if (this.narrationEl) {
      try {
        this.narrationEl.pause();
      } catch {}
      this.narrationEl.src = "";
      this.narrationEl = null;
    }
    if (this.ambienceEl) {
      try {
        this.ambienceEl.pause();
      } catch {}
      this.ambienceEl.src = "";
      this.ambienceEl = null;
    }
    for (const e of this.activeEffects) {
      try {
        e.pause();
        e.src = "";
      } catch {}
    }
    this.activeEffects = [];
  }

  pauseAll() {
    this.pausedAt = performance.now();
    // Pause audio elements
    this.narrationEl?.pause();
    this.ambienceEl?.pause();
    for (const e of this.activeEffects) e.pause();

    // Capture remaining time on each pending cue and clear timers
    const elapsed = this.pausedAt - this.chunkStartedAt;
    if (this.currentChunkConfig) {
      // Rebuild pendingCues from currently scheduled timers
      // (we already track them — adjust to remaining)
      this.pendingCues = this.pendingCues.map((p) => {
        const fireAt = p.scheduledAt + p.remainingMs;
        const remaining = Math.max(0, fireAt - this.pausedAt);
        return { ...p, remainingMs: remaining };
      });
    }
    // Stop all scheduled timers (cues + fades)
    this.clearTimers();
    this.emit();
  }

  resumeAll() {
    const now = performance.now();
    this.narrationEl?.play().catch(() => {});
    this.ambienceEl?.play().catch(() => {});
    // Reschedule pending cues from their remainingMs
    for (const p of this.pendingCues) {
      p.scheduledAt = now;
      const t = window.setTimeout(() => this.fireCue(p.cue), p.remainingMs);
      this.cueTimers.push(t);
    }
    this.chunkStartedAt = now - (this.pausedAt - this.chunkStartedAt);
    this.emit();
  }

  async playChunk(config: ChunkAudio) {
    this.stopAll();
    if (!this.isReady) return;
    this.currentChunkConfig = config;
    this.chunkStartedAt = performance.now();
    this.pendingCues = [];

    // Ambience
    if (config.ambience) {
      const baseVol = config.ambienceVolume ?? 0.5;
      const amb = this.createAudio(config.ambience, "ambience", baseVol);
      if (amb) {
        amb.loop = config.ambienceLoop ?? true;
        amb.volume = 0;
        this.ambienceEl = amb;
        amb.play().catch(() => {});
        const targetVol = baseVol * this.ambienceVolume * (this.muted ? 0 : 1);
        const fadeMs = (config.fadeIn ?? 0.5) * 1000;
        this.fade(amb, 0, targetVol, fadeMs);
      }
    }

    // Narration
    const nar = this.createAudio(config.narration, "narration", 1);
    if (nar) {
      this.narrationEl = nar;
      nar.playbackRate = this.playbackRate;
      nar.volume = this.muted ? 0 : this.narrationVolume;
      nar.addEventListener("ended", () => {
        for (const cb of this.endedHandlers) cb();
      });
      nar.play().catch(() => {
        console.warn("[audio] narration play() blocked. User gesture needed.");
      });
    }

    // Cues — schedule all and track for pause/resume
    const startedAt = this.chunkStartedAt;
    for (const cue of config.cues) {
      const remainingMs = cue.time * 1000;
      this.pendingCues.push({ cue, remainingMs, scheduledAt: startedAt });
      const t = window.setTimeout(() => this.fireCue(cue), remainingMs);
      this.cueTimers.push(t);
    }
    this.emit();
  }

  private fireCue(cue: AudioCue) {
    // Remove from pending
    this.pendingCues = this.pendingCues.filter((p) => p.cue !== cue);

    const baseVol = cue.volume ?? 0.7;
    const a = this.createAudio(cue.effect, "effect", baseVol);
    if (!a) return;
    a.volume = this.muted ? 0 : baseVol * this.effectsVolume;
    a.play().catch(() => {});
    this.activeEffects.push(a);
    a.addEventListener("ended", () => {
      this.activeEffects = this.activeEffects.filter((x) => x !== a);
    });
    if (cue.stopAfter) {
      const t = window.setTimeout(() => {
        this.fade(a, a.volume, 0, 400, () => {
          try {
            a.pause();
          } catch {}
          this.activeEffects = this.activeEffects.filter((x) => x !== a);
        });
      }, cue.stopAfter * 1000);
      this.cueTimers.push(t);
    }
  }

  private fade(el: HTMLAudioElement, from: number, to: number, ms: number, done?: () => void) {
    const steps = 20;
    const stepMs = Math.max(10, ms / steps);
    let i = 0;
    el.volume = Math.max(0, Math.min(1, from));
    const iv = window.setInterval(() => {
      i++;
      const v = from + (to - from) * (i / steps);
      try {
        el.volume = Math.max(0, Math.min(1, v));
      } catch {}
      if (i >= steps) {
        window.clearInterval(iv);
        done?.();
      }
    }, stepMs);
    this.fadeIntervals.push(iv);
  }
}

export const audioManager = new AudioManager();
