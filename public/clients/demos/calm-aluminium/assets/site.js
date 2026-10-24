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
  if (dock && safe(function () { return sessionStorage.getItem("cal-dock") === "1"; })) dock.hidden = true;
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("cal-dock", "1"); }); });

  /* grade filter */
  var fb = $$(".fchips button");
  fb.forEach(function (btn) { btn.addEventListener("click", function () {
    fb.forEach(function (x) { x.classList.toggle("on", x === btn); });
    $$("#gl li").forEach(function (li) { li.hidden = btn.dataset.f !== "all" && li.dataset.a !== btn.dataset.f; });
  }); });

  /* signature tool: "Check my material" */
  var tool = $("#tool");
  if (tool) {
    var forms = JSON.parse(tool.dataset.forms), mailTo = tool.dataset.mail;
    var f = { form: $("#t-form"), grade: $("#t-grade"), size: $("#t-size"), cut: $("#t-cut"), cert: $("#t-cert"), name: $("#t-name") };
    var status = $("#tool-status"), note = $("#tool-note"), match = $("#tool-match"), send = $("#tool-send"), sizeL = $("#t-size-l");
    var CAST = [["ATP-5 (5xxx)", 6.35, 101.6], ["Duramold-2 (2xxx)", 51, 965], ["Duramold-5 (5xxx)", 51, 762]];
    var qs = safe(function () { return new URLSearchParams(location.search).get("form"); });
    if (qs && forms[qs]) f.form.value = qs;
    function fmt(n) { return String(+n.toFixed(2)); }
    function run() {
      var k = f.form.value, F = forms[k], v = parseFloat(f.size.value), has = f.size.value !== "" && !isNaN(v);
      sizeL.textContent = F.dim; match.innerHTML = ""; status.className = "tool-status"; note.textContent = F.note;
      var line;
      if (!has) { status.textContent = F.rng || k === "tread" ? "Enter a size to check it." : "Sizes are on request."; line = "No size entered"; }
      else if (k === "cast") {
        var hit = CAST.filter(function (c) { return v >= c[1] && v <= c[2]; });
        if (hit.length) { status.textContent = "Within the listed cast plate range."; status.classList.add("ok"); hit.forEach(function (c) { var li = d.createElement("li"); li.className = "yes"; li.textContent = c[0] + ": " + c[1] + "–" + c[2] + " mm"; match.appendChild(li); }); }
        else { status.textContent = "Outside the listed cast plate ranges. Ask us."; status.classList.add("out"); }
        line = fmt(v) + " mm";
      } else if (k === "tread") {
        var ok = Math.abs(v - 1.6) < 0.005 || Math.abs(v - 3.18) < 0.005;
        status.textContent = ok ? "A listed tread plate thickness." : "Not one of the listed thicknesses (1.6, 3.18 mm). Ask us."; status.classList.add(ok ? "ok" : "out"); line = fmt(v) + " mm";
      } else if (F.rng) {
        var inr = v >= F.rng[0] && v <= F.rng[1];
        status.textContent = inr ? "Within the listed range (" + F.rng[0] + "–" + F.rng[1] + " mm)." : "Outside the listed range (" + F.rng[0] + "–" + F.rng[1] + " mm). We source other sizes on request.";
        status.classList.add(inr ? "ok" : "out"); line = fmt(v) + " mm";
      } else { status.textContent = "Sizes are on request: send the size and we will confirm."; line = fmt(v) + " mm"; }
      if (f.grade.value && f.grade.value.indexOf("Other") !== 0 && /^\d{4}-/.test(f.grade.value)) { var li2 = d.createElement("li"); li2.textContent = f.grade.value + " is on the grade list"; match.appendChild(li2); }
      if (k === "tread" && f.grade.value && f.grade.value.indexOf("3003") !== 0) { var li3 = d.createElement("li"); li3.textContent = "Listed tread plate is 3003-H22"; match.appendChild(li3); }
      var body = ["Hello Calm Aluminium,", "", "I would like a quote for:", "Product: " + F.label, "Grade and temper: " + (f.grade.value || "Not sure, please advise"), F[ "dim"] + ": " + (has ? fmt(v) : "to confirm"), "Cut size and quantity: " + (f.cut.value || "to confirm"), "Certification: " + (f.cert.value || "Not needed"), "", "Name and company: " + (f.name.value || ""), "", "(Sent from the Calm Aluminium redesign concept)"].join("\n");
      send.href = "mailto:" + mailTo + "?subject=" + encodeURIComponent("Quote request: " + F.label + (f.grade.value ? " " + f.grade.value : "")) + "&body=" + encodeURIComponent(body);
    }
    ["change", "input"].forEach(function (ev) { tool.addEventListener(ev, run); });
    run();
  }
})();
