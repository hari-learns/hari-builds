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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); var dl = $("#vdlg"); if (dl && dl.open) closeVideo(); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("ukp-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("ukp-dock", "1"); }); });

  /* reveals with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el, i) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.8) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* video facade -> dialog */
  var vlink = $("[data-video]"), vdlg = $("#vdlg"), vframe = null;
  function closeVideo() { if (vdlg && vdlg.open) vdlg.close(); }
  if (vlink && vdlg && typeof vdlg.showModal === "function") {
    vlink.addEventListener("click", function (e) {
      e.preventDefault();
      vframe = d.createElement("iframe");
      vframe.src = "https://www.youtube-nocookie.com/embed/" + vlink.getAttribute("data-video") + "?autoplay=1&rel=0";
      vframe.title = vdlg.getAttribute("aria-label") || "";
      vframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      vframe.setAttribute("allowfullscreen", "");
      vdlg.appendChild(vframe); vdlg.showModal();
    });
    vdlg.addEventListener("close", function () { if (vframe) { vframe.remove(); vframe = null; } });
    vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
    $$("[data-vclose]", vdlg).forEach(function (b) { b.addEventListener("click", function () { vdlg.close(); }); });
  }

  /* ------------------------------------------------ the instrument: does the part fit? */
  var gEl = $("[data-gauge]");
  if (gEl) (function () {
    var data = JSON.parse($("#gauge-data").textContent), ms = data.machines, ui = data.ui, BASE = data.base;
    var rowsEl = $("[data-rows]", gEl), sumEl = $("[data-sum]", gEl), warnEl = $("[data-warn]", gEl), ctaEl = $("[data-cta]", gEl);
    var S = 0.2, VW = 1000, VH = 380; /* 1000 svg units = 5000 mm */
    var st = { shape: "box", l: 1200, w: 800, h: 600, d: 400, len: 1500, kg: 600 };
    var shown = { a: st.l, b: st.w, c: st.h };
    var NS = "http://www.w3.org/2000/svg";
    var rows = {};

    function perms(a) { return [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(function (p) { return [a[p[0]], a[p[1]], a[p[2]]]; }); }
    function partDims() { return st.shape === "box" ? [st.l, st.w, st.h] : [st.d, st.d, st.len]; }
    function evalMachine(m) {
      var kgBad = m.maxkg && st.kg > m.maxkg;
      if (m.kind === "other") return { s: "nodata", why: "" };
      if (m.kind === "lathe") {
        if (st.shape === "box") return { s: "na", why: "" };
        var over = [];
        if (st.d > m.dia) over.push("ø +" + (st.d - m.dia) + " mm");
        if (st.len > m.len) over.push(ui.f_len.toLowerCase() + " +" + (st.len - m.len) + " mm");
        return over.length ? { s: "no", why: over.join(", ") } : { s: "ok", why: "" };
      }
      var best = null, bestO = Infinity, fit = null;
      perms(partDims()).forEach(function (p) {
        var o = [Math.max(0, p[0] - m.x), Math.max(0, p[1] - m.y), Math.max(0, p[2] - m.z)];
        var t = o[0] + o[1] + o[2];
        if (t === 0 && !fit) fit = p;
        if (t < bestO) { bestO = t; best = { p: p, o: o }; }
      });
      if (fit && !kgBad) return { s: "ok", p: fit, why: "" };
      var why = [];
      if (!fit) { ["x", "y", "z"].forEach(function (a, i) { if (best.o[i] > 0) why.push(a + " +" + best.o[i] + " mm"); }); }
      if (kgBad) why.push(ui.f_kg.toLowerCase() + " > " + m.maxkg + " kg");
      return { s: "no", p: (fit || best.p), why: why.join(", ") };
    }
    function el(n, a) { var e = d.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

    function build() {
      var groupSeen = {};
      ms.forEach(function (m) {
        var row = d.createElement("div"); row.className = "mrow";
        var h = d.createElement("div"); h.className = "mrow__h";
        var t = d.createElement("div");
        var n = d.createElement("p"); n.className = "mrow__n"; n.textContent = m.name;
        var s = d.createElement("p"); s.className = "mrow__s";
        var spec = [];
        if (m.kind === "mill") spec.push("x " + m.x + " · y " + m.y + " · z " + m.z);
        if (m.kind === "lathe") spec.push("ø " + m.dia + " · " + m.len);
        if (m.spec) spec.push(m.spec);
        s.textContent = spec.join(" · ");
        t.appendChild(n); t.appendChild(s);
        var b = d.createElement("span"); b.className = "badge";
        h.appendChild(t); h.appendChild(b); row.appendChild(h);
        var why = d.createElement("p"); why.className = "mrow__why";
        var vis = d.createElement("div"); vis.className = "vis";
        var r = { row: row, badge: b, why: why, m: m, vis: vis };
        if (m.kind !== "other") {
          var ew = (m.kind === "mill" ? m.x : m.len) * S, eh = (m.kind === "mill" ? m.y : m.dia) * S;
          var rvh = Math.max(150, Math.round(eh + 44));
          var svg = el("svg", { viewBox: "0 0 " + VW + " " + rvh, "aria-hidden": "true", preserveAspectRatio: "xMinYMin meet" });
          for (var i = 0; i <= 5; i++) svg.appendChild(el("line", { class: "tick", x1: i * 1000 * S, x2: i * 1000 * S, y1: 0, y2: rvh, opacity: ".18" }));
          r.envF = el("rect", { class: "env-f env", x: 0, y: 0, width: ew, height: eh });
          r.part = el("rect", { class: "part", x: 0, y: 0, width: 0, height: 0 });
          var clip = el("clipPath", { id: "cp-" + m.id }); clip.appendChild(el("rect", { x: 0, y: 0, width: VW, height: rvh }));
          svg.appendChild(clip);
          var g = el("g", { "clip-path": "url(#cp-" + m.id + ")" }); g.appendChild(r.envF); g.appendChild(r.part); svg.appendChild(g);
          vis.appendChild(svg); row.appendChild(vis);
        }
        row.appendChild(why);
        rowsEl.appendChild(row); rows[m.id] = r;
      });
    }

    function geom() { /* part rectangles from shown (animated) numbers */
      ms.forEach(function (m) {
        var r = rows[m.id]; if (!r.part) return;
        var ev = r.ev; if (!ev || ev.s === "na") { r.part.setAttribute("width", 0); r.part.setAttribute("height", 0); return; }
        var w, h;
        if (m.kind === "lathe") { w = shown.c * S; h = shown.a * S; }
        else {
          var p = ev.p || partDims(), k = st.shape === "box" ? [shown.a, shown.b, shown.c] : [shown.a, shown.a, shown.c];
          /* map displayed values onto the chosen axis order so the animation follows the same orientation */
          var cur = partDims(), idx = [0, 1, 2].map(function (i) { return cur.indexOf(p[i]); });
          var used = {}; idx = idx.map(function (j, i) { if (j < 0 || used[j]) { for (var q = 0; q < 3; q++) if (!used[q]) { j = q; break; } } used[j] = 1; return j; });
          w = k[idx[0]] * S; h = k[idx[1]] * S;
        }
        r.part.setAttribute("width", Math.max(0, w)); r.part.setAttribute("height", Math.max(0, h));
      });
    }

    function evaluate() {
      var ok = 0, total = 0;
      ms.forEach(function (m) {
        var r = rows[m.id], ev = evalMachine(m); r.ev = ev;
        r.row.classList.toggle("is-ok", ev.s === "ok"); r.row.classList.toggle("is-no", ev.s === "no" || ev.s === "na");
        var map = { ok: ui.ok, no: ui.no, na: ui.na, nodata: ui.nodata };
        r.badge.textContent = map[ev.s]; r.badge.className = "badge " + (ev.s === "ok" ? "ok" : ev.s === "no" ? "no" : "na");
        var w = ev.why || "";
        if (ev.s === "ok" && m.kind === "mill" && !m.maxkg) w = ui.weight_nodata;
        r.why.textContent = w; r.why.hidden = !w;
        if (m.kind !== "other" && ev.s !== "na") total += 1; if (ev.s === "ok") ok += 1;
      });
      total = ms.filter(function (m) { return m.kind !== "other"; }).length;
      sumEl.innerHTML = ok ? ui.sum_fmt.replace("{n}", "<b>" + ok + "</b>").replace("{m}", total) : ui.sum_none;
      warnEl.hidden = !(st.kg > data.liftKg);
      var q = new URLSearchParams({ shape: st.shape, kg: st.kg });
      if (st.shape === "box") { q.set("l", st.l); q.set("w", st.w); q.set("h", st.h); } else { q.set("d", st.d); q.set("len", st.len); }
      ctaEl.setAttribute("href", BASE + "/tarjouspyynto/?" + q.toString());
    }

    var raf = 0;
    function target() { var p = partDims(); return { a: p[0], b: p[1], c: p[2] }; }
    function tick() {
      var t = target(), done = true;
      ["a", "b", "c"].forEach(function (k) { var diff = t[k] - shown[k]; if (Math.abs(diff) > 0.5) { shown[k] += diff * 0.22; done = false; } else shown[k] = t[k]; });
      geom(); raf = done ? 0 : requestAnimationFrame(tick);
    }
    function update() {
      evaluate();
      if (reduce) { var t = target(); shown = { a: t.a, b: t.b, c: t.c }; geom(); }
      else if (!raf) raf = requestAnimationFrame(tick);
    }

    function setVal(k, v, from) {
      v = Number(v); if (!isFinite(v)) return;
      var n = $("#n-" + k, gEl), r = $('[data-r="' + k + '"]', gEl);
      var lo = Number(n.min), hi = Number(n.max);
      st[k] = Math.max(lo, Math.min(hi, Math.round(v)));
      if (from !== "n") n.value = st[k];
      if (from !== "r") r.value = st[k];
      update();
    }
    $$("[data-f]", gEl).forEach(function (f) {
      var k = f.getAttribute("data-f");
      $("input[type=number]", f).addEventListener("input", function (e) { if (e.target.value !== "") setVal(k, e.target.value, "n"); });
      $("input[type=number]", f).addEventListener("change", function (e) { setVal(k, e.target.value || st[k]); });
      $("input[type=range]", f).addEventListener("input", function (e) { setVal(k, e.target.value, "r"); });
    });
    $$("input[name=shape]", gEl).forEach(function (r) {
      r.addEventListener("change", function () {
        st.shape = r.value;
        $$("[data-group]", gEl).forEach(function (g) { g.hidden = g.getAttribute("data-group") !== st.shape; });
        shown = { a: shown.a, b: shown.b, c: shown.c }; update();
      });
    });
    $$("[data-preset]", gEl).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = JSON.parse(b.getAttribute("data-preset"));
        var shape = $("input[name=shape][value=box]", gEl); if (!shape.checked) { shape.checked = true; shape.dispatchEvent(new Event("change")); }
        setVal("l", p[0]); setVal("w", p[1]); setVal("h", p[2]); setVal("kg", p[3]);
      });
    });
    build(); evaluate(); (function () { var t = target(); shown = { a: t.a, b: t.b, c: t.c }; geom(); })();
  })();

  /* ------------------------------------------------ RFQ form -> mailto */
  var rfq = $("#rfq");
  if (rfq) (function () {
    var cfg = JSON.parse($("#rfq-data").textContent), L = cfg.labels, q = new URLSearchParams(location.search);
    function num(k, lo, hi) { var v = Number(q.get(k)); return isFinite(v) && v >= lo && v <= hi ? Math.round(v) : null; }
    var shape = q.get("shape") === "round" ? "round" : "box", kg = num("kg", 1, 10000);
    if (shape === "box") {
      var l = num("l", 10, 5000), w = num("w", 10, 5000), h = num("h", 10, 5000);
      if (l && w && h) $("#dims").value = l + " x " + w + " x " + h;
    } else {
      var dd = num("d", 10, 1000), ln = num("len", 10, 5000);
      if (dd && ln) $("#dims").value = "ø" + dd + " x " + ln;
    }
    if (kg) $("#weight").value = kg;
    function text() {
      var ids = ["name", "company", "email", "phone", "part", "dims", "weight", "qty", "material", "need", "notes"], out = [];
      ids.forEach(function (id) { var v = $("#" + id).value.trim(); if (v) out.push(L[id] + ": " + v); });
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
