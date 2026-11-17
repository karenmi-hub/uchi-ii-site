/* ==========================================================================
   Учи ИИ — личный кабинет (account.html).
   Вход и регистрация по нику в Telegram, восстановление пароля через бота,
   купленные курсы, профиль, удаление аккаунта. Сервер — /api/* в bot.py.
   ========================================================================== */
(function () {
  'use strict';
  var R = window.Razvilka || {};
  var $ = function (id) { return document.getElementById(id); };
  var VIEWS = ['v-noapi', 'v-auth', 'v-forgot', 'v-reset', 'v-cab'];
  var ME = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function show(id) {
    VIEWS.forEach(function (v) { $(v).hidden = v !== id; });
    var t = { 'v-auth': ['Вход в кабинет', 'Войдите или создайте аккаунт — это минута.'],
              'v-forgot': ['Восстановление пароля', 'Пришлём ссылку в Telegram.'],
              'v-reset': ['Новый пароль', 'Осталось придумать пароль.'],
              'v-cab': ['Личный кабинет', 'Ваши курсы и доступ к разбору работ.'] }[id];
    if (t) { $('acc-title').textContent = t[0]; $('acc-lead').textContent = t[1]; }
  }
  function msg(form, text, ok) {
    var m = form.querySelector('.form-msg');
    if (!m) return;
    m.hidden = !text; m.className = 'form-msg ' + (ok ? 'ok' : 'err'); m.textContent = text || '';
  }
  function busy(form, on, label) {
    var b = form.querySelector('button[type=submit]');
    if (!b) return;
    if (on) { b.dataset.label = b.textContent; b.disabled = true; b.textContent = label || 'Секунду…'; }
    else { b.disabled = false; b.textContent = b.dataset.label || b.textContent; }
  }
  function nextUrl() {
    var q = /[?&]next=([^&]+)/.exec(location.search);
    if (!q) return '';
    var u = decodeURIComponent(q[1]);
    return /^[\w.-]+\.html/.test(u) ? u : '';        // только наши страницы — не открытый редирект
  }
  function signedIn(data) {
    ME = data;
    if (R.paintAccount) R.paintAccount(data);
    var n = nextUrl();
    if (n) { location.href = n; return; }
    history.replaceState(null, '', location.pathname);
    renderCab();
    show('v-cab');
  }

  /* ---------- вкладки и показ пароля ---------- */
  function tab(which) {
    var reg = which === 'reg';
    $('t-login').setAttribute('aria-selected', String(!reg));
    $('t-reg').setAttribute('aria-selected', String(reg));
    $('f-login').hidden = reg; $('f-reg').hidden = !reg;
    (reg ? $('r-name') : $('l-login')).focus();
  }
  $('t-login').onclick = function () { tab('login'); };
  $('t-reg').onclick = function () { tab('reg'); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pw]');
    if (!b) return;
    var inp = b.parentNode.querySelector('input');
    var vis = inp.type === 'password';
    inp.type = vis ? 'text' : 'password'; b.textContent = vis ? 'скрыть' : 'показать';
  });
  $('to-forgot').onclick = function () { show('v-forgot'); $('fg-login').value = $('l-login').value; $('fg-login').focus(); };
  document.querySelector('[data-back]').onclick = function () { show('v-auth'); };

  /* ---------- формы ---------- */
  $('f-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.login.value.trim() || !f.password.value) { msg(f, 'Введите ник и пароль.'); return; }
    busy(f, true, 'Входим…');
    R.api('/api/login', { login: f.login.value.trim(), password: f.password.value }).then(function (r) {
      busy(f, false);
      if (r.data.ok) signedIn(r.data); else msg(f, r.data.error || 'Не получилось войти.');
    });
  });

  $('f-reg').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.name.value.trim()) { msg(f, 'Напишите, как к вам обращаться.'); f.name.focus(); return; }
    if (!/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(f.tg.value.trim())) { msg(f, 'Ник в Telegram — от 5 до 32 латинских букв, цифр и «_», начинается с буквы.'); f.tg.focus(); return; }
    if (f.password.value.length < 8) { msg(f, 'Пароль — не короче 8 символов.'); f.password.focus(); return; }
    if (!f.consent.checked) { msg(f, 'Нужно согласие на обработку данных.'); f.consent.focus(); return; }
    busy(f, true, 'Создаём аккаунт…');
    R.api('/api/register', {
      name: f.name.value.trim(), tg: f.tg.value.trim(), email: f.email.value.trim(), password: f.password.value,
      consent: true, consentAt: new Date().toISOString(), policyVersion: (window.RAZVILKA || {}).POLICY_VERSION || ''
    }).then(function (r) {
      busy(f, false);
      if (r.data.ok) { if (R.goal) R.goal('register'); signedIn(r.data); }
      else msg(f, r.data.error || 'Не получилось создать аккаунт.');
    });
  });

  $('f-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.login.value.trim()) { msg(f, 'Введите ник или почту.'); return; }
    busy(f, true, 'Отправляем…');
    R.api('/api/password/forgot', { login: f.login.value.trim() }).then(function (r) {
      busy(f, false);
      if (r.data.ok) msg(f, 'Если такой аккаунт есть и к нему подключён Telegram, бот уже прислал ссылку. Она действует час.', true);
      else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('f-reset').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, tok = (/reset=([\w-]+)/.exec(location.hash) || [])[1];
    if (f.password.value.length < 8) { msg(f, 'Пароль — не короче 8 символов.'); return; }
    busy(f, true, 'Сохраняем…');
    R.api('/api/password/reset', { token: tok, password: f.password.value }).then(function (r) {
      busy(f, false);
      if (r.data.ok) signedIn(r.data); else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('f-profile').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    busy(f, true, 'Сохраняем…');
    R.api('/api/profile', { name: f.name.value.trim(), tg: f.tg.value.trim(), email: f.email.value.trim() }).then(function (r) {
      busy(f, false);
      if (r.data.ok) { ME = r.data; renderCab(); if (R.paintAccount) R.paintAccount(ME); msg(f, 'Сохранено.', true); }
      else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('f-pass').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    busy(f, true, 'Меняем…');
    R.api('/api/password/change', { old: f.old.value, password: f.password.value }).then(function (r) {
      busy(f, false);
      if (r.data.ok) { f.reset(); msg(f, 'Пароль изменён. На других устройствах нужно войти заново.', true); }
      else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('f-del').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!confirm('Удалить аккаунт навсегда? Отменить это нельзя.')) return;
    busy(f, true, 'Удаляем…');
    R.api('/api/account/delete', { password: f.password.value }).then(function (r) {
      busy(f, false);
      if (r.data.ok) { if (R.paintAccount) R.paintAccount({ account: null }); location.href = 'index.html'; }
      else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('f-review').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.text.value.trim().length < 30) { msg(f, 'Напишите хотя бы пару предложений — от 30 символов.'); return; }
    if (!f.agree.checked) { msg(f, 'Отметьте согласие на публикацию.'); return; }
    busy(f, true, 'Отправляем…');
    var bought = (ME.purchases || [])[0];
    R.api('/api/review', { name: f.name.value.trim(), role: f.role.value.trim(), text: f.text.value.trim(), result: f.result.value.trim(),
                           course: bought ? bought.course : '' }).then(function (r) {
      busy(f, false);
      if (r.data.ok) { ME = r.data; renderCab(); }
      else msg(f, r.data.error || 'Не получилось.');
    });
  });

  $('logout').onclick = function () {
    R.api('/api/logout', {}).then(function () {
      if (R.paintAccount) R.paintAccount({ account: null });
      show('v-auth'); tab('login');
    });
  };

  /* ---------- кабинет ---------- */
  function linkTelegram(btn) {
    btn.disabled = true;
    // окно открываем сразу по клику — иначе браузер заблокирует всплывающее окно
    var w = window.open('', '_blank');
    R.api('/api/telegram/link', {}).then(function (r) {
      btn.disabled = false;
      if (r.data.ok && r.data.url) {
        if (w) w.location = r.data.url; else location.href = r.data.url;
        $('c-tgstate').insertAdjacentHTML('beforeend', '<p style="font-size:14px;margin:10px 0 0">Нажмите «Start» в боте, затем <a href="account.html">обновите эту страницу</a>.</p>');
      } else {
        if (w) w.close();
        alert(r.data.error || 'Не получилось. Попробуйте позже.');
      }
    });
  }

  function renderCab() {
    var a = ME.account;
    $('c-ava').textContent = (a.name || '?').charAt(0).toUpperCase();
    $('c-name').textContent = a.name;
    $('c-tg').textContent = '@' + a.tg;
    $('p-name').value = a.name; $('p-tg').value = '@' + a.tg; $('p-email').value = a.email || '';
    $('c-tgstate').innerHTML = a.telegramLinked
      ? '<div class="tg-state ok"><span>✓</span><span>Telegram подключён. Занятия, разборы и напоминания приходят в бота.</span></div>'
      : '<div class="tg-state"><span>!</span><span>Подключите Telegram: туда приходят занятия и разборы работ, через него же восстанавливается пароль.</span></div>' +
        '<button class="btn wide" type="button" id="link-tg" style="margin-top:12px">Подключить Telegram</button>';
    var lb = $('link-tg');
    if (lb) lb.onclick = function () { linkTelegram(lb); };

    var bot = ME.botUrl || '';
    var items = (ME.purchases || []).map(function (p) {
      var when = p.accessUntil ? (p.active ? 'доступ до ' + p.accessUntil : 'доступ закончился ' + p.accessUntil) : 'навсегда';
      var act = p.active && bot
        ? '<a class="btn sm" href="' + esc(bot) + '?start=lessons" target="_blank" rel="noopener">Открыть в боте</a>'
        : (!p.active ? '<a class="btn sm ghost" href="pay.html?course=' + esc(p.course) + '">Продлить</a>'
          : (!ME.account.telegramLinked ? '<span style="font-size:13.5px;color:var(--mut);max-width:190px;text-align:right">Подключите Telegram слева — занятия и разборы придут туда</span>' : ''));
      return '<div class="my-course"><div><b>' + esc(p.title) + '</b><span>' + esc(when) + ' · оплачено ' + esc((p.paidAt || '').slice(0, 10)) + '</span></div>' + act + '</div>';
    }).join('');
    $('c-courses').innerHTML = items ||
      '<div class="empty"><p style="margin:0 0 14px">Здесь появятся купленные курсы.</p><a class="btn" href="courses.html">Выбрать курс</a></div>';

    var w = (ME.waitlist || []).map(function (x) {
      return '<div class="my-course"><div><b>' + esc(x.title) + '</b><span>напишем, когда курс откроется</span></div></div>';
    }).join('');
    // отзыв: только для купивших
    $('c-review-panel').hidden = !ME.canReview;
    var rv = ME.myReview, st = $('rv-state');
    if (rv) {
      st.hidden = false;
      st.textContent = { 'new': 'Спасибо! Отзыв на проверке — опубликуем в ближайшее время.',
                         published: 'Ваш отзыв опубликован на сайте. Спасибо!',
                         hidden: 'Отзыв не опубликован. Можно отправить новый.' }[rv.status] || '';
      $('f-review').hidden = rv.status === 'published';
    } else { st.hidden = true; $('f-review').hidden = false; }
    if (!$('rv-name').value) $('rv-name').value = a.name;
    $('c-wait-panel').hidden = !w;
    $('c-wait').innerHTML = w;
    renderLessons();
  }

  /* Тексты занятий приходят с сервера в разметке Telegram (b, i, code и переносы строк).
     Разметку пишем мы сами, поэтому вставляем её как есть, а переносы превращаем в абзацы. */
  function tgToHtml(t) {
    return t.split(/\n{2,}/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function renderLessons() {
    R.api('/api/lessons').then(function (r) {
      var d = r.data;
      if (!d || !d.ok || !d.lessons) return;
      var firstPaid = true;
      $('c-lessons').innerHTML = d.lessons.map(function (l) {
        var head = '';
        if (l.paid && firstPaid) {
          firstPaid = false;
          head = '<h3 class="lr-mod">Модуль «' + esc(d.module) + '»</h3>';
        }
        if (l.locked) {
          return head + '<div class="lr locked"><span class="lr-n">' + l.n + '</span><b>' + esc(l.title) + '</b>' +
            '<a class="btn sm ghost" href="pay.html?course=ai-work">Открыть</a></div>';
        }
        return head + '<details class="lr"><summary><span class="lr-n">' + l.n + '</span><b>' + esc(l.title) + '</b></summary>' +
          '<div class="lr-body">' + tgToHtml(l.body) + '<div class="lr-hw">' + tgToHtml(l.hw) + '</div></div></details>';
      }).join('');
      $('c-lessons-note').textContent = d.hasAccess
        ? 'Курс открыт. Задания присылайте в бота — там же приходит разбор. Тур по кнопкам нейросетей — в тренажёре (раздел «Нейросети»).'
        : 'Занятия 1–4 бесплатны. Модуль «' + d.module + '» откроется после покупки курса.';
      $('c-lessons-panel').hidden = false;
    });
  }

  /* ---------- старт ---------- */
  if (!R.hasApi || !R.hasApi()) { show('v-noapi'); return; }
  if (/reset=[\w-]+/.test(location.hash)) { show('v-reset'); return; }
  R.me(true).then(function (m) {
    if (m && m.account) { ME = m; if (nextUrl()) { location.href = nextUrl(); return; } renderCab(); show('v-cab'); }
    else { show('v-auth'); if (/register/.test(location.hash)) tab('reg'); }
  });
})();
