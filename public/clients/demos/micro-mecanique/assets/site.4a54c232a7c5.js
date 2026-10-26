(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header solid on scroll */
  var hdr = $("#hdr");
  if (hdr) {
    var onS = function () { hdr.classList.toggle("is-solid", window.scrollY > 24); };
    onS(); window.addEventListener("scroll", onS, { passive: true });
  }

  /* drawer */
  var drawer = $("#drawer"), burger = $("#burger"), bx = $("#burger-x");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open && bx) bx.focus(); else if (!open && burger) burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (bx) bx.addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040 && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dock") === "x" && dock) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock", "x"); } catch (e) {} });

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) { rv.forEach(function (n) { n.classList.add("in"); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
  }

  /* generic filter chips (parc machine, news) */
  $$("[data-filter]").forEach(function (box) {
    var items = $$("[data-cat]", document);
    var btns = $$("button[data-f]", box);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (it) { it.hidden = !(f === "tous" || it.getAttribute("data-cat") === f); });
      });
    });
  });

  /* open now (hours from their site, Europe/Paris) */
  var ob = $$("[data-open]");
  if (ob.length) {
    var H = {};
    try { H = JSON.parse($("#hours-data").textContent); } catch (e) {}
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var wd = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[parts.weekday];
      var min = parseInt(parts.hour, 10) % 24 * 60 + parseInt(parts.minute, 10);
      var w = H.w && H.w[String(wd)];
      var open = !!(w && min >= w[0] && min < w[1]);
      ob.forEach(function (n) {
        n.classList.add(open ? "is-open" : "is-closed");
        n.textContent = open ? H.open : H.closed;
      });
    } catch (e) { ob.forEach(function (n) { n.hidden = true; }); }
  }

  /* ------------------------------------------------------------------ the tool: Ma pièce, quelle machine ? */
  var root = $("[data-tool]");
  if (!root) return;
  var D = JSON.parse($("#tool-data").textContent);
  var T = D.ui, K = D.data;
  var f = root.querySelector("form");
  function val(n) { var e = f.elements[n]; return e ? e.value : ""; }
  function num(n) { var v = parseFloat(String(val(n)).replace(",", ".")); return isFinite(v) && v > 0 ? v : NaN; }
  function checked(n) { return $$('input[name="' + n + '"]:checked', f).map(function (i) { return i.value; }); }
  function fmt(x) { return (Math.round(x * 10) / 10).toString().replace(".", ","); }
  function label(opts, v) { for (var i = 0; i < opts.length; i++) if (opts[i][0] === v) return opts[i][1]; return v; }
  var out = {
    verdict: $("[data-verdict]", root), rows: $("[data-rows]", root), send: $$("[data-send]"), copy: $$("[data-copy]"),
    barsum: $$("[data-barsum]")
  };
  var lastText = "";

  function row(status, title, detail, meter) {
    var tag = status === "ok" ? T.ok : status === "check" ? T.check : T.out;
    var m = meter ? '<div class="meter" role="img" aria-label="' + esc(meter.label) + '"><i style="width:' + Math.max(3, Math.min(100, meter.pct)) + '%"></i></div><span class="meter-l">' + esc(meter.label) + "</span>" : "";
    return '<div class="row is-' + status + '"><div class="row__top"><span class="row__t">' + esc(title) + '</span><span class="tag">' + tag + "</span></div><p>" + detail + "</p>" + m + "</div>";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function b(s) { return "<b>" + esc(s) + "</b>"; }

  function render() {
    var shape = val("shape") || "round";
    document.querySelector("[data-g='round']").hidden = shape !== "round";
    document.querySelector("[data-g='box']").hidden = shape !== "box";
    var d = num("d"), len = num("len"), L = num("l"), W = num("w"), Hh = num("h");
    var dims = shape === "round" ? [d, d, len] : [L, W, Hh];
    var known = dims.every(function (x) { return isFinite(x); });
    var proc = checked("proc");
    var mat = val("mat");
    var qty = val("qty") || "proto", tol = val("tol") || "std", sec = val("sec") || "autre";
    var fin = checked("fin");
    var rows = [], worst = 0, nCheck = 0, nOut = 0; // 0 ok, 1 check, 2 out
    function add(st, t, dt, m) { rows.push(row(st, t, dt, m)); if (st === "check") nCheck++; if (st === "out") nOut++; }

    if (!proc.length) add("check", "Opérations", "Choisissez au moins une opération pour comparer votre pièce au parc machine.");
    proc.forEach(function (p) {
      if (p === "tournage") {
        var m = K.lathe;
        if (shape === "box") add("check", "Tournage", "Le tournage concerne les pièces de révolution. Machines : " + m.machines.join(", ") + ". À confirmer avec l’atelier pour votre forme.");
        else if (!isFinite(d)) add("check", "Tournage", "Indiquez le diamètre pour comparer à " + b("Ø " + m.dia + " mm max") + ". Machines : " + esc(m.machines.join(", ")) + ".");
        else if (d <= m.diaSafe) add("ok", "Tournage", "Ø " + b(fmt(d) + " mm") + " sur Ø " + m.dia + " mm max. " + esc(m.machines.join(", ")) + "." + (d <= m.bar ? " Passage de barre " + m.bar + " mm : alimentation en barre possible." : ""), { pct: d / m.dia * 100, label: "Ø " + fmt(d) + " / " + m.dia + " mm" });
        else if (d <= m.dia) add("check", "Tournage", "Ø " + b(fmt(d) + " mm") + " : " + esc(m.note) + ". L’atelier confirme la valeur exacte.", { pct: d / m.dia * 100, label: "Ø " + fmt(d) + " / " + m.dia + " mm" });
        else add("out", "Tournage", "Ø " + b(fmt(d) + " mm") + " dépasse le diamètre maximal publié (" + m.dia + " mm).", { pct: 100, label: "Ø " + fmt(d) + " / " + m.dia + " mm" });
      }
      if (p === "fraisage") {
        var e = K.mill.env.slice().sort(function (a, c) { return c - a; });
        if (!known) add("check", "Fraisage", "Renseignez les dimensions pour comparer à " + b(K.mill.env.join(" × ") + " mm max") + ". 5 axes : " + esc(K.mill.five.join(", ")) + ". 3 axes : " + esc(K.mill.three.join(", ")) + ".");
        else {
          var s = dims.slice().sort(function (a, c) { return c - a; });
          var fit = s[0] <= e[0] && s[1] <= e[1] && s[2] <= e[2];
          add(fit ? "ok" : "out", "Fraisage", "Pièce " + b(s.map(fmt).join(" × ") + " mm") + " pour une capacité de " + e.join(" × ") + " mm. " + (fit ? "5 axes : " + esc(K.mill.five.join(", ")) + ". 3 axes : " + esc(K.mill.three.join(", ")) + "." : "Au-delà de la capacité indiquée pour le fraisage."), { pct: s[0] / e[0] * 100, label: fmt(s[0]) + " / " + e[0] + " mm (plus grande cote)" });
        }
      }
      if (p === "electro") {
        var plastic = mat === "Peek" || mat === "Plastiques";
        if (plastic) add("out", "Électroérosion (fil)", "Le procédé usine des métaux conducteurs : il ne convient pas à " + esc(mat) + ".");
        else add("ok", "Électroérosion (fil)", esc(K.edm.machine) + " : " + esc(K.edm.facts) + ". Dimensions maximales non publiées : à confirmer." + (tol === "micron" ? " " + b("± 2 µ") + " annoncés par l’atelier." : ""));
      }
      if (p === "rectif") {
        var rr = K.rectif;
        if (shape === "round") {
          if (!isFinite(d) || !isFinite(len)) add("check", "Rectification", "Renseignez Ø et longueur : rectifieuse cylindrique Ø" + rr.cyl[0] + " × " + rr.cyl[1] + " mm.");
          else if (d <= rr.cyl[0] && len <= rr.cyl[1]) add("ok", "Rectification", esc(rr.cyl[2]) + " : Ø " + b(fmt(d)) + " × " + b(fmt(len)) + " mm.", { pct: Math.max(d / rr.cyl[0], len / rr.cyl[1]) * 100, label: "Ø " + fmt(d) + " × " + fmt(len) + " / Ø" + rr.cyl[0] + " × " + rr.cyl[1] + " mm" });
          else add("out", "Rectification", "Ø " + b(fmt(d)) + " × " + b(fmt(len)) + " mm dépasse la rectifieuse cylindrique Ø" + rr.cyl[0] + " × " + rr.cyl[1] + " mm.", { pct: 100, label: "Ø " + fmt(d) + " × " + fmt(len) });
        } else {
          if (!isFinite(L) || !isFinite(W)) add("check", "Rectification", "Renseignez longueur et largeur : rectifieuses planes 200 × 150 et 600 × 250 mm.");
          else {
            var a = Math.max(L, W), c = Math.min(L, W), hit = null;
            rr.plane.forEach(function (pl) { if (!hit && a <= pl[0] && c <= pl[1]) hit = pl; });
            if (hit) add("ok", "Rectification", esc(hit[2]) + " mm : surface " + b(fmt(a) + " × " + fmt(c) + " mm") + ".", { pct: a / 600 * 100, label: fmt(a) + " × " + fmt(c) + " / 600 × 250 mm" });
            else add("out", "Rectification", "Surface " + b(fmt(a) + " × " + fmt(c) + " mm") + " au-delà de la plus grande rectifieuse plane (600 × 250 mm).", { pct: 100, label: fmt(a) + " × " + fmt(c) + " mm" });
          }
        }
      }
      if (p === "percage") add("check", "Perçage rapide", esc(K.drill.machine) + " au parc. Diamètres et profondeurs maximaux non publiés : à confirmer.");
    });

    /* matière */
    if (mat === "autre") add("check", "Matière", "Matières publiées : " + esc(K.materials.join(", ")) + ". Autre matière : à confirmer avec l’atelier.");
    else if (mat) add("ok", "Matière : " + mat, "L’atelier travaille " + esc(mat.toLowerCase()) + " (liste publiée : " + esc(K.materials.join(", ")) + ").");

    /* quantité */
    if (qty === "moyenne") add("ok", "Moyenne série", esc(K.robots) + ".");
    else if (qty === "petite") add("ok", "Petite série", "L’atelier annonce la réalisation « du prototype à la petite et moyenne série ». " + esc(K.robots) + ".");
    else add("ok", "Prototype", "Pièce unique ou prototype : fait partie de l’offre annoncée « du prototype à la petite et moyenne série ».");

    /* tolérance */
    if (tol === "micron") add("check", "Tolérance au micron", esc(K.micron) + ". " + esc(K.control) + ".");
    else add("ok", tol === "fine" ? "Tolérance serrée" : "Tolérance courante", esc(K.control) + ".");

    /* secteur */
    if (sec === "medical") add("ok", "Secteur médical", esc(K.certs.medical) + ".");
    else if (sec === "aero") add("ok", "Secteur aéronautique", esc(K.certs.aero) + ".");
    else add("ok", "Secteur : " + label(T.sec_opts, sec).toLowerCase(), esc(K.certs.other) + ".");

    /* finitions */
    fin.forEach(function (x) {
      if (x === "Conception") add("ok", "Conception", "Bureau d’études de Micro Mécanique depuis 2021 : " + esc(D.be) + ".");
      else add("ok", x, "Service proposé par l’atelier (page savoir-faire).");
    });

    worst = nOut ? 2 : nCheck ? 1 : 0;
    var vcls = ["is-ok", "is-check", "is-out"][worst];
    var vt = worst === 0 ? "Votre pièce entre dans le périmètre publié par l’atelier" : worst === 1 ? "Dans le parc, avec " + nCheck + " point" + (nCheck > 1 ? "s" : "") + " à confirmer" : "Un point sort du parc publié : à discuter avec l’atelier";
    out.verdict.className = "verdict " + vcls;
    out.verdict.innerHTML = '<span class="mono">' + esc(T.result_h) + "</span><b>" + esc(vt) + "</b>";
    out.rows.innerHTML = rows.join("");
    out.barsum.forEach(function (n) { n.innerHTML = "<b>" + esc(vt) + "</b>"; });

    /* mail */
    var dimTxt = shape === "round" ? "pièce ronde, Ø " + (isFinite(d) ? fmt(d) : "?") + " × " + (isFinite(len) ? fmt(len) : "?") + " mm" : "pièce prismatique, " + dims.map(function (x) { return isFinite(x) ? fmt(x) : "?"; }).join(" × ") + " mm";
    var lines = ["Bonjour,", "", "Je souhaite un devis pour la pièce suivante (préparée avec l’outil « Ma pièce » du site) :", "",
      "- Dimensions : " + dimTxt,
      "- Opérations : " + (proc.length ? proc.map(function (p) { return label(T.proc_opts, p); }).join(", ") : "à définir"),
      "- Matière : " + (mat === "autre" ? "autre (à préciser)" : mat),
      "- Quantité : " + label(T.qty_opts, qty),
      "- Tolérance la plus serrée : " + label(T.tol_opts, tol),
      "- Secteur : " + label(T.sec_opts, sec),
      "- Après usinage : " + (fin.length ? fin.map(function (x) { return x === "Conception" ? "aide à la conception (bureau d’études)" : x; }).join(", ") : "rien de particulier"), "",
      "Mon plan est joint à ce message.", "", "Verdict de l’outil (indicatif) : " + vt + ".", ""];
    var nm = val("name"), co = val("company"), ph = val("phone");
    lines.push("Cordialement,", nm || "", co || "", ph ? "Tél. " + ph : "");
    lastText = lines.join("\n");
    var subj = T.subject + " – " + (shape === "round" ? "Ø " + (isFinite(d) ? fmt(d) : "?") + " × " + (isFinite(len) ? fmt(len) : "?") + " mm" : dims.map(function (x) { return isFinite(x) ? fmt(x) : "?"; }).join(" × ") + " mm") + ", " + (mat === "autre" ? "autre matière" : mat);
    var href = "mailto:" + D.to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(lastText);
    out.send.forEach(function (a) { a.setAttribute("href", href); });
  }

  f.addEventListener("input", render);
  f.addEventListener("change", render);
  out.copy.forEach(function (bn) {
    bn.addEventListener("click", function () {
      var done = function () { var o = bn.textContent; bn.textContent = T.copied; setTimeout(function () { bn.textContent = o; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastText).then(done, done);
      else { var ta = document.createElement("textarea"); ta.value = lastText; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); done(); }
    });
  });
  render();
})();
