/* Sophie Ferjani concept: menu, header state, hero slides, reveals, gentle parallax, filters, phone bar. No libraries. */
(function () {
  "use strict";
  var d = document, w = window, root = d.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* concept dock */
  var dock = $("[data-dock]");
  if (dock) {
    if (store.get("sf-dock") === "x") dock.hidden = true;
    var dc = $("[data-dock-close]", dock);
    if (dc) dc.addEventListener("click", function () { dock.hidden = true; store.set("sf-dock", "x"); });
  }

  /* menu */
  var menu = $("[data-menu]"), openers = $$("[data-menu-open]"), lastFocus = null;
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("is-open", open); menu.setAttribute("aria-hidden", open ? "false" : "true");
    openers.forEach(function (b) { b.setAttribute("aria-expanded", open ? "true" : "false"); });
    root.style.overflow = open ? "hidden" : "";
    if (open) { lastFocus = d.activeElement; var f = $("a,button", menu); if (f) setTimeout(function () { f.focus(); }, 60); }
    else if (lastFocus) lastFocus.focus();
  }
  openers.forEach(function (b) { b.addEventListener("click", function () { setMenu(true); }); });
  $$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", function () { setMenu(false); }); });
  if (menu) $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && menu.classList.contains("is-open")) setMenu(false); });

  /* header over hero */
  var hd = $("[data-hd]"), hero = $("[data-hero]");
  function hdState() {
    if (!hd) return;
    var lim = hero ? hero.offsetHeight - hd.offsetHeight - 40 : 10;
    hd.classList.toggle("is-scrolled", (w.scrollY || w.pageYOffset) > Math.max(lim, 10));
  }

  /* hero slides: slow crossfade, dots */
  var slides = $$("[data-slide]"), dots = $$("[data-dot]"), cur = 0, timer = null;
  function show(i) {
    if (!slides.length) return;
    slides[cur].classList.remove("is-on"); if (dots[cur]) dots[cur].classList.remove("is-on");
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add("is-on"); if (dots[cur]) dots[cur].classList.add("is-on");
  }
  function play() { if (reduce || slides.length < 2) return; clearInterval(timer); timer = setInterval(function () { if (!d.hidden) show(cur + 1); }, 6500); }
  dots.forEach(function (b) { b.addEventListener("click", function () { show(+b.getAttribute("data-dot")); play(); }); });
  play();

  /* reveals */
  var items = $$("[data-r]");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      if (el.classList.contains("card") || el.classList.contains("pr")) el.style.setProperty("--d", (Math.min(sib % 3, 2) * 0.12) + "s");
      io.observe(el);
    });
  } else items.forEach(function (el) { el.classList.add("is-in"); });

  /* gentle parallax on layered photos (desktop + tablet only) */
  var par = $$("[data-par]"), wide = w.matchMedia("(min-width: 900px)");
  function parallax() {
    if (reduce || !wide.matches) { par.forEach(function (el) { el.style.transform = ""; }); return; }
    var vh = w.innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var k = parseFloat(el.getAttribute("data-par")) || 0, c = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (c * k).toFixed(1) + "px,0)";
    });
  }

  /* phone bar: hide while Room Studio is on screen or near the footer */
  var bar = $("[data-bar]"), rs = $$("[data-rs]"), ft = $(".ft"), rsOn = false, ftOn = false;
  function barState() { if (bar) bar.classList.toggle("is-hidden", rsOn || ftOn); }
  if (bar && "IntersectionObserver" in w) {
    var vis = new Map();
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (en) { vis.set(en.target, en.isIntersecting); });
      rsOn = rs.some(function (el) { return vis.get(el); }); ftOn = !!(ft && vis.get(ft)); barState();
    }, { threshold: 0 });
    rs.forEach(function (el) { bo.observe(el); }); if (ft) bo.observe(ft);
  }

  /* realisations filter (also reads #categorie from the menu links) */
  var chips = $$("[data-filter]"), cards = $$("[data-cards] .card");
  function filter(k) {
    if (!chips.length) return;
    if (!chips.some(function (c) { return c.getAttribute("data-filter") === k; })) k = "all";
    chips.forEach(function (c) { var on = c.getAttribute("data-filter") === k; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    cards.forEach(function (c) { c.hidden = !(k === "all" || c.getAttribute("data-cat") === k); if (!c.hidden) c.classList.add("is-in"); });
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { var k = c.getAttribute("data-filter"); filter(k); try { history.replaceState(null, "", k === "all" ? location.pathname : "#" + k); } catch (e) {} }); });
  if (chips.length && location.hash) filter(location.hash.slice(1));
  w.addEventListener("hashchange", function () { if (chips.length) filter(location.hash.slice(1) || "all"); });

  var ticking = false;
  function onScroll() { if (ticking) return; ticking = true; w.requestAnimationFrame(function () { hdState(); parallax(); ticking = false; }); }
  w.addEventListener("scroll", onScroll, { passive: true });
  w.addEventListener("resize", onScroll);
  hdState(); parallax();
})();
