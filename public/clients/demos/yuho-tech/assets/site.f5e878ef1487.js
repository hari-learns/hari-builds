(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1080) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("yuho-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("yuho-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".reveal");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* ------------------------------------------------ the picker: how many people? */
  var pk = $("[data-picker]");
  if (pk) (function () {
    var data = JSON.parse($("#picker-data").textContent), elec = JSON.parse($("#elec-data").textContent);
    var ms = data.models, ui = data.ui;
    var rng = $("#ppl", pk), out = $("#ppl-out", pk), list = $("[data-list]", pk), sum = $("[data-sum]", pk);
    var elecRes = $("[data-elec]", pk), elecAsk = $("[data-elec-ask]", pk);
    var rows = {};
    function mk(m) {
      var r = d.createElement("div"); r.className = "prow";
      r.innerHTML = '<div class="prow__img"><img alt="" width="360" height="294" loading="lazy" decoding="async"></div>' +
        '<p class="prow__n"></p><p class="prow__k"></p>' +
        '<p class="prow__s"></p><div class="prow__a"><a class="btn btn--sm"></a></div>';
      $("img", r).src = m.img;
      $(".prow__n", r).textContent = m.id;
      $(".prow__k", r).textContent = ui.line_name[m.line] + (m.kind ? " · " + m.kind : "");
      $(".prow__s", r).innerHTML = "<span>" + ui.rec + " <b>" + m.lo + "–" + m.hi + " " + ui.unit + "</b></span><span>" + ui.tank + " <b>" + m.tank + " " + ui.L + "</b></span><span>" + ui.area + " <b>" + m.area + " " + ui.m2 + "</b></span>";
      var a = $("a", r); a.href = m.href; a.textContent = ui.ask;
      return r;
    }
    ms.forEach(function (m) { rows[m.id] = mk(m); list.appendChild(rows[m.id]); });
    function upd() {
      var n = parseInt(rng.value, 10), hits = 0;
      out.innerHTML = "<b>" + n + "</b> " + ui.unit;
      rng.setAttribute("aria-valuetext", n + " " + ui.unit);
      var ordered = [];
      ms.forEach(function (m) {
        var ok = n >= m.lo && n <= m.hi;
        rows[m.id].hidden = !ok; if (ok) { hits++; ordered.push(m); }
      });
      ordered.sort(function (a, b) { return Math.abs((a.lo + a.hi) / 2 - n) - Math.abs((b.lo + b.hi) / 2 - n); });
      ordered.forEach(function (m, i) { list.appendChild(rows[m.id]); rows[m.id].classList.toggle("is-best", i === 0); });
      sum.textContent = hits ? ui.found.replace("{n}", hits).replace("{p}", n) : ui.none;
    }
    function updElec() {
      var k = ($("input[name=bath]:checked", pk) || {}).value || "1", e = elec[k];
      elecRes.innerHTML = "<b>" + e.model + "</b>" + e.out;
      elecAsk.href = elecAsk.href.split("?")[0].split("#")[0] + "?m=" + encodeURIComponent(e.model) + "#inquiry";
    }
    rng.addEventListener("input", upd);
    $$("input[name=bath]", pk).forEach(function (i) { i.addEventListener("change", updElec); });
    upd(); updElec();
  })();

  /* ------------------------------------------------ projects: filter + lightbox */
  var grid = $("#pjgrid");
  if (grid) (function () {
    var data = JSON.parse($("#pj-data").textContent);
    var items = $$(".pj", grid), chips = $$("[data-f]");
    var lb = $("#lb"), img = $("#lb-img"), cap = $("#lb-cap"), cur = 0, lastBtn = null;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-f");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        items.forEach(function (li) { li.hidden = !(f === "all" || li.getAttribute("data-cat") === f); });
      });
    });
    function visible() { return items.filter(function (li) { return !li.hidden; }).map(function (li) { return parseInt($(".pj__b", li).getAttribute("data-i"), 10); }); }
    function show(i) {
      var p = data[i]; cur = i;
      img.width = p.w; img.height = p.h; img.src = p.big; img.alt = p.cap; cap.textContent = p.cap + " · " + p.cat;
    }
    function step(dir) { var v = visible(); var k = v.indexOf(cur); if (k < 0) k = 0; show(v[(k + dir + v.length) % v.length]); }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".pj__b"); if (!b) return;
      lastBtn = b; show(parseInt(b.getAttribute("data-i"), 10));
      if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
      $("#lb-x").focus();
    });
    $("#lb-prev").addEventListener("click", function () { step(-1); });
    $("#lb-next").addEventListener("click", function () { step(1); });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", function () { img.removeAttribute("src"); if (lastBtn) lastBtn.focus(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
    if (location.hash && /^#p\d+$/.test(location.hash)) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView({ block: "center" }); }, 60); }
  })();

  /* ------------------------------------------------ inquiry draft (mailto / copy) */
  var form = $("#inq");
  if (form) (function () {
    var cfg = JSON.parse($("#inq-data").textContent);
    var sel = $("#f-model"), name = $("#f-name"), phone = $("#f-phone"), place = $("#f-place"), note = $("#f-note");
    var q = new URLSearchParams(location.search).get("m");
    if (q) { for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === q) { sel.selectedIndex = i; break; } } }
    function text() {
      var m = sel.value === "other" ? cfg.other : sel.value;
      var dash = "-";
      return { subject: cfg.subject.replace("{m}", m), body: cfg.body.replace("{m}", m).replace("{name}", name.value || dash).replace("{phone}", phone.value || dash).replace("{place}", place.value || dash).replace("{note}", note.value || dash) };
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var t = text();
      location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(t.subject) + "&body=" + encodeURIComponent(t.body);
    });
    var cp = $("#inq-copy"), label = cp.textContent;
    cp.addEventListener("click", function () {
      var t = text(), s = t.subject + "\n" + t.body;
      function done() { cp.textContent = cfg.copied; setTimeout(function () { cp.textContent = label; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function () { fallback(s); done(); });
      else { fallback(s); done(); }
    });
    function fallback(s) { var ta = d.createElement("textarea"); ta.value = s; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); ta.remove(); }
  })();
})();
