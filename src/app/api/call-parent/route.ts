import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendParentNotification } from "@/lib/ntfy";
import { isVolunteerAuthed } from "@/lib/auth";

// POST { code, zone_slug?, message?, sent_by? }
// Sends a push notification to the parent's ntfy topic and logs it.
export async function POST(req: Request) {
  if (!isVolunteerAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const code = String(body.code ?? "").toUpperCase();
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: ticket } = await sb.from("tickets").select("*").eq("code", code).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });

  let zoneName = "the kids area";
  if (body.zone_slug) {
    const { data: z } = await sb.from("zones").select("name").eq("slug", body.zone_slug).maybeSingle();
    if (z?.name) zoneName = z.name;
  }

  const childName = ticket.child_name || `Ticket ${ticket.code}`;
  const title = `${childName} needs you`;
  const message = body.message?.trim()
    ? body.message.trim()
    : `Please come to ${zoneName}.`;

  if (!ticket.ntfy_subscribed) {
    // Still log the attempt so the PA volunteer knows to page them.
    await sb.from("notifications").insert({
      ticket_code: code,
      zone_slug: body.zone_slug ?? null,
      message: `[NOT SUBSCRIBED] ${message}`,
      sent_by: body.sent_by ?? null,
    });
    return NextResponse.json({ ok: false, reason: "not_subscribed", needsPA: true, childName });
  }

  try {
    await sendParentNotification({
      code,
      title,
      message,
      priority: 5,
      tags: ["rotating_light", "family"],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  await sb.from("notifications").insert({
    ticket_code: code,
    zone_slug: body.zone_slug ?? null,
    message,
    sent_by: body.sent_by ?? null,
  });

  return NextResponse.json({ ok: true });
}
