/* Zigma rebrand trailer. One IIFE, every feature existence-guarded. All motion acts on their real content. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, W = window;
  var RM = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = W.gsap, ST = W.ScrollTrigger, hasG = !!(G && ST);
  if (hasG) G.registerPlugin(ST);
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var hdr = $("#hdr");
  var hdrH = function () { return hdr ? hdr.getBoundingClientRect().height : 0; };

  /* ---------- 1 · intro loader: their logo's three leaves assemble, then travel into the header logo ---------- */
  var introQ = [], introDone = false;
  function whenIntroDone(cb) { if (introDone) cb(); else introQ.push(cb); }
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    de.classList.add("is-ready");
    introQ.splice(0).forEach(function (cb) { try { cb(); } catch (err) { console.warn("[intro]", err); } });
  }
  var loader = $("#loader");
  if (!loader || de.classList.contains("no-intro") || getComputedStyle(loader).display === "none") {
    finishIntro();
  } else {
    var skip = function () { finishIntro(); };
    loader.addEventListener("click", skip);
    loader.addEventListener("touchstart", skip, { passive: true });
    d.addEventListener("keydown", function k() { skip(); d.removeEventListener("keydown", k); });
    var now = W.performance ? performance.now() : 0;
    if (RM) setTimeout(finishIntro, Math.max(0, 600 - now));
    else if (now < 780) setTimeout(handoff, 860 - now);
    else setTimeout(finishIntro, Math.max(0, 1400 - now));
    setTimeout(finishIntro, 2600); /* the page can never get stuck behind the intro */
  }
  function handoff() {
    if (introDone) return;
    var lock = $("#lkmark"), brand = $(".brand__img");
    if (!lock || !brand) return finishIntro();
    var L = lock.getBoundingClientRect(), B = brand.getBoundingClientRect();
    if (!B.width || !L.width || B.top < 0) return finishIntro();
    var tx = B.left + B.width / 2 - (L.left + L.width / 2), ty = B.top + B.height / 2 - (L.top + L.height / 2);
    loader.classList.add("is-leaving");
    lock.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + (B.width / L.width).toFixed(4) + ")";
    lock.style.opacity = "0";
    setTimeout(finishIntro, 470);
  }

  /* ---------- 2 · smooth scroll (Lenis) + anchor links ---------- */
  var lenis = null;
  if (!RM && W.Lenis) {
    try {
      lenis = new W.Lenis({ lerp: 0.1, smoothWheel: true });
      if (hasG) { lenis.on("scroll", ST.update); G.ticker.add(function (t) { lenis.raf(t * 1000); }); G.ticker.lagSmoothing(0); }
      else { var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    } catch (err) { console.warn("[lenis] disabled:", err); lenis = null; }
  }
  function goTo(id) {
    var el = id === "top" ? d.body : d.getElementById(id);
    if (!el) return false;
    if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { offset: -(hdrH() + 14), duration: 1.1 });
    else if (id === "top") W.scrollTo(0, 0);
    else W.scrollTo(0, el.getBoundingClientRect().top + W.pageYOffset - hdrH() - 14);
    return true;
  }

  /* ---------- 3 · header state + phone action bar ---------- */
  var bar = $("#bar");
  d.body.classList.add("has-bar");
  function onScroll() {
    var y = W.pageYOffset || de.scrollTop;
    if (hdr) hdr.classList.toggle("is-scrolled", y > 8);
    if (bar) bar.classList.toggle("is-on", y > 380);
  }
  W.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 4 · desktop mega menus ---------- */
  var megas = $$(".has-mega");
  function closeMegas(except) {
    megas.forEach(function (li) {
      if (li === except) return;
      li.classList.remove("is-open");
      var b = $(".nav__btn", li); if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  megas.forEach(function (li) {
    var b = $(".nav__btn", li);
    b.addEventListener("click", function () {
      var open = !li.classList.contains("is-open");
      closeMegas(li);
      li.classList.toggle("is-open", open);
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  d.addEventListener("click", function (ev) { if (!ev.target.closest(".has-mega")) closeMegas(); });

  /* ---------- 5 · phone drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  var scrim = d.createElement("div"); scrim.className = "scrim"; d.body.appendChild(scrim);
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    scrim.classList.toggle("is-on", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) { var f = $("a, summary, button", $(".drw", drawer)); if (f) f.focus(); }
    else if (burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  scrim.addEventListener("click", function () { setDrawer(false); });

  /* ---------- 6 · "to be built" panel ---------- */
  var dlg = $("#tbbdlg"), tbbData = {};
  try { tbbData = JSON.parse($("#tbb-data").textContent); } catch (err) { tbbData = {}; }
  var opener = null;
  function setMode(m) { $$("[data-mode]", dlg).forEach(function (el) { el.hidden = el.getAttribute("data-mode") !== m; }); }
  function openContact(a) {
    if (!dlg || typeof dlg.showModal !== "function") return false;
    opener = a; setMode("contact");
    $("#tbb-h").textContent = tbbData.contact;
    $("#tbb-cta").textContent = tbbData.contact_cta;
    $("#tbb-mail").href = "mailto:" + tbbData.info + "?subject=" + encodeURIComponent(tbbData.subject || "Enquiry");
    $("#tbb-anchor").hidden = true;
    closeMegas(); setDrawer(false); dlg.showModal(); if (lenis) lenis.stop();
    return true;
  }
  function openTbb(a) {
    if (!dlg || typeof dlg.showModal !== "function") return false;
    opener = a; setMode("tbb");
    var page = a.getAttribute("data-tbb"), mail = a.getAttribute("data-mail"), anchor = a.getAttribute("data-anchor");
    $("#tbb-h").textContent = page;
    $("#tbb-cta").textContent = (tbbData.cta || "Enquire about") + " " + page;
    $("#tbb-mail").href = "mailto:" + mail + "?subject=" + encodeURIComponent((tbbData.subject || "Enquiry") + ": " + page);
    var an = $("#tbb-anchor");
    if (anchor && d.getElementById(anchor)) { an.hidden = false; an.href = "#" + anchor; } else { an.hidden = true; }
    closeMegas(); setDrawer(false);
    dlg.showModal();
    if (lenis) lenis.stop();
    return true;
  }
  if (dlg) {
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); de.style.overflow = ""; if (opener && opener.focus && d.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (err) { opener.focus(); } } opener = null; });
    dlg.addEventListener("click", function (ev) {
      if (ev.target === dlg) dlg.close();
      var c = ev.target.closest("[data-dlg-close]");
      if (c) { dlg.close(); }
    });
  }

  /* one delegated click handler: panels, in-page anchors */
  d.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    if (a.hasAttribute("data-tbb")) { if (openTbb(a)) ev.preventDefault(); return; }
    if (a.hasAttribute("data-contact")) { if (openContact(a)) ev.preventDefault(); return; }
    var h = a.getAttribute("href");
    if (h.charAt(0) !== "#" || h.length < 2) return;
    var id = h.slice(1);
    if (!d.getElementById(id) && id !== "top") return;
    ev.preventDefault();
    closeMegas();
    if (drawer && drawer.classList.contains("is-open")) setDrawer(false);
    goTo(id);
    if (history.replaceState) history.replaceState(null, "", h);
  });
  d.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    closeMegas();
    if (drawer && drawer.classList.contains("is-open")) setDrawer(false);
  });

  /* ---------- 7 · reveals (ScrollTrigger batch) + safety sweep ---------- */
  var revs = $$("[data-reveal]");
  function revealAll() { revs.forEach(function (el) { el.classList.add("is-in"); }); }
  function sweep() {
    var vh = W.innerHeight;
    revs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) el.classList.add("is-in"); });
  }
  if (RM || !hasG) revealAll();
  else {
    ST.batch(revs, { start: "top 88%", once: true, onEnter: function (b) { b.forEach(function (el, i) { setTimeout(function () { el.classList.add("is-in"); }, i * 60); }); } });
    var tick = false;
    var onS = function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; sweep(); }); };
    ["scroll", "resize"].forEach(function (t) { W.addEventListener(t, onS, { passive: true }); });
    W.addEventListener("load", sweep); W.addEventListener("pageshow", sweep);
    setTimeout(sweep, 1600);
  }

  /* ---------- 8 · counters on real figures (land exactly) ---------- */
  function fmt(n) { return n.toLocaleString("en-IN"); }
  function count(el) {
    var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "";
    if (RM || !to) { el.textContent = fmt(to) + suf; return; }
    var t0 = null, dur = 1400;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), v = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * v)) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = "0" + suf;
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = fmt(to) + suf; }, dur + 400);
  }
  var counters = $$("[data-count]");
  if (!RM && counters.length) {
    if ("IntersectionObserver" in W) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); whenIntroDone(function () { count(en.target); }); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      counters.forEach(function (c) { io.observe(c); });
    }
  }

  /* ---------- 9 · hero: one node network -> server, computer, wifi, their Tamil Nadu district map, then India ---------- */
  var cv = $("#net");
  if (cv && cv.getContext) (function () {
    var ctx = cv.getContext("2d"), top = cv.parentElement, box = $("#netbox"), pp = $(".stage__pp"), bars = $$(".segs b"), hero = cv.closest(".hero");
    var kw = $("#kw1"), words = JSON.parse(cv.getAttribute("data-words"));
    var css = getComputedStyle(de), col = function (n, f) { return css.getPropertyValue(n).trim() || f; };
    var NAVY = col("--indigo", "#2d2f91"), RED = col("--red", "#ec1b23");
    var D, S, N, phone, CW = 0, CH = 0, dpr = Math.min(2, window.devicePixelRatio || 1), cams = {}, origin = [0, 0];
    var pos = [], from = [], to = [], delay = [], shapeNow = 0, edgeShape = 0, ea = 0, z = 0, tnP = 0, inP = 0;
    var running = false, visible = true, why = {}, last = 0, seed = 7, maxR = 1, indiaR = 1, mp = 1;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function deg2box(lon, y) { return [(lon - S.geo.lon0) / S.geo.lonSpan * 1000, (S.geo.lat0 + y) / S.geo.latSpan * 1250]; }
    function size() {
      var r = top.getBoundingClientRect(); CW = r.width; CH = r.height;
      cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); cv.style.width = CW + "px"; cv.style.height = CH + "px";
      var b = box.getBoundingClientRect(), bx = b.left - r.left, by = b.top - r.top;
      var k = Math.min(b.width / 1000, b.height / 1250) * .96;
      cams.tn = { k: k, ox: bx + (b.width - 1000 * k) / 2, oy: by + (b.height - 1250 * k) / 2 };
      var bb = S.shapes[4].bbox, w = (bb[2] - bb[0]) * 1000, h = (bb[3] - bb[1]) * 1250;
      var kw2 = Math.min(b.width / w, b.height / h) * .92;
      cams.w = { k: kw2, ox: bx + (b.width - w * kw2) / 2 - bb[0] * 1000 * kw2, oy: by + (b.height - h * kw2) / 2 - bb[1] * 1250 * kw2 };
    }
    function ease3(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function cam() {
      if (z <= 0) return cams.tn;
      if (z >= 1) return cams.w;
      var e2 = ease3(z), a = cams.tn, b = cams.w, ax = origin[0], ay = origin[1];
      var k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * e2);
      var sx = a.ox + ax * a.k + ((b.ox + ax * b.k) - (a.ox + ax * a.k)) * e2, sy = a.oy + ay * a.k + ((b.oy + ay * b.k) - (a.oy + ay * a.k)) * e2;
      return { k: k, ox: sx - ax * k, oy: sy - ay * k };
    }
    function pts(i) { return S.shapes[i].p.map(function (q) { return [q[0] * 1000, q[1] * 1250]; }); }
    function startMorph(target, mode) {
      var tp = pts(target), md = 0;
      from = pos.map(function (q) { return [q[0], q[1]]; }); to = tp; edgeShape = shapeNow;
      /* devices form top to bottom; the maps form outward from Tamil Nadu */
      delay = tp.map(function (q) { var dd = mode === "o" ? Math.hypot(q[0] - origin[0], q[1] - origin[1]) : q[1]; md = Math.max(md, dd); return dd; });
      var mn = mode === "o" ? 0 : Math.min.apply(null, delay);
      delay = delay.map(function (dd) { return md > mn ? (dd - mn) / (md - mn) : 0; });
      shapeNow = target;
    }
    function morphAt(p) {
      var STAG = .34;
      for (var i = 0; i < N; i++) {
        var e2 = ease3(Math.max(0, Math.min(1, (p - delay[i] * STAG) / (1 - STAG))));
        pos[i][0] = from[i][0] + (to[i][0] - from[i][0]) * e2; pos[i][1] = from[i][1] + (to[i][1] - from[i][1]) * e2;
      }
    }
    /* loop: Infrastructure (server) -> Hardware (computer) -> Networks (wifi) -> Tamil Nadu -> zoom out -> India -> server */
    var STEPS = [
      { t: "hold", s: 0, d: 3600, seg: 0 },
      { t: "morph", s: 1, d: 1300, seg: 1, m: "y" }, { t: "hold", s: 1, d: 3200, seg: 1 },
      { t: "morph", s: 2, d: 1300, seg: 2, m: "y" }, { t: "hold", s: 2, d: 3200, seg: 2 },
      { t: "morph", s: 3, d: 1500, seg: 3, m: "o" }, { t: "hold", s: 3, d: 2600, seg: 3 },
      { t: "zoom", d: 2600, seg: 4 }, { t: "morph", s: 4, d: 1900, seg: 4, m: "o" }, { t: "hold", s: 4, d: 5600, seg: 4 },
      { t: "morphzoom", s: 0, d: 1900, seg: 4, m: "y" }
    ];
    var si = 0, st = 0, segDur = [0, 0, 0, 0, 0], intro = null, pulses = [], nextP = 0;
    STEPS.forEach(function (x) { segDur[x.seg] += x.d; });
    function swapWord(w) {
      if (!kw || kw.textContent === w) return;
      kw.classList.remove("is-in"); kw.classList.add("is-out");
      setTimeout(function () { kw.textContent = w; kw.classList.remove("is-out"); void kw.offsetWidth; kw.classList.add("is-in"); }, 170);
    }
    function enter(step) {
      if (step.t === "morph" || step.t === "morphzoom") { startMorph(step.s, step.m); swapWord(words[step.s]); }
      pulses = [];
    }
    function tick(dt) {
      var step = STEPS[si];
      st += dt;
      var p = Math.min(1, st / step.d);
      mp = step.t === "morph" || step.t === "morphzoom" ? p : 1;
      if (step.t === "morph" || step.t === "morphzoom") { morphAt(p); ea = Math.max(0, 1 - p / .14); }
      else { if (edgeShape !== shapeNow) { edgeShape = shapeNow; ea = 0; } ea = Math.min(1, ea + dt / 320); }
      if (step.t === "zoom") z = p;
      if (step.t === "morphzoom") z = 1 - p;
      /* precise layers: the district map draws in on Tamil Nadu and stays through India; India's outline draws in on India */
      var mapOn = shapeNow === 3 || shapeNow === 4;
      tnP = mapOn && step.t !== "morph" || (step.t === "morph" && step.s === 4) ? Math.min(1, tnP + dt / 750) : Math.max(0, tnP - dt / 260);
      inP = shapeNow === 4 && step.t === "hold" ? Math.min(1, inP + dt / 950) : step.t === "morphzoom" ? Math.max(0, inP - dt / 260) : inP;
      var segStart = 0;
      for (var k = 0; k < si; k++) if (STEPS[k].seg === step.seg) segStart += STEPS[k].d;
      bars.forEach(function (b, n) { b.style.transform = "scaleX(" + (n < step.seg ? 1 : n > step.seg ? 0 : Math.min(1, (segStart + st) / segDur[n]).toFixed(3)) + ")"; });
      if (st >= step.d) { st = 0; si = (si + 1) % STEPS.length; if (si === 0) bars.forEach(function (b) { b.style.transform = "scaleX(0)"; }); enter(STEPS[si]); }
    }
    function fxScale(i, role, t, x) {
      if (role === 4) return (Math.sin(t * (1.7 + (i % 5) * .37) + i * 1.3) > -.35) ? 1 : .3;
      if (role === 5) { var ph = ((t * .55 - x / 1000) % 1.4 + 1.4) % 1.4; return ph < .12 ? 1.55 : 1; }
      return 1;
    }
    function spawnPulse(tnow) {
      var sh = S.shapes[shapeNow];
      if (shapeNow === 4 && sh.arcs) pulses.push({ arc: sh.arcs[Math.floor(rnd() * sh.arcs.length)], t0: tnow, d: 2000 });
      else if (shapeNow !== 3 && sh.e.length) { var ed = sh.e[Math.floor(rnd() * sh.e.length)]; pulses.push({ a: ed[0], b: ed[1], t0: tnow, d: 650 }); }
    }
    function lines(c, list, alpha, width) {
      /* a deduplicated mesh: every border once, thin and light */
      ctx.globalAlpha = alpha; ctx.strokeStyle = NAVY; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
      list.forEach(function (ln) {
        ctx.moveTo(c.ox + ln[0] * c.k, c.oy + ln[1] * c.k);
        for (var n = 2; n < ln.length; n += 2) ctx.lineTo(c.ox + ln[n] * c.k, c.oy + ln[n + 1] * c.k);
      });
      ctx.stroke();
    }
    function reveal(c, r) { ctx.beginPath(); ctx.arc(c.ox + origin[0] * c.k, c.oy + origin[1] * c.k, Math.max(0.1, r * c.k), 0, 6.2832); ctx.clip(); }
    function drawMap(c) {
      /* Tamil Nadu: district partitions light, state outline one notch stronger, drawn in outward from Tamil Nadu */
      var a = Math.min(1, tnP * 1.4), zf = 1 - .55 * ease3(z);
      ctx.save(); reveal(c, ease3(tnP) * maxR * 1.05);
      lines(c, D.tn_mesh.inner, a * .42 * Math.max(0, 1 - 1.6 * ease3(z)), phone ? .8 : .9);
      lines(c, D.tn_mesh.outline, a * .72, phone ? 1 : 1.1);
      ctx.restore();
    }
    function drawIndia(c) {
      var a = Math.min(1, inP * 1.4);
      ctx.save(); reveal(c, ease3(inP) * indiaR * 1.04);
      lines(c, D.india_mesh.inner, a * .34, phone ? .7 : .8);
      lines(c, D.india_mesh.outline, a * .62, phone ? .9 : 1);
      ctx.restore();
    }
    function draw(tnow) {
      var c = cam(), t = tnow / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
      var X = function (x) { return c.ox + x * c.k; }, Y = function (y) { return c.oy + y * c.k; };
      if (tnP > 0.005) drawMap(c);
      if (inP > 0.005) drawIndia(c);
      var sh = S.shapes[shapeNow], esh = edgeShape >= 0 ? S.shapes[edgeShape] : null;
      if (esh && ea > 0.01 && esh.e.length) {
        ctx.globalAlpha = ea * (edgeShape === 4 ? .35 : .66); ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.beginPath();
        esh.e.forEach(function (ed) { var a = pos[ed[0]], b = pos[ed[1]]; if (!a || !b) { return; } ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); });
        ctx.stroke();
      }
      var small = phone ? 1.3 : 1.2, big = phone ? 2.7 : 2.5, shrink = 1 - .4 * ease3(z);
      var fadeOutline = shapeNow === 3 ? tnP : shapeNow === 4 ? Math.max(inP, 0) : 0;
      for (var i = 0; i < N; i++) {
        var role = sh.r[i], x = X(pos[i][0]), y = Y(pos[i][1]);
        if (role === 0 || role === 2) {
          var al = role === 2 ? .85 * (1 - fadeOutline) : .85;
          if (al < .02) continue;
          ctx.globalAlpha = al; ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x, y, small * shrink, 0, 6.2832); ctx.fill();
        } else {
          /* red nodes only once their shape has formed: Tamil Nadu dots pop in after the boundaries draw, outward;
             India's arc ends after its outline; device features at the end of the morph. Never during a morph. */
          var show = shapeNow === 3 ? Math.max(0, Math.min(1, (tnP - .5 - (delay[i] || 0) * .35) / .15))
            : shapeNow === 4 ? Math.max(0, Math.min(1, (inP - .55) / .25)) : Math.max(0, Math.min(1, (mp - .86) / .14));
          if (show <= 0) continue;
          if (role === 5) { var kf = fxScale(i, role, t, pos[i][0]); ctx.globalAlpha = .38 * show; ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x, y, big * .8 * kf * shrink, 0, 6.2832); ctx.fill(); continue; }
          var f = fxScale(i, role, t, pos[i][0]), pop = show < 1 ? .6 + .4 * show + .25 * Math.sin(show * 3.1416) : 1;
          ctx.globalAlpha = (f < 1 ? .35 : 1) * show; ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, y, (shapeNow === 3 ? 2.6 : big) * Math.max(1, f) * pop * shrink, 0, 6.2832); ctx.fill();
        }
      }
      ctx.fillStyle = RED;
      pulses = pulses.filter(function (p) {
        var k = (tnow - p.t0) / p.d; if (k >= 1) return false;
        var px, py;
        if (p.arc) { var A = p.arc, o = deg2box(A[0], A[1]), m = deg2box(A[2], A[3]), e3 = deg2box(A[4], A[5]), u = k;
          px = (1 - u) * (1 - u) * o[0] + 2 * (1 - u) * u * m[0] + u * u * e3[0]; py = (1 - u) * (1 - u) * o[1] + 2 * (1 - u) * u * m[1] + u * u * e3[1];
        } else { var a = pos[p.a], b = pos[p.b]; px = a[0] + (b[0] - a[0]) * k; py = a[1] + (b[1] - a[1]) * k; }
        ctx.globalAlpha = k < .15 ? k / .15 : k > .85 ? (1 - k) / .15 : 1;
        ctx.beginPath(); ctx.arc(X(px), Y(py), phone ? 2.3 : 2.1, 0, 6.2832); ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(50, now - last) : 16; last = now;
      if (intro) { intro.t += dt; var p = Math.min(1, intro.t / 1800); morphAt(p); ea = 0; if (p >= 1) { intro = null; edgeShape = -1; } }
      else tick(dt);
      var step = STEPS[si];
      if (!intro && step.t === "hold" && now > nextP) { spawnPulse(now); nextP = now + (shapeNow === 4 ? (phone ? 650 : 360) : (phone ? 800 : 460)); }
      draw(now);
      requestAnimationFrame(frame);
    }
    function setRun() {
      var go = visible && !Object.keys(why).length && !!S && !RM;
      if (go && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      else if (!go) running = false;
      hero.classList.toggle("is-paused", !!why.user);
    }
    function pause(r, on) { if (on) why[r] = 1; else delete why[r]; setRun(); }
    if (pp) pp.addEventListener("click", function () {
      var on = !why.user; pause("user", on);
      pp.setAttribute("aria-pressed", on ? "true" : "false");
      pp.setAttribute("aria-label", cv.getAttribute(on ? "data-play" : "data-pause"));
    });
    box.addEventListener("mouseenter", function () { pause("hover", true); });
    box.addEventListener("mouseleave", function () { pause("hover", false); });
    hero.addEventListener("focusin", function (ev) { if (ev.target !== pp) pause("focus", true); });
    hero.addEventListener("focusout", function () { pause("focus", false); });
    d.addEventListener("visibilitychange", function () { pause("hidden", d.hidden); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRun(); }, { threshold: .05 }).observe(top);
    var rs = 0;
    window.addEventListener("resize", function () { clearTimeout(rs); rs = setTimeout(function () { if (!S) return; size(); if (!running) draw(performance.now()); }, 120); }, { passive: true });
    fetch(cv.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (data) {
      D = data; phone = top.getBoundingClientRect().width < 700; S = phone ? D.p : D.d; N = S.n;
      origin = deg2box(79.9, -12.4);
      var tp = pts(3); maxR = Math.max.apply(null, tp.map(function (q) { return Math.hypot(q[0] - origin[0], q[1] - origin[1]); }));
      D.india_mesh.outline.forEach(function (ln) { for (var n = 0; n < ln.length; n += 2) indiaR = Math.max(indiaR, Math.hypot(ln[n] - origin[0], ln[n + 1] - origin[1])); });
      size();
      if (RM) { pos = pts(0); shapeNow = 0; edgeShape = 0; ea = 1; draw(0); return; }
      whenIntroDone(function () {
        size();
        /* the nodes stream out of the logo mark in the header and form the server rack */
        var brand = $(".brand__img"), r = top.getBoundingClientRect(), b = brand ? brand.getBoundingClientRect() : null, c = cams.tn;
        var sx = b ? b.left + b.width / 2 - r.left : CW / 2, sy = b ? b.top + b.height / 2 - r.top : 0;
        var ox = (sx - c.ox) / c.k, oy = (sy - c.oy) / c.k;
        pos = []; for (var i = 0; i < N; i++) pos.push([ox, oy]);
        shapeNow = 0; startMorph(0, "y"); intro = { t: 0 }; ea = 0; edgeShape = 0;
        /* QA hook: #net=<step> jumps the loop to a step (used only to capture review frames) */
        var mh = /net=(\d+)/.exec(location.hash);
        if (mh) {
          var k0 = +mh[1], s0 = STEPS[k0].s !== undefined ? STEPS[k0].s : (k0 >= 7 ? 3 : 0);
          intro = null; pos = pts(s0); from = pts(s0); to = pts(s0); delay = pos.map(function () { return 0; }); shapeNow = edgeShape = s0;
          si = k0; st = 0; if (k0 >= 8) { z = 1; } if (s0 >= 3) tnP = 1; if (k0 === 9) inP = 0; swapWord(words[s0]);
        }
        setRun();
      });
    }).catch(function (err) { console.warn("[hero] disabled:", err); });
  })();

  /* ---------- 10 · web casting: pinned frame on desktop, stacked on phones ---------- */
  var wc = $(".wc");
  if (wc) {
    var frames = $$(".wcf__f", wc), steps = $$(".wcs", wc), num = $("[data-wcn]", wc), prog = $("[data-wcp]", wc);
    var setStep = function (i) {
      frames.forEach(function (f, j) { f.classList.toggle("is-on", j === i); });
      steps.forEach(function (s, j) { s.classList.toggle("is-on", j === i); });
      if (num) num.textContent = ("0" + (i + 1)).slice(-2) + " / " + ("0" + steps.length).slice(-2);
    };
    if (hasG && !RM && G.matchMedia) {
      var mm = G.matchMedia();
      mm.add("(min-width: 1000px) and (min-height: 680px)", function () {
        setStep(0);
        steps.forEach(function (s, i) {
          ST.create({ trigger: s, start: "top 62%", end: "bottom 62%", onToggle: function (self) { if (self.isActive) setStep(i); } });
        });
        if (prog) G.fromTo(prog, { scaleX: 0.06 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: $(".wc__steps", wc), start: "top 62%", end: "bottom 80%", scrub: true } });
        return function () { steps.forEach(function (s) { s.classList.remove("is-on"); }); };
      });
    } else { wc.classList.add("no-st"); setStep(0); }
  }

  /* ---------- 11 · solution finder (only reshuffles their published data) ---------- */
  var fdEl = $("#fd"), fdOut = $("#fd-out"), FD = null;
  try { FD = JSON.parse($("#fd-data").textContent); } catch (err) { FD = null; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slug(s) { return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  var ARROW = '<svg class="i" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function renderFinder() {
    if (!FD || !fdEl) return;
    var U = FD.ui, f = fdEl.querySelector("form");
    var sec = (f.querySelector('input[name="sector"]:checked') || {}).value || "";
    var nk = (f.querySelector('input[name="need"]:checked') || {}).value || "";
    var dist = f.querySelector("select").value;
    var need = FD.needs.filter(function (n) { return n.k === nk; })[0];
    if (!sec && !need) { fdOut.innerHTML = '<p class="fd__empty">' + esc(U.empty) + "</p>"; return; }
    var h = '<p class="fo__h">' + esc(U.out_h) + "</p><p class=\"fo__sub\">" + esc([sec, need && need.t, dist].filter(Boolean).join(" · ")) + "</p>";
    if (need) {
      h += '<p class="fo__lab">' + esc(U.out_services) + '</p><div class="fo__items">';
      need.items.forEach(function (it) {
        var an = FD.anchors[it], page = FD.pages[it] || it;
        if (FD.built[page]) h += '<a class="is-built" href="' + FD.built[page] + '"><span>' + esc(it) + "</span>" + ARROW + "</a>";
        else if (an) h += '<a href="#' + an + '"><span>' + esc(it) + "</span>" + ARROW + "</a>";
        else h += '<a class="is-tbb" href="#tbb-' + slug(page) + '" data-tbb="' + esc(page) + '" data-mail="' + esc(FD.mail[page] || FD.info) + '"><span>' + esc(it) + "</span></a>";
      });
      h += "</div>";
    }
    if (sec) {
      var cl = Object.keys(FD.clients).filter(function (k) { return FD.clients[k].s.indexOf(sec) > -1; }).slice(0, 10);
      h += '<p class="fo__lab">' + esc(U.out_clients) + "</p>";
      if (cl.length) h += '<ul class="fo__logos">' + cl.map(function (k) { var c = FD.clients[k]; return '<li><img src="' + c.src + '" width="' + c.w + '" height="' + c.h + '" alt="' + esc(c.n) + '" loading="lazy"></li>'; }).join("") + "</ul>";
      else h += '<p class="fo__none">' + esc(U.out_none) + "</p>";
    }
    var desk = null;
    if (need) desk = FD.desks[need.desk === "sales" ? (sec === "Government" ? "sridhar" : "gokul") : need.desk];
    var dRow = dist ? FD.districts.filter(function (x) { return x[0] === dist; })[0] : null;
    var tel = function (t) { return "tel:+" + t.replace(/\D/g, ""); };
    h += '<p class="fo__lab">' + esc(U.out_people) + '</p><div class="fo__ppl">';
    if (desk) h += '<div class="fo__p"><span>' + esc(U.out_desk) + "</span><b>" + esc(desk.name) + "</b><span>" + esc(desk.role) + '</span><a href="' + tel(desk.tel) + '">' + esc(desk.tel) + "</a></div>";
    if (dRow) h += '<div class="fo__p"><span>' + esc(U.out_district) + " · " + esc(dRow[0]) + "</span><b>" + esc(dRow[1]) + '</b><a href="' + tel(dRow[2]) + '">' + esc(dRow[2]) + "</a></div>";
    if (!desk && !dRow) h += '<div class="fo__p"><span>' + esc(U.out_help) + '</span><a href="' + tel(FD.help.tel) + '">' + esc(FD.help.tel) + "</a></div>";
    h += "</div>";
    var to = desk ? desk.email : FD.info;
    var body = [U.body_intro, "", sec ? U.body_sector + ": " + sec : "", need ? U.body_need + ": " + need.t : "", dist ? U.body_district + ": " + dist : "",
      need ? U.body_items + ": " + need.items.join(", ") : "", "", U.body_end].filter(function (x, i, arr) { return x !== "" || (i > 0 && arr[i - 1] !== ""); }).join("\n");
    var subj = U.subject + (need ? ": " + need.t : sec ? ": " + sec : "");
    var cc = to !== FD.info ? "&cc=" + encodeURIComponent(FD.info) : "";
    h += '<a class="btn fo__send" href="mailto:' + to + "?subject=" + encodeURIComponent(subj) + cc + "&body=" + encodeURIComponent(body) + '">' + esc(U.send) + ARROW + "</a>";
    h += '<p class="fo__note">' + esc(U.copy_note) + "</p>";
    fdOut.innerHTML = h;
    fdOut.classList.remove("is-new"); void fdOut.offsetWidth; fdOut.classList.add("is-new");
  }
  if (fdEl && FD) { fdEl.addEventListener("change", renderFinder); renderFinder(); }

  /* ---------- 12 · clients filter ---------- */
  var tabs = $$(".ftab"), logos = $$("#logos .lg");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var f = t.getAttribute("data-filter");
      tabs.forEach(function (x) { x.classList.toggle("is-on", x === t); x.setAttribute("aria-pressed", x === t ? "true" : "false"); });
      logos.forEach(function (l) { l.hidden = !(f === "all" || l.getAttribute("data-g") === f); if (!l.hidden) l.classList.add("is-in"); });
      if (hasG) ST.refresh();
    });
  });

  /* ---------- 13 · district directory search ---------- */
  var q = $("#nd-q");
  if (q) {
    var rows = $$("#ndl .nd"), n = $("#nd-n"), none = $("#nd-none");
    q.addEventListener("input", function () {
      var v = q.value.trim().toLowerCase(), c = 0;
      rows.forEach(function (r) { var m = !v || r.getAttribute("data-q").indexOf(v) > -1; r.hidden = !m; if (m) c++; });
      if (n) n.textContent = c;
      if (none) none.hidden = c > 0;
    });
  }

  /* ---------- 14 · concept dock ---------- */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("zg-dock")) dock.classList.add("is-hidden"); } catch (err) { /* storage blocked: keep the dock */ }
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-hidden"); try { sessionStorage.setItem("zg-dock", "1"); } catch (err) { /* ignore */ } });

  /* ---------- 15 · ZIGMA footer: the wordmark rises once, the leaves of their logo turn once ---------- */
  var ftr = $("#ftr"), zw = $(".zw");
  if (ftr && zw) {
    if (RM || !("IntersectionObserver" in W)) zw.classList.add("is-in");
    else {
      var fio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { zw.classList.add("is-in"); ftr.classList.add("is-live"); fio.disconnect(); } });
      }, { rootMargin: "0px 0px -6% 0px" });
      fio.observe(zw);
    }
  }

  /* ================= interactions ported from interior.dev (MIT licence, (c) interior.dev contributors):
     press-depth, dropdown (sliding highlight), segmented-control (travelling thumb), copy-button, logo-marquee.
     Behaviour and spring constants follow their source; the motion runs on CSS linear() springs generated at build. */
  /* Press Depth: pointer, touch and keyboard all press; release on up, cancel, blur and hidden tab */
  var pressSel = ".btn, .stage__pp, .copy", pressed = null, pid = null;
  function inside(el, x, y) { var r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
  function release() { if (pressed) pressed.removeAttribute("data-pressed"); pressed = null; pid = null; }
  d.addEventListener("pointerdown", function (ev) {
    var el = ev.target.closest && ev.target.closest(pressSel);
    if (!el || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty("--px", Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width) * 2 - 1)).toFixed(2));
    el.style.setProperty("--py", Math.max(-1, Math.min(1, ((ev.clientY - r.top) / r.height) * 2 - 1)).toFixed(2));
    pressed = el; pid = ev.pointerId; el.setAttribute("data-pressed", "");
  });
  window.addEventListener("pointermove", function (ev) { if (pressed && ev.pointerId === pid) pressed.toggleAttribute("data-pressed", inside(pressed, ev.clientX, ev.clientY)); });
  ["pointerup", "pointercancel", "blur"].forEach(function (t) { window.addEventListener(t, release); });
  d.addEventListener("visibilitychange", function () { if (d.hidden) release(); });
  d.addEventListener("keydown", function (ev) {
    if ((ev.key === " " || ev.key === "Enter") && !ev.repeat) {
      var el = d.activeElement; if (el && el.matches && el.matches(pressSel)) { el.style.setProperty("--px", 0); el.style.setProperty("--py", 0); el.setAttribute("data-pressed", ""); pressed = el; }
    }
  });
  d.addEventListener("keyup", function (ev) { if (ev.key === " " || ev.key === "Enter" || ev.key === "Escape") release(); });
  d.addEventListener("focusout", function (ev) { if (pressed && ev.target === pressed) release(); });

  /* Dropdown: the active-row highlight slides between items (spring 700/46/0.5) */
  $$(".mega").forEach(function (m) {
    var hl = $(".mega__hl", m), wrap = $(".mega__in", m);
    if (!hl || !wrap) return;
    var place = function (a) {
      var w = wrap.getBoundingClientRect(), r = a.getBoundingClientRect();
      hl.style.width = r.width + "px"; hl.style.height = r.height + "px";
      hl.style.transform = "translate(" + (r.left - w.left) + "px," + (r.top - w.top) + "px)";
      hl.classList.add("is-on");
    };
    m.addEventListener("pointerover", function (ev) { var a = ev.target.closest("ul a"); if (a) place(a); });
    m.addEventListener("focusin", function (ev) { var a = ev.target.closest("ul a"); if (a) place(a); });
    m.addEventListener("pointerleave", function () { hl.classList.remove("is-on"); });
  });

  /* Segmented Control: the selection pill travels to the chosen chip (spring 520/34/0.45) */
  $$("[data-thumb]").forEach(function (g) {
    var th = $(".chips__thumb", g); if (!th) return;
    g.classList.add("has-thumb");
    var move = function () {
      var c = $("input:checked", g); if (!c) { th.classList.remove("is-on"); return; }
      var sp = c.nextElementSibling, gr = g.getBoundingClientRect(), r = sp.getBoundingClientRect();
      th.style.width = r.width + "px"; th.style.height = r.height + "px";
      th.style.transform = "translate(" + (r.left - gr.left) + "px," + (r.top - gr.top) + "px)";
      th.classList.add("is-on");
    };
    g.addEventListener("change", move);
    window.addEventListener("resize", function () { th.style.transition = "none"; move(); requestAnimationFrame(function () { th.style.transition = ""; }); }, { passive: true });
  });

  /* Copy Button: copy -> tick, label crossfades, reverts after 2 s */
  d.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".copy"); if (!b) return;
    var v = b.getAttribute("data-copy"), done = function () { b.classList.add("is-copied"); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove("is-copied"); }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { fallbackCopy(v); done(); });
    else { fallbackCopy(v); done(); }
  });
  function fallbackCopy(v) { var t = d.createElement("textarea"); t.value = v; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; d.body.appendChild(t); t.select(); try { d.execCommand("copy"); } catch (err) { /* ignore */ } t.remove(); }

  /* Logo Marquee: stops when you look at it, plus a visible pause control */
  $$(".mq").forEach(function (m) {
    var b = $(".mq__pp", m); if (!b) return;
    b.addEventListener("click", function () {
      var on = !m.classList.contains("is-paused"); m.classList.toggle("is-paused", on);
      b.setAttribute("aria-pressed", on ? "true" : "false"); $("span", b).textContent = b.getAttribute(on ? "data-play" : "data-pause");
    });
  });

  /* keep ScrollTrigger honest after fonts and images settle */
  if (hasG) {
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
    W.addEventListener("load", function () { ST.refresh(); });
  }
})();
