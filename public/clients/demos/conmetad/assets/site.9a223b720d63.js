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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1120) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("cmd-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cmd-dock", "1"); }); });

  /* reveals (sweep also reveals anything scrolled past) */
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

  /* gallery filter */
  var fl = $("[data-filters]"), grid = $("[data-pgrid]");
  if (fl && grid) {
    var cards = $$(".pcard", grid), cnt = $("[data-count]");
    $$("button", fl).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f"), n = 0;
        $$("button", fl).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        cards.forEach(function (c) { var show = f === "todos" || c.getAttribute("data-cat") === f; c.hidden = !show; if (show) n++; });
        if (cnt) cnt.textContent = cnt.getAttribute("data-tpl").replace("{n}", n).replace("{t}", cnt.getAttribute("data-total"));
      });
    });
  }

  /* the tool: does my tank fit the workshop? */
  $$("[data-tool]").forEach(function (root) {
    var data = JSON.parse($("[data-tool-data]", root).textContent), L = data.limits, ui = data.ui, sep = data.sep;
    var vol = $("input[name=vol]", root), dia = $("input[name=d]", root), wt = $("input[name=w]", root);
    var shapes = $$("input[type=radio]", root), res = $("[data-res]", root), srcEl = $("[data-srcout]", root), mail = $("[data-mail]", root);
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
    function shape() { var s = "v"; shapes.forEach(function (r) { if (r.checked) s = r.value; }); return s; }
    function gauge(id, val, lim, show) {
      var g = $("[data-g=" + id + "]", root); if (!g) return;
      g.style.display = show ? "" : "none"; if (!show) return;
      g.classList.toggle("is-over", val > lim);
      $("[data-gv]", g).textContent = fmt(val) + " " + (id === "w" ? ui.kg : ui.mm);
      $("i", g).style.width = Math.min(100, val / lim * 100).toFixed(1) + "%";
    }
    function calc() {
      var v = parseFloat(vol.value), dm = parseFloat(dia.value), w = parseFloat(wt.value), s = shape();
      if (!(v > 0) || !(dm >= 300)) { res.setAttribute("data-state", "empty"); return; }
      var area = Math.PI * Math.pow(dm / 2, 2), shell = v * 1e6 / area;   // 1 litre = 1e6 mm3
      var hasW = w > 0, over = dm > L.diam || (s === "v" && shell > L.lift) || (hasW && w > L.weight);
      res.setAttribute("data-state", "ready");
      var vd = $("[data-verdict]", root); vd.classList.toggle("is-in", over);
      $("[data-vt]", root).textContent = over ? ui.in_t : ui.ok_t; $("[data-vd]", root).textContent = over ? ui.in_d : ui.ok_d;
      var lbl = s === "v" ? ui.shell_v : ui.shell_h;
      $("[data-shell]", root).innerHTML = lbl + ": <b>≈ " + fmt(shell) + " " + ui.mm + "</b>";
      gauge("d", dm, L.diam, true); gauge("h", shell, L.lift, s === "v"); gauge("w", hasW ? w : 0, L.weight, hasW);
      var lines = [ui.mail_intro, "", ui.mail_shape + ": " + (s === "v" ? ui.v : ui.h_), ui.mail_vol + ": " + fmt(v) + " " + ui.l, ui.mail_d + ": " + fmt(dm) + " " + ui.mm, ui.mail_shell + ": " + fmt(shell) + " " + ui.mm];
      if (hasW) lines.push(ui.mail_w + ": " + fmt(w) + " " + ui.kg);
      lines.push(ui.mail_res + ": " + (over ? ui.in_t : ui.ok_t), "", ui.mail_outro);
      mail.href = "mailto:" + data.email + "?subject=" + encodeURIComponent(ui.mail_sub + ": " + fmt(v) + " " + ui.l + ", Ø " + fmt(dm) + " " + ui.mm) + "&body=" + encodeURIComponent(lines.join("\r\n"));
    }
    [vol, dia, wt].forEach(function (i) { i.addEventListener("input", function () { $$(".chip", root).forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); srcEl.textContent = ""; calc(); }); });
    shapes.forEach(function (r) { r.addEventListener("change", calc); });
    $$(".chip", root).forEach(function (c) {
      c.addEventListener("click", function () {
        vol.value = c.getAttribute("data-vol"); dia.value = c.getAttribute("data-d");
        shapes.forEach(function (r) { r.checked = r.value === c.getAttribute("data-shape"); });
        $$(".chip", root).forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        srcEl.textContent = c.getAttribute("data-src"); calc();
        if (window.innerWidth < 940 && res) safe(function () { res.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); });
      });
    });
    calc();
  });

  /* contact form -> drafted email (nothing is sent) */
  var form = $("[data-mailform]");
  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var rows = [], f = form.elements;
    $$("label", form).forEach(function (lb) {
      var el = lb.htmlFor && d.getElementById(lb.htmlFor); if (el && el.value) rows.push(lb.textContent.trim() + ": " + el.value);
    });
    location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(form.getAttribute("data-subject") + (f.empresa && f.empresa.value ? " - " + f.empresa.value : "")) + "&body=" + encodeURIComponent(rows.join("\r\n"));
  });
})();
