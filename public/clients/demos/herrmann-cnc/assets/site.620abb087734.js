(function () {
  "use strict";
  var d = document, w = window;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : 0; }

  /* header + drawer */
  var hdr = $("#hdr"), drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x"), lastFocus = null;
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", w.scrollY > 24); }
  onScroll(); w.addEventListener("scroll", onScroll, { passive: true });
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { lastFocus = d.activeElement; setTimeout(function () { if (bx) bx.focus(); }, 60); }
    else if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });
  w.addEventListener("resize", function () { if (w.innerWidth >= 1240 && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (w.sessionStorage.getItem("hc-dock") === "1" && dock) dock.classList.add("is-gone"); } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.classList.add("is-gone"); try { w.sessionStorage.setItem("hc-dock", "1"); } catch (e) {} });

  /* reveals */
  var rvs = $$(".rv, .rv-img");
  function sweep() {
    var vh = w.innerHeight || 800;
    rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.94) { el.classList.add("in"); } });
    counters.forEach(function (el) { if (!el._done && el.getBoundingClientRect().top < vh * 0.94) runCount(el); });
    tlUpdate();
  }
  var counters = $$("[data-count]");
  function runCount(el) {
    el._done = true;
    var to = parseFloat(el.getAttribute("data-count")), suf = el.getAttribute("data-suf") || "";
    function show(n) { var r = Math.round(n); var t = (r >= 1000 && !(r >= 1900 && r <= 2100)) ? String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(r); el.textContent = t + suf; }
    if (reduce) { show(to); return; }
    var t0 = null, dur = 1100;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); var k = 1 - Math.pow(2, -10 * p); show(to * (p >= 1 ? 1 : k)); if (p < 1) w.requestAnimationFrame(step); }
    w.requestAnimationFrame(step);
  }
  if (!reduce) {
    var vh0 = w.innerHeight || 800;
    counters.forEach(function (el) { if (el.getBoundingClientRect().top > vh0 * 0.94) { el.textContent = "0" + (el.getAttribute("data-suf") || ""); } else { el._done = true; } });
  } else { counters.forEach(function (el) { el._done = true; }); }
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add("in"); }); }

  /* timeline progress */
  var tls = $$("[data-tl]");
  function tlUpdate() {
    tls.forEach(function (t) {
      var r = t.getBoundingClientRect(), vh = w.innerHeight || 800;
      var p = (vh * 0.6 - r.top) / r.height; p = Math.max(0, Math.min(1, p));
      t.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    });
  }
  ["scroll", "resize", "load", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* machine list filter */
  var ml = $("[data-mlist]");
  if (ml) {
    var q = $("#msearch"), chips = $$("[data-g]"), cnt = $("[data-mcount]"), emp = $("[data-mempty]"), grp = "all";
    var items = $$(".mi", ml);
    var apply = function () {
      var t = (q.value || "").toLowerCase().trim(), shown = 0, units = 0;
      items.forEach(function (li) {
        var g = li.closest(".mgroup").getAttribute("data-group");
        var ok = (grp === "all" || g === grp) && (!t || li.textContent.toLowerCase().indexOf(t) > -1);
        li.hidden = !ok;
        if (ok) { shown++; var c = li.querySelector(".mi__c"); units += parseInt(c.textContent.replace(/\D/g, ""), 10) || 0; }
      });
      $$(".mgroup", ml).forEach(function (g) { g.hidden = !$$(".mi:not([hidden])", g).length; });
      if (cnt) cnt.textContent = shown + " Einträge, " + units + " Maschinen";
      if (emp) emp.hidden = shown > 0;
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { grp = c.getAttribute("data-g"); chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); apply(); }); });
    q.addEventListener("input", apply); apply();
  }

  /* signature tool */
  $$("[data-tool]").forEach(function (root) {
    var data = JSON.parse($("[data-tool-data]", root).textContent), UI = data.ui, M = data.machines, base = data.base;
    var mode = "dreh", tabs = $$("[data-mode]", root), groups = $$("[data-group]", root), sum = $("[data-sum]", root), rows = $("[data-rows]", root),
      ex = $("[data-extras]", root), exl = $("[data-extra-list]", root), cta = $("[data-cta]", root), askn = $("[data-asknote]", root), typeSel = $("[data-type]", root);
    var qty = $("[data-qty]", root), mat = $("[data-mat]", root);
    function val(k) { var n = $("#" + root.querySelector('[data-f="' + k + '"] input[type=number]').id); return num(n.value); }
    function setVal(k, v) { var f = $('[data-f="' + k + '"]', root); if (!f) return; $("input[type=number]", f).value = v; $("input[type=range]", f).value = v; }
    function setMode(m, focus) {
      mode = m;
      tabs.forEach(function (t) { var on = t.getAttribute("data-mode") === m; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
      groups.forEach(function (g) { g.hidden = g.getAttribute("data-group") !== m; });
      $$("[data-mode-p]", root).forEach(function (p) { p.hidden = p.getAttribute("data-mode-p") !== m; });
      calc();
    }
    function badge(st) { var t = { ok: UI.fits, tight: UI.fits_tight, no: UI.nofit, ask: UI.ask }[st]; return '<span class="badge badge--' + st + '">' + t + "</span>"; }
    function row(m, st, note, ratio) {
      var bar = (ratio != null && st !== "ask") ? '<div class="bar is-' + st + '" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(ratio * 100)) + '%"></i></div>' : "";
      return { st: st, n: m.n || 0, html: '<div class="mrow is-' + st + '"><div class="mrow__n">' + esc(m.name) + "<small>" + esc(m.maker || "") + (m.maker ? " · " : "") + "×" + (m.n || 1) + (note ? " · " + esc(note) : "") + "</small></div>" + badge(st) + bar + "</div>" };
    }
    function sortFit(a, b) { var o = { ok: 0, tight: 1, ask: 2, no: 3 }; return o[a.st] - o[b.st]; }
    function lim(v, l) { var r = v / l; return r <= 1 ? (r >= 0.92 ? "tight" : "ok") : "no"; }
    function calc() {
      var out = [], ok = 0, total = 0, asks = 0, extras = [], summary = "", params = { t: mode }, fitTxt = "", dimTxt = "";
      if (mode === "dreh") {
        var dd = val("d"), ln = val("len"); params.d = dd; params.len = ln; dimTxt = "Ø " + fmt(dd) + " × " + fmt(ln) + " mm";
        M.forEach(function (m) {
          if (m.g !== "drehen") return; total += m.n;
          if (m.kind === "lathe_chuck") { var s = lim(dd, m.lim); out.push(row(m, s, UI.chuck_note.replace("{lim}", m.lim), Math.min(1, dd / m.lim))); if (s !== "no") ok += m.n; }
          else if (m.kind === "lathe_bar") { var s2 = lim(dd, m.lim); out.push(row(m, s2, UI.bar_note.replace("{lim}", m.lim), Math.min(1, dd / m.lim))); if (s2 !== "no") ok += m.n; }
          else { out.push(row(m, "ask", "", null)); asks += m.n; }
        });
        summary = ok > 0 ? UI.sum_dreh.replace("{n}", "<em>" + ok + "</em>").replace("{t}", total) : (dd > 250 ? UI.too_big_turn : UI.sum_none);
        if (dd <= 120 && ln <= 300) extras.push(UI.extra_grind);
        if (dd <= 50) extras.push(UI.extra_hone);
        var s3 = [dd, dd, ln].sort(function (a, b) { return b - a; }); if (s3[0] <= 1600 && s3[1] <= 900 && s3[2] <= 600) extras.push(UI.extra_cmm);
        extras.push(UI.extra_laser, UI.extra_heat);
        fitTxt = ok > 0 ? UI.sum_dreh.replace("{n}", ok).replace("{t}", total) : "";
      } else if (mode === "fraes") {
        var l = val("l"), b = val("b"), h = val("h"); params.l = l; params.b = b; params.h = h; dimTxt = fmt(l) + " × " + fmt(b) + " × " + fmt(h) + " mm";
        var p = [l, b, h].sort(function (x, y) { return y - x; });
        M.forEach(function (m) {
          if (m.g !== "fraesen") return; total += m.n;
          var t = m.xyz.slice().sort(function (x, y) { return y - x; }); var r = Math.max(p[0] / t[0], p[1] / t[1], p[2] / t[2]);
          var s = r <= 1 ? (r >= 0.92 ? "tight" : "ok") : "no"; if (s !== "no") ok += m.n;
          out.push(row(m, s, "X" + m.xyz[0] + " / Y" + m.xyz[1] + " / Z" + m.xyz[2], Math.min(1, r)));
        });
        summary = ok > 0 ? UI.sum_fraes.replace("{n}", "<em>" + ok + "</em>").replace("{t}", total) : UI.sum_none;
        if (p[0] <= 1600 && p[1] <= 900 && p[2] <= 600) extras.push(UI.extra_cmm);
        extras.push(UI.extra_laser, UI.extra_heat);
        fitTxt = ok > 0 ? UI.sum_fraes.replace("{n}", ok).replace("{t}", total) : "";
      } else {
        var mo = val("mod"), zd = val("zd"), ty = typeSel.value; params.mod = mo; params.zd = zd; params.ty = ty;
        var tyl = typeSel.options[typeSel.selectedIndex].text; dimTxt = "Modul " + fmt(mo) + ", Außen-Ø " + fmt(zd) + " mm (" + tyl + ")";
        if (ty === "kegel") {
          var sk = mo <= 2.5 ? (mo >= 2.3 ? "tight" : "ok") : "no";
          out.push(row({ name: UI.kegel_row, maker: "", n: 0 }, sk, "", Math.min(1, mo / 2.5)));
          summary = mo <= 2.5 ? UI.sum_kegel_ok : UI.sum_kegel_no; fitTxt = summary;
        } else {
          M.forEach(function (m) {
            if (m.kind === "gear_hob") { total += m.n; if (ty === "gs") { var s = lim(mo, m.mod); out.push(row(m, s, "bis Modul " + fmt(m.mod), Math.min(1, mo / m.mod))); if (s !== "no") ok += m.n; } }
            if (m.kind === "gear_shape") { total += m.n; var r = Math.max(mo / m.mod, zd / m.dia); var s2 = r <= 1 ? (r >= 0.92 ? "tight" : "ok") : "no"; out.push(row(m, s2, "bis Modul " + m.mod + ", Ø " + m.dia + " mm", Math.min(1, r))); if (s2 !== "no") ok += m.n; }
            if (m.kind === "broach" && ty === "innen") { out.push(row(m, "ask", "", null)); asks += m.n; }
          });
          total = M.filter(function (m) { return (ty === "gs" && (m.kind === "gear_hob" || m.kind === "gear_shape")) || (ty === "innen" && m.kind === "gear_shape"); }).reduce(function (a, m) { return a + m.n; }, 0);
          summary = ok > 0 ? UI.sum_verz.replace("{n}", "<em>" + ok + "</em>").replace("{t}", total) : UI.sum_none;
          fitTxt = ok > 0 ? UI.sum_verz.replace("{n}", ok).replace("{t}", total) : "";
          if (ty === "innen") extras.push(UI.extra_broach);
        }
        extras.push(UI.extra_laser, UI.extra_heat);
      }
      out.sort(sortFit);
      sum.innerHTML = summary; rows.innerHTML = out.map(function (o) { return o.html; }).join("");
      exl.innerHTML = extras.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); ex.hidden = !extras.length;
      askn.textContent = asks ? UI.ask_note.replace("{n}", asks) : "";
      var qs = new URLSearchParams(params); if (qty && qty.value) qs.set("q", qty.value); if (mat && mat.value) qs.set("m", mat.value);
      if (fitTxt) qs.set("s", fitTxt); qs.set("dims", dimTxt);
      cta.href = base + "/anfrage/?" + qs.toString();
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { setMode(t.getAttribute("data-mode")); });
      t.addEventListener("keydown", function (e) { var i = tabs.indexOf(t), n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null; if (n === null) return; n = (n + tabs.length) % tabs.length; tabs[n].focus(); setMode(tabs[n].getAttribute("data-mode")); e.preventDefault(); });
    });
    $$(".fld", root).forEach(function (f) {
      var n = $("input[type=number]", f), r = $("input[type=range]", f); if (!n || !r) return;
      r.addEventListener("input", function () { n.value = r.value; calc(); });
      n.addEventListener("input", function () { r.value = n.value; calc(); });
    });
    if (typeSel) typeSel.addEventListener("change", calc);
    [qty, mat].forEach(function (x) { if (x) x.addEventListener("input", calc); });
    $$("[data-preset]", root).forEach(function (b) { b.addEventListener("click", function () { var v = JSON.parse(b.getAttribute("data-preset")); Object.keys(v).forEach(function (k) { setVal(k, v[k]); }); calc(); }); });
    var m0 = new URLSearchParams(w.location.search).get("t"); setMode(["dreh", "fraes", "verz"].indexOf(m0) > -1 ? m0 : "dreh");
  });

  /* RFQ */
  var form = $("#rfq");
  if (form) {
    var cfg = JSON.parse($("#rfq-data").textContent), L = cfg.labels, qs = new URLSearchParams(w.location.search);
    var map = { dreh: "Drehen", fraes: "Fräsen", verz: "Verzahnen" };
    function setf(id, v) { var el = $("#" + id); if (el && v) el.value = v; }
    if (qs.get("t") && map[qs.get("t")]) { var sel = $("#type"); if (sel) sel.value = map[qs.get("t")]; }
    setf("dims", qs.get("dims")); setf("qty", qs.get("q")); setf("material", qs.get("m"));
    if (qs.get("s")) { var fb = $("#fitbox"); fb.hidden = false; fb.textContent = L.fit + ": " + qs.get("s"); }
    function body() {
      var g = function (id) { var el = $("#" + id); return el ? el.value.trim() : ""; }, lines = [cfg.hello, ""];
      [["part", "part"], ["type", "type"], ["dims", "dims"], ["material", "material"], ["qty", "qty"], ["industry", "industry"]].forEach(function (p) { if (g(p[0])) lines.push(L[p[1]] + ": " + g(p[0])); });
      var fb = $("#fitbox"); if (fb && !fb.hidden) lines.push(fb.textContent);
      if ($("#en9100").checked) lines.push(cfg.en);
      if (g("notes")) { lines.push(""); lines.push(g("notes")); }
      lines.push("", cfg.foot, "", cfg.bye); if (g("name")) lines.push(g("name")); if (g("company")) lines.push(g("company")); if (g("email")) lines.push(g("email")); if (g("phone")) lines.push(g("phone"));
      return lines.join("\n");
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); var subj = cfg.subject + ($("#part").value ? ": " + $("#part").value.trim() : ""); w.location.href = "mailto:" + cfg.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body()); });
    var cp = $("#rfq-copy"); cp.addEventListener("click", function () {
      var t = body(), done = function () { var o = cp.textContent; cp.textContent = cp.getAttribute("data-done"); setTimeout(function () { cp.textContent = o; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
      else { var ta = d.createElement("textarea"); ta.value = t; d.body.appendChild(ta); ta.select(); try { d.execCommand("copy"); done(); } catch (e) {} d.body.removeChild(ta); }
    });
  }
})();
