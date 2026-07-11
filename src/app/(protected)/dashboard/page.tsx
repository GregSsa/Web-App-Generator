import Link from "next/link";
import { BookOpen, CheckCircle2, Library, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";

export default async function DashboardPage() {
  const user = await requireUser(); const supabase = await createClient();
  const [{ count: readingCount }, { count: completedCount }, { count: libraryCount }, { data: recent }] = await Promise.all([
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "reading").is("archived_at", null),
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed").is("archived_at", null),
    supabase.from("mangas").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("archived_at", null),
    supabase.from("chapters").select("id,number_label,title,url,detected_at,manga_id,mangas(id,title)").eq("user_id", user.id).eq("is_read", false).order("detected_at", { ascending: false }).limit(6),
  ]);
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Bonjour</h1><p className="mt-1 text-sm text-muted-foreground">Votre prochaine lecture est prête.</p></div><Link href="/mangas/new" className={buttonVariants()}><Plus />Ajouter un manga</Link></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric title="À continuer" value={readingCount ?? 0} icon={BookOpen} /><Metric title="Terminés" value={completedCount ?? 0} icon={CheckCircle2} /><Metric title="Dans la bibliothèque" value={libraryCount ?? 0} icon={Library} /></div><Card className="mt-6"><CardHeader><CardTitle>Derniers chapitres détectés</CardTitle></CardHeader><CardContent>{recent?.length ? <ul className="divide-y">{recent.map((chapter) => { const manga = Array.isArray(chapter.mangas) ? chapter.mangas[0] : chapter.mangas; return <li key={chapter.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><Link href={`/mangas/${chapter.manga_id}`} className="font-medium hover:text-primary">{manga?.title ?? "Manga"}</Link><p className="truncate text-sm text-muted-foreground">{chapter.number_label}{chapter.title ? ` · ${chapter.title}` : ""}</p></div><ExternalChapterLink chapterId={chapter.id} href={chapter.url}>Lire</ExternalChapterLink></li>; })}</ul> : <p className="py-10 text-center text-sm text-muted-foreground">Les prochains chapitres à lire apparaîtront ici.</p>}</CardContent></Card></div>;
}
function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Library }) { return <Card><CardContent className="flex min-w-0 items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="truncate text-sm text-muted-foreground">{title}</p><p className="mt-1 font-mono text-3xl font-semibold">{value}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span></CardContent></Card>; }
