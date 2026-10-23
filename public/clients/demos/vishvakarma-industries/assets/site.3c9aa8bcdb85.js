(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

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
  if (dock && safe(function () { return sessionStorage.getItem("vi-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("vi-dock", "1"); }); });

  /* reveals; the sweep also reveals anything already scrolled past */
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

  /* ------------------------------------------------ profile reference + pulley sizing (their pitch table only) */
  $$("[data-tool]").forEach(function (root_) {
    var data = JSON.parse($("[data-tool-data]", root_).textContent), P = data.profiles, ui = data.ui;
    var cur = data.default, famBtns = $$(".seg__b", root_), chips = $$(".chip", root_), rows = $$(".lad__row", root_);
    var inA = $('[data-i="a"]', root_), inB = $('[data-i="b"]', root_);
    function o(k) { return $('[data-o="' + k + '"]', root_); }
    function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }
    function teeth(inp) { var v = parseInt(inp.value, 10); return v >= 1 && v <= 500 ? v : 0; }
    function showFam(f) {
      famBtns.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-fam") === f ? "true" : "false"); });
      chips.forEach(function (c) { c.hidden = c.getAttribute("data-fam") !== f; });
    }
    function select(k) {
      cur = k; var p = P[k]; showFam(p.fam);
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-p") === k ? "true" : "false"); });
      rows.forEach(function (r) { r.classList.toggle("is-on", r.getAttribute("data-p") === k); });
      o("pitch").textContent = p.pitch; o("hp").textContent = p.hp; o("hs").textContent = p.hs;
      var n = o("note"); if (p.note && data.notes[p.note]) { n.textContent = data.notes[p.note]; n.hidden = false; } else { n.hidden = true; }
      calc();
    }
    function calc() {
      var p = P[cur], a = teeth(inA), b = teeth(inB), pi = Math.PI;
      var da = a ? a * p.pitch / pi : 0, db = b ? b * p.pitch / pi : 0;
      o("pda").textContent = a ? fmt(da) : "-"; o("pdb").textContent = b ? fmt(db) : "-";
      o("ratio").textContent = a && b ? (b >= a ? fmt(b / a) + ":1" : "1:" + fmt(a / b)) : "-";
      var msg = ui.msg_intro + "\nProfile: " + p.name + " (" + ui.pitch.toLowerCase() + " " + p.pitch + " " + ui.mm + ")";
      if (a) msg += "\nPulley 1: " + a + " " + ui.teeth + ", " + ui.pd.toLowerCase() + " " + fmt(da) + " " + ui.mm;
      if (b) msg += "\nPulley 2: " + b + " " + ui.teeth + ", " + ui.pd.toLowerCase() + " " + fmt(db) + " " + ui.mm;
      if (p.note) msg += "\n(" + ui.checks + ")";
      o("wa").href = data.wa + "?text=" + encodeURIComponent(msg);
      o("mail").href = "mailto:" + data.mail + "?subject=" + encodeURIComponent(ui.subject + " " + p.name) + "&body=" + encodeURIComponent(msg);
    }
    famBtns.forEach(function (b) { b.addEventListener("click", function () {
      var f = b.getAttribute("data-fam"); showFam(f);
      if (P[cur].fam !== f) { var first = chips.filter(function (c) { return c.getAttribute("data-fam") === f; })[0]; if (first) select(first.getAttribute("data-p")); }
    }); });
    chips.forEach(function (c) { c.addEventListener("click", function () { select(c.getAttribute("data-p")); }); });
    inA.addEventListener("input", calc); inB.addEventListener("input", calc);
    select(cur);
  });

  /* ------------------------------------------------ enquiry composer (WhatsApp / email / copy) */
  var enq = $("[data-enq]");
  if (enq) (function () {
    var data = JSON.parse($("[data-enq-data]").textContent);
    var ids = ["c-name", "c-co", "c-ph", "c-need"];
    function text() {
      var lines = [data.hello];
      ids.forEach(function (id, i) { var v = ($("#" + id).value || "").trim(); if (v) lines.push(data.f[i] + ": " + v); });
      return lines.join("\n");
    }
    function upd() {
      var t = text();
      $("[data-enq-wa]").href = data.wa + "?text=" + encodeURIComponent(t);
      $("[data-enq-mail]").href = "mailto:" + data.mail + "?subject=" + encodeURIComponent(data.subject) + "&body=" + encodeURIComponent(t);
    }
    ids.forEach(function (id) { $("#" + id).addEventListener("input", upd); });
    var cp = $("[data-enq-copy]");
    cp.addEventListener("click", function () {
      var t = text(), done = cp.getAttribute("data-done"), old = cp.textContent;
      function ok() { cp.textContent = done; setTimeout(function () { cp.textContent = old; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok); else ok();
    });
    upd();
  })();

  /* map loads only on tap */
  var map = $("[data-map]");
  if (map) $("[data-map-load]", map).addEventListener("click", function () {
    var f = d.createElement("iframe");
    f.src = map.getAttribute("data-map"); f.title = "Map"; f.loading = "lazy"; f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    map.innerHTML = ""; map.appendChild(f);
  });
})();
