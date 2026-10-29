(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var dataEl = $("#ldata"); if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent), BY = {}; D.forEach(function (l) { BY[l.id] = l; });
  var BASE = document.body.dataset.base, WA = document.body.dataset.wa, MAIL = document.body.dataset.mail;
  var LIVE = "https://landsandlands.com/";
  var PHONE = "+919280234436";

  function inr(n) { return n >= 1e7 ? "₹" + (+(n / 1e7).toFixed(2)) + " Cr" : "₹" + (+(n / 1e5).toFixed(1)) + " L"; }
  function bhk(b) { return b.replace(/\s*BHK/i, " BHK").replace(/\s+/g, " ").trim(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function img(l, w) { return BASE + "/assets/img/l/" + l.im + "-" + w + ".webp"; }
  function waUrl(t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.500s-7.500-4.600-9.200-9.400C1.600 7.700 4 4.500 7.200 4.500c1.900 0 3.500 1 4.800 2.800 1.300-1.800 2.900-2.800 4.800-2.800 3.200 0 5.600 3.200 4.400 6.600-1.700 4.800-9.200 9.400-9.200 9.400z"/></svg>';
  var WAI = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.8-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.2-.4.7-1.300.1-.2 0-.3 0-.5l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.200c0 1.300.9 2.600 1 2.800.1.2 1.800 2.800 4.400 3.900 1.600.7 2.300.8 3.100.6.500-.1 1.500-.6 1.700-1.200.2-.6.2-1.100.2-1.200-.1-.1-.3-.2-.5-.3z"/></svg>';

  /* ---------- shortlist (this device only) ---------- */
  var KEY = "ll-shortlist", SL = [];
  try { SL = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (i) { return BY[i]; }); } catch (e) { SL = []; }
  function saveSL() { try { localStorage.setItem(KEY, JSON.stringify(SL)); } catch (e) {} }
  function sync() {
    $$("[data-save]").forEach(function (b) { b.setAttribute("aria-pressed", SL.indexOf(b.dataset.save) >= 0 ? "true" : "false"); });
    var t = $("#tray"); if (t) { t.classList.toggle("on", SL.length > 0); $("#tray-n").textContent = SL.length; }
  }
  function toggle(id) { var i = SL.indexOf(id); if (i >= 0) SL.splice(i, 1); else SL.push(id); saveSL(); sync(); if ($("#tray-sheet").classList.contains("open")) renderTray(); }

  /* ---------- card markup (same as the static cards) ---------- */
  function enquiry(l) { return "Hi Lands & Lands, I saw \"" + l.t + "\" (" + l.l + ", " + l.p + ") on your website and would like to know more."; }
  function card(l, note) {
    return '<article class="lcard" data-id="' + l.id + '"><div class="ph"><img src="' + img(l, 960) + '" srcset="' + img(l, 480) + ' 480w, ' + img(l, 960) + ' 960w" sizes="(max-width:639px) 92vw, (max-width:999px) 46vw, 31vw" width="960" height="640" alt="' + esc(l.t + ", " + l.a) + '" loading="lazy" decoding="async"><div class="badges"><span class="bdg y">' + esc(l.tg) + '</span>' + (l.st ? '<span class="bdg">' + esc(l.st) + '</span>' : "") + '</div></div><div class="body"><div class="price">' + esc(l.p) + (l.pc ? "<small>" + esc(l.es) + "</small>" : "") + '</div>' + (note ? '<p class="fitn ' + note[0] + '">' + esc(note[1]) + '</p>' : "") + '<h3><button type="button" data-open="' + l.id + '">' + esc(l.t) + '</button></h3><div class="specs"><span>' + esc(bhk(l.b)) + "</span><span>" + esc(l.s) + '</span></div><p class="loc">' + esc(l.l) + '</p><div class="acts"><a class="btn btn-sm btn-wa" href="' + waUrl(enquiry(l)) + '" target="_blank" rel="noopener">' + WAI + 'Enquire</a><button type="button" class="heart" data-save="' + l.id + '" aria-pressed="false" aria-label="Save ' + esc(l.t) + ' to my shortlist">' + HEART + "</button></div></div></article>";
  }

  /* ---------- sheets ---------- */
  var lastFocus = null;
  function openSheet(el) { lastFocus = document.activeElement; el.classList.add("open"); el.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden"; var x = $(".x", el); x && x.focus(); }
  function closeSheets() { $$(".sheet.open").forEach(function (s) { s.classList.remove("open"); s.setAttribute("aria-hidden", "true"); }); document.documentElement.style.overflow = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function renderSheet(l) {
    var live = LIVE + (l.pg === "plots" ? "plots-for-sale-in-coimbatore" : "apartments-and-villas-for-sale-in-coimbatore");
    $("#sheet-body").innerHTML = '<div class="ph"><img src="' + img(l, 960) + '" width="960" height="640" alt="' + esc(l.t + ", " + l.a) + '"></div><div class="in"><div class="badges" style="position:static"><span class="bdg y">' + esc(l.tg) + "</span>" + (l.st ? '<span class="bdg">' + esc(l.st) + "</span>" : "") + '</div><h2 style="font-size:32px">' + esc(l.t) + '</h2><div class="price">' + esc(l.p) + (l.pc ? "<small>" + esc(l.es) + "</small>" : "") + '</div><dl class="kv"><dt>Location</dt><dd>' + esc(l.l) + "</dd><dt>Bedrooms</dt><dd>" + esc(bhk(l.b) || "Not stated") + "</dd><dt>Size</dt><dd>" + esc(l.s) + "</dd><dt>Type</dt><dd>" + (l.ty === "plot" ? "Plot / residence" : l.ty === "villa" ? "Villa" : "Apartment") + '</dd></dl><div class="btn-row"><a class="btn btn-wa" href="' + waUrl(enquiry(l)) + '" target="_blank" rel="noopener">' + WAI + 'Enquire on WhatsApp</a><a class="btn btn-ghost" href="tel:' + PHONE + '">Call</a></div><button type="button" class="btn btn-ghost" data-save="' + l.id + '" aria-pressed="false">Save to my shortlist</button><p class="note">Price and details as on landsandlands.com (snapshot 29 Oct 2026). <a href="' + live + '" target="_blank" rel="noopener">See it on their live site</a>.</p></div>';
    sync();
    var sb = $("#sheet-body [data-save]"); if (sb) { var upd = function () { sb.textContent = SL.indexOf(l.id) >= 0 ? "Saved: remove from shortlist" : "Save to my shortlist"; }; upd(); sb.addEventListener("click", function () { setTimeout(upd, 0); }); }
  }
  function renderTray() {
    var items = SL.map(function (i) { return BY[i]; });
    if (!items.length) { $("#tray-body").innerHTML = '<div class="in"><h2 style="font-size:30px">My shortlist</h2><p>Nothing saved yet. Tap the heart on any property.</p></div>'; return; }
    var lis = items.map(function (l) { return '<li><img src="' + img(l, 480) + '" width="480" height="320" alt=""><div><b>' + esc(l.t) + "</b><span>" + esc(l.a) + " · " + esc(l.p) + '</span></div><button type="button" data-save="' + l.id + '" aria-label="Remove ' + esc(l.t) + '">×</button></li>'; }).join("");
    $("#tray-body").innerHTML = '<div class="in"><h2 style="font-size:30px">My shortlist (' + items.length + ')</h2><ul class="sl">' + lis + '</ul><label class="fld"><span>Your name (optional)</span><input type="text" id="t-name" autocomplete="name"></label><label class="fld"><span>Phone (optional)</span><input type="tel" id="t-phone" autocomplete="tel"></label><label class="fld"><span>Note</span><textarea id="t-note" placeholder="Preferred visit days, financing, anything else."></textarea></label><div class="btn-row"><a class="btn btn-wa" id="t-wa" target="_blank" rel="noopener" href="#">' + WAI + 'Send on WhatsApp</a><a class="btn btn-ghost" id="t-mail" href="#">Send by email</a></div><p class="note">This writes your message for you and opens WhatsApp or your mail app. Nothing is stored on a server.</p></div>';
    var bud = budgetNote();
    function msg() {
      var s = "Hi Lands & Lands, I shortlisted these on your website and would like to arrange site visits:\n";
      items.forEach(function (l, k) { s += (k + 1) + ". " + l.t + " (" + l.l + ") - " + l.p + " - " + bhk(l.b) + ", " + l.s + "\n"; });
      if (bud) s += "\nMy budget: " + bud + ".";
      var n = $("#t-name").value.trim(), p = $("#t-phone").value.trim(), no = $("#t-note").value.trim();
      if (no) s += "\n" + no; if (n) s += "\n\nName: " + n; if (p) s += "\nPhone: " + p;
      return s;
    }
    function upd() { $("#t-wa").href = waUrl(msg()); $("#t-mail").href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Site visit request: " + items.length + " shortlisted properties") + "&body=" + encodeURIComponent(msg()); }
    $("#tray-body").addEventListener("input", upd); upd();
  }

  document.addEventListener("click", function (e) {
    var s = e.target.closest("[data-save]"); if (s) { toggle(s.dataset.save); return; }
    var o = e.target.closest("[data-open]"); if (o) { renderSheet(BY[o.dataset.open]); openSheet($("#sheet")); return; }
    if (e.target.closest("[data-sheet-close]")) { closeSheets(); return; }
    if (e.target.closest("#tray-open")) { renderTray(); openSheet($("#tray-sheet")); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $(".sheet.open")) closeSheets();
    if (e.key === "Tab") { var sh = $(".sheet.open .panel"); if (!sh) return; var f = $$("a[href],button,input,textarea,select", sh).filter(function (n) { return !n.disabled && n.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });

  var P = new URLSearchParams(location.search);
  var budgetNote = function () { return ""; };

  /* ---------- home quick strip ---------- */
  var q = $("#quick");
  if (q) {
    var qt = $("#q-type"), qm = $("#q-max"), qa = $("#q-area"), go = $("#q-go span");
    var count = function () {
      var mx = +qm.value, n = D.filter(function (l) { return (!qt.value || l.ty === qt.value) && (!qa.value || l.a === qa.value) && (!mx || l.n <= mx); }).length;
      go.textContent = n ? "Show " + n + (n === 1 ? " match" : " matches") : "See nearest options";
    };
    [qt, qm, qa].forEach(function (x) { x.addEventListener("change", count); }); count();
    q.addEventListener("submit", function (e) { e.preventDefault(); var p = []; if (qt.value) p.push("type=" + qt.value); if (+qm.value) p.push("max=" + qm.value); if (qa.value) p.push("area=" + encodeURIComponent(qa.value)); location.href = q.dataset.href + (p.length ? "?" + p.join("&") : ""); });
  }

  /* ---------- properties: browse ---------- */
  var grid = $("#bgrid");
  if (grid) {
    var cards = $$(".lcard", grid), tab = "", area = "", sort = "";
    var bt = $$("[data-tab]"), ba = $("#b-area"), bs = $("#b-sort"), cnt = $("#b-count"), emp = $("#b-empty");
    var order = cards.slice();
    var run = function () {
      var shown = 0;
      cards.forEach(function (c) { var ok = (!tab || c.dataset.page === tab) && (!area || c.dataset.area === area); c.hidden = !ok; if (ok) shown++; });
      var arr = order.slice(); if (sort) arr.sort(function (a, b) { return (a.dataset.price - b.dataset.price) * (sort === "lo" ? 1 : -1); });
      arr.forEach(function (c) { grid.appendChild(c); });
      cnt.textContent = shown + (shown === 1 ? " property" : " properties") + (area ? " in " + area : ""); emp.hidden = shown > 0;
    };
    bt.forEach(function (b) { b.addEventListener("click", function () { tab = b.dataset.tab; bt.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); }); });
    ba.addEventListener("change", function () { area = ba.value; run(); }); bs.addEventListener("change", function () { sort = bs.value; run(); });
    if (P.get("area") && D.some(function (l) { return l.a === P.get("area"); })) { ba.value = P.get("area"); area = ba.value; }
    run();
    if (P.get("open") && BY[P.get("open")]) { renderSheet(BY[P.get("open")]); openSheet($("#sheet")); }
  }

  /* ---------- budget finder ---------- */
  var fit = $("#f-fit");
  if (fit) {
    var PRE = [[5e6, "₹50 L"], [7.5e6, "₹75 L"], [1e7, "₹1 Cr"], [1.5e7, "₹1.5 Cr"], [2.5e7, "₹2.5 Cr"], [5e7, "₹5 Cr"], [0, "Any"]];
    var st = { max: +P.get("max") || 0, type: P.get("type") || "", bhk: +P.get("bhk") || 0, area: P.get("area") || "" };
    var fb = $("#f-budget"), cu = $("#f-custom"), fa = $("#f-area");
    fb.innerHTML = PRE.map(function (p) { return '<button type="button" class="chip" data-v="' + p[0] + '" aria-pressed="false">' + (p[0] ? "Up to " : "") + p[1] + "</button>"; }).join("");
    budgetNote = function () { return st.max ? "up to " + inr(st.max) : ""; };
    var setPressed = function (box, v) { $$(".chip", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v) === String(v) ? "true" : "false"); }); };
    var render = function () {
      var base = D.filter(function (l) { return (!st.type || l.ty === st.type) && (!st.area || l.a === st.area) && (!st.bhk || !l.be.length || l.be.indexOf(st.bhk) >= 0); });
      var fits = base.filter(function (l) { return !st.max || l.n <= st.max; }).sort(function (a, b) { return a.n - b.n; });
      var near = st.max ? base.filter(function (l) { return l.n > st.max && l.n <= st.max * 1.15; }).sort(function (a, b) { return a.n - b.n; }) : [];
      fit.innerHTML = fits.map(function (l) { return card(l, st.max ? ["ok", l.n === st.max ? "Right at your budget" : inr(st.max - l.n) + " under your budget"] : null); }).join(""); $("#f-near").innerHTML = near.map(function (l) { return card(l, ["over", inr(l.n - st.max) + " above your budget"]); }).join(""); $("#f-near-h").hidden = !near.length;
      $("#f-count").textContent = fits.length + (fits.length === 1 ? " listing fits" : " listings fit") + (st.max ? " up to " + inr(st.max) : "") + (st.area ? " in " + st.area : "") + " (of " + D.length + ")";
      $("#f-empty").hidden = fits.length > 0;
      var d = []; if (st.max) d.push("budget up to " + inr(st.max)); if (st.type) d.push(st.type === "plot" ? "plots/residences" : st.type === "villa" ? "villas" : "apartments"); if (st.bhk) d.push(st.bhk + " BHK"); if (st.area) d.push(st.area);
      $("#f-ask").href = waUrl("Hi Lands & Lands, I could not find an exact match on your website. I am looking for: " + (d.join(", ") || "a property in Coimbatore") + ".");
      sync();
      try { var p = []; if (st.max) p.push("max=" + st.max); if (st.type) p.push("type=" + st.type); if (st.bhk) p.push("bhk=" + st.bhk); if (st.area) p.push("area=" + encodeURIComponent(st.area)); history.replaceState(null, "", location.pathname + (p.length ? "?" + p.join("&") : "")); } catch (e) {}
    };
    var ui = function () { var pre = PRE.some(function (p) { return p[0] === st.max; }); setPressed(fb, pre ? st.max : "none"); if (!pre && st.max) cu.value = +(st.max / 1e5).toFixed(2); setPressed($("#f-type"), st.type); setPressed($("#f-bhk"), st.bhk); fa.value = st.area; };
    fb.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; st.max = +b.dataset.v; cu.value = ""; ui(); render(); });
    cu.addEventListener("input", function () { var v = parseFloat(cu.value.replace(/,/g, "")); st.max = v > 0 ? Math.round(v * 1e5) : 0; setPressed(fb, "none"); render(); });
    $("#f-type").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; st.type = b.dataset.v; ui(); render(); });
    $("#f-bhk").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; st.bhk = +b.dataset.v; ui(); render(); });
    fa.addEventListener("change", function () { st.area = fa.value; render(); });
    $("#f-reset").addEventListener("click", function () { st = { max: 0, type: "", bhk: 0, area: "" }; cu.value = ""; ui(); render(); });
    ui(); render();
  }
  sync();
})();
