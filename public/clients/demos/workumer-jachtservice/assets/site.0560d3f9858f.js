(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header turns solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1060) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("wjs-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("wjs-dock", "1"); }); });

  /* reveals (sweep also reveals anything already scrolled past) */
  var rvs = $$(".reveal");
  rvs.forEach(function (el) {
    var sib = el.parentElement ? $$(".reveal", el.parentElement).filter(function (x) { return x.parentElement === el.parentElement; }) : [];
    var i = sib.indexOf(el); if (i > 0 && !reduce) el.style.transitionDelay = Math.min(i, 5) * 60 + "ms";
  });
  function activate(el) { el.classList.add("is-in"); startCounters(el); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* counters land on the exact figures from the price list / facility list */
  var counted = {};
  function startCounters(scope) {
    var els = scope.matches && scope.matches("[data-count]") ? [scope] : $$("[data-count]", scope);
    if (!els.length && scope.closest) { var p = scope.closest(".prices,.stats"); if (p) els = $$("[data-count]", p); }
    els.forEach(function (c) { runCounter(c); });
  }
  function runCounter(c) {
    if (c.__done) return; c.__done = true;
    var target = parseFloat(c.getAttribute("data-count")), dec = +(c.getAttribute("data-dec") || 0), txt = c.textContent;
    if (reduce || !isFinite(target)) return;
    var pre = txt.slice(0, txt.search(/\d/)), lang = root.lang === "nl" ? "nl-NL" : "en-GB", t0 = null;
    function f(v) { return pre + new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v); }
    c.textContent = f(0);
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1400), eased = 1 - Math.pow(1 - p, 3);
      c.textContent = p < 1 ? f(target * eased) : txt; /* final text is exactly the original */
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  $$("[data-count]").forEach(function (c) { if (io && !c.closest(".reveal")) io.observe(c.parentElement); });

  /* register scroller buttons */
  $$("[data-scroll]").forEach(function (b) {
    b.addEventListener("click", function () {
      var row = $(".reg__row", b.closest(".reg")); if (!row) return;
      row.scrollBy({ left: Number(b.getAttribute("data-scroll")) * row.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* sort the new-build list */
  var sortBar = $("[data-sort]");
  if (sortBar) {
    var list = $("[data-projs]");
    $$("button", sortBar).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", sortBar).forEach(function (x) { x.classList.toggle("is-on", x === b); });
        var by = b.getAttribute("data-by"), items = $$("[data-i]", list);
        items.sort(function (a, c) {
          if (by === "len") return parseFloat(a.dataset.len) - parseFloat(c.dataset.len);
          if (by === "year") return parseFloat(a.dataset.year) - parseFloat(c.dataset.year) || parseFloat(a.dataset.len) - parseFloat(c.dataset.len);
          return parseFloat(a.dataset.i) - parseFloat(c.dataset.i);
        });
        items.forEach(function (it) { list.appendChild(it); });
      });
    });
  }

  /* build process: the stage image follows the step in view (desktop), stacked on phones */
  var proc = $("[data-proc]");
  if (proc && "IntersectionObserver" in window) {
    var its = $$(".proc__it", proc), frs = $$(".proc__fr", proc), pc = $("[data-pc]", proc);
    var po = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = +en.target.getAttribute("data-step");
        its.forEach(function (x) { x.classList.toggle("is-active", x === en.target); });
        frs.forEach(function (f) { f.classList.toggle("is-on", +f.getAttribute("data-fr") === i); });
        if (pc) pc.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
      });
    }, { rootMargin: "-42% 0px -48% 0px" });
    its.forEach(function (x) { po.observe(x); });
    if (its[0]) its[0].classList.add("is-active");
  }

  /* ------------------------------------------------ THE GUIDE: which ship, which service */
  var wz = $("[data-wz]");
  if (wz) (function () {
    var D = JSON.parse($("[data-wzdata]", wz).textContent), U = D.ui, P = D.prices, nl = D.lang === "nl";
    var loc = nl ? "nl-NL" : "en-GB";
    var start = $("[data-start]", wz), main = $("[data-main]", wz), ctl = $("[data-ctl]", wz), out = $("[data-out]", wz), back = $("[data-back]", wz);
    var st = { path: null, type: "aak", len: 15, scopes: {}, svc: {}, wl: 12, ww: 4, where: "hall", mast: false, mastlen: 15, mstore: false, picks: {} };
    function fmt(n, dec) { return new Intl.NumberFormat(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n); }
    function money(n) { return fmt(n, 2); }
    function h(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
    function sub(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
    function mail(subject, body) { return "mailto:" + D.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }
    function picksList() { var a = []; for (var k in st.picks) if (st.picks[k]) a.push(k); return a; }
    function checked(map, prefix) { var a = []; for (var k in map) if (map[k]) a.push(k); return a; }
    var M = U.mail;
    function bodyWrap(core) { return M.greet + "\n\n" + core + "\n\n" + M.name + "\n\n" + M.thanks; }

    function sendBlock(href) {
      var s = h("div", "send"), a = h("a", "btn", U.send); a.href = href; a.innerHTML += ""; s.appendChild(a);
      s.appendChild(h("p", null, U.send_hint));
      var p = h("p"); p.appendChild(d.createTextNode(U.or_call + " ")); var t = h("a", "link", D.tel); t.href = D.telHref; p.appendChild(t); s.appendChild(p);
      return s;
    }
    function link(href, text, ext) { var a = h("a", "link", text); a.href = href; if (ext) { a.target = "_blank"; a.rel = "noopener"; } return a; }

    /* ---- shared card list (ships) */
    function lenText(l) { return fmt(l, 2) + " m"; }
    function card(it, key, meta, sub1) {
      var li = h("li", "rc" + (st.picks[key] ? " is-sel" : ""));
      var fig = h("div", "rc__img");
      if (it.img) { var im = d.createElement("img"); im.src = it.img; im.width = it.w; im.height = it.h; im.alt = it.n; im.loading = "lazy"; im.decoding = "async"; fig.appendChild(im); }
      li.appendChild(fig);
      var b = h("div", "rc__b"); b.appendChild(h("b", null, it.n));
      if (meta) b.appendChild(h("span", "rc__m", meta));
      if (sub1) b.appendChild(h("span", null, sub1));
      li.appendChild(b);
      var btn = h("button", "rc__pick", st.picks[key] ? "✓ " + U.pick_on : U.pick); btn.type = "button"; btn.setAttribute("aria-pressed", st.picks[key] ? "true" : "false");
      btn.addEventListener("click", function () {
        st.picks[key] = !st.picks[key];
        btn.setAttribute("aria-pressed", st.picks[key] ? "true" : "false"); btn.textContent = st.picks[key] ? "✓ " + U.pick_on : U.pick; li.classList.toggle("is-sel", st.picks[key]);
        refreshSend();
      });
      li.appendChild(btn);
      return li;
    }
    var sendHost = null, sendFn = null;
    function refreshSend() { if (!sendHost || !sendFn) return; var a = $("a.btn", sendHost); if (a) a.href = sendFn(); }
    function putSend(fn) { sendFn = fn; sendHost = sendBlock(fn()); out.appendChild(sendHost); }

    /* ---- path: new ship */
    function ctlNieuw() {
      var f = h("fieldset"); f.appendChild(h("legend", null, U.type_q)); var o = h("div", "opt");
      D.types.forEach(function (t) {
        var l = h("label"), i = h("input"); i.type = "radio"; i.name = "wztype"; i.value = t[0]; i.checked = st.type === t[0];
        i.addEventListener("change", function () { st.type = t[0]; renderOut(); });
        l.appendChild(i); l.appendChild(h("span", null, t[1])); l.appendChild(h("small", null, t[2])); o.appendChild(l);
      });
      f.appendChild(o); ctl.appendChild(f);
      var g = h("fieldset"), lg = h("legend", null, U.len_q); g.appendChild(lg);
      var r = h("div", "rng"), v = h("div", "rng__v"), sp = h("span", null, fmt(st.len, 1)); v.appendChild(sp); v.appendChild(h("small", null, " m"));
      var inp = h("input"); inp.type = "range"; inp.min = 12; inp.max = 24; inp.step = 0.5; inp.value = st.len; inp.setAttribute("aria-label", U.len_q);
      inp.addEventListener("input", function () { st.len = parseFloat(inp.value); sp.textContent = fmt(st.len, 1); renderOut(); });
      r.appendChild(v); r.appendChild(inp); g.appendChild(r); ctl.appendChild(g);
    }
    function sortBy(arr, fn) { return arr.slice().sort(function (a, b) { return fn(a) - fn(b); }); }
    function outNieuw() {
      var l = st.len, t = st.type, tName = (D.types.filter(function (x) { return x[0] === t; })[0] || [])[1];
      var shown = [];
      out.appendChild(h("h3", "wz__h", tName));
      if (t === "aak" || t === "weet") {
        if (t === "aak") out.appendChild(h("p", "wz__note", U.aak_text));
        var near = sortBy(D.nieuw, function (x) { return Math.abs(x.l - l); });
        var within = near.filter(function (x) { return Math.abs(x.l - l) <= 1.5; }).slice(0, 4);
        var list = within.length ? within : near.slice(0, 2);
        out.appendChild(h("p", "wz__note", sub(U.range_aak, { a: lenText(D.aakMin).replace(" m", ""), b: lenText(D.aakMax).replace(" m", "") })));
        if (l > D.aakMax + 0.5 || l < D.aakMin - 0.5) out.appendChild(h("p", "wz__note", sub(U.outside_aak, { l: fmt(l, 1) })));
        if (t === "aak") {
          out.appendChild(h("h4", "wz__h", sub(within.length ? U.near : U.near_far, { l: fmt(l, 1) })));
          var g = h("ul", "rgrid"); list.forEach(function (x) { g.appendChild(card(x, x.n, lenText(x.l), (x.y ? sub(U.year, { y: x.y }) : x.tag) + " · " + x.d)); }); out.appendChild(g);
          out.appendChild(link(D.urls.lem, U.lem_list));
        }
      }
      if (t === "alu" || t === "weet") {
        if (t === "weet") out.appendChild(h("h4", "wz__h", "Sichterman"));
        out.appendChild(h("p", "wz__note", t === "alu" ? U.alu_text : U.range_alu));
        if (t === "alu" && (l < 15 || l > 24)) out.appendChild(h("p", "wz__note", sub(U.outside_alu, { l: fmt(l, 1) })));
        if (t === "alu") {
          var sich = D.custom.filter(function (x) { return x.k === "sichterman"; }).sort(function (a, b) { return (b.y || 9999) - (a.y || 9999); });
          var g2 = h("ul", "rgrid"); sich.forEach(function (x) { g2.appendChild(card(x, x.n, x.y ? sub(U.year, { y: x.y }) : x.tag, x.d)); }); out.appendChild(g2);
        }
        out.appendChild(link(D.urls.sich, U.see_page));
      }
      if (t === "custom" || t === "weet") {
        if (t === "weet") out.appendChild(h("h4", "wz__h", D.types[2][1]));
        out.appendChild(h("p", "wz__note", U.custom_text));
        if (t === "custom") {
          var cu = D.custom.filter(function (x) { return x.k !== "sichterman"; });
          cu = cu.sort(function (a, b) { return (a.l ? Math.abs(a.l - l) : 99) - (b.l ? Math.abs(b.l - l) : 99); });
          var g3 = h("ul", "rgrid"); cu.forEach(function (x) { g3.appendChild(card(x, x.n, x.l ? lenText(x.l) : (x.tag || ""), [x.e && "", x.d].filter(Boolean).join(" · "))); }); out.appendChild(g3);
        }
        out.appendChild(link(D.urls.custom, U.see_page));
      }
      putSend(function () {
        var names = picksList(), core = sub(M.nieuw, { t: tName, l: fmt(l, 1), n: names.length ? names.join(", ") : "-" });
        return mail(sub(M.subject_nieuw, { t: tName, l: fmt(l, 1) }), bodyWrap(core));
      });
    }

    /* ---- path: refit */
    function checkboxGroup(title, items, map) {
      var f = h("fieldset"); f.appendChild(h("legend", null, title)); var o = h("div", "opt opt--chk");
      items.forEach(function (name) {
        var l = h("label"), i = h("input"); i.type = "checkbox"; i.checked = !!map[name];
        i.addEventListener("change", function () { map[name] = i.checked; refreshSend(); });
        l.appendChild(i); l.appendChild(h("span", null, name)); o.appendChild(l);
      });
      f.appendChild(o); return f;
    }
    function ctlRefit() { ctl.appendChild(checkboxGroup(U.scope_q, D.scopes, st.scopes)); }
    function outRefit() {
      out.appendChild(h("h3", "wz__h", U.refit_list)); out.appendChild(h("p", "wz__note", U.refit_text));
      var g = h("ul", "rgrid"); D.refit.forEach(function (x) { g.appendChild(card(x, x.n, sub(U.year, { y: x.y }), "")); }); out.appendChild(g);
      out.appendChild(link(D.urls.refit, U.see_page));
      putSend(function () {
        var s = checked(st.scopes).concat(picksList().map(function (n) { return n; }));
        var sc = checked(st.scopes), pk = picksList();
        var core = sub(M.refit, { s: sc.length ? sc.join(", ") : M.none }) + (pk.length ? "\n" + pk.join(", ") : "");
        return mail(M.subject_refit, bodyWrap(core));
      });
    }

    /* ---- path: service */
    function ctlService() {
      ctl.appendChild(checkboxGroup(D.svcH[0], D.svc, st.svc));
      ctl.appendChild(checkboxGroup(D.svcH[1], D.mnt, st.svc));
    }
    function outService() {
      out.appendChild(h("h3", "wz__h", U.svc_q)); out.appendChild(h("p", "wz__note", U.svc_text));
      var p = h("p"); p.appendChild(link(D.urls.service, U.see_page)); p.appendChild(link(D.urls.pdfGeneral, U.svc_pdf, true)); out.appendChild(p);
      putSend(function () { var s = checked(st.svc); return mail(M.subject_service, bodyWrap(sub(M.service, { s: s.length ? "\n- " + s.join("\n- ") : M.none }))); });
    }

    /* ---- path: winter storage */
    function numField(label, key, min, max, step) {
      var f = h("div", "fld"), id = "wz-" + key; var l = h("label", null, label); l.setAttribute("for", id); f.appendChild(l);
      var i = h("input"); i.type = "number"; i.id = id; i.min = min; i.max = max; i.step = step; i.inputMode = "decimal"; i.value = st[key];
      i.addEventListener("input", function () { var v = parseFloat(String(i.value).replace(",", ".")); if (isFinite(v)) { st[key] = v; renderCalc(); } });
      f.appendChild(i); return f;
    }
    var calcHost = null;
    function ctlWinter() {
      var g = h("fieldset"); g.appendChild(h("legend", null, U.w_q)); var n2 = h("div", "num2");
      n2.appendChild(numField(U.w_len + " (m)", "wl", 3, 40, 0.5)); n2.appendChild(numField(U.w_wid + " (m)", "ww", 1, 12, 0.1)); g.appendChild(n2); ctl.appendChild(g);
      var w = h("fieldset"); w.appendChild(h("legend", null, U.w_where)); var o = h("div", "opt");
      D.wopts.forEach(function (x) {
        var l = h("label"), i = h("input"); i.type = "radio"; i.name = "wzwhere"; i.value = x[0]; i.checked = st.where === x[0];
        i.addEventListener("change", function () { st.where = x[0]; renderCalc(); }); l.appendChild(i); l.appendChild(h("span", null, x[1])); o.appendChild(l);
      });
      w.appendChild(o); ctl.appendChild(w);
      var m = h("fieldset"); var o2 = h("div", "opt opt--chk");
      [["mast", U.w_mast], ["mstore", U.w_store]].forEach(function (x) {
        var l = h("label"), i = h("input"); i.type = "checkbox"; i.checked = !!st[x[0]];
        i.addEventListener("change", function () { st[x[0]] = i.checked; mlenF.hidden = !(st.mast || st.mstore); renderCalc(); }); l.appendChild(i); l.appendChild(h("span", null, x[1])); o2.appendChild(l);
      });
      m.appendChild(o2); var mlenF = numField(U.w_mastlen + " (m)", "mastlen", 3, 40, 0.5); mlenF.hidden = !(st.mast || st.mstore); mlenF.style.marginTop = "12px"; m.appendChild(mlenF); ctl.appendChild(m);
    }
    function outWinter() { calcHost = h("div"); out.appendChild(calcHost); renderCalc(); }
    function renderCalc() {
      if (!calcHost) return; clear(calcHost);
      var l = st.wl, w = st.ww, where = st.where;
      calcHost.appendChild(h("h3", "wz__h", sub(U.w_result, { s: P.season })));
      if (where === "boothuis") { calcHost.appendChild(h("p", "wz__note", U.w_boothuis)); }
      var okIn = l >= 3 && l <= 40 && w >= 1 && w <= 12;
      var lines = [], total = 0, rate = P[where];
      if (okIn && where !== "boothuis") {
        var area = l * w, stal = area * rate; total += stal;
        lines.push([U.w_lines.stal, sub(U.w_area, { a: fmt(area, 1), p: money(rate) }) + " (" + fmt(l, 1) + " × " + fmt(w, 1) + " m)", stal]);
        if (st.mast) { var cr = st.mastlen > 16 ? P.crane_long : P.crane_short; lines.push([sub(U.w_lines.crane, { n: 2 }), "€ " + money(cr) + " × 2", cr * 2]); total += cr * 2; }
        if (st.mstore) { var ms = st.mastlen * P.mast_store_per_m; lines.push([sub(U.w_lines.store, { m: fmt(st.mastlen, 1) }), "€ " + money(P.mast_store_per_m) + " / m", ms]); total += ms; }
        if (where === "hall" || where === "land") { var ev = l * P.env_per_m; lines.push([sub(U.w_lines.env, { l: fmt(l, 1) }), "€ " + money(P.env_per_m) + " / m", ev]); total += ev; }
        var ul = h("ul", "calc");
        lines.forEach(function (x) { var li = h("li"), a = h("span", null, x[0]); a.appendChild(h("small", null, x[1])); li.appendChild(a); li.appendChild(h("span", null, "€ " + money(x[2]))); ul.appendChild(li); });
        calcHost.appendChild(ul);
        var t = h("div", "calc__total"); t.appendChild(h("span", null, U.w_total)); t.appendChild(h("b", null, "€ " + money(total))); calcHost.appendChild(t);
      }
      calcHost.appendChild(h("p", "wz__note", U.w_disc));
      var p = h("p"); p.appendChild(link(D.urls.process, U.w_process)); p.appendChild(link(D.urls.pdfWinter, sub(U.w_pdf, { s: P.season }), true)); p.appendChild(link(D.urls.pdfForm, U.w_form, true)); calcHost.appendChild(p);
      var wlabel = (D.wopts.filter(function (x) { return x[0] === where; })[0] || [])[1];
      var extra = (st.mast ? (nl ? "Mast strijken en plaatsen door u: ja (mast " : "Mast unstepped and stepped by you: yes (mast ") + fmt(st.mastlen, 1) + " m)\n" : "") + (st.mstore ? (nl ? "Mast in de mastenberging: ja\n" : "Mast in mast storage: yes\n") : "");
      var href = mail(sub(M.subject_winter, { s: P.season }), bodyWrap(sub(M.winter, { l: fmt(l, 1), w: fmt(w, 1), p: wlabel, x: extra, s: P.season, t: where === "boothuis" || !okIn ? "-" : money(total) })));
      var s = sendBlock(href); s.setAttribute("data-wsend", ""); calcHost.appendChild(s);
    }

    /* ---- plumbing */
    var CTL = { nieuw: ctlNieuw, refit: ctlRefit, service: ctlService, winter: ctlWinter };
    var OUT = { nieuw: outNieuw, refit: outRefit, service: outService, winter: outWinter };
    function renderOut() { clear(out); sendHost = null; sendFn = null; calcHost = null; OUT[st.path](); }
    function show(path) {
      if (!CTL[path]) return;
      st.path = path; start.hidden = true; main.hidden = false; clear(ctl); CTL[path](); renderOut();
      try { history.replaceState(null, "", location.pathname + location.search.replace(/[?&]doel=[^&]*/, "").replace(/^&/, "?") + "#" + path); } catch (e) { }
    }
    function home() {
      st.path = null; start.hidden = false; main.hidden = true;
      try { history.replaceState(null, "", location.pathname); } catch (e) { }
    }
    $$("[data-path]", wz).forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-path")); }); });
    back.addEventListener("click", home);
    var q = new URLSearchParams(location.search).get("doel") || (location.hash || "").replace("#", "");
    var def = wz.getAttribute("data-default");
    if (q && CTL[q]) show(q); else if (def && CTL[def]) show(def);
  })();
})();
