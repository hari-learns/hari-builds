import { Reveal } from "./Reveal";
import { Scrub } from "./Scrub";
import { ContactIcons } from "./WhatsAppButton";
import { ShaderCanvas } from "./ShaderCanvas";

// Headline words light up one by one as the scene scrolls.
function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h3 className="scene-title">
      {words.map((w, i) => (
        <span key={i} className="w" style={{ "--i": i, "--n": words.length } as React.CSSProperties}>{w} </span>
      ))}
    </h3>
  );
}

// Gold, from the Aubstrac shader: the glow behind the one box that stands out.
const GOLD: [string, string, string, string] = ["#7a4a10", "#c98a1b", "#f2b84a", "#fff0c4"];
const BOXES = [0, 1, 2, 3, 4];
const CENTRE = { x: 0.5, y: 0.5 };
const CHIPS = [
  { label: "Posts", x: "-11rem", y: "-7rem", r: "-14deg", d: 0 },
  { label: "Orders", x: "10rem", y: "-8rem", r: "11deg", d: 0.06 },
  { label: "Inbox", x: "-12rem", y: "2rem", r: "9deg", d: 0.12 },
  { label: "Reports", x: "11rem", y: "3rem", r: "-8deg", d: 0.18 },
  { label: "Calendar", x: "-6rem", y: "9rem", r: "-10deg", d: 0.24 },
  { label: "Payments", x: "7rem", y: "9rem", r: "13deg", d: 0.3 },
];
const ROWS = [
  { label: "Publish", note: "Live" },
  { label: "Monitor", note: "24/7" },
  { label: "Get work done", note: "Done" },
];

export function Capabilities() {
  return (
    <section className="cap" aria-labelledby="cap-h">
      <Reveal>
        <h2 id="cap-h" className="work-title">Work I can do for you</h2>
        <p className="cap-sub">Anything.</p>
      </Reveal>

      {/* 1. Branding: a stack of look-alike boxes, one glowing so it stands out */}
      <Scrub className="s-brand">
        <div className="pin">
          <div className="copy-col">
            <p className="eyebrow">Branding</p>
            <Words text="How authentic are you?" />
            <p className="scene-body">I will make sure that is reflected online, clearly and consistently, to everyone who finds you.</p>
          </div>
          <div className="art" aria-hidden>
            <div className="stack">
              {BOXES.map((i) => (
                <div key={i} className={`sbox${i === 2 ? " hero" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                  {i === 2 && <span className="sglow"><ShaderCanvas colors={GOLD} hover={false} pointer={CENTRE} /></span>}
                  <span className="sbox-in">
                    <i className="sq" />
                    <span className="ln a" />
                    <span className="ln b" />
                    {i === 2 && <em className="you-tag">Your business</em>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Scrub>

      {/* 2. Automation: scattered tools converge into one cockpit */}
      <Scrub className="s-auto">
        <div className="pin">
          <div className="copy-col">
            <p className="eyebrow">Automation</p>
            <Words text="Managing a lot at once?" />
            <p className="scene-body">I will build you a single cockpit: one place to publish, monitor and get work done.</p>
          </div>
          <div className="art" aria-hidden>
            <div className="cockpit">
              {CHIPS.map((c) => (
                <span key={c.label} className="chip" style={{ "--x": c.x, "--y": c.y, "--r": c.r, "--d": c.d } as React.CSSProperties}>{c.label}</span>
              ))}
              <div className="panel">
                <div className="panel-bar"><i /><i /><i /><span>Cockpit</span></div>
                {ROWS.map((r, i) => (
                  <div key={r.label} className="row" style={{ "--n": i } as React.CSSProperties}>
                    <span className="row-label">{r.label}</span>
                    <span className="bar"><i /></span>
                    <span className="row-note">{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Scrub>

      {/* 3. Mockups: a sketch becomes a finished demo */}
      <Scrub className="s-mock">
        <div className="pin">
          <div className="copy-col">
            <p className="eyebrow">Mockups and demos</p>
            <Words text="See your idea before you commit." />
            <p className="scene-body">Tell me your vision.</p>
            <div className="scene-wa"><ContactIcons phone="919884966442" email="hariharanrp.dev@gmail.com" /></div>
          </div>
          <div className="art" aria-hidden>
            <div className="mock">
              <div className="mock-bar"><i /><i /><i /></div>
              <div className="mock-body">
                <div className="wire">
                  <span className="wl w1" /><span className="wl w2" /><span className="wl w3" />
                  <span className="wimg" />
                  <span className="wl w4" /><span className="wl w5" /><span className="wbtn" />
                </div>
                <div className="design">
                  <span className="d-eyebrow">Your idea</span>
                  <span className="d-title">Made real.</span>
                  <span className="d-btn">Take a look</span>
                </div>
                <span className="scan" />
              </div>
              <p className="mock-note">A glimpse, free of charge.</p>
            </div>
          </div>
        </div>
      </Scrub>

      <Reveal>
        <div className="cta">
          <p className="cta-reach">
            Mail me at <a href="mailto:hariharanrp.dev@gmail.com">hariharanrp.dev@gmail.com</a>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
