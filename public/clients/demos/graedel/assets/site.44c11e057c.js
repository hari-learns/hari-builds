(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(t, o) { return t.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }

  /* ------------------------------------------------ drawer */
  var drawer = $("#drawer"), burger = $("#burger"), burgerX = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    root.style.overflow = open ? "hidden" : "";
    if (open && burgerX) burgerX.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (burgerX) burgerX.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* ------------------------------------------------ concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("gae-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("gae-dock", "1"); }); });

  /* ------------------------------------------------ reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* ------------------------------------------------ count-up on the facts (final value is already in the markup) */
  $$("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce || isNaN(target) || !("IntersectionObserver" in window)) return;
    var done = false;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || done) return; done = true; o.disconnect();
        var t0 = performance.now(), dur = 1200;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * e));
          if (p < 1) requestAnimationFrame(tick); else el.textContent = String(target);
        })(t0);
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ------------------------------------------------ process line follows scroll */
  $$("[data-steps]").forEach(function (ol) {
    function upd() {
      var r = ol.getBoundingClientRect(), vh = window.innerHeight, wide = window.innerWidth >= 900;
      var p = wide ? Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.5))) : Math.max(0, Math.min(1, (vh * 0.75 - r.top) / Math.max(1, r.height)));
      ol.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* ------------------------------------------------ open now (Europe/Zurich) */
  $$("[data-open]").forEach(function (el) {
    var slots = [[450, 720], [780, 1020]], names = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    function hm(m) { return String(Math.floor(m / 60)).padStart(2, "0") + "." + String(m % 60).padStart(2, "0") + "h"; }
    var parts = safe(function () {
      var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {}; f.forEach(function (p) { o[p.type] = p.value; }); return o;
    });
    if (!parts) return;
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday], mins = parseInt(parts.hour, 10) % 24 * 60 + parseInt(parts.minute, 10);
    var open = null, next = null;
    if (wd >= 1 && wd <= 5) {
      slots.forEach(function (s) { if (mins >= s[0] && mins < s[1]) open = s; });
      if (!open) slots.forEach(function (s) { if (!next && mins < s[0]) next = { day: wd, m: s[0] }; });
    }
    if (!open && !next) { var dd = wd; for (var i = 1; i <= 7 && !next; i++) { dd = (wd + i) % 7; if (dd >= 1 && dd <= 5) next = { day: dd, m: slots[0][0], later: i }; } }
    if (open) el.innerHTML = "<b>Büro jetzt geöffnet</b> bis " + hm(open[1]);
    else { el.classList.add("is-closed"); el.innerHTML = "<b>Büro jetzt geschlossen</b>, öffnet " + (next.later ? (next.later === 1 ? "morgen" : names[next.day]) : "heute") + " um " + hm(next.m); }
  });

  /* ------------------------------------------------ map on tap */
  $$("[data-map]").forEach(function (box) {
    var btn = $("[data-map-btn]", box);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = box.getAttribute("data-map"); f.title = "Karte: Grädel AG, Bernstrasse 112, Münchenbuchsee";
      f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.setAttribute("allowfullscreen", "");
      box.appendChild(f); btn.remove();
    });
  });

  /* ------------------------------------------------ contact form -> prepared mail */
  $$("[data-mailform]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { var i = $("#" + id, f); return i ? i.value.trim() : ""; };
      var body = v("f-msg") + "\n\n" + (v("f-place") ? "Ort: " + v("f-place") + "\n" : "") + (v("f-phone") ? "Telefon: " + v("f-phone") + "\n" : "") + "\n" + v("f-name");
      location.href = "mailto:" + f.getAttribute("data-to") + "?subject=" + encodeURIComponent(f.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body.replace(/\n/g, "\r\n"));
    });
  });

  /* ------------------------------------------------ gallery filter */
  $$("[data-filterable]").forEach(function (ul) {
    var chips = $$("[data-filter]"), items = $$("li", ul), cnt = $("[data-count]") && null;
    var out = $("p[data-count]");
    function apply(c) {
      var n = 0;
      items.forEach(function (li) { var show = c === "all" || li.getAttribute("data-cat") === c; li.hidden = !show; if (show) { n++; li.classList.add("is-in"); } });
      chips.forEach(function (b) { var on = b.getAttribute("data-filter") === c; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (out) out.textContent = n + " Bilder";
      safe(function () { history.replaceState(null, "", c === "all" ? location.pathname : "?c=" + c); });
    }
    chips.forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); }); });
    var m = /[?&]c=([a-z]+)/.exec(location.search);
    apply(m && $("[data-filter=\"" + m[1] + "\"]") ? m[1] : "all");
  });

  /* ------------------------------------------------ lightbox */
  var lb = $("#lb"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbList = [], lbI = 0;
  function lbShow(i) {
    if (!lbList.length) return;
    lbI = (i + lbList.length) % lbList.length;
    var b = lbList[lbI], w = parseInt(b.getAttribute("data-w"), 10) || 450;
    lbImg.removeAttribute("srcset");
    lbImg.src = b.getAttribute("data-src"); lbImg.alt = b.getAttribute("data-alt");
    lbImg.width = w; lbImg.height = parseInt(b.getAttribute("data-h"), 10) || 337;
    lb.style.setProperty("--lbw", Math.round(w * 1.5) + "px");
    lbCap.textContent = b.getAttribute("data-label") + " · " + (lbI + 1) + "/" + lbList.length + " · " + b.getAttribute("data-alt");
  }
  function lbOpen(btn, gallery) {
    lbList = $$("[data-lb]", gallery).filter(function (x) { return !x.closest("[hidden]"); });
    lbShow(lbList.indexOf(btn));
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    root.style.overflow = "hidden";
  }
  if (lb) {
    $$("[data-gallery]").forEach(function (g) {
      g.addEventListener("click", function (e) { var b = e.target.closest("[data-lb]"); if (b) lbOpen(b, g); });
    });
    function lbClose() { if (lb.open) { if (lb.close) lb.close(); else lb.removeAttribute("open"); } root.style.overflow = ""; }
    lb.addEventListener("close", function () { root.style.overflow = ""; });
    $("[data-lb-close]", lb).addEventListener("click", lbClose);
    $("[data-lb-prev]", lb).addEventListener("click", function () { lbShow(lbI - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { lbShow(lbI + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__in")) lbClose(); });
    d.addEventListener("keydown", function (e) {
      if (!lb.open) return;
      if (e.key === "ArrowLeft") lbShow(lbI - 1); else if (e.key === "ArrowRight") lbShow(lbI + 1);
    });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1)); }, { passive: true });
  }

  /* ------------------------------------------------ the signature tool: Projekt-Check */
  var tool = $("[data-check]");
  if (tool) (function () {
    var D = JSON.parse($("#check-data").textContent), UI = D.ui, R = D.rules;
    var qEl = $("[data-q]", tool), rEl = $("[data-r]", tool), vcs = $$(".vc", tool);
    var st = { v: null, a: {}, place: "", when: 0, name: "", phone: "" };
    var byKey = {}; D.checks.forEach(function (c) { byKey[c.key] = c; });

    function cur() { return byKey[st.v]; }
    function qById(id) { var c = cur(), r = null; c.q.forEach(function (q) { if (q.id === id) r = q; }); return r; }
    function sel(id) { var v = st.a[id]; return v == null ? [] : (Array.isArray(v) ? v : [v]); }
    function visible(q) {
      if (!q.show) return true;
      for (var k in q.show) { var s = sel(k); for (var i = 0; i < q.show[k].length; i++) if (s.indexOf(q.show[k][i]) > -1) return true; }
      return false;
    }
    function defaults(c) {
      var a = {};
      c.q.forEach(function (q) { if (q.kind === "num") a[q.id] = q.value; else if (q.kind === "multi") a[q.id] = []; else a[q.id] = ""; });
      return a;
    }

    function selectV(key, user) {
      if (!byKey[key]) return;
      st.v = key; st.a = defaults(byKey[key]);
      vcs.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === key ? "true" : "false"); });
      renderQ(); renderR(true);
      safe(function () { history.replaceState(null, "", "?v=" + key + "#check"); });
      if (user && window.innerWidth < 1000) { var t = $("[data-q]", tool); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    }

    function renderQ() {
      var c = cur(), h = '<h2>' + esc(UI.step2) + '</h2><p class="small" style="margin-bottom:18px">' + esc(c.intro) + '</p>';
      c.q.forEach(function (q) {
        h += '<fieldset class="q" data-qid="' + q.id + '"' + (visible(q) ? "" : " hidden") + '><legend>' + esc(q.label) + '</legend>';
        if (q.hint) h += '<p class="hint">' + esc(q.hint) + '</p>';
        if (q.kind === "single" || q.kind === "multi") {
          h += '<div class="opts">';
          q.opts.forEach(function (o, i) {
            var type = q.kind === "single" ? "radio" : "checkbox", id = "q-" + q.id + "-" + i;
            h += '<label class="opt"><input type="' + type + '" name="q-' + q.id + '" value="' + esc(o.v) + '" id="' + id + '"><span>' + esc(o.v) + '</span></label>';
          });
          h += '</div>';
        } else if (q.kind === "num") {
          h += '<div class="numrow"><input class="range" type="range" aria-label="' + esc(q.label) + '" data-r="' + q.id + '" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + q.value + '">'
            + '<div class="num"><input type="number" inputmode="decimal" aria-label="' + esc(q.label) + ' (' + esc(q.unit) + ')" data-n="' + q.id + '" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + q.value + '"><span>' + esc(q.unit) + '</span></div></div>';
        } else {
          h += '<input type="text" data-t="' + q.id + '" placeholder="' + esc(q.placeholder || "") + '" autocomplete="off">';
        }
        h += '</fieldset>';
      });
      h += '<p class="tores"><a class="btn btn--sm btn--ghost" href="#result">' + esc(UI.to_result) + '</a></p>';
      qEl.innerHTML = h;
      // reflect state (defaults are empty for chips)
      $$("input", qEl).forEach(function (i) { if (i.type === "radio" || i.type === "checkbox") i.checked = sel(i.name.replace("q-", "")).indexOf(i.value) > -1; });
    }

    function applyShow() {
      cur().q.forEach(function (q) { var fs = $('[data-qid="' + q.id + '"]', qEl); if (fs) fs.hidden = !visible(q); });
    }
    function enforceMax(q) {
      if (!q.max) return;
      var n = sel(q.id).length;
      $$('[name="q-' + q.id + '"]', qEl).forEach(function (i) { i.disabled = !i.checked && n >= q.max; });
    }

    qEl.addEventListener("change", function (e) {
      var i = e.target; if (!st.v) return;
      if (i.name && i.name.indexOf("q-") === 0) {
        var id = i.name.slice(2), q = qById(id);
        if (q.kind === "single") st.a[id] = i.value;
        else st.a[id] = $$('[name="' + i.name + '"]:checked', qEl).map(function (x) { return x.value; });
        enforceMax(q); applyShow(); renderR(false);
      }
    });
    qEl.addEventListener("input", function (e) {
      var i = e.target; if (!st.v) return;
      var id = i.getAttribute("data-r") || i.getAttribute("data-n") || i.getAttribute("data-t");
      if (!id) return;
      var q = qById(id);
      if (q.kind === "num") {
        var v = parseFloat(String(i.value).replace(",", "."));
        if (isNaN(v)) return;
        st.a[id] = v;
        var other = i.hasAttribute("data-r") ? $('[data-n="' + id + '"]', qEl) : $('[data-r="' + id + '"]', qEl);
        if (other) other.value = v;
      } else st.a[id] = i.value;
      renderR(false);
    });

    /* ---- Geländer rules, from the Geländer page */
    function gelCheck() {
      var a = st.a, rows = [], h = a.hoehe, ab = a.abs;
      var req = ab > R.high_from ? R.min_high : R.min;
      var okH = h >= req;
      rows.push({ k: okH ? "ok" : "bad", l: okH ? UI.v_ok : UI.v_low, t: fmt(UI.g_height, { h: h, a: ab, r: req }) });
      var f = a.fuell;
      if (f === "Senkrechte Stäbe") { var okS = a.gap_s <= R.gap_bars; rows.push({ k: okS ? "ok" : "bad", l: okS ? UI.v_ok : UI.v_wide, t: fmt(UI.g_bars, { g: a.gap_s }) }); }
      else if (f === "Horizontale Leisten") {
        var okL = a.gap_l <= R.gap_rails; rows.push({ k: okL ? "ok" : "bad", l: okL ? UI.v_ok : UI.v_wide, t: fmt(UI.g_rails, { g: a.gap_l }) });
        if (a.foot) { var okF = a.foot === "Ja"; rows.push({ k: okF ? "ok" : "bad", l: okF ? UI.v_ok : UI.v_missing, t: fmt(UI.g_foot, { f: a.foot }) }); }
      } else if (f) rows.push({ k: "info", l: UI.v_info, t: UI.g_area });
      return { rows: rows, req: req, h: h, ok: rows.every(function (r) { return r.k !== "bad"; }) };
    }
    function pct(x) { return Math.max(0, Math.min(100, (x - 50))); }

    function answersList() {
      var c = cur(), out = [];
      c.q.forEach(function (q) {
        if (!visible(q)) return;
        var v = st.a[q.id], s;
        if (q.kind === "num") s = v + " " + q.unit;
        else if (Array.isArray(v)) s = v.join(", ");
        else s = v;
        if (s) out.push([q.label, s]);
      });
      return out;
    }
    function notes() {
      var c = cur(), out = [];
      c.q.forEach(function (q) {
        if (!visible(q) || !q.opts) return;
        q.opts.forEach(function (o) { if (o.note && sel(q.id).indexOf(o.v) > -1 && out.indexOf(o.note) < 0) out.push(o.note); });
      });
      return out;
    }

    function resultHead() {
      var c = cur(), sv = D.svc[c.service], href = D.base + "/leistungen/" + sv.slug + "/";
      var refs = c.refs.map(function (k) { var r = D.refs[k]; return '<img src="' + r.s + '" width="' + r.w + '" height="' + r.h + '" alt="' + esc(r.a) + '" loading="lazy">'; }).join("");
      return '<h3>' + esc(UI.step3) + '</h3><p class="rs__t">' + esc(c.label) + '</p><p class="rs__i">' + esc(c.intro) + '</p>'
        + '<section><h3>' + esc(UI.offer) + '</h3><ul class="l">' + c.offer.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></section>'
        + '<div data-dyn></div>'
        + '<section><h3>' + esc(UI.refs) + '</h3><a href="' + href + '#gal" aria-label="' + esc(UI.more + " " + sv.nav) + '"><div class="rf">' + refs + '</div></a>'
        + '<p style="margin-top:10px"><a class="tlink" href="' + href + '">' + esc(UI.more + " " + sv.nav) + '</a></p></section>'
        + '<section class="send" data-send></section>';
    }
    function sendHtml() {
      var h = '<h3>' + esc(UI.send) + '</h3>';
      h += '<div class="fld"><label for="s-place">' + esc(UI.place) + '</label><input id="s-place" type="text" autocomplete="address-level2"></div>';
      h += '<div class="fld"><span class="lbl" id="s-when-l">' + esc(UI.when) + '</span><div class="opts" role="radiogroup" aria-labelledby="s-when-l">'
        + UI.when_opts.map(function (w, i) { return '<label class="opt"><input type="radio" name="s-when" value="' + i + '"' + (i === 0 ? " checked" : "") + '><span>' + esc(w) + '</span></label>'; }).join("") + '</div></div>';
      h += '<div class="row2"><div class="fld"><label for="s-name">' + esc(UI.name) + '</label><input id="s-name" type="text" autocomplete="name"></div>'
        + '<div class="fld"><label for="s-phone">' + esc(UI.phone) + '</label><input id="s-phone" type="tel" inputmode="tel" autocomplete="tel"></div></div>';
      h += '<a class="btn" id="s-send" href="#">' + esc(UI.send) + '</a><p class="note">' + esc(UI.send_note) + '</p><p class="or"><a href="tel:' + D.tel_e164 + '">' + esc(UI.call) + '</a></p>';
      return h;
    }
    function mailHref() {
      var c = cur(), L = [UI.mail_hello, "", c.label + ":"];
      answersList().forEach(function (p) { L.push("- " + p[0] + ": " + p[1]); });
      if (c.key === "gelaender") {
        var g = gelCheck(); L.push("", UI.mail_check + ":");
        g.rows.forEach(function (r) { L.push("- " + r.l + ": " + r.t); });
      }
      var pl = $("#s-place"), wn = $('[name="s-when"]:checked'), nm = $("#s-name"), ph = $("#s-phone");
      L.push("");
      if (pl && pl.value.trim()) L.push(UI.place.replace(" (Gemeinde)", "") + ": " + pl.value.trim());
      if (wn) L.push(UI.when + ": " + UI.when_opts[parseInt(wn.value, 10)]);
      L.push("", UI.mail_bye);
      if (nm && nm.value.trim()) L.push(nm.value.trim());
      if (ph && ph.value.trim()) L.push("Telefon: " + ph.value.trim());
      L.push("", UI.mail_via);
      return "mailto:" + D.mail + "?subject=" + encodeURIComponent(fmt(UI.mail_subject, { v: c.label })) + "&body=" + encodeURIComponent(L.join("\r\n"));
    }
    function updMail() { var a = $("#s-send"); if (a) a.setAttribute("href", mailHref()); }

    function renderR(full) {
      if (!st.v) return;
      if (full || !$("[data-dyn]", rEl)) {
        rEl.innerHTML = '<div class="rs" data-rs>' + resultHead() + '</div>';
        $("[data-send]", rEl).innerHTML = sendHtml();
      }
      var c = cur(), dyn = $("[data-dyn]", rEl), h = "";
      var al = answersList();
      h += '<section><h3>' + esc(UI.your) + '</h3>' + (al.length ? '<dl>' + al.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>'; }).join("") + '</dl>' : '<p class="small">–</p>') + '</section>';
      if (c.key === "gelaender") {
        var g = gelCheck(), a = st.a;
        h += '<section><h3>' + esc(UI.rules) + '</h3>';
        h += '<div class="gauge' + (g.ok ? "" : " is-bad") + '" role="img" aria-label="' + esc(fmt(UI.g_min, { r: g.req }) + ", " + fmt(UI.g_you, { h: g.h }) + ", " + UI.g_scale) + '"><div class="gauge__fill" style="width:' + pct(g.h) + '%"></div>'
          + '<span class="gauge__req" style="left:' + pct(g.req) + '%"></span>'
          + '<span class="gauge__lab' + (pct(g.req) > 70 ? " gauge__lab--r" : "") + '" style="left:' + pct(g.req) + '%">' + esc(fmt(UI.g_min, { r: g.req })) + '</span></div>';
        g.rows.forEach(function (r) { h += '<div class="verdict is-' + r.k + '"><b>' + esc(r.l) + '</b><span>' + esc(r.t) + '</span></div>'; });
        h += '<p class="small" style="margin-top:8px">' + esc(R.src) + '</p></section>';
      }
      var nt = notes();
      if (nt.length) h += '<section><h3>' + esc(UI.hints) + '</h3><ul class="l hintlist">' + nt.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></section>';
      dyn.innerHTML = h;
      updMail();
    }
    rEl.addEventListener("input", function (e) { if (e.target.id && e.target.id.indexOf("s-") === 0) updMail(); });
    rEl.addEventListener("change", function (e) { if (e.target.name === "s-when") updMail(); });

    vcs.forEach(function (b) { b.addEventListener("click", function () { selectV(b.getAttribute("data-v"), true); }); });
    var m = /[?&]v=([a-z]+)/.exec(location.search);
    if (m && byKey[m[1]]) selectV(m[1], false);
    // the form is only rendered once a Vorhaben is chosen
  })();
})();
