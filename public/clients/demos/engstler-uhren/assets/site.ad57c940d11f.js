(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function json(id) { var el = d.getElementById(id); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { console.warn("[engstler] bad json", id, e); return null; } }

  /* header state */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-scrolled", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = open ? 0 : -1; });
    if (open && bx) bx.focus(); else if (!open && burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (drawer) { setDrawer(false); }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock");
  if (dock) {
    if (store("engstler-dock") === "x") dock.hidden = true;
    var dx = $("#dock-x"); if (dx) dx.addEventListener("click", function () { dock.hidden = true; store("engstler-dock", "x"); });
  }

  /* reveals with sweep safety net */
  var rv = $$(".rv");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el, i) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      if (el.classList.contains("clk") || el.classList.contains("range") || el.classList.contains("fact")) el.style.setProperty("--d", Math.min(sib % 5, 4) * 0.05 + "s");
      io.observe(el);
    });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "resize", "pageshow"].forEach(function (t) { addEventListener(t, sweep); });
    addEventListener("scroll", function () { requestAnimationFrame(sweep); }, { passive: true });
    sweep();
  }

  /* Werk chapter: real photo follows the active step */
  var steps = $$("[data-wk-s]"), figs = $$("[data-wk-f]");
  if (steps.length && figs.length && "IntersectionObserver" in window) {
    var setStep = function (i) {
      figs.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-wk-f") === i); });
      steps.forEach(function (s) { s.classList.toggle("is-on", s.getAttribute("data-wk-s") === i); });
    };
    var sio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) setStep(en.target.getAttribute("data-wk-s")); }); }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { sio.observe(s); });
    setStep("0");
  } else { steps.forEach(function (s) { s.classList.add("is-on"); }); }

  /* Anfrageliste (per-viewer convenience, localStorage) */
  var LD = json("list-data") || {};
  var KEY = "engstler-anfrageliste";
  function getList() { try { return JSON.parse(store(KEY) || "[]") || []; } catch (e) { return []; } }
  function setList(l) { store(KEY, JSON.stringify(l)); render(); }
  function has(a) { return getList().some(function (x) { return x.a === a; }); }
  function toggle(a, n) {
    var l = getList(), i = -1;
    l.forEach(function (x, k) { if (x.a === a) i = k; });
    if (i > -1) l.splice(i, 1); else l.push({ a: a, n: n || "" });
    setList(l);
  }
  var listDlg = $("#listdlg");
  function mailHref() {
    var l = getList(), firm = listDlg ? ($("[data-firm]", listDlg) || {}).value || "" : "";
    var lines = [LD.hello || "", "", LD.body || ""].concat(l.map(function (x) { return "- " + (LD.art || "Art. Nr.") + " " + x.a + (x.n ? " (" + x.n + ")" : ""); }));
    lines = lines.concat(["", LD.bye || "", firm]);
    return "mailto:" + (LD.to || "") + "?subject=" + encodeURIComponent(LD.subject || "") + "&body=" + encodeURIComponent(lines.join("\n"));
  }
  function render() {
    var l = getList();
    $$("[data-count]").forEach(function (b) { b.textContent = l.length; if (l.length) b.removeAttribute("data-zero"); else b.setAttribute("data-zero", ""); });
    $$("[data-add]").forEach(function (b) { b.setAttribute("aria-pressed", has(b.getAttribute("data-add")) ? "true" : "false"); });
    if (!listDlg) return;
    var ul = $("[data-items]", listDlg), empty = $("[data-empty]", listDlg), send = $("[data-send]", listDlg);
    ul.innerHTML = "";
    l.forEach(function (x) {
      var li = d.createElement("li"), sp = d.createElement("span"), b = d.createElement("b"), sm = d.createElement("small"), btn = d.createElement("button");
      b.textContent = (LD.art || "") + " " + x.a; sm.textContent = x.n; sp.appendChild(b); sp.appendChild(sm);
      btn.type = "button"; btn.textContent = LD.remove || "x"; btn.addEventListener("click", function () { toggle(x.a); });
      li.appendChild(sp); li.appendChild(btn); ul.appendChild(li);
    });
    empty.hidden = l.length > 0;
    send.setAttribute("href", mailHref());
    if (l.length) send.removeAttribute("aria-disabled"); else send.setAttribute("aria-disabled", "true");
  }
  d.addEventListener("click", function (ev) {
    var add = ev.target.closest && ev.target.closest("[data-add]");
    if (add) { toggle(add.getAttribute("data-add"), add.getAttribute("data-name")); return; }
    var op = ev.target.closest && ev.target.closest("[data-list-open]");
    if (op && listDlg && listDlg.showModal) { render(); listDlg.showModal(); return; }
  });
  if (listDlg) {
    var clr = $("[data-clear]", listDlg); if (clr) clr.addEventListener("click", function () { setList([]); });
    var firm = $("[data-firm]", listDlg); if (firm) firm.addEventListener("input", function () { $("[data-send]", listDlg).setAttribute("href", mailHref()); });
  }
  addEventListener("storage", function (ev) { if (ev.key === KEY) render(); });
  render();

  /* dialogs: close button + backdrop */
  $$("dialog").forEach(function (dl) {
    dl.addEventListener("click", function (ev) {
      if (ev.target === dl || (ev.target.closest && ev.target.closest("[data-close]"))) dl.close();
    });
    var inner = $(".dlg__in", dl);
    if (inner) inner.addEventListener("click", function (ev) { if (ev.target === inner) ev.stopPropagation(); });
  });

  /* product dialog */
  var CD = json("clk-data"), cdlg = $("#clkdlg");
  if (CD && cdlg && cdlg.showModal) {
    var pImg = $("[data-pd-img]", cdlg), pH = $("[data-pd-h]", cdlg), pV = $("[data-pd-v]", cdlg);
    d.addEventListener("click", function (ev) {
      var o = ev.target.closest && ev.target.closest("[data-open]");
      if (!o) return;
      var it = CD.items[o.getAttribute("data-open")]; if (!it) return;
      pImg.src = it.src; pImg.width = it.w; pImg.height = it.hh; pImg.alt = it.h + " " + CD.ui.art + " " + it.v[0].a;
      pH.textContent = it.h; pV.innerHTML = "";
      it.v.forEach(function (v) {
        var li = d.createElement("li"), b = d.createElement("b"), s = d.createElement("span"), p = d.createElement("p"), btn = d.createElement("button");
        b.textContent = CD.ui.art + " " + v.art; s.className = "s"; s.textContent = CD.ui.size + ": " + v.size; p.textContent = v.desc;
        btn.type = "button"; btn.className = "clk__add"; btn.setAttribute("data-add", v.art); btn.setAttribute("data-name", it.h);
        btn.innerHTML = '<span data-l-off></span><span data-l-on></span>';
        btn.firstChild.textContent = "+ " + CD.ui.list_add; btn.lastChild.textContent = CD.ui.list_added;
        li.appendChild(b); if (v.size) li.appendChild(s); if (v.desc) li.appendChild(p); li.appendChild(btn); pV.appendChild(li);
      });
      render();
      cdlg.showModal();
    });
  }

  /* catalogue filters */
  var cat = $("[data-catalog]");
  if (cat) {
    var cards = $$(".clk", cat), grps = $$("[data-grp]", cat), chips = $$("[data-chip]"), tagsB = $$("[data-tag]");
    var q = $("[data-search]"), shown = $("[data-shown]"), none = $("[data-none]");
    var state = { g: "", t: {}, q: "" };
    var apply = function () {
      var n = 0, words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      cards.forEach(function (c) {
        var ok = (!state.g || c.getAttribute("data-g") === state.g);
        var tg = c.getAttribute("data-t") || "";
        Object.keys(state.t).forEach(function (k) { if (state.t[k] && tg.indexOf(k) < 0) ok = false; });
        if (ok && words.length) { var s = c.getAttribute("data-s") || ""; ok = words.every(function (w) { return s.indexOf(w) > -1; }); }
        c.hidden = !ok; if (ok) { n++; c.classList.add("is-in"); }
      });
      grps.forEach(function (g) { g.hidden = !$$(".clk", g).some(function (c) { return !c.hidden; }); });
      if (shown) shown.textContent = n;
      if (none) none.hidden = n > 0;
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { state.g = c.getAttribute("data-chip"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); apply(); }); });
    tagsB.forEach(function (c) { c.addEventListener("click", function () { var k = c.getAttribute("data-tag"); state.t[k] = !state.t[k]; c.setAttribute("aria-pressed", state.t[k] ? "true" : "false"); apply(); }); });
    if (q) q.addEventListener("input", function () { state.q = q.value; apply(); });
    /* deep link #kuckuck-quartz selects that group */
    var h = location.hash.replace("#", "");
    if (h) chips.forEach(function (c) { if (c.getAttribute("data-chip") === h) c.click(); });
  }

  /* forms -> prefilled mail */
  $$("[data-mailform]").forEach(function (f) {
    var cfg = {}; try { cfg = JSON.parse($(".form-data", f).textContent); } catch (e) { console.warn("[engstler] form cfg", e); }
    var err = $("[data-err]", f);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var bad = [];
      $$("input[required]", f).forEach(function (i) { var ok = i.value.trim() && (i.type !== "email" || /.+@.+\..+/.test(i.value)); i.setAttribute("aria-invalid", ok ? "false" : "true"); if (!ok) bad.push(i); });
      if (bad.length) { if (err) { err.textContent = cfg.missing || ""; err.hidden = false; } bad[0].focus(); return; }
      if (err) err.hidden = true;
      var lines = [], seen = {};
      $$("input,textarea", f).forEach(function (i) {
        if (!i.name || seen[i.name] && i.type === "radio") return;
        if (i.type === "radio") { var c = $("input[name='" + i.name + "']:checked", f); seen[i.name] = 1; if (c) lines.push(i.name + ": " + c.value); return; }
        if (i.value.trim()) lines.push(i.name + ": " + i.value.trim());
      });
      var l = getList();
      if (l.length) { lines.push(""); lines.push(LD.body || ""); l.forEach(function (x) { lines.push("- " + (LD.art || "") + " " + x.a + (x.n ? " (" + x.n + ")" : "")); }); }
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject || "") + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });
})();
