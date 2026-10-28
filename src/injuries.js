// ===== KRİTİK YARALAR: kitap tabloları, durumlar, cezalar, vücut haritası =====
// qf: hızlı müdahale [beceri, DV] seçenekleri; perm: hızlı müdahale etkiyi kalıcı kaldırır; tr: tedavi seçenekleri
const INJ = {
  b2: { n: 'Kopmuş kol', r: 'arm', side: 1, lost: 1, ds: 1, qf: null, tr: [['Surgery', 17]], e: 'Kol yok; o eldekini düşürür.', fx: { arm: 1 } },
  b3: { n: 'Kopmuş el', r: 'hand', side: 1, lost: 1, ds: 1, qf: null, tr: [['Surgery', 17]], e: 'El yok; içindekini düşürür.', fx: { arm: 1 } },
  b4: { n: 'Çökmüş akciğer', r: 'lung', ds: 1, qf: [['Paramedic', 15]], tr: [['Surgery', 15]], e: 'MOVE −2 (en az 1).', fx: { move: 2 } },
  b5: { n: 'Kırık kaburgalar', r: 'ribs', qf: [['Paramedic', 13]], tr: [['Paramedic', 15], ['Surgery', 13]], e: 'Yürüyerek 4 m\'den fazla hareket ettiği her tur sonunda 5 hasar.', fx: { walk: 1 } },
  b6: { n: 'Kırık kol', r: 'arm', side: 1, qf: [['Paramedic', 13]], tr: [['Paramedic', 15], ['Surgery', 13]], e: 'Kol kullanılamaz; o eldekini düşürür.', fx: { arm: 1 } },
  b7: { n: 'Yabancı cisim', r: 'torso', qf: [['First Aid', 13], ['Paramedic', 13]], perm: 1, tr: null, e: 'Yürüyerek 4 m\'den fazla hareket ettiği her tur sonunda 5 hasar.', fx: { walk: 1 } },
  b8: { n: 'Kırık bacak', r: 'leg', side: 1, qf: [['Paramedic', 13]], tr: [['Paramedic', 15], ['Surgery', 13]], e: 'MOVE −4 (en az 1).', fx: { move: 4 } },
  b9: { n: 'Yırtık kas', r: 'torso', qf: [['First Aid', 13], ['Paramedic', 13]], perm: 1, tr: null, e: 'Yakın dövüş saldırılarına −2.', fx: { melee: 2 } },
  b10: { n: 'Omurga yaralanması', r: 'spine', ds: 1, qf: [['Paramedic', 15]], tr: [['Surgery', 15]], e: 'Sonraki turunda Aksiyon alamaz, sadece hareket eder.', fx: { spinal: 1 } },
  b11: { n: 'Ezilmiş parmaklar', r: 'hand', side: 1, qf: [['Paramedic', 13]], tr: [['Surgery', 15]], e: 'O eli kullanan işlere −4.', fx: { hand: 4 } },
  b12: { n: 'Kopmuş bacak', r: 'leg', side: 1, lost: 1, ds: 1, qf: null, tr: [['Surgery', 17]], e: 'MOVE −6 (en az 1), saldırılardan kaçamaz.', fx: { move: 6, noDodge: 1 } },
  h2: { n: 'Kaybedilmiş göz', r: 'eye', side: 1, lost: 1, ds: 1, qf: null, tr: [['Surgery', 17]], e: 'Görüşe dayalı menzilli saldırı ve algıya −4.', fx: { vision: 4 } },
  h3: { n: 'Beyin hasarı', r: 'head', ds: 1, qf: null, tr: [['Surgery', 17]], e: 'Tüm aksiyonlara −2.', fx: { all: 2 } },
  h4: { n: 'Hasarlı göz', r: 'eye', side: 1, qf: [['Paramedic', 15]], tr: [['Surgery', 13]], e: 'Görüşe dayalı menzilli saldırı ve algıya −2.', fx: { vision: 2 } },
  h5: { n: 'Sarsıntı', r: 'head', qf: [['First Aid', 13], ['Paramedic', 13]], perm: 1, tr: null, e: 'Tüm aksiyonlara −2.', fx: { all: 2 } },
  h6: { n: 'Kırık çene', r: 'jaw', qf: [['Paramedic', 13]], tr: [['Paramedic', 13], ['Surgery', 13]], e: 'Konuşma gerektiren işlere −4.', fx: { speech: 4 } },
  h7: { n: 'Yabancı cisim (kafa)', r: 'head', qf: [['First Aid', 13], ['Paramedic', 13]], perm: 1, tr: null, e: 'Yürüyerek 4 m\'den fazla hareket ettiği her tur sonunda 5 hasar.', fx: { walk: 1 } },
  h8: { n: 'Boyun incinmesi', r: 'neck', ds: 1, qf: [['Paramedic', 13]], tr: [['Paramedic', 13], ['Surgery', 13]], e: 'Temel ölüm kurtarma cezası +1.', fx: {} },
  h9: { n: 'Çatlak kafatası', r: 'head', ds: 1, qf: [['Paramedic', 15]], tr: [['Paramedic', 15], ['Surgery', 15]], e: 'Kafaya nişanlı atışlarda geçen hasar ×3.', fx: { skull: 1 } },
  h10: { n: 'Hasarlı kulak', r: 'ear', side: 1, qf: [['Paramedic', 13]], tr: [['Surgery', 13]], e: '4 m\'den fazla yürüdüğü turun ardından hareket aksiyonu yok; işitmeye dayalı algıya −2.', fx: { hearing: 2, ear: 1 } },
  h11: { n: 'Ezilmiş nefes borusu', r: 'neck', ds: 1, qf: null, tr: [['Surgery', 15]], e: 'Konuşamaz.', fx: { noSpeak: 1 } },
  h12: { n: 'Kaybedilmiş kulak', r: 'ear', side: 1, lost: 1, ds: 1, qf: null, tr: [['Surgery', 17]], e: '4 m\'den fazla yürüdüğü turun ardından hareket aksiyonu yok; işitmeye dayalı algıya −4.', fx: { hearing: 4, ear: 1 } },
};
const INJ_BY_NAME = {}; Object.entries(INJ).forEach(([k, v]) => { INJ_BY_NAME[v.n] = k; }); INJ_BY_NAME['Yabancı cisim'] = 'b7';
const INJ_ST = { active: 'Aktif', qf: 'Hızlı müdahale (bugün)', treated: 'Tedavi edildi', replaced: 'Cyberware ile değiştirildi' };
// zar tabloları bu veriden üretilir
const CRIT_TABLE = loc => { const o = {}; for (let r = 2; r <= 12; r++) { const k = (loc === 'h' ? 'h' : 'b') + r; o[r] = [INJ[k].n, INJ[k].e, INJ[k].ds ? 1 : 0, k]; } return o; };
const CRIT_BODY = CRIT_TABLE('b'), CRIT_HEAD = CRIT_TABLE('h');
function injKey(x) { if (x.key && INJ[x.key]) return x.key; let k = INJ_BY_NAME[x.n]; if (k === 'b7' && x.loc === 'h') k = 'h7'; return k || null; }
function normInj(c) {
  (c.crits || []).forEach(x => {
    if (!x.id) x.id = 'i' + uid();
    if (!x.key) x.key = injKey(x);
    if (!x.st) x.st = 'active';
    const s = INJ[x.key]; if (s && s.side && !x.side) x.side = Math.random() < 0.5 ? 'L' : 'R';
  });
  return c.crits || [];
}
// etkisi süren yaralar: aktif olanlar (hızlı müdahale o gün etkiyi kaldırır)
const injActive = c => (c.crits || []).filter(x => (x.st || 'active') === 'active');
function injEff(c) {
  const f = { move: 0, all: 0, melee: 0, vision: 0, hearing: 0, speech: 0, hand: 0, noDodge: 0, noSpeak: 0, skull: 0, walk: 0, ear: 0, arm: 0, spinal: 0 };
  injActive(c).forEach(x => { const s = INJ[injKey(x)]; if (!s) return; for (const k in s.fx) f[k] += s.fx[k]; });
  // kopmuş ama değiştirilmemiş uzuvlar tedaviyle de geri gelmez: "tedavi edildi" yaranın kapanmasıdır, uzuv yine yoktur
  (c.crits || []).forEach(x => { const s = INJ[injKey(x)]; if (s && s.lost && x.st === 'treated') { for (const k of ['arm', 'move', 'noDodge', 'vision', 'hearing']) if (s.fx[k]) f[k] += s.fx[k]; } });
  return f;
}
const dsBaseOf = c => (c.crits || []).filter(x => { const s = INJ[injKey(x)]; return s && s.ds && (x.st || 'active') === 'active'; }).length;
const SPEECH_SK = ['Persuasion', 'Interrogation', 'Acting', 'Conversation', 'Bribery', 'Trading', 'Streetwise', 'Language (Streetslang)', 'Language (Ana dil)'];
const VISION_SK = ['Perception', 'Lip Reading', 'Tracking', 'Conceal/Reveal Object'];
const HAND_SK = ['Pick Lock', 'Pick Pocket', 'Forgery', 'Basic Tech', 'Weaponstech', 'Cybertech', 'First Aid', 'Paramedic', 'Surgery', 'Paint/Draw/Sculpt', 'Play Instrument', 'Electronics/Security Tech', 'Demolitions', 'Land Vehicle Tech', 'Air Vehicle Tech', 'Sea Vehicle Tech'];
const RANGED_SK = ['Handgun', 'Shoulder Arms', 'Autofire', 'Heavy Weapons', 'Archery'];
const MELEE_SK = ['Melee Weapon', 'Brawling', 'Martial Arts'];
function ctxOfSkill(n) { if (n === 'Perception') return 'perception'; if (RANGED_SK.indexOf(n) >= 0) return 'ranged'; if (MELEE_SK.indexOf(n) >= 0) return 'melee'; if (SPEECH_SK.indexOf(n) >= 0) return 'speech'; if (VISION_SK.indexOf(n) >= 0) return 'vision'; if (HAND_SK.indexOf(n) >= 0) return 'hand'; return null; }
const TWO_HANDED = ['shotgun', 'ar', 'sniper', 'bow', 'gl', 'rocket'];
function handsFree(c) { return Math.max(0, 2 - Math.min(2, injEff(c).arm)); }
// kullanılamazlık kontrolü: mesaj döner ya da null
function injBlock(c, ctx, cls) {
  const f = injEff(c);
  if (ctx === 'speech' && f.noSpeak) return charLabel(c) + ' konuşamıyor (ezilmiş nefes borusu).';
  if (cls && TWO_HANDED.indexOf(cls) >= 0 && handsFree(c) < 2) return charLabel(c) + ' iki elli silah kullanamaz: bir kolu ya da eli kullanılamıyor.';
  if ((ctx === 'ranged' || ctx === 'melee' || ctx === 'hand') && handsFree(c) < 1) return charLabel(c) + ' iki kolunu da kullanamıyor.';
  return null;
}

// ---- vücut haritası (SVG) ----
const BODY_REG = {
  head: '<circle cx="80" cy="32" r="19"/>',
  eyeR: '<circle cx="72.5" cy="30" r="3.4"/>', eyeL: '<circle cx="87.5" cy="30" r="3.4"/>',
  earR: '<ellipse cx="60" cy="32" rx="3.4" ry="6.5"/>', earL: '<ellipse cx="100" cy="32" rx="3.4" ry="6.5"/>',
  jaw: '<path d="M68 41 Q80 53 92 41 L90 46 Q80 55 70 46 Z"/>',
  neck: '<rect x="72" y="50" width="16" height="13" rx="3"/>',
  torso: '<path d="M56 64 Q80 58 104 64 L108 112 Q106 140 100 150 L60 150 Q54 140 52 112 Z"/>',
  lung: '<ellipse cx="70" cy="88" rx="9" ry="14"/>',
  ribs: '<path d="M86 80 Q96 82 101 86 M86 90 Q97 92 102 97 M86 100 Q96 102 101 107" fill="none" stroke-width="3"/>',
  spine: '<path d="M80 66 L80 148" fill="none" stroke-width="4" stroke-dasharray="3 3"/>',
  armR: '<path d="M54 66 Q42 70 38 92 L34 138 Q34 146 42 146 Q46 146 46 138 L50 100 L56 90 Z"/>',
  armL: '<path d="M106 66 Q118 70 122 92 L126 138 Q126 146 118 146 Q114 146 114 138 L110 100 L104 90 Z"/>',
  handR: '<ellipse cx="39" cy="155" rx="7" ry="9"/>', handL: '<ellipse cx="121" cy="155" rx="7" ry="9"/>',
  legR: '<path d="M60 150 L79 150 L77 210 L76 268 Q76 278 66 278 Q60 278 61 268 L60 210 Z"/>',
  legL: '<path d="M81 150 L100 150 L100 210 L99 268 Q100 278 94 278 Q84 278 84 268 L83 210 Z"/>',
};
const REG_TR = { head: 'Kafa', eyeR: 'Sağ göz', eyeL: 'Sol göz', earR: 'Sağ kulak', earL: 'Sol kulak', jaw: 'Çene', neck: 'Boyun', torso: 'Gövde', lung: 'Akciğer', ribs: 'Kaburgalar', spine: 'Omurga', armR: 'Sağ kol', armL: 'Sol kol', handR: 'Sağ el', handL: 'Sol el', legR: 'Sağ bacak', legL: 'Sol bacak' };
const regOf = x => { const s = INJ[injKey(x)]; if (!s) return 'torso'; return s.side ? s.r + (x.side || 'R') : s.r; };
const ST_RANK = { active: 4, qf: 3, treated: 2, replaced: 1 };
function bodySVG(c) {
  const by = {}; normInj(c).forEach(x => { const r = regOf(x); (by[r] = by[r] || []).push(x); });
  const order = ['torso', 'armR', 'armL', 'handR', 'handL', 'legR', 'legL', 'neck', 'head', 'jaw', 'eyeR', 'eyeL', 'earR', 'earL', 'lung', 'ribs', 'spine'];
  let h = '<svg class="bodymap" viewBox="0 0 160 286" role="img" aria-label="Vücut haritası">';
  order.forEach(r => {
    const xs = by[r] || []; let st = null, lost = false;
    xs.forEach(x => { const s = (x.st || 'active'); if (!st || ST_RANK[s] > ST_RANK[st]) st = s; if (INJ[injKey(x)] && INJ[injKey(x)].lost && s !== 'replaced') lost = true; });
    const cls = 'rg rg-' + r + (st ? ' s-' + st : '') + (lost ? ' lost' : '');
    const tip = xs.length ? REG_TR[r] + ': ' + xs.map(x => (INJ[injKey(x)] || { n: x.n }).n + ' (' + INJ_ST[x.st || 'active'] + ')').join(', ') : REG_TR[r];
    h += '<g class="' + cls + '" data-reg="' + r + '"><title>' + esc(tip) + '</title>' + BODY_REG[r] + (lost ? '' : '') + '</g>';
  });
  // kopmuş bölgelere çarpı
  Object.entries(by).forEach(([r, xs]) => { if (xs.some(x => INJ[injKey(x)] && INJ[injKey(x)].lost && (x.st || 'active') !== 'replaced')) { const pt = { armR: [42, 110], armL: [118, 110], handR: [39, 155], handL: [121, 155], legR: [69, 215], legL: [91, 215], eyeR: [72.5, 30], eyeL: [87.5, 30], earR: [60, 32], earL: [100, 32] }[r]; if (pt) h += '<path class="xmark" d="M' + (pt[0] - 6) + ' ' + (pt[1] - 6) + ' l12 12 M' + (pt[0] + 6) + ' ' + (pt[1] - 6) + ' l-12 12"/>'; } });
  h += '<text x="18" y="282" class="lr">SAĞ</text><text x="142" y="282" class="lr" text-anchor="end">SOL</text></svg>';
  return h;
}
function injListHTML(id, c, ed) {
  const xs = normInj(c);
  if (!xs.length) return '<p class="empty sm">Kritik yara yok.</p>';
  return '<div class="injs">' + xs.map((x, i) => {
    const k = injKey(x), s = INJ[k] || { n: x.n, e: x.e, qf: null, tr: null };
    const st = x.st || 'active';
    const qf = s.qf ? s.qf.map(q => q[0] + ' DV' + q[1]).join(' / ') + (s.perm ? ' · kalıcı' : ' · gün sonuna kadar') : 'yok';
    const tr = s.tr ? s.tr.map(q => q[0] + ' DV' + q[1]).join(' / ') : (s.perm ? 'gerekmez' : 'yok');
    return '<div class="inj s-' + st + '"><div class="inj-h"><b>' + esc(s.n) + '</b>' + (s.side ? '<button class="sidebtn" data-act="injSide" data-i="' + i + '"' + (ed ? '' : ' disabled') + ' title="Tarafı değiştir">' + (x.side === 'L' ? 'Sol' : 'Sağ') + '</button>' : '') + '<span class="injst">' + INJ_ST[st] + '</span></div>'
      + '<p>' + esc(s.e) + (s.ds ? ' Temel ölüm kurtarma cezası +1.' : '') + '</p>'
      + '<p class="inj-rx">Hızlı müdahale: ' + esc(qf) + ' · 1 dk, kendine yapılabilir. Tedavi: ' + esc(tr) + ' · 4 saat, kendine yapılamaz.</p>'
      + (ed ? '<div class="row">' + (st === 'active' && s.qf ? '<button class="btn sm" data-act="selfQf" data-i="' + i + '">Kendine hızlı müdahale</button>' : '') + '<select data-act="injSt" data-i="' + i + '" aria-label="Yara durumu">' + Object.entries(INJ_ST).map(([v, l]) => '<option value="' + v + '"' + (v === st ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><button class="x" data-act="delCrit" data-i="' + i + '" aria-label="Kaydı sil" title="Kaydı sil">×</button></div>' : '')
      + '</div>';
  }).join('') + '</div>';
}
// tedavi zarı: en iyi uygun beceri
function bestHeal(c, opts) {
  let best = null;
  (opts || []).forEach(([sk, dv]) => { const lvl = sk === 'Surgery' ? (+(c.skills || {}).Surgery || 0) : (+(c.skills || {})[sk] || 0); if (sk === 'Surgery' && !lvl) return; const base = effStat(c, 'TECH') + lvl; if (!best || base - dv > best.base - best.dv) best = { sk, dv, lvl, base }; });
  return best;
}
// 4 m'den fazla yürüyünce tekrar eden hasar
function walkPenalty(tid, squares) {
  const tk = S.tokens[tid], c = tokChar(tk); if (!c || squares <= 2) return;
  const f = injEff(c);
  if (f.walk) {
    const dmg = 5 * f.walk; c.hp = Math.max(0, (+c.hp || 0) - dmg); S.why = 'yürürken yara hasarı'; saveCharNow(tk.charId); renderChars(); renderTokCard();
    playFx({ k: 'text', b: tid, txt: '-' + dmg, col: '#ff6b7d' });
    toast(charLabel(c) + ' 4 m\'den fazla yürüdü: yarası yüzünden ' + dmg + ' hasar aldı.', 'err');
  }
  if (f.ear) { toast(charLabel(c) + ' kulak yarası nedeniyle sonraki turunda hareket aksiyonu alamaz.'); if (canEditChar(c) && turnOn()) { c.skipMove = turnMark(); S.why = 'kulak yarası'; saveCharNow(tk.charId); } }
}
function effSummary(c) {
  const f = injEff(c), out = [], w = woundPen(c), ap = armorPen(c);
  if (w) out.push((w === 4 ? 'Ölümcül yara' : 'Ağır yara') + ': tüm aksiyonlar −' + w);
  if (+c.hp < 1) out.push('MOVE −6 (ölümcül yara)');
  if (ap) out.push('Zırh: REF, DEX, MOVE −' + ap);
  if (f.all) out.push('Tüm aksiyonlar −' + f.all);
  if (f.move) out.push('MOVE −' + f.move);
  if (f.melee) out.push('Yakın dövüş saldırıları −' + f.melee);
  if (f.vision) out.push('Menzilli saldırı ve görsel algı −' + f.vision);
  if (f.hearing) out.push('İşitsel algı −' + f.hearing);
  if (f.speech) out.push('Konuşma gerektiren işler −' + f.speech);
  if (f.hand) out.push('Elle yapılan işler −' + f.hand);
  if (f.noSpeak) out.push('Konuşamaz');
  if (f.noDodge) out.push('Saldırılardan kaçamaz');
  if (f.arm) out.push(handsFree(c) ? 'Tek kol: iki elli silah kullanamaz' : 'İki kolu da kullanılamıyor');
  if (f.walk) out.push('4 m\'den fazla yürürse tur sonunda ' + (5 * f.walk) + ' hasar');
  if (f.ear) out.push('4 m\'den fazla yürürse sonraki tur hareket yok');
  if (f.skull) out.push('Kafaya nişanlı atışta geçen hasar ×3');
  const ds = dsBaseOf(c); if (ds) out.push('Temel ölüm kurtarma cezası +' + ds);
  return out;
}

// doğrudan yara ekle (ör. çarpmada Whiplash); zaten varsa eklemez
function injAdd(c, key) {
  const s = INJ[key]; if (!s || critNames(c).indexOf(s.n) >= 0) return false;
  c.crits = (c.crits || []).concat([{ id: 'i' + uid(), key, n: s.n, e: s.e, loc: key[0], ds: s.ds, st: 'active', side: s.side ? (Math.random() < 0.5 ? 'L' : 'R') : null }]);
  if (s.ds) c.dsPen = (+c.dsPen || 0) + 1;
  return true;
}
