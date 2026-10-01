/* Боковое меню для планшета (521–1180 px): страница сдвигается влево и открывает меню под собой.
   Кнопка «Меню» стоит в шапке (её показывает только CSS планшета). Выход: «Закрыть», клик по затемнённой странице, Esc. */
(function () {
  var btn = document.querySelector('.menu-btn'), page = document.querySelector('.page');
  if (!btn || !page) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ITEMS = [['now', 'Сейчас читаем'], ['format', 'Формат'], ['heroes', 'Герои сезона'], ['schedule', 'Расписание'], ['photos', 'Фотографии'], ['contacts', 'Контакты']];
  var tabletMQ = window.matchMedia('(max-width: 1180px)');

  var side = document.createElement('aside');
  side.className = 'side-nav'; side.id = 'side-nav'; side.setAttribute('aria-label', 'Меню'); side.setAttribute('aria-hidden', 'true');
  var html = '<ul class="sn-list">';
  ITEMS.forEach(function (it, i) { html += '<li><a href="#' + it[0] + '" style="--i:' + i + '" tabindex="-1">' + it[1] + '</a></li>'; });
  html += '</ul><a class="btn y sn-cta" href="#now" tabindex="-1">Записаться на&nbsp;встречу</a><div class="sn-foot"><span>«Сноска», ул.&nbsp;Жуковского, 18</span><a href="https://t.me/ppolinaguseva" target="_blank" rel="noopener">Telegram: @ppolinaguseva</a></div>';
  side.innerHTML = html;
  var dim = document.createElement('div'); dim.className = 'nav-dim'; dim.id = 'nav-dim';
  document.body.appendChild(side); document.body.appendChild(dim);
  var links = [].slice.call(side.querySelectorAll('.sn-list a, .sn-cta'));
  // одна кнопка на два состояния: бургер из шапки превращается в крестик и переезжает в угол меню, при закрытии крестик возвращается и снова становится бургером
  var tog = document.createElement('button'); tog.className = 'nav-toggle'; tog.type = 'button'; tog.setAttribute('aria-label', 'Закрыть меню'); tog.setAttribute('aria-expanded', 'false'); tog.innerHTML = btn.innerHTML; document.body.appendChild(tog);
  var home = { left: 0, top: 0 };
  var isOpen = false, timer;

  // подсветка текущего раздела — по тому же правилу, что в плавающем меню
  function markCurrent() {
    var line = window.innerHeight * 0.4, cur = -1;
    ITEMS.forEach(function (it, i) { var el = document.getElementById(it[0]); if (el && el.getBoundingClientRect().top <= line) cur = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = ITEMS.length - 1;
    links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }

  function clipToView() {
    var sy = window.scrollY, h = page.offsetHeight;
    page.style.clipPath = 'inset(' + sy + 'px 0 ' + Math.max(0, h - sy - window.innerHeight) + 'px 0 round 20px)';
  }
  function unclip() { page.style.clipPath = ''; root.classList.remove('nav-closing'); }

  function open() {
    if (isOpen || !tabletMQ.matches) return;
    isOpen = true; clearTimeout(timer);
    markCurrent();
    var r = btn.getBoundingClientRect(); home = { left: r.left, top: r.top };
    tog.style.transition = 'none'; tog.style.right = 'auto'; tog.style.left = home.left + 'px'; tog.style.top = home.top + 'px'; tog.classList.add('show'); void tog.offsetWidth; tog.style.transition = '';
    root.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true'); side.setAttribute('aria-hidden', 'false');
    tog.setAttribute('aria-expanded', 'true');
    tog.style.left = 'auto'; tog.style.right = '20px'; tog.style.top = '20px';   // крестик — 20 от верха и от правого края
    side.style.paddingTop = Math.round(home.top + 44 + 20) + 'px';
    links.forEach(function (a) { a.tabIndex = 0; });
    if (window.lenis) window.lenis.stop();
  }
  function close(after) {
    if (!isOpen) { if (after) after(); return; }
    isOpen = false;
    root.classList.remove('nav-open'); root.classList.add('nav-closing');
    btn.setAttribute('aria-expanded', 'false'); side.setAttribute('aria-hidden', 'true'); tog.setAttribute('aria-expanded', 'false');
    tog.style.left = 'auto'; tog.style.right = '20px'; tog.style.top = '20px';
    links.forEach(function (a) { a.tabIndex = -1; });
    timer = setTimeout(function () { tog.classList.remove('show'); unclip(); if (window.lenis) window.lenis.start(); if (after) after(); }, reduce ? 0 : 780);
  }

  btn.addEventListener('click', function () { if (isOpen) close(); else open(); });
  tog.addEventListener('click', function () { close(); });
  dim.addEventListener('click', function () { close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
  side.querySelector('.sn-cta').addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    close(function () { var b = document.querySelector('.hero-ctas [data-signup]') || document.querySelector('[data-signup]'); if (b) b.click(); });
  }, true);
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = document.querySelector(a.getAttribute('href'));
      close(function () {
        if (!t) return;
        if (window.lenis) window.lenis.scrollTo(t, { duration: 1.2, force: true }); else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
  // если экран стал не планшетным (поворот, изменение окна) — закрыть без анимации
  tabletMQ.addEventListener('change', function () { if (!tabletMQ.matches && isOpen) { isOpen = false; root.classList.remove('nav-open', 'nav-closing'); tog.classList.remove('show'); unclip(); if (window.lenis) window.lenis.start(); } });
})();
