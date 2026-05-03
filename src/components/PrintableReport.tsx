// Clean print-friendly PDF report. Document layout (NOT a UI clone).
// Table-based, scannable, hex colors only. No Tailwind, no CSS variables.
import { forwardRef } from "react";
import type { Section, Question } from "@/config/questions";
import { gradeSection } from "@/config/questions";
import { resolveAnswer, type ResolvedAnswerLine } from "@/lib/answerResolver";

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
  muted: "#555555",
  line: "#bbbbbb",
  lineSoft: "#dddddd",
  ok: "#16a34a",
  bad: "#dc2626",
  partial: "#b45309",
  boxBg: "#f8fafc",
  boxBorder: "#0f172a",
  thBg: "#eef2f7",
};

const baseFont =
  '"Noto Naskh Arabic","Amiri","Cairo","Tajawal","Segoe UI",sans-serif';

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport(props, ref) {
    const {
      studentName,
      studentClass,
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
          padding: 40,
          background: "#ffffff",
          color: C.text,
          fontFamily: baseFont,
          fontSize: 14,
          lineHeight: 1.55,
          textAlign: "right",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
            marginBottom: 18,
            textAlign: "center",
            color: C.text,
            letterSpacing: 0,
          }}
        >
          تقرير التّقييم
        </h1>

        {/* Student info grid */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "2px 0", width: "33%" }}>
                <strong>اسم التّلميذ: </strong>
                {studentName || "—"}
              </td>
              <td style={{ padding: "2px 0", width: "33%" }}>
                <strong>الصّفّ: </strong>
                {studentClass || "—"}
              </td>
              <td style={{ padding: "2px 0", width: "33%" }}>
                <strong>التّاريخ: </strong>
                {new Date().toLocaleDateString("ar")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summary box */}
        <div
          style={{
            border: `2px solid ${C.boxBorder}`,
            background: C.boxBg,
            padding: "14px 18px",
            marginBottom: 22,
            borderRadius: 4,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            العلامة النّهائيّة: {Math.round(totalEarned * 10) / 10} / {totalMax}
            <span style={{ marginInlineStart: 16, fontWeight: 700 }}>
              النّسبة: {pct}%
            </span>
          </div>
          <div
            style={{
              borderTop: `1px solid ${C.lineSoft}`,
              marginTop: 8,
              paddingTop: 8,
              fontSize: 14,
            }}
          >
            {results.map((r) => (
              <div key={r.section.id} style={{ marginBottom: 2 }}>
                <strong>{r.section.title}: </strong>
                {Math.round(r.earned * 10) / 10} / {r.max}
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {results.map((r) => (
          <div
            key={r.section.id}
            style={{ marginTop: 18, pageBreakInside: "avoid" }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
                marginBottom: 10,
                padding: "6px 10px",
                background: C.thBg,
                borderInlineStart: `4px solid ${C.boxBorder}`,
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
          <div style={{ marginTop: 22 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
                marginBottom: 10,
                padding: "6px 10px",
                background: C.thBg,
                borderInlineStart: `4px solid ${C.boxBorder}`,
              }}
            >
              إجابات غير محتسبة
            </h2>
            {expressionText && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>في التّعبير:</div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{expressionText}</p>
              </div>
            )}
            {researchText && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>في البحث:</div>
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

function Mark({ ok }: { ok: ResolvedAnswerLine["ok"] }) {
  if (ok === true) return <span style={{ color: C.ok, fontWeight: 800 }}>✔</span>;
  if (ok === false) return <span style={{ color: C.bad, fontWeight: 800 }}>✘</span>;
  if (ok === "partial")
    return <span style={{ color: C.partial, fontWeight: 700 }}>جزئي</span>;
  return <span style={{ color: C.muted }}>—</span>;
}

const cellBase: React.CSSProperties = {
  border: `1px solid ${C.line}`,
  padding: "6px 10px",
  textAlign: "right",
  fontSize: 14,
  verticalAlign: "middle",
};
const headBase: React.CSSProperties = {
  ...cellBase,
  background: C.thBg,
  fontWeight: 700,
  textAlign: "center",
};

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
  const isMultiPart =
    isHaraka ||
    q.type === "subgroup" ||
    q.type === "tokenCorrection" ||
    q.type === "tableFill" ||
    (q.type === "correctedWords");

  return (
    <div style={{ marginBottom: 14, pageBreakInside: "avoid" }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        سؤال {index}: {q.prompt}
      </div>
      {q.context && (
        <div style={{ marginBottom: 6, fontSize: 13, color: C.muted }}>
          {q.context}
        </div>
      )}

      {isHaraka ? (
        <HarakaTable q={q} studentAnswer={studentAnswer} />
      ) : isMultiPart ? (
        <AnswerTable lines={lines} />
      ) : (
        <CompactAnswer line={lines[0]} />
      )}

      {max > 0 && (
        <div style={{ marginTop: 4, fontWeight: 700, fontSize: 14 }}>
          العلامة: {Math.round(earned * 10) / 10} / {max}
        </div>
      )}
    </div>
  );
}

function CompactAnswer({ line }: { line?: ResolvedAnswerLine }) {
  if (!line) return null;
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <div>
        <strong>إجابة التّلميذ: </strong>
        <span style={{ color: line.ok === false ? C.bad : C.text }}>
          {line.given}
        </span>
      </div>
      <div>
        <strong>الإجابة الصّحيحة: </strong>
        <span style={{ color: C.ok }}>{line.correct || "—"}</span>
      </div>
      <div>
        <strong>النّتيجة: </strong>
        <Mark ok={line.ok} />
      </div>
    </div>
  );
}

function AnswerTable({ lines }: { lines: ResolvedAnswerLine[] }) {
  if (!lines.length) return null;
  const hasLabels = lines.some((l) => l.label);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
      <thead>
        <tr>
          {hasLabels && <th style={{ ...headBase, width: "28%" }}>البند</th>}
          <th style={headBase}>إجابة التّلميذ</th>
          <th style={headBase}>الصّحيحة</th>
          <th style={{ ...headBase, width: 70 }}>النّتيجة</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l, i) => (
          <tr key={i}>
            {hasLabels && (
              <td style={{ ...cellBase, fontWeight: 700 }}>{l.label || "—"}</td>
            )}
            <td
              style={{
                ...cellBase,
                color: l.ok === false ? C.bad : C.text,
              }}
            >
              {l.given}
            </td>
            <td style={{ ...cellBase, color: C.ok }}>{l.correct || "—"}</td>
            <td style={{ ...cellBase, textAlign: "center" }}>
              <Mark ok={l.ok} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HarakaTable({ q, studentAnswer }: { q: Question; studentAnswer: any }) {
  const tokens = q.tokens || [];
  const given = (studentAnswer && typeof studentAnswer === "object"
    ? studentAnswer
    : {}) as Record<string, string>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
      <thead>
        <tr>
          <th style={headBase}>الكلمة</th>
          <th style={headBase}>إجابة التّلميذ</th>
          <th style={headBase}>الصّحيحة</th>
          <th style={{ ...headBase, width: 70 }}>النّتيجة</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => {
          const g = (given[t.id] || "").trim();
          const expected = t.targetHaraka || "";
          const ok = !!g && !!expected && g === expected;
          return (
            <tr key={t.id}>
              <td style={{ ...cellBase, textAlign: "center", fontWeight: 700 }}>
                {t.label}
              </td>
              <td
                style={{
                  ...cellBase,
                  textAlign: "center",
                  fontSize: 20,
                  color: ok ? C.text : C.bad,
                }}
              >
                {g || "—"}
              </td>
              <td
                style={{
                  ...cellBase,
                  textAlign: "center",
                  fontSize: 20,
                  color: C.ok,
                }}
              >
                {expected || "—"}
              </td>
              <td style={{ ...cellBase, textAlign: "center" }}>
                <Mark ok={ok ? true : false} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
