"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Folder, Home, Library, Medal, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [{ href: "/dashboard", label: "Accueil", icon: Home }, { href: "/unread", label: "Non lus", icon: BookOpen }, { href: "/mangas", label: "Bibliothèque", icon: Library }, { href: "/categories", label: "Catégories", icon: Folder }, { href: "/ranking", label: "Classement", icon: Medal }, { href: "/settings", label: "Paramètres", icon: Settings }];
export function AppNavigation({ mobile = false }: { mobile?: boolean }) { const pathname = usePathname(); return <>{links.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href === "/mangas" && pathname.startsWith("/mangas/")); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={mobile ? cn("flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[10px]", active ? "text-primary" : "text-muted-foreground") : cn(buttonVariants({ variant: active ? "secondary" : "ghost" }), "w-full justify-start", active && "font-semibold")}><Icon className="size-4 shrink-0" /><span className="truncate">{label}</span></Link>; })}</>; }
