'use strict';
// ===== YARDIMCILAR =====
const CS = 32;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
function rollDie(s) { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % s); }
const rnd = (a, b) => a + rollDie(b - a + 1) - 1;
const rpick = arr => arr[rollDie(arr.length) - 1];
function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const TOKEN_COLORS = ['#f2c230', '#41cfd6', '#ff6b8b', '#7bd88f', '#c29bff', '#ff9a3c', '#e7e3d8', '#5aa0ff'];

// ===== DURUM =====
const S = {
  me: { id: null, isGM: false, canWrite: true, color: '#f2c230', local: true },
  map: null, mapLoaded: false, preview: null, demo: null,
  tokens: {}, chars: {}, rolls: [], init: { order: [], turn: 0, round: 1 },
  _t: { tokens: {}, hidden: {} }, _c: { chars: {}, npcs: {} }, _got: {}, secret: {}, mySecret: [],
  view: { s: 1, x: 0, y: 0 }, fitKey: '',
  tool: 'move', brush: '#', brushSize: 1,
  sel: null, hover: null, drag: null, measure: null, rectPrev: null,
  pings: [], remoteDrag: {}, peers: [],
  tab: 'dice', charSel: null, sheetStale: false, skillFilter: 'set',
  secretMode: false, anim: !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
  ckLabel: 'Kontrol', busy: false,
  layerDirty: true, gen: { tpl: 'depo', w: 40, h: 28, dens: 1, seed: 4207, name: '' },
};
let db = null, room = null, user = null, assets = null;
const names = {}, avatars = {};

// ===== VERİ KATMANI =====
const isNpc = c => !!c && c.kind === 'npc';
const charPath = id => (isNpc(S.chars[id]) ? 'npcs/' : 'chars/') + id;
const tokPath = id => (S.tokens[id] && S.tokens[id].hidden ? 'hidden/' : 'tokens/') + id;
const debounced = {};
async function setDoc(path, data) {
  if (!db) { localApply(path, data); return true; }
  try { await db.doc(path).set(data); return true; } catch (e) { writeErr(e); return false; }
}
async function delDoc(path) {
  if (!db) { localApply(path, null); return; }
  try { await db.doc(path).delete(); } catch (e) { writeErr(e); }
}
function saveLater(path, getData, ms) {
  clearTimeout(debounced[path]);
  debounced[path] = setTimeout(() => { delete debounced[path]; const d = getData(); if (d) setDoc(path, d); }, ms || 500);
}
function writeErr(e) {
  const c = e && e.code;
  if (c === 'permission-denied') toast('Bunu kaydetme iznin yok (bu bilgi sadece GM\'ye açık).', 'err');
  else if (c === 'invalid_argument') toast('Bunu kaydetme iznin yok. GM masayı seninle katkıda bulunan yetkisiyle paylaşmalı.', 'err');
  else if (c === 'quota_exceeded') toast('Masa veritabanı doldu. Zar kaydını temizlemek yer açar.', 'err');
  else toast('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.', 'err');
}
function localApply(path, data) {
  const [col, id] = path.split('/');
  if (col === 'gm' && id === 'map') { S.map = data; S.mapLoaded = true; onMapChange(); }
  else if (col === 'chat') { chatApplyLocal(id, data); }
  else if (col === 'clog') { if (data) AUDIT.logs[id] = data; renderCards(); }
  else if (col === 'ipreq') { if (data) IP.reqs[id] = data; else delete IP.reqs[id]; renderCards(); }
  else if (col === 'table' && id === 'opts') { IP.opts = Object.assign({ ipAuto: false }, data || {}); }
  else if (col === 'dev') { if (data) NET.st[id] = data; else delete NET.st[id]; dirty(); renderDevCard(); }
  else if (col === 'table' && id === 'backup') { applyBackup(data); }
  else if (col === 'gm' && id === 'clock') { S.day = data ? (+data.day || 0) : 0; }
  else if (col === 'table' && id === 'grapple') { FX.pairs = data ? (data.pairs || {}) : {}; dirty(); renderTokCard(); }
  else if (col === 'table') { S.init = data || { order: [], turn: 0, round: 1 }; renderInit(); dirty(); }
  else if (col === 'gm' && id === 'music') { applyMusic(data); }
  else if (col === 'tokens' || col === 'hidden') {
    if (data) S.tokens[id] = Object.assign(data, { hidden: col === 'hidden' });
    else if (S.tokens[id] && !!S.tokens[id].hidden === (col === 'hidden')) delete S.tokens[id];
    dirty(); renderTokCard();
  }
  else if (col === 'chars' || col === 'npcs') { if (data) S.chars[id] = data; else delete S.chars[id]; renderChars(); dirty(); renderTokCard(); }
  else if (col === 'rolls') {
    if (data) { S.rolls.unshift(Object.assign({ id }, data)); S.rolls = S.rolls.slice(0, 40); }
    else S.rolls = S.rolls.filter(r => r.id !== id);
    renderLog();
  }
  else if (col === 'secret') { (data && data.rolls || []).forEach(r => S.secret[r.id] = r); renderLog(); }
}
function mergeTokens() {
  const o = {};
  for (const id in S._t.tokens) o[id] = Object.assign(S._t.tokens[id], { hidden: false });
  for (const id in S._t.hidden) o[id] = Object.assign(S._t.hidden[id], { hidden: true });
  for (const k in debounced) { const m = /^(tokens|hidden)\/(.+)$/.exec(k); if (m && S.tokens[m[2]]) o[m[2]] = S.tokens[m[2]]; }
  S.tokens = o; dirty(); renderTokCard(); renderInit(); renderCharList();
}
function mergeChars() {
  const o = Object.assign({}, S._c.chars, S._c.npcs);
  for (const k in debounced) { const m = /^(chars|npcs)\/(.+)$/.exec(k); if (m && S.chars[m[2]]) o[m[2]] = S.chars[m[2]]; }
  S.chars = o; Object.entries(o).forEach(([id, c]) => auditSeed(id, c)); renderChars(); dirty(); renderTokCard();
}
function subscribe() {
  const warn = e => console.warn('db', e);
  const qmap = q => { const o = {}; q.docs.forEach(d => o[d.id] = clone(d.data())); return o; };
  db.doc('gm/map').onSnapshot(s => {
    if (debounced['gm/map']) return;
    S.map = s.exists ? clone(s.data()) : null; S.mapLoaded = true; onMapChange();
  }, warn);
  db.collection('tokens').onSnapshot(q => { S._t.tokens = qmap(q); S._got.tokens = 1; mergeTokens(); migrate(); }, warn);
  db.collection('chars').onSnapshot(q => { S._c.chars = qmap(q); S._got.chars = 1; mergeChars(); migrate(); }, warn);
  if (S.me.isGM) {
    db.collection('hidden').onSnapshot(q => { S._t.hidden = qmap(q); mergeTokens(); }, warn);
    db.collection('npcs').onSnapshot(q => { S._c.npcs = qmap(q); mergeChars(); }, warn);
    db.collection('secret').onSnapshot(q => {
      q.docs.forEach(d => { const rs = (d.data().rolls || []); rs.forEach(r => S.secret[r.id] = r); if (d.id === S.me.id) S.mySecret = rs.slice(); });
      renderLog();
    }, warn);
  } else if (S.me.id) {
    db.doc('secret/' + S.me.id).onSnapshot(s => { const rs = s.exists ? (s.data().rolls || []) : []; S.mySecret = rs.slice(); rs.forEach(r => S.secret[r.id] = r); renderLog(); }, warn);
  }
  db.collection('rolls').orderBy('ts', 'desc').limit(40).onSnapshot(q => {
    S.rolls = q.docs.map(d => Object.assign({ id: d.id }, d.data())); renderLog();
  }, warn);
  chatSubscribe(); auditSubscribe(); ipSubscribe();
  db.collection('dev').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); NET.st = o; dirty(); renderDevCard(); }, warn);
  db.doc('table/backup').onSnapshot(s => applyBackup(s.exists ? s.data() : null), warn);
  db.doc('gm/clock').onSnapshot(s => { S.day = s.exists ? (+s.data().day || 0) : 0; }, warn);
  db.doc('table/init').onSnapshot(s => {
    S.init = s.exists ? clone(s.data()) : { order: [], turn: 0, round: 1 }; renderInit(); dirty();
  }, warn);
}
// eski sürümden kalan NPC sayfalarını ve gizli tokenları GM'ye özel yerlere taşı (bir kez)
let migrated = false;
async function migrate() {
  if (migrated || !S.me.isGM || !db || !S._got.tokens || !S._got.chars) return;
  migrated = true;
  for (const [id, c] of Object.entries(S._c.chars)) if (c.kind === 'npc') { await db.doc('npcs/' + id).set(c).catch(() => { }); await db.doc('chars/' + id).delete().catch(() => { }); }
  for (const [id, t] of Object.entries(S._t.tokens)) if (t.hidden) { const d = clone(t); await db.doc('hidden/' + id).set(d).catch(() => { }); await db.doc('tokens/' + id).delete().catch(() => { }); }
  // zar kaydını 150 atışla sınırla
  try {
    const q = await db.collection('rolls').orderBy('ts', 'desc').limit(400).get();
    for (const d of q.docs.slice(150)) await db.doc('rolls/' + d.id).delete();
  } catch (e) { }
}
async function resolveNames(ids) {
  if (!user) return;
  ids = [...new Set(ids.filter(Boolean))];
  if (!ids.length) return;
  const fresh = ids.filter(i => !(i in names));
  const ps = await user.profiles(ids);
  let changed = false;
  ids.forEach(id => { const p = ps[id]; if (!p) return; if (names[id] !== p.name || avatars[id] !== p.avatarUrl) changed = true; names[id] = p.name || ''; avatars[id] = p.avatarUrl; });
  if (changed || fresh.length) { renderLogOnly(); renderPeers(); renderCharList(); }
}
function nameOf(id) { if (!id) return 'Biri'; if (id === S.me.id) return 'Sen'; return names[id] || 'Oyuncu'; }

// ===== KARAKTER KURALLARI (Core Rulebook) =====
const hpMax = c => 10 + 5 * Math.ceil(((+c.stats.BODY || 0) + (+c.stats.WILL || 0)) / 2);
const swThreshold = c => Math.ceil(hpMax(c) / 2);
const hlSum = c => (c.cyber || []).reduce((a, x) => a + (+x.hl || 0), 0);
const humanity = c => (+c.stats.EMP || 0) * 10 - hlSum(c);
const curEmp = c => Math.max(0, Math.floor(Math.max(0, humanity(c)) / 10));
const statSum = c => STATS.reduce((a, k) => a + (+c.stats[k] || 0), 0);
const FREE_SKILL = { 'Language (Ana dil)': 4, 'Surgery': 99 };
const skillPts = c => Object.entries(c.skills || {}).reduce((a, [n, v]) => a + Math.max(0, (+v || 0) - (FREE_SKILL[n] || 0)) * (SKILL[n] && SKILL[n].x2 ? 2 : 1), 0);
const charLabel = c => c ? (c.handle || c.name || 'İsimsiz') : '';
const canEditChar = c => S.me.isGM || !c.owner || c.owner === S.me.id;
const canMoveTok = t => S.me.isGM || !t.owner || t.owner === S.me.id;
const critNames = c => (c.crits || []).filter(x => (x.st || 'active') === 'active' || x.st === 'qf').map(x => x.n);
function hpState(c) {
  const hp = +c.hp;
  if (hp < 1) return ['Ölümcül yaralı · −4', 'crit'];
  if (hp < swThreshold(c)) return ['Ağır yaralı · −2', 'warn'];
  if (hp < hpMax(c)) return ['Hafif yaralı', 'ok'];
  return ['Sağlam', 'ok'];
}
const armorPen = c => ARMOR_PEN[c.armor] || 0;
const woundPen = c => (+c.hp < 1 ? 4 : +c.hp < swThreshold(c) ? (c.stim ? 0 : 2) : 0);
function effStat(c, k) { return (+c.stats[k] || 0) - ((k === 'REF' || k === 'DEX' || k === 'MOVE') ? armorPen(c) : 0); }
function effMove(c) { let m = effStat(c, 'MOVE'); if (+c.hp < 1) m -= 6; m -= injEff(c).move; return Math.max(1, m); }
// otomatik uygulanan değiştiriciler
function autoMods(c, ctx) {
  let mod = 0; const notes = [];
  const w = woundPen(c); if (w) { mod -= w; notes.push((w === 4 ? 'ölümcül yara' : 'ağır yara') + ' −' + w); }
  const f = injEff(c);
  const add = (v, t) => { if (v) { mod -= v; notes.push(t + ' −' + v); } };
  add(f.all, 'kafa yarası');
  if (ctx === 'melee') add(f.melee, 'yırtık kas');
  if (ctx === 'ranged' || ctx === 'vision' || ctx === 'perception') add(f.vision, 'göz yarası');
  const plus = (v, t) => { if (v) { mod += v; notes.push(t + ' +' + v); } };
  if (ctx === 'ranged' || ctx === 'melee') plus(caPa(c), 'Precision Attack');
  if (ctx === 'perception') plus(caTd(c), 'Threat Detection');
  if (ctx === 'hearing') add(f.hearing, 'kulak yarası');
  if (ctx === 'speech') add(f.speech, 'kırık çene');
  if (ctx === 'hand') add(f.hand, 'ezilmiş parmaklar');
  const tid = Object.keys(S.tokens).find(k => S.chars[S.tokens[k].charId] === c);
  if (tid && Object.values(FX.pairs || {}).some(p => p.a === tid || p.b === tid)) add(2, 'boğuşma');
  return { mod, notes };
}
const hasCyberarm = c => (c.cyber || []).some(x => /cyberarm/i.test(x.n || ''));
const skBase = (c, n) => effStat(c, SKILL[n].stat) + (+((c.skills || {})[n]) || 0);

function genStats(prio, total, lo, hi) {
  const s = {}; STATS.forEach(k => s[k] = lo);
  let left = total - lo * STATS.length, guard = 500;
  const wt = k => prio.indexOf(k) >= 0 ? (5 - prio.indexOf(k)) * 1.3 + 1 : 1;
  while (left > 0 && guard-- > 0) {
    const pool = STATS.filter(k => s[k] < hi); if (!pool.length) break;
    const sum = pool.reduce((a, k) => a + wt(k), 0); let r = Math.random() * sum, pickK = pool[0];
    for (const k of pool) { r -= wt(k); if (r <= 0) { pickK = k; break; } }
    s[pickK]++; left--;
  }
  return s;
}
function genSkills(roleSk, total) {
  const sk = {}; BASIC.forEach(n => sk[n] = 2); sk['Language (Ana dil)'] = 4;
  let left = total - BASIC.length * 2, changed = true;
  const cost = n => SKILL[n].x2 ? 2 : 1;
  while (left > 0 && changed) {
    changed = false;
    roleSk.forEach((n, i) => { if (left >= cost(n) && (sk[n] || 0) < 6 && Math.random() < 0.95 - i * 0.05) { sk[n] = (sk[n] || 0) + 1; left -= cost(n); changed = true; } });
  }
  let guard = 300;
  while (left > 0 && guard-- > 0) {
    const n = rpick(SKILLS)[0]; if (FREE_SKILL[n]) continue;
    if ((sk[n] || 0) < 4 && cost(n) <= left) { sk[n] = (sk[n] || 0) + 1; left -= cost(n); }
  }
  return sk;
}
function rollLife() { const l = {}; for (const k in LIFE) l[k] = rpick(LIFE[k].v); return l; }
const mkWeapon = n => ({ n, d: WEAPON[n].d, sk: WEAPON[n].sk, cls: WEAPON[n].cls, rof: WEAPON[n].rof, af: WEAPON[n].af });
function makePC(roleK) {
  const role = ROLE[roleK] || rpick(ROLES);
  const c = {
    kind: 'pc', name: rpick(FIRST) + ' ' + rpick(LAST), handle: rpick(HANDLES), role: role.k, rank: 4,
    stats: genStats(role.st, 62, 2, 8), skills: genSkills(role.sk, 86),
    armor: role.ar, spBody: ARMOR[role.ar], spHead: ARMOR[role.ar],
    weapons: role.w.map(mkWeapon), cyber: [], life: rollLife(), notes: '', crits: [], dsPen: 0,
    owner: S.me.id, ts: Date.now(),
  };
  c.hp = hpMax(c); c.luck = c.stats.LUCK; return c;
}
function makeBlank() {
  const st = {}; STATS.forEach(k => st[k] = 6);
  const sk = {}; BASIC.forEach(n => sk[n] = 2); sk['Language (Ana dil)'] = 4;
  const c = { kind: 'pc', name: '', handle: 'Yeni edgerunner', role: 'Solo', rank: 4, stats: st, skills: sk, armor: 'Yok', spBody: 0, spHead: 0, weapons: [], cyber: [], life: {}, notes: '', crits: [], dsPen: 0, owner: S.me.id, ts: Date.now() };
  c.hp = hpMax(c); c.luck = st.LUCK; return c;
}
function makeNPC(ak, tk) {
  const A = ARCHES[ak] || ARCHES.gang, T = TIERS[tk] || TIERS.mook;
  const stats = {}; STATS.forEach(k => stats[k] = rnd(T.s[0], T.s[1]));
  A.st.forEach(k => stats[k] = Math.min(10, stats[k] + rnd(1, 2)));
  const skills = {}; ['Perception', 'Evasion', 'Athletics'].forEach(n => skills[n] = 2);
  A.sk.forEach(n => skills[n] = rnd(T.k[0], T.k[1]));
  const ai = Math.min(ARMORS.length - 1, ARMORS.findIndex(a => a[0] === A.ar) + (A.ar === 'Yok' ? 0 : T.arUp));
  const ar = ARMORS[Math.max(0, ai)];
  const gangy = ['gang', 'psycho', 'solo', 'runner', 'nomad'].includes(ak);
  const c = {
    kind: 'npc', arche: ak, tier: tk,
    name: rpick(FIRST) + ' ' + rpick(LAST), handle: gangy ? rpick(HANDLES) : '',
    role: '', rank: 0, stats, skills, armor: ar[0], spBody: ar[1], spHead: ar[1],
    weapons: A.w.map(mkWeapon), cyber: A.cy.map(n => ({ n, hl: rnd(2, 7) })), life: {}, quirk: rpick(QUIRKS), notes: '',
    crits: [], dsPen: 0, hidden: true, owner: S.me.id, ts: Date.now(),
  };
  c.hp = hpMax(c); c.luck = stats.LUCK; return c;
}

// ===== ZARLAR =====
// "3d6+2", "1d100-1", "2d6+1d10" → {groups:[{n,s,sign}], add}
function parseDice(str) {
  const s = String(str || '').toLowerCase().replace(/\s+/g, '').replace(/d%/g, 'd100');
  if (!s || !/^[0-9d+\-]+$/.test(s)) return null;
  const re = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g; let m, used = '', groups = [], add = 0, n = 0;
  while ((m = re.exec(s))) {
    used += m[0];
    if (m[3]) {
      const cnt = Math.max(1, +(m[2] || 1)), sides = +m[3];
      if ([4, 6, 8, 10, 12, 20, 100].indexOf(sides) < 0) return { err: 'd4, d6, d8, d10, d12, d20 ve d100 kullanılabilir.' };
      n += cnt * (sides === 100 ? 2 : 1); if (n > 20) return { err: 'Kutuya bir seferde en çok 20 zar sığar.' };
      groups.push({ n: cnt, s: sides, sign: m[1] === '-' ? -1 : 1 });
    } else add += +m[5] * (m[4] === '-' ? -1 : 1);
  }
  if (used.length !== s.length || (!groups.length)) return null;
  return { groups, add };
}
const dieName = s => s === 100 ? 'd100' : 'd' + s;
function diceText(types, vals) {
  const out = []; for (let i = 0; i < types.length; i++) {
    if (types[i] === 'd10t' && types[i + 1] === 'd10') { let v = vals[i] + (vals[i + 1] === 10 ? 0 : vals[i + 1]); if (v === 0) v = 100; out.push(v); i++; }
    else out.push(vals[i]);
  }
  return out.length > 1 ? out.join(' + ') + ' = ' + out.reduce((a, b) => a + b, 0) : String(out[0]);
}
// fiziksel atış: grupları kutuya atar, değerleri döndürür
// grupları birleştir (d100 = onlar + birler)
function mergeVals(groups, values) {
  let k = 0;
  return groups.map(g => {
    const vals = [];
    for (let i = 0; i < g.n; i++) {
      if (g.s === 100) { const t = values[k++], u = values[k++]; let v = t + (u === 10 ? 0 : u); if (v === 0) v = 100; vals.push(v); }
      else vals.push(values[k++]);
    }
    return { s: g.s, n: g.n, sign: g.sign || 1, vals };
  });
}
// serbest atışta ton: en düşük–en yüksek arasındaki konuma göre
function rangeTone(groups, values) {
  const gs = mergeVals(groups, values); let mn = 0, mx = 0, sum = 0;
  gs.forEach(g => { mn += g.n * g.sign * (g.sign > 0 ? 1 : g.s); mx += g.n * g.sign * (g.sign > 0 ? g.s : 1); sum += g.vals.reduce((a, b) => a + b, 0) * g.sign; });
  if (mx === mn) return { tone: 'neutral' };
  const f = (sum - mn) / (mx - mn);
  if (sum === mx) return { tone: 'max' };
  if (sum === mn) return { tone: 'low', msg: 'MINIMUM OUTPUT' };
  return { tone: f >= 0.8 ? 'ok' : f <= 0.2 ? 'low' : 'neutral', msg: f >= 0.8 ? 'HIGH ROLL' : undefined };
}
// fiziksel atış: grupları kutuya atar, değerleri döndürür
async function physRoll(groups, label, opt) {
  opt = opt || {};
  const types = [];
  groups.forEach(g => { for (let i = 0; i < g.n; i++) { if (g.s === 100) types.push('d10t', 'd10'); else types.push('d' + g.s); } });
  const who = opt.who || S.me.whoName || '';
  const lab = (who ? who + ' · ' : '') + label;
  const res = await Dice3D.roll(types, {
    animate: S.anim, waitAnim: true, label: lab,
    resultText: opt.resultText || (v => diceText(types, v)),
    tone: v => (opt.tone ? opt.tone(mergeVals(groups, v)) : rangeTone(groups, v)) || {},
    onStart: o => {
      if (!S.secretMode && !opt.quiet && room && o.physical) {
        const fx = o.fx || {};
        room.emit('dice', { seed: o.seed, types, l: lab.slice(0, 80), v: o.values, t: (opt.resultText ? opt.resultText(o.values) : diceText(types, o.values)).slice(0, 60), tone: fx.tone || 'neutral', msg: (fx.msg || '').slice(0, 30), sub: (fx.sub || '').slice(0, 60) }).catch(() => { });
      }
    },
  });
  return mergeVals(groups, res.values);
}
async function lockRoll(fn) {
  if (S.busy) { toast('Zarlar hâlâ yuvarlanıyor.'); return; }
  S.busy = true; document.body.classList.add('rolling');
  try { return await fn(); } finally { S.busy = false; document.body.classList.remove('rolling'); }
}
async function rollExpr(expr, label, who, extraMod) {
  const p = parseDice(expr);
  if (!p) { toast('Zar ifadesi anlaşılamadı. Örnek: 3d6+2 ya da 2d10-1', 'err'); return null; }
  if (p.err) { toast(p.err, 'err'); return null; }
  const add = p.add + (extraMod || 0);
  const res = await physRoll(p.groups, label || expr, { who });
  let total = add; const parts = [];
  res.forEach(r => { const sum = r.vals.reduce((a, b) => a + b, 0) * r.sign; total += sum; parts.push((r.sign < 0 ? '−' : (parts.length ? '+ ' : '')) + r.n + dieName(r.s) + ' [' + r.vals.join(', ') + ']'); });
  if (add) parts.push((add > 0 ? '+ ' : '− ') + Math.abs(add));
  const sixes = res.filter(r => r.s === 6).reduce((a, r) => a + r.vals.filter(v => v === 6).length, 0);
  const rec = { who, label: label || expr, total, detail: parts.join(' '), kind: 'expr' };
  if (sixes >= 2) rec.note = 'İki veya daha fazla 6: hasar atışıysa kritik yara';
  await logRoll(rec);
  return rec;
}
// STAT + beceri + d10 (10'da ek zar eklenir, 1'de ek zar düşülür)
async function doCheck(o) {
  const lab = o.label;
  const g = await physRoll([{ n: 1, s: 10 }], lab, { who: o.who, quiet: o.quiet, resultText: v => 'd10: ' + (v[0]) + (v[0] === 10 ? ' · kritik başarı!' : v[0] === 1 ? ' · kritik başarısızlık!' : ' → ' + (o.base + o.mod + v[0])),
    tone: gs => { const d = gs[0].vals[0]; if (d === 10) return { tone: 'crit-hi', sub: 'Bir zar daha atılıp eklenecek' }; if (d === 1) return { tone: 'crit-lo', sub: 'Bir zar daha atılıp düşülecek' }; const tot = o.base + o.mod + d; if (o.hideDv) return { tone: 'neutral', msg: 'TOPLAM ' + tot }; if (o.dv) return tot > o.dv ? { tone: 'ok', sub: 'Toplam ' + tot + ' · DV ' + o.dv } : { tone: 'fail', sub: 'Toplam ' + tot + ' · DV ' + o.dv }; return { tone: d >= 8 ? 'ok' : d <= 3 ? 'low' : 'neutral', msg: 'TOPLAM ' + tot }; } });
  const d = g[0].vals[0]; let extra = 0, crit = null;
  if (d === 10 || (d === 1 && !o.noFumble)) {
    const e = await physRoll([{ n: 1, s: 10 }], lab + (d === 10 ? ' · ek zar eklenir' : ' · ek zar düşülür'), { who: o.who, quiet: o.quiet,
      tone: gs => { const x = gs[0].vals[0]; const tot = o.base + o.mod + d + (d === 10 ? x : -x); if (o.hideDv || !o.dv) return { tone: d === 10 ? 'crit-hi' : 'crit-lo', msg: 'TOPLAM ' + tot }; return tot > o.dv ? { tone: d === 10 ? 'crit-hi' : 'ok', msg: d === 10 ? 'CRITICAL SUCCESS' : 'SAVED', sub: 'Toplam ' + tot + ' · DV ' + o.dv } : { tone: d === 1 ? 'crit-lo' : 'fail', sub: 'Toplam ' + tot + ' · DV ' + o.dv }; } });
    extra = d === 10 ? e[0].vals[0] : -e[0].vals[0]; crit = d === 10 ? 'hi' : 'lo';
  }
  const total = o.base + o.mod + d + extra;
  let det = (o.pre ? o.pre + ' ' : '') + o.base + ' + d10 [' + d + ']';
  if (crit === 'hi') det += ' + kritik d10 [' + extra + ']';
  if (crit === 'lo') det += ' − kritik d10 [' + (-extra) + ']';
  if (o.mod) det += (o.mod > 0 ? ' + ' : ' − ') + Math.abs(o.mod) + ' mod';
  if (d === 1 && o.noFumble) det += ' · Fumble Recovery: ek zar düşülmedi';
  if (o.notes && o.notes.length) det += ' (' + o.notes.join(', ') + ')';
  const ok = o.dv ? total > o.dv : null;
  const rec = { who: o.who, label: lab, total, detail: det, crit, ok: o.hideDv ? null : ok, dv: o.hideDv ? null : (o.dv || null), kind: 'check' };
  if (!o.nolog) await logRoll(rec); else flash(rec);
  rec.d = d; rec.okReal = ok;
  return rec;
}
async function doDamage(o) {
  const p = parseDice(o.expr); if (!p || p.err) { toast('Hasar zarı anlaşılamadı: ' + o.expr, 'err'); return null; }
  const res = await physRoll(p.groups, o.label, { who: o.who, quiet: o.quiet, resultText: v => { const t = v.reduce((a, b) => a + b, 0); return (o.mult ? t + ' × ' + o.mult + ' = ' + (t * o.mult) : diceText(v.map(() => 'd6'), v)) + (p.add ? ' + ' + p.add : ''); },
    tone: gs => { const all = gs.reduce((a, r) => a.concat(r.vals), []); const six = gs.filter(r => r.s === 6).reduce((a, r) => a + r.vals.filter(v => v === 6).length, 0); if (six >= 2) return { tone: 'crit-hi', msg: 'CRITICAL INJURY', sub: 'İki 6: kritik yara · +5 doğrudan HP' }; return rangeTone(p.groups, all); } });
  const vals = res.reduce((a, r) => a.concat(r.vals), []);
  let total = vals.reduce((a, b) => a + b, 0) * (o.mult || 1) + p.add;
  const sixes = res.filter(r => r.s === 6).reduce((a, r) => a + r.vals.filter(v => v === 6).length, 0);
  let det = o.expr + ' [' + vals.join(', ') + ']' + (o.mult ? ' × ' + o.mult : '');
  const crit = sixes >= 2 ? 'hi' : null;
  const rec = { who: o.who, label: o.label, total, detail: det, crit, kind: 'dmg' };
  if (crit) rec.note = 'Kritik yara: hedef 2d6 tablodan yara alır, +5 hasar doğrudan HP\'den düşer.';
  if (!o.nolog) await logRoll(rec); else flash(rec);
  rec.vals = vals; rec.sixes = sixes;
  return rec;
}
async function logRoll(rec) {
  rec.ts = Date.now(); rec.by = S.me.id || null;
  Object.keys(rec).forEach(k => rec[k] === undefined && delete rec[k]);
  flash(rec);
  const id = uid();
  if (S.secretMode && db && S.me.id) {
    setDoc('rolls/' + id, { by: rec.by, who: rec.who || '', label: 'Gizli atış', secret: true, ts: rec.ts });
    const full = Object.assign({ id }, rec); S.secret[id] = full;
    S.mySecret = (S.mySecret || []).concat([full]).slice(-25);
    await setDoc('secret/' + S.me.id, { rolls: S.mySecret });
  } else if (S.secretMode && !db) {
    const full = Object.assign({ id, secretLocal: true }, rec); S.rolls.unshift(full); S.rolls = S.rolls.slice(0, 40); renderLog();
  } else await setDoc('rolls/' + id, rec);
}
