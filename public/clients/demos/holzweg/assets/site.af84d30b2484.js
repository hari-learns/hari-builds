(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("hw-dock") === "1"; })) dock.hidden = true;
  if (dock && window.innerWidth < 900) setTimeout(function () { dock.hidden = true; }, 7000);
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("hw-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); var li = el.closest ? el.closest(".ws li") : null; }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* contact form -> mailto draft */
  var mf = $("#mailform");
  if (mf) mf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = mf.elements, lines = [];
    lines.push("Guten Tag", "");
    if (f.was.value) lines.push("Vorhaben: " + f.was.value);
    if (f.msg.value) lines.push("", f.msg.value);
    lines.push("", "Name: " + f.name.value, "Telefon: " + f.tel.value, "PLZ und Ort: " + f.ort.value);
    window.location.href = "mailto:" + mf.getAttribute("data-mailto") + "?subject=" + encodeURIComponent(mf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
  });

  /* ---------------------------------------------- signature tool: Was haben Sie vor? */
  var tool = $("[data-tool]");
  if (tool) (function () {
    var DATA = JSON.parse($("#tool-data").textContent), T = DATA.t, CO = DATA.co, BASE = DATA.base;
    var dyn = $("#tool-dyn");
    var state = { v: null, needs: [], holz: [], obj: null, ort: "" };
    function vh(id) { return T.vorhaben.filter(function (x) { return x.id === id; })[0]; }
    function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

    function chipGroup(name, items, selected, multi) {
      return '<div class="opts">' + items.map(function (it) {
        var id = it.id || it, label = it.label || it;
        return '<label class="opt"><input type="' + (multi ? "checkbox" : "radio") + '" name="' + name + '" value="' + esc(id) + '"' + (selected.indexOf(id) >= 0 ? " checked" : "") + '><span>' + esc(label) + '</span></label>';
      }).join("") + "</div>";
    }

    function results() {
      var V = vh(state.v), out = "", pageUrl = function (p) { return BASE + "/" + p + "/"; };
      if (!V) return "";
      var summary = [];
      if (V.kind === "wetter") {
        var needs = state.needs;
        var scored = T.products.map(function (p) {
          var hits = needs.filter(function (n) { return p.why[n]; });
          return { p: p, hits: hits };
        }).filter(function (x) { return x.hits.length > 0; });
        if (state.v === "renovation") scored = scored.filter(function (x) { return x.p.id === "renovation" || x.p.id === "fensterladen" || x.p.id === "rollladen"; }).concat([]);
        scored.sort(function (a, b) { return b.hits.length - a.hits.length; });
        if (!needs.length) { scored = T.products.map(function (pp) { var k = Object.keys(pp.why)[0]; return { p: pp, hits: [k], overview: true }; }).filter(function (x) { return x.p.id !== "renovation" || state.v === "renovation"; }); }
        if (!scored.length) out = '<p class="note">' + esc(T.none) + "</p>";
        else out = '<div class="res">' + scored.slice(0, needs.length ? 3 : 4).map(function (x) {
          return '<div class="res__item"><span class="res__score">' + (x.overview ? esc(T.overview || "") : x.hits.length + " / " + needs.length + " " + esc(T.pick_match || "")) + '</span><h3>' + esc(x.p.name) + "</h3><ul>" + x.hits.map(function (n) {
            var nl = T.needs.filter(function (z) { return z.id === n; })[0].label;
            return "<li><b>" + esc(nl) + ":</b> " + esc(x.p.why[n]) + "</li>";
          }).join("") + '</ul><a class="res__go" href="' + pageUrl(x.p.page) + '">' + esc(T.go || "Produktseite") + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>';
        }).join("") + "</div>";
        summary = scored.slice(0, needs.length ? 3 : 4).map(function (x) { return x.p.name; });
      } else {
        out = '<div class="res"><div class="res__item"><h3>' + esc(V.label) + "</h3><ul>" + V.facts.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + '</ul><a class="res__go" href="' + pageUrl(V.page) + '">' + esc(T.go || "Produktseite") + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div></div>';
      }
      return { html: out, summary: summary };
    }

    function draft() {
      var V = vh(state.v), R = T.mail_rows, L = [T.mail_greeting, "", T.mail_intro];
      L.push(R.vorhaben + ": " + V.label);
      if (V.kind === "wetter" && state.needs.length) L.push(R.wichtig + ": " + state.needs.map(function (n) { return T.needs.filter(function (z) { return z.id === n; })[0].label; }).join(", "));
      if (state.holz.length) L.push(R.holz + ": " + state.holz.join(", "));
      if (state.obj) L.push(R.objekt + ": " + state.obj);
      if (state.ort) L.push(R.ort + ": " + state.ort);
      L.push("", T.mail_outro, "", T.mail_sign);
      return { subject: T.mail_subject + ": " + V.label, body: L.join("\n") };
    }

    function render() {
      var V = vh(state.v), h = "";
      if (!V) { dyn.innerHTML = ""; return; }
      if (V.kind === "wetter") {
        h += '<fieldset class="tool__step" data-step="needs"><legend>' + "2. " + esc(T.step2_wetter_t) + "</legend>" + chipGroup("needs", T.needs, state.needs, true) + "</fieldset>";
        h += '<fieldset class="tool__step" data-step="holz"><legend>3. ' + esc(T.step2_holz_t) + "</legend>" + chipGroup("holz", T.holz.wetter, state.holz, true) + '<p class="note">' + esc(T.holz_note.wetter) + "</p></fieldset>";
      } else if (V.holz) {
        h += '<fieldset class="tool__step" data-step="holz"><legend>2. ' + esc(T.step2_holz_t) + "</legend>" + chipGroup("holz", T.holz[V.holz], state.holz, true) + '<p class="note">' + esc(T.holz_note[V.holz]) + "</p></fieldset>";
      }
      h += '<fieldset class="tool__step" data-step="obj"><legend>' + esc(V.kind === "wetter" ? "4. " : (V.holz ? "3. " : "2. ")) + esc(T.step3_t) + "</legend>" + chipGroup("obj", T.objekt, state.obj ? [state.obj] : [], false) +
        '<div class="fld" style="margin-top:14px"><label for="ort">' + esc(T.ort_label) + '</label><input id="ort" name="ort" autocomplete="postal-code" value="' + esc(state.ort) + '"></div></fieldset>';
      var R = results();
      h += '<div><h2 class="tool__h">' + esc(T.result_h) + "</h2>" + (R.html || R) + "</div>";
      var dr = draft();
      var href = "mailto:" + CO.email + "?subject=" + encodeURIComponent(dr.subject) + "&body=" + encodeURIComponent(dr.body);
      h += '<div class="next"><h2 class="tool__h">' + esc(T.next_h) + "</h2><p>" + esc(T.next_p) + '</p><details class="draftbox"><summary>' + esc(T.preview) + '</summary><pre class="draft" aria-label="E-Mail">' + esc(dr.body) + '</pre></details><div class="btn-row"><a class="btn" href="' + href + '">' + esc(T.mail_btn) + '</a><a class="btn btn--ghost" href="tel:' + CO.tel + '">' + esc(T.call_btn) + " " + esc(CO.tel_show) + '</a></div><p class="small">' + esc(T.note) + "</p></div>";
      var keep = d.activeElement && d.activeElement.name, kv = d.activeElement && d.activeElement.value, sel = d.activeElement && d.activeElement.selectionStart;
      dyn.innerHTML = h;
      if (keep === "ort") { var o = $("#ort", dyn); if (o) { o.focus(); try { o.setSelectionRange(sel, sel); } catch (e) {} } }
    }

    tool.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "vorhaben") { state = { v: t.value, needs: [], holz: [], obj: null, ort: state.ort }; render(); }
      else if (t.name === "needs") { toggle(state.needs, t.value); render(); }
      else if (t.name === "holz") { toggle(state.holz, t.value); render(); }
      else if (t.name === "obj") { state.obj = t.value; render(); }
    });
    tool.addEventListener("input", function (e) { if (e.target.name === "ort") { state.ort = e.target.value; var dr = draft(); var pre = $(".draft", dyn); if (pre) pre.textContent = dr.body; var a = $(".next .btn", dyn); if (a) a.href = "mailto:" + CO.email + "?subject=" + encodeURIComponent(dr.subject) + "&body=" + encodeURIComponent(dr.body); } });

    var q = safe(function () { return new URLSearchParams(location.search).get("v"); });
    var map = { wetterschutz: "wetterschutz", renovation: "renovation", kueche: "kueche", tisch: "tisch", bett: "bett", bad: "bad", boden: "boden", tuer: "tuer", office: "office", raum: "raum" };
    if (q && map[q] && vh(map[q])) {
      state.v = map[q];
      var r = $('input[name="vorhaben"][value="' + map[q] + '"]', tool); if (r) r.checked = true;
      render();
    }
  })();
})();
