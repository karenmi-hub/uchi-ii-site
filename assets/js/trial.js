/* ==========================================================================
   Учи ИИ — пробный курс (trial.html).
   Уроки лежат прямо в HTML. Здесь — навигация, отметки, прогресс (в браузере),
   копирование шаблонов и мини-тест.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'uii-trial';
  var lessons = Array.prototype.slice.call(document.querySelectorAll('.lesson'));
  var list = document.getElementById('t-list');
  var bar = document.getElementById('t-bar');
  var prev = document.getElementById('t-prev'), next = document.getElementById('t-next');
  var st = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { cur: 1, done: {}, checks: {} }; }
    catch (e) { return { cur: 1, done: {}, checks: {} }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  function renderList() {
    list.innerHTML = lessons.map(function (l) {
      var n = +l.dataset.lesson;
      return '<li class="' + (st.done[n] ? 'done' : '') + '"><button type="button" data-go="' + n + '"' +
        (n === st.cur ? ' aria-current="step"' : '') + '><span class="n">' + (st.done[n] ? '✓' : (n === 6 ? '★' : n)) + '</span>' +
        l.dataset.title + '</button></li>';
    }).join('');
    var done = Object.keys(st.done).length;
    bar.style.width = Math.round(done / lessons.length * 100) + '%';
  }

  function show(n, scroll) {
    st.cur = Math.max(1, Math.min(lessons.length, n));
    lessons.forEach(function (l) { l.hidden = +l.dataset.lesson !== st.cur; });
    prev.disabled = st.cur === 1;
    next.hidden = st.cur === lessons.length;
    next.textContent = st.cur === lessons.length - 1 ? 'Урок пройден — к тесту →' : 'Урок пройден — дальше →';
    save(); renderList();
    if (scroll) document.querySelector('.trial').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b) show(+b.dataset.go, true);
  });
  prev.onclick = function () { show(st.cur - 1, true); };
  next.onclick = function () {
    st.done[st.cur] = true;
    if (window.Razvilka && window.Razvilka.goal) window.Razvilka.goal('trial_lesson_' + st.cur);
    show(st.cur + 1, true);
  };

  // отметки в чек-листах
  Array.prototype.forEach.call(document.querySelectorAll('[data-check]'), function (c) {
    c.checked = !!st.checks[c.dataset.check];
    c.addEventListener('change', function () { st.checks[c.dataset.check] = c.checked; save(); });
  });

  // копирование шаблонов
  Array.prototype.forEach.call(document.querySelectorAll('.tpl .copy'), function (b) {
    b.addEventListener('click', function () {
      var text = b.parentNode.querySelector('pre').textContent;
      var ok = function () { b.textContent = 'Скопировано'; setTimeout(function () { b.textContent = 'Скопировать'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok).catch(function () {});
    });
  });

  // мини-тест: мгновенная обратная связь
  var qs = Array.prototype.slice.call(document.querySelectorAll('.qz'));
  qs.forEach(function (q) {
    q.addEventListener('change', function (e) {
      if (e.target.type !== 'radio') return;
      var right = e.target.value === q.dataset.answer;
      q.classList.toggle('ok', right); q.classList.toggle('no', !right);
      if (qs.every(function (x) { return x.classList.contains('ok'); })) {
        document.getElementById('t-finish').hidden = false;
        st.done[lessons.length] = true; save(); renderList();
        if (window.Razvilka && window.Razvilka.goal) window.Razvilka.goal('trial_done');
      }
    });
  });
  if (st.done[lessons.length]) {
    document.getElementById('t-finish').hidden = false;
  }

  show(st.cur || 1, false);
})();
