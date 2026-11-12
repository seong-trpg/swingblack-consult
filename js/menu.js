/*
 * 멤버십·레슨권 메뉴북과 패키지 안내 화면 (2026-11-12 추가).
 * 홈의 큰 버튼 1번과 2번이 여는 화면이다. 금액은 모두 SBPricing이 계산한 값을 그대로 보여 준다.
 */
(function (root) {
  'use strict';

  var SB = root.SBApp, P = root.SBPricing, IL = root.SBIllust;
  var esc = SB.esc, A = SB.actions;
  var CHECK = '<span class="c-check">' + IL.icon('check') + '</span>';

  function useSale() { return SB.builder.useSale(); }
  // 표 칸의 금액: 할인 적용 중이고 할인가가 있으면 원가에 줄을 긋고 할인가를 보여 준다.
  function amount(c) {
    return (c.onSale ? '<s>' + P.fmt(c.price) + '</s>' : '') + '<b' + (c.onSale ? ' class="sale"' : '') + '>' + P.fmt(c.shown) + '</b>';
  }

  // ---------- 멤버십·레슨권 메뉴북 ----------
  SB.screens.menu = {
    render: function () {
      var cfg = SB.cfg, on = useSale();
      var board = P.board(cfg, on), lessons = P.lessonTable(cfg, on);

      var mem = '<table class="sheet mb"><thead><tr><th>기간</th>' + [1, 2, 3].map(function (n) {
        return '<th class="r"><b class="t' + n + '">' + P.SLOTS[n].name + '</b><small>' + P.SLOTS[n].range + '</small></th>';
      }).join('') + '</tr></thead><tbody>' + board.rows.map(function (r) {
        return '<tr><th>' + r.months + '개월</th>' + r.cells.map(function (c) {
          return '<td class="r"><button class="mb-pick" data-act="menu-pick" data-slot="' + c.slot + '" data-months="' + c.months + '"' +
            ' aria-label="' + c.months + '개월 ' + P.SLOTS[c.slot].name + ' ' + P.fmt(c.shown) + '원, 이 구성으로 이용권 설계 열기">' + amount(c) +
            (c.months > 1 ? '<em>한 달에 ' + P.fmt(c.monthly) + '</em>' : '<em> </em>') + '</button></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';

      var solo = '<table class="sheet mb"><thead><tr><th>횟수</th>' + lessons.map(function (l) {
        return '<th class="r"><b>' + l.min + '분 레슨</b></th>';
      }).join('') + '</tr></thead><tbody>' + P.LESSON_COUNTS.map(function (count, i) {
        return '<tr><th>' + count + '회</th>' + lessons.map(function (l) {
          var x = l.rows[i].solo;
          return '<td class="r">' + amount(x) + '<em>1회 ' + P.fmt(x.perSession) + ' · 유효기간 ' + x.validity + '개월</em></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';

      var etc = '<table class="sheet mb"><tbody>' +
        '<tr><th>일일 이용권</th><td>1일 1회</td><td class="r">' + amount(board.daily) + '</td></tr>' +
        board.coupons.map(function (c) {
          return '<tr><th>' + c.count + '회 쿠폰</th><td>' + c.months + '개월 안에 ' + c.count + '번 방문</td><td class="r">' + amount(c) + '</td></tr>';
        }).join('') +
        board.lockers.map(function (l) {
          return '<tr><th>락커 ' + l.name + '</th><td>한 달 요금</td><td class="r">' + amount(l) + '</td></tr>';
        }).join('') + '</tbody></table>';

      return {
        html: '<h1 class="q">멤버십·레슨권 메뉴북</h1>' +
          '<p class="q-sub">금액 단위는 원입니다. 멤버십 가격을 누르면 그 구성으로 이용권 설계가 열립니다.</p>' +
          '<h2 class="sec flat">멤버십</h2>' + mem +
          '<h2 class="sec">레슨권 <small>레슨만 따로 받을 때</small></h2>' + solo +
          '<p class="note-line mb-note">' + IL.icon('info') + '<span>3개월 이상 멤버십과 함께하면 레슨이 패키지 가격으로 내려갑니다. ' +
          '<button class="link" data-act="go" data-to="package">패키지 안내 보기' + IL.icon('next') + '</button></span></p>' +
          '<h2 class="sec">일일 이용권 · 쿠폰 · 락커</h2>' + etc +
          '<div class="cta2"><button class="btn primary" data-act="go" data-to="builder">이용권 설계로 직접 조합하기</button>' +
          '<button class="btn ghost" data-act="go" data-to="package">패키지 안내</button></div>'
      };
    }
  };
  A['menu-pick'] = function (d) {
    SB.pickMembership(+d.slot, +d.months);
  };

  // ---------- 패키지 안내 ----------
  SB.screens.package = {
    enter: function () {
      if (!SB.S.pkgSlot) SB.S.pkgSlot = SB.S.b.slot || 1;
    },
    render: function () {
      var cfg = SB.cfg, on = useSale(), slot = SB.S.pkgSlot || 1;
      var lessons = P.lessonTable(cfg, on);
      var extra = P.packageExtraList(cfg);

      var table = '<table class="sheet mb"><thead><tr><th>횟수</th>' + lessons.map(function (l) {
        return '<th class="r"><b>' + l.min + '분 레슨</b><small>패키지 가격</small></th>';
      }).join('') + '<th class="r">레슨 기간</th></tr></thead><tbody>' + P.LESSON_COUNTS.map(function (count, i) {
        var first = lessons[0].rows[i];
        return '<tr><th>' + count + '회</th>' + lessons.map(function (l) {
          var x = l.rows[i];
          return '<td class="r">' + amount(x.pkg) + '<em>1회 ' + P.fmt(x.pkg.perSession) +
            (x.saving > 0 ? ' · 따로보다 ' + P.fmt(x.saving) + ' 절약' : '') + '</em></td>';
        }).join('') + '<td class="r"><b>' + first.pkg.validity + '개월</b>' +
          (first.extraMonths > 0 ? '<em class="tag more">+' + first.extraMonths + '개월</em>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>';

      var cards = SB.builder.PRESETS.map(function (p) {
        var q = P.quote({ kind: 'membership', slot: slot, months: p[0], lesson: { min: 15, count: p[1] }, locker: null }, cfg);
        var v = P.view(q, on), sale = on && q.hasAnySale;
        return '<button class="choice pkg" data-act="pk-pick" data-m="' + p[0] + '" data-c="' + p[1] + '">' +
          '<span class="c-name">' + p[0] + '개월 + 레슨 ' + p[1] + '회</span>' +
          (q.lesson.saving > 0 ? '<em class="tag save">레슨 ' + P.fmt(q.lesson.saving) + '원 절약</em>' : '') +
          '<span class="c-price">' + (sale ? '<s class="was">' + P.fmt(q.total) + '원</s>' : '') + SB.money(v.total, sale ? 'sale' : '') + '</span>' +
          '<span class="c-note">한 달에 ' + P.fmt(v.monthly) + '원</span>' + CHECK + '</button>';
      }).join('');

      return {
        scrollKey: 'pkg',
        html: '<h1 class="q">패키지 안내</h1>' +
          '<p class="q-sub">' + esc(cfg.texts.builderTagline) + '</p>' +
          '<div class="pk-eq"><div><b>멤버십</b><span>3개월 이상</span></div><i>+</i><div><b>레슨</b><span>8~32회</span></div><i>=</i>' +
          '<div class="on"><b>패키지</b><span>레슨이 패키지 가격으로</span></div></div>' +
          '<p class="payout">' + esc(cfg.lessonInfo.payout) + '</p>' +
          '<h2 class="sec">패키지 레슨 가격</h2>' + table +
          (extra.length ? '<p class="note-line mb-note">' + IL.icon('info') + '<span>' + extra.map(function (x) { return x.count + '회'; }).join('·') +
            ' 패키지는 레슨만 따로 받을 때보다 레슨 기간이 깁니다.</span></p>' : '') +
          '<h2 class="sec" id="pkPicks">추천 패키지</h2>' +
          '<p class="q-sub">시간대를 고르면 멤버십과 15분 레슨을 묶은 가격이 나옵니다. 누르면 그 구성의 견적이 열립니다.</p>' +
          '<div class="seg" role="tablist">' + [1, 2, 3].map(function (n) {
            return '<button class="' + (slot === n ? 'on' : '') + '" data-act="pk-slot" data-v="' + n + '">' + P.SLOTS[n].name + ' ' + P.SLOTS[n].range + '</button>';
          }).join('') + '</div>' +
          '<div class="pkg-grid">' + cards + '</div>' +
          '<div class="cta2"><button class="btn primary" data-act="go" data-to="builder">이용권 설계로 직접 조합하기</button>' +
          '<button class="btn ghost" data-act="go" data-to="menu">메뉴북 보기</button></div>'
      };
    }
  };
  A['pk-slot'] = function (d) {
    SB.sfx('click');
    SB.S.pkgSlot = +d.v;
    SB.render();
  };
  A['pk-pick'] = function (d) {
    SB.pickPackage(SB.S.pkgSlot || 1, +d.m, +d.c);
  };
})(typeof self !== 'undefined' ? self : this);
