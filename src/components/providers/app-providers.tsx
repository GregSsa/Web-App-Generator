"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
export function AppProviders({ children }: { children: React.ReactNode }) { return <ThemeProvider attribute="class" defaultTheme="system" enableSystem><TooltipProvider>{children}<Toaster richColors position="top-center" /><ServiceWorkerRegistration /></TooltipProvider></ThemeProvider>; }
