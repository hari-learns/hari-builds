/* Studio Anja Vissers concept: one IIFE, every feature guarded. Motion acts only on their own photos and words. */
(function () {
  "use strict";
  var w = window, d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = w.gsap, ST = w.ScrollTrigger;
  var canPin = function () { return w.innerWidth >= 900 && w.innerHeight >= 640; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- dock */
  /* concept note: a slim line at the very top of the page (in the flow, never over content); the fixed header sits
     just under it until it scrolls away; dismissed for the rest of the visit */
  var dock = $("#dock"), dx = $("#dock-x");
  var noteH = function () { return dock && !dock.hidden ? dock.offsetHeight : 0; };
  var closeNote = function () { if (!dock) return; dock.hidden = true; root.classList.remove("has-note"); root.style.setProperty("--note-y", "0px"); if (w.ScrollTrigger) w.ScrollTrigger.refresh(); };
  try { if (dock && sessionStorage.getItem("dock-x")) closeNote(); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { closeNote(); try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  /* ---------- drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (w.__lenis) open ? w.__lenis.stop() : w.__lenis.start();
    if (open) { var f = $(".drawer__nav a", drawer); if (f) f.focus(); } else burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ---------- header state + phone bar */
  var hdr = $("#hdr"), bar = $(".bar"), lastY = w.scrollY;
  var heroEl = $("#hero"), rsOn = false;
  var rsSecs = $$(".room, .rs-host");
  if (bar && rsSecs.length && "IntersectionObserver" in w) {
    var vis = new Set();
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) vis.add(en.target); else vis.delete(en.target); });
      rsOn = vis.size > 0; onScrollUi();
    });
    rsSecs.forEach(function (x) { rio.observe(x); });
  }
  function onScrollUi() {
    var y = w.scrollY;
    if (bar) bar.classList.toggle("is-hidden", rsOn || (!!heroEl && y < w.innerHeight * 0.55));
    root.style.setProperty("--note-y", Math.max(0, noteH() - y) + "px");
    if (hdr) {
      hdr.classList.toggle("is-scrolled", y > 40);
      var down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > 400) hdr.classList.add("is-hidden"); else if (up || y < 200) hdr.classList.remove("is-hidden");
    }
    lastY = y;
  }
  w.addEventListener("scroll", onScrollUi, { passive: true }); onScrollUi();

  /* ---------- reveals with safety net (no content stranded at opacity 0) */
  var rise = $$("[data-rise]");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in w)) rise.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rise.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = w.innerHeight; rise.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- index filter */
  var chips = $$(".chip"), cards = $$(".card");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      cards.forEach(function (k) { var on = f === "*" || k.getAttribute("data-t") === f; k.hidden = !on; if (on) show(k); });
      if (ST) ST.refresh();
    });
  });

  /* ---------- contact form -> pre-filled e-mail */
  var mf = $("#mform");
  if (mf) {
    var bj = {}; try { bj = JSON.parse($("#budgets").textContent); } catch (e) {}
    var si = $("#f-int"), sb = $("#f-bud");
    var fill = function () { sb.innerHTML = ""; (bj[si.value] || []).forEach(function (o) { var op = d.createElement("option"); op.textContent = o; sb.appendChild(op); }); };
    si.addEventListener("change", fill); fill();
    mf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var lines = $$("input,select,textarea", mf).map(function (el) { return el.name + ": " + (el.value || "").trim(); });
      location.href = "mailto:" + mf.getAttribute("data-to") + "?subject=" + encodeURIComponent(mf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------- counters (their real counts) */
  var counters = $$("[data-count]");
  if (!reduce && counters.length && "IntersectionObserver" in w) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-count"), from = to > 1900 ? 1900 : 0, t0 = performance.now(), dur = 1400;
        var step = function (t) { var k = clamp((t - t0) / dur, 0, 1); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); else el.textContent = to; };
        el.textContent = from; requestAnimationFrame(step); setTimeout(function () { el.textContent = to; }, dur + 400);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- hero slideshow (their 8 photos) */
  var hero = $("#hero");
  if (hero) {
    var slides = $$(".hero__slide", hero), caps = $$(".hero__cap", hero), cur = 0, timer = null;
    var loadSlide = function (s) { var im = $("img", s); if (im && im.getAttribute("data-src")) { im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); } };
    var go = function (n) {
      slides[cur].classList.remove("is-on"); caps[cur].classList.remove("is-on"); caps[cur].tabIndex = -1;
      cur = n % slides.length; loadSlide(slides[(cur + 1) % slides.length]);
      slides[cur].classList.add("is-on"); caps[cur].classList.add("is-on"); caps[cur].tabIndex = 0;
    };
    var play = function () { if (!timer && !reduce) timer = setInterval(function () { go(cur + 1); }, 5500); };
    var stop = function () { clearInterval(timer); timer = null; };
    w.addEventListener("load", function () { loadSlide(slides[1]); play(); });
    d.addEventListener("visibilitychange", function () { d.hidden ? stop() : play(); });
  }

  /* ---------- Room Studio: the whole UI (incl. errors, aria labels and the enquiry e-mail) is Dutch through its JSON
     `text` option. Here only (1) phone comfort CSS added inside its open shadow root (labels >= 13px, taps >= 44px) and
     (2) the one image alt the widget does not route through `text` ("Your room" on the uploaded photo). */
  var RS_CSS = ".caption,.badge.sm,.pv,.pal span,.th button{font-size:13px}.chip{min-height:44px;font-size:15px}" +
    ".btn.sm{height:44px;font-size:15px}.btn{min-height:44px}.seg{height:48px}.seg button{font-size:15px}" +
    ".dsg.sw3 .card .nm{font-size:14px}.st li{font-size:15px}.label{font-size:15px}" +
    ".btn{white-space:normal;text-align:center;line-height:1.25}.btn.lg{height:auto;min-height:52px;padding-block:10px}" +
    "@media (max-width:560px){.dz{min-height:240px;padding:28px 16px}.dsg.sw3 .card .nm{font-size:15px}}";
  function patchRoomStudio() {
    $$("[data-roomstudio]").forEach(function (el) {
      var r = el.shadowRoot, inst = el.__rs;
      if (!r || el.__nl) return; el.__nl = true;
      var st = d.createElement("style"); st.textContent = RS_CSS; r.appendChild(st);
      var aRoom = (inst && inst.t && inst.t.aRoom) || "Uw ruimte";
      var fix = function () { $$('img[alt="Your room"]', r).forEach(function (im) { im.alt = aRoom; }); };
      new MutationObserver(fix).observe(r, { childList: true, subtree: true }); fix();
    });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", patchRoomStudio); else patchRoomStudio();
  w.addEventListener("load", patchRoomStudio);

  /* ---------- motion (GSAP + ScrollTrigger + Lenis), skipped entirely for reduced motion */
  if (reduce || !G || !ST) { if (hero) hero.querySelector(".hero__media").style.setProperty("--p", 0); return; }
  G.registerPlugin(ST);
  root.classList.add("has-motion");
  if (canPin()) root.classList.add("has-pin");

  if (w.Lenis && w.innerWidth >= 900) {
    var lenis = new w.Lenis({ duration: 1.1, smoothWheel: true });
    w.__lenis = lenis;
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (e) { var id = a.getAttribute("href"); if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo($(id), { offset: -80 }); } }); });
  }

  var mm = G.matchMedia();

  /* hero: their composition stays as on their site (framed photo on white, headline below); only the hairline draws
     down and the frame drifts up a touch slower than the page (gentle parallax, desktop) */
  if (hero) {
    var line = $(".hero__line", hero), media = $(".hero__media", hero);
    if (line) G.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "expo.out", delay: 0.6 });
    mm.add("(min-width: 900px)", function () {
      var tw = G.to(media, { yPercent: 8, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      return function () { tw.scrollTrigger && tw.scrollTrigger.kill(); G.set(media, { clearProps: "transform" }); };
    });
  }

  /* zoom-out: their photos settle as they cross the screen */
  $$("[data-zoom]").forEach(function (im) {
    G.fromTo(im, { scale: 1.07 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im.parentElement, start: "top bottom", end: "bottom 40%", scrub: true } });
  });
  /* gentle parallax: their collage photos drift at slightly different speeds (desktop only) */
  mm.add("(min-width: 900px)", function () {
    $$("[data-par]").forEach(function (im) {
      var v = +im.getAttribute("data-par") || 6, box = im.closest("figure,a") || im.parentElement;
      G.fromTo(box, { yPercent: v }, { yPercent: -v, ease: "none", scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });
  /* project heads: framed photo opens */
  $$("[data-aperture]").forEach(function (el) {
    ST.create({ trigger: el, start: "top 85%", end: "top 15%", scrub: 0.5, onUpdate: function (s) { el.style.setProperty("--p", s.progress.toFixed(4)); } });
  });

  w.addEventListener("load", function () { ST.refresh(); });
})();
