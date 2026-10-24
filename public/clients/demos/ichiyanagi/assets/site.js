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
  $$("a", drawer || d).forEach(function (a) { if (drawer && drawer.contains(a)) a.addEventListener("click", function () { setDrawer(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1000) setDrawer(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("iy-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("iy-dock", "1"); }); });
  if (dock) window.addEventListener("scroll", function () { if (window.scrollY > 240) dock.hidden = true; }, { passive: true });

  /* reveals */
  var rvs = $$(".rv, .chart");
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

  /* ---------- spec finder: size x material (catalogue table) ---------- */
  var box = $("[data-finder]"), raw = $("#f-data");
  if (box && raw) {
    var D = JSON.parse(raw.textContent), size = "", mat = "";
    var card = $("#f-card"), alt = $("#f-alt"), mail = $("#f-mail");
    var qty = $("#f-qty"), use = $("#f-use");
    var matLabel = {}; D.mats.forEach(function (m) { matLabel[m.k] = m.l; });
    function code(s, m) { var r = D.mats.filter(function (x) { return x.k === m; })[0]; return r ? r.r.charAt(D.sizes.indexOf(s)) : ""; }
    function surfaces() { return $$("input[name=surf]:checked", box).map(function (i) { return i.value; }); }
    function render() {
      $$("[data-size].chip", box).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-size") === size ? "true" : "false"); });
      $$("[data-mat].chip", box).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mat") === mat ? "true" : "false"); });
      $$(".cell", box).forEach(function (c) { c.classList.toggle("is-sel", c.getAttribute("data-size") === size && c.getAttribute("data-mat") === mat); });
      $$("tr[data-row]", box).forEach(function (tr) { tr.classList.toggle("is-row", tr.getAttribute("data-row") === mat); });
      var cls = "res res--idle", sym = "？", h = "サイズと材質を選んでください", p = "標準品か受注生産品かが、ここに表示されます。", a = "";
      if (size && !mat) {
        var ms = D.mats.filter(function (m) { return code(size, m.k) === "o"; }).map(function (m) { return m.l; });
        h = size + "：材質を選んでください"; p = "標準品の材質：" + (ms.join("、") || "（標準品なし。ご相談ください）");
      } else if (!size && mat) {
        var r = D.mats.filter(function (x) { return x.k === mat; })[0];
        var so = D.sizes.filter(function (s, i) { return r.r.charAt(i) === "o"; }), st = D.sizes.filter(function (s, i) { return r.r.charAt(i) === "t"; });
        h = matLabel[mat] + "：サイズを選んでください"; p = "標準品：" + (so.join("、") || "なし") + (st.length ? "　受注生産品：" + st.join("、") : "");
      } else if (size && mat) {
        var c = code(size, mat), L = matLabel[mat];
        if (c === "o") { cls = "res res--o"; sym = "○"; h = size + "／" + L + "：標準品です"; p = "カタログの標準ラインナップにあります。在庫と表面処理をご確認ください。"; }
        else if (c === "t") { cls = "res res--t"; sym = "△"; h = size + "／" + L + "：受注生産品です"; p = "在庫・納期、表面処理の確認が必要です。お問い合わせください。"; }
        else { cls = "res res--x"; sym = "－"; h = size + "／" + L + "：標準ラインナップにありません"; p = "その他のサイズ・材質・表面処理もご相談ください。"; }
        var others = D.mats.filter(function (m) { return m.k !== mat && code(size, m.k) === "o"; }).map(function (m) { return m.l; });
        var sizes = D.sizes.filter(function (s) { return s !== size && code(s, mat) === "o"; });
        if (c !== "o" && others.length) a = size + " の標準品がある材質：" + others.join("、") + "。";
        else if (c !== "o" && sizes.length) a = L + " の標準品があるサイズ：" + sizes.join("、") + "。";
      }
      card.className = cls;
      card.innerHTML = '<p class="res__sym" aria-hidden="true">' + sym + '</p><div><p class="res__h"></p><p class="res__p"></p></div>';
      $(".res__h", card).textContent = h; $(".res__p", card).textContent = p; alt.textContent = a;
      var lines = ["イチヤナギ ご担当者様", "", "スカートナットについて、下記の仕様で在庫・価格・納期をご確認いただけますでしょうか。", ""];
      lines.push("・サイズ：" + (size || "（未選択）")); lines.push("・材質：" + (mat ? matLabel[mat] : "（未選択）"));
      if (size && mat) lines.push("・カタログ上の区分：" + (code(size, mat) === "o" ? "標準品" : code(size, mat) === "t" ? "受注生産品" : "標準ラインナップなし"));
      lines.push("・表面処理：" + (surfaces().join("、") || "（ご相談）")); lines.push("・数量：" + (qty.value.trim() || "")); lines.push("・用途：" + (use.value || ""));
      lines.push("", "会社名：", "ご担当者名：", "電話番号：", "");
      mail.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent("【お問い合わせ】スカートナット " + (size || "") + " " + (mat ? matLabel[mat] : "")) + "&body=" + encodeURIComponent(lines.join("\n"));
    }
    box.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-size],[data-mat]") : null; if (!t) return;
      var s = t.getAttribute("data-size"), m = t.getAttribute("data-mat");
      if (t.classList.contains("cell")) { size = s; mat = m; }
      else if (s) size = (size === s ? "" : s); else if (m) mat = (mat === m ? "" : m);
      render();
    });
    box.addEventListener("input", render); box.addEventListener("change", render);
    render();
  }

  /* ---------- contact form -> mailto ---------- */
  var cf = $("#cform");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements, v = function (n) { return (f[n].value || "").trim(); };
    var err = $("#cform-e");
    if (!v("name") || !v("org") || !v("mail") || !v("msg") || !/.+@.+\..+/.test(v("mail"))) { if (err) err.hidden = false; return; }
    if (err) err.hidden = true;
    var text = "イチヤナギ ご担当者様\n\n" + v("msg") + "\n\n氏名：" + v("name") + "（" + v("kana") + "）\n会社名：" + v("org") + "\n部署名：" + v("dept") + "\n郵便番号：" + v("zip") + "\n住所：" + v("addr") + "\n電話番号：" + v("tel") + "\nFAX番号：" + v("fax") + "\nメールアドレス：" + v("mail") + "\n";
    location.href = "mailto:info@sk-ichiyanagi.co.jp?subject=" + encodeURIComponent("【資料請求・お問い合わせ】" + v("org")) + "&body=" + encodeURIComponent(text);
  });
})();
