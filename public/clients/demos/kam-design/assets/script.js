/* KAM Design concept: reveals, featured-home layering, drift, filters, before/after, mail form, Room Studio loader. No deps. */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];

  // concept note (dismissible, remembered per tab)
  const dock = d.querySelector('[data-dock]');
  try { if (sessionStorage.getItem('kam-dock') === '1' && dock) dock.classList.add('is-gone'); } catch (e) {}
  d.querySelector('[data-dock-x]')?.addEventListener('click', () => { dock.classList.add('is-gone'); try { sessionStorage.setItem('kam-dock', '1'); } catch (e) {} });

  // drawer
  const drawer = d.querySelector('[data-drawer]'), burger = d.querySelector('[data-burger]');
  const setDrawer = open => {
    drawer.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
    root.style.overflow = open ? 'hidden' : '';
    if (open) drawer.querySelector('a')?.focus(); else burger.focus();
  };
  burger?.addEventListener('click', () => setDrawer(true));
  d.querySelector('[data-close]')?.addEventListener('click', () => setDrawer(false));
  d.addEventListener('keydown', ev => { if (ev.key === 'Escape' && drawer?.classList.contains('is-open')) setDrawer(false); });

  // reveals (stagger siblings), with a sweep so nothing scrolled past stays hidden
  const items = $$('.rise, .wipe');
  items.forEach(el => { const sib = [...el.parentElement.children].filter(x => x.classList.contains('rise') || x.classList.contains('wipe')); const i = sib.indexOf(el); if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 0.07 + 's'); });
  const show = el => el.classList.add('in');
  if (reduce || !('IntersectionObserver' in window)) items.forEach(show);
  else {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
    const sweep = () => { const vh = innerHeight; items.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ['load', 'scroll', 'resize', 'pageshow'].forEach(ev => addEventListener(ev, sweep, { passive: true })); sweep();
  }

  // featured home: the chapter in view brings its photo over the last one
  const chaps = $$('[data-chap]'), lays = $$('[data-lay]');
  if (chaps.length && lays.length && 'IntersectionObserver' in window) {
    const set = i => { chaps.forEach(c => c.classList.toggle('is-on', +c.dataset.chap === i)); lays.forEach(l => { const n = +l.dataset.lay; l.classList.toggle('on', n <= i); }); };
    const cio = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) set(+x.target.dataset.chap); }), { rootMargin: '-45% 0px -45% 0px' });
    chaps.forEach(c => cio.observe(c)); set(0);
  }

  // drift: photo moves slightly slower than its frame (desktop, motion allowed)
  const drifts = $$('.drift');
  if (drifts.length && !reduce && matchMedia('(min-width: 960px)').matches) {
    let tick = false;
    const run = () => { tick = false; const vh = innerHeight; drifts.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const p = (r.top + r.height / 2 - vh / 2) / vh; el.style.transform = `translate3d(0, ${(-p * 5).toFixed(2)}%, 0)`; }); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true }); run();
  }

  // town filter on room-type pages
  const chips = $$('[data-f]'), grid = d.querySelector('[data-filter-grid]');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === c)); const f = c.dataset.f;
    $$('.rcard', grid).forEach(card => { const hit = f === 'all' || card.dataset.town === f; card.classList.toggle('is-out', !hit); if (hit) card.classList.add('in'); });
  }));

  // before / after
  $$('[data-ba]').forEach(b => { const fr = b.querySelector('.ba-frame'), r = b.querySelector('[data-ba-range]'); const up = () => fr.style.setProperty('--x', r.value + '%'); r.addEventListener('input', up); up(); });

  // contact form -> the visitor's own email app, filled in (nothing is sent by the page)
  const form = d.querySelector('[data-mailform]');
  form?.addEventListener('submit', ev => {
    ev.preventDefault(); let ok = true;
    $$('[required]', form).forEach(f => { const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); f.classList.toggle('is-bad', bad); f.setAttribute('aria-invalid', bad); if (bad && ok) { f.focus(); ok = false; } });
    if (!ok) return;
    const v = n => (form.elements[n]?.value || '').trim();
    const types = $$('input[name="type"]:checked', form).map(x => x.value).join(', ');
    const body = [v('message'), '', `Name: ${v('first')} ${v('last')}`, `Email: ${v('email')}`, v('town') && `Town: ${v('town')}`, types && `Project: ${types}`].filter(x => x !== false && x !== '').join('\n');
    location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(v('subject'))}&body=${encodeURIComponent(body)}`;
  });

  // phone action bar steps aside while the studio is on screen
  const bar = d.querySelector('[data-mbar]'), studio = d.querySelector('[data-studio]');
  if (bar && 'IntersectionObserver' in window) {
    const hide = { studio: false, hero: false }, upd = () => bar.classList.toggle('is-hidden', hide.studio || hide.hero);
    if (studio) new IntersectionObserver(es => es.forEach(x => { hide.studio = x.isIntersecting; upd(); }), { rootMargin: '0px 0px -10% 0px' }).observe(studio.closest('.studio-frame') || studio);
    const heroAct = d.querySelector('.hero .actions');
    if (heroAct) new IntersectionObserver(es => es.forEach(x => { hide.hero = x.isIntersecting; upd(); })).observe(heroAct);
  }

  // Room Studio: load the widget when its section comes near (keeps the first screen fast)
  if (studio) {
    let started = false;
    const boot = () => {
      if (started) return; started = true;
      const s = d.createElement('script'); s.src = 'https://roomstudio.vercel.app/v1/roomstudio.js'; s.defer = true;
      s.onload = () => { const w = studio.querySelector('.studio-wait'); if (w && studio.shadowRoot) w.remove(); };
      s.onerror = () => { console.warn('[studio] widget failed to load'); const w = studio.querySelector('.studio-wait'); if (w) w.textContent = 'The studio could not load. Email Kim a photo of your room: kim@kaminteriordesign.com'; };
      d.head.appendChild(s);
    };
    if ('IntersectionObserver' in window) { const sio = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { sio.disconnect(); boot(); } }, { rootMargin: '900px 0px' }); sio.observe(studio); }
    else boot();
  }
})();
