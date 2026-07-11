import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deriveChapterUrl } from "@/lib/extraction/chapter-url";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";

export default async function UnreadPage() {
  const user = await requireUser(); const supabase = await createClient();
  const { data } = await supabase.from("mangas").select("id,title,chapters(id,number_label,number_normalized,url,detected_at),reading_progress(last_read_number)").eq("user_id", user.id).is("archived_at", null).limit(100);
  const unread = (data ?? []).map((manga) => { const latest = [...(manga.chapters ?? [])].sort((a, b) => (b.number_normalized ?? -1) - (a.number_normalized ?? -1))[0]; const read = manga.reading_progress?.[0]?.last_read_number ?? null; const count = latest?.number_normalized !== null && latest?.number_normalized !== undefined && read !== null ? Math.max(0, Math.floor(latest.number_normalized - read)) : 0; return { manga, latest, read, count }; }).filter((entry) => entry.latest && entry.count > 0);
  return <div><h1 className="text-2xl font-semibold tracking-tight">Chapitres non lus</h1><p className="mt-1 mb-6 text-sm text-muted-foreground">Un manga apparaît dès qu’un chapitre disponible est postérieur à votre progression.</p>{unread.length ? <div className="space-y-3">{unread.map(({ manga, latest, read, count }) => { const nextNumber = (read ?? 0) + 1; const nextUrl = deriveChapterUrl(latest!.url, latest!.number_normalized, nextNumber); return <Card key={manga.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="min-w-0"><Link href={`/mangas/${manga.id}`} className="font-medium hover:text-primary">{manga.title}</Link><p className="truncate text-sm text-muted-foreground">Prochain : chapitre {nextNumber} · {count} disponible{count > 1 ? "s" : ""}</p></div><ExternalChapterLink chapterId={latest!.id} href={nextUrl} markReadNumber={nextNumber}>Lire</ExternalChapterLink></CardContent></Card>; })}</div> : <div className="grid min-h-72 place-items-center rounded-xl border border-dashed text-center"><div><BookOpen className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">Vous êtes à jour</p><p className="text-sm text-muted-foreground">Lancez une vérification pour rechercher les sorties.</p></div></div>}</div>;
}
