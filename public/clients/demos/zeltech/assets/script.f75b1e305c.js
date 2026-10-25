/* One IIFE, every feature existence-guarded. No libraries. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready() { root.classList.add('is-ready'); }
  if (d.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  setTimeout(ready, 1400);

  /* reveal on scroll (real content only; static end state without JS or with reduced motion) */
  var rv = [].slice.call(d.querySelectorAll('[data-reveal]'));
  function show(el) { el.classList.add('is-in'); }
  if (!('IntersectionObserver' in window) || rm) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting || en.boundingClientRect.top < 0) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* counters on real figures */
  var cn = [].slice.call(d.querySelectorAll('[data-count]'));
  function run(el) {
    var to = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1100;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v; if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    }
    el.textContent = '0'; requestAnimationFrame(step);
  }
  if (cn.length && 'IntersectionObserver' in window && !rm) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { run(en.target); io2.unobserve(en.target); } });
    }, { threshold: 0.6 });
    cn.forEach(function (el) { io2.observe(el); });
  }

  /* drawer */
  var dr = d.getElementById('drawer'), bg = d.querySelector('.burger'), dx = d.querySelector('.drawer-x');
  function setDrawer(open) {
    if (!dr) return;
    dr.classList.toggle('is-open', open); dr.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (bg) bg.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.body.style.overflow = open ? 'hidden' : '';
    if (open && dx) dx.focus(); else if (!open && bg) bg.focus({ preventScroll: true });
  }
  if (bg) bg.addEventListener('click', function () { setDrawer(true); });
  if (dx) dx.addEventListener('click', function () { setDrawer(false); });
  if (dr) dr.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setDrawer(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && dr.classList.contains('is-open')) setDrawer(false); });
  if (window.matchMedia) matchMedia('(min-width:1400px)').addEventListener && matchMedia('(min-width:1400px)').addEventListener('change', function (m) { if (m.matches) setDrawer(false); });

  /* hide the phone bar while typing */
  var bar = d.querySelector('.bar');
  if (bar) {
    d.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input,select,textarea')) bar.style.display = 'none'; });
    d.addEventListener('focusout', function () { bar.style.display = ''; });
  }

  /* concept dock */
  var dk = d.getElementById('dock'), dkx = d.querySelector('.dock-x');
  try { if (sessionStorage.getItem('dock-x') === '1' && dk) dk.hidden = true; } catch (e) {}
  if (dkx && dk) dkx.addEventListener('click', function () { dk.hidden = true; try { sessionStorage.setItem('dock-x', '1'); } catch (e) {} });

  /* catalogue filter */
  var chips = [].slice.call(d.querySelectorAll('.fchip')), cards = [].slice.call(d.querySelectorAll('#pgrid .pc'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      cards.forEach(function (p) { p.hidden = !(f === 'all' || p.getAttribute('data-mat') === f); });
    });
  });

  /* contact form -> mail draft (nothing is sent from the page) */
  var mf = d.getElementById('mform');
  if (mf) mf.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = mf.elements, pl = mf.getAttribute('data-lang') === 'pl';
    var body = (pl ? 'Dzień dobry,\r\n\r\n' : 'Hello,\r\n\r\n') + f.msg.value + '\r\n\r\n' + f.name.value + '\r\n' + f.tel.value + '\r\n' + f.mail.value;
    location.href = 'mailto:' + mf.getAttribute('data-to') + '?subject=' + encodeURIComponent(pl ? 'Zapytanie ze strony' : 'Enquiry from the website') + '&body=' + encodeURIComponent(body);
  });

  /* signature tool: "Can you extrude my profile?" Reshuffles only data published on zeltech.pro */
  var tdEl = d.getElementById('tool-data'), form = d.getElementById('tool-form'), out = d.getElementById('tool-out');
  if (tdEl && form && out) {
    var td = JSON.parse(tdEl.textContent), T = td.t, L = td.limits, pl = td.lang === 'pl';
    var E = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var F = function (x) { return String(x).replace('.', pl ? ',' : '.'); };
    var num = function (n) { var v = parseFloat(String(form.elements[n].value).replace(',', '.')); return isFinite(v) ? v : null; };
    var rad = function (n) { var r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ''; };
    var lastDraft = '';
    function chip(ok) { return ok === null ? '<span class="st st-need">' + E(T.need) + '</span>' : ok ? '<span class="st st-ok">' + E(T.ok) + '</span>' : '<span class="st st-ask">' + E(T.ask) + '</span>'; }
    function render() {
      var indKey = form.elements.ind.value;
      if (!indKey) { out.innerHTML = '<p class="tool-empty">' + E(T.r_empty) + '</p>'; return; }
      var I = td.industries.filter(function (i) { return i.k === indKey; })[0];
      var frm = rad('form'), where = rad('where'), src = rad('src'), colour = rad('colour');
      var len = num('len'), side = num('side'), mass = num('mass'), outd = form.elements.out.checked, clear = form.elements.clear.checked, qty = form.elements.qty.value.trim();
      var lenOk = len === null ? null : (frm === 'cut' ? (len >= L.len_min && len <= L.len_max) : (len >= L.spool_min && len <= L.spool_max));
      var lim = [[frm === 'cut' ? T.l_len_cut : T.l_len_spool, lenOk], [T.l_side, side === null ? null : side <= L.side_max], [T.l_mass, mass === null ? null : mass <= L.mass_max]];
      var cand = I.main.slice(), clearNote = '';
      if (clear) { var tr = cand.filter(function (m) { return ['pc', 'pmma', 'pvc'].indexOf(m) > -1; }); cand = tr.length ? tr : ['pc', 'pmma', 'pvc']; clearNote = T.m_clear; }
      var mats = cand.map(function (k) {
        var m = td.materials[k], href = td.base + '/materialy/' + m.slug + '/';
        return '<li><b>' + E(m.abbr) + ', ' + E(m.n) + '</b><p>' + E(m.trait.charAt(0).toUpperCase() + m.trait.slice(1)) + '.</p><a href="' + href + '">' + E(T.m_page) + '</a></li>';
      }).join('');
      var notes = '<p class="small">' + E(T.m_main) + E(I.note) + '.</p>' + (clearNote ? '<p class="small">' + E(clearNote) + '</p>' : '') + (outd ? '<p class="small">' + E(T.m_out) + '</p>' : '');
      var cl = td.profiles.filter(function (p) { return p.inds.indexOf(indKey) > -1; });
      if (!cl.length) cl = td.profiles.filter(function (p) { return cand.indexOf(p.mat) > -1; });
      cl = cl.slice(0, 3);
      var cat = cl.map(function (p) { return '<a href="' + td.base + '/katalog/' + p.k + '/"><span>' + E(p.n) + '</span><small>' + E(p.dim) + '</small></a>'; }).join('');
      var time = src === 'cat' ? T.t_cat : T.t_new;
      var col = colour === 'ral' ? T.c_ral : colour === 'wood' ? T.c_wood + td.wood.join(', ') + '.' : T.c_any;
      var lbl = { cut: T.f_cut, spool: T.f_spool, pl: T.f_pl, ab: T.f_abroad, any: T.f_any, ral: T.f_ral, wood: T.f_wood, 'new': T.f_new, cat: T.f_cat };
      var yn = function (b) { return b ? T.yes : T.no; };
      var lines = [T.greet, '', T.intro,
        '- ' + T.ind + ': ' + I.n, '- ' + T.dest + ': ' + lbl[where], '- ' + T.form + ': ' + lbl[frm],
        '- ' + T.len + ': ' + (len === null ? T.none : F(len) + ' ' + T.unit_m), '- ' + T.side + ': ' + (side === null ? T.none : F(side) + ' ' + T.unit_mm),
        '- ' + T.mass + ': ' + (mass === null ? T.none : F(mass) + ' ' + T.unit_kg), '- ' + T.out + ': ' + yn(outd), '- ' + T.clear + ': ' + yn(clear),
        '- ' + T.colour + ': ' + lbl[colour], '- ' + T.src + ': ' + lbl[src], '- ' + T.qty + ': ' + (qty || T.none),
        '- ' + T.mat + ': ' + cand.map(function (k) { return td.materials[k].abbr; }).join(', '), '', T.bye];
      lastDraft = lines.join('\n');
      var to = where === 'ab' ? td.to_export : td.to_sales, cc = where === 'ab' ? td.to_sales : '';
      var subj = T.subj + ': ' + I.n + (len === null ? '' : ', ' + F(len) + ' ' + T.unit_m);
      var href = 'mailto:' + to + '?' + (cc ? 'cc=' + cc + '&' : '') + 'subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lastDraft.replace(/\n/g, '\r\n'));
      var known = lim.every(function (r) { return r[1] !== null; }), bad = lim.some(function (r) { return r[1] === false; });
      var vk = bad ? 'ask' : known ? 'ok' : 'need', vt = bad ? T.v_ask : known ? T.v_ok : T.v_need;
      var catH = cl.length && td.profiles.some(function (p) { return p.inds.indexOf(indKey) > -1; }) ? T.r_cat : T.r_cat2;
      out.innerHTML = '<div class="res"><p class="verdict v-' + vk + '" role="status">' + E(vt) + '</p><div class="res-g"><div class="res-c">' +
        '<div><h3>' + E(T.r_limits) + '</h3><ul class="lim">' + lim.map(function (r) { return '<li><span>' + E(r[0]) + '</span>' + chip(r[1]) + '</li>'; }).join('') + '</ul></div>' +
        '<div><h3>' + E(T.r_time) + '</h3><p>' + E(time) + '</p></div>' +
        '<div><h3>' + E(T.r_colour) + '</h3><p>' + E(col) + '</p></div>' +
        (cat ? '<div><h3>' + E(catH) + '</h3><div class="cat-l">' + cat + '</div></div>' : '') + '</div><div class="res-c">' +
        '<div><h3>' + E(T.r_mat) + '</h3><ul class="mats">' + mats + '</ul>' + notes + '</div>' +
        '<div><h3>' + E(T.r_mail) + '</h3><pre class="draft" tabindex="0">' + E(lastDraft) + '</pre><div class="res-act"><a class="btn" href="' + href + '">' + E(T.mail_btn) + '</a>' +
        '<button type="button" class="btn btn-line" data-copy>' + E(T.copy_btn) + '</button></div><p class="small">' + E(T.mail_note) + '</p></div></div></div></div>';
    }
    out.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-copy]');
      if (!b) return;
      var done = function () { b.textContent = T.copied; setTimeout(function () { b.textContent = T.copy_btn; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastDraft).then(done, done); else done();
    });
    form.addEventListener('input', render); form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    try {
      var q = new URLSearchParams(location.search).get('branza');
      if (q && form.elements.ind.querySelector('option[value="' + q + '"]')) form.elements.ind.value = q;
    } catch (e) {}
    render();
  }
})();
