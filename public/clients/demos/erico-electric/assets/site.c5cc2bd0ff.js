(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("erico-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("erico-dock", "1"); }); });

  /* drawer */
  var burger = $("#burger"), drawer = $("#drawer");
  function setDrawer(o) {
    drawer.classList.toggle("open", o); burger.setAttribute("aria-expanded", o ? "true" : "false");
    drawer.setAttribute("aria-hidden", o ? "false" : "true"); document.body.style.overflow = o ? "hidden" : "";
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(!drawer.classList.contains("open")); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
    window.addEventListener("resize", function () { if (innerWidth >= 1100) setDrawer(false); });
  }

  /* open now, Mon-Fri 8:00-17:00 America/Detroit */
  function openStatus() {
    var d = new Date(), p = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d)
        .forEach(function (x) { p[x.type] = x.value; });
    } catch (e) { return ""; }
    var hr = (parseInt(p.hour, 10) % 24) + parseInt(p.minute, 10) / 60, wd = p.weekday;
    var week = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(wd) > -1;
    if (week && hr >= 8 && hr < 17) return ["Open now, until 5:00 pm ET", true];
    var next = "Mon";
    if (wd === "Sun" || wd === "Sat") next = "Monday";
    else if (hr < 8) next = "today";
    else next = wd === "Fri" ? "Monday" : "tomorrow";
    return ["Closed now, opens " + next + " 8:00 am ET", false];
  }
  var st = openStatus();
  if (st) $$("[data-open]").forEach(function (n) { n.textContent = st[0]; n.classList.toggle("is-open", st[1]); });

  /* reveals: IntersectionObserver, once */
  var rv = $$(".rv, .um");
  rv.forEach(function (el) {
    var sib = el.parentElement ? $$(":scope > .rv, :scope > .um", el.parentElement) : [];
    var i = sib.indexOf(el); if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 0.07 + "s");
  });
  if (!("IntersectionObserver" in window) || reduce) { rv.forEach(function (el) { el.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("in"); }); }, 80);
  }

  /* gallery filter + lightbox */
  var grid = $("#grid");
  if (grid) {
    var items = $$(".g", grid), cnt = $("#gcount"), btns = $$(".fbtn");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var n = 0;
        items.forEach(function (li) { var show = f === "all" || li.getAttribute("data-t").indexOf("," + f + ",") > -1; li.hidden = !show; if (show) n++; });
        cnt.textContent = n + " photo" + (n === 1 ? "" : "s");
      });
    });
    var lb = $("#lb"), li_ = $("#lb-i"), lc = $("#lb-c"), cur = 0, vis = function () { return items.filter(function (x) { return !x.hidden; }); };
    function show(i) {
      var v = vis(); if (!v.length) return; cur = (i + v.length) % v.length;
      var b = $(".gbtn", v[cur]); li_.src = b.getAttribute("data-full"); li_.alt = b.getAttribute("data-alt");
      li_.width = +b.getAttribute("data-w"); li_.height = +b.getAttribute("data-h"); lc.textContent = b.getAttribute("data-alt") + " (" + (cur + 1) + " of " + v.length + ")";
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".gbtn"); if (!b) return;
      var v = vis(); cur = v.indexOf(b.parentElement); show(cur);
      if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    });
    $("#lb-x").addEventListener("click", function () { lb.close ? lb.close() : lb.removeAttribute("open"); });
    $("#lb-p").addEventListener("click", function () { show(cur - 1); });
    $("#lb-n").addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  }

  /* map on tap */
  var mb = $("#map-go");
  if (mb) mb.addEventListener("click", function () {
    var m = $("#map"), f = document.createElement("iframe"); f.src = m.getAttribute("data-src"); f.title = "Map of Erico Electric, Hancock, Michigan"; f.loading = "lazy";
    m.appendChild(f); mb.hidden = true;
  });

  /* signature tool: What's the job? */
  var dataEl = $("#scope-data");
  if (dataEl) {
    var D = JSON.parse(dataEl.textContent), tf = $("#tf");
    var res = $("#res"), body = $("#res-body"), empty = $("#res-empty"), linesEl = $("#res-lines"), meta = $("#res-meta"), send = $("#send");
    var barScope = $(".bar-scope span"), barA = $(".bar-scope");
    var barText = barScope ? barScope.textContent : "", barHref = barA ? barA.getAttribute("href") : "";
    var order = Object.keys(D.lines);
    function val(n) { var c = tf.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ""; }
    function sel() { return $$('input[name="it"]:checked', tf).map(function (i) { return i.value; }); }
    function text() {
      var ids = sel(), by = {}; ids.forEach(function (id) { var it = D.items[id]; (by[it[0]] = by[it[0]] || []).push(it[1]); });
      var out = ["Hello Erico Electric, I would like a quote or a visit for this job.", ""];
      var s = val("sit"); if (s) out.push("Kind of job: " + D.sit[s][0]);
      order.forEach(function (l) { if (by[l]) { out.push(D.lines[l][0] + ":"); by[l].forEach(function (x) { out.push("  - " + x); }); } });
      if (val("where")) out.push("Where: " + val("where")); if (val("when")) out.push("Urgency: " + val("when"));
      var nm = $("#nm").value.trim(), ph = $("#ph").value.trim();
      if (nm) out.push("Name: " + nm); if (ph) out.push("Phone: " + ph);
      return out.join("\n");
    }
    function render() {
      var ids = sel(), by = {}; ids.forEach(function (id) { var it = D.items[id]; (by[it[0]] = by[it[0]] || []).push(it[1]); });
      var keys = order.filter(function (l) { return by[l]; });
      if (!keys.length) {
        body.hidden = true; empty.hidden = false;
        if (barScope) { barScope.textContent = barText; barA.setAttribute("href", barHref); }
        return;
      }
      empty.hidden = true; body.hidden = false;
      linesEl.innerHTML = keys.map(function (l) {
        return '<div class="res-line"><h3><a href="' + D.lines[l][1] + '">' + D.lines[l][0] + '</a></h3><ul>' + by[l].map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
      }).join("");
      var m = []; if (val("where")) m.push("Where: " + val("where")); if (val("when")) m.push("Urgency: " + val("when"));
      meta.textContent = m.join(" · ");
      var subj = "Service request: " + D.lines[keys[0]][0] + (keys.length > 1 ? " and more" : "");
      send.setAttribute("href", "mailto:" + D.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text()));
      if (barScope) { barScope.textContent = "See your match (" + ids.length + ")"; barA.setAttribute("href", "#res"); }
      var urgent = val("when").indexOf("Emergency") === 0, cb = $("#callbtn");
      cb.classList.toggle("btn-primary-call", urgent); send.classList.toggle("btn-ghost-d", urgent); send.classList.toggle("btn-send", !urgent);
    }
    function preset(id) {
      var s = D.sit[id]; if (!s) return;
      $$('input[name="it"]', tf).forEach(function (i) { i.checked = s[1].indexOf(i.value) > -1; });
      var r = tf.querySelector('input[name="sit"][value="' + id + '"]'); if (r) r.checked = true;
    }
    tf.addEventListener("change", function (e) {
      if (e.target.name === "sit") { preset(e.target.value); render(); if (innerWidth < 900) setTimeout(function () { res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 60); return; }
      else if (e.target.name === "it") { var r = tf.querySelector('input[name="sit"]:checked'); if (r) r.checked = false; }
      render();
    });
    tf.addEventListener("input", function (e) { if (e.target.id === "nm" || e.target.id === "ph") render(); });
    var qs = new URLSearchParams(location.search), s0 = qs.get("s"), l0 = qs.get("l");
    if (s0) preset(s0);
    else if (l0) { var map = { "design-build": "design-build", "low-voltage": "low-voltage", "industrial-maintenance": "industrial-maintenance", "thermal-audit": "thermal-audit", "maritime": "maritime", "military-applications": "military", "process-automation": "process", "industrial-retrofitting": "retrofit", "residential": "residential", "commercial": "commercial" };
      var line = map[l0]; if (line) $$('input[name="it"]', tf).forEach(function (i) { var it = D.items[i.value]; i.checked = it[0] === line; }); }
    render();
    var cp = $("#copy");
    if (cp) cp.addEventListener("click", function () {
      var t = text(), done = function () { cp.textContent = "Copied"; setTimeout(function () { cp.textContent = "Copy the request"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { cp.textContent = "Select and copy from the email"; });
      else cp.textContent = "Use Send to Erico instead";
    });
  }

  /* request form -> mailto (concept) */
  var rf = $("#rf");
  if (rf) rf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (id) { return rf.querySelector("#" + id).value.trim(); }, svc = $$('input[name="svc"]:checked', rf).map(function (i) { return i.value; });
    var err = $("#rerr");
    if (!g("fn") || !g("ln") || !g("em") || !g("rp") || !g("ms") || !svc.length) { err.hidden = false; return; }
    err.hidden = true;
    var body = ["Name: " + g("fn") + " " + g("ln"), "Email: " + g("em"), "Phone: " + g("rp"), "Services required: " + svc.join(", "), "", g("ms")].join("\n");
    location.href = "mailto:rory@ericoelectric.com?subject=" + encodeURIComponent("Request for service: " + svc.join(", ")) + "&body=" + encodeURIComponent(body);
  });
  if (rf) rf.addEventListener("submit", function () {});

  /* click events for GoatCounter */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || !window.goatcounter || !window.goatcounter.count) return;
    var h = a.getAttribute("href"), ev = h.indexOf("tel:") === 0 ? "call" : h.indexOf("mailto:") === 0 ? "email" : h.indexOf("maps") > -1 ? "map" : null;
    if (ev) window.goatcounter.count({ path: "click-" + ev, title: ev, event: true });
  });
})();
