/* Bhatnagars concept: menu, reveals, listing cards + sheet, saved shortlist, properties filters, Shortlist Guide. No dependencies. */
(function () {
  "use strict";
  var CFG = window.BH_CFG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = document.body.getAttribute("data-page");
  var NOW = new Date("2026-10-29T12:00:00");

  /* ---------- tiny helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function inr(n) { n = Math.round(n); var s = String(n); if (s.length <= 3) return s; var h = s.slice(0, -3), t = s.slice(-3), p = []; while (h.length > 2) { p.unshift(h.slice(-2)); h = h.slice(0, -2); } if (h) p.unshift(h); return p.join(",") + "," + t; }
  function trim(x) { return x.replace(/\.?0+$/, ""); }
  function price(l) { var v = l.p; if (!v) return "Price on request"; if (l.o === "r") return "₹" + inr(v); if (v >= 1e7) return "₹" + trim((v / 1e7).toFixed(2)) + " Cr"; return "₹" + trim((v / 1e5).toFixed(2)) + " L"; }
  function persq(l) { return l.p && l.a ? Math.round(l.p / l.a) : null; }
  function sub(l) { return [l.pj, l.h].filter(Boolean).join(" · "); }
  function bhk(l) { return l.k === "res" && l.b ? (l.b % 1 ? l.b : String(l.b)) : ""; }
  var BY = {}; (window.BH_DATA || []).forEach(function (l) { BY[l.i] = l; });
  var DATA = window.BH_DATA || [];
  var IMG = (CFG.base || "") + "/assets/img/l/";
  var load = function (k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  var store = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
  var SAVED = (load("bh-saved-bhatnagars") || []).filter(function (i) { return BY[i]; });
  function wa(text) { return "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(text); }
  function track(name) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "event/" + name, title: name, event: true }); } catch (e) { /* none */ } }

  var ICO = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.700 4 4.500 7.200 4.500c1.900 0 3.500 1 4.800 2.800 1.300-1.800 2.900-2.800 4.800-2.800 3.200 0 5.600 3.200 4.400 6.600-1.700 4.800-9.200 9.400-9.200 9.400z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.600 15L2 22l5.200-1.400A10 10 0 1 0 12 2zm0 18.200a8.200 8.200 0 0 1-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.8-1.700-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.2-.4.7-1.300.1-.2 0-.3 0-.5l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200c0 1.300.9 2.600 1 2.800.1.200 1.800 2.800 4.400 3.900 1.600.7 2.300.8 3.100.6.500-.1 1.500-.6 1.700-1.200.2-.6.2-1.100.2-1.200-.1-.1-.3-.2-.5-.3z"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'
  };

  /* ---------- menu ---------- */
  var mnav = $("#mnav"), burger = $("#burger");
  function mopen(o) { mnav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o ? "true" : "false"); document.documentElement.style.overflow = o ? "hidden" : ""; if (o) { var c = $(".x", mnav); if (c) c.focus(); } else burger.focus(); }
  if (burger) { burger.addEventListener("click", function () { mopen(true); }); $$("[data-mclose]").forEach(function (b) { b.addEventListener("click", function () { mopen(false); }); }); document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mnav.classList.contains("open")) mopen(false); }); }

  /* ---------- reveals ---------- */
  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !rm) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    $$(".rv").forEach(function (n) { io.observe(n); });
  } else $$(".rv").forEach(function (n) { n.classList.add("in"); });

  /* ---------- saved ---------- */
  function isSaved(i) { return SAVED.indexOf(i) > -1; }
  function toggleSave(i) { var k = SAVED.indexOf(i); if (k > -1) SAVED.splice(k, 1); else { SAVED.push(i); track("save"); } store("bh-saved-bhatnagars", SAVED); sync(); }
  function sync() {
    $$(".heart").forEach(function (b) { var on = isSaved(+b.getAttribute("data-id")); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", (on ? "Remove from shortlist: " : "Save to shortlist: ") + (BY[+b.getAttribute("data-id")] || {}).t); });
    $$("[data-save]").forEach(function (b) { var on = isSaved(+b.getAttribute("data-save")); b.textContent = on ? "Saved to shortlist" : "Save to shortlist"; b.setAttribute("aria-pressed", on ? "true" : "false"); });
    var tray = $("#tray"); if (tray) { tray.hidden = !SAVED.length; $("#tray-n").textContent = SAVED.length + (SAVED.length === 1 ? " home saved" : " homes saved"); }
    var dl = $("#dlg-list"); if (dl && dl.open) renderList();
    var gs = $("#g-saved"); if (gs) { gs.hidden = !SAVED.length; gs.textContent = "Compare and send " + SAVED.length + " saved"; }
  }

  /* ---------- card ---------- */
  function card(l, why, eager) {
    var rent = l.o === "r", im = l.n && l.c ? '<img src="' + IMG + l.i + '-c.webp" width="' + l.c[0] + '" height="' + l.c[1] + '" alt="' + esc(l.t + ", " + l.h) + '" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">' : '<div class="noimg">' + esc(l.t) + "</div>";
    var sp = []; if (bhk(l)) sp.push(bhk(l) + " BHK"); if (l.ba) sp.push(l.ba + " bath"); if (l.a) sp.push(inr(l.a) + " sq ft");
    var w = (why && why.length) ? '<div class="why">' + why.map(function (x) { return "<span" + (x.warn ? ' class="warn"' : "") + ">" + esc(x.t || x) + "</span>"; }).join("") + "</div>" : "";
    return '<article class="lcard"><div class="ph">' + im + '<span class="tag' + (rent ? " rent" : "") + '">' + (rent ? "For rent" : "For sale") + '</span></div>' +
      '<button type="button" class="heart" data-id="' + l.i + '" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 4 4.5 7.2 4.5c1.9 0 3.5 1 4.8 2.8 1.3-1.8 2.9-2.8 4.8-2.8 3.2 0 5.6 3.2 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg></button>' +
      '<div class="body"><div class="price">' + price(l) + (rent ? "<small>/ month</small>" : "") + '</div><h3><button type="button" data-open="' + l.i + '">' + esc(l.t) + '</button></h3><div class="sub">' + esc(sub(l)) + '</div><div class="specs">' + sp.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>" + w + "</div></article>";
  }
  document.addEventListener("click", function (e) {
    var h = e.target.closest(".heart"); if (h) { e.preventDefault(); toggleSave(+h.getAttribute("data-id")); return; }
    var o = e.target.closest("[data-open]"); if (o) { openSheet(+o.getAttribute("data-open")); return; }
    var sv = e.target.closest("[data-save]"); if (sv) { toggleSave(+sv.getAttribute("data-save")); return; }
    var rmv = e.target.closest("[data-remove]"); if (rmv) { toggleSave(+rmv.getAttribute("data-remove")); return; }
    var cl = e.target.closest("[data-close]"); if (cl) { var d = cl.closest("dialog"); if (d) d.close(); return; }
    var d2 = e.target; if (d2.tagName === "DIALOG") d2.close();
  });
  /* links from static cards (home): open the properties page with the sheet */

  /* ---------- sheet ---------- */
  var dlg = $("#dlg");
  function msgFor(l) {
    var lines = ["Hello Bhatnagars, I am interested in this property from your website:", l.t + (sub(l) ? ", " + sub(l) : ""), "Price: " + price(l) + (l.o === "r" ? " per month" : "")];
    if (l.a) lines.push("Size: " + inr(l.a) + " sq ft"); lines.push("Ref: " + l.i, l.u, "Could you share more details or arrange a visit?"); return lines.join("\n");
  }
  function openSheet(id) {
    var l = BY[id]; if (!l || !dlg) return;
    var media = $(".media", dlg), info = $(".info", dlg), imgs = "";
    for (var k = 0; k < l.n; k++) imgs += '<img src="' + IMG + l.i + "-" + k + '.webp" width="880" height="660" alt="' + esc(l.t + ", photo " + (k + 1)) + '" ' + (k ? 'loading="lazy"' : "") + ' decoding="async">';
    media.innerHTML = imgs || '<div class="noimg" style="color:var(--on-dark);display:grid;place-items:center;width:100%;min-height:200px">' + esc(l.t) + "</div>";
    var ps = persq(l), rows = [["Type", l.t], ["Neighbourhood", l.h]];
    if (l.a) rows.push(["Size", inr(l.a) + " sq ft"]); if (ps) rows.push([l.o === "r" ? "Rent per sq ft" : "Price per sq ft", "₹" + inr(ps)]);
    if (bhk(l)) rows.push(["Bedrooms", bhk(l)]); if (l.ba) rows.push(["Bathrooms", l.ba]); rows.push(["Listed", new Date(l.d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })], ["Reference", l.i]);
    info.innerHTML = '<p class="eyebrow">' + (l.o === "r" ? "For rent" : "For sale") + "</p><h2>" + esc(l.t) + '</h2><p class="note">' + esc(sub(l)) + '</p><div class="big">' + price(l) + (l.o === "r" ? ' <small style="font:500 16px var(--sans);color:var(--muted)">/ month</small>' : "") + "</div>" +
      '<dl class="facts-t">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
      (l.ov ? '<p class="ov">' + esc(l.ov) + "</p>" : "") + (l.ft && l.ft.length ? '<ul class="flist">' + l.ft.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="btn-row"><a class="btn btn-wa" data-track="whatsapp" href="' + wa(msgFor(l)) + '" target="_blank" rel="noopener">' + ICO.wa + 'WhatsApp about this home</a><a class="btn btn-ghost" data-track="call" href="tel:' + CFG.tel + '">' + ICO.tel + 'Call</a></div>' +
      '<div class="btn-row"><button type="button" class="chip" data-save="' + l.i + '" aria-pressed="false">Save to shortlist</button><a class="link-arrow" href="' + esc(l.u) + '" target="_blank" rel="noopener">See it on bhatnagars.co.in' + ICO.arrow + "</a></div>";
    media.scrollLeft = 0; info.scrollTop = 0; if (!dlg.open) dlg.showModal(); sync(); track("open-listing");
    try { history.replaceState(null, "", "#l=" + id); } catch (e) { /* ignore */ }
  }
  if (dlg) dlg.addEventListener("close", function () { try { if (/^#l=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ } });

  /* ---------- shortlist dialog: saved homes, compare, send ---------- */
  var dlgList = $("#dlg-list");
  function brief() { return window.__brief ? window.__brief() : ""; }
  function renderList() {
    var info = $(".info", dlgList), items = SAVED.map(function (i) { return BY[i]; }).filter(Boolean);
    if (!items.length) { info.innerHTML = '<h2 id="list-h">Your shortlist</h2><p class="note">Nothing saved yet. Tap the heart on any home.</p>'; return; }
    var rows = items.map(function (l) { return '<div class="sl-row">' + (l.n && l.c ? '<img src="' + IMG + l.i + '-c.webp" width="72" height="54" alt="">' : '<div class="noimg"></div>') + '<div><b>' + esc(l.t) + '</b><span>' + esc(sub(l)) + " · " + price(l) + (l.o === "r" ? " / month" : "") + '</span></div><button type="button" data-remove="' + l.i + '" aria-label="Remove ' + esc(l.t) + '">' + ICO.close + "</button></div>"; }).join("");
    var cmp = "";
    if (items.length > 1) {
      var mp = Math.min.apply(null, items.map(function (l) { return l.p || Infinity; })), ms = Math.max.apply(null, items.map(function (l) { return l.a || 0; })), mq = Math.min.apply(null, items.map(function (l) { return persq(l) || Infinity; }));
      var same = items.every(function (l) { return l.o === items[0].o; });
      var row = function (lab, fn, best) { return "<tr><th scope=\"row\">" + lab + "</th>" + items.map(function (l) { var v = fn(l); return "<td" + (best && best(l) ? ' class="best"' : "") + ">" + (v == null || v === "" ? "–" : esc(v)) + "</td>"; }).join("") + "</tr>"; };
      cmp = '<h3 style="font:600 17px var(--sans)">Side by side</h3><div class="cmp"><table><thead><tr><th></th>' + items.map(function (l) { return '<th scope="col" style="color:var(--ink)">' + esc(l.t) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        row("Neighbourhood", function (l) { return sub(l); }) + row(same && items[0].o === "r" ? "Rent / month" : "Price", function (l) { return price(l); }, function (l) { return same && l.p === mp; }) +
        row("Size", function (l) { return l.a ? inr(l.a) + " sq ft" : ""; }, function (l) { return l.a && l.a === ms; }) + row("Per sq ft", function (l) { var p = persq(l); return p ? "₹" + inr(p) : ""; }, function (l) { return same && persq(l) && persq(l) === mq; }) +
        row("Bedrooms", function (l) { return bhk(l) ? bhk(l) + " BHK" : ""; }) + row("Bathrooms", function (l) { return l.ba; }) + row("Listed", function (l) { return new Date(l.d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }) +
        "</tbody></table></div>" + (same ? '<p class="note">Highlighted: lowest price, largest size and lowest price per sq ft in your shortlist.</p>' : "");
    }
    var msg = ["Hello Bhatnagars, I made a shortlist on your website and would like to arrange visits:", ""].concat(items.map(function (l, n) { return (n + 1) + ". " + l.t + ", " + sub(l) + " | " + price(l) + (l.o === "r" ? "/month" : "") + (l.a ? " | " + inr(l.a) + " sq ft" : "") + " | Ref " + l.i + "\n   " + l.u; }));
    var b = brief(); if (b) msg.push("", "My brief: " + b);
    info.innerHTML = '<h2 id="list-h">Your shortlist</h2><p class="note">' + items.length + (items.length === 1 ? " home" : " homes") + ' saved on this device. Nothing is sent until you tap WhatsApp.</p><div class="sl">' + rows + "</div>" + cmp +
      '<div class="btn-row"><a class="btn btn-wa" data-track="whatsapp-shortlist" href="' + wa(msg.join("\n")) + '" target="_blank" rel="noopener">' + ICO.wa + 'Send shortlist on WhatsApp</a><a class="btn btn-ghost" href="tel:' + CFG.tel + '">' + ICO.tel + "Call instead</a></div>";
  }
  function openList() { if (!dlgList) return; renderList(); if (!dlgList.open) dlgList.showModal(); track("open-shortlist"); }
  var tOpen = $("#tray-open"); if (tOpen) tOpen.addEventListener("click", openList);

  /* ---------- listing facts used by filters ---------- */
  var HOODS = {}; DATA.forEach(function (l) { HOODS[l.h] = (HOODS[l.h] || 0) + 1; });
  var HOOD_LIST = Object.keys(HOODS).sort(function (a, b) { return HOODS[b] - HOODS[a] || a.localeCompare(b); });
  var BANDS = {
    s: [["Under ₹1 Cr", 0, 1e7], ["₹1 to 2.5 Cr", 1e7, 2.5e7], ["₹2.5 to 5 Cr", 2.5e7, 5e7], ["₹5 to 10 Cr", 5e7, 1e8], ["Above ₹10 Cr", 1e8, 1e13]],
    r: [["Under ₹50,000", 0, 5e4], ["₹50,000 to 1 L", 5e4, 1e5], ["₹1 to 2 L", 1e5, 2e5], ["₹2 to 4 L", 2e5, 4e5], ["Above ₹4 L", 4e5, 1e13]]
  };
  function beds(l) { return l.k === "res" && l.b ? Math.floor(l.b) : null; }
  var BEDOPT = [["1-2", "1 to 2 BHK", function (n) { return n <= 2; }], ["3", "3 BHK", function (n) { return n === 3; }], ["4", "4 BHK", function (n) { return n === 4; }], ["5+", "5 BHK and above", function (n) { return n >= 5; }]];
  var SIZEOPT = [["S", "Under 1,000 sq ft", function (a) { return a < 1000; }], ["M", "1,000 to 3,000 sq ft", function (a) { return a >= 1000 && a < 3000; }], ["L", "Above 3,000 sq ft", function (a) { return a >= 3000; }]];
  var MUST = [["furnished", "Furnished"], ["pool", "Pool"], ["terrace", "Terrace"]];

  /* ============ PROPERTIES PAGE ============ */
  if (page === "properties") {
    var F = { o: "", k: "", h: "", b: "", sort: "new" }, shown = 24, STEP = 24;
    var bar = $("#fbar"), res = $("#fresults"), cnt = $("#fcount"), sortSel = $("#fsort"), more = $("#fmore"), clr = $("#fclear");
    var KIND = [["res", "Homes"], ["com", "Offices and shops"], ["land", "Land"]];
    function fmatch(l, skip) { return (skip === "o" || !F.o || l.o === F.o) && (skip === "k" || !F.k || l.k === F.k) && (skip === "h" || !F.h || l.h === F.h) && (skip === "b" || !F.b || (beds(l) !== null && BEDOPT.filter(function (x) { return x[0] === F.b; })[0][2](beds(l)))); }
    function fcount(skip, key, val) { var s = {}; for (var k in F) s[k] = F[k]; var keep = F; F = s; F[key] = val; var n = DATA.filter(function (l) { return fmatch(l); }).length; F = keep; return n; }
    function chips(list, key) { return list.map(function (x) { var n = fcount(key, key, x[0]); return '<button type="button" class="chip" data-f="' + key + '" data-v="' + x[0] + '" aria-pressed="' + (F[key] === x[0]) + '"' + (n ? "" : " disabled") + ">" + x[1] + " <small>" + n + "</small></button>"; }).join(""); }
    function drawBar() {
      bar.innerHTML = '<div class="fgrp" role="group" aria-label="Buy or rent">' + chips([["s", "For sale"], ["r", "For rent"]], "o") + '</div><div class="fgrp" role="group" aria-label="Type">' + chips(KIND, "k") + "</div>" +
        '<div class="fgrp"><label class="sr" for="fh">Neighbourhood</label><select id="fh" class="fsel"><option value="">All neighbourhoods</option>' + HOOD_LIST.map(function (h) { return '<option value="' + esc(h) + '"' + (F.h === h ? " selected" : "") + ">" + esc(h) + " (" + fcount("h", "h", h) + ")</option>"; }).join("") + '</select><label class="sr" for="fb">Bedrooms</label><select id="fb" class="fsel"><option value="">Any size</option>' + BEDOPT.map(function (x) { return '<option value="' + x[0] + '"' + (F.b === x[0] ? " selected" : "") + ">" + x[1] + " (" + fcount("b", "b", x[0]) + ")</option>"; }).join("") + "</select></div>";
    }
    function sorter(a, b) { if (F.sort === "pa") return (a.p || 1e15) - (b.p || 1e15); if (F.sort === "pd") return (b.p || 0) - (a.p || 0); if (F.sort === "sq") return (b.a || 0) - (a.a || 0); return a.d < b.d ? 1 : a.d > b.d ? -1 : b.i - a.i; }
    function draw() {
      var list = DATA.filter(function (l) { return fmatch(l); }).sort(sorter);
      cnt.textContent = list.length + (list.length === 1 ? " property" : " properties");
      clr.hidden = !(F.o || F.k || F.h || F.b);
      if (!list.length) res.innerHTML = '<div class="empty"><h3 class="h3">Nothing matches that combination</h3><p class="note">Try removing one filter, or ask Bhatnagars to look for it.</p><a class="btn btn-wa" href="' + wa("Hello Bhatnagars, I could not find what I need on your website. Could you help?") + '" target="_blank" rel="noopener">' + ICO.wa + "Ask on WhatsApp</a></div>";
      else res.innerHTML = '<div class="lgrid">' + list.slice(0, shown).map(function (l, i) { return card(l, null, i < 2); }).join("") + "</div>";
      more.hidden = list.length <= shown; drawBar(); sync();
    }
    bar.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (!b) return; var k = b.getAttribute("data-f"), v = b.getAttribute("data-v"); F[k] = F[k] === v ? "" : v; shown = STEP; draw(); });
    bar.addEventListener("change", function (e) { if (e.target.id === "fh") F.h = e.target.value; if (e.target.id === "fb") F.b = e.target.value; shown = STEP; draw(); });
    sortSel.addEventListener("change", function () { F.sort = sortSel.value; draw(); });
    clr.addEventListener("click", function () { F = { o: "", k: "", h: "", b: "", sort: F.sort }; shown = STEP; draw(); });
    $("#fmore-btn").addEventListener("click", function () { shown += STEP; draw(); });
    var hm = location.hash.match(/^#l=(\d+)/); draw(); if (hm) openSheet(+hm[1]);
    window.addEventListener("hashchange", function () { var m = location.hash.match(/^#l=(\d+)/); if (m) openSheet(+m[1]); });
  }

  /* ============ HOME ============ */
  if (page === "home") {
    var qo = $$('input[name="qo"]'), qb = $("#q-b");
    var fillB = function () { var o = $('input[name="qo"]:checked').value; qb.innerHTML = '<option value="">Any budget</option>' + BANDS[o].map(function (b, i) { return '<option value="' + i + '">' + b[0] + (o === "r" ? " a month" : "") + "</option>"; }).join(""); };
    fillB(); qo.forEach(function (r) { r.addEventListener("change", fillB); });
    $("#quick").addEventListener("submit", function (e) { e.preventDefault(); var q = new URLSearchParams(); q.set("o", $('input[name="qo"]:checked').value); q.set("k", "res"); if (qb.value) q.set("b", qb.value); if ($("#q-n").value) q.set("n", $("#q-n").value); if ($("#q-h").value) q.set("h", $("#q-h").value); track("quick-start"); location.href = $("#quick").getAttribute("data-href") + "?" + q.toString(); });
    var jh = $("#just"); if (jh) $$(".lcard", jh).forEach(function (c) { var a = c.querySelector("h3 a"); if (!a) return; var m = a.getAttribute("href").match(/#l=(\d+)/); if (!m) return; var l = BY[+m[1]]; if (!l) return; var h3 = a.parentNode; h3.innerHTML = '<button type="button" data-open="' + l.i + '">' + esc(l.t) + "</button>"; c.insertAdjacentHTML("beforeend", '<button type="button" class="heart" data-id="' + l.i + '" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 4 4.5 7.2 4.5c1.9 0 3.5 1 4.8 2.8 1.3-1.8 2.9-2.8 4.8-2.8 3.2 0 5.600 3.200 4.400 6.600-1.700 4.800-9.200 9.400-9.200 9.400z"/></svg></button>'); });
    sync();
  }

  /* ============ SHORTLIST GUIDE (signature) ============ */
  if (page === "shortlist") {
    var S = { o: "", k: "", bands: [], n: "", sz: "", hoods: [], must: [], sort: "fit" };
    var qp = new URLSearchParams(location.search);
    if (qp.get("o") === "s" || qp.get("o") === "r") S.o = qp.get("o");
    if (qp.get("k")) S.k = qp.get("k");
    if (qp.get("b") && S.o && BANDS[S.o][+qp.get("b")]) S.bands = [+qp.get("b")];
    if (qp.get("n")) S.n = ({ "2": "1-2", "3": "3", "4": "4", "5": "5+" })[qp.get("n")] || "";
    if (qp.get("h") && HOODS[qp.get("h")]) S.hoods = [qp.get("h")];
    if (qp.get("h") && !S.o) S.o = "s";
    var briefEl = $("#brief"), outEl = $("#gresults");
    function inBands(l, s) { if (!s.bands.length) return true; if (!l.p) return false; return s.bands.some(function (i) { var b = BANDS[s.o][i]; return l.p >= b[1] && l.p < b[2]; }); }
    function sizeOk(l, s) { if (l.k === "res") { if (!s.n) return true; var n = beds(l); return n !== null && BEDOPT.filter(function (x) { return x[0] === s.n; })[0][2](n); } if (!s.sz) return true; return !!l.a && SIZEOPT.filter(function (x) { return x[0] === s.sz; })[0][2](l.a); }
    function mustOk(l, s) { return s.must.every(function (m) { return l.f.indexOf(m) > -1; }); }
    function kindOk(l, s) { return !s.k || l.k === s.k; }
    function hoodOk(l, s) { return !s.hoods.length || s.hoods.indexOf(l.h) > -1; }
    function hard(l, s) { return l.o === s.o && kindOk(l, s) && mustOk(l, s); }
    function exact(l, s) { return hard(l, s) && inBands(l, s) && sizeOk(l, s) && hoodOk(l, s); }
    function withS(key, val) { var c = JSON.parse(JSON.stringify(S)); c[key] = val; return c; }
    function count(s) { return DATA.filter(function (l) { return exact(l, s); }).length; }
    function brief2() {
      var p = []; if (!S.o) return ""; p.push(S.o === "s" ? "Buy" : "Rent"); if (S.k) p.push({ res: "Homes", com: "Offices and shops", land: "Land" }[S.k]);
      if (S.bands.length) p.push(S.bands.map(function (i) { return BANDS[S.o][i][0]; }).join(" or ") + (S.o === "r" ? " a month" : "")); if (S.n) p.push(S.n + " BHK"); if (S.sz) p.push(SIZEOPT.filter(function (x) { return x[0] === S.sz; })[0][1]);
      if (S.hoods.length) p.push(S.hoods.join(", ")); if (S.must.length) p.push(S.must.join(", ")); return p.join(" · ");
    }
    window.__brief = brief2;
    function opt(group, val, label, n, on, multi) { return '<button type="button" class="chip" data-g="' + group + '" data-v="' + esc(val) + '" aria-pressed="' + on + '"' + (n === 0 && !on ? " disabled" : "") + ">" + esc(label) + (n == null ? "" : " <small>" + n + "</small>") + "</button>"; }
    function drawBrief() {
      var h = "", lock = !S.o ? " locked" : "";
      h += '<div class="q"><h3><i>1</i>What do you want to do?</h3><div class="opts">' + opt("o", "s", "Buy", DATA.filter(function (l) { return l.o === "s"; }).length, S.o === "s") + opt("o", "r", "Rent", DATA.filter(function (l) { return l.o === "r"; }).length, S.o === "r") + "</div></div>";
      var kinds = [["res", "Homes"], ["com", "Offices and shops"], ["land", "Land"]];
      h += '<div class="q' + lock + '"><h3><i>2</i>What are you looking for?</h3><div class="opts">' + kinds.map(function (k) { return opt("k", k[0], k[1], S.o ? count(withS("k", k[0])) : null, S.k === k[0]); }).join("") + "</div></div>";
      var bs = BANDS[S.o || "s"];
      h += '<div class="q' + lock + '"><h3><i>3</i>Budget' + (S.o === "r" ? " per month" : "") + '</h3><div class="opts">' + bs.map(function (b, i) { var on = S.bands.indexOf(i) > -1, c = S.o ? count(withS("bands", on ? S.bands : S.bands.concat([i]))) : null; return opt("b", i, b[0], c, on); }).join("") + '</div><p class="hint">Pick one or more bands.</p></div>';
      if (S.k === "com" || S.k === "land") h += '<div class="q' + lock + '"><h3><i>4</i>Size</h3><div class="opts">' + SIZEOPT.map(function (x) { return opt("sz", x[0], x[1], S.o ? count(withS("sz", S.sz === x[0] ? "" : x[0])) : null, S.sz === x[0]); }).join("") + "</div></div>";
      else h += '<div class="q' + lock + '"><h3><i>4</i>How many bedrooms?</h3><div class="opts">' + BEDOPT.map(function (x) { return opt("n", x[0], x[1], S.o ? count(withS("n", S.n === x[0] ? "" : x[0])) : null, S.n === x[0]); }).join("") + "</div></div>";
      var hl = S.allH ? HOOD_LIST : HOOD_LIST.filter(function (n, i) { return i < 10 || S.hoods.indexOf(n) > -1; });
      h += '<div class="q' + lock + '"><h3><i>5</i>Which neighbourhoods?</h3><div class="opts">' + hl.map(function (n) { var on = S.hoods.indexOf(n) > -1; return opt("h", n, n, S.o ? count(withS("hoods", on ? S.hoods : S.hoods.concat([n]))) : null, on); }).join("") + (HOOD_LIST.length > hl.length || S.allH ? '<button type="button" class="chip" data-g="allh" data-v="1">' + (S.allH ? "Show fewer" : "All " + HOOD_LIST.length + " neighbourhoods") + "</button>" : "") + "</div></div>";
      if (S.k !== "com" && S.k !== "land") h += '<div class="q' + lock + '"><h3><i>6</i>Must have <small style="font:400 14px var(--sans);color:var(--muted)">(optional)</small></h3><div class="opts">' + MUST.map(function (m) { var on = S.must.indexOf(m[0]) > -1; return opt("m", m[0], m[1], S.o ? count(withS("must", on ? S.must : S.must.concat([m[0]]))) : null, on); }).join("") + "</div></div>";
      h += '<div class="btn-row"><button type="button" class="chip" id="g-reset">Start again</button></div><a class="btn mobile-go" href="#gresults" id="g-go">' + (S.o ? "Show " + count(S) + (count(S) === 1 ? " home" : " homes") : "Choose buy or rent") + ' ' + ICO.arrow + '</a>';
      var keepScroll = briefEl.scrollTop; briefEl.innerHTML = h; briefEl.scrollTop = keepScroll;
    }
    function fitScore(l, s) {
      var sc = 0; if (s.n && sizeOk(l, s)) sc += 2; if (s.hoods.length && hoodOk(l, s)) sc += 1; sc += s.must.length;
      var d = (NOW - new Date(l.d)) / 864e5; sc += Math.max(0, 1 - d / 60);
      var v = persq(l); if (v) { var arr = VAL[l.o + l.k]; if (arr) { var r = arr.filter(function (x) { return x <= v; }).length / arr.length; sc += 1 - r; } } return sc;
    }
    var VAL = {}; DATA.forEach(function (l) { var v = persq(l); if (v) { (VAL[l.o + l.k] = VAL[l.o + l.k] || []).push(v); } });
    function why(l) {
      var w = []; if (S.bands.length) w.push("Within budget"); if (bhk(l) && S.n) w.push(bhk(l) + " BHK"); if (S.hoods.length) w.push(l.h);
      S.must.forEach(function (m) { w.push(MUST.filter(function (x) { return x[0] === m; })[0][1]); });
      var ps = persq(l); if (ps) w.push("₹" + inr(ps) + " per sq ft");
      var d = (NOW - new Date(l.d)) / 864e5; if (d <= 7) w.push("New this week"); return w;
    }
    function near(l) {
      if (!hard(l, S)) return null; var miss = [];
      if (!inBands(l, S)) { var top = Math.max.apply(null, S.bands.map(function (i) { return BANDS[S.o][i][2]; })), lo = Math.min.apply(null, S.bands.map(function (i) { return BANDS[S.o][i][1]; })); if (l.p && l.p >= top && l.p <= top * 1.2) miss.push({ t: Math.round((l.p / top - 1) * 100) + "% above your budget", warn: 1 }); else if (l.p && l.p < lo && l.p >= lo * 0.8) miss.push({ t: Math.round((1 - l.p / lo) * 100) + "% below your range", warn: 1 }); else return null; }
      if (!sizeOk(l, S)) { if (l.k === "res" && S.n && beds(l)) { var tgt = ({ "1-2": 2, "3": 3, "4": 4, "5+": 5 })[S.n]; if (Math.abs(beds(l) - tgt) <= 1 && !(S.n === "1-2" && beds(l) === 3 && false)) miss.push({ t: bhk(l) + " BHK instead of " + S.n, warn: 1 }); else return null; } else return null; }
      if (!hoodOk(l, S)) miss.push({ t: "In " + l.h, warn: 1 });
      return miss.length === 1 ? miss : null;
    }
    function drawResults() {
      if (!S.o) {
        var PRE = [["Buy a home for ₹2.5 to 5 Cr", { o: "s", k: "res", bands: [2] }], ["Rent a home for ₹50,000 to 1 L a month", { o: "r", k: "res", bands: [1] }], ["3 BHK to buy in Koregaon Park", { o: "s", k: "res", n: "3", hoods: ["Koregaon Park"] }], ["Rent an office or shop", { o: "r", k: "com" }]];
        outEl.innerHTML = '<div class="empty"><h2 class="h3">Start with question 1, or try one of these</h2><p class="note">The guide shows matches as soon as you answer.</p><div class="opts" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' + PRE.map(function (p, i) { var s2 = Object.assign({ o: "", k: "", bands: [], n: "", sz: "", hoods: [], must: [], sort: "fit" }, p[1]); return '<button type="button" class="chip" data-pre="' + i + '">' + esc(p[0]) + " <small>" + count(s2) + "</small></button>"; }).join("") + "</div></div>";
        outEl.__pre = PRE; return;
      }
      var m = DATA.filter(function (l) { return exact(l, S); });
      m.sort(function (a, b) { if (S.sort === "pa") return (a.p || 1e15) - (b.p || 1e15); if (S.sort === "pd") return (b.p || 0) - (a.p || 0); if (S.sort === "sq") return (b.a || 0) - (a.a || 0); if (S.sort === "new") return a.d < b.d ? 1 : -1; return fitScore(b, S) - fitScore(a, S); });
      var nr = []; DATA.forEach(function (l) { if (exact(l, S)) return; var x = near(l); if (x) nr.push({ l: l, w: x }); }); nr.sort(function (a, b) { return fitScore(b.l, S) - fitScore(a.l, S); });
      var bf = brief2();
      var head = '<div class="rhead"><div><div class="rcount">' + m.length + (m.length === 1 ? " home fits" : " homes fit") + '</div><p class="note">' + esc(bf) + '</p></div><div class="btn-row"><label class="sr" for="g-sort">Sort by</label><select id="g-sort" class="fsel"><option value="fit"' + (S.sort === "fit" ? " selected" : "") + '>Best fit</option><option value="pa"' + (S.sort === "pa" ? " selected" : "") + '>Price: low to high</option><option value="pd"' + (S.sort === "pd" ? " selected" : "") + '>Price: high to low</option><option value="sq"' + (S.sort === "sq" ? " selected" : "") + '>Largest first</option><option value="new"' + (S.sort === "new" ? " selected" : "") + '>Newest first</option></select><button type="button" class="btn btn-sm" id="g-saved" ' + (SAVED.length ? "" : "hidden") + ">Compare and send " + SAVED.length + " saved</button></div></div>";
      var body = "";
      if (m.length) body += '<div class="lgrid">' + m.slice(0, 30).map(function (l, i) { return card(l, why(l), i < 2); }).join("") + "</div>";
      else body += '<div class="empty"><h2 class="h3">Nothing fits exactly</h2><p class="note">Loosen one answer on the left, or look at the near misses below. Bhatnagars can also search beyond what is on the site.</p><a class="btn btn-wa" data-track="whatsapp-brief" href="' + wa("Hello Bhatnagars, I used the Shortlist Guide on your website. My brief: " + bf + ". Nothing on the site fits exactly. Could you help?") + '" target="_blank" rel="noopener">' + ICO.wa + "Send this brief on WhatsApp</a></div>";
      if (m.length > 30) body += '<p class="note" style="margin-top:14px">Showing the best 30 of ' + m.length + ". Narrow the budget or neighbourhood to see the rest.</p>";
      if (nr.length) body += '<h2 class="sec-sub">Just outside your brief</h2><div class="lgrid">' + nr.slice(0, 6).map(function (x) { return card(x.l, x.w.concat([{ t: "₹" + inr(persq(x.l) || 0) + " per sq ft", warn: 1 }]).slice(0, x.l.a && x.l.p ? 2 : 1), false); }).join("") + "</div>";
      if (m.length) body += '<div class="btn-row" style="margin-top:28px"><a class="btn btn-wa" data-track="whatsapp-brief" href="' + wa("Hello Bhatnagars, I used the Shortlist Guide on your website. My brief: " + bf + ". " + m.length + " homes fit. Could someone call me?") + '" target="_blank" rel="noopener">' + ICO.wa + 'Ask Bhatnagars about this brief</a></div>';
      outEl.innerHTML = head + body;
      sync();
    }
    function url() { var q = new URLSearchParams(); if (S.o) q.set("o", S.o); if (S.k) q.set("k", S.k); if (S.bands.length === 1) q.set("b", S.bands[0]); if (S.n) q.set("n", ({ "1-2": "2", "3": "3", "4": "4", "5+": "5" })[S.n]); if (S.hoods.length === 1) q.set("h", S.hoods[0]); try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q.toString() : "")); } catch (e) { /* ignore */ } }
    function redraw() { drawBrief(); drawResults(); url(); }
    function tog(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }
    briefEl.addEventListener("click", function (e) {
      if (e.target.closest("#g-reset")) { S = { o: "", k: "", bands: [], n: "", sz: "", hoods: [], must: [], sort: "fit" }; redraw(); return; }
      var b = e.target.closest("[data-g]"); if (!b) return; var g = b.getAttribute("data-g"), v = b.getAttribute("data-v");
      if (g === "o") { if (S.o !== v) { S.o = v; S.bands = []; } } else if (g === "k") { S.k = S.k === v ? "" : v; S.n = ""; S.sz = ""; if (S.k !== "res") S.must = []; }
      else if (g === "b") tog(S.bands, +v); else if (g === "n") S.n = S.n === v ? "" : v; else if (g === "sz") S.sz = S.sz === v ? "" : v; else if (g === "h") tog(S.hoods, v); else if (g === "allh") S.allH = !S.allH; else if (g === "m") tog(S.must, v);
      if (g !== "allh") track("guide-" + g); redraw();
    });
    outEl.addEventListener("change", function (e) { if (e.target.id === "g-sort") { S.sort = e.target.value; drawResults(); } });
    outEl.addEventListener("click", function (e) { if (e.target.closest("#g-saved")) openList(); var pb = e.target.closest("[data-pre]"); if (pb && outEl.__pre) { S = Object.assign({ o: "", k: "", bands: [], n: "", sz: "", hoods: [], must: [], sort: "fit" }, JSON.parse(JSON.stringify(outEl.__pre[+pb.getAttribute("data-pre")][1]))); track("guide-preset"); redraw(); } });
    var go = function (e) { var a = e.target.closest("#g-go"); if (a) { e.preventDefault(); outEl.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "start" }); } };
    briefEl.addEventListener("click", go);
    redraw();
  }

  /* click tracking (GoatCounter events, when the tag is present) */
  document.addEventListener("click", function (e) { var t = e.target.closest("[data-track]"); if (t) track(t.getAttribute("data-track")); });
  sync();
})();
