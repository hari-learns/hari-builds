(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

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

  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("fe-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("fe-dock", "1"); }); });

  if (location.hash) { var th = d.getElementById(location.hash.slice(1)); if (th) setTimeout(function () { th.scrollIntoView(); }, 60); }
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep(); if (reduce) rvs.forEach(activate);

  /* project filters */
  var fl = $("#pfilters");
  if (fl) {
    var items = $$("#plist li");
    $$("button", fl).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", fl).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var k = b.getAttribute("data-k");
        items.forEach(function (li) { li.hidden = !(k === "all" || li.getAttribute("data-k") === k); });
        var c = $("#pcount"); if (c) c.textContent = items.filter(function (li) { return !li.hidden; }).length;
      });
    });
  }

  /* grating spec builder: only reshuffles Ferrotech's published options into one enquiry line */
  var form = $("#spec");
  if (form) {
    var D = JSON.parse($("#spec-data").textContent);
    var el = function (n) { return form.elements[n]; };
    function fill(sel, arr, keep) { var cur = keep ? sel.value : null; sel.innerHTML = ""; arr.forEach(function (v) { var o = d.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); }); if (cur && arr.indexOf(cur) > -1) sel.value = cur; }
    function type() { return form.querySelector("input[name=type]:checked").value; }
    function sync(first) {
      var s = D.spec[type()];
      fill(el("thick"), s.thick, true); fill(el("pitch"), s.pitch, true); fill(el("cross"), s.cross, true); fill(el("std"), s.standards, true); fill(el("mat"), s.materials, true);
      var lbl = $("#lbl-std"); lbl.hidden = !s.std_panel; if (!s.std_panel) form.querySelector("input[name=panel][value=shaped]").checked = true;
      var dp = el("depth"); dp.min = s.depth[0]; dp.max = s.depth[1];
      if (first || +dp.value > s.depth[1]) dp.value = first ? 30 : s.depth[1];
      $("#depth-hint").textContent = "Range " + s.depth[0] + " to " + s.depth[1] + " mm";
    }
    function build() {
      var t = type(), s = D.spec[t], dep = +el("depth").value, qv = el("qty").value, ok = el("depth").value !== "" && dep >= s.depth[0] && dep <= s.depth[1] && (qv === "" || +qv > 0);
      var bar = form.querySelector("input[name=bar]:checked").value, panel = form.querySelector("input[name=panel]:checked").value;
      var fin = el("finish").value, galv = fin === "Hot dip galvanised" ? " (" + D.galv + ")" : "";
      var qty = el("qty").value || "___", unit = el("unit").value;
      var lines = [
        s.label + " grating, " + el("std").value,
        "Load bar: " + dep + " x " + el("thick").value + " mm, " + bar.toLowerCase(),
        "Pitch (load bar x cross bar): " + el("pitch").value + " mm",
        "Cross bar: " + el("cross").value,
        "Material: " + el("mat").value,
        "Finish: " + fin + galv,
        "Panels: " + (panel === "standard" ? "standard 1000 x 7315 mm" : "shaped to our drawing"),
        "Quantity: " + qty + " " + unit
      ];
      var txt = lines.join("\n");
      $("#spec-out").textContent = txt;
      var warn = $("#spec-warn"); warn.textContent = ok ? "" : "Check the values: depth " + s.depth[0] + " to " + s.depth[1] + " mm, quantity above zero.";
      ["#spec-wa", "#spec-mail"].forEach(function (id) { var a = $(id); a.setAttribute("aria-disabled", ok ? "false" : "true"); a.style.pointerEvents = ok ? "" : "none"; a.style.opacity = ok ? "" : ".45"; });
      var msg = "[Concept demo] Enquiry from the Ferrotech website concept:\n" + txt;
      $("#spec-wa").href = "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(msg);
      $("#spec-mail").href = "mailto:" + D.email + "?subject=" + encodeURIComponent("Grating enquiry") + "&body=" + encodeURIComponent(msg);
    }
    form.addEventListener("input", function (e) { if (e.target.name === "type") sync(false); build(); });
    form.addEventListener("change", function (e) { if (e.target.name === "type") sync(false); build(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    sync(true); build();
  }
})();
