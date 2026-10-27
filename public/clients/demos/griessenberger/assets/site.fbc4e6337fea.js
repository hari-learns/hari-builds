(function () {
  "use strict";
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", w.scrollY > 40); }
  onScroll(); w.addEventListener("scroll", onScroll, { passive: true });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : "";
    if (open && bx) bx.focus(); else if (!open && burger && d.activeElement === bx) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { setDrawer(false); closeLb(); } });
  w.addEventListener("resize", function () { if (w.innerWidth >= 1080) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (dock && sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  if (dock && w.innerWidth < 860) setTimeout(function () { dock.hidden = true; }, 9000);

  /* reveals (sweep without lower bound: nothing is stranded invisible) */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in w)) { rvs.forEach(activate); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { activate(x.target); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = w.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (t) { w.addEventListener(t, sweep, { passive: true }); });
    sweep();
  }

  /* hero: the three photos of the old slider, slow crossfade (static when reduced motion) */
  var hb = $("#hero-bg");
  if (hb && !reduce) {
    var extra = [];
    try { extra = JSON.parse(hb.getAttribute("data-slides") || "[]"); } catch (e) {}
    var start = function () {
      var imgs = $$("img", hb);
      extra.forEach(function (s) {
        var im = new Image(); im.alt = s.alt; im.width = s.w; im.height = s.h; im.decoding = "async";
        im.sizes = "100vw"; im.srcset = s.srcset; im.src = s.src; hb.appendChild(im); imgs.push(im);
      });
      var i = 0;
      setInterval(function () {
        if (d.hidden) return;
        imgs[i].classList.remove("is-on"); i = (i + 1) % imgs.length; imgs[i].classList.add("is-on");
      }, 6500);
    };
    if (d.readyState === "complete") setTimeout(start, 1200); else w.addEventListener("load", function () { setTimeout(start, 1200); });
  }

  /* open now (Vienna time) */
  function viennaNow() {
    try {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      return { day: map[o.weekday], min: (+o.hour % 24) * 60 + (+o.minute) };
    } catch (e) { return null; }
  }
  function openState(days, from, to) {
    var n = viennaNow(); if (!n) return null;
    return days.indexOf(n.day) >= 0 && n.min >= from && n.min < to;
  }
  var st = $("#open-status");
  if (st) {
    var days = st.getAttribute("data-days").split(",").map(Number);
    var o = openState(days, +st.getAttribute("data-from"), +st.getAttribute("data-to"));
    if (o !== null) { st.textContent = (o ? st.getAttribute("data-open") : st.getAttribute("data-closed")) + " · " + st.textContent; st.classList.toggle("is-open", o); }
  }

  /* lightbox */
  var lb, lbImg, lbCap, lbList = [], lbI = 0, lastFocus;
  function buildLb() {
    lb = d.createElement("dialog"); lb.className = "lb"; lb.setAttribute("aria-label", "Bildansicht");
    lb.innerHTML = '<figure class="lb__fig"><img alt="" width="950" height="720"><figcaption></figcaption></figure>' +
      '<button type="button" class="lb__x" aria-label="Schließen">&times;</button><button type="button" class="lb__p" aria-label="Zurück">&lsaquo;</button><button type="button" class="lb__n" aria-label="Weiter">&rsaquo;</button>';
    d.body.appendChild(lb); lbImg = $("img", lb); lbCap = $("figcaption", lb);
    $(".lb__x", lb).addEventListener("click", closeLb);
    $(".lb__p", lb).addEventListener("click", function () { showLb(lbI - 1); });
    $(".lb__n", lb).addEventListener("click", function () { showLb(lbI + 1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) closeLb(); });
    lb.addEventListener("close", function () { d.documentElement.style.overflow = ""; if (lastFocus) lastFocus.focus(); });
    lb.addEventListener("keydown", function (ev) { if (ev.key === "ArrowLeft") showLb(lbI - 1); if (ev.key === "ArrowRight") showLb(lbI + 1); });
  }
  function showLb(i) {
    lbI = (i + lbList.length) % lbList.length; var b = lbList[lbI], im = $("img", b);
    lbImg.src = b.getAttribute("data-lb"); lbImg.alt = im ? im.alt : ""; lbImg.width = +b.getAttribute("data-w"); lbImg.height = +b.getAttribute("data-h");
    lbCap.textContent = im ? im.alt : "";
  }
  function closeLb() { if (lb && lb.open) lb.close(); }
  $$(".gal").forEach(function (g) {
    var btns = $$("button", g);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (!lb) buildLb();
        lbList = btns; lastFocus = b; showLb(btns.indexOf(b));
        if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
        d.documentElement.style.overflow = "hidden";
      });
    });
  });

  /* signature tool: "Ihr Projekt in drei Fragen" */
  $$("[data-tool]").forEach(function (root) {
    var data; try { data = JSON.parse($("#tool-data", root).textContent); } catch (e) { return; }
    var res = $("#tool-res", root), room = "", looks = [], start = "", liked = {}, shown = [];
    function pressed(btns, fn) { btns.forEach(function (b) { b.setAttribute("aria-pressed", fn(b) ? "true" : "false"); }); }
    function score(r) {
      var s = 0; if (room && r.r.indexOf(room) >= 0) s += 10;
      looks.forEach(function (l) { if (r.l.indexOf(l) >= 0) s += 4; });
      return s;
    }
    function pick() {
      var pool = data.refs.map(function (r, i) { return { r: r, s: score(r), i: i }; });
      var ok = pool.filter(function (x) { return (!room || x.r.r.indexOf(room) >= 0); });
      if (ok.length < 3) ok = pool;
      ok.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
      return ok.slice(0, 6).map(function (x) { return x.r; });
    }
    function summary() {
      var parts = [];
      if (room) parts.push(data.rooms[room]);
      if (looks.length) parts.push(looks.map(function (l) { return data.looks[l]; }).join(" / "));
      return parts.join(" · ");
    }
    function body() {
      var chosen = shown.filter(function (r, i) { return liked[i]; }); if (!chosen.length) chosen = shown.slice(0, 3);
      var L = ["Guten Tag,", "", "ich plane ein Projekt und habe es über Ihre Website vorbereitet:", ""];
      if (room) L.push("Was: " + data.rooms[room]);
      if (looks.length) L.push("Stil: " + looks.map(function (l) { return data.looks[l]; }).join(", "));
      if (start) L.push("Start: " + data.starts[start][1]);
      L.push("", "Diese Arbeiten gefallen mir:");
      chosen.forEach(function (r) { L.push("- " + r.a); });
      L.push("", "Ich freue mich auf Ihre Rückmeldung.");
      return L.join("\n");
    }
    function render() {
      if (!room && !looks.length) { res.hidden = true; return; }
      shown = pick(); liked = {};
      var t = data.texts, h = '<h3>' + t.result_h + '</h3><p class="tool__sum">' + esc(summary()) + '</p>';
      if (!shown.length) h += '<p>' + t.result_none + '</p>';
      else {
        h += '<div class="res">' + shown.map(function (r, i) {
          return '<button type="button" data-i="' + i + '" aria-pressed="false" aria-label="' + esc(r.a) + ' – gefällt mir"><img src="' + r.f + '" width="' + r.w + '" height="' + r.h + '" alt="' + esc(r.a) + '" loading="lazy"><span class="heart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></span></button>';
        }).join("") + '</div><p class="tool__hint">Tippen Sie auf das Herz bei den Arbeiten, die Ihnen gefallen. Sie gehen in Ihre Nachricht.</p>';
      }
      var steps = data.steps.map(function (s) { return '<li><span><b>' + esc(s[0]) + ':</b> ' + esc(s[1]) + '</span></li>'; }).join("");
      var open = openState(data.hours_days, data.hours_from, data.hours_to);
      var stat = open === null ? esc(data.hours_short) : esc((open ? t.open_now : t.closed_now) + " · " + data.hours_short);
      h += '<div class="next"><h4>' + t.steps_h + '</h4><ol>' + steps + '</ol><p class="status' + (open ? ' is-open' : '') + '">' + stat + '</p>' +
        '<div class="tool__actions"><a class="btn" id="tool-send" href="mailto:' + data.to + '">' + t.send + '</a><a class="btn btn--ghost" href="' + data.tel + '">' + t.call + ' ' + esc(data.tel_display) + '</a>' +
        '<button type="button" class="btn btn--ghost" id="tool-copy">' + t.copy + '</button><button type="button" class="btn btn--ghost" id="tool-reset">' + t.reset + '</button></div>' +
        '<p class="tool__note">' + t.note + '</p></div>';
      res.innerHTML = h; res.hidden = false; wire();
    }
    function wire() {
      $$(".res button", res).forEach(function (b) {
        b.addEventListener("click", function () { var i = +b.getAttribute("data-i"); liked[i] = !liked[i]; b.setAttribute("aria-pressed", liked[i] ? "true" : "false"); mailHref(); });
      });
      var send = $("#tool-send", res); mailHref();
      var cp = $("#tool-copy", res);
      cp.addEventListener("click", function () {
        var txt = body(), done = function () { var o = cp.textContent; cp.textContent = data.texts.copied; setTimeout(function () { cp.textContent = o; }, 1600); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
      });
      $("#tool-reset", res).addEventListener("click", function () { room = ""; looks = []; start = ""; sync(); res.hidden = true; });
    }
    function mailHref() {
      var a = $("#tool-send", res); if (!a) return;
      a.href = "mailto:" + data.to + "?subject=" + encodeURIComponent(data.subject + (room ? ": " + data.rooms[room] : "")) + "&body=" + encodeURIComponent(body());
    }
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function sync() {
      pressed($$("[data-room]", root), function (b) { return b.getAttribute("data-room") === room; });
      pressed($$("[data-look]", root), function (b) { return looks.indexOf(b.getAttribute("data-look")) >= 0; });
      pressed($$("[data-start]", root), function (b) { return b.getAttribute("data-start") === start; });
    }
    $$("[data-room]", root).forEach(function (b) { b.addEventListener("click", function () { room = b.getAttribute("data-room"); sync(); render(); }); });
    $$("[data-look]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-look"), i = looks.indexOf(k);
        if (i >= 0) looks.splice(i, 1); else { looks.push(k); if (looks.length > 2) looks.shift(); }
        sync(); render();
      });
    });
    $$("[data-start]", root).forEach(function (b) { b.addEventListener("click", function () { start = b.getAttribute("data-start"); sync(); mailHref(); }); });
    var m = /[?&]raum=(\w+)/.exec(w.location.search);
    if (m && data.rooms[m[1]]) { room = m[1]; sync(); render(); }
  });
})();
