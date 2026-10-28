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
  if (dock && safe(function () { return sessionStorage.getItem("lb-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("lb-dock", "1"); }); });

  /* reveals (also reveals anything already scrolled past) */
  var rvs = $$(".rv, .band");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) { rvs.forEach(activate); $$(".band").forEach(function (b) { b.classList.add("reduced"); }); }

  /* ---------- loom finder: reshuffles the published specifications, nothing else ---------- */
  var fEl = $("[data-finder]");
  if (fEl) (function () {
    var data = JSON.parse($("#finder-data").textContent), U = data.ui;
    var form = $("form", fEl), rows = $("[data-rows]", fEl), more = $("[data-more]", fEl), sum = $("[data-sum]", fEl);
    var waA = $("[data-wa]", fEl), mailA = $("[data-mail]", fEl), jf = $("[data-jfld]", fEl), jsel = $("#f-j"), wIn = $("#f-w"), wR = $("[data-wr]", fEl);
    var J = 999;
    function val(n) { var r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ""; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function state() {
      var w = parseInt(wIn.value, 10); if (!(w > 0)) w = 0;
      return { type: val("type"), width: w, cols: parseInt(val("cols"), 10), shed: val("shed"), yarn: val("yarn"), jsize: parseInt(jsel.value, 10) || 0 };
    }
    function evalMachine(m, s) {
      var why = [], q = [], fail = null, need = s.shed === "J" ? J : parseInt(s.shed, 10);
      if (s.type !== "any" && m.type !== s.type) return { fail: (m.type === "airjet" ? "An air jet loom" : "A rapier loom") + ", you asked for " + (s.type === "airjet" ? "air jet" : "rapier") };
      var ws = m.widths.filter(function (x) { return x >= s.width; });
      if (!ws.length) return { fail: m.wlabel + " tops out at " + Math.max.apply(null, m.widths) + " cm, you need " + s.width + " cm" };
      why.push(m.wlabel.charAt(0).toUpperCase() + m.wlabel.slice(1) + " " + ws[0] + " cm covers your " + s.width + " cm");
      if (s.cols > m.cols) return { fail: "Weft selection goes up to " + m.cols + " colours, you need " + s.cols };
      if (m.colsoft && s.cols > m.colsoft) q.push("Weft colours: " + m.colnote);
      else why.push(m.colnote + " (you need " + s.cols + ")");
      var opt = null;
      for (var i = 0; i < m.shed.length; i++) { var o = m.shed[i]; if (need === J ? o[0] === J : (o[0] !== J && o[0] >= need)) { opt = o; break; } }
      if (!opt) return { fail: need === J ? "No jacquard option on this machine" : "Shedding on this machine: " + m.shed.map(function (x) { return x[1]; }).join("; ") };
      why.push("Shedding: " + opt[1] + (m.shednote ? " (" + m.shednote + ")" : ""));
      if (need === J && s.jsize) {
        if (m.jsizes) {
          var js = m.jsizes.filter(function (x) { return x >= s.jsize; });
          if (!js.length) return { fail: "Largest Lifebond electronic jacquard here is " + Math.max.apply(null, m.jsizes) + ", you need " + s.jsize };
          why.push("Jacquard size " + js[0] + " available (sizes " + m.jsizes.join(", ") + ")");
        } else q.push("Jacquard sizes are not listed for this machine");
      }
      if (s.yarn !== "any") {
        var y = m.yarn[s.yarn];
        if (y === null) q.push("This yarn type is not listed for this machine");
        else if (/not listed/.test(y)) q.push(y);
        else why.push(y);
      }
      return { why: why, q: q };
    }
    function units(s) {
      var out = [], need = s.shed === "J" ? J : parseInt(s.shed, 10);
      if (need >= 13 && need <= 24 && s.type !== "airjet") { var u = data.units["cam-dobby"]; out.push({ u: u, why: ["Shedding unit with 16, 20 or 24 shafts, 220 rpm, 160 mm shed opening", "Covers your " + need + " shafts"], q: [] }); }
      if (need === J) {
        var w = data.units["wmt-conjugated-cam"], why = ["Electronic jacquard system, up to 600 RPM, for rapier, air jet, water jet and projectile looms"], q = [];
        if (s.jsize) {
          var ok = w.jsizes.filter(function (x) { return x >= s.jsize; });
          if (ok.length) why.push("Model WMT" + ok[0] + " covers a size of " + s.jsize); else q.push("Largest WMT model is WMT" + Math.max.apply(null, w.jsizes) + ", you need " + s.jsize);
        }
        out.push({ u: w, why: why, q: q });
      }
      return out;
    }
    function card(name, url, img, why, q, check) {
      var li = why.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + q.map(function (x) { return '<li class="q">' + esc(x) + "</li>"; }).join("");
      return '<article class="res' + (check ? " is-check" : "") + '"><img src="' + img + '" width="520" height="393" alt="" loading="lazy"><div class="res__t"><a href="' + url + '">' + esc(name) + '</a><span class="badge">' + esc(check ? U.check : U.fits) + "</span></div><ul>" + li + "</ul></article>";
    }
    function render() {
      var s = state(), fits = [], rej = [];
      jf.hidden = s.shed !== "J";
      data.machines.forEach(function (m) { var r = evalMachine(m, s); if (r.fail) rej.push({ m: m, why: r.fail }); else fits.push({ m: m, r: r }); });
      fits.sort(function (a, b) { return a.r.q.length - b.r.q.length; });
      var un = units(s), html = "";
      fits.forEach(function (f) { html += card(f.m.name, f.m.url, f.m.img, f.r.why, f.r.q, f.r.q.length > 0); });
      un.forEach(function (x) { html += card(x.u.name, x.u.url, x.u.img, x.why, x.q, x.q.length > 0); });
      rows.innerHTML = html || '<p class="nomatch">' + esc(U.none) + "</p>";
      more.innerHTML = rej.length ? '<details class="more"><summary>' + rej.length + " machines ruled out</summary><ul>" + rej.map(function (r) { return "<li><b>" + esc(r.m.name) + "</b>: " + esc(r.why) + "</li>"; }).join("") + "</ul></details>" : "";
      var n = fits.length + un.length;
      sum.textContent = n ? (fits.length + " of " + data.machines.length + " looms fit" + (un.length ? ", plus " + un.length + " shedding system" + (un.length > 1 ? "s" : "") : "")) : "Nothing in the published range matches";
      var spec = "Weft insertion: " + U.types[s.type] + "\nFabric width: " + s.width + " cm\nWeft colours: " + s.cols + "\nShedding: " + U.sheds[s.shed] + (s.shed === "J" && s.jsize ? " (size " + s.jsize + ")" : "") + "\nYarn: " + U.yarns[s.yarn];
      var names = fits.map(function (f) { return f.m.name; }).concat(un.map(function (x) { return x.u.name; }));
      var txt = "Hello Lifebond, I used the loom finder on your site.\n" + spec + (names.length ? "\nShortlist: " + names.join(", ") : "") + "\nPlease advise on the right machine.";
      waA.href = "https://wa.me/" + U.wa + "?text=" + encodeURIComponent(txt);
      mailA.href = "mailto:" + U.email + "?subject=" + encodeURIComponent("Loom enquiry from the finder") + "&body=" + encodeURIComponent(txt);
    }
    form.addEventListener("change", render);
    wIn.addEventListener("input", function () { wR.value = wIn.value; render(); });
    wR.addEventListener("input", function () { wIn.value = wR.value; render(); });
    $$("[data-preset]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = JSON.parse(b.getAttribute("data-preset"));
        ["type", "cols", "shed", "yarn"].forEach(function (k) { var r = form.querySelector('input[name="' + k + '"][value="' + p[k] + '"]'); if (r) r.checked = true; });
        wIn.value = p.width; wR.value = p.width; jsel.value = p.jsize ? String(p.jsize) : ""; render();
      });
    });
    render();
  })();

  /* contact: build WhatsApp / email links from the fields */
  var enq = $("#enq");
  if (enq) (function () {
    var cfg = JSON.parse($("#enq-data").textContent), wa = $("#enq-wa"), ml = $("#enq-mail");
    function upd() {
      var L = cfg.labels, t = "Hello Lifebond,\n";
      ["name", "company", "phone", "need"].forEach(function (k) { var v = ($("#" + k).value || "").trim(); if (v) t += L[k] + ": " + v + "\n"; });
      wa.href = "https://wa.me/" + cfg.wa + "?text=" + encodeURIComponent(t);
      ml.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("Enquiry from the website") + "&body=" + encodeURIComponent(t);
    }
    enq.addEventListener("input", upd); upd();
  })();
})();
