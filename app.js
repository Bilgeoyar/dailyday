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

  let appState = null;
  let encryptionKey = null;
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
    worldBuildings.forEach((button, index) => {
      button.dataset.personaBuildingName = selected.buildings[index];
      button.setAttribute('aria-label', `${selected.buildings[index]} yapısına gir`);
    });

    $('#townGrid').innerHTML = Object.entries(buildings).map(([id, building], index) => {
      const level = appState.town[id];
      const baseCost = 60 + level * level * 35;
      const cost = appState.selectedPersona === 'architect' ? Math.round(baseCost * .9) : baseCost;
      const affordable = appState.profile.coins >= cost;
      return `<article class="town-card">
        <span class="town-level">Seviye ${level}</span>
        <div class="building-icon">${building.icon}</div>
        <h4>${selected.buildings[index]}</h4>
        <p>${building.description}</p>
        <p><strong>${building.effect}</strong></p>
        <button class="secondary-button" data-upgrade-building="${id}" ${affordable ? '' : 'disabled'}>${cost} ◆ ile yükselt</button>
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
    $('#worldModalEyebrow').textContent = persona.city.toUpperCase();
    $('#worldModalTitle').textContent = names[index];
    $('#worldModalText').textContent = `${building.description} Bu yapı seviye ${appState.town[buildingId]}. ${building.effect}.`;
    $('#worldModalArt').className = `world-modal-art theme-${appState.selectedPersona} art-${buildingId}`;
    $('#worldModalArt').innerHTML = `<span>${building.icon}</span><strong>${names[index]}</strong>`;
    $('#worldModalAction').dataset.modalBuilding = buildingId;
    $('#worldModal').hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeWorldModal() {
    $('#worldModal').hidden = true;
    document.body.classList.remove('modal-open');
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
    $('#enterWorldButton').addEventListener('click', () => { $('#worldStage').classList.toggle('immersive'); });
    $('#closeWorldModal').addEventListener('click', closeWorldModal);
    $('#worldModal').addEventListener('click', event => { if (event.target === $('#worldModal')) closeWorldModal(); });
    $('#worldModalAction').addEventListener('click', event => {
      const id = event.currentTarget.dataset.modalBuilding;
      closeWorldModal();
      if (id === 'studio') setView('focus');
      else if (id === 'library') setView('skills');
      else setView('tasks');
    });

    document.addEventListener('click', event => {
      const personaButton = event.target.closest('[data-persona]');
      if (personaButton) selectPersona(personaButton.dataset.persona);
      const worldBuilding = event.target.closest('[data-world-building]');
      if (worldBuilding) openWorldBuilding(worldBuilding.dataset.worldBuilding);
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
