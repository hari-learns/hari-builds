(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header turns solid on scroll */
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
  if (dock && safe(function () { return sessionStorage.getItem("metco-dock") === "1"; })) dock.hidden = true;
  if (dock) setTimeout(function () { dock.hidden = true; }, 7000);
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("metco-dock", "1"); }); });

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

  /* video facade: loads YouTube only after a tap */
  var vbtn = $("[data-video]"), vdlg = null;
  if (vbtn) {
    vbtn.addEventListener("click", function () {
      if (!vdlg) {
        vdlg = d.createElement("dialog"); vdlg.className = "lightbox"; vdlg.setAttribute("aria-label", vbtn.getAttribute("data-title") || "Video");
        vdlg.innerHTML = '<button type="button" class="lb__x" aria-label="Close video"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button><div class="lb__v"></div>';
        d.body.appendChild(vdlg);
        $(".lb__x", vdlg).addEventListener("click", function () { vdlg.close(); });
        vdlg.addEventListener("close", function () { $(".lb__v", vdlg).innerHTML = ""; });
        vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
      }
      $(".lb__v", vdlg).innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + vbtn.getAttribute("data-video") + '?autoplay=1&rel=0" title="' + (vbtn.getAttribute("data-title") || "Video") + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      if (vdlg.showModal) vdlg.showModal(); else vdlg.setAttribute("open", "");
    });
  }

  /* gallery lightbox */
  var lb = $("#lb");
  if (lb) {
    var lbi = $("#lb-img"), lbc = $("#lb-cap");
    $$("[data-lb]").forEach(function (b) {
      b.addEventListener("click", function () {
        lbi.src = b.getAttribute("data-lb"); lbi.alt = b.getAttribute("data-alt") || ""; lbc.textContent = b.getAttribute("data-alt") || "";
        if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
      });
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* quote brief builder (signature tool) */
  var qb = $("[data-qb]");
  if (qb) {
    var DATA = JSON.parse($("#qb-data").textContent), mode = qb.getAttribute("data-qb");
    var form = $("form", qb), out = {
      checks: $("[data-qb-checks]", qb), text: $("[data-qb-text]", qb), meter: $("[data-qb-meter]", qb),
      count: $$("[data-qb-count]"), mail: $$("[data-qb-mail]"), copy: $("[data-qb-copy]", qb), status: $("[data-qb-status]", qb), cont: $("[data-qb-continue]", qb)
    };
    var matById = {}; DATA.materials.forEach(function (m) { matById[m.id] = m; });
    var procName = {}; DATA.procs.forEach(function (p) { procName[p[0]] = p[1]; });
    var qtyName = {}; DATA.qty.forEach(function (p) { qtyName[p[0]] = p[1]; });
    var finName = {}; DATA.finishes.forEach(function (p) { finName[p[0]] = p[1]; });
    var fileName = {}; DATA.files.forEach(function (p) { fileName[p[0]] = p[1]; });
    var ICON = {
      ok: '<svg class="chk__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
      warn: '<svg class="chk__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v5M12 18v.01"/></svg>',
      info: '<svg class="chk__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>'
    };
    function num(v) { var n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; }
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function val(name) { var el = form.elements[name]; return el ? (el.value || "").trim() : ""; }
    function checked(name) { return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }
    function radio(name) { var c = checked(name); return c[0] || ""; }
    function get() {
      var s = {
        procs: mode === "full" ? checked("proc") : [], mat: mode === "full" ? radio("mat") : val("mat"), thick: num(val("thick")),
        len: num(val("len")), wid: num(val("wid")), hgt: num(val("hgt")), kg: num(val("kg")),
        qty: radio("qty"), qtyn: num(val("qtyn")), fin: radio("fin"), colour: val("colour"), files: checked("file"),
        when: val("when"), where: val("where"), name: val("name"), org: val("org"), phone: val("phone"), email: val("email"), notes: val("notes")
      };
      return s;
    }
    function fitsBox(dims, box) {
      var a = dims.slice().sort(function (x, y) { return y - x; }), b = box.slice().sort(function (x, y) { return y - x; });
      for (var i = 0; i < a.length; i++) if (a[i] > b[i]) return false;
      return true;
    }
    function fitsCyl(dims, dia, len) {
      var d3 = dims.slice(); while (d3.length < 3) d3.push(0);
      for (var i = 0; i < 3; i++) {
        var l = d3[i], r = d3.filter(function (_, j) { return j !== i; });
        if (l <= len && Math.sqrt(r[0] * r[0] + r[1] * r[1]) <= dia) return true;
      }
      return false;
    }
    function checks(s) {
      var list = [];
      var laserOn = mode === "mini" || s.procs.indexOf("laser-cutting") > -1;
      if (laserOn) {
        var m = matById[s.mat];
        if (m && m.laser && s.thick) {
          if (s.thick <= m.laser) list.push(["ok", "Laser thickness", s.thick + " mm " + m.label.toLowerCase() + " is inside the published laser limit of " + m.laser + " mm."]);
          else list.push(["warn", "Laser thickness", s.thick + " mm " + m.label.toLowerCase() + " is above the published laser limit of " + m.laser + " mm. Ask Metco which process suits it."]);
        } else if (m && !m.laser && s.mat) {
          list.push(["info", "Laser thickness", "Metco publishes no laser limit for " + m.label.toLowerCase() + ". Say what you need and ask."]);
        } else if (m && m.laser && !s.thick) {
          list.push(["info", "Laser thickness", "Published laser limit for " + m.label.toLowerCase() + ": " + m.laser + " mm. Add your thickness to check it."]);
        }
        if (s.len && s.wid) {
          var bed = DATA.bed, ok = (s.len <= bed[0] && s.wid <= bed[1]) || (s.len <= bed[1] && s.wid <= bed[0]);
          list.push([ok ? "ok" : "warn", "Laser sheet size", ok ? s.len + " × " + s.wid + " mm fits the published laser working range of " + fmt(bed[0]) + " × " + fmt(bed[1]) + " mm." : s.len + " × " + s.wid + " mm is larger than the published laser working range of " + fmt(bed[0]) + " × " + fmt(bed[1]) + " mm. Ask Metco."]);
        }
      }
      var paintOn = s.procs.indexOf("powder-coating") > -1 || s.fin === "powder";
      if (paintOn && mode === "full") {
        var dims = [s.len, s.wid, s.hgt].filter(Boolean);
        if (dims.length >= 2) {
          var P = DATA.paint, srt = dims.slice().sort(function (x, y) { return y - x; });
          var pok = srt[0] <= P.length && srt[1] <= P.height && (srt.length < 3 || srt[2] <= P.width);
          list.push([pok ? "ok" : "warn", "Powder coating size", pok ? "Inside the published paint line envelope (" + fmt(P.length) + " long, " + fmt(P.height) + " high, " + P.width + " wide, mm)." : "Outside the published paint line envelope (" + fmt(P.length) + " × " + fmt(P.height) + " × " + P.width + " mm). Ask Metco."]);
        }
      }
      if (mode === "full" && s.procs.indexOf("cnc-milling") > -1) {
        var d3 = [s.len, s.wid, s.hgt].filter(Boolean);
        if (d3.length === 3) {
          var fits = DATA.mills.filter(function (mm) {
            if (s.kg && mm.kg && s.kg > mm.kg) return false;
            return mm.kind === "box" ? fitsBox(d3, mm.box) : fitsCyl(d3, mm.dia, mm.len);
          }).map(function (mm) { return mm.name; });
          list.push([fits.length ? "ok" : "warn", "CNC milling size", fits.length ? "Fits the published machining volume of: " + fits.join(", ") + "." : "Larger than the published machining volumes of Metco's mills. Ask Metco."]);
        } else if (d3.length) {
          list.push(["info", "CNC milling size", "Add length, width and height to check the part against the four mills."]);
        }
      }
      return list;
    }
    function ready(s) {
      var q = s.qty || s.qtyn;
      var fileReady = s.files.length > 0;
      var items = [
        mode === "full" ? s.procs.length > 0 : true,
        !!s.mat && s.thick > 0,
        !!q,
        fileReady,
        !!s.fin,
        !!(s.when || s.where),
        !!(s.name && (s.phone || s.email))
      ];
      return items;
    }
    function describeQty(s) {
      if (s.qtyn) return fmt(s.qtyn) + (s.qty === "repeat" ? " (repeat orders)" : "");
      return s.qty ? qtyName[s.qty] : "";
    }
    function dateNice(v) { if (!v) return ""; var p = v.split("-"); if (p.length !== 3) return v; var mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; return parseInt(p[2], 10) + " " + mo[parseInt(p[1], 10) - 1] + " " + p[0]; }
    function compose(s, list) {
      var L = [], pr = s.procs.map(function (p) { return procName[p]; });
      var m = matById[s.mat];
      var subj = "Quote request" + (pr.length ? ": " + pr.join(", ").toLowerCase() : "") + (m ? ", " + (s.thick ? s.thick + " mm " : "") + m.label.toLowerCase() : "") + (describeQty(s) ? ", " + describeQty(s).toLowerCase() : "");
      L.push("Hello Metco team,", "", "I would like a quote for the job below.", "");
      if (pr.length) L.push("Processes: " + pr.join("; "));
      if (m) L.push("Material: " + m.label + (s.thick ? ", " + s.thick + " mm" : ""));
      var dims = [];
      if (s.len) dims.push(fmt(s.len)); if (s.wid) dims.push(fmt(s.wid)); if (s.hgt) dims.push(fmt(s.hgt));
      if (dims.length) L.push("Part size (approx.): " + dims.join(" x ") + " mm" + (s.kg ? ", " + s.kg + " kg each" : ""));
      else if (s.kg) L.push("Weight (approx.): " + s.kg + " kg each");
      if (describeQty(s)) L.push("Quantity: " + describeQty(s));
      if (s.fin) L.push("Finish: " + finName[s.fin] + (s.colour && s.fin === "powder" ? " (colour: " + s.colour + ")" : ""));
      if (s.files.length) L.push("Files: " + s.files.map(function (f) { return fileName[f]; }).join("; "));
      if (s.when) L.push("Needed by: " + dateNice(s.when));
      if (s.where) L.push("Deliver to: " + s.where);
      if (s.notes) L.push("", "Notes: " + s.notes);
      if (list.length) { L.push("", "Checked against Metco's published limits (indicative):"); list.forEach(function (c) { L.push("- " + c[1] + ": " + c[2]); }); }
      L.push("", "Please reply to:");
      L.push((s.name || "[your name]") + (s.org ? ", " + s.org : ""));
      if (s.phone) L.push("Phone: " + s.phone);
      if (s.email) L.push("Email: " + s.email);
      L.push("", "(I will attach my drawings or files to this email.)", "", "Thank you");
      return { subject: subj, body: L.join("\n") };
    }
    var lastBrief = "";
    function render() {
      var s = get(), list = checks(s);
      if (out.checks) {
        if (!list.length) out.checks.innerHTML = '<p class="checks__empty">' + (mode === "mini" ? "Pick a material and a thickness to see how it sits against Metco's published laser limits." : "Add a material, thickness and part size to see the check against Metco's published limits.") + "</p>";
        else out.checks.innerHTML = list.map(function (c) { return '<div class="chk chk--' + c[0] + '">' + ICON[c[0]] + "<div><b>" + c[1] + "</b><span>" + c[2] + "</span></div></div>"; }).join("");
      }
      if (mode === "full") {
        var r = ready(s), n = r.filter(Boolean).length;
        out.count.forEach(function (c) { c.textContent = n; });
        if (out.meter) out.meter.innerHTML = DATA.ready.map(function (l, i) { return '<li class="' + (r[i] ? "is-done" : "") + '">' + l + "</li>"; }).join("");
        var c = compose(s, list); lastBrief = c.body;
        if (out.text) out.text.textContent = "Subject: " + c.subject + "\n\n" + c.body;
        var href = "mailto:" + DATA.mail + "?subject=" + encodeURIComponent(c.subject) + "&body=" + encodeURIComponent(c.body.replace(/\n/g, "\r\n"));
        out.mail.forEach(function (a) { a.setAttribute("href", href); });
      } else if (out.cont) {
        var q = [];
        if (s.mat) q.push("m=" + encodeURIComponent(s.mat)); if (s.thick) q.push("t=" + s.thick); if (s.len) q.push("l=" + s.len); if (s.wid) q.push("w=" + s.wid);
        q.push("p=laser-cutting");
        var base = out.cont.getAttribute("data-base") || out.cont.getAttribute("href").split("?")[0];
        out.cont.setAttribute("data-base", base);
        out.cont.setAttribute("href", base + "?" + q.join("&") + "#builder");
      }
    }
    function toggleColour() { var row = $("[data-colour]", form); if (row) row.hidden = radio("fin") !== "powder"; }
    form.addEventListener("input", function () { toggleColour(); render(); });
    form.addEventListener("change", function () { toggleColour(); render(); });
    /* prefill from the URL (links from capability pages and the home check) */
    safe(function () {
      var p = new URLSearchParams(location.search), set = function (n, v) { var el = form.elements[n]; if (el && v) el.value = v; };
      if (mode === "full") {
        (p.get("p") || "").split(",").forEach(function (id) { var el = $('input[name="proc"][value="' + id + '"]', form); if (el) el.checked = true; });
        var mm = p.get("m"); if (mm) { var r = $('input[name="mat"][value="' + mm + '"]', form); if (r) r.checked = true; }
      } else set("mat", p.get("m"));
      set("thick", p.get("t")); set("len", p.get("l")); set("wid", p.get("w"));
    });
    toggleColour(); render();
    if (out.copy) out.copy.addEventListener("click", function () {
      var s = get(), c = compose(s, checks(s)), t = "Subject: " + c.subject + "\n\n" + c.body;
      function done(ok) { if (out.status) { out.status.textContent = ok ? "Brief copied. Paste it into an email to " + DATA.mail + "." : "Copy was blocked. Select the text in the box and copy it."; } }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); });
      else { var ta = d.createElement("textarea"); ta.value = t; d.body.appendChild(ta); ta.select(); var ok = false; try { ok = d.execCommand("copy"); } catch (e) {} d.body.removeChild(ta); done(ok); }
    });
  }
})();
