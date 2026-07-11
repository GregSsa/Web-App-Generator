import * as cheerio from "cheerio";
import { extractedMangaMetadataSchema } from "@/lib/validations/manga";
import { fetchPage } from "./fetch-page";
import { getAdapter } from "./source-adapters/registry";
import { OpenAiMetadataExtractor } from "./llm-fallback";

export async function extractMangaMetadata(input: string) {
  const { html, finalUrl } = await fetchPage(input);
  const url = new URL(finalUrl);
  const result = extractedMangaMetadataSchema.parse(await getAdapter(url.hostname).extract({ html, url }));
  if (result.confidence >= 0.5 || !process.env.LLM_API_KEY) return result;
  const $ = cheerio.load(html); $("script,style,noscript,iframe,svg").remove();
  const compactContent = `${$("title").text()}\n${$("meta").map((_, el) => $(el).attr("content")).get().join("\n")}\n${$("a").slice(0, 150).map((_, el) => $(el).text().trim()).get().join("\n")}`;
  return new OpenAiMetadataExtractor().extract({ url: finalUrl, compactContent });
}
