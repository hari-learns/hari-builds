/* Anne LKV concept: menu, dock, reveals, sold-homes tool, listing filters, gallery, fee calculator, mailto forms. No dependencies. */
(function () {
  "use strict";
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }
  function fmt(n) { return Math.round(n).toLocaleString("fi-FI").replace(/ /g, " ") + " €"; }

  /* dock */
  var dock = $("#dock");
  try { if (dock && localStorage.getItem("anne-dock") === "x") dock.hidden = true; } catch (e) {}
  $$("[data-dock-close]").forEach(function (b) { b.addEventListener("click", function () { dock.hidden = true; try { localStorage.setItem("anne-dock", "x"); } catch (e) {} }); });

  /* drawer */
  var burger = $(".burger"), drawer = $("#drawer");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("button,a", drawer); f && f.focus(); } else burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  $$("[data-close]", drawer || d).forEach(function (b) { b.addEventListener("click", function () { setDrawer(false); }); });
  $$("a", drawer || d).forEach(function (a) { a.addEventListener("click", function () { if (drawer.classList.contains("is-open")) { drawer.classList.remove("is-open"); de.style.overflow = ""; burger.setAttribute("aria-expanded", "false"); } }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* reveals */
  var rv = $$(".rv,.rv-img");
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el, i) { el.style.transitionDelay = (el.classList.contains("lcard") || el.classList.contains("rev") ? (i % 3) * 0.06 : 0) + "s"; io.observe(el); });
    var sweep = function () { var vh = innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* sold-homes tool */
  $$("[data-sold-tool]").forEach(function (tool) {
    var chips = $$(".chip", tool), input = $("[data-street]", tool), grid = $("[data-grid]", tool), cards = $$(".sold", grid);
    var count = $("[data-count]", tool), none = $("[data-none]", tool), cta = $("[data-cta]", tool);
    var limit = parseInt(grid.getAttribute("data-limit") || "0", 10);
    var more = tool.parentNode.querySelector("[data-more-link]");
    var city = (chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })[0] || chips[0]).getAttribute("data-city");
    if (limit) grid.removeAttribute("data-limit");
    var q = new URLSearchParams(location.search).get("alue");
    if (q) chips.forEach(function (c) { if (norm(c.getAttribute("data-city")) === norm(q)) city = c.getAttribute("data-city"); });
    function apply() {
      var s = norm(input.value), n = 0, shown = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-city") === city ? "true" : "false"); });
      cards.forEach(function (c) {
        var ok = (!city || c.getAttribute("data-city") === city) && (!s || norm(c.getAttribute("data-street")).indexOf(s) > -1);
        if (ok) n++;
        var vis = ok && (!limit || shown < limit); if (vis) shown++;
        c.hidden = !vis; c.style.display = vis ? "" : "none";
      });
      count.textContent = tool.getAttribute("data-count-tpl").replace("{n}", n);
      none.hidden = n > 0;
      var area = city || tool.getAttribute("data-default-area");
      var street = input.value.trim();
      var subj = tool.getAttribute("data-mail-subject").replace("{area}", area + (street ? ", " + street : ""));
      var body = tool.getAttribute("data-mail-body").replace("{area}", area).replace("{street}", street);
      cta.href = "mailto:" + tool.getAttribute("data-email") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      $("span", cta).textContent = city ? tool.getAttribute("data-cta-tpl").replace("{area}", city) : tool.getAttribute("data-cta-any");
      if (more) { var b = more.getAttribute("data-base") || more.getAttribute("href"); more.setAttribute("data-base", b); more.href = city ? b + "?alue=" + encodeURIComponent(city) : b; }
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { city = c.getAttribute("data-city"); apply(); }); });
    input.addEventListener("input", apply);
    apply();
  });

  /* listing filters */
  var ff = $("[data-filters]");
  if (ff) {
    var list = $("[data-list]"), items = $$("[data-item]", list), cnt = $("[data-count]", ff), none = $("[data-none]");
    var val = function (k) { return $('[data-f="' + k + '"]', ff).value; };
    var run = function () {
      var t = val("type"), c = val("city"), r = val("rooms"), p = +val("price") || 0, s = +val("size") || 0, so = val("sort"), n = 0;
      items.forEach(function (it) {
        var ok = (!t || it.dataset.type === t) && (!c || it.dataset.city === c) && (!r || it.dataset.rooms === r) && (!p || +it.dataset.price <= p) && (!s || +it.dataset.size >= s);
        it.hidden = !ok; if (ok) n++;
      });
      var key = { "new": function (a, b) { return a.dataset.order - b.dataset.order; }, "price-asc": function (a, b) { return a.dataset.price - b.dataset.price; },
        "price-desc": function (a, b) { return b.dataset.price - a.dataset.price; }, "size-desc": function (a, b) { return b.dataset.size - a.dataset.size; } }[so];
      items.slice().sort(key).forEach(function (it) { list.appendChild(it); });
      cnt.textContent = cnt.dataset.tpl.replace("{n}", n).replace("{t}", cnt.dataset.total);
      none.hidden = n > 0;
    };
    ff.addEventListener("change", run);
    ff.addEventListener("reset", function () { setTimeout(run, 0); });
    run();
  }

  /* gallery lightbox */
  var gal = $("[data-gallery]"), lb = $("[data-lb]");
  if (gal && lb) {
    var pics = JSON.parse(gal.getAttribute("data-gallery")), idx = 0, im = $("[data-lb-img]", lb), cap = $("[data-lb-cap]", lb), num = $("[data-lb-n]", lb);
    var go = function (i) { idx = (i + pics.length) % pics.length; im.src = pics[idx].src; im.alt = pics[idx].alt; cap.textContent = pics[idx].alt; num.textContent = (idx + 1) + " / " + pics.length; };
    $$("[data-open],[data-open-fp]").forEach(function (b) { b.addEventListener("click", function () { go(+(b.getAttribute("data-open") || b.getAttribute("data-open-fp"))); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); de.style.overflow = "hidden"; }); });
    var close = function () { if (lb.close) lb.close(); else lb.removeAttribute("open"); };
    lb.addEventListener("close", function () { de.style.overflow = ""; });
    $("[data-lb-close]", lb).addEventListener("click", close);
    $("[data-lb-prev]", lb).addEventListener("click", function () { go(idx - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { go(idx + 1); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") go(idx - 1); if (e.key === "ArrowRight") go(idx + 1); });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* fee calculator (published rates, indicative) */
  $$("[data-calc]").forEach(function (f) {
    var kind = $("[data-kind]", f), price = $("[data-price]", f), out = $("[data-out]", f), det = $("[data-detail]", f);
    var run = function () {
      var o = kind.options[kind.selectedIndex], pct = parseFloat(o.getAttribute("data-pct")), min = parseFloat(o.getAttribute("data-min"));
      var p = parseFloat((price.value || "").replace(/[^\d,]/g, "").replace(",", ".")) || 0;
      var fee = p * pct / 100, useMin = fee < min;
      out.textContent = p ? fmt(Math.max(fee, min)) : "–";
      det.textContent = p ? (useMin ? "vähimmäispalkkio " + fmt(min) : pct.toFixed(1).replace(".", ",") + " % × " + fmt(p)) : "";
    };
    kind.addEventListener("change", run); price.addEventListener("input", run); run();
  });

  /* mailto forms */
  $$("[data-mail-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = $$("input,textarea", f).map(function (el) { return el.name + ": " + el.value; });
      location.href = "mailto:" + f.getAttribute("data-email") + "?subject=" + encodeURIComponent(f.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });
})();
