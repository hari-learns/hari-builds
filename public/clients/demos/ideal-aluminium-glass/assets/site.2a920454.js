(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* reveal on scroll */
  var items = $$("[data-reveal],.skyline");
  if (reduce || !("IntersectionObserver" in window)) { items.forEach(function (e) { e.classList.add("is-in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (e) { io.observe(e); });
    setTimeout(function () { items.forEach(function (e) { if (e.getBoundingClientRect().top < innerHeight) e.classList.add("is-in"); }); }, 60);
  }
  /* stagger the floors of each skyline stack */
  $$(".skyline .stk").forEach(function (stk, k) { $$(".stk__above .s", stk).forEach(function (s, i) { s.style.transitionDelay = (k * 90 + i * 22) + "ms"; }); });

  /* drawer */
  var dr = $("#drawer"), bg = $("#burger"), bx = $("#burger-x");
  function setDrawer(o) { if (!dr) return; dr.classList.toggle("is-open", o); dr.setAttribute("aria-hidden", o ? "false" : "true"); bg.setAttribute("aria-expanded", o); root.style.overflow = o ? "hidden" : ""; if (o && bx) bx.focus(); else if (bg) bg.focus({ preventScroll: true }); }
  if (bg) bg.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr && dr.classList.contains("is-open")) setDrawer(false); });
  if (dr) $$("a", dr).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  if (dr) { $$("a,button", dr).forEach(function (n) { n.setAttribute("tabindex", "-1"); }); var obs = new MutationObserver(function () { var o = dr.classList.contains("is-open"); $$("a,button", dr).forEach(function (n) { n.setAttribute("tabindex", o ? "0" : "-1"); }); }); obs.observe(dr, { attributes: true, attributeFilter: ["class"] }); }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) { }
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) { } });

  /* projects filter + search */
  var grid = $("#pgrid");
  if (grid) {
    var cards = $$(".pcard", grid), chips = $$(".chipb"), q = $("#psearch"), cnt = $("#pcount"), emp = $("#pempty"), cur = "all";
    var apply = function () {
      var t = (q.value || "").trim().toLowerCase(), n = 0;
      cards.forEach(function (c) { var ok = (cur === "all" || c.dataset.type === cur) && (!t || c.dataset.q.indexOf(t) > -1); c.hidden = !ok; if (ok) n++; });
      cnt.textContent = n + (n === 1 ? " project" : " projects"); emp.hidden = n > 0;
    };
    chips.forEach(function (b) { b.addEventListener("click", function () { cur = b.dataset.f; chips.forEach(function (x) { x.classList.toggle("is-on", x === b); }); apply(); }); });
    q.addEventListener("input", apply);
  }

  /* open now, Dubai time (UTC+4), Saturday to Thursday 8-17 */
  var on = $("#opennow");
  if (on) {
    var t = new Date(Date.now() + 4 * 3600 * 1000), day = t.getUTCDay(), h = t.getUTCHours() + t.getUTCMinutes() / 60;
    var open = day !== 5 && h >= 8 && h < 17;
    on.textContent = open ? "Open now (Dubai time)." : "Closed now (Dubai time). " + (day === 5 ? "Reopens Saturday at 8 AM." : "Opens at 8 AM, Saturday to Thursday.");
    if (!open) on.style.color = "inherit";
  }

  /* tender scope tool */
  $$("[data-tool]").forEach(function (root_) {
    var D = JSON.parse($(".tool-data", root_).textContent);
    var fl = $('input[name="floors"]', root_), typeIn = $('select[name="type"]', root_), pkgIn = $$('input[name$="-pkg"]', root_), stageIn = $$('input[name$="-stage"]', root_);
    var oMatch = $('[data-out="match"]', root_), oScope = $('[data-out="scope"]', root_), oStage = $('[data-out="stage"]', root_), oSent = $('[data-out="sent"]', root_);
    var bMail = $('[data-send="mail"]', root_), bWa = $('[data-send="wa"]', root_), bCopy = $('[data-send="copy"]', root_);
    var S = {}; D.services.forEach(function (s) { S[s.s] = s; });
    var GN = {}; Object.keys(D.groups).forEach(function (g) { GN[g] = D.groups[g]; });
    var TN = {}; D.types.forEach(function (t) { TN[t.k] = t.n; });
    var STN = {}; D.stages.forEach(function (s) { STN[s.k] = s; });

    // defaults / query
    var qs = new URLSearchParams(location.search), qp = qs.get("pkg"), qf = parseInt(qs.get("floors"), 10), qt = qs.get("type");
    var def = ["curtain-wall", "aluminium-doors", "sliding-windows", "handrails-staircase-balcony"];
    if (qp && S[qp]) def = [qp];
    pkgIn.forEach(function (i) { i.checked = def.indexOf(i.value) > -1; });
    if (qf > 0 && qf <= 60) fl.value = qf;
    typeIn.value = (qt && TN[qt]) ? qt : "residential";
    stageIn.forEach(function (i) { i.checked = i.value === "tender"; });

    function stack(cfgObj, label, name, you) {
      var segs = "";
      if (cfgObj.roof) segs += '<i class="s s--roof"></i>';
      for (var i = 0; i < cfgObj.f; i++) segs += '<i class="s s--f"></i>';
      for (var p = 0; p < (cfgObj.p || 0); p++) segs += '<i class="s s--p"></i>';
      segs += '<i class="s s--g"></i>';
      var base = ""; for (var b = 0; b < (cfgObj.b || 0); b++) base += '<i class="s s--b"></i>';
      return '<figure class="stk' + (you ? " you" : "") + '"><div class="stk__above" role="img" aria-label="' + esc(name) + '">' + segs + '</div><div class="stk__below" aria-hidden="true">' + base + '</div><figcaption><b>' + label + '</b><span>' + esc(name) + '</span></figcaption></figure>';
    }
    function parse(cfg) {
      var o = { b: 0, g: 0, p: 0, f: 0, roof: 0 };
      (cfg || "").split("+").forEach(function (t) { t = t.trim(); var m = /^(\d*)B$/.exec(t); if (m) o.b += parseInt(m[1] || "1", 10); else if (t === "G" || t === "GR") o.g++; else if (/^P\d*$/.test(t)) o.p++; else if (/^\d+$/.test(t)) o.f = parseInt(t, 10); else if (/^(r|roof)$/i.test(t)) o.roof = 1; });
      return o;
    }
    function state() {
      var f = parseInt(fl.value, 10); if (!(f > 0)) f = null; if (f > 60) f = 60;
      var ty = typeIn.value || "";
      var st = (stageIn.filter(function (i) { return i.checked; })[0] || {}).value || "tender";
      var pk = pkgIn.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      return { f: f, ty: ty, st: st, pk: pk };
    }
    function matches(s) {
      var all = D.projects.map(function (p) { return { t: p.t, cfg: p.cfg, f: p.f, ty: p.ty, u: p.u, im: p.im, c: p.c, m: p.m }; })
        .concat(D.recent.map(function (r) { return { t: r.t, cfg: r.cfg, f: r.f, ty: r.ty, u: "", im: "", c: r.cl ? "Client: " + r.cl : "", m: "Announced 2026", recent: true }; }));
      all.forEach(function (p) { p.score = Math.abs(p.f - s.f) + (s.ty ? (p.ty === s.ty ? -0.4 : 0.6) : 0); });
      all.sort(function (a, b) { return a.score - b.score; });
      return all.slice(0, 3);
    }
    function scopeText(s) {
      var g = {};
      s.pk.forEach(function (k) { (g[S[k].g] = g[S[k].g] || []).push(S[k].t); });
      return g;
    }
    var grpEls = $$("details.tgrp", root_);
    function groupCounts() {
      grpEls.forEach(function (g) {
        var on = $$("input:checked", g).map(function (i) { return i.nextElementSibling.textContent; });
        $("[data-count]", g).textContent = on.length ? on.length + " selected: " + on.join(", ") : "none selected";
      });
    }
    if (window.matchMedia && matchMedia("(min-width: 1000px)").matches) grpEls.forEach(function (g) { g.open = true; });
    else grpEls.forEach(function (g) { g.open = !!(qp && g.querySelector('input[value="' + qp + '"]')); });
    function render() {
      groupCounts();
      var s = state();
      // matches
      if (!s.f) { oMatch.innerHTML = '<p class="note">Enter the number of floors above ground to compare.</p>'; }
      else {
        var m = matches(s), cmp = '<div class="cmp">' + stack({ f: s.f, g: 1, p: 0, b: 0, roof: 1 }, s.f, "You", true);
        m.forEach(function (p, i) { var o = p.cfg ? parse(p.cfg) : { f: p.f, g: 1 }; cmp += stack(o, p.f, "#" + (i + 1), false); });
        cmp += "</div>";
        var html = cmp;
        m.forEach(function (p, i) {
          var diff = p.f === s.f ? "same height" : (Math.abs(p.f - s.f) + (Math.abs(p.f - s.f) === 1 ? " floor " : " floors ") + (p.f > s.f ? "taller" : "lower"));
          var inner = (p.im ? '<img src="' + esc(p.im) + '" alt="' + esc(p.t) + ' (image from Ideal)" width="96" height="72" loading="lazy">' : '<span class="noimg">+' + p.f + '</span>') +
            '<div><b>#' + (i + 1) + " " + esc(p.t) + '</b><span class="mono">' + esc(p.cfg || "") + " · " + diff + '</span><span>' + esc(p.recent ? [p.c, p.m].filter(Boolean).join(" · ") : [p.c ? "Consultant: " + p.c : "", p.m ? "Main contractor: " + p.m : ""].filter(Boolean).join(" · ")) + '</span></div>';
          html += p.u ? '<a class="mcard" href="' + esc(p.u) + '">' + inner + '</a>' : '<div class="mcard">' + inner + '</div>';
        });
        if (s.f > D.maxf) html += '<p class="note">The tallest building on Ideal\'s published lists is ' + esc(D.tallest) + ' (' + D.maxf + ' floors). For anything taller, ask Ideal directly.</p>';
        oMatch.innerHTML = html;
      }
      // scope
      var g = scopeText(s), out = "";
      Object.keys(D.groups).forEach(function (k) {
        if (!g[k]) return;
        var gi = D.groups[k];
        out += '<div class="scope-g"><h4>' + esc(gi.n) + '</h4><ul>' + g[k].map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          (gi.list.length ? "<p>" + esc(gi.sys) + ": " + esc(gi.list.join(", ")) + ".</p>" : "<p>" + esc(gi.sys) + ".</p>") + "</div>";
      });
      oScope.innerHTML = out || '<p class="note">Pick at least one package to build the scope.</p>';
      oStage.textContent = STN[s.st].d;
      // send
      var ok = s.f && s.pk.length;
      var lines = ["Hello " + D.who + ",", "", "I would like a price from Ideal Aluminium & Glass.", "",
        "Building: " + (s.ty ? TN[s.ty] : "type not set") + ", " + (s.f ? s.f + " floors above ground (G+" + s.f + ")" : "floors not set"),
        "Stage: " + STN[s.st].n, "", "Packages:"];
      Object.keys(D.groups).forEach(function (k) { if (g[k]) { lines.push(D.groups[k].n + ":"); g[k].forEach(function (t) { lines.push("- " + t); }); } });
      lines.push("", "Project name:", "Location:", "Consultant:", "Main contractor:", "Tender or delivery date:", "", "Drawings or BOQ are attached if I have them.", "", "Sent from the Ideal tender scope check (redesign concept).");
      var text = lines.join("\n"), subj = "Scope enquiry: " + (s.ty ? TN[s.ty] + " " : "") + (s.f ? "G+" + s.f : "") + ", " + s.pk.length + (s.pk.length === 1 ? " package" : " packages");
      bMail.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text);
      bWa.href = "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(subj + "\n\n" + text);
      [bMail, bWa, bCopy].forEach(function (b) { b.setAttribute("aria-disabled", ok ? "false" : "true"); });
      root_._text = text;
    }
    root_.addEventListener("input", render); root_.addEventListener("change", render);
    $$("[data-step]", root_).forEach(function (b) { b.addEventListener("click", function () { var v = (parseInt(fl.value, 10) || 0) + parseInt(b.dataset.step, 10); fl.value = Math.max(1, Math.min(60, v)); render(); }); });
    bCopy.addEventListener("click", function () {
      if (bCopy.getAttribute("aria-disabled") === "true") return;
      var done = function (ok) { oSent.textContent = ok ? "Scope copied. Paste it into any message." : "Could not copy. Select the text from the email button instead."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(root_._text).then(function () { done(true); }, function () { done(false); });
      else { var ta = d.createElement("textarea"); ta.value = root_._text; d.body.appendChild(ta); ta.select(); try { done(d.execCommand("copy")); } catch (e) { done(false); } d.body.removeChild(ta); }
    });
    [bMail, bWa].forEach(function (b) { b.addEventListener("click", function (e) { if (b.getAttribute("aria-disabled") === "true") e.preventDefault(); }); });
    render();
  });
})();
