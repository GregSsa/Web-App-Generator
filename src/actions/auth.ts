"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; success?: string };
export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) });
  if (error) return { error: "E-mail ou mot de passe incorrect." };
  redirect("/dashboard");
}
export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: String(formData.get("email")), password: String(formData.get("password")), options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback` } });
  return error ? { error: error.message } : { success: "Consultez votre boîte e-mail pour confirmer l’inscription." };
}
export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(String(formData.get("email")), { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/settings` });
  return error ? { error: error.message } : { success: "Un lien de récupération a été envoyé." };
}
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/"); }
