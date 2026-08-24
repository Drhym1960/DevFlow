export const STORE_FORMATS = {
  apple: {
    id: "apple",
    label: "App Store iPhone 16 Pro Max",
    width: 1320,
    height: 2868,
    hint: "6.9 inch, 1320 x 2868",
  },
  apple16: {
    id: "apple16",
    label: "App Store iPhone 16",
    width: 1179,
    height: 2556,
    hint: "6.3 inch, 1179 x 2556",
  },
  play: { id: "play", label: "Google Play phone", width: 1080, height: 1920, hint: "9:16 phone, 1080 x 1920" },
} as const;

export type StoreId = keyof typeof STORE_FORMATS;

export function storeSize(id: string) {
  return STORE_FORMATS[id as StoreId] ?? STORE_FORMATS.apple;
}
