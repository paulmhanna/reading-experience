// PDF-safe printable report. Uses ONLY hex colors and plain CSS.
// No oklab/oklch/color-mix/CSS variables/gradients/shadows/backdrop-filter.
import { forwardRef } from "react";
import type { Section, Question } from "@/config/questions";
import { gradeSection } from "@/config/questions";
import { resolveAnswer } from "@/lib/answerResolver";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";

export interface PrintableReportProps {
  studentName: string;
  studentClass: string;
  sessionId: string;
  sections: Section[];
  answers: Record<string, Record<string, any>>;
  expressionText?: string;
  researchText?: string;
}

const COLORS = {
  bg: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  panel: "#f9fafb",
  correct: "#16a34a",
  wrong: "#dc2626",
  partial: "#f59e0b",
  accent: "#0f172a",
};

const baseFont =
  '"Cairo","Tajawal","Amiri","Segoe UI",sans-serif';

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport(props, ref) {
    const {
      studentName,
      studentClass,
      sessionId,
      sections,
      answers,
      expressionText,
      researchText,
    } = props;

    const graded = sections.filter((s) => s.graded);
    const results = graded.map((s) => ({
      section: s,
      ...gradeSection(s, answers[s.id] || {}),
    }));
    const totalEarned = results.reduce((a, b) => a + b.earned, 0);
    const totalMax = results.reduce((a, b) => a + b.max, 0);
    const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;

    return (
      <div
        ref={ref}
        dir="rtl"
        className="pdf-safe-report"
        style={{
          width: 794, // ~ A4 @ 96dpi
          padding: 32,
          background: COLORS.bg,
          color: COLORS.text,
          fontFamily: baseFont,
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            borderBottom: `2px solid ${COLORS.border}`,
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              color: COLORS.accent,
            }}
          >
            {lessonTitle}
          </h1>
          <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
            {lessonAuthor}
          </div>
        </div>

        {/* Student info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Field label="اسم التّلميذ" value={studentName || "—"} />
          <Field label="الصّفّ / الشّعبة" value={studentClass || "—"} />
          <Field label="التّاريخ" value={new Date().toLocaleDateString("ar")} />
          <Field label="رقم الجلسة" value={sessionId.slice(0, 8)} />
        </div>

        {/* Score summary */}
        <div
          style={{
            border: `2px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
            marginBottom: 24,
            background: COLORS.panel,
          }}
        >
          <div style={{ color: COLORS.muted, fontSize: 13 }}>
            العلامة النّهائيّة
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: COLORS.accent,
              marginTop: 6,
            }}
          >
            {Math.round(totalEarned * 10) / 10} / {totalMax}
          </div>
          <div style={{ fontSize: 16, color: COLORS.correct, marginTop: 4 }}>
            {pct}%
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {results.map((r) => (
              <div
                key={r.section.id}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  background: COLORS.bg,
                }}
              >
                <span style={{ color: COLORS.muted }}>{r.section.title}: </span>
                <strong style={{ color: COLORS.accent }}>
                  {Math.round(r.earned * 10) / 10}/{r.max}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed corrections */}
        {results.map((r) => (
          <div key={r.section.id} style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.accent,
                borderBottom: `1px solid ${COLORS.border}`,
                paddingBottom: 6,
                marginBottom: 12,
              }}
            >
              تصحيح: {r.section.title}
            </h2>
            {r.section.questions.map((q, idx) => {
              const score = r.perQuestion.find((p) => p.questionId === q.id);
              const lines = resolveAnswer(q, answers[r.section.id]?.[q.id]);
              const earned = score?.earned ?? 0;
              const max = score?.max ?? 0;
              return (
                <QuestionBlock
                  key={q.id}
                  index={idx + 1}
                  q={q}
                  earned={earned}
                  max={max}
                  lines={lines}
                />
              );
            })}
          </div>
        ))}

        {(expressionText || researchText) && (
          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: 16,
              marginTop: 16,
              background: COLORS.panel,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.accent,
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              إجابات غير محتسبة
            </h2>
            {expressionText && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.accent }}>
                  في التّعبير:
                </div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", color: COLORS.text }}>
                  {expressionText}
                </p>
              </div>
            )}
            {researchText && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.accent }}>
                  في البحث:
                </div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", color: COLORS.text }}>
                  {researchText}
                </p>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTop: `1px solid ${COLORS.border}`,
            textAlign: "center",
            color: COLORS.muted,
            fontSize: 11,
          }}
        >
          تقرير مُولَّد آليًّا — {new Date().toLocaleString("ar")}
        </div>
      </div>
    );
  }
);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        background: COLORS.panel,
      }}
    >
      <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
      <div style={{ fontWeight: 700, color: COLORS.text, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function QuestionBlock({
  index,
  q,
  earned,
  max,
  lines,
}: {
  index: number;
  q: Question;
  earned: number;
  max: number;
  lines: ReturnType<typeof resolveAnswer>;
}) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        background: COLORS.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            color: COLORS.text,
            flex: 1,
          }}
        >
          <span style={{ color: COLORS.accent }}>سؤال {index}.</span> {q.prompt}
        </h3>
        {max > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
              whiteSpace: "nowrap",
            }}
          >
            العلامة: {Math.round(earned * 10) / 10} / {max}
          </span>
        )}
      </div>
      {q.context && (
        <div
          style={{
            background: COLORS.panel,
            borderRight: `4px solid ${COLORS.accent}`,
            padding: 10,
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 10,
            color: COLORS.text,
          }}
        >
          {q.context}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((line, i) => (
          <AnswerLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

function AnswerLine({ line }: { line: ReturnType<typeof resolveAnswer>[number] }) {
  const ok = line.ok;
  const isOk = ok === true;
  const isWrong = ok === false;
  const isPartial = ok === "partial";
  const isUngraded = ok === "ungraded";

  const borderColor = isOk
    ? COLORS.correct
    : isWrong
    ? COLORS.wrong
    : isPartial
    ? COLORS.partial
    : COLORS.border;

  return (
    <div
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        padding: 10,
        background: COLORS.bg,
      }}
    >
      {line.label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
          {line.label}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          fontSize: 13,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>
            إجابة التّلميذ
          </div>
          <div
            style={{
              fontWeight: 700,
              color: isWrong ? COLORS.wrong : COLORS.text,
            }}
          >
            {line.given}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>
            الإجابة الصّحيحة
          </div>
          <div style={{ fontWeight: 700, color: COLORS.correct }}>
            {line.correct || "—"}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700 }}>
        {isOk && <span style={{ color: COLORS.correct }}>✓ صحيح</span>}
        {isWrong && <span style={{ color: COLORS.wrong }}>✗ خطأ</span>}
        {isPartial && <span style={{ color: COLORS.partial }}>تصحيح جزئيّ</span>}
        {isUngraded && <span style={{ color: COLORS.muted }}>غير محتسب</span>}
      </div>
    </div>
  );
}
