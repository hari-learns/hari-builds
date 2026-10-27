/* Stephanie Thatenhorst redesign concept: header, drawer, reveals, hero film, scroll scenes, project filter. No copy in here. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- dock */
  var dx = $("#dock-x");
  if (dx) dx.addEventListener("click", function () { de.classList.add("dock-off"); try { sessionStorage.setItem("st-dock", "1"); } catch (e) {} if (W.ScrollTrigger) W.ScrollTrigger.refresh(); });
  /* the phone action bar steps aside while Room Studio is on screen */
  var bar = $(".bar"), rs = $$(".rs-wrap");
  if (bar && rs.length && "IntersectionObserver" in W) {
    var on = new Set();
    var bio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) on.add(en.target); else on.delete(en.target); }); bar.classList.toggle("is-away", on.size > 0); }, { threshold: 0 });
    rs.forEach(function (x) { bio.observe(x); });
  }

  /* ---------- header */
  var hd = $("#hd");
  function onScroll() {
    if (!hd) return;
    var lim = innerHeight * 0.8;
    hd.classList.toggle("is-solid", scrollY > (hd.classList.contains("hd--over") ? lim : 4));
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- drawer */
  var dr = $("#drawer"), bg = $("#burger"), bx = $("#drawer-x");
  function setDrawer(open) {
    if (!dr) return;
    dr.classList.toggle("is-open", open); dr.setAttribute("aria-hidden", open ? "false" : "true");
    bg && bg.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a", dr); f && f.focus({ preventScroll: true }); } else if (bg) bg.focus({ preventScroll: true });
  }
  bg && bg.addEventListener("click", function () { setDrawer(true); });
  bx && bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr && dr.classList.contains("is-open")) setDrawer(false); });
  $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* ---------- reveals (IO + sweep fallback) */
  var items = $$(".rv, .unveil");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in W)) items.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    items.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; items.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- hero film: poster paints first, their film fades in once a real frame is painted */
  var v = $("#hero-video");
  if (v && !reduce) {
    var phone = W.matchMedia("(max-width: 699px)").matches;
    var conn = navigator.connection || {};
    if (!conn.saveData) {
      var srcs = phone ? [[v.dataset.phone, "video/mp4"]] : [[v.dataset.deskWebm, "video/webm"], [v.dataset.desk, "video/mp4"]];
      srcs.forEach(function (s) { var so = d.createElement("source"); so.src = s[0]; so.type = s[1]; v.appendChild(so); });
      v.preload = "auto";
      var shown = false;
      var reveal = function () { if (shown) return; shown = true; v.classList.add("is-playing"); };
      v.addEventListener("playing", function () {
        if ("requestVideoFrameCallback" in v) v.requestVideoFrameCallback(reveal); else setTimeout(reveal, 120);
      });
      var start = function () { v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); };
      if (d.readyState === "complete") setTimeout(start, 150); else addEventListener("load", function () { setTimeout(start, 150); });
      d.addEventListener("visibilitychange", function () { if (d.hidden) v.pause(); else if (shown) v.play().catch(function () {}); });
    }
  }

  /* ---------- project filter */
  var chips = $$("#chips .chip"), cards = $$("#pgrid .pc");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.dataset.f;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      cards.forEach(function (k) { k.hidden = !(f === "all" || k.dataset.cat === f); });
      if (W.ScrollTrigger) W.ScrollTrigger.refresh();
    });
  });

  /* ---------- counters (their real numbers) */
  var nums = $$("[data-count]");
  if (!reduce && "IntersectionObserver" in W) {
    nums.forEach(function (n) { n.textContent = "0"; });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, to = +el.dataset.count, t0 = performance.now(), dur = 1400;
        (function step(t) { var k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* ---------- scroll scenes (desktop only, decided in <head>: html.motion) */
  function scenes() {
    if (!de.classList.contains("motion")) return;
    if (!W.gsap || !W.ScrollTrigger) { de.classList.remove("motion"); return; }
    var gsap = W.gsap, ST = W.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (W.Lenis && !W.matchMedia("(pointer: coarse)").matches) {
      var lenis = new W.Lenis({ lerp: 0.12, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    /* hero: their film drifts gently as you leave it (no shape change) */
    if ($("#hero")) {
      gsap.to("#hero-frame", { yPercent: 12, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.5 } });
      gsap.to("#hero-in", { autoAlpha: 0, y: -30, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "60% top", scrub: 0.5 } });
    }
    /* two worlds: the columns drift against each other */
    var city = $(".wcol--city .wcol-list"), land = $(".wcol--land .wcol-list");
    if (city && land) {
      gsap.fromTo(city, { y: 24 }, { y: -24, ease: "none", scrollTrigger: { trigger: ".worlds-grid", start: "top bottom", end: "bottom top", scrub: 0.6 } });
      gsap.fromTo(land, { y: -16 }, { y: 48, ease: "none", scrollTrigger: { trigger: ".worlds-grid", start: "top bottom", end: "bottom top", scrub: 0.6 } });
      $$(".wf-img img").forEach(function (im) {
        gsap.fromTo(im, { scale: 1.06 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im, start: "top bottom", end: "bottom 40%", scrub: 0.6 } });
      });
    }
    addEventListener("load", function () { ST.refresh(); });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", scenes); else scenes();
})();
