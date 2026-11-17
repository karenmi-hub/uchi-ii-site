/* ==========================================================================
   Учи ИИ — каталог курсов (courses.html).
   Курсы берутся из courses.json. Две ветки: use — пользоваться ИИ,
   career — профессия, связанная с ИИ. Покупка — через личный кабинет.
   ========================================================================== */
(function () {
  'use strict';
  var R = window.Razvilka || {};
  var box = document.getElementById('catalog');
  var choices = Array.prototype.slice.call(document.querySelectorAll('[data-branch]'));
  var DATA = null, ME = { account: null, purchases: [], waitlist: [] };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rub(n) { return Number(n).toLocaleString('ru-RU') + ' ₽'; }
  function branchFromHash() {
    var h = location.hash.replace('#', '');
    return h === 'ai' || h === 'use' || h === 'career' ? h : '';
  }
  function owned(id) {
    return (ME.purchases || []).some(function (p) { return p.course === id && p.active; });
  }
  function waiting(id) {
    return (ME.waitlist || []).some(function (w) { return w.course === id; });
  }

  function card(c) {
    var status = owned(c.id) ? '<span class="status own">Куплен</span>'
      : c.status === 'free' ? '<span class="status own">Бесплатно</span>'
      : c.status === 'open' ? '<span class="status">Можно начать</span>'
      : '<span class="status soon">Скоро</span>';
    var list = (c.includes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var price = c.status === 'free'
      ? '<div class="price"><b>0 ₽</b><span>' + esc(c.priceNote || '') + '</span></div>'
      : c.price
      ? '<div class="price"><b>' + rub(c.price) + '</b><span>' + esc(c.priceNote || '') + '</span></div>'
      : '<div class="price"><span>' + esc(c.priceNote || '') + '</span></div>';
    var actions;
    if (c.status === 'free') {
      actions = '<a class="btn" href="' + esc(c.link || 'trial.html') + '">Начать бесплатно</a>';
    } else if (owned(c.id)) {
      actions = '<a class="btn" href="account.html">Открыть в кабинете</a>';
    } else if (c.status === 'open') {
      actions = '<button class="btn" type="button" data-buy="' + esc(c.id) + '">Купить за ' + rub(c.price) + '</button>' +
        (c.bot === 'sub' ? '<a class="btn ghost" href="#" data-bot="pay">7 дней бесплатно в боте</a>' : '');
    } else if (waiting(c.id)) {
      actions = '<button class="btn ghost" type="button" disabled>Вы в листе ожидания</button>';
    } else {
      actions = '<button class="btn ghost" type="button" data-wait="' + esc(c.id) + '">Записаться — напишем к старту</button>';
    }
    return '<article class="course reveal is-in' + (c.tool ? ' tool' : '') + '" id="c-' + esc(c.id) + '">' +
      '<div class="top">' + status + '<span class="dur">' + esc(c.duration || '') + '</span></div>' +
      (c.tool ? '<span class="ai-logo lg"><img src="assets/img/ai/' + esc(c.tool) + '.svg" alt="" width="34" height="34"></span>' : '') +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="sub">' + esc(c.subtitle || '') + '</p>' +
      (list ? '<ul>' + list + '</ul>' : '') +
      (c.demand ? '<p class="demand"><b>Спрос:</b> ' + esc(c.demand) + '</p>' : '') +
      (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') +
      price +
      '<div class="actions">' + actions + '</div>' +
      '<p class="msg" hidden></p>' +
      '</article>';
  }

  function branchBlock(key, single) {
    var b = DATA.branches[key];
    var items = DATA.courses.filter(function (c) { return c.branch === key; });
    return '<div class="branch-head" id="b-' + key + '"><div><h2>' + esc(b.title) + '</h2><p>' + esc(b.lead) + '</p></div>' +
      (single ? '<button class="switch-link" type="button" data-switch="">Все курсы →</button>' : '') +
      '</div><div class="course-list">' + items.map(card).join('') + '</div>';
  }

  function render() {
    var br = branchFromHash();
    choices.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.getAttribute('data-branch') === br)); });
    Array.prototype.forEach.call(document.querySelectorAll('.pick'), function (c) { c.classList.toggle('picked', c.getAttribute('data-pick') === br); c.setAttribute('aria-pressed', String(c.getAttribute('data-pick') === br)); });
    if (!DATA) return;
    box.innerHTML = br ? branchBlock(br, true) : branchBlock('ai', false) + branchBlock('use', false) + branchBlock('career', false);
    if (window.RazvilkaDoodles) window.RazvilkaDoodles(box);
    // кнопки «7 дней в боте» — ссылки на бота из config.js
    Array.prototype.forEach.call(box.querySelectorAll('[data-bot]'), function (a) {
      var href = R.botHref ? R.botHref(a.getAttribute('data-bot')) : '';
      if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; }
      else a.remove();
    });
  }

  function say(id, text, err) {
    var m = document.querySelector('#c-' + id + ' .msg');
    if (!m) return;
    m.hidden = false; m.className = 'msg' + (err ? ' err' : ''); m.textContent = text;
  }

  function needLogin(id) {
    var back = 'courses.html?buy=' + encodeURIComponent(id) + (branchFromHash() ? '#' + branchFromHash() : '');
    location.href = 'account.html?next=' + encodeURIComponent(back);
  }

  function buy(id, btn) {
    // покупка — на отдельной странице оплаты с формой Робокассы
    location.href = 'pay.html?course=' + encodeURIComponent(id); return;
    if (!R.hasApi || !R.hasApi()) {
      say(id, 'Оплата на сайте заработает, когда подключим сервер. Пока можно оплатить в боте или написать нам.', true); return;
    }
    if (!ME.account) return needLogin(id);
    if (btn) { btn.disabled = true; btn.textContent = 'Готовим оплату…'; }
    R.api('/api/checkout', { course: id }).then(function (r) {
      if (r.data && r.data.ok && r.data.url) { location.href = r.data.url; return; }
      if (r.status === 401) return needLogin(id);
      if (btn) { btn.disabled = false; btn.textContent = 'Купить'; }
      say(id, (r.data && r.data.error) || 'Не получилось. Попробуйте ещё раз.', true);
    });
  }

  function wait(id, btn) {
    if (!R.hasApi || !R.hasApi()) { say(id, 'Запись заработает, когда подключим сервер. Напишите нам — запишем вручную.', true); return; }
    if (!ME.account) return needLogin(id);
    btn.disabled = true;
    R.api('/api/waitlist', { course: id }).then(function (r) {
      if (r.data && r.data.ok) { ME = r.data; render(); say(id, 'Записали. Напишем, когда курс откроется.'); }
      else { btn.disabled = false; say(id, (r.data && r.data.error) || 'Не получилось.', true); }
    });
  }

  choices.forEach(function (ch) {
    ch.addEventListener('click', function () {
      var b = ch.getAttribute('data-branch');
      history.replaceState(null, '', '#' + b);
      render();
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  box.addEventListener('click', function (e) {
    var t = e.target.closest('[data-buy],[data-wait],[data-switch]');
    if (!t) return;
    if (t.hasAttribute('data-buy')) buy(t.getAttribute('data-buy'), t);
    else if (t.hasAttribute('data-wait')) wait(t.getAttribute('data-wait'), t);
    else { history.replaceState(null, '', '#' + t.getAttribute('data-switch')); render(); }
  });
  window.addEventListener('hashchange', render);
  // кнопки под сравнением переключают ветку каталога
  Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      history.replaceState(null, '', '#' + b.getAttribute('data-pick'));
      render();
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  fetch('courses.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (d) { DATA = d; return R.me ? R.me() : ME; })
    .then(function (m) {
      if (m && m.account) ME = m;
      render();
      // вернулись после входа с ?buy=курс — продолжаем покупку
      var q = /[?&]buy=([\w-]+)/.exec(location.search);
      if (q) location.replace('pay.html?course=' + encodeURIComponent(q[1]));
    })
    .catch(function () {
      box.innerHTML = '<div class="empty" style="margin-top:32px">Не получилось загрузить список курсов. Обновите страницу.</div>';
    });
})();
