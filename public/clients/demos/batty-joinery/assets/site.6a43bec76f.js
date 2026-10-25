(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

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
  if (dock && safe(function () { return sessionStorage.getItem("bj-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("bj-dock", "1"); }); });

  /* reveals (once), with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (n) { if (io) io.observe(n); else activate(n); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (n) { if (!n.classList.contains("is-in") && n.getBoundingClientRect().top < vh * 0.96) activate(n); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* project filter */
  $$("[data-filter]").forEach(function (f) {
    var grid = $("[data-pj]");
    function apply() {
      var c = $("input:checked", f), k = c ? c.value : "all";
      $$(".pjw", grid).forEach(function (w) { w.hidden = !(k === "all" || (w.getAttribute("data-tags") || "").split(" ").indexOf(k) >= 0); });
    }
    f.addEventListener("change", apply); apply();
  });

  /* projects strip arrows */
  $$("[data-strip]").forEach(function (st) {
    var sec = st.parentNode, prev = $("[data-prev]", sec), next = $("[data-next]", sec);
    function by(dir) { var c = st.firstElementChild; var w = c ? c.getBoundingClientRect().width + 16 : 300; st.scrollBy({ left: dir * w * 2, behavior: reduce ? "auto" : "smooth" }); }
    if (prev) prev.addEventListener("click", function () { by(-1); });
    if (next) next.addEventListener("click", function () { by(1); });
  });

  /* ------------------------------------------------ plan your joinery */
  function mailto(to, subject, body) {
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A");
  }
  var ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function initTool(root_) {
    var D = JSON.parse($("[data-tooldata]", root_).textContent), L = D.labels, pid = root_.getAttribute("data-pid");
    var kindWait = $("[data-kindwait]", root_), kindsEl = $("[data-kinds]", root_), resEl = $("[data-result]", root_), enq = $("[data-enq]", root_);
    var textEl = $("[data-text]", enq), mailEl = $("[data-mail]", enq), copyEl = $("[data-copy]", enq), copyLabel = $("[data-copylabel]", enq);
    var placeEl = $("[data-place]", root_), nameEl = $("[data-name]", root_), phoneEl = $("[data-phone]", root_);
    var shownFor = "", emptyHTML = resEl.innerHTML;
    function radio(name) { var c = $("input[name='" + pid + "-" + name + "']:checked", root_); return c ? c.value : ""; }
    function byKey(list, k) { for (var i = 0; i < list.length; i++) if (list[i].key === k) return list[i]; return null; }
    function labelOf(list, k) { for (var i = 0; i < list.length; i++) if (list[i][0] === k) return list[i][1]; return ""; }

    function fillKinds(what) {
      kindsEl.innerHTML = "";
      (D.kinds[what] || []).forEach(function (k, i) {
        var lab = el("label", "opt"), inp = el("input"), sp = el("span");
        inp.type = "radio"; inp.name = pid + "-kind"; inp.value = k.key;
        sp.appendChild(el("b", "", k.label)); lab.appendChild(inp); lab.appendChild(sp); kindsEl.appendChild(lab);
      });
      if (kindWait) kindWait.hidden = true;
    }
    function link(text, href) { var a = el("a", "tlink", text); a.href = href; a.insertAdjacentHTML("beforeend", ARROW); return a; }
    function section(h, node) { var w = el("div"); w.appendChild(el("h4", "", h)); w.appendChild(node); return w; }
    function list(items) { var u = el("ul"); items.forEach(function (t) { u.appendChild(el("li", "", t)); }); return u; }

    function render() {
      var what = radio("what"), kindKey = radio("kind"), bld = radio("bld");
      if (what && shownFor !== what) { fillKinds(what); shownFor = what; kindKey = ""; }
      var kind = what ? byKey(D.kinds[what] || [], kindKey) : null;
      resEl.innerHTML = ""; enq.hidden = true;
      if (!what) { resEl.innerHTML = emptyHTML; return; }
      if (!kind) { resEl.appendChild(el("p", "tool__empty", L.kind_pick)); return; }
      var res = el("div", "res");
      var lede = el("div", "res__lede"); lede.appendChild(el("b", "", kind.label)); lede.appendChild(el("p", "", kind.summary)); res.appendChild(lede);
      var links = el("div"), svc = D.pages[kind.service];
      if (kind.sub && D.subs[kind.sub]) links.appendChild(link(D.subs[kind.sub].title, D.subs[kind.sub].url));
      if (svc) links.appendChild(link(svc.title, svc.url));
      res.appendChild(section(L.service_h, links));
      var facts = kind.facts.slice();
      if (bld && D.bnotes[bld]) facts = facts.concat(D.bnotes[bld]);
      res.appendChild(section(L.facts_h, list(facts)));
      var tim = el("ul", "tim");
      kind.timbers.forEach(function (t) {
        var s = D.species[t]; if (!s) return;
        var li = el("li"), b = el("b"), a = el("a", "inl", s.name); a.href = s.url; b.appendChild(a); li.appendChild(b); li.appendChild(el("span", "", s.text)); tim.appendChild(li);
      });
      res.appendChild(section(L.timbers_h, tim));
      var mini = el("div", "mini");
      kind.projects.forEach(function (k) {
        var p = D.projects[k]; if (!p) return;
        var a = el("a"); a.href = p.url;
        var im = el("img"); im.src = p.img; im.width = p.w; im.height = p.h; im.alt = D.alts[k] || p.name; im.loading = "lazy"; a.appendChild(im); a.appendChild(el("span", "", p.name)); mini.appendChild(a);
      });
      res.appendChild(section(L.projects_h, mini));
      resEl.appendChild(res);

      var M = D.mail, bl = bld ? labelOf(D.buildings, bld) : "";
      var timNames = kind.timbers.map(function (t) { return D.species[t] ? D.species[t].name : t; });
      var wl = byKey(D.whats, what);
      var lines = [M.hello, "", M.intro, "", M.what + ": " + (wl ? wl.label : what), M.kind + ": " + kind.label];
      if (bl) lines.push(M.building + ": " + bl);
      lines.push(M.timbers + ": " + timNames.join(", "));
      if (placeEl.value.trim()) lines.push(M.place + ": " + placeEl.value.trim());
      if (nameEl.value.trim() || phoneEl.value.trim()) { lines.push(""); if (nameEl.value.trim()) lines.push(M.name + ": " + nameEl.value.trim()); if (phoneEl.value.trim()) lines.push(M.phone + ": " + phoneEl.value.trim()); }
      lines.push("", M.thanks);
      var body = lines.join("\n");
      textEl.value = body; enq.hidden = false;
      mailEl.href = mailto(D.to, M.subject + ": " + kind.label, body);
    }
    root_.addEventListener("input", render);
    root_.addEventListener("change", function (ev) {
      render();
      if (ev.target && /-kind$/.test(ev.target.name) && window.innerWidth < 1000) {
        safe(function () { resEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
      }
    });
    if (copyEl) copyEl.addEventListener("click", function () {
      function done() { copyLabel.textContent = L.copied; setTimeout(function () { copyLabel.textContent = L.copy; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(textEl.value).then(done, function () { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); });
      else { textEl.select(); safe(function () { d.execCommand("copy"); }); done(); }
    });
    /* preselect from the query string: ?what=windows&kind=sash&bld=period */
    safe(function () {
      var q = new URLSearchParams(location.search), w = q.get("what");
      if (w) { var r = $("input[name='" + pid + "-what'][value='" + w + "']", root_); if (r) { r.checked = true; fillKinds(w); shownFor = w; } }
      var k = q.get("kind"); if (k) { var r2 = $("input[name='" + pid + "-kind'][value='" + k + "']", root_); if (r2) r2.checked = true; }
      var b = q.get("bld"); if (b) { var r3 = $("input[name='" + pid + "-bld'][value='" + b + "']", root_); if (r3) r3.checked = true; }
    });
    render();
  }
  $$("[data-tool]").forEach(initTool);

  /* contact form -> drafted email */
  $$("[data-cform]").forEach(function (f) {
    var to = f.getAttribute("data-to"), a = $("[data-cmail]", f);
    function upd() {
      var v = function (n) { var i = f.elements[n]; return i ? i.value.trim() : ""; };
      var lines = ["Hello Batty Joinery,", ""];
      if (v("message")) lines.push(v("message"), "");
      if (v("name")) lines.push("Name: " + v("name"));
      if (v("company")) lines.push("Company: " + v("company"));
      if (v("phone")) lines.push("Phone: " + v("phone"));
      a.href = mailto(to, "Enquiry from the website", lines.join("\n"));
    }
    f.addEventListener("input", upd); upd();
  });
})();
