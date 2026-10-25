/* HYDRO-MASZ concept: reveals, drawer, dock, opening hours, timeline rail, hero field, power finder. No strings live here:
   every text comes from the JSON blocks #site-data and #fx-data written by build.py from content.py. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function json(id) { var e = doc.getElementById(id); if (!e) return null; try { return JSON.parse(e.textContent); } catch (err) { console.warn("[data]", id, err); return null; } }
  var site = json("site-data") || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveals (IntersectionObserver + scroll sweep that never strands content) ---------- */
  var rv = $$(".rv");
  rv.forEach(function (el) { if (el.dataset.i) el.style.setProperty("--i", el.dataset.i); });
  function show(el) { el.classList.add("in"); }
  function sweep() {
    var vh = window.innerHeight || 800;
    rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); });
  }
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    ["scroll", "resize", "load", "pageshow", "hashchange"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    doc.body.classList.toggle("locked", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) { var f = $("a,button", drawer); if (f) f.focus(); } else if (burger) { try { burger.focus(); } catch (e) {} }
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(!drawer.classList.contains("open")); });
    $$("[data-close-drawer]").forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) setDrawer(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1080 && drawer.classList.contains("open")) setDrawer(false); });
  }

  /* ---------- concept dock ---------- */
  var dock = $("#dock");
  if (dock) {
    var gone = false; try { gone = sessionStorage.getItem("hm-dock") === "1"; } catch (e) {}
    if (gone) dock.hidden = true;
    var x = $("button", dock);
    if (x) x.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("hm-dock", "1"); } catch (e) {} });
  }

  /* ---------- opening hours (Europe/Warsaw) ---------- */
  function warsawNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    return { d: map[o.weekday], m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function toMin(s) { var a = s.split(":"); return parseInt(a[0], 10) * 60 + parseInt(a[1], 10); }
  function fmt(tpl, v) { return tpl.replace(/\{(\w+)\}/g, function (_, k) { return v[k]; }); }
  var badges = $$("[data-open-badge]");
  if (badges.length && site.hours && site.open) {
    try {
      var n = warsawNow(), H = site.hours, t = H[n.d], isOpen = false, text = "";
      if (t && n.m >= toMin(t[0]) && n.m < toMin(t[1])) { isOpen = true; text = fmt(site.open.open, { close: t[1] }); }
      else {
        var when = "", at = "";
        for (var i = 0; i < 8; i++) {
          var di = (n.d + i) % 7, h = H[di];
          if (!h) continue;
          if (i === 0 && n.m >= toMin(h[0])) continue;
          when = i === 0 ? site.open.today : i === 1 ? site.open.tomorrow : site.open.days[di]; at = h[0]; break;
        }
        text = fmt(site.open.closed, { when: when, time: at });
      }
      badges.forEach(function (b) { b.setAttribute("data-open", isOpen ? "1" : "0"); var s = $("[data-open-text]", b); if (s) s.textContent = text; b.hidden = false; });
    } catch (e) { console.warn("[hours]", e); }
  }

  /* ---------- timeline rail follows scroll ---------- */
  var tl = $(".tl");
  if (tl && !reduce) {
    var tick = false;
    var upd = function () {
      tick = false;
      var r = tl.getBoundingClientRect(), vh = window.innerHeight || 800;
      var p = (vh * 0.7 - r.top) / Math.max(1, r.height);
      tl.style.setProperty("--p", Math.max(0.02, Math.min(1, p)).toFixed(3));
    };
    var req = function () { if (!tick) { tick = true; requestAnimationFrame(upd); } };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); upd();
  }

  /* ---------- hero field -> finder page ---------- */
  var hf = $("#hfield");
  if (hf) {
    hf.addEventListener("submit", function (e) {
      var v = parseInt($("input", hf).value, 10);
      if (!isFinite(v) || !hf.dataset.target) return;
      e.preventDefault();
      location.href = hf.dataset.target + "#km=" + Math.max(5, Math.min(350, v));
    });
  }

  /* ---------- power finder ---------- */
  var fx = $("[data-fx]");
  if (fx) {
    var D = json("fx-data") || {}, ui = D.ui || {};
    var AX0 = 15, AX1 = 135;
    var num = $(".fx-num", fx), rng = $(".fx-range-in", fx), cnt = $(".fx-count", fx), note = $(".fx-note", fx), send = $(".fx-send", fx);
    var rows = $$(".fx-row", fx), list = $(".fx-rows", fx), tog = $(".fx-toggle", fx), trs = $$(".fx-tr li", fx);
    var taskBtns = $$("[data-task]", fx), allBtn = $("[data-task='all']", fx);
    var state = { km: 60, tasks: [], all: false };
    function readHash() {
      var s = (location.hash || "").replace(/^#/, "") + "&" + (location.search || "").replace(/^\?/, "");
      s.split("&").forEach(function (kv) {
        var p = kv.split("="), k = p[0], v = decodeURIComponent(p[1] || "");
        if (k === "km") { var n = parseFloat(v.replace(",", ".")); if (isFinite(n)) state.km = Math.max(5, Math.min(350, Math.round(n))); }
        if (k === "zadanie" && v) state.tasks = v.split(",").filter(Boolean);
      });
    }
    function writeHash() {
      var h = "#km=" + state.km + (state.tasks.length ? "&zadanie=" + state.tasks.join(",") : "");
      try { history.replaceState(null, "", h); } catch (e) {}
    }
    function range(a, b) { return b == null ? ui.from.replace("{min}", a) : a + "–" + b; }
    function status(r) {
      var mode = r.dataset.mode, mn = r.dataset.min === "" ? null : parseFloat(r.dataset.min), mx = r.dataset.max === "" ? null : parseFloat(r.dataset.max);
      if (mode === "model") return { s: "info", label: ui.model, why: r.dataset.source };
      if (mode === "mount") return { s: "info", label: ui.mount, why: r.dataset.source };
      var rt = r.dataset.rt, k = state.km;
      if (k < mn) return { s: "under", label: ui.under, why: ui.under_text.replace("{min}", mn).replace("{km}", k) };
      if (mx != null && k > mx) return { s: "over", label: ui.over, why: ui.over_text.replace("{range}", rt).replace("{km}", k) };
      if (mode === "confirm") return { s: "maybe", label: ui.maybe, why: r.dataset.source };
      return { s: "fit", label: ui.fit, why: ui.fit_text.replace("{km}", k).replace("{range}", rt) };
    }
    function render() {
      var k = state.km;
      if (num && doc.activeElement !== num) num.value = k;
      if (rng) rng.value = Math.max(AX0, Math.min(AX1, k));
      var pos = Math.max(0, Math.min(100, (k - AX0) / (AX1 - AX0) * 100));
      fx.style.setProperty("--km-pos", pos.toFixed(2));
      var sel = state.tasks, nFit = 0, nTot = 0, names = [], info = 0;
      rows.forEach(function (r) {
        var on = !sel.length || sel.indexOf(r.dataset.cat) > -1;
        r.classList.toggle("is-off", !on);
        if (!on) return;
        var st = status(r);
        r.dataset.status = st.s;
        var lab = $(".fx-st", r), why = $(".fx-why", r);
        if (lab) lab.textContent = st.label;
        if (why) why.textContent = st.why || "";
        var hide = st.s === "under" || st.s === "over" || (st.s === "info" && !sel.length);
        r.classList.toggle("is-hidden", hide);
        if (st.s === "fit" || st.s === "maybe") { nFit++; nTot++; names.push($("h4", r).textContent.trim()); }
        else if (st.s === "info") info++;
        else nTot++;
      });
      var hiddenN = rows.filter(function (r) { return !r.classList.contains("is-off") && r.classList.contains("is-hidden"); }).length;
      if (tog) {
        tog.hidden = hiddenN === 0;
        var open = list.classList.contains("show-all");
        tog.textContent = open ? ui.hidden_hide : ui.hidden.replace("{n}", hiddenN);
        tog.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (cnt) {
        if (nTot === 0) cnt.textContent = ui.info_only;
        else if (nFit === 0) cnt.textContent = ui.nofit.replace("{km}", k);
        else cnt.textContent = (nFit === 1 ? ui.count_one : ui.count).replace("{n}", nFit).replace("{total}", nTot);
      }
      // tractors: nearest by power
      if (trs.length) {
        var sc = trs.map(function (li) {
          var a = li.dataset.km !== "" && li.dataset.km != null ? parseFloat(li.dataset.km) : null, d;
          if (a != null) d = Math.abs(a - k); else { var mn = parseFloat(li.dataset.min), mx = parseFloat(li.dataset.max); d = k < mn ? mn - k : k > mx ? k - mx : 0; if (d > 0) d = 1e9; }
          return { li: li, d: d };
        }).sort(function (x, y) { return x.d - y.d; });
        var keep = sc.slice(0, 3);
        trs.forEach(function (li) { li.classList.add("is-off"); });
        keep.forEach(function (o) { if (o.d < 1e9) o.li.classList.remove("is-off"); });
      }
      // enquiry
      if (send) {
        var tnames = sel.length ? D.tasks.filter(function (t) { return sel.indexOf(t[0]) > -1; }).map(function (t) { return t[1]; }).join(", ") : ui.task_all;
        var body = ui.mail_body.replace("{km}", k).replace("{task}", tnames).replace("{names}", names.length ? names.join("; ") : ui.mail_none);
        var sm = $(".fx-send-m"); if (sm) sm.dataset.sync = "1";
        send.href = "mailto:" + D.email + "?subject=" + encodeURIComponent(ui.mail_subject.replace("{km}", k)) + "&body=" + encodeURIComponent(body);
      }
      var sm2 = $(".fx-send-m"); if (sm2 && send) sm2.href = send.href;
      taskBtns.forEach(function (b) {
        var t = b.dataset.task, on = t === "all" ? !sel.length : sel.indexOf(t) > -1;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      writeHash();
    }
    function setKm(v) { v = Math.round(v); if (!isFinite(v)) return; state.km = Math.max(5, Math.min(350, v)); render(); }
    if (num) {
      num.addEventListener("input", function () { var v = parseFloat(num.value.replace(",", ".")); if (isFinite(v) && v >= 5) setKm(v); });
      num.addEventListener("blur", function () { num.value = state.km; });
    }
    if (rng) rng.addEventListener("input", function () { setKm(parseFloat(rng.value)); });
    taskBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.dataset.task;
        if (t === "all") state.tasks = [];
        else { var i = state.tasks.indexOf(t); if (i > -1) state.tasks.splice(i, 1); else state.tasks.push(t); }
        render();
      });
    });
    if (tog) tog.addEventListener("click", function () { list.classList.toggle("show-all"); render(); });
    window.addEventListener("hashchange", function () { readHash(); render(); });
    readHash();
    render();
  }
})();
