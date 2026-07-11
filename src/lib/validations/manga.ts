import { z } from "zod";
import { mangaStatuses } from "@/types/manga";

export const chapterMetadataSchema = z.object({
  number: z.number().finite().nonnegative().nullable(),
  label: z.string().max(100).nullable(),
  title: z.string().max(300).nullable(),
  url: z.url().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});

export const extractedMangaMetadataSchema = z.object({
  mangaTitle: z.string().min(1).max(300).nullable(),
  canonicalUrl: z.url().nullable(),
  sourceName: z.string().min(1).max(120).nullable(),
  latestChapter: chapterMetadataSchema.nullable(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().max(300)).max(20),
});

export const extractRequestSchema = z.object({ url: z.url().max(2048) });
export const mangaFormSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire").max(300),
  canonicalUrl: z.url("URL invalide").max(2048),
  sourceName: z.string().trim().min(1).max(120),
  status: z.enum(mangaStatuses).default("reading"),
  notificationsEnabled: z.boolean().default(false),
  notes: z.string().max(5000).default(""),
  rating: z.coerce.number().int().min(0).max(10).nullable().default(null),
  chapterLabel: z.string().max(100).optional(),
  chapterNumber: z.coerce.number().nonnegative().nullable().optional(),
  chapterTitle: z.string().max(300).optional(),
  chapterUrl: z.union([z.literal(""), z.url().max(2048)]).optional(),
  latestChapterLabel: z.string().max(100).optional(),
  latestChapterNumber: z.coerce.number().nonnegative().nullable().optional(),
  latestChapterUrl: z.union([z.literal(""), z.url().max(2048)]).optional(),
});
