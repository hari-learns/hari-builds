/* Studio Anja Vissers concept: one IIFE, every feature guarded. Motion acts only on their own photos and words. */
(function () {
  "use strict";
  var w = window, d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = w.gsap, ST = w.ScrollTrigger;
  var canPin = function () { return w.innerWidth >= 900 && w.innerHeight >= 640; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (dock && sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });
  if (dock && w.innerWidth < 760) { setTimeout(function () { dock.hidden = true; }, 9000); w.addEventListener("scroll", function hideDock() { if (w.scrollY > 500) { dock.hidden = true; w.removeEventListener("scroll", hideDock); } }, { passive: true }); }

  /* ---------- drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (w.__lenis) open ? w.__lenis.stop() : w.__lenis.start();
    if (open) { var f = $(".drawer__nav a", drawer); if (f) f.focus(); } else burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ---------- header state + phone bar */
  var hdr = $("#hdr"), bar = $(".bar"), lastY = w.scrollY;
  var heroEl = $("#hero");
  function onScrollUi() {
    var y = w.scrollY;
    if (bar && heroEl) bar.classList.toggle("is-hidden", y < w.innerHeight * 0.55);
    if (hdr) {
      hdr.classList.toggle("is-scrolled", y > 40);
      var down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > 400) hdr.classList.add("is-hidden"); else if (up || y < 200) hdr.classList.remove("is-hidden");
    }
    lastY = y;
  }
  w.addEventListener("scroll", onScrollUi, { passive: true }); onScrollUi();

  /* ---------- reveals with safety net (no content stranded at opacity 0) */
  var rise = $$("[data-rise]");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in w)) rise.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rise.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = w.innerHeight; rise.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- index filter */
  var chips = $$(".chip"), cards = $$(".card");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-f");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      cards.forEach(function (k) { var on = f === "*" || k.getAttribute("data-t") === f; k.hidden = !on; if (on) show(k); });
      if (ST) ST.refresh();
    });
  });

  /* ---------- contact form -> pre-filled e-mail */
  var mf = $("#mform");
  if (mf) {
    var bj = {}; try { bj = JSON.parse($("#budgets").textContent); } catch (e) {}
    var si = $("#f-int"), sb = $("#f-bud");
    var fill = function () { sb.innerHTML = ""; (bj[si.value] || []).forEach(function (o) { var op = d.createElement("option"); op.textContent = o; sb.appendChild(op); }); };
    si.addEventListener("change", fill); fill();
    mf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var lines = $$("input,select,textarea", mf).map(function (el) { return el.name + ": " + (el.value || "").trim(); });
      location.href = "mailto:" + mf.getAttribute("data-to") + "?subject=" + encodeURIComponent(mf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------- counters (their real counts) */
  var counters = $$("[data-count]");
  if (!reduce && counters.length && "IntersectionObserver" in w) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-count"), from = to > 1900 ? 1900 : 0, t0 = performance.now(), dur = 1400;
        var step = function (t) { var k = clamp((t - t0) / dur, 0, 1); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); else el.textContent = to; };
        el.textContent = from; requestAnimationFrame(step); setTimeout(function () { el.textContent = to; }, dur + 400);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- hero slideshow (their 8 photos) */
  var hero = $("#hero");
  if (hero) {
    var slides = $$(".hero__slide", hero), caps = $$(".hero__cap", hero), cur = 0, timer = null;
    var loadSlide = function (s) { var im = $("img", s); if (im && im.getAttribute("data-src")) { im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); } };
    var go = function (n) {
      slides[cur].classList.remove("is-on"); caps[cur].classList.remove("is-on"); caps[cur].tabIndex = -1;
      cur = n % slides.length; loadSlide(slides[(cur + 1) % slides.length]);
      slides[cur].classList.add("is-on"); caps[cur].classList.add("is-on"); caps[cur].tabIndex = 0;
    };
    var play = function () { if (!timer && !reduce) timer = setInterval(function () { go(cur + 1); }, 5500); };
    var stop = function () { clearInterval(timer); timer = null; };
    w.addEventListener("load", function () { loadSlide(slides[1]); play(); });
    d.addEventListener("visibilitychange", function () { d.hidden ? stop() : play(); });
  }

  /* ---------- Room Studio: the UI is fully Dutch via its JSON `text` option; only the enquiry e-mail the widget
     composes itself is translated here (strings from the host's data-rs-mail attribute) */
  function patchRoomStudio() {
    $$("[data-roomstudio]").forEach(function (el) {
      var inst = el.__rs, M; if (!inst || inst.__nl) return;
      try { M = JSON.parse(el.getAttribute("data-rs-mail") || "{}"); } catch (e) { return; }
      inst.__nl = true;
      var proto = Object.getPrototypeOf(inst);
      var fmt = function (s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); };
      var lc = function (s) { return String(s || "").toLowerCase(); };
      inst.message = function () {
        var o = this.s.lead, r = this.render, link = this.shareUrl();
        var lines = [fmt(M.hello, { b: this.c.brand, room: lc((r && r.room) || this.s.room), s: (r && r.style) || this.style.label }),
          link ? fmt(M.link, { u: link }) : "", r && r.notes ? fmt(M.asked, { t: r.notes }) : "", "",
          M.name + ": " + o.name, o.phone ? M.phone + ": " + o.phone : "", o.email ? M.email + ": " + o.email : "", o.msg ? "\n" + o.msg : ""];
        return lines.filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n").trim();
      };
      inst.send = function (via) {
        if (via !== "mail") return proto.send.call(this, via);
        var o = this.s.lead, c = this.c.contact || {};
        if (!o.name.trim() || !(o.phone.trim() || o.email.trim())) return this.set({ error: this.t.needContact });
        var subj = fmt(M.subject, { room: lc(this.s.room), s: (this.render && this.render.style) || "" });
        location.href = "mailto:" + c.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(this.message());
        try { w.goatcounter && w.goatcounter.count && w.goatcounter.count({ path: "roomstudio-pass-mail", title: "Room Studio: pass-mail", event: true }); } catch (e) {}
        this.set({ phase: "sent", sentName: o.name.trim().split(" ")[0], error: "" });
      };
    });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", patchRoomStudio); else patchRoomStudio();
  w.addEventListener("load", patchRoomStudio);

  /* ---------- motion (GSAP + ScrollTrigger + Lenis), skipped entirely for reduced motion */
  if (reduce || !G || !ST) { if (hero) hero.querySelector(".hero__media").style.setProperty("--p", 0); return; }
  G.registerPlugin(ST);
  root.classList.add("has-motion");
  if (canPin()) root.classList.add("has-pin");

  if (w.Lenis && w.innerWidth >= 900) {
    var lenis = new w.Lenis({ duration: 1.1, smoothWheel: true });
    w.__lenis = lenis;
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) { a.addEventListener("click", function (e) { var id = a.getAttribute("href"); if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo($(id), { offset: -80 }); } }); });
  }

  var mm = G.matchMedia();

  /* aperture: the framed hero photo opens to full-bleed */
  if (hero) {
    var media = $(".hero__media", hero), line = $(".hero__line", hero), stage = $(".hero__stage", hero);
    var setP = function (p) { media.style.setProperty("--p", p.toFixed(4)); hero.classList.toggle("is-open", p > (w.innerWidth >= 900 ? 0.6 : 0.9)); };
    mm.add("(min-width: 900px) and (min-height: 640px)", function () {
      var st = ST.create({ trigger: hero, start: "top top-=1", end: "+=90%", pin: stage, scrub: 0.6, onUpdate: function (s) { setP(s.progress); } });
      return function () { st.kill(); setP(0); };
    });
    mm.add("(max-width: 899px), (max-height: 639px)", function () {
      var st = ST.create({ trigger: hero, start: "top top", end: "bottom 30%", scrub: 0.4, onUpdate: function (s) { setP(clamp(s.progress * 1.6, 0, 1)); } });
      return function () { st.kill(); setP(0); };
    });
    if (line) G.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "expo.out", delay: 0.6 });
  }

  /* zoom-out: their photos settle as they cross the screen */
  $$("[data-zoom]").forEach(function (im) {
    G.fromTo(im, { scale: 1.07 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im.parentElement, start: "top bottom", end: "bottom 40%", scrub: true } });
  });
  /* gentle parallax: their collage photos drift at slightly different speeds (desktop only) */
  mm.add("(min-width: 900px)", function () {
    $$("[data-par]").forEach(function (im) {
      var v = +im.getAttribute("data-par") || 6, box = im.closest("figure,a") || im.parentElement;
      G.fromTo(box, { yPercent: v }, { yPercent: -v, ease: "none", scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });
  /* project heads: framed photo opens */
  $$("[data-aperture]").forEach(function (el) {
    ST.create({ trigger: el, start: "top 85%", end: "top 15%", scrub: 0.5, onUpdate: function (s) { el.style.setProperty("--p", s.progress.toFixed(4)); } });
  });

  w.addEventListener("load", function () { ST.refresh(); });
})();
