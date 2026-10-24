(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  // hero settle
  requestAnimationFrame(function () { root.classList.add("is-ready"); });

  // reveals
  var rev = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    rev.forEach(function (e) { e.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rev.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 0.05 + "s"; io.observe(e); });
  }

  // counters on their real figures
  if (!reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, raw = el.getAttribute("data-count"), end = parseFloat(String(raw).replace(/\./g, "").replace(",", "."));
        if (!isFinite(end)) return;
        var dots = /\./.test(raw), t0 = null, dur = 1200;
        function fmt(v) { v = Math.round(v); return dots ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(v); }
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(end * e);
          if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (e) { co.observe(e); });
  }

  // drawer
  var dr = $("#drawer"), bg = $(".burger"), lastFocus = null;
  function openD() { lastFocus = d.activeElement; dr.classList.add("is-open"); dr.setAttribute("aria-hidden", "false"); bg.setAttribute("aria-expanded", "true"); root.style.overflow = "hidden"; var x = $(".drawer-x"); if (x) x.focus(); }
  function closeD() { dr.classList.remove("is-open"); dr.setAttribute("aria-hidden", "true"); bg.setAttribute("aria-expanded", "false"); root.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  if (dr && bg) {
    bg.addEventListener("click", openD);
    $(".drawer-x").addEventListener("click", closeD);
    dr.addEventListener("click", function (e) { if (e.target === dr || (e.target.closest && e.target.closest("a"))) closeD(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr.classList.contains("is-open")) closeD(); });
    window.addEventListener("resize", function () { if (innerWidth >= 1180 && dr.classList.contains("is-open")) closeD(); });
  }

  // dock
  var dock = $("#dock");
  if (dock) {
    try { if (sessionStorage.getItem("omas-dock") === "1") dock.hidden = true; } catch (e) {}
    $(".dock-x", dock).addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("omas-dock", "1"); } catch (e) {} });
  }

  // contact form -> drafted email (nothing is sent by the page)
  $$("[data-mailform]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (n) { var i = f.elements[n]; return i ? i.value.trim() : ""; };
      var body = v("msg") + "\n\n" + v("nome") + (v("azienda") ? "\n" + v("azienda") : "") + (v("tel") ? "\nTel. " + v("tel") : "");
      var to = f.getAttribute("action").replace(/^mailto:/, "");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent("Richiesta di contatto") + "&body=" + encodeURIComponent(body);
    });
  });

  // signature tool: "Prepara la tua richiesta"
  var tool = $("[data-tool]");
  if (tool) {
    var D = JSON.parse($("#tool-data").textContent), T = D.t, S = { need: "", die: "", mat: "", sector: "", have: "" };
    var out = $("[data-result]", tool);
    function label(list, k) { for (var i = 0; i < list.length; i++) { var it = list[i]; if (it[0] === k) return it[1]; } return k; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function field(n) { var i = $('[name="' + n + '"]', tool); return i ? i.value.trim() : ""; }
    function show() {
      $$("[data-show]", tool).forEach(function (b) {
        var m = b.getAttribute("data-show").split(":"), ok = m[1].split(",").indexOf(S[m[0]]) > -1;
        b.classList.toggle("on", ok);
      });
    }
    function route() {
      var n = S.need;
      if (n === "nuovo") return ["progettazione", "costruzione"];
      if (n === "serie") return ["produzione", "controllo"];
      if (n === "entrambi") return ["progettazione", "costruzione", "produzione", "controllo"];
      if (n === "manut") return ["manutenzione"];
      return [];
    }
    function buildText() {
      var L = [T.greeting, ""];
      L.push("Cosa serve: " + label(D.need, S.need));
      if (S.die) L.push("Tipo di stampo: " + (S.die === "nonso" ? "da definire" : label(D.die, S.die)));
      if (S.mat) L.push("Materiale: " + (S.mat === "altro" ? "altro (da indicare)" : S.mat));
      if (S.sector) L.push("Settore: " + (S.sector === "altro" ? "altro" : S.sector));
      if (S.have) L.push("Disponibile: " + label(D.have, S.have));
      if (field("qty")) L.push("Quantità: " + field("qty"));
      if (field("size")) L.push("Ingombro (mm): " + field("size"));
      if (field("notes")) L.push("Note: " + field("notes"));
      L.push("", T.bye);
      if (field("company")) L.push(field("company"));
      if (field("tel")) L.push("Tel. " + field("tel"));
      return L.join("\n");
    }
    function render() {
      show();
      if (!S.need) { out.innerHTML = '<p class="empty">' + esc(T.empty) + "</p>"; return; }
      var r = route(), h = "<h3>" + esc(T.route_title) + "</h3><ol class=\"route\">";
      r.forEach(function (k, i) {
        var s = D.route[k];
        h += '<li style="animation-delay:' + i * 0.06 + 's"><b>' + esc(s.title) + "</b><p>" + esc(s.text) + '</p><a href="' + s.href + '">' + esc(s.title) + " &rarr;</a></li>";
      });
      h += "</ol><h3>" + esc(T.check_title) + '</h3><ul class="checks">';
      if (S.mat && S.need !== "manut") h += S.mat === "altro" ? '<li class="q"><b>Materiale</b> ' + esc(T.mat_other) + "</li>" : "<li><b>" + esc(S.mat) + "</b> " + esc(T.mat_ok) + "</li>";
      if (S.die) h += (S.die === "nonso") ? '<li class="q"><b>Tipo di stampo</b> ' + esc(T.die_other) + "</li>" : "<li><b>" + esc(label(D.die, S.die)) + "</b> " + esc(T.die_ok) + "</li>";
      if (S.sector) {
        if (S.sector === "altro") h += '<li class="q"><b>Settore</b> non nell\'elenco pubblicato: descrivilo nella richiesta.</li>';
        else h += "<li><b>" + esc(S.sector) + "</b> " + esc(S.sector === "Automotive" ? T.sector_iatf : T.sector_ok) + "</li>";
      }
      if (S.have) h += "<li>" + esc(S.have === "2d" || S.have === "3d" ? T.have_cad : T.have_other) + "</li>";
      h += "</ul><p class=\"tbc\">" + esc(T.tbc) + "</p>";
      var txt = buildText(), href = "mailto:" + D.email + "?subject=" + encodeURIComponent(T.subject + " - " + label(D.need, S.need)) + "&body=" + encodeURIComponent(txt);
      h += '<div class="res-a"><a class="btn btn--y" data-send href="' + href + '">' + esc(T.send) + '</a><button class="btn btn--o" type="button" data-copy>' + esc(T.copy) + '</button><a class="btn btn--o" href="' + D.tel + '">' + esc(T.call) + " " + esc(D.phone) + "</a></div>";
      out.innerHTML = h;
    }
    tool.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".chip");
      if (b) {
        var g = b.getAttribute("data-g"), v = b.getAttribute("data-v");
        S[g] = (S[g] === v) ? "" : v;
        if (g === "need") { if (S.need === "serie") S.die = ""; if (S.need === "manut") S.mat = ""; }
        $$('.chip[data-g="' + g + '"]', tool).forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-v") === S[g])); });
        $$(".chip", tool).forEach(function (c) { var gg = c.getAttribute("data-g"); c.setAttribute("aria-pressed", String(S[gg] === c.getAttribute("data-v"))); });
        render();
        return;
      }
      var c = e.target.closest && e.target.closest("[data-copy]");
      if (c) {
        var txt = buildText();
        var done = function () { c.textContent = T.copied; setTimeout(function () { c.textContent = T.copy; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done); else done();
      }
    });
    tool.addEventListener("input", function () { if (S.need) render(); });
    // preselect from ?need=
    var m = /[?&]need=([a-z]+)/.exec(location.search);
    if (m && $('.chip[data-g="need"][data-v="' + m[1] + '"]', tool)) { $('.chip[data-g="need"][data-v="' + m[1] + '"]', tool).click(); }
    else render();
  }
})();
