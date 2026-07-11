import * as cheerio from "cheerio";
import { fetchPage } from "../fetch-page";
import { normalizeChapterNumber } from "../chapter-number";
import type { ExtractedMangaMetadata } from "@/types/manga";
import type { SourceAdapter } from "./types";

const MAX_NEXT_PAGES = 20;
const chapterPath = /\/chapter\/(\d+(?:[.-]\d+)?[a-z]?)\/?$/i;

function chapterFromUrl(url: string) {
  const match = new URL(url).pathname.match(chapterPath);
  const label = match?.[1] ?? null;
  const normalized = normalizeChapterNumber(label);
  return { number: normalized.numeric, label: label ? `Chapter ${label}` : null };
}

function mangaTitle($: cheerio.CheerioAPI) {
  const raw = $("meta[property='og:title']").attr("content") || $("title").text();
  return raw.replace(/\s+Chapter\s+\S+.*$/i, "").replace(/\s+-\s+Read Online.*$/i, "").trim() || null;
}

export const asuraScansAdapter: SourceAdapter = {
  name: "asura-scans",
  domains: ["asurascans.com", "www.asurascans.com"],
  supports: (hostname) => hostname === "asurascans.com" || hostname === "www.asurascans.com",
  async extract({ html, url }) {
    const $ = cheerio.load(html);
    const title = mangaTitle($);
    let latestUrl = url.toString();
    let next = $("link[rel='next']").attr("href");
    let traversed = 0;
    while (next && traversed < MAX_NEXT_PAGES) {
      const nextUrl = new URL(next, latestUrl).toString();
      const page = await fetchPage(nextUrl);
      latestUrl = page.finalUrl;
      const nextPage = cheerio.load(page.html);
      next = nextPage("link[rel='next']").attr("href");
      traversed += 1;
      if (next && traversed < MAX_NEXT_PAGES) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const chapter = chapterFromUrl(latestUrl);
    return {
      mangaTitle: title,
      canonicalUrl: url.toString(),
      sourceName: "Asura Scans",
      latestChapter: { ...chapter, title: null, url: latestUrl, publishedAt: null },
      confidence: chapter.number === null ? 0.45 : 0.95,
      warnings: traversed === MAX_NEXT_PAGES && next ? ["La vérification a atteint sa limite de pages ; actualisez plus tard."] : [],
    } satisfies Partial<ExtractedMangaMetadata>;
  },
};
