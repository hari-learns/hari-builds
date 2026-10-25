(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header turns solid once the page is scrolled */
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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1080) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("swc-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("swc-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* hero: slow parallax, at most 6% (desktop only) */
  var heroImg = $(".hero__bg img");
  if (heroImg && !reduce && window.matchMedia("(min-width: 1200px)").matches) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.transform = "translate3d(0," + (y * 0.06).toFixed(1) + "px,0) scale(1.02)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* figures strip: count up to the real numbers when they come into view */
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var small = $("small", el), done = false;
    function set(v) { el.firstChild.nodeValue = v.toFixed(dec); }
    function run() {
      if (done) return; done = true;
      if (reduce) { set(target); return; }
      var t0 = null, dur = 1200;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        set(target * k);
        if (p < 1) requestAnimationFrame(step); else set(target);
      }
      set(0); requestAnimationFrame(step);
    }
    if (!reduce && "IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { run(); o.disconnect(); } }); }, { threshold: 0.6 });
      o.observe(el);
      setTimeout(function () { if (!done && el.getBoundingClientRect().top < window.innerHeight) run(); }, 1800);
    }
  });

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var horiz = window.innerWidth >= 860;
      var p = horiz ? Math.max(0, Math.min(1, (vh * 0.85 - r.top) / 260)) : Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.9) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* ------------------------------------------------ vessel finder */
  $$("[data-finder]").forEach(function (root_) {
    var data = JSON.parse($("[data-finder-data]", root_).textContent), ms = data.models, ui = data.ui;
    var rowsEl = $("[data-rows]", root_), sumEl = $("[data-sum]", root_), ctaEl = $("[data-cta]", root_);
    var st = { len: 11, beam: 4.5, draught: 1, kn: 35, bunks: false };
    var rows = {};
    function r1(x) { return Math.round(x * 100) / 100; }
    function fmt(x) { var s = (Math.round(x * 10) / 10).toFixed(1); return s.replace(/\.0$/, ""); }
    function fmt2(x) { return (Math.round(x * 100) / 100).toString(); }

    function build() {
      ms.forEach(function (m) {
        var row = d.createElement("article"); row.className = "brow";
        row.innerHTML =
          '<div class="brow__h"><div><h3 class="brow__n"></h3><p class="brow__s"></p></div><span class="badge"></span></div>' +
          '<div class="bars"><div class="bar-r"><div class="bar-r__l"><span data-l-len></span><b data-v-len></b></div><div class="track"><i data-b-len></i><em data-m-len></em></div></div>' +
          '<div class="bar-r"><div class="bar-r__l"><span data-l-beam></span><b data-v-beam></b></div><div class="track"><i data-b-beam></i><em data-m-beam></em></div></div></div>' +
          '<ul class="checks"></ul><a class="tlink" href=""></a>';
        $(".brow__n", row).textContent = m.name;
        $(".brow__s", row).textContent = fmt(m.loa) + " " + ui.u_m + " · " + fmt(m.beam) + " " + ui.u_m + " · " + m.kn + " " + ui.u_kn + " · " + m.hp + " hp · " + m.fuel + " L";
        $("[data-l-len]", row).textContent = ui.len; $("[data-l-beam]", row).textContent = ui.beam;
        var a = $(".tlink", row); a.textContent = ui.details; a.setAttribute("href", m.url);
        rowsEl.appendChild(row);
        rows[m.id] = { row: row, m: m, badge: $(".badge", row), checks: $(".checks", row) };
      });
    }

    function evalModel(m) {
      var c = [];
      var dl = r1(st.len - m.loa), db = r1(st.beam - m.beam), dd = r1(st.draught - m.draught), ds = m.kn - st.kn;
      c.push({ k: "len", ok: dl >= 0, t: ui.len + " " + fmt(m.loa) + " " + ui.u_m + ": " + (dl >= 0 ? fmt2(dl) + " " + ui.u_m + " " + ui.under : ui.over + " " + fmt2(-dl) + " " + ui.u_m) });
      c.push({ k: "beam", ok: db >= 0, t: ui.beam + " " + fmt(m.beam) + " " + ui.u_m + ": " + (db >= 0 ? fmt2(db) + " " + ui.u_m + " " + ui.under : ui.over + " " + fmt2(-db) + " " + ui.u_m) });
      c.push({ k: "draught", ok: dd >= 0, t: ui.draught + " " + fmt2(m.draught) + " " + ui.u_m + ": " + (dd >= 0 ? ui.fits.toLowerCase() : ui.over + " " + fmt2(-dd) + " " + ui.u_m) });
      c.push({ k: "kn", ok: ds >= 0, t: ui.speed + " " + m.kn + " " + ui.u_kn + ": " + (ds >= 0 ? "ok" : ui.short + " " + (-ds) + " " + ui.u_kn) });
      var note = [{ k: "bunks", n: true, ok: true, t: m.bunks ? ui.bunk_more : ui.bunk_less }];
      var ok = c.every(function (x) { return x.ok; });
      var tight = ok && (dl < 0.3 || db < 0.3);
      if (st.bunks) c.push(note[0]);
      return { c: c, ok: ok, tight: tight, fails: c.filter(function (x) { return !x.ok; }).length };
    }

    function chosen() {
      var use = $$("input[name=use]:checked", root_).map(function (i) { return i.value; });
      var wh = $$("input[type=radio]:checked", root_)[0];
      var prop = $("[data-prop]", root_);
      return { use: use, wh: wh ? wh.value : "", prop: prop ? prop.value : "" };
    }

    function update() {
      var ev = {}, ok = [];
      ms.forEach(function (m) { ev[m.id] = evalModel(m); if (ev[m.id].ok) ok.push(m); });
      ms.forEach(function (m) {
        var r = rows[m.id], e = ev[m.id];
        r.row.classList.toggle("is-ok", e.ok); r.row.classList.toggle("is-no", !e.ok);
        r.badge.textContent = e.ok ? (e.tight ? ui.tight : ui.fits) : ui.nofit; r.badge.className = "badge " + (e.ok ? (e.tight ? "tight" : "ok") : "no");
        r.checks.innerHTML = "";
        e.c.forEach(function (x) { var li = d.createElement("li"); if (!x.ok) li.className = "x"; else if (x.n) li.className = "n"; li.textContent = x.t; r.checks.appendChild(li); });
        function bar(kind, val, limit, max) {
          var b = $("[data-b-" + kind + "]", r.row), mk = $("[data-m-" + kind + "]", r.row), v = $("[data-v-" + kind + "]", r.row);
          b.style.width = Math.min(100, val / max * 100) + "%";
          b.classList.toggle("bad", val > limit);
          mk.style.left = Math.min(100, limit / max * 100) + "%";
          v.textContent = fmt(val) + " / " + fmt(limit) + " " + ui.u_m;
        }
        bar("len", m.loa, st.len, data.maxLen); bar("beam", m.beam, st.beam, data.maxBeam);
      });
      /* order: models meeting every check first (longest first), then the nearest misses */
      var order = ms.slice().sort(function (a, b) {
        var ea = ev[a.id], eb = ev[b.id];
        if (ea.ok !== eb.ok) return ea.ok ? -1 : 1;
        if (ea.ok && st.bunks && a.bunks !== b.bunks) return a.bunks ? -1 : 1;
        if (!ea.ok && ea.fails !== eb.fails) return ea.fails - eb.fails;
        return b.loa - a.loa;
      });
      order.forEach(function (m) { rowsEl.appendChild(rows[m.id].row); });
      var best = ok.length ? ok.slice().sort(function (a, b) { if (st.bunks && a.bunks !== b.bunks) return a.bunks ? -1 : 1; return b.loa - a.loa; })[0] : null;
      sumEl.innerHTML = best ? ui.sum_ok.replace("{n}", "<b>" + ok.length + "</b>").replace("{m}", ms.length).replace("{name}", "<b>" + best.name + "</b>") : ui.sum_none;
      /* the enquiry mail carries every number */
      var L = ui.mail_lines, ch = chosen(), lines = [ui.mail_intro, ""];
      lines.push(L.len + ": " + fmt(st.len) + " " + ui.u_m);
      lines.push(L.beam + ": " + fmt(st.beam) + " " + ui.u_m);
      lines.push(L.draught + ": " + fmt2(st.draught) + " " + ui.u_m);
      lines.push(L.kn + ": " + st.kn + " " + ui.u_kn);
      lines.push(L.use + ": " + (ch.use.length ? ch.use.join(", ") : "-"));
      lines.push(L.wh + ": " + (ch.wh || "-"));
      lines.push(L.prop + ": " + (ch.prop || "-"));
      lines.push(L.bunks + ": " + (st.bunks ? L.yes : L.no));
      lines.push(L.fit + ": " + (ok.length ? ok.map(function (m) { return m.name; }).join(", ") : L.none));
      if (best) lines.push(L.best + ": " + best.name);
      lines.push("", ui.mail_name);
      ctaEl.setAttribute("href", "mailto:" + data.to + "?subject=" + encodeURIComponent(ui.mail_subject + (best ? " - " + best.name : "")) + "&body=" + encodeURIComponent(lines.join("\n")));
    }

    function setVal(k, v, from) {
      v = Number(v); if (!isFinite(v)) return;
      var n = $("[data-f=" + k + "] input[type=number]", root_);
      var r = $("[data-r=" + k + "]", root_);
      var lo = Number(r.min), hi = Number(r.max), step = Number(r.step) || 1;
      v = Math.max(lo, Math.min(hi, Math.round(v / step) * step));
      v = Math.round(v * 100) / 100;
      st[k] = v;
      if (from !== "n") n.value = v;
      if (from !== "r") r.value = v;
      update();
    }
    $$("[data-f]", root_).forEach(function (f) {
      var k = f.getAttribute("data-f"), nIn = $("input[type=number]", f), rIn = $("input[type=range]", f);
      nIn.addEventListener("input", function (e) { if (e.target.value !== "") setVal(k, e.target.value, "n"); });
      nIn.addEventListener("change", function (e) { setVal(k, e.target.value || st[k]); });
      rIn.addEventListener("input", function (e) { setVal(k, e.target.value, "r"); });
    });
    $$("[data-preset]", root_).forEach(function (b) { b.addEventListener("click", function () { setVal("len", b.getAttribute("data-preset")); }); });
    $$("input[name=use], input[type=radio]", root_).forEach(function (i) { i.addEventListener("change", update); });
    var pr = $("[data-prop]", root_); if (pr) pr.addEventListener("change", update);
    var bk = $("[data-bunks]", root_); if (bk) bk.addEventListener("change", function () { st.bunks = bk.checked; update(); });

    build();
    /* ?use=Fishing from the use chips on the home page */
    var q = safe(function () { return new URLSearchParams(location.search); });
    if (q && q.get("use")) $$("input[name=use]", root_).forEach(function (i) { if (i.value === q.get("use")) i.checked = true; });
    update();
  });

  /* ------------------------------------------------ enquiry form -> mailto */
  var enq = $("#enq");
  if (enq) (function () {
    var cfg = JSON.parse($("#enq-data").textContent), L = cfg.labels;
    function text() {
      var out = [];
      ["name", "phone", "email", "model", "msg"].forEach(function (id) { var v = $("#" + id).value.trim(); if (v) out.push(L[id] + ": " + v); });
      return out.join("\n");
    }
    enq.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = $("#model").value;
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject + (m ? " - " + m : "")) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#enq-copy");
    cp.addEventListener("click", function () {
      var old = cp.textContent, t = text();
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { });
    });
  })();
})();
