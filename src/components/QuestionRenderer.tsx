import { useState } from "react";
import type { Question, Section } from "@/config/questions";

interface Props {
  section: Section;
  answers: Record<string, any>;
  onChange: (qId: string, value: any) => void;
  showCorrection?: boolean;
  perQuestion?: { questionId: string; earned: number; max: number; detail?: any }[];
}

export function QuestionRenderer({ section, answers, onChange, showCorrection, perQuestion }: Props) {
  return (
    <div className="space-y-6">
      {section.questions.map((q, idx) => (
        <QuestionBlock
          key={q.id}
          q={q}
          index={idx + 1}
          value={answers[q.id]}
          onChange={(v) => onChange(q.id, v)}
          showCorrection={showCorrection}
          score={perQuestion?.find((p) => p.questionId === q.id)}
        />
      ))}
    </div>
  );
}

function QuestionBlock({
  q,
  index,
  value,
  onChange,
  showCorrection,
  score,
}: {
  q: Question;
  index: number;
  value: any;
  onChange: (v: any) => void;
  showCorrection?: boolean;
  score?: { earned: number; max: number; detail?: any };
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-arabic-lg font-bold text-foreground/95">
          <span className="electric-text">سؤال {index}.</span> {q.prompt}
        </h3>
        {showCorrection && score && score.max > 0 && (
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-secondary/60 whitespace-nowrap">
            {score.earned} / {score.max}
          </span>
        )}
      </div>
      {q.context && (
        <div className="mb-4 p-4 rounded-xl bg-secondary/40 text-arabic-lg leading-loose border-r-4 border-accent">
          {q.context}
        </div>
      )}

      {q.type === "single" && <SingleChoice q={q} value={value} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "multi" && <MultiChoice q={q} value={value || []} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "subgroup" && <Subgroup q={q} value={value || {}} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "tokenCorrection" && <TokenCorrection q={q} value={value || {}} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "finalHarakaTokens" && <FinalHarakaTokens q={q} value={value || {}} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "tableFill" && <TableFill q={q} value={value || {}} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "freeText" && <FreeText q={q} value={value || ""} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "correctedWords" && <FreeText q={q} value={value || ""} onChange={onChange} showCorrection={showCorrection} />}
      {q.type === "longText" && (
        <div>
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            className="w-full p-4 rounded-xl bg-input/60 border border-border text-arabic-lg leading-loose focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="اكتب إجابتك هنا..."
          />
          <p className="text-xs text-accent/80 mt-2">هذا القسم غير محتسب في العلامة.</p>
        </div>
      )}
    </div>
  );
}

function optionClass(selected: boolean, correct?: boolean, show?: boolean) {
  if (show) {
    if (correct) return "border-success bg-success/15";
    if (selected && !correct) return "border-destructive bg-destructive/15";
    return "border-border bg-secondary/30";
  }
  return selected ? "border-primary bg-primary/15" : "border-border bg-secondary/30 hover:bg-secondary/50";
}

function SingleChoice({ q, value, onChange, showCorrection }: any) {
  return (
    <div className="space-y-2">
      {q.options.map((o: any) => (
        <label
          key={o.id}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer text-arabic-lg ${optionClass(
            value === o.id,
            o.correct,
            showCorrection
          )}`}
        >
          <input
            type="radio"
            name={q.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
            className="accent-primary"
            disabled={showCorrection}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function MultiChoice({ q, value, onChange, showCorrection }: any) {
  const toggle = (id: string) => {
    const set = new Set<string>(value);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set]);
  };
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {q.options.map((o: any) => (
        <label
          key={o.id}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer text-arabic-lg ${optionClass(
            value.includes(o.id),
            o.correct,
            showCorrection
          )}`}
        >
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={() => toggle(o.id)}
            className="accent-primary"
            disabled={showCorrection}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function Subgroup({ q, value, onChange, showCorrection }: any) {
  return (
    <div className="space-y-5">
      {q.subs.map((sub: any) => (
        <div key={sub.id}>
          <div className="font-semibold text-foreground/90 mb-2">{sub.prompt}</div>
          {sub.type === "multi" ? (
            <MultiChoice
              q={{ ...q, options: sub.options, id: `${q.id}.${sub.id}` }}
              value={value[sub.id] || []}
              onChange={(v: any) => onChange({ ...value, [sub.id]: v })}
              showCorrection={showCorrection}
            />
          ) : (
            <SingleChoice
              q={{ ...q, options: sub.options, id: `${q.id}.${sub.id}` }}
              value={value[sub.id]}
              onChange={(v: any) => onChange({ ...value, [sub.id]: v })}
              showCorrection={showCorrection}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function TokenCorrection({ q, value, onChange, showCorrection }: any) {
  return (
    <div className="space-y-3">
      {q.tokens.map((t: any) => {
        const v = value[t.id] || "";
        const ok = v.trim() === t.expected.trim();
        return (
          <div key={t.id} className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="md:w-40 text-foreground/80 font-semibold">{t.label}</label>
            <input
              type="text"
              dir="rtl"
              value={v}
              onChange={(e) => onChange({ ...value, [t.id]: e.target.value })}
              disabled={showCorrection}
              className={`flex-1 p-3 rounded-xl bg-input/60 border-2 text-arabic-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                showCorrection ? (ok ? "border-success" : "border-destructive") : "border-border"
              }`}
            />
            {showCorrection && (
              <span className="text-sm text-accent/90 md:w-64">
                الصواب: <strong className="gold-text">{t.expected}</strong>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const HARAKA_OPTIONS: { ch: string; label: string }[] = [
  { ch: "َ", label: "ـَ" },
  { ch: "ُ", label: "ـُ" },
  { ch: "ِ", label: "ـِ" },
  { ch: "ْ", label: "ـْ" },
  { ch: "ً", label: "ـً" },
  { ch: "ٌ", label: "ـٌ" },
  { ch: "ٍ", label: "ـٍ" },
];

function FinalHarakaTokens({ q, value, onChange, showCorrection }: any) {
  // Each token: pick exactly one haraka to apply to the target letter (or word end).
  return (
    <div className="space-y-3">
      {q.tokens.map((t: any) => {
        const chosen: string = value[t.id] || "";
        const expected: string = t.targetHaraka || "";
        const isOk = showCorrection && chosen && chosen === expected;
        const isWrong = showCorrection && chosen !== expected;

        // Build a visual: word with chosen haraka applied to the target letter (last occurrence).
        const renderWord = () => {
          const word: string = t.label;
          const targetLetter: string | undefined = t.targetLetter;
          if (!chosen) return word;
          if (targetLetter && word.includes(targetLetter)) {
            const idx = word.lastIndexOf(targetLetter);
            return word.slice(0, idx + 1) + chosen + word.slice(idx + 1);
          }
          return word + chosen;
        };

        return (
          <div
            key={t.id}
            className={`p-3 rounded-xl border-2 transition ${
              showCorrection
                ? isOk
                  ? "border-success bg-success/10"
                  : "border-destructive bg-destructive/10"
                : "border-border bg-secondary/30"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-arabic-lg font-bold min-w-[7rem] text-right">
                {renderWord()}
              </span>
              {t.targetLetter && (
                <span className="text-xs text-muted-foreground">
                  الحرف الأخير: <strong className="gold-text">{t.targetLetter}</strong>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {HARAKA_OPTIONS.map((opt) => {
                const selected = chosen === opt.ch;
                const isCorrectOpt = showCorrection && opt.ch === expected;
                let cls =
                  "px-3 py-1.5 rounded-lg border-2 text-arabic-lg font-bold transition cursor-pointer min-w-[3rem]";
                if (showCorrection) {
                  if (isCorrectOpt) cls += " border-success bg-success/15";
                  else if (selected) cls += " border-destructive bg-destructive/15";
                  else cls += " border-border bg-secondary/30 opacity-60";
                } else {
                  cls += selected
                    ? " border-primary bg-primary/15"
                    : " border-border bg-secondary/40 hover:bg-secondary/60";
                }
                return (
                  <button
                    key={opt.ch}
                    type="button"
                    disabled={showCorrection}
                    onClick={() => onChange({ ...value, [t.id]: opt.ch })}
                    className={cls}
                  >
                    {opt.label}
                  </button>
                );
              })}
              {!showCorrection && chosen && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [t.id]: "" })}
                  className="px-3 py-1.5 rounded-lg border-2 border-border bg-secondary/30 hover:bg-secondary/50 text-sm"
                >
                  مَسْح
                </button>
              )}
            </div>
            {showCorrection && (
              <div className="text-xs text-accent/90 mt-2">
                الصّواب: <strong className="gold-text">
                  {HARAKA_OPTIONS.find((o) => o.ch === expected)?.label || expected}
                </strong>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TableFill({ q, value, onChange, showCorrection }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-border bg-secondary/50"></th>
            {q.tableColumns.map((c: string) => (
              <th key={c} className="p-2 border border-border bg-secondary/50">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.tableRows.map((row: any) => (
            <tr key={row.id}>
              <td className="p-2 border border-border bg-secondary/40 font-semibold">{row.label}</td>
              {q.tableColumns.map((col: string) => {
                const cell = row.cells.find((c: any) => c.col === col);
                if (cell?.given) {
                  return (
                    <td key={col} className="p-2 border border-border text-center font-bold gold-text">
                      {cell.given}
                    </td>
                  );
                }
                const v = value[row.id]?.[col] || "";
                const ok = showCorrection && v.trim() === cell.expected.trim();
                return (
                  <td key={col} className="p-2 border border-border">
                    <input
                      type="text"
                      dir="rtl"
                      value={v}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          [row.id]: { ...(value[row.id] || {}), [col]: e.target.value },
                        })
                      }
                      disabled={showCorrection}
                      className={`w-full p-2 rounded-lg bg-input/60 border-2 text-center ${
                        showCorrection ? (ok ? "border-success" : "border-destructive") : "border-border"
                      }`}
                    />
                    {showCorrection && (
                      <div className="text-xs text-center mt-1 gold-text">{cell.expected}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FreeText({ q, value, onChange, showCorrection }: any) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        disabled={showCorrection}
        className="w-full p-4 rounded-xl bg-input/60 border border-border text-arabic-lg leading-loose focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="اكتب إجابتك المصحَّحة هنا..."
      />
      {showCorrection && q.expected && (
        <div className="mt-3 p-4 rounded-xl bg-success/10 border border-success/40">
          <div className="text-xs text-success uppercase tracking-wider mb-1">الإجابة المتوقَّعة</div>
          <div className="text-arabic-lg leading-loose gold-text">{q.expected}</div>
        </div>
      )}
    </div>
  );
}
