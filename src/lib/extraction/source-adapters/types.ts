import type { ExtractedMangaMetadata } from "@/types/manga";

export type AdapterInput = { html: string; url: URL };
export interface SourceAdapter {
  name: string;
  domains: string[];
  supports(hostname: string): boolean;
  extract(input: AdapterInput): Promise<Partial<ExtractedMangaMetadata>> | Partial<ExtractedMangaMetadata>;
}
