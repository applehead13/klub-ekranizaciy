/* =========================================================
   Клуб экранизаций — скрипты
   ========================================================= */

/* Прелоадер: слова «Клуб» и «экранизаций», между ними окошко с фото; последнее фото растягивается на первый экран */
(function () {
  var root = document.documentElement, pl = document.getElementById('pl');
  if (!pl || !root.classList.contains('preloading')) { if (pl) pl.remove(); return; }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  var row = pl.querySelector('.pl-row'), box = pl.querySelector('.pl-win'), wa = pl.querySelector('.pl-a'), wb = pl.querySelector('.pl-b');
  var PHOTOS = ['img/f1.jpg?v=3', 'img/f3.jpg', 'img/meet-1.jpg', 'img/f2.jpg?v=2', 'img/meet-2.jpg', 'img/meet-3.jpg', 'img/photo.jpg?v=2'], HERO = 'img/hero.jpg';
  var all = PHOTOS.concat(HERO), imgs = [], done = false;

  function finish() {
    if (done) return; done = true;
    root.classList.remove('preloading', 'pl-wait');
    pl.remove();
    window.dispatchEvent(new Event('resize'));   // после снятия блокировки прокрутки ширина изменилась: пересчитать подгонку заголовка
    document.dispatchEvent(new Event('pl:done'));
  }

  // размер слов подгоняем, чтобы вся строка с открытым окошком влезла по ширине
  function fit() {
    pl.classList.add('measure');
    row.style.fontSize = '';
    var base = parseFloat(getComputedStyle(row).fontSize), w = row.scrollWidth, max = window.innerWidth * 0.92;
    if (max > 0 && base > 0 && w > max) row.style.fontSize = (base * max / w) + 'px';
    pl.classList.remove('measure');
  }

  function expand() {
    var hero = document.querySelector('.hero'), heroImg = document.querySelector('.hero-media img');
    if (!hero) { finish(); return; }
    if (window.innerWidth <= 900 || (window.matchMedia && matchMedia('(hover: none)').matches)) {   // телефон и планшет: окошко не растягивается на экран (это шло рывками), а прелоадер плавно растворяется, открывая то же фото
      pl.classList.add('expand'); pl.style.transition = 'opacity .8s ease, background-color .4s ease'; void pl.offsetWidth; pl.style.opacity = '0';
      setTimeout(finish, 850); return;
    }
    var b = box.getBoundingClientRect(), t = hero.getBoundingClientRect();
    box.style.transition = 'none';             // фиксируем окошко ровно там, где оно стоит, без перелёта к центру
    box.classList.add('fly');
    box.style.left = b.left + 'px'; box.style.top = b.top + 'px'; box.style.width = b.width + 'px'; box.style.height = b.height + 'px';
    void box.offsetWidth;
    box.style.transition = '';
    var last = box.querySelector('img.on'); if (last && heroImg) last.style.objectPosition = getComputedStyle(heroImg).objectPosition;
    void box.offsetWidth;
    pl.classList.add('expand');
    box.style.left = t.left + 'px'; box.style.top = t.top + 'px'; box.style.width = t.width + 'px'; box.style.height = t.height + 'px';
    box.style.borderRadius = getComputedStyle(hero).borderRadius;
    setTimeout(finish, 1250);
  }

  function run() {
    fit();
    var i = 0;
    function show(n) { imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); }); }
    function ready(n) { return imgs[n] && imgs[n].complete && imgs[n].naturalWidth > 0; }
    show(0);                                   // первое фото уже в окошке, оно раскрывается вместе с ним
    pl.classList.add('go');
    setTimeout(function () { pl.classList.add('open'); }, 500);
    setTimeout(function () {
      var timer = setInterval(function () {
        i++;
        if (i >= imgs.length - 1) { clearInterval(timer); show(imgs.length - 1); setTimeout(expand, 350); return; }
        if (ready(i)) show(i);
      }, 200);
    }, 700);
  }

  // Ждём только два первых фото и главное (его же показываем в конце); остальные догружаются, пока идёт смена.
  var loaded = {}, started = false, NEED = [0, 1, all.length - 1];
  function start() { if (started) return; started = true; run(); }
  function check() { if (NEED.every(function (k) { return loaded[k]; })) start(); }
  all.forEach(function (src, k) {
    var im = new Image(); im.alt = ''; im.decoding = 'async';
    im.onload = im.onerror = function () { loaded[k] = true; check(); };
    im.src = src; imgs.push(im); box.appendChild(im);
  });
  setTimeout(start, 1500);
  window.addEventListener('resize', function () { if (!done && !pl.classList.contains('expand')) fit(); });
})();

/* Хоровод: картинки героев подгружаются, только когда блок близко к экрану (экономит около 1,5 МБ при первой загрузке) */
(function () {
  var rondo = document.querySelector('.rondo');
  if (!rondo) return;
  function load() {
    [].forEach.call(rondo.querySelectorAll('[data-bg]'), function (el) { el.style.backgroundImage = 'url(' + el.getAttribute('data-bg') + ')'; el.removeAttribute('data-bg'); });
  }
  // Загружаем, когда закончилась заставка (чтобы картинки не отнимали скорость у неё и у первого экрана) или когда блок уже виден
  var fired = false;
  function go() { if (fired) return; fired = true; load(); }
  if (document.documentElement.classList.contains('preloading')) document.addEventListener('pl:done', function () { setTimeout(go, 300); }, { once: true });
  else window.addEventListener('load', function () { setTimeout(go, 300); }, { once: true });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }, { rootMargin: '100px 0px' });
    io.observe(rondo);
  }
  setTimeout(load, 8000);       // запасной срок на случай, если наблюдатель не сработает
})();

/* Видео в «Как это было» начинает грузиться, только когда до блока остаётся меньше экрана */
(function () {
  var v = document.querySelector('.big-video');
  if (!v || !v.getAttribute('data-src')) return;
  function start() {
    if (v.getAttribute('src')) return;
    v.setAttribute('src', v.getAttribute('data-src')); v.load();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }
  if (!('IntersectionObserver' in window)) { start(); return; }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { rootMargin: '700px 0px' });
  io.observe(v.closest('.slot') || v);
})();

/* Бесконечные анимации (киноленты, катушка, теги, пульсации) стоят на паузе, пока их блок далеко от экрана */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); });
  }, { rootMargin: '200px 0px' });
  [].forEach.call(document.querySelectorAll('.hero, #now, #schedule, .reel, footer'), function (el) { io.observe(el); });
})();

// Заголовок первого экрана подгоняем точно под ширину блока.
// Размер задан в CSS через clamp (с rem, чтобы работало увеличение),
// а скрипт только подбирает множитель --fit.
// На широких экранах — одна строка, на телефонах — три строки.
(function () {
  var h = document.getElementById('h1');
  if (!h) return;
  var spans = h.querySelectorAll('span');
  // каждое слово заголовка — в «окошке»: внутренний элемент выезжает из-за линии, как заголовки блоков ниже
  spans.forEach(function (sp) {
    if (sp.querySelector('.hw')) return;
    var w = document.createElement('i'); w.className = 'hw'; w.textContent = sp.textContent; sp.textContent = ''; sp.appendChild(w);
  });

  function fit() {
    var w = h.parentElement.clientWidth;
    var stacked = window.innerWidth < 760;
    h.style.setProperty('--fit', 1);
    h.style.whiteSpace = stacked ? 'normal' : 'nowrap';

    var widest = 0, mid = stacked && window.innerWidth >= 450;
    if (mid) {
      // 450–759 px: «Читаем. Смотрим.» в одну строку, «Спорим.» ниже слева
      h.style.whiteSpace = 'nowrap';
      spans[0].style.setProperty('display', 'inline-block', 'important'); spans[1].style.setProperty('display', 'inline-block', 'important');
      spans[2].style.setProperty('display', 'block', 'important'); spans[2].style.textAlign = 'left'; spans[2].style.marginTop = '0';
      var r0 = spans[0].getBoundingClientRect(), r1 = spans[1].getBoundingClientRect();
      widest = r1.right - r0.left;
      h.style.whiteSpace = 'normal';
    } else {
      spans.forEach(function (sp) { sp.style.removeProperty('display'); sp.style.textAlign = ''; sp.style.marginTop = ''; });
    }
    if (mid) {
    } else if (stacked) {
      spans.forEach(function (s) {
        s.style.display = 'inline-block';
        widest = Math.max(widest, s.offsetWidth);
        s.style.display = 'block';
      });
    } else {
      spans.forEach(function (s) { s.style.display = 'inline-block'; });
      h.style.display = 'inline-block';
      widest = h.offsetWidth;
      h.style.display = '';
    }
    h.style.fontSize = '';
    if (widest > 0) h.style.setProperty('--fit', (w / widest * 0.995).toFixed(4));
    // экран низкий: уменьшаем заголовок, пока весь первый экран не поместится по высоте
    if (stacked) {
      var hero = document.querySelector('.hero'), limit = window.innerHeight - 40, px = parseFloat(getComputedStyle(h).fontSize), guard = 0;
      while (hero && hero.scrollHeight > limit + 1 && px > 28 && guard++ < 60) { px = px * 0.96; h.style.fontSize = px.toFixed(1) + 'px'; }
    }
  }

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('resize', fit); window.addEventListener('load', fit);
})();

// Блоки ниже первого экрана мягко «встают на место» при прокрутке,
// полоска свободных мест заполняется, когда до неё доходишь.
// Всё, что видно сразу, остаётся как есть.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll('.sec-head, .bento > *, .fr, .fact, .row, .garland, .names, .gallery > *, .cta-band, .note, .more-btn, .rondo-ui, .f-brand, .f-bye, .f-cta, .f-bot > *');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.animationDelay = Math.min(i, 5) * 110 + 'ms';
      el.classList.remove('pre');
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: .12 });

  // Заголовки блоков выезжают по словам из-за линии, как титры
  function splitTitle(h) {
    var parts = h.textContent.split(/( +)/), k = 0;   // слова, соединённые неразрывным пробелом, остаются одним куском и не переносятся с пустым началом строки
    h.setAttribute('aria-label', h.textContent);
    h.textContent = '';
    parts.forEach(function (t) {
      if (!t) return;
      if (/^[\s ]+$/.test(t)) { h.appendChild(document.createTextNode(t)); return; }
      var w = document.createElement('span'), inner = document.createElement('span');
      w.className = 'tw'; w.setAttribute('aria-hidden', 'true');
      inner.style.setProperty('--i', k++); inner.textContent = t;
      w.appendChild(inner); h.appendChild(w);
    });
  }

  targets.forEach(function (el) {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add('pre');
      if (el.classList.contains('sec-head')) { var h = el.querySelector('h2'); if (h) splitTitle(h); }
      io.observe(el);
    }
  });

  var meter = document.querySelector('.meter');
  if (meter && meter.getBoundingClientRect().top > window.innerHeight) {
    meter.classList.add('wait');
    var mo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { meter.classList.remove('wait'); mo.disconnect(); }
    }, { threshold: .6 });
    mo.observe(meter);
  }
})();

// Афиша: полгода видно сразу, остальные месяцы раскрываются из тумана кнопкой.
(function () {
  var btn = document.querySelector('.more-btn');
  var box = document.getElementById('rows-more');
  var sec = document.getElementById('schedule');
  if (!btn || !box) return;
  box.setAttribute('inert', '');
  var timer;
  btn.addEventListener('click', function () {
    clearTimeout(timer);
    var open = !box.classList.contains('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.firstChild.nodeValue = open ? btn.dataset.less : btn.dataset.more;
    if (open) {
      box.classList.add('open');
      box.removeAttribute('inert');
      box.style.maxHeight = box.scrollHeight + 'px';
      timer = setTimeout(function () { box.style.maxHeight = 'none'; box.style.overflow = 'visible'; }, 900);   // раскрыто: контейнер больше не обрезает свечение строк
      box.querySelectorAll('.row').forEach(function (r, i) {
        r.style.animationDelay = i * 60 + 'ms';
        r.classList.remove('in'); void r.offsetWidth; r.classList.add('in');
      });
    } else {
      box.style.overflow = '';                          // при сворачивании снова обрезаем
      box.style.maxHeight = box.scrollHeight + 'px';   // из «none» в число, чтобы было от чего анимировать
      void box.offsetWidth;
      box.classList.remove('open');
      box.setAttribute('inert', '');
      box.style.maxHeight = '';
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

// Афиша: плашка «Ближайшая» стоит на верхней грани строки посередине между датами и кнопкой.
(function () {
  var row = document.querySelector('.row.now');
  if (!row) return;
  var tag = row.querySelector('.tag'), btn = row.querySelector('.st'), dates = row.querySelector('.dates');
  if (!tag || !btn || !dates) return;
  function place() {
    var r = row.getBoundingClientRect();
    var right = 0;
    dates.querySelectorAll('span').forEach(function (s) { right = Math.max(right, s.getBoundingClientRect().right); });
    var mid = (right + btn.getBoundingClientRect().left) / 2 - r.left;
    // плашка стоит над «запись открыта» из строки ниже, чтобы держать общую вертикаль; если такой нет — между датами и кнопкой
    var open = document.querySelector('.rows .st.open');
    if (open) { var o = open.getBoundingClientRect(); if (o.width) mid = o.left + o.width / 2 - r.left; }
    row.style.setProperty('--tag-x', Math.round(mid - tag.offsetWidth / 2) + 'px');
  }
  place();
  window.addEventListener('resize', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();


// Окно записи: билет выезжает и встаёт по центру. Открывается любой кнопкой с data-signup.
// При отправке корешок с итогом отрывается. Проект демонстрационный: данные никуда не уходят.
(function () {
  var dlg = document.getElementById('signup');
  if (!dlg || !dlg.showModal) return;
  var ticket = dlg.querySelector('.ticket'), form = dlg.querySelector('.su-form');
  var body = dlg.querySelector('.tk-body'), stub = dlg.querySelector('.tk-stub'), done = dlg.querySelector('.su-done');
  var chipsBox = dlg.querySelector('.su-chips'), totalEl = dlg.querySelector('[data-total]');
  var countEl = dlg.querySelector('.su-count'), err = dlg.querySelector('.su-error');
  var leftEl = dlg.querySelector('.su-left'), monthEl = dlg.querySelector('.su-month'), nameEl = dlg.querySelector('.su-name'), authorEl = dlg.querySelector('.su-author');
  var PRICE = 600, ALL = 1500, seats = 1, max = 6, month = 'Октябрь', book = '', lastFocus = null, closeTimer, busy = false;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }

  function buildChips(dates) {
    chipsBox.textContent = '';
    dates.forEach(function (d) {
      var p = d.split(' '), l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span');
      l.className = 'chip'; i.type = 'checkbox'; i.name = 'when'; i.value = d;
      s.textContent = cap(p[0]) + ' · ' + p[1];
      l.appendChild(i); l.appendChild(s); chipsBox.appendChild(l);
    });
    if (dates.length < 3) return;
    var all = document.createElement('label'), ai = document.createElement('input'), as = document.createElement('span');
    all.className = 'chip chip-all'; ai.type = 'checkbox'; ai.name = 'all'; ai.value = 'весь цикл';
    as.textContent = 'Весь цикл · ' + fmt(ALL).replace(' ', ' ');
    all.appendChild(ai); all.appendChild(as); chipsBox.appendChild(all);
  }
  function whens() { return [].slice.call(chipsBox.querySelectorAll('input[name="when"]')); }
  function allBox() { return chipsBox.querySelector('input[name="all"]'); }
  function chosen() { return whens().filter(function (i) { return i.checked; }); }
  function total() {
    var n = chosen().length;
    return (n === 3 && whens().length === 3 ? ALL : n * PRICE) * seats;
  }
  function refresh() {
    if (allBox()) allBox().checked = whens().length > 0 && chosen().length === whens().length;
    totalEl.textContent = fmt(total());
    countEl.textContent = seats;
    leftEl.innerHTML = 'Осталось <b>' + max + ' мест</b> из 16';
  }
  chipsBox.addEventListener('change', function (e) {
    if (e.target.name === 'all') whens().forEach(function (i) { i.checked = e.target.checked; });
    err.hidden = true; refresh();
  });
  dlg.querySelectorAll('.su-step').forEach(function (b) {
    b.addEventListener('click', function () {
      seats = Math.min(max, Math.max(1, seats + Number(b.dataset.step))); refresh();
    });
  });

  function open(btn) {
    clearTimeout(closeTimer); busy = false; dlg.classList.remove('leaving');
    var dates = (btn.dataset.dates || 'книга 11.10|фильм 18.10|спор 25.10').split('|');
    month = btn.dataset.month || 'Октябрь';
    book = btn.dataset.book || '«Шоколад», Джоанн Харрис';
    max = Number(btn.dataset.left || 6); seats = 1;
    var cut = book.lastIndexOf(', ');
    monthEl.textContent = month;
    nameEl.textContent = (cut > -1 ? book.slice(0, cut) : book).replace(/[«»]/g, '');
    authorEl.textContent = cut > -1 ? book.slice(cut + 2) : '';
    form.reset(); buildChips(dates);
    dlg.querySelectorAll('.bad').forEach(function (n) { n.classList.remove('bad'); });
    ticket.classList.remove('tearing', 'torn');
    err.hidden = true; done.hidden = true; body.hidden = false; stub.hidden = false;
    var sb = form.querySelector('.su-submit'); sb.disabled = false; sb.textContent = 'Забронировать место';
    refresh();
    lastFocus = btn;
    document.documentElement.classList.add('modal-open');
    dlg.showModal();
    void dlg.offsetWidth;                      // зафиксировать начальное положение, чтобы билет выехал плавно
    dlg.classList.add('open');
    setTimeout(function () { var n = form.querySelector('input[name="name"]'); if (n && !body.hidden) n.focus({ preventScroll: true }); }, 400);
  }
  function close() {
    dlg.classList.add('leaving');               // билет улетает
    dlg.classList.remove('open');
    closeTimer = setTimeout(function () {
      dlg.classList.remove('leaving');
      dlg.close();
      document.documentElement.classList.remove('modal-open');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }, 650);
  }
  document.querySelectorAll('[data-signup]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); open(b); });
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-su-close]')) close(); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    // Проект демонстрационный: кнопка работает и с пустыми полями, данные никуда не уходят.
    busy = true;
    var name = form.elements.name.value.trim();
    var payload = { name: name, meetings: chosen().map(function (i) { return i.value; }), seats: seats, total: total() };
    var btn = form.querySelector('.su-submit');
    btn.disabled = true; btn.textContent = 'Отправляем…';
    setTimeout(function () {
      ticket.classList.add('tearing');           // корешок отрывается по пунктиру и падает
      setTimeout(function () {
        var when = payload.meetings.length ? payload.meetings.join(', ') : 'пока без выбранных встреч';
        dlg.querySelector('.su-summary').textContent = (payload.name ? payload.name + ', вы' : 'Вы') + ' записались мысленно: ' + when +
          ' · ' + seats + ' ' + (seats === 1 ? 'место' : seats < 5 ? 'места' : 'мест') + (payload.total ? ' · ' + fmt(payload.total).replace(' ', ' ') : '');
        body.hidden = true; stub.hidden = true; done.hidden = false;
        ticket.classList.remove('tearing'); ticket.classList.add('torn');
      }, 1100);
    }, 700);
  });
})();

// Хоровод героев: нажми на фигуру, она подсвечивается, вырастает слева, а справа открывается карточка.
// Фотографии героев: положи файлы в img/heroes/photos/ с именами <ключ>-1.jpg, <ключ>-2.jpg, <ключ>-3.jpg
// (ключи: david, vianne, sally, jo, rebecca, sherlock, behemoth, elizabeth, jane, dorian, peregrine, coraline).
(function () {
  var HS = [0.939, 0.929, 0.928, 0.931, 0.918, 0.947, 0.935, 0.972, 0.906, 0.989, 0.943, 0.67];   // высота каждой фигуры относительно самой высокой, чтобы Коралина не выросла до размера остальных
  // Герои, для которых готова раскрашенная версия: бумажная фигура переворачивается и оказывается цветной.
  var COLORED = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true };
  // Фразы героев: у части настоящие цитаты, у остальных фраза «в духе героя» (подпись это честно говорит).
  var QUOTES = [
    ['Страшнее того, что в тумане, только то, что мы делаем друг с другом в страхе.', 'в духе героя'],
    ['Пост — время отказывать себе. Я предлагаю попробовать наоборот.', 'в духе героя'],
    ['Я так хотела обычной жизни, а магия меня не спросила.', 'в духе героя'],
    ['Мне так надоело, что говорят, будто женщина годна только для любви.', 'из романа'],
    ['Прошлой ночью мне снилось, что я снова в Мэндерли.', 'первая фраза романа'],
    ['Исключите невозможное — вот и правда.', 'из рассказов Дойла'],
    ['Примус починить? Шахматы? Пожалуйста. Только без обмана, я кот честный.', 'в духе героя'],
    ['Я бы легко простила его гордость, если бы он не задел мою.', 'из романа'],
    ['Я не птица, и никакие сети не поймают меня: я свободный человек с независимой волей.', 'из романа'],
    ['Как это грустно! Я состарюсь, стану отвратителен, а эта картина навсегда останется юной.', 'из романа'],
    ['У нас всегда третье сентября 1940 года, и нас это устраивает.', 'в духе героя'],
    ['Здесь всё слишком идеально. Так не бывает.', 'в духе героя']
  ];
  var HEROES = [
    { key: 'david', name: 'Дэвид Дрэйтон', book: '«Мгла»', author: 'Стивен Кинг', year: '1980', film: 'фильм 2007, Фрэнк Дарабонт', month: 'Сентябрь 2026',
      blurb: 'Художник, который приехал за продуктами и застрял в супермаркете вместе с сыном. За стеклом густая мгла, в ней кто-то шевелится, а внутри чем дольше сидишь взаперти, тем страшнее становятся уже не чудовища, а люди.',
      fact: 'В нашем клубе победил фильм: у него самый неожиданный финал.' },
    { key: 'vianne', name: 'Вианн Роше', book: '«Шоколад»', author: 'Джоанн Харрис', year: '1999', film: 'фильм 2000, Лассе Халльстрём', month: 'Октябрь 2026',
      blurb: 'Приезжает в тихую французскую деревню в начале Великого поста и открывает шоколадную лавку. Её сладости смущают мэра, а жители по одному начинают позволять себе то, чего давно хотели.',
      fact: 'Идеальная книга для пасмурного октября и горячей чашки.' },
    { key: 'sally', name: 'Салли Оуэнс', book: '«Практическая магия»', author: 'Элис Хоффман', year: '1995', film: 'фильм 1998, Гриффин Данн', month: 'Ноябрь 2026',
      blurb: 'Старшая из сестёр Оуэнс. В их семье на женщин лежит старое проклятие любви, а ещё они варят зелья и слышат чужие мысли. Салли мечтает о самой обычной жизни, но магия так просто не отпускает.',
      fact: 'В фильме Салли играет Сандра Буллок.' },
    { key: 'jo', name: 'Джо Марч', book: '«Маленькие женщины»', author: 'Луиза Мэй Олкотт', year: '1868', film: 'фильм 2019, Грета Гервиг', month: 'Декабрь 2026',
      blurb: 'Вторая из четырёх сестёр Марч. Пишет рассказы, срезает волосы и не хочет выходить замуж только потому, что так принято. Уют рождественской ёлки и большая шумная семья.',
      fact: 'Олкотт писала роман по просьбе издателя, который искал «книгу для девочек».' },
    { key: 'rebecca', name: 'Миссис де Винтер', book: '«Ребекка»', author: 'Дафна дю Морье', year: '1938', film: 'фильм 2020, Бен Уитли (Netflix)', month: 'Январь 2027',
      blurb: 'Героиня, у которой в книге нет даже имени. Она выходит замуж за богатого вдовца и переезжает в Мэндерли, где до сих пор живёт память о первой жене, Ребекке. Ей приходится соперничать с тенью.',
      fact: 'В экранизации 2020 года героиню сыграла Лили Джеймс, а Максима де Винтера Арми Хаммер.' },
    { key: 'sherlock', name: 'Шерлок Холмс', book: '«Собака Баскервилей»', author: 'Артур Конан Дойл', year: '1901–1902', film: 'много экранизаций, например «Шерлок» (эпизод 2012)', month: 'Февраль 2027',
      blurb: 'Знаменитый сыщик берётся за дело о родовом проклятии: по болотам Дартмура бродит чудовищная собака. Классика, где туман и здравый смысл спорят до последней страницы.',
      fact: 'Большую часть романа расследует доктор Уотсон, а Холмс появляется позже.' },
    { key: 'behemoth', name: 'Кот Бегемот', book: '«Мастер и Маргарита»', author: 'Михаил Булгаков', year: '1966–1967 (написан в 1928–1940)', film: 'сериал 2005, фильм 2024', month: 'Март 2027',
      blurb: 'Чёрный кот размером со свинью: любит примус, шахматы и пистолет. Часть свиты Воланда, которая устраивает в Москве представление, после которого никто не остаётся прежним.',
      fact: 'Ходит на задних лапах и ведёт себя как человек, а в нашей гирлянде он единственный кот.' },
    { key: 'elizabeth', name: 'Элизабет Беннет', book: '«Гордость и предубеждение»', author: 'Джейн Остин', year: '1813', film: 'фильм 2005, Джо Райт', month: 'Апрель 2027',
      blurb: 'Вторая из пяти сестёр Беннет: острый ум, чувство юмора и полное нежелание выходить замуж по расчёту. Мистер Дарси кажется ей невыносимо высокомерным, но первое впечатление бывает обманчивым.',
      fact: 'Первое название романа было «Первые впечатления».' },
    { key: 'jane', name: 'Джейн Эйр', book: '«Джейн Эйр»', author: 'Шарлотта Бронте', year: '1847', film: 'фильм 2011, Кэри Фукунага', month: 'Май 2027',
      blurb: 'Сирота, выросшая в строгом приюте, становится гувернанткой в поместье Торнфилд. Умная, самостоятельная и честная, она никогда не соглашается на меньшее, чем заслуживает.',
      fact: 'Бронте издала роман под псевдонимом Каррер Белл.' },
    { key: 'dorian', name: 'Дориан Грей', book: '«Портрет Дориана Грея»', author: 'Оскар Уайльд', year: '1890', film: 'фильм 2009, Оливер Паркер', month: 'Июнь 2027',
      blurb: 'Красавец, который загадал желание: пусть стареет портрет, а не он. Желание сбылось, и всё, что он делает дальше, оставляет следы только на холсте.',
      fact: 'Единственный роман Оскара Уайльда.' },
    { key: 'peregrine', name: 'Мисс Перегрин', book: '«Дом странных детей»', author: 'Ренсом Риггз', year: '2011', film: 'фильм 2016, Тим Бёртон', month: 'Июль 2027',
      blurb: 'Хозяйка приюта для необычных детей на далёком острове и, между прочим, птица: умеет превращаться и хранит один и тот же день в бесконечной петле времени.',
      fact: 'Роман построен вокруг настоящих старинных фотографий, которые собрал автор.' },
    { key: 'coraline', name: 'Коралина Джонс', book: '«Коралина»', author: 'Нил Гейман', year: '2002', film: 'мультфильм 2009, Генри Селик', month: 'Август 2027',
      blurb: 'Любопытная девочка находит в новой квартире маленькую дверь. За ней другая мама с пуговицами вместо глаз и слишком идеальная жизнь.',
      fact: 'Мультфильм снят кукольной анимацией: каждый кадр сделан вручную.' }
  ];

  var dlg = document.getElementById('hero-view'), rondo = document.querySelector('.rondo');
  if (!dlg || !dlg.showModal || !rondo) return;
  var quoteBox = dlg.querySelector('.hv-quote'), sayEl = dlg.querySelector('.hv-say'), srcEl = dlg.querySelector('.hv-src'), coverBox = dlg.querySelector('.hv-cover'), flip = dlg.querySelector('.hv-flip'), img = dlg.querySelector('.hv-img'), colorImg = dlg.querySelector('.hv-color'), card = dlg.querySelector('.hv-card'), stage = dlg.querySelector('.hv-stage');
  var eyebrow = dlg.querySelector('.hv-eyebrow'), title = dlg.querySelector('#hv-name'), book = dlg.querySelector('.hv-book');
  var blurb = dlg.querySelector('.hv-blurb'), facts = dlg.querySelector('.hv-facts'), photos = dlg.querySelector('.hv-photos'), count = dlg.querySelector('.hv-count');
  var current = 0, source = null, lastFocus = null, closing = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Герои, которых уже открывали, «затухают» на хороводе шумом, как на выключенном телевизоре.
  var SEEN_KEY = 'klub-seen-heroes', seen = [];
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch (e) { seen = []; }
  function paintSeen() {
    seen.forEach(function (n) { rondo.querySelectorAll('.gb[data-hero="' + n + '"]').forEach(function (b) { b.classList.add('seen'); }); });
  }
  function markSeen(i) {
    if (seen.indexOf(i) === -1) { seen.push(i); try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }
    paintSeen();
  }
  paintSeen();
  // Книги, которые клуб уже прочитал (в афише «прошёл»): герой в хороводе сразу цветной, при наведении становится бумажным
  var readCount = window.SEASON ? window.SEASON.readCount : 1;     // сколько первых месяцев сезона уже прошло (считает season.js по дате)
  rondo.querySelectorAll('.gb').forEach(function (b) { if (Number(b.dataset.hero) < readCount) b.classList.add('read'); });

  // Обложка по высоте равна блоку от верха заголовка до низа описания; ширина подбирается по пропорции обложки (543:850)
  var leftCol = dlg.querySelector('.hv-left');
  function sizeCover() {
    for (var k = 0; k < 4; k++) {
      var hgt = leftCol.getBoundingClientRect().height;
      var w = Math.max(84, Math.min(190, Math.round(hgt * 543 / 850)));
      coverBox.style.width = w + 'px';
    }
  }
  // Типографика: предлоги, союзы и тире не остаются в конце строки
  function nb(t) {   // короткие слова (до 3 букв) держатся со следующим, тире — с предыдущим; без длинных цепочек: ровность строк отдаём text-wrap
    var re = /(^|\s)(в|во|и|а|но|на|по|за|к|ко|с|со|у|о|об|от|до|из|не|ни|же|ли|бы|для|без|над|под|при|про|или|да|то|как)\s/gi;   // только предлоги, союзы и частицы; местоимения («что я снова») в цепочку не склеиваем
    return t.replace(re, '$1$2\u00a0').replace(re, '$1$2\u00a0').replace(/\s—/g, '\u00a0—');   // два прохода: цепочка коротких слов подряд («а не он»)
  }
  function nbTokens(t) { return nb(t).split(' '); }
  // Знак «конец главы» для каждого героя: вдавлен в бумагу карточки
  var ICONS = {"david": "<path d=\"M18 44a10 10 0 0 1 1-20 14 14 0 0 1 27 4 8 8 0 0 1 0 16z\"/><path d=\"M14 52h36M22 58h22\"/>", "vianne": "<path d=\"M12 26h34v10a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z\"/><path d=\"M46 30h4a6 6 0 0 1 0 12h-6\"/><path d=\"M22 20c-3-4 3-6 0-10M32 20c-3-4 3-6 0-10\"/>", "sally": "<path d=\"M40 12a22 22 0 1 0 12 32A18 18 0 0 1 40 12z\"/><path d=\"M50 14v8M46 18h8\"/>", "jo": "<path d=\"M50 8C30 10 16 26 14 46l-4 10 10-4C40 50 54 34 50 8z\"/><path d=\"M14 50 36 28\"/>", "rebecca": "<circle cx=\"32\" cy=\"32\" r=\"24\"/><path d=\"M24 44V20h10a7 7 0 0 1 0 14H24M33 34l9 10\"/>", "sherlock": "<circle cx=\"27\" cy=\"27\" r=\"16\"/><path d=\"M39 39l16 16\"/><path d=\"M19 24a10 10 0 0 1 8-6\"/>", "behemoth": "<path d=\"M12 12l10 8h20l10-8v24a20 20 0 0 1-40 0z\"/><path d=\"M24 34v2M40 34v2M29 42l3 3 3-3\"/>", "elizabeth": "<rect x=\"8\" y=\"16\" width=\"48\" height=\"34\" rx=\"4\"/><path d=\"M9 19l23 18 23-18\"/>", "jane": "<circle cx=\"22\" cy=\"22\" r=\"12\"/><circle cx=\"22\" cy=\"22\" r=\"4\"/><path d=\"M31 31 54 54M44 44l6-6M50 50l6-6\"/>", "dorian": "<rect x=\"12\" y=\"6\" width=\"40\" height=\"52\" rx=\"3\"/><rect x=\"18\" y=\"12\" width=\"28\" height=\"40\"/><ellipse cx=\"32\" cy=\"27\" rx=\"7\" ry=\"9\"/><path d=\"M20 52c2-8 7-10 12-10s10 2 12 10\"/>", "peregrine": "<path d=\"M16 8h32M16 56h32M18 8c0 14 14 16 14 24S18 42 18 56M46 8c0 14-14 16-14 24s14 10 14 24\"/>", "coraline": "<circle cx=\"32\" cy=\"32\" r=\"24\"/><circle cx=\"32\" cy=\"32\" r=\"16\"/><circle cx=\"26\" cy=\"27\" r=\"2\"/><circle cx=\"38\" cy=\"27\" r=\"2\"/><circle cx=\"26\" cy=\"37\" r=\"2\"/><circle cx=\"38\" cy=\"37\" r=\"2\"/>"};
  var markBox = dlg.querySelector('.hv-mark');
  // Телефон: имя героя уменьшается, пока самое длинное слово не встанет в колонку рядом с обложкой (зазор до обложки 10 px)
  // Телефон: один размер имени героя для ВСЕХ героев — по самому длинному имени (не больше двух строк и зазор до обложки), чтобы группа выглядела одинаково
  var fitRaf = 0;
  window.addEventListener('resize', function () { if (!dlg.open) return; cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitName); });   // размер имени пересчитывается при изменении ширины окна
  function fitName() {
    if (window.innerWidth > 520) { title.style.fontSize = ''; title.style.marginTop = ''; return; }
    var col = title.getBoundingClientRect().width;   // ширина колонки не зависит от кегля, поэтому размер считаем сразу, без сброса (иначе заголовок мигает)
    if (!col) return;
    var cs = getComputedStyle(title), probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-family:' + cs.fontFamily + ';font-weight:' + cs.fontWeight + ';text-transform:' + cs.textTransform + ';letter-spacing:' + cs.letterSpacing;
    document.body.appendChild(probe);
    function lines(words, fs) {
      probe.style.fontSize = fs + 'px'; var n = 1, cur = 0, sp; probe.textContent = ' '; sp = probe.getBoundingClientRect().width;
      for (var k = 0; k < words.length; k++) {
        probe.textContent = words[k]; var w = probe.getBoundingClientRect().width;
        if (w > col) return 99;
        if (cur === 0) cur = w; else if (cur + sp + w <= col) cur += sp + w; else { n++; cur = w; }
      }
      return n;
    }
    // максимальный размер, при котором имя умещается в колонку: не больше двух строк, самое длинное слово целиком; потолок 56 px
    var words = title.textContent.split(' '), f = 56;
    while (f > 22 && lines(words, f) > 2) f -= 0.25;
    probe.remove();
    title.style.fontSize = f + 'px';
    title.style.marginTop = f >= 44 ? '10px' : '';   // у крупного имени от «Месяц год» над ним 20 (10 строки + 10 отступ)
  }
  function fill(i) {
    var h = HEROES[i]; current = i; markSeen(i);
    img.src = 'img/heroes/v' + (i < 9 ? '0' : '') + (i + 1) + '.webp'; img.alt = h.name;
    flip.style.setProperty('--hs', HS[i]);
    flip.classList.remove('flipped');
    if (COLORED[i]) { colorImg.src = 'img/heroes/c' + (i < 9 ? '0' : '') + (i + 1) + '.webp'; colorImg.alt = h.name + ' в цвете'; flip.classList.add('has-color'); } else { colorImg.removeAttribute('src'); flip.classList.remove('has-color'); }
    eyebrow.textContent = ''; [['ey-a', 'Герой сезона'], ['ey-s', ' · '], ['ey-m', h.month.replace(' ', ' ')]].forEach(function (x) { var e = document.createElement('span'); e.className = x[0]; e.textContent = x[1]; eyebrow.appendChild(e); });
    title.textContent = h.name.replace(/\s(де)\s/i, ' $1 ');   // «де Винтер» не рвётся: «де» не остаётся одно в строке
     book.textContent = ''; [['bk-t', h.book], ['bk-s', ', '], ['bk-a', h.author]].forEach(function (x) { var e = document.createElement('span'); e.className = x[0]; e.textContent = x[0] === 'bk-t' ? nb(x[1]) : x[1]; book.appendChild(e); });
    blurb.textContent = nb(h.blurb);
    // фраза: облачко слева от героя, текст печатается по буквам, когда герой перевернулся на цветную сторону
    sayEl.textContent = '';
    var nch = 0;
    nbTokens(QUOTES[i][0]).forEach(function (w, k, arr) {
      var wd = document.createElement('span'); wd.className = 'w';
      w.split('').forEach(function (ch) { var c = document.createElement('span'); c.className = 'ch'; c.style.setProperty('--i', nch++); c.textContent = ch; wd.appendChild(c); });
      sayEl.appendChild(wd); if (k < arr.length - 1) { sayEl.appendChild(document.createTextNode(' ')); nch++; }
    });
    srcEl.textContent = nb('— ' + QUOTES[i][1]).replace(/^—\s/, '— ');   // «— из романа» не рвётся
    srcEl.style.setProperty('--n', nch);
    clearTimeout(quoteTimer); quoteBox.classList.remove('go');
    facts.textContent = '';
    [['Книга', h.year], ['Экранизация', h.film], ['Интересно', h.fact]].forEach(function (r) {
      var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = nb(r[1]); facts.appendChild(dt); facts.appendChild(dd);
    });
    photos.textContent = '';
    for (var n = 1; n <= 3; n++) {
      var s = document.createElement('div'); s.className = 'hv-slot'; s.textContent = 'место под фото';
      photos.appendChild(s);
      (function (slot, url) {
        var t = new Image(); t.onload = function () { slot.textContent = ''; slot.classList.add('has'); t.alt = ''; slot.appendChild(t); };
        t.src = url;
      })(s, 'img/heroes/photos/' + h.key + '-' + n + '.jpg');
    }
    // Обложка книги: img/heroes/covers/<ключ>.jpg (пока нет файла, показываем пустую рамку)
    coverBox.textContent = ''; coverBox.classList.remove('has'); coverBox.setAttribute('aria-hidden', 'true');
    (function (url, name) {
      var ci = new Image();
      ci.onload = function () { coverBox.textContent = ''; ci.alt = 'Обложка книги ' + name; coverBox.classList.add('has'); coverBox.removeAttribute('aria-hidden'); coverBox.appendChild(ci); sizeCover(); };
      ci.onerror = function () { coverBox.textContent = 'обложка'; };
      ci.src = url;
    })('img/heroes/covers/' + h.key + '.jpg?v=2', h.book.replace(/[«»]/g, ''));
    markBox.innerHTML = '<svg viewBox="0 0 64 64" focusable="false" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[h.key] || '') + '</svg>';
    fitName(); setTimeout(fitName, 600); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
    count.textContent = (i + 1) + ' / ' + HEROES.length;
    setTimeout(sizeCover, 0);
    card.scrollTop = 0;
    card.querySelectorAll(':scope > *').forEach(function (el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
  }

  function flyFrom(el) {
    if (reduce || !el || !img.animate) return;
    var a = el.getBoundingClientRect(), b = flip.getBoundingClientRect();
    if (!b.width || !a.width) return;
    var sx = a.width / b.width, sy = a.height / b.height;
    var dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    flip.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.2,1)' });
    card.animate([{ transform: 'translateX(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 550, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  }

  // Анимации закрытия оставляют «залипший» конечный кадр: без сброса при следующем открытии фигура оставалась маленькой, а карточка невидимой.
  function cancelAnims() {
    [flip, card].forEach(function (el) { if (el.getAnimations) el.getAnimations().forEach(function (an) { an.cancel(); }); });
  }
  var flipTimer, quoteTimer;
  function scheduleFlip() {
    clearTimeout(flipTimer);
    clearTimeout(quoteTimer);
    if (COLORED[current]) flipTimer = setTimeout(function () { flip.classList.add('flipped'); }, reduce ? 0 : 400);
    quoteTimer = setTimeout(function () { quoteBox.classList.add('go'); }, reduce ? 0 : (COLORED[current] ? 1000 : 700));
  }
  function open(btn) {
    if (closing) return;
    source = btn; lastFocus = btn;
    var i = Number(btn.dataset.hero);
    btn.classList.add('on'); rondo.classList.add('paused');
    setTimeout(function () {                       // сначала фигура заливается, потом вырастает
      cancelAnims();
      fill(i);
      document.documentElement.classList.add('modal-open');
      dlg.showModal();
      card.scrollTop = 0; requestAnimationFrame(function () { card.scrollTop = 0; });   // фокус на стрелке внизу не должен прокручивать карточку
      if (document.activeElement && document.activeElement !== document.body) { try { card.setAttribute('tabindex', '-1'); card.focus({ preventScroll: true }); } catch (e) {} }   // ни одна стрелка не «горит» при открытии
      void dlg.offsetWidth;
      dlg.classList.add('open');
      flyFrom(btn.querySelector('.gb-hit'));
      scheduleFlip();
    }, reduce ? 0 : 260);
  }
  function close() {
    if (closing) return; closing = true;
    var target = rondo.querySelector('.gb[data-hero="' + current + '"]');
    var back = target && target.querySelector('.gb-hit');
    if (!reduce && back && flip.animate) {
      var a = back.getBoundingClientRect(), b = flip.getBoundingClientRect();
      var sx = a.width / b.width, sy = a.height / b.height;
      var dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
      flip.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }], { duration: 450, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
      card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(60px)' }], { duration: 300, fill: 'forwards' });
    }
    dlg.classList.remove('open');
    setTimeout(function () {
      dlg.close(); closing = false; cancelAnims();
      document.documentElement.classList.remove('modal-open');
      rondo.classList.remove('paused');
      rondo.querySelectorAll('.gb.on').forEach(function (n) { n.classList.remove('on'); });
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }, reduce ? 0 : 480);
  }
  // Строка афиши для героя: порядок героев совпадает с порядком месяцев (сентябрь ... август).
  function goToRow(i) {
    var rows = document.querySelectorAll('#schedule .row');
    var row = rows[i];
    if (!row) { var s = document.getElementById('schedule'); if (s) s.scrollIntoView({ behavior: 'smooth' }); return; }
    var more = row.closest('.more'), btn = document.querySelector('.more-btn');
    var wait = 0;
    if (more && !more.classList.contains('open') && btn) { btn.click(); wait = reduce ? 0 : 950; }   // строка спрятана: раскрываем афишу
    setTimeout(function () {
      row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
      setTimeout(function () { row.classList.remove('flash'); }, 6600);
    }, wait);
  }
  // Перелистывание героев: текущий уходит в сторону и гаснет, следующий приезжает с другой стороны, карточка едет следом
  var paging = false;
  function go(step) {
    if (paging) return;
    var i = (current + step + HEROES.length) % HEROES.length;
    function swap() {
      rondo.querySelectorAll('.gb.on').forEach(function (n) { n.classList.remove('on'); });
      var t = rondo.querySelector('.gb[data-hero="' + i + '"]'); if (t) { t.classList.add('on'); lastFocus = t; }
      fill(i);
      scheduleFlip();
    }
    if (reduce || !flip.animate || !card.animate) { swap(); return; }
    paging = true;
    clearTimeout(flipTimer); clearTimeout(quoteTimer); quoteBox.classList.remove('go');
    flip.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: (-step * 70) + 'px 0' }], { duration: 260, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    card.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: (-step * 28) + 'px 0' }], { duration: 240, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    setTimeout(function () {
      cancelAnims();
      swap();
      flip.animate([{ opacity: 0, translate: (step * 90) + 'px 0' }, { opacity: 1, translate: '0 0' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.2,1)' });
      card.animate([{ opacity: 0, translate: (step * 28) + 'px 0' }, { opacity: 1, translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.2,.9,.2,1)' });
      paging = false;
    }, 260);
  }


  rondo.querySelectorAll('.gb').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  dlg.addEventListener('click', function (e) {
    if (e.target.closest('.hv-link')) {            // «Смотреть в афише»: закрыть карточку и подвести к строке этого героя
      e.preventDefault();
      var idx = current;
      close();
      setTimeout(function () { goToRow(idx); }, reduce ? 0 : 560);
      return;
    }
    if (e.target.closest('[data-hv-close]')) { close(); return; }
    if (e.target.closest('[data-hv-prev]')) { go(-1); return; }
    if (e.target.closest('[data-hv-next]')) { go(1); return; }
    if (e.target === dlg || e.target === stage) { close(); return; }        // пустое место: герой встаёт обратно в хоровод
    if (e.target === img || e.target === colorImg || e.target === flip) { if (transparentAt(e)) close(); }   // прозрачная часть рамки фигуры тоже «пустое место»
  });

  // Попали ли в прозрачный пиксель показанной картинки героя
  var alphaCache = {};
  function transparentAt(e) {
    var el = flip.classList.contains('flipped') && colorImg.getAttribute('src') ? colorImg : img;
    if (!el.complete || !el.naturalWidth) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return true;
    var c = alphaCache[el.src];
    if (!c) {
      try { c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight; c.getContext('2d').drawImage(el, 0, 0); alphaCache[el.src] = c; } catch (err) { return false; }
    }
    try { return c.getContext('2d').getImageData(Math.min(c.width - 1, Math.floor(x * c.width)), Math.min(c.height - 1, Math.floor(y * c.height)), 1, 1).data[3] < 20; } catch (err) { return false; }
  }
  // Планшет: крестик выносим из карточки на уровень окна, чтобы он не занимал место в карточке; на других экранах он остаётся внутри
  var closeBtn = card.querySelector('.hv-close'), tabletMQ = window.matchMedia('(max-width: 520px)');
  function placeClose() { if (!closeBtn) return; if (tabletMQ.matches) { if (closeBtn.parentNode !== dlg) dlg.appendChild(closeBtn); } else if (closeBtn.parentNode !== card) card.insertBefore(closeBtn, card.firstChild); }
  placeClose(); tabletMQ.addEventListener('change', placeClose);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); });

  // Фотографии в карточке героя растягиваются по высоте, если под ними есть свободное место (но не выше квадрата), остальное остаётся на месте
  function growPhotos() {
    photos.style.removeProperty('height'); photos.style.removeProperty('flex');
    if (!dlg.open || !photos.offsetHeight) return;
    var foot = card.querySelector('.hv-foot'); if (!foot) return;
    var gap = parseFloat(getComputedStyle(card).rowGap) || 0;
    var spare = foot.getBoundingClientRect().top - photos.getBoundingClientRect().bottom - gap;
    if (spare < 6) return;
    var slot = photos.querySelector('.hv-slot'), w = slot ? slot.getBoundingClientRect().width : 0;
    var h = photos.getBoundingClientRect().height;
    var target = Math.min(h + spare, w);   // не выше квадрата
    if (target > h + 2) { photos.style.setProperty('flex', 'none', 'important'); photos.style.setProperty('height', Math.floor(target) + 'px', 'important'); }
  }
  var growRaf = 0;
  function scheduleGrow() { cancelAnimationFrame(growRaf); growRaf = requestAnimationFrame(growPhotos); }
  window.addEventListener('resize', scheduleGrow);
  new MutationObserver(function () { scheduleGrow(); setTimeout(growPhotos, 700); }).observe(dlg, { attributes: true, attributeFilter: ['open', 'class'] });
  photos.addEventListener('load', scheduleGrow, true);
  document.querySelector('[data-hv-next]').addEventListener('click', function () { setTimeout(growPhotos, 50); });
  document.querySelector('[data-hv-prev]').addEventListener('click', function () { setTimeout(growPhotos, 50); });

  // Фото героя на маленьком экране: нажатие увеличивает, ещё нажатие (или Esc) закрывает
  function closeZoom() { var z = dlg.querySelector('.hv-zoom'); if (z) z.remove(); return !!z; }
  photos.addEventListener('click', function (e) {
    var slot = e.target.closest('.hv-slot.has'); if (!slot || window.innerWidth > 900) return;
    var src = slot.querySelector('img'); if (!src) return;
    closeZoom();
    var z = document.createElement('div'), im = new Image(); z.className = 'hv-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Фотография крупно');
    im.src = src.src; im.alt = ''; z.appendChild(im); z.addEventListener('click', function (ev) { ev.stopPropagation(); closeZoom(); });
    dlg.appendChild(z);
  });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlg.querySelector('.hv-zoom')) { e.preventDefault(); e.stopImmediatePropagation(); closeZoom(); } }, true);
  dlg.addEventListener('cancel', function (e) { if (closeZoom()) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  dlg.addEventListener('close', closeZoom);
})();

// Хоровод крутится сам и слушается руки: потяни за руку или за сам хоровод, стрелки с клавиатуры, клик по руке раскручивает.
(function () {
  var rondo = document.querySelector('.rondo'), track = rondo && rondo.querySelector('.rondo-track');
  if (!rondo || !track) return;
  var sets = track.querySelectorAll('.rondo-set');
  if (sets.length < 2) return;
  var hand = rondo.querySelector('.rondo-hand');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOOP_SEC = 60, x = 0, boost = 0, dragging = false, startX = 0, lastX = 0, lastT = 0, vel = 0, moved = false, hovering = false, prev = 0;
  function period() { return sets[1].getBoundingClientRect().left - sets[0].getBoundingClientRect().left; }
  function wrap(v, p) { v = v % p; return v > 0 ? v - p : v; }
  rondo.classList.add('js-rondo');
  function frame(t) {
    var dt = prev ? Math.min((t - prev) / 1000, .05) : 0; prev = t;
    var p = period();
    if (p > 0 && !dragging) {
      var auto = (reduce || hovering || rondo.classList.contains('paused')) ? 0 : -p / LOOP_SEC;
      x += (auto + boost) * dt;
      boost *= Math.exp(-dt * 1.6);
      if (Math.abs(boost) < 1) boost = 0;
    }
    if (p > 0) { x = wrap(x, p); track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function down(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; moved = false; startX = lastX = e.clientX; lastT = performance.now(); vel = 0; boost = 0;
  }
  function move(e) {
    if (!dragging) return;
    var now = performance.now(), dx = e.clientX - lastX;
    if (!moved && Math.abs(e.clientX - startX) > 6) { moved = true; rondo.classList.add('dragging'); try { rondo.setPointerCapture(e.pointerId); } catch (er) {} }
    if (moved) {
      x += dx;
      var dtm = Math.max(now - lastT, 1); vel = vel * .6 + (dx / dtm * 1000) * .4;
    }
    lastX = e.clientX; lastT = now;
  }
  function up() {
    if (!dragging) return;
    dragging = false; rondo.classList.remove('dragging');
    if (moved) { boost = Math.max(-2600, Math.min(2600, vel)) - (period() > 0 ? -period() / LOOP_SEC : 0); }   // бросок: продолжает крутиться по инерции
  }
  rondo.addEventListener('pointerdown', down);
  rondo.addEventListener('pointermove', move);
  rondo.addEventListener('pointerup', up);
  rondo.addEventListener('pointercancel', up);
  rondo.addEventListener('mouseenter', function () { hovering = true; });
  rondo.addEventListener('mouseleave', function () { hovering = false; });
  // после перетаскивания клик по герою не должен открывать карточку
  rondo.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  // колесо мыши по хороводу подкручивает его
  rondo.addEventListener('wheel', function (e) {
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (d) { boost -= d * 3; e.preventDefault(); }
  }, { passive: false });
  if (hand) {
    hand.addEventListener('click', function () { if (!moved) boost -= 900; });   // клик: раскрутить
    hand.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { boost -= 900; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { boost += 900; e.preventDefault(); }
    });
  }
})();

// Видео на диване: без звука и по кругу; у тех, кто просит меньше движения, стоит на первом кадре.
(function () {
  var v = document.querySelector('.big-video');
  if (!v) return;
  v.muted = true; v.loop = true;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); return; }
  var p = v.play(); if (p && p.catch) p.catch(function () {});
})();

/* Плавающее меню-док: показывает текущий раздел, при наведении раскрывается вверх списком всех разделов */
(function () {
  var SECTIONS = [['top', 'Начало'], ['now', 'Сейчас читаем'], ['format', 'Формат'], ['heroes', 'Герои сезона'], ['schedule', 'Расписание'], ['photos', 'Фотографии'], ['contacts', 'Контакты']];
  var items = SECTIONS.map(function (s) { return { id: s[0], name: s[1], el: document.getElementById(s[0]) }; }).filter(function (s) { return s.el; });
  if (!items.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dock = document.createElement('nav');
  dock.className = 'dock'; dock.setAttribute('aria-label', 'Быстрый переход по разделам');
  var html = '<div class="dock-view"><ul class="dock-list">';
  items.forEach(function (s, i) {
    html += '<li><a class="dock-item" href="#' + s.id + '" data-i="' + i + '"><span class="dock-t">' + s.name + '</span></a></li>';
  });
  dock.innerHTML = html + '</ul></div><button class="dock-up" type="button" aria-label="Наверх"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20V5M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/></svg></button>';
  dock.querySelector('.dock-up').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); this.blur(); });
  dock.style.setProperty('--count', items.length);
  var cta = document.createElement('a'); cta.className = 'dock-cta'; cta.href = '#now'; cta.textContent = 'Записаться';
  if (window.SEASON && window.SEASON.over) { cta.href = '#contacts'; cta.textContent = 'В чат'; }
  cta.addEventListener('click', function (e) { var b = document.querySelector('.hero-ctas [data-signup]') || document.querySelector('[data-signup]'); if (b) { e.preventDefault(); b.click(); } });
  dock.appendChild(cta);
  dock.insertBefore(dock.querySelector('.dock-up'), dock.firstChild);
  document.body.appendChild(dock);
  var links = [].slice.call(dock.querySelectorAll('.dock-item')), cur = -1;

  function setActive(i) {
    if (i === cur) return;
    cur = i;
    dock.style.setProperty('--cur', i);
    links.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.4, idx = 0;
    items.forEach(function (s, k) { if (s.el.getBoundingClientRect().top <= line) idx = k; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = items.length - 1;
    setActive(idx);
    dock.classList.toggle('show', window.scrollY > window.innerHeight * 0.5);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  update();

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var s = items[Number(a.dataset.i)];
      s.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      dock.classList.remove('open');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
  });
  // на сенсорных экранах: касание по плашке раскрывает, касание вне её закрывает
  dock.addEventListener('click', function (e) {
    if (e.target.closest('.dock-item') && !dock.classList.contains('open') && !window.matchMedia('(hover: hover)').matches) { e.preventDefault(); dock.classList.add('open'); }
  }, true);
  document.addEventListener('pointerdown', function (e) { if (!dock.contains(e.target)) dock.classList.remove('open'); });
})();

/* Счёт сезона: цифры «крутятся» как барабан и останавливаются на нужном значении */
(function () {
  var nums = document.querySelectorAll('.score .n');
  if (!nums.length) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  nums.forEach(function (n, k) {
    var val = Number(n.textContent.trim());
    if (isNaN(val)) return;
    var steps = 5 + k * 2, start = ((val - steps) % 10 + 10) % 10, html = '';
    for (var i = 0; i <= steps; i++) html += '<i>' + ((start + i) % 10) + '</i>';
    n.setAttribute('aria-hidden', 'true');
    n.innerHTML = '<span class="roll"><span class="roll-col" style="--steps:' + steps + '">' + html + '</span></span>';
    var col = n.querySelector('.roll-col');
    function go() { setTimeout(function () { col.classList.add('go'); }, (document.documentElement.classList.contains('has-pl') ? 1750 : 3050) + k * 150); }
    if (document.documentElement.classList.contains('preloading')) document.addEventListener('pl:done', go, { once: true }); else go();
  });
})();

/* Субтитры на видео: реплики появляются по словам, пока ребята «говорят» (привязаны ко времени видео и повторяются на каждом круге) */
(function () {
  var v = document.querySelector('.big-video');
  if (!v) return;
  var slot = v.closest('.slot');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINES = [   // side: L — парень слева в жёлтом свитере, R — девушка справа
    { t0: 0.5, t1: 2.2, side: 'L', text: '— А вы фильм уже видели?' },
    { t0: 2.5, t1: 5.0, side: 'R', text: '— Видела! Но в книге всё было иначе.' },
    { t0: 5.2, t1: 6.4, side: 'L', text: '— Правда? Расскажи!' },
    { t0: 7.0, t1: 8.2, side: 'R', text: '— Там совсем другой финал!' },
    { t0: 8.6, t1: 10.0, side: 'L', text: '— Точно, давайте обсудим.' }
  ];
  var box = document.createElement('div');
  box.className = 'vsubs'; box.setAttribute('aria-hidden', 'true');
  LINES.forEach(function (l) {
    var p = document.createElement('p'); p.className = 'vs ' + l.side;
    l.words = l.text.split(' ').map(function (w) { var s = document.createElement('span'); s.textContent = w; p.appendChild(s); p.appendChild(document.createTextNode(' ')); return s; });
    l.el = p; box.appendChild(p);
  });
  slot.appendChild(box);
  // для экранных читалок: смысл видео в подписи к нему
  v.setAttribute('aria-label', 'Участники клуба смеются на диване и спорят: книга или фильм лучше');

  function frame() {
    var t = v.currentTime;
    var last = -1;
    LINES.forEach(function (l, i) { if (reduce || t >= l.t0) last = i; });
    LINES.forEach(function (l, i) {
      var on = i <= last;       // фразы остаются на экране, новая дописывается снизу, старые уезжают вверх и затуманиваются
      l.el.classList.toggle('on', on);
      var d = on ? Math.min(last - i, 4) : 0;
      for (var q = 1; q <= 4; q++) l.el.classList.toggle('d' + q, d === q);
      var k = reduce ? l.words.length : Math.max(0, Math.min(l.words.length, Math.ceil((t - l.t0) / ((l.t1 - l.t0) * 0.7) * l.words.length)));
      l.words.forEach(function (s, j) { s.classList.toggle('w', j < k); });
    });
    if (!v.paused && !reduce) requestAnimationFrame(frame);
  }
  v.addEventListener('play', function () { requestAnimationFrame(frame); });
  v.addEventListener('seeked', frame);
  v.addEventListener('timeupdate', function () { if (v.paused || reduce) frame(); });
  frame();
})();

/* Планшет: размеры кнопок первого экрана нужны, чтобы реплики встали ровно над ними по центру */
(function () {
  var ctas = document.querySelector('.hero-ctas'), hero = document.querySelector('.hero');
  if (!ctas || !hero) return;
  function set() { var r = ctas.getBoundingClientRect(); hero.style.setProperty('--ctas-w', Math.round(r.width) + 'px'); hero.style.setProperty('--ctas-h', Math.round(r.height) + 'px'); }
  set(); window.addEventListener('resize', set); window.addEventListener('load', set);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
  document.addEventListener('pl:done', set);
})();

/* Футер: катушка той же высоты, что цитата вместе с автором (широкие экраны) */
(function () {
  var txt = document.querySelector('.f-bye-txt'), reel = document.querySelector('.f-bye .reel-sticker'), foot = document.querySelector('footer');
  if (!txt || !reel || !foot) return;
  function fit() {
    if (window.innerWidth < 861) { foot.style.removeProperty('--reel-h'); return; }
    var r = document.createRange(), a = txt.querySelector('.f-bye-t'), b = txt.querySelector('.f-bye-s');
    if (!a || !b) return;
    r.setStartBefore(a); r.setEndAfter(b);
    var h = Math.round(r.getBoundingClientRect().height);
    if (h > 40 && h < 400) foot.style.setProperty('--reel-h', h + 'px');
  }
  fit(); window.addEventListener('resize', fit); window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();


/* Счёт: двоеточие ровно посередине между видимыми цифрами (ширина «книга» и «фильм» разная, у цифр разный воздух) */
(function () {
  var score = document.querySelector('.hero .score');
  if (!score) return;
  var cv = document.createElement('canvas').getContext('2d');
  function ink(el, txt) {
    var cs = getComputedStyle(el), size = 200;
    cv.font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
    var m = cv.measureText(txt), k = parseFloat(cs.fontSize) / size;
    return ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 - m.width / 2) * k;
  }
  function mid(el) { var r = el.getBoundingClientRect(); return r.left + r.width / 2; }
  function place() {
    var ns = score.querySelectorAll('.n'), c = score.querySelector('.c');
    if (!ns.length || !c) return;
    c.style.transform = '';
    var a = mid(ns[0]) + ink(ns[0], ns[0].textContent), b = mid(ns[1]) + ink(ns[1], ns[1].textContent);
    var cc = mid(c) + ink(c, c.textContent);
    c.style.transform = 'translateX(' + ((a + b) / 2 - cc).toFixed(2) + 'px)';
  }
  place();
  window.addEventListener('resize', place);
  window.addEventListener('load', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();


/* Герои сезона: высота ряда подписей считается по самой длинной; подсказки — одной ширины, когда стоят столбиком */
(function () {
  var rondo = document.querySelector('.rondo'), ui = rondo && rondo.querySelector('.rondo-ui');
  if (!rondo || !ui) return;
  var legend = ui.querySelector('.rondo-legend'), hand = ui.querySelector('.rondo-hand');
  function layout() {
    var set = rondo.querySelector('.rondo-set');
    if (set) {
      rondo.style.removeProperty('--set-h');
      var top = set.getBoundingClientRect().top, max = 0, caps = set.querySelectorAll('.rf-cap');
      for (var i = 0; i < caps.length; i++) { var r = caps[i].getBoundingClientRect(); if (r.height) max = Math.max(max, r.bottom - top); }
      if (max) rondo.style.setProperty('--set-h', Math.ceil(max) + 'px');
    }
    if (legend && hand) {
      legend.style.minWidth = hand.style.minWidth = ''; legend.style.minHeight = hand.style.minHeight = '';
      legend.style.width = '';
      var vis = legend.querySelector('.lg-short'); if (!vis || !vis.offsetWidth) vis = legend.querySelector('.lg-long');
      if (vis && legend.getBoundingClientRect().height > 40) {   // текст перенёсся на две строки: плашка заканчивается там, где кончается самая длинная строка
        var rg = document.createRange(); rg.selectNodeContents(vis);
        var rs = rg.getClientRects(), lo = 1e9, hi = 0; for (var q = 0; q < rs.length; q++) { lo = Math.min(lo, rs[q].left); hi = Math.max(hi, rs[q].right); }
        var cs = getComputedStyle(legend), extra = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
        if (hi > lo) legend.style.width = Math.ceil(hi - lo + extra + 1) + 'px';
      }
      var l = legend.getBoundingClientRect(), h = hand.getBoundingClientRect();
      if (h.top > l.bottom - 2 && window.innerWidth <= 360) {   // одной ширины — только на самых узких экранах (до 360 px)
        var w = Math.max(l.width, h.width), box = ui.getBoundingClientRect().width;
        if (box - w < 40) w = box;
        legend.style.minWidth = hand.style.minWidth = Math.ceil(w) + 'px';
      }
    }
  }
  layout(); window.addEventListener('resize', layout); window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  setTimeout(layout, 600);
})();

/* Афиша: «запись открыта» в углу карточки (521–900 px) — только если от года до точки остаётся не меньше 20 px; иначе переносим её над кнопку */
(function () {
  var rows = document.querySelectorAll('#schedule .row');
  if (!rows.length) return;
  function place() {
    [].forEach.call(rows, function (r) {
      var st = r.querySelector('.st.open'), yr = r.querySelector('.m small');
      if (!st || !yr) return;
      st.classList.remove('below');
      if (window.innerWidth < 450 || window.innerWidth > 900) return;
      var a = yr.getBoundingClientRect(), b = st.getBoundingClientRect();
      if (b.top < a.bottom && b.left - a.right < 20) st.classList.add('below');
    });
  }
  place(); window.addEventListener('resize', place); window.addEventListener('load', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();

/* Афиша, 521–900 px: кнопка «Записаться» / плашка «прошёл · победил фильм» встают в строку с табами только если все три таба помещаются в одну строку и после последнего остаётся ≥ 20 px */
(function () {
  var rows = document.querySelectorAll('#schedule .row');
  if (!rows.length) return;
  function measure() {
    [].forEach.call(rows, function (r) {
      r.classList.remove('inline-act');
      if (window.innerWidth <= 520 || window.innerWidth > 900) return;
      var act = r.querySelector('.acts .btn') || r.querySelector(':scope > .st.past'), dates = r.querySelector('.dates');
      if (!act || !dates) return;
      r.classList.add('inline-act');
      var cs = getComputedStyle(r), inner = r.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var spans = dates.children, first = spans[0].getBoundingClientRect(), last = spans[spans.length - 1].getBoundingClientRect(), one = Math.abs(first.top - last.top) < 4;
      var gap = act.getBoundingClientRect().left - last.right;
      if (!one || gap < 20 || act.getBoundingClientRect().right > r.getBoundingClientRect().right - parseFloat(cs.paddingRight) + 1) r.classList.remove('inline-act');
    });
  }
  measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 800);
})();

/* Афиша, от 901 px: три таба в одну строку, только если от последнего таба до кнопки / плашки «прошёл» остаётся ≥ 20 px; иначе два и один */
(function () {
  var rows = document.querySelectorAll('#schedule .row');
  if (!rows.length) return;
  function measure() {
    [].forEach.call(rows, function (r) {
      r.classList.remove('two');
      if (window.innerWidth <= 900) return;
      var act = r.querySelector('.acts .btn') || r.querySelector(':scope > .st.past'), dates = r.querySelector('.dates');
      if (!act || !dates) return;
      var last = dates.lastElementChild.getBoundingClientRect(), first = dates.firstElementChild.getBoundingClientRect(), a = act.getBoundingClientRect();
      var oneLine = Math.abs(last.top - first.top) < 4;
      if (oneLine && last.top < a.bottom && last.bottom > a.top && a.left - last.right < 20) r.classList.add('two');
    });
  }
  measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 800);
})();

/* Фотографии: нажатие открывает снимок крупно; закрыть — нажатием, крестиком или Esc */
(function () {
  var slots = document.querySelectorAll('.gallery .slot.has-photo');
  if (!slots.length) return;
  var box = null, last = null;
  function close() { if (!box) return; var b = box; box = null; b.classList.remove('on'); setTimeout(function () { b.remove(); }, 250); document.removeEventListener('keydown', onKey, true); if (last && last.focus) last.focus({ preventScroll: true }); }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }
  function open(slot) {
    var src = slot.querySelector('img'); if (!src) return;
    last = slot; if (box) box.remove();
    box = document.createElement('div'); box.className = 'photo-zoom'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Фотография крупно');
    var im = new Image(); im.src = src.currentSrc || src.src; im.alt = src.alt;
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть'); x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';
    box.appendChild(im); box.appendChild(x); document.body.appendChild(box);
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(function () { box.classList.add('on'); x.focus({ preventScroll: true }); });
  }
  [].forEach.call(slots, function (s) {
    s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', 'Открыть фотографию крупно');
    s.addEventListener('click', function () { open(s); });
    s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(s); } });
  });
})();

/* Текст сбоку от заголовка блока: у всех блоков одновременно. Если самый широкий заголовок помещается левее середины — у всех текст справа от середины + 20, иначе у всех под заголовком */
(function () {
  var heads = document.querySelectorAll('.sec-head');
  if (!heads.length) return;
  function measure() {
    var ok = true;
    [].forEach.call(heads, function (h) { h.classList.remove('side', 'stack'); });
    [].forEach.call(heads, function (h) {
      var t = h.querySelector('h2'); if (!t) return;
      var rg = document.createRange(); rg.selectNodeContents(t); var tr = rg.getBoundingClientRect(), hr = h.getBoundingClientRect();
      if (tr.right > hr.left + hr.width / 2 - 20) ok = false;
    });
    [].forEach.call(heads, function (h) { h.classList.add(ok ? 'side' : 'stack'); });
  }
  measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 800);
})();

/* Подвал, ПК: строка «Шрифты» начинается там же, где цитата: ширина первой колонки = от левого края строки до начала цитаты */
(function () {
  var q = document.querySelector('.f-bye-txt'), bot = document.querySelector('.f-bot');
  if (!q || !bot) return;
  function place() {
    bot.style.removeProperty('--q-col');
    if (window.innerWidth < 1061) return;
    var col = q.getBoundingClientRect().left - bot.getBoundingClientRect().left - (parseFloat(getComputedStyle(bot).columnGap) || 0);
    if (col > 120) bot.style.setProperty('--q-col', Math.round(col) + 'px');
  }
  place(); window.addEventListener('resize', place); window.addEventListener('load', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  setTimeout(place, 800); setTimeout(place, 2000);
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { requestAnimationFrame(place); }); ro.observe(q); ro.observe(document.querySelector('.f-main') || bot); }   // цитата сдвигается, когда меняется катушка или шрифты: пересчитываем
})();

/* Полоса прокрутки внутри карточки героя и билета записи (всегда видна, если есть что прокручивать) */
(function () {
  function attach(box) {
    if (!box) return;
    var host = box.parentNode, ind = document.createElement('div'); ind.className = 'scroll-ind'; ind.setAttribute('aria-hidden', 'true');
    host.appendChild(ind);
    function upd() {
      var sh = box.scrollHeight, ch = box.clientHeight;
      if (!ch || sh <= ch + 2 || !box.offsetParent || getComputedStyle(box).overflowY === 'visible') { ind.classList.remove('on'); return; }
      var r = box.getBoundingClientRect(), h = host.getBoundingClientRect(), track = ch - 40, th = Math.max(28, track * ch / sh);
      ind.style.top = (r.top - h.top + 20 + (track - th) * box.scrollTop / (sh - ch)) + 'px';
      ind.style.right = (h.right - r.right + 4) + 'px';
      ind.style.height = th + 'px';
      ind.classList.add('on');
    }
    box.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    new MutationObserver(function () { setTimeout(upd, 60); setTimeout(upd, 700); setTimeout(upd, 1600); }).observe(host.closest('dialog') || host, { attributes: true, attributeFilter: ['open', 'class'], subtree: false });
    if (window.ResizeObserver) { var ro = new ResizeObserver(upd); ro.observe(box); }
    var mo = new MutationObserver(function () { setTimeout(upd, 30); }); mo.observe(box, { childList: true, subtree: true, characterData: true });
  }
  attach(document.querySelector('.hv-card'));
  attach(document.querySelector('.signup .ticket'));
})();


/* Карточка героя: облачко с фразой по ширине самого длинного слова строки (без пустого места справа), свайп влево-вправо переключает героя */
(function () {
  var dlg = document.getElementById('hero-view'); if (!dlg) return;
  var q = dlg.querySelector('.hv-quote'), say = dlg.querySelector('.hv-say'), src = dlg.querySelector('.hv-src');
  function fitQuote() {
    if (!q) return;
    q.style.width = '';
    if (window.innerWidth > 900 || !q.offsetParent && !dlg.open) return;
    var cs = getComputedStyle(q), padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var maxW = q.getBoundingClientRect().width; if (!maxW) return;
    var best = 0;
    [say, src].forEach(function (el) {
      if (!el) return;
      var rg = document.createRange(); rg.selectNodeContents(el);
      var rects = [].slice.call(rg.getClientRects()).filter(function (r) { return r.width > 0 && r.height > 0; });
      if (!rects.length) return;
      var left = Math.min.apply(null, rects.map(function (r) { return r.left; })), right = Math.max.apply(null, rects.map(function (r) { return r.right; }));
      best = Math.max(best, right - left);
    });
    if (best > 0 && best + padX + 1 < maxW) q.style.width = Math.ceil(best + padX + 1) + 'px';
  }
  if (q) {
    q.style.maxWidth = '100%';
    new MutationObserver(function () { setTimeout(fitQuote, 30); setTimeout(fitQuote, 400); }).observe(say, { childList: true });
    window.addEventListener('resize', fitQuote);
    new MutationObserver(function () { setTimeout(fitQuote, 60); setTimeout(fitQuote, 800); }).observe(dlg, { attributes: true, attributeFilter: ['open', 'class'] });
  }

  // свайп: касание-сдвиг по горизонтали больше 50 px и заметно больше, чем по вертикали → предыдущий/следующий герой (той же анимацией, что стрелки)
  var sx = 0, sy = 0, st = 0, track = false;
  dlg.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || dlg.querySelector('.hv-zoom')) { track = false; return; }
    track = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (!track) return; track = false;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - st > 700) return;
    var btn = dlg.querySelector(dx < 0 ? '[data-hv-next]' : '[data-hv-prev]'); if (btn) btn.click();
  }, { passive: true });
})();
