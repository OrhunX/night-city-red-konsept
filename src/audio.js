// ===== SES: Web Audio ile sentezlenen efektler ve müzik =====
const Sound = (function () {
  let ac = null, master, comp, sfxBus, musBus, noiseBuf, unlockedOnce = false;
  const pref = { sfx: 0.7, mus: 0.45, mute: false };
  try { const p = JSON.parse(localStorage.getItem('ncm-sound') || 'null'); if (p) Object.assign(pref, p); } catch (e) { }
  const listeners = [];
  function savePref() { try { localStorage.setItem('ncm-sound', JSON.stringify(pref)); } catch (e) { } }
  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ac.destination);
      sfxBus = ac.createGain(); musBus = ac.createGain(); sfxBus.connect(master); musBus.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVol();
    }
    if (ac.state === 'suspended') ac.resume().then(notify).catch(() => { });
    return ac;
  }
  const ready = () => !!ac && ac.state === 'running';
  function notify() { listeners.forEach(f => { try { f(); } catch (e) { } }); }
  function applyVol() { if (!ac) return; const m = pref.mute ? 0 : 1; master.gain.setTargetAtTime(m, ac.currentTime, 0.05); sfxBus.gain.setTargetAtTime(pref.sfx, ac.currentTime, 0.05); musBus.gain.setTargetAtTime(pref.mus, ac.currentTime, 0.2); }
  document.addEventListener('pointerdown', () => { ensure(); if (!unlockedOnce && ac) { unlockedOnce = true; setTimeout(notify, 50); } }, true);
  document.addEventListener('keydown', () => ensure(), true);

  // ---- yapı taşları ----
  function out(dest, pan) { if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(dest); return p; } return dest; }
  function noise(t, dur, o) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 1000, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.g || 0.5, t + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out(o.dest || sfxBus, o.pan));
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(t, dur, o) {
    const s = ac.createOscillator(); s.type = o.type || 'sine';
    s.frequency.setValueAtTime(o.f0 || 440, t); if (o.f1) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    if (o.det) s.detune.value = o.det;
    let node = s;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t + dur); f.Q.value = o.q || 0.8; s.connect(f); node = f; }
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.g || 0.4, t + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(out(o.dest || sfxBus, o.pan));
    s.start(t); s.stop(t + dur + 0.05);
  }
  // ---- efekt kataloğu ----
  const SFX = {
    shot: (t, p) => { noise(t, 0.14, { f0: 2400, f1: 500, g: 0.8, pan: p }); tone(t, 0.12, { f0: 140, f1: 50, g: 0.7, pan: p }); },
    heavy: (t, p) => { noise(t, 0.38, { type: 'lowpass', f0: 1600, f1: 200, g: 1, pan: p }); tone(t, 0.3, { f0: 90, f1: 35, g: 0.9, pan: p }); },
    sniper: (t, p) => { noise(t, 0.06, { type: 'highpass', f0: 3500, g: 0.9, pan: p }); tone(t, 0.45, { f0: 220, f1: 50, g: 0.8, pan: p }); noise(t + 0.28, 0.5, { type: 'lowpass', f0: 900, f1: 200, g: 0.2, pan: -p }); },
    auto: (t, p, n) => { for (let i = 0; i < (n || 6); i++) { noise(t + i * 0.075, 0.09, { f0: 2200 + Math.random() * 600, f1: 500, g: 0.6, pan: p }); tone(t + i * 0.075, 0.08, { f0: 130, f1: 55, g: 0.45, pan: p }); } },
    bow: (t, p) => { tone(t, 0.22, { type: 'triangle', f0: 320, f1: 140, g: 0.5, pan: p }); noise(t, 0.2, { type: 'highpass', f0: 3000, g: 0.25, pan: p }); },
    launch: (t, p) => { noise(t, 0.6, { type: 'bandpass', f0: 400, f1: 1800, g: 0.5, q: 0.7, pan: p }); tone(t, 0.25, { f0: 110, f1: 60, g: 0.6, pan: p }); },
    boom: (t, p) => { noise(t, 1.4, { type: 'lowpass', f0: 1200, f1: 60, g: 1.1, a: 0.01, pan: p }); tone(t, 1.1, { f0: 70, f1: 25, g: 1, pan: p }); noise(t + 0.05, 0.5, { type: 'highpass', f0: 2000, g: 0.25, pan: p }); },
    slash: (t, p) => { noise(t, 0.2, { f0: 700, f1: 5200, g: 0.7, q: 2, pan: p }); },
    punch: (t, p) => { tone(t, 0.14, { f0: 160, f1: 55, g: 0.9, pan: p }); noise(t, 0.08, { type: 'lowpass', f0: 600, g: 0.6, pan: p }); },
    chain: (t, p) => { for (let i = 0; i < 7; i++) { const tt = t + Math.random() * 0.45; tone(tt, 0.05, { type: 'square', f0: 2200 + Math.random() * 1600, g: 0.12, lp: 6000, pan: p }); noise(tt, 0.04, { type: 'highpass', f0: 5000, g: 0.15, pan: p }); } },
    shield: (t, p) => { tone(t, 0.3, { f0: 1300, f1: 900, g: 0.35, pan: p }); tone(t, 0.25, { f0: 1950, f1: 1400, g: 0.15, pan: p }); },
    hit: (t, p) => { noise(t, 0.12, { type: 'lowpass', f0: 900, g: 0.6, pan: p }); tone(t, 0.1, { f0: 90, f1: 40, g: 0.5, pan: p }); },
    heal: (t) => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(t + i * 0.09, 0.4, { f0: f, g: 0.22 })); },
    crit: (t) => { for (let i = 0; i < 3; i++) { tone(t + i * 0.22, 0.2, { type: 'sawtooth', f0: 880, g: 0.22, lp: 3000 }); tone(t + i * 0.22 + 0.11, 0.1, { type: 'sawtooth', f0: 660, g: 0.22, lp: 3000 }); } },
    death: (t) => { tone(t, 1.2, { type: 'sawtooth', f0: 320, f1: 50, g: 0.35, lp: 1800, lp1: 200 }); noise(t, 0.9, { type: 'lowpass', f0: 600, f1: 80, g: 0.3 }); },
    miss: (t, p) => { noise(t, 0.3, { f0: 3600, f1: 700, g: 0.35, q: 4, pan: p }); },
    dodge: (t, p) => { noise(t, 0.22, { f0: 380, f1: 1600, g: 0.4, q: 1.5, pan: p }); },
    talk: (t, p) => { for (let i = 0; i < 5; i++) tone(t + i * 0.07, 0.06, { type: 'square', f0: 380 + Math.random() * 500, g: 0.08, lp: 2500, pan: p }); },
    scan: (t) => { tone(t, 0.55, { f0: 280, f1: 1600, g: 0.18 }); tone(t + 0.05, 0.5, { f0: 560, f1: 3200, g: 0.06 }); },
    code: (t) => { for (let i = 0; i < 10; i++) tone(t + i * 0.04, 0.03, { type: 'square', f0: 1200 + Math.random() * 2400, g: 0.06, lp: 6000 }); },
    gear: (t) => { for (let i = 0; i < 5; i++) { noise(t + i * 0.07, 0.04, { type: 'bandpass', f0: 4000, q: 8, g: 0.35 }); } },
    clack: (t, p, s) => { const k = clamp(s || 0.5, 0.15, 1); noise(t, 0.035, { f0: 2200 + Math.random() * 1800, q: 3, g: 0.45 * k, pan: p }); tone(t, 0.025, { type: 'triangle', f0: 1400 + Math.random() * 1400, g: 0.18 * k, pan: p }); },
    roll: (t) => { noise(t, 0.35, { f0: 1800, f1: 900, q: 1, g: 0.12 }); },
    ok: (t) => { tone(t, 0.18, { f0: 660, g: 0.25 }); tone(t + 0.12, 0.3, { f0: 990, g: 0.25 }); },
    fail: (t) => { tone(t, 0.35, { type: 'square', f0: 220, f1: 140, g: 0.14, lp: 1400 }); },
    critHi: (t) => { [523, 784, 1046, 1568, 2093].forEach((f, i) => tone(t + i * 0.07, 0.6, { type: 'triangle', f0: f, g: 0.2 })); noise(t + 0.3, 0.8, { type: 'highpass', f0: 6000, g: 0.08 }); tone(t, 0.6, { f0: 110, f1: 220, g: 0.3 }); },
    critLo: (t) => { tone(t, 0.9, { type: 'sawtooth', f0: 400, f1: 60, g: 0.3, lp: 2200, lp1: 300 }); for (let i = 0; i < 6; i++) noise(t + i * 0.08, 0.05, { type: 'bandpass', f0: 800 + Math.random() * 3000, q: 6, g: 0.3 }); },
    ping: (t) => { tone(t, 0.18, { f0: 1320, g: 0.2 }); tone(t + 0.09, 0.2, { f0: 1760, g: 0.12 }); },
  };
  function play(name, pan, arg, delay) {
    if (!ready() || pref.mute || !SFX[name]) return;
    try { SFX[name](ac.currentTime + 0.01 + (delay || 0), pan || 0, arg); } catch (e) { }
  }

  // ---- müzik: 4 özgün parça, adım sıralayıcı ----
  const m2f = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = { // akorlar (MIDI)
    Am9: [57, 60, 64, 67, 71], Fmaj7: [53, 57, 60, 64], Dm9: [50, 53, 57, 60, 64], Em7: [52, 55, 59, 62], Cmaj7: [48, 52, 55, 59],
    Cm: [48, 51, 55], Ab: [44, 48, 51], G: [43, 47, 50], Fm: [41, 44, 48], Eb: [51, 55, 58],
    Em: [52, 55, 59], C: [48, 52, 55], D: [50, 54, 57], B: [47, 51, 54],
    Fsm: [54, 57, 61], Dmaj: [50, 54, 57], E: [52, 56, 59], Csm: [49, 52, 56],
  };
  const TRACKS = {
    calm: { n: 'Neon Yağmur', d: 'Sakin', bpm: 74, chords: ['Am9', 'Fmaj7', 'Dm9', 'Em7'], kick: '1...............', snare: '', hat: '', bass: '1.......1.......', arp: '1.2.3.4.5.4.3.2.', arpOct: 12, arpWave: 'triangle', lead: false, rain: true, pad: 0.12, bassG: 0.18, arpG: 0.05, dist: 0, hatG: 0 },
    stealth: { n: 'Sessiz Sızma', d: 'Gizli görev', bpm: 92, chords: ['Cm', 'Cm', 'Ab', 'G'], kick: '1.......1..1....', snare: '', hat: '..x...x...x...x.', bass: '1.1.1.1.1.1.1.1.', arp: '1.......3.......', arpOct: 24, arpWave: 'sine', blips: true, pad: 0.09, bassG: 0.2, arpG: 0.06, dist: 0, hatG: 0.04 },
    action: { n: 'Kırmızı Alarm', d: 'Aksiyon', bpm: 140, chords: ['Em', 'C', 'D', 'B'], kick: '1...1...1...1...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', bass: '.1.1.1.1.1.1.1.1', arp: '1231123112311231', arpOct: 12, arpWave: 'sawtooth', pad: 0.06, bassG: 0.22, arpG: 0.05, dist: 1, hatG: 0.05, snareG: 0.35 },
    tower: { n: 'Kurumsal Kule', d: 'Gerilim · boss', bpm: 104, chords: ['Fsm', 'Dmaj', 'E', 'Csm'], kick: '1.....1...1.....', snare: '........x.......', hat: '.x.x.x.x.x.x.x.x', bass: '1...............', arp: '1.2.3.1.2.3.1.2.', arpOct: 24, arpWave: 'square', clank: true, pad: 0.1, bassG: 0.2, arpG: 0.035, dist: 0, hatG: 0.03, snareG: 0.25 },
  };
  let cur = null; // {key, bus, step, next, timer}
  function distCurve(k) { const n = 512, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
  function startTrack(key) {
    const T = TRACKS[key]; if (!T || !ensure()) return;
    const bus = ac.createGain(); bus.gain.value = 0.0001; bus.connect(musBus);
    bus.gain.exponentialRampToValueAtTime(1, ac.currentTime + 2.5);
    const delay = ac.createDelay(1); delay.delayTime.value = 60 / T.bpm * 0.75; const fb = ac.createGain(); fb.gain.value = 0.32; const wet = ac.createGain(); wet.gain.value = 0.35;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(bus);
    let distNode = null; if (T.dist) { distNode = ac.createWaveShaper(); distNode.curve = distCurve(6); distNode.connect(bus); }
    let rainSrc = null;
    if (T.rain) { rainSrc = ac.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.4; const g = ac.createGain(); g.gain.value = 0.05; rainSrc.connect(f); f.connect(g); g.connect(bus); rainSrc.start(); }
    const st = { key, T, bus, delay, distNode, rainSrc, step: 0, next: ac.currentTime + 0.1, alive: true };
    st.timer = setInterval(() => sched(st), 25);
    return st;
  }
  function stopTrack(st) {
    if (!st) return; st.alive = false; clearInterval(st.timer);
    const t = ac.currentTime; st.bus.gain.cancelScheduledValues(t); st.bus.gain.setValueAtTime(Math.max(0.0001, st.bus.gain.value), t); st.bus.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    setTimeout(() => { try { st.rainSrc && st.rainSrc.stop(); st.bus.disconnect(); } catch (e) { } }, 2600);
  }
  function voice(t, dur, freq, wave, g, dest, lp, det) {
    const o = ac.createOscillator(); o.type = wave; o.frequency.value = freq; if (det) o.detune.value = det;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp || 2000, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, (lp || 2000) * 0.4), t + dur);
    const a = ac.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + Math.min(0.02, dur / 4)); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(a); a.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function sched(st) {
    if (!st.alive) return;
    const T = st.T, sp = 60 / T.bpm / 4;
    while (st.next < ac.currentTime + 0.15) {
      const t = st.next, s = st.step % 16, bar = Math.floor(st.step / 16) % T.chords.length;
      const ch = CH[T.chords[bar]];
      const dest = st.distNode || st.bus;
      if (s === 0) { // ped
        ch.forEach((n, i) => { [-7, 7].forEach(d => voice(t, sp * 16 * 1.02, m2f(n), T.key === 'tower' ? 'triangle' : 'sawtooth', T.pad / ch.length, st.bus, T.key === 'calm' ? 900 : 700, d)); });
      }
      if (T.kick[s] === '1') { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18); g.gain.setValueAtTime(T.key === 'calm' ? 0.35 : 0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(st.bus); o.start(t); o.stop(t + 0.32); }
      if (T.snare && T.snare[s] === 'x') noise(t, 0.18, { type: 'bandpass', f0: 1800, q: 0.8, g: T.snareG || 0.3, dest: st.bus });
      if (T.hat && T.hat[s] === 'x') noise(t, 0.04, { type: 'highpass', f0: 7000, g: T.hatG, dest: st.bus });
      if (T.bass[s] === '1') voice(t, sp * (T.key === 'calm' ? 7 : T.key === 'tower' ? 15 : 1.6), m2f(ch[0] - 24), T.key === 'stealth' ? 'square' : 'sawtooth', T.bassG, dest, T.key === 'action' ? 900 : 500);
      const a = T.arp[s]; if (a && a !== '.') { const idx = (+a - 1) % ch.length; const o = ac.createGain(); o.connect(st.bus); o.connect(st.delay); voice(t, sp * 1.8, m2f(ch[idx] + T.arpOct - 12), T.arpWave, T.arpG, o, T.key === 'action' ? 3200 : 2400); }
      if (T.blips && Math.random() < 0.06) voice(t, 0.08, m2f(84 + Math.floor(Math.random() * 12)), 'square', 0.02, st.delay, 5000);
      if (T.clank && s === 12 && bar % 2 === 1) noise(t, 0.6, { type: 'bandpass', f0: 3200, q: 12, g: 0.2, dest: st.delay });
      if (T.rain && s === 0 && bar === 3 && Math.random() < 0.5) noise(t, 3, { type: 'lowpass', f0: 180, f1: 60, g: 0.25, a: 0.8, dest: st.bus });
      st.next += sp; st.step++;
    }
  }
  let want = null;
  function setTrack(key) {
    want = key || null;
    if (!ready()) { notify(); return; }
    if (cur && cur.key === want) return;
    stopTrack(cur); cur = null;
    if (want) cur = startTrack(want);
    notify();
  }
  listeners.push(() => { if (ready() && want && (!cur || cur.key !== want)) { stopTrack(cur); cur = startTrack(want); } });
  return {
    play, setTrack, TRACKS, ready, ensure,
    get want() { return want; }, get playing() { return cur ? cur.key : null; },
    pref, set(k, v) { pref[k] = v; savePref(); applyVol(); notify(); },
    onChange(f) { listeners.push(f); },
  };
})();
