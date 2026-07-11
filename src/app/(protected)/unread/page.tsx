import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalChapterLink } from "@/features/mangas/external-chapter-link";

export default async function UnreadPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("chapters").select("id,number_label,title,url,detected_at,manga_id,mangas(title,source_name)").eq("user_id", user.id).eq("is_read", false).order("detected_at", { ascending: false }).limit(100);
  return <div><h1 className="text-2xl font-semibold tracking-tight">Chapitres non lus</h1><p className="mt-1 mb-6 text-sm text-muted-foreground">Les sorties les plus récentes en premier.</p>{data?.length ? <div className="space-y-3">{data.map((chapter) => { const manga = Array.isArray(chapter.mangas) ? chapter.mangas[0] : chapter.mangas; return <Card key={chapter.id}><CardContent className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><Link href={`/mangas/${chapter.manga_id}`} className="font-medium hover:text-primary">{manga?.title}</Link><p className="truncate text-sm text-muted-foreground">{chapter.number_label}{chapter.title ? ` · ${chapter.title}` : ""}</p></div><ExternalChapterLink chapterId={chapter.id} href={chapter.url}>Lire</ExternalChapterLink></CardContent></Card>; })}</div> : <div className="grid min-h-72 place-items-center rounded-xl border border-dashed text-center"><div><BookOpen className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">Vous êtes à jour</p><p className="text-sm text-muted-foreground">Aucun chapitre non lu.</p></div></div>}</div>;
}
