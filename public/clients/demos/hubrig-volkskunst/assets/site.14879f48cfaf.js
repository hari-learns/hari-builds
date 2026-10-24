/* Hubrig Volkskunst concept. One IIFE, every feature existence-guarded. Motion only reveals real content. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var cfgEl = $("#cfg");
  var CFG = cfgEl ? JSON.parse(cfgEl.textContent) : {};
  var store = {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ---------- reveals ---------- */
  var reveals = $$(".reveal");
  function activate(el) { el.classList.add("is-in"); }
  function sweep() {
    var vh = window.innerHeight || 800;
    reveals.forEach(function (el) { if (!el.classList.contains("is-in") && el.offsetParent !== null && el.getBoundingClientRect().top < vh * 0.96) activate(el); });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; });
      batch.forEach(function (en, i) { en.target.style.setProperty("--d", Math.min(i * 0.06, 0.36) + "s"); activate(en.target); io.unobserve(en.target); });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(activate); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  $$("[data-hero]").forEach(function (h) { requestAnimationFrame(function () { h.classList.add("is-in"); }); });
  setTimeout(function () { $$("[data-hero]").forEach(function (h) { h.classList.add("is-in"); }); }, 600);

  /* ---------- drawers ---------- */
  var scrim = d.createElement("div"); scrim.className = "scrim"; d.body.appendChild(scrim);
  var openDrawer = null, lastFocus = null;
  function open(dr, opener) {
    if (!dr) return;
    close();
    lastFocus = opener || d.activeElement;
    dr.classList.add("is-open"); scrim.classList.add("is-on"); openDrawer = dr;
    root.style.overflow = "hidden";
    var b = $("#burger"); if (b && dr.id === "drawer") b.setAttribute("aria-expanded", "true");
    var f = $("button, a", dr); if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function close() {
    if (!openDrawer) return;
    openDrawer.classList.remove("is-open"); scrim.classList.remove("is-on");
    root.style.overflow = "";
    var b = $("#burger"); if (b) b.setAttribute("aria-expanded", "false");
    openDrawer = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var burger = $("#burger");
  if (burger) burger.addEventListener("click", function () { open($("#drawer"), burger); });
  $$("[data-close-drawer]").forEach(function (b) { b.addEventListener("click", close); });
  scrim.addEventListener("click", close);
  d.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
  $$("#drawer nav a").forEach(function (a) { a.addEventListener("click", close); });

  /* ---------- dock ---------- */
  var dock = $("#dock");
  if (dock) {
    if (store.get("hv-dock", 0)) dock.hidden = true;
    var dx = $("#dock-x"); if (dx) dx.addEventListener("click", function () { dock.hidden = true; store.set("hv-dock", 1); });
  }

  /* ---------- Merkzettel ---------- */
  var list = store.get("hv-list", []);
  if (!Array.isArray(list)) list = [];
  function has(id) { return list.some(function (x) { return x.id === id; }); }
  function mailHref() {
    var lines = list.map(function (x) { return "- " + x.sku + " – " + x.name + (x.size ? " (" + x.size + ")" : ""); }).join("\n");
    return "mailto:" + CFG.to + "?subject=" + encodeURIComponent(String(CFG.subject || "").replace("{n}", list.length)) +
      "&body=" + encodeURIComponent((CFG.intro || "") + lines + "\n" + (CFG.outro || ""));
  }
  function renderList() {
    $$("[data-count]").forEach(function (c) { c.textContent = list.length; if (list.length) c.removeAttribute("data-zero"); else c.setAttribute("data-zero", ""); });
    var ul = $("[data-list]"), empty = $("[data-empty]"), send = $("[data-send]"), clear = $("[data-clear]");
    if (!ul) return;
    ul.innerHTML = "";
    list.forEach(function (x) {
      var li = d.createElement("li");
      var im = d.createElement("img"); im.src = x.img; im.alt = ""; im.width = 64; im.height = 64; im.loading = "lazy";
      var tx = d.createElement("div"); var b = d.createElement("b"); b.textContent = x.name; var s = d.createElement("span");
      s.textContent = x.sku + (x.size ? " · " + x.size : ""); tx.appendChild(b); tx.appendChild(s);
      var rm = d.createElement("button"); rm.type = "button"; rm.textContent = CFG.remove; rm.setAttribute("aria-label", CFG.remove + ": " + x.name);
      rm.addEventListener("click", function () { toggle(x); });
      li.appendChild(im); li.appendChild(tx); li.appendChild(rm); ul.appendChild(li);
    });
    if (empty) empty.hidden = list.length > 0;
    if (send) { send.href = mailHref(); send.hidden = !list.length; }
    if (clear) clear.hidden = !list.length;
  }
  function toggle(x) {
    if (has(x.id)) list = list.filter(function (y) { return y.id !== x.id; });
    else list.push({ id: x.id, sku: x.sku, name: x.name, size: x.size, img: x.img });
    store.set("hv-list", list); renderList(); syncAdd();
  }
  $$("[data-list-open]").forEach(function (b) { b.addEventListener("click", function () { open($("#listp"), b); }); });
  var clearBtn = $("[data-clear]");
  if (clearBtn) clearBtn.addEventListener("click", function () { list = []; store.set("hv-list", list); renderList(); });
  renderList();

  /* ---------- product dialog ---------- */
  var dlg = $("#pdlg"), cur = null, addBtn = $("#pd-add");
  function syncAdd() {
    if (!addBtn || !cur) return;
    var on = has(cur.id);
    addBtn.querySelector("span").textContent = on ? CFG.added : CFG.add;
    addBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function showItem(x, opener) {
    if (!dlg || !x) return;
    cur = x; lastFocus = opener || null;
    var im = $("#pd-img"); im.src = x.img; im.alt = x.name;
    $("#pd-t").textContent = x.name;
    var bd = $("#pd-badges"); bd.innerHTML = "";
    if (x["new"]) { var s1 = d.createElement("span"); s1.className = "badge badge--new"; s1.textContent = CFG["new"] + " " + x["new"]; bd.appendChild(s1); }
    if (x.last) { var s2 = d.createElement("span"); s2.className = "badge badge--last"; s2.textContent = CFG.last; bd.appendChild(s2); }
    var kv = $("#pd-kv"); kv.innerHTML = "";
    [[CFG.art_no, x.sku], [CFG.size, x.size], [CFG.series, x.series], [CFG.season, x.season]].forEach(function (r) {
      if (!r[1]) return;
      var w = d.createElement("div"), dt = d.createElement("dt"), dd = d.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1]; w.appendChild(dt); w.appendChild(dd); kv.appendChild(w);
    });
    var ds = $("#pd-desc"); ds.innerHTML = "";
    (x.desc || []).forEach(function (t) { var p = d.createElement("p"); p.textContent = t; ds.appendChild(p); });
    $("#pd-mail").href = "mailto:" + CFG.to + "?subject=" + encodeURIComponent(CFG.enq_subject.replace("{sku}", x.sku).replace("{name}", x.name)) +
      "&body=" + encodeURIComponent(CFG.enq_body.replace("{sku}", x.sku).replace("{name}", x.name));
    $("#pd-link").href = x.link;
    syncAdd();
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  if (dlg) {
    d.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-item]");
      if (!b) return;
      var x; try { x = JSON.parse(b.getAttribute("data-item")); } catch (e) { return; }
      showItem(x, b);
    });
    $$("[data-close-dlg]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    if (addBtn) addBtn.addEventListener("click", function () { if (cur) toggle(cur); });
    var h = decodeURIComponent(location.hash || "");
    if (h.indexOf("#a-") === 0) {
      var li = d.getElementById(h.slice(1));
      var b0 = li && $("[data-item]", li);
      if (b0) { li.hidden = false; setTimeout(function () { li.scrollIntoView({ block: "center" }); showItem(JSON.parse(b0.getAttribute("data-item")), b0); }, 200); }
    }
  }

  /* ---------- catalogue filters ---------- */
  var cat = $("[data-catalog]");
  if (cat) {
    var cards = $$(".pc", cat), PAGE = 48, shown = PAGE;
    var st = { season: "", series: "", q: "", nu: false, last: false };
    var P = new URLSearchParams(location.search);
    st.season = P.get("saison") || ""; st.series = P.get("serie") || ""; st.q = P.get("q") || "";
    st.nu = P.get("neu") === "1"; st.last = P.get("letzte") === "1";
    var qIn = $("#q"), more = $("[data-more]"), cnt = $("[data-fcount]"), none = $("[data-none]");
    var nuIn = $("[data-only-new]"), lastIn = $("[data-only-last]");
    var seriesSeason = {};
    $$("[data-series]").forEach(function (c) { if (c.dataset.series) seriesSeason[c.dataset.series] = c.dataset.seasonOf; });
    if (st.series && !st.season) st.season = seriesSeason[st.series] || "";
    function norm(s) { return String(s || "").toLowerCase().trim(); }
    function apply(keepShown) {
      if (!keepShown) shown = PAGE;
      var q = norm(st.q).split(/\s+/).filter(Boolean), n = 0;
      var hit = cards.filter(function (c) {
        var ok = (!st.season || c.dataset.s === st.season) && (!st.series || c.dataset.r === st.series) &&
          (!st.nu || c.dataset.n === "1") && (!st.last || c.dataset.l === "1");
        if (ok && q.length) { var hay = c.dataset.q; ok = q.every(function (w) { return hay.indexOf(w) > -1; }); }
        return ok;
      });
      cards.forEach(function (c) { c.hidden = true; });
      hit.forEach(function (c, i) { if (i < shown) { c.hidden = false; n++; } });
      if (cnt) cnt.textContent = hit.length === 1 ? CFG.results_one : CFG.results.replace("{n}", hit.length);
      if (none) none.hidden = hit.length > 0;
      if (more) { var rest = hit.length - shown; more.hidden = rest <= 0; more.textContent = CFG.more.replace("{n}", Math.min(rest, PAGE)); }
      $$("[data-season]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.season === st.season ? "true" : "false"); });
      $$("[data-series]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.series === st.series ? "true" : "false");
        b.hidden = !!(b.dataset.series && st.season && b.dataset.seasonOf !== st.season);
      });
      if (qIn && qIn.value !== st.q) qIn.value = st.q;
      if (nuIn) nuIn.checked = st.nu; if (lastIn) lastIn.checked = st.last;
      var u = new URLSearchParams();
      if (st.season) u.set("saison", st.season); if (st.series) u.set("serie", st.series); if (st.q) u.set("q", st.q);
      if (st.nu) u.set("neu", "1"); if (st.last) u.set("letzte", "1");
      try { history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "") + (location.hash.indexOf("#a-") === 0 ? "" : location.hash)); } catch (e) { /* file: */ }
      sweep();
    }
    $$("[data-season]").forEach(function (b) { b.addEventListener("click", function () { st.season = b.dataset.season; if (st.series && seriesSeason[st.series] !== st.season && st.season) st.series = ""; apply(); }); });
    $$("[data-series]").forEach(function (b) { b.addEventListener("click", function () { st.series = b.dataset.series; if (st.series) st.season = seriesSeason[st.series] || st.season; apply(); }); });
    var t;
    if (qIn) qIn.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { st.q = qIn.value; apply(); }, 120); });
    if (nuIn) nuIn.addEventListener("change", function () { st.nu = nuIn.checked; apply(); });
    if (lastIn) lastIn.addEventListener("change", function () { st.last = lastIn.checked; apply(); });
    var rs = $("[data-reset]"); if (rs) rs.addEventListener("click", function () { st = { season: "", series: "", q: "", nu: false, last: false }; apply(); });
    if (more) more.addEventListener("click", function () { shown += PAGE; apply(true); });
    if (location.hash.indexOf("#a-") !== 0) apply(); else { apply(); }
  }

  /* ---------- Werksverkauf open now (Europe/Berlin, from their published hours) ---------- */
  var os = $$("[data-openstate]");
  if (os.length && CFG.hours) {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit", hour12: false }).formatToParts(new Date());
      var g = {}; parts.forEach(function (p) { g[p.type] = p.value; });
      var wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g.weekday);
      var ymd = g.year + "-" + g.month + "-" + g.day, hm = (g.hour === "24" ? "00" : g.hour) + ":" + g.minute;
      var state = "closed", label = CFG.closed_now;
      if (CFG.holiday && ymd >= CFG.holiday.from && ymd <= CFG.holiday.to) { state = "holiday"; label = CFG.holiday_now; }
      else if (CFG.hours.days.indexOf(wd) > -1 && hm >= CFG.hours.open && hm < CFG.hours.close) { state = "open"; label = CFG.open_now; }
      os.forEach(function (o) { o.setAttribute("data-state", state); var l = $("[data-openlabel]", o); if (l) l.textContent = label + " · " + CFG.hours.time; });
    } catch (e) { /* keep static hours */ }
  }
})();
