/* ==========================================================================
   Учи ИИ — тренажёр «Нейросети на практике» (tools.html).
   Подбор нейросети, светофор данных, конструктор запроса и тест работают
   в браузере. Тур по кнопкам приходит с сервера (/api/practice): пример
   с DeepSeek — всем, остальные инструменты — тем, кто купил курс.
   ========================================================================== */
(function () {
  'use strict';
  var R = window.Razvilka || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function copy(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = 'Скопировано ✓'; setTimeout(function () { btn.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    else { var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); }
  }

  /* ---------- 1. Подбор ---------- */
  // Логотипы — товарные знаки владельцев, показаны, чтобы сервис было легко узнать (см. LICENSES.md)
  var LOGO_IDS = ['deepseek', 'qwen', 'gemini', 'claude'];
  function logo(id, size) {
    if (id === 'none') return '<span class="ai-logo ' + (size || '') + ' txt stop" aria-hidden="true">✋</span>';
    if (LOGO_IDS.indexOf(id) < 0) return '<span class="ai-logo ' + (size || '') + ' txt" aria-hidden="true">RU</span>';
    return '<span class="ai-logo ' + (size || '') + '"><img src="assets/img/ai/' + id + '.svg" alt="" width="28" height="28"></span>';
  }
  var NAMES = { deepseek: 'DeepSeek', qwen: 'Qwen', gemini: 'Gemini', claude: 'Claude',
                ruai: 'GigaChat или YandexGPT', none: 'Пока никуда' };
  // Теги — коротко, чем сильна нейросеть и где доступна
  var TAGS = {
    deepseek: ['бесплатно', 'рассуждение', 'поиск', 'расчёты', 'Китай'],
    qwen: ['бесплатно', 'документы', 'сканы', 'таблицы', 'Китай'],
    gemini: ['исследование', 'свои помощники', 'Google', 'США', 'нет в России'],
    claude: ['длинные тексты', 'проекты', 'артефакты', 'США', 'нет в России']
  };
  function tagsHTML(list, n) {
    return '<span class="tags">' + (list || []).slice(0, n || 9).map(function (t) {
      return '<span class="tag' + (t === 'нет в России' ? ' warn' : t === 'бесплатно' ? ' free' : '') + '">#' + esc(t) + '</span>';
    }).join('') + '</span>';
  }
  var Q = {
    task: [['text', 'Письмо или текст'], ['calc', 'Расчёт или сравнение'], ['doc', 'Длинный документ'],
           ['scan', 'Фото или скан'], ['fresh', 'Свежие новости, законы'], ['helper', 'Помощник на каждый день'],
           ['research', 'Исследовать тему']],
    data: [['open', 'Общие сведения'], ['anon', 'Рабочие, но обезличенные'], ['secret', 'Персональные данные или тайна']],
    where: [['ru', 'В России'], ['abroad', 'За рубежом или доступ даёт работодатель']]
  };
  var ORDER = {
    text: ['claude', 'deepseek', 'qwen', 'gemini', 'ruai'], calc: ['deepseek', 'qwen', 'claude', 'gemini'],
    doc: ['qwen', 'claude', 'gemini', 'deepseek'], scan: ['qwen', 'gemini', 'claude', 'deepseek'],
    fresh: ['deepseek', 'gemini', 'qwen', 'claude'], helper: ['claude', 'gemini', 'ruai', 'deepseek'],
    research: ['gemini', 'claude', 'deepseek', 'qwen']
  };
  var WHY = {
    deepseek: { text: 'бесплатно и хорошо пишет по-русски', calc: 'DeepThink рассуждает по шагам, и ход мыслей можно проверить',
                doc: 'читает файлы, хотя для очень длинных Qwen надёжнее', scan: 'читает текст со скриншотов',
                fresh: 'кнопка «Поиск» даёт ответ со ссылками', helper: 'длинную инструкцию храните в заметке и вставляйте в начало чата',
                research: 'поиск по нескольким сайтам со ссылками' },
    qwen: { text: 'бесплатно и хорошо понимает русский', calc: 'режим Thinking рассуждает перед ответом',
            doc: 'удерживает документ на сотню страниц целиком', scan: 'перепечатывает текст с фото и собирает таблицу со скриншота',
            fresh: 'поиск со ссылками', helper: 'бесплатно, инструкцию храните в заметке', research: 'поиск со ссылками' },
    gemini: { text: 'пишет и правит текст в Canvas рядом с чатом', calc: 'думающая модель для сложных задач',
              doc: 'читает файлы, в том числе с Google Диска', scan: 'хорошо понимает фото', fresh: 'встроенный поиск Google',
              helper: 'Gems — помощник с постоянной инструкцией', research: 'Deep Research за минуты собирает отчёт со ссылками' },
    claude: { text: 'аккуратно держит стиль и структуру длинных текстов', calc: 'рассуждает и показывает расчёт',
              doc: 'читает несколько документов сразу и сравнивает их', scan: 'понимает фото и сканы',
              fresh: 'поиск со ссылками', helper: 'Проекты: инструкция и файлы общие для всех чатов',
              research: 'Research — многошаговое исследование (по подписке)' },
    ruai: { def: 'данные остаются на серверах в России' },
    none: { def: 'персональные данные и коммерческую тайну нельзя отдавать ни одной облачной нейросети' }
  };
  var st = { task: 'calc', data: 'anon', where: 'ru' };

  function recommend() {
    if (st.data === 'secret') {
      return { main: 'none', alt: null, why: WHY.none.def, warn: [
        'Сначала обезличьте текст: ФИО, ИНН, телефоны, адреса и суммы замените метками — «Клиент А», «Сумма X». Шаблон — в первом занятии.',
        'Сделали — выберите выше «Рабочие, но обезличенные», и мы подскажем нейросеть.'] };
    }
    var list = ORDER[st.task].filter(function (t) { return st.where === 'abroad' || (t !== 'gemini' && t !== 'claude'); });
    var main = list[0], alt = list[1];
    var warn = [];
    if (st.data === 'anon') warn.push('Перед отправкой замените ФИО, названия компаний, ИНН и суммы метками: «Клиент А», «Сумма X».');
    if (main === 'deepseek' || alt === 'deepseek') warn.push('Сайт DeepSeek в России открывается нестабильно. Не открылся — берите запасной вариант.');
    if (main === 'gemini' || main === 'claude') warn.push('Официально в России недоступен. Совет для тех, у кого есть законный доступ.');
    if (st.task === 'calc') warn.push('Включите режим рассуждения и пересчитайте итог сами.');
    if (st.task === 'fresh' || st.task === 'research') warn.push('Открывайте ссылки из ответа: пересказ бывает неточным.');
    if (st.task === 'scan') warn.push('Цифры с фото сверяйте с оригиналом — на плохом снимке модель угадывает.');
    return { main: main, alt: alt, why: (WHY[main][st.task] || WHY[main].def), warn: warn };
  }
  function renderPick() {
    Object.keys(Q).forEach(function (k) {
      var box = document.querySelector('[data-q="' + k + '"]');
      box.innerHTML = Q[k].map(function (o) {
        return '<button type="button" class="chip-btn" aria-pressed="' + (st[k] === o[0]) + '" data-v="' + o[0] + '">' + esc(o[1]) + '</button>';
      }).join('');
      box.onclick = function (e) {
        var b = e.target.closest('[data-v]'); if (!b) return;
        st[k] = b.getAttribute('data-v'); renderPick();
      };
    });
    var r = recommend();
    var tour = LOGO_IDS.indexOf(r.main) >= 0;
    $('pick-out').innerHTML =
      '<span class="po-k">Берите</span>' +
      '<div class="po-head">' + logo(r.main, 'lg') + '<b class="po-name">' + esc(NAMES[r.main]) + '</b></div>' +
      (TAGS[r.main] ? tagsHTML(TAGS[r.main], 4) : '') +
      '<p class="po-why">' + (r.main === 'none' ? '' : 'Почему: ') + esc(r.why) + '.</p>' +
      (r.alt ? '<p class="po-alt">' + logo(r.alt, 'sm') + '<span>Запасной вариант — <b>' + esc(NAMES[r.alt]) + '</b>: ' + esc(WHY[r.alt][st.task] || WHY[r.alt].def) + '.</span></p>' : '') +
      (r.warn.length ? '<ul class="po-warn">' + r.warn.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' : '') +
      (tour ? '<a class="btn sm" href="#tour" data-open-tour="' + r.main + '">Открыть тур по ' + esc(NAMES[r.main]) + ' →</a>' : '');
    var a = $('pick-out').querySelector('[data-open-tour]');
    if (a) a.onclick = function () { openTour(a.getAttribute('data-open-tour')); };
  }

  /* ---------- 2. Тур по кнопкам ---------- */
  // Части схемы окна: где стоит кнопка. Текст кнопки и пояснение приходят с сервера.
  var PARTS = ['history', 'projects', 'model', 'attach', 'think', 'search', 'tools', 'canvas', 'privacy'];   // порядок обхода — как читается окно
  var TOOLS = [], cur = null, curPart = null;

  function lvl(l) { return '<i class="lvl ' + (l || 'warn') + '" aria-hidden="true"></i>'; }
  function factsHTML(t) {
    var f = t.facts || {};
    return '<dl class="facts">' +
      '<div><dt>Доступ из России</dt><dd>' + lvl(f.accessLevel) + esc(f.access) + '</dd></div>' +
      '<div><dt>Где данные</dt><dd>' + esc(f.data) + '</dd></div>' +
      '<div><dt>Учится на ваших чатах</dt><dd>' + esc(f.training) + '</dd></div>' +
      '<div><dt>Цена</dt><dd>' + esc(f.price) + '</dd></div></dl>' +
      '<p class="best"><span>Сильные стороны:</span> ' + (t.best || []).map(esc).join(' · ') + '</p>';
  }
  function hs(t, part, n) {
    var p = t.parts[part];
    return '<button type="button" class="hs hs-' + part + (curPart === part ? ' on' : '') + '" data-part="' + part + '">' +
      '<i>' + n + '</i>' + esc(p.label) + '</button>';
  }
  function mockHTML(t) {
    var order = PARTS.filter(function (p) { return t.parts && t.parts[p]; });
    var num = {}; order.forEach(function (p, i) { num[p] = i + 1; });
    var H = function (p) { return t.parts[p] ? hs(t, p, num[p]) : ''; };
    return '<div class="mock' + (t.parts.canvas ? ' has-canvas' : '') + '">' +
      '<div class="m-top">' + logo(t.id, 'sm') + '<span class="m-name">' + esc(t.name) + '</span>' + H('model') + '<span class="m-sp"></span>' + H('privacy') + '</div>' +
      '<div class="m-side">' + H('history') + H('projects') + '<i class="m-line"></i><i class="m-line s"></i><i class="m-line"></i></div>' +
      '<div class="m-chat"><div class="m-msg me">Сравни два варианта графика отпусков…</div><div class="m-msg"><i class="m-line"></i><i class="m-line"></i><i class="m-line s"></i></div></div>' +
      (t.parts.canvas ? '<div class="m-canvas">' + H('canvas') + '<i class="m-line"></i><i class="m-line"></i><i class="m-line s"></i><i class="m-line"></i></div>' : '') +
      '<div class="m-input">' + H('attach') + '<span class="m-ph">Напишите задачу…</span>' + H('think') + H('search') + H('tools') + '<span class="m-send" aria-hidden="true">↑</span></div>' +
      '</div>';
  }
  function partCard(t) {
    var order = PARTS.filter(function (p) { return t.parts && t.parts[p]; });
    if (!curPart) {
      return '<div class="pc-empty"><b>Нажмите на кружок с цифрой</b><p>Или пройдите по порядку — так быстрее всего запомнить, где что.</p>' +
        '<button class="btn sm" type="button" data-step="0">Начать с первой кнопки →</button></div>';
    }
    var i = order.indexOf(curPart), p = t.parts[curPart];
    return '<span class="pc-n">' + (i + 1) + ' из ' + order.length + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' +
      '<div class="pc-nav">' + (i > 0 ? '<button class="btn sm ghost" type="button" data-step="' + (i - 1) + '">← Назад</button>' : '') +
      (i < order.length - 1 ? '<button class="btn sm" type="button" data-step="' + (i + 1) + '">Дальше →</button>'
                            : '<a class="btn sm" href="#try-' + t.id + '">К готовым запросам ↓</a>') + '</div>';
  }
  function renderTour() {
    $('tour-tabs').innerHTML = TOOLS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (cur && cur.id === t.id) + '" data-tool="' + t.id + '">' +
        logo(t.id, 'sm') + esc(t.name) + (t.locked ? ' <span class="lock" aria-label="закрыто">🔒</span>' : '') +
        (t.sample ? ' <span class="free">пример</span>' : '') + '</button>';
    }).join('');
    $('tour-tabs').onclick = function (e) { var b = e.target.closest('[data-tool]'); if (b) openTour(b.getAttribute('data-tool')); };
    var t = cur; if (!t) return;
    var head = '<div class="tour-head">' + logo(t.id, 'lg') + '<div><h3>' + esc(t.name) + '</h3><p class="mut">' + esc(t.maker) + ' · ' + esc(t.url) + '</p>' +
      tagsHTML(t.tags || TAGS[t.id]) + '</div></div>';
    if (t.locked) {
      $('tour-body').innerHTML = head + '<div class="tour-grid"><div class="locked-mock">' +
        '<div class="lm-in">' + logo(t.id, 'lg') + '<b>Тур по ' + esc(t.name) + ' — в курсе</b><p>Схема окна с пояснением каждой кнопки, <b>4 секретных слова</b>, первые шаги, готовые запросы и два занятия с заданиями. Пример — тур по DeepSeek, он открыт.</p>' +
        (t.course ? '<a class="btn" href="pay.html?course=' + esc(t.course.id) + '">Курс «' + esc(t.course.title) + '» — ' + Number(t.course.price).toLocaleString('ru-RU') + ' ₽</a>' : '') +
        '<a class="btn ghost" href="pay.html?course=ai-work">Все нейросети + разбор — 2 490 ₽</a>' +
        (LOGGED ? '' : '<a class="link" href="account.html?next=tools.html%23tour">Я уже купил — войти</a>') + '</div></div>' +
        '<div class="tour-side">' + factsHTML(t) + '</div></div>';
      return;
    }
    $('tour-body').innerHTML = head +
      '<div class="tour-grid"><div>' + mockHTML(t) + '</div><div class="tour-side"><div class="part-card" id="part-card">' + partCard(t) + '</div>' + factsHTML(t) + '</div></div>' +
      ((t.secrets || []).length ? '<div class="secrets" id="secrets-' + t.id + '"><div class="sw-head"><h4>Секретные слова</h4><p>Фразы, которые заметно улучшают ответ ' + esc(t.name) +
        '. Нажмите на карточку — фраза скопируется.</p></div><div class="sw-grid">' + t.secrets.map(function (x, i) {
          return '<button type="button" class="sw" data-secret="' + i + '"><b>«' + esc(x.word) + '»</b><span>' + esc(x.why) + '</span><i>Скопировать</i></button>';
        }).join('') + '</div></div>' : '') +
      '<div class="tour-low" id="try-' + t.id + '"><div class="start"><h4>Первые шаги</h4><ol>' + (t.start || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="prompts"><h4>Готовые запросы</h4>' + (t.prompts || []).map(function (p, i) {
        return '<div class="pr"><div class="pr-h"><b>' + esc(p.title) + '</b><button class="btn sm ghost" type="button" data-copy="' + i + '">Скопировать</button></div><pre>' + esc(p.text) + '</pre></div>';
      }).join('') + '</div></div>';
    var body = $('tour-body');
    body.onclick = function (e) {
      var order = PARTS.filter(function (p) { return t.parts[p]; });
      var h = e.target.closest('[data-part]'), s = e.target.closest('[data-step]'), c = e.target.closest('[data-copy]');
      var sw = e.target.closest('[data-secret]');
      if (sw) { copy(t.secrets[+sw.getAttribute('data-secret')].word, sw.querySelector('i')); return; }
      if (h) { curPart = h.getAttribute('data-part'); renderTour(); }
      else if (s) { curPart = order[+s.getAttribute('data-step')]; renderTour(); }
      else if (c) copy(t.prompts[+c.getAttribute('data-copy')].text, c);
    };
  }
  function openTour(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) { cur = TOOLS[i]; curPart = null; }
    renderTour();
  }
  var LOGGED = false;
  function loadTour() {
    if (!R.hasApi || !R.hasApi()) {
      $('tour-body').innerHTML = '<p class="mut">Тур загружается с сервера. Сервер ещё не подключён — откройте страницу позже.</p>';
      return;
    }
    R.api('/api/practice').then(function (r) {
      var d = r.data;
      if (!d || !d.ok) { $('tour-body').innerHTML = '<p class="mut">' + esc((d && d.error) || 'Не получилось загрузить тур.') + '</p>'; return; }
      TOOLS = d.tools; LOGGED = d.loggedIn;
      var want = (location.hash.match(/^#tour-(\w+)/) || [])[1];
      openTour(want || TOOLS[0].id);
    });
  }

  /* ---------- 3. Светофор ---------- */
  var LIGHT = [
    { t: 'Перепиши вежливее: «Напоминаем, что отчёт нужно сдать до пятницы».', a: 'ok',
      why: 'Обычная деловая фраза, ничьих данных нет.' },
    { t: 'Сверь акт: ООО «Ромашка», ИНН 7701234567, долг 1 245 000 ₽ по договору № 45 от 12.03.', a: 'fix',
      why: 'Название, ИНН и сумма по конкретному договору выдают контрагента.', fix: 'Сверь акт: Компания А, долг Сумма X по Договору 1.' },
    { t: 'Резюме кандидата: Иванов Иван Петрович, телефон, адрес, паспортные данные — составь характеристику.', a: 'no',
      why: 'Персональные данные целиком. В нейросеть — нельзя: уберите ФИО, телефон, адрес и паспорт, оставьте только опыт и навыки.' },
    { t: 'Объясни простыми словами, чем УСН 6% отличается от УСН 15%.', a: 'ok',
      why: 'Общий вопрос без данных. Ответ про налоги всё равно сверьте с первоисточником.' },
    { t: 'Вот медицинская справка сотрудника — посчитай, сколько дней больничного оплатить.', a: 'no',
      why: 'Сведения о здоровье — особая категория персональных данных. Только без справки: дни и даты отдельно.' },
    { t: 'Таблица продаж по регионам за квартал, без названий клиентов. Найди, где просели.', a: 'ok',
      why: 'Данные обезличены. Если сами цифры — коммерческая тайна компании, спросите руководителя.' },
    { t: 'Не входит в 1С. Логин buh2, пароль Qwerty2026 — что не так?', a: 'no',
      why: 'Пароли не отправляют никому и никуда. Опишите ошибку без пароля.' },
    { t: 'Напиши клиентке Петровой Анне, что поставка задерживается на три дня.', a: 'fix',
      why: 'Для письма фамилия модели не нужна.', fix: 'Напиши клиентке, что поставка задерживается на три дня. Обращение — по имени.' }
  ];
  var LV = { ok: 'Можно', fix: 'Убрать данные', no: 'Нельзя' };
  var answers = {};
  function renderLight() {
    $('light-grid').innerHTML = LIGHT.map(function (c, i) {
      var a = answers[i];
      return '<article class="lc' + (a ? ' done ' + (a === c.a ? 'right' : 'wrong') : '') + '">' +
        '<p class="lc-t">«' + esc(c.t) + '»</p>' +
        (a ? '<p class="lc-r"><b>' + (a === c.a ? 'Верно' : 'Правильно: ' + LV[c.a]) + '.</b> ' + esc(c.why) + '</p>' +
             (c.fix ? '<p class="lc-fix"><span>Так можно:</span> ' + esc(c.fix) + '</p>' : '')
           : '<div class="lc-b">' + ['ok', 'fix', 'no'].map(function (k) {
               return '<button type="button" class="lb ' + k + '" data-i="' + i + '" data-a="' + k + '">' + LV[k] + '</button>';
             }).join('') + '</div>') +
        '</article>';
    }).join('');
    var n = Object.keys(answers).length, ok = 0;
    Object.keys(answers).forEach(function (i) { if (answers[i] === LIGHT[i].a) ok++; });
    $('light-score').innerHTML = n ? '<b>' + ok + ' из ' + n + '</b> верно' + (n === LIGHT.length ? ' · <button type="button" class="link" id="light-reset">пройти ещё раз</button>' : '') : '';
    var r = $('light-reset'); if (r) r.onclick = function () { answers = {}; renderLight(); };
  }
  $('light-grid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    answers[b.getAttribute('data-i')] = b.getAttribute('data-a'); renderLight();
  });

  /* ---------- 4. Конструктор запроса ---------- */
  var SUSPECT = [
    [/\b\d{10}\b|\b\d{12}\b/, 'число из 10 или 12 цифр — похоже на ИНН'],
    [/(\+7|\b8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/, 'похоже на номер телефона'],
    [/[\w.+-]+@[\w-]+\.[\w.]+/, 'адрес электронной почты'],
    [/\b\d{4}\s?\d{6}\b/, 'похоже на серию и номер паспорта'],
    [/\b\d{20}\b/, '20 цифр — похоже на номер счёта'],
    [/[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(вич|вна|ична)\b/, 'фамилия, имя и отчество']
  ];
  function renderBuild() {
    var f = $('build-form'), v = function (n) { return f.elements[n].value.trim(); };
    var think = $('b-think').checked;
    var lines = [];
    if (v('role')) lines.push('Ты — ' + v('role') + '.');
    lines.push('Задача: ' + (v('task') || '[что сделать — одним предложением]') + '.');
    if (v('data')) lines.push('Данные:\n' + v('data'));
    lines.push('Формат ответа: ' + (v('format') || '[таблица, список или письмо — и какие в нём части]') + '.');
    if (v('check')) lines.push('Проверка: ' + v('check') + '.');
    if (!think) lines.push('Если данных не хватает — задай уточняющий вопрос, не додумывай.');
    $('build-prompt').textContent = lines.join('\n\n').replace(/\.\./g, '.');
    var tips = think
      ? ['Все условия — в этом одном сообщении: в режиме рассуждения так работает лучше.',
         'Не пишите «думай по шагам» — модель и так рассуждает.',
         'Примеры «вход → выход» добавляйте, только если без них не выходит: рассуждающей модели они иногда мешают.',
         'Читайте ход рассуждения — там видно, из чего модель исходила.']
      : ['Если формат важен, добавьте один пример хорошего ответа.',
         'Длинную задачу можно уточнять следующими сообщениями.',
         'Цифры и ссылки из ответа проверяйте сами — это ваша работа.'];
    $('build-tips').innerHTML = tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    var data = v('data') + ' ' + v('task'), found = [];
    SUSPECT.forEach(function (s) { if (s[0].test(data)) found.push(s[1]); });
    var w = $('build-warn');
    w.hidden = !found.length;
    w.innerHTML = found.length ? '<b>Стоп: в данных есть то, что лучше убрать.</b> ' + esc(found.join('; ')) + '. Замените на метки — «Клиент А», «[телефон]».' : '';
  }
  $('build-form').addEventListener('input', renderBuild);
  $('build-copy').onclick = function () { copy($('build-prompt').textContent, $('build-copy')); };

  /* ---------- 5. Тест ---------- */
  var QUIZ = [
    { q: 'В каком режиме не нужно писать «думай по шагам»?', o: ['В обычном', 'В режиме рассуждения (DeepThink, Thinking)', 'Писать нужно всегда'], a: 1,
      e: 'В режиме рассуждения модель и так думает по шагам — просьба ничего не добавит.' },
    { q: 'Где по своей политике DeepSeek хранит данные?', o: ['В России', 'В Китае', 'В Евросоюзе'], a: 1,
      e: 'В Китае, и учит модели на переписке. Поэтому — только обезличенные тексты.' },
    { q: 'Таблица с паспортными данными клиентов. Куда её можно отдать?', o: ['DeepSeek', 'Gemini', 'Никуда, пока не обезличу'], a: 2,
      e: 'Персональные данные не уходят ни в одну нейросеть. Сначала замените их метками — потом выбирайте модель.' },
    { q: 'Как быстрее всего проверить выписку из длинного документа?', o: ['Спросить «ты уверен?»', 'Попросить номер пункта и цитату к каждой строке', 'Попросить ответить ещё раз'], a: 1,
      e: 'С номером пункта и цитатой любую строку видно за секунды, а выдумку — сразу: такой цитаты в документе нет.' },
    { q: 'Gemini и Claude в России…', o: ['официально недоступны', 'работают как обычно', 'запрещены законом для пользователей'], a: 0,
      e: 'Сервисы сами не обслуживают Россию. Обходные пути мы не советуем: урок пригодится, если у вас есть законный доступ.' },
    { q: 'Где в Claude хранить постоянную инструкцию и файлы для повторяющейся работы?', o: ['В артефакте', 'В проекте', 'В истории чатов'], a: 1,
      e: 'Проект: инструкция и файлы общие для всех чатов внутри. В Gemini то же самое — Gem.' }
  ];
  var qa = {};
  function renderQuiz() {
    var done = Object.keys(qa).length, right = 0;
    Object.keys(qa).forEach(function (i) { if (qa[i] === QUIZ[i].a) right++; });
    $('quiz-box').innerHTML = QUIZ.map(function (x, i) {
      var a = qa[i];
      return '<div class="qq' + (a != null ? ' done' : '') + '"><p class="qq-q"><span>' + (i + 1) + '</span>' + esc(x.q) + '</p><div class="qq-o">' +
        x.o.map(function (o, j) {
          var cls = a == null ? '' : (j === x.a ? ' right' : (j === a ? ' wrong' : ''));
          return '<button type="button" class="qo' + cls + '" data-q="' + i + '" data-o="' + j + '"' + (a != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
        }).join('') + '</div>' + (a != null ? '<p class="qq-e">' + esc(x.e) + '</p>' : '') + '</div>';
    }).join('') +
      (done === QUIZ.length ? '<div class="qq-res"><b>' + right + ' из ' + QUIZ.length + '</b> ' +
        (right === QUIZ.length ? '— отлично, вы готовы работать с нейросетями безопасно.' : '— перечитайте объяснения к ошибкам, они короткие.') +
        ' <button type="button" class="link" id="quiz-reset">Пройти ещё раз</button><a class="btn sm" href="#chat" style="margin-left:12px">Теперь — в чат с ИИ →</a></div>' : '');
    var r = $('quiz-reset'); if (r) r.onclick = function () { qa = {}; renderQuiz(); };
  }
  $('quiz-box').addEventListener('click', function (e) {
    var b = e.target.closest('[data-o]'); if (!b || b.disabled) return;
    qa[b.getAttribute('data-q')] = +b.getAttribute('data-o'); renderQuiz();
  });

  /* ---------- Знакомьтесь: кто есть кто ---------- */
  var MEET = [
    { id: 'deepseek', name: 'DeepSeek', who: 'DeepSeek, Китай', what: 'Рассуждает по шагам, считает, ищет свежее', acc: 'warn', accT: 'в России — с перебоями' },
    { id: 'qwen', name: 'Qwen', who: 'Alibaba, Китай', what: 'Читает длинные документы, фото и сканы', acc: 'warn', accT: 'в России — с перебоями' },
    { id: 'gemini', name: 'Gemini', who: 'Google, США', what: 'Исследует тему со ссылками, свои помощники', acc: 'no', accT: 'в России официально недоступен' },
    { id: 'claude', name: 'Claude', who: 'Anthropic, США', what: 'Длинные тексты, проекты с инструкцией', acc: 'no', accT: 'в России официально недоступен' }
  ];
  var meet = $('meet');
  if (meet) {
    meet.innerHTML = MEET.map(function (m) {
      return '<button type="button" class="meet-c" data-meet="' + m.id + '">' + logo(m.id, 'lg') +
        '<b>' + esc(m.name) + '</b><span class="meet-who">' + esc(m.who) + '</span>' +
        '<span class="meet-what">' + esc(m.what) + '</span>' + tagsHTML(TAGS[m.id], 4) +
        '<span class="meet-acc">' + lvl(m.acc) + esc(m.accT) + '</span><span class="meet-go">Тур и секретные слова →</span></button>';
    }).join('');
    meet.onclick = function (e) {
      var b = e.target.closest('[data-meet]'); if (!b) return;
      openTour(b.getAttribute('data-meet'));
      $('tour').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  /* ---------- 6. Чат с нейросетью ---------- */
  var CH = { models: [], model: '', msgs: [], left: null, busy: false, demo: false };
  var CHAT_LOGO = { gemma: 'gemma', deepseek: 'deepseek', qwen: 'qwen' };
  function chatLogo(m) {
    return CHAT_LOGO[m.logo] ? '<span class="ai-logo sm"><img src="assets/img/ai/' + CHAT_LOGO[m.logo] + '.svg" alt="" width="20" height="20"></span>'
                             : '<span class="ai-logo sm txt gc" aria-hidden="true">G</span>';
  }
  // ответ модели: экранируем, потом оживляем **жирный**, `код`, списки и абзацы
  function md(t) {
    var h = esc(t).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
    var out = [], list = null;
    h.split('\n').forEach(function (l) {
      var m = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/.exec(l);
      if (m) { if (!list) { list = []; } list.push('<li>' + m[1] + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      out.push(l.trim() ? '<p>' + l.replace(/^#+\s*/, '') + '</p>' : '');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  var STARTERS = ['Объясни, как поставить нейросети задачу, чтобы ответ был точным',
                  'Перепиши вежливее: «Напоминаем, что отчёт нужно сдать до пятницы»',
                  'Составь чек-лист, как проверить ответ нейросети на ошибки',
                  'Сравни УСН 6% и УСН 15% таблицей: кому что выгоднее'];
  function chatSave() { try { sessionStorage.setItem('uii-chat', JSON.stringify({ model: CH.model, msgs: CH.msgs.slice(-20) })); } catch (e) {} }
  function renderChat() {
    var cur = CH.models.filter(function (m) { return m.id === CH.model; })[0];
    $('chat-models').innerHTML = CH.models.map(function (m) {
      return '<button type="button" role="tab" class="cm' + (m.ready ? '' : ' off') + '" aria-selected="' + (m.id === CH.model) + '" data-cm="' + m.id + '"' + (m.ready ? '' : ' disabled') + '>' +
        chatLogo(m) + '<span><b>' + esc(m.name) + '</b><small>' + esc(m.ready ? m.maker : 'не подключена') + '</small></span>' +
        (m.free && m.ready ? '<i class="tag free">бесплатно</i>' : '') + '</button>';
    }).join('');
    if (!CH.msgs.length) {
      $('chat-log').innerHTML = '<div class="chat-empty">' + (cur ? chatLogo(cur) : '') + '<b>' + (cur ? esc(cur.name) : 'Нейросеть') + ' готова</b>' +
        '<p>Начните с примера или напишите свою задачу. Помните: задача, данные и формат ответа — в одном сообщении.</p>' +
        '<div class="chat-starters">' + STARTERS.map(function (x, i) { return '<button type="button" class="cs" data-st="' + i + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        (CH.demo ? '<p class="chat-demo">Демо-режим: ключ нейросети ещё не подключён, ответы — заготовки.</p>' : '') + '</div>';
    } else {
      $('chat-log').innerHTML = CH.msgs.map(function (m) {
        return '<div class="msg ' + m.role + (m.error ? ' err' : '') + '">' + (m.role === 'assistant' ? md(m.content) : '<p>' + esc(m.content).replace(/\n/g, '<br>') + '</p>') + '</div>';
      }).join('') + (CH.busy ? '<div class="msg assistant typing"><i></i><i></i><i></i></div>' : '');
      $('chat-log').scrollTop = $('chat-log').scrollHeight;
    }
    $('chat-left').textContent = CH.left == null ? '' : 'Осталось сегодня: ' + CH.left;
    $('chat-send').disabled = CH.busy || !cur || !cur.ready;
  }
  function suspect(text) {
    var found = [];
    SUSPECT.forEach(function (s) { if (s[0].test(text)) found.push(s[1]); });
    return found;
  }
  function chatSend(force) {
    var text = $('chat-text').value.trim();
    if (!text || CH.busy) return;
    var found = suspect(text);
    if (found.length && !force) {
      $('chat-warn').hidden = false;
      $('chat-warn').innerHTML = '<b>Похоже на персональные данные:</b> ' + esc(found.join('; ')) +
        '. Замените их метками — «Клиент А», «[телефон]». <button type="button" class="link" id="chat-force">Отправить как есть</button>';
      $('chat-force').onclick = function () { chatSend(true); };
      return;
    }
    $('chat-warn').hidden = true;
    CH.msgs.push({ role: 'user', content: text });
    $('chat-text').value = ''; autosize();
    CH.busy = true; renderChat(); chatSave();
    var send = CH.msgs.filter(function (m) { return !m.error; }).map(function (m) { return { role: m.role, content: m.content }; });
    R.api('/api/chat', { model: CH.model, messages: send }).then(function (r) {
      var d = r.data || {};
      CH.busy = false;
      if (d.left != null) CH.left = d.left;
      if (d.ok) CH.msgs.push({ role: 'assistant', content: d.reply });
      else CH.msgs.push({ role: 'assistant', content: d.error || 'Не получилось получить ответ. Попробуйте ещё раз.', error: true });
      renderChat(); chatSave();
    });
  }
  function autosize() { var t = $('chat-text'); t.style.height = 'auto'; t.style.height = Math.min(180, t.scrollHeight) + 'px'; }
  function initChat() {
    if (!$('chat-app')) return;
    try { var sv = JSON.parse(sessionStorage.getItem('uii-chat') || 'null'); if (sv) { CH.model = sv.model; CH.msgs = sv.msgs || []; } } catch (e) {}
    if (!R.hasApi || !R.hasApi()) {
      $('chat-log').innerHTML = '<div class="chat-empty"><b>Чат заработает, когда сайт подключат к серверу</b><p>Пока можно потренироваться в конструкторе запроса выше.</p></div>';
      $('chat-send').disabled = true; return;
    }
    R.api('/api/chat/models').then(function (r) {
      var d = r.data || {};
      CH.models = d.models || []; CH.left = d.left; CH.demo = !!d.demo;
      if (!CH.models.some(function (m) { return m.id === CH.model && m.ready; })) {
        var first = CH.models.filter(function (m) { return m.ready; })[0];
        CH.model = first ? first.id : (CH.models[0] || {}).id;
      }
      renderChat();
    });
    $('chat-models').onclick = function (e) {
      var b = e.target.closest('[data-cm]'); if (!b || b.disabled) return;
      if (b.getAttribute('data-cm') !== CH.model) { CH.model = b.getAttribute('data-cm'); CH.msgs = []; chatSave(); renderChat(); }
    };
    $('chat-log').onclick = function (e) {
      var b = e.target.closest('[data-st]'); if (!b) return;
      $('chat-text').value = STARTERS[+b.getAttribute('data-st')]; autosize(); $('chat-text').focus();
    };
    $('chat-form').onsubmit = function (e) { e.preventDefault(); chatSend(false); };
    $('chat-text').addEventListener('input', function () { autosize(); $('chat-warn').hidden = true; });
    $('chat-text').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(false); }
    });
    $('chat-clear').onclick = function () { CH.msgs = []; chatSave(); renderChat(); };
    // конструктор запроса → в чат
    var bs = $('build-send');
    if (bs) bs.onclick = function () {
      $('chat-text').value = $('build-prompt').textContent; autosize();
      setTimeout(function () { $('chat-text').focus(); }, 400);
    };
  }

  renderPick(); renderLight(); renderBuild(); renderQuiz(); loadTour(); initChat();
  window.addEventListener('hashchange', function () {
    var m = location.hash.match(/^#tour-(\w+)/); if (m && TOOLS.length) openTour(m[1]);
  });
})();
