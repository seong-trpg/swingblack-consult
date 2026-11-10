/*
 * 설정 저장소: 가격·문구·프로 정보를 기기(브라우저) 안에 저장한다.
 * 변경 이력, 이전 값으로 되돌리기, 백업 파일 내보내기·불러오기를 제공한다.
 */
(function (root) {
  'use strict';

  var KEY = 'swingblack.config.v1';
  var HIST = 'swingblack.history.v1';
  var MAX_HISTORY = 20;
  var memory = {}; // 저장소를 쓸 수 없을 때의 임시 보관

  function read(key) {
    try { return root.localStorage.getItem(key); } catch (e) { return memory[key] || null; }
  }
  function write(key, value) {
    try { root.localStorage.setItem(key, value); return true; }
    catch (e) { memory[key] = value; return false; }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  // 저장된 값에 새 버전의 기본 항목을 채워 넣는다(배열은 저장된 값을 그대로 쓴다).
  function merge(base, saved) {
    if (!isObj(base) || !isObj(saved)) return saved === undefined ? base : saved;
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = merge(base[k], saved[k]); });
    Object.keys(saved).forEach(function (k) { if (!(k in out)) out[k] = saved[k]; });
    return out;
  }

  function load() {
    var base = root.SBDefaults();
    var raw = read(KEY);
    if (!raw) return base;
    try { return migrate(merge(base, JSON.parse(raw)), base); } catch (e) { return base; }
  }

  // 예전 버전에서 저장한 설정을 새 구조로 맞춘다.
  // 프로 목록 같은 배열은 저장된 값을 통째로 쓰므로, 초기값이 바뀌어도 이미 저장한 기기에는 반영되지 않는다.
  function migrate(cfg, base) {
    var from = +cfg.schema || 1;
    if (from < 2) {
      // v2 (2026-11-10): 최승우 프로를 손지민 프로로 교체
      cfg.pros = (cfg.pros || []).map(function (p) {
        if (p.id !== 'choi-seungwoo') return p;
        return base.pros.filter(function (b) { return b.id === 'son-jimin'; })[0] || p;
      });
    }
    cfg.schema = base.schema;
    return cfg;
  }

  function history() {
    try { return JSON.parse(read(HIST) || '[]'); } catch (e) { return []; }
  }

  // 두 설정의 차이를 사람이 읽을 수 있는 목록으로 만든다.
  function diff(before, after) {
    var a = flatten(before), b = flatten(after), out = [];
    var keys = {};
    Object.keys(a).forEach(function (k) { keys[k] = 1; });
    Object.keys(b).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      if (k === 'settings.pinHash') {
        if (a[k] !== b[k]) out.push({ path: k, label: '관리자 PIN', before: '(이전 PIN)', after: '(새 PIN)' });
        return;
      }
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
        out.push({ path: k, label: label(k), before: show(a[k]), after: show(b[k]) });
      }
    });
    return out;
  }

  function flatten(o, prefix, out) {
    out = out || {};
    prefix = prefix || '';
    Object.keys(o).forEach(function (k) {
      var v = o[k], p = prefix ? prefix + '.' + k : k;
      if (isObj(v) && prefix !== 'items') flatten(v, p, out);
      else if (isObj(v)) { out[p + '#price'] = v.price; out[p + '#sale'] = v.sale; }
      else out[p] = v;
    });
    return out;
  }

  function label(path) {
    var m = path.match(/^items\.(.+)#(price|sale)$/);
    if (m) return root.SBPricing.itemLabel(m[1]) + (m[2] === 'price' ? ' 원가' : ' 할인가');
    var names = {
      'schema': '설정 버전', 'discount.on': '할인 적용 버튼', 'discount.start': '할인 시작일', 'discount.end': '할인 종료일',
      'promos': '홍보 문구', 'pros': '프로 정보', 'facility': '시설 소개 카드', 'guide': '이용 안내',
      'texts.promises': '7가지 약속', 'texts.trust': '신뢰 지표', 'texts.terms': '이용약관 원문',
      'texts.slogan1': '홈 슬로건 1', 'texts.slogan2': '홈 슬로건 2', 'texts.pledge': '다짐 문구',
      'texts.builderTagline': '이용권 설계 문구', 'texts.brand': '브랜드명', 'texts.branch': '지점명',
      'settings.voiceOn': 'AI 보이스 기본값', 'settings.sfxOn': '효과음 기본값',
      'settings.voiceRate': '음성 속도', 'settings.idleSec': '무조작 초기화 시간(초)'
    };
    if (names[path]) return names[path];
    var v = path.match(/^validity\.(solo|pkg)\.(\d+)$/);
    if (v) return '레슨 유효기간 ' + (v[1] === 'solo' ? '단독 ' : '패키지 ') + v[2] + '회';
    var c = path.match(/^couponMonths\.(\d+)$/);
    if (c) return c[1] + '회 쿠폰 유효기간';
    return path;
  }

  function show(v) {
    if (v === null || v === undefined || v === '') return '(없음)';
    if (typeof v === 'number') return root.SBPricing.fmt(v);
    if (typeof v === 'boolean') return v ? '켜짐' : '꺼짐';
    if (Array.isArray(v)) return '목록 ' + v.length + '개';
    return String(v);
  }

  // 저장: 변경 전 값을 이력에 남긴다.
  function save(next, note) {
    var prev = load();
    var changes = diff(prev, next);
    if (!changes.length) return { saved: false, changes: [] };
    var h = history();
    h.unshift({ ts: Date.now(), note: note || '', changes: changes, snapshot: prev });
    if (h.length > MAX_HISTORY) h.length = MAX_HISTORY;
    var ok = write(KEY, JSON.stringify(next));
    write(HIST, JSON.stringify(h));
    return { saved: true, persisted: ok, changes: changes };
  }

  function restore(index) {
    var h = history();
    if (!h[index]) return null;
    var snap = h[index].snapshot;
    save(snap, new Date(h[index].ts).toLocaleString('ko-KR') + ' 이전 값으로 되돌림');
    return snap;
  }

  function exportBackup() {
    return JSON.stringify({
      app: 'swingblack-consult', schema: 1, exportedAt: new Date().toISOString(), config: load()
    }, null, 2);
  }

  function importBackup(text) {
    var data = JSON.parse(text);
    if (!data || data.app !== 'swingblack-consult' || !isObj(data.config) || !isObj(data.config.items)) {
      throw new Error('스윙블랙 상담 앱의 백업 파일이 아닙니다.');
    }
    var next = migrate(merge(root.SBDefaults(), data.config), root.SBDefaults());
    var check = root.SBPricing.validateItems(next.items);
    if (check.errors.length) throw new Error('백업 파일의 가격 값에 오류가 있습니다: ' + check.errors[0]);
    save(next, '백업 파일 불러오기');
    return next;
  }

  function resetAll() {
    save(root.SBDefaults(), '초기값으로 되돌림');
    return load();
  }

  // 기간이 정해진 스위치가 오늘 유효한지 (기간이 끝나면 자동으로 꺼진 것으로 본다)
  function activeToday(sw, today) {
    if (!sw || !sw.on) return false;
    var t = today || localDate(new Date());
    if (sw.start && t < sw.start) return false;
    if (sw.end && t > sw.end) return false;
    return true;
  }
  function localDate(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function hashPin(pin) {
    var text = 'swingblack:' + pin;
    if (root.crypto && root.crypto.subtle && root.TextEncoder) {
      return root.crypto.subtle.digest('SHA-256', new root.TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
    }
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return Promise.resolve('x' + (h >>> 0).toString(16));
  }

  root.SBStore = {
    load: load, save: save, history: history, restore: restore, diff: diff,
    exportBackup: exportBackup, importBackup: importBackup, resetAll: resetAll,
    activeToday: activeToday, localDate: localDate, hashPin: hashPin, clone: clone
  };
})(typeof self !== 'undefined' ? self : this);
