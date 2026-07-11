"use client";

import type { ComponentProps } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExternalChapterLinkProps = {
  chapterId: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  markReadNumber?: number | null;
} & Omit<ComponentProps<"a">, "href" | "children" | "className">;

export function ExternalChapterLink({ chapterId, href, children, className, size = "sm", markReadNumber, onClick, ...props }: ExternalChapterLinkProps) {
  function markOpened() {
    fetch(`/api/chapters/${chapterId}/open`, { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ markReadNumber }) }).catch(() => toast.error("La progression sera synchronisée au prochain rafraîchissement."));
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size }), className)} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) markOpened(); }} {...props}>{children}</a>;
}
