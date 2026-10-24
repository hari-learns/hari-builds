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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("richter-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("richter-dock", "1"); }); });

  /* phone action bar steps aside while the hero's own CTAs are on screen (no doubled buttons on the first screen) */
  var bar = $(".bar"), heroCta = $(".hero .btn-row");
  if (bar && heroCta && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (en) { bar.classList.toggle("is-off", en.isIntersecting); }); }).observe(heroCta);
  }

  /* reveals: blocks + staggered children; sweep reveals anything at or above the fold */
  var items = $$(".rv");
  $$("[data-stagger]").forEach(function (g) {
    $$(":scope > *", g).forEach(function (c, i) { c.style.setProperty("--d", (Math.min(i % 8, 7) * 0.05).toFixed(2) + "s"); items.push(c); });
  });
  function activate(el) { el.classList.add("is-in"); }
  if (reduce) items.forEach(activate);
  var io = (!reduce && "IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  items.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; items.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow", "hashchange"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* open / closed now (Europe/Berlin) */
  $$("[data-open]").forEach(function (el) {
    var h = safe(function () { return JSON.parse(el.getAttribute("data-open")); });
    if (!h) return;
    var parts = safe(function () {
      var f = new Intl.DateTimeFormat("en-GB", { timeZone: h.tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {}; f.forEach(function (p) { o[p.type] = p.value; }); return o;
    });
    if (!parts) return;
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    var mins = (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
    var open = h.days.indexOf(day) > -1 && mins >= h.open && mins < h.close;
    el.textContent = open ? el.getAttribute("data-yes") : el.getAttribute("data-no");
    el.classList.toggle("is-closed", !open);
    el.hidden = false;
  });

  /* parts wall lightbox */
  var lb = $("#lb"), wd = $("#wall-data");
  if (lb && wd && typeof lb.showModal === "function") (function () {
    var data = JSON.parse(wd.textContent), parts = data.parts, cur = 0;
    var im = $("[data-lb-img]", lb), num = $("[data-lb-n]", lb), ask = $("[data-lb-ask]", lb);
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function show(i) {
      cur = (i + parts.length) % parts.length;
      var p = parts[cur];
      im.src = p.src; im.width = p.w; im.height = p.h; im.alt = p.alt;
      num.textContent = "Nr. " + pad(p.n) + " / " + parts.length;
      ask.href = data.rfq + "?teil=" + pad(p.n);
    }
    $$("[data-part]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = parseInt(b.getAttribute("data-part"), 10);
        show(parts.findIndex(function (p) { return p.n === n; }));
        lb.showModal(); root.style.overflow = "hidden";
      });
    });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(cur - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(cur + 1); });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("close", function () { root.style.overflow = ""; });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
  })();

  /* RFQ -> prefilled mail */
  var form = $("#rfq"), rd = $("#rfq-data");
  if (form && rd) (function () {
    var cfg = JSON.parse(rd.textContent), L = cfg.labels;
    var q = safe(function () { return new URLSearchParams(location.search).get("teil"); });
    if (q && /^\d{1,2}$/.test(q)) { form.ref.value = q.length < 2 ? "0" + q : q; }
    function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }
    function checkRange() {
      var t = num(form.thickness.value), s = num(form.size.value);
      $("[data-hint=thickness]", form).hidden = !(t !== null && (t < 0.2 || t > 3));
      $("[data-hint=size]", form).hidden = !(s !== null && (s < 20 || s > 100));
    }
    form.thickness.addEventListener("input", checkRange); form.size.addEventListener("input", checkRange);
    function text() {
      var lines = [cfg.greeting, ""];
      ["kind", "material", "thickness", "size", "qty", "ref", "notes"].forEach(function (k) {
        var v = (form[k].value || "").trim(); if (v) lines.push(L[k] + ": " + v);
      });
      lines.push(cfg.attach, "");
      ["company", "name", "email", "phone"].forEach(function (k) { var v = (form[k].value || "").trim(); if (v) lines.push(L[k] + ": " + v); });
      lines.push("", cfg.closing);
      return lines.join("\n");
    }
    function subject() {
      var s = cfg.subject, k = form.kind.value, c = (form.company.value || "").trim();
      if (k) s += " – " + k; if (c) s += " – " + c; return s;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subject()) + "&body=" + encodeURIComponent(text());
      var a = $("#rfq-after"); if (a) a.hidden = false;
    });
    var cp = $("#rfq-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = "An: " + cfg.to + "\nBetreff: " + subject() + "\n\n" + text();
      var done = function () { var o = cp.textContent; cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = o; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {}); else done();
    });
  })();
})();
