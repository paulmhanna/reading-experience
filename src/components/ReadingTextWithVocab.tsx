import { useMemo, useState } from "react";
import { vocabulary } from "@/config/lessonText";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders Arabic text with vocabulary terms highlighted.
 * Clicking a term opens an inline meaning popover.
 */
export function ReadingTextWithVocab({ text, className }: Props) {
  // Build a regex that matches any vocab term. Sort by length to match phrases first.
  const terms = useMemo(
    () => [...vocabulary].sort((a, b) => b.term.length - a.term.length),
    []
  );
  const [active, setActive] = useState<{ term: string; meaning: string } | null>(null);

  const tokens = useMemo(() => {
    // Walk text and split into [{type:'text'|'term', value, meaning?}]
    type Tok = { type: "text" | "term"; value: string; meaning?: string };
    const out: Tok[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      let bestIdx = -1;
      let bestTerm: (typeof terms)[number] | null = null;
      for (const t of terms) {
        const idx = remaining.indexOf(t.term);
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
          bestIdx = idx;
          bestTerm = t;
        }
      }
      if (bestIdx === -1 || !bestTerm) {
        out.push({ type: "text", value: remaining });
        break;
      }
      if (bestIdx > 0) {
        out.push({ type: "text", value: remaining.slice(0, bestIdx) });
      }
      out.push({ type: "term", value: bestTerm.term, meaning: bestTerm.meaning });
      remaining = remaining.slice(bestIdx + bestTerm.term.length);
    }
    return out;
  }, [text, terms]);

  return (
    <div className={`relative ${className || ""}`}>
      <p className="text-arabic-xl text-foreground/95 leading-loose">
        {tokens.map((t, i) =>
          t.type === "text" ? (
            <span key={i}>{t.value}</span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setActive({ term: t.value, meaning: t.meaning! })}
              className="vocab-word"
            >
              {t.value}
            </button>
          )
        )}
      </p>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
          >
            <div className="glass-panel rounded-2xl p-5 border border-accent/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-accent uppercase tracking-wider mb-1">
                    شرح المفردة
                  </div>
                  <div className="text-2xl gold-text font-bold">{active.term}</div>
                  <div className="text-foreground/90 text-arabic-lg mt-2">
                    {active.meaning}
                  </div>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="text-muted-foreground hover:text-foreground text-xl"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
