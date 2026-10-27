/* stanke interiordesign concept: slider, reveals, gentle parallax, drawer, dock, phone bar, project filter. No framework. */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = d) => el.querySelector(s), $$ = (s, el = d) => [...el.querySelectorAll(s)];

  // concept note: dismiss for this session
  const dx = $('#dock-x');
  if (dx) dx.addEventListener('click', () => { root.classList.add('dock-off'); try { sessionStorage.setItem('sid-dock', '1'); } catch (_) {} });

  // drawer
  const dr = $('#drawer'), burgers = $$('.burger'), dclose = $('#drawer-x');
  const setDrawer = open => {
    if (!dr) return;
    dr.classList.toggle('open', open); dr.setAttribute('aria-hidden', String(!open));
    burgers.forEach(b => b.setAttribute('aria-expanded', String(open)));
    d.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => dclose && dclose.focus(), 50);
  };
  burgers.forEach(b => b.addEventListener('click', () => setDrawer(true)));
  if (dclose) dclose.addEventListener('click', () => setDrawer(false));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && dr && dr.classList.contains('open')) setDrawer(false); });

  // header turns solid after the hero (desktop, image-first pages)
  const hd = $('#hd'), first = $('.hero, .ph-hero');
  if (hd && first && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => hd.classList.toggle('hd--solid', !en.isIntersecting), { rootMargin: '-90px 0px 0px 0px' }).observe(first);
  }

  // hero slider: their nine slides and captions, crossfade
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.slide', hero), caps = $$('.cap-item', hero), num = $('.hero-n', hero), barI = $('.hero-bar i', hero);
    const btnP = $('[data-hero="prev"]', hero), btnN = $('[data-hero="next"]', hero), btnT = $('[data-hero="toggle"]', hero);
    let i = 0, timer = null, playing = !reduce, loaded = false;
    const loadAll = () => {
      if (loaded) return; loaded = true;
      slides.forEach(s => { const im = $('img[data-src]', s); if (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); } });
    };
    const show = n => {
      loadAll();
      const prev = i; i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('was', k === prev && k !== i); s.setAttribute('aria-hidden', String(k !== i)); });
      caps.forEach((c, k) => c.classList.toggle('on', k === i));
      if (num) num.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      if (barI) { barI.classList.remove('run'); void barI.offsetWidth; if (playing) barI.classList.add('run'); }
    };
    const tick = () => { clearTimeout(timer); if (playing) timer = setTimeout(() => { show(i + 1); tick(); }, 6500); };
    btnN && btnN.addEventListener('click', () => { show(i + 1); tick(); });
    btnP && btnP.addEventListener('click', () => { show(i - 1); tick(); });
    btnT && btnT.addEventListener('click', () => {
      playing = !playing; btnT.setAttribute('aria-label', playing ? btnT.dataset.pause : btnT.dataset.play);
      btnT.innerHTML = playing ? btnT.dataset.ipause : btnT.dataset.iplay; show(i); tick();
    });
    d.addEventListener('visibilitychange', () => { if (d.hidden) clearTimeout(timer); else tick(); });
    addEventListener('load', () => setTimeout(loadAll, 1200));
    if (barI && playing) barI.classList.add('run');
    tick();
    // swipe on touch
    let sx = null;
    hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => { if (sx == null) return; const dx2 = e.changedTouches[0].clientX - sx; if (Math.abs(dx2) > 50) { show(i + (dx2 < 0 ? 1 : -1)); tick(); } sx = null; });
  }

  // reveals
  const rv = $$('.rv, .rvi');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(el => io.observe(el));
  }

  // gentle parallax on large photos (desktop only, a few percent)
  const px = $$('.px');
  if (px.length && !reduce && matchMedia('(min-width: 1000px)').matches) {
    let ticking = false;
    const run = () => {
      ticking = false; const vh = innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; const im = el.querySelector('img');
        if (im && el.classList.contains('in')) im.style.transform = `translateY(${(p * -4).toFixed(2)}%) scale(1.08)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    px.forEach(el => { const im = el.querySelector('img'); if (im) setTimeout(() => { im.style.transition = 'none'; }, 2000); });
  }

  // phone action bar: away while a Room Studio widget is on screen
  const bar = $('.bar'), mounts = $$('.rs-mount');
  if (bar && mounts.length && 'IntersectionObserver' in window) {
    const vis = new Set();
    new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? vis.add(en.target) : vis.delete(en.target)); bar.classList.toggle('away', vis.size > 0); }, { threshold: 0.01 })
      .observe(mounts[0]);
    mounts.slice(1).forEach(m => { const io2 = new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? vis.add(en.target) : vis.delete(en.target)); bar.classList.toggle('away', vis.size > 0); }, { threshold: 0.01 }); io2.observe(m); });
  }

  // project filter chips
  const chips = $$('.chip[data-f]');
  if (chips.length) {
    const cards = $$('.cards [data-cat]');
    const apply = f => {
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.f === f)));
      cards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
    };
    chips.forEach(c => c.addEventListener('click', () => { apply(c.dataset.f); try { history.replaceState(null, '', c.dataset.f === 'all' ? location.pathname : '#' + c.dataset.f); } catch (_) {} }));
    const h = location.hash.slice(1); if (chips.some(c => c.dataset.f === h)) apply(h);
  }
})();
