/* Wildenberg redesign concept: one small scroll engine, every move acts on their own photos and text. */
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const roomy = () => innerWidth >= 900 && innerHeight >= 640 && !RM.matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---------- header: transparent over the hero, solid after it; hides on scroll down
  const head = d.querySelector('[data-head]');
  const hero = d.querySelector('[data-hero]');
  let lastY = scrollY;
  function headState() {
    const y = scrollY;
    if (hero && head) head.classList.toggle('is-over', y < Math.max(80, hero.offsetHeight - innerHeight * 0.6 - 72));
    if (head) head.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !d.body.classList.contains('menu-open'));
    if (y < lastY - 4 || y < 400) head && head.classList.remove('is-hidden');
    lastY = y;
  }

  // ---------- drawer
  const drawer = d.querySelector('[data-drawer]'), burger = d.querySelector('[data-burger]');
  function menu(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open); drawer.setAttribute('aria-hidden', String(!open));
    burger && burger.setAttribute('aria-expanded', String(open));
    root.style.overflow = open ? 'hidden' : ''; d.body.classList.toggle('menu-open', open);
    if (open) drawer.querySelector('[data-close]').focus(); else burger && burger.focus({ preventScroll: true });
  }
  burger && burger.addEventListener('click', () => menu(true));
  drawer && drawer.querySelector('[data-close]').addEventListener('click', () => menu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) menu(false); });

  // ---------- dock
  const dock = d.querySelector('[data-dock]');
  try { if (sessionStorage.getItem('wb-dock') === '0' && dock) dock.hidden = true; } catch (_) {}
  dock && dock.querySelector('[data-dock-close]').addEventListener('click', () => { dock.hidden = true; try { sessionStorage.setItem('wb-dock', '0'); } catch (_) {} });

  const cl = d.querySelector('[data-concept-line]');
  try { if (sessionStorage.getItem('wb-dock') === '0' && cl) cl.hidden = true; } catch (_) {}
  cl && cl.querySelector('[data-concept-close]').addEventListener('click', () => { cl.hidden = true; try { sessionStorage.setItem('wb-dock', '0'); } catch (_) {} });

  // ---------- reveals (rise / wipe); sweep reveals anything at or above the fold
  const rev = [...d.querySelectorAll('.rise, .wipe')];
  const show = el => el.classList.add('in');
  let io = null;
  if ('IntersectionObserver' in window && !RM.matches) {
    io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(el => io.observe(el));
  } else rev.forEach(show);
  function sweep() { const vh = innerHeight; rev.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }

  // ---------- hero reel: their own video, phone crop on narrow screens, poster first
  const vid = d.querySelector('[data-hero-video]');
  function startVideo() {
    if (!vid || RM.matches) return;
    const phone = matchMedia('(max-width: 700px)').matches, k = phone ? 'phone' : 'desk';
    const can = t => vid.canPlayType(t) !== '';
    vid.src = can('video/webm; codecs="vp9"') ? vid.dataset[`src${k[0].toUpperCase() + k.slice(1)}Webm`] : vid.dataset[`src${k[0].toUpperCase() + k.slice(1)}Mp4`];
    vid.addEventListener('playing', () => vid.classList.add('is-playing'), { once: true });
    const p = vid.play(); if (p && p.catch) p.catch(() => {});
  }
  if (vid) {
    const go = () => setTimeout(startVideo, 250);
    if (d.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    d.addEventListener('visibilitychange', () => { if (!vid.src) return; d.hidden ? vid.pause() : vid.play().catch(() => {}); });
  }
  const frame = d.querySelector('[data-hero-frame]'), copy = d.querySelector('[data-hero-copy]');

  // ---------- featured project: pinned layers
  const feat = d.querySelector('[data-pin]');
  const layers = feat ? [...feat.querySelectorAll('[data-layer]')] : [];
  const texts = feat ? [...feat.querySelectorAll('[data-scene-t]')] : [];
  const bar = feat && feat.querySelector('[data-feat-bar]');
  function featMode() { if (feat) feat.classList.toggle('is-pin', roomy()); }

  // ---------- identity photo zoom + card drift
  const ident = d.querySelector('[data-ident]'), identMedia = ident && ident.querySelector('.ident-media');
  const drifts = [...d.querySelectorAll('.drift img')];

  let ticking = false;
  function frameTick() {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    headState();
    root.classList.toggle('scrolled', y > 60);
    d.body.classList.toggle('mbar-on', y > vh * 0.8);
    if (frame && hero) {
      if (roomy()) {
        const p = clamp(y / (hero.offsetHeight - vh));
        const ins = p * 4;  // vw
        frame.style.transform = `scale(${1 - p * 0.1})`;
        frame.style.clipPath = `inset(${ins * 0.6}vh ${ins}vw round ${p * 6}px)`;
        if (copy) { copy.style.opacity = String(1 - clamp(p * 1.8)); copy.style.transform = `translateY(${p * -60}px)`; }
      } else { frame.style.transform = ''; frame.style.clipPath = ''; if (copy) { copy.style.opacity = ''; copy.style.transform = ''; } }
    }
    if (feat && feat.classList.contains('is-pin')) {
      const r = feat.getBoundingClientRect(), total = feat.offsetHeight - vh;
      const p = clamp(-r.top / total), n = layers.length, pos = p * (n - 1) * 1.08;
      layers.forEach((l, i) => { if (i) l.style.setProperty('--r', clamp(pos - (i - 1)).toFixed(4)); });
      texts.forEach((t, i) => t.classList.toggle('on', i === Math.min(n - 1, Math.floor(pos + 0.5))));
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
    }
    if (identMedia && !RM.matches) {
      const r = ident.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) identMedia.style.setProperty('--z', (1.12 - 0.12 * clamp((vh - r.top) / (vh + r.height * 0.5))).toFixed(4));
    }
    if (!RM.matches) for (const im of drifts) {
      const r = im.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      const c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      im.style.setProperty('--dy', (c * -0.07 * r.height).toFixed(1) + 'px');
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frameTick); } };
  addEventListener('scroll', () => { onScroll(); sweep(); }, { passive: true });
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW || !matchMedia('(pointer: coarse)').matches) { lastW = innerWidth; featMode(); onScroll(); } });
  addEventListener('pageshow', () => { sweep(); onScroll(); });
  addEventListener('load', sweep);
  featMode(); frameTick(); sweep();

  // ---------- phone bar steps aside while Room Studio is on screen
  const studioEl = d.querySelector('[data-roomstudio]');
  if (studioEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(x => d.body.classList.toggle('mbar-off', x.isIntersecting)), { rootMargin: '0px 0px -10% 0px' }).observe(studioEl.closest('section') || studioEl);
  }

  // ---------- project filter
  const grid = d.querySelector('[data-grid]');
  d.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    d.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    grid && grid.querySelectorAll('.pcard').forEach(c => { c.hidden = f !== 'all' && c.dataset.cat !== f; });
    onScroll();
  }));

  // ---------- click events for GoatCounter (whatsapp/call/email/map)
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="google.com/maps"]'); if (!a) return;
    const ev = a.href.startsWith('tel:') ? 'call' : a.href.startsWith('mailto:') ? 'email' : 'map';
    try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path: 'click-' + ev, title: ev, event: true }); } catch (_) {}
  });
})();

/* Room Studio (signature tool): the widget script loads when its section comes near; it mounts itself from the
   data-roomstudio JSON on the element (Wildenberg's gold, their type, Dutch UI). */
(() => {
  const el = document.querySelector('[data-roomstudio]');
  if (!el) return;
  const SRC = 'https://roomstudio.vercel.app/v1/roomstudio.js';
  let started = false;
  function boot() {
    if (started) return; started = true;
    const wait = el.querySelector('.studio-wait');
    const s = document.createElement('script'); s.src = SRC; s.defer = true;
    s.onload = () => { if (wait && el.shadowRoot) wait.remove(); };
    s.onerror = () => { console.warn('[studio] widget failed to load'); if (wait) wait.textContent = 'De studio kon niet laden. Mail ons gerust je foto: info@vandenwildenberg.nl'; };
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '900px 0px' });
    io.observe(el);
  } else boot();
})();
