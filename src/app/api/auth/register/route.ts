import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!email || !body.password || String(body.password).length < 8) {
    return NextResponse.json({ error: "Valid email and password required" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Account exists" }, { status: 409 });
  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(String(body.password)),
      name: String(body.name ?? "New filmmaker"),
      company: body.company ? String(body.company) : null,
    },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
