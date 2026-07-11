import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = { title: { default: "Manga Tracker", template: "%s · Manga Tracker" }, description: "Suivez vos mangas et leurs nouveaux chapitres.", applicationName: "Manga Tracker" };
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fafafa" }, { media: "(prefers-color-scheme: dark)", color: "#09090b" }], width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}><body><AppProviders>{children}</AppProviders></body></html>;
}
