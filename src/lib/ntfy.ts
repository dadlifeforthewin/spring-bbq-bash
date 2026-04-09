// ntfy.sh helper.
// We give every ticket a unique, unguessable topic name derived from a site-wide
// random prefix + the ticket code. This way nobody can accidentally (or deliberately)
// spam notifications to parents without knowing the prefix.

const NTFY_SERVER = "https://ntfy.sh";

export function topicForTicket(code: string): string {
  const prefix = process.env.NTFY_TOPIC_PREFIX;
  if (!prefix) throw new Error("NTFY_TOPIC_PREFIX not set");
  return `${prefix}-${code}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

// A link parents can scan to subscribe on their phone.
// The ntfy apps (iOS + Android) handle ntfy:// deep links and the https fallback
// opens the topic in the web UI.
export function subscribeLink(code: string): string {
  const topic = topicForTicket(code);
  return `${NTFY_SERVER}/${topic}`;
}

// Send a push notification to a ticket's parent topic.
export async function sendParentNotification(opts: {
  code: string;
  title: string;
  message: string;
  priority?: 3 | 4 | 5; // 5 = max / urgent
  tags?: string[];
  click?: string;
}) {
  const topic = topicForTicket(opts.code);
  const res = await fetch(`${NTFY_SERVER}/${topic}`, {
    method: "POST",
    headers: {
      "Title": opts.title,
      "Priority": String(opts.priority ?? 4),
      "Tags": (opts.tags ?? ["bell", "family"]).join(","),
      ...(opts.click ? { "Click": opts.click } : {}),
    },
    body: opts.message,
  });
  if (!res.ok) {
    throw new Error(`ntfy failed: ${res.status} ${await res.text()}`);
  }
}
