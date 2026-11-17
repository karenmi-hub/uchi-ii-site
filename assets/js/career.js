/* ==========================================================================
   Учи ИИ — подбор профессии (career.html).
   Как у карьерных сервисов: отмечаете, что умеете и что нравится, — получаете
   ранжированный список профессий с объяснением, что уже есть и что предстоит.
   Правило проекта то же: ни одного числа без источника. Процент совпадения —
   наша арифметика по вашим ответам, а не прогноз; сроки — оценка при 6–8 часах
   учёбы в неделю. Пометка WEF ставится только там, где профессия есть в списках
   отчёта Future of Jobs 2025.
   ========================================================================== */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var SK = {
    doc: 'документы', tab: 'таблицы и расчёты', rep: 'отчётность', law: 'нормативка и право',
    cli: 'работа с клиентами', neg: 'переговоры', ctrl: 'контроль и сверка', det: 'внимание к деталям',
    plan: 'планирование', team: 'координация людей', txt: 'письменная речь', find: 'поиск информации',
    ana: 'анализ данных', sql: 'базы данных и SQL', viz: 'графики и дашборды', ai: 'ИИ-инструменты',
    auto: 'автоматизация процессов', sec: 'информационная безопасность', sale: 'продажи', risk: 'оценка рисков',
    code: 'программирование', des: 'дизайн и макеты', teach: 'обучение людей', mkt: 'маркетинг',
    pm: 'управление проектами', eng: 'английский язык', math: 'математика и статистика', tech: 'техника и настройка систем'
  };
  var SK_GROUPS = [
    ['Документы и порядок', ['doc', 'ctrl', 'det', 'law', 'rep', 'risk']],
    ['Цифры и данные', ['tab', 'ana', 'math', 'sql', 'viz']],
    ['Люди', ['cli', 'neg', 'sale', 'team', 'teach']],
    ['Тексты и идеи', ['txt', 'find', 'mkt', 'des', 'eng']],
    ['Организация', ['plan', 'pm', 'auto']],
    ['Техника', ['tech', 'code', 'sec', 'ai']]
  ];
  var LIKES = { ppl: 'Общаться с людьми', num: 'Разбираться в цифрах', txt: 'Писать и объяснять',
                tech: 'Копаться в технике и коде', ord: 'Наводить порядок, следить за правилами', cre: 'Придумывать и оформлять' };

  // Кем человек работает сейчас → какие навыки отметить за него (потом можно поправить)
  var FROM = [
    ['Бухгалтер', 'doc tab rep law ctrl det find'], ['Экономист', 'tab rep ana math plan det'], ['Финансист, казначей', 'tab rep ana risk ctrl law'],
    ['Секретарь, офис-менеджер', 'doc plan team txt cli det find'], ['Администратор', 'cli plan team doc ctrl'],
    ['Оператор ввода данных', 'doc tab det ctrl'], ['Банковский сотрудник', 'doc cli ctrl det law sale'],
    ['Юрист', 'doc law txt find neg risk det'], ['Помощник юриста', 'doc law txt det find plan'],
    ['Страховой специалист', 'doc law cli ctrl risk det'], ['Оператор колл-центра', 'cli sale neg txt'],
    ['Менеджер по продажам', 'cli sale neg plan txt'], ['Продавец-консультант', 'cli sale ctrl det'], ['Кассир', 'cli ctrl det sale'],
    ['Кладовщик, логист', 'doc tab ctrl det plan'], ['Специалист по закупкам', 'doc law neg ctrl plan tab'],
    ['Кадровик, HR', 'doc law cli neg txt plan'], ['Учитель, преподаватель', 'teach txt plan team find'],
    ['Воспитатель', 'teach team plan cli'], ['Врач', 'det risk cli find doc'], ['Медсестра, фельдшер', 'det ctrl cli doc'],
    ['Инженер', 'tech det plan math doc'], ['Инженер-сметчик', 'tab doc det math ctrl'], ['Технолог на производстве', 'tech ctrl det plan doc'],
    ['Мастер, прораб', 'team plan ctrl tech neg'], ['Водитель', 'det plan tech'], ['Рабочий на производстве', 'tech det ctrl'],
    ['Маркетолог', 'mkt txt ana find plan'], ['SMM-специалист, контент-менеджер', 'txt mkt des find plan'],
    ['Журналист, редактор', 'txt find det plan'], ['Переводчик', 'txt eng det find'], ['Графический дизайнер', 'des det cli plan'],
    ['Системный администратор', 'tech sec auto det find'], ['Специалист техподдержки', 'tech cli txt find det'],
    ['Руководитель отдела', 'team plan neg rep risk pm'], ['Предприниматель', 'sale neg plan team risk mkt'],
    ['Государственный служащий', 'doc law rep ctrl txt'], ['Риелтор', 'cli sale neg doc law'], ['Турагент', 'cli sale plan find'],
    ['Психолог', 'cli teach txt find'], ['Соцработник', 'cli doc plan team'], ['Студент, без опыта', 'find txt'], ['В декрете, возвращаюсь к работе', 'plan team det']
  ].map(function (x) { return { name: x[0], skills: x[1].split(' ') }; });

  // Куда можно перейти. m — месяцев до первой работы (наша оценка), need — что нужно уметь,
  // like — кому понравится, wef: fast — в топ-15 самых быстрорастущих (WEF FoJ 2025), abs — в топ-15 по приросту числа мест.
  var G = { data: 'Данные', ai: 'ИИ', it: 'ИТ', biz: 'Бизнес и люди', txt: 'Тексты и обучение' };
  function T(id, g, name, m, need, like, what, ai, wef, course) {
    return { id: id, g: g, name: name, m: m, need: need.split(' '), like: like.split(' '), what: what, ai: ai, wef: wef || '', course: course || '' };
  }
  var TO = [
    T('boost', 'ai', 'Ваша же профессия, усиленная ИИ', 1, 'ai auto det find', 'ord num txt ppl',
      'Остаётесь на своём месте, но рутину отдаёте нейросетям. Самый короткий и надёжный путь.', 'ИИ — главный инструмент: запросы, проверка ответов, свой помощник.', '', 'ai-work'),
    T('impl', 'ai', 'Специалист по внедрению ИИ в малом бизнесе', 3, 'ai auto plan cli neg doc find', 'ppl tech ord',
      'Находите в компании процессы, где ИИ экономит часы, и настраиваете их под заказ.', 'Работа целиком про ИИ: подобрать нейросеть, написать инструкции, обучить сотрудников.', '', 'ai-implementer'),
    T('aitrain', 'ai', 'AI-тренер, разметчик данных', 2, 'det txt find ctrl ai', 'ord txt',
      'Проверяете и оцениваете ответы нейросетей, размечаете данные для их обучения. Вход — самый простой, работа удалённая.', 'Вы буквально учите модели: пишете эталонные ответы и находите ошибки.'),
    T('content', 'txt', 'Контент-менеджер с ИИ', 3, 'txt mkt find ai plan det', 'txt cre',
      'Готовите тексты, карточки товаров, посты и рассылки — быстро, потому что черновики пишет нейросеть.', 'ИИ пишет черновики и картинки, вы отвечаете за смысл, факты и стиль.'),
    T('ana', 'data', 'Аналитик данных', 6, 'tab ana sql viz math det rep ai', 'num ord',
      'Отвечаете на вопросы бизнеса цифрами: выгружаете данные, считаете, показываете на графиках.', 'ИИ пишет запросы и формулы, вы ставите задачу и проверяете результат.', 'fast', 'data-analyst'),
    T('bi', 'data', 'BI-аналитик', 6, 'tab viz sql rep ana det', 'num cre ord',
      'Собираете дашборды, по которым руководители принимают решения.', 'ИИ помогает с запросами и подсказывает, как показать данные.'),
    T('ds', 'data', 'Специалист по данным (Data Scientist)', 12, 'math ana code sql viz eng', 'num tech',
      'Строите модели, которые предсказывают спрос, отток, риск. Нужны математика и программирование.', 'Вы сами обучаете модели машинного обучения.', 'fast', 'ml-advanced'),
    T('de', 'data', 'Инженер данных', 12, 'sql code tech auto det eng', 'tech ord',
      'Строите «трубы», по которым данные попадают из систем в хранилище.', 'ИИ ускоряет написание кода, но архитектуру продумываете вы.', 'fast'),
    T('ml', 'ai', 'ML-инженер', 12, 'code math ana tech eng ai', 'tech num',
      'Обучаете и запускаете в работу модели машинного обучения, в том числе языковые.', 'Это и есть профессия про ИИ изнутри.', 'fast', 'ml-advanced'),
    T('qa', 'it', 'Тестировщик', 5, 'det ctrl doc txt find tech', 'ord tech',
      'Ищете ошибки в сайтах и приложениях до того, как их найдут пользователи.', 'ИИ пишет тест-кейсы и автотесты, вы решаете, что проверять.'),
    T('py', 'it', 'Разработчик на Python', 10, 'code tech det find eng math', 'tech num',
      'Пишете программы: сервисы, ботов, автоматизацию.', 'ИИ пишет большую часть кода — ценится умение ставить задачу и проверять.', 'fast'),
    T('nocode', 'it', 'Автоматизатор процессов (no-code)', 4, 'auto plan doc tab ai det', 'tech ord',
      'Соединяете сервисы между собой без программирования: заявки, таблицы, уведомления, боты.', 'ИИ встраивается в цепочки: разбирает письма, заполняет таблицы.'),
    T('sa', 'it', 'Системный аналитик', 8, 'doc find txt neg ana sql det', 'ord txt tech',
      'Переводите пожелания бизнеса на язык разработчиков: описываете, как должна работать система.', 'ИИ помогает писать требования и схемы, вы отвечаете за их точность.'),
    T('ba', 'biz', 'Бизнес-аналитик', 7, 'ana doc neg tab rep find plan', 'num ppl ord',
      'Разбираетесь, как устроены процессы компании, и предлагаете, что улучшить.', 'ИИ собирает и обобщает материалы, выводы и переговоры — за вами.'),
    T('sup', 'it', 'Специалист техподдержки (2-я линия)', 3, 'tech cli txt find det', 'tech ppl',
      'Решаете технические вопросы клиентов, которые не решила первая линия.', 'ИИ подсказывает решения из базы знаний, сложные случаи разбираете вы.'),
    T('devops', 'it', 'DevOps-инженер', 12, 'tech code auto sec det eng', 'tech ord',
      'Отвечаете за то, чтобы сервисы работали и обновлялись без сбоев.', 'ИИ пишет скрипты и ищет причины сбоев по журналам.', 'fast'),
    T('soc', 'it', 'Аналитик информационной безопасности', 9, 'sec ctrl det find ana doc tech', 'ord tech',
      'Следите за атаками на компанию и разбираете инциденты.', 'ИИ сортирует тысячи событий, решение по инциденту принимает человек.', 'fast'),
    T('ux', 'it', 'UX/UI-дизайнер', 8, 'des find cli det txt', 'cre ppl',
      'Продумываете, как человеку будет удобно пользоваться сайтом или приложением.', 'ИИ рисует варианты макетов, вы выбираете и проверяете на людях.', 'fast'),
    T('prod', 'biz', 'Менеджер продукта', 10, 'ana plan neg team find mkt pm', 'ppl num cre',
      'Решаете, что и зачем делать в продукте, и ведёте команду к результату.', 'ИИ помогает с исследованиями и текстами, решения — ваши.'),
    T('pmgr', 'biz', 'Руководитель проектов', 6, 'pm plan team neg risk doc rep', 'ppl ord',
      'Ведёте проект от идеи до сдачи: сроки, люди, деньги, риски.', 'ИИ ведёт протоколы, планы и отчёты, с людьми договариваетесь вы.', 'abs'),
    T('comp', 'biz', 'Комплаенс и внутренний контроль', 9, 'law doc ctrl risk det rep txt', 'ord',
      'Следите, чтобы компания не нарушала законы и собственные правила.', 'ИИ ищет нарушения в документах, отвечает перед регулятором человек.'),
    T('proc', 'biz', 'Специалист по закупкам', 6, 'doc law neg ctrl plan tab risk', 'ord ppl num',
      'Выбираете поставщиков и заключаете контракты на лучших условиях.', 'ИИ сравнивает предложения и готовит документы.'),
    T('hr', 'biz', 'HR-специалист, рекрутер', 5, 'cli neg txt plan doc law find', 'ppl',
      'Ищете людей, проводите собеседования, помогаете новичкам освоиться.', 'ИИ разбирает резюме и пишет вакансии, решение о человеке — за вами.'),
    T('fin', 'biz', 'Финансовый аналитик', 8, 'tab ana rep math risk det', 'num ord',
      'Считаете, выгоден ли проект, и готовите прогнозы для руководства.', 'ИИ строит модели в таблицах, допущения проверяете вы.'),
    T('mp', 'biz', 'Менеджер маркетплейсов', 4, 'sale tab mkt ana txt plan', 'num cre',
      'Ведёте магазин на Wildberries или Ozon: карточки, цены, реклама, остатки.', 'ИИ пишет карточки и считает юнит-экономику.'),
    T('mkt', 'biz', 'Интернет-маркетолог', 6, 'mkt ana txt find plan sale', 'cre num',
      'Приводите клиентов из интернета: реклама, сайты, рассылки, аналитика.', 'ИИ готовит тексты и креативы, стратегия и цифры — на вас.'),
    T('cs', 'biz', 'Менеджер по сопровождению клиентов', 3, 'cli neg txt plan sale find', 'ppl',
      'Помогаете клиентам получить пользу от продукта, чтобы они оставались надолго.', 'ИИ готовит ответы и сводки по клиенту, отношения строите вы.'),
    T('method', 'txt', 'Методист онлайн-курсов', 5, 'teach txt plan find det', 'txt ppl cre',
      'Превращаете знания эксперта в понятный курс: программа, уроки, задания.', 'ИИ помогает со структурой, заданиями и тестами.'),
    T('techwr', 'txt', 'Технический писатель', 5, 'txt doc find det tech', 'txt ord',
      'Пишете инструкции и документацию так, чтобы их понимали.', 'ИИ пишет черновики, точность проверяете вы.'),
    T('med', 'biz', 'Медиатор, специалист по трудовым спорам', 12, 'law neg txt risk doc cli', 'ppl ord',
      'Помогаете сторонам конфликта договориться без суда.', 'ИИ готовит документы, доверие сторон — только к человеку.')
  ];
  var WEF = { fast: 'WEF Future of Jobs 2025: в топ-15 самых быстрорастущих профессий мира',
              abs: 'WEF Future of Jobs 2025: в топ-15 профессий с наибольшим приростом рабочих мест' };

  var st = { step: 1, from: '', have: {}, like: {}, time: 6, group: '', sort: 'fit' };
  try { var sv = JSON.parse(localStorage.getItem('uii-career') || 'null'); if (sv) { st.from = sv.from || ''; st.have = sv.have || {}; st.like = sv.like || {}; st.time = sv.time || 6; } } catch (e) {}
  function save() { try { localStorage.setItem('uii-career', JSON.stringify({ from: st.from, have: st.have, like: st.like, time: st.time })); } catch (e) {} }

  function score(t) {
    var have = t.need.filter(function (k) { return st.have[k]; });
    var skill = have.length / t.need.length;
    var likes = Object.keys(st.like).filter(function (k) { return st.like[k]; });
    var like = likes.length ? t.like.filter(function (k) { return st.like[k]; }).length / Math.min(t.like.length, likes.length) : .5;
    var time = t.m <= st.time ? 1 : Math.max(0, 1 - (t.m - st.time) / 9);
    return { fit: Math.round((skill * .6 + Math.min(1, like) * .25 + time * .15) * 100), have: have,
             miss: t.need.filter(function (k) { return !st.have[k]; }), late: t.m > st.time };
  }

  /* ---------- шаги ---------- */
  function go(n) {
    st.step = n;
    [1, 2, 3, 4].forEach(function (i) { $('cs' + i).hidden = i !== n; });
    Array.prototype.forEach.call(document.querySelectorAll('.cr-steps li'), function (li, i) {
      li.className = i + 1 === n ? 'on' : (i + 1 < n ? 'done' : '');
    });
    if (n === 4) renderResults();
    $('career').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderFrom() {
    var q = $('cr-q').value.trim().toLowerCase();
    var list = FROM.filter(function (f) { return !q || f.name.toLowerCase().indexOf(q) >= 0; }).slice(0, q ? 12 : 14);
    $('cr-from').innerHTML = list.map(function (f) {
      return '<button type="button" class="chip-btn" aria-pressed="' + (st.from === f.name) + '" data-from="' + esc(f.name) + '">' + esc(f.name) + '</button>';
    }).join('') || '<p class="mut">Такой профессии в списке нет — не страшно. Нажмите «Дальше» и отметьте навыки сами.</p>';
  }
  function renderSkills() {
    $('cr-skills').innerHTML = SK_GROUPS.map(function (g) {
      return '<div class="cr-g"><b>' + g[0] + '</b><div class="chips">' + g[1].map(function (k) {
        return '<button type="button" class="chip-btn" aria-pressed="' + !!st.have[k] + '" data-sk="' + k + '">' + esc(SK[k]) + '</button>';
      }).join('') + '</div></div>';
    }).join('');
    var n = Object.keys(st.have).filter(function (k) { return st.have[k]; }).length;
    $('cr-skn').textContent = n ? 'Отмечено: ' + n : 'Отметьте хотя бы три';
    $('cr-n2').disabled = n < 3;
  }
  function renderLikes() {
    $('cr-likes').innerHTML = Object.keys(LIKES).map(function (k) {
      return '<button type="button" class="chip-btn" aria-pressed="' + !!st.like[k] + '" data-like="' + k + '">' + LIKES[k] + '</button>';
    }).join('');
    $('cr-time').innerHTML = [[3, 'до 3 месяцев'], [6, 'до полугода'], [9, 'до 9 месяцев'], [12, 'год и больше']].map(function (x) {
      return '<button type="button" class="chip-btn" aria-pressed="' + (st.time === x[0]) + '" data-time="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
  }
  function card(t, r, top) {
    return '<article class="cr-card' + (top ? ' top' : '') + '">' +
      '<div class="cr-fit" style="--p:' + r.fit + '"><b>' + r.fit + '%</b><span>совпадение</span></div>' +
      '<div class="cr-main"><div class="cr-h"><h3>' + esc(t.name) + '</h3><span class="tag">' + G[t.g] + '</span>' +
        '<span class="tag' + (r.late ? ' warn' : '') + '">' + (t.m >= 12 ? 'от года' : '≈ ' + t.m + ' мес.') + '</span></div>' +
      '<p>' + esc(t.what) + '</p>' +
      '<div class="cr-sk"><div><span>Уже есть ' + r.have.length + ' из ' + t.need.length + '</span>' + (r.have.map(function (k) { return '<i class="ok">' + esc(SK[k]) + '</i>'; }).join('') || '<i>пока ничего — начнёте с нуля</i>') + '</div>' +
        (r.miss.length ? '<div><span>Предстоит освоить</span>' + r.miss.map(function (k) { return '<i>' + esc(SK[k]) + '</i>'; }).join('') + '</div>' : '') + '</div>' +
      '<p class="cr-ai"><b>Где здесь ИИ.</b> ' + esc(t.ai) + '</p>' +
      (t.wef ? '<p class="cr-wef">' + WEF[t.wef] + '</p>' : '') +
      '<div class="cr-act">' + (t.course === 'ai-work' ? '<a class="btn sm" href="courses.html#use">Курс «ИИ в вашей работе»</a>'
        : t.course === 'ml-advanced' ? '<a class="btn sm" href="ml.html">Курс «ML для продвинутых» — бесплатно</a>'
        : '<a class="btn sm" href="courses.html#career">Курсы и лист ожидания</a>') +
        '<a class="btn sm ghost" href="#support" data-support="form" data-kind="question">Спросить про этот путь</a></div></div></article>';
  }
  function renderResults() {
    var rows = TO.map(function (t) { return { t: t, r: score(t) }; })
      .filter(function (x) { return !st.group || x.t.g === st.group; });
    rows.sort(st.sort === 'time' ? function (a, b) { return a.t.m - b.t.m || b.r.fit - a.r.fit; } : function (a, b) { return b.r.fit - a.r.fit || a.t.m - b.t.m; });
    $('cr-filters').innerHTML = '<button type="button" class="chip-btn" aria-pressed="' + !st.group + '" data-g="">Все · ' + TO.length + '</button>' +
      Object.keys(G).map(function (g) { return '<button type="button" class="chip-btn" aria-pressed="' + (st.group === g) + '" data-g="' + g + '">' + G[g] + '</button>'; }).join('') +
      '<span class="cr-sort">Сначала: <button type="button" class="link' + (st.sort === 'fit' ? ' on' : '') + '" data-sort="fit">подходящие</button> · <button type="button" class="link' + (st.sort === 'time' ? ' on' : '') + '" data-sort="time">быстрые</button></span>';
    $('cr-list').innerHTML = rows.map(function (x, i) { return card(x.t, x.r, i < 3 && st.sort === 'fit' && !st.group); }).join('');
    $('cr-sum').textContent = (st.from ? st.from + ' · ' : '') + 'навыков: ' + Object.keys(st.have).filter(function (k) { return st.have[k]; }).length +
      ' · срок: ' + (st.time >= 12 ? 'год и больше' : 'до ' + st.time + ' мес.');
  }

  /* ---------- события ---------- */
  $('cr-q').addEventListener('input', renderFrom);
  $('cr-from').addEventListener('click', function (e) {
    var b = e.target.closest('[data-from]'); if (!b) return;
    var f = FROM.filter(function (x) { return x.name === b.getAttribute('data-from'); })[0];
    st.from = st.from === f.name ? '' : f.name;
    if (st.from) { st.have = {}; f.skills.forEach(function (k) { st.have[k] = true; }); }
    save(); renderFrom();
  });
  $('cr-skills').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sk]'); if (!b) return;
    var k = b.getAttribute('data-sk'); st.have[k] = !st.have[k]; save(); renderSkills();
  });
  $('cs3').addEventListener('click', function (e) {
    var l = e.target.closest('[data-like]'), t = e.target.closest('[data-time]');
    if (l) { var k = l.getAttribute('data-like'); st.like[k] = !st.like[k]; }
    if (t) st.time = +t.getAttribute('data-time');
    if (l || t) { save(); renderLikes(); }
  });
  $('cs4').addEventListener('click', function (e) {
    var g = e.target.closest('[data-g]'), s = e.target.closest('[data-sort]');
    if (g) st.group = g.getAttribute('data-g');
    if (s) st.sort = s.getAttribute('data-sort');
    if (g || s) renderResults();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b) return;
    var n = +b.getAttribute('data-go');
    if (n === 2) renderSkills();
    if (n === 3) renderLikes();
    go(n);
  });

  $('cr-count').textContent = TO.length;
  renderFrom(); renderSkills(); renderLikes();
})();
