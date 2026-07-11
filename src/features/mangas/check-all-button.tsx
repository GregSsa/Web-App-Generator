"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CheckAllResult = { processed: number; newChapters: number; failed: number; rateLimited: number };

export function CheckAllButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function checkAll() {
    setPending(true);
    try {
      const response = await fetch("/api/mangas/check-all", { method: "POST" });
      const result = (await response.json()) as CheckAllResult & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Vérification impossible");
      if (result.newChapters > 0) toast.success(`${result.newChapters} manga${result.newChapters > 1 ? "s" : ""} avec un nouveau chapitre.`);
      else if (result.failed > 0) toast.error(`${result.failed} vérification${result.failed > 1 ? "s" : ""} ont échoué.`);
      else if (result.rateLimited === result.processed) toast.message("Tous les mangas ont déjà été vérifiés il y a moins d’une minute.");
      else toast.success("Bibliothèque vérifiée : aucun nouveau chapitre.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification impossible");
    } finally {
      setPending(false);
    }
  }

  return <Button variant="outline" onClick={checkAll} disabled={pending}><RefreshCw className={pending ? "animate-spin" : ""} />{pending ? "Vérification…" : "Vérifier les mises à jour"}</Button>;
}
