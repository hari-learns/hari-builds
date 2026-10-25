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
    drawer.classList.toggle("is-open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1060) setDrawer(false); });
  if (drawer) { drawer.setAttribute("aria-hidden", "true"); }

  /* dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sc-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sc-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.98) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep(); if (reduce) rvs.forEach(activate);

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* lightbox */
  var lb = $("#lb"), lbImg = $("#lb-img"), lbX = $("#lb-x");
  if (lb && typeof lb.showModal === "function") {
    $$("[data-lb]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); lbImg.src = a.getAttribute("href"); lbImg.alt = (a.textContent || "").trim() || "Photo"; lb.showModal(); });
    });
    if (lbX) lbX.addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) lb.close(); });
  }

  /* product gallery */
  var gal = $("[data-gal]");
  if (gal) {
    var urls = JSON.parse(gal.getAttribute("data-gal")), main = $("[data-main]", gal), link = $("a", gal);
    $$(".thumb").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-i"); $$(".thumb").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        main.removeAttribute("srcset"); main.src = urls[i][1]; link.setAttribute("href", urls[i][1]);
      });
    });
  }

  /* video: load YouTube only on tap */
  $$("[data-yt]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = $("[data-vframe]"); if (!f) return;
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + b.getAttribute("data-yt") + '?autoplay=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      f.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  });

  /* family filter */
  var chips = $$("[data-f]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var k = c.getAttribute("data-f");
      chips.forEach(function (x) { x.classList.toggle("is-on", x === c); });
      $$("[data-fam]").forEach(function (s) { s.hidden = !(k === "all" || s.getAttribute("data-fam") === k); });
    });
  });
  if (location.hash) { var h = location.hash.slice(1); if ($("[data-fam=\"" + h + "\"]")) { var c0 = $("[data-f=\"" + h + "\"]"); if (c0) c0.click(); } }

  /* mail form -> mailto */
  $$("[data-mform]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
      var body = "Name: " + v("n") + "\nCompany: " + v("c") + "\n\n" + v("m");
      location.href = "mailto:" + f.getAttribute("data-to") + "?subject=" + encodeURIComponent("Enquiry from the website concept") + "&body=" + encodeURIComponent(body);
    });
  });

  /* finder */
  $$("[data-finder]").forEach(function (root) {
    var data = JSON.parse($("[data-finder-data]", root).textContent), ui = data.ui, ko = data.lang === "ko";
    var kindEls = $$("input[name$=-kind]", root), rateEls = $$("input[name$=-rate]", root);
    var num = $("input[type=number]", root), rng = $("input[type=range]", root), out = $("output", root), box = $("[data-results]", root), diaBox = $("[data-dia]", root);
    function val(els) { var c = els.filter(function (x) { return x.checked; })[0]; return c ? c.value : null; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function rateOk(m, n) { if (m.rmin == null) return true; return m.rmax >= n && m.rmin <= n * 3; }
    function why(m, kind, dia, n) {
      var bits = [];
      if (ko) {
        if (m.dmin != null) bits.push("캡 지름 Ø" + m.dmin + "~" + m.dmax + " mm");
        if (m.rmin != null) bits.push(m.rmin === m.rmax ? "분당 " + m.rmax + "개" : "분당 " + m.rmin + "~" + m.rmax + "개");
        else bits.push("컨베이어 라인");
        if (m.dmin == null) bits.push(ui.madeto);
        return bits.join(" · ");
      }
      return m.note;
    }
    function run() {
      var kind = val(kindEls), n = +val(rateEls), dia = +num.value;
      var needDia = (kind === "capped" || kind === "liner");
      diaBox.hidden = !needDia;
      out.textContent = dia + " mm"; if (+rng.value !== dia && dia >= +rng.min && dia <= +rng.max) rng.value = dia;
      var list = data.models.filter(function (m) {
        if (kind === "odd") { if (m.kind !== "odd") return false; }
        else if (kind === "capless") { if (m.kind !== "capless" && m.kind !== "odd") return false; }
        else if (m.kind !== kind) return false;
        if (needDia && m.dmin != null && (dia < m.dmin || dia > m.dmax)) return false;
        return rateOk(m, n);
      });
      list.sort(function (a, b) {
        var sa = a.rmax ? Math.abs(Math.log(a.rmax / n)) : 0.5, sb = b.rmax ? Math.abs(Math.log(b.rmax / n)) : 0.5; return sa - sb;
      });
      if (!list.length) { box.innerHTML = '<p>' + esc(ui.none) + '</p><p><a class="btn btn-red" href="tel:' + "+82-32-573-6671" + '">' + (ko ? "032-573-6671 전화" : "Call 032-573-6671") + '</a></p>'; return; }
      var rateLabel = data.rates.filter(function (r) { return r[0] === n; })[0][1];
      var top = list.slice(0, 5);
      var html = '<div class="res">' + top.map(function (m) {
        var o = m.rmin == null ? (ko ? "컨베이어 라인" : "Conveyor line") : (m.rmin === m.rmax ? m.rmax + (ko ? "개/분" : " per min") : m.rmin + " to " + m.rmax + (ko ? "개/분" : " per min"));
        return '<div class="res-i"><a class="res-img" href="' + m.href + '" tabindex="-1" aria-hidden="true"><img src="' + m.img + '" width="' + m.iw + '" height="' + m.ih + '" alt="" loading="lazy"></a><div class="res-b"><h4><a href="' + m.href + '">' + esc(m.name) + '</a></h4><div class="res-m"><span>' + esc(ui.out) + ": " + esc(o) + '</span>' + (m.dmin != null ? '<span>' + esc(ui.dia) + ": Ø" + m.dmin + " to " + m.dmax + " mm</span>" : '<span>' + esc(ui.madeto) + '</span>') + '</div><p>' + esc(why(m, kind, dia, n)) + '</p><a class="more" href="' + m.href + '">' + esc(ui.more) + '</a></div></div>';
      }).join("");
      if (n >= 20 || kind === "capped") html += '<div class="res-add"><b>' + esc(ui.addon) + ".</b> " + esc(ui.addon_t) + ' <a href="' + data.sim + '">SIM-1000C</a></div>';
      html += "</div>";
      var lines = top.map(function (m) { return "- " + m.name; }).join("\n");
      var body = "Hello Smart Corporation,\n\n" + ui.sendline + ":\n- " + (kindEls.filter(function (x) { return x.checked; })[0].nextElementSibling.textContent) + "\n" + (needDia ? "- Cap diameter: " + dia + " mm\n" : "") + "- Output: " + rateLabel + "\n\nMachines shown:\n" + lines + "\n\nCompany:\nCountry:\n";
      html += '<p class="res-send"><a class="btn btn-red" href="mailto:' + data.to + "?subject=" + encodeURIComponent(ui.sendline + (needDia ? " Ø" + dia + " mm" : "")) + "&body=" + encodeURIComponent(body) + '">' + esc(ui.send) + "</a></p>";
      box.innerHTML = html;
    }
    kindEls.concat(rateEls).forEach(function (el) { el.addEventListener("change", run); });
    num.addEventListener("input", function () { if (num.value !== "") run(); });
    rng.addEventListener("input", function () { num.value = rng.value; run(); });
    run();
  });
})();
