/* Landa Ebanistería concept. One IIFE, every feature guarded. No libraries. */
(function () {
  "use strict";
  var d = document, root = d.documentElement, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  root.classList.add("is-ready");

  /* ---------- reveals ---------- */
  var rv = $$(".reveal");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    addEventListener("scroll", sweep, { passive: true }); addEventListener("load", sweep); addEventListener("resize", sweep); addEventListener("pageshow", sweep); sweep();
  }

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && bx) bx.focus(); else if (!open && burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* ---------- dock ---------- */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (dock && sessionStorage.getItem("landa_dock") === "1") dock.hidden = true; } catch (e) {}
  if (dock) { var hid = false; addEventListener("scroll", function () { if (!hid && scrollY > 160) { hid = true; dock.hidden = true; } }, { passive: true }); }
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("landa_dock", "1"); } catch (e) {} });

  /* ---------- dossier store (shared by every page) ---------- */
  var KEY = "landa_dossier", mem = [], subs = [];
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(v)) mem = v; } catch (e) {} return mem; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} subs.forEach(function (f) { f(mem); }); }
  var Dossier = {
    get: function () { return mem.slice(); }, has: function (s) { return mem.indexOf(s) > -1; },
    toggle: function (s) { var i = mem.indexOf(s); if (i > -1) mem.splice(i, 1); else mem.push(s); save(); return i < 0; },
    remove: function (s) { var i = mem.indexOf(s); if (i > -1) { mem.splice(i, 1); save(); } }, clear: function () { mem = []; save(); },
    on: function (f) { subs.push(f); f(mem); }
  };
  load();
  addEventListener("storage", function (e) { if (e.key === KEY) { load(); subs.forEach(function (f) { f(mem); }); } });
  function paintCounts() {
    $$("[data-dcount]").forEach(function (el) { el.textContent = mem.length; el.hidden = mem.length === 0; });
    $$(".addbtn[data-slug]").forEach(function (b) {
      var on = Dossier.has(b.getAttribute("data-slug")); b.setAttribute("aria-pressed", on ? "true" : "false");
      var t = b.querySelector("[data-t]"); if (t) t.textContent = on ? b.getAttribute("data-on") : b.getAttribute("data-off");
    });
  }
  Dossier.on(paintCounts);
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".addbtn[data-slug]"); if (!b) return;
    e.preventDefault(); Dossier.toggle(b.getAttribute("data-slug"));
  });

  /* ---------- hero client switcher ---------- */
  var stage = $("#hero-stage");
  if (stage) {
    var imgs = $$("img", stage), btns = $$("[data-slide]"), cap = $("#hero-cap"), capA = $("#hero-cap-link"), cur = 0, timer = null, paused = reduce, hydrated = false;
    var pause = $("#hero-pause");
    function hydrate() {
      if (hydrated) return; hydrated = true;
      imgs.forEach(function (im) { if (im.getAttribute("data-src")) { if (im.getAttribute("data-srcset")) im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); } });
    }
    function go(i, user) {
      hydrate(); cur = (i + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle("is-on", k === cur); });
      btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === cur ? "true" : "false"); });
      var b = btns[cur]; if (cap && b) { cap.textContent = b.getAttribute("data-cap"); capA.setAttribute("href", b.getAttribute("data-href")); }
      if (user) { paused = true; paintPause(); stop(); }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function paintPause() { if (!pause) return; pause.setAttribute("aria-pressed", paused ? "true" : "false"); pause.textContent = pause.getAttribute(paused ? "data-play" : "data-pause"); }
    if (pause && !reduce) { pause.hidden = false; pause.addEventListener("click", function () { paused = !paused; paintPause(); if (paused) stop(); else start(); }); }
    function start() { stop(); if (paused || reduce) return; timer = setInterval(function () { if (!d.hidden) go(cur + 1); }, 8000); }
    btns.forEach(function (b, k) { b.addEventListener("click", function () { go(k, true); }); });
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
    addEventListener("load", function () { idle(function () { hydrate(); start(); }); });
    if (stage.addEventListener) { stage.addEventListener("pointerenter", stop); stage.addEventListener("pointerleave", start); }
  }

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox");
  if (lb && lb.showModal) {
    var lbImg = $("#lb-img"), items = $$("[data-lb]"), li = 0;
    var lbCap = $("#lb-cap");
    function open(i) { li = (i + items.length) % items.length; var b = items[li]; lbImg.src = b.getAttribute("data-lb"); lbImg.alt = b.getAttribute("data-alt") || ""; if (lbCap) lbCap.textContent = (li + 1) + " / " + items.length; if (!lb.open) lb.showModal(); }
    items.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    $("#lb-prev").addEventListener("click", function () { open(li - 1); });
    $("#lb-next").addEventListener("click", function () { open(li + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") open(li - 1); if (e.key === "ArrowRight") open(li + 1); });
  }

  /* ---------- projects page: category chips + search ---------- */
  var pg = $("#pgrid");
  if (pg) {
    var cards = $$("[data-card]", pg), chips = $$("[data-cat]"), q = $("#psearch"), out = $("#pcount"), none = $("#pnone"), tpl = out ? out.getAttribute("data-tpl") : "{n}", cat = "";
    var norm = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var run = function () {
      var t = norm(q ? q.value : ""), n = 0;
      cards.forEach(function (c) { var ok = (!cat || c.getAttribute("data-c") === cat) && (!t || c.getAttribute("data-s").indexOf(t) > -1); c.hidden = !ok; if (ok) n++; });
      if (out) out.textContent = tpl.replace("{n}", n); if (none) none.hidden = n > 0;
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { cat = c.getAttribute("data-cat"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); run(); }); });
    if (q) q.addEventListener("input", run);
  }

  /* ---------- the tool: dossier de referencias ---------- */
  var tool = $("#tool");
  if (tool) {
    var cfg = JSON.parse($("#toolcfg").textContent), T = cfg.t, DATA = cfg.d, tcards = $$("[data-slug-card]", tool);
    var norm2 = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var st = { espacio: [], elem: [], mat: [], zona: "", estudio: "", desde: "", q: "" };
    var params = new URLSearchParams(location.search);
    function fromURL() {
      if (params.get("espacio")) st.espacio = params.get("espacio").split("|");
      if (params.get("elem")) st.elem = params.get("elem").split("|");
      if (params.get("material")) st.mat = params.get("material").split("|");
      st.zona = params.get("zona") || ""; st.estudio = params.get("estudio") || ""; st.desde = params.get("desde") || ""; st.q = params.get("q") || "";
    }
    function toURL() {
      var p = new URLSearchParams();
      if (st.espacio.length) p.set("espacio", st.espacio.join("|")); if (st.elem.length) p.set("elem", st.elem.join("|")); if (st.mat.length) p.set("material", st.mat.join("|"));
      if (st.zona) p.set("zona", st.zona); if (st.estudio) p.set("estudio", st.estudio); if (st.desde) p.set("desde", st.desde); if (st.q) p.set("q", st.q);
      var s = p.toString(); try { history.replaceState(null, "", location.pathname + (s ? "?" + s : "")); } catch (e) {}
    }
    var resCount = $("#tcount"), none = $("#tnone"), activeN = $("#tactive");
    function match(c) {
      var g = function (k) { return c.getAttribute("data-" + k) || ""; };
      if (st.espacio.length && st.espacio.indexOf(g("espacio")) < 0) return false;
      if (st.elem.length && !st.elem.every(function (x) { return ("|" + g("elem") + "|").indexOf("|" + x + "|") > -1; })) return false;
      if (st.mat.length && !st.mat.every(function (x) { return ("|" + g("mat") + "|").indexOf("|" + x + "|") > -1; })) return false;
      if (st.zona && g("zona") !== st.zona) return false;
      if (st.estudio && g("estudio") !== st.estudio) return false;
      if (st.desde && +g("year") < +st.desde) return false;
      if (st.q && g("s").indexOf(norm2(st.q)) < 0) return false;
      return true;
    }
    function paintFilters() {
      $$("[data-f]").forEach(function (b) { var k = b.getAttribute("data-f"), v = b.getAttribute("data-v"); b.setAttribute("aria-pressed", st[k].indexOf(v) > -1 ? "true" : "false"); });
      var z = $("#f-zona"), e = $("#f-estudio"), y = $("#f-desde"), qq = $("#f-q"); if (z) z.value = st.zona; if (e) e.value = st.estudio; if (y) y.value = st.desde; if (qq) qq.value = st.q;
    }
    function apply() {
      var n = 0; tcards.forEach(function (c) { var ok = match(c); c.hidden = !ok; if (ok) n++; });
      if (resCount) resCount.textContent = T.results.replace("{n}", n).replace("{t}", tcards.length);
      if (none) none.hidden = n > 0;
      var a = st.espacio.length + st.elem.length + st.mat.length + (st.zona ? 1 : 0) + (st.estudio ? 1 : 0) + (st.desde ? 1 : 0) + (st.q ? 1 : 0);
      if (activeN) { activeN.textContent = a ? a : ""; activeN.hidden = !a; }
      var rs = $("#treset"); if (rs) rs.hidden = !a;
      toURL();
    }
    $$("[data-f]").forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-f"), v = b.getAttribute("data-v"), i = st[k].indexOf(v); if (i > -1) st[k].splice(i, 1); else st[k].push(v); paintFilters(); apply(); }); });
    [["f-zona", "zona"], ["f-estudio", "estudio"], ["f-desde", "desde"]].forEach(function (p) { var el = $("#" + p[0]); if (el) el.addEventListener("change", function () { st[p[1]] = el.value; apply(); }); });
    var fq = $("#f-q"); if (fq) fq.addEventListener("input", function () { st.q = fq.value; apply(); });
    var rs = $("#treset"); if (rs) rs.addEventListener("click", function () { st = { espacio: [], elem: [], mat: [], zona: "", estudio: "", desde: "", q: "" }; paintFilters(); apply(); });
    var ft = $("#ftoggle"), fp = $("#fpanel");
    if (ft) ft.addEventListener("click", function () { var o = fp.classList.toggle("is-open"); ft.setAttribute("aria-expanded", o ? "true" : "false"); });
    fromURL(); paintFilters(); apply();
    if (window.matchMedia("(max-width:979px)").matches && (st.espacio.length || st.elem.length || st.mat.length || st.zona || st.estudio || st.desde || st.q)) { /* keep panel closed; counter shows active filters */ }

    /* dossier panel */
    var panel = $("#dossier"), shade = $("#shade"), bar = $("#dbar"), list = $("#dlist"), sum = $("#dsum"), form = $("#dform"), empty = $("#dempty");
    function openPanel(o) {
      panel.classList.toggle("is-open", o); shade.classList.toggle("is-on", o); panel.setAttribute("aria-hidden", o ? "false" : "true"); root.style.overflow = o ? "hidden" : "";
      if (o) { var x = $("#dclose"); if (x) x.focus(); }
    }
    $$("[data-dossier-open]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); openPanel(true); }); });
    $("#dclose").addEventListener("click", function () { openPanel(false); }); shade.addEventListener("click", function () { openPanel(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("is-open")) openPanel(false); });
    function top(arr, n) { var m = {}; arr.forEach(function (x) { if (x) m[x] = (m[x] || 0) + 1; }); return Object.keys(m).sort(function (a, b) { return m[b] - m[a] || (a < b ? -1 : 1); }).slice(0, n).map(function (k) { return k + " (" + m[k] + ")"; }); }
    function renderPanel() {
      var s = Dossier.get().filter(function (x) { return DATA[x]; }), items = s.map(function (x) { return DATA[x]; });
      document.body.classList.toggle("dbar-on", s.length > 0); if (bar) bar.classList.toggle("is-on", s.length > 0);
      var bc = $("#dbar-n"); if (bc) bc.textContent = T.count_bar.replace("{n}", s.length);
      empty.hidden = s.length > 0; form.hidden = s.length === 0; sum.hidden = s.length === 0;
      list.innerHTML = "";
      items.forEach(function (it, i) {
        var li = d.createElement("li"); li.className = "ditem";
        li.innerHTML = '<img alt="" width="72" height="54" src="' + it.i + '"><div><b></b><span></span></div><button type="button" aria-label="' + T.remove + '">×</button>';
        li.querySelector("b").textContent = it.t; li.querySelector("span").textContent = it.y + " · " + it.p;
        li.querySelector("button").addEventListener("click", function () { Dossier.remove(s[i]); });
        list.appendChild(li);
      });
      if (s.length) {
        var rows = [[T.sum_mats, top([].concat.apply([], items.map(function (x) { return x.m; })), 4)], [T.sum_studios, top(items.map(function (x) { return x.s; }), 3)], [T.sum_zone, top(items.map(function (x) { return x.z; }), 3)]];
        var ys = items.map(function (x) { return x.y; }); rows.push([T.sum_years, [Math.min.apply(null, ys) + (Math.min.apply(null, ys) === Math.max.apply(null, ys) ? "" : "–" + Math.max.apply(null, ys))]]);
        $("#dsumdl").innerHTML = ""; rows.forEach(function (r) { if (!r[1].length) return; var dt = d.createElement("dt"), dd = d.createElement("dd"); dt.textContent = r[0]; dd.textContent = r[1].join(", "); $("#dsumdl").appendChild(dt); $("#dsumdl").appendChild(dd); });
      }
    }
    Dossier.on(renderPanel);
    function activeFilters() {
      var a = []; if (st.espacio.length) a.push(st.espacio.join(", ")); if (st.elem.length) a.push(st.elem.join(", ")); if (st.mat.length) a.push(st.mat.join(", "));
      if (st.zona) a.push(st.zona); if (st.estudio) a.push(st.estudio); if (st.desde) a.push(T.from_year.replace("{y}", st.desde)); return a.join(" · ");
    }
    function body(short) {
      var s = Dossier.get().filter(function (x) { return DATA[x]; }), v = function (id) { var e = $("#" + id); return e ? e.value.trim() : ""; };
      var L = [T.mail_intro, ""];
      if (v("d-proj")) L.push(T.mail_proj.replace("{p}", v("d-proj")));
      var who = v("d-who"); if (who) L.push(T.mail_me.replace("{who}", who));
      if (v("d-org")) L.push(T.mail_org.replace("{o}", v("d-org")));
      var af = activeFilters(); if (af) L.push(T.filters_used + ": " + af);
      L.push("", T.mail_list + " (" + s.length + "):");
      s.forEach(function (x) { var it = DATA[x]; L.push("- " + it.t + " (" + it.y + ", " + it.p + ")" + (short ? "" : (it.s ? " · " + it.s : "") + (it.m.length ? " · " + it.m.join(", ") : "") + "\n  " + it.u)); });
      L.push("", T.mail_close); if (v("d-name")) L.push(v("d-name"));
      return L.join("\n");
    }
    function mailto(short) { var n = Dossier.get().length; return "mailto:" + cfg.to + "?subject=" + encodeURIComponent(T.mail_subject.replace("{n}", n)) + "&body=" + encodeURIComponent(body(short)); }
    var send = $("#dsend");
    function refreshHref() { var u = mailto(false); if (u.length > 1900) u = mailto(true); send.setAttribute("href", u); }
    ["d-name", "d-org", "d-who", "d-proj"].forEach(function (id) { var el = $("#" + id); if (el) { el.addEventListener("input", refreshHref); el.addEventListener("change", refreshHref); } });
    Dossier.on(refreshHref);
    send.addEventListener("click", refreshHref);
    var cp = $("#dcopy");
    cp.addEventListener("click", function () {
      var txt = body(false), done = function () { var o = cp.getAttribute("data-label"); cp.textContent = T.copied; setTimeout(function () { cp.textContent = o; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallback(txt, done); }); else fallback(txt, done);
    });
    function fallback(txt, done) { var ta = d.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; d.body.appendChild(ta); ta.select(); try { d.execCommand("copy"); done(); } catch (e) {} d.body.removeChild(ta); }
    var clr = $("#dclear"); if (clr) clr.addEventListener("click", function () { Dossier.clear(); });
    renderPanel();
  }

  /* ---------- contact: mailto builder + map on tap ---------- */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { return (cf.elements[n].value || "").trim(); }, c = JSON.parse(cf.getAttribute("data-cfg"));
    var b = c.greeting + "\n\n" + g("msg") + "\n\n" + c.close + "\n" + g("name");
    location.href = "mailto:" + g("to") + "?subject=" + encodeURIComponent(c.subject) + "&body=" + encodeURIComponent(b);
  });
  var mb = $("#mapbtn");
  if (mb) mb.addEventListener("click", function () { var f = d.createElement("iframe"); f.src = mb.getAttribute("data-src"); f.title = mb.getAttribute("data-title"); f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; mb.parentNode.replaceChild(f, mb); });
  var pm = $("#pmail");
  if (pm) pm.addEventListener("click", function () { /* plain mailto link: nothing to do */ });
})();
