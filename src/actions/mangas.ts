"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mangaFormSchema } from "@/lib/validations/manga";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export type MangaActionState = { error?: string; fieldErrors?: Record<string, string[]> };
export async function createManga(_: MangaActionState, formData: FormData): Promise<MangaActionState> {
  const user = await requireUser();
  const parsed = mangaFormSchema.safeParse({
    title: formData.get("title"), canonicalUrl: formData.get("canonicalUrl"), sourceName: formData.get("sourceName"), status: formData.get("status"), notificationsEnabled: formData.get("notificationsEnabled") === "on", notes: formData.get("notes") ?? "", rating: formData.get("rating") ? Number(formData.get("rating")) : null, chapterLabel: formData.get("chapterLabel") ?? "", chapterNumber: formData.get("chapterNumber") ? Number(formData.get("chapterNumber")) : null, chapterTitle: formData.get("chapterTitle") ?? "", chapterUrl: formData.get("chapterUrl") ?? "",
  });
  if (!parsed.success) return { error: "Vérifiez les champs.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data: manga, error } = await supabase.from("mangas").insert({ user_id: user.id, title: parsed.data.title, canonical_url: parsed.data.canonicalUrl, source_name: parsed.data.sourceName, status: parsed.data.status, notifications_enabled: parsed.data.notificationsEnabled, notes: parsed.data.notes || null, rating: parsed.data.rating }).select("id").single();
  if (error || !manga) return { error: error?.code === "23505" ? "Ce manga existe déjà dans votre bibliothèque." : "Impossible d’enregistrer le manga." };
  if (parsed.data.chapterLabel && parsed.data.chapterUrl) await supabase.from("chapters").insert({ user_id: user.id, manga_id: manga.id, number_label: parsed.data.chapterLabel, number_normalized: parsed.data.chapterNumber, title: parsed.data.chapterTitle || null, url: parsed.data.chapterUrl });
  revalidatePath("/mangas"); redirect(`/mangas/${manga.id}`);
}
export async function archiveManga(id: string) { const user = await requireUser(); const supabase = await createClient(); await supabase.from("mangas").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id); revalidatePath("/mangas"); redirect("/mangas"); }
export async function updateProgress(mangaId: string, chapterId: string, number: number | null) { const user = await requireUser(); const supabase = await createClient(); await supabase.from("reading_progress").upsert({ user_id: user.id, manga_id: mangaId, last_read_chapter_id: chapterId, last_read_number: number, updated_at: new Date().toISOString() }, { onConflict: "user_id,manga_id" }); revalidatePath(`/mangas/${mangaId}`); revalidatePath("/unread"); }
export async function createCategory(formData: FormData) { const user = await requireUser(); const name = String(formData.get("name") ?? "").trim(); if (!name || name.length > 80) return; const supabase = await createClient(); await supabase.from("categories").insert({ user_id: user.id, name }); revalidatePath("/categories"); }
