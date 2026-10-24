(function () {
  "use strict";
  var d = document, root = d.documentElement, body = d.body;
  var BASE = body.getAttribute("data-base") || "";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function yen(n) { return "￥" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

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
  $$("a", drawer || d).forEach(function (a) { if (drawer && drawer.contains(a)) a.addEventListener("click", function () { setDrawer(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("mi-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("mi-dock", "1"); }); });

  /* reveals (sweep also reveals everything already scrolled past) */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* timeline line follows scroll */
  $$("[data-tl]").forEach(function (tl) {
    function upd() {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / Math.max(1, r.height)));
      tl.style.setProperty("--p", reduce ? 1 : p.toFixed(3));
    }
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* ---------- quote list (basket) ---------- */
  var KEY = "mi-list", LIVE = "https://www.musashi-in.co.jp/", MAIL = "mi-support@musashi-in.co.jp";
  var mem = [];
  function load() { var v = safe(function () { return JSON.parse(localStorage.getItem(KEY) || "[]"); }); return Array.isArray(v) ? v : mem; }
  function save(list) { mem = list; safe(function () { localStorage.setItem(KEY, JSON.stringify(list)); }); }
  var bk = $("#bk"), bkList = $("#bk-list"), bkEmpty = $("#bk-empty"), bkMail = $("#bk-mail");
  function mailHref(list) {
    var lines = list.map(function (x, i) { return (i + 1) + ". " + x.n + (x.p ? "（定価 " + yen(x.p) + " 税込）" : "") + "\n   " + (x.o || LIVE); }).join("\n");
    var text = "ムサシインテック ご担当者様\n\n下記製品について、お見積りをお願いいたします。\n\n" + lines + "\n\n会社名：\nご担当者名：\n電話番号：\nご希望の数量・納期：\n";
    return "mailto:" + MAIL + "?subject=" + encodeURIComponent("【お見積り依頼】製品" + list.length + "点") + "&body=" + encodeURIComponent(text);
  }
  function render() {
    var list = load();
    $$("[data-bk-n]").forEach(function (n) { n.textContent = list.length; });
    var ids = {}; list.forEach(function (x) { ids[x.i] = 1; });
    $$("[data-add]").forEach(function (b) { b.setAttribute("aria-pressed", ids[b.getAttribute("data-add")] ? "true" : "false"); });
    if (!bkList) return;
    bkList.innerHTML = list.map(function (x) {
      return '<li><div><b>' + esc(x.n) + '</b><small>' + (x.p ? yen(x.p) : "価格はお問い合わせください") + '</small></div><button type="button" data-rm="' + esc(x.i) + '" aria-label="' + esc(x.n) + 'をリストから外す">外す</button></li>';
    }).join("");
    bkEmpty.hidden = list.length > 0;
    if (bkMail) { bkMail.href = list.length ? mailHref(list) : "mailto:" + MAIL; bkMail.setAttribute("aria-disabled", list.length ? "false" : "true"); }
  }
  function toggle(btn) {
    var id = btn.getAttribute("data-add"), list = load();
    var at = -1; list.forEach(function (x, i) { if (x.i === id) at = i; });
    if (at >= 0) list.splice(at, 1);
    else list.push({ i: id, n: btn.getAttribute("data-name"), p: +btn.getAttribute("data-price") || 0, o: btn.getAttribute("data-o") });
    save(list); render();
  }
  function openBk(open) {
    if (!bk) return;
    bk.hidden = !open; root.style.overflow = open ? "hidden" : "";
    if (open) { var x = $(".bk__x", bk); if (x) x.focus(); }
  }
  d.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-add],[data-bk-open],[data-bk-close],[data-rm],#bk-clear") : null;
    if (!t) return;
    if (t.hasAttribute("data-add")) toggle(t);
    else if (t.hasAttribute("data-bk-open")) openBk(true);
    else if (t.hasAttribute("data-bk-close")) openBk(false);
    else if (t.hasAttribute("data-rm")) { var id = t.getAttribute("data-rm"); save(load().filter(function (x) { return x.i !== id; })); render(); }
    else if (t.id === "bk-clear") { save([]); render(); }
  });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { openBk(false); setDrawer(false); } });
  render();
  window.addEventListener("storage", render);
  var cp = $("#bk-copy");
  if (cp) cp.addEventListener("click", function () {
    var list = load(); if (!list.length) return;
    var txt = list.map(function (x, i) { return (i + 1) + ". " + x.n + (x.p ? "（定価 " + yen(x.p) + " 税込）" : "") + " " + (x.o || LIVE); }).join("\n");
    var done = function () { cp.textContent = "コピーしました"; setTimeout(function () { cp.textContent = "リストをコピー"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { window.prompt("コピーしてください", txt); });
    else window.prompt("コピーしてください", txt);
  });
  if (dock) window.addEventListener("scroll", function () { if (window.scrollY > 240) dock.hidden = true; }, { passive: true });

  /* ---------- product finder ---------- */
  function norm(s) {
    s = (s || "").normalize("NFKC").toLowerCase().replace(/(\d+(?:\.\d+)?)\s*kv(?!a)/g, function (m, n) { return Math.round(parseFloat(n) * 1000) + "v"; });
    return s.replace(/(\d),(?=\d{3})/g, "$1");
  }
  function has(k, t) {
    var i = -1;
    while ((i = k.indexOf(t, i + 1)) >= 0) { if (!/\d/.test(t.charAt(0)) || i === 0 || !/[\d.]/.test(k.charAt(i - 1))) return true; }
    return false;
  }
  function initFinder(box) {
    var data = window.MI_PRODUCTS || [], cats = window.MI_CATS || [];
    if (!data.length) return;
    var limit = +box.getAttribute("data-limit") || 0, shown = limit || 24;
    var q = $("#fq", box), fg = $("#fg", box), fp = $("#fp", box), fr = $("#fr", box), fc = $("#fc", box), fm = $("#fm", box);
    var cat = 0;
    var params = new URLSearchParams(location.search);
    if (!limit) { if (params.get("q")) q.value = params.get("q"); if (+params.get("cat")) cat = +params.get("cat"); if (params.get("p")) fp.value = params.get("p"); }
    function setCat(n) {
      cat = n;
      $$(".chip", box).forEach(function (c) { c.setAttribute("aria-pressed", +c.getAttribute("data-cat") === n ? "true" : "false"); });
      fg.innerHTML = '<option value="">' + (n ? "すべて" : "（カテゴリを選ぶと選べます）") + "</option>";
      var c = cats.filter(function (x) { return x.n === n; })[0];
      if (c) c.groups.forEach(function (g) { var o = d.createElement("option"); o.value = g; o.textContent = g; fg.appendChild(o); });
      fg.disabled = !c;
    }
    function band(p, pn) { var v = +fp.value; if (!v) return true; if (v === 4) return !p; if (!p) return false; return v === 1 ? p < 50000 : v === 2 ? (p >= 50000 && p < 200000) : p >= 200000; }
    function cardHtml(r) {
      var c = cats.filter(function (x) { return x.n === r.c[0]; })[0];
      var img = r.m ? '<img class="pcard__img" src="' + BASE + '/assets/img/' + r.m + '" width="' + r.mw + '" height="' + r.mh + '" alt="' + esc(r.n) + '" loading="lazy" decoding="async">' : "";
      var price = r.p ? '<p class="price"><span class="price__l">定価（税込）</span><b>' + yen(r.p) + '</b></p>' : '<p class="price price--note">' + esc(r.pn || "価格はお問い合わせください") + '</p>';
      return '<article class="pcard is-in"><a class="pcard__a" href="' + BASE + '/product/' + esc(r.i) + '/"><span class="pcard__ph">' + img + '</span><span class="pcard__cat">' + esc(c ? c.name : "") + '</span><h3 class="pcard__n">' + esc(r.n.length > 70 ? r.n.slice(0, 69) + "…" : r.n) + '</h3><p class="pcard__t">' + esc(r.t) + '</p></a>' + price +
        '<button type="button" class="btn btn--add btn--sm" data-add="' + esc(r.i) + '" data-name="' + esc(r.n) + '" data-price="' + r.p + '" data-o="' + esc(r.o) + '" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="t-add">リストに追加</span><span class="t-added">追加済み</span></button></article>';
    }
    function run(reset) {
      if (reset) shown = limit || 24;
      var toks = norm(q.value).split(/\s+/).filter(Boolean), g = fg.value;
      var res = data.filter(function (r) {
        if (cat && r.c.indexOf(cat) < 0) return false;
        if (g && r.g.indexOf(g) < 0) return false;
        if (!band(r.p, r.pn)) return false;
        for (var i = 0; i < toks.length; i++) if (!has(r.k, toks[i])) return false;
        return true;
      });
      res.sort(function (a, b) { return (a.d || 0) - (b.d || 0); });
      if (toks.length) res.sort(function (a, b) { function sc(r) { var n = norm(r.n), s = 0; toks.forEach(function (t) { if (n.indexOf(t) >= 0) s += 2; }); return s; } return sc(b) - sc(a); });
      fc.textContent = res.length ? res.length + "件の製品が見つかりました" : "該当する製品がありません。条件をゆるめるか、お電話（04-2934-6034）でご相談ください。";
      fr.innerHTML = res.slice(0, shown).map(cardHtml).join("");
      if (fm) { fm.hidden = res.length <= shown || !!limit; fm.onclick = function () { shown += 24; run(false); }; }
      render();
      if (!limit) safe(function () { var u = new URL(location.href); q.value ? u.searchParams.set("q", q.value) : u.searchParams.delete("q"); cat ? u.searchParams.set("cat", cat) : u.searchParams.delete("cat"); +fp.value ? u.searchParams.set("p", fp.value) : u.searchParams.delete("p"); fg.value ? u.searchParams.set("g", fg.value) : u.searchParams.delete("g"); history.replaceState(null, "", u); });
    }
    $$(".chip", box).forEach(function (c) { c.addEventListener("click", function () { setCat(+c.getAttribute("data-cat")); run(true); }); });
    q.addEventListener("input", function () { run(true); });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); q.blur(); } });
    fg.addEventListener("change", function () { run(true); });
    fp.addEventListener("change", function () { run(true); });
    setCat(cat); if (!limit && params.get("g")) fg.value = params.get("g"); run(true);
  }
  function startFinders() { $$("[data-finder]").forEach(initFinder); }
  if (window.MI_PRODUCTS) startFinders(); else window.addEventListener("load", startFinders);

  /* ---------- contact form -> mailto ---------- */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements, v = function (n) { return (f[n].value || "").trim(); };
    var text = "ムサシインテック ご担当者様\n\nご依頼内容：" + v("kind") + "\n製品カテゴリ：" + v("cat") + "\n\n" + v("msg") + "\n\n会社名・協会名：" + v("org") + "\nお名前：" + v("name") + "\n電話番号：" + v("tel") + "\n";
    location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("【" + v("kind") + "】" + (v("cat") || "お問い合わせ")) + "&body=" + encodeURIComponent(text);
  });
})();
