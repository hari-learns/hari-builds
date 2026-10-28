/* Eichenhaus concept: menu, reveals, lightbox, mail forms and the Möbel-Finder. Vanilla, one IIFE, every feature guarded. */
(function () {
  "use strict";
  var d = document, de = d.documentElement, body = d.body;
  de.classList.add("js");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var BASE = body.getAttribute("data-base") || "";
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---- menu drawer ---- */
  var burger = $("#burger"), drawer = $("#drawer");
  function setMenu(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü");
    body.classList.toggle("menu-open", open);
    if ("inert" in drawer) drawer.inert = !open;
  }
  if (burger && drawer) {
    setMenu(false);
    burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("open")); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) { setMenu(false); burger.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1180) setMenu(false); });
  }

  /* ---- dock + ribbon ---- */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && store.get("dock-closed")) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; store.set("dock-closed", "1"); });
  var ribbon = $("#ribbon");
  if (ribbon && Date.now() > new Date("2026-11-08T18:00:00+01:00").getTime()) ribbon.hidden = true;

  /* ---- reveals (with a sweep that never strands content) ---- */
  var rv = $$(".rv");
  function show(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  } else rv.forEach(show);

  /* ---- open / closed now (their published hours, Europe/Berlin) ---- */
  $$("[data-open]").forEach(function (el) {
    try {
      var parts = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      var wd = parts.find(function (p) { return p.type === "weekday"; }).value.replace(".", "");
      var h = +parts.find(function (p) { return p.type === "hour"; }).value, m = +parts.find(function (p) { return p.type === "minute"; }).value, t = h + m / 60;
      var map = { Mo: [10, 18], Di: [10, 18], Mi: [10, 18], Do: [10, 18], Fr: [10, 18], Sa: [10, 14] };
      var hrs = map[wd];
      el.textContent = hrs && t >= hrs[0] && t < hrs[1] ? "Jetzt geöffnet bis " + hrs[1] + " Uhr (laut Öffnungszeiten)." : "Aktuell geschlossen. Mo – Fr 10 – 18 Uhr, Sa 10 – 14 Uhr.";
    } catch (e) { el.textContent = ""; }
  });

  /* ---- lightbox (shared) ---- */
  var lb = null, lbItems = [], lbIdx = 0, lbFocus = null;
  function ensureLB() {
    if (lb) return lb;
    lb = d.createElement("dialog"); lb.className = "lb"; lb.setAttribute("aria-label", "Bildansicht");
    lb.innerHTML = '<div class="lb-in"><button class="lb-x" type="button" aria-label="Schließen">&times;</button><img alt="" width="1200" height="800"><div class="lb-cap"><p></p><div class="lb-acts"></div></div></div>';
    body.appendChild(lb);
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    $(".lb-x", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("close", function () { if (lbFocus && lbFocus.focus) lbFocus.focus(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") lbStep(1); if (e.key === "ArrowLeft") lbStep(-1); });
    return lb;
  }
  function lbShow(i) {
    var it = lbItems[i]; if (!it) return; lbIdx = i;
    var img = $("img", lb); img.src = it.src; img.alt = it.alt || "";
    $("p", lb).textContent = it.cap || "";
    var acts = $(".lb-acts", lb); acts.innerHTML = "";
    if (it.actions) it.actions(acts);
    if (lbItems.length > 1) {
      var nav = d.createElement("div"); nav.className = "lb-nav";
      nav.innerHTML = '<button type="button" aria-label="Vorheriges Bild">←</button><button type="button" aria-label="Nächstes Bild">→</button>';
      nav.children[0].addEventListener("click", function () { lbStep(-1); }); nav.children[1].addEventListener("click", function () { lbStep(1); });
      acts.appendChild(nav);
    }
  }
  function lbStep(n) { lbShow((lbIdx + n + lbItems.length) % lbItems.length); }
  function openLB(items, i, from) {
    ensureLB(); lbItems = items; lbFocus = from || d.activeElement; lbShow(i);
    if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
  }
  $$(".gal, .evgal, .wood-img").forEach(function (g) {
    var links = $$("a.zoom", g); if (!links.length) return;
    var items = links.map(function (a) { var im = $("img", a); return { src: a.getAttribute("data-full"), cap: a.getAttribute("data-cap"), alt: im ? im.alt : "" }; });
    links.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); openLB(items, i, a); }); });
  });
  // gallery groups are split by headings: gather all zoom links on a page into one list
  var allZ = $$("a.zoom");
  if (allZ.length) {
    var allItems = allZ.map(function (a) { var im = $("img", a); return { src: a.getAttribute("data-full"), cap: a.getAttribute("data-cap"), alt: im ? im.alt : "" }; });
    allZ.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); e.stopImmediatePropagation(); openLB(allItems, i, a); }, true); });
  }

  /* ---- mail forms: build a pre-filled mail, nothing is sent ---- */
  $$("form[data-mailform]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = ["Guten Tag,", ""], first = f.querySelector("[required]");
      var okAll = true;
      $$("[required]", f).forEach(function (i) { if (!i.value.trim()) { okAll = false; i.setAttribute("aria-invalid", "true"); } else i.removeAttribute("aria-invalid"); });
      if (!okAll) { var bad = $("[aria-invalid]", f); if (bad) bad.focus(); return; }
      $$("input, select, textarea", f).forEach(function (i) { if (i.value.trim()) lines.push(i.name + ": " + i.value.trim()); });
      lines.push("", "Freundliche Grüße");
      location.href = "mailto:" + f.getAttribute("data-to") + "?subject=" + encodeURIComponent(f.getAttribute("data-subject")) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });

  /* ---- Möbel-Finder ---- */
  var dataP = null;
  function loadData(url) {
    if (!dataP) dataP = fetch(url).then(function (r) { if (!r.ok) throw new Error("finder data " + r.status); return r.json(); });
    return dataP;
  }
  function Finder(root) {
    var mode = root.getAttribute("data-mode") || "full";
    var limit = mode === "mini" ? (window.innerWidth < 760 ? 4 : 8) : 12, step = 12;
    var st = { room: null, wood: null, ch: null, picks: [], shown: limit };
    var D;
    var q = new URLSearchParams(location.search);
    function build() {
      root.innerHTML =
        '<div class="f-top"><span class="f-topcount" aria-hidden="true"></span><button class="btn btn-sm" type="button" data-jump>Treffer ansehen</button></div>' +
        '<fieldset class="f-step"><legend><span>1</span>Was soll entstehen?</legend><div class="chips" data-k="room"></div></fieldset>' +
        '<fieldset class="f-step"><legend><span>2</span>Welches Holz oder welche Oberfläche?</legend><div class="chips" data-k="wood"></div></fieldset>' +
        '<fieldset class="f-step"><legend><span>3</span>Welcher Charakter gefällt Ihnen?</legend><div class="chips" data-k="ch"></div></fieldset>' +
        '<div class="f-bar"><p class="f-count" aria-live="polite"></p><button class="linkbtn" type="button" data-reset hidden>Auswahl zurücksetzen</button></div>' +
        '<ul class="f-grid"></ul><p class="f-moreWrap"></p>' +
        '<div class="f-tray" hidden><p></p><ul class="f-thumbs"></ul><a class="btn btn-light" href="#" data-open-req role="button">Anfrage vorbereiten</a></div>';
      root.addEventListener("click", onClick);
      render();
    }
    function match(it, skip) {
      if (skip !== "room" && st.room && it.r !== st.room) return false;
      if (skip !== "wood" && st.wood && it.w.indexOf(st.wood) < 0) return false;
      if (skip !== "ch" && st.ch && it.c.indexOf(st.ch) < 0) return false;
      return true;
    }
    function chip(k, id, label, n, on) {
      var dis = n === 0 && !on;
      return '<button class="chip" type="button" data-k="' + k + '" data-id="' + id + '" aria-pressed="' + (on ? "true" : "false") + '"' + (dis ? ' aria-disabled="true"' : "") + ">" + esc(label) + " <small>" + n + "</small></button>";
    }
    function render() {
      var groups = { room: D.rooms, wood: D.woods, ch: D.chars };
      Object.keys(groups).forEach(function (k) {
        var html = "";
        groups[k].forEach(function (g) {
          var n = D.items.filter(function (it) { if (!match(it, k)) return false; return k === "room" ? it.r === g.id : k === "wood" ? it.w.indexOf(g.id) > -1 : it.c.indexOf(g.id) > -1; }).length;
          html += chip(k, g.id, g.t, n, st[k] === g.id);
        });
        $('[data-k="' + k + '"].chips', root).innerHTML = html;
      });
      var res = D.items.filter(function (it) { return match(it); });
      $(".f-count", root).textContent = res.length + (res.length === 1 ? " Projekt" : " Projekte") + " aus der Werkstatt" + (st.room || st.wood || st.ch ? " passen zu Ihrer Auswahl" : "");
      $(".f-topcount", root).textContent = res.length + (res.length === 1 ? " Projekt" : " Projekte");
      $("[data-reset]", root).hidden = !(st.room || st.wood || st.ch);
      var grid = $(".f-grid", root), roomName = {};
      D.rooms.forEach(function (r) { roomName[r.id] = r.t; });
      var html = res.slice(0, st.shown).map(function (it) {
        var on = st.picks.indexOf(it.id) > -1;
        return '<li class="f-card" data-id="' + it.id + '"><button class="f-img" type="button" data-zoom="' + it.id + '" aria-label="Bild vergrößern: ' + esc(it.t.slice(0, 60)) + '"><img src="' + BASE + "/assets/img/" + it.id + '-480.webp" srcset="' + BASE + "/assets/img/" + it.id + "-480.webp 480w, " + BASE + "/assets/img/" + it.id + '-1200.webp 1200w" sizes="(max-width:760px) 46vw, (max-width:1180px) 31vw, 290px" width="' + it.iw + '" height="' + it.ih + '" alt="' + esc(it.t) + '" loading="lazy" decoding="async"></button>' +
          '<p class="f-room">' + esc(roomName[it.r]) + "</p><p>" + esc(it.t) + '</p><button class="f-pick" type="button" data-pick="' + it.id + '" aria-pressed="' + (on ? "true" : "false") + '">' + (on ? "Als Vorbild gemerkt" : "Als Vorbild merken") + "</button></li>";
      }).join("");
      grid.innerHTML = html || '<li class="f-empty">Dazu zeigen wir aktuell kein Projekt. Wählen Sie eine andere Kombination oder fragen Sie uns direkt.</li>';
      var more = $(".f-moreWrap", root);
      if (res.length > st.shown) {
        if (mode === "mini") {
          var qs = new URLSearchParams(); if (st.room) qs.set("raum", st.room); if (st.wood) qs.set("holz", st.wood); if (st.ch) qs.set("charakter", st.ch);
          more.innerHTML = '<a class="btn btn-ghost" href="' + BASE + "/finder/" + (qs.toString() ? "?" + qs : "") + '">Alle ' + res.length + " Treffer ansehen</a>";
        } else more.innerHTML = '<button class="btn btn-ghost f-more" type="button" data-more>Weitere Projekte anzeigen (' + (res.length - st.shown) + ")</button>";
      } else more.innerHTML = "";
      var tray = $(".f-tray", root);
      tray.hidden = st.picks.length === 0;
      if (st.picks.length) {
        $("p", tray).textContent = st.picks.length + (st.picks.length === 1 ? " Vorbild gemerkt" : " Vorbilder gemerkt") + " (höchstens 4)";
        $(".f-thumbs", tray).innerHTML = st.picks.map(function (id) { return '<li><img src="' + BASE + "/assets/img/" + id + '-480.webp" width="52" height="40" alt=""></li>'; }).join("");
      }
    }
    function item(id) { return D.items.filter(function (i) { return i.id === id; })[0]; }
    function summary() {
      var rn = {}, wn = {}, cn = {}; D.rooms.forEach(function (x) { rn[x.id] = x.t; }); D.woods.forEach(function (x) { wn[x.id] = x.t; }); D.chars.forEach(function (x) { cn[x.id] = x.t; });
      var bits = [st.room && rn[st.room], st.wood && wn[st.wood], st.ch && cn[st.ch]].filter(Boolean);
      return bits;
    }
    function mailText(form) {
      var bits = summary();
      var L = ["Guten Tag,", "", "ich interessiere mich für Möbel nach Maß" + (bits.length ? ": " + bits.join(", ") : "") + ".", ""];
      if (st.picks.length) {
        L.push("Diese Projekte auf eichenhaus.de gefallen mir:");
        st.picks.forEach(function (id, n) { var it = item(id), pg = D.rooms.filter(function (r) { return r.id === it.r; })[0]; L.push((n + 1) + ". " + it.t + " (" + D.live + "/" + it.p + "/)"); });
        L.push("");
      }
      if (form.wish.value.trim()) L.push("Meine Wünsche und Maße:", form.wish.value.trim(), "");
      if (form.nm.value.trim()) L.push("Name: " + form.nm.value.trim());
      if (form.ph.value.trim()) L.push("Telefon: " + form.ph.value.trim());
      if (form.em.value.trim()) L.push("E-Mail: " + form.em.value.trim());
      if (form.when.value.trim()) L.push("Terminwunsch: " + form.when.value.trim());
      L.push("", "Freundliche Grüße");
      return L.join("\n");
    }
    var dlg = null;
    function openReq() {
      if (!dlg) {
        dlg = d.createElement("dialog"); dlg.className = "f-dlg"; dlg.setAttribute("aria-label", "Anfrage vorbereiten");
        dlg.innerHTML = '<div class="lb-in"><button class="lb-x" type="button" aria-label="Schließen">&times;</button><h3>Ihre Anfrage an Eichenhaus</h3><ul class="f-sum"></ul>' +
          '<form novalidate><label>Ihre Wünsche und Maße (optional)<textarea name="wish" rows="4" placeholder="z. B. Esstisch für 8 Personen, ca. 240 × 100 cm"></textarea></label>' +
          '<label>Name<input name="nm" autocomplete="name"></label><label>Telefon<input name="ph" type="tel" autocomplete="tel" inputmode="tel"></label>' +
          '<label>E-Mail<input name="em" type="email" autocomplete="email" inputmode="email"></label><label>Terminwunsch<input name="when" placeholder="z. B. Samstag Vormittag"></label>' +
          '<div class="f-actions"><a class="btn" href="#" data-mail>E-Mail vorbereiten</a><button class="btn btn-ghost" type="button" data-copy>Text kopieren</button></div>' +
          '<p class="small" data-note>Es öffnet sich Ihr E-Mail-Programm mit dem fertigen Text an ' + esc(D.mail) + '. Es wird nichts automatisch gesendet.</p></form></div>';
        body.appendChild(dlg);
        $(".lb-x", dlg).addEventListener("click", function () { dlg.close(); });
        dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
        var form = $("form", dlg);
        var upd = function () { $("[data-mail]", dlg).setAttribute("href", "mailto:" + D.mail + "?subject=" + encodeURIComponent("Anfrage Möbel nach Maß" + (summary().length ? ": " + summary().join(", ") : "")) + "&body=" + encodeURIComponent(mailText(form))); };
        form.addEventListener("input", upd); form.addEventListener("submit", function (e) { e.preventDefault(); });
        $("[data-copy]", dlg).addEventListener("click", function () {
          var t = mailText(form), note = $("[data-note]", dlg);
          (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { note.textContent = "Text kopiert. Sie können ihn an " + D.mail + " senden."; }, function () { note.textContent = "Kopieren war nicht möglich. Bitte nutzen Sie „E-Mail vorbereiten“."; });
        });
        dlg._upd = upd;
      }
      $(".f-sum", dlg).innerHTML = (summary().length ? "<li>Auswahl: " + esc(summary().join(", ")) + "</li>" : "") + st.picks.map(function (id) { return "<li>" + esc(item(id).t) + "</li>"; }).join("");
      dlg._upd(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    function pick(id) {
      var i = st.picks.indexOf(id);
      if (i > -1) st.picks.splice(i, 1);
      else { if (st.picks.length >= 4) st.picks.shift(); st.picks.push(id); }
      render();
    }
    function zoom(id, from) {
      var res = D.items.filter(function (it) { return match(it); });
      var items = res.map(function (it) {
        return { src: BASE + "/assets/img/" + it.id + "-1200.webp", cap: it.f, alt: it.t, actions: function (acts) {
          var b = d.createElement("button"); b.type = "button"; b.className = "btn btn-sm"; var on = st.picks.indexOf(it.id) > -1; b.textContent = on ? "Gemerkt (entfernen)" : "Als Vorbild merken";
          b.addEventListener("click", function () { pick(it.id); var on2 = st.picks.indexOf(it.id) > -1; b.textContent = on2 ? "Gemerkt (entfernen)" : "Als Vorbild merken"; });
          var a = d.createElement("a"); a.className = "btn btn-ghost btn-sm"; a.href = BASE + "/" + it.p + "/"; a.textContent = "Mehr zu dieser Rubrik";
          acts.appendChild(b); acts.appendChild(a); } };
      });
      var idx = res.map(function (r) { return r.id; }).indexOf(id);
      openLB(items, Math.max(0, idx), from);
    }
    function onClick(e) {
      var t = e.target.closest("button, a"); if (!t || !root.contains(t)) return;
      if (t.matches(".chip")) {
        if (t.getAttribute("aria-disabled") === "true") return;
        var k = t.getAttribute("data-k"), id = t.getAttribute("data-id");
        st[k] = st[k] === id ? null : id; st.shown = limit; render();
        var again = $('.chip[data-k="' + k + '"][data-id="' + id + '"]', root); if (again) again.focus();
        return;
      }
      if (t.matches("[data-jump]")) { var g = $(".f-bar", root); if (g) g.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); return; }
      if (t.matches("[data-reset]")) { st.room = st.wood = st.ch = null; st.shown = limit; render(); return; }
      if (t.matches("[data-more]")) { st.shown += step; render(); return; }
      if (t.matches("[data-pick]")) { var id2 = t.getAttribute("data-pick"); pick(id2); var nb = $('[data-pick="' + id2 + '"]', root); if (nb) nb.focus(); return; }
      if (t.matches("[data-zoom]")) { zoom(t.getAttribute("data-zoom"), t); return; }
      if (t.matches("[data-open-req]")) { e.preventDefault(); openReq(); }
    }
    loadData(root.getAttribute("data-json")).then(function (j) {
      D = j;
      var okId = function (list, v) { return list.some(function (x) { return x.id === v; }) ? v : null; };
      st.room = okId(D.rooms, q.get("raum")); st.wood = okId(D.woods, q.get("holz")); st.ch = okId(D.chars, q.get("charakter"));
      build();
    }).catch(function (err) { console.warn("[finder] disabled:", err); root.innerHTML = '<p>Der Möbel-Finder konnte nicht geladen werden. Alle Projekte finden Sie unter <a href="' + BASE + '/moebel/">Möbel nach Maß</a>.</p>'; });
  }
  var fr = $$("[data-finder]");
  if (fr.length) {
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { fio.unobserve(en.target); Finder(en.target); } }); }, { rootMargin: "400px 0px" });
      fr.forEach(function (r) { fio.observe(r); });
    } else fr.forEach(Finder);
  }
})();
