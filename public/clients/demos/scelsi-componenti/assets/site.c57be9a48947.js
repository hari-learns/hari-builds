(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function json(sel) { var el = $(sel); return el ? safe(function () { return JSON.parse(el.textContent); }) : null; }

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sc-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sc-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
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

  /* number formatting */
  var LANG = (root.lang || "it").slice(0, 2);
  function group(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === "it" ? "." : ","); }
  var nf0 = { format: group };
  var nf2 = new Intl.NumberFormat(LANG === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 2 });
  var nf1 = new Intl.NumberFormat(LANG === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 });

  /* counters: the page ships the final figure; below the fold it counts up once */
  $$(".count").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    if (reduce || !io) return;
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return;
    el.textContent = "0";
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(el);
        var t0 = null, dur = 1400;
        function tick(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), v = target * (1 - Math.pow(1 - p, 3));
          el.textContent = nf0.format(Math.round(v));
          if (p < 1) requestAnimationFrame(tick); else el.textContent = nf0.format(target);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    co.observe(el);
  });

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* hero stage: the eight real parts of their own slideshow, now controllable */
  var stage = $("[data-stage]");
  if (stage) (function () {
    var slides = $$(".stage__slide", stage), thumbs = $$("[data-go]", stage), curEl = $("[data-cur]", stage), capEl = $("[data-cap]", stage), pp = $("[data-pp]", stage);
    var alts = safe(function () { return JSON.parse(stage.getAttribute("data-alts")); }) || [];
    var cur = 0, timer = null, paused = reduce, hover = false;
    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === cur); });
      thumbs.forEach(function (t, k) { t.classList.toggle("is-active", k === cur); t.setAttribute("aria-pressed", k === cur ? "true" : "false"); });
      if (curEl) curEl.textContent = String(cur + 1);
      if (capEl && alts[cur]) capEl.textContent = alts[cur];
    }
    function arm() { clearTimeout(timer); if (!paused && !hover && !d.hidden) timer = setTimeout(function () { go(cur + 1); arm(); }, 4800); }
    thumbs.forEach(function (t) { t.addEventListener("click", function () { go(parseInt(t.getAttribute("data-go"), 10)); arm(); }); });
    function setPP() {
      if (!pp) return;
      pp.innerHTML = paused ? '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>' : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"/></svg>';
      pp.setAttribute("aria-label", paused ? pp.getAttribute("data-l-play") : pp.getAttribute("data-l-pause"));
    }
    if (pp) pp.addEventListener("click", function () { paused = !paused; setPP(); arm(); });
    stage.addEventListener("mouseenter", function () { hover = true; clearTimeout(timer); });
    stage.addEventListener("mouseleave", function () { hover = false; arm(); });
    d.addEventListener("visibilitychange", arm);
    setPP();
    window.addEventListener("load", function () { setTimeout(arm, 1800); });
  })();

  /* sortable + filterable tables */
  $$("table[data-sortable]").forEach(function (tb) {
    var body = $("tbody", tb), heads = $$("thead th", tb), dir = {};
    function cellVal(tr, i) {
      var td = tr.children[i];
      if (!td) return "";
      var v = td.getAttribute("data-v");
      if (v !== null) return parseFloat(v);
      return td.textContent.trim().toLowerCase();
    }
    $$("[data-sort]", tb).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-sort"), 10);
        var next = dir[i] === "asc" ? "desc" : "asc";
        dir = {}; dir[i] = next;
        var rows = $$("tr", body);
        rows.sort(function (a, c) {
          var x = cellVal(a, i), y = cellVal(c, i), r;
          if (typeof x === "number" && typeof y === "number") { if (x === 0 && y !== 0) return 1; if (y === 0 && x !== 0) return -1; r = x - y; }
          else r = String(x).localeCompare(String(y), "it", { numeric: true });
          return next === "asc" ? r : -r;
        });
        rows.forEach(function (r) { body.appendChild(r); });
        heads.forEach(function (h) { h.removeAttribute("aria-sort"); });
        b.parentNode.setAttribute("aria-sort", next === "asc" ? "ascending" : "descending");
      });
    });
    if (tb.hasAttribute("data-filterable")) {
      var group = d.querySelector(".filters");
      if (group) $$("[data-filter]", group).forEach(function (b) {
        b.addEventListener("click", function () {
          var f = b.getAttribute("data-filter");
          $$("[data-filter]", group).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          $$("tr", body).forEach(function (tr) { tr.hidden = !(f === "all" || tr.getAttribute("data-f") === f); });
        });
      });
    }
  });

  /* contact form -> prefilled e-mail */
  var cform = $("#cform"), cdata = json("#cform-data");
  if (cform && cdata) cform.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#cf-name").value, m = $("#cf-email").value, r = $("#cf-reason").value, t = $("#cf-msg").value;
    var body = t + "\n\n" + n + (m ? "\n" + m : "");
    location.href = "mailto:" + cdata.to + "?subject=" + encodeURIComponent(cdata.subject + " - " + r) + "&body=" + encodeURIComponent(body);
  });

  /* ------------------------------------------------------------------ the tool: does my part fit? */
  var TD = json("#tool-data");
  if (!TD) return;
  var T = TD.ui;
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n > 0 ? n : 0; }

  function latheStatus(m, D) {
    if (m.cap == null) return "unknown";
    if (D > m.cap) return "no";
    return D > 0.9 * m.cap ? "tight" : "fits";
  }
  function fitBox(x, y, z, dims) {
    /* dims: three part sizes, any orientation. returns {ok, ratio, assign:[dx,dy,dz], over:[bool,bool,bool]} for the best orientation */
    var best = null, idx = [0, 1, 2];
    idx.forEach(function (k) {
      var rest = idx.filter(function (i) { return i !== k; }).map(function (i) { return dims[i]; }).sort(function (a, b) { return b - a; });
      var xy = [x, y].slice().sort(function (a, b) { return b - a; });
      var big = xy[0], small = xy[1];
      var assign = x >= y ? [rest[0], rest[1], dims[k]] : [rest[1], rest[0], dims[k]];
      var ratio = Math.max(rest[0] / big, rest[1] / small, dims[k] / z);
      var over = [assign[0] > x, assign[1] > y, assign[2] > z];
      if (!best || ratio < best.ratio) best = { ok: ratio <= 1, ratio: ratio, assign: assign, over: over };
    });
    return best;
  }
  function millStatus(m, dims) {
    var r = fitBox(m.x, m.y, m.z, dims);
    if (r.ok) return { s: r.ratio > 0.92 ? "tight" : "fits", r: r };
    if (m.flag === "x") { var r2 = fitBox(1000, m.y, m.z, dims); if (r2.ok) return { s: "check", r: r }; }
    return { s: "no", r: r };
  }
  var ORDER = { fits: 0, tight: 1, check: 2, unknown: 3, no: 4 };
  function label(s) { return { fits: T.fits, tight: T.tight, no: T.no, unknown: T.unknown, check: T.check }[s]; }

  function evalState(st) {
    var out = { lathes: [], mills: [], nl: 0, nm: 0 };
    if (st.shape === "round") {
      var D = num(st.d);
      if (D) TD.lathes.forEach(function (m) { var s = latheStatus(m, D); out.lathes.push({ m: m, s: s }); if (s === "fits" || s === "tight") out.nl++; });
    } else {
      var dims = [num(st.l), num(st.w), num(st.h)];
      if (dims.every(Boolean)) TD.mills.forEach(function (m) { var r = millStatus(m, dims); out.mills.push({ m: m, s: r.s, r: r.r }); if (r.s === "fits" || r.s === "tight") out.nm++; });
    }
    return out;
  }
  function sentence(st, ev) {
    if (st.shape === "round") return T.fit_sentence_round.replace("{a}", ev.nl).replace("{b}", TD.lathes.length);
    return T.fit_sentence_box.replace("{c}", ev.nm).replace("{d}", TD.mills.length);
  }

  /* ---- teaser on the home page */
  var tz = $("[data-tease]");
  if (tz) (function () {
    var sentEl = $("[data-sentence]", tz), dotsEl = $("[data-dots]", tz), open = $("[data-open]", tz);
    function state() {
      var shape = ($("input[name=tshape]:checked", tz) || {}).value || "round";
      var s = { shape: shape };
      $$("[data-k]", tz).forEach(function (i) { s[i.getAttribute("data-k")] = i.value; });
      return s;
    }
    function draw() {
      var st = state();
      $$(".tease__f", tz).forEach(function (g) { g.hidden = g.getAttribute("data-g") !== st.shape; });
      var ev = evalState(st), rows = st.shape === "round" ? ev.lathes : ev.mills;
      sentEl.textContent = rows.length ? sentence(st, ev) : "";
      var label = st.shape === "round" ? T.res_lathes : T.res_mills;
      dotsEl.innerHTML = '<div class="dots__row"><span class="dots__l">' + label + '</span><div class="dots__g">' + rows.map(function (r) {
        var cls = r.s === "fits" ? "d--fit" : r.s === "tight" ? "d--tight" : r.s === "check" ? "d--tight" : r.s === "unknown" ? "d--na" : "d--no";
        return '<i class="d ' + cls + '" title="' + r.m.m + '"></i>';
      }).join("") + "</div></div>";
      var q = ["f=" + st.shape];
      (st.shape === "round" ? ["d", "len"] : ["l", "w", "h"]).forEach(function (k) { q.push(k + "=" + encodeURIComponent(st[k])); });
      open.setAttribute("href", TD.toolUrl + "?" + q.join("&"));
    }
    $$("input", tz).forEach(function (i) { i.addEventListener("input", draw); i.addEventListener("change", draw); });
    draw();
  })();

  /* ---- the full tool */
  var tool = $("[data-tool]");
  if (!tool) return;
  var st = { shape: "round", d: "50", len: "120", l: "300", w: "200", h: "100", off: false, fam: "", grade: -1, needs: [], qty: "1", treat: [], cert: [] };
  var sumEl = $("[data-sum]", tool), outM = $("[data-out-machines]", tool), outMat = $("[data-out-material]", tool), sugg = $("[data-suggest]", tool);
  var gradeBox = $("[data-gradebox]", tool), gradeWrap = $("[data-grades]", tool), prev = $("[data-preview]", tool), sendA = $("[data-send]", tool), copyB = $("[data-copy]", tool);

  function matsOf(fam) { return TD.mats.map(function (m, i) { m.i = i; return m; }).filter(function (m) { return m.f === fam; }); }
  function famLabel(f) { return TD.famNames[f] || f; }
  function dimText() {
    if (st.shape === "round") return "Ø " + nf2.format(num(st.d)) + " × " + nf2.format(num(st.len)) + " mm";
    return nf2.format(num(st.l)) + " × " + nf2.format(num(st.w)) + " × " + nf2.format(num(st.h)) + " mm";
  }
  function selGrade() { return st.grade >= 0 ? TD.mats[st.grade] : null; }
  function volume() {
    if (st.shape === "round") { var D = num(st.d), L = num(st.len); return D && L ? Math.PI * Math.pow(D / 2, 2) * L / 1000 : 0; }
    var a = num(st.l), b = num(st.w), c = num(st.h); return a && b && c ? a * b * c / 1000 : 0;
  }
  function fmtW(g) { return g >= 1000 ? nf2.format(g / 1000) + " kg" : nf1.format(g) + " g"; }
  function weightInfo() {
    var v = volume(); if (!v) return null;
    var g = selGrade();
    if (g && g.d) return { text: "≈ " + fmtW(v * g.d), sub: g.n + ", " + nf2.format(g.d) + " g/cm³" };
    if (g && !g.d) return { text: "—", sub: T.no_density };
    if (st.fam) {
      var ds = matsOf(st.fam).map(function (m) { return m.d; }).filter(Boolean);
      if (ds.length) { var lo = Math.min.apply(null, ds), hi = Math.max.apply(null, ds); return { text: "≈ " + fmtW(v * lo) + (lo !== hi ? " – " + fmtW(v * hi) : ""), sub: famLabel(st.fam) + ": " + nf2.format(lo) + (lo !== hi ? "–" + nf2.format(hi) : "") + " g/cm³" }; }
    }
    return null;
  }

  function renderMachines(ev) {
    var h = "";
    if (st.shape === "round") {
      var D = num(st.d);
      if (!D) { outM.innerHTML = ""; return; }
      h += '<p class="tsentence">' + sentence(st, ev) + "</p>";
      var hints = [];
      if (D >= TD.bar[0] && D <= TD.bar[1]) hints.push(T.bar_ok); else if (D > TD.bar[1] && D <= TD.single) hints.push(T.single_ok); else if (D > TD.single) hints.push(T.over);
      if (D <= TD.bar[1] && num(st.qty) >= 100) hints.push(T.feeder_hint);
      if (st.off) hints.push(T.axisy_hint);
      hints.push(T.len_note);
      h += '<div class="hints">' + hints.map(function (x) { return "<p>" + x + "</p>"; }).join("") + "</div>";
      var rows = ev.lathes.slice().sort(function (a, b) {
        var o = ORDER[a.s] - ORDER[b.s]; if (o) return o;
        if (st.off) { var ay = a.m.f.indexOf("axisY") >= 0 ? 0 : 1, by = b.m.f.indexOf("axisY") >= 0 ? 0 : 1; if (ay !== by) return ay - by; }
        return a.m.n - b.m.n;
      });
      h += '<div class="mlist"><div class="mlist__h"><span>' + T.res_lathes + '</span><span class="mono">' + ev.nl + " " + T.of + " " + TD.lathes.length + "</span></div>" + rows.map(function (r) {
        var m = r.m, tags = [];
        if (m.f.indexOf("axisY") >= 0) tags.push("asse Y");
        if (m.f.indexOf("feeder") >= 0) tags.push(LANG === "it" ? "spingibarra" : "bar feeder");
        var meta = "";
        if (m.cap != null) {
          var pct = Math.min(100, m.cap / 500 * 100), pos = Math.min(100, D / 500 * 100);
          meta = '<span class="capbar" aria-hidden="true"><i style="width:' + pct.toFixed(1) + '%"></i><b style="left:calc(' + pos.toFixed(1) + '% - 1px)"></b></span><span>' + T.lathe_cap + " " + m.cap + (m.bar ? " · bar " + m.bar : "") + (tags.length ? " · " + tags.join(" · ") : "") + "</span>";
        } else meta = "<span>" + T.unknown + "</span>";
        return '<div class="mrow mrow--' + r.s + '"><div class="mrow__n">' + m.m + "<small>" + m.b + '</small></div><span class="pill pill--' + r.s + '">' + label(r.s) + '</span><div class="mrow__m">' + meta + "</div></div>";
      }).join("") + "</div>";
    } else {
      var dims = [num(st.l), num(st.w), num(st.h)];
      if (!dims.every(Boolean)) { outM.innerHTML = ""; return; }
      h += '<p class="tsentence">' + sentence(st, ev) + "</p>";
      var rows2 = ev.mills.slice().sort(function (a, b) { var o = ORDER[a.s] - ORDER[b.s]; return o || a.m.n - b.m.n; });
      h += '<div class="mlist"><div class="mlist__h"><span>' + T.res_mills + '</span><span class="mono">' + ev.nm + " " + T.of + " " + TD.mills.length + "</span></div>" + rows2.map(function (r) {
        var m = r.m, ax = ["X " + m.x, "Y " + m.y, "Z " + m.z].map(function (t, i) { return '<span class="' + (r.r.over[i] ? "over" : "") + '">' + t + "</span>"; }).join("");
        var extra = r.s === "check" ? '<span>' + T.typo + "</span>" : "";
        return '<div class="mrow mrow--' + r.s + '"><div class="mrow__n">' + m.m + "<small>" + m.b + '</small></div><span class="pill pill--' + r.s + '">' + label(r.s) + '</span><div class="mrow__m"><span>' + T.stroke + ' mm</span><span class="axes">' + ax + "</span>" + extra + "</div></div>";
      }).join("") + "</div>";
    }
    outM.innerHTML = h;
  }

  function renderMaterial() {
    var h = "", g = selGrade();
    if (st.fam) {
      h += '<div class="matcard"><h3>' + (g ? g.n : famLabel(st.fam)) + "</h3>";
      if (g) {
        h += '<div class="props"><div><span>' + T.prop_t + "</span><b>" + nf0.format(g.t) + " MPa</b></div><div><span>" + T.prop_e + "</span><b>" + nf1.format(g.e) + " %</b></div><div><span>" + T.prop_d + "</span><b>" + (g.d ? nf2.format(g.d) + " g/cm³" : "—") + "</b></div><div><span>" + T.prop_h + "</span><b>" + (g.h ? g.h + " HB" : "—") + "</b></div></div>";
      } else if (TD.uses && TD.uses[st.fam]) h += "<p>" + TD.uses[st.fam] + "</p>";
      var wi = weightInfo();
      if (wi) h += '<div class="wbox"><span>' + T.weight + "</span><b>" + wi.text + "</b><small>" + wi.sub + " · " + T.weight_note + "</small></div>";
      var fp = TD.famPages && TD.famPages[st.fam];
      if (fp) h += '<a class="tlink" href="' + fp + '">' + T.read_more + "</a>";
      h += "</div>";
    }
    outMat.innerHTML = h;
  }

  function renderNeeds() {
    var recs = {};
    st.needs.forEach(function (k) { var n = TD.needs.filter(function (x) { return x.k === k; })[0]; if (n) n.fams.forEach(function (f) { recs[f] = (recs[f] || 0) + 1; }); });
    $$(".chip2", $("[data-fams]", tool)).forEach(function (lab) { var v = $("input", lab).value; lab.classList.toggle("is-rec", !!recs[v]); });
    if (!st.needs.length) { sugg.hidden = true; sugg.innerHTML = ""; return; }
    var items = st.needs.map(function (k) { var n = TD.needs.filter(function (x) { return x.k === k; })[0]; return n ? "<p><b>" + n.l + ":</b> " + n.s + "</p>" : ""; }).join("");
    var fams = Object.keys(recs).sort(function (a, b) { return recs[b] - recs[a]; }).map(famLabel).join(" · ");
    sugg.hidden = false;
    sugg.innerHTML = '<span class="lbl">' + T.suggest + "</span>" + items + "<p><b>" + fams + "</b></p>";
  }

  function renderGrades() {
    var list = st.fam ? matsOf(st.fam) : [];
    gradeBox.hidden = !list.length;
    if (!list.length) { gradeWrap.innerHTML = ""; return; }
    gradeWrap.innerHTML = '<label class="chip2"><input type="radio" name="grade" value="-1"' + (st.grade < 0 ? " checked" : "") + "><span>" + T.any_grade + "</span></label>" + list.map(function (m) {
      return '<label class="chip2"><input type="radio" name="grade" value="' + m.i + '"' + (st.grade === m.i ? " checked" : "") + "><span>" + m.n.replace(/^Acciaio /, "").replace(/^Alluminio /, "") + "</span></label>";
    }).join("");
  }

  function summaryText(ev) {
    var g = selGrade(), L = [];
    var shapeT = st.shape === "round" ? T.mail_round : T.mail_box;
    var line = T.mail_part + ": " + shapeT + ", " + dimText() + (st.shape === "round" && st.off ? " (" + T.offaxis.toLowerCase() + ")" : "");
    var mat = g ? g.n : st.fam ? famLabel(st.fam) + " (" + T.any_grade.toLowerCase() + ")" : T.any_grade;
    var qtyL = (TD.series.filter(function (s) { return s.k === st.qty; })[0] || {}).l || "";
    var tr = st.treat.map(function (k) { return (TD.treat.filter(function (x) { return x.k === k; })[0] || {}).l; }).filter(Boolean);
    var ce = st.cert.map(function (k) { return (TD.certs.filter(function (x) { return x.k === k; })[0] || {}).l; }).filter(Boolean);
    var okM = (st.shape === "round" ? ev.lathes : ev.mills).filter(function (r) { return r.s === "fits" || r.s === "tight"; }).map(function (r) { return r.m.m; });
    var chk = (st.shape === "round" ? ev.lathes : ev.mills).filter(function (r) { return r.s === "check"; }).map(function (r) { return r.m.m; });
    L.push(T.mail_greet, "", T.mail_intro, "", line, T.mail_mat + ": " + mat, T.mail_qty + ": " + qtyL, T.mail_treat + ": " + (tr.length ? tr.join("; ") : T.none), T.mail_cert + ": " + (ce.length ? ce.join("; ") : T.none));
    var tot = st.shape === "round" ? TD.lathes.length : TD.mills.length;
    L.push(T.mail_machines + ": " + okM.length + " " + T.of + " " + tot + (okM.length ? " (" + okM.join(", ") + ")" : "") + (chk.length ? "; " + T.check + ": " + chk.join(", ") : ""));
    var wi = weightInfo(); if (wi && wi.text !== "—") L.push(T.mail_weight + ": " + wi.text + " (" + wi.sub + ")");
    var notes = ($("#c-notes") || {}).value; if (notes) L.push(T.mail_notes + ": " + notes);
    L.push("", T.mail_bye, "");
    var who = [($("#c-name") || {}).value, ($("#c-company") || {}).value, ($("#c-email") || {}).value, ($("#c-phone") || {}).value].filter(Boolean);
    if (who.length) L.push(T.mail_from + ": " + who.join(" · "));
    return L.join("\n");
  }

  function update() {
    var ev = evalState(st);
    var shapeShort = st.shape === "round" ? T.round.split(",")[0] : T.box.split(",")[0];
    var g = selGrade();
    var parts = [shapeShort + " " + dimText()];
    parts.push(g ? g.n : st.fam ? famLabel(st.fam) : "—");
    var rows = st.shape === "round" ? ev.lathes : ev.mills;
    if (rows.length) parts.push((st.shape === "round" ? ev.nl + "/" + TD.lathes.length + " " + T.res_lathes.toLowerCase() : ev.nm + "/" + TD.mills.length + " " + T.res_mills.toLowerCase()));
    sumEl.textContent = parts.join(" · ");
    renderMachines(ev); renderMaterial();
    var text = summaryText(ev);
    prev.textContent = text;
    var subj = T.mail_subject + " - " + dimText() + (g ? " - " + g.n : "");
    sendA.setAttribute("href", "mailto:" + TD.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n")));
    safe(function () { var u = new URL(location.href); u.search = ""; });
  }

  function readInputs() {
    st.shape = $("input[name=shape]:checked", tool).value;
    ["d", "len", "l", "w", "h"].forEach(function (k) { var i = $("#" + k, tool); if (i) st[k] = i.value; });
    st.off = $("input[name=offaxis]", tool).checked;
    st.qty = $("input[name=qty]:checked", tool).value;
    st.treat = $$("input[name=treat]:checked", tool).map(function (i) { return i.value; });
    st.cert = $$("input[name=cert]:checked", tool).map(function (i) { return i.value; });
    st.needs = $$("input[name=need]:checked", tool).map(function (i) { return i.value; });
    $$("[data-group]", tool).forEach(function (g) { g.hidden = g.getAttribute("data-group") !== st.shape; });
  }

  tool.addEventListener("input", function (e) { readInputs(); update(); });
  tool.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "fam") { st.fam = t.value; st.grade = -1; renderGrades(); }
    else if (t.name === "grade") st.grade = parseInt(t.value, 10);
    readInputs(); if (t.name === "need") renderNeeds(); update();
  });
  $$("[data-preset]", tool).forEach(function (b) {
    b.addEventListener("click", function () { var i = $("#d", tool); i.value = b.getAttribute("data-preset"); st.d = i.value; readInputs(); update(); });
  });
  if (copyB) copyB.addEventListener("click", function () {
    var txt = prev.textContent, done = copyB.getAttribute("data-done"), old = copyB.textContent;
    function ok() { copyB.textContent = done; setTimeout(function () { copyB.textContent = old; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () {});
    else { var ta = d.createElement("textarea"); ta.value = txt; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); ta.remove(); ok(); }
  });

  /* prefill from the URL: ?f=round&d=50&len=120 | ?f=box&l=&w=&h= | ?m=alluminio */
  (function () {
    var q = new URLSearchParams(location.search);
    if (q.get("f") === "box") { $("input[name=shape][value=box]", tool).checked = true; }
    ["d", "len", "l", "w", "h"].forEach(function (k) { if (q.get(k)) { var i = $("#" + k, tool); if (i) i.value = q.get(k); } });
    var m = q.get("m");
    if (m && TD.fams.indexOf(m) >= 0) { var r = $("input[name=fam][value=" + m + "]", tool); if (r) { r.checked = true; st.fam = m; } }
    readInputs(); renderGrades(); renderNeeds(); update();
  })();
})();
