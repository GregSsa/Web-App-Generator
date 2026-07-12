import { describe, expect, it } from "vitest";
import { identifyMangaUrlLocally } from "@/lib/extraction/identify-url";

describe("URL-only manga identification", () => {
  it("identifies MangaKakalot chapter URLs", () => {
    const result = identifyMangaUrlLocally("https://www.mangakakalot.gg/manga/aero/chapter-1");
    expect(result.sourceName).toBe("Mangakakalot");
    expect(result.mangaTitle).toBe("Aero");
    expect(result.currentChapter?.number).toBe(1);
    expect(result.canonicalUrl).toBe("https://www.mangakakalot.gg/manga/aero");
  });

  it("identifies MangaKatana compact chapter URLs", () => {
    const result = identifyMangaUrlLocally("https://mangakatana.com/manga/countach.661/c263");
    expect(result.sourceName).toBe("Mangakatana");
    expect(result.mangaTitle).toBe("Countach");
    expect(result.currentChapter?.number).toBe(263);
    expect(result.canonicalUrl).toBe("https://mangakatana.com/manga/countach.661");
  });

  it("identifies split chapter paths used by Asura", () => {
    const result = identifyMangaUrlLocally("https://asurascans.com/comics/dungeon-odyssey/chapter/15");
    expect(result.mangaTitle).toBe("Dungeon Odyssey");
    expect(result.currentChapter?.number).toBe(15);
    expect(result.canonicalUrl).toBe("https://asurascans.com/comics/dungeon-odyssey");
  });
});
