/* atelier zürich redesign concept: dock, header, drawer, reveals, hero slideshow + typed motto, restrained parallax. No copy here. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* dock */
  var dx = $("#dock-x");
  if (dx) dx.addEventListener("click", function () { de.classList.add("dock-off"); try { sessionStorage.setItem("az-dock", "1"); } catch (e) {} });

  /* phone bar steps aside while Room Studio is on screen */
  var bar = $(".bar"), rs = $$(".rs-wrap");
  if (bar && rs.length && "IntersectionObserver" in W) {
    var on = new Set();
    var bio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) on.add(en.target); else on.delete(en.target); }); bar.classList.toggle("is-away", on.size > 0); }, { threshold: 0 });
    rs.forEach(function (x) { bio.observe(x); });
  }

  /* header */
  var hd = $("#hd");
  function onScroll() { if (hd) hd.classList.toggle("is-solid", scrollY > (hd.classList.contains("hd--over") ? innerHeight * 0.75 : 4)); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var dr = $("#drawer"), bg = $("#burger"), bx = $("#drawer-x");
  function setDrawer(open) {
    if (!dr) return;
    dr.classList.toggle("is-open", open); dr.setAttribute("aria-hidden", open ? "false" : "true");
    if (bg) bg.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a", dr); if (f) f.focus({ preventScroll: true }); } else if (bg) bg.focus({ preventScroll: true });
  }
  if (bg) bg.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr && dr.classList.contains("is-open")) setDrawer(false); });

  /* reveals */
  var items = $$(".rv");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in W) || !de.classList.contains("motion")) items.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    items.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; items.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.97) show(el); }); };
    ["load", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* typed motto: their intro animation, now on top of the photo instead of blocking it */
  var motto = $("#motto");
  if (motto && !reduce) {
    var chars = [];
    $$(".ml", motto).forEach(function (l) {
      var t = l.textContent; l.textContent = "";
      t.split("").forEach(function (c) { var s = d.createElement("span"); s.className = "ch"; s.textContent = c; l.appendChild(s); chars.push(s); });
    });
    var caret = d.createElement("span"); caret.className = "caret";
    var i = 0;
    var tick = function () {
      if (i < chars.length) { chars[i].classList.add("on"); chars[i].parentNode.insertBefore(caret, chars[i].nextSibling); i++; setTimeout(tick, chars[i - 1].textContent === " " ? 40 : 75); }
    };
    setTimeout(tick, 450);
  }

  /* hero slideshow: their seven slides, slow crossfade, caption links to the project */
  var hero = $("#hero");
  if (hero && !reduce) {
    var phone = W.matchMedia("(max-width: 699px)").matches;
    var data = JSON.parse(hero.getAttribute(phone ? "data-m" : "data-d") || "[]");
    var media = $("#hero-media"), cap = $("#hero-cap"), cn = $("#hc-n"), ct = $("#hc-t"), cp = $("#hc-p");
    var slides = [$(".hero-slide", media)], cur = 0, timer = null, visible = true;
    var make = function (k) {
      var pic = d.createElement("div"); pic.className = "hero-slide";
      var im = d.createElement("img"); im.alt = ""; im.decoding = "async"; im.sizes = "100vw"; im.srcset = data[k].s;
      pic.appendChild(im); media.appendChild(pic); return pic;
    };
    var go = function () {
      var nx = (cur + 1) % data.length;
      if (!slides[nx]) slides[nx] = make(nx);
      var im = $("img", slides[nx]);
      var swap = function () {
        slides[cur].classList.remove("is-on"); slides[nx].classList.add("is-on"); cur = nx;
        cap.classList.add("fade");
        setTimeout(function () { cn.textContent = (cur < 9 ? "0" : "") + (cur + 1) + " / 0" + data.length; ct.textContent = data[cur].t; cp.textContent = data[cur].p; cap.href = data[cur].u; cap.classList.remove("fade"); }, 450);
      };
      if (im.complete && im.naturalWidth) swap(); else im.addEventListener("load", swap, { once: true });
    };
    var start = function () { if (!timer) timer = setInterval(function () { if (visible && !d.hidden) go(); }, 5600); };
    if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    if (d.readyState === "complete") setTimeout(start, 1200); else addEventListener("load", function () { setTimeout(start, 1200); });
  }

  /* restrained depth on large screens: their photos drift a few pixels against the scroll */
  function scenes() {
    if (!de.classList.contains("deep") || !W.gsap || !W.ScrollTrigger) return;
    var gsap = W.gsap, ST = W.ScrollTrigger; gsap.registerPlugin(ST);
    if (W.Lenis) { var lenis = new W.Lenis({ lerp: 0.12, smoothWheel: true }); lenis.on("scroll", ST.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
    if (hero) gsap.to("#hero-media", { yPercent: 10, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.5 } });
    $$(".p-hero-img img, .band img").forEach(function (im) { gsap.fromTo(im, { yPercent: 0 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: im.parentNode, start: "top top", end: "bottom top", scrub: 0.5 } }); });
    $$(".g-pair").forEach(function (p) {
      var g = $$(".g", p);
      if (g[1]) gsap.fromTo(g[1], { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
    addEventListener("load", function () { ST.refresh(); });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", scenes); else scenes();
})();
