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

  /* ------------------------------------------------ "Passt mein Teil?" : which process covers this part, from the figures on their own pages (two tiers: inside both figures = fits, between them = please ask) */
  var tEl = $("[data-tool]");
  if (tEl) (function () {
    var data = json("tool-data"), T = data.ui, P = data.tool.procs, SC = data.tool.schirm, pages = data.pages, presets = data.tool.presets;
    var de = (root.lang || "").indexOf("de") === 0, dec = de ? "," : ".";
    var radios = $$("input[name=ptype]", tEl), ea = $("#t-a"), eb = $("#t-b"), ec = $("#t-c"), em = $("#t-mat"), eq = $("#t-q");
    var fc = $('[data-f="c"]', tEl), resEl = $("[data-results]", tEl), sumEl = $("[data-sum]", tEl), cta = $("[data-cta]", tEl), qn = $("[data-qnote]", tEl), cp = $("[data-copy]", tEl);
    var st = { type: "flat", a: 300, b: 200, c: 5, mat: "alu", q: 10 };
    var last = { text: "" };
    function num(el) { var v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v > 0 ? v : NaN; }
    function fmt(n) { return String(Math.round(n * 10) / 10).replace(".", dec); }
    function tpl(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] === undefined ? m : o[k]; }); }
    function matLabel(m) { var l = T.mats.filter(function (x) { return x[0] === m; })[0]; return l ? l[1] : m; }
    function matOk(p, m) { if (m === "schirm") return false; if (p.mats.indexOf(m) > -1) return true; return m === "klar" && p.mats.indexOf("kst") > -1; }
    function desc(a) { return a.slice().sort(function (x, y) { return y - x; }); }
    function fits(dims, env) { var a = desc(dims), b = desc(env); for (var i = 0; i < a.length; i++) if (a[i] > b[i]) return false; return true; }
    function R(s, w) { return { st: s, why: w ? [w] : [] }; }
    function no(w, lab) { return { st: "no", why: [w], lab: lab }; }
    var W = function () { return T.w[st.type]; };

    /* flat part against a limit pair {ok:{a,b,tmin?,tmax}, max:{a,b,tmax}} */
    function flat(lim, prefix) {
      var o = lim.ok, m = lim.max, t = st.c, pre = prefix || "";
      var rng = (o.tmin ? fmt(o.tmin) + " " + (de ? "bis" : "to") + " " : (de ? "bis " : "up to ")) + fmt(o.tmax);
      var v = { a: fmt(st.a), b: fmt(st.b), t: fmt(t), w: W(), A: o.a, B: o.b, range: rng, A2: m.a, B2: m.b, C2: m.tmax, lo: o.tmin };
      if (!fits([st.a, st.b], [m.a, m.b]) || t > m.tmax) return no(pre + tpl(T.r_no_flat, v));
      if (o.tmin && t < o.tmin) return R("ask", pre + tpl(T.r_low, v));
      if (fits([st.a, st.b], [o.a, o.b]) && t <= o.tmax) return R("ok", pre + tpl(T.r_ok_flat, v));
      return R("ask", pre + tpl(T.r_ask_flat, v));
    }
    function block(p) {
      var d = [st.a, st.b, st.c], v = { a: fmt(st.a), b: fmt(st.b), c: fmt(st.c), A: p.ok[0], B: p.ok[1], C: p.ok[2], A2: p.max[0], B2: p.max[1], C2: p.max[2] };
      if (!fits(d, p.max)) return no(tpl(T.r_no_env, v));
      if (fits(d, p.ok)) return R("ok", tpl(T.r_ok_env, v));
      return R("ask", tpl(T.r_ask_env, v));
    }
    function evBlech() {
      var p = P.blech;
      if (st.type === "round") return null;
      if (!matOk(p, st.mat)) return no(tpl(T.r_mat_no, { m: matLabel(st.mat) }), "nolist");
      return flat(p);
    }
    function evStanz() {
      var p = P.stanz;
      if (st.type !== "flat") return null;
      if (st.mat === "schirm") return flat(SC, T.schirm_prefix);
      if (!matOk(p, st.mat)) return no(tpl(T.r_mat_no, { m: matLabel(st.mat) }), "nolist");
      return flat(p);
    }
    function evFraes() {
      var p = P.fraes;
      if (st.mat === "schirm") { if (st.type !== "flat") return no(tpl(T.r_mat_no, { m: matLabel(st.mat) }), "nolist"); return flat(SC, T.schirm_prefix); }
      if (!matOk(p, st.mat)) return no(tpl(T.r_mat_no, { m: matLabel(st.mat) }), "nolist");
      if (st.type === "flat") return block(p);
      if (st.type === "round") { var q = { ok: p.ok, max: p.max }; var save = { a: st.a, b: st.b, c: st.c }; st.c = st.b; st.b = st.a; var r = block(q); st.a = save.a; st.b = save.b; st.c = save.c; return r; }
      return block(p);
    }
    function evDreh() {
      var p = P.dreh;
      if (st.type !== "round") return null;
      if (!matOk(p, st.mat)) return no(tpl(T.r_mat_no, { m: matLabel(st.mat) }), "nolist");
      var D = st.a, Ln = st.b, o = p.ok, m = p.max;
      var v = { d: fmt(D), l: fmt(Ln), lo: o.dmin, hi: o.dmax, L: o.len, dm: m.dmax };
      if (D > m.dmax || Ln > m.len) return no(tpl(T.r_no_dia, v));
      if (D < o.dmin) return R("ask", tpl(T.r_dia_low, v));
      if (D > o.dmax) return R("ask", tpl(T.r_ask_dia, v));
      return R("ok", tpl(T.r_ok_dia, v));
    }
    var evs = { blech: evBlech, stanz: evStanz, fraes: evFraes, dreh: evDreh };
    var pref = { flat: ["blech", "stanz", "fraes", "dreh"], block: ["fraes", "blech", "stanz", "dreh"], round: ["dreh", "fraes", "blech", "stanz"] };
    var order = { ok: 0, ask: 1, no: 2 };

    function mailText(fit) {
      var d3 = st.type === "round" ? [st.a, st.b] : [st.a, st.b, st.c];
      var typ = T.types.filter(function (x) { return x[0] === st.type; })[0][1];
      var dl = T.dims[st.type].filter(function (x) { return x; });
      var dimStr = d3.map(function (v, i) { return dl[i] + " " + fmt(v); }).join(" × ");
      var lines = [T.mail_greet, "", T.mail_intro, "", T.mail_part + ": " + typ, T.mail_dims + ": " + dimStr, T.mail_mat + ": " + matLabel(st.mat)];
      if (isFinite(st.q)) lines.push(T.mail_qty + ": " + Math.round(st.q));
      lines.push("", T.mail_fit + ": " + (fit.length ? fit.join(", ") : T.mail_none), "", T.mail_drawing, "", T.mail_bye);
      return lines.join("\n");
    }
    function setCta(on) {
      cta.setAttribute("href", on ? "mailto:" + data.email + "?subject=" + encodeURIComponent(T.mail_subject) + "&body=" + encodeURIComponent(last.text) : "mailto:" + data.email);
    }
    function update() {
      var need = st.type === "round" ? [st.a, st.b] : [st.a, st.b, st.c];
      if (need.some(function (v) { return !isFinite(v) || v <= 0; })) {
        resEl.innerHTML = ""; sumEl.textContent = T.sum_empty; qn.textContent = ""; last.text = ""; setCta(false); return;
      }
      var arr = [];
      pref[st.type].forEach(function (k, i) { var r = evs[k](); if (r) { r.id = k; r.i = i; arr.push(r); } });
      arr.sort(function (x, y) { return order[x.st] - order[y.st] || x.i - y.i; });
      var nOk = arr.filter(function (r) { return r.st === "ok"; }).length, nAsk = arr.filter(function (r) { return r.st === "ask"; }).length, tot = arr.length;
      resEl.innerHTML = arr.map(function (r) {
        return '<li class="is-' + r.st + '"><div class="rs__t"><span class="rs__n"><a href="' + pages[r.id] + '">' + T.proc_names[r.id] + '</a></span><span class="rs__b">' + T[r.lab || r.st] + '</span></div>' +
          '<p class="rs__w">' + r.why.join(" · ") + '</p><p class="rs__l">' + T.limit + ": " + T.lims[r.id] + "</p></li>";
      }).join("");
      var txt = nOk + nAsk === 0 ? T.sum_none : nOk === 0 ? tpl(T.sum_askonly, { m: "<b>" + nAsk + "</b>", t: tot }) : nAsk ? tpl(T.sum_ask, { n: "<b>" + nOk + "</b>", m: nAsk, t: tot }) : tpl(T.sum_ok, { n: "<b>" + nOk + "</b>", t: tot });
      sumEl.innerHTML = txt;
      var fit = arr.filter(function (r) { return r.st !== "no"; }).map(function (r) { return T.proc_names[r.id] + (r.st === "ask" ? " (" + T.ask + ")" : ""); });
      last.text = mailText(fit); setCta(true);
      var notes = [];
      if (nOk + nAsk > 0) {
        if (st.q >= 1000 && arr.some(function (r) { return r.id === "stanz" && r.st !== "no"; })) notes.push(T.qty_note_stanz);
        notes.push(T.qty_note_any, T.qty_start);
      }
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
      st.a = num(ea); st.b = num(eb); st.c = st.type === "round" ? 1 : num(ec); st.q = num(eq);
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
      if (last.text && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(last.text).then(done, function () { });
    });
    read();
  })();

  /* ------------------------------------------------ contact form -> mailto draft (nothing is sent from the page) */
  var cf = $("#cform");
  if (cf) (function () {
    var cfg = json("cform-data");
    function v(id) { return $("#" + id).value.trim(); }
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [cfg.greet, ""];
      if (v("c-msg")) lines.push(v("c-msg"), "");
      lines.push(cfg.bye);
      [v("c-name"), v("c-mail"), v("c-tel")].forEach(function (x) { if (x) lines.push(x); });
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
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
