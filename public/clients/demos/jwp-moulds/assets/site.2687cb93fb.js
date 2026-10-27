(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("jwp-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("jwp-dock", "1"); }); });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && document.activeElement === burgerX) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  if (window.matchMedia) { var mq = window.matchMedia("(min-width: 1000px)"); var cl = function () { if (mq.matches) setDrawer(false); }; if (mq.addEventListener) mq.addEventListener("change", cl); }

  /* reveals */
  var rvs = $$(".rv");
  function on(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { on(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else on(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.98) on(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(on);

  /* tooling story: sticky photo follows the step in view (desktop only; phones show each photo in its step) */
  var steps = $$(".story__step"), figs = $$(".story__d");
  if (steps.length && figs.length && "IntersectionObserver" in window) {
    var cur = -1;
    function show(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      figs.forEach(function (f, k) { f.classList.toggle("is-on", k === i); });
    }
    show(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) show(+en.target.getAttribute("data-i")); });
    }, { rootMargin: "-42% 0px -48% 0px" });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* map on tap */
  var mapBtn = $("#map-btn"), map = $("#map");
  if (mapBtn && map) mapBtn.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = map.getAttribute("data-src"); f.title = "Map: JWP Moulds, Braintree"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    map.appendChild(f); mapBtn.hidden = true;
  });

  /* contact form: opens the visitor's email app with the message written */
  var cf = $("#c-form");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var body = "Hello JWP,\n\n" + d("f-msg") + "\n\nName: " + d("f-name") + "\nContact: " + d("f-contact") + "\n";
    window.location.href = "mailto:" + (cf.getAttribute("action") || "").replace("mailto:", "") + "?subject=" + encodeURIComponent("Enquiry from the JWP Moulds website") + "&body=" + encodeURIComponent(body);
  });

  /* ---------- Plan my project ---------- */
  var dataEl = $("#tool-data"), form = $("#tool-form");
  if (dataEl && form) {
    var D = JSON.parse(dataEl.textContent), T = D.tool;
    var st = { start: null, needs: [], qty: null, steel: null, rush: null };
    var list = $("#rsteps"), empty = $("#tool-empty"), briefT = $("#brief-t"), briefMail = $("#brief-mail"), copyBtn = $("#brief-copy"), matEl = $("#material");
    var stepById = {}; T.steps.forEach(function (s) { stepById[s.id] = s; });

    function has(a, v) { return a.indexOf(v) > -1; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    /* returns {state: yes|opt|no|ask|neutral, text, why} for one step, using only JWP's own sentences */
    function plan(id) {
      var s = st.start, base = stepById[id].p, r = { state: "neutral", text: base, why: "" };
      var vert = has(st.needs, "insert") || has(st.needs, "over");
      if (id === "design") {
        if (s === "idea" || s === "cad") r.state = "yes";
        else if (s === "part") { r.state = "opt"; r.text = "Redesign machined parts for moulding. " + base; }
        else if (s === "tool") { r.state = "no"; r.why = "You already have a tool."; }
      } else if (id === "reverse") {
        if (s === "part") r.state = "yes"; else if (s) { r.state = "no"; r.why = "You are not copying an existing part."; }
      } else if (id === "proto") {
        if (s === "idea") r.state = "yes"; else if (s === "cad" || s === "part") r.state = "opt"; else if (s === "tool") { r.state = "no"; r.why = "You already have a tool."; }
      } else if (id === "tool") {
        if (s === "tool") { r.state = "no"; r.why = "You already have a tool."; }
        else {
          if (s) r.state = "yes";
          if (st.qty) r.text = T.qty_tool[st.qty] + " " + base;
          if (st.steel) r.text += " " + T.steel[st.steel];
        }
      } else if (id === "repair") {
        if (s === "tool") r.state = "yes"; else if (s) { r.state = "no"; r.why = "You need a new tool, not a repair."; }
      } else if (id === "t1") {
        if (s === "tool") { r.state = "no"; r.why = "Samples follow a new tool."; } else if (s) r.state = "yes";
        if (st.rush === "yes" && r.state !== "no") r.text = base + " " + "Time sensitive projects are our focus.";
      } else if (id === "mould") {
        if (s === "tool") { r.state = "ask"; r.text = T.own_tool_ask; }
        else {
          if (s) r.state = "yes";
          if (st.qty) r.text = T.qty_mould[st.qty];
          if (vert) r.text += " " + T.vertical;
          if (st.rush === "yes" && st.qty !== "batch") r.text += " We are ideally suited to medium or small batch work with a focus on time sensitive projects.";
        }
      } else if (id === "assy") {
        var a = has(st.needs, "assy"), j = has(st.needs, "jigs");
        if (a || j) { r.state = "yes"; } else if (s) { r.state = "no"; r.why = "You did not pick assembly or jigs and fixtures."; }
        if (a && !j) r.text = "Post mould assembly.";
        else if (j && !a) r.text = base;
      }
      return r;
    }

    var PILL = { yes: "In your route", opt: "Optional", no: "Not needed", ask: "Ask JWP" };
    function render(animate) {
      var any = !!st.start;
      empty.hidden = any;
      var out = $("#tool-out"); if (out) out.classList.toggle("is-empty", !any);
      var html = "", skip = "";
      T.steps.forEach(function (s) {
        var p = plan(s.id);
        var pill = p.state === "neutral" ? "" : '<span class="pill mono">' + PILL[p.state] + "</span>";
        var why = p.state === "no" && p.why ? '<p class="why">' + esc(p.why) + "</p>" : "";
        var sent = p.state === "no" ? "" : '<p class="sent">' + esc(p.text) + "</p>";
        var go = p.state === "no" ? "" : '<a class="go" href="' + D.base + "/" + s.link + '/">Read more</a>';
        var li = '<li class="rstep is-' + p.state + (animate ? " is-in" : "") + '"><h3>' + esc(s.t) + "</h3>" + pill + sent + why + go + "</li>";
        if (p.state === "no") skip += li; else html += li;
      });
      list.innerHTML = html;
      var sk = $("#rskip"), skh = $("#rskip-h");
      if (sk) sk.innerHTML = skip;
      if (skh) skh.hidden = !skip;
      var cnt = $("#tool-count"), n = T.steps.filter(function (s) { return plan(s.id).state === "yes"; }).length;
      if (cnt) cnt.textContent = any ? " (" + n + " steps)" : "";
      brief();
    }

    function brief() {
      var L = T.labels, lines = [T.mail_intro, ""];
      if (st.start) lines.push("Starting point: " + L.start[st.start]);
      if (st.needs.length) lines.push("Parts need: " + st.needs.map(function (n) { return L.needs[n]; }).join(", "));
      if (st.qty) lines.push("Quantity: " + L.qty[st.qty]);
      if (st.steel) lines.push("Tool material: " + L.steel[st.steel]);
      if (st.rush) lines.push("Timing: " + L.rush[st.rush]);
      var m = matEl ? matEl.value.trim() : ""; if (m) lines.push("Part material: " + m);
      if (lines.length === 2) lines.push("(Choose answers on the left and this text fills in.)");
      var route = T.steps.filter(function (s) { var x = plan(s.id).state; return x === "yes"; }).map(function (s) { return s.t; });
      if (st.start && route.length) { lines.push(""); lines.push("Steps I think apply: " + route.join(" > ")); }
      lines.push(""); lines.push(T.mail_outro.replace(/\n$/, ""));
      var txt = lines.join("\n");
      briefT.textContent = txt;
      var href = "mailto:" + D.email + "?subject=" + encodeURIComponent(T.mail_subject) + "&body=" + encodeURIComponent(txt);
      briefMail.href = href;
      var barMail = $('.bar a[href^="mailto:"]'); if (barMail) barMail.href = href;
      return txt;
    }

    function read() {
      st.start = (form.querySelector('input[name="start"]:checked') || {}).value || null;
      st.qty = (form.querySelector('input[name="qty"]:checked') || {}).value || null;
      st.steel = (form.querySelector('input[name="steel"]:checked') || {}).value || null;
      st.rush = (form.querySelector('input[name="rush"]:checked') || {}).value || null;
      st.needs = $$('input[name="needs"]:checked', form).map(function (i) { return i.value; });
    }
    form.addEventListener("change", function () { read(); render(false); });
    if (matEl) matEl.addEventListener("input", brief);
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var txt = briefT.textContent, done = function () { copyBtn.textContent = T.copied; setTimeout(function () { copyBtn.textContent = T.copy; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
      else { var r = document.createRange(); r.selectNodeContents(briefT); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); safe(function () { document.execCommand("copy"); }); done(); }
    });
    /* deep links from the home page and the moulding page: ?start=cad&qty=prod */
    var qs = new URLSearchParams(window.location.search);
    ["start", "qty", "steel", "rush", "needs"].forEach(function (k) {
      var v = qs.get(k); if (!v) return;
      v.split(",").forEach(function (one) {
        var el = form.querySelector('input[name="' + k + '"][value="' + one.replace(/[^a-z]/g, "") + '"]'); if (el) el.checked = true;
      });
    });
    var rf = $("#refine");
    if (rf && window.matchMedia && !window.matchMedia("(min-width: 1000px)").matches && !(qs.get("needs") || qs.get("qty") || qs.get("steel") || qs.get("rush"))) rf.open = false;
    if (rf && window.matchMedia) { var mqd = window.matchMedia("(min-width: 1000px)"); var oc = function () { if (mqd.matches) rf.open = true; }; if (mqd.addEventListener) mqd.addEventListener("change", oc); }
    read(); render(false);
  }
})();
