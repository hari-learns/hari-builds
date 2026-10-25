(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function json(id) { var n = $("#" + id); return n ? JSON.parse(n.textContent) : null; }

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
  if (dock && safe(function () { return sessionStorage.getItem("richter-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("richter-dock", "1"); }); });

  /* reveals with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 0.06 + "s"); if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* ------------------------------------------------ "Passt mein Teil?" : which process covers this part, from their published limits */
  var tEl = $("[data-tool]");
  if (tEl) (function () {
    var data = json("tool-data"), T = data.ui, P = data.tool.procs, SC = data.tool.schirm, pages = data.pages, presets = data.presets;
    var de = (root.lang || "").indexOf("de") === 0, dec = de ? "," : ".";
    var radios = $$("input[name=ptype]", tEl), ea = $("#t-a"), eb = $("#t-b"), ec = $("#t-c"), em = $("#t-mat"), eq = $("#t-q");
    var fc = $('[data-f="c"]', tEl), resEl = $("[data-results]", tEl), sumEl = $("[data-sum]", tEl), cta = $("[data-cta]", tEl), qn = $("[data-qnote]", tEl), cp = $("[data-copy]", tEl);
    var st = { type: "flat", a: 300, b: 200, c: 5, mat: "alu", q: 10 };
    var last = { ok: [], ask: [] };
    function num(el) { var v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v > 0 ? v : NaN; }
    function fmt(n) { return String(Math.round(n * 10) / 10).replace(".", dec); }
    function tpl(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
    function matLabel(m) { var l = T.mats.filter(function (x) { return x[0] === m; })[0]; return l ? l[1] : m; }
    function matOk(p, m) { if (m === "schirm") return false; if (p.mats.indexOf(m) > -1) return true; return m === "klar" && p.mats.indexOf("kst") > -1; }
    function desc(a) { return a.slice().sort(function (x, y) { return y - x; }); }
    function fits(dims, env) { var a = desc(dims), b = desc(env); if (a.length > b.length) a = a.slice(0, b.length); for (var i = 0; i < a.length; i++) if (a[i] > b[i]) return false; return true; }
    function R(s) { return { st: s, why: [] }; }

    function evBlech() {
      var p = P.blech, r = R("ok"), t = st.c;
      if (st.type === "round") { r.st = "no"; r.why.push(T.wk_round); return r; }
      if (!matOk(p, st.mat)) { r.st = "no"; r.why.push(tpl(T.r_mat_no, { m: matLabel(st.mat) })); return r; }
      if (!fits([st.a, st.b], [p.a, p.b])) { r.st = "no"; r.why.push(tpl(T.r_big_flat, { a: fmt(st.a), b: fmt(st.b), A: p.a, B: p.b })); return r; }
      if (t > p.tmax) { r.st = "no"; r.why.push(tpl(T.r_t_out, { t: fmt(t), lo: p.tmin, hi: p.tmax })); return r; }
      if (t < p.tmin) { r.st = "ask"; r.why.push(tpl(T.r_t_min, { lo: p.tmin })); return r; }
      r.why.push(tpl(T.r_fit_flat, { a: fmt(st.a), b: fmt(st.b), A: p.a, B: p.b })); r.why.push(tpl(T.r_fit_t, { t: fmt(t), lo: p.tmin, hi: p.tmax }));
      return r;
    }
    function evStanz() {
      var p = P.stanz, r = R("ok"), t = st.c;
      if (st.type === "round") { r.st = "no"; r.why.push(T.wk_round); return r; }
      if (st.type === "block") { r.st = "no"; r.why.push(T.wk_block_stanz); return r; }
      if (st.mat === "schirm") {
        var okS = fits([st.a, st.b], [SC.a, SC.b]) && t >= SC.tmin && t <= SC.tmax;
        r.st = okS ? "ok" : "ask"; r.why.push(tpl(T.r_schirm, { a: SC.a, b: SC.b, lo: SC.tmin, hi: SC.tmax })); return r;
      }
      if (!matOk(p, st.mat)) { r.st = "no"; r.why.push(tpl(T.r_mat_no, { m: matLabel(st.mat) })); return r; }
      if (!fits([st.a, st.b], [p.a, p.b])) { r.st = "no"; r.why.push(tpl(T.r_big_flat, { a: fmt(st.a), b: fmt(st.b), A: p.a, B: p.b })); return r; }
      r.why.push(tpl(T.r_fit_flat, { a: fmt(st.a), b: fmt(st.b), A: p.a, B: p.b }));
      if (t > p.tok) { r.st = "ask"; r.why.push(tpl(T.r_t_ask, { t: fmt(t), ok: p.tok })); }
      return r;
    }
    function evFraes() {
      var p = P.fraes, r = R("ok"), dims;
      if (st.mat === "schirm") {
        if (st.type !== "flat") { r.st = "no"; r.why.push(tpl(T.r_mat_no, { m: matLabel(st.mat) })); return r; }
        var okS = fits([st.a, st.b], [SC.a, SC.b]) && st.c >= SC.tmin && st.c <= SC.tmax;
        r.st = okS ? "ok" : "ask"; r.why.push(tpl(T.r_schirm, { a: SC.a, b: SC.b, lo: SC.tmin, hi: SC.tmax })); return r;
      }
      if (!matOk(p, st.mat)) { r.st = "no"; r.why.push(tpl(T.r_mat_no, { m: matLabel(st.mat) })); return r; }
      dims = st.type === "round" ? [st.a, st.a, st.b] : [st.a, st.b, st.c];
      var o = { A: p.env[0], B: p.env[1], C: p.env[2] };
      if (fits(dims, p.env)) r.why.push(tpl(T.r_env_ok, o)); else { r.st = "no"; r.why.push(tpl(T.r_env_no, o)); }
      return r;
    }
    function evDreh() {
      var p = P.dreh, r = R("ok"), D = st.a, Ln = st.b;
      if (st.type !== "round") { r.st = "no"; r.why.push(T.wk_flat); return r; }
      if (!matOk(p, st.mat)) { r.st = "no"; r.why.push(tpl(T.r_mat_no, { m: matLabel(st.mat) })); return r; }
      var o = { d: fmt(D), lo: p.dok[0], hi: p.dok[1], dm: p.dmax, lm: p.lmax, l: fmt(Ln) };
      if (D > p.dmax) { r.st = "no"; r.why.push(tpl(T.r_dia_no, o)); return r; }
      if (Ln > p.lmax) { r.st = "no"; r.why.push(tpl(T.r_len_no, o)); return r; }
      if (D > p.dok[1] || D < p.dok[0]) { r.st = "ask"; r.why.push(tpl(T.r_dia_ask, o)); return r; }
      r.why.push(tpl(T.r_dia_ok, o)); return r;
    }
    var limits = {
      blech: function () { var p = P.blech; return p.a + " × " + p.b + " mm · " + p.tmin + "–" + p.tmax + " mm"; },
      stanz: function () { var p = P.stanz; return p.a + " × " + p.b + " mm"; },
      fraes: function () { var p = P.fraes; return p.env.join(" × ") + " mm"; },
      dreh: function () { var p = P.dreh; return "Ø " + p.dok[0] + "–" + p.dok[1] + " mm · DM " + p.dmax + " × " + p.lmax + " mm"; }
    };
    var evs = { blech: evBlech, fraes: evFraes, dreh: evDreh, stanz: evStanz };
    var order = { ok: 0, ask: 1, no: 2 };

    function mailText(fit) {
      var d3 = st.type === "round" ? [st.a, st.b] : [st.a, st.b, st.c];
      var typ = T.types.filter(function (x) { return x[0] === st.type; })[0][1];
      var dl = T.dims[st.type].filter(function (x) { return x; });
      var dimStr = d3.map(function (v, i) { return dl[i] + " " + fmt(v); }).join(" × ");
      var lines = [T.mail_greet, "", T.mail_intro, "", T.mail_part + ": " + typ, T.mail_dims + ": " + dimStr, T.mail_mat + ": " + matLabel(st.mat), T.mail_qty + ": " + Math.round(st.q), "",
        T.mail_fit + ": " + (fit.length ? fit.join(", ") : T.mail_none), "", T.mail_drawing, "", T.mail_bye];
      return lines.join("\n");
    }
    function update() {
      var arr = Object.keys(evs).map(function (k, i) { var r = evs[k](); r.id = k; r.i = i; return r; });
      arr.sort(function (x, y) { return order[x.st] - order[y.st] || x.i - y.i; });
      var nOk = arr.filter(function (r) { return r.st === "ok"; }).length, nAsk = arr.filter(function (r) { return r.st === "ask"; }).length;
      resEl.innerHTML = arr.map(function (r) {
        return '<li class="is-' + r.st + '"><div class="rs__t"><span class="rs__n"><a href="' + pages[r.id] + '">' + T.proc_names[r.id] + '</a></span><span class="rs__b">' + T[r.st] + '</span></div>' +
          '<p class="rs__w">' + r.why.join(" · ") + '</p><p class="rs__l">' + T.limit + ": " + limits[r.id]() + "</p></li>";
      }).join("");
      var txt = nOk + nAsk === 0 ? T.sum_none : nAsk ? tpl(T.sum_ask, { n: "<b>" + nOk + "</b>", m: nAsk }) : tpl(T.sum_ok, { n: "<b>" + nOk + "</b>" });
      sumEl.innerHTML = txt;
      var fit = arr.filter(function (r) { return r.st !== "no"; }).map(function (r) { return T.proc_names[r.id] + (r.st === "ask" ? " (" + T.ask + ")" : ""); });
      last.text = mailText(fit);
      cta.setAttribute("href", "mailto:" + data.email + "?subject=" + encodeURIComponent(T.mail_subject) + "&body=" + encodeURIComponent(last.text));
      var notes = [];
      if (arr.some(function (r) { return r.id === "stanz" && r.st !== "no"; })) notes.push(T.qty_note_stanz);
      notes.push(T.qty_note_any, T.qty_start);
      qn.textContent = notes.join("\n");
    }
    function labels() {
      var dl = T.dims[st.type];
      $('[data-dl="a"]', tEl).textContent = dl[0]; $('[data-dl="b"]', tEl).textContent = dl[1];
      $('[data-dl="c"]', tEl).textContent = dl[2] || ""; fc.hidden = !dl[2];
    }
    function read() {
      var t = radios.filter(function (r) { return r.checked; })[0];
      st.type = t ? t.value : "flat"; st.mat = em.value;
      var a = num(ea), b = num(eb), c = num(ec), q = num(eq);
      st.a = isNaN(a) ? 1 : a; st.b = isNaN(b) ? 1 : b; st.c = isNaN(c) ? (st.type === "round" ? 0 : 1) : c; st.q = isNaN(q) ? 1 : q;
      labels(); update();
    }
    radios.forEach(function (r) { r.addEventListener("change", read); });
    [ea, eb, ec, eq].forEach(function (i) { i.addEventListener("input", read); });
    em.addEventListener("change", read);
    $$("[data-preset]", tEl).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = presets[Number(b.getAttribute("data-preset"))];
        radios.forEach(function (r) { r.checked = r.value === p[0]; });
        ea.value = p[1]; eb.value = p[2]; ec.value = p[3] || 1; em.value = p[4]; read();
      });
    });
    if (cp) cp.addEventListener("click", function () {
      var old = cp.textContent;
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(last.text).then(done, function () { });
    });
    read();
  })();

  /* ------------------------------------------------ office open now, from the published hours (Europe/Vienna) */
  var openEls = $$("[data-open]");
  if (openEls.length) safe(function () {
    var od = json("open-data"); if (!od) return;
    var T = od.t, H = od.hours;
    function hm(s) { var a = s.split(":"); return Number(a[0]) * 60 + Number(a[1]); }
    function slots(day) { return day >= 1 && day <= 4 ? H["1-4"] : null; }
    function render() {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], now = Number(o.hour) * 60 + Number(o.minute), txt = "";
      var today = slots(day), i;
      if (today) for (i = 0; i < today.length; i++) if (now >= hm(today[i][0]) && now < hm(today[i][1])) txt = T.open_yes.replace("{t}", today[i][1]);
      if (!txt) {
        var found = null;
        for (var off = 0; off < 8 && !found; off++) {
          var dd = (day + off) % 7, sl = slots(dd);
          if (!sl) continue;
          for (i = 0; i < sl.length; i++) if (off > 0 || hm(sl[i][0]) > now) { found = { off: off, day: dd, t: sl[i][0] }; break; }
        }
        if (found) txt = T.open_no.replace("{d}", found.off === 0 ? T.today : found.off === 1 ? T.tomorrow : T.days[found.day]).replace("{t}", found.t);
      }
      openEls.forEach(function (el) { el.textContent = txt; });
    }
    render();
  });
})();
