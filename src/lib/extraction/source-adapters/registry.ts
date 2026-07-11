import { genericAdapter } from "./generic";
import type { SourceAdapter } from "./types";

const adapters: SourceAdapter[] = [];
export function getAdapter(hostname: string) { return adapters.find((adapter) => adapter.supports(hostname)) ?? genericAdapter; }
export function registerAdapter(adapter: SourceAdapter) { adapters.push(adapter); }
