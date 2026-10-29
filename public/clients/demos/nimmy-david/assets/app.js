/* data-driven parts: vlog dialog, shortlist (localStorage, optional), vlogs filters, the home finder */
(function () {
  var ND = window.ND; if (!ND) return;
  var V = ND.vlogs, BY = {}; V.forEach(function (v) { BY[v.i] = v; });
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.7 4 4.5 7.200 4.500c1.900 0 3.500 1 4.800 2.800 1.300-1.800 2.900-2.800 4.800-2.800 3.200 0 5.600 3.200 4.400 6.600-1.700 4.800-9.200 9.400-9.200 9.400z"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.500v15l13-7.500z"/></svg>';
  var WAI = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.600 15L2 22l5.200-1.400A10 10 0 1 0 12 2zm0 18.200a8.200 8.200 0 0 1-4.200-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200z"/></svg>';

  /* ---------- shortlist */
  var KEY = "nd-shortlist", list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (i) { return BY[i]; }); } catch (e) { list = []; }
  var persist = function () { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { } };
  var wish = {};  /* what the visitor asked for on the finder page */
  var priceTxt = function (v) { return v.price ? v.ptxt : "price not in the vlog"; };
  var msg = function (ids, single) {
    var L = ["Hi Nimmy, I am looking at homes from your vlogs on your website."];
    if (single) { var v = BY[single]; L.push("I would like to know more about " + v.name + " (" + v.tl + ", " + v.area + ", " + priceTxt(v) + "). Vlog: https://youtu.be/" + v.id); }
    else { L.push("My shortlist:"); ids.forEach(function (i, n) { var v = BY[i]; L.push((n + 1) + ". " + v.name + " - " + v.tl + ", " + v.area + ", " + priceTxt(v) + " - https://youtu.be/" + v.id); }); }
    var w = []; if (wish.type) w.push(wish.type); if (wish.where) w.push(wish.where); if (wish.budget) w.push(wish.budget);
    if (!single && w.length) L.push("I am looking for: " + w.join(", ") + ".");
    if (wish.abroad) L.push("I am buying from abroad, so a video walkthrough first would help.");
    L.push("Please call or message me.");
    return L.join("\n");
  };
  var waUrl = function (t) { return "https://wa.me/" + ND.wa + "?text=" + encodeURIComponent(t); };
  var toast = function (t) { var n = $("#toast"); if (!n) return; n.textContent = t; n.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { n.classList.remove("on"); }, 1800); };
  var syncSave = function () {
    $$("[data-save]").forEach(function (b) { var on = list.indexOf(+b.dataset.save) > -1; b.setAttribute("aria-pressed", on ? "true" : "false"); var s = $("span", b); if (s) s.textContent = on ? "Saved" : "Save"; });
    var tray = $("#tray"); if (!tray) return;
    tray.classList.toggle("on", list.length > 0); document.body.classList.toggle("has-tray", list.length > 0);
    $("#tray-n").textContent = list.length === 1 ? "1 home on your shortlist" : list.length + " homes on your shortlist";
    $("#tray-names").textContent = list.map(function (i) { return BY[i].name; }).join(" · ");
    $("#tray-wa").href = waUrl(msg(list));
  };
  var toggle = function (i) { var k = list.indexOf(i); if (k > -1) list.splice(k, 1); else list.push(i); persist(); syncSave(); toast(k > -1 ? "Removed from your shortlist" : "Saved to your shortlist"); renderModalList(); };
  document.addEventListener("click", function (e) {
    var s = e.target.closest("[data-save]"); if (s) { toggle(+s.dataset.save); return; }
    var o = e.target.closest("[data-open]"); if (o) { openModal(+o.dataset.open, o); return; }
    if (e.target.closest("[data-m-close]")) { closeModal(); return; }
    if (e.target.closest("#tray-clear")) { list = []; persist(); syncSave(); renderModalList(); return; }
    if (e.target.closest("#tray-view")) { openList(e.target); return; }
  });

  /* ---------- dialog */
  var M = $("#modal"), lastF = null;
  function closeModal() { if (!M) return; M.classList.remove("open"); $("#m-video").innerHTML = ""; document.documentElement.style.overflow = ""; if (lastF) { try { lastF.focus(); } catch (e) { } } }
  function openModal(i, from) {
    if (!M) return; var v = BY[i]; lastF = from || document.activeElement;
    $("#m-video").innerHTML = '<img src="' + v.img2 + '" width="' + v.w + '" height="' + v.h + '" alt="Poster of the vlog: ' + esc(v.name) + '"><button type="button" class="bigplay" aria-label="Play the vlog: ' + esc(v.name) + '"><span>' + PLAY + '</span></button>';
    $("#m-video .bigplay").addEventListener("click", function () { $("#m-video").innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1" title="' + esc(v.name) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'; });
    $("#m-title").textContent = v.name; $("#m-meta").textContent = v.tl + " · " + v.area;
    var p = $("#m-price"); p.textContent = v.price ? v.ptxt : "Price: ask Nimmy"; p.className = "price" + (v.price ? "" : " na");
    $("#m-tags").innerHTML = v.facts.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    $("#m-actions").innerHTML = '<a class="btn btn-wa" target="_blank" rel="noopener" data-track="whatsapp" href="' + waUrl(msg([], v.i)) + '">' + WAI + 'Ask Nimmy about this</a><button type="button" class="save" data-save="' + v.i + '" aria-pressed="false">' + HEART + '<span>Save</span></button><a class="open-btn" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + v.id + '">Open on YouTube</a>';
    $("#m-list").hidden = true; syncSave();
    M.classList.add("open"); document.documentElement.style.overflow = "hidden"; $(".m-x", M).focus();
  }
  function listHtml() {
    if (!list.length) return "<p>Nothing saved yet.</p>";
    return '<h3 style="font-size:1.4rem;margin-bottom:8px">Your shortlist</h3><ul class="sl-list">' + list.map(function (i) { var v = BY[i]; return '<li><span><b>' + esc(v.name) + '</b> <span style="color:var(--muted)">' + esc(v.tl) + ' · ' + esc(v.price ? v.ptxt : "ask for price") + '</span></span><button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(v.name) + '">×</button></li>'; }).join("") + '</ul><div class="m-actions"><a class="btn btn-wa" target="_blank" rel="noopener" data-track="whatsapp" href="' + waUrl(msg(list)) + '">' + WAI + 'Send shortlist to Nimmy</a><a class="open-btn" href="mailto:' + ND.email + '?subject=' + encodeURIComponent("My shortlist from your vlogs") + '&body=' + encodeURIComponent(msg(list)) + '" data-track="email">Email it instead</a></div>';
  }
  function renderModalList() { var l = $("#m-list"); if (l && !l.hidden) { l.innerHTML = listHtml(); if (!list.length) closeModal(); } }
  function openList(from) {
    if (!M) return; lastF = from;
    $("#m-video").innerHTML = ""; $("#m-title").textContent = "Your shortlist"; $("#m-meta").textContent = ""; $("#m-price").textContent = ""; $("#m-tags").innerHTML = ""; $("#m-actions").innerHTML = "";
    var l = $("#m-list"); l.hidden = false; l.innerHTML = listHtml(); M.classList.add("open"); document.documentElement.style.overflow = "hidden"; $(".m-x", M).focus();
  }
  document.addEventListener("click", function (e) { var r = e.target.closest("[data-rm]"); if (r) { var i = +r.dataset.rm; list = list.filter(function (x) { return x !== i; }); persist(); syncSave(); renderModalList(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && M && M.classList.contains("open")) closeModal(); });

  /* ---------- vlogs page: filters */
  var grid = $("#grid");
  if (grid) {
    var cards = $$(".vc", grid), q = $("#q"), count = $("#count"), empty = $("#empty");
    var val = function (n) { var c = $('input[name="' + n + '"]:checked'); return c ? c.value : ""; };
    var apply = function () {
      var t = val("ftype"), r = val("fregion"), s = q.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) { var ok = (!t || c.dataset.type === t) && (!r || c.dataset.region === r) && (!s || s.split(/\s+/).every(function (w) { return c.dataset.q.indexOf(w) > -1; })); c.parentNode === grid ? (c.hidden = !ok) : null; if (ok) n++; });
      count.textContent = n + (n === 1 ? " vlog" : " vlogs"); empty.hidden = n > 0;
    };
    $$(".filters input").forEach(function (i) { i.addEventListener("input", apply); i.addEventListener("change", apply); });
    var h = location.hash.match(/^#v(\d+)$/); if (h && BY[+h[1]]) setTimeout(function () { openModal(+h[1]); }, 100);
  }

  /* ---------- the finder */
  var ask = $("#ask");
  if (ask) {
    var res = $("#res"), rn = $("#res-n");
    var RN = { kochi: "Kochi", calicut: "Calicut", other: "outside Kochi and Calicut" };
    var get = function (n) { var c = ask.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ""; };
    var fmtMax = function (m) { return m >= 100 ? "₹" + (m / 100).toString().replace(/\.0+$/, "") + " Cr" : "₹" + m + " L"; };
    var run = function () {
      var t = get("type"), w = get("where"), b = +ask.budget.value, furn = ask.furn.checked, ab = ask.abroad.checked;
      var tl = { apartment: "Apartment", villa: "Villa", house: "Ready house", land: "Land and farm" };
      wish = { type: t ? tl[t] : "", where: w ? (w === "other" ? "outside Kochi and Calicut" : RN[w]) : "", budget: b ? "up to " + fmtMax(b) : "", abroad: ab };
      var out = [];
      V.forEach(function (v) {
        var s = 0, why = [];
        if (t && v.type !== t) return; if (t) { s += 3; why.push(["ok", "It is a " + v.tl.toLowerCase() + ", as you asked"]); }
        if (w && v.region !== w) return; if (w) { s += 2; why.push(["ok", "In " + (w === "other" ? "your \"elsewhere\" list: " + v.area : RN[w] + ": " + v.area)]); }
        if (furn) { var f = v.facts.join(" ").toLowerCase(); if (f.indexOf("furnished") < 0 && f.indexOf("airbnb") < 0) return; s += 2; why.push(["ok", "Furnished, as shown in the vlog"]); }
        if (b) {
          if (v.price && v.price > b) return;
          if (v.price) { s += 3; why.push(["ok", "Within your " + fmtMax(b) + " budget"]); } else { why.push(["warn", "The vlog shows no price: ask Nimmy if it fits " + fmtMax(b)]); }
        }
        if (!why.length) why.push(["ok", v.facts[0]]);
        out.push({ v: v, s: s, why: why });
      });
      out.sort(function (a, c) { return c.s - a.s || (a.v.price ? 0 : 1) - (c.v.price ? 0 : 1) || a.v.i - c.v.i; });
      rn.textContent = out.length + (out.length === 1 ? " home" : " homes");
      if (!out.length) { res.innerHTML = '<p class="empty">No vlogged home fits all of that. Raise the budget or widen the place, or <a href="https://wa.me/' + ND.wa + '?text=' + encodeURIComponent(msg([])) + '" target="_blank" rel="noopener" style="display:inline-flex;min-height:44px;align-items:center">ask Nimmy directly</a>: she works with 50+ builders.</p>'; return; }
      res.innerHTML = out.map(function (o, n) {
        var v = o.v;
        return '<article class="match"><button type="button" class="pic" data-open="' + v.i + '" aria-label="Watch the vlog: ' + esc(v.name) + '"><img src="' + v.img + '" width="' + v.w + '" height="' + v.h + '" alt="Poster of the vlog: ' + esc(v.name) + '" loading="lazy"><span class="play">' + PLAY + '</span></button>' +
          '<div class="body">' + (n === 0 && o.s > 0 ? '<span class="badge">Best match</span>' : "") + '<h3>' + esc(v.name) + '</h3><p class="meta" style="color:var(--muted)">' + v.tl + " · " + esc(v.area) + '</p><p class="price' + (v.price ? "" : " na") + '">' + (v.price ? esc(v.ptxt) : "Price: ask Nimmy") + '</p>' +
          '<ul class="why-list">' + o.why.map(function (y) { return '<li class="' + y[0] + '">' + esc(y[1]) + "</li>"; }).join("") + '</ul><ul class="tags">' + v.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + '</ul>' +
          '<div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="open-btn" data-open="' + v.i + '">Watch vlog</button><button type="button" class="save" data-save="' + v.i + '" aria-pressed="false">' + HEART + '<span>Save</span></button><a class="open-btn" target="_blank" rel="noopener" data-track="whatsapp" href="' + waUrl(msg([], v.i)) + '">Ask Nimmy</a></div></div></article>';
      }).join("");
      syncSave();
    };
    var pre = new URLSearchParams(location.search);
    ["type", "where"].forEach(function (n) { var x = pre.get(n); if (x) { var r = ask.querySelector('input[name="' + n + '"][value="' + x.replace(/[^a-z]/g, "") + '"]'); if (r) r.checked = true; } });
    if (pre.get("budget") && ask.budget.querySelector('option[value="' + (+pre.get("budget") || 0) + '"]')) ask.budget.value = +pre.get("budget");
    ask.addEventListener("change", function () { run(); }); run();
  }
  syncSave();
  /* click tracking is added by the tracking snippet when present */
})();
