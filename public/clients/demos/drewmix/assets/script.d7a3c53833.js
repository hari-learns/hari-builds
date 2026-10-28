/* Drewmix redesign concept: site-wide behaviour. One IIFE, every feature guarded. */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  var reduced = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  function store() { try { var k = "__t"; W.localStorage.setItem(k, "1"); W.localStorage.removeItem(k); return W.localStorage; } catch (e) { return null; } }
  var LS = store(), mem = {};
  function sget(k) { try { return LS ? LS.getItem(k) : mem[k] || null; } catch (e) { return mem[k] || null; } }
  function sset(k, v) { try { if (LS) LS.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } }

  /* ---------- header, drawer ---------- */
  var burger = $(".burger"), drawer = $("#drawer"), hd = $("#hd");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open) { var c = $(".drawer-close", drawer); if (c) c.focus(); } else if (burger && D.activeElement && drawer.contains(D.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (drawer) {
    var dc = $(".drawer-close", drawer); if (dc) dc.addEventListener("click", function () { setDrawer(false); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });
  }
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); closeLb(); } });
  W.addEventListener("resize", function () { if (W.innerWidth >= 1080) setDrawer(false); });

  /* ---------- dock (concept notice) ---------- */
  var dock = $("#dock");
  if (dock) {
    if (sget("dm_dock") === "1") dock.classList.add("is-gone");
    var db = $("button", dock); if (db) db.addEventListener("click", function () { dock.classList.add("is-gone"); sset("dm_dock", "1"); });
  }

  /* ---------- reveals (never strand content: sweep reveals everything at or above the fold) ---------- */
  var rv = $$(".rv, .chapter");
  rv.forEach(function (el, i) {
    var p = el.parentElement, idx = p ? Array.prototype.indexOf.call(p.children, el) : 0;
    el.style.setProperty("--i", Math.min(idx, 6));
  });
  function reveal(el) { el.classList.add("is-in"); }
  var done = new WeakSet();
  function sweep() {
    var vh = W.innerHeight || 800;
    rv.forEach(function (el) { if (!done.has(el) && el.getBoundingClientRect().top < vh * 0.96) { done.add(el); reveal(el); } });
  }
  if ("IntersectionObserver" in W && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { done.add(en.target); reveal(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(reveal); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { W.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---------- counters (real figures; final value is in the HTML) ---------- */
  var counters = $$(".bignum [data-count]");
  if (counters.length && "IntersectionObserver" in W && !reduced) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; co.unobserve(en.target);
        var el = en.target, to = parseInt(el.getAttribute("data-count"), 10), t0 = null;
        function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) W.requestAnimationFrame(step); else el.textContent = to; }
        el.textContent = "0"; W.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- hero clip: their own footage, muted loop, poster first, off for reduced motion / data saver ---------- */
  function pickSrc(v, mobile) {
    var webm = v.canPlayType && v.canPlayType('video/webm; codecs="vp9"');
    var key = mobile ? "m" : "d";
    return v.getAttribute("data-" + key + "-" + (webm ? "webm" : "mp4")) || v.getAttribute("data-" + (webm ? "webm" : "mp4"));
  }
  var conn = W.navigator && W.navigator.connection;
  var saver = conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""));
  var hv = $(".hero-video"), hp = $(".hero-pause");
  if (hv && !reduced && !saver) {
    var started = false;
    function startHero() {
      if (started) return; started = true;
      var src = pickSrc(hv, W.matchMedia("(max-width: 700px)").matches); if (!src) return;
      hv.src = src; hv.muted = true;
      hv.addEventListener("playing", function () { hv.classList.add("is-playing"); if (hp) hp.hidden = false; });
      var p = hv.play(); if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
    }
    if (D.readyState === "complete") W.setTimeout(startHero, 200); else W.addEventListener("load", function () { W.setTimeout(startHero, 200); });
    if (hp) hp.addEventListener("click", function () {
      if (hv.paused) { hv.play().catch(function () {}); hp.setAttribute("aria-label", hp.getAttribute("data-label-pause")); hp.removeAttribute("data-state"); }
      else { hv.pause(); hp.setAttribute("aria-label", hp.getAttribute("data-label-play")); hp.setAttribute("data-state", "paused"); }
    });
    if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { es.forEach(function (en) { if (!hv.src) return; if (en.isIntersecting) { if (hv.paused && hp && hp.getAttribute("data-state") !== "paused") hv.play().catch(function () {}); } else hv.pause(); }); }, { threshold: 0.1 }).observe(hv);
  }
  var lv = $(".lvideo");
  if (lv && !reduced && !saver && "IntersectionObserver" in W) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          if (!lv.src) { var s = pickSrc(lv, false); if (!s) return; lv.src = s; lv.muted = true; lv.addEventListener("playing", function () { lv.classList.add("is-playing"); }); }
          lv.play().catch(function () {});
        } else if (lv.src) lv.pause();
      });
    }, { threshold: 0.35 }).observe(lv);
  }

  /* ---------- lightbox (real photos, caption from the catalogue) ---------- */
  var lb, lbImg, lbCap, lbLast;
  function buildLb() {
    if (lb) return;
    lb = D.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button type="button" aria-label="' + ((W.DM_I18N && W.DM_I18N.lbclose) || (D.documentElement.lang === "pl" ? "Zamknij" : "Close")) + '"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button><figure><img alt="" width="1200" height="800"><figcaption></figcaption></figure>';
    D.body.appendChild(lb); lbImg = $("img", lb); lbCap = $("figcaption", lb);
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest("button")) closeLb(); });
  }
  function openLb(src, cap, w, h) {
    buildLb(); lbLast = D.activeElement; lbImg.src = src; lbImg.alt = cap || ""; if (w && h) { lbImg.width = w; lbImg.height = h; } lbCap.textContent = cap || "";
    lb.classList.add("is-open"); D.body.classList.add("lb-open"); $("button", lb).focus();
  }
  function closeLb() { if (!lb || !lb.classList.contains("is-open")) return; lb.classList.remove("is-open"); D.body.classList.remove("lb-open"); if (lbLast && lbLast.focus) lbLast.focus(); }
  W.DM_openLb = openLb;
  D.addEventListener("click", function (e) {
    var t = e.target.closest("[data-lb]"); if (!t) return;
    e.preventDefault(); openLb(t.getAttribute("data-lb"), t.getAttribute("data-cap"), t.getAttribute("data-w"), t.getAttribute("data-h"));
  });

  /* ---------- filters: category page (collection chips + search) and sets page (table x chair) ---------- */
  var f1 = $("[data-filter]");
  if (f1) {
    var items = $$(".pitem", f1), shown = $("[data-shown]", f1), empty = $(".empty", f1), col = "", q = "";
    var apply = function () {
      var n = 0; items.forEach(function (it) {
        var ok = (!col || it.getAttribute("data-col") === col) && (!q || it.getAttribute("data-name").toLowerCase().indexOf(q) > -1);
        it.hidden = !ok; if (ok) n++;
      });
      if (shown) shown.textContent = n; if (empty) empty.hidden = n > 0;
    };
    $$(".chip", f1).forEach(function (c) { c.addEventListener("click", function () { $$(".chip", f1).forEach(function (x) { x.classList.remove("is-on"); }); c.classList.add("is-on"); col = c.getAttribute("data-col") || ""; apply(); }); });
    var si = $("[data-search]", f1); if (si) si.addEventListener("input", function () { q = si.value.trim().toLowerCase(); apply(); });
  }
  var f2 = $("[data-sets]");
  if (f2) {
    var cards = $$(".scard", f2), sh2 = $("[data-shown]", f2), em2 = $(".empty", f2), ft = "", fc = "";
    var apply2 = function () {
      var n = 0; cards.forEach(function (c) {
        var ok = (!ft || c.getAttribute("data-t") === ft) && (!fc || (" " + c.getAttribute("data-c") + " ").indexOf(" " + fc + " ") > -1);
        c.hidden = !ok; if (ok) n++;
      });
      if (sh2) sh2.textContent = n; if (em2) em2.hidden = n > 0;
    };
    $$("[data-t].chip", f2).forEach(function (c) { c.addEventListener("click", function () { $$("[data-t].chip", f2).forEach(function (x) { x.classList.remove("is-on"); }); c.classList.add("is-on"); ft = c.getAttribute("data-t") || ""; apply2(); }); });
    $$("[data-c].chip", f2).forEach(function (c) { c.addEventListener("click", function () { $$("[data-c].chip", f2).forEach(function (x) { x.classList.remove("is-on"); }); c.classList.add("is-on"); fc = c.getAttribute("data-c") || ""; apply2(); }); });
  }

  /* ---------- enquiry list (shared by finder, product pages, contact) ---------- */
  var KEY = "dm_enq_v1";
  function read() { try { var a = JSON.parse(sget(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function write(a) { sset(KEY, JSON.stringify(a)); badge(); W.dispatchEvent(new CustomEvent("dm-enq")); }
  function count() { return read().reduce(function (s, i) { return s + (i.q || 0); }, 0); }
  function badge() { var n = read().length; $$("[data-enq-count]").forEach(function (b) { b.textContent = n; b.hidden = n === 0; }); }
  W.DM_ENQ = {
    items: read,
    add: function (slug, q) { var a = read(), f = a.filter(function (i) { return i.s === slug; })[0]; if (f) f.q += q; else a.push({ s: slug, q: q }); write(a); },
    set: function (slug, q) { var a = read().map(function (i) { if (i.s === slug) i.q = Math.max(1, q); return i; }); write(a); },
    remove: function (slug) { write(read().filter(function (i) { return i.s !== slug; })); },
    clear: function () { write([]); }, count: count
  };
  badge();
  $$("[data-add]").forEach(function (b) {
    var lab = b.textContent;
    b.addEventListener("click", function () { W.DM_ENQ.add(b.getAttribute("data-add"), 1); b.textContent = b.getAttribute("data-added") || "OK"; b.setAttribute("aria-live", "polite"); W.setTimeout(function () { b.textContent = lab; }, 2600); });
  });
})();
