import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sections, gradeSection } from "@/config/questions";
import { progressStore, useProgress } from "@/lib/progress";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";
import { exportElementToPdf } from "@/lib/pdf";
import { resolveAnswer } from "@/lib/answerResolver";
import { PrintableReport } from "@/components/PrintableReport";
import { SaveExitButton } from "@/components/SaveExitButton";
import { Download, RotateCcw, Trophy, Check, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "النّتائج" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const progress = useProgress();
  const navigate = useNavigate();
  const printableRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [printHost, setPrintHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("data-pdf-print-host", "true");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:0",
      "height:0",
      "overflow:hidden",
      "opacity:0",
      "pointer-events:none",
      "z-index:-1",
      "background:#ffffff",
      "color:#111827",
      "isolation:isolate",
    ].join(";");
    document.body.appendChild(host);
    setPrintHost(host);

    return () => {
      setPrintHost(null);
      document.body.removeChild(host);
    };
  }, []);

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
    setErrorMsg(null);
    if (!printableRef.current) {
      setErrorMsg("تعذّر تجهيز التّقرير. حاول مرّة أخرى.");
      return;
    }
    setDownloading(true);
    try {
      const safeName = (progress.studentName || "تلميذ").replace(/\s+/g, "_");
      const filename = `${safeName}_في_ملعب_كرة_السلة.pdf`;
      await exportElementToPdf(printableRef.current, filename);
    } catch (e: any) {
      console.error("[pdf] download failed:", e);
      const raw = e?.message || "غير معروف";
      setErrorMsg(
        "حدث خطأ أثناء توليد ملف PDF. الرّجاء المحاولة مرّة أخرى. (" + raw + ")"
      );
    } finally {
      setDownloading(false);
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
          <div className="flex gap-3 flex-wrap">
            <SaveExitButton />
            <button
              onClick={onDownload}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl btn-gold font-bold flex items-center gap-2 hover:[transform:translateY(-2px)] transition disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "جاري التّحميل..." : "تحميل PDF"}
            </button>
            <button
              onClick={restart}
              className="px-5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> بدء جديد
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive text-sm">
            {errorMsg}
          </div>
        )}

        <div dir="rtl" className="space-y-6 bg-background/0">
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

          {/* Scores summary */}
          <div className="grid md:grid-cols-2 gap-4">
            {results.map((r) => (
              <ScoreCard key={r.section.id} title={r.section.title} earned={r.earned} max={r.max} />
            ))}
          </div>

          <div className="glass-panel rounded-3xl p-6 text-center scoreboard-flash">
            <div className="text-sm text-muted-foreground">العلامة النّهائيّة</div>
            <div className="text-5xl font-extrabold gold-text mt-2">
              {Math.round(totalEarned * 10) / 10} / {totalMax}
            </div>
            <div className="text-xl electric-text mt-1">{pct}%</div>
            <div className="text-xs text-accent/80 mt-3">
              التّعبير والبحث لا يشملهما التّقييم.
            </div>
          </div>

          {/* Detailed corrections — full per-question breakdown */}
          {results.map((r) => (
            <div key={r.section.id} className="space-y-4">
              <h2 className="text-2xl font-bold electric-text">تصحيح: {r.section.title}</h2>
              {r.section.questions.map((q, idx) => {
                const score = r.perQuestion.find((p) => p.questionId === q.id);
                const lines = resolveAnswer(q, progress.answers[r.section.id]?.[q.id]);
                const earned = score?.earned ?? 0;
                const max = score?.max ?? 0;
                return (
                  <div key={q.id} className="glass-panel rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <h3 className="text-arabic-lg font-bold flex-1">
                        <span className="electric-text">سؤال {idx + 1}.</span> {q.prompt}
                      </h3>
                      {max > 0 && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-secondary/60 whitespace-nowrap">
                          العلامة: {Math.round(earned * 10) / 10} / {max}
                        </span>
                      )}
                    </div>
                    {q.context && (
                      <div className="mb-3 p-3 rounded-xl bg-secondary/40 text-sm leading-loose border-r-4 border-accent">
                        {q.context}
                      </div>
                    )}
                    <div className="space-y-3">
                      {lines.map((line, i) => (
                        <AnswerLine key={i} line={line} />
                      ))}
                    </div>
                  </div>
                );
              })}
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

      {printHost
        ? createPortal(
            <PrintableReport
              ref={printableRef}
              studentName={progress.studentName}
              studentClass={progress.studentClass}
              sessionId={progress.sessionId}
              sections={sections}
              answers={progress.answers}
              expressionText={progress.expressionText}
              researchText={progress.researchText}
            />,
            printHost
          )
        : null}
    </div>
  );
}

function AnswerLine({ line }: { line: ReturnType<typeof resolveAnswer>[number] }) {
  const ok = line.ok;
  const isOk = ok === true;
  const isWrong = ok === false;
  const isPartial = ok === "partial";
  const isUngraded = ok === "ungraded";

  return (
    <div
      className={`p-3 rounded-xl border-2 ${
        isOk
          ? "border-success/60 bg-success/10"
          : isWrong
          ? "border-destructive/60 bg-destructive/10"
          : "border-border bg-secondary/30"
      }`}
    >
      {line.label && (
        <div className="text-sm font-semibold text-foreground/80 mb-2">{line.label}</div>
      )}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground mb-1">إجابة التّلميذ</div>
          <div className={`font-semibold ${isWrong ? "text-destructive" : ""}`}>{line.given}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">الإجابة الصّحيحة</div>
          <div className="font-semibold text-success">{line.correct || "—"}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {isOk && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success font-bold">
            <Check className="w-3 h-3" /> صحيح
          </span>
        )}
        {isWrong && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold">
            <X className="w-3 h-3" /> خطأ
          </span>
        )}
        {isPartial && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
            تصحيح جزئيّ
          </span>
        )}
        {isUngraded && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground font-bold">
            غير محتسب
          </span>
        )}
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
