import * as cheerio from "cheerio";
import { normalizeChapterNumber } from "../chapter-number";
import type { SourceAdapter } from "./types";

const chapterPattern = /(?:chapitre|chapter|chap\.?|ch\.?)\s*(\d+(?:[.,]\d+)?[a-z]?)/i;

export const genericAdapter: SourceAdapter = {
  name: "generic",
  domains: ["*"],
  supports: () => true,
  extract({ html, url }) {
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr("content")?.trim() || $("title").first().text().trim() || $("h1").first().text().trim() || null;
    const canonicalRaw = $('link[rel="canonical"]').attr("href") || $('meta[property="og:url"]').attr("content");
    let canonicalUrl = url.toString();
    if (canonicalRaw) { try { canonicalUrl = new URL(canonicalRaw, url).toString(); } catch { /* conserver l'URL contrôlée */ } }
    const candidates: { label: string; href: string; number: number | null }[] = [];
    $("a[href]").each((_, element) => {
      const label = $(element).text().replace(/\s+/g, " ").trim();
      const match = label.match(chapterPattern);
      if (!match) return;
      try {
        const href = new URL($(element).attr("href")!, url).toString();
        const normalized = normalizeChapterNumber(match[1]);
        candidates.push({ label, href, number: normalized.numeric });
      } catch { /* lien mal formé ignoré */ }
    });
    candidates.sort((a, b) => (b.number ?? -1) - (a.number ?? -1));
    const latest = candidates[0];
    return {
      mangaTitle: title?.replace(/\s*[|–—-].*$/, "") || null,
      canonicalUrl,
      sourceName: url.hostname.replace(/^www\./, ""),
      latestChapter: latest ? { number: latest.number, label: latest.label, title: null, url: latest.href, publishedAt: null } : null,
      confidence: latest && title ? 0.8 : title ? 0.55 : 0.25,
      warnings: latest ? [] : ["Aucun chapitre n’a été détecté automatiquement."],
    };
  },
};
