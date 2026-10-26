(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dock = $("[data-dock]");
  try { if (dock && sessionStorage.getItem("dg-dock") === "x") dock.hidden = true; } catch (e) {}
  if (dock) $(".dock-x", dock).addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dg-dock", "x"); } catch (e) {} });

  /* header + drawer */
  var hd = $("[data-hd]"), btn = $(".menu-btn"), drawer = $("#drawer");
  function onScroll() { if (hd) hd.classList.toggle("is-stuck", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  function setMenu(open) {
    if (!btn || !drawer) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) { drawer.style.top = Math.max(0, hd.getBoundingClientRect().bottom) + "px"; var a = $("a", drawer); if (a) a.focus(); }
  }
  if (btn && drawer) {
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) { setMenu(false); btn.focus(); } });
    window.matchMedia("(min-width:1080px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* reveal */
  var rv = $$(".rv");
  if (rv.length) {
    if (reduce || !("IntersectionObserver" in window)) rv.forEach(function (n) { n.classList.add("in"); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      rv.forEach(function (n) { io.observe(n); });
    }
  }
  $$("[data-bars]").forEach(function (n) { if (reduce || !("IntersectionObserver" in window)) n.classList.add("in"); });

  /* hero film: their own footage, only when motion is welcome and data is not scarce */
  var hero = $(".hero"), v = $(".hero-video");
  if (hero && v && !reduce) {
    var conn = navigator.connection || {}, slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    if (!slow) {
      var go = function () {
        v.src = window.innerWidth < 760 ? v.getAttribute("data-sm") : v.getAttribute("data-lg");
        v.addEventListener("playing", function () { hero.classList.add("is-playing"); });
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      };
      if (document.readyState === "complete") setTimeout(go, 300); else window.addEventListener("load", function () { setTimeout(go, 300); });
    }
  }

  /* product filter (調理方法) */
  var chipRow = $(".filter .chips"), cards = $$("#fcards .fcard");
  if (chipRow && cards.length) {
    chipRow.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", chipRow).forEach(function (c) { var on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      var cat = b.getAttribute("data-cat");
      cards.forEach(function (c) { c.hidden = !(cat === "all" || (c.getAttribute("data-cats") || "").split(" ").indexOf(cat) > -1); });
    });
  }

  /* home teaser -> finder */
  var mini = $("#mini");
  if (mini) mini.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = $("#mfood").value, q = ($("#mq").value || "").replace(/[^\d]/g, "");
    location.href = mini.getAttribute("action") + "#f=" + encodeURIComponent(f) + (q ? "&q=" + q : "");
  });

  /* ---------------------------------------------------------- finder */
  var dm = $("#dg-models"), du = $("#dg-ui");
  if (!dm || !du) return;
  var MODELS = JSON.parse(dm.textContent), UI = JSON.parse(du.textContent);
  var out = $("#fout"), q = $("#q"), w = $("#w"), sx = $("#sx"), sy = $("#sy"), foodsEl = $("#foods");
  var state = { f: "", q: "", w: "", x: "", y: "" };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString("ja-JP"); }
  function digits(s) { return String(s || "").replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); }).replace(/[^\d.]/g, ""); }
  function readHash() {
    var h = location.hash.replace(/^#/, ""), o = {};
    h.split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) o[kv[0]] = decodeURIComponent(kv[1] || ""); });
    state.f = o.f || ""; state.q = o.q || ""; state.w = o.w || ""; state.x = o.x || ""; state.y = o.y || "";
  }
  function writeHash() {
    var p = []; if (state.f) p.push("f=" + encodeURIComponent(state.f)); if (state.q) p.push("q=" + state.q); if (state.w) p.push("w=" + state.w); if (state.x) p.push("x=" + state.x); if (state.y) p.push("y=" + state.y);
    try { history.replaceState(null, "", location.pathname + (p.length ? "#" + p.join("&") : "")); } catch (e) {}
  }
  function syncInputs() {
    $$(".chip[data-food]", foodsEl).forEach(function (c) { var on = c.getAttribute("data-food") === state.f; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    if (document.activeElement !== q) q.value = state.q ? fmt(state.q) : "";
    if (document.activeElement !== w) w.value = state.w; if (document.activeElement !== sx) sx.value = state.x; if (document.activeElement !== sy) sy.value = state.y;
  }
  function maxFit(m, X, Y) {
    var w = m.d[0], l = m.d[1], a = Math.floor(X / w) * Math.floor(Y / l), b = Math.floor(X / l) * Math.floor(Y / w);
    return b > a ? { k: b, rot: true } : { k: a, rot: false };
  }
  function svg(m, X, Y, n) {
    if (!m.d) return "";
    var mw = m.d[0], ml = m.d[1], rw = mw, rl = ml, W0, L0, grid = "", floor = "", cap, rects = "";
    if (X && Y) {
      var f = maxFit(m, X, Y); if (f.rot) { rw = ml; rl = mw; }
      W0 = Math.max(X, rw); L0 = Math.max(Y, rl); cap = UI.fp_floor;
      floor = '<rect x="0" y="0" width="' + X + '" height="' + Y + '" class="fp-floor"/>';
      var cols = Math.max(1, Math.floor(X / rw)), cnt = Math.min(n || 1, f.k || 1);
      for (var u = 0; u < cnt; u++) rects += '<rect x="' + (u % cols) * rw + '" y="' + Math.floor(u / cols) * rl + '" width="' + rw + '" height="' + rl + '" class="fp-r"/>';
    } else {
      W0 = Math.max(4000, mw); L0 = Math.max(4000, ml); cap = UI.fp_grid;
      for (var gx = 1000; gx < W0; gx += 1000) grid += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + L0 + '" class="g"/>';
      for (var gy = 1000; gy < L0; gy += 1000) grid += '<line x1="0" y1="' + gy + '" x2="' + W0 + '" y2="' + gy + '" class="g"/>';
      rects = '<rect x="0" y="0" width="' + rw + '" height="' + rl + '" class="fp-r"/>';
    }
    var pad = Math.max(W0, L0) * 0.03;
    return '<svg viewBox="' + (-pad) + " " + (-pad) + " " + (W0 + pad * 2) + " " + (L0 + pad * 2) + '" role="img" aria-label="' + esc(m.code + " " + mw + "×" + ml + "mm") + '"><rect x="0" y="0" width="' + W0 + '" height="' + L0 + '" class="fp-bg"/>' + grid + floor + rects + '</svg><p class="fp-cap">' + esc(cap) + "</p>";
  }
  function mailto(subject, body) { return "mailto:" + UI.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }
  function condText() {
    var L = UI.labels, lines = [L.food + "：" + (UI.food_names[state.f] || state.f), L.target + "：" + fmt(state.q) + "/時間"];
    if (state.w) lines.push(L.weight + "：" + state.w + "g");
    if (state.x && state.y) lines.push(UI.space_label + "：" + fmt(state.x) + " × " + fmt(state.y) + " mm");
    return lines;
  }
  function evaluate() {
    var T = Number(state.q), W = Number(state.w) || 0, X = Number(state.x) || 0, Y = Number(state.y) || 0, good = [], bad = [];
    MODELS.forEach(function (m) {
      if (m.foods.indexOf(state.f) < 0) return;
      var n = Math.ceil(T / m.cmax), margin = Math.round((n * m.cmax - T) / T * 100), why = [], wState = null, fits = null;
      if (W && m.wmax != null) { wState = W >= m.wmin && W <= m.wmax; if (!wState) why.push(UI.weight_ng.replace("{a}", m.wmin).replace("{b}", m.wmax)); }
      if (X && Y && m.d) { var ft = maxFit(m, X, Y); fits = ft.k >= n; if (!fits) why.push(ft.k < 1 ? UI.too_big + "（" + fmt(m.d[0]) + " × " + fmt(m.d[1]) + " mm）" : UI.no_fit_n.replace("{n}", n).replace("{k}", ft.k)); }
      var r = { m: m, n: n, margin: margin, wState: wState, fits: fits, why: why };
      (why.length ? bad : good).push(r);
    });
    good.sort(function (a, b) { return a.n - b.n || a.m.cmax - b.m.cmax || ((a.m.d ? a.m.d[0] * a.m.d[1] : 0) - (b.m.d ? b.m.d[0] * b.m.d[1] : 0)); });
    return { good: good, bad: bad };
  }
  function card(r, i, X, Y) {
    var m = r.m, b = [];
    if (i === 0) b.push('<span class="badge badge-r">' + (r.n === 1 ? UI.cover : UI.multi.replace("{n}", r.n)) + "</span>");
    else b.push('<span class="badge">' + (r.n === 1 ? UI.cover : UI.multi.replace("{n}", r.n)) + "</span>");
    if (r.n === 1 && r.margin > 0) b.push('<span class="badge badge-g">' + UI.margin.replace("{p}", r.margin) + "</span>");
    if (r.fits) b.push('<span class="badge badge-g">' + (r.n > 1 ? UI.fits_n.replace("{n}", r.n) : UI.fits) + "</span>");
    var facts = ["<span>" + UI.capacity.replace("{c}", "<strong>" + esc(m.ct) + "</strong>") + "</span>"];
    if (r.n > 1) facts.push("<span>" + esc(UI.short_by.replace("{c}", fmt(m.cmax) + m.unit + "/時間")) + "</span>");
    if (r.wState === true) facts.push("<span>" + esc(UI.weight_ok.replace("{a}", m.wmin).replace("{b}", m.wmax)) + "</span>");
    else if (m.wmax == null && state.w) facts.push("<span>" + UI.weight_unknown + "</span>");
    if (m.d) facts.push("<span>" + esc(UI.footprint.replace("{w}", fmt(m.d[0])).replace("{l}", fmt(m.d[1])).replace("{h}", fmt(m.d[2]))) + "</span>");
    if (m.kw != null) facts.push("<span>" + esc(UI.power.replace("{kw}", m.kw)) + "</span>");
    var subj = UI.mail_subject.replace("{what}", m.name), body = UI.mail_intro + "\n" + condText().join("\n") + "\n\n" + UI.labels.model + "：" + m.name + "\n" + UI.labels.count + "：" + r.n + UI.units + "\n" + UI.mail_foot;
    return '<article class="rcard' + (i === 0 ? " is-first" : "") + '"><div class="rimg"><img src="' + esc(m.img) + '" width="' + m.iw + '" height="' + m.ih + '" alt="' + esc(m.name) + '" loading="lazy"></div><div><div class="rtop">' + b.join("") + "</div><h3>" + esc(m.name) + "</h3>" +
      '<div class="rfacts">' + facts.join("") + "</div>" + (m.d ? '<div class="rfp">' + svg(m, X, Y, r.n) + "</div>" : "") +
      '<div class="ract"><a class="btn btn-red" href="' + mailto(subj, body) + '">' + UI.ask_one + '</a><a class="btn btn-ghost-l" href="' + esc(m.url) + '">' + UI.open_model + "</a></div></div></article>";
  }
  function render() {
    var T = Number(state.q);
    if (!state.f || !T) { out.innerHTML = '<div class="fprompt"><p>' + esc(UI.prompt) + "</p></div>"; return; }
    var X = Number(state.x) || 0, Y = Number(state.y) || 0, ev = evaluate(), h = "";
    var foodLabel = UI.food_names[state.f] || state.f;
    if (!ev.good.length) {
      h += '<div class="card"><h2>' + esc(UI.none_head) + "</h2><p>" + esc(UI.none_text) + '</p><p class="more"><a class="btn btn-red btn-lg" href="' + esc(UI.custom) + '">' + esc("特注機のご相談") + "</a></p></div>";
    } else {
      h += '<div class="rhead"><h2>' + esc(UI.result_head) + '</h2><p class="rsum">' + esc(foodLabel) + "　" + fmt(T) + "/時間" + (state.w ? "　" + esc(state.w) + "g" : "") + (X && Y ? "　" + fmt(X) + "×" + fmt(Y) + "mm" : "") + "</p></div>";
      ev.good.forEach(function (r, i) { h += card(r, i, X, Y); });
      var body = UI.mail_intro + "\n" + condText().join("\n") + "\n\n" + UI.labels.model + "：" + ev.good.slice(0, 3).map(function (r) { return r.m.name + "（" + r.n + UI.units + "）"; }).join("、") + "\n" + UI.mail_foot;
      h += '<p class="rall"><a class="btn btn-red btn-lg" href="' + mailto(UI.mail_subject.replace("{what}", foodLabel + " " + fmt(T) + "/時間"), body) + '">' + UI.ask_all + "</a></p>";
    }
    if (ev.bad.length) {
      h += '<details class="rexc"><summary>' + esc(UI.excluded_head) + "（" + ev.bad.length + "）</summary><ul>" + ev.bad.map(function (r) { return '<li><a href="' + esc(r.m.url) + '">' + esc(r.m.name) + "</a><br>" + esc(r.why.join(" / ")) + "</li>"; }).join("") + "</ul></details>";
    }
    out.innerHTML = h;
  }
  function update(fromInput) { writeHash(); if (!fromInput) syncInputs(); else $$(".chip[data-food]", foodsEl).forEach(function (c) { var on = c.getAttribute("data-food") === state.f; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); }); render(); }
  foodsEl.addEventListener("click", function (e) { var b = e.target.closest(".chip[data-food]"); if (!b) return; state.f = b.getAttribute("data-food"); update(false); if (!state.q) q.focus(); });
  $("#presets").addEventListener("click", function (e) { var b = e.target.closest("[data-preset]"); if (!b) return; state.q = b.getAttribute("data-preset"); update(false); });
  q.addEventListener("input", function () { state.q = digits(q.value).split(".")[0]; update(true); });
  q.addEventListener("blur", function () { syncInputs(); });
  w.addEventListener("input", function () { state.w = digits(w.value); update(true); });
  sx.addEventListener("input", function () { state.x = digits(sx.value).split(".")[0]; update(true); });
  sy.addEventListener("input", function () { state.y = digits(sy.value).split(".")[0]; update(true); });
  window.addEventListener("hashchange", function () { readHash(); syncInputs(); render(); });
  readHash(); syncInputs(); render();
})();
