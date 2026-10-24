(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.add("js");
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
    if (open && burgerX) burgerX.focus(); else if (!open && burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1180) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("bock-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("bock-dock", "1"); }); });
  /* mobile bar hides near the footer so it never covers footer content */
  var bar = $("#bar"), ftr = $(".ftr");
  /* ...and stays out of the way while the hero's own buttons are on screen */
  var heroCta = $(".hero .btn-row");
  function barCheck() {
    if (!bar) return;
    var vh = window.innerHeight, r = heroCta && heroCta.getBoundingClientRect();
    var heroOn = !!r && r.bottom > 0 && r.top < vh;
    bar.classList.toggle("is-hidden", heroOn || (!!ftr && ftr.getBoundingClientRect().top < vh - 40));
  }

  /* reveals + sweep */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  var bars = $$("[data-bars]");
  if (reduce || !io) { rvs.forEach(activate); bars.forEach(activate); }
  else { rvs.forEach(function (el) { io.observe(el); }); bars.forEach(function (el) { io.observe(el); }); }
  function sweep() {
    var vh = window.innerHeight;
    rvs.concat(bars).forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); });
    barCheck();
  }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (li.getBoundingClientRect().top < vh * 0.85) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* model index: open on wide screens, collapsed on phones */
  $$("[data-models]").forEach(function (m) { if (window.innerWidth >= 900) m.open = true; });

  /* product filter */
  var fl = $("[data-filters]");
  if (fl) {
    var cards = $$(".cards--all .card");
    $$("[data-filter]", fl).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        $$("[data-filter]", fl).forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); if (!c.hidden) activate(c); });
      });
    });
  }

  /* reference finder: their own reference tables, filtered by Postleitzahl */
  var fd = $("[data-finder]");
  if (fd) (function () {
    var data = JSON.parse($("#refs-data").textContent), T = data.t;
    var inp = $("#plz", fd), list = $("[data-list]", fd), sum = $("[data-sum]", fd), chips = $$("[data-area]", fd);
    var SHOW = 14;
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function li(r, intl) {
      return '<li class="is-new"><span class="mono">' + esc(intl ? r.c : r.p) + "</span> " + esc(r.n) + ' <em class="tag tag--' + r.s + '">' + esc(T[r.s]) + "</em></li>";
    }
    function render(rows, intl, head, sub) {
      sum.innerHTML = esc(head) + (sub ? "<small>" + esc(sub) + "</small>" : "");
      var all = rows.map(function (r) { return li(r, intl); });
      list.innerHTML = all.slice(0, SHOW).join("");
      var old = $(".more-refs", fd); if (old) old.remove();
      if (all.length > SHOW) {
        var b = d.createElement("button"); b.type = "button"; b.className = "btn btn--ghost more-refs";
        b.textContent = T.more + " (+" + (all.length - SHOW) + ")";
        b.addEventListener("click", function () { list.innerHTML = all.join(""); b.remove(); });
        list.parentNode.appendChild(b);
      }
    }
    function setChip(a) { chips.forEach(function (c) { var on = c.getAttribute("data-area") === a; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); }); }
    function byArea(dg, plz) {
      var rows = data.de.filter(function (r) { return r.p.charAt(0) === dg; });
      if (plz && plz.length >= 2) {
        var n = Number((plz + "00000").slice(0, 5));
        rows.sort(function (a, b) { return Math.abs(Number(a.p) - n) - Math.abs(Number(b.p) - n); });
        var dd = plz.slice(0, 2), near = rows.filter(function (r) { return r.p.slice(0, 2) === dd; }).length;
        render(rows, false, T.fmt_area.replace("{n}", rows.length).replace("{d}", dg), near ? T.fmt_near.replace("{n}", near).replace("{dd}", dd) : "");
      } else {
        rows.sort(function (a, b) { return a.p < b.p ? -1 : 1; });
        render(rows, false, rows.length ? T.fmt_area.replace("{n}", rows.length).replace("{d}", dg) : T.none, "");
      }
      setChip(dg);
    }
    inp.addEventListener("input", function () {
      var v = inp.value.replace(/\D/g, "").slice(0, 5); if (v !== inp.value) inp.value = v;
      if (!v) { sum.textContent = T.hint; list.innerHTML = ""; setChip(""); var o = $(".more-refs", fd); if (o) o.remove(); return; }
      byArea(v.charAt(0), v);
    });
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", "false");
      c.addEventListener("click", function () {
        var a = c.getAttribute("data-area"); inp.value = "";
        if (a === "int") { render(data.intl.slice().sort(function (x, y) { return x.c < y.c ? -1 : 1; }), true, T.intl + ": " + data.intl.length, ""); setChip("int"); }
        else byArea(a, "");
      });
    });
    byArea("3", ""); /* start on their own PLZ area (Enger, 3xxxx) */
  })();

  /* lightbox over their gallery photos */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") (function () {
    var im = $("#lb-img"), cap = $("#lb-cap"), group = [], i = 0;
    function show() { var a = group[i]; im.src = a.getAttribute("href"); im.alt = a.getAttribute("data-cap") || ""; cap.textContent = (a.getAttribute("data-cap") || "") + "  " + (i + 1) + " / " + group.length; }
    d.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-lb-item]");
      if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      var scope = a.closest(".blk, .post, .messe__b, .plans, .gal") || d;
      group = $$("[data-lb-item]", scope); i = Math.max(0, group.indexOf(a));
      show(); lb.showModal();
    });
    function step(n) { i = (i + n + group.length) % group.length; show(); }
    $$("[data-lb]", lb).forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-lb"); if (k === "x") lb.close(); else step(k === "n" ? 1 : -1); }); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
    lb.addEventListener("close", function () { im.removeAttribute("src"); });
  })();
})();
