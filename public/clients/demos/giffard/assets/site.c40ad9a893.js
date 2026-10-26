(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function norm(s) { return (s || "").toLowerCase().normalize ? (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : (s || "").toLowerCase(); }
  root.classList.remove("js-off");
  if (reduce) root.classList.add("no-motion");

  /* header shadow */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 30); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus();
    else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1020) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("giffard-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("giffard-dock", "1"); }); });

  /* reveals: IntersectionObserver + a sweep that never strands content (anything at or above the fold is shown) */
  var rs = $$("[data-r]");
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) { rs.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rs.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; rs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* process steps: highlight + sticky image */
  var steps = $$(".step");
  if (steps.length && "IntersectionObserver" in window) {
    var imgs = $$(".steps__media img");
    var setActive = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); });
    };
    setActive(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(steps.indexOf(e.target)); });
    }, { rootMargin: "-42% 0px -48% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  } else { steps.forEach(function (s) { s.classList.add("is-active"); }); }

  /* lightbox over real photos */
  var lb = $("#lb");
  if (lb && lb.showModal) {
    var lbImg = $("#lb-img"), lbCap = $("#lb-cap"), group = [], idx = 0;
    var open = function (btns, i) {
      group = btns; idx = i; paint(); if (!lb.open) lb.showModal(); root.style.overflow = "hidden";
    };
    var paint = function () {
      var b = group[idx]; lbImg.src = b.getAttribute("data-full"); lbImg.alt = b.getAttribute("data-cap") || "";
      lbCap.textContent = b.getAttribute("data-cap") || "";
    };
    $$(".gallery").forEach(function (g) {
      var btns = $$(".gal", g);
      btns.forEach(function (b, i) { b.addEventListener("click", function () { open(btns, i); }); });
    });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    $("#lb-p").addEventListener("click", function () { idx = (idx + group.length - 1) % group.length; paint(); });
    $("#lb-n").addEventListener("click", function () { idx = (idx + 1) % group.length; paint(); });
    lb.addEventListener("close", function () { root.style.overflow = ""; lbImg.removeAttribute("src"); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__in")) lb.close(); });
    d.addEventListener("keydown", function (e) { if (!lb.open) return; if (e.key === "ArrowRight") $("#lb-n").click(); if (e.key === "ArrowLeft") $("#lb-p").click(); });
  }

  /* reference wall: search + filter over their real reference logos */
  var refq = $("#refq");
  if (refq) {
    var cells = $$(".refcell"), groups = $$(".refgrp"), chips = $$("[data-g-btn]"), count = $("#refcount"), cur = "all";
    var apply = function () {
      var q = norm(refq.value.trim()), n = 0;
      cells.forEach(function (c) {
        var ok = (cur === "all" || c.getAttribute("data-g") === cur) && (!q || c.getAttribute("data-name").indexOf(q) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      groups.forEach(function (g) { g.hidden = !$$(".refcell:not([hidden])", g).length; });
      if (count) count.textContent = n + (n > 1 ? " références" : " référence");
      var em = $("#ref-empty"); if (em) em.hidden = n > 0;
    };
    refq.addEventListener("input", apply);
    chips.forEach(function (b) { b.addEventListener("click", function () {
      cur = b.getAttribute("data-g-btn"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); apply(); }); });
    apply();
  }

  /* the signature tool: "Décrivez votre chantier" */
  var dataEl = $("#tool-data"), tool = $("#tool");
  if (dataEl && tool) {
    var D = JSON.parse(dataEl.textContent);
    var st = { sector: "", works: [], region: "", role: "" };
    var el = function (id) { return d.getElementById(id); };
    var sectorInputs = $$("input[name=sector]", tool), workInputs = $$("input[name=work]", tool), regionInputs = $$("input[name=region]", tool);
    var roleSel = el("t-role"), fname = el("t-name"), forg = el("t-org"), fphone = el("t-phone"), fdet = el("t-details");
    var draft = el("t-draft"), send = el("t-send"), copy = el("t-copy"), call = el("t-call"), copied = el("t-copied");
    var empty = el("f-empty"), body = el("f-body"), jump = el("t-jump");

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    function agencyFor() { if (!st.region) return null; return D.agencies[st.region === "autre" ? "idf" : st.region]; }
    function regionLabel() { var r = D.regions.filter(function (x) { return x.key === st.region; })[0]; return r ? r.label : ""; }
    function roleLabel() { var r = D.roles.filter(function (x) { return x[0] === st.role; })[0]; return r && r[0] ? r[1] : ""; }

    function compose() {
      var s = D.sectors[st.sector]; if (!s) return { subject: "", body: "", to: D.company.email };
      var ag = agencyFor();
      var works = st.works.map(function (k) { return D.works[k].label; });
      var lines = ["Bonjour,", "", "Je vous contacte pour un chantier de type « " + s.label + " »."];
      lines.push("Travaux envisagés : " + (works.length ? works.join(", ") : "à préciser") + ".");
      lines.push("Lieu du chantier : " + (regionLabel() || "à préciser") + ".");
      if (roleLabel()) lines.push("Mon rôle : " + roleLabel() + ".");
      var det = fdet.value.trim(); if (det) { lines.push("", "Précisions : " + det); }
      lines.push("", "Merci de me recontacter" + (fphone.value.trim() ? " au " + fphone.value.trim() : "") + ".", "", "Cordialement,");
      if (fname.value.trim()) lines.push(fname.value.trim());
      if (forg.value.trim()) lines.push(forg.value.trim());
      return { subject: "Chantier : " + s.short + (regionLabel() ? " (" + regionLabel() + ")" : ""), body: lines.join("\n"), to: ag ? ag.email : D.company.email };
    }

    function uniquePages() {
      var s = D.sectors[st.sector], out = [], seen = {};
      function add(label, href) { if (!href || seen[href]) return; seen[href] = 1; out.push({ label: label, href: href }); }
      add(s.short, s.href);
      st.works.forEach(function (k) { add(D.works[k].label, D.works[k].href); });
      return out;
    }

    function render() {
      var s = D.sectors[st.sector];
      empty.hidden = !!s; body.hidden = !s;
      if (jump) jump.classList.toggle("is-on", !!s);
      if (!s) return;
      var ag = agencyFor(), html;
      if (ag) {
        html = '<div class="ag"><b>' + esc(ag.name) + '</b><p>' + esc(ag.role) + ", " + esc(ag.street) + ", " + esc(ag.postal) + "</p>" +
          (ag.contact ? "<p>Responsable : " + esc(ag.contact) + "</p>" : "") +
          '<p>Territoire : ' + esc(ag.territory) + '</p>' +
          (st.region === "autre" ? '<p class="note">' + esc(D.ui.fallback) + "</p>" : "") +
          '<div class="btns"><a class="btn" href="tel:' + esc(ag.tel_e164) + '">' + esc(D.ui.call) + " " + esc(ag.tel) + '</a><a class="btn btn--ghost" href="mailto:' + esc(ag.email) + '">' + esc(ag.email) + "</a></div></div>";
      } else { html = '<p class="note">Choisissez la région du chantier pour afficher votre interlocuteur.</p>'; }
      el("f-agency").innerHTML = html;
      el("f-mastery").innerHTML = s.mastery.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
      el("f-links").innerHTML = uniquePages().map(function (p) { return '<a href="' + esc(p.href) + '"><span>' + esc(p.label) + "</span>" + ARROW + "</a>"; }).join("");
      el("f-refs").innerHTML = s.logos.slice(0, 6).map(function (l) { return '<div class="logo"><img src="' + esc(l.src) + '" width="' + l.w + '" height="' + l.h + '" alt="' + esc(l.alt) + '" loading="lazy"></div>'; }).join("");
      var c = compose();
      draft.value = c.body;
      send.href = "mailto:" + c.to + "?subject=" + encodeURIComponent(c.subject) + "&body=" + encodeURIComponent(c.body);
      send.textContent = D.ui.send + " (" + c.to + ")";
      if (call) { var a2 = ag || D.agencies.idf; call.href = "tel:" + a2.tel_e164; call.textContent = D.ui.call + " " + a2.tel; }
    }

    function writeUrl() {
      var q = [];
      if (st.sector) q.push("secteur=" + st.sector);
      if (st.region) q.push("region=" + st.region);
      if (st.works.length) q.push("travaux=" + st.works.join(","));
      safe(function () { history.replaceState(null, "", location.pathname + (q.length ? "?" + q.join("&") : "") + location.hash); });
    }
    function read() {
      st.sector = (sectorInputs.filter(function (i) { return i.checked; })[0] || {}).value || "";
      st.region = (regionInputs.filter(function (i) { return i.checked; })[0] || {}).value || "";
      st.works = workInputs.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      st.role = roleSel ? roleSel.value : "";
      render(); writeUrl();
    }
    $$("input", tool).forEach(function (i) { i.addEventListener("change", read); });
    if (roleSel) roleSel.addEventListener("change", read);
    [fname, forg, fphone, fdet].forEach(function (f) { if (f) f.addEventListener("input", function () { if (st.sector) render(); }); });
    if (copy) copy.addEventListener("click", function () {
      var txt = draft.value; if (!txt) return;
      var done = function () { if (copied) { copied.hidden = false; setTimeout(function () { copied.hidden = true; }, 2200); } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { draft.select(); safe(function () { d.execCommand("copy"); }); done(); });
      else { draft.select(); safe(function () { d.execCommand("copy"); }); done(); }
    });
    // presets from the URL
    var p = new URLSearchParams(location.search);
    var ps = p.get("secteur"), pr = p.get("region"), pw = (p.get("travaux") || "").split(",").filter(Boolean);
    sectorInputs.forEach(function (i) { if (i.value === ps) i.checked = true; });
    regionInputs.forEach(function (i) { if (i.value === pr) i.checked = true; });
    workInputs.forEach(function (i) { if (pw.indexOf(i.value) > -1) i.checked = true; });
    read();
  }
})();
