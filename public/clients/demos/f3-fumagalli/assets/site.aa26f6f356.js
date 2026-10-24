/* F3 Fumagalli concept: menu, dock, reveals, filter, open-now, product finder. No dependencies. */
(function () {
  "use strict";
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* dock */
  var dx = $("#dock-x");
  if (dx) dx.addEventListener("click", function () { d.documentElement.classList.add("nodock"); try { localStorage.setItem("f3dock", "1"); } catch (e) {} });

  /* drawer */
  var bg = $(".burger"), dr = $("#drawer");
  function setDrawer(o) {
    if (!bg || !dr) return;
    dr.classList.toggle("is-open", o); bg.setAttribute("aria-expanded", o); dr.setAttribute("aria-hidden", !o);
    d.body.style.overflow = o ? "hidden" : "";
  }
  if (bg) {
    bg.addEventListener("click", function () { setDrawer(bg.getAttribute("aria-expanded") !== "true"); });
    $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
    matchMedia("(min-width:980px)").addEventListener("change", function (m) { if (m.matches) setDrawer(false); });
  }

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) { rv.forEach(function (e) { e.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (e, i) { e.style.setProperty("--d", (i % 4)); io.observe(e); });
  }

  /* range filter */
  var chips = $$(".chip[data-f]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c); });
      $$("[data-tiles] .tile").forEach(function (t) { t.hidden = !(f === "all" || t.getAttribute("data-fam") === f); });
    });
  });

  /* open now (Europe/Rome, Mon-Fri 08-12 / 13-17) */
  $$("[data-open]").forEach(function (el) {
    try {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      var m = parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10), wd = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(o.weekday) >= 0;
      var on = wd && ((m >= 480 && m < 720) || (m >= 780 && m < 1020));
      el.textContent = on ? el.getAttribute("data-o") : el.getAttribute("data-c"); el.classList.toggle("on", on);
    } catch (e) {}
  });

  /* ---------------------------------------------------------------- finder */
  var host = $("[data-finder]"), raw = $("#finder-data");
  if (!host || !raw) return;
  var D = JSON.parse(raw.textContent), L = D.L, full = host.getAttribute("data-full") === "1";
  var S = { app: null, need: null, kg: 30, kgh: 80, shirts: 40, irons: "2", flat: 40, heat: "any", garment: "shirt", prio: "prod", backup: false, food: false, step: 1 };
  var q = new URLSearchParams(location.search);
  if (q.get("app") && D.appNeeds[q.get("app")]) { S.app = q.get("app"); S.step = 2; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function img(k) { var i = D.imgs[k]; return i ? '<img src="' + i.src + '" width="' + i.w + '" height="' + i.h + '" alt="" loading="lazy">' : ""; }
  function fmt(n) { return String(n).replace(".", ","); }
  function btn(group, val, label, pressed) { return '<button type="button" class="opt" data-g="' + group + '" data-v="' + esc(val) + '" aria-pressed="' + (pressed ? "true" : "false") + '">' + esc(label) + "</button>"; }
  function range(id, min, max, step, val, unit, label) {
    return '<div class="rng"><label for="' + id + '" class="fq">' + esc(label) + '</label><div class="rng-top"><span class="rng-val" id="' + id + '-v">' + val + '</span><span class="rng-u">' + esc(unit) + '</span></div><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><div class="rng-scale"><span>' + min + '</span><span>' + max + "</span></div></div>";
  }
  function needsFor(app) { return D.appNeeds[app] || []; }

  /* capacity inputs depend on the need */
  function capHTML() {
    var n = S.need, h = "";
    if (n === "steam") {
      h = range("kgh", 20, 340, 5, S.kgh, L.kgh_u, L.kgh) +
        '<label class="chk"><input type="checkbox" id="backup"' + (S.backup ? " checked" : "") + "><span>" + esc(L.backup) + "</span></label>" +
        '<label class="chk"><input type="checkbox" id="food"' + (S.food ? " checked" : "") + "><span>" + esc(L.food) + "</span></label>";
    } else if (n === "dry") {
      h = range("kg", 10, 65, 1, S.kg, L.kg_u, L.kg) + '<p class="fq" style="margin-top:18px">' + esc(L.heat) + '</p><div class="opts">' + ["any", "el", "gas", "steam"].map(function (k) { return btn("heat", k, L.heats[k], S.heat === k); }).join("") + "</div>";
    } else if (n === "shirts") {
      h = range("shirts", 10, 80, 5, S.shirts, L.shirts_u, L.shirts);
    } else if (n === "flat") {
      h = range("flat", 10, 80, 5, S.flat, L.flat_u, L.flat);
    } else if (n === "irons") {
      h = '<p class="fq">' + esc(L.irons) + '</p><div class="opts">' + ["2", "4"].map(function (k) { return btn("irons", k, L.irons_n[k], S.irons === k); }).join("") + "</div>";
    } else if (n === "press") {
      h = '<p class="fq">' + esc(L.garment) + '</p><div class="opts">' + ["shirt", "trousers", "jacket", "general"].map(function (k) { return btn("garment", k, L.garments[k], S.garment === k); }).join("") + "</div>";
      if (S.garment === "general") h += '<p class="fq" style="margin-top:18px">' + esc(L.priority) + '</p><div class="opts">' + ["prod", "cost", "rob"].map(function (k) { return btn("prio", k, L.priorities[k], S.prio === k); }).join("") + "</div>";
    }
    return h;
  }
  function needsCap(n) { return ["steam", "dry", "shirts", "irons", "press", "flat"].indexOf(n) >= 0; }

  /* ---- result engines (data only from the datasheets) */
  function card(o) {
    var best = o.best ? '<span class="badge">' + esc(L.fits.toUpperCase()) + "</span>" : "";
    return '<div class="rcard' + (o.best ? " best" : "") + '"><div class="rimg">' + (o.img ? img(o.img) : "") + '</div><div>' + best + '<h3><a href="' + o.url + '">' + esc(o.name) + '</a></h3><p class="why">' + o.why + '</p><p class="spec">' + o.spec + '</p><a class="lnk" href="' + o.url + '">' + esc(L.more) + " &rarr;</a></div></div>";
  }
  function results() {
    var n = S.need, out = [], notes = [], names = [];
    if (n === "steam") {
      var list = D.vulcano.filter(function (v) { return v.max >= S.kgh && (!S.backup || v.gen === 2); }).sort(function (a, b) { return a.max - b.max; }).slice(0, 3);
      list.forEach(function (v, i) {
        names.push("Vulcano " + v.m);
        out.push(card({ best: i === 0, name: "Vulcano " + v.m, img: v.img, url: v.url,
          why: esc(L.cover) + " <b>" + v.max + " kg/h</b> (" + S.kgh + " " + esc(L.needs_label) + ")" + (v.gen === 2 ? " &middot; 2 &times; 100%" : ""),
          spec: esc(L.boiler) + " " + esc(v.vol) + " L &middot; " + esc(L.power) + " " + v.kw + " kW &middot; " + esc(v.bar) + " bar &middot; " + esc(L.size) + " " + esc(v.dim) + " cm &middot; " + v.kg + " kg" }));
      });
      if (S.backup) notes.push(L.backup_note); if (S.food) notes.push(L.food_note);
      if (!list.length) notes.push(L.over_note);
    } else if (n === "dry") {
      var c = D.capri.filter(function (x) { return x.kg >= S.kg && (S.heat === "any" || (S.heat === "el" && x.el) || (S.heat === "gas" && x.gas) || (S.heat === "steam" && x.steam)); })
        .sort(function (a, b) { return a.kg - b.kg || a.units - b.units; }).slice(0, 3);
      c.forEach(function (x, i) {
        names.push(x.m);
        var heats = [];
        if (S.heat === "any" || S.heat === "el") heats.push(L.kwh_el + " " + fmt(x.el) + " kW" + (x.sole ? " (SOLE " + fmt(x.sole) + " kW)" : ""));
        if (S.heat === "any" || S.heat === "gas") heats.push(L.kwh_gas + " " + fmt(x.gas) + " kW");
        if (S.heat === "any" || S.heat === "steam") heats.push(L.kwh_steam + " " + x.steam + " kg/h");
        out.push(card({ best: i === 0, name: x.m, img: "capri_lab", url: x.url,
          why: (x.units > 1 ? x.units + " &times; " : "") + "<b>" + x.kg + " kg</b> (" + S.kg + " " + esc(L.needs_label) + ") &middot; " + esc(L.drum) + " " + x.drum + " cm",
          spec: esc(heats.join(" · ")) + " &middot; " + esc(L.size) + " " + esc(x.dim) + " cm &middot; " + x.w + " kg" }));
      });
      if (c.length) { if (S.app === "selfservice") notes.push(L.self_note); else notes.push(L.lab_note); notes.push(L.sole_note); if (S.app === "dry") notes.push(L.wet_note); } else notes.push(L.over_note);
    } else if (n === "shirts") {
      var f = D.firenze.filter(function (x) { return x.max >= S.shirts; }).sort(function (a, b) { return a.max - b.max; });
      f.forEach(function (x, i) {
        names.push(x.m);
        out.push(card({ best: i === 0, name: x.m, img: x.img, url: x.url, why: esc(L.cover) + " <b>" + x.max + " " + esc(L.shirts_u) + "</b> (" + S.shirts + " " + esc(L.needs_label) + ")", spec: esc(x.d) }));
      });
      if (f.length) notes.push(L.with_firenze); else notes.push(L.over_note);
    } else if (n === "flat") {
      var fl = D.mangani.filter(function (x) { return x.hi >= S.flat; }).sort(function (a, b) { return a.hi - b.hi || a.lo - b.lo; }).slice(0, 3);
      fl.forEach(function (x, i) {
        names.push("Mangani " + x.m);
        out.push(card({ best: i === 0, name: "Mangani " + x.m, img: "mangano", url: x.url, why: esc(L.cover) + " <b>" + (x.lo === x.hi ? x.hi : x.lo + "-" + x.hi) + " kg/h</b> (" + S.flat + " " + esc(L.needs_label) + ")",
          spec: esc(x.size) + " mm &middot; " + esc(L.kwh_el) + " " + esc(x.el) + " kW" + (x.gas !== "-" ? " &middot; " + esc(L.kwh_gas) + " " + esc(x.gas) + " kW" : "") + " &middot; " + x.kg + " kg" }));
      });
      notes.push(fl.length ? L.flat_text : L.over_note);
    } else if (n === "irons") {
      var cl = D.cluster.filter(function (x) { return String(x.irons) === S.irons; });
      cl.forEach(function (x, i) {
        names.push(x.m);
        out.push(card({ best: i === 0, name: x.m, img: x.img, url: x.url, why: "<b>" + x.irons + "</b> &middot; " + esc(L.boiler) + " " + esc(x.vol), spec: esc(x.d) }));
      });
      notes.push(L.irons_text);
    } else if (n === "press") {
      var keys = [];
      if (S.garment === "general") keys = [D.priority[S.prio]].concat(["senior", "junior", "manual", "monza"].filter(function (k) { return k !== D.priority[S.prio]; }));
      else keys = D.garment[S.garment];
      keys.slice(0, S.garment === "general" ? 3 : 3).forEach(function (k, i) {
        var p = D.prod[k]; names.push(p.name);
        out.push(card({ best: i === 0, name: p.name, img: p.img, url: p.url, why: esc(p.fig), spec: esc(p.short) }));
      });
      if (S.garment === "shirt") notes.push(L.with_firenze);
    } else {
      var map = { pack: ["stradivari", "torino"], spot: ["smacchiatura"], wash: ["lavatrici"], ozone: ["ozono"] };
      (map[n] || []).forEach(function (k, i) { var p = D.prod[k]; names.push(p.name); out.push(card({ best: i === 0, name: p.name, img: p.img, url: p.url, why: esc(p.fig), spec: esc(p.short) })); });
      notes.push(L[n + "_text"] || "");
    }
    return { html: out.join(""), notes: notes.filter(Boolean), names: names };
  }
  function capText() {
    var n = S.need;
    if (n === "steam") return S.kgh + " " + L.kgh_u + (S.backup ? " (x2)" : "") + (S.food ? ", inox" : "");
    if (n === "dry") return S.kg + " " + L.kg_u + ", " + L.heats[S.heat];
    if (n === "shirts") return S.shirts + " " + L.shirts_u;
    if (n === "irons") return L.irons_n[S.irons];
    if (n === "flat") return S.flat + " " + L.flat_u;
    if (n === "press") return L.garments[S.garment] + (S.garment === "general" ? ", " + L.priorities[S.prio] : "");
    return "-";
  }
  function mailto(names) {
    var body = [L.mail_hello, "", L.mail_app + ": " + L.apps[S.app], L.mail_need + ": " + L.needs[S.need], L.mail_cap + ": " + capText(), L.mail_models + ": " + (names.join(", ") || "-"), "", L.mail_bye].join("\r\n");
    return "mailto:" + D.mail + "?subject=" + encodeURIComponent(L.mail_subject + " - " + L.needs[S.need]) + "&body=" + encodeURIComponent(body);
  }

  function render() {
    var h = "";
    h += '<div class="fstep"><p class="fq">' + esc(L.q1) + '</p><div class="opts" role="group">' + Object.keys(L.apps).map(function (k) { return btn("app", k, L.apps[k], S.app === k); }).join("") + "</div></div>";
    if (S.app) {
      h += '<div class="fstep"><p class="fq">' + esc(L.q2) + '</p><div class="opts" role="group">' + needsFor(S.app).map(function (k) { return btn("need", k, L.needs[k], S.need === k); }).join("") + "</div></div>";
    }
    if (S.app && S.need && needsCap(S.need)) {
      h += '<div class="fstep"><p class="fq">' + esc(L.q3) + "</p>" + capHTML() + "</div>";
    }
    if (S.app && S.need) {
      var r = results();
      h += '<div class="fstep" aria-live="polite"><p class="fq">' + esc(L.res) + '</p>' + (r.html ? '<div class="fres">' + r.html + "</div>" : '<p class="fnote">' + esc(L.none) + "</p>") +
        r.notes.map(function (x) { return '<p class="fnote">' + esc(x) + "</p>"; }).join("") +
        '<p class="fnote">' + esc(L.indicative) + '</p><div class="fcta"><a class="btn pri" href="' + mailto(r.names) + '" data-ev="email">' + esc(L.quote) + '</a><a class="btn ghost" href="tel:' + D.phone.replace(/\s/g, "") + '" data-ev="call">' + esc(L.call) + '</a><button type="button" class="btn ghost" data-restart>' + esc(L.restart) + "</button></div></div>";
    }
    var active = d.activeElement && d.activeElement.id;
    host.innerHTML = h;
    wire();
    if (active && $("#" + active, host)) $("#" + active, host).focus();
  }
  function wire() {
    $$("[data-g]", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var g = b.getAttribute("data-g"), v = b.getAttribute("data-v");
        if (g === "app") { S.app = v; if (needsFor(v).indexOf(S.need) < 0) S.need = needsFor(v).length === 1 ? needsFor(v)[0] : null; }
        else if (g === "need") S.need = v; else if (g === "heat") S.heat = v; else if (g === "irons") S.irons = v; else if (g === "garment") S.garment = v; else if (g === "prio") S.prio = v;
        render(); var t = $('[data-g="' + g + '"][data-v="' + v + '"]', host); if (t) t.focus({ preventScroll: true });
      });
    });
    [["kgh", "kgh"], ["kg", "kg"], ["shirts", "shirts"]].forEach(function (p) {
      var el = $("#" + p[0], host); if (!el) return;
      el.addEventListener("input", function () { S[p[1]] = +el.value; $("#" + p[0] + "-v", host).textContent = el.value; });
      el.addEventListener("change", render);
    });
    var bk = $("#backup", host); if (bk) bk.addEventListener("change", function () { S.backup = bk.checked; render(); });
    var fd = $("#food", host); if (fd) fd.addEventListener("change", function () { S.food = fd.checked; render(); });
    var rs = $("[data-restart]", host); if (rs) rs.addEventListener("click", function () { S.app = S.need = null; render(); host.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
  }
  if (S.app && needsFor(S.app).length === 1) S.need = needsFor(S.app)[0];
  render();
  $$("a[data-app]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!host) return; e.preventDefault(); S.app = a.getAttribute("data-app"); S.need = needsFor(S.app).length === 1 ? needsFor(S.app)[0] : null; render();
      host.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
})();
