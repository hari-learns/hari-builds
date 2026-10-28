(function () {
  "use strict";
  var d = document, $ = function (id) { return d.getElementById(id); };
  var D = JSON.parse($("tooldata").textContent), T = JSON.parse($("tooltext").textContent);
  var BASE = location.pathname.replace(/dobierz\/.*$/, "");
  var tabT = $("tab-t"), tabB = $("tab-b"), paneT = $("pane-t"), paneB = $("pane-b");
  var tsel = $("tsel"), ssel = $("ssel"), own = $("own"), sizefld = $("sizefld");
  var res = $("res"), sum = $("sum"), more = $("more");
  var mode = "t", limit = 24, focus = null, list = [];
  var fmt = function (s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ""; }); };
  var num = function (v) { return (Math.round(v * 10) / 10).toString().replace(".", ","); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var kindName = { k: "Krzesło", f: "Fotel", h: "Hoker", o: "Outdoor" };
  try { list = JSON.parse(localStorage.getItem("jd-list") || "[]"); } catch (e) { list = []; }

  function tableBy(s) { return D.tables.filter(function (t) { return t.s === s; })[0]; }
  function fillSizes() {
    var t = tableBy(tsel.value); ssel.innerHTML = "";
    if (!t) return;
    t.t.forEach(function (x, i) { var o = d.createElement("option"); o.value = i; o.textContent = x.label.replace(/x/g, " × ").replace("ø", "ø "); ssel.appendChild(o); });
    var pref = t.t.findIndex(function (x) { return x.label === "240x100x76"; }); if (pref > -1) ssel.value = pref;
  }
  function radio(name) { var r = d.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
  function currentTable() {
    if (tsel.value === "__own") {
      var shape = radio("shape"), h = +$("oh").value || 76, th = +$("ot").value || 4;
      if (shape === "round") return { name: T.own_table + " ø" + (+$("od").value || 120), top: { shape: "round", d: +$("od").value || 120 }, h: h, th: th };
      return { name: T.own_table + " " + (+$("ol").value || 200) + " × " + (+$("ow").value || 90), top: { shape: "rect", l: +$("ol").value || 200, w: +$("ow").value || 90 }, h: h, th: th };
    }
    var t = tableBy(tsel.value), top = t.t[+ssel.value || 0];
    return { name: t.n + " " + top.label.replace(/x/g, " × "), top: top, h: top.h || 76, th: t.th || 4, slug: t.s };
  }
  function seatsAt(tw, top, heads) {
    if (!tw) return null;
    if (top.shape === "round") return Math.floor(Math.PI * top.d / (tw + 10));
    var n = 2 * Math.floor(top.l / (tw + 10)); if (heads) n += 2 * Math.floor(top.w / (tw + 10)); return n;
  }

  function render() {
    var rows = [], total = 0, html = "";
    if (mode === "t") {
      var tb = currentTable(), kind = radio("kind"), armok = $("armok").checked, heads = $("heads").checked, outd = $("outd").checked;
      var under = tb.h - tb.th;
      D.seats.forEach(function (s) {
        var isK = s.f === "k" || (outd && s.f === "o" && !s.ah), isF = s.f === "f" || (outd && s.f === "o" && s.ah);
        if (s.f === "h") return;
        if (!((kind.indexOf("k") > -1 && isK) || (kind.indexOf("f") > -1 && isF))) return;
        total++;
        var gap = tb.h - s.sh; if (gap < 26 || gap > 32) return;
        var arm = s.ah ? (s.ah + 2 <= under) : null;
        if (armok && arm === false) return;
        var why = ['<li>' + esc(fmt(T.gap, { sh: num(s.sh), gap: num(gap) })) + "</li>"];
        if (s.ah) why.push('<li class="' + (arm ? "" : "no") + '">' + esc(fmt(arm ? T.arm_ok : T.arm_no, { ah: num(s.ah) })) + "</li>");
        else why.push('<li class="na">' + esc(T.no_arm) + "</li>");
        var n = seatsAt(s.tw, tb.top, heads);
        rows.push({ s: s, why: why, n: n, score: (arm === false ? 0 : 1) * 1000 + (n || 0), ctx: tb.name + (n ? " (" + n + " " + "miejsc)" : "") });
      });
      var tbi = tb.slug ? tableBy(tb.slug).i : "";
      sum.innerHTML = (tbi ? '<img src="' + tbi + '" width="480" height="480" alt="' + esc(tb.name) + '">' : "") + "<p>" + esc(fmt(T.sum_table, { table: tb.name, fit: rows.length, all: total })) + "</p>";
    } else {
      var h = +$("bh").value || 105, L = +$("bl").value || 300, lo = h - 35, hi = h - 25;
      D.seats.forEach(function (s) {
        if (s.f !== "h") return; total++;
        var hs = [s.sh]; if (s.two) hs.push(80);
        var ok = hs.filter(function (x) { return x >= lo && x <= hi; });
        if (!ok.length) return;
        var hh = ok[ok.length - 1], n = s.tw ? Math.floor(L / (s.tw + 15)) : null;
        var why = ["<li>" + esc(fmt(T.order_h, { h: hh })) + "</li>", "<li>" + esc(fmt(T.gap, { sh: hh, gap: h - hh })) + "</li>"];
        rows.push({ s: s, why: why, n: n, bar: true, score: n || 0, ctx: "bar " + h + " cm, siedzisko " + hh + " cm", L: L });
      });
      sum.innerHTML = "<p>" + esc(fmt(T.sum_bar, { h: h, lo: lo, hi: hi, fit: rows.length })) + "</p>";
    }
    rows.sort(function (a, b) { return b.score - a.score || a.s.n.localeCompare(b.s.n); });
    if (focus) { var fi = rows.findIndex(function (r) { return r.s.s === focus; }); if (fi > 0) rows.unshift(rows.splice(fi, 1)[0]); }
    if (!rows.length) html = '<li class="box" style="margin:0">' + esc(T.none) + "</li>";
    rows.slice(0, limit).forEach(function (r) {
      var s = r.s, inList = list.some(function (x) { return x.s === s.s; });
      var seats = r.n ? (r.bar ? fmt(T.seats_bar, { n: r.n, l: r.L }) : fmt(T.seats, { n: r.n })) : "";
      html += '<li class="ri' + (s.s === focus ? " is-focus" : "") + '"><img src="' + s.i + '" width="480" height="480" alt="' + esc(s.n) + '" loading="lazy" decoding="async">' +
        '<div><h3><a href="' + BASE + "produkt/" + s.s + '/">' + esc(s.n) + "</a></h3><p class=\"muted\" style=\"margin:0 0 6px;font-size:.9375rem\">" + esc(kindName[s.f]) + (s.tw ? " · " + esc(fmt(T.width, { tw: num(s.tw) })) : "") + "</p>" +
        '<ul class="ri__why">' + r.why.join("") + "</ul></div>" +
        '<div class="ri__act">' + (seats ? '<span class="ri__seats">' + esc(seats) + "</span>" : "") +
        '<label class="qty"><span class="sr-only">' + esc(T.qty) + '</span><input type="number" min="1" max="999" inputmode="numeric" value="' + (r.n || 1) + '" aria-label="' + esc(T.qty + " " + s.n) + '"></label>' +
        '<button type="button" class="btn ' + (inList ? "btn--green" : "btn--line") + '" data-s="' + s.s + '" data-n="' + esc(s.n) + '" data-c="' + esc(r.ctx) + '">' + esc(inList ? T.added : T.add) + "</button></div></li>";
    });
    res.innerHTML = html;
    more.hidden = rows.length <= limit;
  }

  res.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-s]"); if (!b) return;
    var q = +b.parentNode.querySelector("input").value || 1;
    var ex = list.filter(function (x) { return x.s === b.dataset.s; })[0];
    if (ex) { ex.q = q; ex.c = b.dataset.c; } else list.push({ s: b.dataset.s, n: b.dataset.n, q: q, c: b.dataset.c });
    save(); b.textContent = T.added; b.className = "btn btn--green";
  });
  function save() { try { localStorage.setItem("jd-list", JSON.stringify(list)); } catch (e) {} drawList(); }
  function drawList() {
    var ul = $("blist"); ul.innerHTML = "";
    $("bempty").hidden = list.length > 0;
    list.forEach(function (x, i) {
      var li = d.createElement("li");
      li.innerHTML = "<span><b>" + esc(x.q + " × " + x.n) + "</b><br><span class=\"muted\" style=\"font-size:.9375rem\">" + esc(x.c) + "</span></span>" +
        '<button type="button" aria-label="' + esc(T.remove + " " + x.n) + '">&times;</button>';
      li.querySelector("button").addEventListener("click", function () { list.splice(i, 1); save(); render(); });
      ul.appendChild(li);
    });
    var lines = list.map(function (x) { return "- " + x.q + " × " + x.n + " (" + x.c + ") " + T.site + "/produkt/" + x.s + "/"; });
    var body = T.mail_intro + "\n" + (lines.join("\n") || "-") + "\n\n" + T.mail_venue + ": " + $("venue").value + "\n" + T.mail_city + ": " + ($("city").value || "") +
      "\n" + T.mail_fr + ": " + ($("fr").checked ? T.yes : T.no) + "\n" + T.mail_end;
    $("send").href = "mailto:" + T.to + "?cc=" + T.cc + "&subject=" + encodeURIComponent(T.mail_subj) + "&body=" + encodeURIComponent(body);
  }

  function setMode(m) {
    mode = m; limit = 24;
    tabT.setAttribute("aria-selected", m === "t"); tabB.setAttribute("aria-selected", m === "b");
    paneT.hidden = m !== "t"; paneB.hidden = m !== "b"; render();
  }
  tabT.addEventListener("click", function () { setMode("t"); });
  tabB.addEventListener("click", function () { setMode("b"); });
  tsel.addEventListener("change", function () { var o = tsel.value === "__own"; own.hidden = !o; sizefld.hidden = o; if (!o) fillSizes(); render(); });
  d.querySelectorAll('input[name="shape"]').forEach(function (r) { r.addEventListener("change", function () { var rd = radio("shape") === "round"; $("own-rect").hidden = rd; $("own-round").hidden = !rd; render(); }); });
  d.querySelectorAll('input[name="bpre"]').forEach(function (r) { r.addEventListener("change", function () { $("bh").value = r.value; render(); }); });
  ["ssel", "ol", "ow", "od", "oh", "ot", "armok", "heads", "outd", "bh", "bl"].forEach(function (id) { $(id).addEventListener("input", render); $(id).addEventListener("change", render); });
  d.querySelectorAll('input[name="kind"]').forEach(function (r) { r.addEventListener("change", render); });
  ["venue", "city", "fr"].forEach(function (id) { $(id).addEventListener("input", drawList); $(id).addEventListener("change", drawList); });
  more.addEventListener("click", function () { limit += 24; render(); });

  var P = new URLSearchParams(location.search);
  if (P.get("stol") && tableBy(P.get("stol"))) tsel.value = P.get("stol");
  fillSizes();
  focus = P.get("krzeslo") || P.get("hoker");
  drawList();
  setMode(P.get("tab") === "bar" ? "b" : "t");
})();
