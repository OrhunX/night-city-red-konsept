// ===== HARİTA ÜRETİCİLERİ (saf fonksiyonlar, tohumlu) =====
const TILE = {
  '.': { n: 'Beton zemin', walk: 1 },
  ',': { n: 'Asfalt', walk: 1 },
  ':': { n: 'Kaldırım', walk: 1 },
  'G': { n: 'Toprak / çim', walk: 1 },
  '#': { n: 'Duvar', walk: 0 },
  '=': { n: 'Pencere', walk: 0 },
  '+': { n: 'Kapı', walk: 1 },
  'C': { n: 'Kasa', walk: 0, cover: 1 },
  'K': { n: 'Konteyner', walk: 0, cover: 1 },
  'L': { n: 'Raf', walk: 0, cover: 1 },
  'V': { n: 'Araç', walk: 0, cover: 1 },
  'B': { n: 'Beton bariyer', walk: 0, cover: 1 },
  'D': { n: 'Tezgâh / masa', walk: 0, cover: 1 },
  'T': { n: 'Terminal', walk: 0, cover: 1 },
  'R': { n: 'Moloz', walk: 1, slow: 1 },
  '~': { n: 'Su', walk: 1, slow: 1 },
  'X': { n: 'Tehlike bölgesi', walk: 1, hazard: 1 },
  'S': { n: 'Merdiven / platform', walk: 1 },
  'H': { n: 'Helipad', walk: 1 },
  ' ': { n: 'Boşluk (düşüş)', walk: 0 },
};

function mkRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function ri(r, a, b) { if (b < a) return a; return a + Math.floor(r() * (b - a + 1)); }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

function Grid(w, h, fill) { this.w = w; this.h = h; this.a = new Array(w * h).fill(fill); }
Grid.prototype.inb = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };
Grid.prototype.get = function (x, y) { return this.inb(x, y) ? this.a[y * this.w + x] : null; };
Grid.prototype.set = function (x, y, c) { if (this.inb(x, y)) this.a[y * this.w + x] = c; };
Grid.prototype.rect = function (x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); };
Grid.prototype.box = function (x0, y0, x1, y1, c) {
  for (let x = x0; x <= x1; x++) { this.set(x, y0, c); this.set(x, y1, c); }
  for (let y = y0; y <= y1; y++) { this.set(x0, y, c); this.set(x1, y, c); }
};
Grid.prototype.str = function () { return this.a.join(''); };

function isFree(g, x0, y0, w, h, ok) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const c = g.get(x, y); if (c === null || ok.indexOf(c) < 0) return false;
  }
  return true;
}
// alan içinde serbest bir yere w×h nesne koy; pad: etrafında boş bırakılacak kenar
function place(g, r, A, w, h, c, ok, tries, pad) {
  pad = pad || 0; tries = tries || 40;
  for (let i = 0; i < tries; i++) {
    const x = ri(r, A.x0, A.x1 - w + 1), y = ri(r, A.y0, A.y1 - h + 1);
    if (isFree(g, x - pad, y - pad, w + pad * 2, h + pad * 2, ok)) { g.rect(x, y, x + w - 1, y + h - 1, c); return { x, y }; }
  }
  return null;
}

// ---- Büyük depo ----
function genDepo(w, h, r, d) {
  const g = new Grid(w, h, ',');
  const x0 = 2, y0 = 2, x1 = w - 3, y1 = h - 4;
  g.rect(x0, y0, x1, y1, '.'); g.box(x0, y0, x1, y1, '#');
  // yükleme rampaları (alt duvar)
  const bays = Math.max(2, Math.floor((x1 - x0) / 10));
  const bayX = [];
  for (let i = 0; i < bays; i++) {
    const bx = x0 + 3 + Math.floor(i * (x1 - x0 - 7) / Math.max(1, bays - 1 || 1)) ;
    const cx = Math.min(bx, x1 - 4);
    g.set(cx, y1, '+'); g.set(cx + 1, y1, '+'); g.set(cx + 2, y1, '+'); bayX.push(cx);
  }
  g.set(x0, ri(r, y0 + 3, y1 - 3), '+'); g.set(x1, ri(r, y0 + 3, y1 - 3), '+');
  // köşede ofis
  const ow = ri(r, 6, Math.max(6, Math.min(10, (x1 - x0) >> 1))), oh = ri(r, 5, Math.max(5, Math.min(7, (y1 - y0) >> 1)));
  const left = r() < 0.5;
  const ox0 = left ? x0 : x1 - ow, ox1 = left ? x0 + ow : x1, oy0 = y0, oy1 = y0 + oh;
  g.box(ox0, oy0, ox1, oy1, '#'); g.rect(ox0 + 1, oy0 + 1, ox1 - 1, oy1 - 1, '.');
  for (let y = oy0 + 2; y < oy1 - 1; y += 2) g.set(left ? ox1 : ox0, y, '=');
  for (let x = ox0 + 2; x < ox1 - 1; x += 3) g.set(x, oy1, '=');
  g.set(left ? ox1 - 2 : ox0 + 2, oy1, '+');
  g.set(ox0 + 2, oy0 + 1, 'T'); g.set(ox0 + 2, oy0 + 2, 'D'); g.set(ox0 + 3, oy0 + 2, 'D');
  g.set(ox1 - 2, oy1 - 2, 'D'); g.set(ox1 - 2, oy0 + 1, 'C');
  const inOffice = (x, y) => x >= ox0 - 1 && x <= ox1 + 1 && y <= oy1 + 1;
  // raf sıraları
  const sy0 = y0 + 2, sy1 = y1 - 7;
  for (let x = x0 + 3; x <= x1 - 3; x += 3 + (r() < 0.2 ? 1 : 0)) {
    if (r() > 0.8 * d + 0.15) continue;
    let y = sy0;
    while (y <= sy1) {
      const len = ri(r, 3, 8);
      for (let k = 0; k < len && y + k <= sy1; k++) if (!inOffice(x, y + k)) g.set(x, y + k, 'L');
      y += len + ri(r, 1, 2);
    }
  }
  // yükleme alanı
  const zone = { x0: x0 + 2, y0: y1 - 6, x1: x1 - 2, y1: y1 - 2 };
  const nCl = Math.round((x1 - x0) / 7 * d);
  for (let i = 0; i < nCl; i++) {
    const p = place(g, r, zone, ri(r, 1, 2), ri(r, 1, 2), 'C', '.', 20, 1);
    if (p && r() < 0.5) g.set(p.x + 2, p.y, g.get(p.x + 2, p.y) === '.' ? 'C' : g.get(p.x + 2, p.y));
  }
  const nK = Math.max(1, Math.round(d * (x1 - x0) / 20));
  for (let i = 0; i < nK; i++) place(g, r, zone, 5, 2, 'K', '.', 30, 1);
  for (let i = 0; i < Math.round(2 * d); i++) place(g, r, { x0: x0 + 1, y0: y0 + 1, x1: x1 - 1, y1: y1 - 1 }, ri(r, 1, 2), 1, 'X', '.', 20, 0);
  // merdiven (asma kat)
  place(g, r, { x0: inOffice(x0 + 1, y0 + 1) ? x1 - 3 : x0 + 1, y0: y0 + 1, x1: inOffice(x0 + 1, y0 + 1) ? x1 - 1 : x0 + 3, y1: y0 + 6 }, 2, 3, 'S', '.', 20, 0);
  // dışarıda tır ve bariyerler
  bayX.forEach(bx => { if (r() < 0.6 * d + 0.2) { if (isFree(g, bx, y1 + 1, 3, 2, ',')) g.rect(bx, y1 + 1, bx + 2, y1 + 2, 'V'); } });
  for (let i = 0; i < Math.round(3 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: 1 }, 3, 1, 'B', ',', 10, 1);
  for (let i = 0; i < Math.round(2 * d); i++) place(g, r, { x0: 0, y0: y1 + 1, x1: w - 1, y1: h - 1 }, 1, 1, 'C', ',', 10, 1);
  return g;
}

// ---- Sokak kavşağı ----
function building(g, r, x0, y0, x1, y1, doorSides, d) {
  if (x1 - x0 < 4 || y1 - y0 < 4) { g.rect(x0, y0, x1, y1, ':'); return; }
  g.rect(x0, y0, x1, y1, '.'); g.box(x0, y0, x1, y1, '#');
  doorSides.forEach(s => {
    if (s === 'R' || s === 'L') { const x = s === 'R' ? x1 : x0; g.set(x, ri(r, y0 + 1, y1 - 1), '+'); for (let y = y0 + 2; y < y1 - 1; y += 3) if (g.get(x, y) === '#') g.set(x, y, '='); }
    else { const y = s === 'B' ? y1 : y0; g.set(ri(r, x0 + 1, x1 - 1), y, '+'); for (let x = x0 + 2; x < x1 - 1; x += 3) if (g.get(x, y) === '#') g.set(x, y, '='); }
  });
  // iç bölme
  if (x1 - x0 > 9 && r() < 0.7) {
    const sx = ri(r, x0 + 4, x1 - 4);
    for (let y = y0; y <= y1; y++) g.set(sx, y, '#');
    g.set(sx, ri(r, y0 + 1, y1 - 1), '+');
  }
  const A = { x0: x0 + 1, y0: y0 + 1, x1: x1 - 1, y1: y1 - 1 };
  for (let i = 0; i < Math.round(((x1 - x0) * (y1 - y0)) / 18 * d); i++) place(g, r, A, 1, 1, pick(r, ['D', 'D', 'C', 'T']), '.', 15, 1);
}
function genSokak(w, h, r, d) {
  const g = new Grid(w, h, '.');
  const rw = ri(r, 4, 6);
  const hy = ri(r, Math.floor(h * 0.38), Math.max(Math.floor(h * 0.38), Math.floor(h * 0.6) - rw));
  const vx = ri(r, Math.floor(w * 0.38), Math.max(Math.floor(w * 0.38), Math.floor(w * 0.6) - rw));
  g.rect(0, hy - 2, w - 1, hy + rw + 1, ':'); g.rect(vx - 2, 0, vx + rw + 1, h - 1, ':');
  g.rect(0, hy, w - 1, hy + rw - 1, ','); g.rect(vx, 0, vx + rw - 1, h - 1, ',');
  const quads = [
    [0, 0, vx - 3, hy - 3, ['R', 'B']], [vx + rw + 2, 0, w - 1, hy - 3, ['L', 'B']],
    [0, hy + rw + 2, vx - 3, h - 1, ['R', 'T']], [vx + rw + 2, hy + rw + 2, w - 1, h - 1, ['L', 'T']],
  ];
  quads.forEach(([a, b, c, e, sides]) => {
    // geniş bloklarda ara sokak
    if (c - a > 16 && r() < 0.8) {
      const ax = ri(r, a + 6, c - 8);
      building(g, r, a, b, ax - 1, e, sides, d);
      g.rect(ax, b, ax + 1, e, ',');
      for (let i = 0; i < 2; i++) place(g, r, { x0: ax, y0: b, x1: ax + 1, y1: e }, 1, 1, pick(r, ['C', 'X', 'C']), ',', 10, 0);
      building(g, r, ax + 2, b, c, e, sides, d);
    } else building(g, r, a, b, c, e, sides, d);
  });
  const nV = Math.round(ri(r, 3, 6) * d);
  for (let i = 0; i < nV; i++) {
    if (r() < 0.5) place(g, r, { x0: 0, y0: hy, x1: w - 1, y1: hy + rw - 1 }, 3, 2, 'V', ',', 20, 1);
    else place(g, r, { x0: vx, y0: 0, x1: vx + rw - 1, y1: h - 1 }, 2, 3, 'V', ',', 20, 1);
  }
  for (let i = 0; i < Math.round(4 * d); i++) {
    if (r() < 0.5) place(g, r, { x0: 0, y0: hy - 2, x1: w - 1, y1: hy - 1 }, 3, 1, 'B', ':', 10, 1);
    else place(g, r, { x0: vx - 2, y0: 0, x1: vx - 1, y1: h - 1 }, 1, 3, 'B', ':', 10, 1);
  }
  for (let i = 0; i < Math.round(5 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, 1, 1, pick(r, ['C', 'C', 'X', 'T']), ':', 10, 1);
  return g;
}

// ---- Bar / kulüp ----
function genBar(w, h, r, d) {
  const g = new Grid(w, h, ':');
  const x0 = 1, y0 = 1, x1 = w - 2, y1 = h - 3;
  g.rect(0, h - 2, w - 1, h - 1, ',');
  g.rect(x0, y0, x1, y1, '.'); g.box(x0, y0, x1, y1, '#');
  const by = y0 + ri(r, 4, 5);
  for (let x = x0; x <= x1; x++) g.set(x, by, '#');
  let x = x0; const rooms = [];
  while (x < x1 - 2) { const rw = ri(r, 5, 8); const xe = (x1 - (x + rw) < 5) ? x1 : x + rw; for (let y = y0; y <= by; y++) g.set(xe, y, '#'); rooms.push([x, xe]); g.set(ri(r, x + 1, xe - 1), by, '+'); x = xe; }
  rooms.forEach(([a, b], i) => {
    const A = { x0: a + 1, y0: y0 + 1, x1: b - 1, y1: by - 1 };
    const kind = i === 0 ? 'depo' : pick(r, ['depo', 'ofis', 'ofis', 'tuvalet']);
    if (kind === 'depo') for (let k = 0; k < 4; k++) place(g, r, A, 1, 1, 'C', '.', 10, 0);
    else if (kind === 'ofis') { place(g, r, A, 2, 1, 'D', '.', 10, 0); place(g, r, A, 1, 1, 'T', '.', 10, 0); }
    else place(g, r, A, 1, 1, 'X', '.', 10, 0);
  });
  // arka kapı
  g.set(r() < 0.5 ? x0 : x1, ri(r, y0 + 1, by - 1), '+');
  // tezgâh (L şekli)
  const left = r() < 0.5;
  const cx = left ? x0 + 3 : x1 - 3;
  const cy0 = by + 2, cy1 = Math.max(cy0 + 3, y1 - 4);
  for (let y = cy0; y <= cy1; y++) g.set(cx, y, 'D');
  if (left) { g.set(x0 + 1, cy0, 'D'); g.set(x0 + 2, cy0, 'D'); g.set(x0 + 1, cy0 + 2, 'L'); g.set(x0 + 1, cy0 + 3, 'L'); }
  else { g.set(x1 - 1, cy0, 'D'); g.set(x1 - 2, cy0, 'D'); g.set(x1 - 1, cy0 + 2, 'L'); g.set(x1 - 1, cy0 + 3, 'L'); }
  // sahne
  const sw = ri(r, 4, 6);
  const sx = left ? x1 - sw : x0 + 1;
  g.rect(sx, by + 1, sx + sw - 1, by + 3, 'S');
  // masalar
  const hall = { x0: left ? cx + 2 : x0 + 1, y0: by + 5, x1: left ? x1 - 1 : cx - 2, y1: y1 - 2 };
  const nT = Math.round(((hall.x1 - hall.x0) * (hall.y1 - hall.y0)) / 9 * d);
  for (let i = 0; i < nT; i++) place(g, r, hall, r() < 0.3 ? 2 : 1, 1, 'D', '.', 15, 1);
  // giriş
  const ex = Math.floor((x0 + x1) / 2);
  g.set(ex, y1, '+'); g.set(ex + 1, y1, '+');
  for (let xx = x0 + 2; xx < x1 - 1; xx += 4) if (g.get(xx, y1) === '#') g.set(xx, y1, '=');
  place(g, r, { x0: 0, y0: h - 2, x1: w - 1, y1: h - 1 }, 3, 2, 'V', ',', 10, 0);
  return g;
}

// ---- Kurum ofisi ----
function furnish(g, r, A, d) {
  const kind = pick(r, ['masa', 'masa', 'toplanti', 'sunucu', 'depo']);
  if (kind === 'masa') {
    for (let y = A.y0 + 1; y <= A.y1 - 1; y += 2) for (let x = A.x0 + 1; x <= A.x1 - 1; x += 3) if (r() < 0.7 * d + 0.2) { g.set(x, y, 'D'); if (r() < 0.4) g.set(x + 1 <= A.x1 ? x + 1 : x, y, 'T'); }
  } else if (kind === 'toplanti') {
    if (A.x1 - A.x0 >= 4 && A.y1 - A.y0 >= 3) g.rect(A.x0 + 1, Math.floor((A.y0 + A.y1) / 2), A.x1 - 1, Math.floor((A.y0 + A.y1) / 2), 'D');
    g.set(A.x0, A.y0, 'T');
  } else if (kind === 'sunucu') {
    for (let x = A.x0 + 1; x <= A.x1 - 1; x += 2) for (let y = A.y0 + 1; y <= A.y1 - 1; y++) g.set(x, y, 'T');
  } else { for (let k = 0; k < 4; k++) place(g, r, A, 1, 1, 'C', '.', 10, 0); }
}
function genOfis(w, h, r, d) {
  const g = new Grid(w, h, ':');
  const x0 = 1, y0 = 1, x1 = w - 2, y1 = h - 2;
  g.rect(x0, y0, x1, y1, '.'); g.box(x0, y0, x1, y1, '#');
  const cy = ri(r, Math.floor(h * 0.4), Math.floor(h * 0.55));
  const cx = ri(r, Math.floor(w * 0.4), Math.floor(w * 0.55));
  const blocks = [
    [x0, y0, cx - 1, cy - 1, 'B'], [cx + 2, y0, x1, cy - 1, 'B'],
    [x0, cy + 2, cx - 1, y1, 'T'], [cx + 2, cy + 2, x1, y1, 'T'],
  ];
  blocks.forEach(([bx0, by0, bx1, by1, face]) => {
    let x = bx0;
    while (x < bx1) {
      let xe = Math.min(bx1, x + ri(r, 5, 9)); if (bx1 - xe < 4) xe = bx1;
      g.box(x, by0, xe, by1, '#');
      const dy = face === 'B' ? by1 : by0;
      g.set(ri(r, x + 1, xe - 1), dy, '+');
      furnish(g, r, { x0: x + 1, y0: by0 + 1, x1: xe - 1, y1: by1 - 1 }, d);
      x = xe;
    }
  });
  // koridorları temizle (kutu duvarları koridora taşmasın)
  g.rect(x0 + 1, cy, x1 - 1, cy + 1, '.'); g.rect(cx, y0 + 1, cx + 1, y1 - 1, '.');
  // giriş + yangın çıkışı
  g.set(cx, y1, '+'); g.set(cx + 1, y1, '+'); g.set(x0, cy, '+'); g.set(x1, cy + 1, '+');
  // pencereler
  for (let x = x0 + 2; x < x1 - 1; x += 3) { if (g.get(x, y0) === '#' && g.get(x, y0 + 1) !== '#') g.set(x, y0, '='); }
  for (let y = y0 + 2; y < y1 - 1; y += 3) { if (g.get(x0, y) === '#' && g.get(x0 + 1, y) !== '#') g.set(x0, y, '='); if (g.get(x1, y) === '#' && g.get(x1 - 1, y) !== '#') g.set(x1, y, '='); }
  // lobi: giriş önünde resepsiyon
  if (g.get(cx - 2, y1 - 2) === '.') g.set(cx - 2, y1 - 2, 'D');
  return g;
}

// ---- Liman / konteyner sahası ----
function genLiman(w, h, r, d) {
  const g = new Grid(w, h, ',');
  const wx = ri(r, 3, 5);
  g.rect(0, 0, wx - 1, h - 1, '~');
  for (let y = 0; y < h; y++) g.set(wx, y, ':');
  // iskele
  const py = ri(r, 3, h - 7);
  g.rect(0, py, wx - 1, py + 2, ':');
  // vinç ayakları
  for (let y = 2; y < h - 2; y += ri(r, 8, 11)) g.rect(wx + 1, y, wx + 2, y + 1, 'B');
  // çit ve kapı
  for (let x = wx + 4; x < w; x++) g.set(x, h - 1, 'B');
  const gx = ri(r, wx + 8, w - 6); g.rect(gx, h - 1, gx + 3, h - 1, ',');
  // bekçi kulübesi
  if (gx + 9 < w) { g.box(gx + 5, h - 5, gx + 8, h - 2, '#'); g.set(gx + 6, h - 5, '.'); g.set(gx + 6, h - 4, 'T'); g.set(gx + 7, h - 4, '.'); g.set(gx + 7, h - 3, '.'); g.set(gx + 6, h - 3, '.'); g.set(gx + 5, h - 4, '+'); g.set(gx + 5, h - 3, '='); g.set(gx + 7, h - 5, '='); }
  // konteyner sıraları
  const sx = wx + 5;
  for (let y = 2; y < h - 6; y += 4 + (r() < 0.3 ? 1 : 0)) {
    for (let x = sx; x < w - 6; x += 6 + (r() < 0.25 ? 2 : 0)) {
      if (r() < 0.82 * Math.min(1, d) + 0.1 && isFree(g, x, y, 5, 2, ',')) g.rect(x, y, x + 4, y + 1, 'K');
    }
  }
  for (let i = 0; i < Math.round(4 * d); i++) place(g, r, { x0: wx + 3, y0: 0, x1: w - 1, y1: h - 2 }, 1, 1, 'C', ',', 15, 1);
  for (let i = 0; i < Math.round(2 * d); i++) place(g, r, { x0: wx + 3, y0: 0, x1: w - 1, y1: h - 2 }, 3, 2, 'V', ',', 20, 1);
  for (let i = 0; i < Math.round(2 * d); i++) place(g, r, { x0: wx + 3, y0: 0, x1: w - 1, y1: h - 2 }, 2, 1, 'X', ',', 15, 0);
  return g;
}

// ---- Combat Zone harabesi ----
function genHarabe(w, h, r, d) {
  const g = new Grid(w, h, ',');
  for (let i = 0; i < Math.round(w * h / 80); i++) {
    const cx = ri(r, 0, w - 1), cy = ri(r, 0, h - 1), rad = ri(r, 1, 3);
    for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad && r() < 0.8) g.set(x, y, 'G');
  }
  const nB = Math.round(ri(r, 3, 6) * d * (w * h) / 1000) + 1;
  for (let i = 0; i < nB; i++) {
    const bw = ri(r, 6, 11), bh = ri(r, 5, 9);
    const p = place(g, r, { x0: 1, y0: 1, x1: w - 2, y1: h - 2 }, bw, bh, '.', ',G', 40, 1);
    if (!p) continue;
    g.box(p.x, p.y, p.x + bw - 1, p.y + bh - 1, '#');
    for (let y = p.y; y < p.y + bh; y++) for (let x = p.x; x < p.x + bw; x++) {
      if (g.get(x, y) === '#' && r() < 0.35) g.set(x, y, r() < 0.6 ? 'R' : '.');
      else if (g.get(x, y) === '.' && r() < 0.15) g.set(x, y, 'R');
    }
    g.set(p.x + ri(r, 1, bw - 2), p.y + bh - 1, '+');
  }
  for (let i = 0; i < Math.round(4 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, r() < 0.5 ? 3 : 2, r() < 0.5 ? 2 : 3, 'V', ',G', 20, 1);
  for (let i = 0; i < Math.round(5 * d); i++) { if (r() < 0.5) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, ri(r, 2, 4), 1, 'B', ',G', 15, 1); else place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, 1, ri(r, 2, 4), 'B', ',G', 15, 1); }
  for (let i = 0; i < Math.round(10 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, ri(r, 1, 3), ri(r, 1, 2), 'R', ',G', 15, 0);
  for (let i = 0; i < Math.round(4 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, 1, 1, 'X', ',G', 15, 1);
  for (let i = 0; i < Math.round(5 * d); i++) place(g, r, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, 1, 1, 'C', ',G.', 15, 1);
  return g;
}

// ---- Çatı ----
function genCati(w, h, r, d) {
  const g = new Grid(w, h, ' ');
  const split = w >= 30 && r() < 0.6;
  const ax1 = split ? ri(r, Math.floor(w * 0.55), Math.floor(w * 0.68)) : w - 3;
  const roofs = [[2, 2, ax1, h - 3]];
  if (split) roofs.push([ax1 + 4, ri(r, 3, 6), w - 3, h - ri(r, 3, 6)]);
  roofs.forEach(([x0, y0, x1, y1], i) => {
    g.rect(x0, y0, x1, y1, '.');
    for (let x = x0; x <= x1; x++) { if (r() < 0.85) g.set(x, y0, 'B'); if (r() < 0.85) g.set(x, y1, 'B'); }
    for (let y = y0; y <= y1; y++) { if (r() < 0.85) g.set(x0, y, 'B'); if (r() < 0.85) g.set(x1, y, 'B'); }
    const A = { x0: x0 + 2, y0: y0 + 2, x1: x1 - 2, y1: y1 - 2 };
    // merdiven kulübesi
    const p = place(g, r, A, 4, 4, '#', '.', 30, 1);
    if (p) { g.rect(p.x + 1, p.y + 1, p.x + 2, p.y + 2, 'S'); g.set(p.x + ri(r, 1, 2), p.y + 3, '+'); }
    if (i === 0 && A.x1 - A.x0 > 12) {
      const hp = place(g, r, A, 5, 5, 'H', '.', 40, 1);
      if (!hp) { /* yer yoksa geç */ }
    }
    for (let k = 0; k < Math.round(4 * d); k++) place(g, r, A, 2, 2, 'K', '.', 20, 1);
    for (let k = 0; k < Math.round(5 * d); k++) place(g, r, A, 1, 1, pick(r, ['C', 'C', 'T']), '.', 15, 1);
  });
  if (split) {
    const by = ri(r, Math.max(roofs[1][1] + 2, 4), Math.min(roofs[1][3] - 2, h - 5));
    for (let x = ax1; x <= ax1 + 4; x++) g.set(x, by, 'S');
  }
  return g;
}

function genBos(w, h) {
  const g = new Grid(w, h, '.');
  g.box(0, 0, w - 1, h - 1, '#');
  g.set(Math.floor(w / 2), h - 1, '+');
  return g;
}

const TEMPLATES = {
  depo:   { n: 'Büyük depo',     t: 'Raf koridorları, yükleme rampası, köşede ofis.',       fn: genDepo,   w: 40, h: 28 },
  sokak:  { n: 'Sokak kavşağı',  t: 'İki cadde, kaldırımlar, binalar ve park etmiş araçlar.', fn: genSokak,  w: 44, h: 32 },
  bar:    { n: 'Bar / kulüp',    t: 'Tezgâh, sahne, masalar ve arka odalar.',               fn: genBar,    w: 28, h: 22 },
  ofis:   { n: 'Kurum ofisi',    t: 'Koridorlar, toplantı ve sunucu odaları.',              fn: genOfis,   w: 40, h: 28 },
  liman:  { n: 'Liman sahası',   t: 'Konteyner sıraları, iskele, vinç ayakları.',           fn: genLiman,  w: 44, h: 30 },
  harabe: { n: 'Combat Zone',    t: 'Yıkık binalar, moloz, enkaz araçlar.',                 fn: genHarabe, w: 40, h: 30 },
  cati:   { n: 'Çatı katı',      t: 'Kenar boşluğu, klima üniteleri, helipad.',             fn: genCati,   w: 36, h: 24 },
  bos:    { n: 'Boş sahne',      t: 'Duvarla çevrili boş alan; kendin çiz.',                fn: genBos,    w: 30, h: 20 },
};

// NET cihazları: erişim noktası, kamera, güvenlik kapısı, taret
const DEV_COUNT = { depo: [3, 2, 1], sokak: [2, 1, 0], bar: [2, 2, 0], ofis: [4, 3, 2], liman: [3, 2, 1], harabe: [0, 0, 0], cati: [2, 1, 1], bos: [0, 0, 0] };
function placeDevices(tiles, w, h, r, tpl, seed) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : tiles[y * w + x];
  const walk = c => c !== null && TILE[c] && TILE[c].walk;
  const out = []; const used = new Set(); let n = 0;
  const id = () => 'd' + (seed >>> 0).toString(36) + '_' + (n++);
  const add = (t, x, y, extra) => { const k = x + ',' + y; if (used.has(k)) return; used.add(k); out.push(Object.assign({ id: id(), t, x, y }, extra || {})); };
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const dirTo = (x, y) => { let sx = 0, sy = 0; N8.forEach(([dx, dy]) => { if (walk(at(x + dx, y + dy))) { sx += dx; sy += dy; } }); return Math.round(Math.atan2(sy, sx) * 180 / Math.PI / 45) * 45; };
  const cnt = DEV_COUNT[tpl] || [0, 0, 0];
  if (!cnt[0] && !cnt[1] && !cnt[2]) return out;
  // erişim noktaları: terminaller, yoksa zemine bakan bir duvar
  const terms = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) === 'T') terms.push({ x, y });
  terms.sort(() => r() - 0.5).slice(0, 2).forEach(p => add('ap', p.x, p.y));
  const walls = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (at(x, y) === '#' && N8.some(([dx, dy]) => walk(at(x + dx, y + dy)))) walls.push({ x, y });
  if (!out.length && walls.length) { const p = walls[Math.floor(r() * walls.length)]; add('ap', p.x, p.y); }
  // kameralar: köşelere yakın duvarlar
  const corner = walls.filter(p => { let k = 0; N8.forEach(([dx, dy]) => { if (at(p.x + dx, p.y + dy) === '#') k++; }); return k >= 2 && N8.filter(([dx, dy]) => walk(at(p.x + dx, p.y + dy))).length >= 1; });
  const pool = (corner.length ? corner : walls).slice().sort(() => r() - 0.5);
  for (let i = 0, k = 0; i < pool.length && k < cnt[0]; i++) { const p = pool[i]; if (out.some(d => Math.abs(d.x - p.x) + Math.abs(d.y - p.y) < 6)) continue; add('cam', p.x, p.y, { dir: dirTo(p.x, p.y), dv: 10 }); k++; }
  // güvenlik kapıları
  const doors = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y) === '+') doors.push({ x, y });
  doors.sort(() => r() - 0.5).slice(0, cnt[1]).forEach(p => add('door', p.x, p.y, { dv: 10 }));
  // taretler: duvar dibindeki zemin
  const fl = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (walk(at(x, y)) && N8.some(([dx, dy]) => at(x + dx, y + dy) === '#')) fl.push({ x, y });
  fl.sort(() => r() - 0.5);
  for (let i = 0, k = 0; i < fl.length && k < cnt[2]; i++) { const p = fl[i]; if (out.some(d => Math.abs(d.x - p.x) + Math.abs(d.y - p.y) < 8)) continue; add('tur', p.x, p.y, { dir: dirTo(p.x, p.y), dv: 8 }); k++; }
  return out;
}
function generateMap(tpl, w, h, seed, dens) {
  const T = TEMPLATES[tpl] || TEMPLATES.depo;
  w = Math.max(16, Math.min(64, w | 0)); h = Math.max(12, Math.min(48, h | 0));
  const r = mkRng(seed);
  const g = T.fn(w, h, r, dens || 1);
  const tiles = g.str();
  return { w, h, tiles, dev: placeDevices(tiles, w, h, mkRng(seed ^ 0x5bd1e995), tpl, seed) };
}

if (typeof module !== 'undefined') module.exports = { generateMap, TEMPLATES, TILE };
