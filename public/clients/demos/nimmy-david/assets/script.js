/* shared: drawer, reveal on scroll */
(function () {
  var d = document.getElementById("drawer"), b = document.getElementById("burger");
  if (d && b) {
    var lastFocus = null;
    var open = function (o) {
      d.classList.toggle("open", o); b.setAttribute("aria-expanded", o ? "true" : "false");
      document.documentElement.style.overflow = o ? "hidden" : "";
      if (o) { lastFocus = document.activeElement; var c = d.querySelector("[data-dr-close]"); c && c.focus(); } else if (lastFocus) lastFocus.focus();
    };
    b.addEventListener("click", function () { open(true); });
    d.addEventListener("click", function (e) { if (e.target.closest("[data-dr-close]") || e.target.classList.contains("scrim") || e.target.closest("nav a")) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.classList.contains("open")) open(false); });
  }
  var rv = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { rv.forEach(function (n) { n.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  rv.forEach(function (n) { io.observe(n); });
  /* safety: anything already above the fold or if observer lags */
  setTimeout(function () { rv.forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < innerHeight) n.classList.add("in"); }); }, 400);
})();
