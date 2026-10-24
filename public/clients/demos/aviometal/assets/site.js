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
  if (dock && safe(function () { return sessionStorage.getItem("avio-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("avio-dock", "1"); }); });

  /* signature tool: "Il Suo materiale e' nella gamma?" Only reshuffles the ranges and tables published by Aviometal. */
  var tool = $("#tool");
  if (tool) {
    var cfg = JSON.parse(tool.dataset.cfg), forms = cfg.forms, DENS = 2.7;
    var f = { form: $("#t-form"), alloy: $("#t-alloy"), dim: $("#t-dim"), qty: $("#t-qty"), w: $("#t-w"), l: $("#t-l"), name: $("#t-name") };
    var status = $("#tool-status"), note = $("#tool-note"), match = $("#tool-match"), send = $("#tool-send");
    var ALL = ["1050A", "2011", "2014", "2017", "2024", "2219", "3003", "5005", "5052", "5083", "5154", "5754", "6060", "6061", "6063", "6082", "7010", "7050", "7075"];
    function fmt(n, dg) { return n.toLocaleString("it-IT", { maximumFractionDigits: dg == null ? 2 : dg }); }
    function num(el) { var v = parseFloat(String(el.value).replace(",", ".")); return isNaN(v) ? null : v; }
    function li(t, c) { var x = d.createElement("li"); if (c) x.className = c; x.textContent = t; match.appendChild(x); }
    function fillAlloys(keep) {
      var F = forms[f.form.value], list = F.alloys.length ? F.alloys : ALL;
      f.alloy.innerHTML = "";
      var o0 = d.createElement("option"); o0.value = ""; o0.textContent = "Non so, mi consigliate"; f.alloy.appendChild(o0);
      list.forEach(function (a) { var o = d.createElement("option"); o.value = a; o.textContent = a; f.alloy.appendChild(o); });
      var oo = d.createElement("option"); oo.value = "altra"; oo.textContent = "Altra, su richiesta"; f.alloy.appendChild(oo);
      if (keep && list.indexOf(keep) > -1) f.alloy.value = keep;
    }
    function pz(n) { return fmt(n, 0) + (n === 1 ? " pezzo" : " pezzi"); }
    function run() {
      var k = f.form.value, F = forms[k], v = num(f.dim), w = num(f.w), l = num(f.l), q = num(f.qty) || 1, a = f.alloy.value;
      var plane = F.kind === "sheet" || F.kind === "plate", bar = ["round", "square", "hex"].indexOf(F.kind) > -1;
      d.getElementById("t-dim-l").textContent = F.dim;
      d.getElementById("f-w").hidden = !plane;
      d.getElementById("f-l").hidden = !(plane || bar);
      match.innerHTML = ""; status.className = "tool-status"; note.textContent = "";
      var has = v !== null, ok = true, big = false;
      if (!has) { status.textContent = F.rng ? "Inserisca " + F.dim.split(" (")[0].toLowerCase() + ": gamma " + F.dimlist + "." : "Misure su richiesta."; ok = false; }
      else if (F.rng) {
        var inr = v >= F.rng[0] && v <= F.rng[1];
        if (inr) { status.textContent = "Rientra nella gamma pubblicata (" + F.dimlist + ")."; status.classList.add("ok"); }
        else {
          ok = false; status.classList.add("out");
          status.textContent = "Fuori dalla gamma di questo prodotto (" + F.dimlist + ").";
          var alt = Object.keys(forms).filter(function (x) { var G = forms[x]; return x !== k && G.kind === F.kind && G.rng && v >= G.rng[0] && v <= G.rng[1]; });
          alt.forEach(function (x) { li("Questa misura rientra in: " + forms[x].label + " (" + forms[x].dimlist + ")", "yes"); });
          li("Su richiesta si forniscono anche misure speciali: ne parli con le vendite", "no");
        }
      } else { status.textContent = "Per i profilati la misura si concorda: forniamo anche secondo disegno del Cliente."; }
      if (plane && F.maxsz && w && l) {
        var mx = F.maxsz, fit1 = (w <= mx[0] && l <= mx[1]) || (w <= mx[1] && l <= mx[0]);
        if (!fit1) { big = true; ok = false; status.className = "tool-status out"; status.textContent = "Il pezzo supera il formato pubblicato (" + F.size + ")."; li("Per formati maggiori ne parli con le vendite", "no"); }
      }
      if (ok && a && a !== "altra") {
        if (F.alloys.length) {
          if (F.alloys.indexOf(a) > -1) li(a + " è tra le leghe indicate dal pronto per questo prodotto", "yes");
          else li(a + " non è nell'elenco dal pronto per questo prodotto: ne parli con le vendite", "no");
        }
      }
      if (a && a !== "altra" && cfg.schede.indexOf(a) > -1) { var link = d.createElement("li"); var an = d.createElement("a"); an.href = cfg.schedeUrl.replace("{a}", a.toLowerCase()); an.textContent = "Apra la scheda tecnica AA" + a; link.appendChild(an); match.appendChild(link); }
      if (ok && F.size) li("Dimensioni: " + F.size, "");
      var weightLine = "", dn = (a && cfg.dens[a]) ? cfg.dens[a] : null;
      if (ok && has && plane && v > 0) {
        var m2 = v * DENS;
        li("Peso nominale: " + fmt(m2, 1) + " kg al metro quadro (2,7 kg/dm³, come nelle tabelle pesi unitari)", "");
        weightLine = fmt(m2, 1) + " kg/m2 nominali";
        if (dn) li("Con la densità della scheda AA" + a + " (" + fmt(dn, 2) + " g/cm³): circa " + fmt(v * dn, 1) + " kg al metro quadro", "");
        if (w && l) { var one = m2 * w * l / 1e6; li("Un pezzo " + fmt(w, 0) + " × " + fmt(l, 0) + " mm pesa circa " + fmt(one, 1) + " kg" + (q > 1 ? "; " + pz(q) + ": " + fmt(one * q, 1) + " kg" : ""), ""); weightLine += "; pezzo " + fmt(one, 1) + " kg"; }
      }
      if (ok && has && bar && v > 0) {
        var kgm = F.kind === "round" ? Math.PI * v * v / 4 * DENS / 1000 : F.kind === "square" ? v * v * DENS / 1000 : 0.866025 * v * v * DENS / 1000;
        li("Peso nominale: " + fmt(kgm, 3) + " kg al metro (2,7 kg/dm³, come nelle tabelle pesi unitari)", ""); weightLine = fmt(kgm, 3) + " kg/m nominali";
        if (dn) li("Con la densità della scheda AA" + a + " (" + fmt(dn, 2) + " g/cm³): circa " + fmt(kgm * dn / DENS, 3) + " kg al metro", "");
        if (l) { var one2 = kgm * l / 1000; li("Un pezzo lungo " + fmt(l, 0) + " mm pesa circa " + fmt(one2, 1) + " kg" + (q > 1 ? "; " + pz(q) + ": " + fmt(one2 * q, 1) + " kg" : ""), ""); }
        li(kgm < 6 ? "Sotto i 6 kg al metro si fornisce la barra intera." : "Da 6 kg al metro in su si taglia a misura su indicazione del Cliente.", "");
      }
      if (ok || big) {
        if (F.kind === "sheet") note.textContent = "Quantità minima: il foglio. " + F.cut;
        else if (F.kind === "plate") note.textContent = "Quantità minima: tagliata a misura secondo richiesta. " + F.cut;
        else if (F.kind === "other" && F.cut) note.textContent = F.cut;
        else if (F.kind === "other") note.textContent = "Sotto i 6 kg al metro si fornisce la barra intera; da 6 kg al metro in su si taglia a misura.";
      }
      var lines = ["Buongiorno,", "", "vorrei un'offerta per:", "Prodotto: " + F.label, "Lega: " + (a ? (a === "altra" ? "altra, da concordare" : a) : "da consigliare"), F.dim + ": " + (has ? fmt(v) : "da definire")];
      if (plane) lines.push("Dimensioni pezzo: " + (w && l ? fmt(w, 0) + " × " + fmt(l, 0) + " mm" : "da definire"));
      if (bar) lines.push("Lunghezza: " + (l ? fmt(l, 0) + " mm" : "da definire"));
      lines.push("Quantità: " + (num(f.qty) ? pz(q) : "da definire"));
      if (weightLine) lines.push("Peso indicativo calcolato: " + weightLine);
      lines.push("", "Nome e azienda: " + (f.name.value || ""), "", "(Richiesta preparata con lo strumento di verifica del sito)");
      send.href = "mailto:" + cfg.mail + "?subject=" + encodeURIComponent("Richiesta di offerta: " + F.label + (a && a !== "altra" ? " " + a : "")) + "&body=" + encodeURIComponent(lines.join("\n"));
    }
    var qs = safe(function () { return new URLSearchParams(location.search); });
    var qf = qs && qs.get("forma"), qa = qs && qs.get("lega");
    if (qf && forms[qf]) f.form.value = qf;
    else if (qa) { var pick = Object.keys(forms).filter(function (x) { return forms[x].alloys.indexOf(qa) > -1; })[0]; if (pick) f.form.value = pick; }
    fillAlloys(qa);
    if (!qf && !qa) { f.form.value = "piastra"; fillAlloys(); f.alloy.value = "7075"; f.dim.value = 25; f.w.value = 500; f.l.value = 300; f.qty.value = 4; }
    f.form.addEventListener("change", function () { fillAlloys(f.alloy.value); run(); });
    ["change", "input"].forEach(function (ev) { tool.addEventListener(ev, function (e) { if (e.target !== f.form) run(); }); });
    run();
  }

})();
