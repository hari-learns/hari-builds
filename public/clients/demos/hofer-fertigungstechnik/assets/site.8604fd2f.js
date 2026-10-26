(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function fmt(n) { var s = String(Math.round(n * 100) / 100); var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'"); return p.join("."); }

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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); closeLb(); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("hft-dock") === "1"; })) dock.hidden = true;
  if (dock && window.innerWidth < 960) setTimeout(function () { dock.hidden = true; }, 9000);
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("hft-dock", "1"); }); });

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

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* hero: the real part photos, tap to switch, slow auto-advance with pause */
  var hero = $(".hero");
  if (hero) {
    var slides = $$(".hslide", hero), rail = $$(".rail__b", hero), capEl = $("#hero-cap"), cur = 0, timer = null, paused = reduce, pp = $("#rail-pp");
    var loaded = {}; loaded[0] = true;
    function build(i, cb) {
      var el = slides[i]; if (loaded[i]) { cb && cb(); return; }
      var m = JSON.parse(el.getAttribute("data-meta")), im = new Image();
      im.alt = m.cap; im.width = m.w; im.height = m.h; im.sizes = "100vw"; im.decoding = "async"; im.style.objectPosition = m.pos;
      im.onload = function () { loaded[i] = true; el.appendChild(im); cb && cb(); };
      im.srcset = m.set; im.src = m.src;
    }
    function show(i) {
      build(i, function () {
        slides[cur].classList.remove("is-on"); rail[cur].classList.remove("is-on"); rail[cur].setAttribute("aria-pressed", "false");
        cur = i; slides[i].classList.add("is-on"); rail[i].classList.add("is-on"); rail[i].setAttribute("aria-pressed", "true");
        if (capEl) capEl.textContent = JSON.parse(slides[i].getAttribute("data-meta")).cap;
      });
    }
    rail.forEach(function (b, i) { b.addEventListener("click", function () { stop(true); show(i); }); });
    function tick() { show((cur + 1) % slides.length); }
    function start() { if (!timer && !paused) timer = setInterval(tick, 6500); }
    function stop(user) { if (timer) { clearInterval(timer); timer = null; } if (user) { paused = true; setPP(); } }
    function setPP() { if (pp) { pp.setAttribute("aria-pressed", paused ? "true" : "false"); pp.setAttribute("aria-label", paused ? "Bildwechsel fortsetzen" : "Bildwechsel anhalten"); } }
    if (pp) pp.addEventListener("click", function () { paused = !paused; setPP(); if (paused) stop(); else start(); });
    setPP();
    window.addEventListener("load", function () { setTimeout(start, 3500); });
    d.addEventListener("visibilitychange", function () { if (d.hidden) stop(); else start(); });
  }

  /* sticky chapters (desktop): active chapter swaps the pinned photo */
  var chaps = $$(".chap"), figs = $$(".stage__f");
  if (chaps.length && "IntersectionObserver" in window && figs.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = +en.target.getAttribute("data-i");
        chaps.forEach(function (c) { c.classList.toggle("is-on", c === en.target); });
        figs.forEach(function (f) { f.classList.toggle("is-on", +f.getAttribute("data-i") === i); });
      });
    }, { rootMargin: "-42% 0px -42% 0px" });
    chaps.forEach(function (c) { cio.observe(c); });
  }

  /* lightbox */
  var lb = null, lbItems = [], lbI = 0, lbFrom = null;
  function ensureLb() {
    if (lb) return;
    lb = d.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Bildansicht"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<div class="lb__img"></div><div class="lb__bar"><button class="lb__b" type="button" data-a="prev" aria-label="Voriges Bild">&#8592;</button><p class="lb__cap mono"></p><button class="lb__b" type="button" data-a="next" aria-label="Nächstes Bild">&#8594;</button><button class="lb__b" type="button" data-a="close" aria-label="Schliessen">&times;</button></div>';
    d.body.appendChild(lb);
    lb.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "close" || e.target.classList.contains("lb__img") || e.target === lb) closeLb();
      else if (a === "next") lbShow(lbI + 1); else if (a === "prev") lbShow(lbI - 1);
    });
  }
  function lbShow(i) {
    lbI = (i + lbItems.length) % lbItems.length; var a = lbItems[lbI];
    $(".lb__img", lb).innerHTML = '<img src="' + a.href + '" width="' + a.getAttribute("data-w") + '" height="' + a.getAttribute("data-h") + '" alt="' + (a.getAttribute("data-cap") || "").replace(/"/g, "&quot;") + '">';
    $(".lb__cap", lb).textContent = (lbI + 1) + " / " + lbItems.length + " · " + a.getAttribute("data-cap");
  }
  function openLb(a) {
    ensureLb(); lbItems = $$("[data-lb]", a.closest("ul") || d); lbI = lbItems.indexOf(a); lbFrom = a; lbShow(lbI);
    lb.classList.add("is-open"); root.style.overflow = "hidden"; $("[data-a=close]", lb).focus();
  }
  function closeLb() { if (!lb || !lb.classList.contains("is-open")) return; lb.classList.remove("is-open"); root.style.overflow = ""; if (lbFrom) lbFrom.focus(); }
  d.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("[data-lb]"); if (a) { e.preventDefault(); openLb(a); } });
  d.addEventListener("keydown", function (e) { if (lb && lb.classList.contains("is-open")) { if (e.key === "ArrowRight") lbShow(lbI + 1); if (e.key === "ArrowLeft") lbShow(lbI - 1); } });

  /* news filter */
  var chronEl = $(".chron");
  if (chronEl) {
    var fchips = $$(".filters .chip"), cnt = $("#ev-count");
    function filt(k) {
      var n = 0;
      $$(".ev", chronEl).forEach(function (ev) { var on = k === "all" || ev.getAttribute("data-k") === k; ev.hidden = !on; if (on) n++; });
      $$(".yr", chronEl).forEach(function (y) { y.hidden = !$$(".ev:not([hidden])", y).length; });
      fchips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-f") === k ? "true" : "false"); });
      if (cnt) cnt.textContent = n + " Einträge";
    }
    fchips.forEach(function (c) { c.addEventListener("click", function () { filt(c.getAttribute("data-f")); }); });
    filt("all");
  }

  /* contact form -> prepared e-mail */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements, lines = ["Guten Tag", "", f.msg.value || "", "", "Name: " + f.name.value, "E-Mail: " + f.email.value, "Telefon: " + f.tel.value];
    var to = ($("#tool-data") ? "" : "") || "info@hofer-fertigungstechnik.ch";
    location.href = "mailto:" + to + "?subject=" + encodeURIComponent(f.subject.value || "Anfrage") + "&body=" + encodeURIComponent(lines.join("\r\n"));
  });

  /* ---------------------------------------------------------------- signature tool: "Passt mein Teil?" */
  var tdEl = $("#tool-data");
  if (tdEl) {
    var DATA = JSON.parse(tdEl.textContent);
    $$("[data-tool]").forEach(function (root_) { initTool(root_); });
  }
  function initTool(box) {
    var form = $("form", box), out = $("[data-out]", box), isPage = box.getAttribute("data-tool") === "page", T = null;
    function el(n) { return form.elements[n]; }
    function num(n) { var v = parseFloat(String(el(n).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; }
    function typ() { var r = form.querySelector("input[type=radio]:checked"); return r ? r.value : "dreh"; }
    function applyType() {
      var t = typ(), box_ = t === "fraes";
      $("[data-dims=round]", form).hidden = box_; $("[data-dims=box]", form).hidden = !box_;
      $$("[data-only=box]", form).forEach(function (l) { l.hidden = !box_; if (!box_) l.querySelector("input").checked = false; });
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function meter(label, val, max, unit) {
      var over = val > max, pct = Math.min(100, val / max * 100);
      return '<div class="meter"><div class="meter__t"><span>' + label + "</span><span class=\"mono\">" + fmt(val) + " von " + fmt(max) + " " + unit + '</span></div><div class="meter__b"><i class="' + (over ? "is-over" : "") + '" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
    }
    function calc() {
      var t = typ(), q = Math.round(num("q")) || 0, mat = el("m").value, hard = DATA.hard.indexOf(mat) >= 0;
      var round = t !== "fraes", rows = [], fits = 0, dims, dimTxt, N;
      var ex = { ax5: el("ax5").checked, surf: el("surf").checked, mess: el("mess").checked, mont: el("mont").checked, konstr: el("konstr").checked };
      if (round) {
        var dd = num("d"), ll = num("l"); dims = [dd, ll]; dimTxt = "Ø" + fmt(dd) + " × " + fmt(ll) + " mm";
        N = DATA.turn.length;
        DATA.turn.forEach(function (m) {
          var why = [], ok = true;
          if (dd > m.d) { ok = false; why.push("Ø" + fmt(dd) + " ist grösser als Ø" + m.d); }
          if (ll > m.l) { ok = false; why.push("Länge " + fmt(ll) + " ist grösser als " + m.l + " mm"); }
          if (t === "dreh-fraes" && !m.driven) { ok = false; why.push("keine angetriebenen Werkzeuge, nur Drehen"); }
          var badges = [];
          if (ok && dd <= m.bar) badges.push("ab Stange möglich (bis Ø" + m.bar + ")");
          if (ok && dd > m.bar) badges.push("vom Futter");
          if (ok && m.driven && t === "dreh-fraes") badges.push(m.driven + " angetriebene Werkzeuge");
          if (ok) m.tags.forEach(function (g) { if (/Lader|roboter/i.test(g)) badges.push(g); });
          if (ok && m.id === "bo326" && ll > 70) badges.push("mit Führungsbüchse");
          var mt = meter("Durchmesser", dd, m.d, "mm") + meter("Länge", ll, m.l, "mm");
          rows.push({ m: m, ok: ok, why: why, badges: badges, meters: mt });
          if (ok) fits++;
        });
      } else {
        var p = [num("a"), num("b"), num("c")].sort(function (x, y) { return y - x; }); dims = p; dimTxt = fmt(num("a")) + " × " + fmt(num("b")) + " × " + fmt(num("c")) + " mm";
        N = DATA.mill.length;
        DATA.mill.forEach(function (m) {
          var s = m.xyz.slice().sort(function (x, y) { return y - x; }), ok = true, why = [], names = ["längste Seite", "mittlere Seite", "kürzeste Seite"];
          for (var i = 0; i < 3; i++) if (p[i] > s[i]) { ok = false; why.push(names[i] + " " + fmt(p[i]) + " ist grösser als " + s[i] + " mm"); }
          if (ex.ax5 && m.ax < 5) { ok = false; why.push("nur " + m.ax + " Achsen"); }
          var badges = ok ? [m.ax + "-Achsen vertikal"] : [];
          var mt = meter("Längste Seite", p[0], s[0], "mm") + meter("Mittlere Seite", p[1], s[1], "mm") + meter("Kürzeste Seite", p[2], s[2], "mm");
          rows.push({ m: m, ok: ok, why: why, badges: badges, meters: mt });
          if (ok) fits++;
        });
      }
      return { t: t, q: q, mat: mat, hard: hard, round: round, rows: rows, fits: fits, N: N, dims: dims, dimTxt: dimTxt, ex: ex };
    }
    function notes(r) {
      var n = [];
      if (r.q === 1) n.push("Einzelteil: Einzelteile, kleine und mittlere Serien sind unsere Spezialität.");
      if (r.round && r.q > DATA.limits.turn) n.push("Über den veröffentlichten Losgrössen (Drehen bis " + fmt(DATA.limits.turn) + " Stk.): bitte direkt anfragen.");
      if (!r.round && r.q > DATA.limits.millB) n.push("Über den veröffentlichten Losgrössen (Fräsen bis " + fmt(DATA.limits.millB) + " Stk.): bitte direkt anfragen.");
      if (!r.round && r.q > DATA.limits.millA && r.q <= DATA.limits.millB) n.push("Frästeile: auf der Website stehen Stückzahlen bis " + fmt(DATA.limits.millA) + " (Frästeile) und bis " + fmt(DATA.limits.millB) + " (CNC Fräsen). Bitte kurz klären.");
      if (r.hard) n.push(r.round ? "Hartdrehen ist eine unserer Stärken. Bitte die Härte in der Anfrage angeben." : "Hartbearbeitung gehört zu unserem Spektrum. Bitte die Härte in der Anfrage angeben.");
      if (r.round && r.dims[0] <= 250) n.push("Rohling: aus dem Materiallager gesägt, Säge-Automat Amada HA 250W bis Ø250.");
      if (r.round && r.dims[0] > 250) n.push("Rohling: grösser als der Schnittbereich der Sägen (bis Ø250), bitte anfragen.");
      if (!r.round) { var sx = r.dims.slice(1); if (sx[0] <= 300 && sx[1] <= 250) n.push("Rohling: aus dem Materiallager gesägt, Amada HA 250W (Flachprofile bis 250 × 300)."); }
      if (r.ex.mess) {
        var b = r.round ? [r.dims[0], r.dims[0], r.dims[1]] : r.dims.slice(), bs = b.slice().sort(function (x, y) { return y - x; });
        var ins = bs[0] <= 200 && bs[1] <= 150 && bs[2] <= 100;
        n.push("Messprotokoll: auf Wunsch erstellen wir es. " + (ins ? "Ihr Teil passt in das Insize Messmikroskop ISD-V150A (150 × 100 × 200 mm)." : (bs[0] <= 700 ? "Höhenmessgerät Trimos V4 (Messhöhe 700 mm) und diverse Messmittel." : "Diverse Messmittel.")));
      }
      if (r.ex.surf) n.push("Sämtliche Oberflächenbehandlungen und Härteverfahren führen wir aus oder organisieren sie in Regie. Schleifarbeiten mit Partnern.");
      if (r.ex.mont) n.push("Wir montieren und testen kleine bis mittlere Baugruppen nach Ihren Vorgaben.");
      if (r.ex.konstr) n.push("Konstruktion: wir planen, konstruieren, zeichnen und prüfen Ihre Bauteile und Baugruppen.");
      return n;
    }
    function mailText(r) {
      var tn = { dreh: "Drehteil", "dreh-fraes": "Dreh-Frästeil", fraes: "Frästeil" }[r.t];
      var ok = r.rows.filter(function (x) { return x.ok; }).map(function (x) { return x.m.name; });
      var extras = []; if (r.ex.ax5) extras.push("5-Achs-Bearbeitung"); if (r.ex.surf) extras.push("Oberflächenbehandlung / Härten"); if (r.ex.mess) extras.push("Messprotokoll"); if (r.ex.mont) extras.push("Montage"); if (r.ex.konstr) extras.push("Konstruktion / Zeichnung");
      var lines = ["Guten Tag", "", "ich möchte Folgendes anfragen:", "", "Teileart: " + tn, "Mass: " + r.dimTxt, "Werkstoff: " + r.mat, "Stückzahl: " + (r.q ? fmt(r.q) : "offen")];
      lines.push("Maschinen-Check (indikativ): " + (ok.length ? "passt laut Maschinenseite auf " + ok.join(", ") : "ausserhalb der veröffentlichten Maschinendaten"));
      if (extras.length) lines.push("Dazu gewünscht: " + extras.join(", "));
      lines.push("", "Zeichnung oder CAD-Datei hänge ich an.", "", "Freundliche Grüsse", "");
      var subj = "Anfrage " + tn + " " + r.dimTxt + ", " + r.mat + ", " + (r.q ? fmt(r.q) + " Stk." : "Stückzahl offen");
      return { subject: subj, body: lines.join("\r\n"), pretty: lines.join("\n") };
    }
    function render() {
      applyType();
      var r = calc(), mt = mailText(r);
      var bad = r.round ? !(r.dims[0] && r.dims[1]) : !(r.dims[0] && r.dims[1] && r.dims[2]);
      if (bad) { out.innerHTML = '<p class="muted">Bitte alle Masse eintragen, dann erscheint das Ergebnis.</p>'; return; }
      var kind = r.round ? "Drehmaschinen" : "Fräsmaschinen", h, cls;
      if (r.fits > 0) { h = "Ihr Teil passt auf " + r.fits + " von " + r.N + " " + kind + "."; cls = "is-ok"; }
      else { h = "Mit diesen Massen nicht auf den veröffentlichten " + kind + "."; cls = "is-no"; }
      var sub = r.fits > 0 ? "Berechnet für " + r.dimTxt + " in " + r.mat + "." : "Rufen Sie an oder senden Sie die Zeichnung: ob das Teil anders gespannt oder aufgeteilt werden kann, klärt die Werkstatt.";
      var order = r.rows.filter(function (x) { return x.ok; }).concat(r.rows.filter(function (x) { return !x.ok; }));
      var list = order.map(function (x) {
        var st = x.ok ? '<span class="st is-ok">passt</span>' : '<span class="st is-bad">passt nicht</span>';
        var bd = x.badges.length ? '<div class="badges">' + x.badges.map(function (b) { return '<span class="badge">' + esc(b) + "</span>"; }).join("") + "</div>" : "";
        var why = x.ok ? "" : '<p class="muted" style="font-size:.9375rem">' + esc(x.why.join("; ")) + "</p>";
        return '<li class="mrow ' + (x.ok ? "is-fit" : "is-no") + '"><div class="mrow__h"><b>' + esc(x.m.name) + "</b>" + st + "</div>" + "<div class=\"meters\">" + x.meters + "</div>" + bd + why + "</li>";
      }).join("");
      var ns = notes(r).map(function (s) { return "<p>" + esc(s) + "</p>"; }).join("");
      var href = "mailto:" + DATA.email + "?subject=" + encodeURIComponent(mt.subject) + "&body=" + encodeURIComponent(mt.body);
      out.innerHTML = '<div><h3 class="res__h ' + cls + '">' + esc(h) + '</h3><p class="res__s">' + esc(sub) + '</p><p><a class="btn btn--sm" href="' + href + '">E-Mail mit diesen Werten vorbereiten</a></p></div><ul class="mlist">' + list + '</ul>' + (ns ? '<div class="res__notes">' + ns + "</div>" : "") +
        '<div class="res__send"><h3 class="h3">Anfrage mit diesen Werten</h3><pre>' + esc(mt.pretty) + '</pre><div class="res__btns"><a class="btn" href="' + href + '" data-gc="email-tool">E-Mail vorbereiten</a><button class="btn btn--ghost" type="button" data-copy>Text kopieren</button><a class="btn btn--ghost" href="' + DATA.tel + '">Anrufen ' + esc(DATA.telshow) + "</a></div></div>";
      var cb = $("[data-copy]", out);
      if (cb) cb.addEventListener("click", function () {
        var done = function () { cb.textContent = "Kopiert"; setTimeout(function () { cb.textContent = "Text kopieren"; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mt.pretty).then(done, function () { cb.textContent = "Bitte manuell kopieren"; }); else cb.textContent = "Bitte manuell kopieren";
      });
      if (isPage) safe(function () {
        var q = new URLSearchParams({ t: r.t, m: r.mat, q: String(r.q) });
        if (r.round) { q.set("d", el("d").value); q.set("l", el("l").value); } else { q.set("a", el("a").value); q.set("b", el("b").value); q.set("c", el("c").value); }
        history.replaceState(null, "", location.pathname + "?" + q.toString());
      });
    }
    function fromUrl() {
      var p = safe(function () { return new URLSearchParams(location.search); }); if (!p) return;
      var t = p.get("t"); if (t) { var r_ = form.querySelector('input[type=radio][value="' + t + '"]'); if (r_) r_.checked = true; }
      ["d", "l", "a", "b", "c", "q"].forEach(function (k) { var v = p.get(k); if (v && isFinite(parseFloat(v))) el(k).value = v; });
      var m = p.get("m"); if (m) { var o = Array.prototype.filter.call(el("m").options, function (x) { return x.value === m; })[0]; if (o) el("m").value = m; }
    }
    if (isPage) fromUrl();
    var tm = null;
    form.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(render, 180); });
    form.addEventListener("change", render);
    render();
  }
})();
