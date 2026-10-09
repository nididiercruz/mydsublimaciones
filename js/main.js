/* ==========================================================
   M&D SUBLIMACIONES — Interacciones
   ========================================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '573000000000'; // ← Cambia por el número real (código país + número, sin + ni espacios)
  document.documentElement.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function waLink(text) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* ---- Enlaces de WhatsApp centralizados ---- */
  $$('a[data-wa]').forEach(function (a) { a.href = waLink(a.getAttribute('data-wa')); });

  /* ---- Header: sombra al hacer scroll ---- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Menú móvil ---- */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---- Animaciones de entrada ---- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.setProperty('--d', ((i % 4) * 0.07) + 's');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Contadores de estadísticas ---- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = prefix + end + suffix; return; }
    var t0 = null, dur = 1400;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- Filtro de productos ---- */
  var chips = $$('.chip[data-filter]');
  var cards = $$('.product-card[data-cat]');
  if (chips.length && cards.length) {
    var note = $('#results-note');
    var empty = $('#empty-state');
    var apply = function (cat) {
      var n = 0;
      cards.forEach(function (c) {
        var show = cat === 'todos' || c.getAttribute('data-cat') === cat;
        c.hidden = !show;
        if (show) n++;
      });
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.getAttribute('data-filter') === cat)); });
      if (note) note.textContent = n + (n === 1 ? ' producto' : ' productos');
      if (empty) empty.hidden = n !== 0;
    };
    chips.forEach(function (ch) { ch.addEventListener('click', function () {
      var cat = ch.getAttribute('data-filter');
      apply(cat);
      try { history.replaceState(null, '', cat === 'todos' ? location.pathname : '#' + cat); } catch (e) {}
    }); });
    var initial = (location.hash || '').replace('#', '');
    apply(chips.some(function (c) { return c.getAttribute('data-filter') === initial; }) ? initial : 'todos');
  }

  /* ---- FAQ: una respuesta abierta a la vez ---- */
  var faqs = $$('.faq details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---- Formularios: validación + envío por WhatsApp ---- */
  $$('form[data-lead-form]').forEach(function (form) {
    var status = $('.form-status', form);

    function validateField(f) {
      var err = $('#' + f.id + '-error', form);
      var v = f.value.trim();
      var msg = '';
      if (f.required && !v) msg = 'Este campo es obligatorio.';
      else if (f.name === 'telefono' && v && v.replace(/\D/g, '').length < 7) msg = 'Escribe un número válido (mínimo 7 dígitos).';
      else if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Escribe un correo válido.';
      f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }

    $$('.input', form).forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value || f.getAttribute('aria-invalid') === 'true') validateField(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') validateField(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('.input', form);
      var ok = true, firstBad = null;
      fields.forEach(function (f) { if (!validateField(f)) { ok = false; if (!firstBad) firstBad = f; } });
      if (!ok) { firstBad.focus(); return; }

      var data = {};
      fields.forEach(function (f) { data[f.name] = f.value.trim(); });
      var lines = ['Hola M&D Sublimaciones, quiero asesoría de diseño.', ''];
      lines.push('Nombre: ' + data.nombre);
      lines.push('WhatsApp: ' + data.telefono);
      if (data.correo) lines.push('Correo: ' + data.correo);
      lines.push('Producto: ' + data.producto);
      if (data.cantidad) lines.push('Cantidad: ' + data.cantidad);
      if (data.mensaje) lines.push('Mensaje: ' + data.mensaje);

      if (status) {
        status.hidden = false;
        status.className = 'form-status form-status--ok';
        status.textContent = '¡Gracias, ' + data.nombre.split(' ')[0] + '! Se abrirá WhatsApp con tu solicitud lista para enviar.';
      }
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      form.reset();
    });
  });

  /* ---- Año del copyright ---- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
