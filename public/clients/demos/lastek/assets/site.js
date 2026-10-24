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
    addEventListener("resize", function () { if (innerWidth > 860 && nav.classList.contains("open")) b.click(); });
  }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("lk-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("lk-dock", "1"); }); });

  /* directory filter (principals index) */
  var dirf = $$("#dir-fams button");
  dirf.forEach(function (btn) { btn.addEventListener("click", function () {
    dirf.forEach(function (x) { x.classList.toggle("on", x === btn); });
    $$("#pgrid .pcard").forEach(function (c) { c.hidden = btn.dataset.f !== "all" && (" " + c.dataset.fams + " ").indexOf(" " + btn.dataset.f + " ") < 0; });
  }); });

  /* signature tool: principal finder, matched against Lastek's own principal descriptions */
  var tool = $("#finder-tool");
  if (tool) {
    var base = tool.dataset.base, mailTo = tool.dataset.mail, DATA = null, sel = {}, fam = "all", app = "";
    var q = $("#f-q"), res = $("#f-res"), status = $("#f-status"), enq = $("#f-enq"), enqT = $("#f-enq-t"), enqA = $("#f-enq-a");
    function norm(s) { return s.toLowerCase().replace(/fibre/g, "fiber").replace(/colour/g, "color").replace(/µm/g, "um").replace(/\bthz\b/g, "terahertz").replace(/\bsuper resolution\b|super-resolution/g, "super-resolution").replace(/[^a-z0-9+ ]+/g, " "); }
    var SYN = { raman: ["raman", "spectroscop", "spectromet"], thermal: ["thermal", "thermograph", "infrared"], eyewear: ["eyewear", "goggle", "glasses"], femtosecond: ["femtosecond", "ultrafast"], ultrafast: ["ultrafast", "femtosecond", "picosecond"], camera: ["camera", "imaging"], cameras: ["camera", "imaging"], microscope: ["microscop"], laser: ["laser"], safety: ["safety", "eyewear"] };
    function stem(t) { t = t.replace(/s$/, ""); return t.length > 7 ? t.slice(0, -2) : t; }
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function words(p) { return p._w || (p._w = norm(p.n + " " + p.u + " " + p.x + " " + p.f.map(function (f) { return DATA.fam[f]; }).join(" ")).split(/\s+/)); }
    var text0 = "";
    function hits(p, toks) {
      var w = words(p), n = 0, all = true, name = norm(p.n), ph = norm(text0).trim();
      if (toks.length > 1 && (" " + norm(p.n + " " + p.u + " " + p.x).replace(/\s+/g, " ") + " ").indexOf(" " + ph.replace(/\s+/g, " ") + " ") >= 0) n += 40;
      toks.forEach(function (t) { var c = 0, alts = SYN[t] || [t]; for (var i = 0; i < w.length; i++) for (var a = 0; a < alts.length; a++) if (w[i].indexOf(alts[a]) === 0) { c += a ? 0.5 : 1; break; } if (name.indexOf(t) >= 0) c += 6; if (!c) all = false; n += c; });
      return { n: n, all: all };
    }
    function snippet(p, toks) {
      var parts = p.x.match(/[^.!?]+[.!?]*\s*/g) || [p.x], best = parts[0] || "";
      for (var i = 0; i < parts.length; i++) { var nn = norm(parts[i]); if (toks.some(function (t) { return nn.indexOf(t) >= 0; })) { best = parts[i]; break; } }
      if (best.length > 190) best = best.slice(0, 190).replace(/\s+\S*$/, "") + "…";
      var h = esc(best);
      toks.forEach(function (t) { h = h.replace(new RegExp("(" + t.replace(/[+]/g, "\\+") + "[a-zA-Z0-9]*)", "ig"), "<mark>$1</mark>"); });
      return h;
    }
    function render() {
      if (!DATA) return;
      var text = q.value.trim(); text0 = text; var toks = norm(text).split(/\s+/).filter(function (t) { return t.length > 1; }).map(stem);
      var list = DATA.p.filter(function (p) { return fam === "all" || p.f.indexOf(fam) >= 0; }), out = [], partial = false;
      if (toks.length) {
        var sc = list.map(function (p) { return { p: p, h: hits(p, toks) }; });
        out = sc.filter(function (s) { return s.h.all; });
        if (!out.length) { out = sc.filter(function (s) { return s.h.n > 0; }); partial = out.length > 0; }
        out.sort(function (a, b) { return b.h.n - a.h.n; });
      } else out = list.map(function (p) { return { p: p, h: { n: 0 } }; });
      var shown = toks.length ? out : out.slice(0, 0);
      if (!toks.length && fam !== "all") shown = out;
      res.innerHTML = shown.map(function (s) {
        var p = s.p, on = !!sel[p.s];
        return '<li class="f-card' + (on ? " sel" : "") + '" data-s="' + p.s + '"><span class="fi">' + (p.i ? '<img src="' + base + "/assets/" + p.i + '" alt="" loading="lazy" width="96" height="96">' : "") + '</span><div><span class="fam">' +
          p.f.map(function (f) { return esc(DATA.fam[f]); }).join(" · ") + '</span><h3><a href="' + base + "/principals/" + p.s + '/">' + esc(p.n) + "</a></h3><p>" + (toks.length ? snippet(p, toks) : esc((p.x || "").slice(0, 150))) +
          '</p><label><input type="checkbox" data-s="' + p.s + '"' + (on ? " checked" : "") + "> Add to my enquiry</label></div></li>";
      }).join("");
      if (!toks.length && fam === "all") status.textContent = "Type what you are trying to measure, generate or build, or tap one above.";
      else if (!shown.length) status.textContent = "No principal text mentions that. Email or call, and the team will point you to the right maker.";
      else status.textContent = shown.length + (shown.length === 1 ? " principal" : " principals") + (partial ? " match part of what you typed." : toks.length ? (toks.some(function (t) { return SYN[t]; }) && shown.length > 6 ? " related, closest first (from Lastek's published descriptions)." : " match from Lastek's published descriptions.") : " in this family.");
      enquiry();
    }
    function enquiry() {
      var keys = Object.keys(sel);
      if (!keys.length) { enq.hidden = true; return; }
      var names = keys.map(function (k) { return sel[k]; });
      enq.hidden = false; enqT.textContent = names.length + (names.length === 1 ? " principal" : " principals") + " in your enquiry: " + names.join(", ");
      var need = q.value.trim() || (fam !== "all" ? DATA.fam[fam] : "");
      var body = ["Hello Lastek,", "", "I would like to talk about:", names.map(function (n) { return "- " + n; }).join("\n"), "", "What I am trying to do: " + need, "", "Name and organisation:", "Phone:", "", "(Sent from the Lastek redesign concept)"].join("\n");
      enqA.href = "mailto:" + mailTo + "?subject=" + encodeURIComponent("Enquiry: " + (need || "principals") + " (" + names.slice(0, 3).join(", ") + (names.length > 3 ? " +" + (names.length - 3) : "") + ")") + "&body=" + encodeURIComponent(body);
    }
    function load() {
      if (DATA || tool._l) return; tool._l = 1;
      fetch(tool.dataset.src).then(function (r) { return r.json(); }).then(function (j) { DATA = j; render(); }).catch(function () { status.textContent = "The finder could not load. Browse all principals instead, or email " + mailTo + "."; });
    }
    q.addEventListener("focus", load); q.addEventListener("input", function () { app = ""; $$(".f-apps button", tool).forEach(function (x) { x.classList.remove("on"); }); render(); });
    $$(".f-apps button", tool).forEach(function (btn) { btn.addEventListener("click", function () {
      load(); $$(".f-apps button", tool).forEach(function (x) { x.classList.toggle("on", x === btn); }); q.value = btn.dataset.q; render();
    }); });
    $$(".f-fams button", tool).forEach(function (btn) { btn.addEventListener("click", function () {
      load(); fam = btn.dataset.f; $$(".f-fams button", tool).forEach(function (x) { x.classList.toggle("on", x === btn); }); render();
    }); });
    res.addEventListener("change", function (e) {
      var t = e.target; if (!t || !t.dataset.s) return;
      if (t.checked) { var p = DATA.p.filter(function (x) { return x.s === t.dataset.s; })[0]; sel[t.dataset.s] = p.n; } else delete sel[t.dataset.s];
      t.closest(".f-card").classList.toggle("sel", t.checked); enquiry();
    });
    if ("IntersectionObserver" in window) { new IntersectionObserver(function (es) { d.body.classList.toggle("in-finder", es[0].isIntersecting); }, { threshold: 0.15 }).observe(tool); }
    if ("IntersectionObserver" in window) { var lo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { load(); lo.disconnect(); } }, { rootMargin: "400px" }); lo.observe(tool); } else load();
  }
})();
