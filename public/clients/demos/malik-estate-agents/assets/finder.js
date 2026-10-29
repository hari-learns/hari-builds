/* Shortlist finder + hot-deals browser. Works only on their own listing data (inline JSON); nothing is invented, nothing leaves the device
   except the WhatsApp / email message the visitor chooses to send. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CFG = window.MEA || {}, data = [], BY = {};
  try { data = JSON.parse($("#mea-data").textContent); } catch (e) { return; }
  data.forEach(function (d) { BY[d.id] = d; });
  var page = document.body.getAttribute("data-page");
  var KIND = { floor: "Floor", bungalow: "Bungalow", farm: "Farmhouse", office: "Office" };
  var KINDS = { floor: "Floors", bungalow: "Bungalows & plots", farm: "Farmhouses", office: "Offices" };
  var WANT = { park: "Park facing", corner: "Corner plot", ready: "Ready to move", lift: "Lift", terrace: "Terrace", basement: "Basement / duplex", vastu: "Vastu perfect", "new": "Brand new" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function title(d) { return d.t && d.t !== d.c ? d.t : (KIND[d.k] + " in " + d.c); }
  function specs(d) {
    var s = [];
    if (d.yd) s.push(fmt(d.yd) + " sq yds"); if (d.ac) s.push(d.ac + " acres"); if (d.bhk) s.push(d.bhk + " BHK"); if (d.car) s.push(d.car + " car parking");
    if (d.sq && !d.yd) s.push(fmt(d.sq) + " sq ft"); return s;
  }
  function img(d, big) { var p = d.im && d.im[0]; if (!p) return ""; return CFG.img + "l/" + p[0] + (big ? "-l" : "-s") + ".webp"; }

  /* ---------- shortlist (device only) */
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem("mea-shortlist") || "[]").filter(function (i) { return BY[i]; }); } catch (e) { saved = []; }
  function persist() { try { localStorage.setItem("mea-shortlist", JSON.stringify(saved)); } catch (e) { } }
  function isSaved(id) { return saved.indexOf(id) >= 0; }
  function toggle(id) { var i = saved.indexOf(id); if (i >= 0) saved.splice(i, 1); else saved.push(id); persist(); sync(); }
  function sync() {
    $$("[data-save]").forEach(function (b) { var on = isSaved(+b.dataset.save); b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", (on ? "Remove from" : "Save to") + " my shortlist"); });
    var tray = $("#tray"); if (tray) { tray.hidden = !saved.length; $("#tray-n").textContent = saved.length + (saved.length === 1 ? " property saved" : " properties saved"); }
    var dl = $("#dlg"); if (dl && dl.open) { var sb = $("[data-dsave]", dl); if (sb) sb.textContent = isSaved(+sb.dataset.dsave) ? "Saved to shortlist" : "Save to shortlist"; }
  }
  function line(d) { return title(d) + ", " + d.c + (specs(d).length ? " (" + specs(d).slice(0, 3).join(", ") + ")" : ""); }
  function waLink(text) { return "https://wa.me/" + CFG.wa + (text ? "?text=" + encodeURIComponent(text) : ""); }
  var briefText = function () { return ""; };

  /* ---------- dialogs */
  var dlg = $("#dlg"), dlgL = $("#dlg-list"), lastFocus = null;
  function openD(d) { lastFocus = document.activeElement; d.showModal ? d.showModal() : d.setAttribute("open", ""); }
  function closeD(d) { d.close ? d.close() : d.removeAttribute("open"); }
  $$("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-close]")) closeD(d); });
    d.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); if (/#p=/.test(location.hash) && d === dlg) history.replaceState(null, "", location.pathname + location.search); });
  });
  function showItem(id) {
    var d = BY[id]; if (!d || !dlg) return;
    var media = $(".media", dlg), info = $(".info", dlg);
    if (d.im && d.im.length) {
      media.innerHTML = '<div class="main"><img id="dmain" src="' + CFG.img + "l/" + d.im[0][0] + '-l.webp" width="' + d.im[0][1] + '" height="' + d.im[0][2] + '" alt="' + esc(title(d) + ", " + d.c) + '"></div>' +
        (d.im.length > 1 ? '<div class="thumbs">' + d.im.map(function (p, i) { return '<button type="button" data-th="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + d.im.length + '"' + (i === 0 ? ' aria-current="true"' : "") + '><img src="' + CFG.img + "l/" + p[0] + '-s.webp" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "");
      media.style.display = "";
    } else {
      var big = d.yd ? "<b>" + fmt(d.yd) + "</b><small>sq yds</small>" : d.ac ? "<b>" + d.ac + "</b><small>acres</small>" : d.sq ? "<b>" + fmt(d.sq) + "</b><small>sq ft</small>" : "<b>" + KIND[d.k] + "</b>";
      media.innerHTML = '<div class="big-plot"><div class="plot">' + big + "</div></div>";
    }
    var notes = (d.n || []).concat(d.d ? [d.d] : []);
    var msg = "Hi Malik Estate Agents, I found this on your website and would like to know more:\n" + line(d) + (d.p ? "\nPrice: " + d.p : "") + "\nPlease call me.";
    info.innerHTML = '<p class="loc">' + esc(KIND[d.k]) + " &middot; " + esc(d.loc) + '</p><h2 id="dlg-h">' + esc(title(d)) + '</h2><div class="specs">' + specs(d).map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("") + "</div>" +
      (d.p ? '<p class="price">' + esc(d.p) + "</p>" : "") +
      (notes.length ? '<ul class="notes">' + notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="btn-row"><a class="btn btn-wa" target="_blank" rel="noopener" data-track="whatsapp" href="' + waLink(msg) + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>Ask about this</a>' +
      '<button type="button" class="btn btn-ghost" data-dsave="' + d.id + '">' + (isSaved(d.id) ? "Saved to shortlist" : "Save to shortlist") + '</button></div>' +
      '<a class="btn btn-ghost btn-sm" data-track="call" style="justify-self:start" href="tel:' + CFG.phone + '">Call ' + esc(CFG.phone.replace("+91", "+91 ")) + "</a>" +
      '<p class="src">' + (d.post ? "Posted on their site: " + esc(d.post) + ". " : "") + "From malikestateagents.com. Confirm availability with the office.</p>";
    openD(dlg);
  }
  if (dlg) {
    dlg.addEventListener("click", function (e) {
      var t = e.target.closest("[data-th]");
      if (t) { var id = +(location.hash.match(/p=(\d+)/) || [0, dlg.dataset.id])[1] || +dlg.dataset.id; var d = BY[dlg.dataset.id], i = +t.dataset.th; var m = $("#dmain", dlg); m.src = CFG.img + "l/" + d.im[i][0] + "-l.webp"; $$("[data-th]", dlg).forEach(function (b) { b.removeAttribute("aria-current"); }); t.setAttribute("aria-current", "true"); }
      var s = e.target.closest("[data-dsave]"); if (s) toggle(+s.dataset.dsave);
    });
  }
  function open(id) { if (dlg) { dlg.dataset.id = id; showItem(id); } }
  function showList() {
    if (!dlgL) return;
    var info = $(".info", dlgL);
    var items = saved.map(function (i) { return BY[i]; });
    var text = "Hi Malik Estate Agents, I put together this shortlist on your website:\n" + items.map(function (d, i) { return (i + 1) + ". " + line(d); }).join("\n") +
      (briefText() ? "\n\nWhat I am looking for: " + briefText() : "") + "\n\nPlease call me.";
    info.innerHTML = '<h2 id="list-h">My shortlist (' + items.length + ")</h2>" + '<ul class="sl">' + items.map(function (d) { return '<li><span>' + esc(line(d)) + '</span><button type="button" data-rm="' + d.id + '">Remove</button></li>'; }).join("") + "</ul>" +
      '<p class="sub">This is the message that will be sent. Add your name at the end.</p><div class="msg" id="msgprev">' + esc(text) + "</div>" +
      '<label class="fld"><span>Your name (optional)</span><input type="text" id="sl-name" autocomplete="name"></label>' +
      '<div class="btn-row"><a class="btn btn-wa" id="sl-wa" target="_blank" rel="noopener" data-track="whatsapp" href="' + waLink(text) + '">Send on WhatsApp</a><a class="btn btn-ghost" id="sl-mail" data-track="email" href="mailto:' + CFG.email + "?subject=" + encodeURIComponent("Shortlist from your website") + "&body=" + encodeURIComponent(text) + '">Send by email</a></div><p class="sub">Nothing is stored on this site. The message opens in WhatsApp or your mail app for you to send.</p>';
    function upd() { var n = $("#sl-name", info).value.trim(); var tt = text + (n ? "\nName: " + n : ""); $("#msgprev", info).textContent = tt; $("#sl-wa", info).href = waLink(tt); $("#sl-mail", info).href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent("Shortlist from your website") + "&body=" + encodeURIComponent(tt); }
    $("#sl-name", info).addEventListener("input", upd);
    openD(dlgL);
  }
  if (dlgL) dlgL.addEventListener("click", function (e) { var r = e.target.closest("[data-rm]"); if (r) { toggle(+r.dataset.rm); if (saved.length) showList(); else closeD(dlgL); } });
  var tray = $("#tray"); if (tray) $("#tray-open").addEventListener("click", showList);
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]"); if (o) { open(+o.dataset.open); return; }
    var s = e.target.closest("[data-save]"); if (s) { toggle(+s.dataset.save); }
  });
  function hashOpen() { var m = location.hash.match(/p=(\d+)/); if (m && BY[m[1]]) open(+m[1]); }
  window.addEventListener("hashchange", hashOpen);

  /* ---------- browse page: filter the server-rendered cards */
  if (page === "browse") {
    var grid = $("#lgrid"), cards = $$(".lcard", grid), F = { k: "", c: "", b: "", y: "", q: "", p: false, s: "photo" };
    var cnt = $("#fcount"), clr = $("#fclear"), emp = $("#fempty");
    function apply() {
      var n = 0, y = F.y ? F.y.split("-").map(Number) : null, qs = F.q.toLowerCase().split(/\s+/).filter(Boolean);
      cards.forEach(function (c) {
        var ok = true, yd = +c.dataset.yd, bhk = +c.dataset.bhk;
        if (F.k && c.dataset.k !== F.k) ok = false;
        if (ok && F.c && c.dataset.c !== F.c) ok = false;
        if (ok && F.b) { var bb = +F.b; if (!bhk || (bb === 5 ? bhk < 5 : bhk !== bb)) ok = false; }
        if (ok && y) { if (!yd || yd < y[0] || yd >= y[1]) ok = false; }
        if (ok && F.p && c.dataset.ph !== "1") ok = false;
        if (ok && qs.length) { var hay = c.dataset.q + " " + c.dataset.f; qs.forEach(function (w) { if (hay.indexOf(w) < 0) ok = false; }); }
        c.hidden = !ok; if (ok) n++;
      });
      var arr = cards.slice();
      var key = { photo: function (c) { return [c.dataset.ph === "1" ? 0 : 1, +c.dataset.o]; }, "new": function (c) { return [0, +c.dataset.o]; }, "yd-d": function (c) { return [-(+c.dataset.yd), +c.dataset.o]; }, "yd-a": function (c) { return [(+c.dataset.yd || 1e9), +c.dataset.o]; } }[F.s];
      arr.sort(function (a, b) { var x = key(a), z = key(b); return x[0] - z[0] || x[1] - z[1]; }).forEach(function (c, i) { c.style.order = i; });
      grid.style.display = "grid";
      cnt.innerHTML = "<b>" + n + "</b> " + (n === 1 ? "property" : "properties");
      emp.hidden = n > 0; clr.hidden = !(F.k || F.c || F.b || F.y || F.q || F.p);
    }
    $$("#kchips .chip").forEach(function (b) { b.addEventListener("click", function () { F.k = b.dataset.k; $$("#kchips .chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); apply(); }); });
    [["f-c", "c"], ["f-b", "b"], ["f-y", "y"], ["f-s", "s"]].forEach(function (p) { $("#" + p[0]).addEventListener("change", function (e) { F[p[1]] = e.target.value; apply(); }); });
    $("#f-q").addEventListener("input", function (e) { F.q = e.target.value; apply(); });
    $("#f-p").addEventListener("change", function (e) { F.p = e.target.checked; apply(); });
    clr.addEventListener("click", function () { F = { k: "", c: "", b: "", y: "", q: "", p: false, s: F.s }; ["f-c", "f-b", "f-y"].forEach(function (i) { $("#" + i).value = ""; }); $("#f-q").value = ""; $("#f-p").checked = false; $$("#kchips .chip").forEach(function (x, i) { x.setAttribute("aria-pressed", i === 0 ? "true" : "false"); }); apply(); });
    var qp = new URLSearchParams(location.search);
    if (qp.get("c") && $("#f-c [value='" + qp.get("c").replace(/'/g, "") + "']")) { F.c = qp.get("c"); $("#f-c").value = F.c; }
    if (qp.get("photos")) { F.p = true; $("#f-p").checked = true; }
    apply(); sync(); hashOpen();
  }

  /* ---------- finder page: score every property against the brief */
  if (page === "find") {
    var form = $("#brief"), res = $("#fresults"), more = $("#fmore"), moreBtn = $("#fmore-btn"), shown = 12, last = [];
    function vals(name) { return $$("input[name='" + name + "']:checked", form).map(function (i) { return i.value; }); }
    function val(name) { var i = $("input[name='" + name + "']:checked", form); return i ? i.value : ""; }
    function read() { return { ks: vals("k"), cs: vals("c"), y: val("y"), b: val("b"), ws: vals("w") }; }
    function flagOf(d, w) { var f = d.f || []; return w === "basement" ? (f.indexOf("basement") >= 0 || f.indexOf("duplex") >= 0) : f.indexOf(w) >= 0; }
    function score(d, B) {
      if (B.ks.length && B.ks.indexOf(d.k) < 0) return null;
      if (B.cs.length && d.k !== "farm" && B.cs.indexOf(d.c) < 0) return null;
      var why = [], miss = [];
      if (B.y && d.yd) { var r = B.y.split("-").map(Number); if (d.yd < r[0] || d.yd >= r[1]) return null; why.push("Plot " + fmt(d.yd) + " sq yds, inside your range"); }
      else if (B.y && !d.yd && d.k !== "farm") miss.push("plot size not stated");
      if (B.b && d.bhk) { var bb = +B.b; if (bb === 5 ? d.bhk < 5 : d.bhk !== bb) return null; why.push(d.bhk + " BHK"); }
      else if (B.b && !d.bhk && d.k !== "farm" && d.k !== "office") miss.push("BHK not stated");
      if (B.cs.length && d.k !== "farm") why.push(d.c);
      var got = 0, miss2 = [];
      B.ws.forEach(function (w) { if (flagOf(d, w)) { got++; why.push(WANT[w]); } else miss2.push(WANT[w]); });
      var s = got * 10 + (d.ph ? 3 : 0) + (d.p ? 1 : 0) + (B.y && d.yd ? 2 : 0) + (B.b && d.bhk ? 2 : 0);
      return { d: d, s: s, why: why, got: got, want: B.ws.length, miss: miss.concat(miss2.length ? ["not stated: " + miss2.join(", ").toLowerCase()] : []) };
    }
    function card(r) {
      var d = r.d, im = img(d), sp = specs(d).map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("");
      var media = im ? '<div class="ph"><img src="' + im + '" width="' + d.im[0][1] + '" height="' + d.im[0][2] + '" alt="' + esc(title(d) + ", " + d.c) + '" loading="lazy" decoding="async"><span class="kind">' + KIND[d.k] + "</span></div>"
        : '<div class="ph nophoto"><div class="plot"><b>' + (d.yd ? fmt(d.yd) : d.ac ? d.ac : d.sq ? fmt(d.sq) : KIND[d.k]) + "</b><small>" + (d.yd ? "sq yds" : d.ac ? "acres" : d.sq ? "sq ft" : "") + '</small></div><span class="kind">' + KIND[d.k] + "</span></div>";
      var w = r.want ? '<div class="why"><span>Fits ' + r.got + " of " + r.want + " wishes</span>" + (r.why.length ? "<span>" + esc(r.why.join(" · ")) + "</span>" : "") + (r.miss.length ? '<span class="miss">' + esc(r.miss.join("; ")) + "</span>" : "") + "</div>"
        : (r.why.length || r.miss.length ? '<div class="why">' + (r.why.length ? "<span>" + esc(r.why.join(" · ")) + "</span>" : "") + (r.miss.length ? '<span class="miss">' + esc(r.miss.join("; ")) + "</span>" : "") + "</div>" : "");
      return '<article class="lcard"><button type="button" class="open" data-open="' + d.id + '" aria-label="Open ' + esc(title(d)) + ", " + esc(d.c) + '">' + media + '</button><button type="button" class="save" data-save="' + d.id + '" aria-pressed="false" aria-label="Save to my shortlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 4 4.5 7.2 4.5c1.9 0 3.5 1 4.8 2.8 1.3-1.8 2.9-2.8 4.8-2.8 3.2 0 5.6 3.2 4.4 6.6-1.7 4.800-9.200 9.400-9.200 9.400z"/></svg></button>' +
        '<div class="body"><p class="loc">' + esc(d.loc) + '</p><h3><button type="button" class="open-t" data-open="' + d.id + '">' + esc(title(d)) + '</button></h3><div class="specs">' + sp + "</div>" + w + (d.p ? '<div class="price">' + esc(d.p) + "</div>" : "") + "</div></article>";
    }
    function briefLine(B) {
      var p = [];
      if (B.ks.length) p.push(B.ks.map(function (k) { return KINDS[k]; }).join(" / "));
      if (B.cs.length) p.push(B.cs.join(", "));
      if (B.y) { var r = B.y.split("-").map(Number); p.push(r[1] >= 99999 ? fmt(r[0]) + "+ sq yds" : (r[0] ? fmt(r[0]) + " to " : "up to ") + fmt(r[1]) + " sq yds"); }
      if (B.b) p.push(B.b === "5" ? "5 BHK or more" : B.b + " BHK");
      if (B.ws.length) p.push(B.ws.map(function (w) { return WANT[w].toLowerCase(); }).join(", "));
      return p.join("; ");
    }
    function run(reset) {
      var B = read(), out = [];
      data.forEach(function (d) { var r = score(d, B); if (r) out.push(r); });
      out.sort(function (a, b) { return b.s - a.s || a.d.id - b.d.id; });
      last = out; if (reset) shown = 12;
      briefText = function () { return briefLine(B); };
      var n = out.length, any = B.ks.length || B.cs.length || B.y || B.b || B.ws.length;
      var jp = $("#jump"); if (jp) jp.firstChild.nodeValue = (n ? "Show " + n + (n === 1 ? " match " : " matches ") : "No matches ");
      $("#fcount").textContent = n + (n === 1 ? " property" : " properties") + (any ? " match" + (n === 1 ? "es" : "") : "");
      $("#fsub").textContent = any ? (B.ws.length ? "Closest to your wishes first" : "Photos first") : "Choose from the left to narrow these down";
      res.innerHTML = out.slice(0, shown).map(card).join("");
      more.hidden = n <= shown;
      var enq = $("#fenq"); enq.hidden = !any;
      if (any) enq.href = waLink("Hi Malik Estate Agents, this is what I am looking for in South Delhi: " + briefLine(B) + ". " + (n ? "I found " + n + " matching properties on your website; please call me with the best options." : "I could not find an exact match on your website; please call me with what you have.") + "\nPlease call me.");
      if (!n) res.innerHTML = '<p class="empty">No property on their site matches every choice. Loosen the plot size or colonies, or use <b>Send my brief</b> and the office will call with what they have.</p>';
      sync();
      var u = new URLSearchParams(); B.ks.forEach(function (k) { u.append("k", k); }); if (B.cs.length) u.set("c", B.cs.join("|")); if (B.y) u.set("y", B.y); if (B.b) u.set("b", B.b); if (B.ws.length) u.set("w", B.ws.join(","));
      try { history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u.toString() : "") + location.hash); } catch (e) { }
    }
    var cm = $("#colmore"), cs = $("#colset");
    cm.addEventListener("click", function () { var open = cs.classList.toggle("collapsed") === false; cm.setAttribute("aria-expanded", open ? "true" : "false"); cm.textContent = open ? "Show fewer colonies" : "Show all " + $$("input", cs).length + " colonies"; });
    form.addEventListener("change", function () { run(true); });
    moreBtn.addEventListener("click", function () { shown += 12; run(false); });
    $("#breset").addEventListener("click", function () { $$("input", form).forEach(function (i) { i.checked = (i.type === "radio" && i.value === ""); }); run(true); });
    /* start from the URL (the home page quick search sends k, c, b) */
    var qp = new URLSearchParams(location.search);
    qp.getAll("k").forEach(function (k) { var i = $("input[name='k'][value='" + k + "']", form); if (i) i.checked = true; });
    (qp.get("c") || "").split("|").filter(Boolean).forEach(function (c) { $$("input[name='c']", form).forEach(function (i) { if (i.value === c) i.checked = true; }); });
    ["y", "b"].forEach(function (n) { var v = qp.get(n); if (v !== null) $$("input[name='" + n + "']", form).forEach(function (i) { i.checked = i.value === v; }); });
    (qp.get("w") || "").split(",").filter(Boolean).forEach(function (w) { var i = $("input[name='w'][value='" + w + "']", form); if (i) i.checked = true; });
    /* selected colonies float to the front of the chip list */
    run(true); hashOpen();
  }
})();
