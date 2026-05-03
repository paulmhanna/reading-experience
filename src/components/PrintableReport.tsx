import { forwardRef } from "react";
import type { Section, Question } from "@/config/questions";
import { gradeSection } from "@/config/questions";
import { resolveAnswer, type ResolvedAnswerLine } from "@/lib/answerResolver";
import { lessonAuthor, lessonTitle } from "@/config/lessonText";
import { Check, X, Trophy } from "lucide-react";

export interface PrintableReportProps {
  studentName: string;
  studentClass: string;
  sessionId: string;
  sections: Section[];
  answers: Record<string, Record<string, any>>;
  expressionText?: string;
  researchText?: string;
}

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
      <div ref={ref} dir="rtl" className="pdf-page">
        <div className="pdf-cover avoid-break">
          <div style={{ textAlign: "center" }}>
            <Trophy size={44} color="#facc15" />
            <h1 className="pdf-title" style={{ color: "#facc15" }}>
              {lessonTitle}
            </h1>
            <div className="pdf-subtitle">{lessonAuthor}</div>
          </div>

          <div className="field-grid">
            <Field label="اسم التّلميذ" value={studentName || "—"} dark />
            <Field label="الصّفّ / الشّعبة" value={studentClass || "—"} dark />
            <Field
              label="التّاريخ"
              value={new Date().toLocaleDateString("ar")}
              dark
            />
            <Field
              label="رقم الجلسة"
              value={sessionId?.slice(0, 8) || "—"}
              dark
            />
          </div>
        </div>

        <div className="score-grid">
          {results.map((r) => (
            <ScoreCard
              key={r.section.id}
              title={r.section.title}
              earned={r.earned}
              max={r.max}
            />
          ))}
        </div>

        <div className="final-score avoid-break">
          <div className="muted" style={{ fontSize: 14 }}>
            العلامة النّهائيّة
          </div>

          <div
            className="gold-text"
            style={{ fontSize: 46, fontWeight: 900, marginTop: 6 }}
          >
            {Math.round(totalEarned * 10) / 10} / {totalMax}
          </div>

          <div
            className="electric-text"
            style={{ fontSize: 23, fontWeight: 800 }}
          >
            {pct}%
          </div>

          <div className="gold-text" style={{ fontSize: 12, marginTop: 8 }}>
            التَّعبير والبَحث لا يشملهما التّقييم.
          </div>
        </div>

        {results.map((r) => (
          <div key={r.section.id} className="pdf-section-card">
            <h2 className="section-title">تصحيح: {r.section.title}</h2>

            {r.section.questions.map((q, idx) => {
              const score = r.perQuestion.find((p) => p.questionId === q.id);
              const earned = score?.earned ?? 0;
              const max = score?.max ?? 0;
              const studentAnswer = answers[r.section.id]?.[q.id];
              const lines = resolveAnswer(q, studentAnswer);

              return (
                <QuestionItem
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

        {/* Ungraded written answers — always shown */}
        <div className="pdf-section-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              borderBottom: "2px solid #fde68a",
              paddingBottom: 8,
              marginBottom: 14,
            }}
          >
            <h2
              className="section-title"
              style={{
                color: "#d97706",
                borderBottom: "none",
                paddingBottom: 0,
                marginBottom: 0,
              }}
            >
              إجابات غير محتسبة
            </h2>

            <span className="badge badge-partial">لا تدخل في العلامة</span>
          </div>

          <div className="pdf-question-card">
            <div
              className="electric-text"
              style={{ fontWeight: 800, marginBottom: 8 }}
            >
              في التَّعبيرِ
            </div>

            <p style={{ whiteSpace: "pre-wrap", lineHeight: 2 }}>
              {expressionText?.trim() || "— لم يُجِب —"}
            </p>
          </div>

          <div className="pdf-question-card">
            <div
              className="electric-text"
              style={{ fontWeight: 800, marginBottom: 8 }}
            >
              في البَحثِ
            </div>

            <p style={{ whiteSpace: "pre-wrap", lineHeight: 2 }}>
              {researchText?.trim() || "— لم يُجِب —"}
            </p>
          </div>
        </div>

        <div className="footer-note">التَّعبير والبَحث لا يشملهما التّقييم</div>
      </div>
    );
  }
);

function Field({
                 label,
                 value,
                 dark = false,
               }: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={dark ? "field" : "field-light"}
      style={{ textAlign: "right" }}
    >
      <div style={{ fontSize: 12, color: dark ? "#cbd5e1" : "#64748b" }}>
        {label}
      </div>

      <div
        style={{
          fontWeight: 800,
          marginTop: 4,
          color: dark ? "#ffffff" : "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({
                     title,
                     earned,
                     max,
                   }: {
  title: string;
  earned: number;
  max: number;
}) {
  const pct = max ? Math.round((earned / max) * 100) : 0;

  return (
    <div className="score-card">
      <div className="muted" style={{ fontSize: 14 }}>
        {title}
      </div>

      <div
        className="electric-text"
        style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}
      >
        {Math.round(earned * 10) / 10} / {max}
      </div>

      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>

      <div className="gold-text" style={{ fontSize: 12, marginTop: 6 }}>
        {pct}%
      </div>
    </div>
  );
}

function QuestionItem({
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
  lines: ResolvedAnswerLine[];
}) {
  return (
    <div className="pdf-question-card">
      <div className="question-header">
        <h3 className="question-title">
          <span className="electric-text">سؤال {index}.</span> {q.prompt}
        </h3>

        {max > 0 && (
          <span className="badge">
            العلامة: {Math.round(earned * 10) / 10} / {max}
          </span>
        )}
      </div>

      {q.context && <div className="context-box">{q.context}</div>}

      <div>
        {lines.map((line, i) => (
          <AnswerLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

function AnswerLine({ line }: { line: ResolvedAnswerLine }) {
  const ok = line.ok;
  const isOk = ok === true;
  const isWrong = ok === false;
  const isPartial = ok === "partial";
  const isUngraded = ok === "ungraded";

  return (
    <div className={`answer-line ${isOk ? "ok" : isWrong ? "wrong" : ""}`}>
      {line.label && (
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
          {line.label}
        </div>
      )}

      <div className="answer-grid">
        <div>
          <div className="answer-label">إجابة التّلميذ</div>
          <div className={isWrong ? "answer-value destructive" : "answer-value"}>
            {line.given}
          </div>
        </div>

        <div>
          <div className="answer-label">الإجابة الصّحيحة</div>
          <div className="answer-value success">{line.correct || "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 9 }}>
        {isOk && (
          <span className="badge badge-success">
            <Check size={13} /> صحيح
          </span>
        )}

        {isWrong && (
          <span className="badge badge-wrong">
            <X size={13} /> خطأ
          </span>
        )}

        {isPartial && <span className="badge badge-partial">تصحيح جزئيّ</span>}

        {isUngraded && <span className="badge">غير محتسب</span>}
      </div>
    </div>
  );
}