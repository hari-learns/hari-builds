(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* drawer */
  var dr = $("#drawer"), bg = $("#burger"), bx = $("#burger-x");
  function openD() { dr.classList.add("is-open"); dr.setAttribute("aria-hidden", "false"); bg.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; setTimeout(function () { bx.focus(); }, 60); }
  function closeD() { dr.classList.remove("is-open"); dr.setAttribute("aria-hidden", "true"); bg.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  if (dr && bg) {
    bg.addEventListener("click", openD); bx.addEventListener("click", function () { closeD(); bg.focus(); });
    dr.addEventListener("click", function (e) { if (e.target.closest("a")) closeD(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr.classList.contains("is-open")) { closeD(); bg.focus(); } });
    window.addEventListener("resize", function () { if (innerWidth >= 1100 && dr.classList.contains("is-open")) closeD(); });
  }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) { }
  window.addEventListener("scroll", function once() { if (scrollY > 200 && dock) { dock.hidden = true; window.removeEventListener("scroll", once); } }, { passive: true });
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) { } });

  /* reveal */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 0.06 + "s"); io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* gallery */
  $$("[data-gal]").forEach(function (g) {
    var its = $$(".gal__it", g), bs = $$(".gal__b", g);
    bs.forEach(function (b) { b.addEventListener("click", function () { var i = +b.getAttribute("data-go"); its.forEach(function (x, k) { x.classList.toggle("is-on", k === i); }); bs.forEach(function (x, k) { x.classList.toggle("is-on", k === i); }); }); });
  });

  /* products filter */
  var grid = $("[data-grid]");
  if (grid) {
    var cards = $$(".pcard", grid), q = $("#q"), cat = "all", cnt = $("[data-count]"), emp = $("[data-empty]"), rows = $$(".tbl tbody tr");
    var apply = function () {
      var t = (q.value || "").toLowerCase().trim(), n = 0;
      cards.forEach(function (c) { var ok = (cat === "all" || c.getAttribute("data-cat") === cat) && (!t || c.getAttribute("data-q").indexOf(t) > -1); c.hidden = !ok; if (ok) n++; });
      rows.forEach(function (r) { r.hidden = !(cat === "all" || r.getAttribute("data-cat") === cat); });
      cnt.textContent = n + (n === 1 ? " product" : " products"); emp.hidden = n > 0;
    };
    $$(".chips-row [data-cat]").forEach(function (b) { b.addEventListener("click", function () { cat = b.getAttribute("data-cat"); $$(".chips-row [data-cat]").forEach(function (x) { x.classList.toggle("is-on", x === b); }); apply(); }); });
    q.addEventListener("input", apply); apply();
  }

  /* helpers */
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n > 0 ? n : null; }
  function f(n) { return (Math.round(n * 100) / 100).toString(); }
  function copyText(t, btn) {
    var done = function () { if (!btn) return; var o = btn.textContent; btn.textContent = btn.getAttribute("data-done") || "Copied"; setTimeout(function () { btn.textContent = o; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { fallback(); }); else fallback();
    function fallback() { var a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) { } a.remove(); done(); }
  }

  /* product page: does it cover my size */
  $$("[data-check]").forEach(function (c) {
    var d = c.getAttribute("data-d").split(",").map(Number), l = c.getAttribute("data-l").split(",").map(Number), out = $("[data-out]", c), ins = $$("input", c);
    var run = function () {
      var dv = num(ins[0].value), lv = num(ins[1].value), m = [], ok = true;
      if (!dv && !lv) { out.className = "check__out"; return; }
      if (dv) { var a = dv >= d[0] - 0.001 && dv <= d[1] + 0.001; ok = ok && a; m.push(a ? "Diameter " + f(dv) + " mm is covered." : "Diameter " + f(dv) + " mm is outside " + f(d[0]) + "–" + f(d[1]) + " mm."); }
      if (lv) { var b = lv >= l[0] - 0.001 && lv <= l[1] + 0.001; ok = ok && b; m.push(b ? "Length " + f(lv) + " mm is covered." : "Length " + f(lv) + " mm is outside " + f(l[0]) + "–" + f(l[1]) + " mm."); }
      out.className = "check__out " + (ok ? "ok" : "no"); out.textContent = (ok ? "Yes. " : "Not in the published range. ") + m.join(" ") + (ok ? "" : " Ask us about custom sizes.");
    };
    ins.forEach(function (i) { i.addEventListener("input", run); });
  });

  /* finder */
  $$("[data-finder]").forEach(function (root) {
    var D = JSON.parse($("[data-finder-data]", root).textContent), P = D.products;
    var res = $("[data-results]", root), near = $("[data-near]", root), nearList = $("[data-near-list]", root), sum = $("[data-sum]", root);
    var form = $(".finder__form", root), enq = $(".enq", root), list = $("[data-enq-list]", root), empty = $("[data-enq-empty]", root), send = $("[data-send]", root), copy = $("[data-copy]", root);
    var diaI = form.elements.dia, lenI = form.elements.len, finS = form.elements.fin, qtyI = form.elements.qty, destI = form.elements.dest;
    var subR = $$("input[type=radio]", form).filter(function (r) { return /sub$/.test(r.name); }), unitR = $$("input[type=radio]", form).filter(function (r) { return /unit$/.test(r.name); });
    var manual = {}, unit = "mm", last = [], subLabel = {}, example = false;
    D.substrates.forEach(function (s) { subLabel[s[0]] = s[1]; });
    var sel = function (rs) { var c = rs.filter(function (r) { return r.checked; })[0]; return c ? c.value : ""; };
    var toMm = function (v) { return v == null ? null : (unit === "in" ? v * 25.4 : v); };
    var fmt = function (mm) { return unit === "in" ? f(mm / 25.4) + " in" : f(mm) + " mm"; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

    function evaluate() {
      var sub = sel(subR), d = toMm(num(diaI.value)), l = toMm(num(lenI.value)), fin = finS.value, fits = [], nears = [], cands = [];
      P.forEach(function (p) {
        if (sub !== "any" && p.sub.indexOf(sub) < 0) return;
        var why = [], bad = [];
        if (d != null) { if (d >= p.d[0] - 0.001 && d <= p.d[1] + 0.001) why.push("Diameter " + fmt(d) + " is inside " + p.range.split(" · ")[0]); else bad.push("Diameter " + fmt(d) + " is " + (d < p.d[0] ? "below the minimum " + fmt(p.d[0]) : "above the maximum " + fmt(p.d[1]))); }
        if (l != null) { if (l >= p.l[0] - 0.001 && l <= p.l[1] + 0.001) why.push("Length " + fmt(l) + " is inside " + p.range.split(" · ")[1]); else bad.push("Length " + fmt(l) + " is " + (l < p.l[0] ? "below the minimum " + fmt(p.l[0]) : "above the maximum " + fmt(p.l[1]))); }
        if (fin !== "any") {
          if (!p.finish.length) why.push("Finish is not published for this product: ask us");
          else if (p.finish.some(function (x) { return x.indexOf(fin) > -1; })) why.push("Finish available: " + p.finishLabel.filter(function (x) { return x.toLowerCase().indexOf(fin) > -1; })[0]);
          else bad.push("Finish not in the published list (" + p.finishLabel.slice(0, 3).join(", ") + ")");
        }
        var o = { p: p, why: why, bad: bad };
        if (d == null && l == null && fin === "any") cands.push(o); else if (!bad.length) fits.push(o); else if (bad.length === 1) nears.push(o);
      });
      return { sub: sub, d: d, l: l, fits: fits, nears: nears, cands: cands };
    }
    var autoOn = true;
    function isOn(o, kind) { var m = manual[o.p.slug]; return m === undefined ? (kind === "fit" && autoOn) : m; }
    function card(o, kind) {
      var p = o.p, on = isOn(o, kind), items = o.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + o.bad.map(function (w) { return '<li class="x">' + esc(w) + "</li>"; }).join("");
      if (p.head.length) items += "<li class=\"i\">Head: " + esc(p.head.slice(0, 3).join(", ")) + "</li>";
      return '<article class="res ' + (kind === "fit" ? "is-fit" : kind === "near" ? "is-near" : "") + '"><a class="res__img" href="' + p.url + '" tabindex="-1" aria-hidden="true"><img src="' + p.img + '" width="' + p.iw + '" height="' + p.ih + '" alt="" loading="lazy"></a><div><h3 class="res__t"><a href="' + p.url + '">' + esc(p.title) + '</a></h3><p class="res__m mono">' + esc(p.model) + " · " + esc(p.range) + "</p><ul>" + items + '</ul><label class="res__pick"><input type="checkbox" data-pick="' + p.slug + '"' + (on ? " checked" : "") + "><span class=\"box\" aria-hidden=\"true\"></span> Add to my enquiry</label></div></article>";
    }
    function render() {
      var r = evaluate(), shown = r.fits.concat(r.cands), size = [];
      autoOn = r.fits.length <= 3;
      if (r.d != null) size.push(fmt(r.d)); if (r.l != null) size.push(fmt(r.l));
      var where = r.sub !== "any" ? " for " + subLabel[r.sub].toLowerCase() : "";
      if (r.cands.length) sum.textContent = r.cands.length + " products" + where + ". Add a size to check which ones cover it.";
      else if (r.fits.length) sum.textContent = r.fits.length + (r.fits.length === 1 ? " product covers " : " products cover ") + size.join(" × ") + where + ".";
      else sum.textContent = "No listed product covers " + (size.join(" × ") || "this") + where + " exactly." + (r.nears.length ? " Close matches are below." : "") + " Chang Yi also designs custom fasteners.";
      res.innerHTML = shown.map(function (o) { return card(o, r.cands.length ? "cand" : "fit"); }).join("");
      near.hidden = !r.nears.length; nearList.innerHTML = r.nears.map(function (o) { return card(o, "near"); }).join("");
      near.open = !!(r.nears.length && r.fits.length <= 2 && !r.cands.length);
      if (example) sum.textContent = "Example: " + sum.textContent + " Change the size to match your job.";
      last = r;
      renderEnq(r);
    }
    function picks(r) {
      var all = r.fits.concat(r.cands).map(function (o) { return [o, r.cands.length ? "cand" : "fit"]; }).concat(r.nears.map(function (o) { return [o, "near"]; }));
      var seen = {}, out = [];
      all.forEach(function (x) { if (!seen[x[0].p.slug] && isOn(x[0], x[1] === "cand" ? "none" : x[1])) { seen[x[0].p.slug] = 1; out.push(x[0]); } });
      // products picked earlier but no longer listed stay if the user ticked them
      Object.keys(manual).forEach(function (s) { if (manual[s] && !seen[s]) { var p = P.filter(function (q) { return q.slug === s; })[0]; if (p) { seen[s] = 1; out.push({ p: p, why: [], bad: [] }); } } });
      return out;
    }
    function text(r) {
      var ps = picks(r), s = ["Hello Chang Yi Bolt,", "", "I would like a quote for:"];
      ps.forEach(function (o) { s.push("- " + o.p.title + " (" + o.p.model + ")"); });
      if (!ps.length) s.push("- (please suggest a fitting product)");
      s.push("");
      if (r.sub !== "any") s.push("Fastening into: " + subLabel[r.sub]);
      if (r.d != null || r.l != null) s.push("Diameter x length: " + (r.d != null ? f(r.d) + " mm" : "?") + " x " + (r.l != null ? f(r.l) + " mm" : "?"));
      if (finS.value !== "any") s.push("Finish: " + finS.options[finS.selectedIndex].text);
      if (qtyI.value.trim()) s.push("Quantity: " + qtyI.value.trim());
      if (destI.value.trim()) s.push("Destination: " + destI.value.trim());
      var nm = (enq.querySelector("[name=name]") || {}).value, co = (enq.querySelector("[name=company]") || {}).value, em = (enq.querySelector("[name=email]") || {}).value;
      s.push("", "Thank you," + (nm ? "\n" + nm : "") + (co ? "\n" + co : "") + (em ? "\n" + em : ""));
      return { body: s.join("\n"), subject: D.subject + (ps[0] ? ps[0].p.title + (ps.length > 1 ? " and " + (ps.length - 1) + " more" : "") : "screw enquiry"), n: ps.length, ps: ps };
    }
    function renderEnq(r) {
      var t = text(r);
      empty.hidden = t.n > 0;
      list.innerHTML = t.ps.map(function (o) { return '<li><span>' + esc(o.p.title) + '</span><button type="button" data-rm="' + o.p.slug + '" aria-label="Remove ' + esc(o.p.title) + '">&times;</button></li>'; }).join("");
      send.setAttribute("href", "mailto:" + D.email + "?subject=" + encodeURIComponent(t.subject) + "&body=" + encodeURIComponent(t.body));
    }
    root.addEventListener("change", function (e) {
      var c = e.target.closest("[data-pick]");
      if (c) { manual[c.getAttribute("data-pick")] = c.checked; renderEnq(last); }
    });
    root.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]"); if (rm) { manual[rm.getAttribute("data-rm")] = false; render(); return; }
      var pr = e.target.closest("[data-preset]");
      if (pr) { example = false; var v = pr.getAttribute("data-preset").split(",").map(Number); diaI.value = unit === "in" ? (Math.round(v[0] / 25.4 * 1000) / 1000) : v[0]; lenI.value = unit === "in" ? (Math.round(v[1] / 25.4 * 1000) / 1000) : v[1]; manual = {}; render(); }
    });
    unitR.forEach(function (r) { r.addEventListener("change", function () {
      var nu = sel(unitR); if (nu === unit) return;
      [diaI, lenI].forEach(function (i) { var v = num(i.value); if (v != null) i.value = nu === "in" ? (Math.round(v / 25.4 * 1000) / 1000).toString() : f(v * 25.4); });
      unit = nu; $$("[data-unit]", root).forEach(function (u) { u.textContent = unit === "in" ? "inch" : "mm"; });
      render();
    }); });
    subR.forEach(function (r) { r.addEventListener("change", function () { example = false; manual = {}; render(); }); });
    [diaI, lenI, finS].forEach(function (i) { i.addEventListener("input", function () { example = false; manual = {}; render(); }); });
    [qtyI, destI].concat($$("input", enq)).forEach(function (i) { i.addEventListener("input", function () { renderEnq(last); }); });
    copy.addEventListener("click", function () { copyText(text(last).body, copy); });
    // prefill from the address: ?p=<product>&d=<mm>&l=<mm>
    try {
      var qs = new URLSearchParams(location.search), p0 = qs.get("p");
      if (qs.get("d")) diaI.value = qs.get("d"); if (qs.get("l")) lenI.value = qs.get("l");
      if (p0) { var pp = P.filter(function (q) { return q.slug === p0; })[0]; if (pp) { manual[pp.slug] = true; subR.forEach(function (r) { r.checked = r.value === (pp.sub[0] || "any"); }); if (!diaI.value) diaI.value = f((pp.d[0] + pp.d[1]) / 2 > 12 ? pp.d[1] : pp.d[0]); if (!lenI.value) lenI.value = f(Math.min(pp.l[1], Math.max(pp.l[0], 50))); } }
    } catch (e) { }
    if (!diaI.value && !lenI.value && !finS.selectedIndex && sel(subR) === "any") { diaI.value = "6"; lenI.value = "80"; subR.forEach(function (r) { r.checked = r.value === "concrete"; }); example = true; }
    render();
  });

  /* contact form */
  $$("[data-contact]").forEach(function (fm) {
    var to = JSON.parse($("[data-contact-data]", fm).textContent).email, g = function (id) { return ($("#" + id, fm).value || "").trim(); };
    var build = function () {
      var b = ["Company: " + g("c-co"), "Name: " + g("c-nm"), "Phone: " + g("c-ph"), "Email: " + g("c-em"), "", g("c-ms")].join("\n");
      return { s: $("#c-su", fm).value + " enquiry" + (g("c-co") ? " from " + g("c-co") : ""), b: b };
    };
    fm.addEventListener("submit", function () {
      if (!fm.checkValidity()) { fm.reportValidity(); return; }
      var m = build(); location.href = "mailto:" + to + "?subject=" + encodeURIComponent(m.s) + "&body=" + encodeURIComponent(m.b);
    });
    $("[data-copy]", fm).addEventListener("click", function (e) { copyText(build().b, e.currentTarget); });
  });

  /* office hours in Taipei time (UTC+8, no daylight saving): Mon-Fri 8:00-17:00 */
  $$("[data-open]").forEach(function (el) {
    var t = $("[data-open-t]", el);
    var run = function () {
      var now = new Date(), tp = new Date(now.getTime() + 8 * 3600e3), dow = tp.getUTCDay(), mins = tp.getUTCHours() * 60 + tp.getUTCMinutes();
      var open = dow >= 1 && dow <= 5 && mins >= 480 && mins < 1020, loc = function (d) { try { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } };
      if (open) { var close = new Date(now.getTime() + (1020 - mins) * 60e3); el.className = "open is-open"; t.textContent = "Office open now · closes 17:00 Taipei time (" + loc(close) + " your time)"; return; }
      var add = 0, d = dow;
      if (dow >= 1 && dow <= 5 && mins < 480) add = 0; else { add = 1; d = (dow + 1) % 7; while (d === 0 || d === 6) { add++; d = (d + 1) % 7; } }
      var openAt = Date.UTC(tp.getUTCFullYear(), tp.getUTCMonth(), tp.getUTCDate() + add, 8, 0) - 8 * 3600e3, od = new Date(openAt), days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var wd = ""; try { wd = od.toLocaleDateString([], { weekday: "long" }); } catch (e) { wd = days[(dow + add) % 7]; }
      el.className = "open is-closed"; t.textContent = "Office closed now · opens " + wd + " 8:00 Taipei time (" + loc(od) + " your time)";
    };
    run(); setInterval(run, 60000);
  });
})();
