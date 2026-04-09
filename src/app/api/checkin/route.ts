import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

// POST  { code, action: "in" | "out", child_name?, child_age?, parent_name?, parent_phone?, ntfy_subscribed? }
export async function POST(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const code = String(body.code ?? "").toUpperCase();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  const sb = supabaseAdmin();
  const patch: Record<string, any> = {};

  if (body.action === "in") {
    patch.checked_in = true;
    patch.checked_in_at = new Date().toISOString();
    patch.checked_out_at = null;
    for (const k of ["child_name","child_age","parent_name","parent_phone","ntfy_subscribed"]) {
      if (k in body) patch[k] = body[k];
    }
  } else if (body.action === "out") {
    patch.checked_in = false;
    patch.checked_out_at = new Date().toISOString();
  } else {
    return NextResponse.json({ error: "bad action" }, { status: 400 });
  }

  const { data, error } = await sb.from("tickets").update(patch).eq("code", code).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket: data });
}
