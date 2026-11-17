/* ==========================================================================
   Учи ИИ — оплата курса (pay.html).
   Курсы — из courses.json. Сервер (/api/checkout) создаёт счёт и подписывает
   поля Робокассы паролем №1 — пароль никогда не попадает в браузер. Здесь мы
   только собираем из этих полей форму и отправляем её POST-запросом на
   страницу оплаты Робокассы (с чеком ссылка бывает слишком длинной для GET).
   ========================================================================== */
(function () {
  'use strict';
  var R = window.Razvilka || {};
  var C = window.RAZVILKA || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rub(n) { return Number(n).toLocaleString('ru-RU') + ' ₽'; }
  var COURSES = [], ME = null;
  var want = (/[?&]course=([\w-]+)/.exec(location.search) || [])[1] || '';

  function owned(id) { return ME && (ME.purchases || []).some(function (p) { return p.course === id && p.active; }); }
  function access(c) { return c.accessDays ? 'доступ на ' + c.accessDays + ' дней' : 'доступ навсегда'; }
  function logo(c) {
    return c.tool ? '<span class="ai-logo sm"><img src="assets/img/ai/' + esc(c.tool) + '.svg" alt="" width="20" height="20"></span>'
                  : '<span class="ai-logo sm txt" aria-hidden="true">У</span>';
  }

  function renderCourses() {
    $('pay-courses').innerHTML = COURSES.map(function (c) {
      var mine = owned(c.id);
      return '<label class="pay-c' + (mine ? ' own' : '') + '">' +
        '<input type="radio" name="course" value="' + esc(c.id) + '"' + (c.id === want ? ' checked' : '') + (mine && c.accessDays === null ? ' disabled' : '') + '>' +
        logo(c) + '<span class="pay-c-t"><b>' + esc(c.title) + '</b><small>' + esc(mine ? (c.accessDays ? 'уже куплен — можно продлить' : 'уже куплен') : access(c)) + '</small></span>' +
        '<span class="pay-c-p">' + rub(c.price) + '</span></label>';
    }).join('');
  }
  function current() { var el = document.querySelector('[name=course]:checked'); return el ? COURSES.filter(function (c) { return c.id === el.value; })[0] : null; }
  function renderSum() {
    var c = current();
    $('pay-btn').disabled = !c || !ME || !ME.account;
    $('pay-btn').textContent = c ? 'Оплатить ' + rub(c.price) : 'Оплатить';
    if (!c) { $('pay-sum-body').innerHTML = '<p class="mut">Выберите курс слева.</p>'; return; }
    $('pay-sum-body').innerHTML = '<div class="pay-sum-h">' + logo(c) + '<b>' + esc(c.title) + '</b></div>' +
      '<ul class="pay-inc">' + (c.includes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') +
      '<div class="pay-total"><span>К оплате</span><b>' + rub(c.price) + '</b></div><p class="pay-acc">' + esc(access(c)) + ' · без автопродления</p>';
    try { history.replaceState(null, '', 'pay.html?course=' + encodeURIComponent(c.id)); } catch (e) {}
  }
  function showAuth() {
    var c = current();
    var back = 'pay.html' + (c ? '?course=' + c.id : '');
    $('pay-login').href = 'account.html?next=' + encodeURIComponent(back) + '#register';
    $('pay-auth').hidden = false;
    $('pay-step2').hidden = true;
  }
  function msg(t) { $('pay-msg').hidden = !t; $('pay-msg').textContent = t || ''; }

  // Поля от сервера → скрытая форма → POST на Робокассу
  function goRobokassa(f) {
    var form = document.createElement('form');
    form.method = f.method || 'POST'; form.action = f.action; form.acceptCharset = 'utf-8';
    Object.keys(f.fields).forEach(function (k) {
      var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = f.fields[k]; form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
  }

  $('pay-courses').addEventListener('change', function () { msg(''); renderSum(); if (!ME || !ME.account) showAuth(); });
  $('pay-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = current();
    if (!c) { msg('Выберите курс.'); return; }
    if (!ME || !ME.account) { showAuth(); return; }
    var email = $('pay-email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg('Укажите почту для чека — например, name@mail.ru.'); $('pay-email').focus(); return; }
    if (!$('pay-consent').checked) { msg('Чтобы оплатить, примите условия оферты.'); return; }
    msg('');
    var btn = $('pay-btn'); btn.disabled = true; btn.textContent = 'Переходим к оплате…';
    R.api('/api/checkout', { course: c.id, email: email, consent: true, consentAt: new Date().toISOString(),
                             policyVersion: C.POLICY_VERSION || '' }).then(function (r) {
      var d = r.data || {};
      if (d.ok && d.form) { goRobokassa(d.form); return; }
      if (d.ok && d.url) { location.href = d.url; return; }
      if (r.status === 401) { showAuth(); }
      btn.disabled = false; renderSum();
      msg(d.error || 'Не получилось начать оплату. Попробуйте ещё раз или напишите в поддержку.');
    });
  });

  if (!R.hasApi || !R.hasApi()) {
    $('pay-courses').innerHTML = '<div class="pay-auth"><b>Оплата на сайте скоро заработает</b><p>Пока можно оплатить в Telegram-боте или написать нам — поможем.</p></div>';
    $('pay-step2').hidden = true;
    return;
  }
  fetch('courses.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    COURSES = (d.courses || []).filter(function (c) { return c.status === 'open' && c.price; })
      .sort(function (a, b) { return (a.branch === 'ai' ? 0 : 1) - (b.branch === 'ai' ? 0 : 1); });
    if (!COURSES.some(function (c) { return c.id === want; })) want = (COURSES[0] || {}).id || '';
    return R.me ? R.me(true) : null;
  }).then(function (m) {
    ME = m && m.account ? m : { account: null };
    renderCourses(); renderSum();
    if (!ME.account) showAuth();
    else if (ME.account.email) $('pay-email').value = ME.account.email;
  }).catch(function () {
    $('pay-courses').innerHTML = '<p class="form-msg err">Не получилось загрузить курсы. Обновите страницу.</p>';
  });
})();
