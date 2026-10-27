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
  function onScroll() { if (head) head.classList.toggle('is-scrolled', window.scrollY > 40); var dk = document.querySelector('[data-dock]'); if (dk && !dk.__done && window.scrollY > innerHeight * 0.9) { dk.__done = 1; dk.classList.add('is-on'); if (innerWidth < 900) setTimeout(function () { dk.classList.remove('is-on'); }, 7000); } }
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

  /* ---------------- scroll scenes (GSAP), all on their own assets */
  function scenes() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || reduce) return;
    gsap.registerPlugin(ST);
    if (window.Lenis && matchMedia('(pointer: fine)').matches) {
      var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    var mm = gsap.matchMedia();
    var frame = $('[data-hero-frame]'), himg = $('[data-hero-img]');

    /* hero: the framed salon of their old slider opens to full bleed */
    if (frame) {
      mm.add('(min-width: 900px) and (min-height: 620px)', function () {
        var g = parseFloat(getComputedStyle(frame).marginLeft) || 40;
        frame.style.marginLeft = frame.style.marginRight = '0px';
        var st = { trigger: frame, start: 'top 34%', end: 'top 68px', scrub: 0.6 };
        gsap.fromTo(frame, { clipPath: 'inset(0px ' + g + 'px 0px ' + g + 'px)' }, { clipPath: 'inset(0px 0px 0px 0px)', ease: 'none', scrollTrigger: st });
        gsap.to('.hero-title', { opacity: 0, y: -30, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 34%', end: 'top 120px', scrub: true } });
        gsap.fromTo(himg, { yPercent: 0, scale: 1 }, { yPercent: 6, scale: 1.05, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 34%', end: 'bottom top', scrub: true } });
        return function () { frame.style.marginLeft = frame.style.marginRight = ''; frame.style.clipPath = ''; };
      });
      mm.add('(max-width: 899px), (max-height: 619px)', function () {
        gsap.fromTo(himg, { yPercent: 0 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: frame, start: 'top top+=64', end: 'bottom top', scrub: true } });
      });
    }

    /* collage: their five homepage slides drift at their own depth */
    $$('.cl').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-speed')) || 0, im = $('img', el);
      gsap.fromTo(el, { y: function () { return sp * 600; } }, { y: function () { return -sp * 600; }, ease: 'none', scrollTrigger: { trigger: '.cl-stage', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
      if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* recent projects: pinned, the 2026 houses slide past */
    var track = $('[data-track]');
    if (track) {
      mm.add('(min-width: 900px) and (min-height: 620px)', function () {
        var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
        gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '.recent', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$('.hcard-img img', track).forEach(function (im) { gsap.fromTo(im, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.recent', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true } }); });
      });
    }

    /* Somió: the house's rooms stack up beside her words */
    mm.add('(min-width: 900px)', function () {
      var layers = $$('.fs-layer');
      $$('.fstep').forEach(function (step, i) {
        var L = layers[i]; if (!L || i === 0) return;
        gsap.fromTo(L, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: step, start: 'top 78%', end: 'top 52%', scrub: 0.4 } });
        gsap.fromTo($('img', L), { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: step, start: 'top 85%', end: 'bottom 20%', scrub: true } });
      });
      if (layers[0]) gsap.fromTo($('img', layers[0]), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.feat-body', start: 'top bottom', end: 'top top', scrub: true } });
    });

    /* studio film opens like a door */
    var film = $('[data-film]');
    if (film) gsap.fromTo(film, { clipPath: 'inset(10% 12% 10% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: film, start: 'top 90%', end: 'top 15%', scrub: true } });

    /* press covers move in three columns */
    $$('.pcol').forEach(function (c) {
      var sp = parseFloat(c.getAttribute('data-speed')) || 0;
      gsap.fromTo(c, { yPercent: sp * -60 }, { yPercent: sp * 60, ease: 'none', scrollTrigger: { trigger: '.press', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    addEventListener('load', function () { ST.refresh(); });
  }
  if (document.readyState === 'complete') scenes(); else addEventListener('load', scenes);
})();
