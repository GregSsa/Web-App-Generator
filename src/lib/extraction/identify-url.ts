import { assertPublicUrl } from "./normalize-url";
import { urlMangaIdentificationSchema } from "@/lib/validations/manga";
import type { UrlMangaIdentification } from "@/types/manga";

const chapterSegment = /^(?:chapter[-_.]?|chapitre[-_.]?|ch[-_.]?|c)(\d+(?:[.-]\d+)?[a-z]?)$/i;
const chapterMarker = /^(?:chapter|chapitre|ch)$/i;
const chapterNumber = /^(\d+(?:[.-]\d+)?[a-z]?)$/i;
const ignoredSegments = new Set(["manga", "comic", "comics", "read", "reader", "title", "series"]);

function humanize(value: string) {
  return decodeURIComponent(value).replace(/\.\d+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).trim();
}

function sourceName(hostname: string) {
  const label = hostname.replace(/^www\./, "").split(".")[0];
  return humanize(label);
}

export function identifyMangaUrlLocally(input: string): UrlMangaIdentification {
  const url = new URL(input);
  const segments = url.pathname.split("/").filter(Boolean);
  let chapterIndex = segments.findIndex((segment) => chapterSegment.test(segment));
  let rawNumber = chapterIndex >= 0 ? segments[chapterIndex].match(chapterSegment)?.[1]?.replace("-", ".") ?? null : null;
  if (chapterIndex < 0) {
    chapterIndex = segments.findIndex((segment, index) => chapterMarker.test(segment) && chapterNumber.test(segments[index + 1] ?? ""));
    rawNumber = chapterIndex >= 0 ? segments[chapterIndex + 1].match(chapterNumber)?.[1]?.replace("-", ".") ?? null : null;
  }
  const number = rawNumber ? Number.parseFloat(rawNumber) : null;
  const titleSegment = chapterIndex > 0 ? [...segments.slice(0, chapterIndex)].reverse().find((segment) => !ignoredSegments.has(segment.toLowerCase())) : null;
  const canonical = new URL(url.toString());
  if (chapterIndex >= 0) canonical.pathname = `/${segments.slice(0, chapterIndex).join("/")}`;
  canonical.search = "";
  canonical.hash = "";
  const title = titleSegment ? humanize(titleSegment) : null;
  return urlMangaIdentificationSchema.parse({
    mangaTitle: title,
    canonicalUrl: canonical.toString(),
    sourceName: sourceName(url.hostname),
    currentChapter: number !== null && Number.isFinite(number) ? { number, label: `Chapter ${rawNumber}`, title: null, url: url.toString(), publishedAt: null } : null,
    confidence: title && number !== null ? 0.86 : title || number !== null ? 0.55 : 0.25,
    warnings: title && number !== null ? [] : ["Certaines informations n’ont pas pu être déduites de l’URL."],
  });
}

function responseText(json: unknown) {
  const response = json as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return response.output_text ?? response.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
}

async function identifyWithLlm(url: string, fallback: UrlMangaIdentification) {
  const key = process.env.LLM_API_KEY;
  if (!key) return fallback;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      model: process.env.LLM_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: "Analyse uniquement la chaîne URL fournie. N'accède à aucun site et n'invente aucune information absente. Identifie le site, le titre probable du manga, le chapitre contenu dans l'URL et l'URL probable de la série. Retourne null pour le titre ou le chapitre s'ils ne sont pas déductibles." },
        { role: "user", content: `URL à analyser : ${url}\nInterprétation locale indicative : ${JSON.stringify(fallback)}` },
      ],
      text: { format: { type: "json_schema", name: "manga_url_identification", strict: true, schema: { type: "object", additionalProperties: false, required: ["mangaTitle", "canonicalUrl", "sourceName", "currentChapter", "confidence", "warnings"], properties: { mangaTitle: { type: ["string", "null"] }, canonicalUrl: { type: "string" }, sourceName: { type: "string" }, currentChapter: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["number", "label", "title", "url", "publishedAt"], properties: { number: { type: ["number", "null"] }, label: { type: ["string", "null"] }, title: { type: ["string", "null"] }, url: { type: ["string", "null"] }, publishedAt: { type: ["string", "null"] } } }] }, confidence: { type: "number" }, warnings: { type: "array", items: { type: "string" } } } } } },
      max_output_tokens: 600,
    }),
  });
  if (!response.ok) throw new Error(`Identification LLM indisponible (${response.status})`);
  const text = responseText(await response.json());
  if (!text) throw new Error("Réponse LLM vide");
  const parsed = urlMangaIdentificationSchema.parse(JSON.parse(text));
  const parsedCanonical = new URL(parsed.canonicalUrl);
  const safeCanonical = parsedCanonical.hostname === new URL(url).hostname ? parsed.canonicalUrl : fallback.canonicalUrl;
  return {
    ...parsed,
    mangaTitle: parsed.mangaTitle ?? fallback.mangaTitle,
    canonicalUrl: safeCanonical,
    sourceName: parsed.sourceName || fallback.sourceName,
    currentChapter: parsed.currentChapter ? { ...parsed.currentChapter, url } : fallback.currentChapter,
  };
}

export async function identifyMangaUrl(input: string) {
  const safeUrl = await assertPublicUrl(input);
  const fallback = identifyMangaUrlLocally(safeUrl.toString());
  try {
    return await identifyWithLlm(safeUrl.toString(), fallback);
  } catch (error) {
    return { ...fallback, warnings: [...fallback.warnings, error instanceof Error ? error.message : "Identification LLM indisponible."] };
  }
}
