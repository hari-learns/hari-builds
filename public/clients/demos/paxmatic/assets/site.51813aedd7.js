(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) root.classList.add("reduce");
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var lang = root.lang === "en" ? "en" : "de";

  /* header turns solid on scroll */
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
  if (dock && safe(function () { return sessionStorage.getItem("pax-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("pax-dock", "1"); }); });

  /* reveals (also reveals anything already scrolled past) */
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

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (reduce || li.getBoundingClientRect().top < vh * 0.82) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* their own film: facade -> dialog (nothing loads from YouTube until it is opened) */
  var vlinks = $$("[data-video]"), vdlg = $("#vdlg"), vframe = null;
  if (vlinks.length && vdlg && typeof vdlg.showModal === "function") {
    vlinks.forEach(function (vlink) { vlink.addEventListener("click", function () {
      vframe = d.createElement("iframe");
      vframe.src = "https://www.youtube-nocookie.com/embed/" + vlink.getAttribute("data-video") + "?autoplay=1&rel=0";
      vframe.title = vdlg.getAttribute("aria-label") || "";
      vframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      vframe.setAttribute("allowfullscreen", "");
      vdlg.appendChild(vframe); vdlg.showModal();
    }); });
    vdlg.addEventListener("close", function () { if (vframe) { vframe.remove(); vframe = null; } });
    vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
    $$("[data-vclose]", vdlg).forEach(function (b) { b.addEventListener("click", function () { vdlg.close(); }); });
  } else {
    vlinks.forEach(function (vlink) { vlink.addEventListener("click", function () { window.open("https://www.youtube.com/watch?v=" + vlink.getAttribute("data-video"), "_blank", "noopener"); }); });
  }

  /* machine filter chips */
  $$("[data-filter]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      $$("[data-filter]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      $$("[data-filter-grid] [data-fam]").forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-fam") === f); });
    });
  });

  /* opening hours, in Zurich time */
  $$("[data-hours]").forEach(function (box) {
    var cfg = JSON.parse(box.getAttribute("data-hours")), H = cfg.h, ui = cfg.ui, line = $("[data-open-now]", box);
    function zurich() {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      return { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    }
    function mins(s) { var p = s.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
    var now = zurich(), msg = "", open = false;
    var today = H[String(now.day)] || [];
    for (var i = 0; i < today.length; i++) { if (now.min >= mins(today[i][0]) && now.min < mins(today[i][1])) { open = true; msg = ui.open_now + " " + ui.until + " " + today[i][1]; } }
    if (!open) {
      var next = "";
      for (var k = 0; k < 8 && !next; k++) {
        var dd = (now.day + k) % 7, slots = H[String(dd)] || [];
        for (var j = 0; j < slots.length; j++) { if (k > 0 || mins(slots[j][0]) > now.min) { next = slots[j][0]; var lab = k === 0 ? ui.today : (k === 1 ? ui.tomorrow : $$("tr", box)[dd] ? $$("tr td:first-child", box)[dd].textContent : ""); msg = ui.closed_now + ", " + ui.opens + " " + lab + " " + next; break; } }
      }
      if (!msg) msg = ui.closed_now;
    }
    if (line) { line.textContent = msg; line.classList.add(open ? "is-open" : "is-closed"); }
    var tr = $$("tr", box)[now.day]; if (tr) tr.classList.add("today");
  });

  /* contact form -> prepared email (nothing is sent or stored by this page) */
  $$("[data-contact]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = function (n) { return (form.elements[n] && form.elements[n].value || "").trim(); };
      var body = g("msg") + "\n\n" + [g("name"), g("company"), g("email"), g("phone")].filter(Boolean).join("\n");
      window.location.href = "mailto:" + form.getAttribute("data-mail") + "?subject=" + encodeURIComponent(form.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
    });
  });

  /* ------------------------------------------------------------ the finder: which machine fits? (their datasheet values only) */
  $$("[data-finder]").forEach(function (root) {
    var data = JSON.parse($("[data-finder-data]", root).textContent), ui = data.ui, F = data.f;
    var out = $("[data-out]", root), form = $("form", root), mode = data.mode, showNo = false, showAll = false, timer = null;
    function num(n) { var el = form.elements[n]; if (!el) return NaN; var v = parseFloat(String(el.value).replace(",", ".")); return isNaN(v) ? NaN : v; }
    function pct(v, max) { return Math.max(3, Math.min(100, max ? (v / max) * 100 : 0)); }
    function mm(v) { return (Math.round(v * 10) / 10).toString().replace(".", lang === "de" ? "," : ".") + " mm"; }
    function chk(label, text, v, ok) { return { label: label, text: text, v: v, ok: ok }; }

    function evalBag(m, st) {
      var n = m.n, cs = [], ok = true, variant = false, slack = 0;
      if (!isNaN(st.w)) {
        var okw = st.w <= n.wmax && (!n.wmin || st.w >= n.wmin);
        if (okw && n.wbase && st.w > n.wbase) variant = true;
        cs.push(chk(ui.why_w, mm(st.w) + "  " + (okw ? "≤ " : "> ") + (n.wmin ? n.wmin + "–" : "") + n.wmax + " mm" + (variant ? " (" + ui.variant + ")" : ""), pct(st.w, n.wmax), okw));
        if (!okw) ok = false; else slack += 1 - st.w / n.wmax;
      }
      if (!isNaN(st.l)) {
        if (n.lmax) { var okl = st.l <= n.lmax; cs.push(chk(ui.why_l, mm(st.l) + "  " + (okl ? "≤ " : "> ") + n.lmax + " mm", pct(st.l, n.lmax), okl)); if (!okl) ok = false; else slack += 1 - st.l / n.lmax; }
        else cs.push(chk(ui.why_l, ui.stepless, 100, true));
      }
      if (!isNaN(st.h) && n.pmax) {
        var okh = st.h <= n.pmax; if (okh && n.pbase && st.h > n.pbase) variant = true;
        cs.push(chk(ui.why_h, mm(st.h) + "  " + (okh ? "≤ " : "> ") + n.pmax + " mm" + (okh && n.pbase && st.h > n.pbase ? " (" + ui.variant + ")" : ""), pct(st.h, n.pmax), okh)); if (!okh) ok = false;
      }
      if (!isNaN(st.perMin)) {
        var okp = st.perMin <= n.perMin; cs.push(chk(ui.why_pm, st.perMin + "  " + (okp ? "≤ " : "> ") + n.perMin + " " + ui.unit_bags, pct(st.perMin, n.perMin), okp));
        if (!okp) ok = false; else slack += 1 - st.perMin / n.perMin;
      }
      if (st.film !== "any") {
        var okf = n.film.indexOf(st.film) >= 0; cs.push(chk(ui.why_film, st.film === "flat" ? F.flat : F.tube, okf ? 100 : 6, okf)); if (!okf) ok = false;
      }
      if (!isNaN(st.thick)) {
        var okt = st.thick >= n.fmin && st.thick <= n.fmax; cs.push(chk(ui.why_t, st.thick + " my  " + (okt ? "∈ " : "∉ ") + n.fmin + "–" + n.fmax + " my", pct(st.thick, n.fmax), okt)); if (!okt) ok = false;
      }
      return { m: m, s: ok ? (variant ? "variant" : "fit") : "no", cs: cs, slack: slack };
    }
    function evalFlat(m, st) {
      var n = m.n, cs = [], ok = true, slack = 0;
      var L = st.fl, W = st.fw;
      if (!isNaN(L) && !isNaN(W)) {
        var maxOK = (L <= n.fmax[0] && W <= n.fmax[1]) || (L <= n.fmax[1] && W <= n.fmax[0]);
        var minOK = (L >= n.fmin[0] && W >= n.fmin[1]) || (L >= n.fmin[1] && W >= n.fmin[0]);
        var okf = maxOK && minOK;
        cs.push(chk(ui.why_fmt, L + " × " + W + " mm  (" + ui.min + " " + n.fmin[0] + " × " + n.fmin[1] + ", " + ui.max + " " + n.fmax[0] + " × " + n.fmax[1] + ")", pct(Math.max(L, W), Math.max(n.fmax[0], n.fmax[1])), okf));
        if (!okf) ok = false; else slack += 1 - Math.max(L, W) / Math.max(n.fmax[0], n.fmax[1]);
      }
      if (!isNaN(st.ft)) {
        var okt = st.ft >= n.tmin && st.ft <= n.tmax; cs.push(chk(ui.why_th, st.ft + " mm  (" + n.tmin + "–" + n.tmax + " mm)", pct(st.ft, n.tmax), okt)); if (!okt) ok = false; else slack += 1 - st.ft / n.tmax;
      }
      if (!isNaN(st.fpm)) {
        var okp = st.fpm <= n.perMin; cs.push(chk(ui.why_pm, st.fpm + "  " + (okp ? "≤ " : "> ") + n.perMin + " " + ui.unit_prod, pct(st.fpm, n.perMin), okp)); if (!okp) ok = false; else slack += 1 - st.fpm / n.perMin;
      }
      return { m: m, s: ok ? "fit" : "no", cs: cs, slack: slack };
    }
    function evalCount(m, st) {
      if (m.n.kind === "counter") {
        var hit = data.multi.filter(function (v) { return st.part >= v.lo && st.part <= v.hi; });
        var cs = [chk(ui.why_size, isNaN(st.part) ? "-" : mm(st.part) + "  (" + data.multi.map(function (v) { return v.n + " " + v.lo + "–" + v.hi; }).join(", ") + " mm)", 100, hit.length > 0)];
        if (hit.length) cs.push(chk(ui.count_mc + " " + ui.count_mc_v, hit.map(function (v) { return v.n; }).join(", "), 100, true));
        return { m: m, s: hit.length ? "fit" : "no", cs: cs, slack: 0 };
      }
      if (m.id === "zm410-650") return { m: m, s: "ask", cs: [], note: ui.count_zm, slack: 5 };
      if (m.id === "zaehl-wiege-tisch") return { m: m, s: "ask", cs: [], note: ui.count_manual, slack: 6 };
      return null;
    }

    function state() {
      var el = form.elements;
      return { w: num("w"), l: num("l"), h: num("h"), perMin: num("perMin"), film: el.film ? el.film.value : "any", thick: num("thick"),
        fl: num("fl"), fw: num("fw"), ft: num("ft"), fpm: num("fpm"), part: num("part"), qty: num("qty"), label: el.label && el.label.checked };
    }
    function results(st) {
      var r = [];
      data.machines.forEach(function (m) {
        var x = null;
        if (mode === "bag" && m.n.kind === "bag") x = evalBag(m, st);
        else if (mode === "flat" && m.n.kind === "flat") x = evalFlat(m, st);
        else if (mode === "count" && (m.n.kind === "counter" || m.n.kind === "count")) x = evalCount(m, st);
        if (x) r.push(x);
      });
      var rank = { fit: 0, variant: 1, ask: 2, no: 3 };
      r.sort(function (a, b) { return rank[a.s] - rank[b.s] || a.slack - b.slack; });
      return r;
    }
    function mailtoFor(st, fits) {
      var L = [];
      if (mode === "bag") {
        L.push(data.modes.bag);
        if (!isNaN(st.w)) L.push(ui.why_w + ": " + st.w + " mm"); if (!isNaN(st.l)) L.push(ui.why_l + ": " + st.l + " mm"); if (!isNaN(st.h)) L.push(ui.why_h + ": " + st.h + " mm");
        if (!isNaN(st.perMin)) L.push(ui.why_pm + ": " + st.perMin + " " + ui.unit_bags); if (st.film !== "any") L.push(ui.why_film + ": " + (st.film === "flat" ? F.flat : F.tube)); if (!isNaN(st.thick)) L.push(ui.why_t + ": " + st.thick + " my");
      } else if (mode === "flat") {
        L.push(data.modes.flat);
        L.push(ui.why_fmt + ": " + st.fl + " x " + st.fw + " mm"); L.push(ui.why_th + ": " + st.ft + " mm"); if (!isNaN(st.fpm)) L.push(ui.why_pm + ": " + st.fpm + " " + ui.unit_prod);
      } else {
        L.push(data.modes.count); L.push(ui.why_size + ": " + st.part + " mm"); if (!isNaN(st.qty)) L.push(F.qty + ": " + st.qty);
      }
      if (st.label) L.push(ui.label_too);
      var body = ui.greet + ",\n\n" + ui.body_intro + "\n" + L.map(function (x) { return "- " + x; }).join("\n") + "\n\n";
      if (fits.length) body += ui.body_machines + ":\n" + fits.map(function (r) { return "- " + r.m.name; }).join("\n") + "\n\n";
      body += ui.body_outro + "\n\n" + ui.body_sig + "\n" + ui.body_name;
      return "mailto:" + data.mail + "?subject=" + encodeURIComponent(ui.subject + (fits.length ? ": " + fits.slice(0, 3).map(function (r) { return r.m.name; }).join(", ") : "")) + "&body=" + encodeURIComponent(body);
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function card(r) {
      var badge = r.s === "fit" ? ui.fits : r.s === "variant" ? ui.variant : r.s === "ask" ? "?" : ui.nofit;
      var rows = r.cs.map(function (c) {
        return '<li><div class="row"><span>' + esc(c.label) + "</span><em>" + esc(c.text) + '</em></div><div class="meter' + (c.ok ? "" : " bad") + '"><i style="--v:' + c.v.toFixed(0) + '%"></i></div></li>';
      }).join("");
      if (r.note) rows = '<li><div class="row"><em>' + esc(r.note) + "</em></div></li>";
      var pdf = r.m.pdf ? '<a href="' + r.m.pdf + '" rel="noopener">' + esc(ui.datasheet || "PDF") + "</a>" : "";
      return '<article class="rcard" data-s="' + r.s + '"><div class="rcard__top"><div class="rcard__img"><img src="' + r.m.img + '" width="' + (r.m.iw || 400) + '" height="' + (r.m.ih || 400) + '" alt="' + esc(r.m.name) + '" loading="lazy"></div><div>' +
        '<div class="rcard__h"><a href="' + r.m.href + '">' + esc(r.m.name) + '</a><span class="badge">' + esc(badge) + '</span></div><p class="rcard__t">' + esc(r.m.type) + '</p></div></div><ul class="chk">' + rows + '</ul>' +
        '<div class="rcard__links"><a href="' + r.m.href + '">' + esc(F.more || "") + "</a>" + pdf + "</div></article>";
    }
    function render() {
      var st = state(), r = results(st);
      var fits = r.filter(function (x) { return x.s === "fit" || x.s === "variant"; });
      var asks = r.filter(function (x) { return x.s === "ask"; });
      var nos = r.filter(function (x) { return x.s === "no"; });
      var html = '<div class="out__sum"><b>' + fits.length + "</b><span>" + (fits.length === 1 ? ui.one_fit : ui.some_fit) + (fits.length ? " · " + ui.sort_hint : "") + "</span></div>";
      if (!fits.length) html += '<p class="out__empty">' + esc(ui.none_fit) + "</p>";
      var main = fits.concat(asks), cap = 4, hidden = main.length > cap && !showAll;
      html += '<div class="res">' + (hidden ? main.slice(0, cap) : main).map(card).join("") + "</div>";
      if (main.length > cap) html += '<button type="button" class="more-toggle" data-toggle-all>' + esc(hidden ? ui.show_all + " (" + main.length + ")" : ui.show_less) + "</button>";
      if (nos.length) {
        var open = showNo || (!fits.length && !asks.length);
        html += '<button type="button" class="more-toggle" data-toggle-no aria-expanded="' + open + '">' + esc(open ? ui.hide_other : ui.show_other) + " (" + nos.length + ")</button>";
        if (open) html += '<div class="res" style="margin-top:12px">' + nos.map(card).join("") + "</div>";
      }
      html += '<div class="out__cta"><a class="btn" href="' + mailtoFor(st, fits.concat(asks)) + '">' + esc(ui.send) + '</a><a class="btn btn--ghost" href="' + data.salesHref + '">' + esc(ui.call) + " " + esc(data.salesTel) + "</a></div>";
      out.innerHTML = html;
      var t = $("[data-toggle-no]", out); if (t) t.addEventListener("click", function () { showNo = !showNo; render(); });
      var ta = $("[data-toggle-all]", out); if (ta) ta.addEventListener("click", function () { showAll = !showAll; render(); });
      $$(".meter i", out).forEach(function (i) { var v = i.style.getPropertyValue("--v"); i.style.setProperty("--v", "0%"); requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.setProperty("--v", v); }); }); });
    }
    function setMode(m) {
      mode = m;
      $$("[data-mode]", root).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mode") === m ? "true" : "false"); });
      $$("[data-mode-fields]", root).forEach(function (f) { f.hidden = f.getAttribute("data-mode-fields") !== m; });
      showNo = false; showAll = false; render();
    }
    $$("[data-mode]", root).forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });
    form.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 90); });
    form.addEventListener("change", render);
    setMode(mode);
  });
})();
