(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function enc(s) { return encodeURIComponent(s); }

  /* ---------- drawer */
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
  window.addEventListener("resize", function () { if (window.innerWidth >= 1080) setDrawer(false); });

  /* ---------- concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("hsm-dock") === "1"; })) dock.hidden = true;
  if (dock && !dock.hidden) setTimeout(function () { dock.hidden = true; safe(function () { sessionStorage.setItem("hsm-dock", "1"); }); }, 7000);
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("hsm-dock", "1"); }); });

  /* ---------- reveals (with a sweep that also reveals what was scrolled past) */
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

  /* ---------- hero video: the company's own footage, loaded after the poster has painted */
  var hv = $(".hero__video"), hp = $(".hero__pause");
  if (hv && !reduce) {
    var conn = navigator.connection || {};
    var slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    if (!slow) {
      var startVideo = function () {
        var big = window.matchMedia("(min-width: 900px)").matches;
        hv.src = big ? hv.getAttribute("data-d") : hv.getAttribute("data-m");
        var p = hv.play();
        var on = function () { hv.classList.add("is-playing"); if (hp) { hp.hidden = false; } };
        hv.addEventListener("playing", on, { once: true });
        if (p && p.catch) p.catch(function () { /* autoplay refused: the poster stays */ });
      };
      if (document.readyState === "complete") setTimeout(startVideo, 250); else window.addEventListener("load", function () { setTimeout(startVideo, 250); });
      if (hp) hp.addEventListener("click", function () {
        var paused = hv.paused;
        if (paused) hv.play(); else hv.pause();
        hp.setAttribute("aria-pressed", paused ? "false" : "true");
        hp.setAttribute("aria-label", paused ? hp.getAttribute("data-l-pause") : hp.getAttribute("data-l-play"));
        hp.firstElementChild.hidden = !paused; hp.lastElementChild.hidden = paused;
      });
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (hp && hp.getAttribute("aria-pressed") === "true") return; if (en.isIntersecting) { if (hv.src && hv.paused) hv.play().catch(function () {}); } else if (!hv.paused) hv.pause(); });
      }, { threshold: 0.05 }).observe(hv);
    }
  }

  /* ---------- lightbox */
  var lb = $("#lb");
  if (lb && typeof lb.showModal === "function") {
    var items = [], cur = 0, lbImg = $("img", lb), lbCap = $(".lb__cap", lb);
    var show = function (i) {
      cur = (i + items.length) % items.length; var a = items[cur];
      lbImg.src = a.getAttribute("href"); lbImg.alt = a.getAttribute("data-alt") || "";
      lbCap.textContent = (a.getAttribute("data-alt") || "") + "  (" + (cur + 1) + "/" + items.length + ")";
    };
    $$(".gal").forEach(function (g) {
      var list = $$("a", g);
      list.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); items = list; show(i); lb.showModal(); }); });
    });
    $(".lb__x", lb).addEventListener("click", function () { lb.close(); });
    $(".lb__p", lb).addEventListener("click", function () { show(cur - 1); });
    $(".lb__n", lb).addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb__in")) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
    lb.addEventListener("close", function () { lbImg.removeAttribute("src"); });
  }

  /* ---------- portfolio filters */
  $$("[data-filter]").forEach(function (box) {
    var cards = $$("[data-tags]", box.parentNode), cnt = $("[data-count]", box.parentNode);
    var st = { t: "", r: "" };
    var q = new URLSearchParams(location.search); st.t = q.get("t") || ""; st.r = q.get("r") || "";
    function apply() {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!st.t || (" " + c.getAttribute("data-tags") + " ").indexOf(" " + st.t + " ") > -1) && (!st.r || c.getAttribute("data-reg") === st.r);
        c.hidden = !ok; if (ok) n++;
      });
      $$("button", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === st[b.getAttribute("data-k")])); });
      if (cnt) cnt.textContent = cnt.getAttribute("data-tpl").replace("{n}", n);
    }
    $$("button", box).forEach(function (b) {
      b.addEventListener("click", function () { var k = b.getAttribute("data-k"), v = b.getAttribute("data-v"); st[k] = st[k] === v ? "" : v; apply(); });
    });
    apply();
  });

  /* ---------- project 1 timeline */
  $$("[data-tl]").forEach(function (tl) {
    var imgs = $$(".tl__stage img", tl), btns = $$(".tl__dates button", tl), range = $(".tl__range", tl), dateEl = $(".tl__date", tl), cap = $(".tl__cap", tl);
    var cur = -1, timer = null;
    function set(i) {
      if (i === cur) return; cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle("is-on", k === i); });
      btns.forEach(function (b, k) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      if (range) range.value = i;
      var b = btns[i]; if (dateEl) dateEl.textContent = b.getAttribute("data-date"); if (cap) cap.textContent = b.getAttribute("data-cap");
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    btns.forEach(function (b, i) { b.addEventListener("click", function () { stop(); set(i); }); });
    if (range) range.addEventListener("input", function () { stop(); set(+range.value); });
    set(0);
    if (!reduce && "IntersectionObserver" in window) {
      var played = false;
      new IntersectionObserver(function (es, ob) {
        es.forEach(function (en) {
          if (en.isIntersecting && !played) {
            played = true; ob.disconnect();
            timer = setInterval(function () { if (cur >= imgs.length - 1) { stop(); return; } set(cur + 1); }, 1500);
          }
        });
      }, { threshold: 0.6 }).observe($(".tl__stage", tl));
    }
  });

  /* ---------- compose mail / WhatsApp from a form */
  function composeLinks(form, to, wa, subject, bodyFn) {
    var mail = $("[data-mail]", form.parentNode), w = $("[data-wa]", form.parentNode);
    var body = bodyFn();
    if (mail) mail.setAttribute("href", "mailto:" + to + "?subject=" + enc(subject) + "&body=" + enc(body));
    if (w) w.setAttribute("href", "https://wa.me/" + wa + "?text=" + enc(subject + "\n\n" + body));
  }
  $$("form[data-compose]").forEach(function (form) {
    var to = form.getAttribute("data-to"), wa = form.getAttribute("data-wa"), subj = form.getAttribute("data-subject");
    var ref = new URLSearchParams(location.search).get("ref");
    var msg = form.elements.msg;
    if (ref && msg && !msg.value) msg.value = ref;
    function body() {
      var f = form.elements, L = [];
      if (f.msg && f.msg.value) L.push(f.msg.value);
      L.push("");
      if (f.nome && f.nome.value) L.push("Nome: " + f.nome.value);
      if (f.empresa && f.empresa.value) L.push("Empresa: " + f.empresa.value);
      if (f.tel && f.tel.value) L.push("Telefone: " + f.tel.value);
      if (f.email && f.email.value) L.push("Email: " + f.email.value);
      return L.join("\n");
    }
    function upd() { composeLinks(form, to, wa, subj, body); }
    form.addEventListener("input", upd); form.addEventListener("submit", function (e) { e.preventDefault(); }); upd();
  });

  /* ---------- the signature tool: has HSM done a job like mine? */
  var dataEl = $("#tool-data");
  $$("[data-tool]").forEach(function (root) {
    if (!dataEl) return;
    var D = JSON.parse(dataEl.textContent), mini = root.getAttribute("data-mode") === "mini";
    var tags = [], reg = null;
    var sumEl = $(".tool__sum", root), listEl = $(".tool__groups", root), emptyEl = $(".tool__empty", root), outEl = $(".tool__out", root);
    var form = $(".tool__form", root), ctaEl = $(".tool__cta", root);
    var q = new URLSearchParams(location.search);
    if (!mini) {
      (q.get("t") || "").split(",").forEach(function (t) { var i = $('input[name="t"][value="' + t + '"]', root); if (i) i.checked = true; });
      var rr = q.get("r"); if (rr) { var ri = $('input[name="r"][value="' + rr + '"]', root); if (ri) ri.checked = true; }
    }
    function nodeCard(p) {
      var a = d.createElement("a"); a.className = "pcard"; a.href = p.u;
      var meta = []; meta.push(p.tm || D.ui.no_time); if (p.area) meta.push(p.area);
      a.innerHTML = '<div class="pcard__img"><img src="' + p.img + '" width="' + p.w + '" height="' + p.h + '" alt="" loading="lazy" decoding="async"></div>' +
        '<div class="pcard__b"><span class="pcard__n">Projeto #' + (p.n < 10 ? "0" + p.n : p.n) + '</span><h4></h4><p class="pcard__loc"></p><div class="pcard__meta"></div></div>';
      $("h4", a).textContent = p.t; $(".pcard__loc", a).textContent = p.loc;
      var m = $(".pcard__meta", a); meta.forEach(function (x) { var s = d.createElement("span"); s.textContent = x; m.appendChild(s); });
      $("img", a).alt = p.alt;
      return a;
    }
    function group(title, arr, limit) {
      var g = d.createElement("div");
      if (title) { var h = d.createElement("h3"); h.textContent = title; g.appendChild(h); }
      var l = d.createElement("div"); l.className = "tool__list";
      var cap = limit || 6;
      arr.forEach(function (x, i) { var c = nodeCard(x.p); if (i >= cap) c.hidden = true; l.appendChild(c); });
      g.appendChild(l);
      if (arr.length > cap) {
        var bt = d.createElement("button"); bt.type = "button"; bt.className = "btn btn--ghost"; bt.style.marginTop = "14px"; bt.textContent = D.ui.more_btn + " (" + (arr.length - cap) + ")";
        bt.addEventListener("click", function () { $$("a[hidden]", l).forEach(function (a) { a.hidden = false; }); bt.remove(); });
        g.appendChild(bt);
      }
      return g;
    }
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
    function render() {
      tags = $$('input[name="t"]:checked', root).map(function (i) { return i.value; });
      var rv = $('input[name="r"]:checked', root); reg = rv ? rv.value : null;
      sumEl.innerHTML = ""; listEl.innerHTML = ""; if (ctaEl) ctaEl.innerHTML = "";
      var oldNote = $(".tool__note", root); if (oldNote) oldNote.remove();
      if (!tags.length) { emptyEl.hidden = false; sumEl.hidden = true; if (form) form.hidden = true; return; }
      emptyEl.hidden = true; sumEl.hidden = false;
      var res = D.p.map(function (p) { return { p: p, s: p.tags.filter(function (t) { return tags.indexOf(t) > -1; }).length }; }).filter(function (x) { return x.s > 0; });
      res.sort(function (a, b) { return (b.s - a.s) || (a.p.n - b.p.n); });
      var same = reg ? res.filter(function (x) { return x.p.reg === reg; }) : res;
      var other = reg ? res.filter(function (x) { return x.p.reg !== reg; }) : [];
      var shown = reg && same.length ? same : res;
      /* summary */
      var withT = shown.filter(function (x) { return x.p.d; }).sort(function (a, b) { return a.p.d - b.p.d; });
      var areas = shown.filter(function (x) { return x.p.m2; }).sort(function (a, b) { return b.p.m2 - a.p.m2; });
      var regsIn = {}; shown.forEach(function (x) { regsIn[x.p.reg] = 1; });
      var cells = [[String(shown.length), D.ui.s_n]];
      if (withT.length) { var a0 = withT[0].p.tm, a1 = withT[withT.length - 1].p.tm; cells.push([a0 === a1 ? a0 : a0 + " " + D.ui.to + " " + a1, D.ui.s_t.replace("{k}", withT.length).replace("{n}", shown.length)]); }
      if (areas.length) cells.push([fmt(areas[0].p.m2) + " m²", D.ui.s_a.replace("{n}", areas[0].p.n)]);
      cells.push([Object.keys(regsIn).map(function (k) { return D.regs[k]; }).join(", "), D.ui.s_r]);
      cells.forEach(function (c) { var dv = d.createElement("div"); dv.innerHTML = "<b></b><span></span>"; $("b", dv).textContent = c[0]; $("span", dv).textContent = c[1]; sumEl.appendChild(dv); });
      /* note */
      var note = "";
      if (reg === "") note = D.ui.n_other;
      else if (reg && !same.length) note = D.ui.n_none.replace("{r}", D.regs[reg]);
      else if (reg === "car") note = D.ui.n_car;
      if (note) { var np = d.createElement("p"); np.className = "tool__note"; np.textContent = note; outEl.insertBefore(np, listEl); }
      /* list */
      if (mini) {
        listEl.appendChild(group("", shown, 3));
        if (ctaEl) {
          var more = d.createElement("a"); more.className = "btn"; more.textContent = D.ui.more.replace("{n}", res.length);
          more.href = D.tool + "?t=" + enc(tags.join(",")) + (reg !== null ? "&r=" + enc(reg) : "") + "#resultado";
          ctaEl.appendChild(more);
        }
      } else if (reg && same.length && other.length) {
        listEl.appendChild(group(D.ui["in"][reg], same));
        listEl.appendChild(group(D.ui.g_other, other));
      } else listEl.appendChild(group("", shown));
      if (form) { form.hidden = false; composeTool(shown); }
    }
    var lastShown = [];
    function composeTool(shown) { lastShown = shown; upd(); }
    function upd() {
      if (!form || !lastShown.length && !tags.length) return;
      var f = form.elements, L = [];
      var need = tags.map(function (t) { return D.tags[t]; }).join(", ");
      var where = reg === null ? "" : (reg === "" ? "outro país" : D.regs[reg]);
      var refs = lastShown.slice(0, 4).map(function (x) { return "#" + (x.p.n < 10 ? "0" + x.p.n : x.p.n) + " " + x.p.t; });
      L.push(D.ui.m_hi); L.push("");
      L.push(D.ui.m_need + ": " + need);
      if (where) L.push(D.ui.m_where + ": " + where);
      if (f.local && f.local.value) L.push(D.ui.m_local + ": " + f.local.value);
      var pr = $('input[name="proj"]:checked', form); if (pr) L.push(D.ui.m_proj + ": " + pr.value);
      if (f.desc && f.desc.value) { L.push(""); L.push(f.desc.value); }
      if (refs.length) { L.push(""); L.push(D.ui.m_refs + ":"); refs.forEach(function (r) { L.push("- " + r); }); }
      L.push(""); if (f.nome && f.nome.value) L.push(D.ui.m_name + ": " + f.nome.value); if (f.tel && f.tel.value) L.push(D.ui.m_tel + ": " + f.tel.value);
      var body = L.join("\n"), subj = D.ui.m_subj + ": " + need + (where ? " (" + where + ")" : "");
      var mail = $("[data-mail]", form), wa = $("[data-wa]", form);
      mail.setAttribute("href", "mailto:" + D.mail + "?subject=" + enc(subj) + "&body=" + enc(body));
      wa.setAttribute("href", "https://wa.me/" + D.wa + "?text=" + enc(subj + "\n\n" + body));
    }
    root.addEventListener("change", function (e) { if (e.target.name === "t" || e.target.name === "r") render(); else upd(); });
    if (form) { form.addEventListener("input", upd); form.addEventListener("submit", function (e) { e.preventDefault(); }); }
    render();
  });
})();
