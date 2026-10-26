/* Astilleros Dalmau concept: header, drawer, hero carousel, reveals, family filter, vessel finder, video, contact mailto. Every feature is existence-guarded. */
(function () {
  "use strict";
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var BASE = d.body.getAttribute("data-base") || "";
  var LANG = d.body.getAttribute("data-lang") || "es";
  function store(k, v) { try { if (v === undefined) return w.sessionStorage.getItem(k); w.sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* header shadow */
  var hdr = $("#hdr");
  if (hdr) { var onS = function () { hdr.classList.toggle("is-stuck", w.scrollY > 8); }; w.addEventListener("scroll", onS, { passive: true }); onS(); }

  /* drawer */
  var dr = $("#drawer"), bu = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!dr) return;
    dr.classList.toggle("is-open", open);
    dr.setAttribute("aria-hidden", open ? "false" : "true");
    if (bu) bu.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : "";
    if (open && bx) bx.focus(); else if (!open && bu && d.activeElement && dr.contains(d.activeElement)) bu.focus();
  }
  if (bu) bu.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  if (dr) {
    $$("a", dr).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr.classList.contains("is-open")) setDrawer(false); });
    w.addEventListener("resize", function () { if (w.innerWidth >= 1000 && dr.classList.contains("is-open")) setDrawer(false); });
    dr.setAttribute("aria-hidden", "true");
  }

  /* concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && store("dd-dock") === "1") dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; store("dd-dock", "1"); });

  /* hero carousel: their own vessel photos; static when reduced motion */
  var hero = $(".hero");
  if (hero) {
    var slides = $$(".hero__slide", hero), caps = $$(".hero__cap-item", hero), dots = $$(".hero__dot, .hero__thumb", hero), cur = 0, timer = null;
    function load(i) {
      var im = $("img", slides[i]);
      if (im && im.getAttribute("data-src")) {
        if (im.getAttribute("data-srcset")) im.srcset = im.getAttribute("data-srcset");
        im.src = im.getAttribute("data-src");
        im.removeAttribute("data-src"); im.removeAttribute("data-srcset");
      }
    }
    function show(i) {
      i = (i + slides.length) % slides.length;
      load(i);
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      caps.forEach(function (c, k) { c.classList.toggle("is-active", k === i); var a = $("a", c); if (a) a.tabIndex = k === i ? 0 : -1; });
      dots.forEach(function (c, k) { c.classList.toggle("is-active", k === i); c.setAttribute("aria-current", k === i ? "true" : "false"); });
      var ce = $("[data-cur]", hero); if (ce) ce.textContent = i + 1;
      cur = i; load((i + 1) % slides.length);
    }
    function play() { if (reduce || timer) return; timer = w.setInterval(function () { show(cur + 1); }, 6500); }
    function stop() { if (timer) { w.clearInterval(timer); timer = null; } }
    dots.forEach(function (b) { b.addEventListener("click", function () { stop(); show(+b.getAttribute("data-go")); }); });
    $$(".hero__arrow", hero).forEach(function (b) { b.addEventListener("click", function () { stop(); show(cur + (+b.getAttribute("data-dir"))); }); });
    hero.addEventListener("mouseenter", stop); hero.addEventListener("focusin", stop);
    hero.addEventListener("mouseleave", play);
    d.addEventListener("visibilitychange", function () { if (d.hidden) stop(); else play(); });
    var start = function () { load(1); play(); };
    if (d.readyState === "complete") w.setTimeout(start, 1500); else w.addEventListener("load", function () { w.setTimeout(start, 1500); });
  }

  /* finder: extra filters start collapsed on phones */
  $$("details.tf-more").forEach(function (dt) { if (w.innerWidth < 760) dt.open = false; });

  /* reveals */
  var targets = $$(".shead,.fam,.ncard,.tl li,.figs li,.split__txt,.split__media,.proof li,.qual,.cband,.grid .gi,.vbody > *,.pcols > *,.ccols > *,.nlist li,.docs li").filter(function (e) { return !e.closest(".tool"); });
  if (targets.length && "IntersectionObserver" in w && !reduce) {
    targets.forEach(function (t) { t.classList.add("rv"); });
    var vh = w.innerHeight;
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    targets.forEach(function (t) { io.observe(t); });
    var sweep = function () { var h = w.innerHeight; targets.forEach(function (t) { if (!t.classList.contains("in") && t.getBoundingClientRect().top < h * 0.96) t.classList.add("in"); }); };
    ["scroll", "resize", "pageshow", "load", "hashchange"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
    sweep(); w.setTimeout(sweep, 400);
  }

  /* family filter */
  var flt = $("[data-filter]");
  if (flt) {
    var items = $$("[data-grid-f] .gi"), nEl = $("[data-n]");
    $$(".chip", flt).forEach(function (c) {
      c.addEventListener("click", function () {
        var s = c.getAttribute("data-sub"), n = 0;
        $$(".chip", flt).forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        items.forEach(function (it) { var ok = !s || (" " + it.getAttribute("data-subs") + " ").indexOf(" " + s + " ") > -1; it.hidden = !ok; it.classList.add("in"); if (ok) n++; });
        if (nEl) nEl.textContent = n;
      });
    });
  }

  /* YouTube: nothing loads until tapped */
  $$("[data-yt]").forEach(function (b) {
    var btn = $(".yt__btn", b);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.title = btn.getAttribute("aria-label") || "Video";
      b.innerHTML = ""; b.appendChild(f);
    });
  });

  /* contact form -> prefilled email */
  var cf = $("[data-cform]"), ci = $("#cform-i18n");
  if (cf && ci) {
    var L = JSON.parse(ci.textContent);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(cf), body = "";
      ["name", "company", "tel", "email", "msg"].forEach(function (k) { body += L.lines[k] + ": " + (f.get(k) || "") + "\n"; });
      w.location.href = "mailto:" + L.to + "?subject=" + encodeURIComponent(L.subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* vessel finder: their catalogue, filtered by what the buyer needs */
  var i18n = $("#tool-i18n");
  var tools = $$("[data-tool]");
  if (tools.length && i18n) {
    var T = JSON.parse(i18n.textContent), DATA = null, loading = null;
    function getData() {
      if (DATA) return Promise.resolve(DATA);
      if (!loading) loading = w.fetch(BASE + "/assets/fleet.json").then(function (r) { return r.json(); }).then(function (j) { DATA = j; return j; });
      return loading;
    }
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var fmt = function (n) { var s = (Math.round(n * 10) / 10).toString(); return LANG === "es" ? s.replace(".", ",") : s; };
    var PROPL = { e: LANG === "es" ? "Eléctrico" : "Electric", h: LANG === "es" ? "Híbrido" : "Hybrid" };
    tools.forEach(function (root) {
      var mini = root.getAttribute("data-mode") === "mini", LIMIT = mini ? 3 : 6;
      var st = { use: "pasaje", pax: 150, len: 0, prop: "", hull: "", shown: LIMIT, refs: [] };
      var form = $(".tool__form", root), grid = $("[data-grid]", root), count = $("[data-count]", root), more = $("[data-more]", root);
      var q = $("[data-query]", root), sum = $("[data-sum]", root), refsEl = $("[data-refs]", root), send = $("[data-send]", root);
      var inPax = $('input[name="pax"]', form), inLen = $('input[name="len"]', form);
      /* deep link from the home teaser */
      var p = new URLSearchParams(w.location.search);
      if (p.get("uso")) st.use = p.get("uso");
      if (p.has("pax")) st.pax = +p.get("pax") || 0;
      if (p.has("len")) st.len = +p.get("len") || 0;
      if (p.get("prop")) st.prop = p.get("prop");
      if (p.get("hull")) st.hull = p.get("hull");
      function sync() {
        inPax.value = st.pax || ""; inLen.value = st.len || "";
        $$("[data-use]", root).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-use") === st.use ? "true" : "false"); });
        $$("[data-prop]", root).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-prop") === st.prop ? "true" : "false"); });
        $$("[data-hull]", root).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-hull") === st.hull ? "true" : "false"); });
        $$('[data-q="pax"]', root).forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-v") === st.pax ? "true" : "false"); });
        $$('[data-q="len"]', root).forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-v") === st.len ? "true" : "false"); });
      }
      function match(data) {
        var out = [];
        data.forEach(function (v) {
          if (v.c !== st.use) return;
          if (st.pax && v.p == null) return;
          if (st.len && v.e == null) return;
          if (st.prop === "eco" && !(v.pr === "e" || v.pr === "h")) return;
          if (st.prop === "d" && v.pr !== "d") return;
          if (st.hull && v.h !== st.hull) return;
          var dp = st.pax ? Math.abs(v.p - st.pax) / st.pax : 0, dl = st.len ? Math.abs(v.e - st.len) / st.len : 0;
          out.push({ v: v, dp: dp, dl: dl, s: dp + dl, close: dp <= 0.25 && dl <= 0.2 });
        });
        out.sort(function (a, b) { return (b.close - a.close) || (a.s - b.s) || (a.v.n < b.v.n ? -1 : 1); });
        return out;
      }
      function why(m) {
        var t = [];
        if (st.pax) { var diff = m.v.p - st.pax; t.push(m.v.p + " " + T.pax + (diff === 0 ? " (" + T.match_exact.toLowerCase() + ")" : " (" + (diff > 0 ? "+" : "") + Math.round(diff / st.pax * 100) + " %)")); }
        if (st.len) { var dd = m.v.e - st.len; t.push(fmt(m.v.e) + " m" + (Math.abs(dd) < 0.05 ? "" : " (" + (dd > 0 ? "+" : "") + fmt(dd) + " m)")); }
        return t.join(" · ");
      }
      function card(m) {
        var v = m.v, facts = [];
        if (v.e) facts.push(fmt(v.e) + " m");
        if (v.p) facts.push(v.p + " " + T.pax);
        if (PROPL[v.pr]) facts.push(PROPL[v.pr]);
        var img = v.i ? '<img class="card__img" src="' + T.assets + v.i + '" width="' + v.iw + '" height="' + v.ih + '" alt="' + esc(v.n) + '" loading="lazy" decoding="async">' : '<div class="card__ph"></div>';
        var on = st.refs.indexOf(v.s) > -1;
        var w_ = why(m);
        return '<div class="tool__item"><a class="card" href="' + T.vdir + v.s + '/"><div class="card__media">' + img + '</div><div class="card__body"><h3>' + esc(v.n) + '</h3><p class="card__facts">' + esc(facts.join(" · ")) + '</p>' +
          (w_ ? '<p class="why">' + esc(w_) + '</p>' : "") + (v.b ? '<p class="card__base">' + esc(v.b) + '</p>' : "") + '</div></a>' +
          (mini ? "" : '<button type="button" class="tool__add" data-add="' + v.s + '" aria-pressed="' + on + '">' + esc(on ? T.added : T.add_ref) + '</button>') + '</div>';
      }
      function summary() {
        var parts = [T.uses[st.use]];
        if (st.pax) parts.push(st.pax + " " + T.pax);
        if (st.len) parts.push(fmt(st.len) + " m");
        if (st.prop === "eco") parts.push(T.prop_eco); if (st.prop === "d") parts.push(T.prop_diesel);
        if (st.hull) parts.push(T["hull_" + st.hull]);
        return parts.join(" · ");
      }
      function updateQuery() {
        if (!q) return;
        var s = summary();
        q.hidden = false;
        sum.textContent = s;
        refsEl.innerHTML = st.refs.length ? st.refs.map(function (r) { var v = DATA.filter(function (x) { return x.s === r; })[0]; return "<li>" + esc(v ? v.n : r) + "</li>"; }).join("") : "<li>" + esc(T.no_refs) + "</li>";
        var body = T.greeting + "\n\n- " + s.split(" · ").join("\n- ") + "\n" + (st.refs.length ? "\n" + T.refs + ":\n" + st.refs.map(function (r) { var v = DATA.filter(function (x) { return x.s === r; })[0]; return "- " + (v ? v.n : r); }).join("\n") + "\n" : "") + "\n" + T.sign;
        send.href = "mailto:" + T.email + "?subject=" + encodeURIComponent(T.subject + s) + "&body=" + encodeURIComponent(body);
      }
      function render() {
        sync();
        getData().then(function (data) {
          var res = match(data), close = res.filter(function (m) { return m.close; });
          var list = (close.length ? close : res), shown = list.slice(0, st.shown);
          if (!res.length) { count.textContent = T.result_none; grid.innerHTML = ""; more.hidden = true; }
          else if (!close.length) { count.textContent = T.result_none; grid.innerHTML = res.slice(0, mini ? 3 : 3).map(card).join(""); more.hidden = true; }
          else { count.innerHTML = "<b>" + close.length + "</b> " + esc(close.length === 1 ? T.result_1 : T.result_n); grid.innerHTML = shown.map(card).join(""); more.hidden = mini || list.length <= st.shown; }
          if (mini) { var lk = $(".tool__link a", root.parentNode); if (lk) { var u = new URLSearchParams(); u.set("uso", st.use); if (st.pax) u.set("pax", st.pax); if (st.len) u.set("len", st.len); lk.href = T.fleet_url + "?" + u.toString(); } }
          updateQuery();
        });
      }
      $$("[data-use]", root).forEach(function (b) { b.addEventListener("click", function () { st.use = b.getAttribute("data-use"); if (st.use === "pesca" || st.use === "trabajo") { st.pax = 0; } else if (!st.pax) { st.pax = 150; } st.shown = LIMIT; render(); }); });
      $$("[data-prop]", root).forEach(function (b) { b.addEventListener("click", function () { st.prop = b.getAttribute("data-prop"); st.shown = LIMIT; render(); }); });
      $$("[data-hull]", root).forEach(function (b) { b.addEventListener("click", function () { st.hull = b.getAttribute("data-hull"); st.shown = LIMIT; render(); }); });
      $$("[data-q]", root).forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-q"), v = +b.getAttribute("data-v"); if (k === "pax") st.pax = st.pax === v ? 0 : v; else st.len = st.len === v ? 0 : v; st.shown = LIMIT; render(); }); });
      var deb; function onIn() { w.clearTimeout(deb); deb = w.setTimeout(function () { st.pax = Math.max(0, +inPax.value || 0); st.len = Math.max(0, +inLen.value || 0); st.shown = LIMIT; render(); }, 250); }
      inPax.addEventListener("input", onIn); inLen.addEventListener("input", onIn);
      form.addEventListener("reset", function (e) { e.preventDefault(); st.use = "pasaje"; st.pax = 150; st.len = 0; st.prop = ""; st.hull = ""; st.refs = []; st.shown = LIMIT; render(); });
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      if (more) more.addEventListener("click", function () { st.shown += 6; render(); });
      grid.addEventListener("click", function (e) {
        var b = e.target.closest("[data-add]"); if (!b) return;
        var s = b.getAttribute("data-add"), i = st.refs.indexOf(s);
        if (i > -1) st.refs.splice(i, 1); else if (st.refs.length < 4) st.refs.push(s);
        b.setAttribute("aria-pressed", st.refs.indexOf(s) > -1 ? "true" : "false"); b.textContent = st.refs.indexOf(s) > -1 ? T.added : T.add_ref;
        updateQuery(); if (q) q.hidden = false;
      });
      sync();
      if (mini && "IntersectionObserver" in w) {
        var o2 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o2.disconnect(); render(); } }, { rootMargin: "400px" });
        o2.observe(root);
      } else render();
    });
  }
})();
