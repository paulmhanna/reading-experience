// Helpers to resolve student answers + correct answers into readable Arabic strings
// for the report (UI + PDF).
import type { Question, Section } from "@/config/questions";
import { gradeCorrectedWords, endingsMatch } from "@/lib/correctedWords";

function optLabel(q: Question | { options?: any[] }, id: string | undefined): string {
  if (!id) return "";
  const opt = (q as any).options?.find((o: any) => o.id === id);
  return opt?.label ?? "";
}

export interface ResolvedAnswerLine {
  label: string;     // sub-question label or empty
  given: string;     // student answer (joined readable)
  correct: string;   // correct answer (joined readable)
  ok: boolean | "partial" | "ungraded";
}

export function resolveAnswer(q: Question, given: any): ResolvedAnswerLine[] {
  switch (q.type) {
    case "single": {
      const correctId = q.options?.find((o) => o.correct)?.id;
      return [
        {
          label: "",
          given: given ? optLabel(q, given) : "— لم يُجَب —",
          correct: optLabel(q, correctId),
          ok: !!given && given === correctId,
        },
      ];
    }
    case "multi": {
      const correctIds = (q.options || []).filter((o) => o.correct).map((o) => o.id);
      const arr: string[] = Array.isArray(given) ? given : [];
      const givenLabels = arr.length
        ? arr.map((id) => optLabel(q, id)).filter(Boolean).join("، ")
        : "— لم يُجَب —";
      const correctLabels = correctIds.map((id) => optLabel(q, id)).join("، ");
      const allCorrect =
        arr.length === correctIds.length && arr.every((id) => correctIds.includes(id));
      const anyCorrect = arr.some((id) => correctIds.includes(id));
      return [
        {
          label: "",
          given: givenLabels,
          correct: correctLabels,
          ok: allCorrect ? true : anyCorrect ? "partial" : false,
        },
      ];
    }
    case "subgroup": {
      const out: ResolvedAnswerLine[] = [];
      for (const sub of q.subs || []) {
        if (sub.type === "multi") {
          const correctIds = sub.options.filter((o) => o.correct).map((o) => o.id);
          const arr: string[] = Array.isArray(given?.[sub.id]) ? given[sub.id] : [];
          const givenLabels = arr.length
            ? arr.map((id) => optLabel(sub as any, id)).filter(Boolean).join("، ")
            : "— لم يُجَب —";
          const correctLabels = correctIds.map((id) => optLabel(sub as any, id)).join("، ");
          const allCorrect =
            arr.length === correctIds.length && arr.every((id) => correctIds.includes(id));
          const anyCorrect = arr.some((id) => correctIds.includes(id));
          out.push({
            label: sub.prompt,
            given: givenLabels,
            correct: correctLabels,
            ok: allCorrect ? true : anyCorrect ? "partial" : false,
          });
        } else {
          const correctId = sub.options.find((o) => o.correct)?.id;
          const g = given?.[sub.id];
          out.push({
            label: sub.prompt,
            given: g ? optLabel(sub as any, g) : "— لم يُجَب —",
            correct: optLabel(sub as any, correctId),
            ok: !!g && g === correctId,
          });
        }
      }
      return out;
    }
    case "tokenCorrection": {
      return (q.tokens || []).map((t) => {
        const g = (given?.[t.id] || "").trim();
        const ok = g === t.expected.trim();
        return {
          label: t.label,
          given: g || "— لم يُجَب —",
          correct: t.expected,
          ok,
        };
      });
    }
    case "tableFill": {
      const out: ResolvedAnswerLine[] = [];
      for (const row of q.tableRows || []) {
        for (const cell of row.cells) {
          if (cell.given) continue;
          const g = (given?.[row.id]?.[cell.col] || "").trim();
          out.push({
            label: `${row.label} — ${cell.col}`,
            given: g || "— لم يُجَب —",
            correct: cell.expected,
            ok: g === cell.expected.trim(),
          });
        }
      }
      return out;
    }
    case "freeText": {
      return [
        {
          label: "",
          given: (given || "").toString().trim() || "— لم يُجَب —",
          correct: q.expected || "",
          ok: "partial",
        },
      ];
    }
    case "correctedWords": {
      const expected = q.expectedWords || [];
      const studentText = (given || "").toString().trim();
      const r = gradeCorrectedWords(expected, studentText);
      const lines: ResolvedAnswerLine[] = [
        {
          label: "إجابة التّلميذ",
          given: studentText || "— لم يُجَب —",
          correct: expected.join("، "),
          ok: r.earned === r.max && r.max > 0 ? true : r.earned > 0 ? "partial" : false,
        },
      ];
      if (r.matched.length) {
        lines.push({ label: "كلمات صحيحة", given: r.matched.join("، "), correct: "—", ok: true });
      }
      if (r.missing.length) {
        lines.push({ label: "كلمات لم يكتبها", given: r.missing.join("، "), correct: "—", ok: false });
      }
      if (r.extras.length) {
        lines.push({ label: "كلمات زائدة (أنقصت العلامة)", given: r.extras.join("، "), correct: "—", ok: false });
      }
      return lines;
    }
    case "finalHarakaTokens": {
      return (q.tokens || []).map((t) => {
        const g = (given?.[t.id] || "").trim();
        const ok = !!g && endingsMatch(g, t.expected);
        return { label: t.label, given: g || "— لم يُجَب —", correct: t.expected, ok };
      });
    }
    case "longText":
    default:
      return [
        {
          label: "",
          given: (given || "").toString().trim() || "— لم يُجَب —",
          correct: "—",
          ok: "ungraded",
        },
      ];
  }
}

export function gradedQuestionsOnly(s: Section) {
  return s.questions;
}
