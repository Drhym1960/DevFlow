export async function fetchSiteContext(url?: string | null) {
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "DevFlowStudio/0.1" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
    const desc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ??
      "";
    const text = `${title}. ${desc}`.replace(/\s+/g, " ").trim();
    return text.slice(0, 500);
  } catch {
    return "";
  }
}
