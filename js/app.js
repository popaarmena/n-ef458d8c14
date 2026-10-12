/* Логика сайта. Контент берётся из content.json, сюда лезть не нужно. */
(function () {
  'use strict';

  var STORE_KEY = 'natulik-letters-v1';
  var app = document.getElementById('app');
  var C = null;
  var state = loadState();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [];

  /* ---------- Прогресс в памяти телефона ---------- */
  function emptyState() { return { opened: [], tries: {}, finalSeen: false }; }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        return { opened: s.opened || [], tries: s.tries || {}, finalSeen: !!s.finalSeen };
      }
    } catch (e) {}
    return emptyState();
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function resetState() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    state = emptyState();
  }

  /* ---------- Мелочи ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).filter(Boolean).map(function (p) {
      return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function pick(arr, fallback) {
    if (!arr || !arr.length) return fallback || '';
    return typeof arr === 'string' ? arr : arr[Math.floor(Math.random() * arr.length)];
  }
  function line(key, fallback, lock) {
    var l = C.mascot && C.mascot.lines ? C.mascot.lines[key] : null;
    var text = pick(l, fallback);
    return lock ? String(text).replace(/\{name\}/g, lock.name) : text;
  }
  function setting(key, fallback) {
    return C.settings && C.settings[key] != null ? C.settings[key] : fallback;
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function lockById(id) { return C.locks.filter(function (l) { return String(l.id) === String(id); })[0]; }
  function isOpen(id) { return state.opened.indexOf(String(id)) !== -1; }
  function openedCount() { return C.locks.filter(function (l) { return isOpen(l.id); }).length; }
  function allOpen() { return C.locks.length > 0 && openedCount() === C.locks.length; }
  function initial(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  /* ---------- Мягкая проверка ответа ---------- */
  // Без регистра, пробелов, знаков препинания, ё = е. Одна опечатка в длинном слове прощается.
  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^0-9a-zа-я]+/gi, '');
  }
  function distance(a, b) {
    if (a === b) return 0;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function isCorrect(lock, value) {
    var v = norm(value);
    if (!v) return false;
    return (lock.answers || []).some(function (ans) {
      var a = norm(ans);
      if (!a) return false;
      if (a === v) return true;
      return a.length >= 5 && distance(a, v) <= 1;
    });
  }

  /* ---------- Куски разметки ---------- */
  function photoHTML(src, name) {
    if (!src) return '<span class="avatar-fallback">' + esc(initial(name)) + '</span>';
    return '<img class="js-photo" src="' + esc(src) + '" alt="" loading="lazy" decoding="async" data-initial="' + esc(initial(name)) + '">';
  }

  function mascotHTML(text, opts) {
    opts = opts || {};
    var name = (C.mascot && C.mascot.name) || 'Боня';
    return '<div class="mascot ' + (opts.big ? 'mascot--big ' : '') + (opts.cls || '') + '">' +
      Art.boney({ withLetter: opts.withLetter }) +
      '<p class="bubble" aria-live="polite"><span class="bubble__name">' + esc(name) + '</span><span class="bubble__text">' + esc(text) + '</span></p>' +
      '</div>';
  }

  // Боня говорит новую реплику. mood: happy | think
  function say(text, mood) {
    var bubble = app.querySelector('.bubble');
    var mascot = app.querySelector('.mascot');
    if (!bubble) return;
    bubble.querySelector('.bubble__text').textContent = text;
    bubble.classList.remove('is-new'); void bubble.offsetWidth; bubble.classList.add('is-new');
    // если реплику закрыла клавиатура или она ниже экрана, докручиваем
    var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var rect = bubble.getBoundingClientRect();
    if (rect.bottom > vh || rect.top < 0) {
      try { bubble.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (e) { bubble.scrollIntoView(false); }
    }
    if (mascot) {
      mascot.classList.remove('is-happy', 'is-think');
      if (mood) {
        mascot.classList.add('is-' + mood);
        later(function () { mascot.classList.remove('is-' + mood); }, mood === 'happy' ? 2400 : 1800);
      }
    }
  }

  var BACK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function topbar() {
    return '<div class="topbar"><button class="link-btn" type="button" data-go="letters">' + BACK_ICON + 'Все письма</button></div>';
  }
  function rise(i) { return ' rise" style="--d:' + i; }

  /* ==========================================================
     1. Старт
     ========================================================== */
  function renderStart() {
    var g = C.girl || {};
    var started = state.opened.length > 0;
    app.className = 'app';
    app.innerHTML =
      '<section class="screen start">' +
        '<div class="ornament' + rise(0) + '">' + Art.crown() + '</div>' +
        '<div>' +
          '<p class="start__hello script' + rise(1) + '">' + esc(g.nickname || g.name) + ',</p>' +
          '<h1 class="title-xl js-reset' + rise(2) + '">' + esc(g.startTitle || 'с днём рождения') + '</h1>' +
        '</div>' +
        '<p class="start__text' + rise(3) + '">' + esc(g.startText) + '</p>' +
        '<div class="' + rise(4) + '">' + mascotHTML(line('intro'), { big: true, withLetter: true }) + '</div>' +
        '<button class="btn' + rise(5) + '" type="button" data-go="letters">' + (started ? 'Продолжить' : 'Начать') + '</button>' +
      '</section>';
  }

  /* ==========================================================
     2. Конверты
     ========================================================== */
  var TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.5];

  function envHTML(lock, i) {
    var open = isOpen(lock.id);
    return '<li class="' + rise(3 + Math.min(i, 6)) + '">' +
      '<button class="env ' + (open ? 'is-open' : 'is-sealed') + '" type="button" style="--tilt:' + TILTS[i % TILTS.length] + 'deg"' +
        ' data-go="letter/' + encodeURIComponent(lock.id) + '"' +
        ' aria-label="Письмо, ' + esc(lock.name) + (open ? ', прочитано' : ', запечатано') + '">' +
        '<span class="env__flap"></span>' +
        '<span class="env__seal">' + Art.seal(Art.lock()) + '</span>' +
        '<span class="env__photo">' + photoHTML(lock.photo, lock.name) + '</span>' +
        '<span class="env__to">' +
          '<span class="env__name">' + esc(lock.name) + '</span>' +
          '<span class="env__status">' + (open ? Art.heart() + 'прочитано' : 'запечатано') + '</span>' +
        '</span>' +
      '</button></li>';
  }

  // Письмо Влада: такой же конверт, как у всех, просто открывается после остальных
  function lastSender() {
    var f = C.final || {};
    return { name: f.from || 'Влад', photo: f.photo };
  }
  function finalEnvHTML() {
    var who = lastSender();
    var ready = allOpen();
    var status = state.finalSeen ? Art.heart() + 'прочитано' : (ready ? 'можно открывать' : 'откроется после остальных');
    var cls = 'env env--last ' + (ready ? 'is-ready' : 'is-locked') + (state.finalSeen ? ' is-open' : ' is-sealed');
    return '<li class="' + rise(3 + Math.min(C.locks.length, 7)) + '">' +
      '<button class="' + cls + '" type="button" data-action="final" style="--tilt:' + TILTS[C.locks.length % TILTS.length] + 'deg"' +
        ' aria-label="Письмо, ' + esc(who.name) + ', ' + (ready ? 'можно открыть' : 'откроется, когда прочитаешь остальные') + '">' +
        '<span class="env__flap"></span>' +
        '<span class="env__seal">' + Art.seal(ready ? Art.heart() : Art.lock()) + '</span>' +
        '<span class="env__photo">' + photoHTML(who.photo, who.name) + '</span>' +
        '<span class="env__to">' +
          '<span class="env__name">' + esc(who.name) + '</span>' +
          '<span class="env__status">' + status + '</span>' +
        '</span>' +
      '</button></li>';
  }

  function renderLetters() {
    var total = C.locks.length;
    var done = openedCount();
    var pct = total ? Math.round(done / total * 100) : 0;
    var bubbleText = allOpen() && !state.finalSeen ? line('lettersAllDone') : line('letters');
    app.className = 'app is-wide';
    app.innerHTML =
      '<section class="screen letters">' +
        '<header class="letters-head">' +
          '<div class="ornament' + rise(0) + '">' + Art.crown() + '</div>' +
          '<h1 class="title-l js-reset' + rise(1) + '">Тебе письма</h1>' +
          '<div class="progress' + rise(2) + '">' +
            '<p class="progress__label">Открыто <b>' + done + '</b> из ' + total + '</p>' +
            '<div class="progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="Открыто писем">' +
              '<div class="progress__fill" style="width:' + pct + '%"></div>' +
              '<span class="progress__crown" style="left:' + Math.max(pct, 4) + '%">' + Art.crown() + '</span>' +
            '</div>' +
          '</div>' +
        '</header>' +
        '<div class="letters-mascot' + rise(2) + '">' + mascotHTML(bubbleText, { cls: allOpen() && !state.finalSeen ? 'is-happy' : '' }) + '</div>' +
        '<ul class="env-list">' + C.locks.map(envHTML).join('') + finalEnvHTML() + '</ul>' +
      '</section>';
  }

  /* ==========================================================
     3. Письмо
     ========================================================== */
  function letterHead(lock, d) {
    return '<div class="letter-head' + rise(d || 0) + '">' +
      '<div class="avatar-wrap"><div class="avatar">' + photoHTML(lock.photo, lock.name) + '</div>' + Art.crown() + '</div>' +
      '<h1 class="script">' + esc(lock.name) + '</h1>' +
    '</div>';
  }

  function renderLetter(id) {
    var lock = lockById(id);
    if (!lock) return go('letters', true);
    if (isOpen(lock.id)) return renderMessage(lock, false);
    var quizMode = !!lock.question;
    var revealAfter = setting('showAnswerAfter', 0); // 0 = кнопки «Показать ответ» нет

    app.className = 'app';
    app.innerHTML =
      '<section class="screen letter">' +
        topbar() +
        letterHead(lock, 0) +
        '<div class="card quiz' + rise(1) + '">' +
          (quizMode
            ? '<p class="quiz__who muted">' + esc(lock.name) + ' спрашивает:</p><p class="quiz__q">' + esc(lock.question) + '</p>'
            : (lock.task ? '<p class="quiz__who muted">' + esc(lock.name) + ' даёт задание:</p>' : '') +
              '<p class="quiz__q">' + esc(lock.task || line('codePrompt', 'Выполни задание, которое даст {name}, и получишь секретное слово.', lock)) + '</p>') +
          '<form class="answer-form" novalidate autocomplete="off">' +
            '<label class="answer-label" for="answer">' + (quizMode ? 'Твой ответ' : 'Секретное слово') + '</label>' +
            '<input id="answer" class="answer-input" type="text" name="answer" placeholder="' + (quizMode ? 'Напиши, как помнишь' : 'Введи слово') + '"' +
              ' autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done">' +
            '<button class="btn btn--block" type="submit">' + (quizMode ? 'Проверить' : 'Сломать печать') + '</button>' +
          '</form>' +
          '<div class="quiz__extra"></div>' +
          '<div class="hint-box" hidden></div>' +
        '</div>' +
        '<div class="quiz-mascot' + rise(2) + '">' + mascotHTML(line(quizMode ? 'question' : 'codeIntro', '', lock)) + '</div>' +
      '</section>';

    var form = app.querySelector('.answer-form');
    var input = app.querySelector('.answer-input');
    var extra = app.querySelector('.quiz__extra');
    var hintBox = app.querySelector('.hint-box');

    function tries() { return state.tries[lock.id] || 0; }

    function updateExtra() {
      var html = '';
      if (tries() >= 2 && lock.hint) html += '<button class="btn btn--soft" type="button" data-hint>Подсказка</button>';
      if (revealAfter > 0 && tries() >= revealAfter && lock.answers && lock.answers.length) html += '<button class="btn btn--soft" type="button" data-reveal>Показать ответ</button>';
      extra.innerHTML = html;
    }
    updateExtra();

    extra.addEventListener('click', function (e) {
      if (e.target.closest('[data-hint]')) {
        hintBox.hidden = false;
        hintBox.innerHTML = '<b>Подсказка.</b> ' + esc(lock.hint);
        say(line('hintReady', 'Только между нами.'), 'think');
      }
      if (e.target.closest('[data-reveal]')) {
        hintBox.hidden = false;
        hintBox.innerHTML = 'Ответ: <b>' + esc(lock.answers[0]) + '</b>. Он уже в поле, жми «Проверить».';
        input.value = lock.answers[0];
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value;
      if (!norm(value)) {
        say(quizMode ? 'Сначала напиши ответ. Хоть что-нибудь.' : 'Сначала введи слово.', 'think');
        input.focus();
        return;
      }
      if (isCorrect(lock, value)) {
        if (!isOpen(lock.id)) state.opened.push(String(lock.id));
        saveState();
        input.blur();
        form.querySelector('button').disabled = true;
        input.disabled = true;
        say(line('correct', 'Верно.', lock), 'happy');
        later(function () { playOpening(lock, function () { renderMessage(lock, true); }); }, reduceMotion ? 300 : 900);
      } else {
        state.tries[lock.id] = tries() + 1;
        saveState();
        input.classList.remove('is-wrong'); void input.offsetWidth; input.classList.add('is-wrong');
        var n = tries();
        if (n === 2 && lock.hint) say(line('hintReady', '', lock), 'think');
        else if (revealAfter > 0 && n === revealAfter) say(line('answerReady', '', lock), 'think');
        else if (!quizMode && n % 3 === 0) say(line('codeOnlyFrom', 'Это слово знает только {name}.', lock), 'think');
        else say(line(quizMode ? 'wrong' : 'wrongCode', 'Почти. Подумай ещё.', lock), 'think');
        updateExtra();
      }
    });
  }

  /* Вскрытие конверта: печать ломается, клапан открывается, письмо выезжает */
  var POCKET_LINES = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M0 100 L50 56 L100 100" fill="none" stroke="#f8c8d7" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
    '<path d="M0 0 L50 52 L100 0" fill="none" stroke="#f2a7bf" stroke-width="1.2" vector-effect="non-scaling-stroke"/>' +
    '</svg>';

  /* Вскрытие: печать ломается, клапан откидывается, листок выезжает из кармана */
  function playOpening(who, done) {
    if (reduceMotion) { done(); return; }
    window.scrollTo(0, 0);
    app.className = 'app';
    app.innerHTML =
      '<section class="screen letter">' +
        '<div class="opening">' +
          '<div class="oe-wrap"><div class="oe">' +
            '<div class="oe__back"></div>' +
            '<div class="oe__paper">' +
              '<span class="oe__paper-name">' + esc((C.girl && (C.girl.nickname || C.girl.name)) || '') + ',</span>' +
              '<span class="oe__paper-line"></span><span class="oe__paper-line"></span><span class="oe__paper-line"></span>' +
            '</div>' +
            '<div class="oe__pocket">' + POCKET_LINES +
              '<span class="env__photo">' + photoHTML(who.photo, who.name) + '</span>' +
              '<span class="env__to"><span class="env__name">' + esc(who.name) + '</span></span>' +
            '</div>' +
            '<div class="oe__flap"></div>' +
            '<div class="oe__seal">' + Art.seal(Art.lock()) + '</div>' +
          '</div></div>' +
        '</div>' +
      '</section>';
    var scene = app.querySelector('.opening');
    later(function () { scene.classList.add('is-crack'); }, 420);
    later(function () { scene.classList.add('is-flap'); }, 820);
    later(function () { scene.classList.add('is-paper'); }, 1400);
    later(function () { scene.classList.add('is-done'); }, 2650);
    later(done, 3000);
  }

  function mediaHTML(lock) {
    var src = lock.revealSrc;
    if (lock.revealType === 'video' && src) {
      var poster = lock.revealPoster ? ' poster="' + esc(lock.revealPoster) + '"' : '';
      var url = lock.revealPoster ? src : src + '#t=0.001';
      return '<div class="message__media"><video class="message__video" controls playsinline webkit-playsinline preload="metadata"' + poster +
        ' src="' + esc(url) + '"></video></div>';
    }
    if (lock.revealType === 'audio' && src) {
      return '<div class="message__media"><div class="audio">' +
        '<button class="audio-play" type="button" aria-label="Слушать">' + PLAY + '</button>' +
        '<div class="audio__main">' +
          '<p class="audio__title">Голосовое</p>' +
          '<input class="audio__range" type="range" min="0" max="1000" value="0" step="1" aria-label="Перемотка">' +
          '<p class="audio__time">0:00</p>' +
        '</div>' +
        '<audio preload="metadata" src="' + esc(src) + '"></audio>' +
      '</div></div>';
    }
    return '';
  }

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/></svg>';

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function wireMedia(root) {
    var video = root.querySelector('video');
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        if (video.videoWidth > video.videoHeight) video.classList.add('is-landscape');
      });
      video.addEventListener('error', function () { missing(video.parentNode, 'Видео пока не добавлено.'); });
    }

    var box = root.querySelector('.audio');
    if (!box) return;
    var audio = box.querySelector('audio');
    var btn = box.querySelector('.audio-play');
    var range = box.querySelector('.audio__range');
    var time = box.querySelector('.audio__time');
    var seeking = false;

    function paint() {
      var d = audio.duration, c = audio.currentTime;
      var p = d ? c / d : 0;
      if (!seeking) range.value = Math.round(p * 1000);
      range.style.setProperty('--p', (range.value / 10) + '%');
      time.textContent = fmt(c) + ' / ' + fmt(d);
    }
    btn.addEventListener('click', function () {
      if (audio.paused) { var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else audio.pause();
    });
    audio.addEventListener('play', function () { btn.innerHTML = PAUSE; btn.setAttribute('aria-label', 'Пауза'); });
    audio.addEventListener('pause', function () { btn.innerHTML = PLAY; btn.setAttribute('aria-label', 'Слушать'); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; paint(); });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('loadedmetadata', paint);
    audio.addEventListener('error', function () { missing(box.parentNode, 'Голосовое пока не добавлено.'); });
    range.addEventListener('input', function () {
      seeking = true;
      range.style.setProperty('--p', (range.value / 10) + '%');
      if (audio.duration) time.textContent = fmt(range.value / 1000 * audio.duration) + ' / ' + fmt(audio.duration);
    });
    range.addEventListener('change', function () {
      if (audio.duration) audio.currentTime = range.value / 1000 * audio.duration;
      seeking = false;
    });
  }

  function missing(container, text) {
    if (container) container.innerHTML = '<p class="media-missing">' + esc(text) + '</p>';
  }

  function renderMessage(lock, fresh) {
    var next = allOpen() && !state.finalSeen ? 'К главному письму' : 'К остальным письмам';
    var text = lock.revealType === 'text' || lock.revealText ? lock.revealText : '';
    app.className = 'app';
    app.innerHTML =
      '<section class="screen letter">' +
        topbar() +
        letterHead(lock, 0) +
        '<article class="message' + rise(1) + '">' +
          '<div class="message__paper">' +
            mediaHTML(lock) +
            (text ? '<div class="message__text">' + paragraphs(text) + '</div>' : '') +
            '<p class="message__sign">' + esc(lock.name) + '</p>' +
          '</div>' +
          '<div class="message__actions">' +
            '<button class="btn btn--block" type="button" data-go="letters">' + next + '</button>' +
          '</div>' +
        '</article>' +
      '</section>';
    wireMedia(app);
  }

  /* ==========================================================
     4. Финал
     ========================================================== */
  function renderFinal() {
    var f = C.final || {};
    var g = C.girl || {};
    var first = !state.finalSeen;
    state.finalSeen = true;
    saveState();
    app.className = 'app';
    app.innerHTML =
      '<section class="screen final">' +
        topbar() +
        '<div class="ornament' + rise(0) + '">' + Art.crown() + '</div>' +
        (g.age ? '<p class="final__age' + rise(1) + '" aria-hidden="true">' + esc(g.age) + '</p>' : '') +
        '<h1 class="title-xl js-reset' + rise(2) + '">' + esc(f.title) + '</h1>' +
        '<article class="message__paper' + rise(3) + '">' +
          mediaHTML(f) +
          (f.text ? '<div class="message__text">' + paragraphs(f.text) + '</div>' : '') +
          '<p class="message__sign">' + esc(f.signature) + '</p>' +
        '</article>' +
        (f.cakeText ? '<div class="cake-box' + rise(4) + '">' + Art.cake() + '<p>' + esc(f.cakeText) + '</p></div>' : '') +
        '<div class="final-mascot' + rise(5) + '">' + mascotHTML(line('final', 'А это от меня. Гав.'), { cls: 'is-happy' }) + '</div>' +
        '<button class="btn btn--ghost' + rise(6) + '" type="button" data-go="letters">Перечитать письма</button>' +
      '</section>';
    wireMedia(app);
    later(confetti, first ? 900 : 500);
  }

  /* ---------- Конфетти: мягко, один раз, только на финале ---------- */
  function confetti() {
    if (reduceMotion) return;
    var canvas = document.getElementById('confetti');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colors = ['#f2a7bf', '#f8c8d7', '#d9648c', '#f3dca6', '#e2b25a', '#ffffff'];
    var count = W < 500 ? 70 : 110;
    var parts = [];
    for (var i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.6,
        r: 4 + Math.random() * 5,
        c: colors[i % colors.length],
        vy: 1.1 + Math.random() * 1.6,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.03,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.08,
        shape: i % 7 === 0 ? 'heart' : (i % 3 === 0 ? 'dot' : 'rect')
      });
    }
    var start = performance.now();
    var LIFE = 5200;
    function heart(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.3);
      ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.35);
      ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.05, x, y + s * 1.3);
      ctx.bezierCurveTo(x, y + s * 1.05, x + s, y + s * 0.8, x + s, y + s * 0.35);
      ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
      ctx.fill();
    }
    function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = t > LIFE - 1200 ? Math.max(0, (LIFE - t) / 1200) : 1;
      parts.forEach(function (p) {
        p.y += p.vy; p.sway += p.swaySpeed; p.rot += p.vr;
        var x = p.x + Math.sin(p.sway) * 18;
        ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(x, p.y); ctx.rotate(p.rot);
        if (p.shape === 'heart') heart(0, -p.r * .6, p.r * .75);
        else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.r * .45, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (t < LIFE) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Навигация ---------- */
  function go(path, replace) {
    var h = '#/' + path;
    if (replace) location.replace(h); else location.hash = h;
  }

  function stopMedia() {
    Array.prototype.forEach.call(document.querySelectorAll('video, audio'), function (m) { try { m.pause(); } catch (e) {} });
  }

  function route() {
    clearTimers();
    stopMedia();
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'letters') renderLetters();
    else if (parts[0] === 'letter' && parts[1]) renderLetter(decodeURIComponent(parts[1]));
    else if (parts[0] === 'final') { if (allOpen()) renderFinal(); else return go('letters', true); }
    else renderStart();
    window.scrollTo(0, 0);
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go], [data-action]');
    if (!el) return;
    if (el.getAttribute('data-action') === 'final') {
      if (!allOpen()) {
        el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake');
        say(line('finalLocked', 'Это письмо откроется последним.'), 'think');
        return;
      }
      if (state.finalSeen) return go('final');
      clearTimers();
      playOpening(lastSender(), function () { go('final'); });
      return;
    }
    go(el.getAttribute('data-go'));
  });

  // Битое фото: показываем первую букву имени
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img && img.classList && img.classList.contains('js-photo')) {
      var span = document.createElement('span');
      span.className = 'avatar-fallback';
      span.textContent = img.getAttribute('data-initial') || '?';
      img.replaceWith(span);
    }
  }, true);

  /* ---------- Скрытый сброс: 5 быстрых тапов по заголовку ---------- */
  var taps = [];
  app.addEventListener('click', function (e) {
    if (!e.target.closest('.js-reset')) return;
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 2000; });
    taps.push(now);
    if (taps.length >= 5) {
      taps = [];
      if (window.confirm('Сбросить весь прогресс? Все письма снова будут запечатаны.')) {
        resetState();
        go('', false);
        route();
      }
    }
  });

  /* ---------- Старт ---------- */
  if (/[?&]reset\b/.test(location.search)) {
    resetState();
    history.replaceState(null, '', location.pathname);
  }

  fetch('content.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      C = data;
      C.locks = (C.locks || []).filter(function (l) { return l && l.id != null; });
      window.addEventListener('hashchange', route);
      route();
    })
    .catch(function (err) {
      app.innerHTML = '<div class="error-box"><div>' +
        '<p>Письма задержались в пути. Обнови страницу.</p>' +
        (location.protocol === 'file:' ? '<p style="margin-top:12px">Для Влада: сайт нужно открывать через сервер, см. README.</p>' : '') +
        '<p style="margin-top:12px;opacity:.6;font-size:13px">' + esc(err && err.message) + '</p>' +
      '</div></div>';
    });
})();
