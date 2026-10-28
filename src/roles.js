// ===== ROL YETENEKLERİ: dövüşte kullanılanlar (Core Rulebook) =====
// Solo: Combat Awareness · Medtech: Medicine (ilaçlar) · Tech: Maker (saha tamiri) · Lawman: Backup · Nomad: Moto
// Netrunner (Interface) net.js'de. Rockerboy, Media, Exec ve Fixer'ın rol yetenekleri dövüş yeteneği değildir.

// ---- Solo · Combat Awareness ----
const CA = [
  { k: 'dd', n: 'Damage Deflection', step: 2, max: 10, d: n => n ? 'Turda aldığın ilk hasar −' + (n / 2) : '2 puan başına turdaki ilk hasar −1' },
  { k: 'fr', n: 'Fumble Recovery', step: 4, max: 4, d: n => n ? 'Saldırıda 1 gelince ek zar düşülmez' : '4 puan: saldırıda kritik başarısızlık yok' },
  { k: 'ir', n: 'Initiative Reaction', step: 1, max: 10, d: n => n ? 'İnisiyatif +' + n : 'puan başına inisiyatif +1' },
  { k: 'pa', n: 'Precision Attack', step: 3, max: 9, d: n => n ? 'Saldırılara +' + (n / 3) : '3 puan başına saldırılara +1' },
  { k: 'sw', n: 'Spot Weakness', step: 1, max: 10, d: n => n ? 'Turdaki ilk isabetli saldırıya +' + n + ' hasar (zırhtan önce)' : 'puan başına ilk isabete +1 hasar' },
  { k: 'td', n: 'Threat Detection', step: 1, max: 10, d: n => n ? 'Perception +' + n : 'puan başına Perception +1' },
];
function caOf(c) { if (roleOf(c) !== 'Solo') return null; const o = { dd: 0, fr: 0, ir: 0, pa: 0, sw: 0, td: 0 }; return Object.assign(o, c.ca || {}); }
const caSum = ca => ca ? ca.dd + ca.fr + ca.ir + ca.pa + ca.sw + ca.td : 0;
const caPa = c => { const a = caOf(c); return a ? Math.floor(Math.min(9, a.pa) / 3) : 0; };
const caDd = c => { const a = caOf(c); return a ? Math.floor(Math.min(10, a.dd) / 2) : 0; };
const caFr = c => { const a = caOf(c); return !!(a && a.fr >= 4); };
const caIr = c => { const a = caOf(c); return a ? a.ir : 0; };
const caSw = c => { const a = caOf(c); return a ? a.sw : 0; };
const caTd = c => { const a = caOf(c); return a ? a.td : 0; };
const roundKey = () => (S.init && (S.init.order || []).length) ? (S.init.round || 1) : null;
function caHTML(id, c, ed) {
  const a = caOf(c); const r = rankOf(c); const used = caSum(a);
  return '<div class="ca"><div class="ca-h"><b>Combat Awareness</b><span class="mono">' + used + ' / ' + r + ' puan</span></div>' + CA.map(x => {
    const n = a[x.k];
    return '<div class="ca-r"><span class="ca-n">' + x.n + '<small>' + esc(x.d(n)) + '</small></span>' + (ed ? '<button class="pm" data-act="caStep" data-id="' + esc(id) + '" data-k="' + x.k + '" data-v="-1" aria-label="' + x.n + ' azalt"' + (n ? '' : ' disabled') + '>−</button>' : '') + '<b class="mono">' + n + '</b>' + (ed ? '<button class="pm" data-act="caStep" data-id="' + esc(id) + '" data-k="' + x.k + '" data-v="1" aria-label="' + x.n + ' artır"' + (n + x.step <= x.max && used + x.step <= r ? '' : ' disabled') + '>+</button>' : '') + '</div>';
  }).join('') + '<p class="hint">Dövüş başlarken (inisiyatiften önce) ücretsiz, dövüş içinde bir Aksiyon harcayarak yeniden dağıtılır.</p></div>';
}

// ---- Medtech · ilaçlar ----
const DRUGS = {
  speed: { n: 'Speedheal', d: 'Ölümcül yaralı değilse anında BODY + WILL kadar HP. Günde bir.' },
  stim: { n: 'Stim', d: 'Bir saat boyunca ağır yara cezası yok. Günde bir.' },
  detox: { n: 'Rapidetox', d: 'Uyuşturucu, zehir ve sarhoşluk etkilerini anında temizler.' },
};
function pharmaOf(c) { return Array.isArray(c.pharma) ? c.pharma : ['speed', 'stim']; }
// ---- Tech · saha tamiri (armor) ----
const ARMOR_DV = { 'Deri': 9, 'Kevlar': 13, 'Hafif Armorjack': 17, 'Bodyweight suit': 24, 'Orta Armorjack': 17, 'Ağır Armorjack': 21, 'Flak': 21, 'Metalgear': 29 };
const fieldExp = c => c.fieldExp != null ? +c.fieldExp : rankOf(c);
const FIELD_SK = ['Basic Tech', 'Cybertech', 'Electronics/Security Tech', 'Weaponstech', 'Land Vehicle Tech', 'Sea Vehicle Tech', 'Air Vehicle Tech'];
const MOTO_SK = ['Drive Land Vehicle', 'Pilot Air Vehicle', 'Pilot Sea Vehicle', 'Air Vehicle Tech', 'Land Vehicle Tech', 'Sea Vehicle Tech'];
// sayfa beceri atışları için rol bonusu
function roleSkillBonus(c, sk) {
  const r = roleOf(c), out = [];
  if (r === 'Tech' && FIELD_SK.indexOf(sk) >= 0 && fieldExp(c)) out.push(['Field Expertise', fieldExp(c)]);
  if (r === 'Nomad' && MOTO_SK.indexOf(sk) >= 0 && rankOf(c)) out.push(['Moto', rankOf(c)]);
  return out;
}

// ---- Nomad · aile araçları ----
const VEH = {
  roadbike: { n: 'Roadbike', sdp: 35, move: 20, r: 1 },
  compact: { n: 'Compact Groundcar', sdp: 50, move: 20, r: 1 },
  hpcar: { n: 'High Performance Groundcar', sdp: 50, move: 40, r: 5 },
  superbike: { n: 'Superbike', sdp: 35, move: 60, r: 7 },
  supercar: { n: 'Super Groundcar', sdp: 50, move: 60, r: 9 },
};
const RAM_DV = 13;

// ---- Lawman · Backup ----
const BACKUP = [
  { n: 'Kurum güvenliği', cn: 8, sp: 7, hp: 20, mb: 4, k: 4, ar: 'Kevlar', w: ['Ağır tabanca'], d: 'Dört kiralık güvenlikçi, yaya gelir.' },
  { n: 'Devriye polisi', cn: 10, sp: 7, hp: 25, mb: 5, k: 4, ar: 'Kevlar', w: ['Ağır tabanca'], d: 'Dört devriye polisi, iki Compact Groundcar ile.' },
  { n: 'Şerif yardımcısı', cn: 14, sp: 13, hp: 35, mb: 4, k: 2, ar: 'Ağır Armorjack', w: ['Ağır tabanca', 'Saldırı tüfeği'], d: 'İki "County Mountie", High Performance Groundcar ile.' },
  { n: 'Recovery Zone Marshal', cn: 16, sp: 15, hp: 50, mb: 6, k: 1, ar: 'Flak', w: ['Çok ağır tabanca', 'Saldırı tüfeği', 'Bombaatar'], d: 'Tek başına bir marshal, Superbike ile.' },
  { n: 'C-SWAT', cn: 15, sp: 18, hp: 35, mb: 4, k: 2, ar: 'Metalgear', w: ['Saldırı tüfeği', 'Roketatar'], d: 'Psiko Ekip\'ten iki ağır silahlı, AV-4 ile havadan.' },
  { n: 'Federal ajan', cn: 14, sp: 11, hp: 35, mb: 6, k: 2, ar: 'Hafif Armorjack', w: ['Çok ağır tabanca', 'Saldırı tüfeği'], d: 'İki federal ajan, AV-4 ile; olaydan sonra da kalırlar.' },
];
const backupTier = r => r >= 10 ? 5 : r >= 9 ? 4 : r >= 8 ? 3 : r >= 5 ? 2 : r >= 3 ? 1 : 0;
const BK = { list: [] };
const WILL_FOR = { 20: [4, 0], 25: [5, 1], 35: [4, 6], 50: [6, 10] };
function makeBackupNPC(tier, i) {
  const B = BACKUP[tier]; const pen = ARMOR_PEN[B.ar] || 0;
  const body = B.mb; let will = Math.max(0, (Math.ceil((B.hp - 10) / 5) * 2) - body); while (10 + 5 * Math.ceil((body + will) / 2) > B.hp && will > 0) will--;
  const stats = { INT: 5, REF: 6 + pen, DEX: 6 + pen, TECH: 4, COOL: 6, WILL: will, LUCK: 0, MOVE: B.mb + pen, BODY: body, EMP: 4 };
  const sk = B.cn - 6; const skills = { Handgun: sk, 'Shoulder Arms': sk, 'Heavy Weapons': sk, Brawling: sk, Evasion: sk, Perception: sk, 'Melee Weapon': sk };
  const c = { kind: 'npc', arche: 'ncpd', tier: 'vet', name: B.n + ' ' + (i + 1), handle: '', role: '', rank: 0, stats, skills, armor: B.ar, spBody: B.sp, spHead: B.sp, weapons: B.w.map(mkWeapon), cyber: [], life: {}, quirk: '', notes: 'Lawman desteği · Combat Number ' + B.cn + ' · mermiden kaçamaz.', crits: [], dsPen: 0, hidden: false, ally: 1, owner: S.me.id, ts: Date.now() };
  c.hp = hpMax(c); c.luck = 0; return c;
}
async function spawnBackup(item) {
  const m = S.map || curMap(); if (!m) return;
  const law = S.tokens[item.law]; const from = law || { x: Math.floor(m.w / 2), y: Math.floor(m.h / 2) };
  // en yakın kenar: oradan içeri doğru boş kareler
  const edges = []; for (let x = 0; x < m.w; x++) { edges.push({ x, y: 0 }, { x, y: m.h - 1 }); } for (let y = 0; y < m.h; y++) { edges.push({ x: 0, y }, { x: m.w - 1, y }); }
  let start = null, best = 1e9; edges.forEach(p => { if (!walkable(m, p.x, p.y)) return; const dd = sq(p, from); if (dd < best) { best = dd; start = p; } });
  if (!start) start = from;
  const groups = item.two ? [item.tier, item.tier] : [item.tier];
  const cells = []; const taken = new Set(); const q = [start]; taken.add(start.x + ',' + start.y);
  const need = groups.reduce((a, t) => a + BACKUP[t].k, 0);
  while (q.length && cells.length < need) { const p = q.shift(); if (walkable(m, p.x, p.y) && !tokenAt(p)) cells.push(p); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = { x: p.x + dx, y: p.y + dy }; const k = n.x + ',' + n.y; if (!taken.has(k) && n.x >= 0 && n.y >= 0 && n.x < m.w && n.y < m.h) { taken.add(k); q.push(n); } } }
  let ci = 0;
  for (const t of groups) for (let i = 0; i < BACKUP[t].k && ci < cells.length; i++) {
    const c = makeBackupNPC(t, i); const id = 'bk' + uid();
    S.chars[id] = c; await setDoc(charPath(id), c);
    await placeTokenAt(id, c, cells[ci++]);
    const tid = 't_' + id; if (S.tokens[tid]) { S.tokens[tid].color = '#41cfd6'; S.tokens[tid].hidden = false; setDoc(tokPath(tid), S.tokens[tid]); }
    playFx({ k: 'text', b: tid, txt: 'DESTEK', col: '#41cfd6' });
  }
  Sound.play('ok');
  toast((law ? law.name + ' için ' : '') + 'destek geldi: ' + groups.map(t => BACKUP[t].n).join(' + ') + '.');
  renderChars();
}
function bkSave() { setDoc('table/backup', { list: BK.list }); renderCards(); }
function applyBackup(d) { BK.list = (d && d.list) || []; renderCards(); }
setInterval(() => {
  if (!S.me.isGM) return; const r = roundKey(); if (!r) return;
  const due = BK.list.filter(x => x.at && r >= x.at && !x.done);
  if (!due.length) return;
  due.forEach(x => x.done = 1); BK.list = BK.list.filter(x => !x.done); bkSave();
  (async () => { for (const x of due) await spawnBackup(x); })();
}, 2000);
async function callBackup(tid) {
  const t = S.tokens[tid]; const c = tokChar(t); const r = rankOf(c);
  const g = await physRoll([{ n: 1, s: 10 }], 'Backup çağrısı', { who: charLabel(c), tone: gs => gs[0].vals[0] <= r ? { tone: 'ok', msg: 'CEVAP VAR', sub: 'd10 ≤ Backup ' + r } : { tone: 'fail', msg: 'CEVAP YOK', sub: 'd10 > Backup ' + r } });
  const d = g[0].vals[0];
  if (d > r) { await logRoll({ who: charLabel(c), label: 'Backup çağrısı', total: d, detail: 'd10 [' + d + '] > Backup ' + r + ' · kimse cevap vermedi. Sonraki tur tekrar denenebilir.', kind: 'check', ok: false }); playFx({ k: 'talk', b: tid, txt: 'CEVAP YOK', col: '#929b96' }); return; }
  const g2 = await physRoll([{ n: 1, s: 6 }], 'Desteğin varışı (tur)', { who: charLabel(c) });
  const rounds = g2[0].vals[0]; let tier = backupTier(r), two = false;
  if (rounds === 6) { if (r >= 10) two = true; else tier = Math.min(5, tier + 1); }
  const now = roundKey();
  BK.list = BK.list.concat([{ id: 'b' + uid(), law: tid, lawN: t.name, tier, two, rounds, at: now ? now + rounds : null, ts: Date.now() }]); bkSave();
  playFx({ k: 'talk', b: tid, txt: 'DESTEK YOLDA · ' + rounds + ' TUR', col: '#41cfd6' });
  await logRoll({ who: charLabel(c), label: 'Backup çağrısı', total: d, detail: 'd10 [' + d + '] ≤ Backup ' + r + ' · ' + (two ? 'iki ayrı ' : '') + BACKUP[tier].n + ' ' + rounds + ' tur içinde geliyor' + (rounds === 6 && !two ? ' (6 geldi: bir üst kademe)' : '') + '. ' + BACKUP[tier].d, kind: 'check', ok: true });
}
// GM kartları: yoldaki destekler
function backupCardsHTML() {
  if (!S.me.isGM || !BK.list.length) return '';
  return BK.list.map(x => '<div class="card gm"><b>Destek yolda: ' + esc((x.two ? '2 × ' : '') + BACKUP[x.tier].n) + '</b><p>' + esc(x.lawN) + ' çağırdı · ' + (x.at ? x.at + '. turda gelir (inisiyatif açık)' : x.rounds + ' tur sonra; inisiyatif kapalı olduğu için elle getir') + '</p><div class="row"><button class="btn sm primary" data-bk="' + esc(x.id) + '">Şimdi getir</button><button class="btn sm" data-bkx="' + esc(x.id) + '">İptal</button></div></div>').join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-bk],[data-bkx]'); if (!b) return;
  const id = b.dataset.bk || b.dataset.bkx; const x = BK.list.find(y => y.id === id); if (!x) return;
  BK.list = BK.list.filter(y => y.id !== id); bkSave();
  if (b.dataset.bk) spawnBackup(x);
});

// ---- dövüş menüsü bölümü ----
function roleMenuHTML(actor, target, c, it) {
  const r = roleOf(c), rk = rankOf(c), a = S.tokens[actor];
  if (!r || !rk) return '';
  if (['Rockerboy', 'Media', 'Fixer', 'Exec'].indexOf(r) >= 0) return role2MenuHTML(actor, target, c, it);
  let h = '';
  if (r === 'Solo') {
    const ca = caOf(c);
    h = it('ca', 'Combat Awareness dağıt', caSum(ca) + '/' + rk + ' puan · ' + (CA.filter(x => ca[x.k]).map(x => x.n.split(' ')[0] + ' ' + ca[x.k]).join(', ') || 'dağıtılmamış'));
  } else if (r === 'Netrunner') {
    const L = naLeft(actor); const tk = a;
    h += '<p class="hint">' + (L.free ? 'İnisiyatif kapalı: NET aksiyonu sınırsız.' : 'Bu tur NET aksiyonu: ' + L.left + '/' + L.mx) + (tk.net ? ' · Bağlı' + (tk.net.pw ? '' : ' (şifre önünde)') : '') + '</p>';
    if (!tk.net) { const aps = apInRange(actor); h += aps.length ? it('netin', 'Jack In', 'Yakındaki erişim noktasına bağlan · 1 NET aksiyonu') : '<p class="hint">Jack In için bir erişim noktasının 6 m yakınına git (haritada anten simgesi).</p>'; h += it('netscan', 'Scanner', 'Interface + d10 · gizli sistemleri ve erişim noktalarını bul (Meat Action)'); h += it('zap', 'Zap', 'Önce Jack In yapmalısın; Zap NET içinde kullanılır.', ' disabled'); }
    else {
      if (!tk.net.pw) h += it('netbd', 'Backdoor', 'Interface + d10 vs şifre DV' + netPw());
      const held = devList().filter(d => devSt(d.id).ctl === actor);
      held.forEach(d => { h += '<div class="am-row">' + opsMenu(d) + '</div>'; });
      if (tk.net.pw) h += '<p class="hint">Haritadaki bir sisteme tıklayıp "Kontrolü ele geçir" de. ' + devList().filter(d => d.t !== 'ap' && devVis(d) && devSt(d.id).ctl !== actor).length + ' sistem kontrolünde değil.</p>';
      const tt = target && S.tokens[target];
      const foes = Object.keys(S.tokens).filter(k => k !== actor && S.tokens[k].net && !(S.tokens[k].hidden && !S.me.isGM));
      if (tt && tt.net && target !== actor) h += it('zap', 'Zap · ' + tt.name, 'Interface + d10 ↔ Interface + d10 · 1d6 doğrudan beyne · 1 NET aksiyonu');
      else if (foes.length) h += it('zap', 'Zap', foes.length + ' bağlı Netrunner var · hedef seç · 1d6 doğrudan beyne');
      else h += it('zap', 'Zap', 'Bu mimaride bağlı bir düşman Netrunner yok. Kitaba göre Zap sadece NET içindeki bir Netrunner\'a ya da programa yapılır.', ' disabled');
      h += it('netout', 'Jack Out', 'Bağlantıyı güvenle kes · 1 NET aksiyonu');
    }
  } else if (r === 'Medtech') {
    const ph = pharmaOf(c); const doses = c.doses;
    h += ph.map(k => it('drug', DRUGS[k].n + (target ? ' → ' + S.tokens[target].name : ' → kendine'), DRUGS[k].d + (doses != null && doses !== '' ? ' · ' + doses + ' doz' : ''), ' data-drug="' + k + '"')).join('') || '<p class="hint">Sayfada bilinen ilaç seçili değil.</p>';
  } else if (r === 'Tech') {
    const tc = target ? tokChar(S.tokens[target]) : c;
    h += it('jury', 'Saha tamiri · zırh' + (target ? ' → ' + S.tokens[target].name : ' (kendi)'), 'TECH + Basic Tech + Field Expertise ' + fieldExp(c) + (tc && ARMOR_DV[tc.armor] ? ' vs DV' + ARMOR_DV[tc.armor] : '') + ' · SP tam dolar, ' + (10 * fieldExp(c)) + ' dk dayanır');
  } else if (r === 'Lawman') {
    const t = backupTier(rk);
    h += it('backup', 'Destek çağır', 'd10 ≤ Backup ' + rk + ' · ' + BACKUP[t].n + ' (' + BACKUP[t].k + ' kişi), d6 tur içinde');
  } else if (r === 'Nomad') {
    if (!a.veh) h += Object.entries(VEH).filter(([, v]) => v.r <= rk).map(([k, v]) => it('vehin', 'Aracına bin · ' + v.n, 'SDP ' + v.sdp + ' · MOVE ' + v.move, ' data-veh="' + k + '"')).join('');
    else {
      h += '<p class="hint">' + esc(a.veh.n) + ' · SDP ' + a.veh.sdp + '/' + a.veh.max + ' · MOVE ' + a.veh.move + '</p>';
      h += '<div class="am-row">' + it('man13', 'Manevra DV13', 'savrulma, keskin dönüş, ani fren') + it('man17', 'Manevra DV17', 'bootleg dönüşü, atlama') + '</div>';
      if (target) h += it('ram', 'Çarp · ' + S.tokens[target].name, '6d6 hem hedefe hem araca · DV13 kaçma · Whiplash');
      h += it('vehout', 'Araçtan in', '');
    }
  }
  return h ? '<div class="am-sec role"><h5>' + esc(ROLE[r] ? ROLE[r].a : r) + ' · rütbe ' + rk + '</h5>' + h + '</div>' : '';
}
function opsMenu(d) {
  const s = devSt(d.id); const nm = DEV_T[d.t].n;
  const b = (op, lab, sub) => '<button class="am-it" data-am="devop" data-d="' + d.id + '" data-op="' + op + '"><span>' + esc(lab) + '</span><small>' + esc(sub || nm) + '</small></button>';
  if (d.t === 'door') { const st = doorState(d); return (st !== 'open' ? b('open', 'Kapıyı aç') : '') + (st !== 'locked' ? b('locked', 'Kilitle') : b('closed', 'Kilidi aç')); }
  if (d.t === 'cam') return (s.off ? '' : b('watch', 'Kamerayı izle')) + b('loop', s.off ? 'Kamerayı aç' : 'Döngüye al');
  if (d.t === 'tur') return s.dead ? '' : (s.off ? '' : b('fire', 'Taret ateşi', 'CN 14 · 5d6')) + b('toggle', s.off ? 'Tareti aç' : 'Tareti kapat');
  return '';
}
// menüden seçim
const ACT_PICKS = ['ca', 'backup', 'vehin', 'man13', 'man17', 'netscan', 'sande'];
function roleMenuPick(k, actor, target, b) {
  const a = S.tokens[actor]; const c = tokChar(a); if (!c) return false;
  if (role2MenuPick(k, actor, target, b)) return true;
  if (ACT_PICKS.indexOf(k) >= 0 && turnOn()) { if (k === 'ca' && turnOn() && !S.me.isGM) { if (!gateAct(actor, 'act')) return true; useAct(actor, 'act'); } else if (k !== 'ca') { if (!gateAct(actor, 'act')) return true; useAct(actor, 'act'); } }
  if (k === 'sande') { if (sandeActive(c)) { toast('Sandevistan zaten etkin.'); return true; } if (c.sandeDay === S.day && c.sandeDay != null) { toast('Sandevistan bir saat dolmadan yeniden etkinleştirilemez.', 'err'); return true; } c.sande = { r: S.init.round || 0, t: Date.now() }; c.sandeDay = S.day || 0; S.why = 'Sandevistan'; saveCharNow(a.charId); playFx({ k: 'scan', b: actor, txt: 'SANDEVISTAN', col: '#41cfd6' }); chatEvent(a.name + ' Sandevistan\'ı etkinleştirdi (inisiyatif +3).'); return true; }
  if (k === 'ca') { openCaPanel(a.charId); return true; }
  if (k === 'netin') { netJackIn(actor); return true; }
  if (k === 'netout') { netJackOut(actor); return true; }
  if (k === 'netbd') { lockRoll(() => netBackdoor(actor)); return true; }
  if (k === 'netscan') { lockRoll(() => netScanner(actor)); return true; }
  if (k === 'zap') { const tt = target && S.tokens[target]; if (tt && tt.net && target !== actor) netZap(actor, target); else startTargeting({ mode: 'zap', actor, max: 1, picks: [], label: 'Zap hedefi: NET\'e bağlı bir Netrunner seç' }); return true; }
  if (k === 'devop') { const id = b.dataset.d, op = b.dataset.op; if (op === 'fire') { const d = devById(id); startTargeting({ mode: 'turret', actor: null, src: { x: d.x, y: d.y }, max: 1, label: 'Taretin hedefini seç', dev: id, by: actor }); } else netOperate(id, op, actor); return true; }
  if (k === 'drug') { runDrug(actor, target || actor, b.dataset.drug); return true; }
  if (k === 'jury') { runAction({ kind: 'jury', actor, targets: [target || actor] }); return true; }
  if (k === 'backup') { lockRoll(() => callBackup(actor)); return true; }
  if (k === 'vehin') { const v = VEH[b.dataset.veh]; a.veh = { k: b.dataset.veh, n: v.n, sdp: v.sdp, max: v.sdp, move: v.move }; setDoc(tokPath(actor), a); playFx({ k: 'gear', b: actor, txt: v.n.toUpperCase(), col: '#f2a43a' }); renderTokCard(); dirty(); return true; }
  if (k === 'vehout') { a.veh = null; setDoc(tokPath(actor), a); playFx({ k: 'text', b: actor, txt: 'ARAÇTAN İNDİ', col: '#e7e3d8' }); renderTokCard(); dirty(); return true; }
  if (k === 'man13' || k === 'man17') { lockRoll(() => maneuver(actor, k === 'man13' ? 13 : 17)); return true; }
  if (k === 'ram') { runAction({ kind: 'ram', actor, targets: [target] }); return true; }
  return false;
}
async function maneuver(tid, dv) {
  const c = tokChar(S.tokens[tid]); const sk = 'Drive Land Vehicle'; const lvl = +(c.skills || {})[sk] || 0; const am = autoMods(c, null); am.mod = withLuck(S.tokens[tid].charId, am.mod, am.notes);
  const r = await doCheck({ who: charLabel(c), label: 'Araç manevrası', base: effStat(c, 'REF') + lvl + rankOf(c), mod: am.mod, dv, notes: am.notes.concat(['Moto +' + rankOf(c)]), pre: 'REF + ' + sk + ' + Moto →' });
  playFx({ k: r.okReal ? 'gear' : 'text', b: tid, txt: r.okReal ? 'MANEVRA' : 'KONTROL KAYBI', col: r.okReal ? '#7bd88f' : '#ff4a5f' });
  if (!r.okReal) toast('Kontrol kaybı: bu tur aracın hareketine GM karar verir; bir şeye çarparsa çarpma kuralı uygulanır.', 'err');
}
// ilaç: zar yok; hedefin sahibi etkiyi uygular
async function runDrug(actor, target, k) {
  const a = S.tokens[actor], c = tokChar(a), t = S.tokens[target];
  if (!gateAct(actor, 'act')) return;
  if (!t) return; if (sq(a, t) > 1) { toast('İlaç vermek için yan yana olmalısınız.', 'err'); return; }
  if (c.doses != null && c.doses !== '' && +c.doses <= 0) { toast('İlaç dozun kalmadı.', 'err'); return; }
  if (c.doses != null && c.doses !== '') { c.doses = +c.doses - 1; saveCharNow(a.charId); }
  await docSet('act', 'a' + uid(), { by: S.me.id || 'local', ts: Date.now(), a: actor, aName: a.name, kind: 'drug', drug: k, label: DRUGS[k].n, w: null, tg: { [target]: { n: t.hidden ? 'Bilinmeyen' : t.name, st: 'def' } }, stage: 'def', atk: { total: 0, d: 0 }, dmg: null, body: 0 });
  playFx({ k: 'heal', a: actor, b: target, txt: DRUGS[k].n.toUpperCase(), col: '#7bd88f' }); useAct(actor, 'act');
}
function applyDrug(c, k) {
  const day = S.day || 0;
  if (k === 'speed') {
    if (+c.hp < 1) return [false, 'Ölümcül yaralıya Speedheal işlemez'];
    if (c.speedDay === day) return [false, 'Bugün zaten Speedheal aldı'];
    const add = (+c.stats.BODY || 0) + (+c.stats.WILL || 0); const before = +c.hp; c.hp = Math.min(hpMax(c), before + add); c.speedDay = day;
    return [true, 'Speedheal: +' + (c.hp - before) + ' HP'];
  }
  if (k === 'stim') { if (c.stimDay === day) return [false, 'Bugün zaten Stim aldı']; c.stim = 1; c.stimDay = day; return [true, 'Stim: bir saat ağır yara cezası yok']; }
  if (k === 'detox') { c.toxic = 0; return [true, 'Rapidetox: tüm zehir ve uyuşturucu etkileri temizlendi']; }
  return [false, '?'];
}
// ---- Combat Awareness paneli ----
function openCaPanel(cid) { S.caPanel = cid; renderCaPanel(); }
function renderCaPanel() {
  const el = $('#caPanel'); if (!el) return; const c = S.caPanel && S.chars[S.caPanel];
  if (!c) { el.hidden = true; return; }
  el.innerHTML = '<div class="cap-h"><b>' + esc(charLabel(c)) + '</b><button class="x" data-act="caClose" aria-label="Kapat">×</button></div>' + caHTML(S.caPanel, c, canEditChar(c));
  el.hidden = false;
}
const ROLE_ACTS = {
  caStep: b => {
    const id = b.dataset.id, c = S.chars[id]; if (!c || !canEditChar(c)) return;
    const tk = S.tokens['t_' + id]; if (tk && turnOn() && !S.me.isGM && !S.caFree) { const [ok, why] = mayAct('t_' + id, 'act'); if (!ok) { toast('Dövüş sırasında Combat Awareness bir Aksiyonla dağıtılır: ' + why, 'err'); return; } } const x = CA.find(y => y.k === b.dataset.k); const a = caOf(c); if (!a) return;
    const nv = a[x.k] + (+b.dataset.v) * x.step; if (nv < 0 || nv > x.max) return; if (+b.dataset.v > 0 && caSum(a) + x.step > rankOf(c)) return;
    a[x.k] = nv; c.ca = a; saveCharNow(id); renderChars(); renderCaPanel();
    const t = S.tokens['t_' + id]; if (t) playFx({ k: 'scan', b: 't_' + id, txt: x.n.split(' ')[0].toUpperCase() + ' ' + nv, col: '#f2a43a' }, true);
  },
  caClose: () => { S.caPanel = null; renderCaPanel(); },
  juryDone: b => { const id = b.closest('.sheet').dataset.id, c = S.chars[id]; c.spBody = ARMOR[c.armor] || 0; c.spHead = ARMOR[c.armor] || 0; c.juryLock = 0; c.juryPrev = null; saveCharNow(id); renderChars(); },
};
document.addEventListener('change', e => {
  const t = e.target; if (t.dataset.act !== 'pharma') return;
  const id = t.closest('.sheet').dataset.id, c = S.chars[id]; if (!c || !canEditChar(c)) return;
  if (sheetLocked(c)) return;
  const set = new Set(pharmaOf(c)); if (t.checked) set.add(t.value); else set.delete(t.value);
  c.pharma = Object.keys(DRUGS).filter(k => set.has(k)); saveCharNow(id);
});
// sayfadaki rol bloğu
function roleBlockHTML(id, c, ed) {
  const r = roleOf(c); if (!r) return '';
  const ro = ed ? '' : ' disabled';
  let h = '';
  if (r === 'Solo') h = caHTML(id, c, ed);
  else if (r === 'Netrunner') { const rk = rankOf(c); h = '<div class="rb"><b>Interface ' + rk + '</b><span>Tur başına ' + naMax(rk) + ' NET aksiyonu. Haritadaki kamera, kapı ve taretleri ele geçirebilir.</span></div>'; }
  else if (r === 'Medtech') h = '<div class="rb"><b>Medicine · ilaçlar</b><span>Dövüşte yan yanayken bir Aksiyonla verilir.</span><div class="rb-row">' + Object.entries(DRUGS).map(([k, d]) => '<label class="tog"><input type="checkbox" data-act="pharma" value="' + k + '"' + (pharmaOf(c).indexOf(k) >= 0 ? ' checked' : '') + ro + '> ' + d.n + '</label>').join('') + '<label class="mini">Doz <input type="number" min="0" max="99" data-f="doses" value="' + esc(c.doses != null ? c.doses : '') + '" placeholder="takip yok"' + ro + '></label></div></div>';
  else if (r === 'Tech') h = '<div class="rb"><b>Maker</b><span>Field Expertise, Tech becerilerine eklenir ve saha tamirine izin verir.</span><div class="rb-row"><label class="mini">Field Expertise <input type="number" min="0" max="10" data-f="fieldExp" value="' + esc(fieldExp(c)) + '"' + ro + '></label></div></div>';
  else if (r === 'Lawman') { const t = backupTier(rankOf(c)); const B = BACKUP[t]; h = '<div class="rb"><b>Backup ' + rankOf(c) + '</b><span>' + esc(B.n) + ' · CN ' + B.cn + ' · SP ' + B.sp + ' · HP ' + B.hp + '. ' + esc(B.d) + '</span></div>'; }
  else if (r === 'Nomad') h = '<div class="rb"><b>Moto ' + rankOf(c) + '</b><span>Sürüş ve araç tamiri becerilerine +' + rankOf(c) + '. Aile araçları: ' + Object.values(VEH).filter(v => v.r <= rankOf(c)).map(v => v.n).join(', ') + '.</span></div>';
  else h = role2BlockHTML(id, c, ed);
  if (!h) return '';
  return '<div class="sec-h"><h4>Rol yeteneği</h4><span class="meta">' + esc(ROLE[r] ? ROLE[r].a : r) + '</span></div>' + h;
}
