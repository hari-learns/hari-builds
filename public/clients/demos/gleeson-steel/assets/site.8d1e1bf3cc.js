(function () {
  "use strict";
  var d = document, de = d.documentElement, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  de.classList.add("js");

  /* drawer */
  var dr = $("#drawer"), bg = $("#burger"), bx = $("#burger-x");
  function setDrawer(o) {
    if (!dr) return;
    dr.classList.toggle("open", o); dr.setAttribute("aria-hidden", o ? "false" : "true"); d.body.classList.toggle("lock", o);
    if (bg) bg.setAttribute("aria-expanded", o ? "true" : "false");
    $$("a,button", dr).forEach(function (el) { el.tabIndex = o ? 0 : -1; });
    if (o && bx) bx.focus(); else if (!o && bg && d.activeElement && dr.contains(d.activeElement)) bg.focus();
  }
  setDrawer(false);
  if (bg) bg.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1200) setDrawer(false); });
  if (dr) $$("a", dr).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("gse-dock") === "1" && dock) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("gse-dock", "1"); } catch (e) {} });

  /* reveals */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px 140px 0px", threshold: 0 });
    rv.forEach(function (el, i) { el.style.setProperty("--d", (i % 3) * 0.05 + "s"); io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("in"); }); }, 900);
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* sticky bar steps aside while the hero buttons are on screen */
  var heroBtns = $(".hero .btn-row"), bar = $(".bar");
  if (heroBtns && bar && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle("bar--off", es[0].isIntersecting); }, { threshold: 0.2 }).observe(heroBtns);
  }

  /* lightbox */
  var lb = $("#lb");
  if (lb && lb.showModal) {
    var items = [], idx = 0, im = $("#lb-img", lb), cap = $("#lb-cap", lb), cnt = $("#lb-cnt", lb);
    var show = function (i) {
      idx = (i + items.length) % items.length; var b = items[idx];
      var full = b.getAttribute("data-full"), th = b.querySelector("img");
      im.src = th && th.currentSrc ? th.currentSrc : full; im.alt = b.getAttribute("data-alt"); im.width = +b.getAttribute("data-w"); im.height = +b.getAttribute("data-h");
      var pre = new Image(); pre.onload = function () { if (items[idx] === b) im.src = full; }; pre.src = full;
      var nx = items[(idx + 1) % items.length]; if (nx) { var p2 = new Image(); p2.src = nx.getAttribute("data-full"); }
      cap.textContent = b.getAttribute("data-alt"); cnt.textContent = (idx + 1) + " / " + items.length;
    };
    $$(".ph").forEach(function (b) {
      items.push(b); (function (n) { b.addEventListener("click", function () { show(n); lb.showModal(); d.body.classList.add("lock"); }); })(items.length - 1);
    });
    $("#lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $("#lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    $("#lb-x", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("close", function () { d.body.classList.remove("lock"); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
  }

  /* kiosk finder */
  var dataEl = $("#finder-data");
  if (dataEl) {
    var D = JSON.parse(dataEl.textContent), T = D.ui;
    var kiosks = [];
    D.steel.forEach(function (k) { kiosks.push({ m: "steel", w: k[0], h: k[1], d: k[2] }); });
    D.grp.forEach(function (k) { kiosks.push({ m: "grp", w: k[0], h: k[1], d: k[2] }); });
    var fmt = function (n) { return n.toLocaleString("en-IE"); };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    $$("[data-finder]").forEach(function (root) {
      var st = { mode: "hold", w: 1200, h: 1200, d: 600, spare: 100, swap: false, mat: "all", all: false };
      var q = new URLSearchParams(location.search);
      ["w", "h", "d"].forEach(function (k) { var v = parseInt(q.get(k), 10); if (v >= 50 && v <= 6000) st[k] = v; });
      if (q.get("mode") === "space") st.mode = "space";
      var out = $("[data-out]", root);
      function sync() {
        $$("[data-n]", root).forEach(function (el) { if (+el.value !== st[el.getAttribute("data-n")] && d.activeElement !== el) el.value = st[el.getAttribute("data-n")]; });
        $$("[data-r]", root).forEach(function (el) { el.value = Math.min(Math.max(st[el.getAttribute("data-r")], +el.min), +el.max); });
        $$("input[name^=mode]", root).forEach(function (el) { el.checked = el.value === st.mode; });
        $("[data-hint]", root).textContent = st.mode === "hold" ? T.mode_hold_hint : T.mode_space_hint;
        $("[data-sparebox]", root).hidden = st.mode !== "hold";
        $$("[data-spare]", root).forEach(function (b) { b.classList.toggle("chip--on", +b.getAttribute("data-spare") === st.spare); b.setAttribute("aria-pressed", +b.getAttribute("data-spare") === st.spare); });
        $$("[data-mat]", root).forEach(function (b) { b.classList.toggle("chip--on", b.getAttribute("data-mat") === st.mat); b.setAttribute("aria-pressed", b.getAttribute("data-mat") === st.mat); });
      }
      function match() {
        var sp = st.mode === "hold" ? st.spare : 0, need = { w: st.w + sp, h: st.h + sp, d: st.d + sp }, res = [];
        kiosks.forEach(function (k) {
          if (st.mat !== "all" && k.m !== st.mat) return;
          var o = [{ w: k.w, d: k.d, turned: false }]; if (st.swap) o.push({ w: k.d, d: k.w, turned: true });
          var best = null;
          o.forEach(function (x) {
            var ok = st.mode === "hold" ? (x.w >= need.w && k.h >= need.h && x.d >= need.d) : (x.w <= st.w && k.h <= st.h && x.d <= st.d);
            if (ok && (!best || !x.turned)) best = x;
          });
          if (best) res.push({ k: k, turned: best.turned, ow: best.w, od: best.d, sw: st.mode === "hold" ? best.w - need.w : st.w - best.w, sh: st.mode === "hold" ? k.h - need.h : st.h - k.h, sd: st.mode === "hold" ? best.d - need.d : st.d - best.d, vol: k.w * k.h * k.d });
        });
        res.sort(function (a, b) { return (a.sw + a.sh + a.sd) - (b.sw + b.sh + b.sd) || a.vol - b.vol; });
        return { res: res, need: need };
      }
      function dia(label, kw, kh, yw, yh, kl, yl) {
        var W = 300, H = 190, pad = 26, mw = Math.max(kw, yw), mh = Math.max(kh, yh), s = Math.min((W - 2 * pad) / mw, (H - 2 * pad) / mh);
        var kx = (W - kw * s) / 2, ky = (H - kh * s) / 2 + 4, yx = (W - yw * s) / 2, yy = (H - yh * s) / 2 + 4;
        return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(label) + '"><rect class="k" x="' + kx.toFixed(1) + '" y="' + ky.toFixed(1) + '" width="' + (kw * s).toFixed(1) + '" height="' + (kh * s).toFixed(1) + '"/><rect class="y yf" x="' + yx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + (yw * s).toFixed(1) + '" height="' + (yh * s).toFixed(1) + '"/><rect class="y" x="' + yx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + (yw * s).toFixed(1) + '" height="' + (yh * s).toFixed(1) + '"/>' +
          '<text x="' + (W / 2) + '" y="14" text-anchor="middle">' + fmt(kw) + "</text><text x='10' y='" + (H / 2) + "' text-anchor='middle' transform='rotate(-90 10 " + (H / 2) + ")'>" + fmt(kh) + "</text></svg>";
      }
      function mail(m, r) {
        var matl = r ? (r.k.m === "steel" ? T.steel : T.grp) : "";
        var size = r ? fmt(r.k.w) + " x " + fmt(r.k.h) + " x " + fmt(r.k.d) : "";
        var subj = r ? T.mail_subject.replace("{mat}", matl).replace("{w}", fmt(r.k.w)).replace("{h}", fmt(r.k.h)).replace("{d}", fmt(r.k.d)) : "Kiosk quote request: bespoke size";
        var b = T.mail_intro + "\n\n" + (st.mode === "hold" ? "It has to hold: " : "Space available: ") + fmt(st.w) + " x " + fmt(st.h) + " x " + fmt(st.d) + " mm (W x H x D)" + (st.mode === "hold" && st.spare ? ", with " + st.spare + " mm extra room" : "") + ".\n";
        b += r ? "Closest standard size: " + matl + ", " + size + " mm" + (r.turned ? " (turned 90 degrees)" : "") + ".\n" : "No standard size matches, so I would like a bespoke size.\n";
        b += "\nName:\nPhone:\nSite / county:\n";
        return "mailto:" + D.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(b).replace(/%0A/g, "%0D%0A");
      }
      function render() {
        sync();
        var m = match(), res = m.res, html = "";
        if (!res.length) {
          html = '<p class="fd__none" aria-live="polite">' + esc(T.none) + '</p><div class="fd__act"><a class="btn" href="' + mail(m, null) + '">' + esc(T.cta_none) + '</a><button type="button" class="btn btn--ghost" data-copy>' + esc(T.copy) + '</button><span class="fd__call">' + esc(T.call) + ' <a href="tel:' + D.tel + '">' + esc(D.phone) + "</a></span></div>";
        } else {
          var b = res[0], bw = b.ow, bd = b.od;
          var yw = st.mode === "hold" ? st.w : st.w, yh = st.h, yd = st.d;
          html = '<p class="fd__sum" aria-live="polite">' + (res.length === 1 ? esc(T.found1) : esc(T.found.replace("{n}", res.length))) + "</p>";
          html += '<div class="best"><div class="best__t"><span class="tag">' + esc(T.best) + "</span><b>" + fmt(b.k.w) + " × " + fmt(b.k.h) + " × " + fmt(b.k.d) + "</b><span>" + esc(b.k.m === "steel" ? T.steel : T.grp) + (b.turned ? " · 90°" : "") + "</span></div>";
          var ew = st.mode === "hold" ? st.w : st.w, ed = st.d;
          var f1 = st.mode === "hold" ? dia(T.front, bw, b.k.h, b.turned ? st.d : st.w, st.h) : dia(T.front, bw, b.k.h, st.w, st.h);
          var p1 = st.mode === "hold" ? dia(T.plan, bw, bd, b.turned ? st.d : st.w, b.turned ? st.w : st.d) : dia(T.plan, bw, bd, st.w, st.d);
          html += '<div class="dia"><figure>' + f1 + "<figcaption>" + esc(T.front) + " (W × H)</figcaption></figure><figure>" + p1 + "<figcaption>" + esc(T.plan) + " (W × D)</figcaption></figure></div>";
          html += '<p class="fd__note">' + esc(T.you) + ": dashed. " + esc(T.kiosk) + ": solid. " + esc(T.col_spare) + " " + fmt(b.sw) + " / " + fmt(b.sh) + " / " + fmt(b.sd) + " mm.</p></div>";
          var shown = st.all ? res : res.slice(0, 6);
          html += '<div class="fd__tbl scroller"><table><thead><tr><th>' + esc(T.col_both) + '</th><th class="num">' + esc(T.col_spare) + "</th></tr></thead><tbody>";
          shown.forEach(function (r, i) { html += "<tr" + (i === 0 ? ' class="top"' : "") + "><td>" + fmt(r.k.w) + " × " + fmt(r.k.h) + " × " + fmt(r.k.d) + (r.turned ? " (90°)" : "") + '<br><span class="sub">' + esc(r.k.m === "steel" ? T.steel : T.grp) + '</span></td><td class="num">' + fmt(r.sw) + " / " + fmt(r.sh) + " / " + fmt(r.sd) + "</td></tr>"; });
          html += "</tbody></table></div>";
          if (res.length > 6) html += '<button type="button" class="fd__more" data-more>' + esc(st.all ? T.show_less : T.show_all.replace("{n}", res.length)) + "</button>";
          html += '<div class="fd__act"><a class="btn" data-cta href="' + mail(m, b) + '">' + esc(T.cta) + '</a><button type="button" class="btn btn--ghost" data-copy>' + esc(T.copy) + '</button><span class="fd__call">' + esc(T.call) + ' <a href="tel:' + D.tel + '">' + esc(D.phone) + "</a></span></div>";
        }
        html += '<p class="fd__note">' + esc(T.note) + "</p>";
        out.innerHTML = html;
      }
      root.addEventListener("input", function (e) {
        var t = e.target, k = t.getAttribute("data-n") || t.getAttribute("data-r");
        if (k) { var v = parseInt(t.value, 10); if (!isNaN(v) && v > 0) { st[k] = Math.min(v, 9000); render(); } }
        if (t.name && t.name.indexOf("mode") === 0) { st.mode = t.value; render(); }
        if (t.hasAttribute("data-swap")) { st.swap = t.checked; render(); }
      });
      root.addEventListener("click", function (e) {
        var t = e.target.closest("button"); if (!t) return;
        if (t.hasAttribute("data-spare")) { st.spare = +t.getAttribute("data-spare"); render(); }
        else if (t.hasAttribute("data-mat")) { st.mat = t.getAttribute("data-mat"); render(); }
        else if (t.hasAttribute("data-preset")) { var p = t.getAttribute("data-preset").split(","); st.w = +p[0]; st.h = +p[1]; st.d = +p[2]; st.mode = "hold"; render(); }
        else if (t.hasAttribute("data-more")) { st.all = !st.all; render(); }
        else if (t.hasAttribute("data-copy")) {
          var a = $("[data-cta]", root) || $(".fd__act a.btn", root), href = a ? a.getAttribute("href") : "", subj = decodeURIComponent((href.match(/subject=([^&]*)/) || [0, ""])[1]), body = decodeURIComponent((href.match(/body=(.*)$/) || [0, ""])[1]).replace(/\r\n/g, "\n");
          var txt = "To: " + D.to + "\nSubject: " + subj + "\n\n" + body;
          var done = function (ok) { t.textContent = ok ? "\u2713 " + T.copy : T.copy; var n = $("[data-copymsg]", root); if (!n) { n = d.createElement("p"); n.className = "fd__note"; n.setAttribute("data-copymsg", ""); t.parentNode.parentNode.appendChild(n); } n.textContent = (ok ? T.copied : T.copy_fail).replace("{to}", D.to); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); else done(false);
        }
      });
      render();
    });
  }

  /* contact form */
  var cf = $("#quote-form");
  if (cf) {
    var R = JSON.parse($("#route-data").textContent), sel = $("#f-type", cf), goes = $("#f-goes", cf), pre = new URLSearchParams(location.search).get("type");
    if (pre && R[pre]) sel.value = pre;
    var upd = function () { var r = R[sel.value]; goes.textContent = r.who; $("#f-send", cf).textContent = cf.getAttribute("data-send").replace("{who}", r.who); };
    sel.addEventListener("change", upd); upd();
    cf.addEventListener("submit", function (e) {
      e.preventDefault(); var r = R[sel.value], f = cf.elements;
      f.email.setCustomValidity(f.email.value || f.phone.value ? "" : cf.getAttribute("data-need")); if (!cf.reportValidity()) return;
      var body = cf.getAttribute("data-greet").replace("{type}", r.label) + "\n\n" + f.msg.value + "\n\nName: " + f.name.value + "\nPhone: " + f.phone.value + "\nEmail: " + f.email.value + "\n";
      var u = "mailto:" + r.to + "?subject=" + encodeURIComponent(cf.getAttribute("data-subject").replace("{type}", r.label)) + (r.cc ? "&cc=" + r.cc : "") + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A");
      cf._mail = { to: r.to, text: "To: " + r.to + (r.cc ? "\nCc: " + r.cc : "") + "\nSubject: " + cf.getAttribute("data-subject").replace("{type}", r.label) + "\n\n" + body };
      window.location.href = u;
    });
    var cp = $("#f-copy", cf);
    if (cp) cp.addEventListener("click", function () {
      var r = R[sel.value], f = cf.elements, body = cf.getAttribute("data-greet").replace("{type}", r.label) + "\n\n" + f.msg.value + "\n\nName: " + f.name.value + "\nPhone: " + f.phone.value + "\nEmail: " + f.email.value + "\n";
      var txt = "To: " + r.to + "\nSubject: " + cf.getAttribute("data-subject").replace("{type}", r.label) + "\n\n" + body, m = $("#f-copymsg", cf);
      var done = function (ok) { m.textContent = ok ? cf.getAttribute("data-copied").replace("{to}", r.to) : r.to; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); else done(false);
    });
  }
})();
