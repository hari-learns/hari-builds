/* Tom Sturgis Pretzels concept: reveals, drawer, shop filter, order planner. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var me = document.currentScript;
  var BASE = me ? me.src.replace(location.origin, "").replace(/\/assets\/site\.[^/]*$/, "") : "";

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) { rv.forEach(function (n) { n.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
  }

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) bx.focus(); else burger.focus();
  }
  if (burger) { burger.addEventListener("click", function () { setDrawer(true); }); bx.addEventListener("click", function () { setDrawer(false); }); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("open")) setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1060 && drawer && drawer.classList.contains("open")) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("tsp-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("tsp-dock", "1"); }); });

  /* sticky bar waits until the hero is out of view on the home page */
  var bar = $(".bar"), heroEl = $(".hero");
  if (bar && heroEl && "IntersectionObserver" in window) {
    bar.classList.add("off");
    new IntersectionObserver(function (es) { bar.classList.toggle("off", es[0].isIntersecting); }, { threshold: 0 }).observe(heroEl);
  }

  /* open now (Eastern time) */
  $$("[data-open]").forEach(function (el) {
    var parts = safe(function () {
      var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var o = {}; f.forEach(function (p) { o[p.type] = p.value; }); return o;
    });
    if (!parts) return;
    var h = parseInt(parts.hour, 10) % 24, m = parseInt(parts.minute, 10), mins = h * 60 + m, wd = parts.weekday;
    var open = wd !== "Sun" && mins >= 510 && mins < 1050;
    el.setAttribute("data-s", open ? "open" : "closed");
    el.textContent = open ? "Store open now, until 5:30 pm Eastern" : "Store closed now (Mon–Sat, 8:30 am–5:30 pm Eastern)";
  });

  /* video facade: loads YouTube only on tap */
  $$(".tour").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-video");
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      f.title = "Tom Sturgis Pretzels In Store 2018";
      f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
      b.innerHTML = ""; b.appendChild(f); b.style.cursor = "default";
    }, { once: true });
  });

  /* shop filter */
  var grid = $("#pgrid");
  if (grid) {
    var cards = $$(".pcard", grid), q = $("#q"), sortsel = $("#sortsel"), count = $("#fcount"), none = $("#none"), chips = $$("#shopchips .chip");
    var active = "all";
    function apply() {
      var term = (q.value || "").trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var ok = true, d = c.dataset;
        if (active.indexOf("k:") === 0) ok = active.slice(2).split(",").indexOf(d.k) > -1;
        else if (active === "ko") ok = d.ko === "1";
        else if (active === "lo") ok = d.lo === "1";
        else if (active === "nc") ok = d.c === "0";
        if (ok && term) ok = term.split(/\s+/).every(function (w) { return d.n.indexOf(w) > -1; });
        c.hidden = !ok; if (ok) n++;
      });
      count.textContent = n + (n === 1 ? " item" : " items");
      none.hidden = n !== 0;
    }
    function sortCards() {
      var v = sortsel.value, arr = cards.slice();
      arr.sort(function (a, b) {
        if (v === "low") return a.dataset.p - b.dataset.p;
        if (v === "high") return b.dataset.p - a.dataset.p;
        return a.dataset.n < b.dataset.n ? -1 : 1;
      });
      arr.forEach(function (c) { grid.appendChild(c); });
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { active = c.getAttribute("data-f"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); apply(); }); });
    q.addEventListener("input", apply); sortsel.addEventListener("change", function () { sortCards(); apply(); });
  }

  /* order planner */
  var planners = $$("[data-planner]");
  if (!planners.length) return;
  function money(v) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function money0(v) { return "$" + Math.round(v).toLocaleString("en-US"); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mailto(to, subject, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }

  fetch(BASE + "/assets/planner-data.json").then(function (r) { return r.json(); }).then(function (D) {
    planners.forEach(function (root) { initPlanner(root, D); });
  }).catch(function () {
    planners.forEach(function (root) { var o = $("[data-out]", root); if (o) o.innerHTML = '<p class="pl-empty">The planner could not load. Call customer service or <a href="' + BASE + '/shop/">browse the shop</a>.</p>'; });
  });

  function tierFor(D, n, sub) {
    var best = { pct: 0, label: "" };
    D.tiers.forEach(function (t) {
      var ok = t.rule === "items" ? n >= t.at : sub >= t.at;
      if (ok && t.pct > best.pct) best = { pct: t.pct, label: t.label };
    });
    return best;
  }

  function initPlanner(root, D) {
    var limit = parseInt(root.getAttribute("data-limit"), 10) || 6;
    var gifts = D.items.filter(function (i) { return i.g === 1; });
    var cases = D.items.filter(function (i) { return i.k === "case"; });
    var S = { n: 25, b: 50, kind: "any", sel: null, showAll: false, picked: {} };
    var nIn = $("[name=n]", root), bIn = $("[name=b]", root), sum = $("[data-sum]", root), out = $("[data-out]", root);
    var month = new Date().getMonth(); // 0=Jan; chocolate ships Oct-Mar
    var chocOk = month >= 9 || month <= 2;
    if (!chocOk) $("[name=nochoc]", root).checked = true;

    /* tabs */
    var tabs = $$(".pl-tab", root), panels = $$("[data-panel]", root);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
        panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== t.getAttribute("data-tab"); });
      });
    });
    if (/wholesale/.test(location.pathname)) tabs[1].click();

    function stepper(panel) {
      $$("[data-step]", panel).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var inp = $("input", btn.parentNode), v = (parseInt(inp.value, 10) || 1) + parseInt(btn.getAttribute("data-step"), 10);
          inp.value = Math.max(parseInt(inp.min, 10) || 1, Math.min(parseInt(inp.max, 10) || 9999, v));
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        });
      });
    }
    panels.forEach(stepper);

    /* ---- gifts ---- */
    function readGifts() {
      S.n = Math.max(1, Math.min(5000, parseInt(nIn.value, 10) || 1));
      S.b = Math.max(1, parseFloat(bIn.value) || 0);
    }
    function matches() {
      var kosher = $("[name=kosher]", root).checked, low = $("[name=low]", root).checked, nochoc = $("[name=nochoc]", root).checked;
      return gifts.filter(function (i) {
        if (i.p > S.b) return false;
        if (S.kind === "tin" && i.k !== "tin") return false;
        if (S.kind === "tub" && i.k !== "tub") return false;
        if (S.kind === "totebox" && i.k !== "tote" && i.k !== "box") return false;
        if (kosher && !i.ko) return false;
        if (low && !i.lo) return false;
        if (nochoc && i.c) return false;
        return true;
      }).sort(function (a, b) { return b.p - a.p; });
    }
    function tagsFor(i) {
      var t = "";
      if (i.c) t += '<span class="tag tag--choc">Ships Oct 1 – Mar 31</span>';
      if (i.ko) t += '<span class="tag">Kosher OU-D</span>';
      if (i.lo) t += '<span class="tag">Low sodium</span>';
      return t;
    }
    function renderGifts() {
      readGifts();
      var list = matches();
      if (!list.length) {
        sum.hidden = true;
        out.innerHTML = '<p class="pl-empty">Nothing in the catalogue fits ' + money0(S.b) + ' with those needs. Try a higher budget or fewer filters, or call ' + esc(D.phone) + ' and ask about a custom gift.</p>';
        return;
      }
      var cur = list.filter(function (i) { return i.s === S.sel; })[0];
      if (!cur) { cur = list[0]; S.sel = cur.s; }
      var sub = S.n * cur.p, t = tierFor(D, S.n, sub), save = sub * t.pct / 100, total = sub - save;
      var ladder = [0].concat(D.tiers.map(function (x) { return x.pct; }));
      var ladh = ladder.map(function (p, ix) { return '<span class="' + (p === t.pct ? "on" : "") + '" style="height:' + (14 + ix * 12) + '%"><i>' + p + '%</i></span>'; }).join("");
      var hint = "";
      if (t.pct < 6) {
        var next = null;
        D.tiers.forEach(function (x) {
          if (x.pct <= t.pct) return;
          if (x.rule === "items" && S.n < x.at) { if (!next || x.pct < next.pct) next = { pct: x.pct, msg: "<b>" + (x.at - S.n) + " more gift" + (x.at - S.n === 1 ? "" : "s") + "</b> reaches " + x.pct + "% off." }; }
          if (x.rule === "spend" && sub < x.at) { var need = x.at - sub, more = Math.ceil(need / cur.p); if (!next || x.pct < next.pct) next = { pct: x.pct, msg: "<b>" + money0(need) + " more</b> (about " + more + " more gift" + (more === 1 ? "" : "s") + ") reaches " + x.pct + "% off." }; }
        });
        if (next) hint = next.msg;
      }
      if (S.n >= D.custom) hint += (hint ? " " : "") + "At " + D.custom + "+ units the bakery can also make <b>customised gifts</b> with your insert card.";
      else if (S.n >= 50) hint += (hint ? " " : "") + "From " + D.custom + " units the bakery offers <b>customised gifts</b> with your insert card.";
      sum.hidden = false;
      sum.innerHTML = '<dl class="pl-sum__grid"><div><dt>Your gift</dt><dd style="font:700 1rem/1.3 var(--sans)">' + esc(cur.n) + '<em>' + money(cur.p) + ' each, shipping included</em></dd></div>' +
        '<div><dt>Gifts</dt><dd>' + S.n + '<em>' + money(sub) + ' at list price</em></dd></div>' +
        '<div><dt>Quantity discount</dt><dd>' + (t.pct ? t.pct + '%' : 'None yet') + '<em>' + (t.pct ? esc(t.label) + ', saves ' + money(save) : 'starts at 15 items') + '</em></dd></div>' +
        '<div><dt>Estimated total</dt><dd>' + money(total) + '<em>' + money(total / S.n) + ' per gift</em></dd></div></dl>' +
        '<div class="pl-ladder" aria-hidden="true">' + ladh + '</div>' +
        (hint ? '<p class="pl-hint">' + hint + '</p>' : '') +
        '<div class="act"><a class="btn" style="background:var(--gold);border-color:var(--gold);color:var(--ink)" href="' + mailto(D.csr, "Corporate order request: " + S.n + " x " + cur.n,
          "Hello,\n\nI would like a quote for:\n" + S.n + " x " + cur.n + " (list " + money(cur.p) + " each)\nEstimated total with " + (t.pct || 0) + "% quantity discount: " + money(total) + "\n\nDelivery date needed: \nNumber of delivery addresses: \nCompany name: \nPhone: \n\nThank you") + '">Send this request to the bakery</a>' +
        '<a class="btn btn--ghost" href="tel:+18007773314">Call ' + esc(D.phone) + '</a></div>';
      var shown = S.showAll ? list : list.slice(0, limit);
      var h = '<h3>' + list.length + ' gift' + (list.length === 1 ? "" : "s") + ' fit ' + money0(S.b) + ' or less</h3><div class="pl-grid' + (limit <= 3 ? " pl-grid--3" : "") + '">';
      shown.forEach(function (i) {
        var s2 = S.n * i.p, t2 = tierFor(D, S.n, s2), tot = s2 * (1 - t2.pct / 100);
        h += '<div class="pl-card"><div class="pl-card__img"><img src="' + i.i + '" width="' + i.iw + '" height="' + i.ih + '" alt="' + esc(i.n) + '" loading="lazy"></div><div>' +
          '<h4><a href="' + i.u + '">' + esc(i.n) + '</a></h4><p class="meta">' + money(i.p) + (i.nw ? " &middot; " + esc(i.nw) : "") + '</p><p>' + tagsFor(i) + '</p>' +
          '<p class="tot">' + S.n + ' gifts: <b>' + money(tot) + '</b>' + (t2.pct ? ' after ' + t2.pct + '% off' : '') + '</p>' +
          '<div class="pl-card__act"><button class="chip chip--sq" type="button" data-pick="' + i.s + '" aria-pressed="' + (i.s === S.sel ? "true" : "false") + '">' + (i.s === S.sel ? "Selected" : "Use this one") + '</button></div></div></div>';
      });
      h += '</div>';
      if (list.length > shown.length) h += '<p><button class="btn btn--ghost btn--sm" type="button" data-more>Show all ' + list.length + ' matches</button></p>';
      out.innerHTML = h;
    }
    out.addEventListener("click", function (e) {
      var p = e.target.closest("[data-pick]"), m = e.target.closest("[data-more]");
      if (p) { S.sel = p.getAttribute("data-pick"); renderGifts(); var s = $("[data-sum]", root); if (s) s.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }
      if (m) { S.showAll = true; renderGifts(); }
    });
    $$("input", $("[data-panel=gifts]", root)).forEach(function (inp) { inp.addEventListener("input", function () { S.showAll = false; if (inp === bIn) syncPresets(); renderGifts(); }); inp.addEventListener("change", function () { renderGifts(); }); });
    var presets = $$("[data-presets] .chip", root);
    function syncPresets() { presets.forEach(function (c) { c.setAttribute("aria-pressed", String(parseFloat(c.getAttribute("data-b")) === parseFloat(bIn.value))); }); }
    presets.forEach(function (c) { c.addEventListener("click", function () { bIn.value = c.getAttribute("data-b"); S.sel = null; syncPresets(); renderGifts(); }); });
    $$("[data-kinds] .chip", root).forEach(function (c) {
      c.addEventListener("click", function () { S.kind = c.getAttribute("data-kind"); S.sel = null; S.showAll = false; $$("[data-kinds] .chip", root).forEach(function (x) { x.setAttribute("aria-pressed", String(x === c)); }); renderGifts(); });
    });
    syncPresets(); renderGifts();

    /* ---- cases ---- */
    var cOut = $("[data-cases]", root), req = $("[data-req]", root), cIn = $("[name=cn]", root), sSel = $("[name=sort]", root);
    function perBag(i) { return i.o ? i.p / 12 : null; }
    function perOz(i) { return i.o ? i.p / (12 * i.o) : null; }
    function renderCases() {
      var n = Math.max(1, Math.min(500, parseInt(cIn.value, 10) || 1)), v = sSel.value;
      var arr = cases.slice().sort(function (a, b) {
        if (v === "name") return a.n < b.n ? -1 : 1;
        var x = v === "oz" ? perOz(a) : perBag(a), y = v === "oz" ? perOz(b) : perBag(b);
        return (x === null ? 1e9 : x) - (y === null ? 1e9 : y);
      });
      cOut.innerHTML = arr.map(function (i) {
        var pb = perBag(i), po = perOz(i);
        return '<label class="pl-case"><input type="checkbox" data-case="' + i.s + '"' + (S.picked[i.s] ? " checked" : "") + '><img src="' + i.i + '" width="76" height="76" alt="" loading="lazy"><div><h4>' + esc(i.n) + '</h4>' +
          '<p><b>' + money(i.p) + '</b> per case' + (pb ? ' &middot; ' + money(pb) + ' per bag &middot; ' + (po * 100).toFixed(1) + '&cent; per oz' : ' &middot; choose 2 pretzels') + '</p><p>' + n + ' case' + (n === 1 ? "" : "s") + ': <b>' + money(i.p * n) + '</b>' + (i.o ? ' (' + n * 12 + ' bags)' : '') + '</p></div></label>';
      }).join("");
      updReq(n);
    }
    function updReq(n) {
      var keys = Object.keys(S.picked).filter(function (k) { return S.picked[k]; });
      if (!keys.length) { req.hidden = true; return; }
      var tot = 0, lines = keys.map(function (k) { var i = cases.filter(function (c) { return c.s === k; })[0]; tot += i.p * n; return n + " cases x " + i.n + " (web price " + money(i.p) + " per case)"; });
      req.hidden = false;
      req.innerHTML = '<p><b>' + keys.length + ' picked</b> &middot; ' + n + ' cases each &middot; ' + money(tot) + ' at web prices</p><a class="btn btn--sm" href="' + mailto(D.sales, "Wholesale pricing request: " + keys.length + " pretzel cases", "Hello,\n\nPlease send wholesale pricing for:\n" + lines.join("\n") + "\n\nBusiness name: \nDelivery address: \nPhone: \n\nThank you") + '">Ask for wholesale pricing</a>';
    }
    cOut.addEventListener("change", function (e) { var c = e.target.closest("[data-case]"); if (c) { S.picked[c.getAttribute("data-case")] = c.checked; updReq(Math.max(1, parseInt(cIn.value, 10) || 1)); } });
    cIn.addEventListener("input", renderCases); sSel.addEventListener("change", renderCases);
    renderCases();
  }
})();
