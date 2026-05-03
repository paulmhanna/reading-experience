// Clean print-friendly PDF report. Plain document layout (NOT a UI clone).
// Hex colors only. No gradients, shadows, cards, Tailwind, or CSS variables.
import { forwardRef } from "react";
import type { Section, Question } from "@/config/questions";
import { gradeSection } from "@/config/questions";
import { resolveAnswer } from "@/lib/answerResolver";

export interface PrintableReportProps {
  studentName: string;
  studentClass: string;
  sessionId: string;
  sections: Section[];
  answers: Record<string, Record<string, any>>;
  expressionText?: string;
  researchText?: string;
}

const C = {
  text: "#000000",
  muted: "#444444",
  line: "#cccccc",
  ok: "#16a34a",
  bad: "#dc2626",
  partial: "#b45309",
};

const baseFont = '"Cairo","Tajawal","Amiri","Segoe UI",sans-serif';

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport(props, ref) {
    const {
      studentName,
      studentClass,
      sessionId: _sessionId,
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
        style={{
          width: 794,
          padding: 36,
          background: "#ffffff",
          color: C.text,
          fontFamily: baseFont,
          fontSize: 14,
          lineHeight: 1.7,
          textAlign: "right",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: 0,
            marginBottom: 16,
            textAlign: "center",
            color: C.text,
          }}
        >
          تقرير التّقييم
        </h1>

        {/* Student info */}
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>اسم التّلميذ: </strong>
            {studentName || "—"}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>الصّفّ: </strong>
            {studentClass || "—"}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>التّاريخ: </strong>
            {new Date().toLocaleDateString("ar")}
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: 20, fontSize: 14 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>العلامة النّهائيّة: </strong>
            {Math.round(totalEarned * 10) / 10} / {totalMax}
          </div>
          <div style={{ marginBottom: 10 }}>
            <strong>النّسبة: </strong>
            {pct}%
          </div>
          {results.map((r) => (
            <div key={r.section.id} style={{ marginBottom: 4 }}>
              <strong>{r.section.title}: </strong>
              {Math.round(r.earned * 10) / 10} / {r.max}
            </div>
          ))}
        </div>

        {/* Sections */}
        {results.map((r) => (
          <div key={r.section.id} style={{ marginTop: 20, marginBottom: 12 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                marginBottom: 12,
                paddingBottom: 4,
                borderBottom: `1px solid ${C.line}`,
                color: C.text,
              }}
            >
              {r.section.title}
            </h2>
            {r.section.questions.map((q, idx) => {
              const score = r.perQuestion.find((p) => p.questionId === q.id);
              const earned = score?.earned ?? 0;
              const max = score?.max ?? 0;
              const studentAnswer = answers[r.section.id]?.[q.id];
              return (
                <QuestionItem
                  key={q.id}
                  index={idx + 1}
                  q={q}
                  earned={earned}
                  max={max}
                  studentAnswer={studentAnswer}
                />
              );
            })}
          </div>
        ))}

        {(expressionText || researchText) && (
          <div style={{ marginTop: 20 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                marginBottom: 12,
                paddingBottom: 4,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              إجابات غير محتسبة
            </h2>
            {expressionText && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>في التّعبير:</div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{expressionText}</p>
              </div>
            )}
            {researchText && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>في البحث:</div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{researchText}</p>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            paddingTop: 10,
            borderTop: `1px solid ${C.line}`,
            textAlign: "center",
            color: C.muted,
            fontSize: 12,
          }}
        >
          التّعبير والبحث لا يشملهما التّقييم
        </div>
      </div>
    );
  }
);

function ResultMark({ ok }: { ok: true | false | "partial" | "ungraded" }) {
  if (ok === true) return <span style={{ color: C.ok, fontWeight: 700 }}>✔</span>;
  if (ok === false) return <span style={{ color: C.bad, fontWeight: 700 }}>✘</span>;
  if (ok === "partial")
    return <span style={{ color: C.partial, fontWeight: 700 }}>جزئي</span>;
  return <span style={{ color: C.muted }}>—</span>;
}

function QuestionItem({
  index,
  q,
  earned,
  max,
  studentAnswer,
}: {
  index: number;
  q: Question;
  earned: number;
  max: number;
  studentAnswer: any;
}) {
  const isHaraka = q.type === "finalHarakaTokens";
  const lines = resolveAnswer(q, studentAnswer);

  return (
    <div style={{ marginBottom: 18, fontSize: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
        سؤال {index}: {q.prompt}
      </div>
      {q.context && (
        <div style={{ marginBottom: 8, fontSize: 13, color: C.muted }}>{q.context}</div>
      )}

      {isHaraka ? (
        <HarakaTable q={q} studentAnswer={studentAnswer} />
      ) : (
        <div>
          {lines.map((line, i) => {
            const ok = line.ok;
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                {line.label && (
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{line.label}</div>
                )}
                <div style={{ marginBottom: 2 }}>
                  <strong>إجابة التّلميذ: </strong>
                  <span style={{ color: ok === false ? C.bad : C.text }}>
                    {line.given}
                  </span>
                </div>
                <div style={{ marginBottom: 2 }}>
                  <strong>الإجابة الصّحيحة: </strong>
                  <span style={{ color: C.ok }}>{line.correct || "—"}</span>
                </div>
                <div>
                  <strong>النّتيجة: </strong>
                  <ResultMark ok={ok} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {max > 0 && (
        <div style={{ marginTop: 6, fontWeight: 700 }}>
          العلامة: {Math.round(earned * 10) / 10} / {max}
        </div>
      )}
    </div>
  );
}

function HarakaTable({ q, studentAnswer }: { q: Question; studentAnswer: any }) {
  const tokens = q.tokens || [];
  const given = (studentAnswer && typeof studentAnswer === "object" ? studentAnswer : {}) as Record<string, string>;

  const cell: React.CSSProperties = {
    border: `1px solid ${C.line}`,
    padding: "6px 10px",
    textAlign: "center",
    fontSize: 14,
  };
  const head: React.CSSProperties = {
    ...cell,
    fontWeight: 700,
    background: "#f3f4f6",
  };

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 6,
        marginBottom: 6,
        fontFamily: baseFont,
      }}
    >
      <thead>
        <tr>
          <th style={head}>الكلمة</th>
          <th style={head}>إجابة التّلميذ</th>
          <th style={head}>الصّحيحة</th>
          <th style={head}>النّتيجة</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => {
          const g = (given[t.id] || "").trim();
          const expected = t.targetHaraka || "";
          const ok = g && expected ? g === expected : false;
          return (
            <tr key={t.id}>
              <td style={cell}>{t.label}</td>
              <td style={{ ...cell, color: ok ? C.text : C.bad, fontSize: 18 }}>
                {g || "—"}
              </td>
              <td style={{ ...cell, color: C.ok, fontSize: 18 }}>{expected || "—"}</td>
              <td style={cell}>
                <ResultMark ok={ok ? true : false} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
