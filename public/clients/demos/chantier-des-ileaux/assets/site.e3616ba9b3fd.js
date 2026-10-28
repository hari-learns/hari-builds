/* Chantier des Ileaux concept: one IIFE, every feature existence-guarded */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (f) { try { return f(); } catch (e) { return null; } };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger"), dx = $("#drawer-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if ("inert" in drawer) drawer.inert = !open;
    if (open && dx) dx.focus(); else if (!open && burger && document.activeElement && drawer.contains(document.activeElement)) burger.focus();
  }
  if (drawer) { if ("inert" in drawer) drawer.inert = true; }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (dx) dx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { setDrawer(false); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* ---------- dock ---------- */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("cdi-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cdi-dock", "1"); }); });

  /* ---------- reveals ---------- */
  var rv = $$(".rv");
  function activate(el) { el.classList.add("in"); }
  if (rv.length) {
    if (reduce || !("IntersectionObserver" in window)) rv.forEach(activate);
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
      rv.forEach(function (el) { io.observe(el); });
      var sweep = function () { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); };
      ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
      sweep();
    }
  }

  /* ---------- hero video (their own footage; poster shows first) ---------- */
  var hv = $("#hero-video"), hp = $("#hero-pause");
  function startHero() {
    if (!hv || reduce) return;
    var conn = navigator.connection || {};
    if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")) return;
    var src = window.innerWidth <= 820 ? hv.getAttribute("data-src-s") : hv.getAttribute("data-src-l");
    hv.src = src; hv.muted = true;
    var p = hv.play();
    if (p && p.then) p.then(function () { hv.classList.add("on"); if (hp) hp.hidden = false; }).catch(function (e) { console.warn("[hero] autoplay blocked", e && e.name); });
    hv.addEventListener("playing", function () { hv.classList.add("on"); if (hp) hp.hidden = false; }, { once: true });
  }
  if (hv) {
    if (document.readyState === "complete") setTimeout(startHero, 300); else window.addEventListener("load", function () { setTimeout(startHero, 300); });
    if (hp) hp.addEventListener("click", function () {
      if (hv.paused) { hv.play(); hp.setAttribute("aria-label", hp.getAttribute("data-pause")); } else { hv.pause(); hp.setAttribute("aria-label", hp.getAttribute("data-play")); }
    });
  }

  /* ---------- filter chips ---------- */
  var grid = $("#grid");
  if (grid) $$(".chips").forEach(function (chips) {
    $$(".chip", chips).forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip", chips).forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-pressed", "false"); });
        c.classList.add("is-on"); c.setAttribute("aria-pressed", "true");
        var f = c.getAttribute("data-f");
        $$(".card", grid).forEach(function (card) { card.hidden = !!f && card.getAttribute("data-flotte") !== f; });
      });
    });
  });

  /* ---------- lightbox ---------- */
  var lb = $("#lb");
  if (lb && lb.showModal) {
    var lbi = $("#lb-img"), links = [], idx = 0;
    var show = function (i) { idx = (i + links.length) % links.length; var a = links[idx]; lbi.src = a.getAttribute("href"); lbi.alt = a.getAttribute("aria-label") || ""; };
    $$(".gal-a").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); links = $$(".gal-a", a.closest(".gal")); show(links.indexOf(a)); lb.showModal(); document.documentElement.style.overflow = "hidden"; });
    });
    var closeLb = function () { lb.close(); };
    lb.addEventListener("close", function () { document.documentElement.style.overflow = ""; });
    $("#lb-x").addEventListener("click", closeLb);
    $("#lb-p").addEventListener("click", function () { show(idx - 1); });
    $("#lb-n").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) closeLb(); });
    lb.addEventListener("keydown", function (ev) { if (ev.key === "ArrowLeft") show(idx - 1); if (ev.key === "ArrowRight") show(idx + 1); });
  }

  /* ---------- signature tool: devis helper ---------- */
  var dataEl = $("#tool-data");
  var roots = $$(".dt");
  if (dataEl && roots.length) {
    var D = JSON.parse(dataEl.textContent), T = D.ui;
    var nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }), nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    var eur = function (n) { return nf.format(Math.round(n)).replace(/ /g, " ") + " €"; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var parse = function (v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n > 0 ? n : null; };
    var needLabel = {}; T.needs.forEach(function (n) { needLabel[n[0]] = n[1]; });
    var qs = new URLSearchParams(location.search);

    roots.forEach(function (root, rootIndex) {
      var body = $(".dt-body", root), uid = "t" + rootIndex + "-", need = root.getAttribute("data-need") || qs.get("need") || "";
      var boatPre = qs.get("boat");
      var opt = function (arr, fn) { return arr.map(fn).join(""); };
      var boatOpts = function () { return '<option value="">' + esc(T.like_none) + "</option>" + opt(D.boats.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); }), function (b) { return '<option value="' + b.slug + '">' + esc(b.name) + " (" + String(b.L).replace(".", ",") + " × " + String(b.W).replace(".", ",") + " m)</option>"; }); };
      var common = function (full) {
        var h = '<fieldset><legend class="dt-lg">' + (root.getAttribute("data-compact") === "1" ? "" : "2. ") + esc(T.boat) + '</legend><div class="dt-grid">';
        h += '<label class="f full">' + esc(T.boat_type) + '<select id="' + uid + 'type">' + opt(T.types, function (t, i) { return '<option value="' + i + '">' + esc(t) + "</option>"; }) + "</select></label>";
        h += '<label class="f">' + esc(T.len) + '<input id="' + uid + 'len" type="text" inputmode="decimal" autocomplete="off" placeholder="8,5"></label>';
        h += '<label class="f">' + esc(T.wid) + '<input id="' + uid + 'wid" type="text" inputmode="decimal" autocomplete="off" placeholder="2,5"></label>';
        h += '<label class="f full">' + esc(T.like) + '<select id="' + uid + 'like">' + boatOpts() + "</select></label>";
        return h + "</div></fieldset>";
      };
      var contact = function () {
        return '<fieldset><legend class="dt-lg">' + esc(T.finish) + '</legend><div class="dt-grid"><label class="f full"><span>' + esc(T.when) + '</span><select id="' + uid + 'when">' + opt(T.whens, function (w) { return "<option>" + esc(w) + "</option>"; }) + "</select></label>" +
          '<label class="f"><span>' + esc(T.name) + '</span><input id="' + uid + 'name" type="text" autocomplete="name"></label><label class="f"><span>' + esc(T.tel) + '</span><input id="' + uid + 'tel" type="tel" autocomplete="tel"></label>' +
          '<label class="f full"><span>' + esc(T.free) + '</span><textarea id="' + uid + 'free" rows="3"></textarea></label></div></fieldset>';
      };
      var render = function () {
        var h = "";
        if (!need) { body.innerHTML = ""; return; }
        if (need === "hivernage") {
          h += common() + '<fieldset><legend class="dt-lg">' + esc(T.needs[0][1]) + '</legend><div class="dt-radios">' + opt(T.places, function (p, i) { return '<label class="dt-radio"><input type="radio" name="' + uid + 'place" value="' + p[0] + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(p[1]) + "<small>" + esc(p[2]) + "</small></span></label>"; }) + "</div>" +
            '<div style="margin-top:16px"><label class="f" for="' + uid + 'months">' + esc(T.months) + '</label><div class="dt-range"><input id="' + uid + 'months" type="range" min="1" max="12" value="6"><output id="' + uid + 'mo" for="' + uid + 'months">6</output></div></div>' +
            '<label class="dt-check" style="margin-top:14px"><input id="' + uid + 'ber" type="checkbox"><span>' + esc(T.ber) + "</span></label></fieldset>";
        } else if (need === "restauration") {
          h += common() + '<fieldset><legend class="dt-lg">' + esc(T.works_h) + '</legend><div class="dt-checks">' + opt(T.works, function (w, i) { return '<label class="dt-check"><input type="checkbox" name="' + uid + 'w" value="' + esc(w) + '"><span>' + esc(w) + "</span></label>"; }) + "</div></fieldset>";
        } else if (need === "construction") {
          h += '<fieldset><legend class="dt-lg">' + esc(T.model) + '</legend><div class="dt-grid"><label class="f full"><span>' + esc(T.model) + '</span><select id="' + uid + 'model"><option value="">' + esc(T.custom) + "</option>" + opt(D.models.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); }), function (m) { return '<option value="' + m.slug + '">' + esc(m.name) + " (" + String(m.L).replace(".", ",") + " m)</option>"; }) + "</select></label></div></fieldset>";
        } else {
          h += '<fieldset><legend class="dt-lg">' + esc(T.expert_h) + '</legend><div class="dt-radios">' + opt(T.expert_opts, function (o, i) { return '<label class="dt-radio"><input type="radio" name="' + uid + 'ex" value="' + esc(o) + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(o) + "</span></label>"; }) + "</div></fieldset>" + common();
        }
        h += '<div class="dt-est-slot" id="' + uid + 'est"></div>' + contact();
        h += '<div class="dt-res" id="' + uid + 'res"></div>';
        body.innerHTML = h;
        var g = function (id) { return $("#" + uid + id, root); };
        if (boatPre) { var b = D.boats.filter(function (x) { return x.slug === boatPre; })[0]; if (b && g("like")) { g("like").value = b.slug; g("len").value = String(b.L).replace(".", ","); g("wid").value = String(b.W).replace(".", ","); } if (need === "construction" && g("model")) { g("model").value = boatPre; } }
        if (g("like")) g("like").addEventListener("change", function () { var b = D.boats.filter(function (x) { return x.slug === g("like").value; })[0]; if (b) { g("len").value = String(b.L).replace(".", ","); g("wid").value = String(b.W).replace(".", ","); } update(); });
        body.addEventListener("input", update); body.addEventListener("change", update);
        update();
      };
      var update = function () {
        var g = function (id) { return $("#" + uid + id, root); }, val = function (id) { var el = g(id); return el ? el.value : ""; };
        var res = g("res"); if (!res) return;
        var L = parse(val("len")), W = parse(val("wid")), lines = ["Bonjour,", "", "Je souhaite un devis : " + needLabel[need].toLowerCase() + ".", ""];
        var est = "", subj = D.subject + " : " + needLabel[need].toLowerCase();
        var typeEl = g("type"), btype = typeEl ? T.types[+typeEl.value] : "";
        if (typeEl) { var d = "Mon bateau : " + btype; if (L) d += ", " + nf1.format(L) + " m"; if (W) d += " × " + nf1.format(W) + " m"; lines.push(d + "."); }
        if (need === "hivernage") {
          var months = +val("months"), place = ($("input[name=" + uid + "place]:checked", root) || {}).value || "couvert", rate = D.rates[place], pl = T.places.filter(function (p) { return p[0] === place; })[0][1];
          var mo = g("mo"); if (mo) mo.textContent = months;
          if (L && W) {
            var area = L * W, mHT = area * rate[0], mTTC = area * rate[1], tTTC = mTTC * months, tHT = mHT * months;
            est = '<div class="dt-est"><h3>' + esc(T.est_h) + '</h3><p class="dt-big">≈ ' + eur(tTTC) + ' <small>TTC pour ' + months + ' mois</small></p><p><strong>' + eur(tHT) + ' HT</strong> · ' + eur(mTTC) + ' TTC par mois · ' + esc(pl.toLowerCase()) + '</p><p>Emprise : ' + nf1.format(L) + ' × ' + nf1.format(W) + ' = ' + nf1.format(area) + ' m²</p><p class="fine">' + esc(T.disclaimer) + "</p></div>";
            lines.push("Hivernage : " + pl.toLowerCase() + ", " + months + " mois. Estimation indicative d'après vos tarifs affichés : environ " + eur(tTTC).replace(/ /g, " ") + " TTC (" + eur(mTTC).replace(/ /g, " ") + " TTC par mois, emprise " + nf1.format(area) + " m²).");
          } else { est = '<div class="dt-est"><h3>' + esc(T.est_h) + "</h3><p>" + esc(T.est_empty) + "</p></div>"; lines.push("Hivernage : " + pl.toLowerCase() + ", " + months + " mois."); }
          if (g("ber") && g("ber").checked) lines.push("Je n'ai ni remorque ni béquilles : j'aurai besoin d'un ber loué par le chantier.");
        } else if (need === "restauration") {
          var ws = $$("input[name=" + uid + "w]:checked", root).map(function (x) { return x.value; });
          est = '<div class="dt-est"><h3>' + esc(T.rate_h) + "</h3><p>" + esc(T.labour_note) + "</p></div>";
          lines.push(ws.length ? "Travaux envisagés : " + ws.join(", ").toLowerCase() + "." : "Travaux à définir ensemble après un état des lieux.");
        } else if (need === "construction") {
          var m = D.models.filter(function (x) { return x.slug === val("model"); })[0];
          if (m) { est = '<div class="dt-est"><h3>' + esc(m.name) + "</h3><p><strong>" + String(m.L).replace(".", ",") + " m</strong>" + (m.W ? " × " + String(m.W).replace(".", ",") + " m" : "") + " · " + esc(m.flotte) + '</p><p>' + esc(T.constr_note) + ' <a href="' + m.url + '">' + esc(m.name) + "</a></p></div>"; lines.push("Bateau qui m'intéresse : " + m.name + "."); }
          else { est = '<div class="dt-est"><h3>' + esc(T.custom) + "</h3><p>" + esc(T.constr_note) + "</p></div>"; lines.push("Je souhaite étudier un projet sur mesure."); }
        } else {
          var ex = ($("input[name=" + uid + "ex]:checked", root) || {}).value || "";
          est = '<div class="dt-est"><h3>' + esc(needLabel[need]) + "</h3><p>" + esc(T.expert_note) + "</p></div>"; lines.push(ex + ".");
        }
        if (g("when")) lines.push("Délai souhaité : " + val("when").toLowerCase() + ".");
        if (val("free")) { lines.push(""); lines.push("Précisions : " + val("free")); }
        lines.push(""); lines.push("Cordialement,"); var nm = val("name").trim(), tl = val("tel").trim(); lines.push(nm || ""); if (tl) lines.push("Téléphone : " + tl);
        var text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
        var href = "mailto:" + D.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text);
        var estEl = g("est"); if (estEl) estEl.innerHTML = est;
        res.innerHTML = '<div class="dt-out"><h3>' + esc(T.res_h) + '</h3><label class="f vh" for="' + uid + 'msg">' + esc(T.res_h) + '</label><textarea class="dt-msg" id="' + uid + 'msg" readonly></textarea>' +
          '<div class="dt-act"><a class="btn btn-brass" href="' + href + '">' + esc(T.send) + '</a><button type="button" class="btn btn-line-d" id="' + uid + 'copy">' + esc(T.copy) + '</button><a class="btn btn-navy" href="' + D.tel1h + '">' + esc(T.callb) + " " + esc(D.tel1) + '</a></div>' +
          '<p class="dt-hint"><a class="lnk" href="' + D.live + '" rel="noopener">' + esc(T.or_live) + "</a></p></div>";
        var msgEl = $("#" + uid + "msg", root); msgEl.value = text; msgEl.style.height = "auto"; msgEl.style.height = Math.max(260, msgEl.scrollHeight + 4) + "px";
        var cp = $("#" + uid + "copy", root);
        cp.addEventListener("click", function () { var done = function () { cp.textContent = T.copied; setTimeout(function () { cp.textContent = T.copy; }, 2000); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { $("#" + uid + "msg", root).select(); }); else { $("#" + uid + "msg", root).select(); } });
      };
      // keep the textarea value while typing: update() rewrites only #res, not the fields
      $$("input[name='" + "dt" + (root.id === "dtc" ? "c" : "") + "-need']", root).forEach(function (r) { r.addEventListener("change", function () { need = r.value; render(); }); });
      $$("input[type=radio][name$='-need']", root).forEach(function (r) { if (r.value === need) r.checked = true; });
      render();
    });
  }
})();
