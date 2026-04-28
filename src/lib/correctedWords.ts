// Shared helper for "corrected words only" questions (Q1, Q5, Q11 in قواعد).
// Student writes only the corrected words (any separator, any order, no harakat).
// Score = max(0, correctMatchesFound - extraWrongWords). Each expected word counts at most once.

export function normalizeArabic(s: string): string {
  return (s || "")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // strip harakat + tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .trim()
    .toLowerCase();
}

export function tokenizeWords(input: string): string[] {
  if (!input) return [];
  // split on whitespace, commas (latin/arabic), dashes, punctuation, newlines, etc.
  return input
    .split(/[\s,،;؛\-—–_/\\.|·•:؟?!.…\(\)\[\]{}"'`]+/u)
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface CorrectedWordsResult {
  earned: number;
  max: number;
  matched: string[];     // expected words that were found
  missing: string[];     // expected words not found
  extras: string[];      // student-supplied words that aren't expected
}

export function gradeCorrectedWords(
  expectedWords: string[],
  studentInput: string | undefined
): CorrectedWordsResult {
  const max = expectedWords.length;
  const expectedNorm = expectedWords.map(normalizeArabic);
  const used = new Array(expectedWords.length).fill(false);
  const givenTokens = tokenizeWords(studentInput || "");
  const matched: string[] = [];
  const extras: string[] = [];

  for (const tok of givenTokens) {
    const n = normalizeArabic(tok);
    if (!n) continue;
    const idx = expectedNorm.findIndex((e, i) => !used[i] && e === n);
    if (idx >= 0) {
      used[idx] = true;
      matched.push(expectedWords[idx]);
    } else {
      extras.push(tok);
    }
  }

  const missing = expectedWords.filter((_, i) => !used[i]);
  const earned = Math.max(0, matched.length - extras.length);
  return { earned, max, matched, missing, extras };
}

// Final-haraka extraction: returns the trailing diacritic mark of a word,
// ignoring tatweel and trailing punctuation. Returns "" if none.
const HARAKAT = /[\u064B-\u0652\u0670]/;
function stripPunct(s: string) {
  return (s || "").replace(/[\s.,،؛;:!?؟…\-—–_"'`)(\][}{]/g, "");
}
export function finalHaraka(word: string): string {
  const w = stripPunct(word);
  // walk from end, skip tatweel
  for (let i = w.length - 1; i >= 0; i--) {
    const ch = w[i];
    if (ch === "ـ") continue;
    if (HARAKAT.test(ch)) return ch;
    // first non-haraka, non-tatweel char from the end => no final haraka
    return "";
  }
  return "";
}

// Compare just the "ending" of a word: the final consonant (normalized) + final haraka.
// Used by Q6 (final-haraka grading per target word).
export function endingsMatch(student: string, expected: string): boolean {
  const sw = stripPunct(student);
  const ew = stripPunct(expected);
  if (!sw) return false;
  const sh = finalHaraka(sw);
  const eh = finalHaraka(ew);
  // Need final haraka match
  if (sh !== eh) return false;
  // and the base last letter (ignoring harakat) should also match
  const sBase = sw.replace(HARAKAT, "").replace(/ـ/g, "");
  const eBase = ew.replace(HARAKAT, "").replace(/ـ/g, "");
  return normalizeArabic(sBase.slice(-1)) === normalizeArabic(eBase.slice(-1));
}
