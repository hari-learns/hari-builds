/* Tudor Stonework concept: vanilla JS, no dependencies. Everything here works on content already in the page. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---- ready flag for hero settle */
  function ready() { root.classList.add("is-ready"); }
  if (d.readyState === "complete") ready(); else window.addEventListener("load", ready);
  setTimeout(ready, 1500);

  /* ---- drawer */
  var drawer = $("#drawer"), openers = $$("[data-open-menu]"), closer = $("[data-close-menu]");
  function setDrawer(on) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", on);
    drawer.setAttribute("aria-hidden", on ? "false" : "true");
    openers.forEach(function (b) { b.setAttribute("aria-expanded", on ? "true" : "false"); });
    d.body.style.overflow = on ? "hidden" : "";
    if (on && closer) closer.focus(); else if (!on && openers[0]) openers[0].focus({ preventScroll: true });
  }
  openers.forEach(function (b) { b.addEventListener("click", function () { setDrawer(true); }); });
  if (closer) closer.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ---- concept dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("tsw-dock") === "1" && dock) dock.hidden = true; } catch (e) {}
  if (dock) setTimeout(function () { dock.hidden = true; }, 9000);
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("tsw-dock", "1"); } catch (e) {} });

  /* ---- reveal (sweep has no lower bound: nothing is left hidden after a jump) */
  var rv = $$("[data-reveal]");
  function sweep() {
    var vh = window.innerHeight || 800;
    rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.94) el.classList.add("is-in"); });
  }
  if (reduce || !("IntersectionObserver" in window)) { rv.forEach(function (el) { el.classList.add("is-in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    ["scroll", "resize", "load", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* ---- count-up on their own figures */
  function fmt(n, dec) { return dec ? n.toFixed(dec) : Math.round(n).toLocaleString("en-GB"); }
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var pre = el.getAttribute("data-pre") || "", suf = el.getAttribute("data-suf") || "";
    var final = el.textContent;
    if (reduce || !("IntersectionObserver" in window)) return;
    var done = false;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || done) return; done = true; o.disconnect();
        var t0 = performance.now(), dur = 1400;
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur), v = target * (1 - Math.pow(1 - k, 3));
          el.textContent = pre + fmt(v, dec) + suf;
          if (k < 1) requestAnimationFrame(step); else el.textContent = final;
        })(t0);
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ---- project filter (setting) */
  $$("[data-filter-root]").forEach(function (rootEl) {
    var chips = $$("[data-f]", rootEl), cards = $$("[data-setting]", rootEl), cnt = $("[data-fcount]", rootEl);
    function apply(v) {
      var n = 0;
      cards.forEach(function (c) { var show = v === "all" || c.getAttribute("data-setting") === v; c.hidden = !show; if (show) n++; });
      chips.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f") === v ? "true" : "false"); });
      if (cnt) cnt.textContent = n + (n === 1 ? " project" : " projects");
    }
    chips.forEach(function (b) { b.addEventListener("click", function () { apply(b.getAttribute("data-f")); }); });
    apply("all");
  });

  /* ---- stone library: family filter + name search, lightbox */
  var lib = $("[data-lib]");
  if (lib) {
    var fam = "all", term = "";
    var items = $$("[data-fam]", lib), fb = $$("[data-lf]", lib), lc = $("[data-lcount]", lib), qi = $("[data-lsearch]", lib);
    var apply2 = function () {
      var n = 0;
      items.forEach(function (li) { var ok = (fam === "all" || li.getAttribute("data-fam") === fam) && (!term || li.getAttribute("data-n").indexOf(term) > -1); li.hidden = !ok; if (ok) n++; });
      fb.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lf") === fam ? "true" : "false"); });
      if (lc) lc.textContent = n + (n === 1 ? " stone" : " stones");
    };
    fb.forEach(function (b) { b.addEventListener("click", function () { fam = b.getAttribute("data-lf"); apply2(); }); });
    if (qi) qi.addEventListener("input", function () { term = qi.value.trim().toLowerCase(); apply2(); });
    try { var q = new URLSearchParams(location.search).get("family"); if (q) fam = q; } catch (e) {}
    apply2();
  }
  var lb = $("#lightbox");
  if (lb && lb.showModal) {
    var lbi = $("img", lb), lbn = $("[data-lb-name]", lb), lbl = $("[data-lb-link]", lb);
    $$("[data-lb]").forEach(function (b) {
      b.addEventListener("click", function () {
        lbi.src = b.getAttribute("data-lb"); lbi.alt = b.getAttribute("data-name"); lbi.width = +b.getAttribute("data-w"); lbi.height = +b.getAttribute("data-h");
        lbn.textContent = b.getAttribute("data-name"); if (lbl) { lbl.href = b.getAttribute("data-href"); lbl.textContent = b.getAttribute("data-fam-name"); }
        lb.showModal();
      });
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---- contact form -> opens the visitor's own email app */
  var cf = $("#contact-form");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(cf), body = (f.get("msg") || "") + "\n\n" + (f.get("name") || "") + "\n" + (f.get("phone") || "") + "\n" + (f.get("email") || "");
    location.href = "mailto:" + cf.getAttribute("data-to") + "?subject=" + encodeURIComponent("Enquiry from the Tudor Stonework website concept") + "&body=" + encodeURIComponent(body);
  });

  /* ---- signature tool: find a job like yours */
  var ft = $("#finder"), dataEl = $("#finder-data");
  if (ft && dataEl) {
    var D = JSON.parse(dataEl.textContent), sel = { work: "any", stone: "any", setting: "any" };
    var L = D.labels, out = $("#fresults");
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var pick = function (name) { var r = $('input[name="' + name + '"]:checked', ft); return r ? r.value : "any"; };
    var fromURL = function () {
      try {
        var p = new URLSearchParams(location.search);
        ["work", "stone", "setting"].forEach(function (k) { var v = p.get(k); if (v) { var r = $('input[name="' + k + '"][value="' + v + '"]', ft); if (r) r.checked = true; } });
      } catch (e) {}
    };
    var toURL = function () {
      try {
        var p = new URLSearchParams();
        ["work", "stone", "setting"].forEach(function (k) { if (sel[k] !== "any") p.set(k, sel[k]); });
        history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
      } catch (e) {}
    };
    var tellList = function () {
      var bits = [];
      if (sel.work !== "any") bits.push(L.work[sel.work].toLowerCase());
      if (sel.stone !== "any") bits.push("in " + L.stone[sel.stone].toLowerCase());
      if (sel.setting !== "any") bits.push("(" + L.setting[sel.setting].toLowerCase() + ")");
      return bits.join(" ");
    };
    var render = function () {
      sel.work = pick("work"); sel.stone = pick("stone"); sel.setting = pick("setting");
      toURL();
      var fj = $("#fjump");
      var any = sel.work !== "any" || sel.stone !== "any" || sel.setting !== "any";
      if (fj) fj.classList.toggle("on", any);
      if (!any) { out.innerHTML = '<div class="fempty">' + esc(D.t.empty) + "</div>"; return; }
      var m = D.projects.filter(function (p) {
        return (sel.work === "any" || p.work.indexOf(sel.work) > -1) && (sel.stone === "any" || p.stone.indexOf(sel.stone) > -1) && (sel.setting === "any" || p.setting === sel.setting);
      });
      var h = '<div class="fsum" aria-live="polite"><b>' + m.length + "</b><span>" + esc(m.length === 1 ? D.t.count1 : D.t.countn) + (tellList() ? ": " + esc(tellList()) : "") + "</span></div>";
      if (!m.length) h += '<div class="fempty">' + esc(D.t.none) + "</div>";
      else {
        h += '<ul class="rlist">';
        m.forEach(function (p) {
          h += '<li><a class="rcard" href="' + p.url + '"><figure><img src="' + p.img + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async"></figure><div class="rcard-b"><h3>' + esc(p.name) + '</h3><p class="meta">' + esc(p.place) + (p.by ? " · " + esc(p.by_label ? p.by_label + ": " : "") + esc(p.by) : "") + (p.completed ? " · " + esc(p.completed) : "") + '</p><p class="one">' + esc(p.one) + "</p>" + (p.value ? '<span class="val">' + esc(p.value) + "</span>" : "") + "</div></a></li>";
        });
        h += "</ul>";
      }
      // stone note
      if (sel.stone !== "any") {
        var n = D.notes[sel.stone];
        if (n) {
          h += '<section class="fnote"><h3>' + esc(D.t.note_h) + " " + esc(L.stone[sel.stone].toLowerCase()) + '</h3><blockquote>';
          n.cautions.forEach(function (c) { h += "<p>" + esc(c) + "</p>"; });
          h += "</blockquote>" + (n.url ? '<a class="linkrow" href="' + n.url + '">' + esc(n.link) + "</a>" : "") + "</section>";
        }
      } else if (sel.work !== "any") { h += '<section class="fnote"><p>' + esc(D.t.no_stone) + "</p></section>"; }
      if (sel.work !== "any" && D.checks[sel.work]) {
        h += '<section class="fcheck"><h3>' + esc(D.t.check_h) + "</h3><ul>";
        D.checks[sel.work].forEach(function (c) { h += "<li>" + esc(c) + "</li>"; });
        h += "</ul>" + (sel.work === "floors" ? '<a class="linkrow" href="' + D.slip + '" rel="noopener">' + esc(D.t.slip) + "</a>" : "") + "</section>";
      }
      // swatches of chosen family
      if (sel.stone !== "any" && D.swatches[sel.stone] && D.swatches[sel.stone].length) {
        h += '<section class="fsw"><h3>' + esc(D.t.swatch_h) + '</h3><ul class="swgrid">';
        D.swatches[sel.stone].slice(0, 12).forEach(function (s) { h += '<li><div class="sw"><figure><img src="' + s.src + '" width="' + s.w + '" height="' + s.h + '" alt="' + esc(s.name) + '" loading="lazy" decoding="async"></figure><span>' + esc(s.name) + "</span></div></li>"; });
        h += '</ul><a class="linkrow" href="' + D.stone_url[sel.stone] + '">' + esc(D.t.all_stones) + "</a></section>";
      }
      // brief
      var refs = m.slice(0, 6).map(function (p) { return "- " + p.name + (p.completed ? " (" + p.completed + ")" : ""); }).join("\n");
      var body = "Hello Tudor Stonework,\n\nI am looking at: " + (tellList() || "a stonework project") + ".\n\n" + (m.length ? "I found these comparable projects on your site and would like to talk about a similar job:\n" + refs + "\n\n" : "") + "Project and location:\nApprox. size:\nProgramme:\n\nName and phone:\n";
      var mailto = "mailto:" + D.email + "?subject=" + encodeURIComponent(D.t.subject + (tellList() ? ": " + tellList() : "")) + "&body=" + encodeURIComponent(body);
      h += '<section class="fsend"><h3>' + esc(D.t.send_h) + "</h3><p>" + esc(D.t.send_p) + '</p><div class="actions"><a class="btn btn--gold" href="' + mailto + '">' + esc(D.t.send) + '</a><a class="btn btn--line-dk" href="tel:' + D.tel + '">' + esc(D.t.call) + "</a></div></section>";
      out.innerHTML = h;
      if (fj) fj.textContent = "See " + m.length + (m.length === 1 ? " matching project" : " matching projects");
    };
    ft.addEventListener("change", render);
    fromURL(); render();
    $$("input:checked", ft).forEach(function (r) { var l = r.parentNode, p = l.parentNode; if (p && p.scrollWidth > p.clientWidth) p.scrollLeft = Math.max(0, l.offsetLeft - 12); });
  }
})();
