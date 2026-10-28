// ===== HARİTA ÇİZİMİ =====
const curMap = () => S.preview || S.map || (S.mapLoaded ? null : S.demo) || (S.me.isGM ? S.demo : null);
const tAt = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? null : m.tiles[y * m.w + x];
const wallish = c => c === '#' || c === '=';
const FLOORISH = '.,:G';
function baseOf(m, x, y, ch) {
  if (FLOORISH.indexOf(ch) >= 0 || ch === '~' || ch === ' ') return ch;
  if (wallish(ch)) return null;
  const cnt = {};
  [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(([dx, dy]) => { const c = tAt(m, x + dx, y + dy); if (c && FLOORISH.indexOf(c) >= 0) cnt[c] = (cnt[c] || 0) + 1; });
  let best = '.', bn = 0; for (const k in cnt) if (cnt[k] > bn) { bn = cnt[k]; best = k; }
  return best;
}
function paintFloor(c, b, px, py, x, y) {
  const h = hash(x, y);
  if (b === '.') {
    c.fillStyle = '#2a2f33'; c.fillRect(px, py, CS, CS);
    if (h < 0.22) { c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(px + (h * 97 % 1) * 20, py + (h * 53 % 1) * 22, 6 + h * 20, 4 + h * 10); }
    for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.14)'; c.fillRect(px + hash(x + i * 7, y) * 30, py + hash(x, y + i * 5) * 30, 2, 2); }
  } else if (b === ',') {
    c.fillStyle = '#1b1f22'; c.fillRect(px, py, CS, CS);
    for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(px + hash(x + i * 3, y + 1) * 30, py + hash(x + 2, y + i * 3) * 30, 2, 2); }
    if (h > 0.9) { c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 4, py + h * 30); c.lineTo(px + 16, py + 12); c.lineTo(px + 28, py + 26 * h); c.stroke(); }
  } else if (b === ':') {
    c.fillStyle = '#343a3e'; c.fillRect(px, py, CS, CS);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(px, py + CS - 1, CS, 1); c.fillRect(px + CS - 1, py, 1, CS);
  } else if (b === 'G') {
    c.fillStyle = '#1f2a1d'; c.fillRect(px, py, CS, CS);
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#2c3b25' : '#182114'; c.fillRect(px + hash(x + i, y * 3) * 29, py + hash(x * 5, y + i) * 29, 3, 2); }
  } else if (b === '~') {
    c.fillStyle = '#0b262e'; c.fillRect(px, py, CS, CS);
    c.strokeStyle = 'rgba(65,207,214,.18)'; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 2; k++) { const yy = py + 9 + k * 14 + h * 4; c.moveTo(px + 3, yy); c.quadraticCurveTo(px + 10, yy - 4, px + 16, yy); c.quadraticCurveTo(px + 23, yy + 4, px + 29, yy); }
    c.stroke();
  } else if (b === ' ') {
    c.fillStyle = '#050708'; c.fillRect(px, py, CS, CS);
  }
}
function crect(m, x, y, ch, px, py, ins) {
  const l = tAt(m, x - 1, y) === ch ? 0 : ins, r = tAt(m, x + 1, y) === ch ? 0 : ins, t = tAt(m, x, y - 1) === ch ? 0 : ins, b = tAt(m, x, y + 1) === ch ? 0 : ins;
  return [px + l, py + t, CS - l - r, CS - t - b, l, r, t, b];
}
function stripes(c, x, y, w, h, a, b2, step) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = b2; c.fillRect(x, y, w, h); c.fillStyle = a;
  for (let k = -h; k < w + h; k += step * 2) { c.beginPath(); c.moveTo(x + k, y + h); c.lineTo(x + k + step, y + h); c.lineTo(x + k + step + h, y); c.lineTo(x + k + h, y); c.fill(); }
  c.restore();
}
function paintObj(c, ch, px, py, x, y, m) {
  const h = hash(x, y);
  switch (ch) {
    case '#': case '=': {
      c.fillStyle = '#11161a'; c.fillRect(px, py, CS, CS);
      c.strokeStyle = 'rgba(255,255,255,.03)'; c.lineWidth = 1; c.beginPath();
      for (let k = -CS; k < CS; k += 6) { c.moveTo(px + k, py + CS); c.lineTo(px + k + CS, py); }
      c.save(); c.beginPath(); c.rect(px, py, CS, CS); c.clip(); c.stroke(); c.restore();
      c.fillStyle = '#56636b';
      if (!wallish(tAt(m, x, y - 1))) c.fillRect(px, py, CS, 2);
      if (!wallish(tAt(m, x, y + 1))) c.fillRect(px, py + CS - 2, CS, 2);
      if (!wallish(tAt(m, x - 1, y))) c.fillRect(px, py, 2, CS);
      if (!wallish(tAt(m, x + 1, y))) c.fillRect(px + CS - 2, py, 2, CS);
      if (ch === '=') {
        const hz = wallish(tAt(m, x - 1, y)) || wallish(tAt(m, x + 1, y)) || tAt(m, x - 1, y) === '+' || tAt(m, x + 1, y) === '+';
        c.fillStyle = 'rgba(65,207,214,.55)';
        if (hz) c.fillRect(px, py + CS / 2 - 3, CS, 6); else c.fillRect(px + CS / 2 - 3, py, 6, CS);
        c.fillStyle = 'rgba(230,250,255,.7)';
        if (hz) c.fillRect(px + 3, py + CS / 2 - 1, CS - 6, 1); else c.fillRect(px + CS / 2 - 1, py + 3, 1, CS - 6);
      }
      break;
    }
    case '+': {
      const hz = wallish(tAt(m, x - 1, y)) || wallish(tAt(m, x + 1, y)) || tAt(m, x - 1, y) === '+' || tAt(m, x + 1, y) === '+';
      c.fillStyle = '#11161a';
      if (hz) { c.fillRect(px, py + CS / 2 - 5, 3, 10); c.fillRect(px + CS - 3, py + CS / 2 - 5, 3, 10); c.fillStyle = '#c99a1f'; c.fillRect(px + 3, py + CS / 2 - 2, CS - 6, 4); }
      else { c.fillRect(px + CS / 2 - 5, py, 10, 3); c.fillRect(px + CS / 2 - 5, py + CS - 3, 10, 3); c.fillStyle = '#c99a1f'; c.fillRect(px + CS / 2 - 2, py + 3, 4, CS - 6); }
      break;
    }
    case 'C': {
      c.fillStyle = '#6d5a38'; c.fillRect(px + 4, py + 4, CS - 8, CS - 8);
      c.strokeStyle = '#2b2215'; c.lineWidth = 1.5; c.strokeRect(px + 4.5, py + 4.5, CS - 9, CS - 9);
      c.strokeStyle = '#4d3f26'; c.beginPath(); c.moveTo(px + 5, py + 5); c.lineTo(px + CS - 5, py + CS - 5); c.moveTo(px + CS - 5, py + 5); c.lineTo(px + 5, py + CS - 5); c.stroke();
      break;
    }
    case 'L': {
      const [rx, ry, rw, rh] = crect(m, x, y, 'L', px, py, 3);
      c.fillStyle = '#3a4045'; c.fillRect(rx, ry, rw, rh);
      const cols = ['#8a6d3b', '#6b7a4a', '#7a4b3b', '#4b6a7a', '#6d6a5e'];
      c.fillStyle = cols[Math.floor(h * cols.length)]; c.fillRect(px + 6, py + 5, CS - 12, 9);
      c.fillStyle = cols[Math.floor(hash(y, x) * cols.length)]; c.fillRect(px + 6, py + 18, CS - 12, 9);
      break;
    }
    case 'D': {
      const [rx, ry, rw, rh, , , t] = crect(m, x, y, 'D', px, py, 4);
      c.fillStyle = '#4b3a30'; c.fillRect(rx, ry, rw, rh);
      if (t) { c.fillStyle = '#6e5444'; c.fillRect(rx, ry, rw, 2); }
      break;
    }
    case 'B': {
      const [rx, ry, rw, rh] = crect(m, x, y, 'B', px, py, 7);
      c.fillStyle = '#878a86'; c.fillRect(rx, ry, rw, rh);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(rx, ry + rh - 2, rw, 2);
      if (rw > rh) { c.fillStyle = '#d6a821'; for (let k = 2; k < rw - 3; k += 8) c.fillRect(rx + k, ry + rh / 2 - 1, 4, 2); }
      else { c.fillStyle = '#d6a821'; for (let k = 2; k < rh - 3; k += 8) c.fillRect(rx + rw / 2 - 1, ry + k, 2, 4); }
      break;
    }
    case 'T': {
      c.fillStyle = '#0c181b'; c.fillRect(px + 6, py + 6, CS - 12, CS - 12);
      c.save(); c.shadowColor = '#41cfd6'; c.shadowBlur = 8; c.fillStyle = '#41cfd6'; c.fillRect(px + 9, py + 9, CS - 18, CS - 20); c.restore();
      c.fillStyle = 'rgba(12,24,27,.8)'; c.fillRect(px + 10, py + 12, CS - 20, 1); c.fillRect(px + 10, py + 15, CS - 24, 1);
      break;
    }
    case 'R': {
      for (let i = 0; i < 5; i++) {
        const cx = px + 4 + hash(x * 3 + i, y) * 24, cy = py + 4 + hash(x, y * 3 + i) * 24, r = 2 + hash(x + i, y + i) * 4;
        c.fillStyle = i % 2 ? '#5b544a' : '#433e37'; c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx, cy - r); c.lineTo(cx + r, cy + r * 0.4); c.lineTo(cx - r * 0.3, cy + r); c.fill();
      }
      break;
    }
    case 'X': stripes(c, px + 2, py + 2, CS - 4, CS - 4, 'rgba(242,194,48,.75)', 'rgba(10,10,8,.55)', 5); break;
    case 'S': {
      c.fillStyle = 'rgba(231,227,216,.22)';
      for (let k = 4; k < CS; k += 7) c.fillRect(px + 2, py + k, CS - 4, 2);
      break;
    }
  }
}
function components(m) {
  const seen = new Uint8Array(m.w * m.h), out = [];
  for (let i = 0; i < m.w * m.h; i++) {
    const ch = m.tiles[i]; if ('KVH'.indexOf(ch) < 0 || seen[i]) continue;
    const st = [i]; seen[i] = 1; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const cells = [];
    while (st.length) {
      const j = st.pop(), x = j % m.w, y = (j / m.w) | 0; n++; cells.push([x, y]);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = ny * m.w + nx; if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && !seen[k] && m.tiles[k] === ch) { seen[k] = 1; st.push(k); } });
    }
    out.push({ ch, x0, y0, x1, y1, n, cells });
  }
  return out;
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function paintComp(c, k) {
  const X = k.x0 * CS, Y = k.y0 * CS, Wd = (k.x1 - k.x0 + 1) * CS, Ht = (k.y1 - k.y0 + 1) * CS, rect = k.n === (k.x1 - k.x0 + 1) * (k.y1 - k.y0 + 1);
  const h = hash(k.x0 + 11, k.y0 + 7);
  if (k.ch === 'K') {
    const cols = ['#7d3626', '#2c6466', '#7a6a26', '#3d4f7a', '#6b2f4f', '#4f6b33', '#8a4a1c'];
    const col = cols[Math.floor(h * cols.length)];
    if (!rect) { c.fillStyle = col; k.cells.forEach(([x, y]) => c.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2)); return; }
    c.fillStyle = col; c.fillRect(X + 2, Y + 2, Wd - 4, Ht - 4);
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.5; c.beginPath();
    if (Wd >= Ht) for (let xx = X + 6; xx < X + Wd - 4; xx += 5) { c.moveTo(xx, Y + 4); c.lineTo(xx, Y + Ht - 4); }
    else for (let yy = Y + 6; yy < Y + Ht - 4; yy += 5) { c.moveTo(X + 4, yy); c.lineTo(X + Wd - 4, yy); }
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.strokeRect(X + 2, Y + 2, Wd - 4, Ht - 4);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + 3, Y + 3, Wd - 6, 1.5);
  } else if (k.ch === 'V') {
    const cols = ['#3a4250', '#6a2b2b', '#2f4a3a', '#4a4a4a', '#6a5a2a', '#24323f'];
    const col = cols[Math.floor(h * cols.length)];
    if (!rect) { c.fillStyle = col; k.cells.forEach(([x, y]) => c.fillRect(x * CS + 2, y * CS + 2, CS - 4, CS - 4)); return; }
    const hz = Wd >= Ht, fwd = h > 0.5;
    c.fillStyle = 'rgba(0,0,0,.4)'; rrect(c, X + 5, Y + 6, Wd - 8, Ht - 8, 7); c.fill();
    c.fillStyle = col; rrect(c, X + 3, Y + 3, Wd - 6, Ht - 6, 7); c.fill();
    c.fillStyle = 'rgba(65,207,214,.35)';
    if (hz) { const wx = fwd ? X + Wd - 22 : X + 10; c.fillRect(wx, Y + 7, 12, Ht - 14); c.fillStyle = '#f2d36b'; const lx = fwd ? X + Wd - 6 : X + 3; c.fillRect(lx, Y + 6, 3, 5); c.fillRect(lx, Y + Ht - 11, 3, 5); }
    else { const wy = fwd ? Y + Ht - 22 : Y + 10; c.fillRect(X + 7, wy, Wd - 14, 12); c.fillStyle = '#f2d36b'; const ly = fwd ? Y + Ht - 6 : Y + 3; c.fillRect(X + 6, ly, 5, 3); c.fillRect(X + Wd - 11, ly, 5, 3); }
    c.fillStyle = 'rgba(255,255,255,.08)'; rrect(c, X + 6, Y + 6, Wd - 12, 4, 2); c.fill();
  } else if (k.ch === 'H') {
    const cx = X + Wd / 2, cy = Y + Ht / 2, r = Math.min(Wd, Ht) / 2 - 5;
    c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#f2c230'; c.font = '700 ' + Math.round(r * 1.1) + 'px "Saira Extra Condensed", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', cx, cy + 2);
  }
}
function drawTiles(c, m) {
  c.clearRect(0, 0, m.w * CS, m.h * CS);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = m.tiles[y * m.w + x], px = x * CS, py = y * CS;
    const b = baseOf(m, x, y, ch);
    if (b) paintFloor(c, b, px, py, x, y);
    paintObj(c, ch, px, py, x, y, m);
  }
  components(m).forEach(k => paintComp(c, k));
}

// ===== ANA TUVAL =====
const wrap = $('#mapwrap'), cv = $('#map'), ctx = cv.getContext('2d');
const layer = document.createElement('canvas'), lctx = layer.getContext('2d');
let dpr = 1, VW = 0, VH = 0, needs = false;
function dirty() { if (!needs) { needs = true; requestAnimationFrame(frame); } }
function resize() {
  const r = wrap.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); VW = r.width; VH = r.height;
  cv.width = Math.max(1, Math.round(VW * dpr)); cv.height = Math.max(1, Math.round(VH * dpr));
  if (S.fitKey && !S.userMoved) fitView();
  dirty();
}
new ResizeObserver(resize).observe(wrap);
function rebuildLayer() {
  const m = curMap(); if (!m) return;
  if (layer.width !== m.w * CS || layer.height !== m.h * CS) { layer.width = m.w * CS; layer.height = m.h * CS; }
  drawTiles(lctx, m);
}
function frame(t) {
  needs = false;
  if (S.layerDirty) { rebuildLayer(); S.layerDirty = false; }
  draw(t || performance.now());
  const now = performance.now();
  S.pings = S.pings.filter(p => now - p.t0 < 1600);
  for (const k in S.remoteDrag) if (now - S.remoteDrag[k].t > 4000) delete S.remoteDrag[k];
  if (S.pings.length || Object.keys(S.remoteDrag).length || currentTurnTok() || fxActive() || S.targeting) dirty();
}
function fitView() {
  const m = curMap(); if (!m || !VW) return;
  const s = clamp(Math.min((VW - 32) / (m.w * CS), (VH - 32) / (m.h * CS)), 0.2, 2.2);
  S.view.s = s; S.view.x = (VW - m.w * CS * s) / 2; S.view.y = (VH - m.h * CS * s) / 2;
  S.userMoved = false; dirty();
}
function zoomAt(ns, sx, sy) {
  const v = S.view; ns = clamp(ns, 0.2, 3.5);
  const wx = (sx - v.x) / v.s, wy = (sy - v.y) / v.s;
  v.s = ns; v.x = sx - wx * ns; v.y = sy - wy * ns; S.userMoved = true; dirty();
}
const s2c = (sx, sy) => ({ x: Math.floor((sx - S.view.x) / S.view.s / CS), y: Math.floor((sy - S.view.y) / S.view.s / CS) });
function tokenAt(cell) {
  for (const id in S.tokens) { const t = S.tokens[id]; if (t.hidden && !S.me.isGM) continue; if (t.x === cell.x && t.y === cell.y) return id; }
  return null;
}
function tokChar(t) { return t && t.charId ? S.chars[t.charId] : null; }
function currentTurnTok() { const o = S.init.order || []; const e = o[S.init.turn]; return e && e.tok && S.tokens[e.tok] ? e.tok : null; }

function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, cv.width, cv.height);
  const m = curMap(); if (!m) return;
  const v = S.view;
  const shk = shakeOffset(performance.now());
  ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * (v.x + shk[0]), dpr * (v.y + shk[1]));
  ctx.imageSmoothingEnabled = v.s < 1;
  ctx.drawImage(layer, 0, 0);
  // ızgara
  ctx.beginPath();
  for (let x = 0; x <= m.w; x++) { ctx.moveTo(x * CS, 0); ctx.lineTo(x * CS, m.h * CS); }
  for (let y = 0; y <= m.h; y++) { ctx.moveTo(0, y * CS); ctx.lineTo(m.w * CS, y * CS); }
  ctx.strokeStyle = 'rgba(231,227,216,.07)'; ctx.lineWidth = 1 / v.s; ctx.stroke();
  // ızgara kenar etiketi (her 5 kare = 10 m)
  ctx.fillStyle = 'rgba(231,227,216,.10)';
  for (let x = 5; x < m.w; x += 5) ctx.fillRect(x * CS - 0.5 / v.s, 0, 1 / v.s, m.h * CS);
  for (let y = 5; y < m.h; y += 5) ctx.fillRect(0, y * CS - 0.5 / v.s, m.w * CS, 1 / v.s);
  // hareket menzili
  const d = S.drag;
  if (d && d.type === 'tok' && d.reach) {
    d.reach.forEach((cost, key) => {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = cost <= d.move ? 'rgba(123,216,143,.20)' : 'rgba(242,194,48,.13)';
      ctx.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2);
    });
  }
  // dikdörtgen önizleme
  if (S.rectPrev) {
    const r = S.rectPrev, x0 = Math.min(r.a.x, r.b.x), y0 = Math.min(r.a.y, r.b.y), x1 = Math.max(r.a.x, r.b.x), y1 = Math.max(r.a.y, r.b.y);
    ctx.fillStyle = 'rgba(242,194,48,.15)'; ctx.fillRect(x0 * CS, y0 * CS, (x1 - x0 + 1) * CS, (y1 - y0 + 1) * CS);
    ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2 / v.s; ctx.setLineDash([6 / v.s, 4 / v.s]); ctx.strokeRect(x0 * CS, y0 * CS, (x1 - x0 + 1) * CS, (y1 - y0 + 1) * CS); ctx.setLineDash([]);
    label(((x1 - x0 + 1) * 2) + ' × ' + ((y1 - y0 + 1) * 2) + ' m', (x1 + 1) * CS, y0 * CS - 6 / v.s, 'right');
  }
  // fırça
  if (S.hover && (S.tool === 'paint') && S.me.isGM) {
    const n = S.brushSize, o = Math.floor((n - 1) / 2);
    ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2 / v.s; ctx.strokeRect((S.hover.x - o) * CS, (S.hover.y - o) * CS, n * CS, n * CS);
  } else if (S.hover && tAt(m, S.hover.x, S.hover.y) !== null) {
    ctx.strokeStyle = 'rgba(231,227,216,.45)'; ctx.lineWidth = 1.5 / v.s; ctx.strokeRect(S.hover.x * CS, S.hover.y * CS, CS, CS);
  }
  // ölçüm
  if (S.measure) {
    const { a, b } = S.measure, dd = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    ctx.strokeStyle = '#41cfd6'; ctx.lineWidth = 2.5 / v.s; ctx.setLineDash([8 / v.s, 5 / v.s]);
    ctx.beginPath(); ctx.moveTo((a.x + .5) * CS, (a.y + .5) * CS); ctx.lineTo((b.x + .5) * CS, (b.y + .5) * CS); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#41cfd6'; [a, b].forEach(p => { ctx.beginPath(); ctx.arc((p.x + .5) * CS, (p.y + .5) * CS, 4 / v.s, 0, 7); ctx.fill(); });
    label(dd + ' kare · ' + dd * 2 + ' m', (b.x + .5) * CS, (b.y) * CS - 6 / v.s, 'center', '#41cfd6');
  }
  drawDevices(t);
  drawTargeting(t);
  drawPairs(t);
  // tokenlar
  const turnTok = currentTurnTok();
  const ids = Object.keys(S.tokens).sort((p, q) => (S.tokens[p].kind === 'npc') - (S.tokens[q].kind === 'npc'));
  ids.forEach(id => {
    const tk = S.tokens[id]; if (tk.hidden && !S.me.isGM) return;
    let x = tk.x, y = tk.y;
    if (d && d.type === 'tok' && d.id === id) { x = d.cur.x; y = d.cur.y; }
    drawToken(id, tk, x, y, false, id === turnTok, t);
  });
  for (const id in S.remoteDrag) { const tk = S.tokens[id]; const r = S.remoteDrag[id]; if (tk && !(tk.hidden && !S.me.isGM)) drawToken(id, tk, r.x, r.y, true, false, t); }
  if (d && d.type === 'tok' && d.moved) {
    const dd = d.reach.get(d.cur.x + ',' + d.cur.y);
    const txt = dd == null ? 'Ulaşılamaz' : dd + ' kare · ' + dd * 2 + ' m' + (dd > d.move ? ' · koşu' : '');
    label(txt, (d.cur.x + .5) * CS, d.cur.y * CS - 8 / v.s, 'center', dd == null ? '#ff4a5f' : dd > d.move ? '#f2c230' : '#7bd88f');
  }
  // işaretler
  const now = performance.now();
  S.pings.forEach(p => {
    const k = (now - p.t0) / 1600;
    for (let i = 0; i < 2; i++) {
      const kk = (k + i * 0.3) % 1;
      ctx.strokeStyle = p.c; ctx.globalAlpha = 1 - kk; ctx.lineWidth = 3 / v.s;
      ctx.beginPath(); ctx.arc((p.x + .5) * CS, (p.y + .5) * CS, CS * (0.3 + kk * 1.6), 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  drawFx(performance.now());
}
function label(txt, x, y, align, col) {
  const v = S.view; const fs = 12 / v.s;
  ctx.font = '600 ' + fs + 'px "JetBrains Mono", monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'bottom';
  const w = ctx.measureText(txt).width, pad = 4 / v.s;
  let bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.fillStyle = 'rgba(7,9,11,.88)'; ctx.fillRect(bx - pad, y - fs - pad, w + pad * 2, fs + pad * 1.6);
  ctx.fillStyle = col || '#f2c230'; ctx.fillText(txt, x, y);
}
const imgs = {};
function imgFor(url) {
  if (!url) return null;
  let im = imgs[url];
  if (!im) { im = new Image(); im.onload = () => { S.layerDirty = S.layerDirty; dirty(); renderCharList && renderCharList(); }; im.src = url; imgs[url] = im; }
  return im.complete && im.naturalWidth ? im : null;
}
function tokShape(kind, cx, cy, r) {
  ctx.beginPath();
  if (kind === 'npc') { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08); } ctx.closePath(); }
  else ctx.arc(cx, cy, r, 0, Math.PI * 2);
}
function drawToken(id, tk, x, y, ghost, isTurn, t) {
  const v = S.view, cx = (x + .5) * CS, cy = (y + .5) * CS, r = CS * 0.42;
  const c = tokChar(tk); const col = tk.color || '#f2c230';
  const im = imgFor(c && c.img ? c.img.url : tk.img);
  ctx.save();
  ctx.globalAlpha = (tk.hidden ? 0.5 : 1) * (ghost ? 0.45 : 1);
  if (tk.veh) { ctx.save(); ctx.fillStyle = 'rgba(242,194,48,.10)'; ctx.strokeStyle = 'rgba(242,194,48,.85)'; ctx.lineWidth = 2; rrect(ctx, cx - CS * 0.5 + 1, cy - CS * 0.5 + 1, CS - 2, CS - 2, 7); ctx.fill(); ctx.stroke();
    const sp = clamp(tk.veh.sdp / (tk.veh.max || 1), 0, 1); ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(cx - CS * 0.42, cy - CS * 0.5 - 5, CS * 0.84, 3); ctx.fillStyle = '#f2c230'; ctx.fillRect(cx - CS * 0.42, cy - CS * 0.5 - 5, CS * 0.84 * sp, 3); ctx.restore(); }
  if (tk.net && !ghost) { const p = S.anim ? (Math.sin(t / 220) + 1) / 2 : 0.5; ctx.save(); ctx.strokeStyle = 'rgba(65,207,214,' + (0.35 + p * 0.55) + ')'; ctx.lineWidth = 2; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 7); ctx.stroke(); ctx.restore(); dirty(); }
  if (isTurn) { const p = (Math.sin(t / 300) + 1) / 2; ctx.strokeStyle = 'rgba(242,194,48,' + (0.35 + p * 0.5) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + 6 + p * 2, 0, 7); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  tokShape(tk.kind, cx, cy, r);
  ctx.fillStyle = '#12171a'; ctx.fill(); ctx.shadowColor = 'transparent';
  const nm = (tk.name || '?').trim();
  if (im) {
    ctx.save(); tokShape(tk.kind, cx, cy, r - 1.5); ctx.clip();
    const s = Math.min(im.naturalWidth, im.naturalHeight); ctx.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } else {
    const ini = nm.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase() || '?';
    ctx.fillStyle = col; ctx.font = '700 14px "Saira Extra Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini, cx, cy + 1);
  }
  tokShape(tk.kind, cx, cy, r);
  ctx.strokeStyle = col; ctx.lineWidth = 3; if (tk.hidden) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  if ((c && c.dead) || tk.st === 'dead') { ctx.fillStyle = 'rgba(5,6,7,.62)'; tokShape(tk.kind, cx, cy, r); ctx.fill(); ctx.strokeStyle = '#ff4a5f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - r * .55, cy - r * .55); ctx.lineTo(cx - r * .1, cy - r * .05); ctx.lineTo(cx - r * .3, cy + r * .2); ctx.lineTo(cx + r * .5, cy + r * .55); ctx.moveTo(cx + r * .5, cy - r * .5); ctx.lineTo(cx + r * .05, cy + r * .1); ctx.stroke(); }
  if (S.targeting && S.targeting.picks && S.targeting.picks.indexOf(id) >= 0) { ctx.strokeStyle = '#ff4a5f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r + 7, 0, 7); ctx.moveTo(cx - r - 11, cy); ctx.lineTo(cx - r - 3, cy); ctx.moveTo(cx + r + 3, cy); ctx.lineTo(cx + r + 11, cy); ctx.moveTo(cx, cy - r - 11); ctx.lineTo(cx, cy - r - 3); ctx.moveTo(cx, cy + r + 3); ctx.lineTo(cx, cy + r + 11); ctx.stroke(); }
  // can çubuğu: sayfası okunabiliyorsa gerçek oran, değilse (oyuncu gözünden NPC) sadece durum rengi
  const bw = CS * 0.86; let p = null, st = null;
  if (c) { const mx = hpMax(c); p = clamp(+c.hp / mx, 0, 1); st = hpState(c)[1]; }
  else if (tk.st) { st = tk.st === 'dead' ? 'crit' : tk.st; p = tk.st === 'ok' ? 1 : tk.st === 'warn' ? 0.45 : tk.st === 'dead' ? 0 : 0.08; }
  if (st) {
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(cx - bw / 2, cy + r + 2, bw, 4);
    ctx.fillStyle = st === 'crit' ? '#ff4a5f' : st === 'warn' ? '#f2c230' : '#7bd88f'; ctx.fillRect(cx - bw / 2, cy + r + 2, bw * p, 4);
  }
  if (S.sel === id && !ghost) {
    ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  const ninj = c ? injActive(c).length : (tk.inj || 0);
  if (ninj && !ghost) { const bx = cx + r * 0.78, by = cy - r * 0.78; ctx.fillStyle = '#ff2244'; ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#12171a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '800 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(ninj), bx, by + 0.5); }
  ctx.restore();
  if ((S.sel === id || (S.hover && S.hover.x === x && S.hover.y === y)) && !ghost) label(nm + (tk.hidden ? ' · gizli' : ''), cx, cy - r - 4 / v.s, 'center', col);
}

// ===== HAREKET MENZİLİ =====
function walkable(m, x, y) { const c = tAt(m, x, y); return c !== null && !!TILE[c] && !!TILE[c].walk && !(m.dev && doorBlocksMove(m, x, y)); }
function reachFrom(m, sx, sy, budget) {
  const best = new Map(); best.set(sx + ',' + sy, 0);
  const q = [[0, sx, sy]];
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]);
    const [c0, x, y] = q.shift();
    if (c0 > (best.get(x + ',' + y) ?? 1e9)) continue;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy; if (!walkable(m, nx, ny)) continue;
      if (dx && dy && (!walkable(m, x + dx, y) || !walkable(m, x, y + dy))) continue;
      const nc = c0 + (TILE[tAt(m, nx, ny)].slow ? 2 : 1);
      if (nc > budget) continue;
      const k = nx + ',' + ny; if (nc < (best.get(k) ?? 1e9)) { best.set(k, nc); q.push([nc, nx, ny]); }
    }
  }
  return best;
}

// ===== İŞARETÇİ =====
const ptrs = new Map(); let gest = null, pinch = null, lastDragEmit = 0;
cv.addEventListener('contextmenu', e => {
  e.preventDefault();
  const cell = s2c(e.offsetX, e.offsetY); const id = tokenAt(cell);
  if (id) openActionMenuAt(id, e.clientX, e.clientY);
  else { const d = devAt(cell.x, cell.y); if (d && devVis(d)) { S.selDev = d.id; renderDevCard(); dirty(); } }
});
let lp = null;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (ptrs.size === 2) {
    if (gest && gest.type === 'tok') S.drag = null;
    gest = null; S.rectPrev = null;
    const [a, b] = [...ptrs.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, s: S.view.s, vx: S.view.x, vy: S.view.y };
    return;
  }
  if (ptrs.size > 2) return;
  onDown(e);
});
cv.addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const ns = clamp(pinch.s * d / pinch.d, 0.2, 3.5);
    const wx = (pinch.mx - pinch.vx) / pinch.s, wy = (pinch.my - pinch.vy) / pinch.s;
    S.view.s = ns; S.view.x = mx - wx * ns; S.view.y = my - wy * ns; S.userMoved = true; dirty(); return;
  }
  const cell = s2c(e.offsetX, e.offsetY);
  if (!S.hover || S.hover.x !== cell.x || S.hover.y !== cell.y) { S.hover = cell; renderHover(); dirty(); }
  if (gest) onMove(e, cell);
});
function endPtr(e) {
  ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; return; }
  if (gest) onUp(e);
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; if (gest && gest.type === 'tok') { S.drag = null; emitDrag(gest.id, null); } gest = null; S.rectPrev = null; dirty(); });
cv.addEventListener('pointerleave', () => { if (!gest) { S.hover = null; renderHover(); dirty(); } });
cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(S.view.s * Math.exp(-e.deltaY * 0.0015), e.offsetX, e.offsetY); }, { passive: false });

function onDown(e) {
  const m = curMap(); if (!m) return;
  const cell = s2c(e.offsetX, e.offsetY);
  if (S.targeting && e.button === 0) { targetClick(cell); gest = null; return; }
  if (e.pointerType !== 'mouse') { clearTimeout(lp); const tid = tokenAt(cell); if (tid) { const cx = e.clientX, cy = e.clientY; lp = setTimeout(() => { if (gest && gest.moved) return; if (gest && gest.type === 'tok') { S.drag = null; emitDrag(gest.id, null); } gest = null; openActionMenuAt(tid, cx, cy); dirty(); }, 550); } }
  if (e.button === 1 || e.button === 2) { gest = { type: 'pan', sx: e.offsetX, sy: e.offsetY, vx: S.view.x, vy: S.view.y, moved: true }; return; }
  const tool = S.tool;
  if (tool === 'move') {
    const id = tokenAt(cell);
    if (id && canMoveTok(S.tokens[id])) {
      const tk = S.tokens[id], c = tokChar(tk);
      const mv = tk.veh ? tk.veh.move : (c ? effMove(c) : 6);
      const mb = moveBudget(id, mv); let budget = tk.veh ? (mb.free ? mv : Math.max(0, mv - (mb.used || 0))) : mb.budget;
      if (turnOn() && !S.me.isGM) { const [ok, why] = mayAct(id, 'move'); if (!ok) { toast(why, 'err'); budget = -1; } else if (budget <= 0) { toast('Bu tur hareket hakkın bitti.', 'err'); budget = -1; } }
      if (budget < 0) { gest = { type: 'pan', sx: e.offsetX, sy: e.offsetY, vx: S.view.x, vy: S.view.y, moved: false, cell }; dirty(); return; }
      gest = { type: 'tok', id, start: { x: tk.x, y: tk.y }, cur: { x: tk.x, y: tk.y }, moved: false, move: Math.min(mv, budget), mvFull: mv, reach: reachFrom(m, tk.x, tk.y, budget) };
      S.drag = gest;
    } else gest = { type: 'pan', sx: e.offsetX, sy: e.offsetY, vx: S.view.x, vy: S.view.y, moved: false, cell };
  } else if (tool === 'measure') { gest = { type: 'measure' }; S.measure = { a: cell, b: cell }; }
  else if (tool === 'ping') { sendPing(cell); gest = null; }
  else if (tool === 'dev' && S.me.isGM) { devToolClick(cell); gest = null; }
  else if (tool === 'paint' && S.me.isGM) { gest = { type: 'paint' }; paintAt(cell); }
  else if ((tool === 'room' || tool === 'fill') && S.me.isGM) { gest = { type: 'rect' }; S.rectPrev = { a: cell, b: cell }; }
  dirty();
}
function onMove(e, cell) {
  const g = gest;
  if (g && (g.moved || g.type === 'tok' && (cell.x !== g.start.x || cell.y !== g.start.y))) clearTimeout(lp);
  if (g.type === 'pan') {
    const dx = e.offsetX - g.sx, dy = e.offsetY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) > 5) g.moved = true;
    if (g.moved) { S.view.x = g.vx + dx; S.view.y = g.vy + dy; S.userMoved = true; dirty(); }
  } else if (g.type === 'tok') {
    if (cell.x !== g.cur.x || cell.y !== g.cur.y) {
      g.cur = cell; g.moved = true; dirty();
      const now = performance.now(); if (now - lastDragEmit > 90) { lastDragEmit = now; emitDrag(g.id, cell); }
    }
  } else if (g.type === 'measure') { S.measure.b = cell; dirty(); }
  else if (g.type === 'paint') paintAt(cell);
  else if (g.type === 'rect') { S.rectPrev.b = cell; dirty(); }
}
function onUp() {
  clearTimeout(lp);
  const g = gest; gest = null;
  const m = curMap();
  if (g.type === 'pan' && !g.moved) {
    const id = tokenAt(g.cell); if (id && canAct(id)) S.actTok = id; S.sel = id;
    const dv = !id && devAt(g.cell.x, g.cell.y); S.selDev = dv && devVis(dv) ? dv.id : null;
    renderTokCard(); renderDevCard(); dirty();
  } else if (g.type === 'tok') {
    S.drag = null; emitDrag(g.id, null);
    if (!g.moved) { S.sel = g.id; S.actTok = canAct(g.id) ? g.id : S.actTok; S.selDev = null; renderTokCard(); renderDevCard(); }
    else {
      const occ = tokenAt(g.cur);
      if (turnOn() && !S.me.isGM && !g.reach.has(g.cur.x + ',' + g.cur.y)) toast('Oraya bu tur ulaşamazsın.', 'err');
      else if (!walkable(m, g.cur.x, g.cur.y)) toast('Oraya geçilemez: ' + (TILE[tAt(m, g.cur.x, g.cur.y)] || { n: 'harita dışı' }).n.toLowerCase() + '.', 'err');
      else if (occ && occ !== g.id) toast('O karede başka biri var.', 'err');
      else {
        const tk = S.tokens[g.id]; const moved = Math.max(Math.abs(tk.x - g.cur.x), Math.abs(tk.y - g.cur.y)); tk.x = g.cur.x; tk.y = g.cur.y; S.sel = g.id; if (!tk.veh) walkPenalty(g.id, moved); useMove(g.id, g.reach.get(g.cur.x + ',' + g.cur.y) || moved, g.mvFull);
        setDoc(tokPath(g.id), tk); renderTokCard(); netMoved(g.id);
      }
    }
    dirty();
  } else if (g.type === 'paint') commitMap();
  else if (g.type === 'rect') {
    const r = S.rectPrev; S.rectPrev = null;
    const x0 = Math.min(r.a.x, r.b.x), y0 = Math.min(r.a.y, r.b.y), x1 = Math.max(r.a.x, r.b.x), y1 = Math.max(r.a.y, r.b.y);
    const tm = editTarget(); if (!tm) return;
    const arr = tm.tiles.split('');
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= tm.w || y >= tm.h) continue;
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      arr[y * tm.w + x] = S.tool === 'room' ? (edge ? '#' : '.') : S.brush;
    }
    tm.tiles = arr.join(''); S.layerDirty = true; dirty(); commitMap();
  }
}
function editTarget() {
  if (S.preview) return S.preview;
  if (!S.map && S.demo) { S.map = clone(S.demo); S.map.name = S.map.name || 'Yeni sahne'; }
  return S.map;
}
function paintAt(cell) {
  const tm = editTarget(); if (!tm) return;
  const n = S.brushSize, o = Math.floor((n - 1) / 2); let ch = false;
  const arr = tm.tiles.split('');
  for (let y = cell.y - o; y < cell.y - o + n; y++) for (let x = cell.x - o; x < cell.x - o + n; x++) {
    if (x < 0 || y < 0 || x >= tm.w || y >= tm.h) continue;
    if (arr[y * tm.w + x] !== S.brush) { arr[y * tm.w + x] = S.brush; ch = true; }
  }
  if (ch) { tm.tiles = arr.join(''); S.layerDirty = true; dirty(); }
}
function commitMap() {
  if (S.preview || !S.map) return;
  S.map.ts = Date.now();
  saveLater('gm/map', () => S.map, 350);
}

// ===== ODA (canlı) =====
function emitDrag(id, cell) {
  if (!room) return;
  room.emit('drag', cell ? { id, x: cell.x, y: cell.y } : { id, end: 1 }).catch(() => { });
}
function sendPing(cell) {
  const p = { x: cell.x, y: cell.y, c: S.me.color };
  S.pings.push(Object.assign({ t0: performance.now() }, p)); dirty();
  if (room) room.emit('ping', p).catch(() => { });
}
function onRoomMsg(msg) {
  if (msg.sameTab) return;
  const d = msg.data || {};
  if (msg.topic === 'ping') {
    const x = d.x | 0, y = d.y | 0, c = /^#[0-9a-fA-F]{3,8}$/.test(d.c || '') ? d.c : '#41cfd6';
    S.pings.push({ x, y, c, t0: performance.now() }); dirty();
  } else if (msg.topic === 'dice') {
    if (!S.anim) return;
    const ok = ['d4', 'd6', 'd8', 'd10', 'd10t', 'd12', 'd20'];
    const types = Array.isArray(d.types) ? d.types.filter(t => ok.indexOf(t) >= 0).slice(0, 20) : [];
    if (!types.length || typeof d.seed !== 'number') return;
    const col = /^#[0-9a-fA-F]{3,8}$/.test(d.c || '') ? d.c : '#41cfd6';
    const vals = Array.isArray(d.v) ? d.v.map(x => x | 0).slice(0, 20) : [];
    const tones = ['crit-hi', 'max', 'ok', 'neutral', 'low', 'fail', 'crit-lo'];
    Dice3D.replay(types, d.seed >>> 0, { label: String(d.l || 'Zar').slice(0, 80), resultText: typeof d.t === 'string' ? d.t.slice(0, 60) : (vals.length ? diceText(types, vals) : ''), tone: tones.indexOf(d.tone) >= 0 ? d.tone : 'neutral', msg: typeof d.msg === 'string' && d.msg ? d.msg.slice(0, 30) : undefined, sub: typeof d.sub === 'string' ? d.sub.slice(0, 60) : '' });
  } else if (msg.topic === 'fx') {
    const sp = {}; ['k', 'a', 'b', 'res', 'txt', 'col', 'w', 'side'].forEach(k => { if (typeof d[k] === 'string') sp[k] = d[k].slice(0, 60); });
    if (typeof d.n === 'number') sp.n = clamp(d.n | 0, 1, 12); if (typeof d.r === 'number') sp.r = clamp(+d.r, 0.5, 4); if (typeof d.side === 'number') sp.side = d.side > 0 ? 1 : -1;
    if (d.c && typeof d.c.x === 'number') sp.c = { x: d.c.x | 0, y: d.c.y | 0 };
    if (d.ac && typeof d.ac.x === 'number') sp.ac = { x: d.ac.x | 0, y: d.ac.y | 0 };
    if (sp.col && !/^#[0-9a-fA-F]{3,8}$/.test(sp.col)) delete sp.col;
    addFx(sp);
  } else if (msg.topic === 'drag') {
    const id = String(d.id || ''); if (!S.tokens[id]) return;
    if (d.end) delete S.remoteDrag[id]; else S.remoteDrag[id] = { x: d.x | 0, y: d.y | 0, t: performance.now() };
    dirty();
  }
}

