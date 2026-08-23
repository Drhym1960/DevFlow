import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/lib/ai/registry";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const kind = String(form.get("kind") ?? "product");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const saved = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const rel = `uploads/${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    await storage().save(rel, bytes, file.type);
    saved.push(
      await db.asset.create({
        data: {
          userId: user.id,
          kind,
          filename: file.name,
          path: rel,
          mime: file.type || "application/octet-stream",
          label: file.name,
        },
      }),
    );
  }
  return NextResponse.json({ assets: saved });
}
