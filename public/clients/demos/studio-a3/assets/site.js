/* Studio A3 concept: one IIFE, every feature existence-guarded. Motion acts only on their real photos and text. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, w = window;
  de.classList.add("js");
  var RM = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* split h1 into lines (words wrapped, then grouped by offsetTop) */
  $$("[data-split]").forEach(function (el) {
    el.classList.add("is-split");
    if (RM) return;
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (x) { return '<span class="sw">' + x.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(" ");
    var spans = $$(".sw", el), lines = [], top = null;
    spans.forEach(function (s) { if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop; } lines[lines.length - 1].push(s.textContent); });
    el.setAttribute("aria-label", words.join(" "));
    el.innerHTML = lines.map(function (l, i) { return '<span class="line" aria-hidden="true"><span style="--i:' + i + '">' + l.join(" ").replace(/&/g, "&amp;") + "</span></span>"; }).join("");
  });

  /* header: transparent over hero, solid after; hide on scroll down */
  var dockEl = $("[data-dock]");
  var head = $("[data-head]"), hero = $("[data-hero]"), bar = $("[data-phonebar]"), lastY = 0;
  function onScroll() {
    var y = w.scrollY || 0, hp = hero ? $("[data-hero-panels]", hero) : null, hh = hp ? hp.offsetHeight - 70 : 40;
    if (head) {
      head.classList.toggle("is-solid", y > 8);
      head.classList.toggle("is-hidden", y > 400 && y > lastY + 4 && !d.body.classList.contains("menu-open"));
      if (y < lastY - 4) head.classList.remove("is-hidden");
    }
    if (bar) bar.classList.toggle("is-on", y > (hero ? hero.offsetHeight * 0.85 : 260));
    lastY = y;
  }
  w.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("[data-drawer]"), burger = $("[data-burger]");
  function setMenu(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : ""; d.body.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) { var f = $("a", drawer); f && f.focus(); } else if (burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(true); });
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { setMenu(false); }); });
  d.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer && drawer.classList.contains("is-open")) setMenu(false); });

  /* phone bar steps aside where the contact form or footer is on screen */
  if (bar && "IntersectionObserver" in w) {
    var offs = new Set();
    var bio = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) offs.add(x.target); else offs.delete(x.target); }); bar.classList.toggle("is-off", offs.size > 0); });
    $$(".contact, .site-foot, .cta-band").forEach(function (el) { bio.observe(el); });
  }

  /* concept dock */
  var dock = $("[data-dock]");
  try { if (dock && sessionStorage.getItem("a3dock") === "1") dock.hidden = true; } catch (e) {}
  var dx = $("[data-dock-x]");
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("a3dock", "1"); } catch (e) {} });

  /* reveals with a safety net (anything at or above the fold is shown) */
  var rev = $$("[data-reveal]");
  function sweep() { var vh = w.innerHeight; rev.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.94) el.classList.add("is-in"); }); }
  if ("IntersectionObserver" in w && !RM) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add("is-in"); });
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* intro words light up as you read */
  var words = $$("[data-words] .w");
  function lightWords() {
    if (!words.length) return;
    var vh = w.innerHeight;
    words.forEach(function (s) { var t = s.getBoundingClientRect().top; s.classList.toggle("on", RM || t < vh * 0.78); });
  }
  if (words.length) { w.addEventListener("scroll", lightWords, { passive: true }); w.addEventListener("resize", lightWords); lightWords(); }

  /* before/after */
  $$("[data-ba]").forEach(function (ba) {
    var r = $("[data-ba-range]", ba);
    if (r) r.addEventListener("input", function () { ba.style.setProperty("--pos", r.value + "%"); });
  });

  /* projects filter */
  var grid = $("[data-pgrid]");
  $$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      $$("[data-filter]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      if (grid) $$(".pcard", grid).forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); });
      if (w.ScrollTrigger) w.ScrollTrigger.refresh();
    });
  });

  /* enquiry form -> pre-filled email */
  $$("[data-eform]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!f.reportValidity()) return;
      var g = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ""; };
      var body = "Name: " + g("name") + "\nEmail: " + g("email") + "\nPhone: " + g("phone") + "\nProject: " + g("type") + "\nHow I found Studio A3: " + g("source") + "\n\n" + g("message");
      w.location.href = f.getAttribute("action") + "?subject=" + encodeURIComponent("Enquiry: " + g("type") + " (" + g("name") + ")") + "&body=" + encodeURIComponent(body);
    });
  });

  /* lightbox */
  var dlg = $("[data-lb-dialog]");
  if (dlg && dlg.showModal) {
    var items = $$("[data-lb]"), li = 0, im = $("[data-lb-img]", dlg);
    var show = function (i) { li = (i + items.length) % items.length; im.src = items[li].getAttribute("data-lb"); var s = $("img", items[li]); im.alt = s ? s.alt : ""; };
    items.forEach(function (b, i) { b.addEventListener("click", function () { show(i); dlg.showModal(); if (lenis) lenis.stop(); }); });
    $("[data-lb-close]", dlg).addEventListener("click", function () { dlg.close(); });
    $("[data-lb-prev]", dlg).addEventListener("click", function () { show(li - 1); });
    $("[data-lb-next]", dlg).addEventListener("click", function () { show(li + 1); });
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (ev) { if (ev.key === "ArrowLeft") show(li - 1); if (ev.key === "ArrowRight") show(li + 1); });
  }

  /* smooth scroll + GSAP scenes (desktop/tablet; reduced motion gets the static site) */
  var lenis = null;
  function boot() {
    if (RM) return;
    var fine = w.matchMedia("(pointer: fine)").matches;
    if (w.Lenis && fine) {
      lenis = new w.Lenis({ lerp: 0.1, smoothWheel: true });
      var raf = function (t) { lenis.raf(t); w.requestAnimationFrame(raf); }; w.requestAnimationFrame(raf);
      if (w.ScrollTrigger) lenis.on("scroll", w.ScrollTrigger.update);
      $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (ev) { var t = $(a.getAttribute("href")); if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }); });
    }
    if (!w.gsap || !w.ScrollTrigger) return;
    var gsap = w.gsap, ST = w.ScrollTrigger; gsap.registerPlugin(ST);
    var mm = gsap.matchMedia();

    /* hero: the diptych drifts and the copy lifts away as you scroll */
    if (hero) {
      mm.add("(min-width: 1px)", function () {
        var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
        tl.to($$(".hp-img img", hero), { yPercent: 4, ease: "none" }, 0)
;
      });
    }

    /* journey: moodboard -> plan -> 3D -> photo, layered and pinned */
    var J = $("[data-journey]");
    if (J) {
      mm.add("(min-width: 900px) and (min-height: 640px)", function () {
        J.classList.add("is-pinnable");
        var layers = $$(".jl", J), steps = $$(".js-step", J), barEl = $("[data-journey-bar]", J), n = layers.length;
        layers.forEach(function (l, i) { if (i) gsap.set(l, { clipPath: "inset(100% 0% 0% 0%)" }); gsap.set($("img", l), { scale: i ? 1.05 : 1 }); });
        var setStep = function (k) { steps.forEach(function (s, i) { s.classList.toggle("is-on", i === k); }); };
        setStep(0);
        var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: $("[data-journey-pin]", J), start: "top top", end: "+=" + (n * 45) + "%", pin: true, scrub: 0.6, anticipatePin: 1,
          onUpdate: function (self) { var t = self.animation ? self.animation.time() : 0, k = 0; for (var q = 1; q < n; q++) if (t > q - 0.4) k = q; setStep(k); if (barEl) barEl.style.transform = "scaleX(" + ((self.progress * (n - 1) + 1) / n) * 4 + ")"; } } });
        for (var i = 1; i < n; i++) {
          tl.to(layers[i], { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i - 1 + 0.15)
            .to($("img", layers[i]), { scale: 1, duration: 1 }, i - 1 + 0.15)
            .to($("img", layers[i - 1]), { scale: 0.985, duration: 1 }, i - 1 + 0.15);
        }
        tl.to({}, { duration: 0.4 });
        return function () { J.classList.remove("is-pinnable"); layers.forEach(function (l) { gsap.set(l, { clearProps: "clipPath" }); gsap.set($("img", l), { clearProps: "transform" }); }); };
      });
    }

    /* photos settle as they enter (cards, services, gallery, showroom) */
    $$(".svc-img img, .show-img img, .g-item img, .pgrid .pcard-img img, .hcard .pcard-img img, .next-img img").forEach(function (im) {
      gsap.fromTo(im, { scale: 1.04 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im.parentNode, start: "top bottom", end: "top 35%", scrub: true } });
    });
    /* page hero parallax */
    $$("[data-parallax]").forEach(function (el) {
      gsap.to($("img", el), { yPercent: 6, ease: "none", scrollTrigger: { trigger: el.parentNode, start: "top top", end: "bottom top", scrub: true } });
    });
    w.addEventListener("load", function () { ST.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})();
