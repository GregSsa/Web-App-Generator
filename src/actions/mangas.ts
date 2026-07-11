"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkManga } from "@/lib/extraction/check-manga";
import { deriveChapterUrl } from "@/lib/extraction/chapter-url";
import { lookupAniList } from "@/lib/catalog/anilist";
import { mangaFormSchema } from "@/lib/validations/manga";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type MangaActionState = { error?: string; fieldErrors?: Record<string, string[]> };

function refreshMangaViews(mangaId: string) {
  revalidatePath(`/mangas/${mangaId}`);
  revalidatePath("/mangas");
  revalidatePath("/unread");
  revalidatePath("/dashboard");
}

export async function createManga(_: MangaActionState, formData: FormData): Promise<MangaActionState> {
  const user = await requireUser();
  const parsed = mangaFormSchema.safeParse({
    title: formData.get("title"),
    canonicalUrl: formData.get("canonicalUrl"),
    sourceName: formData.get("sourceName"),
    status: formData.get("status"),
    notificationsEnabled: formData.get("notificationsEnabled") === "on",
    notes: formData.get("notes") ?? "",
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    chapterLabel: formData.get("chapterLabel") ?? "",
    chapterNumber: formData.get("chapterNumber") ? Number(formData.get("chapterNumber")) : null,
    chapterTitle: formData.get("chapterTitle") ?? "",
    chapterUrl: formData.get("chapterUrl") ?? "",
    latestChapterLabel: formData.get("latestChapterLabel") ?? "",
    latestChapterNumber: formData.get("latestChapterNumber") ? Number(formData.get("latestChapterNumber")) : null,
    latestChapterUrl: formData.get("latestChapterUrl") ?? "",
  });
  if (!parsed.success) return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const catalog = await lookupAniList(parsed.data.title).catch(() => null);
  const { data: manga, error } = await supabase
    .from("mangas")
    .insert({ user_id: user.id, title: parsed.data.title, canonical_url: parsed.data.canonicalUrl, source_name: parsed.data.sourceName, status: parsed.data.status, notifications_enabled: parsed.data.notificationsEnabled, notes: parsed.data.notes || null, rating: parsed.data.rating, anilist_id: catalog?.id ?? null, anilist_url: catalog?.siteUrl ?? null, cover_image_url: catalog?.coverImage.large ?? null, banner_image_url: catalog?.bannerImage ?? null, synopsis: catalog?.description ?? null, format: catalog?.format ?? null, catalog_status: catalog?.status ?? null, country_of_origin: catalog?.countryOfOrigin ?? null, catalog_chapters: catalog?.chapters ?? null, catalog_volumes: catalog?.volumes ?? null, genres: catalog?.genres ?? [], authors: catalog?.staff.nodes.map((node) => node.name.full).filter((name): name is string => Boolean(name)) ?? [] })
    .select("id")
    .single();
  if (error || !manga) return { error: error?.code === "23505" ? "Ce manga existe déjà dans votre bibliothèque." : "Impossible d’enregistrer le manga." };

  if (parsed.data.chapterLabel && parsed.data.chapterUrl && parsed.data.chapterNumber !== null && parsed.data.chapterNumber !== undefined) {
    const currentNumber = parsed.data.chapterNumber;
    const detectedNumber = parsed.data.latestChapterNumber ?? currentNumber;
    const lastInteger = Math.max(Math.floor(currentNumber), Math.floor(detectedNumber));
    const canBuildRange = Number.isInteger(currentNumber) && Number.isInteger(detectedNumber) && lastInteger <= 2000;
    const numbers = canBuildRange ? Array.from({ length: lastInteger }, (_, index) => index + 1) : [...new Set([currentNumber, detectedNumber])];
    const chapters = numbers.map((number) => ({
      user_id: user.id,
      manga_id: manga.id,
      number_label: number === detectedNumber && parsed.data.latestChapterLabel ? parsed.data.latestChapterLabel : `Chapter ${number}`,
      number_normalized: number,
      title: number === currentNumber ? parsed.data.chapterTitle || null : null,
      url: number === currentNumber ? parsed.data.chapterUrl! : number === detectedNumber && parsed.data.latestChapterUrl ? parsed.data.latestChapterUrl : deriveChapterUrl(parsed.data.chapterUrl!, currentNumber, number),
      is_read: number <= currentNumber,
    }));
    const { data: savedChapters, error: chapterError } = await supabase.from("chapters").upsert(chapters, { onConflict: "manga_id,url" }).select("id,number_normalized");
    const currentChapter = savedChapters?.find((chapter) => Number(chapter.number_normalized) === currentNumber);
    if (chapterError || !currentChapter) return { error: "Le manga a été créé, mais ses chapitres n’ont pas pu être enregistrés." };
    await supabase.from("reading_progress").upsert({ user_id: user.id, manga_id: manga.id, last_read_chapter_id: currentChapter.id, last_read_number: currentNumber }, { onConflict: "user_id,manga_id" });
    // Un contrôle initial détecte le dernier chapitre disponible ; l’échec ne bloque jamais l’ajout.
    await checkManga(manga.id, user.id, supabase);
  }

  refreshMangaViews(manga.id);
  redirect(`/mangas/${manga.id}`);
}

export async function updateProgress(mangaId: string, chapterId: string, number: number | null) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: chapter } = await supabase.from("chapters").select("id,number_normalized").eq("id", chapterId).eq("manga_id", mangaId).eq("user_id", user.id).single();
  if (!chapter) return;

  if (number !== null) {
    await supabase.from("chapters").update({ is_read: true }).eq("manga_id", mangaId).eq("user_id", user.id).lte("number_normalized", number);
    await supabase.from("chapters").update({ is_read: false }).eq("manga_id", mangaId).eq("user_id", user.id).gt("number_normalized", number);
  } else {
    await supabase.from("chapters").update({ is_read: true }).eq("id", chapter.id).eq("user_id", user.id);
  }
  await supabase.from("reading_progress").upsert({ user_id: user.id, manga_id: mangaId, last_read_chapter_id: chapter.id, last_read_number: number }, { onConflict: "user_id,manga_id" });
  refreshMangaViews(mangaId);
}

export async function setProgressFromForm(mangaId: string, formData: FormData) {
  const number = Number(formData.get("chapterNumber"));
  if (!Number.isFinite(number) || number < 0) return;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: chapter } = await supabase.from("chapters").select("id").eq("manga_id", mangaId).eq("user_id", user.id).eq("number_normalized", number).maybeSingle();
  await supabase.from("chapters").update({ is_read: true }).eq("manga_id", mangaId).eq("user_id", user.id).lte("number_normalized", number);
  await supabase.from("chapters").update({ is_read: false }).eq("manga_id", mangaId).eq("user_id", user.id).gt("number_normalized", number);
  await supabase.from("reading_progress").upsert({ user_id: user.id, manga_id: mangaId, last_read_chapter_id: chapter?.id ?? null, last_read_number: number }, { onConflict: "user_id,manga_id" });
  refreshMangaViews(mangaId);
}

export async function updateMangaRating(mangaId: string, formData: FormData) {
  const user = await requireUser();
  const rawRating = String(formData.get("rating") ?? "").trim();
  const rating = rawRating === "" ? null : Number(rawRating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 0 || rating > 10)) return;
  const notes = String(formData.get("notes") ?? "").slice(0, 5000).trim();
  const supabase = await createClient();
  await supabase.from("mangas").update({ rating, notes: notes || null }).eq("id", mangaId).eq("user_id", user.id);
  refreshMangaViews(mangaId);
}

export async function updateMangaCategories(mangaId: string, formData: FormData) {
  const user = await requireUser();
  const categoryIds = [...new Set(formData.getAll("categoryIds").map(String).filter(Boolean))];
  const supabase = await createClient();
  await supabase.from("manga_categories").delete().eq("manga_id", mangaId).eq("user_id", user.id);
  if (categoryIds.length) await supabase.from("manga_categories").insert(categoryIds.map((category_id) => ({ manga_id: mangaId, category_id, user_id: user.id })));
  refreshMangaViews(mangaId);
}

export async function updateMangaDetails(mangaId: string, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const notes = String(formData.get("notes") ?? "").slice(0, 5000).trim();
  const rawRating = String(formData.get("rating") ?? "").trim();
  const rating = rawRating === "" ? null : Number(rawRating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 0 || rating > 10)) return;
  const categoryIds = [...new Set(formData.getAll("categoryIds").map(String).filter(Boolean))];
  await supabase.from("mangas").update({ notes: notes || null, rating }).eq("id", mangaId).eq("user_id", user.id);
  await supabase.from("manga_categories").delete().eq("manga_id", mangaId).eq("user_id", user.id);
  if (categoryIds.length) await supabase.from("manga_categories").insert(categoryIds.map((category_id) => ({ manga_id: mangaId, category_id, user_id: user.id })));
  refreshMangaViews(mangaId);
}

export async function deleteManga(mangaId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("mangas").delete().eq("id", mangaId).eq("user_id", user.id);
  revalidatePath("/mangas");
  revalidatePath("/unread");
  revalidatePath("/dashboard");
  redirect("/mangas");
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 80) return;
  const supabase = await createClient();
  await supabase.from("categories").insert({ user_id: user.id, name });
  revalidatePath("/categories");
}
export async function toggleMangaNotifications(mangaId: string, enabled: boolean) { const user = await requireUser(); const supabase = await createClient(); await supabase.from("mangas").update({ notifications_enabled: enabled }).eq("id", mangaId).eq("user_id", user.id); refreshMangaViews(mangaId); }
