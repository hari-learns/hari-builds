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
  if (dock && safe(function () { return sessionStorage.getItem("eb-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("eb-dock", "1"); }); });

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


  /* ------------------------------------------------ frying line picker */
  function mailto(to, subject, body) {
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A");
  }
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  function initPK(rootEl) {
    var data = JSON.parse($("[data-pkdata]", rootEl).textContent), T = data.t, M = T.mail, base = data.base, loc = data.locale;
    var pid = rootEl.getAttribute("data-pid");
    var nf = function (n) { return Math.round(n).toLocaleString(loc); };
    var hourEl = $("[data-hour]", rootEl), dayEl = $("[data-day]", rootEl), hoursEl = $("[data-hours]", rootEl);
    var hourVal = $("[data-hourval]", rootEl), dayVal = $("[data-dayval]", rootEl), hoursVal = $("[data-hoursval]", rootEl);
    var hourBox = $("[data-hourbox]", rootEl), dayBox = $("[data-daybox]", rootEl);
    var recEl = $("[data-rec]", rootEl), ladEl = $("[data-ladder]", rootEl), exEl = $("[data-extras]", rootEl);
    var textEl = $("[data-text]", rootEl), mailEl = $("[data-mail]", rootEl), copyEl = $("[data-copy]", rootEl), copyLabel = $("[data-copylabel]", rootEl);
    var nameEl = $("[data-name]", rootEl), phoneEl = $("[data-phone]", rootEl), bakEl = $("[data-bakery]", rootEl);
    function radio(n) { var c = $("input[name='" + pid + "-" + n + "']:checked", rootEl); return c ? c.value : ""; }
    function arrow() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
    function link(page, label) { var a = el("a", "tlink", label); a.href = base + "/" + page + "/"; a.insertAdjacentHTML("beforeend", arrow()); return a; }

    function render() {
      var mode = radio("mode"), need, perDay = parseFloat(dayEl.value), hrs = parseFloat(hoursEl.value), perH = parseFloat(hourEl.value);
      hourBox.hidden = mode !== "hour"; dayBox.hidden = mode !== "day";
      need = mode === "hour" ? perH : Math.ceil(perDay / hrs);
      hourVal.innerHTML = nf(perH) + "<small>" + T.unit_h + "</small>";
      dayVal.innerHTML = nf(perDay) + "<small>" + T.unit_day + "</small>";
      hoursVal.innerHTML = nf(hrs) + "<small>" + T.unit_hours + "</small>";
      var models = data.models, rec = null;
      for (var i = 0; i < models.length; i++) { if (models[i][1] >= need) { rec = models[i]; break; } }
      recEl.innerHTML = "";
      if (rec) {
        var pct = Math.round(need / rec[1] * 100);
        recEl.appendChild(el("span", "res__tag", T.rec_tag));
        recEl.appendChild(el("h4", "pk__model", rec[0]));
        recEl.appendChild(el("p", "pk__cap", nf(rec[1]) + " " + T.unit_h));
        recEl.appendChild(el("p", "", T.need + ": " + nf(need) + " " + T.unit_h + " (" + pct + "% " + T.pct_of + ")"));
      } else {
        recEl.appendChild(el("span", "res__tag", "?"));
        recEl.appendChild(el("h4", "pk__model", nf(need) + " " + T.unit_h));
        recEl.appendChild(el("p", "", T.over));
      }
      ladEl.innerHTML = "";
      models.forEach(function (m) {
        var cls = "lad", tag = "";
        if (rec && m[0] === rec[0]) { cls += " lad--rec"; tag = T.rec; } else if (m[1] < need) { cls += " lad--small"; tag = T.too_small; } else { tag = T.fits; }
        var row = el("div", cls); row.style.setProperty("--w", Math.min(100, m[1] / 36) + "%");
        row.appendChild(el("b", "", m[0])); row.appendChild(el("span", "", nf(m[1]) + " / " + tag));
        row.appendChild(el("i"));
        ladEl.appendChild(row);
      });
      var picked = $$("input[name='" + pid + "-opt']:checked", rootEl).map(function (c) { return c.value; });
      exEl.innerHTML = "";
      picked.forEach(function (k) {
        var x = T.extras[k]; if (!x) return;
        var c = el("article", "res res--ok"); var top = el("div", "res__top"); top.appendChild(el("h4", "res__t", x[0])); c.appendChild(top);
        c.appendChild(el("p", "", x[1]));
        if (k === "unidos" && need / 60 <= data.unidos) c.appendChild(el("p", "", T.unidos_low));
        c.appendChild(link(x[2], T.more_btn)); exEl.appendChild(c);
      });
      var buy = radio("buy"), buyLabel = buy === "buy" ? T.buy : buy === "lease" ? T.lease : T.undecided;
      var optLabels = picked.map(function (k) { return T.extras[k][0]; });
      var lines = [M.hello, "", M.intro, "", M.cap + ": " + nf(need) + " " + T.unit_h + (mode === "day" ? " (" + nf(perDay) + " " + T.unit_day + ", " + nf(hrs) + " " + T.unit_hours + ")" : ""),
        M.advice + ": " + (rec ? rec[0] + " (" + nf(rec[1]) + " " + T.unit_h + ")" : M.over), M.opts + ": " + (optLabels.length ? optLabels.join("; ") : M.none), M.buy + ": " + buyLabel];
      var who = [];
      if (bakEl.value.trim()) who.push(M.bakery + ": " + bakEl.value.trim());
      if (nameEl.value.trim()) who.push(M.name + ": " + nameEl.value.trim());
      if (phoneEl.value.trim()) who.push(M.phone + ": " + phoneEl.value.trim());
      if (who.length) { lines.push(""); lines = lines.concat(who); }
      lines.push("", M.thanks, "", M.greet);
      var body = lines.join("\n"); textEl.value = body;
      mailEl.href = mailto(M.to, M.subject + ": " + (rec ? rec[0] + ", " : "") + nf(need) + " " + T.unit_h, body);
    }
    rootEl.addEventListener("input", render); rootEl.addEventListener("change", render);
    if (copyEl) copyEl.addEventListener("click", function () {
      function done() { copyLabel.textContent = T.copied; setTimeout(function () { copyLabel.textContent = T.copy; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textEl.value).then(done, function () { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); });
      else { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); }
    });
    safe(function () {
      var q = new URLSearchParams(location.search), v = parseFloat(q.get("per_uur") || q.get("per_hour"));
      if (v >= 300 && v <= 4000) hourEl.value = v;
    });
    render();
  }
  $$("[data-pk]").forEach(initPK);

  /* contact form -> drafted email */
  $$("[data-cform]").forEach(function (f) {
    var to = f.getAttribute("data-to"), a = $("[data-cmail]", f), dd = JSON.parse(f.getAttribute("data-mail"));
    function upd() {
      var v = function (n) { var i = f.elements[n]; return i ? i.value.trim() : ""; };
      var lines = [dd.hello, ""];
      if (v("interest")) lines.push(dd["for"] + ": " + v("interest"), "");
      if (v("message")) lines.push(v("message"), "");
      if (v("bakery")) lines.push(dd.bakery + ": " + v("bakery"));
      if (v("name")) lines.push(dd.name + ": " + v("name"));
      if (v("phone")) lines.push(dd.phone + ": " + v("phone"));
      lines.push("", dd.thanks, "", dd.greet);
      a.href = mailto(to, dd.subject, lines.join("\n"));
    }
    f.addEventListener("input", upd); f.addEventListener("change", upd); upd();
  });
})();
