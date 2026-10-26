(function () {
  "use strict";
  var d = document, w = window;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("ink-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("ink-dock", "1"); }); });

  /* drawer */
  var burger = $("#burger"), drawer = $("#drawer"), dx = $("#drawer-x"), root = d.documentElement;
  function setMenu(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); root.classList.toggle("menu-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && dx) setTimeout(function () { dx.focus(); }, 50); else if (burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(true); });
  if (dx) dx.addEventListener("click", function () { setMenu(false); });
  if (drawer) drawer.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) setMenu(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setMenu(false); });
  w.addEventListener("resize", function () { if (w.innerWidth >= 1140) setMenu(false); });

  /* reveals */
  var rv = $$(".rv");
  rv.forEach(function (el) { var sib = $$(".rv", el.parentElement).indexOf(el); el.style.setProperty("--d", Math.min(sib, 6) * 0.07 + "s"); });
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in w)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = w.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); }); sweep();
  }

  /* process line follows scroll */
  var steps = $("[data-steps]");
  if (steps) {
    if (reduce) steps.style.setProperty("--p", 1);
    else {
      var tick = false, upd = function () {
        tick = false; var r = steps.getBoundingClientRect(), vh = w.innerHeight, p = (vh * 0.6 - r.top) / r.height;
        steps.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
      };
      w.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
    }
  }

  /* counters */
  function fmt(n, lang) { return n.toLocaleString(lang === "nl" ? "nl-BE" : "en-GB", { maximumFractionDigits: 0 }); }
  $$("[data-count]").forEach(function (el) {
    var n = +el.getAttribute("data-count"), pre = el.getAttribute("data-pre") || "", unit = el.getAttribute("data-unit") || "", lang = el.getAttribute("data-lang");
    if (reduce || !("IntersectionObserver" in w)) return;
    var done = false, run = function () {
      if (done) return; done = true; var t0 = null;
      (function step(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 1400), v = Math.round(n * (1 - Math.pow(1 - k, 3)));
        el.textContent = pre + fmt(v, lang) + unit; if (k < 1) requestAnimationFrame(step); else el.textContent = pre + fmt(n, lang) + unit; })(performance.now());
    };
    var o2 = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { run(); o2.disconnect(); } }); }, { threshold: 0.4 });
    el.textContent = pre + "0" + unit; o2.observe(el);
    setTimeout(function () { if (!done) { /* safety: never leave a zero */ var r = el.getBoundingClientRect(); if (r.top < w.innerHeight) run(); } }, 2500);
  });

  /* video facade: YouTube loads only on click */
  $$(".video").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-yt"), f = d.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = b.getAttribute("aria-label") || "video";
      b.innerHTML = ""; b.appendChild(f); b.removeAttribute("aria-label");
    }, { once: true });
  });

  /* contact form -> prefilled mail */
  $$("[data-mailform]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (f.reportValidity && !f.reportValidity()) return;
      var lines = []; $$("input,textarea", f).forEach(function (i) { if (i.value) lines.push(i.name + ": " + i.value); });
      w.location.href = "mailto:" + f.getAttribute("data-to") + "?subject=" + encodeURIComponent(f.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });

  /* TOOL: does my part fit the flatbed laser */
  $$("[data-tool]").forEach(function (tool) {
    var holder = tool.parentElement, raw = $("[data-tool-data]", holder); if (!raw) return;
    var D = JSON.parse(raw.textContent), S = D.S, L = D.L, lang = D.lang, SW = L.sheet[0], SH = L.sheet[1], G = L.gap;
    var form = $("form", tool), verdict = $("[data-verdict]", tool), parts = $("[data-parts]", tool), stats = $("[data-stats]", tool), route = $("[data-route]", tool), act = $("[data-act]", tool);
    var loc = lang === "nl" ? "nl-BE" : "en-GB";
    function num(v, dec) { return v.toLocaleString(loc, { maximumFractionDigits: dec === undefined ? 1 : dec }); }
    function rn(v) { return String(Math.round(v * 100) / 100).replace(".", lang === "nl" ? "," : "."); }
    function f(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
    function val(n) { return parseFloat(String(form.elements[n].value).replace(",", ".")); }
    function nest(a, b) { var nx = Math.floor((SW + G) / (a + G)), ny = Math.floor((SH + G) / (b + G)); return a > SW || b > SH ? { n: 0 } : { n: nx * ny, nx: nx, ny: ny, a: a, b: b }; }
    function setVerdict(cls, h, p) { verdict.className = "verdict" + (cls ? " " + cls : ""); verdict.innerHTML = "<strong></strong><p></p>"; verdict.firstChild.textContent = h; verdict.lastChild.textContent = p; }
    function actions(o, ok, per, sheets) {
      var ops = o.ops.length ? o.ops.map(function (k) { return S.ops_list[k]; }).join(", ") : S.no_ops;
      var body = f(S.mail_body, { mat: S.mats[o.mat], t: rn(o.t), l: rn(o.l), w: rn(o.w), q: rn(o.q), ops: ops, per: per, sheets: sheets });
      if (!ok) body = body.replace(/\n\n(Berekend|Calculated)[^\n]*/, "");
      var subj = f(S.mail_subject, { mat: S.mats[o.mat], t: rn(o.t), l: rn(o.l), w: rn(o.w), q: rn(o.q) });
      act.innerHTML = "";
      var a1 = d.createElement("a"); a1.className = "btn btn-primary"; a1.href = "mailto:" + D.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      a1.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3zM3 6l9 7 9-7"/></svg><span></span>'; a1.lastChild.textContent = S.send;
      var a2 = d.createElement("a"); a2.className = "btn btn-ghost-d"; a2.href = "tel:" + D.tel; a2.innerHTML = "<span></span>"; a2.firstChild.textContent = S.call;
      act.appendChild(a1); act.appendChild(a2);
    }
    function clearOut() { parts.innerHTML = ""; stats.innerHTML = ""; route.innerHTML = ""; }
    function draw(n, qty) {
      var cnt = Math.min(qty, n.n), html = "";
      if (cnt > 1500) {
        var cols = Math.min(n.nx, Math.ceil(cnt / n.ny)), rows = n.ny, pw = n.a + G, ph = n.b + G;
        html = '<defs><pattern id="pp" width="' + pw + '" height="' + ph + '" patternUnits="userSpaceOnUse"><rect width="' + n.a + '" height="' + n.b + '"/></pattern></defs><rect class="parts parts-fill" fill="var(--part-fill)" x="0" y="0" width="' + (cols * pw - G) + '" height="' + (rows * ph - G) + '" style="fill:url(#pp)"/>';
      } else {
        var dpath = "", i = 0;
        for (var y = 0; y < n.ny && i < cnt; y++) for (var x = 0; x < n.nx && i < cnt; x++, i++) dpath += "M" + x * (n.a + G) + " " + y * (n.b + G) + "h" + n.a + "v" + n.b + "h-" + n.a + "z";
        html = '<path class="parts" d="' + dpath + '"/>';
      }
      parts.innerHTML = html;
    }
    function compute() {
      var o = { mat: form.elements.mat.value, t: val("t"), l: val("l"), w: val("w"), q: Math.max(1, Math.round(val("q"))), ops: $$('input[name="op"]:checked', form).map(function (i) { return i.value; }) };
      clearOut();
      if (!(o.t > 0 && o.l > 0 && o.w > 0 && o.q > 0)) { setVerdict("", S.empty_h, S.empty_p); act.innerHTML = ""; return; }
      var mx = L.mat[o.mat].max, mname = S.mats[o.mat];
      if (o.t > mx) { setVerdict("is-bad", S.thick_h, f(S.thick_p, { mat: mname, max: mx })); actions(o, false); return; }
      var A = nest(o.l, o.w), B = nest(o.w, o.l), best = A.n >= B.n ? A : B;
      if (best.n < 1) { setVerdict("is-bad", S.size_h, S.size_p); actions(o, false); return; }
      setVerdict("", S.ok_h, f(S.ok_p, { mat: mname, t: num(o.t), max: mx }));
      draw(best, o.q);
      var sheets = Math.ceil(o.q / best.n), use = Math.min(100, Math.round(Math.min(o.q, best.n) * o.l * o.w / (SW * SH) * 100));
      var rho = L.mat[o.mat].rho, wp = o.l * o.w * o.t / 1e6 * rho, ws = SW * SH * o.t / 1e6 * rho;
      var rows = [[S.s_per, num(best.n, 0) + " " + (best.n === 1 ? S.pcs1 : S.pcs)], [S.s_sheets, num(sheets, 0)], [S.s_use, use + " %"], [S.s_w, "± " + num(wp, wp < 0.1 ? 3 : wp < 10 ? 2 : 1) + " " + S.kg], [S.s_ws, "± " + num(ws, 0) + " " + S.kg], [S.s_orient, best.nx + " × " + best.ny]];
      stats.innerHTML = rows.map(function (r) { return "<div><dt></dt><dd></dd></div>"; }).join("");
      $$("div", stats).forEach(function (el, i) { el.firstChild.textContent = rows[i][0]; el.lastChild.textContent = rows[i][1]; });
      var order = ["plooien", "rollen", "lassen", "trommelen", "parelstralen", "poederlakken", "anodiseren", "galvaniseren"], poss = { trommelen: 1, parelstralen: 1, poederlakken: 1, anodiseren: 1, galvaniseren: 1 };
      var items = [[S.r_draw, ""], [S.r_laser, ""]]; if (o.ops.indexOf("graveren") > -1) items.push([S.r_engrave, ""]);
      order.forEach(function (k) { if (o.ops.indexOf(k) > -1) items.push([S["r_" + k], poss[k] ? S.r_possible : ""]); });
      route.innerHTML = "<h3></h3><p></p><ol></ol>"; route.firstChild.textContent = S.route; route.children[1].textContent = S.route_note;
      items.forEach(function (it) { var li = d.createElement("li"), s = d.createElement("span"); s.textContent = it[0]; if (it[1]) { var sm = d.createElement("small"); sm.textContent = it[1]; s.appendChild(sm); } li.appendChild(s); route.lastChild.appendChild(li); });
      actions(o, true, num(best.n, 0), num(sheets, 0));
    }
    form.addEventListener("input", compute); form.addEventListener("change", compute); form.addEventListener("submit", function (e) { e.preventDefault(); });
    compute();
  });
})();
