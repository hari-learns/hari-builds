(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverOK = window.matchMedia && matchMedia("(hover: hover)").matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* language */
  function setLang(l) {
    root.setAttribute("data-lang", l); root.lang = l;
    $$("[data-ph-en]").forEach(function (i) { if (!i.dataset.phFi) i.dataset.phFi = i.placeholder; i.placeholder = l === "en" ? i.dataset.phEn : i.dataset.phFi; });
    var sel = $("#sort"); if (sel) { /* options are Finnish labels; EN uses data-en */ $$("option", sel).forEach(function (o) { if (!o.dataset.fi) o.dataset.fi = o.textContent; o.textContent = l === "en" && o.dataset.en ? o.dataset.en : o.dataset.fi; }); }
  }
  var saved = store("mt-lang"); if (saved === "en") setLang("en");
  var lt = $("[data-lang-toggle]");
  if (lt) lt.addEventListener("click", function () { var n = root.getAttribute("data-lang") === "en" ? "fi" : "en"; setLang(n); store("mt-lang", n); });

  /* drawer */
  var burger = $(".burger"), nav = $("#nav");
  function closeNav() { if (!nav) return; nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); root.style.overflow = ""; }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var o = !nav.classList.contains("open"); nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); root.style.overflow = o ? "hidden" : "";
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* dock */
  var dock = $("#dock"), dc = $("[data-dock-close]");
  try { if (sessionStorage.getItem("mt-dock") === "1") dock.hidden = true; } catch (e) {}
  if (dc) dc.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("mt-dock", "1"); } catch (e) {} });

  /* reveals with a sweep that never strands content */
  var rvs = $$(".rv");
  function sweep() { var vh = innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) el.classList.add("in"); }); }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add("in"); });
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* anatomy: the knife in hand */
  var stage = $("#stage");
  if (stage) {
    var lit = $(".k-lit", stage), gl = $(".k-glint", stage);
    var P = { tera: [34, 70, 24, 32], kahva: [34, 32, 26, 27], tuppi: [62, 58, 30, 48] };
    var cur = P.kahva.slice(), tgt = P.tera.slice(), part = "tera", raf = 0;
    function paint() { lit.style.setProperty("--sx", cur[0] + "%"); lit.style.setProperty("--sy", cur[1] + "%"); lit.style.setProperty("--rx", cur[2] + "%"); lit.style.setProperty("--ry", cur[3] + "%"); }
    function tick() { var done = true; for (var i = 0; i < 4; i++) { var dlt = tgt[i] - cur[i]; if (Math.abs(dlt) > 0.05) { cur[i] += dlt * 0.14; done = false; } else cur[i] = tgt[i]; } paint(); raf = done ? 0 : requestAnimationFrame(tick); }
    function go(p) { tgt = P[p].slice(); if (reduce) { cur = tgt.slice(); paint(); } else if (!raf) raf = requestAnimationFrame(tick); }
    function show(p, m) {
      part = p;
      $$(".tab").forEach(function (t) { t.setAttribute("aria-selected", t.dataset.part === p); });
      $$(".chiprow").forEach(function (r) { r.hidden = r.dataset.part !== p; });
      var first = m || $(".chiprow[data-part=" + p + "] .chip").dataset.mat;
      $$(".chiprow[data-part=" + p + "] .chip").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.mat === first); });
      $$(".mat").forEach(function (x) { x.hidden = !(x.dataset.part === p && x.dataset.mat === first); });
      $("#hrc").hidden = p !== "tera";
      $$(".bar").forEach(function (b) { b.classList.toggle("on", b.dataset.mat === first); });
      go(p);
    }
    $$(".tab").forEach(function (t) { t.addEventListener("click", function () { show(t.dataset.part); }); });
    $$(".chip", $("#panel")).forEach(function (c) { c.addEventListener("click", function () { show(c.closest(".chiprow").dataset.part, c.dataset.mat); }); });
    cur = P.tera.slice(); show("tera");
    /* steel catches light: pointer or touch moves a glint, masked to the knife itself */
    function glint(x, y) { var r = stage.getBoundingClientRect(); gl.style.setProperty("--gx", ((x - r.left) / r.width * 100).toFixed(1) + "%"); gl.style.setProperty("--gy", ((y - r.top) / r.height * 100).toFixed(1) + "%"); }
    stage.addEventListener("pointermove", function (e) { glint(e.clientX, e.clientY); });
    stage.addEventListener("pointerdown", function (e) { glint(e.clientX, e.clientY); });
    if (!reduce && "IntersectionObserver" in window) {
      var played = false;
      new IntersectionObserver(function (es, o) {
        if (!es[0].isIntersecting || played) return; played = true; o.disconnect();
        var t0 = performance.now(); (function s(t) { var k = Math.min((t - t0) / 1800, 1), e = 1 - Math.pow(1 - k, 3); gl.style.setProperty("--gx", (28 + e * 14) + "%"); gl.style.setProperty("--gy", (95 - e * 75) + "%"); if (k < 1) requestAnimationFrame(s); })(t0);
      }, { threshold: 0.5 }).observe(stage);
    }
  }

  /* card tilt, desktop only */
  if (hoverOK && !reduce) {
    $$(".card-img").forEach(function (a) {
      var im = $(".pimg", a);
      a.addEventListener("pointermove", function (e) { var r = a.getBoundingClientRect(); im.style.setProperty("--tilt", (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + "deg"); });
      a.addEventListener("pointerleave", function () { im.style.setProperty("--tilt", "0deg"); });
    });
  }

  /* shop filters */
  var grid = $("#grid");
  if (grid) {
    var cards = $$(".card", grid), qI = $("#q"), sortS = $("#sort"), maxI = $("#maxp"), fN = $("#fnew"), fM = $("#fmark");
    var st = { cat: "all", q: "", sort: "def", max: +maxI.max, nw: false, mk: false };
    cards.forEach(function (c, i) { c.dataset.i = i; });
    var EN_SORT = { def: "Featured", asc: "Price: low to high", desc: "Price: high to low", az: "Name A-Z" };
    $$("option", sortS).forEach(function (o) { o.dataset.en = EN_SORT[o.value]; });
    if (root.getAttribute("data-lang") === "en") setLang("en");
    function apply() {
      var n = 0, q = st.q.trim().toLowerCase();
      var order = cards.slice().sort(function (a, b) {
        if (st.sort === "asc") return a.dataset.price - b.dataset.price;
        if (st.sort === "desc") return b.dataset.price - a.dataset.price;
        if (st.sort === "az") return a.dataset.name.localeCompare(b.dataset.name, "fi");
        return a.dataset.i - b.dataset.i;
      });
      order.forEach(function (c, i) {
        var ok = (st.cat === "all" || (" " + c.dataset.cats + " ").indexOf(" " + st.cat + " ") > -1) &&
          (!q || c.dataset.name.indexOf(q) > -1 || c.dataset.sku.toLowerCase().indexOf(q) > -1) &&
          +c.dataset.price <= st.max && (!st.nw || c.dataset.new === "1") && (!st.mk || c.dataset.mark === "1");
        c.hidden = !ok; c.style.order = i; if (ok) n++;
      });
      $("#shown").textContent = n; $("#none").hidden = n > 0;
      $("#maxout").textContent = st.max + " €";
      $("#reset").hidden = st.cat === "all" && !q && st.max >= +maxI.max && !st.nw && !st.mk;
      $$(".chip", $("#chips")).forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.cat === st.cat); });
      try { var u = new URL(location.href); u.searchParams.delete("cat"); u.searchParams.delete("q"); if (st.cat !== "all") u.searchParams.set("cat", st.cat); if (q) u.searchParams.set("q", q); history.replaceState(null, "", u); } catch (e) {}
    }
    $$(".chip", $("#chips")).forEach(function (c) { c.addEventListener("click", function () { st.cat = c.dataset.cat; apply(); }); });
    qI.addEventListener("input", function () { st.q = qI.value; apply(); });
    sortS.addEventListener("change", function () { st.sort = sortS.value; apply(); });
    maxI.addEventListener("input", function () { st.max = +maxI.value; apply(); });
    fN.addEventListener("change", function () { st.nw = fN.checked; apply(); });
    fM.addEventListener("change", function () { st.mk = fM.checked; apply(); });
    $("#reset").addEventListener("click", function () { st = { cat: "all", q: "", sort: st.sort, max: +maxI.max, nw: false, mk: false }; qI.value = ""; maxI.value = maxI.max; fN.checked = fM.checked = false; apply(); });
    try { var sp = new URL(location.href).searchParams; if (sp.get("cat")) st.cat = sp.get("cat"); if (sp.get("q")) { st.q = sp.get("q"); qI.value = st.q; } } catch (e) {}
    apply();
  }
})();
