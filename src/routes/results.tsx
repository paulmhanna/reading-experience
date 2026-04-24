import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { sections, gradeSection } from "@/config/questions";
import type { Question, QuestionScore } from "@/config/questions";
import { progressStore, useProgress, trackEvent } from "@/lib/progress";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";
import { exportElementToPdf } from "@/lib/pdf";
import { PrintableReport } from "@/components/PrintableReport";
import { Download, RotateCcw, Trophy, Check, X, CircleDot } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "النّتائج" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
    setPdfError(null);
    setPdfBusy(true);
    try {
      if (!reportRef.current) throw new Error("تعذّر تجهيز التّقرير. أعد المحاولة.");
      trackEvent("pdf_downloaded", { name: progress.studentName, cls: progress.studentClass });
      const safeName = (progress.studentName || "تلميذ").replace(/\s+/g, "_");
      const filename = `${safeName}_في_ملعب_كرة_السلة.pdf`;
      await exportElementToPdf(reportRef.current, filename);
    } catch (e: any) {
      console.error("[results] PDF export error:", e);
      setPdfError(e?.message || "فشل تنزيل ملفّ الـ PDF.");
    } finally {
      setPdfBusy(false);
    }
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
              disabled={pdfBusy}
              className="px-5 py-2.5 rounded-xl btn-gold font-bold flex items-center gap-2 hover:[transform:translateY(-2px)] transition disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {pdfBusy ? "جارٍ التّحضير..." : "تنزيل PDF"}
            </button>
            <button
              onClick={restart}
              className="px-5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> بدء جديد
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="mb-4 p-4 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive">
            {pdfError}
          </div>
        )}

        <div className="space-y-6">
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

          {/* Detailed corrections — per-question, with answer + correct + score */}
          {results.map((r) => (
            <div key={r.section.id} className="space-y-4">
              <h2 className="text-2xl font-bold electric-text mb-3">تصحيح: {r.section.title}</h2>
              {r.section.questions.map((q, idx) => (
                <DetailedQuestionCard
                  key={q.id}
                  q={q}
                  index={idx + 1}
                  given={progress.answers[r.section.id]?.[q.id]}
                  score={r.perQuestion.find((p) => p.questionId === q.id)}
                />
              ))}
            </div>
          ))}

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

      {/* Hidden printable report — rasterized for PDF */}
      <PrintableReport ref={reportRef} progress={progress} />
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

// ---------------- Detailed per-question display ----------------
function DetailedQuestionCard({
  q,
  index,
  given,
  score,
}: {
  q: Question;
  index: number;
  given: any;
  score?: QuestionScore;
}) {
  const earned = score?.earned ?? 0;
  const max = score?.max ?? 0;
  const isFull = max > 0 && earned === max;
  const isNone = earned === 0;
  const isPartial = !isFull && !isNone;
  const tone = isFull
    ? "border-success/60 bg-success/5"
    : isPartial
    ? "border-accent/60 bg-accent/5"
    : "border-destructive/60 bg-destructive/5";
  const badgeTone = isFull ? "bg-success text-white" : isPartial ? "bg-accent text-accent-foreground" : "bg-destructive text-white";
  const Icon = isFull ? Check : isPartial ? CircleDot : X;
  const resultLabel = isFull ? "✔ صحيح" : isPartial ? "◐ صحيح جزئيًّا" : "✘ خطأ";

  return (
    <div className={`glass-panel rounded-2xl p-5 border-2 ${tone}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-arabic-lg font-bold text-foreground/95 flex-1">
          <span className="electric-text">سؤال {index}.</span> {q.prompt}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${badgeTone}`}>
          {Math.round(earned * 10) / 10} / {max}
        </span>
      </div>
      {q.context && (
        <div className="mb-3 p-3 rounded-lg bg-secondary/40 text-sm leading-loose border-r-4 border-accent">
          {q.context}
        </div>
      )}
      <AnswerDisplay q={q} given={given} score={score} />
      <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${badgeTone}`}>
        <Icon className="w-4 h-4" /> {resultLabel}
      </div>
    </div>
  );
}

function AnswerDisplay({ q, given, score }: { q: Question; given: any; score?: QuestionScore }) {
  if (q.type === "single") {
    return (
      <div className="space-y-2">
        {q.options!.map((o) => {
          const selected = given === o.id;
          const correct = !!o.correct;
          const cls = correct
            ? "border-success bg-success/15 text-foreground"
            : selected
            ? "border-destructive bg-destructive/15"
            : "border-border bg-secondary/20";
          return (
            <div key={o.id} className={`p-2.5 rounded-lg border-2 text-arabic-lg flex items-center justify-between ${cls}`}>
              <span>{o.label}</span>
              <span className="text-xs font-bold text-muted-foreground">
                {selected && correct && "✔ اختيارك (صحيح)"}
                {selected && !correct && "✘ اختيارك"}
                {!selected && correct && "الإجابة الصّحيحة"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "multi") {
    const arr: string[] = Array.isArray(given) ? given : [];
    return (
      <div className="grid sm:grid-cols-2 gap-2">
        {q.options!.map((o) => {
          const selected = arr.includes(o.id);
          const correct = !!o.correct;
          const cls = correct
            ? "border-success bg-success/15"
            : selected
            ? "border-destructive bg-destructive/15"
            : "border-border bg-secondary/20";
          return (
            <div key={o.id} className={`p-2.5 rounded-lg border-2 text-sm flex items-center justify-between ${cls}`}>
              <span>{o.label}</span>
              <span className="text-xs text-muted-foreground">
                {selected && correct && "✔"}
                {selected && !correct && "✘"}
                {!selected && correct && "—"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "subgroup") {
    return (
      <div className="space-y-4">
        {q.subs!.map((sub) => {
          const v = given?.[sub.id];
          if (sub.type === "multi") {
            const arr: string[] = Array.isArray(v) ? v : [];
            return (
              <div key={sub.id}>
                <div className="font-semibold mb-1.5 text-foreground/85">{sub.prompt}</div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {sub.options.map((o) => {
                    const selected = arr.includes(o.id);
                    const correct = !!o.correct;
                    const cls = correct
                      ? "border-success bg-success/15"
                      : selected
                      ? "border-destructive bg-destructive/15"
                      : "border-border bg-secondary/20";
                    return (
                      <div key={o.id} className={`p-2 rounded-md border-2 text-sm ${cls}`}>
                        {o.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return (
            <div key={sub.id}>
              <div className="font-semibold mb-1.5 text-foreground/85">{sub.prompt}</div>
              <div className="space-y-1.5">
                {sub.options.map((o) => {
                  const selected = v === o.id;
                  const correct = !!o.correct;
                  const cls = correct
                    ? "border-success bg-success/15"
                    : selected
                    ? "border-destructive bg-destructive/15"
                    : "border-border bg-secondary/20";
                  return (
                    <div key={o.id} className={`p-2 rounded-md border-2 text-sm flex items-center justify-between ${cls}`}>
                      <span>{o.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {selected && correct && "✔ اختيارك"}
                        {selected && !correct && "✘ اختيارك"}
                        {!selected && correct && "الصّواب"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "tokenCorrection") {
    return (
      <div className="space-y-2">
        {q.tokens!.map((t) => {
          const v = (given?.[t.id] || "").trim();
          const ok = v === t.expected.trim();
          const empty = v.length === 0;
          return (
            <div key={t.id} className="grid md:grid-cols-[120px,1fr,1fr] gap-2 items-center">
              <div className="text-sm font-semibold text-muted-foreground">{t.label}</div>
              <div
                className={`p-2 rounded-lg border-2 text-arabic-lg ${
                  empty
                    ? "border-border bg-secondary/30 text-muted-foreground"
                    : ok
                    ? "border-success bg-success/15"
                    : "border-destructive bg-destructive/15"
                }`}
              >
                {empty ? "— لم يُجَب —" : v}
              </div>
              <div className="p-2 rounded-lg border-2 border-success/60 bg-success/10 text-arabic-lg gold-text">
                {t.expected}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "tableFill") {
    return (
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 border border-border bg-secondary/40"></th>
            {q.tableColumns!.map((c) => (
              <th key={c} className="p-2 border border-border bg-secondary/40">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.tableRows!.map((row) => (
            <tr key={row.id}>
              <td className="p-2 border border-border bg-secondary/30 font-semibold">{row.label}</td>
              {q.tableColumns!.map((col) => {
                const cell = row.cells.find((c) => c.col === col);
                if (cell?.given) {
                  return (
                    <td key={col} className="p-2 border border-border text-center font-bold gold-text">
                      {cell.given}
                    </td>
                  );
                }
                const v = (given?.[row.id]?.[col] || "").trim();
                const ok = v === cell!.expected.trim();
                return (
                  <td key={col} className="p-2 border border-border text-center">
                    <div
                      className={`p-1.5 rounded-md border-2 ${
                        v.length === 0
                          ? "border-border bg-secondary/20 text-muted-foreground"
                          : ok
                          ? "border-success bg-success/15"
                          : "border-destructive bg-destructive/15"
                      }`}
                    >
                      {v || "—"}
                    </div>
                    <div className="text-xs gold-text mt-1">{cell!.expected}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (q.type === "freeText") {
    const v = (given || "").toString();
    return (
      <div className="space-y-2">
        <div>
          <div className="text-xs text-muted-foreground mb-1">إجابة التّلميذ:</div>
          <div className="p-3 rounded-lg bg-secondary/40 text-arabic-lg leading-loose whitespace-pre-wrap min-h-[3rem]">
            {v || "— لم يُجَب —"}
          </div>
        </div>
        {q.expected && (
          <div>
            <div className="text-xs text-success mb-1">الإجابة الصّحيحة:</div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/40 text-arabic-lg leading-loose gold-text whitespace-pre-wrap">
              {q.expected}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
