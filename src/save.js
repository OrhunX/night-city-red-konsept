// ===== OYUNU KAYDET / YÜKLE (GM) =====
// Kayıtlar saves/<id> (özet) + savep/<id>_<n> (parçalar) belgelerinde; sadece GM okur ve yazar.
let dl = null;
const SAVE = { list: [], busy: false };
const CHUNK = 180000;
function snapshot(name) {
  const tokens = {}; Object.entries(S.tokens).forEach(([id, t]) => tokens[id] = clone(t));
  return {
    v: 1, app: 'night-city-masasi', name, ts: Date.now(),
    map: S.map ? clone(S.map) : null, tokens, chars: clone(S.chars), init: clone(S.init || { order: [], turn: 0, round: 1 }),
    grapple: clone(FX.pairs || {}), music: musicDoc ? clone(musicDoc) : null, dev: clone(NET.st), backup: clone(BK.list), day: S.day || 0,
  };
}
const fmtDate = ts => { try { return new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
function defaultSaveName() { return (S.map && S.map.name ? S.map.name + ' · ' : '') + fmtDate(Date.now()); }
async function loadSaveList() {
  if (!db) { try { SAVE.list = JSON.parse(localStorage.getItem('ncm-saves-idx') || '[]'); } catch (e) { SAVE.list = SAVE.list || []; } renderSaves(); return; }
  try { const q = await db.collection('saves').orderBy('ts', 'desc').limit(50).get(); SAVE.list = q.docs.map(d => Object.assign({ id: d.id }, d.data())); }
  catch (e) { console.warn(e); }
  renderSaves();
}
async function saveGame(name) {
  if (!S.me.isGM || SAVE.busy) return;
  SAVE.busy = true; renderSaves();
  try {
    const snap = snapshot(name || defaultSaveName()); const json = JSON.stringify(snap);
    const id = 's' + uid(); const parts = Math.ceil(json.length / CHUNK);
    const meta = { n: snap.name, ts: snap.ts, parts, size: json.length, map: S.map ? S.map.name || '' : '', toks: Object.keys(snap.tokens).length, chars: Object.keys(snap.chars).length, round: (snap.init.order || []).length ? snap.init.round : 0 };
    if (!db) {
      MEMSAVES[id] = json; try { localStorage.setItem('ncm-save-' + id, json); } catch (e) { }
      SAVE.list = [Object.assign({ id }, meta)].concat(SAVE.list); try { localStorage.setItem('ncm-saves-idx', JSON.stringify(SAVE.list)); } catch (e) { }
    } else {
      for (let i = 0; i < parts; i++) await db.doc('savep/' + id + '_' + i).set({ d: json.slice(i * CHUNK, (i + 1) * CHUNK) });
      await db.doc('saves/' + id).set(meta);
      SAVE.list = [Object.assign({ id }, meta)].concat(SAVE.list);
    }
    toast('Oyun kaydedildi: ' + snap.name); Sound.play('ok');
  } catch (e) { console.warn(e); toast('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.', 'err'); }
  SAVE.busy = false; renderSaves();
}
const MEMSAVES = {};
async function readSave(id) {
  const meta = SAVE.list.find(x => x.id === id); if (!meta) return null;
  if (!db) { const j = MEMSAVES[id] || (() => { try { return localStorage.getItem('ncm-save-' + id); } catch (e) { return null; } })(); return j ? JSON.parse(j) : null; }
  let json = ''; for (let i = 0; i < meta.parts; i++) { const s = await db.doc('savep/' + id + '_' + i).get(); if (!s.exists) throw new Error('part'); json += s.data().d; }
  return JSON.parse(json);
}
async function deleteSave(id) {
  const meta = SAVE.list.find(x => x.id === id); if (!meta) return;
  SAVE.list = SAVE.list.filter(x => x.id !== id); renderSaves();
  if (!db) { delete MEMSAVES[id]; try { localStorage.removeItem('ncm-save-' + id); localStorage.setItem('ncm-saves-idx', JSON.stringify(SAVE.list)); } catch (e) { } return; }
  try { for (let i = 0; i < meta.parts; i++) await db.doc('savep/' + id + '_' + i).delete(); await db.doc('saves/' + id).delete(); } catch (e) { console.warn(e); }
}
function validSnap(s) { return s && s.app === 'night-city-masasi' && s.v === 1 && typeof s.tokens === 'object' && typeof s.chars === 'object'; }
// kaydı masaya geri yükle: haritayı, tokenleri, karakterleri, sırayı, müziği ve sistemleri değiştirir
async function restoreSnap(s) {
  if (!validSnap(s)) { toast('Bu dosya bir Night City Masası kaydı değil.', 'err'); return; }
  SAVE.busy = true; renderSaves();
  try {
    if (s.map) { S.preview = null; S.map = s.map; onMapChange(); await setDoc('gm/map', s.map); }
    // tokenler
    for (const [id, t] of Object.entries(S.tokens)) if (!s.tokens[id]) await delDoc((t.hidden ? 'hidden/' : 'tokens/') + id);
    for (const [id, t] of Object.entries(s.tokens)) {
      const cur = S.tokens[id]; if (cur && !!cur.hidden !== !!t.hidden) await delDoc((cur.hidden ? 'hidden/' : 'tokens/') + id);
      const d = clone(t); d.hidden = !!t.hidden; S.tokens[id] = d; await setDoc((t.hidden ? 'hidden/' : 'tokens/') + id, d);
    }
    // karakterler
    for (const [id, c] of Object.entries(S.chars)) if (!s.chars[id]) await delDoc((isNpc(c) ? 'npcs/' : 'chars/') + id);
    for (const [id, c] of Object.entries(s.chars)) {
      const cur = S.chars[id]; if (cur && isNpc(cur) !== isNpc(c)) await delDoc((isNpc(cur) ? 'npcs/' : 'chars/') + id);
      S.chars[id] = clone(c); await setDoc((isNpc(c) ? 'npcs/' : 'chars/') + id, c);
    }
    S.init = s.init || { order: [], turn: 0, round: 1 }; await setDoc('table/init', S.init); renderInit();
    FX.pairs = s.grapple || {}; await setDoc('table/grapple', { pairs: FX.pairs });
    BK.list = s.backup || []; await setDoc('table/backup', { list: BK.list });
    for (const id of Object.keys(NET.st)) if (!(s.dev || {})[id]) await delDoc('dev/' + id);
    for (const [id, v] of Object.entries(s.dev || {})) { NET.st[id] = v; await setDoc('dev/' + id, v); }
    S.day = s.day || 0; await setDoc('gm/clock', { day: S.day });
    if (s.music) { await setDoc('gm/music', s.music); applyMusic(s.music); }
    S.sel = null; S.selDev = null; renderChars(); renderTokCard(); renderDevCard(); renderCards(); dirty();
    toast('Kayıt yüklendi: ' + (s.name || 'adsız'));
  } catch (e) { console.warn(e); toast('Kayıt yüklenirken hata oldu; bir kısmı yüklenmemiş olabilir.', 'err'); }
  SAVE.busy = false; renderSaves();
}
async function exportSnap(s) {
  const json = JSON.stringify(s, null, 1);
  const fn = 'night-city-' + (s.name || 'kayit').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) + '.json';
  if (dl) { try { await dl.save({ filename: fn, data: json }); return; } catch (e) { if (e && e.code !== 'unavailable') { if (e.code !== 'declined' && e.code !== 'cancelled') toast('Dosya indirilemedi.', 'err'); return; } } }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  catch (e) { toast('Dosya indirilemedi.', 'err'); }
}
function renderSaves() {
  const el = $('#savePop'); if (!el || el.hidden) return;
  const L = SAVE.list;
  $('#saveList').innerHTML = L.length ? L.map(x => '<li><div><b>' + esc(x.n) + '</b><small>' + esc(fmtDate(x.ts)) + ' · ' + (x.toks || 0) + ' token · ' + (x.chars || 0) + ' sayfa' + (x.round ? ' · ' + x.round + '. tur' : '') + '</small></div><div class="sv-b"><button class="btn sm primary" data-act="svLoad" data-id="' + esc(x.id) + '">Yükle</button><button class="btn sm" data-act="svDl" data-id="' + esc(x.id) + '" aria-label="' + esc(x.n) + ' kaydını dosyaya indir" title="Dosyaya indir">İndir</button><button class="btn sm danger" data-act="svDel" data-id="' + esc(x.id) + '" aria-label="' + esc(x.n) + ' kaydını sil" title="Sil">Sil</button></div></li>').join('') : '<li class="empty">Henüz kayıt yok.</li>';
  $('#saveGo').disabled = SAVE.busy; $('#saveGo').textContent = SAVE.busy ? 'Çalışıyor…' : 'Kaydet';
}
const SAVE_ACTS = {
  saveOpen: () => { const p = $('#savePop'); p.hidden = !p.hidden; if (!p.hidden) { $('#saveName').value = defaultSaveName(); loadSaveList(); renderSaves(); } },
  saveGo: () => saveGame($('#saveName').value.trim()),
  svLoad: b => armConfirm(b, async () => { const s = await readSave(b.dataset.id).catch(() => null); if (!s) { toast('Kayıt okunamadı.', 'err'); return; } restoreSnap(s); }, 'Masa değişecek. Emin misin?'),
  svDl: async b => { const s = await readSave(b.dataset.id).catch(() => null); if (s) exportSnap(s); else toast('Kayıt okunamadı.', 'err'); },
  svDel: b => armConfirm(b, () => deleteSave(b.dataset.id), 'Sil?'),
  svExport: () => exportSnap(snapshot(($('#saveName').value.trim()) || defaultSaveName())),
  svImport: () => $('#saveFile').click(),
};
document.addEventListener('change', async e => {
  if (e.target.id !== 'saveFile') return; const f = e.target.files[0]; e.target.value = ''; if (!f || !S.me.isGM) return;
  let s = null; try { s = JSON.parse(await f.text()); } catch (x) { toast('Dosya okunamadı.', 'err'); return; }
  if (!validSnap(s)) { toast('Bu dosya bir Night City Masası kaydı değil.', 'err'); return; }
  S.pendingImport = s; const b = $('#svImportGo'); b.hidden = false; b.textContent = '"' + (s.name || f.name) + '" yükle';
});
document.addEventListener('click', e => {
  if (e.target.id === 'svImportGo') { const b = e.target; armConfirm(b, () => { const s = S.pendingImport; S.pendingImport = null; b.hidden = true; if (s) restoreSnap(s); }, 'Masa değişecek. Emin misin?'); }
});
document.addEventListener('pointerdown', e => { const p = $('#savePop'); if (p && !p.hidden && !e.target.closest('#savePop,#saveBtn')) p.hidden = true; });
