import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { setProgressFromForm, updateMangaDetails, updateProgress } from "@/actions/mangas";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckButton } from "@/features/mangas/check-button";
import { DeleteMangaButton } from "@/features/mangas/delete-manga-button";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: manga }, { data: categories }, { data: relations }] = await Promise.all([
    supabase.from("mangas").select("*,chapters(*),reading_progress(*)").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("categories").select("id,name").eq("user_id", user.id).order("name"),
    supabase.from("manga_categories").select("category_id").eq("manga_id", id).eq("user_id", user.id),
  ]);
  if (!manga) notFound();
  const chapters = [...(manga.chapters ?? [])].sort((a, b) => (b.number_normalized ?? -1) - (a.number_normalized ?? -1));
  const latest = chapters[0];
  const selectedCategoryIds = new Set((relations ?? []).map((relation) => relation.category_id));
  const progress = manga.reading_progress?.[0];

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><Badge variant="secondary">{manga.status}</Badge><span className="text-sm text-muted-foreground">{manga.source_name}</span></div><h1 className="mt-2 text-3xl font-semibold tracking-tight">{manga.title}</h1><a href={manga.canonical_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">{new URL(manga.canonical_url).hostname}<ExternalLink className="size-3" /></a></div>
      <div className="flex flex-wrap gap-2"><CheckButton id={id} />{latest && <ExternalChapterLink chapterId={latest.id} href={latest.url}>Ouvrir le dernier chapitre</ExternalChapterLink>}<DeleteMangaButton mangaId={id} title={manga.title} /></div>
    </div>
    {manga.last_check_error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">Dernière erreur : {manga.last_check_error}</div>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card><CardHeader><CardTitle>Chapitres détectés</CardTitle></CardHeader><CardContent>{chapters.length ? <div className="divide-y">{chapters.map((chapter) => <div key={chapter.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{chapter.number_label}</p>{chapter.title && <p className="text-sm text-muted-foreground">{chapter.title}</p>}<p className="mt-1 text-xs text-muted-foreground">{chapter.is_read ? "Lu" : "Non lu"}</p></div><div className="flex gap-2"><form action={updateProgress.bind(null, id, chapter.id, chapter.number_normalized)}><Button size="sm" variant="outline">Dernier lu</Button></form><ExternalChapterLink chapterId={chapter.id} href={chapter.url}>Ouvrir</ExternalChapterLink></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Aucun chapitre enregistré.</p>}</CardContent></Card>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Progression</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Dernier chapitre lu</p><p className="mt-1 font-mono text-2xl font-semibold">{progress?.last_read_number ?? "—"}</p>{chapters.length > 0 && <form action={setProgressFromForm.bind(null, id)} className="mt-4 flex gap-2"><select name="chapterId" defaultValue={progress?.last_read_chapter_id ?? latest?.id} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm">{chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.number_label}</option>)}</select><Button size="sm">Enregistrer</Button></form>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Note et catégories</CardTitle></CardHeader><CardContent><form action={updateMangaDetails.bind(null, id)} className="space-y-4"><div><Label htmlFor="rating">Évaluation /10</Label><Input id="rating" name="rating" type="number" min="0" max="10" defaultValue={manga.rating ?? ""} className="mt-1" /></div><div><Label htmlFor="notes">Note personnelle</Label><Textarea id="notes" name="notes" defaultValue={manga.notes ?? ""} maxLength={5000} className="mt-1" /></div><fieldset><legend className="text-sm font-medium">Catégories</legend><div className="mt-2 space-y-2">{categories?.length ? categories.map((category) => <label key={category.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="categoryIds" value={category.id} defaultChecked={selectedCategoryIds.has(category.id)} />{category.name}</label>) : <p className="text-sm text-muted-foreground">Créez d’abord une catégorie.</p>}</div></fieldset><Button className="w-full">Enregistrer</Button></form></CardContent></Card>
      </div>
    </div>
  </div>;
}
