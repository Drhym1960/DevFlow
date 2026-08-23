import { NextResponse } from "next/server";
import { providerRoster } from "@/lib/ai/registry";

export async function GET() {
  return NextResponse.json({ providers: providerRoster() });
}
