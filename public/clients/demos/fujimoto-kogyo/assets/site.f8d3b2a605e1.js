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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("fjm-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("fjm-dock", "1"); }); });

  if (dock) window.addEventListener("scroll", function () { if (window.innerWidth < 860 && window.scrollY > 160) dock.hidden = true; }, { passive: true });

  /* reveals (also reveals anything already scrolled past) */
  var rvs = $$(".rv, .stage");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* count-up of their real figure (static value stays in the HTML) */
  $$("[data-count]").forEach(function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (!isFinite(end) || reduce || !("IntersectionObserver" in window)) return;
    var done = false;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || done) return; done = true; o.disconnect();
        var t0 = performance.now(), dur = 1400;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = v.toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(step); else el.textContent = end.toLocaleString("en-US");
        })(t0);
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.85) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* hero film: their own 27 s film, re-encoded small, loaded only after the page is done, never on reduced motion / data saver */
  var heroBg = $(".hero__bg"), pauseBtn = $("#vpause");
  if (heroBg && !reduce) {
    var conn = navigator.connection || {};
    var lite = conn.saveData || /2g/.test(conn.effectiveType || "");
    if (!lite) {
      var start = function () {
        var small = window.innerWidth <= 760;
        var v = d.createElement("video");
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true"); v.preload = "auto";
        v.src = (heroBg.getAttribute("data-base") || "") + "/assets/img/" + (small ? "hero-480.mp4" : "hero-720.mp4");
        v.addEventListener("playing", function () { v.classList.add("is-on"); if (pauseBtn) pauseBtn.hidden = false; });
        heroBg.insertBefore(v, $(".hero__scrim", heroBg));
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.remove(); });
        if (pauseBtn) pauseBtn.addEventListener("click", function () {
          if (v.paused) { v.play(); pauseBtn.setAttribute("aria-label", pauseBtn.getAttribute("data-pause")); } else { v.pause(); pauseBtn.setAttribute("aria-label", pauseBtn.getAttribute("data-play")); }
        });
      };
      var go = function () { setTimeout(start, 400); };
      if (d.readyState === "complete") go(); else window.addEventListener("load", go);
    }
  }

  /* jirei filter */
  var grid = $("[data-jgrid]");
  if (grid) {
    var cards = $$(".jc", grid), fc = "", fm = "", cnt = $("[data-jcount]");
    function filt() {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!fc || c.getAttribute("data-cat") === fc) && (!fm || (" " + c.getAttribute("data-mat") + " ").indexOf(" " + fm + " ") >= 0);
        c.hidden = !ok; if (ok) n++;
      });
      if (cnt) cnt.textContent = n + "件を表示";
    }
    $$("[data-c]").forEach(function (b) { b.addEventListener("click", function () { fc = b.getAttribute("data-c"); $$("[data-c]").forEach(function (x) { x.classList.toggle("is-on", x === b); }); filt(); }); });
    $$("[data-m]").forEach(function (b) { b.addEventListener("click", function () { fm = b.getAttribute("data-m"); $$("[data-m]").forEach(function (x) { x.classList.toggle("is-on", x === b); }); filt(); }); });
  }

  /* setsubi filter */
  var froot = $("[data-filter-root]");
  if (froot) {
    $$("[data-g]").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = b.getAttribute("data-g");
        $$("[data-g]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        $$(".mgroup", froot).forEach(function (s) { s.hidden = !!g && s.getAttribute("data-group") !== g; });
      });
    });
  }

  /* map: loads only on tap */
  var map = $("[data-map]");
  if (map) {
    var mb = $("[data-map-load]", map);
    if (mb) mb.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = map.getAttribute("data-map"); f.title = map.getAttribute("data-title"); f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.setAttribute("allowfullscreen", "");
      map.innerHTML = ""; map.appendChild(f);
    });
  }

  /* ------------------------------------------------ the tool: can you make my part in-house? */
  var tEl = $("[data-tool]");
  if (tEl) (function () {
    var data = JSON.parse($("#tool-data").textContent), M = data.machines, UI = data.ui, J = data.jirei, BASE = data.base;
    var stepsEl = $("[data-steps]", tEl), sumEl = $("[data-sum]", tEl), warnEl = $("[data-warn]", tEl), nearEl = $("[data-near]", tEl), ctaEl = $("[data-cta]", tEl);
    var RM = { steel: 400, sus: 600, alu: 250 };
    var st = { mat: "steel", t: 1.6, l: 420, w: 130, h: 110, b: 420, qty: "s", procs: { cut: 1, bend: 1, weld: 1 } };
    var NAMES = { steel: "スチール", sus: "ステンレス", alu: "アルミ" };

    function by(key) { for (var i = 0; i < M.length; i++) if (M[i].md === key || M[i].n.indexOf(key) === 0) return M[i]; return null; }
    function tf(cap) { var m = /([\d.]+)\s*t/.exec(cap || ""); return m ? parseFloat(m[1]) : null; }
    function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
    function dimsSorted() { return [st.l, st.w, st.h].filter(function (x) { return x > 0; }).sort(function (a, b) { return b - a; }); }
    function areaFit(cap) {
      var m = /(\d[\d,]*)\s*[×x]\s*(\d[\d,]*)/.exec(cap || ""); if (!m) return null;
      var a = parseInt(m[1].replace(/,/g, ""), 10), b = parseInt(m[2].replace(/,/g, ""), 10), s = dimsSorted();
      var hi = Math.max(a, b), lo = Math.min(a, b);
      return s.length >= 2 ? (s[0] <= hi && s[1] <= lo) : null;
    }
    function el(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

    function row(m, o) {
      o = o || {};
      var r = el("div", "mrow" + (o.status ? " is-" + o.status : ""));
      var left = el("div");
      left.appendChild(el("p", "mrow__n", m.n.replace(/（.*$/, "")));
      var sp = el("p", "mrow__s");
      [m.mk, m.md, m.cap].filter(Boolean).forEach(function (x, i) { if (i) sp.appendChild(d.createTextNode(" ・ ")); sp.appendChild(el("span", "nw", x)); });
      if (sp.firstChild) left.appendChild(sp);
      r.appendChild(left);
      var right = el("div"); right.style.display = "flex"; right.style.gap = "6px"; right.style.flexWrap = "wrap"; right.style.justifyContent = "flex-end";
      if (o.status) right.appendChild(el("span", "badge " + (o.status === "ok" ? "ok" : o.status === "mid" ? "mid" : "no"), o.label));
      if (o.area != null) right.appendChild(el("span", "badge " + (o.area ? "ok" : "mid"), UI.area_label.replace("（掲載値）", "") + "：" + (o.area ? UI.size_ok : UI.size_ng)));
      right.appendChild(el("span", "badge ct", m.ct + UI.units));
      r.appendChild(right);
      if (o.bar != null) { var g = el("div", "gbar"); var i = el("i"); i.style.setProperty("--p", Math.min(1, o.bar).toFixed(3)); g.appendChild(i); r.appendChild(g); }
      if (o.note) r.appendChild(el("p", "mrow__x", o.note));
      return r;
    }
    function step(key, rows, extra) {
      var s = UI.steps[key], li = el("li", "step");
      var h = el("div", "step__h"); h.appendChild(el("span", "step__n", String(stepsEl.children.length + 1).padStart(2, "0"))); h.appendChild(el("h3", "step__t", s[0]));
      li.appendChild(h); li.appendChild(el("p", "step__d", s[1]));
      if (extra) li.appendChild(extra);
      rows.forEach(function (r) { li.appendChild(r); });
      stepsEl.appendChild(li);
    }

    function evaluate() {
      stepsEl.innerHTML = ""; warnEl.innerHTML = "";
      var kinds = {}, units = 0;
      function count(m) { if (!kinds[m.n + m.md]) { kinds[m.n + m.md] = 1; units += m.ct; } }
      var P = st.procs, t = st.t > 0 ? st.t : 0, big = Math.max(st.l, st.w, st.h);

      if (big > 2000) { var w1 = el("p", "warn warn--mid", UI.big_warn); warnEl.appendChild(w1); }
      if (t > 14) { var w2 = el("p", "warn warn--mid", UI.thick_warn); warnEl.appendChild(w2); }

      /* 1 design: always */
      var dr = [by("SheetWorks"), by("AP100")].filter(Boolean);
      dr.forEach(count);
      step("design", dr.map(function (m) { return row(m); }));

      /* 2 cut */
      if (P.cut) {
        var cm = [by("LC2012C1NT"), by("LC3015F1NT")];
        if (t >= 4.5) cm.reverse();
        cm.forEach(count);
        step("cut", cm.map(function (m, i) { return row(m, { note: (t >= 4.5 && i === 0) ? "板厚が厚いほど、高出力の機械が有利です。" : "" }); }));
      }

      /* 3 bend */
      if (P.bend && st.b > 0 && t > 0) {
        var kN = 0.1775 * RM[st.mat] * t * (st.b / 1000), tfr = kN / 9.80665;
        var brakes = ["SPH-30C", "RG-35S", "HG-5020", "HDS-8025", "HG-1303"].map(by).filter(Boolean);
        var force = el("div", "force");
        var fp = el("p"); fp.appendChild(d.createTextNode(UI.force_label + "：")); var fb = el("b", null, UI.force_fmt.replace("{tf}", fmt(tfr)).replace("{n}", st.b).replace("{t}", fmt(t)).replace("{mat}", NAMES[st.mat]));
        fp.appendChild(fb); force.appendChild(fp);
        force.appendChild(el("p", "mrow__s", UI.force_note));
        var any = 0;
        var rows = brakes.map(function (m) {
          var cap = tf(m.cap), ratio = tfr / cap, status = ratio <= 0.7 ? "ok" : ratio <= 1 ? "mid" : "no";
          if (status !== "no") { any++; count(m); }
          return row(m, { status: status, label: status === "ok" ? UI.force_ok : status === "mid" ? UI.force_tight : UI.force_no, bar: ratio });
        });
        step("bend", rows, force);
        if (!any) warnEl.appendChild(el("p", "warn", "社内のプレスブレーキ5台（30〜130t）では、この条件の曲げ力に足りない目安です。分割や別の曲げ方を含め、ご相談ください。"));
      }

      /* 4 weld */
      if (P.weld) {
        var wl = [], thin = t <= 3.2;
        var steel = st.mat === "steel", sus = st.mat === "sus", alu = st.mat === "alu";
        function add(key, tag, withArea) { var m = by(key); if (!m) return; var a = withArea ? areaFit(m.cap) : null; wl.push([m, tag, a]); }
        if (steel) add("WB-M352L", UI.weld_tags.mag);
        add("YC-300WX", UI.weld_tags.tig);
        if ((steel || sus) && thin) { add("SLAJS-75", UI.weld_tags.spot); add("NK-21", UI.weld_tags.spot, true); }
        if (!alu) add("KR-2000", UI.weld_tags.fiber);
        if (!alu) { add("YA-1QAR61T00", UI.weld_tags.robot); add("Robot CRX-10iA/L", UI.weld_tags.robot); }
        if (alu) warnEl.appendChild(el("p", "warn warn--mid", UI.aluminum_note));
        wl.forEach(function (x) { count(x[0]); });
        step("weld", wl.map(function (x) { return row(x[0], { note: x[1], area: x[2] }); }));
      }

      /* 5 finish */
      var fl = [];
      if (P.cut) fl.push([by("AUDEBU1000"), "", null]);
      if (P.weld && st.mat === "sus") fl.push([by("ステンレス焼取装置"), "ステンレスの溶接後に。", null]);
      if (P.tap) {
        var ct = by("CTS-900"); fl.push([ct, "", areaFit(ct.cap)]);
        fl.push([by("タッピングボール盤"), "", null]);
        fl.push([by("GUNMAN1000Ⅱ"), "スタッド（植え込みボルト）の溶接に。", null]);
      }
      fl = fl.filter(function (x) { return x[0]; });
      if (fl.length) { fl.forEach(function (x) { count(x[0]); }); step("finish", fl.map(function (x) { return row(x[0], { note: x[1], area: x[2] }); })); }

      /* coat: text only, from their business description */
      if (P.coat) step("coat", []);

      var nk = Object.keys(kinds).length;
      sumEl.innerHTML = "";
      if (nk) { var s = UI.summary_fmt.replace("{kinds}", "\u0001").replace("{units}", "\u0002"); var parts = s.split(/(\u0001|\u0002)/); parts.forEach(function (p) { if (p === "\u0001") sumEl.appendChild(el("b", null, String(nk))); else if (p === "\u0002") sumEl.appendChild(el("b", null, String(units))); else sumEl.appendChild(d.createTextNode(p)); }); }
      else sumEl.textContent = UI.summary_none;

      /* nearest real examples */
      nearEl.innerHTML = "";
      var ds = dimsSorted(); while (ds.length < 3) ds.push(1);
      var scored = J.map(function (j) {
        var jd = j.d.slice().sort(function (a, b) { return b - a; }), sc = 0;
        for (var i = 0; i < 3; i++) sc += Math.abs(Math.log(ds[i] / jd[i]));
        if (j.m.indexOf(st.mat) < 0) sc += 2.5;
        return { j: j, sc: sc };
      }).sort(function (a, b) { return a.sc - b.sc; }).filter(function (x) { return x.sc < 2.2; }).slice(0, 3);
      nearEl.appendChild(el("h3", null, UI.near_h));
      if (!scored.length) nearEl.appendChild(el("p", "note", UI.near_none));
      else {
        var g = el("div", "near__g");
        scored.forEach(function (x) {
          var a = el("a", "nc"); a.href = BASE + "/jirei/";
          var im = d.createElement("img"); im.src = data.img[x.j.k]; im.alt = x.j.cat + "の板金部品"; im.width = 226; im.height = 152; im.loading = "lazy"; a.appendChild(im);
          var tt = el("div", "nc__t"); tt.appendChild(el("b", null, x.j.cat)); tt.appendChild(d.createTextNode(x.j.mat + " ／ " + x.j.size + " ／ 版厚 " + x.j.t.replace(/\u3000/g, " "))); a.appendChild(tt); g.appendChild(a);
        });
        nearEl.appendChild(g);
      }

      /* enquiry link carries the inputs */
      var q = new URLSearchParams({ m: st.mat, t: fmt(t), l: st.l, w: st.w, h: st.h, b: st.b, q: st.qty, p: Object.keys(P).filter(function (k) { return P[k]; }).join(",") });
      ctaEl.setAttribute("href", BASE + "/contact/?" + q.toString() + "#form");
    }

    function readNum(id) { var v = parseFloat($("#n-" + id, tEl).value); return isFinite(v) && v >= 0 ? v : 0; }
    $$("[data-f]", tEl).forEach(function (i) { i.addEventListener("input", function () { var k = i.getAttribute("data-f"); st[k] = readNum(k); $$("[data-t]", tEl).forEach(function (b) { b.classList.toggle("is-on", parseFloat(b.getAttribute("data-t")) === st.t); }); evaluate(); }); });
    $$("[data-t]", tEl).forEach(function (b) { b.addEventListener("click", function () { var v = parseFloat(b.getAttribute("data-t")); $("#n-t", tEl).value = v; st.t = v; $$("[data-t]", tEl).forEach(function (x) { x.classList.toggle("is-on", x === b); }); evaluate(); }); });
    $$("input[name=mat]", tEl).forEach(function (r) { r.addEventListener("change", function () { if (r.checked) { st.mat = r.value; evaluate(); } }); });
    $$("input[name=qty]", tEl).forEach(function (r) { r.addEventListener("change", function () { if (r.checked) { st.qty = r.value; evaluate(); } }); });
    $$("input[name=proc]", tEl).forEach(function (c) { c.addEventListener("change", function () { st.procs[c.value] = c.checked ? 1 : 0; evaluate(); }); });
    $$("[data-preset]", tEl).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = JSON.parse(b.getAttribute("data-preset")); /* material, t, l, w, h, bend, qty, procs */
        st.mat = p[0]; st.t = p[1]; st.l = p[2]; st.w = p[3]; st.h = p[4]; st.b = p[5]; st.qty = p[6]; st.procs = {}; p[7].forEach(function (k) { st.procs[k] = 1; });
        $("#n-t", tEl).value = st.t; $("#n-l", tEl).value = st.l; $("#n-w", tEl).value = st.w; $("#n-h", tEl).value = st.h; $("#n-b", tEl).value = st.b;
        $$("input[name=mat]", tEl).forEach(function (r) { r.checked = r.value === st.mat; });
        $$("input[name=qty]", tEl).forEach(function (r) { r.checked = r.value === st.qty; });
        $$("input[name=proc]", tEl).forEach(function (c) { c.checked = !!st.procs[c.value]; });
        $$("[data-t]", tEl).forEach(function (x) { x.classList.toggle("is-on", parseFloat(x.getAttribute("data-t")) === st.t); });
        evaluate();
      });
    });
    $$("[data-t]", tEl).forEach(function (x) { x.classList.toggle("is-on", parseFloat(x.getAttribute("data-t")) === st.t); });
    evaluate();
  })();

  /* ------------------------------------------------ enquiry form -> mail draft */
  var form = $("#form");
  if (form && $("#form-data")) (function () {
    var cfg = JSON.parse($("#form-data").textContent), L = cfg.labels, q = new URLSearchParams(location.search);
    function setv(id, v) { var e = $("#" + id); if (e && v) e.value = v; }
    if (q.get("m")) {
      setv("material", cfg.mats[q.get("m")] || "");
      setv("thickness", q.get("t") ? q.get("t") + " mm" : "");
      setv("dims", q.get("l") && q.get("w") && q.get("h") ? q.get("l") + " × " + q.get("w") + " × " + q.get("h") + " mm" : "");
      setv("bend", q.get("b") && q.get("b") !== "0" ? q.get("b") + " mm" : "");
      setv("qty", cfg.qtys[q.get("q")] || "");
      setv("procs", (q.get("p") || "").split(",").map(function (k) { return cfg.procs[k]; }).filter(Boolean).join("・"));
    }
    function text() {
      var ids = ["name", "company", "email", "phone", "part", "material", "thickness", "dims", "bend", "qty", "procs", "notes"], out = [];
      ids.forEach(function (id) { var v = $("#" + id).value.trim(); if (v) out.push(L[id] + "：" + v); });
      return out.join("\n");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var co = $("#company").value.trim(), pt = $("#part").value.trim();
      var subj = cfg.subject + (pt ? "（" + pt + "）" : "") + (co ? " " + co : "");
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#form-copy");
    if (cp) cp.addEventListener("click", function () {
      var old = cp.textContent, t = text();
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { });
    });
  })();
})();
