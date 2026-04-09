import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

// List all tickets (admin) or create a new one.
export async function GET() {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("tickets").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

function padCode(n: number) {
  return `SBBQ-${String(n).padStart(3, "0")}`;
}

export async function POST(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const count = Math.min(Math.max(parseInt(body.count ?? "1", 10), 1), 200);
  const tier = body.tier === "vip" ? "vip" : "general";
  const balance_cents = Math.max(0, parseInt(body.balance_cents ?? "0", 10) || 0);

  const sb = supabaseAdmin();
  // Find the highest existing SBBQ-### to continue numbering.
  const { data: last } = await sb
    .from("tickets")
    .select("code")
    .like("code", "SBBQ-%")
    .order("code", { ascending: false })
    .limit(1);
  let next = 1;
  if (last && last[0]?.code) {
    const m = last[0].code.match(/SBBQ-(\d+)/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  const rows = Array.from({ length: count }, (_, i) => ({
    code: padCode(next + i),
    tier,
    balance_cents,
  }));
  const { data, error } = await sb.from("tickets").insert(rows).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}
