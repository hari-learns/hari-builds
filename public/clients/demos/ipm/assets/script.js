(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* ---- drawer */
  var burger = $('.burger'), drawer = $('#drawer');
  if (burger && drawer) {
    var lastFocus = null;
    var setOpen = function (open) {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      root.style.overflow = open ? 'hidden' : '';
      if (open) { lastFocus = d.activeElement; var f = $('.drawer-close', drawer); if (f) f.focus(); }
      else if (lastFocus) { try { lastFocus.focus(); } catch (e) {} }
    };
    burger.addEventListener('click', function () { setOpen(!drawer.classList.contains('is-open')); });
    $('.drawer-close', drawer).addEventListener('click', function () { setOpen(false); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) setOpen(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    d.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') {
        var f = $$('a, button', drawer); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1040 && drawer.classList.contains('is-open')) setOpen(false); });
  }

  /* ---- reveals (IntersectionObserver + a sweep that also reveals everything above the fold) */
  var rev = $$('[data-reveal]');
  function show(el) { el.classList.add('is-in'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(show); }
  function sweep() {
    var vh = window.innerHeight || 800;
    rev.forEach(function (el) { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vh * 0.96) show(el); });
  }
  ['load', 'scroll', 'resize', 'pageshow', 'hashchange'].forEach(function (ev) { window.addEventListener(ev, sweep, { passive: true }); });
  sweep();
  setTimeout(sweep, 400);

  /* ---- dock */
  var dock = $('#dock');
  if (dock) {
    try { if (sessionStorage.getItem('ipm-dock-off') === '1') dock.classList.add('is-off'); } catch (e) {}
    $('.dock-x', dock).addEventListener('click', function () {
      dock.classList.add('is-off');
      try { sessionStorage.setItem('ipm-dock-off', '1'); } catch (e) {}
    });
  }

  /* ---- category filter */
  $$('[data-filter]').forEach(function (inp) {
    var cards = $$('.groups .card'), groups = $$('.groups .group'), n = $('[data-filter-n]');
    function norm(t) { return t.toLowerCase(); }
    inp.addEventListener('input', function () {
      var q = norm(inp.value.trim()), shown = 0;
      cards.forEach(function (c) { var ok = !q || norm(c.textContent).indexOf(q) > -1; c.hidden = !ok; if (ok) shown++; });
      groups.forEach(function (g) { g.hidden = !$$('.card', g).some(function (c) { return !c.hidden; }); });
      if (n) n.textContent = q ? shown + ' / ' + cards.length : '';
    });
  });

  /* ---- carousel strip */
  $$('[data-strip]').forEach(function (s) {
    var track = $('.strip-track', s);
    track.classList.add('scroller');
    $$('.strip-btn', s).forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        var slide = $('.slide', track);
        var step = slide ? slide.getBoundingClientRect().width + 16 : 320;
        track.scrollBy({ left: dir * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---- video facade (YouTube loads only on click, no-cookie domain) */
  $$('.video-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt');
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'YouTube';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      b.parentNode.replaceChild(f, b);
    });
  });

  /* ---- finder: reshuffles IPM's own published capacities, nothing computed beyond comparison */
  var MIN = 10, MAX = 20000, LN = Math.log;
  function pos(v) { v = Math.max(MIN, Math.min(MAX, v)); return (LN(v) - LN(MIN)) / (LN(MAX) - LN(MIN)); }
  function nice(v) { if (v < 100) return Math.round(v / 5) * 5; if (v < 1000) return Math.round(v / 10) * 10; if (v < 5000) return Math.round(v / 50) * 50; return Math.round(v / 100) * 100; }
  function fromSlider(s) { return nice(Math.exp(LN(MIN) + (s / 1000) * (LN(MAX) - LN(MIN)))); }
  function toSlider(v) { return Math.round(pos(v) * 1000); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  $$('[data-finder]').forEach(function (root_) {
    var dataEl = $('.finder-data', root_.parentNode) || $('.finder-data', root_);
    if (!dataEl) return;
    var D = JSON.parse(dataEl.textContent), T = D.t;
    var sel = $('.f-select', root_), chips = $$('.chip', root_), num = $('.kgh-num', root_), rng = $('.kgh-range', root_), list = $('[data-list]', root_), send = $('[data-send]', root_), note = $('[data-note]', root_), mail = $('[data-mail]', root_);
    var task = null, kgh = 1000, shown = [];
    var byId = {}; D.tasks.forEach(function (t) { byId[t.id] = t; });

    function status(l) {
      if (l.kind === 'range') {
        var lo = l.lo || 0;
        if (kgh > l.hi) return 'above';
        if (kgh < lo) return 'below';
        return 'in';
      }
      if (l.kind === 'ref') return 'ref';
      return 'none';
    }
    var order = { in: 0, ref: 1, none: 2, above: 3, below: 3 };
    function rangeText(l) {
      if (l.kind === 'range') {
        return T.range_label + ': <b>' + (l.lo ? T.from + ' ' + fmt(l.lo) + ' ' + T.upto + ' ' + fmt(l.hi) : T.upto + ' ' + fmt(l.hi)) + ' ' + T.unit + '</b>';
      }
      if (l.kind === 'ref') return T.ref_label + ': <b>' + fmt(l.hi) + ' ' + T.unit + '</b>';
      return T.none;
    }
    function bar(l) {
      var h = '<div class="bar" aria-hidden="true"><span class="bar-track"></span>';
      if (l.kind === 'range') {
        var a = pos(l.lo && l.lo > 0 ? l.lo : MIN) * 100, b = pos(l.hi) * 100;
        h += '<span class="bar-range" style="left:' + a.toFixed(1) + '%;width:' + Math.max(1, b - a).toFixed(1) + '%"></span>';
      } else if (l.kind === 'ref') {
        h += '<span class="bar-ref" style="left:' + (pos(l.hi) * 100).toFixed(1) + '%"></span>';
      }
      h += '<span class="bar-target" style="left:' + (pos(kgh) * 100).toFixed(1) + '%"></span></div>';
      return h;
    }
    var ticks = '<div class="bar-ticks" aria-hidden="true">' + [100, 1000, 10000].map(function (v) { return '<span style="left:' + (pos(v) * 100).toFixed(1) + '%">' + fmt(v) + '</span>'; }).join('') + '</div>';

    function render() {
      var kb = $('.kgh', root_); if (kb) kb.style.opacity = (!task || task.lines.some(function (l) { return l.kind; })) ? '' : '.4';
      if (!task) { list.innerHTML = '<p class="f-empty">' + esc(T.step1) + '</p>'; send.hidden = true; return; }
      var ls = task.lines.map(function (l, i) { return { l: l, s: status(l), i: i }; });
      shown = ls;
      var html = ls.map(function (x, idx) {
        var l = x.l, s = x.s;
        var badge = s === 'in' ? T.in : s === 'above' ? T.above : s === 'below' ? T.below : s === 'ref' ? T.ref_in : T.none;
        var cls = s === 'in' ? 'res-in' : s === 'ref' ? 'res-ref' : s === 'none' ? 'res-none' : 'res-out';
        return '<article class="res ' + cls + '">' +
          '<div class="res-top"><span class="res-brand">' + esc(l.brand) + '</span><span class="res-badge">' + esc(badge) + '</span></div>' +
          '<h4 class="res-name"><a href="' + esc(l.url) + '">' + esc(l.name) + '</a></h4>' +
          (l.kind ? bar(l) + (idx === 0 ? ticks : '') : '') +
          (rangeText(l) ? '<p class="res-range">' + rangeText(l) + '</p>' : '') +
          '<p class="res-why">' + esc(l.why) + '</p>' +
          '<a class="res-link" href="' + esc(l.url) + '">' + esc(T.open) + '</a></article>';
      }).join('');
      var withRange = ls.filter(function (x) { return x.l.kind === 'range'; });
      var nIn = ls.filter(function (x) { return x.s === 'in'; }).length;
      var head = '';
      if (withRange.length && nIn === 0) {
        var allAbove = withRange.every(function (x) { return x.s === 'above'; }), allBelow = withRange.every(function (x) { return x.s === 'below'; });
        head = '<p class="f-warn">' + esc(allAbove ? T.all_above : allBelow ? T.all_below : T.all_above) + '</p>';
      } else if (withRange.length) {
        head = '<p class="f-sum">' + esc(T.summary.replace('{n}', nIn).replace('{m}', withRange.length).replace('{kgh}', fmt(kgh))) + '</p>';
      }
      list.innerHTML = head + html;
      send.hidden = false;
      buildMail();
    }
    function buildMail() {
      if (!task || !mail) return;
      var hasCap = task.lines.some(function (l) { return l.kind; });
      var lines = shown.map(function (x) {
        var l = x.l, r = '';
        if (l.kind === 'range') r = ' (' + (l.lo ? fmt(l.lo) + '-' : '') + fmt(l.hi) + ' ' + T.unit + (x.s === 'above' || x.s === 'below' ? ', ' + T.outside : '') + ')';
        return '- ' + l.brand + ': ' + l.name + r;
      });
      var note_ = note && note.value ? note.value : '';
      var subj, body;
      if (hasCap) {
        subj = T.mail_subject.replace('{task}', task.label).replace('{kgh}', fmt(kgh));
        body = T.mail_body.replace('{task}', task.label).replace('{kgh}', fmt(kgh)).replace('{lines}', lines.join('\n')).replace('Materiał / uwagi:\n\n', 'Materiał / uwagi:\n' + note_ + '\n');
      } else {
        subj = T.mail_subject_nokgh.replace('{task}', task.label);
        body = T.mail_body_nokgh.replace('{task}', task.label).replace('{lines}', lines.join('\n')).replace('uwagi:\n\n', 'uwagi:\n' + note_ + '\n');
      }
      mail.href = 'mailto:' + D.email + '?cc=' + encodeURIComponent(D.cc) + '&subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    }
    function pick(id, scroll) {
      if (!byId[id]) return;
      task = byId[id];
      chips.forEach(function (c) { var on = c.getAttribute('data-task') === id; c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      if (sel) sel.value = id;
      render();
    }
    function setKgh(v, from) {
      v = Math.max(5, Math.min(20000, v || 0));
      kgh = v;
      if (from !== 'num') num.value = v;
      if (from !== 'rng') rng.value = toSlider(v);
      render();
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { pick(c.getAttribute('data-task')); }); });
    num.addEventListener('input', function () { var v = parseFloat(num.value); if (v > 0) { kgh = Math.max(5, Math.min(20000, v)); rng.value = toSlider(kgh); render(); } });
    num.addEventListener('change', function () { setKgh(parseFloat(num.value) || 1000, 'chg'); });
    rng.addEventListener('input', function () { setKgh(fromSlider(parseInt(rng.value, 10)), 'rng'); });
    if (sel) sel.addEventListener('change', function () { pick(sel.value); });
    if (note) note.addEventListener('input', buildMail);
    var start = 'pet';
    if (/^\/?.*dobor-linii\/?$/.test(location.pathname) || location.pathname.indexOf('dobor-linii') > -1) {
      var h = (location.hash || '').replace('#', '');
      if (byId[h]) start = h;
    }
    rng.value = toSlider(kgh); num.value = kgh;
    pick(start);
  });
})();
