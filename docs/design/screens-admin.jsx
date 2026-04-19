/* global React, PageHead, Stat */
/* ==========================================================
   Spring BBQ Bash — admin screens (laptop frame)
   ========================================================== */

const { useState: useStateAdmin } = React;

/* ----------------------- Admin nav ----------------------- */
function AdminNav({ active }) {
  const items = ["Dashboard", "Guests", "Volunteers", "Stations", "Photos", "Comms", "Settings"];
  return (
    <div className="admin-nav">
      <span className="brand"><i />RISEN&amp;REDEEMED · BASH OPS</span>
      {items.map((n) => (
        <a key={n} href="#" className={n === active ? "active" : ""}>{n}</a>
      ))}
      <span className="home-link">FR. MIKE · LIVE</span>
    </div>
  );
}

/* ==========================================================
   10 — Admin dashboard (live stats + timeline)
   ========================================================== */
function AdminDashboard() {
  return (
    <>
      <AdminNav active="Dashboard" />
      <div className="screen wide">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <div className="eyebrow text-dim">SATURDAY · APR 19 · 7:12 PM</div>
            <h1 className="font-display" style={{ fontSize: 26, margin: "4px 0 0", letterSpacing: ".01em" }}>
              Bash is <span className="glow-mint">live</span>. Here's the pulse.
            </h1>
          </div>
          <div className="row gap-2">
            <span className="chip chip-mint">LIVE · <b>217</b> ONSITE</span>
            <button className="btn btn-ghost btn-sm">Broadcast</button>
          </div>
        </div>

        <div className="grid-4">
          <Stat lbl="Checked in"    val="217" tone="mint" />
          <Stat lbl="Expected"      val="310" tone="cyan" />
          <Stat lbl="Kids zone"     val="58"  tone="pink" />
          <Stat lbl="Photos posted" val="94"  tone="yellow" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginTop: 18 }}>
          <div className="card c-purple pad-lg">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow glow-purple">NIGHT TIMELINE</div>
              <div className="meta-mono">AUTO-ADVANCE</div>
            </div>
            <div style={{ marginTop: 14, position: "relative", paddingLeft: 18 }}>
              <div style={{
                position: "absolute", left: 6, top: 6, bottom: 6, width: 2,
                background: "linear-gradient(to bottom, var(--neon-1), var(--neon-4), var(--neon-2))",
                borderRadius: 2,
              }} />
              {[
                ["5:30", "Doors open", "done", "mint"],
                ["6:00", "Welcome + grace (Fr. Mike)", "done", "mint"],
                ["6:30", "Grill + games in full swing", "now", "yellow"],
                ["7:30", "Kids' blessing circle", "next", "cyan"],
                ["8:15", "Group photo · Main Tent", "next", "cyan"],
                ["8:45", "Last call + thanks", "next", "purple"],
                ["9:00", "Cleanup crew begins", "next", "pink"],
              ].map(([t, label, state, tone], i) => (
                <div key={i} className="row" style={{ marginBottom: 14, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: -19, top: 2,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "var(--bg-elev)",
                    border: `2px solid var(--neon-${{mint:5,yellow:3,cyan:2,purple:4,pink:1}[tone]})`,
                    boxShadow: state === "now" ? `0 0 10px var(--neon-${{mint:5,yellow:3,cyan:2,purple:4,pink:1}[tone]})` : "none",
                  }} />
                  <div className="font-numeral tabular" style={{
                    width: 56, fontSize: 22, color: "var(--ink)",
                    opacity: state === "done" ? .5 : 1,
                  }}>{t}</div>
                  <div style={{ flex: 1 }}>
                    <div className="font-display" style={{
                      fontSize: 13,
                      color: state === "done" ? "var(--ink-dim)" : "var(--ink)",
                      textDecoration: state === "done" ? "line-through" : "none",
                    }}>{label}</div>
                  </div>
                  {state === "now" && <span className="chip chip-yellow">NOW</span>}
                  {state === "done" && <span className="chip chip-quiet">done</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="stack-3">
            <div className="card c-pink pad-lg">
              <div className="eyebrow glow-pink">ALERTS · 2</div>
              <div className="stack-2" style={{ marginTop: 10 }}>
                <div className="card" style={{ padding: "10px 12px" }}>
                  <div className="font-display" style={{ fontSize: 12.5 }}>Plushies at 4 left</div>
                  <div className="text-dim" style={{ fontSize: 11.5, marginTop: 2 }}>Games & Yard · raised by Priya</div>
                </div>
                <div className="card" style={{ padding: "10px 12px" }}>
                  <div className="font-display" style={{ fontSize: 12.5 }}>Grill line &gt; 8 min wait</div>
                  <div className="text-dim" style={{ fontSize: 11.5, marginTop: 2 }}>Auto-detected · 2 runners idle</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }}>Triage all →</button>
            </div>

            <div className="card c-cyan pad-lg">
              <div className="eyebrow glow-cyan">STATIONS · 7 OPEN</div>
              <div className="stack-1" style={{ marginTop: 10, fontSize: 12.5 }}>
                {[
                  ["Check-In", "mint", "3 on"],
                  ["Photo Booth", "mint", "2 on"],
                  ["Grill", "yellow", "busy"],
                  ["Games & Yard", "pink", "low stock"],
                  ["Kids Zone", "mint", "4 on"],
                  ["Bar / Drinks", "mint", "1 on"],
                  ["Cleanup", "cyan", "on deck"],
                ].map(([s, tone, note]) => (
                  <div key={s} className="row" style={{ justifyContent: "space-between", padding: "4px 0" }}>
                    <span className="font-display" style={{ fontSize: 13 }}>{s}</span>
                    <span className={`chip chip-${tone}`}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ==========================================================
   11 — Guest list (table)
   ========================================================== */
function AdminGuests() {
  const [filter, setFilter] = useStateAdmin("All");
  const rows = [
    ["Alvarez family",     "Party of 4", "Checked in", "6:32p", "new"],
    ["Okafor family",      "Party of 5", "Checked in", "6:29p", ""],
    ["Han, Esther (+1)",   "Party of 2", "Checked in", "6:27p", "new"],
    ["Delgado family",     "Party of 3", "Expected",   "—",     ""],
    ["Wu, Ming",           "Solo",       "Checked in", "6:18p", ""],
    ["The Okonkwo's",      "Party of 4", "Expected",   "—",     ""],
    ["Patel family",       "Party of 3", "Checked in", "6:11p", "vip"],
    ["Blake, Tomás",       "Solo",       "No-show",    "—",     ""],
  ];

  const shown = rows.filter((r) => filter === "All" || r[2] === filter);

  return (
    <>
      <AdminNav active="Guests" />
      <div className="screen wide">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div className="eyebrow text-dim">RSVP · CHECK-IN</div>
            <h1 className="font-display" style={{ fontSize: 24, margin: "4px 0 0" }}>Guest list</h1>
          </div>
          <div className="row gap-2">
            <input type="search" placeholder="Search name or household…" style={{ width: 260 }} />
            <button className="btn btn-big btn-sm">+ Add household</button>
          </div>
        </div>

        <div className="filter-row" style={{ marginBottom: 12 }}>
          {["All", "Checked in", "Expected", "No-show"].map((f) => (
            <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
          <span className="meta-mono" style={{ marginLeft: "auto", alignSelf: "center" }}>
            {shown.length} of {rows.length}
          </span>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Household</th>
              <th>Party</th>
              <th>Status</th>
              <th>Checked at</th>
              <th>Tag</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(([n, p, s, t, tag], i) => (
              <tr key={i}>
                <td><a className="name-link" href="#">{n}</a></td>
                <td className="dim tabular">{p}</td>
                <td>
                  {s === "Checked in" && <span className="chip chip-mint">{s}</span>}
                  {s === "Expected"   && <span className="chip chip-cyan">{s}</span>}
                  {s === "No-show"    && <span className="chip chip-quiet">{s}</span>}
                </td>
                <td className="dim tabular">{t}</td>
                <td>
                  {tag === "new" && <span className="chip chip-yellow">NEW</span>}
                  {tag === "vip" && <span className="chip chip-pink">VIP</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ==========================================================
   12 — Volunteer board
   ========================================================== */
function AdminVolunteers() {
  const people = [
    ["Priya Menon",    "Check-In",    "5:30–7:00", "on shift", "mint"],
    ["Jorge Rivera",   "Grill",       "6:00–8:00", "on shift", "mint"],
    ["Esther Han",     "Photo Booth", "All night", "on shift", "mint"],
    ["Sam Okafor",     "Games",       "7:00–8:30", "starts 18m", "cyan"],
    ["Marisol Alvarez","Kids Zone",   "5:30–7:00", "on shift", "mint"],
    ["Kenji Wu",       "Cleanup",     "8:30–close","starts 78m", "purple"],
    ["Teresa Delgado", "Bar",         "7:00–9:00", "starts 18m", "cyan"],
    ["Fr. Mike Arden", "Floater",     "All night", "on shift", "yellow"],
  ];
  return (
    <>
      <AdminNav active="Volunteers" />
      <div className="screen wide">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div className="eyebrow text-dim">42 · TONIGHT</div>
            <h1 className="font-display" style={{ fontSize: 24, margin: "4px 0 0" }}>Volunteer board</h1>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm">Export roster</button>
            <button className="btn btn-big btn-sm">+ Add volunteer</button>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 14 }}>
          <Stat lbl="On shift now" val="24" tone="mint" />
          <Stat lbl="Starting soon" val="06" tone="cyan" />
          <Stat lbl="Scheduled"    val="42" tone="purple" />
          <Stat lbl="No-show"      val="02" tone="pink" />
        </div>

        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Station</th><th>Shift</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {people.map(([n, st, sh, stat, tone], i) => (
              <tr key={i}>
                <td><a className="name-link" href="#">{n}</a></td>
                <td>{st}</td>
                <td className="dim tabular">{sh}</td>
                <td><span className={`chip chip-${tone}`}>{stat}</span></td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm">Msg</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ==========================================================
   13 — Photo moderation grid (Bash Wall queue)
   ========================================================== */
function AdminPhotos() {
  const tiles = [
    { state: "approved",  frame: "pink",   label: "Alvarez fam"   },
    { state: "queue",     frame: "cyan",   label: "Group · tent"  },
    { state: "queue",     frame: "yellow", label: "Lucas · bounce"},
    { state: "approved",  frame: "purple", label: "Fr. Mike"      },
    { state: "flagged",   frame: "pink",   label: "— consent off" },
    { state: "approved",  frame: "cyan",   label: "Grill crew"    },
    { state: "queue",     frame: "yellow", label: "Kids table"    },
    { state: "approved",  frame: "purple", label: "Sunset"        },
    { state: "queue",     frame: "pink",   label: "Ring toss"     },
    { state: "approved",  frame: "cyan",   label: "Dessert line"  },
    { state: "queue",     frame: "yellow", label: "Esther & crew" },
    { state: "approved",  frame: "purple", label: "Halo dance"    },
  ];
  return (
    <>
      <AdminNav active="Photos" />
      <div className="screen wide">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <div className="eyebrow text-dim">BASH WALL · MODERATION</div>
            <h1 className="font-display" style={{ fontSize: 24, margin: "4px 0 0" }}>
              Photos <span className="glow-pink">queue</span>
            </h1>
            <p className="text-dim" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
              4 awaiting review · approve or flag. Consent-off photos can be released back to the guest only.
            </p>
          </div>
          <div className="row gap-2">
            <span className="chip chip-mint">APPROVED · <b>94</b></span>
            <span className="chip chip-yellow">QUEUE · <b>4</b></span>
            <span className="chip chip-danger">FLAGGED · <b>1</b></span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {tiles.map((t, i) => {
            const tone = t.frame;
            const stateChip = t.state === "approved" ? "chip-mint"
                           : t.state === "queue" ? "chip-yellow"
                           : "chip-danger";
            return (
              <div key={i} className="card" style={{ padding: 6, position: "relative" }}>
                <div style={{
                  aspectRatio: "1/1",
                  borderRadius: 10,
                  border: `1.5px solid color-mix(in oklab, var(--neon-${{pink:1,cyan:2,yellow:3,purple:4}[tone]}) 60%, transparent)`,
                  background: `radial-gradient(ellipse at 50% 50%, color-mix(in oklab, var(--neon-${{pink:1,cyan:2,yellow:3,purple:4}[tone]}) 28%, transparent), #0b0118 75%)`,
                  display: "grid", placeItems: "center", overflow: "hidden",
                }}>
                  <GlowCross size={54} color={tone} />
                </div>
                <div className="row" style={{ justifyContent: "space-between", padding: "8px 6px 4px" }}>
                  <span className="font-mono" style={{ fontSize: 10.5, color: "var(--ink-dim)", letterSpacing: ".1em" }}>
                    {t.label}
                  </span>
                  <span className={`chip ${stateChip}`} style={{ fontSize: 9, padding: "3px 7px" }}>
                    {t.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  AdminNav, AdminDashboard, AdminGuests, AdminVolunteers, AdminPhotos,
});
