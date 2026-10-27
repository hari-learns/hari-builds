/* Natalia Zubizarreta concept: every motion acts on their own photos, words and numbers. */
(function () {
  'use strict';
  clearTimeout(window.__rvT);
  var H = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  requestAnimationFrame(function () { requestAnimationFrame(function () { H.classList.add('is-ready'); }); });
  function gc(path) { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path: 'demo/natalia-zubizarreta/' + path, title: path, event: true }); } catch (e) {} }

  /* header */
  var head = $('[data-head]');
  function onScroll() { if (head) head.classList.toggle('is-scrolled', window.scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $('[data-drawer]'), burger = $('[data-burger]');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open); drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    H.style.overflow = open ? 'hidden' : '';
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
    if (open) { var f = $('a', drawer); f && f.focus(); } else burger.focus();
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(true); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) setDrawer(false); });

  /* phone action bar steps aside while the Room Studio form (or the footer) is on screen, so it never covers it */
  var bar = $('[data-actbar]'), zones = $$('[data-roomstudio], .site-foot, .cta');
  if (bar && zones.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var zo = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); }); bar.classList.toggle('is-away', seen.size > 0); }, { threshold: 0 });
    zones.forEach(function (z) { zo.observe(z); });
  }

  /* concept dock */
  var dock = $('[data-dock]');
  try { if (sessionStorage.getItem('nz-dock') === '1' && dock) dock.classList.add('is-hidden'); } catch (e) {}
  var dx = $('[data-dock-x]');
  if (dx) dx.addEventListener('click', function () { dock.classList.add('is-hidden'); try { sessionStorage.setItem('nz-dock', '1'); } catch (e) {} });

  /* reveals (IntersectionObserver + a sweep so nothing is ever stranded) */
  var rv = $$('.rv,.rv-img,.rv-hero');
  function act(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(act);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { act(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.96) act(el); }); };
    ['load', 'pageshow', 'resize'].forEach(function (ev) { addEventListener(ev, sweep); });
    var st; addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(sweep, 120); }, { passive: true });
    sweep();
  }

  /* statement: their sentence lights up word by word as you read down */
  var words = $('[data-words]');
  if (words) {
    var ws = $$('.w', words);
    if (reduce) ws.forEach(function (w) { w.classList.add('on'); });
    else {
      var paint = function () {
        var r = words.getBoundingClientRect(), vh = innerHeight;
        var p = (vh * 0.86 - r.top) / (r.height + vh * 0.32);
        var n = Math.round(Math.max(0, Math.min(1, p)) * ws.length);
        ws.forEach(function (w, i) { w.classList.toggle('on', i < n); });
      };
      addEventListener('scroll', paint, { passive: true }); addEventListener('resize', paint); paint();
    }
  }

  /* counters on their real figures; always land exactly on the number */
  $$('[data-count]').forEach(function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    if (reduce || !('IntersectionObserver' in window)) return;
    el.textContent = '0';
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var t0 = performance.now(), d = 1600;
      var step = function (t) { var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = String(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); setTimeout(function () { el.textContent = String(to); }, d + 400);
    }, { threshold: 0.4 });
    o.observe(el);
  });

  /* obras filters */
  var filters = $('[data-filters]'), grid = $('[data-grid]');
  if (filters && grid) {
    var state = { cat: '', region: '' }, cards = $$('.pcard', grid), count = $('[data-fcount]');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var f = b.getAttribute('data-f'); state[f] = b.getAttribute('data-v');
      $$('.chip[data-f="' + f + '"]', filters).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!state.cat || c.getAttribute('data-cat') === state.cat) && (!state.region || c.getAttribute('data-region') === state.region);
        c.hidden = !ok; if (ok) { n++; c.querySelectorAll('.rv-img').forEach(act); }
      });
      count.textContent = n === 1 ? '1 obra' : n + ' obras';
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

  /* lightbox for project photos */
  var lb = $('[data-lbox]');
  if (lb && lb.showModal) {
    var links = $$('[data-lb]'), li = 0, lbimg = $('[data-lbimg]', lb);
    var show = function (i) { li = (i + links.length) % links.length; var a = links[li]; lbimg.src = a.href; lbimg.width = +a.dataset.w || 1100; lbimg.height = +a.dataset.h || 1100; var im = a.querySelector('img'); lbimg.alt = im ? im.alt : ''; };
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); lb.showModal(); if (window.__lenis) window.__lenis.stop(); }); });
    $('[data-lb-x]', lb).addEventListener('click', function () { lb.close(); });
    $('[data-lb-p]', lb).addEventListener('click', function () { show(li - 1); });
    $('[data-lb-n]', lb).addEventListener('click', function () { show(li + 1); });
    lb.addEventListener('close', function () { if (window.__lenis) window.__lenis.start(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'ArrowRight') show(li + 1); });
  }

  /* their studio film: muted loop plays only while on screen; the full film opens with sound on request */
  $$('video[data-autoplay]').forEach(function (v) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }); }, { threshold: 0.2 });
    o.observe(v);
  });
  var fb = $('[data-filmbox]'), fo = $('[data-film-open]');
  if (fb && fo && fb.showModal) {
    var fv = $('[data-filmbox-video]', fb);
    fo.addEventListener('click', function () { fb.showModal(); gc('film'); if (window.__lenis) window.__lenis.stop(); var p = fv.play(); if (p && p.catch) p.catch(function () {}); });
    $('[data-filmbox-x]', fb).addEventListener('click', function () { fb.close(); });
    fb.addEventListener('close', function () { fv.pause(); if (window.__lenis) window.__lenis.start(); });
  }

  /* hero: their homepage slider, kept: slow crossfade through their six slides, caption names the project */
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('.slide', slider), cap = $('[data-slide-cap]'), num = $('[data-slide-n]'), si = 0, timer;
    var go = function (n) {
      slides[si].classList.remove('is-on'); si = (n + slides.length) % slides.length; slides[si].classList.add('is-on');
      var s = slides[si];
      if (cap) { cap.textContent = s.getAttribute('data-cap'); var h = s.getAttribute('data-href'); if (h) { cap.setAttribute('href', h); cap.removeAttribute('aria-disabled'); } else { cap.removeAttribute('href'); } }
      if (num) num.textContent = ('0' + (si + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
    };
    if (!reduce && slides.length > 1) {
      var start = function () { clearInterval(timer); timer = setInterval(function () { if (!document.hidden) go(si + 1); }, 6500); };
      start();
      slider.addEventListener('click', function () { go(si + 1); start(); });
    }
  }

  /* Somió: the room beside each sentence crossfades in as you read */
  var steps = $$('.fstep'), layers = $$('.fs-layer');
  if (steps.length && layers.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.getAttribute('data-step');
        layers.forEach(function (l, k) { l.classList.toggle('is-on', k === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* gentle smooth scrolling on desktop pointers only */
  if (!reduce && window.Lenis && matchMedia('(pointer: fine)').matches) {
    var lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
