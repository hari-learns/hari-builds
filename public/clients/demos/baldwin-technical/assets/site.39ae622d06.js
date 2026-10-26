(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header shadow on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1180) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("btsdock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("btsdock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el, i) {
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    if (sib > 0 && sib < 8) el.style.setProperty("--d", (sib * 0.06).toFixed(2) + "s");
    if (io) io.observe(el); else activate(el);
  });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.8) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* hero parallax, 5% at most, off for reduced motion */
  var px = $("[data-parallax]");
  if (px && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        px.style.transform = "translate3d(0," + (y * 0.05).toFixed(1) + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* before / after */
  $$("[data-ba]").forEach(function (ba) {
    var inp = $("[data-ba-in]", ba);
    function set(v) { ba.style.setProperty("--x", v + "%"); }
    if (inp) { inp.addEventListener("input", function () { set(inp.value); }); set(inp.value); }
  });

  /* signature tool: does Baldwin work on my PLC? */
  var tool = $("[data-tool]");
  if (tool) {
    var data = JSON.parse($("#tool-data").textContent), T = data.t;
    var st = { brand: null, job: null };
    var brandBtns = $$("[data-brand]", tool), jobBtns = $$("[data-job]", tool);
    var res = $("[data-result]", tool), rh = $("[data-rh]", tool), rn = $("[data-rn]", tool), pk = $("[data-pk]", tool);
    var jc = $("[data-job-card]", tool), jd = $("[data-jd]", tool), jl = $("[data-jl]", tool);
    var mail = $("[data-mail]", tool), inM = $("[data-model]", tool), inS = $("[data-site]", tool), inN = $("[data-name]", tool);
    var search = $("[data-search]", tool), hits = $("[data-hits]", tool);
    function brandObj(n) { for (var i = 0; i < data.brands.length; i++) if (data.brands[i].name === n) return data.brands[i]; return null; }
    function jobObj(id) { for (var i = 0; i < data.jobs.length; i++) if (data.jobs[i].id === id) return data.jobs[i]; return null; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function brandName() { return st.brand === "__other" ? data.other : (st.brand || ""); }
    function buildMail() {
      var job = jobObj(st.job);
      var body = T.mail_body.replace("{brand}", brandName() || "-").replace("{model}", inM.value || "-").replace("{job}", job ? job.label : "-").replace("{site}", inS.value || "-").replace("{name}", inN.value || "-");
      var subj = T.mail_subject.replace("{brand}", brandName() || "PLC").replace("{job}", job ? job.label : "enquiry");
      mail.href = "mailto:" + data.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    }
    function render() {
      brandBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-brand") === st.brand ? "true" : "false"); });
      jobBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-job") === st.job ? "true" : "false"); });
      var show = !!(st.brand || st.job);
      res.hidden = !show;
      if (st.brand) {
        var b = brandObj(st.brand);
        rh.textContent = b ? T.result_h + " " + b.name : data.other;
        rn.textContent = b ? b.pkgs.length + " " + (b.pkgs.length === 1 ? "package" : "packages") : T.result_none;
        pk.innerHTML = b ? b.pkgs.map(function (p) { return "<li>" + esc(p[0]) + "<small>" + esc(p[1]) + "</small></li>"; }).join("") : "";
        pk.hidden = !b;
      } else { rh.textContent = ""; rn.textContent = ""; pk.innerHTML = ""; }
      var j = jobObj(st.job);
      jc.hidden = !j;
      if (j) { jd.textContent = j.does; jl.href = j.href; jl.textContent = "Read about this service"; }
      /* highlight rows in the software table, if present */
      $$("[data-maker]").forEach(function (tr) { tr.classList.toggle("is-hit", !!st.brand && tr.getAttribute("data-maker") === st.brand); });
      buildMail();
    }
    brandBtns.forEach(function (b) { b.addEventListener("click", function () { st.brand = st.brand === b.getAttribute("data-brand") ? null : b.getAttribute("data-brand"); render(); }); });
    jobBtns.forEach(function (b) { b.addEventListener("click", function () { st.job = st.job === b.getAttribute("data-job") ? null : b.getAttribute("data-job"); render(); }); });
    [inM, inS, inN].forEach(function (i) { i.addEventListener("input", buildMail); });
    if (search) search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase(), out = [];
      if (q.length >= 2) data.brands.forEach(function (b) { b.pkgs.forEach(function (p) { if (p[0].toLowerCase().indexOf(q) > -1 || b.name.toLowerCase().indexOf(q) > -1) out.push([b.name, p[0]]); }); });
      hits.innerHTML = out.slice(0, 8).map(function (o) { return '<button type="button" class="chip" data-pick="' + esc(o[0]) + '">' + esc(o[0]) + " · " + esc(o[1]) + "</button>"; }).join("");
      if (q.length >= 2 && !out.length) hits.innerHTML = '<p class="note">' + esc(T.result_none) + "</p>";
      $$("[data-pick]", hits).forEach(function (h) { h.addEventListener("click", function () { st.brand = h.getAttribute("data-pick"); render(); }); });
    });
    var qs = safe(function () { return new URLSearchParams(location.search); });
    if (qs && qs.get("brand") && brandObj(qs.get("brand"))) st.brand = qs.get("brand");
    render();
  }

  /* contact form: opens a pre-filled email, no server */
  $$("[data-contact-form]").forEach(function (f) {
    var cfg = JSON.parse($("[data-cf]", f).textContent);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (n) { return (f.elements[n] && f.elements[n].value) || "-"; };
      var body = cfg.body.replace("{name}", v("name")).replace("{company}", v("company")).replace("{phone}", v("phone")).replace("{need}", v("need")).replace("{msg}", f.elements.msg.value || "");
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject.replace("{need}", v("need"))) + "&body=" + encodeURIComponent(body);
    });
  });
})();
