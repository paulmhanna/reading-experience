import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { audioManager } from "@/lib/audioManager";
import { lessonAudio } from "@/config/lessonAudio";

export function useLessonAudio(chunkId: number, enabled: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [rate, setRateState] = useState(1);
  const lastChunk = useRef<number | null>(null);

  // Subscribe to manager updates so volume sliders re-render
  const snapshot = useSyncExternalStore(
    (cb) => audioManager.subscribe(cb),
    () => ({
      n: audioManager.narrationVolume,
      a: audioManager.ambienceVolume,
      e: audioManager.effectsVolume,
      m: audioManager.muted,
    }),
    () => ({ n: 1, a: 0.5, e: 0.8, m: false })
  );

  useEffect(() => {
    audioManager.setMuted(!enabled || muted);
  }, [enabled, muted]);

  useEffect(() => {
    audioManager.setPlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    return () => audioManager.stopAll();
  }, []);

  // Auto-play on chunk change (when enabled)
  useEffect(() => {
    if (!enabled) {
      audioManager.stopAll();
      setIsPlaying(false);
      return;
    }
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    audioManager.playChunk(cfg);
    setIsPlaying(true);
    lastChunk.current = chunkId;
  }, [chunkId, enabled]);

  const play = () => {
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    if (lastChunk.current === chunkId && !isPlaying) {
      // resume
      audioManager.resumeAll();
      setIsPlaying(true);
      return;
    }
    audioManager.playChunk(cfg);
    setIsPlaying(true);
    lastChunk.current = chunkId;
  };

  const pause = () => {
    audioManager.pauseAll();
    setIsPlaying(false);
  };

  const replay = () => {
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    audioManager.playChunk(cfg);
    setIsPlaying(true);
  };

  const stop = () => {
    audioManager.stopAll();
    setIsPlaying(false);
  };

  return {
    isPlaying,
    muted,
    setMuted: setMutedState,
    rate,
    setRate: setRateState,
    play,
    pause,
    resume: play,
    replay,
    stop,
    narrationVolume: snapshot.n,
    ambienceVolume: snapshot.a,
    effectsVolume: snapshot.e,
    setNarrationVolume: (v: number) => audioManager.setNarrationVolume(v),
    setAmbienceVolume: (v: number) => audioManager.setAmbienceVolume(v),
    setEffectsVolume: (v: number) => audioManager.setEffectsVolume(v),
  };
}
