// ===== 3D FİZİK ZARLARI (cannon.js simülasyonu + three.js çizimi) =====
const Dice3D = (function () {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const SIDES = { d4: 4, d6: 6, d8: 8, d10: 10, d10t: 10, d12: 12, d20: 20 };
  const RADIUS = { d4: 1.65, d6: 1.3, d8: 1.42, d10: 1.36, d10t: 1.36, d12: 1.42, d20: 1.5 };
  const W = 16, D = 10; // tepsi (birim)

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function rawVerts(type) {
    if (type === 'd4') return [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
    if (type === 'd6') { const v = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]); return v; }
    if (type === 'd8') return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    if (type === 'd10' || type === 'd10t') {
      const e = 0.12, c36 = Math.cos(Math.PI / 5), h = e * (2 * c36 / (1 - c36) + 1), v = [[0, h, 0], [0, -h, 0]];
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; v.push([Math.cos(a), k % 2 ? -e : e, Math.sin(a)]); }
      return v;
    }
    if (type === 'd12') {
      const v = [], p = PHI, q = 1 / PHI;
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z]);
      for (const a of [-1, 1]) for (const b of [-1, 1]) { v.push([0, a * q, b * p]); v.push([a * q, b * p, 0]); v.push([a * p, 0, b * q]); }
      return v;
    }
    // d20
    const v = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) { v.push([0, a, b * PHI]); v.push([a, b * PHI, 0]); v.push([a * PHI, 0, b]); }
    return v;
  }
  // dışbükey gövdenin düzlemsel yüzlerini bul (yüz köşeleri dışarıdan bakınca saat yönünün tersine)
  function hullFaces(V) {
    const faces = [], eps = 1e-6;
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
      let n = cross(sub(V[j], V[i]), sub(V[k], V[i])); const l = Math.hypot(...n); if (l < eps) continue; n = n.map(x => x / l);
      let d = dot(n, V[i]); let pos = 0, neg = 0;
      for (const p of V) { const s = dot(n, p) - d; if (s > 1e-5) pos++; else if (s < -1e-5) neg++; }
      if (pos && neg) continue;
      if (pos) { n = n.map(x => -x); d = -d; }
      if (faces.some(f => dot(f.n, n) > 0.9999)) continue;
      const idx = []; V.forEach((p, m) => { if (Math.abs(dot(n, p) - d) < 1e-5) idx.push(m); });
      const c = idx.reduce((a, m) => [a[0] + V[m][0] / idx.length, a[1] + V[m][1] / idx.length, a[2] + V[m][2] / idx.length], [0, 0, 0]);
      const u = norm(sub(V[idx[0]], c)), w = cross(n, u);
      idx.sort((a, b) => { const pa = sub(V[a], c), pb = sub(V[b], c); return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u)); });
      faces.push({ n, idx, c });
    }
    return faces;
  }
  const SHAPES = {};
  function shape(type) {
    if (SHAPES[type]) return SHAPES[type];
    let V = rawVerts(type);
    const rmax = Math.max(...V.map(p => Math.hypot(...p)));
    V = V.map(p => p.map(x => x / rmax * RADIUS[type]));
    const F = hullFaces(V);
    const N = SIDES[type];
    let labels, values;
    if (type === 'd4') {
      values = [1, 2, 3, 4]; labels = null; // köşe değerleri
    } else {
      values = new Array(F.length).fill(null);
      let k = 0;
      const lowV = (type === 'd10' || type === 'd10t') ? 0 : 1, sum = (type === 'd10' || type === 'd10t') ? 9 : N + 1;
      for (let i = 0; i < F.length; i++) {
        if (values[i] !== null) continue;
        let best = -1, bd = 2; for (let j = 0; j < F.length; j++) if (j !== i && values[j] === null) { const dd = dot(F[i].n, F[j].n); if (dd < bd) { bd = dd; best = j; } }
        values[i] = lowV + k; values[best] = sum - (lowV + k); k++;
      }
      labels = values.map(v => type === 'd10t' ? (v === 0 ? '00' : String(v * 10)) : String(v));
    }
    SHAPES[type] = { V, F, values, labels };
    return SHAPES[type];
  }

  // ---- simülasyon (aynı tohum = aynı atış) ----
  function simulate(seed, types) {
    const C = window.CANNON || (typeof CANNON !== 'undefined' ? CANNON : null);
    const r = mulberry(seed);
    const world = new C.World();
    world.gravity.set(0, -9.82 * 4, 0);
    world.broadphase = new C.NaiveBroadphase();
    world.solver.iterations = 16;
    world.allowSleep = true;
    const mDie = new C.Material('die'), mFloor = new C.Material('floor'), mWall = new C.Material('wall');
    world.addContactMaterial(new C.ContactMaterial(mFloor, mDie, { friction: 0.32, restitution: 0.42 }));
    world.addContactMaterial(new C.ContactMaterial(mWall, mDie, { friction: 0.05, restitution: 0.75 }));
    world.addContactMaterial(new C.ContactMaterial(mDie, mDie, { friction: 0.18, restitution: 0.5 }));
    const plane = (mat, pos, axis, ang) => { const b = new C.Body({ mass: 0, material: mat }); b.addShape(new C.Plane()); b.position.set(pos[0], pos[1], pos[2]); b.quaternion.setFromAxisAngle(new C.Vec3(axis[0], axis[1], axis[2]), ang); world.addBody(b); };
    plane(mFloor, [0, 0, 0], [1, 0, 0], -Math.PI / 2);
    plane(mWall, [-W / 2, 0, 0], [0, 1, 0], Math.PI / 2);
    plane(mWall, [W / 2, 0, 0], [0, 1, 0], -Math.PI / 2);
    plane(mWall, [0, 0, -D / 2], [0, 1, 0], 0);
    plane(mWall, [0, 0, D / 2], [0, 1, 0], Math.PI);
    plane(mWall, [0, 9, 0], [1, 0, 0], Math.PI / 2); // tavan: zar kutudan kaçmasın
    const bodies = types.map((t, i) => {
      const sh = shape(t);
      const poly = new C.ConvexPolyhedron(sh.V.map(p => new C.Vec3(p[0], p[1], p[2])), sh.F.map(f => f.idx.slice()));
      const b = new C.Body({ mass: 1, material: mDie });
      b.addShape(poly);
      b.linearDamping = 0.08; b.angularDamping = 0.08;
      b.allowSleep = true; b.sleepSpeedLimit = 0.2; b.sleepTimeLimit = 0.25;
      const gx = i % 5, gz = Math.floor(i / 5) % 3, gy = Math.floor(i / 15);
      b.position.set(-W / 2 + 2 + gx * 2.4 + r() * 0.3, 3 + gy * 2.8 + r() * 1.5, -D / 2 + 2 + gz * 2.6 + r() * 0.4);
      const q = new C.Quaternion(); q.setFromEuler(r() * 6.283, r() * 6.283, r() * 6.283); b.quaternion.copy(q);
      b.velocity.set(9 + r() * 7, 2 + r() * 3, (r() - 0.5) * 8);
      b.angularVelocity.set((r() - 0.5) * 34, (r() - 0.5) * 34, (r() - 0.5) * 34);
      world.addBody(b);
      return b;
    });
    const frames = [];
    const snap = () => { const f = new Float32Array(bodies.length * 7); bodies.forEach((b, i) => { const o = i * 7; f[o] = b.position.x; f[o + 1] = b.position.y; f[o + 2] = b.position.z; f[o + 3] = b.quaternion.x; f[o + 4] = b.quaternion.y; f[o + 5] = b.quaternion.z; f[o + 6] = b.quaternion.w; }); frames.push(f); };
    snap();
    let nudges = 0, calm = 0;
    for (let step = 0; step < 900; step++) {
      if (step === 200 || step === 360 || step === 520) { const k = step === 200 ? 0.35 : step === 360 ? 0.7 : 0.95; bodies.forEach(b => { b.linearDamping = k; b.angularDamping = k; }); }
      world.step(1 / 60); snap();
      const moving = bodies.some(b => b.velocity.norm() > 0.06 || b.angularVelocity.norm() > 0.12);
      calm = moving ? 0 : calm + 1;
      if (calm >= 12 || step === 899) {
        // eğik duran zar var mı?
        const cocked = bodies.filter(b => upFace(b, types[bodies.indexOf(b)]).score < 0.93);
        if (!cocked.length || nudges >= 4) break;
        nudges++; calm = 0;
        cocked.forEach(b => { b.wakeUp(); b.velocity.set((r() - 0.5) * 3, 4 + r() * 2, (r() - 0.5) * 3); b.angularVelocity.set((r() - 0.5) * 14, (r() - 0.5) * 14, (r() - 0.5) * 14); });
      }
    }
    const res = bodies.map((b, i) => upFace(b, types[i]));
    return { frames, n: bodies.length, values: res.map(x => x.value), faces: res.map(x => x.face) };
  }
  function upFace(b, type) {
    const sh = shape(type), q = b.quaternion;
    const rot = v => { const C = window.CANNON || CANNON; const o = q.vmult(new C.Vec3(v[0], v[1], v[2])); return [o.x, o.y, o.z]; };
    if (type === 'd4') {
      let best = -1, by = -1e9;
      sh.V.forEach((p, i) => { const y = rot(p)[1]; if (y > by) { by = y; best = i; } });
      const up = norm(rot(sh.V[best]));
      return { value: sh.values[best], face: best, score: up[1] };
    }
    let best = -1, bd = -2;
    sh.F.forEach((f, i) => { const d = rot(f.n)[1]; if (d > bd) { bd = d; best = i; } });
    let v = sh.values[best];
    if (type === 'd10') v = v === 0 ? 10 : v;
    if (type === 'd10t') v = v * 10;
    return { value: v, face: best, score: bd };
  }

  // ---- kütüphane yükleme ----
  let libP = null;
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function ready() {
    if (!libP) libP = Promise.all([
      window.THREE ? 1 : loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'),
      window.CANNON ? 1 : loadScript('https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js'),
    ]).then(() => !!(window.THREE && window.CANNON)).catch(() => false);
    return libP;
  }

  // ---- çizim: cyberdeck zar kutusu ----
  let R3 = null;
  function srng(seed) { let a = seed >>> 0 || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; }
  const texCache = {};
  function circuit(g, S, r, col, w) {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w;
    for (let k = 0; k < 16; k++) {
      let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y);
      const segs = 2 + Math.floor(r() * 4);
      for (let s = 0; s < segs; s++) { const L = 18 + r() * 60; const dir = Math.floor(r() * 4); if (dir === 0) x += L; else if (dir === 1) x -= L; else if (dir === 2) y += L; else y -= L; if (r() < 0.4) { x += (r() < 0.5 ? -1 : 1) * L * 0.5; y += (r() < 0.5 ? -1 : 1) * L * 0.5; } g.lineTo(x, y); }
      g.stroke(); g.beginPath(); g.arc(x, y, w * 2.2, 0, 7); g.fill();
    }
  }
  function faceTexture(type, fi, uvs, centerUV) {
    const key = type + '|' + fi;
    if (texCache[key]) return texCache[key];
    const T = window.THREE, S = 256;
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
    const cm = mk(), ce = mk(); const g = cm.getContext('2d'), e = ce.getContext('2d');
    const r = srng((fi + 1) * 7919 + type.length * 104729);
    // gövde: yarı saydam turkuaz-yeşil reçine
    const grd = g.createRadialGradient(S * (0.3 + r() * 0.4), S * (0.3 + r() * 0.4), 10, S / 2, S / 2, S * 0.75);
    grd.addColorStop(0, r() < 0.5 ? '#3ff07a' : '#2fe0a0'); grd.addColorStop(0.55, '#14b38a'); grd.addColorStop(1, '#0a6f74');
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    circuit(g, S, r, 'rgba(226,255,110,.55)', 2.2);
    g.font = '600 12px monospace'; g.fillStyle = 'rgba(210,255,120,.28)';
    for (let k = 0; k < 4; k++) { let s = ''; for (let j = 0; j < 8; j++) s += r() < 0.5 ? '0' : '1'; g.fillText(s, r() * S * 0.7, 20 + r() * S * 0.9); }
    e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
    const r2 = srng((fi + 1) * 7919 + type.length * 104729); r2(); r2(); r2(); r2();
    circuit(e, S, r2, 'rgba(120,255,90,.22)', 2.2);
    const sh = shape(type);
    const toC = uv => [uv[0] * S, (1 - uv[1]) * S];
    const num = (ctx, txt, x, y, size, rot, glow) => {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
      ctx.font = '800 ' + size + 'px "Saira Extra Condensed", "Arial Narrow", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (!glow) { ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(4,40,30,.85)'; ctx.strokeText(txt, 0, 2); }
      ctx.fillStyle = glow ? '#e4ff3c' : '#efff6a'; ctx.fillText(txt, 0, 2);
      if (txt === '6' || txt === '9') ctx.fillRect(-size * 0.18, size * 0.42, size * 0.36, Math.max(4, size * 0.06));
      ctx.restore();
    };
    if (type === 'd4') {
      const f = sh.F[fi]; const [cx, cy] = toC(centerUV);
      f.idx.forEach((vi, k) => { const [vx, vy] = toC(uvs[k]); const dx = vx - cx, dy = vy - cy; [g, e].forEach((ctx, j) => num(ctx, String(sh.values[vi]), cx + dx * 0.58, cy + dy * 0.58, 60, Math.atan2(dx, -dy), j)); });
    } else {
      const lab = sh.labels[fi]; const [cx, cy] = toC(centerUV);
      const big = { d6: 132, d8: 100, d10: 84, d10t: 70, d12: 84, d20: 64 }[type];
      [g, e].forEach((ctx, j) => num(ctx, lab, cx, cy, big, 0, j));
    }
    const map = new T.CanvasTexture(cm), emi = new T.CanvasTexture(ce); map.anisotropy = emi.anisotropy = 4;
    texCache[key] = { map, emi }; return texCache[key];
  }
  function buildMesh(type) {
    const T = window.THREE, sh = shape(type);
    const pos = [], nor = [], uv = [], mats = [], geo = new T.BufferGeometry();
    let vcount = 0;
    sh.F.forEach((f, fi) => {
      const u = norm(sub(sh.V[f.idx[0]], f.c)), w = cross(f.n, u);
      const pts = f.idx.map(i => { const p = sub(sh.V[i], f.c); return [dot(p, u), dot(p, w)]; });
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; pts.forEach(p => { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
      const sc = 0.86 / Math.max(mxx - mnx, mxy - mny), ox = 0.5 - (mnx + mxx) / 2 * sc, oy = 0.5 - (mny + mxy) / 2 * sc;
      const uvs = pts.map(p => [p[0] * sc + ox, p[1] * sc + oy]);
      const start = vcount;
      for (let k = 1; k < f.idx.length - 1; k++) [0, k, k + 1].forEach(m => { const p = sh.V[f.idx[m]]; pos.push(p[0], p[1], p[2]); nor.push(f.n[0], f.n[1], f.n[2]); uv.push(uvs[m][0], uvs[m][1]); vcount++; });
      geo.addGroup(start, vcount - start, fi);
      const tx = faceTexture(type, fi, uvs, [ox, oy]);
      mats.push(new T.MeshPhysicalMaterial({ map: tx.map, emissiveMap: tx.emi, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, transparent: true, opacity: 0.94 }));
    });
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    const mesh = new T.Mesh(geo, mats); mesh.castShadow = true;
    const edges = new T.LineSegments(new T.EdgesGeometry(geo, 12), new T.LineBasicMaterial({ color: 0xd8ffe6, transparent: true, opacity: 0.45 }));
    mesh.add(edges); mesh.userData.mats = mats;
    return mesh;
  }
  function panelTexture() {
    const T = window.THREE, cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640; const g = cv.getContext('2d');
    g.fillStyle = '#0a0e0f'; g.fillRect(0, 0, 1024, 640);
    g.strokeStyle = 'rgba(64,255,150,.07)'; g.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 640); g.stroke(); }
    for (let y = 0; y <= 640; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    g.strokeStyle = 'rgba(234,42,68,.55)'; g.lineWidth = 3; g.strokeRect(14, 14, 996, 612);
    g.fillStyle = 'rgba(64,255,150,.35)'; g.font = '600 20px monospace'; g.fillText('DICE//BAY-02', 30, 46); g.fillText('PHYS-RNG ARMED', 30, 612);
    g.textAlign = 'right'; g.fillText('NC-TABLE MK.III', 994, 46);
    [[24, 24], [1000, 24], [24, 616], [1000, 616]].forEach(([x, y]) => { g.fillStyle = '#2c3438'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.strokeStyle = '#11161a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke(); });
    const t = new T.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  // matrix monitörü
  const MX = { cv: null, g: null, drops: [], msg: null, msgT: 0, tone: '' };
  function matrixInit() {
    MX.cv = document.createElement('canvas'); MX.cv.width = 640; MX.cv.height = 400; MX.g = MX.cv.getContext('2d');
    MX.g.fillStyle = '#000'; MX.g.fillRect(0, 0, 640, 400);
    const cols = Math.floor(640 / 14); MX.drops = []; for (let i = 0; i < cols; i++) MX.drops.push(Math.random() * -40);
  }
  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789ABCDEF<>/\\$#';
  function matrixStep(now) {
    const g = MX.g, red = MX.tone === 'crit-lo';
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, 0, 640, 400);
    g.font = '600 14px monospace';
    MX.drops.forEach((d, i) => {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const y = d * 14;
      g.fillStyle = red ? '#ff5a6e' : '#d7ffe2'; g.fillText(ch, i * 14, y);
      g.fillStyle = red ? 'rgba(255,60,80,.8)' : 'rgba(40,255,120,.85)'; g.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * 14, y - 14);
      MX.drops[i] = y > 400 && Math.random() > 0.975 ? 0 : d + (0.55 + (i % 5) * 0.12);
    });
    if (MX.msg) {
      const k = Math.min(1, (now - MX.msgT) / 250);
      const col = { 'crit-hi': '#e4ff3c', max: '#e4ff3c', ok: '#5dff9a', fail: '#ff8090', 'crit-lo': '#ff3b55', low: '#ffb2bc', neutral: '#9ff5ff' }[MX.tone] || '#9ff5ff';
      g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(0,0,0,.78)'; g.fillRect(40, 140, 560, 120);
      g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(40, 140, 560, 120);
      g.fillStyle = col; g.font = '800 46px "Saira Extra Condensed", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let ox = 0; if (MX.tone === 'crit-lo' && Math.random() < 0.4) ox = (Math.random() - 0.5) * 24;
      g.fillText(MX.msg, 320 + ox, 200);
      if (MX.tone === 'crit-lo') for (let s = 0; s < 4; s++) { const yy = 140 + Math.random() * 120; g.drawImage(MX.cv, 0, yy, 640, 6, (Math.random() - 0.5) * 40, yy, 640, 6); }
      g.font = '600 14px monospace'; g.fillText(MX.sub || '', 320, 244);
      g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    }
    if (R3) R3.mon.map.needsUpdate = true;
  }
  function initScene(canvas) {
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(36, 16 / 11, 0.1, 200);
    cam.position.set(0, 13.2, 15.2); cam.lookAt(0, 2.4, -1.4);
    scene.add(new T.AmbientLight(0xbfd8d0, 0.38));
    const key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(-5, 15, 8); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -11, right: 11, top: 9, bottom: -9 }); scene.add(key);
    const monLight = new T.PointLight(0x3dff8a, 1.1, 26, 1.6); monLight.position.set(0, 5, -4.5); scene.add(monLight);
    const amber = new T.PointLight(0xea2a44, 0.35, 20); amber.position.set(8, 3, 5); scene.add(amber);
    // tepsi zemini
    const floor = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: panelTexture(), roughness: 0.85, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    // sert kasa çerçevesi
    const body = new T.MeshStandardMaterial({ color: 0x15191b, roughness: 0.55, metalness: 0.25 });
    const bump = new T.MeshStandardMaterial({ color: 0x0b0d0e, roughness: 0.75 });
    const box = (w, h, d, x, y, z, m) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m || body); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; scene.add(b); return b; };
    box(W + 1.6, 0.9, 0.8, 0, 0.35, D / 2 + 0.4); box(W + 1.6, 0.9, 0.8, 0, 0.35, -D / 2 - 0.4);
    box(0.8, 0.9, D, -W / 2 - 0.4, 0.35, 0); box(0.8, 0.9, D, W / 2 + 0.4, 0.35, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(1.3, 1.1, 1.3, sx * (W / 2 + 0.4), 0.45, sz * (D / 2 + 0.4), bump));
    box(W + 3, 0.4, D + 3, 0, -0.25, 0, bump);
    // ön panel LED'leri
    const leds = [];
    for (let i = 0; i < 14; i++) {
      const col = [0x3dff8a, 0x3dff8a, 0xf2c230, 0x3dff8a, 0xff4a5f][i % 5];
      const m = new T.MeshBasicMaterial({ color: col }); const l = new T.Mesh(new T.BoxGeometry(0.22, 0.06, 0.12), m);
      l.position.set(-W / 2 + 2 + i * 0.5, 0.82, D / 2 + 0.42); scene.add(l); leds.push(l);
    }
    // küçük LCD
    const lcdCv = document.createElement('canvas'); lcdCv.width = 256; lcdCv.height = 64;
    const lcdTex = new T.CanvasTexture(lcdCv);
    const lcd = new T.Mesh(new T.PlaneGeometry(3, 0.75), new T.MeshBasicMaterial({ map: lcdTex })); lcd.rotation.x = -Math.PI / 2 + 0.25; lcd.position.set(W / 2 - 2.6, 0.83, D / 2 + 0.42); scene.add(lcd);
    // kapak + monitör
    const lid = new T.Group(); lid.position.set(0, 0.5, -D / 2 - 0.9); lid.rotation.x = -0.14; scene.add(lid);
    const lidFrame = new T.Mesh(new T.BoxGeometry(W + 1.6, 9.4, 0.7), body); lidFrame.position.set(0, 4.7, 0); lidFrame.castShadow = true; lid.add(lidFrame);
    const bezel = new T.Mesh(new T.BoxGeometry(W * 0.86, 6.8, 0.2), bump); bezel.position.set(0, 5.1, 0.4); lid.add(bezel);
    matrixInit();
    const monTex = new T.CanvasTexture(MX.cv);
    const mon = new T.Mesh(new T.PlaneGeometry(W * 0.8, 6.1), new T.MeshBasicMaterial({ map: monTex, toneMapped: false })); mon.position.set(0, 5.1, 0.52); lid.add(mon);
    for (let i = 0; i < 6; i++) { const p = new T.Mesh(new T.BoxGeometry(0.7, 0.25, 0.1), new T.MeshBasicMaterial({ color: i % 3 === 1 ? 0x8a6cff : 0x262c30 })); p.position.set(-W / 2 + 2 + i * 2.4, 9.0, 0.38); lid.add(p); }
    [-W / 2 + 1.5, W / 2 - 1.5].forEach(x => { const h = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 1.6, 16), bump); h.rotation.z = Math.PI / 2; h.position.set(x, -0.1, 0.1); lid.add(h); });
    const R = { renderer, scene, cam, meshes: [], mon: { map: monTex }, leds, lcd: { cv: lcdCv, tex: lcdTex }, monLight };
    lcdWrite(R, 'RNG READY');
    return R;
  }
  function lcdWrite(R, txt) {
    const g = R.lcd.cv.getContext('2d'); g.fillStyle = '#0d1f0f'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#7dff5a'; g.font = '700 30px monospace'; g.textBaseline = 'middle'; g.fillText(String(txt).slice(0, 13), 12, 34); R.lcd.tex.needsUpdate = true;
  }
  // parçacıklar (2B katman)
  const P = { list: [] };
  function burst(cv, x, y, n, cols, spd) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * spd; P.list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.4, life: 1, col: cols[i % cols.length], s: 2 + Math.random() * 3 }); }
  }
  function particlesStep(cv) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    P.list = P.list.filter(p => p.life > 0);
    P.list.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.985; p.life -= 0.016; g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.col; g.fillRect(p.x, p.y, p.s, p.s); });
    g.globalAlpha = 1;
    return P.list.length > 0;
  }

  // ---- oynatma ----
  let queue = Promise.resolve();
  let skipCurrent = null;
  const MSG = { 'crit-hi': 'CRITICAL SUCCESS', max: 'MAXIMUM OUTPUT', ok: 'ACCESS GRANTED', fail: 'ACCESS DENIED', 'crit-lo': 'CRITICAL FAILURE', low: 'LOW SIGNAL', neutral: 'ROLL COMPLETE' };
  function play(job) {
    return new Promise(resolve => {
      const ov = document.getElementById('tray'); const cv = document.getElementById('trayCanvas');
      const pcv = document.getElementById('trayParticles'), lay = document.getElementById('trayNums'), boxEl = ov.querySelector('.tray-box');
      if (!R3) R3 = initScene(cv);
      const T = window.THREE;
      R3.meshes.forEach(m => R3.scene.remove(m)); R3.meshes = [];
      job.types.forEach(t => { const m = buildMesh(t); R3.scene.add(m); R3.meshes.push(m); });
      document.getElementById('trayLabel').textContent = job.label || '';
      const res = document.getElementById('trayResult'); res.textContent = ''; res.className = 'tray-res';
      lay.innerHTML = ''; boxEl.className = 'tray-box'; MX.msg = null; MX.tone = '';
      ov.hidden = false; ov.classList.remove('out');
      const st = cv.parentElement.getBoundingClientRect();
      R3.renderer.setSize(st.width, st.width * 11 / 16, false);
      R3.cam.aspect = 16 / 11; R3.cam.updateProjectionMatrix();
      pcv.width = st.width; pcv.height = st.width * 11 / 16;
      lcdWrite(R3, 'ROLLING ' + job.types.length + 'D');
      const fr = job.sim.frames, n = job.sim.n; const t0 = performance.now();
      // çarpma anlarını önceden bul (ses için)
      const hits = [];
      for (let i = 0; i < n; i++) { let last = -99; for (let k = 2; k < fr.length; k++) { const y0 = fr[k - 2][i * 7 + 1], y1 = fr[k - 1][i * 7 + 1], y2 = fr[k][i * 7 + 1]; const v0 = y1 - y0, v1 = y2 - y1; if (v0 < -0.035 && v1 > v0 * 0.25 && y1 < 1.8 && k - last > 5) { hits.push([k, Math.min(1, -v0 * 6), (fr[k][i * 7] / (W / 2))]); last = k; } } }
      hits.sort((a, b) => a[0] - b[0]); let hi = 0;
      Sound.play('roll');
      let done = false, endT = 0;
      const tone = job.tone || 'neutral';
      const finish = () => {
        if (done) return; done = true; endT = performance.now();
        setFrame(fr.length - 1);
        // rakamlar
        const W2 = st.width, H2 = st.width * 11 / 16; const spots = [];
        job.sim.values.forEach((v, i) => {
          const p = new T.Vector3().copy(R3.meshes[i].position); p.y += 1.3; p.project(R3.cam);
          const el = document.createElement('span'); el.className = 'dnum t-' + tone; el.textContent = job.types[i] === 'd10t' ? (v === 0 ? '00' : v) : v;
          el.style.left = ((p.x + 1) / 2 * W2) + 'px'; el.style.top = ((1 - p.y) / 2 * H2) + 'px'; el.style.animationDelay = (i * 60) + 'ms'; spots.push([(p.x + 1) / 2 * W2, (1 - p.y) / 2 * H2 + 30]);
          lay.appendChild(el);
        });
        res.className = 'tray-res t-' + tone;
        countUp(res, job.resultText || '');
        boxEl.classList.add('tone-' + tone);
        MX.msg = job.msg || MSG[tone]; MX.sub = job.sub || ''; MX.tone = tone; MX.msgT = performance.now();
        lcdWrite(R3, (job.lcd || MSG[tone]).slice(0, 13));
        const each = (n, cols, sp) => spots.forEach(q => burst(pcv, q[0], q[1], Math.ceil(n / spots.length), cols, sp));
        if (tone === 'crit-hi') { each(160, ['#e4ff3c', '#3dff8a', '#ffffff', '#41cfd6'], 9); R3.meshes.forEach(m => m.userData.mats.forEach(mt => mt.emissiveIntensity = 1.6)); Sound.play('critHi'); }
        else if (tone === 'max') { each(90, ['#e4ff3c', '#3dff8a'], 7); R3.meshes.forEach(m => m.userData.mats.forEach(mt => mt.emissiveIntensity = 1.2)); Sound.play('critHi'); }
        else if (tone === 'ok') { each(40, ['#3dff8a', '#9cff57'], 5); Sound.play('ok'); }
        else if (tone === 'crit-lo') { R3.meshes.forEach(m => m.userData.mats.forEach(mt => { mt.emissive.setHex(0xff2244); mt.emissiveIntensity = 1.1; })); R3.monLight.color.setHex(0xff2244); Sound.play('critLo'); }
        else if (tone === 'fail' || tone === 'low') { R3.meshes.forEach(m => m.userData.mats.forEach(mt => mt.emissiveIntensity = 0.2)); Sound.play('fail'); }
        const hold = job.hold != null ? job.hold : (tone === 'crit-hi' || tone === 'crit-lo' ? 2600 : 1800);
        setTimeout(() => { ov.classList.add('out'); setTimeout(() => { ov.hidden = true; R3.monLight.color.setHex(0x3dff8a); resolve(); }, 280); }, hold);
      };
      skipCurrent = finish;
      function setFrame(k) {
        const f = fr[k];
        for (let i = 0; i < n; i++) { const o = i * 7; R3.meshes[i].position.set(f[o], f[o + 1], f[o + 2]); R3.meshes[i].quaternion.set(f[o + 3], f[o + 4], f[o + 5], f[o + 6]); }
      }
      (function tick() {
        const now = performance.now();
        if (!done) {
          const el = now - t0, base = el / (1000 / 60); const k = Math.min(fr.length - 1, Math.floor(base <= 200 ? base : 200 + (base - 200) * 2.5));
          while (hi < hits.length && hits[hi][0] <= k) { Sound.play('clack', hits[hi][2] * 0.6, hits[hi][1]); hi++; }
          setFrame(k);
          if (k >= fr.length - 1) finish();
        }
        R3.leds.forEach((l, i) => l.visible = Math.sin(now / 140 + i * 1.7) > -0.6 || i % 3);
        if (done && (tone === 'crit-hi' || tone === 'max')) { const s = 1 + Math.sin(now / 90) * 0.04; R3.meshes.forEach(m => m.scale.setScalar(s)); }
        matrixStep(now);
        R3.renderer.render(R3.scene, R3.cam);
        particlesStep(pcv);
        if (!ov.hidden) requestAnimationFrame(tick);
        else R3.meshes.forEach(m => m.scale.setScalar(1));
      })();
    });
  }
  function countUp(el, txt) {
    const m = /^(.*?)(-?\d+)$/.exec(txt);
    if (!m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = txt; return; }
    const pre = m[1], end = +m[2], t0 = performance.now();
    (function step() { const k = Math.min(1, (performance.now() - t0) / 450); el.textContent = pre + Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })();
  }
  function skip() { if (skipCurrent) skipCurrent(); }

  // types: ['d6','d6'] → Promise<{values, seed, physical}>
  async function roll(types, opts) {
    opts = opts || {};
    const ok = await ready();
    const seed = opts.seed != null ? opts.seed : (crypto.getRandomValues(new Uint32Array(1))[0]);
    let out;
    if (!ok) {
      const values = types.map(t => { const s = SIDES[t]; const v = 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % s); return t === 'd10t' ? (v - 1) * 10 : v; });
      out = { values, seed, physical: false };
      out.fx = opts.tone ? opts.tone(values) : {};
      if (opts.onStart) opts.onStart(out);
      return out;
    }
    const sim = simulate(seed, types);
    out = { values: sim.values, seed, physical: true };
    out.fx = opts.tone ? opts.tone(sim.values) : {};
    if (opts.onStart) opts.onStart(out);
    if (opts.animate !== false) {
      const job = { types, sim, label: opts.label, resultText: opts.resultText ? opts.resultText(sim.values) : '', tone: out.fx.tone, msg: out.fx.msg, sub: out.fx.sub, lcd: out.fx.lcd, hold: opts.hold };
      const p = queue.then(() => play(job)); queue = p.catch(() => { });
      if (opts.waitAnim) await p; else out.anim = p;
    }
    return out;
  }
  async function replay(types, seed, opts) {
    const ok = await ready(); if (!ok) return;
    const sim = simulate(seed, types);
    const job = { types, sim, label: opts.label, resultText: opts.resultText || '', tone: opts.tone, msg: opts.msg, sub: opts.sub, hold: 1500 };
    const p = queue.then(() => play(job)); queue = p.catch(() => { });
    return p;
  }
  return { roll, replay, ready, skip, simulate, shape, SIDES };
})();
