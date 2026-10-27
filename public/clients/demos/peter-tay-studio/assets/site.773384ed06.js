/* Peter Tay Studio concept: one IIFE, no libraries. Restrained motion from their own photographs:
   the hero slideshow cross-fade with a slow settle, curtain reveals of project photos, a gentle parallax inside image frames. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- header state, sticky bar, dock */
  var hdr = $(".hdr"), bar = $(".bar"), isHome = d.body.classList.contains("home");
  function onScroll() {
    var y = W.scrollY || 0;
    if (hdr) hdr.classList.toggle("is-scrolled", isHome ? y > W.innerHeight * 0.6 : y > 8);
    if (bar) bar.classList.toggle("is-on", y > W.innerHeight * 0.55 || !isHome);
  }
  W.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  /* the bar steps aside while Room Studio is on screen so it never covers the form or its button */
  var studio = $("#studio");
  if (bar && studio && "IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { bar.classList.toggle("is-off", es[0].isIntersecting); }, { rootMargin: "0px 0px -5% 0px" }).observe(studio);
  }
  var dock = $(".dock");
  if (dock) {
    try { if (sessionStorage.getItem("pts-dock") === "1") dock.hidden = true; } catch (e) {}
    var db = $("button", dock);
    if (db) db.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("pts-dock", "1"); } catch (e) {} });
  }

  /* ---------- drawer */
  var burger = $(".hdr .burger"), drawer = $(".drawer");
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    de.style.overflow = open ? "hidden" : "";
    if (open) { var c = $(".drawer__close", drawer); if (c) c.focus(); } else burger.focus({ preventScroll: true });
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(true); });
    $$(".drawer__close, .drawer nav a", drawer).forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- reveals (IntersectionObserver + a sweep that never strands content) */
  var rv = $$(".rv, .story__fig");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in W && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = W.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.94) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* ---------- gentle parallax: the photo drifts inside its frame (max 8% of its height) */
  var par = $$("[data-par]");
  if (par.length && !RM) {
    var ticking = false;
    function para() {
      ticking = false; var vh = W.innerHeight;
      par.forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); /* -1..1 */
        var im = el.querySelector("img"); if (im) im.style.transform = "translate3d(0," + (p * -6).toFixed(2) + "%,0)";
      });
    }
    W.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    W.addEventListener("resize", para); para();
  }

  /* ---------- hero: their slideshow, one slide at a time, later slides load after the page */
  var slides = $$(".hero__img"), caps = $$(".hero__cap"), cnt = $(".hero__count b"), cur = 0, timer = null;
  function ready(im) { return !im.dataset.src && im.complete && im.naturalWidth > 0; }
  function go(i) {
    var n = (i + slides.length) % slides.length;
    if (!ready(slides[n])) return; /* never fade to an empty frame */
    slides[cur].classList.remove("is-on"); if (caps[cur]) caps[cur].classList.remove("is-on");
    cur = n; slides[cur].classList.add("is-on"); if (caps[cur]) caps[cur].classList.add("is-on");
    if (cnt) cnt.textContent = String(cur + 1).padStart(2, "0");
  }
  W.addEventListener("load", function () {
    $$("img[data-src]").forEach(function (im) { if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute("data-src"); im.removeAttribute("data-srcset"); });
    if (slides.length > 1 && !RM) timer = setInterval(function () { if (!d.hidden) go(cur + 1); }, 5200);
  });

  /* ---------- projects filter */
  var chips = $$(".chip[data-cat]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var cat = c.dataset.cat;
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $$(".grid li[data-cat]").forEach(function (li) { li.hidden = !(cat === "all" || li.dataset.cat === cat); });
      sweep();
    });
  });
})();
