/* PWF Kunststofftechnik concept: one IIFE, every feature existence-guarded, no frameworks. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("pwf-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("pwf-dock", "1"); }); });

  /* ---------- drawer */
  var drawer = $("#drawer"), burger = $("#burger"), dx = $("#drawer-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && dx) dx.focus(); else if (!open && burger && document.activeElement && drawer.contains(document.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (dx) dx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) {
    drawer.addEventListener("click", function (e) { if (e.target === drawer || (e.target.closest && e.target.closest("a"))) setDrawer(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1180 && drawer.classList.contains("is-open")) setDrawer(false); });
  }

  /* ---------- home: show the sticky bar once the hero action is out of view */
  var barEl = $(".bar"), heroAct = $(".hero__act");
  if (barEl && heroAct && "IntersectionObserver" in window) new IntersectionObserver(function (es) { barEl.classList.toggle("is-on", !es[0].isIntersecting); }, { threshold: 0 }).observe(heroAct);
  else if (barEl) barEl.classList.add("is-on");

  /* ---------- reveals (with a safety sweep that also reveals everything already scrolled past) */
  var rv = $$(".rv");
  rv.forEach(function (el, i) { var p = el.parentElement; if (p) { var k = Array.prototype.indexOf.call(p.children, el); el.style.setProperty("--d", Math.min(k, 5) * 0.07 + "s"); } });
  function show(el) { if (el.classList.contains("in")) return; el.classList.add("in"); var c = el.querySelectorAll(".count"); for (var i = 0; i < c.length; i++) countUp(c[i]); if (el.classList.contains("count")) countUp(el); }
  var counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el)) return; counted.add(el);
    var to = parseFloat(el.getAttribute("data-to")); if (isNaN(to)) return;
    if (reduce || el.getAttribute("data-plain")) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1400;
    function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / dur), v = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(to * v)); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to); }
    el.textContent = "0"; requestAnimationFrame(step);
  }
  function fmt(n) { return el_plain(n); }
  function el_plain(n) { return String(n); }
  if (reduce || !("IntersectionObserver" in window)) rv.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  }
  function sweep() { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---------- story chapter: image follows the step in view (desktop only; stacked on phones) */
  var steps = $$(".step"), imgs = $$(".chap__img"), ci = $("#chap-i");
  if (steps.length && imgs.length && "IntersectionObserver" in window && window.matchMedia("(min-width: 1000px)").matches) {
    steps[0].classList.add("is-on");
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = +e.target.getAttribute("data-i");
        steps.forEach(function (s) { s.classList.toggle("is-on", s === e.target); });
        imgs.forEach(function (m) { m.classList.toggle("is-on", +m.getAttribute("data-i") === i); });
        if (ci) ci.textContent = "0" + (i + 1);
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  } else steps.forEach(function (s) { s.classList.add("is-on"); });

  /* ---------- catalog filter */
  var cq = $("#catq"), cn = $("#catn");
  if (cq) {
    var blocks = $$(".cat__b"), secs = $$("[data-sec]"), total = $$(".cat__tbl tbody tr").length;
    function filt() {
      var terms = cq.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
      blocks.forEach(function (b) {
        var rows = $$("tbody tr", b), any = 0, bq = b.getAttribute("data-q") || "";
        rows.forEach(function (r) { var txt = (r.textContent + " " + bq).toLowerCase(); var ok = terms.every(function (t) { return txt.indexOf(t) > -1; }); r.hidden = !ok; if (ok) any++; });
        b.hidden = !any; shown += any;
      });
      secs.forEach(function (s) { s.hidden = !$$(".cat__b", s).some(function (b) { return !b.hidden; }); });
      if (cn) cn.textContent = terms.length ? (shown ? shown + " von " + total + " Artikeln" : "Keine Treffer. Fragen Sie gerne direkt an.") : "";
    }
    cq.addEventListener("input", filt);
  }

  /* ---------- contact form -> mailto */
  var mf = $("#mform");
  if (mf) mf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(mf), body = "Guten Tag\r\n\r\n" + (f.get("msg") || "") + "\r\n\r\nFreundliche Grüsse\r\n" + (f.get("name") || "") + "\r\n" + (f.get("firma") || "");
    location.href = "mailto:" + mf.getAttribute("data-to") + "?subject=" + encodeURIComponent(mf.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
  });

  /* ---------- Projekt-Check */
  var host = $("#tool"), dataEl = $("#tool-data");
  if (host && dataEl) safe(function () { initTool(host, JSON.parse(dataEl.textContent)); });

  function initTool(host, D) {
    var S = { needs: {}, series: null, after: {}, tooling: null, area: "", cav: "1", bar: String(D.force.default_bar), teil: "", gross: "", termin: "", name: "", firma: "" };
    var qs = new URLSearchParams(location.search);
    (qs.get("need") || "").split(",").forEach(function (id) { if (D.needs.some(function (n) { return n.id === id; })) S.needs[id] = true; });
    var byId = function (arr, id) { return arr.filter(function (x) { return x.id === id; })[0]; };
    function opt(kind, id, label, on) { return '<button type="button" class="opt" data-k="' + kind + '" data-id="' + id + '" aria-pressed="' + (on ? "true" : "false") + '">' + esc(label) + "</button>"; }
    var groups = []; D.needs.forEach(function (n) { if (groups.indexOf(n.g) < 0) groups.push(n.g); });
    var q1 = groups.map(function (g) { return '<p class="q__g">' + esc(g) + '</p><div class="opts">' + D.needs.filter(function (n) { return n.g === g; }).map(function (n) { return opt("need", n.id, n.label, S.needs[n.id]); }).join("") + "</div>"; }).join("");
    host.innerHTML =
      '<div class="tool__main">' +
      '<section class="q"><div class="q__h"><span class="q__n">1</span><h2>Was muss Ihr Teil können?</h2></div><p class="q__hint">Mehrfachauswahl. Alles ist optional.</p>' + q1 + "</section>" +
      '<section class="q"><div class="q__h"><span class="q__n">2</span><h2>Wie viele Teile?</h2></div><p class="q__hint">Stückzahl pro Serie oder Jahr.</p><div class="opts opts--radio">' + D.series.map(function (s) { return opt("series", s.id, s.label, S.series === s.id); }).join("") + "</div></section>" +
      '<section class="q"><div class="q__h"><span class="q__n">3</span><h2>Was soll nach dem Spritzguss passieren?</h2></div><p class="q__hint">Nachbearbeitung, Montage, Prüfung, Verpackung.</p><div class="opts">' + D.after.map(function (a) { return opt("after", a.id, a.label, S.after[a.id]); }).join("") + "</div></section>" +
      '<section class="q"><div class="q__h"><span class="q__n">4</span><h2>Wie steht es um das Werkzeug?</h2></div><div class="opts opts--radio">' + D.tooling.map(function (t) { return opt("tooling", t.id, t.label, S.tooling === t.id); }).join("") + "</div></section>" +
      '<section class="q"><div class="q__h"><span class="q__n">5</span><h2>Schliesskraft grob abschätzen</h2></div><p class="q__hint">Optional. Faustformel: projizierte Fläche × Kavitäten × Innendruck. Ein Richtwert, keine Aussage von PWF.</p>' +
      '<div class="force"><label>Projizierte Fläche je Teil (cm²)<input type="number" inputmode="decimal" min="0" step="any" id="f-area" placeholder="z. B. 100"></label>' +
      '<label>Kavitäten (Anzahl)<input type="number" inputmode="numeric" min="1" step="1" id="f-cav" value="1"></label>' +
      '<label>Werkzeuginnendruck (bar)<input type="number" inputmode="numeric" min="50" step="10" id="f-bar" value="' + esc(S.bar) + '"></label><div class="force__out" id="f-out" aria-live="polite">Fläche eingeben, um die ungefähre Schliesskraft zu sehen.</div></div></section>' +
      "</div>" +
      '<aside class="tool__side"><div class="res" id="res" tabindex="-1"><h2>Ihr Ergebnis</h2><div id="res-body"></div><button type="button" class="tool__reset" id="t-reset">Alles zurücksetzen</button></div></aside>' +
      '<div class="tool__bar" id="tbar"><span id="tcount">Noch nichts gewählt</span><a class="btn btn--signal" href="#res" id="tgo">Ergebnis ansehen</a></div>';
    host.setAttribute("data-ready", "1");

    function force() {
      var a = parseFloat(String(S.area).replace(",", ".")), c = parseFloat(S.cav), b = parseFloat(S.bar);
      if (!(a > 0) || !(c >= 1) || !(b > 0)) return null;
      var t = a * c * b / 980.665, f = D.force, verdict;
      if (t < f.min) verdict = "Unterhalb der kleinsten genannten Maschine (" + f.min + " t): die Projektleiter klären die passende Maschine.";
      else if (t > f.max) verdict = "Über " + f.max + " t: ausserhalb des genannten Maschinenparks, bitte direkt anfragen.";
      else verdict = "Liegt im Bereich des PWF-Maschinenparks (" + f.min + " bis " + f.max + " t Schliesskraft).";
      return { t: t, verdict: verdict, txt: "ca. " + Math.round(t) + " t (Faustformel: " + a + " cm² × " + c + " Kavität(en) × " + b + " bar)" };
    }

    function build() {
      var needs = D.needs.filter(function (n) { return S.needs[n.id]; }), after = D.after.filter(function (a) { return S.after[a.id]; });
      var ser = S.series ? byId(D.series, S.series) : null, tool = S.tooling ? byId(D.tooling, S.tooling) : null, fc = force();
      var count = needs.length + after.length + (ser ? 1 : 0) + (tool ? 1 : 0) + (fc ? 1 : 0);
      var open = [];
      needs.forEach(function (n) { if (n.open) open.push(n.open); });
      if (fc && (fc.t < D.force.min || fc.t > D.force.max)) open.push(fc.verdict);
      if (needs.length) open.push("Zeichnung oder 3D-Daten, falls vorhanden, der E-Mail anhängen.");
      return { needs: needs, after: after, ser: ser, tool: tool, fc: fc, count: count, open: open };
    }

    function mailText(R) {
      var L = ["Guten Tag", "", "Ich prüfe ein Spritzgussprojekt und bitte um eine Rückmeldung.", ""];
      if (S.teil) L.push("Teil / Projekt: " + S.teil, "");
      if (S.gross) L.push("Teilegrösse / Gewicht: " + S.gross, "");
      if (S.termin) L.push("Gewünschter Starttermin: " + S.termin, "");
      if (R.needs.length) { L.push("Das Teil soll können:"); R.needs.forEach(function (n) { L.push("- " + n.label); }); L.push(""); }
      if (R.ser) L.push("Stückzahl (pro Serie oder Jahr): " + R.ser.label, "");
      if (R.after.length) { L.push("Nach dem Spritzguss:"); R.after.forEach(function (a) { L.push("- " + a.label); }); L.push(""); }
      if (R.tool) L.push("Werkzeug: " + R.tool.label, "");
      if (R.fc) L.push("Geschätzte Schliesskraft: " + R.fc.txt, "");
      L.push("Freundliche Grüsse", S.name || "", S.firma || "");
      return L.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
    }

    function renderResult() {
      var R = build(), out = $("#res-body"), h = "";
      $("#tcount").textContent = R.count ? R.count + (R.count === 1 ? " Angabe gewählt" : " Angaben gewählt") : "Noch nichts gewählt";
      if (!R.count) { out.innerHTML = '<p class="res__empty">Wählen Sie links, was Ihr Teil können muss. Hier erscheint, was PWF dazu auf der eigenen Website sagt, und eine vorbereitete Anfrage.</p>'; return; }
      if (R.needs.length) {
        h += "<h3>Was PWF dazu sagt</h3>";
        R.needs.forEach(function (n) {
          h += '<div class="res__item"><strong>' + esc(n.label) + "</strong><p>" + esc(n.say) + "</p>" +
            (n.mats && n.mats.length ? '<ul class="chips">' + n.mats.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "") +
            '<a href="' + D.base + "/" + n.page + '/">Mehr dazu</a></div>';
        });
      }
      if (R.ser) h += '<h3>Stückzahl</h3><div class="res__item' + (R.ser.flag ? " res__open" : "") + '"><strong>' + esc(R.ser.label) + "</strong><p>" + esc(R.ser.note) + "</p></div>";
      if (R.after.length) {
        h += "<h3>Danach</h3>";
        R.after.forEach(function (a) { h += '<div class="res__item"><strong>' + esc(a.label) + "</strong><p>" + esc(a.say) + '</p><a href="' + D.base + "/" + a.page + '/">Mehr dazu</a></div>'; });
      }
      if (R.tool) h += '<h3>Werkzeug</h3><div class="res__item"><strong>' + esc(R.tool.label) + "</strong><p>" + esc(R.tool.say) + '</p><a href="' + D.base + '/leistungen/formen-werkzeuge/">Mehr dazu</a></div>';
      if (R.fc) h += '<h3>Schliesskraft</h3><div class="res__item"><strong>' + esc(R.fc.txt) + "</strong><p>" + esc(R.fc.verdict) + "</p></div>";
      if (R.open.length) h += '<h3>Im Gespräch klären</h3>' + R.open.map(function (o) { return '<div class="res__item res__open"><p>' + esc(o) + "</p></div>"; }).join("");
      var body = mailText(R), href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(D.subject) + "&body=" + encodeURIComponent(body.replace(/\n/g, "\r\n"));
      h += '<h3>Ihre Anfrage</h3><div class="mailbox"><div class="mailbox__opt"><label>Teil oder Projekt (optional)<input type="text" id="m-teil" value="' + esc(S.teil) + '" autocomplete="off"></label><label>Teilegrösse (mm) und Gewicht (g), optional<input type="text" id="m-gross" value="' + esc(S.gross) + '" autocomplete="off"></label><label>Gewünschter Starttermin, optional<input type="text" id="m-termin" value="' + esc(S.termin) + '" autocomplete="off"></label><label>Name (optional)<input type="text" id="m-name" value="' + esc(S.name) + '" autocomplete="name"></label><label>Firma (optional)<input type="text" id="m-firma" value="' + esc(S.firma) + '" autocomplete="organization"></label></div>' +
        '<pre id="m-pre">' + esc(body) + '</pre><div class="mailbox__act"><a class="btn btn--signal" id="m-send" href="' + href + '">E-Mail an PWF öffnen</a><button type="button" class="btn btn--line" id="m-copy">Text kopieren</button><a class="btn btn--line" href="' + D.tel_href + '">Anrufen ' + esc(D.tel) + "</a></div></div>" +
        '<p class="disc">' + esc(D.disclaimer) + "</p>";
      out.innerHTML = h;
      var keep = document.activeElement && document.activeElement.id;
      function bindField(id, key) { var el = $("#" + id); if (!el) return; el.addEventListener("input", function () { S[key] = el.value; refreshMail(); }); }
      bindField("m-teil", "teil"); bindField("m-gross", "gross"); bindField("m-termin", "termin"); bindField("m-name", "name"); bindField("m-firma", "firma");
      var cp = $("#m-copy");
      if (cp) cp.addEventListener("click", function () {
        var txt = $("#m-pre").textContent;
        function done() { cp.textContent = "Kopiert"; setTimeout(function () { cp.textContent = "Text kopieren"; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { sel(); });
        else sel();
        function sel() { var r = document.createRange(); r.selectNodeContents($("#m-pre")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); cp.textContent = "Text markiert, bitte kopieren"; }
      });
    }
    function refreshMail() {
      var R = build(), pre = $("#m-pre"), send = $("#m-send"); if (!pre || !send) return;
      var body = mailText(R); pre.textContent = body;
      send.setAttribute("href", "mailto:" + D.mail + "?subject=" + encodeURIComponent(D.subject) + "&body=" + encodeURIComponent(body.replace(/\n/g, "\r\n")));
    }
    function syncUrl() {
      var ids = Object.keys(S.needs).filter(function (k) { return S.needs[k]; });
      safe(function () { var u = new URL(location.href); if (ids.length) u.searchParams.set("need", ids.join(",")); else u.searchParams.delete("need"); history.replaceState(null, "", u.pathname + u.search + u.hash); });
    }
    function updateForce() {
      var f = force(), o = $("#f-out");
      o.innerHTML = f ? esc(f.txt) + "<small>" + esc(f.verdict) + "</small>" : "Fläche eingeben, um die ungefähre Schliesskraft zu sehen.";
    }
    host.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".opt"); if (!b) return;
      var k = b.getAttribute("data-k"), id = b.getAttribute("data-id"), on = b.getAttribute("aria-pressed") !== "true";
      if (k === "need") { S.needs[id] = on; syncUrl(); }
      else if (k === "after") S.after[id] = on;
      else if (k === "series" || k === "tooling") {
        var key = k === "series" ? "series" : "tooling";
        S[key] = on ? id : null;
        $$('.opt[data-k="' + k + '"]', host).forEach(function (x) { x.setAttribute("aria-pressed", x === b && on ? "true" : "false"); });
        renderResult(); return;
      }
      b.setAttribute("aria-pressed", on ? "true" : "false");
      renderResult();
    });
    [["f-area", "area"], ["f-cav", "cav"], ["f-bar", "bar"]].forEach(function (p) {
      var el = $("#" + p[0]); el.addEventListener("input", function () { S[p[1]] = el.value; updateForce(); renderResult(); });
    });
    var rs = $("#t-reset");
    if (rs) rs.addEventListener("click", function () { S.needs = {}; S.series = null; S.after = {}; S.tooling = null; S.area = ""; S.cav = "1"; S.teil = S.gross = S.termin = ""; $$(".opt", host).forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); $("#f-area").value = ""; $("#f-cav").value = "1"; syncUrl(); updateForce(); renderResult(); });
    var go = $("#tgo");
    if (go) go.addEventListener("click", function (e) { e.preventDefault(); var r = $("#res"); r.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); r.focus({ preventScroll: true }); });
    var bar = $("#tbar"), res = $("#res");
    if (bar && res && "IntersectionObserver" in window) new IntersectionObserver(function (es) { bar.style.display = es[0].isIntersecting && window.innerWidth < 1040 ? "none" : ""; }, { threshold: 0.25 }).observe(res);
    renderResult();
  }
})();
