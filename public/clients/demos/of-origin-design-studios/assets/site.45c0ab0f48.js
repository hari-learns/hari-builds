/* Of Origin concept: one IIFE, no libraries. Motion stays quiet: their photos settle and reveal, the hero drifts. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- header, sticky bar */
  var hdr = $(".hdr"), bar = $(".bar"), studio = $("#studio"), studioOn = false;
  function onScroll() {
    var y = W.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-scrolled", y > 24);
    if (bar) { bar.classList.toggle("is-on", y > W.innerHeight * 0.5); bar.classList.toggle("is-off", studioOn); }
  }
  W.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  /* the phone bar steps aside while Room Studio is on screen, so it never covers the form or its button */
  if (bar && studio && "IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { studioOn = es[0].isIntersecting; onScroll(); }, { rootMargin: "0px 0px -6% 0px" }).observe(studio);
  }

  /* ---------- concept note */
  var dock = $(".dock");
  if (dock) {
    try { if (sessionStorage.getItem("oo-dock") === "1") dock.hidden = true; } catch (e) {}
    var db = $("button", dock);
    if (db) db.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("oo-dock", "1"); } catch (e) {} });
  }

  /* ---------- drawer */
  var burger = $(".burger"), drawer = $(".drawer");
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
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in W && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = W.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.94) show(el); }); }
  ["load", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); }); sweep();
  /* stagger grid tiles a touch, row by row */
  $$(".grid > li").forEach(function (li, i) { li.style.transitionDelay = (i % 3) * 90 + "ms"; });

  /* ---------- hero: the Brentwood lounge drifts slower than the page (their photo, nothing added) */
  var hero = $(".hero__frame img"), plead = $(".plead img"), drift = hero || plead, ticking = false;
  function par() {
    ticking = false; if (!drift) return;
    var r = drift.parentNode.getBoundingClientRect();
    if (r.bottom < 0 || r.top > W.innerHeight) return;
    var t = Math.max(-1, Math.min(1, -r.top / (r.height || 1)));
    drift.style.translate = "0 " + (t * (hero ? 5 : 4)).toFixed(2) + "%";
  }
  if (drift && !RM) { W.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true }); par(); }

  /* ---------- portfolio filter */
  var chips = $$(".chip[data-cat]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var cat = c.dataset.cat;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $$(".grid li[data-cat]").forEach(function (li) { li.hidden = !(cat === "all" || li.dataset.cat === cat); if (!li.hidden) show(li); });
      orphans();
    });
  });
  /* a lone last tile becomes a wide one, so the grid never ends on an empty half row */
  function orphans() {
    $$(".grid").forEach(function (g) {
      var vis = $$("li", g).filter(function (li) { li.classList.remove("is-wide"); return !li.hidden; });
      var cols = getComputedStyle(g).gridTemplateColumns.split(" ").length;
      if (cols > 1 && vis.length % cols === 1) vis[vis.length - 1].classList.add("is-wide");
    });
  }
  orphans(); W.addEventListener("resize", orphans, { passive: true });
})();
