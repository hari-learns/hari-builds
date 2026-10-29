(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* drawer */
  var dr = $("#drawer"), openBtn = $("#burger"), last = null;
  function setDrawer(o) {
    if (!dr) return; dr.classList.toggle("open", o); openBtn.setAttribute("aria-expanded", o ? "true" : "false");
    document.documentElement.style.overflow = o ? "hidden" : "";
    if (o) { last = document.activeElement; var c = $(".close", dr); c && c.focus(); } else if (last) { last.focus(); }
  }
  if (dr && openBtn) {
    openBtn.addEventListener("click", function () { setDrawer(true); });
    dr.addEventListener("click", function (e) { if (e.target.closest("[data-dr-close]") || e.target.classList.contains("scrim") || e.target.closest("a")) setDrawer(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr.classList.contains("open")) setDrawer(false); });
    var mq = window.matchMedia("(min-width: 1240px)"); (mq.addEventListener ? mq.addEventListener("change", function () { if (mq.matches) setDrawer(false); }) : 0);
  }
  /* the drawer is out of the tab order while closed */
  if (dr) { var fix = function () { $$("a, button", dr).forEach(function (n) { n.tabIndex = dr.classList.contains("open") ? 0 : -1; }); }; fix(); new MutationObserver(fix).observe(dr, { attributes: true, attributeFilter: ["class"] }); }

  /* reveals */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add("in"); }); }

  /* hero quick finder: live count from their own list, then hands the brief to the Shortlist Finder */
  var q = $("#quick");
  if (q && window.MEA_LITE) {
    var LITE = window.MEA_LITE, k = $("#q-k"), c = $("#q-c"), b = $("#q-b"), t = $("#q-t");
    function count() {
      var n = 0;
      LITE.forEach(function (l) {
        if (k.value && l[0] !== k.value) return;
        if (c.value && l[1] !== c.value && l[0] !== "farm") return;
        if (b.value && l[2]) { var bb = +b.value; if (bb === 5 ? l[2] < 5 : l[2] !== bb) return; }
        n++;
      });
      t.textContent = n === 0 ? "See what is closest" : "Show " + n + (n === 1 ? " property" : " properties");
    }
    function url() { var p = []; if (k.value) p.push("k=" + k.value); if (c.value) p.push("c=" + encodeURIComponent(c.value)); if (b.value) p.push("b=" + b.value); return q.dataset.href + (p.length ? "?" + p.join("&") : ""); }
    q.addEventListener("change", count);
    q.addEventListener("submit", function (e) { e.preventDefault(); location.href = url(); });
    count();
  }
})();
