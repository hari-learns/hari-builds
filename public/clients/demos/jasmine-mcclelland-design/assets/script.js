/* Jasmine McClelland Design redesign concept: one IIFE, every feature existence-guarded. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- header, phone bar, concept note ---------- */
  var hdr = $("[data-hdr]"), mbar = $("[data-mbar]"), lastY = 0;
  function onScroll() {
    var y = window.scrollY || 0, vh = window.innerHeight;
    if (hdr) {
      hdr.classList.toggle("is-small", y > 30);
      if (y > vh && y > lastY + 6 && !doc.classList.contains("menu-open")) hdr.classList.add("is-hidden");
      if (y < lastY - 6 || y < vh) hdr.classList.remove("is-hidden");
    }
    if (mbar) mbar.classList.toggle("is-on", y > vh * 0.5);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* the phone bar steps aside while the Room Studio tool is on screen */
  var rsEls = $$(".rs-wrap");
  if (mbar && rsEls.length && "IntersectionObserver" in window) {
    var rsOn = new Set();
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? rsOn.add(en.target) : rsOn.delete(en.target); }); mbar.classList.toggle("is-off", rsOn.size > 0); });
    rsEls.forEach(function (el) { rio.observe(el); });
  }

  var dock = $("[data-dock]");
  if (dock) {
    if (store.get("jmd-dock") === "0") dock.classList.add("is-gone");
    var dc = $("[data-dock-close]", dock);
    if (dc) dc.addEventListener("click", function () { dock.classList.add("is-gone"); store.set("jmd-dock", "0"); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
  }

  /* ---------- drawer ---------- */
  var drawer = $("[data-drawer]"), burger = $("[data-burger]");
  function setMenu(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    doc.classList.toggle("menu-open", open);
    doc.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a, button", drawer); setTimeout(function () { f && f.focus(); }, 60); } else burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("is-open")); });
  var dclose = $("[data-close]");
  if (dclose) dclose.addEventListener("click", function () { setMenu(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer && drawer.classList.contains("is-open")) setMenu(false); });

  /* ---------- line split for [data-lines] (after fonts; redone when the width changes) ---------- */
  var esc = function (t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var lineEls = $$("[data-lines]");
  lineEls.forEach(function (el) { el.setAttribute("data-text", el.textContent.trim()); });
  function splitLines() {
    lineEls.forEach(function (el) {
      var words = el.getAttribute("data-text").split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + esc(w) + "</span>"; }).join(" ");
      var lines = [], top = null;
      $$(".w", el).forEach(function (w) { var t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; } lines[lines.length - 1].push(w.textContent); });
      el.innerHTML = lines.map(function (l, i) { return '<span class="ln" style="--l:' + i + '"><span>' + esc(l.join(" ")) + "</span></span>"; }).join("");
    });
  }
  if (lineEls.length && !RM) {
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(splitLines);
    var lw = window.innerWidth, rt = null;
    window.addEventListener("resize", function () { if (window.innerWidth === lw) return; lw = window.innerWidth; clearTimeout(rt); rt = setTimeout(splitLines, 150); });
  }

  /* ---------- reveals (observer + sweep safety net) ---------- */
  var revealEls = $$("[data-rise], [data-unveil], [data-lines]");
  function activate(el) { el.classList.add("is-in"); }
  if (RM) revealEls.forEach(activate);
  else {
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" }) : null;
    revealEls.forEach(function (el) { io ? io.observe(el) : activate(el); });
    var sweep = function () { var vh = window.innerHeight; revealEls.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.94) activate(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- testimonials carousel ---------- */
  var qt = $("[data-quotes]");
  if (qt) {
    var qs = $$(".quote", qt), qc = $("[data-q-count]");
    var idx = function () { return Math.round(qt.scrollLeft / Math.max(1, qt.clientWidth)); };
    var go = function (d) { var n = Math.max(0, Math.min(qs.length - 1, idx() + d)); qt.scrollTo({ left: n * qt.clientWidth, behavior: RM ? "auto" : "smooth" }); };
    var p = $("[data-q-prev]"), n2 = $("[data-q-next]");
    if (p) p.addEventListener("click", function () { go(-1); });
    if (n2) n2.addEventListener("click", function () { go(1); });
    qt.addEventListener("scroll", function () { if (qc) qc.textContent = (idx() + 1) + " / " + qs.length; }, { passive: true });
    qt.addEventListener("keydown", function (ev) { if (ev.key === "ArrowRight") { go(1); ev.preventDefault(); } if (ev.key === "ArrowLeft") { go(-1); ev.preventDefault(); } });
  }

  /* ---------- project filter ---------- */
  var chips = $$("[data-filter]"), grid = $("[data-grid]");
  if (chips.length && grid) {
    var cards = $$(".pcard", grid);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var k = c.getAttribute("data-filter");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        cards.forEach(function (card) { card.hidden = !(k === "all" || card.getAttribute("data-kind") === k); });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- lightbox ---------- */
  var lb = $("[data-lbox]");
  if (lb) {
    var items = $$("[data-lb]"), li = 0, lim = $("[data-lb-img]", lb), opener = null;
    var showLb = function (i) {
      li = (i + items.length) % items.length;
      var im = $("img", items[li]);
      lim.src = im.currentSrc || im.src; lim.alt = im.alt; lim.width = im.width; lim.height = im.height;
    };
    var openLb = function (i) { opener = document.activeElement; showLb(i); lb.hidden = false; doc.style.overflow = "hidden"; $("[data-lb-x]", lb).focus(); };
    var closeLb = function () { lb.hidden = true; doc.style.overflow = ""; if (opener) opener.focus(); };
    items.forEach(function (b, i) { b.addEventListener("click", function () { openLb(i); }); });
    $("[data-lb-x]", lb).addEventListener("click", closeLb);
    $("[data-lb-p]", lb).addEventListener("click", function () { showLb(li - 1); });
    $("[data-lb-n]", lb).addEventListener("click", function () { showLb(li + 1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) closeLb(); });
    document.addEventListener("keydown", function (ev) {
      if (lb.hidden) return;
      if (ev.key === "Escape") closeLb(); if (ev.key === "ArrowRight") showLb(li + 1); if (ev.key === "ArrowLeft") showLb(li - 1);
    });
  }

  /* ---------- scroll choreography (GSAP + ScrollTrigger; Lenis on a fine pointer only) ---------- */
  function boot() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || RM) { doc.classList.add("is-static"); return; }
    gsap.registerPlugin(ST);
    var fine = window.matchMedia("(pointer: fine)").matches;
    if (window.Lenis && fine) {
      var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (ev) { var t = $(a.getAttribute("href")); if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -80 }); } }); });
    }
    var mm = gsap.matchMedia();

    /* hero: the kitchen drifts down slowly, the line lifts away */
    var hero = $("[data-hero]");
    if (hero) {
      gsap.to("[data-hero-media]", { yPercent: 10, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to("[data-hero-content]", { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "65% top", scrub: true } });
    }
    /* project and service heroes: gentle parallax */
    var prh = $("[data-prhero]");
    if (prh) gsap.fromTo("[data-prhero-img]", { yPercent: 0 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: prh, start: "top top", end: "bottom top", scrub: true } });

    /* projects in focus: sticky photo, each project's photo wipes up as its chapter arrives */
    var focus = $("[data-focus]");
    if (focus) {
      mm.add("(min-width: 901px) and (min-height: 600px)", function () {
        var layers = $$("[data-layer]", focus), chaps = $$("[data-chap]", focus);
        layers.forEach(function (l, i) {
          var im = $("img", l);
          if (i === 0) { gsap.fromTo(im, { scale: 1.1 }, { scale: 1, ease: "none", scrollTrigger: { trigger: chaps[0], start: "top bottom", end: "bottom center", scrub: true } }); return; }
          gsap.fromTo(l, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: chaps[i], start: "top 85%", end: "top 35%", scrub: true } });
          gsap.fromTo(im, { scale: 1.16 }, { scale: 1, ease: "none", scrollTrigger: { trigger: chaps[i], start: "top 85%", end: "bottom center", scrub: true } });
        });
        chaps.forEach(function (c) { gsap.fromTo($(".focus__txt", c), { opacity: 0.25 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: c, start: "top 80%", end: "top 45%", scrub: true } }); });
      });
    }

    window.addEventListener("load", function () { ST.refresh(); });
  }
  try { boot(); } catch (err) { console.warn("[motion] disabled:", err); doc.classList.add("is-static"); }
})();
