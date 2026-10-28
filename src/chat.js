// ===== OYUN İÇİ SOHBET + OLAY AKIŞI =====
// chat/<id> = { ts, by, name, color, t: 'msg'|'ic'|'me'|'ev', text, cid?, img? }
// Fısıltılar (sadece GitHub sürümü): wsp/<alıcı uid>/m/<id>; sadece alıcı ve gönderen görür (gönderen kendi kutusuna kopya yazar).
const CHAT = { msgs: {}, wsp: {}, filter: 'all', unread: 0, seenTs: 0, to: '', inited: false };
const canWhisper = () => typeof FB !== 'undefined' && !!FB.code;
function chatSubscribe() {
  if (!db) return;
  db.collection('chat').orderBy('ts', 'desc').limit(150).onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); CHAT.msgs = o; chatChanged(); }, e => console.warn('chat', e));
  if (canWhisper() && S.me.id) db.collection('wsp/' + S.me.id + '/m').orderBy('ts', 'desc').limit(80).onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); CHAT.wsp = o; chatChanged(); }, e => console.warn('wsp', e));
}
function chatApplyLocal(id, data) { if (data) CHAT.msgs[id] = data; else delete CHAT.msgs[id]; chatChanged(); }
function chatChanged() {
  const all = Object.values(CHAT.msgs).concat(Object.values(CHAT.wsp));
  const newest = all.reduce((a, m) => Math.max(a, m.ts || 0), 0);
  if (!CHAT.inited) { CHAT.inited = true; CHAT.seenTs = newest; }
  if (S.tab !== 'chat') { CHAT.unread = all.filter(m => (m.ts || 0) > CHAT.seenTs && m.by !== S.me.id && m.t !== 'ev').length; }
  else CHAT.seenTs = Math.max(CHAT.seenTs, newest);
  renderChatBadge(); if (S.tab === 'chat') renderChat();
}
function renderChatBadge() { const b = document.querySelector('[data-tab="chat"]'); if (!b) return; b.dataset.n = CHAT.unread > 0 ? (CHAT.unread > 9 ? '9+' : CHAT.unread) : ''; }
// olay satırı yaz (zar dışı oyun olayları)
function chatEvent(text, extra) {
  const id = 'e' + uid(); const d = Object.assign({ ts: Date.now(), by: S.me.id || 'local', name: '', t: 'ev', text: String(text).slice(0, 300) }, extra || {});
  if (!db) chatApplyLocal(id, d); setDoc('chat/' + id, d);
}
function myChar() {
  const tk = S.sel && S.tokens[S.sel]; const c = tk && tokChar(tk);
  if (c && (S.me.isGM || c.owner === S.me.id)) return [tk.charId, c];
  const e = Object.entries(S.chars).find(([, x]) => x.owner === S.me.id && !isNpc(x)); return e || [null, null];
}
async function chatSend(raw) {
  let text = String(raw || '').trim(); if (!text) return;
  if (/^\/(r|zar)\s+/i.test(text)) { const ex = text.replace(/^\/(r|zar)\s+/i, ''); return lockRoll(() => rollExpr(ex, ex.replace(/\s+/g, ''), rollWho ? rollWho() : '')); }
  let t = 'msg', cid = null, img = null, nameOv = null;
  if (/^\/(k|ic)\s+/i.test(text)) { const [id, c] = myChar(); if (!c) { toast('Karakter ağzından konuşmak için önce bir karakter seç.', 'err'); return; } t = 'ic'; cid = id; img = c.img ? c.img.url : null; nameOv = charLabel(c); text = text.replace(/^\/(k|ic)\s+/i, ''); }
  else if (/^\/me\s+/i.test(text)) { t = 'me'; text = text.replace(/^\/me\s+/i, ''); }
  const base = { ts: Date.now(), by: S.me.id || 'local', name: nameOv || (S.me.whoName || nameOf(S.me.id)), color: S.me.color, t, text: text.slice(0, 600) };
  if (cid) base.cid = cid; if (img) base.img = img;
  const to = CHAT.to;
  if (to && canWhisper()) {
    const id = 'w' + uid(); const w = Object.assign({}, base, { to, toName: (FB.members[to] || {}).name || 'Oyuncu', w: 1 });
    await db.doc('wsp/' + to + '/m/' + id).set(w).catch(e => toast('Fısıltı gönderilemedi.', 'err'));
    if (to !== S.me.id) await db.doc('wsp/' + S.me.id + '/m/' + id).set(w).catch(() => { });
    return;
  }
  const id = 'm' + uid(); if (!db) chatApplyLocal(id, base); setDoc('chat/' + id, base);
}
function chatTime(ts) { const d = new Date(ts || 0); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function chatRow(m) {
  const col = /^#[0-9a-f]{3,8}$/i.test(m.color || '') ? m.color : '#929b96';
  const mine = m.by === S.me.id;
  if (m.t === 'ev') return '<li class="ch-ev"><span>' + esc(m.text) + '</span><time>' + chatTime(m.ts) + '</time></li>';
  if (m.t === 'me') return '<li class="ch-me"><i style="color:' + col + '">' + esc(m.name) + '</i> ' + esc(m.text) + '<time>' + chatTime(m.ts) + '</time></li>';
  const w = m.w ? '<span class="ch-w">' + (mine && m.to !== S.me.id ? 'fısıltı → ' + esc(m.toName || '') : 'sana fısıltı') + '</span>' : '';
  const av = m.t === 'ic' ? '<span class="ch-av">' + (m.img ? '<img alt="" src="' + esc(m.img) + '">' : esc((m.name || '?').slice(0, 1))) + '</span>' : '';
  return '<li class="ch-msg' + (m.t === 'ic' ? ' ic' : '') + (mine ? ' mine' : '') + (m.w ? ' wsp' : '') + '">' + av + '<div><div class="ch-h"><b style="color:' + col + '">' + esc(m.name || 'Oyuncu') + '</b>' + (m.t === 'ic' ? '<span class="ch-tag">karakter</span>' : '') + w + '<time>' + chatTime(m.ts) + '</time></div><p>' + esc(m.text) + '</p></div></li>';
}
function renderChat() {
  const el = $('#chatList'); if (!el) return;
  const f = CHAT.filter; let items = [];
  if (f !== 'rolls') items = items.concat(Object.values(CHAT.msgs).filter(m => f === 'all' || m.t !== 'ev').map(m => ({ ts: m.ts, html: chatRow(m) })), Object.values(CHAT.wsp).map(m => ({ ts: m.ts, html: chatRow(m) })));
  if (f !== 'chat') items = items.concat(S.rolls.map(r => ({ ts: r.ts || 0, html: '<li class="ch-roll"><ol class="log">' + rollRow(r) + '</ol></li>' })), Object.values(CHAT.msgs).filter(m => f === 'rolls' && m.t === 'ev').map(m => ({ ts: m.ts, html: chatRow(m) })));
  items.sort((a, b) => a.ts - b.ts); items = items.slice(-200);
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  const html = items.length ? items.map(i => i.html).join('') : '<li class="ch-empty">Henüz mesaj yok. Yaz ve Enter\'a bas; <code>/r 2d6+3</code> zar atar, <code>/k</code> karakterin ağzından konuşturur.</li>';
  if (el._h !== html) { el.innerHTML = html; el._h = html; if (atBottom || !el._init) { el.scrollTop = el.scrollHeight; el._init = 1; } }
  renderChatTo();
}
function renderChatTo() {
  const sel = $('#chatTo'); if (!sel) return;
  if (!canWhisper()) { sel.hidden = true; return; }
  const opts = [['', 'Herkese']];
  const gms = (FB.room && FB.room.gms) || [];
  Object.entries(FB.members || {}).forEach(([u, m]) => { if (u === S.me.id) return; opts.push([u, (gms.indexOf(u) >= 0 ? 'GM\'e fısılda: ' : 'Fısılda: ') + (m.name || 'Oyuncu')]); });
  const html = opts.map(([v, l]) => '<option value="' + esc(v) + '"' + (v === CHAT.to ? ' selected' : '') + '>' + esc(l) + '</option>').join('');
  if (sel._h !== html) { sel.innerHTML = html; sel._h = html; }
}
document.addEventListener('keydown', e => {
  if (e.target.id !== 'chatIn' || e.key !== 'Enter' || e.shiftKey) return; e.preventDefault();
  const v = e.target.value; e.target.value = ''; chatSend(v);
});
document.addEventListener('click', e => {
  if (e.target.id === 'chatGo') { const i = $('#chatIn'); const v = i.value; i.value = ''; chatSend(v); i.focus(); }
  const f = e.target.closest('[data-chf]'); if (f) { CHAT.filter = f.dataset.chf; document.querySelectorAll('[data-chf]').forEach(b => b.classList.toggle('on', b === f)); renderChat(); }
});
document.addEventListener('change', e => { if (e.target.id === 'chatTo') CHAT.to = e.target.value; });
