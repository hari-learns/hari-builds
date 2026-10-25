(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

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

  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("sh-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("sh-dock", "1"); }); });

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

  var heroImg = $(".hero__bg img");
  if (heroImg && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (window.innerWidth < 800) { heroImg.style.translate = ""; return; }
        heroImg.style.translate = "0 " + (Math.min(window.scrollY, window.innerHeight) * 0.05).toFixed(1) + "px";
      });
    }, { passive: true });
  }

  $$("[data-video]").forEach(function (v) {
    var btn = $(".video__btn", v);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = d.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + v.getAttribute("data-video") + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("aria-label").replace(/^Play: /, "");
      f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });

  function mail(to, subject, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A"); }
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function num(v) { return (Math.round(v * 10) / 10).toString(); }

  function initFinder(rootEl) {
    var data = JSON.parse($("[data-fdata]", rootEl).textContent), L = data.labels, pid = rootEl.getAttribute("data-pid");
    var wEl = $("[data-w]", rootEl), lEl = $("[data-l]", rootEl), kEl = $("[data-k]", rootEl);
    var wv = $("[data-wv]", rootEl), lv = $("[data-lv]", rootEl), kv = $("[data-kv]", rootEl);
    var res = $("[data-res]", rootEl), text = $("[data-text]", rootEl), mailEl = $("[data-mail]", rootEl), copyEl = $("[data-copy]", rootEl), copyLabel = $("[data-copylabel]", rootEl);
    var nameEl = $("[data-name]", rootEl), phoneEl = $("[data-phone]", rootEl), placeEl = $("[data-place]", rootEl);
    function type() { var c = $("input[name='" + pid + "-type']:checked", rootEl); return c ? c.value : "any"; }
    function card(m, tag, best) {
      var c = el("article", "rescard" + (best ? " rescard--best" : ""));
      var top = el("div", "rescard__top"); top.appendChild(el("h4", "rescard__t", m.name[0].toUpperCase() + m.name.slice(1))); top.appendChild(el("span", "rescard__tag", tag)); c.appendChild(top);
      c.appendChild(el("p", "rescard__s", m.series + (m.kind === "V" ? " V rake" : " rake")));
      var sp = el("div", "rescard__sp");
      [["Raking width", num(m.w) + " m"], ["Length", num(m.l) + " m"], ["Width", num(m.tw) + " m"], ["Weight", m.kg.toLocaleString("en-AU") + " kg"]].forEach(function (p) {
        var s = el("span", "", p[0]); s.appendChild(el("b", "", p[1])); sp.appendChild(s);
      });
      c.appendChild(sp);
      var a = el("a", "tlink", m.series + ": see the " + m.name); a.href = data.base + "/" + m.path; c.appendChild(a);
      return c;
    }
    function render() {
      var w = parseFloat(wEl.value), l = parseFloat(lEl.value), k = parseFloat(kEl.value), t = type();
      var lNo = l >= parseFloat(lEl.max), kNo = k >= parseFloat(kEl.max);
      wv.textContent = num(w) + " m"; lv.textContent = lNo ? L.any : num(l) + " m"; kv.textContent = kNo ? L.any : k.toLocaleString("en-AU") + " kg";
      var pool = data.models.filter(function (m) { return (t === "any" || m.kind === t) && (lNo || m.l <= l) && (kNo || m.kg <= k); });
      var fit = pool.filter(function (m) { return m.w >= w; }).sort(function (a, b) { return a.w - b.w || a.kg - b.kg; });
      var narrow = pool.filter(function (m) { return m.w < w; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 2);
      res.innerHTML = "";
      var shown = fit.slice(0, 4);
      shown.forEach(function (m, i) { res.appendChild(card(m, i === 0 ? L.closest : (m.w > w ? L.wide : L.closest), i === 0)); });
      if (fit.length > shown.length) res.appendChild(el("p", "note", "and " + (fit.length - shown.length) + " wider models in the published range. Narrow the length or weight limit to shorten the list, or see every size on the V rakes and Inline rakes pages."));
      if (!fit.length) {
        var n = el("article", "rescard rescard--no"); n.appendChild(el("p", "", L.none)); res.appendChild(n);
        narrow.forEach(function (m) { res.appendChild(card(m, L.narrow, false)); });
      }
      var best = shown[0] || narrow[0];
      var lines = ["Hello Schinckel Hayrakes,", "", "I am looking at a hay rake and used the rake finder on your website.", "",
        "Raking width wanted: " + num(w) + " m", "Longest rake I can store or tow: " + (lNo ? "no limit" : num(l) + " m"), "Heaviest rake my tractor can handle: " + (kNo ? "no limit" : k.toLocaleString("en-AU") + " kg"),
        "Rake type: " + (t === "any" ? "V or inline" : (t === "V" ? "V rake" : "Inline rake"))];
      if (shown.length) lines.push("Models that fit: " + shown.map(function (m) { return m.label + " (" + num(m.w) + " m wide, " + m.kg + " kg)"; }).join("; "));
      else lines.push("No published model meets all the limits. Can you advise?");
      if (placeEl.value.trim()) lines.push("Town or district: " + placeEl.value.trim());
      if (nameEl.value.trim() || phoneEl.value.trim()) { lines.push(""); if (nameEl.value.trim()) lines.push("Name: " + nameEl.value.trim()); if (phoneEl.value.trim()) lines.push("Phone: " + phoneEl.value.trim()); }
      lines.push("", "Please send me prices and delivery details. Thank you.");
      var body = lines.join("\n"); text.value = body;
      mailEl.href = mail(data.email, "Schinckel Website Request: " + (best ? best.subject : "Hay Rake Enquiry"), body);
    }
    rootEl.addEventListener("input", render); rootEl.addEventListener("change", render);
    if (copyEl) copyEl.addEventListener("click", function () {
      function done() { copyLabel.textContent = L.copied; setTimeout(function () { copyLabel.textContent = L.copy; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text.value).then(done, function () { text.select(); safe(function () { d.execCommand("copy"); }); done(); });
      else { text.select(); safe(function () { d.execCommand("copy"); }); done(); }
    });
    safe(function () {
      var q = new URLSearchParams(location.search), w = parseFloat(q.get("w")); if (w >= 4 && w <= 13) wEl.value = w;
      var t = q.get("type"); if (t) { var r = $("input[name='" + pid + "-type'][value='" + t + "']", rootEl); if (r) r.checked = true; }
    });
    render();
  }
  $$("[data-finder]").forEach(initFinder);

  $$("[data-cform]").forEach(function (f) {
    var to = f.getAttribute("data-to"), a = $("[data-cmail]", f);
    function upd() {
      var v = function (n) { var i = f.elements[n]; return i ? i.value.trim() : ""; };
      var lines = ["Hello Schinckel Hayrakes,", ""];
      if (v("message")) lines.push(v("message"), "");
      if (v("rake")) lines.push("Rake or product: " + v("rake"));
      if (v("place")) lines.push("Town or district: " + v("place"));
      if (v("name")) lines.push("Name: " + v("name"));
      if (v("phone")) lines.push("Phone: " + v("phone"));
      a.href = mail(to, "Schinckel Website Request: " + (v("rake") || "Enquiry"), lines.join("\n"));
    }
    f.addEventListener("input", upd); upd();
  });

  $$("[data-filter]").forEach(function (inp) {
    var rows = $$("[data-row]"), groups = $$("[data-group]"), none = $("[data-none]");
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase(), any = false;
      rows.forEach(function (r) { var ok = !q || r.textContent.toLowerCase().indexOf(q) >= 0; r.hidden = !ok; if (ok) any = true; });
      groups.forEach(function (g) { g.hidden = !$$("[data-row]", g).some(function (r) { return !r.hidden; }); });
      if (none) none.hidden = any;
    });
  });
})();
