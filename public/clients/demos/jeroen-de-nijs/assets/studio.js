/* Room Studio (signature tool): the widget script loads when its section comes near; it mounts itself from the
   data-roomstudio JSON on the element (their teal, Noto Sans, Dutch UI). */
(() => {
  const el = document.querySelector('[data-roomstudio]');
  if (!el) return;
  const SRC = 'https://roomstudio.vercel.app/v1/roomstudio.js';
  let started = false;
  function boot() {
    if (started) return; started = true;
    const wait = el.querySelector('.studio-wait');
    const s = document.createElement('script'); s.src = SRC; s.defer = true;
    s.onload = () => { if (wait && el.shadowRoot) wait.remove(); };
    s.onerror = () => { if (wait) wait.textContent = 'De studio kon niet laden. Mail ons gerust je foto: jeroen@jeroendenijs.com'; };
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '900px 0px' });
    io.observe(el);
  } else boot();
})();
