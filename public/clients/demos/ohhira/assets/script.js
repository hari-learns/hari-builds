(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dock = $("[data-dock]");
  try { if (dock && sessionStorage.getItem("oh-dock") === "x") dock.hidden = true; } catch (e) {}
  if (dock) $(".dock-x", dock).addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("oh-dock", "x"); } catch (e) {} });

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
    window.matchMedia("(min-width:1100px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* reveal */
  var rv = $$(".rv");
  if (rv.length) {
    if (reduce || !("IntersectionObserver" in window)) rv.forEach(function (n) { n.classList.add("in"); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
      rv.forEach(function (n) { io.observe(n); });
      var sweep = function () { var vh = window.innerHeight; rv.forEach(function (n) { if (!n.classList.contains("in") && n.getBoundingClientRect().top < vh * 0.96) n.classList.add("in"); }); };
      window.addEventListener("scroll", sweep, { passive: true }); window.addEventListener("pageshow", sweep); window.addEventListener("load", sweep); sweep();
    }
  }

  /* counters on their real numbers (years are not animated) */
  var counters = $$("[data-count]");
  function runCount(el) {
    var n = parseFloat(el.getAttribute("data-count").replace(/,/g, "")); if (!(n > 0) || n >= 1000) return;
    var node = el.firstChild; if (!node || node.nodeType !== 3) return;
    var t0 = null, dur = 1400;
    function step(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - k, 3))); node.nodeValue = String(v); if (k < 1) requestAnimationFrame(step); else node.nodeValue = String(n); }
    node.nodeValue = "0"; requestAnimationFrame(step);
  }
  if (counters.length && !reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } }); }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* timeline progress line */
  var tls = $$("[data-tl]");
  if (tls.length) {
    var tick = function () {
      var vh = window.innerHeight;
      tls.forEach(function (t) { var r = t.getBoundingClientRect(), p = (vh * 0.6 - r.top) / r.height; t.style.setProperty("--p", reduce ? 1 : Math.max(0, Math.min(1, p)).toFixed(3)); });
    };
    window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick); tick();
  }

  /* hero film: their own footage, only when motion is welcome and data is not scarce */
  var hero = $(".hero"), v = $(".hero-video");
  if (hero && v && !reduce) {
    var conn = navigator.connection || {}, slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    if (!slow) {
      var go = function () {
        v.addEventListener("loadedmetadata", function () { var t = parseFloat(v.getAttribute("data-t") || "0"); try { if (t && v.duration > t) v.currentTime = t; } catch (e) {} });
        v.addEventListener("playing", function () { hero.classList.add("is-playing"); });
        v.src = window.innerWidth < 760 ? v.getAttribute("data-sm") : v.getAttribute("data-lg");
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      };
      if (document.readyState === "complete") setTimeout(go, 300); else window.addEventListener("load", function () { setTimeout(go, 300); });
    }
  }

  /* product filter */
  var chipRow = $(".filter .chips"), cards = $$("#pgrid .pcard");
  if (chipRow && cards.length) {
    chipRow.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", chipRow).forEach(function (c) { var on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      var cat = b.getAttribute("data-cat");
      cards.forEach(function (c) { c.hidden = !(cat === "all" || c.getAttribute("data-cat") === cat); });
    });
  }

  /* ---------------------------------------------------------- parts check (signature tool) */
  var dataEl = $("#chk-data"); if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent), T = D.ui, Z = D.zones;
  var el = { od: $("#od"), len: $("#len"), hole: $("#hole"), qty: $("#qty"), shapes: $("#shapes"), mats: $("#mats"), res: $("#chk-res"), svg: $("#map-svg"), key: $("#refkey"), go: $("#chk-go") };
  var state = { od: "", len: "", hole: "", mat: "", shape: "", qty: "" };
  var nf = function (n) { return String(Math.round(n * 100) / 100); };
  function num(s) { s = String(s || "").replace(/[０-９．]/g, function (c) { return c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 65248); }).replace(/,/g, "").replace(/[^\d.]/g, ""); var n = parseFloat(s); return isFinite(n) && n > 0 ? n : 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function tpl(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
  function readHash() {
    var o = {}; location.hash.replace(/^#/, "").split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) o[kv[0]] = decodeURIComponent(kv[1] || ""); });
    ["od", "len", "hole", "mat", "shape", "qty"].forEach(function (k) { if (o[k] !== undefined) state[k] = o[k]; });
  }
  function writeHash() {
    var p = []; ["od", "len", "hole", "mat", "shape", "qty"].forEach(function (k) { if (state[k]) p.push(k + "=" + encodeURIComponent(state[k])); });
    try { history.replaceState(null, "", location.pathname + (p.length ? "#" + p.join("&") : "")); } catch (e) {}
  }
  function syncInputs() {
    ["od", "len", "hole", "qty"].forEach(function (k) { if (el[k] && document.activeElement !== el[k]) el[k].value = state[k]; });
    [["shapes", "shape"], ["mats", "mat"]].forEach(function (pair) {
      if (!el[pair[0]]) return;
      $$(".chip", el[pair[0]]).forEach(function (c) { var on = c.getAttribute("data-" + pair[1]) === state[pair[1]]; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    });
  }

  /* published capability range -> verdicts */
  function evalPress(od, len) {
    var z = Z.press, L = [], s;
    if (od >= z.od[0] && od <= z.od[1]) { s = "best"; L.push(tpl(T.p_best, { od: nf(od) })); if (len) { if (len <= z.len) L.push(tpl(T.p_best_len, { len: nf(len) })); else { s = "ask"; L.push(tpl(T.p_len_over, { len: nf(len) })); } } }
    else if (od >= 0.82 && od < z.od[0]) { s = "ok"; L.push(tpl(T.p_thin, { od: nf(od) })); }
    else if (od > z.od[1] && od <= 7) { s = "ok"; L.push(tpl(T.p_flange, { od: nf(od) })); }
    else { s = "ask"; L.push(tpl(T.p_ask, { od: nf(od) })); }
    return { k: "press", s: s, lines: L };
  }
  function evalCut(od, hole) {
    var z = Z.cut, L = [], s;
    if (od >= z.od[0] && od <= z.od[1]) { s = "best"; L.push(tpl(T.c_best, { od: nf(od) })); }
    else if (od > z.od[1] && od <= z.max) { s = "ok"; L.push(tpl(T.c_big, { od: nf(od) })); }
    else if (od < z.od[0]) { s = "ask"; L.push(tpl(T.c_small, { od: nf(od) })); }
    else { s = "ask"; L.push(tpl(T.c_ask, { od: nf(od) })); }
    if (hole) L.push(tpl(hole < z.hole ? T.c_hole : T.c_hole_ok, { hole: nf(hole) }));
    if (len && len / od > 10) L.push(tpl(T.c_slender, { r: nf(len / od) }));
    return { k: "cut", s: s, lines: L };
  }
  var rank = { best: 0, ok: 1, ask: 2 };
  var stLabel = { best: "s_best", ok: "s_ok", ask: "s_ask" };

  /* map */
  var X0 = 48, X1 = 300, Y0 = 34, Y1 = 262, XM = 18, YM = 40, VW = 320, VH = 310;
  function px(mm) { return X0 + (X1 - X0) * Math.min(mm, XM) / XM; }
  function py(mm) { return Y1 - (Y1 - Y0) * Math.min(mm, YM) / YM; }
  var circ = [];
  function drawMap(od, len) {
    if (!el.svg) return;
    var cw = el.svg.parentNode.clientWidth; VW = Math.max(280, Math.min(560, (cw || 332) - 24)); VH = Math.round(VW * 0.9); X0 = 50; X1 = VW - 18; Y0 = 36; Y1 = VH - 50;
    el.svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
    var s = '<rect class="m-bg" x="0" y="0" width="' + VW + '" height="' + VH + '"/>', i, v;
    for (v = 0; v <= 16; v += 4) s += '<line class="m-grid" x1="' + px(v) + '" y1="' + Y0 + '" x2="' + px(v) + '" y2="' + Y1 + '"/><text class="m-tick" x="' + px(v) + '" y="' + (Y1 + 20) + '" text-anchor="middle">' + v + "</text>";
    for (v = 0; v <= 40; v += 10) s += '<line class="m-grid" x1="' + X0 + '" y1="' + py(v) + '" x2="' + X1 + '" y2="' + py(v) + '"/><text class="m-tick" x="' + (X0 - 6) + '" y="' + (py(v) + 5) + '" text-anchor="end">' + v + "</text>";
    s += '<rect class="m-cut2" x="' + px(Z.cut.od[1]) + '" y="' + Y0 + '" width="' + (px(Z.cut.max) - px(Z.cut.od[1])) + '" height="' + (Y1 - Y0) + '"/>';
    s += '<rect class="m-cut" x="' + px(Z.cut.od[0]) + '" y="' + Y0 + '" width="' + (px(Z.cut.od[1]) - px(Z.cut.od[0])) + '" height="' + (Y1 - Y0) + '"/>';
    s += '<rect class="m-press" x="' + px(Z.press.od[0]) + '" y="' + py(Z.press.len) + '" width="' + (px(Z.press.od[1]) - px(Z.press.od[0])) + '" height="' + (Y1 - py(Z.press.len)) + '"/>';
    s += '<line class="m-axis" x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 + '"/><line class="m-axis" x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + Y1 + '"/>';
    s += '<text class="m-lab" x="' + X1 + '" y="' + (Y1 + 40) + '" text-anchor="end">' + esc(T.axis_od) + '</text><text class="m-lab" x="' + (X0 + 6) + '" y="' + (Y0 - 12) + '">' + esc(T.axis_len) + "</text>";
    D.refs.forEach(function (r, k) { s += '<circle class="m-ref" cx="' + px(r.od) + '" cy="' + py(r.len) + '" r="9"/><text class="m-reft" x="' + px(r.od) + '" y="' + (py(r.len) + 4) + '">' + (k + 1) + "</text>"; });
    if (od) {
      var x = px(od);
      if (len) {
        var y = py(len), lab = "φ" + nf(od) + " × " + nf(len), right = x < VW * 0.55;
        s += '<line class="m-youl" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + Y1 + '"/><line class="m-youl" x1="' + X0 + '" y1="' + y + '" x2="' + x + '" y2="' + y + '"/>';
        s += '<rect class="m-you" x="' + (x - 8) + '" y="' + (y - 8) + '" width="16" height="16" transform="rotate(45 ' + x + " " + y + ')"/>';
        s += '<text class="m-yout" x="' + (right ? Math.min(x + 14, VW - 110) : x - 14) + '" y="' + (Math.max(y - 12, Y0 + 30)) + '" text-anchor="' + (right ? "start" : "end") + '">' + esc(lab) + "</text>";
      } else {
        s += '<line class="m-youl" x1="' + x + '" y1="' + Y0 + '" x2="' + x + '" y2="' + Y1 + '" style="stroke-width:2"/><text class="m-yout" x="' + Math.min(x + 6, VW - 70) + '" y="' + (Y0 + 44) + '">φ' + nf(od) + "</text>";
      }
    }
    el.svg.innerHTML = s;
    if (el.key && !el.key.getAttribute("data-done")) {
      el.key.innerHTML = D.refs.map(function (r, k) { return "<li><b>" + (k + 1) + "</b><a href=\"" + r.url + "\">" + esc(r.name) + "</a><span>φ" + nf(r.od) + " × " + nf(r.len) + " mm" + (r.slug === "temp-sensor-case-press" ? " · " + esc(T.flange_note) : "") + "</span></li>"; }).join("");
      el.key.setAttribute("data-done", "1");
    }
  }

  function render() {
    var od = num(state.od), len = num(state.len), hole = num(state.hole), qty = num(state.qty);
    drawMap(od, len);
    if (el.go) el.go.setAttribute("href", el.go.getAttribute("data-base") + (od ? "#od=" + encodeURIComponent(state.od) + (state.len ? "&len=" + encodeURIComponent(state.len) : "") : ""));
    if (!od) { el.res.innerHTML = '<p class="chk-empty">' + esc(T.empty) + "</p>"; return; }
    var P = evalPress(od, len), C = evalCut(od, hole), list = [P, C];
    var pref = state.shape === "bar" ? "cut" : "press";
    list.sort(function (a, b) { return rank[a.s] - rank[b.s] || (a.k === pref ? -1 : 1); });
    var vt = P.s === "best" && C.s === "best" ? T.v_both : P.s === "best" ? T.v_press : C.s === "best" ? T.v_cut : (P.s === "ok" || C.s === "ok") ? T.v_near : T.v_out;
    var out = '<p class="res-v' + (vt === T.v_out ? " is-out" : "") + '">' + esc(vt) + "</p>";
    list.forEach(function (r) { out += '<section class="res-p"><h3>' + esc(T[r.k]) + ' <span class="st st-' + r.s + '">' + esc(T[stLabel[r.s]]) + "</span></h3><ul>" + r.lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></section>"; });
    if (state.mat) out += '<p class="res-m">' + esc(T["m_" + state.mat] || "") + "</p>";
    // quantity guide
    var best = list[0], q = "";
    if (qty && best.s !== "ask") {
      var cap = best.k === "press" ? D.caps.press.v : D.caps.cut.v, refs = best.k === "press" ? T.q_refs_press : T.q_refs_cut, qs = qty.toLocaleString(D.lang === "ja" ? "ja-JP" : "en-US");
      q = '<p class="res-m res-qty"><b>' + esc(T.qty_h) + "</b><br>" + esc(tpl(qty <= cap ? T.q_ok : T.q_over, { q: qs, ref: refs })) + "</p>";
    }
    out += q;
    // nearest reference parts
    var near = D.refs.map(function (r) { var dl = len ? (len - r.len) / 20 : 0; return { r: r, d: Math.hypot((od - r.od) / 6, dl) }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
    out += '<div class="res-near"><h3>' + esc(T.near_h) + "</h3><p>" + esc(T.near_note) + '</p><div class="near">' + near.map(function (n) {
      return '<a href="' + n.r.url + '"><img src="' + n.r.img + '" width="' + n.r.iw + '" height="' + n.r.ih + '" alt="' + esc(n.r.name) + '" loading="lazy" decoding="async"><span><strong>' + esc(n.r.name) + "</strong><span>φ" + nf(n.r.od) + " × " + nf(n.r.len) + " mm" + (n.r.note ? "（" + esc(n.r.note) + "）" : "") + "</span></span></a>"; }).join("") + "</div></div>";
    // mail
    var matL = state.mat ? T.mats[state.mat] : "", shapeL = state.shape ? T.shapes[state.shape] : "";
    var subject = tpl(T.mail_subject, { od: nf(od), len_s: len ? "×" + nf(len) + "mm" : "", mat: matL }).replace(/\s+$/, "");
    var body = T.mail_greet + tpl(T.mail_od, { od: nf(od) }) + "\n" + (len ? tpl(T.mail_len, { len: nf(len) }) + "\n" : "") + (hole ? tpl(T.mail_hole, { hole: nf(hole) }) + "\n" : "") + (matL ? tpl(T.mail_mat, { mat: matL }) + "\n" : "") +
      (shapeL ? tpl(T.mail_shape, { shape: shapeL }) + "\n" : "") + (qty ? tpl(T.mail_qty, { q: qty.toLocaleString(D.lang === "ja" ? "ja-JP" : "en-US") }) + "\n" : "") + T.mail_res +
      list.map(function (r) { return "・" + T[r.k] + "：" + T[stLabel[r.s]]; }).join("\n") + "\n" + T.mail_foot;
    out += '<div class="res-act"><a class="btn btn-red btn-lg" href="mailto:' + D.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body) + '">' + esc(T.ask_btn) + '</a><a class="btn btn-ghost-l btn-lg" href="' + D.telhref + '">' + esc(T.call_btn) + " " + D.tel + '</a><a class="btn btn-ghost-l" href="' + D.form + '" target="_blank" rel="noopener">' + esc(T.form_btn) + '</a><p class="res-note">' + esc(T.form_note) + "</p></div>";
    out += '<p class="res-note">' + esc(T.foot) + "</p>";
    el.res.innerHTML = out;
  }

  function update(write) { syncInputs(); render(); if (write && el.shapes) writeHash(); }
  if (el.go) el.go.setAttribute("data-base", el.go.getAttribute("href"));
  ["od", "len", "hole", "qty"].forEach(function (k) { if (el[k]) el[k].addEventListener("input", function () { state[k] = el[k].value.replace(/[^\d.０-９．,]/g, ""); update(true); }); });
  [["shapes", "shape"], ["mats", "mat"]].forEach(function (pair) {
    if (!el[pair[0]]) return;
    el[pair[0]].addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; var val = b.getAttribute("data-" + pair[1]); state[pair[1]] = state[pair[1]] === val ? "" : val; update(true); });
  });
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(render, 120); });
  if (el.shapes) { readHash(); window.addEventListener("hashchange", function () { readHash(); update(false); }); }
  var more = $("#chk-more"); if (more && (window.innerWidth >= 980 || state.mat || state.shape || state.qty)) more.open = true;
  update(false);
})();
