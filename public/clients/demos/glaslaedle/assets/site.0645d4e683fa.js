/* Glaslädle concept: one IIFE, every feature existence-guarded. */
(function () {
  "use strict";
  var d = document, de = d.documentElement;
  de.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header shadow */
  var hdr = d.getElementById("hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = d.getElementById("drawer"), bOpen = d.getElementById("burger"), bClose = d.getElementById("burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (bOpen) bOpen.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (open && bClose) bClose.focus(); else if (!open && bOpen) bOpen.focus({ preventScroll: true });
  }
  if (bOpen) bOpen.addEventListener("click", function () { setDrawer(true); });
  if (bClose) bClose.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });
  addEventListener("resize", function () { if (innerWidth >= 1140 && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* concept dock */
  var dock = d.getElementById("dock"), dx = d.getElementById("dock-x");
  try { if (dock && sessionStorage.getItem("gl-dock") === "1") dock.classList.add("is-hidden"); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-hidden"); try { sessionStorage.setItem("gl-dock", "1"); } catch (e) {} });

  /* reveals (once). IO plus a sweep that never strands content scrolled past */
  var els = [].slice.call(d.querySelectorAll(".rv, .rv-img"));
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) { els.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
    var sweep = function () {
      var vh = innerHeight;
      els.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); });
    };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* open / closed now, from their published hours (Europe/Berlin) */
  var hd = d.getElementById("hours-data");
  if (hd) {
    var H = JSON.parse(hd.textContent), ui = H.ui;
    var now = (function () {
      try {
        var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
        var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
        var wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(o.weekday);
        return { wd: wd, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
      } catch (e) { var t = new Date(); return { wd: (t.getDay() + 6) % 7, min: t.getHours() * 60 + t.getMinutes() }; }
    })();
    var fmt = function (m) { return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); };
    var names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
    var open = false, until = 0, next = null;
    (H.h[now.wd] || []).forEach(function (r) { if (now.min >= r[0] && now.min < r[1]) { open = true; until = r[1]; } });
    if (!open) {
      for (var k = 0; k < 8 && !next; k++) {
        var wd = (now.wd + k) % 7, rs = H.h[wd] || [];
        for (var j = 0; j < rs.length; j++) { if (k > 0 || rs[j][0] > now.min) { next = { k: k, wd: wd, m: rs[j][0] }; break; } }
      }
    }
    var txt = open ? ui.open_now + " · bis " + fmt(until) + " Uhr"
      : ui.closed_now + (next ? " · " + ui.opens + " " + (next.k === 0 ? ui.today : names[next.wd]) + " " + ui.at + " " + fmt(next.m) + " Uhr" : "");
    d.querySelectorAll("[data-status]").forEach(function (s) {
      s.classList.toggle("is-open", open);
      var t = s.querySelector("[data-status-t]"); if (t) t.textContent = txt;
    });
    d.querySelectorAll(".hours").forEach(function (ul) { var li = ul.children[now.wd]; if (li) li.classList.add("is-today"); });
  }

  /* Themenwelten filter */
  var chips = [].slice.call(d.querySelectorAll(".chip[data-g]")), cards = [].slice.call(d.querySelectorAll(".tcard"));
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var g = c.getAttribute("data-g");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      var i = 0;
      cards.forEach(function (t) {
        var on = g === "all" || t.getAttribute("data-g") === g;
        t.hidden = !on; t.classList.remove("is-in");
        if (on && !reduce) { t.style.animationDelay = (i++ * 30) + "ms"; void t.offsetWidth; t.classList.add("is-in"); }
      });
    });
  });

  /* gallery lightbox: their photos, larger */
  var lb = d.getElementById("lb"), links = [].slice.call(d.querySelectorAll("[data-lb]"));
  if (lb && links.length && typeof lb.showModal === "function") {
    var cur = 0;
    var svg = function (p) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>'; };
    lb.innerHTML = '<figure class="lb__fig"><img alt="" width="800" height="533"><div class="lb__bar"><button type="button" class="lb__btn" data-p aria-label="Vorheriges Bild">' + svg("M15 5l-7 7 7 7") +
      '</button><p aria-live="polite"></p><button type="button" class="lb__btn" data-n aria-label="Nächstes Bild">' + svg("M9 5l7 7-7 7") +
      '</button><button type="button" class="lb__btn" data-x aria-label="Schließen">' + svg("M5 5l14 14M19 5L5 19") + "</button></div></figure>";
    var im = lb.querySelector("img"), cap = lb.querySelector("p");
    var go = function (i) {
      cur = (i + links.length) % links.length; var a = links[cur];
      im.src = a.getAttribute("href"); im.alt = a.getAttribute("data-cap");
      im.width = +a.getAttribute("data-w"); im.height = +a.getAttribute("data-h");
      cap.textContent = (cur + 1) + " / " + links.length + " · " + a.getAttribute("data-cap");
    };
    links.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); go(i); lb.showModal(); }); });
    lb.querySelector("[data-p]").addEventListener("click", function () { go(cur - 1); });
    lb.querySelector("[data-n]").addEventListener("click", function () { go(cur + 1); });
    lb.querySelector("[data-x]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") go(cur - 1); if (e.key === "ArrowRight") go(cur + 1); });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { var dx2 = e.changedTouches[0].clientX - sx; if (Math.abs(dx2) > 50) go(cur + (dx2 < 0 ? 1 : -1)); }, { passive: true });
  }
})();
