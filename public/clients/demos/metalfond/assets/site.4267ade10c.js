/* Metalfond concept. Vanilla JS: reveals, counters, drawer, dock, part tool. */
(function () {
  "use strict";
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---- reveals (with a safety sweep: anything at or above the fold is shown) */
  var rvs = $$(".rv");
  function count(el) {
    var to = parseFloat(el.getAttribute("data-to")); if (!to || reduce || (to >= 1900 && to <= 2100)) return;
    var txt = el.textContent, t0 = null, dur = 1200;
    function f(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v >= 1000 ? v.toLocaleString(LOC) : String(v); if (p < 1) requestAnimationFrame(f); else el.textContent = txt; }
    el.textContent = "0"; requestAnimationFrame(f);
  }
  var LOC = d.documentElement.lang === "en" ? "en-GB" : "it-IT";
  var nums = $$(".num"), counted = [];
  function activate(el) { el.classList.add("in"); }
  function sweep() {
    var vh = w.innerHeight;
    rvs.forEach(function (el) { if (!el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); });
    nums.forEach(function (el) { if (counted.indexOf(el) < 0 && el.getBoundingClientRect().top < vh * 0.96) { counted.push(el); count(el); } });
  }
  if ("IntersectionObserver" in w) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rvs.forEach(function (el) { io.observe(el); });
  }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---- drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return; drawer.classList.toggle("is-open", open); burger.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : ""; if (open) { bx.focus(); } else { burger.focus({ preventScroll: true }); }
  }
  if (burger) { burger.addEventListener("click", function () { setDrawer(true); }); bx.addEventListener("click", function () { setDrawer(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); }); }

  /* ---- dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("mf-dock") === "1" && dock) dock.hidden = true; } catch (e) {}
  if (dock && w.innerWidth <= 760) { setTimeout(function () { dock.classList.add("is-fade"); setTimeout(function () { dock.hidden = true; }, 600); }, 7000); }
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("mf-dock", "1"); } catch (e) {} });

  /* ---- part tool (only reshuffles Metalfond's own published data) */
  var tool = $("#tool"); if (!tool) return;
  var mo = $("#more-opts"); if (mo && w.innerWidth <= 760 && tool.getAttribute("data-compact") === "1") mo.removeAttribute("open");
  var D = JSON.parse($("#part-data").textContent), S = D.s, form = $("#part-form");
  var verdict = $("#verdict"), steps = $("#steps"), send = $("#send"), copy = $("#copy"), mailtxt = $("#mailtxt"), scale = $("#scale"), mark = $("#scale-mark");
  var LOGMAX = Math.log(D.max_g);
  function fmt(g) { return g >= 1000 ? (g / 1000).toLocaleString(S.loc, { maximumFractionDigits: 2 }) + " kg" : g.toLocaleString(S.loc, { maximumFractionDigits: 1 }) + " g"; }
  function val(n) { var el = form.elements[n]; return el ? el.value : ""; }
  function checked(n) { return $$("input[name=" + n + "]:checked", form).map(function (i) { return i.value; }); }
  function li(title, why, href) { return "<li><div>" + (href ? '<a href="' + href + '">' + title + "</a>" : "<b>" + title + "</b>") + "</div><p>" + why + "</p></li>"; }
  function update() {
    var raw = parseFloat(String(val("w")).replace(",", ".")), unit = (form.querySelector("input[name=u]:checked") || {}).value || "g";
    var g = isFinite(raw) && raw > 0 ? raw * (unit === "kg" ? 1000 : 1) : 0, over = g > D.max_g;
    var alloy = val("alloy"), qty = String(val("qty")).trim(), tl = checked("tool"), vac = checked("vac").length > 0, fin = checked("fin");
    var L = D.links, h = "";
    /* scale marker: log scale 1 g .. 15 kg, their published range */
    var pos = g > 0 ? Math.max(0, Math.min(1, Math.log(Math.max(g, 1)) / LOGMAX)) : 0;
    mark.style.left = (pos * 100) + "%"; mark.parentNode.style.backgroundSize = (g > 0 ? pos * 100 : 0) + "% 100%, auto"; scale.classList.toggle("is-on", g > 0); scale.classList.toggle("is-over", over);
    if (!g) verdict.innerHTML = S.start;
    else if (over) verdict.innerHTML = "<b>" + fmt(g) + "</b>" + S.over;
    else verdict.innerHTML = "<b>" + fmt(g) + "</b>" + S.ok;
    if (tl.indexOf("design") > -1) h += li(S.design_t, S.design_w, L["progettazione-stampi"]);
    h += li(S.melt_t, alloy ? S.melt_a + alloy + S.melt_a2 : S.melt_n, L["fusione-alluminio"]);
    h += li(S.press_t, S.press_a + (vac ? S.press_v : S.press_n), L["pressofusione-alluminio"]);
    h += li(S.trim_t, S.trim_w, L["tranciatura"]);
    if (fin.length) h += li(S.fin_t, fin.join(", ") + S.fin_w, L["finitura"]);
    h += li(S.qc_t, S.qc_w, L["controlli-qualita"]);
    if (tl.indexOf("store") > -1) h += li(S.store_t, S.store_w, L["manutenzione-attrezzature"]);
    h += li(S.log_t, S.log_w, L["logistica"]);
    steps.innerHTML = h;
    /* request text */
    var t = [S.m_hello, S.m_intro, ""];
    t.push(S.m_weight + (g ? fmt(g) : S.m_tbd)); t.push(S.m_alloy + (alloy || S.m_advise)); t.push(S.m_qty + (qty ? qty + S.m_pcs : S.m_tbd));
    t.push(S.m_die + (tl.length ? tl.map(function (x) { return x === "design" ? S.m_die_new : S.m_die_have; }).join("; ") : S.m_tbd));
    if (vac) t.push(S.m_vac); if (fin.length) t.push(S.m_fin + fin.join(", "));
    t.push("", S.m_end);
    var txt = t.join("\n"); mailtxt.textContent = txt;
    send.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(S.subject) + "&body=" + encodeURIComponent(txt);
  }
  form.addEventListener("input", update); form.addEventListener("change", update); form.addEventListener("submit", function (e) { e.preventDefault(); });
  copy.addEventListener("click", function () {
    var txt = mailtxt.textContent, ok = function () { copy.textContent = S.copied; setTimeout(function () { copy.textContent = S.copy; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () {});
    else { var r = d.createRange(); mailtxt.hidden = false; r.selectNodeContents(mailtxt); var s = w.getSelection(); s.removeAllRanges(); s.addRange(r); try { d.execCommand("copy"); ok(); } catch (e) {} mailtxt.hidden = true; }
  });
  update();
})();
