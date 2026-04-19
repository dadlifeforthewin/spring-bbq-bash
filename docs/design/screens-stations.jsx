/* global React */
/* ==========================================================
   Spring BBQ Bash — primitives + station/volunteer screens
   Design system: Glow Party (neon on #0b0118)
   ========================================================== */

const { useState, useMemo } = React;

/* ----------------------- GlowCross (Latin) ----------------------- */
function GlowCross({ size = 80, color = "cyan", className = "" }) {
  return (
    <div
      className={`glow-cross ${color} ${className}`}
      style={{ width: size, height: size * 1.32 }}
      aria-hidden="true"
    >
      <div className="halo" />
      <div className="rays" />
      <div className="bar v" />
      <div className="bar h" />
      <div className="bead" />
      <span className="spark s1" />
      <span className="spark s2" />
      <span className="spark s3" />
      <span className="spark s4" />
      <span className="spark s5" />
      <span className="spark s6" />
    </div>
  );
}

/* ----------------------- Wordmark: RISEN & REDEEMED ----------------------- */
function Wordmark({ size = 40 }) {
  return (
    <div className="neon-wordmark" style={{ fontSize: size }}>
      <span className="l1">RISEN</span>
      <span className="l2">
        <span className="amp">&amp;</span>REDEEMED
      </span>
    </div>
  );
}

/* ----------------------- In-frame backdrop (aurora + grid) ----------------------- */
function FrameBackdrop({ soft = false, verySoft = false }) {
  const cls = ["frame-bg", soft && "soft", verySoft && "very-soft"]
    .filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <div className="floor" />
    </div>
  );
}

/* ----------------------- Phone + Laptop frames ----------------------- */
function Phone({ children, bg = "normal" }) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <FrameBackdrop soft={bg === "soft"} verySoft={bg === "very-soft"} />
        {children}
      </div>
    </div>
  );
}
function Laptop({ url, children }) {
  return (
    <div className="laptop">
      <div className="laptop-chrome">
        <span className="dot" style={{ background: "#ff5f57" }} />
        <span className="dot" style={{ background: "#febc2e" }} />
        <span className="dot" style={{ background: "#28c840" }} />
        <span className="url">{url}</span>
      </div>
      <div className="laptop-screen">
        <FrameBackdrop verySoft />
        {children}
      </div>
    </div>
  );
}

/* ----------------------- Tiny chrome bits ----------------------- */
function PageHead({ back, title, sub, right }) {
  return (
    <div className="page-head">
      <div>
        {back && <a className="back-link" href="#">← {back}</a>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
function Stat({ lbl, val, tone = "pink" }) {
  return (
    <div className={`stat t-${tone}`}>
      <div className="lbl">{lbl}</div>
      <div className="val tabular">{val}</div>
    </div>
  );
}

/* ==========================================================
   1 — Landing (volunteer)
   ========================================================== */
function Landing() {
  return (
    <div className="screen">
      <div style={{ textAlign: "center", paddingTop: 28, paddingBottom: 22 }}>
        <Wordmark size={44} />
        <div className="mono" style={{
          marginTop: 10, fontSize: 10.5, letterSpacing: ".28em",
          textTransform: "uppercase", color: "var(--ink-dim)",
        }}>
          Spring BBQ Bash · April 19
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}>
        <GlowCross size={100} color="cyan" />
      </div>

      <div className="sign c-pink" style={{ textAlign: "center" }}>
        <span className="bolt tl" /><span className="bolt tr" />
        <span className="bolt bl" /><span className="bolt br" />
        <div className="eyebrow glow-yellow" style={{ marginBottom: 8 }}>Volunteer Station</div>
        <div className="font-display" style={{ fontSize: 26, lineHeight: 1.1, color: "var(--ink)" }}>
          Clock in, grab your<br/>
          <span className="glow-pink">lanyard</span>, get glowing.
        </div>
        <p className="text-dim" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          Tap below to confirm your shift and pick up your station wristband.
          New faces? We'll get you a 5-min orientation and a name tag.
        </p>

        <div className="stack-2" style={{ marginTop: 18 }}>
          <button className="btn btn-big btn-xl btn-block">Check me in</button>
          <button className="btn btn-ghost btn-block">I'm new here →</button>
        </div>
      </div>

      <div className="divider-dashed" style={{ margin: "22px 0 14px" }} />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="meta-mono">RENDEZVOUS · MAIN TENT</div>
        <div className="meta-mono">5:30–9:00 PM</div>
      </div>

      <div className="grid-3" style={{ marginTop: 12 }}>
        <div className="stat t-pink"><div className="lbl">Stations</div><div className="val">07</div></div>
        <div className="stat t-cyan"><div className="lbl">Volunteers</div><div className="val">42</div></div>
        <div className="stat t-yellow"><div className="lbl">Guests ex.</div><div className="val">310</div></div>
      </div>
    </div>
  );
}

/* ==========================================================
   2 — Volunteer registration (shift details + consent)
   ========================================================== */
function Registration() {
  const [station, setStation] = useState("Check-In");
  const [shift, setShift] = useState("5:30–7:00");
  const [consent, setConsent] = useState(true);

  return (
    <div className="screen">
      <PageHead
        back="Volunteer"
        title="Register for a shift"
        sub="Two quick picks and you're in. Organizers will see you on the board instantly."
      />

      <div className="stack-4">
        <div>
          <label>Your name</label>
          <input type="text" defaultValue="Priya Menon" />
        </div>

        <div>
          <label>Phone</label>
          <input type="tel" defaultValue="(415) 555-0148" />
        </div>

        <div>
          <label>Station</label>
          <div className="stack-2">
            {["Check-In", "Photo Booth", "Grill Runner", "Games & Yard", "Cleanup Crew"].map((s) => (
              <button key={s} className={`opt ${station === s ? "active" : ""}`} onClick={() => setStation(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>Shift window</label>
          <div className="grid-3">
            {["5:30–7:00", "7:00–8:30", "All night"].map((s) => (
              <button key={s}
                className={`opt cyan ${shift === s ? "active" : ""}`}
                onClick={() => setShift(s)}
                style={{ textAlign: "center", fontSize: 12, padding: "10px 6px" }}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="card pad-lg c-purple" onClick={() => setConsent(!consent)} style={{ cursor: "pointer" }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className={`toggle ${consent ? "on" : ""}`}><div className="nub" /></div>
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontSize: 13, marginBottom: 4 }}>
                Photos &amp; video consent
              </div>
              <div className="text-dim" style={{ fontSize: 12, lineHeight: 1.45 }}>
                Our photo team may capture you at stations and in group shots. Approved
                photos post to the Bash Wall during the event and the parish album after.
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-big btn-xl btn-block">Confirm my shift</button>
        <p className="meta-mono" style={{ textAlign: "center", marginTop: 6 }}>
          You'll get a text 30 min before your shift starts.
        </p>
      </div>
    </div>
  );
}

/* ==========================================================
   3 — Check-in station (QR scanner + walk-in)
   ========================================================== */
function CheckinStation() {
  return (
    <div className="screen">
      <PageHead
        back="Stations"
        title="Check-In Station"
        sub="Scan a guest's RSVP QR, or tap Walk-in to register a new household."
        right={<span className="chip chip-cyan">LIVE · <b>217</b></span>}
      />

      <div className="scanner">
        <div className="corners"><span/><span/><span/><span/></div>
        <div className="beam" />
        <div className="hint">Align QR in view · auto-capture</div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <button className="btn btn-big">Walk-in</button>
        <button className="btn btn-ghost">Manual lookup</button>
      </div>

      <div className="section-heading c-cyan" style={{ margin: "22px 0 10px" }}>
        <span className="num">LOG</span>
        <span className="title">Recent arrivals</span>
        <span className="rule" />
      </div>

      <div className="stack-2">
        {[
          ["The Okafor family", "Party of 5 · wristbands given", "2m"],
          ["Han, Esther (+1)", "New to parish · welcome flyer", "4m"],
          ["The Alvarez family", "Party of 4 · 2 kids zone", "6m"],
          ["Padilla, Miguel", "Solo · volunteer crossover", "9m"],
        ].map(([n, d, t]) => (
          <div key={n} className="card" style={{ padding: "10px 14px" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="font-display" style={{ fontSize: 13 }}>{n}</div>
                <div className="text-dim" style={{ fontSize: 11.5, marginTop: 2 }}>{d}</div>
              </div>
              <div className="meta-mono glow-mint">{t} ago</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================
   4 — Photo booth station (consent-gated capture)
   ========================================================== */
function PhotoBoothStation() {
  const [frame, setFrame] = useState("Neon Cross");
  return (
    <div className="screen">
      <PageHead
        back="Stations"
        title="Photo Booth"
        sub="Tap the screen to snap. Guests pick a frame; upload is consent-gated."
        right={<span className="chip chip-pink">TAKEN · <b>48</b></span>}
      />

      <div className="scanner" style={{ aspectRatio: "3/4" }}>
        <div className="corners"><span/><span/><span/><span/></div>
        <div style={{
          position: "absolute", inset: 18,
          border: "1.5px dashed color-mix(in oklab, var(--neon-1) 40%, transparent)",
          borderRadius: 16,
          display: "grid", placeItems: "center",
        }}>
          <GlowCross size={90} color="pink" />
        </div>
        <div className="hint">"{frame}" frame · 3-2-1 auto</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label>Frame style</label>
        <div className="filter-row">
          {["Neon Cross", "BBQ Bash", "Glow Halo", "No Frame"].map((f) => (
            <button key={f}
              className={`filter-chip ${frame === f ? "active" : ""}`}
              onClick={() => setFrame(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="banner banner-ok" style={{ marginTop: 16 }}>
        <b className="font-display" style={{ fontSize: 12 }}>CONSENT ON</b>
        <span style={{ marginLeft: 8 }}>
          Auto-posts to the Bash Wall. Guest can pull it back from their phone anytime.
        </span>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <button className="btn btn-pink btn-lg">Snap!</button>
        <button className="btn btn-ghost">Retake last</button>
      </div>
    </div>
  );
}

/* ==========================================================
   5 — Games & prizes (yard station with perk redeems)
   ========================================================== */
function GamesStation() {
  return (
    <div className="screen">
      <PageHead
        back="Stations"
        title="Games & Prizes"
        sub="Tap redeem when a kid wins a round. Inventory syncs to the admin board."
      />

      <div className="perks" style={{ marginBottom: 14 }}>
        <div className="perk c-cyan">
          <div className="count">12</div>
          <h3>Glow wristband</h3>
          <p>Ring toss · ages 4+</p>
        </div>
        <div className="perk c-yellow">
          <div className="count">08</div>
          <h3>Halo necklace</h3>
          <p>Bean bag toss</p>
        </div>
        <div className="perk c-pink">
          <div className="count">20</div>
          <h3>Sticker pack</h3>
          <p>Consolation · any game</p>
        </div>
        <div className="perk c-purple">
          <div className="count">04</div>
          <h3>Plushie prize</h3>
          <p>Top score · limited</p>
        </div>
      </div>

      <div className="section-heading c-yellow">
        <span className="num">LIVE</span>
        <span className="title">Quick redeem</span>
        <span className="rule" />
      </div>

      <div className="grid-2">
        <button className="btn btn-cyan btn-lg">−1 Wristband</button>
        <button className="btn btn-yellow btn-lg">−1 Halo</button>
        <button className="btn btn-pink btn-lg">−1 Sticker</button>
        <button className="btn btn-purple btn-lg">−1 Plushie</button>
      </div>

      <div className="banner banner-warn" style={{ marginTop: 14 }}>
        <b className="font-display" style={{ fontSize: 12 }}>LOW STOCK</b>
        <span style={{ marginLeft: 8 }}>
          Plushies down to 4. Organizers have been notified.
        </span>
      </div>
    </div>
  );
}

/* ==========================================================
   6 — Grill runner station (order board)
   ========================================================== */
function GrillStation() {
  const rows = [
    ["A-12", "Burger ×2, Dog ×1", "Main Tent", "03:14", "ready"],
    ["A-13", "Veggie ×1, Dog ×2", "Kids Zone", "02:48", "ready"],
    ["A-14", "Burger ×3", "Bar Line", "01:22", "cooking"],
    ["A-15", "Dog ×4, Veg ×1", "Main Tent", "00:44", "cooking"],
    ["A-16", "Burger ×1", "Pickup", "00:12", "new"],
  ];
  return (
    <div className="screen">
      <PageHead
        back="Stations"
        title="Grill Runner"
        sub="Take it from the grill and deliver. Tap to mark delivered."
        right={<span className="chip chip-yellow">QUEUE · <b>5</b></span>}
      />

      <div className="stack-2">
        {rows.map(([tk, order, dest, age, status]) => {
          const chipCls = status === "ready" ? "chip-mint" : status === "cooking" ? "chip-yellow" : "chip-pink";
          return (
            <div key={tk} className="card pad-lg">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="font-display glow-yellow" style={{ fontSize: 18 }}>{tk}</div>
                  <div className="font-display" style={{ fontSize: 13, marginTop: 2 }}>{order}</div>
                  <div className="text-dim" style={{ fontSize: 11.5, marginTop: 4 }}>→ {dest}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`chip ${chipCls}`}>{status}</span>
                  <div className="meta-mono tabular" style={{ marginTop: 6 }}>{age}</div>
                </div>
              </div>
              {status === "ready" && (
                <button className="btn btn-mint btn-block btn-sm" style={{ marginTop: 10 }}>
                  Delivered — next ↓
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================
   7 — Cleanup crew (end-of-night checklist)
   ========================================================== */
function CleanupStation() {
  const [checks, setChecks] = useState({
    tables: true, trash: true, lost: false, signage: false,
    recycle: false, leftovers: false, lock: false,
  });
  const toggle = (k) => setChecks({ ...checks, [k]: !checks[k] });
  const items = [
    ["tables", "Fold & stack tables", "Main Tent"],
    ["trash",  "Trash bags to dumpster", "Side lot"],
    ["lost",   "Collect lost & found", "Check-in table"],
    ["signage","Pull down signage", "Gates + parking"],
    ["recycle","Break down cardboard", "Back of kitchen"],
    ["leftovers", "Label leftovers for fridge", "Kitchen"],
    ["lock",   "Lock sheds + confirm lights", "Grounds"],
  ];
  const done = Object.values(checks).filter(Boolean).length;

  return (
    <div className="screen">
      <PageHead
        back="Stations"
        title="Cleanup Crew"
        sub="Check items as you finish. Last person to tap 'Lock' closes out the night."
        right={<span className="chip chip-mint">{done}/{items.length} DONE</span>}
      />

      <div className="stack-2">
        {items.map(([k, label, where]) => (
          <div key={k} className={`card ${checks[k] ? "c-mint" : ""}`}
            onClick={() => toggle(k)}
            style={{ padding: "12px 14px", cursor: "pointer", opacity: checks[k] ? .75 : 1 }}
          >
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div className={`toggle ${checks[k] ? "on" : ""}`}><div className="nub" /></div>
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{
                  fontSize: 14,
                  textDecoration: checks[k] ? "line-through" : "none",
                  color: checks[k] ? "var(--ink-dim)" : "var(--ink)",
                }}>{label}</div>
                <div className="text-dim" style={{ fontSize: 11.5, marginTop: 2 }}>{where}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-big btn-xl btn-block"
        style={{ marginTop: 16 }}
        disabled={done < items.length}
      >
        {done < items.length ? `Close out (${items.length - done} left)` : "Close out the night"}
      </button>
    </div>
  );
}

/* ==========================================================
   8 — Roaming photo consent prompt (surprise-ambush modal)
   ========================================================== */
function RoamingConsent() {
  return (
    <div className="screen">
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Wordmark size={28} />
        <div className="meta-mono" style={{ marginTop: 6 }}>PHOTO TEAM · ROAMING</div>
      </div>

      <div className="sign c-yellow" style={{ textAlign: "center" }}>
        <span className="bolt tl" /><span className="bolt tr" />
        <span className="bolt bl" /><span className="bolt br" />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <GlowCross size={72} color="yellow" />
        </div>

        <div className="eyebrow glow-pink" style={{ marginBottom: 6 }}>Heads up — photo about to happen</div>
        <div className="font-display" style={{ fontSize: 22, lineHeight: 1.15 }}>
          Mind if we put your<br/>
          <span className="glow-yellow">crew on the wall?</span>
        </div>
        <p className="text-dim" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>
          We'll show it to you first. You can keep it, kill it, or just send it to your phone.
        </p>
      </div>

      <div className="stack-2" style={{ marginTop: 16 }}>
        <button className="btn btn-big btn-lg btn-block">Yes, post to the Wall</button>
        <button className="btn btn-cyan btn-block" style={{ fontSize: 12 }}>Just text it to me</button>
        <button className="btn btn-ghost btn-block">No thanks</button>
      </div>

      <div className="meta-mono" style={{ textAlign: "center", marginTop: 14 }}>
        FATHER MIKE · BASH LEAD · RISEN&REDEEMED.ORG
      </div>
    </div>
  );
}

/* ==========================================================
   9 — Parent-of-kid handoff (wristband + zone)
   ========================================================== */
function ParentHandoff() {
  return (
    <div className="screen flush">
      <div style={{ padding: "12px 4px 18px" }}>
        <PageHead
          back="Check-in"
          title="Kids Zone handoff"
          sub="Please confirm your kid's wristband and pickup code."
        />
      </div>

      <div className="sign c-cyan">
        <span className="bolt tl" /><span className="bolt tr" />
        <span className="bolt bl" /><span className="bolt br" />

        <div className="eyebrow glow-cyan">WRISTBAND · CY-04</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <div>
            <div className="font-display" style={{ fontSize: 26, lineHeight: 1 }}>
              Lucas <span className="glow-pink">Alvarez</span>
            </div>
            <div className="text-dim" style={{ fontSize: 12.5, marginTop: 6 }}>Age 6 · peanut allergy · glasses</div>
          </div>
          <div className="font-numeral" style={{ fontSize: 52, color: "var(--neon-2)", textShadow: "0 0 14px var(--neon-2)" }}>
            04
          </div>
        </div>

        <div className="divider" style={{ margin: "14px 0 12px" }} />

        <div className="grid-2">
          <div>
            <div className="eyebrow text-dim">PICKUP CODE</div>
            <div className="font-numeral" style={{ fontSize: 30, color: "var(--neon-3)", textShadow: "0 0 10px var(--neon-3)", marginTop: 4 }}>
              7214
            </div>
          </div>
          <div>
            <div className="eyebrow text-dim">ZONE</div>
            <div className="font-display" style={{ fontSize: 16, marginTop: 6 }}>Tent B · Craft table</div>
          </div>
        </div>
      </div>

      <div className="screen" style={{ paddingTop: 16 }}>
        <div className="card c-yellow pad-lg">
          <div className="eyebrow glow-yellow">REMINDER</div>
          <div className="text-ink" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            Pickup is <b className="glow-yellow">by code only</b>. Screenshot this page or have the
            wristband scanned at the Tent B gate.
          </div>
        </div>

        <div className="stack-2" style={{ marginTop: 14 }}>
          <button className="btn btn-big btn-lg btn-block">Drop off Lucas</button>
          <button className="btn btn-ghost btn-block">Print wristband</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  GlowCross, Wordmark, FrameBackdrop,
  Phone, Laptop, PageHead, Stat,
  Landing, Registration,
  CheckinStation, PhotoBoothStation, GamesStation,
  GrillStation, CleanupStation, RoamingConsent, ParentHandoff,
});
