// ===== IMPROVEMENT POINTS (Core Rulebook "Running Cyberpunk"): oturum sonu ödülü + geliştirme =====
// Maliyet: beceri seviyesi L → 20×L (zor ×2 beceri 40×L); rol yeteneği rütbesi R → 60×R. Seviye atlanamaz.
const IP = { reqs: {}, opts: { ipAuto: false }, cart: [] };
const ipSkillCost = (n, lvl) => (SKILL[n] && SKILL[n].x2 ? 40 : 20) * lvl;
const ipRoleCost = r => 60 * r;
const IP_TIERS = [[10, 'Denediler ama görevi başaramadılar'], [20, 'Görevi zar zor başardılar'], [30, 'Hedeflerin çoğu, herkes katkıda bulundu'], [40, 'Hedeflerin çoğu iyi ve uyumla'], [50, 'Hedeflerin çoğu çok iyi, parlak anlar'], [60, 'Güçlü başarı: tüm hedefler'], [70, 'Tüm hedefler ve yan görevler, güçlü ekip'], [80, 'Efsanevi: her şey ve fazlası']];
const IP_CATS = { group: 'Grup başarısı', warrior: 'Savaşçı', social: 'Destekleyici', explorer: 'Kâşif', roleplay: 'Rol yapma' };
function ipSubscribe() {
  if (!db) return;
  db.collection('ipreq').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); IP.reqs = o; renderCards(); if (S.me.isGM && IP.opts.ipAuto) Object.keys(o).forEach(id => ipApply(id, true)); }, e => console.warn('ipreq', e));
  db.doc('table/opts').onSnapshot(s => { IP.opts = Object.assign({ ipAuto: false }, s.exists ? s.data() : {}); }, () => { });
}
function ipButtonHTML(id, c) {
  const E = esc(id);
  if (S.me.isGM) return '<button class="btn sm" data-act="ipAdj" data-id="' + E + '" data-v="10">IP +10</button><button class="btn sm" data-act="ipAdj" data-id="' + E + '" data-v="-10">IP −10</button>' + ((c.owner === S.me.id || !c.owner) ? '<button class="btn sm" data-act="ipOpen" data-id="' + E + '">Geliştir</button>' : '');
  if (c.owner === S.me.id) return '<button class="btn sm primary" data-act="ipOpen" data-id="' + E + '">Geliştir</button>';
  return '';
}
function ipPending(id) { return Object.values(IP.reqs).some(r => r.cid === id); }
function ipOpen(id) {
  const c = S.chars[id]; if (!c) return; IP.cart = []; IP.cid = id; renderIpPanel();
}
function ipCartCost() { return IP.cart.reduce((a, x) => a + x.cost, 0); }
function renderIpPanel() {
  const id = IP.cid, c = S.chars[id]; const el = $('#caPanel'); if (!c) { el.hidden = true; return; }
  const bal = +c.ip || 0, spent = ipCartCost();
  const inCart = (t, n) => IP.cart.some(x => x.t === t && x.n === n);
  const rk = +c.rank || 0; const roleRow = !isNpc(c) && c.role ? '<li class="ipr role"><span><b>' + esc((ROLE[c.role] || {}).a || 'Rol yeteneği') + '</b><small>rütbe ' + rk + ' → ' + (rk + 1) + '</small></span><b class="mono">' + ipRoleCost(rk + 1) + '</b>' + (rk >= 10 ? '<span class="dim">en üst</span>' : '<button class="btn sm' + (inCart('role', 'rank') ? ' on' : '') + '" data-ipadd="role" data-n="rank"' + (inCart('role', 'rank') || ipRoleCost(rk + 1) > bal - spent ? (inCart('role', 'rank') ? '' : ' disabled') : '') + '>' + (inCart('role', 'rank') ? 'Çıkar' : 'Ekle') + '</button>') + '</li>' : '';
  const q = (IP.q || '').toLowerCase();
  const rows = SKILLS.map(s => s[0]).filter(n => !FREE_SKILL[n] || n === 'Language (Ana dil)').filter(n => !q || n.toLowerCase().indexOf(q) >= 0).map(n => {
    const lv = +((c.skills || {})[n]) || 0; if (lv >= 10) return ''; const cost = ipSkillCost(n, lv + 1); const on = inCart('skill', n);
    return '<li class="ipr"><span><b>' + esc(n) + (SKILL[n].x2 ? ' <i>×2</i>' : '') + '</b><small>' + lv + ' → ' + (lv + 1) + '</small></span><b class="mono">' + cost + '</b><button class="btn sm' + (on ? ' on' : '') + '" data-ipadd="skill" data-n="' + esc(n) + '"' + (!on && cost > bal - spent ? ' disabled' : '') + '>' + (on ? 'Çıkar' : 'Ekle') + '</button></li>';
  }).join('');
  const needsGm = c.locked && !S.me.isGM;
  el.innerHTML = '<div class="cap-h"><b>' + esc(charLabel(c)) + ' · geliştirme</b><button class="x" data-act="ipClose" aria-label="Kapat">×</button></div>'
    + '<div class="ipbal"><span>Bakiye <b>' + bal + ' IP</b></span><span>Sepet <b>' + spent + ' IP</b></span><span>Kalan <b>' + (bal - spent) + ' IP</b></span></div>'
    + (ipPending(id) ? '<p class="hint">Bu karakter için GM onayı bekleyen bir geliştirme var.</p>' : '')
    + '<input class="ipq" placeholder="Beceri ara…" value="' + esc(IP.q || '') + '" aria-label="Beceri ara">'
    + '<ul class="iplist">' + roleRow + rows + '</ul>'
    + '<p class="hint">Kitaba göre: beceri seviyesi L için 20×L IP (zor beceriler 40×L), rol yeteneği rütbesi için 60×rütbe. Her istek bir beceriyi bir seviye artırır.</p>'
    + '<div class="row"><button class="btn primary" data-act="ipSubmit"' + (IP.cart.length ? '' : ' disabled') + '>' + (needsGm ? 'GM onayına gönder' : 'Geliştir') + '</button></div>';
  el.hidden = false; S.caPanel = null;
}
function ipItems(c) { return IP.cart.map(x => x.t === 'role' ? { t: 'role', n: 'rank', from: +c.rank || 0, to: (+c.rank || 0) + 1, cost: x.cost } : { t: 'skill', n: x.n, from: +((c.skills || {})[x.n]) || 0, to: (+((c.skills || {})[x.n]) || 0) + 1, cost: x.cost }); }
function ipApplyTo(c, items) {
  const total = items.reduce((a, x) => a + x.cost, 0); if ((+c.ip || 0) < total) return 'IP yetersiz';
  for (const x of items) { const cur = x.t === 'role' ? (+c.rank || 0) : (+((c.skills || {})[x.n]) || 0); if (cur !== x.from) return x.n + ' seviyesi değişmiş'; }
  items.forEach(x => { if (x.t === 'role') c.rank = x.to; else { c.skills = c.skills || {}; c.skills[x.n] = x.to; } });
  c.ip = (+c.ip || 0) - total; c.ipLog = (c.ipLog || []).concat([{ ts: Date.now(), n: -total, why: items.map(x => (x.t === 'role' ? 'rütbe' : x.n) + ' ' + x.to).join(', ') }]).slice(-40);
  return null;
}
const ipItemsText = items => items.map(x => (x.t === 'role' ? 'rol rütbesi' : x.n) + ' ' + x.from + '→' + x.to).join(', ');
async function ipApply(rid, auto) {
  const r = IP.reqs[rid]; if (!r || !S.me.isGM) return; const c = S.chars[r.cid];
  if (!c) { docDelIp(rid); return; }
  const err = ipApplyTo(c, r.items);
  if (err) { if (!auto) toast('Uygulanamadı: ' + err, 'err'); docDelIp(rid); chatEvent(charLabel(c) + ' geliştirmesi reddedildi (' + err + ').'); return; }
  S.why = 'IP geliştirme (GM onayı)'; saveCharNow(r.cid); renderChars(); docDelIp(rid);
  chatEvent(charLabel(c) + ' geliştirildi: ' + ipItemsText(r.items) + ' (−' + r.total + ' IP)');
}
function docDelIp(rid) { delete IP.reqs[rid]; delDoc('ipreq/' + rid); renderCards(); }
function ipCardsHTML() {
  if (!S.me.isGM) return '';
  return Object.entries(IP.reqs).map(([rid, r]) => '<div class="card gm"><b>Geliştirme isteği: ' + esc(r.cname) + '</b><p>' + esc(ipItemsText(r.items)) + ' · ' + r.total + ' IP</p><div class="row"><button class="btn sm primary" data-ipok="' + esc(rid) + '">Onayla</button><button class="btn sm" data-ipno="' + esc(rid) + '">Reddet</button></div></div>').join('');
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-ipadd]');
  if (a) { const c = S.chars[IP.cid]; const t = a.dataset.ipadd, n = a.dataset.n; const i = IP.cart.findIndex(x => x.t === t && x.n === n);
    if (i >= 0) IP.cart.splice(i, 1); else IP.cart.push({ t, n, cost: t === 'role' ? ipRoleCost((+c.rank || 0) + 1) : ipSkillCost(n, (+((c.skills || {})[n]) || 0) + 1) });
    renderIpPanel(); return; }
  const ok = e.target.closest('[data-ipok]'); if (ok) { ipApply(ok.dataset.ipok); return; }
  const no = e.target.closest('[data-ipno]'); if (no) { const r = IP.reqs[no.dataset.ipno]; docDelIp(no.dataset.ipno); if (r) chatEvent(r.cname + ' için geliştirme isteği GM tarafından reddedildi.'); return; }
});
document.addEventListener('input', e => { if (e.target.classList.contains('ipq')) { IP.q = e.target.value; const pos = e.target.selectionStart; renderIpPanel(); const i = document.querySelector('.ipq'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });
const IP_ACTS = {
  ipOpen: b => ipOpen(b.dataset.id),
  ipClose: () => { $('#caPanel').hidden = true; IP.cart = []; },
  ipAdj: b => { if (!S.me.isGM) return; const c = S.chars[b.dataset.id]; c.ip = Math.max(0, (+c.ip || 0) + (+b.dataset.v)); c.ipLog = (c.ipLog || []).concat([{ ts: Date.now(), n: +b.dataset.v, why: 'GM düzeltmesi' }]).slice(-40); S.why = 'GM IP düzeltmesi'; saveCharNow(b.dataset.id); renderChars(); },
  ipSubmit: async () => {
    const id = IP.cid, c = S.chars[id]; if (!c || !IP.cart.length) return;
    const items = ipItems(c); const total = items.reduce((a, x) => a + x.cost, 0);
    if (total > (+c.ip || 0)) { toast('IP yetersiz.', 'err'); return; }
    if (!c.locked || S.me.isGM) { const err = ipApplyTo(c, items); if (err) { toast(err, 'err'); return; } S.why = 'IP geliştirme'; saveCharNow(id); renderChars(); chatEvent(charLabel(c) + ' geliştirildi: ' + ipItemsText(items) + ' (−' + total + ' IP)'); IP.cart = []; $('#caPanel').hidden = true; toast('Geliştirme uygulandı.'); return; }
    if (ipPending(id)) { toast('Bu karakter için zaten bekleyen bir istek var.', 'err'); return; }
    const rid = 'i' + uid(); const doc = { cid: id, cname: charLabel(c), by: S.me.id, byName: S.me.whoName || '', items, total, ts: Date.now() };
    if (!db) { IP.reqs[rid] = doc; renderCards(); }
    await setDoc('ipreq/' + rid, doc); IP.cart = []; $('#caPanel').hidden = true;
    chatEvent(charLabel(c) + ' geliştirme istedi: ' + ipItemsText(items) + ' (' + total + ' IP) · GM onayı bekleniyor.'); toast('İstek GM\'e gönderildi.');
  },
  sessionEnd: () => openSessionEnd(),
  ipAuto: b => { if (!S.me.isGM) return; IP.opts.ipAuto = !IP.opts.ipAuto; setDoc('table/opts', IP.opts); b.textContent = 'Geliştirmeleri otomatik onayla: ' + (IP.opts.ipAuto ? 'açık' : 'kapalı'); },
};
// ===== OTURUM SONU: IP DAĞITIMI (GM) =====
function openSessionEnd() {
  if (!S.me.isGM) return;
  const pcs = Object.entries(S.chars).filter(([, c]) => !isNpc(c));
  const el = $('#caPanel');
  el.innerHTML = '<div class="cap-h"><b>Oturumu bitir · IP dağıt</b><button class="x" data-act="caClose" aria-label="Kapat">×</button></div>'
    + '<p class="hint">Kitaba göre görev bittiyse herkes grup başarısına göre alır; biri öne çıkan bir şey yaptıysa o oyun tarzının değerini verebilirsin. Görev bitmediyse oyuncunun kendi tarzına göre ver.</p>'
    + '<div class="ip-all row"><label class="mini">Herkese <select class="ip-all-n">' + IP_TIERS.map(([n, d]) => '<option value="' + n + '">' + n + ' · ' + esc(d) + '</option>').join('') + '</select></label><button class="btn sm" data-act="ipAllSet">Hepsine uygula</button></div>'
    + (pcs.length ? '<ul class="ip-ses">' + pcs.map(([id, c]) => '<li data-cid="' + esc(id) + '"><b>' + esc(charLabel(c)) + '</b><small>' + esc(nameOf(c.owner)) + ' · bakiye ' + (+c.ip || 0) + '</small>'
      + '<div class="row"><select class="ip-cat" aria-label="Tür">' + Object.entries(IP_CATS).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select><select class="ip-n" aria-label="Miktar">' + IP_TIERS.map(([n]) => '<option value="' + n + '">' + n + ' IP</option>').join('') + '<option value="0">0</option></select><input class="ip-note" maxlength="80" placeholder="Not (ör. tuzağı çözdü)"></div></li>').join('') + '</ul>' : '<p class="hint">Masada oyuncu karakteri yok.</p>')
    + '<div class="row"><button class="btn primary" data-act="ipGive"' + (pcs.length ? '' : ' disabled') + '>IP\'leri dağıt</button><button class="btn sm" data-act="ipAuto">Geliştirmeleri otomatik onayla: ' + (IP.opts.ipAuto ? 'açık' : 'kapalı') + '</button></div>';
  el.hidden = false; S.caPanel = null;
}
Object.assign(IP_ACTS, {
  ipAllSet: () => { const v = $('.ip-all-n').value; document.querySelectorAll('.ip-ses .ip-n').forEach(s => s.value = v); },
  ipGive: () => {
    const lines = [];
    document.querySelectorAll('.ip-ses li').forEach(li => {
      const id = li.dataset.cid, c = S.chars[id]; if (!c) return; const n = +li.querySelector('.ip-n').value || 0; if (!n) return;
      const cat = IP_CATS[li.querySelector('.ip-cat').value]; const note = li.querySelector('.ip-note').value.trim();
      c.ip = (+c.ip || 0) + n; c.ipLog = (c.ipLog || []).concat([{ ts: Date.now(), n, why: cat + (note ? ': ' + note : '') }]).slice(-40);
      S.why = 'Oturum sonu IP ödülü'; saveCharNow(id); lines.push(charLabel(c) + ' +' + n + ' (' + cat + (note ? ': ' + note : '') + ')');
    });
    $('#caPanel').hidden = true; renderChars();
    if (lines.length) { chatEvent('Oturum sonu IP ödülleri: ' + lines.join(' · ')); toast('IP dağıtıldı.'); }
  },
});
