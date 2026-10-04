/* Сетка поверх страницы: ?grid в адресе или клавиша G */
(function () {
  var el = document.createElement('div');
  el.className = 'gridov';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i>' + new Array(13).join('<b></b>') + '</i>';
  document.body.appendChild(el);
  function set(on) { el.classList.toggle('on', on); }
  if (/[?&]grid\b/.test(location.search)) set(true);
  addEventListener('keydown', function (e) {
    if ((e.key === 'g' || e.key === 'G' || e.key === 'п' || e.key === 'П') && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName)) set(!el.classList.contains('on'));
  });
})();
