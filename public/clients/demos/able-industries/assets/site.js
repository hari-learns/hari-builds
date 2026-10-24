(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // reveals
  var rv = $$(".rv");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (el, i) { el.style.transitionDelay = ((i % 6) * 0.06) + "s"; io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  // drawer
  var mb = $(".menu-btn"), dr = $("#drawer");
  if (mb && dr) {
    mb.addEventListener("click", function () {
      var open = mb.getAttribute("aria-expanded") === "true";
      mb.setAttribute("aria-expanded", String(!open)); dr.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    $$("a", dr).forEach(function (a) { a.addEventListener("click", function () { mb.click(); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !dr.hidden) mb.click(); });
  }

  // dock
  var dock = $("#dock");
  try { if (sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
  if (dock) setTimeout(function () { dock.hidden = true; }, 7000);
  if (dock) $("button", dock).addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  // gallery filter + lightbox
  var chips = $$(".chip[data-f]");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chips.forEach(function (x) { x.classList.toggle("on", x === c); });
      var f = c.getAttribute("data-f");
      $$(".gi").forEach(function (g) { g.hidden = f !== "all" && (" " + g.getAttribute("data-cat") + " ").indexOf(" " + f + " ") < 0; });
    });
  });
  var lb = $("#lb");
  if (lb && lb.showModal) {
    $$(".gi").forEach(function (g) {
      g.addEventListener("click", function () {
        $("img", lb).src = g.getAttribute("data-full");
        $("img", lb).alt = $("img", g).alt;
        $("p", lb).textContent = g.getAttribute("data-cap") || "";
        lb.showModal();
      });
    });
    $(".lb-x", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  // part size check (only reshuffles Able's published machine sizes)
  $$(".tool").forEach(function (tool) {
    var machines = JSON.parse(tool.getAttribute("data-machines"));
    var form = $(".tool-form", tool), out = $(".res", tool), hint = $(".tool-hint", tool), send = $("[data-send]", tool);
    var q = tool.getAttribute("data-q");
    var state = { text: "" };
    function val(n) { var v = parseFloat(form.elements[n].value); return isFinite(v) && v > 0 ? v : null; }
    function shape() { return form.elements.shape.value; }
    function layout() {
      var s = shape();
      $(".f-wid", tool).hidden = s === "tube";
      $(".f-dia", tool).hidden = !(s === "tube" || s === "weldment");
      $(".f-len span", tool).textContent = s === "tube" ? "Length (mm)" : "Longest side or length (mm)";
      $(".f-thk span", tool).textContent = s === "tube" ? "Wall thickness (mm)" : "Thickness (mm)";
    }
    function fmt(n) { return Math.round(n).toLocaleString("en-AU"); }
    function eval1(m, s, L, W, D, T) {
      if (m.shape.indexOf(s) < 0) return null;
      var r = { m: m, st: "fit", why: "", pct: 0 };
      var longest, other;
      if (s === "sheet" || s === "formed") { longest = Math.max(L, W || 0); other = Math.min(L, W || L); }
      if (s === "weldment") { longest = L; other = Math.max(W || 0, D || 0); }
      if (s === "tube") { longest = L; other = D || 0; }
      if (m.id === "flat" || m.id === "punch") {
        var a = Math.max(m.L, m.W), b = Math.min(m.L, m.W);
        r.pct = Math.max(longest / a, other / b) * 100;
        if (longest > a || other > b) { r.st = "no"; r.why = "Larger than the " + fmt(a) + " × " + fmt(b) + " mm bed."; return r; }
        if (T) {
          if (T > (m.Tcheck || m.T)) { r.st = "no"; r.why = "Thicker than the " + (m.Tcheck || m.T) + " mm listed."; return r; }
          if (T > m.T) { r.st = "chk2"; r.why = "Within 40 mm on Able’s services page, over the " + m.T + " mm listed for this machine. Ask Able."; return r; }
        }
        r.why = "Fits the " + fmt(a) + " × " + fmt(b) + " mm bed" + (T ? ", " + T + " mm within " + m.T + " mm." : "."); return r;
      }
      if (m.id === "tube") {
        r.pct = Math.max(longest / m.L, (D || 0) / m.D) * 100;
        if (longest > m.L) { r.st = "no"; r.why = "Longer than " + fmt(m.L) + " mm."; return r; }
        if (D && D > m.D) { r.st = "no"; r.why = "Wider than " + m.D + " mm diameter."; return r; }
        if (T && T > m.T) { r.st = "no"; r.why = "Wall thicker than " + m.T + " mm."; return r; }
        r.why = "Up to " + fmt(m.L) + " mm long, " + m.D + " mm diameter, " + m.T + " mm wall."; return r;
      }
      if (m.id === "brake") {
        r.pct = longest / m.L * 100;
        if (longest > m.L) { r.st = "no"; r.why = "Bend length over " + fmt(m.L) + " mm."; return r; }
        r.st = "chk2"; r.why = "Length fits. Thickness and tonnage are confirmed by Able when it quotes."; return r;
      }
      if (m.id === "robot") {
        var wd = other;
        r.pct = Math.max(longest / m.L, wd / m.D) * 100;
        if (longest > m.L || wd > m.D) { r.st = "no"; r.why = "Outside the " + fmt(m.L) + " mm × " + fmt(m.D) + " mm envelope as listed."; return r; }
        r.why = "Inside the listed envelope. Suitability for your weld is confirmed by Able."; r.st = "chk2"; return r;
      }
      if (m.id === "router") {
        r.pct = Math.max(longest / m.L, other / m.W) * 100;
        if (longest > m.L || other > m.W) { r.st = "no"; r.why = "Larger than the " + fmt(m.L) + " × " + fmt(m.W) + " mm bed."; return r; }
        if (T && T > m.T) { r.st = "no"; r.why = "Deeper than " + m.T + " mm."; return r; }
        r.st = "chk2"; r.why = "Fits the " + fmt(m.L) + " × " + fmt(m.W) + " mm bed. Able confirms which materials it can cut."; return r;
      }
      return r;
    }
    var label = { fit: "Fits", chk2: "Ask Able", no: "Too big" };
    function run() {
      layout();
      var s = shape(), L = val("L"), W = val("W"), D = val("D"), T = val("T");
      var ok = L && (s === "tube" ? D : (s === "weldment" ? true : W));
      out.innerHTML = "";
      if (!ok) { hint.hidden = false; state.text = ""; return; }
      hint.hidden = true;
      var rs = machines.map(function (m) { return eval1(m, s, L, W, D, T); }).filter(Boolean);
      var yes = rs.filter(function (r) { return r.st !== "no"; });
      var head = document.createElement("li");
      head.style.cssText = "border:0;padding:0";
      head.innerHTML = '<p class="sumline">' + (yes.length ? (rs.filter(function (r) { return r.st === "fit"; }).length + " fit, " + rs.filter(function (r) { return r.st === "chk2"; }).length + " to confirm with Able.").replace("0 fit, ", "") : "Outside the published machine sizes. Able may still be able to help: send it anyway.") + "</p>";
      out.appendChild(head);
      rs.sort(function (a, b) { return (a.st === "no") - (b.st === "no"); }).forEach(function (r) {
        var li = document.createElement("li"); li.className = r.st;
        li.innerHTML = '<div class="r-top"><b></b><span class="r-st">' + label[r.st] + '</span></div><div class="bar-t"><i></i></div><small></small>';
        $("b", li).textContent = r.m.name; $("small", li).textContent = r.m.spec + ". " + r.why;
        out.appendChild(li);
        var i = $("i", li); requestAnimationFrame(function () { i.style.width = Math.min(100, r.pct) + "%"; });
      });
      var qty = form.elements.qty.value, mat = form.elements.mat.value;
      var lines = ["Part check from the Able redesign concept", "",
        "Type: " + { sheet: "Sheet or plate part", formed: "Folded or formed part", tube: "Tube or pipe", weldment: "Large welded assembly" }[s],
        "Length / longest side: " + L + " mm"];
      if (s !== "tube" && W) lines.push("Width: " + W + " mm");
      if (D) lines.push("Diameter: " + D + " mm");
      if (T) lines.push("Thickness / wall: " + T + " mm");
      lines.push("Material: " + mat); if (qty) lines.push("Quantity: " + qty);
      if (form.elements.finish.checked) lines.push("Needs blasting and painting");
      lines.push("", "Machines that cover this size: " + (yes.map(function (r) { return r.m.name; }).join("; ") || "none listed"), "", "Name:", "Company:", "Phone:");
      state.text = lines.join("\n");
    }
    form.addEventListener("input", run); form.addEventListener("change", run);
    send.addEventListener("click", function (e) {
      e.preventDefault();
      var body = state.text || "Part details:\n\nName:\nCompany:\nPhone:";
      window.location.href = "mailto:" + q + "?subject=" + encodeURIComponent("Quote request: part size check") + "&body=" + encodeURIComponent(body);
    });
    layout();
  });
})();
