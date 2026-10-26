/* Lambton Conveyor redesign concept: one IIFE, every feature existence-guarded. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- drawer ---------- */
  (function () {
    var d = $("#drawer"), b = $("#burger"), x = $("#burger-x");
    if (!d || !b) return;
    function open(o) {
      d.classList.toggle("is-open", o); d.setAttribute("aria-hidden", o ? "false" : "true"); b.setAttribute("aria-expanded", o ? "true" : "false");
      document.body.style.overflow = o ? "hidden" : ""; if (o && x) x.focus(); else b.focus();
    }
    b.addEventListener("click", function () { open(true); });
    if (x) x.addEventListener("click", function () { open(false); });
    $$("a", d).forEach(function (a) { a.addEventListener("click", function () { open(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.classList.contains("is-open")) open(false); });
    var mq = window.matchMedia("(min-width:1200px)");
    var fn = function () { if (mq.matches && d.classList.contains("is-open")) { d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; } };
    if (mq.addEventListener) mq.addEventListener("change", fn);
  })();

  /* ---------- dock ---------- */
  (function () {
    var dock = $("#dock"), x = $("#dock-x"); if (!dock || !x) return;
    try { if (sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
    x.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });
  })();

  /* ---------- reveal + counters ---------- */
  (function () {
    var els = $$(".rv"); if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); }
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      els.forEach(function (e) { io.observe(e); });
      setTimeout(function () { els.forEach(function (e) { if (!e.classList.contains("in")) { var r = e.getBoundingClientRect(); if (r.top < innerHeight) e.classList.add("in"); } }); }, 1200);
    }
    if (reduce || !("IntersectionObserver" in window)) return;
    $$("[data-count]").forEach(function (el) {
      var raw = el.getAttribute("data-count"), m = raw.match(/^([\d,]+)(.*)$/); if (!m) return;
      var end = parseInt(m[1].replace(/,/g, ""), 10), suf = m[2], node = el.firstChild;
      if (!node || node.nodeType !== 3) return;
      var run = false, io2 = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || run) return; run = true; io2.disconnect();
        var t0 = performance.now(), dur = 1300;
        (function step(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3))); node.nodeValue = v.toLocaleString("en-US") + suf; if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: 0.6 });
      io2.observe(el);
    });
  })();

  /* ---------- table filters (chips + "I need at least") ---------- */
  $$("[data-filtertable]").forEach(function (t) {
    var sec = t.closest("section") || document;
    if (sec.__ft) return; sec.__ft = true;
    function apply() {
      var chip = $("[data-filter][aria-pressed='true']", sec), f = chip ? chip.getAttribute("data-filter") : "all";
      var need = {}; $$("[data-need]", sec).forEach(function (i) { need[i.getAttribute("data-attr")] = parseFloat(String(i.value).replace(/,/g, "")) || 0; });
      $$("[data-filtertable]", sec).forEach(function (tb) {
        var hit = false;
        $$("tbody tr", tb).forEach(function (r) {
          var ok = f === "all" || r.getAttribute("data-d") === f || r.getAttribute("data-p") === f; r.hidden = !ok;
          var dim = false; for (var k in need) { var v = r.getAttribute("data-" + k); if (v !== null && need[k] > 0 && parseFloat(v) < need[k]) dim = true; }
          r.classList.toggle("dim", dim); var isHit = ok && !dim && !hit && Object.keys(need).some(function (k) { return need[k] > 0; });
          r.classList.toggle("hit", isHit); if (isHit) hit = true;
        });
      });
    }
    $$("[data-filter]", sec).forEach(function (c) { c.addEventListener("click", function () { $$("[data-filter]", sec).forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); }); apply(); }); });
    $$("[data-need]", sec).forEach(function (i) { i.addEventListener("input", apply); });
    apply();
  });

  /* ---------- Ultra Dry rates table ---------- */
  (function () {
    var tab = $("[data-udtab]"), js = $("[data-udjson]"); if (!tab || !js) return;
    var d = JSON.parse(js.textContent), m = $("[data-ud='m']"), t = $("[data-ud='t']"), tb = $("tbody", tab);
    function draw() {
      var out = "";
      Object.keys(d.rates).forEach(function (fan) {
        var arr = d.rates[fan][t.value][m.value];
        out += "<tr><th scope='row'>" + esc(fan) + "</th>" + arr.map(function (c) { return "<td class='n'>" + (c ? c[0] + " <span class='mono'>/ " + c[1] + " h</span>" : "&ndash;") + "</td>"; }).join("") + "</tr>";
      });
      tb.innerHTML = out;
    }
    m.addEventListener("change", draw); t.addEventListener("change", draw); draw();
  })();

  /* ---------- events: mark upcoming / past from today's date ---------- */
  (function () {
    var ul = $("[data-events]"); if (!ul) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    $$("li", ul).forEach(function (li) {
      var s = new Date(li.getAttribute("data-start") + "T00:00:00"), e = new Date(li.getAttribute("data-end") + "T00:00:00"), st = $(".st", li); if (!st) return;
      var past = e < today, now = s <= today && today <= e;
      li.classList.toggle("is-past", past); st.classList.toggle("is-past", past); st.textContent = past ? "Past" : now ? "On now" : "Upcoming";
    });
  })();

  /* ---------- dealers ---------- */
  (function () {
    var tb = $("[data-dtable]"); if (!tb) return;
    var q = $("[data-dsearch]"), cnt = $("[data-dcount]"), chips = $$("[data-dfilter]");
    function apply() {
      var f = (chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })[0] || {}).getAttribute ? chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })[0].getAttribute("data-dfilter") : "all";
      var s = (q.value || "").toLowerCase().trim(), n = 0;
      $$("tbody tr", tb).forEach(function (r) { var ok = (f === "all" || r.getAttribute("data-c") === f) && (!s || r.getAttribute("data-s").indexOf(s) > -1); r.hidden = !ok; if (ok) n++; });
      if (cnt) cnt.textContent = n + " dealer" + (n === 1 ? "" : "s") + " shown";
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); }); apply(); }); });
    if (q) q.addEventListener("input", apply); apply();
  })();

  /* ---------- contact form -> drafted email ---------- */
  (function () {
    var f = $("[data-contact]"); if (!f) return;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var g = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
      var body = "Hello Lambton team,\n\n" + (g("m") || "I would like a quote.") + "\n\nName: " + g("n") + "\nFarm or company: " + g("c") + "\nProject location: " + g("l") + "\n";
      location.href = "mailto:sales@lambtonconveyor.com?subject=" + encodeURIComponent("Quote request" + (g("l") ? " (" + g("l") + ")" : "")) + "&body=" + encodeURIComponent(body);
    });
  })();

  /* ---------- the sizer ---------- */
  $$("[data-sizer]").forEach(function (root) {
    var js = $("[data-sizer-data]", root); if (!js) return;
    var D = JSON.parse(js.textContent), full = root.getAttribute("data-mode") === "full", out = $("[data-out]", root);
    var S = { bu: 40000, bph: 6000, n: 0, wet: false, m: 25, t: 160, pb: 0, pe: 0, pd: 0 };
    var MAXBIN = 73319, DIAS = [30, 33, 36, 42, 48];

    function readHash() {
      var h = (location.hash || "").replace(/^#/, ""); if (!h) return;
      h.split("&").forEach(function (kv) {
        var p = kv.split("="), k = p[0], v = decodeURIComponent(p[1] || "");
        if (k === "bu" && +v > 0) S.bu = +v; if (k === "bph" && +v > 0) S.bph = +v; if (k === "n" && +v >= 0) S.n = +v;
        if (k === "wet") S.wet = v === "1"; if (k === "m" && /^(20|25|30)$/.test(v)) S.m = +v; if (k === "t" && /^(140|160|180)$/.test(v)) S.t = +v;
      });
    }
    function writeHash() {
      var h = "bu=" + S.bu + "&bph=" + S.bph + (S.n ? "&n=" + S.n : "") + (S.wet ? "&wet=1&m=" + S.m + "&t=" + S.t : "");
      try { history.replaceState(null, "", "#" + h); } catch (e) {}
    }
    function sync() {
      $$("[data-in]", root).forEach(function (i) {
        var k = i.getAttribute("data-in");
        if (i.type === "checkbox") i.checked = !!S[k]; else if (document.activeElement !== i) i.value = S[k];
      });
      var dry = $("[data-dry]", root); if (dry) dry.hidden = !S.wet;
      $$("[data-set]", root).forEach(function (c) { c.setAttribute("aria-pressed", String(S[c.getAttribute("data-set")] === +c.getAttribute("data-v"))); });
    }

    /* --- calculators --- */
    function binOptions() {
      var nmin = Math.max(1, Math.ceil(S.bu / MAXBIN)), n = S.n > 0 ? S.n : nmin, per = S.bu / n, res = [];
      DIAS.forEach(function (d) {
        var r = D.bins.filter(function (b) { return b[0] === d; }).filter(function (b) { return b[2] >= per; })[0];
        if (r) res.push({ d: d, rings: r[1], bu: r[2], m3: r[3], mt: r[5], eave: r[6], eavem: r[7], total: r[8], totalm: r[9], n: n, sum: r[2] * n, over: (r[2] * n - S.bu) / S.bu });
      });
      res.sort(function (a, b) { return a.over - b.over; });
      var short = res.slice().sort(function (a, b) { return a.totalm - b.totalm; })[0];
      res.forEach(function (r, i) { r.tags = []; if (i === 0) r.tags.push("Best fit"); if (short && r === short && res.length > 1) r.tags.push("Lowest roof"); });
      return { opts: res, n: n, nmin: nmin };
    }
    function elevOptions() { return D.elev.filter(function (e) { return e[1] >= S.bph; }).slice().sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3); }
    function moveRows() {
      var r = [], need = S.bph;
      var e = elevOptions()[0];
      if (e) r.push(["Vertical lift", "Bucket elevator", e[0], fmt(e[1]) + " BPH", D.links.elev]);
      var g = D.gld.filter(function (x) { return x[0] >= need; })[0];
      if (g) r.push(["Level conveyor", "En masse chain, flat bottom", g[1], fmt(g[0]) + " BPH", D.links.gld]);
      var gi = D.glid.filter(function (x) { return x[0] >= need; })[0];
      if (gi) r.push(["Incline conveyor", "Chain, flat bottom incline", gi[1], fmt(gi[0]) + " BPH", D.links.glid]);
      var lp = D.loops.filter(function (x) { return x[1] >= need; })[0];
      if (lp) r.push(["Grain loop", "Rotary gate tube", lp[0] + "\" tube", "up to " + fmt(lp[1]) + " BPH", D.links.loops]);
      if (need <= 20000) r.push(["Grain cannon", "Horizontal to 60°", "see catalogue", "up to 20,000 BPH", D.links.cannon]);
      var sc = D.screw.filter(function (x) { return x[1] >= need; })[0];
      if (sc) r.push(["Screw conveyor", "Round-bottom U-trough", sc[0] + "\" tube", fmt(sc[1]) + " BPH at max rpm", D.links.screw]);
      var au = D.auger.filter(function (x) { return x[1] >= need; })[0];
      if (au) r.push(["Utility auger", "Up to 45°, portable", au[0] + "\" tube", "up to " + fmt(au[1]) + " BPH", D.links.auger]);
      return r;
    }
    function dryOptions() {
      var o = [], U = D.ud;
      Object.keys(U.rates).forEach(function (fan) {
        var arr = U.rates[fan][S.t][S.m];
        arr.forEach(function (c, i) { if (c) o.push({ fan: fan, col: U.cols[i][0], batch: U.cols[i][1], rate: c[0], hrs: c[1] }); });
      });
      o.sort(function (a, b) { return b.rate - a.rate; });
      return o;
    }

    /* --- render --- */
    function render() {
      var B = binOptions(), E = elevOptions(), M = moveRows(), dry = S.wet ? dryOptions() : [];
      if (S.pb >= B.opts.length) S.pb = 0; if (S.pe >= E.length) S.pe = 0; if (S.pd >= Math.min(4, dry.length)) S.pd = 0;
      var u = D.ui, h = "";
      var fillH = S.bu / S.bph;
      /* store */
      var st = "<div class='res'><h3>" + esc(u.store_h) + " <small>" + fmt(S.bu) + " bu in " + B.n + " bin" + (B.n > 1 ? "s" : "") + "</small></h3>";
      if (!B.opts.length) st += "<p class='warn'>" + esc("No single table size reaches " + fmt(S.bu / B.n) + " bu per bin with " + B.n + " bin" + (B.n > 1 ? "s" : "") + ". Choose more bins or ask the sales desk.") + "</p>";
      else {
        st += "<div class='picks'>" + B.opts.map(function (o, i) {
          return "<button type='button' class='pick' data-pb='" + i + "' aria-pressed='" + (i === S.pb) + "'><b>" + (o.n > 1 ? o.n + " × " : "") + o.d + "' · " + o.rings + " rings</b><span class='sub'>" + fmt(o.sum) + " bu" + (o.n > 1 ? " (" + fmt(o.bu) + " each)" : "") + "</span>" +
            "<span class='meta'>" + (o.over >= 0 ? "+" + (o.over * 100).toFixed(1) + "% spare" : "") + " · eave " + esc(o.eave) + " (" + o.eavem + " m)<br>total height " + esc(o.total) + " (" + o.totalm + " m)<br>" + fmt(o.m3) + " m³ · " + fmt(o.mt) + " MT each</span>" +
            o.tags.map(function (t, j) { return "<span class='tag" + (j ? " tag--l" : "") + "'>" + esc(t) + "</span>"; }).join("") + "</button>";
        }).join("") + "</div>";
      }
      if (S.bu / B.n < 10273) st += "<p class='warn'>" + esc(u.under_bin) + "</p>";
      if (S.bu > MAXBIN) st += "<p class='warn'>" + esc(u.over_bin) + "</p>";
      st += "<p class='note'>" + esc(u.store_note) + " <a href='" + D.links.bins + "'>All bin sizes</a></p></div>";
      /* move */
      var mv = "<div class='res'><h3>" + esc(u.move_h) + " <small>at " + fmt(S.bph) + " BPH, " + fmt(S.bu) + " bu takes about " + (fillH < 10 ? fillH.toFixed(1) : fmt(fillH)) + " h</small></h3>";
      if (E.length) {
        mv += "<div class='picks'>" + E.map(function (e, i) {
          return "<button type='button' class='pick' data-pe='" + i + "' aria-pressed='" + (i === S.pe) + "'><b>" + esc(e[0]) + "</b><span class='sub'>" + fmt(e[1]) + " BPH · " + e[2] + " TPH · " + e[3] + " MTPH</span><span class='meta'>" + (((e[1] / S.bph - 1) * 100) | 0) + "% headroom over your rate</span>" + (i === 0 ? "<span class='tag'>Smallest that fits</span>" : "") + "</button>";
        }).join("") + "</div>";
      } else mv += "<p class='warn'>" + esc(u.over_bph) + "</p>";
      if (M.length) {
        mv += "<div style='overflow-x:auto;margin-top:16px'><table class='mtab'><thead><tr><th scope='col'>Job</th><th scope='col'>Product</th><th scope='col'>Model</th><th scope='col' class='n'>Capacity</th></tr></thead><tbody>" +
          M.map(function (r) { return "<tr><td><a href='" + r[4] + "'>" + esc(r[0]) + "</a></td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td><td class='n'>" + esc(r[3]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      }
      mv += "<p class='note'>" + esc(u.move_note) + "</p></div>";
      /* dry */
      var dr = "";
      if (S.wet) {
        dr = "<div class='res'><h3>" + esc(u.dry_h) + " <small>" + S.m + "% moisture, " + S.t + "°F plenum</small></h3><div class='picks'>" + dry.slice(0, 4).map(function (o, i) {
          var days = S.bu / o.rate / 24;
          return "<button type='button' class='pick' data-pd='" + i + "' aria-pressed='" + (i === S.pd) + "'><b>Ultra Dry " + esc(o.col) + "</b><span class='sub'>" + o.rate + " bu/hr · " + o.hrs + " h per " + fmt(o.batch) + " bu batch</span><span class='meta'>" + esc(o.fan) + " fan and heater<br>" + fmt(S.bu) + " bu in about " + (days < 1 ? (S.bu / o.rate).toFixed(0) + " h" : days.toFixed(1) + " days") + " of continuous drying</span>" + (i === 0 ? "<span class='tag'>Fastest</span>" : "") + "</button>";
        }).join("") + "</div>" + (dry.length && dry[0].rate < S.bph ? "<p class='warn'>Drying sets the pace here: the fastest option above dries about " + dry[0].rate + " bu/hr, below your " + fmt(S.bph) + " BPH leg. Ask the sales desk how to balance wet holding, dryer and leg.</p>" : "") + "<p class='note'>" + esc(u.dry_note) + " <a href='" + D.links.dry + "#t-udrates'>Full drying table</a></p></div>";
      }
      /* plan */
      var pb = B.opts[S.pb], pe = E[S.pe], pdry = dry[S.pd], lines = [], ml = [];
      if (pb) { var l = (pb.n > 1 ? pb.n + " × " : "") + pb.d + "' bin, " + pb.rings + " rings" + (pb.n > 1 ? " each" : "") + ": " + fmt(pb.sum) + " bu, eave " + pb.eave + ", total height " + pb.total; lines.push(["Store", l]); ml.push("Storage: " + l); }
      if (pe) { var l2 = pe[0] + ": " + fmt(pe[1]) + " BPH (" + pe[3] + " MTPH)"; lines.push(["Lift", l2]); ml.push("Bucket elevator: " + l2); }
      M.forEach(function (r) { if (r[0] === "Level conveyor") { lines.push(["Convey", r[2] + ": " + r[3]]); ml.push("Level conveyor: " + r[2] + " (" + r[3] + ")"); } });
      if (pdry) { var l3 = "Ultra Dry " + pdry.col + ", " + pdry.fan + ", " + S.t + "°F, " + S.m + "% moisture: " + pdry.rate + " bu/hr"; lines.push(["Dry", l3]); ml.push("Dryer: " + l3); }
      var body = "Hello Lambton team,\n\nI used the grain system sizing tool and would like a quote for:\n\n- Grain to store: " + fmt(S.bu) + " bushels\n- Grain movement needed: " + fmt(S.bph) + " BPH\n" + ml.map(function (x) { return "- " + x; }).join("\n") + "\n\nName:\nFarm or company:\nProject location:\nPhone:\n\n(Indicative sizing from the published catalogue tables.)";
      var href = "mailto:" + D.co.email + "?subject=" + encodeURIComponent("Grain system quote: " + fmt(S.bu) + " bu, " + fmt(S.bph) + " BPH") + "&body=" + encodeURIComponent(body);
      var plan = "<div class='plan' id='plan-card'><h3 class='h3'>" + esc(u.plan_h) + "</h3><ul>" + lines.map(function (r) { return "<li><b>" + r[0] + "</b><span>" + esc(r[1]) + "</span></li>"; }).join("") + "</ul>" +
        "<div class='btn-row'><a class='btn' href='" + href + "' data-send>" + esc(u.send) + "</a><a class='btn btn--ghost' href='" + D.co.telhref + "'>" + esc(u.call) + "</a>" + (full ? "<button type='button' class='btn btn--ghost' data-copy>" + esc(u.copy) + "</button>" : "") + "</div><p class='note' data-copied aria-live='polite'></p><p class='note'>" + esc(u.disclaimer) + "</p></div>";
      if (full) out.innerHTML = st + mv + dr + "<div id='plan'></div>" + plan;
      else {
        var pbc = pb ? "<div class='picks'><div class='pick' style='cursor:default'><b>" + (pb.n > 1 ? pb.n + " × " : "") + pb.d + "' · " + pb.rings + " rings</b><span class='sub'>" + fmt(pb.sum) + " bu</span><span class='meta'>eave " + esc(pb.eave) + ", total " + esc(pb.total) + "</span></div>" : "<div class='picks'><div class='pick' style='cursor:default'><b>More bins</b><span class='meta'>" + esc(u.over_bin) + "</span></div>";
        var pec = pe ? "<div class='pick' style='cursor:default'><b>" + esc(pe[0]) + "</b><span class='sub'>" + fmt(pe[1]) + " BPH</span><span class='meta'>smallest bucket elevator that reaches " + fmt(S.bph) + " BPH</span></div></div>" : "<div class='pick' style='cursor:default'><b>Above the table</b><span class='meta'>" + esc(u.over_bph) + "</span></div></div>";
        out.innerHTML = "<div class='res'><h3>Best fit <small>" + fmt(S.bu) + " bu at " + fmt(S.bph) + " BPH</small></h3>" + pbc + pec + "<div class='btn-row'><a class='btn' href='" + root.getAttribute("data-full") + "'>See the full plan</a></div></div>";
      }
      $$("[data-pb]", out).forEach(function (b) { b.addEventListener("click", function () { S.pb = +b.getAttribute("data-pb"); render(); }); });
      $$("[data-pe]", out).forEach(function (b) { b.addEventListener("click", function () { S.pe = +b.getAttribute("data-pe"); render(); }); });
      $$("[data-pd]", out).forEach(function (b) { b.addEventListener("click", function () { S.pd = +b.getAttribute("data-pd"); render(); }); });
      var cp = $("[data-copy]", out);
      if (cp) cp.addEventListener("click", function () {
        var msg = $("[data-copied]", out), done = function () { if (msg) msg.textContent = u.copied; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, function () { window.prompt("Copy this link", location.href); });
        else window.prompt("Copy this link", location.href);
      });
      if (full) writeHash();
    }

    /* --- inputs --- */
    function num(v) { var x = parseFloat(String(v).replace(/,/g, "")); return isFinite(x) ? x : 0; }
    $$("[data-in]", root).forEach(function (i) {
      var k = i.getAttribute("data-in");
      var h = function () {
        if (i.type === "checkbox") S[k] = i.checked;
        else if (k === "bu" || k === "bph") { var v = num(i.value); if (v > 0) S[k] = v; else return; }
        else S[k] = +i.value;
        S.pb = 0; S.pe = 0; S.pd = 0; sync(); render();
      };
      i.addEventListener("input", h); i.addEventListener("change", h);
    });
    $$("[data-set]", root).forEach(function (c) { c.addEventListener("click", function () { S[c.getAttribute("data-set")] = +c.getAttribute("data-v"); S.pb = 0; S.pe = 0; sync(); render(); }); });
    if (full) readHash();
    else {
      var fullUrl = root.getAttribute("data-full");
      if (!fullUrl) { var fl = $$("a[href*='size-my-system']").filter(function (a) { return a.classList.contains("tlink"); })[0]; fullUrl = fl ? fl.getAttribute("href") : ""; root.setAttribute("data-full", fullUrl); }
      var upd = function () { var a = $$("a[href*='size-my-system']"); a.forEach(function (x) { if (x.closest(".sec") === root.closest(".sec")) x.setAttribute("href", fullUrl.split("#")[0] + "#bu=" + S.bu + "&bph=" + S.bph); }); root.setAttribute("data-full", fullUrl.split("#")[0] + "#bu=" + S.bu + "&bph=" + S.bph); };
      var r0 = render; render = function () { r0(); upd(); };
    }
    var more = $("[data-more]", root);
    if (more) { var mq2 = window.matchMedia("(min-width:980px)"); more.open = mq2.matches || S.wet || S.n > 0; }
    sync(); render();
    if (full) window.addEventListener("hashchange", function () { readHash(); sync(); render(); });
  });
})();
