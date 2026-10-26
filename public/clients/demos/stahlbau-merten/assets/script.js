(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) document.documentElement.classList.add("reduce");
  var safe = function (f) { try { return f(); } catch (e) { return null; } };

  // menu
  var btn = $("#menu-btn"), nav = $("#nav");
  function menu(open) { if (!btn || !nav) return; nav.classList.toggle("is-open", open); document.documentElement.classList.toggle("menu-open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); document.body.style.overflow = open ? "hidden" : ""; }
  if (btn) btn.addEventListener("click", function () { menu(!nav.classList.contains("is-open")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false); });
  if (nav) $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { menu(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) menu(false); });

  // reveal on scroll
  var rv = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (e) { e.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (e) { io.observe(e); });
  }

  // hero: the five frames of the old slider, sharp; tabs select, auto-advance pauses on interaction
  var hm = $("#hero-media");
  if (hm) {
    var frames = $$(".hf", hm), tabs = $$(".ht", hm), cur = 0, timer = null, stopped = false, DUR = 6000;
    hm.style.setProperty("--tick", DUR / 1000 + "s");
    var show = function (i) { cur = (i + frames.length) % frames.length; frames.forEach(function (f, k) { f.classList.toggle("is-on", k === cur); }); tabs.forEach(function (t, k) { t.classList.toggle("is-on", k === cur); t.setAttribute("aria-selected", k === cur ? "true" : "false"); });
      var on = tabs[cur]; if (on && on.parentNode.scrollWidth > on.parentNode.clientWidth) on.parentNode.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); };
    var run = function () { clearTimeout(timer); if (stopped || reduce) return; timer = setTimeout(function () { show(cur + 1); run(); }, DUR); };
    tabs.forEach(function (t, k) { t.addEventListener("click", function () { stopped = true; document.documentElement.classList.add("paused"); clearTimeout(timer); show(k); }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else run(); });
    if (!reduce) { run(); }
  }

  // story: sticky image follows the step in the middle of the viewport
  var steps = $$(".story .step"), sms = $$(".story .sm");
  if (steps.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { var i = +en.target.getAttribute("data-i"); steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); }); sms.forEach(function (m, k) { m.classList.toggle("is-on", k === i); }); } }); }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); }); steps[0].classList.add("is-active");
  }

  // film: loads on click only
  var film = $("#film");
  if (film) { var fb = $(".film__btn", film); if (fb) fb.addEventListener("click", function () {
    var f = document.createElement("iframe"); f.src = film.getAttribute("data-src"); f.title = film.getAttribute("data-title"); f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.setAttribute("allowfullscreen", ""); f.referrerPolicy = "strict-origin-when-cross-origin";
    $$("img, .film__btn, .film__note", film).forEach(function (n) { n.style.display = "none"; }); film.appendChild(f); }); }

  // lightbox
  var lb = $("#lb");
  if (lb) {
    var items = $$(".g__b"), li = $("img", lb), cap = $("figcaption", lb), idx = 0, opener = null;
    var open = function (i) { idx = (i + items.length) % items.length; var b = items[idx]; li.src = b.getAttribute("data-full"); li.width = +b.getAttribute("data-w"); li.height = +b.getAttribute("data-h"); li.alt = b.getAttribute("data-alt"); cap.textContent = b.getAttribute("data-alt"); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb__x", lb).focus(); };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; if (opener) opener.focus(); };
    items.forEach(function (b, i) { b.addEventListener("click", function () { opener = b; open(i); }); });
    $(".lb__x", lb).addEventListener("click", close); $(".lb__n--p", lb).addEventListener("click", function () { open(idx - 1); }); $(".lb__n--n", lb).addEventListener("click", function () { open(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (lb.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") open(idx - 1); if (e.key === "ArrowRight") open(idx + 1); });
  }

  // contact form -> prepared mail
  var cf = $("#cform");
  if (cf) {
    var snd = $("#csend"), upd = function () { var g = function (n) { return (cf.elements[n].value || "").trim(); };
      var body = g("msg") + "\n\n" + [g("name"), g("company"), g("phone")].filter(Boolean).join("\n");
      snd.href = "mailto:merten@merten-unna.de?subject=" + encodeURIComponent("Anfrage: " + g("topic")) + "&body=" + encodeURIComponent(body); };
    cf.addEventListener("input", upd); cf.addEventListener("change", upd); upd();
  }

  // concept dock
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("smu-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("smu-dock", "1"); }); });
})();
