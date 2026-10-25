(function () {
  "use strict";
  var d = document, de = d.documentElement;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* reveal on scroll (sweep reveals everything at or above the fold, also after anchor jumps) */
  var rv = $$("[data-rv]");
  function sweep() { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) el.classList.add("is-in"); }); }
  if (rv.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
      rv.forEach(function (el) { io.observe(el); });
    }
    ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* menu */
  var burger = $("#burger"), nav = $("#nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("is-open", open); burger.setAttribute("aria-expanded", open ? "true" : "false");
    de.style.overflow = open ? "hidden" : "";
  }
  if (burger && nav) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1060) setMenu(false); });
  }

  /* dock */
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dock-x")) dock.hidden = true; } catch (e) {}
  if (dx && dock) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dock-x", "1"); } catch (e) {} });

  /* open / closed now (Bahrain time, Sat-Thu 08:00-18:00) */
  $$("[data-hours]").forEach(function (el) {
    try {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bahrain", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      var h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10), t = h * 60 + m, open = o.weekday !== "Fri" && t >= 480 && t < 1080;
      el.textContent = open ? el.getAttribute("data-open") : el.getAttribute("data-closed"); el.classList.toggle("on", open);
    } catch (e) {}
  });

  /* project filter */
  var fl = $("#filters"), mason = $("#mason");
  if (fl && mason) {
    $$("button", fl).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        $$("button", fl).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(".jcard", mason).forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-sector") === f); });
      });
    });
  }

  /* signature tool: what do you need glazed? */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  $$("[data-tool]").forEach(function (root) {
    var data; try { data = JSON.parse($(".tool-data", root).textContent); } catch (e) { return; }
    var T = data.T, items = {}; data.items.forEach(function (i) { items[i.slug] = i; });
    var st = { item: null, sector: null }, out = $(".tool-res", root), empty = $(".tool-empty", root);
    var ar = data.lang === "ar";
    var jump = d.createElement("a"); jump.className = "btn tool-jump"; jump.href = "#"; jump.hidden = true; jump.textContent = T.r_msg;
    var tf = $(".tool-form", root); tf.appendChild(jump);
    jump.addEventListener("click", function (e) { e.preventDefault(); $(".tool-out", root).scrollIntoView({ behavior: "smooth", block: "start" }); });

    function val(n) { var i = $('input[name="' + n + '"]', root); return i ? i.value.trim() : ""; }
    function message() {
      var it = items[st.item], L = [T.hello + ": " + it.name + "."];
      if (st.sector) L.push(T.proj + ": " + T.sectors[st.sector] + ".");
      var w = val("w"), h = val("h");
      if (w || h) L.push(T.size + ": " + (w || "?") + " × " + (h || "?") + " " + T.unit + ".");
      if (val("q")) L.push(T.qty + ": " + val("q") + ".");
      if (val("area")) L.push(T.area_l + ": " + val("area") + ".");
      L.push(T.thanks); return L.join("\n");
    }
    function links(ta) {
      var m = encodeURIComponent(ta.value);
      $(".res-wa", root).href = "https://wa.me/" + data.wa + "?text=" + m;
      $(".res-mail", root).href = "mailto:" + data.email + "?subject=" + encodeURIComponent(T.subject + ": " + items[st.item].name) + "&body=" + m;
    }
    function render() {
      if (!st.item) { out.hidden = true; empty.hidden = false; jump.hidden = true; return; }
      var it = items[st.item], h = "";
      h += '<div class="res-head"><img src="' + it.img.src + '" width="' + it.img.w + '" height="' + it.img.h + '" alt="' + esc(it.name) + '"><div><p class="eyebrow">' + esc(T.r_product) + '</p><h3>' + esc(it.name) + '</h3><p>' + esc(it.line) + '. ' + esc(data.inhouse) + '</p><a class="res-link" href="' + it.url + '">' + esc(T.r_open) + '</a></div></div>';
      h += '<div class="res-sec res-msg"><h4>' + esc(T.r_msg) + '</h4><textarea id="res-ta-' + root.id + '" aria-label="' + esc(T.r_msg) + '"' + (ar ? ' dir="rtl"' : "") + '></textarea>'
        + '<div class="res-btns"><a class="btn btn-fill res-wa" href="#" rel="noopener">' + esc(T.send_wa) + '</a><a class="btn btn-line-d res-mail" href="#">' + esc(T.send_mail) + '</a><a class="btn btn-line-d" href="' + data.tel + '">' + esc(T.call) + '</a></div><p class="res-note">' + esc(T.note) + '</p></div>';
      var pr = it.pairs.map(function (s) { return '<li><a href="' + items[s].url + '">' + esc(items[s].name) + '</a></li>'; }).join("");
      if (it.hw) pr += '<li><a href="' + data.hwurl + '">' + esc(data.hwline) + '</a></li>';
      if (pr) h += '<div class="res-sec"><h4>' + esc(T.r_pair) + '</h4><ul>' + pr + '</ul></div>';
      if (st.sector && data.ref[st.sector]) {
        h += '<div class="res-sec"><h4>' + esc(T.r_proj) + '</h4><div class="res-proj">' + data.ref[st.sector].map(function (s) { var p = data.projects[s]; return '<a href="' + p.url + '"><img src="' + p.img.src + '" width="' + p.img.w + '" height="' + p.img.h + '" alt="' + esc(p.name) + '" loading="lazy"><b>' + esc(p.name) + '</b>' + esc(p.cat) + '</a>'; }).join("") + '</div></div>';
      }
      out.innerHTML = h; out.hidden = false; empty.hidden = true; jump.hidden = false;
      var ta = $("textarea", out); ta.value = message(); links(ta); ta.addEventListener("input", function () { links(ta); });
    }
    function refreshMsg() { var ta = $("textarea", out); if (ta && st.item) { ta.value = message(); links(ta); } }
    $$("[data-item]", root).forEach(function (b) { b.addEventListener("click", function () { st.item = b.getAttribute("data-item"); $$("[data-item]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); render(); }); });
    $$("[data-sector]", root).forEach(function (b) { b.addEventListener("click", function () { var s = b.getAttribute("data-sector"); st.sector = st.sector === s ? null : s; $$("[data-sector]", root).forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-sector") === st.sector ? "true" : "false"); }); render(); }); });
    $$("input", root).forEach(function (i) { i.addEventListener("input", refreshMsg); });
    var pre = data.pre; try { var q = new URLSearchParams(location.search).get("item"); if (q && items[q]) pre = q; } catch (e) {}
    if (pre && items[pre]) { var b0 = $('[data-item="' + pre + '"]', root); if (b0) b0.click(); }
  });
  /* tool: "show my enquiry" jump only on narrow screens */
  var css = d.createElement("style"); css.textContent = "@media(min-width:900px){.tool-jump{display:none!important}}.tool-jump{width:100%;position:sticky;bottom:calc(84px + env(safe-area-inset-bottom));z-index:5;background:var(--accent);color:var(--on-accent);border-color:var(--accent);box-shadow:0 6px 18px color-mix(in srgb,var(--shadow) 25%,transparent)}.tool-jump[hidden]{display:none}"; d.head.appendChild(css);
})();
