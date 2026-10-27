/* Room Studio mount for the Natalia Zubizarreta concept.
   The widget's Spanish strings include a few that are functions (room name, brand, counts), which a JSON
   data-roomstudio attribute cannot carry, so the config sits in a JSON script tag and is mounted here with
   RoomStudio.mount(el, config) once roomstudio.js (loaded right after this file) is ready. */
(function () {
  var es = {
    detected: function (r) { return 'Creemos que es: ' + r.toLowerCase() + '. Cámbialo si no lo es.'; },
    designsQ: function (b) { return 'Diseños de ' + b; },
    left: function (n) { return n === 1 ? 'Te queda 1 prueba gratis hoy' : 'Te quedan ' + n + ' pruebas gratis hoy'; },
    working: function (room) { return 'Redecorando tu ' + room.toLowerCase(); },
    workingSub: function (d) { return 'Paleta ' + d; },
    applying: function (d) { return 'Aplicando ' + d; },
    resultT: function (room, st) { return room.indexOf('Plano') === 0 ? 'Tu casa, paleta ' + st : 'Tu ' + room.toLowerCase() + ', paleta ' + st; },
    pass: function (b) { return 'Enviárselo a ' + b; },
    disclaimer: function (b) { return 'Una idea para empezar a hablar. ' + b + ' diseña contigo el proyecto real.'; },
    passTitle: function (b) { return 'Enviárselo a ' + b; },
    passSub: function (b) { return 'El estudio recibirá tu foto, el antes y el después y lo que pediste, y te responderá.'; },
    sentTitle: function (n) { return 'Gracias' + (n ? ', ' + n : ''); },
    sentBody: function (b) { return b + ' ya tiene tu estancia y el diseño que te gustó, y se pondrá en contacto contigo.'; },
    limitBtn: function (b) { return 'Enviar tu estancia a ' + b; }
  };
  function mountAll() {
    if (!window.RoomStudio) return false;
    document.querySelectorAll('[data-rs-mount]').forEach(function (el) {
      if (el.__rs) return;
      var cfgEl = el.querySelector('script[data-rs-config]');
      var cfg = {};
      try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { console.error('Room Studio config', e); return; }
      cfg.text = Object.assign({}, cfg.text || {}, es);
      window.RoomStudio.mount(el, cfg);
    });
    return true;
  }
  function boot() { if (!mountAll()) { var n = 0, t = setInterval(function () { if (mountAll() || ++n > 80) clearInterval(t); }, 150); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
