import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const requested = z.object({ markReadNumber: z.number().nonnegative().nullable().optional() }).safeParse(await _.json().catch(() => ({})));
  const supabase = await createClient();
  const { data: chapter } = await supabase.from("chapters").select("id,manga_id,number_normalized").eq("id", id).eq("user_id", user.id).single();
  if (!chapter) return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });
  const markReadNumber = requested.success && requested.data.markReadNumber !== null && requested.data.markReadNumber !== undefined && chapter.number_normalized !== null ? Math.min(requested.data.markReadNumber, chapter.number_normalized) : chapter.number_normalized;
  if (markReadNumber !== null) {
    await supabase.from("chapters").update({ is_read: true }).eq("manga_id", chapter.manga_id).eq("user_id", user.id).lte("number_normalized", chapter.number_normalized);
  } else {
    await supabase.from("chapters").update({ is_read: true }).eq("id", chapter.id).eq("user_id", user.id);
  }
  await supabase.from("reading_progress").upsert({ user_id: user.id, manga_id: chapter.manga_id, last_read_chapter_id: chapter.id, last_read_number: markReadNumber }, { onConflict: "user_id,manga_id" });
  return NextResponse.json({ ok: true });
}
