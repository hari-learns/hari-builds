(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var eur = function (n) {
    var v = Math.round(n * 100) / 100;
    var s = v % 1 === 0 ? String(v) : v.toFixed(2);
    var p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    return p.join(",") + "\u00a0€";
  };

  /* ---- menu drawer ---------------------------------------------------------------------- */
  var burger = $(".burger"), drawer = $("#drawer");
  function setMenu(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Sulje valikko" : "Avaa valikko");
    root.style.overflow = open ? "hidden" : "";
  }
  if (burger) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 900) setMenu(false); });
  }

  /* ---- concept dock --------------------------------------------------------------------- */
  var dock = $("#dock"), dockX = $("#dock-x");
  try { if (sessionStorage.getItem("k1-dock") === "x" && dock) dock.hidden = true; } catch (e) {}
  if (dockX) dockX.addEventListener("click", function () {
    dock.hidden = true;
    try { sessionStorage.setItem("k1-dock", "x"); } catch (e) {}
  });

  /* ---- reveal (with a sweep that never strands content) ---------------------------------- */
  var rv = $$(".rv");
  function activate(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(activate); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () {
      var vh = window.innerHeight;
      rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); });
    };
    ["load", "scroll", "resize", "pageshow", "hashchange"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
    setTimeout(sweep, 400);
  }

  /* ---- open / closed now (Helsinki time) ------------------------------------------------- */
  var hours = $("#hours");
  if (hours) {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      var wd = parts.filter(function (p) { return p.type === "weekday"; })[0].value;
      var hr = parseInt(parts.filter(function (p) { return p.type === "hour"; })[0].value, 10) % 24;
      var open = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(wd) > -1 && hr >= 8 && hr < 16;
      hours.classList.toggle("is-open", open);
      $("span", hours).textContent = (open ? "Avoinna nyt · " : "Suljettu nyt · ") + "avoinna arkisin 8–16";
    } catch (e) {}
  }

  /* ---- price search (hinnasto) ----------------------------------------------------------- */
  var ps = $("#psearch");
  if (ps) {
    var sections = $$("[data-tab]"), empty = $("#pempty");
    ps.addEventListener("input", function () {
      var q = ps.value.trim().toLowerCase(), total = 0;
      sections.forEach(function (s) {
        var shown = 0;
        $$("li", s).forEach(function (li) {
          var hit = !q || li.getAttribute("data-s").indexOf(q) > -1;
          li.hidden = !hit; if (hit) shown++;
        });
        s.hidden = shown === 0; total += shown;
      });
      empty.classList.toggle("on", total === 0);
    });
  }

  /* ---- the bill: signature instrument ---------------------------------------------------- */
  var calc = $("#calc");
  if (calc) {
    var cfg = JSON.parse(calc.getAttribute("data-cfg"));
    var rows = $("#rows"), totalEl = $("#total"), net = $("#net"), netL = $("#net-l"), netV = $("#net-v");
    var kelaWrap = $("#kela-wrap"), kela = $("#kela"), fine = $("#fine"), ctaP = $("#cta-p"), ctaE = $("#cta-e");
    var tabP = $("#tab-p"), tabE = $("#tab-e"), panP = $("#panel-p"), panE = $("#panel-e");
    var mode = "p", shown = 0, prevKeys = {}, anim = null;
    var fineP = fine.textContent;
    var fineE = cfg.emp.note;

    function tween(to) {
      var from = shown; shown = to;
      if (anim) cancelAnimationFrame(anim);
      if (reduce || from === to) { totalEl.textContent = eur(to); return; }
      var t0 = null, dur = 420;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        totalEl.textContent = eur(from + (to - from) * e);
        if (k < 1) anim = requestAnimationFrame(step); else totalEl.textContent = eur(to);
      }
      anim = requestAnimationFrame(step);
      setTimeout(function () { totalEl.textContent = eur(to); }, dur + 120);
    }

    function render(list, total, netInfo) {
      var keys = {};
      rows.innerHTML = "";
      list.forEach(function (r) {
        var li = doc.createElement("li");
        if (r.cls) li.className = r.cls;
        keys[r.key] = r.val;
        if (prevKeys[r.key] !== r.val && !reduce) li.classList.add("is-new");
        var s = doc.createElement("span"); s.textContent = r.label;
        var b = doc.createElement("b"); b.textContent = r.val;
        li.appendChild(s); li.appendChild(b); rows.appendChild(li);
      });
      prevKeys = keys;
      tween(total);
      if (netInfo) { net.hidden = false; netL.textContent = netInfo.label; netV.textContent = eur(netInfo.value); }
      else net.hidden = true;
    }

    function patient() {
      var v = cfg.visits.filter(function (x) { return x.id === $("input[name=visit]:checked").value; })[0];
      var list = [{ key: "v", label: v.label, val: eur(v.price) }], total = v.price;
      if (v.office) { list.push({ key: "o", label: "Toimistomaksu", val: eur(cfg.office) }); total += cfg.office; }
      var anyDraw = false;
      $$("input[name=lab]:checked").forEach(function (c) {
        var l = cfg.labs.filter(function (x) { return x.id === c.value; })[0];
        list.push({ key: "l" + l.id, label: l.label, val: eur(l.price) }); total += l.price;
        if (l.draw) anyDraw = true;
      });
      if (anyDraw) { list.push({ key: "d", label: "Näytteenottomaksu", val: eur(cfg.draw) }); total += cfg.draw; }
      kelaWrap.hidden = !(v.kela > 0);
      var n = null;
      if (v.kela > 0 && kela.checked) n = { label: "Kela-korvauksen jälkeen", value: total - v.kela };
      render(list, total, n);
    }

    function employer() {
      var e = cfg.emp, tpl = $("#zero-tpl");
      var nv = +$("#r-visits").value, nc = +$("#r-checks").value, setup = $("#c-setup").checked;
      $("#o-visits").textContent = nv; $("#o-checks").textContent = nc;
      var list = [];
      $$("li", tpl.content).forEach(function (li, i) {
        list.push({ key: "z" + i, cls: "z0", label: li.children[0].textContent, val: li.children[1].textContent.replace(" ", "\u00a0") });
      });
      var total = 0, refund = 0;
      if (nv) { var a = nv * e.visit_price; list.push({ key: "v", label: nv + " × yleislääkärikäynti", val: eur(a) }); total += a; refund += a * e.visit_kela; }
      if (nc) { var b = nc * e.check_price; list.push({ key: "c", label: nc + " × tarkastuslaboratoriopaketti", val: eur(b) }); total += b; refund += b * e.check_kela; }
      if (setup) { list.push({ key: "s", label: "Aloitus: työpaikkaselvitys ja toimintasuunnitelma", val: eur(e.setup_price) }); total += e.setup_price; refund += e.setup_price * e.setup_kela; }
      render(list, total, total ? { label: "Arvio Kelan korvauksen jälkeen", value: total - refund } : null);
      var body = "Hei,\n\nkiinnostaisi kuulla työterveyssopimuksesta. Arvio vuodelle: " + nv + " yleislääkärikäyntiä, " + nc + " tarkastuslaboratoriopakettia" + (setup ? ", uusi asiakasyritys" : "") + ".\n\nYhteystiedot:";
      $("#mail-e").setAttribute("href", "mailto:" + cfg.mail + "?subject=" + encodeURIComponent("Työterveyssopimus") + "&body=" + encodeURIComponent(body));
    }

    function setMode(m, focus) {
      mode = m;
      var isP = m === "p";
      tabP.setAttribute("aria-selected", isP); tabE.setAttribute("aria-selected", !isP);
      tabP.tabIndex = isP ? 0 : -1; tabE.tabIndex = isP ? -1 : 0;
      panP.hidden = !isP; panE.hidden = isP;
      ctaP.hidden = !isP; ctaE.hidden = isP;
      fine.textContent = isP ? fineP : fineE;
      if (!isP) kelaWrap.hidden = true;
      prevKeys = {};
      (isP ? patient : employer)();
      if (focus) (isP ? tabP : tabE).focus();
    }
    tabP.addEventListener("click", function () { setMode("p"); });
    tabE.addEventListener("click", function () { setMode("e"); });
    [tabP, tabE].forEach(function (t) {
      t.addEventListener("keydown", function (ev) {
        if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { setMode(mode === "p" ? "e" : "p", true); ev.preventDefault(); }
      });
    });
    $$("input", panP).forEach(function (i) { i.addEventListener("change", patient); });
    kela.addEventListener("change", patient);
    $$("input", panE).forEach(function (i) { i.addEventListener("input", employer); });
    var start = $("#hinta").getAttribute("data-start");
    setMode(start === "employer" ? "e" : "p");
  }
})();
