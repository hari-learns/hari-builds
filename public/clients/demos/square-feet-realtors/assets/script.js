/* Shared: header state, mobile drawer, scroll reveals. No dependencies. */
(function () {
  var d = document, root = d.documentElement;
  var hdr = d.querySelector(".hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("solid", window.scrollY > 24 || hdr.getAttribute("data-over") !== "1"); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  var burger = d.getElementById("burger"), drawer = d.getElementById("drawer");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    if (burger) { burger.setAttribute("aria-expanded", open ? "true" : "false"); }
    root.classList.toggle("lock", open);
    if (open) { var c = drawer.querySelector("[data-dr-close]"); if (c) c.focus(); } else if (burger) { burger.focus(); }
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  if (drawer) {
    drawer.addEventListener("click", function (e) { if (e.target.closest("[data-dr-close]") || e.target.classList.contains("scrim")) setDrawer(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) setDrawer(false); });
  }

  var rv = d.querySelectorAll(".rv");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduce) { rv.forEach(function (n) { n.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  rv.forEach(function (n, i) { n.style.transitionDelay = (i % 4) * 50 + "ms"; io.observe(n); });
})();
