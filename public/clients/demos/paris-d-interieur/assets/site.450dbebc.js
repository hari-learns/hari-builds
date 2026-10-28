(function () {
  "use strict";
  var d = document, de = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  de.classList.add("js");

  /* concept strip */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("pdi-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("pdi-dock", "1"); }); });

  /* drawer */
  var burger = $("#burger"), drawer = $("#drawer"), dx = $("#drawer-x");
  function openD(o) {
    if (!drawer) return;
    drawer.classList.toggle("open", o); drawer.setAttribute("aria-hidden", o ? "false" : "true");
    burger.setAttribute("aria-expanded", o ? "true" : "false"); de.style.overflow = o ? "hidden" : "";
    if (o) dx.focus(); else burger.focus();
  }
  if (burger) { burger.addEventListener("click", function () { openD(true); }); dx.addEventListener("click", function () { openD(false); }); d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) openD(false); }); $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { openD(false); }); }); }

  /* reveals */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    rv.forEach(function (n) { io.observe(n); });
    setTimeout(function () { rv.forEach(function (n) { n.classList.add("in"); }); }, 6000);
  } else rv.forEach(function (n) { n.classList.add("in"); });

  /* hero: their four rooms, four verbs */
  var slides = $$(".hs"), verb = $("#hverb"), proj = $("#hproj"), pgs = $$(".hp"), cur = 0, timer = null;
  function show(i) {
    if (!slides.length || i === cur) return;
    slides[cur].classList.remove("on"); pgs[cur] && pgs[cur].classList.remove("on");
    cur = i; slides[cur].classList.add("on"); pgs[cur] && pgs[cur].classList.add("on");
    verb.classList.add("swap");
    setTimeout(function () { verb.textContent = slides[cur].dataset.verb; verb.classList.remove("swap"); }, 300);
    var arrow = proj.querySelector("svg"); proj.href = slides[cur].dataset.href; proj.firstChild.nodeValue = slides[cur].dataset.proj + " "; 
  }
  function play() { if (reduce || timer) return; timer = setInterval(function () { show((cur + 1) % slides.length); }, 5600); }
  function stop() { clearInterval(timer); timer = null; }
  if (slides.length) {
    pgs.forEach(function (b) { b.addEventListener("click", function () { stop(); show(+b.dataset.i); play(); }); });
    d.addEventListener("visibilitychange", function () { d.hidden ? stop() : play(); });
    var heroEl = $(".hero");
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? play() : stop(); }).observe(heroEl); else play();
  }

  /* before / after sliders */
  var bas = $$("[data-ba]");
  bas.forEach(function (f) {
    var r = $(".ba-r", f);
    function set(v) { f.style.setProperty("--pos", v + "%"); r.value = v; }
    r.addEventListener("input", function () { f.dataset.touched = "1"; set(+r.value); });
    f._set = set;
  });
  /* scroll-driven wipe: only where the scene is pinned (large, tall screens) */
  var pins = $$("[data-pin]");
  var mq = window.matchMedia("(min-width:1000px) and (min-height:720px)");
  function tick() {
    if (reduce || !mq.matches) return;
    var vh = innerHeight;
    pins.forEach(function (p) {
      var f = $("[data-ba]", p); if (!f || f.dataset.touched) return;
      var rc = p.getBoundingClientRect(), span = rc.height - vh * .75; if (span <= 0) return;
      var t = Math.min(1, Math.max(0, (-rc.top + vh * .1) / span));
      var k = Math.min(1, Math.max(0, (t - .08) / .72)); k = k * k * (3 - 2 * k);
      f._set(Math.round((100 - k * 100) * 10) / 10);
    });
  }
  if (pins.length && !reduce) {
    pins.forEach(function (p) { var f = $("[data-ba]", p); f._set(100); });
    var raf = 0; addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); }); }, { passive: true });
    addEventListener("resize", function () { if (!mq.matches) pins.forEach(function (p) { var f = $("[data-ba]", p); if (!f.dataset.touched) f._set(50); }); else tick(); });
    if (!mq.matches) pins.forEach(function (p) { $("[data-ba]", p)._set(50); }); else tick();
  }

  /* lightbox */
  var lb = $("#lb"), lbi = $("#lb-i"), gl = $$("[data-lb]"), li = 0;
  function lshow(i) { li = (i + gl.length) % gl.length; var a = gl[li], im = $("img", a); lbi.src = a.href; lbi.alt = im ? im.alt : ""; }
  if (lb && gl.length) {
    gl.forEach(function (a, i) { a.addEventListener("click", function (e) { if (!lb.showModal) return; e.preventDefault(); lshow(i); lb.showModal(); }); });
    $(".lb-x", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { lshow(li - 1); }); $(".lb-next", lb).addEventListener("click", function () { lshow(li + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") lshow(li - 1); if (e.key === "ArrowRight") lshow(li + 1); });
  }

  /* contact form: opens the visitor's mail app with the message ready (concept: no server) */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault(); var g = function (n) { return cf.elements[n].value; };
    var body = "Nom : " + g("nom") + "\nPrénom : " + g("prenom") + "\nE-mail : " + g("mail") + "\nTéléphone : " + g("tel") + "\nConcerne : " + g("concerne") + "\n\n" + g("message");
    location.href = "mailto:aurore@parisdinterieur.fr?subject=" + encodeURIComponent("Demande depuis le site : " + g("concerne")) + "&body=" + encodeURIComponent(body);
  });

  /* phone bar steps aside while Room Studio is on screen */
  var rsEl = $("#room");
  if (rsEl && "IntersectionObserver" in window) new IntersectionObserver(function (es) { d.body.classList.toggle("bar-off", es[0].isIntersecting); }, { threshold: 0 }).observe(rsEl);
})();
