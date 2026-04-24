import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { sections, gradeSection } from "@/config/questions";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { progressStore, useProgress, trackEvent } from "@/lib/progress";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";
import { exportElementToPdf } from "@/lib/pdf";
import { Download, RotateCcw, Trophy } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "النّتائج" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    return sections
      .filter((s) => s.graded)
      .map((s) => ({
        section: s,
        ...gradeSection(s, progress.answers[s.id] || {}),
      }));
  }, [progress.answers]);

  const totalEarned = results.reduce((a, b) => a + b.earned, 0);
  const totalMax = results.reduce((a, b) => a + b.max, 0);
  const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;

  const onDownload = async () => {
    if (!reportRef.current) return;
    trackEvent("pdf_downloaded", { name: progress.studentName, cls: progress.studentClass });
    const safeName = (progress.studentName || "تلميذ").replace(/\s+/g, "_");
    const safeCls = (progress.studentClass || "").replace(/\s+/g, "_");
    const filename = `${safeName}_${safeCls}_في_ملعب_كرة_السلة.pdf`;
    await exportElementToPdf(reportRef.current, filename);
  };

  const restart = () => {
    progressStore.reset();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen stadium-bg">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← الرّئيسيّة</Link>
          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="px-5 py-2.5 rounded-xl btn-gold font-bold flex items-center gap-2 hover:[transform:translateY(-2px)] transition"
            >
              <Download className="w-4 h-4" /> تنزيل PDF
            </button>
            <button
              onClick={restart}
              className="px-5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> بدء جديد
            </button>
          </div>
        </div>

        <div ref={reportRef} className="space-y-6">
          {/* Header */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-accent trophy-glow mb-3" />
            <h1 className="text-3xl md:text-4xl font-extrabold gold-text mb-2">{lessonTitle}</h1>
            <div className="text-sm text-muted-foreground mb-4">{lessonAuthor}</div>
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-right">
              <Field label="اسم التّلميذ" value={progress.studentName} />
              <Field label="الصّفّ / الشّعبة" value={progress.studentClass || "—"} />
              <Field label="التّاريخ" value={new Date().toLocaleDateString("ar")} />
              <Field label="رقم الجلسة" value={progress.sessionId.slice(0, 8)} />
            </div>
          </div>

          {/* Scores */}
          <div className="grid md:grid-cols-3 gap-4">
            {results.map((r) => (
              <ScoreCard key={r.section.id} title={r.section.title} earned={r.earned} max={r.max} />
            ))}
            <div className="glass-panel rounded-3xl p-6 text-center md:col-span-3 scoreboard-flash">
              <div className="text-sm text-muted-foreground">العلامة النّهائيّة</div>
              <div className="text-5xl font-extrabold gold-text mt-2">
                {Math.round(totalEarned * 10) / 10} / {totalMax}
              </div>
              <div className="text-xl electric-text mt-1">{pct}%</div>
              <div className="text-xs text-accent/80 mt-3">
                التّعبير والبحث لا يشملهما التّقييم.
              </div>
            </div>
          </div>

          {/* Detailed corrections */}
          {results.map((r) => (
            <div key={r.section.id}>
              <h2 className="text-2xl font-bold electric-text mb-3">تصحيح: {r.section.title}</h2>
              <QuestionRenderer
                section={r.section}
                answers={progress.answers[r.section.id] || {}}
                onChange={() => {}}
                showCorrection
                perQuestion={r.perQuestion}
              />
            </div>
          ))}

          {/* Expression / Research display */}
          {(progress.expressionText || progress.researchText) && (
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-xl font-bold gold-text mb-4">إجابات غير محتسبة</h2>
              {progress.expressionText && (
                <div className="mb-4">
                  <div className="font-semibold mb-2 electric-text">في التّعبير:</div>
                  <p className="text-arabic-lg leading-loose whitespace-pre-wrap">{progress.expressionText}</p>
                </div>
              )}
              {progress.researchText && (
                <div>
                  <div className="font-semibold mb-2 electric-text">في البحث:</div>
                  <p className="text-arabic-lg leading-loose whitespace-pre-wrap">{progress.researchText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-xl p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold mt-1">{value}</div>
    </div>
  );
}

function ScoreCard({ title, earned, max }: { title: string; earned: number; max: number }) {
  const pct = max ? Math.round((earned / max) * 100) : 0;
  return (
    <div className="glass-panel rounded-3xl p-6 text-center">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-3xl font-extrabold electric-text mt-2">
        {Math.round(earned * 10) / 10} / {max}
      </div>
      <div className="mt-3 h-2 rounded-full bg-secondary/40 overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-primary to-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-accent mt-1">{pct}%</div>
    </div>
  );
}
