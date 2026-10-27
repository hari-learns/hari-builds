/* Agence Del In concept: one IIFE, every feature existence-guarded. No dependencies. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---- header */
  var hd = $("[data-header]"), lastY = win.scrollY, cbar = $("[data-cbar]");
  function onHeader() {
    var y = win.scrollY;
    if (hd) {
      hd.classList.toggle("is-scrolled", y > 40);
      var drawerOpen = root.classList.contains("menu-open");
      hd.classList.toggle("is-hidden", !drawerOpen && y > 700 && y > lastY + 2);
      if (y < lastY - 2) hd.classList.remove("is-hidden");
    }
    if (cbar) cbar.classList.toggle("is-on", y > 380);
    lastY = y;
  }

  /* ---- drawer */
  var drawer = $("[data-drawer]"), burger = $("[data-burger]"), closeBtn = $("[data-burger-close]");
  function setMenu(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.classList.toggle("menu-open", open);
    root.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus(); else if (!open) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
  doc.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer && drawer.classList.contains("is-open")) setMenu(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---- concept dock */
  var dock = $("[data-dock]");
  if (dock) {
    if (store.get("delin-dock") === "x") dock.hidden = true;
    var dc = $("[data-dock-close]", dock);
    if (dc) dc.addEventListener("click", function () { dock.hidden = true; store.set("delin-dock", "x"); });
  }

  /* ---- reveals: rise (.rv) and unveil (.uv) */
  var items = $$(".rv, .uv");
  items.forEach(function (el) {
    var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("rv") || c.classList.contains("uv"); }) : [];
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 80 + "ms";
  });
  function show(el) { el.classList.add("is-in"); }
  if (reduce) items.forEach(show);
  else if ("IntersectionObserver" in win) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    items.forEach(function (el) { io.observe(el); });
  }
  function sweep() {
    var vh = win.innerHeight;
    for (var i = 0; i < items.length; i++) { var el = items[i]; if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }
  }

  /* ---- counters (their real numbers) */
  var counted = false, counters = $$("[data-count]");
  function count() {
    if (counted || !counters.length || reduce) return;
    var r = counters[0].getBoundingClientRect();
    if (r.top > win.innerHeight * 0.9) return;
    counted = true;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10); if (!target) return;
      if (target > 1900) return;
      var from = 0, t0 = performance.now(), dur = 1400;
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1), ease = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(from + (target - from) * ease));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---- scroll scenes: hero parallax, verrière deploy, header drift */
  var hero = $("[data-hero]"), heroMedia = $("[data-hero-media]"), heroIn = hero ? $(".hero__in", hero) : null;
  var deploy = $("[data-deploy]"), drifts = $$("[data-drift]");
  var pSmooth = 0, pTarget = 0;
  function scenes() {
    var vh = win.innerHeight, y = win.scrollY;
    if (hero && !reduce) {
      var hh = hero.offsetHeight;
      if (y < hh * 1.2) {
        if (heroMedia) heroMedia.style.setProperty("--hy", (y * 0.08).toFixed(1) + "px");
      }
    }
    if (deploy) {
      var r = deploy.getBoundingClientRect(), span = r.height - vh;
      pTarget = span > 40 ? clamp(-r.top / span, 0, 1) : clamp((vh - r.top) / (vh + r.height) * 1.8 - 0.35, 0, 1);
      pTarget = clamp((pTarget - 0.12) / 0.7, 0, 1);
      if (reduce) pTarget = 1;
    }
    if (!reduce) drifts.forEach(function (el) {
      var rr = el.getBoundingClientRect();
      if (rr.bottom > -50 && rr.top < vh + 50) el.style.setProperty("--d", (-rr.top * 0.06).toFixed(1) + "px");
    });
  }
  var ticking = false;
  function frame() {
    ticking = false;
    onHeader(); scenes(); sweep(); count();
    if (deploy) {
      pSmooth += (pTarget - pSmooth) * 0.18;
      if (Math.abs(pTarget - pSmooth) < 0.001) pSmooth = pTarget; else req();
      deploy.style.setProperty("--p", pSmooth.toFixed(4));
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  win.addEventListener("scroll", req, { passive: true });
  win.addEventListener("resize", req);
  win.addEventListener("load", req);
  win.addEventListener("pageshow", req);
  frame();

  /* ---- filter chips (Particuliers / Professionnels / Scénographie / Mobilier) */
  var chips = $$("[data-filter]"), grid = $("[data-grid]");
  if (chips.length && grid) {
    var cards = $$("[data-family]", grid);
    function apply(f) {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === f ? "true" : "false"); });
      cards.forEach(function (c) { c.hidden = !(f === "*" || c.getAttribute("data-family") === f); if (!c.hidden) $$(".uv", c).forEach(show); });
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); }); });
    var m = /[?&]f=(\w+)/.exec(location.search); if (m) apply(m[1]);
  }

  /* ---- their film, loaded only on tap */
  var dlg = $("[data-film-dialog]");
  $$("[data-film]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      if (!dlg || typeof dlg.showModal !== "function") return;
      ev.preventDefault();
      var fr = $("[data-film-frame]", dlg);
      fr.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + a.getAttribute("data-film") + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + (dlg.getAttribute("aria-label") || "Film") + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      dlg.showModal();
      try { var mm = location.pathname.match(/\/clients\/demos\/([^\/]+)/); if (win.goatcounter && win.goatcounter.count) win.goatcounter.count({ path: "demo/" + (mm ? mm[1] : "other") + "/film", title: "click film", event: true }); } catch (e) {}
    });
  });
  if (dlg) {
    var closeFilm = function () { var fr = $("[data-film-frame]", dlg); if (fr) fr.innerHTML = ""; if (dlg.open) dlg.close(); };
    var fc = $("[data-film-close]", dlg); if (fc) fc.addEventListener("click", closeFilm);
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) closeFilm(); });
    dlg.addEventListener("close", function () { var fr = $("[data-film-frame]", dlg); if (fr) fr.innerHTML = ""; });
  }
})();
