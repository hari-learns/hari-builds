/* Valencia Biscottini concept: one IIFE, no libraries. Quiet motion in their spirit: soft reveals and the slideshow cross-fade. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var lenis = null, ST = null;

  /* ---------- header, sticky bar, dock */
  var hdr = $(".hdr"), bar = $(".bar");
  function onScroll() {
    var y = W.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-scrolled", y > 8);
    if (bar) bar.classList.toggle("is-on", y > W.innerHeight * 0.55);
  }
  W.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var dock = $(".dock");
  if (dock) {
    try { if (localStorage.getItem("vb-dock") === "1") dock.hidden = true; } catch (e) {}
    var db = $("button", dock);
    if (db) db.addEventListener("click", function () { dock.hidden = true; try { localStorage.setItem("vb-dock", "1"); } catch (e) {} });
  }

  /* ---------- drawer */
  var burger = $(".burger"), drawer = $(".drawer");
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    de.style.overflow = open ? "hidden" : "";
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) { var c = $(".drawer__close", drawer); if (c) c.focus(); } else burger.focus({ preventScroll: true });
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(true); });
    $$(".drawer__close, .drawer nav a", drawer).forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- reveals (IntersectionObserver + a sweep that never strands content) */
  var rv = $$(".rv, .rv-img");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in W && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = W.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* ---------- lazy extra images (data-src) after load */
  W.addEventListener("load", function () {
    $$("img[data-src]").forEach(function (im) {
      if (im.dataset.srcset) im.srcset = im.dataset.srcset;
      im.src = im.dataset.src; im.removeAttribute("data-src");
    });
  });

  /* ---------- hero: their detail slideshow, slower and larger */
  var slides = $$(".hero__slide"), cnt = $(".hero__count b"), cur = 0, timer = null, held = false;
  function go(i) {
    if (!slides.length) return;
    slides[cur].classList.remove("is-on"); cur = (i + slides.length) % slides.length; slides[cur].classList.add("is-on");
    if (cnt) cnt.textContent = String(cur + 1).padStart(2, "0");
  }
  function play() { if (timer || RM || slides.length < 2) return; timer = setInterval(function () { if (!held && !d.hidden) go(cur + 1); }, 4200); }
  if (slides.length) W.addEventListener("load", function () { setTimeout(play, 1200); });

  /* ---------- projects filter */
  var chips = $$(".chip[data-cat]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var cat = c.dataset.cat;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $$(".grid li[data-cat]").forEach(function (li) { li.hidden = !(cat === "all" || li.dataset.cat === cat); });
      if (ST) ST.refresh();
      sweep();
    });
  });

  /* ---------- plans: Stato di fatto / Progetto slider */
  $$(".ba").forEach(function (ba) {
    var inp = $("input", ba);
    function set(v) { ba.style.setProperty("--p", v + "%"); }
    if (inp) { inp.addEventListener("input", function () { set(inp.value); }); set(inp.value); }
  });

})();
