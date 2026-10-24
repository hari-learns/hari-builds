(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header shadow on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1140) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("kmt-dock") === "1"; })) dock.hidden = true;
  function closeDock() { if (!dock || dock.hidden) return; dock.hidden = true; safe(function () { sessionStorage.setItem("kmt-dock", "1"); }); }
  if (dockX) dockX.addEventListener("click", closeDock);
  /* phones: the notice sits above the sticky Anfrage bar, so it shows on first load only and leaves once the visitor starts reading */
  if (dock && !dock.hidden && window.matchMedia && window.matchMedia("(max-width: 860px)").matches) {
    var onDockScroll = function () { if (window.scrollY > 320) { closeDock(); window.removeEventListener("scroll", onDockScroll); } };
    window.addEventListener("scroll", onDockScroll, { passive: true });
  }

  /* reveals: observer plus a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* timeline: line follows scroll, dots fill as they pass */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (reduce || li.getBoundingClientRect().top < vh * 0.72) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* process chain: the step nearest the middle of the screen owns the sticky photo */
  $$("[data-chain]").forEach(function (ch) {
    var steps = $$(".step", ch), imgs = $$(".chain__media img", ch), cnt = $(".chain__count", ch), cur = -1;
    function set(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle("is-on", k === i); if (k === i || k === i + 1) { im.loading = "eager"; } });
      if (cnt) cnt.textContent = String(i + 1).padStart(2, "0") + " / " + String(steps.length).padStart(2, "0");
    }
    function upd() {
      var mid = window.innerHeight * 0.5, best = 0, bd = Infinity;
      steps.forEach(function (s, k) { var r = s.getBoundingClientRect(), c = r.top + r.height / 2, dd = Math.abs(c - mid); if (dd < bd) { bd = dd; best = k; } });
      set(best);
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); window.addEventListener("load", upd); upd();
  });

  /* sub navigation highlight on long pages */
  $$("[data-subnav]").forEach(function (nav) {
    var links = $$("a", nav), secs = links.map(function (a) { return d.getElementById(a.getAttribute("href").split("#")[1]); });
    function upd() {
      var k = 0;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.35) k = i; });
      links.forEach(function (a, i) { a.classList.toggle("is-on", i === k); });
    }
    window.addEventListener("scroll", upd, { passive: true }); upd();
  });

  /* Anfrage form -> pre-filled mailto */
  var form = $("#anfrage");
  if (form) (function () {
    var cfg = JSON.parse($("#anfrage-data").textContent), L = cfg.labels, q = new URLSearchParams(location.search);
    var t = q.get("thema");
    if (t) $$("input[name=topic]", form).forEach(function (r) { if (r.value === t) r.checked = true; });
    function val(id) { var el = $("#" + id); return el ? el.value.trim() : ""; }
    function text() {
      var out = [];
      var topic = $("input[name=topic]:checked", form);
      if (topic) out.push(L.topic + ": " + topic.value);
      var mat = $("#material"); if (mat && mat.selectedIndex > 0) out.push(L.material + ": " + mat.value);
      var steps = $$("input[name=steps]:checked", form).map(function (c) { return c.value; });
      if (steps.length) out.push(L.steps + ": " + steps.join(", "));
      if (val("qty")) out.push(L.qty + ": " + val("qty"));
      if (val("msg")) out.push("", val("msg"), "");
      ["anrede", "name", "company", "phone", "email"].forEach(function (k) { if (val(k)) out.push(L[k] + ": " + val(k)); });
      return out.join("\n");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var topic = $("input[name=topic]:checked", form), co = val("company");
      var subj = cfg.subject + (topic ? " – " + topic.value : "") + (co ? " (" + co + ")" : "");
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#anfrage-copy");
    if (cp) cp.addEventListener("click", function () {
      var old = cp.textContent;
      function done() { cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text()).then(done, function () {});
    });
  })();
})();
