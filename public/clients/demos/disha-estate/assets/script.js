/* Disha Estate concept: interactions. Every effect acts on the company's own listings; reduced motion gets the static site. */
(function () {
  "use strict";
  var d = document, h = d.documentElement, w = window;
  var D = w.DISHA || {};
  var RM = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  h.classList.remove("no-js");
  if (RM) h.classList.add("rm");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var fmt = function (n) { return Number(n).toLocaleString("en-IN"); };
  var ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.3 3 5 6.3 5c2 0 3.5 1 4.5 2.6h.4C12.2 6 13.7 5 15.7 5 19 5 20.9 8.3 19.5 11.7 17.5 16.4 12 21 12 21z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  /* ---------------------------------------------------------------- reveals, hero, counters */
  var io;
  if ("IntersectionObserver" in w && !RM) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".rv, .areas").forEach(function (el) { io.observe(el); });
  } else { $$(".rv, .areas").forEach(function (el) { el.classList.add("in"); }); }

  var hero = $(".hero-img img");
  if (hero && !RM) {
    w.requestAnimationFrame(function () { hero.style.setProperty("--sc", "1"); });
    var ticking = false;
    w.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      w.requestAnimationFrame(function () {
        var y = Math.min(w.scrollY, 900);
        hero.style.setProperty("--py", (y * 0.06) + "px");
        ticking = false;
      });
    }, { passive: true });
  }
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length, plain = el.hasAttribute("data-plain");
    if (RM || !("IntersectionObserver" in w)) return;
    var o2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o2.disconnect();
      var t0 = performance.now();
      (function step(t) {
        var p = Math.min(1, (t - t0) / 1100), v = to * (1 - Math.pow(1 - p, 3));
        el.textContent = plain ? Math.round(v) : (dec ? v.toFixed(dec) : fmt(Math.round(v)));
        if (p < 1) w.requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    o2.observe(el);
  });

  /* ---------------------------------------------------------------- header menu */
  var burger = $(".burger"), drawer = $("#drawer");
  if (burger && drawer) {
    var setMenu = function (open) {
      drawer.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      h.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("open")); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) { setMenu(false); burger.focus(); } });
    w.matchMedia("(min-width: 1021px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------------- data + shortlist state */
  var dataP = null;
  D.load = function () {
    if (!dataP) dataP = fetch(D.data).then(function (r) { return r.json(); }).then(function (j) {
      j.byId = {}; j.list.forEach(function (p) { j.byId[p.i] = p; p.feat = (p.ft || []).map(function (i) { return j.feats[i]; }); });
      return j;
    });
    return dataP;
  };
  var MAX = 6;
  var sl = [];
  try { sl = JSON.parse(store.get("disha_sl") || "[]"); } catch (e) { sl = []; }
  if (!Array.isArray(sl)) sl = [];
  var toastT;
  function toast(msg) {
    var t = $(".toast"); if (!t) { t = d.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); d.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2600);
  }
  function syncSL() {
    $$("[data-sl-n]").forEach(function (el) { el.textContent = sl.length; el.setAttribute("data-n", sl.length); });
    $$("[data-save]").forEach(function (b) {
      var on = sl.indexOf(b.getAttribute("data-save")) > -1;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      var lab = b.getAttribute("data-name") || "this property";
      b.setAttribute("aria-label", (on ? "Remove " : "Save ") + lab + (on ? " from shortlist" : " to shortlist"));
      var t = $(".st", b); if (t) t.textContent = on ? "Saved" : "Save to shortlist";
    });
  }
  function toggleSL(id) {
    var i = sl.indexOf(id);
    if (i > -1) { sl.splice(i, 1); toast("Removed from your shortlist"); }
    else { if (sl.length >= MAX) { toast("Your shortlist holds " + MAX + " properties. Remove one to add another."); return; } sl.push(id); toast("Saved to your shortlist (" + sl.length + ")"); }
    store.set("disha_sl", JSON.stringify(sl));
    syncSL();
    d.dispatchEvent(new CustomEvent("sl:change"));
  }
  d.addEventListener("click", function (e) {
    var b = e.target.closest("[data-save]"); if (b) { e.preventDefault(); toggleSL(b.getAttribute("data-save")); }
    var o = e.target.closest("[data-open-sl]"); if (o) { e.preventDefault(); openSL(); }
    var op = e.target.closest("[data-open]"); if (op) { e.preventDefault(); openDetail(op.getAttribute("data-open")); }
  });

  /* ---------------------------------------------------------------- helpers */
  function bhLabel(bh) {
    if (!bh || !bh.length) return "";
    var s = bh.map(function (x) { return x % 1 ? x : String(x); });
    return (s.length > 1 ? s.slice(0, -1).join(", ") + " & " + s[s.length - 1] : s[0]) + " BHK";
  }
  function sizeLabel(p) {
    if (!p.lo) return "";
    return (p.hi && p.hi !== p.lo ? fmt(p.lo) + "–" + fmt(p.hi) : fmt(p.lo)) + " sq ft";
  }
  function possLabel(p) {
    if (!p.ps) return "";
    return p.pk === "ready" ? "Ready to move" : "Possession " + p.ps.replace(/^\d+\s/, "").replace(/^([A-Za-z]{3})[a-z]*/, "$1");
  }
  function sbuLabel(t) {
    if (!t) return "";
    var n = (t.match(/\d[\d,]*/g) || []).map(function (x) { return parseInt(x.replace(/,/g, ""), 10); });
    if (!n.length) return t;
    return (n.length > 1 && n[0] !== n[1] ? fmt(n[0]) + "–" + fmt(n[1]) : fmt(n[0])) + " sq ft";
  }
  function typeLabel(p) { return p.k === "c" ? "Commercial" : "Residential"; }
  function waLink(text) { return "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(text); }
  function img(p, cls, sizes) {
    if (!p.im) return "";
    return '<img src="' + D.base + "/assets/img/" + p.im + '" width="' + p.iw + '" height="' + p.ih + '" alt="' + esc(p.n + ", " + p.a + ", Ahmedabad") + '" loading="lazy" decoding="async">';
  }
  function card(p, why) {
    var tags = '<span class="tags">' + (p.buy ? '<span class="tag">For buy</span>' : "") + (p.rent ? '<span class="tag tag--rent">For rent</span>' : "") + "</span>";
    var media = p.im ? img(p) : '<span class="card-noimg"><b>' + esc(p.a) + "</b><span>" + esc(p.k === "c" ? "Commercial" : bhLabel(p.bh) || "Residential") + "</span></span>";
    var f = [];
    if (p.k === "r" && p.bh.length) f.push(bhLabel(p.bh));
    if (p.lo) f.push(sizeLabel(p) + (p.k === "r" ? " carpet" : ""));
    var facts = f.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var pl = possLabel(p);
    return '<article class="card"><div class="card-media">' + media + tags +
      '<button type="button" class="save" data-save="' + p.i + '" data-name="' + esc(p.n) + '" aria-pressed="false" aria-label="Save ' + esc(p.n) + ' to shortlist">' + ICON.heart + "</button></div>" +
      '<div class="card-body"><h3><button type="button" data-open="' + p.i + '">' + esc(p.n) + "</button></h3>" +
      '<p class="loc">' + esc(p.a) + ", Ahmedabad</p>" + (facts ? '<ul class="facts">' + facts + "</ul>" : "") +
      (why ? '<div class="why">' + why + "</div>" : "") +
      '<div class="card-foot"><span>' + esc(pl) + "</span><b>Price on request</b></div></div></article>";
  }

  /* ---------------------------------------------------------------- dialogs */
  function dlg(id, title) {
    var el = $("#" + id);
    if (el) return el;
    el = d.createElement("dialog"); el.id = id; el.className = "dlg-panel"; el.setAttribute("aria-label", title);
    el.innerHTML = '<div class="dlg-head"><h2></h2><button type="button" class="x" aria-label="Close">' + ICON.x + '</button></div><div class="dlg-body"></div><div class="dlg-foot"></div>';
    d.body.appendChild(el);
    $(".x", el).addEventListener("click", function () { el.close(); });
    el.addEventListener("click", function (e) { if (e.target === el) el.close(); });
    el.addEventListener("close", function () { h.style.overflow = ""; });
    return el;
  }
  function show(el) {
    if (el.open) return;
    if (el.showModal) el.showModal(); else el.setAttribute("open", "");
    h.style.overflow = "hidden";
  }

  function openDetail(id) {
    D.load().then(function (j) {
      var p = j.byId[id]; if (!p) return;
      var el = dlg("dlg-detail", "Property details");
      $(".dlg-head h2", el).textContent = p.n;
      var gal = (p.g || []);
      var galHTML = gal.length ? '<div class="gal"><div class="gal-main"><img id="gal-img" src="' + D.base + "/assets/img/" + gal[0] + '" width="800" height="500" alt="' + esc(p.n + ", " + p.a) + '"></div>' +
        (gal.length > 1 ? '<div class="gal-th">' + gal.map(function (g, i) { return '<button type="button" data-g="' + g + '" aria-pressed="' + (i === 0) + '" aria-label="Photo ' + (i + 1) + ' of ' + gal.length + '"><img src="' + D.base + "/assets/img/" + g + '" width="76" height="56" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "") + "</div>" : "";
      var tags = '<div class="d-tags">' + (p.buy ? '<span class="tag">For buy</span>' : "") + (p.rent ? '<span class="tag tag--rent">For rent</span>' : "") + '<span class="tag">' + typeLabel(p) + "</span>" + (p.bh.length ? '<span class="tag">' + esc(bhLabel(p.bh)) + "</span>" : "") + "</div>";
      var spec = [["Property ID", p.ref], ["Area", p.a], p.bh.length ? ["Bedrooms", bhLabel(p.bh)] : null, p.lo ? [p.k === "r" ? "Carpet area" : "Size", sizeLabel(p)] : null,
        p.sbu ? ["Super built-up", sbuLabel(p.sbu)] : null, p.fl ? ["Total floors", p.fl] : null, p.ps ? ["Possession (as listed)", p.ps] : null]
        .filter(Boolean).map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
      var units = p.un && p.un.length ? '<h3 class="d-h">Unit types</h3><div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Super built-up</th><th>Possession</th></tr></thead><tbody>' +
        p.un.map(function (u) { return "<tr><td>" + esc(u[0]) + "</td><td>" + fmt(u[1]) + " sq ft</td><td>" + esc(u[2]) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "";
      var feats = p.feat && p.feat.length ? '<h3 class="d-h">Amenities</h3><ul class="feats">' + p.feat.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "";
      var ds = p.ds ? '<h3 class="d-h">About</h3><p>' + esc(p.ds.length > 420 ? p.ds.slice(0, 420).replace(/\s+\S*$/, "") + "…" : p.ds) + "</p>" : "";
      var links = '<p><a class="btn btn--line btn--sm" href="' + esc(p.url) + '" target="_blank" rel="noopener">Their current page ' + ICON.ext + "</a>" + (p.br ? ' <a class="btn btn--line btn--sm" href="' + esc(p.br) + '" target="_blank" rel="noopener">Brochure (PDF) ' + ICON.ext + "</a>" : "") + "</p>";
      $(".dlg-body", el).innerHTML = galHTML + tags + '<p class="d-loc">' + esc(p.ad || p.a + ", Ahmedabad") + '</p><span class="d-price">Price on request: ask Disha below</span><dl class="spec">' + spec + "</dl>" + ds + units + feats + '<p style="margin-top:22px"></p>' + links;
      var msg = "Hello Disha Estate, I am interested in " + p.n + " (" + p.ref + "), " + p.a + ". Please share the price and the best time to visit.";
      $(".dlg-foot", el).innerHTML = '<button type="button" class="btn btn--line" data-save="' + p.i + '" data-name="' + esc(p.n) + '" aria-pressed="false">' + ICON.heart.replace("<svg", '<svg style="fill:currentColor"') + ' <span class="st">Save to shortlist</span></button>' +
        '<a class="btn btn--ink" href="' + waLink(msg) + '" target="_blank" rel="noopener">' + ICON.wa + " Ask for price</a>" +
        '<a class="btn btn--red" href="tel:' + D.tel + '">' + ICON.call + " Call</a>";
      $$(".gal-th button", el).forEach(function (b) {
        b.addEventListener("click", function () { $("#gal-img", el).src = D.base + "/assets/img/" + b.getAttribute("data-g"); $$(".gal-th button", el).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
      });
      syncSL(); show(el); $(".dlg-body", el).scrollTop = 0;
    });
  }
  D.openDetail = openDetail;

  var NEED = store.get("disha_need") || "";
  function needLine() { return NEED; }
  function slMessage(list) {
    var lines = list.map(function (p, i) { return (i + 1) + ". " + p.n + " (" + p.ref + "), " + p.a + (p.bh.length ? ", " + bhLabel(p.bh) : "") + (p.lo ? ", " + sizeLabel(p) : ""); });
    return "Hello Disha Estate, I built this shortlist on your website:\n" + lines.join("\n") + (needLine() ? "\nWhat I am looking for: " + needLine() : "") + "\nPlease share the prices and the best time for site visits.";
  }
  function openSL() {
    D.load().then(function (j) {
      var el = dlg("dlg-sl", "Your shortlist");
      var list = sl.map(function (id) { return j.byId[id]; }).filter(Boolean);
      $(".dlg-head h2", el).textContent = "Your shortlist (" + list.length + ")";
      var body = $(".dlg-body", el), foot = $(".dlg-foot", el);
      if (!list.length) {
        body.innerHTML = '<div class="sl-empty"><p><b>Nothing saved yet.</b></p><p>Tap the heart on any property to add it. You can save up to ' + MAX + ", compare them side by side and send them to Disha in one message.</p></div>";
        foot.innerHTML = '<a class="btn btn--red" href="' + D.base + '/find/">Build a shortlist</a><a class="btn btn--line" href="' + D.base + '/properties/">Browse all properties</a>';
      } else {
        var items = list.map(function (p) {
          return '<li class="sl-item">' + (p.im ? '<img src="' + D.base + "/assets/img/" + p.im + '" width="72" height="54" alt="" loading="lazy">' : '<span class="ph-s"></span>') +
            '<div><b>' + esc(p.n) + "</b><small>" + esc(p.a) + (p.bh.length ? " · " + esc(bhLabel(p.bh)) : "") + (p.lo ? " · " + sizeLabel(p) : "") + '</small></div><button type="button" data-save="' + p.i + '" data-name="' + esc(p.n) + '" aria-pressed="true">Remove</button></li>';
        }).join("");
        var yes = function (p, f) { return (p.feat || []).indexOf(f) > -1 ? '<span class="y">Yes</span>' : '<span class="n">Not listed</span>'; };
        var any = function (f) { return list.some(function (p) { return (p.feat || []).indexOf(f) > -1; }); };
        var arow = function (label, f) { return any(f) ? row(label, function (p) { return yes(p, f); }) : ""; };
        var row = function (label, fn) { return "<tr><th scope=\"row\">" + label + "</th>" + list.map(function (p) { return "<td>" + fn(p) + "</td>"; }).join("") + "</tr>"; };
        var cmp = list.length > 1 ? '<h3 class="d-h">Compare</h3><div class="tbl-wrap"><table class="cmp"><thead><tr><th scope="col"></th>' + list.map(function (p) { return '<th scope="col">' + esc(p.n) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          row("Area", function (p) { return esc(p.a); }) + row("For", function (p) { return (p.buy ? "Buy" : "") + (p.buy && p.rent ? " / " : "") + (p.rent ? "Rent" : ""); }) +
          (list.some(function (p) { return p.bh.length; }) ? row("Bedrooms", function (p) { return esc(bhLabel(p.bh) || "–"); }) : "") + row(list.every(function (p) { return p.k === "c"; }) ? "Size" : "Carpet / size", function (p) { return esc(sizeLabel(p) || "–"); }) +
          row("Super built-up", function (p) { return esc(sbuLabel(p.sbu) || "–"); }) + row("Total floors", function (p) { return p.fl || "–"; }) +
          row("Possession (as listed)", function (p) { return esc(p.ps || "–"); }) + arow("Swimming pool", "Swimming Pool") +
          arow("Gym", "Gym") + arow("Clubhouse", "Exclusive Clubhouse") +
          arow("Kids' play area", "Children's Play Area") + arow("Power backup", "Power Backup") +
          row("Price", function () { return "On request"; }) + row("Property ID", function (p) { return esc(p.ref); }) + "</tbody></table></div>" : "";
        var msg = slMessage(list);
        body.innerHTML = '<ul>' + items + "</ul>" + cmp + '<h3 class="d-h">Your message to Disha</h3><div class="sl-msg" id="sl-msg">' + esc(msg) + "</div><p style=\"color:var(--muted);font-size:.95rem\">Prices are not published on the current site, so this message asks for them. Edit nothing: it opens in WhatsApp ready to send.</p>";
        foot.innerHTML = '<a class="btn btn--ink" href="' + waLink(msg) + '" target="_blank" rel="noopener">' + ICON.wa + ' Send on WhatsApp</a>' +
          '<a class="btn btn--line" href="mailto:' + D.email + "?subject=" + encodeURIComponent("Shortlist from the website") + "&body=" + encodeURIComponent(msg) + '">Email it</a>' +
          '<button type="button" class="btn btn--line" id="sl-copy">Copy text</button>';
        var cp = $("#sl-copy", el);
        cp.addEventListener("click", function () { var t = msg; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast("Shortlist copied"); }, function () { toast("Copy is not available here"); }); });
      }
      syncSL(); show(el);
    });
  }
  d.addEventListener("sl:change", function () { var el = $("#dlg-sl"); if (el && el.open) openSL(); });

  /* ---------------------------------------------------------------- home quick finder */
  var qf = $("#quick");
  if (qf) {
    var qs = { goal: "buy", kind: "r" };
    var sync = function () {
      $$("[data-goal]", qf).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-goal") === qs.goal ? "true" : "false"); });
      $$("[data-kind]", qf).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-kind") === qs.kind ? "true" : "false"); });
    };
    qf.addEventListener("click", function (e) {
      var g = e.target.closest("[data-goal]"), k = e.target.closest("[data-kind]");
      if (g) { qs.goal = g.getAttribute("data-goal"); if (qs.goal === "rent") qs.kind = "c"; }
      if (k) { qs.kind = k.getAttribute("data-kind"); if (qs.kind === "r") qs.goal = "buy"; }
      sync();
    });
    qf.addEventListener("submit", function (e) {
      e.preventDefault();
      var a = $("select", qf).value;
      location.href = D.base + "/find/?goal=" + qs.goal + "&kind=" + qs.kind + (a ? "&area=" + encodeURIComponent(a) : "");
    });
    sync();
  }

  /* ---------------------------------------------------------------- properties page */
  var pg = $("#props");
  if (pg) {
    D.load().then(function (j) {
      var q = new URLSearchParams(location.search);
      var S = { status: q.get("status") || "", kind: q.get("type") || "", bh: q.get("bhk") || "", area: q.get("area") || "", q: q.get("q") || "", sort: "", shown: 24 };
      var grid = $("#grid"), count = $("#count"), more = $("#more");
      var areas = {}; j.list.forEach(function (p) { areas[p.a] = (areas[p.a] || 0) + 1; });
      var an = Object.keys(areas).sort(function (a, b) { return areas[b] - areas[a] || a.localeCompare(b); });
      $("#f-area").innerHTML = '<option value="">All areas</option>' + an.map(function (a) { return '<option value="' + esc(a) + '">' + esc(a) + " (" + areas[a] + ")</option>"; }).join("");
      var filt = function () {
        var qq = S.q.trim().toLowerCase();
        var L = j.list.filter(function (p) {
          if (S.status === "buy" && !p.buy) return false;
          if (S.status === "rent" && !p.rent) return false;
          if (S.kind && p.k !== S.kind) return false;
          if (S.bh) { var n = parseFloat(S.bh); if (!p.bh.some(function (b) { return n >= 5 ? b >= 5 : Math.floor(b) === n; })) return false; }
          if (S.area && p.a !== S.area) return false;
          if (qq && (p.n + " " + p.a + " " + p.ref).toLowerCase().indexOf(qq) < 0) return false;
          return true;
        });
        if (S.sort === "size") L.sort(function (a, b) { return (a.lo || 1e9) - (b.lo || 1e9); });
        else if (S.sort === "name") L.sort(function (a, b) { return a.n.localeCompare(b.n); });
        else L.sort(function (a, b) { return (b.im ? 1 : 0) - (a.im ? 1 : 0); });
        return L;
      };
      var render = function () {
        var L = filt();
        $$("[data-f]", pg).forEach(function (b) { b.setAttribute("aria-pressed", S[b.getAttribute("data-f")] === b.getAttribute("data-v") ? "true" : "false"); });
        $("#f-bh").hidden = S.kind === "c";
        $("#f-area").value = S.area; $("#f-q").value = S.q; $("#f-sort").value = S.sort;
        count.textContent = "Showing " + Math.min(S.shown, L.length) + " of " + L.length + " properties";
        grid.innerHTML = L.length ? L.slice(0, S.shown).map(function (p) { return card(p); }).join("") :
          '<div class="empty" style="grid-column:1/-1"><h3>Nothing matches</h3><p>Try removing a filter, or <a href="' + D.base + '/find/">let the shortlist finder suggest options</a>.</p></div>';
        more.hidden = L.length <= S.shown;
        syncSL();
      };
      pg.addEventListener("click", function (e) {
        var b = e.target.closest("[data-f]"); if (!b) return;
        var k = b.getAttribute("data-f"), v = b.getAttribute("data-v");
        S[k] = S[k] === v && v !== "" ? "" : v; if (k === "kind" && S.kind === "c") S.bh = ""; if (k === "status" && S.status === "rent") S.kind = S.kind === "r" ? "" : S.kind;
        S.shown = 24; render();
      });
      $("#f-area").addEventListener("change", function (e) { S.area = e.target.value; S.shown = 24; render(); });
      $("#f-sort").addEventListener("change", function (e) { S.sort = e.target.value; render(); });
      var qt; $("#f-q").addEventListener("input", function (e) { clearTimeout(qt); var v = e.target.value; qt = setTimeout(function () { S.q = v; S.shown = 24; render(); }, 160); });
      $("#more-btn").addEventListener("click", function () { S.shown += 24; render(); });
      var fm = $(".f-more"); if (fm) fm.addEventListener("click", function () { var f = $(".filters"); var o = f.classList.toggle("open"); fm.setAttribute("aria-expanded", o ? "true" : "false"); });
      render();
      var op = q.get("open"); if (op && j.byId[op]) openDetail(op);
    });
  }

  /* ---------------------------------------------------------------- shortlist finder */
  var fd = $("#finder");
  if (fd) {
    D.load().then(function (j) {
      var q = new URLSearchParams(location.search);
      var AREAS_TOP = ["Ambli", "Gota", "Thaltej", "Vaishnodevi", "Jagatpur", "Satellite", "Sindhubhavan", "Shilaj", "Bodakdev", "Shantigram", "Vastrapur", "S.G Highway", "Science City", "Tragad", "Zundal", "Shela"];
      var cnt = {}; j.list.forEach(function (p) { cnt[p.a] = (cnt[p.a] || 0) + 1; });
      var MUST = [["Swimming Pool", "Swimming pool"], ["Gym", "Gym"], ["Exclusive Clubhouse", "Clubhouse"], ["Children's Play Area", "Kids' play area"], ["Power Backup", "Power backup"], ["Jogging Track", "Jogging track"]];
      var SIZES = [["u1", "Under 1,000", 0, 1000], ["m", "1,000 to 2,500", 1000, 2500], ["l", "2,500 to 5,000", 2500, 5000], ["xl", "5,000 and above", 5000, 1e9]];
      var S = { goal: q.get("goal") === "rent" ? "rent" : "buy", kind: q.get("kind") === "c" ? "c" : "r", bh: [], size: "", areas: q.get("area") ? [q.get("area")] : [], move: "any", must: [] };
      if (S.goal === "rent") S.kind = "c";
      var chips = function (arr, key, multi, fmtf) {
        return arr.map(function (a) { return '<button type="button" class="chip" data-k="' + key + '" data-v="' + esc(a[0]) + '" aria-pressed="false">' + esc(a[1]) + (a[2] != null ? " <small>" + a[2] + "</small>" : "") + "</button>"; }).join("");
      };
      $("#q-bh").innerHTML = chips([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5 or more"]], "bh");
      $("#q-size").innerHTML = chips(SIZES.map(function (s) { return [s[0], s[1] + " sq ft"]; }), "size");
      $("#q-area").innerHTML = chips(AREAS_TOP.map(function (a) { return [a, a, cnt[a]]; }).concat([["__other", "Other areas"]]), "areas");
      $("#q-must").innerHTML = chips(MUST.map(function (m) { return [m[0], m[1]]; }), "must");
      var combos = function () {
        var c = { buy: { r: 0, c: 0 }, rent: { r: 0, c: 0 } };
        j.list.forEach(function (p) { if (p.buy) c.buy[p.k]++; if (p.rent) c.rent[p.k]++; });
        return c;
      }();
      var inArr = function (a, v) { return a.indexOf(v) > -1; };
      var summary = function () {
        var s = [S.goal === "buy" ? "Buy" : "Rent", S.kind === "r" ? "home" : "office or shop"];
        if (S.kind === "r" && S.bh.length) s.push(S.bh.map(function (b) { return b === "5" ? "5+" : b; }).join(", ") + " BHK");
        if (S.kind === "c" && S.size) s.push(SIZES.filter(function (x) { return x[0] === S.size; })[0][1] + " sq ft");
        if (S.areas.length) s.push(S.areas.map(function (a) { return a === "__other" ? "other areas" : a; }).join(", "));
        if (S.move === "ready") s.push("ready to move"); if (S.move === "2026") s.push("possession 2026 or later");
        if (S.must.length) s.push("with " + S.must.map(function (m) { return MUST.filter(function (x) { return x[0] === m; })[0][1].toLowerCase(); }).join(", "));
        return s.join(" · ");
      };
      var matchBase = function (p, o) {
        if (S.goal === "buy" ? !p.buy : !p.rent) return false;
        if (p.k !== S.kind) return false;
        if (o.bh && S.kind === "r" && S.bh.length) { if (!p.bh.some(function (b) { return S.bh.some(function (x) { var n = parseInt(x, 10); return n >= 5 ? b >= 5 : Math.floor(b) === n; }); })) return false; }
        if (o.bh && S.kind === "c" && S.size) { var r = SIZES.filter(function (x) { return x[0] === S.size; })[0]; if (p.hi && (p.hi < r[2] || p.lo >= r[3])) return false; }
        if (o.area && S.areas.length) { var top = inArr(AREAS_TOP, p.a); if (!(inArr(S.areas, p.a) || (!top && inArr(S.areas, "__other")))) return false; }
        if (S.move === "ready" && p.pk !== "ready") return false;
        if (S.move === "2026" && !(p.pk && p.pk !== "ready" && parseInt(p.pk, 10) >= 2026)) return false;
        return true;
      };
      var shown = 12;
      var out = $("#results"), head = $("#res-title"), sub = $("#res-sub"), note = $("#res-note");
      var run = function () {
        var relax = 0, L = j.list.filter(function (p) { return matchBase(p, { bh: 1, area: 1 }); });
        if (!L.length) { relax = 1; L = j.list.filter(function (p) { return matchBase(p, { bh: 1, area: 0 }); }); }
        if (!L.length) { relax = 2; L = j.list.filter(function (p) { return matchBase(p, { bh: 0, area: 1 }); }); }
        if (!L.length) { relax = 3; L = j.list.filter(function (p) { return matchBase(p, { bh: 0, area: 0 }); }); }
        var sc = function (p) { var s = 0; S.must.forEach(function (m) { if (inArr(p.feat || [], m)) s += 10; }); if (p.im) s += 3; if (p.pk === "ready") s += 1; return s; };
        L.sort(function (a, b) { return sc(b) - sc(a) || a.n.localeCompare(b.n); });
        $$("[data-k]", fd).forEach(function (b) {
          var k = b.getAttribute("data-k"), v = b.getAttribute("data-v"), on = k === "bh" || k === "areas" || k === "must" ? inArr(S[k], v) : S[k] === v;
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        $$("[data-goal]", fd).forEach(function (b) { var g = b.getAttribute("data-goal"); b.setAttribute("aria-pressed", S.goal === g ? "true" : "false"); });
        $$("[data-kind]", fd).forEach(function (b) { var k = b.getAttribute("data-kind"); b.setAttribute("aria-pressed", S.kind === k ? "true" : "false"); b.disabled = combos[S.goal][k] === 0; });
        $("#bh-box").hidden = S.kind === "c"; $("#size-box").hidden = S.kind === "r";
        $("#goal-note").textContent = S.goal === "rent" ? "Rentals on the current list are offices and shops." : "";
        NEED = summary(); store.set("disha_need", NEED);
        head.textContent = L.length + (L.length === 1 ? " match" : " matches");
        sub.textContent = NEED;
        var msgs = ["", "Nothing matched those areas exactly. Here is the same need in other areas.", "Nothing matched that size exactly. Here are the closest in your areas.", "No exact match. Here is everything on the list for this type."];
        note.hidden = !relax; note.textContent = msgs[relax];
        var mustOn = S.must;
        out.innerHTML = L.slice(0, shown).map(function (p) {
          var w = [];
          if (S.areas.length && inArr(S.areas, p.a)) w.push("<span>In " + esc(p.a) + "</span>");
          if (S.kind === "r" && S.bh.length && relax !== 2 && relax !== 3) w.push("<span>" + esc(bhLabel(p.bh)) + "</span>");
          mustOn.forEach(function (m) { var lab = MUST.filter(function (x) { return x[0] === m; })[0][1]; w.push(inArr(p.feat || [], m) ? "<span>" + esc(lab) + "</span>" : '<span class="no">No ' + esc(lab.toLowerCase()) + " listed</span>"); });
          if (S.move === "ready") w.push("<span>Ready to move</span>");
          return card(p, w.join(""));
        }).join("") || '<div class="empty" style="grid-column:1/-1"><h3>Nothing on the list</h3><p>Message Disha: new projects arrive faster than a website updates.</p></div>';
        $("#jump").textContent = "Show " + L.length + (L.length === 1 ? " match" : " matches");
        var all = $("#res-more"); all.hidden = L.length <= shown; all.textContent = "Show all " + L.length;
        var top = L.slice(0, 5);
        var wa = "Hello Disha Estate, I used the shortlist finder on your website.\nWhat I am looking for: " + NEED + "\nTop matches I saw: " + top.map(function (p) { return p.n + " (" + p.ref + ")"; }).join("; ") + "\nPlease share prices and available options.";
        $("#res-wa").href = waLink(wa);
        syncSL();
      };
      fd.addEventListener("click", function (e) {
        var g = e.target.closest("[data-goal]"), kd = e.target.closest("[data-kind]"), b = e.target.closest("[data-k]");
        if (g) { S.goal = g.getAttribute("data-goal"); if (S.goal === "rent") S.kind = "c"; }
        if (kd && !kd.disabled) { S.kind = kd.getAttribute("data-kind"); if (S.kind === "r") S.goal = "buy"; }
        if (b) {
          var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
          if (k === "bh" || k === "areas" || k === "must") { var i = S[k].indexOf(v); if (i > -1) S[k].splice(i, 1); else S[k].push(v); }
          else S[k] = S[k] === v ? (k === "move" ? "any" : "") : v;
        }
        if (g || kd || b) { shown = 12; run(); }
      });
      $("#res-more").addEventListener("click", function () { shown = 999; run(); });
      $("#reset").addEventListener("click", function () { S.bh = []; S.size = ""; S.areas = []; S.move = "any"; S.must = []; shown = 12; run(); });
      run();
      var ask = $(".ask", fd), jump = $("#jump");
      if (ask && jump && "IntersectionObserver" in w) {
        new IntersectionObserver(function (es) { jump.classList.toggle("on", es[0].isIntersecting); }, { threshold: 0.15 }).observe(ask);
      }
    });
  }
  syncSL();
})();
