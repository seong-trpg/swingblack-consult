/*
 * AI 보이스와 효과음.
 * - 음성: assets/audio/voice/<id>.mp3 파일이 있으면 그 파일을, 없으면 기기의 한국어 음성 합성을 쓴다.
 * - 효과음: 파일 없이 Web Audio로 짧게 합성한다(0.2~1초, 음성보다 작게).
 */
(function (root) {
  'use strict';

  var voiceOn = true, sfxOn = true, rate = 0.92;
  var ctx = null;
  var missing = {};          // 음성 파일이 없는 id
  var currentAudio = null;
  var token = 0;             // 재생 중인 멘트 식별(중간에 끊긴 멘트의 콜백을 무시)
  var last = null;
  var onCaption = function () {};
  var koVoice = null;

  function pickVoice() {
    if (!root.speechSynthesis) return;
    var list = root.speechSynthesis.getVoices() || [];
    koVoice = list.filter(function (v) { return /^ko/i.test(v.lang); })[0] || null;
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
    if (currentAudio) { try { currentAudio.stop(); currentAudio.unload(); } catch (e) {} currentAudio = null; }
    if (root.speechSynthesis) { try { root.speechSynthesis.cancel(); } catch (e) {} }
    onCaption(null);
  }

  // 글자 수로 어림한 낭독 시간(음성이 꺼져 있을 때 자막을 띄워 둘 시간)
  function estimate(text) {
    return Math.max(2600, Math.round(text.length * 150 / rate));
  }

  /*
   * speak(text, { id, say, onend, silentOk })
   * 음성이 꺼져 있어도 자막은 띄우고, 어림한 시간이 지나면 onend를 부른다.
   */
  function speak(text, opt) {
    opt = opt || {};
    stop();
    var my = ++token;
    last = { text: text, opt: { id: opt.id, say: opt.say } };
    onCaption(text);

    var finished = false;
    function done() {
      if (finished || my !== token) return;
      finished = true;
      onCaption(null);
      if (opt.onend) opt.onend();
    }

    if (!voiceOn) { root.setTimeout(done, estimate(text)); return; }

    // 음성이 멈춘 채 끝나지 않는 경우를 대비한 안전 장치
    root.setTimeout(done, estimate(text) * 2 + 3000);

    function tts() {
      if (my !== token) return;
      if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) { root.setTimeout(done, estimate(text)); return; }
      try {
        var u = new root.SpeechSynthesisUtterance(opt.say || text);
        var started = false;
        u.lang = 'ko-KR';
        if (koVoice) u.voice = koVoice;
        u.rate = rate;
        u.onstart = function () { started = true; };
        u.onend = done;
        u.onerror = function () { root.setTimeout(done, 400); };
        root.speechSynthesis.speak(u);
        // 기기에 한국어 음성이 없어 소리가 시작되지 않으면 자막만 보여 주고 넘어간다.
        root.setTimeout(function () {
          if (started || finished || my !== token) return;
          try { root.speechSynthesis.cancel(); } catch (e) {}
          root.setTimeout(done, estimate(text));
        }, 2500);
      } catch (e) { root.setTimeout(done, estimate(text)); }
    }

    // 미리 만든 음성 파일이 있으면 Howler로 재생하고, 없으면 기기 음성 합성으로 넘어간다.
    if (opt.id && !missing[opt.id] && root.Howl) {
      var fallback = function () {
        missing[opt.id] = true;
        if (currentAudio) { try { currentAudio.unload(); } catch (e) {} currentAudio = null; }
        tts();
      };
      try {
        currentAudio = new root.Howl({
          src: ['assets/audio/voice/' + opt.id + '.mp3'],
          onend: done, onloaderror: fallback, onplayerror: fallback
        });
        currentAudio.play();
        return;
      } catch (e) { missing[opt.id] = true; }
    }
    tts();
  }

  function replay() {
    if (last) speak(last.text, last.opt);
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
    setVoice: function (on) { voiceOn = !!on; if (!on) stop(); },
    setSfx: function (on) { sfxOn = !!on; },
    setRate: function (r) { rate = r || 0.92; },
    isVoiceOn: function () { return voiceOn; },
    isSfxOn: function () { return sfxOn; },
    hasLast: function () { return !!last; },
    onCaption: function (fn) { onCaption = fn; }
  };
})(typeof self !== 'undefined' ? self : this);
