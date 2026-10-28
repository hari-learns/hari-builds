(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-scrolled", window.scrollY > 40); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // drawer
  var drawer = $("#drawer"), burger = $("#burger"), closeBtn = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus(); else if (burger && !open) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") setDrawer(false); });
  $$("#drawer nav a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  if (window.matchMedia) window.matchMedia("(min-width:1100px)").addEventListener("change", function (m) { if (m.matches) setDrawer(false); });

  // dock
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dock-x")) dock.classList.add("gone"); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.classList.add("gone"); try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  if (dock) setTimeout(function () { dock.classList.add("min"); }, 3000);

  // reveal
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && rv.length) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add("in"); }); }

  // steppers and chips
  $$("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = document.getElementById(b.dataset.for); if (!i) return;
      var step = parseFloat(b.dataset.step), v = (parseFloat(i.value) || 0) + step, mn = parseFloat(i.min), mx = parseFloat(i.max);
      if (!isNaN(mn)) v = Math.max(mn, v); if (!isNaN(mx)) v = Math.min(mx, v);
      i.value = Math.round(v * 100) / 100; i.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  $$("[data-set]").forEach(function (b) {
    b.addEventListener("click", function () { var i = document.getElementById(b.dataset.set); if (i) { i.value = b.dataset.v; i.dispatchEvent(new Event("input", { bubbles: true })); } });
  });

  // planner
  var root = $("[data-planner]");
  if (!root) return;
  var D = JSON.parse($("#planner-data", root).textContent);
  var g = function (id) { return document.getElementById(id); };
  var fmt = function (n, d) { return Number(n).toLocaleString("en-NZ", { maximumFractionDigits: d == null ? 0 : d }); };
  var cabinsEl = g("pl-cabins");
  cabinsEl.innerHTML = D.cabins.map(function (c) { return '<li data-on="0"><span><b>' + c.n + "</b> (" + c.d + ")</span><span>sleeps " + c.s + "</span></li>"; }).join("");

  function berth() {
    var b = parseFloat(g("pl-berth").value), out = g("pl-berth-out"), t, ok;
    if (isNaN(b)) { out.textContent = ""; out.removeAttribute("data-ok"); return null; }
    if (b < 13.5) { ok = 0; t = b.toFixed(1).replace(".0", "") + " m is shorter than the AT43. It is designed for a 13.5 m or 14 m berth (13.5 to 13.8 m overall). Ask Nigel what is possible."; }
    else if (b < 14) { ok = 1; t = "The AT43 is designed to fit a 13.5 m berth. Also check beam 4.5 m and draft 1.05 m against your berth."; }
    else { ok = 1; t = "Room to spare. The swim platform can be extended during the build to make full use of a 14 m berth. Also check beam 4.5 m and draft 1.05 m."; }
    out.textContent = t; out.setAttribute("data-ok", ok); return b;
  }
  function crew() {
    var n = parseInt(g("pl-crew").value, 10), out = g("pl-crew-out"); if (isNaN(n) || n < 1) n = 1;
    var left = n; $$("li", cabinsEl).forEach(function (li, i) { var take = Math.min(left, D.cabins[i].s); li.setAttribute("data-on", take > 0 ? "1" : "0"); left -= take; });
    if (n <= 6) { out.setAttribute("data-ok", 1); out.textContent = n + " aboard overnight: " + (n <= 2 ? "the master cabin" : n <= 4 ? "master plus the guest cabin" : "all three cabins") + "."; }
    else { out.setAttribute("data-ok", 0); out.textContent = D.over; }
    return n;
  }
  function trip() {
    var dist = parseFloat(g("pl-dist").value), eng = g("pl-eng").value, tank = parseFloat(g("pl-tank").value), res = parseInt(g("pl-res").value, 10);
    var ret = g("pl-legs").value === "ret"; g("pl-res-v").textContent = res;
    var sel = g("pl-speed"), row = D.perf[parseInt(sel.value, 10)];
    var single = eng === "single";
    g("pl-speed").disabled = single;
    if (single) row = D.perf[2];
    g("pl-single").textContent = single ? D.single : "";
    if (isNaN(dist) || dist <= 0) { g("pl-result").innerHTML = ""; g("pl-mini").innerHTML = ""; return null; }
    var nm = dist * (ret ? 2 : 1), fuel = nm * row.lnm, hrs = nm / row.kn, usable = tank * (1 - res / 100), range = usable / row.lnm;
    var ok = fuel <= usable, hh = Math.floor(hrs), mm = Math.round((hrs - hh) * 60); if (mm === 60) { hh++; mm = 0; }
    var legs = ret ? "return (" + fmt(nm) + " nm)" : "one way";
    var stops = Math.ceil(fuel / usable) - 1;
    var verdict = ok ? "<b>Within range.</b> " + fmt(fuel) + " L of " + fmt(usable) + " L usable (" + fmt(tank) + " L tank, " + res + "% kept in reserve)."
      : "<b>Beyond one tank.</b> " + fmt(fuel) + " L needed, " + fmt(usable) + " L usable: plan " + stops + " fuel stop" + (stops > 1 ? "s" : "") + " or a bigger tank (up to 1800 L).";
    g("pl-result").innerHTML = '<div><strong>' + fmt(fuel) + ' L</strong><span>fuel, ' + legs + '</span></div><div><strong>' + hh + ' h ' + (mm < 10 ? "0" : "") + mm + '</strong><span>at ' + row.kn + ' kts</span></div><div class="wide" data-ok="' + (ok ? 1 : 0) + '">' + verdict + "</div>";
    g("pl-mini").innerHTML = "<b>" + fmt(fuel) + " L</b><span>" + hh + " h " + (mm < 10 ? "0" : "") + mm + "</span><em data-ok=\"" + (ok ? 1 : 0) + "\">" + (ok ? "Within range" : "Beyond one tank") + "</em>";
    // range bars (twin table; single shows the 20 kt cruise only)
    var rows = single ? [D.perf[2]] : D.perf, max = 0;
    rows.forEach(function (r) { max = Math.max(max, usable / r.lnm); });
    g("pl-bars").innerHTML = rows.map(function (r) {
      var rg = usable / r.lnm, ok2 = rg >= nm;
      return '<div class="rb" data-ok="' + (ok2 ? 1 : 0) + '" data-sel="' + (r === row ? 1 : 0) + '"><span>' + r.kn + ' kts</span><span class="track"><span class="fill" style="width:' + Math.max(4, Math.round(rg / max * 100)) + '%"></span></span><output>' + fmt(rg) + ' nm' + (ok2 ? "" : " (short)") + "</output></div>";
    }).join("");
    return { dist: dist, nm: nm, legs: legs, row: row, fuel: fuel, hrs: hrs, tank: tank, res: res, eng: single ? "single Volvo D8 600 hp" : "twin Volvo D6 440 hp", ok: ok };
  }
  function summary() {
    var b = berth(), n = crew(), t = trip();
    var lines = ["Enquiry about the Elite AT43", "", "Berth: " + (b ? b + " m" : "not given"), "People aboard overnight: " + n];
    if (t) lines.push("Planned trip: " + fmt(t.dist) + " nm, " + t.legs + ", " + t.eng + " at " + t.row.kn + " kts", "Indicative: about " + fmt(t.fuel) + " L and " + t.hrs.toFixed(1) + " h; " + fmt(t.tank) + " L tank, " + t.res + "% reserve");
    lines.push("", "Please send the brochure and the next build slot.", "", "Name:", "Phone:");
    var text = lines.join("\n");
    g("pl-summary").textContent = text;
    g("pl-mail").href = "mailto:" + D.email + "?subject=" + encodeURIComponent("Elite AT43 enquiry: " + (b ? b + " m berth, " : "") + n + " aboard") + "&body=" + encodeURIComponent(text);
  }
  root.addEventListener("input", summary); root.addEventListener("change", summary);
  summary();
})();
