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
function isRoomGM() { return !!(FB.room && Array.isArray(FB.room.gms) && FB.room.gms.indexOf(FB.uid) >= 0); }
// claude.ai çalışma zamanı yerine geçen kabuk
function installShim() {
  const prefix = 'rooms/' + FB.code; const sdb = scopedDb(prefix);
  FB.adapters = { db: sdb, room: makeRoom(FB.code), user: makeUser(), assets: makeAssets(sdb), downloads: null };
  window.claude = { use: async n => FB.adapters[n] || null };
  sdb.collection('members').onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); FB.members = o; if (typeof renderPeers === 'function') { renderPeers(); } if (window.renderLobby) renderLobby(); if (typeof renderLogOnly === 'function') { Object.keys(o).forEach(k => { names[k] = o[k].name || ''; }); renderLogOnly(); renderCharList(); } }, e => console.warn(e));
  FB.fs.doc(prefix).onSnapshot(s => { if (s.exists) { FB.room = s.data(); renderRoomChip(); } }, () => { });
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
  list = list.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 12);
  $s('#stRooms').innerHTML = list.length ? list.map(x => '<li><button class="st-room" data-room="' + esc(x.c) + '"><b>' + esc(x.n || 'Adsız oda') + '</b><small>' + showCode(x.c) + (x.gm ? ' · GM' : ' · oyuncu') + '</small></button></li>').join('') : '<li class="st-empty">Henüz bir odaya girmedin.</li>';
}
function needName() { const n = $s('#stName').value.trim().slice(0, 24); if (!n) { startMsg('Önce masada görünecek adını yaz.', 'err'); $s('#stName').focus(); return null; } FB.name = n; LS.set('name', n); return n; }
async function createRoom() {
  if (!needName()) return; const nm = ($s('#stRoomName').value.trim() || (FB.name + ' masası')).slice(0, 40);
  startMsg('Oda kuruluyor…');
  for (let t = 0; t < 5; t++) {
    let c = ''; const a = new Uint32Array(6); crypto.getRandomValues(a); a.forEach(x => c += CODE_CH[x % CODE_CH.length]);
    const ref = FB.fs.doc('rooms/' + c);
    try { const s = await ref.get(); if (s.exists) continue; await ref.set({ name: nm, gms: [FB.uid], gmName: FB.name, created: Date.now() }); return joinRoom(c); }
    catch (e) { startMsg('Oda kurulamadı: ' + (e.code || e.message) + '. Firestore kurallarını yüklediğinden emin ol.', 'err'); return; }
  }
  startMsg('Oda kodu üretilemedi, tekrar dene.', 'err');
}
async function joinRoom(code) {
  if (!needName()) return; code = normCode(code); if (code.length !== 6) { startMsg('Oda kodu 6 karakter: NC-XXXXXX', 'err'); return; }
  startMsg('Odaya bağlanılıyor…');
  let s; try { s = await FB.fs.doc('rooms/' + code).get(); } catch (e) { startMsg('Bağlanılamadı: ' + (e.code || e.message), 'err'); return; }
  if (!s.exists) { startMsg(showCode(code) + ' diye bir oda yok. Kodu kontrol et.', 'err'); return; }
  FB.code = code; FB.room = s.data();
  const rooms = LS.get('rooms', []).filter(x => x.c !== code); rooms.unshift({ c: code, n: FB.room.name, gm: isRoomGM() ? 1 : 0, ts: Date.now() }); LS.set('rooms', rooms.slice(0, 20));
  LS.set('last', { c: code, n: FB.room.name });
  if (location.hash.slice(1) !== code) history.replaceState(null, '', '#' + code);
  installShim();
  await FB.adapters.db.doc('members/' + FB.uid).set({ name: FB.name, color: FB.color, gm: isRoomGM(), ts: Date.now() }).catch(e => console.warn(e));
  FB.adapters.room.presence({ c: FB.color, gm: isRoomGM() });
  startMsg(''); showLobby();
}
function showLobby() {
  $s('#stMain').hidden = true; $s('#stLobby').hidden = false;
  $s('#lbName').textContent = FB.room.name || 'Oda';
  $s('#lbCode').textContent = showCode(FB.code);
  $s('#lbRole').textContent = isRoomGM() ? 'Game Master' : 'Oyuncu';
  $s('#lbRole').className = 'st-role ' + (isRoomGM() ? 'gm' : '');
  $s('#lbHint').textContent = isRoomGM() ? 'Kodu ya da linki oyuncularına gönder. Onlar "Odaya katıl"dan girer. Masaya girince haritayı, NPC\'leri ve müziği sen yönetirsin.' : 'Masaya girince Karakter sekmesinden karakterini oluştur ya da GM\'nin verdiğini seç; tokenini haritaya koy.';
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
  $s('#startScr').hidden = true; document.body.classList.add('in-room');
  if (!booted) { booted = true; boot().then(() => { renderRoomChip(); }); }
}
function renderRoomChip() {
  const r = document.querySelector('.top .right'); if (!r || !FB.code) return;
  let el = $s('#roomChip');
  if (!el) { el = document.createElement('span'); el.id = 'roomChip'; el.className = 'roomchip'; r.insertBefore(el, r.firstChild); }
  el.innerHTML = '<span class="rc-n">' + esc((FB.room && FB.room.name) || 'Oda') + '</span><button type="button" class="rc-code" data-copy="code" title="Oda kodunu kopyala">' + showCode(FB.code) + '</button><button type="button" class="rc-menu" data-menu="1" title="Ana menüye dön">Menü</button>';
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
    else if (e.code === 'auth/operation-not-allowed') startMsg('Google girişi Firebase\'de açık değil (Authentication → Sign-in method → Google).', 'err');
    else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') startMsg('Google bağlanamadı: ' + (e.code || e.message), 'err');
  }
}
fbInit();
