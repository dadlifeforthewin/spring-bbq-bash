import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. NEVER import this from a client component.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Browser-safe client (anon key) — only used for read-only public data like zones/catalog.
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Tier = "general" | "vip";

export interface Ticket {
  code: string;
  tier: Tier;
  child_name: string | null;
  child_age: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  balance_cents: number;
  perk_pizza: boolean;
  perk_basic_drink: boolean;
  perk_premium_drink: boolean;
  perk_glow_stick: boolean;
  perk_glow_pack: boolean;
  perk_free_dress: boolean;
  perk_spin_wheel: boolean;
  perk_jail_free: boolean;
  perk_dj_shoutout: boolean;
  ntfy_subscribed: boolean;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
}
