// ===== NET: haritadaki hacklenebilir sistemler ve Netrunner (Interface) =====
// Tanımlar haritada (m.dev, m.net.pw), anlık durum dev/<id> belgelerinde (kontrol, kapı, açık/kapalı, taret HP).
const DEV_T = {
  ap: { n: 'Erişim noktası', dv: 0, d: 'NET mimarisine giriş. 6 m içinde ve arada duvar yokken Jack In yapılır.' },
  cam: { n: 'Güvenlik kamerası', dv: 10, d: 'Kontrol eden görüntüyü izleyebilir ya da döngüye alıp kör edebilir.' },
  door: { n: 'Güvenlik kapısı', dv: 10, d: 'Kontrol eden açar, kapatır ya da kilitler. Kilitli kapıdan geçilemez.' },
  tur: { n: 'Otomatik taret', dv: 8, d: 'Combat Number 14, 25 HP, saldırı tüfeği (5d6). Kontrol eden ateş ettirir ya da kapatır.' },
};
const NET = { st: {} };
const TUR = { cn: 14, hp: 25, w: { n: 'Otomatik taret · saldırı tüfeği', d: '5d6', cls: 'ar', af: 0 } };
const CAM_R = 8;
const ARCHE_ROLE = { runner: 'Netrunner', solo: 'Solo', ncpd: 'Lawman', ripper: 'Medtech', nomad: 'Nomad' };
const TIER_RANK = { mook: 2, vet: 4, elite: 6, boss: 8 };
function roleOf(c) { if (!c) return null; return c.kind === 'npc' ? (ARCHE_ROLE[c.arche] || null) : (c.role || null); }
function rankOf(c) { if (!c) return 0; return c.kind === 'npc' ? (+c.rank || TIER_RANK[c.tier] || 2) : (+c.rank || 0); }
const naMax = r => r >= 10 ? 5 : r >= 7 ? 4 : r >= 4 ? 3 : 2;
const naKey = () => (S.init && (S.init.order || []).length) ? 'r' + (S.init.round || 1) : null;

function devList(m) { m = m || curMap(); return (m && m.dev) || []; }
function devById(id) { return devList().find(d => d.id === id) || null; }
function devAt(x, y, m) { return devList(m).find(d => d.x === x && d.y === y) || null; }
function devSt(id) { return NET.st[id] || {}; }
function devVis(d) { return S.me.isGM || !d.hid || !!devSt(d.id).seen; }
function devDv(d) { return d.dv != null ? +d.dv : DEV_T[d.t].dv; }
function doorState(d) { return devSt(d.id).st || 'closed'; }
function doorBlocksMove(m, x, y) { const d = devAt(x, y, m); return !!(d && d.t === 'door' && doorState(d) === 'locked'); }
function doorBlocksLos(x, y) { const d = devAt(x, y); return !!(d && d.t === 'door' && doorState(d) !== 'open'); }
function devSet(id, patch) { NET.st[id] = Object.assign({}, devSt(id), patch); setDoc('dev/' + id, NET.st[id]); dirty(); renderDevCard(); }
function ctlName(id) { const s = devSt(id); if (!s.ctl) return 'Sistem'; const t = S.tokens[s.ctl]; return t ? (t.hidden && !S.me.isGM ? 'Bilinmeyen' : t.name) : 'Sistem'; }
function ctlSide(id) { const s = devSt(id); if (!s.ctl || !S.tokens[s.ctl]) return 'sys'; return S.tokens[s.ctl].kind === 'npc' ? 'npc' : 'pc'; }
function netPw(m) { m = m || curMap(); return m && m.net ? (+m.net.pw || 0) : 8; }

// ---- Netrunner durumu ----
function isRunner(tid) { const t = S.tokens[tid]; const c = t && tokChar(t); return roleOf(c) === 'Netrunner' && rankOf(c) > 0; }
function myRunners() { return Object.keys(S.tokens).filter(t => canAct(t) && isRunner(t)); }
function runnerFor() {
  if (S.actTok && S.tokens[S.actTok] && canAct(S.actTok) && isRunner(S.actTok)) return S.actTok;
  if (S.sel && canAct(S.sel) && isRunner(S.sel)) return S.sel;
  const r = myRunners(); if (!r.length) return null;
  if (S.me.isGM) return r.find(t => S.tokens[t].net) || null;
  return r[0];
}
function apInRange(tid) { const t = S.tokens[tid]; if (!t) return []; return devList().filter(d => d.t === 'ap' && devVis(d) && sq(t, d) <= 3 && los(t, d)); }
function naLeft(tid) { const t = S.tokens[tid]; const c = tokChar(t); const mx = naMax(rankOf(c)); const k = naKey(); if (!k) return { mx, left: mx, free: true }; const u = t.na && t.na.k === k ? t.na.n : 0; return { mx, left: Math.max(0, mx - u), free: false }; }
function useNA(tid) {
  const t = S.tokens[tid]; const k = naKey(); if (!k) return true;
  const L = naLeft(tid); if (L.left <= 0) { toast('Bu tur NET aksiyonun kalmadı (' + L.mx + '/' + L.mx + ').', 'err'); return false; }
  t.na = { k, n: (t.na && t.na.k === k ? t.na.n : 0) + 1 }; setDoc(tokPath(tid), t); return true;
}
function saveTok(tid) { const t = S.tokens[tid]; if (t) setDoc(tokPath(tid), t); renderTokCard(); renderDevCard(); dirty(); }
const devCell = d => ({ x: d.x, y: d.y });
async function ifaceCheck(tid, label, dv) {
  const c = tokChar(S.tokens[tid]); const r = rankOf(c);
  const notes = []; const mod = withLuck(S.tokens[tid].charId, 0, notes);
  return doCheck({ who: charLabel(c), label, base: r, mod, dv, notes, pre: 'Interface ' + r + ' →' });
}

// ---- NET işlemleri ----
async function netJackIn(tid, apId) {
  const t = S.tokens[tid]; if (!t) return;
  const aps = apInRange(tid); const ap = aps.find(d => d.id === apId) || aps[0];
  if (!ap) { toast('6 m (3 kare) içinde, arada duvar olmayan bir erişim noktası yok.', 'err'); return; }
  if (!useNA(tid)) return;
  t.net = { ap: ap.id, pw: netPw() ? 0 : 1 }; saveTok(tid);
  playFx({ k: 'code', a: tid, c: devCell(ap), txt: 'JACK IN', col: '#41cfd6' });
  logRoll({ who: t.name, label: 'Jack In', total: '—', detail: DEV_T.ap.n + ' üzerinden NET mimarisine girdi.' + (netPw() ? ' Önce şifreyi (Backdoor) geçmeli.' : ''), kind: 'check' });
}
function netRelease(tid) { Object.keys(NET.st).forEach(id => { if (NET.st[id].ctl === tid) devSet(id, { ctl: null, chk: 0 }); }); }
async function netJackOut(tid, forced) {
  const t = S.tokens[tid]; if (!t || !t.net) return;
  if (!forced && !useNA(tid)) return;
  netRelease(tid); t.net = null; saveTok(tid);
  playFx({ k: 'text', b: tid, txt: forced ? 'BAĞLANTI KOPTU' : 'JACK OUT', col: forced ? '#ff4a5f' : '#41cfd6' });
}
async function netBackdoor(tid) {
  const t = S.tokens[tid]; if (!t || !t.net) return; if (t.net.pw) { toast('Şifre zaten geçildi.'); return; }
  if (!useNA(tid)) return;
  const dv = netPw(); const r = await ifaceCheck(tid, 'Backdoor · şifre', dv);
  if (r.okReal) { t.net.pw = 1; saveTok(tid); playFx({ k: 'code', b: tid, txt: 'ŞİFRE KIRILDI', col: '#7bd88f' }); }
  else playFx({ k: 'text', b: tid, txt: 'ŞİFRE TUTTU', col: '#ff8090' });
}
async function netScanner(tid) {
  const t = S.tokens[tid]; if (!t) return;
  const r = await ifaceCheck(tid, 'Scanner (Meat Action)', null);
  const found = devList().filter(d => d.hid && !devSt(d.id).seen && sq(t, d) <= 15 && devDv(d) < r.total);
  found.forEach(d => devSet(d.id, { seen: 1 }));
  playFx({ k: 'scan', b: tid, txt: found.length ? found.length + ' SİSTEM' : 'TEMİZ', col: '#41cfd6' });
  toast(found.length ? 'Scanner ' + found.length + ' gizli sistem buldu.' : 'Scanner yeni bir sistem bulmadı.');
}
function netReady(tid) {
  const t = S.tokens[tid]; if (!t) return false;
  if (!t.net) { toast('Önce bir erişim noktasından Jack In yapmalısın.', 'err'); return false; }
  if (!t.net.pw) { toast('Önce şifreyi geçmelisin (Backdoor).', 'err'); return false; }
  return true;
}
async function netControl(tid, devId) {
  const d = devById(devId); if (!d || d.t === 'ap' || !netReady(tid)) return;
  const s = devSt(devId); if (s.ctl === tid) { toast('Bu sistem zaten senin kontrolünde.'); return; }
  if (s.dead) { toast('Bu sistem imha edilmiş.', 'err'); return; }
  if (!useNA(tid)) return;
  const dv = s.ctl && S.tokens[s.ctl] ? (+s.chk || devDv(d)) : devDv(d);
  const r = await ifaceCheck(tid, 'Control · ' + DEV_T[d.t].n, dv);
  if (r.okReal) { devSet(devId, { ctl: tid, chk: r.total }); playFx({ k: 'code', a: tid, c: devCell(d), txt: 'KONTROL', col: '#7bd88f' }); }
  else playFx({ k: 'code', a: tid, c: devCell(d), res: 'miss', txt: 'REDDEDİLDİ', col: '#ff8090' });
}
function nodeFree(devId) { const k = naKey(); if (!k) return true; if (devSt(devId).nk === k) { toast('Bir kontrol düğümü tur başına bir kez kullanılabilir.', 'err'); return false; } return true; }
// kontrol eden ya da (sistem/NPC tarafındaysa) GM işletir
function canOperate(devId, tid) {
  const s = devSt(devId);
  if (tid && s.ctl === tid && S.tokens[tid] && S.tokens[tid].net && canAct(tid)) return 'net';
  if (S.me.isGM && (!s.ctl || !S.tokens[s.ctl] || S.tokens[s.ctl].kind === 'npc')) return 'gm';
  return null;
}
async function netOperate(devId, op, tid, arg) {
  const d = devById(devId); if (!d) return;
  const how = canOperate(devId, tid); if (!how) { toast('Bu sistemi işletmek için kontrolü ele geçirmiş olmalısın.', 'err'); return; }
  if (how === 'net') { if (!nodeFree(devId) || !useNA(tid)) return; }
  const k = naKey(); const mark = how === 'net' && k ? { nk: k } : {};
  const s = devSt(devId);
  if (d.t === 'door') {
    devSet(devId, Object.assign({ st: op }, mark));
    playFx({ k: 'gear', c: devCell(d), txt: { open: 'AÇILDI', closed: 'KAPANDI', locked: 'KİLİTLENDİ' }[op], col: op === 'locked' ? '#ff4a5f' : '#7bd88f' });
  } else if (d.t === 'cam') {
    if (op === 'loop') { devSet(devId, Object.assign({ off: !s.off }, mark)); playFx({ k: 'code', c: devCell(d), txt: s.off ? 'KAMERA AÇIK' : 'DÖNGÜDE', col: '#41cfd6' }); }
    if (op === 'watch') {
      if (s.off) { toast('Kamera döngüde; önce aç.', 'err'); return; }
      devSet(devId, mark);
      playFx({ k: 'scan', c: devCell(d), txt: 'İZLENİYOR', col: '#41cfd6' });
      docSet('act', 'c' + uid(), { kind: 'camview', stage: 'gm', cam: devId, by: S.me.id || 'local', aName: tid && S.tokens[tid] ? S.tokens[tid].name : 'GM', ts: Date.now(), tg: {} });
    }
  } else if (d.t === 'tur') {
    if (op === 'toggle') { devSet(devId, Object.assign({ off: !s.off }, mark)); playFx({ k: 'gear', c: devCell(d), txt: s.off ? 'TARET AKTİF' : 'TARET KAPALI', col: s.off ? '#ff4a5f' : '#929b96' }); }
    if (op === 'fire') { devSet(devId, mark); await turretFire(devId, arg, how === 'net' ? tid : null); }
  }
}
function camSees(d, t) {
  const dist = sq(d, t); if (dist > CAM_R || dist < 1) return false;
  const ang = Math.atan2(t.y - d.y, t.x - d.x), a0 = (d.dir || 0) * Math.PI / 180; let df = Math.abs(ang - a0); if (df > Math.PI) df = 2 * Math.PI - df;
  return df <= Math.PI / 4 + 0.01 && los(d, t);
}
// GM istemcisi: kameradan görünen gizli tokenleri açığa çıkarır
async function resolveCamView(id) {
  const D = ACT.docs[id]; const d = devById(D.cam); if (!d) return docPatch('act', id, { stage: 'done', done: Date.now(), res: 'Kamera bulunamadı' });
  const seen = Object.keys(S.tokens).filter(t => S.tokens[t].hidden && camSees(d, S.tokens[t]));
  for (const t of seen) { const tk = S.tokens[t]; if (tk.charId && S.chars[tk.charId]) await setCharHidden(tk.charId, false); else await setTokHidden(t, false); }
  const vis = Object.keys(S.tokens).filter(t => !S.tokens[t].hidden && camSees(d, S.tokens[t])).map(t => S.tokens[t].name);
  await docPatch('act', id, { stage: 'done', done: Date.now(), res: seen.length ? 'Kamerada ' + seen.length + ' gizli kişi görüldü: ' + seen.map(t => S.tokens[t] ? S.tokens[t].name : '?').join(', ') : (vis.length ? 'Kamerada görünenler: ' + vis.join(', ') : 'Kamera görüş alanı boş.') });
}
// taret saldırısı: Combat Number 14 + d10, menzil DV'si; savunma ve hasar mevcut motorla
async function turretFire(devId, targetTid, byTid) {
  const d = devById(devId); const s = devSt(devId); const t = S.tokens[targetTid];
  if (!d || !t) return; if (s.off) { toast('Taret kapalı.', 'err'); return; } if (s.dead) { toast('Taret imha edilmiş.', 'err'); return; }
  if (!los(d, t)) { toast('Taretin hedefe görüş hattı yok.', 'err'); return; }
  const dist = sq(d, t) * 2; const band = bandOf(dist); const dv = RANGE_DV.ar[band];
  if (dv == null) { toast('Hedef taretin menzili dışında.', 'err'); return; }
  return lockRoll(async () => {
    const id = 'a' + uid();
    const doc = { by: S.me.id || 'local', ts: Date.now(), a: null, src: { x: d.x, y: d.y }, aName: 'Taret' + (byTid ? ' (' + S.tokens[byTid].name + ')' : ''), kind: 'ranged', aim: null, soc: null, label: 'Taret ateşi', w: TUR.w, cell: null, dvc: null, tg: { [targetTid]: { n: t.hidden ? 'Bilinmeyen' : t.name, st: 'def', dv, m: dist } }, stage: 'roll', atk: null, dmg: null, body: 0, carm: false };
    await docSet('act', id, doc);
    const tc = tokChar(t);
    const rec = await doCheck({ who: doc.aName, label: 'Taret ateşi → ' + doc.tg[targetTid].n, base: TUR.cn, mod: 0, dv: tc && effStat(tc, 'REF') < 8 ? dv : null, pre: 'Combat Number 14 →' });
    await docPatch('act', id, { atk: { total: rec.total, d: rec.d, crit: rec.crit || null }, stage: 'def' });
  });
}
async function netZap(tid, targetTid) {
  const t = S.tokens[targetTid]; if (!t || !t.net) { toast('Zap sadece aynı mimariye bağlı bir Netrunner\'a yapılabilir.', 'err'); return; }
  if (!netReady(tid) || !useNA(tid)) return;
  runAction({ kind: 'zap', actor: tid, targets: [targetTid] });
}
// hareketten sonra erişim noktasından uzaklaştıysa bağlantı kopar
function netMoved(tid) {
  const t = S.tokens[tid]; if (!t || !t.net) return;
  const ap = devById(t.net.ap); if (ap && sq(t, ap) <= 3 && los(t, ap)) return;
  netJackOut(tid, true); toast(t.name + ' erişim noktasının menzilinden çıktı; NET bağlantısı koptu ve tuttuğu sistemleri kaybetti.', 'err');
}
// yeni harita: eski durumlar ve bağlantılar temizlenir
function netResetFor(m) {
  const ids = new Set((m.dev || []).map(d => d.id));
  Object.keys(NET.st).forEach(id => { if (!ids.has(id)) { delete NET.st[id]; delDoc('dev/' + id); } });
  Object.entries(S.tokens).forEach(([tid, t]) => { if (t.net) { t.net = null; setDoc(tokPath(tid), t); } });
}

// ---- GM: cihaz yerleştirme ----
function devToolClick(cell) {
  const tm = editTarget(); if (!tm) return;
  const ex = devAt(cell.x, cell.y, tm);
  if (ex) { S.selDev = ex.id; S.sel = null; renderTokCard(); renderDevCard(); dirty(); return; }
  const t = S.devType || 'cam'; const ch = tAt(tm, cell.x, cell.y);
  if (ch === null) return;
  if (t === 'door' && ch !== '+') { toast('Güvenlik kapısı sadece kapı karosuna konur.', 'err'); return; }
  tm.dev = (tm.dev || []).concat([{ id: 'd' + uid(), t, x: cell.x, y: cell.y, dv: DEV_T[t].dv || undefined, dir: (t === 'cam' || t === 'tur') ? 0 : undefined }]);
  if (!tm.net) tm.net = { pw: 8 };
  S.selDev = tm.dev[tm.dev.length - 1].id; S.sel = null; renderTokCard(); renderDevCard(); dirty(); commitMap();
}
function devEdit(id, patch) {
  const tm = editTarget(); if (!tm || !tm.dev) return; const d = tm.dev.find(x => x.id === id); if (!d) return;
  Object.assign(d, patch); Object.keys(d).forEach(k => d[k] === undefined && delete d[k]); dirty(); renderDevCard(); commitMap();
}

// ---- çizim ----
function drawDevices(t) {
  const m = curMap(); if (!m || !m.dev) return; const v = S.view;
  m.dev.forEach(d => {
    if (!devVis(d)) return;
    const s = devSt(d.id), side = ctlSide(d.id);
    const col = s.dead ? '#636d68' : side === 'pc' ? '#41cfd6' : '#ff4a5f';
    const cx = (d.x + .5) * CS, cy = (d.y + .5) * CS, r = CS * 0.37;
    ctx.save(); if (d.hid && !s.seen) ctx.globalAlpha = 0.55;
    if (d.t === 'cam') {
      if (!s.off && !s.dead) {
        const a0 = (d.dir || 0) * Math.PI / 180; const pulse = S.anim ? 0.06 + 0.03 * Math.sin(t / 500) : 0.07;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CAM_R * CS); g.addColorStop(0, side === 'pc' ? 'rgba(65,207,214,' + (pulse * 2.4) + ')' : 'rgba(255,74,95,' + (pulse * 2.4) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, CAM_R * CS, a0 - Math.PI / 4, a0 + Math.PI / 4); ctx.closePath(); ctx.fill();
      }
      ctx.translate(cx, cy); ctx.rotate((d.dir || 0) * Math.PI / 180);
      ctx.fillStyle = '#12161a'; ctx.strokeStyle = col; ctx.lineWidth = 2 / v.s; rrect(ctx, -r, -r * 0.6, r * 1.5, r * 1.2, 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = s.off ? '#636d68' : col; ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.32, 0, 7); ctx.fill();
    } else if (d.t === 'door') {
      const st = doorState(d); const c2 = st === 'locked' ? '#ff4a5f' : st === 'open' ? '#7bd88f' : '#f2c230';
      const horiz = '#='.indexOf(tAt(m, d.x - 1, d.y)) >= 0 || '#='.indexOf(tAt(m, d.x + 1, d.y)) >= 0;
      ctx.translate(cx, cy); if (!horiz) ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = c2; ctx.lineWidth = 4 / v.s;
      if (st === 'open') { ctx.setLineDash([4 / v.s, 4 / v.s]); ctx.beginPath(); ctx.moveTo(-CS / 2, 0); ctx.lineTo(CS / 2, 0); ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.beginPath(); ctx.moveTo(-CS / 2 + 2, 0); ctx.lineTo(CS / 2 - 2, 0); ctx.stroke(); }
      ctx.rotate(horiz ? 0 : -Math.PI / 2);
      ctx.fillStyle = '#12161a'; ctx.strokeStyle = side === 'pc' ? '#41cfd6' : c2; ctx.lineWidth = 1.5 / v.s; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c2; if (st === 'locked') { ctx.fillRect(-r * 0.3, -r * 0.05, r * 0.6, r * 0.45); ctx.strokeStyle = c2; ctx.lineWidth = 1.6 / v.s; ctx.beginPath(); ctx.arc(0, -r * 0.08, r * 0.22, Math.PI, 0); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, 7); ctx.fill(); }
    } else if (d.t === 'tur') {
      ctx.translate(cx, cy);
      ctx.fillStyle = '#12161a'; ctx.strokeStyle = col; ctx.lineWidth = 2 / v.s; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, 7); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate((d.dir || 0) * Math.PI / 180); ctx.fillStyle = s.off || s.dead ? '#636d68' : col; ctx.fillRect(0, -r * 0.18, r * 1.6, r * 0.36); ctx.restore();
      ctx.fillStyle = s.off || s.dead ? '#636d68' : col; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 7); ctx.fill();
      const hp = s.hp != null ? +s.hp : TUR.hp; if (hp < TUR.hp) { ctx.fillStyle = '#2a0f14'; ctx.fillRect(-r, r * 1.25, r * 2, 3 / v.s); ctx.fillStyle = '#ff4a5f'; ctx.fillRect(-r, r * 1.25, r * 2 * Math.max(0, hp) / TUR.hp, 3 / v.s); }
      if (s.dead) { ctx.strokeStyle = '#ff4a5f'; ctx.lineWidth = 2.5 / v.s; ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, r); ctx.moveTo(r, -r); ctx.lineTo(-r, r); ctx.stroke(); }
    } else if (d.t === 'ap') {
      ctx.translate(cx, cy);
      ctx.strokeStyle = '#41cfd6'; ctx.fillStyle = '#41cfd6'; ctx.lineWidth = 1.8 / v.s;
      ctx.beginPath(); ctx.moveTo(0, r * 0.9); ctx.lineTo(0, -r * 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.18, 0, 7); ctx.fill();
      const ph = S.anim ? (t / 900) % 1 : 0.5;
      for (let i = 0; i < 2; i++) { const k = (ph + i * 0.5) % 1; ctx.globalAlpha = (d.hid && !s.seen ? 0.55 : 1) * (1 - k); ctx.beginPath(); ctx.arc(0, -r * 0.3, r * (0.45 + k * 0.9), -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke(); }
    }
    ctx.restore();
    if (S.selDev === d.id) { ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 1.5 / v.s; ctx.setLineDash([3 / v.s, 3 / v.s]); ctx.strokeRect(d.x * CS + 1, d.y * CS + 1, CS - 2, CS - 2); ctx.setLineDash([]); }
  });
  // bağlı netrunner'dan erişim noktasına veri hattı
  Object.entries(S.tokens).forEach(([tid, tk]) => {
    if (!tk.net || (tk.hidden && !S.me.isGM)) return; const ap = devById(tk.net.ap); if (!ap) return;
    const a = { x: (tk.x + .5) * CS, y: (tk.y + .5) * CS }, b = { x: (ap.x + .5) * CS, y: (ap.y + .5) * CS };
    ctx.save(); ctx.strokeStyle = 'rgba(65,207,214,.75)'; ctx.lineWidth = 1.5 / v.s; ctx.setLineDash([2 / v.s, 5 / v.s]); ctx.lineDashOffset = S.anim ? -(t / 40) : 0;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  });
  if (S.anim && m.dev.some(d => d.t === 'ap' || (d.t === 'cam' && !devSt(d.id).off))) dirty();
}

// ---- cihaz kartı ----
function renderDevCard() {
  const el = $('#devCard'); if (!el) return;
  const d = S.selDev && devById(S.selDev);
  if (!d || !devVis(d)) { el.hidden = true; return; }
  const T = DEV_T[d.t], s = devSt(d.id), gm = S.me.isGM;
  const chip = (t, cls) => '<span class="dchip ' + (cls || '') + '">' + esc(t) + '</span>';
  let h = '<div class="tc-head"><span class="dev-ico dev-' + d.t + '"></span><div><b>' + esc(T.n) + '</b><small>' + (d.t === 'ap' ? (netPw() ? 'Şifre DV' + netPw() : 'Şifresiz') : 'Kontrol DV' + devDv(d)) + (d.hid ? ' · gizli' + (s.seen ? ' (bulundu)' : '') : '') + '</small></div><button class="x" data-act="devClose" aria-label="Kapat">×</button></div>';
  h += '<p class="dev-d">' + esc(T.d) + '</p><div class="dchips">';
  if (d.t !== 'ap') h += chip('Kontrol: ' + ctlName(d.id), ctlSide(d.id));
  if (d.t === 'door') h += chip({ open: 'Açık', closed: 'Kapalı', locked: 'Kilitli' }[doorState(d)], doorState(d));
  if ((d.t === 'cam' || d.t === 'tur') && s.off) h += chip(d.t === 'cam' ? 'Döngüde' : 'Kapalı', 'off');
  if (d.t === 'tur') h += chip((s.dead ? 'İmha · ' : '') + 'HP ' + (s.hp != null ? s.hp : TUR.hp) + '/' + TUR.hp, s.dead ? 'off' : '');
  h += '</div>';
  // Netrunner eylemleri
  const tid = runnerFor();
  if (tid) {
    const tk = S.tokens[tid]; const L = naLeft(tid);
    h += '<div class="dsec"><h5>' + esc(tk.name) + ' · Interface ' + rankOf(tokChar(tk)) + ' <span class="na">' + (L.free ? 'NET ∞' : 'NET ' + L.left + '/' + L.mx) + '</span></h5><div class="tc-row">';
    if (!tk.net) {
      if (d.t === 'ap') h += apInRange(tid).some(x => x.id === d.id) ? '<button class="btn sm primary" data-act="netIn" data-d="' + d.id + '">Jack In</button>' : '<span class="hint">Jack In için 6 m içinde ve görüş hattında olmalısın.</span>';
      else h += '<span class="hint">Önce bir erişim noktasından Jack In yap.</span>';
    } else {
      if (!tk.net.pw) h += '<button class="btn sm primary" data-act="netBd">Backdoor · DV' + netPw() + '</button>';
      else if (d.t !== 'ap' && s.ctl !== tid && !s.dead) h += '<button class="btn sm primary" data-act="netCtl" data-d="' + d.id + '">Kontrolü ele geçir · DV' + (s.ctl && S.tokens[s.ctl] ? (s.chk || devDv(d)) : devDv(d)) + '</button>';
      if (s.ctl === tid) h += opsHTML(d, 'net');
      h += '<button class="btn sm" data-act="netOut" data-t="' + tid + '">Jack Out</button>';
    }
    h += '</div></div>';
  }
  // GM
  if (gm) {
    if (canOperate(d.id, null) === 'gm' && d.t !== 'ap') h += '<div class="dsec"><h5>Sistem (GM)</h5><div class="tc-row">' + opsHTML(d, 'gm') + '</div></div>';
    h += '<div class="dsec gmset"><h5>Ayarlar</h5><div class="tc-row">';
    if (d.t === 'ap') h += '<label class="mini">Şifre DV <input type="number" min="0" max="20" data-devpw value="' + netPw() + '"></label>';
    else h += '<label class="mini">Kontrol DV <input type="number" min="4" max="20" data-devdv="' + d.id + '" value="' + devDv(d) + '"></label>';
    if (d.t === 'cam' || d.t === 'tur') h += '<button class="btn sm" data-act="devRot" data-d="' + d.id + '" title="45° döndür">Döndür ↻</button>';
    h += '<button class="btn sm" data-act="devHid" data-d="' + d.id + '">' + (d.hid ? 'Görünür yap' : 'Oyunculardan gizle') + '</button>';
    if (s.ctl) h += '<button class="btn sm" data-act="devFree" data-d="' + d.id + '">Kontrolü sisteme ver</button>';
    if (d.t === 'tur') h += '<button class="btn sm" data-act="devHp" data-d="' + d.id + '" data-v="-5">HP −5</button><button class="btn sm" data-act="devHp" data-d="' + d.id + '" data-v="5">HP +5</button>';
    h += '<button class="btn sm danger" data-act="devDel" data-d="' + d.id + '">Kaldır</button></div></div>';
  }
  el.innerHTML = h; el.hidden = false;
}
function opsHTML(d, how) {
  const s = devSt(d.id); const b = (op, lab, pri) => '<button class="btn sm' + (pri ? ' primary' : '') + '" data-act="devOp" data-d="' + d.id + '" data-op="' + op + '" data-how="' + how + '">' + lab + '</button>';
  if (d.t === 'door') { const st = doorState(d); return (st !== 'open' ? b('open', 'Aç') : '') + (st !== 'closed' ? b('closed', 'Kapat') : '') + (st !== 'locked' ? b('locked', 'Kilitle', true) : ''); }
  if (d.t === 'cam') return (s.off ? '' : b('watch', 'Görüntüyü izle', true)) + b('loop', s.off ? 'Döngüyü bitir' : 'Döngüye al');
  if (d.t === 'tur') return s.dead ? '' : (s.off ? '' : b('fire', 'Ateş ettir', true)) + b('toggle', s.off ? 'Aç' : 'Kapat');
  return '';
}
const NET_ACTS = {
  devClose: () => { S.selDev = null; renderDevCard(); dirty(); },
  netIn: b => { const t = runnerFor(); if (t) netJackIn(t, b.dataset.d); },
  netOut: b => netJackOut(b.dataset.t || runnerFor()),
  netBd: () => { const t = runnerFor(); if (t) lockRoll(() => netBackdoor(t)); },
  netCtl: b => { const t = runnerFor(); if (t) lockRoll(() => netControl(t, b.dataset.d)); },
  netScan: b => { const t = b.dataset.t || runnerFor(); if (t) lockRoll(() => netScanner(t)); },
  devOp: b => {
    const id = b.dataset.d, op = b.dataset.op, how = b.dataset.how; const tid = how === 'net' ? runnerFor() : null;
    if (op === 'fire') { const d = devById(id); if (!canOperate(id, tid)) return; startTargeting({ mode: 'turret', actor: null, src: { x: d.x, y: d.y }, max: 1, label: 'Taretin hedefini seç', dev: id, by: tid }); return; }
    netOperate(id, op, tid);
  },
  devRot: b => { const d = devById(b.dataset.d); devEdit(d.id, { dir: ((d.dir || 0) + 45) % 360 }); },
  devHid: b => { const d = devById(b.dataset.d); devEdit(d.id, { hid: d.hid ? undefined : 1 }); },
  devFree: b => devSet(b.dataset.d, { ctl: null, chk: 0 }),
  devHp: b => { const s = devSt(b.dataset.d); const hp = clamp((s.hp != null ? +s.hp : TUR.hp) + (+b.dataset.v), 0, TUR.hp); devSet(b.dataset.d, { hp, dead: hp <= 0 ? 1 : 0 }); if (hp <= 0) { const d = devById(b.dataset.d); playFx({ k: 'boom', c: devCell(d), r: 1 }); } },
  devDel: b => armConfirm(b, () => { const tm = editTarget(); tm.dev = (tm.dev || []).filter(x => x.id !== b.dataset.d); delete NET.st[b.dataset.d]; delDoc('dev/' + b.dataset.d); S.selDev = null; renderDevCard(); dirty(); commitMap(); }),
  devType: b => { S.devType = b.dataset.t; document.querySelectorAll('[data-act="devType"]').forEach(x => x.classList.toggle('on', x === b)); },
};
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-devdv]')) devEdit(t.dataset.devdv, { dv: clamp(+t.value || 0, 0, 30) });
  if (t.matches('[data-devpw]')) { const tm = editTarget(); if (!tm) return; tm.net = { pw: clamp(+t.value || 0, 0, 30) }; dirty(); renderDevCard(); commitMap(); }
});
