(() => {
  'use strict';

  const MODE_FAMILY = {
    space: 'space',
    libraryGarden: 'garden',
    archive: 'archive',
    harbor: 'harbor',
    mapTower: 'sky',
    campValley: 'garden',
    designPalace: 'design',
    masterWorkshop: 'workshop',
    crystalSquare: 'crystal',
    timeTower: 'time',
    silentHall: 'archive',
    thoughtCourtyard: 'water',
    communityHouse: 'community',
    storyStage: 'stage',
    friendshipGarden: 'garden'
  };

  const PALETTES = {
    space: ['#030713', '#101947', '#312568'],
    garden: ['#93d9ff', '#e9f8ff', '#6aa85f'],
    archive: ['#1d1730', '#4e396b', '#74543c'],
    harbor: ['#7fcdeb', '#e4fbff', '#185c7b'],
    sky: ['#77bddb', '#f1fbff', '#b6a06f'],
    design: ['#f2cfb4', '#fff7ed', '#a76f4f'],
    workshop: ['#4a3b34', '#9c7a61', '#352a27'],
    crystal: ['#211946', '#6d55a7', '#263c59'],
    time: ['#12183a', '#5e6eab', '#26334f'],
    water: ['#b9e7ef', '#eafcff', '#578e98'],
    community: ['#ffd7bd', '#fff5e9', '#c98958'],
    stage: ['#170e2c', '#4f214e', '#6f4c38']
  };

  const COLLECTIBLE_ICONS = {
    space: ['✦', '⭐', '🌟'],
    garden: ['🌸', '🌳', '🌼', '🦉'],
    archive: ['📜', '📖', '🔖'],
    harbor: ['🧭', '🗺️', '⚓'],
    sky: ['🗺️', '📍', '🧭'],
    design: ['📐', '📏', '✏️'],
    workshop: ['⚙️', '🔩', '🧰'],
    crystal: ['💎', '🔮', '✦'],
    time: ['⌛', '⏰', '🕰️'],
    water: ['💧', '🪷', '🪨'],
    community: ['💌', '🤝', '🎈'],
    stage: ['🎭', '🎤', '✨']
  };

  const FAMILY_DECOR = {
    space: ['✦', '✧', '🪐', '☄️'],
    garden: ['🌳', '🌸', '🦉', '🐎', '🐦'],
    archive: ['📚', '📜', '🕯️', '✦'],
    harbor: ['⛵', '🌊', '☁️', '🕊️'],
    sky: ['🗺️', '🧭', '☁️', '🏛️'],
    design: ['📐', '📏', '🏛️', '✏️'],
    workshop: ['⚙️', '🔩', '✨', '🧰'],
    crystal: ['💎', '✦', '🔮', '✨'],
    time: ['🕰️', '⌛', '🌙', '✦'],
    water: ['💧', '🪷', '🌫️', '🪨'],
    community: ['💌', '🏠', '🎈', '🤝'],
    stage: ['🎭', '🎤', '✨', '🎪']
  };

  const state = {
    canvas: null,
    ctx: null,
    scene: null,
    family: 'space',
    avatar: '🧭',
    notes: [],
    collectibles: [],
    particles: [],
    decor: [],
    keys: new Set(),
    pointer: null,
    player: { x: 130, y: 220, vx: 0, vy: 0, radius: 27 },
    width: 800,
    height: 520,
    dpr: 1,
    scroll: 0,
    distance: 0,
    collected: 0,
    paused: false,
    lastTime: 0,
    raf: 0,
    onCollect: null,
    onStats: null,
    cleanup: [],
    resizeObserver: null,
    statsAccumulator: 0
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    state.cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function resize() {
    if (!state.canvas) return;
    const rect = state.canvas.getBoundingClientRect();
    state.width = Math.max(320, rect.width);
    state.height = Math.max(320, rect.height);
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.canvas.width = Math.round(state.width * state.dpr);
    state.canvas.height = Math.round(state.height * state.dpr);
    state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.player.x = clamp(state.player.x, 55, state.width - 55);
    state.player.y = clamp(state.player.y, 55, state.height - 70);
  }

  function makeDecor(index = 0) {
    const icons = FAMILY_DECOR[state.family] || FAMILY_DECOR.space;
    return {
      icon: icons[index % icons.length],
      x: state.width + random(0, state.width),
      y: random(50, state.height - 75),
      speed: random(22, 68),
      size: random(20, 42),
      layer: Math.random() > 0.55 ? 1 : 0,
      phase: random(0, Math.PI * 2)
    };
  }

  function makeCollectible(index = 0) {
    const note = state.notes[index % Math.max(1, state.notes.length)] || 'Devam et.';
    return {
      x: state.width + 180 + index * random(180, 260),
      y: random(80, state.height - 105),
      radius: 25,
      speed: random(95, 128),
      note,
      icon: (COLLECTIBLE_ICONS[state.family] || ['◆'])[index % (COLLECTIBLE_ICONS[state.family] || ['◆']).length],
      pulse: random(0, Math.PI * 2),
      collected: false
    };
  }

  function resetObjects() {
    state.decor = Array.from({ length: 18 }, (_, i) => makeDecor(i));
    state.decor.forEach((item, i) => { item.x = (i / state.decor.length) * state.width + random(-25, 35); });
    state.collectibles = Array.from({ length: Math.max(7, state.notes.length + 3) }, (_, i) => makeCollectible(i));
    state.collectibles.forEach((item, i) => {
      item.x = i === 0 ? state.width * 0.72 : state.width + 140 + i * 190;
    });
    state.particles = [];
  }

  function drawGradientBackground(ctx, palette) {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.58, palette[1]);
    gradient.addColorStop(1, palette[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawSpace(ctx, time) {
    for (let layer = 0; layer < 3; layer += 1) {
      const spacing = 90 - layer * 18;
      const speed = 12 + layer * 20;
      const offset = (state.scroll * speed / 100) % spacing;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + layer * 0.2})`;
      for (let x = -offset; x < state.width + spacing; x += spacing) {
        const y = ((x * (1.7 + layer) + layer * 91) % (state.height - 40)) + 20;
        const r = 0.7 + layer * 0.65;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const planetX = state.width - ((state.scroll * 0.22) % (state.width + 320));
    const planetGradient = ctx.createRadialGradient(planetX - 25, 100, 10, planetX, 125, 72);
    planetGradient.addColorStop(0, '#ffd1ef');
    planetGradient.addColorStop(0.55, '#8d76dc');
    planetGradient.addColorStop(1, '#3a346c');
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(planetX, 125, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(227,214,255,.65)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(planetX, 125, 100, 25, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawGarden(ctx, time) {
    const hillOffset = (state.scroll * 0.18) % 360;
    ctx.fillStyle = 'rgba(82,140,91,.82)';
    for (let x = -360 - hillOffset; x < state.width + 360; x += 360) {
      ctx.beginPath();
      ctx.arc(x + 180, state.height * 0.72, 240, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4c874d';
    ctx.fillRect(0, state.height * 0.70, state.width, state.height * 0.3);
    const libraryX = state.width - ((state.scroll * 0.42) % (state.width + 500));
    ctx.fillStyle = '#e8d7b6';
    roundedRect(ctx, libraryX, state.height * 0.25, 330, 220, 18);
    ctx.fill();
    ctx.fillStyle = '#76534b';
    ctx.beginPath();
    ctx.moveTo(libraryX - 24, state.height * 0.25);
    ctx.lineTo(libraryX + 165, state.height * 0.10);
    ctx.lineTo(libraryX + 354, state.height * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(91,66,54,.22)';
    for (let i = 0; i < 6; i += 1) ctx.fillRect(libraryX + 30 + i * 48, state.height * 0.31, 18, 145);
    for (let x = -((state.scroll * 0.75) % 190); x < state.width + 190; x += 190) {
      ctx.font = '48px system-ui';
      ctx.fillText('🌳', x, state.height - 35);
      ctx.font = '24px system-ui';
      ctx.fillText(x % 380 < 100 ? '🌸' : '🌼', x + 72, state.height - 22);
    }
  }

  function drawHarbor(ctx, time) {
    const waterY = state.height * 0.56;
    ctx.fillStyle = '#1d6b8c';
    ctx.fillRect(0, waterY, state.width, state.height - waterY);
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 6; row += 1) {
      ctx.beginPath();
      for (let x = 0; x <= state.width; x += 18) {
        const y = waterY + 20 + row * 34 + Math.sin((x + state.scroll * (0.7 + row * 0.04)) * 0.035) * 5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const shipX = state.width - ((state.scroll * 0.55) % (state.width + 260));
    ctx.font = '72px system-ui';
    ctx.fillText('⛵', shipX, waterY + 18 + Math.sin(time * 0.002) * 5);
    ctx.fillStyle = '#8b674e';
    ctx.fillRect(0, waterY + 118, state.width * 0.46, 22);
  }

  function drawArchive(ctx, time) {
    const floorY = state.height * 0.72;
    ctx.fillStyle = '#614932';
    ctx.fillRect(0, floorY, state.width, state.height - floorY);
    const shelfWidth = 210;
    const offset = (state.scroll * 0.62) % shelfWidth;
    for (let x = -shelfWidth - offset; x < state.width + shelfWidth; x += shelfWidth) {
      ctx.fillStyle = '#4a3028';
      roundedRect(ctx, x, 75, 170, floorY - 82, 8);
      ctx.fill();
      for (let row = 0; row < 5; row += 1) {
        ctx.fillStyle = '#8b6044';
        ctx.fillRect(x + 10, 94 + row * 70, 150, 8);
        for (let b = 0; b < 8; b += 1) {
          const colors = ['#b66c56', '#d4a85f', '#6f6aa3', '#6d8b66'];
          ctx.fillStyle = colors[(row + b) % colors.length];
          ctx.fillRect(x + 17 + b * 17, 106 + row * 70, 11, 42 + ((b * 7) % 14));
        }
      }
    }
    ctx.fillStyle = 'rgba(255,224,165,.12)';
    ctx.beginPath();
    ctx.moveTo(state.width * 0.48, 0);
    ctx.lineTo(state.width * 0.72, floorY);
    ctx.lineTo(state.width * 0.28, floorY);
    ctx.closePath();
    ctx.fill();
  }

  function drawSky(ctx, time) {
    for (let x = -((state.scroll * 0.35) % 260); x < state.width + 260; x += 260) {
      ctx.font = '72px system-ui';
      ctx.globalAlpha = 0.58;
      ctx.fillText('☁️', x, 120 + Math.sin((x + time * 0.03) * 0.01) * 18);
      ctx.globalAlpha = 1;
    }
    const towerX = state.width - ((state.scroll * 0.46) % (state.width + 420));
    ctx.fillStyle = '#c5ad78';
    roundedRect(ctx, towerX, state.height * 0.22, 175, state.height * 0.62, 70);
    ctx.fill();
    ctx.font = '58px system-ui';
    ctx.fillText('🗺️', towerX + 58, state.height * 0.48);
  }

  function drawDesign(ctx, time) {
    ctx.strokeStyle = 'rgba(118,76,57,.12)';
    ctx.lineWidth = 1;
    const grid = 44;
    const offset = (state.scroll * 0.35) % grid;
    for (let x = -offset; x < state.width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.height); ctx.stroke(); }
    for (let y = 0; y < state.height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.width, y); ctx.stroke(); }
    for (let x = -((state.scroll * 0.62) % 260); x < state.width + 260; x += 260) {
      ctx.fillStyle = 'rgba(139,91,64,.18)';
      roundedRect(ctx, x, state.height * 0.26, 190, state.height * 0.52, 16);
      ctx.fill();
      ctx.font = '64px system-ui';
      ctx.fillText(x % 520 < 100 ? '📐' : '🏛️', x + 58, state.height * 0.58);
    }
  }

  function drawWorkshop(ctx, time) {
    const gears = [95, 185, 310, 470, 650, 820];
    gears.forEach((base, i) => {
      const x = base - ((state.scroll * (0.4 + i * 0.03)) % (state.width + 260));
      const wrapped = x < -120 ? x + state.width + 940 : x;
      ctx.save();
      ctx.translate(wrapped, 120 + (i % 3) * 130);
      ctx.rotate((time * 0.0005) * (i % 2 ? -1 : 1));
      ctx.font = `${62 + (i % 2) * 20}px system-ui`;
      ctx.fillText('⚙️', -35, 30);
      ctx.restore();
    });
    ctx.fillStyle = '#594334';
    ctx.fillRect(0, state.height * 0.78, state.width, state.height * 0.22);
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 83 - state.scroll * 1.3) % (state.width + 50);
      const y = 50 + ((i * 47) % Math.max(80, state.height - 140));
      ctx.fillStyle = 'rgba(255,206,113,.45)';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  function drawCrystal(ctx, time) {
    for (let x = -((state.scroll * 0.58) % 210); x < state.width + 210; x += 210) {
      const h = 110 + ((Math.abs(x) / 210) % 3) * 42;
      const y = state.height - 42;
      const gradient = ctx.createLinearGradient(x, y - h, x + 80, y);
      gradient.addColorStop(0, 'rgba(236,252,255,.92)');
      gradient.addColorStop(1, 'rgba(86,188,230,.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x + 40, y - h);
      ctx.lineTo(x + 82, y - h * 0.45);
      ctx.lineTo(x + 68, y);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y - h * 0.45);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawTime(ctx, time) {
    for (let x = -((state.scroll * 0.46) % 230); x < state.width + 230; x += 230) {
      ctx.font = '72px system-ui';
      ctx.globalAlpha = 0.45;
      ctx.fillText(x % 460 < 100 ? '🕰️' : '⌛', x, 130 + ((x / 230) % 3) * 110);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(255,255,255,.17)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.width * 0.68, state.height * 0.46, 100 + Math.sin(time * 0.001) * 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawWater(ctx, time) {
    const y0 = state.height * 0.52;
    ctx.fillStyle = '#5c929a';
    ctx.fillRect(0, y0, state.width, state.height - y0);
    for (let row = 0; row < 8; row += 1) {
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + row * 0.02})`;
      ctx.beginPath();
      for (let x = 0; x <= state.width; x += 12) {
        const y = y0 + row * 30 + Math.sin((x + state.scroll * 0.7 + row * 31) * 0.035) * 5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.font = '48px system-ui';
    for (let x = -((state.scroll * 0.45) % 250); x < state.width + 250; x += 250) ctx.fillText('🪷', x, y0 + 48);
  }

  function drawCommunity(ctx, time) {
    ctx.fillStyle = '#cb8c5a';
    ctx.fillRect(0, state.height * 0.76, state.width, state.height * 0.24);
    for (let x = -((state.scroll * 0.55) % 250); x < state.width + 250; x += 250) {
      ctx.font = '100px system-ui';
      ctx.fillText('🏠', x, state.height * 0.74);
      ctx.font = '32px system-ui';
      ctx.fillText('💌', x + 100, state.height * 0.45 + Math.sin((x + time * 0.04) * 0.02) * 15);
    }
  }

  function drawStage(ctx, time) {
    ctx.fillStyle = '#6b4b38';
    ctx.fillRect(0, state.height * 0.76, state.width, state.height * 0.24);
    ctx.fillStyle = '#8f2f59';
    ctx.fillRect(0, 0, 100, state.height * 0.78);
    ctx.fillRect(state.width - 100, 0, 100, state.height * 0.78);
    const spotlightX = state.width * 0.55 + Math.sin(time * 0.0007) * state.width * 0.18;
    const gradient = ctx.createLinearGradient(spotlightX, 0, spotlightX, state.height * 0.8);
    gradient.addColorStop(0, 'rgba(255,240,180,.4)');
    gradient.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(spotlightX - 18, 0);
    ctx.lineTo(spotlightX + 18, 0);
    ctx.lineTo(spotlightX + 210, state.height * 0.8);
    ctx.lineTo(spotlightX - 210, state.height * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  function drawWorld(ctx, time) {
    const palette = PALETTES[state.family] || PALETTES.space;
    drawGradientBackground(ctx, palette);
    switch (state.family) {
      case 'space': drawSpace(ctx, time); break;
      case 'garden': drawGarden(ctx, time); break;
      case 'harbor': drawHarbor(ctx, time); break;
      case 'archive': drawArchive(ctx, time); break;
      case 'sky': drawSky(ctx, time); break;
      case 'design': drawDesign(ctx, time); break;
      case 'workshop': drawWorkshop(ctx, time); break;
      case 'crystal': drawCrystal(ctx, time); break;
      case 'time': drawTime(ctx, time); break;
      case 'water': drawWater(ctx, time); break;
      case 'community': drawCommunity(ctx, time); break;
      case 'stage': drawStage(ctx, time); break;
      default: drawSpace(ctx, time);
    }
  }

  function drawDecor(ctx, dt, time) {
    state.decor.forEach((item, index) => {
      item.x -= item.speed * dt;
      if (item.x < -80) {
        Object.assign(item, makeDecor(index), { x: state.width + random(20, 260) });
      }
      const y = item.y + Math.sin(time * 0.0015 + item.phase) * 12;
      ctx.globalAlpha = item.layer ? 0.88 : 0.48;
      ctx.font = `${item.size}px system-ui`;
      ctx.fillText(item.icon, item.x, y);
      ctx.globalAlpha = 1;
    });
  }

  function collect(item) {
    if (item.collected) return;
    item.collected = true;
    state.collected += 1;
    state.onCollect?.(item.note, state.collected);
    for (let i = 0; i < 16; i += 1) {
      state.particles.push({
        x: item.x,
        y: item.y,
        vx: random(-100, 100),
        vy: random(-120, 60),
        life: random(0.45, 0.9),
        size: random(2, 6)
      });
    }
    setTimeout(() => {
      item.x = state.width + random(300, 900);
      item.y = random(75, state.height - 105);
      item.note = state.notes[Math.floor(Math.random() * Math.max(1, state.notes.length))] || item.note;
      item.collected = false;
    }, 650);
  }

  function drawCollectibles(ctx, dt, time) {
    state.collectibles.forEach(item => {
      if (item.collected) return;
      item.x -= item.speed * dt;
      item.pulse += dt * 4;
      if (item.x < -70) {
        item.x = state.width + random(260, 820);
        item.y = random(75, state.height - 105);
      }
      const y = item.y + Math.sin(item.pulse) * 8;
      const glow = 14 + Math.sin(item.pulse) * 4;
      ctx.save();
      ctx.shadowColor = 'rgba(255,243,171,.95)';
      ctx.shadowBlur = glow;
      ctx.fillStyle = 'rgba(255,248,194,.92)';
      ctx.beginPath();
      ctx.arc(item.x, y, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#5d4f8f';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, item.x, y + 1);
      const label = item.note.split(/\s+/).slice(0, 3).join(' ');
      ctx.font = '600 11px system-ui';
      const labelWidth = Math.min(145, ctx.measureText(label).width + 18);
      ctx.fillStyle = 'rgba(19,17,43,.72)';
      roundedRect(ctx, item.x - labelWidth / 2, y + 34, labelWidth, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label.length > 20 ? `${label.slice(0, 19)}…` : label, item.x, y + 46);
      ctx.restore();
      const dx = state.player.x - item.x;
      const dy = state.player.y - y;
      if (Math.hypot(dx, dy) < state.player.radius + item.radius - 5) collect(item);
    });
  }

  function drawParticles(ctx, dt) {
    state.particles = state.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 150 * dt;
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = '#fff3a6';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });
  }

  function updatePlayer(dt) {
    const speed = 260;
    let ax = 0;
    let ay = 0;
    if (state.keys.has('ArrowLeft') || state.keys.has('KeyA')) ax -= 1;
    if (state.keys.has('ArrowRight') || state.keys.has('KeyD')) ax += 1;
    if (state.keys.has('ArrowUp') || state.keys.has('KeyW')) ay -= 1;
    if (state.keys.has('ArrowDown') || state.keys.has('KeyS')) ay += 1;
    if (state.pointer) {
      const dx = state.pointer.x - state.player.x;
      const dy = state.pointer.y - state.player.y;
      ax += clamp(dx / 90, -1, 1);
      ay += clamp(dy / 90, -1, 1);
      if (Math.hypot(dx, dy) < 15) state.pointer = null;
    }
    const length = Math.hypot(ax, ay) || 1;
    if (ax || ay) {
      state.player.vx += (ax / length) * speed * dt * 4.5;
      state.player.vy += (ay / length) * speed * dt * 4.5;
    }
    state.player.vx *= Math.pow(0.0009, dt);
    state.player.vy *= Math.pow(0.0009, dt);
    state.player.x += state.player.vx * dt;
    state.player.y += state.player.vy * dt;
    state.player.x = clamp(state.player.x, 45, state.width - 45);
    state.player.y = clamp(state.player.y, 45, state.height - 58);
  }

  function drawPlayer(ctx, time) {
    const bob = Math.sin(time * 0.006) * 4;
    ctx.save();
    ctx.translate(state.player.x, state.player.y + bob);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.ellipse(-28, 1, 20, 10, -0.35, 0, Math.PI * 2);
    ctx.ellipse(28, 1, 20, 10, 0.35, 0, Math.PI * 2);
    ctx.fill();
    const bubble = ctx.createRadialGradient(-8, -10, 4, 0, 0, 36);
    bubble.addColorStop(0, 'rgba(255,255,255,.96)');
    bubble.addColorStop(0.72, 'rgba(255,255,255,.82)');
    bubble.addColorStop(1, 'rgba(188,218,255,.42)');
    ctx.fillStyle = bubble;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.72)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = state.family === 'space' ? '34px system-ui' : '31px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.family === 'space' ? '👩‍🚀' : state.avatar, 0, 2);
    ctx.restore();
  }

  function frame(timestamp) {
    if (!state.canvas || !state.ctx) return;
    const dt = Math.min(0.033, Math.max(0.001, (timestamp - (state.lastTime || timestamp)) / 1000));
    state.lastTime = timestamp;
    if (!state.paused) {
      state.scroll += dt * 135;
      state.distance += dt * 7.5;
      updatePlayer(dt);
    }
    const ctx = state.ctx;
    ctx.clearRect(0, 0, state.width, state.height);
    drawWorld(ctx, timestamp);
    drawDecor(ctx, state.paused ? 0 : dt, timestamp);
    drawCollectibles(ctx, state.paused ? 0 : dt, timestamp);
    drawParticles(ctx, state.paused ? 0 : dt);
    drawPlayer(ctx, timestamp);
    state.statsAccumulator += dt;
    if (state.statsAccumulator >= 0.1) {
      state.statsAccumulator = 0;
      state.onStats?.({ distance: Math.floor(state.distance), collected: state.collected, paused: state.paused });
    }
    state.raf = requestAnimationFrame(frame);
  }

  function pointerPosition(event) {
    const rect = state.canvas.getBoundingClientRect();
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return {
      x: (touch?.clientX ?? event.clientX) - rect.left,
      y: (touch?.clientY ?? event.clientY) - rect.top
    };
  }

  function start(options) {
    stop();
    state.canvas = options.canvas;
    state.ctx = state.canvas.getContext('2d');
    state.scene = options.scene || {};
    state.family = MODE_FAMILY[state.scene.mode] || 'space';
    state.avatar = options.avatar || '🧭';
    state.notes = Array.isArray(state.scene.notes) ? state.scene.notes : ['Devam et.'];
    state.onCollect = options.onCollect;
    state.onStats = options.onStats;
    state.keys = new Set();
    state.pointer = null;
    state.player = { x: 130, y: 220, vx: 0, vy: 0, radius: 27 };
    state.scroll = 0;
    state.distance = 0;
    state.collected = 0;
    state.paused = false;
    state.lastTime = 0;
    state.statsAccumulator = 0;
    resize();
    state.player.y = state.height * 0.52;
    resetObjects();

    const keydown = event => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
      if (event.code === 'Space') state.paused = !state.paused;
      else state.keys.add(event.code);
    };
    const keyup = event => state.keys.delete(event.code);
    const pointerdown = event => {
      event.preventDefault();
      state.pointer = pointerPosition(event);
      state.canvas.setPointerCapture?.(event.pointerId);
    };
    const pointermove = event => {
      if (event.buttons || event.pointerType === 'touch') state.pointer = pointerPosition(event);
    };
    const touchmove = event => {
      event.preventDefault();
      state.pointer = pointerPosition(event);
    };

    addListener(window, 'keydown', keydown);
    addListener(window, 'keyup', keyup);
    addListener(state.canvas, 'pointerdown', pointerdown);
    addListener(state.canvas, 'pointermove', pointermove);
    addListener(state.canvas, 'touchmove', touchmove, { passive: false });
    state.resizeObserver = new ResizeObserver(resize);
    state.resizeObserver.observe(state.canvas);
    state.raf = requestAnimationFrame(frame);
  }

  function setDirection(direction, active) {
    const map = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
    const code = map[direction];
    if (!code) return;
    if (active) state.keys.add(code); else state.keys.delete(code);
  }

  function togglePause() {
    state.paused = !state.paused;
    return state.paused;
  }

  function stop() {
    cancelAnimationFrame(state.raf);
    state.cleanup.splice(0).forEach(fn => fn());
    state.resizeObserver?.disconnect();
    state.resizeObserver = null;
    state.canvas = null;
    state.ctx = null;
    state.raf = 0;
  }

  window.LifeQuestFlow = { start, stop, setDirection, togglePause };
})();
