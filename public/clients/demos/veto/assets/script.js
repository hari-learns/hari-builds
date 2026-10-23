(function () {
  "use strict";
  var root = document.documentElement;
  var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || document).querySelector(s); }

  /* dock */
  var dock = $("#dock");
  try { if (sessionStorage.getItem("veto-dock") === "1" && dock) dock.hidden = true; } catch (e) {}
  var dx = $("#dock-x");
  if (dx) dx.addEventListener("click", function () {
    dock.hidden = true;
    try { sessionStorage.setItem("veto-dock", "1"); } catch (e) {}
  });

  /* drawer */
  var burger = $("#burger"), drawer = $("#drawer");
  function setMenu(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    root.style.overflow = open ? "hidden" : "";
  }
  if (burger) {
    burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  /* reveal with a sweep that never strands content */
  var rvs = [].slice.call(document.querySelectorAll(".rv"));
  if (!rm && rvs.length) {
    root.classList.add("rv-ready");
    var sweep = function () {
      var vh = window.innerHeight;
      rvs = rvs.filter(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.96) { el.classList.add("in"); return false; }
        return true;
      });
    };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* heat: the page warms from cold stone to glowing ember as you read */
  var stops = [0, 0.2, 0.38, 0.5, 0.6, 0.72, 1];
  var cs = getComputedStyle(root);
  function hex(c) {
    c = c.trim();
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  var pal = stops.map(function (_, i) {
    return { g: hex(cs.getPropertyValue("--s" + i + "-ground")), i: hex(cs.getPropertyValue("--s" + i + "-ink")), a: hex(cs.getPropertyValue("--s" + i + "-accent")) };
  });
  function mix(a, b, t) { return a.map(function (v, k) { return Math.round(v + (b[k] - v) * t); }); }
  function css(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
  function colours(h) {
    var k = 0;
    while (k < stops.length - 2 && h > stops[k + 1]) k++;
    var t = Math.min(1, Math.max(0, (h - stops[k]) / (stops[k + 1] - stops[k])));
    return { g: mix(pal[k].g, pal[k + 1].g, t), i: mix(pal[k].i, pal[k + 1].i, t), a: mix(pal[k].a, pal[k + 1].a, t) };
  }
  var secs = [].slice.call(document.querySelectorAll("[data-heat]")).map(function (el) {
    var p = el.getAttribute("data-heat").split(",").map(parseFloat);
    return { el: el, a: p[0], b: p[1], top: 0, h: 1 };
  });
  var theme = $('meta[name="theme-color"]');
  var clockN = $("#clock-n"), lastKey = "", ticking = false;
  var maxMin = 30;

  function measure() {
    var y = window.pageYOffset;
    secs.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + y; s.h = Math.max(1, r.height); });
  }
  function heatAt() {
    var c = window.pageYOffset + window.innerHeight * 0.5;
    if (!secs.length) return 0;
    if (c <= secs[0].top) return secs[0].a;
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      if (c < s.top + s.h) return s.a + (s.b - s.a) * Math.min(1, Math.max(0, (c - s.top) / s.h));
    }
    return secs[secs.length - 1].b;
  }
  function paint() {
    ticking = false;
    var h = heatAt();
    var key = h.toFixed(3);
    if (key === lastKey) return;
    lastKey = key;
    var c = colours(h);
    root.style.setProperty("--ground", css(c.g));
    root.style.setProperty("--ink", css(c.i));
    root.style.setProperty("--accent", css(c.a));
    root.style.setProperty("--heat", h.toFixed(3));
    var dark = h > 0.55;
    root.classList.toggle("is-dark", dark);
    /* header and bars stay legible through the orange mid-zone: they flip at one hard threshold */
    root.style.setProperty("--top-bg", css(dark ? pal[5].g : (h > 0.4 ? pal[2].g : colours(h).g)));
    root.style.setProperty("--top-fg", css(dark ? pal[5].i : (h > 0.4 ? pal[2].i : colours(h).i)));
    if (theme) theme.setAttribute("content", css(c.g));
    if (clockN) clockN.textContent = Math.min(maxMin, Math.round(h * maxMin));
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }

  if (!rm && secs.length) {
    root.classList.add("heat");
    measure(); paint();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", function () { measure(); lastKey = ""; req(); });
    window.addEventListener("load", function () { measure(); lastKey = ""; req(); });
    window.addEventListener("pageshow", function () { measure(); lastKey = ""; req(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); lastKey = ""; req(); });
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); lastKey = ""; req(); }).observe(document.body);
  }

  /* stove picker: real ranges from the veto.fi tables */
  var form = $("#picker"), data;
  try { data = JSON.parse($("#picks").textContent); } catch (e) {}
  if (form && data) {
    var vol = $("#vol"), glass = $("#glass"), fit = $("#fit");
    var upd = function () {
      var v = +vol.value, g = +glass.value, eff = v + g;
      $("#vol-o").textContent = v; $("#glass-o").textContent = g;
      $("#eff").textContent = eff + " m³";
      var html = "";
      function chips(list, shop, label) {
        list.forEach(function (m) {
          if (eff >= m[2] && eff <= m[3]) {
            html += '<a class="chip" href="' + shop + '" target="_blank" rel="noopener"><b>' + m[0] + '</b><small>' + label + " · " + m[1] + " kW · " + m[2] + "–" + m[3] + " m³</small></a>";
          }
        });
      }
      chips(data.wood, data.shopWood, data.lblWood);
      chips(data.elec, data.shopElec, data.lblElec);
      fit.innerHTML = html || "<p>" + data.none + "</p>";
    };
    vol.addEventListener("input", upd); glass.addEventListener("input", upd); upd();
  }
})();
