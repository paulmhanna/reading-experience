import { useEffect, useRef, useState } from "react";
import { audioManager } from "@/lib/audioManager";
import { lessonAudio } from "@/config/lessonAudio";

export function useLessonAudio(chunkId: number, enabled: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [narrationVolume, setNarrationVolumeState] = useState(audioManager.narrationVolume);
  const [ambienceVolume, setAmbienceVolumeState] = useState(audioManager.ambienceVolume);
  const [effectsVolume, setEffectsVolumeState] = useState(audioManager.effectsVolume);
  const lastChunk = useRef<number | null>(null);

  useEffect(() => {
    audioManager.setMuted(!enabled || muted);
  }, [enabled, muted]);

  useEffect(() => {
    audioManager.setPlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    return () => {
      audioManager.stopAll();
      setIsPlaying(false);
    };
  }, []);

  // Auto-play when chunk changes (only if sound enabled)
  useEffect(() => {
    if (!enabled) return;
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    audioManager.playChunk(cfg);
    setIsPlaying(true);
    lastChunk.current = chunkId;
    // Mark not playing when narration ends
    const off = audioManager.onNarrationEnded(() => setIsPlaying(false));
    return () => {
      off();
    };
  }, [chunkId, enabled]);

  const play = () => {
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    if (lastChunk.current === chunkId) {
      audioManager.resumeAll();
    } else {
      audioManager.playChunk(cfg);
      lastChunk.current = chunkId;
    }
    setIsPlaying(true);
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
    lastChunk.current = chunkId;
  };

  const stop = () => {
    audioManager.stopAll();
    setIsPlaying(false);
  };

  const setNarrationVolume = (v: number) => {
    audioManager.setNarrationVolume(v);
    setNarrationVolumeState(v);
  };
  const setAmbienceVolume = (v: number) => {
    audioManager.setAmbienceVolume(v);
    setAmbienceVolumeState(v);
  };
  const setEffectsVolume = (v: number) => {
    audioManager.setEffectsVolume(v);
    setEffectsVolumeState(v);
  };

  return {
    isPlaying,
    muted,
    setMuted,
    rate,
    setRate,
    narrationVolume,
    ambienceVolume,
    effectsVolume,
    setNarrationVolume,
    setAmbienceVolume,
    setEffectsVolume,
    play,
    pause,
    replay,
    stop,
  };
}
