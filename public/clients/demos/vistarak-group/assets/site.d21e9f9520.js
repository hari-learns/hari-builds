(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* header state */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("stuck", window.scrollY > 40); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), dx = $("#drawer-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && dx) dx.focus(); else if (!open && burger && doc.activeElement && drawer.contains(doc.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (dx) dx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });

  /* reveals */
  var rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rev = $$(".rise, .wipe");
  if (rm || !("IntersectionObserver" in window)) { rev.forEach(function (n) { n.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rev.forEach(function (n) { io.observe(n); });
    setTimeout(function () { rev.forEach(function (n) { n.classList.add("in"); }); }, 4000);
  }

  /* filter chips (projects, gallery) */
  function chipFilter(attr, itemSel, dataAttr) {
    var chips = $$("[" + attr + "]");
    if (!chips.length) return;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var v = c.getAttribute(attr);
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        $$(itemSel).forEach(function (it) { it.hidden = !(v === "all" || it.getAttribute(dataAttr) === v); });
      });
    });
  }
  chipFilter("data-pf", ".pj", "data-status");
  chipFilter("data-gf", ".gl", "data-gc");

  /* dialogs */
  function openDlg(d) { if (d && d.showModal && !d.open) { d.showModal(); } else if (d) { d.setAttribute("open", ""); } }
  $$("[data-open]").forEach(function (b) { b.addEventListener("click", function () { openDlg(doc.getElementById(b.getAttribute("data-open"))); }); });
  $$("dialog.dlg").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
    $$("[data-close]", d).forEach(function (b) { b.addEventListener("click", function () { d.close(); }); });
  });
  function hashOpen() {
    var h = location.hash.replace("#", ""), d = h && doc.getElementById("dlg-" + h);
    if (d && d.tagName === "DIALOG" && !d.open) { var card = doc.getElementById(h); if (card) card.scrollIntoView(); openDlg(d); }
  }
  if ($("#pj-list")) { hashOpen(); window.addEventListener("hashchange", hashOpen); }

  /* plot finder */
  var fin = $("[data-finder]");
  if (!fin) return;
  var DATA = JSON.parse($("#finder-data").textContent), UI = DATA.ui, PJ = DATA.projects;
  var form = $("#f-form"), out = $("#f-results"), tray = $("#f-tray"), trayList = $("#f-tray-list");
  var KEY = "vistarak-shortlist-v1";
  var jump = $("#f-jump"), resVisible = false, resHead = $("#f-res-h");
  if ("IntersectionObserver" in window && resHead) {
    new IntersectionObserver(function (es) { resVisible = es[0].isIntersecting; if (resVisible) jump.hidden = true; else render(); }, { threshold: 0 }).observe(out);
  }
  var shortlist = store.get(KEY) || [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function picks() {
    var where = (form.querySelector("input[name=where]:checked") || {}).value || "any";
    var size = parseFloat(form.size.value), unit = form.unit.value;
    var sqft = isNaN(size) || size <= 0 ? 0 : (unit === "sqyd" ? size * 9 : unit === "sqm" ? size * 10.7639 : size);
    return {
      where: where, size: size, unit: unit, sqft: sqft,
      near: $$("input[name=near]:checked", form).map(function (i) { return i.value; }),
      tags: $$("input[name=tag]:checked", form).map(function (i) { return i.value; })
    };
  }
  function any(p) { return p.where !== "any" || p.sqft || p.near.length || p.tags.length; }
  function evaluate(proj, p) {
    var rows = [], yes = 0, total = 0, mismatch = 0;
    if (p.where !== "any") {
      total++;
      if (proj.corridor === p.where) { yes++; rows.push(["y", UI.corr_labels[p.where], proj.corridor_label]); }
      else { mismatch = 1; rows.push(["n", UI.diff, proj.corridor_label]); }
    }
    if (p.sqft) {
      total++;
      var label = Math.round(p.sqft).toLocaleString("en-IN") + " sq ft";
      if (!proj.size) rows.push(["u", label, UI.size_ask]);
      else if (p.sqft >= proj.size[0] && p.sqft <= proj.size[1]) { yes++; rows.push(["y", label, UI.fits + ": " + proj.size[0].toLocaleString("en-IN") + " to " + proj.size[1].toLocaleString("en-IN") + " sq ft"]); }
      else rows.push(["n", label, UI.outside + ": " + proj.size[0].toLocaleString("en-IN") + " to " + proj.size[1].toLocaleString("en-IN") + " sq ft"]);
    }
    p.near.forEach(function (k) {
      total++;
      var n = proj.near[k];
      if (n) { yes++; rows.push(["y", UI.near_labels[k], n.names.join(", ")]); }
      else if (proj.has_near) rows.push(["n", UI.near_labels[k], UI.no]);
      else rows.push(["u", UI.near_labels[k], UI.unknown]);
    });
    p.tags.forEach(function (k) {
      total++;
      if (proj.tags.indexOf(k) > -1) { yes++; rows.push(["y", UI.tag_labels[k], UI.yes]); }
      else if (proj.tags_complete) rows.push(["n", UI.tag_labels[k], UI.no]);
      else rows.push(["u", UI.tag_labels[k], UI.unknown]);
    });
    return { proj: proj, rows: rows, yes: yes, total: total, mismatch: mismatch };
  }
  function card(r, best, active) {
    var pr = r.proj, on = shortlist.indexOf(pr.id) > -1;
    var rows = r.rows.map(function (x) {
      var ic = x[0] === "y" ? "&#10003;" : x[0] === "n" ? "&minus;" : "?";
      return '<li class="r-' + x[0] + '"><span class="ic" aria-hidden="true">' + ic + '</span><span>' + esc(x[1]) + '<small>' + esc(x[2]) + '</small></span></li>';
    }).join("");
    var score = active ? '<p class="score">' + r.yes + " " + UI.of + " " + r.total + " " + UI.match + "</p>" : "<p>" + esc(UI.none) + "</p>";
    var facts = active ? "" : '<ul class="rows">' + pr.facts.map(function (f) { return '<li class="r-y"><span class="ic" aria-hidden="true">&#10003;</span><span>' + esc(f) + "</span></li>"; }).join("") + "</ul>";
    return '<article class="res' + (best ? " best" : "") + '"><figure' + (pr.contain ? ' class="contain"' : "") + '><img src="' + pr.img + '" width="' + pr.w + '" height="' + pr.h + '" alt="' + esc(pr.name) + '" loading="lazy"></figure>' +
      '<div class="res-b"><p class="kicker">' + esc(pr.corridor_label) + " · " + esc(pr.status) + "</p><h3>" + esc(pr.name) + "</h3>" + score +
      (active ? '<ul class="rows">' + rows + "</ul>" : facts) +
      '<div class="btns"><button type="button" class="btn ' + (on ? "btn-maroon" : "btn-line") + '" data-sl="' + pr.id + '" aria-pressed="' + on + '">' + esc(on ? UI.in : UI.add) + '</button>' +
      '<a class="btn btn-line" href="' + pr.url + '">' + esc(UI.view) + "</a></div></div></article>";
  }
  function render() {
    var p = picks(), active = any(p);
    var res = PJ.map(function (x) { return evaluate(x, p); });
    if (active) res.sort(function (a, b) { return a.mismatch - b.mismatch || b.yes - a.yes || (a.total - a.yes) - (b.total - b.yes); });
    var bestIdx = active && res[0].yes > 0 && res[0].yes > (res[1] ? res[1].yes : -1) ? 0 : -1;
    out.innerHTML = res.map(function (r, i) { return card(r, i === bestIdx, active); }).join("");
    renderTray(p);
    jump.hidden = !active || resVisible;
  }
  function summary(p) {
    var parts = [];
    if (p.where !== "any") parts.push(UI.corr_labels[p.where]);
    if (p.sqft) parts.push(p.size + " " + (p.unit === "sqft" ? "sq ft" : p.unit === "sqyd" ? "sq yd" : "sq m"));
    if (p.near.length) parts.push("Nearby: " + p.near.map(function (k) { return UI.near_labels[k]; }).join(", "));
    if (p.tags.length) parts.push("Inside: " + p.tags.map(function (k) { return UI.tag_labels[k]; }).join(", "));
    return parts.join("; ");
  }
  function renderTray(p) {
    var names = shortlist.map(function (id) { return PJ.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    tray.hidden = !names.length;
    trayList.innerHTML = names.map(function (n) { return "<li><span>" + esc(n.name) + " · " + esc(n.corridor_label) + '</span><button type="button" data-rm="' + n.id + '">Remove</button></li>'; }).join("");
    var msg = "Hello Vistarak Group, I would like to visit: " + names.map(function (n) { return n.name; }).join(" and ") + ".";
    var s = summary(p || picks()); if (s) msg += " What I am looking for: " + s + ".";
    $("#f-send-wa").href = UI.wa + "?text=" + encodeURIComponent(msg);
    $("#f-send-mail").href = "mailto:" + UI.email + "?subject=" + encodeURIComponent(UI.mail_subject) + "&body=" + encodeURIComponent(msg + "\n\nThank you.");
  }
  function toggle(id) {
    var i = shortlist.indexOf(id);
    if (i > -1) shortlist.splice(i, 1); else shortlist.push(id);
    store.set(KEY, shortlist); render();
  }
  out.addEventListener("click", function (e) { var b = e.target.closest("[data-sl]"); if (b) toggle(b.getAttribute("data-sl")); });
  trayList.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (b) toggle(b.getAttribute("data-rm")); });
  form.addEventListener("input", render); form.addEventListener("change", render);
  form.addEventListener("reset", function () { setTimeout(render, 0); });
  var m = /[?&]where=(tonk|diggi|any)/.exec(location.search);
  if (m) { var r = form.querySelector("input[name=where][value=" + m[1] + "]"); if (r) r.checked = true; }
  render();
})();
