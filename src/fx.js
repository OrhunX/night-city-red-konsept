// ===== HARİTA ANİMASYONLARI =====
const FX = { list: [], shake: null, pairs: {} };
const FX_KINDS = ['shot', 'auto', 'beam', 'shell', 'arrow', 'rocket', 'boom', 'supp', 'slash', 'punch', 'grab', 'heal', 'talk', 'scan', 'code', 'gear', 'text', 'death', 'shield', 'check'];
function fxPos(tid) { const t = S.tokens[tid]; if (!t || (t.hidden && !S.me.isGM)) return null; return { x: (t.x + .5) * CS, y: (t.y + .5) * CS }; }
const cellC = c => ({ x: (c.x + .5) * CS, y: (c.y + .5) * CS });
// spec: {k, a, b (token id), c (hücre), res, txt, col, w, n}
function playFx(spec, broadcast) {
  if (broadcast !== false && room) room.emit('fx', spec).catch(() => { });
  addFx(spec);
}
function addFx(spec) {
  if (!spec || FX_KINDS.indexOf(spec.k) < 0) return;
  const a = spec.a ? fxPos(spec.a) : spec.ac ? cellC(spec.ac) : null;
  const b = spec.b ? fxPos(spec.b) : spec.c ? cellC(spec.c) : null;
  if (!a && !b) return;
  const now = performance.now();
  const f = { s: spec, a, b, t0: now, dur: 1400 };
  const pan = b ? clamp(((b.x * S.view.s + S.view.x) / (VW || 1)) * 2 - 1, -1, 1) : 0;
  const k = spec.k, res = spec.res;
  // ses
  const snd = { shot: 'shot', auto: 'auto', beam: 'sniper', shell: 'heavy', arrow: 'bow', rocket: 'launch', supp: 'auto', slash: 'slash', punch: 'punch', grab: 'chain', heal: 'heal', talk: 'talk', scan: 'scan', code: 'code', gear: 'gear', boom: 'boom', death: 'death', shield: 'shield', check: res === 'hit' ? 'ok' : 'fail' }[k];
  if (snd && (a || k === 'boom' || k === 'heal' || k === 'death' || k === 'check' || k === 'shield')) Sound.play(snd, pan, k === 'auto' || k === 'supp' ? (spec.n || 6) : undefined);
  const travel = ['shot', 'auto', 'beam', 'shell', 'arrow', 'rocket', 'supp'].indexOf(k) >= 0;
  if (travel) {
    const at = (k === 'rocket' ? 650 : k === 'arrow' ? 420 : 230) + (k === 'auto' || k === 'supp' ? (spec.n || 6) * 70 : 0);
    if (res === 'miss') Sound.play('miss', pan, 0, at / 1000 * 0.6);
    else if (res === 'dodge') Sound.play('dodge', pan, 0, at / 1000 * 0.7);
    else if (res === 'armor') Sound.play('shield', pan, 0, at / 1000);
    else if (k !== 'rocket') Sound.play('hit', pan, 0, at / 1000);
    if (k === 'rocket') { Sound.play('boom', pan, 0, at / 1000); setTimeout(() => { FX.shake = { t0: performance.now(), dur: 500, amp: 7 }; }, at); }
    f.dur = at + 1100;
  }
  if (k === 'boom') FX.shake = { t0: now, dur: 550, amp: 8 };
  if (res === 'crit' || k === 'death') { Sound.play(k === 'death' ? 'death' : 'crit', pan, 0, 0.35); }
  if (!S.anim) f.dur = Math.min(f.dur, 900);
  FX.list.push(f); dirty();
}
function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function missPoint(a, b, side) { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: b.x - dy / L * CS * 0.75 * side + dx / L * CS * 0.6, y: b.y + dx / L * CS * 0.75 * side + dy / L * CS * 0.6 }; }
function floatText(f, now, txt, col, startMs, p) {
  const t = (now - f.t0 - startMs) / 1100; if (t < 0 || t > 1) return;
  const v = S.view, fs = 15 / Math.min(1.4, Math.max(0.6, v.s));
  ctx.save(); ctx.globalAlpha = t < 0.8 ? 1 : (1 - t) / 0.2;
  ctx.font = '800 ' + fs + 'px "Saira Extra Condensed", "Arial Narrow", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  const y = p.y - CS * 0.5 - t * CS * 0.9, sc = t < 0.12 ? 0.6 + t / 0.12 * 0.6 : 1.2 - Math.min(0.2, (t - 0.12));
  ctx.translate(p.x, y); ctx.scale(sc, sc);
  ctx.lineWidth = 4 / v.s; ctx.strokeStyle = 'rgba(7,9,11,.9)'; ctx.strokeText(txt, 0, 0);
  ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore();
}
function sparks(p, t, col, n, r) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2 / S.view.s; ctx.globalAlpha = Math.max(0, 1 - t);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + i, r0 = r * t * 0.4, r1 = r * (0.3 + t); ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0); ctx.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1); ctx.stroke(); }
  ctx.restore();
}
function ring(p, t, col, r, w) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.strokeStyle = col; ctx.lineWidth = (w || 3) / S.view.s; ctx.beginPath(); ctx.arc(p.x, p.y, r * t + 2, 0, 7); ctx.stroke(); ctx.restore(); }
function tracer(a, e, t, col, w, len) {
  const p1 = lerp(a, e, Math.min(1, t)), p0 = lerp(a, e, Math.max(0, Math.min(1, t - (len || 0.25))));
  const g = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y); g.addColorStop(0, 'rgba(255,240,160,0)'); g.addColorStop(1, col);
  ctx.strokeStyle = g; ctx.lineWidth = (w || 2.5) / S.view.s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
}
function impact(f, now, at, b) {
  const t = (now - f.t0 - at) / 500; if (t < 0 || t > 1) return;
  const r = f.s.res;
  if (r === 'armor') { ctx.save(); ctx.globalAlpha = 1 - t; ctx.fillStyle = 'rgba(65,207,214,.25)'; ctx.strokeStyle = '#41cfd6'; ctx.lineWidth = 3 / S.view.s; ctx.beginPath(); ctx.arc(b.x, b.y, CS * 0.62, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  else if (r === 'miss' || r === 'dodge') { /* yok */ }
  else { sparks(b, t, r === 'crit' ? '#ff4a5f' : '#ffd36b', 9, CS * 0.7); if (r === 'crit' || r === 'head') ring(b, t, '#ff4a5f', CS * 1.1, 4); }
  if (r === 'dodge') { ctx.save(); ctx.globalAlpha = 0.5 * (1 - t); ctx.strokeStyle = '#e7e3d8'; ctx.lineWidth = 2 / S.view.s; ctx.setLineDash([3 / S.view.s, 3 / S.view.s]); ctx.beginPath(); ctx.arc(b.x + CS * 0.35 * t, b.y, CS * 0.42, 0, 7); ctx.stroke(); ctx.restore(); }
}
function resText(f) {
  const s = f.s; if (s.txt) return [s.txt, s.col || '#ff6b7d'];
  return { miss: ['ISKA', '#e7e3d8'], dodge: ['KAÇTI', '#41cfd6'], armor: ['SP DURDURDU', '#41cfd6'], crit: ['KRİTİK', '#ff4a5f'], head: ['KAFA', '#ff4a5f'] }[s.res] || null;
}
function drawFx(now) {
  FX.list = FX.list.filter(f => now - f.t0 < f.dur);
  for (const f of FX.list) {
    const s = f.s, a = f.a, b = f.b, el = now - f.t0, k = s.k;
    const rt = resText(f);
    if (['shot', 'beam', 'arrow', 'rocket'].indexOf(k) >= 0 && a && b) {
      const at = k === 'rocket' ? 650 : k === 'arrow' ? 420 : 230;
      const end = (s.res === 'miss' || s.res === 'dodge') ? missPoint(a, b, s.side || 1) : b;
      const t = el / at;
      if (el < 90) { ctx.save(); ctx.fillStyle = 'rgba(255,220,120,' + (1 - el / 90) + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, CS * 0.32, 0, 7); ctx.fill(); ctx.restore(); }
      if (k === 'beam') { if (t < 1.6) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.3) / 1.3); ctx.strokeStyle = '#d7f7ff'; ctx.lineWidth = 2 / S.view.s; ctx.shadowColor = '#41cfd6'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(a.x, a.y); const p = lerp(a, end, Math.min(1, t * 2)); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore(); } }
      else if (k === 'arrow' || k === 'rocket') {
        if (t <= 1) { const p = lerp(a, end, t); const arc = Math.sin(t * Math.PI) * Math.hypot(end.x - a.x, end.y - a.y) * 0.18; ctx.save(); ctx.fillStyle = k === 'rocket' ? '#ffb347' : '#e7e3d8'; ctx.beginPath(); ctx.arc(p.x, p.y - arc, (k === 'rocket' ? 5 : 3) / S.view.s, 0, 7); ctx.fill(); if (k === 'rocket') { for (let i = 1; i < 8; i++) { const tt = Math.max(0, t - i * 0.03); const q = lerp(a, end, tt); const ar = Math.sin(tt * Math.PI) * Math.hypot(end.x - a.x, end.y - a.y) * 0.18; ctx.globalAlpha = 0.5 - i * 0.06; ctx.fillStyle = '#9aa3a8'; ctx.beginPath(); ctx.arc(q.x, q.y - ar, (3 + i) / S.view.s, 0, 7); ctx.fill(); } } ctx.restore(); }
      } else if (t <= 1.3) tracer(a, end, t, '#ffe28a', 2.5);
      if (k === 'rocket') { const bt = (el - at) / 900; if (bt >= 0 && bt <= 1) boom(end, bt, s.r || 2.5); }
      else impact(f, now, at, end);
      if (rt && k !== 'rocket') floatText(f, now, rt[0], rt[1], at, b);
    } else if ((k === 'auto' || k === 'supp') && a && b) {
      const n = s.n || 6;
      for (let i = 0; i < n; i++) {
        const st = i * 70, t = (el - st) / 230; if (t < 0 || t > 1.3) continue;
        const jit = { x: b.x + (Math.sin(i * 12.9) * (k === 'supp' ? CS * 2.2 : CS * 0.35)), y: b.y + (Math.cos(i * 7.3) * (k === 'supp' ? CS * 2.2 : CS * 0.35)) };
        const end = s.res === 'miss' || s.res === 'dodge' ? missPoint(a, jit, i % 2 ? 1 : -1) : jit;
        tracer(a, end, t, '#ffe28a', 2); if (t > 0.95 && t < 1.25 && s.res !== 'miss') sparks(end, (t - 0.95) / 0.3, '#ffd36b', 5, CS * 0.4);
      }
      if (el < n * 70) { ctx.save(); ctx.fillStyle = 'rgba(255,220,120,.7)'; ctx.beginPath(); ctx.arc(a.x, a.y, CS * (0.22 + Math.random() * 0.15), 0, 7); ctx.fill(); ctx.restore(); }
      if (rt) floatText(f, now, rt[0], rt[1], n * 70 + 230, b);
    } else if (k === 'shell' && a && b) {
      const t = el / 230; const ang = Math.atan2(b.y - a.y, b.x - a.x), R = CS * 3.2;
      for (let i = -4; i <= 4; i++) { const an = ang + i * 0.1; const e = { x: a.x + Math.cos(an) * R, y: a.y + Math.sin(an) * R }; if (t <= 1.3) tracer(a, e, t, '#ffe28a', 1.8, 0.35); }
      if (el < 120) { ctx.save(); ctx.fillStyle = 'rgba(255,200,90,' + (1 - el / 120) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.arc(a.x, a.y, CS * 1.2, ang - 0.45, ang + 0.45); ctx.fill(); ctx.restore(); }
    } else if (k === 'boom' && b) {
      boom(b, el / 1000, s.r || 2.5);
      if (rt) floatText(f, now, rt[0], rt[1], 200, b);
    } else if (k === 'slash' && b) {
      const n = s.n || 1;
      for (let i = 0; i < n; i++) {
        const t = (el - i * 180) / 260; if (t < 0 || t > 1.4) continue;
        const off = s.res === 'miss' || s.res === 'dodge' ? CS * 0.6 : 0; const rot = i % 2 ? 2.4 : -0.7;
        ctx.save(); ctx.translate(b.x + off, b.y - off * 0.3); ctx.rotate(rot);
        ctx.globalAlpha = t < 1 ? 1 : (1.4 - t) / 0.4; ctx.strokeStyle = s.res === 'miss' ? '#e7e3d8' : '#fff'; ctx.shadowColor = '#ff4a5f'; ctx.shadowBlur = 10; ctx.lineWidth = 4 / S.view.s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, CS * 0.75, -1.2, -1.2 + Math.min(1, t) * 2.4); ctx.stroke(); ctx.restore();
      }
      if (s.res !== 'miss' && s.res !== 'dodge') impact(f, now, 200, b);
      if (rt) floatText(f, now, rt[0], rt[1], 260, b);
    } else if (k === 'punch' && b) {
      const t = el / 400; if (t <= 1) { ring(b, t, '#ffd36b', CS * 0.9, 4); if (s.res !== 'miss' && s.res !== 'dodge') sparks(b, t, '#ffffff', 6, CS * 0.5); }
      if (rt) floatText(f, now, rt[0], rt[1], 150, b);
    } else if (k === 'grab' && a && b) {
      const t = Math.min(1, el / 400); drawChain(a, lerp(a, b, t), now, s.res === 'miss' ? 0.5 : 1);
      if (rt) floatText(f, now, rt[0], rt[1], 400, b);
    } else if (k === 'heal' && b) {
      const t = el / 1300; ring(b, Math.min(1, t * 1.5), '#7bd88f', CS * 1.2, 3);
      ctx.save(); ctx.fillStyle = '#7bd88f'; for (let i = 0; i < 7; i++) { const tt = (t + i * 0.13) % 1; const x = b.x + Math.sin(i * 2.1) * CS * 0.5, y = b.y + CS * 0.4 - tt * CS * 1.4; ctx.globalAlpha = s.res === 'miss' ? 0.25 * (1 - tt) : 1 - tt; const z = CS * 0.12; ctx.fillRect(x - z, y - z / 3, z * 2, z / 1.5); ctx.fillRect(x - z / 3, y - z, z / 1.5, z * 2); } ctx.restore();
      if (rt) floatText(f, now, rt[0], rt[1], 300, b);
    } else if (k === 'talk' && a && b) {
      const t = el / 1300;
      for (let i = 0; i < 3; i++) { const tt = (t * 2 + i * 0.33) % 1; const p = lerp(a, b, tt); ctx.save(); ctx.globalAlpha = (1 - tt) * 0.8; ctx.strokeStyle = '#c29bff'; ctx.lineWidth = 2 / S.view.s; const ang = Math.atan2(b.y - a.y, b.x - a.x); ctx.beginPath(); ctx.arc(p.x, p.y, CS * 0.35, ang - 0.7, ang + 0.7); ctx.stroke(); ctx.restore(); }
      const win = s.res === 'hit' ? a : b; ring(win, Math.min(1, t * 1.4), '#c29bff', CS * 1, 3);
      if (rt) floatText(f, now, rt[0], rt[1], 500, b);
    } else if (k === 'scan' && (a || b)) {
      const p = a || b; const t = el / 1300; ring(p, t, '#41cfd6', CS * 4, 2); ring(p, Math.max(0, t - 0.2), '#41cfd6', CS * 4, 1);
      if (rt) floatText(f, now, rt[0], rt[1], 300, p);
    } else if (k === 'code' && a && b) {
      ctx.save(); ctx.font = '600 ' + (10 / Math.max(.6, S.view.s)) + 'px monospace'; ctx.fillStyle = '#3dff8a';
      for (let i = 0; i < 14; i++) { const tt = ((el / 900) + i / 14) % 1; const p = lerp(a, b, tt); ctx.globalAlpha = 1 - Math.abs(tt - 0.5) * 1.6; ctx.fillText(Math.random() < 0.5 ? '0' : '1', p.x + Math.sin(i) * 6, p.y + Math.cos(i * 3) * 6); }
      ctx.restore(); if (rt) floatText(f, now, rt[0], rt[1], 700, b);
    } else if (k === 'gear' && b) {
      const t = el / 1000; sparks(b, (t * 2) % 1, '#ffd36b', 7, CS * 0.6);
      if (rt) floatText(f, now, rt[0], rt[1], 300, b);
    } else if (k === 'shield' && b) { impact(Object.assign({}, f, { s: Object.assign({}, s, { res: 'armor' }) }), now, 0, b); if (rt) floatText(f, now, rt[0], rt[1], 0, b); }
    else if (k === 'death' && b) {
      const t = el / 1300; ring(b, Math.min(1, t * 1.3), '#ff4a5f', CS * 1.4, 4);
      if (rt) floatText(f, now, rt[0], rt[1], 200, b);
    } else if ((k === 'text' || k === 'check') && b) {
      if (k === 'check') ring(b, Math.min(1, el / 700), s.res === 'hit' ? '#7bd88f' : '#ff4a5f', CS * 1.1, 3);
      if (rt) floatText(f, now, rt[0], rt[1], 0, b);
    }
  }
}
function boom(p, t, r) {
  if (t < 0 || t > 1) return;
  const R = r * CS;
  ctx.save();
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * (0.4 + t));
  g.addColorStop(0, 'rgba(255,240,180,' + (1 - t) + ')'); g.addColorStop(0.4, 'rgba(255,140,40,' + (0.85 * (1 - t)) + ')'); g.addColorStop(1, 'rgba(120,30,10,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R * (0.4 + t), 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,120,' + (1 - t) + ')'; ctx.lineWidth = 3 / S.view.s; ctx.beginPath(); ctx.arc(p.x, p.y, R * (0.2 + t * 1.2), 0, 7); ctx.stroke();
  ctx.restore();
  sparks(p, t, '#ffb347', 14, R * 1.1);
}
function drawChain(a, b, now, alpha) {
  const L = Math.hypot(b.x - a.x, b.y - a.y); if (L < 2) return;
  const n = Math.max(3, Math.floor(L / (CS * 0.22))), ang = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  for (let i = 0; i <= n; i++) {
    const t = i / n, sag = Math.sin(t * Math.PI) * CS * 0.18 * (1 + 0.15 * Math.sin(now / 300));
    const x = a.x + (b.x - a.x) * t - Math.sin(ang) * sag, y = a.y + (b.y - a.y) * t + Math.cos(ang) * sag;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + (i % 2 ? Math.PI / 2 : 0));
    ctx.strokeStyle = i % 2 ? '#8e979c' : '#c9d1d5'; ctx.lineWidth = 2 / S.view.s;
    ctx.beginPath(); ctx.ellipse(0, 0, CS * 0.12, CS * 0.06, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function drawPairs(now) {
  for (const k in FX.pairs) { const p = FX.pairs[k]; const a = fxPos(p.a), b = fxPos(p.b); if (a && b) drawChain(a, b, now, 0.85); }
}
function shakeOffset(now) {
  const s = FX.shake; if (!s || !S.anim) return [0, 0];
  const t = (now - s.t0) / s.dur; if (t > 1) { FX.shake = null; return [0, 0]; }
  const a = s.amp * (1 - t); return [(Math.random() - 0.5) * 2 * a, (Math.random() - 0.5) * 2 * a];
}
const fxActive = () => FX.list.length > 0 || Object.keys(FX.pairs).length > 0 || !!FX.shake;
