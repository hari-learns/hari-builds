(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("alm-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("alm-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* lightbox for gallery photos */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") {
    var lbIn = $(".lb__in", lb);
    $$("[data-lb]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var im = $("img", a);
        lbIn.innerHTML = '<img src="' + esc(a.getAttribute("href")) + '" alt="' + esc(im ? im.alt : "") + '">';
        lb.showModal();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__in") || e.target.hasAttribute("data-lbx")) lb.close(); });
    lb.addEventListener("close", function () { lbIn.innerHTML = ""; });
  }

  /* video facade -> dialog */
  var vlink = $("[data-video]");
  if (vlink) {
    var vdlg = d.createElement("dialog"); vdlg.id = "vdlg"; vdlg.setAttribute("aria-label", "Almanar video");
    vdlg.innerHTML = '<div class="dlg__x"><button type="button" data-vclose>Close</button></div>';
    d.body.appendChild(vdlg);
    if (typeof vdlg.showModal === "function") {
      var vframe = null;
      vlink.addEventListener("click", function (e) {
        e.preventDefault();
        vframe = d.createElement("iframe");
        vframe.src = "https://www.youtube-nocookie.com/embed/" + vlink.getAttribute("data-video") + "?autoplay=1&rel=0";
        vframe.title = "Almanar video"; vframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; vframe.setAttribute("allowfullscreen", "");
        vdlg.appendChild(vframe); vdlg.showModal();
      });
      vdlg.addEventListener("close", function () { if (vframe) { vframe.remove(); vframe = null; } });
      vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
      $("[data-vclose]", vdlg).addEventListener("click", function () { vdlg.close(); });
    }
  }

  /* chips helper */
  function chipGroups(scope, onChange) {
    var state = {};
    $$(".fchip", scope).forEach(function (b) {
      var k = b.getAttribute("data-k");
      if (b.getAttribute("aria-pressed") === "true") state[k] = b.getAttribute("data-v");
      b.addEventListener("click", function () {
        $$('.fchip[data-k="' + k + '"]', scope).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        state[k] = b.getAttribute("data-v"); onChange(state);
      });
    });
    return state;
  }

  /* project filters */
  var pf = $("[data-pfilter]");
  if (pf) {
    var tiles = $$("[data-pgrid] .tile"), cnt = $("[data-count]"), emp = $("[data-empty]"), qEl = $("#q");
    var pst = chipGroups(pf, function () { apply(); });
    function apply() {
      var q = (qEl && qEl.value || "").trim().toLowerCase(), n = 0;
      tiles.forEach(function (t) {
        var ok = (!pst.country || t.dataset.country === pst.country) && (!pst.cat || t.dataset.cat === pst.cat) && (!pst.status || t.dataset.status === pst.status) &&
          (!pst.fam || t.dataset.fam.indexOf("|" + pst.fam + "|") > -1) && (!q || t.dataset.q.indexOf(q) > -1);
        t.hidden = !ok; if (ok) { n++; t.classList.add("is-in"); }
      });
      if (cnt) cnt.textContent = n + (n === 1 ? " project" : " projects");
      if (emp) emp.hidden = n > 0;
    }
    if (qEl) qEl.addEventListener("input", apply);
  }

  /* systems table filters */
  var tf = $("[data-tfilter]"), tt = $("[data-ttable]");
  if (tf && tt) {
    var rows = $$("tbody tr", tt);
    var tst = chipGroups(tf, function () {
      rows.forEach(function (r) { r.hidden = !((!tst.fam || r.dataset.fam === tst.fam) && (!tst.open || r.dataset.open === tst.open)); });
    });
  }

  /* contact form -> drafted email */
  var rfq = $("#rfq");
  if (rfq) {
    var cfg = JSON.parse($("#rfq-data").textContent);
    function msg() {
      var L = cfg.labels, v = function (id) { var el = $("#" + id); return el ? el.value.trim() : ""; };
      return [L.name + ": " + v("name"), L.company + ": " + v("company"), L.email + ": " + v("email"), L.phone + ": " + v("phone"), "", v("msg")].join("\n");
    }
    rfq.addEventListener("submit", function (e) { e.preventDefault(); location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject) + "&body=" + encodeURIComponent(msg()); });
    var cp = $("#rfq-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = cp.textContent, done = cp.getAttribute("data-done");
      var ok = function () { cp.textContent = done; setTimeout(function () { cp.textContent = t; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(msg()).then(ok, ok); else ok();
    });
  }

  /* ------------------------------------------------ the finder: which system fits my opening? */
  $$("[data-finder]").forEach(function (fEl) {
    var D = JSON.parse($("#finder-data", fEl).textContent), S = D.systems, BASE = D.base, UI = D.ui;
    var resEl = $("[data-res]", fEl), sumEl = $("[data-sum]", fEl), ctaEl = $("[data-cta]", fEl), ventsWrap = $("[data-vents]", fEl);
    var st = { open: "sliding", w: 1800, h: 2200, glass: "double24", th: "0", ug: "0", rc: "0", vents: false };
    var q = new URLSearchParams(location.search).get("open");
    if (q && D.open[q] && q !== "screen") { st.open = q; var r0 = $('input[name="open"][value="' + q + '"]', fEl); if (r0) r0.checked = true; }
    function preset() { for (var i = 0; i < D.presets.length; i++) if (D.presets[i][0] === st.glass) return D.presets[i]; return D.presets[0]; }
    function unitName(u) { return { single: "Single", double: "Double", triple: "Triple" }[u]; }
    function fmt(n) { return String(Math.round(n * 100) / 100).replace(/\.0+$/, ""); }

    function evaluate(s) {
      var P = preset(), w = st.w / 1000, h = st.h / 1000, kg = w * h * P[3] * 2.5, total = P[4], ch = [], bars = {};
      var weighs = st.open !== "curtain" || st.vents;
      if (weighs) {
        if (s.kg) { var okw = kg <= s.kg; ch.push([okw ? "ok" : "no", okw ? "Sash about " + Math.round(kg) + " kg, limit " + fmt(s.kg) + " kg" : "Sash about " + Math.round(kg) + " kg is over the " + fmt(s.kg) + " kg limit", "m"]); bars.w = [kg, s.kg]; }
        else ch.push(["q", "Sash weight limit not published"]);
      }
      if (s.g) { var okg = total <= s.g; ch.push([okg ? "ok" : "no", okg ? "Takes a " + total + " mm unit (max " + fmt(s.g) + " mm)" : "A " + total + " mm unit is over the " + fmt(s.g) + " mm maximum", "m"]); bars.g = [total, s.g]; }
      else ch.push(["q", "Maximum glazing not published"]);
      if (s.mw || s.mh) {
        var okm = (!s.mw || st.w <= s.mw) && (!s.mh || st.h <= s.mh);
        ch.push([okm ? "ok" : "no", okm ? "Panel size within " + (s.mw ? "max width " + s.mw + " mm" : "") + (s.mw && s.mh ? " and " : "") + (s.mh ? "max height " + s.mh + " mm" : "") : "Panel " + st.w + " x " + st.h + " mm is over the limit (max " + (s.mw || "-") + " x " + (s.mh || "-") + " mm)", "m"]);
      }
      if (s.un && s.un.length) {
        var oku = s.un.indexOf(P[2]) > -1;
        ch.push([oku ? "ok" : "no", oku ? unitName(P[2]) + " glazing listed" : unitName(P[2]) + " glazing not listed (" + s.un.join(", ") + ")"]);
      }
      if (st.th === "1") {
        if (s.t === true) ch.push(["ok", "Thermal break"]); else if (s.t === false) ch.push(["no", "Non-insulated system"]); else ch.push(["q", "Thermal break not stated"]);
      }
      var tu = parseFloat(st.ug);
      if (tu > 0) {
        if (s.u0 != null) { var oku2 = s.u0 <= tu; ch.push([oku2 ? "ok" : "no", oku2 ? "Uf from " + fmt(s.u0) + " (target " + fmt(tu) + " or lower)" : "Best published Uf " + fmt(s.u0) + " is above " + fmt(tu), "m"]); bars.u = [s.u0, tu]; }
        else ch.push(["q", "Uf not published"]);
      }
      var rc = parseInt(st.rc, 10);
      if (rc > 0) {
        if (s.rc != null) { var okr = s.rc >= rc; ch.push([okr ? "ok" : "no", okr ? "Burglar class RC" + s.rc : "Burglar class RC" + s.rc + " is below RC" + rc]); }
        else ch.push(["q", "Burglar class not published"]);
      }
      var status = "ok"; ch.forEach(function (c) { if (c[0] === "no") status = "no"; else if (c[0] === "q" && status !== "no") status = "chk"; });
      return { s: s, ch: ch, status: status, bars: bars, kg: kg };
    }

    function meter(label, val, lim, bad, na) {
      var pct = na ? 0 : Math.min(100, Math.max(0, val / lim * 100));
      return '<div class="mt' + (bad ? " mt--bad" : "") + (na ? " mt--na" : "") + '"><div class="mt__h"><span>' + label + '</span><b>' + (na ? "not published" : val + " of " + lim) + '</b></div><div class="mt__bar"><i style="width:' + pct.toFixed(0) + '%"></i></div></div>';
    }
    function card(r) {
      var s = r.s, pill = { ok: ["pill--ok", UI.fit], chk: ["pill--chk", UI.check], no: ["pill--no", UI.nofit] }[r.status];
      var m = "";
      if (st.open !== "curtain" || st.vents) m += r.bars.w ? meter("Sash weight, kg", Math.round(r.bars.w[0]), fmt(r.bars.w[1]), r.bars.w[0] > r.bars.w[1]) : meter("Sash weight, kg", 0, 1, false, true);
      m += r.bars.g ? meter("Glazing, mm", r.bars.g[0], fmt(r.bars.g[1]), r.bars.g[0] > r.bars.g[1]) : meter("Glazing, mm", 0, 1, false, true);
      if (r.bars.u) m += meter("Uf, W/m²K", fmt(r.bars.u[0]), fmt(r.bars.u[1]), r.bars.u[0] > r.bars.u[1]);
      else if (s.u0 != null) m += '<div class="mt"><div class="mt__h"><span>Uf, W/m²K</span><b>' + fmt(s.u0) + (s.u1 && s.u1 !== s.u0 ? " to " + fmt(s.u1) : "") + '</b></div></div>';
      var why = r.ch.filter(function (c) { return !(c[0] === "ok" && c[2] === "m" && r.status !== "no"); }).map(function (c) { return '<span class="' + (c[0] === "no" ? "x" : c[0] === "q" ? "q" : "") + '">' + esc(c[1]) + '</span>'; }).join("");
      var refs = s.np ? '<div class="refs"><span>' + UI.built + " " + s.np + " reference project" + (s.np > 1 ? "s" : "") + '</span><div class="rc__links">' + s.p.map(function (p) { return '<a href="' + BASE + "/" + p[1] + '">' + esc(p[0]) + "</a>"; }).join("") + "</div></div>" : '<p class="refs">' + UI.no_ref + "</p>";
      return '<article class="rc' + (r.status === "no" ? " rc--no" : "") + '"><div class="rc__top"><div><a class="rc__name" href="' + BASE + "/" + s.url + '">' + esc(s.n) + '</a><span class="rc__fam">' + esc(s.f) + " · " + esc(D.open[s.o]) + '</span></div><span class="pill ' + pill[0] + '">' + pill[1] + '</span></div>' +
        (r.status === "no" ? "" : '<div class="meters">' + m + "</div>") + '<div class="why">' + why + "</div>" + (r.status === "no" ? "" : refs) + "</article>";
    }
    function sortFn(a, b) { return (b.s.np - a.s.np) || a.s.n.localeCompare(b.s.n); }

    var prevEl = $("[data-prev]", fEl), NS = "http://www.w3.org/2000/svg";
    function drawPrev(weight, showW) {
      if (!prevEl) return;
      var VW = 340, VH = 205, mx = 250, my = 118, k = Math.min(mx / st.w, my / st.h), w = st.w * k, h = st.h * k, x = (VW - w) / 2 + 8, y = (VH - h) / 2 + 6;
      var s = '<svg viewBox="0 0 ' + VW + " " + VH + '" role="img" aria-label="Opening ' + st.w + " by " + st.h + ' mm">' +
        '<rect class="p-env" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"/>' +
        '<path class="p-l" d="M' + x.toFixed(1) + " " + (y - 14).toFixed(1) + "H" + (x + w).toFixed(1) + "M" + x.toFixed(1) + " " + (y - 20).toFixed(1) + "v12M" + (x + w).toFixed(1) + " " + (y - 20).toFixed(1) + 'v12"/>' +
        '<path class="p-l" d="M' + (x - 14).toFixed(1) + " " + y.toFixed(1) + "V" + (y + h).toFixed(1) + "M" + (x - 20).toFixed(1) + " " + y.toFixed(1) + "h12M" + (x - 20).toFixed(1) + " " + (y + h).toFixed(1) + 'h12"/>' +
        '<text class="p-t" x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 24).toFixed(1) + '" text-anchor="middle">' + st.w + '</text>' +
        '<text class="p-t" x="' + (x - 26).toFixed(1) + '" y="' + (y + h / 2).toFixed(1) + '" text-anchor="middle" transform="rotate(-90 ' + (x - 26).toFixed(1) + " " + (y + h / 2).toFixed(1) + ')">' + st.h + '</text>' +
        (showW ? '<text class="p-w" x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h + 24).toFixed(1) + '" text-anchor="middle">glass about ' + weight + " kg</text>" : "") + "</svg>";
      prevEl.innerHTML = s;
    }

    function render() {
      var P = preset();
      var list = S.filter(function (s) { return s.o === st.open; }).map(evaluate);
      var G = { ok: [], chk: [], no: [] }; list.forEach(function (r) { G[r.status].push(r); });
      ["ok", "chk", "no"].forEach(function (k) { G[k].sort(sortFn); });
      var weight = Math.round(st.w / 1000 * st.h / 1000 * P[3] * 2.5);
      var showW = st.open !== "curtain" || st.vents;
      var tot = { ok: G.ok.length, chk: G.chk.length, no: G.no.length };
      sumEl.innerHTML = "<b>" + G.ok.length + "</b> fit · <b>" + G.chk.length + "</b> to confirm";
      drawPrev(weight, showW);
      var wt = $("[data-wt]", fEl); if (wt) wt.innerHTML = (showW ? "Estimated sash weight: <b>" + weight + " kg</b>" : "Fixed glass: no sash weight limit applies.") + (st.open === "folding" ? "<br>Folding doors: enter the width of a single panel." : "");
      var html = "";
      function group(k, title, open) {
        if (!G[k].length) return "";
        var hint = k === "chk" ? '<p class="note" style="margin:-4px 0 12px">' + esc(UI.check_why) + "</p>" : "";
        var inner = '<div class="res">' + G[k].map(card).join("") + "</div>";
        if (k === "no") return '<details class="grp-d"' + (open ? " open" : "") + '><summary class="grp"><h3>' + title + '</h3><span class="n">' + G[k].length + " systems, tap to see why</span></summary>" + inner + "</details>";
        return '<div class="grp"><h3>' + title + '</h3><span class="n">' + G[k].length + " system" + (G[k].length > 1 ? "s" : "") + "</span></div>" + hint + inner;
      }
      var LIM = parseInt(fEl.getAttribute("data-limit") || "0", 10), more = 0;
      if (LIM) { ["ok", "chk"].forEach(function (k) { if (G[k].length > LIM) { more += G[k].length - LIM; G[k] = G[k].slice(0, LIM); } }); G.no = []; }
      html += group("ok", UI.fit, true) + group("chk", UI.check, true) + group("no", UI.nofit, false);
      if (LIM) html += '<p style="margin-top:18px"><a class="tlink" href="' + fEl.getAttribute("data-page") + "?open=" + st.open + '">' + (more ? "See all results and why the others do not fit" : "Open the finder on its own page") + "</a></p>";
      if (!G.ok.length && !G.chk.length) html = '<p class="empty">No ' + esc(D.open[st.open].toLowerCase()) + ' system matches every limit. Loosen one requirement, or ask Almanar: they fabricate custom solutions.</p>' + html;
      resEl.innerHTML = html;
      // enquiry carrying the numbers
      var lines = ["Hello Almanar,", "", "I used the system finder on your website and would like a quote for this opening:", "",
        "Opening: " + D.open[st.open], "Size (width x height): " + st.w + " x " + st.h + " mm", "Glass: " + P[1]];
      if (showW) lines.push("Estimated sash weight: about " + weight + " kg");
      if (st.th === "1") lines.push("Thermal break: required");
      if (parseFloat(st.ug) > 0) lines.push("Target Uf: " + st.ug + " W/m2K or lower");
      if (parseInt(st.rc, 10) > 0) lines.push("Burglar resistance: RC" + st.rc + " or higher");
      lines.push("", "Systems that fit: " + (G.ok.slice(0, 6).map(function (r) { return r.s.n; }).join(", ") || "none listed"));
      if (G.chk.length) lines.push("To confirm: " + G.chk.slice(0, 6).map(function (r) { return r.s.n; }).join(", "));
      lines.push("", "Project:", "Location:", "Name / company / phone:", "", "Thank you");
      var body = lines.join("\n");
      ctaEl.setAttribute("href", "mailto:" + D.to + "?subject=" + encodeURIComponent(UI.mail_subject) + "&body=" + encodeURIComponent(body));
      if (ventsWrap) ventsWrap.hidden = st.open !== "curtain";
      var jb = $("[data-jump]", fEl); if (jb) jb.textContent = "Show the matches (" + tot.ok + " fit, " + tot.chk + " to confirm)";
    }

    $$('input[name="open"]', fEl).forEach(function (i) { i.addEventListener("change", function () { st.open = i.value; render(); }); });
    $$('input[name="th"]', fEl).forEach(function (i) { i.addEventListener("change", function () { st.th = i.value; render(); }); });
    $$('input[name="rc"]', fEl).forEach(function (i) { i.addEventListener("change", function () { st.rc = i.value; render(); }); });
    $("#glass", fEl).addEventListener("change", function (e) { st.glass = e.target.value; render(); });
    $("#ug", fEl).addEventListener("change", function (e) { st.ug = e.target.value; render(); });
    var vt = $("#vents", fEl); if (vt) vt.addEventListener("change", function () { st.vents = vt.checked; render(); });
    ["w", "h"].forEach(function (k) {
      var num = $("#n-" + k, fEl), rng = $('[data-r="' + k + '"]', fEl);
      function set(v, from) { v = Math.max(+num.min, Math.min(+num.max, Math.round(v / 10) * 10 || +num.min)); st[k] = v; if (from !== "num") num.value = v; if (from !== "rng") rng.value = v; render(); }
      rng.addEventListener("input", function () { set(+rng.value, "rng"); num.value = st[k]; });
      num.addEventListener("input", function () { var v = +num.value; if (v >= +num.min && v <= +num.max) { st[k] = v; rng.value = v; render(); } });
      num.addEventListener("change", function () { set(+num.value); });
    });
    render();
  });
})();
