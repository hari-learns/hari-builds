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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("kvb-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("kvb-dock", "1"); }); });

  /* reveals */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.98) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* model filter chips */
  var chips = $$(".chip");
  if (chips.length) {
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-f");
        chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        $$("#cards .card").forEach(function (card) { card.hidden = !(f === "all" || card.getAttribute("data-family") === f); card.classList.add("is-in"); });
      });
    });
  }

  /* hero film: their own YouTube video, autoplay muted on large screens only; phones get the still and a "Se filmen" button */
  var hero = $(".hero"), host = $("#hero-video"), toggle = $("#v-toggle"), frame = null, paused = false;
  function embed(vid, start, end, auto, extra) {
    var q = "autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&start=" + start + (end ? "&end=" + end : "") + extra;
    return "https://www.youtube-nocookie.com/embed/" + vid + "?" + q;
  }
  function post(cmd) { if (frame && frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify({ event: "command", func: cmd, args: "" }), "*"); }
  function startHeroVideo() {
    if (!host || frame) return;
    var vid = host.getAttribute("data-vid"), s = host.getAttribute("data-start"), en = host.getAttribute("data-end");
    frame = d.createElement("iframe");
    frame.src = embed(vid, s, en, true, "&mute=1&controls=0&loop=1&playlist=" + vid + "&disablekb=1&enablejsapi=1&origin=" + encodeURIComponent(location.origin));
    frame.title = "Kværnø 800 C i fart (bakgrunnsfilm)";
    frame.setAttribute("allow", "autoplay; encrypted-media");
    frame.setAttribute("tabindex", "-1");
    frame.setAttribute("aria-hidden", "true");
    frame.addEventListener("load", function () { try { frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (e) { } });
    host.appendChild(frame);
    if (toggle) toggle.hidden = false;
  }
  window.addEventListener("message", function (e) {
    if (!frame || e.source !== frame.contentWindow || typeof e.data !== "string") return;
    var m = safe(function () { return JSON.parse(e.data); });
    if (!m) return;
    var st = m.event === "onStateChange" ? m.info : (m.info && m.info.playerState);
    if (st === 1 && hero) hero.classList.add("is-playing");
  });
  var saveData = navigator.connection && navigator.connection.saveData;
  function maybeAuto() {
    if (reduce || saveData || !host) return;
    if (!window.matchMedia("(min-width: 1000px) and (min-height: 520px)").matches) return;
    setTimeout(startHeroVideo, 900);
  }
  if (host) { if (d.readyState === "complete") maybeAuto(); else window.addEventListener("load", maybeAuto); }
  if (toggle) toggle.addEventListener("click", function () {
    paused = !paused; post(paused ? "pauseVideo" : "playVideo");
    toggle.setAttribute("aria-pressed", paused ? "true" : "false");
    toggle.querySelector("span").textContent = paused ? "Spill av filmen" : "Pause filmen";
  });

  /* film dialog (click to load, with controls) */
  var vdlg = null;
  function openFilm(btn) {
    if (!vdlg) {
      vdlg = d.createElement("dialog"); vdlg.className = "vdlg"; vdlg.setAttribute("aria-label", "Film");
      vdlg.innerHTML = '<button type="button" class="vdlg__x" aria-label="Lukk">&times;</button><div class="vdlg__b"></div>';
      d.body.appendChild(vdlg);
      $(".vdlg__x", vdlg).addEventListener("click", function () { vdlg.close(); });
      vdlg.addEventListener("close", function () { $(".vdlg__b", vdlg).innerHTML = ""; if (frame && !paused) post("playVideo"); });
      vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
    }
    if (frame) post("pauseVideo");
    var vid = btn.getAttribute("data-vid"), s = btn.getAttribute("data-start");
    $(".vdlg__b", vdlg).innerHTML = '<iframe src="' + embed(vid, s, "", true, "&controls=1") + '" title="Kværnø 800 C i fart" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    if (vdlg.showModal) vdlg.showModal(); else vdlg.setAttribute("open", "");
  }
  ["film-open", "film-open2"].forEach(function (id) { var b = $("#" + id); if (b) b.addEventListener("click", function () { openFilm(b); }); });

  /* gallery lightbox */
  var lb = $("#lb"), gal = $$("#gal a");
  if (lb && gal.length) {
    var idx = 0, lbi = $("#lb-img"), lbn = $("#lb-n");
    var show = function (i) {
      idx = (i + gal.length) % gal.length;
      lbi.src = gal[idx].getAttribute("href"); lbi.alt = gal[idx].querySelector("img").alt;
      lbn.textContent = (idx + 1) + " / " + gal.length;
    };
    gal.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); show(i); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }); });
    $("#lb-prev").addEventListener("click", function () { show(idx - 1); });
    $("#lb-next").addEventListener("click", function () { show(idx + 1); });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* contact form: builds a pre-filled e-mail or WhatsApp message, nothing is stored or sent by this page */
  var cform = $("#cform");
  if (cform) {
    var compose = function () {
      var v = function (id) { return ($("#" + id).value || "").trim(); };
      var model = v("c-model");
      var lines = ["Hei Bjørn Ivar,", ""];
      lines.push(model ? "Jeg vil gjerne vite mer om " + model + "." : "Jeg vil gjerne ha et råd om hvilken båt som passer.");
      if (v("c-msg")) lines.push("", v("c-msg"));
      lines.push("", "Navn: " + v("c-name"), "Telefon: " + v("c-tel"), "Kommune: " + v("c-place"));
      return { subject: model ? "Forespørsel: " + model : "Forespørsel fra kvernoboats.no", body: lines.join("\n") };
    };
    var ok = function () {
      var bad = !($("#c-name").value || "").trim() || !($("#c-tel").value || "").trim();
      $("#c-err").hidden = !bad; return !bad;
    };
    var cfg = safe(function () { return JSON.parse($("#finder-data").textContent); });
    cform.addEventListener("submit", function (e) {
      e.preventDefault(); if (!ok()) return;
      var c = compose(); location.href = "mailto:" + (cform.getAttribute("action").replace("mailto:", "")) + "?subject=" + encodeURIComponent(c.subject) + "&body=" + encodeURIComponent(c.body);
    });
    $("#c-wa").addEventListener("click", function () {
      if (!ok()) return; var c = compose();
      window.open("https://wa.me/4791714234?text=" + encodeURIComponent(c.body), "_blank", "noopener");
    });
    var h = location.hash.match(/model=([\w-]+)/);
    if (h) { var sel = $("#c-model"); $$("option", sel).forEach(function (o) { if (o.value.replace(/\s/g, "").toLowerCase().indexOf(h[1].toLowerCase()) > -1) sel.value = o.value; }); }
  }

  /* signature tool: which Kværnø fits? Only filters and ranks their own data. */
  var fnd = $("#finder");
  if (fnd) {
    var data = JSON.parse($("#finder-data").textContent), M = data.models, out = $("#finder-out");
    var form = $("#finder-form"), pOut = $("#f-p"), loadEl = $("#f-load"), loadOut = $("#f-load-o"), widthEl = $("#f-width");
    var compactMode = fnd.getAttribute("data-compact") === "1";
    var st = { p: 4, use: [], cover: "any", load: 300, width: 0 };
    var USE = data.ui.uses;
    var fmt = function (n) { return String(n).replace(".", ","); };
    function readHash() {
      var h = location.hash.replace("#", ""); if (!h) return;
      h.split("&").forEach(function (kv) {
        var a = kv.split("="), k = a[0], v = decodeURIComponent(a[1] || "");
        if (k === "p" && +v >= 1 && +v <= 10) st.p = +v;
        if (k === "u") st.use = v ? v.split(",").filter(function (x) { return USE[x]; }) : [];
        if (k === "c" && /^(any|ht|cabin)$/.test(v)) st.cover = v;
        if (k === "l" && +v >= 0 && +v <= 900) st.load = +v;
        if (k === "w" && !isNaN(+v)) st.width = +v;
      });
    }
    function writeHash() { var h = "p=" + st.p + "&u=" + st.use.join(",") + "&c=" + st.cover + "&l=" + st.load + "&w=" + st.width; safe(function () { history.replaceState(null, "", "#" + h); }); }
    function syncForm() {
      pOut.textContent = st.p;
      $$("input[name=use]", form).forEach(function (i) { i.checked = st.use.indexOf(i.value) > -1; });
      $$("input[name=cover]", form).forEach(function (i) { i.checked = i.value === st.cover; });
      if (loadEl) { loadEl.value = st.load; loadOut.textContent = st.load + " kg"; }
      if (widthEl) widthEl.value = st.width ? String(st.width) : "0";
    }
    function evaluate(m) {
      var no = [];
      if (st.p > m.persons) no.push("Tar " + m.persons + " personer, du er " + st.p);
      if (st.load > m.load) no.push("Maks last " + m.load + " kg, du trenger " + st.load + " kg");
      if (st.cover === "ht" && m.family === "open") no.push("Åpen båt, du ønsker tak");
      if (st.cover === "cabin" && m.family !== "cabin") no.push("Har ikke lukket rorhus");
      if (st.width && m.width > st.width) no.push("Bredde " + m.width_s + ", grensen din er " + fmt(st.width) + " m");
      var score = 0; st.use.forEach(function (u) { if (m.fit[u]) score += m.fit[u][0]; });
      return { m: m, no: no, score: score };
    }
    function enquiry(m) {
      var lines = [data.ui.greet, "", "Jeg vil gjerne vite mer om " + m.name + ".", "", "Dette er det jeg trenger (fra Finn din båt):", "Antall personer: " + st.p,
        "Bruk: " + (st.use.length ? st.use.map(function (u) { return USE[u]; }).join(", ") : "ikke valgt"),
        "Last og utstyr: ca. " + st.load + " kg", "Ly: " + { any: "åpen er fin", ht: "minst hardtop", cabin: "lukket rorhus" }[st.cover],
        "Maks bredde: " + (st.width ? fmt(st.width) + " m" : "ingen grense"), "", data.ui.sign];
      var body = lines.join("\n");
      return { mail: "mailto:" + data.mail + "?subject=" + encodeURIComponent("Forespørsel: " + m.name) + "&body=" + encodeURIComponent(body), wa: "https://wa.me/" + data.wa + "?text=" + encodeURIComponent(body) };
    }
    function reasons(r) {
      var m = r.m, li = [];
      li.push("Tar " + m.persons + " personer (du er " + st.p + ")");
      li.push("Maks last " + m.load + " kg (du trenger " + st.load + " kg)");
      st.use.forEach(function (u) { if (m.fit[u]) li.push(USE[u] + ": <q>«" + esc(m.fit[u][1]) + "»</q>"); });
      if (st.cover !== "any") li.push(m.family === "cabin" ? "Lukket rorhus (cabin)" : "Hardtop med tak og glass foran");
      if (st.width) li.push("Bredde " + m.width_s + " (grense " + fmt(st.width) + " m)");
      return li.map(function (x) { return "<li>" + (x.indexOf("<q>") > -1 ? x : esc(x)) + "</li>"; }).join("");
    }
    function card(r, best) {
      var m = r.m, q = enquiry(m);
      return '<article class="rcard' + (best ? " rcard--best" : "") + '"><div class="rcard__img"><img src="' + m.img + '" width="' + m.imgw + '" height="' + m.imgh + '" alt="' + esc(m.name) + '" loading="lazy"></div>' +
        '<div class="rcard__b"><div class="rcard__top">' + (best ? '<span class="badge">Passer best</span>' : "") + '<span class="tag tag--' + m.family + '">' + esc(data.family[m.family]) + '</span></div>' +
        '<h3 class="rcard__n">' + esc(m.name) + '</h3><ul class="why-l">' + reasons(r) + '</ul><p class="rcard__s">' + esc(m.total) + " totalt · " + m.hp + " hk maks motor</p>" +
        '<div class="rcard__a"><a class="btn btn--primary" href="' + q.mail + '">Send forespørsel</a><a class="btn btn--line" href="' + m.url + '">Se ' + esc(m.short) + '</a>' +
        '<a class="btn btn--wa" href="' + q.wa + '" rel="noopener">WhatsApp</a></div></div></article>';
    }
    function render() {
      var res = M.map(evaluate), yes = res.filter(function (r) { return !r.no.length; }), no = res.filter(function (r) { return r.no.length; });
      yes.sort(function (a, b) { return b.score - a.score || a.m.persons - b.m.persons || a.m.load - b.m.load || a.m.hp - b.m.hp; });
      var html = "";
      if (yes.length) {
        html += '<h3 class="out__h">' + (yes.length === 1 ? "1 modell passer" : yes.length + " av " + M.length + " modeller passer") + "</h3>";
        html += card(yes[0], true);
        yes.slice(1, compactMode ? 1 : 3).forEach(function (r) { html += card(r, false); });
        if (yes.length > (compactMode ? 1 : 3)) html += '<div class="rsmall">' + yes.slice(compactMode ? 1 : 3).map(function (r) { return '<a href="' + r.m.url + '"><b>' + esc(r.m.name) + "</b><span>" + esc(data.family[r.m.family]) + " · " + r.m.persons + " pers. · " + r.m.load + " kg</span></a>"; }).join("") + "</div>";
      } else {
        no.sort(function (a, b) { return a.no.length - b.no.length; });
        html += '<h3 class="out__h">Ingen modell dekker alt dette</h3><p class="note">Nærmest er ' + esc(no[0].m.name) + " (" + esc(no[0].no.join("; ")) + "). Ring Bjørn Ivar for å høre om tilpasninger.</p>";
        html += '<div class="rcard__a"><a class="btn btn--call" href="' + data.tel + '">Ring ' + esc(data.phone) + "</a></div>";
        html += '<div class="rsmall">' + no.slice(0, 3).map(function (r) { return '<a href="' + r.m.url + '"><b>' + esc(r.m.name) + "</b><span>" + esc(r.no.join("; ")) + "</span></a>"; }).join("") + "</div>";
      }
      if (yes.length && no.length) {
        html += '<details class="rno"><summary>Passer ikke (' + no.length + ")</summary><ul>" + no.map(function (r) { return "<li><b>" + esc(r.m.name) + ":</b> " + esc(r.no.join("; ")) + "</li>"; }).join("") + "</ul></details>";
      }
      out.innerHTML = html; writeHash();
    }
    readHash(); syncForm(); render();
    form.addEventListener("click", function (e) {
      var s = e.target.closest && e.target.closest(".step"); if (s) { st.p = Math.max(1, Math.min(10, st.p + (+s.getAttribute("data-d")))); syncForm(); render(); }
    });
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "use") st.use = $$("input[name=use]:checked", form).map(function (i) { return i.value; });
      if (t.name === "cover") st.cover = t.value;
      if (t.name === "width") st.width = +t.value;
      render();
    });
    if (loadEl) loadEl.addEventListener("input", function () { st.load = +loadEl.value; loadOut.textContent = st.load + " kg"; render(); });
    $("#f-reset").addEventListener("click", function () { st = { p: 4, use: [], cover: "any", load: 300, width: 0 }; syncForm(); render(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
  }
})();
