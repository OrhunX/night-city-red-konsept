// ===== OYUN VERİLERİ =====
const STATS = ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP'];
const STAT_TR = { INT: 'Zekâ', REF: 'Refleks', DEX: 'Çeviklik', TECH: 'Teknik', COOL: 'Soğukkanlılık', WILL: 'İrade', LUCK: 'Şans', MOVE: 'Hareket', BODY: 'Beden', EMP: 'Empati' };

const ROLES = [
  { k: 'Solo', a: 'Combat Awareness', t: 'Kiralık kas: koruma, suikast, savaş.', st: ['REF', 'DEX', 'BODY', 'COOL'], sk: ['Handgun', 'Shoulder Arms', 'Autofire', 'Melee Weapon', 'Evasion', 'Athletics', 'Perception', 'Tactics', 'Resist Torture/Drugs', 'Interrogation'], w: ['Ağır tabanca', 'Saldırı tüfeği'], ar: 'Hafif Armorjack' },
  { k: 'Netrunner', a: 'Interface', t: 'NET mimarilerine dalan sibernetik hacker.', st: ['INT', 'TECH', 'REF', 'COOL'], sk: ['Electronics/Security Tech', 'Cryptography', 'Basic Tech', 'Library Search', 'Conceal/Reveal Object', 'Handgun', 'Evasion', 'Stealth'], w: ['Orta tabanca'], ar: 'Bodyweight suit' },
  { k: 'Tech', a: 'Maker', t: 'Tamirci, mucit, hurda dahisi.', st: ['TECH', 'INT', 'DEX', 'REF'], sk: ['Basic Tech', 'Weaponstech', 'Electronics/Security Tech', 'Cybertech', 'Land Vehicle Tech', 'Science', 'Handgun', 'Shoulder Arms'], w: ['Pompalı tüfek'], ar: 'Hafif Armorjack' },
  { k: 'Medtech', a: 'Medicine', t: 'Sokak cerrahı; hayat kurtarır, bedel ister.', st: ['TECH', 'INT', 'EMP', 'COOL'], sk: ['Paramedic', 'First Aid', 'Cybertech', 'Science', 'Human Perception', 'Deduction', 'Handgun', 'Resist Torture/Drugs'], w: ['Orta tabanca'], ar: 'Hafif Armorjack' },
  { k: 'Rockerboy', a: 'Charismatic Impact', t: 'Kalabalığı sahneyle yöneten asi sanatçı.', st: ['COOL', 'EMP', 'WILL', 'REF'], sk: ['Play Instrument', 'Composition', 'Persuasion', 'Wardrobe & Style', 'Streetwise', 'Brawling', 'Handgun', 'Personal Grooming'], w: ['Çok ağır tabanca'], ar: 'Deri' },
  { k: 'Media', a: 'Credibility', t: 'Gerçeği gün yüzüne çıkaran gazeteci.', st: ['INT', 'EMP', 'COOL', 'REF'], sk: ['Persuasion', 'Deduction', 'Library Search', 'Photography/Film', 'Composition', 'Human Perception', 'Lip Reading', 'Handgun'], w: ['Orta tabanca'], ar: 'Kevlar' },
  { k: 'Exec', a: 'Teamwork', t: 'Kendi ekibi olan kurumsal yönetici.', st: ['INT', 'COOL', 'EMP', 'WILL'], sk: ['Business', 'Bureaucracy', 'Persuasion', 'Accounting', 'Wardrobe & Style', 'Personal Grooming', 'Lip Reading', 'Handgun'], w: ['Ağır tabanca'], ar: 'Bodyweight suit' },
  { k: 'Lawman', a: 'Backup', t: 'Kanun adamı; çağırınca destek gelir.', st: ['REF', 'WILL', 'BODY', 'INT'], sk: ['Handgun', 'Shoulder Arms', 'Criminology', 'Interrogation', 'Tracking', 'Drive Land Vehicle', 'Autofire', 'Deduction'], w: ['Ağır tabanca', 'Pompalı tüfek'], ar: 'Hafif Armorjack' },
  { k: 'Fixer', a: 'Operator', t: 'Aracı, satıcı, bağlantıların efendisi.', st: ['COOL', 'INT', 'EMP', 'LUCK'], sk: ['Trading', 'Streetwise', 'Bribery', 'Business', 'Persuasion', 'Forgery', 'Handgun', 'Human Perception'], w: ['Ağır tabanca'], ar: 'Kevlar' },
  { k: 'Nomad', a: 'Moto', t: 'Yolların klanından, araç ustası.', st: ['REF', 'BODY', 'TECH', 'DEX'], sk: ['Drive Land Vehicle', 'Land Vehicle Tech', 'Wilderness Survival', 'Animal Handling', 'Shoulder Arms', 'Melee Weapon', 'Tracking', 'Brawling'], w: ['Pompalı tüfek', 'Orta yakın dövüş silahı'], ar: 'Hafif Armorjack' },
];
const ROLE = Object.fromEntries(ROLES.map(r => [r.k, r]));

// [ad, stat, x2 maliyet, kategori]
const SKILLS = [
  ['Concentration', 'WILL', 0, 'Farkındalık'], ['Conceal/Reveal Object', 'INT', 0, 'Farkındalık'], ['Lip Reading', 'INT', 0, 'Farkındalık'], ['Perception', 'INT', 0, 'Farkındalık'], ['Tracking', 'INT', 0, 'Farkındalık'],
  ['Athletics', 'DEX', 0, 'Beden'], ['Contortionist', 'DEX', 0, 'Beden'], ['Dance', 'DEX', 0, 'Beden'], ['Endurance', 'WILL', 0, 'Beden'], ['Resist Torture/Drugs', 'WILL', 0, 'Beden'], ['Stealth', 'DEX', 0, 'Beden'],
  ['Drive Land Vehicle', 'REF', 0, 'Kontrol'], ['Pilot Air Vehicle', 'REF', 1, 'Kontrol'], ['Pilot Sea Vehicle', 'REF', 0, 'Kontrol'], ['Riding', 'REF', 0, 'Kontrol'],
  ['Accounting', 'INT', 0, 'Eğitim'], ['Animal Handling', 'INT', 0, 'Eğitim'], ['Bureaucracy', 'INT', 0, 'Eğitim'], ['Business', 'INT', 0, 'Eğitim'], ['Composition', 'INT', 0, 'Eğitim'], ['Criminology', 'INT', 0, 'Eğitim'], ['Cryptography', 'INT', 0, 'Eğitim'], ['Deduction', 'INT', 0, 'Eğitim'], ['Education', 'INT', 0, 'Eğitim'], ['Gamble', 'INT', 0, 'Eğitim'], ['Language (Streetslang)', 'INT', 0, 'Eğitim'], ['Language (Ana dil)', 'INT', 0, 'Eğitim'], ['Library Search', 'INT', 0, 'Eğitim'], ['Local Expert', 'INT', 0, 'Eğitim'], ['Science', 'INT', 0, 'Eğitim'], ['Tactics', 'INT', 0, 'Eğitim'], ['Wilderness Survival', 'INT', 0, 'Eğitim'],
  ['Brawling', 'DEX', 0, 'Dövüş'], ['Evasion', 'DEX', 0, 'Dövüş'], ['Martial Arts', 'DEX', 1, 'Dövüş'], ['Melee Weapon', 'DEX', 0, 'Dövüş'],
  ['Acting', 'COOL', 0, 'Performans'], ['Play Instrument', 'TECH', 0, 'Performans'],
  ['Archery', 'REF', 0, 'Menzilli'], ['Autofire', 'REF', 1, 'Menzilli'], ['Handgun', 'REF', 0, 'Menzilli'], ['Heavy Weapons', 'REF', 1, 'Menzilli'], ['Shoulder Arms', 'REF', 0, 'Menzilli'],
  ['Bribery', 'COOL', 0, 'Sosyal'], ['Conversation', 'EMP', 0, 'Sosyal'], ['Human Perception', 'EMP', 0, 'Sosyal'], ['Interrogation', 'COOL', 0, 'Sosyal'], ['Persuasion', 'COOL', 0, 'Sosyal'], ['Personal Grooming', 'COOL', 0, 'Sosyal'], ['Streetwise', 'COOL', 0, 'Sosyal'], ['Trading', 'COOL', 0, 'Sosyal'], ['Wardrobe & Style', 'COOL', 0, 'Sosyal'],
  ['Air Vehicle Tech', 'TECH', 0, 'Teknik'], ['Basic Tech', 'TECH', 0, 'Teknik'], ['Cybertech', 'TECH', 0, 'Teknik'], ['Demolitions', 'TECH', 1, 'Teknik'], ['Electronics/Security Tech', 'TECH', 1, 'Teknik'], ['First Aid', 'TECH', 0, 'Teknik'], ['Forgery', 'TECH', 0, 'Teknik'], ['Land Vehicle Tech', 'TECH', 0, 'Teknik'], ['Paint/Draw/Sculpt', 'TECH', 0, 'Teknik'], ['Paramedic', 'TECH', 1, 'Teknik'], ['Photography/Film', 'TECH', 0, 'Teknik'], ['Pick Lock', 'TECH', 0, 'Teknik'], ['Pick Pocket', 'TECH', 0, 'Teknik'], ['Surgery', 'TECH', 0, 'Teknik'], ['Sea Vehicle Tech', 'TECH', 0, 'Teknik'], ['Weaponstech', 'TECH', 0, 'Teknik'],
];
const SKILL = Object.fromEntries(SKILLS.map(s => [s[0], { stat: s[1], x2: !!s[2], cat: s[3] }]));
const BASIC = ['Athletics', 'Brawling', 'Concentration', 'Conversation', 'Education', 'Evasion', 'First Aid', 'Human Perception', 'Language (Streetslang)', 'Local Expert', 'Perception', 'Persuasion', 'Stealth'];

// [ad, hasar, beceri, menzil sınıfı, ROF, otomatik atış çarpanı]
const WEAPONS = [
  ['Orta tabanca', '2d6', 'Handgun', 'pistol', 2, 0], ['Ağır tabanca', '3d6', 'Handgun', 'pistol', 2, 0], ['Çok ağır tabanca', '4d6', 'Handgun', 'pistol', 1, 0],
  ['SMG', '2d6', 'Handgun', 'smg', 1, 3], ['Ağır SMG', '3d6', 'Handgun', 'smg', 1, 3],
  ['Pompalı tüfek', '5d6', 'Shoulder Arms', 'shotgun', 1, 0], ['Saldırı tüfeği', '5d6', 'Shoulder Arms', 'ar', 1, 4], ['Keskin nişancı tüfeği', '5d6', 'Shoulder Arms', 'sniper', 1, 0],
  ['Yay / arbalet', '4d6', 'Archery', 'bow', 1, 0], ['Bombaatar', '6d6', 'Heavy Weapons', 'gl', 1, 0], ['Roketatar', '8d6', 'Heavy Weapons', 'rocket', 1, 0],
  ['Hafif yakın dövüş silahı', '1d6', 'Melee Weapon', 'melee', 2, 0], ['Orta yakın dövüş silahı', '2d6', 'Melee Weapon', 'melee', 2, 0], ['Ağır yakın dövüş silahı', '3d6', 'Melee Weapon', 'melee', 2, 0], ['Çok ağır yakın dövüş silahı', '4d6', 'Melee Weapon', 'melee', 1, 0],
];
const WEAPON = Object.fromEntries(WEAPONS.map(w => [w[0], { d: w[1], sk: w[2], cls: w[3], rof: w[4], af: w[5] }]));
const WCLS = { pistol: 'Tabanca', smg: 'SMG', shotgun: 'Pompalı (tek kurşun)', ar: 'Saldırı tüfeği', sniper: 'Keskin nişancı', bow: 'Yay / arbalet', gl: 'Bombaatar', rocket: 'Roketatar', melee: 'Yakın dövüş' };
// [ad, SP, REF/DEX/MOVE cezası]
const ARMORS = [['Yok', 0, 0], ['Deri', 4, 0], ['Kevlar', 7, 0], ['Hafif Armorjack', 11, 0], ['Bodyweight suit', 11, 0], ['Orta Armorjack', 12, 2], ['Ağır Armorjack', 13, 2], ['Flak', 15, 4], ['Metalgear', 18, 4]];
const ARMOR = Object.fromEntries(ARMORS.map(a => [a[0], a[1]]));
const ARMOR_PEN = Object.fromEntries(ARMORS.map(a => [a[0], a[2]]));
// menzil bantları (m) ve DV tabloları
const BANDS = [6, 12, 25, 50, 100, 200, 400, 800];
const BAND_TXT = ['0–6 m', '7–12 m', '13–25 m', '26–50 m', '51–100 m', '101–200 m', '201–400 m', '401–800 m'];
const RANGE_DV = {
  pistol: [13, 15, 20, 25, 30, 30, null, null], smg: [15, 13, 15, 20, 25, 25, 30, null], shotgun: [13, 15, 20, 25, 30, 35, null, null],
  ar: [17, 16, 15, 13, 15, 20, 25, 30], sniper: [30, 25, 25, 20, 15, 16, 17, 20], bow: [15, 13, 15, 17, 20, 22, null, null],
  gl: [16, 15, 15, 17, 20, 22, 25, null], rocket: [17, 16, 15, 15, 20, 20, 25, 30],
};
const AF_DV = { smg: [20, 17, 20, 25, 30], ar: [22, 20, 17, 20, 25] };
const DVS = [['Basit', 9], ['Gündelik', 13], ['Zor', 15], ['Profesyonel', 17], ['Kahramanca', 21], ['İnanılmaz', 24], ['Efsanevi', 29]];
const brawlDice = (body, cyberarm) => body >= 11 ? '4d6' : body >= 7 ? '3d6' : (body >= 5 || cyberarm) ? '2d6' : '1d6';
// harita karolarının siper değerleri
const COVER = { '#': 'Kalın beton · 25 HP', 'K': 'İnce çelik · 25 HP', 'V': 'İnce çelik · 25 HP', 'B': 'Kalın beton · 25 HP', 'L': 'İnce çelik · 25 HP', 'T': 'Kalın beton · 25 HP', 'C': 'İnce ahşap · 5 HP', 'D': 'İnce ahşap · 5 HP' };

const LIFE = {
  koken: { n: 'Kültürel köken', v: ['Kuzey Amerika', 'Güney / Orta Amerika', 'Batı Avrupa', 'Doğu Avrupa', 'Orta Doğu / Kuzey Afrika', 'Sahra Altı Afrika', 'Güney Asya', 'Güneydoğu Asya', 'Doğu Asya', 'Okyanusya / Pasifik'] },
  kisilik: { n: 'Kişilik', v: ['Utangaç ve ketum', 'Asi, kavgaya hazır', 'Kibirli, mesafeli', 'Huysuz, aceleci', 'Titiz, gergin', 'Ciddi ve istikrarlı', 'Sevimli bir şapşal', 'Sinsi ve aldatıcı', 'Entelektüel, kopuk', 'Dışa dönük, cana yakın'] },
  giyim: { n: 'Giyim tarzı', v: ['Generic Chic', 'Leisurewear', 'Urban Flash', 'Businesswear', 'High Fashion', 'Bohemian', 'Bag Lady Chic', 'Gang Colors', 'Nomad Leathers', 'Asia Pop'] },
  sac: { n: 'Saç', v: ['Mohawk', 'Uzun, dağınık', 'Kısa, dikenli', 'Darmadağın', 'Kazınmış', 'Desenli kazıma', 'Neon renkli', 'Kısa ve düzgün', 'Kısa, kıvırcık', 'Uzun ve düz'] },
  isaret: { n: 'Ayırt edici', v: ['Dövmeler', 'Ayna gözlük', 'Ritüel yara izleri', 'Çivili eldiven', 'Burun halkası', 'Dil piercing', 'Garip implant tırnaklar', 'Çivili botlar', 'Parmaksız eldiven', 'Tuhaf renkli lens'] },
  deger: { n: 'En çok değer verdiği', v: ['Para', 'Onur', 'Verdiği söz', 'Dürüstlük', 'Bilgi', 'İntikam', 'Aşk', 'Güç', 'Aile', 'Arkadaşlık'] },
  insan: { n: 'İnsanlara bakışı', v: ['Herkes kullanılacak bir araç', 'Herkes değerlidir', 'İnsanlar engeldir', 'Kimseye güvenme', 'Yok et, yok edilmeden', 'İnsanlar harika', 'Kimseyi sevmez ama korur'] },
  aile: { n: 'Aile geçmişi', v: ['Kurumsal yöneticiler; rahat ama soğuk', 'Ezilmiş kurum çalışanları', 'Nomad konvoyu', 'Yüksek katlı sitede orta sınıf', 'Çete bölgesinde büyüdü', 'Sokak çocuğu, ailesi yok', 'Combat Zone\'da hayatta kalanlar', 'Borç içinde fabrika işçileri', 'Geleneklerine bağlı göçmen ailesi', 'Eski bir medya hanedanı'] },
  kriz: { n: 'Aile krizi', v: ['Bir kurum aileyi yok etti', 'Aile borç batağında', 'Aile içi ihanet ve bölünme', 'Aile şehirden sürgün edildi', 'Bir aile üyesi kayıp', 'Bir çeteyle kan davası', 'Servet bir gecede kayboldu', 'Ailenin sırrı tehlikede', 'Kriz yok; şimdilik', 'Ailesi öldürüldü, tek hayatta kalan o'] },
  hedef: { n: 'Hayat hedefi', v: ['Kendisine zarar verenlerden intikam', 'Ünlü olmak', 'Kurumların çöküşünü görmek', 'Ailesini korumak', 'Zengin olmak', 'Kayıp birini bulmak', 'Bir ideal uğruna yaşamak', 'Huzurlu bir yere kaçmak', 'Bir sırrı ortaya çıkarmak', 'Saygınlık kazanmak'] },
  arkadas: { n: 'Bir arkadaşı', v: ['Çocukluk arkadaşı', 'Akıl hocası', 'Eski iş ortağı', 'Kardeş gibi bir sokak tanıdığı', 'Barışılmış eski düşman', 'Onu borçtan kurtaran biri', 'Yok'] },
  dusman: { n: 'Bir düşmanı', v: ['Eski arkadaş; ihanet etti', 'Kurumsal tetikçi', 'Çete lideri; kan davası', 'Eski sevgili', 'NCPD dedektifi', 'Rakip bir edgerunner', 'Yok'] },
};

const HANDLES = ['Vex', 'Kuzgun', 'Neon', 'Razor', 'Sıfır', 'Kıvılcım', 'Ghost', 'Pinhead', 'Mira', 'Tank', 'Spike', 'Glitch', 'Bora', 'Volt', 'Jinx', 'Echo', 'Kobra', 'Static', 'Haze', 'Torch', 'Karakedi', 'Rust', 'Ayaz', 'Dread', 'Silk', 'Pixel', 'Brick', 'Saber', 'Fuse', 'Zephyr', 'Nokta', 'Krom', 'Byte', 'Sis'];
const FIRST = ['Alex', 'Mina', 'Kenji', 'Lucía', 'Dmitri', 'Aylin', 'Jonah', 'Priya', 'Mateo', 'Yuki', 'Ezra', 'Leyla', 'Rafael', 'Nadia', 'Kofi', 'Selin', 'Viktor', 'Mei', 'Omar', 'Zara', 'Arda', 'Ines', 'Tomasz', 'Hana', 'Diego', 'Elif', 'Marcus', 'Sasha', 'Kaan', 'Noor'];
const LAST = ['Reyes', 'Tanaka', 'Volkov', 'Okafor', 'Demir', 'Novak', 'Castillo', 'Chen', 'Kowalski', 'Haddad', 'Mbeki', 'Yılmaz', 'Sørensen', 'Park', 'Moreau', 'Kaya', 'Silva', 'Ivanova', 'Nakamura', 'Petrov', 'Aksoy', 'Lindqvist', 'Ramos', 'Hoshino'];
const QUIRKS = ['Sürekli sakız çiğniyor', 'Optik implantı titriyor', 'Eski bir rock şarkısı mırıldanıyor', 'Herkese "çiko" diye hitap ediyor', 'Boynunda kurum logosu dövmesi', 'Paranoyak; sürekli arkasını kollar', 'Ürkütücü derecede kibar', 'Elinde hep bir buhar çubuğu', 'Konuşurken gözünü kırpmıyor', 'Sesi sentezleyiciden çıkıyor', 'Kolunda yarı sökülmüş bir cyberarm', 'Her cümleyi bir fiyatla bitiriyor', 'Gülüşü krom dişlerle parlıyor', 'Bir an bile susmuyor'];

const ARCHES = {
  gang:   { n: 'Boostergang üyesi', st: ['REF', 'BODY', 'DEX'], sk: ['Brawling', 'Melee Weapon', 'Handgun', 'Evasion', 'Athletics', 'Autofire'], w: ['Orta yakın dövüş silahı', 'SMG'], ar: 'Deri', cy: ['Cyberarm', 'Wolvers'] },
  corp:   { n: 'Kurum güvenliği', st: ['REF', 'BODY', 'WILL'], sk: ['Handgun', 'Shoulder Arms', 'Autofire', 'Perception', 'Evasion', 'Tactics'], w: ['Saldırı tüfeği', 'Ağır tabanca'], ar: 'Orta Armorjack', cy: ['Cybereye', 'Neural Link'] },
  ncpd:   { n: 'NCPD memuru', st: ['REF', 'WILL', 'BODY'], sk: ['Handgun', 'Shoulder Arms', 'Criminology', 'Interrogation', 'Drive Land Vehicle', 'Perception'], w: ['Ağır tabanca', 'Pompalı tüfek'], ar: 'Hafif Armorjack', cy: ['Cyberaudio'] },
  runner: { n: 'Netrunner', st: ['INT', 'TECH', 'REF'], sk: ['Electronics/Security Tech', 'Cryptography', 'Basic Tech', 'Stealth', 'Handgun', 'Evasion'], w: ['Orta tabanca'], ar: 'Bodyweight suit', cy: ['Neural Link', 'Interface Plugs'] },
  solo:   { n: 'Paralı asker', st: ['REF', 'DEX', 'BODY'], sk: ['Handgun', 'Shoulder Arms', 'Autofire', 'Melee Weapon', 'Evasion', 'Tactics'], w: ['Saldırı tüfeği', 'Ağır yakın dövüş silahı'], ar: 'Ağır Armorjack', cy: ['Cyberarm', 'Kerenzikov'] },
  fixer:  { n: 'Fixer', st: ['COOL', 'INT', 'EMP'], sk: ['Trading', 'Streetwise', 'Bribery', 'Persuasion', 'Handgun', 'Human Perception'], w: ['Ağır tabanca'], ar: 'Kevlar', cy: ['Cybereye'] },
  ripper: { n: 'Ripperdoc', st: ['TECH', 'INT', 'EMP'], sk: ['Cybertech', 'Paramedic', 'First Aid', 'Science', 'Handgun', 'Human Perception'], w: ['Orta tabanca'], ar: 'Kevlar', cy: ['Cyberhand (alet seti)'] },
  bar:    { n: 'Barmen', st: ['COOL', 'EMP', 'BODY'], sk: ['Conversation', 'Human Perception', 'Streetwise', 'Brawling', 'Shoulder Arms', 'Trading'], w: ['Pompalı tüfek'], ar: 'Yok', cy: [] },
  nomad:  { n: 'Nomad akıncı', st: ['REF', 'BODY', 'TECH'], sk: ['Drive Land Vehicle', 'Shoulder Arms', 'Melee Weapon', 'Land Vehicle Tech', 'Tracking', 'Brawling'], w: ['Pompalı tüfek', 'Orta yakın dövüş silahı'], ar: 'Hafif Armorjack', cy: ['Cybereye'] },
  sivil:  { n: 'Sivil', st: ['EMP', 'INT', 'COOL'], sk: ['Conversation', 'Local Expert', 'Perception', 'Athletics', 'Evasion', 'Persuasion'], w: [], ar: 'Yok', cy: [] },
  psycho: { n: 'Siberpsikopat', st: ['REF', 'BODY', 'DEX'], sk: ['Melee Weapon', 'Autofire', 'Handgun', 'Brawling', 'Evasion', 'Athletics'], w: ['Ağır SMG', 'Çok ağır yakın dövüş silahı'], ar: 'Metalgear', cy: ['Cyberarm', 'Mantis Blades', 'Sandevistan', 'Subdermal Armor'] },
};
const TIERS = {
  mook: { n: 'Sıradan', s: [3, 6], k: [2, 4], arUp: 0 },
  vet:  { n: 'Tecrübeli', s: [4, 7], k: [4, 6], arUp: 0 },
  elite:{ n: 'Elit', s: [5, 8], k: [5, 7], arUp: 1 },
  boss: { n: 'Boss', s: [6, 9], k: [6, 8], arUp: 2 },
};
