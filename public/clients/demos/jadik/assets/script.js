(function () {
  "use strict";
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // concept dock
  var dx = d.getElementById("dock-x");
  if (dx) dx.addEventListener("click", function () { de.classList.add("dock-off"); try { sessionStorage.setItem("jd-dock", "1"); } catch (e) {} });

  // drawer
  var burger = d.querySelector(".burger"), drawer = d.getElementById("drawer");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(!drawer.classList.contains("is-open")); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (innerWidth >= 1180) setDrawer(false); });

  // hero slideshow: same four photos as their current hero; extra slides load after the page
  var slides = [].slice.call(d.querySelectorAll(".hero__slide"));
  if (slides.length > 1) {
    var dots = [].slice.call(d.querySelectorAll(".hero__dots button")), cap = d.getElementById("hero-cap"), cur = 0, timer = null;
    var loadAll = function () {
      slides.forEach(function (s) { var im = s.querySelector("img[data-src]"); if (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute("data-src"); } });
    };
    var show = function (i) {
      slides[cur].classList.remove("is-on"); dots[cur] && dots[cur].removeAttribute("aria-current");
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add("is-on"); dots[cur] && dots[cur].setAttribute("aria-current", "true");
      if (cap) cap.textContent = slides[cur].getAttribute("data-cap");
    };
    var start = function () { if (reduce) return; clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 7000); };
    dots.forEach(function (b, i) { b.addEventListener("click", function () { loadAll(); show(i); start(); }); });
    if (d.readyState === "complete") { loadAll(); start(); } else window.addEventListener("load", function () { setTimeout(function () { loadAll(); start(); }, 600); });
    d.addEventListener("visibilitychange", function () { if (d.hidden) clearInterval(timer); else start(); });
  }

  // reveals
  var rv = [].slice.call(d.querySelectorAll(".rv"));
  var act = function (el) { el.classList.add("in"); };
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(act);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { act(x.target); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) act(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  // gallery
  var gm = d.getElementById("galmain");
  if (gm) d.querySelectorAll(".gal__th button").forEach(function (b) {
    b.addEventListener("click", function () {
      var im = gm.querySelector("img"); im.removeAttribute("srcset"); im.src = b.dataset.full; im.width = b.dataset.w; im.height = b.dataset.h;
      d.querySelectorAll(".gal__th button").forEach(function (x) { x.removeAttribute("aria-current"); }); b.setAttribute("aria-current", "true");
    });
  });

  // catalogue filter
  var grid = d.getElementById("grid");
  if (grid) {
    var q = d.getElementById("q"), cnt = d.getElementById("count"), chips = [].slice.call(d.querySelectorAll("#filt .chip")), fam = "";
    var cards = [].slice.call(grid.querySelectorAll(".card")), word = cnt.textContent.replace(/^\d+\s*/, "");
    var run = function () {
      var t = (q.value || "").trim().toLowerCase(), n = 0;
      cards.forEach(function (c) { var ok = (!fam || c.dataset.f === fam) && (!t || c.dataset.n.indexOf(t) > -1); c.hidden = !ok; if (ok) { n++; c.classList.add("in"); } });
      cnt.textContent = n + " " + word;
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { fam = c.dataset.f; chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); run(); }); });
    q.addEventListener("input", run);
    var h = location.hash.replace("#", ""); if (h) { var hc = chips.filter(function (c) { return c.dataset.f === h; })[0]; if (hc) hc.click(); }
  }

  // open now (Europe/Warsaw)
  d.querySelectorAll(".open").forEach(function (el) {
    try {
      var s = JSON.parse(el.dataset.open);
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      var wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.filter(function (p) { return p.type === "weekday"; })[0].value];
      var hr = +parts.filter(function (p) { return p.type === "hour"; })[0].value;
      var open = s.days.indexOf(wd) > -1 && hr >= s.open && hr < s.close;
      el.textContent = open ? el.dataset.yes : el.dataset.no; el.classList.toggle("is-open", open);
    } catch (e) {}
  });
})();
