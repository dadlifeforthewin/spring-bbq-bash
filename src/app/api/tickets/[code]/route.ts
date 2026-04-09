import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

// Public GET so a parent on /ticket/[code] can see their kid's data.
// Auth-required PATCH for volunteer edits.
export async function GET(_: Request, { params }: { params: { code: string } }) {
  const sb = supabaseAdmin();
  const code = params.code.toUpperCase();
  const { data: ticket, error } = await sb.from("tickets").select("*").eq("code", code).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: tx } = await sb
    .from("transactions")
    .select("*")
    .eq("ticket_code", code)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ ticket, transactions: tx ?? [] });
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = supabaseAdmin();
  const allowed = [
    "child_name","child_age","parent_name","parent_phone","balance_cents",
    "perk_pizza","perk_basic_drink","perk_premium_drink","perk_glow_stick",
    "perk_glow_pack","perk_free_dress","perk_spin_wheel","perk_jail_free",
    "perk_dj_shoutout","ntfy_subscribed",
  ];
  const patch: Record<string, any> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  const { data, error } = await sb
    .from("tickets")
    .update(patch)
    .eq("code", params.code.toUpperCase())
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

export async function DELETE(_: Request, { params }: { params: { code: string } }) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("tickets").delete().eq("code", params.code.toUpperCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
