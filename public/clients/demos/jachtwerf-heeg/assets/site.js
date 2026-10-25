/* Jachtwerf Heeg redesign concept: one IIFE, every feature guarded. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- ready (hero settle) */
  function ready() { root.classList.add('is-ready'); }
  if (d.readyState === 'complete') ready(); else { addEventListener('load', ready); setTimeout(ready, 900); }

  /* ---------- reveal on scroll */
  var rv = $$('[data-reveal]');
  function sweep() {
    var vh = innerHeight;
    rv.forEach(function (el) { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vh * 0.96) el.classList.add('is-in'); });
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }
  ['scroll', 'resize', 'pageshow', 'load'].forEach(function (ev) { addEventListener(ev, sweep, { passive: true }); });
  sweep();

  /* ---------- drawer */
  var burger = $('[data-burger]'), drawer = $('[data-drawer]');
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.style.overflow = open ? 'hidden' : '';
    if (open) { var c = $('[data-drawer-close]'); if (c) c.focus(); } else { burger.focus(); }
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () { setDrawer(true); });
    var dc = $('[data-drawer-close]'); if (dc) dc.addEventListener('click', function () { setDrawer(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { root.style.overflow = ''; }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false); });
    addEventListener('resize', function () { if (innerWidth >= 1180 && drawer.classList.contains('is-open')) setDrawer(false); });
  }

  /* ---------- language menu */
  var lang = $('[data-lang]');
  if (lang) {
    d.addEventListener('click', function (e) { if (!lang.contains(e.target)) lang.removeAttribute('open'); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') lang.removeAttribute('open'); });
  }

  /* ---------- concept dock */
  var dock = $('[data-dock]');
  if (dock) {
    try { if (sessionStorage.getItem('jwh-dock') === '1') dock.hidden = true; } catch (e) { }
    if (innerWidth < 900) setTimeout(function () { dock.hidden = true; }, 9000);
    var dcl = $('[data-dock-close]', dock);
    if (dcl) dcl.addEventListener('click', function () { dock.hidden = true; try { sessionStorage.setItem('jwh-dock', '1'); } catch (e) { } });
  }

  /* ---------- open now (Europe/Amsterdam, Mon-Fri 8.00-16.00) */
  function openNow() {
    var lab = $$('[data-open-label]'); if (!lab.length) return;
    var open = false;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var wd = get('weekday'), h = parseInt(get('hour'), 10) % 24;
      open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) > -1 && h >= 8 && h < 16;
    } catch (e) { }
    lab.forEach(function (l) { l.textContent = open ? l.getAttribute('data-open') : l.getAttribute('data-closed'); });
    $$('[data-open-dot]').forEach(function (dt) { dt.classList.toggle('is-open', open); });
  }
  openNow();

  /* ---------- gallery */
  $$('[data-gallery]').forEach(function (g) {
    var dataEl = d.querySelector('[data-gallery-data]'); if (!dataEl) return;
    var items; try { items = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var main = $('[data-gallery-main]', g); if (!main) return;
    $$('.gallery__thumbs button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        var it = items[+b.getAttribute('data-i')]; if (!it) return;
        main.removeAttribute('fetchpriority'); main.setAttribute('loading', 'eager');
        main.src = it.src; main.srcset = it.srcset; main.width = it.w; main.height = it.h;
        $$('.gallery__thumbs button', g).forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
      });
    });
  });

  /* ---------- occasions filters */
  var occF = $('[data-occ-filters]');
  if (occF) {
    var list = $('[data-occ-list]'), cards = $$('.bcard', list), st = { kind: 'all', max: 0, elec: false, sort: 'new' };
    var cnt = $('[data-count-n]'), empty = $('[data-empty]');
    var apply = function () {
      var shown = cards.filter(function (c) {
        var ok = (st.kind === 'all' || c.dataset.kind === st.kind) && (!st.max || +c.dataset.price <= st.max) && (!st.elec || c.dataset.elec === '1');
        c.hidden = !ok; return ok;
      });
      var by = { new: function (a, b) { return b.dataset.id - a.dataset.id; }, asc: function (a, b) { return a.dataset.price - b.dataset.price; }, desc: function (a, b) { return b.dataset.price - a.dataset.price; }, year: function (a, b) { return b.dataset.year - a.dataset.year; } }[st.sort];
      cards.slice().sort(by).forEach(function (c) { list.appendChild(c); });
      if (cnt) cnt.textContent = shown.length;
      if (empty) empty.hidden = shown.length > 0;
    };
    $$('[data-kind]', occF).forEach(function (b) {
      b.addEventListener('click', function () {
        st.kind = b.dataset.kind;
        $$('[data-kind]', occF).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    var fp = $('[data-f-price]', occF), fs = $('[data-f-sort]', occF), fe = $('[data-f-elec]', occF);
    if (fp) fp.addEventListener('change', function () { st.max = +fp.value; apply(); });
    if (fs) fs.addEventListener('change', function () { st.sort = fs.value; apply(); });
    if (fe) fe.addEventListener('click', function () { st.elec = !st.elec; fe.setAttribute('aria-pressed', st.elec ? 'true' : 'false'); apply(); });
    try {
      var q = new URLSearchParams(location.search), k = q.get('model'), mx = +q.get('max') || 0;
      if (k) { var kb = $('[data-kind="' + k + '"]', occF); if (kb) kb.click(); }
      if (mx && fp) { var best = 0; $$('option', fp).forEach(function (o) { var v = +o.value; if (v && v >= mx && (!best || v < best)) best = v; }); if (!best) best = 0; fp.value = String(best || 0); st.max = best || 0; apply(); }
    } catch (e) { }
    apply();
  }

  /* ---------- shop filters */
  var shF = $('[data-shop-filters]');
  if (shF) {
    var sl = $('[data-shop-list]'), pcs = $$('.pcard', sl), s2 = { model: 'all', cat: 'all', q: '' };
    var sc = $('[data-count-n]'), se = $('[data-empty]');
    var ap2 = function () {
      var n = 0;
      pcs.forEach(function (p) {
        var ok = (s2.model === 'all' || p.dataset.model === s2.model) && (s2.cat === 'all' || p.dataset.cat === s2.cat) && (!s2.q || p.dataset.q.indexOf(s2.q) > -1);
        p.hidden = !ok; if (ok) n++;
      });
      if (sc) sc.textContent = n; if (se) se.hidden = n > 0;
    };
    $$('[data-model]', shF).forEach(function (b) { b.addEventListener('click', function () { s2.model = b.dataset.model; $$('[data-model]', shF).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); ap2(); }); });
    $$('[data-cat]', shF).forEach(function (b) { b.addEventListener('click', function () { s2.cat = b.dataset.cat; $$('[data-cat]', shF).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); ap2(); }); });
    var sq = $('[data-shop-q]', shF); if (sq) sq.addEventListener('input', function () { s2.q = sq.value.trim().toLowerCase(); ap2(); });
  }

  /* ---------- contact form -> prefilled e-mail */
  var cf = $('[data-contact-form]');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(cf), g = function (k) { return (f.get(k) || '').toString().trim(); };
    var body = (g('bedrijf') ? g('bedrijf') + '\n' : '') + g('voornaam') + ' ' + g('achternaam') + '\n' + g('email') + (g('telefoon') ? '\n' + g('telefoon') : '') + '\n\n' + g('bericht');
    location.href = 'mailto:' + cf.getAttribute('action').replace('mailto:', '') + '?subject=' + encodeURIComponent('Bericht via de website: ' + g('voornaam') + ' ' + g('achternaam')) + '&body=' + encodeURIComponent(body);
  });

  /* ---------- finder: "Welke boot past bij mij?" */
  var fRoot = $('[data-finder]'), fData = $('[data-finder-data]');
  if (fRoot && fData) {
    var D; try { D = JSON.parse(fData.textContent); } catch (e) { return; }
    var ui = D.ui, ui_el = $('[data-finder-ui]', fRoot);
    var ans = {}, step = 0, elec = false;
    var fmtEur = function (n) { return '€ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ui.eur_sep); };
    var fmtLen = function (n) { return n.toFixed(2).replace('.', ui.dec); };
    var label = function (qid, oid) { var q = D.q.filter(function (x) { return x.id === qid; })[0]; var o = q.o.filter(function (x) { return x[0] === oid; })[0]; return o ? o[1] : ''; };
    var budgetOf = function () { var b = ans.budget; return (!b || b === 'new') ? 0 : +b * 1000; };
    var isNew = function () { return ans.budget === 'new'; };

    function renderQ() {
      var q = D.q[step], last = step === D.q.length - 1;
      var prog = D.q.map(function (x, i) { return '<i class="' + (i <= step ? 'is-on' : '') + '"></i>'; }).join('');
      var opts = q.o.map(function (o) { return '<button type="button" class="opt" data-o="' + esc(o[0]) + '" aria-pressed="' + (ans[q.id] === o[0] ? 'true' : 'false') + '">' + esc(o[1]) + '</button>'; }).join('');
      ui_el.innerHTML = '<div class="finder__prog" aria-hidden="true">' + prog + '</div>' +
        '<p class="finder__step">' + esc(ui.step) + ' ' + (step + 1) + ' ' + esc(ui.of) + ' ' + D.q.length + '</p>' +
        '<h3 class="finder__q" id="fq" tabindex="-1">' + esc(q.q) + '</h3>' +
        '<div class="finder__opts" role="group" aria-labelledby="fq">' + opts + '</div>' +
        (last ? '<div class="finder__row"><button type="button" class="chip" data-el aria-pressed="' + (elec ? 'true' : 'false') + '">' + esc(ui.electric) + '</button></div>' : '') +
        (step > 0 ? '<div class="finder__row"><button type="button" class="btn btn--line btn--sm" data-back>' + esc(ui.back) + '</button></div>' : '');
      $$('.opt', ui_el).forEach(function (b) {
        b.addEventListener('click', function () {
          ans[q.id] = b.getAttribute('data-o');
          $$('.opt', ui_el).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          setTimeout(function () { if (last) { renderRes(); } else { step++; renderQ(); } }, reduce ? 0 : 220);
        });
      });
      var be = $('[data-el]', ui_el); if (be) be.addEventListener('click', function () { elec = !elec; be.setAttribute('aria-pressed', elec ? 'true' : 'false'); });
      var bk = $('[data-back]', ui_el); if (bk) bk.addEventListener('click', function () { step--; renderQ(); });
    }

    function stockFor(m, unlimited) {
      var b = budgetOf();
      var l = D.occ.filter(function (o) { return o.kind === m.key && (unlimited || !b || o.p <= b); });
      l.sort(function (a, c) { return (elec ? (c.e - a.e) : 0) || c.id - a.id; });
      return l;
    }
    function scoreAll() {
      return D.models.map(function (m, idx) {
        var sc = 0, why = [];
        ['use', 'sleep', 'where'].forEach(function (qid) {
          var w = (D.w[m.key][qid] || {})[ans[qid]] || 0; sc += w;
          var t = D.why[m.key][qid + ':' + ans[qid]]; if (t && w >= 1) why.push([w, t]);
        });
        var st = budgetOf() ? stockFor(m, false) : [];
        if (budgetOf() && !st.length) sc -= 2;
        why.sort(function (a, c) { return c[0] - a[0]; });
        return { m: m, sc: sc, idx: idx, why: why.map(function (x) { return x[1]; }).slice(0, 3), n: st.length };
      }).sort(function (a, c) { return (c.sc - a.sc) || (a.idx - c.idx); });
    }
    function occCard(o) {
      return '<a class="mini" href="' + o.url + '"><img src="' + o.img + '" srcset="' + o.img + ' ' + o.w + 'w, ' + o.img2 + '" width="' + o.w + '" height="' + o.h + '" alt="' + esc(o.t + ', ' + o.y) + '" loading="lazy"><span class="mini__b"><span class="mini__n">' + esc(o.t) + '</span><span class="mini__s">' + o.y + ' · ' + fmtLen(o.l) + ' m' + (o.eng ? ' · ' + esc(o.eng) : '') + '</span><span class="mini__p">' + fmtEur(o.p) + '</span></span></a>';
    }
    function renderRes() {
      var r = scoreAll(), top = r[0], m = top.m, b = budgetOf();
      var st = stockFor(m, isNew());
      if (!st.length && !isNew()) { st = []; }
      var showStock = st.slice(0, 4);
      var why = top.why.slice();
      if (b && top.n) why.push(ui.stock_n.replace('{n}', top.n));
      if (isNew()) why.push(ui.new_price);
      var facts = m.facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
      var occUrl = ui.occ_url + '?model=' + m.key + (b ? '&max=' + b : '');
      var others = r.slice(1).map(function (x) {
        return '<a class="mini" href="' + x.m.url + '"><img src="' + x.m.imgs + '" width="' + x.m.ws + '" height="' + x.m.hs + '" alt="' + esc(x.m.name) + '" loading="lazy"><span class="mini__b"><span class="mini__n">' + esc(x.m.name) + '</span><span class="mini__s">' + esc(x.m.tag) + '</span></span></a>';
      }).join('');
      var stockHtml = showStock.length ? '<div><h3 class="res__h">' + esc(ui.in_stock) + ': ' + esc(m.name) + '</h3><div class="res__stock">' + showStock.map(occCard).join('') + '</div><div class="link-row" style="margin-top:16px"><a class="btn btn--navy btn--sm" href="' + occUrl + '">' + esc(ui.all_occ) + ' →</a></div></div>'
        : '<div class="res__noscript"><p style="margin:0">' + esc(isNew() ? ui.new_price : ui.none_stock) + '</p></div>';
      var q = D.q;
      var lines = [ui.mail_hi, '', ui.mail_intro, ''];
      ['use', 'sleep', 'where', 'budget'].forEach(function (qid) { var qq = q.filter(function (x) { return x.id === qid; })[0]; if (ans[qid]) lines.push('- ' + qq.q + ' ' + label(qid, ans[qid])); });
      if (elec) lines.push('- ' + ui.electric);
      lines.push('', ui.mail_top + ': ' + m.name);
      if (showStock.length) { lines.push(ui.mail_occ + ':'); showStock.forEach(function (o) { lines.push('- ' + o.t + ' (' + o.y + '), ' + fmtEur(o.p)); }); }
      lines.push('', ui.mail_bye, ui.mail_name);
      var mail = 'mailto:' + ui.email + '?subject=' + encodeURIComponent(ui.mail_sub + ' ' + m.name) + '&body=' + encodeURIComponent(lines.join('\n'));
      ui_el.innerHTML = '<div class="finder__prog" aria-hidden="true">' + D.q.map(function () { return '<i class="is-on"></i>'; }).join('') + '</div>' +
        '<div class="res"><div class="res__top"><img src="' + m.img + '" width="' + m.w + '" height="' + m.h + '" alt="' + esc(m.name) + '"><div class="res__top-b">' +
        '<span class="res__badge">' + esc(ui.best) + '</span><h3 class="res__name" id="fres" tabindex="-1">' + esc(m.name) + '</h3><p class="res__tag">' + esc(m.tag) + '</p>' +
        (why.length ? '<p class="res__why-h">' + esc(ui.why) + '</p><ul class="res__why">' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
        '<dl class="res__facts">' + facts + '</dl>' +
        (elec ? '<p style="font-size:.9375rem;color:var(--on-navy-muted)">' + esc(ui.elec_note) + '</p>' : '') +
        '<div class="link-row"><a class="btn btn--primary" href="' + m.url + '">' + esc(ui.see_model) + '</a></div></div></div>' +
        stockHtml +
        '<div><h3 class="res__h">' + esc(ui.also) + '</h3><div class="res__others">' + others + '</div></div>' +
        '<div class="res__send"><h3 class="res__h" style="margin-bottom:8px">' + esc(ui.send_h) + '</h3><p>' + esc(ui.send_p) + '</p><div class="link-row"><a class="btn btn--primary" href="' + mail + '">' + esc(ui.send_btn) + '</a><a class="btn btn--line" href="tel:' + ui.tel + '">' + esc(ui.tel_display) + '</a><button type="button" class="btn btn--line" data-again>' + esc(ui.again) + '</button></div></div></div>';
      var ag = $('[data-again]', ui_el); if (ag) ag.addEventListener('click', function () { ans = {}; step = 0; renderQ(); });
      var f = $('#fres', ui_el); if (f && fRoot.getBoundingClientRect().top < 0) { try { fRoot.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) { } }
    }
    renderQ();
  }
})();
