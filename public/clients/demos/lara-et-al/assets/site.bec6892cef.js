/* lara et al redesign concept: one IIFE, every feature existence-guarded. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, w = window;
  var RM = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var lenis = null;

  /* ---------- header, drawer, bar, dock ---------- */
  var hd = $("#hd"), bar = $(".bar");
  function onScroll() {
    var y = w.scrollY || 0;
    if (hd) hd.classList.toggle("is-scrolled", y > 24);
    if (bar) bar.classList.toggle("is-on", y > w.innerHeight * 0.6);
  }
  w.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var burger = $("#burger"), drawer = $("#drawer"), dx = $("#drawer-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    if (open) setTimeout(function () { dx && dx.focus(); }, 50); else burger && burger.focus();
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(true); });
    dx && dx.addEventListener("click", function () { setDrawer(false); });
    d.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  }
  var dock = $("#dock"), dockX = $("#dock-x");
  try { if (sessionStorage.getItem("le-dock") === "1" && dock) dock.hidden = true; } catch (e) {}
  dockX && dockX.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("le-dock", "1"); } catch (e) {} });

  /* ---------- sticky bar steps aside for Room Studio, the form and the footer ---------- */
  if (bar && "IntersectionObserver" in w) {
    var busy = new Set();
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) busy.add(en.target); else busy.delete(en.target); });
      bar.classList.toggle("is-off", busy.size > 0);
    });
    $$("#room, .rs-page, .rs-embed, #enq, .ft, .dock").forEach(function (el) { bio.observe(el); });
  }

  /* ---------- Room Studio: phone comfort inside the widget (open shadow root) ---------- */
  var RS_CSS = ".chip{height:44px!important;min-height:44px}.caption{font-size:13px!important}.card .nm{font-size:max(13px,1em)!important}";
  $$(".rs-embed").forEach(function (box) {
    var tries = 0;
    var ensure = function (sr) {
      if (!sr.querySelector("style[data-le]")) { var st = d.createElement("style"); st.setAttribute("data-le", ""); st.textContent = RS_CSS; sr.appendChild(st); }
    };
    var t = setInterval(function () {
      var host = box.shadowRoot ? box : $$("*", box).filter(function (x) { return x.shadowRoot; })[0];
      if (host && host.shadowRoot) {
        clearInterval(t); ensure(host.shadowRoot);
        new MutationObserver(function () { ensure(host.shadowRoot); }).observe(host.shadowRoot, { childList: true });
      } else if (++tries > 60) clearInterval(t);
    }, 250);
  });

  /* ---------- reveals (IO + sweep fallback) ---------- */
  var rv = $$(".rv, .um");
  function show(el) { el.classList.add("in"); }
  if (RM || !("IntersectionObserver" in w)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () {
      var vh = w.innerHeight;
      rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); });
    };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }
  function heroIn(sel) { var h = $(sel); if (h) requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add("is-in"); }); }); }
  heroIn(".hero"); heroIn(".phero");

  /* ---------- hero slideshow (their 5 featured photos) ---------- */
  var slidesEl = $(".slides");
  if (slidesEl) {
    var sl = $$(".slide", slidesEl), caps = [];
    try { caps = JSON.parse(slidesEl.getAttribute("data-slides")); } catch (e) {}
    var cur = 0, timer = null, n = $("#sl-n"), cap = $("#sl-cap"), link = $("#sl-link");
    var go = function (i) {
      sl[cur].classList.remove("is-on"); sl[cur].setAttribute("aria-hidden", "true");
      cur = (i + sl.length) % sl.length;
      sl[cur].classList.add("is-on"); sl[cur].setAttribute("aria-hidden", "false");
      if (n) n.textContent = cur + 1;
      if (caps[cur]) { if (cap) cap.textContent = caps[cur].c; if (link) link.href = caps[cur].u; }
    };
    var visible = true, hover = false;
    var play = function () { stop(); if (!RM) timer = setInterval(function () { if (visible && !hover && !d.hidden) go(cur + 1); }, 6500); };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    $("#sl-prev") && $("#sl-prev").addEventListener("click", function () { go(cur - 1); play(); });
    $("#sl-next") && $("#sl-next").addEventListener("click", function () { go(cur + 1); play(); });
    var fr = $("#hero-frame");
    if (fr) {
      fr.addEventListener("mouseenter", function () { hover = true; });
      fr.addEventListener("mouseleave", function () { hover = false; });
      var sx = null;
      fr.addEventListener("touchstart", function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
      fr.addEventListener("touchend", function (ev) {
        if (sx === null) return; var dxx = ev.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dxx) > 50) { go(cur + (dxx < 0 ? 1 : -1)); play(); }
      }, { passive: true });
      if ("IntersectionObserver" in w) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(fr);
    }
    play();
  }

  /* ---------- statement words ---------- */
  var words = $$(".words");
  words.forEach(function (h) {
    var txt = h.textContent.trim().split(/\s+/);
    h.innerHTML = txt.map(function (t) { return '<span class="w">' + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(" ");
  });

  /* ---------- testimonials ---------- */
  $$("[data-tq]").forEach(function (wrap) {
    var sec = wrap.closest("section"), items = $$(".tq", wrap), dots = $$(".tq-dot", sec), i = 0;
    if (items.length < 2) return;
    var set = function (k) {
      items[i].classList.remove("is-on"); dots[i] && dots[i].classList.remove("is-on");
      i = (k + items.length) % items.length;
      items[i].classList.add("is-on"); dots[i] && dots[i].classList.add("is-on");
    };
    var p = $(".tq-prev", sec), nx = $(".tq-next", sec);
    p && p.addEventListener("click", function () { set(i - 1); });
    nx && nx.addEventListener("click", function () { set(i + 1); });
    dots.forEach(function (b) { b.addEventListener("click", function () { set(+b.getAttribute("data-go")); }); });
  });

  /* ---------- chips: project filter + room filter ---------- */
  function chipGroup(group, attr, items) {
    var chips = $$(".chip", group);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var v = c.getAttribute(attr);
        chips.forEach(function (o) { o.classList.toggle("is-on", o === c); o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        items.forEach(function (it) {
          var ok = v === "all" || it.getAttribute(attr) === v;
          it.hidden = !ok;
          if (ok) it.classList.add("in");
        });
        if (w.ScrollTrigger) w.ScrollTrigger.refresh();
      });
    });
  }
  var pg = $("#pgrid");
  if (pg) chipGroup($(".phead .chips"), "data-filter", $$(".pcard", pg).map(function (c) { c.setAttribute("data-filter", c.getAttribute("data-region")); return c; }));
  var gal = $("#gal");
  if (gal) chipGroup($(".gal-wrap .chips"), "data-room", $$(".g-item", gal));

  /* ---------- lightbox ---------- */
  var lb = $("#lb");
  if (gal && lb) {
    var data = []; try { data = JSON.parse(gal.getAttribute("data-lb")); } catch (e) {}
    var li = 0, lim = $(".lb-img", lb), lcap = $(".lb-cap", lb), last = null;
    var vis = function () { return $$(".g-open", gal).filter(function (b) { return !b.closest(".g-item").hidden; }).map(function (b) { return +b.getAttribute("data-idx"); }); };
    var draw = function () {
      var it = data[li]; if (!it) return;
      lim.removeAttribute("src"); lim.srcset = it.s; lim.sizes = "92vw"; lim.width = it.w; lim.height = it.h; lim.alt = it.a;
      var parts = it.s.split(", "); lim.src = parts[parts.length - 1].split(" ")[0];
      lcap.textContent = it.a + " (" + (vis().indexOf(li) + 1) + " / " + vis().length + ")";
    };
    var open = function (k) { last = d.activeElement; li = k; draw(); lb.hidden = false; de.style.overflow = "hidden"; lenis && lenis.stop(); $(".lb-x", lb).focus(); };
    var close = function () { lb.hidden = true; de.style.overflow = ""; lenis && lenis.start(); last && last.focus(); };
    var step = function (s) { var v = vis(), p = v.indexOf(li); li = v[(p + s + v.length) % v.length]; draw(); };
    $$(".g-open", gal).forEach(function (b) { b.addEventListener("click", function () { open(+b.getAttribute("data-idx")); }); });
    $(".lb-x", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { step(-1); });
    $(".lb-next", lb).addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) close(); });
    d.addEventListener("keydown", function (ev) {
      if (lb.hidden) return;
      if (ev.key === "Escape") close(); else if (ev.key === "ArrowRight") step(1); else if (ev.key === "ArrowLeft") step(-1);
      else if (ev.key === "Tab") { var f = $$("button", lb); var a = f.indexOf(d.activeElement); ev.preventDefault(); f[(a + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    var tx = null;
    lb.addEventListener("touchstart", function (ev) { tx = ev.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (ev) { if (tx === null) return; var dd = ev.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dd) > 50) step(dd < 0 ? 1 : -1); }, { passive: true });
  }

  /* ---------- enquiry form -> prefilled email ---------- */
  var form = $("#enq");
  if (form) {
    var qs = new URLSearchParams(w.location.search), msg = $("#f-msg");
    var pre = qs.get("project") ? "Project I liked: " + qs.get("project") + "\n\n" : qs.get("service") ? "Service: " + qs.get("service") + "\n\n" : "";
    if (pre && msg && !msg.value) msg.value = pre;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = new FormData(form), err = $("#enq-err");
      var name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.hidden = false; (name ? $("#f-email") : $("#f-name")).focus(); return; }
      err.hidden = true;
      var lines = ["Name: " + name, "Email: " + email];
      if (f.get("phone")) lines.push("Phone: " + f.get("phone"));
      if (f.get("location")) lines.push("Property: " + f.get("location"));
      lines.push("Help with: " + (f.get("type") || ""));
      lines.push("", (f.get("message") || "").trim());
      w.location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(form.getAttribute("data-subject") + " from " + name) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------- services: sticky photo follows the list ---------- */
  var svItems = $$(".sv-item"), svPics = $$(".sv-pic");
  if (svItems.length && "IntersectionObserver" in w) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = en.target.getAttribute("data-i");
        svItems.forEach(function (x) { x.classList.toggle("is-on", x === en.target); });
        svPics.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-i") === i); });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    svItems.forEach(function (x) { sio.observe(x); });
    svItems[0].classList.add("is-on");
  }

  /* ---------- GSAP scroll scenes ---------- */
  function scenes() {
    var g = w.gsap, ST = w.ScrollTrigger;
    if (!g || !ST || RM) {
      $$(".words .w").forEach(function (s) { s.style.opacity = 1; });
      return;
    }
    g.registerPlugin(ST);
    if (w.Lenis) {
      lenis = new w.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ST.update);
      g.ticker.add(function (t) { lenis.raf(t * 1000); });
      g.ticker.lagSmoothing(0);
    }
    var mm = g.matchMedia();

    // hero frame opens: their inset card grows to full-bleed
    var frame = $("#hero-frame");
    if (frame) {
      ST.create({ trigger: ".hero", start: "top top", end: function () { return "+=" + Math.max(200, $(".hero").offsetHeight - w.innerHeight * 0.55); },
        scrub: true, onUpdate: function (s) { frame.style.setProperty("--p", s.progress.toFixed(4)); } });
    }
    // statement words light up
    $$(".words").forEach(function (h) {
      var ws = $$(".w", h);
      g.to(ws, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: h, start: "top 82%", end: "bottom 42%", scrub: true } });
    });
    // parallax bands
    $$("[data-par]").forEach(function (el) {
      g.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    mm.add("(min-width: 900px) and (min-height: 640px)", function () {
      // projects rail: pinned horizontal
      var rail = $("#rail"), track = rail && $(".rail-track", rail);
      if (rail && track) {
        rail.classList.add("is-pinned");
        var dist = function () { return Math.max(0, track.scrollWidth - w.innerWidth); };
        var tw = g.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: rail, start: "top top", end: function () { return "+=" + dist(); }, pin: ".rail-pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        // cards drift in depth as they cross the screen
        $$(".rail-card img", track).forEach(function (im) {
          g.fromTo(im, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im.closest(".rail-card"), containerAnimation: tw, start: "left right", end: "center center", scrub: true } });
        });
      }
      // Chelsea stack: rooms layer over each other
      var stack = $("#stack");
      if (stack) {
        var cards = $$(".sk-card", stack);
        stack.classList.add("is-live");
        g.set(cards, { yPercent: function (i) { return i ? 105 : 0; } });
        var tl = g.timeline({ scrollTrigger: { trigger: stack, start: "top " + (parseInt(getComputedStyle(hd).height, 10) + 20), end: "+=" + (cards.length - 1) * 90 + "%", pin: true, scrub: 0.6, anticipatePin: 1 } });
        cards.forEach(function (c, i) {
          if (!i) return;
          tl.to(cards[i - 1], { scale: 0.94, opacity: 0, ease: "none", duration: 1 }, i - 1)
            .to(c, { yPercent: 0, ease: "none", duration: 1 }, i - 1)
            .fromTo($("img", c), { yPercent: -10 }, { yPercent: 0, ease: "none", duration: 1 }, i - 1);
        });
      }
      return function () {
        var r = $("#rail"); r && r.classList.remove("is-pinned");
        var s = $("#stack"); if (s) { s.classList.remove("is-live"); g.set($$(".sk-card", s), { clearProps: "all" }); }
      };
    });
    d.fonts && d.fonts.ready.then(function () { ST.refresh(); });
    w.addEventListener("load", function () { ST.refresh(); });
  }
  // deferred scripts run in order: gsap, ScrollTrigger and Lenis are ready here
  scenes();
})();
