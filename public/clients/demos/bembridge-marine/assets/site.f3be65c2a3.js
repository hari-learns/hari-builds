(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

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
  if (dock && safe(function () { return sessionStorage.getItem("bm-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("bm-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
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

  /* counters: their stated numbers count up once */
  var counters = $$("[data-count]");
  function fmt(v, dec) { return dec ? v.toFixed(dec) : String(Math.round(v)); }
  function runCounter(el) {
    var end = parseFloat(el.getAttribute("data-count")), dec = +el.getAttribute("data-dec") || 0, t0 = null, dur = 1200;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * k, dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end, dec);
    }
    requestAnimationFrame(step);
  }
  if (!reduce && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = fmt(0, +el.getAttribute("data-dec") || 0); cio.observe(el); });
    setTimeout(function () { counters.forEach(function (el) { if (el.textContent === "0" || el.textContent === "0.0") { el.textContent = fmt(parseFloat(el.getAttribute("data-count")), +el.getAttribute("data-dec") || 0); } }); }, 4000);
  }

  /* hero parallax, at most 5% */
  var heroImg = $(".hero__bg img");
  if (heroImg && !reduce) {
    var ticking = false;
    function par() {
      ticking = false;
      if (window.innerWidth < 800) { heroImg.style.translate = ""; return; }
      var y = Math.min(window.scrollY, window.innerHeight);
      heroImg.style.translate = "0 " + (y * 0.05).toFixed(1) + "px";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
  }

  /* history rail follows scroll */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* ------------------------------------------------ boat check */
  function mailto(to, subject, body) {
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A");
  }
  function hrefFor(base, key) {
    if (key === "shearwater" || key === "contact-us" || key === "boat-check") return base + "/" + key + "/";
    return base + "/services/" + key + "/";
  }
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function rule(list, len) { for (var i = 0; i < list.length; i++) if (len <= list[i].max) return list[i]; return list[list.length - 1]; }

  function initBC(rootEl) {
    var data = JSON.parse($("[data-bcdata]", rootEl).textContent), B = data.bc, L = B.labels, base = data.base;
    var lenEl = $("[data-len]", rootEl), lenVal = $("[data-lenval]", rootEl), sizeEl = $("[data-size]", rootEl), jobsEl = $("[data-jobs]", rootEl);
    var textEl = $("[data-text]", rootEl), mailEl = $("[data-mail]", rootEl), copyEl = $("[data-copy]", rootEl), copyLabel = $("[data-copylabel]", rootEl);
    var nameEl = $("[data-name]", rootEl), phoneEl = $("[data-phone]", rootEl), whenEl = $("[data-when]", rootEl);
    var pid = rootEl.getAttribute("data-pid");
    function radio(name) { var c = $("input[name='" + pid + "-" + name + "']:checked", rootEl); return c ? c.value : ""; }
    function label(list, k) { for (var i = 0; i < list.length; i++) if (list[i][0] === k) return list[i][1]; return k; }
    function jobBy(k) { for (var i = 0; i < B.jobs.length; i++) if (B.jobs[i].key === k) return B.jobs[i]; return null; }

    function card(state, title, text, page, extra) {
      var c = el("article", "res res--" + state);
      var top = el("div", "res__top");
      top.appendChild(el("h4", "res__t", title));
      top.appendChild(el("span", "res__tag", extra && extra.tag ? extra.tag : B.states[state]));
      c.appendChild(top);
      if (extra && extra.eng) c.appendChild(el("p", "res__eng", extra.eng));
      c.appendChild(el("p", "", text));
      if (extra && extra.models) {
        var m = el("div", "res__models");
        B.models.forEach(function (x) {
          var a = el("a", "", x[1] + " · " + x[2] + " · " + x[3]); a.href = base + "/shearwater/" + x[0] + "/"; m.appendChild(a);
        });
        c.appendChild(m);
      }
      if (page) {
        var a2 = el("a", "tlink", (data.pages[page] || "More")); a2.href = hrefFor(base, page);
        a2.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
        c.appendChild(a2);
      }
      return c;
    }

    function render() {
      var len = parseFloat(lenEl.value), type = radio("type"), eng = radio("engine");
      lenVal.innerHTML = "<b>" + len + "</b> " + L.m;
      var picked = $$("input[name='" + pid + "-job']:checked", rootEl).map(function (i) { return i.value; });
      var haul = rule(B.haul, len), store = rule(B.store, len);
      sizeEl.innerHTML = "";
      sizeEl.appendChild(card(haul.state, haul.title, haul.text, haul.page));
      sizeEl.appendChild(card(store.state, store.title, store.text, store.page));
      jobsEl.innerHTML = "";
      var summary = [];
      B.jobs.forEach(function (j) {
        if (picked.indexOf(j.key) < 0) return;
        var state = j.state, text = j.text, extra = {};
        summary.push(j.label);
        if (j.needs_haul && haul.state !== "own") { state = haul.state; text = text + " " + (haul.state === "partner" ? "At your length the boat is lifted at the partner yard first." : haul.text); }
        if (j.rib_only && type !== "rib") { state = "ask"; extra.tag = "RIBs only"; text = B.rib_only_note; }
        if (j.by_engine) extra.eng = j.by_engine[eng];
        if (j.storage && store.state === "ask") { state = "ask"; text = text + " " + store.text; }
        if (j.models) extra.models = true;
        jobsEl.appendChild(card(state, j.label, text, j.page, extra));
      });
      if (!picked.length) jobsEl.appendChild(el("article", "res res--empty", "")).appendChild(el("p", "", L.pick_one));

      var M = B.mail, nl = "\n", boat = label(B.types, type) + ", " + len + " " + L.m + ", " + label(B.engines, eng);
      var size = haul.title + " (" + (len <= 8.5 ? "to 8.5 m" : "over 8.5 m") + ")";
      if (picked.indexOf("storage") >= 0) size += "; " + store.title;
      var lines = [M.hello, "", M.intro, "", M.boat + ": " + boat, M.jobs + ": " + (summary.length ? summary.join("; ") : "to discuss"), M.size + ": " + size];
      if (whenEl.value.trim()) lines.push(M.when + ": " + whenEl.value.trim());
      if (nameEl.value.trim() || phoneEl.value.trim()) { lines.push(""); if (nameEl.value.trim()) lines.push(M.name + ": " + nameEl.value.trim()); if (phoneEl.value.trim()) lines.push(M.phone + ": " + phoneEl.value.trim()); }
      lines.push("", M.thanks);
      var body = lines.join(nl);
      textEl.value = body;
      var subj = M.subject + ": " + len + " m " + label(B.types, type) + (summary.length ? " (" + summary.slice(0, 2).join(", ") + (summary.length > 2 ? " +" + (summary.length - 2) : "") + ")" : "");
      mailEl.href = mailto(M.to, subj, body);
    }

    rootEl.addEventListener("input", render);
    rootEl.addEventListener("change", render);
    if (copyEl) copyEl.addEventListener("click", function () {
      function done() { copyLabel.textContent = L.copied; setTimeout(function () { copyLabel.textContent = L.copy; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textEl.value).then(done, function () { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); });
      else { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); }
    });
    /* preselect from the query string: ?job=tubes&len=7.5&type=rib */
    safe(function () {
      var q = new URLSearchParams(location.search);
      if (q.get("job")) $$("input[name='" + pid + "-job']", rootEl).forEach(function (c) { c.checked = false; });
      (q.get("job") || "").split(",").forEach(function (k) { var c = $("input[name='" + pid + "-job'][value='" + k + "']", rootEl); if (c) c.checked = true; });
      var l = parseFloat(q.get("len")); if (l >= B.length.min && l <= B.length.max) lenEl.value = l;
      var t = q.get("type"); if (t) { var r = $("input[name='" + pid + "-type'][value='" + t + "']", rootEl); if (r) r.checked = true; }
    });
    render();
  }
  $$("[data-bc]").forEach(initBC);

  /* contact form -> drafted email */
  $$("[data-cform]").forEach(function (f) {
    var to = f.getAttribute("data-to"), a = $("[data-cmail]", f);
    function upd() {
      var v = function (n) { var i = f.elements[n]; return i ? i.value.trim() : ""; };
      var lines = ["Hello Bembridge Marine,", ""];
      if (v("message")) lines.push(v("message"), "");
      if (v("boat")) lines.push("Boat: " + v("boat"));
      if (v("name")) lines.push("Name: " + v("name"));
      if (v("phone")) lines.push("Phone: " + v("phone"));
      a.href = mailto(to, "Enquiry from the website", lines.join("\n"));
    }
    f.addEventListener("input", upd); upd();
  });
})();
