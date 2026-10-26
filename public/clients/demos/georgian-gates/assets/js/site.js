(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* concept strip */
  var cs = $("#concept");
  if (cs) {
    try { if (sessionStorage.getItem("gg-concept") === "1") cs.hidden = true; } catch (e) {}
    var cb = $("[data-dismiss]", cs);
    if (cb) cb.addEventListener("click", function () { cs.hidden = true; try { sessionStorage.setItem("gg-concept", "1"); } catch (e) {} });
  }

  /* drawer */
  var drawer = $("#drawer"), burger = $(".burger");
  if (drawer && burger) {
    var closeBtn = $(".drawer__x", drawer), lastFocus = null;
    var open = function () { lastFocus = d.activeElement; drawer.classList.add("is-open"); burger.setAttribute("aria-expanded", "true"); root.style.overflow = "hidden"; setTimeout(function () { closeBtn.focus(); }, 60); };
    var close = function () { drawer.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); root.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
    burger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", close); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) close(); });
    matchMedia("(min-width:1100px)").addEventListener && matchMedia("(min-width:1100px)").addEventListener("change", function (m) { if (m.matches && drawer.classList.contains("is-open")) close(); });
  }

  /* reveals */
  var rvs = $$(".rv");
  function reveal(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) rvs.forEach(reveal);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { reveal(x.target); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rvs.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) reveal(el); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* hero: the four photos of their current slider, same order */
  var hero = $(".hero");
  if (hero) {
    var imgs = $$(".hero__slides img", hero), btns = $$(".pager button", hero), cur = 0, timer = null, loaded = false;
    var loadRest = function () {
      if (loaded) return; loaded = true;
      imgs.forEach(function (im) { if (im.dataset.src) { if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; } });
    };
    var show = function (i) {
      loadRest(); cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle("is-on", k === i); });
      btns.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
    };
    btns.forEach(function (b, i) { b.addEventListener("click", function () { stop(); show(i); }); });
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () { if (reduce || timer) return; timer = setInterval(function () { if (d.hidden) return; if (cur === imgs.length - 1) { show(0); stop(); } else show(cur + 1); }, 6500); };
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1500); };
    addEventListener("load", function () { idle(function () { loadRest(); start(); }); });
    hero.addEventListener("pointerenter", stop);
  }

  /* lightbox */
  var lb = $("#lb");
  if (lb) {
    var lbImg = $("img", lb), gal = [], gi = 0, lastBtn = null;
    var setLb = function (i) { gi = (i + gal.length) % gal.length; lbImg.src = gal[gi].full; lbImg.alt = gal[gi].alt; };
    var openLb = function (list, i, btn) { gal = list; lastBtn = btn; setLb(i); lb.classList.add("is-open"); root.style.overflow = "hidden"; $(".x", lb).focus(); };
    var closeLb = function () { lb.classList.remove("is-open"); root.style.overflow = ""; lbImg.removeAttribute("src"); if (lastBtn) lastBtn.focus(); };
    $$("[data-gal]").forEach(function (g) {
      var bs = $$("button", g), list = bs.map(function (b) { var im = $("img", b); return { full: b.dataset.full, alt: im ? im.alt : "" }; });
      bs.forEach(function (b, i) { b.addEventListener("click", function () { openLb(list, i, b); }); });
    });
    $(".x", lb).addEventListener("click", closeLb);
    $(".p", lb).addEventListener("click", function () { setLb(gi - 1); });
    $(".n", lb).addEventListener("click", function () { setLb(gi + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    d.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") setLb(gi - 1); else if (e.key === "ArrowRight") setLb(gi + 1);
    });
  }

  /* contact form -> pre-filled email */
  var form = $("#enq-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var f = form.elements, body = "Name: " + f.first.value + " " + f.last.value + "\nEmail: " + f.email.value + "\nPhone: " + f.phone.value +
        (f.company.value ? "\nCompany: " + f.company.value : "") + "\nHeard about us: " + f.heard.value + "\n\n" + f.message.value;
      location.href = "mailto:" + form.dataset.mailto + "?subject=" + encodeURIComponent("Website enquiry from " + f.first.value + " " + f.last.value) + "&body=" + encodeURIComponent(body);
    });
  }

  /* signature tool: Find your metalwork */
  var tool = $("[data-tool]"), dataEl = $("#tool-data");
  if (tool && dataEl) {
    var D = JSON.parse(dataEl.textContent), res = $("#result", tool), form2 = $("form", tool);
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var val = function (n) { var x = $('input[name="' + n + '"]:checked', tool); return x ? x.value : ""; };
    var steps = $$("[data-step]", tool);
    var shown = 1;
    var showStep = function (n) {
      steps.forEach(function (s) { if (+s.dataset.step <= n) s.classList.remove("step-hidden"); });
    };
    var update = function () {
      var need = val("need"), who = val("who");
      if (!need) { res.hidden = true; return; }
      showStep(who ? 4 : 2);
      if (who) showStep(4);
      // only offer options that apply to this need
      $$(".pill[data-needs]", tool).forEach(function (p) {
        var ns = p.dataset.needs, ok = !ns || ns.split(",").indexOf(need) > -1;
        p.style.display = ok ? "" : "none";
        if (!ok) { var inp = $("input", p); inp.checked = false; }
      });
      if (!who) { res.hidden = true; return; }
      var list = (who === "dev" && D.devMap[need]) ? D.devMap[need] : D.needs[need].products;
      var main = D.products[list[0]], also = list.slice(1);
      var opts = $$('input[name="opt"]:checked', tool).map(function (i) { return D.opts[i.value]; });
      var why = [];
      why.push(main.short);
      opts.forEach(function (o) { why.push(o.text); });
      D.whoText[who].forEach(function (t) { why.push(t); });
      var caseSlug = (main.cases && main.cases[0]) || null;
      if (!caseSlug) { for (var k = 0; k < also.length && !caseSlug; k++) { var a = D.products[also[k]]; if (a.cases && a.cases[0]) caseSlug = a.cases[0]; } }
      var ca = caseSlug ? D.cases[caseSlug] : null;
      var f = function (n) { var x = $('input[name="' + n + '"]', tool); return x ? x.value.trim() : ""; };
      var lines = ["Hello Georgian Gates,", "", "I would like a quote for: " + D.needs[need].label, "Best-fit service: " + main.name, "This is for: " + D.who[who]];
      if (opts.length) { lines.push("What matters to me:"); opts.forEach(function (o) { lines.push("- " + o.label); }); }
      if (f("size")) lines.push("Approx. size / units: " + f("size"));
      if (f("where")) lines.push("Location: " + f("where"));
      if (f("when")) lines.push("Needed by: " + f("when"));
      lines.push("", "Please could you arrange a site survey and quotation.", "", "Name:", "Phone:");
      var text = lines.join("\n");
      var mail = "mailto:" + D.email + "?subject=" + encodeURIComponent("Quote request: " + D.needs[need].label) + "&body=" + encodeURIComponent(text);
      res.innerHTML =
        '<div class="res"><div class="res__main"><div><p class="res__lab">Best fit</p><h3>' + esc(main.name) + '</h3></div>' +
        '<div class="res__img"><img src="' + main.img + '" width="' + main.w + '" height="' + main.h + '" alt="' + esc(main.name) + ', a Georgian Gates installation" loading="lazy"></div>' +
        '<a class="link-arrow" href="' + main.url + '">See ' + esc(main.name) + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        (also.length ? '<div><p class="res__lab">Also worth a look</p><div class="res__also">' + also.map(function (s) { return '<a class="link-arrow" href="' + D.products[s].url + '">' + esc(D.products[s].name) + '</a>'; }).join("") + '</div></div>' : '') +
        '<div><p class="res__lab">Why it fits</p><ul class="why">' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join("") + '</ul></div>' +
        (ca ? '<a class="res__case" href="' + ca.url + '"><img src="' + ca.img + '" width="96" height="72" alt="" loading="lazy"><span><small>From their own work</small><b>' + esc(ca.client) + ', ' + esc(ca.place) + '</b><small>' + esc(ca.title) + '</small></span></a>' : '') +
        '</div>' +
        '<div class="enq"><p class="res__lab" style="color:var(--tan)">Your enquiry, ready to send</p><pre>' + esc(text) + '</pre>' +
        '<div class="row"><a class="btn" href="' + mail + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>Email this enquiry</a>' +
        '<a class="btn btn--ghost" href="' + D.tel + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>' + esc(D.phone) + '</a></div>' +
        '<small>' + esc(D.note) + '</small></div></div>' +
        '<p style="margin:14px 0 0"><button class="tool__reset" type="button">Start again</button></p>';
      res.hidden = false;
      var rb = $(".tool__reset", res);
      rb.addEventListener("click", function () {
        $$("input", form2).forEach(function (i) { if (i.type === "radio" || i.type === "checkbox") i.checked = false; else i.value = ""; });
        steps.forEach(function (s) { s.classList.add("step-hidden"); });
        res.hidden = true; res.innerHTML = "";
        $$(".pill[data-needs]", tool).forEach(function (p) { p.style.display = ""; });
        tool.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    };
    var firstNeed = true;
    form2.addEventListener("change", function (e) {
      update();
      if (e.target.name === "need") { var s2 = $('[data-step="2"] legend', tool); if (s2) s2.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }
      if (e.target.name === "who") { var r = res; if (!r.hidden) setTimeout(function () { var s3 = $('[data-step="3"] legend', tool); if (s3) s3.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }, 50); }
    });
    form2.addEventListener("input", function (e) { if (e.target.type === "text") update(); });
    // deep link: ?need=balcony
    try { var q = new URLSearchParams(location.search).get("need"); if (q) { var r0 = $('input[name="need"][value="' + q + '"]', tool); if (r0) { r0.checked = true; update(); } } } catch (e) {}
  }
})();
