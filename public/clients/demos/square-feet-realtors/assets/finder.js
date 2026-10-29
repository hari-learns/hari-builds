/* Properties browser and Shortlist Finder. One data file (their 494 for-sale cards), no libraries.
   data-mode="browse": filters + grid + detail sheet.  data-mode="match": brief -> ranked matches -> shortlist -> compare -> send. */
(function () {
  var root = document.getElementById("finder");
  if (!root) return;
  var MODE = root.getAttribute("data-mode"), BASE = root.getAttribute("data-base"), WA = root.getAttribute("data-wa"),
      LIVE = root.getAttribute("data-live"), MAIL = root.getAttribute("data-email");
  var KINDS = [["flat", "Flats & Apartments"], ["plot", "Residential Plots"], ["house", "Houses & Villas"], ["comm", "Commercial & Land"]];
  var KL = {}; KINDS.forEach(function (k) { KL[k[0]] = k[1]; });
  var BUDGETS = [[0.25, "25 Lac"], [0.5, "50 Lac"], [0.75, "75 Lac"], [1, "1 Cr"], [1.5, "1.5 Cr"], [2, "2 Cr"], [3, "3 Cr"], [5, "5 Cr"], [10, "10 Cr"], [25, "25 Cr"], [100, "100 Cr"]];
  var CR = 10000000, OVER = 1.2;
  var L = [], BY = {}, saved = [], cmp = [];
  var F = { kind: [], loc: [], bhk: [], min: 0, max: 0, q: "", sort: "new" };
  var shown = 24, lastFocus = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function price(l) { return l.r ? "₹ " + l.p.replace(/\.$/, "") : "Price not listed"; }
  function ppsf(l) { return (l.r && l.sf && /sq/i.test(l.a)) ? Math.round(l.r / l.sf) : 0; }
  function fmtRs(n) { return "₹ " + Number(n).toLocaleString("en-IN"); }
  function liveUrl(l) { return LIVE + l.u; }
  function budgetLabel(v) { var b = BUDGETS.filter(function (x) { return x[0] === v; })[0]; return b ? b[1] : v + " Cr"; }
  var ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.500s-7.500-4.600-9.200-9.400C1.600 7.700 4 4.500 7.200 4.500c1.900 0 3.500 1 4.800 2.800 1.300-1.800 2.900-2.800 4.800-2.800 3.200 0 5.600 3.200 4.400 6.600-1.700 4.800-9.200 9.400-9.200 9.400z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.400-6-10a6 6 0 1 1 12 0c0 4.600-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.200a8.200 8.200 0 0 1-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200c0 1.300.9 2.500 1 2.700.1.200 1.800 2.800 4.400 3.900 1.600.7 2.300.7 3.100.6.500-.1 1.500-.6 1.700-1.200.2-.6.200-1.100.2-1.200-.1-.1-.3-.2-.5-.3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  function isSaved(id) { return saved.indexOf(id) > -1; }
  function persist() { store("sfr_shortlist", saved); }

  /* ---------- filtering ---------- */
  function matchBrowse(l) {
    if (F.kind.length && F.kind.indexOf(l.y) < 0) return false;
    if (F.loc.length && F.loc.indexOf(l.pl) < 0) return false;
    if (F.bhk.length && !(l.b && (l.y === "flat" || l.y === "house") && F.bhk.indexOf(l.b >= 5 ? 5 : Math.floor(l.b)) > -1)) return false;
    if (F.max || F.min) { if (!l.r) return false; if (F.max && l.r > F.max * CR) return false; if (F.min && l.r < F.min * CR) return false; }
    if (F.q) { var h = (l.n + " " + l.pl + " " + (l.sub || "") + " REI" + l.i).toLowerCase(); if (h.indexOf(F.q.toLowerCase()) < 0) return false; }
    return true;
  }
  function sorted(a) {
    var s = a.slice();
    if (F.sort === "pa") s.sort(function (x, y) { return (x.r || 1e15) - (y.r || 1e15); });
    else if (F.sort === "pd") s.sort(function (x, y) { return y.r - x.r; });
    else if (F.sort === "ppsf") s.sort(function (x, y) { return (ppsf(x) || 1e9) - (ppsf(y) || 1e9); });
    else s.sort(function (x, y) { return Number(y.i) - Number(x.i); });
    return s;
  }
  function rank() {           /* match mode: returns {fit:[], near:[]} */
    var fit = [], near = [];
    L.forEach(function (l) {
      if (F.kind.length && F.kind.indexOf(l.y) < 0) return;
      if (F.loc.length && F.loc.indexOf(l.pl) < 0) return;
      if (F.bhk.length && !(l.b && (l.y === "flat" || l.y === "house") && F.bhk.indexOf(l.b >= 5 ? 5 : Math.floor(l.b)) > -1)) return;
      var why = [], over = 0, score = 1;
      if (F.kind.length) { why.push(KL[l.y]); score += 2; }
      if (F.loc.length) { why.push(l.pl); score += 3; }
      if (F.bhk.length) { why.push(Math.floor(l.b) + " BHK"); score += 2; }
      if (F.max || F.min) {
        if (!l.r) return;
        if (F.min && l.r < F.min * CR) return;
        if (F.max) {
          if (l.r > F.max * CR * OVER) return;
          if (l.r > F.max * CR) { over = Math.round((l.r / (F.max * CR) - 1) * 100); score += 1; }
          else { score += 3; why.push("Within ₹ " + budgetLabel(F.max)); }
        }
      }
      var o = { l: l, why: why, over: over, score: score };
      (over ? near : fit).push(o);
    });
    function cmpf(a, b) { return b.score - a.score || ((ppsf(a.l) || 1e9) - (ppsf(b.l) || 1e9)) || (a.l.r - b.l.r); }
    fit.sort(cmpf); near.sort(function (a, b) { return a.over - b.over || cmpf(a, b); });
    return { fit: fit, near: near };
  }

  /* ---------- pieces ---------- */
  function heartBtn(l) {
    var on = isSaved(l.i);
    return '<button type="button" class="heart' + (on ? " on" : "") + '" data-save="' + l.i + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove " : "Save ") + esc(l.n) + ' in ' + esc(l.pl) + (on ? " from" : " to") + ' shortlist">' + ICON.heart + "</button>";
  }
  function cardHTML(l) {
    var meta = (l.a ? esc(l.a) + " · " : "") + "REI" + l.i;
    return '<article class="card" data-card="' + l.i + '"><button type="button" class="card-open" data-open="' + l.i + '" aria-label="Details: ' + esc(l.n) + ' in ' + esc(l.pl) + ', ' + esc(price(l)) + '">' +
      '<span class="ph"><img src="' + BASE + "/assets/img/l/" + l.i + '.webp" width="' + l.w + '" height="' + l.h + '" alt="" loading="lazy" decoding="async"></span>' +
      '<span class="cb"><span class="kind">' + esc(l.n) + '</span><span class="pl">' + ICON.pin + esc(l.pl) + '</span><span class="meta">' + meta + '</span><span class="price">' + esc(price(l)) + "</span></span></button>" + heartBtn(l) + "</article>";
  }
  function rowHTML(o) {
    var l = o.l, pp = ppsf(l), c = cmp.indexOf(l.i) > -1;
    return '<article class="row" data-card="' + l.i + '"><button type="button" class="row-open" data-open="' + l.i + '" aria-label="Details: ' + esc(l.n) + ' in ' + esc(l.pl) + '"><span class="ph"><img src="' + BASE + "/assets/img/l/" + l.i + '.webp" width="' + l.w + '" height="' + l.h + '" alt="" loading="lazy" decoding="async"></span></button>' +
      '<div class="rb"><p class="kind">' + esc(l.n) + '</p><p class="pl">' + ICON.pin + esc(l.pl) + (l.sub ? ", " + esc(l.sub) : "") + '</p><p class="price">' + esc(price(l)) + (o.over ? ' <span class="over">' + o.over + "% over your budget</span>" : "") + '</p>' +
      '<p class="meta">' + (l.a ? esc(l.a) + " · " : "") + (pp ? fmtRs(pp) + " per sq ft · " : "") + "REI" + l.i + '</p>' +
      (o.why.length ? '<p class="why">' + o.why.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</p>" : "") + "</div>" +
      '<div class="ra">' + heartBtn(l) + "</div></article>";
  }
  function chip(group, val, label, on, count) {
    return '<button type="button" class="chip' + (on ? " on" : "") + '" data-chip="' + group + '" data-val="' + esc(val) + '" aria-pressed="' + on + '">' + esc(label) + (count != null ? " <i>" + count + "</i>" : "") + "</button>";
  }
  function budgetSel(id, label, cur, any) {
    return '<label class="sel"><span>' + label + '</span><select id="' + id + '"><option value="0">' + any + "</option>" + BUDGETS.map(function (b) { return '<option value="' + b[0] + '"' + (cur === b[0] ? " selected" : "") + ">₹ " + b[1] + "</option>"; }).join("") + "</select></label>";
  }
  function placeCounts(filterKind) {
    var m = {}; L.forEach(function (l) { if (!filterKind.length || filterKind.indexOf(l.y) > -1) m[l.pl] = (m[l.pl] || 0) + 1; });
    return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
  }

  /* ---------- browse mode ---------- */
  function renderBrowse() {
    var kinds = KINDS.map(function (k) { var n = L.filter(function (l) { return l.y === k[0]; }).length; return chip("kind1", k[0], k[1], F.kind[0] === k[0], n); }).join("");
    var all = chip("kind1", "", "All kinds", !F.kind.length, L.length);
    var pc = placeCounts([]);
    var locSel = '<label class="sel"><span>Area</span><select id="f-loc"><option value="">All areas</option>' + pc.map(function (p) { return '<option value="' + esc(p[0]) + '"' + (F.loc[0] === p[0] ? " selected" : "") + ">" + esc(p[0]) + " (" + p[1] + ")</option>"; }).join("") + "</select></label>";
    var bhkSel = '<label class="sel"><span>Bedrooms</span><select id="f-bhk"><option value="">Any</option>' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (F.bhk[0] === n ? " selected" : "") + ">" + (n === 5 ? "5+ BHK" : n + " BHK") + "</option>"; }).join("") + "</select></label>";
    var sortSel = '<label class="sel"><span>Sort</span><select id="f-sort">' + [["new", "Newest reference first"], ["pa", "Price: low to high"], ["pd", "Price: high to low"], ["ppsf", "Price per sq ft: low first"]].map(function (s) { return '<option value="' + s[0] + '"' + (F.sort === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") + "</select></label>";
    root.innerHTML = '<div class="fbar"><div class="chips-row" role="group" aria-label="Kind of property">' + all + kinds + "</div>" +
      '<div class="fsel">' + locSel + bhkSel + budgetSel("f-min", "Budget from", F.min, "No minimum") + budgetSel("f-max", "Budget up to", F.max, "No maximum") + sortSel +
      '<label class="sel q"><span>Search area or reference</span><input id="f-q" type="search" placeholder="e.g. Hennur or REI1523889" value="' + esc(F.q) + '" autocomplete="off"></label></div>' +
      '<div class="fmeta"><p class="count" id="count" aria-live="polite"></p><div class="fact"><button type="button" class="btn btn-ghost btn-sm" id="reset">Clear filters</button><a class="btn btn-ink btn-sm" id="to-short" href="' + BASE + '/shortlist/">' + ICON.heart + 'Shortlist <b id="sl-n">0</b></a></div></div></div>' +
      '<div class="cgrid" id="grid"></div><p class="more" id="more-wrap"><button type="button" class="btn btn-ink" id="more">Show more</button></p>' + dialogs();
    paintBrowse();
  }
  function paintBrowse() {
    var res = sorted(L.filter(matchBrowse)), g = document.getElementById("grid");
    g.innerHTML = res.slice(0, shown).map(cardHTML).join("") || '<div class="empty"><p><b>No properties match those filters.</b></p><p>Loosen the budget or the area, or ask the agency directly.</p><p><a class="btn btn-wa" href="' + waLink("Hello Square Feet Realtors, I could not find what I need on your website. I am looking for: " + describe() + ".") + '" target="_blank" rel="noopener">' + ICON.wa + "Send this search on WhatsApp</a></p></div>";
    document.getElementById("count").textContent = "Showing " + Math.min(shown, res.length) + " of " + res.length + " properties" + (res.length < L.length ? " (" + L.length + " on the list)" : "");
    document.getElementById("more-wrap").style.display = res.length > shown ? "" : "none";
    updateCount();
  }

  /* ---------- match mode ---------- */
  function renderMatch() {
    var pc = placeCounts(F.kind), top = pc.slice(0, 14);
    F.loc.forEach(function (x) { if (!top.some(function (t) { return t[0] === x; })) { var f = pc.filter(function (p) { return p[0] === x; })[0]; if (f) top.push(f); } });
    var rest = pc.filter(function (p) { return !top.some(function (t) { return t[0] === p[0]; }); });
    var kinds = KINDS.map(function (k) { return chip("kind", k[0], k[1], F.kind.indexOf(k[0]) > -1); }).join("");
    var bhk = [1, 2, 3, 4, 5].map(function (n) { return chip("bhk", n, n === 5 ? "5+ BHK" : n + " BHK", F.bhk.indexOf(n) > -1); }).join("");
    var locs = top.map(function (p) { return chip("loc", p[0], p[0], F.loc.indexOf(p[0]) > -1, p[1]); }).join("");
    var more = rest.length ? '<label class="sel"><span>More areas</span><select id="m-more"><option value="">Add another area...</option>' + rest.map(function (p) { return '<option value="' + esc(p[0]) + '">' + esc(p[0]) + " (" + p[1] + ")</option>"; }).join("") + "</select></label>" : "";
    root.innerHTML = '<div class="mgrid"><aside class="brief" aria-label="Your brief"><details id="brief"><summary>Your brief<small id="bs"></small></summary>' +
      '<fieldset><legend>Kind of property</legend><div class="chips-row">' + kinds + '</div></fieldset>' +
      '<fieldset><legend>Where</legend><div class="chips-row">' + locs + '</div>' + more + '</fieldset>' +
      '<fieldset id="bhk-set"><legend>Bedrooms (flats, houses, villas)</legend><div class="chips-row">' + bhk + '</div></fieldset>' +
      '<fieldset><legend>Budget</legend><div class="fsel two">' + budgetSel("m-min", "From", F.min, "No minimum") + budgetSel("m-max", "Up to", F.max, "No maximum") + '</div><p class="hint">Homes up to 20% over your maximum are shown separately and marked.</p></fieldset>' +
      '<p class="bact"><button type="button" class="btn btn-ghost btn-sm" id="reset">Start again</button></p></details></aside>' +
      '<section class="results" aria-label="Matches"><div class="rhead"><p class="count" id="count" aria-live="polite"></p><button type="button" class="btn btn-ink btn-sm" id="open-sheet">' + ICON.heart + 'My shortlist <b id="sl-n">0</b></button></div><div id="res"></div></section></div>' + dialogs();
    var dt = document.getElementById("brief"); if (dt) dt.open = window.innerWidth >= 960 || !Object.keys(F).some(function (k) { return Array.isArray(F[k]) ? F[k].length : F[k] && k !== "sort"; });
    paintMatch();
  }
  function paintMatch() {
    var r = rank(), box = document.getElementById("res"), html = "";
    var tot = r.fit.length + r.near.length;
    document.getElementById("count").textContent = tot ? r.fit.length + " matches" + (r.near.length ? " and " + r.near.length + " slightly over budget" : "") + " from " + L.length + " listings" : "";
    if (!tot) {
      html = '<div class="empty"><p><b>Nothing on the list fits that brief.</b></p><p>Try another area or a higher budget, or send the brief to the agency: they may know of homes not yet listed.</p><p><a class="btn btn-wa" href="' + waLink("Hello Square Feet Realtors, I could not find a match on your website. My brief: " + describe() + ". Please call me.") + '" target="_blank" rel="noopener">' + ICON.wa + "Send this brief on WhatsApp</a></p></div>";
    } else {
      var lim = shown;
      html = r.fit.slice(0, lim).map(rowHTML).join("");
      if (r.fit.length > lim) html += '<p class="more"><button type="button" class="btn btn-ink" id="more">Show more matches</button></p>';
      if (r.near.length) html += '<h2 class="sub">Slightly over your budget</h2><p class="hint">Up to 20% above your maximum.</p>' + r.near.slice(0, 12).map(rowHTML).join("");
    }
    box.innerHTML = html;
    var bsm = document.getElementById("bs"); if (bsm) bsm.textContent = describe();
    var bs = document.getElementById("bhk-set"); if (bs) bs.classList.toggle("dim", F.kind.length > 0 && F.kind.every(function (k) { return k === "plot" || k === "comm"; }));
    updateCount();
  }

  function describe() {
    var p = [];
    if (F.kind.length) p.push(F.kind.map(function (k) { return KL[k]; }).join(" / "));
    if (F.loc.length) p.push("in " + F.loc.join(", "));
    if (F.bhk.length) p.push(F.bhk.map(function (n) { return n === 5 ? "5+" : n; }).join("/") + " BHK");
    if (F.min || F.max) p.push("budget " + (F.min ? "from ₹ " + budgetLabel(F.min) + " " : "") + (F.max ? "up to ₹ " + budgetLabel(F.max) : ""));
    return p.join(", ") || "any property in Bangalore";
  }

  /* ---------- dialogs: details + shortlist sheet ---------- */
  function dialogs() {
    return '<div class="dlg" id="dlg" hidden><div class="scrim" data-x></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="dlg-t" tabindex="-1"><button type="button" class="close" data-x aria-label="Close details">' + ICON.close + '</button><div id="dlg-b"></div></div></div>' +
      '<div class="dlg side" id="sl" hidden><div class="scrim" data-x></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sl-t" tabindex="-1"><button type="button" class="close" data-x aria-label="Close shortlist">' + ICON.close + '</button><div id="sl-b"></div></div></div>';
  }
  function openDlg(id) { var d = document.getElementById(id); lastFocus = document.activeElement; d.hidden = false; document.documentElement.classList.add("lock"); var s = d.querySelector(".sheet"); s.focus(); }
  function closeDlgs() {
    var any = false;
    root.querySelectorAll(".dlg").forEach(function (d) { if (!d.hidden) { d.hidden = true; any = true; } });
    if (any) { document.documentElement.classList.remove("lock"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  }
  function detail(id) {
    var l = BY[id]; if (!l) return;
    var pp = ppsf(l);
    var msg = "Hello Square Feet Realtors, I am interested in this property from your website:\n" + l.n + ", " + l.pl + "\n" + price(l) + (l.a ? ", " + l.a : "") + "\nReference REI" + l.i + "\n" + liveUrl(l) + "\n\nPlease share details and a time to visit.";
    document.getElementById("dlg-b").innerHTML = '<div class="dph"><img src="' + BASE + "/assets/img/l/" + l.i + '.webp" width="' + l.w + '" height="' + l.h + '" alt="' + esc(l.n) + " in " + esc(l.pl) + ', Bangalore"></div><div class="dtx"><p class="eyebrow">REI' + l.i + '</p><h2 id="dlg-t">' + esc(l.n) + '</h2><p class="pl">' + ICON.pin + esc(l.sub ? l.sub + ", " : "") + esc(l.pl) + ', Bangalore</p><p class="price big">' + esc(price(l)) + "</p>" +
      '<dl class="facts-l"><div><dt>Kind</dt><dd>' + esc(KL[l.y]) + "</dd></div>" + (l.a ? "<div><dt>Area</dt><dd>" + esc(l.a) + "</dd></div>" : "") + (l.b ? "<div><dt>Bedrooms</dt><dd>" + l.b + " BHK</dd></div>" : "") + (pp ? "<div><dt>Price per sq ft</dt><dd>" + fmtRs(pp) + " <small>computed from the listed price and area</small></dd></div>" : "") + "<div><dt>Listed by</dt><dd>Square Feet Realtors</dd></div></dl>" +
      '<p class="acts"><a class="btn btn-wa" href="' + waLink(msg) + '" target="_blank" rel="noopener">' + ICON.wa + 'Ask about this on WhatsApp</a><button type="button" class="btn btn-ghost" data-save="' + l.i + '" aria-pressed="' + isSaved(l.i) + '">' + ICON.heart + '<span>' + (isSaved(l.i) ? "Saved" : "Save to shortlist") + '</span></button><a class="btn btn-ghost" href="' + esc(liveUrl(l)) + '" target="_blank" rel="noopener">Their listing page' + ICON.ext + "</a></p>" +
      '<p class="small">Photo, price and area are exactly as Square Feet Realtors list them. Confirm details with the agency before visiting.</p></div>';
    openDlg("dlg");
  }
  function shortlistText() {
    var items = saved.map(function (i) { return BY[i]; }).filter(Boolean).slice(0, 10);
    var t = "Hello Square Feet Realtors, I shortlisted " + items.length + " propert" + (items.length === 1 ? "y" : "ies") + " on your website:\n\n";
    items.forEach(function (l, n) { t += (n + 1) + ". " + l.n + ", " + l.pl + " - " + price(l) + (l.a ? ", " + l.a : "") + " (REI" + l.i + ")\n   " + liveUrl(l) + "\n"; });
    if (saved.length > 10) t += "\n(" + (saved.length - 10) + " more saved)\n";
    var b = describe(); if (b !== "any property in Bangalore") t += "\nMy brief: " + b + ".\n";
    return t + "\nPlease call me to arrange visits.";
  }
  function sheet() {
    var items = saved.map(function (i) { return BY[i]; }).filter(Boolean), h;
    if (!items.length) {
      h = '<h2 id="sl-t">Your shortlist</h2><p class="empty-s">Nothing saved yet. Tap the heart on any property to add it here, then send the list to Square Feet Realtors in one message.</p>';
    } else {
      var list = items.map(function (l) {
        var c = cmp.indexOf(l.i) > -1;
        return '<li><img src="' + BASE + "/assets/img/l/" + l.i + '.webp" width="' + l.w + '" height="' + l.h + '" alt=""><div><b>' + esc(l.n) + "</b><span>" + esc(l.pl) + " · " + esc(price(l)) + '</span></div><label class="cmpc"><input type="checkbox" data-cmp="' + l.i + '"' + (c ? " checked" : "") + '><span>Compare</span></label><button type="button" class="rm" data-save="' + l.i + '" aria-label="Remove ' + esc(l.n) + " in " + esc(l.pl) + ' from shortlist">' + ICON.close + "</button></li>";
      }).join("");
      var cm = items.filter(function (l) { return cmp.indexOf(l.i) > -1; }).slice(0, 3), table = "";
      if (cm.length >= 2) {
        var best = Math.min.apply(null, cm.map(function (l) { return ppsf(l) || 1e12; }));
        function row(lab, fn) { return "<tr><th scope=\"row\">" + lab + "</th>" + cm.map(function (l) { return "<td>" + fn(l) + "</td>"; }).join("") + "</tr>"; }
        table = '<h3>Compare</h3><div class="tw"><table class="cmpt"><thead><tr><th><span class="vh">Property</span></th>' + cm.map(function (l) { return "<th scope=\"col\">" + esc(l.n) + "<small>" + esc(l.pl) + "</small></th>"; }).join("") + "</tr></thead><tbody>" +
          row("Price", function (l) { return esc(price(l)); }) + row("Area", function (l) { return esc(l.a || "-"); }) +
          row("Price per sq ft", function (l) { var p = ppsf(l); return p ? (p === best ? "<b class=\"best\">" + fmtRs(p) + " (lowest)</b>" : fmtRs(p)) : "-"; }) + row("Reference", function (l) { return "REI" + l.i; }) + "</tbody></table></div><p class=\"hint\">Price per sq ft is computed here from the listed price and area.</p>";
      } else if (items.length > 1) table = '<p class="hint">Tick "Compare" on two or three homes to see them side by side.</p>';
      var text = shortlistText();
      h = '<h2 id="sl-t">Your shortlist <small>(' + items.length + ")</small></h2><ul class=\"slist\">" + list + "</ul>" + table +
        '<div class="send"><a class="btn btn-wa" href="' + waLink(text) + '" target="_blank" rel="noopener">' + ICON.wa + 'Send shortlist on WhatsApp</a><a class="btn btn-ghost" href="mailto:' + MAIL + "?subject=" + encodeURIComponent("Shortlist from your website") + "&body=" + encodeURIComponent(text) + '">' + ICON.mail + 'Email it</a><button type="button" class="btn btn-ghost" id="copy">Copy the list</button></div><p class="hint" id="copied" aria-live="polite">The message carries each reference number and the link to the agency\'s own listing page.</p>' +
        '<p><button type="button" class="linkbtn" id="clear">Clear shortlist</button></p>';
    }
    document.getElementById("sl-b").innerHTML = h;
  }
  function updateCount() { var n = document.getElementById("sl-n"); if (n) n.textContent = saved.length; }
  function toggleSave(id) {
    var i = saved.indexOf(id); if (i > -1) { saved.splice(i, 1); cmp = cmp.filter(function (x) { return x !== id; }); } else saved.push(id);
    if (saved.length && cmp.length < 3 && cmp.indexOf(id) < 0 && i < 0) cmp.push(id);
    persist(); updateCount();
    root.querySelectorAll('[data-save="' + id + '"]').forEach(function (b) {
      var on = isSaved(id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      var s = b.querySelector("span"); if (s) s.textContent = on ? "Saved" : "Save to shortlist";
    });
    if (!document.getElementById("sl").hidden) sheet();
  }

  /* ---------- events ---------- */
  function readUrl() {
    var q = new URLSearchParams(location.search), k = q.get("kind"), loc = q.get("loc"), mx = parseFloat(q.get("max")), mn = parseFloat(q.get("min")), id = q.get("id");
    if (k && KL[k]) F.kind = [k]; if (loc) F.loc = [loc]; if (mx) F.max = mx; if (mn) F.min = mn;
    return id;
  }
  function rerender() { shown = 24; if (MODE === "browse") paintBrowse(); else paintMatch(); }
  function refreshChips() {
    root.querySelectorAll(".chip").forEach(function (c) {
      var g = c.getAttribute("data-chip"), v = c.getAttribute("data-val"), on;
      if (g === "kind1") on = (F.kind[0] || "") === v; else if (g === "kind") on = F.kind.indexOf(v) > -1; else if (g === "loc") on = F.loc.indexOf(v) > -1; else on = F.bhk.indexOf(Number(v)) > -1;
      c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
    });
  }
  root.addEventListener("click", function (e) {
    var t = e.target;
    var chipEl = t.closest(".chip");
    if (chipEl) {
      var g = chipEl.getAttribute("data-chip"), v = chipEl.getAttribute("data-val");
      if (g === "kind1") F.kind = v ? [v] : [];
      else if (g === "kind") { var i = F.kind.indexOf(v); if (i > -1) F.kind.splice(i, 1); else F.kind.push(v); if (MODE === "match") { renderMatch(); return; } }
      else if (g === "loc") { var j = F.loc.indexOf(v); if (j > -1) F.loc.splice(j, 1); else F.loc.push(v); }
      else if (g === "bhk") { var n = Number(v), k = F.bhk.indexOf(n); if (k > -1) F.bhk.splice(k, 1); else F.bhk.push(n); }
      refreshChips(); rerender(); return;
    }
    var sv = t.closest("[data-save]"); if (sv) { toggleSave(sv.getAttribute("data-save")); return; }
    var op = t.closest("[data-open]"); if (op) { detail(op.getAttribute("data-open")); return; }
    if (t.closest("[data-x]")) { closeDlgs(); return; }
    if (t.closest("#more")) { shown += 24; rerender(); return; }
    if (t.closest("#reset")) { F = { kind: [], loc: [], bhk: [], min: 0, max: 0, q: "", sort: "new" }; shown = 24; MODE === "browse" ? renderBrowse() : renderMatch(); return; }
    if (t.closest("#open-sheet")) { sheet(); openDlg("sl"); return; }
    if (t.closest("#copy")) { var tx = shortlistText(), done = function () { var c = document.getElementById("copied"); if (c) c.textContent = "Copied. Paste it into any message."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tx).then(done, function () {}); return; }
    if (t.closest("#clear")) { saved = []; cmp = []; persist(); updateCount(); root.querySelectorAll("[data-save]").forEach(function (b) { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); }); sheet(); return; }
  });
  root.addEventListener("change", function (e) {
    var t = e.target, id = t.id;
    if (t.matches("[data-cmp]")) { var x = t.getAttribute("data-cmp"); if (t.checked) { if (cmp.length >= 3) { t.checked = false; return; } cmp.push(x); } else cmp = cmp.filter(function (y) { return y !== x; }); sheet(); return; }
    if (id === "f-loc") F.loc = t.value ? [t.value] : [];
    else if (id === "f-bhk") F.bhk = t.value ? [Number(t.value)] : [];
    else if (id === "f-min" || id === "m-min") F.min = Number(t.value) || 0;
    else if (id === "f-max" || id === "m-max") F.max = Number(t.value) || 0;
    else if (id === "f-sort") F.sort = t.value;
    else if (id === "m-more") { if (t.value) { F.loc.push(t.value); renderMatch(); } return; }
    else return;
    rerender();
  });
  root.addEventListener("input", function (e) { if (e.target.id === "f-q") { F.q = e.target.value.trim(); rerender(); } });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDlgs();
    if (e.key === "Tab") {
      var d = root.querySelector(".dlg:not([hidden]) .sheet"); if (!d) return;
      var f = d.querySelectorAll('a[href],button,input,select,[tabindex="0"]'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === d)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- start ---------- */
  root.innerHTML = '<p class="loading">Loading the listings...</p>';
  fetch(BASE + "/assets/data/listings.json").then(function (r) { return r.json(); }).then(function (d) {
    L = d; L.forEach(function (l) { BY[l.i] = l; });
    saved = (store("sfr_shortlist") || []).filter(function (i) { return BY[i]; }); cmp = saved.slice(0, 3);
    var id = readUrl();
    if (MODE === "browse") renderBrowse(); else renderMatch();
    updateCount();
    if (id && BY[id]) detail(id);
  }).catch(function () { root.innerHTML = '<p class="note">The list could not be loaded. See it on <a href="' + LIVE + '/find-property.htm">their current site</a>.</p>'; });
})();
