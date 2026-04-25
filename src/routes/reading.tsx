import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { chunks, lessonAuthor } from "@/config/lessonText";
import { ReadingTextWithVocab } from "@/components/ReadingTextWithVocab";
import { SceneVisualStage } from "@/components/SceneVisualStage";
import { AudioControls } from "@/components/AudioControls";
import { progressStore, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/reading")({
  head: () => ({ meta: [{ title: "القراءة التّفاعليّة" }] }),
  component: ReadingPage,
});

function ReadingPage() {
  const navigate = useNavigate();
  const progress = useProgress();
  const [chunkIdx, setChunkIdx] = useState(progress.currentChunk - 1);
  const chunk = chunks[chunkIdx];

  useEffect(() => {
    progressStore.set((p) => {
      if (p.flowStep === "reading" && p.currentChunk === chunkIdx + 1) return p;
      return { ...p, flowStep: "reading", currentChunk: chunkIdx + 1 };
    });
  }, [chunkIdx]);

  const onPrev = () => {
    if (chunkIdx > 0) setChunkIdx(chunkIdx - 1);
  };
  const onNext = () => {
    if (chunkIdx < chunks.length - 1) {
      setChunkIdx(chunkIdx + 1);
    } else {
      progressStore.set((p) => ({ ...p, flowStep: "section", currentSection: 0 }));
      navigate({ to: "/section/$idx", params: { idx: "0" } });
    }
  };

  return (
    <div className="min-h-screen stadium-bg">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="text-sm text-muted-foreground mb-2">
          {progress.studentName} — {progress.studentClass}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="aspect-[4/3] lg:aspect-auto lg:h-[460px] xl:h-[540px]">
            <SceneVisualStage chunkId={chunk.id} />
          </div>

          <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-bold">
                الفقرة {chunk.id}
              </span>
              <span className="text-xs text-muted-foreground">انقر الكلمات الملوّنة لشرحها</span>
            </div>
            <div className="flex-1 overflow-auto pr-1">
              <ReadingTextWithVocab text={chunk.text} />
              {chunkIdx === chunks.length - 1 && (
                <div className="mt-6 text-left text-accent gold-text font-bold">— {lessonAuthor}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AudioControls
            chunkId={chunk.id}
            total={chunks.length}
            onPrev={onPrev}
            onNext={onNext}
            soundEnabled={progress.soundOn}
          />
        </div>
      </div>
    </div>
  );
}
