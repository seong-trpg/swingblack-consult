/*
 * 인트로 9장면: 장면별 화면(HTML·SVG)과 모션(GSAP).
 * 모션 줄이기 설정이 켜져 있거나 GSAP이 없으면 정지 화면으로 보여 준다.
 */
(function (root) {
  'use strict';

  var IL = root.SBIllust, V = root.SBVoice;

  function letters(text) {
    return String(text).split('').map(function (ch) {
      return '<span>' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
    }).join('');
  }

  var scenes = {
    logo: function (cfg, SB) {
      var logo = SB.photo('brand-logo', cfg.texts.brand);
      return '<div class="in-logo">' +
        (logo ? '<div class="in-logo-img">' + logo + '</div>' : '<div class="in-wm">' + letters(cfg.texts.brand) + '</div>') +
        '<div class="in-rule"></div><div class="in-branch">' + SB.esc(cfg.texts.branch) + '</div>' +
        '<p class="in-slogan">' + SB.esc(cfg.texts.slogan1) + '</p></div>';
    },

    bays: function () {
      var rects = '';
      for (var r = 0; r < 2; r++) {
        for (var i = 0; i < 9; i++) {
          rects += '<g class="in-bay" transform="translate(' + (44 + i * 80) + ',' + (40 + r * 190) + ')">' +
            '<rect class="' + ((i + r) % 2 ? 'fb' : 'fg') + '" width="64" height="150" rx="8"/>' +
            '<rect class="fd" x="10" y="14" width="44" height="50" rx="4" opacity=".35"/>' +
            '<circle class="fd" cx="32" cy="112" r="6" opacity=".5"/></g>';
        }
      }
      return '<svg class="in-svg" viewBox="0 0 800 420">' + rects + '</svg>' +
        '<div class="in-count"><b id="inBayCount">18</b><span>개 타석, 넓고 프라이빗하게</span></div>';
    },

    clock: function () {
      var ticks = '';
      for (var i = 0; i < 12; i++) {
        ticks += '<path class="' + (i % 3 ? 'sb' : 'sg') + '" d="M400 62v' + (i % 3 ? 12 : 22) + '" transform="rotate(' + (i * 30) + ' 400 200)"/>';
      }
      // 오픈 시간에 몰리는 연습장과 24시간 분산되는 스윙블랙
      var other = [0, 0, 0, 0, 0, 0, 96, 70, 44, 30, 88, 60, 40, 34, 30, 34, 40, 52, 66, 72, 58, 40, 24, 0];
      var ours = [22, 18, 16, 16, 20, 28, 36, 42, 40, 36, 36, 38, 40, 38, 36, 36, 38, 42, 46, 48, 44, 38, 32, 26];
      function bars(list) {
        return list.map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join('');
      }
      return '<div class="in-clock-wrap"><svg class="in-svg in-clock" viewBox="200 30 400 340">' +
        '<circle class="fp" cx="400" cy="200" r="150"/><circle class="sg" cx="400" cy="200" r="150"/>' + ticks +
        '<path id="inHand" class="sw" d="M400 200V84" stroke-width="6"/><circle class="fg" cx="400" cy="200" r="10"/></svg>' +
        '<div class="in-24" id="in24">24H</div></div>' +
        '<div class="in-dist"><div><span>오픈 시간에 몰리는 연습장</span><div class="dist other">' + bars(other) + '</div></div>' +
        '<div><span>24시간 분산되는 스윙블랙</span><div class="dist ours">' + bars(ours) + '</div></div></div>';
    },

    gc3: function () {
      return '<svg class="in-svg" viewBox="0 0 800 420">' +
        '<path class="sg" d="M30 392h740"/>' +
        '<rect class="fp" x="70" y="290" width="170" height="100" rx="14"/><rect class="sg" x="70" y="290" width="170" height="100" rx="14"/>' +
        '<circle class="fb" cx="120" cy="340" r="20"/><circle class="fb" cx="186" cy="340" r="20" opacity=".6"/>' +
        '<text class="tw" x="155" y="278" text-anchor="middle" font-size="26" font-weight="800">GC3</text>' +
        '<path id="inTraj" class="sb" d="M310 380Q520 -40 760 210" stroke-width="5"/>' +
        '<circle id="inBall" class="fw" cx="310" cy="380" r="13"/></svg>' +
        '<div class="in-stats">' +
        '<div><small>볼 스피드</small><b data-to="62">62</b><i>m/s</i></div>' +
        '<div><small>발사각</small><b data-to="14">14</b><i>도</i></div>' +
        '<div><small>비거리</small><b data-to="215">215</b><i>m</i></div></div>';
    },

    partition: function () {
      var body = '<path class="sg" d="M30 392h740"/>';
      [150, 400, 650].forEach(function (x) {
        body += '<rect class="fg" x="' + (x - 62) + '" y="366" width="124" height="24" rx="6" opacity=".85"/>' +
          '<circle class="fw" cx="' + x + '" cy="352" r="11"/>';
      });
      [25, 275, 525, 775].forEach(function (x) {
        body += '<rect class="in-panel fb" x="' + (x - 11) + '" y="70" width="22" height="322" rx="6"/>';
      });
      return '<svg class="in-svg" viewBox="0 0 800 420">' + body + '<path class="sg" d="M14 70h772" stroke-width="6"/></svg>' +
        '<div class="in-count"><span>타석마다 칸막이, 타구 사고 걱정 없이</span></div>';
    },

    putting: function () {
      return '<svg class="in-svg" viewBox="0 0 800 420">' +
        '<ellipse class="fp" cx="400" cy="270" rx="360" ry="130"/><ellipse class="sb" cx="400" cy="270" rx="360" ry="130"/>' +
        '<ellipse class="fd" cx="600" cy="250" rx="30" ry="11"/>' +
        '<path class="sw" d="M600 250V60" stroke-width="5"/><path id="inFlag" class="fg" d="M600 62l78 28-78 28z"/>' +
        '<path class="sg" d="M190 318Q400 270 572 254" stroke-dasharray="4 12"/>' +
        '<circle id="inPutt" class="fw" cx="170" cy="322" r="15"/></svg>' +
        '<div class="in-count"><span>실내 퍼팅장과 레슨</span></div>';
    },

    amenity: function () {
      return '<div class="in-tiles">' +
        '<div class="in-tile">' + IL.art('fitting') + '<b>피팅룸</b><span>편하게 옷을 갈아입는 공간</span></div>' +
        '<div class="in-tile">' + IL.art('parking') + '<b>주차 2시간 무료</b><span>연습하는 동안 주차 걱정 없이</span></div></div>';
    },

    slots: function () {
      var P = root.SBPricing;
      return '<div class="in-slots">' + [1, 2, 3].map(function (n) {
        var s = P.SLOTS[n];
        return '<div class="in-slot"><div class="in-slot-h"><b class="t' + n + '">' + s.name + '</b><span>' + s.range + '</span></div>' +
          IL.rail({ ranges: [{ from: s.from, to: s.to, cls: 's' + n }], compact: n < 3 }) + '</div>';
      }).join('') + '</div>';
    },

    start: function (cfg, SB) {
      return '<div class="in-start"><p>궁금하신 점은 편하게 질문해 주세요</p>' +
        '<button class="btn primary xl" data-act="intro-done">상담 시작</button></div>';
    }
  };

  var motion = {
    logo: function (g, el) {
      V.sfx('chime');
      g.from(el.querySelectorAll('.in-wm span, .in-logo-img'), { opacity: 0, y: 26, duration: 0.6, stagger: 0.045, ease: 'power2.out' });
      g.from(el.querySelector('.in-rule'), { scaleX: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.2');
      g.from(el.querySelectorAll('.in-branch, .in-slogan'), { opacity: 0, y: 12, duration: 0.5, stagger: 0.2 }, '-=0.2');
    },
    bays: function (g, el) {
      var count = el.querySelector('#inBayCount'), n = { v: 0 };
      count.textContent = '0';
      g.from(el.querySelectorAll('.in-bay'), {
        opacity: 0.12, duration: 0.3, stagger: { each: 0.12, onStart: function () { V.sfx('tick'); } }
      });
      g.to(n, { v: 18, duration: 2.1, ease: 'none', onUpdate: function () { count.textContent = Math.round(n.v); } }, 0);
    },
    clock: function (g, el) {
      V.sfx('tick');
      g.to(el.querySelector('#inHand'), { rotation: 360, svgOrigin: '400 200', duration: 2.2, ease: 'power1.inOut' });
      g.from(el.querySelector('#in24'), { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2)', onStart: function () { V.sfx('chime'); } });
      g.from(el.querySelectorAll('.dist i'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.012, ease: 'power2.out' }, '-=0.2');
    },
    gc3: function (g, el) {
      var path = el.querySelector('#inTraj'), ball = el.querySelector('#inBall');
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      var t = { v: 0 };
      V.sfx('swing');
      g.to(path, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.out' });
      g.to(t, {
        v: 1, duration: 1.3, ease: 'power2.out',
        onUpdate: function () {
          var p = path.getPointAtLength(len * t.v);
          ball.setAttribute('cx', p.x); ball.setAttribute('cy', p.y);
        }
      }, 0);
      Array.prototype.forEach.call(el.querySelectorAll('.in-stats b'), function (b, i) {
        var o = { v: 0 }, to = +b.getAttribute('data-to');
        b.textContent = '0';
        g.to(o, { v: to, duration: 0.9, ease: 'power1.out', onUpdate: function () { b.textContent = Math.round(o.v); } }, 0.6 + i * 0.15);
      });
    },
    partition: function (g, el) {
      g.from(el.querySelectorAll('.in-panel'), {
        y: -420, duration: 0.5, ease: 'power3.in',
        stagger: { each: 0.22, onComplete: function () { V.sfx('lock'); } }
      });
    },
    putting: function (g, el) {
      var ball = el.querySelector('#inPutt');
      g.to(ball, { x: 430, y: -72, duration: 1.9, ease: 'power2.out' });
      g.to(ball, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.25, onStart: function () { V.sfx('cup'); } });
      g.to(el.querySelector('#inFlag'), { skewY: 6, transformOrigin: '0% 50%', duration: 0.3, yoyo: true, repeat: 3 }, '-=0.2');
    },
    amenity: function (g, el) {
      g.from(el.querySelectorAll('.in-tile'), {
        scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(1.8)',
        stagger: { each: 0.3, onStart: function () { V.sfx('pop'); } }
      });
    },
    slots: function (g, el) {
      g.from(el.querySelectorAll('.in-slot'), { opacity: 0.25, duration: 0.3, stagger: 0.8 });
      g.from(el.querySelectorAll('.rail-fill'), {
        width: 0, duration: 0.8, ease: 'power2.out',
        stagger: { each: 0.8, onStart: function () { V.sfx('sweep'); } }
      }, 0);
    },
    start: function (g, el) {
      g.from(el.querySelectorAll('.in-start > *'), { opacity: 0, y: 20, duration: 0.5, stagger: 0.2 });
    }
  };

  var current = null;

  root.SBIntro = {
    html: function (scene, cfg, SB) {
      return (scenes[scene] || scenes.start)(cfg, SB);
    },
    play: function (scene, el, reduced) {
      if (current) { current.kill(); current = null; }
      if (!el || reduced || !root.gsap || !motion[scene]) return;
      current = root.gsap.timeline();
      try { motion[scene](current, el); } catch (e) { /* 모션 실패 시 정지 화면으로 둔다 */ }
    },
    stop: function () { if (current) { current.kill(); current = null; } },
    // 장면 모션을 멈췄다 이어 재생한다(인트로 재생바의 일시정지·재생)
    pause: function () { if (current) current.pause(); },
    resume: function () { if (current) current.resume(); }
  };
})(typeof self !== 'undefined' ? self : this);
