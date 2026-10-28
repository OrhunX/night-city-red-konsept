// ===== MP3 → MP4 kapsayıcısı (yeniden kodlama yok; MP3 kareleri olduğu gibi taşınır) =====
function mp3ToMp4(buf) {
  const u8 = new Uint8Array(buf); let p = 0;
  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) p = 10 + ((u8[6] & 127) << 21 | (u8[7] & 127) << 14 | (u8[8] & 127) << 7 | (u8[9] & 127)) + ((u8[5] & 0x10) ? 10 : 0);
  const BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  const frames = []; let sr = 0, spf = 0, ch = 2, ver = 3, maxBr = 0, guard = 0;
  while (p + 4 <= u8.length) {
    if (u8[p] !== 0xFF || (u8[p + 1] & 0xE0) !== 0xE0) { if (frames.length && u8[p] === 0x54 && u8[p + 1] === 0x41 && u8[p + 2] === 0x47) break; p++; if (++guard > 200000 && !frames.length) break; continue; }
    const v = (u8[p + 1] >> 3) & 3, layer = (u8[p + 1] >> 1) & 3, bri = u8[p + 2] >> 4, sri = (u8[p + 2] >> 2) & 3, pad = (u8[p + 2] >> 1) & 1, mode = u8[p + 3] >> 6;
    if (v === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { p++; continue; }
    const br = (v === 3 ? BR1 : BR2)[bri] * 1000, s = SR[v][sri];
    const len = v === 3 ? Math.floor(144 * br / s) + pad : Math.floor(72 * br / s) + pad;
    if (len < 4 || p + len > u8.length) break;
    if (!frames.length) { sr = s; spf = v === 3 ? 1152 : 576; ch = mode === 3 ? 1 : 2; ver = v; }
    else if (s !== sr) { p++; continue; }
    frames.push([p, len]); maxBr = Math.max(maxBr, br); p += len;
  }
  if (frames.length < 2) throw new Error('mp3');
  const n = frames.length, dur = n * spf;
  const dataLen = frames.reduce((a, f) => a + f[1], 0);
  // kutu yardımcıları
  const enc = s => [...s].map(c => c.charCodeAt(0));
  const u32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255], u16 = v => [(v >> 8) & 255, v & 255], u24 = v => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const box = (type, ...parts) => { const body = [].concat(...parts); return u32(8 + body.length).concat(enc(type), body); };
  const full = (type, vf, ...parts) => box(type, u32(vf), ...parts);
  const desc = (tag, body) => [tag, 0x80, 0x80, 0x80, body.length].concat(body);
  const matrix = [].concat(u32(0x10000), u32(0), u32(0), u32(0), u32(0x10000), u32(0), u32(0), u32(0), u32(0x40000000));
  const ftyp = box('ftyp', enc('isom'), u32(512), enc('isom'), enc('iso2'), enc('mp41'));
  const build = off => {
    const esds = full('esds', 0, desc(3, [].concat(u16(1), [0], desc(4, [].concat([ver === 3 ? 0x6B : 0x69, 0x15], u24(4096), u32(maxBr), u32(maxBr))), desc(6, [2]))));
    const mp4a = box('mp4a', [0, 0, 0, 0, 0, 0], u16(1), u32(0), u32(0), u16(ch), u16(16), u16(0), u16(0), u32(sr * 65536 >>> 0), esds);
    const stsz = full('stsz', 0, u32(0), u32(n), [].concat(...frames.map(f => u32(f[1]))));
    const stbl = box('stbl', full('stsd', 0, u32(1), mp4a), full('stts', 0, u32(1), u32(n), u32(spf)), full('stsc', 0, u32(1), u32(1), u32(n), u32(1)), stsz, full('stco', 0, u32(1), u32(off)));
    const minf = box('minf', full('smhd', 0, u16(0), u16(0)), box('dinf', full('dref', 0, u32(1), full('url ', 1))), stbl);
    const mdia = box('mdia', full('mdhd', 0, u32(0), u32(0), u32(sr), u32(dur), u16(0x55c4), u16(0)), full('hdlr', 0, u32(0), enc('soun'), u32(0), u32(0), u32(0), enc('SoundHandler'), [0]), minf);
    const trak = box('trak', full('tkhd', 3, u32(0), u32(0), u32(1), u32(0), u32(dur), u32(0), u32(0), u16(0), u16(0), u16(0x100), u16(0), matrix, u32(0), u32(0)), mdia);
    return box('moov', full('mvhd', 0, u32(0), u32(0), u32(sr), u32(dur), u32(0x10000), u16(0x100), u16(0), u32(0), u32(0), matrix, u32(0), u32(0), u32(0), u32(0), u32(0), u32(0), u32(2)), trak);
  };
  let moov = build(0); const off = ftyp.length + moov.length + 8; moov = build(off);
  const out = new Uint8Array(off + dataLen);
  out.set(ftyp, 0); out.set(moov, ftyp.length);
  out.set(u32(8 + dataLen), ftyp.length + moov.length); out.set(enc('mdat'), ftyp.length + moov.length + 4);
  let q = off; frames.forEach(([fp, fl]) => { out.set(u8.subarray(fp, fp + fl), q); q += fl; });
  return { bytes: out, dur: dur / sr };
}
if (typeof module !== 'undefined') module.exports = { mp3ToMp4 };
