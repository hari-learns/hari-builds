(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

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
  if (dock && safe(function () { return sessionStorage.getItem("ccm-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("ccm-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv, [data-weeks]");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (n) { if (io) io.observe(n); else activate(n); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (n) { if (!n.classList.contains("is-in") && n.getBoundingClientRect().top < vh * 0.96) activate(n); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* process: the sticky photo follows the step in view */
  $$(".proc").forEach(function (p) {
    var steps = $$(".step", p), imgs = $$(".proc__imgs img", p);
    function on(i) { steps.forEach(function (s, j) { s.classList.toggle("is-on", j === i); }); imgs.forEach(function (m, j) { m.classList.toggle("is-on", j === i); }); }
    on(0);
    if (!("IntersectionObserver" in window)) return;
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) on(steps.indexOf(en.target)); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    steps.forEach(function (s) { so.observe(s); });
  });

  /* lightbox */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") {
    var items = $$("[data-lb]"), cur = 0, li = $("#lb-i"), ln = $("#lb-n");
    function show(i) {
      cur = (i + items.length) % items.length; var b = items[cur];
      li.src = b.getAttribute("data-lb"); li.alt = b.getAttribute("data-alt"); li.width = +b.getAttribute("data-w"); li.height = +b.getAttribute("data-h");
      ln.textContent = (cur + 1) + " / " + items.length;
    }
    items.forEach(function (b, i) { b.addEventListener("click", function () { show(i); lb.showModal(); root.style.overflow = "hidden"; }); });
    $("#lb-x").addEventListener("click", function () { lb.close(); });
    $("#lb-p").addEventListener("click", function () { show(cur - 1); });
    $("#lb-nx").addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("close", function () { root.style.overflow = ""; });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  }

  /* mailto helper */
  function mailto(to, subject, body) { return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); }

  /* contact form -> pre-filled email */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements, scope = $$("input[name=scope]:checked", cf).map(function (x) { return x.value; });
    var type = ($("input[name=type]:checked", cf) || {}).value || "", dsg = ($("input[name=design]:checked", cf) || {}).value || "";
    var body = ["Name: " + f.name.value, "Email: " + f.email.value, "Phone: " + f.phone.value, "Address: " + f.address.value,
      "Project type: " + type, "Project scope: " + scope.join(", "), "Design: " + dsg, "", f.msg.value].join("\n");
    location.href = mailto(cf.getAttribute("data-mail"), cf.getAttribute("data-subject") + ": " + type, body);
  });

  /* signature tool: plan my project */
  var form = $("#plan"), dataEl = $("#plan-data");
  if (form && dataEl) {
    var D = JSON.parse(dataEl.textContent), T = D.t, out = $("#out-b");
    var fs = {}; ["std", "whl", "any"].forEach(function (k) { fs[k] = $$('[data-for="' + k + '"]', form); });
    function val(n) { var x = $("input[name=" + n + "]:checked", form); return x ? x.value : ""; }
    function row(dl, k, v, cls) { var r = el("div"); r.appendChild(el("dt", "", k)); var dd = el("dd", cls || "", v); r.appendChild(dd); dl.appendChild(r); }
    function render() {
      var type = val("type"), whl = type === "wholesale";
      fs.std.forEach(function (n) { n.hidden = !type || whl; });
      fs.whl.forEach(function (n) { n.hidden = !whl; });
      fs.any.forEach(function (n) { n.hidden = !type; });
      var nn = $("[data-n]", form); if (nn) nn.textContent = whl ? "3" : "5";
      $$("[data-only=commercial]", form).forEach(function (c) {
        var show = type === "commercial"; c.hidden = !show; if (!show) { var i = $("input", c); if (i.checked) i.checked = false; }
      });
      out.textContent = "";
      if (!type) { out.appendChild(el("p", "", T.out_empty)); return; }
      var area = form.elements.area.value, dl = el("dl"), lines = [], subj = D.types[type];
      row(dl, "Project", D.types[type]); lines.push("Project type: " + D.types[type]);
      var inArea = area && area !== "__other";
      var areaTxt = !area ? "Not chosen yet" : (area === "__other" ? T.other_area : area);
      var steps = D.proc.map(function (s) { return [s[0], s[1]]; }), links = [];
      if (whl) {
        var it = val("item"), q = parseInt(form.elements.qty.value, 10), info = D.items[it];
        row(dl, "Product", info ? info.label : "Not chosen yet"); lines.push("Product: " + (info ? info.label : ""));
        if (info) {
          var meets = q >= info.min;
          row(dl, "Quantity", q ? q + " " + info.unit : "Not entered yet", q ? (meets ? "ok" : "warn") : "");
          if (q) row(dl, "Minimum", (meets ? T.meets : T.below), meets ? "ok" : "warn");
          lines.push("Quantity: " + (q ? q + " " + info.unit : "") + " (their minimum: " + info.min + " " + info.unit + ")");
          subj += ": " + info.label;
        }
        steps = [["Ask for the wholesale price", "Send this brief. They quote wholesale doors and spec books on request."]];
      } else {
        var needs = $$("input[name=need]:checked", form).map(function (x) { return x.value; });
        var nl = needs.map(function (k) { return D.needs[k].label; });
        row(dl, "Needs", nl.length ? nl.join(", ") : "Not chosen yet"); lines.push("Project scope: " + nl.join(", "));
        var mk = val("make"), dg = val("design");
        row(dl, "Made", mk ? D.make[mk] : "Not chosen yet"); lines.push("Make: " + (mk ? D.make[mk] : ""));
        row(dl, "Design", dg ? D.design[dg] : "Not chosen yet"); lines.push("Design: " + (dg ? D.design[dg] : ""));
        if (nl.length) subj += ": " + nl.join(", ");
        if (dg === "own") steps[1] = ["Send your design", T.own_next];
        if (dg === "theirs") steps[1] = ["Design & construction estimate", T.theirs_note];
        if (mk === "prefab") steps[0] = [steps[0][0], steps[0][1] + " " + T.prefab_note];
        var seen = {};
        needs.forEach(function (k) { var p = D.needs[k].page; if (p && !seen[p]) { seen[p] = 1; links.push([D.needs[k].label + ": photos", D.base + "/" + p + "/"]); } });
      }
      row(dl, "Area", areaTxt + (area ? (area === "__other" ? " " : " ") : ""), area ? (inArea ? "ok" : "warn") : "");
      if (area) row(dl, "Check", inArea ? T.in_area : T.out_area, inArea ? "ok" : "warn");
      lines.push("Area: " + areaTxt);
      out.appendChild(dl);
      out.appendChild(el("h3", "", T.next_h));
      var ol = el("ol"); steps.forEach(function (s) { var li = el("li"); li.appendChild(el("b", "", s[0] + ". ")); li.appendChild(d.createTextNode(s[1])); ol.appendChild(li); }); out.appendChild(ol);
      if (links.length) { var lw = el("div", "links"); links.forEach(function (l) { var a = el("a", "", l[0]); a.href = l[1]; lw.appendChild(a); }); out.appendChild(lw); }
      var body = lines.join("\n") + "\n\nName:\nPhone:\nProject address:\n\nSent from the redesign concept: plan my project.";
      var bw = el("div", "btns");
      var a1 = el("a", "btn", T.send); a1.href = mailto(D.email, T.subject + ": " + subj, body); bw.appendChild(a1);
      var a2 = el("a", "btn btn--ghost", T.call); a2.href = "tel:" + D.tel; bw.appendChild(a2);
      var b3 = el("button", "btn btn--ghost", T.copy); b3.type = "button";
      b3.addEventListener("click", function () {
        function ok() { b3.textContent = T.copied; setTimeout(function () { b3.textContent = T.copy; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(body).then(ok, ok); else ok();
      });
      bw.appendChild(b3); out.appendChild(bw);
      out.appendChild(el("p", "fine", T.disclaimer));
    }
    form.addEventListener("change", render); form.addEventListener("input", render); form.addEventListener("submit", function (e) { e.preventDefault(); });
    var q = new URLSearchParams(location.search);
    var t0 = q.get("type"); if (t0) { var r = $("input[name=type][value=" + t0 + "]", form); if (r) r.checked = true; }
    var n0 = q.get("need"); if (n0) { var rr = $("input[name=type][value=residential]", form); if (n0 === "commercial") rr = $("input[name=type][value=commercial]", form); if (!val("type") && rr) rr.checked = true; render(); var c0 = $("input[name=need][value=" + n0 + "]", form); if (c0) c0.checked = true; }
    var i0 = q.get("item"); if (i0) { var ri = $("input[name=item][value=" + i0 + "]", form); if (ri) ri.checked = true; }
    render();
  }
})();
