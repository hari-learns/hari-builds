(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function el(tag, attrs, html) { var n = d.createElement(tag); if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]); if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sht-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sht-dock", "1"); }); });

  /* reveals with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(e) { e.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (e) { if (io) io.observe(e); else activate(e); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (e) { if (!e.classList.contains("is-in") && e.getBoundingClientRect().top < vh * 0.96) activate(e); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* ---------------- moodboard + stijlkiezer ---------------- */
  var dataEl = $("#tool-data");
  if (!dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), P = DATA.projects, UI = DATA.ui, BYID = {};
  P.forEach(function (p) { BYID[p.i] = p; });
  var KEY = "sht-mood-v1", memStore = [];
  function loadMood() { var v = safe(function () { return JSON.parse(localStorage.getItem(KEY) || "[]"); }); return (v && v.filter ? v : memStore).filter(function (i) { return BYID[i]; }); }
  var mood = loadMood();
  function saveMood() { memStore = mood.slice(); safe(function () { localStorage.setItem(KEY, JSON.stringify(mood)); }); }
  function inMood(id) { return mood.indexOf(id) > -1; }
  function toggleMood(id) { var i = mood.indexOf(id); if (i > -1) mood.splice(i, 1); else mood.push(id); saveMood(); syncMood(); }
  function thumb(p) { return DATA.base + p.p[0][0]; }
  var tools = [];
  function syncMood() {
    $$("[data-mood-n]").forEach(function (n) { n.textContent = mood.length; });
    $$("[data-mood]").forEach(function (b) { var on = inMood(b.getAttribute("data-mood")); b.setAttribute("aria-pressed", on ? "true" : "false"); var s = $("span", b); if (s) s.textContent = on ? UI.saved : UI.save; });
    $$(".heart[data-id]").forEach(function (b) { var on = inMood(b.getAttribute("data-id")); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", (on ? UI.saved : UI.save) + ": " + BYID[b.getAttribute("data-id")].c); });
    if (lbCur) { var on = inMood(lbCur.i); lbHeart.setAttribute("aria-pressed", on ? "true" : "false"); $("span", lbHeart).textContent = on ? UI.saved : UI.save; }
    renderSheet();
  }

  /* moodboard sheet */
  var sheet = $("#mood"), mlist = $("#mlist"), mempty = $("#mempty"), mform = $("#mform"), msend = $("#msend"), mcopy = $("#mcopy"), project = "";
  function mailText() {
    var f = mform ? mform.elements : {}, lines = [UI.mail_intro, ""];
    mood.slice(0, 12).forEach(function (id, i) { var p = BYID[id]; lines.push((i + 1) + ". " + p.c); lines.push("   " + p.p[0][4]); });
    lines.push("");
    var who = [];
    if (f.name && f.name.value) who.push(UI.f_name + ": " + f.name.value);
    if (f.city && f.city.value) who.push(UI.f_city + ": " + f.city.value);
    if (f.phone && f.phone.value) who.push(UI.f_phone + ": " + f.phone.value);
    if (project) who.push(UI.f_project + ": " + project);
    if (who.length) { lines.push(who.join("\n")); lines.push(""); }
    lines.push(UI.mail_outro);
    if (f.name && f.name.value) lines.push(f.name.value);
    return lines.join("\n");
  }
  function renderSheet() {
    if (!mlist) return;
    mlist.innerHTML = "";
    mood.forEach(function (id) {
      var p = BYID[id];
      var row = el("div", { "class": "mitem" }, '<img src="' + thumb(p) + '" alt="" width="64" height="80"><p>' + esc(p.c) + '</p>');
      var rm = el("button", { type: "button", "aria-label": UI.remove + ": " + p.c }, "&times;");
      rm.addEventListener("click", function () { toggleMood(id); });
      row.appendChild(rm); mlist.appendChild(row);
    });
    if (mempty) mempty.hidden = mood.length > 0;
    if (mform) mform.hidden = mood.length === 0;
    if (msend) {
      msend.setAttribute("href", "mailto:" + DATA.mail + "?subject=" + encodeURIComponent(UI.subject) + "&body=" + encodeURIComponent(mailText()));
      msend.style.display = mood.length ? "" : "none"; if (mcopy) mcopy.style.display = mood.length ? "" : "none";
    }
  }
  if (mform) {
    mform.addEventListener("input", renderSheet);
    $$("[data-proj]", mform).forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true"; $$("[data-proj]", mform).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        project = on ? "" : b.getAttribute("data-proj"); b.setAttribute("aria-pressed", on ? "false" : "true"); renderSheet();
      });
    });
  }
  if (mcopy) mcopy.addEventListener("click", function () {
    var t = UI.subject + "\n\n" + mailText();
    var ok = function () { var o = mcopy.textContent; mcopy.textContent = mcopy.getAttribute("data-done"); setTimeout(function () { mcopy.textContent = o; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { });
    else { var ta = el("textarea"); ta.value = t; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); ta.remove(); ok(); }
  });
  function openDlg(dlg) { if (!dlg) return; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); root.style.overflow = "hidden"; }
  function closeDlg(dlg) { if (!dlg) return; if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  [sheet, $("#lb")].forEach(function (dlg) { if (dlg) dlg.addEventListener("close", function () { root.style.overflow = ""; }); });
  $$("[data-mood-open]").forEach(function (b) { b.addEventListener("click", function () { renderSheet(); openDlg(sheet); }); });
  $$("[data-mood-close]").forEach(function (b) { b.addEventListener("click", function () { closeDlg(sheet); }); });
  $$("[data-mood]").forEach(function (b) { b.addEventListener("click", function () { toggleMood(b.getAttribute("data-mood")); }); });
  [sheet, $("#lb")].forEach(function (dlg) { if (dlg) dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(dlg); }); });

  /* lightbox */
  var lb = $("#lb"), strip = $("#lb-strip"), lbCap = $("#lb-cap"), lbCount = $("#lb-count"), lbHeart = $("#lb-heart"), lbCur = null, lbI = 0;
  function lbGo(i) { var n = lbCur.p.length; lbI = (i + n) % n; var f = strip.children[lbI]; if (f) strip.scrollTo({ left: f.offsetLeft - strip.offsetLeft, behavior: reduce ? "auto" : "smooth" }); lbCount.textContent = (lbI + 1) + " / " + n; }
  function openLb(id) {
    lbCur = BYID[id]; lbCap.textContent = lbCur.c; strip.innerHTML = "";
    lbCur.p.forEach(function (ph, i) { var fg = el("figure", null, '<img src="' + DATA.base + ph[1] + '" width="' + ph[2] + '" height="' + ph[3] + '" alt="' + esc(lbCur.c) + '"' + (i ? ' loading="lazy"' : "") + ">"); strip.appendChild(fg); });
    openDlg(lb); strip.scrollLeft = 0; lbI = 0; lbCount.textContent = "1 / " + lbCur.p.length;
    var on = inMood(id); lbHeart.setAttribute("aria-pressed", on ? "true" : "false"); $("span", lbHeart).textContent = on ? UI.saved : UI.save;
    $("[data-lb-close]", lb).focus();
  }
  if (lb) {
    strip.addEventListener("scroll", function () { if (!lbCur) return; var w = strip.clientWidth || 1, i = Math.round(strip.scrollLeft / w); lbCount.textContent = (i + 1) + " / " + lbCur.p.length; lbI = i; }, { passive: true });
    $("[data-lb-prev]", lb).addEventListener("click", function () { lbGo(lbI - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { lbGo(lbI + 1); });
    $("[data-lb-close]", lb).addEventListener("click", function () { closeDlg(lb); });
    lbHeart.addEventListener("click", function () { if (lbCur) toggleMood(lbCur.i); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") lbGo(lbI + 1); if (e.key === "ArrowLeft") lbGo(lbI - 1); });
  }

  /* the tool */
  function Tool(root_) {
    var self = this, kind = root_.getAttribute("data-kind"), limit = parseInt(root_.getAttribute("data-limit"), 10) || 0, fixed = root_.getAttribute("data-fixed") === "1";
    var sel = {}, facetsEl = $("[data-facets]", root_), resEl = $("[data-results]", root_), countEl = $("[data-count]", root_), resetEl = $("[data-reset]", root_), moreEl = $("[data-more]", root_), seg = $("[data-seg]", root_);
    var openMore = false;
    function pool() { return P.filter(function (p) { return p.k === kind; }); }
    function matches(p, skip) {
      var ok = true;
      Object.keys(sel).forEach(function (f) { if (f === skip) return; var s = sel[f]; if (!s.length) return; if (!p.f[f] || !s.some(function (v) { return p.f[f].indexOf(v) > -1; })) ok = false; });
      return ok;
    }
    function values(f) { var m = {}; pool().forEach(function (p) { (p.f[f] || []).forEach(function (v) { m[v] = (m[v] || 0) + 1; }); }); return Object.keys(m).sort(function (a, b) { return m[b] - m[a] || a.localeCompare(b); }).map(function (v) { return [v, m[v]]; }); }
    function group(f, idx) {
      var vals = values(f); if (!vals.length) return null;
      var g = el("fieldset", { "class": "fgroup" }, "<legend>" + esc(f) + "</legend>"), ch = el("div", { "class": "chips" + (idx ? " scroller" : "") });
      vals.forEach(function (vv) {
        var on = (sel[f] || []).indexOf(vv[0]) > -1;
        var n = pool().filter(function (p) { return matches(p, f) && (p.f[f] || []).indexOf(vv[0]) > -1; }).length;
        var b = el("button", { type: "button", "class": "chip", "aria-pressed": on ? "true" : "false" }, esc(vv[0]) + " <small>" + n + "</small>");
        if (!on && n === 0) b.setAttribute("disabled", "");
        b.addEventListener("click", function () { var s = sel[f] || (sel[f] = []), i = s.indexOf(vv[0]); if (i > -1) s.splice(i, 1); else s.push(vv[0]); render(); });
        ch.appendChild(b);
      });
      g.appendChild(ch); return g;
    }
    function renderFacets() {
      facetsEl.innerHTML = "";
      var fs = DATA.facets[kind], main = el("div", { "class": "facets facets--main" }), more = el("details", { "class": "more" }), mf = el("div", { "class": "facets" });
      var g0 = group(fs[0], true); if (g0) main.appendChild(g0);
      facetsEl.appendChild(main);
      fs.slice(1).forEach(function (f) { var g = group(f); if (g) mf.appendChild(g); });
      more.appendChild(el("summary", null, UI.more_filters)); more.appendChild(mf);
      if (openMore || Object.keys(sel).some(function (f) { return f !== fs[0] && sel[f].length; })) more.setAttribute("open", "");
      more.addEventListener("toggle", function () { openMore = more.open; });
      facetsEl.appendChild(more);
    }
    function shortTitle(p) {
      var t = p.f.Type.join(" + "), extra = p.k === "trappen" ? (p.f.Hout || []).slice(0, 1) : (p.f.Model || []).slice(0, 2);
      return [t].concat(extra).join(" · ");
    }
    function tagsOf(p) {
      var out = [];
      Object.keys(p.f).forEach(function (k) { if (k === "Type") return; (p.f[k] || []).forEach(function (v) { if (p.k === "trappen" && k === "Hout") return; if (p.k === "deuren" && k === "Model") return; out.push(v); }); });
      return out;
    }
    function card(p) {
      var on = inMood(p.i), ph = p.p[0], n = p.p.length;
      var li = el("article", { "class": "res" });
      li.innerHTML = '<button type="button" class="res__open" data-open="' + p.i + '" aria-label="' + esc(UI.view + ": " + p.c) + '"><div class="res__img"><img src="' + DATA.base + ph[0] + '" alt="' + esc(p.c) + '" loading="lazy" decoding="async" width="420" height="525"></div>' +
        '<span class="res__n">' + n + " " + (n === 1 ? UI.photo : UI.photos) + "</span></button>" +
        '<button type="button" class="heart" data-id="' + p.i + '" aria-pressed="' + (on ? "true" : "false") + '" aria-label="' + esc((on ? UI.saved : UI.save) + ": " + p.c) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.7 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.3 0 5.4 3.1 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg></button>' +
        '<div class="res__b"><p class="res__t">' + esc(shortTitle(p)) + '</p><div class="res__tags">' + tagsOf(p).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div></div>";
      $("[data-open]", li).addEventListener("click", function () { openLb(p.i); });
      $(".heart", li).addEventListener("click", function () { toggleMood(p.i); });
      return li;
    }
    function render() {
      renderFacets();
      var all = pool(), list = all.filter(function (p) { return matches(p); });
      var shown = limit ? list.slice(0, limit) : list;
      countEl.textContent = list.length + " " + UI.of + " " + all.length + " " + UI.results;
      var any = Object.keys(sel).some(function (f) { return sel[f].length; }); resetEl.hidden = !any;
      resEl.innerHTML = "";
      if (!list.length) resEl.appendChild(el("p", { "class": "empty" }, esc(UI.none)));
      shown.forEach(function (p) { resEl.appendChild(card(p)); });
      if (moreEl) moreEl.hidden = !limit;
    }
    resetEl.addEventListener("click", function () { sel = {}; render(); });
    $$("button", seg).forEach(function (b) {
      b.addEventListener("click", function () { kind = b.getAttribute("data-kind"); sel = {}; $$("button", seg).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); render(); });
    });
    if (fixed) seg.hidden = true;
    var q = safe(function () { return new URLSearchParams(location.search).get("k"); });
    if (q === "trappen" || q === "deuren") { kind = q; $$("button", seg).forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-kind") === kind ? "true" : "false"); }); }
    render();
  }
  $$("[data-tool]").forEach(function (t) { tools.push(new Tool(t)); });
  syncMood();
})();
