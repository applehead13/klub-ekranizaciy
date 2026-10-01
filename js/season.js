/* =========================================================
   Живой сезон: всё, что зависит от даты, считается из одной таблицы.
   Сегодняшняя дата берётся у посетителя; для показа можно «перемотать время» параметром в адресе,
   например  ?date=2026-11-15  или  ?date=2027-09-01 (сезон окончен).
   Меняются: закрашенные герои в хороводе, афиша, блок «Сейчас читаем», счёт, подписи на первом экране,
   данные для окна записи, строка под названием в прелоадере.
   ========================================================= */
(function () {
  // Таблица сезона: месяц, книга, автор, значки годов, три даты (книга / фильм / спор), кто победил, сколько мест осталось
  var M = [
    { key: 'david',     m: 'Сентябрь', g: 'сентября', y: 2026, title: 'Мгла',                          author: 'Стивен Кинг',      film: 'Фильм 2007 года',      book: 'Книга 1980 года', d: ['13.09', '20.09', '27.09'], win: 'film', left: 4 },
    { key: 'vianne',    m: 'Октябрь',  g: 'октября',  y: 2026, title: 'Шоколад',                       author: 'Джоанн Харрис',    film: 'Фильм 2000 года',      book: 'Книга 1999 года', d: ['11.10', '18.10', '25.10'], win: 'book', left: 6 },
    { key: 'sally',     m: 'Ноябрь',   g: 'ноября',   y: 2026, title: 'Практическая магия',            author: 'Элис Хоффман',     film: 'Фильм 1998 года',      book: 'Книга 1995 года', d: ['08.11', '15.11', '22.11'], win: 'film', left: 7 },
    { key: 'jo',        m: 'Декабрь',  g: 'декабря',  y: 2026, title: 'Маленькие женщины',             author: 'Луиза Мэй Олкотт', film: 'Фильм 2019 года',      book: 'Книга 1868 года', d: ['13.12', '20.12', '27.12'], win: 'book', left: 9 },
    { key: 'rebecca',   m: 'Январь',   g: 'января',   y: 2027, title: 'Ребекка',                       author: 'Дафна дю Морье',   film: 'Фильм 2020 года',      book: 'Книга 1938 года', d: ['10.01', '17.01', '24.01'], win: 'film', left: 12 },
    { key: 'sherlock',  m: 'Февраль',  g: 'февраля',  y: 2027, title: 'Собака Баскервилей',            author: 'Артур Конан Дойл', film: 'Сериал 2012 года',     book: 'Книга 1902 года', d: ['14.02', '21.02', '28.02'], win: 'book', left: 8 },
    { key: 'behemoth',  m: 'Март',     g: 'марта',    y: 2027, title: 'Мастер и Маргарита',       author: 'Михаил Булгаков',  film: 'Фильм 2024 года',      book: 'Книга 1967 года', d: ['14.03', '21.03', '28.03'], win: 'book', left: 5 },
    { key: 'elizabeth', m: 'Апрель',   g: 'апреля',   y: 2027, title: 'Гордость и предубеждение', author: 'Джейн Остин',      film: 'Фильм 2005 года',      book: 'Книга 1813 года', d: ['11.04', '18.04', '25.04'], win: 'film', left: 10 },
    { key: 'jane',      m: 'Май',      g: 'мая',      y: 2027, title: 'Джейн Эйр',                     author: 'Шарлотта Бронте',  film: 'Фильм 2011 года',      book: 'Книга 1847 года', d: ['09.05', '16.05', '23.05'], win: 'book', left: 6 },
    { key: 'dorian',    m: 'Июнь',     g: 'июня',     y: 2027, title: 'Портрет Дориана Грея',          author: 'Оскар Уайльд',     film: 'Фильм 2009 года',      book: 'Книга 1890 года', d: ['13.06', '20.06', '27.06'], win: 'film', left: 9 },
    { key: 'peregrine', m: 'Июль',     g: 'июля',     y: 2027, title: 'Дом странных детей',            author: 'Ренсом Риггз',     film: 'Фильм 2016 года',      book: 'Книга 2011 года', d: ['11.07', '18.07', '25.07'], win: 'film', left: 11 },
    { key: 'coraline',  m: 'Август',   g: 'августа',  y: 2027, title: 'Коралина',                      author: 'Нил Гейман',       film: 'Мультфильм 2009 года', book: 'Книга 2002 года', d: ['08.08', '15.08', '22.08'], win: 'film', left: 14 }
  ];
  var KIND = ['книга', 'фильм', 'спор'];

  // «сегодня»: из адреса (?date=ГГГГ-ММ-ДД) или настоящая дата
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var q = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
  if (q) today = new Date(+q[1], +q[2] - 1, +q[3]);

  function day(m, i) { var p = M[m].d[i].split('.'); return new Date(M[m].y, +p[1] - 1, +p[0]); }
  var cur = -1;                                            // текущий месяц: первый, у которого спор ещё не прошёл
  for (var i = 0; i < M.length; i++) { if (day(i, 2) >= today) { cur = i; break; } }
  var over = cur === -1, upto = over ? M.length : cur;     // upto — сколько месяцев уже прошло
  var next = -1;                                           // ближайшая встреча внутри текущего месяца
  if (!over) for (var k = 0; k < 3; k++) { if (day(cur, k) >= today) { next = k; break; } }
  var score = { book: 0, film: 0 };
  for (var s = 0; s < upto; s++) score[M[s].win]++;

  function seats(n) { return n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'место' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'места' : 'мест')); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function bookTitle(i) { return '«' + M[i].title + '»'; }

  // атрибуты для окна записи: только ещё не прошедшие встречи месяца
  function signupData(i) {
    var list = [];
    for (var k = 0; k < 3; k++) if (i !== cur || day(i, k) >= today) list.push(KIND[k] + ' ' + M[i].d[k]);
    return { month: M[i].m, book: bookTitle(i) + ', ' + M[i].author, dates: list.join('|'), left: String(M[i].left) };
  }
  function setSignup(btn, i) {
    var d = signupData(i);
    btn.dataset.month = d.month; btn.dataset.book = d.book; btn.dataset.dates = d.dates; btn.dataset.left = d.left;
  }

  window.SEASON = { over: over, cur: cur, readCount: upto, score: score, today: today, months: M };
  document.documentElement.classList.add(over ? 'season-over' : 'season-live');


  // Обложка на высоту карточки (без обрезки, пропорция 543:850), название сжимается только если самое длинное слово не помещается
  function fitBook() {
    var sec = $('#now'); if (!sec) return;
    var card = $('.c-book', sec), cover = $('.cover', card), h3 = $('h3', card), sess = $('.c-sess', sec);
    if (!card || !cover || !h3 || !sess) return;
    var cs = getComputedStyle(sess), inner = sess.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (inner > 0) card.style.setProperty('--cw', Math.round(inner * 543 / 850) + 'px');
    // телефон: обложка растёт, пока плашки справа не упрутся в 20 px от края карточки
    if (window.innerWidth <= 520) {
      cover.style.width = '';
      var films = [].slice.call(card.querySelectorAll('.film')), pw = 0;
      films.forEach(function (f) { var prev = f.style.width; f.style.width = 'max-content'; pw = Math.max(pw, f.getBoundingClientRect().width); f.style.width = prev; });
      var ccs = getComputedStyle(card), inner = card.getBoundingClientRect().width - parseFloat(ccs.paddingLeft) - parseFloat(ccs.paddingRight);
      var cw2 = Math.floor(inner - 10 - pw);
      if (pw > 0 && cw2 > 80) { cw2 = Math.min(cw2, 130); card.style.setProperty('--phone-cover', cw2 + 'px'); } else card.style.removeProperty('--phone-cover');
    }
    // один размер названия для ВСЕХ месяцев: по самому длинному слову среди всех двенадцати названий (группа одинаковых элементов выглядит одинаково)
    h3.style.fontSize = '';
    // ширина колонки считается от карточки (внутренняя ширина минус обложка и зазор), а не от содержимого: иначе она зависит от длины плашек конкретного месяца
    var ccs2 = getComputedStyle(card), gap2 = parseFloat(ccs2.columnGap) || parseFloat(ccs2.gap) || 0;
    var col = card.getBoundingClientRect().width - parseFloat(ccs2.paddingLeft) - parseFloat(ccs2.paddingRight) - cover.getBoundingClientRect().width - gap2;
    var base = parseFloat(getComputedStyle(h3).fontSize), probe = h3.cloneNode(false);   // клон заголовка: те же класс и стили, значит мерка точная
    probe.removeAttribute('style'); probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto;left:-9999px;top:0;grid-area:auto;margin:0;font-size:' + base + 'px';
    card.appendChild(probe);
    var widest = 0;
    M.forEach(function (m) { m.title.split(/ +/).forEach(function (w) { probe.textContent = w; widest = Math.max(widest, probe.getBoundingClientRect().width); }); });
    var own = 0;
    { h3.textContent.split(/ +/).forEach(function (w) { probe.textContent = w; own = Math.max(own, probe.getBoundingClientRect().width); }); }
    probe.remove();
    if (own > 0) {   // телефон: название книги занимает всю свободную ширину колонки, не больше
      var tcol = col;
      if (tcol > 0) h3.style.fontSize = Math.min(parseFloat(getComputedStyle($('#format .fr h3') || $('#schedule .row .m b') || $('h2', sec)).fontSize) || 96, Math.max(16, Math.floor(base * tcol / own * 0.998 * 8) / 8)) + 'px';
      return;
    }
    if (col > 0 && widest > col) h3.style.fontSize = Math.max(window.innerWidth <= 520 ? 16 : 26, Math.floor(base * col / widest * 0.95)) + 'px';
  }
  function apply() {
    // ---------- первый экран: счёт, подпись «сейчас — месяц» ----------
    var scoreBox = $('.score');
    if (scoreBox) {
      var ns = $$('.score .n');
      if (ns[0]) ns[0].textContent = score.book;
      if (ns[1]) ns[1].textContent = score.film;
      scoreBox.setAttribute('aria-label', 'Счёт сезона: книга ' + score.book + ', фильм ' + score.film);
      var now = $('.score .now');
      if (now) now.innerHTML = over ? 'сезон окончен' : 'сейчас — ' + M[cur].m.toLowerCase();
    }
    // строка под названием в прелоадере
    var sub = $('#pl-sub');
    if (sub) sub.textContent = over ? 'Сезон окончен · итоговый счёт ' + score.book + ' : ' + score.film : 'Сейчас — ' + M[cur].m.toLowerCase() + ' · ' + bookTitle(cur).replace(' ', ' ');

    // плашка «Произведение месяца» на первом экране
    var nr = $('.now-read');
    if (nr) {
      var cap = $('.nr-cap', nr), bk = $('.nr-book', nr);
      if (over) { cap.textContent = 'Сезон окончен'; bk.innerHTML = ''; bk.textContent = 'Итоговый счёт ' + score.book + ' : ' + score.film; }
      else { cap.textContent = M[cur].m; bk.innerHTML = ''; var t1 = document.createElement('span'); t1.className = 'nr-title'; t1.textContent = bookTitle(cur); var t2 = document.createElement('span'); t2.className = 'nr-sep'; t2.textContent = ', '; var t3 = document.createElement('span'); t3.className = 'nr-author'; t3.textContent = M[cur].author; bk.appendChild(t1); bk.appendChild(t2); bk.appendChild(t3); }
    }

    // ---------- афиша ----------
    $$('#schedule .row').forEach(function (row, i) {
      if (!M[i]) return;
      $$('.tag, .acts, .st', row).forEach(function (n) { n.remove(); });
      row.classList.remove('past', 'now');
      if (i < upto) {
        row.classList.add('past');
        var st = document.createElement('span'); st.className = 'st past';
        st.textContent = 'прошёл · ' + (M[i].win === 'film' ? 'победил фильм' : 'победила книга');
        row.appendChild(st);
      } else {
        var isNow = i === cur, isOpen = i === cur + 1;
        if (isNow) {
          row.classList.add('now');
          var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Ближайшая';
          row.insertBefore(tag, row.firstChild);
        }
        if (isNow || isOpen) {
          var acts = document.createElement('div'); acts.className = 'acts';
          if (isOpen) { var op = document.createElement('span'); op.className = 'st open'; op.textContent = 'запись открыта'; acts.appendChild(op); }
          var b = document.createElement('a'); b.className = 'btn st go'; b.href = isNow ? '#now' : '#contacts'; b.setAttribute('data-signup', ''); b.textContent = 'Записаться';
          setSignup(b, i); acts.appendChild(b); row.appendChild(acts);
        } else {
          var so = document.createElement('span'); so.className = 'st soon'; so.textContent = 'скоро'; row.appendChild(so);
        }
      }
    });
    var notes = $$('.note span');
    if (over && notes[1]) notes[1].textContent = 'Книги нового сезона выберем голосованием в Telegram-чате';

    // ---------- блок «Сейчас читаем» ----------
    var sec = $('#now');
    if (sec && !over) {
      var h2 = $('.sec-head h2', sec); if (h2) h2.textContent = 'Книга ' + M[cur].g;
      var cover = $('.c-book .cover', sec);
      if (cover) { cover.src = 'img/heroes/covers/' + M[cur].key + '.jpg?v=2'; cover.alt = 'Обложка книги ' + bookTitle(cur) + ', ' + M[cur].author; }
      var h3 = $('.c-book h3', sec); if (h3) h3.textContent = M[cur].title;
      var who = $('.c-book .who', sec); if (who) who.textContent = M[cur].author;
      var badges = $$('.c-book .film', sec); if (badges[0]) badges[0].textContent = M[cur].film; if (badges[1]) badges[1].textContent = M[cur].book;
      $$('.c-sess', sec).forEach(function (c, k) {
        var d = $('.d', c); if (d) d.textContent = M[cur].d[k];
        c.classList.remove('next', 'done');
        var t = $('.tag', c); if (t) t.remove();
        if (day(cur, k) < today) {
          c.classList.add('done');
          var td = document.createElement('span'); td.className = 'tag tag-done'; td.textContent = 'Пройдено';
          var kd = $('.k', c); if (kd) kd.appendChild(td);
        }
        if (k === next) {
          c.classList.add('next');
          var tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = 'Ближайшая';
          var kk = $('.k', c); if (kk) kk.appendChild(tg);
        }
      });
      var small = $('.c-where .small span', sec); if (small) small.textContent = seats(M[cur].left);
      var meter = $('.meter', sec); if (meter) meter.style.setProperty('--fill', Math.round((16 - M[cur].left) / 16 * 100) + '%');
      var wb = $('.c-where [data-signup]', sec); if (wb) setSignup(wb, cur);
    }
    if (sec && over) {
      var eb = $('.sec-head .eyebrow', sec); if (eb) eb.textContent = 'Итоги сезона';
      var hh = $('.sec-head h2', sec); if (hh) hh.textContent = 'Сезон окончен';
      var pp = $('.sec-head > p', sec); if (pp) pp.textContent = 'Двенадцать книг прочитаны, двенадцать фильмов просмотрены и обсуждены. Новый сезон начнём осенью.';
      var bento = $('.bento', sec);
      if (bento) {
        bento.classList.add('end');
        bento.innerHTML =
          '<article class="card c-sess next"><div class="k"><span>Итоговый счёт</span></div><div class="d">' + score.book + ' : ' + score.film + '</div><div class="w">книга : фильм</div><div class="x">за двенадцать месяцев</div></article>' +
          '<article class="card c-where"><div class="addr">Новый сезон<span>книги выберем голосованием в Telegram-чате</span></div><a class="btn y" href="#contacts">Узнать о новом сезоне</a></article>';
      }
    }

    // ---------- кнопки записи без своих данных (первый экран и т.п.) ----------
    if (over) {
      $$('[data-signup]').forEach(function (b) { b.removeAttribute('data-signup'); b.href = '#contacts'; if (b.closest('.hero-ctas')) b.innerHTML = 'Новый сезон — в чате'; });
    } else {
      $$('[data-signup]').forEach(function (b) { if (!b.dataset.month) setSignup(b, cur); });
    }
  }
  function run() { apply(); fitBook(); window.addEventListener('resize', fitBook); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBook); window.addEventListener('load', fitBook); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
