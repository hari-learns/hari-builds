(function () {
  "use strict";
  var d = document, root = d.documentElement;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }

  /* concept dock */
  var dock = $("#dock");
  if (dock) {
    if (store("dockx") === "1") dock.hidden = true;
    var x = $(".dock-x", dock);
    if (x) x.addEventListener("click", function () { dock.hidden = true; store("dockx", "1"); });
  }

  /* menu */
  var burger = $("#burger"), nav = $("#nav");
  if (burger && nav) {
    var setMenu = function (o) {
      if (o) nav.style.top = $("#top").getBoundingClientRect().bottom + "px";
      nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o ? "true" : "false");
      root.style.overflow = o ? "hidden" : "";
    };
    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1080) setMenu(false); });
  }

  /* reveals (IntersectionObserver, with a safety net so nothing stays hidden) */
  var rv = $$(".rv");
  function showAll() { rv.forEach(function (el) { el.classList.add("in"); }); }
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) showAll();
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("in"); }); }, 600);
    setTimeout(showAll, 6000);
  }

  /* contact form -> prefilled mailto */
  $$("form[data-mail]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = f.elements.name.value.trim(), m = f.elements.msg.value.trim();
      var body = (n ? n + "\n\n" : "") + m;
      location.href = "mailto:" + f.getAttribute("data-mail") + "?subject=" + encodeURIComponent(f.getAttribute("data-subject")) + "&body=" + encodeURIComponent(body);
    });
  });

  /* signature tool: which Cerini press fits? Only reshuffles the models published on the Cerini site. */
  var fin = $("[data-finder]");
  if (!fin) return;
  var DATA = JSON.parse($("#finder-data").textContent), S = DATA.s, out = $("#finder-out"), form = $("form", fin);
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fill(t, o) { return t.replace(/\{(\w+)\}/g, function (_, k) { return o[k] === undefined ? "" : o[k]; }); }
  function dim(a) { return a ? a[0] + " × " + a[1] : "—"; }
  function fits(die, table) { var a = Math.min(die[0], die[1]), b = Math.max(die[0], die[1]), c = Math.min(table[0], table[1]), e = Math.max(table[0], table[1]); return a <= c && b <= e; }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n > 0 ? n : null; }

  function svg(table, die) {
    var W = 420, maxW = 380, maxH = 200, k = Math.min(maxW / table[0], maxH / table[1]);
    var tw = table[0] * k, th = table[1] * k, x0 = (W - tw) / 2, y0 = 22;
    var a = Math.max(die[0], die[1]), b = Math.min(die[0], die[1]);
    var dw = (table[0] >= table[1] ? a : b) * k, dh = (table[0] >= table[1] ? b : a) * k;
    if (table[0] < table[1]) { dw = b * k; dh = a * k; }
    return '<svg class="fit-svg" viewBox="0 0 ' + W + " " + (th + 52) + '" role="img" aria-label="' + esc(S.scale) + '">' +
      '<rect class="t" x="' + x0 + '" y="' + y0 + '" width="' + tw + '" height="' + th + '"/>' +
      '<rect class="d" x="' + (x0 + (tw - dw) / 2) + '" y="' + (y0 + (th - dh) / 2) + '" width="' + dw + '" height="' + dh + '"/>' +
      '<text x="' + W / 2 + '" y="14" text-anchor="middle">' + table[0] + " × " + table[1] + " mm</text>" +
      '<text x="' + W / 2 + '" y="' + (y0 + th + 20) + '" text-anchor="middle">' + die[0] + " × " + die[1] + " mm</text></svg>" +
      '<p class="fit-cap">' + esc(S.scale) + "</p>";
  }

  function run() {
    var t = num(form.elements.force.value);
    if (!t) { out.innerHTML = '<p class="muted">' + esc(S.empty) + "</p>"; return; }
    var need = t * 10, A = num(form.elements.a.value), B = num(form.elements.b.value), W = num(form.elements.spm.value), job = form.elements.job.value;
    var die = A && B ? [A, B] : null, rows = [];
    DATA.fams.forEach(function (f) {
      if (job !== "any" && f.jobs.indexOf(job) < 0) return;
      f.models.forEach(function (m) {
        if (m.kn < need) return;
        if (W && m.spm < W) return;
        var tableState = "na";
        if (die && m.table) { if (m.ok) { if (!fits(die, m.table)) return; tableState = "fit"; } else tableState = "unk"; }
        else if (die && !m.table) tableState = "unk";
        rows.push({ f: f, m: m, ts: tableState });
      });
    });
    rows.sort(function (a, b) { return (a.ts === "unk" ? 1 : 0) - (b.ts === "unk" ? 1 : 0) || a.m.kn - b.m.kn || b.m.spm - a.m.spm; });
    rows = rows.slice(0, 6);
    var html = "";
    if (!rows.length) html = '<p class="res-none">' + esc(S.none) + "</p>";
    else {
      html = '<ul class="res-list">';
      rows.forEach(function (r, i) {
        var why = ['<li>' + esc(fill(S.why_force, { kn: r.m.kn, need: Math.round(need) })) + "</li>"];
        if (r.ts === "fit") why.push("<li>" + esc(fill(S.why_table, { t: dim(r.m.table), d: dim(die) })) + "</li>");
        if (r.ts === "unk") why.push('<li class="q">' + esc(S.why_table_unk) + "</li>");
        if (W) why.push("<li>" + esc(fill(S.why_spm, { s: r.m.spm, w: W })) + "</li>");
        if (job !== "any" && S.job_names[job]) why.push("<li>" + esc(fill(S.why_job, { j: S.job_names[job] })) + "</li>");
        var margin = Math.round((r.m.kn / need - 1) * 100);
        why.push("<li>" + esc(fill(S.margin, { m: margin })) + "</li>");
        html += '<li class="res' + (i === 0 ? " best" : "") + '"><div class="res-top"><span class="res-name">KN ' + r.m.kn + '</span>' + (i === 0 ? '<span class="badge">' + esc(S.best) + '</span>' : '') + '<span class="res-fam">' + esc(r.f.name) + "</span></div>" +
          '<div class="res-nums"><div><span>' + esc(S.kn) + "</span> " + r.m.kn + ' kN (≈ ' + r.m.kn / 10 + ' t)</div><div><span>' + esc(S.spm_l) + "</span> " + r.m.spm + "</div><div><span>" + esc(S.table_l) + "</span> " + dim(r.m.table) + "</div></div>" +
                    '<ul class="res-why">' + why.join("") + "</ul>" +
          (i === 0 && r.ts === "fit" ? svg(r.m.table, die) : "") +
          '<a class="more" href="' + esc(r.f.url) + '">' + esc(S.see) + "</a></li>";
      });
      html += "</ul>";
    }
    var used = DATA.used.filter(function (u) {
      if (u.kn < need) return false; if (W && u.spm && u.spm < W) return false;
      if (die && u.table && !fits(die, u.table)) return false; return true;
    }).sort(function (a, b) { return a.kn - b.kn; }).slice(0, 3);
    if (used.length) {
      html += '<h3 class="res-sub">' + esc(S.used_same) + '</h3><ul class="res-used">' + used.map(function (u) {
        return '<li><a href="' + esc(u.url) + '"><span>' + esc(u.name) + "</span><span>" + u.kn + " kN" + (u.table ? " · " + dim(u.table) : "") + "</span></a></li>";
      }).join("") + "</ul>";
    }
    var names = rows.slice(0, 3).map(function (r) { return "KN " + r.m.kn + " (" + r.f.name + ")"; }).join(", ");
    var body = fill(S.mail_body, { t: t, kn: Math.round(need), die: die ? dim(die) + " mm" : S.na, spm: W || S.na, job: S.jobs[job], models: names || "-" });
    var subject = fill(S.mail_subject, { kn: Math.round(need) });
    html += '<div class="res-send"><a class="btn" href="mailto:' + S.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body) + '">' + esc(S.send) + '</a><a class="btn btn-ghost" href="tel:' + S.phone_href + '">' + esc(S.call) + " " + esc(S.phone) + "</a></div>" +
      '<p class="small">' + esc(S.indicative) + "</p>";
    out.innerHTML = html;
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  form.addEventListener("input", run);
  form.addEventListener("change", run);
  if (form.elements.force.value) run();
  form.addEventListener("reset", function () { setTimeout(function () { out.innerHTML = '<p class="muted">' + esc(S.empty) + "</p>"; }, 0); });
})();
