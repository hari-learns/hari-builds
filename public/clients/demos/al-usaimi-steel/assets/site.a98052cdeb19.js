(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function h(tag, attrs, kids) {
    var el = d.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") el.textContent = attrs[k]; else if (k === "html") el.innerHTML = attrs[k]; else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) el.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? d.createTextNode(c) : c); });
    return el;
  }

  /* header solid on scroll */
  var hdr = $("#hdr");
  function onScroll() { if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

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
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrawer(false); var dl = $("#vdlg"); if (dl && dl.open) dl.close(); } });
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setDrawer(false); });

  /* concept dock */
  var dock = $("#dock"), dockX = $("#dock-x");
  if (dock && safe(function () { return sessionStorage.getItem("aus-dock") === "1"; })) dock.hidden = true;
  if (dock && !dock.hidden && !reduce) setTimeout(function () { dock.classList.add("is-quiet"); }, 7000);
  if (dockX) dockX.addEventListener("click", function () { dock.hidden = true; safe(function () { sessionStorage.setItem("aus-dock", "1"); }); });

  /* reveals, with a sweep that also reveals anything already scrolled past */
  var rvs = $$(".rv");
  function activate(el) { el.classList.add("is-in"); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { activate(en.target); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  rvs.forEach(function (el) { if (io) io.observe(el); else activate(el); });
  function sweep() { var vh = window.innerHeight; rvs.forEach(function (el) { if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < vh * 0.96) activate(el); }); }
  ["load", "scroll", "resize", "pageshow"].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  if (reduce) rvs.forEach(activate);

  /* video facade -> dialog */
  var vlink = $("[data-video]"), vdlg = $("#vdlg"), vframe = null;
  if (vlink && vdlg && typeof vdlg.showModal === "function") {
    vlink.addEventListener("click", function (e) {
      e.preventDefault();
      vframe = d.createElement("iframe");
      vframe.src = "https://www.youtube-nocookie.com/embed/" + vlink.getAttribute("data-video") + "?autoplay=1&rel=0";
      vframe.title = vdlg.getAttribute("aria-label") || "";
      vframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      vframe.setAttribute("allowfullscreen", "");
      vdlg.appendChild(vframe); vdlg.showModal();
    });
    vdlg.addEventListener("close", function () { if (vframe) { vframe.remove(); vframe = null; } });
    vdlg.addEventListener("click", function (e) { if (e.target === vdlg) vdlg.close(); });
    $$("[data-vclose]", vdlg).forEach(function (b) { b.addEventListener("click", function () { vdlg.close(); }); });
  }

  /* contact form -> drafted email */
  var enq = $("#enq");
  if (enq) {
    var ed = JSON.parse($("#enq-data").textContent);
    var text = function () {
      var v = function (n) { return (enq.elements[n].value || "").trim(); };
      return (v("msg") || "") + "\n\n" + [v("name"), v("phone"), v("email")].filter(Boolean).join(" | ");
    };
    enq.addEventListener("submit", function (e) {
      e.preventDefault();
      location.href = "mailto:" + ed.to + "?cc=" + encodeURIComponent(ed.cc) + "&subject=" + encodeURIComponent(ed.subject) + "&body=" + encodeURIComponent(text());
    });
    var cp = $("#enq-copy");
    if (cp) cp.addEventListener("click", function () {
      var t = text(), done = cp.getAttribute("data-done"), old = cp.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = done; setTimeout(function () { cp.textContent = old; }, 1600); }, function () { });
    });
  }

  /* ---------------------------------------------------------------- the size check */
  var dataEl = $("#tool-data");
  if (!dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), ui = DATA.ui;
  var BYID = {}; DATA.items.forEach(function (it) { BYID[it.id] = it; });
  function famItems(f) { return DATA.items.filter(function (it) { return it.fam === f; }); }
  function fmt(n) { return (Math.round(n * 1000) / 1000).toString(); }
  function isChoice(f) { return !!(f.choice || f.opts); }
  function choices(f) { return f.choice ? f.choice : f.opts.map(String).concat(["Other"]); }
  function okCount(f) { return f.choice ? f.okcount : f.opts.length; }

  var LKEY = "aus-list";
  var shared = { list: safe(function () { return JSON.parse(sessionStorage.getItem(LKEY) || "[]"); }) || [], region: "Eastern", opt: 0, who: { name: "", company: "", phone: "", city: "" } };
  function saveList() { safe(function () { sessionStorage.setItem(LKEY, JSON.stringify(shared.list)); }); }
  var tools = [];

  function evalItem(it, vals) {
    var res = [], v = {}, fs = it.fields;
    fs.forEach(function (f) { v[f.k] = vals[f.k]; });
    var pairVals = null;
    if (it.pair) { var a = +v.a, b = +v.b; pairVals = a <= b ? [a, b] : [b, a]; }
    var ok = true;
    fs.forEach(function (f, i) {
      var val = v[f.k], st = { f: f, val: val, ok: true, dir: "", tier: "" };
      if (isChoice(f)) { st.ok = val < okCount(f); }
      else {
        if (it.pair && i < 2) val = pairVals[i];
        st.val = val;
        if (f.min !== null && f.min !== undefined && val < f.min) { st.ok = false; st.dir = "below"; }
        if (val > f.max) { st.ok = false; st.dir = "above"; }
        if (st.ok && f.tiers) for (var t = 0; t < f.tiers.length; t++) { if (val <= f.tiers[t][0]) { st.tier = f.tiers[t][1]; break; } }
        if (!(val >= 0) || isNaN(val)) { st.ok = false; st.dir = "none"; }
      }
      if (!st.ok) ok = false;
      res.push(st);
    });
    return { ok: ok, fields: res };
  }
  function rangeText(f) {
    if (isChoice(f)) return "";
    var lo = (f.min === null || f.min === undefined) ? ui.upto + " " : fmt(f.min) + " - ";
    return lo + fmt(f.max) + " " + f.unit;
  }
  function lineText(it, vals, qty, unit) {
    var ev = evalItem(it, vals), parts = [];
    if (it.pair) {
      var f0 = ev.fields[0], f1 = ev.fields[1], u = it.fields[0].unit;
      parts.push(fmt(f0.val) + " x " + fmt(f1.val) + " " + u);
      ev.fields.slice(2).forEach(function (s) { parts.push(s.f.label.toLowerCase() + " " + s.val + (isChoice(s.f) ? "" : " " + s.f.unit)); });
    } else {
      ev.fields.forEach(function (s) {
        if (isChoice(s.f)) parts.push(s.f.label.toLowerCase() + " " + choices(s.f)[s.val] + (s.f.unit ? " " + s.f.unit : ""));
        else parts.push(s.f.label.toLowerCase() + " " + fmt(s.val) + " " + s.f.unit);
      });
    }
    var t = it.label + ": " + parts.join(", ");
    if (qty) t += ", qty " + qty + " " + unit;
    t += ev.ok ? "" : " (outside published range, please advise)";
    return t;
  }

  function Tool(root) {
    var self = this;
    this.root = root; this.mode = root.getAttribute("data-mode"); this.lockFam = root.getAttribute("data-fam");
    this.pickEl = $("[data-pick]", root); this.inEl = $("[data-in]", root); this.outEl = $("[data-out]", root); this.actEl = $("[data-act]", root); this.listEl = $("[data-list]", root);
    this.fam = this.lockFam || DATA.chips[0][0];
    this.qty = ""; this.unit = ui.units[0];
    this.setItem(famItems(this.fam)[0].id);
    var q = new URLSearchParams(location.search);
    if (q.get("i") && BYID[q.get("i")]) {
      var it = BYID[q.get("i")]; if (!this.lockFam || it.fam === this.lockFam) {
        this.fam = it.fam; this.setItem(it.id);
        var vs = (q.get("v") || "").split("_");
        it.fields.forEach(function (f, i) { if (vs[i] !== undefined && vs[i] !== "" && !isNaN(+vs[i])) self.vals[f.k] = +vs[i]; });
        if (q.get("q")) this.qty = q.get("q");
        if (q.get("u") && ui.units.indexOf(q.get("u")) >= 0) this.unit = q.get("u");
      }
    }
    this.renderPick(); this.renderIn(); this.update(); this.renderAct(); if (this.listEl) this.renderList();
  }
  Tool.prototype.setItem = function (id) {
    this.item = BYID[id]; this.vals = {};
    var self = this; this.item.fields.forEach(function (f) { self.vals[f.k] = f.def; });
  };
  Tool.prototype.renderPick = function () {
    var self = this, el = this.pickEl; el.innerHTML = "";
    if (!this.lockFam) {
      el.appendChild(h("p", { "class": "tool__lab mono", text: ui.chip_label }));
      var row = h("div", { "class": "chips", role: "group", "aria-label": ui.chip_label });
      DATA.chips.forEach(function (c) {
        var b = h("button", { type: "button", "class": "chip", "aria-pressed": c[0] === self.fam ? "true" : "false", text: c[1] });
        b.addEventListener("click", function () { self.fam = c[0]; self.setItem(famItems(c[0])[0].id); self.renderPick(); self.renderIn(); self.update(); self.renderAct(); });
        row.appendChild(b);
      });
      el.appendChild(row);
    }
    var its = famItems(this.fam);
    if (its.length > 1) {
      var sid = "var-" + (this.root.id || "t");
      var sel = h("select", { id: sid }, its.map(function (it) { return h("option", { value: it.id, text: it.label }); }));
      sel.value = this.item.id;
      sel.addEventListener("change", function () { self.setItem(sel.value); self.renderIn(); self.update(); self.renderAct(); });
      el.appendChild(h("div", { "class": "fld fld--sel" }, [h("label", { "for": sid, text: ui.variant_label }), sel]));
    }
  };
  Tool.prototype.scale = function (f) { var mx = f.max * 1.3; return mx; };
  Tool.prototype.renderIn = function () {
    var self = this, it = this.item, el = this.inEl; el.innerHTML = ""; this.rulers = {}; this.nums = {};
    if (it.hint) el.appendChild(h("p", { "class": "tool__hint", text: it.hint }));
    it.fields.forEach(function (f) {
      var id = "f-" + (self.root.id || "t") + "-" + f.k;
      var wrap = h("div", { "class": "fld" });
      if (isChoice(f)) {
        wrap.appendChild(h("span", { "class": "lbl", id: id + "-l", text: f.label + (f.unit ? " (" + f.unit + ")" : "") }));
        var row = h("div", { "class": "chips", role: "group", "aria-labelledby": id + "-l" });
        choices(f).forEach(function (c, i) {
          var b = h("button", { type: "button", "class": "chip", "aria-pressed": self.vals[f.k] === i ? "true" : "false", text: c });
          b.addEventListener("click", function () { self.vals[f.k] = i; $$(".chip", row).forEach(function (x, j) { x.setAttribute("aria-pressed", j === i ? "true" : "false"); }); self.update(); });
          row.appendChild(b);
        });
        wrap.appendChild(row);
      } else {
        var inp = h("input", { id: id, type: "number", inputmode: "decimal", step: f.step, min: "0", value: self.vals[f.k] });
        var top = h("div", { "class": "fld__top" }, [h("label", { "for": id, text: f.label }), h("div", { "class": "num" }, [inp, h("span", { text: f.unit })])]);
        var mx = self.scale(f);
        var rg = h("input", { type: "range", "aria-label": f.label, min: 0, max: fmt(mx), step: f.step, value: Math.min(mx, self.vals[f.k]) });
        var ruler = h("div", { "class": "ruler", "aria-hidden": "true" });
        var lo = (f.min === null || f.min === undefined) ? 0 : f.min;
        if (f.tiers) {
          var prev = lo;
          f.tiers.forEach(function (t, i) {
            ruler.appendChild(h("i", { "class": "rband rband--" + i, style: "left:" + (prev / mx * 100) + "%;width:" + ((t[0] - prev) / mx * 100) + "%" }));
            prev = t[0];
          });
        } else ruler.appendChild(h("i", { "class": "rband", style: "left:" + (lo / mx * 100) + "%;width:" + ((f.max - lo) / mx * 100) + "%" }));
        var mk = h("b", { "class": "mark" }); ruler.appendChild(mk);
        var cap = h("p", { "class": "rcap" }, [h("span", { text: ui.range + " " + rangeText(f) })]);
        function sync(v, from) {
          v = parseFloat(v); self.vals[f.k] = isNaN(v) ? "" : v;
          if (from !== "num") inp.value = isNaN(v) ? "" : fmt(v);
          if (from !== "rg" && !isNaN(v)) rg.value = Math.min(mx, v);
          self.update();
        }
        inp.addEventListener("input", function () { sync(inp.value, "num"); });
        rg.addEventListener("input", function () { sync(rg.value, "rg"); });
        wrap.appendChild(top); wrap.appendChild(rg); wrap.appendChild(ruler); wrap.appendChild(cap);
        self.rulers[f.k] = { mark: mk, mx: mx, cap: cap };
        self.nums[f.k] = inp;
      }
      el.appendChild(wrap);
    });
  };
  Tool.prototype.update = function () {
    var self = this, it = this.item, ev = evalItem(it, this.vals);
    ev.fields.forEach(function (s) {
      var r = self.rulers[s.f.k]; if (!r) return;
      var p = Math.max(0, Math.min(1, (s.val || 0) / r.mx));
      r.mark.style.left = (p * 100) + "%";
      r.mark.className = "mark" + (s.ok ? "" : " is-out");
    });
    var out = this.outEl; out.innerHTML = "";
    var empty = ev.fields.some(function (s) { return !isChoice(s.f) && s.dir === "none"; });
    var box = empty ? h("div", { "class": "verdict" }, [h("span", { "class": "badge", text: "?" }), h("div", {}, [h("b", { "class": "verdict__t", text: ui.type_size })])]) :
      h("div", { "class": "verdict " + (ev.ok ? "is-ok" : "is-no") }, [
        h("span", { "class": "badge " + (ev.ok ? "ok" : "no"), text: ev.ok ? "\u2713" : "!" }),
        h("div", {}, [h("b", { "class": "verdict__t", text: ev.ok ? ui.ok_h : ui.out_h }), h("p", { text: ev.ok ? ui.ok_p : ui.out_p })])
      ]);
    out.appendChild(box);
    var ul = h("ul", { "class": "chk" });
    ev.fields.forEach(function (s) {
      var f = s.f, line;
      if (isChoice(f)) line = f.label + ": " + choices(f)[s.val];
      else {
        var name = f.label;
        if (it.pair && s.f.k === "a") name = ui.small;
        if (it.pair && s.f.k === "b") name = ui.large;
        line = name + " " + (isNaN(s.val) ? "-" : fmt(s.val)) + " " + f.unit;
        if (s.tier) line += " (" + ui.tier.replace("%s", s.tier) + ")";
        if (!s.ok && s.dir && s.dir !== "none") line += ": " + ui[s.dir] + " " + (s.dir === "below" ? fmt(f.min) : fmt(f.max)) + " " + f.unit;
        else if (!isChoice(f)) line += " · " + rangeText(f);
      }
      ul.appendChild(h("li", { "class": s.ok ? "ok" : "no", text: line }));
    });
    out.appendChild(ul);
    if (!ev.ok && !empty) {
      var near = [];
      ev.fields.forEach(function (s) { if (!s.ok && !isChoice(s.f) && s.dir) { var t = s.dir === "below" ? s.f.min : s.f.max; near.push(s.f.label.toLowerCase() + " " + fmt(t) + " " + s.f.unit); } });
      if (near.length) out.appendChild(h("p", { "class": "tool__x", text: ui.nearest + ": " + near.join(", ") }));
      var alts = DATA.items.filter(function (o) {
        if (o.id === it.id || o.fam !== it.fam || o.pair || it.pair || o.fields.length !== it.fields.length) return false;
        for (var i = 0; i < o.fields.length; i++) if (o.fields[i].unit !== it.fields[i].unit || isChoice(o.fields[i]) || isChoice(it.fields[i])) return false;
        var v = {}; o.fields.forEach(function (f, i) { v[f.k] = self.vals[it.fields[i].k]; });
        return evalItem(o, v).ok;
      });
      if (alts.length) out.appendChild(h("p", { "class": "tool__x" }, [ui.alt_h + ": "].concat(alts.map(function (o, i) { var b = h("button", { type: "button", "class": "linkbtn", text: o.label }); b.addEventListener("click", function () { var old = self.vals, nv = {}; o.fields.forEach(function (f, i2) { nv[f.k] = old[it.fields[i2].k]; }); self.setItem(o.id); self.vals = nv; self.renderPick(); self.renderIn(); self.update(); self.renderAct(); }); return b; }))));
    }
    if (it.extras && it.extras.length) it.extras.forEach(function (x) { out.appendChild(h("p", { "class": "tool__x", text: x })); });
    if (it.note) out.appendChild(h("p", { "class": "note", text: it.note }));
    var src = DATA.src[it.fam];
    var links = h("p", { "class": "tool__src" }, []);
    if (DATA.famUrl[it.fam]) links.appendChild(h("a", { "class": "tlink", href: DATA.famUrl[it.fam], text: it.fam === "galvanizing" ? "Galvanizing" : (DATA.chips.filter(function (c) { return c[0] === it.fam; })[0] || [0, ""])[1] }));
    if (src) { links.appendChild(h("a", { "class": "tlink", href: src[0], target: "_blank", rel: "noopener", text: ui.source + ": " + src[1] })); }
    out.appendChild(links);
    if (this.addBtn) this.addBtn.textContent = ev.ok ? ui.add : ui.special;
    if (this.compactLink) this.compactLink.setAttribute("href", this.paramsUrl());
  };
  Tool.prototype.paramsUrl = function () {
    var it = this.item, vs = it.fields.map(function (f) { return this.vals[f.k]; }, this).join("_");
    var q = "?i=" + encodeURIComponent(it.id) + "&v=" + encodeURIComponent(vs);
    if (this.qty) q += "&q=" + encodeURIComponent(this.qty) + "&u=" + encodeURIComponent(this.unit);
    return DATA.sizeUrl + q + "#size";
  };
  Tool.prototype.renderAct = function () {
    var self = this, el = this.actEl; el.innerHTML = "";
    if (this.mode === "compact") {
      this.compactLink = h("a", { "class": "btn", href: this.paramsUrl(), text: ui.compact_cta }, []);
      el.appendChild(this.compactLink); return;
    }
    var qid = "q-" + (this.root.id || "t");
    var qty = h("input", { id: qid, type: "number", inputmode: "decimal", min: "0", value: this.qty, placeholder: "0" });
    var un = h("select", { "aria-label": ui.qty }, ui.units.map(function (u) { return h("option", { value: u, text: u }); })); un.value = this.unit;
    qty.addEventListener("input", function () { self.qty = qty.value; }); un.addEventListener("change", function () { self.unit = un.value; });
    el.appendChild(h("div", { "class": "qtyrow" }, [h("label", { "for": qid, text: ui.qty }), qty, un]));
    var add = h("button", { type: "button", "class": "btn", text: ui.add });
    this.addBtn = add; add.textContent = evalItem(this.item, this.vals).ok ? ui.add : ui.special;
    add.addEventListener("click", function () {
      var ev = evalItem(self.item, self.vals);
      if (ev.fields.some(function (s) { return !isChoice(s.f) && s.dir === "none"; })) { var fi = $("input[type=number]", self.inEl); if (fi) fi.focus(); return; }
      shared.list.push({ id: self.item.id, vals: JSON.parse(JSON.stringify(self.vals)), qty: self.qty, unit: self.unit });
      saveList(); self.qty = ""; self.renderAct(); tools.forEach(function (t) { if (t.listEl) t.renderList(); });
      var l = self.listEl; if (l && l.scrollIntoView) l.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
    el.appendChild(add);
  };
  Tool.prototype.message = function () {
    var w = shared.who, L = ui, lines = shared.list.map(function (x, i) { return (i + 1) + ". " + lineText(BYID[x.id], x.vals, x.qty, x.unit); });
    var t = L.msg_h + "\n\n" + L.msg_items + ":\n" + lines.join("\n");
    if (w.city) t += "\n\n" + L.msg_loc + ": " + w.city;
    var from = [w.name, w.company, w.phone].filter(Boolean).join(", ");
    if (from) t += "\n" + L.msg_from + ": " + from;
    return t;
  };
  Tool.prototype.renderList = function () {
    var self = this, el = this.listEl; el.hidden = shared.list.length === 0; el.innerHTML = "";
    if (!shared.list.length) return;
    el.appendChild(h("h3", { "class": "h3", text: ui.list_h + " (" + shared.list.length + ")" }));
    var ol = h("ol", { "class": "lines" });
    shared.list.forEach(function (x, i) {
      var it = BYID[x.id], ev = evalItem(it, x.vals);
      var rm = h("button", { type: "button", "class": "rm", "aria-label": ui.remove + ": " + it.label, text: ui.remove });
      rm.addEventListener("click", function () { shared.list.splice(i, 1); saveList(); tools.forEach(function (t) { if (t.listEl) t.renderList(); }); });
      ol.appendChild(h("li", { "class": ev.ok ? "ok" : "no" }, [h("span", { text: lineText(it, x.vals, x.qty, x.unit).replace(/ \(outside.*$/, "") }), h("em", { text: ev.ok ? ui.fits : ui.no_fit }), rm]));
    });
    el.appendChild(ol);
    var rid = "rg-" + (this.root.id || "t"), oid = "op-" + (this.root.id || "t");
    var rsel = h("select", { id: rid }, Object.keys(DATA.regions).map(function (k) { return h("option", { value: k, text: DATA.regions[k].label }); }));
    rsel.value = shared.region;
    var osel = h("select", { id: oid });
    function fillOpts() { osel.innerHTML = ""; DATA.regions[shared.region].opts.forEach(function (o, i) { osel.appendChild(h("option", { value: i, text: o.label })); }); osel.value = shared.opt; }
    fillOpts();
    function field(id, label, key, type, ac) {
      var inp = h("input", { id: id, type: type || "text", autocomplete: ac || "off", value: shared.who[key] });
      inp.addEventListener("input", function () { shared.who[key] = inp.value; });
      return h("div", { "class": "f" }, [h("label", { "for": id, text: label }), inp]);
    }
    el.appendChild(h("div", { "class": "row2" }, [
      h("div", { "class": "fld fld--sel" }, [h("label", { "for": rid, text: ui.region_h }), rsel]),
      h("div", { "class": "fld fld--sel" }, [h("label", { "for": oid, text: ui.send_to }), osel])
    ]));
    el.appendChild(h("div", { "class": "row2" }, [field(rid + "-c", ui.loc_label, "city", "text", "address-level2"), field(rid + "-n", ui.name, "name", "text", "name")]));
    el.appendChild(h("div", { "class": "row2" }, [field(rid + "-o", ui.company, "company", "text", "organization"), field(rid + "-p", ui.phone, "phone", "tel", "tel")]));
    var acts = h("div", { "class": "btn-row" });
    function drawActs() {
      acts.innerHTML = "";
      var o = DATA.regions[shared.region].opts[shared.opt] || DATA.regions[shared.region].opts[0], msg = self.message();
      var wa = o.wa || "", waNote = "";
      if (!wa) { wa = DATA.talal.wa; waNote = " (Mr. Talal Alafif)"; }
      acts.appendChild(h("a", { "class": "btn", href: "https://wa.me/" + wa + "?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener", text: ui.wa + waNote }));
      acts.appendChild(h("a", { "class": "btn btn--ghost", href: "mailto:" + o.email + (o.cc ? "?cc=" + encodeURIComponent(o.cc) + "&" : "?") + "subject=" + encodeURIComponent(ui.subject + BYID[shared.list[0].id].label + (shared.list.length > 1 ? " +" + (shared.list.length - 1) : "")) + "&body=" + encodeURIComponent(msg), text: ui.mail }));
      if (o.tel) acts.appendChild(h("a", { "class": "btn btn--ghost", href: "tel:" + o.tel, text: ui.call }));
      var cp = h("button", { type: "button", "class": "btn btn--ghost", text: ui.copy });
      cp.addEventListener("click", function () {
        (navigator.clipboard ? navigator.clipboard.writeText(self.message()) : Promise.reject()).then(function () { cp.textContent = ui.copied; setTimeout(function () { cp.textContent = ui.copy; }, 1600); }, function () { });
      });
      acts.appendChild(cp);
    }
    el.addEventListener("input", drawActs);
    rsel.addEventListener("change", function () { shared.region = rsel.value; shared.opt = 0; fillOpts(); drawActs(); });
    osel.addEventListener("change", function () { shared.opt = +osel.value; drawActs(); });
    drawActs(); el.appendChild(acts);
  };

  $$("[data-tool]").forEach(function (r) { tools.push(new Tool(r)); });
  if (location.hash === "#size" && location.search) { var s = $("#size"); if (s && s.scrollIntoView) setTimeout(function () { s.scrollIntoView(); }, 50); }
})();
