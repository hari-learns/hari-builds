(function () {
  "use strict";
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-ready");

  // ---- drawer
  var drawer = qs("#drawer"), burger = qs("#burger"), bx = qs("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && bx) bx.focus(); else if (!open && burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });
  if (drawer) qsa("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  window.addEventListener("resize", function () { if (innerWidth >= 1200 && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  // ---- dock
  var dock = qs("#dock"), dx = qs("#dock-x");
  try { if (sessionStorage.getItem("dockx")) dock && dock.classList.add("is-gone"); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-gone"); try { sessionStorage.setItem("dockx", "1"); } catch (e) {} });

  // ---- reveals (IntersectionObserver + scroll sweep that never strands content)
  var rv = qsa("[data-reveal],[data-hero]");
  function show(el) { el.classList.add("is-in"); }
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }
  var hero = qs("[data-hero]"); if (hero) requestAnimationFrame(function () { show(hero); });

  // ---- counter (their number, 60,000+)
  qsa("[data-count]").forEach(function (el) {
    var target = +el.getAttribute("data-count"), done = false;
    function run() {
      if (done) return; done = true;
      if (reduce) return;
      var t0 = performance.now(), dur = 1400;
      (function step(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString("en-GB") + (p >= 1 ? "+" : ""); if (p < 1) requestAnimationFrame(step); })(t0);
    }
    if ("IntersectionObserver" in window) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }).observe(el); }
  });

  // ---- sticky story: image follows the chapter in view (desktop only; phones show inline photos)
  qsa("[data-story]").forEach(function (st) {
    var chaps = qsa("[data-chap]", st), figs = qsa("[data-fig]", st);
    if (!chaps.length || !("IntersectionObserver" in window)) return;
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { var id = en.target.getAttribute("data-chap"); figs.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-fig") === id); }); }
      });
    }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
    chaps.forEach(function (c) { io2.observe(c); });
  });

  // ---- stock tables: tabs + search
  var panels = qsa("[data-panel]");
  if (panels.length) {
    var tabs = qsa("[data-tab]"), q = qs("[data-q]"), cnt = qs("[data-count]"), cur = null;
    var norm = function (s) { return (s || "").toLowerCase().replace(/[’”"]/g, "'"); };
    function openPanel(k) {
      cur = k;
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== k; });
      tabs.forEach(function (t) { t.classList.toggle("is-on", t.getAttribute("data-tab") === k); });
      filter();
    }
    function filter() {
      var p = panels.filter(function (x) { return x.getAttribute("data-panel") === cur; })[0]; if (!p) return;
      var term = norm(q && q.value).trim(), n = 0, rows = qsa("tbody tr", p);
      rows.forEach(function (r) { var hit = !term || norm(r.textContent).indexOf(term) > -1; r.hidden = !hit; if (hit) n++; });
      if (cnt) cnt.textContent = n + " of " + rows.length + " shown";
    }
    tabs.forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); history.replaceState(null, "", "#t-" + t.getAttribute("data-tab")); openPanel(t.getAttribute("data-tab")); }); });
    if (q) q.addEventListener("input", filter);
    var h = (location.hash || "").replace("#t-", ""); openPanel(panels.some(function (p) { return p.getAttribute("data-panel") === h; }) ? h : "main");
  }

  // ---- Find my sail
  var finders = qsa("[data-finder]");
  if (!finders.length) return;
  var DATA = null, loading = null;
  function load(src) {
    if (DATA) return Promise.resolve(DATA);
    if (!loading) loading = fetch(src).then(function (r) { return r.json(); }).then(function (d) { DATA = d; return d; });
    return loading;
  }
  var FT = 3.28084;
  function ftStr(x) { var f = Math.floor(x + 1e-9), i = Math.round((x - f) * 12); if (i === 12) { f++; i = 0; } return f + "' " + i + '"'; }
  finders.forEach(function (root) {
    var cfg = JSON.parse(qs("[data-finder-cfg]", root).textContent), U = cfg.ui, src = root.getAttribute("data-src");
    var el = function (f) { return qs('[data-f="' + f + '"]', root); };
    var out = qs("[data-results]", root), made = qs("[data-made]", root), note = qs("[data-src-note]", root);
    var sum = qs("[data-enq-sum]", root), mail = qs("[data-mail]", root), copy = qs("[data-copy]", root);
    var picks = {}, expanded = false;
    var radio = function (name) { var r = qs('input[name$="-' + name + '"]:checked', root); return r ? r.value : ""; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    function val(f) { var v = parseFloat(el(f).value); return isFinite(v) && v > 0 ? v : null; }
    function state() {
      var m = radio("unit") === "m", k = m ? FT : 1, sail = radio("sail");
      var s = { sail: sail, m: m, boat: el("boat").value, name: el("name").value.trim(), tol: parseFloat(el("tol").value) };
      var luff = val("luff"), foot = val("foot"), size = val("size"), blen = val("blen");
      s.luff = luff && luff * k; s.foot = foot && foot * k; s.size = size && size * k; s.blen = blen && blen * k;
      s.raw = { luff: luff, foot: foot, size: size, blen: blen };
      return s;
    }
    function single(sail) { return sail === "snuffer" || sail === "cover" || sail === "shade"; }
    function candidates(s) {
      var D = DATA, list = [];
      var add = function (rows, tag) { rows.forEach(function (r) { list.push({ r: r, tag: tag }); }); };
      if (s.sail === "main") { add(D.eco_main, "eco"); add(D.main, "stock"); }
      else if (s.sail === "head") { add(D.eco_head, "eco"); add(D.head, "stock"); }
      else add(D[s.sail] || [], "stock");
      return list;
    }
    function match(s) {
      var res = [];
      candidates(s).forEach(function (c) {
        var r = c.r, sc = 0, ok = true, any = false, d = {};
        if (single(s.sail)) {
          var it = s.sail === "shade" ? Math.max(r.a || 0, r.b || 0, r.cc || 0) : r.s;
          if (!s.size || !it) return;
          var rel = Math.abs(s.size - it) / it; any = true; if (rel > s.tol) ok = false; sc = rel; d.size = s.size - it;
        } else {
          if (s.luff && r.l) { var a = Math.abs(s.luff - r.l) / r.l; any = true; sc += a; d.luff = s.luff - r.l; if (a > s.tol) ok = false; }
          if (s.foot && r.f) { var b = Math.abs(s.foot - r.f) / r.f; any = true; sc += b; d.foot = s.foot - r.f; if (b > s.tol) ok = false; }
          if ((s.luff && !r.l) || (s.foot && !r.f && !s.luff)) ok = false;
        }
        if (ok && any) res.push({ r: r, tag: c.tag, sc: sc, d: d });
      });
      res.sort(function (x, y) { return x.sc - y.sc; });
      return res;
    }
    function dstr(v, m) { if (v == null) return ""; var x = m ? v / FT : v, u = m ? " m" : " ft"; return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(m ? 2 : 1) + u; }
    function dims(r, sail) {
      if (single(sail)) {
        if (sail === "shade") return [r.A || r.a, r.b, r.cc].filter(Boolean).map(function (x) { return typeof x === "number" ? ftStr(x) : x; }).join(" x ");
        return r.S || (r.s ? ftStr(r.s) : "");
      }
      var p = [];
      if (r.l) p.push("luff " + (r.L || ftStr(r.l)));
      if (r.e) p.push("leech " + (r.E || ftStr(r.e)));
      if (r.f) p.push("foot " + (r.F || ftStr(r.f)));
      return p.join(" · ");
    }
    function render() {
      var s = state(), two = root.querySelector('[data-dims="two"]'), one = root.querySelector('[data-dims="one"]');
      var sg = single(s.sail); two.hidden = sg; one.hidden = !sg;
      var lab = qs('label[for$="-size"]', root); if (lab) lab.textContent = s.sail === "shade" ? "Longest side" : (s.sail === "cover" ? "Size on the list" : "Length");
      note.textContent = U.list_note[s.sail] || "";
      var html = "", shown = [];
      var have = sg ? s.size : (s.luff || s.foot);
      if (!DATA) { out.innerHTML = '<p class="finder__empty">Loading the lists…</p>'; }
      else if (!have) { out.innerHTML = '<p class="finder__empty">' + esc(U.no_dims) + "</p>"; }
      else {
        var res = match(s), lim = expanded ? res.length : 6;
        if (!res.length) html = '<p class="finder__empty">' + esc(U.none) + "</p>";
        else {
          html = '<p class="finder__src">' + esc(U.shown.replace("{n}", res.length)) + "</p><ul class=\"res\">";
          res.slice(0, lim).forEach(function (x) {
            var r = x.r, d = x.d, tag = x.tag === "eco" ? U.eco : U.stock + (r.d ? ", " + r.d : "");
            var df = [];
            if (d.luff != null) df.push("luff " + dstr(d.luff, s.m)); if (d.foot != null) df.push("foot " + dstr(d.foot, s.m)); if (d.size != null) df.push("size " + dstr(d.size, s.m));
            var extra = x.tag === "eco" ? (r.z ? r.z + " oz cloth" : "") : (r.t || "");
            var on = picks[r.c] ? "true" : "false";
            html += '<li class="res__i"><div><span class="res__code">' + esc(r.c) + '</span><span class="res__tag">' + esc(tag) + "</span></div>" +
              '<button type="button" class="res__pick" data-pick="' + esc(r.c) + '" data-tag="' + esc(tag) + '" aria-pressed="' + on + '">' + esc(picks[r.c] ? U.picked : U.pick) + "</button>" +
              '<p class="res__dims">' + esc(dims(r, s.sail)) + "</p><p class=\"res__diff\">" + esc(df.join(", ")) + (extra ? " · " + esc(extra) : "") + "</p></li>";
          });
          html += "</ul>";
          if (res.length > 6) html += '<button type="button" class="link-btn" data-more>' + esc(expanded ? U.show_less : U.show_all.replace("{n}", res.length)) + "</button>";
          html += '<p class="res__note" style="margin-top:12px">' + esc(x_note(res[0].tag, res[0].r)) + " " + esc(U.indicative) + "</p>";
        }
        out.innerHTML = html;
      }
      // made to measure
      var slugs = (U.made_links[s.sail] || []).slice(), more = U.made_links_boat[s.boat] || [];
      if (s.sail === "main" || s.sail === "gaff") more.forEach(function (m) { if (slugs.indexOf(m) < 0) slugs.push(m); });
      var links = slugs.map(function (sl) { return '<a class="rlink" href="' + cfg.base + "/sails/" + sl + '/"><span>' + esc(cfg.products[sl]) + "</span></a>"; });
      if (U.made_extra[s.sail]) links.push('<a class="rlink" href="' + cfg.base + U.made_extra[s.sail][0] + '"><span>' + esc(U.made_extra[s.sail][1]) + "</span></a>");
      made.innerHTML = '<div class="made"><h4>' + esc(U.made_h) + "</h4><p>" + esc(U.made_p) + '</p><div class="rlinks">' + links.join("") + "</div></div>";
      compose(s);
    }
    function x_note(tag, r) { return tag === "eco" ? U.eco_note : U.stock_note.replace("{date}", r.d || "the date on the list"); }
    function compose(s) {
      var lines = ["Hello Jeckells,", "", "I would like a quote."];
      lines.push("Sail wanted: " + U.kind_label[s.sail]);
      lines.push("Boat type: " + s.boat);
      if (s.name) lines.push("Boat name or class: " + s.name);
      if (s.raw.blen) lines.push("Boat length: " + s.raw.blen + (s.m ? " m" : " ft"));
      if (single(s.sail)) { if (s.raw.size) lines.push("Size: " + s.raw.size + (s.m ? " m" : " ft")); }
      else { if (s.raw.luff) lines.push("Luff: " + s.raw.luff + (s.m ? " m" : " ft")); if (s.raw.foot) lines.push("Foot: " + s.raw.foot + (s.m ? " m" : " ft")); }
      var pk = Object.keys(picks); if (pk.length) lines.push("Sizes I looked at on the website: " + pk.map(function (c) { return c + " (" + picks[c] + ")"; }).join(", "));
      var yn = el("yn").value.trim(), yp = el("yp").value.trim(), yl = el("yl").value.trim();
      lines.push(""); if (yn) lines.push("Name: " + yn); if (yp) lines.push("Phone: " + yp); if (yl) lines.push("Boat location: " + yl);
      var body = lines.join("\n");
      sum.textContent = lines.slice(2).filter(Boolean).join("\n");
      mail.setAttribute("href", "mailto:" + cfg.email + "?subject=" + encodeURIComponent(U.subject) + "&body=" + encodeURIComponent(body));
      mail._body = body;
    }
    root.addEventListener("input", function (e) { if (e.target.matches("[data-f],input[type=radio]")) { expanded = false; render(); } });
    root.addEventListener("change", function (e) { if (e.target.matches("select,input[type=radio]")) { expanded = false; render(); } });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (b) { var c = b.getAttribute("data-pick"); if (picks[c]) delete picks[c]; else picks[c] = b.getAttribute("data-tag"); render(); return; }
      if (e.target.closest("[data-more]")) { expanded = !expanded; render(); }
      if (e.target.closest("[data-copy]")) { var t = mail._body || ""; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { var o = copy.textContent; copy.textContent = copy.getAttribute("data-done"); setTimeout(function () { copy.textContent = o; }, 1800); }, function () {}); }
    });
    // prefill from the address (?sail=head&luff=30&foot=14)
    var P = new URLSearchParams(location.search);
    if (P.get("sail")) { var r = qs('input[name$="-sail"][value="' + P.get("sail") + '"]', root); if (r) r.checked = true; }
    ["luff", "foot", "size"].forEach(function (k) { if (P.get(k)) el(k).value = P.get(k); });
    render();
    var started = false;
    function start() { if (started) return; started = true; load(src).then(render); }
    if ("IntersectionObserver" in window) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: "400px" }).observe(root); }
    else start();
    root.addEventListener("focusin", start, { once: true });
  });
})();
