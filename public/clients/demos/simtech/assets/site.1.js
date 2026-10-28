(function () {
  "use strict";
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  function safe(f) { try { return f(); } catch (e) { return null; } }
  d.documentElement.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = d.body.getAttribute("data-lang") || "pl";

  /* menu */
  var burger = $("#burger"), nav = $("#nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var o = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", o ? "true" : "false"); nav.classList.toggle("is-open", o);
      d.body.style.overflow = o ? "hidden" : "";
    });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) burger.click(); });
    window.addEventListener("resize", function () { if (innerWidth > 1180 && nav.classList.contains("is-open")) burger.click(); });
  }

  /* concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sim-dock") === "1"; })) dock.hidden = true;
  if (dock && !dock.hidden) setTimeout(function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sim-dock", "1"); }); }, 9000);
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sim-dock", "1"); }); });

  /* hero crossfade of their own slides */
  var slides = $$(".slide"), caps = $$(".cap");
  if (slides.length > 1 && !reduce) {
    var cur = 0, timer = null;
    var show = function (i) {
      slides.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      caps.forEach(function (c, k) { c.classList.remove("is-on"); if (k === i) { void c.offsetWidth; c.classList.add("is-on"); } });
      cur = i;
    };
    var start = function () { stop(); timer = setInterval(function () { show((cur + 1) % slides.length); }, 6500); };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    d.addEventListener("visibilitychange", function () { d.hidden ? stop() : start(); });
    caps.forEach(function (c) { c.addEventListener("mouseenter", function () { show(+c.getAttribute("data-i")); stop(); }); c.addEventListener("mouseleave", start); });
    window.addEventListener("load", start);
  }

  /* reveals */
  var rvs = $$(".sec__head, .card, .news, .sector, .wall li, .tl li, .steps li, .defs li, .ref__x");
  if ("IntersectionObserver" in window && !reduce) {
    rvs.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rvs.forEach(function (el) { el.classList.add("in"); }); }, 4000);
  }

  /* film facade: loads their YouTube video on tap only */
  $$(".film").forEach(function (f) {
    var b = $(".film__btn", f); if (!b) return;
    b.addEventListener("click", function () {
      var id = f.getAttribute("data-yt");
      var i = d.createElement("iframe");
      i.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      i.title = f.getAttribute("data-title") || "Video"; i.allow = "autoplay; encrypted-media; picture-in-picture"; i.allowFullscreen = true;
      f.replaceChild(i, b);
    });
  });

  /* contact form -> mailto */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { return cf.elements[n].value.trim(); };
    var pl = (cf.getAttribute("data-lang") || "pl") === "pl";
    var body = (pl ? "Dzień dobry,\n\n" : "Hello,\n\n") + g("m") + "\n\n" + (pl ? "Imię i nazwisko: " : "Name: ") + g("n") + "\n" + (pl ? "Firma: " : "Company: ") + g("f") + "\n" + (pl ? "Telefon: " : "Phone: ") + g("t");
    location.href = "mailto:" + cf.getAttribute("data-mail") + "?subject=" + encodeURIComponent(pl ? "Zapytanie ze strony" : "Enquiry from the website") + "&body=" + encodeURIComponent(body);
  });

  /* ---------------- signature tool: "Czy robiliście już coś takiego?" ---------------- */
  var F = $("#finder"); if (!F) return;
  var T = lang === "pl" ? {
    subj: "Zapytanie ofertowe", hello: "Dzień dobry,\n\nszukamy wykonawcy do projektu. Nasz wybór na stronie Simtech:", proc: "Proces", work: "Zakres prac", brand: "Marka robota", reg: "Lokalizacja", q: "Fraza",
    sim: "Podobne realizacje z Państwa listy", tail: "Firma:\nOsoba kontaktowa i telefon:\nOpis zadania (liczba stanowisk, termin):\n\nPozdrawiam", all: "Wszystkie realizacje z listy", copied: "Skopiowano", copy: "Skopiuj opis zapytania", sel: "wyboru"
  } : {
    subj: "Enquiry", hello: "Hello,\n\nwe are looking for a contractor for a project. Our selection on the Simtech website:", proc: "Process", work: "Scope of work", brand: "Robot brand", reg: "Location", q: "Search",
    sim: "Similar references from your list", tail: "Company:\nContact person and phone:\nTask description (number of stations, deadline):\n\nBest regards", all: "All references on the list", copied: "Copied", copy: "Copy the enquiry text", sel: "selection"
  };
  var cards = $$(".ref", F), dots = $$(".dot", F), chips = $$(".chip", F), qi = $("#f-q"), svg = $("#map"), tip = $("#f-tip"), fmap = $("#f-map");
  var st = { q: "", proc: {}, work: {}, brand: {}, reg: {} }, GROUPS = ["proc", "work", "brand", "reg"];
  var byId = {}; dots.forEach(function (c) { byId[c.getAttribute("data-id")] = c; });
  var data = cards.map(function (c) {
    return { el: c, id: c.getAttribute("data-id"), name: c.getAttribute("data-name"), country: c.getAttribute("data-country"), cc: c.getAttribute("data-cc"),
      proc: (c.getAttribute("data-proc") || "").split(" ").filter(Boolean), work: (c.getAttribute("data-work") || "").split(" ").filter(Boolean),
      brand: (c.getAttribute("data-brand") || "").split(" ").filter(Boolean), reg: [c.getAttribute("data-reg")], title: $("h3", c).textContent, ccn: $(".ref__cc", c).textContent };
  });
  function keys(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }
  function matchGroup(r, g, sel) { return !sel.length || sel.some(function (v) { return r[g].indexOf(v) > -1; }); }
  function matchQ(r) { return !st.q || r.name.indexOf(st.q) > -1 || r.country.indexOf(st.q) > -1; }
  function matches(r, over) {
    if (!matchQ(r)) return false;
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i], sel = over && over.g === g ? [over.v] : keys(st[g]);
      if (!matchGroup(r, g, sel)) return false;
    }
    return true;
  }
  /* projection identical to the build (Natural Earth) */
  function proj(lng, lat) {
    var l = lng * Math.PI / 180, p = lat * Math.PI / 180, p2 = p * p, p4 = p2 * p2;
    var x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    var y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [x * 100, -y * 100];
  }
  var WORLD = [-275, -140, 550, 245], view = "auto", cvb = WORLD.slice(), anim = null;
  var eA = proj(-13, 63), eB = proj(42, 34);
  var EU = [eA[0], eA[1], eB[0] - eA[0], eB[1] - eA[1]];
  function fitBox(b) { /* keep 16:9 */
    var ar = 550 / 245, w = b[2], h = b[3];
    if (w / h < ar) w = h * ar; else h = w / ar;
    return [b[0] + b[2] / 2 - w / 2, b[1] + b[3] / 2 - h / 2, w, h];
  }
  function setVB(t) {
    if (anim) cancelAnimationFrame(anim);
    if (reduce) { cvb = t; svg.setAttribute("viewBox", t.join(" ")); scaleDots(); return; }
    var from = cvb.slice(), t0 = performance.now();
    (function step(n) {
      var k = Math.min(1, (n - t0) / 600), e = 1 - Math.pow(1 - k, 3);
      cvb = from.map(function (v, i) { return v + (t[i] - v) * e; });
      svg.setAttribute("viewBox", cvb.join(" ")); scaleDots();
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function scaleDots() { var r = Math.max(1, Math.min(2.2, cvb[2] / 550 * 2.4 + .6)); dots.forEach(function (c) { c.setAttribute("r", r.toFixed(2)); }); var h = $(".home", F); if (h) h.setAttribute("r", (r * 1.5).toFixed(2)); }
  function fit(vis) {
    if (view === "world") return setVB(WORLD);
    if (view === "eu") return setVB(fitBox(EU));
    if (!vis.length) return setVB(WORLD);
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    vis.forEach(function (r) { var c = byId[r.id]; var x = +c.getAttribute("cx"), y = +c.getAttribute("cy"); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    var w = Math.max(x1 - x0, 60), h = Math.max(y1 - y0, 30), padx = w * .14 + 8, pady = h * .2 + 6;
    var b = fitBox([x0 - padx, y0 - pady, w + 2 * padx, h + 2 * pady]);
    if (b[2] > 550) b = WORLD;
    setVB(b);
  }
  function summary(vis) {
    var parts = [];
    var add = function (lab, g, map) { var k = keys(st[g]); if (k.length) parts.push([lab, k.map(function (v) { return map ? map(v) : v; })]); };
    var lbl = function (g, v) { var b = $('.chip[data-group="' + g + '"][data-val="' + v + '"] span', F); return b ? b.textContent : v; };
    add(T.proc, "proc", function (v) { return lbl("proc", v); }); add(T.work, "work", function (v) { return lbl("work", v); });
    add(T.brand, "brand", function (v) { return lbl("brand", v); }); add(T.reg, "reg", function (v) { return lbl("reg", v); });
    if (st.q) parts.push([T.q, [st.q]]);
    return parts;
  }
  function mailText(vis) {
    var parts = summary(vis), L = [T.hello, ""];
    if (!parts.length) L.push("- " + T.all);
    parts.forEach(function (p) { L.push("- " + p[0] + ": " + p[1].join(", ")); });
    if (vis.length && vis.length < data.length) { L.push("", T.sim + ": " + vis.slice(0, 6).map(function (r) { return r.title; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", ") + (vis.length > 6 ? " (+" + (vis.length - 6) + ")" : "")); }
    L.push("", T.tail);
    return L.join("\n");
  }
  var lastText = "";
  function update(noFit) {
    var vis = [], cs = {};
    data.forEach(function (r) {
      var ok = matches(r), c = byId[r.id];
      r.el.hidden = !ok; if (c) c.classList.toggle("is-off", !ok);
      if (ok) { vis.push(r); cs[r.cc] = 1; }
      var score = 0; GROUPS.forEach(function (g) { keys(st[g]).forEach(function (v) { if (r[g].indexOf(v) > -1) score++; }); });
      r.el.style.order = String(-score * 1000 + (+r.id));
    });
    $("#f-n").textContent = vis.length; $("#f-c").textContent = Object.keys(cs).length;
    $("#f-empty").hidden = vis.length > 0; $("#f-list").hidden = vis.length === 0;
    chips.forEach(function (b) {
      var g = b.getAttribute("data-group"), v = b.getAttribute("data-val"), on = !!st[g][v], n = data.filter(function (r) { return matches(r, { g: g, v: v }); }).length;
      b.setAttribute("aria-pressed", on ? "true" : "false"); $("i", b).textContent = n; b.disabled = !on && n === 0;
    });
    var any = GROUPS.some(function (g) { return keys(st[g]).length; }) || st.q;
    $("#f-reset").hidden = !any;
    lastText = mailText(vis);
    var subj = T.subj + (any ? ": " + summary(vis).map(function (p) { return p[1].join(", "); }).join(" / ") : "");
    $("#f-mail").href = "mailto:" + F.getAttribute("data-mail") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(lastText);
    if (!noFit) fit(vis);
    /* url state */
    var q = new URLSearchParams();
    if (keys(st.proc).length) q.set("proces", keys(st.proc).join(",")); if (keys(st.work).length) q.set("zakres", keys(st.work).join(","));
    if (keys(st.brand).length) q.set("marka", keys(st.brand).join(",")); if (keys(st.reg).length) q.set("gdzie", keys(st.reg).join(",")); if (st.q) q.set("q", st.q);
    safe(function () { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q.toString() : "")); });
  }
  chips.forEach(function (b) { b.addEventListener("click", function () { var g = b.getAttribute("data-group"), v = b.getAttribute("data-val"); st[g][v] = !st[g][v]; update(); }); });
  qi.addEventListener("input", function () { st.q = qi.value.trim().toLowerCase(); update(); });
  $("#f-reset").addEventListener("click", function () { GROUPS.forEach(function (g) { st[g] = {}; }); st.q = ""; qi.value = ""; view = "auto"; viewBtns(); update(); });
  var vbs = $$(".f-views button", F);
  function viewBtns() { vbs.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === view ? "true" : "false"); }); }
  vbs.forEach(function (b) { b.addEventListener("click", function () { view = b.getAttribute("data-v"); viewBtns(); update(); }); });
  $("#f-copy").addEventListener("click", function () {
    var b = $("#f-copy"), done = function () { b.textContent = T.copied; setTimeout(function () { b.textContent = T.copy; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastText).then(done, done);
    else { var t = d.createElement("textarea"); t.value = lastText; d.body.appendChild(t); t.select(); safe(function () { d.execCommand("copy"); }); d.body.removeChild(t); done(); }
  });
  /* map interaction */
  var byIdData = {}; data.forEach(function (r) { byIdData[r.id] = r; });
  function tipAt(c) {
    var r = byIdData[c.getAttribute("data-id")], bb = fmap.getBoundingClientRect(), cb = c.getBoundingClientRect();
    tip.textContent = r.title + " · " + r.ccn; tip.hidden = false;
    tip.style.left = (cb.left + cb.width / 2 - bb.left) + "px"; tip.style.top = (cb.top - bb.top) + "px";
  }
  dots.forEach(function (c) {
    c.addEventListener("mouseenter", function () { tipAt(c); });
    c.addEventListener("mouseleave", function () { tip.hidden = true; });
    c.addEventListener("click", function () {
      tipAt(c); setTimeout(function () { tip.hidden = true; }, 2200);
      var r = byIdData[c.getAttribute("data-id")];
      r.el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      r.el.classList.add("is-flash"); setTimeout(function () { r.el.classList.remove("is-flash"); }, 1600);
    });
  });
  /* initial state from the URL (home chips, client wall, service pages) */
  var qs = new URLSearchParams(location.search);
  function load(key, g) { (qs.get(key) || "").split(",").filter(Boolean).forEach(function (v) { st[g][v.toLowerCase()] = true; }); }
  load("proces", "proc"); load("zakres", "work"); load("marka", "brand"); load("gdzie", "reg");
  if (qs.get("q")) { st.q = qs.get("q").toLowerCase(); qi.value = qs.get("q"); }
  update(true); scaleDots(); fit(data.filter(function (r) { return !r.el.hidden; }));
})();
