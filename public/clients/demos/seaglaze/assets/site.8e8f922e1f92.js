(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* header solid on scroll */
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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sg-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sg-dock", "1"); }); });

  /* reveals (also reveals anything already scrolled past) */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
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
      items.forEach(function (li) { if (reduce || li.getBoundingClientRect().top < vh * 0.8) li.classList.add("is-in"); });
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* open / closed now, from the real opening hours (Europe/London) */
  $$("[data-status]").forEach(function (el) {
    var cfg = safe(function () { return JSON.parse(el.getAttribute("data-hours")); });
    var txt = $("[data-status-text]", el);
    if (!cfg || !txt || !window.Intl) return;
    function mins(s) { var a = s.split(":"); return (+a[0]) * 60 + (+a[1]); }
    function fmt(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return h + (mm ? ":" + (mm < 10 ? "0" : "") + mm : "") + ap; }
    function tick() {
      var parts = safe(function () { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); });
      if (!parts) return;
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var dow = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[o.weekday];
      var now = (+o.hour % 24) * 60 + (+o.minute), op = mins(cfg.open), cl = mins(cfg.close);
      var workday = cfg.days.indexOf(dow) > -1;
      if (workday && now >= op && now < cl) { el.classList.add("is-open"); txt.textContent = "Open now, until " + fmt(cl); return; }
      el.classList.remove("is-open");
      var next;
      if (workday && now < op) next = "today at " + fmt(op);
      else { var n = 1; while (cfg.days.indexOf((dow + n) % 7) < 0 && n < 7) n++; next = n === 1 ? "tomorrow at " + fmt(op) : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][(dow + n) % 7] + " at " + fmt(op); }
      txt.textContent = "Closed now, opens " + next;
    }
    tick(); setInterval(tick, 60000);
  });

  /* shared: clipboard + mailto helpers */
  function copyText(text, btn) {
    function done() { if (!btn) return; var old = btn.getAttribute("data-label") || btn.textContent; btn.setAttribute("data-label", old); btn.textContent = btn.getAttribute("data-done") || "Copied"; setTimeout(function () { btn.textContent = old; }, 2200); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { var t = d.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; d.body.appendChild(t); t.select(); safe(function () { d.execCommand("copy"); }); t.remove(); done(); }
  }
  function mailHref(to, subject, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.replace(/\n/g, "\r\n")); }

  /* contact form -> pre-filled email */
  var form = $("[data-form]");
  if (form) (function () {
    var cfg = JSON.parse($("#form-data").textContent), L = cfg.labels;
    var send = $("[data-send]", form), cp = $("[data-copy]", form);
    function v(id) { var e = $("#" + id, form); return e ? e.value.trim() : ""; }
    function body() {
      var lines = ["Hello Seaglaze,", "", v("c-message") || "(your message)", "",
        L.interest + ": " + v("c-interest"), L.callback + ": " + v("c-callback"), "",
        L.name + ": " + v("c-name"), L.phone + ": " + v("c-phone"), L.email + ": " + v("c-email")];
      return lines.join("\n");
    }
    function upd() { send.setAttribute("href", mailHref(cfg.to, cfg.subject + (v("c-interest") ? ": " + v("c-interest") : ""), body())); }
    form.addEventListener("input", upd); form.addEventListener("change", upd); upd();
    if (cp) cp.addEventListener("click", function () { copyText(body(), cp); });
  })();

  /* ------------------------------------------------ the enquiry helper: which Seaglaze for my boat? */
  $$("[data-finder]").forEach(function (fEl) {
    var data = JSON.parse($("#finder-data", fEl).textContent), P = data.products, ui = data.ui;
    var st = { kind: "", area: "", fit: "", tog: false };
    var sumEl = $("[data-sum]", fEl), resEl = $("[data-results]", fEl), alsoEl = $("[data-also]", fEl), alsoList = $("[data-also-list]", fEl);
    var goEl = $("[data-go]", fEl); var enq = $("[data-enq]", fEl), send = $("[data-send]", enq), cp = $("[data-copy]", enq);
    var waitEl = $("[data-wait]", fEl);
    var picked = [];

    function el(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function score(p) {
      var s = 0;
      if (st.area) { if (!p.areas.length) s += 1; else if (p.areas.indexOf(st.area) > -1) s += 3; else s -= 3; }
      if (st.fit && st.fit !== "any") { if (p.fix === st.fit) s += 5; else s -= 4; }
      if (st.tog) { var tg = data.toggles[st.kind]; if (tg && p.traits.indexOf(tg[0]) > -1) s += 4; }
      return s;
    }
    function card(p, best) {
      var c = el("article", "res" + (best ? " is-best" : ""));
      var im = el("div", "res__img" + (p.thumb && p.thumb.line ? " res__img--line" : ""));
      if (p.thumb) { var i = d.createElement("img"); i.src = p.thumb.src; i.width = p.thumb.w; i.height = p.thumb.h; i.alt = p.thumb.alt; i.loading = "lazy"; i.decoding = "async"; im.appendChild(i); }
      var b = el("div", "res__b"), t = el("div", "res__t");
      var a = el("a", "", p.name); a.href = p.url; t.appendChild(a);
      t.appendChild(el("span", "res__chip mono", p.chip));
      if (best) t.appendChild(el("span", "res__badge", ui.best));
      b.appendChild(t); b.appendChild(el("p", "res__why", p.why));
      b.appendChild(el("p", "res__suits", "Suits: " + p.suits));
      c.appendChild(im); c.appendChild(b); return c;
    }
    function render() {
      resEl.textContent = ""; alsoList.textContent = ""; alsoEl.hidden = true; picked = [];
      $$("[data-q3]", fEl).forEach(function (g) { g.hidden = g.getAttribute("data-q3") !== st.kind; });
      var q3box = $(".step--q3", fEl); if (q3box) q3box.hidden = !st.kind; enq.hidden = !st.kind;
      if (goEl) goEl.hidden = true;
      if (!st.kind) { sumEl.textContent = ui.summary_empty; update(); return; }
      var list = P.filter(function (p) { return p.cat === st.kind; }).map(function (p, i) { return { p: p, s: score(p), i: i }; });
      list.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
      var top = list[0].s, strong = list.filter(function (x) { return x.s >= top - 4; }).slice(0, 3);
      var rest = list.filter(function (x) { return strong.indexOf(x) < 0; });
      var bits = [data.kinds[st.kind].toLowerCase()];
      if (st.area) bits.push(data.areas[st.area].toLowerCase());
      var fitLabel = st.fit && st.fit !== "any" ? data.opts[st.kind][st.fit] : "";
      if (fitLabel) bits.push(fitLabel.toLowerCase());
      sumEl.textContent = "";
      var strongOk = top > -3;
      sumEl.appendChild(d.createTextNode(strongOk ? "For " : ""));
      if (strongOk) { var bb = el("b", "", bits.join(" \u00b7 ")); sumEl.appendChild(bb); sumEl.appendChild(d.createTextNode(": " + strong.length + (strong.length === 1 ? " match" : " matches") + ".")); }
      else sumEl.appendChild(d.createTextNode(ui.none));
      if (strongOk) strong.forEach(function (x, i) { resEl.appendChild(card(x.p, i === 0)); picked.push(x.p); });
      if (goEl) goEl.hidden = false;
      var alsoItems = (strongOk ? rest : list).filter(function (x) { return x.s > -4; }).slice(0, 8);
      if (alsoItems.length) { alsoItems.forEach(function (x) { alsoList.appendChild(card(x.p, false)); }); alsoEl.hidden = false; }
      update();
    }
    function val(id) { var e = $("#" + id, enq); return e ? e.value.trim() : ""; }
    function radio(name) { var r = $('input[name="' + name + '"]:checked', fEl); return r ? r.value : ""; }
    function body() {
      var L = ["Hello Seaglaze,", "", "I would like to enquire about: " + (st.kind ? data.kinds[st.kind] : "(not chosen)")];
      if (st.area) L.push("Where the boat works: " + data.areas[st.area]);
      if (st.fit && st.fit !== "any") L.push("How it should fit: " + data.opts[st.kind][st.fit]);
      if (st.tog && data.toggles[st.kind]) L.push("Also: " + data.toggles[st.kind][1]);
      if (picked.length) L.push("Products that look right: " + picked.map(function (p) { return p.name + " (" + p.chip + ")"; }).join("; "));
      var w = val("f-w"), h = val("f-h");
      if (w || h) L.push("Opening size (approx.): " + (w || "?") + " x " + (h || "?") + " mm");
      var q = radio("qty"); if (q) L.push("How many: " + data.qty[q]);
      var t = radio("tpl"); if (t) L.push("Template or old unit: " + data.tpl[t]);
      L.push("", "Name: " + val("f-name"), "Phone: " + val("f-phone"), "Email: " + val("f-email"));
      return L.join("\n");
    }
    function update() {
      var subj = ui.subject + (st.kind ? data.kinds[st.kind] : "");
      send.setAttribute("href", mailHref(data.to, subj, body()));
    }
    fEl.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "kind") { st.kind = t.value; st.fit = ""; st.tog = false; $$('input[name^="fit-"]', fEl).forEach(function (r) { r.checked = false; }); $$("[data-toggle]", fEl).forEach(function (c) { c.checked = false; }); }
      else if (t.name === "area") st.area = t.value;
      else if (t.name && t.name.indexOf("fit-") === 0) st.fit = t.value;
      else if (t.hasAttribute && t.hasAttribute("data-toggle")) st.tog = t.checked;
      else { update(); return; }
      render();
    });
    enq.addEventListener("input", update);
    if (cp) cp.addEventListener("click", function () { copyText(body(), cp); });
    /* ?kind=windows from the category pages */
    var m = /[?&]kind=(windows|doors|hatches)/.exec(location.search);
    if (m && !$("[data-find-skip]", fEl)) { var r0 = $('input[name="kind"][value="' + m[1] + '"]', fEl); if (r0) { r0.checked = true; st.kind = m[1]; } }
    render();
  });
})();
