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
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("brifa-dock") === "1"; })) dock.hidden = true;
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("brifa-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* open now (Indian Standard Time, Mon-Sat 9 am to 6 pm) */
  var opens = $$("[data-open]");
  if (opens.length) safe(function () {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = o.weekday, h = parseInt(o.hour, 10) % 24, mins = h * 60 + parseInt(o.minute, 10);
    var work = wd !== "Sun", isOpen = work && mins >= 9 * 60 && mins < 18 * 60, txt;
    if (isOpen) txt = "Open now, until 6 pm (India time)";
    else if (work && mins < 9 * 60) txt = "Closed now, opens at 9 am (India time)";
    else if (wd === "Sat" || wd === "Sun") txt = "Closed now, opens Monday 9 am (India time)";
    else txt = "Closed now, opens tomorrow 9 am (India time)";
    opens.forEach(function (el) { el.hidden = false; el.classList.toggle("is-open", isOpen); $("[data-open-t]", el).textContent = txt; });
  });

  /* ------------------------------------------------ the route finder */
  var rf = $("[data-rf]");
  if (rf) (function () {
    var D = JSON.parse($("#rf-data").textContent), UI = D.ui;
    var st = { part: "", tooling: "", qty: "" };
    var out = $("[data-res]", rf), empty = $("[data-empty]", rf);
    var routeEl = $("[data-route]", rf), whyEl = $("[data-why]", rf), pnoteEl = $("[data-pnote]", rf), pgEl = $("[data-pg]", rf), sendEl = $("[data-send]", rf);
    var waEl = $("[data-wa]", rf), mailEl = $("[data-mail]", rf), copyEl = $("[data-copy]", rf), briefEl = $("[data-brief]", rf);
    var q2 = $("[data-q2]", rf), optsTool = $("[data-q2-opts=tool]", rf), optsShow = $("[data-q2-opts=show]", rf);
    var inputs = { mat: $("#rf-mat"), fmt: $("#rf-fmt"), name: $("#rf-name"), co: $("#rf-co"), ph: $("#rf-ph") };
    var q2Text = q2.textContent, q2ToolText = "2. What do you have to show?";

    function route() {
      if (st.part === "tool") return "tool";
      if (st.tooling === "have") return "stamp";
      return st.qty === "few" ? "wire" : "tool_stamp";
    }
    function partsFor(pid) { return pid === "tool"; }
    function setQ2() {
      var isTool = st.part === "tool";
      optsTool.hidden = isTool; optsShow.hidden = !isTool;
      q2.textContent = isTool ? q2ToolText : q2Text;
      $$("input[name=tooling]", rf).forEach(function (i) { i.disabled = (isTool ? optsTool.contains(i) : optsShow.contains(i)); });
    }
    function brief() {
      var r = UI.routes[route()];
      var L = ["Hello " + D.name + ", I would like a quote for a part.", ""];
      L.push("Part: " + D.parts[st.part]);
      L.push((st.part === "tool" ? "I can show: " : "Tool: ") + D.tooling[st.tooling]);
      L.push("Quantity: " + D.qty[st.qty]);
      if (inputs.mat.value.trim()) L.push("Material and thickness: " + inputs.mat.value.trim());
      L.push("Drawing format: " + inputs.fmt.value);
      L.push("Usual route (route finder): " + r.name);
      L.push("");
      if (inputs.name.value.trim()) L.push("Name: " + inputs.name.value.trim());
      if (inputs.co.value.trim()) L.push("Company: " + inputs.co.value.trim());
      if (inputs.ph.value.trim()) L.push("Phone: " + inputs.ph.value.trim());
      return L.join("\n").replace(/\n+$/, "");
    }
    function render() {
      var ready = st.part && st.tooling && st.qty;
      out.hidden = !ready; empty.hidden = !!ready;
      if (!ready) {
        var need = [];
        if (!st.part) need.push("the part"); if (!st.tooling) need.push(st.part === "tool" ? "what you have to show" : "the tool"); if (!st.qty) need.push("the quantity");
        empty.textContent = "Still to choose: " + need.join(", ") + ".";
        return;
      }
      var k = route(), r = UI.routes[k];
      routeEl.textContent = r.name; whyEl.textContent = r.why; pnoteEl.textContent = UI.partnote[st.part] || ""; pnoteEl.hidden = !pnoteEl.textContent;
      pgEl.innerHTML = ""; pgEl.appendChild(d.createTextNode("Read about " + r.name.toLowerCase().split(",")[0] + " "));
      pgEl.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
      pgEl.setAttribute("href", D.base + "/" + r.page + "/");
      sendEl.innerHTML = "";
      (st.part === "tool" ? UI.send_tool : UI.send_base).forEach(function (t) { var li = d.createElement("li"); li.textContent = t; sendEl.appendChild(li); });
      var b = brief();
      briefEl.textContent = b;
      waEl.setAttribute("href", "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(b));
      mailEl.setAttribute("href", "mailto:" + D.email + "?subject=" + encodeURIComponent(UI.mail_subject) + "&body=" + encodeURIComponent(b));
    }
    $$("input[type=radio]", rf).forEach(function (i) {
      i.addEventListener("change", function () {
        if (i.name === "part") {
          var was = st.part === "tool"; st.part = i.value;
          if ((i.value === "tool") !== was) { st.tooling = ""; $$("input[name=tooling]", rf).forEach(function (x) { x.checked = false; }); }
          setQ2();
        } else if (i.name === "tooling") st.tooling = i.value; else st.qty = i.value;
        render();
        if (st.part && st.tooling && st.qty && window.innerWidth < 960 && !i._seen) { i._seen = 1; var t = $("[data-out]", rf); if (t && !reduce) t.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });
    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", function () { if (st.part && st.tooling && st.qty) render(); }); });
    if (copyEl) copyEl.addEventListener("click", function () {
      var txt = briefEl.textContent, done = copyEl.getAttribute("data-done"), old = copyEl.textContent;
      function ok() { copyEl.textContent = done; setTimeout(function () { copyEl.textContent = old; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, ok); else ok();
    });
    var m = /[?&]part=(\w+)/.exec(location.search);
    if (m) { var pi = $('input[name=part][value="' + m[1] + '"]', rf); if (pi) { pi.checked = true; st.part = m[1]; } }
    setQ2(); render();
  })();

  /* contact form -> mail draft */
  var cf = $("#cf");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var D = JSON.parse($("#cf-data").textContent);
    var body = ($("#cf-msg").value || "") + "\n\n" + ($("#cf-name").value ? "Name: " + $("#cf-name").value + "\n" : "") + ($("#cf-ph").value ? "Phone: " + $("#cf-ph").value : "");
    window.location.href = "mailto:" + D.to + "?subject=" + encodeURIComponent(D.subject) + "&body=" + encodeURIComponent(body.trim());
  });
})();
