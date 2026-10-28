(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KEY = "cacio-req";

  /* header solid on scroll (home overlay) */
  var hdr = $("#hdr");
  if (hdr && hdr.classList.contains("hdr--overlay")) {
    var onS = function () { hdr.classList.toggle("hdr--solid", window.scrollY > 40); };
    onS(); window.addEventListener("scroll", onS, { passive: true });
  }

  /* drawer */
  var burger = $("#burger"), drawer = $("#drawer"), dx = $("#drawer-x");
  function setDrawer(o) {
    if (!drawer) return;
    drawer.classList.toggle("open", o); drawer.setAttribute("aria-hidden", o ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", o ? "true" : "false");
    document.body.style.overflow = o ? "hidden" : "";
    if (o && dx) dx.focus(); else if (burger && !o) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (dx) dx.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("cacio-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cacio-dock", "1"); }); });

  /* reveal */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add("in"); });

  /* hero film loop: starts after load so the poster paints first; real footage from Cácio's own film */
  var hv = $("#hero-video");
  if (hv && !reduce) {
    var conn = navigator.connection || {};
    var start = function () {
      if (conn.saveData) return;
      var phone = window.matchMedia("(max-width: 760px)").matches;
      hv.src = phone ? hv.dataset.phone : hv.dataset.desk; hv.preload = "auto";
      hv.addEventListener("playing", function () { hv.classList.add("on"); });
      var p = hv.play(); if (p && p.catch) p.catch(function () {});
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { var q = hv.play(); if (q && q.catch) q.catch(function () {}); } else hv.pause(); }); }, { threshold: 0.05 }).observe(hv);
    };
    if (document.readyState === "complete") setTimeout(start, 300); else window.addEventListener("load", function () { setTimeout(start, 300); });
  }

  /* collections room filter */
  var rf = $("#room-filter");
  if (rf) {
    var act = {};
    $$(".chip", rf).forEach(function (b) {
      b.addEventListener("click", function () {
        var r = b.dataset.room; act[r] = !act[r]; b.setAttribute("aria-pressed", act[r] ? "true" : "false");
        var on = Object.keys(act).filter(function (k) { return act[k]; });
        $$("#cgrid .cgrid__i").forEach(function (c) { var rooms = c.dataset.rooms.split(" "); c.hidden = on.length > 0 && !on.every(function (x) { return rooms.indexOf(x) > -1; }); });
      });
    });
  }

  /* film chapters */
  var film = $("#film");
  if (film) $$(".chap").forEach(function (b) {
    b.addEventListener("click", function () {
      var go = function () { film.currentTime = +b.dataset.t; var p = film.play(); if (p && p.catch) p.catch(function () {}); film.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); };
      if (film.readyState < 1) { film.addEventListener("loadedmetadata", go, { once: true }); film.preload = "auto"; film.load(); } else go();
    });
  });

  /* request basket shared between finder, collection pages and contact */
  function loadReq() { var v = safe(function () { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); }); return Array.isArray(v) ? v : []; }
  function saveReq(a) { safe(function () { sessionStorage.setItem(KEY, JSON.stringify(a)); }); }
  function mail(to, subj, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); }

  /* signature tool: which collection fits my project */
  var fd = $("#finder-data");
  if (fd) {
    var D = JSON.parse(fd.textContent), U = D.ui, sel = { room: {}, fin: {}, style: {} }, req = loadReq();
    var grid = $("#f-grid"), count = $("#f-count"), clr = $("#f-clear"), rl = $("#req-list"), re = $("#req-empty"), send = $("#req-send");
    var finLabel = function (v) { return v.indexOf("wood-") === 0 ? U.tone_wood.replace("{t}", U["tone_" + v.slice(5)]) : U["fam_" + v]; };
    var names = function (g) { return Object.keys(sel[g]).filter(function (k) { return sel[g][k]; }); };
    var chipText = function (g, v) { var b = $('.chip[data-g="' + g + '"][data-v="' + v + '"]'); return b ? b.textContent : v; };
    function finMatch(c, v) { return c.sw.filter(function (s) { return v.indexOf("wood-") === 0 ? (s.f === "wood" && s.t === v.slice(5)) : s.f === v; }); }
    function evalCol(c) {
      var groups = 0, hit = 0, why = [], sws = [];
      var rs = names("room"); if (rs.length) { groups++; var m = rs.filter(function (r) { return c.r.indexOf(r) > -1; }); if (m.length) { hit++; why.push(U.tool_why_room.replace("{x}", m.map(function (r) { return U["room_" + r].toLowerCase(); }).join(", "))); } }
      var fs = names("fin"); if (fs.length) { groups++; var fm = fs.filter(function (v) { return finMatch(c, v).length; }); if (fm.length) { hit++; why.push(U.tool_why_fin.replace("{x}", fm.map(function (v) { return finLabel(v).toLowerCase(); }).join(", "))); fm.forEach(function (v) { finMatch(c, v).forEach(function (s) { if (sws.indexOf(s) < 0) sws.push(s); }); }); } }
      var ss = names("style"); if (ss.length) { groups++; var sm = ss.filter(function (s) { return c.s.indexOf(s) > -1; }); if (sm.length) { hit++; why.push(U.tool_why_style.replace("{x}", c.q)); } }
      return { c: c, groups: groups, hit: hit, why: why, sws: sws };
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
    function card(r) {
      var c = r.c, inr = req.indexOf(c.id) > -1, sws = (r.sws.length ? r.sws : c.sw).slice(0, 8);
      return '<article class="fcard' + (inr ? " fcard--in" : "") + '"><a class="fcard__img" href="' + c.u + '" tabindex="-1" aria-hidden="true"><img src="' + c.img + '" width="' + c.w + '" height="' + c.h + '" alt="" loading="lazy" decoding="async"></a><div class="fcard__b">' +
        '<h3 class="fcard__n">' + esc(c.n) + '</h3>' + (r.groups ? '<p class="fmatch">' + esc(U.tool_matches.replace("{a}", r.hit).replace("{b}", r.groups)) + '</p>' : "") +
        (r.why.length ? '<p class="fcard__why">' + esc(r.why.join(" · ")) + '</p>' : "") +
        '<div class="fcard__sw">' + sws.map(function (s) { return '<img src="' + s.i + '" width="34" height="34" alt="' + esc(s.c) + '" title="' + esc(s.c) + '" loading="lazy">'; }).join("") + '</div>' +
        '<div class="fcard__a"><button type="button" class="btn btn--sm ' + (inr ? "btn--acc" : "btn--line") + '" data-add="' + c.id + '" aria-pressed="' + inr + '">' + esc(inr ? U.tool_added : U.tool_add_short) + '</button><a class="linkb" href="' + c.u + '">' + esc(U.col_view) + '</a></div></div></article>';
    }
    function render() {
      var rs = D.cols.map(evalCol), g = rs[0].groups, out;
      var more = $("#f-more"); if (more) more.hidden = true;
      if (!g) { out = rs; count.textContent = U.tool_empty; if (document.body.dataset.page === "home") { out = rs.slice(0, 4); if (more) more.hidden = false; } }
      else {
        var full = rs.filter(function (r) { return r.hit === r.groups; });
        if (full.length) { out = full; count.textContent = full.length === 1 ? U.tool_result_one : U.tool_results.replace("{n}", full.length); }
        else { out = rs.filter(function (r) { return r.hit > 0; }).sort(function (a, b) { return b.hit - a.hit; }); count.textContent = U.tool_none; }
      }
      grid.innerHTML = out.map(card).join("");
      clr.hidden = !g; renderReq();
    }
    function criteria() {
      var p = []; if (names("room").length) p.push(U.req_crit + " – " + names("room").map(function (v) { return chipText("room", v); }).join(", "));
      if (names("fin").length) p.push(names("fin").map(function (v) { return finLabel(v); }).join(", "));
      if (names("style").length) p.push(names("style").map(function (v) { return chipText("style", v); }).join(", "));
      return p.join(" / ");
    }
    function renderReq() {
      var byId = {}; D.cols.forEach(function (c) { byId[c.id] = c; });
      req = req.filter(function (i) { return byId[i]; });
      rl.innerHTML = req.map(function (i) { return '<li><span>' + esc(byId[i].n) + '</span><button type="button" data-rm="' + i + '" aria-label="' + esc(byId[i].n) + ' ×">×</button></li>'; }).join("");
      re.hidden = req.length > 0;
      var nm = $("#rq-name").value, co = $("#rq-co").value, ct = $("#rq-cty").value;
      var body = U.req_intro + "\n\n" + U.req_cols + ": " + req.map(function (i) { return byId[i].n; }).join(", ") + "\n" + (criteria() ? criteria() + "\n" : "") + "\n" + [nm, co, ct].filter(Boolean).join(" · ");
      send.href = req.length ? mail(D.mail, U.req_subject, body) : "mailto:" + D.mail;
      send.setAttribute("aria-disabled", req.length ? "false" : "true");
      saveReq(req);
      var rb = $("#reqbar"); if (rb) { rb.hidden = !req.length; $("#reqn").textContent = req.length; }
    }
    $$(".chip[data-g]").forEach(function (b) {
      b.addEventListener("click", function () { var g = b.dataset.g, v = b.dataset.v; sel[g][v] = !sel[g][v]; b.setAttribute("aria-pressed", sel[g][v] ? "true" : "false"); render(); });
    });
    clr.addEventListener("click", function () { sel = { room: {}, fin: {}, style: {} }; $$(".chip[data-g]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); render(); });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-add]"); if (!b) return; var id = b.dataset.add, i = req.indexOf(id);
      if (i > -1) req.splice(i, 1); else req.push(id); render();
    });
    rl.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; req.splice(req.indexOf(b.dataset.rm), 1); render(); });
    $$("#req input").forEach(function (i) { i.addEventListener("input", renderReq); });
    send.addEventListener("click", function (e) { if (send.getAttribute("aria-disabled") === "true") e.preventDefault(); });
    render();
  }

  /* contact form -> pre-filled email */
  var cf = $("#ctform");
  if (cf) {
    var nm = {}; safe(function () { nm = JSON.parse(cf.dataset.names); });
    var sel2 = loadReq(), q = new URLSearchParams(location.search).get("c");
    if (q && nm[q] && sel2.indexOf(q) < 0) sel2.push(q);
    sel2 = sel2.filter(function (i) { return nm[i]; });
    var box = $("#ct-sel");
    var paint = function () { box.innerHTML = ""; sel2.forEach(function (i) { var s = document.createElement("span"); s.textContent = nm[i]; box.appendChild(s); }); box.hidden = !sel2.length; };
    paint();
    cf.addEventListener("submit", function (e) {
      e.preventDefault(); var f = cf.elements;
      var body = cf.dataset.intro + "\n\n" + (sel2.length ? cf.dataset.cols + ": " + sel2.map(function (i) { return nm[i]; }).join(", ") + "\n\n" : "") + (f.msg.value ? f.msg.value + "\n\n" : "") + [f.name.value, f.co.value, f.cty.value].filter(Boolean).join(" · ");
      location.href = mail(cf.dataset.mail, cf.dataset.subject, body);
    });
  }
})();
