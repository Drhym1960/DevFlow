import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/lib/ai/registry";
import { renderStoreShots } from "@/lib/store-shots/render";

async function saveUpload(userId: string, file: File, kind: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const rel = `uploads/${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  await storage().save(rel, bytes, file.type || "image/png");
  const asset = await db.asset.create({
    data: {
      userId,
      kind,
      filename: file.name,
      path: rel,
      mime: file.type || "image/png",
      label: file.name,
    },
  });
  return { asset, full: storage().resolve(rel) };
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const screens = form.getAll("screens").filter((f): f is File => f instanceof File && f.size > 0);
  const samples = form.getAll("samples").filter((f): f is File => f instanceof File && f.size > 0);
  if (!screens.length) {
    return NextResponse.json({ error: "Upload at least one screenshot of your real app." }, { status: 400 });
  }

  const screenPaths: string[] = [];
  for (const file of screens.slice(0, 8)) {
    screenPaths.push((await saveUpload(user.id, file, "store-screen")).full);
  }
  let samplePath: string | undefined;
  if (samples[0]) {
    samplePath = (await saveUpload(user.id, samples[0], "store-sample")).full;
  }

  const captions = String(form.get("captions") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const result = await renderStoreShots({
      store: String(form.get("store") || "play"),
      appName: String(form.get("appName") || "").trim(),
      notes: String(form.get("notes") || "").trim(),
      captions,
      screenPaths,
      samplePath,
      userId: user.id,
    });
    const saved = [];
    for (const shot of result.shots) {
      saved.push(
        await db.asset.create({
          data: {
            userId: user.id,
            kind: "store-result",
            filename: shot.path.split("/").at(-1) ?? "store-shot.png",
            path: shot.path,
            mime: "image/png",
            label: shot.headline,
          },
        }),
      );
    }
    return NextResponse.json({
      store: result.store,
      shots: saved.map((asset, i) => ({
        id: asset.id,
        path: asset.path,
        url: `/api/media/${asset.path}`,
        headline: result.shots[i]?.headline,
        width: result.shots[i]?.width,
        height: result.shots[i]?.height,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not compose those store screenshots." },
      { status: 500 },
    );
  }
}
