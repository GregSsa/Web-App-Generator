import { assertPublicUrl } from "./normalize-url";

const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

export async function fetchPage(input: string) {
  let url = await assertPublicUrl(input);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "MangaTracker/1.0 (+personal metadata tracker)", accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("Trop de redirections");
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Source indisponible (${response.status})`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) throw new Error("La ressource n'est pas une page HTML");
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new Error("Page trop volumineuse");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Réponse vide");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new Error("Page trop volumineuse"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { html: new TextDecoder().decode(bytes), finalUrl: url.toString() };
  }
  throw new Error("Redirection invalide");
}
