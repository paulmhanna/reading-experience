// File-based audio configuration. Edit cue timings here.
export interface AudioCue {
  time: number; // seconds from chunk start
  effect: string; // file in /audio/sfx/
  volume?: number; // 0..1
  stopAfter?: number; // seconds
}

export interface ChunkAudio {
  narration: string;
  ambience?: string;
  ambienceVolume?: number;
  ambienceLoop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  cues: AudioCue[];
}

const sfx = (n: string) => `/audio/sfx/${n}`;
const nar = (n: string) => `/audio/narration/${n}`;

export const lessonAudio: Record<number, ChunkAudio> = {
  1: {
    narration: nar("chunk-1.mp3"),
    ambience: sfx("crowd-soft.mp3"),
    ambienceVolume: 0.35,
    ambienceLoop: true,
    fadeIn: 0.6,
    fadeOut: 0.8,
    cues: [
      { time: 1.2, effect: sfx("footsteps.mp3"), volume: 0.8, stopAfter: 4 },
      //{ time: 6.5, effect: sfx("crowd-loud.mp3"), volume: 0.5, stopAfter: 6 },
    ],
  },
  2: {
    narration: nar("chunk-2.mp3"),
    ambience: sfx("crowd-loud.mp3"),
    ambienceVolume: 0.4,
    ambienceLoop: true,
    fadeIn: 0.5,
    fadeOut: 0.8,
    cues: [
      { time: 2.5, effect: sfx("cheer-burst.mp3"), volume: 0.7, stopAfter: 3 },
      //{ time: 7, effect: sfx("anthem-swell.mp3"), volume: 0.55, stopAfter: 8 },
      //{ time: 14, effect: sfx("flags-whoosh.mp3"), volume: 0.6, stopAfter: 4 },
      { time: 5, effect: sfx("clap-burst.mp3"), volume: 0.6, stopAfter: 10 },
    ],
  },
  3: {
    narration: nar("chunk-3.mp3"),
    ambience: sfx("tension-loop.mp3"),
    ambienceVolume: 0.4,
    ambienceLoop: true,
    cues: [
      { time: 0.3, effect: sfx("whistle.mp3"), volume: 0.85 },
      { time: 4, effect: sfx("bounce.mp3"), volume: 0.6, stopAfter: 4 },
      { time: 8, effect: sfx("squeak.mp3"), volume: 0.5, stopAfter: 2 },
      { time: 14, effect: sfx("swoosh.mp3"), volume: 0.7 },
      { time: 18, effect: sfx("scoreboard-hit.mp3"), volume: 0.7 },
    ],
  },
  4: {
    narration: nar("chunk-4.mp3"),
    ambience: sfx("crowd-loud.mp3"),
    ambienceVolume: 0.45,
    ambienceLoop: true,
    cues: [
      { time: 2, effect: sfx("scoreboard-hit.mp3"), volume: 0.7 },
      { time: 6, effect: sfx("clap-burst.mp3"), volume: 0.55, stopAfter: 3 },
      { time: 11, effect: sfx("tension-loop.mp3"), volume: 0.4, stopAfter: 8 },
      { time: 16, effect: sfx("heartbeat.mp3"), volume: 0.55, stopAfter: 6 },
    ],
  },
  5: {
    narration: nar("chunk-5.mp3"),
    ambience: sfx("tension-loop.mp3"),
    ambienceVolume: 0.5,
    ambienceLoop: true,
    cues: [
      { time: 0.3, effect: sfx("heartbeat.mp3"), volume: 0.7, stopAfter: 8 },
      { time: 9, effect: sfx("swoosh.mp3"), volume: 0.85 },
      { time: 10, effect: sfx("victory-hit.mp3"), volume: 0.9 },
      { time: 12, effect: sfx("cheer-burst.mp3"), volume: 0.85, stopAfter: 6 },
      { time: 14, effect: sfx("clap-burst.mp3"), volume: 0.75, stopAfter: 5 },
      { time: 18, effect: sfx("final-shout.mp3"), volume: 0.85 },
    ],
  },
  6: {
    narration: nar("chunk-6.mp3"),
    ambience: sfx("ending-soft.mp3"),
    ambienceVolume: 0.4,
    ambienceLoop: true,
    fadeOut: 1.5,
    cues: [
      { time: 3, effect: sfx("trophy-glow.mp3"), volume: 0.7 },
      { time: 7, effect: sfx("applause.mp3"), volume: 0.7, stopAfter: 8 },
      { time: 12, effect: sfx("cheer-burst.mp3"), volume: 0.65, stopAfter: 5 },
    ],
  },
};
