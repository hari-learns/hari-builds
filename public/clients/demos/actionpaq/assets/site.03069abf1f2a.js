(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var fmt = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("apq-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("apq-dock", "1"); }); });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(o) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", o); drawer.setAttribute("aria-hidden", o ? "false" : "true"); burger.setAttribute("aria-expanded", o ? "true" : "false");
    document.documentElement.style.overflow = o ? "hidden" : "";
    $$("a,button", drawer).forEach(function (el) { el.tabIndex = o ? 0 : -1; });
    if (o && burgerX) burgerX.focus(); else if (!o && burger && document.activeElement && drawer.contains(document.activeElement)) burger.focus();
  }
  if (drawer) {
    setDrawer(false);
    burger.addEventListener("click", function () { setDrawer(true); });
    burgerX.addEventListener("click", function () { setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1060) setDrawer(false); });
  }

  /* reveal + counters */
  var items = $$(".reveal");
  function show(el) { el.classList.add("is-in"); var c = $("[data-count]", el); if (c) count(c); }
  function count(el) {
    if (el.__done) return; el.__done = true;
    var to = +el.getAttribute("data-count"); if (reduce) { el.textContent = to.toLocaleString("en-US"); return; }
    var t0 = null, d = 1400;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / d), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString("en-US"); if (p < 1) requestAnimationFrame(step); }
    el.textContent = "0"; requestAnimationFrame(step);
  }
  if (reduce || !("IntersectionObserver" in window)) { items.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < window.innerHeight) show(el); }); }, 300);
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  /* ---------------------------------------------------------------- signature tool: Find my drive */
  var root = $("[data-finder]"); if (!root) return;
  var D = JSON.parse($("#finder-data").textContent);
  var panels = {}; $$("[data-panel]", root).forEach(function (p) { panels[p.getAttribute("data-panel")] = p; });
  var modeInputs = $$("input[name=mode]", root);
  var mailto = function (subject, lines) {
    var body = "Hello Actionpaq,\n\n" + lines.join("\n") + "\n\nSent from the Find my drive tool. Please confirm the fit and send a quote.";
    return "mailto:" + D.orders + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };
  var val = function (form, n) { var el = form.elements[n]; return el ? el.value : ""; };
  var checked = function (form, n) { var el = $("input[name=" + n + "]:checked", form); return el ? el.value : ""; };
  var gtrack = function (what) { safe(function () { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "find-" + what, title: "find " + what, event: true }); }); };

  /* A. replace a gearmotor */
  function renderReplace() {
    var p = panels.replace, f = $("form", p), out = $("[data-out=replace]", p), S = D.save;
    var mount = checked(f, "mount"), hp = checked(f, "hp"), ratio = +val(f, "ratio"), units = Math.max(1, Math.min(500, +val(f, "units") || 1)), price = +val(f, "price") || S.price, repl = f.elements.repl.checked;
    var fits = mount === "56c" && hp === "1", html = "", row = null;
    D.ratios.forEach(function (r) { if (r[0] === ratio) row = r; });
    if (fits) html += "<h3>SideDrive is the <span>drop-in</span> for your gearmotor.</h3><p>It bolts to the NEMA 56C pattern you already have (four 3/8-16 holes on a 5.875\" bolt circle) and takes a 1.25\" shaft in its hollow core. No gearbox, no oil, run from a standard VFD.</p>";
    else if (hp === "more") html += "<h3>Above SideDrive's 1 HP range: <span>a custom MagDrive</span>.</h3><p>SideDrive replaces a 1 HP motor and gearbox. For more power, One Motion engineers design a MagDrive configuration around your machine; a Powered Shaft with a hollow bore replaces a hollow-bore gearbox directly.</p>";
    else html += "<h3>Probably <span>SideDrive</span>, once we see the mount.</h3><p>SideDrive is built for a NEMA 56C face. Send us your current motor and gearbox and our engineers will confirm the fit, or design a MagDrive around your mount.</p>";
    if (row) {
      html += '<div class="meter"><div class="m-old"><span>1 HP AC motor peak torque at ' + row[0] + ':1</span><i><b data-w="' + (row[1] / 120 * 100) + '"></b></i><em>' + row[1] + " Nm / " + row[2] + ' ft-lb</em></div>' +
        '<div class="m-new"><span>SideDrive peak torque, at every ratio</span><i><b data-w="100"></b></i><em>120 Nm / 88.6 ft-lb</em></div></div>';
    } else html += '<p class="fine">SideDrive gives 120 Nm / 88.6 ft-lb peak at every ratio and replaces ratios from 6:1 to 30:1 and up. Ratio not listed? Our engineers will check it.</p>';
    var k = price / S.price, eo = S.energy_old * k, en = S.energy_new * k, mo = S.maint_old, ro = repl ? S.repl_old : 0;
    var to = eo + mo + ro, tn = en;
    html += '<table class="cost"><thead><tr><th></th><th>Motor + gearbox</th><th>SideDrive</th></tr></thead><tbody>' +
      '<tr><td>Energy, 3 years</td><td>' + fmt(eo) + "</td><td>" + fmt(en) + "</td></tr>" +
      "<tr><td>Routine maintenance</td><td>" + fmt(mo) + "</td><td>$0</td></tr>" +
      "<tr><td>Motor replacement</td><td>" + fmt(ro) + "</td><td>$0</td></tr>" +
      '<tr class="tot"><th>3-year saving, per unit</th><td></td><td>' + fmt(to - tn) + "</td></tr>" +
      (units > 1 ? '<tr class="tot"><th>For ' + units + " drives</th><td></td><td>" + fmt((to - tn) * units) + "</td></tr>" : "") + "</tbody></table>" +
      '<p class="fine">One Motion\'s published 3-year table per unit at $' + S.price.toFixed(2) + "/kWh against an average stainless 1 HP AC motor and gearbox (" + S.w_old + " W to " + S.w_new + " W measured on one drive). Energy is scaled to your price. Indicative only, not a quote.</p>";
    var subj = "SideDrive: replace my gearmotor (" + units + " units)";
    var lines = ["Product: SideDrive replacement for a gearmotor", "Motor mount: " + (mount === "56c" ? "NEMA 56C" : "other / not sure"), "Motor size: " + (hp === "1" ? "1 HP or less" : "more than 1 HP"), "Gearbox ratio: " + (ratio ? ratio + ":1" : "other / not sure"), "How many to hand: " + units, "Electricity price: $" + price.toFixed(2) + "/kWh", "Belt and speed: ", "Where it runs: ", "Your VFD: "];
    html += '<div class="btn-row"><a class="btn" data-m href="' + mailto(subj, lines) + '">Send these numbers to an engineer</a><a class="tlink" href="' + D.sidedrive + '">SideDrive specs</a></div>';
    out.innerHTML = html;
    $$("[data-w]", out).forEach(function (b) { var w = b.getAttribute("data-w"); if (reduce) b.style.width = w + "%"; else requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = w + "%"; }); }); });
  }

  /* B. size a powered pulley */
  function renderPulley() {
    var p = panels.pulley, f = $("form", p), out = $("[data-out=pulley]", p);
    var v = +val(f, "pull"), unit = val(f, "unit"), face = +val(f, "face") || 0, N = unit === "lb" ? v * 4.44822 : v;
    var fit = D.pulleys.filter(function (r) { return N >= r[2] && N <= r[3] && (!face || (face >= r[6] && face <= r[7])); });
    var pullOnly = D.pulleys.filter(function (r) { return N >= r[2] && N <= r[3]; });
    var html;
    if (!(v > 0)) html = "<h3>Enter the belt pull you need.</h3>";
    else if (fit.length) html = "<h3>" + fit.length + " PulleyDrive diameter" + (fit.length > 1 ? "s" : "") + " <span>cover " + Math.round(N) + " N</span>" + (face ? " at " + face + " mm" : "") + ".</h3><p>Ø" + fit.map(function (r) { return r[0]; }).join(", Ø") + " mm. The configurator lists every build that fits and which are in stock.</p>";
    else if (pullOnly.length) html = "<h3>Belt pull fits Ø" + pullOnly.map(function (r) { return r[0]; }).join(", Ø") + ", but <span>not at " + face + " mm</span>.</h3><p>Those sizes are built for other face widths. Our engineers can build it as a custom MagDrive configuration.</p>";
    else if (N > 1312) html = "<h3>Above the standard range: <span>a custom MagDrive</span>.</h3><p>The six standard PulleyDrive sizes go up to 1,312 N (295 lb). Tell us the load and our engineers will design the drive.</p>";
    else html = "<h3>Below the standard range: <span>ask an engineer</span>.</h3><p>The smallest standard PulleyDrive starts at 31 N (7 lb) of belt pull.</p>";
    html += '<div class="rtblw"><table class="rtbl"><thead><tr><th>Diameter</th><th>Belt pull</th><th>Face width</th><th></th></tr></thead><tbody>' + D.pulleys.map(function (r) {
      var ok = N >= r[2] && N <= r[3] && (!face || (face >= r[6] && face <= r[7])); var pOK = N >= r[2] && N <= r[3];
      return '<tr class="' + (ok ? "is-fit" : "") + '"><th scope="row">Ø' + r[0] + " mm</th><td>" + r[2] + "–" + r[3] + " N</td><td>" + r[6] + "–" + r[7] + ' mm</td><td><span class="tag' + (ok ? "" : " tag--no") + '">' + (ok ? "Fits" : (pOK && face ? "Width" : "No")) + "</span></td></tr>";
    }).join("") + "</tbody></table></div>";
    html += '<p class="fine">Ranges from One Motion\'s PulleyDrive product records. Indicative only: belt, shell and connection are chosen in the configurator.</p>';
    var lines = ["Product: PulleyDrive powered pulley", "Belt pull needed: " + (v || "") + " " + unit + (unit === "lb" ? " (" + Math.round(N) + " N)" : ""), "Face width: " + (face ? face + " mm" : ""), "Matching diameters: " + (fit.length ? "Ø" + fit.map(function (r) { return r[0]; }).join(", Ø") + " mm" : "to be sized"), "Belt (make and series): ", "Speed: ", "Your VFD: ", "How many to hand: "];
    html += '<div class="btn-row"><a class="btn" data-m href="' + mailto("PulleyDrive for my conveyor", lines) + '">Send these numbers to an engineer</a><a class="tlink" href="' + D.configurator + '" target="_blank" rel="noopener">Open the configurator</a></div>';
    out.innerHTML = html;
  }

  /* C. Mag-Smart system */
  function renderSystem() {
    var p = panels.system, f = $("form", p), out = $("[data-out=system]", p), t = checked(f, "task"), s = D.systems[t], rateBox = $("[data-rate]", p), rate = +val(f, "rate") || 0;
    rateBox.hidden = t !== "collation";
    var html = '<div class="rcard"><img src="' + s.img + '" width="' + s.w + '" height="' + s.h + '" alt="' + esc(s.alt) + '"><div><h3>Mag-Smart <span>' + esc(s.name.replace(/ systems$/i, "")) + "</span> fits this job.</h3><p>" + esc(s.line) + "</p></div></div>";
    html += "<p>" + D.feat.map(esc).join(" · ") + ".</p>";
    if (t === "collation") {
      if (rate > 0) html += '<p class="' + (rate <= 210 ? "ok" : "bad") + '"><b>' + (rate <= 210 ? "Within range." : "Above the published range.") + "</b> Mag-Smart collation is designed for index rates up to 210 RPM; you asked for " + rate + " RPM" + (rate <= 210 ? "." : ". Ask an engineer about your application.") + "</p>";
      else html += '<p class="fine">Mag-Smart collation handles product index rates up to 210 RPM.</p>';
    }
    var lines = ["System: Mag-Smart " + s.name, "Job: " + $("input[name=task]:checked", p).parentNode.querySelector("b").textContent, t === "collation" && rate ? "Index rate needed: " + rate + " RPM" : "Rate / product per minute: ", "Product and pack size: ", "Lanes in / out: ", "Where it runs (washdown?): ", "Your VFD: "];
    html += '<div class="btn-row"><a class="btn" data-m href="' + mailto("Mag-Smart " + s.name + " enquiry", lines) + '">Send these numbers to an engineer</a><a class="tlink" href="' + s.page + '">See the ' + esc(s.name.toLowerCase()) + " page</a></div>";
    out.innerHTML = html;
  }

  var R = { replace: renderReplace, pulley: renderPulley, system: renderSystem };
  function current() { var c = $("input[name=mode]:checked", root); return c ? c.value : "replace"; }
  function setMode(m, fromHash) {
    if (!panels[m]) m = "replace";
    modeInputs.forEach(function (i) { i.checked = i.value === m; });
    Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== m; });
    R[m]();
  }
  modeInputs.forEach(function (i) { i.addEventListener("change", function () { setMode(i.value); safe(function () { history.replaceState(null, "", "#" + i.value); }); }); });
  Object.keys(panels).forEach(function (k) {
    var f = $("form", panels[k]);
    f.addEventListener("input", function () { R[k](); }); f.addEventListener("change", function () { R[k](); });
  });
  root.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("[data-m]"); if (a) gtrack("send-" + current()); });
  var h = (location.hash || "").replace("#", ""); setMode(panels[h] ? h : "replace");
  window.addEventListener("hashchange", function () { var x = (location.hash || "").replace("#", ""); if (panels[x]) setMode(x); });
})();
