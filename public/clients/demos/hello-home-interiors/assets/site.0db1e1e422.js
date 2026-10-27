/* Hello Home Interiors concept: one IIFE, no libraries. Restrained motion from their own photographs:
   the hero slideshow (slow cross-fade + settle), photo unmasks on scroll, a gentle parallax inside image frames. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- header, sticky bar, dock */
  var hdr = $(".hdr"), bar = $(".bar"), studioOn = false;
  function onScroll() {
    var y = W.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-scrolled", y > 10);
    if (bar) bar.classList.toggle("is-on", y > W.innerHeight * 0.5 || !$(".hero"));
  }
  W.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  /* the sticky bar steps aside while Room Studio is on screen, so it never covers the upload or its button */
  var studio = $("#studio");
  if (bar && studio && "IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { studioOn = es[0].isIntersecting; bar.classList.toggle("is-off", studioOn); }, { rootMargin: "0px 0px -5% 0px" }).observe(studio);
  }
  var dock = $(".dock");
  if (dock) {
    try { if (sessionStorage.getItem("hh-dock") === "1") dock.hidden = true; } catch (e) {}
    var db = $("button", dock);
    if (db) db.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("hh-dock", "1"); } catch (e) {} });
  }

  /* ---------- drawer */
  var burger = $(".hdr .burger"), drawer = $(".drawer");
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    de.style.overflow = open ? "hidden" : "";
    if (open) { var c = $(".drawer__close", drawer); if (c) c.focus(); } else burger.focus({ preventScroll: true });
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(true); });
    $$(".drawer__close, .drawer nav a", drawer).forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- reveals (IntersectionObserver + a sweep that never strands content) */
  var rv = $$(".rv, .rv-img");
  function show(el) {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.classList.contains("plx")) setTimeout(function () { el.classList.add("done"); }, 1800);
  }
  if ("IntersectionObserver" in W && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = W.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.97) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* ---------- parallax inside image frames (their photos drift a few percent; frames stay put) */
  var plx = $$(".plx");
  if (plx.length && !RM) {
    var ticking = false;
    function drift() {
      ticking = false;
      var vh = W.innerHeight;
      plx.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); /* -1..1 */
        var px = Math.max(-1, Math.min(1, p)) * r.height * -0.05;
        f.style.setProperty("--py", px.toFixed(1) + "px");
        if (!f.classList.contains("rv-img")) { var im = $("img", f); if (im) im.style.transform = "translate3d(0," + px.toFixed(1) + "px,0)"; }
      });
    }
    function req() { if (!ticking) { ticking = true; W.requestAnimationFrame(drift); } }
    W.addEventListener("scroll", req, { passive: true }); W.addEventListener("resize", req); drift();
  }

  /* ---------- lazy extra hero slides after load */
  W.addEventListener("load", function () {
    $$("img[data-src]").forEach(function (im) {
      if (im.dataset.srcset) im.srcset = im.dataset.srcset;
      im.src = im.dataset.src; im.removeAttribute("data-src");
    });
  });

  /* ---------- hero: their slideshow, slower and larger, with arrows and a counter */
  var slides = $$(".hero__slide"), cnt = $(".hero__count b"), cur = 0, timer = null;
  function go(i) {
    if (!slides.length) return;
    slides[cur].classList.remove("is-on"); cur = (i + slides.length) % slides.length; slides[cur].classList.add("is-on");
    if (cnt) cnt.textContent = String(cur + 1).padStart(2, "0");
  }
  function play() { if (RM || slides.length < 2) return; clearInterval(timer); timer = setInterval(function () { if (!d.hidden) go(cur + 1); }, 5200); }
  var pv = $(".hero__prev"), nx = $(".hero__next");
  if (pv) pv.addEventListener("click", function () { go(cur - 1); play(); });
  if (nx) nx.addEventListener("click", function () { go(cur + 1); play(); });
  if (slides.length) W.addEventListener("load", function () { setTimeout(play, 1500); });
  var fr = $(".hero__frame"), sx = null;
  if (fr) {
    fr.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    fr.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); play(); } sx = null; }, { passive: true });
  }

  /* ---------- project filter */
  var chips = $$(".chip[data-cat]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var cat = c.dataset.cat;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $$(".grid li[data-cat]").forEach(function (li) { li.hidden = !(cat === "all" || li.dataset.cat === cat); });
      sweep();
    });
  });
})();
