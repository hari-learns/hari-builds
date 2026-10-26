(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sunyi-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sunyi-dock", "1"); }); });

  /* reveal on scroll (with a sweep so nothing is ever stranded) */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in window)) rvs.forEach(activate);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); }); sweep();
  }

  /* hero mosaic: three columns drift slightly with scroll (<= 5%), desktop only */
  var cols = $$(".mos__col");
  if (cols.length && !reduce) {
    var tick = false;
    var par = function () {
      tick = false;
      if (window.innerWidth < 900) { cols.forEach(function (c) { c.style.transform = ""; }); return; }
      var y = Math.min(window.scrollY, 700);
      cols.forEach(function (c) { var s = parseFloat(c.getAttribute("data-speed")) || 0; c.style.transform = "translate3d(0," + (y * s).toFixed(1) + "px,0)"; });
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(par); } }, { passive: true });
    window.addEventListener("resize", par);
  }

  /* timeline progress line */
  $$(".tl").forEach(function (tl) {
    var fill = $("i", tl), t2 = false;
    if (!fill) return;
    var upd = function () {
      t2 = false;
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.7 - r.top) / r.height));
      fill.style.height = (p * 100).toFixed(1) + "%";
    };
    window.addEventListener("scroll", function () { if (!t2) { t2 = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd); upd();
  });

  /* machine filters */
  var mgrid = $("#mgrid");
  if (mgrid) {
    var cards = $$(".mcard", mgrid), chips = $$(".filters .chip"), site = "all", kind = "all", cnt = $("#mcount");
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) { var ok = (site === "all" || c.dataset.site === site) && (kind === "all" || c.dataset.kind === kind); c.hidden = !ok; if (ok) n++; });
      if (cnt) cnt.textContent = n + " of " + cards.length + " machines";
    };
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        if (ch.dataset.f) { site = ch.dataset.f; } else { kind = kind === ch.dataset.k ? "all" : ch.dataset.k; }
        chips.forEach(function (o) { var on = o.dataset.f ? o.dataset.f === site : o.dataset.k === kind; o.setAttribute("aria-pressed", on ? "true" : "false"); o.classList.toggle("is-on", on); });
        apply();
      });
    });
    apply();
  }

  /* gallery filter + lightbox */
  var gal = $("#gal");
  if (gal) {
    var items = $$(".gal__it", gal), gchips = $$(".filters .chip"), gcnt = $("#gcount");
    var ga = function (g) {
      var n = 0;
      items.forEach(function (it) { var ok = g === "all" || it.dataset.g === g; it.hidden = !ok; if (ok) n++; });
      if (gcnt) gcnt.textContent = n + " photos";
      gchips.forEach(function (c) { var on = c.dataset.g === g; c.setAttribute("aria-pressed", on ? "true" : "false"); c.classList.toggle("is-on", on); });
    };
    gchips.forEach(function (c) { c.addEventListener("click", function () { ga(c.dataset.g); }); });
    ga("all");
    var lb = $("#lb"), lbi = $("#lb-img"), lbc = $("#lb-cap");
    items.forEach(function (it) {
      it.addEventListener("click", function () {
        if (!lb || !lb.showModal) return;
        lbi.src = it.dataset.full; lbi.alt = it.querySelector("img").alt; lbc.textContent = it.dataset.cap; lb.showModal();
      });
    });
    if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* contact form -> email draft */
  var qf = $("#qform");
  if (qf) {
    qf.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = qf.elements;
      if (!f.name.value.trim() || !f.msg.value.trim()) { (f.name.value.trim() ? f.msg : f.name).focus(); return; }
      var body = "Name: " + f.name.value + "\nCompany: " + f.company.value + "\nEmail: " + f.email.value + "\nPhone: " + f.phone.value + "\n\n" + f.msg.value;
      location.href = "mailto:" + qf.dataset.to + "?subject=" + encodeURIComponent("Quote request from " + f.name.value) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------------- signature tool: Does my part fit? ---------------- */
  var tool = $("[data-tool]");
  var dataEl = $("#tool-data");
  if (tool && dataEl) {
    var D = JSON.parse(dataEl.textContent);
    var fieldsEl = $("#tool-fields"), resEl = $("#tool-res");
    var state = { proc: "turn", v: { dia: "12", len: "80", mat: "Stainless steel 316/316L", qty: "50", x: "120", y: "80", z: "40", t: "2", sl: "600", sw: "400", bl: "300" }, ops: { "sheet:cut": true, "sheet:bend": true, "fast:cut": true, "fast:thread": true } };
    var qp = safe(function () { return new URLSearchParams(location.search).get("p"); });
    if (qp && D.procs.some(function (p) { return p.id === qp; })) state.proc = qp;
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
    var QUEST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>';
    var CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

    function num(x) { var n = parseFloat(String(x).replace(",", ".")); return isFinite(n) && n > 0 ? n : null; }
    function matOptions(list) { return list.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + "</option>"; }).join(""); }
    function fld(id, label, unit, ph, extra) {
      return '<label class="fld"><span>' + esc(label) + (unit ? ' <small>' + esc(unit) + "</small>" : "") + '</span><input id="f-' + id + '" data-k="' + id + '" inputmode="decimal" autocomplete="off" placeholder="' + esc(ph || "") + '"' + (extra || "") + "></label>";
    }
    function tolFld() {
      return '<label class="fld"><span>Tightest tolerance</span><select id="f-tol" data-k="tol">' + D.tolOptions.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + "</option>"; }).join("") + "</select></label>";
    }
    function matFld() {
      var groups = D.materials.map(function (m) { return m.n; });
      return '<label class="fld"><span>Material</span><select id="f-mat" data-k="mat"><option value="">Choose a material</option>' + matOptions(groups) + '<option value="__other">Other / not sure</option></select></label>';
    }
    function sheetMatFld() {
      return '<label class="fld"><span>Material</span><select id="f-mat" data-k="mat"><option value="">Choose a material</option>' + matOptions(D.sheetMaterials) + '<option value="__other">Other / not sure</option></select></label>';
    }
    function opt(group, id, label) { return '<label class="opt"><input type="checkbox" data-op="' + group + ':' + id + '"' + (state.ops[group + ":" + id] ? " checked" : "") + "> " + esc(label) + "</label>"; }

    function renderFields() {
      var p = state.proc, h = "";
      if (p === "turn") {
        h += '<div class="fgrid">' + fld("dia", "Diameter", "mm", "e.g. 12") + fld("len", "Length", "mm", "e.g. 80") + "</div>";
        h += '<div class="fgrid">' + matFld() + tolFld() + "</div>" + '<div class="fgrid">' + fld("qty", "Quantity", "pieces", "e.g. 50") + "</div>";
      } else if (p === "mill") {
        h += '<p class="tool__step mono">' + "2. Size of the part envelope" + '</p><div class="fgrid fgrid--3">' + fld("x", "X", "mm", "120") + fld("y", "Y", "mm", "80") + fld("z", "Z", "mm", "40") + "</div>";
        h += '<div class="fgrid">' + matFld() + tolFld() + "</div>" + '<div class="fgrid">' + fld("qty", "Quantity", "pieces", "e.g. 20") + "</div>";
        h += '<div class="opts">' + opt("mill", "five", "Needs 5-axis machining") + "</div>";
      } else if (p === "sheet") {
        h += '<div class="fgrid fgrid--3">' + fld("t", "Thickness", "mm", "2") + fld("sl", "Blank length", "mm", "600") + fld("sw", "Blank width", "mm", "400") + "</div>";
        h += '<p class="tool__step mono">Operations</p><div class="opts">' + opt("sheet", "cut", "Laser cut") + opt("sheet", "punch", "Punch") + opt("sheet", "bend", "Bend") + opt("sheet", "shear", "Shear") + opt("sheet", "weld", "Weld") + "</div>";
        h += '<div class="fgrid">' + fld("bl", "Longest bend", "mm, if bending", "300") + sheetMatFld() + "</div>" + '<div class="fgrid">' + fld("qty", "Quantity", "pieces", "e.g. 10") + "</div>";
      } else {
        h += '<p class="tool__step mono">Which rework?</p><div class="opts">' + D.fast.ops.map(function (o) { return opt("fast", o.id, o.label); }).join("") + "</div>";
        h += '<div class="fgrid">' + fld("dia", "Shank diameter, if known", "mm", "e.g. 10") + fld("qty", "Quantity", "pieces", "e.g. 20") + "</div>" + '<div class="fgrid">' + matFld() + "</div>";
      }
      fieldsEl.innerHTML = h;
      // restore values
      $$("[data-k]", fieldsEl).forEach(function (el) { var v = state.v[el.dataset.k]; if (v != null) el.value = v; });
    }

    function siteName(s) { return D.site[s]; }
    function acceptTol(m, tolUm) {
      if (!tolUm) return "ok";
      if (!m.acc) return "check";
      if (tolUm >= m.acc[1]) return "ok";
      if (tolUm >= m.acc[0]) return "check";
      return "no";
    }
    function matLine(name) {
      if (!name) return null;
      if (name === "__other") return { c: "ask", t: "Material not on the published list: ask the team. Sunyi says it will propose a turnkey solution from sourcing to manufacturing." };
      var m = D.materials.filter(function (x) { return x.n === name; })[0];
      if (!m) return null;
      var inds = m.i.filter(function (v, i, a) { return a.indexOf(v) === i; });
      return { c: "ok", t: name + " is on Sunyi's published materials list (" + inds.join(", ") + ")." };
    }
    function qtyLine(q, isFast) {
      if (!q) return null;
      if (isFast) return q < D.fast.moq ? { c: "ask", t: "Below the published minimum of " + D.fast.moq + " pieces. Write to the team anyway." } : { c: "ok", t: "Quantity " + q + " meets the published minimum of " + D.fast.moq + " pieces." };
      if (q >= 2000) return { c: "ask", t: "Sunyi's published focus is high-mix, low-volume. For " + q + " pieces, ask about volume." };
      return { c: "ok", t: "Quantity " + q + ": high-mix, low-volume is Sunyi's core work." };
    }

    function machineHtml(m, why, cls) {
      var cap = m.d ? "Ø " + m.d + " x L " + m.l + " mm" : (m.xyz ? m.xyz.join(" x ") + " mm" : (m.thick && m.sheet ? m.thick[0] + " to " + m.thick[1] + " mm thick, " + m.sheet.join(" x ") + " mm sheet" : (m.shear ? "up to " + m.thick[1] + " mm, length " + m.shear + " mm" : (m.cap || m.note || ""))));
      var acc = Array.isArray(m.acc) ? m.acc[0] + " to " + m.acc[1] + " µm" : "";
      return '<li class="res__m"><b>' + esc(m.type) + " · " + esc(m.maker) + "</b><span>" + (cap ? "Capacity " + esc(cap) : "") + (typeof m.acc === "string" ? " · accuracy " + esc(m.acc) : "") + (acc ? " · accuracy " + acc : "") + (m.units ? " · " + m.units + " unit" + (m.units > 1 ? "s" : "") : "") + '</span><span class="why' + (cls ? " " + cls : "") + '">' + esc(why) + "</span></li>";
    }
    function groupBySite(list) {
      var out = "";
      ["SG", "JB"].forEach(function (s) {
        var ls = list.filter(function (x) { return x.m.site === s; });
        if (!ls.length) return;
        out += '<p class="res__site"><span class="site-chip site-chip--' + s + '">' + esc(siteName(s)) + "</span>" + ls.length + (ls.length > 1 ? " options" : " option") + '</p><ul class="res__list">' + ls.map(function (x) { return machineHtml(x.m, x.why, x.cls); }).join("") + "</ul>";
      });
      return out;
    }
    function lines(arr) {
      arr = arr.filter(Boolean);
      return arr.length ? '<ul class="res__lines">' + arr.map(function (l) { return '<li class="' + l.c + '">' + (l.c === "ok" ? CHECK : l.c === "no" ? CROSS : QUEST) + "<span>" + esc(l.t) + "</span></li>"; }).join("") + "</ul>" : "";
    }

    function compute() {
      var p = state.proc, v = state.v, out = { head: "", cls: "", sub: "", body: "", summary: "", subject: "" };
      var mat = v.mat, tol = v.tol ? parseFloat(v.tol) : null, q = num(v.qty);
      var tolTxt = tol ? "+/- " + (tol / 1000) + " mm" : "";
      if (p === "turn") {
        var dia = num(v.dia), len = num(v.len);
        if (!dia || !len) return { empty: "Enter the diameter and length of the part. The check updates as you type." };
        var fits = [], big = [], tolBlock = false;
        D.machines.forEach(function (m) {
          if (m.kind !== "turn" && !(m.kind === "grind" && m.d)) return;
          if (m.kind === "grind" && !(tol && tol <= 5)) return;
          if (dia <= m.d && len <= m.l) {
            var t = acceptTol(m, tol);
            if (t === "no") { tolBlock = true; return; }
            fits.push({ m: m, why: "Ø " + dia + " fits Ø " + m.d + ", L " + len + " fits L " + m.l + (tol ? (t === "ok" ? ", tolerance inside the published band" : ", tolerance at the edge of the published band: engineers confirm") : "") + (m.note ? ". " + m.note : ""), cls: t === "check" ? "is-check" : "" });
          } else big.push(m);
        });
        var ls = [];
        if (dia <= D.autolathe.round[1]) ls.push({ c: "ok", t: "Ø " + dia + " is inside the published CNC auto-lathe range for round bar (Ø " + D.autolathe.round[0] + " to " + D.autolathe.round[1] + " mm)." });
        if (tol && tol < 5 && !fits.some(function (f) { return f.m.kind === "grind"; })) ls.push({ c: "ask", t: "A tolerance of " + tolTxt + " is tighter than the 5 to 10 µm band on the turning list. Ask about grinding or finishing." });
        ls.push(matLine(mat)); ls.push(qtyLine(q));
        out.summary = "Part: turned, Ø " + dia + " x L " + len + " mm" + (mat && mat !== "__other" ? ", " + mat : "") + (tolTxt ? ", tolerance " + tolTxt : "") + (q ? ", quantity " + q : "");
        out.subject = "Part check: Ø" + dia + " x " + len + " mm" + (mat && mat !== "__other" ? ", " + mat : "") + (q ? ", qty " + q : "");
        if (fits.length) {
          var sites = {}; fits.forEach(function (f) { sites[f.m.site] = 1; });
          out.head = fits.length + (fits.length > 1 ? " machine types" : " machine type") + " on the published list can take Ø " + dia + " x " + len + " mm."; out.cls = "is-ok";
          out.sub = "Sites: " + Object.keys(sites).map(siteName).join(" and ") + ".";
          out.body = groupBySite(fits) + lines(ls); out.matched = fits.map(function (f) { return siteName(f.m.site) + ": " + f.m.maker + " " + f.m.type; });
        } else {
          if (tolBlock) { out.head = "Tighter than the published machine accuracy."; out.cls = "is-ask"; out.sub = "The size fits, but " + tolTxt + " is below the 5 to 10 µm band on the list. Ask the team about grinding or finishing."; }
          else { out.head = "Larger than any published turning machine."; out.cls = "is-no"; out.sub = "The biggest published turning capacity is Ø 250 x L 500 mm (Johor). Ask the team: they may know a route."; }
          out.body = lines(ls);
        }
      } else if (p === "mill") {
        var x = num(v.x), y = num(v.y), z = num(v.z);
        if (!x || !y || !z) return { empty: "Enter the X, Y and Z size of the part. The check updates as you type." };
        var dims = [x, y, z].sort(function (a, b) { return b - a; });
        var five = !!state.ops["mill:five"];
        var f2 = [], tolBlock2 = false;
        D.machines.forEach(function (m) {
          if (m.kind !== "mill") return;
          var cap = m.xyz.slice().sort(function (a, b) { return b - a; });
          if (dims[0] <= cap[0] && dims[1] <= cap[1] && dims[2] <= cap[2]) {
            var t = acceptTol(m, tol); if (t === "no") { tolBlock2 = true; return; }
            f2.push({ m: m, why: "Part envelope " + dims.join(" x ") + " mm fits the " + m.xyz.join(" x ") + " mm travel" + (tol ? (t === "ok" ? "; tolerance inside the published band" : "; tolerance at the edge of the published band: engineers confirm") : ""), cls: t === "check" ? "is-check" : "" });
          }
        });
        var ls2 = [];
        if (five) ls2.push({ c: "ask", t: "5-axis machining was added in 2020. Its machine envelope is not on the current site: ask the team." });
        if (tol && tol < 5) ls2.push({ c: "ask", t: "A tolerance of " + tolTxt + " is tighter than the published 5 to 10 µm band: ask about grinding or finishing." });
        ls2.push(matLine(mat)); ls2.push(qtyLine(q));
        out.summary = "Part: milled, envelope " + dims.join(" x ") + " mm" + (five ? ", needs 5-axis" : "") + (mat && mat !== "__other" ? ", " + mat : "") + (tolTxt ? ", tolerance " + tolTxt : "") + (q ? ", quantity " + q : "");
        out.subject = "Part check: milled " + dims.join("x") + " mm" + (mat && mat !== "__other" ? ", " + mat : "") + (q ? ", qty " + q : "");
        if (f2.length) {
          var s2 = {}; f2.forEach(function (f) { s2[f.m.site] = 1; });
          out.head = f2.length + (f2.length > 1 ? " machine types" : " machine type") + " on the published list can take this part."; out.cls = "is-ok";
          out.sub = "Sites: " + Object.keys(s2).map(siteName).join(" and ") + ". Fixtures and clamping are checked from your drawing.";
          out.body = groupBySite(f2) + lines(ls2); out.matched = f2.map(function (f) { return siteName(f.m.site) + ": " + f.m.maker + " " + f.m.type; });
        } else {
          if (tolBlock2) { out.head = "Tighter than the published machine accuracy."; out.cls = "is-ask"; out.sub = "The size fits a machine centre, but " + tolTxt + " is below the 5 to 10 µm band on the list. Ask the team."; }
          else { out.head = "Larger than any published machine centre."; out.cls = "is-no"; out.sub = "The biggest published envelope is 1500 x 600 x 650 mm (Johor). Ask the team about other routes."; }
          out.body = lines(ls2);
        }
      } else if (p === "sheet") {
        var t = num(v.t), sl = num(v.sl), sw = num(v.sw), bl = num(v.bl);
        var ops = ["cut", "punch", "bend", "shear", "weld"].filter(function (o) { return state.ops["sheet:" + o]; });
        if (!t || !sl || !sw) return { empty: "Enter the thickness and blank size, then tick the operations you need." };
        if (!ops.length) ops = ["cut"];
        var blank = [sl, sw].sort(function (a, b) { return b - a; });
        var rows = [], ask = [];
        D.sheet.forEach(function (m) {
          ops.forEach(function (o) {
            if (m.ops.indexOf(o) < 0) return;
            if (o === "cut" || o === "punch") {
              var inT = t >= m.thick[0] && t <= m.thick[1], cap = m.sheet.slice().sort(function (a, b) { return b - a; }), inS = blank[0] <= cap[0] && blank[1] <= cap[1];
              if (inT && inS) rows.push({ m: m, why: (o === "cut" ? "Laser cuts " : "Punches ") + t + " mm in a " + blank.join(" x ") + " mm blank (limit " + m.thick[1] + " mm, " + m.sheet.join(" x ") + " mm, " + m.acc + ")" });
            } else if (o === "shear") {
              if (t <= m.thick[1] && blank[0] <= m.shear) rows.push({ m: m, why: "Shears " + t + " mm; blank edge " + blank[0] + " mm is within the " + m.shear + " mm length (thickness limit " + m.thick[1] + " mm)" });
            } else if (o === "bend") {
              var L = bl || blank[0];
              if (m.bend) { if (L <= m.bend) rows.push({ m: m, why: "Bends up to " + m.bend + " mm length (published as 101 in); your bend is " + L + " mm" }); }
              else rows.push({ m: m, why: "Bend length is not published for this brake: the team confirms", cls: "is-check" });
            } else if (o === "weld") rows.push({ m: m, why: "Welding: argon, MIG, TIG and stick. Sunyi specialises in steel, stainless steel and aluminium" });
          });
        });
        var ls3 = [];
        ops.forEach(function (o) { if (!rows.some(function (r) { return r.m.ops.indexOf(o) >= 0; })) ls3.push({ c: "no", t: "No published " + o + " machine covers " + t + " mm and a " + blank.join(" x ") + " mm blank. Ask the team." }); });
        ls3.push(mat && mat !== "__other" ? { c: "ok", t: mat + " is on Sunyi's published sheet metal material list." } : (mat === "__other" ? { c: "ask", t: "Material not on the sheet metal list: ask the team." } : null));
        ls3.push(qtyLine(q));
        out.summary = "Part: sheet metal, " + t + " mm, blank " + blank.join(" x ") + " mm, operations: " + ops.join(", ") + (mat && mat !== "__other" ? ", " + mat : "") + (q ? ", quantity " + q : "");
        out.subject = "Part check: sheet " + t + " mm, " + ops.join("+") + (q ? ", qty " + q : "");
        if (rows.length) { out.head = "Sunyi's Johor plant has the sheet metal machines for this."; out.cls = "is-ok"; out.sub = "Sheet metal machines are listed at the Johor plant."; out.body = groupBySite(rows) + lines(ls3); out.matched = rows.map(function (r) { return siteName(r.m.site) + ": " + r.m.maker + " " + r.m.type; }); }
        else { out.head = "Nothing on the published list covers this."; out.cls = "is-no"; out.sub = "Ask the team: they may have a route through their partner network."; out.body = lines(ls3); }
      } else {
        var fo = D.fast.ops.filter(function (o) { return state.ops["fast:" + o.id]; });
        if (!fo.length) return { empty: "Tick the rework you need: boring, cut length, deburr, threading or turn shank." };
        var dia2 = num(v.dia), ls4 = [];
        ls4.push({ c: "ok", t: "Rework and modification start from " + D.fast.price + ", with a minimum order of " + D.fast.moq + " pieces." });
        ls4.push(qtyLine(q, true));
        var fits4 = [];
        if (dia2) D.machines.forEach(function (m) { if (m.kind === "turn" && dia2 <= m.d) fits4.push({ m: m, why: "Ø " + dia2 + " fits within Ø " + m.d + " capacity" }); });
        ls4.push(matLine(mat));
        out.summary = "Fastener rework: " + fo.map(function (o) { return o.label; }).join(", ") + (dia2 ? ", diameter " + dia2 + " mm" : "") + (mat && mat !== "__other" ? ", " + mat : "") + (q ? ", quantity " + q : "");
        out.subject = "Fastener rework: " + fo.map(function (o) { return o.label.split(" (")[0]; }).join(", ") + (q ? ", qty " + q : "");
        out.head = "Covered: " + fo.map(function (o) { return o.label.split(" (")[0].toLowerCase(); }).join(", ") + "."; out.cls = "is-ok";
        out.sub = "These are the rework operations listed on Sunyi's custom fasteners page.";
        out.body = lines(ls4) + (fits4.length ? '<p class="res__site">Turning machines that take Ø ' + dia2 + " mm</p>" + groupBySite(fits4) : "");
        out.matched = fits4.map(function (f) { return siteName(f.m.site) + ": " + f.m.maker + " " + f.m.type; });
      }
      return out;
    }

    function render() {
      var r = compute();
      if (r.empty) { resEl.innerHTML = '<p class="tool__empty">' + esc(r.empty) + "</p>"; return; }
      var body = (r.matched && r.matched.length ? "\n\nMachines that match on your published list:\n- " + r.matched.slice(0, 8).join("\n- ") : "");
      var mail = "mailto:" + D.email + "?subject=" + encodeURIComponent(r.subject) + "&body=" + encodeURIComponent("Hello Sunyi team,\n\nI checked a part on your website:\n" + r.summary + body + "\n\nI will attach the drawing to this email.\n\nThank you,");
      resEl.innerHTML = '<h3 class="res__head ' + r.cls + '">' + esc(r.head) + '</h3><p class="res__sub">' + esc(r.sub) + "</p>" + r.body +
        '<div class="res__cta"><a class="btn" data-send href="' + mail + '">Email these numbers to Sunyi</a><a class="btn btn--ghost" href="tel:' + D.telHref + '">Call ' + esc(D.tel) + '</a></div><p class="res__fine">' + esc(D.qaline) + "</p>";
    }

    // events
    tool.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".proc");
      if (b) {
        state.proc = b.dataset.proc;
        $$(".proc", tool).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        renderFields(); render();
      }
    });
    var tmr;
    tool.addEventListener("input", function (e) {
      var el = e.target; if (!el.dataset) return;
      if (el.dataset.k) state.v[el.dataset.k] = el.value;
      if (el.dataset.op) state.ops[el.dataset.op] = el.checked;
      clearTimeout(tmr); tmr = setTimeout(render, 120);
    });
    tool.addEventListener("change", function (e) { var el = e.target; if (el.dataset && el.dataset.k) { state.v[el.dataset.k] = el.value; render(); } if (el.dataset && el.dataset.op) { state.ops[el.dataset.op] = el.checked; render(); } });
    $$(".proc", tool).forEach(function (o) { o.setAttribute("aria-pressed", o.dataset.proc === state.proc ? "true" : "false"); });
    renderFields(); render();
  }
})();
