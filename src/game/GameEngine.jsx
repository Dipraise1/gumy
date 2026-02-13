import { useRef, useEffect, useState } from 'react';
import SoundManager from './SoundManager';

const GameEngine = ({ isActive, isPaused, score, setScore, setGameOver, charSrc }) => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 1024;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      if (isDesktop) {
        // PC: Fullscreen immersive mode
        setDimensions({ 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
      } else {
        // Mobile: Responsive sizing
        const width = isLandscape ? window.innerWidth : Math.min(window.innerWidth - 20, 1200);
        const height = isLandscape ? window.innerHeight : (width < 600 ? 320 : 500);
        setDimensions({ width, height });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------- GAME STATE ----------
  const state = useRef({
    speed: 2.5,
    distance: 0,
    frames: 0,
    dying: false,
    deathTimer: 0,
    landingFlash: 0,
    lastTime: 0,
    deltaTime: 0,
    player: {
      x: 80,
      y: 0,
      vy: 0,
      width: 48,
      height: 48,
      jumpsLeft: 4,
      maxJumps: 4,
      isJumping: false,
      jumpStrength: 15,
      gravity: 0.8,
      scaleX: 1,
      scaleY: 1,
      trail: [],
      invincible: false,
      invincibleTimer: 0,
      magnetActive: false,
      magnetTimer: 0,
      slowActive: false,
      slowTimer: 0,
    },
    obstacles: [],
    collectibles: [],
    powerups: [],
    particles: [],
    scorePopups: [],
    combo: { count: 0, timer: 0, maxCombo: 0 },
    shake: { x: 0, y: 0, intensity: 0 },
    milestoneNext: 500,
    nearMisses: 0,
    itemsCollected: 0,
    clouds: [],
    images: { player: new Image() },
    lastSpawnFrame: 0,
  });

  // Load character sprite
  useEffect(() => {
    if (charSrc) state.current.images.player.src = charSrc;
  }, [charSrc]);

  // Init clouds
  useEffect(() => {
    const clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * 2000,
        y: 25 + Math.random() * 100,
        w: 60 + Math.random() * 100,
        h: 18 + Math.random() * 25,
        spd: 0.1 + Math.random() * 0.3,
      });
    }
    state.current.clouds = clouds;
  }, []);

  // ---------- HELPERS ----------
  const lerp = (a, b, t) => a + (b - a) * t;

  const spawnParticles = (x, y, color, count = 5, type = 'dust') => {
    for (let i = 0; i < count; i++) {
      const spread = type === 'explosion' ? 8 : 4;
      state.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread - (type === 'dust' ? 2 : 0),
        life: 1.0,
        color,
        type,
        size: type === 'explosion' ? 3 + Math.random() * 5 : (type === 'sparkle' ? 2 + Math.random() * 3 : 3),
      });
    }
  };

  const addPopup = (x, y, text, color, size = 16) => {
    state.current.scorePopups.push({ x, y, text, life: 1.0, color, size });
  };

  const triggerShake = (intensity) => {
    state.current.shake.intensity = intensity;
  };

  // ---------- JUMP ----------
  const handleJump = () => {
    if (!isActive || isPaused) return;
    SoundManager.init();
    const { player } = state.current;
    if (player.jumpsLeft > 0) {
      player.scaleX = 0.75;
      player.scaleY = 1.3;
      const jumpNumber = player.maxJumps - player.jumpsLeft + 1;
      const isFirstJump = jumpNumber === 1;
      const isSecondJump = jumpNumber === 2;
      const isThirdJump = jumpNumber === 3;
      const isFourthJump = jumpNumber === 4;
      
      // Jump strength decreases with each jump
      player.vy = player.jumpStrength * (isFirstJump ? 1 : isSecondJump ? 0.85 : isThirdJump ? 0.75 : 0.65);
      player.isJumping = true;
      player.jumpsLeft--;
      
      spawnParticles(player.x + player.width / 2, player.y + player.height, 'rgba(160,160,160,0.5)', isFirstJump ? 8 : 12, 'dust');
      
      if (isFourthJump) {
        SoundManager.playDoubleJump();
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 'rgba(255,215,0,0.7)', 10, 'sparkle');
      } else if (isThirdJump) {
        SoundManager.playDoubleJump();
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 'rgba(200,100,255,0.6)', 8, 'sparkle');
      } else if (isSecondJump) {
        SoundManager.playDoubleJump();
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 'rgba(100,200,255,0.5)', 6, 'sparkle');
      } else {
        SoundManager.playJump();
      }
    }
  };

  // ---------- INPUT ----------
  useEffect(() => {
    const onTouch = (e) => {
      if (isActive && e.target.tagName === 'CANVAS') e.preventDefault();
      handleJump();
    };
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleJump(); }
    };
    const onMouse = () => handleJump();

    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouch, { passive: false });
    window.addEventListener('mousedown', onMouse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('mousedown', onMouse);
    };
  }, [isActive, isPaused]);

  // ---------- UPDATE GAME ----------
  const updateGame = (W, H) => {
    const GROUND = H - 40;
    const s = state.current;
    const { player, obstacles, collectibles, powerups, combo } = s;
    const spdMult = player.slowActive ? 0.6 : 1;
    const curSpd = Math.min(12, s.speed) * spdMult;

    // --- Player Physics ---
    player.y -= player.vy;
    player.vy -= player.gravity;

    if (player.y >= GROUND - player.height) {
      if (player.isJumping) {
        player.scaleX = 1.25;
        player.scaleY = 0.75;
        s.landingFlash = 0.7;
        spawnParticles(player.x + player.width / 2, GROUND, 'rgba(160,160,160,0.4)', 5, 'dust');
      }
      player.y = GROUND - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.jumpsLeft = player.maxJumps;
    }

    player.scaleX = lerp(player.scaleX, 1, 0.12);
    player.scaleY = lerp(player.scaleY, 1, 0.12);

    // Trail
    if (player.isJumping) {
      player.trail.unshift({ x: player.x, y: player.y, a: 0.5 });
      if (player.trail.length > 6) player.trail.pop();
    } else {
      player.trail.forEach(t => t.a -= 0.08 * s.deltaTime);
      player.trail = player.trail.filter(t => t.a > 0);
    }

    // Power-up timers
    if (player.invincible) { player.invincibleTimer -= s.deltaTime; if (player.invincibleTimer <= 0) player.invincible = false; }
    if (player.magnetActive) { player.magnetTimer -= s.deltaTime; if (player.magnetTimer <= 0) player.magnetActive = false; }
    if (player.slowActive) { player.slowTimer -= s.deltaTime; if (player.slowTimer <= 0) player.slowActive = false; }

    // Combo timer
    if (combo.count > 0) {
      combo.timer -= s.deltaTime;
      if (combo.timer <= 0) {
        if (combo.count > combo.maxCombo) combo.maxCombo = combo.count;
        combo.count = 0;
      }
    }

    // Landing flash decay
    if (s.landingFlash > 0) s.landingFlash -= 0.08 * s.deltaTime;

    // --- Spawning ---
    const spawnGap = Math.max(60, 80 - Math.floor(s.distance / 600));
    if (s.frames - s.lastSpawnFrame >= spawnGap && Math.random() > 0.35) {
      s.lastSpawnFrame = s.frames;
      const r = Math.random();

      if (r > 0.82 && s.distance > 600) {
        // Double pattern — needs double jump
        const h = 30 + Math.random() * 8;
        obstacles.push({ x: W, y: GROUND - h, width: 28, height: h, type: 'RUG', passed: false });
        obstacles.push({ x: W + 100, y: GROUND - h, width: 28, height: h, type: 'RUG', passed: false });
      } else if (r > 0.55) {
        const h = 48 + Math.random() * 20;
        obstacles.push({ x: W, y: GROUND - h, width: 26, height: h, type: 'REKT', passed: false });
      } else {
        const type = Math.random() > 0.5 ? 'RUG' : 'REKT';
        const h = type === 'RUG' ? 28 + Math.random() * 10 : 38 + Math.random() * 12;
        obstacles.push({ x: W, y: GROUND - h, width: 30, height: h, type, passed: false });
      }
    }

    // Collectibles
    if (s.frames % 110 === 0) {
      const r = Math.random();
      let type = 'GEM';
      if (r > 0.92) type = 'KEY';
      else if (r > 0.62) type = 'BOX';
      collectibles.push({ x: W, y: GROUND - 80 - Math.random() * 80, width: 26, height: 26, type, bob: Math.random() * Math.PI * 2 });
    }

    // Power-ups
    if (s.frames % 550 === 0 && Math.random() > 0.45 && s.distance > 400) {
      const types = ['SHIELD', 'MAGNET', 'SLOW'];
      const type = types[Math.floor(Math.random() * types.length)];
      powerups.push({ x: W, y: GROUND - 100 - Math.random() * 50, width: 30, height: 30, type, bob: Math.random() * Math.PI * 2 });
    }

    // --- Update Obstacles ---
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= curSpd;

      const pad = 6;
      if (player.x < o.x + o.width - pad && player.x + player.width > o.x + pad &&
          player.y < o.y + o.height - pad && player.y + player.height > o.y + pad) {
        if (player.invincible) {
          player.invincible = false;
          player.invincibleTimer = 0;
          spawnParticles(o.x + o.width / 2, o.y + o.height / 2, '#fbbf24', 18, 'explosion');
          addPopup(o.x, o.y - 20, 'BLOCKED!', '#fbbf24', 20);
          SoundManager.playShieldBreak();
          triggerShake(6);
          obstacles.splice(i, 1);
          continue;
        }
        // DEATH
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#ef4444', 35, 'explosion');
        spawnParticles(player.x + player.width / 2, player.y, '#fff', 12, 'sparkle');
        triggerShake(16);
        SoundManager.playDie();
        s.dying = true;
        s.deathTimer = 14;
        return;
      }

      // Near-miss
      if (!o.passed && o.x + o.width < player.x) {
        o.passed = true;
        const vGap = o.y - (player.y + player.height);
        const hGap = player.x - (o.x + o.width);
        if ((vGap >= 0 && vGap < 18) || (hGap >= 0 && hGap < 14)) {
          s.nearMisses++;
          setScore(sc => sc + 50);
          addPopup(o.x + o.width, o.y - 12, 'CLOSE! +50', '#f59e0b', 15);
          spawnParticles(o.x + o.width / 2, o.y, '#f59e0b', 8, 'sparkle');
          SoundManager.playNearMiss();
        }
      }

      if (o.x + o.width < -60) obstacles.splice(i, 1);
    }

    // --- Update Collectibles ---
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      c.x -= curSpd * 0.9;

      // Magnet pull
      if (player.magnetActive) {
        const dx = (player.x + player.width / 2) - (c.x + c.width / 2);
        const dy = (player.y + player.height / 2) - (c.y + c.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) { c.x += dx * 0.07; c.y += dy * 0.07; }
      }

      if (player.x < c.x + c.width && player.x + player.width > c.x &&
          player.y < c.y + c.height && player.y + player.height > c.y) {
        let pts = 100, color = '#06b6d4';
        if (c.type === 'KEY') { pts = 1000; color = '#eab308'; }
        if (c.type === 'BOX') { pts = 500; color = '#8b5cf6'; }

        combo.count++;
        combo.timer = 120;
        const mult = combo.count >= 10 ? 5 : combo.count >= 5 ? 3 : combo.count >= 2 ? 2 : 1;
        pts *= mult;

        setScore(sc => sc + pts);
        s.itemsCollected++;
        SoundManager.playScore(c.type);
        if (combo.count > 1) SoundManager.playCombo(combo.count);

        spawnParticles(c.x + c.width / 2, c.y + c.height / 2, color, 12, 'sparkle');
        addPopup(c.x, c.y - 15, `+${pts}${mult > 1 ? ' x' + mult : ''}`, color, mult > 1 ? 22 : 16);
        collectibles.splice(i, 1);
      } else if (c.x + c.width < -20) {
        collectibles.splice(i, 1);
      }
    }

    // --- Update Power-ups ---
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.x -= curSpd * 0.85;

      if (player.x < p.x + p.width && player.x + player.width > p.x &&
          player.y < p.y + p.height && player.y + player.height > p.y) {
        if (p.type === 'SHIELD') { player.invincible = true; player.invincibleTimer = 300; addPopup(p.x, p.y - 20, 'SHIELD!', '#fbbf24', 22); }
        else if (p.type === 'MAGNET') { player.magnetActive = true; player.magnetTimer = 480; addPopup(p.x, p.y - 20, 'MAGNET!', '#a855f7', 22); }
        else if (p.type === 'SLOW') { player.slowActive = true; player.slowTimer = 360; addPopup(p.x, p.y - 20, 'SLOW-MO!', '#3b82f6', 22); }
        spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#fff', 20, 'sparkle');
        SoundManager.playPowerUp();
        powerups.splice(i, 1);
      } else if (p.x + p.width < -20) {
        powerups.splice(i, 1);
      }
    }
  };

  // ---------- UPDATE EFFECTS ----------
  const updateEffects = (W) => {
    const s = state.current;

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * s.deltaTime;
      p.y += p.vy * s.deltaTime;
      p.life -= 0.03 * s.deltaTime;
      if (p.type === 'dust') { p.vy -= 0.15 * s.deltaTime; p.vx *= Math.pow(0.95, s.deltaTime); }
      else if (p.type === 'explosion') { p.vy += 0.15 * s.deltaTime; p.vx *= Math.pow(0.97, s.deltaTime); }
      else { p.vy += 0.08 * s.deltaTime; }
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // Score popups
    for (let i = s.scorePopups.length - 1; i >= 0; i--) {
      const p = s.scorePopups[i];
      p.y -= 1.2 * s.deltaTime;
      p.life -= 0.02 * s.deltaTime;
      if (p.life <= 0) s.scorePopups.splice(i, 1);
    }

    // Shake
    const sh = s.shake;
    if (sh.intensity > 0.5) {
      sh.x = (Math.random() - 0.5) * sh.intensity;
      sh.y = (Math.random() - 0.5) * sh.intensity;
      sh.intensity *= Math.pow(0.85, s.deltaTime);
    } else { sh.x = 0; sh.y = 0; sh.intensity = 0; }

    // Clouds
    s.clouds.forEach(c => {
      c.x -= c.spd * s.deltaTime;
      if (c.x + c.w < 0) { c.x = W + Math.random() * 200; c.y = 20 + Math.random() * 100; }
    });
  };

  // ---------- DRAW ----------
  const drawAll = (ctx, W, H) => {
    const GROUND = H - 40;
    const s = state.current;
    const { player, obstacles, collectibles, powerups, particles, scorePopups, combo, shake, clouds } = s;
    const time = s.frames * 0.05;
    const sp = Math.min(1, Math.max(0, (s.speed - 2.5) / 7)); // 0..1 speed progress

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Screen shake
    if (shake.intensity > 0) ctx.translate(shake.x, shake.y);

    // --- Sky Gradient ---
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${Math.floor(lerp(232, 28, sp))},${Math.floor(lerp(238, 22, sp))},${Math.floor(lerp(248, 52, sp))})`);
    sky.addColorStop(1, `rgb(${Math.floor(lerp(242, 55, sp))},${Math.floor(lerp(242, 30, sp))},${Math.floor(lerp(245, 42, sp))})`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // --- Clouds ---
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.35, 0.1, sp)})`;
    clouds.forEach(c => {
      ctx.beginPath(); ctx.ellipse(c.x + c.w / 2, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.3, c.y + 5, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.7, c.y + 3, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    });

    // --- Mountains (far parallax) ---
    const bg1 = (s.distance * 0.12) % W;
    ctx.fillStyle = `rgba(${Math.floor(lerp(195, 42, sp))},${Math.floor(lerp(195, 35, sp))},${Math.floor(lerp(205, 60, sp))},0.45)`;
    for (let i = 0; i <= 1; i++) {
      const off = i * W - bg1;
      ctx.beginPath(); ctx.moveTo(off, H);
      ctx.lineTo(off + W * 0.15, H - 130); ctx.lineTo(off + W * 0.3, H - 55);
      ctx.lineTo(off + W * 0.5, H - 150); ctx.lineTo(off + W * 0.7, H - 45);
      ctx.lineTo(off + W * 0.85, H - 110); ctx.lineTo(off + W, H - 65);
      ctx.lineTo(off + W, H); ctx.fill();
    }

    // --- Hills (mid parallax) ---
    const bg2 = (s.distance * 0.25) % W;
    ctx.fillStyle = `rgba(${Math.floor(lerp(175, 38, sp))},${Math.floor(lerp(175, 30, sp))},${Math.floor(lerp(185, 50, sp))},0.35)`;
    for (let i = 0; i <= 1; i++) {
      const off = i * W - bg2;
      ctx.beginPath(); ctx.moveTo(off, H);
      ctx.lineTo(off + W * 0.2, H - 75); ctx.lineTo(off + W * 0.4, H - 30);
      ctx.lineTo(off + W * 0.6, H - 85); ctx.lineTo(off + W * 0.8, H - 38);
      ctx.lineTo(off + W, H - 62); ctx.lineTo(off + W, H); ctx.fill();
    }

    // --- Ground ---
    const gfill = ctx.createLinearGradient(0, GROUND, 0, H);
    gfill.addColorStop(0, `rgba(${Math.floor(lerp(100, 55, sp))},${Math.floor(lerp(100, 45, sp))},${Math.floor(lerp(100, 55, sp))},0.25)`);
    gfill.addColorStop(1, `rgba(${Math.floor(lerp(100, 55, sp))},${Math.floor(lerp(100, 45, sp))},${Math.floor(lerp(100, 55, sp))},0.08)`);
    ctx.fillStyle = gfill;
    ctx.fillRect(0, GROUND, W, H - GROUND);

    // Ground line
    ctx.strokeStyle = `rgba(${Math.floor(lerp(80, 200, sp))},${Math.floor(lerp(80, 180, sp))},${Math.floor(lerp(80, 180, sp))},0.7)`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

    // Ground hash marks
    ctx.fillStyle = `rgba(${Math.floor(lerp(150, 120, sp))},${Math.floor(lerp(150, 110, sp))},${Math.floor(lerp(150, 110, sp))},0.35)`;
    for (let i = 0; i < 24; i++) {
      const rx = ((i * 90) - s.distance * 1.2) % (W + 100);
      const lx = rx < 0 ? rx + W + 100 : rx;
      ctx.fillRect(lx, GROUND + 6 + (i % 3) * 5, 10 + (i % 2) * 8, 2);
    }

    // Landing flash
    if (s.landingFlash > 0) {
      ctx.globalAlpha = s.landingFlash;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(player.x - 12, GROUND - 3, player.width + 24, 6);
      ctx.globalAlpha = 1;
    }

    // --- Distance markers ---
    for (let i = 0; i < 6; i++) {
      const mx = ((i * 250) - s.distance * 0.9) % (W + 300);
      const lmx = mx < 0 ? mx + W + 300 : mx;
      if (lmx < W) {
        ctx.fillStyle = `rgba(${Math.floor(lerp(180, 140, sp))},${Math.floor(lerp(180, 130, sp))},${Math.floor(lerp(180, 130, sp))},0.25)`;
        ctx.fillRect(lmx, GROUND - 10, 2, 10);
      }
    }

    // --- Speed Lines ---
    const sFactor = Math.min(1, Math.max(0, (s.speed - 3.5) / 5));
    if (sFactor > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${sFactor * 0.25})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const slx = ((i * 180) - s.distance * 2.2) % (W + 200);
        const sly = 40 + (i * 67) % (GROUND - 80);
        const llx = slx < 0 ? slx + W + 200 : slx;
        ctx.beginPath(); ctx.moveTo(llx, sly); ctx.lineTo(llx + 25 + sFactor * 45, sly); ctx.stroke();
      }
    }

    // --- Obstacles ---
    obstacles.forEach(o => {
      ctx.shadowColor = o.type === 'RUG' ? '#ef4444' : '#9333ea';
      ctx.shadowBlur = 6;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(o.x + 3, o.y + 3, o.width, o.height);
      // Body
      const clr = o.type === 'RUG' ? '#ef4444' : '#9333ea';
      ctx.fillStyle = clr;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.width - r, o.y);
      ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + r);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.lineTo(o.x, o.y + o.height);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(o.x + 2, o.y + 2, o.width - 4, o.height * 0.3);
      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${o.height > 40 ? 11 : 9}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.type, o.x + o.width / 2, o.y + o.height / 2);
    });
    ctx.shadowBlur = 0;

    // --- Power-ups ---
    powerups.forEach(p => {
      const bob = Math.sin(time + p.bob) * 7;
      const py = p.y + bob;
      const clr = p.type === 'SHIELD' ? '#fbbf24' : p.type === 'MAGNET' ? '#a855f7' : '#3b82f6';
      // Glow ring
      ctx.shadowColor = clr; ctx.shadowBlur = 18;
      ctx.fillStyle = clr.replace(')', ',0.25)').replace('rgb', 'rgba');
      ctx.beginPath(); ctx.arc(p.x + p.width / 2, py + p.height / 2, 20, 0, Math.PI * 2); ctx.fill();
      // Rotating ring
      ctx.strokeStyle = `${clr}80`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x + p.width / 2, py + p.height / 2, 16 + Math.sin(time * 2) * 3, 0, Math.PI * 2); ctx.stroke();
      // Icon
      ctx.shadowBlur = 0;
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const icon = p.type === 'SHIELD' ? '\u{1F6E1}\uFE0F' : p.type === 'MAGNET' ? '\u{1F9F2}' : '\u23F3';
      ctx.fillText(icon, p.x + p.width / 2, py + p.height / 2);
    });

    // --- Collectibles ---
    collectibles.forEach(c => {
      const bob = Math.sin(time + c.bob) * 5;
      const cy = c.y + bob;
      let color = '#06b6d4', icon = '\u{1F48E}';
      if (c.type === 'KEY') { color = '#eab308'; icon = '\u{1F511}'; }
      if (c.type === 'BOX') { color = '#8b5cf6'; icon = '\u{1F4E6}'; }
      // Glow
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      const pulse = 1 + Math.sin(time * 2.5 + c.bob) * 0.12;
      ctx.font = `${Math.floor(22 * pulse)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(icon, c.x + c.width / 2, cy + c.height / 2);
      ctx.shadowBlur = 0;
    });

    // --- Player ---
    // Trail
    player.trail.forEach(t => {
      ctx.globalAlpha = t.a * 0.25;
      if (s.images.player.complete && s.images.player.naturalWidth > 0) {
        ctx.drawImage(s.images.player, t.x, t.y, player.width, player.height);
      } else {
        ctx.fillStyle = '#535353'; ctx.fillRect(t.x, t.y, player.width, player.height);
      }
    });
    ctx.globalAlpha = 1;

    // Shield bubble
    if (player.invincible) {
      const shimmer = 0.5 + Math.sin(time * 3) * 0.3;
      ctx.strokeStyle = `rgba(251,191,36,${shimmer})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.72, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      // Flashing when about to expire
      if (player.invincibleTimer < 60 && Math.floor(time * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
    }

    // Magnet range ring
    if (player.magnetActive) {
      ctx.strokeStyle = `rgba(168,85,247,${0.15 + Math.sin(time * 2) * 0.08})`;
      ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 220, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Slow-mo blue tint
    if (player.slowActive) {
      ctx.fillStyle = `rgba(59,130,246,${0.04 + Math.sin(time) * 0.02})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Player body (squash/stretch + running bob + jump tilt)
    ctx.save();
    const px = player.x + player.width / 2;
    const py2 = player.y + player.height;
    ctx.translate(px, py2);
    ctx.scale(player.scaleX, player.scaleY);
    // Running bob
    let bobY = 0;
    if (!player.isJumping) bobY = Math.sin(s.frames * 0.18) * 2;
    // Jump tilt
    if (player.isJumping) ctx.rotate(player.vy * 0.015);
    ctx.translate(-px, -py2);
    if (s.images.player.complete && s.images.player.naturalWidth > 0) {
      ctx.drawImage(s.images.player, player.x, player.y + bobY, player.width, player.height);
    } else {
      ctx.fillStyle = '#535353';
      ctx.fillRect(player.x, player.y + bobY, player.width, player.height);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Jump indicator dots
    if (player.isJumping) {
      for (let j = 0; j < player.maxJumps; j++) {
        ctx.fillStyle = j < player.jumpsLeft ? 'rgba(16,185,129,0.85)' : 'rgba(150,150,150,0.3)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2 - 22.5 + j * 15, player.y - 12, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Particles ---
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.type === 'sparkle') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * Math.PI * 2);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;

    // --- Score Popups ---
    scorePopups.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = `bold ${p.size}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;

    // --- Canvas HUD ---
    // Combo
    if (combo.count >= 2) {
      const mult = combo.count >= 10 ? 5 : combo.count >= 5 ? 3 : 2;
      const cAlpha = Math.min(1, combo.timer / 30);
      ctx.globalAlpha = cAlpha;
      const cColor = combo.count >= 10 ? '#ef4444' : combo.count >= 5 ? '#f59e0b' : '#06b6d4';

      // Multiplier badge
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.roundRect(W - 110, 18, 95, 55, 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(W - 112, 16, 95, 55, 10);
      ctx.fill();

      ctx.fillStyle = cColor;
      ctx.font = 'bold 26px monospace'; ctx.textAlign = 'right';
      ctx.fillText(`${mult}x`, W - 24, 42);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(`${combo.count} COMBO`, W - 24, 58);

      // Timer bar
      const bw = 75, bf = (combo.timer / 120) * bw;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(W - 24 - bw, 64, bw, 3);
      ctx.fillStyle = cColor;
      ctx.fillRect(W - 24 - bw, 64, bf, 3);
      ctx.globalAlpha = 1;
    }

    // Active power-up timers
    let puY = combo.count >= 2 ? 86 : 30;
    const drawPuTimer = (label, timer, color) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(W - 90, puY - 10, 75, 22, 6);
      ctx.fill();
      ctx.fillStyle = color; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right';
      ctx.fillText(`${label} ${(timer / 60).toFixed(1)}s`, W - 22, puY + 4);
      puY += 26;
    };
    if (player.invincible) drawPuTimer('\u{1F6E1}\uFE0F', player.invincibleTimer, 'rgba(251,191,36,0.9)');
    if (player.magnetActive) drawPuTimer('\u{1F9F2}', player.magnetTimer, 'rgba(168,85,247,0.9)');
    if (player.slowActive) drawPuTimer('\u23F3', player.slowTimer, 'rgba(59,130,246,0.9)');

    // --- Vignette at high speed ---
    if (sFactor > 0.2) {
      const va = (sFactor - 0.2) * 0.35;
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, `rgba(0,0,0,${va})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  };

  // ---------- ANIMATE ----------
  const animate = (currentTime) => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const s = state.current;
    
    // Calculate delta time (target 60 FPS = 16.67ms per frame)
    if (!s.lastTime) s.lastTime = currentTime;
    const deltaMs = currentTime - s.lastTime;
    s.lastTime = currentTime;
    // Delta multiplier: 1.0 at 60fps, 0.5 at 120fps, 2.0 at 30fps
    s.deltaTime = deltaMs / 16.67;

    // Paused
    if (isPaused) {
      drawAll(ctx, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, W, H);
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Death sequence
    if (s.dying) {
      s.deathTimer -= s.deltaTime;
      updateEffects(W);
      drawAll(ctx, W, H);
      // Red flash
      const flashA = s.deathTimer > 10 ? 0.15 : 0;
      if (flashA > 0) { ctx.fillStyle = `rgba(239,68,68,${flashA})`; ctx.fillRect(0, 0, W, H); }
      if (s.deathTimer <= 0) { setGameOver(true); return; }
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Normal frame
    s.frames++;
    const spdMult = s.player.slowActive ? 0.6 : 1;
    s.distance += s.speed * spdMult * s.deltaTime;
    s.speed += 0.00012 * s.deltaTime;
    setScore(Math.floor(s.distance / 10));

    // Milestones
    const cs = Math.floor(s.distance / 10);
    if (cs >= s.milestoneNext) {
      s.milestoneNext += 500;
      addPopup(W / 2, H / 3, `${cs} GUBS!`, '#10b981', 26);
      SoundManager.playMilestone();
      spawnParticles(W / 2, H / 3, '#10b981', 14, 'sparkle');
    }

    updateGame(W, H);
    updateEffects(W);
    drawAll(ctx, W, H);
    requestRef.current = requestAnimationFrame(animate);
  };

  // ---------- LIFECYCLE ----------
  useEffect(() => {
    if (isActive) {
      const GROUND = dimensions.height - 40;
      const s = state.current;
      const p = s.player;
      p.y = GROUND - p.height; p.vy = 0;
      p.isJumping = false; p.jumpsLeft = p.maxJumps;
      p.scaleX = 1; p.scaleY = 1; p.trail = [];
      p.invincible = false; p.invincibleTimer = 0;
      p.magnetActive = false; p.magnetTimer = 0;
      p.slowActive = false; p.slowTimer = 0;
      s.obstacles = []; s.collectibles = []; s.powerups = [];
      s.particles = []; s.scorePopups = [];
      s.distance = 0; s.speed = 2.5; s.frames = 0;
      s.combo = { count: 0, timer: 0, maxCombo: 0 };
      s.shake = { x: 0, y: 0, intensity: 0 };
      s.milestoneNext = 500;
      s.nearMisses = 0; s.itemsCollected = 0;
      s.lastSpawnFrame = 0;
      s.dying = false; s.deathTimer = 0; s.landingFlash = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      const canvas = canvasRef.current;
      if (canvas) drawAll(canvas.getContext('2d'), canvas.width, canvas.height);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, dimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`max-w-full ${dimensions.width > 1024 ? 'fixed inset-0 w-screen h-screen' : 'rounded-b-lg'}`}
      style={{ display: 'block', touchAction: 'none' }}
    />
  );
};

export default GameEngine;
