import { NextResponse } from "next/server";
import { setVolunteerAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (setVolunteerAuth(password)) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}
