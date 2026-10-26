(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dock = $("[data-dock]");
  try { if (dock && sessionStorage.getItem("dns-dock") === "x") dock.hidden = true; } catch (e) {}
  if (dock) $(".dock-x", dock).addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dns-dock", "x"); } catch (e) {} });

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
    window.matchMedia("(min-width:1180px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* reveal */
  var rv = $$(".rv, [data-bars]");
  if (rv.length) {
    if (reduce || !("IntersectionObserver" in window)) rv.forEach(function (n) { n.classList.add("in"); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      rv.forEach(function (n) { io.observe(n); });
    }
  }

  /* click events for the visit counter (GoatCounter loads separately) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-gc]"); if (!a) return;
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "demo/dainihon-seimitsu/" + a.getAttribute("data-gc"), title: a.getAttribute("data-gc"), event: true }); } catch (x) {}
  });

  /* simple chip filters: products + news */
  function chipFilter(rowSel, items, attr) {
    var row = $(rowSel); if (!row) return;
    row.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", row).forEach(function (c) { var on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      var v = b.getAttribute(attr);
      items.forEach(function (it) { it.hidden = !(v === "all" || (it.getAttribute(it._a) || "").split(" ").indexOf(v) > -1); });
    });
  }
  var pf = $$("#pfg .pf"), cat = "all", res = "all";
  function applyP() { pf.forEach(function (it) { var okc = cat === "all" || it.getAttribute("data-cat") === cat; var okr = res === "all" || (it.getAttribute("data-res") || "").split(" ").indexOf(res) > -1; it.hidden = !(okc && okr); }); }
  [["#pchips", "data-cat", function (v) { cat = v; }], ["#rchips", "data-res", function (v) { res = v; }]].forEach(function (c) {
    var row = $(c[0]); if (!row) return;
    row.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", row).forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      c[2](b.getAttribute(c[1])); applyP();
    });
  });
  var ni = $$("#nitems .ni"); ni.forEach(function (n) { n._a = "data-g"; }); chipFilter("#nchips", ni, "data-g");

  /* home teaser -> finder */
  var mini = $("#mini");
  if (mini) mini.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = []; var r = $("#m-r").value, m = $("#m-m").value, t = $("#m-t").value;
    if (r) p.push("r=" + encodeURIComponent(r)); if (m) p.push("m=" + m); if (t) p.push("t=" + t);
    location.href = mini.getAttribute("action") + (p.length ? "#" + p.join("&") : "");
  });

  /* contact form -> mail */
  var cf = $("#cform"), cd = $("#dns-contact");
  if (cf && cd) {
    var C = JSON.parse(cd.textContent);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (i) { return ($("#" + i).value || "").trim(); };
      var body = "大日本精密有限会社 ご担当者様\n\n【会社名】" + v("c-co") + "\n【お名前】" + v("c-nm") + "\n【電話番号】" + v("c-tel") + "\n【ご相談内容】" + v("c-k") + "\n\n" + v("c-m") + "\n";
      location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(C.subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------------------------------------------------------- finder (signature tool) */
  var dd = $("#dns-data"); if (!dd) return;
  var D = JSON.parse(dd.textContent), T = D.T, out = $("#f-out");
  var S = { r: "", m: "", t: "", p: [], k: "", d: [] };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function digits(s) { return String(s || "").replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); }).replace(/[^\d]/g, ""); }
  function readHash() {
    var o = {}; location.hash.replace(/^#/, "").split("&").forEach(function (p) { var kv = p.split("="); if (kv[0]) o[kv[0]] = decodeURIComponent(kv[1] || ""); });
    S.r = o.r || ""; S.m = o.m || ""; S.t = digits(o.t); S.k = o.k || ""; S.p = o.p ? o.p.split(",") : []; S.d = o.d ? o.d.split(",") : [];
  }
  function writeHash() {
    var p = []; if (S.r) p.push("r=" + encodeURIComponent(S.r)); if (S.m) p.push("m=" + S.m); if (S.t) p.push("t=" + S.t); if (S.p.length) p.push("p=" + S.p.join(",")); if (S.k) p.push("k=" + S.k); if (S.d.length) p.push("d=" + encodeURIComponent(S.d.join(",")));
    try { history.replaceState(null, "", location.pathname + (p.length ? "#" + p.join("&") : "")); } catch (e) {}
  }
  function resinInfo(k) { for (var i = 0; i < D.resins.length; i++) if (D.resins[i].k === k) return D.resins[i]; return null; }
  function syncUI() {
    $$("#f-r .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-r") === S.r ? "true" : "false"); });
    $$("#f-m .opt").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-m") === S.m ? "true" : "false"); });
    $$("#f-k .opt").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-k") === S.k ? "true" : "false"); });
    $$("#f-tp .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-t") === S.t ? "true" : "false"); });
    $$("#f-d .chip").forEach(function (b) { b.setAttribute("aria-pressed", S.d.indexOf(b.getAttribute("data-d")) > -1 ? "true" : "false"); });
    $$("#f-p input").forEach(function (i) { i.checked = S.p.indexOf(i.getAttribute("data-p")) > -1; });
    var t = $("#f-t"); if (t && document.activeElement !== t) t.value = S.t;
  }
  function machineList() {
    var req = S.t ? parseInt(S.t, 10) : 0, ms = D.machines.filter(function (m) { return (!req || m.t >= req) && (S.m !== "insert" || m.k === "V"); });
    return { req: req, ms: ms, k: ms.reduce(function (a, m) { return a + m.n; }, 0) };
  }
  function render() {
    var any = S.r || S.m || S.t || S.p.length || S.k || S.d.length;
    if (!any) { out.innerHTML = '<p class="fout-empty">' + esc(T.none_yet) + "</p>"; return; }
    var h = "", L = machineList(), ri = resinInfo(S.r);
    var cond = [];
    if (S.r) cond.push(T.l_resin + "：" + (ri ? ri.l : S.r));
    if (S.m) cond.push(T.l_method + "：" + D.methods[S.m]);
    cond.push(T.l_force + "：" + (S.t ? fmt(T.t_over, { t: S.t }) : T.t_none));
    h += '<p class="fo-cond">' + esc(cond.join(" ／ ")) + "</p>";
    /* machines */
    var vs = L.ms.filter(function (m) { return m.k === "V"; }).reduce(function (a, m) { return a + m.n; }, 0);
    h += '<div class="fo-b"><h3>' + esc(T.m_h) + "<em>" + L.k + esc(T.m_unit) + " / " + D.total + esc(T.m_unit) + "</em></h3>";
    if (!L.k) h += "<p>" + esc(T.m_none) + "</p>";
    else {
      h += "<p>" + esc(S.m === "insert" ? fmt(T.m_vcount, { k: L.k }) : fmt(T.m_all, { total: D.total, k: L.k })) + "</p>";
      if (!L.req) h += "<p>" + esc(T.m_force_empty) + "</p>";
      var by = {}; L.ms.forEach(function (m) { (by[m.t] = by[m.t] || []).push(m); });
      var ts = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
      h += '<ul class="fo-m">';
      ts.forEach(function (t, i) {
        var best = L.req && i === 0;
        var parts = by[t].map(function (m) { return (m.k === "V" ? T.m_vert : T.m_horiz) + " " + m.mk + (m.dr ? "（" + m.dr + "）" : "") + " " + m.n + T.m_unit; }).join("、");
        h += '<li class="' + (best ? "best" : "") + '"><strong>' + t + "t</strong><span>" + (best ? esc(T.m_best) + "：" : "") + esc(parts) + "</span></li>";
      });
      h += "</ul>";
    }
    if (S.m === "insert") h += "<p>" + esc(fmt(T.m_insert, { n: D.machines.filter(function (m) { return m.k === "V"; }).reduce(function (a, m) { return a + m.n; }, 0) })) + "</p>";
    h += "</div>";
    /* material */
    h += '<div class="fo-b"><h3>' + esc(T.r_h) + "</h3>";
    if (!S.r) h += "<p>" + esc(T.r_pick) + "</p>";
    else if (S.r === "other") h += "<p>" + esc(T.r_other) + "</p>";
    else {
      var std = D.std.indexOf(S.r) > -1, sup = D.super.indexOf(S.r) > -1;
      if (std) h += "<p>" + esc(fmt(T.r_std, { r: S.r })) + "</p>";
      if (sup) h += "<p>" + esc(fmt(T.r_super, { r: S.r })) + "</p>";
      if (!std && !sup) h += "<p>" + esc(fmt(T.r_ex, { r: S.r })) + "</p>";
    }
    h += "</div>";
    /* post */
    if (S.p.length) { h += '<div class="fo-b"><h3>' + esc(T.p_h) + "</h3>"; S.p.forEach(function (p) { h += "<p><strong>" + esc(D.posts[p]) + "</strong><br>" + esc(T["p_" + p]) + "</p>"; }); h += "</div>"; }
    /* mold */
    if (S.k) h += '<div class="fo-b"><h3>' + esc(T.k_h) + "</h3><p>" + esc(T["k_" + S.k]) + "</p></div>";
    /* data */
    if (S.d.length) {
      h += '<div class="fo-b"><h3>' + esc(T.d_h) + "</h3>";
      S.d.forEach(function (f) {
        if (f === "紙の図面のみ") h += "<p>" + esc(T.d_paper) + "</p>";
        else if (f === "その他") h += "<p>" + esc(T.d_other) + "</p>";
        else h += "<p>" + esc(fmt(T.d_ok, { f: f })) + "</p>";
      });
      h += "</div>";
    }
    /* quality */
    h += '<div class="fo-b"><h3>' + esc(T.q_h) + "</h3><p>" + esc(T.q_text) + "</p></div>";
    /* examples */
    if (S.r && S.r !== "other") {
      var ex = D.products.filter(function (p) { return p.r.indexOf(S.r) > -1; }).slice(0, 4);
      h += '<div class="fo-b"><h3>' + esc(T.e_h) + "</h3>";
      if (!ex.length) h += "<p>" + esc(T.e_none) + "</p>";
      else {
        h += '<div class="fo-ex">' + ex.map(function (p) { return '<figure><img src="' + p.img + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc("製品例 " + p.label) + '" loading="lazy"><figcaption>' + esc(p.label) + "</figcaption></figure>"; }).join("") + "</div>";
        if (D.resin_pages[S.r]) h += '<p><a class="lnk" href="' + D.resin_pages[S.r] + '">' + esc(fmt(T.e_more, { r: S.r })) + "</a></p>";
      }
      h += "</div>";
    }
    /* next */
    h += '<div class="fo-b"><h3>' + esc(T.n_h) + "</h3><p>" + esc(T.n_text) + "</p></div>";
    /* mail */
    var lines = [T.mail_intro, ""];
    if (S.r) lines.push("【" + T.l_resin + "】" + (ri ? ri.l : S.r));
    if (S.m) lines.push("【" + T.l_method + "】" + D.methods[S.m]);
    lines.push("【" + T.l_force + "】" + (S.t ? fmt(T.t_over, { t: S.t }) : T.t_none));
    if (S.p.length) lines.push("【" + T.l_post + "】" + S.p.map(function (p) { return D.posts[p]; }).join("、"));
    if (S.k) lines.push("【" + T.l_mold + "】" + D.molds[S.k]);
    if (S.d.length) lines.push("【" + T.l_data + "】" + S.d.join("、"));
    lines.push("【" + T.l_machines + "】" + L.k + "/" + D.total + T.m_unit);
    lines.push(""); lines.push(T.mail_outro);
    var href = "mailto:" + D.email + "?subject=" + encodeURIComponent(T.mail_subject) + "&body=" + encodeURIComponent(lines.join("\n"));
    h += '<div class="fo-act"><a class="btn btn-red btn-lg" href="' + href + '" data-gc="email">' + esc(T.cta) + '</a><a class="btn btn-dark btn-lg" href="' + D.tel_href + '" data-gc="call">' + esc(T.cta_tel) + " " + esc(D.tel) + '</a><p class="cap">' + esc(T.cta_note) + "</p></div>";
    out.innerHTML = h;
  }
  var sum = $("#f-sum");
  if (sum) {
    sum.addEventListener("click", function () { out.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { sum.hidden = es[0].isIntersecting; }, { threshold: 0.15 }).observe(out);
  }
  function summary() {
    if (!sum) return;
    var any = S.r || S.m || S.t || S.p.length || S.k || S.d.length;
    sum.classList.toggle("is-on", !!any);
    if (any) sum.innerHTML = "<span>" + esc(T.sum_label.replace("{k}", machineList().k).replace("{total}", D.total)) + "</span><span>" + esc(T.sum_go) + " ↓</span>";
  }
  function update() { syncUI(); writeHash(); render(); summary(); }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }
  $("#fform").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.id === "f-clear") { S = { r: "", m: "", t: "", p: [], k: "", d: [] }; update(); return; }
    if (b.hasAttribute("data-r")) S.r = S.r === b.getAttribute("data-r") ? "" : b.getAttribute("data-r");
    else if (b.hasAttribute("data-m")) S.m = S.m === b.getAttribute("data-m") ? "" : b.getAttribute("data-m");
    else if (b.hasAttribute("data-k")) S.k = S.k === b.getAttribute("data-k") ? "" : b.getAttribute("data-k");
    else if (b.hasAttribute("data-t")) S.t = S.t === b.getAttribute("data-t") ? "" : b.getAttribute("data-t");
    else if (b.hasAttribute("data-d")) toggleIn(S.d, b.getAttribute("data-d"));
    else return;
    update();
  });
  $("#f-p").addEventListener("change", function (e) { var i = e.target.closest("input"); if (!i) return; toggleIn(S.p, i.getAttribute("data-p")); update(); });
  var ft = $("#f-t"); ft.addEventListener("input", function () { S.t = digits(ft.value); syncUI(); writeHash(); render(); summary(); });
  window.addEventListener("hashchange", function () { readHash(); syncUI(); render(); });
  readHash(); syncUI(); render(); summary();
})();
