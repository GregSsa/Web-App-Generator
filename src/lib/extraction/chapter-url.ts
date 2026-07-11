export function deriveChapterUrl(url: string, knownNumber: number | null, targetNumber: number) {
  if (knownNumber === null || !Number.isFinite(targetNumber)) return url;
  const target = String(targetNumber);
  const parsed = new URL(url);
  const escaped = String(knownNumber).replace(".", "[.,-]");
  const pathPattern = new RegExp(`(chapter/?)${escaped}(?=/?$|[?#])`, "i");
  if (!pathPattern.test(parsed.pathname)) return url;
  parsed.pathname = parsed.pathname.replace(pathPattern, `$1${target}`);
  return parsed.toString();
}
