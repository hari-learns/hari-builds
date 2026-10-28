(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); var dl = $("#vdlg"); if (dl && dl.open) dl.close(); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock) setTimeout(function () { dock.hidden = true; }, 9000);
  if (dock && safe(function () { return sessionStorage.getItem("sanho-dock") === "1"; })) dock.hidden = true;
  if (dock) window.addEventListener("scroll", function () { if (window.scrollY > 260 && !dock.hidden) { dock.hidden = true; } }, { passive: true });
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sanho-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.98) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* hero slider: their five homepage machines */
  $$("[data-slider]").forEach(function (st) {
    var slides = $$(".slide", st), dots = $$(".dot", st), cur = 0, timer = null, paused = false;
    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { var on = k === cur; s.classList.toggle("is-on", on); $("a", s).tabIndex = on ? 0 : -1; s.setAttribute("aria-hidden", on ? "false" : "true"); });
      dots.forEach(function (b, k) { b.classList.toggle("is-on", k === cur); b.setAttribute("aria-current", k === cur ? "true" : "false"); });
    }
    function start() { if (reduce || timer) return; timer = setInterval(function () { if (!paused && !d.hidden) go(cur + 1); }, 5500); }
    $$("[data-dir]", st).forEach(function (b) { b.addEventListener("click", function () { go(cur + parseInt(b.getAttribute("data-dir"), 10)); }); });
    dots.forEach(function (b) { b.addEventListener("click", function () { go(parseInt(b.getAttribute("data-go"), 10)); }); });
    st.addEventListener("mouseenter", function () { paused = true; }); st.addEventListener("mouseleave", function () { paused = false; });
    st.addEventListener("focusin", function () { paused = true; }); st.addEventListener("focusout", function () { paused = false; });
    st.addEventListener("touchstart", function () { paused = true; }, { passive: true });
    var x0 = null;
    st.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
    go(0); start();
  });

  /* product filter */
  var grid = $("#pgrid");
  if (grid) {
    var cards = $$(".pcard", grid), q = $("#psearch"), fam = "all", cnt = $("#pcount"), empty = $("#pempty");
    function filt() {
      var t = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean), n = 0;
      cards.forEach(function (c) {
        var ok = (fam === "all" || c.getAttribute("data-fam") === fam) && t.every(function (w) { return c.getAttribute("data-t").indexOf(w) > -1; });
        c.hidden = !ok; if (ok) n++;
      });
      cnt.textContent = n; empty.hidden = n > 0;
    }
    q.addEventListener("input", filt);
    $$(".fchip").forEach(function (b) {
      b.addEventListener("click", function () { fam = b.getAttribute("data-f"); $$(".fchip").forEach(function (x) { x.classList.toggle("is-on", x === b); }); filt(); });
    });
    var pf = safe(function () { return new URLSearchParams(location.search).get("family"); });
    if (pf) { var fb = $('.fchip[data-f="' + pf + '"]'); if (fb) fb.click(); }
  }

  /* product video: poster -> dialog */
  var vlinks = $$("[data-video]");
  if (vlinks.length) {
    var dlg = d.createElement("dialog"); dlg.id = "vdlg"; dlg.setAttribute("aria-label", "Product film");
    dlg.innerHTML = '<div class="dlg__x"><button type="button">Close</button></div><div class="dlg__f"></div>';
    d.body.appendChild(dlg);
    dlg.addEventListener("close", function () { $(".dlg__f", dlg).innerHTML = ""; });
    $("button", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    vlinks.forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!dlg.showModal) return;
        e.preventDefault();
        $(".dlg__f", dlg).innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + a.getAttribute("data-video") + '?autoplay=1&rel=0" title="Sanho product film" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
        dlg.showModal();
      });
    });
  }

  /* enquiry composer (contact page) */
  var enq = $("#enquiry");
  if (enq) {
    var cfg = JSON.parse($("#enq-data").textContent);
    function body() {
      var lines = ["Hello Sanho Machinery,", ""];
      Object.keys(cfg.labels).forEach(function (k) { var el = d.getElementById(k); if (el && el.value.trim()) lines.push(cfg.labels[k] + ": " + el.value.trim()); });
      lines.push("", "Please reply with a quote or tell me what else you need to know.");
      return lines.join("\n");
    }
    enq.addEventListener("submit", function (e) { e.preventDefault(); location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(cfg.subject) + "&body=" + encodeURIComponent(body()); });
    var cp = $("#enq-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = body(), done = cp.getAttribute("data-done"), old = cp.textContent;
      function ok() { cp.textContent = done; setTimeout(function () { cp.textContent = old; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok); else ok();
    });
  }

  /* ------------------------------------------------------------ machine finder */
  var fdEl = $("#finder-data");
  if (fdEl) {
    var DATA = JSON.parse(fdEl.textContent), UI = DATA.ui, MS = DATA.machines, uid = 0;
    var FIELDS = {
      "label:round": ["dia", "label_a", "label_b", "speed"], "label:top": ["item_w", "item_l", "label_a", "label_b", "speed"],
      "label:pouch": ["item_w", "item_l", "item_t", "label_a", "label_b", "speed"], "label:seal": ["box_a", "box_b", "box_c", "label_a", "label_b", "speed"],
      "label:sides": ["side_h", "side_w", "label_a", "label_b", "speed"], "label:kit": ["dia", "label_a", "label_b", "speed"],
      "mark": ["height", "line"], "carton": ["cw", "ch", "cl", "speed"], "print": ["pw", "pl"]
    };
    var LABELS = { "speed@carton": "Cartons per minute", "label_a@label": "Label width", "label_b@label": "Label height" };
    var ICON = {
      ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
      no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      nk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5M12 16v.2"/></svg>'
    };
    var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    var MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>';

    var g = function (n) { return n == null ? null : n; };
    function fmt(n) { return String(Math.round(n * 100) / 100); }
    function rtxt(r, unit, pre) {
      pre = pre || ""; unit = unit || "";
      if (r[0] == null && r[1] == null) return UI.unknown;
      if (r[0] == null) return "up to " + pre + fmt(r[1]) + unit;
      if (r[1] == null) return "from " + pre + fmt(r[0]) + unit;
      return pre + fmt(r[0]) + "-" + fmt(r[1]) + unit;
    }
    function inR(v, r) { return (r[0] == null || v >= r[0]) && (r[1] == null || v <= r[1]); }
    function why(v, r, name, unit, pre) {
      pre = pre || "";
      if (inR(v, r)) return { ok: true, t: name + " " + fmt(v) + unit + (r[0] == null ? " is within the maximum " + pre + fmt(r[1]) + unit : " is inside " + rtxt(r, unit, pre)) };
      var hi = r[1] != null && v > r[1];
      return { ok: false, t: name + " " + fmt(v) + unit + " is " + (hi ? "above the maximum " + pre + fmt(r[1]) : "below the minimum " + pre + fmt(r[0])) + unit };
    }

    function Finder(el) {
      var id = ++uid, mini = el.getAttribute("data-mode") === "mini";
      var st = { job: "label", shape: "round", v: {}, variable: false, feeder: false, auto: "any", colour: "any" };
      function readUrl() {
        if (mini) return;
        var p = safe(function () { return new URLSearchParams(location.search); }); if (!p) return;
        if (p.get("job")) st.job = p.get("job");
        if (p.get("shape")) st.shape = p.get("shape");
        ["dia", "item_w", "item_l", "item_t", "box_a", "box_b", "box_c", "side_h", "side_w", "label_a", "label_b", "speed", "line", "height", "cw", "ch", "cl", "pw", "pl"].forEach(function (k) { if (p.get(k)) st.v[k] = p.get(k); });
        if (p.get("var") === "1") st.variable = true; if (p.get("feeder") === "1") st.feeder = true;
        if (p.get("auto")) st.auto = p.get("auto"); if (p.get("colour")) st.colour = p.get("colour");
      }
      function writeUrl() {
        var p = new URLSearchParams(); p.set("job", st.job); if (st.job === "label") p.set("shape", st.shape);
        Object.keys(st.v).forEach(function (k) { if (st.v[k] !== "") p.set(k, st.v[k]); });
        if (st.variable) p.set("var", "1"); if (st.feeder) p.set("feeder", "1"); if (st.auto !== "any") p.set("auto", st.auto); if (st.colour !== "any") p.set("colour", st.colour);
        var q = "?" + p.toString();
        if (!mini) safe(function () { history.replaceState(null, "", location.pathname + q); });
        var l = $("[data-finder-link]"); if (l && mini) l.href = DATA.base + "/find/" + q;
        return q;
      }
      function num(k) { var x = parseFloat(String(st.v[k] == null ? "" : st.v[k]).replace(",", ".")); return isFinite(x) && x > 0 ? x : null; }
      function key() { return st.job === "label" ? "label:" + st.shape : st.job; }

      function candidates() {
        return MS.filter(function (m) {
          var f = m.f; if (f.job !== st.job) return false;
          if (st.job === "label" && f.shape !== st.shape) return false;
          if ((st.job === "label" || st.job === "carton") && st.auto !== "any" && f.auto !== st.auto) return false;
          return true;
        }).sort(function (a, b) { return ((b.f.speed || 0) - (a.f.speed || 0)) || (a.m < b.m ? -1 : 1); });
      }
      function pair(a, b, ra, rb, na, nb, unit) {   /* two sizes, either orientation */
        var o1 = inR(a, ra) && inR(b, rb), o2 = inR(b, ra) && inR(a, rb), rr = rtxt(ra, "", "") + " x " + rtxt(rb, unit, "");
        if (o1) return { ok: true, t: na + " " + fmt(a) + " x " + fmt(b) + unit + " is inside " + rr };
        if (o2) return { ok: true, t: na + " " + fmt(a) + " x " + fmt(b) + unit + " " + UI.orient + " (" + rr + ")" };
        return { ok: false, t: na + " " + fmt(a) + " x " + fmt(b) + unit + " is outside " + rr };
      }
      function evalM(m) {
        var f = m.f, R = [], n = 0, bad = 0, unk = 0;
        function add(o, t) { if (o === "nk") { unk++; R.push({ c: "nk", t: t }); } else { n++; if (!o.ok) bad++; R.push({ c: o.ok ? "ok" : "no", t: o.t }); } }
        if (st.job === "label") {
          var it = f.item, s = st.shape;
          var asked = false;
          if (s === "round" || s === "kit") { var dia = num("dia"); if (dia) { asked = true; if (it && it.dia) add(why(dia, it.dia, "Diameter", " mm", "Ø")); else add("nk", "Container diameter is not published for this machine"); } }
          if (s === "top" || s === "pouch") {
            var w = num("item_w"), l = num("item_l");
            if (w && l) { asked = true; if (it && it.flat) add(pair(w, l, it.flat[0], it.flat[1], "Item", "", " mm")); else add("nk", "Item size is not published for this machine"); }
            var t = num("item_t"); if (t && s === "pouch") { if (it && it.thick) add(why(t, it.thick, "Thickness", " mm")); else add("nk", "Item thickness is not published for this machine"); }
          }
          if (s === "seal") {
            var bs = [num("box_a"), num("box_b"), num("box_c")].filter(Boolean).sort(function (a, b) { return a - b; });
            if (bs.length === 3) { if (it && it.box) { var okb = bs.every(function (v, i) { return inR(v, it.box[i]); }); add({ ok: okb, t: okb ? "Carton " + bs.join(" x ") + " mm is inside " + it.box.map(function (r) { return rtxt(r, "", ""); }).join(" x ") + " mm" : "Carton " + bs.join(" x ") + " mm is outside " + it.box.map(function (r) { return rtxt(r, "", ""); }).join(" x ") + " mm" }); } else add("nk", "Carton size is not published for this machine"); }
          }
          if (s === "sides") {
            var sh = num("side_h"), sw = num("side_w");
            if (sh && sw) { if (it && it.sides) { var okS = inR(sh, it.sides.h) && inR(sw, it.sides.w); add({ ok: okS, t: okS ? "Container " + fmt(sh) + " x " + fmt(sw) + " mm is inside H " + rtxt(it.sides.h, "", "") + " x W " + rtxt(it.sides.w, " mm", "") : "Container " + fmt(sh) + " x " + fmt(sw) + " mm is outside H " + rtxt(it.sides.h, "", "") + " x W " + rtxt(it.sides.w, " mm", "") }); } else add("nk", "Container size is not published for this machine"); }
          }
          var la = num("label_a"), lb = num("label_b");
          if (la && lb) { if (f.label) add(pair(la, lb, f.label.a, f.label.b, "Label", "", " mm")); else add("nk", "Label size is not clearly published for this machine"); }
          else if (la || lb) { var v1 = la || lb; if (f.label) { var okL = inR(v1, f.label.a) || inR(v1, f.label.b); add({ ok: okL, t: "Label side " + fmt(v1) + " mm " + (okL ? "is inside" : "is outside") + " " + rtxt(f.label.a, "", "") + " / " + rtxt(f.label.b, " mm", "") }); } else add("nk", "Label size is not clearly published for this machine"); }
          var sp = num("speed");
          if (sp) { if (f.speed != null) { var okp = f.speed >= sp; add({ ok: okp, t: okp ? "Up to " + f.speed + "/min (you need " + fmt(sp) + ")" + (f.speed_note ? "; " + f.speed_note : "") : "Up to " + f.speed + "/min, you need " + fmt(sp) }); } else add("nk", "Speed is not published for this machine"); }
          if (st.variable) {
            if (f.variable === "built-in") add({ ok: true, t: "Prints variable data itself with a built-in thermal printer" });
            else if (f.variable === "option") add({ ok: true, t: "Variable data possible with an optional inkjet or thermal printer" });
            else add({ ok: false, t: "No variable-data printer is listed for this machine" });
          }
        } else if (st.job === "mark") {
          var h = num("height"), ln = num("line");
          if (h) add(why(h, f.height, "Mark height", " mm"));
          if (ln) { if (f.speed != null) { var okM = f.speed >= ln; add({ ok: okM, t: okM ? "Line speed up to " + f.speed + " m/min (you need " + fmt(ln) + ")" : "Line speed up to " + f.speed + " m/min, you need " + fmt(ln) }); } else add("nk", "Line speed is not published for this machine" + (f.speed_note ? " (" + f.speed_note + ")" : "")); }
          if (st.feeder) add({ ok: !!f.feeder, t: f.feeder ? "Feeds flat cartons or pouches by itself" : "Does not feed cartons or pouches itself" });
        } else if (st.job === "carton") {
          var c = f.item.carton;
          [["cw", "w", "Carton width"], ["ch", "h", "Carton height"], ["cl", "l", "Carton length"]].forEach(function (a) { var v = num(a[0]); if (v) add(why(v, c[a[1]], a[2], " mm")); });
          var cs = num("speed"); if (cs) { var okC = f.speed >= cs; add({ ok: okC, t: "Up to " + f.speed + " cartons/min" + (okC ? " (you need " + fmt(cs) + ")" : ", you need " + fmt(cs)) }); }
        } else if (st.job === "print") {
          var pw = num("pw"), pl = num("pl");
          if (pw) add(why(pw, f.wid, "Label width", " mm"));
          if (pl) add(why(pl, f.len, "Label length", " mm"));
          if (st.colour === "colour") add({ ok: !!f.colour, t: f.colour ? "Full-colour printer" : "Thermal printer, not full colour" });
          if (st.colour === "thermal") add({ ok: !f.colour, t: !f.colour ? "Thermal printer for barcodes and black print" : "Full-colour printer, not thermal" });
        }
        var status = bad ? "out" : (unk ? "check" : (n ? "fit" : "info"));
        return { m: m, status: status, R: R, n: n, unk: unk };
      }
      function published(m) {
        var f = m.f, L = [];
        if (st.job === "label") {
          var it = f.item;
          if (it) L.push({ c: "ok", t: "Item: " + (it.dia ? "diameter " + rtxt(it.dia, " mm", "Ø") : it.flat ? rtxt(it.flat[0], "", "") + " x " + rtxt(it.flat[1], " mm", "") : it.box ? it.box.map(function (r) { return rtxt(r, "", ""); }).join(" x ") + " mm" : it.sides ? "H " + rtxt(it.sides.h, "", "") + " x W " + rtxt(it.sides.w, " mm", "") : UI.unknown) });
          else L.push({ c: "nk", t: "Item size: " + UI.unknown });
          L.push(f.label ? { c: "ok", t: "Label: " + rtxt(f.label.a, "", "") + " x " + rtxt(f.label.b, " mm", "") } : { c: "nk", t: "Label size: " + UI.unknown });
          L.push(f.speed != null ? { c: "ok", t: "Speed: up to " + f.speed + "/min" + (f.speed_note ? " (" + f.speed_note + ")" : "") } : { c: "nk", t: "Speed: " + UI.unknown });
          if (f.variable) L.push({ c: "ok", t: f.variable === "built-in" ? "Prints variable data itself" : "Optional printer for variable data" });
        } else if (st.job === "mark") {
          L.push({ c: "ok", t: "Mark height: " + rtxt(f.height, " mm", "") });
          L.push(f.speed != null ? { c: "ok", t: "Line speed: up to " + f.speed + " m/min" + (f.speed_note ? " (" + f.speed_note + ")" : "") } : { c: "nk", t: "Line speed: " + UI.unknown + (f.speed_note ? " (" + f.speed_note + ")" : "") });
          if (f.feeder) L.push({ c: "ok", t: "Feeds flat cartons or pouches by itself" });
        } else if (st.job === "carton") {
          var c = f.item.carton; L.push({ c: "ok", t: "Carton: W " + rtxt(c.w, "", "") + " x H " + rtxt(c.h, "", "") + " x L " + rtxt(c.l, " mm", "") }); L.push({ c: "ok", t: "Speed: up to " + f.speed + " cartons/min" });
        } else if (st.job === "print") {
          L.push({ c: "ok", t: "Width: " + rtxt(f.wid, " mm", "") }); L.push({ c: "ok", t: "Length: " + rtxt(f.len, " mm", "") }); L.push({ c: "ok", t: f.colour ? "Full colour" : "Thermal, barcode and black print" });
        }
        return L;
      }
      function chipFor(m) { return m.f.auto || m.f.tech || (m.f.colour === true ? "Full colour" : m.f.colour === false ? "Thermal" : ""); }
      function card(r, info) {
        var m = r.m, v = info ? "info" : r.status, lab = info ? UI.all_in_group.split(",")[0] : (v === "fit" ? UI.res_fit : v === "check" ? UI.res_check : UI.res_out);
        var cls = { fit: "v-fit", check: "v-check", out: "v-out", info: "v-info" }[v];
        var L = info ? published(m) : r.R;
        var rs = L.map(function (x) { return '<li><span class="' + x.c + '">' + ICON[x.c] + "</span><span>" + esc(x.t) + "</span></li>"; }).join("");
        var small = chipFor(m);
        return '<li class="rcard"><span class="rcard__img"><img src="' + esc(m.img) + '" alt="" width="92" height="92" loading="lazy"></span>' +
          '<div class="rcard__t"><a href="' + DATA.base + "/products/" + m.s + '/">' + esc(m.m) + '</a><span class="rcard__m">' + esc(m.n) + (small ? " · " + esc(small) : "") + "</span>" +
          (info ? "" : '<br><span class="verdict ' + cls + '">' + esc(lab) + "</span>") + '</div><ul class="rcard__r">' + rs + "</ul></li>";
      }
      function mailBody(rs) {
        var lines = [UI.mail_intro, ""];
        var jobname = (UI.jobs.filter(function (j) { return j[0] === st.job; })[0] || [0, st.job])[1];
        lines.push("What I need: " + jobname);
        if (st.job === "label") lines.push("Product: " + (UI.shapes.filter(function (s) { return s[0] === st.shape; })[0] || [0, st.shape])[1]);
        Object.keys(st.v).forEach(function (k) { if (st.v[k] !== "" && st.v[k] != null) lines.push((UI.fields[k] ? UI.fields[k][0] : k) + ": " + st.v[k] + " " + (UI.fields[k] ? UI.fields[k][1] : "")); });
        if (st.variable) lines.push("Variable data (expiry date, barcode, QR) on the label: yes");
        if (st.feeder) lines.push("Machine should feed cartons or pouches by itself: yes");
        if (rs.length) { lines.push("", "Machines that looked right in the finder:"); rs.slice(0, 6).forEach(function (r) { lines.push("- " + r.m.n + " (" + r.m.m + ")"); }); }
        lines.push("", UI.mail_foot);
        return lines.join("\n");
      }

      function render() {
        var q = writeUrl(), k = key(), fl = FIELDS[k] || [];
        var html = "";
        html += '<div class="fd__block"><h3 class="fd__step" id="fd' + id + 'a">' + esc(UI.step1) + '</h3><div class="fd__jobs" role="group" aria-labelledby="fd' + id + 'a">' +
          UI.jobs.map(function (j) { return '<button type="button" class="jbtn" data-job="' + j[0] + '" aria-pressed="' + (st.job === j[0]) + '">' + esc(j[1]) + "</button>"; }).join("") + '</div><p class="fd__hint">' + esc(UI.job_hint[st.job]) + "</p></div>";
        if (st.job === "label") {
          html += '<div class="fd__block"><h3 class="fd__step" id="fd' + id + 'b">' + esc(UI.step2) + '</h3><div class="fd__shapes" role="group" aria-labelledby="fd' + id + 'b">' +
            UI.shapes.map(function (s) { return '<button type="button" class="tile" data-shape="' + s[0] + '" aria-pressed="' + (st.shape === s[0]) + '"><img src="' + esc(s[3]) + '" alt="" width="200" height="160" loading="lazy"><b>' + esc(s[1]) + "</b><span>" + esc(s[2]) + "</span></button>"; }).join("") + "</div></div>";
        }
        html += '<div class="fd__block"><h3 class="fd__step" id="fd' + id + 'c">' + esc(UI.step3) + '</h3><div class="fd__fields">' +
          fl.map(function (f) {
            var def = UI.fields[f], lab = LABELS[f + "@" + st.job] || def[0], val = st.v[f] == null ? "" : st.v[f];
            return '<div class="fld"><label for="fd' + id + f + '">' + esc(lab) + '</label><div class="in"><input id="fd' + id + f + '" data-k="' + f + '" type="text" inputmode="decimal" autocomplete="off" placeholder="' + esc(def[2]) + '" value="' + esc(val) + '"><span class="u">' + esc(def[1]) + "</span></div></div>";
          }).join("") + "</div>";
        html += '<div class="fd__opts">';
        if (st.job === "label") html += '<label class="opt"><input type="checkbox" data-o="variable"' + (st.variable ? " checked" : "") + '><span class="box"></span><span>' + esc(UI.var_label) + '</span></label>';
        if (st.job === "mark") html += '<label class="opt"><input type="checkbox" data-o="feeder"' + (st.feeder ? " checked" : "") + '><span class="box"></span><span>' + esc(UI.feeder_label) + '</span></label>';
        if (st.job === "label" || st.job === "carton") html += '<div class="fd__sel"><span id="fd' + id + 'au">' + esc(UI.auto_label) + '</span><select data-o="auto" aria-labelledby="fd' + id + 'au">' + UI.auto_opts.map(function (o) { return '<option value="' + o[0] + '"' + (st.auto === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
        if (st.job === "print") html += '<div class="fd__sel"><span id="fd' + id + 'co">' + esc(UI.colour_label) + '</span><select data-o="colour" aria-labelledby="fd' + id + 'co">' + UI.colour_opts.map(function (o) { return '<option value="' + o[0] + '"' + (st.colour === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
        html += "</div></div>";
        html += '<div class="fd__res" data-res></div>';
        el.innerHTML = html;
        results();
      }
      function results() {
        var res = $("[data-res]", el), cs = candidates();
        var any = Object.keys(st.v).some(function (k) { return num(k); }) || st.variable || (st.job === "mark" && st.feeder) || (st.job === "print" && st.colour !== "any");
        var out = "";
        if (!cs.length) { res.innerHTML = '<p class="fd__none">' + esc(UI.empty) + "</p>"; return; }
        if (!any) {
          var show = mini ? cs.slice(0, 3) : cs;
          out += '<p class="fd__sum" aria-live="polite">' + esc(UI.all_in_group) + " (" + cs.length + ")</p><ul class=\"rcards\">" + show.map(function (m) { return card({ m: m }, true); }).join("") + "</ul>";
          if (mini && cs.length > 3) out += '<p class="fd__hint">+ ' + (cs.length - 3) + " " + esc(UI.more_machines) + "</p>";
          out += '<p class="fd__hint fd__noteb">' + esc(UI.no_numbers) + "</p>";
          res.innerHTML = out; return;
        }
        var rs = cs.map(evalM), fit = rs.filter(function (r) { return r.status === "fit"; }), chk = rs.filter(function (r) { return r.status === "check"; }), outr = rs.filter(function (r) { return r.status === "out"; });
        out += '<p class="fd__sum" aria-live="polite">' + esc(UI.sum_fmt.replace("{fit}", fit.length).replace("{check}", chk.length).replace("{out}", outr.length)) + "</p>";
        var lim = mini ? 3 : 999, shown = 0;
        function grp(arr, title) { if (!arr.length || shown >= lim) return ""; var part = arr.slice(0, lim - shown); shown += part.length; return '<div class="rgroup"><h4 class="rgroup__t">' + esc(title) + '</h4><ul class="rcards">' + part.map(function (r) { return card(r); }).join("") + "</ul></div>"; }
        out += grp(fit, UI.res_fit) + grp(chk, UI.res_check);
        if (!fit.length && !chk.length) out += '<p class="fd__none">Nothing in this group covers those numbers. See the closest machines below, or call Sanho.</p>';
        if (mini && fit.length + chk.length > 3) out += '<p class="fd__hint">+ ' + (fit.length + chk.length - 3) + " " + esc(UI.more_machines) + "</p>";
        if (!mini && outr.length) out += '<details class="rout rgroup"><summary>' + esc(UI.out_h) + " (" + outr.length + ")</summary><ul class=\"rcards\">" + outr.map(function (r) { return card(r); }).join("") + "</ul></details>";
        var good = fit.concat(chk), body = mailBody(good);
        out += '<div class="fd__cta"><h3>' + esc(UI.cta_h) + "</h3><p>" + esc(UI.cta_p) + '</p><div class="btn-row"><a class="btn" data-mail href="mailto:' + DATA.company.email + "?subject=" + encodeURIComponent(UI.mail_subject.replace("{job}", (UI.jobs.filter(function (j) { return j[0] === st.job; })[0] || [0, st.job])[1])) + "&body=" + encodeURIComponent(body) + '">' + MAIL + esc(UI.cta_btn) + '</a><button type="button" class="btn btn--ghost" data-copy>' + esc(UI.cta_copy) + '</button><a class="btn btn--ghost" href="tel:' + DATA.company.tel.replace(/[^+\d]/g, "") + '">' + esc(UI.cta_call) + '</a></div></div><p class="note fd__noteb">' + esc(UI.note) + "</p>";
        res.innerHTML = out;
        var cp = $("[data-copy]", res);
        if (cp) cp.addEventListener("click", function () { var old = cp.textContent; function ok() { cp.textContent = UI.cta_copied; setTimeout(function () { cp.textContent = old; }, 1800); } if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(body).then(ok, ok); else ok(); });
      }
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-job],[data-shape]"); if (!b) return;
        if (b.hasAttribute("data-job")) { st.job = b.getAttribute("data-job"); st.v = {}; if (st.job !== "label") st.variable = false; } else { st.shape = b.getAttribute("data-shape"); st.v = {}; }
        render();
        var again = $((b.hasAttribute("data-job") ? '[data-job="' + st.job + '"]' : '[data-shape="' + st.shape + '"]'), el); if (again) again.focus({ preventScroll: true });
      });
      el.addEventListener("input", function (e) {
        var i = e.target; if (i.getAttribute("data-k")) { st.v[i.getAttribute("data-k")] = i.value.trim(); writeUrl(); results(); }
      });
      el.addEventListener("change", function (e) {
        var o = e.target.getAttribute("data-o"); if (!o) return;
        if (o === "variable" || o === "feeder") st[o] = e.target.checked; else st[o] = e.target.value;
        writeUrl(); results();
      });
      if (mini) { st.v = { dia: "60", label_a: "50", label_b: "80", speed: "40" }; }
      readUrl(); if (!FIELDS[key()]) { st.job = "label"; st.shape = "round"; }
      render();
    }
    $$("[data-finder]").forEach(Finder);
  }
})();
