(() => {
  'use strict';

  const AUTH = window.LIFEQUEST_AUTH;
  const STORAGE_KEY = 'lifequest.secureState.v1';
  const stateEncoder = new TextEncoder();
  const stateDecoder = new TextDecoder();

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const categoryMeta = {
    learning: { label: 'Öğrenme', icon: '📘', skill: 'knowledge' },
    focus: { label: 'İş ve odak', icon: '🎯', skill: 'focus' },
    health: { label: 'Sağlık', icon: '🌿', skill: 'vitality' },
    social: { label: 'Sosyal yaşam', icon: '🤝', skill: 'social' }
  };

  const difficultyMeta = {
    easy: { label: 'Kolay', xp: 10, coins: 7 },
    medium: { label: 'Orta', xp: 20, coins: 14 },
    hard: { label: 'Zor', xp: 35, coins: 25 }
  };

  const avatars = ['🧭', '🧙', '🦸', '🥷', '👩‍🚀', '🧑‍🔬', '🧑‍🎨', '🧑‍💻', '🧑‍🏫', '🧚'];

  const buildings = {
    library: { name: 'Bilgelik Kütüphanesi', icon: '🏛️', description: 'Öğrenme görevlerinden gelen ilerlemeyi temsil eder.', effect: 'Bilgi ve öğrenme merkezi' },
    studio: { name: 'Odak Atölyesi', icon: '🏭', description: 'Odak oturumlarıyla büyüyen üretim alanın.', effect: 'Odak ve üretkenlik merkezi' },
    garden: { name: 'Yaşam Bahçesi', icon: '🌳', description: 'Sağlık ve sosyal yaşam adımlarının şehirdeki karşılığı.', effect: 'Denge ve enerji merkezi' }
  };


  const personas = {
    sage: {
      name: 'Bilge', icon: '🧙', city: 'Bilge Şehri', theme: 'sage',
      description: 'Bilginin taş sokaklarda ışığa dönüştüğü şehir.', bonus: 'Öğrenme görevlerinde +%10 XP',
      requirement: state => state.skills.knowledge.level >= 1,
      requirementText: 'Başlangıç kişiliği',
      decor: ['📚', '✨', '🔭'], buildings: ['Büyük Arşiv', 'Yıldız Akademisi', 'Bilgelik Bahçesi']
    },
    explorer: {
      name: 'Kaşif', icon: '🧭', city: 'Ufuk Limanı', theme: 'explorer',
      description: 'Haritaların, geçitlerin ve bilinmeyen yolların şehri.', bonus: 'Yeni görevlerden +3 altın',
      requirement: state => state.profile.level >= 3,
      requirementText: 'Karakter seviyesi 3',
      decor: ['⛵', '🗺️', '🏕️'], buildings: ['Keşif Limanı', 'Harita Kulesi', 'Vadi Kampı']
    },
    architect: {
      name: 'Mimar', icon: '🏗️', city: 'Taş ve Işık Kenti', theme: 'architect',
      description: 'Planların gerçek yapılara dönüştüğü üretim şehri.', bonus: 'Bina yükseltme maliyetinde %10 indirim',
      requirement: state => Object.values(state.town).reduce((a,b)=>a+b,0) >= 6,
      requirementText: 'Toplam şehir seviyesi 6',
      decor: ['📐', '🧱', '⚙️'], buildings: ['Tasarım Sarayı', 'Usta Atölyesi', 'Kristal Meydan']
    },
    focusmaster: {
      name: 'Odak Ustası', icon: '🎯', city: 'Sessizlik Kulesi', theme: 'focusmaster',
      description: 'Zamanın yavaşladığı, dikkatin keskinleştiği sakin dünya.', bonus: 'Odak oturumlarında +%15 XP',
      requirement: state => state.skills.focus.level >= 3,
      requirementText: 'Odak Ustalığı seviye 3',
      decor: ['⏳', '🌙', '🔔'], buildings: ['Zaman Kulesi', 'Sessiz Salon', 'Düşünce Avlusu']
    },
    envoy: {
      name: 'Sosyal Elçi', icon: '🤝', city: 'Bağlar Meydanı', theme: 'envoy',
      description: 'İnsanların buluştuğu, yardımlaşmanın şehri büyüttüğü meydan.', bonus: 'Sosyal görevlerde +%10 XP',
      requirement: state => state.skills.social.level >= 3,
      requirementText: 'Bağ Kurma seviye 3',
      decor: ['🎪', '🎈', '💌'], buildings: ['Topluluk Evi', 'Hikâye Sahnesi', 'Dostluk Bahçesi']
    }
  };

  const worldScenes = {
    sage: {
      library: {
        mode: 'archive',
        intro: 'Büyük Arşivde kitap kuleleri arasında dolaş, raflardaki notları aç.',
        instructions: 'Parlayan raflara ve parşömenlere dokun.',
        actionLabel: 'Becerilere git',
        notes: [
          'Bir fikri yazmak, onu zihninde iki kez işlemektir.',
          'Küçük ama düzenli tekrar, aralıklı tekrarın temelidir.',
          'Anlamadan ezberleme kısa sürer; anlamlandırma kalıcıdır.',
          'Zor konuları sabahın ilk odaklı saatlerinde çalışmak daha etkilidir.'
        ]
      },
      studio: {
        mode: 'space',
        intro: 'Yıldız Akademisinde bir astronot olarak boşlukta ilerle, yıldızlardan moral topla.',
        instructions: 'Yıldızlara dokun; her biri sana kısa bir motivasyon cümlesi verecek.',
        actionLabel: 'Odak alanına git',
        notes: [
          'Bir adım yetmez sanırsın; ama her seferinde yönü değiştirir.',
          'Mükemmel olmak gerekmiyor, bugün devam etmek gerekiyor.',
          'Odak, zamana değil niyete tutununca güçlenir.',
          'Yavaş ilerlemek durmak değildir.',
          'Bitirdiğin her küçük iş, zihninde yer açar.'
        ]
      },
      garden: {
        mode: 'libraryGarden',
        intro: 'Bilgelik Bahçesinde dev kütüphanenin önünde dolaş, ağaçlar ve çiçeklerde saklı bilgi notlarını bul.',
        instructions: 'Ağaçlara, çiçeklere ve taşlara dokun. Baykuşlar ve atlar etrafta dolaşır.',
        actionLabel: 'Görevlere git',
        ambient: 'birds',
        notes: [
          'Baykuş notu: Uykusunu iyi alan beyin yeni bilgileri daha iyi işler.',
          'Bahçe notu: Not alırken kendi cümleni kurmak hatırlamayı güçlendirir.',
          'Çiçek notu: Öğrenilen bir bilgiyi bir başkasına anlatmak etkin tekrar sayılır.',
          'Ağaç notu: Kısa yürüyüşler dikkat yenilenmesine yardım eder.',
          'Kütüphane notu: Sessiz bir ortam, bilişsel yükü azaltır.'
        ]
      }
    },
    explorer: {
      library: {
        mode: 'harbor',
        intro: 'Keşif Limanında rıhtım boyunca ilerle, pusulaları ve bavulları aç.',
        instructions: 'İskele, bavul ve pusulalara dokun.',
        actionLabel: 'Becerilere git',
        notes: [
          'Kaşif sözü: Yeni bir yer, yeni bir soru doğurur.',
          'Harita notu: Büyük hedefi küçük rotalara ayırmak kaygıyı azaltır.',
          'Rıhtım notu: Hazırlık, cesaretin sessiz yarısıdır.'
        ]
      },
      studio: {
        mode: 'mapTower',
        intro: 'Harita Kulesinde dönen haritalar ve yıldız pusulaları arasında görev planla.',
        instructions: 'Harita parçalarını ve işaret kulelerini tıkla.',
        actionLabel: 'Odak alanına git',
        notes: [
          'Yol notu: Başlamanın en kolay yolu, ilk 5 dakikayı taahhüt etmektir.',
          'Pusula notu: Her gün tek bir öncelik seçmek dağınıklığı azaltır.',
          'Rota notu: İlerlemeni görmek motivasyonu artırır.'
        ]
      },
      garden: {
        mode: 'campValley',
        intro: 'Vadi Kampında ateş çevresinde dur, çadırları ve doğa işaretlerini incele.',
        instructions: 'Kamp objelerine dokun.',
        actionLabel: 'Görevlere git',
        ambient: 'birds',
        notes: [
          'Kamp notu: Doğayla temas, zihinsel yorgunluğu azaltabilir.',
          'Ateş notu: Bir gün aksasa da ertesi gün yeniden başlamak seriyi kurtarır.',
          'Vadi notu: Merak duygusu, öğrenmenin itici gücüdür.'
        ]
      }
    },
    architect: {
      library: {
        mode: 'designPalace',
        intro: 'Tasarım Sarayında plan ruloları ve çizim masaları seni bekliyor.',
        instructions: 'Planlara ve cetvellere dokun.',
        actionLabel: 'Becerilere git',
        notes: ['Mimar notu: İyi yapı, iyi planla başlar.', 'Çizim notu: Karmaşık işleri süreçlere bölmek başarıyı artırır.', 'Ölçü notu: Ölçemediğin şeyi geliştiremezsin.']
      },
      studio: {
        mode: 'masterWorkshop',
        intro: 'Usta Atölyesinde çarklar, araçlar ve proje masaları çalışıyor.',
        instructions: 'Takımlara ve çarklara dokun.',
        actionLabel: 'Odak alanına git',
        notes: ['Atölye notu: Taslak kusurlu olabilir; kusur, üretimin doğal parçasıdır.', 'Araç notu: Doğru araç zaman kazandırır.', 'Çark notu: Rutin, üretimin görünmez motorudur.']
      },
      garden: {
        mode: 'crystalSquare',
        intro: 'Kristal Meydanda parıldayan sütunlar ve taş bahçeleri arasında dolaş.',
        instructions: 'Kristallere ve heykellere dokun.',
        actionLabel: 'Görevlere git',
        notes: ['Kristal notu: Düzenli çevre, zihinsel karmaşayı azaltır.', 'Meydan notu: Görsel ilerleme tabloları motivasyonu yükseltir.', 'Taş bahçe notu: Az ama sağlam yapı uzun ömürlüdür.']
      }
    },
    focusmaster: {
      library: {
        mode: 'timeTower',
        intro: 'Zaman Kulesinde asılı saatlerin altında ritmini kur.',
        instructions: 'Saatlere ve kum saatlerine dokun.',
        actionLabel: 'Becerilere git',
        notes: ['Saat notu: Çalışmaya başlamadan önce dikkat dağıtıcıları kapat.', 'Kule notu: 25 dakikalık odak çoğu iş için yeterli bir başlangıçtır.', 'Kum saati notu: Ara vermek, odak süresini uzatır.']
      },
      studio: {
        mode: 'silentHall',
        intro: 'Sessiz Salonda loş ışıklar eşliğinde tek bir hedefe odaklan.',
        instructions: 'Masa lambalarına ve not kartlarına dokun.',
        actionLabel: 'Odak alanına git',
        notes: ['Salon notu: Aynı anda tek bir iş yapmak hata oranını düşürür.', 'Işık notu: Net bir çalışma alanı başlama direncini azaltır.', 'Kart notu: Bir sonraki adımı yazmak ertelemeyi azaltır.']
      },
      garden: {
        mode: 'thoughtCourtyard',
        intro: 'Düşünce Avlusunda taş yollar ve su halkaları arasında sakinleş.',
        instructions: 'Su halkalarına ve taşlara dokun.',
        actionLabel: 'Görevlere git',
        notes: ['Avlu notu: Nefesi yavaşlatmak dikkat toparlanmasına yardım eder.', 'Taş notu: Azalan zihinsel gürültü, karar vermeyi kolaylaştırır.', 'Su notu: Kısa farkındalık egzersizi odak kalitesini artırabilir.']
      }
    },
    envoy: {
      library: {
        mode: 'communityHouse',
        intro: 'Topluluk Evinde mektuplar, pano ve yardım notları seni bekliyor.',
        instructions: 'Mektuplara ve ilan panosuna dokun.',
        actionLabel: 'Becerilere git',
        notes: ['Not: Destek istemek zayıflık değil, beceridir.', 'Pano notu: Ortak hedefler bağlılığı artırır.', 'Mektup notu: Teşekkür etmek ilişkileri güçlendirir.']
      },
      studio: {
        mode: 'storyStage',
        intro: 'Hikâye Sahnesinde ışıklar altında düşüncelerini görünür kıl.',
        instructions: 'Sahne objelerine ve afişlere dokun.',
        actionLabel: 'Odak alanına git',
        notes: ['Sahne notu: Kısa ve açık anlatım daha etkilidir.', 'Perde notu: Hazırlık, özgüveni artırır.', 'Afiş notu: Hikâye kurmak bilgiyi akılda tutar.']
      },
      garden: {
        mode: 'friendshipGarden',
        intro: 'Dostluk Bahçesinde mektup ağaçları ve buluşma köşeleri var.',
        instructions: 'Çiçeklere ve mektup ağaçlarına dokun.',
        actionLabel: 'Görevlere git',
        ambient: 'birds',
        notes: ['Bahçe notu: Yüz yüze kısa sohbetler aidiyet hissini artırır.', 'Çiçek notu: Nazik bir söz günün yönünü değiştirebilir.', 'Ağaç notu: Yardım etmek çoğu zaman iki tarafı da güçlendirir.']
      }
    }
  };

  let appState = null;
  let encryptionKey = null;
  let selectedWorldBuilding = 'studio';
  let currentExperienceScene = null;
  let ambient = { enabled: true, currentType: null, intervalId: null, audioCtx: null };
  let inactivityTimer = null;
  let toastTimer = null;
  let selectedAvatar = avatars[0];
  let timer = {
    initialSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    intervalId: null,
    running: false,
    startedAt: null
  };

  function defaultState() {
    return {
      version: 1,
      profile: { name: 'Gezgin', avatar: '🧭', level: 1, xp: 0, coins: 90 },
      stats: { completedTasks: 0, focusMinutes: 0, focusSessions: 0, lastFocusReward: null },
      tasks: [
        createTask('20 dakika yeni bir konu öğren', 'learning', 'easy'),
        createTask('25 dakikalık odak oturumu tamamla', 'focus', 'medium'),
        createTask('Kısa bir yürüyüş yap', 'health', 'easy')
      ],
      completedTasks: [],
      skills: {
        knowledge: { name: 'Bilgi Ustalığı', icon: '📚', level: 1, xp: 0, description: 'Okuma, öğrenme ve araştırma görevleri.' },
        focus: { name: 'Odak Ustalığı', icon: '🎯', level: 1, xp: 0, description: 'Kesintisiz çalışma ve üretim oturumları.' },
        vitality: { name: 'Yaşam Enerjisi', icon: '🌿', level: 1, xp: 0, description: 'Hareket, bakım ve sağlıklı rutinler.' },
        social: { name: 'Bağ Kurma', icon: '🤝', level: 1, xp: 0, description: 'İletişim, yardımlaşma ve ortak işler.' }
      },
      town: { library: 1, studio: 1, garden: 1 },
      selectedPersona: 'sage',
      discoveredPersonas: ['sage'],
      activity: []
    };
  }

  function createTask(title, category, difficulty) {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title,
      category,
      difficulty,
      createdAt: new Date().toISOString()
    };
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
    return result === 0;
  }

  async function deriveCredentials(password) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      stateEncoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: base64ToBytes(AUTH.salt),
        iterations: AUTH.iterations
      },
      keyMaterial,
      512
    );
    const derived = new Uint8Array(bits);
    const verifier = derived.slice(0, 32);
    const keyBytes = derived.slice(32, 64);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    keyBytes.fill(0);
    return { verifier, key };
  }

  async function encryptState(value) {
    if (!encryptionKey) throw new Error('Şifreleme anahtarı yok.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = stateEncoder.encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, plaintext);
    return JSON.stringify({ version: 1, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) });
  }

  async function decryptState(payload) {
    if (!encryptionKey) throw new Error('Şifreleme anahtarı yok.');
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
      encryptionKey,
      base64ToBytes(parsed.ciphertext)
    );
    return JSON.parse(stateDecoder.decode(plaintext));
  }

  async function saveState() {
    const encrypted = await encryptState(appState);
    localStorage.setItem(STORAGE_KEY, encrypted);
  }

  async function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      appState = defaultState();
      await saveState();
      return;
    }
    try {
      appState = await decryptState(saved);
      migrateState();
    } catch (error) {
      throw new Error('Kayıt çözülemedi. Parola yapılandırması değişmiş veya veri bozulmuş olabilir.');
    }
  }

  function migrateState() {
    const fallback = defaultState();
    appState.profile ??= fallback.profile;
    appState.stats ??= fallback.stats;
    appState.tasks ??= [];
    appState.completedTasks ??= [];
    appState.skills ??= fallback.skills;
    appState.town ??= fallback.town;
    appState.selectedPersona ??= 'sage';
    appState.discoveredPersonas ??= ['sage'];
    appState.activity ??= [];
    refreshPersonaUnlocks();
  }

  function refreshPersonaUnlocks() {
    appState.discoveredPersonas ??= ['sage'];
    Object.entries(personas).forEach(([id, persona]) => {
      if (persona.requirement(appState) && !appState.discoveredPersonas.includes(id)) {
        appState.discoveredPersonas.push(id);
      }
    });
    if (!appState.discoveredPersonas.includes(appState.selectedPersona)) appState.selectedPersona = 'sage';
  }

  function isPersonaUnlocked(id) {
    return appState.discoveredPersonas.includes(id) || personas[id].requirement(appState);
  }

  function activePersona() {
    return personas[appState.selectedPersona] || personas.sage;
  }

  function getScene(personaId = appState.selectedPersona, buildingId = selectedWorldBuilding) {
    return worldScenes[personaId]?.[buildingId] || null;
  }

  function spotlightX(buildingId) {
    return ({ library: '18%', studio: '50%', garden: '82%' })[buildingId] || '50%';
  }

  function setSpotlightTarget(buildingId) {
    selectedWorldBuilding = buildingId;
    const stage = $('#worldStage');
    stage?.style.setProperty('--beam-x', spotlightX(buildingId));
    $$('.world-building').forEach(button => {
      const active = button.dataset.worldBuilding === buildingId;
      button.classList.toggle('targeted', active);
    });
  }

  function stopAmbient() {
    if (ambient.intervalId) clearInterval(ambient.intervalId);
    ambient.intervalId = null;
    ambient.currentType = null;
  }

  function ensureAudioContext() {
    if (!ambient.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) ambient.audioCtx = new Ctx();
    }
    if (ambient.audioCtx?.state === 'suspended') ambient.audioCtx.resume().catch(() => {});
  }

  function chirpBird(base = 1200) {
    if (!ambient.enabled) return;
    ensureAudioContext();
    const ctx = ambient.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(base * 1.1, now + 0.11);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  function startAmbient(type) {
    stopAmbient();
    ambient.currentType = type;
    if (!ambient.enabled || !type) return;
    if (type === 'birds') {
      chirpBird(1300);
      ambient.intervalId = setInterval(() => {
        chirpBird(1050 + Math.random() * 500);
        setTimeout(() => chirpBird(1450 + Math.random() * 350), 160 + Math.random() * 150);
      }, 4200);
    }
  }

  function updateAmbientButton() {
    const button = $('#ambientToggle');
    if (!button) return;
    button.textContent = `Ses: ${ambient.enabled ? 'Açık' : 'Kapalı'}`;
  }

  function xpTarget(level) {
    return 100 + (level - 1) * 35;
  }

  function skillTarget(level) {
    return 50 + (level - 1) * 25;
  }

  function addProfileXp(amount) {
    appState.profile.xp += amount;
    let leveled = false;
    while (appState.profile.xp >= xpTarget(appState.profile.level)) {
      appState.profile.xp -= xpTarget(appState.profile.level);
      appState.profile.level += 1;
      appState.profile.coins += 30;
      leveled = true;
    }
    if (leveled) showToast(`Seviye ${appState.profile.level}! 30 bonus altın kazandın.`);
  }

  function addSkillXp(skillId, amount) {
    const skill = appState.skills[skillId];
    if (!skill) return;
    skill.xp += amount;
    while (skill.xp >= skillTarget(skill.level)) {
      skill.xp -= skillTarget(skill.level);
      skill.level += 1;
    }
  }

  function todayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function activitiesToday() {
    const today = todayKey();
    return appState.activity.filter(item => item.date.slice(0, 10) === today);
  }

  function addActivity(type, points, detail) {
    appState.activity.unshift({ id: crypto.randomUUID?.() || String(Date.now()), type, points, detail, date: new Date().toISOString() });
    appState.activity = appState.activity.slice(0, 200);
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  async function login(event) {
    event.preventDefault();
    const passwordInput = $('#password');
    const loginButton = $('#loginButton');
    const errorBox = $('#loginError');
    errorBox.textContent = '';
    loginButton.disabled = true;
    loginButton.textContent = 'Doğrulanıyor…';

    try {
      const credentials = await deriveCredentials(passwordInput.value);
      const expected = base64ToBytes(AUTH.verifier);
      if (!constantTimeEqual(credentials.verifier, expected)) {
        throw new Error('Parola yanlış.');
      }
      encryptionKey = credentials.key;
      credentials.verifier.fill(0);
      passwordInput.value = '';
      await loadState();
      openApp();
    } catch (error) {
      encryptionKey = null;
      errorBox.textContent = error.message || 'Giriş başarısız.';
      passwordInput.select();
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = 'Giriş yap';
    }
  }

  function openApp() {
    $('#lockScreen').hidden = true;
    $('#appShell').hidden = false;
    selectedAvatar = appState.profile.avatar;
    renderAll();
    resetInactivityTimer();
    document.addEventListener('pointerdown', resetInactivityTimer, { passive: true });
    document.addEventListener('keydown', resetInactivityTimer);
  }

  function logout(message = '') {
    clearInterval(timer.intervalId);
    timer.running = false;
    encryptionKey = null;
    appState = null;
    clearTimeout(inactivityTimer);
    stopAmbient();
    document.removeEventListener('pointerdown', resetInactivityTimer);
    document.removeEventListener('keydown', resetInactivityTimer);
    $('#appShell').hidden = true;
    $('#lockScreen').hidden = false;
    $('#password').focus();
    if (message) $('#loginError').textContent = message;
  }

  function resetInactivityTimer() {
    if (!encryptionKey) return;
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => logout('Oturum hareketsizlik nedeniyle kilitlendi.'), AUTH.inactivityMinutes * 60 * 1000);
  }

  function setView(viewName) {
    $$('.view').forEach(view => view.classList.remove('active-view'));
    $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === viewName));
    $(`#view-${viewName}`)?.classList.add('active-view');
    const titles = {
      dashboard: ['BUGÜNÜN MERKEZİ', 'Ana ekran'],
      tasks: ['GERÇEK HAYAT GÖREVLERİ', 'Görevler'],
      focus: ['SESSİZ ÇALIŞMA ALANI', 'Odak alanı'],
      skills: ['BECERİ GELİŞİMİ', 'Beceriler'],
      town: ['KİŞİSEL DÜNYAN', 'Şehrim'],
      profile: ['AYARLAR', 'Profil ve veri']
    };
    $('#pageEyebrow').textContent = titles[viewName][0];
    $('#pageTitle').textContent = titles[viewName][1];
    $('.sidebar').classList.remove('open');
    window.location.hash = viewName;
  }

  function renderAll() {
    renderHeader();
    renderDashboard();
    renderTasks();
    renderFocusStats();
    renderSkills();
    renderTown();
    renderProfile();
  }

  function renderHeader() {
    const { profile } = appState;
    $('#topCoins').textContent = profile.coins;
    $('#topAvatar').textContent = profile.avatar;
    $('#topName').textContent = profile.name;
    $('#topLevel').textContent = `Seviye ${profile.level}`;
    $('#lockMinutes').textContent = AUTH.inactivityMinutes;
  }

  function renderDashboard() {
    const { profile, stats, skills, town } = appState;
    const target = xpTarget(profile.level);
    const today = activitiesToday();
    const dailyPoints = today.reduce((sum, item) => sum + item.points, 0);
    const totalSkillLevels = Object.values(skills).reduce((sum, skill) => sum + skill.level, 0);
    const townLevel = Object.values(town).reduce((sum, level) => sum + level, 0);

    $('#heroName').textContent = profile.name;
    $('#heroAvatar').textContent = profile.avatar;
    $('#heroXp').textContent = profile.xp;
    $('#heroXpTarget').textContent = target;
    $('#heroXpBar').style.width = `${Math.min(100, (profile.xp / target) * 100)}%`;
    $('#heroMessage').textContent = today.length
      ? `Bugün ${today.length} etkinlik tamamladın. Bir sonraki adım için ivmen hazır.`
      : 'Küçük bir görev tamamlayarak şehrine ilk kaynağı kazandır.';
    $('#dailyScore').textContent = dailyPoints;
    $('#dailySummary').textContent = today.length ? `${today.length} kayıt · Son işlem: ${today[0].detail}` : 'Bugün henüz etkinlik yok.';
    $('#statTasks').textContent = stats.completedTasks;
    $('#statFocus').textContent = `${stats.focusMinutes} dk`;
    $('#statSkills').textContent = totalSkillLevels;
    $('#statTown').textContent = townLevel;

    const active = appState.tasks.slice(0, 4);
    $('#dashboardTasks').innerHTML = active.length ? active.map(task => {
      const meta = categoryMeta[task.category];
      return `<div class="compact-item"><div class="compact-item-copy"><strong>${escapeHtml(task.title)}</strong><span>${meta.label} · ${difficultyMeta[task.difficulty].xp} XP</span></div><button class="small-button" data-complete-task="${task.id}">Tamamla</button></div>`;
    }).join('') : '<div class="empty-state">Aktif görev kalmadı. Yeni bir görev ekleyebilirsin.</div>';

    $('#dashboardTown').innerHTML = Object.entries(buildings).map(([id, building]) => `<div class="town-mini"><span>${building.icon}</span><strong>${building.name.split(' ')[0]}</strong><small>Sv. ${town[id]}</small></div>`).join('');
  }

  function renderTasks() {
    $('#taskCount').textContent = `${appState.tasks.length} görev`;
    $('#taskList').innerHTML = appState.tasks.length ? appState.tasks.map(task => {
      const category = categoryMeta[task.category];
      const difficulty = difficultyMeta[task.difficulty];
      return `<div class="task-card">
        <div class="task-category" aria-hidden="true">${category.icon}</div>
        <div class="task-copy"><strong>${escapeHtml(task.title)}</strong><div class="task-meta"><span>${category.label}</span><span>•</span><span>${difficulty.label}</span><span>•</span><span>${difficulty.xp} XP + ${difficulty.coins} ◆</span></div></div>
        <div class="task-actions"><button class="small-button" data-complete-task="${task.id}">Tamamla</button><button class="small-button delete-button" data-delete-task="${task.id}">Sil</button></div>
      </div>`;
    }).join('') : '<div class="empty-state">Görev panon boş. Soldaki formdan yeni bir görev ekle.</div>';

    const completed = appState.completedTasks.slice(0, 8);
    $('#completedTaskList').innerHTML = completed.length ? completed.map(task => `<div class="compact-item"><div class="compact-item-copy"><strong>${escapeHtml(task.title)}</strong><span>${formatDate(task.completedAt)} · +${task.rewardXp} XP</span></div><span>✓</span></div>`).join('') : '<div class="empty-state">Henüz tamamlanan görev yok.</div>';
  }

  function renderFocusStats() {
    const today = todayKey();
    const todayMinutes = appState.activity
      .filter(item => item.type === 'focus' && item.date.startsWith(today))
      .reduce((sum, item) => sum + (item.minutes || 0), 0);
    $('#focusTotal').textContent = appState.stats.focusMinutes;
    $('#focusSessions').textContent = appState.stats.focusSessions;
    $('#focusToday').textContent = `${todayMinutes} dk`;
    $('#focusReward').textContent = appState.stats.lastFocusReward || '—';
  }

  function renderSkills() {
    $('#skillGrid').innerHTML = Object.entries(appState.skills).map(([id, skill]) => {
      const target = skillTarget(skill.level);
      const percent = Math.min(100, skill.xp / target * 100);
      return `<article class="skill-card">
        <div class="skill-head"><div class="skill-icon">${skill.icon}</div><div><h4>${escapeHtml(skill.name)}</h4><span>${escapeHtml(skill.description)}</span></div><span class="skill-level">Sv. ${skill.level}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        <div class="progress-copy"><span>${skill.xp} XP</span><span>${target} XP</span></div>
      </article>`;
    }).join('');
  }

  function renderTown() {
    refreshPersonaUnlocks();
    const selected = activePersona();
    if (!['library', 'studio', 'garden'].includes(selectedWorldBuilding)) selectedWorldBuilding = 'studio';
    const personaGrid = $('#personaGrid');
    personaGrid.innerHTML = Object.entries(personas).map(([id, persona]) => {
      const unlocked = isPersonaUnlocked(id);
      const active = id === appState.selectedPersona;
      return `<button class="persona-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-persona="${id}" ${unlocked ? '' : 'disabled'}>
        <span class="persona-icon">${persona.icon}</span>
        <span class="persona-copy"><strong>${persona.name}</strong><small>${persona.city}</small></span>
        <span class="persona-status">${unlocked ? (active ? 'Aktif' : 'Açık') : '🔒 ' + persona.requirementText}</span>
      </button>`;
    }).join('');

    const stage = $('#worldStage');
    stage.className = `world-stage theme-${appState.selectedPersona}`;
    $('#worldTitle').textContent = selected.city;
    $('#worldDescription').textContent = selected.description;
    $('#worldBonus').textContent = selected.bonus;
    $('#worldCharacter').textContent = appState.profile.avatar;
    $('#worldDecor').innerHTML = selected.decor.map((item, index) => `<span style="--i:${index}">${item}</span>`).join('');
    const worldBuildings = $$('.world-building');
    const worldIds = ['library', 'studio', 'garden'];
    worldBuildings.forEach((button, index) => {
      const buildingId = worldIds[index];
      const name = selected.buildings[index];
      button.dataset.personaBuildingName = name;
      button.setAttribute('aria-label', `${name} yapısına gir`);
      button.innerHTML = `<span class="world-building-label">${name}</span>`;
      button.classList.toggle('targeted', buildingId === selectedWorldBuilding);
    });
    setSpotlightTarget(selectedWorldBuilding);

    $('#townGrid').innerHTML = Object.entries(buildings).map(([id, building], index) => {
      const level = appState.town[id];
      const baseCost = 60 + level * level * 35;
      const cost = appState.selectedPersona === 'architect' ? Math.round(baseCost * .9) : baseCost;
      const affordable = appState.profile.coins >= cost;
      const scene = getScene(appState.selectedPersona, id);
      return `<article class="town-card">
        <span class="town-level">Seviye ${level}</span>
        <div class="building-icon">${building.icon}</div>
        <h4>${selected.buildings[index]}</h4>
        <p>${scene?.intro || building.description}</p>
        <p><strong>${building.effect}</strong></p>
        <div class="town-card-actions"><button class="secondary-button" data-open-scene="${id}">Dünyaya gir</button><button class="secondary-button" data-upgrade-building="${id}" ${affordable ? '' : 'disabled'}>${cost} ◆ ile yükselt</button></div>
      </article>`;
    }).join('');
  }

  async function selectPersona(id) {
    if (!personas[id] || !isPersonaUnlocked(id)) return;
    appState.selectedPersona = id;
    await saveState();
    renderTown();
    showToast(`${personas[id].city} aktif dünya oldu.`);
  }

  function openWorldBuilding(buildingId) {
    const persona = activePersona();
    const index = ['library', 'studio', 'garden'].indexOf(buildingId);
    const names = persona.buildings;
    const building = buildings[buildingId];
    const scene = getScene(appState.selectedPersona, buildingId);
    setSpotlightTarget(buildingId);
    $('#worldModalEyebrow').textContent = persona.city.toUpperCase();
    $('#worldModalTitle').textContent = names[index];
    $('#worldModalText').textContent = `${scene?.intro || building.description} Bu yapı seviye ${appState.town[buildingId]}. ${building.effect}.`;
    $('#worldModalArt').className = `world-modal-art theme-${appState.selectedPersona} art-${buildingId}`;
    $('#worldModalArt').innerHTML = `<span>${building.icon}</span><strong>${names[index]}</strong><small>${scene?.instructions || ''}</small>`;
    $('#worldModalAction').dataset.modalBuilding = buildingId;
    $('#worldModalAction').textContent = 'Bu dünyaya gir';
    $('#worldModal').hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeWorldModal() {
    $('#worldModal').hidden = true;
    document.body.classList.remove('modal-open');
  }

  function renderSceneMarkup(personaId, buildingId) {
    const scene = getScene(personaId, buildingId);
    const avatar = appState.profile.avatar;
    const notes = scene?.notes || [];
    const starButtons = notes.map((note, i) => `<button class="scene-thing star-note s${i+1}" data-scene-note="${escapeHtml(note)}"><span>✦</span><small>${['Parla','İlerle','Odaklan','Devam et','Bitir'][i] || 'Not'}</small></button>`).join('');
    const noteThings = notes.map((note, i) => `<button class="scene-thing note-card n${i+1}" data-scene-note="${escapeHtml(note)}">${i+1}</button>`).join('');
    const gardenThings = notes.map((note, i) => `<button class="scene-thing garden-hotspot g${i+1}" data-scene-note="${escapeHtml(note)}"><span>${['🌳','🌸','🌼','🌲','🪨'][i] || '🌿'}</span></button>`).join('');
    const commonPlayer = `<div class="scene-player">${avatar}</div>`;
    switch (scene?.mode) {
      case 'space':
        return `<div class="experience-scene-inner scene-space"><div class="scene-bg"></div><div class="space-nebula nebula-a"></div><div class="space-nebula nebula-b"></div>${starButtons}<div class="astronaut-trail">🫧 🫧</div><div class="scene-player astronaut">👩‍🚀</div></div>`;
      case 'libraryGarden':
        return `<div class="experience-scene-inner scene-library-garden"><div class="scene-library"></div><div class="scene-lawn"></div>${gardenThings}<div class="scene-creature owl owl-a">🦉</div><div class="scene-creature owl owl-b">🦉</div><div class="scene-creature horse horse-a">🐎</div><div class="scene-creature horse horse-b">🐎</div><div class="scene-creature horse horse-c">🐎</div>${commonPlayer}</div>`;
      case 'archive':
        return `<div class="experience-scene-inner scene-archive"><div class="books-wall left"></div><div class="books-wall right"></div><div class="archive-floor"></div>${noteThings}<div class="scroll-glow">📜</div>${commonPlayer}</div>`;
      case 'harbor':
        return `<div class="experience-scene-inner scene-harbor"><div class="water-strip"></div><div class="dock"></div><div class="ship">⛵</div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🧭</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🧳</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🗺️</button>${commonPlayer}</div>`;
      case 'mapTower':
        return `<div class="experience-scene-inner scene-map-tower"><div class="tower-core"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🗺️</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">📍</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🧭</button>${commonPlayer}</div>`;
      case 'campValley':
        return `<div class="experience-scene-inner scene-camp"><div class="camp-fire">🔥</div><div class="tent tent-a"></div><div class="tent tent-b"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🏕️</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🪵</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🌄</button>${commonPlayer}</div>`;
      case 'designPalace':
        return `<div class="experience-scene-inner scene-design"><div class="palace-grid"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">📐</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">📏</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🧾</button>${commonPlayer}</div>`;
      case 'masterWorkshop':
        return `<div class="experience-scene-inner scene-workshop"><div class="gear gear-a">⚙️</div><div class="gear gear-b">⚙️</div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🧰</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🪚</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🔩</button>${commonPlayer}</div>`;
      case 'crystalSquare':
        return `<div class="experience-scene-inner scene-crystal"><div class="crystal c1"></div><div class="crystal c2"></div><div class="crystal c3"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">💎</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🪴</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🗿</button>${commonPlayer}</div>`;
      case 'timeTower':
        return `<div class="experience-scene-inner scene-time"><div class="clock-big">🕰️</div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">⏰</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">⌛</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🪶</button>${commonPlayer}</div>`;
      case 'silentHall':
        return `<div class="experience-scene-inner scene-silent"><div class="hall-desk desk-a"></div><div class="hall-desk desk-b"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">💡</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">📝</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">📌</button>${commonPlayer}</div>`;
      case 'thoughtCourtyard':
        return `<div class="experience-scene-inner scene-thought"><div class="ripple r1"></div><div class="ripple r2"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">💧</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🪨</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🌫️</button>${commonPlayer}</div>`;
      case 'communityHouse':
        return `<div class="experience-scene-inner scene-community"><div class="message-wall"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">💌</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">📋</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🤲</button>${commonPlayer}</div>`;
      case 'storyStage':
        return `<div class="experience-scene-inner scene-stage"><div class="curtain left"></div><div class="curtain right"></div><div class="stage-light"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🎤</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🎭</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">🪧</button>${commonPlayer}</div>`;
      case 'friendshipGarden':
        return `<div class="experience-scene-inner scene-friendship"><div class="friend-tree"></div><div class="friend-bench"></div><button class="scene-thing object o1" data-scene-note="${escapeHtml(notes[0]||'')}">🌷</button><button class="scene-thing object o2" data-scene-note="${escapeHtml(notes[1]||'')}">🌼</button><button class="scene-thing object o3" data-scene-note="${escapeHtml(notes[2]||'')}">💌</button>${commonPlayer}</div>`;
      default:
        return `<div class="experience-scene-inner"><div class="scene-fallback">Bu dünya hazırlanıyor.</div></div>`;
    }
  }

  function openExperienceWorld(buildingId) {
    selectedWorldBuilding = buildingId;
    setSpotlightTarget(buildingId);
    const persona = activePersona();
    const scene = getScene(appState.selectedPersona, buildingId);
    const index = ['library', 'studio', 'garden'].indexOf(buildingId);
    currentExperienceScene = { personaId: appState.selectedPersona, buildingId };
    $('#experienceEyebrow').textContent = `${persona.name.toUpperCase()} · MİNİ DÜNYA`;
    $('#experienceTitle').textContent = persona.buildings[index];
    $('#experienceSubtitle').textContent = scene?.intro || '';
    $('#experienceInstructions').textContent = scene?.instructions || 'Sahnedeki nesnelere dokun.';
    $('#experienceActionButton').dataset.modalBuilding = buildingId;
    $('#experienceActionButton').textContent = scene?.actionLabel || 'Bu alanı kullan';
    $('#experienceScene').className = `experience-scene theme-${appState.selectedPersona} mode-${scene?.mode || 'default'}`;
    $('#experienceScene').innerHTML = renderSceneMarkup(appState.selectedPersona, buildingId);
    $('#experienceNote').textContent = 'Bir nesneye tıklayınca burada not görünecek.';
    $('#experienceModal').hidden = false;
    document.body.classList.add('modal-open');
    updateAmbientButton();
    startAmbient(scene?.ambient);
  }

  function closeExperienceWorld() {
    currentExperienceScene = null;
    $('#experienceModal').hidden = true;
    document.body.classList.remove('modal-open');
    stopAmbient();
  }

  function renderProfile() {
    $('#profileName').value = appState.profile.name;
    selectedAvatar = appState.profile.avatar;
    $('#avatarOptions').innerHTML = avatars.map(avatar => `<button class="avatar-choice ${avatar === selectedAvatar ? 'selected' : ''}" type="button" data-avatar="${avatar}" aria-label="${avatar} avatarını seç">${avatar}</button>`).join('');
  }

  async function completeTask(taskId) {
    const index = appState.tasks.findIndex(task => task.id === taskId);
    if (index < 0) return;
    const [task] = appState.tasks.splice(index, 1);
    const reward = difficultyMeta[task.difficulty];
    appState.stats.completedTasks += 1;
    appState.profile.coins += reward.coins;
    addProfileXp(reward.xp);
    addSkillXp(categoryMeta[task.category].skill, Math.max(8, Math.round(reward.xp * .8)));
    appState.completedTasks.unshift({ ...task, completedAt: new Date().toISOString(), rewardXp: reward.xp, rewardCoins: reward.coins });
    appState.completedTasks = appState.completedTasks.slice(0, 50);
    addActivity('task', reward.xp, task.title);
    refreshPersonaUnlocks();
    await saveState();
    renderAll();
    showToast(`Görev tamamlandı: +${reward.xp} XP, +${reward.coins} altın.`);
  }

  async function deleteTask(taskId) {
    appState.tasks = appState.tasks.filter(task => task.id !== taskId);
    await saveState();
    renderTasks();
    renderDashboard();
    showToast('Görev silindi.');
  }

  async function addTask(event) {
    event.preventDefault();
    const title = $('#taskTitle').value.trim();
    if (!title) return;
    appState.tasks.unshift(createTask(title, $('#taskCategory').value, $('#taskDifficulty').value));
    await saveState();
    event.target.reset();
    renderTasks();
    renderDashboard();
    showToast('Görev panoya eklendi.');
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timer.remainingSeconds / 60);
    const seconds = timer.remainingSeconds % 60;
    $('#timerDisplay').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function setTimerButtons() {
    $('#timerStart').disabled = timer.running;
    $('#timerPause').disabled = !timer.running;
    $('#roomStatus').textContent = timer.running ? 'Odaklanıyor' : timer.remainingSeconds < timer.initialSeconds ? 'Duraklatıldı' : 'Hazır';
  }

  function startTimer() {
    if (timer.running) return;
    timer.running = true;
    timer.startedAt = Date.now();
    setTimerButtons();
    timer.intervalId = setInterval(async () => {
      timer.remainingSeconds -= 1;
      updateTimerDisplay();
      if (timer.remainingSeconds <= 0) {
        clearInterval(timer.intervalId);
        timer.running = false;
        await completeFocusSession(timer.initialSeconds / 60);
        resetTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timer.intervalId);
    timer.running = false;
    setTimerButtons();
  }

  function resetTimer() {
    clearInterval(timer.intervalId);
    timer.running = false;
    timer.remainingSeconds = timer.initialSeconds;
    updateTimerDisplay();
    setTimerButtons();
  }

  function chooseTimer(minutes) {
    if (timer.running && !confirm('Çalışan zamanlayıcı sıfırlansın mı?')) return;
    clearInterval(timer.intervalId);
    timer.initialSeconds = minutes * 60;
    timer.remainingSeconds = timer.initialSeconds;
    timer.running = false;
    $$('.timer-chip').forEach(button => button.classList.toggle('active', Number(button.dataset.minutes) === minutes));
    updateTimerDisplay();
    setTimerButtons();
  }

  async function completeFocusSession(minutes) {
    const xp = Math.max(12, Math.round(minutes * .8));
    const coins = Math.max(8, Math.round(minutes * .45));
    appState.stats.focusMinutes += minutes;
    appState.stats.focusSessions += 1;
    appState.stats.lastFocusReward = `+${xp} XP, +${coins} ◆`;
    appState.profile.coins += coins;
    addProfileXp(xp);
    addSkillXp('focus', xp);
    const activity = { id: crypto.randomUUID?.() || String(Date.now()), type: 'focus', points: xp, minutes, detail: `${minutes} dakikalık odak oturumu`, date: new Date().toISOString() };
    appState.activity.unshift(activity);
    refreshPersonaUnlocks();
    await saveState();
    renderAll();
    showToast(`Odak oturumu tamamlandı: +${xp} XP, +${coins} altın.`);
  }

  async function upgradeBuilding(buildingId) {
    const level = appState.town[buildingId];
    const baseCost = 60 + level * level * 35;
    const cost = appState.selectedPersona === 'architect' ? Math.round(baseCost * .9) : baseCost;
    if (appState.profile.coins < cost) return;
    appState.profile.coins -= cost;
    appState.town[buildingId] += 1;
    addProfileXp(15);
    addActivity('town', 15, `${buildings[buildingId].name} yükseltildi`);
    refreshPersonaUnlocks();
    await saveState();
    renderAll();
    showToast(`${buildings[buildingId].name} seviye ${appState.town[buildingId]} oldu.`);
  }

  async function saveProfile(event) {
    event.preventDefault();
    const name = $('#profileName').value.trim();
    if (!name) return;
    appState.profile.name = name;
    appState.profile.avatar = selectedAvatar;
    await saveState();
    renderAll();
    showToast('Karakter profili güncellendi.');
  }

  function exportBackup() {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return;
    const file = new Blob([JSON.stringify({ app: 'LifeQuest', exportedAt: new Date().toISOString(), payload: JSON.parse(encrypted) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifequest-yedek-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Şifreli yedek hazırlandı.');
  }

  async function importBackup(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.app !== 'LifeQuest' || !parsed.payload?.iv || !parsed.payload?.ciphertext) throw new Error('Geçersiz yedek dosyası.');
      const restored = await decryptState(parsed.payload);
      if (!restored.profile || !restored.skills) throw new Error('Yedek içeriği geçersiz.');
      appState = restored;
      migrateState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.payload));
      renderAll();
      showToast('Yedek geri yüklendi.');
    } catch (error) {
      showToast(error.message || 'Yedek açılamadı.');
    }
  }

  async function resetData() {
    const confirmation = prompt('Tüm kayıtları silmek için SİL yazın:');
    if (confirmation !== 'SİL') return;
    appState = defaultState();
    await saveState();
    renderAll();
    showToast('Uygulama verileri sıfırlandı.');
  }

  function bindEvents() {
    $('#loginForm').addEventListener('submit', login);
    $('#togglePassword').addEventListener('click', () => {
      const input = $('#password');
      input.type = input.type === 'password' ? 'text' : 'password';
      $('#togglePassword').textContent = input.type === 'password' ? 'Göster' : 'Gizle';
    });
    $('#logoutButton').addEventListener('click', () => logout());
    $('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    $$('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
    $$('[data-jump]').forEach(button => button.addEventListener('click', () => setView(button.dataset.jump)));
    $('#taskForm').addEventListener('submit', addTask);
    $('#timerStart').addEventListener('click', startTimer);
    $('#timerPause').addEventListener('click', pauseTimer);
    $('#timerReset').addEventListener('click', resetTimer);
    $$('.timer-chip').forEach(button => button.addEventListener('click', () => chooseTimer(Number(button.dataset.minutes))));
    $('#profileForm').addEventListener('submit', saveProfile);
    $('#exportButton').addEventListener('click', exportBackup);
    $('#importInput').addEventListener('change', event => {
      const [file] = event.target.files;
      if (file) importBackup(file);
      event.target.value = '';
    });
    $('#resetButton').addEventListener('click', resetData);
    $('#enterWorldButton').addEventListener('click', () => openExperienceWorld(selectedWorldBuilding));
    $('#closeWorldModal').addEventListener('click', closeWorldModal);
    $('#worldModal').addEventListener('click', event => { if (event.target === $('#worldModal')) closeWorldModal(); });
    $('#worldModalAction').addEventListener('click', event => {
      const id = event.currentTarget.dataset.modalBuilding;
      closeWorldModal();
      openExperienceWorld(id);
    });
    $('#closeExperienceModal').addEventListener('click', closeExperienceWorld);
    $('#experienceModal').addEventListener('click', event => { if (event.target === $('#experienceModal')) closeExperienceWorld(); });
    $('#experienceActionButton').addEventListener('click', event => {
      const id = event.currentTarget.dataset.modalBuilding;
      closeExperienceWorld();
      if (id === 'studio') setView('focus');
      else if (id === 'library') setView('skills');
      else setView('tasks');
    });
    $('#ambientToggle').addEventListener('click', () => {
      ambient.enabled = !ambient.enabled;
      updateAmbientButton();
      const scene = currentExperienceScene ? getScene(currentExperienceScene.personaId, currentExperienceScene.buildingId) : null;
      if (ambient.enabled) startAmbient(scene?.ambient);
      else stopAmbient();
    });

    document.addEventListener('pointerover', event => {
      const worldBuilding = event.target.closest('[data-world-building]');
      if (worldBuilding) setSpotlightTarget(worldBuilding.dataset.worldBuilding);
    });

    document.addEventListener('click', event => {
      const personaButton = event.target.closest('[data-persona]');
      if (personaButton) selectPersona(personaButton.dataset.persona);
      const worldBuilding = event.target.closest('[data-world-building]');
      if (worldBuilding) openWorldBuilding(worldBuilding.dataset.worldBuilding);
      const openSceneButton = event.target.closest('[data-open-scene]');
      if (openSceneButton) openExperienceWorld(openSceneButton.dataset.openScene);
      const sceneNote = event.target.closest('[data-scene-note]');
      if (sceneNote) $('#experienceNote').textContent = sceneNote.dataset.sceneNote;
      const completeButton = event.target.closest('[data-complete-task]');
      if (completeButton) completeTask(completeButton.dataset.completeTask);
      const deleteButton = event.target.closest('[data-delete-task]');
      if (deleteButton) deleteTask(deleteButton.dataset.deleteTask);
      const upgradeButton = event.target.closest('[data-upgrade-building]');
      if (upgradeButton) upgradeBuilding(upgradeButton.dataset.upgradeBuilding);
      const avatarButton = event.target.closest('[data-avatar]');
      if (avatarButton) {
        selectedAvatar = avatarButton.dataset.avatar;
        $$('.avatar-choice').forEach(button => button.classList.toggle('selected', button.dataset.avatar === selectedAvatar));
      }
    });

    window.addEventListener('hashchange', () => {
      const target = location.hash.replace('#', '');
      if (encryptionKey && ['dashboard', 'tasks', 'focus', 'skills', 'town', 'profile'].includes(target)) setView(target);
    });
  }

  function init() {
    if (!AUTH || !AUTH.salt || !AUTH.verifier) {
      $('#loginError').textContent = 'auth-config.js yapılandırması bulunamadı.';
      $('#loginButton').disabled = true;
      return;
    }
    bindEvents();
    updateTimerDisplay();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }
  }

  init();
})();
