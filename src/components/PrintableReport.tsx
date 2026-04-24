import { forwardRef } from "react";
import type { Section, Question, QuestionScore } from "@/config/questions";
import { sections, gradeSection } from "@/config/questions";
import type { Progress } from "@/lib/progress";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";

interface Props {
  progress: Progress;
}

/**
 * Hidden, print-optimized report. Rasterized to PDF.
 * Uses high-contrast colors on a dark surface so html2canvas
 * preserves Arabic shaping with full diacritic clarity.
 */
export const PrintableReport = forwardRef<HTMLDivElement, Props>(({ progress }, ref) => {
  const graded = sections.filter((s) => s.graded);
  const results = graded.map((s) => ({
    section: s,
    ...gradeSection(s, progress.answers[s.id] || {}),
  }));
  const totalEarned = results.reduce((a, b) => a + b.earned, 0);
  const totalMax = results.reduce((a, b) => a + b.max, 0);
  const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;

  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      style={{
        position: "absolute",
        top: 0,
        right: "-100000px",
        width: "794px", // ~A4 @ 96dpi
        background: "#0f1226",
        color: "#f5f7fb",
        fontFamily:
          "'Cairo','Tajawal','Amiri','Noto Naskh Arabic','Arial',sans-serif",
        padding: "32px",
        lineHeight: 1.7,
      }}
    >
      {/* HEADER */}
      <div style={{ borderBottom: "2px solid #d4af37", paddingBottom: "16px", marginBottom: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#d4af37", fontSize: "26px", fontWeight: 800 }}>{lessonTitle}</div>
          <div style={{ color: "#a3b0c2", fontSize: "13px", marginTop: 4 }}>{lessonAuthor}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px", fontSize: "14px" }}>
          <Field label="اسم التّلميذ" value={progress.studentName || "—"} />
          <Field label="الصّفّ / الشّعبة" value={progress.studentClass || "—"} />
          <Field label="عنوان النّصّ" value={lessonTitle} />
          <Field label="التّاريخ" value={new Date().toLocaleDateString("ar")} />
        </div>
      </div>

      {/* SUMMARY */}
      <div
        style={{
          background: "#1a1f3a",
          border: "1px solid #2c3458",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "13px", color: "#a3b0c2" }}>العلامة النّهائيّة</div>
        <div style={{ fontSize: "32px", fontWeight: 800, color: "#d4af37", marginTop: "6px" }}>
          {Math.round(totalEarned * 10) / 10} / {totalMax}
        </div>
        <div style={{ fontSize: "18px", color: "#5eead4", marginTop: "4px" }}>{pct}%</div>
        <div style={{ fontSize: "11px", color: "#d4af37", marginTop: "10px" }}>
          ملاحظة: التّعبير والبحث لا يشملهما التّقييم.
        </div>
      </div>

      {/* PER-SECTION SCORE BREAKDOWN */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
        {results.map((r) => (
          <div
            key={r.section.id}
            style={{
              background: "#1a1f3a",
              border: "1px solid #2c3458",
              borderRadius: "10px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "#a3b0c2" }}>{r.section.title}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#5eead4", marginTop: "4px" }}>
              {Math.round(r.earned * 10) / 10} / {r.max}
            </div>
          </div>
        ))}
      </div>

      {/* PER-SECTION DETAIL */}
      {results.map((r) => (
        <div key={r.section.id} style={{ marginBottom: "28px" }}>
          <div
            style={{
              background: "#d4af37",
              color: "#0f1226",
              padding: "8px 14px",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "16px",
              marginBottom: "12px",
            }}
          >
            {r.section.title}
          </div>
          {r.section.questions.map((q, idx) => (
            <QuestionReport
              key={q.id}
              q={q}
              index={idx + 1}
              given={progress.answers[r.section.id]?.[q.id]}
              score={r.perQuestion.find((p) => p.questionId === q.id)}
            />
          ))}
        </div>
      ))}

      {/* EXPRESSION / RESEARCH (UNGRADED) */}
      {(progress.expressionText || progress.researchText) && (
        <div style={{ marginTop: "20px", borderTop: "1px solid #2c3458", paddingTop: "16px" }}>
          <div style={{ color: "#d4af37", fontWeight: 800, fontSize: "15px", marginBottom: "10px" }}>
            إجابات غير محتسبة
          </div>
          {progress.expressionText && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ color: "#5eead4", fontWeight: 700, marginBottom: "4px" }}>في التّعبير:</div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: "13px" }}>{progress.expressionText}</div>
            </div>
          )}
          {progress.researchText && (
            <div>
              <div style={{ color: "#5eead4", fontWeight: 700, marginBottom: "4px" }}>في البحث:</div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: "13px" }}>{progress.researchText}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", color: "#a3b0c2", fontSize: "11px", marginTop: "24px" }}>
        تَسَلَّ وتَعَلَّمْ — في ملعب كرة السّلّة
      </div>
    </div>
  );
});

PrintableReport.displayName = "PrintableReport";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#1a1f3a", borderRadius: "8px", padding: "8px 12px" }}>
      <div style={{ color: "#a3b0c2", fontSize: "11px" }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: "2px" }}>{value}</div>
    </div>
  );
}

function formatGiven(q: Question, given: any): string {
  if (given == null || given === "") return "— لم يُجَب —";
  if (q.type === "single") {
    const opt = q.options?.find((o) => o.id === given);
    return opt?.label || String(given);
  }
  if (q.type === "multi") {
    const arr: string[] = Array.isArray(given) ? given : [];
    if (arr.length === 0) return "— لم يُجَب —";
    return arr
      .map((id) => q.options?.find((o) => o.id === id)?.label || id)
      .join(" • ");
  }
  if (q.type === "subgroup") {
    const parts: string[] = [];
    for (const sub of q.subs!) {
      const v = given[sub.id];
      if (v == null) {
        parts.push(`${sub.prompt} — لم يُجَب —`);
      } else if (Array.isArray(v)) {
        const labels = v.map((id) => sub.options.find((o) => o.id === id)?.label || id).join(" • ");
        parts.push(`${sub.prompt} ${labels || "— لم يُجَب —"}`);
      } else {
        const opt = sub.options.find((o) => o.id === v);
        parts.push(`${sub.prompt} ${opt?.label || v}`);
      }
    }
    return parts.join(" | ");
  }
  if (q.type === "tokenCorrection") {
    return q.tokens!.map((t) => `${t.label}: ${given[t.id] || "—"}`).join(" | ");
  }
  if (q.type === "tableFill") {
    const out: string[] = [];
    for (const row of q.tableRows!) {
      for (const cell of row.cells) {
        if (cell.given) continue;
        out.push(`${row.label}/${cell.col}: ${given[row.id]?.[cell.col] || "—"}`);
      }
    }
    return out.join(" | ");
  }
  if (q.type === "freeText" || q.type === "longText") {
    return String(given);
  }
  return String(given);
}

function formatExpected(q: Question): string {
  if (q.type === "single") {
    return q.options?.find((o) => o.correct)?.label || "—";
  }
  if (q.type === "multi") {
    return q.options!.filter((o) => o.correct).map((o) => o.label).join(" • ");
  }
  if (q.type === "subgroup") {
    const parts: string[] = [];
    for (const sub of q.subs!) {
      if (sub.type === "multi") {
        const lbl = sub.options.filter((o) => o.correct).map((o) => o.label).join(" • ");
        parts.push(`${sub.prompt} ${lbl}`);
      } else {
        const lbl = sub.options.find((o) => o.correct)?.label || "—";
        parts.push(`${sub.prompt} ${lbl}`);
      }
    }
    return parts.join(" | ");
  }
  if (q.type === "tokenCorrection") {
    return q.tokens!.map((t) => `${t.label}: ${t.expected}`).join(" | ");
  }
  if (q.type === "tableFill") {
    const out: string[] = [];
    for (const row of q.tableRows!) {
      for (const cell of row.cells) {
        if (cell.given) continue;
        out.push(`${row.label}/${cell.col}: ${cell.expected}`);
      }
    }
    return out.join(" | ");
  }
  if (q.type === "freeText") return q.expected || "—";
  return "—";
}

function QuestionReport({
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
  const fullCorrect = max > 0 && earned === max;
  const noneCorrect = earned === 0;
  const resultLabel = fullCorrect ? "✔ صحيح" : noneCorrect ? "✘ خطأ" : "◐ صحيح جزئيًّا";
  const resultColor = fullCorrect ? "#22c55e" : noneCorrect ? "#ef4444" : "#f59e0b";

  return (
    <div
      style={{
        background: "#161b33",
        border: `1px solid ${resultColor}40`,
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "10px",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
        <div style={{ fontWeight: 700, color: "#f5f7fb", flex: 1 }}>
          <span style={{ color: "#5eead4" }}>سؤال {index}.</span> {q.prompt}
        </div>
        <div style={{ background: resultColor, color: "#0f1226", padding: "2px 10px", borderRadius: "999px", fontWeight: 800, whiteSpace: "nowrap", fontSize: "12px" }}>
          {Math.round(earned * 10) / 10} / {max}
        </div>
      </div>
      {q.context && (
        <div style={{ background: "#0f1226", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", color: "#a3b0c2", marginBottom: "8px" }}>
          {q.context}
        </div>
      )}
      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#a3b0c2" }}>إجابة التّلميذ: </span>
        <span style={{ color: noneCorrect ? "#fca5a5" : "#f5f7fb" }}>{formatGiven(q, given)}</span>
      </div>
      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#a3b0c2" }}>الإجابة الصّحيحة: </span>
        <span style={{ color: "#86efac" }}>{formatExpected(q)}</span>
      </div>
      <div style={{ color: resultColor, fontWeight: 700 }}>
        النّتيجة: {resultLabel}
      </div>
    </div>
  );
}
