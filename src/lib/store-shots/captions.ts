/** Pair each original app screen with a marketing line. Never invent UI. */

export function captionsForScreens(input: {
  appName: string;
  notes: string;
  screens: number;
  captions?: string[];
}) {
  const supplied = (input.captions ?? []).map((s) => s.trim()).filter(Boolean);
  const name = input.appName.trim() || "the app";
  const notes = input.notes.trim();
  const fallbacks = [
    notes ? firstSentence(notes) : `See ${name} the way your customers will.`,
    `Your real screens. Framed for the store.`,
    `Open ${name} and get started in a tap.`,
    `Built around what you already shipped.`,
    `The product, not a redraw of the product.`,
  ];
  const lines: { headline: string; sub: string }[] = [];
  for (let i = 0; i < Math.max(1, input.screens); i++) {
    const headline = supplied[i] || fallbacks[i % fallbacks.length];
    const sub = i === 0 && notes && supplied[i] ? firstSentence(notes) : name;
    lines.push({ headline: clip(headline, 72), sub: clip(sub, 48) });
  }
  return lines;
}

function firstSentence(text: string) {
  const part = text.split(/[.\n]/)[0]?.trim() ?? text;
  return clip(part, 72);
}

function clip(text: string, n: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trim()}…`;
}
