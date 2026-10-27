/* Kito Printing concept: vanilla JS. Menu, dock, reveals, hero films (their own clips), gallery lightbox, finder, mail composer. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {};
  var lite = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function openMenu(o) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", o);
    drawer.setAttribute("aria-hidden", o ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", o ? "true" : "false");
    root.style.overflow = o ? "hidden" : "";
    if (o && bx) bx.focus(); else if (burger && !o) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { openMenu(true); });
  if (bx) bx.addEventListener("click", function () { openMenu(false); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) openMenu(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { openMenu(false); }); });

  /* ---------- dock ---------- */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dockx") === "1" && dock) dock.hidden = true; } catch (e) { }
  if (dock && !dock.hidden) setTimeout(function () { var p = dock.querySelector("p"); if (p && dock.getAttribute("data-min")) { p.textContent = dock.getAttribute("data-min"); dock.classList.add("is-min"); } }, 6000);
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dockx", "1"); } catch (e) { } });

  /* ---------- reveals ---------- */
  var rv = $$(".reveal");
  if (!("IntersectionObserver" in window) || rm) { rv.forEach(function (n) { n.classList.add("is-in"); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target, sib = n.parentNode ? $$(".reveal", n.parentNode).filter(function (x) { return x.parentNode === n.parentNode; }) : [];
        var i = Math.max(0, sib.indexOf(n));
        n.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
        n.classList.add("is-in"); io.unobserve(n);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (n) { io.observe(n); });
  }
  root.classList.add("is-ready");

  /* ---------- films (their own 10 s clips). Poster first; film starts after load; never with reduced motion / data saver ---------- */
  function pick(v) { return (window.innerWidth >= 960 && (conn.effectiveType || "4g") === "4g") ? v.getAttribute("data-v800") : v.getAttribute("data-v480"); }
  function setPP(btn, playing) {
    if (!btn) return;
    btn.setAttribute("aria-label", playing ? "映像を一時停止" : "映像を再生");
    btn.innerHTML = playing ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  }

  var hero = $("[data-hero]");
  if (hero) {
    var items = $$("[data-fx]", hero), vid = $(".stage__video", hero), poster = $(".stage__poster", hero), cap = $("#fxcap"), lnk = $("#fxlink"), pp = $("[data-pp]", hero);
    var cur = 0, manual = false, want = !(rm || lite);
    function wide() { return window.innerWidth >= 960 && (conn.effectiveType || "4g") === "4g"; }
    function setFx(i) {
      cur = i; var b = items[i];
      items.forEach(function (x, k) { x.setAttribute("aria-pressed", k === i ? "true" : "false"); x.style.setProperty("--p", 0); });
      poster.srcset = b.getAttribute("data-srcset"); poster.src = b.getAttribute("data-poster"); poster.alt = b.getAttribute("data-alt");
      poster.classList.remove("is-off");
      cap.textContent = b.getAttribute("data-label"); lnk.setAttribute("href", b.getAttribute("data-slug"));
      vid.pause();
    }
    function play(i) {
      setFx(i);
      vid.src = vid.getAttribute("data-base") + items[i].getAttribute("data-key") + "-" + (wide() ? "800" : "480") + ".mp4"; vid.loop = manual;
      var p = vid.play(); if (p && p.catch) p.catch(function () { setPP(pp, false); });
    }
    vid.addEventListener("playing", function () { poster.classList.add("is-off"); setPP(pp, true); });
    vid.addEventListener("pause", function () { setPP(pp, false); });
    vid.addEventListener("timeupdate", function () { if (vid.duration) items[cur].style.setProperty("--p", (vid.currentTime / vid.duration).toFixed(3)); });
    vid.addEventListener("ended", function () { if (!manual) play((cur + 1) % items.length); });
    items.forEach(function (b, i) {
      b.addEventListener("click", function () { manual = true; if (want) play(i); else { setFx(i); } });
    });
    if (pp) pp.addEventListener("click", function () {
      if (!vid.getAttribute("src")) { want = true; manual = true; play(cur); return; }
      if (vid.paused) { var p = vid.play(); if (p && p.catch) p.catch(function () { }); } else vid.pause();
    });
    setPP(pp, false);
    function start() { if (want) play(0); }
    if (d.readyState === "complete") setTimeout(start, 600); else window.addEventListener("load", function () { setTimeout(start, 600); });
  }

  /* service page film: plays while on screen */
  $$(".stage--svc").forEach(function (st) {
    var v = $(".fxv", st), poster = $(".stage__poster", st), btn = $("[data-pp]", st);
    if (!v) return;
    var started = false;
    function begin() { if (!started) { v.src = pick(v); started = true; } var p = v.play(); if (p && p.catch) p.catch(function () { }); }
    v.addEventListener("playing", function () { if (poster) poster.classList.add("is-off"); setPP(btn, true); });
    v.addEventListener("pause", function () { setPP(btn, false); });
    if (btn) btn.addEventListener("click", function () { if (!started || v.paused) begin(); else v.pause(); });
    if (!rm && !lite && "IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { if (d.readyState === "complete") begin(); else window.addEventListener("load", begin); } else if (started) v.pause(); }); }, { threshold: 0.4 });
      o.observe(st);
    }
  });

  /* ---------- lightbox ---------- */
  var lb;
  $$("[data-lb]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!lb) {
        lb = d.createElement("dialog"); lb.className = "lb"; lb.setAttribute("aria-label", "拡大写真");
        lb.innerHTML = '<button type="button" aria-label="閉じる">閉じる</button><img alt="">';
        d.body.appendChild(lb);
        lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "BUTTON") lb.close(); });
      }
      var im = $("img", lb); var src = $("img", b);
      im.src = b.getAttribute("data-lb"); im.alt = src ? src.alt : "";
      if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    });
  });

  /* ---------- finder ---------- */
  var fe = $("[data-finder]"), dataEl = $("#finder-data");
  if (fe && dataEl) {
    var D = JSON.parse(dataEl.textContent);
    var resBox = $("#res"), resEmpty = $("#res-empty"), barN = $("#bar-n");
    var lab = function (arr, k) { var f = arr.filter(function (x) { return x[0] === k; })[0]; return f ? f[1] : k; };
    function state() {
      var s = { e: [], l: "", p: "", u: [] };
      $$("input", fe).forEach(function (i) { if (!i.checked) return; if (i.name === "e") s.e.push(i.value); else if (i.name === "u") s.u.push(i.value); else s[i.name] = i.value; });
      return s;
    }
    function fromHash() {
      var h = (location.hash || "").replace(/^#/, ""); if (!h) return;
      var p = {}; h.split("&").forEach(function (kv) { var a = kv.split("="); p[a[0]] = decodeURIComponent(a[1] || ""); });
      $$("input", fe).forEach(function (i) {
        var v = p[i.name]; if (v == null) return;
        i.checked = (i.type === "checkbox") ? v.split(",").indexOf(i.value) > -1 : v === i.value;
      });
    }
    function toHash(s) {
      var a = []; if (s.e.length) a.push("e=" + s.e.join(",")); if (s.l) a.push("l=" + s.l); if (s.p) a.push("p=" + s.p); if (s.u.length) a.push("u=" + s.u.join(","));
      try { history.replaceState(null, "", location.pathname + (a.length ? "#" + a.join("&") : "")); } catch (e) { }
    }
    function compute(s) {
      var sc = {}, why = {};
      function add(slug, w, label, text) { sc[slug] = (sc[slug] || 0) + w; (why[slug] = why[slug] || []).push({ l: label, t: text }); }
      s.e.forEach(function (k) {
        Object.keys(D.weights).forEach(function (slug) {
          var w = D.weights[slug][k]; if (!w) return;
          add(slug, w, lab(D.expr, k), D.why[slug + "|" + k] || D.svcs[slug].lead);
        });
      });
      if (s.l === "small") add(D.smallLot[0], 3, "ロット：小ロット", D.smallLot[1]);
      if (s.p && ["special", "film", "thick"].indexOf(s.p) > -1) add(D.paperWhy[0], 4, "用紙：" + lab(D.paper, s.p), D.paperWhy[1]);
      var notes = [];
      s.u.forEach(function (k) {
        var n = D.useNotes[k]; if (!n) return;
        if (n.svc) add(n.svc, 1, "使い道：" + lab(D.use, k), n.t);
        notes.push(n);
      });
      var list = D.order.filter(function (x) { return sc[x]; }).sort(function (a, b) { return sc[b] - sc[a] || D.order.indexOf(a) - D.order.indexOf(b); });
      return { list: list, why: why, notes: notes };
    }
    function summary(s, r) {
      var L = [];
      L.push("鬼頭印刷株式会社　ご担当者様", "", "ホームページの「加工診断」を使って、次の内容で相談したいです。", "");
      L.push("■やりたい表現：" + (s.e.length ? s.e.map(function (k) { return lab(D.expr, k); }).join("、") : "未選択"));
      L.push("■ロット：" + (s.l ? lab(D.lot, s.l) : "未選択"));
      L.push("■用紙：" + (s.p ? lab(D.paper, s.p) : "未選択"));
      L.push("■使い道：" + (s.u.length ? s.u.map(function (k) { return lab(D.use, k); }).join("、") : "未選択"));
      L.push("■気になった加工：" + (r.list.length ? r.list.map(function (x) { return D.svcs[x].n; }).join("、") : "未定"));
      L.push("", "■会社名／お名前：", "■ご連絡先：", "■部数・サイズ・納期（わかる範囲で）：", "■その他：");
      return L.join("\n");
    }
    function render() {
      var s = state(), any = s.e.length || s.l || s.p || s.u.length;
      toHash(s);
      if (!any) { resBox.hidden = true; resEmpty.hidden = false; if (barN) barN.textContent = ""; return; }
      var r = compute(s); resEmpty.hidden = true; resBox.hidden = false;
      if (barN) barN.textContent = r.list.length ? String(r.list.length) : "";
      var h = '<div class="rhead"><h2>' + (r.list.length ? "鬼頭印刷の対応加工　" + r.list.length + "件" : "該当する加工") + '</h2><button type="button" id="reset">選択をリセット</button></div>';
      if (!r.list.length) h += '<p class="usenote">選んだ条件だけでは、公式サイトの説明から加工を絞れませんでした。電話かメールでご相談ください。</p>';
      r.list.forEach(function (slug, i) {
        var v = D.svcs[slug];
        h += '<article class="rc"><div class="rc__img"><img src="' + esc(v.img) + '" width="' + v.w + '" height="' + v.h + '" alt="' + esc(v.n) + '" loading="lazy"></div><div class="rc__b"><p class="rc__k">' + (i === 0 ? "いちばん合う加工" : "候補 " + (i + 1)) + '</p><h3 class="rc__t">' + esc(v.n) + '</h3><ul class="why">';
        var seen = {};
        r.why[slug].forEach(function (w) { var key = w.l + w.t; if (seen[key]) return; seen[key] = 1; h += "<li><b>" + esc(w.l) + "</b><q>" + esc(w.t) + "</q></li>"; });
        h += "</ul>";
        if (slug === D.darkHint[0]) h += '<p class="rc__hint">' + esc(D.darkHint[1]) + "</p>";
        h += '<a class="tlink" href="' + esc(v.u) + '">' + esc(v.n) + "のページへ</a></div></article>";
      });
      D.combos.forEach(function (c) { if (r.list.indexOf(c[0]) > -1 && r.list.indexOf(c[1]) > -1) h += '<p class="combo"><b>組み合わせのヒント</b>' + esc(c[2]) + "</p>"; });
      r.notes.forEach(function (n) { h += '<p class="usenote">' + esc(n.t) + (n.note ? ' <a class="inl" href="' + esc(n.note.u) + '" target="_blank" rel="noopener">noteで見る：' + esc(n.note.t) + "</a>" : "") + "</p>"; });
      var body = summary(s, r), subj = "【特殊印刷のご相談】" + (r.list.length ? D.svcs[r.list[0]].n + "ほか" : "加工診断から");
      h += '<div class="mailbox"><h3>この内容で鬼頭印刷に相談する</h3><p class="note" style="margin-top:0">下の文章はそのまま送れます。会社名・ご連絡先などを書き足してください。</p><label class="sr" for="mb">相談メールの本文</label><textarea id="mb" rows="10">' + esc(body) + '</textarea>'
        + '<div class="mailbox__btns"><a class="btn" id="mailto" href="#">メールの下書きを開く</a><button class="btn btn--ghost-p" type="button" id="copy">文章をコピー</button><a class="btn btn--ghost-p" href="' + esc(D.telHref) + '">電話 ' + esc(D.tel) + '</a><a class="btn btn--ghost-p" href="' + esc(D.form) + '" target="_blank" rel="noopener">Googleフォーム</a></div><p class="copied" id="copied" aria-live="polite"></p></div>';
      resBox.innerHTML = h;
      var ta = $("#mb"), ml = $("#mailto");
      function upd() { ml.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(ta.value); }
      ta.addEventListener("input", upd); upd();
      $("#copy").addEventListener("click", function () {
        var done = function () { $("#copied").textContent = "コピーしました。メールに貼り付けてください。"; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); });
        else { ta.select(); try { d.execCommand("copy"); done(); } catch (e) { } }
      });
      $("#reset").addEventListener("click", function () { $$("input", fe).forEach(function (i) { i.checked = false; }); render(); window.scrollTo({ top: fe.getBoundingClientRect().top + scrollY - 80, behavior: rm ? "auto" : "smooth" }); });
    }
    fromHash();
    fe.addEventListener("change", render);
    window.addEventListener("hashchange", function () { fromHash(); render(); });
    render();
  }

  /* ---------- contact composer ---------- */
  var cf = $("[data-compose]");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements, body = "鬼頭印刷株式会社　ご担当者様\n\n特殊印刷・加工について相談したいです。\n\n■会社名／お名前：" + f.who.value + "\n■ご連絡先：" + f.tel.value + "\n■ご相談内容：\n" + f.msg.value + "\n";
    location.href = "mailto:info@kito-net.com?subject=" + encodeURIComponent("【特殊印刷のご相談】") + "&body=" + encodeURIComponent(body);
  });
})();
