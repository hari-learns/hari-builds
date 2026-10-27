(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { } }

  /* header: solid after the hero starts to scroll away */
  var hd = $("#hd");
  function hdState() { if (hd) hd.classList.toggle("is-solid", window.scrollY > 40); }
  hdState(); window.addEventListener("scroll", hdState, { passive: true });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false"); document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { var x = $("#drawer-x"); x && x.focus(); } else burger.focus({ preventScroll: true });
  }
  if (burger) { burger.addEventListener("click", function () { setDrawer(true); }); $("#drawer-x").addEventListener("click", function () { setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); }); }

  /* concept dock */
  var dock = $("#dock");
  if (dock) {
    var dx = $("#dock-x");
    function dmin(m) { dock.classList.toggle("is-min", m); dx.textContent = m ? "i" : "\u00d7"; dx.setAttribute("aria-label", m ? "Show concept note" : "Close note"); dx.setAttribute("aria-expanded", m ? "false" : "true"); store("fbi-dock", m ? "1" : "0"); }
    if (store("fbi-dock") === "1") dmin(true); else setTimeout(function () { dmin(true); }, 7000);
    dx.addEventListener("click", function () { dmin(!dock.classList.contains("is-min")); });
  }

  /* reveals (with the safety sweep: anything at or above the fold is shown) */
  var rv = $$(".rv");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(show);
  function sweep() { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); }); sweep();

  /* hero: the same kind of slideshow of real project images their site has, now with names and a proper crop */
  var slides = $$("#slides .slide");
  if (slides.length) {
    var dots = $$("#dots .dot"), cap = $("#cap"), cur = 0, timer = null;
    function load(i) { var im = $("img", slides[i]); if (im && im.dataset.src) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; delete im.dataset.src; } }
    function go(i) {
      i = (i + slides.length) % slides.length; load(i);
      slides[cur].classList.remove("is-on"); dots[cur].classList.remove("is-on");
      cur = i; slides[cur].classList.add("is-on"); dots[cur].classList.add("is-on"); if (cap) cap.textContent = slides[cur].getAttribute("data-cap");
    }
    function start() { stop(); if (reduce || document.hidden) return; timer = setInterval(function () { go(cur + 1); }, 6500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); start(); }); });
    var conn = navigator.connection || {}, lite = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    function warm() { if (lite) return; slides.forEach(function (_, i) { setTimeout(function () { load(i); }, 400 * i); }); }
    if (document.readyState === "complete") setTimeout(warm, 800); else window.addEventListener("load", function () { setTimeout(warm, 800); });
    if (!lite) start(); document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* lite video embeds: nothing from YouTube loads until the play button is tapped */
  $$("[data-yt]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = document.createElement("iframe"); f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.title = b.getAttribute("aria-label").replace(/^Play video: /, ""); f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      f.setAttribute("loading", "lazy"); b.replaceWith(f);
    });
  });

  /* open now (Dubai time) */
  var op = $("#open");
  if (op) {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()), g = {};
      parts.forEach(function (p) { g[p.type] = p.value; });
      var m = (+g.hour % 24) * 60 + (+g.minute), wd = g.weekday, open = false, close = "";
      if (/Mon|Tue|Wed|Thu|Fri/.test(wd)) { open = m >= 510 && m < 1080; close = "18:00"; } else if (/Sat/.test(wd)) { open = m >= 510 && m < 840; close = "14:00"; }
      op.textContent = open ? "Open now · until " + close + " Dubai time" : "Closed now · back at 8:30 on the next working day (Dubai time)"; op.classList.toggle("is-open", open);
    } catch (e) { }
  }

  /* contact form -> WhatsApp or email, prefilled */
  var cf = $("#ct-form");
  if (cf) {
    var D0 = { wa: "97142888999", mail: "info@fitoutbureau.com" };
    function body() {
      var v = function (id) { return ($("#" + id).value || "").trim(); };
      return "Hello Fitout Bureau Interiors,\nI'd like a free consultation.\n\nName: " + v("f-name") + "\nService: " + v("f-svc") + "\nType of project: " + v("f-type") + "\nLocation: " + v("f-loc") + "\nPhone: " + v("f-phone") + "\nEmail: " + v("f-email");
    }
    $("#f-wa").addEventListener("click", function () { window.open("https://wa.me/" + D0.wa + "?text=" + encodeURIComponent(body()), "_blank", "noopener"); });
    $("#f-mail").addEventListener("click", function () { location.href = "mailto:" + D0.mail + "?subject=" + encodeURIComponent("Fit-out enquiry") + "&body=" + encodeURIComponent(body()); });
    cf.addEventListener("submit", function (e) { e.preventDefault(); });
  }
  var mb = $("#map-b");
  if (mb) mb.addEventListener("click", function () { var f = document.createElement("iframe"); f.src = mb.getAttribute("data-src"); f.title = "Map: Fitout Bureau Interiors, Al Quoz 3, Dubai"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; mb.replaceWith(f); });

  /* projects page: filters */
  var fl = $("#filters");
  if (fl) {
    var cards = $$("#pgrid .pc"), cnt = $("#count"), emp = $("#empty"), q = new URLSearchParams(location.search);
    ["type", "emirate"].forEach(function (n) { var v = q.get(n); if (v) { var r = $('input[name="' + n + '"][value="' + v.replace(/"/g, "") + '"]', fl); if (r) r.checked = true; } });
    var apply = function () {
      var t = $('input[name="type"]:checked', fl).value, em = $('input[name="emirate"]:checked', fl).value, n = 0;
      cards.forEach(function (c) { var ok = (!t || c.dataset.type === t) && (!em || c.dataset.emirate === em); c.hidden = !ok; if (ok) n++; });
      cnt.textContent = n + (n === 1 ? " project" : " projects"); emp.hidden = n > 0;
    };
    fl.addEventListener("change", apply); apply();
  }

  /* the planner */
  var pd = $("#plan-data");
  if (pd) {
    var D = JSON.parse(pd.textContent), form = $("#tool-q"), out = $("#out-main"), empty = $("#out-empty");
    var userSized = false, params = new URLSearchParams(location.search);
    function sel(n) { var r = $('input[name="' + n + '"]:checked', form); return r ? r.value : ""; }
    function chk(n, v) { var r = $('input[name="' + n + '"][value="' + v + '"]', form); if (r) r.checked = true; }
    if (params.get("type") && D.types[params.get("type")]) chk("type", params.get("type"));
    if (params.get("emirate")) chk("emirate", params.get("emirate"));
    function defSize(t) { return (t === "home" || t === "leisure") ? "large" : "small"; }
    function render() {
      var t = sel("type"); if (!t) { out.hidden = true; empty.hidden = false; return; }
      var size = sel("size"); if (!size || !userSized) { size = defSize(t); chk("size", size); }
      var em = sel("emirate") || "Dubai", svcs = $$('input[name="svc"]:checked', form).map(function (i) { return i.value; });
      var area = (form.area.value || "").trim(), who = (form.who.value || "").trim();
      var tl = D.timeline[size], pct = function (w) { return (w / 26 * 100).toFixed(2) + "%"; };
      var bandLabel = size === "small" ? "4–8 wks" : "3–6 months";
      var ticks = ""; for (var i = 0; i <= 6; i++) ticks += "<span>" + i + (i === 6 ? " months" : "") + "</span>";
      var hasAppr = svcs.indexOf("approvals") > -1;
      var appr = hasAppr ? (em === "Dubai" ? "<li>The team handles " + esc(D.approvalsDubai) + " for you (from their FAQ).</li><li>Their approvals service covers " + esc(D.approvalsSteps) + ".</li>"
        : "<li>Their approvals service covers " + esc(D.approvalsSteps) + ".</li><li>The Dubai authority names on their site are Dubai Municipality and Trakhees; ask which apply in " + esc(em) + ".</li>")
        : "<li>You keep approvals in your hands. The team can add them at any point: drawing submission, NOC, inspection, completion certificate.</li>";
      var sv = svcs.map(function (k) { return "<li>" + esc(D.services[k].label) + "</li>"; }).join("") || "<li>Tell the team what you need</li>";
      var same = D.projects.filter(function (p) { return p.t === t; }), inEm = same.filter(function (p) { return p.e === em; });
      var pick = same.slice().sort(function (a, b) { return (a.e === em ? 0 : 1) - (b.e === em ? 0 : 1); }).slice(0, 6);
      var cards = pick.map(function (p) {
        return '<a class="pc" href="' + D.base + 'projects/' + p.s + '/"><span class="pc-img"><img src="' + p.i + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.n + ', ' + p.p) + '" loading="lazy"></span><span class="pc-t">' + esc(p.n) + '</span><span class="pc-s">' + esc(p.p) + '</span></a>';
      }).join("");
      var refs = pick.slice(0, 3).map(function (p) { return p.n; }).join("; ");
      var brief = "Hello Fitout Bureau Interiors,\nI'd like a quote for a fit-out.\n\nSpace: " + D.types[t] + "\nSize: " + tl.label + " (" + tl.note + ")" + (area ? ", about " + Number(area).toLocaleString("en-US") + " sq ft" : "") +
        "\nLocation: " + em + "\nNeeds: " + (svcs.map(function (k) { return D.services[k].label; }).join(", ") || "to be discussed") +
        (refs ? "\nSimilar projects I saw on your site: " + refs : "") + (who ? "\nName: " + who : "") + "\n\nPlease tell me the next step and what you need from me to quote.";
      var enc = encodeURIComponent(brief);
      out.innerHTML =
        '<p class="out-edit"><a href="#tool-q">Change your answers</a></p><div class="out-blk"><p class="out-k">How long it usually takes</p><p class="out-big">' + esc(tl.text) + '</p><p class="out-sub">Their published range for ' + esc(tl.note) + '.</p>' +
        '<div class="bar-t" role="img" aria-label="Time bar: ' + esc(tl.text) + ' on a six month scale"><span class="bar-band" style="left:' + pct(tl.lo_w) + ';width:' + pct(tl.hi_w - tl.lo_w) + '">' + bandLabel + '</span></div><div class="bar-ticks" aria-hidden="true">' + ticks + '</div></div>' +
        '<div class="out-blk"><p class="out-k">Approvals and paperwork</p><ul class="out-list">' + appr + '</ul></div>' +
        '<div class="out-blk"><p class="out-k">What the team takes on</p><ul class="out-list">' + sv + '</ul></div>' +
        '<div class="out-blk"><p class="out-k">Projects like yours</p><p class="out-sub">' + same.length + ' ' + esc(D.typeShort[t].toLowerCase()) + ' projects in the portfolio, ' + inEm.length + ' in ' + esc(em) + '.</p><div class="out-proj">' + cards + '</div>' +
        '<p class="note"><a href="' + D.base + 'projects/?type=' + t + '">See all ' + same.length + '</a></p></div>' +
        '<div class="out-blk"><p class="out-k">Your brief, ready to send</p><div class="brief" id="brief">' + esc(brief) + '</div>' +
        '<div class="out-btns"><a class="btn" href="https://wa.me/' + D.wa + '?text=' + enc + '" rel="noopener">Send on WhatsApp</a><a class="btn btn--ghost" href="mailto:' + D.email + '?subject=' + encodeURIComponent("Fit-out enquiry: " + D.types[t]) + '&body=' + enc + '">Send by email</a><button class="btn btn--ghost" type="button" id="copy">Copy brief</button></div>' +
        '<p class="disc">Time frames are the ranges Fitout Bureau publishes in its FAQ, not a promise: the programme is set once they have seen your drawings and scope. Costs are quoted per project, which is what this brief is for.</p></div>';
      out.hidden = false; empty.hidden = true;
      var cp = $("#copy"); if (cp) cp.addEventListener("click", function () { var done = function () { cp.textContent = "Copied"; setTimeout(function () { cp.textContent = "Copy brief"; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(brief).then(done, done); else done(); });
    }
    var scrolled = false;
    form.addEventListener("change", function (e) { if (e.target.name === "type" && !scrolled && window.innerWidth <= 900) { scrolled = true; setTimeout(function () { var o = $("#tool-out"); o && o.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 150); } if (e.target.name === "size") userSized = true; if (e.target.name === "type" && !userSized) chk("size", defSize(e.target.value)); render(); });
    form.addEventListener("input", function (e) { if (e.target.name === "area" || e.target.name === "who") render(); });
    render();
  }
})();
