"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthState } from "@/actions/auth";
export function AuthForm({ action, mode }: { action: (state: AuthState, data: FormData) => Promise<AuthState>; mode: "login" | "signup" | "forgot" }) {
  const [state, formAction, pending] = useActionState(action, {});
  const labels = mode === "login" ? ["Connexion", "Se connecter"] : mode === "signup" ? ["Créer votre espace", "S’inscrire"] : ["Mot de passe oublié", "Envoyer le lien"];
  return <form action={formAction} className="space-y-4"><div><Label htmlFor="email">Adresse e-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required className="mt-1" /></div>{mode !== "forgot" && <div><Label htmlFor="password">Mot de passe</Label><Input id="password" name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required className="mt-1" /></div>}{state.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}{state.success && <Alert><AlertDescription>{state.success}</AlertDescription></Alert>}<Button className="w-full" disabled={pending}>{pending ? "Veuillez patienter…" : labels[1]}</Button>{mode === "login" && <div className="flex justify-between text-sm"><Link href="/signup" className="text-primary hover:underline">Créer un compte</Link><Link href="/forgot-password" className="text-muted-foreground hover:underline">Mot de passe oublié</Link></div>}</form>;
}
