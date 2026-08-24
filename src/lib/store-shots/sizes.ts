export const STORE_FORMATS = {
  play: { id: "play", label: "Google Play phone", width: 1080, height: 1920, hint: "9:16 phone, 1080 x 1920" },
  apple: { id: "apple", label: "App Store iPhone", width: 1290, height: 2796, hint: "6.7 inch, 1290 x 2796" },
} as const;

export type StoreId = keyof typeof STORE_FORMATS;

export function storeSize(id: string) {
  return STORE_FORMATS[id as StoreId] ?? STORE_FORMATS.play;
}
