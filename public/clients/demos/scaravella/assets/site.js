(function () {
  "use strict";
  var d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  function safe(f) { try { return f(); } catch (e) { return null; } }
  d.documentElement.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (n) { n.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < innerHeight * 0.95) n.classList.add("in"); else io.observe(n); });
  }

  /* menu */
  var b = $("#burger"), nav = $("#nav");
  if (b && nav) {
    b.addEventListener("click", function () { var o = nav.classList.toggle("open"); b.setAttribute("aria-expanded", o); d.body.style.overflow = o ? "hidden" : ""; });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); b.setAttribute("aria-expanded", "false"); d.body.style.overflow = ""; }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { b.click(); b.focus(); } });
    addEventListener("resize", function () { if (innerWidth > 1020 && nav.classList.contains("open")) b.click(); });
  }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("scar-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("scar-dock", "1"); }); });

  var SEP = (d.documentElement.lang === "en") ? "," : ".";
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, SEP); }
  function mailto(addr, sub, body) { return "mailto:" + addr + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(body); }

  /* ---------- signature tool: nut finder over the published catalogue tables ---------- */
  var tool = $("#tool");
  if (tool) {
    var cfg = JSON.parse(tool.dataset.cfg), S = cfg.s, ROWS = cfg.rows.map(function (r, i) {
      return { i: i, t: r[0], dn: r[1], p: r[2], g: r[3], d1: r[4], cd: r[5], cs: r[6], h: r[7], pg: r[8] };
    });
    var st = { dn: 0, p: 0, fam: "", g: "" }, sel = {};
    var qs = safe(function () { return new URLSearchParams(location.search); });
    if (qs) { st.dn = +qs.get("dn") || 0; st.p = +qs.get("p") || 0; st.fam = qs.get("fam") === "cil" || qs.get("fam") === "fla" ? qs.get("fam") : ""; }
    if (!qs || (!qs.get("dn") && !qs.get("fam"))) st.dn = 32;
    var elDn = $("#f-dn"), elP = $("#f-p"), elT = $("#f-t"), elG = $("#f-g"), elRes = $("#f-res"), elCnt = $("#f-cnt"), elNone = $("#f-none");
    var elReq = $("#req-list"), elPre = $("#req-pre"), elSend = $("#req-send"), elCopy = $("#req-copy");
    var elName = $("#req-name"), elQty = $("#req-qty"), elNote = $("#req-note");
    var fam = function (t) { return t.charAt(1) === "F" || t === "MF+MC" ? "fla" : "cil"; };
    function famOf(r) { return cfg.fam[r.t]; }
    function match(r, skip) {
      return (skip === "dn" || !st.dn || r.dn === st.dn) && (skip === "p" || !st.p || r.p === st.p) && (!st.fam || famOf(r) === st.fam) && (skip === "g" || !st.g || r.g === st.g);
    }
    function chip(txt, pressed, dis, cb, cls) {
      var c = d.createElement("button"); c.type = "button"; c.className = "chip" + (cls ? " " + cls : ""); c.textContent = txt; c.setAttribute("aria-pressed", pressed ? "true" : "false");
      if (dis) c.disabled = true; c.addEventListener("click", cb); return c;
    }
    function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
    function sortN(a) { return a.sort(function (x, y) { return x - y; }); }
    function buildChips() {
      elDn.innerHTML = ""; elP.innerHTML = ""; elT.innerHTML = "";
      var dns = sortN(uniq(ROWS.map(function (r) { return r.dn; })));
      elDn.appendChild(chip(S.all, !st.dn, false, function () { st.dn = 0; st.p = 0; st.g = ""; run(); }, "txt"));
      dns.forEach(function (v) { var n = ROWS.filter(function (r) { return r.dn === v && (!st.fam || famOf(r) === st.fam); }).length; elDn.appendChild(chip(v, st.dn === v, !n, function () { st.dn = v; if (st.p && !ROWS.some(function (r) { return r.dn === v && r.p === st.p; })) st.p = 0; st.g = ""; run(); })); });
      var ps = sortN(uniq(ROWS.filter(function (r) { return match(r, "p"); }).map(function (r) { return r.p; })));
      elP.appendChild(chip(S.any, !st.p, false, function () { st.p = 0; st.g = ""; run(); }, "txt"));
      ps.forEach(function (v) { elP.appendChild(chip(v, st.p === v, false, function () { st.p = v; st.g = ""; run(); })); });
      [["", S.all], ["cil", S.cil], ["fla", S.fla]].forEach(function (o) { elT.appendChild(chip(o[1], st.fam === o[0], false, function () { st.fam = o[0]; run(); }, "txt")); });
      var gs = uniq(ROWS.filter(function (r) { return match(r, "g"); }).map(function (r) { return r.g; })).sort();
      elG.innerHTML = ""; var o0 = d.createElement("option"); o0.value = ""; o0.textContent = S.any; elG.appendChild(o0);
      gs.forEach(function (g) { var o = d.createElement("option"); o.value = g; o.textContent = g; elG.appendChild(o); });
      elG.value = st.g;
    }
    var order = ["MC", "MCPI", "MC+MC", "MF", "MFPI", "MF+MC"];
    function render() {
      var rows = ROWS.filter(function (r) { return match(r); }).sort(function (a, b) { return a.dn - b.dn || a.p - b.p || order.indexOf(a.t) - order.indexOf(b.t) || parseInt(a.g) - parseInt(b.g) || a.d1 - b.d1; });
      elCnt.textContent = rows.length + " " + (rows.length === 1 ? S.one : S.many);
      elRes.innerHTML = ""; elNone.hidden = rows.length > 0;
      rows.forEach(function (r) {
        var li = d.createElement("li"), on = !!sel[r.i];
        li.className = "nut" + (on ? " on" : "");
        var left = d.createElement("div");
        var h = d.createElement("h4"); h.textContent = cfg.names[r.t]; var sm = d.createElement("small"); sm.textContent = r.t; h.appendChild(sm); left.appendChild(h);
        var btn = d.createElement("button"); btn.type = "button"; btn.className = "btn " + (on ? "btn-solid" : "btn-line") + " add"; btn.textContent = on ? "✓ " + S.on : S.add; btn.setAttribute("aria-pressed", on);
        btn.addEventListener("click", function () { if (sel[r.i]) delete sel[r.i]; else sel[r.i] = 1; render(); reqUpdate(); });
        var dl = d.createElement("dl");
        [["Dn × " + S.pitchShort, r.dn + " × " + r.p + " mm"], [S.cols[1], r.g], [S.cols[2], r.d1 + " mm"], [S.cols[3], fmt(r.cd)], [S.cols[4], fmt(r.cs)]].concat(r.h ? [[S.cols[5], r.h]] : []).forEach(function (kv) {
          var w = d.createElement("div"), t = d.createElement("dt"), v = d.createElement("dd"); t.textContent = kv[0]; v.textContent = kv[1]; w.appendChild(t); w.appendChild(v); dl.appendChild(w);
        });
        var pw = d.createElement("div"), pt = d.createElement("dt"), pd = d.createElement("dd"), pa = d.createElement("a");
        pt.textContent = S.cols[6]; pa.href = cfg.pdf + "#page=" + (r.pg + 14); pa.target = "_blank"; pa.rel = "noopener"; pa.textContent = S.pag + " " + r.pg; pd.appendChild(pa); pw.appendChild(pt); pw.appendChild(pd); dl.appendChild(pw);
        li.appendChild(left); li.appendChild(btn); li.appendChild(dl); elRes.appendChild(li);
      });
    }
    function line(r) {
      return "- " + cfg.names[r.t] + " (" + r.t + "), Dn " + r.dn + ", " + S.pitchWord + " " + r.p + ", " + r.g + " " + S.turnsWord + ", Ø D1 " + r.d1 + " mm, Cd " + r.cd + " daN, Cs " + r.cs + " daN" + (r.h ? ", " + S.holesWord + " " + r.h : "") + " (" + S.catWord + " " + S.pag + " " + r.pg + ")";
    }
    function reqUpdate() {
      var picked = ROWS.filter(function (r) { return sel[r.i]; });
      elReq.innerHTML = "";
      if (!picked.length) { var e = d.createElement("li"); e.className = "empty"; e.textContent = S.empty; e.style.display = "block"; elReq.appendChild(e); }
      picked.forEach(function (r) {
        var li = d.createElement("li"), sp = d.createElement("span"), x = d.createElement("button");
        sp.textContent = r.t + " · " + r.dn + "×" + r.p + " · " + r.g; x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Rimuovi / Remove " + r.t + " " + r.dn + "x" + r.p);
        x.addEventListener("click", function () { delete sel[r.i]; render(); reqUpdate(); });
        li.appendChild(sp); li.appendChild(x); elReq.appendChild(li);
      });
      var body = [S.hello, "", S.intro].concat(picked.length ? picked.map(line) : ["- " + S.none], ["", S.qtyWord + ": " + (elQty.value || S.none), S.noteWord + ": " + (elNote.value || ""), S.nameWord + ": " + (elName.value || ""), "", S.tail]).join("\n");
      elPre.textContent = body;
      elSend.href = mailto(cfg.mail, S.sub + (picked.length === 1 ? ": " + picked[0].t + " " + picked[0].dn + "x" + picked[0].p : ""), body);
    }
    function run() { buildChips(); render(); reqUpdate(); }
    elG.addEventListener("change", function () { st.g = elG.value; render(); });
    [elName, elQty, elNote].forEach(function (el) { el.addEventListener("input", reqUpdate); });
    if (elCopy) elCopy.addEventListener("click", function () {
      var t = elPre.textContent;
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { elCopy.textContent = S.copied; setTimeout(function () { elCopy.textContent = S.copy; }, 1600); }, function () { var r = d.createRange(); r.selectNodeContents(elPre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    });
    run();
  }

  /* ---------- home mini finder ---------- */
  var mini = $("#mini");
  if (mini) {
    var M = JSON.parse(mini.dataset.cfg), mdn = $("#m-dn"), mp = $("#m-p"), mo = $("#m-out"), mg = $("#m-go");
    Object.keys(M.map).sort(function (a, b) { return a - b; }).forEach(function (k) { var o = d.createElement("option"); o.value = k; o.textContent = k + " mm"; mdn.appendChild(o); });
    function mup() {
      var dn = mdn.value, any = M.any, ps = M.map[dn] || {};
      var cur = mp.value; mp.innerHTML = ""; var o0 = d.createElement("option"); o0.value = ""; o0.textContent = any; mp.appendChild(o0);
      Object.keys(ps).sort(function (a, b) { return a - b; }).forEach(function (k) { var o = d.createElement("option"); o.value = k; o.textContent = k + " mm"; mp.appendChild(o); });
      if (ps[cur]) mp.value = cur;
      var n = mp.value ? ps[mp.value] : Object.keys(ps).reduce(function (s, k) { return s + ps[k]; }, 0);
      mo.textContent = n + " " + (n === 1 ? M.one : M.many);
      mg.href = M.url + "?dn=" + dn + (mp.value ? "&p=" + mp.value : "");
    }
    mdn.value = "32"; mdn.addEventListener("change", mup); mp.addEventListener("change", mup); mup();
  }

  /* ---------- revision + contact forms -> mailto ---------- */
  var rf = $("#rev-form");
  if (rf) {
    var R = JSON.parse(rf.dataset.cfg);
    rf.addEventListener("submit", function (e) {
      e.preventDefault();
      var sy = $$("input[name=sym]:checked", rf).map(function (x) { return x.value; }).join(", ");
      var body = [R.hello, "", R.intro, "", R.dn + ": " + ($("#r-dn").value || R.none), R.p + ": " + ($("#r-p").value || R.none), R.sym + ": " + (sy || R.none), R.other + ": " + ($("#r-o").value || ""), "", R.name + ": " + ($("#r-n").value || ""), "", R.tail].join("\n");
      location.href = mailto(R.mail, R.sub, body);
    });
  }
  var cf = $("#contact-form");
  if (cf) {
    var C = JSON.parse(cf.dataset.cfg);
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var body = [C.hello, "", $("#c-m").value, "", C.name + ": " + $("#c-n").value, C.co + ": " + $("#c-c").value, "Email: " + $("#c-e").value].join("\n");
      location.href = mailto(C.mail, $("#c-o").value || C.sub, body);
    });
  }
})();
