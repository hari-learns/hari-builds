(function () {
  "use strict";
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* header, drawer */
  var hdr = $(".hdr"), burger = $(".hdr__burger"), drawer = $("#drawer");
  function solid() { if (hdr) hdr.classList.toggle("is-solid", (window.scrollY || 0) > 40); }
  solid(); window.addEventListener("scroll", solid, { passive: true });
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open); drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (hdr && open) hdr.classList.add("is-solid"); else solid();
  }
  if (burger) {
    burger.addEventListener("click", function () { setDrawer(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 980) setDrawer(false); });
  }
  var dock = $("#dock"), dx = $("#dock-x");
  try { if (sessionStorage.getItem("dockx")) dock.hidden = true; } catch (e) {}
  if (dx) dx.addEventListener("click", function () { dock.hidden = true; try { sessionStorage.setItem("dockx", "1"); } catch (e) {} });

  /* reveals */
  var rv = $$(".rv");
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (n) { n.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rv.forEach(function (n) { io.observe(n); });
    var raf = 0, sweep = function () {
      raf = 0; var vh = window.innerHeight;
      rv.forEach(function (n) { if (!n.classList.contains("in") && n.getBoundingClientRect().top < vh * 0.96) { n.classList.add("in"); io.unobserve(n); } });
    };
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(sweep); }, { passive: true }); sweep();
  }

  /* timeline progress */
  var tl = $("#tl");
  if (tl && !reduce) {
    var tick = function () {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.7 - r.top) / r.height)); tl.style.setProperty("--p", p.toFixed(3));
    };
    tick(); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
  }

  /* video facades */
  function ytSrc(id, extra) { return "https://www.youtube-nocookie.com/embed/" + id + "?" + (extra || "autoplay=1&rel=0&modestbranding=1&playsinline=1"); }
  $$(".vid").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = d.createElement("iframe"); f.src = ytSrc(b.getAttribute("data-yt")); f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.setAttribute("allowfullscreen", ""); f.title = b.getAttribute("aria-label").replace("Play video: ", "");
      b.innerHTML = ""; b.removeAttribute("aria-label"); b.appendChild(f); f.focus();
    });
  });

  /* hero film: their own homepage video, started after load, muted, with a pause control */
  var film = $("#film"), tg = $("#film-toggle");
  if (film) {
    var conn = navigator.connection || {}, slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "") || conn.effectiveType === "3g";
    var on = false, timer = null;
    var startFilm = function () {
      if (on) return; on = true;
      var id = film.getAttribute("data-yt"), st = film.getAttribute("data-start") || "0";
      var f = d.createElement("iframe");
      f.src = ytSrc(id, "autoplay=1&mute=1&loop=1&playlist=" + id + "&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&start=" + st);
      f.setAttribute("tabindex", "-1"); f.setAttribute("aria-hidden", "true"); f.title = "Background film"; f.allow = "autoplay; encrypted-media";
      film.appendChild(f); timer = setTimeout(function () { film.classList.add("is-on"); }, 2600);
      if (tg) { tg.hidden = false; tg.textContent = "Pause film"; tg.setAttribute("aria-pressed", "false"); }
    };
    var stopFilm = function () {
      on = false; clearTimeout(timer); film.classList.remove("is-on");
      setTimeout(function () { if (!on) film.innerHTML = ""; }, 1200);
      if (tg) { tg.textContent = "Play film"; tg.setAttribute("aria-pressed", "true"); }
    };
    if (tg) tg.addEventListener("click", function () { on ? stopFilm() : startFilm(); });
    if (!reduce && !slow) {
      var go = function () { setTimeout(startFilm, 1200); };
      if (d.readyState === "complete") go(); else window.addEventListener("load", go);
    }
  }

  /* map on tap, contact form -> mailto */
  var ml = $("#map-load");
  if (ml) ml.addEventListener("click", function () {
    var f = d.createElement("iframe"); f.src = ml.getAttribute("data-src"); f.title = "Map: Larrington Trailers, Great Fen Rd, Wyberton, Boston PE21 7PB"; f.loading = "lazy";
    ml.parentNode.replaceChild(f, ml);
  });
  var enq = $("#enq");
  if (enq) enq.addEventListener("submit", function (e) {
    e.preventDefault();
    var b = "Name: " + enq.Name.value + "\nPhone: " + enq.Phone.value + "\n\n" + enq.Message.value;
    location.href = "mailto:info@larringtontrailers.com?subject=" + encodeURIComponent("Website enquiry") + "&body=" + encodeURIComponent(b);
  });

  /* ---------- signature tool: Which Larrington fits my job? ---------- */
  var app = $("#tool-app"), dataEl = $("#tool-data");
  if (app && dataEl) {
    var T = JSON.parse(dataEl.textContent), U = T.ui, jobs = T.jobs;
    var state = { job: null, ans: {} }, panel = null, resBox = null;
    var grid = d.createElement("div"); grid.className = "tool__jobs"; grid.setAttribute("role", "group"); grid.setAttribute("aria-label", U.step1);
    jobs.forEach(function (j) {
      var b = d.createElement("button"); b.type = "button"; b.className = "job"; b.setAttribute("aria-pressed", "false"); b.setAttribute("data-job", j.id);
      b.innerHTML = (j.img ? '<img src="' + j.img[0] + '" width="' + j.img[1] + '" height="' + j.img[2] + '" alt="" loading="lazy" decoding="async">' : "") + '<span class="job__t"><b>' + esc(j.label) + "</b><span>" + esc(j.sub) + "</span></span>";
      b.addEventListener("click", function () { pick(j.id, true); });
      grid.appendChild(b);
    });
    app.innerHTML = ""; app.appendChild(grid);

    function pick(id, scroll) {
      state.job = id; state.ans = {};
      $$(".job", grid).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-job") === id ? "true" : "false"); });
      var j = jobs.filter(function (x) { return x.id === id; })[0];
      if (panel) panel.remove();
      panel = d.createElement("div"); panel.className = "tool__panel"; panel.id = "tool-panel"; panel.tabIndex = -1;
      var qs = d.createElement("div"); qs.className = "tool__q";
      j.qs.forEach(function (q) {
        var fs = d.createElement("fieldset"); fs.className = "q"; fs.innerHTML = "<legend>" + esc(q.q) + "</legend>";
        var wrap = d.createElement("div"); wrap.className = "q__opts";
        q.opts.forEach(function (o) {
          var b = d.createElement("button"); b.type = "button"; b.className = "opt"; b.setAttribute("aria-pressed", "false"); b.textContent = o.label;
          b.addEventListener("click", function () {
            var cur = state.ans[q.id] === o.id; state.ans[q.id] = cur ? null : o.id;
            $$(".opt", wrap).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
            if (!cur) b.setAttribute("aria-pressed", "true");
            showResults(j);
          });
          wrap.appendChild(b);
        });
        fs.appendChild(wrap); qs.appendChild(fs);
      });
      var reset = d.createElement("button"); reset.type = "button"; reset.className = "tool__reset"; reset.textContent = U.reset;
      reset.addEventListener("click", function () { state.job = null; panel.remove(); panel = null; $$(".job", grid).forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); grid.scrollIntoView({ block: "center" }); });
      qs.appendChild(reset);
      resBox = d.createElement("div"); resBox.className = "res"; resBox.setAttribute("aria-live", "polite");
      if (j.qs.length) panel.appendChild(qs); else { panel.style.gridTemplateColumns = "minmax(0,1fr)"; }
      panel.appendChild(resBox); app.appendChild(panel);
      showResults(j);
      if (scroll) panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }

    function compute(j) {
      var score = {}, why = {}, order = [];
      function add(s, r, w) { if (!T.prods[s]) return; if (!(s in score)) { score[s] = 0; why[s] = []; order.push(s); } score[s] += w; if (why[s].indexOf(r) < 0) why[s].push(r); }
      Object.keys(j.base).forEach(function (s) { add(s, j.base[s], 1); });
      j.qs.forEach(function (q) {
        var a = state.ans[q.id]; if (!a) return;
        q.opts.forEach(function (o) { if (o.id === a) Object.keys(o.adds).forEach(function (s) { add(s, o.adds[s], 2); }); });
      });
      order.sort(function (a, b) { return score[b] - score[a]; });
      return order.map(function (s) { return { s: s, p: T.prods[s], why: why[s], score: score[s] }; });
    }
    function summary(j, list) {
      var lines = ["Hello Larrington Trailers,", "", "I used the trailer finder on your website. What I need:", "- Job: " + j.label];
      j.qs.forEach(function (q) { var a = state.ans[q.id]; if (!a) return; q.opts.forEach(function (o) { if (o.id === a) lines.push("- " + q.q + " " + o.label); }); });
      lines.push("", "Shortlist: " + list.slice(0, 3).map(function (x) { return x.p.n; }).join("; "), "", "Name:", "Phone:", "Farm or company:", "Postcode:", "When do you need it:");
      return lines.join("\n");
    }
    function showResults(j) {
      var list = compute(j); if (!list.length) { resBox.innerHTML = "<p>" + esc(U.none) + "</p>"; return; }
      var b = list[0], alts = list.slice(1, 3), h = "";
      h += '<article class="res__best">' + (b.p.i ? '<img src="' + b.p.i[0] + '" width="' + b.p.i[1] + '" height="' + b.p.i[2] + '" alt="' + esc(b.p.n) + '">' : "") +
        '<div class="res__body"><span class="res__tag">' + esc(U.best) + '</span><h3 class="res__n">' + esc(b.p.n) + '</h3><ul class="res__why">' + b.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + '</ul><a class="res__link" href="' + b.p.u + '">' + esc(U.see) + " " + esc(b.p.n) + " &rarr;</a></div></article>";
      if (alts.length) {
        h += '<div class="res__alts" aria-label="' + esc(U.also) + '">' + alts.map(function (a) {
          return '<a class="alt" href="' + a.p.u + '">' + (a.p.i ? '<img src="' + a.p.i[0] + '" width="' + a.p.i[1] + '" height="' + a.p.i[2] + '" alt="" loading="lazy">' : "") + '<span class="alt__t"><b>' + esc(a.p.n) + "</b><span>" + esc(a.why[0]) + "</span></span></a>";
        }).join("") + "</div>";
      }
      var extra = "";
      T.stock.filter(function (s) { return s.job === j.id; }).forEach(function (s) {
        extra += '<a class="pill" href="' + T.stockUrl + '">' + (s.i ? '<img src="' + s.i + '" width="64" height="48" alt="" loading="lazy">' : "") + "<span><b>" + esc(U.stock) + "</b>" + esc(s.t) + "</span></a>";
      });
      if (j.hire) extra += '<a class="pill" href="' + T.hireUrl + '"><span><b>' + esc(U.hire) + "</b>" + esc(j.hire) + "</span></a>";
      if (extra) h += '<div class="res__extra">' + extra + "</div>";
      var body = summary(j, list), subj = "Trailer enquiry: " + j.label;
      h += '<div class="res__act"><a class="btn btn--accent" href="mailto:' + T.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body) + '">' + esc(U.mail) + '</a><a class="btn btn--ghost" href="tel:' + T.tel + '">' + esc(U.call) + "</a></div>";
      h += '<p class="res__note">' + esc(U.note) + "</p>";
      resBox.innerHTML = h;
    }
    var m = /[?&]job=([a-z]+)/.exec(location.search);
    if (m && jobs.some(function (x) { return x.id === m[1]; })) pick(m[1], false);
  }
})();
