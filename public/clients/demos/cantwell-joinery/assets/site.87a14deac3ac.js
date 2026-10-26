(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

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
  if (dock && safe(function () { return sessionStorage.getItem("cj-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cj-dock", "1"); }); });

  /* reveals with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* video facade -> dialog */
  var vbtn = $("[data-video]"), vdlg = $("#vdlg"), vframe = null;
  if (vbtn && vdlg && typeof vdlg.showModal === "function") {
    vbtn.addEventListener("click", function () {
      vframe = d.createElement("iframe");
      vframe.src = "https://www.youtube-nocookie.com/embed/" + vbtn.getAttribute("data-video") + "?autoplay=1&rel=0";
      vframe.title = vdlg.getAttribute("aria-label") || "";
      vframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      vframe.setAttribute("allowfullscreen", "");
      vdlg.appendChild(vframe); vdlg.showModal();
    });
    vdlg.addEventListener("close", function () { if (vframe) { vframe.remove(); vframe = null; } });
    vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
    $$("[data-vclose]", vdlg).forEach(function (b) { b.addEventListener("click", function () { vdlg.close(); }); });
  }

  /* photo lightbox */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") (function () {
    var img = $("[data-lb-img]", lb), cap = $("[data-lb-cap]", lb), num = $("[data-lb-n]", lb), list = [], idx = 0, opener = null;
    function visibleItems(group) { return $$("[data-lb='" + group + "'] [data-lb-item]").filter(function (b) { var li = b.closest("li"); return !(li && li.hidden); }); }
    function show(i) {
      idx = (i + list.length) % list.length;
      var b = list[idx];
      img.src = b.getAttribute("data-full"); img.width = +b.getAttribute("data-w"); img.height = +b.getAttribute("data-h");
      var im = $("img", b); img.alt = im ? im.alt : "";
      cap.textContent = b.getAttribute("data-cap") || ""; num.textContent = (idx + 1) + " / " + list.length;
    }
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb-item]");
      if (!b) return;
      var g = b.closest("[data-lb]"); if (!g) return;
      opener = b; list = visibleItems(g.getAttribute("data-lb")); show(list.indexOf(b)); lb.showModal();
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(idx - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    lb.addEventListener("close", function () { if (opener) opener.focus(); });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  })();

  /* photo filters */
  $$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-filter");
      $$("[data-filter]").forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$(".gal--all .gal__it").forEach(function (li) { li.hidden = !(k === "all" || li.getAttribute("data-cat") === k); });
    });
  });

  /* open now (NZ time) */
  var openEl = $("[data-open]");
  if (openEl) safe(function () {
    var parts = new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday), mins = (+o.hour % 24) * 60 + (+o.minute);
    var isOpen = wd >= 1 && wd <= 5 && mins >= 480 && mins < 960;
    openEl.classList.toggle("is-open", isOpen);
    var msg = isOpen ? "Open now, until 4:00 pm"
      : (wd >= 1 && wd <= 4 && mins >= 960) ? "Closed now, opens tomorrow at 8:00 am"
      : (wd === 5 && mins >= 960) || wd === 6 || wd === 0 ? "Closed now, opens Monday at 8:00 am"
      : "Closed now, opens today at 8:00 am";
    $("[data-open-t]", openEl).textContent = msg;
  });

  /* map on tap */
  var mb = $("[data-map]");
  if (mb) $("[data-map-btn]", mb).addEventListener("click", function () {
    var f = d.createElement("iframe"); f.src = mb.getAttribute("data-map"); f.title = mb.getAttribute("data-title"); f.loading = "lazy"; f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    mb.innerHTML = ""; mb.appendChild(f);
  });

  /* contact form -> mail */
  var mf = $("#mailform");
  if (mf) mf.addEventListener("submit", function (e) {
    e.preventDefault();
    var c = JSON.parse($("#mail-cfg").textContent), g = function (n) { return (mf.elements[n].value || "").trim(); };
    var body = (g("msg") || "") + "\n\n" + [g("name"), g("phone"), g("email")].filter(Boolean).join("\n");
    location.href = "mailto:" + c.to + "?subject=" + encodeURIComponent(c.subject) + "&body=" + encodeURIComponent(body);
  });

  /* ------------------------------------------------ the quote brief (signature tool) */
  var cfgEl = $("#tool-cfg");
  if (cfgEl) (function () {
    var cfg = JSON.parse(cfgEl.textContent), T = cfg.T, KEY = "cj-brief-v1";
    var toolRoot = $("[data-tool-root]"), miniBody = $("[data-mini-body]");
    function newUnit() { return { name: "", width: "", height: "", n: 1, secs: [{ v: "", s: "fixed" }] }; }
    function fresh() {
      return { mode: "kitchen", unit: "mm", walls: [{ len: "", segs: [{ t: "wall", v: "" }, { t: "door", v: "" }, { t: "wall", v: "" }] }],
        k: { mats: {}, app: {}, prio: [], q: {} }, w: { units: [newUnit()], mats: {}, q: {} }, you: { comm: [] } };
    }
    var SAMPLE = { len: "4210", segs: [{ t: "wall", v: "2650" }, { t: "door", v: "910" }, { t: "wall", v: "650" }] };
    function load() { return safe(function () { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.walls && s.k && s.w && s.you ? s : null; }); }
    var draft = load(), S = draft || fresh();
    if (!draft && miniBody) S.walls[0] = JSON.parse(JSON.stringify(SAMPLE));
    function save() { safe(function () { localStorage.setItem(KEY, JSON.stringify(S)); }); }

    /* paths */
    function getP(path) { var o = S, ps = path.split("."); for (var i = 0; i < ps.length; i++) { if (o == null) return undefined; o = o[ps[i]]; } return o; }
    function setP(path, v) { var o = S, ps = path.split("."); for (var i = 0; i < ps.length - 1; i++) { if (o[ps[i]] == null) o[ps[i]] = {}; o = o[ps[i]]; } o[ps[ps.length - 1]] = v; }

    /* numbers */
    function mm(v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) && n > 0 ? Math.round(n * (S.unit === "cm" ? 10 : 1)) : 0; }
    function fmt(v) { return S.unit === "cm" ? (v / 10).toFixed(1).replace(/\.0$/, "") + " cm" : v + " mm"; }
    function fmtMm(v) { return v + " mm"; }
    function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
    function segLabel(t) { for (var i = 0; i < T.seg_types.length; i++) if (T.seg_types[i][0] === t) return T.seg_types[i][1]; return t; }

    function checkWall(w) {
      var all = mm(w.len), sum = 0;
      w.segs.forEach(function (s) { sum += mm(s.v); });
      if (!all || !sum) return { s: "empty", all: all, sum: sum };
      var diff = all - sum, ad = Math.abs(diff);
      if (diff === 0) return { s: "ok", all: all, sum: sum };
      if (ad <= 10) return { s: "near", all: all, sum: sum, d: ad };
      return { s: diff > 0 ? "short" : "over", all: all, sum: sum, d: ad };
    }
    var CK = T.check;
    function statusText(r) {
      if (r.s === "empty") return CK.empty;
      if (r.s === "ok") return fill(CK.ok, { sum: fmt(r.sum), all: fmt(r.all) });
      return fill(CK[r.s], { d: fmt(r.d) });
    }
    function paintWall(el, w) {
      var r = checkWall(w), bar = $(".wbar", el), st = $(".status", el), total = Math.max(r.all, r.sum, 1), h = "";
      w.segs.forEach(function (s) {
        var v = mm(s.v); if (!v) return;
        h += '<i class="k-' + esc(s.t) + '" style="width:' + (v / total * 100).toFixed(2) + '%" title="' + esc(segLabel(s.t) + " " + fmt(v)) + '"></i>';
      });
      bar.innerHTML = h;
      st.textContent = statusText(r);
      st.className = "status " + (r.s === "ok" ? "is-ok" : r.s === "near" ? "is-near" : r.s === "empty" ? "" : "is-bad");
    }

    /* html helpers */
    function numInput(path, label, ph, extra) {
      return '<div class="numrow"><input type="number" inputmode="decimal" min="0" step="any" data-p="' + path + '" value="' + esc(getP(path)) + '" placeholder="' + esc(ph || "") + '" aria-label="' + esc(label) + '"' + (extra || "") + '><span>' + esc(S.unit) + '</span></div>';
    }
    function textArea(path, label) { return '<div class="f"><label for="' + path + '">' + esc(label) + '</label><textarea id="' + path + '" rows="2" data-p="' + path + '">' + esc(getP(path) || "") + '</textarea></div>'; }
    function textIn(path, label, type, ac) { return '<div class="f"><label for="' + path + '">' + esc(label) + '</label><input id="' + path + '" type="' + (type || "text") + '" data-p="' + path + '" value="' + esc(getP(path) || "") + '"' + (ac ? ' autocomplete="' + ac + '"' : "") + (type === "tel" ? ' inputmode="tel"' : type === "email" ? ' inputmode="email"' : "") + '></div>'; }
    function chipsOne(path, label, opts) {
      var v = getP(path);
      return '<fieldset><legend>' + esc(label) + '</legend><div class="chips">' + opts.map(function (o) {
        return '<label class="opt"><input type="radio" name="' + path + '" data-p="' + path + '" value="' + esc(o) + '"' + (v === o ? " checked" : "") + '><span>' + esc(o) + '</span></label>';
      }).join("") + '</div></fieldset>';
    }
    function chipsMulti(path, label, opts, max) {
      var v = getP(path) || [];
      return '<fieldset><legend>' + esc(label) + '</legend><div class="chips"' + (max ? ' data-max="' + max + '"' : "") + '>' + opts.map(function (o) {
        return '<label class="opt"><input type="checkbox" data-pm="' + path + '" value="' + esc(o) + '"' + (v.indexOf(o) > -1 ? " checked" : "") + '><span>' + esc(o) + '</span></label>';
      }).join("") + '</div></fieldset>';
    }
    function details(title, inner, open) { return '<details class="det"' + (open ? " open" : "") + '><summary>' + esc(title) + '</summary><div class="det__b">' + inner + '</div></details>'; }

    /* walls */
    function wallHTML(w, wi, mini) {
      var rows = w.segs.map(function (s, si) {
        var p = "walls." + wi + ".segs." + si;
        return '<div class="seg-row"><select data-p="' + p + '.t" aria-label="' + esc(fill(T.piece_n, { n: si + 1 })) + '">' + T.seg_types.map(function (t) { return '<option value="' + t[0] + '"' + (s.t === t[0] ? " selected" : "") + ">" + esc(t[1]) + "</option>"; }).join("") + '</select>' +
          '<div class="numrow"><input type="number" inputmode="decimal" min="0" step="any" data-p="' + p + '.v" value="' + esc(s.v) + '" aria-label="' + esc(segLabel(s.t)) + ' ' + (si + 1) + '"><span>' + esc(S.unit) + '</span></div>' +
          '<button type="button" class="xbtn" data-act="rm-seg" data-wi="' + wi + '" data-si="' + si + '" aria-label="' + esc(T.remove) + ' ' + (si + 1) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button></div>';
      }).join("");
      return '<div class="wall" data-wi="' + wi + '"><div class="wall__top"><h3>' + esc(fill(T.wall_n, { n: wi + 1 })) + '</h3>' +
        (!mini && S.walls.length > 1 ? '<button type="button" class="btn btn--ghost btn--sm" data-act="rm-wall" data-wi="' + wi + '">' + esc(T.remove) + '</button>' : "") + '</div>' +
        '<div class="wall__len f"><label for="wl' + wi + (mini ? "m" : "") + '">' + esc(T.overall) + '</label><div class="numrow"><input id="wl' + wi + (mini ? "m" : "") + '" type="number" inputmode="decimal" min="0" step="any" data-p="walls.' + wi + '.len" value="' + esc(w.len) + '"><span>' + esc(S.unit) + '</span></div></div>' +
        '<p class="note" style="margin:0">' + esc(T.seg_hint) + '</p><div class="segs">' + rows + '</div>' +
        '<button type="button" class="btn btn--ghost btn--sm addbtn" data-act="add-seg" data-wi="' + wi + '">' + esc(T.add_seg) + '</button>' +
        '<div class="wbar" role="img" aria-label="' + esc(T.bar_label) + '"></div><div class="wlegend">' + T.seg_types.map(function (t) { return '<span><b class="k-' + t[0] + '"></b>' + esc(t[1]) + '</span>'; }).join("") + '</div>' +
        '<p class="status" aria-live="polite"></p></div>';
    }
    function paintWalls(scope) { $$(".wall", scope).forEach(function (el) { paintWall(el, S.walls[+el.getAttribute("data-wi")]); }); }

    /* windows */
    var SASH = T.windows.sashes;
    function sashLabel(v) { for (var i = 0; i < SASH.length; i++) if (SASH[i][0] === v) return SASH[i][1]; return v; }
    function unitHTML(u, ui) {
      var W = T.windows, p = "w.units." + ui, secs = "";
      for (var i = 0; i < u.n; i++) {
        var sec = u.secs[i] || (u.secs[i] = { v: "", s: "fixed" });
        secs += '<div class="sec-row"><div class="f"><label for="' + p + '.secs.' + i + '.v">' + esc(fill(W.section_n, { n: i + 1 })) + '</label><div class="numrow"><input id="' + p + '.secs.' + i + '.v" type="number" inputmode="decimal" min="0" step="any" data-p="' + p + '.secs.' + i + '.v" value="' + esc(sec.v) + '"><span>' + esc(S.unit) + '</span></div></div>' +
          '<div class="f"><label for="' + p + '.secs.' + i + '.s">' + esc(fill(W.sash, { n: i + 1 })) + '</label><select id="' + p + '.secs.' + i + '.s" data-p="' + p + '.secs.' + i + '.s">' + SASH.map(function (s) { return '<option value="' + s[0] + '"' + (sec.s === s[0] ? " selected" : "") + ">" + esc(s[1]) + "</option>"; }).join("") + '</select></div></div>';
      }
      var nopts = ""; for (var n = 1; n <= 6; n++) nopts += '<option value="' + n + '"' + (u.n === n ? " selected" : "") + ">" + n + "</option>";
      return '<div class="unit" data-ui="' + ui + '"><div class="unit__top"><h3>' + esc(fill(W.unit_n, { n: ui + 1 })) + '</h3>' +
        (S.w.units.length > 1 ? '<button type="button" class="btn btn--ghost btn--sm" data-act="rm-unit" data-ui="' + ui + '">' + esc(T.remove) + '</button>' : "") + '</div>' +
        '<div class="unit__grid"><div class="f f--wide"><label for="' + p + '.name">' + esc(W.name) + '</label><input id="' + p + '.name" type="text" data-p="' + p + '.name" value="' + esc(u.name) + '"></div>' +
        '<div class="f"><label for="' + p + '.width">' + esc(W.width) + '</label><div class="numrow"><input id="' + p + '.width" type="number" inputmode="decimal" min="0" step="any" data-p="' + p + '.width" value="' + esc(u.width) + '"><span>' + esc(S.unit) + '</span></div></div>' +
        '<div class="f"><label for="' + p + '.height">' + esc(W.height) + '</label><div class="numrow"><input id="' + p + '.height" type="number" inputmode="decimal" min="0" step="any" data-p="' + p + '.height" value="' + esc(u.height) + '"><span>' + esc(S.unit) + '</span></div></div>' +
        '<div class="f"><label for="' + p + '.n">' + esc(W.sections) + '</label><select id="' + p + '.n" data-p="' + p + '.n" data-struct data-int>' + nopts + '</select></div></div>' +
        '<div class="secs">' + secs + '</div>' +
        (u.n > 1 ? '<button type="button" class="btn btn--ghost btn--sm addbtn" data-act="even" data-ui="' + ui + '">' + esc(W.sum_even) + '</button>' : "") +
        '<p class="status" aria-live="polite"></p><svg class="sketch" data-sketch viewBox="0 0 320 260" role="img" aria-label="Sketch of the window or door, to scale"></svg></div>';
    }
    function checkUnit(u) {
      var all = mm(u.width), sum = 0, i;
      for (i = 0; i < u.n; i++) sum += mm((u.secs[i] || {}).v);
      if (!all || !sum) return { s: "none" };
      for (i = 0; i < u.n; i++) if (!mm((u.secs[i] || {}).v)) return { s: "missing", n: i + 1 };
      var diff = all - sum;
      return { s: diff === 0 ? "ok" : diff > 0 ? "short" : "over", d: Math.abs(diff), all: all, sum: sum };
    }
    function paintUnit(el, u) {
      var W = T.windows, r = checkUnit(u), st = $(".status", el);
      st.textContent = r.s === "none" ? W.sum_none : r.s === "missing" ? fill(W.sum_missing, { n: r.n }) : r.s === "ok" ? W.sum_ok : fill(r.s === "short" ? W.sum_short : W.sum_over, { d: fmt(r.d) });
      st.className = "status " + (r.s === "ok" ? "is-ok" : r.s === "none" ? "" : "is-bad");
      /* sketch to scale */
      var wv = mm(u.width) || 1200, hv = mm(u.height) || 1000, maxW = 240, maxH = 170, sc = Math.min(maxW / wv, maxH / hv), pw = Math.max(wv * sc, 24), ph = Math.max(hv * sc, 24);
      var x0 = (320 - pw) / 2, y0 = 34, parts = [], xs = x0, i, widths = [], tot = 0;
      for (i = 0; i < u.n; i++) { var s = mm((u.secs[i] || {}).v); widths.push(s); tot += s; }
      var scale = tot ? pw / Math.max(tot, wv) : 0;
      for (i = 0; i < u.n; i++) widths[i] = tot ? widths[i] * scale : pw / u.n;
      var svg = '<rect class="fr" x="' + x0.toFixed(1) + '" y="' + y0 + '" width="' + pw.toFixed(1) + '" height="' + ph.toFixed(1) + '"/>';
      for (i = 0; i < u.n; i++) {
        var w = widths[i], x1 = xs + w, y1 = y0 + ph, m = (xs + x1) / 2, ym = (y0 + y1) / 2, s2 = (u.secs[i] || {}).s;
        svg += '<rect class="sh" x="' + (xs + 4).toFixed(1) + '" y="' + (y0 + 4) + '" width="' + Math.max(w - 8, 1).toFixed(1) + '" height="' + Math.max(ph - 8, 1).toFixed(1) + '"/>';
        if (s2 === "awning") svg += '<polyline class="op" points="' + (xs + 4) + "," + (y1 - 4) + " " + m + "," + (y0 + 4) + " " + (x1 - 4) + "," + (y1 - 4) + '" fill="none"/>';
        if (s2 === "case-l") svg += '<polyline class="op" points="' + (x1 - 4) + "," + (y0 + 4) + " " + (xs + 4) + "," + ym + " " + (x1 - 4) + "," + (y1 - 4) + '" fill="none"/>';
        if (s2 === "case-r") svg += '<polyline class="op" points="' + (xs + 4) + "," + (y0 + 4) + " " + (x1 - 4) + "," + ym + " " + (xs + 4) + "," + (y1 - 4) + '" fill="none"/>';
        if (mm((u.secs[i] || {}).v)) svg += '<text x="' + m.toFixed(1) + '" y="' + (y1 + 20) + '">' + esc(String(Math.round(mm(u.secs[i].v) / (S.unit === "cm" ? 10 : 1)))) + '</text>';
        xs = x1;
      }
      if (mm(u.width)) svg += '<text x="160" y="22">' + esc(String(Math.round(mm(u.width) / (S.unit === "cm" ? 10 : 1)))) + ' ' + esc(S.unit) + '</text>';
      if (mm(u.height)) svg += '<text x="' + (x0 - 6).toFixed(1) + '" y="' + (y0 + ph / 2).toFixed(1) + '" transform="rotate(-90 ' + (x0 - 6).toFixed(1) + " " + (y0 + ph / 2).toFixed(1) + ')">' + esc(String(Math.round(mm(u.height) / (S.unit === "cm" ? 10 : 1)))) + ' ' + esc(S.unit) + '</text>';
      $("[data-sketch]", el).innerHTML = svg;
    }
    function paintUnits(scope) { $$(".unit", scope).forEach(function (el) { paintUnit(el, S.w.units[+el.getAttribute("data-ui")]); }); }

    /* brief text */
    function line(label, v) { return v ? label + ": " + v : ""; }
    function joinNZ(a) { return (a || []).join(", "); }
    function you(out) {
      var y = S.you, f = T.you.fields;
      out.push("");
      f.forEach(function (x) { if (y[x[0]]) out.push(x[1] + ": " + y[x[0]]); });
      if (y.comm && y.comm.length) out.push("Keep in touch by: " + joinNZ(y.comm));
    }
    function briefKitchen() {
      var K = T.kitchen, k = S.k, out = ["KITCHEN QUOTE BRIEF"];
      var hasWall = false, wl = [];
      S.walls.forEach(function (w, i) {
        var all = mm(w.len), parts = w.segs.filter(function (s) { return mm(s.v); }).map(function (s) { return segLabel(s.t).toLowerCase() + " " + fmtMm(mm(s.v)); });
        if (!all && !parts.length) return;
        hasWall = true;
        var r = checkWall(w), tag = r.s === "ok" ? "adds up" : r.s === "near" ? "within " + fmtMm(r.d) : r.s === "short" ? fmtMm(r.d) + " not accounted for" : r.s === "over" ? fmtMm(r.d) + " over" : "";
        wl.push(fill(T.wall_n, { n: i + 1 }) + ": overall " + (all ? fmtMm(all) : "?") + (parts.length ? " = " + parts.join(" + ") : "") + (tag ? " (" + tag + ")" : ""));
      });
      if (hasWall) { out.push("", "SPACE (in mm)"); out = out.concat(wl); }
      if (mm(k.sink)) out.push("Centre of sink and waste from left-hand wall: " + fmtMm(mm(k.sink)));
      if (mm(k.hob)) out.push("Centre of hob or rangehood from wall: " + fmtMm(mm(k.hob)));
      var wish = [];
      if (k.build) wish.push("Reno or new build: " + k.build);
      K.q.forEach(function (q) { var v = (k.q[q[0]] || "").trim(); if (v) wish.push(q[1] + " " + v); });
      if (k.budgetApp) wish.push("Budget includes appliances: " + k.budgetApp);
      if (k.tradies) wish.push("Plumber and electrician: " + k.tradies);
      K.mats.forEach(function (m) { var v = k.mats[m[0]]; if (v && v.length) wish.push(m[0] + ": " + joinNZ(v)); });
      if (k.prio && k.prio.length) wish.push("Cabinet priorities: " + joinNZ(k.prio));
      K.app.forEach(function (a) { var v = k.app[a[0]]; if (v && v.length) wish.push(a[0] + ": " + joinNZ(v)); });
      if (k.appQ) wish.push(K.app_q[0] + " " + k.appQ);
      if (k.more && k.more.trim()) wish.push("Anything else: " + k.more.trim());
      if (wish.length) { out.push("", "WISHLIST"); out = out.concat(wish); }
      you(out);
      return out.join("\n");
    }
    function briefWindows() {
      var W = T.windows, w = S.w, out = ["WINDOWS AND DOORS QUOTE BRIEF"], us = [];
      w.units.forEach(function (u, i) {
        var wv = mm(u.width), hv = mm(u.height);
        if (!wv && !hv && !(u.name || "").trim()) return;
        var secs = [];
        for (var j = 0; j < u.n; j++) { var s = u.secs[j] || {}; secs.push((mm(s.v) ? fmtMm(mm(s.v)) + " " : "") + sashLabel(s.s).replace(/ \(.*\)/, "").toLowerCase()); }
        var r = checkUnit(u), tag = r.s === "ok" ? " (sections add up)" : r.s === "short" ? " (sections " + fmtMm(r.d) + " short)" : r.s === "over" ? " (sections " + fmtMm(r.d) + " over)" : "";
        us.push((i + 1) + ". " + ((u.name || "").trim() || "Unnamed") + ": " + (wv ? fmtMm(wv) : "?") + " wide x " + (hv ? fmtMm(hv) : "?") + " high, " + u.n + (u.n === 1 ? " section" : " sections") + " (" + secs.join(", ") + ")" + tag);
      });
      if (us.length) { out.push("", "WINDOWS AND DOORS (in mm, measured over the whole frame)"); out = out.concat(us); }
      var wish = [];
      if (w.build) wish.push("Reno or new build: " + w.build);
      W.q.forEach(function (q) { var v = (w.q[q[0]] || "").trim(); if (v) wish.push(q[1] + " " + v); });
      if (w.install) wish.push("Budget includes installation: " + w.install);
      W.mats.forEach(function (m) { var v = w.mats[m[0]]; if (v && v.length) wish.push(m[0] + ": " + joinNZ(v)); });
      if (w.animalBy && w.animalBy.trim()) wish.push("Animal door supplied by: " + w.animalBy.trim());
      if (w.more && w.more.trim()) wish.push("Anything else: " + w.more.trim());
      if (wish.length) { out.push("", "WISHLIST"); out = out.concat(wish); }
      you(out);
      return out.join("\n");
    }
    function briefText() { return S.mode === "kitchen" ? briefKitchen() : briefWindows(); }
    function mailto() {
      var txt = briefText(), subj = (S.mode === "kitchen" ? T.send.subject_k : T.send.subject_w) + ((S.you.name || "").trim() ? " - " + S.you.name.trim() : "");
      var url = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + (S.mode === "windows" ? "&cc=" + encodeURIComponent(cfg.cc) : "") + "&body=" + encodeURIComponent(txt);
      return { url: url, txt: txt, long: url.length > 1900 };
    }

    /* full tool */
    function kitchenPanel() {
      var K = T.kitchen, k = S.k;
      var walls = S.walls.map(function (w, i) { return wallHTML(w, i, false); }).join('<div style="height:14px"></div>');
      var b1 = '<section class="block"><h2 class="block__h"><span>1</span>' + esc(T.steps_k[0]) + '</h2>' +
        '<fieldset><legend>' + esc(T.unit_label) + '</legend><div class="chips">' + T.units.map(function (u) { return '<label class="opt"><input type="radio" name="unit" data-p="unit" data-struct value="' + u[0] + '"' + (S.unit === u[0] ? " checked" : "") + '><span>' + esc(u[1]) + '</span></label>'; }).join("") + '</div></fieldset>' +
        walls + (S.walls.length < 6 ? '<button type="button" class="btn btn--ghost addbtn" data-act="add-wall">' + esc(T.add_wall) + '</button>' : "") +
        '<h3 class="lbl">' + esc(K.fixed_h) + '</h3><div class="unit__grid"><div class="f"><label for="k.sink">' + esc(K.sink) + '</label>' + numInput("k.sink", K.sink, "", ' id="k.sink"') + '</div>' +
        '<div class="f"><label for="k.hob">' + esc(K.hob) + '</label>' + numInput("k.hob", K.hob, "", ' id="k.hob"') + '</div></div></section>';
      var qs = chipsOne("k.build", K.build[0], K.build[1]) + K.q.map(function (q) { return textArea("k.q." + q[0], q[1]) + (q[0] === "budget" ? chipsOne("k.budgetApp", K.budget_app[0], K.budget_app[1]) : ""); }).join("") +
        chipsOne("k.tradies", K.tradies[0], K.tradies[1]);
      var mats = K.mats.map(function (m) { return chipsMulti("k.mats." + m[0], m[0], m[1]); }).join("");
      var prio = chipsMulti("k.prio", K.prio_h, K.prio, K.prio_max);
      var app = K.app.map(function (a) { return chipsMulti("k.app." + a[0], a[0], a[1]); }).join("") + chipsOne("k.appQ", K.app_q[0], K.app_q[1]);
      var b2 = '<section class="block"><h2 class="block__h"><span>2</span>' + esc(T.steps_k[1]) + '</h2><p class="note" style="margin:0">' + esc(T.wish_note) + '</p>' + details(K.q_h, qs, true) + details(K.mat_h, mats) + details(K.prio_h, prio) + details(K.app_h, app) +
        textArea("k.more", K.more[1]) + '</section>';
      return b1 + b2;
    }
    function windowsPanel() {
      var W = T.windows, w = S.w;
      var units = w.units.map(function (u, i) { return unitHTML(u, i); }).join("");
      var b1 = '<section class="block"><h2 class="block__h"><span>1</span>' + esc(T.steps_w[0]) + '</h2><p class="note" style="margin:0">' + esc(W.hint) + '</p>' +
        '<fieldset><legend>' + esc(T.unit_label) + '</legend><div class="chips">' + T.units.map(function (u) { return '<label class="opt"><input type="radio" name="unit" data-p="unit" data-struct value="' + u[0] + '"' + (S.unit === u[0] ? " checked" : "") + '><span>' + esc(u[1]) + '</span></label>'; }).join("") + '</div></fieldset>' +
        units + (w.units.length < 8 ? '<button type="button" class="btn btn--ghost addbtn" data-act="add-unit">' + esc(W.add_unit) + '</button>' : "") + '</section>';
      var qs = chipsOne("w.build", W.build[0], W.build[1]) + W.q.map(function (q) { return textArea("w.q." + q[0], q[1]); }).join("") + chipsOne("w.install", W.install[0], W.install[1]);
      var mats = W.mats.map(function (m) { return chipsMulti("w.mats." + m[0], m[0], m[1]); }).join("") + textIn("w.animalBy", W.animal_by);
      var b2 = '<section class="block"><h2 class="block__h"><span>2</span>' + esc(T.steps_w[1]) + '</h2><p class="note" style="margin:0">' + esc(T.wish_note) + '</p>' + details(W.q_h, qs, true) + details(W.mat_h, mats) + textArea("w.more", W.more[1]) + '</section>';
      return b1 + b2;
    }
    function youBlock() {
      var Y = T.you;
      return '<section class="block"><h2 class="block__h"><span>3</span>' + esc(Y.h) + '</h2><div class="unit__grid">' + Y.fields.map(function (f) { return textIn("you." + f[0], f[1], f[0] === "email" ? "email" : f[0] === "phone" ? "tel" : "text", f[2]); }).join("") + '</div>' + chipsMulti("you.comm", Y.comm_h, Y.comm) + '</section>';
    }
    function asideHTML() {
      var X = T.send;
      return '<aside class="tool__aside"><div class="sum"><h2 class="sum__h">' + esc(X.h) + '</h2><pre data-pre aria-live="polite"></pre><p class="warn" data-long hidden></p>' +
        '<a class="btn" data-send href="#">' + esc(X.email) + '</a><button type="button" class="btn btn--ghost" data-copy>' + esc(X.copy) + '</button>' +
        '<p class="note">' + esc(X.note) + '</p><p class="note">' + esc(X.draft) + ' <button type="button" class="linkbtn" data-act="clear">' + esc(X.clear) + '</button></p>' +
        '<a href="tel:' + esc(cfg.phone.replace(/\s/g, "")) + '">' + esc(X.or_call) + " " + esc(cfg.phone) + '</a></div></aside>';
    }
    function renderTool(focus) {
      var tabs = '<div class="tabs" role="tablist" aria-label="Brief type">' + T.modes.map(function (m) { return '<button type="button" role="tab" class="tab" data-act="mode" data-mode="' + m[0] + '" aria-selected="' + (S.mode === m[0]) + '">' + esc(m[1]) + '</button>'; }).join("") + '</div>';
      toolRoot.innerHTML = tabs + '<div class="tool__grid"><div role="tabpanel">' + (S.mode === "kitchen" ? kitchenPanel() : windowsPanel()) + youBlock() + '</div>' + asideHTML() + '</div>';
      paintWalls(toolRoot); paintUnits(toolRoot); lockPrio(); updateBrief();
      if (focus) { var el = $(focus, toolRoot); if (el) el.focus(); }
    }
    function lockPrio() {
      $$(".chips[data-max]", toolRoot).forEach(function (c) {
        var max = +c.getAttribute("data-max"), boxes = $$("input", c), n = boxes.filter(function (b) { return b.checked; }).length;
        boxes.forEach(function (b) { b.disabled = !b.checked && n >= max; });
      });
    }
    function updateBrief() {
      if (!toolRoot) return;
      var m = mailto(), pre = $("[data-pre]", toolRoot), X = T.send;
      var has = m.txt.split("\n").length > 2;
      pre.textContent = has ? m.txt : X.empty;
      var send = $("[data-send]", toolRoot); if (send) send.href = m.url;
      var lg = $("[data-long]", toolRoot); if (lg) { lg.hidden = !m.long; lg.textContent = fill(X.long, { to: cfg.to }); }
    }
    function renderMini(focus) {
      miniBody.innerHTML = wallHTML(S.walls[0], 0, true);
      paintWalls(miniBody);
      if (focus) { var el = $(focus, miniBody); if (el) el.focus(); }
    }
    function rerender(focus) { if (toolRoot) renderTool(focus); if (miniBody) renderMini(focus); }
    function fieldsRepaint(scope) { if (scope.closest("[data-mini]")) paintWalls(miniBody); else { paintWalls(toolRoot); paintUnits(toolRoot); updateBrief(); } }

    function convertUnits(from, to) {
      var f = from === "mm" && to === "cm" ? 0.1 : from === "cm" && to === "mm" ? 10 : 1;
      function cv(x) { var n = parseFloat(String(x).replace(",", ".")); return isFinite(n) && String(x).trim() !== "" ? String(Math.round(n * f * 10) / 10) : x; }
      S.walls.forEach(function (w) { w.len = cv(w.len); w.segs.forEach(function (g) { g.v = cv(g.v); }); });
      S.k.sink = cv(S.k.sink || ""); S.k.hob = cv(S.k.hob || "");
      S.w.units.forEach(function (u) { u.width = cv(u.width); u.height = cv(u.height); u.secs.forEach(function (g) { g.v = cv(g.v); }); });
    }
    d.addEventListener("focusin", function (e) { var t = e.target; if (t.matches && t.matches("input[type=number]") && inScope(t)) safe(function () { t.select(); }); });

    /* events */
    function inScope(t) { return t.closest("[data-tool-root],[data-mini-body]"); }
    d.addEventListener("input", function (e) {
      var t = e.target; if (!t.matches || !t.matches("[data-p]") || !inScope(t) || t.type === "radio" || t.tagName === "SELECT") return;
      setP(t.getAttribute("data-p"), t.value); save(); fieldsRepaint(t);
    });
    d.addEventListener("change", function (e) {
      var t = e.target; if (!t.matches || !inScope(t)) return;
      if (t.matches("[data-p]") && (t.type === "radio" || t.tagName === "SELECT")) {
        var v = t.value; if (t.hasAttribute("data-int")) v = parseInt(v, 10);
        if (t.getAttribute("data-p") === "unit" && v !== S.unit) convertUnits(S.unit, v);
        setP(t.getAttribute("data-p"), v);
        if (t.getAttribute("data-p").slice(-2) === ".n") { var u = getP(t.getAttribute("data-p").replace(/\.n$/, "")); while (u.secs.length < u.n) u.secs.push({ v: "", s: "fixed" }); }
        save();
        if (t.hasAttribute("data-struct")) rerender(); else fieldsRepaint(t);
      } else if (t.matches("[data-pm]")) {
        var p = t.getAttribute("data-pm"), arr = (getP(p) || []).slice(), i = arr.indexOf(t.value);
        if (t.checked && i < 0) arr.push(t.value); if (!t.checked && i > -1) arr.splice(i, 1);
        setP(p, arr); save(); lockPrio(); updateBrief();
      }
    });
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b || !inScope(b)) return;
      var a = b.getAttribute("data-act"), wi = +b.getAttribute("data-wi"), si = +b.getAttribute("data-si"), ui = +b.getAttribute("data-ui");
      if (a === "add-seg") { S.walls[wi].segs.push({ t: "wall", v: "" }); save(); rerender(".wall[data-wi='" + wi + "'] .seg-row:last-child select"); }
      else if (a === "rm-seg") { if (S.walls[wi].segs.length > 1) S.walls[wi].segs.splice(si, 1); save(); rerender(); }
      else if (a === "add-wall") { S.walls.push({ len: "", segs: [{ t: "wall", v: "" }, { t: "door", v: "" }, { t: "wall", v: "" }] }); save(); rerender(".wall[data-wi='" + (S.walls.length - 1) + "'] input"); }
      else if (a === "rm-wall") { S.walls.splice(wi, 1); save(); rerender(); }
      else if (a === "add-unit") { S.w.units.push(newUnit()); save(); rerender(".unit[data-ui='" + (S.w.units.length - 1) + "'] input"); }
      else if (a === "rm-unit") { S.w.units.splice(ui, 1); save(); rerender(); }
      else if (a === "even") { var u = S.w.units[ui], all = mm(u.width); if (all) { var per = Math.floor(all / u.n / (S.unit === "cm" ? 10 : 1) * 10) / 10; var rest = all / (S.unit === "cm" ? 10 : 1); for (var j = 0; j < u.n; j++) { u.secs[j].v = String(j === u.n - 1 ? Math.round((rest - per * (u.n - 1)) * 10) / 10 : per); } } save(); rerender(); }
      else if (a === "mode") { S.mode = b.getAttribute("data-mode"); save(); safe(function () { history.replaceState(null, "", "#" + (S.mode === "kitchen" ? "kitchen" : "windows")); }); rerender(); }
      else if (a === "clear") { S = fresh(); save(); rerender(); }
    });
    if (toolRoot) {
      if (location.hash === "#windows") S.mode = "windows"; else if (location.hash === "#kitchen") S.mode = "kitchen";
      renderTool();
      var send = function () { var m = mailto(); location.href = m.url; };
      d.addEventListener("click", function (e) {
        var s = e.target.closest("button[data-brief-send]"); if (s) send();
        var c = e.target.closest("[data-copy]");
        if (c) {
          var txt = mailto().txt, done = function () { var o = c.textContent; c.textContent = T.send.copied; setTimeout(function () { c.textContent = o; }, 1800); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt, done); }); else fallbackCopy(txt, done);
        }
      });
      function fallbackCopy(txt, done) { var ta = d.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); ta.remove(); done(); }
    }
    if (miniBody) renderMini();
  })();
})();
