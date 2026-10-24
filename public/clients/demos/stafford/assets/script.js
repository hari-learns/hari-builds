(function () {
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  // header: solid after scroll, mobile drawer
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    var burger = $('.burger');
    if (burger) burger.addEventListener('click', function () {
      var o = hdr.classList.toggle('open');
      burger.setAttribute('aria-expanded', o);
      de.style.overflow = o ? 'hidden' : '';
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { hdr.classList.remove('open'); de.style.overflow = ''; if (burger) burger.setAttribute('aria-expanded', 'false'); }); });
  }

  // dock
  var dock = $('.dock');
  try { if (dock && sessionStorage.getItem('dock') === '1') dock.hidden = true; } catch (e) {}
  if (dock) $('button', dock).addEventListener('click', function () { dock.hidden = true; try { sessionStorage.setItem('dock', '1'); } catch (e) {} });

  // reveals + counters
  function count(el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    if (reduce || isNaN(to) || to < 3) { el.textContent = el.getAttribute('data-to'); return; }
    var t0 = null, dur = 1400;
    function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * p); if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }
  var items = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        $$('[data-to]', e.target).forEach(count);
        if (e.target.hasAttribute('data-to')) count(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
    $$('[data-to]').forEach(function (el) { el.textContent = el.getAttribute('data-to'); });
  }

  // finder (signature tool)
  var fd = $('#finder-data');
  if (fd) {
    var D = JSON.parse(fd.textContent);
    var st = { ind: null, need: null };
    var out = $('#fresult'), note = $('#fnote');
    var chipsI = $$('[data-ind]'), chipsN = $$('[data-need]');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var render = function () {
      chipsI.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-ind') === st.ind); });
      chipsN.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-need') === st.need); });
      if (!st.ind || !st.need) {
        out.innerHTML = '<p class="empty">' + (!st.ind && !st.need ? 'Choose your industry and what you need. The matching service and project appear here.' : (!st.ind ? 'Now choose your industry.' : 'Now choose what you need.')) + '</p>';
        return;
      }
      var n = D.needs[st.need], s = D.services[n.svc];
      var pk = D.projByNeed[st.need] || D.projByInd[st.ind], p = D.projects[pk];
      var indName = D.ind[st.ind];
      var body = 'Industry: ' + indName + '\nWhat I need: ' + n.label + '\nService: ' + s.name + '\n\nAbout my project:\n' + (note.value || '') + '\n\nName:\nCompany:\nPhone:\n';
      var mail = 'mailto:' + D.sales + '?subject=' + encodeURIComponent('Enquiry: ' + s.name + ' (' + indName + ')') + '&body=' + encodeURIComponent(body);
      var steps = s.process.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      out.innerHTML =
        '<span class="eyebrow">Best fit</span><h3>' + esc(s.name) + '</h3><p class="why">' + esc(D.why[st.need]) + '</p>' +
        '<a class="fres-proj" href="' + p.url + '"><img src="' + p.img + '" alt="' + esc(p.name) + '" width="96" height="72" loading="lazy"><span><small>Related project</small><b>' + esc(p.name) + '</b></span></a>' +
        '<ol class="fres-steps">' + steps + '</ol>' +
        '<div class="btns" style="margin-top:0"><a class="btn btn-primary" href="' + mail + '">Email sales with these answers</a><a class="btn btn-ghost" href="' + s.url + '">About ' + esc(s.name) + '</a></div>' +
        '<p class="tiny">Opens your email app with the answers filled in, addressed to ' + esc(D.sales) + '. Nothing is sent until you press send.</p>';
    };
    chipsI.forEach(function (c) { c.addEventListener('click', function () { st.ind = c.getAttribute('data-ind'); render(); }); });
    chipsN.forEach(function (c) { c.addEventListener('click', function () { st.need = c.getAttribute('data-need'); render(); }); });
    if (note) note.addEventListener('input', function () { if (st.ind && st.need) render(); });
    // allow deep links from other pages: ?need=machine
    var q = /[?&]need=(\w+)/.exec(location.search); if (q && D.needs[q[1]]) st.need = q[1];
    render();
  }

  // contact form -> mailto draft
  var cf = $('#cform');
  if (cf) cf.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(cf), g = function (k) { return f.get(k) || ''; };
    var body = 'Name: ' + g('name') + '\nCompany: ' + g('company') + '\nPhone: ' + g('phone') + '\nEmail: ' + g('email') + '\nService: ' + g('service') + '\n\n' + g('message');
    location.href = 'mailto:' + cf.getAttribute('data-to') + '?subject=' + encodeURIComponent('Website enquiry' + (g('service') ? ': ' + g('service') : '')) + '&body=' + encodeURIComponent(body);
  });
})();
