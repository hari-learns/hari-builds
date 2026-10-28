(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var base = (document.querySelector('link[rel=stylesheet]').getAttribute("href") || "").replace(/assets\/theme\.css.*$/, "");

  /* menu drawer */
  var mb = $("#menu-btn"), dr = $("#drawer");
  function setMenu(open) {
    if (!mb || !dr) return;
    dr.hidden = !open; mb.setAttribute("aria-expanded", open ? "true" : "false");
    mb.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (mb) mb.addEventListener("click", function () { setMenu(dr.hidden); });
  if (dr) dr.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); var lb = $("#lb"); if (lb && lb.open) lb.close(); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setMenu(false); });

  /* concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("cs-dock") === "1"; })) dock.hidden = true;
  if (dock && window.innerWidth < 900) setTimeout(function () { dock.hidden = true; }, 9000);
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cs-dock", "1"); }); });

  /* reveals */
  var rv = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add("in"); });

  /* hero slider: same real project photos, crossfade, stops when the visitor picks one */
  var hm = $("#hero-media");
  if (hm) {
    var slides = $$(".slide", hm), caps = $$(".hero-cap", hm), dots = $$(".dot", hm), cur = 0, timer = null, stopped = false, loaded = false;
    var load = function () {
      if (loaded) return; loaded = true;
      slides.forEach(function (s) { var im = $("img", s); if (im && im.getAttribute("data-src")) { im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); } });
    };
    var show = function (i) {
      load(); cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-on", k === cur); });
      caps.forEach(function (s, k) { s.classList.toggle("is-on", k === cur); });
      dots.forEach(function (s, k) { s.classList.toggle("is-on", k === cur); s.setAttribute("aria-current", k === cur ? "true" : "false"); });
    };
    dots.forEach(function (d, i) { d.addEventListener("click", function () { stopped = true; clearInterval(timer); show(i); }); });
    window.addEventListener("load", function () { setTimeout(load, 1200); });
    if (!reduce) {
      var vis = true;
      var tick = function () { if (!stopped && vis && !document.hidden) show(cur + 1); };
      timer = setInterval(tick, 6500);
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hm);
    }
  }

  /* home: sign-type tiles carry into the brief */
  var tiles = $("#tiles");
  if (tiles) {
    var count = $("#tiles-count"), go = $("#tiles-go"), baseHref = go.getAttribute("href");
    var upd = function () {
      var sel = $$(".tile-btn[aria-pressed=true]", tiles).map(function (b) { return b.parentNode.getAttribute("data-slug"); });
      count.textContent = sel.length ? sel.length + (sel.length === 1 ? " sign type selected" : " sign types selected") : "Nothing selected yet";
      go.setAttribute("href", sel.length ? baseHref + "?type=" + sel.join(",") : baseHref);
    };
    $$(".tile-btn", tiles).forEach(function (b) { b.addEventListener("click", function () { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); upd(); }); });
  }

  /* process story: active step on desktop */
  var steps = $$(".step"), stackI = $$(".stack-i");
  if (steps.length && "IntersectionObserver" in window) {
    steps[0].classList.add("is-on");
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          var i = +en.target.getAttribute("data-i");
          steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
          stackI.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { so.observe(s); });
  } else steps.forEach(function (s) { s.classList.add("is-on"); });

  /* projects filter */
  var pg = $("#pgrid");
  if (pg) {
    var items = $$(".pitem", pg), chips = $$(".fchip"), pc = $("#pcount");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-f");
        chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        var n = 0;
        items.forEach(function (it) { var ok = f === "all" || it.getAttribute("data-fams").split(" ").indexOf(f) > -1; it.hidden = !ok; if (ok) n++; });
        pc.textContent = n + (n === 1 ? " project" : " projects");
      });
    });
  }

  /* lightbox */
  var lb = $("#lb");
  if (lb && lb.showModal) {
    $$(".g-btn").forEach(function (b) {
      b.addEventListener("click", function () { $("#lb-img").src = b.getAttribute("data-full"); $("#lb-img").alt = b.getAttribute("data-cap") || ""; $("#lb-cap").textContent = b.getAttribute("data-cap") || ""; lb.showModal(); });
    });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }
})();
