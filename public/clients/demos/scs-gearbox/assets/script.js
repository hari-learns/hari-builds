/* SCS Gearbox concept: every feature is existence-guarded. No frameworks. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* dock */
  var dock = $('.dock');
  try { if (dock && sessionStorage.getItem('scs-dock') === '1') dock.hidden = true; } catch (e) {}
  var dx = $('.dock button');
  if (dx) dx.addEventListener('click', function () { dock.hidden = true; try { sessionStorage.setItem('scs-dock', '1'); } catch (e) {} });

  /* drawer */
  var burger = $('.burger'), drawer = $('.drawer');
  function setDrawer(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.style.overflow = open ? 'hidden' : '';
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1040) setDrawer(false); });
  }

  /* scroll reveal (with the sweep that never strands content) */
  var rv = $$('.rv');
  function show(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in window)) { rv.forEach(show); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
    var sweep = function () { var vh = window.innerHeight; rv.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.96) show(el); }); };
    ['load', 'scroll', 'resize', 'pageshow'].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
    sweep();
  }

  /* timeline progress */
  var tl = $('.tl');
  if (tl) {
    var tick = false;
    var upd = function () {
      tick = false;
      var r = tl.getBoundingClientRect(), mid = window.innerHeight * 0.55;
      var p = Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height)));
      tl.style.setProperty('--p', reduce ? 1 : p.toFixed(4));
    };
    var req = function () { if (!tick) { tick = true; requestAnimationFrame(upd); } };
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); upd();
  }

  /* product filter */
  var pf = $('#pfilter');
  if (pf) {
    var items = $$('[data-t]');
    pf.addEventListener('input', function () {
      var q = pf.value.trim().toLowerCase();
      items.forEach(function (li) { li.hidden = q && li.getAttribute('data-t').indexOf(q) < 0; });
      $$('.cgroup').forEach(function (g) { g.hidden = !$$('[data-t]:not([hidden])', g).length; });
    });
  }

  /* dealer filter */
  var df = $('#dsearch');
  if (df) {
    var cards = $$('.dc'), reg = $('#dregion'), chips = $$('.dfilter .chip input'), cnt = $('#dcount');
    var run = function () {
      var q = df.value.trim().toLowerCase(), r = reg.value;
      var ts = chips.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!q || c.getAttribute('data-s').indexOf(q) >= 0) && (!r || c.getAttribute('data-r') === r) &&
          (!ts.length || ts.some(function (t) { return c.getAttribute('data-ty').indexOf('|' + t + '|') >= 0; }));
        c.hidden = !ok; if (ok) n++;
      });
      if (cnt) cnt.textContent = n + (n === 1 ? ' dealer' : ' dealers') + ' shown';
    };
    df.addEventListener('input', run); reg.addEventListener('change', run); chips.forEach(function (c) { c.addEventListener('change', run); });
    run();
  }

  /* ---------------- Gear finder ---------------- */
  var gf = $('[data-gf]');
  var dataEl = $('#gear-data');
  if (gf && dataEl) {
    var D = JSON.parse(dataEl.textContent);
    var cfgLabel = { under: 'underdrive', over: 'overdrive' };
    var state = { setup: 'qc', touched: false };
    var srcName = { qc: function (v) { return 'SCS ' + v.spline + ' spline quick change gear chart'; }, drop1266: function () { return 'SCS 12.66 drop transfer case calculator'; }, ten66: function () { return 'SCS 10.66 / straight thru calculator'; }, cs: function () { return 'SCS 20, 30 and 40 series gear chart'; } };
    var el = function (id) { return $('#' + id, gf); };
    var num = function (id) { var v = parseFloat(el(id).value); return isFinite(v) && v > 0 ? v : null; };
    var f3 = function (x) { return x.toFixed(3); };
    var eff = function (r, c) { return c === 'over' ? 1 / r : r; };

    function candidates(v) {
      var out = [], i, j, k, l, q, g, h;
      if (state.setup === 'qc') {
        var sets = D.qc[v.spline], rp = v.rp;
        for (i = 0; i < sets.length; i++) {
          g = sets[i];
          out.push({ ratio: rp / g[2], over: 0, lines: [['Gear set', v.spline + ' spline, set ' + g[0]], ['Teeth', g[1] + ' (ratio ' + g[2].toFixed(D.dec[v.spline]) + ')'], ['Position', 'Low: ring & pinion ' + rp + ' ÷ ' + g[2].toFixed(D.dec[v.spline])]], title: v.spline + '-spline set ' + g[0] + ' · low' });
          if (g[2] !== 1) out.push({ ratio: rp * g[2], over: 1, lines: [['Gear set', v.spline + ' spline, set ' + g[0]], ['Teeth', g[1] + ' (ratio ' + g[2].toFixed(D.dec[v.spline]) + ')'], ['Position', 'High: ring & pinion ' + rp + ' × ' + g[2].toFixed(D.dec[v.spline])]], title: v.spline + '-spline set ' + g[0] + ' · high' });
        }
        out.forEach(function (c) { c.final = c.ratio * v.trans; });
      } else if (state.setup === 'drop1266') {
        var lows = v.lower === 'any' ? D.lower1266 : D.lower1266.filter(function (x) { return f3(x[0]) === v.lower; });
        for (i = 0; i < lows.length; i++) for (j = 0; j < D.upper1266.length; j++) {
          g = D.upper1266[j];
          ['under', 'over'].forEach(function (cf) {
            if (cf === 'over' && !g[2]) return;
            var tc = cf === 'over' ? lows[i][0] / g[0] : lows[i][0] * g[0];
            out.push({ ratio: tc, final: v.trans * tc * v.axle, over: cf === 'over' ? 1 : 0, title: 'Lower ' + f3(lows[i][0]) + ' + upper ' + f3(g[0]),
              lines: [['Lower gear set', f3(lows[i][0]) + ' · ' + lows[i][1]], ['Upper gear set', f3(g[0]) + ' · ' + g[1] + ' · ' + cfgLabel[cf]], ['Transfer case ratio', f3(tc) + ':1']] });
          });
        }
      } else if (state.setup === 'ten66') {
        var lw = v.lower === 'any' ? D.g1066 : D.g1066.filter(function (x) { return f3(x[0]) === v.lower; });
        for (i = 0; i < lw.length; i++) for (j = 0; j < D.g1066.length; j++) {
          ['under', 'over'].forEach(function (lc) {
            ['under', 'over'].forEach(function (qc) {
              var tc = eff(lw[i][0], lc) * eff(D.g1066[j][0], qc);
              out.push({ ratio: tc, final: tc * v.rear * v.trans, over: (lc === 'over') + (qc === 'over'), title: 'Lower ' + f3(lw[i][0]) + ' + quick change ' + f3(D.g1066[j][0]),
                lines: [['Lower gear set', f3(lw[i][0]) + ' · ' + lw[i][1] + ' · ' + cfgLabel[lc]], ['Quick change set', f3(D.g1066[j][0]) + ' · ' + D.g1066[j][1] + ' · ' + cfgLabel[qc]], ['Transfer case ratio', f3(tc) + ':1']] });
            });
          });
        }
      } else if (state.setup === 'cs') {
        for (i = 0; i < D.cs.length; i++) for (j = 0; j < D.cs.length; j++) {
          ['under', 'over'].forEach(function (hc) {
            ['under', 'over'].forEach(function (qc) {
              h = D.cs[i]; q = D.cs[j];
              var o = v.planetary * v.rear * eff(h[0], hc) * eff(q[0], qc);
              out.push({ ratio: o, final: o, over: (hc === 'over') + (qc === 'over'), title: 'Headset ' + f3(h[0]) + ' + quick change ' + f3(q[0]),
                lines: [['Headset', f3(h[0]) + ' · ' + h[1] + ' · ID ' + h[2] + ' · ' + cfgLabel[hc]], ['Quick change', f3(q[0]) + ' · ' + q[1] + ' · ID ' + q[2] + ' · ' + cfgLabel[qc]]] });
            });
          });
        }
      }
      return out;
    }

    function read() {
      var v = { aim: (el('aim-speed').checked ? 'speed' : 'ratio'), val: num('aim-val'), rpm: num('rpm'), tire: num('tire') };
      if (state.setup === 'qc') {
        v.spline = $('input[name=qc-spline]:checked', gf).value;
        v.rp = el('qc-rp').value === 'x' ? num('qc-rp-x') : parseFloat(el('qc-rp').value);
        v.trans = num('qc-trans');
      } else if (state.setup === 'drop1266') { v.lower = el('d-lower').value; v.trans = num('d-trans'); v.axle = num('d-axle'); }
      else if (state.setup === 'ten66') { v.lower = el('t-lower').value; v.trans = num('t-trans'); v.rear = num('t-rear'); }
      else { v.planetary = num('c-planetary'); v.rear = num('c-rear'); }
      return v;
    }
    function missing(v) {
      var need = state.setup === 'qc' ? ['rp', 'trans'] : state.setup === 'drop1266' ? ['trans', 'axle'] : state.setup === 'ten66' ? ['trans', 'rear'] : ['planetary', 'rear'];
      var lab = { rp: 'ring & pinion ratio', trans: 'transmission ratio', axle: 'rear axle ratio', rear: state.setup === 'cs' ? 'rear-end ratio' : 'ring & pinion ratio', planetary: 'planetary ratio' };
      for (var i = 0; i < need.length; i++) if (!v[need[i]]) return 'Enter your ' + lab[need[i]] + ' to search.';
      if (!v.val) return v.aim === 'speed' ? 'Enter the speed you are aiming for.' : 'Enter the overall ratio you are aiming for.';
      if (v.aim === 'speed' && (!v.rpm || !v.tire)) return 'To search by speed, add engine RPM and tire diameter.';
      return '';
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var out = el('gf-results');
    $$('input,select', gf).forEach(function (n) { if (n.name === 'gf-setup') return; ['input', 'change'].forEach(function (ev) { n.addEventListener(ev, function () { state.touched = true; }, true); }); });
    var names = { qc: 'Circle track quick change', drop1266: '12.66 drop transfer case', ten66: '10.66 / straight thru transfer case', cs: 'Twin & single countershaft' };
    var finalName = { qc: 'Final drive ratio', drop1266: 'Overall driveline ratio', ten66: 'Overall driveline ratio', cs: 'Overall gear ratio' };

    function mailFor(c, v, target) {
      var L = ['Hello SCS Gearbox,', '', 'I would like to talk about this setup (from the Gear finder concept page):', '', 'Setup: ' + names[state.setup], c.title];
      c.lines.forEach(function (l) { L.push(l[0] + ': ' + l[1]); });
      L.push(finalName[state.setup] + ': ' + c.final.toFixed(3) + ':1');
      if (v.rpm && v.tire) L.push('Estimated speed: ' + (v.rpm * v.tire / (c.final * 336)).toFixed(1) + ' MPH at ' + v.rpm + ' RPM, ' + v.tire + ' in tire');
      L.push('My target: ' + (v.aim === 'speed' ? v.val + ' MPH (needs ' + target.toFixed(3) + ':1)' : v.val + ':1'));
      L.push('', 'Name:', 'Phone:', 'Vehicle / class:');
      return 'mailto:' + D.email + '?subject=' + encodeURIComponent(D.subject) + '&body=' + encodeURIComponent(L.join('\n'));
    }

    function render() {
      var v = read(), m = missing(v), html = '';
      if (m) { out.innerHTML = '<p class="gf-msg" role="status">' + esc(m) + '</p>'; return; }
      var target = v.aim === 'speed' ? v.rpm * v.tire / (v.val * 336) : v.val;
      var all = candidates(v);
      all.sort(function (a, b) { var da = Math.abs(a.final - target) - Math.abs(b.final - target); return Math.abs(da) > 1e-9 ? da : a.over - b.over; });
      var seen = {}, top = [];
      for (var i = 0; i < all.length && top.length < 6; i++) { var key = all[i].final.toFixed(3); if (seen[key]) continue; seen[key] = 1; top.push(all[i]); }
      html += '<div class="gf-sum"><span class="t">' + (state.touched ? '' : 'Example: ') + 'Closest to ' + (v.aim === 'speed' ? v.val + ' MPH' : v.val + ':1') + '</span><span class="s">' +
        (v.aim === 'speed' ? 'needs an overall ratio of about ' + target.toFixed(3) + ':1 · ' : '') + names[state.setup] + '</span></div><p class="gf-vis">Indicative: from ' + esc(srcName[state.setup](v)) + '. Confirm with SCS before ordering.</p><ol class="gf-list">';
      top.forEach(function (c, n) {
        var dlt = c.final - target, ad = Math.abs(dlt);
        var mph = v.rpm && v.tire ? v.rpm * v.tire / (c.final * 336) : null;
        html += '<li class="gc' + (n === 0 ? ' best' : '') + '" style="--i:' + n + '">' + (n === 0 ? '<span class="tag">Closest</span>' : '') +
          '<h3>' + esc(c.title) + '</h3><div class="big">' + c.final.toFixed(3) + '<small>:1 ' + esc(finalName[state.setup].toLowerCase()) + '</small></div>' +
          '<div class="d' + (ad > 0.01 * target ? ' off' : '') + '">' + (ad < 0.0005 ? 'exact match' : (dlt > 0 ? '+' : '') + dlt.toFixed(3) + ' from target') + '</div>' +
          (mph ? '<div class="mph">≈ ' + mph.toFixed(1) + ' MPH</div>' : '') +
          '<ul>' + c.lines.map(function (l) { return '<li><b>' + esc(l[0]) + '</b> ' + esc(l[1]) + '</li>'; }).join('') + '</ul>' +
          '<a class="btn small" href="' + mailFor(c, v, target) + '" data-goat="gear-email">Send this setup to SCS</a></li>';
      });
      html += '</ol><button type="button" class="btn ghost small gf-more">Show more combinations</button>';
      out.innerHTML = html;
      var lst = out.querySelector('.gf-list'); lst.classList.add('collapsed');
      out.querySelector('.gf-more').addEventListener('click', function () { lst.classList.remove('collapsed'); this.style.display = 'none'; });
    }

    function setSetup(s) {
      state.setup = s;
      $$('.gf-panel', gf).forEach(function (p) { p.hidden = p.getAttribute('data-p') !== s; });
      var csOnly = s === 'cs';
      $$('.gf-sp', gf).forEach(function (n) { n.hidden = csOnly; });
      var sp = el('aim-speed');
      if (csOnly) { el('aim-ratio').checked = true; }
      el('aim-speed-wrap').hidden = csOnly;
      var ex = D.example[s]; el('aim-val').value = ex.aim;
      render();
    }
    $$('input[name=gf-setup]', gf).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setSetup(r.value); }); });
    function fillRp() {
      var sp = $('input[name=qc-spline]:checked', gf).value, sel = el('qc-rp');
      var cur = sel.value;
      sel.innerHTML = D.rp[sp].map(function (r) { return '<option value="' + r[0] + '">' + r[0] + ' (' + r[1] + ')</option>'; }).join('') + '<option value="x">Other ratio…</option>';
      if ([].some.call(sel.options, function (o) { return o.value === cur; })) sel.value = cur;
    }
    $$('input[name=qc-spline]', gf).forEach(function (r) { r.addEventListener('change', function () { fillRp(); render(); }); });
    el('qc-rp').addEventListener('change', function () { el('qc-rp-x-wrap').hidden = this.value !== 'x'; render(); });
    $$('input[type=number],select,input[name=aim]', gf).forEach(function (n) { n.addEventListener('input', render); n.addEventListener('change', render); });
    fillRp();
    var first = $('input[name=gf-setup]:checked', gf);
    setSetup(first ? first.value : 'qc');
    var cp = el('gf-copy');
    if (cp) cp.addEventListener('click', function () {
      var t = out.innerText || '';
      var done = function () { cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy results'; }, 1800); };
      try { navigator.clipboard.writeText(t).then(done, function () { cp.textContent = 'Press and hold to copy'; }); } catch (e) { cp.textContent = 'Copy not available'; }
    });
  }
})();
