(function () {
  "use strict";
  var d = document, w = window;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function store(k, v) { try { if (v === undefined) return w.localStorage.getItem(k); w.localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---- concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && store("btm-dock") === "1") dock.hidden = true;
  if (dock && w.matchMedia("(max-width:899px)").matches) { var hd = function () { if (w.scrollY > 120) { dock.hidden = true; w.removeEventListener("scroll", hd); } }; w.addEventListener("scroll", hd, { passive: true }); }
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; store("btm-dock", "1"); });

  /* ---- drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function openDrawer() { drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); burger.setAttribute("aria-expanded", "true"); d.documentElement.style.overflow = "hidden"; if (bx) bx.focus(); }
  function closeDrawer() { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); burger.setAttribute("aria-expanded", "false"); d.documentElement.style.overflow = ""; burger.focus(); }
  if (drawer && burger) {
    burger.addEventListener("click", openDrawer);
    if (bx) bx.addEventListener("click", closeDrawer);
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer(); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { d.documentElement.style.overflow = ""; }); });
    w.matchMedia("(min-width:1100px)").addEventListener("change", function (m) { if (m.matches && drawer.classList.contains("is-open")) closeDrawer(); });
  }

  /* ---- header turns solid after the hero starts to scroll away */
  var hdr = $("#hdr");
  if (hdr && d.body.classList.contains("has-hero")) {
    var onS = function () { hdr.classList.toggle("is-solid", w.scrollY > 40); };
    w.addEventListener("scroll", onS, { passive: true }); onS();
  }

  /* ---- reveal on scroll: real content only; a sweep makes sure nothing stays hidden */
  var rv = $$(".rv");
  function show(el) { el.classList.add("in"); }
  if (!("IntersectionObserver" in w) || reduce) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) {
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty("--d", Math.min(sibs, 6) * 0.05 + "s");
      io.observe(el);
    });
    var sweep = function () { var vh = w.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---- size ladder buttons */
  var lad = $("#ladder");
  if (lad) {
    var step = function (dir) { lad.scrollBy({ left: dir * Math.max(240, lad.clientWidth * 0.8), behavior: reduce ? "auto" : "smooth" }); };
    var lp = $("#lad-prev"), ln = $("#lad-next");
    if (lp) lp.addEventListener("click", function () { step(-1); });
    if (ln) ln.addEventListener("click", function () { step(1); });
  }

  /* ---- projects: filter and sort */
  var pg = $("#p-grid");
  if (pg) {
    var cards = $$(".pcard", pg), fam = "all", cnt = $("#p-count");
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) { var f = (c.getAttribute("data-fams") || "").split(" "); var ok = fam === "all" || f.indexOf(fam) > -1; c.classList.toggle("is-hid", !ok); if (ok) n++; });
      if (cnt) cnt.textContent = n + (n === 1 ? " project" : " projects");
    };
    $$("#p-filters .chip").forEach(function (b) {
      b.addEventListener("click", function () { fam = b.getAttribute("data-fam"); $$("#p-filters .chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); apply(); });
    });
    var sel = $("#p-sort");
    if (sel) sel.addEventListener("change", function () {
      var v = sel.value;
      cards.sort(function (a, b) {
        var la = +a.getAttribute("data-l"), lb = +b.getAttribute("data-l");
        if (v === "new") return (b.getAttribute("data-d") || "").localeCompare(a.getAttribute("data-d") || "");
        if (v === "small") return (la || 1e12) - (lb || 1e12);
        return lb - la;
      });
      cards.forEach(function (c) { pg.appendChild(c); });
    });
  }

  /* ---- news: filter by year */
  var ng = $("#n-grid");
  if (ng) {
    var items = $$(".ncard", ng), nc = $("#n-count"), yr = "all", lim = 24, more = $("#n-more");
    var paint = function () {
      var n = 0, shown = 0;
      items.forEach(function (c) { var ok = yr === "all" || c.getAttribute("data-y") === yr; if (ok) n++; var vis = ok && shown < lim; if (vis) shown++; c.classList.toggle("is-hid", !vis); });
      if (nc) nc.textContent = n + (n === 1 ? " post" : " posts") + (n > shown ? ", showing " + shown : "");
      if (more) more.hidden = n <= shown;
    };
    if (more) more.addEventListener("click", function () { lim += 24; paint(); });
    paint();
    $$("#n-filters .chip").forEach(function (b) {
      b.addEventListener("click", function () {
        yr = b.getAttribute("data-y"); lim = 24;
        $$("#n-filters .chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        paint();
      });
    });
  }

  /* ---- contact form: opens the email app with the details filled in */
  var qf = $("#quote");
  if (qf && qf.getAttribute("data-mailto")) {
    qf.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = function (n) { var el = qf.elements[n]; return el ? el.value.trim() : ""; };
      var lines = ["Hello BTM,", "", "I would like a quote for a tank.", "", "What it will store: " + g("store"), "Volume (litres): " + g("litres"), "Site location: " + g("site"), "Notes: " + g("msg"), "", "Name: " + g("name"), "Phone: " + g("phone")];
      w.location.href = "mailto:" + qf.getAttribute("data-mailto") + "?subject=" + encodeURIComponent("Quote request: " + (g("store") || "tank") + (g("litres") ? ", " + g("litres") + " L" : "")) + "&body=" + encodeURIComponent(lines.join("\r\n"));
    });
  }

  /* ---- tank finder: reshuffles the company's own published sizes, standards and builds */
  var root = $("[data-finder]");
  if (root) {
    var D = JSON.parse($("#finder-data").textContent);
    var out = $("#f-out"), nIn = $("#f-litres"), rIn = $("#f-range"), lay = $("#f-layout"), mat = $("#f-mat");
    var touched = !!(w.location.search.indexOf("app=") > -1 || w.location.search.indexOf("l=") > -1);
    var S = { app: "dairy", L: 15000, needs: { cip: true }, layout: "", mat: "" };
    var appBy = {}, needBy = {};
    D.apps.forEach(function (a) { appBy[a.id] = a; });
    D.needs.forEach(function (n) { needBy[n.id] = n; });
    var famOrder = Object.keys(D.fams);
    var biggest = Math.max.apply(null, D.builds.map(function (b) { return b.litres || 0; }));
    var fmt = function (n) { return Number(n).toLocaleString("en-AU"); };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var toSlider = function (L) { var v = Math.log(Math.max(D.min, Math.min(D.max, L)) / D.min) / Math.log(D.max / D.min); return Math.round(v * 1000); };
    var fromSlider = function (v) {
      var L = D.min * Math.pow(D.max / D.min, v / 1000);
      var step = L < 1000 ? 10 : L < 10000 ? 100 : 500;
      return Math.max(1, Math.round(L / step) * step);
    };
    var q = new URLSearchParams(w.location.search);
    if (q.get("app") && appBy[q.get("app")]) S.app = q.get("app");
    if (q.get("l") && +q.get("l") > 0) S.L = Math.min(1000000, Math.round(+q.get("l")));
    if (q.get("need")) { S.needs = {}; q.get("need").split(",").forEach(function (n) { if (needBy[n]) S.needs[n] = true; }); }
    else if (q.get("app") || q.get("l")) { S.needs = {}; }

    function sync() {
      $$("[data-app]", root).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-app") === S.app ? "true" : "false"); });
      $$("[data-need]", root).forEach(function (b) { b.setAttribute("aria-pressed", S.needs[b.getAttribute("data-need")] ? "true" : "false"); });
      $$("[data-l]", root).forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-l") === S.L ? "true" : "false"); });
      if (d.activeElement !== nIn) nIn.value = S.L;
      if (d.activeElement !== rIn) rIn.value = toSlider(S.L);
      lay.value = S.layout; mat.value = S.mat;
    }

    function rank() {
      var a = appBy[S.app], sc = {};
      famOrder.forEach(function (f) { sc[f] = (a.fams[f] || 0); });
      Object.keys(S.needs).forEach(function (n) { var fs = needBy[n].fams; Object.keys(fs).forEach(function (f) { if (sc[f] !== undefined) sc[f] += fs[f]; }); });
      famOrder.forEach(function (f) { if (!D.fams[f].max && S.L > biggest) sc[f] -= 3; });
      var r = famOrder.slice().sort(function (x, y) { return sc[y] - sc[x] || famOrder.indexOf(x) - famOrder.indexOf(y); }).map(function (f) { return { id: f, s: sc[f] }; });
      /* if the best fit is published only up to a smaller size than asked, a close second that is published up to that size takes over */
      var t = D.fams[r[0].id];
      if (t.max && S.L > t.max) {
        for (var i = 1; i < r.length; i++) {
          var g = D.fams[r[i].id];
          if (g.max && S.L <= g.max && r[i].s >= r[0].s * 0.6) { var pick = r.splice(i, 1)[0]; r.unshift(pick); break; }
        }
      }
      return r;
    }

    function nearest(top) {
      var a = S.app, L = S.L, list = [];
      D.builds.forEach(function (b) {
        var s = 0;
        if (b.fams.indexOf(top) > -1) s += 3;
        if (b.apps.indexOf(a) > -1) s += 4;
        if (b.litres) { var r = Math.abs(Math.log(L / b.litres) / Math.LN10); s += 4 - Math.min(4, r * 4); }
        if (s >= 4.2) list.push({ b: b, s: s });
      });
      list.sort(function (x, y) { return y.s - x.s; });
      return list.slice(0, 3).map(function (x) { return x.b; });
    }

    function diff(b) {
      if (!b.litres) return "size not published";
      var p = (b.litres - S.L) / S.L * 100, ab = Math.abs(Math.round(p));
      var q = b.qty && b.qty > 1 ? b.qty + " built, " : "";
      if (ab <= 5) return q + "about the size you asked for";
      if (ab > 100) return q + fmt(b.litres) + " L, against your " + fmt(S.L) + " L";
      return q + ab + "% " + (p < 0 ? "smaller" : "larger") + " than yours";
    }

    function brief(top, r, info) {
      var a = appBy[S.app], f = D.fams[top];
      var needs = Object.keys(S.needs).map(function (n) { return needBy[n].label; });
      var lines = ["Hello Tony and team,", "", "I would like a quote for a tank. My brief from the tank finder:", "",
        "What it stores: " + a.label, "Volume: " + fmt(S.L) + " litres",
        "Must do: " + (needs.length ? needs.join(", ") : "nothing special"),
        "Layout: " + (S.layout ? S.layout : "either"),
        "Suggested type: " + f.name, "Suggested material: " + info.material,
        "Standards: " + a.std];
      if (info.near) lines.push("Closest BTM build: " + info.near);
      lines.push("", "My name:", "Phone:", "Site location:", "", "(Brief drafted by the tank finder, a redesign concept.)");
      return lines.join("\n");
    }

    function render() {
      sync();
      var a = appBy[S.app], L = S.L;
      if (!a || !(L > 0)) { out.innerHTML = '<div class="res-empty"><h3>Pick what goes in the tank</h3><p>You will see the tank type, the standards, the closest real builds and a ready-to-send brief.</p></div>'; return; }
      var rk = rank(), top = rk[0].id, f = D.fams[top];
      var also = rk.slice(1).filter(function (x) { return x.s >= Math.max(3, rk[0].s * 0.5); }).slice(0, 2);
      var near = nearest(top);
      var needsOn = Object.keys(S.needs);
      /* size verdict */
      var verdict, warn = false;
      if (f.max && L <= f.max) verdict = "<b>Size is inside the range BTM publishes:</b> " + esc(f.range) + ".";
      else if (f.max && L > f.max) { warn = true; verdict = "<b>" + fmt(L) + " L is above the published size:</b> " + esc(f.range) + ". BTM has built up to " + fmt(biggest) + " L, so ask the team before you rule it out."; }
      else verdict = "<b>No size limit is published for this type:</b> " + esc(f.range) + ".";
      /* material */
      var material = a.mat;
      if (S.mat === "stainless") material = "Stainless steel (your choice). BTM builds this type in stainless.";
      if (S.mat === "carbon") material = "Carbon or mild steel (your choice)." + (["dairy", "food", "beer", "pharma"].indexOf(S.app) > -1 ? " BTM's food, dairy, brewery and pharmaceutical builds are in stainless steel, so ask the team before choosing carbon steel." : "");
      var why = [a.note];
      needsOn.forEach(function (n) { why.push(needBy[n].add); });
      var lay2 = S.layout ? S.layout.charAt(0).toUpperCase() + S.layout.slice(1) : "Either";
      if (["storage", "fuel", "pressure"].indexOf(top) > -1 && S.layout) lay2 += " (BTM builds both layouts)";
      var spec = [["Tank type", f.name], ["Volume", fmt(L) + " L"], ["Material", material], ["Standards", a.std], ["Extras", needsOn.length ? needsOn.map(function (n) { return needBy[n].label; }).join(", ") : "None selected"], ["Layout", lay2]];
      var info = { material: material.split(".")[0], near: near[0] ? near[0].title + (near[0].litres ? " (" + fmt(near[0].litres) + " L)" : "") : "" };
      var text = brief(top, rk, info);
      var subject = "Tank enquiry: " + a.label + ", " + fmt(L) + " L";
      var href = "mailto:" + D.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text.replace(/\n/g, "\r\n"));
      var h = touched ? "" : '<p class="fine"><b>Example loaded</b> (dairy, 15,000 L, CIP). Change any answer on the left.</p>';
      h += '<div class="res-top"><span class="res-badge">Best fit</span><h3>' + esc(f.name) + '</h3><p>' + esc(f.pitch) + '</p></div>';
      h += '<div class="verdict' + (warn ? " verdict--warn" : "") + '">' + verdict + '</div>';
      h += '<div><h4>Why this one</h4><ul class="why">' + why.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
      h += '<div><h4>Spec to quote</h4><table class="spec"><tbody>' + spec.map(function (r) { return "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      if (also.length) {
        h += '<div><h4>Also worth asking about</h4><div class="alsos">' + also.map(function (x) { var g = D.fams[x.id]; return '<a class="also" href="' + g.url + '"><div><b>' + esc(g.name) + '</b><br><span>' + esc(g.pitch) + '</span></div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>'; }).join("") + "</div></div>";
      }
      if (near.length) {
        h += '<div><h4>Closest real builds</h4><div class="near">' + near.map(function (b) {
          return '<a href="' + b.url + '"><img src="' + b.img + '" alt="" width="84" height="84" loading="lazy"><div><b>' + (b.litres ? fmt(b.litres) + " L" : "Custom") + '</b><span>' + esc(b.title) + '</span><em>' + esc(diff(b)) + '</em></div></a>';
        }).join("") + "</div></div>";
      }
      h += '<div class="res-actions"><a class="btn" href="' + href + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>Email this brief to BTM</a>'
        + '<button class="btn btn--line" type="button" id="f-copy">Copy brief</button>'
        + '<a class="btn btn--line" href="' + D.tel + '">Call ' + esc(D.phone) + '</a></div>';
      h += '<p class="fine">Indicative guide from the sizes, standards and builds on the current BTM site. The team confirms every specification.</p>';
      out.innerHTML = h;
      var cp = $("#f-copy");
      if (cp) cp.addEventListener("click", function () {
        var done = function () { cp.textContent = "Copied"; setTimeout(function () { cp.textContent = "Copy brief"; }, 1800); };
        if (w.navigator.clipboard && w.navigator.clipboard.writeText) w.navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        else { fallbackCopy(text); done(); }
      });
    }
    function fallbackCopy(t) { var ta = d.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; d.body.appendChild(ta); ta.select(); try { d.execCommand("copy"); } catch (e) { } d.body.removeChild(ta); }

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.id !== "f-copy") touched = true;
      if (b.hasAttribute("data-app")) { S.app = b.getAttribute("data-app"); render(); }
      else if (b.hasAttribute("data-need")) { var n = b.getAttribute("data-need"); if (S.needs[n]) delete S.needs[n]; else S.needs[n] = true; render(); }
      else if (b.hasAttribute("data-l")) { S.L = +b.getAttribute("data-l"); render(); }
    });
    nIn.addEventListener("input", function () { touched = true; var v = Math.round(+nIn.value); if (v > 0) { S.L = Math.min(1000000, v); render(); } });
    nIn.addEventListener("blur", function () { nIn.value = S.L; });
    rIn.addEventListener("input", function () { touched = true; S.L = fromSlider(+rIn.value); render(); });
    ["change", "input"].forEach(function (ev) {
      lay.addEventListener(ev, function () { S.layout = lay.value; touched = true; render(); });
      mat.addEventListener(ev, function () { S.mat = mat.value; touched = true; render(); });
    });
    render();
  }
})();
