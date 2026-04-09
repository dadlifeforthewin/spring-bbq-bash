// Extract a ticket code from either a raw code ("SBBQ-042") or a full URL
// ("https://.../ticket/SBBQ-042").
export function extractTicketCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Try URL pathname first.
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "ticket" || p === "t");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].toUpperCase();
  } catch {
    // not a URL, fall through
  }
  // Raw code like SBBQ-042
  const m = trimmed.match(/^[A-Z]{2,6}-?\d{1,6}$/i);
  if (m) return trimmed.toUpperCase();
  return null;
}

export function centsToDollars(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}
