import { useEffect, useRef, useState } from "react";
import { audioManager } from "@/lib/audioManager";
import { lessonAudio } from "@/config/lessonAudio";

export function useLessonAudio(chunkId: number, enabled: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const lastChunk = useRef<number | null>(null);

  useEffect(() => {
    audioManager.setMuted(!enabled || muted);
  }, [enabled, muted]);

  useEffect(() => {
    audioManager.setPlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    return () => audioManager.stopAll();
  }, []);

  const play = () => {
    const cfg = lessonAudio[chunkId];
    if (!cfg) return;
    audioManager.playChunk(cfg);
    setIsPlaying(true);
    lastChunk.current = chunkId;
  };

  const pause = () => {
    audioManager.pauseAll();
    setIsPlaying(false);
  };

  const resume = () => {
    audioManager.resumeAll();
    setIsPlaying(true);
  };

  const replay = () => {
    play();
  };

  const stop = () => {
    audioManager.stopAll();
    setIsPlaying(false);
  };

  return {
    isPlaying,
    muted,
    setMuted,
    rate,
    setRate,
    play,
    pause,
    resume,
    replay,
    stop,
  };
}
