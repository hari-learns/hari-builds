"use client";

import { useEffect, useRef, useState } from "react";
import { ShaderCanvas } from "./ShaderCanvas";
import { WHATSAPP_PATH } from "./WhatsAppButton";

export type Book = {
  title: string; industry: string; body: string;
  colors: [string, string, string, string];
  href?: string; preview?: string; video?: string;
  /** A book that is a call to action, not a project: opens to a reach-out button and a WhatsApp icon. */
  action?: { email: string; phone: string };
};

// Spine heights vary a little so the row reads as books, not tabs.
const HEIGHTS = [19, 21, 18.5, 20.5, 19.5, 21.5, 18, 20];

export function Shelf({ books }: { books: Book[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const root = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // Only the open book's hero animation plays; the rest stay paused.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) v.play().catch(() => {});
      else v.pause();
    });
  }, [active]);

  // Focus mode: while a book is open, the rest of the page goes quiet.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-focus", active !== null);
    return () => document.documentElement.removeAttribute("data-focus");
  }, [active]);

  // On touch screens there's no mouse-leave, so a tap outside the shelf closes the book.
  useEffect(() => {
    if (active === null) return;
    const away = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !root.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [active]);

  const canHover = () => window.matchMedia("(hover: hover)").matches;

  return (
    <div ref={root} className={`shelf${active !== null ? " focus" : ""}`} onPointerLeave={(e) => { if (e.pointerType === "mouse") setActive(null); }}>
      {books.map((b, i) => {
        const open = active === i;
        return (
          <div
            key={b.title}
            className={`book${open ? " open" : ""}${b.action ? " cta" : ""}`}
            style={{ "--h": `${HEIGHTS[i % HEIGHTS.length]}rem` } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={b.title}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(i); }}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPointer({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
            }}
            onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setActive(i); }}
            onClick={() => setActive(open && !canHover() ? null : i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); }
              if (e.key === "Escape") setActive(null);
            }}
          >
            <span className="book-label" aria-hidden={!open}>
              <span className="label-name">{b.industry.replace(/ industry$/i, "")}</span>
              <span className="label-rule" />
              <span className="label-tag">Industry</span>
            </span>

            <span className="book-clip">
            <ShaderCanvas colors={b.colors} hover={open} pointer={pointer} paused={active !== null && !open} />
            <span className="book-shade" aria-hidden />

            <span className="spine" aria-hidden={open}>
              <span className="spine-title">{b.title}</span>
            </span>

            <span className="cover" aria-hidden={!open}>
              {b.action ? (
                <>
                  <span className="cover-future">{b.body}</span>
                  <span className="cover-title">{b.title}</span>
                  <span className="cover-actions">
                    <a href={`mailto:${b.action.email}`} className="cover-cta" tabIndex={open ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                      Reach out to me <span aria-hidden>{"\u2192"}</span>
                    </a>
                    <a href={`https://wa.me/${b.action.phone}`} target="_blank" rel="noopener noreferrer" className="cover-wa" aria-label="Message me on WhatsApp" tabIndex={open ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={WHATSAPP_PATH} /></svg>
                    </a>
                  </span>
                </>
              ) : (
                <>
              {b.preview && (
                  <span className="cover-frame">
                    <span className="cover-bar"><i /><i /><i /><span>{b.href?.replace("https://", "")}</span></span>
                    {b.video ? (
                      <video ref={(el) => { videos.current[i] = el; }} src={b.video} poster={b.preview} muted loop playsInline preload="auto" disableRemotePlayback />
                    ) : (
                      <img src={b.preview} alt="" loading="lazy" />
                    )}
                  </span>
                )}
                <span className="cover-title">{b.title}</span>
                <span className="cover-body">{b.body}</span>
                {b.href && (
                  <a href={b.href} target="_blank" rel="noopener noreferrer" className="cover-link" tabIndex={open ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                    Visit <span aria-hidden>↗</span>
                  </a>
                )}
                </>
              )}
            </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
