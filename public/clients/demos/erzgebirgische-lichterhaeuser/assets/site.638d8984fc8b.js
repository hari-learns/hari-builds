(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header solid on scroll */
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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); setList(false); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1120) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("elh-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("elh-dock", "1"); }); });

  /* reveals + a sweep that also reveals anything already scrolled past */
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

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.85) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* next date, computed from their own rules: 3rd October weekend (Sat+Sun) and Buß- und Bettag (Wednesday before 23 Nov) */
  var MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var DAY = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  function oct3(y) { var dt = new Date(y, 9, 1); var off = (6 - dt.getDay() + 7) % 7; return new Date(y, 9, 1 + off + 14); }
  function busstag(y) { var dt = new Date(y, 10, 22); var back = (dt.getDay() - 3 + 7) % 7; return new Date(y, 10, 22 - back); }
  function occ(rule, y) { if (rule === "oct3") { var s = oct3(y); return { start: s, end: new Date(y, 9, s.getDate() + 1, 17) }; } var b = busstag(y); return { start: b, end: new Date(y, 10, b.getDate(), 17) }; }
  function fmt(o, rule) {
    var s = o.start;
    if (rule === "oct3") return "Sa " + s.getDate() + ". & So " + (s.getDate() + 1) + ". " + MON[9] + " " + s.getFullYear();
    return DAY[s.getDay()] + ", " + s.getDate() + ". " + MON[s.getMonth()] + " " + s.getFullYear();
  }
  var evEl = $("#ev-data");
  if (evEl) {
    var evs = JSON.parse(evEl.textContent), now = new Date(), y = now.getFullYear(), best = null;
    evs.forEach(function (ev) {
      var o = occ(ev.rule, y); if (o.end < now) o = occ(ev.rule, y + 1);
      ev.o = o; if (!best || o.start < best.o.start) best = ev;
    });
    $$("[data-next]").forEach(function (box) {
      $("[data-next-date]", box).textContent = fmt(best.o, best.rule) + " · 10–17 Uhr";
      $("[data-next-h]", box).textContent = best.h;
      var n = $("[data-next-note]", box); if (n) n.hidden = false;
    });
    $$("[data-when]").forEach(function (p) {
      var ev = evs.filter(function (x) { return x.rule === p.getAttribute("data-when"); })[0];
      if (ev) p.textContent = fmt(ev.o, ev.rule) + " · 10 bis 17 Uhr";
    });
  }

  /* Sortiment: category filter */
  var chips = $$("[data-filter]");
  function filter(cat, scroll) {
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === cat ? "true" : "false"); });
    $$("[data-group]").forEach(function (g) { g.hidden = !(cat === "all" || g.getAttribute("data-group") === cat); });
    sweep();
    if (scroll) { var first = $(".groups"); if (first && first.getBoundingClientRect().top < 0) first.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { filter(c.getAttribute("data-filter"), true); safe(function () { history.replaceState(null, "", c.getAttribute("data-filter") === "all" ? location.pathname : "#" + c.getAttribute("data-filter")); }); }); });
  if (chips.length && location.hash) { var h = location.hash.slice(1); if ($('[data-group="' + h + '"]')) filter(h, false); }

  /* Sortiment: Anfrageliste -> prefilled e-mail */
  var listEl = $("#mlist"), listData = $("#list-data");
  function setList(open) { if (!listEl) return; listEl.classList.toggle("is-open", open); }
  if (listEl && listData) (function () {
    var cfg = JSON.parse(listData.textContent), KEY = "elh-list";
    var picked = safe(function () { return JSON.parse(localStorage.getItem(KEY) || "[]"); }) || [];
    var cards = $$(".pc");
    function save() { safe(function () { localStorage.setItem(KEY, JSON.stringify(picked)); }); }
    function render() {
      var ul = $("[data-items]", listEl); ul.innerHTML = "";
      picked.forEach(function (p, i) {
        var li = d.createElement("li"), sp = d.createElement("span"), b = d.createElement("b"), x = d.createElement("button");
        b.textContent = cfg.nr + " " + p.nr; sp.appendChild(b); sp.appendChild(d.createTextNode(p.name));
        x.type = "button"; x.setAttribute("aria-label", "Entfernen: " + p.name); x.textContent = "×";
        x.addEventListener("click", function () { picked.splice(i, 1); save(); render(); });
        li.appendChild(sp); li.appendChild(x); ul.appendChild(li);
      });
      $$("[data-count]").forEach(function (c) { c.textContent = picked.length; });
      listEl.classList.toggle("is-empty", picked.length === 0);
      $("[data-empty]", listEl).hidden = picked.length > 0;
      cards.forEach(function (c) {
        var on = picked.some(function (p) { return p.nr === c.getAttribute("data-nr"); });
        c.classList.toggle("is-on", on); $("[data-add]", c).setAttribute("aria-pressed", on ? "true" : "false");
      });
      var body = cfg.intro + picked.map(function (p) { return "- " + cfg.nr + " " + p.nr + " · " + p.name; }).join("\n") + "\n" + cfg.outro;
      $("[data-send]", listEl).href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject) + "&body=" + encodeURIComponent(body);
    }
    cards.forEach(function (c) {
      $("[data-add]", c).addEventListener("click", function () {
        var nr = c.getAttribute("data-nr"), i = -1;
        picked.forEach(function (p, k) { if (p.nr === nr) i = k; });
        if (i >= 0) picked.splice(i, 1); else picked.push({ nr: nr, name: c.getAttribute("data-name") });
        save(); render();
      });
    });
    $("[data-clear]", listEl).addEventListener("click", function () { picked = []; save(); render(); });
    $$("[data-list-open]").forEach(function (b) { b.addEventListener("click", function () { if (window.innerWidth >= 1100) listEl.scrollIntoView({ behavior: "smooth" }); else setList(true); }); });
    $$("[data-list-close]").forEach(function (b) { b.addEventListener("click", function () { setList(false); }); });
    render();
  })();

  /* lightbox for product photos */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $("[data-lb-img]", lb), lbCap = $("[data-lb-cap]", lb);
    $$("[data-zoom]").forEach(function (b) {
      b.addEventListener("click", function () {
        var im = $("img", b);
        lbImg.src = b.getAttribute("data-zoom"); lbImg.alt = im ? im.alt : "";
        if (im) { lbImg.width = im.width; lbImg.height = im.height; lbImg.setAttribute("width", im.getAttribute("width")); lbImg.setAttribute("height", im.getAttribute("height")); }
        lbCap.textContent = b.getAttribute("data-cap"); lb.showModal();
      });
    });
    $$("[data-lb-close]", lb).forEach(function (b) { b.addEventListener("click", function () { lb.close(); }); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* contact form -> prefilled e-mail (static concept, no backend) */
  var cf = $("#cform"), cfd = $("#cform-data");
  if (cf && cfd) {
    var c = JSON.parse(cfd.textContent);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (n) { return (cf.elements[n] && cf.elements[n].value || "").trim(); };
      var body = v("msg") + "\n\n" + v("name") + (v("email") ? "\n" + v("email") : "");
      location.href = "mailto:" + c.to + "?subject=" + encodeURIComponent(v("subject") || c.subject) + "&body=" + encodeURIComponent(body);
    });
  }
})();
