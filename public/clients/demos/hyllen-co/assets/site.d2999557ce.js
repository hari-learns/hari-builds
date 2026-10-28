(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* header + sticky bar */
  var hdr = $("#hdr"), bar = $(".bar"), hero = $("[data-hero]");
  function onScroll() {
    var y = window.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-solid", y > 40);
    if (bar) bar.classList.toggle("is-on", y > (hero ? window.innerHeight * 0.6 : 120));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("nav a", drawer); if (f) f.focus(); } else if (burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("hc-dock") === "0" && dock) dock.classList.add("is-gone"); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-gone"); try { sessionStorage.setItem("hc-dock", "0"); } catch (e) {} });

  /* reveals: IO + sweep safety net (reveals anything at or above the fold) */
  var revs = $$(".reveal");
  function activate(el) { if (!el.classList.contains("is-in")) { el.classList.add("is-in"); if (el.querySelector("[data-count]")) count(el); } }
  $$(".grid, .gal, .proof, .sgrid").forEach(function (g) { $$(".reveal", g).forEach(function (el, i) { el.style.setProperty("--d", (i % 6) * 0.06 + "s"); }); });
  if (reduce || !("IntersectionObserver" in window)) { revs.forEach(activate); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    revs.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; revs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* counters (real figures, count once) */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function count(scope) {
    $$("[data-count]", scope).forEach(function (b) {
      var to = +b.getAttribute("data-count");
      if (reduce) return;
      var t0 = null, dur = 1200;
      function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); var v = Math.round(to * (1 - Math.pow(1 - p, 3))); b.textContent = fmt(v); if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }

  /* hero film: their own film, loaded after the page, never on reduced motion / data saver */
  var v = $("#hero-video"), tg = $("#hero-toggle");
  if (v) {
    var save = navigator.connection && navigator.connection.saveData;
    var start = function () {
      if (reduce || save) return;
      var m = window.matchMedia("(max-width: 699px)").matches ? "m" : "d";
      [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (x) {
        var s = d.createElement("source"); s.src = v.getAttribute("data-src-" + m + "-" + x[0]); s.type = x[1]; v.appendChild(s);
      });
      v.load();
      v.addEventListener("playing", function () { v.classList.add("is-playing"); if (tg) tg.hidden = false; }, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function (err) { console.warn("[hero] autoplay blocked:", err && err.name); });
    };
    if (d.readyState === "complete") setTimeout(start, 300); else window.addEventListener("load", function () { setTimeout(start, 300); });
    if (tg) tg.addEventListener("click", function () {
      if (v.paused) { v.play(); tg.classList.remove("is-paused"); tg.setAttribute("aria-label", tg.getAttribute("data-pause")); }
      else { v.pause(); tg.classList.add("is-paused"); tg.setAttribute("aria-label", tg.getAttribute("data-play")); }
    });
  }

  /* listings filter (koeb) */
  var list = $("#listings"), filters = $("#filters");
  if (list && filters) {
    var cards = $$(".card", list), area = "", cnt = $("#f-count"), none = $("#f-none");
    var apply = function () {
      var r = +$("#f-rooms").value, pmax = +$("#f-price").value, sort = $("#f-sort").value, n = 0;
      cards.forEach(function (c) {
        var ok = (!area || c.getAttribute("data-area") === area) && (+c.getAttribute("data-rooms") >= r) && (!pmax || +c.getAttribute("data-price") <= pmax);
        c.hidden = !ok; if (ok) { n++; c.classList.add("is-in"); }
      });
      var key = { "pris-ned": function (a, b) { return b.dataset.price - a.dataset.price; }, "pris-op": function (a, b) { return a.dataset.price - b.dataset.price; },
        "areal": function (a, b) { return b.dataset.m2 - a.dataset.m2; }, "nyeste": function (a, b) { return a.dataset.first < b.dataset.first ? 1 : -1; } }[sort];
      cards.slice().sort(key).forEach(function (c) { list.appendChild(c); });
      cnt.textContent = cnt.getAttribute("data-fmt").replace("{}", n);
      none.hidden = n > 0;
    };
    $$(".chip", filters).forEach(function (b) {
      b.addEventListener("click", function () {
        area = b.getAttribute("data-area");
        $$(".chip", filters).forEach(function (x) { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        apply();
      });
    });
    ["#f-rooms", "#f-price", "#f-sort"].forEach(function (s) { $(s).addEventListener("change", apply); });
  }

  /* signature tool: sold homes by neighbourhood (solgt) */
  var tool = $("#omraade.tool");
  if (tool) {
    var stats = JSON.parse(tool.getAttribute("data-stats")), items = $$(".scard", tool), more = $("#t-more"), cur = "", shown = 12;
    var ta = function (s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); };
    var render = function () {
      var st = stats[cur], i = 0, name = cur || tool.getAttribute("data-all");
      items.forEach(function (li) { var ok = !cur || li.getAttribute("data-area") === cur; if (ok) i++; li.hidden = !(ok && i <= shown); });
      more.hidden = i <= shown;
      $("#t-count").textContent = ta(tool.getAttribute("data-fmt-count"), { n: st.n, area: name });
      $("#t-sizes").textContent = ta(tool.getAttribute("data-fmt-sizes"), { a: st.a, b: st.b, r: String(st.r).replace(".", ",") });
      var cta = $("#t-cta"), subj = tool.getAttribute("data-subject") + (cur ? " – " + cur : "");
      $("span", cta).textContent = cur ? ta(tool.getAttribute("data-fmt-cta"), { area: cur }) : $("span", cta).getAttribute("data-default") || $("span", cta).textContent;
      cta.href = "mailto:" + tool.getAttribute("data-to") + "?subject=" + encodeURIComponent(subj) + (cur ? "&body=" + encodeURIComponent(ta(tool.getAttribute("data-fmt-body"), { 0: cur }).replace("{}", cur)) : "");
    };
    var span = $("#t-cta span"); span.setAttribute("data-default", span.textContent);
    var pick = function (a) {
      cur = a; shown = 12;
      $$(".chip", tool).forEach(function (x) { var on = x.getAttribute("data-area") === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      render();
    };
    $$(".chip", tool).forEach(function (b) { b.addEventListener("click", function () { pick(b.getAttribute("data-area")); }); });
    more.addEventListener("click", function () { shown += 12; render(); });
    var q = new URLSearchParams(location.search).get("omraade");
    pick(q && stats[q] ? q : "");
  }

  /* valuation request -> pre-filled e-mail (concept: nothing is sent from the page) */
  var vf = $("#vform");
  if (vf) {
    vf.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = $$("[required]", vf).filter(function (i) { i.classList.add("touched"); return i.type === "checkbox" ? !i.checked : !i.value.trim(); });
      if (bad.length) { bad[0].focus(); return; }
      var lines = $$("input:not([type=checkbox]), textarea", vf).map(function (i) { var l = i.closest("label").querySelector("span").textContent; return l + ": " + i.value.trim(); });
      location.href = "mailto:" + vf.getAttribute("data-to") + "?subject=" + encodeURIComponent(vf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
