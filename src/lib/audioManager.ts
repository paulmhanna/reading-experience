import type { ChunkAudio, AudioCue } from "@/config/lessonAudio";

type ChannelKind = "narration" | "ambience" | "effect";

class AudioManager {
  muted = false;
  narrationVolume = 1;
  ambienceVolume = 0.6;
  effectsVolume = 0.8;
  playbackRate = 1;

  private narrationEl: HTMLAudioElement | null = null;
  private ambienceEl: HTMLAudioElement | null = null;
  private activeEffects: HTMLAudioElement[] = [];
  private cueTimers: number[] = [];
  private fadeTimers: number[] = [];
  private endedHandlers = new Set<() => void>();
  private currentChunk: ChunkAudio | null = null;
  private isPaused = false;

  isReady = typeof window !== "undefined";

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolumes();
  }
  setNarrationVolume(v: number) {
    this.narrationVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }
  setAmbienceVolume(v: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }
  setEffectsVolume(v: number) {
    this.effectsVolume = Math.max(0, Math.min(1, v));

    for (const e of this.activeEffects) {
      const base = (e as any).__baseVolume ?? 0.7;
      e.volume = this.muted ? 0 : base * this.effectsVolume;
    }
  }
  setPlaybackRate(r: number) {
    this.playbackRate = r;

    if (this.narrationEl) {
      this.narrationEl.defaultPlaybackRate = r;
      this.narrationEl.playbackRate = r;
    }

    if (this.currentChunk && this.narrationEl && !this.isPaused) {
      this.clearTimers();

      const now = this.narrationEl.currentTime;

      for (const cue of this.currentChunk.cues) {
        if (cue.time > now) {
          const delayMs = ((cue.time - now) / this.playbackRate) * 1000;
          const t = window.setTimeout(() => this.fireCue(cue), delayMs);
          this.cueTimers.push(t);
        }
      }
    }
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
      const chunkAmbienceVolume = this.currentChunk?.ambienceVolume ?? 0.4;
      this.ambienceEl.volume = this.muted ? 0 : chunkAmbienceVolume * this.ambienceVolume;
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
    for (const t of this.fadeTimers) window.clearInterval(t);
    this.fadeTimers = [];
  }

  stopAll() {
    this.clearTimers();
    if (this.narrationEl) {
      this.narrationEl.pause();
      this.narrationEl.src = "";
      this.narrationEl = null;
    }
    if (this.ambienceEl) {
      this.ambienceEl.pause();
      this.ambienceEl.src = "";
      this.ambienceEl = null;
    }
    for (const e of this.activeEffects) {
      e.pause();
      e.src = "";
    }
    this.activeEffects = [];
    this.currentChunk = null;
    this.isPaused = false;
  }

  pauseAll() {
    // CRITICAL: stop scheduled cue timers so they don't fire while paused
    this.clearTimers();
    this.narrationEl?.pause();
    this.ambienceEl?.pause();
    for (const e of this.activeEffects) e.pause();
    this.isPaused = true;
  }

  resumeAll() {
    this.narrationEl?.play().catch(() => {});
    this.ambienceEl?.play().catch(() => {});
    // Reschedule remaining cues based on current narration time
    if (this.currentChunk && this.narrationEl) {
      const now = this.narrationEl.currentTime;
      for (const cue of this.currentChunk.cues) {
        if (cue.time > now) {
          const delayMs = ((cue.time - now) / this.playbackRate) * 1000;
          const t = window.setTimeout(() => this.fireCue(cue), delayMs);
          this.cueTimers.push(t);
        }
      }
    }
    this.isPaused = false;
  }

  async playChunk(config: ChunkAudio) {
    this.stopAll();
    if (!this.isReady) return;
    this.currentChunk = config;

    if (config.ambience) {
      const amb = this.createAudio(config.ambience, "ambience", 1);
      if (amb) {
        amb.loop = config.ambienceLoop ?? true;
        amb.volume = 0;
        this.ambienceEl = amb;
        amb.play().catch(() => {});
        const targetVol = this.muted
          ? 0
          : (config.ambienceVolume ?? 0.4) * this.ambienceVolume;
        const fadeMs = (config.fadeIn ?? 0.5) * 1000;
        this.fade(amb, 0, targetVol, fadeMs);
      }
    }

    const nar = this.createAudio(config.narration, "narration", 1);
    if (nar) {
      this.narrationEl = nar;
      nar.defaultPlaybackRate = this.playbackRate;
      nar.playbackRate = this.playbackRate;
      nar.volume = this.muted ? 0 : this.narrationVolume;
      nar.addEventListener("ended", () => {
        // Fade out ambience when narration ends
        if (this.ambienceEl && this.currentChunk?.fadeOut) {
          const fadeMs = this.currentChunk.fadeOut * 1000;

          this.fade(this.ambienceEl, this.ambienceEl.volume, 0, fadeMs, () => {
            this.ambienceEl?.pause();
            this.ambienceEl = null;
          });
        } else if (this.ambienceEl) {
          // fallback: immediate stop if no fadeOut
          this.ambienceEl.pause();
          this.ambienceEl = null;
        }

        // notify listeners (UI)
        for (const cb of this.endedHandlers) cb();
      });
      nar.play().catch(() => {
        console.warn("[audio] narration play() blocked. User gesture needed.");
      });
    }

    for (const cue of config.cues) {
      const delayMs = (cue.time / this.playbackRate) * 1000;
      const t = window.setTimeout(() => this.fireCue(cue), delayMs);
      this.cueTimers.push(t);
    }
  }

  private fireCue(cue: AudioCue) {
    if (this.isPaused) return;

    const baseVol = cue.volume ?? 0.7;
    const a = this.createAudio(cue.effect, "effect", baseVol);
    if (!a) return;

    (a as any).__baseVolume = baseVol;

    a.volume = this.muted ? 0 : baseVol * this.effectsVolume;

    a.play().catch(() => {});

    this.activeEffects.push(a);

    a.addEventListener("ended", () => {
      this.activeEffects = this.activeEffects.filter((x) => x !== a);
    });

    if (cue.stopAfter) {
      const t = window.setTimeout(() => {
        const currentVolume = a.volume;

        this.fade(a, currentVolume, 0, 400, () => {
          a.pause();
          a.currentTime = 0;
          a.src = "";
          this.activeEffects = this.activeEffects.filter((x) => x !== a);
        });
      }, cue.stopAfter * 1000);

      this.cueTimers.push(t);
    }
  }

  private fade(el: HTMLAudioElement, from: number, to: number, ms: number, done?: () => void) {
    const steps = 20;
    const stepMs = ms / steps;
    let i = 0;
    el.volume = from;
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
    this.fadeTimers.push(iv as unknown as number);
  }
}

export const audioManager = new AudioManager();
