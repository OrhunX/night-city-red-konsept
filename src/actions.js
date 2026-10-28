// ===== AKSİYON MOTORU =====
// Bir aksiyon "act/<id>" belgesidir; her istemci sadece kendi kontrol ettiği adımı yürütür:
// saldıran zarı atar → her hedefin sahibi savunur (kaçma kartı / savunma zarı) → saldıran hasarı atar → hedefin sahibi hasarı sayfaya işler.
const ACT = { docs: {}, reqs: {}, gsec: {}, busy: new Set(), prompts: {}, dismissed: new Set(), seen: new Set() };
const SOCIAL = {
  persuade: { n: 'İkna', stat: 'COOL', sk: 'Persuasion', ds: 'WILL', dsk: 'Concentration', fx: 'talk' },
  interrogate: { n: 'Sorgu', stat: 'COOL', sk: 'Interrogation', ds: 'WILL', dsk: 'Resist Torture/Drugs', fx: 'talk' },
  deceive: { n: 'Kandırma', stat: 'COOL', sk: 'Acting', ds: 'EMP', dsk: 'Human Perception', fx: 'talk' },
  pickpocket: { n: 'Yankesicilik', stat: 'TECH', sk: 'Pick Pocket', ds: 'INT', dsk: 'Perception', fx: 'gear', reach: 1 },
  facedown: { n: 'Yüzleşme', stat: 'COOL', sk: null, ds: 'COOL', dsk: null, rep: true, fx: 'talk' },
};
const DMG_KINDS = ['ranged', 'auto', 'shell', 'blast', 'melee', 'brawl', 'martial', 'zap', 'ram'];
// ---- LUCK: zar atılmadan önce seçilir, o zara eklenir ve havuzdan düşer ----
const LUCKSEL = {};
function luckPool(c) { return c.luck == null ? (+c.stats.LUCK || 0) : Math.max(0, +c.luck || 0); }
function luckStepHTML(cid) {
  const c = S.chars[cid]; if (!c || !canEditChar(c)) return '';
  const pool = luckPool(c); const n = Math.min(LUCKSEL[cid] || 0, pool);
  return '<span class="lk" data-lkc="' + esc(cid) + '"><span class="lk-l">LUCK</span><button type="button" data-lk="-1" aria-label="LUCK azalt"' + (n ? '' : ' disabled') + '>−</button><b>' + n + '</b><button type="button" data-lk="1" aria-label="LUCK artır"' + (n < pool ? '' : ' disabled') + '>+</button><small>havuz ' + pool + '</small></span>';
}
function takeLuck(cid) {
  const c = S.chars[cid]; if (!c) return 0;
  const n = Math.min(LUCKSEL[cid] || 0, luckPool(c)); LUCKSEL[cid] = 0;
  if (!n) return 0; c.luck = luckPool(c) - n; S.why = 'LUCK harcandı (' + n + ')'; saveCharNow(cid); renderChars(); return n;
}
function withLuck(cid, mod, notes) { const n = takeLuck(cid); if (n) { notes.push('LUCK +' + n); } return mod + n; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lk]'); if (!b) return; e.stopPropagation();
  const w = b.closest('[data-lkc]'); const cid = w.dataset.lkc; const c = S.chars[cid]; if (!c) return;
  LUCKSEL[cid] = clamp((LUCKSEL[cid] || 0) + (+b.dataset.lk), 0, luckPool(c));
  document.querySelectorAll('[data-lkc="' + CSS.escape(cid) + '"]').forEach(el => { el.outerHTML = luckStepHTML(cid); });
  if (ACT.cardsEl) ACT.cardsEl._h = null;
}, true);
const ATK_KINDS = ['ranged', 'auto', 'supp', 'shell', 'blast', 'melee', 'brawl', 'martial', 'grab'];
function deepMerge(t, p) { for (const k in p) { if (p[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; deepMerge(t[k], p[k]); } else t[k] = p[k]; } return t; }
async function docSet(col, id, data) { if (col === 'act') S.lastActTs = Date.now(); if (!db) { (col === 'act' ? ACT.docs : ACT.reqs)[id] = clone(data); pumpSoon(); renderCards(); return; } try { await db.doc(col + '/' + id).set(data); } catch (e) { writeErr(e); } }
async function docPatch(col, id, patch) {
  const store = col === 'act' ? ACT.docs : ACT.reqs;
  if (store[id]) deepMerge(store[id], clone(patch));
  if (!db) { pumpSoon(); renderCards(); return; }
  try { await db.doc(col + '/' + id).update(patch); } catch (e) { console.warn('patch', e); }
}
async function docDel(col, id) { const store = col === 'act' ? ACT.docs : ACT.reqs; delete store[id]; if (!db) { renderCards(); return; } try { await db.doc(col + '/' + id).delete(); } catch (e) { } }
function subscribeActs() {
  const warn = e => console.warn('act', e);
  db.collection('act').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = clone(d.data())); ACT.docs = o; pumpSoon(); renderCards(); }, warn);
  db.collection('req').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = clone(d.data())); ACT.reqs = o; pumpSoon(); renderCards(); }, warn);
  if (S.me.isGM) db.collection('gmsecret').onSnapshot(q => { q.docs.forEach(d => ACT.gsec[d.id] = d.data()); pumpSoon(); renderCards(); }, warn);
  db.doc('table/grapple').onSnapshot(s => { FX.pairs = s.exists ? (s.data().pairs || {}) : {}; dirty(); renderTokCard(); }, warn);
}
// kim çözer: oyuncu kendi karakterini, GM NPC'leri ve sahibi masada olmayanları
function ownerOf(tid) { const t = S.tokens[tid]; if (!t) return null; const c = tokChar(t); return t.kind === 'npc' ? null : (t.owner || (c && c.owner) || null); }
function online(uidv) { return !room || S.peers.some(p => p.by === uidv); }
function ctrlIsMe(tid, doc) {
  const o = ownerOf(tid);
  if (!o) return S.me.isGM;
  if (o === S.me.id) return !(doc && doc.tg && doc.tg[tid] && doc.tg[tid].force);
  if (S.me.isGM) return !online(o) || !!(doc && doc.tg && doc.tg[tid] && doc.tg[tid].force);
  return false;
}
const canAct = tid => { const t = S.tokens[tid]; return !!t && (S.me.isGM || (!!t.owner && t.owner === S.me.id)); };
const sq = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function bandOf(m) { let b = BANDS.findIndex(x => m <= x); return b < 0 ? BANDS.length - 1 : b; }
// görüş hattı ve siper
function lineCells(a, b) { const out = []; let x0 = a.x, y0 = a.y; const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0), sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1; let err = dx + dy; while (!(x0 === b.x && y0 === b.y)) { const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } if (!(x0 === b.x && y0 === b.y)) out.push({ x: x0, y: y0 }); } return out; }
function los(a, b) { const m = S.map || curMap(); return lineCells(a, b).every(c => '#KL'.indexOf(tAt(m, c.x, c.y)) < 0 && !doorBlocksLos(c.x, c.y)); }
function inCover(a, b) { const m = S.map || curMap(); return lineCells(a, b).some(c => COVER[tAt(m, c.x, c.y)]); }

// ---- menü ----
function openActionMenuAt(tid, cx, cy) {
  if (S.targeting) return;
  const tk = S.tokens[tid]; if (!tk) return;
  let actor = null, target = null;
  if (S.sel && S.sel !== tid && canAct(S.sel)) { actor = S.sel; target = tid; }
  else if (canAct(tid)) { actor = tid; }
  else if (S.me.isGM) { target = tid; }
  else { toast('Önce kendi tokenini seç, sonra hedefe sağ tıkla.', 'err'); return; }
  showMenu(actor, target, cx, cy);
}
function showMenu(actor, target, cx, cy) {
  const el = $('#actMenu'); const a = actor && S.tokens[actor]; const c = a && tokChar(a);
  let h = '<div class="am-head"><b>' + esc(a ? a.name : 'GM') + '</b>' + (target ? ' → <b>' + esc(S.tokens[target].name) + '</b>' : '') + '<button class="x" data-am="close" aria-label="Kapat">×</button></div>';
  if (a && !c) h += '<p class="hint">Bu tokenin karakter sayfası yok.</p>';
  if (actor && turnOn()) { const [ok, why] = mayAct(actor, 'act'); if (!ok) h += '<p class="am-lock">' + esc(why) + ' Menüyü inceleyebilirsin ama aksiyon alamazsın.</p>'; }
  if (c && luckPool(c)) h += '<div class="am-luck">' + luckStepHTML(a.charId) + '<small>Seçtiğin aksiyonun zarına eklenir.</small></div>';
  if (c) {
    const it = (k, lab, sub, extra) => '<button class="am-it" data-am="' + k + '"' + (extra || '') + '><span>' + esc(lab) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>';
    let atk = '';
    (c.weapons || []).forEach((w, i) => {
      const info = WEAPON[w.n] || {}; const cls = w.cls || info.cls || 'pistol'; const af = w.af != null ? w.af : (info.af || 0); const rof = w.rof || info.rof || 1;
      const di = ' data-w="' + i + '"';
      if (cls === 'melee') {
        atk += it('melee', w.n, 'DEX + ' + w.sk + ' · ' + w.d + ' · yarım zırh', di);
        if (rof >= 2) atk += it('melee2', 'İki vuruş · ' + w.n, 'ROF 2: iki ayrı saldırı', di);
        atk += it('melee-h', 'Nişanlı · kafa', '−8, geçen hasar ×2', di);
      } else if (cls === 'gl' || cls === 'rocket') {
        atk += it('blast', w.n + ' · patlama', '5×5 kare alan · ' + w.d, di);
      } else {
        atk += it('ranged', 'Ateş · ' + w.n, 'REF + ' + w.sk + ' · ' + w.d, di);
        if (rof >= 2) atk += it('ranged2', 'İki atış · ' + w.n, 'ROF 2: aynı ya da iki hedef', di);
        atk += '<div class="am-row">' + it('aim-h', 'Kafa', '−8 · ×2', di) + it('aim-l', 'Bacak', '−8 · kırık bacak', di) + it('aim-i', 'Eldeki', '−8 · düşürür', di) + '</div>';
        if (af) atk += it('auto', 'Otomatik atış · ' + w.n, '2d6 × fark, en çok ×' + af, di) + it('supp', 'Bastırma ateşi', '25 m, siper dışındakiler', di);
        if (cls === 'shotgun') atk += it('shell', 'Saçma · ' + w.n, 'DV13 · 6 m önündeki herkese 3d6', di);
      }
    });
    h += '<div class="am-sec"><h5>Silahlar</h5>' + (atk || '<p class="hint">Silah yok.</p>') + '</div>';
    if ((c.cyber || []).some(x => /sandevistan/i.test(x.n || ''))) h += '<div class="am-sec"><h5>Cyberware</h5>' + it('sande', sandeActive(c) ? 'Sandevistan etkin' : 'Sandevistan\'ı etkinleştir', sandeActive(c) ? 'inisiyatife +3 (1 dakika)' : 'Aksiyon · bir dakika inisiyatife +3, sonra 1 saat bekleme') + '</div>';
    h += roleMenuHTML(actor, target, c, it);
    h += '<div class="am-sec"><h5>Yakın dövüş</h5>' + it('brawl', 'Yumruk', 'DEX + Brawling · ' + brawlDice(+c.stats.BODY || 0, hasCyberarm(c))) + it('grab', 'Boğuşma', 'DEX + Brawling, karşıt') + ((+(c.skills || {})['Martial Arts'] || 0) ? it('martial', 'Dövüş sanatları', 'yarım zırh') : '') + '</div>';
    h += '<div class="am-sec"><h5>Beceriler</h5>' + Object.keys(SOCIAL).map(k => { const s = SOCIAL[k]; return it('soc-' + k, s.n, s.stat + (s.sk ? ' + ' + s.sk : ' + itibar') + ' ↔ ' + s.ds + (s.dsk ? ' + ' + s.dsk : ' + itibar')); }).join('') + '</div>';
    let sup = it('heal', 'Stabilize et', 'TECH + First Aid / Paramedic');
    const tc = target && tokChar(S.tokens[target]);
    if (tc) normInj(tc).forEach(x => { const s = INJ[injKey(x)]; if (!s) return; const st = x.st || 'active';
      if (st === 'active' && s.qf) sup += it('qf', 'Hızlı müdahale · ' + s.n, s.qf.map(q => q[0] + ' DV' + q[1]).join(' / ') + (s.perm ? ' · kalıcı' : ' · bugün'), ' data-inj="' + esc(x.id) + '"');
      if ((st === 'active' || st === 'qf') && s.tr && target !== actor) sup += it('treat', 'Tedavi · ' + s.n, s.tr.map(q => q[0] + ' DV' + q[1]).join(' / ') + ' · 4 saat', ' data-inj="' + esc(x.id) + '"'); });
    h += '<div class="am-sec"><h5>Destek</h5>' + sup + '</div>';
  }
  if (S.me.isGM) h += '<div class="am-sec"><h5>GM</h5><button class="am-it" data-am="req"><span>Kontrol iste</span><small>Oyuncudan zar iste, DV gizli</small></button></div>';
  el.innerHTML = h; el.hidden = false;
  el.dataset.actor = actor || ''; el.dataset.target = target || '';
  const r = wrap.getBoundingClientRect(); const w = Math.min(300, r.width - 20);
  el.style.width = w + 'px';
  const x = clamp((cx || r.left + r.width / 2) - r.left + 10, 8, r.width - w - 8);
  el.style.left = x + 'px'; el.style.top = '56px'; el.style.maxHeight = (r.height - 70) + 'px';
}
function hideMenu() { $('#actMenu').hidden = true; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-am]'); if (!b) return;
  const el = $('#actMenu'); const k = b.dataset.am; const actor = el.dataset.actor || null, target = el.dataset.target || null; const wi = b.dataset.w != null ? +b.dataset.w : null;
  hideMenu();
  if (k === 'close') return;
  if (k === 'qf' || k === 'treat') { runAction({ kind: k, actor, targets: [target], inj: b.dataset.inj }); return; }
  if (actor && roleMenuPick(k, actor, target, b)) return;
  menuPick(k, actor, target, wi);
});
function menuPick(k, actor, target, wi) {
  if (k === 'req') { startTargeting({ mode: 'req', actor: null, picks: target ? [target] : (S.sel ? [S.sel] : []), max: 20, label: 'Kontrol istenecek tokenleri seç' }); return; }
  const a = S.tokens[actor]; const c = tokChar(a); if (!c) return;
  const w = wi != null ? c.weapons[wi] : null;
  const base = { actor, wi, w };
  const one = (kind, extra) => { if (target) runAction(Object.assign({ kind, targets: [target] }, base, extra)); else startTargeting({ mode: 'act', actor, max: 1, label: 'Hedefi seç', act: Object.assign({ kind }, base, extra) }); };
  if (k === 'ranged') one('ranged');
  else if (k === 'ranged2' || k === 'melee2') startTargeting({ mode: 'act', actor, max: 2, picks: target ? [target] : [], label: 'İki hedef seç (tek hedef seçersen iki atış ona gider)', act: Object.assign({ kind: k === 'ranged2' ? 'ranged' : 'melee', twice: true }, base) });
  else if (k === 'aim-h' || k === 'aim-l' || k === 'aim-i') one('ranged', { aim: k.slice(4) });
  else if (k === 'melee') one('melee');
  else if (k === 'melee-h') one('melee', { aim: 'h' });
  else if (k === 'auto') one('auto');
  else if (k === 'brawl') one('brawl');
  else if (k === 'martial') one('martial');
  else if (k === 'grab') one('grab');
  else if (k === 'heal') one('heal');
  else if (k.startsWith('soc-')) one('opp', { soc: k.slice(4) });
  else if (k === 'supp') {
    const picks = Object.keys(S.tokens).filter(id => id !== actor && !(S.tokens[id].hidden && !S.me.isGM) && sq(S.tokens[id], a) * 2 <= 25 && los(a, S.tokens[id]) && !inCover(a, S.tokens[id]));
    startTargeting({ mode: 'act', actor, max: 30, picks, label: 'Bastırma ateşi: 25 m içinde görüş hattında ve siper dışındakiler seçildi', act: Object.assign({ kind: 'supp' }, base) });
  }
  else if (k === 'blast') startTargeting({ mode: 'act', actor, area: 'blast', max: 30, label: 'Patlamanın merkezini seç (5×5 kare)', act: Object.assign({ kind: 'blast' }, base) });
  else if (k === 'shell') startTargeting({ mode: 'act', actor, area: 'shell', max: 30, label: 'Ateş yönünü seç: önündeki 6 m (3 kare)', act: Object.assign({ kind: 'shell' }, base) });
}

// ---- hedefleme modu ----
function startTargeting(o) {
  S.targeting = Object.assign({ picks: [] }, o); S.targeting.picks = (o.picks || []).slice();
  renderTgtBar(); dirty();
}
function endTargeting() { S.targeting = null; $('#tgtBar').hidden = true; dirty(); }
function renderTgtBar() {
  const T = S.targeting, el = $('#tgtBar'); if (!T) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = '<span>' + esc(T.label) + (T.area ? '' : ' · <b>' + T.picks.length + '</b> seçili') + '</span>' + (T.area && !T.cell ? '' : '<button class="btn sm primary" data-tg="ok"' + (T.picks.length || T.cell ? '' : ' disabled') + '>Onayla</button>') + '<button class="btn sm" data-tg="no">Vazgeç</button>';
}
function areaPicks(T, cell) {
  const a = T.actor && S.tokens[T.actor];
  return Object.keys(S.tokens).filter(id => {
    if (id === T.actor) return false; const t = S.tokens[id]; if (t.hidden && !S.me.isGM) return false;
    if (T.area === 'blast') return Math.abs(t.x - cell.x) <= 2 && Math.abs(t.y - cell.y) <= 2;
    if (T.area === 'shell' && a) { if (sq(a, t) > 3 || sq(a, t) < 1) return false; const ang = Math.atan2(cell.y - a.y, cell.x - a.x), at = Math.atan2(t.y - a.y, t.x - a.x); let d = Math.abs(ang - at); if (d > Math.PI) d = 2 * Math.PI - d; return d <= Math.PI / 4 + 0.01 && los(a, t); }
    return false;
  });
}
function targetClick(cell) {
  const T = S.targeting; if (!T) return;
  if (T.area) { T.cell = cell; T.picks = areaPicks(T, cell); renderTgtBar(); dirty(); return; }
  const id = tokenAt(cell); if (!id || id === T.actor) return;
  const i = T.picks.indexOf(id);
  if (i >= 0) T.picks.splice(i, 1); else { if (T.picks.length >= T.max) T.picks.shift(); T.picks.push(id); }
  renderTgtBar(); dirty();
  if (T.max === 1 && T.picks.length === 1) confirmTargeting();
}
function drawTargeting(t) {
  const T = S.targeting; if (!T) return;
  const h = T.cell || S.hover; if (!h) return;
  ctx.save();
  if (T.area === 'blast') { ctx.fillStyle = 'rgba(255,74,95,.16)'; ctx.strokeStyle = '#ff4a5f'; ctx.lineWidth = 2 / S.view.s; ctx.setLineDash([6 / S.view.s, 4 / S.view.s]); ctx.fillRect((h.x - 2) * CS, (h.y - 2) * CS, 5 * CS, 5 * CS); ctx.strokeRect((h.x - 2) * CS, (h.y - 2) * CS, 5 * CS, 5 * CS); }
  else if (T.area === 'shell' && T.actor && S.tokens[T.actor]) { const a = S.tokens[T.actor]; const ax = (a.x + .5) * CS, ay = (a.y + .5) * CS, ang = Math.atan2(h.y - a.y, h.x - a.x); ctx.fillStyle = 'rgba(255,74,95,.16)'; ctx.strokeStyle = '#ff4a5f'; ctx.lineWidth = 2 / S.view.s; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.arc(ax, ay, CS * 3.5, ang - Math.PI / 4, ang + Math.PI / 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (T.src || (T.actor && S.tokens[T.actor])) { const a = T.src || S.tokens[T.actor]; T.picks.forEach(id => { const b = S.tokens[id]; if (!b) return; ctx.strokeStyle = 'rgba(255,74,95,.6)'; ctx.lineWidth = 1.5 / S.view.s; ctx.setLineDash([5 / S.view.s, 4 / S.view.s]); ctx.beginPath(); ctx.moveTo((a.x + .5) * CS, (a.y + .5) * CS); ctx.lineTo((b.x + .5) * CS, (b.y + .5) * CS); ctx.stroke(); }); }
  ctx.restore();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-tg]'); if (!b) return; if (b.dataset.tg === 'ok') confirmTargeting(); else endTargeting(); });
function confirmTargeting() {
  const T = S.targeting; if (!T) return;
  const picks = T.picks.slice(); endTargeting();
  if (T.mode === 'req') { if (!picks.length) return; openReqForm(picks); return; }
  if (T.mode === 'zap') { if (picks[0]) netZap(T.actor, picks[0]); return; }
  if (T.mode === 'turret') { if (picks[0]) netOperate(T.dev, 'fire', T.by, picks[0]); return; }
  if (!picks.length && T.area !== 'blast') { toast('Alanda hedef yok.', 'err'); if (T.area !== 'blast') return; }
  const A = Object.assign({}, T.act, { targets: picks, cell: T.cell || null });
  if (A.twice) { if (A.actor && !gateAct(A.actor, 'act')) return; const list = picks.length === 1 ? [picks[0], picks[0]] : picks.slice(0, 2); lockRoll(async () => { const t0 = Date.now(); for (const p of list) await runActionInner(Object.assign({}, A, { targets: [p], twice: false })); if ((S.lastActTs || 0) >= t0) useAct(A.actor, 'act'); }); return; }
  runAction(A);
}

// ---- başlatma: saldıranın istemcisi ----
function runAction(A) {
  if (A.kind === 'zap') return lockRoll(() => runActionInner(A));
  if (A.actor && !gateAct(A.actor, 'act')) return;
  return lockRoll(async () => { const t0 = Date.now(); await runActionInner(A); if ((S.lastActTs || 0) >= t0) useAct(A.actor, 'act'); });
}
async function runActionInner(A) {
  const a = S.tokens[A.actor], c = tokChar(a); if (!a || !c) return;
  const w = A.w; const info = w ? (WEAPON[w.n] || {}) : {}; const cls = w ? (w.cls || info.cls || 'pistol') : null;
  const m = S.map || curMap();
  if (A.kind === 'ram') {
    const t0 = S.tokens[A.targets[0]]; if (!a.veh) { toast('Çarpmak için araçta olmalısın.', 'err'); return; }
    if (!t0 || sq(a, t0) > 1) { toast('Çarpmak için aracı hedefin yanına sür.', 'err'); return; }
    await docSet('act', 'a' + uid(), { by: S.me.id || 'local', ts: Date.now(), a: A.actor, aName: a.name, kind: 'ram', label: 'Çarpma · ' + a.veh.n, w: { n: a.veh.n, d: '6d6', cls: 'veh' }, tg: { [A.targets[0]]: { n: t0.hidden ? 'Bilinmeyen' : t0.name, st: 'def', dv: RAM_DV } }, stage: 'def', atk: { total: RAM_DV, d: 0 }, dmg: null, body: +c.stats.BODY || 0, carm: false });
    playFx({ k: 'text', b: A.actor, txt: 'GAZ!', col: '#f2a43a' });
    return;
  }
  // erişim kontrolü
  const reach = ['melee', 'brawl', 'martial', 'grab', 'heal', 'jury'].indexOf(A.kind) >= 0 || (A.kind === 'opp' && SOCIAL[A.soc].reach);
  if (reach && A.targets.some(t => sq(a, S.tokens[t]) > 1)) { toast('Hedef erişim dışında: yan yana (2 m) olmalısınız.', 'err'); return; }
  const tg = {};
  let dvc = null;
  if (A.kind === 'blast') { const band = bandOf(sq(a, A.cell) * 2); dvc = RANGE_DV[cls][band]; if (dvc == null) { toast('Merkez bu silahın menzili dışında.', 'err'); return; } }
  A.targets.forEach(tid => {
    const t = S.tokens[tid]; const e = { n: t.hidden ? 'Bilinmeyen' : t.name, st: 'def' };
    const dist = sq(a, t) * 2;
    if (A.kind === 'ranged') { const dv = RANGE_DV[cls] ? RANGE_DV[cls][bandOf(dist)] : null; if (dv == null) { e.st = 'miss'; e.res = 'Menzil dışında'; } else e.dv = dv + 0; e.m = dist; }
    if (A.kind === 'auto') { const b = bandOf(dist); const dv = AF_DV[cls] && b < 5 ? AF_DV[cls][b] : null; if (dv == null) { e.st = 'miss'; e.res = 'Otomatik atış menzili dışında'; } else e.dv = dv; e.m = dist; }
    if (A.kind === 'shell') e.dv = 13;
    if (A.kind === 'blast') e.dv = dvc;
    tg[tid] = e;
  });
  // saldırı zarı
  const ctxK = { ranged: 'ranged', auto: 'ranged', supp: 'ranged', shell: 'ranged', blast: 'ranged', melee: 'melee', brawl: 'melee', martial: 'melee', grab: 'melee', heal: 'hand', qf: 'hand', treat: 'hand', jury: 'hand' }[A.kind] || (A.kind === 'opp' ? (A.soc === 'pickpocket' ? 'hand' : 'speech') : null);
  const blk = injBlock(c, ctxK, cls); if (blk) { toast(blk, 'err'); return; }
  const am = autoMods(c, ctxK); let stat, sk, label, mod = am.mod;
  const sname = n => n;
  if (A.kind === 'ranged') { stat = 'REF'; sk = w.sk; label = (A.aim ? 'Nişanlı ' + ({ h: 'kafa', l: 'bacak', i: 'eldeki' }[A.aim]) + ' · ' : 'Ateş · ') + w.n; if (A.aim) mod -= 8; }
  else if (A.kind === 'auto') { stat = 'REF'; sk = 'Autofire'; label = 'Otomatik atış · ' + w.n; }
  else if (A.kind === 'supp') { stat = 'REF'; sk = 'Autofire'; label = 'Bastırma ateşi · ' + w.n; }
  else if (A.kind === 'shell') { stat = 'REF'; sk = 'Shoulder Arms'; label = 'Saçma · ' + w.n; }
  else if (A.kind === 'blast') { stat = 'REF'; sk = w.sk; label = 'Patlayıcı · ' + w.n; }
  else if (A.kind === 'melee') { stat = 'DEX'; sk = w.sk || 'Melee Weapon'; label = (A.aim ? 'Nişanlı kafa · ' : 'Saldırı · ') + w.n; if (A.aim) mod -= 8; }
  else if (A.kind === 'brawl') { stat = 'DEX'; sk = 'Brawling'; label = 'Yumruk'; }
  else if (A.kind === 'martial') { stat = 'DEX'; sk = 'Martial Arts'; label = 'Dövüş sanatları'; }
  else if (A.kind === 'grab') { stat = 'DEX'; sk = 'Brawling'; label = 'Boğuşma'; }
  else if (A.kind === 'heal') { stat = 'TECH'; sk = (+(c.skills || {}).Paramedic || 0) > (+(c.skills || {})['First Aid'] || 0) ? 'Paramedic' : 'First Aid'; label = 'Stabilize'; }
  else if (A.kind === 'opp') { const so = SOCIAL[A.soc]; stat = so.stat; sk = so.sk; label = so.n; }
  else if (A.kind === 'zap') { stat = null; sk = null; label = 'Zap'; }
  else if (A.kind === 'jury') { stat = 'TECH'; sk = 'Basic Tech'; label = 'Saha tamiri · zırh'; const fe = fieldExp(c); if (fe) { mod += fe; am.notes.push('Field Expertise +' + fe); } }
  else if (A.kind === 'qf' || A.kind === 'treat') {
    const tc0 = tokChar(S.tokens[A.targets[0]]); const x = tc0 && (tc0.crits || []).find(y => y.id === A.inj); const spec = x && INJ[injKey(x)];
    if (!spec) { toast('Yara bulunamadı.', 'err'); return; }
    const best = bestHeal(c, A.kind === 'qf' ? spec.qf : spec.tr); if (!best) { toast('Bu yara için gereken beceri yok' + ((A.kind === 'qf' ? spec.qf : spec.tr) || []).map(q => q[0]).join(' / ').replace(/^/, ': ') + '. Surgery sadece Medtech\'in Medicine yeteneğiyle gelir.', 'err'); return; }
    stat = 'TECH'; sk = best.sk; label = (A.kind === 'qf' ? 'Hızlı müdahale · ' : 'Tedavi · ') + spec.n; A.dv = best.dv;
    tg[A.targets[0]].dv = best.dv; tg[A.targets[0]].inj = A.inj;
  }
  const lvl = sk ? (+(c.skills || {})[sk] || 0) : (A.kind === 'opp' && SOCIAL[A.soc].rep ? (+c.rep || 0) : 0);
  const reach2 = (A.kind === 'qf' || A.kind === 'treat'); if (reach2 && A.targets.some(t => sq(a, S.tokens[t]) > 1)) { toast('Hedef erişim dışında: yan yana olmalısınız.', 'err'); return; }
  const base = A.kind === 'zap' ? rankOf(c) : effStat(c, stat) + lvl;
  const single = A.targets.length === 1 ? tg[A.targets[0]] : null;
  const dvShow = (A.kind === 'ranged' || A.kind === 'auto' || A.kind === 'shell' || A.kind === 'blast') ? (A.kind === 'blast' ? dvc : single && single.dv) : null;
  const tgtName = A.targets.length === 1 ? tg[A.targets[0]].n : A.targets.length + ' hedef';
  const id = 'a' + uid();
  const doc = { inj: A.inj || null, by: S.me.id || 'local', ts: Date.now(), a: A.actor, aName: a.hidden ? 'Bilinmeyen' : a.name, kind: A.kind, aim: A.aim || null, soc: A.soc || null, label, w: w ? { n: w.n, d: w.d, cls, af: w.af != null ? w.af : (info.af || 0) } : null, cell: A.cell || null, dvc, tg, stage: 'roll', atk: null, dmg: null, body: +c.stats.BODY || 0, carm: hasCyberarm(c) };
  if (A.kind === 'blast' && !A.targets.length) doc.tg = {};
  await docSet('act', id, doc);
  const tc = single && A.targets.length === 1 ? tokChar(S.tokens[A.targets[0]]) : null;
  const known = (A.kind === 'ranged' || A.kind === 'auto') && single && single.dv && tc && (effStat(tc, 'REF') < 8 || injEff(tc).noDodge) ? single.dv : (A.kind === 'blast' ? dvc : A.kind === 'shell' ? 13 : (A.kind === 'qf' || A.kind === 'treat') ? A.dv : (A.kind === 'jury' && tc && ARMOR_DV[tc.armor]) ? ARMOR_DV[tc.armor] : null);
  const lnotes = []; mod = withLuck(a.charId, mod, lnotes); am.notes.push(...lnotes);
  const rec = await doCheck({ who: charLabel(c), label: label + ' → ' + tgtName, base, mod, dv: known, notes: am.notes.concat(A.aim ? ['nişanlı −8'] : []), noFumble: caFr(c) && ATK_KINDS.indexOf(A.kind) >= 0, pre: A.kind === 'zap' ? 'Interface ' + rankOf(c) + ' →' : stat + ' ' + effStat(c, stat) + ' + ' + (sk || 'itibar') + ' ' + lvl + ' →' });
  await docPatch('act', id, { atk: { total: rec.total, d: rec.d, crit: rec.crit || null }, stage: 'def' });
  if (A.kind === 'blast') { if (rec.total <= dvc) { playFx({ k: 'rocket', a: A.actor, c: A.cell, res: 'miss', r: 2.5, txt: 'SAPTI', col: '#e7e3d8' }); toast('Patlayıcı hedefi tutturamadı; GM düştüğü yeri belirler.'); } else playFx({ k: 'rocket', a: A.actor, c: A.cell, r: 2.5 }); }
  if (A.kind === 'shell') playFx({ k: 'shell', a: A.actor, c: A.cell, res: rec.total > 13 ? 'hit' : 'miss' });
}

// ---- pompa: kendi sorumluluğundaki adımları yürütür ----
let pumpT = null;
function pumpSoon() { clearTimeout(pumpT); pumpT = setTimeout(pump, 60); }
setInterval(() => { pump(); renderCards(); }, 3000);
function pump() {
  for (const [id, d] of Object.entries(ACT.docs)) {
    if (!d || !d.tg) continue;
    const tids = Object.keys(d.tg);
    if (d.stage === 'def' && d.atk) {
      tids.forEach(tid => { const e = d.tg[tid]; const key = id + ':def:' + tid; if (e.st === 'def' && !ACT.busy.has(key) && S.tokens[tid] && ctrlIsMe(tid, d)) { ACT.busy.add(key); resolveDefense(id, tid).catch(err => console.warn(err)).finally(() => ACT.busy.delete(key)); } });
      const allRes = tids.every(t => d.tg[t].st !== 'def');
      const mine = d.by === S.me.id || (!db) || (S.me.isGM && !online(d.by));
      if (allRes && mine) {
        const hits = tids.filter(t => d.tg[t].st === 'hit');
        const key = id + ':dmg';
        if (DMG_KINDS.indexOf(d.kind) >= 0 && hits.length && !d.dmg && !ACT.busy.has(key)) { ACT.busy.add(key); rollActDamage(id).catch(err => console.warn(err)).finally(() => ACT.busy.delete(key)); }
        else if ((DMG_KINDS.indexOf(d.kind) < 0 || !hits.length) && !ACT.busy.has(key)) { ACT.busy.add(key); docPatch('act', id, { stage: 'done', done: Date.now() }).finally(() => ACT.busy.delete(key)); }
      }
    }
    if (d.dmg && d.stage !== 'done') {
      tids.forEach(tid => { const e = d.tg[tid]; const key = id + ':apply:' + tid; if (e.st === 'hit' && !ACT.busy.has(key) && S.tokens[tid] && ctrlIsMe(tid, d)) { ACT.busy.add(key); applyHit(id, tid).catch(err => console.warn(err)).finally(() => ACT.busy.delete(key)); } });
      const all = tids.every(t => d.tg[t].st === 'done' || d.tg[t].st === 'miss');
      if (all && (d.by === S.me.id || !db)) docPatch('act', id, { stage: 'done', done: Date.now() });
    }
    if (d.kind === 'camview') {
      if (d.stage === 'gm' && S.me.isGM && !ACT.busy.has(id + ':cam')) { ACT.busy.add(id + ':cam'); resolveCamView(id).catch(err => console.warn(err)).finally(() => ACT.busy.delete(id + ':cam')); }
      if (d.stage === 'done' && (d.by === S.me.id || !db) && !ACT.dismissed.has('cam' + id)) { ACT.dismissed.add('cam' + id); toast(d.res || 'Kamera görüntüsü alındı.'); }
    }
    // temizlik
    if (S.me.isGM && ((d.stage === 'done' && Date.now() - (d.done || d.ts) > 120000) || Date.now() - d.ts > 30 * 60000)) docDel('act', id);
  }
  pumpReqs();
}
function waitPrompt(key, card) {
  return new Promise(res => { ACT.prompts[key] = Object.assign(card, { resolve: v => { delete ACT.prompts[key]; renderCards(); res(v); } }); renderCards(); Sound.play('ping'); });
}
async function resolveDefense(id, tid) {
  const d = ACT.docs[id]; const e = d.tg[tid]; const t = S.tokens[tid]; const c = tokChar(t);
  const atk = d.atk.total; const kind = d.kind; let D = null, dodged = false, hit = false, res = '', mult = null;
  const who = c ? charLabel(c) : t.name;
  const fxFor = (r, extra) => fxAttack(d, tid, r, extra);
  if (['ranged', 'auto', 'shell', 'blast'].indexOf(kind) >= 0) {
    const canDodge = c && effStat(c, 'REF') >= 8 && kind !== 'supp' && !injEff(c).noDodge;
    let dodge = false;
    if (canDodge) {
      const verb = { ranged: 'ateş ediyor', auto: 'otomatik ateş açıyor', shell: 'saçma sıkıyor', blast: 'patlayıcı fırlatıyor' }[kind];
      dodge = await waitPrompt(id + tid, { kind: 'dodge', title: d.aName + ' ' + who + '\'e ' + verb, body: (d.w ? d.w.n + ' · ' : '') + (kind === 'blast' || kind === 'shell' ? 'Kaçmak için saldırı toplamını (' + atk + ') geçmelisin.' : 'Kaçmazsan menzil DV\'si ' + e.dv + ' kullanılır.') + ' REF\'in 8 veya üstü olduğu için kaçmayı deneyebilirsin.', btns: [['yes', 'Kaç · DEX + Evasion + d10', 'primary'], ['no', 'Kaçma']], id, tid });
      if (dodge === null || !stillMine(id, tid)) return;
    }
    if (dodge) { const am = autoMods(c, null); am.mod = withLuck(t.charId, am.mod, am.notes); const r = await doCheck({ who, label: 'Kaçma', base: effStat(c, 'DEX') + (+(c.skills || {}).Evasion || 0), mod: am.mod, notes: am.notes, pre: 'DEX + Evasion →' }); D = r.total; dodged = true; }
    if (kind === 'ranged' || kind === 'auto') { const need = dodged ? D : e.dv; hit = atk > need; if (kind === 'auto' && hit) mult = Math.min(atk - need, d.w.af || 3); res = hit ? '' : (dodged ? 'Kaçtı' : 'Iska'); }
    else { const center = atk > e.dv; hit = center && !(dodged && D > atk); res = !center ? 'Iska' : (!hit ? 'Kaçtı' : ''); }
    fxFor(hit ? 'hit' : (dodged ? 'dodge' : 'miss'));
  } else if (kind === 'supp') {
    const r = c ? await defRoll(id, tid, who, 'Bastırma ateşine dayan', 'WILL', 'Concentration', c) : { total: 10 }; if (!r) return;
    hit = atk > r.total; D = r.total; res = hit ? 'Sipere koşmalı' : 'Yerinde kaldı';
    fxAttack(d, tid, hit ? 'hit' : 'miss', { txt: hit ? 'SİPERE!' : 'DAYANDI', col: hit ? '#f2a43a' : '#41cfd6' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit, res } } });
  } else if (['melee', 'brawl', 'martial'].indexOf(kind) >= 0) {
    const r = c ? await defRoll(id, tid, who, 'Savun: ' + d.aName + ' saldırıyor', 'DEX', 'Evasion', c) : { total: 13 }; if (!r) return;
    D = r.total; hit = atk > D; res = hit ? '' : 'Savuşturdu';
    fxFor(hit ? 'hit' : 'dodge');
  } else if (kind === 'grab') {
    const r = c ? await defRoll(id, tid, who, d.aName + ' seni yakalamaya çalışıyor', 'DEX', 'Brawling', c) : { total: 13 }; if (!r) return;
    D = r.total; hit = atk > D; res = hit ? 'Yakalandı · iki taraf −2' : 'Kurtuldu';
    if (hit) { const pairs = Object.assign({}, FX.pairs); pairs[id] = { a: d.a, b: tid }; FX.pairs = pairs; setDoc('table/grapple', { pairs }); }
    playFx({ k: 'grab', a: d.a, b: tid, res: hit ? 'hit' : 'miss', txt: hit ? 'YAKALANDI' : 'KURTULDU', col: hit ? '#c9d1d5' : '#41cfd6' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit, res } } });
  } else if (kind === 'opp') {
    const so = SOCIAL[d.soc];
    const r = c ? await defRoll(id, tid, who, so.n + ': ' + d.aName + ' sana karşı', so.ds, so.dsk, c, so.rep) : { total: 13 }; if (!r) return;
    D = r.total; hit = d.soc === 'facedown' ? (atk === D ? null : atk > D) : atk > D;
    res = d.soc === 'facedown' ? (hit === null ? 'Berabere: kimse geri adım atmadı' : hit ? who + ' geri adım atar ya da bu rakibe −2 alır' : d.aName + ' geri adım atar ya da bu rakibe −2 alır') : (hit ? so.n + ' başarılı' : so.n + ' başarısız');
    playFx({ k: so.fx, a: d.a, b: tid, res: hit ? 'hit' : 'miss', txt: hit ? 'BAŞARILI' : 'BAŞARISIZ', col: hit ? '#7bd88f' : '#ff8090' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit: !!hit, res } } });
  } else if (kind === 'zap') {
    const o = ownerOf(tid);
    if (o === S.me.id) { const v = await waitPrompt(id + tid, { kind: 'def', title: d.aName + ' sana Zap yapıyor', body: 'Interface + d10 ile savun. Kaybedersen 1d6 hasar doğrudan beynine.', btns: [['go', 'Savunma zarı at', 'primary']], id, tid }); if (v === null || !stillMine(id, tid)) return; }
    const zn = []; const zm = c ? withLuck(t.charId, 0, zn) : 0;
    const r = await doCheck({ who, label: 'Zap savunması', base: c ? rankOf(c) * (roleOf(c) === 'Netrunner' ? 1 : 0) : 0, mod: zm, notes: zn, pre: 'Interface →' });
    D = r.total; hit = atk > D; res = hit ? '' : 'Zap savuşturuldu';
    playFx({ k: 'code', a: d.a, b: tid, res: hit ? 'hit' : 'miss', txt: hit ? 'ZAP' : 'SAVUŞTURDU', col: hit ? '#ff4a5f' : '#41cfd6' });
  } else if (kind === 'ram') {
    let dodge = false;
    if (c && !injEff(c).noDodge) {
      dodge = await waitPrompt(id + tid, { kind: 'dodge', title: d.aName + ' aracıyla üstüne geliyor', body: d.w.n + ' · 6d6. DV13 kaçma: DEX + Evasion + d10. Başarırsan istersen aracın üstüne atlarsın.', btns: [['yes', 'Kaç · DEX + Evasion + d10', 'primary'], ['no', 'Kaçma']], id, tid });
      if (dodge === null || !stillMine(id, tid)) return;
    }
    if (dodge) { const am = autoMods(c, null); am.mod = withLuck(t.charId, am.mod, am.notes); const r = await doCheck({ who, label: 'Araçtan kaçma', base: effStat(c, 'DEX') + (+(c.skills || {}).Evasion || 0), mod: am.mod, notes: am.notes, dv: RAM_DV, pre: 'DEX + Evasion →' }); D = r.total; dodged = r.total > RAM_DV; }
    hit = !dodged; res = hit ? '' : 'Kaçtı';
    playFx({ k: 'punch', a: d.a, b: tid, res: hit ? 'hit' : 'dodge', txt: hit ? 'ÇARPMA' : 'KAÇTI', col: hit ? '#ff4a5f' : '#41cfd6' });
    if (hit) FX.shake = { t0: performance.now(), dur: 500, amp: 9 };
  } else if (kind === 'jury') {
    if (!c) return docPatch('act', id, { tg: { [tid]: { st: 'done', res: 'Sayfası yok' } } });
    const dv = ARMOR_DV[c.armor]; if (!dv) return docPatch('act', id, { tg: { [tid]: { st: 'done', res: 'Tamir edilecek zırh yok' } } });
    D = dv; hit = atk > dv;
    if (hit && c.juryLock) { hit = false; res = 'Bu zırh zaten saha tamiri gördü; önce tam tamir gerekli'; }
    else if (hit) { S.why = 'saha tamiri'; c.juryPrev = { spBody: +c.spBody || 0, spHead: +c.spHead || 0 }; c.spBody = ARMOR[c.armor] || 0; c.spHead = ARMOR[c.armor] || 0; c.juryLock = 1; saveCharNow(t.charId); renderChars(); dirty(); res = c.armor + ' saha tamiriyle tam SP ' + c.spBody; }
    else res = 'Tamir tutmadı (DV ' + dv + ')';
    playFx({ k: 'gear', a: d.a, b: tid, res: hit ? 'hit' : 'miss', txt: hit ? 'SP ' + c.spBody : 'TUTMADI', col: hit ? '#41cfd6' : '#ff8090' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit, res } } });
  } else if (kind === 'drug') {
    if (!c) return docPatch('act', id, { tg: { [tid]: { st: 'done', res: 'Sayfası yok' } } });
    const [ok, msg] = applyDrug(c, d.drug); if (ok) { S.why = 'ilaç: ' + (DRUGS[d.drug] || {}).n; saveCharNow(t.charId); renderChars(); renderTokCard(); dirty(); }
    playFx({ k: ok ? 'heal' : 'text', b: tid, txt: ok ? (d.drug === 'speed' ? '+HP' : DRUGS[d.drug].n.toUpperCase()) : 'ETKİSİZ', col: ok ? '#7bd88f' : '#929b96' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', hit: ok, res: msg } } });
  } else if (kind === 'qf' || kind === 'treat') {
    if (!c) return docPatch('act', id, { tg: { [tid]: { st: 'done', res: 'Sayfası yok' } } });
    const x = (c.crits || []).find(y => y.id === (e.inj || d.inj)); const spec = x && INJ[injKey(x)];
    hit = atk > e.dv; D = e.dv;
    if (hit && x) { x.st = kind === 'treat' ? 'treated' : (spec.perm ? 'treated' : 'qf'); S.why = kind === 'treat' ? 'tedavi' : 'hızlı müdahale'; saveCharNow(t.charId); renderChars(); dirty(); }
    res = hit ? (spec ? spec.n : 'Yara') + ': ' + (kind === 'treat' ? 'tedavi edildi' : spec && spec.perm ? 'kalıcı olarak giderildi' : 'gün sonuna kadar etkisiz') : 'Başarısız (DV ' + e.dv + ')';
    playFx({ k: 'heal', b: tid, a: d.a, res: hit ? 'hit' : 'miss', txt: hit ? (kind === 'treat' ? 'TEDAVİ' : 'MÜDAHALE') : 'BAŞARISIZ', col: hit ? '#7bd88f' : '#ff8090' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit, res } } });
  } else if (kind === 'heal') {
    if (!c) return docPatch('act', id, { tg: { [tid]: { st: 'done', res: 'Sayfası yok' } } });
    const hp = +c.hp, dv = hp < 1 ? 15 : hp < swThreshold(c) ? 13 : 10;
    hit = atk > dv; D = dv;
    if (hit) { if (hp < 1) { c.hp = 1; c.dsPen = dsBaseOf(c); } c.stab = true; S.why = 'stabilizasyon'; saveCharNow(t.charId); renderChars(); }
    res = hit ? (hp < 1 ? 'Stabilize edildi: 1 HP' : 'Stabilize edildi') : 'Stabilize edilemedi (DV ' + dv + ')';
    playFx({ k: 'heal', b: tid, a: d.a, res: hit ? 'hit' : 'miss', txt: hit ? (hp < 1 ? '+1 HP' : 'STABİL') : 'BAŞARISIZ', col: hit ? '#7bd88f' : '#ff8090' });
    return docPatch('act', id, { tg: { [tid]: { st: 'done', def: D, hit, res } } });
  }
  return docPatch('act', id, { tg: { [tid]: { st: hit ? 'hit' : 'miss', def: D, dodged, hit, res, mult } } });
}
async function defRoll(id, tid, who, title, stat, sk, c, rep) {
  const o = ownerOf(tid);
  if (o === S.me.id) { // oyuncu kendi zarını atar
    const v = await waitPrompt(id + tid, { kind: 'def', title, body: stat + ' + ' + (sk || 'itibar') + ' + d10 ile savun.', btns: [['go', 'Savunma zarı at', 'primary']], id, tid });
    if (v === null || !stillMine(id, tid)) return null;
  }
  let lvl = sk ? (+(c.skills || {})[sk] || 0) : (+c.rep || 0); const notes = [];
  if (sk === 'Evasion' && injEff(c).noDodge) { lvl = 0; notes.push('kopuk bacak: kaçamaz, Evasion sayılmaz'); }
  const am = autoMods(c, null); const tk = S.tokens[tid]; if (tk && tk.charId) am.mod = withLuck(tk.charId, am.mod, am.notes);
  return doCheck({ who, label: title.split(':')[0], base: effStat(c, stat) + lvl, mod: am.mod, notes: am.notes.concat(notes), pre: stat + ' + ' + (sk || 'itibar') + ' →' });
}
function fxAttack(d, tid, res, extra) {
  const cls = d.w ? d.w.cls : null; let k = 'shot';
  if (d.kind === 'auto') k = 'auto'; else if (d.kind === 'supp') k = 'supp'; else if (d.kind === 'shell') k = 'shell';
  else if (d.kind === 'blast') k = 'rocket'; else if (d.kind === 'melee') k = 'slash'; else if (d.kind === 'brawl' || d.kind === 'martial') k = 'punch';
  else if (cls === 'sniper') k = 'beam'; else if (cls === 'bow') k = 'arrow'; else if (cls === 'smg' || cls === 'ar') k = 'shot';
  if (d.kind === 'zap') k = 'code';
  const sp = Object.assign({ k, a: d.a, ac: d.src || null, b: tid, res: res === 'hit' && d.aim === 'h' ? 'head' : res, side: Math.random() < 0.5 ? 1 : -1 }, extra || {});
  if (k === 'auto') sp.n = 8; if (k === 'supp') sp.n = 10;
  if (k === 'shell') { sp.c = { x: S.tokens[tid].x, y: S.tokens[tid].y }; delete sp.b; }
  if (k === 'rocket') { sp.c = d.cell; delete sp.b; sp.r = 2.5; }
  if (k === 'slash' && d.w && (d.w.n || '').length) sp.n = 1;
  if (k === 'rocket' || k === 'shell') { if (res === 'dodge') playFx({ k: 'text', b: tid, txt: 'KAÇTI', col: '#41cfd6' }); else if (res === 'miss') playFx({ k: 'text', b: tid, txt: 'ISKA', col: '#e7e3d8' }); return; }
  playFx(sp);
}
async function rollActDamage(id) {
  const d = ACT.docs[id]; const k = d.kind;
  const expr = k === 'zap' ? '1d6' : k === 'ram' ? '6d6' : k === 'auto' ? '2d6' : k === 'shell' ? '3d6' : (k === 'brawl' || k === 'martial') ? brawlDice(d.body, d.carm) : d.w.d;
  const r = await doDamage({ who: d.aName, label: 'Hasar · ' + d.label, expr });
  let total = r.total, sw = 0;
  // Solo: Spot Weakness, turdaki ilk isabetli saldırı
  const at = d.a && S.tokens[d.a]; const ac = at && tokChar(at);
  if (ac && caSw(ac) && ['zap', 'ram'].indexOf(k) < 0) { const rk = roundKey(); if (!rk || ac.caSwR !== rk) { sw = caSw(ac); total += sw; if (rk) { ac.caSwR = rk; saveCharNow(at.charId); } } }
  if (sw) await logRoll({ who: d.aName, label: 'Spot Weakness', total: '+' + sw, detail: 'Turdaki ilk isabetli saldırı: hasara +' + sw + ' (zırhtan önce) → ' + total, kind: 'check' });
  // çarpma: araç da 6d6 alır, sürücü Whiplash
  if (k === 'ram' && at && at.veh) {
    at.veh.sdp = Math.max(0, at.veh.sdp - r.total); const dead = at.veh.sdp <= 0; const vn = at.veh.n; if (dead) at.veh = null; setDoc(tokPath(d.a), at);
    playFx({ k: dead ? 'boom' : 'text', b: d.a, c: { x: at.x, y: at.y }, txt: dead ? vn.toUpperCase() + ' HURDA' : 'SDP −' + r.total, col: '#f2a43a', r: 1.5 });
    if (ac) { injAdd(ac, 'h8'); S.why = 'çarpma: Whiplash'; saveCharNow(at.charId); renderChars(); }
  }
  await docPatch('act', id, { dmg: { total, sixes: r.sixes, vals: r.vals } });
}
async function applyHit(id, tid) {
  const d = ACT.docs[id]; const e = d.tg[tid]; const t = S.tokens[tid]; const c = tokChar(t);
  let dmg = d.dmg.total * (d.kind === 'auto' ? (e.mult || 1) : 1);
  if (!c) { playFx({ k: 'text', b: tid, txt: '-' + dmg, col: '#ff6b7d' }); return docPatch('act', id, { tg: { [tid]: { st: 'done', res: dmg + ' hasar (sayfa yok)' } } }); }
  const head = d.aim === 'h'; const key = head ? 'spHead' : 'spBody'; const sp = d.kind === 'zap' ? 0 : (+c[key] || 0);
  const eff = (d.kind === 'melee' || d.kind === 'martial') ? Math.ceil(sp / 2) : sp;
  const wasMortal = +c.hp < 1;
  let through = Math.max(0, dmg - eff);
  if (head && through) through *= injEff(c).skull ? 3 : 2;
  const notes = [];
  const ddv = caDd(c); if (ddv && through) { const rk = roundKey(); if (!rk || c.caDdR !== rk) { const cut = Math.min(through, ddv); through -= cut; if (rk) c.caDdR = rk; notes.push('Damage Deflection −' + cut); } }
  if (d.kind === 'zap') { if (through) { c.hp = Math.max(0, (+c.hp || 0) - through); notes.push(through + ' hasar doğrudan beyne'); } }
  else if (through) { c.hp = Math.max(0, (+c.hp || 0) - through); c[key] = Math.max(0, sp - 1); notes.push(through + ' hasar, ' + (head ? 'kafa' : 'gövde') + ' SP ' + sp + '→' + c[key]); }
  else notes.push('Zırh durdurdu (etkin SP ' + eff + ')');
  if (d.aim === 'l' && through && critNames(c).indexOf('Kırık bacak') < 0) { c.crits = (c.crits || []).concat([{ id: 'i' + uid(), key: 'b8', n: INJ.b8.n, e: INJ.b8.e, loc: 'b', ds: 0, st: 'active', side: Math.random() < 0.5 ? 'L' : 'R' }]); notes.push('Kırık bacak'); }
  if (d.aim === 'i' && through) notes.push('Elindekini düşürdü');
  if (d.kind === 'ram') { if (injAdd(c, 'h8')) notes.push('Whiplash'); }
  S.why = 'hasar · ' + (d.label || ''); saveCharNow(t.charId); renderChars(); renderTokCard(); dirty();
  playFx({ k: through ? 'text' : 'shield', b: tid, txt: through ? '-' + through : 'SP ' + eff, col: through ? '#ff6b7d' : '#41cfd6' });
  const needCrit = d.dmg.sixes >= 2 || (wasMortal && (through || d.dmg.sixes >= 2));
  if (needCrit) { const nm = await critFor(t.charId, head ? 'h' : 'b'); if (nm) { notes.push('Kritik yara: ' + nm); playFx({ k: 'text', b: tid, txt: nm.toUpperCase(), col: '#ff4a5f', res: 'crit' }); } }
  if (+c.hp < 1 && !wasMortal) { notes.push('Ölümcül yaralı'); playFx({ k: 'death', b: tid, txt: 'ÖLÜMCÜL YARALI', col: '#ff4a5f' }); }
  await docPatch('act', id, { tg: { [tid]: { st: 'done', res: notes.join(' · '), dmg: through } } });
  await logRoll({ who: (d.aName || '') + ' → ' + charLabel(c), label: d.label, total: through, detail: 'Gelen ' + dmg + (d.kind === 'auto' ? ' (2d6 ' + d.dmg.total + ' × ' + (e.mult || 1) + ')' : '') + ' · ' + notes.join(' · '), kind: 'apply' });
}
async function critFor(cid, loc) {
  const c = S.chars[cid]; if (!c) return null; const T = loc === 'h' ? CRIT_HEAD : CRIT_BODY; const have = critNames(c);
  for (let i = 0; i < 6; i++) {
    const g = await physRoll([{ n: 2, s: 6 }], 'Kritik yara · ' + (loc === 'h' ? 'kafa' : 'gövde'), { who: charLabel(c), tone: () => ({ tone: 'crit-lo', msg: 'CRITICAL INJURY' }) });
    const sum = g[0].vals[0] + g[0].vals[1]; const row = T[sum];
    if (have.indexOf(row[0]) >= 0) continue;
    const spec = INJ[row[3]];
    c.crits = (c.crits || []).concat([{ id: 'i' + uid(), key: row[3], n: row[0], e: row[1], loc, ds: row[2], st: 'active', side: spec.side ? (Math.random() < 0.5 ? 'L' : 'R') : null }]);
    if (row[2]) c.dsPen = (+c.dsPen || 0) + 1;
    if (spec.fx.spinal) toast(charLabel(c) + ': omurga yaralanması, sonraki turunda Aksiyon alamaz.', 'err');
    if (spec.fx.spinal && turnOn()) c.skipAct = turnMark();
    c.hp = Math.max(0, (+c.hp || 0) - 5); S.why = 'kritik yara: ' + row[0]; saveCharNow(cid); renderChars(); dirty();
    await logRoll({ who: charLabel(c), label: 'Kritik yara: ' + row[0], total: sum, detail: '2d6 [' + g[0].vals.join(', ') + '] · ' + row[1] + ' +5 hasar doğrudan HP\'den düştü.', kind: 'crit', crit: 'hi' });
    return row[0];
  }
  return null;
}

// ---- GM kontrol istekleri (DV gizli) ----
function openReqForm(picks) {
  const el = $('#reqForm'); el.hidden = false;
  el.dataset.picks = JSON.stringify(picks);
  $('#reqWho').textContent = picks.map(id => S.tokens[id] ? S.tokens[id].name : '?').join(', ');
  $('#reqEv').innerHTML = '<option value="">Stat ve beceriyi elle seç</option>' + EVENTS.map((e, i) => e.stat ? '<option value="' + i + '">' + esc(e.cat + ' · ' + e.n) + '</option>' : '').join('');
  $('#reqStat').innerHTML = STATS.map(k => '<option>' + k + '</option>').join('');
  $('#reqSk').innerHTML = '<option value="">Beceri yok (sadece stat)</option>' + SKILLS.map(s => '<option>' + esc(s[0]) + '</option>').join('');
  $('#reqDv').value = 15; $('#reqOk').value = ''; $('#reqFail').value = '';
}
document.addEventListener('change', e => { if (e.target.id === 'reqEv') { const ev = EVENTS[+e.target.value]; if (!ev) return; $('#reqStat').value = ev.stat; $('#reqSk').value = ev.sk || ''; if (ev.dv) $('#reqDv').value = ev.dv; } });
async function sendReq() {
  const el = $('#reqForm'); const picks = JSON.parse(el.dataset.picks || '[]');
  const ev = EVENTS[+$('#reqEv').value]; const stat = $('#reqStat').value, sk = $('#reqSk').value || null;
  const label = ev ? ev.n : (sk || stat) + ' kontrolü';
  const id = 'r' + uid(); const tg = {}; picks.forEach(t => tg[t] = { n: S.tokens[t].name, st: 'wait' });
  const sec = { dv: +$('#reqDv').value || 15, ok: $('#reqOk').value.trim(), fail: $('#reqFail').value.trim() };
  ACT.gsec[id] = sec;
  if (db) await db.doc('gmsecret/' + id).set(sec).catch(writeErr);
  await docSet('req', id, { by: S.me.id || 'local', ts: Date.now(), label, stat, sk, tg });
  el.hidden = true; toast('Kontrol isteği gönderildi: ' + label);
}
function pumpReqs() {
  for (const [id, r] of Object.entries(ACT.reqs)) {
    if (!r || !r.tg) continue;
    for (const tid of Object.keys(r.tg)) {
      const e = r.tg[tid];
      // GM sonucu karşılaştırır
      if (e.st === 'rolled' && S.me.isGM && ACT.gsec[id] && !ACT.busy.has(id + ':cmp:' + tid)) {
        ACT.busy.add(id + ':cmp:' + tid);
        const s = ACT.gsec[id]; const ok = e.total > s.dv;
        playFx({ k: 'check', b: tid, res: ok ? 'hit' : 'miss', txt: ok ? 'BAŞARILI' : 'BAŞARISIZ', col: ok ? '#7bd88f' : '#ff8090' });
        docPatch('req', id, { tg: { [tid]: { st: 'done', ok, note: ok ? s.ok : s.fail } } }).finally(() => ACT.busy.delete(id + ':cmp:' + tid));
      }
    }
    if (S.me.isGM && Date.now() - r.ts > 60 * 60000) { docDel('req', id); if (db) db.doc('gmsecret/' + id).delete().catch(() => { }); }
  }
}
async function rollReq(id, tid) {
  const r = ACT.reqs[id]; const t = S.tokens[tid]; const c = tokChar(t); if (!r || !c) return;
  const lvl = r.sk ? (+(c.skills || {})[r.sk] || 0) : 0;
  const am = autoMods(c, r.sk ? ctxOfSkill(r.sk) : null); am.mod = withLuck(t.charId, am.mod, am.notes);
  const rec = await doCheck({ who: charLabel(c), label: r.label, base: effStat(c, r.stat) + lvl, mod: am.mod, hideDv: true, notes: am.notes, pre: r.stat + (r.sk ? ' + ' + r.sk : '') + ' →' });
  await docPatch('req', id, { tg: { [tid]: { st: 'rolled', total: rec.total, d: rec.d } } });
}

// ---- kartlar ----
function renderCards() {
  const el = $('#cards'); if (!el) return;
  let h = '';
  for (const [k, p] of Object.entries(ACT.prompts)) {
    const pcid = p.tid && S.tokens[p.tid] && S.tokens[p.tid].charId; const plk = pcid && S.chars[pcid] && luckPool(S.chars[pcid]) ? luckStepHTML(pcid) : '';
    h += '<div class="card ' + (p.kind === 'dodge' ? 'warn' : '') + '"><b>' + esc(p.title) + '</b><p>' + esc(p.body) + '</p>' + plk + '<div class="row">' + p.btns.map(b => '<button class="btn sm ' + (b[2] || '') + '" data-pr="' + esc(k) + '" data-v="' + b[0] + '">' + esc(b[1]) + '</button>').join('') + '</div></div>';
  }
  // istek kartları
  for (const [id, r] of Object.entries(ACT.reqs)) {
    for (const tid of Object.keys(r.tg || {})) {
      const e = r.tg[tid]; const t = S.tokens[tid]; if (!t) continue;
      const mine = ctrlIsMe(tid);
      if (e.st === 'wait' && mine && tokChar(t)) h += '<div class="card req"><b>GM senden kontrol istiyor</b><p>' + esc(t.name) + ' · <b>' + esc(r.label) + '</b> · ' + esc(r.stat + (r.sk ? ' + ' + r.sk : '')) + ' + d10. Hedef gizli.</p>' + (t.charId && S.chars[t.charId] && luckPool(S.chars[t.charId]) ? luckStepHTML(t.charId) : '') + '<div class="row"><button class="btn sm primary" data-rq="' + esc(id) + '" data-t="' + esc(tid) + '">Zarı at</button></div></div>';
      else if (e.st === 'done' && (mine || ownerOf(tid) === S.me.id) && !ACT.dismissed.has(id + tid) && !S.me.isGM) h += '<div class="card ' + (e.ok ? 'ok' : 'bad') + '"><b>' + esc(r.label) + ': ' + (e.ok ? 'Başarılı' : 'Başarısız') + '</b>' + (e.note ? '<p>' + esc(e.note) + '</p>' : '') + '<div class="row"><button class="btn sm" data-dis="' + esc(id + tid) + '">Kapat</button></div></div>';
    }
    if (S.me.isGM) {
      const s = ACT.gsec[id];
      h += '<div class="card gm"><b>' + esc(r.label) + '</b><span class="dim"> · DV ' + (s ? s.dv : '?') + '</span><ul class="rqlist">' + Object.entries(r.tg).map(([tid, e]) => '<li><span>' + esc(e.n) + '</span><span class="mono">' + (e.st === 'wait' ? 'bekliyor' : e.st === 'rolled' ? e.total : (e.total != null ? e.total + ' · ' : '') + (e.ok ? '<i class="ok">başarılı</i>' : '<i class="bad">başarısız</i>')) + '</span>' + (e.st === 'wait' && ownerOf(tid) && ownerOf(tid) !== S.me.id && tokChar(S.tokens[tid] || {}) ? '<button class="linkbtn" data-rq="' + esc(id) + '" data-t="' + esc(tid) + '">Onun yerine at</button>' : '') + '</li>').join('') + '</ul><div class="row"><button class="btn sm" data-rqx="' + esc(id) + '">Kapat</button></div></div>';
    }
  }
  h += backupCardsHTML() + auditCardsHTML() + ipCardsHTML();
  // GM: oyuncu cevabı bekleyen aksiyonlar
  if (S.me.isGM) for (const [id, d] of Object.entries(ACT.docs)) {
    if (d.stage !== 'def') continue;
    for (const tid of Object.keys(d.tg)) { const e = d.tg[tid]; const o = ownerOf(tid); if (e.st === 'def' && o && o !== S.me.id && !e.force && Date.now() - d.ts > 30000) h += '<div class="card gm"><b>' + esc(e.n) + ' cevap vermedi</b><p>' + esc(d.aName + ' · ' + d.label) + '</p><div class="row"><button class="btn sm" data-force="' + esc(id) + '" data-t="' + esc(tid) + '">Onun yerine çöz</button></div></div>'; }
  }
  ACT.cardsEl = el;
  if (el._h !== h) { el.innerHTML = h; el._h = h; } el.hidden = !h;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pr],[data-rq],[data-rqx],[data-dis],[data-force],[data-reqsend],[data-reqx]'); if (!b) return;
  if (b.dataset.pr) { const p = ACT.prompts[b.dataset.pr]; if (p) p.resolve(b.dataset.v === 'yes' || b.dataset.v === 'go'); }
  else if (b.dataset.rq) { const id = b.dataset.rq, tid = b.dataset.t; const r = ACT.reqs[id]; if (r && r.tg[tid].st === 'wait') { r.tg[tid].st = 'rolling'; renderCards(); lockRoll(() => rollReq(id, tid)); } }
  else if (b.dataset.rqx) { const id = b.dataset.rqx; docDel('req', id); if (db) db.doc('gmsecret/' + id).delete().catch(() => { }); }
  else if (b.dataset.dis) { ACT.dismissed.add(b.dataset.dis); renderCards(); }
  else if (b.dataset.force) { docPatch('act', b.dataset.force, { tg: { [b.dataset.t]: { force: true } } }); }
  else if (b.dataset.reqsend != null) sendReq();
  else if (b.dataset.reqx != null) $('#reqForm').hidden = true;
});
// oyuncu kartı zorla kapatıldıysa beklemeyi bırak
setInterval(() => { for (const [k, p] of Object.entries(ACT.prompts)) { const d = p.id && ACT.docs[p.id]; if (!d || (d.tg[p.tid] && (d.tg[p.tid].force && ownerOf(p.tid) === S.me.id || d.tg[p.tid].st !== 'def'))) p.resolve(null); } }, 1500);
function stillMine(id, tid) { const d = ACT.docs[id]; return !!(d && d.tg[tid] && d.tg[tid].st === 'def' && ctrlIsMe(tid, d)); }
