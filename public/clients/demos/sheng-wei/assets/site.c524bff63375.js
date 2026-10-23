(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sw-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sw-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
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

  /* parts filter */
  var cases = $("[data-cases]");
  if (cases) {
    var chips = $$(".filter .chip"), cards = $$(".case", cases), countEl = $("[data-count]"), emptyEl = $("[data-empty]");
    function applyFilter(tag) {
      var n = 0;
      cards.forEach(function (c) { var show = tag === "all" || c.getAttribute("data-tag") === tag; c.hidden = !show; if (show) { n++; c.classList.add("is-in"); } });
      chips.forEach(function (b) { var on = b.getAttribute("data-f") === tag; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (emptyEl) emptyEl.hidden = n > 0;
      if (countEl) countEl.textContent = n + (root.lang === "en" ? " cases" : " 件案例");
    }
    chips.forEach(function (b) { b.addEventListener("click", function () { applyFilter(b.getAttribute("data-f")); }); });
    var hash = (location.hash || "").slice(1), target = hash && d.getElementById(hash);
    applyFilter("all");
    if (target) setTimeout(function () { target.scrollIntoView(); }, 60);
  }

  /* tolerance sheet */
  var gEl = $("[data-gauge]");
  if (gEl) (function () {
    var data = JSON.parse($("#gauge-data").textContent), ui = data.ui, LO = Math.log10(0.0005), SPAN = Math.log10(0.1) - LO;
    var rows = $$(".grow", gEl), sumEl = $("[data-sum]", gEl), cta = $("[data-cta]", gEl), od = $("[data-od]", gEl), odB = $("[data-od-badge]", gEl), mat = $("[data-mat]", gEl);
    function pct(v) { return Math.max(0, Math.min(100, (Math.log10(v) - LO) / SPAN * 100)); }
    function evalRow(r) {
      var inp = $("[data-in]", r), badge = $("[data-badge]", r), v = parseFloat(inp.value), lim = parseFloat(r.getAttribute("data-limit"));
      r.classList.remove("is-ok", "is-tight", "has-v");
      if (!isFinite(v) || v <= 0) { badge.textContent = ""; return null; }
      r.classList.add("has-v");
      r.querySelector(".trk").style.setProperty("--b", pct(v).toFixed(2) + "%");
      var ok = v >= lim - 1e-12;
      r.classList.add(ok ? "is-ok" : "is-tight");
      badge.textContent = ok ? ui.ok : ui.tight;
      return { k: r.getAttribute("data-k"), v: v, ok: ok };
    }
    function update() {
      var res = rows.map(evalRow).filter(Boolean), ok = res.filter(function (x) { return x.ok; }).length, tight = res.length - ok;
      if (!res.length) sumEl.textContent = ui.sum_none;
      else {
        var t = ui.sum_ok.replace("{n}", "<b>" + ok + "</b>").replace("{m}", "<b>" + res.length + "</b>");
        if (tight) t += " · " + ui.sum_tight.replace("{t}", "<b>" + tight + "</b>");
        sumEl.innerHTML = t;
      }
      var o = parseFloat(od.value);
      if (!isFinite(o) || o <= 0) odB.textContent = ""; else { var inr = o >= 1 && o <= 26; odB.textContent = inr ? ui.od_ok : ui.od_out; odB.className = "badge " + (inr ? "ok" : "no"); }
      var q = new URLSearchParams();
      if (res.length) q.set("tol", res.map(function (x) { return x.k + ":" + x.v; }).join(","));
      if (isFinite(o) && o > 0) q.set("od", o);
      if (mat.value) q.set("mat", mat.value);
      cta.setAttribute("href", data.contact + (q.toString() ? "?" + q.toString() : ""));
    }
    rows.forEach(function (r) { $("[data-in]", r).addEventListener("input", update); });
    od.addEventListener("input", update); mat.addEventListener("change", update);
    $$("[data-quick]", gEl).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-quick");
        rows.forEach(function (r) { $("[data-in]", r).value = v; });
        $$("[data-quick]", gEl).forEach(function (x) { x.classList.toggle("is-on", x === b); });
        update();
      });
    });
    var first = $('[data-quick="0.005"]', gEl); if (first) first.click(); else update();
  })();

  /* RFQ form -> mailto */
  var rfq = $("#rfq");
  if (rfq) (function () {
    var cfg = JSON.parse($("#rfq-data").textContent), L = cfg.labels, q = new URLSearchParams(location.search);
    function setv(id, v) { var el = $("#" + id); if (el && v) el.value = v; }
    setv("part", (q.get("part") || "").slice(0, 120));
    var odv = parseFloat(q.get("od")); if (isFinite(odv) && odv > 0 && odv < 1000) setv("size", String(odv));
    var m = q.get("mat"), sel = $("#mat"); if (m && sel) $$("option", sel).forEach(function (o) { if (o.value === m || o.textContent === m) sel.value = o.value || o.textContent; });
    var tol = q.get("tol");
    if (tol) {
      var lines = [];
      tol.split(",").forEach(function (p) { var kv = p.split(":"), n = cfg.names[kv[0]], v = parseFloat(kv[1]); if (n && isFinite(v) && v > 0 && v < 10) lines.push(n + ": " + v + " mm"); });
      if (lines.length) setv("tol", lines.join("\n") + "\n(" + cfg.tolnote + ")");
    }
    function text() {
      var ids = ["name", "company", "email", "phone", "part", "mat", "size", "qty", "use", "tol", "notes"], out = [];
      ids.forEach(function (id) { var v = $("#" + id).value.trim(); if (v) out.push(L[id] + ": " + v); });
      out.push(""); out.push(cfg.attach);
      return out.join("\n");
    }
    rfq.addEventListener("submit", function (e) {
      e.preventDefault();
      var co = $("#company").value.trim(), pt = $("#part").value.trim();
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
