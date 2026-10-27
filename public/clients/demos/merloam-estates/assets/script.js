/* Merloam Estates concept — interactions. Every effect acts on real content; reduced motion gets the static site. */
(function () {
  "use strict";
  var d = document, h = d.documentElement, w = window;
  var RM = h.classList.contains("rm");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    lget: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    lset: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------------------------------------------------------- loader + page transitions */
  function ready() {
    h.classList.remove("is-loading", "pt-in");
    h.classList.add("is-ready");
    store.set("ml-seen", "1");
    d.dispatchEvent(new Event("ml:ready"));
  }
  var loader = $(".loader"), pt = $(".pt");
  if (h.classList.contains("is-loading") && loader) {
    var count = $("[data-count]", loader), bar = $(".ld-bar", loader);
    var imgs = $$("img").filter(function (i) { return i.loading !== "lazy"; });
    var start = performance.now(), shown = 0, target = 0, done = false;
    var tick = function () {
      var loaded = imgs.filter(function (i) { return i.complete; }).length;
      var t = Math.min(1, (performance.now() - start) / 1700);
      target = Math.min(t, imgs.length ? (loaded / imgs.length) * 0.5 + t * 0.5 : t);
      if (d.readyState === "complete") target = Math.max(target, t);
      shown += (target - shown) * 0.18;
      var p = Math.min(100, Math.round(shown * 100));
      if (count) count.textContent = ("00" + p).slice(-3);
      if (bar) bar.style.setProperty("--p", shown);
      if (t >= 1 && d.readyState === "complete" && p >= 99) { finish(); return; }
      if (!done) requestAnimationFrame(tick);
    };
    var finish = function () {
      if (done) return; done = true;
      if (count) count.textContent = "100";
      loader.classList.add("is-out");
      h.classList.remove("is-loading");
      setTimeout(ready, 260);
      setTimeout(function () { loader.classList.remove("is-out"); }, 1700);
    };
    requestAnimationFrame(tick);
    setTimeout(finish, 4000);
  } else if (h.classList.contains("pt-in") && pt) {
    pt.classList.add("is-entering");
    requestAnimationFrame(function () {
      h.classList.remove("pt-in");
      ready();
      setTimeout(function () { pt.classList.remove("is-entering"); }, 1200);
    });
  } else {
    ready();
  }
  w.addEventListener("pageshow", function (ev) {
    if (ev.persisted && pt) { pt.classList.remove("is-leaving"); h.classList.remove("pt-in", "is-loading"); h.classList.add("is-ready"); }
  });
  if (!RM && pt) {
    d.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href]");
      if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || /\.(pdf|mp4|xml|txt|webp|png|jpe?g)$/i.test(url.pathname)) return;
      ev.preventDefault();
      pt.classList.add("is-leaving");
      setTimeout(function () { location.href = url.href; }, 620);
    });
  }

  /* ---------------------------------------------------------------- reveals (IO + sweep fallback) */
  var rv = $$("[data-reveal],[data-split],[data-unmask],[data-map],.gc");
  var activate = function (el) { el.classList.add("is-in"); };
  if (RM || !("IntersectionObserver" in w)) {
    rv.forEach(activate);
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    var arm = function () { rv.forEach(function (el) { if (!el.classList.contains("is-in")) io.observe(el); }); };
    var sweep = function () {
      var vh = w.innerHeight;
      rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); });
    };
    // hero/first-screen content waits for the loader; the rest arms right away
    var heroEls = $$(".hero [data-split]");
    rv = rv.filter(function (el) { return heroEls.indexOf(el) < 0; });
    if (h.classList.contains("is-ready")) { heroEls.forEach(activate); arm(); sweep(); }
    else d.addEventListener("ml:ready", function () { heroEls.forEach(activate); setTimeout(function () { arm(); sweep(); }, 120); });
    ["load", "resize", "pageshow"].forEach(function (t) { w.addEventListener(t, sweep, { passive: true }); });
    var st = 0;
    w.addEventListener("scroll", function () { if (!st) st = setTimeout(function () { st = 0; sweep(); }, 160); }, { passive: true });
  }
  // stagger siblings inside grids
  $$(".pg-grid,.rail-track,.jr-grid,.bns,.mvs-grid,.nb-grid,.am-l,.fxs,.stats,.ofs-row,.pw-l,.how-l").forEach(function (g) {
    $$("[data-reveal]", g).forEach(function (el, i) { el.style.setProperty("--rd", (i % 6) * 70 + "ms"); });
  });

  /* ---------------------------------------------------------------- header */
  var hdr = $("#hdr"), lastY = w.scrollY, hero = $(".hero");
  var mbar = $(".mbar");
  var onScroll = function () {
    var y = w.scrollY;
    var limit = hero ? hero.offsetHeight - 90 : 40;
    if (hdr) {
      hdr.classList.toggle("is-solid", y > limit);
      hdr.classList.toggle("is-hidden", y > 300 && y > lastY + 4 && !h.classList.contains("menu-open"));
      if (y < lastY - 4) hdr.classList.remove("is-hidden");
    }
    if (mbar) mbar.classList.toggle("is-on", y > (hero ? hero.offsetHeight * 0.6 : 320));
    lastY = y;
  };
  w.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* drawer */
  var burger = $(".burger"), drawer = $("#drawer");
  var setMenu = function (open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    h.classList.toggle("menu-open", open);
    h.style.overflow = open ? "hidden" : "";
    if (w.__lenis) open ? w.__lenis.stop() : w.__lenis.start();
  };
  if (burger) burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("is-open")); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); closeLb(); } });
  $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* dock */
  var dock = $("#dock");
  if (dock) {
    if (store.lget("ml-dock") === "x") dock.classList.add("is-hid");
    $(".dock-x", dock).addEventListener("click", function () { dock.classList.add("is-hid"); store.lset("ml-dock", "x"); });
  }

  /* ---------------------------------------------------------------- brighten + counters */
  var br = $("[data-brighten]");
  var brWords = br ? $$(".bw", br) : [];
  var brighten = function () {
    if (!br || RM) return;
    var r = br.getBoundingClientRect(), vh = w.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    var n = Math.round(p * brWords.length * 1.08);
    brWords.forEach(function (el, i) { el.classList.toggle("on", i < n); });
  };
  if (br) { w.addEventListener("scroll", brighten, { passive: true }); brighten(); }

  var counted = new WeakSet();
  var countUp = function (el) {
    if (counted.has(el)) return; counted.add(el);
    var to = +el.getAttribute("data-to"); if (RM) { el.textContent = to; return; }
    var t0 = performance.now();
    var step = function (t) {
      var k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = "0";
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in w) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) countUp(en.target); }); }, { threshold: 0.6 });
    $$("[data-to]").forEach(function (el) { cio.observe(el); });
  }

  /* ---------------------------------------------------------------- layout features: sticky stage */
  var lfItems = $$(".lf-i"), lfFrames = $$(".lf-f");
  if (lfItems.length && "IntersectionObserver" in w) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = en.target.getAttribute("data-lf-i");
        lfItems.forEach(function (x) { x.classList.toggle("is-on", x === en.target); });
        lfFrames.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-lf-f") === i); });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    lfItems.forEach(function (x) { lio.observe(x); });
  }

  /* ---------------------------------------------------------------- map <-> list */
  $$("[data-pt-link]").forEach(function (a) {
    var s = a.getAttribute("data-pt-link"), sec = a.closest("[data-map]"), pt2 = sec && $('[data-pt="' + s + '"]', sec);
    var on = function () { if (pt2) pt2.classList.add("is-hot"); a.classList.add("is-hot"); };
    var off = function () { if (pt2) pt2.classList.remove("is-hot"); a.classList.remove("is-hot"); };
    a.addEventListener("mouseenter", on); a.addEventListener("mouseleave", off);
    a.addEventListener("focus", on); a.addEventListener("blur", off);
    if (pt2) { pt2.addEventListener("mouseenter", on); pt2.addEventListener("mouseleave", off); }
  });

  /* ---------------------------------------------------------------- GSAP: smooth scroll, pinned rail, parallax */
  var boot = function () {
    if (RM || !w.gsap || !w.ScrollTrigger) return;
    var gsap = w.gsap, ST = w.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (w.Lenis && !("ontouchstart" in w && w.matchMedia("(pointer: coarse)").matches)) {
      var lenis = new w.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      w.__lenis = lenis;
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) { var t = $(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); } });
      });
    }
    $$("[data-parallax]").forEach(function (el) {
      gsap.fromTo(el, { yPercent: -4 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: true } });
    });
    var dusk = $("[data-dusk] [data-parallax]");
    if (dusk) gsap.fromTo(dusk, { yPercent: -7 }, { yPercent: 7, ease: "none", overwrite: true, scrollTrigger: { trigger: dusk.parentElement, start: "top bottom", end: "bottom top", scrub: true } });

    var mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 680px)", function () {
      var rail = $("[data-rail]"), track = $("[data-rail-track]");
      if (!rail || !track) return;
      rail.classList.add("is-pinned");
      var cards = $$(".pc", track), idx = $("[data-rail-i]");
      var dist = function () { return Math.max(0, track.scrollWidth - track.parentElement.clientWidth + 32); };
      var tw = gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: {
          trigger: rail, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) { if (idx) idx.textContent = ("0" + Math.min(cards.length, 1 + Math.floor(self.progress * cards.length * 0.999))).slice(-2); }
        }
      });
      cards.forEach(function (c) { c.classList.add("is-in"); });
      return function () { rail.classList.remove("is-pinned"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "x" }); };
    });
    d.fonts && d.fonts.ready.then(function () { ST.refresh(); });
    w.addEventListener("load", function () { ST.refresh(); });
  };
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();

  /* ---------------------------------------------------------------- plot finder (3 steps -> shortlist) */
  $$("[data-finder]").forEach(function (root) {
    var data = JSON.parse($("[data-fd-data]", root).textContent);
    var form = $(".fz-form", root), res = $("[data-fz-res]", root), list = $("[data-fd-list]", root);
    var qs = $$(".fz-q", root), label = $("[data-fz-label]", root), bar = $("[data-fz-bar]", root);
    var back = $("[data-fz-back]", root), send = $("[data-fd-send]", root), more = $("[data-fz-more]", root), cmda = $("[data-fz-cmda]", root);
    var WA = "917200810081", step = 1, showAll = false;
    var ARROW = '<svg class="ar" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var fmt = function (n) { return n.toLocaleString("en-IN"); };
    var picked = function (n) { var i = $('input[name="' + n + '"]:checked', form); return i ? { v: i.value, t: $("b", i.parentElement).textContent } : null; };
    var go = function (n, init) {
      step = n;
      qs.forEach(function (q) { q.classList.toggle("is-on", +q.getAttribute("data-q") === n); });
      var done = n > qs.length;
      form.hidden = done; res.hidden = !done;
      label.textContent = done ? "Done" : "Step " + n + " of " + qs.length;
      bar.style.transform = "scaleX(" + Math.min(1, (n - 1) / qs.length) + ")";
      back.disabled = n === 1;
      if (done) { showAll = false; render(); }
      if (init) return;
      var top = root.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6) { var y = top + scrollY - 90; w.__lenis ? w.__lenis.scrollTo(y) : w.scrollTo({ top: y, behavior: RM ? "auto" : "smooth" }); }
      var first = done ? $("[data-fz-title]", root) : $('.fz-q.is-on input:checked, .fz-q.is-on input', form);
      if (first && done) { first.setAttribute("tabindex", "-1"); first.focus({ preventScroll: true }); }
    };
    form.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      setTimeout(function () { go(step + 1); }, RM ? 0 : 260);
    });
    back.addEventListener("click", function () { if (step > 1) go(step - 1); });
    $("[data-fz-restart]", root).addEventListener("click", function () { form.reset(); go(1); });
    cmda.addEventListener("change", render);
    more.addEventListener("click", function () { showAll = !showAll; render(); });
    function render() {
      var R = picked("region"), B = picked("budget"), S = picked("size");
      var region = R ? R.v : "any", budget = !B || B.v === "any" ? 999 : +B.v, size = S ? S.v : "any";
      var lo = 0, hi = 1e9; if (size !== "any") { var pr = size.split("-"); lo = +pr[0]; hi = +pr[1]; }
      $("[data-fz-ans]", root).innerHTML = [[R, 1], [B, 2], [S, 3]].map(function (x) {
        return x[0] ? '<li><button type="button" data-goto="' + x[1] + '"><span>' + esc(x[0].t) + '</span><span class="mono">Change</span></button></li>' : "";
      }).join("");
      $$("[data-goto]", root).forEach(function (b2) { b2.addEventListener("click", function () { go(+b2.getAttribute("data-goto")); }); });
      var rows = data.map(function (p) {
        var score = 0, why = [];
        if (region !== "any") {
          var hit = p.regions[region];
          if (hit) { score += p.primary === region ? 3 : 2; why.push({ ok: true, t: hit[0] }); }
          else why.push({ ok: false, t: "Not near " + R.t });
        }
        if (p.price == null) { score += 1; why.push({ ok: null, t: "Price on request" }); }
        else if (p.price <= budget) { score += 2; why.push({ ok: true, t: "From ₹" + p.price + " lakh, in your budget" }); }
        else why.push({ ok: false, t: "From ₹" + p.price + " lakh, above your budget" });
        if (size === "any") score += 1;
        else if (p.max >= lo && p.min <= hi) { score += 2; why.push({ ok: true, t: "Has plots in your size (" + fmt(p.min) + "–" + fmt(p.max) + " sq ft)" }); }
        else why.push({ ok: false, t: "Plots are " + fmt(p.min) + "–" + fmt(p.max) + " sq ft" });
        var max = (region !== "any" ? 3 : 0) + 4;
        return { p: p, score: score, pct: Math.round(score / max * 100), why: why, out: cmda.checked && !p.cmda };
      }).filter(function (r) { return !r.out; }).sort(function (a, b) { return b.score - a.score || (a.p.price || 99) - (b.p.price || 99); });
      var strong = rows.filter(function (r) { return r.pct >= 70; }).length;
      $("[data-fz-title]", root).textContent = strong ? strong + (strong === 1 ? " layout fits you well" : " layouts fit you well") : "Closest matches for you";
      var shown = showAll ? rows : rows.slice(0, 3);
      more.hidden = rows.length <= 3;
      more.textContent = showAll ? "Show top 3 only" : "Show all " + rows.length + " layouts";
      var ctx = [R && region !== "any" ? "I work near " + R.t : "", B ? "budget " + B.t : "", S && size !== "any" ? "plot " + S.t : ""].filter(Boolean).join(", ");
      list.innerHTML = shown.map(function (r, i) {
        var msg = "Hi Merloam, plot enquiry from your website.\n\nLayout: " + r.p.name + ", " + r.p.place + "\nPrice: " + (r.p.price ? "from ₹" + r.p.price + " lakh" : "on request") + "\nPlot sizes: " + fmt(r.p.min) + "–" + fmt(r.p.max) + " sq ft" + (R && region !== "any" ? "\nI work near: " + R.t : "") + (B ? "\nMy budget: " + B.t : "") + (S && size !== "any" ? "\nPlot size I want: " + S.t : "") + "\n\nPlease share available plots and a site-visit slot.";
        return '<li class="fzr' + (i === 0 ? " fzr--top" : "") + '" style="--i:' + i + '" data-slug="' + r.p.slug + '" data-pct="' + r.pct + '">' +
          '<a class="fzr-img" href="' + r.p.url + '" data-open="' + r.p.slug + '" tabindex="-1" aria-hidden="true"><img src="' + r.p.img + '" alt="" width="400" height="300" loading="lazy" decoding="async"></a>' +
          '<div class="fzr-b"><div class="fzr-top"><span class="fzr-rank mono">' + (i === 0 ? "Best match" : "Match " + (i + 1)) + '</span><span class="fzr-pct">' + r.pct + '% fit</span></div>' +
          '<h4 class="fzr-h">' + esc(r.p.name) + '</h4><p class="fzr-m">' + esc(r.p.place) + " · " + (r.p.price ? "from ₹" + r.p.price + " lakh" : "price on request") + " · " + esc(r.p.approval) + "</p>" +
          '<ul class="fzr-why">' + r.why.map(function (x) { return '<li class="' + (x.ok === null ? "na" : x.ok ? "" : "no") + '">' + esc(x.t) + "</li>"; }).join("") + "</ul>" +
          '<div class="fzr-acts"><a class="fzr-go" href="' + r.p.url + '" data-open="' + r.p.slug + '">See the layout ' + ARROW + '</a><a class="fzr-wa" href="https://wa.me/' + WA + "?text=" + encodeURIComponent(msg) + '" target="_blank" rel="noopener">Ask on WhatsApp ' + ARROW + "</a></div></div></li>";
      }).join("");
      var top3 = rows.slice(0, 3).map(function (r) { return r.p.name + " (" + r.p.place + ")"; }).join(", ");
      send.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi Merloam, my plot finder shortlist from your website.\n\n" + rows.slice(0, 3).map(function (r, k) { return (k + 1) + ". " + r.p.name + ", " + r.p.place + " (" + (r.p.price ? "from ₹" + r.p.price + " L" : "price on request") + ")"; }).join("\n") + (R && region !== "any" ? "\n\nI work near: " + R.t : "\n") + (B ? "\nMy budget: " + B.t : "") + (S && size !== "any" ? "\nPlot size I want: " + S.t : "") + "\n\nPlease share availability and a site-visit slot.");
    }

    /* ---- expanded layout view: the chosen card grows, the rest leave; costs + nearby below */
    var det = $("[data-fz-detail]", root), cache = {}, lastY = 0;
    var vt = function (fn) { if (d.startViewTransition && !RM) d.startViewTransition(fn); else fn(); };
    var load = function (url) {
      if (cache[url]) return Promise.resolve(cache[url]);
      return fetch(url).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var pick = function (s) { var el = doc.querySelector(s); return el ? el.outerHTML : ""; };
        cache[url] = { facts: pick(".fxs"), ex: pick("#explore .ex-grid"), plan: pick(".pl-img"), brochure: (doc.querySelector('a[href$=".pdf"]') || {}).href || "" };
        return cache[url];
      });
    };
    var openDetail = function (slug, push) {
      var p = data.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
      var li = $('.fzr[data-slug="' + slug + '"]', list), pct = li ? li.getAttribute("data-pct") : "";
      var why = li ? $(".fzr-why", li).outerHTML : "";
      var wa = li ? $(".fzr-wa", li).href : "https://wa.me/" + WA;
      lastY = scrollY;
      load(p.url).then(function (c) {
        var big = p.img.replace(/-\d+\.webp$/, function (m) { return m; });
        if (li) $(".fzr-img img", li).style.viewTransitionName = "fz-hero";
        vt(function () {
          if (li) $(".fzr-img img", li).style.viewTransitionName = "";
          det.innerHTML =
            '<button type="button" class="fzd-back" data-fz-close><svg class="ar" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>Back to your shortlist</span></button>' +
            '<div class="fzd-hero"><img src="' + big + '" alt="' + esc(p.name) + ', ' + esc(p.place) + '" width="1200" height="800" style="view-transition-name:fz-hero">' +
            '<div class="fzd-cap">' + (pct ? '<span class="fzr-pct">' + pct + '% fit</span>' : "") + '<h3 class="fzd-h" tabindex="-1">' + esc(p.name) + '</h3><p>' + esc(p.place) + " · " + (p.price ? "from ₹" + p.price + " lakh" : "price on request") + " · " + esc(p.approval) + "</p></div></div>" +
            '<div class="fzd-body"><div class="fzd-why">' + why + '<div class="fzd-acts"><a class="btn btn--primary" href="' + wa + '" target="_blank" rel="noopener"><span class="btn-t">Book a site visit on WhatsApp</span>' + ARROW + '</a><a class="btn btn--ghost" href="' + p.url + '"><span class="btn-t">Full layout page</span>' + ARROW + "</a></div></div>" +
            '<p class="fzd-t mono">What it costs, what it could be worth, what is near</p>' + c.ex + c.facts + (c.plan ? '<p class="fzd-t mono">Site plan</p>' + c.plan : "") + "</div>";
          $$("[data-reveal],[data-split],[data-unmask]", det).forEach(function (el) { el.classList.add("is-in"); });
          root.classList.add("is-detail");
          res.hidden = true; det.hidden = false;
          var top = root.getBoundingClientRect().top + scrollY - 80;
          if (w.__lenis) w.__lenis.scrollTo(top, { immediate: true }); else w.scrollTo(0, top);
          initEx(det);
          $("[data-fz-close]", det).addEventListener("click", function () { history.state && history.state.fz ? history.back() : closeDetail(); });
        });
        if (push !== false) history.pushState({ fz: slug }, "");
        setTimeout(function () { var h3 = $(".fzd-h", det); if (h3) h3.focus({ preventScroll: true }); }, 450);
        if (w.ScrollTrigger) setTimeout(function () { w.ScrollTrigger.refresh(); }, 500);
      });
    };
    var closeDetail = function () {
      if (det.hidden) return;
      var slug = (history.state && history.state.fz) || "";
      var dimg = $(".fzd-hero img", det);
      vt(function () {
        det.hidden = true; det.innerHTML = ""; res.hidden = false; root.classList.remove("is-detail");
        if (w.__lenis) w.__lenis.scrollTo(lastY, { immediate: true }); else w.scrollTo(0, lastY);
      });
      if (w.ScrollTrigger) setTimeout(function () { w.ScrollTrigger.refresh(); }, 500);
    };
    list.addEventListener("click", function (ev) {
      var a = ev.target.closest("[data-open]"); if (!a || ev.metaKey || ev.ctrlKey) return;
      ev.preventDefault(); ev.stopPropagation(); openDetail(a.getAttribute("data-open"));
    });
    w.addEventListener("popstate", function () { if (!det.hidden) closeDetail(); });
    go(1, true);
  });

  /* ---------------------------------------------------------------- enquiry forms -> WhatsApp */
  $$("[data-enquiry]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = f.elements.name, phone = f.elements.phone, proj = f.elements.project;
      var ok = true;
      [name, phone].forEach(function (i) { i.closest(".fld").classList.remove("is-bad"); });
      if (!name.value.trim()) { name.closest(".fld").classList.add("is-bad"); ok = false; }
      var digits = phone.value.replace(/\D/g, "");
      if (digits.length < 10) { phone.closest(".fld").classList.add("is-bad"); ok = false; }
      var note = $(".form-note", f);
      if (!ok) { note.classList.remove("is-ok"); note.firstChild.textContent = "Please add your name and a 10-digit phone number. "; (name.value.trim() ? phone : name).focus(); return; }
      var msg = "Hi Merloam, site visit request from your website.\n\nName: " + name.value.trim() + "\nPhone: " + phone.value.trim() + "\nLayout: " + (proj.value || "Not sure yet, please help me choose") + "\n\nPlease call me back to book a site visit.";
      w.open("https://wa.me/917200810081?text=" + encodeURIComponent(msg), "_blank", "noopener");
      note.classList.add("is-ok");
      note.firstChild.textContent = "Thank you, " + name.value.trim().split(" ")[0] + ". WhatsApp opened with your message ready to send. ";
    });
  });

  /* ---------------------------------------------------------------- projects filter */
  var chips = $$(".fchip"), items = $$(".pg-i");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-filter");
      chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      items.forEach(function (it) {
        var show = f === "all" || (" " + it.getAttribute("data-tags") + " ").indexOf(" " + f + " ") > -1;
        it.classList.toggle("is-hid", !show);
        if (show) { var pc = $(".pc", it); if (pc) pc.classList.add("is-in"); }
      });
      if (w.ScrollTrigger) w.ScrollTrigger.refresh();
    });
  });

  /* ---------------------------------------------------------------- lightbox */
  var lb = $(".lb"), set = $("[data-lb-set]"), lbI = 0, lbSrc = set ? JSON.parse(set.getAttribute("data-lb-set")) : [], lastFocus = null;
  var showLb = function (i) {
    lbI = (i + lbSrc.length) % lbSrc.length;
    var im = $(".lb-img", lb); im.src = lbSrc[lbI];
    $("[data-lb-c]", lb).textContent = (lbI + 1) + " / " + lbSrc.length;
  };
  function closeLb() {
    if (!lb || lb.hidden) return;
    lb.hidden = true; h.style.overflow = ""; if (w.__lenis) w.__lenis.start(); if (lastFocus) lastFocus.focus();
  }
  if (lb && set) {
    $$("[data-lbi]", set).forEach(function (b) {
      b.addEventListener("click", function () {
        lastFocus = b; lb.hidden = false; h.style.overflow = "hidden"; if (w.__lenis) w.__lenis.stop();
        showLb(+b.getAttribute("data-lbi")); $(".lb-x", lb).focus();
      });
    });
    $(".lb-x", lb).addEventListener("click", closeLb);
    $(".lb-p", lb).addEventListener("click", function () { showLb(lbI - 1); });
    $(".lb-n", lb).addEventListener("click", function () { showLb(lbI + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    d.addEventListener("keydown", function (e) { if (lb.hidden) return; if (e.key === "ArrowLeft") showLb(lbI - 1); if (e.key === "ArrowRight") showLb(lbI + 1); });
  }

  /* ---------------------------------------------------------------- map on tap */
  $$("[data-mapframe]").forEach(function (m) {
    var b = $(".loc-load", m);
    b && b.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = m.getAttribute("data-mapframe"); f.title = "Map"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      var sv = $("svg", m); if (sv) sv.remove();
      m.appendChild(f); b.remove();
    });
  });


  function initEx(scope) {
  /* ---------------------------------------------------------------- plot explorer: nearby tabs */
  $$("[data-ex]", scope).forEach(function (box) {
    var tabs = $$("[data-ex-tab]", box), panes = $$("[data-ex-pane]", box);
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function () {
        var k = tb.getAttribute("data-ex-tab");
        tabs.forEach(function (x) { var on = x === tb; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        panes.forEach(function (p) { var on = p.getAttribute("data-ex-pane") === k; p.hidden = !on; p.classList.toggle("is-on", on); });
      });
    });
  });

  /* ---------------------------------------------------------------- plot explorer: cost & growth scenarios */
  $$("[data-calc]", scope).forEach(function (box) {
    var D = JSON.parse($("[data-cl-data]", box).textContent);
    var f = function (n) { return box.querySelector('[name="' + n + '"]'); };
    var o = function (n) { return box.querySelector('[data-o="' + n + '"]'); };
    var r = function (n) { return box.querySelector('[data-r="' + n + '"]'); };
    var svg = $("[data-chart]", box), wa = $("[data-cl-wa]", box);
    var inr = function (v) {
      if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
      return "₹" + (v / 1e5).toFixed(v >= 1e6 ? 1 : 2) + " L";
    };
    var calc = function () {
      var size = +f("size").value, rate = Math.max(0, +f("rate").value || 0), g = +f("g").value / 100, y = +f("y").value, sd = Math.max(0, +f("sd").value || 0) / 100;
      o("size").textContent = size.toLocaleString("en-IN") + " sq ft";
      o("g").textContent = (g * 100).toFixed(1).replace(".0", "") + " %";
      o("y").textContent = y + (y === 1 ? " year" : " years");
      ["size", "g", "y"].forEach(function (n) { var i = f(n); i.style.setProperty("--fill", ((i.value - i.min) / (i.max - i.min) * 100) + "%"); });
      var cost = size * rate, reg = Math.max(cost, size * D.guideline) * sd, tot = cost + reg;
      r("cost").textContent = inr(cost); r("reg").textContent = inr(reg); r("total").textContent = inr(tot);
      var lo = Math.max(0, g - 0.03), hi = g + 0.03;
      var at = function (k, yr) { return cost * Math.pow(1 + k, yr); };
      var mid0 = at(g, y);
      var pc = function (k) { return (k * 100).toFixed(1).replace(".0", ""); };
      r("fy").textContent = "In " + y + (y === 1 ? " year" : " years") + ", this plot could be worth";
      r("frange").textContent = inr(at(lo, y)) + " – " + inr(at(hi, y));
      r("fsub").textContent = "Estimate at " + pc(lo) + "–" + pc(hi) + " % growth a year, on " + inr(cost) + " today. Not a promise.";
      r("range").textContent = "Middle estimate " + inr(mid0) + " at " + pc(g) + " % a year · you pay " + inr(tot) + " today incl. registration";
      var W = 600, H = 240, base = cost * 0.85, top = at(hi, y) * 1.05;
      var sx = function (i) { return i / y * W; }, sy = function (v) { return H - (v - base) / (top - base) * H; };
      var up = [], dn = [], mid = [];
      for (var i = 0; i <= y; i++) { up.push(sx(i).toFixed(1) + "," + sy(at(hi, i)).toFixed(1)); dn.unshift(sx(i).toFixed(1) + "," + sy(at(lo, i)).toFixed(1)); mid.push(sx(i).toFixed(1) + "," + sy(at(g, i)).toFixed(1)); }
      var grid = "", ov = "", lv = [base + (top - base) * 0.25, base + (top - base) * 0.5, base + (top - base) * 0.75];
      lv.forEach(function (v) { grid += '<line class="cl-g" x1="0" x2="' + W + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '"/>'; ov += '<span class="cl-yl mono" style="top:' + (sy(v) / H * 100).toFixed(2) + '%">' + inr(v) + "</span>"; });
      svg.innerHTML = grid + '<polygon class="cl-band" points="' + up.concat(dn).join(" ") + '"/><polyline class="cl-mid" points="' + mid.join(" ") + '"/>';
      var step = y <= 6 ? 1 : y <= 10 ? 2 : 3, tags = [0, Math.round(y / 2), y].filter(function (v, k, a) { return a.indexOf(v) === k; });
      for (i = 0; i <= y; i++) {
        var lx = (sx(i) / W * 100).toFixed(2), ly = (sy(at(g, i)) / H * 100).toFixed(2);
        ov += '<i class="cl-dot' + (tags.indexOf(i) > -1 ? " on" : "") + '" style="left:' + lx + "%;top:" + ly + '%"></i>';
        if (tags.indexOf(i) > -1) ov += '<span class="cl-tag' + (i === 0 ? " s" : i === y ? " e" : "") + '" style="left:' + lx + "%;top:" + ly + '%">' + inr(at(g, i)) + "</span>";
      }
      $("[data-ov]", box).innerHTML = ov;
      var xs = "";
      var narrow = box.clientWidth < 520;
      for (i = 0; i <= y; i++) if (narrow ? tags.indexOf(i) > -1 : (i % step === 0 && y - i >= step) || i === y || i === 0) xs += '<span class="' + (i === 0 ? "s" : i === y ? "e" : "") + '" style="left:' + (sx(i) / W * 100).toFixed(2) + '%">' + (i === 0 ? "Today" : "Yr " + i) + "</span>";
      $("[data-x]", box).innerHTML = xs;
      wa.href = "https://wa.me/917200810081?text=" + encodeURIComponent(
        "Hi Merloam, plot enquiry from your website.\n\n" +
        "Layout: " + D.name + "\n" +
        "Plot size: about " + size.toLocaleString("en-IN") + " sq ft\n" +
        "Rate I'm looking at: ₹" + rate.toLocaleString("en-IN") + " per sq ft\n" +
        "Approx. plot cost: " + inr(cost) + "\n\n" +
        "Please share available plots in this size, the current rate and a site-visit slot.");
    };
    box.addEventListener("input", calc);
    calc();
  });

  }
  initEx(d);

  /* ---------------------------------------------------------------- open now (IST) */
  var openEls = $$("[data-open]");
  if (openEls.length) {
    var ist = 330 + new Date().getTimezoneOffset(), now = new Date(Date.now() + ist * 60000);
    var day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var open = day === 0 ? mins >= 600 && mins < 840 : mins >= 600 && mins < 1140;
    openEls.forEach(function (el) {
      el.textContent = open ? "Open now" : "Closed now · opens 10 AM";
      el.classList.toggle("is-open", open);
    });
  }
})();
