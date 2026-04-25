import { Volume2, VolumeX, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Gauge, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { useLessonAudio } from "@/hooks/useLessonAudio";

interface Props {
  chunkId: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  soundEnabled: boolean;
}

export function AudioControls({ chunkId, total, onPrev, onNext, soundEnabled }: Props) {
  const audio = useLessonAudio(chunkId, soundEnabled);
  const [showMixer, setShowMixer] = useState(false);

  useEffect(() => {
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onPrev}
          disabled={chunkId === 1}
          className="px-4 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary disabled:opacity-40 transition flex items-center gap-2"
          aria-label="السابق"
        >
          <ChevronRight className="w-4 h-4" />
          <span>سابق</span>
        </button>

        <div className="flex items-center gap-2">
          {!audio.isPlaying ? (
            <button
              onClick={audio.play}
              className="px-5 py-2.5 rounded-xl btn-cinematic hover:[transform:translateY(-2px)] transition flex items-center gap-2 font-semibold"
            >
              <Play className="w-4 h-4" />
              <span>تشغيل</span>
            </button>
          ) : (
            <button
              onClick={audio.pause}
              className="px-5 py-2.5 rounded-xl bg-accent/90 hover:bg-accent text-accent-foreground transition flex items-center gap-2 font-semibold"
            >
              <Pause className="w-4 h-4" />
              <span>إيقاف</span>
            </button>
          )}
          <button
            onClick={audio.replay}
            className="px-4 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition flex items-center gap-2"
            aria-label="أعد سماع الفقرة"
          >
            <RotateCcw className="w-4 h-4" />
            <span>أعد السّماع</span>
          </button>
        </div>

        <button
          onClick={() => audio.setMuted(!audio.muted)}
          className="px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition"
          aria-label="كتم"
        >
          {audio.muted || !soundEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowMixer((s) => !s)}
          className={`px-3 py-2.5 rounded-xl transition flex items-center gap-2 ${
            showMixer ? "bg-primary/30" : "bg-secondary/60 hover:bg-secondary"
          }`}
          aria-label="إعدادات الصّوت"
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">المازج</span>
        </button>

        <div className="flex items-center gap-1 bg-secondary/40 rounded-xl px-2 py-1">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          {[0.75, 1, 1.25].map((r) => (
            <button
              key={r}
              onClick={() => audio.setRate(r)}
              className={`px-2 py-1 text-xs rounded-lg transition ${
                audio.rate === r ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {r}x
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[120px] flex items-center gap-2 px-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            الفقرة {chunkId}/{total}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary to-accent transition-all"
              style={{ width: `${(chunkId / total) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={onNext}
          className="px-4 py-2.5 rounded-xl btn-gold hover:[transform:translateY(-2px)] transition flex items-center gap-2 font-semibold"
          aria-label={chunkId === total ? "إلى الأسئلة" : "التالي"}
        >
          <span>{chunkId === total ? "إلى الأسئلة" : "التالي"}</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {showMixer && (
        <div className="glass-panel rounded-2xl p-4 md:p-5 grid sm:grid-cols-3 gap-4">
          <VolumeRow
            label="صوت السّرد"
            value={audio.narrationVolume}
            onChange={audio.setNarrationVolume}
            color="primary"
          />
          <VolumeRow
            label="المؤثّرات الصّوتيّة"
            value={audio.effectsVolume}
            onChange={audio.setEffectsVolume}
            color="accent"
          />
          <VolumeRow
            label="الأجواء (الجمهور)"
            value={audio.ambienceVolume}
            onChange={audio.setAmbienceVolume}
            color="secondary"
          />
        </div>
      )}
    </div>
  );
}

function VolumeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground/90">{label}</span>
        <span className="text-xs text-muted-foreground">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  );
}
