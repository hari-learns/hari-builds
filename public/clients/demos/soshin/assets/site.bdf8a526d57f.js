(function () {
  "use strict";
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* header solid after first scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(o) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", o);
    drawer.setAttribute("aria-hidden", o ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", o ? "true" : "false");
    de.style.overflow = o ? "hidden" : "";
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = o ? 0 : -1; });
    if (o && bx) bx.focus(); else if (!o && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (drawer) { setDrawer(false); }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (dock && sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  /* reveals */
  var rv = $$(".rv");
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(function (e) { e.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (e) { io.observe(e); });
    /* scroll fallback: a fast flick or anchor jump can skip the observer; reveal everything that is on or above the viewport */
    var pending = rv.slice(), ticking = false;
    function sweep() {
      ticking = false; var vh = window.innerHeight;
      pending = pending.filter(function (e) { var r = e.getBoundingClientRect(); if (r.top < vh * 0.96) { e.classList.add("in"); return false; } return true; });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); window.addEventListener("load", function () { setTimeout(sweep, 200); });
    window.addEventListener("hashchange", function () { setTimeout(sweep, 250); });
    sweep();
  }

  /* process rail: fill follows scroll, steps light up */
  $$("[data-rail]").forEach(function (rail) {
    var steps = $$(".step", rail);
    function upd() {
      var r = rail.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.6 - r.top) / r.height; p = Math.max(0, Math.min(1, p));
      if (reduce) p = 1;
      rail.style.setProperty("--p", p.toFixed(3));
      steps.forEach(function (s) { var sr = s.getBoundingClientRect(); s.classList.toggle("is-on", reduce || sr.top < vh * 0.62); });
    }
    upd(); window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd);
  });

  /* signature tool */
  var toolEl = $("[data-tool]");
  if (toolEl) {
    var data = JSON.parse($("#tool-data").textContent), U = data.ui;
    var stepsBox = $("[data-steps]", toolEl), out = $("[data-out]", toolEl), sum = $("[data-sum]", toolEl), meter = $("[data-meter]", toolEl);
    var mailBox = $("[data-mail]", toolEl), pre = $("[data-pre]", toolEl), cta = $("[data-cta]", toolEl), copyB = $("[data-copy]", toolEl);
    var prodIn = $("[data-prod]", toolEl), allCb = $("[data-all]", toolEl);
    var cbs = $$("input[name=stage]", toolEl);
    function sel() { return cbs.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
    function esc(s) { var e = d.createElement("div"); e.textContent = s; return e.innerHTML; }
    function render() {
      var s = sel(), P = data.processes;
      if (allCb) allCb.checked = s.length === P.length;
      meter.innerHTML = P.map(function (p) { return '<i class="' + (s.indexOf(p.key) >= 0 ? "on" : "") + '"></i>'; }).join("");
      if (!s.length) { sum.textContent = ""; out.innerHTML = '<p class="empty">' + esc(U.none) + "</p>"; mailBox.hidden = true; return; }
      sum.textContent = s.length === P.length ? U.sum_all : U.sum_pre + " " + s.length + " " + U.sum_mid.replace(/^/, "");
      var html = "";
      P.forEach(function (p) {
        if (s.indexOf(p.key) < 0) return;
        var ms = p.machines.map(function (m) { return '<li><span class="mk">' + esc(m.maker) + '</span><span class="md">' + esc(m.model) + "</span></li>"; }).join("");
        html += '<div class="res__it"><a class="res__img" href="' + p.url + '"><img src="' + p.img + '" width="' + p.iw + '" height="' + p.ih + '" alt="' + esc(p.name) + '" loading="lazy"></a><div><div class="res__h"><span class="mono">' + p.n + " / 7</span><b>" + esc(p.name) + '</b><span class="mono">' + p.machines.length + " " + esc(U.machines) + '</span></div><ul class="mm">' + ms + "</ul></div></div>";
      });
      out.innerHTML = html;
      var use = ($("input[name=use]:checked", toolEl) || {}).value || "";
      var useLabel = (U.uses.filter(function (u) { return u[0] === use; })[0] || ["", ""])[1];
      var stageNames = P.filter(function (p) { return s.indexOf(p.key) >= 0; }).map(function (p) { return p.name; });
      var lines = [U.m_greet, "", U.m_intro, "", U.use_label + ": " + useLabel, U.steps_label + ": " + stageNames.join(U.sep)];
      var pv = (prodIn.value || "").trim();
      if (pv) lines.push(U.prod_label + ": " + pv);
      lines.push("", U.m_name, "", U.m_tail);
      var body = lines.join("\n");
      pre.textContent = U.subject + "\n\n" + body;
      cta.href = "mailto:" + data.to + "?subject=" + encodeURIComponent(U.subject) + "&body=" + encodeURIComponent(body);
      mailBox.hidden = false;
    }
    cbs.forEach(function (c) { c.addEventListener("change", render); });
    if (allCb) allCb.addEventListener("change", function () { cbs.forEach(function (c) { c.checked = allCb.checked; }); render(); });
    $$("input[name=use]", toolEl).forEach(function (r) { r.addEventListener("change", render); });
    prodIn.addEventListener("input", render);
    if (copyB) copyB.addEventListener("click", function () {
      var t = pre.textContent;
      function done() { var o = copyB.textContent; copyB.textContent = U.copied; setTimeout(function () { copyB.textContent = o; }, 1800); }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, done); else done();
    });
    var m = /[#&]p=([\w,-]+)/.exec(location.hash);
    if (m) { m[1].split(",").forEach(function (k) { cbs.forEach(function (c) { if (c.value === k) c.checked = true; }); }); }
    else { cbs.forEach(function (c) { c.checked = true; }); }
    render();
  }

  /* contact form -> mail draft */
  var cf = $("#cform");
  if (cf) {
    var cd = JSON.parse($("#cform-data").textContent);
    function draft() {
      var v = function (n) { return (cf.elements[n].value || "").trim(); };
      var L = cd.labels, lines = [cd.greet, ""];
      ["company", "name", "phone", "email"].forEach(function (k) { if (v(k)) lines.push(L[k] + ": " + v(k)); });
      var rp = cf.querySelector("input[name=reply]:checked"); if (rp) lines.push(L.reply + ": " + rp.value);
      lines.push("", L.body + ":", v("body"));
      return lines.join("\n");
    }
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      location.href = "mailto:" + cd.to + "?subject=" + encodeURIComponent(cd.subject) + "&body=" + encodeURIComponent(draft());
    });
    var cp = $("#cform-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = cd.subject + "\n\n" + draft(), o = cp.textContent;
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = o; }, 1800); }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, done); else done();
    });
  }
})();
