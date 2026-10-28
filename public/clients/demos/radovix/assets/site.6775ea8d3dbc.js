(function () {
  "use strict";
  var d = document, html = d.documentElement;
  html.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header + drawer ---------- */
  var hdr = d.getElementById("hdr");
  function solid() { if (hdr && hdr.classList.contains("hdr--over")) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  solid(); window.addEventListener("scroll", solid, { passive: true });
  var drawer = d.getElementById("drawer"), bOpen = d.getElementById("burger"), bClose = d.getElementById("burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (bOpen) bOpen.setAttribute("aria-expanded", open ? "true" : "false");
    html.style.overflow = open ? "hidden" : "";
    if (open && bClose) bClose.focus(); else if (!open && bOpen) bOpen.focus();
  }
  if (bOpen) bOpen.addEventListener("click", function () { setDrawer(true); });
  if (bClose) bClose.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { if (drawer && drawer.classList.contains("is-open")) setDrawer(false); closePanel(); } });

  /* ---------- dock ---------- */
  var dock = d.getElementById("dock"), dx = d.getElementById("dock-x");
  try { if (dock && sessionStorage.getItem("rdx-dock") === "0") dock.classList.add("is-hidden"); } catch (e) {}
  if (dock) window.addEventListener("scroll", function () { if (window.scrollY > 260) dock.classList.add("is-away"); }, { passive: true });
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-hidden"); try { sessionStorage.setItem("rdx-dock", "0"); } catch (e) {} });

  /* ---------- reveals (observer + sweep fallback) ---------- */
  var rv = [].slice.call(d.querySelectorAll(".rv,.unmask"));
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (t) { window.addEventListener(t, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- open now (their published hours, Europe/Rome) ---------- */
  [].forEach.call(d.querySelectorAll(".open[data-hours]"), function (el) {
    try {
      var H = JSON.parse(el.getAttribute("data-hours"));
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var g = {}; parts.forEach(function (p) { g[p.type] = p.value; });
      var day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g.weekday), min = (+g.hour % 24) * 60 + (+g.minute);
      var open = (H[day] || []).some(function (r) { return min >= r[0] && min < r[1]; });
      el.textContent = open ? el.getAttribute("data-open") : el.getAttribute("data-closed");
      el.classList.toggle("is-open", open);
    } catch (e) { console.warn("[hours]", e); }
  });

  function eur(n) { return "€ " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  /* ---------- hero search: budget options follow the contract ---------- */
  var hs = d.querySelector(".hsearch");
  if (hs) {
    var B = JSON.parse(hs.getAttribute("data-budgets")), anyL = hs.getAttribute("data-any"), sel = hs.querySelector("select[name=max]");
    var sync = function () {
      var c = (hs.querySelector("input[name=c]:checked") || {}).value || "vendita";
      sel.innerHTML = '<option value="">' + anyL + "</option>" + B[c].map(function (b) { return '<option value="' + b + '">' + eur(b) + (c === "vendita" ? "" : "/mese") + "</option>"; }).join("");
    };
    [].forEach.call(hs.querySelectorAll("input[name=c]"), function (r) { r.addEventListener("change", sync); });
    sync();
  }

  /* ---------- finder (signature tool) ---------- */
  var fin = d.getElementById("finder"), panel = d.getElementById("fpanel"), fbtn = d.getElementById("fbtn");
  function closePanel() {
    if (panel && panel.classList.contains("is-open")) { panel.classList.remove("is-open"); if (fbtn) fbtn.setAttribute("aria-expanded", "false"); html.style.overflow = ""; }
  }
  if (fin) {
    var ui = JSON.parse(fin.getAttribute("data-ui")), form = d.getElementById("fform"), grid = d.getElementById("lgrid");
    var cards = [].slice.call(grid.querySelectorAll(".lcard")).map(function (el, i) { var x = JSON.parse(el.getAttribute("data-l")); x.el = el; x.i = i; return x; });
    var oMax = d.getElementById("o-max"), oS = d.getElementById("o-s"), rMax = form.elements.max, rS = form.elements.s;
    var isPage = !!d.querySelector(".pg-immobili");

    // initial state from URL (hero search, shared links)
    var P = new URLSearchParams(location.search);
    var setRadio = function (name, v) { [].forEach.call(form.querySelectorAll("input[name=" + name + "]"), function (r) { r.checked = r.value === v; }); };
    if (P.has("c")) setRadio("c", P.get("c"));
    if (P.get("r")) setRadio("r", P.get("r"));
    if (P.get("q")) form.elements.q.value = P.get("q");
    if (P.get("m")) form.elements.m.value = P.get("m");
    if (P.get("s")) rS.value = P.get("s");
    if (P.get("sort")) form.elements.sort.value = P.get("sort");
    ["t", "f", "md"].forEach(function (n) { P.getAll(n).forEach(function (v) { var b = form.querySelector("input[name=" + n + '][value="' + v + '"]'); if (b) b.checked = true; }); });
    var pendingMax = P.get("max") ? +P.get("max") : null;

    var cval = function () { return (form.querySelector("input[name=c]:checked") || {}).value || ""; };
    var vals = function (n) { return [].map.call(form.querySelectorAll("input[name=" + n + "]:checked"), function (x) { return x.value; }); };
    var budgetFor = function (c) { return ui.budgets[c || "vendita"]; };

    function apply(push) {
      var c = cval(), bl = budgetFor(c);
      if (pendingMax !== null) { var idx = bl.findIndex(function (b) { return b >= pendingMax; }); rMax.value = idx < 0 ? 6 : idx; pendingMax = null; }
      var maxV = c && +rMax.value < 6 ? bl[+rMax.value] : null;
      rMax.disabled = !c; rMax.closest(".fgrp").style.opacity = c ? "" : ".5";
      oMax.textContent = !c ? ui.pick : (maxV ? eur(maxV) + (c === "vendita" ? "" : "/mese") : ui.any);
      var minS = +rS.value; oS.textContent = minS ? minS + " m²" : ui.any;
      var r = (form.querySelector("input[name=r]:checked") || {}).value || "", m = form.elements.m.value, q = form.elements.q.value.trim().toLowerCase();
      var t = vals("t"), f = vals("f"), md = vals("md");
      var shown = cards.filter(function (x) {
        var ok = (!c || x.c.indexOf(c) > -1) && (!maxV || (x.p && x.p <= maxV)) && (!minS || x.s >= minS) &&
          (!r || (r === "4" ? x.r >= 4 : x.r === +r)) && (!m || x.m.indexOf(m) > -1) && (!q || x.q.indexOf(q) > -1) &&
          (!t.length || t.some(function (v) { return x.t.indexOf(v) > -1; })) && f.every(function (v) { return x.f.indexOf(v) > -1; }) &&
          md.every(function (v) { return x.md.indexOf(v) > -1; });
        x.el.hidden = !ok; return ok;
      });
      var so = form.elements.sort.value, key = {
        new: function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : a.i - b.i; },
        price_asc: function (a, b) { return (a.p || 9e9) - (b.p || 9e9); }, price_desc: function (a, b) { return (b.p || 0) - (a.p || 0); },
        size_desc: function (a, b) { return b.s - a.s; } }[so];
      cards.slice().sort(key).forEach(function (x) { grid.appendChild(x.el); });
      if (!reduce) { grid.classList.remove("is-filtering"); void grid.offsetWidth; grid.classList.add("is-filtering"); }
      var n = shown.length, txt = n + " " + (n === 1 ? ui.one : ui.many);
      d.getElementById("fcount").textContent = txt;
      d.getElementById("fdone-n").textContent = "(" + n + ")";
      d.getElementById("fempty").hidden = n > 0;
      var active = (maxV ? 1 : 0) + (minS ? 1 : 0) + (r ? 1 : 0) + (m ? 1 : 0) + t.length + f.length + md.length;
      d.getElementById("fbtn-n").textContent = active ? active : "";
      // criteria -> pre-filled WhatsApp / email
      var lines = [];
      if (c) lines.push(ui.contract + ": " + ui.c[c]);
      if (maxV) lines.push(ui.budget + ": " + eur(maxV) + (c === "vendita" ? "" : "/mese"));
      if (minS) lines.push(ui.size + ": " + minS + " m²");
      if (r) lines.push(ui.rooms + ": " + (r === "4" ? "4+" : r));
      if (m) lines.push(ui.metro + ": " + m);
      if (t.length) lines.push(ui.type + ": " + t.join(", "));
      if (f.length) lines.push(ui.feats + ": " + f.join(", "));
      if (md.length) lines.push(ui.media + ": " + md.join(", "));
      var qs = new URLSearchParams();
      if (c) qs.set("c", c); if (maxV) qs.set("max", maxV); if (minS) qs.set("s", minS); if (r) qs.set("r", r); if (m) qs.set("m", m);
      if (q) qs.set("q", q); if (so !== "new") qs.set("sort", so);
      t.forEach(function (v) { qs.append("t", v); }); f.forEach(function (v) { qs.append("f", v); }); md.forEach(function (v) { qs.append("md", v); });
      var link = ui.page + (qs.toString() ? "?" + qs.toString() : "");
      var msg = ui.intro + "\n" + (lines.length ? "- " + lines.join("\n- ") : "-") + "\n(" + n + " " + ui.many + ": " + link + ")";
      d.getElementById("fsave-wa").href = "https://wa.me/" + ui.wa + "?text=" + encodeURIComponent(msg);
      d.getElementById("fsave-mail").href = "mailto:" + ui.email + "?subject=" + encodeURIComponent(ui.subject) + "&body=" + encodeURIComponent(msg);
      if (isPage && push) { try { history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs.toString() : "")); } catch (e) {} }
    }
    form.addEventListener("input", function (ev) { if (ev.target.name === "c") rMax.value = 6; apply(true); });
    form.addEventListener("change", function () { apply(true); });
    d.getElementById("freset").addEventListener("click", function () {
      [].forEach.call(form.querySelectorAll("input[type=checkbox]"), function (b) { b.checked = false; });
      setRadio("r", ""); form.elements.m.value = ""; form.elements.q.value = ""; rMax.value = 6; rS.value = 0; apply(true);
    });
    if (fbtn) fbtn.addEventListener("click", function () {
      var open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open); fbtn.setAttribute("aria-expanded", open ? "true" : "false");
      html.style.overflow = open && window.innerWidth < 900 ? "hidden" : "";
      if (open) { var first = panel.querySelector("input,select,button"); if (first) first.focus(); }
    });
    d.getElementById("fdone").addEventListener("click", function () { closePanel(); fin.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    apply(false);
  }

  /* ---------- owners' request -> WhatsApp / email (nothing stored) ---------- */
  var of = d.getElementById("oform");
  if (of) {
    var compose = function () {
      var lines = [];
      [].forEach.call(of.querySelectorAll("label.f, fieldset"), function (l) {
        var lab = l.querySelector("span, legend"), inp = l.querySelector("input:checked, select, textarea, input:not([type=radio])");
        if (inp && inp.value && lab) lines.push(lab.textContent + ": " + inp.value);
      });
      return of.getAttribute("data-subject") + "\n" + lines.join("\n");
    };
    d.getElementById("o-wa").addEventListener("click", function () { window.open("https://wa.me/" + of.getAttribute("data-wa") + "?text=" + encodeURIComponent(compose()), "_blank", "noopener"); });
    d.getElementById("o-mail").addEventListener("click", function () { location.href = "mailto:" + of.getAttribute("data-mail") + "?subject=" + encodeURIComponent(of.getAttribute("data-subject")) + "&body=" + encodeURIComponent(compose()); });
  }
})();
