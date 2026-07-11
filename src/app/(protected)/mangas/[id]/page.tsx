/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { ExternalLink, FolderPlus, Star } from "lucide-react";
import { setProgressFromForm, updateMangaCategories, updateMangaRating } from "@/actions/mangas";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deriveChapterUrl } from "@/lib/extraction/chapter-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { CheckButton } from "@/features/mangas/check-button";
import { DeleteMangaButton } from "@/features/mangas/delete-manga-button";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";

type StoredChapter = {
  id: string;
  number_label: string;
  number_normalized: number | null;
  title: string | null;
  url: string;
  is_read: boolean;
};

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

  const storedChapters = ([...(manga.chapters ?? [])] as StoredChapter[]).sort((a, b) => (b.number_normalized ?? -1) - (a.number_normalized ?? -1));
  const latestStored = storedChapters[0];
  const progress = manga.reading_progress?.[0];
  const highestStoredRead = storedChapters.filter((chapter) => chapter.is_read).reduce((highest, chapter) => Math.max(highest, Number(chapter.number_normalized ?? 0)), 0);
  const currentNumber = Number(progress?.last_read_number ?? highestStoredRead);
  const latestNumber = Math.max(Number(latestStored?.number_normalized ?? 0), Number(manga.catalog_chapters ?? 0), currentNumber);
  const selectedCategoryIds = new Set((relations ?? []).map((relation) => relation.category_id));
  const selectedCategories = (categories ?? []).filter((category) => selectedCategoryIds.has(category.id));
  const storedByNumber = new Map(storedChapters.filter((chapter) => chapter.number_normalized !== null).map((chapter) => [Number(chapter.number_normalized), chapter]));
  const integerNumbers = Array.from({ length: Math.min(2000, Math.floor(latestNumber)) }, (_, index) => index + 1);
  const allNumbers = [...new Set([...integerNumbers, ...storedByNumber.keys()])].sort((a, b) => b - a);
  const anchor = latestStored?.number_normalized !== null && latestStored?.number_normalized !== undefined ? latestStored : undefined;
  const unreadAvailable = Math.max(0, Math.floor(latestNumber - currentNumber));
  const nextChapter = storedByNumber.get(currentNumber + 1);

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{manga.status}</Badge><span className="text-sm text-muted-foreground">{manga.source_name}</span></div><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">{manga.title}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary"><a href={manga.canonical_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{new URL(manga.canonical_url).hostname}<ExternalLink className="size-3" /></a>{manga.anilist_url && <a href={manga.anilist_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">Voir sur AniList<ExternalLink className="size-3" /></a>}</div></div>
      <div className="flex flex-wrap gap-2"><CheckButton id={id} />{nextChapter && <ExternalChapterLink chapterId={nextChapter.id} href={nextChapter.url}>Ouvrir le prochain chapitre</ExternalChapterLink>}<DeleteMangaButton mangaId={id} title={manga.title} /></div>
    </div>

    {manga.last_check_error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">Dernière erreur : {manga.last_check_error}</div>}

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(21rem,0.8fr)]">
      <Card className="min-w-0"><CardHeader><CardTitle>Chapitres détectés</CardTitle></CardHeader><CardContent>
        <div className="mb-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted p-4"><p className="text-xs text-muted-foreground">Chapitre actuel</p><p className="mt-1 font-mono text-2xl font-semibold">{currentNumber || "—"}</p></div><div className="rounded-lg bg-primary/10 p-4"><p className="text-xs text-muted-foreground">Dernier chapitre disponible</p><p className="mt-1 font-mono text-2xl font-semibold">{latestNumber || "—"}</p></div></div>
        {allNumbers.length ? <ScrollArea className="h-[32rem] pr-3 lg:h-[calc(100vh-16rem)] lg:min-h-[38rem]"><div className="divide-y">{allNumbers.map((number) => { const chapter = storedByNumber.get(number); const inferredUrl = anchor ? deriveChapterUrl(anchor.url, Number(anchor.number_normalized), number) : null; const canOpenInferred = Boolean(inferredUrl && inferredUrl !== anchor?.url); const isRead = number <= currentNumber; return <div key={number} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">Chapitre {number}</p><Badge variant={isRead ? "secondary" : "default"}>{isRead ? "Lu" : "Non lu"}</Badge></div>{chapter?.title && <p className="truncate text-sm text-muted-foreground">{chapter.title}</p>}</div><div className="flex gap-2"><form action={setProgressFromForm.bind(null, id)}><input type="hidden" name="chapterNumber" value={number} /><Button size="sm" variant={number === currentNumber ? "default" : "outline"}>{number === currentNumber ? "Chapitre actuel" : "Définir ici"}</Button></form>{chapter ? <ExternalChapterLink chapterId={chapter.id} href={chapter.url} className="pr-4">Ouvrir</ExternalChapterLink> : canOpenInferred ? <Button size="sm" className="pr-4" asChild><a href={inferredUrl!} target="_blank" rel="noopener noreferrer">Ouvrir</a></Button> : null}</div></div>; })}</div></ScrollArea> : <p className="py-8 text-center text-sm text-muted-foreground">Aucun chapitre enregistré.</p>}
      </CardContent></Card>

      <div className="space-y-6">
        {(manga.cover_image_url || manga.synopsis || manga.genres?.length) && <Card><CardHeader><CardTitle>Informations AniList</CardTitle></CardHeader><CardContent className="space-y-4">{manga.cover_image_url && <img src={manga.cover_image_url} alt={`Couverture de ${manga.title}`} className="mx-auto max-h-64 rounded-lg object-cover" />}{manga.synopsis && <p className="text-sm text-muted-foreground">{manga.synopsis}</p>}<div className="flex flex-wrap gap-2">{manga.genres?.map((genre: string) => <Badge key={genre} variant="secondary">{genre}</Badge>)}</div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Format</dt><dd>{manga.format ?? "—"}</dd></div><div><dt className="text-muted-foreground">Statut</dt><dd>{manga.catalog_status ?? "—"}</dd></div><div><dt className="text-muted-foreground">Chapitres</dt><dd>{manga.catalog_chapters ?? "Inconnu"}</dd></div><div><dt className="text-muted-foreground">Volumes</dt><dd>{manga.catalog_volumes ?? "Inconnu"}</dd></div></dl>{manga.authors?.length > 0 && <p className="text-sm"><span className="text-muted-foreground">Auteurs : </span>{manga.authors.join(", ")}</p>}</CardContent></Card>}

        <Card><CardHeader><CardTitle>Votre progression</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Vous en êtes au</p><p className="mt-1 font-mono text-xl font-semibold">{currentNumber || "—"}</p></div><div className="rounded-lg bg-primary/10 p-3"><p className="text-xs text-muted-foreground">Disponibles après</p><p className="mt-1 font-mono text-xl font-semibold">{unreadAvailable}</p></div></div>{allNumbers.length > 0 && <form action={setProgressFromForm.bind(null, id)} className="mt-4 flex gap-2"><select name="chapterNumber" defaultValue={currentNumber || latestNumber} className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm">{[...allNumbers].reverse().map((number) => <option key={number} value={number}>Chapitre {number}</option>)}</select><Button size="sm">Enregistrer</Button></form>}</CardContent></Card>

        <Card><CardHeader><CardTitle>Note et catégories</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">
          <Dialog><DialogTrigger asChild><Button variant="outline" className="h-auto justify-start gap-3 p-4"><Star className="size-5" /><span className="text-left"><span className="block font-medium">Évaluation</span><span className="block text-xs text-muted-foreground">{manga.rating !== null ? `${manga.rating}/10` : "Non noté"}</span></span></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Votre évaluation</DialogTitle><DialogDescription>Attribuez une note au manga et ajoutez une note personnelle.</DialogDescription></DialogHeader><form action={updateMangaRating.bind(null, id)} className="space-y-4"><div><Label htmlFor="rating">Évaluation /10</Label><Input id="rating" name="rating" type="number" min="0" max="10" defaultValue={manga.rating ?? ""} className="mt-1" /></div><div><Label htmlFor="notes">Note personnelle</Label><Textarea id="notes" name="notes" defaultValue={manga.notes ?? ""} maxLength={5000} className="mt-1" /></div><DialogFooter><Button type="submit">Enregistrer</Button></DialogFooter></form></DialogContent></Dialog>
          <Dialog><DialogTrigger asChild><Button variant="outline" className="h-auto justify-start gap-3 p-4"><FolderPlus className="size-5" /><span className="min-w-0 text-left"><span className="block font-medium">Catégories</span><span className="block truncate text-xs text-muted-foreground">{selectedCategories.length ? selectedCategories.map((category) => category.name).join(", ") : "Aucune catégorie"}</span></span></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Catégories du manga</DialogTitle><DialogDescription>Classez ce manga dans une ou plusieurs catégories.</DialogDescription></DialogHeader><form action={updateMangaCategories.bind(null, id)} className="space-y-4"><div className="max-h-72 space-y-3 overflow-y-auto">{categories?.length ? categories.map((category) => <label key={category.id} className="flex items-center gap-3 text-sm"><Checkbox name="categoryIds" value={category.id} defaultChecked={selectedCategoryIds.has(category.id)} />{category.name}</label>) : <p className="text-sm text-muted-foreground">Créez d’abord une catégorie.</p>}</div><DialogFooter><Button type="submit">Enregistrer</Button></DialogFooter></form></DialogContent></Dialog>
        </div></CardContent></Card>
      </div>
    </div>
  </div>;
}
