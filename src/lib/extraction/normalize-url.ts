import dns from "node:dns/promises";
import { isIP } from "node:net";

const blockedHostnames = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);
const allowedPorts = new Set(["", "80", "443"]);

function isPrivateIp(ip: string) {
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

export function normalizeUrl(input: string) {
  if (input.length > 2048) throw new Error("URL trop longue");
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Seules les URL HTTP(S) sont acceptées");
  if (url.username || url.password) throw new Error("Les identifiants intégrés sont interdits");
  if (!allowedPorts.has(url.port)) throw new Error("Port non autorisé");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  return url;
}

export async function assertPublicUrl(input: string) {
  const url = normalizeUrl(input);
  if (blockedHostnames.has(url.hostname) || url.hostname.endsWith(".local")) throw new Error("Hôte privé interdit");
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error("Adresse réseau privée ou réservée interdite");
  return url;
}
