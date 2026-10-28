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
    if (open && burgerX) burgerX.focus(); else if (!open && burger && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); setEnq(false); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) { setDrawer(false); setEnq(false); } });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("aag-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("aag-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rvs.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("is-in"); }); }, 60);
  } else { rvs.forEach(function (el) { el.classList.add("is-in"); }); }

  /* open now (Doha time, hours as listed by Al Amodi; Fridays closed) */
  var days = { Sat: 1, Sun: 1, Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 0 };
  function dohaNow() {
    return safe(function () {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      return { day: o.weekday, min: (+o.hour % 24) * 60 + (+o.minute) };
    });
  }
  function t2m(s) { var a = s.split(":"); return (+a[0]) * 60 + (+a[1]); }
  function hhmm(m) { return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); }
  $$(".open").forEach(function (el) {
    var n = dohaNow(); if (!n) return;
    var sl = el.getAttribute("data-hours").split(",").map(function (x) { var p = x.split("-"); return [t2m(p[0]), t2m(p[1])]; });
    var open = null;
    if (days[n.day]) sl.forEach(function (s) { if (n.min >= s[0] && n.min < s[1]) open = s; });
    if (open) { el.className = "open is-open"; el.textContent = "Open now, closes " + hhmm(open[1]) + " (Doha time)"; return; }
    var next = null;
    if (days[n.day]) sl.forEach(function (s) { if (!next && n.min < s[0]) next = s; });
    el.className = "open is-closed";
    el.textContent = next ? "Closed now, opens " + hhmm(next[0]) + " (Doha time)" : "Closed now, opens Saturday-Thursday (Doha time)";
  });

  /* chip filters (brands, projects) */
  var bf = $("#bfilter"), bg = $("#bgrid");
  if (bf && bg) {
    $$("button", bf).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        $$("button", bf).forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        $$("li", bg).forEach(function (li) { var t = " " + (li.getAttribute("data-trades") || "") + " "; li.hidden = !(f === "all" || t.indexOf(" " + f + " ") > -1); });
      });
    });
  }

  /* video: load YouTube only on press */
  var vid = $("#vid");
  if (vid) vid.addEventListener("click", function () {
    var f = d.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + vid.getAttribute("data-id") + "?autoplay=1&rel=0";
    f.title = "Al Amodi Center walkthrough"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
    vid.parentNode.replaceChild(f, vid);
  });

  /* contact form -> mailto */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (id) { return (d.getElementById(id) || {}).value || ""; };
    var body = "Name: " + g("cn") + "\nPhone: " + g("cp") + "\nProject type: " + g("ck") + "\n\n" + g("cm");
    location.href = "mailto:" + cf.getAttribute("action").replace("mailto:", "") + "?subject=" + encodeURIComponent("Enquiry from the Al Amodi Group website") + "&body=" + encodeURIComponent(body);
  });

  /* ---------------- finder (signature tool) ---------------- */
  var fdata = $("#fdata"); if (!fdata) return;
  var D = JSON.parse(fdata.textContent);
  var R = D.rows.map(function (r, i) { return { id: i, trade: r[0], name: r[1], country: r[2], status: r[3], product: r[4], slug: r[5], logo: r[6], key: r[7] }; });
  var TS = {}; D.trades.forEach(function (t) { TS[t[0]] = { short: t[1], title: t[2] }; });
  var state = { q: "", trades: {}, route: "", country: "" }, basket = {};
  var fq = $("#fq"), froute = $("#froute"), fcountry = $("#fcountry"), fres = $("#fres"), fcount = $("#fcount");
  var enq = $("#enq"), elist = $("#elist"), eempty = $("#eempty"), ecount = $("#ecount"), ebar = $("#ebar"), eform = $("#eform");
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function sq(s) { return norm(s).replace(/ /g, ""); }
  var hay = R.map(function (r) { var t = TS[r.trade]; return norm([r.name, r.country, r.status, r.product, t.title].join(" ")); });
  var haySq = hay.map(function (h) { return h.replace(/ /g, ""); });
  var countries = []; R.forEach(function (r) { if (countries.indexOf(r.country) < 0) countries.push(r.country); }); countries.sort();
  countries.forEach(function (c) { var o = d.createElement("option"); o.textContent = c; fcountry.appendChild(o); });

  function match(r, i) {
    var tr = Object.keys(state.trades).filter(function (k) { return state.trades[k]; });
    if (tr.length && tr.indexOf(r.trade) < 0) return false;
    if (state.route && r.status !== state.route) return false;
    if (state.country && r.country !== state.country) return false;
    if (state.q) {
      var toks = norm(state.q).split(" ");
      for (var k = 0; k < toks.length; k++) {
        var t = toks[k]; if (!t) continue;
        var t2 = t.length > 3 ? t.replace(/s$/, "") : t;
        if (hay[i].indexOf(t2) < 0 && haySq[i].indexOf(t2) < 0) return false;
      }
    }
    return true;
  }
  function rowHtml(r) {
    var on = basket[r.id] ? "true" : "false";
    var lg = r.logo ? '<span class="ltile ltile--sm"><img src="' + D.img + r.logo + '" alt="' + esc(r.name) + ' logo" loading="lazy" width="240" height="160"></span>' : '<span class="ltile ltile--sm ltile--none" aria-hidden="true"></span>';
    var nm = r.slug ? '<a href="' + D.base + "/brands/" + r.slug + '/">' + esc(r.name) + "</a>" : esc(r.name);
    var cls = r.status === "Agent" ? "st--a" : r.status === "Manufacturer" ? "st--m" : r.status === "Distributor" ? "st--d" : "st--o";
    return '<li class="frow2">' + lg + '<div class="frow2__t"><b>' + nm + "</b><span>" + esc(r.product) + '</span></div><div class="frow2__m"><span class="src-c">' + esc(r.country) + ' <span class="st ' + cls + '">' + esc(r.status) + '</span></span>' +
      '<button class="add" type="button" data-id="' + r.id + '" aria-pressed="' + on + '">' + (basket[r.id] ? "Added" : "Add to enquiry") + "</button></div></li>";
  }
  function render() {
    var out = [], total = 0, groups = {};
    R.forEach(function (r, i) { if (match(r, i)) { (groups[r.trade] = groups[r.trade] || []).push(r); total++; } });
    D.trades.forEach(function (t) { var g = groups[t[0]]; if (!g) return; out.push('<section class="fgroup"><h2>' + esc(t[2]) + "<span>" + g.length + '</span></h2><ul>' + g.map(rowHtml).join("") + "</ul></section>"); });
    if (!total) out.push('<div class="fnone"><p><b>Nothing on the published list matches that.</b></p><p>The brand list on the website may not name it. Ask the sales team directly.</p><div class="btn-row"><a class="btn" href="tel:+97444822830">Call ' + esc(D.tel) + '</a><a class="btn btn--ghost btn--dark" href="mailto:' + D.mail + '?subject=' + encodeURIComponent("Product enquiry: " + state.q) + '">Email the question</a></div></div>');
    fres.innerHTML = out.join("");
    fcount.textContent = total + " of " + R.length + " listings" + (state.q || state.route || state.country || Object.keys(state.trades).some(function (k) { return state.trades[k]; }) ? " match" : "");
  }
  function mailBody() {
    var ids = Object.keys(basket), L = [];
    L.push("Enquiry from the Al Amodi Group website concept", "");
    L.push("Project: " + ($("#ep").value || "-"), "Project type: " + ($("#ek").value || "-"), "Name: " + ($("#ename").value || "-"), "Phone: " + ($("#etel").value || "-"), "");
    L.push("Brands / items requested:");
    ids.forEach(function (id) { var r = R[id]; L.push("- " + r.name + " (" + r.country + ", " + r.status + "): " + r.product + " [" + TS[r.trade].short + "]"); });
    if ($("#en").value) { L.push("", "Notes:", $("#en").value); }
    return L.join("\n");
  }
  function updateBasket() {
    var ids = Object.keys(basket), n = ids.length;
    ecount.textContent = "(" + n + ")"; if (ebar) ebar.textContent = n;
    eempty.hidden = n > 0; eform.style.display = n ? "" : "none";
    elist.innerHTML = ids.map(function (id) { var r = R[id]; return '<li><span>' + esc(r.name) + "<small>" + esc(r.product) + " · " + esc(TS[r.trade].short) + '</small></span><button type="button" data-rm="' + id + '" aria-label="Remove ' + esc(r.name) + ' (' + esc(TS[r.trade].short) + ')">&times;</button></li>'; }).join("");
    var m = $("#email");
    m.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent("Enquiry: " + n + " brand" + (n === 1 ? "" : "s") + (($("#ep").value) ? " for " + $("#ep").value : "")) + "&body=" + encodeURIComponent(mailBody());
    safe(function () { sessionStorage.setItem("aag-enq", JSON.stringify(ids)); });
  }
  function setEnq(open) {
    if (!enq) return;
    enq.classList.toggle("is-open", open);
    root.style.overflow = open && innerWidth < 1000 ? "hidden" : "";
  }
  fres.addEventListener("click", function (e) {
    var b = e.target.closest(".add"); if (!b) return;
    var id = b.getAttribute("data-id");
    if (basket[id]) delete basket[id]; else basket[id] = 1;
    b.setAttribute("aria-pressed", basket[id] ? "true" : "false"); b.textContent = basket[id] ? "Added" : "Add to enquiry";
    updateBasket();
  });
  elist.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; delete basket[b.getAttribute("data-rm")]; updateBasket(); render(); });
  $$("#ftrades .chip").forEach(function (c) {
    c.addEventListener("click", function () { var k = c.getAttribute("data-trade"); state.trades[k] = !state.trades[k]; c.setAttribute("aria-pressed", state.trades[k] ? "true" : "false"); render(); });
  });
  fq.addEventListener("input", function () { state.q = fq.value; render(); });
  froute.addEventListener("change", function () { state.route = froute.value; render(); });
  fcountry.addEventListener("change", function () { state.country = fcountry.value; render(); });
  ["ep", "ek", "en", "ename", "etel"].forEach(function (id) { $("#" + id).addEventListener("input", updateBasket); });
  $("#ecopy").addEventListener("click", function () {
    var t = mailBody(), b = $("#ecopy");
    var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy as text"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { window.prompt("Copy your enquiry:", t); });
    else window.prompt("Copy your enquiry:", t);
  });
  if (ebar) $("#enqbar").addEventListener("click", function () { setEnq(true); });
  $("#enq-x").addEventListener("click", function () { setEnq(false); });
  enq.addEventListener("click", function (e) { if (e.target === enq) setEnq(false); });

  /* initial state from the URL: ?trade=slug ?q=text ?add=brandkey */
  var sp = new URLSearchParams(location.search);
  var tp = sp.get("trade"); if (tp) tp.split(",").forEach(function (k) { if (TS[k]) { state.trades[k] = true; var c = $('#ftrades [data-trade="' + k + '"]'); if (c) c.setAttribute("aria-pressed", "true"); } });
  var qp = sp.get("q"); if (qp) { state.q = qp; fq.value = qp; }
  var ad = sp.get("add"); if (ad) R.forEach(function (r) { if (r.key === ad) basket[r.id] = 1; });
  if (ad && !tp && !qp) { var nm = R.filter(function (r) { return r.key === ad; })[0]; if (nm) { state.q = nm.name; fq.value = nm.name; } }
  updateBasket(); render();
})();
