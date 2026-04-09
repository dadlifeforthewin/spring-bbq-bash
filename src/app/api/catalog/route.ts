import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get("zone");
  let q = sb.from("catalog_items").select("*").eq("active", true).order("sort_order");
  if (zone) q = q.eq("zone_slug", zone);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("catalog_items").insert({
    zone_slug: body.zone_slug,
    name: body.name,
    price_cents: body.price_cents ?? 0,
    kind: body.kind ?? "game",
    sort_order: body.sort_order ?? 0,
  }).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const sb = supabaseAdmin();
  const { id, ...patch } = body;
  const { data, error } = await sb.from("catalog_items").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sb = supabaseAdmin();
  const { error } = await sb.from("catalog_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
