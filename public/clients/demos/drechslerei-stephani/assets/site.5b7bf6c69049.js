(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header rule on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1180) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("ds-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("ds-dock", "1"); }); });

  /* reveals + sweep for anything already scrolled past */
  var rvs = $$(".rv, .rv-img");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* open now, from their published hours (Europe/Berlin) */
  function berlinNow() {
    var p = safe(function () {
      var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "numeric", minute: "numeric", hour12: false });
      var o = {}; f.formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; }); return o;
    });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    if (!p) { var n = new Date(); return { day: n.getDay(), h: n.getHours() + n.getMinutes() / 60 }; }
    return { day: days[p.weekday], h: (Number(p.hour) % 24) + Number(p.minute) / 60 };
  }
  $$("[data-open]").forEach(function (el) {
    var cfg = safe(function () { return JSON.parse(el.getAttribute("data-open")); }); if (!cfg) return;
    var n = berlinNow(), open = cfg.days.indexOf(n.day) > -1 && n.h >= cfg.open && n.h < cfg.close;
    el.classList.toggle("is-open", open);
    var lab = $("[data-open-label]", el); if (lab) lab.textContent = el.getAttribute(open ? "data-yes" : "data-no");
  });

  /* past / next markers on dated lists */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  $$("[data-events]").forEach(function (list) {
    var nextDone = false;
    $$("[data-date]", list).forEach(function (li) {
      var past = parse(li.getAttribute("data-date")) < today, s = $(".ev__s", li);
      li.classList.toggle("is-past", past);
      if (s) s.textContent = past ? s.getAttribute("data-past") : (!nextDone ? s.getAttribute("data-up") : "");
      if (!past && !nextDone) { li.classList.add("is-next"); nextDone = true; }
    });
  });
  $$(".kd[data-date]").forEach(function (li) {
    var past = parse(li.getAttribute("data-date")) < today, s = $(".ev__s", li);
    li.classList.toggle("is-past", past); if (s) s.textContent = past ? s.getAttribute("data-past") : "";
  });

  /* sortiment filter + search */
  var grid = $("[data-grid]");
  if (grid) (function () {
    var cards = $$(".pc", grid), chips = $$(".chip[data-g]"), q = $("#q"), count = $("[data-count]"), none = $("[data-none]");
    var g = "alle";
    var valid = chips.map(function (c) { return c.getAttribute("data-g"); });
    var h = (location.hash || "").slice(1); if (valid.indexOf(h) > -1) g = h;
    function apply() {
      var t = (q.value || "").trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var ok = (g === "alle" || c.getAttribute("data-g") === g) && (!t || c.getAttribute("data-s").indexOf(t) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-g") === g ? "true" : "false"); });
      count.textContent = count.getAttribute("data-count").replace("{n}", n);
      none.hidden = n > 0;
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { g = c.getAttribute("data-g"); safe(function () { history.replaceState(null, "", g === "alle" ? location.pathname : "#" + g); }); apply(); }); });
    q.addEventListener("input", apply);
    apply();
    if (h && valid.indexOf(h) > -1) { var k = $("#katalog"); if (k) setTimeout(function () { k.scrollIntoView(); }, 50); }
  })();

  /* lightbox */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") (function () {
    var links = $$(".gl"), li = $("#lb-img"), cap = $("#lb-cap"), idx = 0;
    function show(i) { idx = (i + links.length) % links.length; var a = links[idx]; li.src = a.getAttribute("data-full"); li.alt = a.getAttribute("data-cap"); cap.textContent = a.getAttribute("data-cap"); }
    links.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); show(i); lb.showModal(); }); });
    lb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb]");
      if (b) { var k = b.getAttribute("data-lb"); if (k === "x") lb.close(); else show(idx + (k === "n" ? 1 : -1)); return; }
      if (e.target === lb) lb.close();
    });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
  })();

  /* course enquiry -> drafted e-mail (their rule: Anmeldungen nur schriftlich oder per E-Mail) */
  var kf = $("#kursform");
  if (kf) (function () {
    var cfg = JSON.parse($("#kurs-data").textContent), L = cfg.labels;
    $$("#k-date option[data-date]").forEach(function (o) { if (parse(o.getAttribute("data-date")) < today) o.disabled = true; });
    kf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { return ($("#" + id).value || "").trim(); };
      var lines = [L.course + ": " + v("k-course"), L.date + ": " + v("k-date"), L.people + ": " + v("k-people")];
      if (v("k-name")) lines.push(L.name + ": " + v("k-name"));
      if (v("k-phone")) lines.push(L.phone + ": " + v("k-phone"));
      if (v("k-fewo")) lines.push(L.fewo + ": " + $("#k-fewo").selectedOptions[0].textContent);
      if (v("k-note")) lines.push("", v("k-note"));
      var subj = cfg.subject + ": " + v("k-course");
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(cfg.hello + lines.join("\n") + "\n");
    });
  })();
})();
