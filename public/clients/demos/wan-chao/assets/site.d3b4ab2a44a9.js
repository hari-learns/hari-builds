/* Wan Chao redesign concept. One IIFE, every feature guarded by the element it needs. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var KEY = "wc-inq";
  var mem = {};

  /* ---------- storage (never throws) ---------- */
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return mem; }
  }
  function save(v) { mem = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function count() { return Object.keys(load()).length; }
  function paintCount() {
    var n = count();
    $$("[data-inq-count]").forEach(function (el) { el.textContent = n; el.setAttribute("data-n", n); });
  }
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 1800);
  }

  /* ---------- concept dock ---------- */
  var dock = $("#dock");
  if (dock) {
    try { if (sessionStorage.getItem("wc-dock") === "1") dock.hidden = true; } catch (e) { /* ignore */ }
    var dx = $("#dock-x");
    if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("wc-dock", "1"); } catch (e) { /* ignore */ } });
  }

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && document.activeElement === burgerX) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) {
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1060 && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- reveals (IntersectionObserver + sweep, never strands content) ---------- */
  var targets = $$(".rv:not(.ser .rv)").concat($$("[data-ser]"));
  function activate(el) { el.classList.add("is-in"); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } }); }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else { targets.forEach(activate); }
  function sweep() {
    var vh = window.innerHeight || 800;
    targets.forEach(function (t) { if (!t.classList.contains("is-in") && t.getBoundingClientRect().top < vh * 0.96) activate(t); });
  }
  ["scroll", "resize", "load", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) targets.forEach(activate);

  /* ---------- catalogue ---------- */
  var grid = $("#grid");
  var PD = {};
  if (grid) {
    PD = JSON.parse($("#pdata").textContent);
    var CF = JSON.parse($("#cconf").textContent);
    var cards = $$(".pc", grid);
    var st = { q: "", type: "", mat: "", band: "", sort: "feat", limit: CF.page };
    var MR = { "Stainless steel": 0, "Titanium": 1, "Tritan / plastic": 2, "Glass": 3 }, TR = { "Mug": 0, "Bottle": 1, "Flask": 2, "Food jar": 3, "Coffee & tea": 4, "Tableware & outdoor": 5 };
    var qEl = $("#q"), sEl = $("#sort"), moreBtn = $("#more"), emptyEl = $("#empty"), shownEl = $("[data-shown]"), resetBtn = $("[data-reset]");
    var chipGroups = {};
    $$(".fchips").forEach(function (g) { chipGroups[g.getAttribute("data-f")] = g; });

    var sp = new URLSearchParams(location.search);
    ["q", "type", "mat", "band"].forEach(function (k) { if (sp.get(k)) st[k] = sp.get(k); });
    if (["feat", "up", "dn", "name"].indexOf(sp.get("sort")) > -1) st.sort = sp.get("sort");
    qEl.value = st.q; sEl.value = st.sort;

    function paintChips() {
      Object.keys(chipGroups).forEach(function (g) {
        $$(".chip", chipGroups[g]).forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-v") === st[g] ? "true" : "false"); });
      });
    }
    function matches(c) {
      if (st.type && c.getAttribute("data-type") !== st.type) return false;
      if (st.mat && c.getAttribute("data-mat") !== st.mat) return false;
      if (st.band && CF.bands[st.band]) {
        var ml = +c.getAttribute("data-ml"), b = CF.bands[st.band];
        if (ml < b[0] || ml > b[1]) return false;
      }
      if (st.q) {
        var hay = c.getAttribute("data-s");
        var toks = st.q.toLowerCase().split(/\s+/).filter(Boolean);
        for (var i = 0; i < toks.length; i++) if (hay.indexOf(toks[i]) < 0) return false;
      }
      return true;
    }
    function apply(keepLimit) {
      if (!keepLimit) st.limit = CF.page;
      var list = cards.filter(matches);
      var cmp = st.sort === "dn" ? function (a, b) { return b.ml - a.ml || a.n.localeCompare(b.n); }
        : st.sort === "name" ? function (a, b) { return a.n.localeCompare(b.n); }
        : st.sort === "feat" ? function (a, b) { return (a.mr - b.mr) || (a.tr - b.tr) || (a.ml - b.ml) || a.n.localeCompare(b.n); }
        : function (a, b) { return a.ml - b.ml || a.n.localeCompare(b.n); };
      var meta = function (c) { return { c: c, ml: +c.getAttribute("data-ml"), n: c.getAttribute("data-name"), mr: MR[c.getAttribute("data-mat")] || 0, tr: TR[c.getAttribute("data-type")] || 0 }; };
      var sorted = list.map(meta).sort(cmp).map(function (m) { return m.c; });
      var frag = document.createDocumentFragment();
      sorted.forEach(function (c, i) { c.hidden = i >= st.limit; frag.appendChild(c); });
      cards.forEach(function (c) { if (sorted.indexOf(c) < 0) { c.hidden = true; frag.appendChild(c); } });
      grid.appendChild(frag);
      var shown = Math.min(sorted.length, st.limit);
      shownEl.textContent = sorted.length;
      emptyEl.hidden = sorted.length > 0;
      moreBtn.hidden = sorted.length <= st.limit;
      var active = st.q || st.type || st.mat || st.band;
      resetBtn.hidden = !active;
      var p = new URLSearchParams();
      ["q", "type", "mat", "band"].forEach(function (k) { if (st[k]) p.set(k, st[k]); });
      if (st.sort !== "feat") p.set("sort", st.sort);
      try { history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : "")); } catch (e) { /* ignore */ }
      paintChips(); paintAdds();
    }
    Object.keys(chipGroups).forEach(function (g) {
      chipGroups[g].addEventListener("click", function (ev) {
        var b = ev.target.closest(".chip"); if (!b) return;
        st[g] = b.getAttribute("data-v"); apply();
      });
    });
    var qT; qEl.addEventListener("input", function () { clearTimeout(qT); qT = setTimeout(function () { st.q = qEl.value.trim(); apply(); }, 120); });
    qEl.addEventListener("search", function () { st.q = qEl.value.trim(); apply(); });
    sEl.addEventListener("change", function () { st.sort = sEl.value; apply(); });
    moreBtn.addEventListener("click", function () { st.limit += CF.page; apply(true); });
    resetBtn.addEventListener("click", function () { st.q = st.type = st.mat = st.band = ""; qEl.value = ""; apply(); });

    function toggleAdd(id) {
      var b = load();
      if (b[id]) { delete b[id]; save(b); toast("Removed from inquiry"); }
      else { b[id] = b[id] || 1; save(b); toast(CF.ui.added + " · " + Object.keys(b).length); }
      paintCount(); paintAdds();
    }
    function paintAdds() {
      var b = load();
      cards.forEach(function (c) {
        var on = !!b[c.getAttribute("data-id")];
        var btn = $(".pc__add", c);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        $("[data-on]", btn).hidden = !on; $("[data-off]", btn).hidden = on;
      });
      if (dlg && dlg.open && curId) { dAdd.setAttribute("aria-pressed", b[curId] ? "true" : "false"); dAdd.textContent = b[curId] ? CF.ui.added : CF.ui.add; }
    }
    grid.addEventListener("click", function (ev) {
      var add = ev.target.closest(".pc__add");
      if (add) { toggleAdd(add.getAttribute("data-add")); return; }
      var op = ev.target.closest(".pc__open");
      if (op) openDlg(op.closest(".pc").getAttribute("data-id"), op);
    });

    var dlg = $("#pdlg"), dAdd = $("#d-add"), curId = null, lastBtn = null;
    function row(dt, dd) { var a = document.createElement("dt"), b = document.createElement("dd"); a.textContent = dt; b.textContent = dd; return [a, b]; }
    function openDlg(id, opener) {
      var d = PD[id]; if (!d) return;
      curId = id; lastBtn = opener;
      var im = $("#d-img"); im.src = d.i2; im.alt = d.n; im.width = d.i2w; im.height = d.i2h;
      $("#d-name").textContent = d.n;
      var sp2 = $("#d-specs"); sp2.textContent = "";
      var pairs = [[CF.ui.model, d.m], [CF.ui.type, d.t], [CF.ui.material, d.mt], [CF.ui.capLabel, d.c]];
      if (d.b) pairs.push([CF.ui.brand, d.b]);
      if (d.f && d.f.length) pairs.push([CF.ui.tags, d.f.join(" · ")]);
      pairs.forEach(function (p) { if (p[1]) row(p[0], p[1]).forEach(function (n) { sp2.appendChild(n); }); });
      $("#d-desc").textContent = d.d || "";
      $("#d-live").href = d.u;
      paintAdds();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    if (dlg) {
      dAdd.addEventListener("click", function () { if (curId) toggleAdd(curId); });
      $("[data-close]", dlg).addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });
    }
    apply();
  }

  /* ---------- inquiry page ---------- */
  var listEl = $("#inq-list");
  if (listEl) {
    var MINI = JSON.parse($("#pmini").textContent), IC = JSON.parse($("#iconf").textContent), U = IC.ui;
    var hasEl = $("#inq-has"), emptyBox = $("#inq-empty"), form = $("#inq-form");
    function render() {
      var b = load(), ids = Object.keys(b).filter(function (k) { return MINI[k]; });
      listEl.textContent = "";
      ids.forEach(function (id) {
        var m = MINI[id], r = document.createElement("div"); r.className = "irow";
        var imW = document.createElement("div"); imW.className = "irow__im";
        var im = document.createElement("img"); im.src = m.i; im.width = m.w; im.height = m.h; im.alt = m.n; im.loading = "lazy"; imW.appendChild(im);
        var tx = document.createElement("div"); tx.className = "irow__b";
        var nm = document.createElement("b"); nm.textContent = m.n; var sp3 = document.createElement("span"); sp3.textContent = m.m + " · " + m.c;
        tx.appendChild(nm); tx.appendChild(sp3);
        var ctl = document.createElement("div"); ctl.className = "irow__ctl";
        var q = document.createElement("label"); q.className = "qty"; q.textContent = U.qty + " ";
        var inp = document.createElement("input"); inp.className = "input"; inp.type = "number"; inp.min = "1"; inp.inputMode = "numeric"; inp.value = b[id] > 0 ? b[id] : 1; inp.setAttribute("aria-label", U.qty + ": " + m.n);
        inp.addEventListener("change", function () { var v = Math.max(1, parseInt(inp.value, 10) || 1); inp.value = v; var s = load(); s[id] = v; save(s); });
        q.appendChild(inp);
        var rm = document.createElement("button"); rm.type = "button"; rm.className = "irow__rm"; rm.textContent = U.remove;
        rm.addEventListener("click", function () { var s = load(); delete s[id]; save(s); render(); paintCount(); });
        ctl.appendChild(q); ctl.appendChild(rm);
        r.appendChild(imW); r.appendChild(tx); r.appendChild(ctl); listEl.appendChild(r);
      });
      hasEl.hidden = !ids.length; emptyBox.hidden = !!ids.length;
      paintCount();
    }
    $("#inq-clear").addEventListener("click", function () { save({}); render(); });
    function compose() {
      var b = load(), ids = Object.keys(b).filter(function (k) { return MINI[k]; });
      var f = new FormData(form), custom = f.getAll("custom");
      var L = [U.greet, "", U.intro, ""];
      ids.forEach(function (id, i) { var m = MINI[id]; L.push((i + 1) + ". " + m.m + " | " + m.n + " | " + m.c + " | " + b[id] + " pcs"); });
      if (custom.length) { L.push(""); L.push(U.custom_h + ": " + custom.join(", ")); }
      if ((f.get("notes") || "").trim()) { L.push(""); L.push(f.get("notes").trim()); }
      var who = [f.get("name"), f.get("company"), f.get("email"), f.get("country")].map(function (x) { return (x || "").trim(); }).filter(Boolean);
      L.push(""); if (who.length) L.push(U.from + ": " + who.join(", ")); L.push(U.thanks);
      return { n: ids.length, text: L.join("\n") };
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var c = compose(), subject = U.subject + (c.n ? " (" + c.n + " models)" : "");
      var href = "mailto:" + IC.to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(c.text);
      var long = href.length > 1900;
      $("#inq-limit").hidden = !long;
      if (long) href = "mailto:" + IC.to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(c.text.slice(0, 1200) + "\n...");
      window.location.href = href;
    });
    $("#inq-copy").addEventListener("click", function () {
      var c = compose(), btn = $("#inq-copy"), old = btn.textContent;
      function done() { btn.textContent = btn.getAttribute("data-done"); setTimeout(function () { btn.textContent = old; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c.text).then(done, done); else done();
    });
    render();
  }

  paintCount();
  window.addEventListener("storage", paintCount);
  window.addEventListener("pageshow", paintCount);
})();
