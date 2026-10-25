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
  window.addEventListener("resize", function () { if (window.innerWidth >= 980) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("bee-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("bee-dock", "1"); }); });

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

  /* timeline progress line */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* hero: gentle parallax on wide screens only */
  var hb = $("[data-parallax]");
  if (hb && !reduce) {
    var ticking = false;
    function par() {
      ticking = false;
      if (window.innerWidth < 900) { hb.style.transform = ""; return; }
      var h = hb.parentElement.offsetHeight, y = Math.min(window.scrollY, h) * 0.1;
      hb.style.transform = "translate3d(0," + Math.min(y, h * 0.055).toFixed(1) + "px,0)";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
    window.addEventListener("resize", par);
  }

  /* ------------------------------------------------ contact form -> drafted email */
  var cf = $("#cform");
  if (cf) {
    var cd = JSON.parse($("#cform-data").textContent);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { var el = d.getElementById(id); return el ? el.value.trim() : ""; };
      var L = cd.labels, lines = [L.name + ": " + v("name"), L.company + ": " + v("company"), L.phone + ": " + v("phone"), L.email + ": " + v("email"), "", v("msg")];
      window.location.href = "mailto:" + cd.to + "?subject=" + encodeURIComponent(cd.subject) + "&body=" + encodeURIComponent(lines.join("\r\n"));
    });
  }

  /* ------------------------------------------------ the enquiry helper: which BEE service do I need? */
  var hEl = $("[data-helper]");
  if (hEl) (function () {
    var D = JSON.parse($("#helper-data").textContent), UI = D.ui;
    var out = $("[data-out]", hEl), form = $(".hf", hEl);
    function h(tag, attrs, kids) {
      var el = d.createElement(tag);
      if (attrs) for (var k in attrs) { if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]); }
      (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? d.createTextNode(c) : c); });
      return el;
    }
    function svgIcon(path) {
      var s = d.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
      s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
      var p = d.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", path); s.appendChild(p); return s;
    }
    var P_PHONE = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z", P_MAIL = "M3 5h18v14H3zM3 7l9 6 9-6", P_PIN = "M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10zM12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z";

    function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
    function vals(name) { return $$('input[name="' + name + '"]:checked', form).map(function (x) { return x.value; }); }
    function txt(id) { var el = d.getElementById(id); return el ? el.value.trim() : ""; }
    function find(arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i].key === k) return arr[i]; return null; }

    function compute() {
      var vessel = val("vessel"), jobs = vals("job"), where = val("where") || "unsure", when = val("when") || "soon";
      return { vessel: vessel, jobs: jobs, where: where, when: when };
    }

    function render() {
      var s = compute();
      out.textContent = "";
      if (!s.vessel || !s.jobs.length) { out.appendChild(h("p", { "class": "hout__empty", text: UI.res_empty })); return; }
      var jobObjs = s.jobs.map(function (k) { return find(D.jobs, k); }).filter(Boolean);
      var keys = [];
      function add(k) { if (k && keys.indexOf(k) < 0 && D.services[k]) keys.push(k); }
      if (s.when === "now") add("service-support");
      jobObjs.forEach(function (j) { j.services.forEach(add); });
      if (D.leisure_vessels.indexOf(s.vessel) >= 0) add("leisure");
      var region = find(D.regions, s.where) || D.regions[0];
      var base = D.bases[region.base];

      /* fits */
      var fit = h("section", null, [h("h3", { text: UI.res_fit })]);
      var list = h("div", { "class": "fitlist" });
      keys.forEach(function (k) {
        var sv = D.services[k];
        list.appendChild(h("a", { "class": "fit", href: sv.url }, [h("b", { text: sv.title }), h("span", { text: sv.fit }), h("em", { text: UI.res_page })]));
      });
      fit.appendChild(list);
      var notes = h("ul", { "class": "hnotes" });
      if (s.when === "now") notes.appendChild(h("li", { text: UI.res_urgent }));
      if (s.jobs.indexOf("survey") >= 0) notes.appendChild(h("li", { text: UI.res_survey }));
      if (s.jobs.indexOf("service") >= 0 || s.when === "now") notes.appendChild(h("li", { text: UI.res_spares }));
      if (D.leisure_vessels.indexOf(s.vessel) >= 0) notes.appendChild(h("li", { text: UI.res_leisure }));
      if (s.where === "abroad") notes.appendChild(h("li", { text: UI.res_abroad }));
      if (notes.children.length) fit.appendChild(notes);
      out.appendChild(fit);

      /* base */
      var bsec = h("section", { "class": "hbase" }, [h("h3", { text: UI.res_base })]);
      bsec.appendChild(h("p", { "class": "co", text: base.company }));
      bsec.appendChild(h("address", null, [h("p", { text: base.addr.join(", ") })]));
      if (base.phone && base.phone.replace(/ /g, "") !== D.main_phone.replace(/ /g, "")) bsec.appendChild(h("p", { "class": "bp", text: UI.res_base_phone + ": " + base.phone }));
      var map = h("a", { "class": "hmap", href: base.map, target: "_blank", rel: "noopener" }, [svgIcon(P_PIN), h("span", { text: base.name })]);
      bsec.appendChild(map);
      region.also.forEach(function (k) {
        var b2 = D.bases[k]; if (!b2) return;
        bsec.appendChild(h("p", { "class": "bp", text: b2.company + ", " + b2.addr.join(", ") + (b2.phone ? " (" + b2.phone + ")" : "") }));
      });
      out.appendChild(bsec);

      /* draft */
      var L = UI.mail_labels, vessel = D.vessels[s.vessel] || s.vessel;
      var jobsTxt = jobObjs.map(function (j) { return j.label; }).join("; ");
      var subj = UI.mail_subject.replace("{jobs}", jobObjs.map(function (j) { return j.short; }).join(", ")).replace("{vessel}", vessel);
      var lines = [UI.mail_hello, "", UI.mail_intro, "",
        L.vessel + ": " + vessel];
      if (txt("h-vessel")) lines.push(L.name + ": " + txt("h-vessel"));
      lines.push(L.jobs + ": " + jobsTxt, L.where + ": " + region.label, L.when + ": " + (D.whens[s.when] || s.when), L.base + ": " + base.name);
      if (txt("h-name")) lines.push(L.who + ": " + txt("h-name"));
      if (txt("h-phone")) lines.push(L.phone + ": " + txt("h-phone"));
      lines.push("", UI.mail_sig);
      var body = lines.join("\n");
      var mailto = "mailto:" + D.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(lines.join("\r\n"));
      var enq = h("section", null, [h("h3", { text: UI.res_enq }), h("pre", { "class": "draft", text: "Subject: " + subj + "\n\n" + body })]);
      var callBtn = h("a", { "class": "btn", href: D.main_tel }, [svgIcon(P_PHONE), h("span", { text: UI.res_call + " " + D.main_phone })]);
      var mailBtn = h("a", { "class": "btn" + (s.when === "now" ? " btn--ghost" : ""), href: mailto }, [svgIcon(P_MAIL), h("span", { text: UI.res_email })]);
      var copyBtn = h("button", { "class": "btn btn--ghost", type: "button" }, [h("span", { text: UI.res_copy })]);
      copyBtn.addEventListener("click", function () {
        var t = "Subject: " + subj + "\n\n" + body;
        function done() { copyBtn.firstChild.textContent = UI.res_copied; setTimeout(function () { copyBtn.firstChild.textContent = UI.res_copy; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {});
        else { var ta = h("textarea", { "aria-hidden": "true" }); ta.value = t; d.body.appendChild(ta); ta.select(); safe(function () { d.execCommand("copy"); }); ta.remove(); done(); }
      });
      var acts = h("div", { "class": "hacts" + (s.when === "now" ? " hacts--urgent" : "") }, s.when === "now" ? [callBtn, mailBtn, copyBtn] : [mailBtn, callBtn, copyBtn]);
      enq.appendChild(acts);
      out.appendChild(enq);
    }

    form.addEventListener("change", render);
    form.addEventListener("input", function (e) { if (e.target && e.target.type !== "radio" && e.target.type !== "checkbox") render(); });

    /* presets from the URL (service pages link here) */
    var qs = new URLSearchParams(location.search);
    function pick(name, v) { var el = form.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (el) el.checked = true; }
    if (qs.get("job")) pick("job", qs.get("job"));
    if (qs.get("vessel")) pick("vessel", qs.get("vessel"));
    render();
  })();
})();
