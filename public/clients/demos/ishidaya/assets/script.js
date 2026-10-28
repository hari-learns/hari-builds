(function () {
  "use strict";
  var d = document, w = window;
  var RM = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = { get: function (k) { try { return w.sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) {} } };

  /* header state */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("sc", w.scrollY > 40); }
  onScroll(); w.addEventListener("scroll", onScroll, { passive: true });

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    d.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("#drawerx"); if (f) f.focus(); } else if (burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  var dx = $("#drawerx"); if (dx) dx.addEventListener("click", function () { setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); closeLb(); } });

  /* dock */
  var dock = $("#dock");
  if (dock) {
    if (store.get("dockx") === "1") dock.hidden = true;
    var dbtn = $("#dockx"); if (dbtn) dbtn.addEventListener("click", function () { dock.hidden = true; store.set("dockx", "1"); });
  }

  /* reveals */
  var rvs = $$(".rv");
  function showAll() { rvs.forEach(function (e) { e.classList.add("in"); }); }
  if (RM || !("IntersectionObserver" in w)) showAll();
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rvs.forEach(function (e) { io.observe(e); });
    var sweep = function () { var vh = w.innerHeight; rvs.forEach(function (e) { if (!e.classList.contains("in") && e.getBoundingClientRect().top < vh * 0.96) e.classList.add("in"); }); };
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { w.addEventListener(ev, sweep, { passive: true }); }); sweep();
  }

  /* hero crossfade between the inn's own photos */
  var slides = $$(".hs"), cap = $("#heroCap");
  if (slides.length > 1 && !RM) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-on"); i = (i + 1) % slides.length; slides[i].classList.add("is-on");
      if (cap) { cap.textContent = slides[i].getAttribute("data-cap") || ""; }
    }, 6500);
  }

  /* counters (their real numbers) */
  var nums = $$(".num");
  function fmt(n) { return n.toLocaleString("en-US"); }
  if (nums.length && !RM && "IntersectionObserver" in w) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; co.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-n"), suf = el.getAttribute("data-suf") || "", t0 = null, from = to > 1000 ? Math.round(to * .6) : 0;
        if (to === 1873) from = 1800;
        (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1400), v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); el.textContent = (to === 1873 ? String(v) : fmt(v)) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { co.observe(n); });
  }

  /* this month marker */
  var mo = new Date().getMonth() + 1;
  $$(".mo").forEach(function (m) { if (+m.getAttribute("data-m") === mo) m.classList.add("now"); });
  var now = $("#seasNow");
  if (now) {
    var hit = $$(".scard").filter(function (c) { return mo >= +c.getAttribute("data-m1") && mo <= +c.getAttribute("data-m2"); });
    if (hit.length) { hit.forEach(function (c) { c.classList.add("is-now"); }); now.textContent = "今月（" + mo + "月）の見頃：" + hit.map(function (c) { return $("h3", c).textContent; }).join("・"); now.hidden = false; }
  }

  /* rail arrows on fine pointers */
  var rail = $(".rail");
  if (rail && w.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    rail.addEventListener("wheel", function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && rail.scrollWidth > rail.clientWidth && false) { rail.scrollLeft += e.deltaY; } }, { passive: true });
  }

  /* lightbox */
  var lb = null, lbList = [], lbI = 0;
  function buildLb() {
    lb = d.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "photo");
    lb.innerHTML = '<div class="lb-in"><button class="lb-x" aria-label="閉じる">×</button><button class="lb-p" aria-label="前へ">‹</button><img alt=""><button class="lb-n" aria-label="次へ">›</button><p class="lb-c"></p></div>';
    d.body.appendChild(lb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    $(".lb-x", lb).addEventListener("click", closeLb);
    $(".lb-p", lb).addEventListener("click", function () { stepLb(-1); });
    $(".lb-n", lb).addEventListener("click", function () { stepLb(1); });
  }
  function showLb() { var b = lbList[lbI], im = $("img", lb); im.src = b.getAttribute("data-lb"); im.alt = b.getAttribute("data-alt") || ""; $(".lb-c", lb).textContent = (b.getAttribute("data-name") || b.getAttribute("data-alt") || "") + "　" + (lbI + 1) + " / " + lbList.length; }
  function stepLb(n) { lbI = (lbI + n + lbList.length) % lbList.length; showLb(); }
  function openLb(btn, scope) {
    if (!lb) buildLb();
    lbList = $$("[data-lb]", scope).filter(function (b) { return !b.hidden; }); lbI = lbList.indexOf(btn); if (lbI < 0) lbI = 0;
    showLb(); lb.classList.add("open"); d.documentElement.style.overflow = "hidden"; $(".lb-x", lb).focus();
  }
  function closeLb() { if (lb && lb.classList.contains("open")) { lb.classList.remove("open"); d.documentElement.style.overflow = ""; } }
  d.addEventListener("keydown", function (e) { if (lb && lb.classList.contains("open")) { if (e.key === "ArrowRight") stepLb(1); if (e.key === "ArrowLeft") stepLb(-1); } });
  d.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-lb]"); if (b) openLb(b, b.closest("section") || d); });

  /* chip groups helper */
  function chipGroup(box, attr, cb) {
    $$("button[" + attr + "]", box).forEach(function (c) {
      c.addEventListener("click", function () {
        $$("button[" + attr + "]", box).forEach(function (o) { o.classList.remove("is-on"); o.setAttribute("aria-pressed", "false"); }); c.classList.add("is-on"); c.setAttribute("aria-pressed", "true"); cb(c.getAttribute(attr));
      });
    });
  }

  /* iris catalogue */
  var iris = $("[data-iris]");
  if (iris) {
    var tiles = $$(".itile", iris), q = $("#iQ"), g = "", cnt = $("#iCount");
    var runI = function () {
      var s = (q.value || "").trim().toLowerCase(), n = 0;
      tiles.forEach(function (t) { var ok = (!g || t.getAttribute("data-g") === g) && (!s || t.getAttribute("data-name").toLowerCase().indexOf(s) > -1); t.hidden = !ok; if (ok) n++; });
      cnt.textContent = n;
    };
    q.addEventListener("input", runI);
    chipGroup($(".itool", iris), "data-g", function (v) { g = v; runI(); });
  }
  /* gallery */
  var gal = $("[data-gal]");
  if (gal) {
    chipGroup(gal, "data-g", function (v) { $$(".gbtn", gal).forEach(function (b) { b.hidden = !!v && b.getAttribute("data-g") !== v; }); });
  }
  /* faq */
  var faq = $("[data-faq]");
  if (faq) {
    var qs = $$(".qa", faq), qq = $("#qQ"), cat = "", qc = $("#qCount");
    var runQ = function () {
      var s = (qq.value || "").trim().toLowerCase(), n = 0;
      qs.forEach(function (x) { var ok = (!cat || x.getAttribute("data-c") === cat) && (!s || x.textContent.toLowerCase().indexOf(s) > -1); x.hidden = !ok; if (ok) n++; if (s && ok) x.open = true; });
      qc.textContent = n;
    };
    qq.addEventListener("input", runQ);
    chipGroup(faq, "data-c", function (v) { cat = v; runQ(); });
  }

  /* mail composer helper */
  function mailto(addr, subj, body) { return "mailto:" + addr + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); }
  var ms = $("#mSend");
  if (ms) ms.addEventListener("click", function () {
    var v = function (id) { var e = $("#" + id); return e ? e.value : ""; };
    var body = "離れ家 石田屋 ご担当者様\n\n空室とご宿泊料金をお伺いしたく、ご連絡いたします。\n\n■ご希望のお部屋：" + (v("mRoom") || "お任せ") + "\n■ご希望の日：" + (v("mDate") || "未定") + "\n■泊数：" + v("mNights") + "泊\n■ご利用人数：" + v("mGuests") + "名\n■お名前：" + v("mName") + "\n■ご要望：" + v("mNote") + "\n\n（デザイン案サイトのお問い合わせフォームから作成）";
    w.location.href = mailto("info@ishidaya.com", "【ご予約のお問い合わせ】" + (v("mRoom") || "お部屋のご相談"), body);
  });

  /* map pins */
  var CFG = null; try { var cj = $("#finderData"); if (cj) CFG = JSON.parse(cj.textContent); } catch (e) { w.console && console.warn("finder data", e); }
  $$("[data-only]").forEach(function (m) { var p = $(".pin", m); if (p) p.classList.add("on"); });

  /* signature tool: room finder */
  var finder = $("[data-finder]");
  if (finder && CFG) {
    var R = CFG.rooms, UI = CFG.ui, T = CFG.tiers;
    var st = { tier: 3, area: 0, feats: {}, sort: "name" };
    var bud = $("#fBudget"), out = $("#fBudgetVal"), sortEl = $("#fSort"), dateEl = $("#fDate"), nightsEl = $("#fNights"), guestsEl = $("#fGuests"), cnt2 = $("#fCount"), none = $("#fNone"), wrap = $("#fCards");
    var cards = {}; $$(".rc", wrap).forEach(function (c) { cards[c.getAttribute("data-room")] = c; });
    var pins = {}; $$(".pin", finder).forEach(function (p) { pins[p.getAttribute("data-room")] = p; });
    var yen = function (n) { return n.toLocaleString("en-US"); };
    function match(r) {
      if (r.low > T[st.tier]) return false;
      if (st.area) { if (!r.area || r.area < st.area) return false; }
      for (var k in st.feats) if (st.feats[k] && !r[k]) return false;
      return true;
    }
    function est(r) {
      var g = +guestsEl.value, n = +nightsEl.value;
      if (g !== 2) return UI.f_est_other;
      return UI.f_est.replace("{n}", n) + "：" + yen(r.low * 2 * n) + "〜" + yen(r.high * 2 * n) + "円";
    }
    function render() {
      out.textContent = UI.f_budget_val.replace("{v}", yen(T[st.tier]));
      var list = R.filter(match);
      var sorted = list.slice();
      if (st.sort === "price") sorted.sort(function (a, b) { return a.low - b.low || a.high - b.high; });
      if (st.sort === "area") sorted.sort(function (a, b) { return (b.area || 0) - (a.area || 0); });
      var ids = {}; sorted.forEach(function (r) { ids[r.slug] = 1; });
      R.forEach(function (r) { var c = cards[r.slug], p = pins[r.slug]; c.classList.toggle("is-off", !ids[r.slug]); if (p) p.classList.toggle("on", !!ids[r.slug]); });
      sorted.forEach(function (r) { var c = cards[r.slug]; wrap.appendChild(c); var e = $("[data-est]", c); if (e) e.textContent = est(r); });
      cnt2.textContent = sorted.length; var pn = $("#fPillN"); if (pn) pn.textContent = sorted.length; none.hidden = sorted.length > 0;
    }
    bud.addEventListener("input", function () { st.tier = +bud.value; render(); });
    chipGroup($(".f-ctl", finder), "data-area", function (v) { st.area = +v; render(); });
    $$("[data-feat]", finder).forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-feat"); st.feats[k] = !st.feats[k]; b.setAttribute("aria-pressed", st.feats[k] ? "true" : "false"); render(); }); });
    sortEl.addEventListener("change", function () { st.sort = sortEl.value; render(); });
    [guestsEl, nightsEl].forEach(function (e) { e.addEventListener("change", render); });
    $("#fReset").addEventListener("click", function () {
      st = { tier: 3, area: 0, feats: {}, sort: "name" }; bud.value = 3; sortEl.value = "name";
      $$("[data-feat]", finder).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      $$("[data-area]", finder).forEach(function (b) { var on = b.getAttribute("data-area") === "0"; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      render();
    });
    wrap.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ask]"); if (!a) return; e.preventDefault();
      var r = R.filter(function (x) { return x.slug === a.getAttribute("data-ask"); })[0];
      var body = UI.mail_body.replace("{room}", r.name).replace("{date}", dateEl.value || "未定").replace("{nights}", nightsEl.value).replace("{guests}", guestsEl.value);
      w.location.href = mailto(CFG.email, UI.mail_subject.replace("{room}", r.name), body);
    });
    /* deep links from the home page */
    var pick = (w.location.search.match(/pick=(\w+)/) || [])[1];
    if (pick === "budget") { bud.value = 1; st.tier = 1; }
    if (pick === "size") { st.area = 66; $$("[data-area]", finder).forEach(function (b) { var on = b.getAttribute("data-area") === "66"; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); }); }
    if (pick === "irori") { st.feats.thatch = true; var bt = $('[data-feat="thatch"]', finder); if (bt) bt.setAttribute("aria-pressed", "true"); }
    if (pick === "pond") { st.feats.pond = true; var bp = $('[data-feat="pond"]', finder); if (bp) bp.setAttribute("aria-pressed", "true"); }
    var pill = $("#fPill"); if (pill) { var tg = function () { var r = $(".f-ctl", finder).getBoundingClientRect(); pill.classList.toggle("show", r.top < 40 && r.bottom > -4000 && wrap.getBoundingClientRect().top > 120); }; w.addEventListener("scroll", tg, { passive: true }); }
    render();
  }

  /* click events for GoatCounter (data-ev) are handled by add_tracking.py */
})();
