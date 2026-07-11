import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "./env";
import { createClient } from "./server";

export async function getUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
