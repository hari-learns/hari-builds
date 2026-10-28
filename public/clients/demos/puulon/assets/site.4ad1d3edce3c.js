(function () {
  "use strict";
  var d = document, de = d.documentElement;
  de.classList.add("js");
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- drawer ---------- */
  var burger = $("#burger"), drawer = $("#drawer"), closeBtn = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus(); else if (burger && !open) burger.focus({ preventScroll: true });
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(true); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setDrawer(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1060 && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- dock ---------- */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && store("dockx") === "1") dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; store("dockx", "1"); });

  /* ---------- reveal (with a sweep that never strands content) ---------- */
  var rv = $$(".rv");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) rv.forEach(show);

  /* ---------- counters (real figures; static when reduced motion) ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-count]").forEach(function (el) {
    var to = parseInt(el.getAttribute("data-count"), 10); if (!to || reduce || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; o.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function tick(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v; if (p < 1) requestAnimationFrame(tick); else el.textContent = to; })(t0);
      });
    }, { threshold: 0.6 });
    el.textContent = "0"; o.observe(el);
  });

  /* ---------- gallery ---------- */
  $$("[data-gal]").forEach(function (g) {
    var main = $("[data-gal-main]", g), btns = $$("button", g);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var im = $("img", b), mi = $("img", main);
        mi.src = b.getAttribute("data-src"); mi.srcset = b.getAttribute("data-srcset") || ""; mi.width = b.getAttribute("data-w"); mi.height = b.getAttribute("data-h"); mi.alt = im.alt;
        var mx = b.getAttribute("data-max"); mi.style.maxWidth = mx || ""; mi.style.marginInline = mx ? "auto" : "";
        main.classList.toggle("gal__main--plate", b.classList.contains("is-plate"));
        btns.forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); });
      });
    });
  });

  /* ---------- catalogue filter ---------- */
  $$("[data-filter]").forEach(function (f) {
    var items = $$("[data-fam]", d.getElementById(f.getAttribute("data-filter")));
    $$("button", f).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k");
        $$("button", f).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (it) { it.hidden = !(k === "all" || it.getAttribute("data-fam") === k); });
      });
    });
  });

  /* ---------- mailto forms ---------- */
  $$("form[data-mailto]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var to = f.getAttribute("data-mailto"), sub = f.getAttribute("data-subject") || "";
      var lines = [];
      $$("[data-line]", f).forEach(function (i) { if (i.value) lines.push(i.getAttribute("data-line") + ": " + i.value); });
      var msg = $("[name=msg]", f); if (msg && msg.value) lines.push("", msg.value);
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });

  /* ---------- the signature tool: sopiiko tilaan? ---------- */
  var dataEl = d.getElementById("fit-data");
  if (dataEl) {
    var D = JSON.parse(dataEl.textContent), L = D.ui, nf = new Intl.NumberFormat(D.lang === "fi" ? "fi-FI" : "en-GB", { maximumFractionDigits: 1 });
    var ICON = { ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
                 no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
                 ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01"/></svg>' };
    var fmt = function (n) { return nf.format(n); };
    $$("[data-fit]").forEach(function (root) {
      var q = function (s) { return $(s, root); };
      var tabs = $$("[data-tab]", root), panes = $$("[data-pane]", root);
      tabs.forEach(function (t) { t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
        panes.forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== t.getAttribute("data-tab"); });
      }); });
      var width = 90;
      var chips = $$("[data-w]", root);
      chips.forEach(function (c) { c.addEventListener("click", function () { width = +c.getAttribute("data-w"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); bed(); }); });
      function num(el) { var v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v > 0 ? v : null; }
      function line(ok, text) { return "<li>" + ICON[ok ? "ok" : "no"].replace("<svg", '<svg width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + text + "</li>"; }
      var fits = [];
      function bed() {
        var ceil = num(q("[name=ceil]")), wall = num(q("[name=wall]")), floor = num(q("[name=floor]"));
        var out = [], list = [];
        D.beds.forEach(function (b) {
          var r = { b: b, state: "fit", lines: [] };
          if (b.widths.indexOf(width) < 0) { r.state = "nowidth"; out.push(r); return; }
          var cw = b.cab_w[width], ch = b.cab_h[width], op = b.open ? b.open[width] : null, ask = false;
          if (wall !== null) { var okw = wall >= cw; r.lines.push(line(okw, L.need_wall + " <b>" + fmt(cw) + " cm</b>, " + L.have + " " + fmt(wall) + " cm")); if (!okw) r.state = "no"; }
          if (b.kind === "v") { if (ceil !== null) { var okc = ceil >= b.ceil; r.lines.push(line(okc, L.need_ceil + " <b>" + fmt(b.ceil) + " cm</b>, " + L.have + " " + fmt(ceil) + " cm")); if (!okc) r.state = "no"; } }
          else if (ceil !== null && ceil < ch) { r.lines.push(line(false, L.t_cabh + " <b>" + fmt(ch) + " cm</b>, " + L.have + " " + fmt(ceil) + " cm")); r.state = "no"; }
          if (op === null) ask = true;
          else if (floor !== null) { var okf = floor >= op; r.lines.push(line(okf, L.need_floor + " <b>" + fmt(op) + " cm</b>, " + L.have + " " + fmt(floor) + " cm")); if (!okf) r.state = "no"; }
          if (r.state === "fit" && ask) { r.state = "ask"; r.lines.push("<li>" + ICON.ask.replace("<svg", '<svg width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + L.lauri_ask + "</li>"); }
          out.push(r);
        });
        var rank = { fit: 0, ask: 1, no: 2, nowidth: 3 }; out.sort(function (a, b) { return rank[a.state] - rank[b.state]; });
        fits = out.filter(function (r) { return r.state === "fit" || r.state === "ask"; });
        var html = "";
        out.forEach(function (r) {
          var b = r.b, cls = r.state === "fit" ? "res--fit" : "", badge = { fit: ["badge--fit", L.fits, "ok"], ask: ["badge--ask", L.ask, "ask"], no: ["badge--no", L.nofit, "no"], nowidth: ["badge--no", L.no_width, "no"] }[r.state];
          html += '<article class="res ' + cls + '"><div class="res__pic"><img src="' + b.img + '" width="64" height="84" alt="" loading="lazy"></div>' +
            "<h3>" + b.name + ' <span class="badge ' + badge[0] + '">' + ICON[badge[2]].replace("<svg", '<svg width="16" height="16"') + badge[1] + "</span></h3>" +
            "<ul>" + r.lines.join("") + "<li>" + (b.kind === "v" ? L.vertical : L.horizontal) + ". " + (b.id === "lauri" ? L.mattress_in : L.mattress_out) + ".</li></ul>" +
            '<p class="res__act"><a href="' + b.url + '">' + L.details + " " + b.name + "</a></p></article>";
        });
        if (!fits.length) html += '<p class="fit__note">' + L.none_fit + "</p>";
        var nfit = out.filter(function (r) { return r.state === "fit"; }).length, nask = out.filter(function (r) { return r.state === "ask"; }).length;
        q("[data-bed-sum]").textContent = L.res_h + ": " + nfit + " " + L.sum_fit + (nask ? ", " + nask + " " + L.sum_ask : "");
        q("[data-bed-res]").innerHTML = html;
        plan(wall, floor);
        var qa = q("[data-bed-quote]");
        if (qa) {
          var names = fits.map(function (r) { return r.b.name; }).join(", ");
          var body = L.q_hello + "\n\n" + L.q_body_bed + "\n" + L.q_models + ": " + (names || "-") + "\n" + L.q_width + ": " + width + " x 200 cm\n" +
            L.q_wall + ": " + (wall || "-") + " cm\n" + L.q_ceil + ": " + (ceil || "-") + " cm\n" + L.q_floor + ": " + (floor || "-") + " cm\n\n" + L.q_ask + "\n\n" + L.q_thanks;
          qa.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(L.subject + " " + width + " cm") + "&body=" + encodeURIComponent(body);
          qa.setAttribute("aria-disabled", fits.length ? "false" : "true");
        }
      }
      function plan(wall, floor) {
        var svg = q("[data-plan]"); if (!svg) return;
        var W = wall || 300, Dp = floor || 250, maxw = W, maxd = Dp, shapes = "";
        D.beds.forEach(function (b) { if (b.widths.indexOf(width) < 0) return; maxw = Math.max(maxw, b.cab_w[width]); if (b.open) maxd = Math.max(maxd, b.open[width]); });
        var pad = 20, vw = maxw + pad * 2, vh = maxd + pad * 2 + 6;
        shapes += '<rect x="' + pad + '" y="' + (pad + 6) + '" width="' + W + '" height="' + Dp + '" fill="var(--plan-free)" stroke="var(--lime)" stroke-width="1.5" stroke-dasharray="6 5"/>';
        D.beds.forEach(function (b) {
          if (b.widths.indexOf(width) < 0) return;
          var cw = b.cab_w[width], op = b.open ? b.open[width] : null, col = "var(--plan-" + b.id + ")", x = pad;
          if (op) shapes += '<rect x="' + x + '" y="' + (pad + 6) + '" width="' + cw + '" height="' + op + '" fill="none" stroke="' + col + '" stroke-width="2.5"/>';
          shapes += '<rect x="' + x + '" y="' + (pad + 6) + '" width="' + cw + '" height="' + (b.depth || 44) + '" fill="' + col + '" fill-opacity=".55"/>';
        });
        shapes += '<rect x="0" y="' + (pad) + '" width="' + vw + '" height="6" fill="var(--on-deep)"/>';
        svg.setAttribute("viewBox", "0 0 " + vw + " " + vh); svg.innerHTML = shapes;
      }
      $$("input", q("[data-pane=bed]") || root).forEach(function (i) { i.addEventListener("input", bed); });
      if (q("[data-pane=bed]")) bed();

      /* dining tables */
      function tbl() {
        var rw = num(q("[name=rw]")), rl = num(q("[name=rl]")), gap = parseFloat(q("[name=gap]").value); gap = isFinite(gap) && gap >= 0 ? gap : 0;
        var shape = (q("[data-shape][aria-pressed=true]") || {}).getAttribute ? q("[data-shape][aria-pressed=true]").getAttribute("data-shape") : "any";
        var box = q("[data-table-res]"), html = "";
        if (!rw || !rl) { box.innerHTML = ""; return; }
        var mw = rw - 2 * gap, ml = rl - 2 * gap, big = Math.max(mw, ml), small = Math.min(mw, ml), rows = [];
        D.tables.forEach(function (t) {
          if (shape === "r" && t.shape !== "r") return; if (shape === "o" && t.shape !== "o" && !(t.shape === "r" && t.l === t.w)) return;
          var ok = t.shape === "o" ? Math.max(t.l, t.w) <= small : (t.l <= big && t.w <= small);
          if (ok) rows.push(t);
        });
        rows.sort(function (a, b) { return b.l * b.w - a.l * a.w; });
        html += '<p class="fit__note" style="margin:0 0 6px">' + L.t_max + " <b>" + fmt(Math.max(big, 0)) + " × " + fmt(Math.max(small, 0)) + " " + L.t_cm + "</b>.</p>";
        rows.forEach(function (t) {
          var size = t.shape === "o" ? "Ø " + t.l + " " + L.t_cm : t.l + " × " + t.w + " " + L.t_cm;
          var body = L.q_hello + "\n\n" + t.name + " (" + size + ")\n" + L.t_room_w + ": " + rw + "\n" + L.t_room_l + ": " + rl + "\n\n" + L.q_ask + "\n\n" + L.q_thanks;
          html += '<div class="trow"><b>' + t.name + " " + size + "</b><a href=\"mailto:" + D.mail + "?subject=" + encodeURIComponent(L.t_subject + ": " + t.name + " " + size) + "&body=" + encodeURIComponent(body) + '">' + L.t_quote + "</a>" +
            '<span>' + t.seat + ' · <a href="' + t.url + '" style="display:inline;min-height:0">' + L.details + "</a></span></div>";
        });
        if (!rows.length) html += '<p class="fit__note">' + L.t_nofit + "</p>"; else html += '<p class="fit__note">' + L.t_other + "</p>";
        box.innerHTML = html;
      }
      var sh = $$("[data-shape]", root);
      sh.forEach(function (c) { c.addEventListener("click", function () { sh.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); tbl(); }); });
      $$("[data-pane=table] input", root).forEach(function (i) { i.addEventListener("input", tbl); });
      if (q("[data-pane=table]")) tbl();
    });
  }
})();
