/* global React, ReactDOM, Phone, Laptop,
   Landing, Registration, CheckinStation, PhotoBoothStation, GamesStation,
   GrillStation, CleanupStation, RoamingConsent, ParentHandoff,
   AdminDashboard, AdminGuests, AdminVolunteers, AdminPhotos */

const { useState } = React;

const SECTIONS = [
  { id: "all",         label: "All 13 screens" },
  { id: "volunteer",   label: "Volunteer onboarding" },
  { id: "stations",    label: "Stations" },
  { id: "guest",       label: "Guest-facing" },
  { id: "admin",       label: "Admin / ops" },
];

function Section({ num, color, title, emphasis, note, children, wide }) {
  const [before, after] = emphasis ? title.split(emphasis) : [title, ""];
  return (
    <div style={{ marginTop: 28 }}>
      <div className={`section-heading c-${color}`}>
        <span className="num">{num}</span>
        <span className="title">{before}{emphasis && <em>{emphasis}</em>}{after}</span>
        <span className="rule" />
      </div>
      {note && <p className="section-note">{note}</p>}
      <div className={`gallery ${wide ? "wide" : ""}`}>{children}</div>
    </div>
  );
}

function FrameCard({ num, route, label, children }) {
  return (
    <div className="frame-card">
      {children}
      <div className="frame-label">
        <b>{num}</b>
        <span>{label}</span>
        <span className="route">/{route}</span>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("all");
  const show = (ids) => tab === "all" || ids.includes(tab);

  return (
    <div className="shell">
      <div className="shell-head">
        <div>
          <div className="meta">PROTOTYPE · V2 · RISEN&amp;REDEEMED · SPRING BBQ BASH</div>
          <h1>The whole night, one prototype.</h1>
          <p>
            13 screens across volunteer onboarding, live station tools,
            guest-facing prompts, and admin ops — rebuilt on the Glow Party
            design system (Monoton numerals, Bungee display, neon on indigo).
          </p>
        </div>
        <div className="meta-right">
          APRIL 19 · 5:30–9:00 PM<br/>
          ST. ANSELM'S · GROUNDS<br/>
          V2 · UNBOUNDED AURORA
        </div>
      </div>

      <div className="tabs">
        {SECTIONS.map((s) => (
          <button key={s.id} className={tab === s.id ? "active" : ""} onClick={() => setTab(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {show(["volunteer"]) && (
        <Section num="01" color="pink" title="Volunteer onboarding" emphasis="onboarding"
          note="Sign-in station the volunteers tap first, and a 2-minute registration flow for new faces.">
          <FrameCard num="01" route="volunteer" label="Landing · check in">
            <Phone><Landing /></Phone>
          </FrameCard>
          <FrameCard num="02" route="volunteer/register" label="Shift registration">
            <Phone bg="soft"><Registration /></Phone>
          </FrameCard>
        </Section>
      )}

      {show(["stations"]) && (
        <Section num="02" color="cyan" title="Station tools" emphasis="Station"
          note="Each volunteer station gets its own screen, tuned for the task at hand: scanning, cooking, running prizes, closing out the night.">
          <FrameCard num="03" route="station/checkin" label="Check-in · scanner">
            <Phone><CheckinStation /></Phone>
          </FrameCard>
          <FrameCard num="04" route="station/photo" label="Photo booth · consent-gated">
            <Phone bg="soft"><PhotoBoothStation /></Phone>
          </FrameCard>
          <FrameCard num="05" route="station/games" label="Games · prize redeems">
            <Phone><GamesStation /></Phone>
          </FrameCard>
          <FrameCard num="06" route="station/grill" label="Grill runner · order board">
            <Phone bg="very-soft"><GrillStation /></Phone>
          </FrameCard>
          <FrameCard num="07" route="station/cleanup" label="Cleanup · close-out">
            <Phone><CleanupStation /></Phone>
          </FrameCard>
        </Section>
      )}

      {show(["guest"]) && (
        <Section num="03" color="yellow" title="Guest-facing" emphasis="Guest-facing"
          note="The two places a guest's phone actually enters the flow — a roaming photo consent prompt and a Kids Zone handoff confirmation.">
          <FrameCard num="08" route="guest/photo-consent" label="Roaming photo · consent">
            <Phone><RoamingConsent /></Phone>
          </FrameCard>
          <FrameCard num="09" route="guest/kids-handoff" label="Parent · Kids Zone handoff">
            <Phone bg="soft"><ParentHandoff /></Phone>
          </FrameCard>
        </Section>
      )}

      {show(["admin"]) && (
        <Section num="04" color="purple" title="Admin ops" emphasis="Admin"
          note="What Fr. Mike and the ops lead see on a laptop backstage — the live pulse, guest list, volunteer board, and Bash Wall moderation." wide>
          <FrameCard num="10" route="admin/dashboard" label="Dashboard · live pulse">
            <Laptop url="bash.risenandredeemed.org/admin"><AdminDashboard /></Laptop>
          </FrameCard>
          <FrameCard num="11" route="admin/guests" label="Guest list · check-in">
            <Laptop url="bash.risenandredeemed.org/admin/guests"><AdminGuests /></Laptop>
          </FrameCard>
          <FrameCard num="12" route="admin/volunteers" label="Volunteer board">
            <Laptop url="bash.risenandredeemed.org/admin/volunteers"><AdminVolunteers /></Laptop>
          </FrameCard>
          <FrameCard num="13" route="admin/photos" label="Bash Wall · moderation">
            <Laptop url="bash.risenandredeemed.org/admin/photos"><AdminPhotos /></Laptop>
          </FrameCard>
        </Section>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
