/* Celene Collins redesign concept: one IIFE, every feature existence-guarded. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- header, mobile bar, dock ---------- */
  var hdr = $("[data-hdr]"), mbar = $("[data-mbar]");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || 0, vh = window.innerHeight;
    if (hdr) {
      hdr.classList.toggle("is-small", y > 40);
      hdr.classList.toggle("is-hidden", y > vh && y > lastY + 4 && !doc.classList.contains("menu-open"));
      if (y < lastY - 4) hdr.classList.remove("is-hidden");
    }
    if (mbar) { mbar.classList.toggle("is-on", y > vh * 0.6); }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* the bottom bar steps aside while the Room Studio form is on screen */
  var rsEls = $$(".rs-wrap");
  if (mbar && rsEls.length && "IntersectionObserver" in window) {
    var rsOn = new Set();
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? rsOn.add(en.target) : rsOn.delete(en.target); }); mbar.classList.toggle("is-off", rsOn.size > 0); });
    rsEls.forEach(function (el) { rio.observe(el); });
  }

  var dock = $("[data-dock]");
  if (dock) {
    if (store.get("cc-dock") === "0") dock.classList.add("is-gone");
    var dc = $("[data-dock-close]", dock);
    if (dc) dc.addEventListener("click", function () { dock.classList.add("is-gone"); store.set("cc-dock", "0"); });
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

  /* ---------- line splitting for [data-lines] (after fonts load; redone when the width changes) ---------- */
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
  if (lineEls.length) {
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
    var sweep = function () { var vh = window.innerHeight; revealEls.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- hero slideshow (their slider, named) ---------- */
  var hero = $("[data-hero]");
  if (hero) {
    var slides = $$("[data-slide]", hero), caps = $$("[data-cap]", hero), bars = $$("[data-bar]", hero);
    var cur = 0, DUR = 7000, timer = null;
    hero.style.setProperty("--dur", DUR / 1000 + "s");
    function show(n) {
      n = (n + slides.length) % slides.length;
      [slides, caps, bars].forEach(function (list) { list.forEach(function (el, i) { el.classList.toggle("is-on", i === n); }); });
      bars.forEach(function (b, i) { b.classList.toggle("is-done", i < n); });
      caps.forEach(function (c, i) { c.tabIndex = i === n ? 0 : -1; });
      var im = $("img", slides[n]); if (im && im.loading === "lazy") im.loading = "eager";
      var nx = $("img", slides[(n + 1) % slides.length]); if (nx && nx.loading === "lazy") nx.loading = "eager";
      cur = n;
    }
    function play() { stop(); if (RM || document.hidden || (typeof paused !== "undefined" && paused)) return; timer = setTimeout(function () { show(cur + 1); play(); }, DUR); }
    function stop() { if (timer) clearTimeout(timer); timer = null; }
    var pause = $("[data-pause]", hero), paused = false;
    if (pause) pause.addEventListener("click", function () { paused = !paused; pause.setAttribute("aria-pressed", paused ? "true" : "false"); pause.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow"); hero.classList.toggle("is-paused", paused); paused ? stop() : play(); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : play(); });
    if (RM) { bars.forEach(function (b) { b.classList.remove("is-on"); }); }
    window.addEventListener("load", function () { setTimeout(function () { var n = $("img", slides[1]); if (n) n.loading = "eager"; }, 1200); });
    play();
  }

  /* ---------- testimonials ---------- */
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

  /* ---------- services image swap ---------- */
  var sfig = $$("[data-sfig]");
  if (sfig.length) {
    var setS = function (i) { sfig.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-sfig") === String(i)); }); };
    $$("[data-srow]").forEach(function (r) {
      var i = r.getAttribute("data-srow");
      r.addEventListener("mouseenter", function () { setS(i); });
      r.addEventListener("focus", function () { setS(i); });
    });
  }

  /* ---------- lightbox ---------- */
  var lb = $("[data-lbox]");
  if (lb) {
    var items = $$("[data-lb]"), li = 0, lim = $("[data-lb-img]", lb), lcap = $("[data-lb-cap]", lb), opener = null;
    var showLb = function (i) {
      li = (i + items.length) % items.length;
      var im = $("img", items[li]);
      lim.src = im.currentSrc || im.src; lim.alt = im.alt; lim.width = im.width; lim.height = im.height;
      var cap = items[li].parentNode.querySelector("figcaption"); lcap.textContent = cap ? cap.textContent : "";
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

  /* ---------- scroll choreography (GSAP + ScrollTrigger, Lenis on desktop pointer) ---------- */
  function boot() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || RM) { doc.classList.add("is-static"); return; }
    gsap.registerPlugin(ST);
    var fine = window.matchMedia("(pointer: fine)").matches;
    if (window.Lenis && fine) {
      var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (ev) { var t = $(a.getAttribute("href")); if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }); });
    }

    /* hero settles back as you leave it */
    if (hero) {
      gsap.to("[data-hero-media]", { scale: 1.1, yPercent: 8, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to("[data-hero-content]", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: true } });
    }

    /* project hero parallax */
    var prh = $("[data-prhero]");
    if (prh) gsap.to("[data-prhero-img]", { yPercent: 12, ease: "none", scrollTrigger: { trigger: prh, start: "top top", end: "bottom top", scrub: true } });

    var mm = gsap.matchMedia();

    /* Limeworth: sticky photo, layers wipe in with each chapter */
    var stack = $("[data-stack]");
    if (stack) {
      mm.add("(min-width: 900px) and (min-height: 640px)", function () {
        var media = $(".stack__media", stack);
        media.style.position = "sticky"; media.style.top = "14vh";
        var layers = $$("[data-layer]", stack), chaps = $$("[data-chap]", stack);
        layers.forEach(function (l, i) {
          if (i === 0) { gsap.fromTo($("img", l), { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: chaps[0], start: "top bottom", end: "bottom center", scrub: true } }); return; }
          gsap.fromTo(l, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: chaps[i], start: "top 85%", end: "top 35%", scrub: true } });
          gsap.fromTo($("img", l), { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: chaps[i], start: "top 85%", end: "bottom center", scrub: true } });
        });
        return function () { media.style.position = ""; media.style.top = ""; };
      });
    }

    /* Tranquility House: window opens to full bleed */
    var win = $("[data-window]");
    if (win) {
      var fr = $("[data-window-frame]", win);
      mm.add("(min-width: 701px)", function () {
        gsap.fromTo(fr, { clipPath: "inset(6% 9% 6% 9%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: win, start: "top 90%", end: "top top", scrub: true } });
        gsap.fromTo($("img", fr), { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: true } });
      });
      mm.add("(max-width: 700px)", function () {
        gsap.fromTo(fr, { clipPath: "inset(4% 4% 4% 4%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: win, start: "top 95%", end: "top 20%", scrub: true } });
      });
    }

    /* more projects: horizontal drift while pinned (desktop, tall enough) */
    var hg = $("[data-hgal]");
    if (hg) {
      mm.add("(min-width: 900px) and (min-height: 640px)", function () {
        hg.classList.add("is-pinned-x");
        var track = $("[data-hgal-track]", hg);
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var tw = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: hg, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$(".pcard__img img", track).forEach(function (im) {
          gsap.fromTo(im, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: im.parentNode, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
        });
        return function () { hg.classList.remove("is-pinned-x"); gsap.set(track, { x: 0 }); };
      });
    }

    /* gentle parallax inside project photos (desktop only) */
    mm.add("(min-width: 901px)", function () {
      $$(".hcard .pcard__img img, .gcard .pcard__img img").forEach(function (im) {
        gsap.fromTo(im, { yPercent: -4, scale: 1.1 }, { yPercent: 4, scale: 1.1, ease: "none", scrollTrigger: { trigger: im.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });

    /* services image follows the row in view */
    var rows = $$("[data-srow]");
    if (rows.length && sfig.length) {
      mm.add("(min-width: 901px)", function () {
        rows.forEach(function (r) {
          ST.create({ trigger: r, start: "top 55%", end: "bottom 55%", onEnter: function () { setS(r.getAttribute("data-srow")); }, onEnterBack: function () { setS(r.getAttribute("data-srow")); } });
        });
      });
    }
    window.addEventListener("load", function () { ST.refresh(); });
  }
  function setS(i) { sfig.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-sfig") === String(i)); }); }
  try { boot(); } catch (err) { console.warn("[motion] disabled:", err); doc.classList.add("is-static"); }
})();
