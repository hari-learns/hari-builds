(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u2019"); }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("topla-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("topla-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv, .bar-y");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el, i) {
    if (el.parentNode && /(^| )(cards|gal|pillars|chain|people|jobs)( |$)/.test(el.parentNode.className)) {
      var k = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = Math.min(k, 8) * 60 + "ms";
    }
    if (io) io.observe(el); else activate(el);
  });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.97) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* counters (final value is in the HTML) */
  var cs = $$("[data-count]");
  function runCount(el) {
    var to = +el.getAttribute("data-count");
    if (reduce || !to) return;
    var t0 = null, dur = 1300;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = fmt(v);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } }); }, { threshold: 0.6 });
    cs.forEach(function (el) { cio.observe(el); });
  }

  /* open now (Europe/Zurich) */
  var op = $("#open-now");
  if (op) safe(function () {
    var H = JSON.parse(op.getAttribute("data-hours"));
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday];
    var m = (+o.hour % 24) * 60 + (+o.minute);
    var spans = wd >= 1 && wd <= 4 ? H["1-4"] : (wd === 5 ? H["5"] : []);
    var isOpen = spans.some(function (s) { return m >= s[0] && m < s[1]; });
    op.textContent = isOpen ? op.getAttribute("data-open") : op.getAttribute("data-closed");
    op.classList.toggle("is-open", isOpen);
    op.hidden = false;
  });

  /* lightbox */
  var lb = $("#lb");
  if (lb && lb.showModal) {
    var lbImg = $("#lb-img"), lbCap = $("#lb-cap"), cur = [], idx = 0, lastBtn = null;
    function show(i) {
      idx = (i + cur.length) % cur.length;
      var b = cur[idx];
      lbImg.src = b.getAttribute("data-full"); lbImg.width = +b.getAttribute("data-w"); lbImg.height = +b.getAttribute("data-h");
      var im = $("img", b); lbImg.alt = im ? im.alt : ""; lbCap.textContent = im ? im.alt : "";
    }
    function open(btn) {
      cur = $$("[data-full]", btn.closest("[data-gal]")); lastBtn = btn;
      show(cur.indexOf(btn)); lb.showModal();
    }
    $$("[data-gal] [data-full]").forEach(function (b) { b.addEventListener("click", function () { open(b); }); });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    $("#lb-p").addEventListener("click", function () { show(idx - 1); });
    $("#lb-n").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__in")) lb.close(); });
    d.addEventListener("keydown", function (e) { if (!lb.open) return; if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
  }

  /* contact form -> prepared mail */
  var cf = $("#cform");
  if (cf) {
    var cd = JSON.parse($("#cform-data").textContent);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (n) { return (cf.elements[n].value || "").trim(); };
      var err = $("#c-err");
      if (!v("vor") || !v("nam") || !v("mail") || !v("tel") || !v("msg")) { err.hidden = false; return; }
      err.hidden = true;
      var body = "Guten Tag\r\n\r\n" + v("msg") + "\r\n\r\nVorname: " + v("vor") + "\r\nName: " + v("nam") + "\r\nE-Mail: " + v("mail") + "\r\nTelefon: " + v("tel");
      location.href = "mailto:" + cd.to + "?subject=" + encodeURIComponent("Kontaktanfrage " + v("vor") + " " + v("nam")) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Projekt-Finder ---------- */
  $$("[data-finder]").forEach(function (root_) {
    var D = JSON.parse($("[data-finder-data]", root_).textContent), L = D.labels, UI = D.ui;
    var mode = "laden";
    var tabs = $$(".tab", root_), panes = $$("[data-pane]", root_);
    var cards = $("[data-cards]", root_), fit = $("[data-fit]", root_), send = $("[data-send]", root_), resH = $("[data-res-h]", root_);

    function vals(name) { return $$("input[name=" + name + "]:checked", root_).map(function (i) { return i.value; }); }
    function setMode(m) {
      mode = m;
      tabs.forEach(function (t) { var on = t.getAttribute("data-mode") === m; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
      panes.forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== m; });
      render();
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { setMode(t.getAttribute("data-mode")); }); });
    $$("input", root_).forEach(function (i) { i.addEventListener("change", render); });

    function card(p, reasons) {
      var why = reasons && reasons.length ? '<div class="why">' + reasons.map(function (r) { return "<span>" + esc(r) + "</span>"; }).join("") + "</div>" : "";
      return '<a class="fcard" href="' + p.url + '"><span class="fcard__img"><img src="' + p.img + '" width="' + p.w + '" height="' + p.h + '" alt="" loading="lazy"></span>' +
        '<span class="fcard__b"><span class="fcard__t">' + esc(p.title) + "</span><span class=\"fcard__m\" style=\"display:block\">" + esc(p.meta || "") + "</span>" + why + "</span></a>";
    }
    function names(map, arr) { return arr.map(function (k) { return map[k]; }); }

    function render() {
      var picked = [], summary = [], html = "", fitHtml = "", sendHtml = "";
      if (mode === "laden") {
        var A = vals("auftrag"), B = vals("branche"), S = vals("standorte")[0] || "";
        var any = A.length || B.length || S;
        var rows = D.laden.map(function (p) {
          var r = [], s = 0;
          if (A.some(function (a) { return p.auftrag.indexOf(a) > -1; })) { s += 3; r.push(UI.reasons.auftrag); }
          if (B.some(function (b) { return p.branche.indexOf(b) > -1; })) { s += 3; r.push(UI.reasons.branche); }
          if (S === "mehr" && p.rollout) { s += 2; r.push(UI.reasons.rollout); }
          return { p: p, s: s, r: r };
        });
        if (!any) {
          resH.textContent = UI.res_h;
          html = '<p class="fo__note">' + esc(UI.none) + "</p>" + rows.slice(0, 4).map(function (x) { return card(x.p, []); }).join("");
        } else {
          rows = rows.filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 4);
          resH.textContent = UI.res_h;
          if (A.indexOf("provisorium") > -1) html += '<p class="fo__note"><a class="ul" href="' + D.meilensteine + '">' + esc(UI.prov) + "</a></p>";
          html += rows.length ? rows.map(function (x) { return card(x.p, x.r); }).join("") : '<p class="fo__note">' + esc(UI.nomatch) + "</p>";
          picked = rows.map(function (x) { return x.p.title; });
          // fit: Topla's own Leistungen that apply
          var on = {};
          A.forEach(function (a) { (D.fit[a] || []).forEach(function (i) { on[i] = 1; }); });
          if (S === "mehr") D.fit._rollout.forEach(function (i) { on[i] = 1; });
          if (Object.keys(on).length) {
            fitHtml = '<h3 class="fo__h">' + esc(UI.fit_h) + '</h3><div class="fit">' + D.leistungen.map(function (c) {
              return '<div class="fit__c"><h4>' + esc(c.step) + "</h4><ul>" + c.items.map(function (i) { return '<li class="' + (on[i] ? "on" : "") + '">' + esc(i) + "</li>"; }).join("") + "</ul></div>";
            }).join("") + '</div><p class="fo__note">' + esc(UI.fit_note) + "</p>";
          }
          if (A.length) summary.push("Vorhaben: " + names(L.auftrag, A).join(", "));
          if (B.length) summary.push("Branche: " + names(L.branche, B).join(", "));
          if (S) summary.push("Standorte: " + L.standorte[S]);
        }
      } else {
        var R = vals("raum");
        var rs = D.wohnen.map(function (p) {
          var m = R.filter(function (r) { return p.raum.indexOf(r) > -1; });
          return { p: p, s: m.length, r: m.length ? [names(L.raum, m).join(", ")] : [] };
        });
        resH.textContent = UI.res_h;
        if (!R.length) { html = '<p class="fo__note">' + esc(UI.none) + "</p>" + rs.slice(0, 6).map(function (x) { return card(x.p, []); }).join(""); }
        else {
          rs = rs.filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 6);
          html = rs.map(function (x) { return card(x.p, x.r); }).join("");
          picked = rs.map(function (x) { return x.p.title + " (" + x.p.meta + ")"; });
          summary.push("Räume und Möbel: " + names(L.raum, R).join(", "));
          html += '<p class="fo__note">' + esc(UI.wb) + ' <a class="ul" href="' + D.wbUrl + '" target="_blank" rel="noopener">wagnerboss.ch</a></p>';
        }
      }
      cards.innerHTML = html; fit.innerHTML = fitHtml;
      if (summary.length) {
        var body = "Guten Tag\r\n\r\nWir planen ein Projekt:\r\n" + summary.join("\r\n") + (picked.length ? "\r\nÄhnliche Referenzen auf Ihrer Website: " + picked.join("; ") : "") +
          "\r\n\r\nBitte melden Sie sich bei uns.\r\nName / Firma:\r\nTelefon:\r\n\r\n(Gesendet über den Projekt-Finder im Redesign-Konzept)";
        var href = "mailto:" + D.to + "?subject=" + encodeURIComponent(UI.mail_subject + ": " + summary[0].replace(/^[^:]+: /, "")) + "&body=" + encodeURIComponent(body);
        sendHtml = '<p><b>' + esc(summary.join(" · ")) + '</b></p><div class="btn-row"><a class="btn" href="' + href + '">' + esc(UI.send) + '</a><a class="btn btn--ghost" href="' + D.tel + '">' + esc(UI.call) + " " + esc(D.telShow) + '</a><button class="btn btn--ghost" type="button" data-copy>' + esc(UI.copy) + "</button></div>";
        send.setAttribute("data-body", body);
      }
      send.innerHTML = sendHtml; send.hidden = !sendHtml;
      var cp = $("[data-copy]", send);
      if (cp) cp.addEventListener("click", function () {
        var t = send.getAttribute("data-body").replace(/\r\n/g, "\n");
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = UI.copied; }, function () { cp.textContent = UI.copied; });
      });
    }

    // prefill from URL
    var q = new URLSearchParams(location.search);
    ["auftrag", "branche", "standorte", "raum"].forEach(function (n) {
      (q.get(n) || "").split(",").filter(Boolean).forEach(function (v) { var i = $("input[name=" + n + "][value=" + v + "]", root_); if (i) i.checked = true; });
    });
    var firstWohnen = q.get("modus") === "wohnen" || q.get("raum");
    setMode(firstWohnen ? "wohnen" : "laden");
  });
})();
