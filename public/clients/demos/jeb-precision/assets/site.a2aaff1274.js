(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("jeb-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("jeb-dock", "1"); }); });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = open ? 0 : -1; });
    if (open) burgerX.focus(); else burger.focus({ preventScroll: true });
  }
  if (drawer) {
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = -1; });
    burger.addEventListener("click", function () { setDrawer(true); });
    burgerX.addEventListener("click", function () { setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) setDrawer(false); });
    window.addEventListener("resize", function () { if (innerWidth >= 992 && drawer.classList.contains("open")) setDrawer(false); });
  }

  /* reveals (with the safety sweep: anything at or above the fold gets revealed) */
  var rvs = $$(".rv,.rv-img");
  function sweep() { var vh = innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) el.classList.add("in"); }); }
  if (reduce || !("IntersectionObserver" in window)) { rvs.forEach(function (el) { el.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* counters: real figures count up once */
  $$("[data-count]").forEach(function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (reduce || !("IntersectionObserver" in window) || !end) return;
    var done = false;
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || done) return; done = true; co.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function tick(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v; if (p < 1) requestAnimationFrame(tick); else el.textContent = end; })(t0);
      });
    }, { threshold: 0.6 });
    co.observe(el);
  });

  /* machines filter */
  var ml = $("#mlist");
  if (ml) {
    var items = $$("li", ml), q = $("#msearch"), cnt = $("#mcount"), btns = $$(".fchips button"), cat = "";
    var run = function () {
      var s = (q.value || "").toLowerCase().trim(), n = 0;
      items.forEach(function (li) { var ok = (!cat || li.getAttribute("data-cat") === cat) && (!s || li.textContent.toLowerCase().indexOf(s) > -1); li.hidden = !ok; if (ok) n++; });
      cnt.textContent = n;
    };
    q.addEventListener("input", run);
    btns.forEach(function (b) { b.addEventListener("click", function () { cat = b.getAttribute("data-cat"); btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); }); });
  }

  /* contact form -> pre-filled email */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { return (cf.elements[n].value || "").trim(); };
    var body = "Name: " + g("name") + "\nCompany: " + g("company") + "\nPhone: " + g("phone") + "\n\n" + g("message");
    location.href = "mailto:" + cf.getAttribute("data-sales") + "?subject=" + encodeURIComponent(cf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
  });

  /* the route tool: "Does my part fit?" */
  var root = $("[data-route]"), dataEl = $("#route-data");
  if (root && dataEl) {
    var D = JSON.parse(dataEl.textContent), T = D.t, res = $("#res");
    var byId = {}; D.needs.forEach(function (n) { byId[n.id] = n; });
    var boxes = $$("input[name=need]", root), mats = $$("input[name=mat]", root), qtys = $$("input[name=qty]", root), dia = $("#dia", root), see = $("#seecount");
    var state = function () {
      return { n: boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }), d: parseFloat(dia.value) || 0,
        m: (mats.filter(function (b) { return b.checked; })[0] || {}).value || "", q: (qtys.filter(function (b) { return b.checked; })[0] || {}).value || "" };
    };
    var tier = function (d) { for (var i = 0; i < D.tiers.length; i++) if (d <= D.tiers[i][0]) return D.tiers[i][1]; return ""; };
    var steps = function (s) {
      var out = {}; s.n.forEach(function (id) { var n = byId[id]; if (n) (out[n.step] = out[n.step] || []).push(n); });
      var list = []; D.order.forEach(function (k) { if (k === "inspect") { if (s.n.length) list.push(["inspect", []]); } else if (out[k]) list.push([k, out[k]]); });
      return list;
    };
    var emailText = function (s, list) {
      var L = [T.mail_intro, ""];
      list.forEach(function (p, i) {
        if (p[0] === "inspect") { L.push((i + 1) + ". " + D.steps.inspect); return; }
        L.push((i + 1) + ". " + D.steps[p[0]] + ": " + p[1].map(function (n) { return n.label; }).join("; "));
      });
      if (s.d && s.n.indexOf("turn") > -1) L.push("", "Largest turned diameter: " + s.d + " mm");
      if (s.m) L.push("Material: " + D.mats[s.m]);
      if (s.q) L.push("Quantity: " + D.qtys[s.q]);
      L.push("", T.mail_outro);
      return L.join("\n");
    };
    var render = function () {
      var s = state(), list = steps(s);
      if (see) see.textContent = s.n.length ? "(" + s.n.length + ")" : "";
      var h = "<h3>" + esc(T.result) + "</h3>";
      if (!s.n.length) { res.innerHTML = h + '<p class="res__empty">' + esc(T.empty) + "</p>"; return; }
      h += '<div class="res__sum"><b>' + list.length + "</b><span>" + esc(T.one_roof) + "</span></div>";
      list.forEach(function (p, i) {
        h += '<div class="step" data-n="' + (i + 1) + '"><h4>' + esc(D.steps[p[0]]) + "</h4>";
        if (p[0] === "inspect") {
          h += '<div class="need"><p>' + esc(D.inspect.line) + '</p><ul class="pills">' + D.inspect.machines.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + '</ul><p style="margin-top:.5rem"><a href="' + D.inspect.page + '">Quality assurance</a></p></div>';
        } else p[1].forEach(function (n) {
          h += '<div class="need"><b>' + esc(n.label) + "</b><p>" + esc(n.line) + "</p>";
          if (n.id === "turn" && s.d) h += '<div class="flag' + (s.d > 305 ? " flag--warn" : "") + '">' + esc(s.d + " mm: " + tier(s.d)) + "</div>";
          var ms = n.machines;
          if (n.id === "turn" && s.d > 50) ms = s.d <= 65 ? ms.filter(function (m) { return /Nakamura/.test(m.n); }) : (byId.billet ? byId.billet.machines : []);
          if (ms.length) h += '<ul class="pills">' + ms.map(function (m) { return "<li>" + esc(m.n) + (m.q > 1 ? " ×" + m.q : "") + "</li>"; }).join("") + "</ul>";
          h += "</div>";
        });
        h += "</div>";
      });
      if (s.n.indexOf("turn") > -1 && !s.d) h += '<div class="flag">' + esc(T.dia_label) + "?</div>";
      if (s.m) h += '<div class="flag' + (s.m === "other" ? " flag--warn" : "") + '">' + esc(D.mats[s.m] + ": " + D.matLine[s.m]) + "</div>";
      if (s.q) h += '<div class="flag">' + esc(D.qtys[s.q] + ": " + D.qtyLine[s.q]) + "</div>";
      var body = emailText(s, list);
      h += '<div class="res__act"><a class="btn full" id="send" href="mailto:' + D.sales + "?subject=" + encodeURIComponent(T.mail_subject) + "&body=" + encodeURIComponent(body) + '">' + esc(T.send) + '</a>' +
        '<button class="btn btn--ghost" type="button" id="copy">' + esc(T.copy) + '</button><a class="btn btn--ghost" href="' + D.tel + '">' + esc(T.or_call) + " " + esc(D.telText) + '</a></div>' +
        '<p class="res__fine" style="margin-top:.8rem">' + esc(T.attach) + " " + esc(T.indicative) + "</p>";
      res.innerHTML = h;
      var cb = $("#copy", res);
      if (cb) cb.addEventListener("click", function () {
        var done = function () { cb.textContent = T.copied; setTimeout(function () { cb.textContent = T.copy; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(body).then(done, done); else done();
      });
      safe(function () {
        var hash = "n=" + s.n.join(",") + (s.d ? "&d=" + s.d : "") + (s.m ? "&m=" + s.m : "") + (s.q ? "&q=" + s.q : "");
        history.replaceState(null, "", location.pathname + location.search + "#" + hash);
      });
    };
    var apply = function (ids, d, m, q) {
      boxes.forEach(function (b) { b.checked = ids.indexOf(b.value) > -1; });
      dia.value = d || ""; mats.forEach(function (b) { b.checked = b.value === m; }); qtys.forEach(function (b) { b.checked = b.value === q; });
      render();
    };
    root.addEventListener("change", render); dia.addEventListener("input", render);
    $$("[data-preset]", root).forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-preset").split(","), "", "", ""); }); });
    var p = {}; (location.hash || "").replace(/^#/, "").split("&").forEach(function (kv) { var a = kv.split("="); if (a[0]) p[a[0]] = decodeURIComponent(a[1] || ""); });
    if (p.n) apply(p.n.split(","), p.d, p.m, p.q);
  }
})();
