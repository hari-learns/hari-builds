(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("varia-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("varia-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.98) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* gallery filter (?k=<category>) */
  var gal = $("[data-gallery]");
  if (gal) {
    var chips = $$("[data-f]"), shots = $$(".shot", gal);
    var apply = function (f) {
      chips.forEach(function (c) { var on = c.getAttribute("data-f") === f; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      shots.forEach(function (s) { s.hidden = !(f === "all" || (s.getAttribute("data-cats") || "").split(" ").indexOf(f) >= 0); });
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-f")); }); });
    var m = /[?&]k=([\w-]+)/.exec(location.search);
    apply(m ? m[1] : "all");
  }

  /* lightbox */
  var lbLinks = $$("[data-lb]"), lb = null, cur = 0, list = [];
  function lbShow(i) {
    list = $$("[data-lb]").filter(function (a) { return !a.hidden; });
    cur = (i + list.length) % list.length;
    var a = list[cur];
    $(".lb__img", lb).innerHTML = '<img src="' + esc(a.getAttribute("href")) + '" alt="' + esc(a.getAttribute("data-cap") || "") + '">';
    $(".lb__cap", lb).textContent = a.getAttribute("data-cap") || "";
  }
  function lbOpen(a) {
    if (!lb) {
      lb = d.createElement("dialog"); lb.className = "lb"; lb.setAttribute("aria-label", "Photo");
      lb.innerHTML = '<div class="lb__in"><div class="lb__img"></div><div class="lb__bar"><button type="button" data-p aria-label="Previous">&larr;</button><p class="lb__cap"></p><button type="button" data-n aria-label="Next">&rarr;</button><button type="button" data-x aria-label="Close">&times;</button></div></div>';
      d.body.appendChild(lb);
      $("[data-p]", lb).addEventListener("click", function () { lbShow(cur - 1); });
      $("[data-n]", lb).addEventListener("click", function () { lbShow(cur + 1); });
      $("[data-x]", lb).addEventListener("click", function () { lb.close(); });
      lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
      lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") lbShow(cur - 1); if (e.key === "ArrowRight") lbShow(cur + 1); });
    }
    var vis = $$("[data-lb]").filter(function (x) { return !x.hidden; });
    lb.showModal(); lbShow(vis.indexOf(a));
  }
  if (typeof HTMLDialogElement !== "undefined") lbLinks.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); lbOpen(a); }); });

  /* contact form -> mailto */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var cfg = JSON.parse($("#cform-data").textContent), v = function (n) { return cf.elements[n].value.trim(); };
    var body = v("msg") + "\n\n" + v("name") + "\n" + v("email") + "\n" + v("phone");
    location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject) + "&body=" + encodeURIComponent(body);
  });

  /* signature tool: job check */
  $$("[data-tool]").forEach(function (tool) {
    var data = JSON.parse($("#tool-data", tool).textContent), U = data.ui, out = $("[data-out]", tool), form = $("form", tool);
    var scrolled = false;
    function val(n) { var el = form.elements[n]; return el ? el.value : ""; }
    function num(n) { var x = parseFloat(val(n)); return isFinite(x) && x > 0 ? x : 0; }
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
    function state() {
      var fins = $$('input[name="fin"]:checked', form).map(function (x) { return x.value; });
      return { job: val("job"), mat: val("mat"), fins: fins, len: num("len"), wid: num("wid"), kg: num("kg"), where: val("where") };
    }
    function summary(s, j, dept) {
      var L = data.lines, t = [L.hi, "", L.need + ": " + j.label, L.mat + ": " + data.mats[s.mat]];
      if (s.fins.length) t.push(L.fin + ": " + s.fins.map(function (f) { return data.fins[f]; }).join(", "));
      if (s.len || s.wid) t.push(L.size + ": " + (s.len || "?") + " x " + (s.wid || "?") + " mm");
      if (s.kg) t.push(L.kg + ": " + fmt(s.kg) + " kg");
      t.push(L.where + ": " + data.where[s.where], L.dept + ": " + data.dept[dept].name, "", L.name, "", L.sketch);
      return t.join("\n");
    }
    function render() {
      var s = state();
      var j = data.jobs.filter(function (x) { return x.id === s.job; })[0];
      if (!j) { out.innerHTML = '<p class="tool__empty">' + esc(U.res_none) + "</p>"; return; }
      var dept = s.where === "repair" ? "furuset" : j.dept;
      var D = data.dept[dept], checks = [];
      function add(kind, txt) { checks.push('<li><span class="ic ic--' + kind + '" aria-hidden="true">' + (kind === "i" ? "i" : kind === "w" ? "!" : "✓") + "</span><span>" + esc(txt) + "</span></li>"); }
      if (j.cert === "en1090") add("o", U.cert_en1090); else if (j.cert === "lift") add("o", U.cert_lift); else add("i", U.cert_none);
      if (s.where === "site") add("o", U.site_ok);
      if (s.where === "repair") add("o", U.repair_ok);
      if (s.kg) {
        if (s.kg <= data.crane) add("o", U.crane + ": " + fmt(s.kg) + " kg. " + U.crane_ok);
        else { add("w", U.crane + ": " + fmt(s.kg) + " kg. " + U.crane_over); if (s.kg <= data.truck) add("i", U.truck); }
      }
      add("i", U.sketch);
      var sim = j.sim.map(function (p) { return '<a href="' + esc(j.page) + '"><img src="' + esc(p.src) + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.alt) + '" loading="lazy"></a>'; }).join("");
      var text = summary(s, j, dept);
      var href = "mailto:" + data.mail + "?subject=" + encodeURIComponent(U.mail_subject) + "&body=" + encodeURIComponent(text);
      out.innerHTML = '<div class="out"><div class="out__dept"><small class="mono">' + esc(U.dept_h) + "</small><b>" + esc(D.name) + "</b><span>" + esc(D.why) + "</span></div>" +
        "<p>" + esc(j.why) + "</p><h3>" + esc(U.checks_h) + '</h3><ul class="checks">' + checks.join("") + "</ul>" +
        "<h3>" + esc(U.similar_h) + '</h3><div class="sim">' + sim + '</div><p style="margin-top:10px"><a class="tlink" href="' + esc(j.page) + '">' + esc(j.label) + " &rarr;</a> " + '</p>' +
        '<div class="out__send"><h3>' + esc(U.send_h) + "</h3><p>" + esc(U.send_p) + '</p><a class="btn" data-mail href="' + esc(href) + '">' + esc(U.send) + '</a><button type="button" class="btn btn--ghost" data-copy>' + esc(U.copy) + '</button><a class="btn btn--ghost" href="tel:' + esc(data.tel.replace(/\s/g, "")) + '">' + esc(data.tel) + "</a></div>" +
        '<p class="out__ind">' + esc(U.indicative) + "</p></div>";
      var cb = $("[data-copy]", out);
      if (cb) cb.addEventListener("click", function () {
        var done = function () { cb.textContent = U.copied; setTimeout(function () { cb.textContent = U.copy; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
      });
      if (!scrolled && window.innerWidth < 1040 && s.job) { scrolled = true; out.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    }
    form.addEventListener("input", render); form.addEventListener("change", render);
    if (val("job")) { scrolled = true; render(); }
    var q = /[?&]job=(\w+)/.exec(location.search);
    if (q) { var r = $('input[name="job"][value="' + q[1] + '"]', form); if (r) { r.checked = true; scrolled = true; render(); } }
  });
})();
