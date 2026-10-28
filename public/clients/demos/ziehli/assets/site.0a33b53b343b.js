(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

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
  if (dock && safe(function () { return sessionStorage.getItem("ziehli-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("ziehli-dock", "1"); }); });

  /* reveals (sweep also reveals anything already scrolled past) */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* counters: real figures from the site, counted up once */
  $$("[data-count]").forEach(function (el) {
    var to = parseInt(el.getAttribute("data-count"), 10);
    if (!to || reduce || !("IntersectionObserver" in window)) return;
    var done = false;
    function finish() { el.textContent = String(to); done = true; }
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || done) return;
        co.disconnect(); var t0 = performance.now(), dur = 1100;
        (function tick(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); else finish(); })(t0);
        setTimeout(finish, dur + 400);
      });
    }, { threshold: 0.6 });
    co.observe(el);
  });

  /* hero slideshow: their own photos, first one eager, the rest loaded after the page is ready */
  var hero = $("[data-hero]");
  if (hero) {
    var slides = $$(".hs", hero), dots = $$(".hd"), cap = $("[data-hero-cap]"), cur = 0, timer = null, paused = false;
    function loadSlide(s) { var im = $("img", s); if (im && im.getAttribute("data-src")) { im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); } }
    function show(i) {
      i = (i + slides.length) % slides.length;
      var s = slides[i]; loadSlide(s);
      function go() {
        slides[cur].classList.remove("is-on"); dots[cur].classList.remove("is-on"); dots[cur].setAttribute("aria-pressed", "false");
        cur = i; s.classList.add("is-on"); dots[cur].classList.add("is-on"); dots[cur].setAttribute("aria-pressed", "true");
        if (cap) { cap.firstChild.nodeValue = s.getAttribute("data-cap"); cap.setAttribute("href", s.getAttribute("data-link")); }
      }
      var im = $("img", s);
      if (im.complete && im.naturalWidth) go(); else { im.addEventListener("load", go, { once: true }); setTimeout(go, 2500); }
    }
    function arm() { clearTimeout(timer); if (reduce || paused) return; timer = setTimeout(function () { show(cur + 1); arm(); }, 6500); }
    dots.forEach(function (b, i) { b.addEventListener("click", function () { show(i); arm(); }); });
    var hb = $(".hero");
    hb.addEventListener("mouseenter", function () { paused = true; clearTimeout(timer); });
    hb.addEventListener("mouseleave", function () { paused = false; arm(); });
    hb.addEventListener("focusin", function () { paused = true; clearTimeout(timer); });
    hb.addEventListener("focusout", function () { paused = false; arm(); });
    d.addEventListener("visibilitychange", function () { if (d.hidden) clearTimeout(timer); else arm(); });
    window.addEventListener("load", function () { setTimeout(function () { slides.forEach(loadSlide); arm(); }, 1500); });
  }

  /* reference filter */
  var fbtns = $$("[data-filter]");
  fbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      fbtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      $$(".rgrid--all .rcard").forEach(function (c) { c.hidden = !(f === "alle" || c.getAttribute("data-area") === f); });
    });
  });

  /* lightbox */
  var lb = $("#lb"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), group = [], gi = 0;
  function lbShow(i) {
    gi = (i + group.length) % group.length; var a = group[gi];
    lbImg.src = a.getAttribute("href"); var im = $("img", a);
    lbImg.alt = a.getAttribute("data-cap") || (im ? im.alt : ""); lbCap.textContent = a.getAttribute("data-cap") || "";
    $$(".lb__n", lb).forEach(function (b) { b.hidden = group.length < 2; });
  }
  function lbOpen(a) {
    var g = a.getAttribute("data-g");
    group = $$("[data-lb]").filter(function (x) { return (g ? x.getAttribute("data-g") === g : x.parentNode === a.parentNode || x.parentNode.parentNode === a.parentNode.parentNode) && x.offsetParent !== null; });
    if (!group.length) group = [a];
    gi = group.indexOf(a); lbShow(gi);
    if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    root.style.overflow = "hidden";
  }
  if (lb) {
    $$("[data-lb]").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); lbOpen(a); }); });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { lbShow(gi - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { lbShow(gi + 1); });
    lb.addEventListener("close", function () { root.style.overflow = ""; });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) lb.close(); });
    d.addEventListener("keydown", function (ev) { if (!lb.open) return; if (ev.key === "ArrowLeft") lbShow(gi - 1); if (ev.key === "ArrowRight") lbShow(gi + 1); });
  }

  /* mailto helper */
  function mailto(to, subject, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }

  /* contact form */
  var cf = $("#cform"), cfd = $("#cform-data");
  if (cf && cfd) {
    var cfg = JSON.parse(cfd.textContent);
    cf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (n) { return (cf.elements[n].value || "").trim(); };
      var body = v("msg") + "\n\n" + [[cfg.labels.name, v("name")], [cfg.labels.phone, v("phone")], [cfg.labels.email, v("email")]].filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ": " + x[1]; }).join("\n");
      window.location.href = mailto(cfg.to, cfg.subject, body);
    });
  }

  /* signature tool: Projekt-Check */
  var tools = $$("[data-tool]");
  tools.forEach(function (tool) {
    var cfg = JSON.parse($("#tool-data", tool).textContent), U = cfg.ui;
    var byId = {}; cfg.items.forEach(function (it) { byId[it.id] = it; });
    var room = "", sel = [], opts = $$(".opt", tool);
    var out = $("[data-count-out]", tool), sk = $("[data-sk]", tool), ex = $("[data-ex]", tool), exl = $("[data-exl]", tool), send = $("[data-send]", tool), hint = $("[data-hint]", tool);
    var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    function extras() { return $$('input[name="extra"]:checked', tool).map(function (i) { return i.value; }); }
    function val(n) { var el = tool.querySelector('[name="' + n + '"]'); return el ? (el.value || "").trim() : ""; }
    function brief() {
      var L = [U.greet, "", U.intro, ""];
      if (room) L.push(U.l_room + ": " + cfg.rooms[room]);
      if (sel.length) L.push(U.l_items + ": " + sel.map(function (id) { return byId[id].label; }).join(", "));
      var ee = extras(); if (ee.length) L.push(U.l_extras + ": " + ee.join(", "));
      if (val("when")) L.push(U.l_when + ": " + val("when"));
      if (val("stage")) L.push(U.l_stage + ": " + val("stage"));
      if (val("note")) L.push(U.l_note + ": " + val("note"));
      var c = [val("name"), val("firma"), val("ort"), val("phone"), val("email")].filter(Boolean);
      if (c.length) { L.push("", U.l_contact + ": " + c.join(", ")); }
      L.push("", U.close); if (val("name")) L.push(val("name"));
      return L.join("\n");
    }
    function render() {
      opts.forEach(function (o) { o.setAttribute("aria-pressed", sel.indexOf(o.getAttribute("data-id")) > -1 ? "true" : "false"); });
      out.textContent = sel.length ? (sel.length === 1 ? U.out_count[0] : sel.length + " " + U.out_count[1]) : U.out_empty;
      sk.innerHTML = "";
      sel.forEach(function (id) {
        var it = byId[id], li = d.createElement("li");
        li.innerHTML = '<img src="' + it.img + '" alt="" width="56" height="42"><b></b><button type="button" aria-label="' + it.label + '">' + X + '</button>';
        $("b", li).textContent = it.label;
        $("button", li).addEventListener("click", function () { sel = sel.filter(function (x) { return x !== id; }); render(); });
        sk.appendChild(li);
      });
      var seen = {}, refs = [];
      sel.forEach(function (id) { var r = byId[id].ref; if (!seen[r.href]) { seen[r.href] = 1; refs.push(r); } });
      exl.innerHTML = refs.slice(0, 3).map(function (r) { return '<a href="' + r.href + '"><img src="' + r.img + '" alt="" width="' + r.w + '" height="' + r.h + '" loading="lazy"><span></span></a>'; }).join("");
      $$("a span", exl).forEach(function (s, i) { s.textContent = refs[i].title; });
      ex.hidden = !refs.length;
      send.setAttribute("href", mailto(cfg.to, U.subject, brief()));
      var chip = $("[data-chip]", tool);
      if (chip) { chip.hidden = !sel.length; $("[data-chip-n]", chip).textContent = sel.length + " " + (sel.length === 1 ? U.chip_one : U.chip_many); }
    }
    opts.forEach(function (o) { o.addEventListener("click", function () { var id = o.getAttribute("data-id"), i = sel.indexOf(id); if (i > -1) sel.splice(i, 1); else sel.push(id); render(); }); });
    $$('input[name="room"]', tool).forEach(function (r) {
      r.addEventListener("change", function () {
        room = r.value;
        sel = cfg.items.filter(function (it) { return it.rooms.indexOf(room) > -1; }).map(function (it) { return it.id; });
        opts.forEach(function (o) { o.classList.toggle("is-sug", byId[o.getAttribute("data-id")].rooms.indexOf(room) > -1); });
        hint.hidden = false; render();
      });
    });
    $$('input[name="extra"], .tfs input[type=text], .tfs input[type=tel], .tfs input[type=email], .tfs select, .tfs textarea', tool).forEach(function (i) { i.addEventListener("input", render); i.addEventListener("change", render); });
    if (window.innerWidth >= 1000) { var dt = $(".tdet", tool); if (dt) dt.open = true; }
    var cp = $("[data-copy]", tool);
    if (cp) cp.addEventListener("click", function () {
      var t = brief(), old = cp.textContent;
      function ok() { cp.textContent = U.copied; setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok);
      else { var ta = d.createElement("textarea"); ta.value = t; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); d.body.removeChild(ta); ok(); }
    });
    var rs = $("[data-reset]", tool);
    if (rs) rs.addEventListener("click", function () {
      sel = []; room = ""; $$('input[name="room"]', tool).forEach(function (r) { r.checked = false; }); $$('input[name="extra"]', tool).forEach(function (r) { r.checked = false; });
      opts.forEach(function (o) { o.classList.remove("is-sug"); }); hint.hidden = true; render();
    });
    // deep link: ?raum=laden
    var q = safe(function () { return new URLSearchParams(location.search).get("raum"); });
    if (q) { var r0 = tool.querySelector('input[name="room"][value="' + q + '"]'); if (r0) { r0.checked = true; r0.dispatchEvent(new Event("change")); } }
    render();
  });
})();
