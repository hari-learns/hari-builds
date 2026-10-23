(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function json(id) { var n = $("#" + id); return n ? JSON.parse(n.textContent) : null; }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("inauen-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("inauen-dock", "1"); }); });

  /* reveals with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* ------------------------------------------------ the instrument: which machines cover this diameter? */
  var gEl = $("[data-gauge]");
  if (gEl) (function () {
    var data = json("gauge-data"), ui = data.ui, max = data.max;
    var rows = $$(".mr", gEl), line = $("[data-line]", gEl), tag = $("[data-tag]", gEl), scale = $("[data-scale]", gEl);
    var sumEl = $("[data-sum]", gEl), qmsg = $("[data-qmsg]", gEl), cta = $("[data-cta]", gEl);
    var nd = $("#g-d", gEl), rd = $('[data-r="d"]', gEl), nq = $("#g-q", gEl);
    var st = { d: Number(nd.value), q: Number(nq.value) };
    function fmt(n) { return String(Math.round(n * 10) / 10); }
    function update() {
      var ok = 0, total = 0;
      rows.forEach(function (r) {
        var s = $("[data-s]", r);
        if (!r.hasAttribute("data-lo")) { r.classList.remove("is-ok", "is-no"); s.textContent = ""; return; }
        var inr = st.d >= Number(r.getAttribute("data-lo")) && st.d <= Number(r.getAttribute("data-hi"));
        total += 1; if (inr) ok += 1;
        r.classList.toggle("is-ok", inr); r.classList.toggle("is-no", !inr);
        s.textContent = inr ? ui.ok : ui.no;
      });
      var p = Math.max(0, Math.min(100, st.d / max * 100));
      scale.style.setProperty("--p", p.toFixed(2));
      tag.textContent = "Ø " + fmt(st.d) + " mm";
      tag.style.transform = "translateX(-" + p.toFixed(1) + "%)";
      var tpl = ok ? ui.sum_fmt : ui.sum_none;
      sumEl.innerHTML = tpl.replace("{d}", fmt(st.d)).replace("{n}", "<b>" + ok + "</b>").replace("{m}", total);
      qmsg.textContent = st.q >= 50 && st.q <= 5000 ? ui.qty_ok : ui.qty_out;
      cta.setAttribute("href", data.cta + "?d=" + encodeURIComponent(fmt(st.d)) + "&q=" + encodeURIComponent(Math.round(st.q)));
    }
    function setD(v, from) {
      v = Number(v); if (!isFinite(v) || v <= 0) return;
      st.d = Math.min(200, v);
      if (from !== "n") nd.value = fmt(st.d);
      if (from !== "r") rd.value = Math.min(80, st.d);
      update();
    }
    nd.addEventListener("input", function (e) { if (e.target.value !== "") setD(e.target.value, "n"); });
    nd.addEventListener("change", function (e) { setD(e.target.value || st.d); });
    rd.addEventListener("input", function (e) { setD(e.target.value, "r"); });
    nq.addEventListener("input", function (e) { var v = Number(e.target.value); if (isFinite(v) && v > 0) { st.q = v; update(); } });
    $$("[data-preset]", gEl).forEach(function (b) { b.addEventListener("click", function () { setD(b.getAttribute("data-preset")); }); });
    update();
  })();

  /* ------------------------------------------------ open now, from the published hours (Europe/Zurich) */
  var openEls = $$("[data-open]");
  if (openEls.length) safe(function () {
    var od = json("open-data"); if (!od) return;
    var T = od.t, H = od.hours;
    function hm(s) { var a = s.split(":"); return Number(a[0]) * 60 + Number(a[1]); }
    function label(s) { return s.replace(":", "."); }
    function slots(day) { return H[String(day)] || (day >= 1 && day <= 4 ? H["1-4"] : null); }
    function render() {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], now = Number(o.hour) * 60 + Number(o.minute), txt = "";
      var today = slots(day), i;
      if (today) for (i = 0; i < today.length; i++) if (now >= hm(today[i][0]) && now < hm(today[i][1])) txt = T.open_yes.replace("{t}", label(today[i][1]));
      if (!txt) {
        var found = null;
        for (var off = 0; off < 8 && !found; off++) {
          var dd = (day + off) % 7, sl = slots(dd);
          if (!sl) continue;
          for (i = 0; i < sl.length; i++) if (off > 0 || hm(sl[i][0]) > now) { found = { off: off, day: dd, t: sl[i][0] }; break; }
        }
        if (found) txt = T.open_no.replace("{d}", found.off === 0 ? T.today : found.off === 1 ? T.tomorrow : T.days[found.day]).replace("{t}", label(found.t));
      }
      openEls.forEach(function (el) { el.textContent = txt; });
    }
    render();
  });

  /* ------------------------------------------------ RFQ form -> mailto */
  var rfq = $("#rfq");
  if (rfq) (function () {
    var cfg = json("rfq-data"), L = cfg.labels, R = cfg.R, q = new URLSearchParams(location.search);
    function num(k, lo, hi) { var v = Number(q.get(k)); return isFinite(v) && v >= lo && v <= hi ? v : null; }
    var dd = num("d", 0.5, 200), qq = num("q", 1, 99999);
    if (dd) $("#dia").value = String(Math.round(dd * 10) / 10);
    if (qq) $("#qty").value = String(Math.round(qq));
    function val(id) { return $("#" + id).value.trim(); }
    function machines() {
      var v = Number(val("dia").replace(",", ".")); if (!isFinite(v) || v <= 0) return "";
      var seen = {}, out = [];
      cfg.machines.forEach(function (m) { if (v >= m.lo && v <= m.hi && !seen[m.n]) { seen[m.n] = 1; out.push(m.n); } });
      return out.join(", ");
    }
    var hint = $("[data-hint]");
    function showHint() { if (!hint) return; var m = machines(); hint.textContent = m ? R.machines_line + ": " + m : ""; }
    $("#dia").addEventListener("input", showHint); showHint();
    function text() {
      var fin = $$("input[name=finish]:checked", rfq).map(function (c) { return c.value; }).join(", ");
      var lines = [R.greet, "", R.intro, ""];
      [["part", "part"], ["dia", "dia"], ["len", "len"], ["material", "material"], ["qty", "qty"]].forEach(function (p) {
        var v = val(p[0]); if (v) lines.push(L[p[1]] + ": " + v);
      });
      if (fin) lines.push(L.finish + ": " + fin);
      if (val("notes")) lines.push(L.notes + ": " + val("notes"));
      var m = machines(); if (m) { lines.push(""); lines.push(R.machines_line + ": " + m); }
      lines.push(""); lines.push(R.drawing_line); lines.push(""); lines.push(R.bye);
      ["name", "company", "email", "phone"].forEach(function (k) { if (val(k)) lines.push(val(k)); });
      return lines.join("\n");
    }
    rfq.addEventListener("submit", function (e) {
      e.preventDefault();
      var pt = val("part"), co = val("company");
      var subj = cfg.subject + (pt ? " - " + pt : "") + (co ? " (" + co + ")" : "");
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#rfq-copy");
    cp.addEventListener("click", function () {
      var old = cp.textContent, t = text();
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { });
    });
  })();
})();
