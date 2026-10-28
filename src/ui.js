// ===== ARAYÜZ: GENEL =====
let toastT = null;
function toast(msg, kind) {
  const el = $('#toast'); el.textContent = msg; el.className = 'toast show ' + (kind || '');
  clearTimeout(toastT); toastT = setTimeout(() => el.className = 'toast', 3800);
}
function armConfirm(btn, fn, txt) {
  if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.orig; btn.classList.remove('armed'); fn(); return; }
  btn.dataset.orig = btn.textContent; btn.dataset.armed = '1'; btn.textContent = txt || 'Emin misin? Tekrar bas';
  btn.classList.add('armed');
  setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.orig; btn.classList.remove('armed'); } }, 3200);
}
function flash(rec) {
  const el = $('#flash');
  const cls = rec.crit === 'hi' ? 'crit-hi' : rec.crit === 'lo' ? 'crit-lo' : rec.ok === true ? 'ok' : rec.ok === false ? 'fail' : '';
  el.className = 'flash show ' + cls + (S.secretMode ? ' secret' : '');
  el.innerHTML = '<div class="fl-label">' + (S.secretMode ? '<span class="chip">gizli</span> ' : '') + esc((rec.who ? rec.who + ' · ' : '') + rec.label) + '</div><div class="fl-total">' + esc(rec.total) + '</div><div class="fl-det">' + esc(rec.detail) + (rec.dv ? ' · DV ' + esc(rec.dv) + (rec.ok ? ' geçildi' : ' geçilemedi') : '') + (rec.note ? ' · ' + esc(rec.note) : '') + '</div>';
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
function updateHeader() {
  const m = S.preview || S.map;
  $('#mapName').textContent = S.preview ? 'Önizleme: ' + (TEMPLATES[S.preview.tpl] || {}).n : m ? (m.name || 'İsimsiz sahne') : (S.mapLoaded ? 'Sahne yok' : 'Masa yükleniyor');
  const b = $('#mapBanner');
  if (S.preview) {
    b.hidden = false;
    b.innerHTML = '<span><b>Önizleme</b> · sadece sen görüyorsun</span><button class="btn sm primary" data-act="publishMap">Masaya yayınla</button><button class="btn sm" data-act="cancelPreview">Vazgeç</button>';
  } else if (S.mapLoaded && !S.map) {
    b.hidden = false;
    b.innerHTML = S.me.isGM ? '<span>Masada henüz harita yok. <b>Harita</b> sekmesinden bir sahne üret ya da bu örneği yayınla.</span><button class="btn sm primary" data-act="publishDemo">Bu örneği yayınla</button>' : '<span>GM sahneyi hazırlıyor.</span>';
  } else b.hidden = true;
}
function onMapChange() {
  const m = curMap();
  S.layerDirty = true;
  if (m) { const key = m.w + 'x' + m.h + ':' + (m.seed || '') + (S.preview ? 'p' : ''); if (key !== S.fitKey) { S.fitKey = key; requestAnimationFrame(fitView); } }
  updateHeader(); renderHover(); dirty();
}
function renderHover() {
  const el = $('#hoverInfo'); const m = curMap();
  if (!S.hover || !m || tAt(m, S.hover.x, S.hover.y) === null) { el.hidden = true; return; }
  const ch = tAt(m, S.hover.x, S.hover.y), T = TILE[ch] || { n: '?' };
  const tags = [];
  if (COVER[ch]) tags.push('siper: ' + COVER[ch]);
  if (T.slow) tags.push('zorlu zemin, kare ×2');
  if (T.hazard) tags.push('tehlike');
  if (!T.walk) tags.push('geçilmez');
  const tid = tokenAt(S.hover);
  el.hidden = false;
  el.innerHTML = '<span class="mono">' + S.hover.x + ',' + S.hover.y + '</span> <b>' + esc(T.n) + '</b>' + (tags.length ? ' <span class="tags">' + tags.map(esc).join(' · ') + '</span>' : '') + (tid ? ' <span class="who">' + esc(S.tokens[tid].name) + '</span>' : '');
}
function renderPeers() {
  const el = $('#peers'); if (!room) { el.innerHTML = ''; return; }
  const seen = new Set(); const list = [];
  S.peers.forEach(p => { if (p.kind !== 'viewer') return; const key = p.by || p.peer; if (seen.has(key)) return; seen.add(key); list.push(p); });
  el.innerHTML = list.slice(0, 7).map(p => {
    const nm = p.isMe ? 'Sen' : (p.by ? (names[p.by] || 'Oyuncu') : 'Misafir');
    const av = p.by && avatars[p.by];
    const col = /^#[0-9a-fA-F]{3,8}$/.test((p.presence || {}).c || '') ? p.presence.c : '#5f6964';
    return '<span class="peer" title="' + esc(nm) + '" style="border-color:' + col + '">' + (av ? '<img alt="" src="' + esc(av) + '">' : esc(nm.slice(0, 1))) + '</span>';
  }).join('') + (list.length ? '<span class="peer-n">' + list.length + ' çevrimiçi</span>' : '');
}
const ICON_EYE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.4 4.2M6.4 6.9C3.7 8.6 2 12 2 12s3.6 6.5 10 6.5c1.6 0 3-.4 4.2-1"/></svg>';
const ICON_GRIP = '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><g fill="currentColor"><circle cx="2" cy="3" r="1.4"/><circle cx="8" cy="3" r="1.4"/><circle cx="2" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="2" cy="13" r="1.4"/><circle cx="8" cy="13" r="1.4"/></g></svg>';
const initials = s => (s || '?').trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?';

// ===== GÖRÜNÜRLÜK =====
function setTokHidden(tid, h) {
  const tk = S.tokens[tid]; if (!tk || !S.me.isGM) return;
  const oldP = tokPath(tid); tk.hidden = !!h; const newP = tokPath(tid);
  if (oldP !== newP) delDoc(oldP);
  setDoc(newP, Object.assign({}, tk));
  dirty(); renderTokCard();
}
function setCharHidden(id, h) {
  const c = S.chars[id]; if (!c || !S.me.isGM) return;
  c.hidden = !!h; saveCharNow(id);
  if (S.tokens['t_' + id]) setTokHidden('t_' + id, h);
  renderCharList(); renderChars();
  toast(charLabel(c) + (h ? ' oyunculardan gizlendi.' : ' oyunculara görünür.'));
}

// ===== TOKEN KARTI =====
function renderTokCard() {
  const el = $('#tokCard'); const id = S.sel; const tk = id && S.tokens[id];
  updateTargets();
  if (!tk || (tk.hidden && !S.me.isGM)) { el.hidden = true; return; }
  const c = tokChar(tk); const ed = c ? canEditChar(c) : canMoveTok(tk);
  let hp = '';
  if (c) {
    const mx = hpMax(c), st = hpState(c);
    hp = '<div class="tc-hp"><div class="bar"><i style="width:' + clamp(+c.hp / mx * 100, 0, 100) + '%" class="' + st[1] + '"></i></div><span class="mono">' + esc(c.hp) + '/' + mx + ' HP</span> <span class="st ' + st[1] + '">' + st[0] + '</span></div>'
      + (ed ? '<div class="tc-row"><button class="btn sm" data-act="tokHp" data-v="-5">−5</button><button class="btn sm" data-act="tokHp" data-v="-1">−1</button><button class="btn sm" data-act="tokHp" data-v="1">+1</button><button class="btn sm" data-act="tokHp" data-v="5">+5</button></div>' : '');
  } else if (tk.st) {
    hp = '<div class="tc-hp"><span class="st ' + esc(tk.st) + '">' + (tk.st === 'crit' ? 'Ölümcül yaralı' : tk.st === 'warn' ? 'Ağır yaralı' : 'Ayakta') + '</span></div>';
  }
  const sub = c ? (isNpc(c) ? (ARCHES[c.arche] || {}).n + ' · ' + (TIERS[c.tier] || {}).n : c.role) : (tk.kind === 'npc' ? 'NPC' : 'Token');
  const im = c && c.img ? c.img.url : null;
  const tags = [];
  if (tk.veh) tags.push('<span class="dchip">' + esc(tk.veh.n) + ' · SDP ' + tk.veh.sdp + '/' + tk.veh.max + '</span>');
  if (tk.net) tags.push('<span class="dchip pc">NET\'e bağlı' + (tk.net.pw ? '' : ' · şifre önünde') + '</span>');
  if (c && caOf(c) && caSum(caOf(c))) tags.push('<span class="dchip">CA ' + CA.filter(x => caOf(c)[x.k]).map(x => x.n.split(' ')[0] + ' ' + caOf(c)[x.k]).join(' · ') + '</span>');
  if (c && c.stim) tags.push('<span class="dchip pc">Stim</span>');
  if (tags.length) hp += '<div class="dchips">' + tags.join('') + '</div>';
  el.hidden = false;
  el.innerHTML = '<div class="tc-head">' + (im ? '<img class="tc-img" alt="" src="' + esc(im) + '">' : '<span class="tc-dot" style="background:' + esc(tk.color) + '"></span>') + '<div><b>' + esc(tk.name) + '</b><small>' + esc(sub) + (tk.hidden ? ' · oyunculardan gizli' : '') + '</small></div><button class="x" data-act="tokClose" aria-label="Kapat">×</button></div>' + hp
    + '<div class="tc-row">' + (canAct(id) && c ? '<button class="btn sm primary" data-act="openActMenu">Aksiyon</button>' : '') + (S.me.isGM ? '<button class="btn sm" data-act="reqCheck">Kontrol iste</button>' : '') + (Object.entries(FX.pairs).some(([, p]) => p.a === id || p.b === id) && (S.me.isGM || canAct(id)) ? '<button class="btn sm" data-act="release">Boğuşmayı bitir</button>' : '') + '</div><div class="tc-row">' + (c ? '<button class="btn sm" data-act="openSheet" data-id="' + esc(tk.charId) + '">Sayfa</button><button class="btn sm" data-act="initOne" data-id="' + esc(tk.charId) + '">İnisiyatif</button>' : '')
    + (ed ? '<button class="btn sm" data-act="tokColor">Renk</button>' : '')
    + (S.me.isGM ? '<button class="btn sm" data-act="tokHide">' + (tk.hidden ? ICON_EYE + ' Göster' : ICON_EYE_OFF + ' Gizle') + '</button>' : '')
    + (ed ? '<button class="btn sm danger" data-act="tokDel">Kaldır</button>' : '') + '</div>';
}

// ===== ZAR SEKMESİ =====
function buildDiceTable() {
  const sides = [4, 6, 8, 10, 12, 20, 100];
  let h = '<table class="dtable" role="grid" aria-label="Zar tablosu"><thead><tr><th scope="col"><span class="sr">Zar</span></th>';
  for (let n = 1; n <= 10; n++) h += '<th scope="col">' + n + '</th>';
  h += '</tr></thead><tbody>';
  sides.forEach(s => {
    h += '<tr><th scope="row">' + dieName(s) + '</th>';
    for (let n = 1; n <= 10; n++) h += '<td><button class="dc' + (n === 1 ? ' one' : '') + '" data-act="tbl" data-n="' + n + '" data-s="' + s + '" title="' + n + dieName(s) + ' at" aria-label="' + n + dieName(s) + ' at">' + n + '</button></td>';
    h += '</tr>';
  });
  h += '</tbody></table>';
  $('#diceTable').innerHTML = h;
}
function renderRollAs() {
  const sel = $('#rollAs'); const cur = sel.value;
  const mine = Object.entries(S.chars).filter(([, c]) => canEditChar(c)).sort((a, b) => isNpc(a[1]) - isNpc(b[1]));
  sel.innerHTML = '<option value="">Kendi adımla</option>' + mine.map(([id, c]) => '<option value="' + esc(id) + '">' + esc(charLabel(c)) + (isNpc(c) ? ' (NPC)' : '') + '</option>').join('');
  if (cur && S.chars[cur]) sel.value = cur;
}
function rollWho() { const v = $('#rollAs') ? $('#rollAs').value : ''; const c = v && S.chars[v]; return c ? charLabel(c) : ''; }
function syncVis() {
  $$('[data-vis]').forEach(b => b.classList.toggle('on', (b.dataset.vis === 'secret') === S.secretMode));
  $('#visHint').textContent = S.secretMode ? 'Sonucu sadece sen ve GM görürsünüz; diğerleri kayıtta "gizli atış" görür.' : 'Herkes zarların yuvarlandığını ve sonucu görür.';
  $('#animToggle').checked = S.anim;
  const no = !S.me.id && !!db; $('[data-vis="secret"]').disabled = no;
}
function rollRow(r) {
  let x = r, hiddenStub = false;
  if (r.secret) { if (S.secret[r.id]) x = Object.assign({}, S.secret[r.id], { secret: true }); else hiddenStub = true; }
  const tm = new Date(x.ts || 0); const hh = String(tm.getHours()).padStart(2, '0') + ':' + String(tm.getMinutes()).padStart(2, '0');
  if (hiddenStub) return '<li class="roll stub"><div class="r-top"><span class="r-who">' + esc(r.who || nameOf(r.by)) + '</span><span class="r-time mono">' + hh + '</span></div><div class="r-main"><span class="r-label">Gizli bir zar attı</span><span class="r-total">?</span></div></li>';
  const cls = x.crit === 'hi' ? 'crit-hi' : x.crit === 'lo' ? 'crit-lo' : x.ok === true ? 'ok' : x.ok === false ? 'fail' : '';
  const res = x.dv ? '<span class="chip ' + (x.ok ? 'ok' : 'fail') + '">DV ' + esc(x.dv) + ' · ' + (x.ok ? 'başarılı' : 'başarısız') + '</span>' : '';
  const crit = x.crit === 'hi' ? '<span class="chip crit-hi">' + (x.kind === 'dmg' ? 'kritik yara' : 'kritik başarı') + '</span>' : x.crit === 'lo' ? '<span class="chip crit-lo">kritik başarısızlık</span>' : '';
  const sec = (x.secret || x.secretLocal) ? '<span class="chip">gizli</span>' : '';
  return '<li class="roll ' + cls + (sec ? ' sec' : '') + '"><div class="r-top"><span class="r-who">' + esc(x.who || nameOf(x.by)) + '</span><span class="r-time mono">' + hh + '</span></div><div class="r-main"><span class="r-label">' + esc(x.label) + '</span><span class="r-total">' + esc(x.total) + '</span></div><div class="r-det mono">' + esc(x.detail) + '</div>' + (x.note ? '<div class="r-note">' + esc(x.note) + '</div>' : '') + (res || crit || sec ? '<div class="r-chips">' + sec + crit + res + '</div>' : '') + '</li>';
}
function renderLogOnly() {
  const el = $('#rollLog');
  el.innerHTML = S.rolls.length ? S.rolls.map(rollRow).join('') : '<li class="empty">Henüz zar atılmadı. Tablodan bir zar seç; açık atışları masadaki herkes canlı görür.</li>';
}
function renderLog() { renderLogOnly(); resolveNames(S.rolls.map(r => r.by)); }

// ===== KARAKTER LİSTESİ =====
function renderCharList() {
  const pcs = Object.entries(S.chars).filter(([, c]) => !isNpc(c)).sort((a, b) => ((b[1].owner === S.me.id) - (a[1].owner === S.me.id)) || (a[1].ts - b[1].ts));
  const npcs = Object.entries(S.chars).filter(([, c]) => isNpc(c)).sort((a, b) => a[1].ts - b[1].ts);
  $('#charList').innerHTML = pcs.length ? pcs.map(([id, c]) => charChip(id, c)).join('') : '<p class="empty">Henüz oyuncu karakteri yok. <b>Rastgele karakter</b> 62 stat ve 86 beceri puanını rolüne göre dağıtarak eksiksiz bir sayfa üretir.</p>';
  if (S.me.isGM) $('#npcList').innerHTML = npcs.length ? npcs.map(([id, c]) => charChip(id, c)).join('') : '<p class="empty">NPC yok. Arketip ve tehdit seviyesi seçip üret. NPC\'ler oyunculara gizli başlar; göz simgesiyle açarsın.</p>';
  resolveNames(pcs.map(([, c]) => c.owner));
  renderRollAs();
}
function charChip(id, c) {
  const mx = hpMax(c), st = hpState(c);
  const sub = isNpc(c) ? (ARCHES[c.arche] || {}).n + ' · ' + (TIERS[c.tier] || {}).n : c.role + (c.owner && c.owner !== S.me.id ? ' · ' + nameOf(c.owner) : c.owner === S.me.id ? ' · senin' : '');
  const onMap = S.tokens['t_' + id];
  const hid = onMap ? onMap.hidden : !!c.hidden;
  const drag = S.me.isGM || canEditChar(c);
  const im = c.img ? c.img.url : null;
  return '<div class="cchip' + (S.charSel === id ? ' on' : '') + (hid && S.me.isGM ? ' hid' : '') + '" data-act="selChar" data-id="' + esc(id) + '" role="button" tabindex="0" aria-pressed="' + (S.charSel === id) + '">'
    + (drag ? '<span class="grip" title="Haritaya sürükle" aria-hidden="true">' + ICON_GRIP + '</span>' : '')
    + '<span class="cc-av">' + (im ? '<img alt="" src="' + esc(im) + '">' : esc(initials(charLabel(c)))) + '</span>'
    + '<span class="cc-txt"><span class="cc-name">' + esc(charLabel(c)) + (onMap ? '<i class="onmap" title="Haritada"></i>' : '') + '</span><span class="cc-sub">' + esc(sub) + '</span><span class="cc-hp"><i class="' + st[1] + '" style="width:' + clamp(+c.hp / mx * 100, 0, 100) + '%"></i></span></span>'
    + (S.me.isGM ? '<button class="eye' + (hid ? ' off' : '') + '" data-act="toggleVis" data-id="' + esc(id) + '" title="' + (hid ? 'Oyunculardan gizli: göster' : 'Oyunculara görünür: gizle') + '" aria-label="' + (hid ? 'Oyunculara göster' : 'Oyunculardan gizle') + '">' + (hid ? ICON_EYE_OFF : ICON_EYE) + '</button>' : '')
    + '</div>';
}

// ===== KARAKTER SAYFASI =====
function renderChars() {
  renderCharList();
  const c = S.charSel && S.chars[S.charSel];
  const host = c && isNpc(c) ? $('#npcSheet') : $('#sheet');
  const other = host === $('#sheet') ? $('#npcSheet') : $('#sheet');
  other.innerHTML = '';
  if (!c) { host.innerHTML = ''; S.charSel = null; return; }
  const ae = document.activeElement;
  if (ae && host.contains(ae) && ae.matches('input,textarea,select')) { S.sheetStale = true; updateDerived(S.charSel); return; }
  host.innerHTML = sheetHTML(S.charSel, c, canEditChar(c));
  S.sheetStale = false; updateTargets();
}
function opt(v, l, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>'; }
function pips(c) { const mx = +c.stats.LUCK || 0, cur = c.luck == null ? mx : +c.luck; let h = ''; for (let i = 0; i < mx; i++) h += '<i class="' + (i < cur ? 'on' : '') + '"></i>'; return h || '<span class="dim">LUCK 0</span>'; }
function topSkills(c) {
  return SKILLS.map(s => s[0]).filter(n => (+((c.skills || {})[n]) || 0) > 0 && !FREE_SKILL[n]).sort((a, b) => skBase(c, b) - skBase(c, a)).slice(0, 6);
}
function sheetHTML(id, c, ed) {
  const ro = ed ? '' : ' disabled';
  const N = isNpc(c), role = ROLE[c.role], E = esc(id);
  const mx = hpMax(c), st = hpState(c), im = c.img ? c.img.url : null;
  let h = '<div class="sheet" data-id="' + E + '">';
  // kahraman başlık
  h += '<div class="hero"><button class="portrait"' + (ed ? ' data-act="pickImg"' : ' disabled') + ' aria-label="Portre ' + (im ? 'değiştir' : 'yükle') + '">' + (im ? '<img alt="" src="' + esc(im) + '">' : '<span class="ini">' + esc(initials(charLabel(c))) + '</span>') + (ed ? '<span class="pick">' + (im ? 'Değiştir' : 'Görsel yükle') + '</span>' : '') + '</button>';
  h += '<div class="hero-id"><input class="sh-handle" data-f="handle" value="' + esc(c.handle) + '" placeholder="Takma ad"' + ro + ' aria-label="Takma ad"><input class="sh-name" data-f="name" value="' + esc(c.name) + '" placeholder="Gerçek ad"' + ro + ' aria-label="Gerçek ad">';
  if (N) h += '<div class="hero-tags"><span class="roletag">' + esc((ARCHES[c.arche] || {}).n) + '</span><span class="chip tier-' + esc(c.tier) + '">' + esc((TIERS[c.tier] || {}).n) + '</span><span class="abil"><label>itibar <input type="number" min="0" max="10" data-f="rep" value="' + esc(c.rep || 0) + '"' + ro + '></label></span></div>' + (c.quirk ? '<p class="quirk">' + esc(c.quirk) + '</p>' : '');
  else h += '<div class="hero-tags"><select class="roletag" data-f="role"' + ro + ' aria-label="Rol">' + ROLES.map(r => opt(r.k, r.k, c.role)).join('') + '</select><span class="abil"><span data-d="ability">' + esc(role ? role.a : '') + '</span> <label>rütbe <input type="number" min="1" max="10" data-f="rank" value="' + esc(c.rank) + '"' + ro + '></label><label>itibar <input type="number" min="0" max="10" data-f="rep" value="' + esc(c.rep || 0) + '"' + ro + '></label></span></div><p class="role-t" data-d="roleT">' + esc(role ? role.t : '') + '</p>';
  h += '</div></div>';
  // yaşamsal kartlar
  h += '<div class="vit">';
  h += '<div class="vcard hpcard st-' + st[1] + '" data-d-card="hp"><div class="vlab">HP <span class="st ' + st[1] + '" data-d="hpState">' + (c.dead ? 'Öldü' : st[0]) + '</span></div>'
    + '<div class="hpnum">' + (ed ? '<button class="pm" data-act="hp" data-v="-1" aria-label="HP azalt">−</button>' : '') + '<input type="number" data-f="hp" value="' + esc(c.hp) + '"' + ro + ' aria-label="Mevcut HP"><span class="of">/ <b data-d="hpMax">' + mx + '</b></span>' + (ed ? '<button class="pm" data-act="hp" data-v="1" aria-label="HP artır">+</button>' : '') + '</div>'
    + '<div class="hpbar"><i data-d-w="hp" style="width:' + clamp(+c.hp / mx * 100, 0, 100) + '%"></i><em data-d-l="sw" style="left:' + (swThreshold(c) / mx * 100) + '%" title="Ağır yaralı eşiği"></em></div>'
    + '<div class="vsub">Ağır yaralı &lt; <b data-d="sw">' + swThreshold(c) + '</b> · Ölüm kurtarma <b data-d="ds">' + esc(c.stats.BODY) + '</b> · ceza <b data-d="dsPen">' + (+c.dsPen || 0) + '</b></div>'
    + '<div class="mortal" data-d-show="mortal"' + (+c.hp < 1 ? '' : ' hidden') + '>' + (ed ? '<button class="btn sm danger" data-act="deathSave">Ölüm kurtarma at</button><button class="btn sm" data-act="stabilize">Stabilize edildi</button>' : '<span class="st crit">Ölüm kurtarma atmalı</span>') + '</div></div>';
  const hum = humanity(c), hmax = (+c.stats.EMP || 0) * 10;
  h += '<div class="vcard humcard"><div class="vlab">Humanity</div><div class="bignum"><b data-d="hum">' + hum + '</b><span>/ <span data-d="humMax">' + hmax + '</span></span></div><div class="humbar"><i data-d-w="hum" style="width:' + (hmax ? clamp(hum / hmax * 100, 0, 100) : 0) + '%"></i></div><div class="vsub">Güncel EMP <b data-d="emp">' + curEmp(c) + '</b> · cyberware kaybı <b data-d="hl">' + hlSum(c) + '</b></div></div>';
  h += '<div class="vcard armcard"><div class="vlab">Zırh <select data-act="armorPreset"' + ro + ' aria-label="Zırh">' + ARMORS.map(a => opt(a[0], a[0], c.armor)).join('') + '</select></div><div class="shields"><label class="shield"><span>Kafa</span><input type="number" min="0" max="25" data-f="spHead" value="' + esc(c.spHead) + '"' + ro + ' aria-label="Kafa SP"></label><label class="shield"><span>Gövde</span><input type="number" min="0" max="25" data-f="spBody" value="' + esc(c.spBody) + '"' + ro + ' aria-label="Gövde SP"></label></div><div class="vsub" data-d="apen">' + (armorPen(c) ? 'REF, DEX, MOVE −' + armorPen(c) : 'Ceza yok') + '</div></div>';
  h += '<div class="vcard luckcard"><div class="vlab">LUCK havuzu</div><div class="pips" data-d-html="pips">' + pips(c) + '</div><div class="vsub">Atış çubuğundaki LUCK alanından harcanır; her puan +1.</div>' + (ed ? '<button class="linkbtn" data-act="luckReset">Seans başında yenile</button>' : '') + '</div>';
  h += '</div>';
  h += roleBlockHTML(id, c, ed);
  if (c.juryLock) h += '<div class="jury"><span>Zırh saha tamiriyle geçici olarak tam SP' + (c.juryPrev ? ' (yeni günde eski haline döner)' : '') + '. Tam tamir edilene kadar yeniden saha tamiri yapılamaz.</span>' + (ed ? '<button class="btn sm" data-act="juryDone">Tam tamir edildi</button>' : '') + '</div>';
  // kritik yaralar
  const actv = injActive(c).length;
  h += '<div class="sec-h"><h4>Kritik yaralar</h4><span class="meta">' + (actv ? '<b>' + actv + '</b> aktif · ' : '') + 'ölüm kurtarma temel cezası <b>' + dsBaseOf(c) + '</b></span></div><div class="injwrap">' + bodySVG(c) + '<ul class="injleg"><li class="l-active">Aktif: ceza işliyor</li><li class="l-qf">Hızlı müdahale: gün sonuna kadar etkisiz</li><li class="l-treated">Tedavi edildi</li><li class="l-replaced">Cyberware ile değiştirildi</li><li class="l-lost">Kopuk uzuv</li></ul>' + injListHTML(id, c, ed) + '</div>';
  const effs = effSummary(c);
  if (effs.length) h += '<div class="effs">' + effs.map(t => '<span class="eff">' + esc(t) + '</span>').join('') + '</div>';
  // atış çubuğu
  h += '<div class="rollbar"><label>Hedef DV <input type="number" class="sm" id="dv-' + E + '" value="15" min="0" max="40"></label><label>Menzil <select id="band-' + E + '"><option value="auto">Otomatik</option>' + BAND_TXT.map((b, i) => '<option value="' + i + '">' + b + '</option>').join('') + '<option value="dv">Hedef DV\'yi kullan</option></select></label><label>Mod <input type="number" class="sm" id="mod-' + E + '" value="0" min="-20" max="20"></label>' + (ed ? '<label>LUCK <input type="number" class="sm" id="luck-' + E + '" value="0" min="0" max="10"></label>' : '') + '</div><div class="tgt" data-d-html="tgt"></div>';
  // güçlü beceriler
  const tops = topSkills(c);
  if (tops.length) h += '<div class="topsk">' + tops.map(n => '<button class="skchip" data-act="skill" data-n="' + esc(n) + '"><span>' + esc(n) + '</span><b data-d="sk:' + esc(n) + '">' + skBase(c, n) + '</b></button>').join('') + '</div>';
  // statlar
  h += '<div class="sec-h"><h4>İstatistikler</h4>' + (N ? '' : '<span class="meta">Toplam <b data-d="statSum">' + statSum(c) + '</b>/62 · her biri 2–8</span>') + '</div><div class="stats">';
  STATS.forEach(k => { h += '<label class="stat"><span class="ab">' + k + '</span><input type="number" min="1" max="10" data-f="stats|' + k + '" value="' + esc(c.stats[k]) + '"' + ro + '><span class="tr">' + STAT_TR[k] + '</span></label>'; });
  h += '</div>';
  // silahlar
  h += '<div class="sec-h"><h4>Silahlar</h4><span class="meta">Saldırı: REF (yakın dövüşte DEX) + beceri + d10</span></div><div class="weapons">';
  (c.weapons || []).forEach((w, i) => {
    const info = WEAPON[w.n] || {}; const cls = w.cls || info.cls || 'pistol', af = w.af != null ? w.af : (info.af || 0), rof = w.rof || info.rof || 1;
    h += '<div class="wrow"><input data-f="weapons|' + i + '|n" value="' + esc(w.n) + '"' + ro + ' aria-label="Silah adı"><input class="mono dmgd" data-f="weapons|' + i + '|d" value="' + esc(w.d) + '"' + ro + ' aria-label="Hasar zarı"><div class="wmeta">' + esc(WCLS[cls] || '') + ' · ' + esc(w.sk) + ' · ROF ' + rof + (af ? ' · otomatik ×' + af : '') + '</div><div class="wbtns">'
      + '<button class="btn sm primary" data-act="attack" data-i="' + i + '">Saldırı</button><button class="btn sm" data-act="damage" data-i="' + i + '">Hasar</button>' + (af ? '<button class="btn sm" data-act="autofire" data-i="' + i + '">Otomatik atış</button>' : '') + (ed ? '<button class="x" data-act="delWeapon" data-i="' + i + '" aria-label="Silahı sil">×</button>' : '') + '</div></div>';
  });
  const bd = brawlDice(+c.stats.BODY || 0, hasCyberarm(c));
  h += '<div class="wrow brawl"><span class="wname">Yumruk (Brawling)</span><span class="mono dmgd">' + bd + '</span><div class="wmeta">BODY ' + esc(c.stats.BODY) + (hasCyberarm(c) ? ' · cyberarm' : '') + ' · zırhın yarısını yok saymaz</div><div class="wbtns"><button class="btn sm primary" data-act="brawl">Saldırı</button><button class="btn sm" data-act="brawlDmg">Hasar</button></div></div>';
  if (ed) h += '<div class="addrow"><select id="addW-' + E + '" aria-label="Silah seç">' + WEAPONS.map(w => opt(w[0], w[0] + ' · ' + w[1], '')).join('') + '</select><button class="btn sm" data-act="addWeapon">Ekle</button></div>';
  h += '</div>';
  // hasar alma
  if (ed) {
    h += '<div class="sec-h"><h4>Hasar al</h4><span class="meta">Zırh SP\'si düşülür, hasar geçerse zırh 1 aşınır</span></div><div class="dmgform"><input type="number" min="0" id="dmg-' + E + '" placeholder="Hasar" aria-label="Gelen hasar"><select id="loc-' + E + '" aria-label="Vuruş yeri"><option value="b">Gövde</option><option value="h">Kafa (nişanlı ×2)</option></select><select id="dty-' + E + '" aria-label="Saldırı türü"><option value="r">Menzilli / yumruk</option><option value="m">Yakın silah · yarım zırh</option><option value="x">Zırhı yok say</option></select><button class="btn sm" data-act="applyDmg">Uygula</button><button class="btn sm danger" data-act="critRoll">Kritik yara at</button></div>';
  }
  // beceriler
  h += '<div class="sec-h"><h4>Beceriler</h4><span class="meta">' + (N ? '' : 'Puan <b data-d="skPts">' + skillPts(c) + '</b>/86 · en çok 6 · ') + '<button class="linkbtn" data-act="skFilter">' + (S.skillFilter === 'set' ? 'Tümünü göster' : 'Sadece puanlılar') + '</button></span></div>';
  h += '<p class="hint">Beceri adına bas: STAT + seviye + d10. Zırh, yara ve kritik yara cezaları kendiliğinden eklenir. Ana dil 4 seviyesi ücretsizdir.</p><div class="skills">';
  let lastCat = '';
  SKILLS.forEach(([n, stat, x2, cat]) => {
    const lv = +((c.skills || {})[n]) || 0;
    if (S.skillFilter === 'set' && !lv) return;
    if (cat !== lastCat) { h += '<div class="skcat">' + cat + '</div>'; lastCat = cat; }
    h += '<div class="sk' + (BASIC.indexOf(n) >= 0 ? ' basic' : '') + '"><button class="skn" data-act="skill" data-n="' + esc(n) + '">' + esc(n) + (x2 ? ' <small>×2</small>' : '') + '</button><span class="sks">' + stat + '</span><input type="number" min="0" max="10" data-f="skills|' + esc(n) + '" value="' + lv + '"' + ro + ' aria-label="' + esc(n) + ' seviyesi"><b class="skb" data-d="sk:' + esc(n) + '">' + skBase(c, n) + '</b></div>';
  });
  h += '</div>';
  // cyberware
  h += '<div class="sec-h"><h4>Cyberware</h4><span class="meta">Her parça Humanity düşürür; onlar basamağı düştükçe EMP de düşer</span></div><div class="cyber">';
  (c.cyber || []).forEach((x, i) => { h += '<div class="cyrow"><input data-f="cyber|' + i + '|n" value="' + esc(x.n) + '"' + ro + ' aria-label="Cyberware adı"><label>HL <input type="number" min="0" max="40" data-f="cyber|' + i + '|hl" value="' + esc(x.hl) + '"' + ro + '></label>' + (ed ? '<button class="x" data-act="delCyber" data-i="' + i + '" aria-label="Sil">×</button>' : '') + '</div>'; });
  if (!(c.cyber || []).length) h += '<p class="empty sm">Takılı cyberware yok.</p>';
  if (ed) h += '<div class="addrow cy"><input id="cyN-' + E + '" placeholder="Parça adı, ör. Cybereye" aria-label="Parça adı"><input id="cyD-' + E + '" class="mono" value="2d6" aria-label="Humanity kaybı zarı"><button class="btn sm" data-act="addCyber" data-m="fix" title="Karakter oluştururken: zarın ortalaması">Sabit HL</button><button class="btn sm" data-act="addCyber" data-m="roll" title="Oyun sırasında: zarla">Zarla HL</button></div>';
  h += '</div>';
  // yaşam yolu
  if (!N) {
    h += '<div class="sec-h"><h4>Yaşam yolu</h4>' + (ed ? '<button class="linkbtn" data-act="lifeAll">Hepsini yeniden at</button>' : '') + '</div><dl class="life">';
    for (const k in LIFE) h += '<div><dt>' + LIFE[k].n + '</dt><dd><input data-f="life|' + k + '" value="' + esc((c.life || {})[k] || '') + '"' + ro + ' aria-label="' + esc(LIFE[k].n) + '">' + (ed ? '<button class="x re" data-act="lifeOne" data-k="' + k + '" aria-label="Yeniden at" title="Yeniden at">↻</button>' : '') + '</dd></div>';
    h += '</dl>';
  }
  h += '<div class="sec-h"><h4>Notlar</h4></div><textarea data-f="notes" rows="3"' + ro + ' aria-label="Notlar" placeholder="Bağlantılar, borçlar, eurobucks, itibar…">' + esc(c.notes) + '</textarea>';
  const onMap = S.tokens['t_' + id];
  h += '<div class="sh-actions">' + (ed ? '<button class="btn primary" data-act="toMap">' + (onMap ? 'Haritada göster' : 'Haritaya koy') + '</button>' : (onMap ? '<button class="btn" data-act="toMap">Haritada göster</button>' : '')) + '<button class="btn" data-act="initOne" data-id="' + E + '">İnisiyatif at</button>' + (S.me.isGM ? '<button class="btn" data-act="toggleVis" data-id="' + E + '">' + ((onMap ? onMap.hidden : c.hidden) ? ICON_EYE + ' Oyunculara göster' : ICON_EYE_OFF + ' Oyunculardan gizle') + '</button>' : '') + (ed ? '<button class="btn danger" data-act="delChar">Sayfayı sil</button>' : '') + '</div>';
  if (!ed) h += '<p class="hint">Bu sayfa ' + esc(nameOf(c.owner)) + ' oyuncusuna ait; sadece görüntüleyebilirsin.</p>';
  h += '</div>';
  return h;
}
function updateDerived(id) {
  const c = S.chars[id]; if (!c) return;
  const host = document.querySelector('.sheet[data-id="' + CSS.escape(id) + '"]'); if (!host) return;
  const set = (k, v) => { const e = host.querySelector('[data-d="' + CSS.escape(k) + '"]'); if (e) e.textContent = v; };
  const mx = hpMax(c), st = hpState(c), hum = humanity(c), hmax = (+c.stats.EMP || 0) * 10;
  set('statSum', statSum(c)); set('hpMax', mx); set('sw', swThreshold(c)); set('ds', c.stats.BODY); set('dsPen', +c.dsPen || 0);
  set('hum', hum); set('humMax', hmax); set('emp', curEmp(c)); set('skPts', skillPts(c)); set('hl', hlSum(c));
  set('apen', armorPen(c) ? 'REF, DEX, MOVE −' + armorPen(c) : 'Ceza yok');
  const se = host.querySelector('[data-d="hpState"]'); if (se) { se.textContent = st[0]; se.className = 'st ' + st[1]; }
  const card = host.querySelector('[data-d-card="hp"]'); if (card) card.className = 'vcard hpcard st-' + st[1];
  const hw = host.querySelector('[data-d-w="hp"]'); if (hw) hw.style.width = clamp(+c.hp / mx * 100, 0, 100) + '%';
  const sl = host.querySelector('[data-d-l="sw"]'); if (sl) sl.style.left = (swThreshold(c) / mx * 100) + '%';
  const uw = host.querySelector('[data-d-w="hum"]'); if (uw) uw.style.width = (hmax ? clamp(hum / hmax * 100, 0, 100) : 0) + '%';
  const mo = host.querySelector('[data-d-show="mortal"]'); if (mo) mo.hidden = !(+c.hp < 1);
  const pp = host.querySelector('[data-d-html="pips"]'); if (pp) pp.innerHTML = pips(c);
  if (ROLE[c.role]) { set('ability', ROLE[c.role].a); set('roleT', ROLE[c.role].t); }
  SKILLS.forEach(([n]) => { host.querySelectorAll('[data-d="sk:' + CSS.escape(n) + '"]').forEach(e => e.textContent = skBase(c, n)); });
  const s = $('.stats', host); if (s) s.classList.toggle('over', statSum(c) > 62 && !isNpc(c));
  updateTargets();
}
// seçili hedef ve menzil satırı
function targetInfo(id) {
  const own = S.tokens['t_' + id]; const tid = S.sel && S.sel !== 't_' + id ? S.sel : null; const tgt = tid && S.tokens[tid];
  if (!own || !tgt || (tgt.hidden && !S.me.isGM)) return null;
  const sq = Math.max(Math.abs(own.x - tgt.x), Math.abs(own.y - tgt.y)), m = sq * 2;
  let band = BANDS.findIndex(b => m <= b); if (band < 0) band = BANDS.length - 1;
  return { name: tgt.name, m, band };
}
function updateTargets() {
  $$('.sheet').forEach(sh => {
    const el = sh.querySelector('[data-d-html="tgt"]'); if (!el) return;
    const ti = targetInfo(sh.dataset.id);
    el.innerHTML = ti ? 'Hedef <b>' + esc(ti.name) + '</b> · ' + ti.m + ' m · menzil bandı ' + BAND_TXT[ti.band] : (S.tokens['t_' + sh.dataset.id] ? 'Haritada bir hedef tokene basarsan menzil DV\'si kendiliğinden hesaplanır.' : 'Menzil için karakteri haritaya koy ve hedefe bas, ya da menzil bandını elle seç.');
  });
}
function setPath(o, path, val) {
  const ks = path.split('|'); let cur = o;
  for (let i = 0; i < ks.length - 1; i++) { const k = /^\d+$/.test(ks[i]) ? +ks[i] : ks[i]; if (cur[k] == null) cur[k] = {}; cur = cur[k]; }
  cur[ks[ks.length - 1]] = val;
}
function syncNpcTok(id) {
  const c = S.chars[id], tid = 't_' + id, tk = S.tokens[tid]; if (!c || !tk) return;
  let ch = false;
  { const st = c.dead ? 'dead' : hpState(c)[1]; if (tk.st !== st) { tk.st = st; ch = true; } }
  { const n = injActive(c).length; if ((tk.inj || 0) !== n) { tk.inj = n; ch = true; } }
  const im = c.img ? c.img.url : null; if ((tk.img || null) !== im) { tk.img = im; ch = true; }
  if (tk.name !== charLabel(c)) { tk.name = charLabel(c); ch = true; }
  if (ch) saveLater(tokPath(tid), () => S.tokens[tid], 500);
}
function saveChar(id, ms) { if (!S.chars[id]) return; saveLater(charPath(id), () => S.chars[id], ms == null ? 600 : ms); syncNpcTok(id); }
function saveCharNow(id) { const p = charPath(id); clearTimeout(debounced[p]); delete debounced[p]; if (S.chars[id]) setDoc(p, S.chars[id]); syncNpcTok(id); }

document.addEventListener('input', e => {
  const t = e.target; const f = t.dataset && t.dataset.f; if (!f) return;
  const sh = t.closest('.sheet'); if (!sh) return;
  const id = sh.dataset.id, c = S.chars[id]; if (!c || !canEditChar(c)) return;
  let v = t.value; if (t.type === 'number') v = v === '' ? 0 : clamp(+v, -99, 99);
  setPath(c, f, v);
  if (f === 'stats|LUCK' && c.luck != null) c.luck = Math.min(+c.luck, +v);
  updateDerived(id); saveChar(id);
  if (f === 'hp' || f.startsWith('stats|')) { dirty(); renderTokCard(); }
});
document.addEventListener('focusout', () => {
  if (!S.sheetStale) return;
  setTimeout(() => { const ae = document.activeElement; if (ae && ae.closest && ae.closest('.sheet') && ae.matches('input,textarea,select')) return; if (S.sheetStale) renderChars(); }, 0);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'armorPreset') {
    const id = t.closest('.sheet').dataset.id, c = S.chars[id]; if (!c) return;
    c.armor = t.value; c.spBody = ARMOR[t.value] || 0; c.spHead = ARMOR[t.value] || 0; saveCharNow(id); renderChars(); dirty();
  }
  if (t.dataset.f === 'role') renderChars();
  if (t.dataset.act === 'injSt') { const id = t.closest('.sheet').dataset.id, c = S.chars[id]; const x = normInj(c)[+t.dataset.i]; x.st = t.value; saveCharNow(id); renderChars(); dirty(); }
  if (t.id === 'animToggle') { S.anim = t.checked; try { localStorage.setItem('ncm-anim', S.anim ? '1' : '0'); } catch (x) { } }
  if (t.id === 'imgInput') onImagePicked(t);
  if (t.id === 'rollAs') S.rollAsTouched = true;
});

// ===== PORTRE =====
let imgFor_ = null;
function pickImage(id) { imgFor_ = id; const inp = $('#imgInput'); inp.value = ''; inp.click(); }
async function onImagePicked(inp) {
  const f = inp.files && inp.files[0]; const id = imgFor_; if (!f || !id || !S.chars[id]) return;
  if (!/^image\//.test(f.type)) { toast('Bir görsel dosyası seç (JPG, PNG, WEBP).', 'err'); return; }
  try {
    const bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(f); });
    const S2 = 320, cv = document.createElement('canvas'); cv.width = cv.height = S2; const g = cv.getContext('2d');
    const s = Math.min(bmp.naturalWidth, bmp.naturalHeight);
    g.drawImage(bmp, (bmp.naturalWidth - s) / 2, (bmp.naturalHeight - s) * 0.35, s, s, 0, 0, S2, S2);
    URL.revokeObjectURL(bmp.src);
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.84));
    let img = null;
    if (assets) { try { const up = await assets.upload(blob); img = { id: up.id, url: up.url }; } catch (e) { img = null; } }
    if (!img) { const small = document.createElement('canvas'); small.width = small.height = 200; small.getContext('2d').drawImage(cv, 0, 0, 200, 200); img = { url: small.toDataURL('image/jpeg', 0.8) }; }
    const c = S.chars[id]; c.img = img; saveCharNow(id); renderChars(); dirty(); renderTokCard();
    toast('Portre güncellendi.');
  } catch (e) { toast('Görsel okunamadı. Başka bir dosya dene.', 'err'); }
}

// ===== KARAKTER İŞLEMLERİ =====
function activeChar(btn) { const sh = btn.closest('.sheet'); const id = sh && sh.dataset.id; return id ? [id, S.chars[id]] : [null, null]; }
function sheetMods(id, c, ctx) {
  const a = autoMods(c, ctx);
  const manual = +(($('#mod-' + CSS.escape(id)) || {}).value || 0);
  const luckIn = $('#luck-' + CSS.escape(id)); let luck = luckIn ? clamp(+luckIn.value || 0, 0, 10) : 0;
  const pool = c.luck == null ? (+c.stats.LUCK || 0) : +c.luck;
  if (luck > pool) { toast('LUCK havuzunda ' + pool + ' puan var.', 'err'); luck = pool; }
  const notes = a.notes.slice(); if (manual) notes.push('elle ' + (manual > 0 ? '+' : '') + manual); if (luck) notes.push('LUCK +' + luck);
  return { mod: a.mod + manual + luck, notes, luck, spend: () => { if (luck) { c.luck = pool - luck; if (luckIn) luckIn.value = 0; saveCharNow(id); updateDerived(id); } } };
}
function rangeDV(id, cls, auto) {
  const sel = $('#band-' + CSS.escape(id)); const dvIn = +(($('#dv-' + CSS.escape(id)) || {}).value || 0);
  const v = sel ? sel.value : 'dv';
  const table = auto ? AF_DV[cls] : RANGE_DV[cls];
  let band = null, why = '';
  if (v === 'auto') { const ti = targetInfo(id); if (ti) { band = ti.band; why = ti.name + ' · ' + ti.m + ' m'; } }
  else if (v !== 'dv') { band = +v; why = BAND_TXT[band]; }
  if (band != null && table) {
    const dv = table[band];
    if (dv == null) return { dv: null, why: why + ': bu silahın menzili dışında' };
    return { dv, why: why + ' → DV ' + dv };
  }
  return { dv: dvIn, why: 'hedef DV ' + dvIn };
}
async function placeTokenAt(id, c, cell) {
  const m = S.map || curMap(); if (!m) { toast('Önce bir harita gerekli.', 'err'); return; }
  const tid = 't_' + id;
  if (!walkable(m, cell.x, cell.y)) { toast('Oraya token konamaz: ' + (TILE[tAt(m, cell.x, cell.y)] || { n: 'harita dışı' }).n.toLowerCase() + '.', 'err'); return; }
  const occ = tokenAt(cell); if (occ && occ !== tid) { toast('O karede başka biri var.', 'err'); return; }
  if (S.tokens[tid]) { const tk = S.tokens[tid]; tk.x = cell.x; tk.y = cell.y; S.sel = tid; setDoc(tokPath(tid), tk); renderTokCard(); dirty(); return; }
  const used = Object.values(S.tokens).map(t => t.color);
  const col = isNpc(c) ? '#ff6b8b' : (TOKEN_COLORS.find(x => used.indexOf(x) < 0) || rpick(TOKEN_COLORS));
  const hidden = S.me.isGM && !!c.hidden;
  const tk = { name: charLabel(c), color: col, x: cell.x, y: cell.y, kind: c.kind, charId: id, owner: c.owner || null, hidden, img: c.img ? c.img.url : null, st: hpState(c)[1], ts: Date.now() };
  S.tokens[tid] = tk; S.sel = tid; setDoc(tokPath(tid), tk); renderTokCard(); renderCharList(); dirty();
}
function placeToken(id, c) {
  const m = S.map || curMap(); if (!m) { toast('Önce bir harita gerekli.', 'err'); return; }
  const tid = 't_' + id;
  if (S.tokens[tid]) { S.sel = tid; centerOn(S.tokens[tid]); renderTokCard(); return; }
  const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2);
  let spot = null;
  for (let r = 0; r < Math.max(m.w, m.h) && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = cx + dx, y = cy + dy; if (walkable(m, x, y) && !tokenAt({ x, y })) spot = { x, y };
  }
  if (!spot) { toast('Haritada boş kare bulunamadı.', 'err'); return; }
  placeTokenAt(id, c, spot).then(() => S.tokens[tid] && centerOn(S.tokens[tid]));
}
function centerOn(tk) { S.view.x = VW / 2 - (tk.x + .5) * CS * S.view.s; S.view.y = VH / 2 - (tk.y + .5) * CS * S.view.s; S.userMoved = true; dirty(); }
async function rollInit(charId) {
  const c = S.chars[charId]; if (!c) return;
  const ref = effStat(c, 'REF'); const ir = caIr(c);
  const g = await physRoll([{ n: 1, s: 10 }], 'İnisiyatif', { who: charLabel(c) });
  const d = g[0].vals[0], score = ref + d + ir;
  const init = clone(S.init || { order: [], turn: 0, round: 1 });
  const tok = S.tokens['t_' + charId] ? 't_' + charId : null;
  init.order = (init.order || []).filter(e => e.cid !== charId);
  init.order.push({ cid: charId, tok, name: charLabel(c), score, npc: isNpc(c), hid: !!(tok && S.tokens[tok].hidden) });
  init.order.sort((a, b) => b.score - a.score);
  S.init = init; renderInit(); dirty();
  await setDoc('table/init', init);
  await logRoll({ who: charLabel(c), label: 'İnisiyatif', total: score, detail: 'REF ' + ref + ' + d10 [' + d + ']' + (ir ? ' + Initiative Reaction ' + ir : ''), kind: 'init' });
}
function applyDamage(id) {
  const c = S.chars[id]; const inp = $('#dmg-' + CSS.escape(id)); const loc = $('#loc-' + CSS.escape(id)).value; const ty = $('#dty-' + CSS.escape(id)).value;
  const dmg = Math.max(0, +inp.value || 0); if (!dmg) { toast('Önce gelen hasarı yaz.', 'err'); return; }
  const key = loc === 'h' ? 'spHead' : 'spBody'; const sp = +c[key] || 0;
  const eff = ty === 'x' ? 0 : ty === 'm' ? Math.ceil(sp / 2) : sp;
  const wasMortal = +c.hp < 1;
  let through = Math.max(0, dmg - eff);
  if (!through) { toast('Zırh hasarın tamamını durdurdu (etkin SP ' + eff + ').'); inp.value = ''; return; }
  if (loc === 'h') through *= injEff(c).skull ? 3 : 2;
  c.hp = Math.max(0, (+c.hp || 0) - through);
  if (ty !== 'x') c[key] = Math.max(0, sp - 1);
  saveCharNow(id); inp.value = '';
  toast(charLabel(c) + ' ' + through + ' hasar aldı' + (ty !== 'x' ? ', ' + (loc === 'h' ? 'kafa' : 'gövde') + ' zırhı SP ' + c[key] + ' oldu' : '') + '.' + (wasMortal ? ' Ölümcül yaralıyken hasar aldı: kritik yara atılmalı.' : ''));
  renderChars(); renderTokCard(); dirty();
}
async function critRoll(id) {
  const c = S.chars[id]; const loc = $('#loc-' + CSS.escape(id)).value;
  const nm = await critFor(id, loc);
  if (nm) { const tid = 't_' + id; if (S.tokens[tid]) playFx({ k: 'text', b: tid, txt: nm.toUpperCase(), col: '#ff4a5f', res: 'crit' }); }
}
async function deathSave(id) {
  const c = S.chars[id];
  const g = await physRoll([{ n: 1, s: 10 }], 'Ölüm kurtarma', { who: charLabel(c) });
  const d = g[0].vals[0], pen = +c.dsPen || 0, total = d + pen, body = +c.stats.BODY || 0;
  const ok = d !== 10 && total < body;
  c.dsPen = pen + 1; if (!ok) c.dead = true; saveCharNow(id); updateDerived(id); renderChars();
  if (!ok && S.tokens['t_' + id]) playFx({ k: 'death', b: 't_' + id, txt: 'ÖLDÜ', col: '#ff4a5f' });
  await logRoll({ who: charLabel(c), label: 'Ölüm kurtarma', total, detail: 'd10 [' + d + '] + ceza ' + pen + (d === 10 ? ' · doğal 10 her zaman başarısız' : '') + ' · BODY ' + body + '\'in altında olmalı', ok, kind: 'death', note: ok ? 'Hayatta, sırası normal devam eder.' : 'Başarısız: karakter öldü.' });
}

// ===== OLAY YÖNETİCİSİ =====
document.addEventListener('click', e => {
  if (S.justDragged) { S.justDragged = false; e.preventDefault(); return; }
  const b = e.target.closest('[data-act],[data-tool],[data-tab],[data-tpl],[data-brush],[data-bs],[data-dens],[data-dv],[data-vis],[data-ev]');
  if (!b || b.disabled) return;
  if (b.dataset.tab) return switchTab(b.dataset.tab);
  if (b.dataset.tool) return setTool(b.dataset.tool);
  if (b.dataset.vis) { S.secretMode = b.dataset.vis === 'secret'; syncVis(); return; }
  if (b.dataset.ev != null) return applyEvent(+b.dataset.ev);
  if (b.dataset.brush != null) { S.brush = b.dataset.brush; $$('.swatch').forEach(x => x.classList.toggle('on', x === b)); $('#brushName').textContent = TILE[S.brush].n; if (S.tool !== 'paint' && S.tool !== 'fill') setTool('paint'); return; }
  if (b.dataset.bs) { S.brushSize = +b.dataset.bs; $$('[data-bs]').forEach(x => x.classList.toggle('on', x === b)); return; }
  if (b.dataset.tpl) { S.gen.tpl = b.dataset.tpl; const T = TEMPLATES[b.dataset.tpl]; S.gen.w = T.w; S.gen.h = T.h; syncGenForm(); doPreview(); return; }
  if (b.dataset.dens) { S.gen.dens = +b.dataset.dens; syncGenForm(); doPreview(); return; }
  if (b.dataset.dv) { $('#ckDv').value = b.dataset.dv; $$('[data-dv]').forEach(x => x.classList.toggle('on', x === b)); return; }
  const H = ACTIONS[b.dataset.act]; if (H) H(b, e);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.cchip')) { e.preventDefault(); ACTIONS.selChar(e.target); } });
const R_ = fn => (b, e) => lockRoll(() => fn(b, e));
const ACTIONS = {
  zoomIn: () => zoomAt(S.view.s * 1.25, VW / 2, VH / 2),
  zoomOut: () => zoomAt(S.view.s / 1.25, VW / 2, VH / 2),
  fit: () => fitView(),
  traySkip: () => Dice3D.skip(),
  tbl: R_(b => { const n = +b.dataset.n, s = +b.dataset.s, md = +$('#tblMod').value || 0; return rollExpr(n + 'd' + s + (md ? (md > 0 ? '+' : '') + md : ''), n + dieName(s) + (md ? (md > 0 ? '+' : '') + md : ''), rollWho()); }),
  rollExpr: R_(() => { const v = $('#expr').value.trim(); if (!v) { toast('Bir zar ifadesi yaz, ör. 3d6+2', 'err'); return; } return rollExpr(v, v.replace(/\s+/g, ''), rollWho(), +$('#tblMod').value || 0); }),
  rollCheck: R_(() => {
    const st = +$('#ckStat').value || 0, sk = +$('#ckSkill').value || 0, md = +$('#ckMod').value || 0, dv = +$('#ckDv').value || 0;
    return doCheck({ who: rollWho(), label: S.ckLabel || 'Kontrol', base: st + sk, mod: md, dv, pre: 'STAT ' + st + ' + beceri ' + sk + ' →' });
  }),
  clearRolls: b => armConfirm(b, async () => { const ids = S.rolls.map(r => r.id); for (const id of ids) await delDoc('rolls/' + id); if (S.me.isGM && db && S.me.id) { S.mySecret = []; setDoc('secret/' + S.me.id, { rolls: [] }); } toast('Zar kaydı temizlendi.'); }),
  newRandom: () => { const role = $('#newRole').value; const c = makePC(role); const id = 'c_' + uid(); S.chars[id] = c; S.charSel = id; setDoc('chars/' + id, c); renderChars(); toast(charLabel(c) + ' (' + c.role + ') hazır.'); },
  newBlank: () => { const c = makeBlank(); const id = 'c_' + uid(); S.chars[id] = c; S.charSel = id; setDoc('chars/' + id, c); renderChars(); },
  selChar: b => { S.charSel = S.charSel === b.dataset.id ? null : b.dataset.id; renderChars(); const sh = $('.sheet'); if (sh && S.charSel) sh.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
  toggleVis: (b, e) => { if (e) e.stopPropagation(); const id = b.dataset.id, c = S.chars[id]; if (!c) return; const tk = S.tokens['t_' + id]; const cur = tk ? tk.hidden : !!c.hidden; setCharHidden(id, !cur); },
  openSheet: b => { const id = b.dataset.id, c = S.chars[id]; if (!c) return; S.charSel = id; switchTab(isNpc(c) && S.me.isGM ? 'npc' : 'chars'); renderChars(); },
  pickImg: b => { const [id] = activeChar(b); if (id) pickImage(id); },
  hp: b => { const [id, c] = activeChar(b); if (!c) return; c.hp = Math.max(0, (+c.hp || 0) + (+b.dataset.v)); const inp = b.closest('.hpnum').querySelector('input'); inp.value = c.hp; updateDerived(id); saveChar(id, 300); renderTokCard(); dirty(); },
  applyDmg: b => { const [id] = activeChar(b); if (id) applyDamage(id); },
  critRoll: R_(b => { const [id] = activeChar(b); if (id) return critRoll(id); }),
  delCrit: b => armConfirm(b, () => { const [id, c] = activeChar(b); c.crits.splice(+b.dataset.i, 1); saveCharNow(id); renderChars(); dirty(); }, '?'),
  injSide: b => { const [id, c] = activeChar(b); const x = normInj(c)[+b.dataset.i]; x.side = x.side === 'L' ? 'R' : 'L'; saveCharNow(id); renderChars(); },
  selfQf: R_(async b => {
    const [id, c] = activeChar(b); const x = normInj(c)[+b.dataset.i]; const s = INJ[injKey(x)]; if (!s || !s.qf) return;
    const best = bestHeal(c, s.qf); if (!best) { toast('Bu yara için gereken beceri yok.', 'err'); return; }
    const a = autoMods(c, 'hand');
    const r = await doCheck({ who: charLabel(c), label: 'Hızlı müdahale · ' + s.n, base: best.base, mod: a.mod, dv: best.dv, notes: a.notes, pre: 'TECH + ' + best.sk + ' →' });
    if (r.okReal) { x.st = s.perm ? 'treated' : 'qf'; saveCharNow(id); renderChars(); dirty(); if (S.tokens['t_' + id]) playFx({ k: 'heal', b: 't_' + id, res: 'hit', txt: s.perm ? 'İYİLEŞTİ' : 'HIZLI MÜDAHALE', col: '#7bd88f' }); }
  }),
  newDay: b => armConfirm(b, () => {
    let healed = 0, qf = 0;
    Object.entries(S.chars).forEach(([id, c]) => {
      if (!canEditChar(c)) return; let ch = false;
      normInj(c).forEach(x => { if (x.st === 'qf') { x.st = 'active'; qf++; ch = true; } });
      if (c.stim) { c.stim = 0; ch = true; }
      if (c.juryPrev) { c.spBody = c.juryPrev.spBody; c.spHead = c.juryPrev.spHead; c.juryPrev = null; ch = true; }
      if (c.stab && !c.dead && +c.hp > 0 && +c.hp < hpMax(c)) { c.hp = Math.min(hpMax(c), (+c.hp || 0) + (+c.stats.BODY || 0)); healed++; ch = true; if (+c.hp >= hpMax(c)) c.stab = false; }
      if (ch) saveCharNow(id);
    });
    S.day = (S.day || 0) + 1; setDoc('gm/clock', { day: S.day });
    renderChars(); renderTokCard(); dirty();
    toast('Yeni gün: ' + healed + ' karakter BODY kadar iyileşti, ' + qf + ' hızlı müdahalenin etkisi bitti.');
  }, 'Emin misin? Tekrar bas'),
  deathSave: R_(b => { const [id] = activeChar(b); if (id) return deathSave(id); }),
  stabilize: b => { const [id, c] = activeChar(b); c.hp = 1; c.stab = true; c.dsPen = dsBaseOf(c); saveCharNow(id); renderChars(); renderTokCard(); dirty(); toast(charLabel(c) + ' 1 HP\'ye stabilize edildi; ölüm kurtarma cezası temel değere döndü.'); },
  luckReset: b => { const [id, c] = activeChar(b); c.luck = +c.stats.LUCK || 0; saveCharNow(id); updateDerived(id); },
  attack: R_(b => {
    const [id, c] = activeChar(b); const w = c.weapons[+b.dataset.i]; if (!w) return;
    const info = WEAPON[w.n] || {}; const cls = w.cls || info.cls || 'pistol'; const sk = w.sk || info.sk || 'Handgun';
    const melee = cls === 'melee' || sk === 'Melee Weapon' || sk === 'Brawling' || sk === 'Martial Arts';
    const stat = melee ? 'DEX' : 'REF';
    const blk = injBlock(c, melee ? 'melee' : 'ranged', cls); if (blk) { toast(blk, 'err'); return; }
    const base = effStat(c, stat) + (+(c.skills || {})[sk] || 0);
    const M = sheetMods(id, c, melee ? 'melee' : 'ranged');
    let dv, why;
    if (melee) { dv = +$('#dv-' + CSS.escape(id)).value || 0; why = 'savunanın DEX + Evasion + d10 toplamı ' + dv; }
    else { const r = rangeDV(id, cls, false); if (r.dv == null) { toast(r.why + '.', 'err'); return; } dv = r.dv; why = r.why; }
    M.spend();
    return doCheck({ who: charLabel(c), label: 'Saldırı · ' + w.n, base, mod: M.mod, dv, notes: M.notes.concat([why]), pre: stat + ' ' + effStat(c, stat) + ' + ' + sk + ' →' });
  }),
  autofire: R_(async b => {
    const [id, c] = activeChar(b); const w = c.weapons[+b.dataset.i]; const info = WEAPON[w.n] || {}; const cls = w.cls || info.cls; const cap = w.af || info.af || 3;
    if (!AF_DV[cls]) { toast('Bu silah otomatik atış yapamaz.', 'err'); return; }
    const r = rangeDV(id, cls, true); if (r.dv == null) { toast('Otomatik atış 100 m\'den uzağa yapılamaz.', 'err'); return; }
    const blk = injBlock(c, 'ranged', cls); if (blk) { toast(blk, 'err'); return; }
    const M = sheetMods(id, c, 'ranged'); M.spend();
    const base = effStat(c, 'REF') + (+(c.skills || {}).Autofire || 0);
    const chk = await doCheck({ who: charLabel(c), label: 'Otomatik atış · ' + w.n, base, mod: M.mod, dv: r.dv, notes: M.notes.concat([r.why]), pre: 'REF + Autofire →' });
    if (!chk.ok) return;
    const mult = Math.min(chk.total - r.dv, cap);
    await doDamage({ who: charLabel(c), label: 'Otomatik atış hasarı · ' + w.n, expr: '2d6', mult });
  }),
  damage: R_(b => { const [, c] = activeChar(b); const w = c.weapons[+b.dataset.i]; if (!w) return; return doDamage({ who: charLabel(c), label: 'Hasar · ' + w.n, expr: w.d }); }),
  brawl: R_(b => { const [id, c] = activeChar(b); const M = sheetMods(id, c, 'melee'); M.spend(); const dv = +$('#dv-' + CSS.escape(id)).value || 0; return doCheck({ who: charLabel(c), label: 'Yumruk', base: effStat(c, 'DEX') + (+(c.skills || {}).Brawling || 0), mod: M.mod, dv, notes: M.notes, pre: 'DEX + Brawling →' }); }),
  brawlDmg: R_(b => { const [, c] = activeChar(b); return doDamage({ who: charLabel(c), label: 'Yumruk hasarı', expr: brawlDice(+c.stats.BODY || 0, hasCyberarm(c)) }); }),
  skill: R_(b => {
    const [id, c] = activeChar(b); const n = b.dataset.n; const ctx = ctxOfSkill(n); const blk = injBlock(c, ctx); if (blk && ctx === 'speech') { toast(blk, 'err'); return; } const M = sheetMods(id, c, ctx); M.spend();
    const dv = +$('#dv-' + CSS.escape(id)).value || 0;
    const rb = roleSkillBonus(c, n); rb.forEach(([t, v]) => { M.mod += v; M.notes.push(t + ' +' + v); });
    return doCheck({ who: charLabel(c), label: n, base: skBase(c, n), mod: M.mod, dv, notes: M.notes, pre: SKILL[n].stat + ' ' + effStat(c, SKILL[n].stat) + ' + ' + n + ' ' + ((c.skills || {})[n] || 0) + ' →' });
  }),
  skFilter: () => { S.skillFilter = S.skillFilter === 'set' ? 'all' : 'set'; renderChars(); },
  addWeapon: b => { const [id, c] = activeChar(b); const n = $('#addW-' + CSS.escape(id)).value; c.weapons = c.weapons || []; c.weapons.push(mkWeapon(n)); saveCharNow(id); renderChars(); },
  delWeapon: b => { const [id, c] = activeChar(b); c.weapons.splice(+b.dataset.i, 1); saveCharNow(id); renderChars(); },
  addCyber: R_(async b => {
    const [id, c] = activeChar(b); const n = $('#cyN-' + CSS.escape(id)).value.trim() || 'Cyberware'; const ex = $('#cyD-' + CSS.escape(id)).value.trim() || '2d6';
    const p = parseDice(ex); if (!p || p.err) { toast('HL zarı anlaşılamadı. Örnek: 2d6', 'err'); return; }
    let hl;
    if (b.dataset.m === 'fix') { hl = p.add + p.groups.reduce((a, g) => a + g.sign * Math.floor(g.n * (g.s + 1) / 2), 0); }
    else { const r = await rollExpr(ex, 'Humanity kaybı · ' + n, charLabel(c)); if (!r) return; hl = r.total; }
    c.cyber = c.cyber || []; c.cyber.push({ n, hl: Math.max(0, hl) }); saveCharNow(id); renderChars();
    if (b.dataset.m === 'fix') toast(n + ' takıldı: sabit Humanity kaybı ' + hl + '.');
  }),
  delCyber: b => { const [id, c] = activeChar(b); c.cyber.splice(+b.dataset.i, 1); saveCharNow(id); renderChars(); },
  lifeOne: b => { const [id, c] = activeChar(b); c.life = c.life || {}; c.life[b.dataset.k] = rpick(LIFE[b.dataset.k].v); saveCharNow(id); renderChars(); },
  lifeAll: b => { const [id, c] = activeChar(b); c.life = rollLife(); saveCharNow(id); renderChars(); },
  toMap: b => { const [id, c] = activeChar(b); if (c) placeToken(id, c); },
  initOne: R_(b => { const id = b.dataset.id; if (S.chars[id]) return rollInit(id); }),
  delChar: b => armConfirm(b, () => { const [id] = activeChar(b); const p = charPath(id); delete S.chars[id]; S.charSel = null; delDoc(p); const tid = 't_' + id; if (S.tokens[tid]) { const tp = tokPath(tid); delete S.tokens[tid]; delDoc(tp); } renderChars(); dirty(); }),
  genNpc: () => {
    const ak = $('#npcArche').value, tk = $('#npcTier').value, n = clamp(+$('#npcCount').value || 1, 1, 8);
    let last = null;
    for (let i = 0; i < n; i++) { const c = makeNPC(ak, tk); const id = 'n_' + uid(); S.chars[id] = c; setDoc('npcs/' + id, c); last = id; }
    S.charSel = n === 1 ? last : null; renderChars();
    toast(n + ' NPC üretildi. Oyunculardan gizli; haritaya sürükleyebilirsin.');
  },
  npcAllToMap: () => { Object.entries(S.chars).filter(([id, c]) => isNpc(c) && !S.tokens['t_' + id]).forEach(([id, c]) => placeToken(id, c)); },
  tokClose: () => { S.sel = null; renderTokCard(); dirty(); },
  tokHp: b => { const tk = S.tokens[S.sel]; const c = tokChar(tk); if (!c) return; c.hp = Math.max(0, (+c.hp || 0) + (+b.dataset.v)); saveChar(tk.charId, 300); renderTokCard(); renderChars(); dirty(); },
  tokColor: () => { const tk = S.tokens[S.sel]; if (!tk) return; const i = TOKEN_COLORS.indexOf(tk.color); tk.color = TOKEN_COLORS[(i + 1) % TOKEN_COLORS.length]; const id = S.sel; saveLater(tokPath(id), () => S.tokens[id], 300); renderTokCard(); dirty(); },
  tokHide: () => { const tk = S.tokens[S.sel]; if (!tk) return; if (tk.charId && S.chars[tk.charId]) setCharHidden(tk.charId, !tk.hidden); else setTokHidden(S.sel, !tk.hidden); },
  tokDel: b => armConfirm(b, () => { const id = S.sel; const p = tokPath(id); delete S.tokens[id]; S.sel = null; delDoc(p); renderTokCard(); renderCharList(); dirty(); }, 'Kaldır?'),
  initNext: () => stepInit(1), initPrev: () => stepInit(-1),
  initAll: R_(async () => {
    const list = Object.entries(S.tokens);
    if (!list.length) { toast('Haritada token yok.', 'err'); return; }
    const order = [];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      const g = await physRoll([{ n: chunk.length, s: 10 }], 'İnisiyatif · ' + chunk.length + ' kişi', { who: 'GM' });
      chunk.forEach(([tid, tk], k) => { const c = tokChar(tk); const ref = c ? effStat(c, 'REF') + caIr(c) : 5; order.push({ cid: tk.charId || null, tok: tid, name: tk.name, score: ref + g[0].vals[k], npc: tk.kind === 'npc', hid: !!tk.hidden }); });
    }
    order.sort((a, b) => b.score - a.score);
    S.init = { order, turn: 0, round: 1 }; renderInit(); dirty();
    await setDoc('table/init', S.init);
    await logRoll({ who: 'GM', label: 'İnisiyatif · herkes', total: order.length + ' kişi', detail: order.filter(o => !o.hid).map(o => o.name + ' ' + o.score).join(' · '), kind: 'init' });
  }),
  initClear: b => armConfirm(b, () => { S.init = { order: [], turn: 0, round: 1 }; setDoc('table/init', S.init); renderInit(); dirty(); }),
  initDel: b => { const i = +b.dataset.i; const init = clone(S.init); init.order.splice(i, 1); if (init.turn >= init.order.length) init.turn = 0; S.init = init; setDoc('table/init', init); renderInit(); dirty(); },
  initGo: b => { const e = S.init.order[+b.dataset.i]; if (e && e.tok && S.tokens[e.tok]) { S.sel = e.tok; centerOn(S.tokens[e.tok]); renderTokCard(); } },
  reseed: () => { S.gen.seed = rnd(1000, 99999); syncGenForm(); doPreview(); },
  preview: () => doPreview(),
  publishMap: () => publishMap(),
  publishDemo: () => { S.preview = clone(S.demo); publishMap(); },
  cancelPreview: () => { S.preview = null; onMapChange(); },
  clearTokens: b => armConfirm(b, () => { Object.keys(S.tokens).forEach(id => delDoc(tokPath(id))); S.tokens = {}; S.sel = null; renderTokCard(); dirty(); toast('Tüm tokenlar kaldırıldı.'); }),
  openActMenu: (b, e) => { const r = b.getBoundingClientRect(); showMenu(S.sel, null, r.left, r.top); },
  reqCheck: () => startTargeting({ mode: 'req', actor: null, picks: S.sel ? [S.sel] : [], max: 20, label: 'Kontrol istenecek tokenleri seç' }),
  release: () => { const pairs = Object.assign({}, FX.pairs); Object.keys(pairs).forEach(k => { if (pairs[k].a === S.sel || pairs[k].b === S.sel) delete pairs[k]; }); FX.pairs = pairs; setDoc('table/grapple', { pairs }); renderTokCard(); dirty(); },
  soundOpen: () => { const p = $('#soundPop'); p.hidden = !p.hidden; renderSound(); },
  soundUnlock: () => { Sound.ensure(); MUS.need = false; musSync(); setTimeout(renderSound, 150); },
  ckClear: () => { S.ckLabel = 'Kontrol'; $('#ckLabel').textContent = 'Serbest kontrol'; $('#ckNote').textContent = ''; },
};
function stepInit(d) {
  const init = clone(S.init); const n = (init.order || []).length; if (!n) return;
  init.turn = (init.turn || 0) + d;
  if (init.turn >= n) { init.turn = 0; init.round = (init.round || 1) + 1; }
  if (init.turn < 0) { init.turn = n - 1; init.round = Math.max(1, (init.round || 1) - 1); }
  S.init = init; setDoc('table/init', init); renderInit(); dirty();
  const e = init.order[init.turn]; if (e && e.tok && S.tokens[e.tok]) { S.sel = e.tok; renderTokCard(); }
}
function renderInit() {
  const o = S.init.order || [];
  $('#initRound').textContent = S.init.round || 1;
  $('#initList').innerHTML = o.length ? o.map((e, i) => {
    const tk = e.tok && S.tokens[e.tok]; if ((e.hid || (tk && tk.hidden)) && !S.me.isGM) return '';
    return '<li class="' + (i === S.init.turn ? 'cur' : '') + (e.npc ? ' npc' : '') + '"><span class="sc mono">' + esc(e.score) + '</span><button class="linkbtn nm" data-act="initGo" data-i="' + i + '">' + esc(e.name) + '</button>' + (i === S.init.turn ? '<span class="chip acc">sırada</span>' : '') + (S.me.isGM ? '<button class="x" data-act="initDel" data-i="' + i + '" aria-label="Sıradan çıkar">×</button>' : '') + '</li>';
  }).join('') : '<li class="empty">Sıra boş. ' + (S.me.isGM ? '<b>Haritadakileri at</b> herkes için REF + d10 atar.' : 'Karakter sayfandan <b>İnisiyatif at</b>.') + '</li>';
}

// ===== KURAL SEKMESİ (GM) =====
function buildRules() {
  const cats = [...new Set(EVENTS.map(e => e.cat))];
  $('#ruleList').innerHTML = cats.map(cat => '<div class="rcat" data-cat="' + esc(cat) + '"><h3>' + esc(cat) + '</h3><div class="evs">' + EVENTS.map((e, i) => e.cat !== cat ? '' : '<button class="ev" data-ev="' + i + '" data-q="' + esc((e.n + ' ' + (e.sk || '') + ' ' + e.f + ' ' + e.note).toLowerCase()) + '"><b>' + esc(e.n) + '</b><span class="ef mono">' + esc(e.f) + '</span><span class="evs-vs">karşı: ' + esc(e.vs) + '</span>' + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</button>').join('') + '</div></div>').join('');
  const tbl = (head, rows) => '<div class="tw"><table class="rt"><thead><tr>' + head.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map((x, i) => '<td' + (i ? ' class="mono"' : '') + '>' + esc(x == null ? '—' : x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  $('#ruleTables').innerHTML =
    '<details open><summary>DV basamakları</summary>' + tbl(['Zorluk', 'DV'], DVS) + '<p class="hint">Toplam DV\'yi geçmeli; eşitlikte savunan ya da DV kazanır.</p></details>'
    + '<details><summary>Değiştiriciler</summary>' + tbl(['Durum', 'Mod'], MODS.map(m => [m[0], (m[1] > 0 ? '+' : '') + m[1]])) + '</details>'
    + '<details><summary>Menzil DV · tek atış</summary>' + tbl(['Silah'].concat(BAND_TXT), Object.keys(RANGE_DV).map(k => [WCLS[k]].concat(RANGE_DV[k]))) + '</details>'
    + '<details><summary>Menzil DV · otomatik atış</summary>' + tbl(['Silah'].concat(BAND_TXT.slice(0, 5)), Object.keys(AF_DV).map(k => [WCLS[k]].concat(AF_DV[k]))) + '</details>'
    + '<details><summary>Yara durumları</summary>' + tbl(['Durum', 'Eşik', 'Etki', 'Stabilize'], [['Hafif yaralı', 'Tam HP\'nin altı', 'Yok', 'DV10'], ['Ağır yaralı', 'HP\'nin yarısının altı', 'Tüm aksiyonlar −2', 'DV13'], ['Ölümcül yaralı', '1 HP\'nin altı', '−4 aksiyon, −6 MOVE, her tur ölüm kurtarma', 'DV15 → 1 HP']]) + '</details>'
    + '<details><summary>Siper HP</summary>' + tbl(['Malzeme', 'Kalın', 'İnce'], COVER_HP) + '</details>'
    + ['b', 'h'].map(L => '<details><summary>Kritik yaralar · ' + (L === 'h' ? 'kafa' : 'gövde') + '</summary>' + tbl(['2d6', 'Yara', 'Etki', 'Hızlı müdahale', 'Tedavi'], [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(r => { const s = INJ[L + r]; return [r, s.n, s.e + (s.ds ? ' Ölüm kurtarma cezası +1.' : ''), s.qf ? s.qf.map(q => q[0] + ' DV' + q[1]).join(' / ') + (s.perm ? ' (kalıcı)' : '') : '—', s.tr ? s.tr.map(q => q[0] + ' DV' + q[1]).join(' / ') : (s.perm ? 'gerekmez' : '—')]; })) + '</details>').join('')
    + '<details><summary>İyileşme</summary><p class="hint">Hızlı müdahale etkiyi gün sonuna kadar kaldırır (1 dk, kendine yapılabilir). Tedavi kalıcıdır (4 saat, kendine yapılamaz). Surgery sadece Medtech\'in Medicine yeteneğiyle gelir. Cyberware ile değiştirilmiş parçalardaki yaralar Cybertech ile de giderilebilir. Stabilize edilen karakter dinlendiği her tam gün BODY kadar HP kazanır.</p></details>';
}
function filterRules(q) {
  q = q.trim().toLowerCase();
  $$('#ruleList .ev').forEach(b => b.hidden = q && b.dataset.q.indexOf(q) < 0 && b.querySelector('b').textContent.toLowerCase().indexOf(q) < 0);
  $$('#ruleList .rcat').forEach(c => c.hidden = !c.querySelector('.ev:not([hidden])'));
}
function applyEvent(i) {
  const ev = EVENTS[i]; if (!ev) return;
  // kimin için: haritada seçili tokenin karakteri, yoksa "Atan" seçimi
  let cid = null; const tk = S.sel && S.tokens[S.sel];
  if (tk && tk.charId && S.chars[tk.charId]) cid = tk.charId; else if ($('#rollAs').value) cid = $('#rollAs').value;
  const c = cid && S.chars[cid];
  switchTab('dice');
  if (c) { $('#rollAs').value = cid; }
  const notes = [];
  if (ev.stat) $('#ckStat').value = c ? effStat(c, ev.stat) : $('#ckStat').value;
  $('#ckSkill').value = ev.sk ? (c ? (+(c.skills || {})[ev.sk] || 0) : $('#ckSkill').value) : 0;
  let mod = ev.mod || 0; if (c) { const a = autoMods(c, ctxOfSkill(ev.sk)); mod += a.mod; notes.push(...a.notes); }
  $('#ckMod').value = mod;
  if (ev.dv) { $('#ckDv').value = ev.dv; $$('[data-dv]').forEach(x => x.classList.toggle('on', +x.dataset.dv === ev.dv)); }
  S.ckLabel = ev.n;
  $('#ckLabel').textContent = ev.n + (c ? ' · ' + charLabel(c) : '');
  $('#ckNote').textContent = ev.f + ' · karşı: ' + ev.vs + (notes.length ? ' · uygulanan: ' + notes.join(', ') : '') + (c ? '' : ' · Bir karakter seçilmedi; değerleri elle gir.');
  $('#checkBox').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ===== HARİTA SEKMESİ (GM) =====
function syncGenForm() {
  const g = S.gen;
  $$('[data-tpl]').forEach(b => b.classList.toggle('on', b.dataset.tpl === g.tpl));
  $$('[data-dens]').forEach(b => b.classList.toggle('on', +b.dataset.dens === g.dens));
  $('#mW').value = g.w; $('#mH').value = g.h; $('#mSeed').value = g.seed;
  $('#mWo').textContent = g.w + ' kare · ' + g.w * 2 + ' m'; $('#mHo').textContent = g.h + ' kare · ' + g.h * 2 + ' m';
  if (!$('#mName').value || $('#mName').dataset.auto) { $('#mName').value = TEMPLATES[g.tpl].n; $('#mName').dataset.auto = '1'; }
}
let pvT = null;
function doPreview() {
  clearTimeout(pvT);
  pvT = setTimeout(() => {
    const g = S.gen; const r = generateMap(g.tpl, g.w, g.h, g.seed, g.dens);
    S.preview = { name: $('#mName').value.trim() || TEMPLATES[g.tpl].n, w: r.w, h: r.h, tiles: r.tiles, dev: r.dev, net: { pw: 8 }, tpl: g.tpl, seed: g.seed, dens: g.dens };
    onMapChange();
  }, 60);
}
async function publishMap() {
  if (!S.preview) { const g = S.gen; const r = generateMap(g.tpl, g.w, g.h, g.seed, g.dens); S.preview = { w: r.w, h: r.h, tiles: r.tiles, dev: r.dev, net: { pw: 8 }, tpl: g.tpl, seed: g.seed, dens: g.dens }; }
  const m = clone(S.preview); m.name = ($('#mName').value.trim() || m.name || TEMPLATES[m.tpl].n); m.ts = Date.now();
  S.preview = null; S.map = m; onMapChange();
  const ok = await setDoc('gm/map', m);
  netResetFor(m); S.selDev = null; renderDevCard();
  for (const [id, tk] of Object.entries(S.tokens)) {
    if (walkable(m, tk.x, tk.y)) continue;
    let spot = null;
    for (let r = 1; r < 30 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) { const x = tk.x + dx, y = tk.y + dy; if (walkable(m, x, y) && !tokenAt({ x, y })) spot = { x, y }; }
    if (spot) { tk.x = spot.x; tk.y = spot.y; setDoc(tokPath(id), tk); }
  }
  if (ok) toast('Sahne masaya yayınlandı: ' + m.name);
}

// ===== SEKME / ARAÇ =====
function switchTab(t) {
  S.tab = t;
  $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'));
  $$('.tabpanel').forEach(p => p.hidden = p.id !== 'tab-' + t);
  if (t === 'chars' || t === 'npc') renderChars();
}
function setTool(t) {
  if ((t === 'paint' || t === 'room' || t === 'fill' || t === 'dev') && !S.me.isGM) return;
  S.tool = t; S.measure = t === 'measure' ? S.measure : null;
  $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  $('#brushBar').hidden = !(t === 'paint' || t === 'fill');
  $('#devBar').hidden = t !== 'dev';
  cv.dataset.tool = t;
  dirty();
}
function buildSwatches() {
  const order = ['.', ',', ':', 'G', '#', '=', '+', 'C', 'K', 'L', 'V', 'B', 'D', 'T', 'R', '~', 'X', 'S', 'H', ' '];
  const tmp = document.createElement('canvas'); tmp.width = CS * 3; tmp.height = CS * 3; const tc = tmp.getContext('2d');
  const out = document.createElement('canvas'); out.width = CS; out.height = CS; const oc = out.getContext('2d');
  $('#swatches').innerHTML = order.map(ch => {
    let tiles = ch.repeat(9); if (ch === '+' || ch === '=') tiles = '...#' + ch + '#...';
    drawTiles(tc, { w: 3, h: 3, tiles });
    oc.clearRect(0, 0, CS, CS); oc.drawImage(tmp, CS, CS, CS, CS, 0, 0, CS, CS);
    return '<button class="swatch' + (ch === S.brush ? ' on' : '') + '" data-brush="' + esc(ch) + '" title="' + esc(TILE[ch].n) + '" aria-label="' + esc(TILE[ch].n) + '" style="background-image:url(' + out.toDataURL() + ')"></button>';
  }).join('');
  $('#brushName').textContent = TILE[S.brush].n;
}

// ===== LİSTEDEN HARİTAYA SÜRÜKLE =====
(function () {
  let dr = null;
  document.addEventListener('pointerdown', e => {
    const chip = e.target.closest('.cchip'); if (!chip || e.button > 0 || e.target.closest('.eye')) return;
    const id = chip.dataset.id, c = S.chars[id]; if (!c || !(S.me.isGM || canEditChar(c))) return;
    dr = { id, c, x: e.clientX, y: e.clientY, on: false, chip, pid: e.pointerId, grip: !!e.target.closest('.grip') };
    if (dr.grip) e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!dr || e.pointerId !== dr.pid) return;
    if (!dr.on) {
      if (Math.hypot(e.clientX - dr.x, e.clientY - dr.y) < 7) return;
      if (e.pointerType === 'touch' && !dr.grip && Math.abs(e.clientY - dr.y) > Math.abs(e.clientX - dr.x)) { dr = null; return; }
      dr.on = true;
      const g = document.createElement('div'); g.className = 'dragghost' + (isNpc(dr.c) ? ' npc' : '');
      g.innerHTML = dr.c.img ? '<img alt="" src="' + esc(dr.c.img.url) + '">' : esc(initials(charLabel(dr.c)));
      document.body.appendChild(g); dr.g = g; document.body.classList.add('dragging');
      try { dr.chip.setPointerCapture(dr.pid); } catch (x) { }
    }
    dr.g.style.transform = 'translate(' + (e.clientX - 22) + 'px,' + (e.clientY - 22) + 'px)';
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const onMap = over === cv;
    wrap.classList.toggle('droptarget', onMap);
    if (onMap) { const r = cv.getBoundingClientRect(); const cell = s2c(e.clientX - r.left, e.clientY - r.top); if (!S.hover || S.hover.x !== cell.x || S.hover.y !== cell.y) { S.hover = cell; renderHover(); dirty(); } }
  });
  const end = e => {
    if (!dr || e.pointerId !== dr.pid) return;
    const d = dr; dr = null;
    if (!d.on) return;
    d.g.remove(); document.body.classList.remove('dragging'); wrap.classList.remove('droptarget');
    S.justDragged = true; setTimeout(() => S.justDragged = false, 50);
    const over = document.elementFromPoint(e.clientX, e.clientY);
    if (over === cv && e.type === 'pointerup') { const r = cv.getBoundingClientRect(); placeTokenAt(d.id, d.c, s2c(e.clientX - r.left, e.clientY - r.top)); }
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();

// ===== SES VE MÜZİK: music.js =====
Object.assign(ACTIONS, MUSIC_ACTS, NET_ACTS, ROLE_ACTS, SAVE_ACTS);

// ===== BAŞLANGIÇ =====
function applyRole() {
  document.body.classList.toggle('is-gm', S.me.isGM);
  $('#roleChip').textContent = S.me.local ? 'Yerel deneme' : S.me.isGM ? 'Game Master' : (S.me.canWrite ? 'Oyuncu' : 'İzleyici');
  $('#roleChip').className = 'role-chip ' + (S.me.isGM ? 'gm' : '');
  if (!S.me.isGM && (S.tab === 'npc' || S.tab === 'map' || S.tab === 'rules')) switchTab('dice');
  if (!S.me.isGM && (S.tool === 'paint' || S.tool === 'room' || S.tool === 'fill')) setTool('move');
  syncVis();
}
async function boot() {
  const d = generateMap('depo', 40, 28, 4207, 1);
  S.demo = { name: 'Örnek depo', w: d.w, h: d.h, tiles: d.tiles, dev: d.dev, net: { pw: 8 }, tpl: 'depo', seed: 4207, dens: 1 };
  S.me.isGM = true;
  try { const a = localStorage.getItem('ncm-anim'); if (a != null) S.anim = a === '1'; } catch (x) { }
  $('#tpls').innerHTML = Object.entries(TEMPLATES).map(([k, T]) => '<button class="tpl" data-tpl="' + k + '"><b>' + esc(T.n) + '</b><small>' + esc(T.t) + '</small></button>').join('');
  $('#dvChips').innerHTML = DVS.map(([n, v]) => '<button data-dv="' + v + '"' + (v === 15 ? ' class="on"' : '') + '>' + n + '<b>' + v + '</b></button>').join('');
  buildDiceTable(); buildRules(); buildSwatches(); syncGenForm(); applyRole(); renderInit(); renderLog(); renderChars(); setTool('move'); switchTab('dice');
  $('#newRole').innerHTML = '<option value="">Rastgele rol</option>' + ROLES.map(r => '<option value="' + r.k + '">' + r.k + '</option>').join('');
  $('#npcArche').innerHTML = Object.entries(ARCHES).map(([k, a]) => '<option value="' + k + '">' + a.n + '</option>').join('');
  $('#npcTier').innerHTML = Object.entries(TIERS).map(([k, t]) => '<option value="' + k + '"' + (k === 'mook' ? ' selected' : '') + '>' + t.n + '</option>').join('');
  onMapChange();
  $('#mW').addEventListener('input', e => { S.gen.w = +e.target.value; syncGenForm(); doPreview(); });
  $('#mH').addEventListener('input', e => { S.gen.h = +e.target.value; syncGenForm(); doPreview(); });
  $('#mSeed').addEventListener('change', e => { S.gen.seed = +e.target.value || 1; doPreview(); });
  $('#mName').addEventListener('input', e => { delete e.target.dataset.auto; if (S.preview) S.preview.name = e.target.value; });
  $('#expr').addEventListener('keydown', e => { if (e.key === 'Enter') ACTIONS.rollExpr(); });
  $('#ruleQ').addEventListener('input', e => filterRules(e.target.value));
  $('#tray').addEventListener('click', () => Dice3D.skip());
  window.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    const k = e.key.toLowerCase();
    if (k === 'v') setTool('move'); else if (k === 'm') setTool('measure'); else if (k === 'p') setTool('ping');
    else if (k === 'b' && S.me.isGM) setTool('paint'); else if (k === 'r' && S.me.isGM) setTool('room');
    else if (k === 'f') fitView(); else if (k === 'escape') { Dice3D.skip(); if (S.targeting) { endTargeting(); return; } if (!$('#actMenu').hidden) { hideMenu(); return; } if (S.selDev) { S.selDev = null; renderDevCard(); dirty(); return; } S.measure = null; S.sel = null; renderTokCard(); dirty(); }
  });
  Dice3D.ready(); renderSound(); renderCards();

  const C = window.claude;
  if (!C || typeof C.use !== 'function') { $('#conn').textContent = 'Tek cihaz modu'; S.mapLoaded = true; updateHeader(); return; }
  const [u, d0, r0, a0] = await Promise.all([C.use('user'), C.use('db'), C.use('room'), C.use('assets')]);
  C.use('downloads').then(x => { dl = x; }, () => { });
  user = u; db = d0; room = r0; assets = a0;
  if (user) {
    const me = await user.me();
    S.me.id = me.id; S.me.color = me.color || S.me.color; S.me.isGM = !!me.isOwner; S.me.local = false; S.me.whoName = me.name || '';
    const cw = await user.can('data.write'); if (cw === false) S.me.canWrite = false;
  }
  if (db) {
    S.me.local = false; S.mapLoaded = false; S.rolls = []; S.chars = {}; S.tokens = {};
    if (!user) S.me.isGM = false;
    subscribe(); subscribeActs();
    db.doc('gm/music').onSnapshot(s => applyMusic(s.exists ? s.data() : null), () => { });
    $('#conn').textContent = 'Canlı masa';
    $('#conn').classList.add('live');
  } else { $('#conn').textContent = 'Tek cihaz modu'; }
  applyRole(); updateHeader(); renderChars(); renderLog(); renderInit();
  if (room) {
    room.on('ping', onRoomMsg, () => { }); room.on('drag', onRoomMsg, () => { }); room.on('dice', onRoomMsg, () => { }); room.on('fx', onRoomMsg, () => { });
    room.onPeers(ch => { S.peers = ch.peers; renderPeers(); resolveNames(ch.peers.map(p => p.by)); }, () => { });
    room.presence({ c: S.me.color, gm: S.me.isGM }).catch(() => { });
  }
}
boot();
