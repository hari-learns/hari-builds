"use client";

import { useEffect, useRef, useState } from "react";

// Automation engineer stays last.
const ROLES = ["Web designer", "App developer", "Brand engineer", "SEO strategist", "Creative technologist", "Automation engineer"];
// The closing branch asks the question the others lead to.
const ENDING = "Exactly what you need?";

/**
 * "On course to be a polymath": hover (or tap) the word and the roles appear in a column beneath it while the rest of
 * the page is veiled (focus mode). Until someone touches it, the word invites them: a breathing gold underline, a small
 * cue, and one brief auto-peek.
 */
export function Polymath() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [cue, setCue] = useState("hover");
  const touched = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const canHover = () => window.matchMedia("(hover: hover)").matches;
  const interact = () => { touched.current = true; setSeen(true); };

  useEffect(() => {
    setCue(canHover() ? "hover" : "tap");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // One short demonstration, only if nobody has interacted yet.
    const on = window.setTimeout(() => { if (!touched.current) setOpen(true); }, 2200);
    const off = window.setTimeout(() => { if (!touched.current) setOpen(false); }, 5200);
    return () => { clearTimeout(on); clearTimeout(off); };
  }, []);

  // On touch screens there is no mouse-leave, so a tap anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  return (
    <div
      ref={root}
      className={`poly${open ? " open" : ""}${seen ? " seen" : ""}`}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(false); }}
    >
      <span className="poly-veil" aria-hidden />
      <p className="poly-line">
        On course to be a{" "}
        <span className="poly-wrap">
          <button
            type="button"
            className="poly-word"
            aria-expanded={open}
            aria-controls="poly-roles"
            onPointerEnter={(e) => { if (e.pointerType === "mouse") { interact(); setOpen(true); } }}
            onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) { interact(); setOpen(true); } }}
            onClick={() => { interact(); setOpen((o) => (canHover() ? true : !o)); }}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          >
            polymath
          </button>
          .
          {/* The branches: a stem from the word, a spine, and an arrow out to each role. */}
          <span id="poly-roles" className="poly-tree" role="list" aria-label="What I do">
            {[...ROLES, ENDING].map((r, i) => (
              <span key={r} role="listitem" className={`role${r === ENDING ? " ending" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                <i className="arrow" aria-hidden />
                <span className="role-text">{r}</span>
              </span>
            ))}
          </span>
        </span>
        <span className="poly-cue" aria-hidden>{cue}</span>
      </p>
    </div>
  );
}
