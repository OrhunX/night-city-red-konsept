// ===== KARAKTER OLUŞTURMA SİHİRBAZI (kural kitabı s.73-105) =====
// Kolay: Streetrat şablonu (rol + 1d10 stat tablosu + hazır beceriler). Adım adım: Complete Package (62 stat, 86 beceri, 2550eb).
const RAT_ST = {"Rockerboy":[[7,6,6,5,6,8,7,7,3,8],[3,7,7,7,7,6,7,7,5,8],[4,5,7,7,6,6,7,7,5,8],[4,5,7,7,6,8,7,6,3,8],[3,7,7,7,6,8,6,5,4,7],[5,6,7,5,7,8,5,7,3,7],[5,6,6,7,7,8,7,6,3,6],[5,7,7,5,6,6,6,6,4,8],[3,5,5,6,7,8,7,5,5,7],[4,5,6,5,8,8,7,6,4,7]],"Solo":[[6,7,7,3,8,6,5,5,6,5],[7,8,6,3,6,6,7,5,6,6],[5,8,7,4,7,7,6,7,8,5],[5,8,6,4,6,7,6,5,7,6],[6,6,7,5,7,6,7,6,8,4],[7,7,6,5,7,6,6,7,7,5],[7,7,6,5,6,7,7,6,6,6],[7,8,7,5,6,6,5,6,8,4],[7,7,6,4,6,6,6,5,6,5],[6,6,8,5,6,6,5,6,6,5]],"Netrunner":[[5,8,7,7,7,4,8,7,7,4],[5,6,7,5,8,3,8,7,5,5],[5,6,8,6,6,4,7,6,7,4],[5,7,7,7,7,5,8,6,5,5],[5,8,8,5,7,3,7,5,5,6],[6,6,6,7,8,4,7,7,6,6],[6,6,6,7,6,5,7,7,7,6],[5,7,8,6,8,4,8,5,7,4],[7,6,7,7,6,3,6,5,6,5],[7,8,6,6,6,4,7,7,5,6]],"Tech":[[6,7,7,8,4,4,5,5,7,6],[7,6,6,7,5,3,7,7,5,5],[8,6,5,7,5,4,7,7,5,7],[7,8,7,8,4,4,6,5,6,7],[6,6,7,6,4,3,7,7,6,6],[8,7,5,6,3,3,7,6,6,7],[8,6,7,8,4,4,7,6,7,6],[8,8,7,8,5,4,6,5,6,6],[6,6,7,8,3,3,5,7,7,7],[8,8,5,6,4,4,6,5,6,6]],"Medtech":[[7,5,6,7,5,3,8,5,5,7],[6,7,7,7,4,4,6,7,7,7],[6,5,5,8,5,3,8,5,7,8],[8,7,6,8,3,5,6,6,5,7],[6,7,5,7,5,5,8,7,6,8],[8,5,5,8,5,5,6,6,5,6],[8,6,5,8,5,4,8,5,7,7],[6,5,7,7,3,5,8,5,5,8],[6,6,7,7,5,4,6,6,5,6],[8,7,6,6,3,4,8,7,6,7]],"Media":[[6,6,5,5,8,7,5,7,5,7],[8,7,7,3,6,6,6,5,6,8],[6,7,7,5,6,8,5,5,5,7],[6,5,7,5,6,7,5,5,6,6],[6,6,7,4,8,7,6,7,5,8],[7,5,5,4,8,7,6,7,5,8],[8,5,6,3,7,6,6,5,6,7],[6,5,6,5,6,8,6,6,7,8],[7,7,5,4,6,7,6,5,6,7],[7,6,6,3,7,6,7,6,7,6]],"Lawman":[[5,6,7,5,7,8,5,6,5,6],[6,6,6,5,6,8,5,7,5,5],[5,7,7,7,6,7,5,5,7,6],[6,6,7,6,6,8,5,7,7,6],[6,6,7,6,7,7,6,5,5,6],[7,6,5,5,7,8,5,6,7,4],[7,8,7,5,6,8,7,6,5,4],[5,6,6,5,6,8,5,7,6,4],[7,7,5,5,7,7,6,5,5,6],[6,6,5,6,8,7,5,7,6,6]],"Exec":[[8,5,5,3,8,6,6,5,5,7],[8,6,6,4,7,6,7,7,5,7],[8,7,6,3,8,6,7,6,4,5],[8,5,7,5,6,5,6,5,5,7],[7,7,6,5,8,5,7,7,5,6],[5,7,7,3,6,7,6,5,5,7],[6,6,7,5,8,7,6,7,4,6],[6,7,7,3,7,5,7,5,5,7],[7,6,7,5,7,5,7,6,5,5],[7,7,5,5,8,6,6,7,4,7]],"Fixer":[[8,5,7,4,6,5,8,5,5,8],[8,5,5,5,6,7,8,7,5,7],[6,6,6,4,5,6,8,6,3,8],[7,7,5,5,7,6,7,7,5,8],[8,6,6,3,6,5,8,7,5,6],[8,7,5,5,6,7,7,5,3,6],[8,6,6,5,6,5,6,7,5,8],[6,6,7,4,7,6,7,7,4,7],[8,7,7,5,5,5,7,6,5,7],[6,5,6,5,5,6,8,6,4,7]],"Nomad":[[6,6,8,3,6,7,6,6,6,4],[5,7,6,5,8,8,8,7,5,4],[5,8,6,3,8,7,6,5,6,5],[5,8,7,4,8,6,7,7,7,5],[6,6,6,3,6,7,6,7,7,4],[7,6,8,4,6,7,6,5,6,5],[6,7,8,4,6,6,7,5,7,5],[5,7,8,3,8,6,7,5,5,5],[6,7,6,4,8,6,6,6,6,6],[5,6,7,4,7,8,7,7,7,4]]};
const RAT_BASIC = ['Athletics', 'Brawling', 'Concentration', 'Conversation', 'Education', 'Evasion', 'First Aid', 'Human Perception', 'Language (Streetslang)', 'Local Expert', 'Perception', 'Persuasion', 'Stealth'];
const RAT_SK = {
  Rockerboy: [[2, 6, 2, 2, 2, 6, 6, 6, 2, 4, 2, 6, 2], { Composition: 6, Handgun: 6, 'Melee Weapon': 6, 'Personal Grooming': 4, 'Play Instrument': 6, Streetwise: 6, 'Wardrobe & Style': 4 }],
  Solo: [[2, 2, 2, 2, 2, 6, 6, 2, 2, 2, 6, 2, 2], { Autofire: 6, Handgun: 6, Interrogation: 6, 'Melee Weapon': 6, 'Resist Torture/Drugs': 6, 'Shoulder Arms': 6, Tactics: 6 }],
  Netrunner: [[2, 2, 2, 2, 6, 6, 2, 2, 2, 2, 2, 2, 6], { 'Basic Tech': 6, 'Conceal/Reveal Object': 6, Cryptography: 6, Cybertech: 6, 'Electronics/Security Tech': 6, Handgun: 6, 'Library Search': 6 }],
  Tech: [[2, 2, 2, 2, 6, 6, 6, 2, 2, 2, 2, 2, 2], { 'Basic Tech': 6, Cybertech: 6, 'Electronics/Security Tech': 6, 'Land Vehicle Tech': 6, 'Shoulder Arms': 6, Science: 6, Weaponstech: 6 }],
  Medtech: [[2, 2, 2, 6, 6, 6, 2, 6, 2, 2, 2, 2, 2], { 'Basic Tech': 6, Cybertech: 4, Deduction: 6, Paramedic: 6, 'Resist Torture/Drugs': 4, Science: 6, 'Shoulder Arms': 6 }],
  Media: [[2, 2, 2, 6, 2, 6, 2, 6, 2, 6, 6, 6, 2], { Bribery: 6, Composition: 6, Deduction: 6, Handgun: 6, 'Library Search': 4, 'Lip Reading': 4, 'Photography/Film': 4 }],
  Lawman: [[2, 6, 2, 6, 2, 6, 2, 2, 2, 2, 2, 2, 2], { Autofire: 6, Criminology: 6, Deduction: 6, Handgun: 6, Interrogation: 6, 'Shoulder Arms': 6, Tracking: 6 }],
  Exec: [[2, 2, 2, 6, 6, 6, 2, 6, 2, 2, 2, 6, 2], { Accounting: 6, Bureaucracy: 6, Business: 6, Deduction: 6, Handgun: 6, 'Lip Reading': 6, 'Personal Grooming': 4 }],
  Fixer: [[2, 2, 2, 6, 2, 6, 2, 6, 4, 6, 2, 4, 2], { Bribery: 6, Business: 6, Forgery: 6, Handgun: 6, 'Pick Lock': 4, Streetwise: 6, Trading: 6 }],
  Nomad: [[2, 6, 2, 2, 2, 6, 6, 2, 2, 2, 4, 2, 6], { 'Animal Handling': 6, 'Drive Land Vehicle': 6, Handgun: 6, 'Melee Weapon': 6, Tracking: 6, Trading: 6, 'Wilderness Survival': 6 }],
};
// kitaptaki fiyatlar (eb)
const W_PRICE = { 'Orta tabanca': 50, 'Ağır tabanca': 100, 'Çok ağır tabanca': 100, 'SMG': 100, 'Ağır SMG': 100, 'Pompalı tüfek': 500, 'Saldırı tüfeği': 500, 'Keskin nişancı tüfeği': 500, 'Yay / arbalet': 100, 'Bombaatar': 500, 'Roketatar': 500, 'Hafif yakın dövüş silahı': 50, 'Orta yakın dövüş silahı': 50, 'Ağır yakın dövüş silahı': 100, 'Çok ağır yakın dövüş silahı': 500 };
const A_PRICE = { 'Yok': 0, 'Deri': 20, 'Kevlar': 50, 'Hafif Armorjack': 100, 'Bodyweight suit': 1000, 'Orta Armorjack': 500, 'Ağır Armorjack': 1000, 'Flak': 500, 'Metalgear': 5000 };
const WIZ_STAT_PTS = 62, WIZ_SK_PTS = 86, WIZ_EB = 2550;
const WIZ_STAT_TR = { INT: 'Zekâ', REF: 'Refleks', DEX: 'Çeviklik', TECH: 'Teknik', COOL: 'Soğukkanlılık', WILL: 'İrade', LUCK: 'Şans', MOVE: 'Hareket', BODY: 'Beden', EMP: 'Empati' };
const WIZ_STEPS = { easy: ['mode', 'role', 'who', 'sum'], full: ['mode', 'role', 'stats', 'skills', 'gear', 'life', 'who', 'sum'] };
const WIZ_STEP_N = { mode: 'Yöntem', role: 'Rol', stats: 'Statlar', skills: 'Beceriler', gear: 'Ekipman', life: 'Yaşam yolu', who: 'Kimlik', sum: 'Özet' };
let WIZ = null;
const wizLS = { get() { try { return JSON.parse(localStorage.getItem('ncm-wiz') || 'null'); } catch (e) { return null; } }, set(v) { try { localStorage.setItem('ncm-wiz', JSON.stringify(v)); } catch (e) { } }, del() { try { localStorage.removeItem('ncm-wiz'); } catch (e) { } } };
const wizMe = () => (typeof FB !== 'undefined' && FB.uid) || (S.me && S.me.id) || 'local';
const wizIsGM = () => (typeof isRoomGM === 'function' ? isRoomGM() : !!(S.me && S.me.isGM));
function wizBlank() {
  const st = {}; STATS.forEach(k => st[k] = 2);
  const sk = {}; BASIC.forEach(n => sk[n] = 2); sk['Language (Ana dil)'] = 4;
  return { kind: 'pc', name: '', handle: '', role: '', rank: 4, stats: st, skills: sk, armor: 'Yok', spBody: 0, spHead: 0, weapons: [], cyber: [], life: {}, notes: '', crits: [], dsPen: 0 };
}
function openWizard(ctx) {
  const d = wizLS.get();
  WIZ = { ctx, mode: null, step: 'mode', c: wizBlank(), statSrc: 'pts', ratRoll: null, draft: d && d.ctx === ctx && d.c && (d.c.role || d.c.handle) ? d : null, skAll: false, err: '' };
  let el = document.getElementById('wiz');
  if (!el) { el = document.createElement('div'); el.id = 'wiz'; el.className = 'wiz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Karakter oluşturma'); document.body.appendChild(el); }
  el.hidden = false; wizRender();
}
function closeWizard() { const el = document.getElementById('wiz'); if (el) el.hidden = true; WIZ = null; }
function wizSave() { if (WIZ && WIZ.mode) wizLS.set({ ctx: WIZ.ctx, mode: WIZ.mode, step: WIZ.step, c: WIZ.c, statSrc: WIZ.statSrc, ratRoll: WIZ.ratRoll }); }
const wizStatSum = c => STATS.reduce((a, k) => a + (+c.stats[k] || 0), 0);
const wizSkCost = n => SKILL[n] && SKILL[n].x2 ? 2 : 1;
const wizSkUsed = c => Object.entries(c.skills).reduce((a, [n, v]) => a + Math.max(0, (+v || 0) - (FREE_SKILL[n] || 0)) * wizSkCost(n), 0);
const wizSkMin = n => n === 'Language (Ana dil)' ? 4 : BASIC.indexOf(n) >= 0 ? 2 : 0;
const wizEb = c => (c.weapons || []).reduce((a, w) => a + (W_PRICE[w.n] || 0), 0) + (A_PRICE[c.armor] || 0);
// Streetrat şablonu
function wizApplyRat(role) {
  const c = WIZ.c; c.role = role; const R = ROLE[role];
  wizRollStats(); const [b, ex] = RAT_SK[role]; const sk = {}; RAT_BASIC.forEach((n, i) => sk[n] = b[i]); Object.assign(sk, ex); sk['Language (Ana dil)'] = 4; c.skills = sk;
  c.weapons = R.w.map(mkWeapon); c.armor = R.ar; c.life = rollLife();
}
function wizRollStats() { const d = 1 + Math.floor(Math.random() * 10); WIZ.ratRoll = d; const row = RAT_ST[WIZ.c.role][d - 1]; STATS.forEach((k, i) => WIZ.c.stats[k] = row[i]); WIZ.statSrc = 'rat'; }
function wizValid(step) {
  const c = WIZ.c;
  if (step === 'mode') return WIZ.mode ? '' : 'Bir yöntem seç.';
  if (step === 'role') return c.role ? '' : 'Bir rol seç.';
  if (step === 'stats') {
    if (STATS.some(k => c.stats[k] < 2 || c.stats[k] > 8)) return 'Her stat 2 ile 8 arasında olmalı.';
    if (WIZ.statSrc === 'pts') { const s = wizStatSum(c); if (s > WIZ_STAT_PTS) return (s - WIZ_STAT_PTS) + ' puan fazla harcadın.'; if (s < WIZ_STAT_PTS) return (WIZ_STAT_PTS - s) + ' stat puanı daha dağıtmalısın.'; }
    return '';
  }
  if (step === 'skills') {
    const u = wizSkUsed(c); if (u > WIZ_SK_PTS) return (u - WIZ_SK_PTS) + ' beceri puanı fazla harcadın.';
    const low = BASIC.find(n => (+c.skills[n] || 0) < 2); if (low) return low + ' en az 2 olmalı.';
    const hi = Object.entries(c.skills).find(([n, v]) => v > 6 && !FREE_SKILL[n]); if (hi) return hi[0] + ' başlangıçta en fazla 6 olabilir.';
    return '';
  }
  if (step === 'gear') return wizEb(c) > WIZ_EB ? 'Bütçeyi ' + (wizEb(c) - WIZ_EB) + 'eb aştın.' : '';
  if (step === 'who') return (c.handle || '').trim() ? '' : 'Bir takma ad yaz.';
  return '';
}
function wizGo(to) {
  const steps = WIZ_STEPS[WIZ.mode || 'easy']; const i = steps.indexOf(WIZ.step), j = steps.indexOf(to);
  if (j > i) for (let k = i; k < j; k++) { const e = wizValid(steps[k]); if (e) { WIZ.step = steps[k]; WIZ.err = e; wizRender(); return; } }
  WIZ.step = to; WIZ.err = ''; wizSave(); wizRender();
  const b = document.querySelector('#wiz .wz-body'); if (b) b.scrollTop = 0;
}
// ---- adımlar ----
function wizModeHTML() {
  const d = WIZ.draft;
  return '<h2>Nasıl oluşturalım?</h2><p class="wz-lead">' + (WIZ.ctx === 'npc' ? 'GM\'e özel, gizli bir NPC oluşturuyorsun.' : 'İki yol var; ikisi de kural kitabına uygun.') + '</p>'
    + (d ? '<div class="wz-draft"><span>Yarım kalan taslak: <b>' + esc(d.c.handle || d.c.role || 'isimsiz') + '</b> · ' + esc(WIZ_STEP_N[d.step] || '') + ' adımında</span><button class="btn sm primary" data-w="resume">Devam et</button><button class="btn sm" data-w="dropdraft">Sil</button></div>' : '')
    + '<div class="wz-modes"><button class="wz-mode" data-w="mode" data-v="easy"><b>Kolay oluşturma</b><span>Rolünü seç; statlar kitaptaki rol tablosundan zarla, beceriler ve ekipman şablondan gelir. Sonra sadece isim ve portre.</span><i>Streetrat · 3 adım</i></button>'
    + '<button class="wz-mode" data-w="mode" data-v="full"><b>Adım adım oluşturma</b><span>62 stat puanı, 86 beceri puanı ve 2550eb ekipman bütçesini kendin dağıt; yaşam yolunu seç ya da zarla.</span><i>Complete Package · 7 adım</i></button></div>';
}
function wizRoleHTML() {
  const c = WIZ.c;
  return '<h2>Rolünü seç</h2><p class="wz-lead">Rol yeteneği rütbe 4 ile başlar.' + (WIZ.mode === 'easy' ? ' Seçtiğin anda statlar 1d10 ile rol tablosundan atılır.' : '') + '</p><div class="wz-roles">'
    + ROLES.map(r => '<button class="wz-role' + (c.role === r.k ? ' on' : '') + '" data-w="role" data-v="' + esc(r.k) + '" aria-pressed="' + (c.role === r.k) + '"><b>' + esc(r.k) + '</b><small>' + esc(r.a) + '</small><span>' + esc(r.t) + '</span><em>' + r.st.slice(0, 3).join(' · ') + '</em></button>').join('') + '</div>';
}
function wizStatsHTML() {
  const c = WIZ.c; const s = wizStatSum(c); const left = WIZ_STAT_PTS - s; const rat = WIZ.statSrc === 'rat';
  const pr = ROLE[c.role] ? ROLE[c.role].st : [];
  return '<h2>Statlar</h2><p class="wz-lead">' + (rat ? 'Kitaptaki ' + esc(c.role) + ' tablosundan atıldı (zar ' + WIZ.ratRoll + '). Tablo değerleri değiştirilmez; istersen puanla dağıtmaya dön.' : 'Her stat 2 ile 8 arasında; toplam ' + WIZ_STAT_PTS + ' puan. Rolün için önemli statlar işaretli.') + '</p>'
    + '<div class="wz-bar"><span class="wz-pool' + (rat ? '' : left < 0 ? ' bad' : left === 0 ? ' ok' : '') + '">' + (rat ? 'Tablo · zar ' + WIZ.ratRoll : 'Kalan <b>' + left + '</b> / ' + WIZ_STAT_PTS) + '</span>'
    + '<button class="btn sm" data-w="statroll">Kitap tablosundan zarla (1d10)</button>' + (rat ? '<button class="btn sm" data-w="statpts">Puanla dağıt</button>' : '<button class="btn sm" data-w="statsug">Role göre öner</button><button class="btn sm" data-w="statreset">Sıfırla</button>') + '</div>'
    + '<div class="wz-stats">' + STATS.map(k => '<div class="wz-st' + (pr.indexOf(k) >= 0 ? ' key' : '') + '"><div><b>' + k + '</b><small>' + WIZ_STAT_TR[k] + '</small></div><div class="wz-step"><button data-w="st" data-k="' + k + '" data-v="-1" aria-label="' + k + ' azalt"' + (rat || c.stats[k] <= 2 ? ' disabled' : '') + '>−</button><output>' + c.stats[k] + '</output><button data-w="st" data-k="' + k + '" data-v="1" aria-label="' + k + ' artır"' + (rat || c.stats[k] >= 8 || left <= 0 ? ' disabled' : '') + '>+</button></div></div>').join('') + '</div>'
    + '<div class="wz-derived"><span>HP <b>' + hpMax(c) + '</b></span><span>Ağır yara <b>' + Math.ceil(hpMax(c) / 2) + '</b></span><span>Ölüm zarı <b>' + c.stats.BODY + '</b></span><span>İnsanlık <b>' + c.stats.EMP * 10 + '</b></span></div>';
}
function wizSkillRow(n, rec) {
  const c = WIZ.c; const v = +c.skills[n] || 0; const sd = SKILL[n]; const min = wizSkMin(n); const nat = n === 'Language (Ana dil)';
  const left = WIZ_SK_PTS - wizSkUsed(c); const cost = wizSkCost(n);
  return '<li class="' + (rec ? 'rec' : '') + (v ? ' has' : '') + '"><span class="wz-skn">' + esc(n) + (sd && sd.x2 ? ' <i>×2</i>' : '') + '<small>' + (sd ? sd.stat : '') + (min === 2 ? ' · temel' : '') + (nat ? ' · kökenden 4 ücretsiz' : '') + '</small></span><div class="wz-step"><button data-w="sk" data-n="' + esc(n) + '" data-v="-1" aria-label="' + esc(n) + ' azalt"' + (v <= min ? ' disabled' : '') + '>−</button><output>' + v + '</output><button data-w="sk" data-n="' + esc(n) + '" data-v="1" aria-label="' + esc(n) + ' artır"' + (v >= 6 || left < cost ? ' disabled' : '') + '>+</button></div></li>';
}
function wizSkillsHTML() {
  const c = WIZ.c; const left = WIZ_SK_PTS - wizSkUsed(c); const [, ex] = RAT_SK[c.role] || [[], {}];
  const rec = RAT_BASIC.concat(Object.keys(ex)); const others = SKILLS.map(s => s[0]).filter(n => rec.indexOf(n) < 0 && !FREE_SKILL[n]);
  const cats = {}; others.forEach(n => { const k = SKILL[n].cat; (cats[k] = cats[k] || []).push(n); });
  return '<h2>Beceriler</h2><p class="wz-lead">' + WIZ_SK_PTS + ' puan. Temel beceriler en az 2, hiçbir beceri 6\'dan yüksek olamaz; ×2 işaretliler seviye başına 2 puan. Ana dil 4 seviye ücretsiz.</p>'
    + '<div class="wz-bar"><span class="wz-pool' + (left < 0 ? ' bad' : left === 0 ? ' ok' : '') + '">Kalan <b>' + left + '</b> / ' + WIZ_SK_PTS + '</span><button class="btn sm" data-w="sksug">' + esc(c.role) + ' şablonunu uygula</button><button class="btn sm" data-w="skreset">Sıfırla</button></div>'
    + '<h3>' + esc(c.role) + ' için önerilen 20 beceri</h3><ul class="wz-sk">' + rec.map(n => wizSkillRow(n, true)).join('') + wizSkillRow('Language (Ana dil)') + '</ul>'
    + '<button class="linkbtn" data-w="skall" aria-expanded="' + WIZ.skAll + '">' + (WIZ.skAll ? 'Diğer becerileri gizle' : 'Diğer beceriler (' + others.length + ')') + '</button>'
    + (WIZ.skAll ? Object.entries(cats).map(([k, list]) => '<h3>' + esc(k) + '</h3><ul class="wz-sk">' + list.map(n => wizSkillRow(n)).join('') + '</ul>').join('') : '');
}
function wizGearHTML() {
  const c = WIZ.c; const left = WIZ_EB - wizEb(c);
  return '<h2>Ekipman</h2><p class="wz-lead">Silah ve zırh için ' + WIZ_EB + 'eb. Kalan para oyunda nakit olarak kalır.</p>'
    + '<div class="wz-bar"><span class="wz-pool' + (left < 0 ? ' bad' : '') + '">Kalan <b>' + left + 'eb</b> / ' + WIZ_EB + '</span><button class="btn sm" data-w="gearsug">' + esc(c.role) + ' teçhizatı</button><button class="btn sm" data-w="gearreset">Temizle</button></div>'
    + '<h3>Silahlar</h3><ul class="wz-gear">' + Object.keys(WEAPON).map(n => { const k = c.weapons.filter(w => w.n === n).length; return '<li' + (k ? ' class="has"' : '') + '><span><b>' + esc(n) + '</b><small>' + WEAPON[n].d + ' · ' + esc(WEAPON[n].sk) + (WEAPON[n].rof ? ' · ROF ' + WEAPON[n].rof : '') + '</small></span><em>' + W_PRICE[n] + 'eb</em><div class="wz-step"><button data-w="wp" data-n="' + esc(n) + '" data-v="-1" aria-label="' + esc(n) + ' çıkar"' + (k ? '' : ' disabled') + '>−</button><output>' + k + '</output><button data-w="wp" data-n="' + esc(n) + '" data-v="1" aria-label="' + esc(n) + ' ekle"' + (W_PRICE[n] > left ? ' disabled' : '') + '>+</button></div></li>'; }).join('') + '</ul>'
    + '<h3>Zırh</h3><div class="wz-armor">' + ARMORS.map(a => '<label class="' + (c.armor === a[0] ? 'on' : '') + '"><input type="radio" name="wzar" data-w="ar" value="' + esc(a[0]) + '"' + (c.armor === a[0] ? ' checked' : '') + '><b>' + esc(a[0]) + '</b><small>SP ' + a[1] + (a[2] ? ' · −' + a[2] + ' REF/DEX/MOVE' : '') + '</small><em>' + A_PRICE[a[0]] + 'eb</em></label>').join('') + '</div>';
}
function wizLifeHTML() {
  const c = WIZ.c;
  return '<h2>Yaşam yolu</h2><p class="wz-lead">Kitaptaki tablolardan seç ya da zar at. Kültürel köken ana dilini belirler.</p><div class="wz-bar"><button class="btn sm primary" data-w="liferoll">Hepsini zarla</button><button class="btn sm" data-w="lifeclear">Temizle</button></div>'
    + '<div class="wz-life">' + Object.entries(LIFE).map(([k, L]) => '<label><span>' + esc(L.n) + '</span><div class="wz-lrow"><select data-w="life" data-k="' + k + '"><option value="">Seç…</option>' + L.v.map(v => '<option' + (c.life[k] === v ? ' selected' : '') + '>' + esc(v) + '</option>').join('') + '</select><button class="btn sm" data-w="life1" data-k="' + k + '" aria-label="' + esc(L.n) + ' zarla">d10</button></div></label>').join('') + '</div>';
}
function wizWhoHTML() {
  const c = WIZ.c; const im = c.img && c.img.url;
  return '<h2>Kimlik</h2><p class="wz-lead">Sokakta seni takma adınla tanırlar.</p><div class="wz-who"><label class="wz-portrait"><span class="wz-ph">' + (im ? '<img alt="Portre" src="' + esc(im) + '">' : 'Portre ekle') + '</span><input type="file" accept="image/*" data-w="img" hidden></label>'
    + '<div class="wz-fields"><label>Takma ad<input data-w="f" data-k="handle" maxlength="32" value="' + esc(c.handle || '') + '" placeholder="ör. Lil\'Choom" autocomplete="off"></label><label>Gerçek ad<input data-w="f" data-k="name" maxlength="48" value="' + esc(c.name || '') + '" placeholder="isteğe bağlı" autocomplete="off"></label>'
    + '<button class="linkbtn" data-w="randname">Rastgele isim öner</button>' + (im ? '<button class="linkbtn" data-w="noimg">Portreyi kaldır</button>' : '') + '<label>Notlar<textarea data-w="f" data-k="notes" rows="3" maxlength="600" placeholder="geçmişi, görünüşü, hedefi…">' + esc(c.notes || '') + '</textarea></label></div></div>';
}
function wizSumHTML() {
  const c = WIZ.c; const top = Object.entries(c.skills).filter(([, v]) => v >= 4).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const npc = WIZ.ctx === 'npc'; const fo = typeof window.FOLDER_ON !== 'undefined' && window.FOLDER_ON;
  let acts = '';
  if (WIZ.ctx === 'folder') acts = '<button class="btn primary" data-w="fin" data-v="bring">Kaydet ve masaya getir</button><button class="btn" data-w="fin" data-v="save">Sadece klasöre kaydet</button>';
  else acts = '<button class="btn primary" data-w="fin" data-v="table">' + (npc ? 'NPC olarak ekle' : 'Masaya ekle') + '</button>' + (fo ? '<label class="tog"><input type="checkbox" id="wzToFolder"> Klasörüme de kaydet</label>' : '');
  return '<h2>Özet</h2><div class="wz-sum"><div class="wz-sumh"><span class="wz-ph sm">' + (c.img ? '<img alt="" src="' + esc(c.img.url) + '">' : esc((c.handle || '?').slice(0, 1))) + '</span><div><b>' + esc(c.handle || 'İsimsiz') + '</b><small>' + esc(c.name || '') + ' · ' + esc(c.role) + ' · ' + esc(ROLE[c.role].a) + ' 4</small></div></div>'
    + '<div class="wz-stats ro">' + STATS.map(k => '<div class="wz-st"><b>' + k + '</b><output>' + c.stats[k] + '</output></div>').join('') + '</div>'
    + (WIZ.mode === 'easy' ? '<div class="wz-bar"><span class="wz-pool">Stat tablosu · zar ' + WIZ.ratRoll + '</span><button class="btn sm" data-w="sumreroll">Statları yeniden at</button><button class="btn sm" data-w="sumlife">Yaşam yolunu yeniden at</button></div>' : '')
    + '<div class="wz-derived"><span>HP <b>' + hpMax(c) + '</b></span><span>İnsanlık <b>' + c.stats.EMP * 10 + '</b></span><span>Zırh <b>' + esc(c.armor) + ' · SP ' + (ARMOR[c.armor] || 0) + '</b></span></div>'
    + '<p><b>Öne çıkan beceriler:</b> ' + top.map(([n, v]) => esc(n) + ' ' + v).join(', ') + '</p>'
    + '<p><b>Silahlar:</b> ' + (c.weapons.map(w => esc(w.n)).join(', ') || 'yok') + '</p>'
    + (Object.keys(c.life || {}).length ? '<p><b>Yaşam yolu:</b> ' + Object.entries(c.life).filter(([, v]) => v).slice(0, 5).map(([k, v]) => esc(LIFE[k] ? LIFE[k].n : k) + ': ' + esc(v)).join(' · ') + (Object.keys(c.life).length > 5 ? ' …' : '') + '</p>' : '')
    + (!npc && WIZ.ctx === 'table' && !wizIsGM() ? '<p class="hint">Masaya eklenince sayfan GM onayına gider; onaylanınca kilitlenir.</p>' : '')
    + '</div><div class="wz-fin">' + acts + '</div>';
}
function wizRender() {
  const el = document.getElementById('wiz'); if (!el || !WIZ) return;
  const steps = WIZ_STEPS[WIZ.mode || 'easy']; const i = steps.indexOf(WIZ.step);
  const body = { mode: wizModeHTML, role: wizRoleHTML, stats: wizStatsHTML, skills: wizSkillsHTML, gear: wizGearHTML, life: wizLifeHTML, who: wizWhoHTML, sum: wizSumHTML }[WIZ.step]();
  const title = WIZ.ctx === 'npc' ? 'NPC oluştur' : 'Karakter oluştur';
  el.innerHTML = '<div class="wz-top"><b class="wz-title">' + title + '</b>' + (WIZ.mode ? '<ol class="wz-prog">' + steps.map((s, k) => '<li class="' + (k < i ? 'done' : k === i ? 'cur' : '') + '"><button data-w="go" data-v="' + s + '"' + (k === i ? ' aria-current="step"' : '') + '><span>' + (k + 1) + '</span>' + WIZ_STEP_N[s] + '</button></li>').join('') + '</ol>' : '<span></span>') + '<button class="x" data-w="close" aria-label="Kapat">×</button></div>'
    + '<div class="wz-body"><div class="wz-in">' + body + '</div></div>'
    + '<div class="wz-foot"><span class="wz-err" role="alert">' + esc(WIZ.err || '') + '</span>' + (i > 0 ? '<button class="btn" data-w="back">Geri</button>' : '') + (WIZ.step !== 'sum' && WIZ.step !== 'mode' ? '<button class="btn primary" data-w="next">İleri</button>' : '') + '</div>';
  el.classList.toggle('has-err', !!WIZ.err);
}
function wizPortrait(file) {
  return new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 200; const s = Math.min(im.naturalWidth, im.naturalHeight); cv.getContext('2d').drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) * 0.35, s, s, 0, 0, 200, 200); URL.revokeObjectURL(im.src); res(cv.toDataURL('image/jpeg', 0.8)); };
    im.onerror = rej; im.src = URL.createObjectURL(file);
  });
}
function wizFinalChar() {
  const c = clone(WIZ.c); c.handle = c.handle.trim().slice(0, 32); c.name = (c.name || '').trim().slice(0, 48);
  c.spBody = c.spHead = ARMOR[c.armor] || 0; c.hp = hpMax(c); c.luck = c.stats.LUCK; c.ts = Date.now(); c.owner = wizMe(); c.locked = false;
  if (WIZ.ctx === 'npc') { c.kind = 'npc'; c.arche = 'solo'; c.tier = 'vet'; c.hidden = true; c.quirk = c.quirk || ''; }
  return c;
}
async function wizFinish(how, btn) {
  const c = wizFinalChar(); if (btn) btn.disabled = true;
  try {
    if (WIZ.ctx === 'folder') {
      const fid = await folderSave(c); fMsg(charLabel(c) + ' klasöre kaydedildi.');
      if (how === 'bring') await folderBring(fid);
    } else {
      const npc = WIZ.ctx === 'npc'; const toF = document.getElementById('wzToFolder'); const id = (npc ? 'n_' : 'c_') + uid();
      if (toF && toF.checked && typeof folderSave === 'function') { try { c.src = await folderSave(c); } catch (e) { } }
      if (!npc && !S.me.isGM) c.pending = true;
      S.chars[id] = c; await setDoc(charPath(id), c);
      S.charSel = id; if (!npc) { if (S.map || (typeof curMap === 'function' && curMap())) placeToken(id, c); }
      renderChars(); if (typeof chatEvent === 'function' && !npc) chatEvent(charLabel(c) + ' (' + c.role + ') masaya katıldı.' + (c.pending ? ' GM onayı bekliyor.' : ''));
      toast(charLabel(c) + (npc ? ' NPC olarak eklendi (gizli).' : ' masada.' + (c.pending ? ' Sayfa GM onayına gönderildi.' : '')));
    }
    wizLS.del(); closeWizard();
  } catch (e) { WIZ.err = 'Kaydedilemedi: ' + (e.code || e.message || e); wizRender(); }
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-wiz]'); if (o) { e.preventDefault(); openWizard(o.dataset.wiz); return; }
  const b = e.target.closest('#wiz [data-w]'); if (!b || !WIZ) return; const w = b.dataset.w, c = WIZ.c; const steps = WIZ_STEPS[WIZ.mode || 'easy'];
  if (b.tagName === 'SELECT' || (b.tagName === 'INPUT' && b.type !== 'radio') || b.tagName === 'TEXTAREA') return;
  WIZ.err = '';
  if (w === 'close') return closeWizard();
  if (w === 'mode') { WIZ.mode = b.dataset.v; WIZ.c = wizBlank(); WIZ.statSrc = 'pts'; WIZ.draft = null; return wizGo('role'); }
  if (w === 'resume') { const d = WIZ.draft; Object.assign(WIZ, { mode: d.mode, c: d.c, statSrc: d.statSrc || 'pts', ratRoll: d.ratRoll, draft: null }); return wizGo(d.step || 'role'); }
  if (w === 'dropdraft') { wizLS.del(); WIZ.draft = null; return wizRender(); }
  if (w === 'go') { const to = b.dataset.v; if (to === 'mode') { WIZ.step = 'mode'; return wizRender(); } return wizGo(to); }
  if (w === 'back') { const i = steps.indexOf(WIZ.step); return wizGo(steps[Math.max(0, i - 1)]); }
  if (w === 'next') { const e2 = wizValid(WIZ.step); if (e2) { WIZ.err = e2; return wizRender(); } const i = steps.indexOf(WIZ.step); return wizGo(steps[i + 1]); }
  if (w === 'role') {
    const r = b.dataset.v; if (WIZ.mode === 'easy') wizApplyRat(r);
    else { const prev = c.role; c.role = r; if (!prev) { c.weapons = []; } }
    wizSave(); return WIZ.mode === 'easy' ? wizGo('who') : wizGo('stats');
  }
  if (w === 'st') { if (WIZ.statSrc !== 'pts') return; const k = b.dataset.k; c.stats[k] = Math.max(2, Math.min(8, c.stats[k] + (+b.dataset.v))); }
  if (w === 'statroll') wizRollStats();
  if (w === 'statpts') { WIZ.statSrc = 'pts'; }
  if (w === 'statreset') { STATS.forEach(k => c.stats[k] = 2); }
  if (w === 'statsug') { WIZ.statSrc = 'pts'; c.stats = genStats(ROLE[c.role].st, WIZ_STAT_PTS, 2, 8); }
  if (w === 'sk') { const n = b.dataset.n; const v = (+c.skills[n] || 0) + (+b.dataset.v); if (v < wizSkMin(n) || v > 6) return; if (+b.dataset.v > 0 && WIZ_SK_PTS - wizSkUsed(c) < wizSkCost(n)) return; if (v) c.skills[n] = v; else delete c.skills[n]; }
  if (w === 'sksug') { const [bb, ex] = RAT_SK[c.role]; const sk = {}; RAT_BASIC.forEach((n, i) => sk[n] = bb[i]); Object.assign(sk, ex); sk['Language (Ana dil)'] = 4; c.skills = sk; }
  if (w === 'skreset') { const sk = {}; BASIC.forEach(n => sk[n] = 2); sk['Language (Ana dil)'] = 4; c.skills = sk; }
  if (w === 'skall') WIZ.skAll = !WIZ.skAll;
  if (w === 'wp') { const n = b.dataset.n; if (+b.dataset.v > 0) { if (W_PRICE[n] <= WIZ_EB - wizEb(c)) c.weapons.push(mkWeapon(n)); } else { const i = c.weapons.map(x => x.n).lastIndexOf(n); if (i >= 0) c.weapons.splice(i, 1); } }
  if (w === 'gearsug') { c.weapons = ROLE[c.role].w.map(mkWeapon); c.armor = ROLE[c.role].ar; }
  if (w === 'gearreset') { c.weapons = []; c.armor = 'Yok'; }
  if (w === 'liferoll' || w === 'sumlife') c.life = rollLife();
  if (w === 'lifeclear') c.life = {};
  if (w === 'life1') { const k = b.dataset.k; c.life[k] = rpick(LIFE[k].v); }
  if (w === 'randname') { c.handle = rpick(HANDLES); c.name = rpick(FIRST) + ' ' + rpick(LAST); }
  if (w === 'noimg') delete c.img;
  if (w === 'sumreroll') wizRollStats();
  if (w === 'fin') return wizFinish(b.dataset.v, b);
  if (w === 'ar') return;
  wizSave(); wizRender();
});
document.addEventListener('change', async e => {
  const t = e.target; if (!WIZ || !t.closest || !t.closest('#wiz')) return; const w = t.dataset.w, c = WIZ.c;
  if (w === 'ar') { c.armor = t.value; if (wizEb(c) > WIZ_EB) WIZ.err = 'Bu zırhla bütçe aşılıyor.'; wizSave(); wizRender(); }
  if (w === 'life') { if (t.value) c.life[t.dataset.k] = t.value; else delete c.life[t.dataset.k]; wizSave(); }
  if (w === 'img') { const f = t.files && t.files[0]; if (!f) return; try { c.img = { url: await wizPortrait(f) }; } catch (err) { WIZ.err = 'Görsel okunamadı.'; } wizSave(); wizRender(); }
});
document.addEventListener('input', e => { const t = e.target; if (!WIZ || t.dataset.w !== 'f' || !t.closest('#wiz')) return; WIZ.c[t.dataset.k] = t.value; if (WIZ.err && t.dataset.k === 'handle') { WIZ.err = ''; const er = document.querySelector('#wiz .wz-err'); if (er) er.textContent = ''; } wizSave(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && WIZ && !document.getElementById('wiz').hidden) { e.stopPropagation(); closeWizard(); } }, true);
