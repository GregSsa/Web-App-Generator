"use client";
import { Bell, BellOff } from "lucide-react";
import { useTransition } from "react";
import { toggleMangaNotifications } from "@/actions/mangas";
import { Button } from "@/components/ui/button";
export function NotificationToggle({ mangaId, enabled }: { mangaId: string; enabled: boolean }) { const [pending, startTransition] = useTransition(); return <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={enabled ? "Désactiver les notifications" : "Activer les notifications"} onClick={() => startTransition(() => toggleMangaNotifications(mangaId, !enabled))}>{enabled ? <Bell className="text-primary" /> : <BellOff />}</Button>; }
