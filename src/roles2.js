// ===== Rockerboy · Media · Fixer · Exec rol yetenekleri (kural kitabı s.143-160) =====
const RB_DV = [[8, 'Tek hayran', 'DV8'], [10, 'Küçük grup (≤6)', 'DV10'], [12, 'Büyük kalabalık', 'DV12']];
const RB_FAVOR = [
  [2, 'küçük iyilik (içki ısmarlamak, mesaj iletmek)', 'küçük grup: konser bedava sahne'],
  [4, 'büyük iyilik (seni bir yere götürmek, saklamak)', 'küçük grup: senin için küçük işler'],
  [6, 'küçük bir suç işlemek', 'grup: senin için tehlikeye girmek'],
  [8, 'hayatını riske atmak', 'grup: büyük suç, küçük isyan'],
  [9, 'büyük bir suç işlemek', 'kalabalık: ayaklanma'],
  [10, 'senin için kendini feda etmek', 'kalabalık: senin için her şeyi yapar'],
];
const RUMOR = [[13, 'Detaylı söylenti', 'doğrulanırsa habere kanıt olur'], [11, 'Esaslı söylenti', 'isim, yer, zaman içerir'], [9, 'Tipik söylenti', 'soruşturmanın nereye gideceğini gösterir'], [7, 'Belirsiz söylenti', 'peşine düşmeye yetecek kadar']];
const HAGGLE = [[1, '%10 indirim ya da zam (alış/satış)'], [3, '5 aynı eşyadan 1 tane bedava'], [5, 'iş başı ödemede %20 pazarlık'], [7, 'kara pazarda bir eşyayı yarı fiyata'], [9, 'Super Luxury eşya için tek seferlik takas']];
const EXEC_PERKS = [[1, 'İmza primi: kurumsal takım elbise'], [2, 'Şirket dairesi (kira yok)'], [3, '1. ekip üyesi'], [5, '2. ekip üyesi'], [6, 'Trauma Team Silver'], [7, 'Beaverville evi'], [8, 'Trauma Team Executive'], [9, '3. ekip üyesi'], [10, 'Lüks çatı katı / McMansion']];
const teamMax = rk => rk >= 9 ? 3 : rk >= 5 ? 2 : rk >= 3 ? 1 : 0;
const BODYGUARD = [[3, 7, 7, 4, 7, 6, 4, 8, 3], [5, 8, 6, 2, 7, 8, 4, 8, 3], [4, 8, 5, 3, 7, 8, 6, 6, 4], [4, 7, 8, 4, 7, 7, 4, 7, 5], [3, 8, 5, 2, 8, 7, 4, 6, 4], [5, 7, 7, 2, 7, 6, 5, 7, 3]];
function teamOf(execId) { return Object.entries(S.chars).filter(([, x]) => x.team === execId); }
function freeCellNear(from) {
  const m = S.map || curMap(); if (!m || !from) return null;
  const seen = new Set([from.x + ',' + from.y]); const q = [from];
  while (q.length) { const p = q.shift(); if ((p.x !== from.x || p.y !== from.y) && walkable(m, p.x, p.y) && !tokenAt(p)) return p; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const n = { x: p.x + dx, y: p.y + dy }; const k = n.x + ',' + n.y; if (!seen.has(k) && n.x >= 0 && n.y >= 0 && n.x < m.w && n.y < m.h) { seen.add(k); q.push(n); } } }
  return null;
}
function role2MenuHTML(actor, target, c, it) {
  const r = roleOf(c), rk = rankOf(c); let h = '';
  if (r === 'Rockerboy') {
    const fav = RB_FAVOR.filter(f => f[0] <= rk).pop() || RB_FAVOR[0];
    h += '<p class="hint">Rütbe ' + rk + ': tek hayrana ' + fav[1] + '. Hayran olmayanı hayran yapmak dövüş dışında olur.</p>';
    h += '<div class="am-row">' + RB_DV.map(([dv, n, l]) => it('rbImpact', n, 'Charismatic Impact ' + rk + ' + d10 vs ' + l, ' data-dv="' + dv + '"')).join('') + '</div>';
  } else if (r === 'Media') {
    h += it('mdRumor', 'Söylenti yakala', 'Credibility ' + rk + ' + d10 · DV7 belirsiz … DV13 detaylı (GM söylentiyi verir)');
    h += it('mdPub', 'Haber yayınla', 'Credibility ' + rk + ' + d10 · ne kadar kişinin inandığını GM yorumlar');
  } else if (r === 'Fixer') {
    const tt = target && S.tokens[target]; const tc = tt && tokChar(tt);
    h += it('fxHaggle', 'Pazarlık' + (tc ? ' · ' + tt.name : ''), 'COOL + Trading + Operator ' + rk + ' + d10' + (tc ? ' ↔ karşı tarafın COOL + Trading' + (roleOf(tc) === 'Fixer' ? ' + Operator' : '') + ' + d10' : ' · karşı tarafı seç ya da GM karşı zarı atar'));
    h += '<p class="hint">Başarılı olursa rütbe ' + rk + ' veya altı bir anlaşma: ' + HAGGLE.filter(x => x[0] <= rk).map(x => x[1]).join(' · ') + '. Erişim: ' + (rk >= 5 ? 'Night Market kurabilir (ayda bir)' : rk >= 3 ? 'Expensive eşyalara kadar' : 'Cheap ve Everyday eşyalar') + '.</p>';
  } else if (r === 'Exec') {
    const cid = S.tokens[actor].charId; const team = teamOf(cid); const mx = teamMax(rk);
    h += '<p class="hint">Ekip: ' + team.length + '/' + mx + (mx ? '' : ' · ekip üyesi rütbe 3\'te gelir') + '</p>';
    if (team.length < mx) h += it('exTeam', 'Ekip üyesi ata · Şirket koruması', 'd6 tablo · sadakat 1d6+1 · GM yönetir');
    team.forEach(([id, m]) => { h += it('exLoyal', 'Görev ver · ' + charLabel(m), 'Sadakat ' + (m.loyal || 0) + ' · d6 < sadakat ise uyar', ' data-cid="' + id + '"'); });
  }
  return h ? '<div class="am-sec role"><h5>' + esc(ROLE[r].a) + ' · rütbe ' + rk + '</h5>' + h + '</div>' : '';
}
const ACT_PICKS2 = ['rbImpact', 'mdRumor', 'mdPub', 'fxHaggle', 'exLoyal'];
function role2MenuPick(k, actor, target, b) {
  const a = S.tokens[actor]; const c = tokChar(a); if (!c) return false;
  if (['rbImpact', 'mdRumor', 'mdPub', 'fxHaggle', 'exTeam', 'exLoyal'].indexOf(k) < 0) return false;
  if (ACT_PICKS2.indexOf(k) >= 0 && turnOn()) { if (!gateAct(actor, 'act')) return true; useAct(actor, 'act'); }
  const rk = rankOf(c), who = charLabel(c);
  if (k === 'rbImpact') {
    const dv = +b.dataset.dv;
    lockRoll(async () => { const am = autoMods(c, null); am.mod = withLuck(a.charId, am.mod, am.notes); const r = await doCheck({ who, label: 'Charismatic Impact · ' + RB_DV.find(x => x[0] === dv)[1], base: rk, mod: am.mod, dv, notes: am.notes, pre: 'Charismatic Impact →' }); playFx({ k: 'talk', b: actor, txt: r.okReal ? 'HAYRANLAR SENİNLE' : 'ETKİLEMEDİ', col: r.okReal ? '#f2a43a' : '#929b96' }); chatEvent(a.name + ' Charismatic Impact: ' + (r.okReal ? 'başarılı; hayranlar istenen iyilik için ellerinden geleni yapar.' : 'başarısız; aynı iyilik bu hayranlardan bir hafta istenemez.')); });
    return true;
  }
  if (k === 'mdRumor' || k === 'mdPub') {
    lockRoll(async () => { const r = await doCheck({ who, label: k === 'mdRumor' ? 'Credibility · söylenti' : 'Credibility · yayın', base: rk, mod: 0, pre: 'Credibility →' });
      if (k === 'mdRumor') { const hit = RUMOR.find(x => r.total > x[0]); chatEvent(a.name + ' söylenti zarı ' + r.total + ': ' + (hit ? hit[1] + ' (' + hit[2] + '). GM söylentiyi anlatır.' : 'hiçbir söylenti yakalanmadı.')); }
      else chatEvent(a.name + ' bir haber yayınladı (Credibility ' + r.total + '). Rütbe ' + rk + ': ' + (rk >= 9 ? 'ulusal/küresel etki, megacorp sarsılabilir' : rk >= 5 ? 'şehir çapında yankı' : rk >= 3 ? 'bölge çapında okunur' : 'mahallede okunur') + '.'); });
    return true;
  }
  if (k === 'fxHaggle') {
    const tt = target && S.tokens[target]; const tc = tt && tokChar(tt); const tr = +(c.skills || {}).Trading || 0;
    lockRoll(async () => {
      const r1 = await doCheck({ who, label: 'Pazarlık (Haggle)', base: effStat(c, 'COOL') + tr + rk, mod: 0, pre: 'COOL + Trading + Operator →' });
      if (!tc) { chatEvent(a.name + ' pazarlık zarı ' + r1.total + '. GM karşı tarafın COOL + Trading + d10 zarıyla karşılaştırır.'); return; }
      const tr2 = +(tc.skills || {}).Trading || 0; const op2 = roleOf(tc) === 'Fixer' ? rankOf(tc) : 0;
      const r2 = await doCheck({ who: charLabel(tc), label: 'Pazarlık · karşı zar', base: effStat(tc, 'COOL') + tr2 + op2, mod: 0, pre: 'COOL + Trading' + (op2 ? ' + Operator' : '') + ' →' });
      const ok = r1.total > r2.total; playFx({ k: 'talk', b: actor, txt: ok ? 'ANLAŞMA' : 'PAZARLIK OLMADI', col: ok ? '#7bd88f' : '#929b96' });
      chatEvent(a.name + ' ↔ ' + tt.name + ' pazarlık: ' + r1.total + ' / ' + r2.total + ' · ' + (ok ? 'başarılı, rütbe ' + rk + ' veya altı bir anlaşma yapılabilir.' : 'başarısız.'));
    });
    return true;
  }
  if (k === 'exTeam') {
    if (turnOn() && !S.me.isGM) { toast('Ekip üyesi dövüş sırasında işe alınamaz.', 'err'); return true; }
    if (teamOf(a.charId).length >= teamMax(rk)) { toast('Rütbe ' + rk + ' için ekip dolu.', 'err'); return true; }
    (async () => {
      const g = await physRoll([{ n: 1, s: 6 }, { n: 1, s: 6 }], 'Ekip üyesi: tablo ve sadakat', { who });
      const row = BODYGUARD[g[0].vals[0] - 1]; const loyal = g[1].vals[0] + 1;
      const [INT, REF, DEX, TECH, COOL, WILL, MOVE, BODY, EMP] = row;
      const sk = {}; ['Concentration', 'Conversation', 'Education', 'First Aid', 'Human Perception', 'Persuasion', 'Stealth'].forEach(s => sk[s] = 2); ['Athletics', 'Evasion', 'Interrogation', 'Perception', 'Resist Torture/Drugs', 'Tactics'].forEach(s => sk[s] = 4); sk.Handgun = 6; sk.Brawling = 6;
      const n = teamOf(a.charId).length + 1;
      const m = { kind: 'team', arche: 'team', tier: 'vet', name: 'Şirket koruması ' + n, handle: '', role: '', rank: 0, stats: { INT, REF, DEX, TECH, COOL, WILL, LUCK: 0, MOVE, BODY, EMP }, skills: sk, armor: 'Hafif Armorjack', spBody: 11, spHead: 11, weapons: [mkWeapon('Çok ağır tabanca')], cyber: [{ n: 'Subdermal Armor (SP11)', hl: 0 }, { n: 'Cyberaudio Suite', hl: 0 }], life: {}, quirk: '', notes: a.name + ' ekibinden (Teamwork). GM yönetir; her görevde sadakat zarı. Sadakat seansta sınırsız artar, seanslar arası en fazla 10.', crits: [], dsPen: 0, hidden: false, ally: 1, team: a.charId, loyal, owner: S.me.id, ts: Date.now() };
      m.hp = hpMax(m); m.luck = 0;
      const id = 'tm' + uid(); S.chars[id] = m; await setDoc(charPath(id), m);
      const cell = freeCellNear(a); if (cell) await placeTokenAt(id, m, cell);
      chatEvent(a.name + ' ekibine yeni bir şirket koruması katıldı (sadakat ' + loyal + ').'); renderChars(); renderTokCard();
    })();
    return true;
  }
  if (k === 'exLoyal') {
    const id = b.dataset.cid, m = S.chars[id]; if (!m) return true;
    (async () => {
      const L = +m.loyal || 0;
      const g = await physRoll([{ n: 1, s: 6 }], 'Sadakat zarı · ' + charLabel(m), { who, tone: gs => gs[0].vals[0] < L ? { tone: 'ok', msg: 'GÖREVİ ALDI', sub: 'd6 < sadakat ' + L } : { tone: 'fail', msg: 'SADAKAT SORUNU', sub: 'd6 ≥ sadakat ' + L } });
      const d = g[0].vals[0]; const ok = d < L;
      await logRoll({ who, label: 'Sadakat zarı · ' + charLabel(m), total: d, detail: 'd6 [' + d + '] ' + (ok ? '<' : '≥') + ' sadakat ' + L + (ok ? ' · görevi en iyi şekilde yapar.' : ' · reddedebilir, işi bozabilir ya da Exec\'e karşı dönebilir (GM karar verir).'), kind: 'check', ok });
    })();
    return true;
  }
  return false;
}
function role2BlockHTML(id, c, ed) {
  const r = roleOf(c), rk = rankOf(c); const ro = ed ? '' : ' disabled';
  if (r === 'Rockerboy') { const fav = RB_FAVOR.filter(f => f[0] <= rk).pop() || RB_FAVOR[0]; return '<div class="rb"><b>Charismatic Impact ' + rk + '</b><span>Hayranlara etki: rütbe + d10 vs DV8 tek kişi, DV10 küçük grup, DV12 kalabalık. Şu an tek hayrana: ' + esc(fav[1]) + '; ' + esc(fav[2]) + '.</span></div>'; }
  if (r === 'Media') return '<div class="rb"><b>Credibility ' + rk + '</b><span>Haftada iki kez GM gizlice söylenti zarı atar (rütbe + d10 vs DV7/9/11/13). Yayınların ' + (rk >= 9 ? 'ulusal/küresel' : rk >= 5 ? 'şehir çapında' : rk >= 3 ? 'bölge çapında' : 'mahalle çapında') + ' okunur.</span></div>';
  if (r === 'Fixer') return '<div class="rb"><b>Operator ' + rk + '</b><span>Pazarlık: COOL + Trading + rütbe + d10. Anlaşmalar: ' + esc(HAGGLE.filter(x => x[0] <= rk).map(x => x[1]).join(' · ')) + '.</span></div>';
  if (r === 'Exec') {
    const team = teamOf(id);
    return '<div class="rb"><b>Teamwork ' + rk + '</b><span>' + esc(EXEC_PERKS.filter(x => x[0] <= rk).map(x => x[1]).join(' · ')) + '</span>' + (team.length ? '<div class="rb-row">' + team.map(([tid, m]) => '<label class="mini">' + esc(charLabel(m)) + ' sadakat <input type="number" min="-10" max="30" data-act="loyal" data-id="' + tid + '" value="' + esc(m.loyal || 0) + '"' + (S.me.isGM || ed ? '' : ro) + '></label>').join('') + '</div>' : '<span>Ekip üyeleri haritada Exec seçiliyken menüden atanır (rütbe 3, 5, 9).</span>') + '</div>';
  }
  return '';
}
document.addEventListener('change', e => {
  const t = e.target; if (t.dataset.act !== 'loyal') return;
  const m = S.chars[t.dataset.id]; if (!m) return;
  m.loyal = +t.value || 0; S.why = 'Sadakat'; saveCharNow(t.dataset.id);
});
