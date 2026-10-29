/* HEXP corner badge for client concept demos. One file, no dependencies, no fonts, no network calls.
 * A small rectangle bottom-right with the HEXP tile wordmark (same 5x7 tile font, 0.75 tile in pitch, and
 * diagonal-crossbar H as hexp.studio), assembling along the crossbar like the hero, with idle blue sparkles
 * and a cursor trail. Click opens hexp.studio in a new tab. Dismissible for the visit.
 * Installed into a build by add_badge.py (never edit copies in dist/: edit this file and re-run it).
 * Optional attributes on the <script> tag: data-ref="<slug>" (sent as ?ref=), data-href (default https://hexp.studio/). */
(() => {
  if (window.__hexpBadge) return;
  window.__hexpBadge = 1;
  const me = document.currentScript;
  const ref = (me && me.dataset.ref) || '';
  const base = (me && me.dataset.href) || 'https://hexp.studio/';
  const href = ref ? base + (base.includes('?') ? '&' : '?') + 'ref=' + encodeURIComponent(ref) : base;
  const KEY = 'hexp-badge-closed';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = { bg: '#0A0A0C', tile: '#1D1D1F', fg: '#F4F5F7', blue: '#1A50E6', line: 'rgba(244,245,247,.14)', dim: 'rgba(244,245,247,.56)' };
  const TILE = 0.75;
  const FONT = {
    H: ['#...#', '#...#', '#..##', '#.#.#', '##..#', '#...#', '#...#'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  };
  const COLS = 29, ROWS = 7; // 4 letters x 5 + 3 gaps = 23 columns, then 6 columns of open grid like the hero
  const lit = new Uint8Array(COLS * ROWS);
  [...'HEXP'].forEach((ch, i) => FONT[ch].forEach((row, r) => [...row].forEach((v, c) => { if (v === '#') lit[r * COLS + i * 6 + c] = 1; })));

  const css = `
.hexp-b{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:block;background:${C.bg};color:${C.fg};
box-shadow:inset 0 0 0 1px ${C.line},0 12px 40px rgba(0,0,0,.35);padding:12px 14px 10px;text-decoration:none;
font:500 14px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0;
transform:translateY(calc(100% + 24px));opacity:0;transition:transform .7s cubic-bezier(.16,1,.3,1),opacity .4s}
.hexp-b.on{transform:none;opacity:1}
.hexp-b canvas{display:block;width:216px;height:${(216 * ROWS / COLS).toFixed(2)}px}
.hexp-b .hexp-l{display:flex;justify-content:space-between;gap:12px;margin-top:9px;color:${C.dim}}
.hexp-b:hover .hexp-l b,.hexp-b:focus-visible .hexp-l b{color:${C.fg}}
.hexp-b .hexp-l b{font-weight:500;color:${C.dim};transition:color .3s}
.hexp-b:focus-visible{outline:2px solid ${C.blue};outline-offset:3px}
.hexp-x{position:absolute;top:-18px;right:-6px;width:44px;height:44px;border:0;padding:0;cursor:pointer;background:none;
color:${C.fg};font:400 14px/1 ui-monospace,monospace}
.hexp-x::before{content:'×';position:absolute;inset:10px;display:grid;place-items:center;background:${C.bg};
box-shadow:inset 0 0 0 1px ${C.line};transition:background .25s}
.hexp-x:hover::before,.hexp-x:focus-visible::before{background:${C.blue}}
.hexp-x:focus-visible{outline:none}
@media (max-width:600px){.hexp-b{right:12px;bottom:12px;padding:10px 11px 9px}.hexp-b canvas{width:136px;height:${(136 * ROWS / COLS).toFixed(2)}px}
.hexp-b .hexp-l{margin-top:7px}.hexp-b .hexp-l>span{display:none}.hexp-b .hexp-l{justify-content:flex-end}}
@media print{.hexp-b{display:none}}`;

  function mount() {
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    const a = document.createElement('a');
    a.className = 'hexp-b';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Concept by HEXP. Opens hexp.studio in a new tab');
    a.innerHTML = '<canvas aria-hidden="true"></canvas><span class="hexp-l"><span>Concept by</span><b>hexp.studio ↗</b></span>';
    const x = document.createElement('button');
    x.className = 'hexp-x';
    x.type = 'button';
    x.setAttribute('aria-label', 'Hide');
    x.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
      a.classList.remove('on');
      setTimeout(() => a.remove(), 700);
    });
    a.appendChild(x);
    document.body.appendChild(a);
    lift(a);
    addEventListener('resize', () => lift(a));
    // The demo's own notes can be closed or appear late: re-check after clicks and once things have settled.
    document.addEventListener('click', () => setTimeout(() => lift(a), 450), true);
    setTimeout(() => lift(a), 1300);
    run(a, a.querySelector('canvas'));
  }

  // Stack above the demo's own fixed things in the bottom-right corner (phone call bars, concept notes, cookie
  // panels), never on top of them. Scans upwards from the bottom edge in the badge's column.
  function fixedTop(el, a) {
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (a.contains(n)) return null;
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return n.getBoundingClientRect().top;
    }
    return null;
  }
  function lift(a) {
    const gap = innerWidth <= 600 ? 12 : 16;
    const wide = Math.min(innerWidth - 16, a.offsetWidth || 240);
    const xs = [innerWidth - 10, innerWidth - wide / 2, innerWidth - wide + 6];
    let top = innerHeight, y = innerHeight - 3;
    while (y > innerHeight * 0.45) {
      let hit = null;
      for (const x of xs) for (const el of document.elementsFromPoint(x, y)) {
        const t = fixedTop(el, a);
        if (t !== null && t > innerHeight * 0.45) { hit = hit === null ? t : Math.min(hit, t); break; }
      }
      if (hit === null || hit >= top) { if (y < top - 6) break; y -= 6; continue; }
      top = hit;
      y = hit - 3;
    }
    a.style.bottom = (innerHeight - top + gap) + 'px';
  }

  function run(box, cv) {
    const ctx = cv.getContext('2d');
    const n = COLS * ROWS;
    const energy = new Float32Array(n), spark = new Float32Array(n), sparkTo = new Float32Array(n);
    const rnd = Float32Array.from({ length: n }, () => Math.random());
    let w = 0, h = 0, pitch = 0, raf = 0, born = -1, last = null, visible = true;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const back = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
    const outE = (t) => 1 - Math.pow(1 - t, 3);
    const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => (v + (B[i] - v) * t) | 0).join(',')})`; };
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = Math.max(1, Math.round(r.width * d));
      h = cv.height = Math.max(1, Math.round(r.height * d));
      pitch = Math.min(w / COLS, h / ROWS);
    };
    const start = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    function frame(now) {
      raf = 0;
      const s0 = pitch * TILE, inset = (pitch - s0) / 2;
      const ox = (w - pitch * COLS) / 2, oy = (h - pitch * ROWS) / 2;
      ctx.clearRect(0, 0, w, h);
      let busy = false;
      const age = born < 0 ? -1 : now - born;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const k = r * COLS + c, isLit = lit[k];
        let e = energy[k];
        if (e > 0.004) { energy[k] = e * 0.94; busy = true; } else energy[k] = e = 0;
        let sp = spark[k];
        if (sparkTo[k] > 0) { sp += (sparkTo[k] - sp) * 0.035; if (sp >= sparkTo[k] * 0.96) sparkTo[k] = 0; }
        else if (sp > 0.004) sp *= 0.98; else sp = 0;
        spark[k] = sp;
        if (sp > e) e = sp;
        let s = 1;
        if (age >= 0 && !reduced) {
          const diag = c + (ROWS - 1 - r);
          const t = clamp((age - (diag * (isLit ? 26 : 10) + rnd[k] * (isLit ? 140 : 220))) / (isLit ? 560 : 380));
          s = isLit ? back(t) : outE(t);
          if (t < 1) busy = true;
        } else if (age < 0) s = 0;
        if (s <= 0) continue;
        let fill;
        if (isLit) fill = e > 0.02 ? mix(C.fg, C.blue, clamp(e * 1.4)) : C.fg;
        else {
          if (!reduced && !sparkTo[k] && spark[k] < 0.01 && Math.random() < 0.00012) sparkTo[k] = 0.4 + Math.random() * 0.45;
          fill = e > 0.02 ? mix(C.tile, C.blue, clamp(e)) : C.tile;
        }
        // Unlit tiles rest as small dots (the grid in the hero) and swell to full size when lit by a sparkle or the cursor.
        const z = s0 * s * (isLit ? 1 - e * 0.18 : 0.3 + 0.7 * clamp(e * 1.3));
        ctx.fillStyle = fill;
        ctx.fillRect(ox + c * pitch + inset + (s0 - z) / 2, oy + r * pitch + inset + (s0 - z) / 2, z, z);
      }
      if (busy || !reduced) start();
    }
    function paint(px, py) {
      const ox = (w - pitch * COLS) / 2, oy = (h - pitch * ROWS) / 2, R = pitch * 1.8;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = 1 - Math.hypot(ox + (c + 0.5) * pitch - px, oy + (r + 0.5) * pitch - py) / R;
        const k = r * COLS + c;
        if (e > energy[k]) energy[k] = e;
      }
    }
    box.addEventListener('pointermove', (ev) => {
      if (reduced) return;
      const r = cv.getBoundingClientRect(), d = w / r.width;
      const p = [(ev.clientX - r.left) * d, (ev.clientY - r.top) * d];
      const from = last || p, steps = Math.max(1, Math.ceil(Math.hypot(p[0] - from[0], p[1] - from[1]) / (pitch * 0.5)));
      for (let i = 1; i <= steps; i++) paint(from[0] + (p[0] - from[0]) * i / steps, from[1] + (p[1] - from[1]) * i / steps);
      last = p;
      start();
    });
    box.addEventListener('pointerleave', () => { last = null; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; } }).observe(cv);
    addEventListener('resize', () => { size(); start(); });
    size();
    // Pop up after the page has settled, then assemble the tiles.
    setTimeout(() => {
      box.classList.add('on');
      setTimeout(() => { born = performance.now(); start(); }, reduced ? 0 : 280);
    }, reduced ? 300 : 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
