/* Jeroen de Nijs concept: menu, concept note, reveals of their photos and text, a slow parallax on the lead photo,
   the wall filter, and the phone action bar that steps aside for Room Studio. No libraries. */
(() => {
  const d = document, root = d.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (_) { return null; } };

  // header shadow on scroll
  const head = d.querySelector('[data-head]');
  const onScroll = () => head && head.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // drawer
  const drawer = d.querySelector('[data-drawer]'), burger = d.querySelector('[data-burger]');
  const setDrawer = open => {
    if (!drawer) return;
    drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open));
    burger && burger.setAttribute('aria-expanded', String(open)); root.style.overflow = open ? 'hidden' : '';
    if (open) drawer.querySelector('nav a')?.focus(); else burger?.focus();
  };
  burger?.addEventListener('click', () => setDrawer(true));
  drawer?.querySelector('[data-close]')?.addEventListener('click', () => setDrawer(false));
  addEventListener('keydown', ev => { if (ev.key === 'Escape' && drawer?.classList.contains('open')) setDrawer(false); });

  // concept note (one dismissal hides both forms for this visit)
  const note = d.querySelector('[data-concept-line]'), dock = d.querySelector('[data-dock]');
  if (ss('jdn-note') === '0') { note?.classList.add('gone'); dock?.classList.add('gone'); }
  const hideNote = () => { note?.classList.add('gone'); dock?.classList.add('gone'); ss('jdn-note', '0'); };
  d.querySelector('[data-concept-close]')?.addEventListener('click', hideNote);
  d.querySelector('[data-dock-close]')?.addEventListener('click', hideNote);

  // reveals
  const hero = d.querySelector('.hero');
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('in')));
  const els = d.querySelectorAll('.rise, .wipe');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(x => x.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    els.forEach(x => io.observe(x));
  }

  // slow parallax on the lead photo (hero) and the project cover, max ~6% of the frame
  const par = [...d.querySelectorAll('[data-parallax]')];
  if (par.length && !reduce) {
    par.forEach(x => { const img = x.tagName === 'IMG' ? x : x.querySelector('img'); if (img) { img.style.transform = 'scale(1.08)'; img.style.transformOrigin = '50% 50%'; } });
    let tick = false;
    const run = () => {
      tick = false;
      for (const x of par) {
        const r = x.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
        const img = x.tagName === 'IMG' ? x : x.querySelector('img'); if (!img) continue;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
        img.style.transform = `translate3d(0, ${(p * -3.5).toFixed(2)}%, 0) scale(1.08)`;
      }
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true }); run();
  }

  // wall filter (all projects page); #wonen etc. preselects
  const filt = d.querySelector('[data-filter]'), wall = d.querySelector('[data-wall]');
  if (filt && wall) {
    const apply = cat => {
      filt.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
      wall.querySelectorAll('.tile').forEach(t => { t.hidden = !(cat === 'all' || t.dataset.cat === cat); if (!t.hidden) t.classList.add('in'); });
    };
    filt.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; apply(b.dataset.cat); history.replaceState(null, '', b.dataset.cat === 'all' ? location.pathname : '#' + b.dataset.cat); });
    const h = location.hash.slice(1); if (h && filt.querySelector(`[data-cat="${h}"]`)) apply(h);
  }

  // phone action bar: after the first screen, never over Room Studio
  const bar = d.querySelector('[data-mbar]');
  if (bar) {
    const zone = d.querySelector('[data-studio-zone]'); let inZone = false;
    const upd = () => bar.classList.toggle('show', scrollY > innerHeight * 0.6 && !inZone && !drawer?.classList.contains('open'));
    if (zone && 'IntersectionObserver' in window) new IntersectionObserver(es => { inZone = es[0].isIntersecting; upd(); }).observe(zone);
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // clicks worth counting (GoatCounter is added at deploy)
  d.addEventListener('click', ev => {
    const a = ev.target.closest('[data-track]'); if (!a) return;
    try { window.goatcounter?.count?.({ path: 'click-' + a.dataset.track, title: a.dataset.track, event: true }); } catch (_) {}
  });
})();
