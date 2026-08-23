import { hashSeed } from "@/lib/utils";

export type PortraitTraits = {
  seed: string;
  gender: string;
  skinTone: string;
  hair: string;
  clothingStyle: string;
  region?: string;
  studioStyle?: string;
};

const SKIN: Record<string, [string, string]> = {
  "Deep mahogany": ["#3b2418", "#6a3d28"],
  "Rich espresso": ["#2a1a12", "#5a3824"],
  "Deep umber": ["#2c1810", "#5c3322"],
  "Deep bronze": ["#4a2a16", "#8a5330"],
  "Medium espresso": ["#4b2d1c", "#8d5534"],
  "Deep cocoa": ["#3a2218", "#704536"],
  "Warm olive": ["#8d6239", "#c4925a"],
  "Medium bronze": ["#8a5a32", "#c4894c"],
  "Honey olive": ["#a26b3e", "#d4a06a"],
  "Sun-warmed olive": ["#b07848", "#e0ae74"],
  "Warm tan": ["#b07848", "#e2b07a"],
  "Golden caramel": ["#a86638", "#d99258"],
  "Light gold": ["#d4a574", "#f0c8a0"],
  "Light olive": ["#c49a6c", "#e8c49a"],
  "Porcelain peach": ["#f0c8b0", "#ffe6d4"],
  "Ivory rose": ["#efcfc0", "#ffe9de"],
  "Light neutral": ["#e0b898", "#f6dcc4"],
  "Fair warm": ["#efccb0", "#ffe8d4"],
  "Fair cool": ["#ecd4c4", "#fff1e8"],
  "Fair neutral": ["#e8c8b0", "#f8e0cc"],
};

function tone(traits: PortraitTraits): [string, string] {
  if (SKIN[traits.skinTone]) return SKIN[traits.skinTone];
  const keys = Object.keys(SKIN);
  return SKIN[keys[hashSeed(traits.skinTone + traits.seed) % keys.length]];
}

function hairColor(traits: PortraitTraits) {
  const h = traits.hair.toLowerCase();
  if (h.includes("blonde") || h.includes("ash blonde")) return "#d9c08a";
  if (h.includes("auburn")) return "#8a3b22";
  if (h.includes("silver") || h.includes("salt")) return "#c5c1b8";
  if (h.includes("chestnut") || h.includes("brown") || h.includes("wavy")) return "#4a2f1c";
  return "#1a120e";
}

function clothColor(traits: PortraitTraits) {
  const c = `${traits.clothingStyle} ${traits.studioStyle ?? ""}`.toLowerCase();
  if (c.includes("gold") || c.includes("ivory") || c.includes("cream") || c.includes("bone")) return ["#efe4c8", "#c9a45a"];
  if (c.includes("emerald") || c.includes("sage")) return ["#1f4a3a", "#7ea48a"];
  if (c.includes("blush") || c.includes("rose") || c.includes("terracotta")) return ["#8a3d45", "#e8a8a0"];
  if (c.includes("navy") || c.includes("charcoal") || c.includes("ink") || c.includes("black")) return ["#1a1f2c", "#8d93a6"];
  if (c.includes("saffron") || c.includes("kente")) return ["#c46a1a", "#f0c36a"];
  return ["#2a2438", "#d4a853"];
}

export function portraitSvg(traits: PortraitTraits, size = 640, name = "") {
  const [skinA, skinB] = tone(traits);
  const hair = hairColor(traits);
  const [cloth, accent] = clothColor(traits);
  const seed = hashSeed(traits.seed + name);
  const female = traits.gender !== "male";
  const faceW = female ? 168 : 178;
  const faceH = female ? 214 : 224;
  const jaw = female ? 78 : 70;
  const studio = traits.studioStyle ?? "Premium dark studio";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800" width="${size}" height="${Math.round(size * 1.25)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14141f"/>
      <stop offset="100%" stop-color="#07070b"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skinB}"/>
      <stop offset="100%" stop-color="${skinA}"/>
    </linearGradient>
    <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${cloth}"/>
      <stop offset="100%" stop-color="#0c0c12"/>
    </linearGradient>
  </defs>
  <rect width="640" height="800" fill="url(#bg)"/>
  <rect width="640" height="800" fill="url(#spot)"/>
  <text x="40" y="56" fill="#d4a853" font-size="11" font-family="Georgia, serif" letter-spacing="3">${escapeXml(studio.toUpperCase())}</text>

  <!-- shoulders / clothing -->
  <ellipse cx="320" cy="780" rx="230" ry="160" fill="url(#cloth)"/>
  <path d="M170 690 C210 620, 430 620, 470 690 L510 800 L130 800 Z" fill="${cloth}"/>
  <path d="M300 640 L320 800 L340 640" fill="${accent}" opacity="0.55"/>

  <!-- neck -->
  <rect x="292" y="430" width="56" height="90" rx="20" fill="url(#skin)"/>

  <!-- ears -->
  <ellipse cx="${320 - faceW / 2 + 8}" cy="360" rx="16" ry="26" fill="${skinB}"/>
  <ellipse cx="${320 + faceW / 2 - 8}" cy="360" rx="16" ry="26" fill="${skinB}"/>

  <!-- face -->
  <path d="M${320 - faceW / 2} 300
           C${320 - faceW / 2} 220, ${320 - 40} 190, 320 190
           C${320 + 40} 190, ${320 + faceW / 2} 220, ${320 + faceW / 2} 300
           C${320 + faceW / 2} 390, ${320 + jaw} 450, 320 ${190 + faceH}
           C${320 - jaw} 450, ${320 - faceW / 2} 390, ${320 - faceW / 2} 300 Z" fill="url(#skin)"/>

  ${hairSvg(traits, hair, female)}
  ${faceFeatures(seed, female, skinA)}
</svg>`;
}

function hairSvg(traits: PortraitTraits, color: string, female: boolean) {
  const h = traits.hair.toLowerCase();
  if (h.includes("hijab") || h.includes("scarf") || h.includes("wrapped")) {
    return `<path d="M150 250 C160 160, 480 160, 490 260 C500 360, 470 430, 430 460 L210 460 C170 430, 140 350, 150 250 Z" fill="${color === "#1a120e" ? "#c9a6b0" : color}"/>
            <path d="M200 250 C220 200, 420 200, 440 260 C430 300, 210 300, 200 250 Z" fill="#1a120e" opacity="0.15"/>`;
  }
  if (h.includes("braid") || h.includes("crown") || h.includes("coils") || h.includes("twists") || h.includes("halo")) {
    return `<path d="M170 250 C180 170, 460 170, 470 260 C480 200, 160 200, 170 250 Z" fill="${color}"/>
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${200 + i * 34}" cy="${228 + (i % 2) * 8}" r="16" fill="${color}"/>`).join("")}
            ${female ? `<path d="M175 280 C150 360, 170 520, 200 600" stroke="${color}" stroke-width="22" fill="none"/>` : ""}`;
  }
  if (h.includes("bob") || h.includes("fringe")) {
    return `<path d="M178 240 C190 160, 450 160, 462 250 C470 340, 450 390, 430 400 L210 400 C190 380, 170 320, 178 240 Z" fill="${color}"/>
            <path d="M220 205 C260 230, 380 230, 420 205 L400 250 L240 250 Z" fill="${color}"/>`;
  }
  if (h.includes("chignon") || h.includes("parted") || h.includes("swept") || !female) {
    return `<path d="M186 250 C200 175, 440 175, 454 255 C430 220, 210 220, 186 250 Z" fill="${color}"/>
            ${h.includes("beard") || h.includes("fade") ? `<path d="M240 430 C260 470, 380 470, 400 430 C370 455, 270 455, 240 430 Z" fill="${color}" opacity="0.7"/>` : ""}`;
  }
  return `<path d="M160 270 C170 150, 470 150, 480 280 C500 420, 470 560, 430 620 L400 520 C430 400, 210 400, 240 520 L210 620 C170 540, 145 400, 160 270 Z" fill="${color}"/>`;
}

function faceFeatures(seed: number, female: boolean, shadow: string) {
  const eyeY = 330;
  const eyeGap = female ? 46 : 50;
  const brow = female ? -16 : -14;
  return `
    <path d="M250 ${eyeY + brow} C270 ${eyeY + brow - 8}, 300 ${eyeY + brow - 4}, 310 ${eyeY + brow + 2}" stroke="#1a120e" stroke-width="3" fill="none"/>
    <path d="M330 ${eyeY + brow + 2} C350 ${eyeY + brow - 4}, 380 ${eyeY + brow - 8}, 400 ${eyeY + brow}" stroke="#1a120e" stroke-width="3" fill="none"/>
    <ellipse cx="${320 - eyeGap}" cy="${eyeY}" rx="${female ? 16 : 15}" ry="8" fill="#f5efe6"/>
    <ellipse cx="${320 + eyeGap}" cy="${eyeY}" rx="${female ? 16 : 15}" ry="8" fill="#f5efe6"/>
    <circle cx="${320 - eyeGap}" cy="${eyeY}" r="6" fill="#1c140e"/>
    <circle cx="${320 + eyeGap}" cy="${eyeY}" r="6" fill="#1c140e"/>
    <circle cx="${320 - eyeGap - 2}" cy="${eyeY - 2}" r="2" fill="#fff"/>
    <circle cx="${320 + eyeGap - 2}" cy="${eyeY - 2}" r="2" fill="#fff"/>
    <path d="M320 348 L312 390 L328 390 Z" fill="${shadow}" opacity="0.25"/>
    <path d="M300 418 C320 432, 340 432, 360 418" stroke="#6a3a36" stroke-width="${female ? 4 : 5}" fill="none" stroke-linecap="round"/>
    <ellipse cx="320" cy="500" rx="90" ry="18" fill="#000" opacity="0.18"/>
  `;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function traitsFromPresenter(p: {
  name: string;
  gender: string;
  skinTone: string;
  hair: string;
  clothingStyle: string;
  portraitSeed: string;
  studioStyle?: string | null;
  region?: string | null;
}) {
  return {
    seed: p.portraitSeed,
    gender: p.gender,
    skinTone: p.skinTone,
    hair: p.hair,
    clothingStyle: p.clothingStyle,
    region: p.region ?? undefined,
    studioStyle: p.studioStyle ?? undefined,
    name: p.name,
  };
}

export function portraitDataUri(p: Parameters<typeof traitsFromPresenter>[0]) {
  const traits = traitsFromPresenter(p);
  return `data:image/svg+xml;utf8,${encodeURIComponent(portraitSvg(traits, 640, p.name))}`;
}

export function portraitSrc(
  p: Parameters<typeof traitsFromPresenter>[0] & { portraitUrl?: string | null },
) {
  return p.portraitUrl || portraitDataUri(p);
}
