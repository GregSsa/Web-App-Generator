import { extractMangaMetadata } from ".";
import { compareChapters } from "./chapter-number";
import { deriveChapterUrl } from "./chapter-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupAniList } from "@/lib/catalog/anilist";
import type { CheckResultStatus } from "@/types/manga";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkManga(mangaId: string, userId: string, client?: SupabaseClient): Promise<{ status: CheckResultStatus; message?: string }> {
  const admin = client ?? createAdminClient(); const { data: manga, error: mangaError } = await admin.from("mangas").select("*").eq("id", mangaId).eq("user_id", userId).maybeSingle();
  if (!manga) return { status: "failed", message: mangaError ? "Impossible de charger ce manga pour vérification." : "Manga introuvable" };
  const now = new Date(); if (manga.next_check_at && new Date(manga.next_check_at) > now) return { status: "rate_limited", message: "Ce manga vient déjà d’être vérifié." };
  const started = Date.now();
  try {
    const [metadata, catalog] = await Promise.all([extractMangaMetadata(manga.canonical_url), lookupAniList(manga.title)]); const latest = metadata.latestChapter;
    if (catalog) await admin.from("mangas").update({ anilist_id: catalog.id, anilist_url: catalog.siteUrl, cover_image_url: catalog.coverImage.large, banner_image_url: catalog.bannerImage, synopsis: catalog.description, format: catalog.format, catalog_status: catalog.status, country_of_origin: catalog.countryOfOrigin, catalog_chapters: catalog.chapters, catalog_volumes: catalog.volumes, genres: catalog.genres, authors: catalog.staff.nodes.map((node) => node.name.full).filter((name): name is string => Boolean(name)) }).eq("id", mangaId).eq("user_id", userId);
    const { data: current } = await admin.from("chapters").select("number_label,number_normalized,url").eq("manga_id", mangaId).order("number_normalized", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
    const comparison = compareChapters(current?.number_normalized ?? current?.number_label ?? null, latest?.number ?? latest?.label ?? null); let status: CheckResultStatus = "unchanged";
    if (!latest?.url || comparison === "ambiguous") status = "ambiguous";
    else if (!current || comparison === "newer") {
      const first = current?.number_normalized !== null && current?.number_normalized !== undefined && latest.number !== null ? Math.floor(current.number_normalized) + 1 : latest.number;
      const last = latest.number;
      const chaptersToSave = first !== null && last !== null && first <= last && last - first <= 100 ? Array.from({ length: last - first + 1 }, (_, index) => { const number = first + index; return { user_id: userId, manga_id: mangaId, number_label: `Chapter ${number}`, number_normalized: number, title: number === last ? latest.title : null, url: number === last ? latest.url! : deriveChapterUrl(current?.url ?? latest.url!, current?.number_normalized ?? latest.number, number), published_at: number === last ? latest.publishedAt : null }; }) : [{ user_id: userId, manga_id: mangaId, number_label: latest.label ?? String(latest.number), number_normalized: latest.number, title: latest.title, url: latest.url, published_at: latest.publishedAt }];
      const { data: saved } = await admin.from("chapters").upsert(chaptersToSave, { onConflict: "manga_id,url" }).select("id,number_normalized"); const chapter = saved?.find((item) => item.number_normalized === latest.number) ?? saved?.[0]; status = "new_chapter";
      if (chapter) await admin.from("notifications").upsert({ user_id: userId, manga_id: mangaId, chapter_id: chapter.id, title: manga.title, body: `Nouveau chapitre : ${latest.label ?? latest.number}`, target_path: `/mangas/${mangaId}` }, { onConflict: "user_id,manga_id,chapter_id" });
    }
    await admin.from("mangas").update({ last_checked_at: now.toISOString(), last_successful_check_at: now.toISOString(), last_check_status: status, last_check_error: null, consecutive_failures: 0, next_check_at: new Date(now.getTime() + Number(process.env.MANGA_CHECK_MIN_INTERVAL_MINUTES ?? 1) * 60000).toISOString() }).eq("id", mangaId).eq("user_id", userId); await admin.from("manga_check_logs").insert({ user_id: userId, manga_id: mangaId, status, duration_ms: Date.now() - started, warnings: metadata.warnings }); return { status };
  } catch (error) { const failures = Number(manga.consecutive_failures ?? 0) + 1; const delayMinutes = Math.min(10080, 60 * 2 ** Math.min(failures, 7)); const message = error instanceof Error ? error.message.slice(0, 300) : "Erreur inconnue"; await admin.from("mangas").update({ last_checked_at: now.toISOString(), last_check_status: "failed", last_check_error: message, consecutive_failures: failures, next_check_at: new Date(now.getTime() + delayMinutes * 60000).toISOString() }).eq("id", mangaId).eq("user_id", userId); await admin.from("manga_check_logs").insert({ user_id: userId, manga_id: mangaId, status: "failed", duration_ms: Date.now() - started, error_message: message }); return { status: "failed", message }; }
}
