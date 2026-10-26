(function () {
  "use strict";
  var d = document, w = window;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && store("bausola-dock") === "x") dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; store("bausola-dock", "x"); });

  /* drawer */
  var dr = $("#drawer"), bg = $("#burger"), dxx = $("#drawer-x");
  function setDrawer(o) {
    if (!dr) return;
    dr.classList.toggle("open", o); dr.setAttribute("aria-hidden", o ? "false" : "true"); bg.setAttribute("aria-expanded", o ? "true" : "false");
    d.documentElement.style.overflow = o ? "hidden" : "";
    if (o) { var f = $("a", dr); f && f.focus(); } else { bg.focus && bg.focus(); }
  }
  if (bg) { bg.addEventListener("click", function () { setDrawer(true); }); }
  if (dxx) dxx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr && dr.classList.contains("open")) setDrawer(false); });
  if (dr) $$("a", dr).forEach(function (a) { a.addEventListener("click", function () { d.documentElement.style.overflow = ""; }); });
  w.addEventListener("resize", function () { if (w.innerWidth >= 1180 && dr && dr.classList.contains("open")) setDrawer(false); });

  /* reveals */
  var rv = $$(".rv");
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in w)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el, i) { el.style.transitionDelay = ((i % 4) * 60) + "ms"; io.observe(el); });
    var sweep = function () { var vh = w.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); }); sweep();
  }

  /* counters (real catalogue numbers; static value is already in the HTML) */
  $$("[data-count]").forEach(function (el) {
    var n = +el.getAttribute("data-count"); if (reduce || !("IntersectionObserver" in w)) return;
    var done = false, o2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || done) return; done = true; o2.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function tick(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); else el.textContent = n; })(t0);
      });
    }, { threshold: 0.6 }); o2.observe(el);
  });

  /* open now (Mon-Fri 8-12 / 14-18, Europe/Rome) */
  var on = $("#opennow");
  if (on) {
    var H = { 1: [[8, 12], [14, 18]], 2: [[8, 12], [14, 18]], 3: [[8, 12], [14, 18]], 4: [[8, 12], [14, 18]], 5: [[8, 12], [14, 18]] };
    try {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), g = {};
      p.forEach(function (x) { g[x.type] = x.value; });
      var wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[g.weekday], hr = (+g.hour % 24) + (+g.minute) / 60, slots = H[wd] || [], open = slots.some(function (s) { return hr >= s[0] && hr < s[1]; });
      on.classList.toggle("yes", open); on.lastElementChild.textContent = open ? "Aperti ora" : "Chiusi ora";
    } catch (e) { }
  }

  /* timeline arrows */
  $$("[data-tl]").forEach(function (b) {
    b.addEventListener("click", function () {
      var tl = b.closest("section").querySelector(".tl"); if (!tl) return;
      tl.scrollBy({ left: (+b.getAttribute("data-tl")) * Math.min(640, tl.clientWidth * 0.8), behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* lite YouTube (their own video, loads only on tap) */
  $$("[data-yt]").forEach(function (f) {
    var b = $("button", f);
    b.addEventListener("click", function () {
      var i = d.createElement("iframe"); i.src = "https://www.youtube-nocookie.com/embed/" + f.getAttribute("data-yt") + "?autoplay=1&rel=0";
      i.allow = "autoplay; encrypted-media; picture-in-picture"; i.allowFullscreen = true; i.title = "Video Bausola"; i.loading = "lazy";
      f.innerHTML = ""; f.appendChild(i);
    });
  });

  /* gallery */
  var gm = $("#gmain");
  $$(".thumbs button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (gm) { gm.src = b.getAttribute("data-g"); gm.srcset = b.getAttribute("data-gs"); }
      $$(".thumbs button").forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); });
    });
  });

  /* listing filter + sort + paging */
  var list = $("#list");
  if (list && $("#q")) {
    var cards = $$(".card", list), q = $("#q"), cat = $("#cat"), br = $("#br"), st = $("#st"), so = $("#so"), cnt = $("#count"), em = $("#empty"), tot = cards.length, PAGE = 12, shown = PAGE;
    var mr = $("#morerow"), mb = $("#morebtn");
    function f(reset) {
      if (reset !== false) shown = PAGE;
      var t = q.value.trim().toLowerCase(), c = cat.value, b = br.value, s = st ? st.value : "", srt = so.value, ok = [];
      cards.forEach(function (el) {
        var m = (!c || el.getAttribute("data-leaf") === c) && (!b || el.getAttribute("data-brand") === b) && (!s || el.getAttribute("data-state") === s) && (!t || el.getAttribute("data-q").indexOf(t) > -1);
        if (m) ok.push(el); else el.hidden = true;
      });
      ok.sort(function (a, z) {
        if (srt === "name") return a.getAttribute("data-name") < z.getAttribute("data-name") ? -1 : 1;
        if (srt === "new") return (+z.getAttribute("data-year")) - (+a.getAttribute("data-year"));
        if (srt === "old") return (+a.getAttribute("data-year") || 9999) - (+z.getAttribute("data-year") || 9999);
        return (+a.getAttribute("data-i")) - (+z.getAttribute("data-i"));
      });
      ok.forEach(function (el, i) { list.appendChild(el); el.hidden = i >= shown; });
      cnt.innerHTML = (ok.length === tot ? "<b>" + tot + "</b> schede" : "<b>" + ok.length + "</b> di " + tot + " schede") + (ok.length > shown ? " · ne mostro " + shown : "");
      em.hidden = ok.length > 0; mr.hidden = ok.length <= shown;
      if (mb) mb.textContent = "Mostra altre " + Math.min(PAGE, ok.length - shown);
    }
    [q].forEach(function (x) { x.addEventListener("input", function () { f(); }); });
    [cat, br, st, so].forEach(function (x) { if (x) x.addEventListener("change", function () { f(); }); });
    if (mb) mb.addEventListener("click", function () { shown += PAGE; f(false); });
    $("#freset").addEventListener("click", function () { q.value = ""; cat.value = ""; br.value = ""; if (st) st.value = ""; so.value = ""; f(); });
    var m = /[?&]cat=([\w-]+)/.exec(location.search); if (m) cat.value = m[1];
    f();
  }

  /* contact form -> prefilled email */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = "Buongiorno,\n" + $("#f-m").value + "\n\nNome e azienda: " + $("#f-n").value + "\nTelefono: " + $("#f-t").value;
    location.href = "mailto:" + cf.getAttribute("data-to") + "?subject=" + encodeURIComponent("Richiesta informazioni dal sito") + "&body=" + encodeURIComponent(body);
  });

  /* signature tool: find the machine that fits the piece */
  var td = $("#tool-data");
  if (td) {
    var cfg = JSON.parse(td.textContent), fams = {}, T = cfg.t, mail = cfg.mail, B = cfg.base;
    cfg.fams.forEach(function (f) { fams[f.id] = f; });
    var res = $("#results"), s2 = $("#step2"), s3 = $("#step3"), dims = $("#dims"), nod = $("#nodims"), cur = null, vals = {}, kind = "", expanded = false;
    function nf(n) { var s = String(n), p = s.split("."); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (p[1] ? "," + p[1] : ""); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function buildDims(f) {
      dims.innerHTML = "";
      f.inputs.forEach(function (i, k) {
        var wrap = d.createElement("div"); wrap.className = "field";
        wrap.innerHTML = '<label for="in-' + i.id + '">' + esc(i.label) + '</label><div class="unit"><input class="inp" id="in-' + i.id + '" type="number" inputmode="decimal" min="0" step="any" placeholder="es. ' + i.ph + '" autocomplete="off"><i>' + esc(i.unit) + "</i></div>";
        dims.appendChild(wrap);
        var inp = $("input", wrap); if (vals[i.id] != null) inp.value = vals[i.id];
        inp.addEventListener("input", function () { var v = parseFloat(String(inp.value).replace(",", ".")); if (isFinite(v) && v > 0) vals[i.id] = v; else delete vals[i.id]; render(); });
      });
      nod.hidden = f.inputs.length > 0; dims.hidden = f.inputs.length === 0;
    }
    function evalM(m, f) {
      var out = { fail: false, unk: 0, ok: [], slack: 0, n: 0 };
      f.inputs.forEach(function (i) {
        var need = vals[i.id]; if (need == null) return; out.n++;
        var v = m.v[i.spec];
        if (!v) { out.unk++; out.ok.push({ q: 1, t: i.label + ": dato non pubblicato" }); return; }
        if (i.mode === "range") {
          if (need >= v[0] && need <= v[1]) out.ok.push({ t: i.label + " " + nf(need) + " mm (macchina " + nf(v[0]) + "–" + nf(v[1]) + ")" });
          else out.fail = true;
        } else {
          if (need <= v[0]) { out.ok.push({ t: i.label + " " + nf(need) + " → macchina " + nf(v[0]) + " " + i.unit }); out.slack += (v[0] - need) / v[0]; }
          else if (v[1] && need <= v[1]) { out.ok.push({ t: i.label + " " + nf(need) + " → con optional " + nf(v[1]) + " " + i.unit }); out.slack += 0.5; }
          else out.fail = true;
        }
      });
      return out;
    }
    function measures(f) { return f.inputs.filter(function (i) { return vals[i.id] != null; }).map(function (i) { return i.label + ": " + nf(vals[i.id]) + " " + i.unit; }); }
    function mailFor(m, f) {
      var ms = measures(f), body = "Buongiorno,\nvorrei il prezzo e la disponibilità di: " + m.n + (m.c ? " (cod. " + m.c + ")" : "") + "\n" + m.u + "\n" + (ms.length ? "\nMisure del mio pezzo:\n- " + ms.join("\n- ") + "\n" : "") + "\nNome e azienda:\nTelefono:\n\nGrazie";
      return "mailto:" + mail + "?subject=" + encodeURIComponent("Richiesta informazioni: " + m.n) + "&body=" + encodeURIComponent(body);
    }
    function card(m, f, r) {
      var tag = m.k === "n" ? '<span class="tag">Nuovo</span>' : m.k === "u" ? '<span class="tag u">Usato' + (m.y ? " " + m.y : "") + "</span>" : '<span class="tag b">Bausola</span>';
      var why = r && r.ok.length ? '<ul class="why">' + r.ok.map(function (o) { return "<li" + (o.q ? ' class="q"' : "") + ">" + esc(o.t) + "</li>"; }).join("") + "</ul>" : "";
      return '<article class="rcard' + (r && r.n && !r.unk && !r.fail ? " ok" : "") + '"><a class="im" href="' + B + "/macchine/" + m.s + '/" tabindex="-1" aria-hidden="true"><img src="' + m.p + '" alt="" width="132" height="100" loading="lazy" decoding="async"></a><div><div class="tags">' + tag + '</div><h3 style="margin-top:6px"><a href="' + B + "/macchine/" + m.s + '/">' + esc(m.n) + "</a></h3><p class=\"sub\">" + esc(m.d || cfg.leafLabels[m.l]) + "</p>" + why + '</div><div class="acts"><a class="btn btn-p" href="' + mailFor(m, f) + '">' + esc(T.send) + '</a><a class="btn btn-o on-paper" href="' + B + "/macchine/" + m.s + '/">Scheda</a></div></article>';
    }
    function pushState() {
      var p = []; if (cur) p.push("f=" + cur.id); Object.keys(vals).forEach(function (k) { p.push(k + "=" + vals[k]); }); if (kind) p.push("k=" + kind);
      try { history.replaceState(null, "", location.pathname + (p.length ? "?" + p.join("&") : "")); } catch (e) { }
    }
    function render() {
      if (!cur) return; pushState();
      var f = cur, all = cfg.ms.filter(function (m) { return f.leafs.indexOf(m.l) > -1 && (!kind || m.k === kind); }), rows = all.map(function (m) { return { m: m, r: evalM(m, f) }; });
      var fit = rows.filter(function (x) { return !x.r.fail && !x.r.unk; }), maybe = rows.filter(function (x) { return !x.r.fail && x.r.unk; }), anyIn = f.inputs.some(function (i) { return vals[i.id] != null; });
      var order = { n: 0, b: 1, u: 2 };
      fit.sort(function (a, b) { return (a.r.slack - b.r.slack) || (order[a.m.k] - order[b.m.k]); });
      var h = "", ms = measures(f);
      var head = anyIn ? "<b>" + fit.length + "</b> " + (fit.length === 1 ? "macchina adatta" : T.result_count) + " " + T.of_total + " " + all.length : "<b>" + all.length + "</b> " + (all.length === 1 ? "macchina in catalogo" : T.showing_all);
      var allMail = "mailto:" + mail + "?subject=" + encodeURIComponent("Cerco una macchina: " + f.label) + "&body=" + encodeURIComponent("Buongiorno,\ncerco: " + f.label + "\n" + (ms.length ? "\nMisure del mio pezzo:\n- " + ms.join("\n- ") + "\n" : "") + "\nMacchine del catalogo che mi sembrano adatte:\n" + fit.slice(0, 5).map(function (x) { return "- " + x.m.n; }).join("\n") + "\n\nNome e azienda:\nTelefono:\n\nGrazie");
      h += '<div class="res-head"><h2>' + head + '</h2><a class="btn btn-o on-paper" href="' + allMail + '">' + esc(T.send_all) + "</a></div>";
      if (anyIn && !fit.length && !maybe.length) h += '<p class="empty">' + esc(T.none_fit) + " " + esc(T.none_fit_help) + "</p>";
      var show = expanded ? fit : fit.slice(0, 12);
      h += '<div class="res">' + show.map(function (x) { return card(x.m, f, anyIn ? x.r : null); }).join("") + "</div>";
      if (!expanded && fit.length > 12) h += '<p style="margin-top:16px"><button class="btn btn-o on-paper" type="button" id="more">Mostra tutte le ' + fit.length + "</button></p>";
      if (maybe.length) h += '<p class="grp">' + esc(T.maybe) + " (" + maybe.length + ')</p><div class="res">' + maybe.slice(0, expanded ? 99 : 6).map(function (x) { return card(x.m, f, x.r); }).join("") + "</div>";
      res.innerHTML = h;
      var jp = $("#jump"); if (jp) { jp.hidden = false; jp.innerHTML = (anyIn ? fit.length : all.length) + " " + (anyIn ? T.result_count : T.showing_all) + " · vedi"; }
      var mb = $("#more"); if (mb) mb.addEventListener("click", function () { expanded = true; render(); });
    }
    function pick(id, keep) {
      cur = fams[id]; if (!keep) vals = {}; expanded = false; s2.hidden = false; s3.hidden = false; buildDims(cur); render();
    }
    $$('input[name="fam"]').forEach(function (r) { r.addEventListener("change", function () { pick(r.value); if (w.innerWidth < 1000) { var t = $("#step2"); t && t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); } }); });
    $$('input[name="kind"]').forEach(function (r) { r.addEventListener("change", function () { kind = r.value; expanded = false; render(); }); });
    // restore from URL
    var qs = {}; location.search.replace(/^\?/, "").split("&").forEach(function (p) { var a = p.split("="); if (a[0]) qs[a[0]] = decodeURIComponent(a[1] || ""); });
    if (qs.f && fams[qs.f]) {
      var r0 = $('input[name="fam"][value="' + qs.f + '"]'); if (r0) r0.checked = true;
      cur = fams[qs.f]; cur.inputs.forEach(function (i) { var v = parseFloat(qs[i.id]); if (isFinite(v) && v > 0) vals[i.id] = v; });
      if (qs.k === "n" || qs.k === "u") { kind = qs.k; var rk = $('input[name="kind"][value="' + kind + '"]'); if (rk) rk.checked = true; }
      pick(qs.f, true);
    }
  }
})();
