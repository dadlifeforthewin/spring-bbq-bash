import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

// Spend or redeem from a ticket.
// POST { code, zone_slug, item_name, amount_cents, kind, volunteer?, perk_field? }
//
// If `perk_field` is provided (e.g. "perk_spin_wheel"), we treat it as a VIP
// perk redemption: we require the perk to currently be true, then flip it to
// false. No balance is touched.
//
// Otherwise we deduct amount_cents from balance_cents. The amount must be <=
// current balance. A refund (kind = "refund") uses a negative amount_cents.
export async function POST(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const code = String(body.code ?? "").toUpperCase();
  const zone_slug = body.zone_slug ?? null;
  const item_name = String(body.item_name ?? "").slice(0, 120);
  const amount_cents = parseInt(body.amount_cents ?? "0", 10) || 0;
  const kind = body.kind ?? "spend";
  const volunteer = body.volunteer ?? null;
  const perk_field: string | undefined = body.perk_field;

  if (!code || !item_name) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: ticket, error: tErr } = await sb.from("tickets").select("*").eq("code", code).maybeSingle();
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
  if (!ticket.checked_in) return NextResponse.json({ error: "ticket is not checked in" }, { status: 409 });

  const patch: Record<string, any> = {};

  if (perk_field) {
    if (!/^perk_[a-z_]+$/.test(perk_field)) {
      return NextResponse.json({ error: "bad perk field" }, { status: 400 });
    }
    if (!(perk_field in ticket) || (ticket as any)[perk_field] !== true) {
      return NextResponse.json({ error: "perk not available or already used" }, { status: 409 });
    }
    patch[perk_field] = false;
  } else {
    const newBalance = (ticket.balance_cents ?? 0) - amount_cents;
    if (newBalance < 0) return NextResponse.json({ error: "insufficient balance" }, { status: 409 });
    patch.balance_cents = newBalance;
  }

  const { data: updated, error: uErr } = await sb
    .from("tickets").update(patch).eq("code", code).select("*").maybeSingle();
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const { error: txErr } = await sb.from("transactions").insert({
    ticket_code: code,
    zone_slug,
    item_name,
    amount_cents: perk_field ? 0 : amount_cents,
    kind: perk_field ? "perk_redeem" : kind,
    volunteer,
  });
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  return NextResponse.json({ ticket: updated });
}
