(function () {
  "use strict";
  var MB = window.MB || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn, d) { try { return fn(); } catch (e) { return d; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("mb-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("mb-dock", "1"); }); });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(o) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", o);
    if (burger) burger.setAttribute("aria-expanded", o ? "true" : "false");
    document.documentElement.style.overflow = o ? "hidden" : "";
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = o ? 0 : -1; });
    if (o && bx) bx.focus(); else if (burger && document.activeElement === bx) burger.focus();
  }
  if (drawer) { setDrawer(false); if (burger) burger.addEventListener("click", function () { setDrawer(true); }); if (bx) bx.addEventListener("click", function () { setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    window.addEventListener("resize", function () { if (innerWidth >= 1100) setDrawer(false); }); }

  /* reveals */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* hero slideshow: their own project photos, first one instantly, the rest after load */
  var slides = $$(".hs");
  if (slides.length) {
    var cur = 0, timer = null, paused = reduce, dots = $$(".hdot");
    var cap = $("#hcap"), capn = $("#hcapn"), capb = $("#hcapb"), pb = $("#hpause");
    function load(i) { var f = slides[i]; if (!f || f.dataset.l) return; f.dataset.l = "1"; $$("source", f).forEach(function (s) { if (s.dataset.srcset) s.srcset = s.dataset.srcset; }); var im = $("img", f); if (im && im.dataset.src) im.src = im.dataset.src; }
    function show(i) {
      i = (i + slides.length) % slides.length; load(i); load((i + 1) % slides.length);
      slides[cur].classList.remove("is-on"); dots[cur] && dots[cur].classList.remove("is-on");
      cur = i; slides[cur].classList.add("is-on"); dots[cur] && dots[cur].classList.add("is-on");
      var d = slides[cur].dataset; capn.textContent = d.name; capb.textContent = d.body; cap.href = d.url;
    }
    function tick() { clearTimeout(timer); if (paused || document.hidden) return; timer = setTimeout(function () { show(cur + 1); tick(); }, 6500); }
    function setPaused(p) { paused = p; if (pb) { pb.setAttribute("aria-label", p ? "Wechsel starten" : "Wechsel anhalten"); pb.innerHTML = p ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>' : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>'; } tick(); }
    $("#hprev").addEventListener("click", function () { show(cur - 1); tick(); });
    $("#hnext").addEventListener("click", function () { show(cur + 1); tick(); });
    dots.forEach(function (d) { d.addEventListener("click", function () { show(+d.dataset.i); tick(); }); });
    if (pb) pb.addEventListener("click", function () { setPaused(!paused); });
    document.addEventListener("visibilitychange", tick);
    var go = function () { load(1); setPaused(paused); };
    if (document.readyState === "complete") setTimeout(go, 600); else window.addEventListener("load", function () { setTimeout(go, 600); });
    var tx = null; var hs = $("#hslides");
    hs.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    hs.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) { show(cur + (dx < 0 ? 1 : -1)); tick(); } tx = null; });
  }

  /* video facade */
  $$(".vid").forEach(function (v) {
    var b = $(".vid__btn", v);
    if (!b) return;
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + v.dataset.yt + "?autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label"); f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.width = 960; f.height = 540;
      b.replaceWith(f); f.focus();
    });
  });

  /* opening hours (Europe/Berlin) */
  function berlinNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(o.weekday);
    return { d: wd, m: (+o.hour % 24) * 60 + +o.minute };
  }
  function mins(t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; }
  function slotsFor(d) { var g = [MB.hours, MB.hours2]; for (var i = 0; i < g.length; i++) if (g[i][0].indexOf(d) > -1) return g[i][1]; return []; }
  var DN = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  $$("[data-open]").forEach(function (el) {
    safe(function () {
      var n = berlinNow(), sl = slotsFor(n.d), txt = "", open = false;
      for (var i = 0; i < sl.length; i++) if (n.m >= mins(sl[i][0]) && n.m < mins(sl[i][1])) { open = true; txt = "Jetzt geöffnet bis " + sl[i][1] + " Uhr"; break; }
      if (!open) {
        var found = "";
        for (var k = 0; k < 8 && !found; k++) { var d = (n.d + k) % 7, s2 = slotsFor(d); for (var j = 0; j < s2.length; j++) { if (k > 0 || mins(s2[j][0]) > n.m) { found = (k === 0 ? "heute" : k === 1 ? "morgen" : DN[d]) + " ab " + s2[j][0] + " Uhr"; break; } } }
        txt = "Jetzt geschlossen, wieder geöffnet " + found;
      }
      el.classList.toggle("is-open", open); $("span", el).textContent = txt;
    });
  });

  /* lightbox for project photos */
  var ph = $$(".pj__ph");
  if (ph.length) {
    var lb = document.createElement("div"); lb.className = "lb"; lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Foto");
    lb.innerHTML = '<button class="lb__x" type="button" aria-label="Schließen">&times;</button><button class="lb__p" type="button" aria-label="Zurück">&#8249;</button><img alt=""><button class="lb__n" type="button" aria-label="Weiter">&#8250;</button>';
    document.body.appendChild(lb); var li = 0, last = null;
    var lim = $("img", lb);
    function open(i) { li = (i + ph.length) % ph.length; lim.src = ph[li].href; lim.alt = $("img", ph[li]).alt; lb.hidden = false; document.documentElement.style.overflow = "hidden"; }
    function close() { lb.hidden = true; document.documentElement.style.overflow = ""; if (last) last.focus(); }
    ph.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); last = a; open(i); $(".lb__x", lb).focus(); }); });
    $(".lb__x", lb).addEventListener("click", close); $(".lb__p", lb).addEventListener("click", function () { open(li - 1); }); $(".lb__n", lb).addEventListener("click", function () { open(li + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") open(li - 1); if (e.key === "ArrowRight") open(li + 1); });
  }

  /* saved projects (stays in this browser) */
  var saved = safe(function () { return JSON.parse(localStorage.getItem("mb-saved") || "[]"); }, []);
  if (!Array.isArray(saved)) saved = [];
  var listeners = [];
  function persist() { safe(function () { localStorage.setItem("mb-saved", JSON.stringify(saved)); }); updateChip(); listeners.forEach(function (f) { f(); }); }
  function isSaved(s) { return saved.indexOf(s) > -1; }
  function toggle(s) { var i = saved.indexOf(s); if (i > -1) saved.splice(i, 1); else if (saved.length < 15) saved.push(s); persist(); }
  function updateChip() { var c = $("#savedchip"); if (!c) return; $("#savedn").textContent = saved.length; c.hidden = saved.length === 0; }
  updateChip();
  $$("[data-save]").forEach(function (b) {
    function sync() { var on = isSaved(b.dataset.save); b.setAttribute("aria-pressed", on); $("span", b).textContent = on ? "Gemerkt" : "Merken"; }
    sync(); b.addEventListener("click", function () { toggle(b.dataset.save); }); listeners.push(sync);
  });

  /* project index filter */
  var pg = $("#pgrid");
  if (pg) {
    var cards = $$(".pc", pg), g = "", r = "", q = "", shown = 24, STEP = 24;
    cards.forEach(function (c) { c.classList.remove("rv"); });
    var sp = new URLSearchParams(location.search); g = sp.get("g") || ""; r = sp.get("r") || "";
    var pr = $("#pr"), pq = $("#pq"), cnt = $("#pcount"), more = $("#pmore"), emp = $("#pempty");
    if (r) { pr.value = r; }
    function apply(reset) {
      if (reset) shown = STEP;
      var n = 0, hit = 0;
      cards.forEach(function (c) {
        var ok = (!g || c.dataset.g === g) && (!r || c.dataset.r === r) && (!q || c.dataset.q.indexOf(q) > -1);
        if (ok) { hit++; c.hidden = hit > shown; } else c.hidden = true;
      });
      cnt.textContent = hit + " von " + cards.length + " Projekten"; more.hidden = hit <= shown; emp.hidden = hit > 0;
      $$("#pg .chip").forEach(function (b) { var on = b.dataset.g === g; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    }
    $$("#pg .chip").forEach(function (b) { b.addEventListener("click", function () { g = b.dataset.g; apply(true); }); });
    pr.addEventListener("change", function () { r = pr.value; apply(true); });
    pq.addEventListener("input", function () { q = pq.value.trim().toLowerCase(); apply(true); });
    more.addEventListener("click", function () { shown += STEP; apply(false); });
    apply(true);
  }

  /* finder */
  var fd = $("#finder");
  var DATA = null, byslug = {};
  function loadData(cb) {
    if (DATA) return cb(DATA);
    if (!MB.finder) return;
    fetch(MB.finder).then(function (r) { return r.json(); }).then(function (d) { DATA = d; d.p.forEach(function (p) { byslug[p[0]] = p; }); cb(d); }).catch(function () {
      var e = $("#fempty"); if (e) { e.hidden = false; e.innerHTML = 'Die Auswahl konnte nicht geladen werden. <a class="inl" href="' + MB.base + '/projekte/">Alle Projekte ansehen</a>'; }
    });
  }
  var img = function (p) { return MB.base + "/assets/img/" + p[4] + "-420.webp"; };
  var url = function (p) { return MB.base + "/projekte/" + p[0] + "/"; };
  function compose(rooms, wishes, items, note) {
    var L = ["Guten Tag Frau Bühler,", ""];
    L.push("ich interessiere mich für: " + (rooms.length ? rooms.join(", ") : "Möbel und Innenausbau") + ".");
    if (wishes.length) L.push("Wichtig sind mir: " + wishes.join(", ") + ".");
    if (items.length) { L.push("", "Diese Projekte aus Ihrer Galerie gefallen mir:"); items.forEach(function (p) { L.push("- " + p[1] + ": " + MB.live + p[6] + "/"); }); }
    return L;
  }
  if (fd) {
    var mode = fd.dataset.mode, room = "", wishes = {}, limit = mode === "home" ? 3 : 9, STEP2 = 9;
    var res = $("#fres"), cntEl = $("#fcount"), fmore = $("#fmore"), fempty = $("#fempty"), fall = $("#fall");
    var sp2 = new URLSearchParams(location.search);
    if (mode === "page") { room = sp2.get("raum") || ""; (sp2.get("w") || "").split(",").forEach(function (w) { if (w) wishes[w] = 1; }); }
    function results() {
      var ws = Object.keys(wishes), tix = ws.map(function (w) { return DATA.tags.findIndex(function (t) { return t[0] === w; }); });
      var out = [];
      DATA.p.forEach(function (p) {
        if (room && p[2] !== room) return;
        var sc = 0, m = []; tix.forEach(function (t, i) { if (p[5].indexOf(t) > -1) { sc++; m.push(DATA.tags[t][1]); } });
        if (ws.length && !sc) return; out.push({ p: p, sc: sc, m: m });
      });
      out.sort(function (a, b) { return b.sc - a.sc; });
      return out;
    }
    function counts() {
      $$("[data-rc]").forEach(function (i) { i.textContent = DATA.p.filter(function (p) { return p[2] === i.dataset.rc; }).length; });
      $$("[data-wc]").forEach(function (i) {
        var t = DATA.tags.findIndex(function (x) { return x[0] === i.dataset.wc; }), n = DATA.p.filter(function (p) { return (!room || p[2] === room) && p[5].indexOf(t) > -1; }).length;
        i.textContent = n; i.parentNode.classList.toggle("is-zero", n === 0);
      });
    }
    function card(o) {
      var p = o.p, on = isSaved(p[0]);
      return '<article class="fc"><a class="fc__img" href="' + url(p) + '" tabindex="-1" aria-hidden="true"><img src="' + img(p) + '" width="' + p[8] + '" height="' + p[9] + '" alt="" loading="lazy" decoding="async"></a><div class="fc__b"><h4 class="fc__t"><a href="' + url(p) + '">' + esc(p[1]) + '</a></h4>' +
        (o.m.length ? '<div class="fc__m">' + o.m.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : "") + '<p class="fc__n">' + esc(p[3]) + '</p><div class="fc__a"><a class="btn btn--ghost" href="' + url(p) + '">Ansehen</a><button type="button" class="btn btn--ghost" data-sv="' + p[0] + '" aria-pressed="' + on + '">' + (on ? "Gemerkt" : "Merken") + "</button></div></div></article>";
    }
    function render() {
      var out = results(), n = out.length;
      res.innerHTML = out.slice(0, limit).map(card).join("");
      cntEl.textContent = "(" + n + " von " + DATA.p.length + " Projekten)"; fmore.hidden = !(mode === "page" && n > limit); fempty.hidden = n > 0;
      if (fall) { fall.hidden = false; var q = []; if (room) q.push("raum=" + room); var ws = Object.keys(wishes); if (ws.length) q.push("w=" + ws.join(",")); fall.href = MB.base + "/projektfinder/" + (q.length ? "?" + q.join("&") : ""); }
      counts();
      if (mode === "page") safe(function () { var q = []; if (room) q.push("raum=" + room); var ws = Object.keys(wishes); if (ws.length) q.push("w=" + ws.join(",")); history.replaceState(null, "", location.pathname + (q.length ? "?" + q.join("&") : "") + location.hash); });
    }
    function chips() {
      $$("#fr .chip").forEach(function (b) { var on = b.dataset.room === room; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
      $$("#fw .chip").forEach(function (b) { var on = !!wishes[b.dataset.w]; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    }
    function boot() {
      chips(); limit = mode === "home" ? 3 : 9; render();
      $$("#fr .chip").forEach(function (b) { b.addEventListener("click", function () { room = b.dataset.room; limit = mode === "home" ? 3 : 9; chips(); render(); }); });
      $$("#fw .chip").forEach(function (b) { b.addEventListener("click", function () { var w = b.dataset.w; if (wishes[w]) delete wishes[w]; else wishes[w] = 1; limit = mode === "home" ? 3 : 9; chips(); render(); }); });
      fmore.addEventListener("click", function () { limit += STEP2; render(); });
      res.addEventListener("click", function (e) { var b = e.target.closest("[data-sv]"); if (b) toggle(b.dataset.sv); });
      listeners.push(function () { $$("[data-sv]", res).forEach(function (b) { var on = isSaved(b.dataset.sv); b.setAttribute("aria-pressed", on); b.textContent = on ? "Gemerkt" : "Merken"; }); renderSaved(); updateReq(); });
      renderSaved(); updateReq();
    }
    var started = false;
    function start() { if (started) return; started = true; loadData(boot); }
    if (mode === "page") start(); else if ("IntersectionObserver" in window) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: "500px" }).observe(fd); } else start();
    $$("#fr .chip,#fw .chip").forEach(function (b) { b.addEventListener("click", start); });

    /* saved list + drafted request */
    var sl = $("#savedlist"), se = $("#savedempty"), rf = $("#reqf");
    function renderSaved() {
      if (!sl) return;
      var items = saved.map(function (s) { return byslug[s]; }).filter(Boolean);
      sl.innerHTML = items.map(function (p) { return '<li><img src="' + img(p) + '" width="72" height="54" alt=""><a href="' + url(p) + '">' + esc(p[1]) + '</a><button type="button" data-rm="' + p[0] + '" aria-label="' + esc(p[1]) + ' entfernen">&times;</button></li>'; }).join("");
      se.hidden = items.length > 0;
    }
    if (sl) sl.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (b) toggle(b.dataset.rm); });
    function updateReq() {
      if (!rf || !DATA) return;
      var items = saved.map(function (s) { return byslug[s]; }).filter(Boolean);
      var rooms = []; if (room) rooms.push(DATA.rooms.filter(function (x) { return x[0] === room; })[0][1]);
      items.forEach(function (p) { var l = DATA.rooms.filter(function (x) { return x[0] === p[2]; })[0][1]; if (rooms.indexOf(l) < 0) rooms.push(l); });
      var ws = Object.keys(wishes).map(function (w) { return DATA.tags.filter(function (t) { return t[0] === w; })[0][1]; });
      var f = rf.elements, L = compose(rooms, ws, items);
      L.push("", "Zeitraum: " + f.when.value);
      if (f.note.value.trim()) L.push("Maße / Besonderheiten / Fragen: " + f.note.value.trim());
      L.push("", "Mit freundlichen Grüßen", f.name.value.trim() || "(Name)", f.contact.value.trim() ? "Erreichbar unter: " + f.contact.value.trim() : "");
      var text = L.join("\n"), subj = "Anfrage über die Webseite" + (rooms.length ? ": " + rooms.join(", ") : "");
      $("#reqpre").textContent = text;
      $("#reqmail").href = "mailto:" + MB.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text);
    }
    if (rf) { rf.addEventListener("input", updateReq); rf.addEventListener("change", updateReq); chipsHook = updateReq;
      $("#reqcopy").addEventListener("click", function () { var t = $("#reqpre").textContent, b = this; function ok() { b.textContent = "Kopiert"; setTimeout(function () { b.textContent = "Text kopieren"; }, 1800); } if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok(); });
      fd.addEventListener("click", function () { setTimeout(updateReq, 0); }); }
    var chipsHook;
  }

  /* simple contact form */
  var mf = $("#mf");
  if (mf) {
    var upd = function () { var f = mf.elements, t = "Guten Tag Frau Bühler,\n\n" + (f.note.value.trim() || "ich hätte gern einen Beratungstermin.") + "\n\nMit freundlichen Grüßen\n" + (f.name.value.trim() || "") + (f.contact.value.trim() ? "\nErreichbar unter: " + f.contact.value.trim() : ""); $("#mfmail").href = "mailto:" + MB.to + "?subject=" + encodeURIComponent("Anfrage über die Webseite") + "&body=" + encodeURIComponent(t); return t; };
    mf.addEventListener("input", upd); upd();
    $("#mfcopy").addEventListener("click", function () { var b = this, t = upd(); function ok() { b.textContent = "Kopiert"; setTimeout(function () { b.textContent = "Text kopieren"; }, 1800); } if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok(); });
  }
})();
