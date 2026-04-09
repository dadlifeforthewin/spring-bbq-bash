import { NextResponse } from "next/server";
import { topicForTicket } from "@/lib/ntfy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  return NextResponse.json({ topic: topicForTicket(code.toUpperCase()) });
}
