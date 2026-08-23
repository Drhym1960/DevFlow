import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { storage } from "@/lib/ai/registry";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { path: parts } = await params;
  const rel = parts.join("/");
  if (rel.includes("..")) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  const full = storage().resolve(rel);
  const root = path.resolve(process.env.STORAGE_DIR ?? "./data");
  if (!full.startsWith(root)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  try {
    const buf = await readFile(full);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": rel.endsWith(".mp4") ? "video/mp4" : "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
