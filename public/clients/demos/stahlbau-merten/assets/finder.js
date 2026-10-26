/* Becher-Finder: reshuffles the published DIN tables of Stahlbau Merten into a prepared enquiry. No network, no model. */
(function () {
  "use strict";
  var root = document.getElementById("finder"); if (!root) return;
  var D; try { D = JSON.parse(document.getElementById("finder-data").textContent); } catch (e) { return; }
  var compact = root.getAttribute("data-compact") === "1", U = D.ui;
  var $ = function (s, r) { return (r || root).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var f2 = function (x) { return (Math.round(x * 100) / 100).toFixed(2).replace(".", ","); };
  var nm = function (x) { return String(x).replace(".", ","); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var gutLabel = {}, gutNorm = {}; D.guter.forEach(function (g) { gutLabel[g[0]] = g[1]; gutNorm[g[0]] = g[2]; });
  var S = { gut: null, norm: null, mode: "l", row: null, thick: null };
  var q = new URLSearchParams(location.search);

  var elL = $("[name=l]"), elB = $("[name=b]"), fs2 = $("#fs2"), res = $("#fres");
  function modeVal() { var c = $("[name=mode]:checked"); return c ? c.value : "l"; }
  function normOf() { return S.norm ? D.norms[S.norm] : null; }

  function candidates() {
    var n = normOf(); if (!n) return [];
    var idx = n.rows.map(function (r, i) { return i; });
    if (S.mode === "l") {
      var L = parseFloat(String(elL.value).replace(",", ".")); if (!isFinite(L) || L <= 0) return [];
      var c = idx.filter(function (i) { return n.rows[i][5] >= L; }); c.sort(function (a, b) { return n.rows[a][5] - n.rows[b][5] || a - b; });
      return c.slice(0, compact ? 2 : 3);
    }
    var B = parseInt(elB.value, 10); return idx.filter(function (i) { return n.rows[i][0] === B; });
  }

  function fillB() {
    var n = normOf(); if (!n) return; var seen = {}, html = "";
    n.rows.forEach(function (r) { if (!seen[r[0]]) { seen[r[0]] = 1; html += '<option value="' + r[0] + '">' + r[0] + " mm</option>"; } });
    var keep = elB.value; elB.innerHTML = html; if (keep && seen[keep]) elB.value = keep;
  }

  function dims(r) { var a = []; if (r[1] != null) a.push("a " + r[1]); if (r[2] != null) a.push("h<sub>1</sub> " + r[2]); if (r[3] != null) a.push("h<sub>2</sub> " + r[3]); if (r[4] != null) a.push("r<sub>1</sub> " + r[4]); return a.join(" · ") || "weitere Maße: auf Anfrage"; }
  function thicks(r) { var k = Object.keys(r[6]); k.sort(function (a, b) { return a - b; }); return k; }

  function renderRes() {
    var n = normOf(), c = candidates(), html = "";
    if (!n) { res.innerHTML = ""; return; }
    html += '<div class="fres__norm"><b>' + esc(n.short) + "</b><span>" + esc(n.kind) + ", für " + esc(n.gut) + '</span><a href="' + n.href + '">Maßtabelle und Zeichnung ' + esc(n.short) + "</a></div>";
    if (!c.length) html += '<p class="fnone">' + esc(U.res_none) + "</p>";
    else {
      if (S.row === null || c.indexOf(S.row) < 0) S.row = c[0];
      html += '<div class="rrows" role="radiogroup" aria-label="' + esc(U.res_h) + '">';
      c.forEach(function (i) {
        var r = n.rows[i], t = thicks(r), w0 = r[6][t[0]];
        html += '<label class="rrow"><input type="radio" name="row" value="' + i + '"' + (i === S.row ? " checked" : "") + '><span class="rrow__b">' + r[0] + '<small>mm Breite</small></span><span class="rrow__d">' + dims(r) +
          '</span><span class="rrow__l">Inhalt ca. ' + f2(r[5]) + " l · Blechdicken " + t.map(nm).join(", ") + ' mm <em>(ab ' + f2(w0) + " kg je Becher)</em></span></label>";
      });
      html += "</div>";
    }
    res.innerHTML = html;
    $$("[name=row]", res).forEach(function (el) { el.addEventListener("change", function () { S.row = parseInt(el.value, 10); S.thick = null; update(false); }); });
  }

  function fillThick() {
    var sel = $("[name=thick]"); if (!sel) return; var n = normOf();
    if (!n || S.row === null) { sel.innerHTML = ""; sel.disabled = true; return; }
    var r = n.rows[S.row], t = thicks(r), keep = S.thick || sel.value;
    sel.innerHTML = t.map(function (k) { return '<option value="' + k + '">' + nm(k) + " mm · " + f2(r[6][k]) + " kg je Becher</option>"; }).join("");
    sel.disabled = false; sel.value = (keep && r[6][keep] != null) ? keep : t[0]; S.thick = sel.value;
  }

  function val(name) { var el = $("[name=" + name + "]"); return el ? el.value : ""; }
  function lines() {
    var out = [];
    if (S.gut === "other") {
      out.push("Anfrage Elevatorbecher nach Mustervorlage, Zeichnung oder Sonderanfertigung", "Fördergut / Einsatz: (bitte ergänzen)", "Maße oder Zeichnung: (bitte ergänzen)");
      return out;
    }
    var n = normOf(); if (!n || S.row === null) return out; var r = n.rows[S.row], nn = S.norm;
    out.push("Anfrage Elevatorbecher nach " + n.short + " (" + n.kind + ")");
    if (S.gut && gutLabel[S.gut]) out.push("Fördergut: " + gutLabel[S.gut]);
    var d = ["b " + r[0] + " mm"]; if (r[1] != null) d.push("a " + r[1]); if (r[2] != null) d.push("h1 " + r[2]); if (r[3] != null) d.push("h2 " + r[3]); if (r[4] != null) d.push("r1 " + r[4]);
    out.push("Größe: " + d.join(", ") + ", Inhalt ca. " + f2(r[5]) + " l");
    out.push("Werkstoff: " + D.labels.mat[val("mat")]);
    var t = val("thick"), qty = Math.max(1, parseInt(val("qty"), 10) || 1);
    if (t && r[6][t] != null) {
      out.push("Blechdicke: " + nm(t) + " mm (ca. " + f2(r[6][t]) + " kg je Becher)");
      out.push("Stückzahl: " + qty + " (ca. " + nm(Math.round(r[6][t] * qty * 10) / 10) + " kg gesamt)");
    } else out.push("Stückzahl: " + qty);
    out.push("Randverstärkung: " + D.labels.edge[val("edge")]);
    var fx = val("fix"); if (fx && fx !== "none") {
      out.push("Befestigung: " + D.labels.fix[fx]);
      if (fx.indexOf("gurt") === 0) D.gurt.forEach(function (g) { if (g[0] === r[0] && g[1] === r[1] && g[7][nn] != null) out.push("Gurtbefestigung DIN 15236 Blatt 1: " + g[6] + ", Maß i = " + g[7][nn] + " mm"); });
    }
    var sf = val("surf"); if (sf && sf !== "none") out.push("Oberfläche: " + D.labels.surf[sf]);
    return out;
  }
  function who() { var a = []; ["name", "company", "phone"].forEach(function (k) { var v = val(k).trim(); if (v) a.push(v); }); return a; }
  function fullText() { var L = lines(); if (!L.length) return ""; var w = who(); return L.join("\n") + "\n\nBitte senden Sie mir ein Angebot.\nMit freundlichen Grüßen" + (w.length ? "\n" + w.join("\n") : ""); }

  function update(refill) {
    var fs3 = $("#fs3"), fs4 = $("#fs4"), go = $("#fgo");
    if (S.gut === "other") {
      if (fs2) fs2.hidden = true; if (fs3) fs3.hidden = true; res && (res.innerHTML = "");
      if (go) { go.hidden = false; $("#fgo-a").href = base() + "?gut=other"; }
      if (fs4) { fs4.hidden = false; $("#fsum").textContent = lines().join("\n") + "\n\n" + U.res_other; }
      mail(); return;
    }
    if (!S.norm) { if (fs2) fs2.hidden = true; if (fs3) fs3.hidden = true; if (fs4) fs4.hidden = true; if (go) go.hidden = true; return; }
    fs2.hidden = false; if (refill) fillB();
    renderRes();
    var has = S.row !== null && candidates().indexOf(S.row) >= 0;
    if (fs3) { fs3.hidden = !has; if (has) fillThick(); }
    if (fs4) { fs4.hidden = !has; if (has) $("#fsum").textContent = lines().join("\n"); }
    if (go) { go.hidden = !has; if (has) $("#fgo-a").href = base() + params(); }
    mail();
  }
  function base() { var a = $("#fgo-a"); var h = a ? a.getAttribute("data-base") || a.getAttribute("href").split("?")[0] : ""; if (a && !a.getAttribute("data-base")) a.setAttribute("data-base", h); return h; }
  function params() { var p = new URLSearchParams(); if (S.gut) p.set("gut", S.gut); else if (S.norm) p.set("norm", S.norm); p.set("mode", S.mode); if (S.mode === "l") p.set("l", elL.value); else p.set("b", elB.value); return "?" + p.toString(); }
  function mail() {
    var send = $("#fsend"); if (!send) return; var L = lines(); if (!L.length) return; var subj = L[0];
    if (S.gut !== "other" && S.row !== null) { var r = normOf().rows[S.row]; subj = "Anfrage Elevatorbecher " + normOf().short + ", b " + r[0] + " mm, " + Math.max(1, parseInt(val("qty"), 10) || 1) + " Stück"; }
    send.href = "mailto:" + D.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(fullText());
  }

  // events
  $$("[name=gut]").forEach(function (el) { el.addEventListener("change", function () {
    S.gut = el.value; S.row = null; S.thick = null;
    if (S.gut === "other") S.norm = null; else S.norm = gutNorm[S.gut];
    update(true);
    if (!compact && S.norm) { var t = $("#fs2"); }
  }); });
  $$("[name=mode]").forEach(function (el) { el.addEventListener("change", function () {
    S.mode = modeVal(); $(".fld--l").hidden = S.mode !== "l"; $(".fld--b").hidden = S.mode !== "b"; S.row = null; update(false); }); });
  [elL, elB].forEach(function (el) { el.addEventListener("input", function () { S.row = null; update(false); }); el.addEventListener("change", function () { S.row = null; update(false); }); });
  ["mat", "edge", "fix", "surf", "qty", "name", "company", "phone"].forEach(function (n) { var el = $("[name=" + n + "]"); if (el) { el.addEventListener("input", function () { update(false); }); el.addEventListener("change", function () { update(false); }); } });
  var th = $("[name=thick]"); if (th) th.addEventListener("change", function () { S.thick = th.value; update(false); });
  var cp = $("#fcopy");
  if (cp) cp.addEventListener("click", function () {
    var t = fullText(), done = function () { cp.textContent = U.copied; setTimeout(function () { cp.textContent = U.copy; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, done);
    else { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
  });

  // deep link: ?gut=zucker&mode=l&l=3  |  ?norm=15234  |  ?gut=other
  var g = q.get("gut"), nrm = q.get("norm");
  if (q.get("mode") === "b") { var mb = $("[name=mode][value=b]"); if (mb) { mb.checked = true; S.mode = "b"; $(".fld--l").hidden = true; $(".fld--b").hidden = false; } }
  if (q.get("l")) elL.value = q.get("l");
  if (g === "other") { var og = $("[name=gut][value=other]"); if (og) { og.checked = true; S.gut = "other"; } }
  else if (g && gutNorm[g]) { var cg = $("[name=gut][value=" + g + "]"); if (cg) { cg.checked = true; S.gut = g; S.norm = gutNorm[g]; } }
  else if (nrm === "columbus") { var oc = $("[name=gut][value=other]"); if (oc) { oc.checked = true; S.gut = "other"; } }
  else if (nrm && D.norms[nrm]) { S.norm = nrm; }
  if (S.norm) { fillB(); if (q.get("b")) elB.value = q.get("b"); }
  if (S.gut || S.norm) update(true);
})();
