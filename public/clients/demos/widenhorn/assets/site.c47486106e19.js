(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  root.classList.remove("no-js");

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

  /* mega menu */
  var mb = $("#mega-btn"), mega = $("#mega");
  function setMega(open) { if (!mb || !mega) return; mega.hidden = !open; mb.setAttribute("aria-expanded", open ? "true" : "false"); }
  if (mb) {
    mb.addEventListener("click", function (e) { e.stopPropagation(); setMega(mega.hidden); });
    d.addEventListener("click", function (e) { if (mega && !mega.hidden && !mega.contains(e.target) && e.target !== mb) setMega(false); });
  }
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); if (mega && !mega.hidden) { setMega(false); mb.focus(); } } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1080) setDrawer(false); else setMega(false); });

  /* dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("wh-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("wh-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(e) { e.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (e) { if (io) io.observe(e); else activate(e); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (e) { if (!e.classList.contains("is-in") && e.getBoundingClientRect().top < vh * 0.96) activate(e); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* timeline progress */
  $$("[data-tl]").forEach(function (tl) {
    var items = $$("li", tl);
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
      items.forEach(function (li) { if (reduce || li.getBoundingClientRect().top < vh * 0.82) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* list filter (JETCAM machines) */
  $$("[data-lf]").forEach(function (box) {
    var q = $("[data-lf-q]", box), lists = $$("[data-lf-list]", box), none = $("[data-lf-none]", box);
    if (!q) return;
    q.addEventListener("input", function () {
      var v = q.value.trim().toLowerCase(), shown = 0;
      lists.forEach(function (ul) { $$("li", ul).forEach(function (li) { var ok = !v || li.textContent.toLowerCase().indexOf(v) > -1; li.hidden = !ok; if (ok) shown++; }); });
      if (none) none.hidden = shown > 0 || !v;
    });
  });

  /* news filter */
  var nq = $("[data-nq]"), nl = $("[data-nlist]");
  if (nl) {
    var yr = "all";
    var apply = function () {
      var v = nq ? nq.value.trim().toLowerCase() : "", shown = 0;
      $$(".nyear", nl).forEach(function (sec) {
        var any = 0;
        $$(".nrow", sec).forEach(function (r) {
          var ok = (!v || (r.getAttribute("data-t") || "").indexOf(v) > -1) && (yr === "all" || sec.getAttribute("data-year") === yr);
          r.hidden = !ok; if (ok) any++;
        });
        sec.hidden = !any || (yr !== "all" && sec.getAttribute("data-year") !== yr); shown += any;
      });
      var none = $("[data-nnone]"); if (none) none.hidden = shown > 0;
    };
    if (nq) nq.addEventListener("input", apply);
    $$("[data-year]", d).forEach(function (b) {
      if (b.tagName !== "BUTTON") return;
      b.addEventListener("click", function () {
        yr = b.getAttribute("data-year");
        $$("button[data-year]").forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        apply();
      });
    });
  }

  /* request form -> mailto */
  var rq = $("[data-rq]");
  if (rq) {
    rq.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = {}; $$("[data-f]", rq).forEach(function (i) { f[i.getAttribute("data-f")] = i.value.trim(); });
      var ints = $$("[data-i]:checked", rq).map(function (i) { return i.value; });
      var body = "Beste Widenhorn,\n\n" + (ints.length ? "Ik wil graag: " + ints.join(", ") + "\n" : "") + (f.machine ? "Machine en merk: " + f.machine + "\n" : "") +
        (f.bericht ? "\n" + f.bericht + "\n" : "") + "\nMijn gegevens:\nNaam: " + (f.naam || "") + "\nBedrijf: " + (f.bedrijf || "") + "\nTelefoon: " + (f.tel || "") + "\nE-mail: " + (f.mail || "") + "\n";
      location.href = "mailto:" + rq.getAttribute("data-mail") + "?subject=" + encodeURIComponent(rq.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
    });
    var qs = new URLSearchParams(location.search);
    if (qs.get("machine")) { var mi = $('[data-f="machine"]', rq); if (mi) mi.value = qs.get("machine"); }
  }

  /* ------------------------------------------------ signature tool: does it fit my machine? */
  $$("[data-tool]").forEach(function (root_) {
    var data = JSON.parse($("[data-tool-data]", root_).textContent), UI = data.ui;
    var chipsEl = $("[data-types]", root_), input = $("[data-q]", root_), out = $("[data-out]", root_), sugEl = $("[data-sug]", root_), dl = $("#tool-brands", root_), resetBtn = $("[data-reset]", root_);
    var state = { type: "", q: "" };
    function norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
    function typeLabel(k) { var t = data.types.filter(function (x) { return x.key === k; })[0]; return t ? t.label : ""; }

    data.types.forEach(function (t) {
      var b = el("button", "tchip"); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("data-t", t.key);
      var ic = el("span", "tchip__ic"); var im = new Image(); im.src = t.icon_url; im.width = t.icon_w; im.height = t.icon_h; im.alt = ""; im.loading = "lazy"; ic.appendChild(im);
      var tx = el("span"); tx.appendChild(document.createTextNode(t.label)); var sm = el("small", "", t.hint); tx.appendChild(sm);
      b.appendChild(ic); b.appendChild(tx);
      b.addEventListener("click", function () { state.type = state.type === t.key ? "" : t.key; sync(true); });
      chipsEl.appendChild(b);
    });

    function brandsForType() {
      if (state.type && data.brands_by_type[state.type] && data.brands_by_type[state.type].length) return data.brands_by_type[state.type];
      var all = {}; Object.keys(data.brands_by_type).forEach(function (k) { data.brands_by_type[k].forEach(function (b) { all[b] = 1; }); });
      return Object.keys(all).sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });
    }
    function renderSug() {
      sugEl.textContent = ""; dl.textContent = "";
      var bs = brandsForType();
      bs.forEach(function (b) { var o = d.createElement("option"); o.value = b; dl.appendChild(o); });
      var pick = data.popular.filter(function (p) { return bs.indexOf(p) > -1; });
      if (!pick.length) pick = bs.slice(0, 8);
      pick.slice(0, 8).forEach(function (b) {
        var s = el("button", "sug", b); s.type = "button";
        s.addEventListener("click", function () { input.value = b; state.q = b; sync(true); input.focus({ preventScroll: true }); });
        sugEl.appendChild(s);
      });
    }

    function productsFor() {
      var list = data.products.filter(function (p) { return !state.type || p.types.indexOf(state.type) > -1; });
      var alw = data.always;
      if (!state.type || alw.types.indexOf(state.type) > -1) list = list.concat([{ key: alw.key, route: alw.route, url: alw.url, label: alw.label, kind: alw.kind, what: alw.what, types: alw.types, brands: [], free: alw.note || "Machine-onafhankelijk", always: true }]);
      return list;
    }
    function matchBrand(p, q) {
      if (!p.brands || !p.brands.length) return false;
      return p.brands.some(function (b) { var nb = norm(b); return nb.indexOf(q) > -1 || (q.length > 3 && q.indexOf(nb) > -1); });
    }
    function compute() {
      var q = norm(state.q), prods = productsFor(), res = [];
      prods.forEach(function (p) {
        var st;
        if (p.always) st = "free";
        else if (!p.brands.length && p.free) st = "free";
        else if (!q) st = "info";
        else st = matchBrand(p, q) ? "listed" : "ask";
        res.push({ p: p, st: st });
      });
      var order = { listed: 0, free: 1, info: 2, ask: 3 };
      res.sort(function (a, b) { return order[a.st] - order[b.st]; });
      return res;
    }
    function jetModels(q) {
      if (!q || q.length < 2) return [];
      return data.jet_models.filter(function (m) { return norm(m).indexOf(q) > -1; });
    }
    function tubesFor(q) {
      if (!q || q.length < 3) return [];
      var trumpf = /^(trumpf|trumatik|trulaser|truflow|trucoax|tlf)/.test(q) || q === "tru";
      return data.tubes.filter(function (r) { var s = norm(r.join(" ")); return trumpf ? true : s.indexOf(q) > -1; });
    }
    function mailtoFor(res) {
      var typ = state.type ? typeLabel(state.type).toLowerCase() : "machine";
      var brand = state.q.trim() || "(merk invullen)";
      var items = res.filter(function (r) { return r.st !== "ask" || true; }).map(function (r) { return "- " + r.p.label + (r.st === "listed" ? " (merk staat op de lijst)" : r.st === "ask" ? " (vraag het na)" : ""); }).join("\n");
      var body = UI.mail_hello + "\n\n" + UI.mail_body.replace("{type}", typ).replace("{brand}", brand).replace("{items}", items);
      var subj = UI.mail_subject.replace("{brand}", state.q.trim() || "machine").replace("{type}", typ);
      return "mailto:" + data.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    }
    function card(r, q) {
      var p = r.p, li = el("li", "rcard");
      var top = el("div", "rcard__top"); top.appendChild(el("span", "rcard__k mono", p.kind));
      if (r.st === "listed") top.appendChild(el("span", "pill pill--ok", UI.listed));
      else if (r.st === "free") top.appendChild(el("span", "pill pill--free", UI.free));
      else if (r.st === "ask") top.appendChild(el("span", "pill pill--ask", UI.ask));
      li.appendChild(top);
      li.appendChild(el("h3", "", p.label));
      li.appendChild(el("p", "", p.what));
      if (r.st === "free" && p.free) li.appendChild(el("p", "", p.free));
      if (r.st === "ask") li.appendChild(el("p", "", p.kind === "Software" ? UI.ask_note : UI.ask_note_parts));
      if (p.key === "jetcam") {
        var ms = jetModels(q);
        if (ms.length) {
          var dt = el("details"); dt.open = true; dt.appendChild(el("summary", "", UI.models + " (" + ms.length + ")"));
          var ul = el("ul", "mini"); ms.forEach(function (m) { ul.appendChild(el("li", "", m)); }); dt.appendChild(ul); li.appendChild(dt);
        }
      }
      var a = el("a", "tlink"); a.href = p.url; a.appendChild(document.createTextNode(data.compact ? "Meer over dit product" : "Naar de productpagina")); a.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
      li.appendChild(a);
      return li;
    }
    function render() {
      out.textContent = "";
      var q = norm(state.q);
      if (!state.type && q.length < 2) return;
      var res = compute();
      var sum = el("p", "res__sum");
      var typ = state.type ? typeLabel(state.type).toLowerCase() : "machine";
      sum.appendChild(document.createTextNode("Voor uw " + typ));
      if (state.q.trim()) { sum.appendChild(document.createTextNode(" van ")); var em = el("em", "", state.q.trim()); sum.appendChild(em); }
      var nl = res.filter(function (r) { return r.st === "listed"; }).length;
      var rest = res.length - nl;
      sum.appendChild(document.createTextNode(q.length >= 2 ? (nl ? ": " + nl + " op de merkenlijst" + (rest ? ", " + rest + " meer om te bekijken." : ".") : ": het merk staat niet op de lijsten, maar vragen kost niets.") : ": dit is het aanbod."));
      out.appendChild(sum);
      var ul = el("ul", "res__list");
      res.forEach(function (r) { ul.appendChild(card(r, q)); });
      out.appendChild(ul);
      var tb = (!state.type || state.type === "laser") ? tubesFor(q) : [];
      if (tb.length) {
        var box = el("div", "rcard"); box.style.marginTop = "10px";
        var tp = el("div", "rcard__top"); tp.appendChild(el("span", "rcard__k mono", "Onderdelen")); tp.appendChild(el("span", "pill pill--ok", UI.listed)); box.appendChild(tp);
        box.appendChild(el("h3", "", UI.tubes)); box.appendChild(el("p", "", UI.tube_note));
        var wrap = el("div", "tablewrap"); wrap.tabIndex = 0; wrap.setAttribute("role", "region"); wrap.setAttribute("aria-label", UI.tubes);
        var tbl = el("table", "tbl"), thead = el("thead"), trh = el("tr");
        UI.tube_cols.forEach(function (c) { trh.appendChild(el("th", "", c)); }); thead.appendChild(trh); tbl.appendChild(thead);
        var tbody = el("tbody"); tb.forEach(function (r) { var tr = el("tr"); r.forEach(function (c) { tr.appendChild(el("td", "", c)); }); tbody.appendChild(tr); });
        tbl.appendChild(tbody); wrap.appendChild(tbl); box.appendChild(wrap);
        var a2 = el("a", "tlink"); a2.href = data.tubes_url; a2.textContent = "Naar de pagina met power tubes"; box.appendChild(a2);
        out.appendChild(box);
      }
      var ask = el("div", "res__ask");
      ask.appendChild(el("p", "", q.length >= 2 ? "Klopt dit met uw machine? Stuur de vraag met uw merk erin naar Widenhorn." : "Weet u al welk merk u heeft? Typ het hierboven."));
      var row = el("div", "btn-row");
      var m = el("a", "btn"); m.href = mailtoFor(res); m.textContent = UI.send; row.appendChild(m);
      var t = el("a", "btn btn--ghost"); t.href = data.tel_href; t.textContent = UI.call; row.appendChild(t);
      ask.appendChild(row); out.appendChild(ask);
    }
    function sync(push) {
      $$(".tchip", chipsEl).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-t") === state.type ? "true" : "false"); });
      root_.classList.toggle("has-q", !!input.value);
      renderSug(); render();
      if (push && history.replaceState) {
        var u = new URLSearchParams(); if (state.type) u.set("type", state.type); if (state.q.trim()) u.set("merk", state.q.trim());
        var s = u.toString(); safe(function () { history.replaceState(null, "", location.pathname + (s ? "?" + s : "")); });
      }
    }
    input.addEventListener("input", function () { state.q = input.value; sync(true); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
    resetBtn.addEventListener("click", function () { state.type = ""; state.q = ""; input.value = ""; sync(true); input.focus({ preventScroll: true }); });
    var qs = new URLSearchParams(location.search);
    if (!data.compact || qs.get("merk") || qs.get("type")) {
      var t0 = qs.get("type"), m0 = qs.get("merk");
      if (t0 && data.types.some(function (x) { return x.key === t0; })) state.type = t0;
      if (m0) { state.q = m0.slice(0, 40); input.value = state.q; }
    }
    sync(false);
  });
})();
