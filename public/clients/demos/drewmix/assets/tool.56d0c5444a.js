/* Drewmix redesign concept: the table finder (signature tool) and the enquiry composer.
   Only reshuffles the company's own catalogue data (dimensions, photographed sets); seat counts are an indicative calculation. */
(function () {
  "use strict";
  var D = document, W = window, DATA = W.DM_DATA, T = W.DM_I18N;
  if (!DATA || !T) return;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var TB = {}, CH = {}, SETBY = {};
  DATA.tables.forEach(function (t) { TB[t.s] = t; });
  DATA.chairs.forEach(function (c) { CH[c.s] = c; });
  DATA.sets.forEach(function (s) { (SETBY[s.t] = SETBY[s.t] || []).push(s); });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function f(tpl, o) { return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function num(x) { return Math.round(x) === x ? String(x) : String(x); }
  function img(files, widths, h, sizes, alt, cls) {
    var set = files.map(function (fl, i) { return DATA.imgbase + fl + " " + widths[i] + "w"; }).join(", ");
    return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="' + DATA.imgbase + files[files.length - 1] + '" srcset="' + set + '" sizes="' + sizes + '" width="' + widths[widths.length - 1] + '" height="' + h + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
  }

  /* seats: rectangular = both long sides at `place` cm per person (+2 at the ends when the table is >= 70 cm wide); round = circumference / place */
  function cap(t, len, place) {
    if (t.dia) { var s = Math.floor(Math.PI * len / place); return [s, s]; }
    var base = 2 * Math.floor(len / place), ends = (t.w || 0) >= 70 ? 2 : 0;
    return [base, base + ends];
  }
  function lens(t) { return t.dia ? [t.dia, t.diamax || t.dia] : [t.lmin, t.lmax]; }
  function evalTable(t, o) {
    var L = lens(t), cc = cap(t, L[0], o.place), co = cap(t, L[1], o.place), ext = L[1] > L[0];
    var status = null;
    if (cc[1] >= o.n && (!o.maxlen || L[0] <= o.maxlen)) status = "closed";
    else if (ext && co[1] >= o.n && (!o.maxlen || L[1] <= o.maxlen)) status = "open";
    if (!status) return null;
    var waste = status === "closed" ? cc[1] - o.n : co[1] - o.n;
    return { t: t, status: status, cc: cc, co: co, ext: ext, L: L, waste: waste };
  }
  function rng(a) { return a[0] === a[1] ? f(T.seats_one, { a: a[0] }) : f(T.seats, { a: a[0], b: a[1] }); }
  function dimsOf(t) {
    if (t.dia) return f(T.dims_dia, { d: num(t.dia) + (t.diamax > t.dia ? " / " + num(t.diamax) : "") });
    if (t.w == null) return num(t.lmin) + "–" + num(t.lmax) + " cm";
    return f(T.dims, { w: num(t.w), l: num(t.lmin) + (t.lmax > t.lmin ? " / " + num(t.lmax) : "") });
  }

  function init(root) {
    var compact = root.classList.contains("fx-compact"), limit = parseInt(root.getAttribute("data-limit"), 10) || 12, id = root.getAttribute("data-id");
    var list = $(".fx-list", root), head = $(".fx-h", root), more = $(".fx-more-wrap", root), note = $(".fx-note", root);
    var inPeople = $('input[name="people"]', root), inTables = $('input[name="tables"]', root), inLen = $('input[name="maxlen"]', root);
    var state = { n: 6, tables: 1, shape: "all", place: 60, maxlen: 0, shown: limit, pick: null };
    var bar = $("#fxbar");
    var qs = new URLSearchParams(W.location.search);
    if (qs.get("n")) { var q = parseInt(qs.get("n"), 10); if (q > 0) state.n = Math.min(200, q); }
    if (inPeople) inPeople.value = state.n;

    function readInputs() {
      var n = parseInt(inPeople.value, 10); state.n = isFinite(n) && n > 0 ? Math.min(200, n) : 1;
      if (inTables) { var t = parseInt(inTables.value, 10); state.tables = isFinite(t) && t > 0 ? Math.min(200, t) : 1; }
      var sh = $('input[name="shape-' + id + '"]:checked', root); state.shape = sh ? sh.value : "all";
      var pl = $('input[name="place-' + id + '"]:checked', root); state.place = pl ? parseInt(pl.value, 10) : 60;
      if (inLen) { var m = parseInt(inLen.value, 10); state.maxlen = isFinite(m) && m > 0 ? m : 0; }
    }
    function results() {
      var out = [];
      DATA.tables.forEach(function (t) {
        if (state.shape === "rect" && t.dia) return; if (state.shape === "round" && !t.dia) return;
        var r = evalTable(t, state); if (r) out.push(r);
      });
      out.sort(function (a, b) {
        if (a.status !== b.status) return a.status === "closed" ? -1 : 1;
        if (a.waste !== b.waste) return a.waste - b.waste;
        var pa = (SETBY[a.t.s] || []).length > 0 ? 0 : 1, pb = (SETBY[b.t.s] || []).length > 0 ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return a.L[1] - b.L[1];
      });
      return out;
    }
    function pairingsFor(t) {
      var ss = (SETBY[t.s] || []).slice(0, 8);
      if (!ss.length) return '<div class="pairs-box"><p class="nopair">' + esc(T.no_pairing) + "</p></div>";
      return '<div class="pairs-box"><p class="pairs-l">' + esc(T.pairings) + '</p><div class="pairs scroller" role="group" aria-label="' + esc(T.pairings) + '">' + ss.map(function (s) {
        var names = s.c.map(function (c) { return CH[c] ? CH[c].k : ""; }).filter(Boolean).join(", ");
        return '<button type="button" class="pair" data-set="' + s.k + '" data-table="' + t.s + '" aria-pressed="false" aria-label="' + esc(T.pick + ": " + s.cap) + '">' + img(s.f, s.fw, Math.round(s.h * 160 / s.w), "160px", s.cap) + "<span>" + esc(names) + "</span></button>";
      }).join("") + "</div></div>";
    }
    function card(r, i) {
      var t = r.t, L = r.L;
      var st = r.status === "closed" ? '<span class="status">' + esc(T.fits_closed) + "</span>" : '<span class="status is-open">' + esc(f(T.fits_open, { l: num(L[1]) })) + "</span>";
      var seats = '<span class="fcard-s"><b>' + esc(rng(r.cc)) + "</b> " + esc(T.closed) + (r.ext ? ' · <b>' + esc(rng(r.co)) + "</b> " + esc(T.extended) : "") + "</span>";
      var picked = state.pick && state.pick.table === t.s ? " is-picked" : "";
      var cs = compact ? (SETBY[t.s] || [])[0] : null;
      var tile = cs ? '<button type="button" class="fphoto" data-lb="' + DATA.imgbase + cs.f[cs.f.length - 1] + '" data-w="' + cs.fw[cs.fw.length - 1] + '" data-h="' + cs.h + '" data-cap="' + esc(cs.cap) + '" aria-label="' + esc(T.preview + ": " + cs.cap) + '">' + img(cs.f, cs.fw, Math.round(cs.h * 480 / cs.w), "(max-width: 900px) 92vw, 400px", cs.cap) + "<span>" + esc(cs.c.map(function (c) { return CH[c] ? CH[c].k : ""; }).filter(Boolean).join(", ")) + "</span></button>" : '<a class="tile" href="' + t.u + '" aria-label="' + esc(T.view_table + ": " + t.n) + '">' + img(t.f, t.fw, t.fh, "(max-width: 560px) 116px, 200px", t.n, "tile-img") + "</a>";
      var pairs = compact ? "" : pairingsFor(t);
      var act = compact ? '<div class="fcard-act"><a class="btn btn-line" href="' + t.u + '">' + esc(T.view_table) + "</a></div>"
        : '<div class="fcard-act"><button type="button" class="btn btn-line" data-pick-table="' + t.s + '">' + esc(T.pick_table) + '</button><a class="btn btn-line" href="' + t.u + '">' + esc(T.view_table) + "</a></div>";
      return '<article class="fcard' + (cs ? '' : ' fcard-h') + picked + '" data-table="' + t.s + '">' + tile + '<div class="fcard-i"><h4 class="fcard-n"><a href="' + t.u + '">' + esc(t.n) + "</a></h4>" + st +
        '<p class="fcard-d">' + esc(dimsOf(t) + " · " + f(T.height, { h: num(t.h) }) + (r.ext ? " · " + T.ext_note : "")) + "</p>" + seats + "</div>" + pairs + act + "</article>";
    }
    function render() {
      readInputs();
      var res = results();
      head.textContent = f(T.res_h, { n: state.n });
      if (!res.length) { list.innerHTML = '<p class="fx-none">' + esc(T.res_none) + "</p>"; more.innerHTML = ""; }
      else {
        list.innerHTML = res.slice(0, state.shown).map(card).join("");
        more.innerHTML = res.length > state.shown ? '<button type="button" class="btn btn-line" data-more>' + esc(T.show_more) + " (" + (res.length - state.shown) + ")</button>" : "";
      }
      if (note) note.textContent = compact ? "" : f(T.note, { p: state.place });
      // keep the compact "full finder" link in step with the number of people
      var full = $(".sec-finder .btn-line");
      if (compact && full && full.getAttribute("href")) full.href = full.getAttribute("href").split("?")[0] + "?n=" + state.n;
      refreshPickCards();
    }

    /* pick bar */
    function chairNames(s) { return s.c.map(function (c) { return CH[c] ? CH[c].n : ""; }).filter(Boolean); }
    function refreshPickCards() {
      $$(".fcard", root).forEach(function (c) { c.classList.toggle("is-picked", !!(state.pick && state.pick.table === c.getAttribute("data-table"))); });
      $$(".pair", root).forEach(function (p) { var on = !!(state.pick && state.pick.set === p.getAttribute("data-set")); p.classList.toggle("is-on", on); p.setAttribute("aria-pressed", on ? "true" : "false"); });
    }
    function showBar() {
      if (!bar) return; var p = state.pick; if (!p) { bar.hidden = true; D.body.classList.remove("has-fxbar"); return; }
      var t = TB[p.table], s = p.set ? DATA.sets.filter(function (x) { return x.k === p.set; })[0] : null;
      var title = t.n + (s ? " + " + chairNames(s).join(", ") : "");
      var k = state.tables, n = state.n;
      var sub = n + " · " + (k > 1 ? f(T.tables_n, { n: k }) : T.table_1) + (s ? " · " + f(T.chairs_n, { n: n * k }) : "");
      var gap = "";
      if (s && s.c.length) { var ch = CH[s.c[0]]; if (ch && ch.seat && t.h) gap = f(T.seat_gap, { d: num(t.h - ch.seat) }); }
      $("[data-pick-title]", bar).textContent = title; $("[data-pick-sub]", bar).textContent = sub; $("[data-pick-gap]", bar).textContent = gap;
      var im = $("[data-pick-img]", bar); im.innerHTML = s ? img(s.f, s.fw, 54, "76px", s.cap) : img(t.f, t.fw, t.fh, "76px", t.n);
      var big = s ? s : t; im.setAttribute("data-lb", DATA.imgbase + big.f[big.f.length - 1]); im.setAttribute("data-cap", s ? s.cap : t.n); im.setAttribute("data-w", big.fw[big.fw.length - 1]); im.setAttribute("data-h", s ? s.h : t.fh);
      var btn = $("[data-pick-add]", bar); btn.textContent = T.add; btn.removeAttribute("href");
      bar.hidden = false; D.body.classList.add("has-fxbar");
    }
    function addToEnquiry() {
      var p = state.pick; if (!p || !W.DM_ENQ) return;
      var k = state.tables, n = state.n; W.DM_ENQ.add(p.table, k);
      var s = p.set ? DATA.sets.filter(function (x) { return x.k === p.set; })[0] : null;
      if (s) { var per = Math.ceil(n * k / s.c.length); s.c.forEach(function (c) { W.DM_ENQ.add(c, per); }); }
      var btn = $("[data-pick-add]", bar); btn.textContent = T.added;
      var a = D.createElement("a"); a.className = "btn btn-line"; a.href = T.enq_url; a.textContent = T.enq_go; var wrap = btn.parentNode; var old = $(".fxbar-go", wrap); if (old) old.remove(); a.classList.add("fxbar-go"); wrap.appendChild(a);
    }
    if (bar) { $("[data-pick-add]", bar).addEventListener("click", addToEnquiry); }

    /* events */
    root.addEventListener("click", function (e) {
      var st = e.target.closest("[data-step]");
      if (st) {
        var inp = st.getAttribute("data-for") === "tables" ? inTables : inPeople, v = parseInt(inp.value, 10) || 1;
        inp.value = Math.max(1, Math.min(200, v + parseInt(st.getAttribute("data-step"), 10))); state.shown = limit; render(); return;
      }
      var pr = e.target.closest(".pair");
      if (pr) { var slug = pr.getAttribute("data-table"), setk = pr.getAttribute("data-set"); if (state.pick && state.pick.set === setk) { state.pick = null; } else state.pick = { table: slug, set: setk }; showBar(); refreshPickCards(); if (state.pick) { var s = DATA.sets.filter(function (x) { return x.k === setk; })[0]; if (s && W.DM_openLb && e.detail === 0) { /* keyboard: no lightbox */ } } return; }
      var pt = e.target.closest("[data-pick-table]");
      if (pt) { var sl = pt.getAttribute("data-pick-table"); state.pick = state.pick && state.pick.table === sl && !state.pick.set ? null : { table: sl, set: null }; showBar(); refreshPickCards(); return; }
      if (e.target.closest("[data-more]")) { state.shown += 12; render(); }
    });
    root.addEventListener("change", function () { state.shown = limit; render(); });
    [inPeople, inTables, inLen].forEach(function (inp) { if (inp) inp.addEventListener("input", function () { state.shown = limit; render(); }); });
    render();
  }
  $$("[data-finder]").forEach(init);

  /* ---------- enquiry composer (contact page) ---------- */
  var box = $("[data-enq-list]"), form = $("[data-enq-form]");
  if (box && form && W.DM_ENQ) {
    var F = T.form || {};
    function find(slug) { return TB[slug] || CH[slug] || null; }
    function draw() {
      var items = W.DM_ENQ.items();
      if (!items.length) { box.innerHTML = '<p class="enq-empty">' + esc(box.getAttribute("data-empty")) + "</p>"; return; }
      box.innerHTML = items.map(function (i) {
        var p = find(i.s); var name = p ? p.n : i.s, u = p ? p.u : "#";
        return '<div class="enq-item" data-s="' + esc(i.s) + '"><a href="' + u + '">' + esc(name) + '</a><div class="stepper" role="group" aria-label="' + esc(box.getAttribute("data-qty")) + '"><button type="button" data-q="-1" aria-label="−">−</button><input inputmode="numeric" value="' + i.q + '" aria-label="' + esc(box.getAttribute("data-qty")) + '"><button type="button" data-q="1" aria-label="+">+</button></div><button type="button" class="enq-rm" data-rm>' + esc(box.getAttribute("data-remove")) + "</button></div>";
      }).join("");
    }
    box.addEventListener("click", function (e) {
      var row = e.target.closest(".enq-item"); if (!row) return; var s = row.getAttribute("data-s");
      var q = e.target.closest("[data-q]"); if (q) { var cur = W.DM_ENQ.items().filter(function (i) { return i.s === s; })[0]; W.DM_ENQ.set(s, (cur ? cur.q : 1) + parseInt(q.getAttribute("data-q"), 10)); }
      if (e.target.closest("[data-rm]")) W.DM_ENQ.remove(s);
    });
    box.addEventListener("change", function (e) { var row = e.target.closest(".enq-item"); if (row && e.target.matches("input")) W.DM_ENQ.set(row.getAttribute("data-s"), parseInt(e.target.value, 10) || 1); });
    W.addEventListener("dm-enq", draw); draw();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form), name = (fd.get("name") || "").trim(), email = (fd.get("email") || "").trim(), err = $(".form-err", form);
      if (!name || !/.+@.+\..+/.test(email)) { err.hidden = false; return; } err.hidden = true;
      var tsel = form.querySelector('input[name="etype"]:checked'), tlab = tsel ? tsel.nextElementSibling.textContent : "";
      var lines = W.DM_ENQ.items().map(function (i) { var p = find(i.s); return "- " + (p ? p.n : i.s) + " x " + i.q + (p ? " (" + W.location.origin + p.u + ")" : ""); });
      var body = [F.mail_hello, "", F.mail_list, lines.length ? lines.join("\n") : "-", "", (F.f_type || "") + ": " + tlab, (F.f_name || "") + ": " + name, fd.get("company") ? (F.f_company || "") + ": " + fd.get("company") : "", fd.get("nip") ? (F.tax || "NIP") + ": " + fd.get("nip") : "", (F.f_email || "") + ": " + email, fd.get("phone") ? (F.f_phone || "") + ": " + fd.get("phone") : "", fd.get("msg") ? "\n" + fd.get("msg") : "", "", F.mail_bye, name].filter(function (x) { return x !== ""; }).join("\n");
      var subj = f(F.mail_subject || "{t}", { t: tlab });
      W.location.href = "mailto:" + T.mail_to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    });
  }
})();
