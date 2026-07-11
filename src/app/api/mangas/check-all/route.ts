import { NextResponse } from "next/server";
import { checkManga } from "@/lib/extraction/check-manga";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await createClient();
  const { data: mangas, error } = await supabase
    .from("mangas")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: "Impossible de charger la bibliothèque." }, { status: 500 });

  const summary = { processed: 0, newChapters: 0, unchanged: 0, ambiguous: 0, failed: 0, rateLimited: 0 };
  for (const manga of mangas ?? []) {
    const result = await checkManga(manga.id, user.id, supabase);
    summary.processed += 1;
    if (result.status === "new_chapter") summary.newChapters += 1;
    if (result.status === "unchanged") summary.unchanged += 1;
    if (result.status === "ambiguous") summary.ambiguous += 1;
    if (result.status === "failed") summary.failed += 1;
    if (result.status === "rate_limited") summary.rateLimited += 1;
    await pause(250);
  }

  return NextResponse.json(summary);
}
