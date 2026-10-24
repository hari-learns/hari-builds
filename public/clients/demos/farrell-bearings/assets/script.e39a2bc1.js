(function () {
  var d = document, de = d.documentElement;
  de.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* reveals */
  var els = $$('[data-r]');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* drawer */
  var dr = $('#drawer'), bg = $('.burger');
  function drawer(on) { if (!dr) return; dr.hidden = false; dr.classList.toggle('on', on); bg.setAttribute('aria-expanded', on); dr.setAttribute('aria-hidden', !on); de.style.overflow = on ? 'hidden' : ''; if (on) $('.drawer-x', dr).focus(); else bg.focus(); }
  if (dr) {
    dr.setAttribute('aria-hidden', 'true');
    bg.addEventListener('click', function () { drawer(true); });
    $('.drawer-x', dr).addEventListener('click', function () { drawer(false); });
    dr.addEventListener('click', function (e) { if (e.target === dr) drawer(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr.classList.contains('on')) drawer(false); });
    $$('a', dr).forEach(function (a) { a.addEventListener('click', function () { drawer(false); }); });
  }

  /* dock */
  var dk = $('#dock');
  try { if (dk && sessionStorage.getItem('dock-off')) dk.classList.add('off'); } catch (e) {}
  if (dk) $('button', dk).addEventListener('click', function () { dk.classList.add('off'); try { sessionStorage.setItem('dock-off', 1); } catch (e) {} });

  /* click events for GoatCounter (if present) */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-ev]');
    if (a && window.goatcounter && goatcounter.count) { try { goatcounter.count({ path: 'demo/farrell-bearings/' + a.getAttribute('data-ev'), title: a.getAttribute('data-ev'), event: true }); } catch (x) {} }
  });

  /* open now (Pacific/Auckland, Mon-Fri 8-5) */
  var op = $('#open');
  if (op) {
    try {
      var p = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
      var wd = p.filter(function (x) { return x.type === 'weekday'; })[0].value, h = +p.filter(function (x) { return x.type === 'hour'; })[0].value % 24;
      var open = !/Sat|Sun/.test(wd) && h >= 8 && h < 17;
      op.textContent = open ? 'Open now (New Zealand time). Closes 5pm.' : 'Closed right now (New Zealand time). 24 hour call out on 07 850 4123.';
    } catch (e) {}
  }

  /* enquiry form -> mailto */
  $$('[data-enq]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return f.elements[n].value.trim(); };
      var body = v('q') + '\n\n' + v('n') + '\n' + v('e');
      location.href = 'mailto:' + f.getAttribute('data-mail') + '?subject=' + encodeURIComponent(v('s')) + '&body=' + encodeURIComponent(body);
    });
  });

  /* table filter */
  var tf = $('#tf');
  if (tf) {
    var rows = $$('#tbl tbody tr'), tc = $('#tc'), t0;
    tf.addEventListener('input', function () {
      clearTimeout(t0);
      t0 = setTimeout(function () {
        var q = tf.value.toLowerCase().replace(/\s*[x×]\s*/g, ' x ').trim(), k = 0;
        rows.forEach(function (r) {
          var hay = r._h || (r._h = r.textContent.toLowerCase().replace(/\s+/g, ' '));
          var ok = !q || hay.indexOf(q) > -1; r.classList.toggle('off', !ok); if (ok) k++;
        });
        tc.textContent = k + ' of ' + rows.length + ' sizes';
      }, 80);
    });
  }

  /* finder */
  $$('[data-finder]').forEach(function (F) {
    var data = null, loading = null, out = $('.f-out', F), form = $('.f-form', F), shop = F.getAttribute('data-shop'), mail = F.getAttribute('data-mail');
    var inp = { id: form.elements.id, od: form.elements.od, w: form.elements.w, code: form.elements.code };
    function load() {
      if (data) return Promise.resolve(data);
      if (!loading) loading = fetch(F.getAttribute('data-src')).then(function (r) { return r.json(); }).then(function (j) { data = j; return j; });
      return loading;
    }
    function num(v) { v = (v || '').replace(',', '.').trim(); return v === '' ? NaN : parseFloat(v); }
    function fmt(x) { return Math.round(x) === x ? String(x) : String(x); }
    function card(r, exact, diff) {
      var code = r[0], size = fmt(r[1]) + ' x ' + fmt(r[2]) + ' x ' + fmt(r[3]);
      var price = r[6] == null ? 'Price on application' : 'NZ$' + r[6].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      var subj = 'Enquiry: ' + code + ' (' + size + ' mm)';
      var body = 'Hello Farrell Bearings,\n\nI would like to enquire about bearing ' + code + ', size ID x OD x W = ' + size + ' mm.\n\nQuantity:\nApplication:\n\nName:\nPhone:\n';
      return '<li class="rc' + (exact ? ' exact' : '') + '"><div><p class="rc-code">' + esc(code) + '</p><p class="rc-size">' + size + ' mm' + (diff ? ' <span class="tag tag-y">' + esc(diff) + '</span>' : '') + '</p>' +
        '<p class="rc-desc">' + (r[5] ? '<span class="tag">Premium: FAG, TIMKEN, NSK</span>' : '') + esc(r[4]) + '</p></div>' +
        '<div><p class="rc-price">' + price + '</p><div class="rc-act"><a class="btn btn-n" target="_blank" rel="noopener" href="' + shop + encodeURIComponent(code) + '.html">View in shop</a>' +
        '<a class="btn btn-s" data-ev="email" href="mailto:' + mail + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body) + '">Ask about it</a></div></div></li>';
    }
    function none(msg, q) {
      var body = 'Hello Farrell Bearings,\n\nI am looking for a bearing. ' + q + '\n\nQuantity:\nApplication:\n\nName:\nPhone:\n';
      return '<div class="none"><p><b>' + msg + '</b></p><p>Not everything is listed online. Send us what you have and the sales team will find it.</p><div class="rc-act"><a class="btn btn-n" href="tel:+6478504123" data-ev="call">Call 07 850 4123</a>' +
        '<a class="btn btn-s" data-ev="email" href="mailto:' + mail + '?subject=' + encodeURIComponent('Bearing enquiry') + '&body=' + encodeURIComponent(body) + '">Email the sales team</a></div></div>';
    }
    function run() {
      var i = num(inp.id.value), o = num(inp.od.value), w = num(inp.w.value), code = inp.code.value.trim().toLowerCase();
      var have = [i, o, w].filter(function (x) { return !isNaN(x); }).length;
      if (!have && !code) { out.innerHTML = '<p class="f-hint">Type at least two of the three sizes, or a part number.</p>'; return; }
      load().then(function (D) {
        var list = [], head = '';
        if (code && !have) {
          var c = code.replace(/\s+/g, '');
          list = D.filter(function (r) { return r[0].toLowerCase().replace(/\s+/g, '').indexOf(c) === 0 || r[4].toLowerCase().indexOf(code) > -1; });
          list.sort(function (a, b) { return (a[0].toLowerCase() === c ? -1 : 0) - (b[0].toLowerCase() === c ? -1 : 0) || a[0].length - b[0].length; });
          head = list.length + ' match' + (list.length === 1 ? '' : 'es') + ' for “' + esc(inp.code.value.trim()) + '”';
          if (!list.length) { out.innerHTML = none('No part number starting with “' + esc(inp.code.value.trim()) + '” in the online list.', 'Part number: ' + inp.code.value.trim()); return; }
          show(list.slice(0, 30).map(function (r) { return card(r, r[0].toLowerCase() === c, ''); }), head, list.length);
          return;
        }
        if (have < 2) { out.innerHTML = '<p class="f-hint">Add a second measurement to narrow it down.</p>'; return; }
        var q = D.map(function (r) {
          var dd = 0, ok = true;
          if (!isNaN(i)) { dd += Math.abs(r[1] - i); if (Math.abs(r[1] - i) > 0.05) ok = false; }
          if (!isNaN(o)) { dd += Math.abs(r[2] - o); if (Math.abs(r[2] - o) > 0.05) ok = false; }
          if (!isNaN(w)) { dd += Math.abs(r[3] - w); if (Math.abs(r[3] - w) > 0.05) ok = false; }
          return { r: r, d: dd, ok: ok };
        });
        var ex = q.filter(function (x) { return x.ok; });
        var ask = [!isNaN(i) ? 'ID ' + i : '', !isNaN(o) ? 'OD ' + o : '', !isNaN(w) ? 'W ' + w : ''].filter(Boolean).join(' x ') + ' mm';
        if (ex.length) { show(ex.slice(0, 30).map(function (x) { return card(x.r, true, ''); }), ex.length + ' exact size match' + (ex.length === 1 ? '' : 'es') + ' for ' + esc(ask), ex.length); return; }
        var near = q.sort(function (a, b) { return a.d - b.d; }).slice(0, 4);
        if (near[0].d > 6) { out.innerHTML = none('Nothing close to ' + esc(ask) + ' in the online list.', 'Measured: ' + ask); return; }
        show(near.map(function (x) { return card(x.r, false, x.d.toFixed(1).replace('.0', '') + ' mm off'); }), 'No exact match for ' + esc(ask) + '. Closest listed sizes:', near.length, none('Is your size slightly different?', 'Measured: ' + ask));
      });
    }
    function show(cards, head, n, extra) {
      out.innerHTML = '<div class="f-head"><h3>' + head + '</h3><p>' + (n > 30 ? 'Showing first 30. Add more detail to narrow it.' : 'From the Farrell Bearings online list') + '</p></div><ul class="res">' + cards.join('') + '</ul>' + (extra ? '<div style="margin-top:16px">' + extra + '</div>' : '');
    }
    var t;
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    Object.keys(inp).forEach(function (k) {
      inp[k].addEventListener('focus', load, { once: true });
      inp[k].addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 160); });
    });
    F.addEventListener('click', function (e) {
      var b = e.target.closest('[data-try]'); if (!b) return;
      var v = b.getAttribute('data-try'); form.reset();
      if (v.indexOf('code:') === 0) inp.code.value = v.slice(5); else { var p = v.split(','); inp.id.value = p[0]; inp.od.value = p[1]; inp.w.value = p[2]; }
      run();
    });
  });
})();
