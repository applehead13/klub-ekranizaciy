/* =========================================================
   Плавная прокрутка: Lenis, связанный с ScrollTrigger (GSAP).
   Lenis сглаживает колесо мыши и трекпад, а ScrollTrigger получает каждое его движение
   и работает от общего таймера GSAP, поэтому анимации по прокрутке идут синхронно с ней.
   Не включается при «уменьшить движение» в системе. На сенсорных экранах прокрутка остаётся родной.
   Библиотеки лежат рядом, в js/vendor/ (GSAP 3.12.5, ScrollTrigger 3.12.5, Lenis 1.1.20).
   ========================================================= */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  var lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
  window.lenis = lenis;

  // связка: Lenis сообщает ScrollTrigger о каждом сдвиге, а сам крутится от таймера GSAP
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  // пока идёт заставка или открыто окно (билет, карточка героя), страница не прокручивается
  var root = document.documentElement;
  function sync() {
    if (root.classList.contains('preloading') || root.classList.contains('modal-open') || root.classList.contains('nav-open') || root.classList.contains('nav-closing')) lenis.stop(); else lenis.start();
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  sync();

  // плавные переходы, которые раньше делал браузер, теперь идут через Lenis (якоря, меню-док, «наверх», переход к строке афиши)
  var nativeIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) {
    if (o && typeof o === 'object' && o.behavior === 'smooth') {
      var r = this.getBoundingClientRect(), off = 0;
      if (o.block === 'center') off = -(window.innerHeight / 2 - r.height / 2);
      lenis.scrollTo(this, { offset: off, duration: 1.3, force: true });
      return;
    }
    return nativeIntoView.apply(this, arguments);
  };
  var nativeScrollTo = window.scrollTo;
  window.scrollTo = function (a) {
    if (a && typeof a === 'object' && a.behavior === 'smooth') { lenis.scrollTo(a.top || 0, { duration: 1.3, force: true }); return; }
    return nativeScrollTo.apply(window, arguments);
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { duration: 1.3, force: true });
    if (history.pushState) history.pushState(null, '', id);
  });

  // после заставки и загрузки картинок пересчитать положения для ScrollTrigger
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  document.addEventListener('pl:done', function () { ScrollTrigger.refresh(); });
})();
