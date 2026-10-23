(function () {
  "use strict";
  var D = document, root = D.documentElement;
  var DATA = window.__DATA || {};
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var fi1 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 });
  var fi0 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- header, drawer ---------- */
  var hdr = $(".hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 24); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var drawer = $("#drawer"), burger = $("#burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a,button", drawer); if (f) f.focus(); } else if (burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  $$("[data-close-drawer]").forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ---------- dock ---------- */
  var dock = $(".dock");
  if (dock) {
    if (store("dock-x") === "1") dock.hidden = true;
    $(".dock button", dock).addEventListener("click", function () { dock.hidden = true; store("dock-x", "1"); });
  }

  /* ---------- reveal (with a sweep that never strands content) ---------- */
  root.classList.add("js");
  var rv = $$(".rv, .bar");
  function show(el) { el.classList.add("in"); }
  function sweep() { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }
  if ("IntersectionObserver" in window && !RM) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---------- press scene ---------- */
  function el(tag, attrs, parent) { var n = D.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  var VW = 640, VH = 440, CX = 320, YD = 170;
  function Scene(svg) {
    svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
    svg.setAttribute("role", "img");
    this.svg = svg;
    var g = el("g", {}, svg), i;
    for (i = 0; i <= VW; i += 40) el("line", { x1: i, y1: 0, x2: i, y2: VH, "class": "bg-grid" }, g);
    for (i = 0; i <= VH; i += 40) el("line", { x1: 0, y1: i, x2: VW, y2: i, "class": "bg-grid" }, g);
    this.die = el("path", { "class": "die" }, svg);
    this.groove = el("path", { "class": "groove-line" }, svg);
    this.guideL = el("line", { "class": "dim-guide" }, svg);
    this.guideR = el("line", { "class": "dim-guide" }, svg);
    this.plate = el("polygon", { "class": "plate" }, svg);
    this.top = el("polyline", { "class": "plate-top" }, svg);
    this.glow = el("ellipse", { "class": "glow", rx: 26, ry: 10 }, svg);
    this.punch = el("polygon", { "class": "punch" }, svg);
    this.tip = el("polygon", { "class": "tip" }, svg);
    this.dim = el("path", { "class": "dim" }, svg);
    this.dimT = el("text", { "class": "lbl", "text-anchor": "middle", x: CX, y: VH - 8 }, svg);
    this.sT = el("text", { "class": "lbl lbl-o", "text-anchor": "start" }, svg);
    this.state = { t: 10, V: 80, p: 1 };
  }
  Scene.prototype.set = function (s) {
    for (var k in s) this.state[k] = s[k];
    var t = this.state.t, V = this.state.V, p = Math.max(0, Math.min(1, this.state.p));
    var W = 120 + 160 * Math.sqrt(V / 315), tp = Math.max(4, W * t / V);
    var phi = p * Math.PI / 4, c = Math.cos(phi), sn = Math.sin(phi), tn = Math.tan(phi);
    var xl = CX - W / 2, xr = CX + W / 2, ap = YD + (W / 2) * tn, up = tp / c, L = 232;
    this.die.setAttribute("d", "M20 " + YD + "H" + xl + "L" + CX + " " + (YD + W / 2) + "L" + xr + " " + YD + "H620V395H20Z");
    this.groove.setAttribute("d", "M" + xl + " " + YD + "L" + CX + " " + (YD + W / 2) + "L" + xr + " " + YD);
    var dy = VH - 28;
    this.guideL.setAttribute("x1", xl); this.guideL.setAttribute("x2", xl); this.guideL.setAttribute("y1", YD); this.guideL.setAttribute("y2", dy);
    this.guideR.setAttribute("x1", xr); this.guideR.setAttribute("x2", xr); this.guideR.setAttribute("y1", YD); this.guideR.setAttribute("y2", dy);
    this.dim.setAttribute("d", "M" + xl + " " + dy + "H" + xr + "M" + xl + " " + (dy - 7) + "V" + (dy + 7) + "M" + xr + " " + (dy - 7) + "V" + (dy + 7));
    this.dimT.textContent = "V " + fi0.format(V) + " mm"; this.dimT.setAttribute("y", dy + 22);
    var lx = CX - L * c, rx = CX + L * c, ly = ap - L * sn;
    var pts = [[lx, ly], [CX, ap], [rx, ly], [rx, ly - up], [CX, ap - up], [lx, ly - up]];
    this.plate.setAttribute("points", pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "));
    this.top.setAttribute("points", [pts[5], pts[4], pts[3]].map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "));
    var ty = ap - up;
    var hw = 56;
    this.punch.setAttribute("points", [[CX, ty], [CX - hw, ty - 90], [CX - hw, -10], [CX + hw, -10], [CX + hw, ty - 90]].map(function (q) { return q[0] + "," + q[1].toFixed(1); }).join(" "));
    this.tip.setAttribute("points", [[CX, ty], [CX - 14, ty - 22], [CX + 14, ty - 22]].map(function (q) { return q[0] + "," + q[1].toFixed(1); }).join(" "));
    this.glow.setAttribute("cx", CX); this.glow.setAttribute("cy", ty + 3); this.glow.style.opacity = (0.12 + 0.3 * p).toFixed(2);
    this.sT.textContent = "S " + fi1.format(t) + " mm";
    this.sT.setAttribute("x", Math.max(10, lx - 4)); this.sT.setAttribute("y", Math.max(22, ly - up - 14));
    this.svg.setAttribute("aria-label", "Poikkileikkaus: levy, paksuus " + fi1.format(t) + " mm, taivutetaan V-aukkoon " + fi0.format(V) + " mm, kulma " + Math.round(180 - 2 * p * 45) + " astetta");
  };
  Scene.prototype.play = function (ms, from, done) {
    var self = this, s = this.state, t0 = null;
    if (RM) { self.set({ p: 1 }); if (done) done(); return; }
    cancelAnimationFrame(this.raf);
    function ease(x) { return 1 - Math.pow(1 - x, 3); }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var x = Math.min(1, (ts - t0) / ms);
      self.set({ p: from + (1 - from) * ease(x) });
      if (x < 1) self.raf = requestAnimationFrame(step); else if (done) done();
    }
    self.set({ p: from });
    this.raf = requestAnimationFrame(step);
  };
  function visibleOnce(node, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: 0.35 });
    o.observe(node);
  }

  /* ---------- bending data ---------- */
  var ROWS = DATA.rows || [], PRESS = DATA.presses || [];
  var TH = [];
  ROWS.forEach(function (r) { Object.keys(r.F).forEach(function (k) { var n = parseFloat(k); if (TH.indexOf(n) < 0) TH.push(n); }); });
  TH.sort(function (a, b) { return a - b; });
  function rowsFor(t) { return ROWS.filter(function (r) { return r.F[String(t)] !== undefined; }); }
  function defV(t) { var rs = rowsFor(t), best = rs[0]; rs.forEach(function (r) { if (Math.abs(r.V - 8 * t) < Math.abs(best.V - 8 * t)) best = r; }); return best.V; }

  /* ---------- hero scene ---------- */
  var heroSvg = $("[data-hero-press]");
  if (heroSvg) {
    var hs = new Scene(heroSvg); hs.set({ t: 10, V: 80, p: 1 });
    if (!RM) setTimeout(function () { hs.play(1900, 0); }, 350);
  }

  /* ---------- instrument ---------- */
  var ins = $("[data-instrument]");
  if (ins && ROWS.length) {
    var sc = new Scene($("svg.press", ins));
    var rT = $("[data-t]", ins), rL = $("[data-len]", ins), sV = $("[data-v]", ins);
    var oT = $("[data-t-out]", ins), oL = $("[data-len-out]", ins);
    var outF = $("[data-f]", ins), outTot = $("[data-total]", ins), outR = $("[data-r]", ins), outA = $("[data-a]", ins), outAng = $("[data-ang]", ins);
    var prs = $$(".pr", ins), over = $(".over", ins), wear = $("[data-wear]", ins), rfqBtn = $("[data-rfq-spec]", ins);
    rT.min = 0; rT.max = TH.length - 1; rT.step = 1; rT.value = TH.indexOf(10);
    var st = { t: 10, V: defV(10), L: 2 };
    function fill(inp) { var f = (inp.value - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty("--fill", f + "%"); }
    function row() { return rowsFor(st.t).filter(function (r) { return r.V === st.V; })[0]; }
    function fillV() {
      var rs = rowsFor(st.t); sV.innerHTML = "";
      rs.forEach(function (r) { var o = D.createElement("option"); o.value = r.V; o.textContent = fi0.format(r.V) + " mm · " + fi1.format(r.F[String(st.t)]) + " t/m"; sV.appendChild(o); });
      if (!rs.some(function (r) { return r.V === st.V; })) st.V = defV(st.t);
      sV.value = st.V;
    }
    function render(replay) {
      var r = row(), f = r.F[String(st.t)], tot = f * st.L;
      oT.textContent = fi1.format(st.t) + " mm"; oL.textContent = fi1.format(st.L) + " m";
      outF.textContent = fi1.format(f); outTot.textContent = fi0.format(Math.round(tot));
      outR.textContent = fi1.format(r.R) + " mm"; outA.textContent = fi1.format(r.A) + " mm";
      wear.innerHTML = "Kulutusteräs 400: sisäsäde pitkittäin vähintään <b>" + fi1.format(st.t * 4) + " mm</b>, poikittain <b>" + fi1.format(st.t * 3) + " mm</b>, V-aukko vähintään <b>" + fi0.format(st.t * 10) + " mm</b>.";
      var picked = false;
      prs.forEach(function (p, i) {
        var cap = PRESS[i][1], len = PRESS[i][2], ok = tot <= cap && st.L * 1000 <= len;
        p.classList.toggle("is-ok", ok); p.classList.toggle("is-no", !ok);
        var pick = ok && !picked; if (pick) picked = true;
        p.classList.toggle("is-pick", pick);
        $(".badge", p).textContent = pick ? "Sopii" : ok ? "Sopii myös" : (tot > cap ? "Voima ylittyy" : "Liian lyhyt");
        p.style.setProperty("--use", Math.min(100, tot / cap * 100) + "%");
      });
      over.classList.toggle("is-on", !picked);
      fill(rT); fill(rL);
      sc.set({ t: st.t, V: st.V });
      if (replay) sc.play(1100, 0); else sc.set({ p: 1 });
      var ang = 90; outAng.textContent = ang + "°";
      if (rfqBtn) rfqBtn.setAttribute("data-spec", "Särmäys: levy S " + fi1.format(st.t) + " mm (S355), V-aukko " + fi0.format(st.V) + " mm, kappaleen pituus " + fi1.format(st.L) + " m, 90° taive. Taulukon mukainen voima " + fi1.format(f) + " t/m, yhteensä noin " + fi0.format(Math.round(tot)) + " t.");
      window.__bend = { t: st.t, V: st.V };
      D.dispatchEvent(new CustomEvent("bend:change", { detail: { t: st.t, V: st.V } }));
    }
    rT.addEventListener("input", function () { st.t = TH[+rT.value]; fillV(); render(false); });
    sV.addEventListener("change", function () { st.V = +sV.value; render(false); });
    rL.addEventListener("input", function () { st.L = +rL.value; render(false); });
    $("[data-play]", ins).addEventListener("click", function () { sc.play(1100, 0); });
    fillV(); render(false); sc.set({ p: 0 });
    visibleOnce(ins, function () { sc.play(1300, 0); });
    if (RM) sc.set({ p: 1 });
  }

  /* ---------- bend table filter ---------- */
  var tbl = $("table.bend");
  if (tbl) {
    var q = $("#tq"), cols = $$("thead th[data-c]", tbl), trs = $$("tbody tr", tbl);
    function hi(tv, vv) {
      $$(".hot,.sel", tbl).forEach(function (n) { n.classList.remove("hot", "sel"); });
      var ci = -1; cols.forEach(function (c, i) { if (parseFloat(c.dataset.c) === tv) ci = i; });
      if (ci >= 0) cols[ci].classList.add("hot");
      trs.forEach(function (tr) {
        var isV = parseFloat(tr.dataset.v) === vv;
        if (isV) tr.classList.add("hot");
        if (ci >= 0) { var td = $$("td", tr)[ci + 3]; if (td && td.dataset.has) { td.classList.add("hot"); if (isV) td.classList.add("sel"); } }
      });
    }
    function filt() {
      var v = parseFloat(String(q.value).replace(",", "."));
      trs.forEach(function (tr) { var has = isNaN(v) ? true : !!$("td[data-t='" + v + "']", tr); tr.classList.toggle("dim", !has); });
      if (!isNaN(v)) { cols.forEach(function (c) { c.classList.toggle("hot", parseFloat(c.dataset.c) === v); }); }
    }
    q.addEventListener("input", filt);
    D.addEventListener("bend:change", function (e) { hi(e.detail.t, e.detail.V); });
    if (window.__bend) hi(window.__bend.t, window.__bend.V);
  }

  /* ---------- hours badge (Europe/Helsinki) ---------- */
  var hb = $("[data-now]");
  if (hb) {
    try {
      var parts = new Intl.DateTimeFormat("fi-FI", { timeZone: "Europe/Helsinki", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var wd = parts.filter(function (p) { return p.type === "weekday"; })[0].value, h = +parts.filter(function (p) { return p.type === "hour"; })[0].value, m = +parts.filter(function (p) { return p.type === "minute"; })[0].value;
      var weekday = ["ma", "ti", "ke", "to", "pe"].indexOf(wd.replace(".", "").toLowerCase().slice(0, 2)) >= 0, now = h + m / 60;
      var o = weekday && now >= 7 && now < 15;
      hb.classList.toggle("open", o);
      hb.textContent = o ? "Toimisto auki nyt (ma–pe 7–15)" : "Toimisto suljettu (ma–pe 7–15)";
    } catch (e) { hb.textContent = "Toimisto ma–pe 7–15"; }
  }

  /* ---------- services nav scroll-spy ---------- */
  var sn = $$(".svcnav a");
  if (sn.length && "IntersectionObserver" in window) {
    var secs = sn.map(function (a) { return D.getElementById(a.getAttribute("href").split("#")[1]); }).filter(Boolean);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) sn.forEach(function (a) { var on = a.getAttribute("href").split("#")[1] === e.target.id; a.classList.toggle("is-on", on); if (on) a.scrollIntoView({ inline: "center", block: "nearest" }); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* ---------- map on tap ---------- */
  var mb = $("[data-map]");
  if (mb) $("button", mb).addEventListener("click", function () { var f = D.createElement("iframe"); f.src = mb.dataset.map; f.title = "Kartta: Hepolamminkatu 17–19, Tampere"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; mb.innerHTML = ""; mb.appendChild(f); });

  /* ---------- RFQ: sheet + mailto ---------- */
  var MAIL = DATA.mail || "";
  function composeMail(form, spec) {
    var f = new FormData(form), svc = f.getAll("svc");
    var lines = [];
    if (f.get("need")) lines.push(String(f.get("need")));
    if (spec) lines.push("", spec);
    if (svc.length) lines.push("", "Palvelut: " + svc.join(", "));
    lines.push("");
    if (f.get("name")) lines.push("Nimi: " + f.get("name"));
    if (f.get("company")) lines.push("Yritys: " + f.get("company"));
    lines.push("Yhteystieto: " + f.get("contact"), "", "(Piirustukset liitteenä.)");
    var subj = "Tarjouspyyntö" + (f.get("company") ? " – " + f.get("company") : "");
    return "mailto:" + MAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(lines.join("\r\n"));
  }
  $$("form[data-rfq-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var spec = form.dataset.spec || "";
      var url = composeMail(form, spec);
      form.dispatchEvent(new CustomEvent("rfq:mail", { bubbles: true, detail: url }));
      location.href = url;
    });
  });
  var dlg = $("#rfq");
  if (dlg && typeof dlg.showModal === "function") {
    var dform = $("form", dlg), last = null;
    function openRfq(spec, from) {
      last = from || null;
      dform.dataset.spec = spec || "";
      var note = $("[data-spec-note]", dlg); note.textContent = spec || ""; note.hidden = !spec;
      dlg.showModal(); root.style.overflow = "hidden";
      var first = $("[name=need]", dlg); if (first) setTimeout(function () { first.focus(); }, 60);
    }
    function closeRfq() { dlg.close(); }
    dlg.addEventListener("close", function () { root.style.overflow = ""; if (last) last.focus({ preventScroll: true }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeRfq(); });
    $$("[data-rfq-close]", dlg).forEach(function (b) { b.addEventListener("click", closeRfq); });
    $$("a[data-rfq]").forEach(function (a) {
      a.addEventListener("click", function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); if (drawer && drawer.classList.contains("is-open")) setDrawer(false); openRfq("", a); });
    });
    $$("[data-rfq-spec]").forEach(function (b) { b.addEventListener("click", function () { openRfq(b.getAttribute("data-spec") || "", b); }); });
  } else {
    $$("[data-rfq-spec]").forEach(function (b) { b.addEventListener("click", function () { location.href = b.dataset.fallback; }); });
  }
})();
