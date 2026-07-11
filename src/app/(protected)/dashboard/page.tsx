import Link from "next/link";
import { BookOpen, CheckCircle2, Library, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";
import { CheckAllButton } from "@/features/mangas/check-all-button";

type DashboardChapter = { id: string; number_label: string; number_normalized: number | null; title: string | null; url: string; detected_at: string; is_read: boolean };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ count: readingCount }, { count: completedCount }, { count: libraryCount }, { data: mangaRows }] = await Promise.all([
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "reading").is("archived_at", null),
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed").is("archived_at", null),
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("archived_at", null),
    supabase.from("mangas").select("id,title,chapters(id,number_label,number_normalized,title,url,detected_at,is_read),reading_progress(last_read_number)").eq("user_id", user.id).is("archived_at", null).limit(50),
  ]);

  const nextReads = (mangaRows ?? []).flatMap((manga) => {
    const chapters = ([...(manga.chapters ?? [])] as DashboardChapter[]).filter((chapter) => chapter.number_normalized !== null).sort((a, b) => Number(a.number_normalized) - Number(b.number_normalized));
    const progress = Array.isArray(manga.reading_progress) ? manga.reading_progress[0] : manga.reading_progress;
    const highestRead = chapters.filter((chapter) => chapter.is_read).reduce((highest, chapter) => Math.max(highest, Number(chapter.number_normalized)), 0);
    const currentNumber = Number(progress?.last_read_number ?? highestRead);
    const unread = chapters.filter((chapter) => Number(chapter.number_normalized) > currentNumber);
    const next = unread[0];
    return next ? [{ mangaId: manga.id, mangaTitle: manga.title, chapter: next, unreadCount: unread.length }] : [];
  }).sort((a, b) => new Date(b.chapter.detected_at).getTime() - new Date(a.chapter.detected_at).getTime()).slice(0, 6);

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Bonjour</h1><p className="mt-1 text-sm text-muted-foreground">Votre prochaine lecture est prête.</p></div><div className="flex flex-wrap gap-2"><CheckAllButton /><Link href="/mangas/new" className={buttonVariants()}><Plus />Ajouter un manga</Link></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric title="À continuer" value={readingCount ?? 0} icon={BookOpen} /><Metric title="Terminés" value={completedCount ?? 0} icon={CheckCircle2} /><Metric title="Dans la bibliothèque" value={libraryCount ?? 0} icon={Library} /></div>
    <Card className="mt-6"><CardHeader><CardTitle>Derniers chapitres détectés</CardTitle></CardHeader><CardContent>{nextReads.length ? <ul className="divide-y">{nextReads.map(({ mangaId, mangaTitle, chapter, unreadCount }) => <li key={mangaId} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><Link href={`/mangas/${mangaId}`} className="font-medium hover:text-primary">{mangaTitle}</Link><div className="mt-1 flex flex-wrap items-center gap-2"><p className="truncate text-sm text-muted-foreground">Prochain : {chapter.number_label}{chapter.title ? ` · ${chapter.title}` : ""}</p><Badge variant="secondary">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</Badge></div></div><ExternalChapterLink chapterId={chapter.id} href={chapter.url} className="pr-4">Lire</ExternalChapterLink></li>)}</ul> : <p className="py-10 text-center text-sm text-muted-foreground">Aucun chapitre en attente de lecture.</p>}</CardContent></Card>
  </div>;
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Library }) {
  return <Card><CardContent className="flex min-w-0 items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="truncate text-sm text-muted-foreground">{title}</p><p className="mt-1 font-mono text-3xl font-semibold">{value}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span></CardContent></Card>;
}
