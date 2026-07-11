"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
export function CheckButton({ id }: { id: string }) { const [pending, setPending] = useState(false); const router = useRouter(); async function run() { setPending(true); try { const response = await fetch(`/api/mangas/${id}/check`, { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.message || result.error || "Vérification impossible"); toast.success(result.status === "new_chapter" ? "Nouveau chapitre détecté !" : result.status === "ambiguous" ? "Résultat ambigu : vérification manuelle nécessaire." : "Aucun nouveau chapitre."); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Vérification impossible"); } finally { setPending(false); } } return <Button variant="outline" onClick={run} disabled={pending}><RefreshCw className={pending ? "animate-spin" : ""} />{pending ? "Vérification…" : "Vérifier"}</Button>; }
