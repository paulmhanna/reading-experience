import type { ChunkAudio, AudioCue } from "@/config/lessonAudio";

type ChannelKind = "narration" | "ambience" | "effect";

class AudioManager {
  muted = false;
  narrationVolume = 1;
  ambienceVolume = 1;
  effectsVolume = 1;
  playbackRate = 1;

  private narrationEl: HTMLAudioElement | null = null;
  private ambienceEl: HTMLAudioElement | null = null;
  private activeEffects: HTMLAudioElement[] = [];
  private timers: number[] = [];
  private endedHandlers = new Set<() => void>();

  isReady = typeof window !== "undefined";

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolumes();
  }
  setNarrationVolume(v: number) {
    this.narrationVolume = v;
    this.applyVolumes();
  }
  setAmbienceVolume(v: number) {
    this.ambienceVolume = v;
    this.applyVolumes();
  }
  setEffectsVolume(v: number) {
    this.effectsVolume = v;
    this.applyVolumes();
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
      this.ambienceEl.volume = this.muted ? 0 : this.ambienceVolume * 0.6;
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

  stopAll() {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
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
  }

  pauseAll() {
    this.narrationEl?.pause();
    this.ambienceEl?.pause();
    for (const e of this.activeEffects) e.pause();
  }

  resumeAll() {
    this.narrationEl?.play().catch(() => {});
    this.ambienceEl?.play().catch(() => {});
  }

  async playChunk(config: ChunkAudio) {
    this.stopAll();
    if (!this.isReady) return;

    // Ambience
    if (config.ambience) {
      const amb = this.createAudio(config.ambience, "ambience", 0.6);
      if (amb) {
        amb.loop = config.ambienceLoop ?? true;
        amb.volume = 0;
        this.ambienceEl = amb;
        amb.play().catch(() => {});
        // fade in
        const targetVol = (config.ambienceVolume ?? 0.4) * (this.muted ? 0 : 1);
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

    // Cues
    for (const cue of config.cues) {
      const t = window.setTimeout(() => this.fireCue(cue), cue.time * 1000);
      this.timers.push(t);
    }
  }

  private fireCue(cue: AudioCue) {
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
          a.pause();
          this.activeEffects = this.activeEffects.filter((x) => x !== a);
        });
      }, cue.stopAfter * 1000);
      this.timers.push(t);
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
    this.timers.push(iv as unknown as number);
  }
}

export const audioManager = new AudioManager();
