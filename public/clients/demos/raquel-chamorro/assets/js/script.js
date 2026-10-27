/* Raquel Chamorro concept: every motion acts on their own photos and words; restrained, in their spirit. */
(function () {
  'use strict';
  clearTimeout(window.__rvT);
  var H = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* header condenses once the page moves */
  /* header: their centred logo scrolls away, the nav row stays (sticky with a negative top, no layout jump) */
  var head = $('[data-head]'), navEl = head && $('.nav', head), stickAt = 0;
  function measure() { if (!head || !navEl) return; var big = matchMedia('(min-width: 861px)').matches; stickAt = big ? navEl.offsetTop - 4 : 0; head.style.top = big ? (-stickAt) + 'px' : ''; onScroll(); }
  function onScroll() { if (head) head.classList.toggle('is-scrolled', head.getBoundingClientRect().top <= -stickAt + 0.5 && window.scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', measure); addEventListener('load', measure); measure();

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

  /* phone action bar steps aside while the Room Studio widget, the contact band or the footer is on screen */
  var bar = $('[data-actbar]'), zones = $$('[data-roomstudio], .site-foot, .cband, .contact-card, .hero-acts, .obra-acts');
  if (bar && zones.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var zo = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); }); bar.classList.toggle('is-away', seen.size > 0); }, { threshold: 0 });
    zones.forEach(function (z) { zo.observe(z); });
  }

  /* concept dock */
  var dock = $('[data-dock]');
  try { if (sessionStorage.getItem('rc-dock') === '1' && dock) dock.classList.add('is-hidden'); } catch (e) {}
  var dx = $('[data-dock-x]');
  if (dx) dx.addEventListener('click', function () { dock.classList.add('is-hidden'); try { sessionStorage.setItem('rc-dock', '1'); } catch (e) {} });

  /* reveals */
  var rv = $$('.rv,.rv-img');
  function act(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(act);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { act(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.96) act(el); }); };
    ['load', 'pageshow', 'resize'].forEach(function (ev) { addEventListener(ev, sweep); });
    var st; addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(sweep, 120); }, { passive: true });
    sweep();
  }

  /* hero: their homepage slider, kept: slow crossfade, arrows like theirs, caption names the project */
  var slider = $('[data-slider]');
  if (slider) {
    var slides = $$('.slide', slider), cap = $('[data-slide-cap]'), num = $('[data-slide-n]'), si = 0, timer;
    var go = function (n) {
      slides[si].classList.remove('is-on'); si = (n + slides.length) % slides.length; slides[si].classList.add('is-on');
      var s = slides[si], c = s.getAttribute('data-cap'), h = s.getAttribute('data-href');
      if (cap) { cap.textContent = c || ''; if (h) cap.setAttribute('href', h); else cap.removeAttribute('href'); }
      if (num) num.textContent = ('0' + (si + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
      var nx = slides[(si + 1) % slides.length].querySelector('img'); if (nx) nx.loading = 'eager';
    };
    var start = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!document.hidden) go(si + 1); }, 6500); };
    start();
    var nb = $('[data-sl-next]', slider), pb = $('[data-sl-prev]', slider);
    nb && nb.addEventListener('click', function (e) { e.stopPropagation(); go(si + 1); start(); });
    pb && pb.addEventListener('click', function (e) { e.stopPropagation(); go(si - 1); start(); });
    slider.addEventListener('click', function () { go(si + 1); start(); });
    var tx = null;
    slider.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) { if (tx === null) return; var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) { go(si + (d < 0 ? 1 : -1)); start(); } tx = null; });
  }

  /* feature: their photos drift at slightly different speeds (desktop only) */
  var drift = $$('[data-speed]');
  if (drift.length && !reduce && matchMedia('(min-width: 901px)').matches) {
    var tick = false;
    var paint = function () {
      tick = false; var vh = innerHeight;
      drift.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(); var p = (r.top + r.height / 2 - vh / 2); el.style.transform = 'translate3d(0,' + (p * +el.getAttribute('data-speed')).toFixed(1) + 'px,0)'; });
    };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(paint); } }, { passive: true }); paint();
  }

  /* Mallorca: one frame, their photos crossfade as you scroll through it */
  var mal = $('[data-mallorca]');
  if (mal && !reduce) {
    var stage = $('.mal-stage', mal), layers = $$('.m-layer', mal), last = 0;
    var upd = function () {
      if (getComputedStyle($('.mal-sticky', mal)).position !== 'sticky') return;
      var r = stage.getBoundingClientRect(), span = r.height - innerHeight * 0.7;
      var p = Math.max(0, Math.min(0.999, (110 - r.top) / Math.max(1, span)));
      var i = Math.floor(p * layers.length);
      if (i !== last) { layers[last].classList.remove('is-on'); layers[i].classList.add('is-on'); last = i; }
    };
    addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* proyectos: their four categories as tabs; #viviendas etc. opens one */
  var tabs = $('[data-tabs]'), grid = $('[data-grid]');
  if (tabs && grid) {
    var cards = $$('.pcard', grid), count = $('[data-fcount]');
    var pick = function (v) {
      $$('.tab', tabs).forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-v') === v ? 'true' : 'false'); });
      var n = 0;
      cards.forEach(function (c) { var ok = !v || c.getAttribute('data-cat') === v; c.hidden = !ok; if (ok) { n++; c.querySelectorAll('.rv-img').forEach(act); } });
      count.textContent = n === 1 ? '1 proyecto' : n + ' proyectos';
    };
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (!b) return; var v = b.getAttribute('data-v'); pick(v); try { history.replaceState(null, '', v ? '#' + v : location.pathname); } catch (er) {} });
    var h = location.hash.slice(1); if (h && $('.tab[data-v="' + h + '"]', tabs)) pick(h);
  }

  /* project strip: arrows + counter (desktop); on phones the photos simply stack */
  var track = $('[data-strip-track]');
  if (track) {
    var items = $$('.st-i', track), cnt = $('[data-strip-n]');
    var cur = function () { var x = track.scrollLeft, best = 0, bd = 1e9; items.forEach(function (it, i) { var d = Math.abs(it.offsetLeft - track.offsetLeft - x - parseFloat(getComputedStyle(track).paddingLeft)); if (d < bd) { bd = d; best = i; } }); return best; };
    var show = function () { if (cnt) cnt.textContent = (cur() + 1) + ' / ' + items.length; };
    var to = function (i) { i = Math.max(0, Math.min(items.length - 1, i)); track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: reduce ? 'auto' : 'smooth' }); };
    var nx = $('[data-strip-next]'), pv = $('[data-strip-prev]');
    nx && nx.addEventListener('click', function () { to(cur() + 1); });
    pv && pv.addEventListener('click', function () { to(cur() - 1); });
    track.addEventListener('scroll', function () { requestAnimationFrame(show); }, { passive: true });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); to(cur() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); to(cur() - 1); } });
    /* vertical wheel over the strip moves it sideways only when it can (desktop mice) */
  }

  /* lightbox */
  var lb = $('[data-lbox]');
  if (lb && lb.showModal) {
    var links = $$('[data-lb]'), li = 0, lbimg = $('[data-lbimg]', lb), lbc = $('[data-lbc]', lb);
    var showL = function (i) { li = (i + links.length) % links.length; var a = links[li]; lbimg.src = a.href; lbimg.width = +a.dataset.w || 1200; lbimg.height = +a.dataset.h || 800; var im = a.querySelector('img'); lbimg.alt = im ? im.alt : ''; if (lbc) lbc.textContent = (li + 1) + ' / ' + links.length; };
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); showL(i); lb.showModal(); if (window.__lenis) window.__lenis.stop(); }); });
    $('[data-lb-x]', lb).addEventListener('click', function () { lb.close(); });
    $('[data-lb-p]', lb).addEventListener('click', function () { showL(li - 1); });
    $('[data-lb-n]', lb).addEventListener('click', function () { showL(li + 1); });
    lb.addEventListener('close', function () { if (window.__lenis) window.__lenis.start(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showL(li - 1); if (e.key === 'ArrowRight') showL(li + 1); });
  }

  /* gentle smooth scrolling on desktop pointers only */
  if (!reduce && window.Lenis && matchMedia('(pointer: fine)').matches) {
    var lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
