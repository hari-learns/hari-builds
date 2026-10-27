/* Ana Oliveira concept: one IIFE, no libraries. Restrained motion acting on their own photos: reveals, gentle parallax. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* header shadow + sticky bar */
  var hdr = $(".hdr"), bar = $(".bar"), inner = d.body.classList.contains("inner");
  var studioOn = false;
  function onScroll() {
    var y = W.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-scrolled", y > 8);
    if (bar) bar.classList.toggle("is-on", (inner || y > W.innerHeight * 0.6) && !studioOn);
  }
  W.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  /* the bar steps aside while Room Studio is on screen, so it never covers the form or its button */
  var studio = $("#studio");
  if (bar && studio && "IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { studioOn = es[0].isIntersecting; bar.classList.toggle("is-off", studioOn); onScroll(); }, { rootMargin: "0px 0px -5% 0px" }).observe(studio);
  }

  /* concept note */
  var dock = $(".dock");
  if (dock) {
    try { if (sessionStorage.getItem("ao-dock") === "1") dock.hidden = true; } catch (e) {}
    var db = $("button", dock);
    if (db) db.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("ao-dock", "1"); } catch (e) {} });
  }

  /* drawer */
  var burger = $(".hdr .burger"), drawer = $(".drawer");
  function setDrawer(open) {
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

  /* reveals */
  var rv = $$(".rv, .rv-img");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in W && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = W.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.97) show(el); }); }
  ["load", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* gentle parallax on their photos: the image drifts inside its frame (transform only) */
  var par = RM ? [] : $$("[data-par]").map(function (el) { return { el: el, k: parseFloat(el.getAttribute("data-par")) || 0.1, img: el.classList.contains("hero__media") ? el : $("img", el) }; });
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = W.innerHeight;
    par.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100 || !p.img) return;
      var mid = (r.top + r.height / 2 - vh / 2) / vh;  /* -1..1 around the centre of the screen */
      var y = -mid * p.k * Math.min(r.height, vh) * 0.6;
      if (p.img === p.el) p.el.style.transform = "translate3d(0," + (Math.max(0, -r.top) * p.k).toFixed(1) + "px,0)";
      else p.img.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)" + (p.el.classList.contains("story__frame") ? " scale(1.12)" : "");
    });
  }
  function req() { if (!ticking) { ticking = true; W.requestAnimationFrame(frame); } }
  if (par.length) { W.addEventListener("scroll", req, { passive: true }); W.addEventListener("resize", req); req(); }

  /* testimonials arrows */
  var track = $(".testi__track");
  $$(".testi .arw").forEach(function (b) {
    b.addEventListener("click", function () {
      var item = $(".quote", track); var step = item ? item.getBoundingClientRect().width + 20 : 320;
      track.scrollBy({ left: step * parseInt(b.getAttribute("data-dir"), 10), behavior: RM ? "auto" : "smooth" });
    });
  });

  /* portfolio filter */
  var chips = $$(".chip[data-cat]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var cat = c.getAttribute("data-cat");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $$(".pgrid--all .pcard").forEach(function (li) { li.hidden = !(cat === "all" || li.getAttribute("data-cat") === cat); });
      sweep();
    });
  });
})();
