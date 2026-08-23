export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatList(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export function uniqueSlug(base: string, extra: string) {
  return `${slugify(base)}-${slugify(extra).slice(0, 8) || Date.now().toString(36)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(items: T[], seed: number) {
  return items[seed % items.length];
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (m) => m.toUpperCase());
}
