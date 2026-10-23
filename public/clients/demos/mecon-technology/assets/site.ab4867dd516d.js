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
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("mecon-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("mecon-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(n) { n.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (n) { if (io) io.observe(n); else activate(n); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (n) { if (!n.classList.contains("is-in") && n.getBoundingClientRect().top < vh * 0.96) activate(n); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* story: swap the pinned photo as each real machine chapter passes the middle of the screen */
  var stage = $(".stage"), chaps = $$(".chap"), stageItems = $$(".stage__i");
  if (stage && chaps.length) {
    var cur = -1;
    var pick = function () {
      if (getComputedStyle(stage).display === "none") return;
      var mid = window.innerHeight * 0.5, best = 0, bd = 1e9;
      chaps.forEach(function (c, i) { var r = c.getBoundingClientRect(), dd = Math.abs((r.top + r.bottom) / 2 - mid); if (dd < bd) { bd = dd; best = i; } });
      if (best !== cur) { cur = best; stageItems.forEach(function (s, i) { s.classList.toggle("is-on", i === best); }); }
    };
    ["scroll", "resize", "load"].forEach(function (ev) { window.addEventListener(ev, pick, { passive: true }); });
    pick();
  }

  /* ------------------------------------------------ the finder: Mecon's own models, filtered */
  var fEl = $("[data-finder]");
  if (fEl) (function () {
    var data = JSON.parse($("#finder-data").textContent), ui = data.ui;
    if (!data.machines) data.machines = $$(".mcard", fEl).map(function (c) {
      var sp = function (v) { return (v || "").split(" ").filter(Boolean); };
      return { id: c.id, m: sp(c.getAttribute("data-mat")), u: parseInt(c.getAttribute("data-u"), 10), w: sp(c.getAttribute("data-work")), f: c.getAttribute("data-fam"), p: parseFloat(c.getAttribute("data-p")), n: c.getAttribute("data-n") };
    });
    var isPage = fEl.hasAttribute("data-page"), limit = parseInt(fEl.getAttribute("data-limit") || "0", 10);
    var sMat = $('[data-f="mat"]', fEl), sWork = $('[data-f="work"]', fEl), rBud = $('[data-f="bud"]', fEl), out = $("[data-out]", fEl);
    var countEl = $("[data-count]", fEl), noneEl = $("[data-none]", fEl), reset = $("[data-reset]", fEl), qEl = $("[data-q]", fEl);
    var moreA = $("[data-more]", fEl), chips = $$(".chip", fEl);
    var st = { mat: "any", work: "any", bud: parseFloat(rBud.max), fam: "all", q: "" };
    var maxBud = parseFloat(rBud.max);

    function ok(m) {
      if (st.mat !== "any" && m.m.indexOf(st.mat) < 0) return false;
      if (st.work !== "any" && m.w.indexOf(st.work) < 0) return false;
      if (m.p > st.bud * 100000 + 1) return false;
      if (st.fam !== "all" && m.f !== st.fam) return false;
      if (st.q && m.n.toLowerCase().indexOf(st.q) < 0) return false;
      return true;
    }
    function lakhLabel(v) { return "₹" + (v % 1 ? v.toFixed(1) : v) + " lakh"; }
    function qs() {
      var p = [];
      if (st.mat !== "any") p.push("mat=" + st.mat);
      if (st.work !== "any") p.push("work=" + st.work);
      if (st.bud < maxBud) p.push("bud=" + st.bud);
      if (st.fam !== "all") p.push("fam=" + st.fam);
      if (st.q) p.push("q=" + encodeURIComponent(st.q));
      return p.length ? "?" + p.join("&") : "";
    }
    function card(m) {
      var li = el("li", "rcard"), a = el("a"); a.href = data.machines_url + "#" + m.id;
      var im = el("div", "rcard__img"), img = new Image();
      img.src = m.i[m.i.length - 1][0]; img.srcset = m.i.map(function (x) { return x[0] + " " + x[1] + "w"; }).join(", ");
      img.sizes = "(min-width: 900px) 30vw, (min-width: 560px) 46vw, 92vw"; img.width = m.iw; img.height = m.ih; img.alt = m.n; img.loading = "lazy"; img.decoding = "async";
      im.appendChild(img);
      var t = el("div", "rcard__t");
      t.appendChild(el("h3", "h4", m.n)); if (m.s) t.appendChild(el("p", "rcard__s mono", m.s));
      var pr = el("p", "rcard__pr"); pr.appendChild(el("span", "mono", m.l)); pr.appendChild(d.createTextNode(" ")); pr.appendChild(el("small", "", data.listed)); t.appendChild(pr);
      var r = el("span", "ruler"); r.setAttribute("role", "img"); r.setAttribute("aria-label", ui.scale); r.style.setProperty("--pos", m.pos); r.appendChild(el("i")); t.appendChild(r);
      a.appendChild(im); a.appendChild(t); li.appendChild(a); return li;
    }
    function render() {
      var list = data.machines.filter(ok), total = data.machines.length, dflt = st.mat === "any" && st.work === "any" && st.bud >= maxBud;
      if (!isPage && dflt && data.pop) list = data.machines.filter(function (m) { return data.pop.indexOf(m.id) > -1; });
      if (out) out.textContent = lakhLabel(st.bud);
      if (countEl) countEl.textContent = (!isPage && dflt && data.pop ? ui.popular : ui.count).replace("{n}", list.length).replace("{total}", total);
      if (noneEl) noneEl.hidden = list.length > 0;
      if (isPage) {
        var ids = {}; list.forEach(function (m) { ids[m.id] = 1; });
        $$(".mcard", fEl).forEach(function (c) { c.hidden = !ids[c.id]; });
        chips.forEach(function (c) { var on = c.getAttribute("data-fam") === st.fam; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
        safe(function () { history.replaceState(null, "", location.pathname + qs() + location.hash); });
      } else {
        var box = $("[data-results]", fEl); box.textContent = "";
        list.slice(0, limit || 6).forEach(function (m) { box.appendChild(card(m)); });
        if (moreA) { moreA.href = data.machines_url + qs() + "#all"; moreA.hidden = list.length === 0; }
      }
    }
    sMat.addEventListener("change", function () { st.mat = sMat.value; render(); });
    sWork.addEventListener("change", function () { st.work = sWork.value; render(); });
    rBud.addEventListener("input", function () { st.bud = parseFloat(rBud.value); render(); });
    if (reset) reset.addEventListener("click", function () {
      st = { mat: "any", work: "any", bud: maxBud, fam: "all", q: "" };
      sMat.value = "any"; sWork.value = "any"; rBud.value = maxBud; if (qEl) qEl.value = ""; render();
    });
    if (qEl) qEl.addEventListener("input", function () { st.q = qEl.value.trim().toLowerCase(); render(); });
    chips.forEach(function (c) { c.addEventListener("click", function () { st.fam = c.getAttribute("data-fam"); render(); }); });
    safe(function () {
      var p = new URLSearchParams(location.search);
      if (p.get("mat")) { st.mat = p.get("mat"); sMat.value = st.mat; if (sMat.value !== st.mat) { st.mat = "any"; sMat.value = "any"; } }
      if (p.get("work")) { st.work = p.get("work"); sWork.value = st.work; if (sWork.value !== st.work) { st.work = "any"; sWork.value = "any"; } }
      if (p.get("bud")) { var b = parseFloat(p.get("bud")); if (b >= 3 && b <= maxBud) { st.bud = b; rBud.value = b; } }
      if (p.get("fam")) st.fam = p.get("fam");
      if (p.get("q") && qEl) { st.q = p.get("q").toLowerCase(); qEl.value = p.get("q"); }
    });
    render();
  })();

  /* machine cards: details open in place */
  function toggleCard(card, open) {
    var btn = $(".mcard__btn", card), panel = $(".mcard__d", card);
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    $("span", btn).textContent = btn.getAttribute(open ? "data-close" : "data-open");
    panel.hidden = !open; card.classList.toggle("is-open", open);
  }
  $$(".mcard").forEach(function (c) {
    var b = $(".mcard__btn", c);
    if (b) b.addEventListener("click", function () { toggleCard(c, b.getAttribute("aria-expanded") !== "true"); });
  });
  function openFromHash() {
    var id = location.hash.slice(1); if (!id) return;
    var c = d.getElementById(id);
    if (c && c.classList.contains("mcard")) { c.hidden = false; toggleCard(c, true); setTimeout(function () { c.scrollIntoView({ block: "start" }); }, 60); }
  }
  openFromHash(); window.addEventListener("hashchange", openFromHash);

  /* enquiry: write the email, open the mail app */
  var enq = $("[data-enq]");
  if (enq) {
    var names = JSON.parse($("#enq-names").textContent), sel = $("#e-m", enq);
    safe(function () { var m = new URLSearchParams(location.search).get("m"); if (m && names[m]) sel.value = m; });
    enq.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = function (n) { return (enq.elements[n] && enq.elements[n].value || "").trim(); };
      var machine = names[sel.value] || "";
      var sub = machine ? enq.getAttribute("data-sub").replace("{m}", machine) : enq.getAttribute("data-subn");
      var lines = [];
      if (machine) lines.push("Machine: " + machine);
      if (f("name")) lines.push("Name: " + f("name"));
      if (f("company")) lines.push("Company: " + f("company"));
      if (f("city")) lines.push("City: " + f("city"));
      if (f("phone")) lines.push("Phone: " + f("phone"));
      if (f("note")) lines.push("", f("note"));
      location.href = "mailto:" + enq.getAttribute("data-to") + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
