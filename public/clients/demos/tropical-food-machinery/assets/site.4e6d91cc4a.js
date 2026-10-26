/* Tropical Food Machinery concept: vanilla JS, every feature existence-guarded. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("tfm-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("tfm-dock", "1"); }); });

  if (dock) {
    var hideDock = function () { if (window.scrollY > 140) { dock.hidden = true; window.removeEventListener("scroll", hideDock); } };
    window.addEventListener("scroll", hideDock, { passive: true });
  }
  /* home: the sticky bar appears once the hero has been passed (the hero carries the same action) */
  var hero = $(".hero");
  if (hero && doc.body.classList.contains("is-home")) {
    var barOn = function () { doc.body.classList.toggle("bar-on", hero.getBoundingClientRect().bottom < 60); };
    window.addEventListener("scroll", barOn, { passive: true }); barOn();
  }

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && doc.activeElement === burgerX) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* mega menu */
  var nb = $(".nav__b"), mega = $("#mega");
  function setMega(open) {
    if (!nb || !mega) return;
    mega.hidden = !open;
    nb.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (nb && mega) {
    nb.addEventListener("click", function (e) { e.stopPropagation(); setMega(mega.hidden); });
    doc.addEventListener("click", function (e) { if (!mega.hidden && !mega.contains(e.target)) setMega(false); });
    mega.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) setMega(false); });
  }
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setDrawer(false); setMega(false); }
  });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1060) setDrawer(false); else setMega(false); });

  /* filters: chips hide cards by their own tags (data-tag) or machine families (data-fam) */
  $$(".fchips[data-filter]").forEach(function (box) {
    var target = doc.getElementById(box.getAttribute("data-filter"));
    if (!target) return;
    $$(".chip", box).forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-f");
        $$(".chip", box).forEach(function (c) { var on = c === chip; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
        $$(".card", target).forEach(function (card) {
          var tags = (card.getAttribute("data-tag") || "").split(/\s+/);
          var map = { tropical: ["tropical", "Frutta-Tropicale"], temperate: ["temperate", "Frutta-Climi-Temperati"], tomato: ["tomato", "Pomodoro"] };
          var ok = !f || (map[f] || [f]).some(function (t) { return tags.indexOf(t) > -1; });
          card.classList.toggle("is-hidden", !ok);
        });
        $$("h2.h2--sub", target).forEach(function (h) {
          var grid = h.nextElementSibling;
          var any = grid && $$(".card:not(.is-hidden)", grid).length;
          h.classList.toggle("is-hidden", !any); if (grid) grid.classList.toggle("is-hidden", !any);
        });
      });
    });
  });
  $$(".fchips[data-filter-fam]").forEach(function (box) {
    var target = doc.getElementById(box.getAttribute("data-filter-fam"));
    if (!target) return;
    function apply(f) {
      $$(".chip", box).forEach(function (c) { var on = c.getAttribute("data-f") === f; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$(".fam", target).forEach(function (s) { s.classList.toggle("is-hidden", !!f && s.getAttribute("data-fam") !== f); });
    }
    $$(".chip", box).forEach(function (chip) { chip.addEventListener("click", function () { apply(chip.getAttribute("data-f")); }); });
    if (location.hash && $(location.hash, target)) { /* deep link to a family keeps all visible */ }
  });

  /* fairs: mark past / now / next from their dates */
  var fairs = $$(".fair");
  if (fairs.length) {
    var now = new Date(); var t = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var lab = { it: { now: "In corso", next: "Prossima", past: "Conclusa" }, en: { now: "Now on", next: "Next", past: "Done" } }[root.lang] || { now: "Now on", next: "Next", past: "Done" };
    var nextSet = false;
    fairs.forEach(function (f) {
      var s = +f.getAttribute("data-s").replace(/-/g, ""), e = +f.getAttribute("data-e").replace(/-/g, "");
      var st = $(".fair__st", f), k = "";
      if (t >= s && t <= e) k = "now"; else if (t > e) k = "past"; else if (!nextSet) { k = "next"; nextSet = true; }
      if (k) { f.classList.add("is-" + k); if (st) st.textContent = lab[k]; }
    });
  }

  /* reveal on scroll */
  var rvSel = ".card, .post, .svc, .fair, .step, .ccard, .dl, .nums li, .clients li, .facts li, .cap__row, .about__row, .gal__i, .tpanel";
  if (!reduce && "IntersectionObserver" in window) {
    var groups = new Map();
    $$(rvSel).forEach(function (el) {
      if (el.closest(".tool__app")) return;
      var p = el.parentElement, n = groups.get(p) || 0; groups.set(p, n + 1);
      el.classList.add("rv"); el.style.setProperty("--rd", Math.min(n, 5) * 60 + "ms");
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    $$(".rv").forEach(function (el) { io.observe(el); });
    var sweep = function () {
      var vh = window.innerHeight;
      $$(".rv:not(.is-in)").forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.96) el.classList.add("is-in"); });
    };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }
  /* capacity chart bars */
  $$(".cap").forEach(function (c) {
    if (reduce || !("IntersectionObserver" in window)) { c.classList.add("is-in"); return; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { c.classList.add("is-in"); o.disconnect(); } }); }, { threshold: 0.15 });
    o.observe(c);
    setTimeout(function () { if (c.getBoundingClientRect().top < window.innerHeight) c.classList.add("is-in"); }, 400);
  });

  /* hero: slow parallax on the real photo */
  var heroImg = $(".hero__img");
  if (heroImg && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.translate = "0 " + (y * 0.05).toFixed(1) + "px";
        ticking = false;
      });
    }, { passive: true });
  }

  /* story: pinned photo follows the step in view (desktop), stacked on phones */
  var steps = $$(".story__s"), figs = $$(".story__f");
  if (steps.length && figs.length && "IntersectionObserver" in window) {
    var setStep = function (i) {
      steps.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      figs.forEach(function (f, n) { f.classList.toggle("is-on", n === i); });
    };
    setStep(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) setStep(+en.target.getAttribute("data-i")); });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* request form: builds a mailto draft; accepts international names and numbers */
  var form = $("#rform");
  if (form) {
    var qs = new URLSearchParams(location.search), s = qs.get("s");
    var subj = $("#subject");
    if (s && subj) subj.value = s.replace(/-/g, " ");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["name", "email", "subject"].forEach(function (id) {
        var el = $("#" + id); var bad = !el.value.trim() || (id === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(el.value.trim()));
        el.setAttribute("aria-invalid", bad ? "true" : "false"); if (bad) ok = false;
      });
      if (!ok) { var f = $("[aria-invalid=true]", form); if (f) f.focus(); return; }
      var v = function (id) { return ($("#" + id).value || "").trim(); };
      var body = v("msg") + "\n\n---\n" + [v("name"), v("company"), [v("city"), v("country")].filter(Boolean).join(", "), v("email"), v("phone")].filter(Boolean).join("\n");
      var to = form.getAttribute("data-to");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent(v("subject")) + "&body=" + encodeURIComponent(body);
      var ok2 = $("#fok"); if (ok2) { ok2.hidden = false; $("#fok-t").textContent = form.getAttribute("data-ok") + " " + to; var fc = $("#fcopy"); if (fc) fc.onclick = function () { var txt = "To: " + to + "\n" + v("subject") + "\n\n" + body; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); }; }
    });
  }

  /* ---------------------------------------------------------------- signature tool */
  var dataEl = $("#tool-data"), app = $("#tool-app");
  if (dataEl && app) {
    var D = JSON.parse(dataEl.textContent), U = D.ui;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var fmt = function (n) { var r = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10; return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, D.lang === "it" ? "." : ",").replace(/(\d)\.(\d)$/, D.lang === "it" ? "$1,$2" : "$1.$2"); };
    var tagMap = { tropical: "Frutta-Tropicale", temperate: "Frutta-Climi-Temperati", tomato: "Pomodoro" };
    var groupLab = D.lang === "it" ? { tropical: "Frutta tropicale", temperate: "Frutta climi temperati", tomato: "Pomodoro" } : { tropical: "Tropical fruit", temperate: "Temperate fruit", tomato: "Tomato" };
    var state = { fruit: "mango", cap: 5000, unit: "kgh", prod: "puree", pack: null };
    var qp = new URLSearchParams(location.search);
    if (qp.get("f")) state.fruit = qp.get("f");
    if (qp.get("c") && +qp.get("c") > 0) state.cap = +qp.get("c");
    if (qp.get("u")) state.unit = qp.get("u");
    if (qp.get("p")) { var pm = { jam: "jam", puree: "puree", juice: "juice", conc: "conc", pieces: "pieces", drink: "drink", tomato: "tomato" }; state.prod = pm[qp.get("p")] || null; }

    var unitLab = { kgh: U.kgh, th: U.th, tday: U.tday };
    var capKg = function () { return state.unit === "kgh" ? state.cap : state.unit === "th" ? state.cap * 1000 : state.cap * 1000 / 24; };
    var lineKg = function (L) { return L.unit === "tday" ? { min: L.min * 1000 / 24, max: L.max * 1000 / 24 } : { min: L.min, max: L.max }; };
    var fruit = function () { return D.fruits.filter(function (f) { return f.id === state.fruit; })[0]; };

    function candidates(f) {
      var out = [], seen = {};
      var add = function (id) { if (id && D.lines[id] && !seen[id]) { seen[id] = 1; out.push(id); } };
      add(f.line);
      if (f.mf) { add("mf1000"); add("multi"); }
      if (f.mini) add("mini200");
      return out;
    }
    function evalLines(f, kg) {
      return candidates(f).map(function (id, i) {
        var L = D.lines[id], r = lineKg(L);
        var st = kg >= r.min && kg <= r.max ? "in" : kg < r.min ? "below" : "above";
        var dist = st === "in" ? 0 : Math.abs(Math.log(kg / (st === "below" ? r.min : r.max)));
        return { id: id, L: L, r: r, st: st, dist: dist, pri: i };
      }).sort(function (a, b) { return (a.st === "in" ? 0 : 1) - (b.st === "in" ? 0 : 1) || a.dist - b.dist || a.pri - b.pri; });
    }
    var products = function () {
      var f = fruit();
      return D.products.filter(function (p) { return f && f.group === "tomato" ? p.id === "tomato" : p.id !== "tomato"; });
    };

    function render() {
      var f = fruit(); var h = "";
      // controls
      var groups = ["tropical", "temperate", "tomato"], fh = "";
      groups.forEach(function (g) {
        var items = D.fruits.filter(function (x) { return x.group === g; });
        fh += '<div class="tgroup"><span>' + esc(groupLab[g]) + '</span><div class="tchips">' + items.map(function (x) {
          return '<button type="button" class="chip' + (state.fruit === x.id ? " is-on" : "") + '" data-fruit="' + x.id + '" aria-pressed="' + (state.fruit === x.id) + '">' + esc(x.label) + "</button>";
        }).join("") + "</div></div>";
      });
      var ph = "";
      if (f) {
        ph = '<div class="tchips">' + products().map(function (p) {
          return '<button type="button" class="chip' + (state.prod === p.id ? " is-on" : "") + '" data-prod="' + p.id + '" aria-pressed="' + (state.prod === p.id) + '">' + esc(p.label) + "</button>";
        }).join("") + "</div>";
      }
      var kh = "";
      kh = '<div class="tchips">' + '<button type="button" class="chip' + (!state.pack ? " is-on" : "") + '" data-pack="" aria-pressed="' + (!state.pack) + '">' + esc(U.t_none) + "</button>" + D.packs.map(function (p) {
        return '<button type="button" class="chip' + (state.pack === p.id ? " is-on" : "") + '" data-pack="' + p.id + '" aria-pressed="' + (state.pack === p.id) + '">' + esc(p.label) + "</button>";
      }).join("") + "</div>";
      var sl = Math.round((Math.log(Math.max(50, capKg())) - Math.log(50)) / (Math.log(100000) - Math.log(50)) * 1000);
      var ctl = '<div class="tool__ctl tctl">' +
        '<div><h3>' + esc(U.t_fruit) + "</h3>" + fh + "</div>" +
        '<div><h3>' + esc(U.t_cap) + '</h3><div class="tcap"><div class="tcap__row"><input class="tin" id="tcap" type="text" inputmode="decimal" autocomplete="off" aria-label="' + esc(U.t_cap) + '" value="' + esc(state.cap) + '"><div class="tseg" role="group" aria-label="' + esc(U.t_unit) + '">' +
        ["kgh", "th", "tday"].map(function (u) { return '<button type="button" data-unit="' + u + '" aria-pressed="' + (state.unit === u) + '">' + esc(unitLab[u]) + "</button>"; }).join("") + '</div></div>' +
        '<input class="trange" id="trange" type="range" min="0" max="1000" value="' + sl + '" aria-label="' + esc(U.t_cap) + '"></div></div>' +
        (f ? '<div><h3>' + esc(U.t_prod) + "</h3>" + ph + "</div>" : "") +
        (f ? '<div><h3>' + esc(U.t_pack) + "</h3>" + kh + "</div>" : "") + (f ? '<a class="btn btn--sm tjump" href="#tres">' + esc(U.t_jump) + "</a>" : "") + "</div>";
      var mini = "";
      if (f) { var e0 = evalLines(f, capKg())[0]; mini = '<a class="tmini" href="#tres"><b>' + esc(e0.L.label) + "</b><span>" + esc(e0.st === "in" ? U.t_fit_in : e0.st === "below" ? U.t_fit_below : U.t_fit_above) + " ↓</span></a>"; }
      app.innerHTML = mini + ctl + '<div class="tres" id="tres" aria-live="polite">' + result() + "</div>";
      bind();
    }

    function result() {
      var f = fruit();
      if (!f) return '<p class="tempty">' + esc(U.t_empty) + "</p>";
      var kg = capKg(), ev = evalLines(f, kg), best = ev[0], L = best.L;
      var prod = D.products.filter(function (p) { return p.id === state.prod; })[0];
      var h = "";
      // line card
      var fitCls = best.st === "in" ? "tfit--in" : "tfit--out";
      var fitTxt = best.st === "in" ? U.t_fit_in : best.st === "below" ? U.t_fit_below + ": " + fmt(L.unit === "tday" ? L.min : best.r.min) + " " + (L.unit === "tday" ? U.tday : U.kgh) : U.t_fit_above + ": " + fmt(L.unit === "tday" ? L.max : best.r.max) + " " + (L.unit === "tday" ? U.tday : U.kgh);
      h += '<div class="tpanel"><h3>' + esc(U.t_line) + '</h3><div class="tline"><a href="' + L.url + '"><img src="' + L.img2 + '" width="' + L.w + '" height="' + L.h + '" alt="' + esc(L.label) + '"></a><div><h4><a href="' + L.url + '">' + esc(L.label) + "</a></h4><p class=\"tline__cap\">" + esc(L.cap) + '</p><span class="tfit ' + fitCls + '">' + esc(fitTxt) + "</span>" +
        '<div class="btn-row"><a class="btn btn--sm" href="' + L.url + '">' + esc(U.t_open_line) + "</a></div></div></div>";
      h += chart(ev, kg);
      if (state.unit === "tday" || f.group === "tomato") h += '<p class="tnote">' + esc(U.t_day24) + "</p>";
      h += "</div>";
      if (best.st !== "in" && ev.every(function (x) { return x.st !== "in"; })) h += '<div class="tpanel"><p>' + esc(U.t_none_found) + '</p><div class="tact"><a class="btn btn--sm" href="' + mailto(summary()) + '">' + esc(U.t_send) + "</a></div></div>";
      // steps
      var concOn = !!(prod && prod.id === "conc") || (prod && prod.id === "tomato") || (!prod && f.group === "tomato");
      h += '<div class="tpanel"><h3>' + esc(U.t_path) + '</h3><ol class="tsteps">' + L.steps.map(function (s, i) {
        var off = s.k === "conc" && !concOn && f.group !== "tomato";
        return '<li class="tstep' + (off ? " is-off" : "") + '"><span class="tstep__n">' + String(i + 1).padStart(2, "0") + "</span><h5>" + esc(s.label) + "</h5>" + (s.items.length ? "<ul>" + s.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + (off ? "<em>" + esc(U.t_skip) + "</em>" : "") + "</li>";
      }).join("") + "</ol></div>";
      // extraction machines
      var txt = L.steps.map(function (s) { return s.items.join(" "); }).join(" ").toUpperCase(), need = kg / 1000, mh = "", talk = false;
      if (f.group === "tomato") txt = "";
      Object.keys(D.fam).forEach(function (fk) {
        if (txt.indexOf(fk.toUpperCase()) < 0) return;
        var F = D.fam[fk];
        var models = F.models.map(function (m) {
          var st = m.soldout ? "na" : m.cap < need ? "under" : m.cap > need * 10 ? "over" : "ok";
          return { m: m, st: st };
        }).sort(function (a, b) { var r = { ok: 0, over: 1, under: 2, na: 3 }; return r[a.st] - r[b.st] || a.m.cap - b.m.cap; });
        if (!models.some(function (x) { return x.st === "ok" || x.st === "over"; })) talk = true;
        var rows = models.map(function (x) {
          var m = x.m, lab = { ok: U.t_cover, over: U.t_over, under: U.t_under, na: U.t_na }[x.st];
          return '<div class="tm' + (x.st === "ok" ? "" : " is-no") + '"><a href="' + m.url + '">' + esc(m.label) + '</a><span class="tm__s ' + (x.st === "ok" ? "tm__s--y" : "tm__s--n") + '">' + esc(lab) + "</span><small>" + esc(m.capText) + "</small></div>";
        }).join("");
        mh += '<div class="tmach__f"><span>' + esc(F.label) + "</span>" + rows + "</div>";
      });
      if (mh) h += '<div class="tpanel"><h3>' + esc(U.t_extract) + ' · ' + esc(U.t_you) + ": " + fmt(need) + " " + esc(U.th) + '</h3><div class="tmach">' + mh + '</div>' + (talk ? '<p class="tnote tnote--talk">' + esc(U.t_talk) + "</p>" : "") + '<p class="tnote">' + esc(U.t_indic) + "</p></div>";
      if (!mh && best.st !== "in") h += "";
      // equipment for the product
      if (prod) {
        var tg = tagMap[f.group];
        var eq = prod.eq.filter(function (x) { return x.tags.indexOf(tg) > -1; });
        if (eq.length) h += '<div class="tpanel"><h3>' + esc(U.t_equip) + " · " + esc(prod.label) + '</h3><div class="teq">' + eq.map(function (x) { return '<a href="' + x.url + '"><b>' + esc(x.label) + "</b>" + (x.cap ? "<small>" + esc(x.cap) + "</small>" : "") + "</a>"; }).join("") + '</div><div class="btn-row"><a class="btn btn--sm btn--ghost" href="' + prod.app + '">' + esc(prod.label) + "</a></div></div>";
      }
      // fillers
      var pk = D.packs.filter(function (p) { return p.id === state.pack; })[0];
      if (pk) h += '<div class="tpanel"><h3>' + esc(U.t_pack_h) + " · " + esc(pk.label) + '</h3><div class="teq">' + pk.fillers.map(function (x) { return '<a href="' + x.url + '"><b>' + esc(x.label) + (x.soldout ? " · " + esc(U.t_soldout_note) : "") + "</b><small>" + esc(x.type) + (x.cap ? " · " + esc(x.cap) : "") + "</small></a>"; }).join("") + "</div></div>";
      // send
      var sum = summary();
      h += '<div class="tpanel"><h3>' + esc(U.t_summary) + '</h3><div class="tsum" id="tsum">' + esc(sum) + '</div><div class="tact"><a class="btn" id="tsend" href="' + mailto(sum) + '">' + esc(U.t_send) + '</a><button class="btn btn--ghost" type="button" id="tcopy">' + esc(U.t_copy) + '</button><a class="btn btn--ghost" href="' + D.contact.telHref + '">' + esc(D.contact.tel) + "</a></div></div>";
      return h;
    }

    function chart(ev, kg) {
      var all = ev.map(function (x) { return x.r; }), lo = Math.min.apply(null, all.map(function (r) { return r.min; }).concat([kg])), hi = Math.max.apply(null, all.map(function (r) { return r.max; }).concat([kg]));
      lo = Math.pow(10, Math.floor(Math.log10(lo * 0.9))); hi = Math.pow(10, Math.ceil(Math.log10(hi * 1.1)));
      var pos = function (v) { return Math.max(0, Math.min(100, (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * 100)); };
      var mk = pos(kg);
      var rows = ev.map(function (x, i) {
        return '<div class="tchart__r' + (i === 0 ? " is-best" : "") + '"><span class="tchart__n"><span>' + esc(x.L.label) + "</span><span>" + esc(fmt(x.L.min) + " - " + fmt(x.L.max) + " " + (x.L.unit === "tday" ? U.tday : U.kgh)) + '</span></span><div class="tchart__t"><i class="tchart__b" style="left:' + pos(x.r.min) + "%;width:" + (pos(x.r.max) - pos(x.r.min)) + '%"></i><i class="tchart__m" style="left:' + mk + '%"></i></div></div>';
      }).join("");
      var narrow = (app.clientWidth || window.innerWidth) < 620, ticks = [];
      for (var p = lo; p <= hi * 1.001; p *= 10) { ticks.push(p); if (!narrow) { if (p * 2 <= hi) ticks.push(p * 2); if (p * 5 <= hi) ticks.push(p * 5); } }
      ticks = ticks.filter(function (v, i, a) { return v <= hi * 1.001 && a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      var ax = ticks.map(function (v) { var q = pos(v); return '<span style="left:' + q + '%;transform:translateX(' + (q > 88 ? "-100%" : q < 6 ? "0" : "-50%") + ')">' + fmt(v) + "</span>"; }).join("");
      var ml = mk > 80 ? "translateX(-100%)" : mk < 20 ? "translateX(0)" : "translateX(-50%)";
      return '<div class="tchart"><p class="tchart__mv" style="margin-left:' + mk + '%;transform:' + ml + '">' + esc(fmt(kg) + " " + U.kgh) + '</p><div class="tchart__rows">' + rows + '</div><div class="tchart__ax">' + ax + "</div></div>";
    }

    function summary() {
      var f = fruit(), kg = capKg(), ev = evalLines(f, kg), best = ev[0];
      var prod = D.products.filter(function (p) { return p.id === state.prod; })[0], pk = D.packs.filter(function (p) { return p.id === state.pack; })[0];
      var L = D.lang === "it" ? ["Frutta", "Portata", "Prodotto finito", "Confezionamento", "Linea consigliata"] : ["Fruit", "Throughput", "Finished product", "Packaging", "Suggested line"];
      var lines = [L[0] + ": " + f.label, L[1] + ": " + fmt(state.cap) + " " + unitLab[state.unit] + (state.unit !== "kgh" ? " (" + fmt(kg) + " " + U.kgh + ")" : "")];
      if (prod) lines.push(L[2] + ": " + prod.label);
      if (pk) lines.push(L[3] + ": " + pk.label);
      lines.push(L[4] + ": " + best.L.label + " (" + best.L.cap + ")");
      lines.push((D.lang === "it" ? "Esito: " : "Result: ") + (best.st === "in" ? U.t_fit_in : best.st === "below" ? U.t_fit_below : U.t_fit_above));
      return lines.join("\n");
    }
    function mailto(sum) {
      var subj = (D.lang === "it" ? "Richiesta linea: " : "Line request: ") + fruit().label + " " + fmt(state.cap) + " " + unitLab[state.unit];
      var intro = D.lang === "it" ? "Buongiorno, vorrei informazioni su questa configurazione:\n\n" : "Hello, I would like information on this set-up:\n\n";
      var outro = D.lang === "it" ? "\n\nNome, azienda, paese e telefono:\n" : "\n\nName, company, country and phone:\n";
      return "mailto:" + D.contact.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(intro + sum + outro);
    }

    function setCap(v) { if (isFinite(v) && v > 0) state.cap = v; }
    function bind() {
      $$("[data-fruit]", app).forEach(function (b) { b.addEventListener("click", function () {
        state.fruit = b.getAttribute("data-fruit"); var f = fruit();
        if (f.group === "tomato" && state.unit !== "tday" && state.cap < 1000 && state.unit === "kgh") { /* keep */ }
        var ps = products().map(function (p) { return p.id; });
        if (!state.prod || ps.indexOf(state.prod) < 0) state.prod = ps[0] === "tomato" ? "tomato" : null;
        render();
        var r = $("#tres"); if (r && window.innerWidth < 1040) { /* leave scroll alone */ }
      }); });
      $$("[data-prod]", app).forEach(function (b) { b.addEventListener("click", function () { state.prod = state.prod === b.getAttribute("data-prod") ? null : b.getAttribute("data-prod"); render(); }); });
      $$("[data-pack]", app).forEach(function (b) { b.addEventListener("click", function () { state.pack = b.getAttribute("data-pack") || null; render(); }); });
      $$("[data-unit]", app).forEach(function (b) { b.addEventListener("click", function () {
        var old = state.unit, nu = b.getAttribute("data-unit"), kg = capKg();
        state.unit = nu; state.cap = nu === "kgh" ? kg : nu === "th" ? kg / 1000 : kg * 24 / 1000; state.cap = +state.cap.toPrecision(3); render();
      }); });
      var inp = $("#tcap"), rng = $("#trange");
      if (inp) {
        var t;
        inp.addEventListener("input", function () { setCap(parseFloat(inp.value.replace(/\./g, "").replace(",", "."))); clearTimeout(t); t = setTimeout(function () { partial(true); }, 160); });
        inp.addEventListener("change", function () { setCap(parseFloat(inp.value.replace(/\./g, "").replace(",", "."))); render(); });
      }
      if (rng) rng.addEventListener("input", function () {
        var kg = Math.exp(Math.log(50) + (+rng.value / 1000) * (Math.log(100000) - Math.log(50)));
        kg = kg > 1000 ? Math.round(kg / 100) * 100 : kg > 200 ? Math.round(kg / 10) * 10 : Math.round(kg);
        state.cap = state.unit === "kgh" ? kg : state.unit === "th" ? +(kg / 1000).toPrecision(3) : +(kg * 24 / 1000).toPrecision(3);
        if (inp) inp.value = state.cap; partial(false);
      });
      var send = $("#tcopy");
      if (send) send.addEventListener("click", function () {
        var s = $("#tsum").textContent;
        var done = function () { send.textContent = U.t_copied; setTimeout(function () { send.textContent = U.t_copy; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, done); else done();
      });
    }
    function partial() { var r = $("#tres"); if (r) { r.innerHTML = result(); bindResult(); } var m = $(".tmini"), f = fruit(); if (m && f) { var e0 = evalLines(f, capKg())[0]; m.innerHTML = "<b>" + esc(e0.L.label) + "</b><span>" + esc(e0.st === "in" ? U.t_fit_in : e0.st === "below" ? U.t_fit_below : U.t_fit_above) + " ↓</span>"; } }
    function bindResult() {
      var send = $("#tcopy");
      if (send) send.addEventListener("click", function () {
        var s = $("#tsum").textContent;
        var done = function () { send.textContent = U.t_copied; setTimeout(function () { send.textContent = U.t_copy; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, done); else done();
      });
    }
    render();
  }
})();
