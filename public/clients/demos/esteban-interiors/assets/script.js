/* Esteban Interiors concept: one IIFE, every feature existence-guarded. Native scroll; scenes read scroll position. */
(function () {
  "use strict";
  window.__ei = 1;
  var d = document, de = d.documentElement, W = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)");
  var PIN = W.matchMedia("(min-width: 960px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)");
  var vh = W.innerHeight, vw = W.innerWidth;

  /* ---------- header + drawer ---------- */
  var head = $("[data-head]"), hero = $("[data-hero]"), lastY = W.scrollY, dockEl = $("[data-dock]");
  function headState() {
    if (!head) return;
    var y = W.scrollY, limit = hero ? hero.offsetHeight - head.offsetHeight - 10 : 30;
    head.classList.toggle("is-solid", y > limit || !hero);
    if (dockEl) {
      var start = hero ? vh * 0.6 : 0, small = W.innerWidth < 900;
      dockEl.classList.toggle("is-away", y < start || (small && y > start + vh * 2.5 && !dockEl.matches(":focus-within")));
    }
    var hide = y > 500 && y > lastY + 4 && !d.body.classList.contains("menu-open");
    if (y < lastY - 4 || y < 200) head.classList.remove("is-hidden"); else if (hide) head.classList.add("is-hidden");
    lastY = y;
  }
  var burger = $("[data-burger]"), drawer = $("[data-drawer]");
  function menu(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    d.body.classList.toggle("menu-open", open);
    if (open) { var f = $("a", drawer); if (f) setTimeout(function () { f.focus(); }, 60); } else if (burger) burger.focus();
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { menu(true); });
    $("[data-close]", drawer).addEventListener("click", function () { menu(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) menu(false); });
  }

  /* ---------- reveals (observer + sweep safety net) ---------- */
  var rev = $$("[data-r]");
  function show(el) { el.classList.add("is-in"); }
  function sweep() {
    var lim = vh * 0.96;
    for (var i = rev.length - 1; i >= 0; i--) {
      var el = rev[i];
      if (el.classList.contains("is-in")) { rev.splice(i, 1); continue; }
      if (el.getBoundingClientRect().top < lim && el.offsetParent !== null) { show(el); rev.splice(i, 1); }
    }
  }
  if ("IntersectionObserver" in W && !RM.matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(show); rev = []; }

  /* ---------- hero slider (their four slides) ---------- */
  var H = null;
  if (hero) {
    var slides = $$("[data-slide]", hero), frames = $$("[data-frame]", hero), titles = $$("[data-title]", hero), dots = $$("[data-dot]", hero), count = $("[data-count]", hero);
    var cur = 0, timer = null, N = slides.length;
    var go = function (i) {
      i = (i + N) % N; if (i === cur) return;
      [slides, frames, titles, dots].forEach(function (arr) { if (arr[cur]) arr[cur].classList.remove("is-on"); if (arr[i]) arr[i].classList.add("is-on"); });
      titles.forEach(function (t, k) { if (k === i) t.removeAttribute("aria-hidden"); else t.setAttribute("aria-hidden", "true"); });
      $$("a", hero).forEach(function (a) { if (a.closest("[data-title]")) a.tabIndex = a.closest("[data-title]") === titles[i] ? 0 : -1; });
      cur = i; if (count) count.textContent = (i < 9 ? "0" : "") + (i + 1);
      var im = slides[i].querySelector("img"); if (im && im.loading === "lazy") im.loading = "eager";
      var nx = slides[(i + 1) % N].querySelector("img"); if (nx) nx.loading = "eager";
    };
    var restart = function () {
      clearInterval(timer); hero.classList.remove("is-playing");
      if (RM.matches || d.hidden) return;
      void hero.offsetWidth; hero.classList.add("is-playing");
      timer = setInterval(function () { if ((H && H.p > 0.35) || d.hidden) return; go(cur + 1); restart(); }, 6500);
    };
    $$("a", hero).forEach(function (a) { if (a.closest("[data-title]") && a.closest("[data-title]") !== titles[0]) a.tabIndex = -1; });
    dots.forEach(function (b, k) { b.addEventListener("click", function () { go(k); restart(); }); });
    var pv = $("[data-prev]", hero), nv = $("[data-next]", hero);
    if (pv) pv.addEventListener("click", function () { go(cur - 1); restart(); });
    if (nv) nv.addEventListener("click", function () { go(cur + 1); restart(); });
    var sx = null, sy = null;
    hero.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { go(cur + (dx < 0 ? 1 : -1)); restart(); } sx = null;
    }, { passive: true });
    d.addEventListener("visibilitychange", restart);
    H = { el: hero, p: 0 };
    // warm the next slide after first paint
    W.addEventListener("load", function () { setTimeout(function () { slides.forEach(function (s, k) { if (k) { var im = s.querySelector("img"); if (im) im.loading = "eager"; } }); frames.forEach(function (f) { var im = f.querySelector("img"); if (im) im.loading = "eager"; }); }, 1200); });
    restart();
  }

  /* ---------- scroll scenes ---------- */
  var stack = $("[data-stack]"), track = $("[data-track]");
  var sImgs = stack ? $$("[data-stack-img]", stack) : [], sTxt = stack ? $$("[data-stack-text]", stack) : [];
  var tInner = track ? $("[data-track-inner]", track) : null, tBar = track ? $("[data-track-bar]", track) : null, tView = track ? $(".homes__viewport", track) : null;
  var over = 0;
  function measure() {
    vh = W.innerHeight; vw = W.innerWidth;
    var pin = PIN.matches;
    [hero, stack, track].forEach(function (el) { if (el) el.classList.toggle("can-pin", pin); });
    if (track && tInner) {
      if (pin) {
        tInner.style.transform = "";
        over = Math.max(0, tInner.scrollWidth - vw);
        track.style.setProperty("--th", (over + vh * 1.1) + "px");
      } else { track.style.removeProperty("--th"); over = 0; }
    }
    if (stack && !pin) sImgs.forEach(function (im) { im.style.removeProperty("--r"); im.style.removeProperty("--u"); });
  }
  function prog(el) { var r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh), 0, 1); }
  function scenes() {
    var pin = PIN.matches;
    if (hero) {
      var r = hero.getBoundingClientRect();
      var p = pin ? prog(hero) : (RM.matches ? 0 : clamp(-r.top / Math.max(1, r.height), 0, 1) * 0.5);
      H.p = p; hero.style.setProperty("--p", p.toFixed(4));
    }
    if (stack && pin) {
      var sp = prog(stack), n = sImgs.length, seg = sp * (n - 1) * 1.08, act = 0;
      var rs = sImgs.map(function (im, i) { if (!i) return 1; var t = clamp((seg - (i - 1)) * 1.7 - 0.35, 0, 1); return t * t * (3 - 2 * t); });
      sImgs.forEach(function (im, i) {
        im.style.setProperty("--r", rs[i].toFixed(4));
        im.style.setProperty("--u", (i + 1 < n ? rs[i + 1] : 0).toFixed(4));
        if (rs[i] > 0.5) act = i;
      });
      sTxt.forEach(function (t, i) { t.classList.toggle("is-on", i === act); });
    }
    if (track) {
      if (pin && over > 0) {
        var tp = prog(track);
        track.style.setProperty("--tx", (-tp * over).toFixed(1) + "px");
        if (tBar) tBar.parentNode.style.setProperty("--tp", (0.12 + tp * 0.88).toFixed(3));
      } else if (tView && tBar) {
        var m = tView.scrollWidth - tView.clientWidth;
        tBar.parentNode.style.setProperty("--tp", (0.12 + (m > 0 ? tView.scrollLeft / m : 1) * 0.88).toFixed(3));
      }
    }
  }
  var ticking = false;
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; headState(); scenes(); sweep(); }); }
  W.addEventListener("scroll", onScroll, { passive: true });
  if (tView) tView.addEventListener("scroll", onScroll, { passive: true });
  var lastW = vw;
  W.addEventListener("resize", function () {
    var touch = W.matchMedia("(hover: none)").matches;
    if (touch && W.innerWidth === lastW) { vh = W.innerHeight; return; } // URL bar only
    lastW = W.innerWidth; measure(); onScroll();
  });
  if (PIN.addEventListener) PIN.addEventListener("change", function () { measure(); onScroll(); });
  W.addEventListener("load", function () { measure(); onScroll(); });
  W.addEventListener("pageshow", function () { measure(); onScroll(); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { measure(); onScroll(); });
  measure(); headState(); scenes(); sweep();

  /* ---------- testimonials row ---------- */
  var qrow = $("[data-q-row]");
  if (qrow) {
    var step = function (dir) { var c = qrow.querySelector(".quote"); qrow.scrollBy({ left: dir * (c ? c.getBoundingClientRect().width + 32 : 400), behavior: RM.matches ? "auto" : "smooth" }); };
    var qp = $("[data-q-prev]"), qn = $("[data-q-next]");
    if (qp) qp.addEventListener("click", function () { step(-1); });
    if (qn) qn.addEventListener("click", function () { step(1); });
  }

  /* ---------- portfolio filter ---------- */
  var chips = $$("[data-filter]");
  if (chips.length) {
    var cells = $$(".pcell");
    var apply = function (v) {
      chips.forEach(function (c) { var on = c.getAttribute("data-filter") === v; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      cells.forEach(function (c) { var ok = v === "all" || c.getAttribute("data-cat") === v; c.hidden = !ok; if (ok) c.classList.add("is-in"); });
      onScroll();
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); }); });
  }

  /* ---------- gallery lightbox ---------- */
  var box = $("[data-lb-box]"), items = $$("[data-lb]");
  if (box && items.length) {
    var bimg = $(".lb__img", box), bi = 0, opener = null;
    var setI = function (i) { bi = (i + items.length) % items.length; var it = items[bi]; bimg.src = it.getAttribute("data-full"); var im = it.querySelector("img"); bimg.alt = im ? im.alt : ""; if (im) { bimg.width = im.width; bimg.height = im.height; } bimg.removeAttribute("width"); bimg.removeAttribute("height"); };
    var openB = function (i, el) { opener = el; setI(i); box.hidden = false; de.style.overflow = "hidden"; $("[data-lb-close]", box).focus(); };
    var closeB = function () { box.hidden = true; de.style.overflow = ""; if (opener) opener.focus(); };
    items.forEach(function (it, i) { it.addEventListener("click", function () { openB(i, it); }); });
    $("[data-lb-close]", box).addEventListener("click", closeB);
    $("[data-lb-prev]", box).addEventListener("click", function () { setI(bi - 1); });
    $("[data-lb-next]", box).addEventListener("click", function () { setI(bi + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) closeB(); });
    d.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") closeB(); else if (e.key === "ArrowLeft") setI(bi - 1); else if (e.key === "ArrowRight") setI(bi + 1);
    });
    var lx = null;
    box.addEventListener("touchstart", function (e) { lx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) { if (lx === null) return; var dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 50) setI(bi + (dx < 0 ? 1 : -1)); lx = null; }, { passive: true });
  }

  /* ---------- YouTube on tap (their own video tours) ---------- */
  $$("[data-yt]").forEach(function (y) {
    var b = $("button", y);
    if (b) b.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + y.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label"); f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
      y.replaceChild(f, b);
    });
  });

  /* ---------- contact form -> their inbox via mailto ---------- */
  var mf = $("[data-mailform]");
  if (mf) mf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { return (mf.elements[n] && mf.elements[n].value || "").trim(); };
    var body = g("message") + "\n\n" + g("name") + "\n" + g("email");
    W.location.href = "mailto:" + mf.getAttribute("data-to") + "?subject=" + encodeURIComponent(mf.getAttribute("data-subject") + " - " + g("name")) + "&body=" + encodeURIComponent(body);
  });

  /* ---------- concept dock ---------- */
  var dock = $("[data-dock]");
  if (dock) {
    try { if (sessionStorage.getItem("ei-dock") === "0") dock.hidden = true; } catch (e) {}
    var dc = $("[data-dock-close]", dock);
    if (dc) dc.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("ei-dock", "0"); } catch (e) {} });
  }
})();
