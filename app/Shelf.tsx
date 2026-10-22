"use client";

import { useEffect, useRef, useState } from "react";
import { ShaderCanvas } from "./ShaderCanvas";

export type Book = {
  title: string; industry: string; body: string;
  colors: [string, string, string, string];
  dark: [string, string, string, string];
  href?: string; preview?: string; video?: string;
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Books follow the page theme: soft pastels in light mode, deep tones in dark.
  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

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
            className={`book${open ? " open" : ""}`}
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
            <ShaderCanvas colors={theme === "dark" ? b.dark : b.colors} hover={open} pointer={pointer} />
            <span className="book-shade" aria-hidden />

            <span className="spine" aria-hidden={open}>
              <span className="spine-index">{String(i + 1).padStart(2, "0")}</span>
              <span className="spine-title">{b.title}</span>
            </span>

            <span className="cover" aria-hidden={!open}>
              {b.preview && (
                <span className="cover-frame">
                  <span className="cover-bar"><i /><i /><i /><span>{b.href?.replace("https://", "")}</span></span>
                  {b.video ? (
                    <video ref={(el) => { videos.current[i] = el; }} src={b.video} poster={b.preview} muted loop playsInline preload="none" />
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
            </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
