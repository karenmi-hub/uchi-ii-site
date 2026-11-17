/* ==========================================================================
   Учи ИИ — общий скрипт сайта.
   Шапка, бургер-меню, подвал, параллакс, появление блоков, панель помощи
   и обратной связи. Подключается на каждой странице ПОСЛЕ config.js.

   Меню правится здесь, в массиве NAV (группы и пункты). Ссылки в подвале — в FOOTER.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.RAZVILKA || {};
  var API = (C.API_URL || '').replace(/\/+$/, '');
  // Локальная проверка: bot.py с LOCAL_DEV=1 сам раздаёт сайт на :8080 — сервер там же
  if (!API && /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && location.port === '8080') API = location.origin;
  var doc = document, root = doc.documentElement, body = doc.body;
  var PAGE = body.getAttribute('data-page') || '';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('no-js');

  // Меню: группы с выпадающими панелями. pages — на каких страницах группа подсвечена.
  // i — иконка (символ), d — пояснение одной строкой.
  var NAV = [
    { t: 'Обучение', pages: ['trial', 'courses', 'program', 'ml', 'pay'], items: [
      { href: 'trial.html',          i: '✦', t: 'Пробный курс',        d: 'Бесплатно · 5 уроков по 5 минут', tag: 'бесплатно' },
      { href: 'courses.html#ai',     i: '◎', t: 'Курсы по нейросетям', d: 'DeepSeek, Qwen, Gemini, Claude' },
      { href: 'courses.html#use',    i: '▲', t: 'ИИ в вашей работе',   d: 'Большой курс с разбором работ' },
      { href: 'ml.html',             i: '{}', t: 'ML для продвинутых', d: 'Модели, датасеты, дообучение', tag: 'бесплатно' },
      { href: 'program.html',        i: '≡', t: 'Программа занятий',   d: 'Что внутри каждого курса' }
    ] },
    { t: 'Инструменты', pages: ['tools', 'career', 'index#start'], items: [
      { href: 'tools.html',          i: '◐', t: 'Тренажёр нейросетей', d: 'Тур по кнопкам, светофор данных, тест' },
      { href: 'tools.html#chat',     i: '✉', t: 'Чат с ИИ',            d: 'Попробуйте нейросеть прямо на сайте', tag: 'новое' },
      { href: 'career.html',         i: '⌖', t: 'Подбор профессии',    d: '30 направлений под ваши навыки' },
      { href: 'index.html#start',    i: '↗', t: 'Навигатор',           d: 'Что ИИ делает с вашей профессией' }
    ] },
    { t: 'Тарифы', href: 'pricing.html', pages: ['pricing'] },
    { t: 'Помощь', pages: ['faq', 'support', 'about'], items: [
      { href: 'faq.html',            i: '?', t: 'Частые вопросы',      d: 'Оплата, возврат, данные' },
      { href: 'support.html',        i: '☏', t: 'Поддержка',           d: 'Ответим в течение дня' },
      { href: 'about.html',          i: 'i', t: 'О проекте',           d: 'Кто мы и откуда цифры' }
    ] }
  ];

  var FOOTER = [
    { h: 'Учиться', links: [
      ['trial.html', 'Пробный курс — бесплатно'],
      ['courses.html#use', 'Пользоваться ИИ в работе'],
      ['courses.html#career', 'Профессия, связанная с ИИ'],
      ['career.html', 'Подобрать профессию'],
      ['ml.html', 'ML для продвинутых — бесплатно'],
      ['index.html#start', 'Навигатор: что ИИ делает с профессией'],
      ['program.html', 'Программа занятий'],
      ['tools.html', 'Тренажёр: DeepSeek, Qwen, Gemini, Claude'],
      ['pricing.html', 'Тарифы']
    ]},
    { h: 'Помощь', links: [
      ['account.html', 'Личный кабинет'],
      ['about.html', 'О проекте'],
      ['faq.html', 'Частые вопросы'],
      ['support.html', 'Поддержка'],
      ['#support', 'Написать нам', 'support'],
      ['#complaint', 'Оставить жалобу', 'complaint']
    ]},
    { h: 'Документы', links: [
      ['offer.html', 'Публичная оферта'],
      ['privacy.html', 'Политика обработки данных'],
      ['LICENSES.md', 'Лицензии материалов'],
      ['#sources', 'Источники данных']
    ]}
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function botHref(start) {
    return C.BOT_URL ? C.BOT_URL + (start ? '?start=' + encodeURIComponent(start) : '') : '';
  }
  function tgHref() { return C.SUPPORT_TG ? 'https://t.me/' + C.SUPPORT_TG.replace(/^@/, '') : ''; }

  /* ---------- иконки ---------- */
  function logo() { return '<span class="mark" aria-hidden="true">У</span>'; }
  var BRAND = '<span>Учи ИИ<small>учимся работать с нейросетями</small></span>';
  var ICO = {
    tg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 8-6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c-2-1.5-5-2-8-1.6V19c3-.4 6 .1 8 1.6 2-1.5 5-2 8-1.6V5.4C17 5 14 5.5 12 7Z"/><path d="M12 7v13.6"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>'
  };

  /* Рисунки линией для параллакса. Вставляются в <div data-doodle="имя">. */
  var D = {
    leaf: '<path d="M60 116C58 90 62 60 60 8"/><path d="M60 92C45 87 35 74 33 60c15 2 25 14 27 32Z"/><path d="M60 92 38 64"/><path d="M60 76c15-5 25-17 27-30-14 2-24 14-27 30Z"/><path d="m60 76 22-26"/><path d="M60 56c-13-5-20-15-21-26 12 3 19 13 21 26Z"/><path d="M60 56 43 34"/><path d="M60 38c10-5 16-13 17-22-10 2-16 11-17 22Z"/><path d="m60 38 13-18"/>',
    sprig: '<path d="M14 108C40 86 66 58 106 22"/><path d="M36 88c-12-2-18-10-19-20 11 1 17 9 19 20Z"/><path d="M40 84c2-12 10-18 20-19-1 11-9 17-20 19Z"/><path d="M62 62c-12-2-18-10-19-20 11 1 17 9 19 20Z"/><path d="M66 58c2-12 10-18 20-19-1 11-9 17-20 19Z"/><path d="M88 40c-10-2-15-9-16-17 9 1 14 8 16 17Z"/>',
    fork: '<path d="M60 114V66"/><path d="M60 66c0-16-18-24-28-42"/><path d="M60 66c0-16 18-24 28-42"/><path d="m32 24 0 11M32 24l10 3"/><path d="m88 24 0 11M88 24l-10 3"/><path d="M52 100h16M54 86h12" stroke-dasharray="2 5"/>',
    bulb: '<path d="M60 20a24 24 0 0 1 14 43c-4 3-6 7-6 12H52c0-5-2-9-6-12a24 24 0 0 1 14-43Z"/><path d="M52 84h16M54 92h12"/><path d="M60 5v7M29 18l5 5M91 18l-5 5M20 44h7M100 44h-7"/><path d="M54 46c0-4 3-7 6-7"/>',
    book: '<path d="M60 40c-12-8-30-10-44-8v60c14-2 32 0 44 8 12-8 30-10 44-8V32c-14-2-32 0-44 8Z"/><path d="M60 40v60"/><path d="M26 46c10-1 18 0 26 4M26 58c10-1 18 0 26 4M26 70c10-1 18 0 26 4M68 50c8-4 16-5 26-4M68 62c8-4 16-5 26-4"/>',
    pencil: '<path d="m30 90 50-50 12 12-50 50Z"/><path d="m80 40 8-8 12 12-8 8"/><path d="m30 90-6 18 18-6"/><path d="m27 99 6 6"/>',
    spark: '<path d="M60 18c2 26 16 40 42 42-26 2-40 16-42 42-2-26-16-40-42-42 26-2 40-16 42-42Z"/>',
    loop: '<path d="M8 72c20-40 42-40 37-10-5 30 25 30 30 0s30-20 36-6"/>',
    cap: '<path d="M60 30 108 50 60 70 12 50Z"/><path d="M30 58v22c15 12 45 12 60 0V58"/><path d="M108 50v28"/><path d="m108 78-4 10h8Z"/>',
    brackets: '<path d="M40 20c-12 0-10 20-10 30 0 6-4 10-10 10 6 0 10 4 10 10 0 10-2 30 10 30M80 20c12 0 10 20 10 30 0 6 4 10 10 10-6 0-10 4-10 10 0 10 2 30-10 30"/><path d="M50 60h2M59 60h2M68 60h2"/>',
    arrow: '<path d="M14 92C40 40 80 30 106 50"/><path d="m106 50-12-2M106 50l-4 11"/>',
    check: '<path d="M22 64 48 90 100 30"/>'
  };
  function doodles(ctx) {
    $$('[data-doodle]', ctx).forEach(function (el) {
      var p = D[el.getAttribute('data-doodle')];
      if (!p || el.firstChild) return;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="' +
        (el.getAttribute('data-stroke') || '1.5') + '" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">' + p + '</svg>';
    });
  }
  window.RazvilkaDoodles = doodles;

  /* ==========================================================================
     Мячи: спокойная композиция. Несколько кругов разного масштаба стоят по
     краям экрана и медленно плывут по плавным траекториям. Слои слегка
     смещаются за курсором (ближние сильнее), а если подвести мышь к мячу,
     он мягко отходит и возвращается. Движения неторопливые — без суеты.
     x, y — центр в % от блока; s — диаметр, px; z — глубина 0…1 (1 — ближе);
     c — цвет: indigo, sun (жёлтый), soft (светлое индиго), deep (тёмное индиго).
     ========================================================================== */
  var small = window.matchMedia && matchMedia('(max-width: 760px)').matches;
  var BALLS = {
    hero: small ? [
      { c: 'indigo', x: 108, y: 2,  s: 150, z: .5 },
      { c: 'soft',   x: -6,  y: 99, s: 130, z: .4 },
      { c: 'sun',    x: 99,  y: 70, s: 26,  z: .9 }
    ] : [
      { c: 'indigo', x: 97, y: 18, s: 300, z: .5 },
      { c: 'soft',   x: 5,  y: 84,  s: 46,  z: .7 },
      { c: 'sun',    x: 64, y: 16, s: 84,  z: .9 }
    ],
    page: small ? [
      { c: 'indigo', x: 96, y: 62, s: 90, z: .5 },
      { c: 'sun',    x: 80, y: 20, s: 36, z: .9 }
    ] : [
      { c: 'indigo', x: 90, y: 48, s: 170, z: .5 },
      { c: 'sun',    x: 74, y: 76, s: 66,  z: .9 },
      { c: 'soft',   x: 68, y: 22, s: 34,  z: .7 },
      { c: 'deep',   x: 98, y: 10, s: 22,  z: 1 }
    ]
  };

  function initScenes() {
    var scenes = $$('[data-scene]');
    var balls = [];
    scenes.forEach(function (el) {
      var list = BALLS[el.getAttribute('data-scene') === 'hero' ? 'hero' : 'page'];
      var box = doc.createElement('div'); box.className = 'balls'; box.setAttribute('aria-hidden', 'true');
      list.forEach(function (o, i) {
        var b = doc.createElement('span'); b.className = 'ball c-' + o.c;
        b.style.cssText = 'width:' + o.s + 'px;height:' + o.s + 'px;left:calc(' + o.x + '% - ' + o.s / 2 + 'px);top:calc(' + o.y + '% - ' + o.s / 2 + 'px);' +
          'transition-delay:' + (i * .09).toFixed(2) + 's';
        box.appendChild(b);
        // своя плавная траектория: амплитуда меньше у крупных, периоды разные — мячи не синхронны
        var amp = 10 + 360 / (o.s + 40);
        balls.push({ el: b, o: o, ax: amp, ay: amp * .8, px: 11 + (i * 3.7) % 8, py: 13 + (i * 5.3) % 7,
                     fx: i * 1.9, fy: i * 2.7, rx: 0, ry: 0 });
      });
      el.insertBefore(box, el.firstChild);
      requestAnimationFrame(function () { box.classList.add('in'); });
    });
    if (!balls.length || reduceMotion) return;

    var gx = 0, gy = 0, tgx = 0, tgy = 0, mx = -1e4, my = -1e4, raf = 0, visible = true;
    function frame(t) {
      raf = 0;
      if (!visible || doc.hidden) return;
      var s = t / 1000, sy = window.scrollY;
      gx += (tgx - gx) * .04; gy += (tgy - gy) * .04;
      // сначала замеры, потом запись — чтобы браузер не пересчитывал раскладку на каждом мяче
      var rects = balls.map(function (b) { return b.el.getBoundingClientRect(); });
      for (var i = 0; i < balls.length; i++) {
        var b = balls[i], o = b.o, r = rects[i];
        var fx = Math.sin(s * 6.283 / b.px + b.fx) * b.ax, fy = Math.sin(s * 6.283 / b.py + b.fy) * b.ay;
        // мышь рядом — мяч мягко отходит; ушла — пружиной возвращается
        var cx = r.left + r.width / 2 - b.rx, cy = r.top + r.height / 2 - b.ry;
        var dx = cx - mx, dy = cy - my, d = Math.sqrt(dx * dx + dy * dy) || 1, reach = o.s / 2 + 90, tx = 0, ty = 0;
        if (d < reach) { var k = (1 - d / reach) * 28; tx = dx / d * k; ty = dy / d * k; }
        b.rx += (tx - b.rx) * .07; b.ry += (ty - b.ry) * .07;
        var ox = gx * o.z * 28, oy = gy * o.z * 20 - sy * o.z * .25;
        b.el.style.transform = 'translate3d(' + (fx + ox + b.rx).toFixed(1) + 'px,' + (fy + oy + b.ry).toFixed(1) + 'px,0)';
      }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible && !doc.hidden) raf = requestAnimationFrame(frame); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tgx = e.clientX / window.innerWidth * 2 - 1; tgy = e.clientY / window.innerHeight * 2 - 1;
      mx = e.clientX; my = e.clientY;
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { tgx = tgy = 0; mx = my = -1e4; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target._ballsVis = e.isIntersecting; });
        visible = scenes.some(function (sc) { return sc._ballsVis !== false; });
        kick();
      });
      scenes.forEach(function (sc) { io.observe(sc); });
    }
    doc.addEventListener('visibilitychange', kick);
    kick();
  }

  /* ==========================================================================
     Шапка, меню, подвал
     ========================================================================== */
  function navActive(g) { return g.pages.indexOf(PAGE) >= 0; }
  function navItem(it) {
    var here = it.href.split('#')[0] === PAGE + '.html' && !/#/.test(it.href);
    return '<a class="nv-item" href="' + it.href + '"' + (here ? ' aria-current="page"' : '') + '>' +
      '<span class="nv-i" aria-hidden="true">' + esc(it.i) + '</span><span class="nv-t"><b>' + esc(it.t) +
      (it.tag ? ' <em>' + esc(it.tag) + '</em>' : '') + '</b><small>' + esc(it.d) + '</small></span></a>';
  }

  function renderHeader() {
    var host = $('#site-header');
    if (!host) return;
    var links = NAV.map(function (g, gi) {
      var on = navActive(g) ? ' is-active' : '';
      if (!g.items) return '<a class="nv-top' + on + '" href="' + g.href + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(g.t) + '</a>';
      return '<div class="nv-group">' +
        '<button class="nv-top' + on + '" type="button" aria-expanded="false" aria-controls="nv-p' + gi + '">' + esc(g.t) + '<i aria-hidden="true"></i></button>' +
        '<div class="nv-panel' + (g.items.length > 4 ? ' wide' : '') + '" id="nv-p' + gi + '">' + g.items.map(navItem).join('') + '</div></div>';
    }).join('');
    var mlinks = NAV.map(function (g, gi) {
      if (!g.items) return '<a class="mlink" href="' + g.href + '"' + (navActive(g) ? ' aria-current="page"' : '') + '>' + esc(g.t) + '</a>';
      return '<details class="mgroup"' + (navActive(g) ? ' open' : '') + '><summary class="mlink">' + esc(g.t) + '</summary>' +
        '<div class="mitems">' + g.items.map(navItem).join('') + '</div></details>';
    }).join('');
    var tg = botHref('start');

    host.outerHTML =
      '<header class="site-header" id="hdr"><div class="container hbar">' +
        '<a class="logo" href="index.html" aria-label="Учи ИИ — на главную">' + logo() +
          BRAND + '</a>' +
        '<nav class="nav-desktop" aria-label="Основное меню">' + links + '</nav>' +
        '<div class="nav-actions">' +
          '<a class="btn sm ghost acc-btn hide-m" data-acc href="account.html">Войти</a>' +
          '<a class="btn sm hide-m" href="courses.html">Выбрать курс</a>' +
          '<button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>' +
        '</div>' +
      '</div></header>' +
      '<div class="mnav" id="mnav" aria-hidden="true">' +
        '<nav aria-label="Мобильное меню">' + mlinks + '</nav>' +
        '<div class="mfoot">' +
          '<a class="btn wide" href="courses.html">Выбрать курс</a>' +
          '<a class="btn ghost wide acc-btn" data-acc href="account.html">Войти в личный кабинет</a>' +
          (tg ? '<a class="btn ghost wide" href="' + tg + '" target="_blank" rel="noopener">Открыть бота в Telegram</a>' : '') +
          '<p>Пробный курс — без регистрации. Мы не гарантируем трудоустройство и не обещаем дохода.</p>' +
        '</div>' +
      '</div>';
  }

  /* Источники берутся из data.js (SOURCES) — тот же список, что раньше стоял под навигатором */
  function sourcesHTML() {
    var list = (typeof SOURCES !== 'undefined' && SOURCES) || [];
    var items = list.map(function (x) {
      return '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a></li>';
    }).join('');
    return '<details class="sources-wrap" id="sources"><summary>Откуда цифры и лицензии</summary><div class="sources">' +
      '<div><h4>Откуда цифры</h4>' +
        '<p>Мы не публикуем ни одного числа, которое нельзя проследить до источника. Персональная оценка в навигаторе — наша собственная шкала, а не показатель из исследования.</p>' +
        (items ? '<ol>' + items + '</ol>' : '<p><a href="about.html">Список источников</a></p>') +
      '</div>' +
      '<div><h4>Учебные материалы и лицензии</h4>' +
        '<p>Материалы собраны из открытых источников и переработаны нами:</p>' +
        '<div class="lic-list"><span><b>Microsoft</b> — MIT, CC0</span><span><b>DAIR.AI</b> — MIT</span><span><b>Hugging Face</b> — Apache 2.0</span><span><b>Яндекс</b> — CC BY 4.0</span><span><b>NIST</b> — public domain</span></div>' +
        '<p>Полные тексты лицензий и копирайты — в <a href="LICENSES.md">LICENSES.md</a>. Фотографии — Unsplash (лицензия Unsplash). Шрифт Manrope — SIL Open Font License.</p>' +
        '<p>Балл применимости ИИ из датасета Microsoft Research показывает, насколько ИИ уже используется в профессии, а не способность его заменить: так предупреждают сами авторы.</p>' +
      '</div></div></details>';
  }

  function renderFooter() {
    var host = $('#site-footer');
    if (!host) return;
    var cols = FOOTER.map(function (c) {
      return '<div><h4>' + esc(c.h) + '</h4><ul>' + c.links.map(function (l) {
        return '<li><a href="' + l[0] + '"' + (l[2] ? ' data-support="form" data-kind="' + (l[2] === 'complaint' ? 'complaint' : 'question') + '"' : '') + '>' + esc(l[1]) + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');
    var tg = botHref('start');
    host.outerHTML =
      '<footer class="site-footer"><div class="container">' +
        '<div class="cols">' +
          '<div><a class="logo" href="index.html">' + logo() + BRAND + '</a>' +
            '<p class="about">Показываем, что ИИ делает с вашей профессией, по открытым данным — и даём бесплатный план, как этим воспользоваться.</p>' +
            (tg ? '<p style="margin-top:14px"><a href="' + tg + '" target="_blank" rel="noopener">→ Бот в Telegram</a></p>' : '') +
          '</div>' + cols +
        '</div>' +
        sourcesHTML() +
        '<div class="legal"><span>© ' + new Date().getFullYear() + ' Учи ИИ. Не гарантируем трудоустройство и не обещаем дохода. Реквизиты — в <a href="offer.html">оферте</a>.</span>' +
          '<button class="theme-toggle" type="button" id="themeToggle"></button></div>' +
      '</div></footer>';
  }

  // ссылки «Источники» ведут в свёрнутый блок подвала — раскрываем его
  function initSources() {
    function open() { var d = $('#sources'); if (d && location.hash === '#sources') { d.open = true; } }
    window.addEventListener('hashchange', open); open();
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href$="#sources"]'), d = $('#sources');
      if (a && d) d.open = true;
    });
  }

  function initHeader() {
    var hdr = $('#hdr'), burger = $('.burger'), mnav = $('#mnav');
    if (!hdr) return;
    var scene = $('[data-scene].is-dark');   // светлый первый экран — шапка обычная
    var onScroll = function () {
      hdr.classList.toggle('scrolled', window.scrollY > 8);
      if (scene) hdr.classList.toggle('over-scene', window.scrollY < scene.offsetHeight - hdr.offsetHeight);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      mnav.classList.toggle('open', open);
      mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
      body.classList.toggle('no-scroll', open);
      body.classList.toggle('menu-open', open);
      if (open) { var f = $('a', mnav); if (f) f.focus({ preventScroll: true }); }
    }
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });

    // выпадающие панели: открываются наведением и кликом, закрываются кликом мимо и Esc
    var groups = $$('.nv-group', hdr), timer = 0;
    function openG(g, on) {
      groups.forEach(function (x) {
        var o = x === g && on;
        x.classList.toggle('open', o);
        $('.nv-top', x).setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    }
    groups.forEach(function (g) {
      var btn = $('.nv-top', g);
      // клик сразу после наведения не должен закрывать только что открытую панель
      btn.addEventListener('click', function () { openG(g, Date.now() - (g._hoverAt || 0) < 500 || !g.classList.contains('open')); });
      g.addEventListener('mouseenter', function () { clearTimeout(timer); if (!g.classList.contains('open')) g._hoverAt = Date.now(); openG(g, true); });
      g.addEventListener('mouseleave', function () { timer = setTimeout(function () { openG(g, false); }, 160); });
      g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) openG(g, false); });
    });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.nv-group')) openG(null, false); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && mnav.classList.contains('open')) setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) { setMenu(false); burger.focus(); }
      if (e.key === 'Escape') { var g = $('.nv-group.open', hdr); if (g) { openG(null, false); $('.nv-top', g).focus(); } }
    });
  }

  /* ---------- тема: авто → светлая → тёмная ---------- */
  function initTheme() {
    var btn = $('#themeToggle');
    if (!btn) return;
    var names = { '': 'Тема: как в системе', light: 'Тема: светлая', dark: 'Тема: тёмная' };
    function paint() { btn.textContent = names[root.getAttribute('data-theme') || '']; }
    paint();
    btn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') || '';
      var next = cur === '' ? 'light' : cur === 'light' ? 'dark' : '';
      if (next) root.setAttribute('data-theme', next); else root.removeAttribute('data-theme');
      try { if (next) localStorage.setItem('rz-theme', next); else localStorage.removeItem('rz-theme'); } catch (e) {}
      paint();
    });
  }

  /* ==========================================================================
     Параллакс
     data-depth="0.3"  — сдвиг относительно прокрутки (больше = «дальше», медленнее)
     отрицательное     — слой «ближе», движется быстрее страницы
     data-px           — слой ещё и следует за курсором
     data-fade         — слой плавно гаснет при прокрутке (текст героя)
     ========================================================================== */
  function initParallax() {
    var items = $$('[data-depth]');
    if (!items.length || reduceMotion) return;
    var hosts = [], P = [];
    items.forEach(function (el) {
      var host = el.closest('[data-parallax]') || el.parentElement;
      if (hosts.indexOf(host) < 0) { hosts.push(host); host._vis = true; }
      P.push({ el: el, d: parseFloat(el.getAttribute('data-depth')) || 0, host: host,
               px: el.hasAttribute('data-px'), fade: el.hasAttribute('data-fade'),
               rot: parseFloat(el.getAttribute('data-rot')) || 0 });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target._vis = e.isIntersecting; if (e.isIntersecting) kick(); });
      }, { rootMargin: '100px 0px' });
      hosts.forEach(function (h) { io.observe(h); });
    }
    var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
    var tx = 0, ty = 0, cx = 0, cy = 0, dirty = true, running = false;

    function render() {
      var vh = window.innerHeight;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (!p.host._vis) continue;
        var r = p.host.getBoundingClientRect();
        var off = (r.top + r.height / 2) - vh / 2;
        var y = -off * p.d, x = 0;
        if (p.px && fine) { x += cx * p.d * 60; y += cy * p.d * 60; }
        var t = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        if (p.rot) t += ' rotate(' + (p.rot + off * 0.004 * (p.d > 0 ? 1 : -1)).toFixed(2) + 'deg)';
        p.el.style.transform = t;
        if (p.fade) {
          var k = Math.min(1, Math.max(0, -r.top / (r.height * 0.75)));
          p.el.style.opacity = (1 - k * 0.9).toFixed(3);
        }
      }
    }
    function tick() {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      render();
      var moving = Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008;
      if (dirty || moving) { dirty = false; requestAnimationFrame(tick); } else running = false;
    }
    function kick() { dirty = true; if (!running) { running = true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    if (fine) {
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        kick();
      }, { passive: true });
    }
    kick();
  }

  /* ---------- появление при прокрутке ---------- */
  function initReveal() {
    var els = $$('.reveal, .preview');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (e) { e.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- ссылки на бота: data-bot="pay|pack|lessons|support|start" ---------- */
  function initBotLinks() {
    $$('[data-bot]').forEach(function (a) {
      var start = a.getAttribute('data-bot');
      var href = botHref(start);
      if (href) {
        a.setAttribute('href', href);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      } else {
        // Бот ещё не подключён — не оставляем человека с мёртвой кнопкой
        a.setAttribute('href', '#support');
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var msg = {
            pay: 'Хочу подключить разбор работ. Подскажите, как оплатить.',
            pack: 'Хочу купить пакет материалов за 1 490 ₽.',
            lessons: 'Хочу получить занятия.'
          }[start] || '';
          openSupport('form', start === 'pay' || start === 'pack' ? 'payment' : 'question', msg);
        });
      }
    });
  }

  /* ==========================================================================
     Помощь и обратная связь
     ========================================================================== */
  var KINDS = [
    { v: 'question',  t: 'Вопрос' },
    { v: 'complaint', t: 'Жалоба' },
    { v: 'payment',   t: 'Оплата, возврат' },
    { v: 'idea',      t: 'Предложение' }
  ];
  var QUICK_FAQ = [
    ['Это правда бесплатно?', 'Да. Навигатор и все четыре занятия бесплатны без ограничений. Платно только разбор ваших работ — 2 490 ₽ за 31 день, первые 7 дней бесплатно.'],
    ['Спишутся ли деньги автоматически?', 'Нет. Автопродления нет вообще. За два дня до конца доступа бот пришлёт ссылку, и вы решите сами.'],
    ['Моей профессии нет в списке', 'Напишите её в поиске навигатора и оставьте контакт — добавим и напишем. Четыре занятия «усиления» подходят почти любой офисной работе.'],
    ['Как вернуть деньги?', 'В любой момент, пропорционально неиспользованным дням. Выберите «Оплата, возврат» во вкладке «Написать» — ответим в срок по оферте, до 10 дней.'],
    ['Как удалить мои данные?', 'Отправьте боту команду «удалить» — всё стирается сразу. Или напишите нам через форму.']
  ];

  function formHTML(id) {
    var kinds = KINDS.map(function (k, i) {
      return '<div class="kind"><input type="radio" name="kind" id="' + id + '-k' + i + '" value="' + k.v + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<label for="' + id + '-k' + i + '">' + esc(k.t) + '</label></div>';
    }).join('');
    return '<form class="fb-form" novalidate data-fb>' +
      '<fieldset class="kinds"><legend>С чем вы пришли?</legend>' + kinds + '</fieldset>' +
      '<div class="field"><label class="l" for="' + id + '-contact">Как с вами связаться</label>' +
        '<input type="text" id="' + id + '-contact" name="contact" autocomplete="email" placeholder="Telegram @ник или почта" maxlength="200" required></div>' +
      '<div class="field"><label class="l" for="' + id + '-name">Как к вам обращаться <span class="opt">— необязательно</span></label>' +
        '<input type="text" id="' + id + '-name" name="name" autocomplete="given-name" maxlength="80"></div>' +
      '<div class="field"><label class="l" for="' + id + '-msg">Сообщение</label>' +
        '<textarea id="' + id + '-msg" name="message" maxlength="4000" required placeholder="Опишите, что случилось или что хотите узнать. Для оплаты — дату и сумму, но не номер карты."></textarea>' +
        '<div class="hint"><span>Не присылайте пароли и данные карт.</span><span data-count>0 / 4000</span></div></div>' +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="check"><input type="checkbox" name="consent" required><span>Согласен на обработку контакта и текста обращения, чтобы получить ответ. ' +
        '<a href="privacy.html" target="_blank" rel="noopener">Политика обработки данных</a></span></label>' +
      '<button class="btn wide" type="submit">Отправить</button>' +
      '<div class="fb-status" role="status" aria-live="polite" hidden></div>' +
    '</form>';
  }

  function quickHTML() {
    var tg = tgHref(), bot = botHref('support');
    return QUICK_FAQ.map(function (q) {
      return '<details class="acc"><summary>' + esc(q[0]) + '</summary><div class="acc-body"><p>' + esc(q[1]) + '</p></div></details>';
    }).join('') +
    '<div class="quick-links">' +
      '<a class="quick-link" href="faq.html"><span class="qi">' + ICO.book + '</span><span><b>Все вопросы и ответы</b><span class="s">Навигатор, обучение, оплата, данные</span></span></a>' +
      (tg ? '<a class="quick-link" href="' + tg + '" target="_blank" rel="noopener"><span class="qi">' + ICO.tg + '</span><span><b>Написать в Telegram</b><span class="s">@' + esc(C.SUPPORT_TG.replace(/^@/, '')) + '</span></span></a>' : '') +
      (bot ? '<a class="quick-link" href="' + bot + '" target="_blank" rel="noopener"><span class="qi">' + ICO.doc + '</span><span><b>Спросить в боте</b><span class="s">Если вы уже учитесь</span></span></a>' : '') +
      (C.SUPPORT_EMAIL ? '<a class="quick-link" href="mailto:' + esc(C.SUPPORT_EMAIL) + '"><span class="qi">' + ICO.mail + '</span><span><b>Почта</b><span class="s">' + esc(C.SUPPORT_EMAIL) + '</span></span></a>' : '') +
    '</div>';
  }

  var drawer, overlay, fab, lastFocus = null;

  function renderSupport() {
    if (root.classList.contains('in-tg')) return;
    var wrap = doc.createElement('div');
    wrap.innerHTML =
      '<button class="fab" type="button" aria-haspopup="dialog" aria-controls="support-drawer"><span class="q" aria-hidden="true">?</span><span class="fab-label">Помощь</span></button>' +
      '<div class="drawer-overlay" data-close></div>' +
      '<aside class="drawer" id="support-drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" aria-hidden="true">' +
        '<div class="drawer-head"><div><h2 id="dr-title">Чем помочь?</h2><p>Отвечаем живыми людьми, обычно в течение рабочего дня.</p></div>' +
          '<button class="x-btn" type="button" data-close aria-label="Закрыть">×</button></div>' +
        '<div class="tabs" role="tablist">' +
          '<button type="button" role="tab" id="tab-faq" aria-controls="pn-faq" aria-selected="true">Частые вопросы</button>' +
          '<button type="button" role="tab" id="tab-form" aria-controls="pn-form" aria-selected="false" tabindex="-1">Написать нам</button>' +
        '</div>' +
        '<div class="drawer-body">' +
          '<div role="tabpanel" id="pn-faq" aria-labelledby="tab-faq">' + quickHTML() + '</div>' +
          '<div role="tabpanel" id="pn-form" aria-labelledby="tab-form" hidden>' + formHTML('dr') + '</div>' +
        '</div>' +
      '</aside>';
    while (wrap.firstChild) body.appendChild(wrap.firstChild);
    fab = $('.fab'); drawer = $('#support-drawer'); overlay = $('.drawer-overlay');

    fab.addEventListener('click', function () { openSupport('faq'); });
    $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeSupport); });
    $$('[role=tab]', drawer).forEach(function (t) {
      t.addEventListener('click', function () { selectTab(t.id === 'tab-form' ? 'form' : 'faq'); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var next = t.id === 'tab-form' ? 'faq' : 'form';
          selectTab(next); $('#tab-' + next).focus();
        }
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') closeSupport();
      if (e.key === 'Tab') trap(e);
    });
    // на узких экранах подпись «Помощь» прячется после первой прокрутки
    window.addEventListener('scroll', function () { fab.classList.toggle('compact', window.scrollY > 600); }, { passive: true });
  }

  function trap(e) {
    var f = $$('a[href],button:not([disabled]),input:not([type=hidden]):not(.hp),textarea,select,summary', drawer)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function selectTab(which) {
    var isForm = which === 'form';
    $('#tab-faq').setAttribute('aria-selected', String(!isForm));
    $('#tab-form').setAttribute('aria-selected', String(isForm));
    $('#tab-faq').tabIndex = isForm ? -1 : 0;
    $('#tab-form').tabIndex = isForm ? 0 : -1;
    $('#pn-faq').hidden = isForm;
    $('#pn-form').hidden = !isForm;
  }

  function openSupport(tab, kind, msg) {
    if (!drawer) return;
    lastFocus = doc.activeElement;
    selectTab(tab === 'form' ? 'form' : 'faq');
    var form = $('form', drawer);
    if (kind) { var r = $('input[name=kind][value="' + kind + '"]', form); if (r) r.checked = true; }
    if (msg && !form.message.value) { form.message.value = msg; form.message.dispatchEvent(new Event('input')); }
    drawer.classList.add('open'); overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('drawer-open', 'no-scroll');
    setTimeout(function () {
      var target = tab === 'form' ? form.contact : $('#tab-faq');
      if (target) target.focus({ preventScroll: true });
    }, 60);
  }

  function closeSupport() {
    if (!drawer) return;
    drawer.classList.remove('open'); overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('drawer-open');
    if (!$('#mnav.open')) body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------- логика формы (для панели и для страницы поддержки) ---------- */
  function bindForm(form) {
    var draftKey = 'rz-fb-draft';
    var d = store(draftKey);
    if (d) {
      ['contact', 'name', 'message'].forEach(function (k) { if (d[k] && form[k]) form[k].value = d[k]; });
      if (d.kind) { var r = $('input[name=kind][value="' + d.kind + '"]', form); if (r) r.checked = true; }
    }
    var counter = $('[data-count]', form);
    function count() { if (counter) counter.textContent = form.message.value.length + ' / 4000'; }
    count();
    form.addEventListener('input', function (e) {
      if (e.target.name === 'message') count();
      var f = e.target.closest('.field');
      if (f) { f.classList.remove('err'); var m = $('.err-msg', f); if (m) m.remove(); }
      store(draftKey, { kind: val(form, 'kind'), contact: form.contact.value, name: form.name.value, message: form.message.value });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(form); });
  }

  function val(form, name) {
    var el = $('input[name=' + name + ']:checked', form);
    return el ? el.value : '';
  }

  function fieldError(input, text) {
    var f = input.closest('.field');
    if (!f) return;
    f.classList.add('err');
    if (!$('.err-msg', f)) {
      var m = doc.createElement('div'); m.className = 'err-msg'; m.textContent = text; f.appendChild(m);
    }
  }

  function submit(form) {
    var contact = form.contact.value.trim(), message = form.message.value.trim();
    var ok = true;
    if (contact.length < 3) { fieldError(form.contact, 'Оставьте ник в Telegram или почту — иначе нам некуда ответить.'); ok = false; }
    if (message.length < 10) { fieldError(form.message, 'Напишите чуть подробнее — хотя бы пару предложений.'); ok = false; }
    if (!form.consent.checked) { form.consent.focus(); form.consent.closest('.check').style.color = 'var(--bad)'; ok = false; }
    else form.consent.closest('.check').style.color = '';
    if (!ok) { var bad = $('.field.err input, .field.err textarea', form); if (bad) bad.focus(); return; }

    var payload = {
      kind: val(form, 'kind') || 'question',
      contact: contact,
      name: form.name.value.trim(),
      message: message,
      page: location.pathname + location.hash,
      website: form.website.value,               // ловушка для ботов: люди это поле не видят
      consent: true,
      consentAt: new Date().toISOString(),
      policyVersion: C.POLICY_VERSION || ''
    };
    var btn = $('button[type=submit]', form), st = $('.fb-status', form);
    if (!API) { showFallback(form, payload); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Отправляю…';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(API + '/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j, code: r.status }; });
    }).then(function (res) {
      clearTimeout(timer);
      btn.disabled = false; btn.textContent = 'Отправить';
      if (!res.ok) {
        if (res.code === 429) { showFallback(form, payload, 'Слишком много обращений с вашего адреса за час.'); return; }
        showFallback(form, payload); return;
      }
      store('rz-fb-draft', null);
      $$('.field, .kinds, .check, button[type=submit]', form).forEach(function (el) { el.hidden = true; });
      st.hidden = false; st.className = 'fb-status ok';
      setTimeout(function () { st.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
      st.innerHTML = '<h3>Обращение №' + esc(res.j.id || '') + ' принято</h3>' +
        '<p>Ответим на <b>' + esc(contact) + '</b>. ' +
        (payload.kind === 'complaint' || payload.kind === 'payment'
          ? 'Жалобы и вопросы об оплате разбираем в первую очередь; официальный срок ответа по оферте — до 10 дней.'
          : 'Обычно отвечаем в течение рабочего дня.') + '</p>' +
        '<p><button type="button" class="btn ghost sm" data-again>Написать ещё</button></p>';
      $('[data-again]', st).addEventListener('click', function () {
        form.reset(); st.hidden = true;
        $$('.field, .kinds, .check, button[type=submit]', form).forEach(function (el) { el.hidden = false; });
        form.contact.value = contact;
        $('[data-count]', form).textContent = '0 / 4000';
      });
      goal('feedback');
    }).catch(function () {
      clearTimeout(timer);
      btn.disabled = false; btn.textContent = 'Отправить';
      showFallback(form, payload);
    });
  }

  function showFallback(form, p, reason) {
    var st = $('.fb-status', form);
    var tg = tgHref();
    var text = '[' + (KINDS.filter(function (k) { return k.v === p.kind; })[0] || KINDS[0]).t + '] ' + p.message + '\n\nКонтакт: ' + p.contact;
    var mail = C.SUPPORT_EMAIL
      ? 'mailto:' + C.SUPPORT_EMAIL + '?subject=' + encodeURIComponent('Учи ИИ: обращение') + '&body=' + encodeURIComponent(text)
      : '';
    st.hidden = false; st.className = 'fb-status fail';
    setTimeout(function () { st.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
    st.innerHTML = '<h3>Отсюда отправить не получилось</h3>' +
      '<p>' + esc(reason || 'Сервер сейчас недоступен.') + ' Ваш текст сохранён — отправьте его напрямую, это займёт полминуты:</p>' +
      '<p style="display:flex;flex-wrap:wrap;gap:8px">' +
        (tg ? '<a class="btn sm" href="' + tg + '" target="_blank" rel="noopener">Telegram</a>' : '') +
        (mail ? '<a class="btn sm ghost" href="' + mail + '">Почта</a>' : '') +
        '<button type="button" class="btn sm ghost" data-copy>Скопировать текст</button></p>';
    var cp = $('[data-copy]', st);
    cp.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { cp.textContent = 'Скопировано'; });
    });
  }

  function initSupportTriggers() {
    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-support]');
      if (!t) return;
      e.preventDefault();
      openSupport(t.getAttribute('data-support'), t.getAttribute('data-kind'), t.getAttribute('data-msg'));
    });
    if (location.hash === '#support' || location.hash === '#complaint') {
      setTimeout(function () { openSupport('form', location.hash === '#complaint' ? 'complaint' : 'question'); }, 300);
    }
  }

  function mountInlineForms() {
    $$('[data-support-inline]').forEach(function (host, i) { host.innerHTML = formHTML('in' + i); });
    $$('form[data-fb]').forEach(bindForm);
  }

  /* ---------- Яндекс Метрика: только если задан счётчик и человек согласился ---------- */
  function goal(name) { try { if (window.ym && C.METRIKA_ID) window.ym(C.METRIKA_ID, 'reachGoal', name); } catch (e) {} }
  function loadMetrika() {
    /* eslint-disable */
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a); })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(C.METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
  function initAnalytics() {
    if (!C.METRIKA_ID || root.classList.contains('in-tg')) return;
    var ok = store('rz-cookies');
    if (ok === true) { loadMetrika(); return; }
    if (ok === false) return;
    var bar = doc.createElement('div');
    bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookies');
    bar.style.cssText = 'position:fixed;left:16px;right:96px;bottom:16px;z-index:1150;max-width:560px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-lg);font-size:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    bar.innerHTML = '<span style="flex:1;min-width:200px">Считаем посещения Яндекс Метрикой, чтобы понимать, что улучшать. <a href="privacy.html">Подробнее</a></span>' +
      '<button class="btn sm" data-y>Согласен</button><button class="btn sm ghost" data-n>Нет</button>';
    body.appendChild(bar);
    $('[data-y]', bar).onclick = function () { store('rz-cookies', true); bar.remove(); loadMetrika(); };
    $('[data-n]', bar).onclick = function () { store('rz-cookies', false); bar.remove(); };
  }

  /* ---------- публичный интерфейс ---------- */
  function api(path, data) {
    if (!API) return Promise.resolve({ status: 0, data: { ok: false, error: 'Сервер ещё не подключён.' } });
    var opt = { credentials: 'include', headers: {} };
    if (data !== undefined) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(data); }
    return fetch(API + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, data: j }; });
    }).catch(function () { return { status: 0, data: { ok: false, error: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.' } }; });
  }
  var mePromise = null;
  function me(fresh) {
    if (!mePromise || fresh) mePromise = api('/api/me').then(function (r) { return r.data && r.data.ok ? r.data : { account: null }; });
    return mePromise;
  }
  function paintAccount(m) {
    var acc = m && m.account;
    try { sessionStorage.setItem('rz-me', acc ? JSON.stringify({ name: acc.name }) : ''); } catch (e) {}
    $$('[data-acc]').forEach(function (a) {
      var wide = a.classList.contains('wide');
      if (acc) a.innerHTML = '<span class="ava" aria-hidden="true">' + esc(acc.name.charAt(0).toUpperCase()) + '</span>' + (wide ? 'Личный кабинет' : esc(acc.name.split(' ')[0]));
      else a.textContent = wide ? 'Войти в личный кабинет' : 'Войти';
    });
  }
  function initAccount() {
    try { var cached = JSON.parse(sessionStorage.getItem('rz-me') || 'null'); if (cached) paintAccount({ account: cached }); } catch (e) {}
    if (API) me().then(paintAccount);
  }

  /* Карточка-напоминание о пробном курсе: появляется после первого экрана.
     Закрыли — не показываем неделю. Начали курс — предлагаем продолжить. Прошли — не показываем. */
  function initNudge() {
    if (/^(trial|ml|pay|account|success|fail|404)$/.test(PAGE) || root.classList.contains('in-tg')) return;
    // закрыли — прячем только до конца визита: при следующем заходе карточка снова на месте
    try { if (sessionStorage.getItem('uii-nudge-off')) return; } catch (e) {}
    var tr = store('uii-trial') || {};
    var done = tr.done || {};
    var started = Object.keys(done).length > 0;
    var el = doc.createElement('aside');
    el.className = 'nudge'; el.setAttribute('aria-label', 'Пробный курс');
    // пробный пройден — предлагаем следующий шаг: курсы по конкретным нейросетям
    if (done[6] || PAGE === 'tools') el.innerHTML = '<button class="nudge-x" type="button" aria-label="Закрыть">×</button>' +
      '<span class="nudge-kicker">' + (done[6] ? 'Пробный курс пройден ✓' : 'Курсы по нейросетям · от 990 ₽') + '</span>' +
      '<b><span class="nl">Дальше — курсы по DeepSeek, Qwen, Gemini и Claude</span><span class="ns">Курсы по нейросетям</span></b>' +
      '<span class="ai-logos nl">' + ['deepseek', 'qwen', 'gemini', 'claude'].map(function (t) {
        return '<img src="assets/img/ai/' + t + '.svg" alt="" width="22" height="22">'; }).join('') + '</span>' +
      '<a class="btn sm" href="courses.html#ai"><span class="nl">Выбрать нейросеть</span><span class="ns">Смотреть</span> →</a>';
    else el.innerHTML = '<button class="nudge-x" type="button" aria-label="Закрыть">×</button>' +
      '<span class="nudge-kicker">' + (started ? 'Вы остановились на уроке ' + (tr.cur || 1) : 'Бесплатно · 5 уроков по 5 минут') + '</span>' +
      '<b><span class="nl">' + (started ? 'Продолжим пробный курс?' : 'Пробный курс «Первые шаги с ИИ»') + '</span>' +
        '<span class="ns">' + (started ? 'Продолжить курс' : 'Пробный курс бесплатно') + '</span></b>' +
      '<a class="btn sm" href="trial.html"><span class="nl">' + (started ? 'Продолжить' : 'Начать бесплатно') + '</span><span class="ns">' +
        (started ? 'Дальше' : 'Начать') + '</span> →</a>';
    body.appendChild(el);
    $('.nudge-x', el).addEventListener('click', function () { el.classList.remove('show'); try { sessionStorage.setItem('uii-nudge-off', '1'); } catch (e) {} setTimeout(function () { el.remove(); }, 400); });
    var scene = $('[data-scene]');
    function check() {
      var limit = scene ? Math.min(420, scene.offsetHeight * .45) : 300;
      el.classList.toggle('show', window.scrollY > limit);
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* Курсы по нейросетям: карточки с логотипами везде, где предлагаем курс.
     Берутся из courses.json (ветка ai) — цена и названия правятся в одном месте. */
  function aiCard(c) {
    return '<a class="aic" href="courses.html#ai"><span class="ai-logo"><img src="assets/img/ai/' + esc(c.tool) + '.svg" alt="" width="28" height="28"></span>' +
      '<b>' + esc(c.title) + '</b><span class="aic-sub">' + esc(c.duration || '') + '</span>' +
      '<span class="aic-price">' + Number(c.price).toLocaleString('ru-RU') + ' ₽</span></a>';
  }
  function initAiCourses() {
    var boxes = $$('[data-ai-courses]');
    if (!boxes.length || !window.fetch) return;
    fetch('courses.json').then(function (r) { return r.json(); }).then(function (d) {
      var list = (d.courses || []).filter(function (c) { return c.branch === 'ai' && c.status === 'open'; });
      var full = (d.courses || []).filter(function (c) { return c.bot === 'sub'; })[0];
      var html = list.map(aiCard).join('') + (full
        ? '<a class="aic all" href="courses.html#use"><span class="ai-logos">' + list.slice(0, 4).map(function (c) {
            return '<img src="assets/img/ai/' + esc(c.tool) + '.svg" alt="" width="20" height="20">'; }).join('') + '</span>' +
          '<b>Все нейросети + разбор работ</b><span class="aic-sub">курс «' + esc(full.title) + '»</span>' +
          '<span class="aic-price">' + Number(full.price).toLocaleString('ru-RU') + ' ₽</span></a>' : '');
      boxes.forEach(function (b) { b.innerHTML = html; });
    }).catch(function () {});
  }

  /* Первый экран: демо-окно чата печатает ответ, потом начинает заново */
  function initHeroDemo() {
    var el = $('.hd-type');
    if (!el) return;
    var text = el.getAttribute('data-text') || '';
    if (reduceMotion) { el.textContent = text; return; }
    var i = 0;
    (function tick() {
      i++;
      el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, text.charAt(i - 1) === '\n' ? 260 : 22);
      else setTimeout(function () { i = 0; tick(); }, 4200);
    })();
  }

  /* История «Две дороги»: переключатель показывает одну дорогу за раз */
  function initStory() {
    $$('[data-story]').forEach(function (st) {
      var tabs = $$('[data-road]', st);
      function pick(road, focus) {
        st.setAttribute('data-active', road);
        tabs.forEach(function (t) {
          var on = t.getAttribute('data-road') === road;
          t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
          if (on && focus) t.focus();
        });
        $$('[data-panel]', st).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== road; });
        var a = $('[data-badge-a]', st), b = $('[data-badge-b]', st);
        if (a) a.hidden = road !== 'a';
        if (b) b.hidden = road !== 'b';
      }
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { pick(t.getAttribute('data-road')); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pick(t.getAttribute('data-road') === 'a' ? 'b' : 'a', true); }
        });
      });
    });
  }

  /* Отзывы: только настоящие и опубликованные владельцем. Нет ни одного — блок не показываем. */
  function initReviews() {
    var hosts = $$('[data-reviews]');
    if (!hosts.length || !API) return;
    api('/api/reviews').then(function (r) {
      var list = (r.data && r.data.reviews) || [];
      if (!list.length) return;
      var html = list.map(function (x) {
        return '<figure class="review">' + (x.demo ? '<span class="demo">Образец</span>' : '') +
          (x.result ? '<b class="res">' + esc(x.result) + '</b>' : '') +
          '<p>' + esc(x.text) + '</p><figcaption class="by"><span class="ava" aria-hidden="true">' + esc((x.name || '?').charAt(0)) + '</span>' +
          '<span><b>' + esc(x.name) + '</b><span>' + esc(x.role || '') + '</span></span></figcaption></figure>';
      }).join('');
      hosts.forEach(function (h) {
        h.innerHTML = html;
        var sec = h.closest('section'); if (sec) sec.hidden = false;
      });
    });
  }

  window.Razvilka = { openSupport: openSupport, closeSupport: closeSupport, goal: goal, botHref: botHref,
                      api: api, me: me, paintAccount: paintAccount, hasApi: function () { return !!API; } };
  // старые вызовы из первой версии index.html продолжают работать
  window.openModal = function (type) { openSupport(type === 'feedback' ? 'form' : 'faq'); };
  window.closeModal = closeSupport;

  /* ---------- запуск ---------- */
  renderHeader();
  initAccount();
  initReviews();
  initStory();
  initNudge();
  renderFooter();
  doodles();
  initScenes();
  initAiCourses();
  initHeroDemo();
  initSources();
  initHeader();
  initTheme();
  renderSupport();
  mountInlineForms();
  initSupportTriggers();
  initBotLinks();
  initParallax();
  initReveal();
  initAnalytics();
})();
