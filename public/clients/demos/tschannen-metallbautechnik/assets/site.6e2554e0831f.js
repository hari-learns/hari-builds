(function () {
  "use strict";
  var doc = document, win = window;
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function run(name, fn) { try { fn(); } catch (err) { console.error("[init " + name + "]", err); } }

  /* ---------- header, drawer, dock ---------- */
  run("header", function () {
    var h = $("#hdr"); if (!h) return;
    function on() { h.classList.toggle("is-solid", win.scrollY > 40); }
    on(); win.addEventListener("scroll", on, { passive: true });
  });
  run("drawer", function () {
    var d = $("#drawer"), b = $("#burger"), x = $("#burger-x"); if (!d || !b) return;
    function set(open) {
      d.classList.toggle("is-open", open); d.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) d.removeAttribute("inert"); else d.setAttribute("inert", "");
      b.setAttribute("aria-expanded", open ? "true" : "false");
      doc.documentElement.style.overflow = open ? "hidden" : "";
      if (open) x.focus(); else b.focus({ preventScroll: true });
    }
    b.addEventListener("click", function () { set(true); });
    x.addEventListener("click", function () { set(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.classList.contains("is-open")) set(false); });
    $$("a", d).forEach(function (a) { a.addEventListener("click", function () { doc.documentElement.style.overflow = ""; }); });
    win.addEventListener("resize", function () { if (win.innerWidth >= 1180 && d.classList.contains("is-open")) set(false); });
  });
  run("dock", function () {
    var d = $("#dock"), x = $("#dock-x"); if (!d || !x) return;
    try { if (win.sessionStorage.getItem("dock-x") === "1") d.hidden = true; } catch (e) { /* storage blocked: dock stays visible */ }
    var mq = win.matchMedia("(max-width: 899px)");
    win.addEventListener("scroll", function () { d.classList.toggle("is-away", mq.matches && win.scrollY > 240); }, { passive: true });
    x.addEventListener("click", function () { d.hidden = true; try { win.sessionStorage.setItem("dock-x", "1"); } catch (e) { /* ignore */ } });
  });

  /* ---------- reveal on scroll ---------- */
  run("reveal", function () {
    var els = $$(".rv, .tl"); if (!els.length) return;
    function act(el) { el.classList.add("is-in"); }
    if (reduce || !("IntersectionObserver" in win)) { els.forEach(act); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { act(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    function sweep() { var vh = win.innerHeight; els.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) act(el); }); }
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { win.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  });

  /* ---------- hero slideshow (their own project photos) ---------- */
  run("hero", function () {
    var hero = $("[data-hero]"); if (!hero) return;
    var slides = $$("[data-slide]", hero), dots = $$("[data-dot]", hero), caps = $$("[data-cap]", hero);
    var ms = 7000, i = 0, timer = null, visible = true, hold = false;
    hero.style.setProperty("--slide-ms", ms + "ms");
    function load(n) {
      var s = slides[n]; if (!s || s.dataset.loaded) return; s.dataset.loaded = "1";
      $$("source", s).forEach(function (o) { if (o.dataset.srcset) o.srcset = o.dataset.srcset; });
      var im = $("img", s); if (im && im.dataset.srcset) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; }
    }
    function show(n) {
      n = (n + slides.length) % slides.length; load(n); load((n + 1) % slides.length);
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === n); s.setAttribute("aria-hidden", k === n ? "false" : "true"); });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === n); d.setAttribute("aria-current", k === n ? "true" : "false"); });
      caps.forEach(function (c, k) { c.classList.toggle("is-active", k === n); c.tabIndex = k === n ? 0 : -1; });
      i = n;
    }
    function tick() { clearTimeout(timer); if (reduce || hold || !visible || doc.hidden) return; timer = setTimeout(function () { show(i + 1); tick(); }, ms); }
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); tick(); }); });
    if (reduce) hero.classList.add("is-static");
    hero.addEventListener("mouseenter", function () { hold = true; hero.classList.add("is-paused"); clearTimeout(timer); });
    hero.addEventListener("mouseleave", function () { hold = false; hero.classList.remove("is-paused"); show(i); tick(); });
    hero.addEventListener("focusin", function () { hold = true; hero.classList.add("is-paused"); clearTimeout(timer); });
    hero.addEventListener("focusout", function () { hold = false; hero.classList.remove("is-paused"); tick(); });
    doc.addEventListener("visibilitychange", tick);
    if ("IntersectionObserver" in win) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; tick(); }).observe(hero);
    var touchX = null;
    hero.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) { if (touchX === null) return; var dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) { show(i + (dx < 0 ? 1 : -1)); tick(); } touchX = null; });
    function start() { load(1); tick(); }
    if (doc.readyState === "complete") start(); else win.addEventListener("load", function () { if (win.requestIdleCallback) win.requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 800); });
  });

  /* ---------- parallax on the welding chapter (<= 6 %, desktop only) ---------- */
  run("parallax", function () {
    var els = $$("[data-parallax]"); if (!els.length || reduce || !win.matchMedia("(min-width: 900px)").matches) return;
    var ticking = false;
    function upd() { ticking = false; els.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(), c = r.top + r.height / 2 - win.innerHeight / 2; c = Math.max(-600, Math.min(600, c)); el.style.transform = "translate3d(0," + (c * -0.06).toFixed(1) + "px,0)"; }); }
    win.addEventListener("scroll", function () { if (!ticking) { ticking = true; win.requestAnimationFrame(upd); } }, { passive: true }); upd();
  });

  /* ---------- opening hours ---------- */
  run("open", function () {
    var data = $("#open-data"), nodes = $$("[data-open]"); if (!data || !nodes.length) return;
    var o = JSON.parse(data.textContent), map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    function upd() {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: o.tz, weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), wd = 0, mins = 0;
      p.forEach(function (x) { if (x.type === "weekday") wd = map[x.value]; if (x.type === "hour") mins += (parseInt(x.value, 10) % 24) * 60; if (x.type === "minute") mins += parseInt(x.value, 10); });
      var wins = o.win[String(wd)] || [], isOpen = wins.some(function (w) { return mins >= w[0] && mins < w[1]; });
      nodes.forEach(function (n) { n.classList.toggle("is-open", isOpen); $("[data-open-text]", n).textContent = isOpen ? o.open : o.closed; });
    }
    upd(); setInterval(upd, 60000);
  });

  /* ---------- lightbox + gallery filter ---------- */
  run("lightbox", function () {
    var btns = $$("[data-gallery] .gal__b"); if (!btns.length) return;
    var dlg = doc.createElement("dialog"); dlg.className = "lb"; dlg.setAttribute("aria-label", "Bildansicht");
    dlg.innerHTML = '<div class="lb__in"><figure class="lb__fig"><img alt=""></figure><p class="lb__cap" aria-live="polite"></p></div>' +
      '<button type="button" class="lb__b lb__x" aria-label="Schliessen">&times;</button><button type="button" class="lb__b lb__p" aria-label="Voriges Bild">&#8249;</button><button type="button" class="lb__b lb__n" aria-label="Nächstes Bild">&#8250;</button>';
    doc.body.appendChild(dlg);
    var img = $("img", dlg), cap = $(".lb__cap", dlg), idx = 0, list = [];
    function vis() { return btns.filter(function (b) { return !(b.closest("[hidden]")); }); }
    function go(n) {
      list = vis(); if (!list.length) return; idx = (n + list.length) % list.length; var b = list[idx];
      img.src = b.dataset.full; img.alt = b.dataset.cap; img.width = +b.dataset.w; img.height = +b.dataset.h; cap.textContent = b.dataset.cap + "  ·  " + (idx + 1) + " / " + list.length;
      var nx = list[(idx + 1) % list.length]; if (nx) { var pre = new Image(); pre.src = nx.dataset.full; }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { list = vis(); idx = list.indexOf(b); go(idx); if (!dlg.open) dlg.showModal(); }); });
    $(".lb__x", dlg).addEventListener("click", function () { dlg.close(); });
    $(".lb__p", dlg).addEventListener("click", function () { go(idx - 1); });
    $(".lb__n", dlg).addEventListener("click", function () { go(idx + 1); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") go(idx + 1); if (e.key === "ArrowLeft") go(idx - 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.classList.contains("lb__in") || e.target.classList.contains("lb__fig")) dlg.close(); });
    var tx = null; dlg.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); tx = null; });
  });
  run("filter", function () {
    var wrap = $("[data-filter]"); if (!wrap) return;
    var items = $$("[data-filtered] .mas__i"), chips = $$(".chip", wrap);
    chips.forEach(function (c) { c.addEventListener("click", function () {
      chips.forEach(function (o) { o.classList.toggle("is-on", o === c); o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
      var f = c.dataset.f; items.forEach(function (li) { li.hidden = !(f === "*" || li.dataset.svc === f); });
    }); });
  });

  /* ---------- downloads search ---------- */
  run("downloads", function () {
    var inp = $("[data-dsearch]"); if (!inp) return;
    var items = $$(".dlist li"), groups = $$("[data-group]"), count = $("[data-dcount]"), none = $("[data-dnone]");
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase(), n = 0;
      items.forEach(function (li) { var ok = !q || li.dataset.t.indexOf(q) !== -1; li.hidden = !ok; if (ok) n++; });
      groups.forEach(function (g) { g.hidden = !$$("li", g).some(function (li) { return !li.hidden; }); });
      count.textContent = n + (n === 1 ? " Dokument" : " Dokumente"); none.hidden = n !== 0;
    });
  });

  /* ---------- map + video on tap ---------- */
  run("map", function () {
    var m = $("[data-map]"); if (!m) return; var b = $(".map__b", m);
    b.addEventListener("click", function () { var f = doc.createElement("iframe"); f.src = m.dataset.src.replace(/&amp;/g, "&"); f.title = "Karte Ostermundigen"; f.loading = "lazy"; b.replaceWith(f); });
  });
  run("video", function () {
    var v = $("[data-video]"); if (!v) return; var b = $(".video__b", v);
    b.addEventListener("click", function () { var f = doc.createElement("iframe"); f.src = "https://www.youtube-nocookie.com/embed/" + v.dataset.video + "?autoplay=1&rel=0"; f.title = "Firmenvideo Tschannen Metallbautechnik AG"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; b.replaceWith(f); });
  });

  /* ---------- offer form -> prepared mail ---------- */
  run("rfq", function () {
    var form = $("#rfq"); if (!form) return;
    var cfg = JSON.parse($("#rfq-data").textContent), L = cfg.labels;
    var q = new URLSearchParams(win.location.search).get("l");
    if (q) $$("[data-slug]", form).forEach(function (c) { if (c.dataset.slug === q) c.checked = true; });
    function val(n) { var el = form.elements[n]; return el ? el.value.trim() : ""; }
    function compose() {
      var areas = $$("input[name=area]:checked", form).map(function (c) { return c.value; });
      var lines = ["Guten Tag", "", L.areas + ": " + areas.join(", ")];
      if (val("start")) lines.push(L.start + ": " + val("start"));
      if (val("budget")) lines.push(L.budget + ": " + val("budget"));
      lines.push("", L.msg + ":", val("msg") || "-", "", [val("salut"), val("first"), val("last")].filter(Boolean).join(" "));
      if (val("firm")) lines.push(L.firm + ": " + val("firm"));
      var adr = [val("addr"), [val("zip"), val("city")].filter(Boolean).join(" ")].filter(Boolean).join(", "); if (adr) lines.push(adr);
      if (val("tel")) lines.push(L.tel + ": " + val("tel")); if (val("mobile")) lines.push(L.mobile + ": " + val("mobile")); if (val("email")) lines.push(L.email + ": " + val("email"));
      lines.push("", "Freundliche Grüsse");
      return { areas: areas, subject: cfg.subject + (areas.length ? ": " + areas.join(", ") : ""), body: lines.join("\r\n") };
    }
    function ok() { var m = compose(); return val("first") && val("last") && (val("tel") || val("email")) && m.areas.length; }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $("[data-err]", form);
      if (!ok()) { err.hidden = false; err.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); return; }
      err.hidden = true; var m = compose();
      win.location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
    });
    var cp = $("[data-copy-rfq]", form);
    cp.addEventListener("click", function () { var m = compose(); copy(m.subject + "\n\n" + m.body.replace(/\r\n/g, "\n"), cp); });
  });
  function copy(text, btn) {
    var done = btn.dataset.done, old = btn.textContent;
    function ok() { btn.textContent = done; setTimeout(function () { btn.textContent = old; }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
    function fallback() { var t = doc.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; doc.body.appendChild(t); t.select(); try { doc.execCommand("copy"); ok(); } catch (e) { /* ignore */ } t.remove(); }
  }

  /* ---------- Blechrechner ---------- */
  run("tool", function () {
    var roots = $$("[data-tool]"), dataEl = $("#tool-data"); if (!roots.length || !dataEl) return;
    var D = JSON.parse(dataEl.textContent), UI = D.ui;
    function fmt(n) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "’"); }
    function chf(n) { return "CHF " + fmt(n); }
    function ft(t) { return String(+t.toFixed(2)) + " mm"; }
    function kg(n) { return n.toFixed(n < 10 ? 2 : 1).replace(/\.0$/, "") + " kg"; }
    function groupsOf(m) { return D.groups.filter(function (g) { return g.mat === m; }); }
    function gById(id) { return D.groups.filter(function (g) { return g.id === id; })[0]; }
    function label(g) { return g.title + (g.sub ? " – " + g.sub : ""); }

    roots.forEach(function (root, n) {
      var sync = root.hasAttribute("data-sync");
      var el = function (s) { return $("[" + s + "]", root); };
      var matsEl = el("data-mats"), sortEl = el("data-sort"), thickEl = el("data-thick"), wEl = el("data-w"), hEl = el("data-h"), qEl = el("data-q");
      var vis = el("data-vis"), sheet = el("data-sheet"), msg = el("data-msg"), res = el("data-res");
      var st = { mat: "stahl", gid: null, ti: 0, w: 500, h: 1000, q: 1 };
      st.gid = groupsOf(st.mat)[0].id;
      var P = new URLSearchParams(win.location.search);
      if (sync) {
        var g0 = P.get("g") && gById(P.get("g")); if (g0) { st.mat = g0.mat; st.gid = g0.id; }
        else if (P.get("m") && groupsOf(P.get("m")).length) { st.mat = P.get("m"); st.gid = groupsOf(st.mat)[0].id; }
        var g1 = gById(st.gid), t0 = parseFloat(P.get("t")); if (!isNaN(t0)) { g1.rows.forEach(function (r, k) { if (Math.abs(r.t - t0) < 0.001) st.ti = k; }); }
        ["w", "h", "q"].forEach(function (k) { var v = parseInt(P.get(k), 10); if (v > 0) st[k] = Math.min(v, k === "q" ? 999 : 6000); });
      }
      // presets
      var pre = el("data-presets"); D.presets.forEach(function (p) { var b = doc.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = p[0]; b.addEventListener("click", function () { st.w = p[1]; st.h = p[2]; draw(); }); pre.appendChild(b); });
      // static pieces
      D.mats.forEach(function (m) { var b = doc.createElement("button"); b.type = "button"; b.className = "chip"; b.setAttribute("role", "radio"); b.dataset.m = m.id; b.textContent = m.label;
        b.addEventListener("click", function () { st.mat = m.id; st.gid = groupsOf(m.id)[0].id; st.ti = 0; draw(); }); matsEl.appendChild(b); });
      sortEl.addEventListener("change", function () { st.gid = sortEl.value; st.ti = 0; draw(); });
      wEl.addEventListener("input", function () { st.w = parseInt(wEl.value, 10) || 0; calc(); });
      hEl.addEventListener("input", function () { st.h = parseInt(hEl.value, 10) || 0; calc(); });
      qEl.addEventListener("input", function () { st.q = Math.max(1, Math.min(999, parseInt(qEl.value, 10) || 1)); calc(); });
      el("data-qm").addEventListener("click", function () { st.q = Math.max(1, st.q - 1); qEl.value = st.q; calc(); });
      el("data-qp").addEventListener("click", function () { st.q = Math.min(999, st.q + 1); qEl.value = st.q; calc(); });
      var cp = el("data-copy"); cp.addEventListener("click", function () { copy(shareUrl(), cp); });

      function shareUrl() {
        var g = gById(st.gid), r = g.rows[st.ti];
        return win.location.origin + D.url + "?g=" + g.id + "&t=" + r.t + "&w=" + st.w + "&h=" + st.h + "&q=" + st.q;
      }
      function draw() {
        $$("[data-m]", matsEl).forEach(function (b) { b.setAttribute("aria-checked", b.dataset.m === st.mat ? "true" : "false"); });
        sortEl.innerHTML = ""; groupsOf(st.mat).forEach(function (g) { var o = doc.createElement("option"); o.value = g.id; o.textContent = label(g); if (g.id === st.gid) o.selected = true; sortEl.appendChild(o); });
        var g = gById(st.gid); thickEl.innerHTML = "";
        g.rows.forEach(function (r, k) {
          var b = doc.createElement("button"); b.type = "button"; b.className = "chip"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", k === st.ti ? "true" : "false");
          b.innerHTML = ft(r.t).replace(" mm", "") + "<small>" + (r.u === "kg" ? r.k + " kg/m²" : "mm") + "</small>"; if (r.u !== "kg") b.innerHTML = ft(r.t).replace(" mm", "") + "<small>mm</small>";
          b.addEventListener("click", function () { st.ti = k; draw(); }); thickEl.appendChild(b);
        });
        setNote(); wEl.value = st.w || ""; hEl.value = st.h || ""; qEl.value = st.q; calc();
      }
      function calc() {
        var g = gById(st.gid), r = g.rows[st.ti], w = st.w, h = st.h, q = st.q;
        $$("[aria-checked]", thickEl).forEach(function (b, k) { b.setAttribute("aria-checked", k === st.ti ? "true" : "false"); });
        if (!(w > 0 && h > 0)) { res.hidden = true; msg.hidden = false; msg.textContent = UI.empty; sheet.style.width = sheet.style.height = "6px"; setSum(null); return; }
        var area = w * h / 1e6, wt = null, net, cut;
        if (r.u === "kg") { wt = area * r.k; net = wt * r.pe; cut = wt * r.pi; } else { net = area * r.pe; cut = area * r.pi; }
        var wtT = wt === null ? null : wt * q, netT = net * q, cutT = cut * q;
        msg.hidden = true; res.hidden = false;
        var s = function (k) { return $("[" + k + "]", root); };
        s("data-net").textContent = chf(netT); s("data-cut").textContent = chf(cutT);
        s("data-net-s").textContent = q > 1 ? chf(net) + " pro Stück" : "pro Stück"; s("data-cut-s").textContent = q > 1 ? chf(cut) + " pro Stück" : "pro Stück";
        s("data-area").textContent = (area * q).toFixed(area * q < 1 ? 3 : 2) + " m²" + (q > 1 ? " (" + q + " Stück)" : "");
        s("data-wt").textContent = wtT === null ? UI.no_weight : kg(wtT);
        var ship = null, warns = [], shipTxt;
        if (wtT === null) shipTxt = "auf Anfrage";
        else if (wtT > 100) { shipTxt = "auf Anfrage"; warns.push(UI.heavy); }
        else {
          var tier = D.ship.table.filter(function (x) { return wtT <= x[0]; })[0]; ship = tier[1];
          var L = Math.max(w, h) / 1000; if (L > 2.2) ship += D.ship.bg; else if (L > 1.9) ship += D.ship.maxi;
          if (L > 1.75) warns.push(UI.long);
          shipTxt = "ca. " + chf(ship) + (tier[2] > 1 ? " (" + tier[2] + " Pakete)" : "");
        }
        s("data-ship").textContent = shipTxt;
        if (g.max) { var mn = Math.min(g.max[0], g.max[1]), mx = Math.max(g.max[0], g.max[1]); if (Math.min(w, h) > mn || Math.max(w, h) > mx) warns.push(UI.maxwarn); }
        var wEl2 = s("data-warn"); wEl2.hidden = !warns.length; wEl2.textContent = warns.join(" ");
        s("data-tot").textContent = ship === null ? chf(cutT) + " zzgl. Versand" : chf(cutT + ship);
        // sheet drawing
        var cs = win.getComputedStyle(vis), aw = vis.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = vis.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        var sc = Math.min(aw / w, ah / h), pw = Math.max(6, Math.round(w * sc)), ph = Math.max(6, Math.round(h * sc));
        sheet.style.width = pw + "px"; sheet.style.height = ph + "px";
        s("data-vw").textContent = w + " mm"; s("data-vh").textContent = h + " mm"; s("data-va").textContent = pw > 80 && ph > 24 ? (area).toFixed(area < 1 ? 3 : 2) + " m²" : "";
        // mail
        var sub = UI.subject + ": " + label(g) + " " + ft(r.t);
        var body = ["Guten Tag", "", "Wir haben Interesse an folgendem Blechprodukt:", "Sorte: " + label(g), "Blechdicke: " + ft(r.t), "Zuschnitt: " + w + " × " + h + " mm, " + q + " Stück",
          "Berechnung (indikativ, Stand " + D.date + "): Kauf netto " + chf(netT) + ", inkl. Verschnitt " + chf(cutT) + (wtT === null ? "" : ", Gewicht " + kg(wtT)), "Berechnung: " + shareUrl(), "", "Ihre Mitteilung hier:", "", "Freundliche Grüsse"].join("\r\n");
        s("data-cta").href = "mailto:" + D.to + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(body);
        setSum(chf(cutT));
        if (sync && win.history && win.history.replaceState) win.history.replaceState(null, "", shareUrl().replace(win.location.origin, ""));
      }
      function setNote() { var n = el("data-sortnote"); if (n) n.textContent = label(gById(st.gid)); }
      function setSum(v) { var sm = $("[data-sum]", root); if (!sm) return; sm.hidden = v === null; if (v !== null) $("[data-sumv]", sm).textContent = v; }
      draw();
      var ro = win.ResizeObserver ? new ResizeObserver(function () { calc(); }) : null; if (ro) ro.observe(vis);
    });
  });
})();
