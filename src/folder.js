window.FOLDER_ON = true;
// ===== KARAKTER KLASÖRÜ (GitHub sürümü): odadan bağımsız, kullanıcıya ait karakterler =====
// Firestore: users/<uid>/chars/<id> = { c: karakter, n, role, ts }  (sadece sahibi okur/yazar)
const FOLDER = { list: [], unsub: null, ready: false };
const folderCol = () => FB.fs.collection('users/' + FB.uid + '/chars');
const folderRef = id => FB.fs.doc('users/' + FB.uid + '/chars/' + id);
function folderWatch() {
  if (FOLDER.unsub) FOLDER.unsub();
  FOLDER.unsub = folderCol().onSnapshot(q => { FOLDER.list = q.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.ts || 0) - (a.ts || 0)); FOLDER.ready = true; renderFolder(); }, e => { console.warn('klasör', e); FOLDER.ready = true; renderFolder(); });
}
// klasöre giden kopyadan odaya özel alanları ayıkla
function folderStrip(c) { const x = clone(c); ['owner', 'src', 'locked', 'pending', 'hidden', 'caSwR', 'caDdR', 'juryPrev'].forEach(k => delete x[k]); return x; }
const folderInitials = n => (String(n || '?').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase() || '?');
function folderCardHTML(f, ctx) {
  const c = f.c || {}; const im = c.img && c.img.url; const isN = c.kind === 'npc';
  const sub = isN ? 'NPC · ' + ((ARCHES[c.arche] || {}).n || '') : (c.role || 'Rol yok') + (c.rank ? ' · rütbe ' + c.rank : '');
  const mx = c.stats ? hpMax(c) : 0;
  return '<li class="fc"><span class="fc-p">' + (im ? '<img alt="" src="' + esc(im) + '">' : esc(folderInitials(c.handle || c.name))) + '</span>'
    + '<div class="fc-t"><b>' + esc(c.handle || c.name || 'İsimsiz') + '</b><small>' + esc(sub) + (mx ? ' · ' + esc(c.hp) + '/' + mx + ' HP' : '') + (c.ip ? ' · ' + c.ip + ' IP' : '') + '</small></div>'
    + '<div class="fc-b"><button type="button" class="btn sm primary" data-fbring="' + esc(f.id) + '">Masaya getir</button>'
    + '<button type="button" class="btn sm" data-fdup="' + esc(f.id) + '" title="Çoğalt" aria-label="' + esc(c.handle || 'Karakter') + ' karakterini çoğalt">Çoğalt</button>'
    + '<button type="button" class="btn sm" data-fdl="' + esc(f.id) + '" title="Dosyaya indir" aria-label="' + esc(c.handle || 'Karakter') + ' karakterini dosyaya indir">İndir</button>'
    + '<button type="button" class="btn sm danger" data-fdel="' + esc(f.id) + '" title="Klasörden sil" aria-label="' + esc(c.handle || 'Karakter') + ' karakterini klasörden sil">Sil</button></div></li>';
}
function renderFolder() {
  const html = !FOLDER.ready ? '<li class="st-empty">Klasör yükleniyor…</li>' : FOLDER.list.length ? FOLDER.list.map(f => folderCardHTML(f)).join('') : '<li class="st-empty">Klasörün boş. Yeni bir karakter oluştur ya da dosyadan yükle.</li>';
  document.querySelectorAll('.folder-list').forEach(el => { if (el._h !== html) { el.innerHTML = html; el._h = html; } });
}
function fMsg(t, kind) { document.querySelectorAll('.folder-msg').forEach(el => { el.textContent = t; el.className = 'folder-msg st-msg ' + (kind || ''); el.hidden = !t; }); if (t && typeof toast === 'function' && booted) toast(t, kind); }
async function folderSave(c, id) {
  const data = { c: folderStrip(c), n: c.handle || c.name || '', role: c.role || '', kind: c.kind || 'pc', ts: Date.now() };
  id = id || 'f' + uid(); await folderRef(id).set(data); return id;
}
// karakteri odaya kopyala; tokeni masaya girince yerleşir
async function folderBring(fid) {
  const f = FOLDER.list.find(x => x.id === fid); if (!f) return;
  const rdb = FB.adapters && FB.adapters.db; if (!rdb) { fMsg('Önce bir odaya gir.', 'err'); return; }
  const c = clone(f.c); const npc = c.kind === 'npc';
  if (npc && !isRoomGM()) { fMsg('NPC\'leri sadece GM masaya getirebilir.', 'err'); return; }
  try { const q = await rdb.collection(npc ? 'npcs' : 'chars').where('src', '==', fid).get(); const mine = q.docs.filter(d => d.data().owner === FB.uid); if (mine.length) { fMsg((c.handle || 'Karakter') + ' zaten bu masada.'); queuePlace(mine[0].id); return; } } catch (e) { }
  c.owner = FB.uid; c.src = fid; c.ts = Date.now(); c.locked = false; c.pending = !npc && !isRoomGM();
  if (npc) c.hidden = true;
  const id = (npc ? 'n_' : 'c_') + uid();
  try { await rdb.doc((npc ? 'npcs/' : 'chars/') + id).set(c); } catch (e) { fMsg('Masaya getirilemedi: ' + (e.code || e.message), 'err'); return; }
  if (booted && S.chars) { S.chars[id] = c; renderChars(); }
  queuePlace(id); fMsg((c.handle || 'Karakter') + ' masaya getirildi' + (booted ? '.' : '; masaya girince tokenin hazır olacak.'));
}
function queuePlace(id) { const q = LS.get('place-' + FB.code, []); if (q.indexOf(id) < 0) q.push(id); LS.set('place-' + FB.code, q); if (booted) placePending(); }
// masaya girince bekleyen tokenleri yerleştir (harita yayınlanınca)
let placeTimer = null;
function placePending() {
  clearInterval(placeTimer);
  placeTimer = setInterval(() => {
    const q = LS.get('place-' + FB.code, []); if (!q.length) { clearInterval(placeTimer); return; }
    if (!S.map) return;
    const left = q.filter(id => { const c = S.chars[id]; if (!c) return true; if (!S.tokens['t_' + id]) { if (c.kind === 'npc') return false; placeToken(id, c); } return false; });
    LS.set('place-' + FB.code, left);
  }, 1200);
}
async function folderCreate(form) {
  const v = n => form.querySelector('[name="' + n + '"]');
  const role = v('role').value, method = (form.querySelector('[name="method"]:checked') || {}).value || 'quick';
  const c = method === 'blank' ? makeBlank() : makePC(role);
  c.role = role; c.owner = FB.uid;
  if (v('handle').value.trim()) c.handle = v('handle').value.trim().slice(0, 32);
  if (v('rname').value.trim()) c.name = v('rname').value.trim().slice(0, 48);
  if (v('life').checked) c.life = rollLife();
  if (v('kind') && v('kind').checked) { c.kind = 'npc'; c.arche = c.arche || 'solo'; c.tier = c.tier || 'vet'; }
  const file = v('img').files && v('img').files[0];
  if (file) { try { c.img = { url: await folderPortrait(file) }; } catch (e) { } }
  c.hp = hpMax(c); c.luck = c.stats.LUCK;
  const id = await folderSave(c);
  return id;
}
function folderPortrait(file) {
  return new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 200; const s = Math.min(im.naturalWidth, im.naturalHeight); cv.getContext('2d').drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) * 0.35, s, s, 0, 0, 200, 200); URL.revokeObjectURL(im.src); res(cv.toDataURL('image/jpeg', 0.8)); };
    im.onerror = rej; im.src = URL.createObjectURL(file);
  });
}
function folderDownload(f) {
  const json = JSON.stringify({ app: 'night-city-masasi', kind: 'char', v: 1, c: f.c }, null, 1);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'karakter-' + String(f.c.handle || f.c.name || 'adsiz').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-').slice(0, 40) + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
// sayfadan klasöre kaydet
async function folderSyncFromSheet(id) {
  const c = S.chars[id]; if (!c) return;
  let fid = c.src && FOLDER.list.some(x => x.id === c.src) ? c.src : null;
  try {
    fid = await folderSave(c, fid);
    if (c.src !== fid && canEditChar(c)) { c.src = fid; saveCharNow(id); }
    toast((c.handle || 'Karakter') + ' klasörüne kaydedildi.');
  } catch (e) { toast('Klasöre kaydedilemedi: ' + (e.code || e.message), 'err'); }
}
const FOLDER_FORM = '<form class="fnew" hidden>'
  + '<div class="fn-row"><label>Takma ad<input name="handle" maxlength="32" placeholder="ör. Lil\'Choom"></label><label>Gerçek ad<input name="rname" maxlength="48" placeholder="isteğe bağlı"></label></div>'
  + '<div class="fn-row"><label>Rol<select name="role"></select></label><label>Portre<input name="img" type="file" accept="image/*"></label></div>'
  + '<div class="fn-seg" role="radiogroup" aria-label="Oluşturma yolu"><label><input type="radio" name="method" value="quick" checked> Hızlı: rol şablonu (kitaptaki dağılımla)</label><label><input type="radio" name="method" value="blank"> Boş sayfa: kendim dolduracağım</label></div>'
  + '<label class="tog"><input type="checkbox" name="life" checked> Yaşam yolunu zarla belirle</label>'
  + '<label class="tog fn-npc"><input type="checkbox" name="kind"> NPC olarak sakla (GM)</label>'
  + '<div class="row"><button type="submit" class="btn primary" data-fgo="bring">Oluştur ve masaya getir</button><button type="submit" class="btn" data-fgo="save">Sadece klasöre kaydet</button></div></form>';
function folderPanelHTML() {
  return '<div class="folder"><div class="row fl-act"><button type="button" class="btn sm primary" data-fnew>Yeni karakter</button><button type="button" class="btn sm" data-fimp>Dosyadan yükle</button><input type="file" class="fimp-in" accept=".json,application/json" hidden></div>'
    + '<p class="folder-msg st-msg" hidden></p><ul class="folder-list"></ul></div>';
}
function mountFolder(host) {
  if (!host || host.querySelector('.folder')) return;
  host.innerHTML = folderPanelHTML();
  renderFolder();
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-fnew],[data-fimp],[data-fbring],[data-fdup],[data-fdl],[data-fdel],[data-fopen],[data-fclose],[data-fsync]'); if (!t) return;
  const host = t.closest('.folder');
  if (t.hasAttribute('data-fnew')) { openWizard('folder'); return; }
  if (t.hasAttribute('data-fimp')) { host.querySelector('.fimp-in').click(); return; }
  if (t.dataset.fbring) { t.disabled = true; await folderBring(t.dataset.fbring); t.disabled = false; return; }
  if (t.dataset.fdup) { const f = FOLDER.list.find(x => x.id === t.dataset.fdup); if (f) { const c = clone(f.c); c.handle = (c.handle || 'Karakter') + ' (kopya)'; await folderSave(c); } return; }
  if (t.dataset.fdl) { const f = FOLDER.list.find(x => x.id === t.dataset.fdl); if (f) folderDownload(f); return; }
  if (t.dataset.fdel) { armConfirmLite(t, async () => { await folderRef(t.dataset.fdel).delete().catch(() => { }); }); return; }
  if (t.hasAttribute('data-fopen')) { const p = $s('#folderPop'); p.hidden = false; mountFolder(p.querySelector('.fp-body')); return; }
  if (t.hasAttribute('data-fclose')) { $s('#folderPop').hidden = true; return; }
  if (t.dataset.fsync) { folderSyncFromSheet(t.dataset.fsync); return; }
});
function armConfirmLite(btn, fn) { if (typeof armConfirm === 'function') return armConfirm(btn, fn, 'Emin misin?'); if (btn.dataset.armed) { fn(); return; } btn.dataset.armed = 1; btn.textContent = 'Emin misin?'; setTimeout(() => { delete btn.dataset.armed; btn.textContent = 'Sil'; }, 3000); }
document.addEventListener('submit', async e => {
  const form = e.target.closest('.fnew'); if (!form) return; e.preventDefault();
  const how = e.submitter && e.submitter.dataset.fgo;
  form.querySelectorAll('button').forEach(b => b.disabled = true);
  try { const id = await folderCreate(form); form.reset(); form.hidden = true; fMsg('Karakter klasöre kaydedildi.'); if (how === 'bring') await folderBring(id); }
  catch (err) { fMsg('Oluşturulamadı: ' + (err.code || err.message), 'err'); }
  form.querySelectorAll('button').forEach(b => b.disabled = false);
});
document.addEventListener('change', async e => {
  if (!e.target.classList.contains('fimp-in')) return; const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const j = JSON.parse(await f.text()); const c = j && j.c; if (!c || !c.stats || !c.skills) throw new Error('Bu bir karakter dosyası değil.'); await folderSave(c); fMsg((c.handle || 'Karakter') + ' klasöre eklendi.'); }
  catch (err) { fMsg('Dosya okunamadı: ' + (err.message || err), 'err'); }
});
