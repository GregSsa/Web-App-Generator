export type NormalizedChapter = { original: string; numeric: number | null; suffix: string | null; ambiguous: boolean };

export function normalizeChapterNumber(value: string | number | null | undefined): NormalizedChapter {
  const original = String(value ?? "").trim();
  if (!original) return { original, numeric: null, suffix: null, ambiguous: true };
  const cleaned = original.replace(/^(chapitre|chapter|chap\.?|ch\.?)\s*/i, "").trim();
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*([a-z])?$/i);
  if (!match) return { original, numeric: null, suffix: null, ambiguous: true };
  return { original, numeric: Number(match[1].replace(",", ".")), suffix: match[2]?.toLowerCase() ?? null, ambiguous: Boolean(match[2]) };
}

export function compareChapters(current: string | number | null, candidate: string | number | null) {
  const a = normalizeChapterNumber(current);
  const b = normalizeChapterNumber(candidate);
  if (a.numeric === null || b.numeric === null || a.ambiguous || b.ambiguous) return "ambiguous" as const;
  if (b.numeric > a.numeric) return "newer" as const;
  if (b.numeric === a.numeric) return "same" as const;
  return "older" as const;
}
