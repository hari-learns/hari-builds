"use client";

import { useEffect, useRef } from "react";

/**
 * A tall section whose scroll progress (0 to 1) is written to the --p CSS variable.
 * Children are pinned with `position: sticky` and animate purely from --p in CSS.
 */
export function Scrub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.still = "";
      el.style.setProperty("--p", "1");
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / total));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };

    // Only listen to scroll while the scene is near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", request, { passive: true });
          window.addEventListener("resize", request);
          request();
        } else {
          window.removeEventListener("scroll", request);
          window.removeEventListener("resize", request);
        }
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <section ref={ref} className={`scene ${className}`}>{children}</section>;
}
