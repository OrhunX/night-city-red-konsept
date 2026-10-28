// ===== DÖVÜŞ SIRASI (Core Rulebook: her tur 1 Hareket + 1 Aksiyon) + SAYFA KİLİDİ + DEĞİŞİKLİK KAYDI =====
// S.init.used[tokenId] = { mv: kullanılan kare, act: false|'act'|'run'|'net'|'hold'|'skip', hold, holdR, holdUsed }
// S.init.free = true → sıra kuralı kapalı (GM ayarı). S.init.grant = tokenId → GM'in tek seferlik izni.
const turnOn = () => !!(S.init && (S.init.order || []).length) && !S.init.free;
const turnTokName = () => { const t = currentTurnTok(); return t ? S.tokens[t].name : '?'; };
// yara etkileri "bir sonraki turunda": yara anındaki (tur, sıra) kaydından hesaplanır, yazma gerekmez
function skipNow(c, tid, key) {
  const k = c && c[key]; if (!k || typeof k !== 'object' || !turnOn()) return false;
  const ti = (S.init.order || []).findIndex(e => e.tok === tid); if (ti < 0 || (S.init.turn || 0) !== ti) return false;
  const firstR = ti > k.t ? k.r : k.r + 1; return (S.init.round || 1) === firstR;
}
const turnMark = () => ({ r: S.init.round || 1, t: S.init.turn || 0 });
function tUsed(tid) { return (S.init.used && S.init.used[tid]) || {}; }
function tSet(tid, patch) {
  const init = S.init; init.used = init.used || {}; init.used[tid] = Object.assign({}, init.used[tid] || {}, patch);
  setDoc('table/init', init); renderInit(); renderTokCard();
}
// what: 'act' (Aksiyon), 'move' (Hareket), 'net' (NET aksiyonu)
function mayAct(tid, what) {
  if (!turnOn() || S.me.isGM) return [true];
  const t = S.tokens[tid]; if (!t) return [false, 'Token yok.'];
  const u = tUsed(tid); const mine = currentTurnTok() === tid; const grant = S.init.grant === tid;
  const holding = what === 'act' && u.hold && u.holdR === (S.init.round || 1) && !u.holdUsed;
  if (!mine && !grant && !holding) return [false, 'Sıra ' + turnTokName() + '\'de. Kendi sıranı bekle.'];
  const c = tokChar(t);
  if (what === 'act') {
    if (skipNow(c, tid, 'skipAct')) return [false, 'Omurga yaralanması: bu tur Aksiyon alamazsın, sadece hareket edebilirsin.'];
    if (holding) return [true];
    if (u.act === 'net') return [false, 'Bu tur NET aksiyonlarını kullandın; gerçek dünyada Aksiyon alamazsın.'];
    if (u.act) return [false, 'Bu tur Aksiyonunu kullandın. Hareket hakkın varsa yürüyebilir, sonra sırayı bitirebilirsin.'];
  }
  if (what === 'net') { if (skipNow(c, tid, 'skipAct')) return [false, 'Omurga yaralanması: bu tur Aksiyon alamazsın.']; if (u.act && u.act !== 'net') return [false, 'Bu tur Aksiyonunu gerçek dünyada kullandın; NET aksiyonu yapamazsın.']; }
  if (what === 'move' && skipNow(c, tid, 'skipMove')) return [false, 'Kulak yarası: bu tur Hareket edemezsin.'];
  return [true];
}
function gateAct(tid, what) { const [ok, why] = mayAct(tid, what || 'act'); if (!ok) { toast(why, 'err'); return false; } return true; }
// Aksiyon harcandı
function useAct(tid, kind) {
  if (!turnOn() || !tid || !S.tokens[tid]) return;
  const u = tUsed(tid); const holding = u.hold && u.holdR === (S.init.round || 1) && !u.holdUsed && currentTurnTok() !== tid;
  if (holding) { tSet(tid, { holdUsed: 1 }); return; }
  const patch = { act: kind || 'act' }; if (S.init.grant === tid && currentTurnTok() !== tid) { S.init.grant = null; }
  tSet(tid, patch);
}
// hareket bütçesi (kare): MOVE; Koşu Aksiyonu ile bir kez daha
function moveBudget(tid, mv) {
  if (!turnOn() || S.me.isGM) return { budget: mv * 2, free: true };
  const u = tUsed(tid); const used = +u.mv || 0; const canRun = !u.act || u.act === 'run';
  return { budget: Math.max(0, (u.act === 'run' ? mv * 2 : mv + (canRun ? mv : 0)) - used), used, mv, canRun };
}
function useMove(tid, squares, mv) {
  if (!turnOn() || S.me.isGM || !squares) return;
  const u = tUsed(tid); const total = (+u.mv || 0) + squares; const patch = { mv: total };
  if (total > mv && !u.act) { patch.act = 'run'; toast('Koştun: bu tur Aksiyonunu Koşu için harcadın.'); }
  tSet(tid, patch);
}
// sıra değişince: biten tokenin kısıtlarını kaldır, yenisini sıfırla, olay yaz
function onTurnAdvance(prevTid, nextTid) {
  const init = S.init; init.used = init.used || {};
  if (nextTid) init.used[nextTid] = {};
  if (init.turn === 0 && init.round > 1) Object.keys(init.used).forEach(k => { if (init.used[k].hold) delete init.used[k].hold; });
  init.grant = null;
  if (nextTid) chatEvent('Sıra: ' + (S.tokens[nextTid].hidden ? 'Bilinmeyen' : S.tokens[nextTid].name) + ' · Tur ' + (init.round || 1));
}
let lastTurnKey = '';
function turnNotify() {
  const k = (S.init.round || 1) + ':' + (S.init.turn || 0) + ':' + (currentTurnTok() || '');
  if (k === lastTurnKey) return; const first = !lastTurnKey; lastTurnKey = k;
  if (first || !turnOn()) return;
  const t = currentTurnTok(); if (t && !S.me.isGM && S.tokens[t] && S.tokens[t].owner === S.me.id) { toast('Sıra sende: ' + S.tokens[t].name + '. 1 Hareket + 1 Aksiyon.'); Sound.play('ping'); S.sel = t; renderTokCard(); }
}
function turnStatusHTML(tid) {
  if (!turnOn() || !S.tokens[tid]) return '';
  const t = S.tokens[tid], c = tokChar(t); const mine = currentTurnTok() === tid; const u = tUsed(tid);
  const mv = t.veh ? t.veh.move : (c ? effMove(c) : 6);
  const act = u.act === 'run' ? 'Koşuya harcandı' : u.act === 'net' ? 'NET' : u.act === 'hold' ? 'Bekletiliyor' : u.act ? 'Kullanıldı' : (skipNow(c, tid, 'skipAct') ? 'Yok (omurga)' : 'Hazır');
  let h = '<div class="turnbox' + (mine ? ' cur' : '') + '"><span>' + (mine ? 'Sıra bunda' : 'Sırası değil') + '</span><span>Hareket <b>' + Math.min(+u.mv || 0, mv * 2) + '/' + mv + '</b></span><span>Aksiyon <b>' + act + '</b></span>';
  if (mine && (S.me.isGM || t.owner === S.me.id)) h += '<button class="btn sm" data-act="endTurn">Sırayı bitir</button>';
  if (mine && !u.act && !skipNow(c, tid, 'skipAct') && (S.me.isGM || t.owner === S.me.id)) h += '<button class="btn sm" data-act="holdAct" title="Aksiyonu turun ilerisine sakla">Aksiyonu beklet</button>';
  if (S.me.isGM && !mine) h += '<button class="btn sm" data-act="grantAct" title="Sırası olmadan tek bir aksiyon izni ver">' + (S.init.grant === tid ? 'İzin verildi' : 'İzin ver') + '</button>';
  return h + '</div>';
}
const TURN_ACTS = {
  endTurn: () => { const t = currentTurnTok(); if (!t) return; if (!S.me.isGM && S.tokens[t].owner !== S.me.id) return; stepInit(1); },
  holdAct: () => { const t = currentTurnTok(); if (!t) return; tSet(t, { act: 'hold', hold: 1, holdR: S.init.round || 1 }); chatEvent(S.tokens[t].name + ' aksiyonunu bekletiyor.'); stepInit(1); },
  grantAct: () => { if (!S.me.isGM || !S.sel) return; S.init.grant = S.init.grant === S.sel ? null : S.sel; setDoc('table/init', S.init); renderTokCard(); if (S.init.grant) chatEvent('GM, ' + S.tokens[S.sel].name + '\'e sırası dışında bir aksiyon izni verdi.'); },
  turnFree: b => { if (!S.me.isGM) return; S.init.free = !S.init.free; setDoc('table/init', S.init); renderInit(); chatEvent(S.init.free ? 'GM sıra kuralını kapattı: herkes serbest.' : 'GM sıra kuralını açtı: herkes kendi sırasında oynar.'); },
};
// sayfadan atılan saldırı/beceri zarları da dövüşte bir Aksiyondur
function gateSheetRolls() {
  ['attack', 'autofire', 'brawl', 'skill'].forEach(k => {
    const fn = ACTIONS[k]; if (!fn || fn._gated) return;
    ACTIONS[k] = (b, e) => {
      const [id, c] = activeChar(b); const tid = id && S.tokens['t_' + id] ? 't_' + id : null;
      if (turnOn() && !S.me.isGM && tid) { if (!gateAct(tid, 'act')) return; const r = fn(b, e); useAct(tid, 'act'); return r; }
      return fn(b, e);
    };
    ACTIONS[k]._gated = 1;
  });
}
// inisiyatif bonusları (kitap): Kerenzikov +2 her zaman; Sandevistan etkinken +3; Solo Initiative Reaction
function initBonus(c) {
  let b = caIr(c), notes = [];
  if (caIr(c)) notes.push('Initiative Reaction +' + caIr(c));
  const cy = (c.cyber || []).map(x => String(x.n || '').toLowerCase());
  if (cy.some(n => n.indexOf('kerenzikov') >= 0)) { b += 2; notes.push('Kerenzikov +2'); }
  else if (cy.some(n => n.indexOf('sandevistan') >= 0) && sandeActive(c)) { b += 3; notes.push('Sandevistan +3'); }
  return { b, notes };
}
function sandeActive(c) { if (!c.sande) return false; if (S.init && (S.init.order || []).length) return (S.init.round || 1) - (c.sande.r || 0) < 20; return Date.now() - (c.sande.t || 0) < 10 * 60000; }

// ===== SAYFA KİLİDİ =====
// GM onayından sonra oyuncu bu alanları elle değiştiremez; yalnızca oyun mekanikleri (hasar, ilaç, tedavi, IP) değiştirir.
const LOCK_F = /^(hp|rank|role|spBody|spHead|rep|fieldExp|doses|stats\|.*|skills\|.*|weapons\|.*|cyber\|.*)$/;
const LOCK_ACTS = ['hp', 'addWeapon', 'delWeapon', 'addCyber', 'delCyber', 'injSide', 'delCrit', 'luckReset', 'stabilize', 'critRoll', 'applyDmg', 'juryDone', 'delChar', 'lifeAll', 'lifeOne'];
const sheetLocked = c => !!(c && c.locked && !S.me.isGM && !isNpc(c));
function lockSheets() {
  document.querySelectorAll('.sheet[data-id]').forEach(sh => {
    const id = sh.dataset.id, c = S.chars[id]; if (!c) return;
    if (!isNpc(c)) {
      const old = sh.querySelector('.lockbar'); if (old) old.remove();
      sh.insertAdjacentHTML('afterbegin', lockBarHTML(id, c));
    }
    if (!sheetLocked(c)) return;
    sh.querySelectorAll('[data-f]').forEach(el => { if (LOCK_F.test(el.dataset.f)) { el.disabled = true; el.title = 'Kilitli: GM onaylı sayfa'; } });
    sh.querySelectorAll('[data-act]').forEach(el => { if (LOCK_ACTS.indexOf(el.dataset.act) >= 0) el.hidden = true; });
    sh.querySelectorAll('select[data-act="injSt"],select[data-act="armorPreset"],input[data-act="pharma"]').forEach(el => el.disabled = true);
  });
}
function lockBarHTML(id, c) {
  const E = esc(id), own = c.owner === S.me.id;
  let st, cls, btns = '';
  if (c.locked) { st = 'Kilitli · GM onaylı'; cls = 'locked'; if (S.me.isGM) btns = '<button class="btn sm" data-act="unlockChar" data-id="' + E + '">Kilidi aç</button>'; }
  else if (c.pending) { st = 'GM onayı bekliyor'; cls = 'pending'; if (S.me.isGM) btns = '<button class="btn sm primary" data-act="approveChar" data-id="' + E + '">Onayla ve kilitle</button>'; }
  else { st = 'Taslak · serbestçe düzenlenebilir'; cls = 'draft'; if (own && !S.me.isGM) btns = '<button class="btn sm primary" data-act="submitChar" data-id="' + E + '">GM onayına gönder</button>'; else if (S.me.isGM) btns = '<button class="btn sm" data-act="approveChar" data-id="' + E + '">Onayla ve kilitle</button>'; }
  if (S.me.isGM) btns += '<button class="btn sm" data-act="charLog" data-id="' + E + '">Geçmiş</button>';
  btns += ipButtonHTML(id, c);
  return '<div class="lockbar ' + cls + '"><span class="lb-st">' + st + '</span><span class="lb-ip">IP <b>' + (+c.ip || 0) + '</b></span>' + btns + '</div>';
}
const LOCK_ACTS2 = {
  submitChar: b => { const c = S.chars[b.dataset.id]; if (!c || c.owner !== S.me.id) return; c.pending = 1; S.why = 'onaya gönderildi'; saveCharNow(b.dataset.id); renderChars(); chatEvent(charLabel(c) + ' GM onayına gönderildi.'); toast('Karakterin GM onayına gönderildi.'); },
  approveChar: b => { if (!S.me.isGM) return; const c = S.chars[b.dataset.id]; c.locked = 1; c.pending = 0; S.why = 'GM onayı'; saveCharNow(b.dataset.id); renderChars(); renderCards(); chatEvent(charLabel(c) + ' onaylandı; sayfa kilitlendi.'); },
  unlockChar: b => { if (!S.me.isGM) return; const c = S.chars[b.dataset.id]; c.locked = 0; S.why = 'GM kilidi açtı'; saveCharNow(b.dataset.id); renderChars(); chatEvent(charLabel(c) + ' sayfasının kilidi GM tarafından açıldı.'); },
  charLog: b => openCharLog(b.dataset.id),
};
// ===== DEĞİŞİKLİK KAYDI =====
const AUDIT = { snap: {}, logs: {}, dismissed: new Set() };
function auditPick(c) {
  return { hp: +c.hp || 0, sp: (+c.spBody || 0) + '/' + (+c.spHead || 0), armor: c.armor || '', luck: c.luck == null ? '' : +c.luck, ip: +c.ip || 0, rank: +c.rank || 0, role: c.role || '',
    stats: STATS.map(k => k + ' ' + (+c.stats[k] || 0)).join(', '), skills: Object.entries(c.skills || {}).filter(([, v]) => +v).map(([k, v]) => k + ' ' + v).sort().join(', '),
    weapons: (c.weapons || []).map(w => w.n).join(', '), cyber: (c.cyber || []).map(x => x.n).join(', '), crits: (c.crits || []).map(x => x.n + ':' + (x.st || 'active')).join(', '), locked: c.locked ? 1 : 0 };
}
const AUDIT_TR = { hp: 'HP', sp: 'SP (gövde/kafa)', armor: 'Zırh', luck: 'LUCK', ip: 'IP', rank: 'Rütbe', role: 'Rol', stats: 'Statlar', skills: 'Beceriler', weapons: 'Silahlar', cyber: 'Cyberware', crits: 'Kritik yaralar', locked: 'Kilit' };
function auditSeed(id, c) { if (c) AUDIT.snap[id] = auditPick(c); }
function charAudit(id) {
  const c = S.chars[id]; if (!c || isNpc(c)) { S.why = null; return; }
  const before = AUDIT.snap[id], now = auditPick(c); AUDIT.snap[id] = now;
  const why = S.why || (S.me.isGM ? 'GM düzenlemesi' : 'elle düzenleme'); S.why = null;
  if (!before) return;
  if (!c.locked && /elle/.test(why) && !S.me.isGM) return;
  const ch = Object.keys(now).filter(k => String(now[k]) !== String(before[k])).map(k => ({ f: k, a: String(before[k]).slice(0, 300), b: String(now[k]).slice(0, 300) }));
  if (!ch.length) return;
  const flag = !S.me.isGM && c.locked && /elle/.test(why) && ch.some(x => x.f !== 'luck') ? 1 : 0;
  const lid = 'l' + uid(); const doc = { cid: id, cname: charLabel(c), ts: Date.now(), by: S.me.id || 'local', byName: S.me.whoName || nameOf(S.me.id), why, ch, flag };
  if (!db) { AUDIT.logs[lid] = doc; renderCards(); }
  setDoc('clog/' + lid, doc);
}
function auditSubscribe() { if (!db || !S.me.isGM) return; db.collection('clog').orderBy('ts', 'desc').limit(120).onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); AUDIT.logs = o; renderCards(); }, e => console.warn('clog', e)); }
function auditCardsHTML() {
  if (!S.me.isGM) return '';
  return Object.entries(AUDIT.logs).filter(([k, l]) => l.flag && !AUDIT.dismissed.has(k) && Date.now() - l.ts < 3 * 3600000).slice(0, 3).map(([k, l]) => '<div class="card bad"><b>⚠ ' + esc(l.cname) + ': kilitli sayfada elle değişiklik</b><p>' + esc(l.byName || 'Oyuncu') + ' · ' + l.ch.map(x => (AUDIT_TR[x.f] || x.f) + ' ' + x.a + ' → ' + x.b).join(' · ').slice(0, 220) + '</p><div class="row"><button class="btn sm" data-act="charLog" data-id="' + esc(l.cid) + '">Geçmiş</button><button class="btn sm" data-auditx="' + esc(k) + '">Kapat</button></div></div>').join('')
    + Object.entries(S.chars).filter(([, c]) => c.pending && !c.locked && !isNpc(c)).slice(0, 3).map(([id, c]) => '<div class="card gm"><b>' + esc(charLabel(c)) + ' onay bekliyor</b><p>' + esc(nameOf(c.owner)) + ' karakterini bitirdi. Sayfayı inceleyip onaylayınca kilitlenir.</p><div class="row"><button class="btn sm" data-act="openSheet" data-id="' + esc(id) + '">Sayfayı aç</button><button class="btn sm primary" data-act="approveChar" data-id="' + esc(id) + '">Onayla ve kilitle</button></div></div>').join('');
}
document.addEventListener('click', e => { const b = e.target.closest('[data-auditx]'); if (b) { AUDIT.dismissed.add(b.dataset.auditx); renderCards(); } });
function openCharLog(id) {
  const c = S.chars[id]; if (!c) return; const el = $('#caPanel');
  const rows = Object.values(AUDIT.logs).filter(l => l.cid === id).sort((a, b) => b.ts - a.ts).slice(0, 60);
  el.innerHTML = '<div class="cap-h"><b>' + esc(charLabel(c)) + ' · değişiklik geçmişi</b><button class="x" data-act="caClose" aria-label="Kapat">×</button></div>'
    + (rows.length ? '<ol class="clog">' + rows.map(l => '<li class="' + (l.flag ? 'flag' : '') + '"><div><b>' + esc(l.why) + '</b><span>' + esc(l.byName || '') + ' · ' + chatTime(l.ts) + '</span></div>' + l.ch.map(x => '<p><i>' + esc(AUDIT_TR[x.f] || x.f) + '</i> ' + esc(x.a) + ' → <b>' + esc(x.b) + '</b></p>').join('') + '</li>').join('') + '</ol>' : '<p class="hint">Bu karakter için kayıt yok.</p>');
  el.hidden = false; S.caPanel = null;
}
