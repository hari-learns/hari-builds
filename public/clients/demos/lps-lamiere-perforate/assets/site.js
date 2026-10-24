(function () {
  "use strict";
  var d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  function safe(f) { try { return f(); } catch (e) { return null; } }
  d.documentElement.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (n) { n.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < innerHeight * 0.95) n.classList.add("in"); else io.observe(n); });
  }

  /* menu */
  var b = $("#burger"), nav = $("#nav");
  if (b && nav) {
    b.addEventListener("click", function () { var o = nav.classList.toggle("open"); b.setAttribute("aria-expanded", o); d.body.style.overflow = o ? "hidden" : ""; });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); b.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { b.click(); b.focus(); } });
    addEventListener("resize", function () { if (innerWidth > 1020 && nav.classList.contains("open")) b.click(); });
  }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("lps-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("lps-dock", "1"); }); });

  /* finder: only reshuffles the stock sheet published by L.P.S. (Assortimento lamiere forate a magazzino, formato 1000x2000) */
  var fin = $("#finder"), sd = $("#stock-data");
  if (fin && sd) {
    var cfg = JSON.parse(fin.dataset.cfg), ROWS = JSON.parse(sd.textContent);
    var el = { mat: $("#f-mat"), type: $("#f-type"), th: $("#f-th"), hole: $("#f-hole"), count: $("#fin-count"), list: $("#fin-list"), more: $("#fin-more"), items: $("#fin-items"), empty: $("#fin-empty"), fields: $("#fin-fields"), send: $("#fin-send"), jump: $("#fin-jump"), copy: $("#fin-copy"), co: $("#r-co"), nm: $("#r-nm"), tel: $("#r-tel") };
    var limit = cfg.limit, shown = limit, picked = [], pid = 0, text = "";
    var TCODE = { R: "R.-T", C: "C.-U", H: "H.-T" }, SHAPE = { R: "tondo", C: "quadro", H: "esagonale" };
    function fmt(n) { return Number(n).toLocaleString("it-IT", { maximumFractionDigits: 2 }); }
    function uniq(a) { var o = {}; return a.filter(function (x) { return o[x] ? false : (o[x] = 1); }); }
    function opts(sel, vals, label) { var cur = sel.value; sel.innerHTML = ""; var o = d.createElement("option"); o.value = ""; o.textContent = "Tutti"; sel.appendChild(o); vals.forEach(function (v) { var x = d.createElement("option"); x.value = String(v); x.textContent = label(v); sel.appendChild(x); }); if (cur && vals.map(String).indexOf(cur) > -1) sel.value = cur; else sel.value = ""; }
    function match(r, skip) { return (!el.mat.value || r[0] === el.mat.value) && (!el.type.value || r[1] === el.type.value) && (skip === "th" || !el.th.value || String(r[5]) === el.th.value) && (skip === "hole" || !el.hole.value || String(r[2]) === el.hole.value); }
    function pattern(r) {
      var t = r[1], dd = r[2], p = r[3], id = "pt" + (++pid), s, h = p * 1.7320508;
      if (t === "C") s = '<pattern id="' + id + '" width="' + p + '" height="' + p + '" patternUnits="userSpaceOnUse"><rect x="' + (p - dd) / 2 + '" y="' + (p - dd) / 2 + '" width="' + dd + '" height="' + dd + '" fill="#f4f3f0"/></pattern>';
      else {
        var shape = function (x, y) {
          if (t === "H") { var R = dd / 1.7320508, pts = []; for (var k = 0; k < 6; k++) { var a = Math.PI / 3 * k + Math.PI / 6; pts.push((x + R * Math.cos(a)).toFixed(3) + "," + (y + R * Math.sin(a)).toFixed(3)); } return '<polygon points="' + pts.join(" ") + '" fill="#f4f3f0"/>'; }
          return '<circle cx="' + x + '" cy="' + y + '" r="' + dd / 2 + '" fill="#f4f3f0"/>';
        };
        s = '<pattern id="' + id + '" width="' + p + '" height="' + h + '" patternUnits="userSpaceOnUse">' + shape(0, 0) + shape(p, 0) + shape(0, h) + shape(p, h) + shape(p / 2, h / 2) + "</pattern>";
      }
      return '<svg class="fin-pat" viewBox="0 0 24 24" role="img" aria-label="Anteprima in scala del foro, riquadro di 24 per 24 mm" focusable="false"><defs>' + s + '</defs><rect width="24" height="24" fill="#585858"/><rect width="24" height="24" fill="url(#' + id + ')"/></svg>';
    }
    function groups() {
      var g = {}, order = [];
      ROWS.forEach(function (r) { if (!match(r)) return; var k = [r[0], r[1], r[2], r[3]].join("|"); if (!g[k]) { g[k] = { r: r, th: [] }; order.push(k); } g[k].th.push(r[5]); });
      return order.map(function (k) { return g[k]; }).sort(function (a, b) { return a.r[2] - b.r[2] || a.r[3] - b.r[3] || (a.r[0] < b.r[0] ? -1 : 1); });
    }
    function key(r, th) { return [r[0], r[1], r[2], r[3], th].join("|"); }
    function title(r) { return "Foro " + SHAPE[r[1]] + " " + (r[1] === "R" ? "Ø " : "") + fmt(r[2]) + " mm · passo " + fmt(r[3]) + " mm"; }
    function line(it) { return cfg.mats[it.r[0]] + ", foro " + SHAPE[it.r[1]] + " " + (it.r[1] === "R" ? "diametro " : "lato ") + fmt(it.r[2]) + " mm, passo " + fmt(it.r[3]) + " mm (" + TCODE[it.r[1]] + ", vuoto su pieno " + fmt(it.r[4]) + "%), spessore " + fmt(it.th) + " mm"; }
    function render() {
      var gs = groups(), n = gs.length, combos = gs.reduce(function (s, g) { return s + g.th.length; }, 0);
      el.count.textContent = n ? n + (n === 1 ? " foratura" : " forature") + " a magazzino · " + combos + (combos === 1 ? " combinazione con spessore" : " combinazioni con spessore") : "Nessuna combinazione a magazzino con questi filtri. Altre forature su richiesta.";
      el.list.innerHTML = "";
      gs.slice(0, shown).forEach(function (g) {
        var r = g.r, li = d.createElement("li"); li.className = "fin-row";
        li.innerHTML = pattern(r) + '<div><p class="fin-t"></p><p class="fin-s"></p><div class="fin-th"></div></div>';
        $(".fin-t", li).textContent = title(r);
        $(".fin-s", li).textContent = cfg.matsShort[r[0]] + " · vuoto su pieno " + fmt(r[4]) + "%";
        var box = $(".fin-th", li);
        g.th.sort(function (a, b) { return a - b; }).forEach(function (th) {
          var bt = d.createElement("button"); bt.type = "button"; bt.textContent = fmt(th) + " mm"; bt.setAttribute("aria-label", "Spessore " + fmt(th) + " millimetri: aggiungi alla richiesta");
          var k = key(r, th); bt.setAttribute("aria-pressed", picked.some(function (p) { return p.k === k; }) ? "true" : "false");
          bt.addEventListener("click", function () { toggle(r, th, k); bt.setAttribute("aria-pressed", picked.some(function (p) { return p.k === k; }) ? "true" : "false"); });
          box.appendChild(bt);
        });
        el.list.appendChild(li);
      });
      el.more.hidden = n <= shown;
      if (!el.more.hidden) el.more.textContent = "Mostra altri risultati (" + (n - shown) + ")";
    }
    function toggle(r, th, k) {
      var i = -1; picked.forEach(function (p, j) { if (p.k === k) i = j; });
      if (i > -1) picked.splice(i, 1); else picked.push({ k: k, r: r, th: th, qty: 0 });
      renderReq();
    }
    function renderReq() {
      el.items.innerHTML = "";
      picked.forEach(function (it) {
        var li = d.createElement("li"); li.className = "fin-item";
        li.innerHTML = '<div><strong></strong><small></small></div><div class="fin-qty"><label class="sr"></label><input type="number" inputmode="numeric" min="1" step="1"><button type="button" class="fin-x" aria-label="Rimuovi">&times;</button></div>';
        $("strong", li).textContent = title(it.r) + ", sp. " + fmt(it.th) + " mm";
        $("small", li).textContent = cfg.matsShort[it.r[0]] + " · 1000 × 2000 mm · fogli";
        var inp = $("input", li); inp.value = it.qty || ""; inp.placeholder = "N."; $("label", li).textContent = "Numero di fogli"; inp.setAttribute("aria-label", "Numero di fogli");
        inp.addEventListener("input", function () { var v = parseInt(inp.value, 10); it.qty = v > 0 ? v : 0; build(); });
        $(".fin-x", li).addEventListener("click", function () { toggle(it.r, it.th, it.k); render(); });
        el.items.appendChild(li);
      });
      el.jump.hidden = picked.length === 0; el.jump.textContent = picked.length + (picked.length === 1 ? " lamiera nella richiesta" : " lamiere nella richiesta") + " · vai alla richiesta"; el.empty.hidden = picked.length > 0; el.fields.hidden = picked.length === 0; el.copy.hidden = picked.length === 0;
      build();
    }
    function build() {
      var L = ["Buongiorno,", "", "vorrei un'offerta per le seguenti lamiere forate (formato lastra 1000 x 2000 mm, come da assortimento a magazzino):", ""];
      picked.forEach(function (it, i) { L.push((i + 1) + ") " + line(it) + ": " + (it.qty ? it.qty + (it.qty === 1 ? " foglio" : " fogli") : "quantità da indicare")); });
      L.push("", "Resto a disposizione per ogni chiarimento. Cordiali saluti,", (el.nm.value || ""), (el.co.value || ""), (el.tel.value ? "Tel. " + el.tel.value : ""), "", "(Richiesta preparata con lo strumento di ricerca dell'assortimento del sito)");
      text = L.join("\n");
      var on = picked.length > 0;
      el.send.setAttribute("aria-disabled", on ? "false" : "true"); el.send.textContent = on ? "Scriva a " + cfg.mail : "Scelga uno spessore";
      el.send.href = on ? "mailto:" + cfg.mail + "?subject=" + encodeURIComponent("Richiesta di offerta lamiere forate (" + picked.length + (picked.length === 1 ? " articolo" : " articoli") + ")") + "&body=" + encodeURIComponent(text) : "mailto:" + cfg.mail;
    }
    function refresh(skip) {
      opts(el.th, uniq(ROWS.filter(function (r) { return match(r, "th"); }).map(function (r) { return r[5]; })).sort(function (a, b) { return a - b; }), function (v) { return fmt(v) + " mm"; });
      opts(el.hole, uniq(ROWS.filter(function (r) { return match(r, "hole"); }).map(function (r) { return r[2]; })).sort(function (a, b) { return a - b; }), function (v) { return fmt(v) + " mm"; });
      shown = limit; render();
    }
    ["mat", "type", "th", "hole"].forEach(function (k) { el[k].addEventListener("change", function () { refresh(); }); });
    el.more.addEventListener("click", function () { shown += 14; render(); });
    [el.co, el.nm, el.tel].forEach(function (i) { i.addEventListener("input", build); });
    el.copy.addEventListener("click", function () { build(); var done = function () { el.copy.textContent = "Testo copiato"; setTimeout(function () { el.copy.textContent = "Copia il testo"; }, 2200); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { }); });
    var qs = safe(function () { return new URLSearchParams(location.search); });
    refresh();
    if (qs) { ["m:mat", "t:type", "s:th", "h:hole"].forEach(function (x) { var a = x.split(":"), v = qs.get(a[0]); if (v) { el[a[1]].value = v; refresh(); } }); }
    renderReq();
  }
})();
