(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
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
  if (dock && safe(function () { return sessionStorage.getItem("fstd-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("fstd-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* hero slideshow of real shop photos (pausable; static first photo with reduced motion) */
  var slides = $$(".hero .slide");
  if (slides.length > 1) {
    var cur = 0, timer = null, playing = !reduce, pp = $("#slide-pp"), nEl = $("#slide-n");
    function show(i) {
      slides[cur].classList.remove("is-on"); cur = (i + slides.length) % slides.length; slides[cur].classList.add("is-on");
      if (nEl) nEl.textContent = ("0" + (cur + 1)).slice(-2) + " / " + ("0" + slides.length).slice(-2);
    }
    function start() { stop(); timer = setInterval(function () { show(cur + 1); }, 6500); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function setPP() { if (!pp) return; pp.innerHTML = playing ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>'; pp.setAttribute("aria-label", pp.getAttribute(playing ? "data-pause" : "data-play")); }
    if (pp) pp.addEventListener("click", function () { playing = !playing; setPP(); playing ? start() : stop(); });
    d.addEventListener("visibilitychange", function () { if (d.hidden) stop(); else if (playing) start(); });
    setPP(); if (playing) start();
  } else { var c = $(".hero__ctl"); if (c) c.hidden = true; }
  if (reduce) { var hc = $(".hero__ctl"); if (hc) hc.hidden = true; }

  /* story stage follows the chapter nearest the middle of the screen (wide screens only) */
  var chaps = $$(".chap"), stageImgs = $$(".stage__i");
  if (chaps.length && stageImgs.length) {
    var curI = 0;
    var upd = function () {
      if (window.innerWidth < 900) return;
      var mid = window.innerHeight * 0.5, best = 0, bd = 1e9;
      chaps.forEach(function (c, i) { var r = c.getBoundingClientRect(), dd = Math.abs((r.top + r.bottom) / 2 - mid); if (dd < bd) { bd = dd; best = i; } });
      chaps.forEach(function (c, i) { c.classList.toggle("is-cur", i === best); });
      if (best !== curI) { stageImgs[curI].classList.remove("is-on"); stageImgs[best].classList.add("is-on"); curI = best; }
    };
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
    if (window.innerWidth >= 900 && !reduce) { /* chapters start dimmed until current */ } else chaps.forEach(function (c) { c.classList.add("is-cur"); });
  }

  /* sticky bar waits until the hero actions have scrolled away (home only) */
  var hb = $(".hero .btn-row"), bar = $(".bar");
  if (hb && bar && "IntersectionObserver" in window) {
    bar.classList.add("is-wait");
    new IntersectionObserver(function (es) { bar.classList.toggle("is-wait", es[0].isIntersecting || es[0].boundingClientRect.top > 0); }, { threshold: 0 }).observe(hb);
  }

  /* counter on the real 4,500 figure */
  $$("[data-count]").forEach(function (el) {
    var to = +el.getAttribute("data-count"); if (reduce || !("IntersectionObserver" in window)) return;
    var done = false, o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || done) return; done = true; var t0 = performance.now(), dur = 1400;
      (function f(t) { var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString("en-US"); if (p < 1) requestAnimationFrame(f); })(t0);
    }, { threshold: 0.5 }); o.observe(el);
  });

  /* contact form -> prefilled email */
  var cf = $("#cform");
  if (cf) $("#cform-send").addEventListener("click", function () {
    var v = function (id) { return ($("#" + id).value || "").trim(); };
    var body = "Name: " + v("f-name") + "\nEmail: " + v("f-email") + "\nPhone: " + v("f-phone") + "\n\n" + v("f-msg");
    location.href = "mailto:" + cf.getAttribute("data-to") + "?subject=" + encodeURIComponent("Enquiry for Five Star Tool and Die") + "&body=" + encodeURIComponent(body);
  });

  /* tooling job planner: reshuffles the departments Five Star describes on its own site */
  var dataEl = $("#plan-data");
  if (dataEl) {
    var D = JSON.parse(dataEl.textContent), form = $("#plan"), tons = $("#tons"), brief = $("#brief"), edited = false;
    var needLab = {}, needStages = {}; D.needs.forEach(function (n) { needLab[n[0]] = n[1]; needStages[n[0]] = n[2]; });
    var checked = function (name) { return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); };
    var q = new URLSearchParams(location.search);
    (q.get("need") || "").split(",").forEach(function (v) { var el = $('input[name="need"][value="' + v + '"]', form); if (el) el.checked = true; });
    var t0 = q.get("timing"); if (t0) { var te = $('input[name="timing"][value="' + t0 + '"]', form); if (te) te.checked = true; }
    var tq = parseInt(q.get("tons"), 10); if (tq > 0) tons.value = tq;
    function run() {
      var needs = checked("need"), alloy = checked("alloy")[0], start = checked("start")[0], timing = checked("timing")[0];
      var t = parseInt(tons.value, 10), has = t > 0, down = timing === "down";
      var on = $("#res-on"), empty = $("#res-empty");
      if (!needs.length && !down) { on.hidden = true; empty.hidden = false; return; }
      on.hidden = true; empty.hidden = true;
      var why = {}; needs.forEach(function (n) { needStages[n].forEach(function (s) { (why[s] = why[s] || []).push(needLab[n]); }); });
      if (down) { why.repair = (why.repair || []).concat(["A die is down"]); }
      var order = D.order.slice(); if (down) { order.splice(order.indexOf("repair"), 1); order.unshift("repair"); }
      var list = $(".rss"), shown = [], n = 0;
      order.forEach(function (s) {
        var li = $('[data-stage="' + s + '"]', list);
        if (why[s]) { n++; li.hidden = false; $(".rs__n", li).textContent = "Step " + ("0" + n).slice(-2); $(".rs__why", li).textContent = "For: " + why[s].join(", "); list.appendChild(li); shown.push(D.stages[s]); }
        else li.hidden = true;
      });
      $("#res-h").textContent = "Your job runs through " + n + (n === 1 ? " department" : " departments") + ", in this order";
      var jn = $("#jump-n"); if (jn) jn.textContent = " (" + n + ")";
      var pe = $("#res-press"); pe.classList.toggle("is-warn", has && t > D.max);
      pe.textContent = !has ? D.msg.none : (t.toLocaleString("en-US") + " ton. " + (t > D.max ? D.msg.above : D.msg.within));
      var st = start === "none" ? null : D.starts[start]; $("#res-start").textContent = st ? "Starting from: " + st[0] + ". " + st[1] : "";
      $("#res-tol").hidden = !$('[data-stage="cnc"]', list) || $('[data-stage="cnc"]', list).hidden;
      $("#res-urgent").hidden = !down;
      var lines = ["Tooling job brief for " + D.brand, ""];
      lines.push("Need: " + (needs.map(function (x) { return needLab[x]; }).concat(down ? ["A die is down now"] : []).join("; ")));
      lines.push("Alloy: " + D.alloys[alloy]); lines.push("Die cast machine: " + (has ? t + " ton" : "not given"));
      if (st) lines.push("Starting from: " + st[0]); lines.push("Timing: " + D.timings[timing]);
      lines.push("Departments: " + shown.join(" > ")); lines.push("", "Name:", "Company:", "Phone:", "Part / program:");
      var text = lines.join("\n");
      if (!edited) brief.value = text;
      var subj = "Tooling job: " + (needs.length ? needLab[needs[0]] : "repair") + (has ? ", " + t + " ton" : "");
      upLink(subj);
      on.hidden = false; jumpUpd();
    }
    var jump = $("#jump");
    function jumpUpd() { if (!jump) return; var r = $("#res").getBoundingClientRect(); jump.hidden = $("#res-on").hidden || window.innerWidth >= 1000 || r.top < window.innerHeight * 0.6; }
    window.addEventListener("scroll", function () { jumpUpd(); }, { passive: true }); window.addEventListener("resize", jumpUpd);
    function upLink(subj) { $("#send").href = "mailto:" + D.email + "?subject=" + encodeURIComponent(subj || "Tooling job") + "&body=" + encodeURIComponent(brief.value); }
    brief.addEventListener("input", function () { edited = true; upLink(); });
    form.addEventListener("change", function () { edited = false; run(); });
    tons.addEventListener("input", function () { edited = false; run(); });
    $$("[data-ton]", form).forEach(function (b) { b.addEventListener("click", function () { tons.value = b.getAttribute("data-ton"); edited = false; run(); }); });
    $("#copy").addEventListener("click", function () {
      var ok = function () { var c = $("#copied"); c.hidden = false; setTimeout(function () { c.hidden = true; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(brief.value).then(ok, function () { brief.select(); d.execCommand("copy"); ok(); });
      else { brief.select(); d.execCommand("copy"); ok(); }
    });
    run();
  }
})();
