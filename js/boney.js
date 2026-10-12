/* Рисунки: такса Боня, корона, замочек, печать, торт.
   Всё в SVG, чтобы не грузить картинки и красить из CSS. */

window.Art = (function () {
  // Принц Боня (мальчик). Смотрит вправо. withLetter — держит конверт в зубах.
  function boney(opts) {
    opts = opts || {};
    var letter = opts.withLetter
      ? '<g class="b-letter" transform="translate(196 60) rotate(12)">' +
          '<rect x="0" y="0" width="30" height="21" rx="2.5" fill="#fffaf6" stroke="currentColor" stroke-width="2"/>' +
          '<path d="M1.5 2 L15 12 L28.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M15 14.5 c-1.6-1.6-4.2-.4-3.4 1.6 .6 1.4 2.4 2.4 3.4 3.2 1-.8 2.8-1.8 3.4-3.2 .8-2-1.8-3.2-3.4-1.6z" fill="#d9648c"/>' +
        '</g>'
      : '';

    return '' +
      '<svg class="boney" viewBox="0 0 240 132" role="img" aria-label="Такса Боня в короне">' +
        // хвост
        '<g class="b-tail"><path d="M50 74 C 38 68, 30 58, 27 45" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M50 74 C 38 68, 30 58, 27 45" fill="none" stroke="#e7b68a" stroke-width="3.2" stroke-linecap="round"/></g>' +
        // дальние лапки
        '<rect x="70" y="86" width="13" height="26" rx="6.5" fill="#c98a5c" stroke="currentColor" stroke-width="2.2"/>' +
        '<rect x="140" y="86" width="13" height="26" rx="6.5" fill="#c98a5c" stroke="currentColor" stroke-width="2.2"/>' +
        // тело
        '<path d="M52 68 C 64 55, 134 53, 152 61 C 166 67, 168 90, 152 97 C 126 105, 76 105, 56 99 C 38 93, 38 75, 52 68 Z" fill="#e7b68a" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M70 92 C 92 99, 126 99, 146 92" fill="none" stroke="#f3d3b4" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
        // ближние лапки
        '<rect x="58" y="90" width="14" height="25" rx="7" fill="#e7b68a" stroke="currentColor" stroke-width="2.4"/>' +
        '<rect x="128" y="90" width="14" height="25" rx="7" fill="#e7b68a" stroke="currentColor" stroke-width="2.4"/>' +
        // голова
        '<g class="b-head">' +
          '<path d="M144 64 C 139 45, 150 30, 167 30 C 180 30, 188 38, 192 47 C 201 49, 211 53, 213 60 C 215 67, 208 71, 200 71 C 189 71, 177 73, 167 75 C 155 77, 146 74, 144 64 Z" fill="#e7b68a" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
          // ошейник с сердечком
          '<path d="M146 66 C 150 75, 158 79, 167 78" fill="none" stroke="#d9648c" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M160 82 c-2-2-5.2-.5-4.2 2 .7 1.7 3 3 4.2 4 1.2-1 3.5-2.3 4.2-4 1-2.5-2.2-4-4.2-2z" fill="#d9648c" stroke="currentColor" stroke-width="1.4"/>' +
          // нос, глаз, рот, румянец
          '<ellipse cx="211" cy="59" rx="4.6" ry="4" fill="currentColor"/>' +
          '<ellipse cx="186" cy="60" rx="7" ry="4" fill="#f2a7bf" opacity=".75"/>' +
          '<g class="b-eye-open"><ellipse cx="177" cy="47" rx="3.6" ry="4.4" fill="currentColor"/><circle cx="178.3" cy="45.4" r="1.3" fill="#fff"/></g>' +
          '<path class="b-eye-happy" d="M172.5 48 Q 177 42.5, 181.5 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path d="M196 67 C 199 70.5, 203 70.5, 206 67.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
          // ухо
          '<path class="b-ear" d="M162 35 C 149 33, 143 46, 145 61 C 146 72, 154 78, 160 73 C 166 67, 168 50, 162 35 Z" fill="#b8754a" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
          // корона
          '<g class="b-crown" transform="rotate(-10 172 24)">' +
            '<path d="M157 31 L160 15 L167 23 L172.5 11 L178 23 L185 15 L188 31 Z" fill="#f3dca6" stroke="#b98a2f" stroke-width="2.2" stroke-linejoin="round"/>' +
            '<circle cx="160" cy="14.5" r="2.2" fill="#f2a7bf" stroke="#b98a2f" stroke-width="1.2"/>' +
            '<circle cx="172.5" cy="10.5" r="2.6" fill="#d9648c" stroke="#b98a2f" stroke-width="1.2"/>' +
            '<circle cx="185" cy="14.5" r="2.2" fill="#f2a7bf" stroke="#b98a2f" stroke-width="1.2"/>' +
          '</g>' +
        '</g>' +
        letter +
      '</svg>';
  }

  function crown(cls) {
    return '<svg class="' + (cls || 'crown') + '" viewBox="0 0 40 24" aria-hidden="true">' +
      '<path d="M5 21 L7 6 L14 13 L20 3 L26 13 L33 6 L35 21 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<circle cx="7" cy="5" r="1.6" fill="currentColor"/><circle cx="20" cy="2.4" r="1.8" fill="currentColor"/><circle cx="33" cy="5" r="1.6" fill="currentColor"/>' +
      '</svg>';
  }

  function lock() {
    return '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M8 10.5 V8 a4 4 0 0 1 8 0 v2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<rect x="5.5" y="10.5" width="13" height="10" rx="2.6" fill="currentColor"/>' +
      '<path d="M12 14.4 v2.2" stroke="#b8376a" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>';
  }

  function heart() {
    return '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 20.5 C 7 17, 3 13.6, 3 9.4 C 3 6.6, 5.2 4.5, 7.8 4.5 C 9.6 4.5, 11 5.5, 12 7 C 13 5.5, 14.4 4.5, 16.2 4.5 C 18.8 4.5, 21 6.6, 21 9.4 C 21 13.6, 17 17, 12 20.5 Z" fill="currentColor"/>' +
      '</svg>';
  }

  // Сургучная печать: волнистый круг. Половинки нужны для анимации «раскола».
  var SEAL_PATH = 'M50 4 C58 4 61 10 68 11 C75 12 80 8 86 14 C91 19 87 25 90 31 C93 38 98 42 97 50 C96 58 90 61 89 68 C88 75 92 80 86 86 C81 91 75 87 69 90 C62 93 58 98 50 97 C42 96 39 90 32 89 C25 88 20 92 14 86 C9 81 13 75 10 69 C7 62 2 58 3 50 C4 42 10 39 11 32 C12 25 8 20 14 14 C19 9 25 13 31 10 C38 7 42 4 50 4 Z';

  function seal(inner, variant) {
    var fill = variant === 'gold' ? 'url(#sealGold)' : 'url(#sealRose)';
    return '<svg class="seal-svg" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g class="seal-left"><path d="' + SEAL_PATH + '" fill="' + fill + '" clip-path="url(#sealClipL)"/></g>' +
      '<g class="seal-right"><path d="' + SEAL_PATH + '" fill="' + fill + '" clip-path="url(#sealClipR)"/></g>' +
      '<circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>' +
      '</svg>' +
      '<span class="seal-inner">' + inner + '</span>';
  }

  function cake() {
    return '<svg class="cake" viewBox="0 0 120 110" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M60 14 c-4 5-4 9 0 11 4-2 4-6 0-11z" fill="#f3dca6" stroke="#b98a2f"/>' +
        '<path d="M60 25 v12"/>' +
        '<rect x="30" y="37" width="60" height="26" rx="6" fill="#fde1ea"/>' +
        '<path d="M30 46 c6 6 10 6 15 0 c5 6 10 6 15 0 c5 6 10 6 15 0 c5 6 10 6 15 0" fill="#fffaf6"/>' +
        '<rect x="18" y="63" width="84" height="30" rx="7" fill="#f8c8d7"/>' +
        '<path d="M18 72 c7 7 12 7 17 0 c5 7 11 7 17 0 c5 7 11 7 17 0 c5 7 11 7 17 0 c5 7 10 7 16 0" fill="#fffaf6"/>' +
        '<path d="M10 99 h100"/>' +
      '</g>' +
      '<g fill="#d9648c"><circle cx="45" cy="84" r="2.4"/><circle cx="60" cy="86" r="2.4"/><circle cx="75" cy="84" r="2.4"/></g>' +
      '</svg>';
  }

  return { boney: boney, crown: crown, lock: lock, heart: heart, seal: seal, cake: cake };
})();
