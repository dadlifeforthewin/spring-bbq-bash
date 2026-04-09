import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isVolunteerAuthed } from "@/lib/auth";

// Live dashboard metrics.
export async function GET() {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  const [{ data: tickets }, { data: tx }] = await Promise.all([
    sb.from("tickets").select("code,tier,checked_in,balance_cents"),
    sb.from("transactions").select("zone_slug,amount_cents,kind,created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const total = tickets?.length ?? 0;
  const checkedIn = tickets?.filter((t) => t.checked_in).length ?? 0;
  const vip = tickets?.filter((t) => t.tier === "vip").length ?? 0;
  const general = total - vip;
  const revenueCents = (vip * 5000) + (general * 4000);
  const balanceOutstanding = tickets?.reduce((s, t) => s + (t.balance_cents ?? 0), 0) ?? 0;
  const spendByZone: Record<string, number> = {};
  for (const t of tx ?? []) {
    if (t.kind !== "spend") continue;
    const z = t.zone_slug || "unknown";
    spendByZone[z] = (spendByZone[z] ?? 0) + t.amount_cents;
  }
  return NextResponse.json({
    total, checkedIn, vip, general, revenueCents, balanceOutstanding, spendByZone,
    recent: tx?.slice(0, 20) ?? [],
  });
}
