// ===== GitHub Pages sürümü: Firebase platform katmanı + başlangıç ekranı ve odalar =====
// Masanın kodu claude.ai çalışma zamanının db / room / user / assets arayüzlerini kullanıyor.
// Burada aynı arayüzler Firebase ile (Firestore + Realtime Database + Anonymous/Google Auth) sağlanır;
// her oda Firestore'da rooms/<KOD>/... altında, canlı olaylar RTDB'de rooms/<KOD>/... altında tutulur.
const FB = { app: null, auth: null, fs: null, rt: null, uid: null, user: null, room: null, code: null, name: '', color: '#f2c230', members: {}, sess: Math.random().toString(36).slice(2, 10), skew: 0, adapters: null };
const MENU_COLORS = ['#f2c230', '#41cfd6', '#ff6b8b', '#7bd88f', '#b48cff', '#ff9f43', '#5aa9ff', '#e7e3d8'];
const LS = { get(k, d) { try { const v = localStorage.getItem('ncm-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('ncm-' + k, JSON.stringify(v)); } catch (e) { } } };
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^NC/, '').slice(0, 6);
const showCode = c => 'NC-' + c;
const $s = q => document.querySelector(q);

// ---- Firestore: oda kapsamlı db ----
// claude.ai db'deki update iç içe nesneleri birleştirir; Firestore'da aynı etki için alan yollarına (a.b.c) açılır
function flatPatch(o, pre, out) {
  out = out || {}; pre = pre || '';
  for (const k of Object.keys(o)) { const v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) flatPatch(v, pre + k + '.', out); else out[pre + k] = v === undefined ? null : v; }
  return out;
}
function scopedDb(prefix) {
  const fs = FB.fs;
  const wrapQ = q => ({ orderBy: (f, d) => wrapQ(q.orderBy(f, d)), limit: n => wrapQ(q.limit(n)), where: (a, b, c) => wrapQ(q.where(a, b, c)), get: () => q.get(), onSnapshot: (fn, err) => q.onSnapshot(fn, err) });
  return {
    doc: p => { const r = fs.doc(prefix + '/' + p); return { id: r.id, set: (d, o) => r.set(d, o), get: () => r.get(), delete: () => r.delete(), onSnapshot: (a, b) => r.onSnapshot(a, b), update: patch => r.update(flatPatch(patch)) }; },
    collection: p => { const c = fs.collection(prefix + '/' + p); return Object.assign(wrapQ(c), { doc: id => c.doc(id) }); },
  };
}
// ---- RTDB: canlı oda (olaylar + kim bağlı) ----
function makeRoom(code) {
  const base = FB.rt.ref('rooms/' + code);
  const ev = base.child('ev'), pres = base.child('pres');
  const handlers = {}; let peersFn = null; let myPres = { c: FB.color };
  const now = () => Date.now() + FB.skew;
  ev.orderByChild('ts').startAt(now() - 3000).on('child_added', s => {
    const v = s.val(); if (!v || !v.t) return;
    const fn = handlers[v.t]; if (!fn) return;
    try { fn({ topic: v.t, data: v.d || {}, by: v.by, sameTab: v.s === FB.sess }); } catch (e) { console.warn(e); }
  });
  const selfRef = pres.child(FB.sess);
  FB.rt.ref('.info/connected').on('value', s => {
    if (!s.val()) return;
    selfRef.onDisconnect().remove().then(() => selfRef.set({ by: FB.uid, p: myPres, ts: firebase.database.ServerValue.TIMESTAMP }));
  });
  pres.on('value', s => {
    const v = s.val() || {}; const peers = Object.entries(v).map(([k, x]) => ({ peer: k, by: x.by, kind: 'viewer', presence: x.p || {}, isMe: k === FB.sess }));
    FB.peers = peers; if (peersFn) peersFn({ peers }); if (window.renderLobby) renderLobby();
  });
  // eski olayları süpür
  setInterval(() => { ev.orderByChild('ts').endAt(now() - 60000).limitToFirst(50).once('value', s => s.forEach(c => { c.ref.remove(); })); }, 30000);
  const clean = v => JSON.parse(JSON.stringify(v == null ? {} : v));
  return {
    emit(topic, data) { const r = ev.push(); setTimeout(() => r.remove().catch(() => { }), 20000); return r.set({ t: topic, d: clean(data), by: FB.uid, s: FB.sess, ts: firebase.database.ServerValue.TIMESTAMP }); },
    on(topic, fn) { handlers[topic] = fn; },
    presence(patch) { myPres = clean(Object.assign({}, myPres, patch)); return selfRef.update({ p: myPres }); },
    onPeers(fn) { peersFn = fn; if (FB.peers) fn({ peers: FB.peers }); },
  };
}
// ---- dosyalar (MP3): Firestore'da parçalı ----
const FILE_CHUNK = 600000;
const FILE_CACHE = {};
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function makeAssets(db) {
  return {
    raw: true,
    async upload(blob, opt) {
      const type = (opt && opt.type) || blob.type || 'application/octet-stream';
      if (/^image\//.test(type) && blob.size < 400000) { const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); }); return { id: null, url }; }
      const u8 = new Uint8Array(await blob.arrayBuffer()); const id = 'f' + uid(); const parts = Math.ceil(u8.length / FILE_CHUNK);
      for (let i = 0; i < parts; i++) await db.doc('files_p/' + id + '_' + i).set({ d: b64(u8.subarray(i * FILE_CHUNK, (i + 1) * FILE_CHUNK)) });
      await db.doc('files/' + id).set({ parts, type, size: u8.length, ts: Date.now() });
      FILE_CACHE[id] = URL.createObjectURL(blob);
      return { id, url: 'fbfile:' + id, sizeBytes: u8.length, contentType: type };
    },
    async delete(id) {
      if (!id) return; const m = await db.doc('files/' + id).get(); const n = m.exists ? m.data().parts : 0;
      for (let i = 0; i < n; i++) await db.doc('files_p/' + id + '_' + i).delete(); await db.doc('files/' + id).delete();
    },
  };
}
const FILE_LOADING = {};
// music.js bunu çağırır: hazırsa çalınabilir URL döner, değilse yüklemeyi başlatıp null döner
function resolveUrl(url) {
  if (!url || url.indexOf('fbfile:') !== 0) return url;
  const id = url.slice(7); if (FILE_CACHE[id]) return FILE_CACHE[id];
  if (!FILE_LOADING[id] && db) {
    FILE_LOADING[id] = (async () => {
      try {
        const m = await db.doc('files/' + id).get(); if (!m.exists) return;
        const { parts, type } = m.data(); const chunks = [];
        for (let i = 0; i < parts; i++) { const s = await db.doc('files_p/' + id + '_' + i).get(); chunks.push(unb64(s.data().d)); }
        FILE_CACHE[id] = URL.createObjectURL(new Blob(chunks, { type }));
        if (typeof musSync === 'function') musSync();
      } catch (e) { console.warn('dosya', e); } finally { delete FILE_LOADING[id]; }
    })();
  }
  return null;
}
// ---- kullanıcı ----
function makeUser() {
  return {
    async me() { return { id: FB.uid, name: FB.name, color: FB.color, isOwner: isRoomGM() }; },
    async can() { return true; },
    async profiles(ids) { const o = {}; ids.forEach(id => { const m = FB.members[id]; if (m) o[id] = { name: m.name || '', avatarUrl: null }; }); return o; },
    isOwner: () => isRoomGM(),
  };
}
// ---- aynı tarayıcıda oyuncu koltuğu: sekmeye özel ikinci (geçici) anonim kimlik ----
async function usePlayerSeat() {
  if (FB.seat === 'player') return;
  const app2 = firebase.initializeApp(window.FIREBASE_CONFIG, 'seat');
  const a2 = app2.auth();
  try { await a2.setPersistence(firebase.auth.Auth.Persistence.SESSION); } catch (e) { }
  await new Promise(r => { const off = a2.onAuthStateChanged(() => { off(); r(); }); });
  let u = a2.currentUser; if (!u) { await a2.signInAnonymously(); u = a2.currentUser; }
  FB.auth = a2; FB.fs = app2.firestore(); try { FB.fs.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) { }
  FB.rt = app2.database(); if (window.FIREBASE_EMULATOR) { a2.useEmulator('http://127.0.0.1:9099'); FB.fs.useEmulator('127.0.0.1', 8080); FB.rt.useEmulator('127.0.0.1', 9000); }
  FB.uid = u.uid; FB.user = u; FB.seat = 'player';
}
const seatKey = c => 'ncm-seat-' + c;
function getSeat(c) { try { return sessionStorage.getItem(seatKey(c)); } catch (e) { return null; } }
function setSeat(c, v) { try { sessionStorage.setItem(seatKey(c), v); } catch (e) { } }
function isRoomGM() { return !!(FB.room && Array.isArray(FB.room.gms) && FB.room.gms.indexOf(FB.uid) >= 0); }
// claude.ai çalışma zamanı yerine geçen kabuk
function installShim() {
  const prefix = 'rooms/' + FB.code; const sdb = scopedDb(prefix);
  FB.adapters = { db: sdb, room: makeRoom(FB.code), user: makeUser(), assets: makeAssets(sdb), downloads: null };
  window.claude = { use: async n => FB.adapters[n] || null };
  sdb.collection('members').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); FB.members = o; if (typeof renderPeers === 'function') { renderPeers(); } if (window.renderLobby) renderLobby(); if (typeof renderLogOnly === 'function') { Object.keys(o).forEach(k => { names[k] = o[k].name || ''; }); renderLogOnly(); renderCharList(); } }, e => console.warn(e));
  FB.fs.doc(prefix).onSnapshot(s => { if (!s.exists || s.data().closed) { if (!FB.deleting) roomClosedOverlay(); return; } FB.room = s.data(); renderRoomChip(); }, () => { });
}

// ===== BAŞLANGIÇ EKRANI =====
async function fbInit() {
  if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey || /BURAYA/.test(window.FIREBASE_CONFIG.apiKey)) { startMsg('Firebase yapılandırması eksik: firebase-config.js dosyasını doldur.', 'err'); return; }
  FB.app = firebase.initializeApp(window.FIREBASE_CONFIG);
  FB.auth = firebase.auth(); FB.fs = firebase.firestore(); FB.rt = firebase.database();
  try { FB.fs.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) { }
  if (window.FIREBASE_EMULATOR) { FB.auth.useEmulator('http://127.0.0.1:9099'); FB.fs.useEmulator('127.0.0.1', 8080); FB.rt.useEmulator('127.0.0.1', 9000); }
  FB.rt.ref('.info/serverTimeOffset').on('value', s => { FB.skew = s.val() || 0; });
  FB.name = LS.get('name', ''); FB.color = LS.get('color', MENU_COLORS[Math.floor(Math.random() * MENU_COLORS.length)]);
  startMsg('Bağlanıyor…');
  FB.auth.onAuthStateChanged(async u => {
    if (!u) { try { await FB.auth.signInAnonymously(); } catch (e) { startMsg('Giriş yapılamadı: Firebase\'de Anonymous girişin açık olduğundan emin ol. (' + (e.code || e.message) + ')', 'err'); } return; }
    FB.uid = u.uid; FB.user = u; if (!FB.name && u.displayName) FB.name = u.displayName;
    startMsg(''); renderStart();
    const hc = normCode(location.hash.slice(1)); if (hc && !FB.code && FB.name) joinRoom(hc);
  });
}
function startMsg(t, kind) { const el = $s('#stMsg'); if (!el) return; el.textContent = t; el.className = 'st-msg ' + (kind || ''); el.hidden = !t; }
function renderStart() {
  $s('#stName').value = FB.name;
  $s('#stColors').innerHTML = MENU_COLORS.map(c => '<button type="button" class="st-col' + (c === FB.color ? ' on' : '') + '" data-col="' + c + '" style="--c:' + c + '" aria-label="Renk ' + c + '"></button>').join('');
  const g = FB.user && FB.user.providerData.some(p => p.providerId === 'google.com');
  $s('#stGoogle').textContent = g ? 'Google hesabı bağlı ✓' : 'Google ile bağla (cihazlar arası aynı kimlik)';
  $s('#stGoogle').disabled = !!g;
  const last = LS.get('last', null);
  $s('#stCont').hidden = !last; if (last) $s('#stCont').innerHTML = '<span>Devam et</span><small>' + esc(last.n || '') + ' · ' + showCode(last.c) + '</small>';
  const hc = normCode(location.hash.slice(1)); if (hc) $s('#stCode').value = showCode(hc);
  renderMyRooms();
}
async function renderMyRooms() {
  let list = LS.get('rooms', []);
  try { const q = await FB.fs.collection('rooms').where('gms', 'array-contains', FB.uid).limit(20).get(); q.docs.forEach(d => { if (!list.some(x => x.c === d.id)) list.push({ c: d.id, n: d.data().name, gm: 1, ts: d.data().created || 0 }); }); } catch (e) { }
  list = list.filter(x => FB.gmMode ? !!x.gm : !x.gm).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 12);
  $s('#stRooms').innerHTML = list.length ? list.map(x => '<li class="st-ri"><button class="st-room" data-room="' + esc(x.c) + '"><b>' + esc(x.n || 'Adsız oda') + '</b><small>' + showCode(x.c) + (x.gm ? ' · GM' : ' · oyuncu') + '</small></button>' + (x.gm ? '<button type="button" class="st-del" data-delroom="' + esc(x.c) + '" aria-label="' + esc(x.n || 'Oda') + ' odasını sil" title="Odayı sil">Sil</button>' : '<button type="button" class="st-del" data-forget="' + esc(x.c) + '" aria-label="Listeden kaldır" title="Listeden kaldır">×</button>') + '</li>').join('') : '<li class="st-empty">' + (FB.gmMode ? 'Henüz bir masa kurmadın.' : 'Henüz bir odaya girmedin.') + '</li>';
}
function needName() { const n = $s('#stName').value.trim().slice(0, 24); if (!n) { startMsg('Önce masada görünecek adını yaz.', 'err'); $s('#stName').focus(); return null; } FB.name = n; LS.set('name', n); return n; }
async function createRoom() {
  if (!FB.gmMode) { startMsg('Oda kurmak için önce GM girişi yap.', 'err'); return; }
  if (!needName()) return; const nm = ($s('#stRoomName').value.trim() || (FB.name + ' masası')).slice(0, 40);
  startMsg('Oda kuruluyor…');
  for (let t = 0; t < 5; t++) {
    let c = ''; const a = new Uint32Array(6); crypto.getRandomValues(a); a.forEach(x => c += CODE_CH[x % CODE_CH.length]);
    const ref = FB.fs.doc('rooms/' + c);
    try { const s = await ref.get(); if (s.exists) continue; await ref.set({ name: nm, gms: [FB.uid], gmName: FB.name, created: Date.now() }); setSeat(c, 'gm'); return joinRoom(c); }
    catch (e) { startMsg('Oda kurulamadı: ' + (e.code || e.message) + '. Firestore kurallarını yüklediğinden emin ol.', 'err'); return; }
  }
  startMsg('Oda kodu üretilemedi, tekrar dene.', 'err');
}
async function joinRoom(code) {
  if (!needName()) return; code = normCode(code); if (code.length !== 6) { startMsg('Oda kodu 6 karakter: NC-XXXXXX', 'err'); return; }
  startMsg('Odaya bağlanılıyor…');
  let s; try { s = await FB.fs.doc('rooms/' + code).get(); } catch (e) { startMsg('Bağlanılamadı: ' + (e.code || e.message), 'err'); return; }
  if (!s.exists || s.data().closed) { startMsg(showCode(code) + ' diye açık bir oda yok. Kodu kontrol et.', 'err'); return; }
  FB.room = s.data();
  // odayı kuran bu kimlikse: GM mi oyuncu mu olarak gireceğini sor
  if (isRoomGM() && FB.seat !== 'player') {
    const seat = FB.gmMode ? 'gm' : 'player'; setSeat(code, seat);
    if (seat === 'player') {
      startMsg('Oyuncu olarak bağlanılıyor…');
      try { await usePlayerSeat(); s = await FB.fs.doc('rooms/' + code).get(); FB.room = s.data(); } catch (e) { startMsg('Oyuncu kimliği açılamadı: ' + (e.code || e.message), 'err'); return; }
    }
  }
  FB.code = code;
  const prevR = LS.get('rooms', []).find(x => x.c === code); const rooms = LS.get('rooms', []).filter(x => x.c !== code); rooms.unshift({ c: code, n: FB.room.name, gm: (isRoomGM() || (FB.seat === 'player' && prevR && prevR.gm)) ? 1 : 0, ts: Date.now() }); LS.set('rooms', rooms.slice(0, 20));
  LS.set('last', { c: code, n: FB.room.name });
  if (location.hash.slice(1) !== code) history.replaceState(null, '', '#' + code);
  installShim();
  await FB.adapters.db.doc('members/' + FB.uid).set({ name: FB.name, color: FB.color, gm: isRoomGM(), ts: Date.now() }).catch(e => console.warn(e));
  FB.adapters.room.presence({ c: FB.color, gm: isRoomGM() });
  startMsg(''); showLobby();
}
// GM/oyuncu seçimi
function askSeat(code) {
  return new Promise(res => {
    const el = $s('#stSeat'); el.hidden = false;
    $s('#stSeatCode').textContent = showCode(code);
    const done = v => { el.hidden = true; el.onclick = null; res(v); };
    el.onclick = e => { const b = e.target.closest('[data-seat]'); if (b) done(b.dataset.seat === 'x' ? null : b.dataset.seat); };
  });
}
// ===== ODA SİLME (sadece GM) =====
const ROOM_COLS = ['members', 'tokens', 'hidden', 'chars', 'npcs', 'act', 'req', 'rolls', 'table', 'gm', 'dev', 'files', 'files_p', 'saves', 'savep', 'secret', 'gmsecret', 'chat', 'clog', 'ipreq'];
async function deleteRoom(code, onStep) {
  const base = 'rooms/' + code; const ref = FB.fs.doc(base);
  const s = await ref.get(); if (!s.exists) return;
  if ((s.data().gms || []).indexOf(FB.uid) < 0) throw Object.assign(new Error('Bu odanın GM\'i değilsin.'), { code: 'not-gm' });
  await ref.set({ closed: true, closedAt: Date.now() }, { merge: true });
  let uids = [];
  try { const m = await FB.fs.collection(base + '/members').get(); uids = m.docs.map(d => d.id); } catch (e) { }
  const cols = ROOM_COLS.concat(uids.map(u => 'wsp/' + u + '/m'));
  for (const col of cols) {
    if (onStep) onStep(col);
    let q; try { q = await FB.fs.collection(base + '/' + col).get(); } catch (e) { continue; }
    const docs = q.docs.slice();
    for (let i = 0; i < docs.length; i += 25) await Promise.all(docs.slice(i, i + 25).map(d => FB.fs.doc(base + '/' + col + '/' + d.id).delete().catch(() => { })));
  }
  try { await FB.rt.ref('rooms/' + code).remove(); } catch (e) { }
  await ref.delete();
  LS.set('rooms', LS.get('rooms', []).filter(x => x.c !== code));
  const last = LS.get('last', null); if (last && last.c === code) LS.set('last', null);
}
function roomClosedOverlay() {
  if ($s('#roomGone')) return;
  const d = document.createElement('div'); d.id = 'roomGone'; d.className = 'room-gone'; d.setAttribute('role', 'alertdialog');
  d.innerHTML = '<div><b>Bu masa GM tarafından kapatıldı</b><p>Ana menüye dönülüyor…</p></div>';
  document.body.appendChild(d); setTimeout(() => { history.replaceState(null, '', location.pathname); location.reload(); }, 3500);
}
function showLobby() {
  { const gb = $s('#stGmBtn'); if (gb) gb.hidden = true; }
  $s('#stMain').hidden = true; $s('#stLobby').hidden = false;
  $s('#lbName').textContent = FB.room.name || 'Oda';
  $s('#lbCode').textContent = showCode(FB.code);
  $s('#lbRole').textContent = isRoomGM() ? 'Game Master' : 'Oyuncu';
  $s('#lbRole').className = 'st-role ' + (isRoomGM() ? 'gm' : '');
  const sw = $s('#lbSeatSw'); if (sw) { const seat = getSeat(FB.code); sw.hidden = !seat; sw.textContent = seat === 'player' ? 'GM olarak girmek için tıkla' : 'Bu sekmede oyuncu olarak gir'; sw.onclick = () => { setSeat(FB.code, seat === 'player' ? 'gm' : 'player'); location.reload(); }; }
  $s('#lbHint').textContent = isRoomGM() ? 'Kodu ya da linki oyuncularına gönder. Onlar "Odaya katıl"dan girer. Masaya girince haritayı, NPC\'leri ve müziği sen yönetirsin.' : 'Masaya girince Karakter sekmesinden karakterini oluştur ya da GM\'nin verdiğini seç; tokenini haritaya koy.';
  mountFolder($s('#lbFolder')); folderWatch();
  renderLobby();
}
window.renderLobby = function () {
  const el = $s('#lbPeers'); if (!el || $s('#stLobby').hidden) return;
  const seen = new Set(); const rows = [];
  (FB.peers || []).forEach(p => { if (seen.has(p.by)) return; seen.add(p.by); const m = FB.members[p.by] || {}; rows.push('<li><span class="st-dot" style="background:' + esc(/^#[0-9a-f]{3,8}$/i.test((p.presence || {}).c || '') ? p.presence.c : '#5f6964') + '"></span>' + esc(p.by === FB.uid ? (FB.name + ' (sen)') : (m.name || 'Oyuncu')) + ((FB.room.gms || []).indexOf(p.by) >= 0 ? ' <i>GM</i>' : '') + '</li>'); });
  el.innerHTML = rows.join('') || '<li class="st-empty">Bağlanılıyor…</li>';
};
let booted = false;
function enterTable() {
  $s('#startScr').hidden = true; document.body.classList.add('in-room'); stopMenuVideo();
  if (!booted) { booted = true; boot().then(() => { renderRoomChip(); placePending(); mountFolderButtons(); }); }
}
function mountFolderButtons() {
  ['#tab-chars .newrow', '#tab-npc .npcform'].forEach(q => { const r = $s(q); if (r && !r.querySelector('[data-fopen]')) r.insertAdjacentHTML('beforeend', '<button class="btn" data-fopen>Klasörüm</button>'); });
}
function renderRoomChip() {
  const r = document.querySelector('.top .right'); if (!r || !FB.code) return;
  let el = $s('#roomChip');
  if (!el) { el = document.createElement('span'); el.id = 'roomChip'; el.className = 'roomchip'; r.insertBefore(el, r.firstChild); }
  const sp = $s('#savePop'); if (sp && isRoomGM() && !$s('#tblDelWrap')) { const w = document.createElement('div'); w.id = 'tblDelWrap'; w.className = 'tbl-del'; w.innerHTML = '<h4>Masayı sil</h4><p class="hint">Odadaki her şey kalıcı olarak silinir; bağlı oyuncular ana menüye döner.</p><button type="button" class="btn sm danger" id="tblDel">Masayı sil…</button>'; sp.appendChild(w); }
  el.innerHTML = '<span class="rc-role ' + (isRoomGM() ? 'gm' : '') + '">' + (isRoomGM() ? 'GM' : 'Oyuncu') + '</span><span class="rc-n">' + esc((FB.room && FB.room.name) || 'Oda') + '</span><button type="button" class="rc-code" data-copy="code" title="Oda kodunu kopyala">' + showCode(FB.code) + '</button><button type="button" class="rc-menu" data-menu="1" title="Ana menüye dön">Menü</button>';
}
function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => (typeof toast === 'function' ? toast('Kopyalandı: ' + t) : startMsg('Kopyalandı: ' + t)), () => prompt('Kopyala:', t)); }
const shareLink = () => location.origin + location.pathname + '#' + FB.code;
document.addEventListener('click', async e => {
  const t = e.target.closest('button,[data-room],[data-col]'); if (!t) return;
  if (t.dataset.col) { FB.color = t.dataset.col; LS.set('color', FB.color); renderStart(); return; }
  if (t.dataset.room) { joinRoom(t.dataset.room); return; }
  if (t.dataset.copy === 'code') { copyText(showCode(FB.code)); return; }
  if (t.dataset.copy === 'link') { copyText(shareLink()); return; }
  if (t.dataset.menu) { history.replaceState(null, '', location.pathname); location.reload(); return; }
  switch (t.id) {
    case 'stCreateBtn': $s('#stCreate').hidden = !$s('#stCreate').hidden; $s('#stJoin').hidden = true; if (!$s('#stCreate').hidden) $s('#stRoomName').focus(); break;
    case 'stJoinBtn': $s('#stJoin').hidden = !$s('#stJoin').hidden; $s('#stCreate').hidden = true; if (!$s('#stJoin').hidden) $s('#stCode').focus(); break;
    case 'stCreateGo': createRoom(); break;
    case 'stJoinGo': joinRoom($s('#stCode').value); break;
    case 'stCont': { const l = LS.get('last', null); if (l) joinRoom(l.c); break; }
    case 'stGoogle': googleLink(); break;
    case 'lbEnter': enterTable(); break;
    case 'lbBack': history.replaceState(null, '', location.pathname); location.reload(); break;
    case 'stHelpBtn': $s('#stHelp').hidden = !$s('#stHelp').hidden; break;
  }
});
// oda silme onayı: kodu yazdırarak
function openDelConfirm(code, anchor) {
  document.querySelectorAll('.del-confirm').forEach(x => x.remove());
  const box = document.createElement('div'); box.className = 'del-confirm';
  box.innerHTML = '<p><b>' + showCode(code) + '</b> kalıcı olarak silinecek: harita, karakterler, NPC\'ler, zarlar, kayıtlar ve müzikler. Geri alınamaz.</p><label>Onaylamak için oda kodunu yaz<input class="del-in" autocomplete="off" placeholder="' + showCode(code) + '"></label><div class="row"><button type="button" class="btn sm danger del-go" disabled>Kalıcı olarak sil</button><button type="button" class="btn sm del-x">Vazgeç</button></div><p class="del-st" hidden></p>';
  anchor.insertAdjacentElement('afterend', box);
  const inp = box.querySelector('.del-in'), go = box.querySelector('.del-go'); inp.focus();
  inp.addEventListener('input', () => { go.disabled = normCode(inp.value) !== code; });
  box.querySelector('.del-x').onclick = () => box.remove();
  go.onclick = async () => {
    go.disabled = true; inp.disabled = true; const st = box.querySelector('.del-st'); st.hidden = false; st.textContent = 'Siliniyor…';
    try { FB.deleting = code === FB.code; await deleteRoom(code, c => { st.textContent = 'Siliniyor: ' + c; }); st.textContent = 'Oda silindi.';
      if (code === FB.code) { setTimeout(() => { history.replaceState(null, '', location.pathname); location.reload(); }, 900); } else { box.remove(); renderStart(); }
    } catch (err) { st.textContent = 'Silinemedi: ' + (err.message || err.code); go.disabled = false; inp.disabled = false; FB.deleting = false; }
  };
}
document.addEventListener('click', e => {
  const d = e.target.closest('[data-delroom]'); if (d) { e.stopPropagation(); openDelConfirm(d.dataset.delroom, d.closest('li') || d); return; }
  const f = e.target.closest('[data-forget]'); if (f) { e.stopPropagation(); LS.set('rooms', LS.get('rooms', []).filter(x => x.c !== f.dataset.forget)); renderMyRooms(); return; }
  if (e.target.id === 'tblDel') { openDelConfirm(FB.code, e.target); }
}, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'stCode') joinRoom(e.target.value);
  if (e.target.id === 'stRoomName') createRoom();
});
document.addEventListener('input', e => { if (e.target.id === 'stCode') { const c = normCode(e.target.value); e.target.value = c ? showCode(c) : ''; } });
async function googleLink() {
  const prov = new firebase.auth.GoogleAuthProvider();
  try { await FB.auth.currentUser.linkWithPopup(prov); FB.user = FB.auth.currentUser; renderStart(); startMsg('Google hesabın bağlandı. Başka cihazda Google ile girersen aynı kimlikle (ve GM yetkileriyle) devam edersin.'); }
  catch (e) {
    if (e.code === 'auth/credential-already-in-use' && e.credential) { try { await FB.auth.signInWithCredential(e.credential); startMsg('Google hesabınla giriş yapıldı.'); } catch (x) { startMsg('Google ile giriş yapılamadı: ' + (x.code || x.message), 'err'); } }
    else if (e.code === 'auth/operation-not-allowed') startMsg('Bu masada Google girişi henüz açılmamış. Adınla anonim olarak devam edebilirsin; kimliğin bu tarayıcıda hatırlanır.', 'err');
    else if (e.code === 'auth/unauthorized-domain') startMsg('Bu alan adı Firebase\'de yetkili değil (Authentication → Settings → Authorized domains).', 'err');
    else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') startMsg('Google bağlanamadı: ' + (e.code || e.message), 'err');
  }
}

// ===== AÇILIŞ ANİMASYONU + ARKA PLAN FRAGMANI =====
const INTRO = { ready: false, timers: [] };
function introLater(fn, ms) { INTRO.timers.push(setTimeout(fn, ms)); }
function runIntro() {
  const boot = $s('#inBoot'), stage = $s('#inStage'); if (!stage) return;
  const lines = ['> NCM // night city masası', '> NET bağlantısı kuruluyor…', '> oda sunucusu: firebase ✓', '> zar çekirdeği: fizik simülasyonu ✓', '> netrunner arayüzü: hazır ✓', '> chooh2 seviyesi: yeterli', '> hoş geldin, choom.'];
  lines.forEach((l, i) => introLater(() => { boot.textContent += l + '\n'; }, 150 + i * 230));
  const faces = ['2', '0', '7', '7']; const n = faces.length; const W = Math.min(stage.clientWidth, 760); const gap = Math.min(W / (n + 0.5), 120);
  faces.forEach((v, i) => {
    const d = document.createElement('div'); d.className = 'die';
    const x1 = (i - (n - 1) / 2) * gap; const from = (i % 2 ? 1 : -1) * (W * 0.7 + Math.random() * 120);
    d.style.setProperty('--x0', from + 'px'); d.style.setProperty('--x1', x1 + 'px');
    d.style.setProperty('--rx', (360 * (1 + (i % 2))) + 'deg'); d.style.setProperty('--ry', (360 * (2 - (i % 2))) + 'deg');
    d.style.marginLeft = '-' + (stage.clientWidth < 560 ? 27 : 38) + 'px';
    d.style.animationDelay = (0.9 + i * 0.16) + 's';
    const others = ['1', '3', '4', '5', '6', '8', '9'];
    d.innerHTML = '<div class="f f1">' + v + '</div>' + [2, 3, 4, 5, 6].map(k => '<div class="f f' + k + '">' + others[(i * 3 + k) % others.length] + '</div>').join('');
    stage.appendChild(d);
    introLater(() => d.classList.add('land'), (0.9 + i * 0.16 + 1.9) * 1000);
  });
  introLater(() => $s('#inBurst').classList.add('go'), 3300);
  introLater(() => $s('#inLogo').classList.add('show'), 3500);
  introLater(introReady, 4400);
}
function introReady() { if (INTRO.ready) return; INTRO.ready = true; $s('#inGo').classList.add('show'); $s('#inLogo').classList.add('show'); $s('#inBtn').focus({ preventScroll: true }); }
function introSkipAnim() { INTRO.timers.forEach(clearTimeout); INTRO.timers = []; document.querySelectorAll('.die').forEach(d => { d.style.animationDuration = '0.01s'; d.style.animationDelay = '0s'; }); $s('#inBoot').textContent = '> hoş geldin, choom.\n'; introReady(); }
function vidMuted() { return !!LS.get('vidMute', false); }
const gmBgOn = () => document.body.classList.contains('gm-bg');
function renderMute() { const b = $s('#stMute'); if (!b) return; const m = gmBgOn() ? $s('#gmAudio').muted : $s('#stVideo').muted; b.textContent = m ? '🔇 Ses kapalı' : '🔊 Ses açık'; b.setAttribute('aria-pressed', m ? 'true' : 'false'); }
function introEnter(silent) {
  const v = $s('#stVideo'); const intro = $s('#intro');
  INTRO.timers.forEach(clearTimeout); intro.classList.add('out'); setTimeout(() => { intro.hidden = true; }, 900);
  if (silent) LS.set('vidMute', true);
  v.muted = silent || vidMuted(); v.volume = 0.85;
  v.classList.add('on'); const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => { }); renderMute(); });
  renderMute();
  setTimeout(() => { const n = $s('#stName'); if (n && !n.value) n.focus({ preventScroll: true }); }, 950);
}
function stopMenuVideo() { const a = $s('#gmAudio'); if (a) a.pause(); const v = $s('#stVideo'); if (!v) return; v.pause(); v.classList.remove('on'); v.removeAttribute('src'); v.load(); }
document.addEventListener('click', e => {
  if (e.target.id === 'inBtn') { introEnter(false); return; }
  if (e.target.id === 'inSkip') { introEnter(true); return; }
  if (e.target.id === 'stMute' && gmBgOn()) { const a = $s('#gmAudio'); a.muted = !a.muted; LS.set('vidMute', a.muted); if (!a.muted && a.paused) a.play().catch(() => { }); renderMute(); return; }
  if (e.target.id === 'stMute') { const v = $s('#stVideo'); v.muted = !v.muted; LS.set('vidMute', v.muted); if (!v.muted && v.paused) v.play().catch(() => { }); renderMute(); return; }
  if (e.target.closest && e.target.closest('#intro') && !INTRO.ready) introSkipAnim();
});
document.addEventListener('keydown', e => { const intro = $s('#intro'); if (!intro || intro.hidden || intro.classList.contains('out')) return; if (!INTRO.ready && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); introSkipAnim(); } });

// ===== GM GİRİŞİ: kırmızı-beyaz mod, oda kurma yetkisi =====
FB.gmMode = false;
function gmGlitch() { const g = $s('#gmGlitch'); if (!g) return; g.hidden = true; void g.offsetWidth; g.hidden = false; clearTimeout(g._t); g._t = setTimeout(() => { g.hidden = true; }, 600); }
function gmAudioPlay() { const a = $s('#gmAudio'); if (!a) return; a.volume = 0.7; a.muted = vidMuted(); if (a.paused) a.play().catch(() => { }); }
function setMenuVideo(gm) {
  const v = $s('#stVideo'); if (!v) return;
  const src = gm ? 'media/gm-loop.mp4' : 'media/intro.mp4', poster = gm ? 'media/gm-loop.jpg' : 'media/intro.jpg';
  if ((v.getAttribute('src') || '') !== src) { v.setAttribute('src', src); v.setAttribute('poster', poster); v.load(); }
  v.loop = true; v.muted = gm ? true : vidMuted(); v.classList.add('on'); const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => { }); });
  renderMute();
}
function showGmIntro() {
  const el = $s('#gmIntro'); if (!el) return;
  const v0 = $s('#stVideo'); if (v0) v0.pause();
  el.classList.remove('menu', 'out'); $s('#gmPress').hidden = false; $s('#gmMenu').hidden = true; el.hidden = false;
  gmGlitch(); const v = $s('#gmVid'); v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => { });
  setTimeout(() => $s('#gmGo').focus({ preventScroll: true }), 50);
}
function gmMenuRender() {
  const rooms = LS.get('rooms', []).filter(x => x.gm); const l = rooms[0]; const c = $s('#gmMenu [data-gm="cont"]');
  c.hidden = !l; if (l) c.querySelector('small').textContent = (l.n || 'Son masa') + ' · ' + showCode(l.c);
  $s('#gmWho').textContent = FB.name || LS.get('name', '') || '';
}
function gmPress(silent) {
  if (silent) LS.set('vidMute', true);
  gmGlitch(); gmAudioPlay();
  const el = $s('#gmIntro'); el.classList.add('menu'); $s('#gmPress').hidden = true;
  gmMenuRender(); $s('#gmMenu').hidden = false;
  setTimeout(() => { const f = $s('#gmMenu .gmi-it:not([hidden])'); if (f) f.focus({ preventScroll: true }); }, 80);
}
// GM moduna geç: tema, müzik, video, oda kurma
function gmModeOn(after) {
  FB.gmMode = true; document.body.classList.add('gm-theme', 'gm-bg');
  gmGlitch(); setMenuVideo(true); gmAudioPlay();
  const el = $s('#gmIntro'); el.classList.add('out');
  setTimeout(() => { el.hidden = true; $s('#gmVid').pause(); }, 520);
  $s('#stGmBtn').textContent = 'Normal ekrana dön';
  renderMyRooms(); startMsg('');
  if (after) setTimeout(after, 120);
}
function gmModeOff() {
  FB.gmMode = false; document.body.classList.remove('gm-theme', 'gm-bg');
  const a = $s('#gmAudio'); if (a) a.pause();
  gmGlitch(); setMenuVideo(false);
  $s('#stGmBtn').textContent = 'GM girişi'; $s('#stCreate').hidden = true;
  renderMyRooms(); startMsg('');
}
document.addEventListener('click', e => {
  if (e.target.id === 'stGmBtn') { if (FB.gmMode) gmModeOff(); else showGmIntro(); return; }
  if (e.target.closest('#gmGo')) { gmPress(false); return; }
  if (e.target.id === 'gmSilent') { gmPress(true); return; }
  const it = e.target.closest('#gmMenu [data-gm]'); if (!it) return;
  const k = it.dataset.gm;
  if (k === 'cont') { const l = LS.get('rooms', []).find(x => x.gm); gmModeOn(() => { if (!l) return; if (FB.name) joinRoom(l.c); else { startMsg('Önce masada görünecek adını yaz.', 'err'); $s('#stName').focus(); } }); }
  if (k === 'new') gmModeOn(() => { $s('#stCreate').hidden = false; $s('#stRoomName').focus(); });
  if (k === 'rooms') gmModeOn(() => { $s('#stRooms').scrollIntoView({ block: 'center' }); const r = $s('#stRooms .st-room'); if (r) r.focus({ preventScroll: true }); });
  if (k === 'set') gmModeOn(() => { $s('#stName').focus(); });
  if (k === 'back') { const el = $s('#gmIntro'); el.classList.add('out'); setTimeout(() => { el.hidden = true; $s('#gmVid').pause(); }, 520); const a = $s('#gmAudio'); if (a) a.pause(); gmGlitch(); setMenuVideo(false); }
});
document.addEventListener('keydown', e => {
  const el = $s('#gmIntro'); if (!el || el.hidden || el.classList.contains('out')) return;
  if (e.key === 'Escape') { e.preventDefault(); el.querySelector('[data-gm="back"]').click(); return; }
  if (!$s('#gmPress').hidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gmPress(false); } return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); const its = [...el.querySelectorAll('.gmi-it:not([hidden])')]; const i = its.indexOf(document.activeElement);
    const n = its[(i + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length]; if (n) n.focus();
  }
});
runIntro();
fbInit();
