"use client";

import { Trash2 } from "lucide-react";
import { deleteManga } from "@/actions/mangas";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteMangaButton({ mangaId, title }: { mangaId: string; title: string }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 />Supprimer</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer « {title} » ?</AlertDialogTitle><AlertDialogDescription>Cette action supprimera la fiche, la progression, les chapitres enregistrés, les catégories associées, les notifications et les journaux de vérification.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><form action={deleteManga.bind(null, mangaId)}><AlertDialogAction variant="destructive" type="submit">Supprimer définitivement</AlertDialogAction></form></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
