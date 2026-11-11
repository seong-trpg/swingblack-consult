/*
 * AI 보이스와 효과음.
 * - 음성: 고객이 시작 화면에서 고른 목소리(여성 female / 남성 male)의 파일
 *   assets/audio/voice/<female|male>/<id>.mp3 이 있으면 그 파일을, 없으면 기기의 한국어 음성 합성을 쓴다.
 * - 효과음: 파일 없이 Web Audio로 짧게 합성한다(0.2~1초, 음성보다 작게).
 * - 일시정지: pause()/resume()으로 멈췄다 이어 재생한다(인트로 재생바에서 쓴다).
 */
(function (root) {
  'use strict';

  var voiceOn = true, sfxOn = true, rate = 0.92;
  var ctx = null;
  var kind = 'female';       // 고른 목소리: 'female' 또는 'male'
  var missing = {};          // 음성 파일이 없는 '<목소리>/<id>'
  var currentAudio = null;
  var token = 0;             // 재생 중인 멘트 식별(중간에 끊긴 멘트의 콜백을 무시)
  var last = null;
  var onCaption = function () {};
  var koVoice = null;
  /*
   * 지금 재생 중인 멘트. mode는 소리를 내는 방식이다.
   *   howl  녹음 파일 재생            → 멈춘 자리에서 이어 재생할 수 있다
   *   tts   기기 음성 합성            → 기기마다 일시정지가 불안정해, 멈추면 끊고 재개할 때 처음부터 다시 읽는다
   *   timer 소리 없이 자막만(음성 꺼짐) → 남은 시간만큼 다시 기다린다
   */
  var cur = null;
  var paused = false;

  // 기기 음성 합성에서 고른 목소리와 같은 성별의 한국어 음성을 찾는다.
  // 기기 음성 이름에 성별이 드러나는 경우에만 맞출 수 있고, 못 찾으면 기기의 기본 한국어 음성을 쓴다.
  var NAME = {
    male: /(^|[^e])male|남성|남자|injoon|인준|hyunsu|현수|bongjin|봉진|gookmin|국민/i,
    female: /female|여성|여자|heami|해미|sunhi|선히|yuna|유나|jimin|지민|seoyeon|서연|soonbok|순복|yujin|유진/i
  };
  function pickVoice() {
    if (!root.speechSynthesis) return;
    var list = (root.speechSynthesis.getVoices() || []).filter(function (v) { return /^ko/i.test(v.lang); });
    koVoice = list.filter(function (v) { return NAME[kind].test(v.name || ''); })[0] || list[0] || null;
  }
  function setKind(k) {
    kind = k === 'male' ? 'male' : 'female';
    pickVoice();
  }

  // 브라우저는 화면을 터치하기 전에는 소리를 막으므로 첫 터치에서 호출한다.
  function unlock() {
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (AC && !ctx) ctx = new AC();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* 소리 없이 진행 */ }
    if (root.speechSynthesis) {
      pickVoice();
      root.speechSynthesis.onvoiceschanged = pickVoice;
    }
  }

  function stop() {
    token++;
    if (cur) { root.clearTimeout(cur.timer); cur = null; }
    paused = false;
    if (currentAudio) { try { currentAudio.stop(); currentAudio.unload(); } catch (e) {} currentAudio = null; }
    if (root.speechSynthesis) { try { root.speechSynthesis.cancel(); } catch (e) {} }
    onCaption(null);
  }

  // 글자 수로 어림한 낭독 시간(음성이 꺼져 있을 때 자막을 띄워 둘 시간)
  function estimate(text) {
    return Math.max(2600, Math.round(text.length * 150 / rate));
  }

  /*
   * speak(text, { id, say, onend })
   * 음성이 꺼져 있어도 자막은 띄우고, 어림한 시간이 지나면 onend를 부른다.
   */
  function speak(text, opt) {
    opt = opt || {};
    stop();
    var my = ++token;
    last = { text: text, opt: { id: opt.id, say: opt.say } };
    onCaption(text);

    var finished = false;
    var me = { my: my, text: text, opt: opt, mode: 'timer', soundId: null, timer: null, left: 0, armedAt: 0, done: done, startedAt: Date.now(), silenced: false };
    cur = me;

    function done() {
      if (finished || my !== token) return;
      finished = true;
      root.clearTimeout(me.timer);
      if (cur === me) cur = null;
      onCaption(null);
      if (opt.onend) opt.onend();
    }
    // ms 뒤에 끝난 것으로 처리한다. 일시정지하면 남은 시간을 기억했다가 다시 건다.
    function arm(ms) {
      root.clearTimeout(me.timer);
      me.left = ms;
      me.armedAt = Date.now();
      me.timer = root.setTimeout(done, ms);
    }
    me.arm = arm;

    if (!voiceOn) { arm(estimate(text)); return; }

    // 음성이 멈춘 채 끝나지 않는 경우를 대비한 안전 장치
    arm(estimate(text) * 2 + 3000);

    function silent() { me.mode = 'timer'; arm(estimate(text)); }

    function tts() {
      if (my !== token) return;
      if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) { silent(); return; }
      try {
        me.mode = 'tts';
        var u = new root.SpeechSynthesisUtterance(opt.say || text);
        var started = false;
        u.lang = 'ko-KR';
        if (koVoice) u.voice = koVoice;
        u.rate = rate;
        u.onstart = function () { started = true; };
        // 낭독 도중에 소리를 끄면(silenced) 낭독은 끊기지만 멘트는 남은 시간만큼 자막으로 이어진다(setVoice).
        u.onend = function () { if (!me.silenced) done(); };
        u.onerror = function () { if (!me.silenced) root.setTimeout(done, 400); };
        root.speechSynthesis.speak(u);
        // 기기에 한국어 음성이 없어 소리가 시작되지 않으면 자막만 보여 주고 넘어간다.
        root.setTimeout(function () {
          if (started || finished || my !== token || me.silenced) return;
          try { root.speechSynthesis.cancel(); } catch (e) {}
          silent();
        }, 2500);
      } catch (e) { silent(); }
    }

    // 미리 만든 음성 파일이 있으면 Howler로 재생하고, 없으면 기기 음성 합성으로 넘어간다.
    var fileKey = kind + '/' + opt.id;
    if (opt.id && !missing[fileKey] && root.Howl) {
      var fallback = function () {
        missing[fileKey] = true;
        if (currentAudio) { try { currentAudio.unload(); } catch (e) {} currentAudio = null; }
        tts();
      };
      try {
        me.mode = 'howl';
        currentAudio = new root.Howl({
          src: ['assets/audio/voice/' + fileKey + '.mp3'],
          onend: done, onloaderror: fallback, onplayerror: fallback
        });
        me.soundId = currentAudio.play();
        return;
      } catch (e) { missing[fileKey] = true; }
    }
    tts();
  }

  /*
   * 음성을 켜고 끈다. 재생 중인 멘트는 끊지 않는다(인트로에서 음소거해도 장면이 그대로 이어지게 하기 위함이다).
   *   녹음 파일: 소리만 줄였다가, 다시 켜면 그 자리에서 다시 들린다.
   *   기기 음성 합성: 소리만 끌 수 없어 낭독을 끊고, 남은 시간만큼 자막만 보여 준다.
   */
  function setVoice(on) {
    on = !!on;
    if (on === voiceOn) return;
    voiceOn = on;
    var c = cur;
    if (!c) return;
    if (c.mode === 'howl' && currentAudio) {
      try { currentAudio.mute(!on); } catch (e) {}
    } else if (c.mode === 'tts' && !on && !paused) {
      c.silenced = true;
      c.mode = 'timer';
      try { root.speechSynthesis.cancel(); } catch (e) {}
      c.arm(Math.max(600, estimate(c.text) - (Date.now() - c.startedAt)));
    }
  }

  function replay() {
    if (last) speak(last.text, last.opt);
  }

  // 재생 중인 멘트를 멈춘다. 멈췄으면 true.
  function pause() {
    if (paused || !cur) return false;
    paused = true;
    root.clearTimeout(cur.timer);
    cur.left = Math.max(0, cur.left - (Date.now() - cur.armedAt));
    if (cur.mode === 'howl' && currentAudio) {
      try { currentAudio.pause(cur.soundId); } catch (e) {}
    } else if (cur.mode === 'tts') {
      token++; // 끊긴 낭독의 콜백을 무시한다. 재개할 때 처음부터 다시 읽는다.
      try { root.speechSynthesis.cancel(); } catch (e) {}
    }
    return true;
  }

  // 멈춘 멘트를 이어 재생한다. 'continue' = 멈춘 자리부터, 'restart' = 처음부터 다시, 'none' = 이어 갈 멘트 없음.
  function resume() {
    if (!paused) return 'none';
    paused = false;
    var c = cur;
    if (!c) return 'none';
    if (c.mode === 'tts') { speak(c.text, c.opt); return 'restart'; }
    if (c.mode === 'howl' && currentAudio) {
      try { currentAudio.play(c.soundId); } catch (e) {}
    }
    c.arm(Math.max(300, c.left));
    return 'continue';
  }

  // 재생 중인 녹음 파일의 길이(초). 녹음 파일이 아니거나 아직 읽는 중이면 0.
  function duration() {
    try {
      if (cur && cur.mode === 'howl' && currentAudio && currentAudio.state() === 'loaded') return currentAudio.duration() || 0;
    } catch (e) {}
    return 0;
  }

  // 효과음 합성 도우미
  function tone(freq, start, dur, type, gain, slideTo) {
    if (!ctx) return;
    var t = ctx.currentTime + start;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(start, dur, gain, freq) {
    if (!ctx) return;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 1800;
    g.gain.value = gain || 0.04;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(ctx.currentTime + start);
  }

  var SFX = {
    click: function () { tone(660, 0, 0.07, 'triangle', 0.06); },
    tick: function () { tone(1200, 0, 0.04, 'square', 0.018); },
    pop: function () { tone(420, 0, 0.12, 'sine', 0.08, 880); },
    ding: function () { tone(1320, 0, 0.5, 'sine', 0.07); tone(1980, 0.02, 0.4, 'sine', 0.03); },
    chime: function () { tone(523, 0, 0.6, 'sine', 0.06); tone(784, 0.09, 0.6, 'sine', 0.05); },
    whoosh: function () { noise(0, 0.25, 0.05, 1400); tone(500, 0.16, 0.12, 'sine', 0.06, 900); },
    sweep: function () { tone(300, 0, 0.6, 'sine', 0.05, 1100); },
    lock: function () { tone(140, 0, 0.18, 'sine', 0.12, 80); noise(0.12, 0.06, 0.05, 700); },
    cup: function () { tone(220, 0, 0.1, 'sine', 0.09, 150); tone(180, 0.12, 0.1, 'sine', 0.06, 120); },
    swing: function () { noise(0, 0.3, 0.06, 2600); },
    sparkle: function () {
      tone(1568, 0, 0.25, 'sine', 0.05); tone(2093, 0.07, 0.25, 'sine', 0.045);
      tone(2637, 0.14, 0.35, 'sine', 0.04); noise(0, 0.12, 0.02, 6000);
    },
    confirm: function () { tone(660, 0, 0.12, 'sine', 0.06); tone(990, 0.11, 0.2, 'sine', 0.06); },
    warn: function () { tone(330, 0, 0.16, 'triangle', 0.06); tone(262, 0.15, 0.22, 'triangle', 0.06); }
  };

  function sfx(name) {
    if (!sfxOn || !ctx || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* 효과음 실패는 무시 */ }
  }

  root.SBVoice = {
    unlock: unlock, speak: speak, stop: stop, replay: replay, sfx: sfx, estimate: estimate,
    pause: pause, resume: resume, duration: duration,
    isPaused: function () { return paused; },
    setVoice: setVoice,
    // 지금 멘트가 소리를 내는 방식: 'howl'(녹음 파일), 'tts'(기기 음성), 'timer'(소리 없이 자막만), 없으면 null
    mode: function () { return cur ? cur.mode : null; },
    setSfx: function (on) { sfxOn = !!on; },
    setRate: function (r) { rate = r || 0.92; },
    setKind: setKind,
    kind: function () { return kind; },
    isVoiceOn: function () { return voiceOn; },
    isSfxOn: function () { return sfxOn; },
    hasLast: function () { return !!last; },
    onCaption: function (fn) { onCaption = fn; }
  };
})(typeof self !== 'undefined' ? self : this);
