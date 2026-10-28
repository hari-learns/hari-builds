/* SEP India concept: menu, concept dock, scroll reveals, the part check ("Can SEP make my part?") and the contact mailto. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sep-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sep-dock", "1"); }); });

  /* menu */
  var burger = $("#burger"), drawer = $("#drawer"), burgerX = $("#burger-x");
  function setMenu(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setMenu(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setMenu(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && drawer && drawer.classList.contains("open")) setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1120 && drawer && drawer.classList.contains("open")) setMenu(false); });
  if (drawer) { drawer.setAttribute("inert", ""); var mo = new MutationObserver(function () { if (drawer.classList.contains("open")) drawer.removeAttribute("inert"); else drawer.setAttribute("inert", ""); }); mo.observe(drawer, { attributes: true, attributeFilter: ["class"] }); }

  /* reveals */
  var rv = $$(".rv");
  rv.forEach(function (el) {
    var sibs = $$(".rv", el.parentElement).filter(function (x) { return x.parentElement === el.parentElement; });
    el.style.setProperty("--d", (Math.min(sibs.indexOf(el), 5) * 0.07).toFixed(2) + "s");
  });
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  }
  requestAnimationFrame(function () { document.documentElement.classList.add("ready"); });

  /* home teaser -> tool page with the two answers */
  var teaser = $("[data-teaser]");
  if (teaser) teaser.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = $("input[name=tf]:checked", teaser), m = $("input[name=tm]:checked", teaser);
    location.href = teaser.getAttribute("action") + "?f=" + encodeURIComponent(f ? f.value : "bar") + "&m=" + encodeURIComponent(m ? m.value : "ss") + "#result";
  });

  /* contact form -> mailto */
  var ef = $("[data-eform]");
  if (ef) {
    var mailBtn = $("[data-mail]", ef);
    var upd = function () {
      var g = function (n) { return (ef.elements[n] && ef.elements[n].value || "").trim(); };
      var body = "Hello SEP India team,\n\n" + g("m") + "\n\nName: " + g("n") + "\nCompany: " + g("c") + "\nContact number: " + g("ph") + "\n";
      mailBtn.href = "mailto:" + mailBtn.getAttribute("data-to") + "?subject=" + encodeURIComponent("Enquiry from " + (g("n") || "website visitor")) + "&body=" + encodeURIComponent(body);
    };
    ef.addEventListener("input", upd); upd();
  }

  /* the part check */
  var root = $("[data-tool]");
  if (!root) return;
  var D = JSON.parse($("#tool-data").textContent), T = D.tool, MACH = {};
  D.machines.forEach(function (m) { MACH[m.id] = m; });
  var MAXN = Math.max.apply(null, D.machines.map(function (m) { return m.n; }));
  var form = $("form", root), kgEl = $("[data-kg]", root), qtyEl = $("[data-qty]", root), verdictEl = $("[data-verdict]", root), routeEl = $("[data-route]", root), msgEl = $("[data-msg]", root), mailEl = $("[data-mail]", root), copyEl = $("[data-copy]", root), copiedEl = $("[data-copied]", root);
  var dirty = false;
  var label = function (list, k) { for (var i = 0; i < list.length; i++) if (list[i][0] === k) return list[i][1]; return k; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var val = function (n) { var x = $("input[name=" + n + "]:checked", form); return x ? x.value : ""; };
  var many = function (n) { return $$("input[name=" + n + "]:checked", form).map(function (x) { return x.value; }); };
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg>',
    idle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>'
  };

  function read() {
    return { form: val("form"), mat: val("mat"), kg: parseFloat(String(kgEl.value).replace(",", ".")), ops: many("ops"), treat: many("treat"), vol: val("vol"), std: val("std"), qty: qtyEl.value.trim() };
  }

  function compute(s) {
    var warns = [], bad = [], rows = {}, order = [], partner = [], incoming = null;
    // in-house operations, merged when they share the same machines (e.g. spline + knurl rolling)
    T.ops.forEach(function (op) {
      if (s.ops.indexOf(op[0]) < 0) return;
      var key = op[2].join("+") || ("none-" + op[0]);
      if (!rows[key]) { rows[key] = { labels: [], ids: op[2] }; order.push(key); }
      rows[key].labels.push(op[1]);
    });
    var inRows = order.map(function (k) {
      var r = rows[k], n = r.ids.reduce(function (a, id) { return a + MACH[id].n; }, 0);
      var detail = r.ids.map(function (id) { return MACH[id].n + " " + MACH[id].name.toLowerCase() + (MACH[id].note ? " (" + MACH[id].note.replace(/\.$/, "").toLowerCase() + ")" : ""); }).join("; ");
      return { label: r.labels.join(", "), n: n, detail: r.ids.length ? detail : "Listed among SEP's in-house capabilities (no machine count published)." };
    });
    if (s.form === "bar") incoming = "Bar stock from SEP's raw material suppliers (steel, brass, SS, aluminium and others). Incoming raw material gets 100% metallurgical testing on arrival.";
    if (s.form === "hot") partner.push(["Hot forging", "Made through SEP's vetted partners; SEP machines the forged part."]);
    if (s.form === "cold") partner.push(["Cold forging", "Made through SEP's vetted partners; SEP machines the forged part."]);
    if (s.form === "die") partner.push(["Aluminium die casting", "Made through SEP's vetted partners; SEP machines the casting."]);
    s.treat.forEach(function (t) {
      var l = label(T.treat, t), note = "Through SEP's vetted partners.";
      if (t === "ht") note = "Through SEP's vetted partners. SEP also has its own 45 kW induction hardening machine (through and case hardening).";
      partner.push([l, note]);
    });
    // checks
    if (isNaN(s.kg) || s.kg <= 0) warns.push("Add the weight of one finished part.");
    else if (s.kg > T.max_kg) bad.push("At " + s.kg + " kg the part is above the " + T.max_kg + " kg per unit that SEP states it machines. Ask the team before assuming it is out.");
    if (s.mat === "xx") warns.push("That material is not on SEP's published list (carbon steel, stainless steel, high cobalt / high chromium special steel, aluminium, brass and other non-ferrous metals). Ask the team.");
    if (s.form === "die" && ["al"].indexOf(s.mat) < 0 && s.mat !== "xx") warns.push("SEP's published die casting is aluminium. Confirm the casting route for this material.");
    if (s.vol === "proto") warns.push("Prototype first: SEP's new product flow goes feasibility, costing, prototype samples, pilot samples, then large scale production, with your feedback at each stage.");
    return { inRows: inRows, partner: partner, incoming: incoming, warns: warns, bad: bad };
  }

  function summary(s, r) {
    var L = [];
    L.push("Hello SEP India team,", "", "I would like a quotation for a machined part. Details from the part check on the redesign concept:", "");
    L.push("- Starting form: " + label(T.forms, s.form));
    L.push("- Material: " + label(T.materials, s.mat));
    L.push("- Weight of one finished part: " + (isNaN(s.kg) ? "(to add)" : s.kg + " kg"));
    L.push("- Operations: " + (s.ops.length ? s.ops.map(function (o) { return label(T.ops, o); }).join(", ") : "(to add)"));
    L.push("- After machining: " + (s.treat.length ? s.treat.map(function (o) { return label(T.treat, o); }).join(", ") : "none"));
    L.push("- Volume: " + label(T.volumes, s.vol));
    L.push("- Standard needed: " + label(T.stds, s.std));
    if (s.qty) L.push("- Yearly quantity: " + s.qty);
    L.push("", "I will send the drawing. Please tell me what else you need from my side.", "", "Name:", "Company:", "Phone:");
    return L.join("\n");
  }

  function render() {
    var s = read(), r = compute(s);
    var none = !s.ops.length && !s.treat.length;
    var st, head, sub;
    if (r.bad.length) { st = "bad"; head = "Outside the published range: ask SEP"; sub = r.bad[0]; }
    else if (none) { st = "idle"; head = "Choose the operations on your drawing"; sub = "The route on SEP's own machines appears here as you pick."; }
    else if (r.warns.length) { st = "warn"; head = "Mostly covered: confirm with the team"; sub = r.warns[0]; }
    else { st = "ok"; head = "Within SEP's published range"; sub = r.inRows.length + " operation group" + (r.inRows.length === 1 ? "" : "s") + " on SEP's own floor" + (r.partner.length ? ", " + r.partner.length + " through vetted partners." : "."); }
    verdictEl.className = "verdict " + st;
    verdictEl.innerHTML = ICON[st] + "<div><b>" + esc(head) + "</b><p>" + esc(sub) + "</p></div>";

    var h = "";
    if (r.inRows.length) {
      h += '<div class="route"><h3>On SEP\'s own floor</h3>';
      r.inRows.forEach(function (x) {
        h += '<div class="rrow"><div class="rrow__h"><span>' + esc(x.label) + '</span><span class="mono">' + (x.n ? x.n + (x.n === 1 ? " machine" : " machines") : "in-house") + '</span></div><p>' + esc(x.detail) + '</p>' + (x.n ? '<span class="meter"><i style="width:' + Math.min(100, x.n / MAXN * 100).toFixed(0) + '%"></i></span>' : "") + '</div>';
      });
      h += "</div>";
    }
    if (r.incoming || r.partner.length) {
      h += '<div class="route"><h3>Before and after the machines</h3>';
      if (r.incoming) h += '<div class="rrow"><div class="rrow__h"><span><span class="tag">Incoming</span>Raw material</span></div><p>' + esc(r.incoming) + '</p></div>';
      r.partner.forEach(function (p) { h += '<div class="rrow"><div class="rrow__h"><span><span class="tag">Partner</span>' + esc(p[0]) + '</span></div><p>' + esc(p[1]) + '</p></div>'; });
      h += "</div>";
    }
    var checks = r.bad.concat(r.warns);
    if (checks.length) h += '<div class="docs"><h3>To confirm with SEP</h3><ul class="ticks">' + checks.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    h += '<div class="docs"><h3>What happens after you send it</h3><ul class="ticks">' + D.rfq.map(function (x) { return "<li><b>" + esc(x[0]) + ":</b> " + esc(x[1]) + "</li>"; }).join("") + "</ul></div>";
    routeEl.innerHTML = h;

    if (!dirty) msgEl.value = summary(s, r);
    var subj = "Request for quotation: " + label(T.materials, s.mat).toLowerCase() + " part" + (isNaN(s.kg) ? "" : ", " + s.kg + " kg");
    mailEl.href = "mailto:" + T.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(msgEl.value);
  }

  form.addEventListener("input", function () { render(); });
  form.addEventListener("change", function () { render(); });
  msgEl.addEventListener("input", function () { dirty = true; var s = read(); mailEl.href = mailEl.href.split("&body=")[0] + "&body=" + encodeURIComponent(msgEl.value); });
  copyEl.addEventListener("click", function () {
    var done = function () { copiedEl.hidden = false; setTimeout(function () { copiedEl.hidden = true; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msgEl.value).then(done, function () { msgEl.select(); done(); });
    else { msgEl.select(); safe(function () { document.execCommand("copy"); }); done(); }
  });

  function setState(p) {
    var radio = function (n, v) { var x = $("input[name=" + n + "][value=" + v + "]", form); if (x) x.checked = true; };
    if (p.form) radio("form", p.form);
    if (p.mat) radio("mat", p.mat);
    if (p.vol) radio("vol", p.vol);
    if (p.std) radio("std", p.std);
    if (p.kg !== undefined) kgEl.value = p.kg;
    if (p.ops) $$("input[name=ops]", form).forEach(function (x) { x.checked = p.ops.indexOf(x.value) >= 0; });
    if (p.treat) $$("input[name=treat]", form).forEach(function (x) { x.checked = p.treat.indexOf(x.value) >= 0; });
    dirty = false; render();
  }
  $$("[data-preset]", root).forEach(function (b) { b.addEventListener("click", function () { setState(D.presets[+b.getAttribute("data-preset")]); }); });
  var q = {}; safe(function () { location.search.replace(/^\?/, "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) q[p[0]] = decodeURIComponent(p[1] || ""); }); });
  var start = {}; if (q.f) start.form = q.f; if (q.m) start.mat = q.m; if (q.k) start.kg = q.k;
  setState(start);
})();
