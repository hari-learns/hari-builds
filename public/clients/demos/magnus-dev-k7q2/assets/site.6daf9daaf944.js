(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function mk(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

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
  if (dock && safe(function () { return sessionStorage.getItem("mp-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("mp-dock", "1"); }); });

  /* reveals */
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

  /* hero slideshow: crossfade, pause on hover/focus/hidden tab/off-screen, pause button, swipe */
  safe(function () {
    var hero = $("[data-hero]"); if (!hero) return;
    var slides = $$(".hslide", hero), dots = $$(".hdot", hero), pauseBtn = $("[data-pause]", hero);
    if (slides.length < 2) return;
    var cur = 0, timer = null, userPaused = reduce, hover = false, focus = false, seen = true, delay = 5200;
    function show(n) {
      n = (n + slides.length) % slides.length; if (n === cur) return;
      hero.classList.add("is-started");
      slides[cur].classList.remove("is-on"); slides[cur].setAttribute("aria-hidden", "true"); slides[cur].tabIndex = -1;
      dots[cur].classList.remove("is-on"); dots[cur].removeAttribute("aria-current");
      cur = n;
      slides[cur].classList.add("is-on"); slides[cur].removeAttribute("aria-hidden"); slides[cur].removeAttribute("tabindex");
      dots[cur].classList.add("is-on"); dots[cur].setAttribute("aria-current", "true");
    }
    function stop() { if (timer) { clearTimeout(timer); timer = null; } }
    function tick() { stop(); if (userPaused || hover || focus || !seen || d.hidden) return; timer = setTimeout(function () { show(cur + 1); tick(); }, delay); }
    dots.forEach(function (b, i) { b.addEventListener("click", function () { show(i); tick(); }); });
    function setPause(p) {
      userPaused = p; pauseBtn.classList.toggle("is-paused", p);
      var l = pauseBtn.getAttribute(p ? "data-play-l" : "data-pause-l"); pauseBtn.setAttribute("aria-label", l); tick();
    }
    pauseBtn.classList.toggle("is-paused", userPaused);
    if (userPaused) pauseBtn.setAttribute("aria-label", pauseBtn.getAttribute("data-play-l"));
    pauseBtn.addEventListener("click", function () { setPause(!userPaused); });
    hero.addEventListener("mouseenter", function () { hover = true; stop(); });
    hero.addEventListener("mouseleave", function () { hover = false; tick(); });
    hero.addEventListener("focusin", function () { focus = true; stop(); });
    hero.addEventListener("focusout", function () { focus = false; tick(); });
    d.addEventListener("visibilitychange", tick);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; tick(); }, { threshold: 0.25 }).observe(hero);
    var x0 = null;
    hero.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); tick(); }
    }, { passive: true });
    window.addEventListener("load", function () { $$("img", hero).forEach(function (im) { im.loading = "eager"; }); tick(); });
    tick();
  });

  /* counters: real figures count up once when seen */
  var cnts = $$("[data-count]");
  function runCount(el) {
    var to = Number(el.getAttribute("data-count")), t0 = null, dur = 1300;
    if (reduce || !isFinite(to)) { el.textContent = to; return; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    cnts.forEach(function (c) { cio.observe(c); });
  }

  /* product filter */
  var grid = $("[data-grid]");
  if (grid) {
    var chips = $$("[data-chip]");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var k = c.getAttribute("data-chip");
        chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        $$(".mcard", grid).forEach(function (card) { card.hidden = !(k === "all" || card.getAttribute("data-fam") === k); });
      });
    });
  }

  /* map on tap */
  $$("[data-map]").forEach(function (box) {
    var btn = $("[data-map-btn]", box);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = box.getAttribute("data-map"); f.title = box.getAttribute("data-title") || "Map"; f.loading = "lazy";
      f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      box.replaceChild(f, btn);
    });
  });

  /* quote form -> mailto */
  var qf = $("#quote");
  if (qf && $("#q-data")) (function () {
    var cfg = JSON.parse($("#q-data").textContent), L = cfg.labels, q = new URLSearchParams(location.search);
    var m = q.get("m");
    if (m && $("#message") && !$("#message").value) $("#message").value = "I would like a quote for the " + m.replace(/[^\w .\/-]/g, "").slice(0, 40) + ".";
    function text() {
      var out = [];
      ["name", "email", "phone", "designation", "company", "message"].forEach(function (id) { var v = $("#" + id).value.trim(); if (v) out.push(L[id] + ": " + v); });
      return out.join("\n");
    }
    qf.addEventListener("submit", function (e) {
      e.preventDefault();
      var co = $("#company").value.trim();
      var subj = cfg.subject + (co ? " (" + co + ")" : "");
      location.href = "mailto:" + cfg.to + "?cc=" + encodeURIComponent(cfg.cc) + "&subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#q-copy");
    cp.addEventListener("click", function () {
      var sp = $("span", cp), old = sp.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text()).then(function () { sp.textContent = cp.getAttribute("data-done"); setTimeout(function () { sp.textContent = old; }, 1800); }, function () { });
    });
  })();

  /* ------------------------------------------------ machine finder */
  var fEl = $("[data-finder]");
  if (fEl) (function () {
    var data = JSON.parse($("[data-finder-data]", fEl).textContent), ui = data.ui, ms = data.machines;
    var resEl = $("[data-results]", fEl), sumEl = $("[data-sum]", fEl), othersEl = $("[data-others]", fEl), othersH = $("[data-others-h]", fEl), othersList = $("[data-others-list]", fEl), msgEl = $("[data-msg]", fEl), waEl = $("[data-wa]", fEl), mailEl = $("[data-mail]", fEl), copyEl = $("[data-copy]", fEl);
    var st = { tab: "carton", L: 60, W: 40, H: 30, S: 100, T: 100, tube: "any", pin: "" };
    var q = new URLSearchParams(location.search);
    function num(k, lo, hi) { var v = Number(q.get(k)); return isFinite(v) && q.get(k) !== null && v >= lo && v <= hi ? Math.round(v) : null; }
    ["L", "W", "H"].forEach(function (k) { var v = num(k, 5, 300); if (v) st[k] = v; });
    var sv = num("S", 1, 250); if (sv) st.S = sv;
    var tv = num("T", 1, 250); if (tv) st.T = tv;
    if (q.get("tab") === "tube") st.tab = "tube";
    var pin = q.get("m");
    if (pin) {
      st.pin = pin.replace(/[^a-z0-9-]/g, "");
      ms.forEach(function (m) { if (m.page === st.pin || m.id === st.pin) { st.tab = m.kind; } });
    }
    var tubeLabel = {};
    ui.tube.types.forEach(function (t) { tubeLabel[t[0]] = t[1]; });
    var dimName = { L: "Length", W: "Width", H: "Height" };
    function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ""; }); }
    function cmp(v, r) { return v < r[0] ? "under" : v > r[1] ? "over" : "in"; }

    function evalCarton(m) {
      var inStd = true, inExt = !!m.ext, why = [], dims = ["L", "W", "H"], bad = {};
      dims.forEach(function (k) {
        var s = cmp(st[k], m.std[k]); if (s !== "in") inStd = false;
        if (m.ext) { var x = cmp(st[k], m.ext[k]); if (x !== "in") { inExt = false; bad[k] = x; } } else if (s !== "in") bad[k] = s;
      });
      var speedOK = st.S <= m.speed;
      var v, w;
      if (speedOK && inStd) { v = m.unpublished ? "ask" : "fits"; w = m.unpublished ? ui.why.unpub : ui.why.std; }
      else if (speedOK && inExt) { v = "ext"; w = ui.why.ext; }
      else {
        v = "no"; var parts = [];
        dims.forEach(function (k) {
          if (!bad[k]) return; var r = (m.ext || m.std)[k];
          parts.push(bad[k] === "over" ? fmt(ui.why.dim_over, { dim: dimName[k], v: st[k], max: r[1] }) : fmt(ui.why.dim_under, { dim: dimName[k], v: st[k], min: r[0] }));
        });
        if (!speedOK) parts.push(fmt(ui.why.over_speed, { max: m.speed }));
        w = parts.join(" ");
      }
      var g = dims.map(function (k) { return { l: dimName[k], lo: 0, hi: (m.ext || m.std)[k][1], std: m.ext ? m.std[k] : null, band: (m.ext || m.std)[k], v: st[k], bad: !!bad[k], txt: (m.ext || m.std)[k][0] + "-" + (m.ext || m.std)[k][1] + " mm" }; });
      g.push({ l: "Speed", band: [0, m.speed], v: st.S, bad: !speedOK, txt: "max " + m.speed + "/min" });
      return { m: m, v: v, why: w, g: g };
    }
    function evalTube(m) {
      var typeOK = st.tube === "any" || m.tubes.indexOf(st.tube) >= 0;
      var lo = m.rate[0], hi = m.rate[1], r = st.T < lo ? "below" : st.T > hi ? "over" : "in";
      var tnote = m.tubes.length === 2 ? ui.why.tube_both : (m.tubes[0] === "alu" ? ui.why.tube_alu : ui.why.tube_lami);
      var rng = lo === hi ? String(lo) : lo + "-" + hi;
      var v, w;
      if (!typeOK) { v = "no"; w = fmt(ui.why.tube_wrongtype, { t: tubeLabel[st.tube].toLowerCase() }) + " " + tnote; }
      else if (r === "in") { v = "fits"; w = "Rated " + rng + " tubes per minute. " + tnote; }
      else if (r === "below") { v = "below"; w = (lo === hi ? "Rated " + hi + " tubes per minute: your output is below the rated figure. Ask Magnus about running slower." : fmt(ui.why.tube_below, { lo: lo, hi: hi })) + " " + tnote; }
      else { v = "no"; w = fmt(ui.why.tube_over, { hi: hi }) + " " + tnote; }
      return { m: m, v: v, why: w, g: [{ l: "Output", band: [lo, hi], v: st.T, bad: r === "over" || !typeOK, txt: rng + "/min" }] };
    }
    var order = { fits: 0, ext: 1, ask: 2, below: 2, no: 3 };

    function gauge(g) {
      var row = mk("div", "g" + (g.bad ? " is-bad" : ""));
      row.appendChild(mk("span", "g__l", g.l));
      var tr = mk("div", "g__track"); tr.setAttribute("aria-hidden", "true");
      var top = Math.max(g.band[1], g.v) * 1.12, pct = function (x) { return Math.max(0, Math.min(100, x / top * 100)); };
      var b = mk("span", "g__band"); b.style.left = pct(g.band[0]) + "%"; b.style.width = (pct(g.band[1]) - pct(g.band[0])) + "%"; tr.appendChild(b);
      if (g.std) { var s = mk("span", "g__band g__band--std"); s.style.left = pct(g.std[0]) + "%"; s.style.width = (pct(g.std[1]) - pct(g.std[0])) + "%"; tr.appendChild(s); }
      var mark = mk("span", "g__mark"); mark.style.left = pct(g.v) + "%"; tr.appendChild(mark);
      row.appendChild(tr); row.appendChild(mk("span", "g__v", g.txt));
      return row;
    }
    function card(r) {
      var m = r.m, c = mk("article", "res" + (r.v === "fits" || r.v === "ext" ? " is-fit" : "") + ((m.page === st.pin || m.id === st.pin) ? " is-pin" : ""));
      var top = mk("div", "res__top");
      if (m.img) { var th = mk("div", "res__thumb"), im = d.createElement("img"); im.src = m.img; im.alt = m.alt; im.width = m.iw; im.height = m.ih; im.loading = "lazy"; th.appendChild(im); top.appendChild(th); }
      var h = mk("div", "res__h"), n = mk("h3", "res__n");
      n.appendChild(d.createTextNode(m.name + " "));
      n.appendChild(mk("span", "badge badge--" + r.v, ui.verdict[r.v === "fits" && m.kind === "tube" ? "in" : r.v]));
      h.appendChild(n); h.appendChild(mk("p", "res__t", m.type)); top.appendChild(h); c.appendChild(top);
      var gs = mk("div", "gauges"); r.g.forEach(function (g) { gs.appendChild(gauge(g)); }); c.appendChild(gs);
      c.appendChild(mk("p", "res__why", r.why));
      var bt = mk("div", "res__btns"), a = mk("a", "tlink", m.name === "MPTF 200" || m.name === "MPTF 400" ? "See MPTF 200 / 400" : "See " + m.name);
      a.href = data.base + "/products/" + m.page + "/"; bt.appendChild(a); c.appendChild(bt);
      return c;
    }
    function render() {
      var list = ms.filter(function (m) { return m.kind === st.tab; }).map(st.tab === "carton" ? evalCarton : evalTube);
      function isPin(m) { return m.page === st.pin || m.id === st.pin; }
      list.sort(function (a, b) { return (order[a.v] - order[b.v]) || ((isPin(a.m) ? -1 : 0) - (isPin(b.m) ? -1 : 0)); });
      resEl.textContent = ""; othersList.textContent = "";
      var fit = list.filter(function (r) { return r.v === "fits" || r.v === "ext"; });
      var maybe = list.filter(function (r) { return r.v === "ask" || r.v === "below"; });
      var no = list.filter(function (r) { return r.v === "no" && !isPin(r.m); });
      var shown = list.filter(function (r) { return r.v !== "no" || isPin(r.m); });
      /* summary line */
      var bits = [];
      fit.forEach(function (r) { bits.push(fmt(ui[r.v === "ext" ? "sum_ext" : "sum_fit"], { m: r.m.name })); });
      maybe.forEach(function (r) { bits.push(fmt(ui.sum_ask, { m: r.m.name })); });
      sumEl.textContent = bits.length ? bits.join(" ") : (st.tab === "carton" ? ui.none_carton : ui.none_tube);
      shown.forEach(function (r) { resEl.appendChild(card(r)); });
      othersEl.hidden = !no.length;
      othersH.textContent = fmt(ui.others_h, { n: no.length });
      no.forEach(function (r) { othersList.appendChild(card(r)); });
      /* message */
      var lines = [ui.msg_intro];
      if (st.tab === "carton") lines.push(fmt(ui.msg_carton, { L: st.L, W: st.W, H: st.H, S: st.S }));
      else lines.push(fmt(ui.msg_tube, { S: st.T, T: tubeLabel[st.tube].toLowerCase() }));
      var names = fit.map(function (r) { return r.m.name; });
      lines.push(names.length ? fmt(ui.msg_best, { m: names.join(", ") }) : ui.msg_none);
      lines.push(ui.msg_outro);
      var msg = lines.join("\n");
      msgEl.textContent = msg;
      waEl.href = "https://wa.me/" + data.wa + "?text=" + encodeURIComponent(msg);
      mailEl.href = "mailto:" + data.to + "?cc=" + encodeURIComponent(data.cc) + "&subject=" + encodeURIComponent(fmt(ui.msg_subject, { m: names.length ? names.join(", ") : "machine" })) + "&body=" + encodeURIComponent(msg);
    }

    function setVal(k, v, from) {
      v = Number(v); if (!isFinite(v)) return;
      var n = $('[data-f="' + k + '"] input[type=number]', fEl), r = $('[data-r="' + k + '"]', fEl);
      var lo = Number(n.min), hi = Number(n.max);
      v = Math.max(lo, Math.min(hi, Math.round(v)));
      st[k] = v;
      if (from !== "n") n.value = v;
      if (from !== "r") r.value = v;
      render();
    }
    $$("[data-f]", fEl).forEach(function (f) {
      var k = f.getAttribute("data-f"), n = $("input[type=number]", f), r = $("input[type=range]", f);
      var init = st[k]; n.value = init; r.value = init;
      n.addEventListener("input", function () { if (n.value !== "") setVal(k, n.value, "n"); });
      n.addEventListener("change", function () { setVal(k, n.value || st[k]); });
      r.addEventListener("input", function () { setVal(k, r.value, "r"); });
    });
    function showTab() {
      $$("[data-group]", fEl).forEach(function (g) { g.hidden = g.getAttribute("data-group") !== st.tab; });
      $$('input[type=radio][value="' + st.tab + '"]', fEl).forEach(function (r) { if (r.name.slice(-3) === "tab") r.checked = true; });
    }
    $$("input[type=radio]", fEl).forEach(function (r) {
      r.addEventListener("change", function () {
        if (r.name.slice(-3) === "tab") { st.tab = r.value; showTab(); }
        else st.tube = r.value;
        render();
      });
    });
    if (copyEl) copyEl.addEventListener("click", function () {
      var sp = $("span", copyEl), old = sp.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msgEl.textContent).then(function () { sp.textContent = copyEl.getAttribute("data-done"); setTimeout(function () { sp.textContent = old; }, 1800); }, function () { });
    });
    showTab(); render();
  })();
})();
