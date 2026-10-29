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
    var mq = window.matchMedia("(min-width: 1024px)"); if (mq.addEventListener) mq.addEventListener("change", function () { if (mq.matches) setDrawer(false); });
  }

  /* reveals */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add("in"); }); }
})();
