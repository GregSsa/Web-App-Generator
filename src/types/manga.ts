export const mangaStatuses = ["reading", "planned", "paused", "completed", "dropped"] as const;
export type MangaStatus = (typeof mangaStatuses)[number];

export type ChapterMetadata = {
  number: number | null;
  label: string | null;
  title: string | null;
  url: string | null;
  publishedAt: string | null;
};

export type ExtractedMangaMetadata = {
  mangaTitle: string | null;
  canonicalUrl: string | null;
  sourceName: string | null;
  latestChapter: ChapterMetadata | null;
  confidence: number;
  warnings: string[];
};

export type CheckResultStatus = "unchanged" | "new_chapter" | "ambiguous" | "failed" | "rate_limited";

export type MangaListItem = {
  id: string;
  title: string;
  source_name: string;
  status: MangaStatus;
  rating: number | null;
  notifications_enabled: boolean;
  last_checked_at: string | null;
  last_check_status: string | null;
  cover_image_url?: string | null;
  chapters?: { id: string; number_label: string; number_normalized: number | null; url: string; detected_at: string }[];
  reading_progress?: { last_read_number: number | null }[];
};
