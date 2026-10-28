// ===== MÜZİK: sentez parçalar + GM'nin yüklediği MP3 listesi (herkeste senkron) + paylaşılan linkler =====
let musicDoc = null;
const MUS = { el: null, cur: null, need: false, busy: 0, err: '' };
const LINK_HOSTS = ['soundcloud.com', 'on.soundcloud.com', 'm.soundcloud.com', 'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'open.spotify.com', 'spotify.link'];
const MAX_MP3 = 20 * 1024 * 1024;

function musNorm(d) {
  d = d ? clone(d) : {};
  if (!d.mode) d.mode = d.track ? 'synth' : null; // eski {track} kayıtları
  d.list = Array.isArray(d.list) ? d.list : [];
  d.rep = d.rep || 'all';
  return d;
}
function linkKind(u) {
  try { const x = new URL(u); if (x.protocol !== 'https:') return null; const h = x.hostname.replace(/^www\./, '');
    if (LINK_HOSTS.indexOf(x.hostname) < 0 && LINK_HOSTS.indexOf(h) < 0) return null;
    return /soundcloud/.test(h) ? 'SoundCloud' : /spotify/.test(h) ? 'Spotify' : 'YouTube'; } catch (e) { return null; }
}
// Şu an listenin neresindeyiz? (geç katılanlar da aynı yeri hesaplar)
function filePos(d) {
  const L = d.list, n = L.length; if (!n) return null;
  if (d.paused) { const i = Math.min(+d.pIdx || 0, n - 1); return { i, pos: +d.pPos || 0 }; }
  let i = Math.min(+d.from || 0, n - 1), t = Math.max(0, (Date.now() - (+d.start || Date.now())) / 1000);
  const dur = k => Math.max(1, +L[k].d || 1);
  if (d.rep === 'one') return { i, pos: t % dur(i) };
  const total = L.reduce((a, x) => a + Math.max(1, +x.d || 1), 0);
  if (d.rep === 'all' && t > total * 2) t = t % total;
  let guard = 0;
  while (t >= dur(i) && guard++ < 10000) {
    t -= dur(i);
    if (i === n - 1) { if (d.rep === 'none') return { i, pos: dur(i), ended: true }; i = 0; } else i++;
  }
  return { i, pos: t };
}
function musVol() { return Sound.pref.mute ? 0 : Math.min(1, Sound.pref.mus * 1.6); }
function musEl() {
  if (!MUS.el) { MUS.el = new Audio(); MUS.el.preload = 'auto'; MUS.el.addEventListener('error', () => { MUS.err = 'Parça yüklenemedi.'; renderSound(); }); MUS.el.addEventListener('ended', () => setTimeout(musSync, 50)); }
  return MUS.el;
}
function musSync() {
  const d = musicDoc; const a = MUS.el;
  if (!d || d.mode !== 'file' || !d.list.length) { if (a && !a.paused) a.pause(); MUS.cur = null; return; }
  const p = filePos(d); const it = d.list[p.i]; const el = musEl();
  el.volume = musVol();
  if (MUS.cur !== it.url) { const src = typeof resolveUrl === 'function' ? resolveUrl(it.url) : it.url; if (!src) { if (!el.paused) el.pause(); return; } MUS.cur = it.url; MUS.err = ''; el.src = src; try { el.currentTime = p.pos; } catch (e) { } }
  if (d.paused || p.ended) { if (!el.paused) el.pause(); return; }
  if (el.readyState >= 1 && Math.abs(el.currentTime - p.pos) > 1.5) { try { el.currentTime = p.pos; } catch (e) { } }
  if (el.paused) { const pr = el.play(); if (pr && pr.catch) pr.then(() => { if (MUS.need) { MUS.need = false; renderSound(); } }).catch(() => { if (!MUS.need) { MUS.need = true; renderSound(); } }); }
}
setInterval(() => { musSync(); if (!$('#soundPop').hidden) renderNow(); }, 1000);
Sound.onChange(() => { if (MUS.el) MUS.el.volume = musVol(); });
document.addEventListener('pointerdown', () => { if (MUS.need) musSync(); }, true);

function applyMusic(d) {
  musicDoc = musNorm(d);
  Sound.setTrack(musicDoc.mode === 'synth' && musicDoc.track ? musicDoc.track : null);
  musSync(); renderSound(); renderLinkCard();
}
function musSave(patch) {
  const d = Object.assign(musNorm(musicDoc), patch);
  delete d.ts; d.ts = Date.now();
  setDoc('gm/music', d); applyMusic(d);
}
// Konumu koruyarak listeyi değiştir
function musKeep(list, curId) {
  const d = musNorm(musicDoc); if (d.mode !== 'file' || !d.list.length) return { list };
  const p = filePos(d); const id = curId || d.list[p.i].id; let ni = list.findIndex(x => x.id === id);
  if (ni < 0) return { list, from: Math.min(p.i, Math.max(0, list.length - 1)), start: Date.now(), pIdx: Math.min(p.i, Math.max(0, list.length - 1)), pPos: 0, mode: list.length ? 'file' : null };
  return d.paused ? { list, pIdx: ni, pPos: p.pos } : { list, from: ni, start: Date.now() - p.pos * 1000 };
}

const MUSIC_ACTS = {
  music: b => { const k = b.dataset.track || null; musSave({ mode: k ? 'synth' : null, track: k }); },
  musPlay: b => { const i = +b.dataset.i; musSave({ mode: 'file', track: null, from: i, start: Date.now(), paused: false }); },
  musPause: () => { const d = musNorm(musicDoc); const p = filePos(d); if (!p) return; musSave({ paused: true, pIdx: p.i, pPos: p.pos }); },
  musResume: () => { const d = musNorm(musicDoc); if (!d.list.length) return; const i = Math.min(+d.pIdx || 0, d.list.length - 1);
    musSave({ mode: 'file', track: null, paused: false, from: i, start: Date.now() - (d.paused ? (+d.pPos || 0) : 0) * 1000 }); },
  musStep: b => { const d = musNorm(musicDoc); const n = d.list.length; if (!n) return; const p = filePos(d) || { i: 0, pos: 0 };
    let i = +b.dataset.dir > 0 ? (p.i + 1) % n : (p.pos > 4 ? p.i : (p.i - 1 + n) % n);
    musSave({ mode: 'file', track: null, from: i, start: Date.now(), paused: false }); },
  musRep: () => { const d = musNorm(musicDoc); const nx = { all: 'one', one: 'none', none: 'all' }[d.rep];
    if (d.mode === 'file' && !d.paused) { const p = filePos(d); musSave({ rep: nx, from: p.i, start: Date.now() - p.pos * 1000 }); } else musSave({ rep: nx }); },
  musDel: b => { const d = musNorm(musicDoc); const i = +b.dataset.i; const it = d.list[i]; if (!it) return;
    const list = d.list.filter((_, k) => k !== i); const playingId = d.mode === 'file' && d.list.length ? d.list[filePos(d).i].id : null;
    musSave(playingId === it.id ? { list, from: Math.min(i, Math.max(0, list.length - 1)), start: Date.now(), pIdx: Math.min(i, Math.max(0, list.length - 1)), pPos: 0, mode: list.length ? 'file' : null } : musKeep(list));
    if (assets && it.aid) { try { (assets.delete || assets.remove).call(assets, it.aid); } catch (e) { } }
    if (!db && it.url && it.url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(it.url), 2000); },
  musUp: () => $('#mp3Input').click(),
  musLink: () => { const inp = $('#linkInput'); const u = inp.value.trim(); const k = linkKind(u);
    if (!k) { toast('Sadece https ile başlayan SoundCloud, YouTube veya Spotify linkleri paylaşılabilir.', 'err'); return; }
    musSave({ link: { url: u, k, ts: Date.now() } }); inp.value = ''; toast(k + ' linki herkese gönderildi.'); },
  musLinkClear: () => musSave({ link: null }),
  linkHide: () => { try { localStorage.setItem('ncm-link-hide', String((musicDoc && musicDoc.link && musicDoc.link.ts) || 0)); } catch (e) { } MUS.hidden = musicDoc && musicDoc.link && musicDoc.link.ts; renderLinkCard(); },
};

document.addEventListener('change', async e => {
  if (e.target.id !== 'mp3Input') return;
  const files = [...e.target.files]; e.target.value = '';
  if (!S.me.isGM || !files.length) return;
  const added = [];
  for (const f of files) {
    const lim = assets && assets.raw ? 15 * 1024 * 1024 : MAX_MP3;
    if (f.size > lim) { toast(f.name + ': ' + Math.round(lim / 1048576) + ' MB sınırını aşıyor.', 'err'); continue; }
    MUS.busy++; renderSound();
    try {
      const buf = await f.arrayBuffer(); let w;
      try { w = mp3ToMp4(buf); } catch (err) { toast(f.name + ': geçerli bir MP3 değil.', 'err'); continue; }
      const n = f.name.replace(/\.mp3$/i, '').slice(0, 80);
      if (assets) {
        const blob = assets.raw ? f : new Blob([w.bytes], { type: 'video/mp4' });
        const up = await assets.upload(blob, assets.raw ? { type: 'audio/mpeg' } : { type: 'video/mp4', name: n + '.mp4' });
        added.push({ id: 'm' + uid(), aid: up.id, url: up.url, n, d: Math.round(w.dur * 10) / 10 });
      } else added.push({ id: 'm' + uid(), url: URL.createObjectURL(f), n, d: Math.round(w.dur * 10) / 10 });
    } catch (err) { console.warn(err); toast(f.name + ' yüklenemedi.', 'err'); }
    finally { MUS.busy--; renderSound(); }
  }
  if (added.length) { const d = musNorm(musicDoc); musSave(musKeep(d.list.concat(added))); toast(added.length + ' parça listeye eklendi.'); }
});

const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function renderNow() {
  const d = musicDoc; const el = $('#musNow'); if (!el) return;
  if (d && d.mode === 'file' && d.list.length) { const p = filePos(d); const it = d.list[p.i];
    el.innerHTML = '<b>' + esc(it.n) + '</b><span>' + (d.paused ? 'Duraklatıldı · ' : p.ended ? 'Liste bitti · ' : '') + fmtT(p.pos) + ' / ' + fmtT(it.d) + '</span><i style="width:' + Math.min(100, p.pos / Math.max(1, it.d) * 100).toFixed(1) + '%"></i>';
    document.querySelectorAll('#plList .pl').forEach((r, k) => r.classList.toggle('on', k === p.i));
  } else if (d && d.mode === 'synth' && d.track && Sound.TRACKS[d.track]) el.innerHTML = '<b>' + esc(Sound.TRACKS[d.track].n) + '</b><span>Sentez parça</span>';
  else el.innerHTML = '<span>Müzik çalmıyor.</span>';
}
function nowLabel() {
  const d = musicDoc; if (Sound.pref.mute) return 'Sessiz';
  if (d && d.mode === 'file' && d.list.length) { const p = filePos(d); return d.paused ? 'Duraklatıldı' : d.list[p.i].n; }
  return Sound.playing ? Sound.TRACKS[Sound.playing].n : 'Ses';
}
function renderSound() {
  const btn = $('#soundBtn'); const pop = $('#soundPop'); if (!btn) return;
  const d = musicDoc || musNorm(null);
  const need = (d.mode === 'synth' && d.track && !Sound.ready()) || (d.mode === 'file' && MUS.need);
  btn.classList.toggle('need', !!need);
  const lab = nowLabel(); btn.querySelector('span').textContent = lab.length > 18 ? lab.slice(0, 17) + '…' : lab;
  $('#unlockChip').hidden = !need;
  if (pop.hidden) return;
  const gm = S.me.isGM, cur = d.mode === 'synth' ? d.track : null;
  $('#trackList').innerHTML = Object.entries(Sound.TRACKS).map(([k, t]) => '<button class="trk' + (cur === k ? ' on' : '') + '" data-act="music" data-track="' + k + '"' + (gm ? '' : ' disabled') + '><b>' + esc(t.n) + '</b><small>' + esc(t.d) + '</small></button>').join('') + (gm ? '<button class="trk stop" data-act="music"><b>Durdur</b><small>Sessizlik</small></button>' : '');
  const p = d.mode === 'file' && d.list.length ? filePos(d) : null;
  $('#plList').innerHTML = d.list.length ? d.list.map((x, i) => '<div class="pl' + (p && p.i === i ? ' on' : '') + '">' + (gm ? '<button class="pl-n" data-act="musPlay" data-i="' + i + '" title="Bu parçayı herkese çal">' : '<span class="pl-n">') + '<b>' + esc(x.n) + '</b><small>' + fmtT(x.d) + '</small>' + (gm ? '</button><button class="pl-x" data-act="musDel" data-i="' + i + '" aria-label="' + esc(x.n) + ' parçasını kaldır" title="Listeden kaldır">×</button>' : '</span>') + '</div>').join('') : '<p class="hint">' + (gm ? 'Henüz MP3 yok. Yüklediğin parçalar masadaki herkeste aynı anda çalar.' : 'GM henüz MP3 eklemedi.') + '</p>';
  const playing = d.mode === 'file' && !d.paused && p && !p.ended;
  $('#plCtrl').hidden = !gm || !d.list.length;
  $('#plCtrl').innerHTML = '<button class="tool" data-act="musStep" data-dir="-1" aria-label="Önceki parça" title="Önceki">⏮</button>' + (playing ? '<button class="tool" data-act="musPause" aria-label="Duraklat" title="Duraklat">❚❚</button>' : '<button class="tool" data-act="musResume" aria-label="Çal" title="Çal">▶</button>') + '<button class="tool" data-act="musStep" data-dir="1" aria-label="Sonraki parça" title="Sonraki">⏭</button><button class="tool rep" data-act="musRep" title="Tekrar modu">' + ({ all: 'Listeyi tekrarla', one: 'Parçayı tekrarla', none: 'Tekrar yok' })[d.rep] + '</button>';
  $('#plUp').hidden = !gm; $('#plUp').textContent = MUS.busy ? 'Yükleniyor… (' + MUS.busy + ')' : 'MP3 ekle'; $('#plUp').disabled = !!MUS.busy;
  $('#linkRow').hidden = !gm;
  $('#linkCur').innerHTML = d.link && d.link.url ? '<a href="' + esc(d.link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.link.k || 'Link') + ' · yeni sekmede aç</a>' + (gm ? ' <button class="linkx" data-act="musLinkClear">Kaldır</button>' : '') : '';
  $('#musVol').value = Sound.pref.mus; $('#sfxVol').value = Sound.pref.sfx; $('#muteAll').checked = Sound.pref.mute;
  $('#soundNote').textContent = gm ? 'Çaldığın her şey masadaki herkeste senkron çalar; ses seviyesi kişiseldir. Linkler senkron çalmaz, herkesin ekranında yeni sekmede açılacak bir kart olarak görünür.' : (MUS.err || 'Müziği GM yönetir. Ses seviyesi sana özel.');
  renderNow();
}
function renderLinkCard() {
  const el = $('#linkCard'); if (!el) return; const L = musicDoc && musicDoc.link;
  let hid = MUS.hidden; if (hid == null) { try { hid = +localStorage.getItem('ncm-link-hide') || 0; } catch (e) { hid = 0; } MUS.hidden = hid; }
  if (!L || !L.url || L.ts <= hid) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = '<span class="lc-k">GM bir ' + esc(L.k || 'müzik') + ' linki paylaştı</span><a class="btn primary" href="' + esc(L.url) + '" target="_blank" rel="noopener noreferrer">Yeni sekmede aç</a><button class="lc-x" data-act="linkHide" aria-label="Kartı kapat">×</button><small>Tarayıcı kısıtlaması nedeniyle bu sayfanın içinde çalamaz.</small>';
}
document.addEventListener('input', e => { if (e.target.id === 'musVol') Sound.set('mus', +e.target.value); if (e.target.id === 'sfxVol') Sound.set('sfx', +e.target.value); });
document.addEventListener('change', e => { if (e.target.id === 'muteAll') Sound.set('mute', e.target.checked); });
document.addEventListener('keydown', e => { if (e.target.id === 'linkInput' && e.key === 'Enter') { e.preventDefault(); MUSIC_ACTS.musLink(); } });
Sound.onChange(renderSound);
