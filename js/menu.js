/*
 * 멤버십·레슨권 메뉴북과 패키지 안내 화면. 홈의 큰 버튼 1번과 2번이 연다.
 *
 * 2026-11-12 사용자 결정: 이 두 화면은 센터가 만든 가격표 이미지를 그대로, 두 장을 옆으로 넘기면서 본다.
 * 이미지 말고 다른 내용(제목, 표, 버튼)은 두지 않는다. 상단 바도 없고, 왼쪽 위에 뒤로 아이콘 버튼 하나만 있다.
 * 넘겨 볼 수 있는 두 장이라는 것이 보이도록
 * 다음 장을 옆에 살짝 걸쳐 두고, 아래에 장 표시(점, 1 / 2, 이전·다음)를 둔다.
 *
 * 이미지에는 금액이 그려져 있다. 가격표를 바꾸면 이미지도 새로 받아 바꿔야 한다(assets/images/menu/).
 */
(function (root) {
  'use strict';

  var SB = root.SBApp, IL = root.SBIllust;
  var esc = SB.esc, A = SB.actions;
  var doc = root.document;

  // 화면별 장: [이미지 키(assets.json), 설명, 가로 ÷ 세로]
  var BOOKS = {
    menu: [
      ['menu-membership', '멤버십 가격표', 1023 / 1537],
      ['menu-lesson', '레슨·락커 가격표', 805 / 1134]
    ],
    package: [
      ['menu-package-pick', '추천 패키지 상품', 1054 / 1492],
      ['menu-package-all', '패키지 상품 가격표', 1024 / 1536]
    ]
  };

  function pagesOf(name) {
    return BOOKS[name].map(function (p) { return { url: SB.assetUrl(p[0]), alt: p[1], ratio: p[2] }; })
      .filter(function (p) { return p.url; });
  }

  function bookScreen(name) {
    return {
      enter: function () { SB.S.bookPage = 0; },
      render: function () {
        var pages = pagesOf(name), n = pages.length;
        var cur = Math.max(0, Math.min(n - 1, SB.S.bookPage || 0));
        var bar = n > 1
          ? '<div class="pg-bar">' +
            '<button class="pg-nav" data-act="pg-go" data-d="-1" aria-label="이전 장">' + IL.icon('back') + '</button>' +
            '<div class="pg-dots" aria-hidden="true">' + pages.map(function (p, i) { return '<i class="' + (i === cur ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
            '<span class="pg-count"><b id="pgNow">' + (cur + 1) + '</b> / ' + n + '</span>' +
            '<button class="pg-nav" data-act="pg-go" data-d="1" aria-label="다음 장">' + IL.icon('next') + '</button></div>'
          : '';
        return {
          bare: true, // 상단 바 없이 이미지를 크게 보여 준다
          scrollKey: 'book',
          html: '<div class="pg" id="pg" data-n="' + n + '">' +
            '<button class="pg-back" data-act="back" aria-label="뒤로">' + IL.icon('back') + '</button>' +
            '<div class="pg-track" id="pgTrack">' + pages.map(function (p, i) {
            return '<button class="pg-slide' + (i === cur ? ' on' : '') + '" data-act="pg-to" data-i="' + i + '" style="--ar:' + p.ratio.toFixed(4) + '"' +
              ' aria-label="' + esc(p.alt) + ' (' + (i + 1) + '번째 장)">' +
              '<img src="' + esc(p.url) + '" alt="' + esc(p.alt) + '" draggable="false"></button>';
          }).join('') + '</div>' + bar + '</div>'
        };
      },
      after: function () {
        var track = doc.getElementById('pgTrack');
        if (!track) return;
        // 다시 그렸을 때(사진 확인이 끝났을 때 등) 보던 장으로 돌아간다.
        scrollToPage(SB.S.bookPage || 0, false);
        track.addEventListener('scroll', paint, { passive: true });
        paint();
      }
    };
  }

  function slides() { return doc.querySelectorAll('#pgTrack .pg-slide'); }

  // 지금 가운데에 온 장을 찾아 장 표시와 버튼을 맞춘다(화면을 다시 그리지 않는다).
  function paint() {
    var track = doc.getElementById('pgTrack'), list = slides();
    if (!track || !list.length) return;
    var fits = track.scrollWidth <= track.clientWidth + 2; // 두 장이 한 화면에 다 들어오는 넓은 화면
    doc.getElementById('pg').classList.toggle('fit', fits);
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, gap = Infinity;
    Array.prototype.forEach.call(list, function (el, i) {
      var d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < gap) { gap = d; best = i; }
    });
    SB.S.bookPage = best;
    Array.prototype.forEach.call(list, function (el, i) { el.classList.toggle('on', fits || i === best); });
    Array.prototype.forEach.call(doc.querySelectorAll('.pg-dots i'), function (el, i) { el.classList.toggle('on', i === best); });
    var now = doc.getElementById('pgNow');
    if (now) now.textContent = best + 1;
    var nav = doc.querySelectorAll('.pg-nav');
    if (nav.length === 2) { nav[0].disabled = best === 0; nav[1].disabled = best === list.length - 1; }
  }

  function scrollToPage(i, smooth) {
    var track = doc.getElementById('pgTrack'), list = slides();
    if (!track || !list.length) return;
    i = Math.max(0, Math.min(list.length - 1, i));
    var el = list[i];
    var left = el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
    if (track.scrollTo) track.scrollTo({ left: left, behavior: smooth && !SB.reduced ? 'smooth' : 'auto' });
    else track.scrollLeft = left;
  }

  A['pg-go'] = function (d) {
    SB.sfx('click');
    scrollToPage((SB.S.bookPage || 0) + (+d.d), true);
  };
  // 옆에 걸쳐 보이는 장을 누르면 그 장으로 넘긴다.
  A['pg-to'] = function (d) {
    if (+d.i === (SB.S.bookPage || 0)) return;
    SB.sfx('click');
    scrollToPage(+d.i, true);
  };

  SB.screens.menu = bookScreen('menu');
  SB.screens.package = bookScreen('package');
})(typeof self !== 'undefined' ? self : this);
