import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sections } from "@/config/questions";
import { fullText, lessonAuthor, lessonTitle } from "@/config/lessonText";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { progressStore, useProgress, trackCompleted } from "@/lib/progress";
import { SaveExitButton } from "@/components/SaveExitButton";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/section/$idx")({
  head: () => ({ meta: [{ title: "أسئلة" }] }),
  component: SectionPage,
});

function SectionPage() {
  const { idx } = useParams({ from: "/section/$idx" });
  const sectionIdx = parseInt(idx, 10);
  const section = sections[sectionIdx];
  const navigate = useNavigate();
  const progress = useProgress();
  const [textOpen, setTextOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>(
    progress.answers[section?.id || ""] || {}
  );

  useEffect(() => {
    setAnswers(progress.answers[section?.id || ""] || {});
    progressStore.set((p) => {
      if (p.flowStep === "section" && p.currentSection === sectionIdx) return p;
      return { ...p, flowStep: "section", currentSection: sectionIdx };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIdx]);

  if (!section) return <div className="p-8">قسم غير موجود.</div>;

  const onChange = (qId: string, value: any) => {
    const next = { ...answers, [qId]: value };
    setAnswers(next);
    progressStore.set((p) => ({
      ...p,
      answers: { ...p.answers, [section.id]: next },
      expressionText: section.id === "expression" ? next[section.questions[0].id] || "" : p.expressionText,
      researchText: section.id === "research" ? next[section.questions[0].id] || "" : p.researchText,
    }));
  };

  const goPrev = () => {
    if (sectionIdx > 0) navigate({ to: "/section/$idx", params: { idx: String(sectionIdx - 1) } });
    else navigate({ to: "/reading" });
  };
  const goNext = () => {
    if (sectionIdx < sections.length - 1) {
      navigate({ to: "/section/$idx", params: { idx: String(sectionIdx + 1) } });
    } else {
      progressStore.set((p) => ({ ...p, completedAt: p.completedAt || Date.now(), flowStep: "results" }));
      const sid = progressStore.get().sessionId;
      void trackCompleted(sid, progress.studentName, progress.studentClass);
      navigate({ to: "/results" });
    }
  };

  return (
    <div className="min-h-screen stadium-bg">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← الرّئيسيّة</Link>
          <SaveExitButton />
        </div>

        <div className="mt-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold gold-text">{section.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            {sections.map((s, i) => (
              <span
                key={s.id}
                className={`w-3 h-3 rounded-full transition ${
                  i === sectionIdx ? "bg-accent w-6" : i < sectionIdx ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {!section.graded && (
          <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm">
            هذا القسم غير محتسبٍ في العلامة.
          </div>
        )}

        {/* Full text — expanded by default */}
        <div className="glass-panel rounded-2xl mb-8 overflow-hidden">
          <button
            onClick={() => setTextOpen(!textOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition"
          >
            <span className="font-bold electric-text">النّصّ الكامل — {lessonTitle}</span>
            {textOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {textOpen && (
            <div className="p-5 md:p-6 border-t border-border">
              <div className="text-arabic-lg leading-loose whitespace-pre-line text-foreground/90">
                {fullText}
              </div>
              <div className="mt-4 text-left text-accent gold-text font-bold">— {lessonAuthor}</div>
            </div>
          )}
        </div>

        <QuestionRenderer section={section} answers={answers} onChange={onChange} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={goPrev}
            className="px-6 py-3 rounded-xl bg-secondary/60 hover:bg-secondary transition flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" /> سابق
          </button>
          <button
            onClick={goNext}
            className="px-7 py-3 rounded-xl btn-cinematic font-bold flex items-center gap-2 hover:[transform:translateY(-2px)] transition"
          >
            {sectionIdx === sections.length - 1 ? "عرض النّتائج" : "التالي"}
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
