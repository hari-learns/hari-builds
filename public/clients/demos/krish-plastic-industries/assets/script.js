(function () {
  "use strict";
  var d = document, w = window, body = d.body, page = body.getAttribute("data-page");
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---------- storage (always guarded) ---------- */
  var mem = { basket: [], dock: "" };
  function store(k, v) { try { if (v === undefined) { var r = w.localStorage.getItem(k); return r === null ? null : r; } w.localStorage.setItem(k, v); } catch (e) { if (v === undefined) return null; } }
  function getBasket() { var r = store("kp-basket"); if (r === null) return mem.basket.slice(); try { var a = JSON.parse(r); return Array.isArray(a) ? a.map(String) : []; } catch (e) { return []; } }
  function setBasket(a) { mem.basket = a.slice(); store("kp-basket", JSON.stringify(a)); paintCount(); }
  function paintCount() {
    var n = getBasket().length;
    $$("[data-basket-count]").forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
  }
  paintCount();

  /* ---------- menu drawer ---------- */
  var drawer = $("#drawer"), burger = $(".burger"), xbtn = $(".drawer-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : "";
    if (open && xbtn) xbtn.focus(); else if (!open && burger && d.activeElement && drawer.contains(d.activeElement)) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (xbtn) xbtn.addEventListener("click", function () { setDrawer(false); });
  if (drawer) {
    drawer.addEventListener("click", function (e) { if (e.target === drawer) setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  }
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  w.addEventListener("resize", function () { if (w.innerWidth >= 900) setDrawer(false); });

  /* ---------- dock ---------- */
  var dock = $("#dock");
  if (dock) {
    var gone = false; try { gone = w.sessionStorage.getItem("kp-dock") === "1"; } catch (e) {}
    if (gone) dock.hidden = true;
    $(".dock-x", dock).addEventListener("click", function () { dock.hidden = true; try { w.sessionStorage.setItem("kp-dock", "1"); } catch (e) {} });
  }

  /* ---------- reveals (with a sweep that never strands content) ---------- */
  var rv = $$(".rv");
  rv.forEach(function (el, i) { el.style.setProperty("--i", String(i % 6)); });
  function sweep() { var vh = w.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) el.classList.add("in"); }); }
  if ("IntersectionObserver" in w) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---------- catalogue ---------- */
  if (page === "catalogue") {
    var cards = $$(".it"), qIn = $("#q"), nEl = $("#n"), emp = $("#empty"), grid = $("#igrid"), reset = $(".reset"), clr = $(".fq-x");
    var secBtns = $$("[data-s]"), matBtns = $$("[data-m]");
    var state = { q: "", s: "", m: "" };
    function norm(t) { return String(t).toLowerCase().replace(/(\d)\s*[x*×]\s*(?=\d)/g, "$1x").replace(/[^a-z0-9.\/" ]+/g, " ").replace(/\s+/g, " ").trim(); }
    var haystack = cards.map(function (c) { return norm(c.getAttribute("data-label") + " " + $(".it-t", c).textContent); });
    var secNames = {}; secBtns.forEach(function (b) { secNames[b.getAttribute("data-s")] = norm(b.textContent.replace(/\d+\s*$/, "")); });
    function apply() {
      var terms = norm(state.q).split(" ").filter(Boolean), shown = 0;
      cards.forEach(function (c, i) {
        var ok = (!state.s || c.getAttribute("data-sec") === state.s) && (!state.m || (" " + c.getAttribute("data-mat") + " ").indexOf(" " + state.m + " ") > -1);
        if (ok && terms.length) { var h = haystack[i] + " " + (secNames[c.getAttribute("data-sec")] || ""); ok = terms.every(function (t) { return h.indexOf(t) > -1; }); }
        c.hidden = !ok; if (ok) shown++;
      });
      nEl.textContent = shown; emp.hidden = shown !== 0; grid.hidden = shown === 0;
      var active = !!(state.q || state.s || state.m); reset.hidden = !active; clr.hidden = !state.q;
      secBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-s") === state.s); });
      matBtns.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-m") === state.m); });
      var wa = $("#empty-wa"); if (wa) wa.href = "https://wa.me/" + wa.getAttribute("data-wa") + "?text=" + encodeURIComponent(wa.getAttribute("data-wa-base") + (state.q || "(please describe)"));
      var p = []; if (state.q) p.push("q=" + encodeURIComponent(state.q)); if (state.s) p.push("s=" + state.s); if (state.m) p.push("m=" + state.m);
      try { history.replaceState(null, "", w.location.pathname + (p.length ? "?" + p.join("&") : "")); } catch (e) {}
    }
    var t0; qIn.addEventListener("input", function () { state.q = qIn.value; clearTimeout(t0); t0 = setTimeout(apply, 60); });
    qIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); qIn.blur(); } });
    secBtns.forEach(function (b) { b.addEventListener("click", function () { state.s = b.getAttribute("data-s"); apply(); }); });
    matBtns.forEach(function (b) { b.addEventListener("click", function () { state.m = b.getAttribute("data-m"); apply(); }); });
    reset.addEventListener("click", function () { state = { q: "", s: "", m: "" }; qIn.value = ""; apply(); });
    clr.addEventListener("click", function () { state.q = ""; qIn.value = ""; apply(); qIn.focus(); });
    (function init() {
      var P = new URLSearchParams(w.location.search);
      state.q = P.get("q") || ""; state.s = P.get("s") || ""; state.m = P.get("m") || ""; qIn.value = state.q; apply();
    })();
    function paintAdd() {
      var b = getBasket();
      cards.forEach(function (c) {
        var on = b.indexOf(c.getAttribute("data-id")) > -1, btn = $("[data-add]", c);
        c.classList.toggle("is-in", on); btn.setAttribute("aria-pressed", on ? "true" : "false"); btn.textContent = on ? "Added. Tap to remove" : "Add to enquiry";
      });
    }
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]"); if (!btn) return;
      var id = btn.closest(".it").getAttribute("data-id"), b = getBasket(), i = b.indexOf(id);
      if (i > -1) b.splice(i, 1); else b.push(id);
      setBasket(b); paintAdd();
    });
    paintAdd();
  }

  /* ---------- enquiry ---------- */
  if (page === "enquiry") {
    var IT = JSON.parse($("#idata").textContent), CF = JSON.parse($("#econf").textContent);
    var list = $("#elist"), eEmpty = $("#eempty"), eForm = $("#eform"), nm = $("#ename"), nt = $("#enote"), ewa = $("#e-wa"), em = $("#e-mail");
    var base = body.getAttribute("data-base");
    function message() {
      var b = getBasket(), L = ["Hello " + CF.name + ",", "I would like a quote for:"];
      if (b.length) b.forEach(function (id) { if (IT[id]) L.push("- " + IT[id][0] + " (brochure page " + IT[id][1] + ")"); }); else L.push("- (please tell me what you can supply)");
      if (nt.value.trim()) L.push("", "Notes: " + nt.value.trim());
      if (nm.value.trim()) L.push("", "From: " + nm.value.trim());
      return L.join("\n");
    }
    function links() {
      var m = message();
      ewa.href = "https://wa.me/" + CF.wa + "?text=" + encodeURIComponent(m);
      em.href = "mailto:" + CF.mail + "?subject=" + encodeURIComponent("Enquiry from the catalogue") + "&body=" + encodeURIComponent(m);
    }
    function render() {
      var b = getBasket().filter(function (id) { return IT[id]; });
      list.innerHTML = ""; eEmpty.hidden = b.length > 0; list.hidden = b.length === 0;
      b.forEach(function (id) {
        var li = d.createElement("li"), im = d.createElement("img"), t = d.createElement("div"), x = d.createElement("button");
        im.src = base + "/assets/img/t/" + ("00" + id).slice(-3) + ".webp"; im.alt = ""; im.width = 56; im.height = 56;
        t.className = "e-t"; t.textContent = IT[id][0]; var s = d.createElement("small"); s.textContent = "Brochure page " + IT[id][1]; t.appendChild(s);
        x.type = "button"; x.setAttribute("aria-label", "Remove " + IT[id][0]); x.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
        x.addEventListener("click", function () { setBasket(getBasket().filter(function (i) { return i !== id; })); render(); });
        li.appendChild(im); li.appendChild(t); li.appendChild(x); list.appendChild(li);
      });
      links();
    }
    nm.addEventListener("input", links); nt.addEventListener("input", links);
    render();
  }
})();
