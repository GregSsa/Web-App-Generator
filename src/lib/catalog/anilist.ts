import { z } from "zod";

const mediaSchema = z.object({ id: z.number().int(), siteUrl: z.url(), description: z.string().nullable(), format: z.string().nullable(), status: z.string().nullable(), countryOfOrigin: z.string().nullable(), chapters: z.number().int().nullable(), volumes: z.number().int().nullable(), genres: z.array(z.string()), coverImage: z.object({ large: z.url().nullable() }), bannerImage: z.url().nullable(), title: z.object({ romaji: z.string().nullable(), english: z.string().nullable(), native: z.string().nullable() }), staff: z.object({ nodes: z.array(z.object({ name: z.object({ full: z.string().nullable() }) })) }) });
export type AniListMedia = z.infer<typeof mediaSchema>;
const query = `query ($search: String!) { Page(perPage: 5) { media(search: $search, type: MANGA, sort: SEARCH_MATCH) { id siteUrl description(asHtml:false) format status countryOfOrigin chapters volumes genres coverImage { large } bannerImage title { romaji english native } staff(perPage: 8) { nodes { name { full } } } } } }`;
export async function lookupAniList(title: string): Promise<AniListMedia | null> {
  const response = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ query, variables: { search: title } }), signal: AbortSignal.timeout(8_000), cache: "no-store" });
  if (!response.ok) return null;
  const json = await response.json() as { data?: { Page?: { media?: unknown[] } } };
  const first = json.data?.Page?.media?.[0];
  return first ? mediaSchema.safeParse(first).data ?? null : null;
}
export function titleFromAniList(media: AniListMedia) { return media.title.english ?? media.title.romaji ?? media.title.native ?? null; }
