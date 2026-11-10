/*
 * 스윙블랙 검단점 가격 계산 모듈 (UI와 분리, 기획서 4-3장 규칙)
 * 브라우저에서는 window.SBPricing, Node 테스트에서는 require()로 사용한다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SBPricing = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SLOTS = {
    1: { name: '1부', range: '00:00~12:00', from: 0, to: 12 },
    2: { name: '2부', range: '00:00~17:00', from: 0, to: 17 },
    3: { name: '3부', range: '종일 (24시간)', from: 0, to: 24 }
  };
  var MONTHS = [1, 3, 6, 12];
  var LESSON_MINUTES = [15, 25];
  var LESSON_COUNTS = [8, 16, 24, 32];
  var LOCKERS = { top: '상단', bottom: '하단' };

  // 이미지 가격표에서 옮긴 초기값. 모두 원가이며 3개월 이상은 10% 할인이 이미 반영된 가격이다.
  function defaultItems() {
    var p = {
      'mem.1.1': 150000, 'mem.1.2': 200000, 'mem.1.3': 250000,
      'mem.3.1': 210000, 'mem.3.2': 290000, 'mem.3.3': 390000,
      'mem.6.1': 399000, 'mem.6.2': 551000, 'mem.6.3': 741000,
      'mem.12.1': 777000, 'mem.12.2': 1073000, 'mem.12.3': 1443000,
      'daily': 15000,
      'coupon.10': 150000, 'coupon.20': 285000,
      'solo.15.8': 144000, 'solo.15.16': 272000, 'solo.15.24': 396000, 'solo.15.32': 512000,
      'solo.25.8': 240000, 'solo.25.16': 452800, 'solo.25.24': 660000, 'solo.25.32': 854400,
      'pkg.15.8': 120000, 'pkg.15.16': 240000, 'pkg.15.24': 360000, 'pkg.15.32': 480000,
      'pkg.25.8': 200000, 'pkg.25.16': 400000, 'pkg.25.24': 600000, 'pkg.25.32': 800000,
      'locker.top': 10000, 'locker.bottom': 20000
    };
    var items = {};
    Object.keys(p).forEach(function (k) { items[k] = { price: p[k], sale: null }; });
    return items;
  }

  function defaultPricing() {
    return {
      items: defaultItems(),
      // 레슨권 유효기간(개월). 패키지는 단독보다 1개월 더 준다.
      validity: {
        solo: { 8: 1, 16: 2, 24: 3, 32: 4 },
        pkg: { 8: 2, 16: 3, 24: 4, 32: 5 }
      },
      couponMonths: { 10: 1, 20: 3 }
    };
  }

  function itemLabel(key) {
    var s = key.split('.');
    if (s[0] === 'mem') return '멤버십 ' + s[1] + '개월 · ' + s[2] + '부';
    if (key === 'daily') return '일일 이용권 (1일)';
    if (s[0] === 'coupon') return s[1] + '회 쿠폰';
    if (s[0] === 'solo') return '레슨 단독 ' + s[1] + '분 · ' + s[2] + '회';
    if (s[0] === 'pkg') return '패키지 레슨 ' + s[1] + '분 · ' + s[2] + '회';
    if (s[0] === 'locker') return '락커 ' + LOCKERS[s[1]] + ' (월)';
    return key;
  }

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  // 항목의 [원가, 할인가] 한 쌍. 할인가가 없으면 원가를 그대로 쓴다.
  function pair(items, key) {
    var it = items[key];
    if (!it || !isNum(it.price)) throw new Error('가격 항목 없음: ' + key);
    var hasSale = isNum(it.sale) && it.sale < it.price;
    return { price: it.price, sale: hasSale ? it.sale : it.price, hasSale: hasSale };
  }

  function isPackageEligible(sel) {
    return sel.kind === 'membership' && (sel.months === 3 || sel.months === 6 || sel.months === 12);
  }

  // 한 달 환산 기준이 되는 이용 개월 수
  function periodMonths(sel, cfg) {
    if (sel.kind === 'membership') return sel.months;
    if (sel.kind === 'coupon') return cfg.couponMonths[sel.coupon];
    return 1; // 일일 이용권은 한 달 방문 일수 기준
  }

  function describe(sel) {
    var parts = [];
    if (sel.kind === 'membership') {
      parts.push(sel.months + '개월');
      if (sel.slot) parts.push(SLOTS[sel.slot].name);
    } else if (sel.kind === 'daily') {
      parts.push('일일 이용 ' + sel.days + '일');
    } else if (sel.kind === 'coupon') {
      parts.push(sel.coupon + '회 쿠폰');
    }
    parts.push(sel.lesson ? '레슨 ' + sel.lesson.min + '분 ' + sel.lesson.count + '회' : '레슨 없음');
    if (sel.locker) parts.push('락커 ' + LOCKERS[sel.locker]);
    return parts.join(' · ');
  }

  /*
   * 선택 내용으로 견적을 만든다. 원가 합계와 할인가 합계를 각각 계산한다.
   * sel = { kind:'membership'|'daily'|'coupon', slot:1|2|3, months:1|3|6|12, days:Number,
   *         coupon:10|20, lesson:null|{min:15|25,count:8|16|24|32}, locker:null|'top'|'bottom' }
   */
  function quote(sel, cfg) {
    var items = cfg.items;
    var lines = [];
    var months = periodMonths(sel, cfg);

    function add(key, label, qty, note) {
      var p = pair(items, key);
      lines.push({
        key: key, label: label, qty: qty, note: note || '',
        unit: p.price, unitSale: p.sale,
        price: p.price * qty, sale: p.sale * qty, hasSale: p.hasSale
      });
    }

    if (sel.kind === 'membership') {
      add('mem.' + sel.months + '.' + sel.slot,
        '멤버십 ' + sel.months + '개월 · ' + SLOTS[sel.slot].name, 1,
        sel.months >= 3 ? '10% 할인 반영가' : '');
    } else if (sel.kind === 'daily') {
      var days = Math.max(1, Math.round(sel.days || 0));
      add('daily', '일일 이용권 ' + days + '일', days, '1일 ' + fmt(items.daily.price) + '원');
    } else if (sel.kind === 'coupon') {
      add('coupon.' + sel.coupon, sel.coupon + '회 쿠폰', 1, months + '개월 안에 ' + sel.coupon + '번 방문');
    } else {
      throw new Error('알 수 없는 이용권 종류: ' + sel.kind);
    }

    var lesson = null;
    if (sel.lesson) {
      var mode = isPackageEligible(sel) ? 'pkg' : 'solo';
      var lkey = mode + '.' + sel.lesson.min + '.' + sel.lesson.count;
      var validity = cfg.validity[mode][sel.lesson.count];
      add(lkey, '레슨 ' + sel.lesson.min + '분 · ' + sel.lesson.count + '회', 1,
        (mode === 'pkg' ? '패키지 레슨가' : '단독 레슨가') + ' · 유효기간 ' + validity + '개월');
      var lp = pair(items, lkey);
      var saving = 0;
      if (mode === 'pkg') {
        saving = pair(items, 'solo.' + sel.lesson.min + '.' + sel.lesson.count).price - lp.price;
      }
      lesson = {
        mode: mode, min: sel.lesson.min, count: sel.lesson.count,
        price: lp.price, sale: lp.sale,
        perSession: Math.round(lp.price / sel.lesson.count),
        salePerSession: Math.round(lp.sale / sel.lesson.count),
        saving: saving > 0 ? saving : 0,
        validityMonths: validity
      };
    }

    // 락커: 한 달 기준 요금 × 이용 개월 수. 일일 이용에는 락커가 없다.
    if (sel.locker && sel.kind !== 'daily') {
      add('locker.' + sel.locker, '락커 ' + LOCKERS[sel.locker] + ' ' + months + '개월', months,
        '월 ' + fmt(items['locker.' + sel.locker].price) + '원');
    }

    var total = 0, saleTotal = 0, hasAnySale = false;
    lines.forEach(function (l) {
      total += l.price; saleTotal += l.sale;
      if (l.hasSale) hasAnySale = true;
    });

    return {
      sel: sel, title: describe(sel), lines: lines, months: months,
      total: total, saleTotal: saleTotal,
      monthly: Math.round(total / months), saleMonthly: Math.round(saleTotal / months),
      lesson: lesson, hasAnySale: hasAnySale,
      discount: total - saleTotal,
      discountRate: total > 0 ? Math.round((total - saleTotal) / total * 1000) / 10 : 0
    };
  }

  // 화면에 지금 보이는 기준(원가 또는 할인가)의 값을 꺼낸다.
  function view(q, useSale) {
    return {
      total: useSale ? q.saleTotal : q.total,
      monthly: useSale ? q.saleMonthly : q.monthly,
      perSession: q.lesson ? (useSale ? q.lesson.salePerSession : q.lesson.perSession) : null
    };
  }

  // 비교함: 최저가, 한 달 환산 최저, 최저가 대비 차액
  function compare(quotes, useSale) {
    var totals = quotes.map(function (q) { return view(q, useSale).total; });
    var monthlies = quotes.map(function (q) { return view(q, useSale).monthly; });
    var minTotal = Math.min.apply(null, totals);
    var minMonthly = Math.min.apply(null, monthlies);
    var many = quotes.length > 1;
    return {
      totals: totals, monthlies: monthlies,
      diffs: totals.map(function (t) { return t - minTotal; }),
      cheapest: totals.map(function (t) { return many && t === minTotal; }),
      bestMonthly: monthlies.map(function (m) { return many && m === minMonthly; })
    };
  }

  // 월 이용권의 한 달 환산가가 일일 이용권 며칠 값인지 (이 일수 이상 오면 월 이용권이 유리)
  function breakevenDays(monthly, dailyPrice) {
    return Math.ceil(monthly / dailyPrice);
  }

  // 1개월권을 이어서 끊을 때와 장기권의 차이
  function repeatOneMonth(slot, months, cfg, useSale) {
    var one = pair(cfg.items, 'mem.1.' + slot);
    var long = pair(cfg.items, 'mem.' + months + '.' + slot);
    var a = (useSale ? one.sale : one.price) * months;
    var b = useSale ? long.sale : long.price;
    return { repeated: a, long: b, saving: a - b, monthly: Math.round(b / months) };
  }

  function fmt(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function won(n) { return fmt(n) + '원'; }

  // 숫자 읽기 규칙: 290000 → 이십구만, 15000 → 만 오천
  function numToKorean(n) {
    n = Math.round(Math.abs(n));
    if (n === 0) return '영';
    var digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    var small = ['', '십', '백', '천'];
    var big = ['', '만', '억', '조'];
    var parts = [];
    var g = 0;
    while (n > 0) {
      var chunk = n % 10000;
      n = Math.floor(n / 10000);
      if (chunk > 0) {
        var segs = [];
        var c = chunk, i = 0;
        while (c > 0) {
          var d = c % 10;
          if (d > 0) segs.unshift((d === 1 && i > 0 ? '' : digits[d]) + small[i]);
          c = Math.floor(c / 10);
          i++;
        }
        var s = segs.join('');
        if (g === 1 && s === '일') s = '';
        parts.unshift(s + big[g]);
      }
      g++;
    }
    return parts.join(' ');
  }
  function wonSpoken(n) { return numToKorean(n) + ' 원'; }

  // 관리자 입력 검증: 저장을 막는 오류와 경고를 나눠 돌려준다.
  function validateItems(items) {
    var errors = [], warnings = [];
    Object.keys(items).forEach(function (k) {
      var it = items[k];
      if (!isNum(it.price) || it.price <= 0) {
        errors.push(itemLabel(k) + ': 원가가 비어 있습니다.');
        return;
      }
      if (it.sale === null || it.sale === undefined || it.sale === '') return;
      if (!isNum(it.sale) || it.sale < 0) errors.push(itemLabel(k) + ': 할인가가 숫자가 아닙니다.');
      else if (it.sale > it.price) errors.push(itemLabel(k) + ': 할인가가 원가보다 큽니다.');
      else if (it.sale === it.price) warnings.push(itemLabel(k) + ': 할인가가 원가와 같아 할인이 없습니다.');
    });
    return { errors: errors, warnings: warnings };
  }

  // 일괄 입력: 원가에 N% 할인을 적용한 할인가
  function bulkSale(price, percent, roundThousand) {
    var v = price * (100 - percent) / 100;
    return roundThousand ? Math.round(v / 1000) * 1000 : Math.round(v);
  }

  function hasAnySaleItem(items) {
    return Object.keys(items).some(function (k) {
      var it = items[k];
      return isNum(it.sale) && it.sale < it.price;
    });
  }

  return {
    SLOTS: SLOTS, MONTHS: MONTHS, LESSON_MINUTES: LESSON_MINUTES, LESSON_COUNTS: LESSON_COUNTS, LOCKERS: LOCKERS,
    defaultPricing: defaultPricing, itemLabel: itemLabel,
    isPackageEligible: isPackageEligible, periodMonths: periodMonths, describe: describe,
    quote: quote, view: view, compare: compare,
    breakevenDays: breakevenDays, repeatOneMonth: repeatOneMonth,
    fmt: fmt, won: won, numToKorean: numToKorean, wonSpoken: wonSpoken,
    validateItems: validateItems, bulkSale: bulkSale, hasAnySaleItem: hasAnySaleItem
  };
});
