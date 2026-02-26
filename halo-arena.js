const arenaDom = {
  canvas: document.getElementById("arenaCanvas"),
  score: document.getElementById("haScore"),
  health: document.getElementById("haHealth"),
  wave: document.getElementById("haWave"),
  weapon: document.getElementById("haWeapon"),
  dash: document.getElementById("haDash"),
  pulse: document.getElementById("haPulse"),
  fullscreenBtn: document.getElementById("haFullscreenBtn"),
  restartBtn: document.getElementById("haRestartBtn"),
  overlay: document.getElementById("haOverlay"),
  overlayTitle: document.getElementById("haOverlayTitle"),
  overlayText: document.getElementById("haOverlayText"),
  overlayBtn: document.getElementById("haOverlayBtn"),
  upgrade: document.getElementById("haUpgrade"),
  upgradeText: document.getElementById("haUpgradeText"),
  upg1: document.getElementById("haUpg1"),
  upg2: document.getElementById("haUpg2"),
  upg3: document.getElementById("haUpg3"),
  upg4: document.getElementById("haUpg4"),
  upg5: document.getElementById("haUpg5"),
  upg6: document.getElementById("haUpg6"),
};

if (arenaDom.canvas) {
  const ctx = arenaDom.canvas.getContext("2d");
  const WIDTH = arenaDom.canvas.width;
  const HEIGHT = arenaDom.canvas.height;
  const fullscreenTarget = arenaDom.canvas.closest(".game-shell") || arenaDom.canvas;

  const keys = new Set();
  const aim = { x: 0, y: -1, angle: -Math.PI / 2 };

  const THEMES = [
    {
      name: "Nebula Rift",
      top: "#071d34",
      bottom: "#0a101d",
      haze: "rgba(75, 145, 255, 0.2)",
      planet: "rgba(140, 194, 255, 0.35)",
      starTint: "rgba(185,220,255,0.95)",
    },
    {
      name: "Crimson Orbit",
      top: "#2a0f22",
      bottom: "#100914",
      haze: "rgba(255, 88, 142, 0.2)",
      planet: "rgba(255, 138, 161, 0.32)",
      starTint: "rgba(255,220,230,0.95)",
    },
    {
      name: "Emerald Expanse",
      top: "#0c2a1e",
      bottom: "#06120f",
      haze: "rgba(74, 215, 160, 0.2)",
      planet: "rgba(132, 255, 199, 0.32)",
      starTint: "rgba(214,255,236,0.95)",
    },
    {
      name: "Violet Void",
      top: "#24183f",
      bottom: "#0d0b1c",
      haze: "rgba(159, 136, 255, 0.22)",
      planet: "rgba(199, 175, 255, 0.32)",
      starTint: "rgba(235,225,255,0.95)",
    },
  ];

  const ENEMY_TYPES = {
    scout: {
      label: "Scout",
      color: "#57d4ff",
      hp: (stage) => 30 + stage * 5,
      speed: (stage) => 1.7 + stage * 0.07,
      shootCooldown: 1400,
      score: 22,
    },
    striker: {
      label: "Striker",
      color: "#ff8b52",
      hp: (stage) => 42 + stage * 7,
      speed: (stage) => 1.3 + stage * 0.06,
      shootCooldown: 1200,
      score: 30,
    },
    bomber: {
      label: "Bomber",
      color: "#c58aff",
      hp: (stage) => 78 + stage * 13,
      speed: (stage) => 0.9 + stage * 0.03,
      shootCooldown: 1700,
      score: 44,
    },
    sniper: {
      label: "Sniper",
      color: "#ffe173",
      hp: (stage) => 50 + stage * 8,
      speed: (stage) => 1.1 + stage * 0.04,
      shootCooldown: 2100,
      score: 50,
    },
    interceptor: {
      label: "Interceptor",
      color: "#7eff93",
      hp: (stage) => 36 + stage * 6,
      speed: (stage) => 2.2 + stage * 0.09,
      shootCooldown: 1600,
      score: 38,
    },
  };

  const BOSS_VARIANTS = [
    {
      id: "titan",
      name: "Titan Dreadnought",
      primary: "#ffb980",
      secondary: "#ffdcae",
      laserColor: "rgba(255,120,120,",
      radius: 56,
      baseHp: 900,
      hpScale: 140,
    },
    {
      id: "seraph",
      name: "Seraph Stormcore",
      primary: "#9fc7ff",
      secondary: "#d9e8ff",
      laserColor: "rgba(122,164,255,",
      radius: 54,
      baseHp: 980,
      hpScale: 150,
    },
    {
      id: "wraith",
      name: "Wraith Harbinger",
      primary: "#d39cff",
      secondary: "#f0d7ff",
      laserColor: "rgba(220,140,255,",
      radius: 52,
      baseHp: 860,
      hpScale: 132,
    },
  ];

  const UPGRADE_OPTIONS_PER_STAGE = 6;

  const UPGRADE_POOL = [
    {
      title: "Rapid Cannon",
      desc: "יורה מהר יותר ב־20%",
      apply: (player) => {
        player.fireRate *= 0.8;
      },
    },
    {
      title: "Twin Cannons",
      desc: "+2 קליעים לכל ירייה",
      apply: (player) => {
        player.shotCount = Math.min(player.shotCount + 2, 12);
      },
    },
    {
      title: "Armor Plating",
      desc: "+45 חיים מקסימליים וריפוי חזק",
      apply: (player) => {
        player.maxHp += 45;
        player.hp = Math.min(player.maxHp, player.hp + 80);
      },
    },
    {
      title: "High Caliber",
      desc: "נזק קליעים +35%",
      apply: (player) => {
        player.bulletDamage *= 1.35;
      },
    },
    {
      title: "Ion Engines",
      desc: "מהירות תנועה +20%",
      apply: (player) => {
        player.speed *= 1.2;
      },
    },
    {
      title: "Shield Core",
      desc: "מוסיף 2 שכבות מגן",
      apply: (player) => {
        player.shieldLayers = Math.min(player.shieldLayers + 2, 8);
      },
    },
    {
      title: "Pulse Reactor",
      desc: "Pulse חזק יותר, רחב יותר וקירור מהיר",
      apply: (player) => {
        player.pulsePower *= 1.35;
        player.pulseRadius *= 1.14;
        player.pulseCooldownBase *= 0.82;
      },
    },
    {
      title: "Dash Thrusters",
      desc: "Dash חזק יותר וקירור קצר מאוד",
      apply: (player) => {
        player.dashPower *= 1.28;
        player.dashCooldownBase *= 0.78;
      },
    },
    {
      title: "Hyper Overdrive",
      desc: "אש מהירה במיוחד ונזק נוסף",
      apply: (player) => {
        player.fireRate *= 0.72;
        player.bulletDamage *= 1.22;
      },
    },
    {
      title: "Arc Shot",
      desc: "זווית ירי רחבה יותר ועוד 2 קליעים",
      apply: (player) => {
        player.shotCount = Math.min(player.shotCount + 2, 14);
        player.spread *= 1.25;
      },
    },
    {
      title: "Fortress Hull",
      desc: "+90 חיים מקסימליים ושכבת מגן",
      apply: (player) => {
        player.maxHp += 90;
        player.hp = Math.min(player.maxHp, player.hp + 110);
        player.shieldLayers = Math.min(player.shieldLayers + 1, 8);
      },
    },
    {
      title: "Titan Core",
      desc: "נזק +50% ומהירות קליע +18%",
      apply: (player) => {
        player.bulletDamage *= 1.5;
        player.bulletSpeed *= 1.18;
      },
    },
    {
      title: "Vampire Rounds",
      desc: "ריפוי מיידי גדול + קצב ירי",
      apply: (player) => {
        player.hp = Math.min(player.maxHp, player.hp + 140);
        player.fireRate *= 0.9;
      },
    },
    {
      title: "Shock Pulse",
      desc: "Pulse חזק מאוד וטווח ענק",
      apply: (player) => {
        player.pulsePower *= 1.5;
        player.pulseRadius *= 1.22;
      },
    },
    {
      title: "Blink Drive",
      desc: "Dash כמעט ללא קירור",
      apply: (player) => {
        player.dashPower *= 1.35;
        player.dashCooldownBase *= 0.66;
      },
    },
    {
      title: "Nano Repair",
      desc: "ריפוי מלא ועוד +50 מקסימום",
      apply: (player) => {
        player.maxHp += 50;
        player.hp = player.maxHp;
      },
    },
    {
      title: "Storm Barrage",
      desc: "המון קליעים + אש מהירה",
      apply: (player) => {
        player.shotCount = Math.min(player.shotCount + 3, 14);
        player.fireRate *= 0.78;
      },
    },
    {
      title: "Quantum Shields",
      desc: "מעניק 3 שכבות מגן",
      apply: (player) => {
        player.shieldLayers = Math.min(player.shieldLayers + 3, 10);
      },
    },
    {
      title: "Final Form",
      desc: "שדרוג קיצוני לכל היכולות",
      apply: (player) => {
        player.fireRate *= 0.78;
        player.bulletDamage *= 1.35;
        player.speed *= 1.15;
        player.shotCount = Math.min(player.shotCount + 2, 14);
        player.pulsePower *= 1.2;
        player.hp = Math.min(player.maxHp, player.hp + 80);
      },
    },
  ];

  const state = {
    running: true,
    stage: 1,
    score: 0,
    stars: [],
    planets: [],
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [],
    pickups: [],
    stageSpawned: 0,
    stageDefeated: 0,
    stageGoal: 12,
    stageSpawnCooldown: 300,
    stageCompleted: false,
    isBossStage: false,
    boss: null,
    bossContactTick: 0,
    bossLaserTick: 0,
    availableUpgrades: [],
    player: {
      x: WIDTH / 2,
      y: HEIGHT * 0.8,
      radius: 17,
      speed: 4.3,
      hp: 320,
      maxHp: 320,
      fireRate: 130,
      bulletDamage: 20,
      bulletSpeed: 11,
      shotCount: 1,
      spread: 0.11,
      fireCooldown: 0,
      invuln: 0,
      dashCooldown: 0,
      pulseCooldown: 0,
      dashPower: 13,
      dashCooldownBase: 2800,
      pulsePower: 90,
      pulseRadius: 145,
      pulseCooldownBase: 5200,
      pulseFlash: 0,
      shieldLayers: 0,
      tempRapid: 0,
      tempSpread: 0,
      tempPower: 0,
    },
  };

  let lastTime = performance.now();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randFromSeed(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function setAimVector(x, y) {
    const length = Math.hypot(x, y) || 1;
    aim.x = x / length;
    aim.y = y / length;
    aim.angle = Math.atan2(aim.y, aim.x);
  }

  function updateAutoAim() {
    const player = state.player;

    const targets = state.enemies.map((enemy) => ({ x: enemy.x, y: enemy.y }));
    if (state.boss) {
      targets.push({ x: state.boss.x, y: state.boss.y });
    }

    if (targets.length === 0) {
      return;
    }

    let bestTarget = targets[0];
    let bestDistance = Infinity;
    targets.forEach((target) => {
      const dist = distance(player.x, player.y, target.x, target.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestTarget = target;
      }
    });

    setAimVector(bestTarget.x - player.x, bestTarget.y - player.y);
  }

  function getTheme() {
    return THEMES[(state.stage - 1) % THEMES.length];
  }

  function initStars() {
    state.stars = [];
    for (let i = 0; i < 230; i += 1) {
      state.stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 1.7 + 0.3,
        depth: 0.25 + Math.random() * 1.35,
      });
    }
  }

  function initPlanetsForStage() {
    state.planets = [];
    for (let i = 0; i < 3; i += 1) {
      const seed = state.stage * 17.31 + i * 29.77;
      state.planets.push({
        x: 100 + randFromSeed(seed) * (WIDTH - 200),
        y: 90 + randFromSeed(seed + 12.2) * 180,
        r: 44 + randFromSeed(seed + 41.7) * 85,
        alpha: 0.12 + randFromSeed(seed + 95.5) * 0.22,
      });
    }
  }

  function showOverlay(title, text) {
    arenaDom.overlayTitle.textContent = title;
    arenaDom.overlayText.textContent = text;
    arenaDom.overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    arenaDom.overlay.classList.add("hidden");
  }

  function showUpgradeSelection(upgrades) {
    state.running = false;
    state.availableUpgrades = upgrades;
    arenaDom.upgradeText.textContent = `שלב ${state.stage} הושלם — בחר שדרוג אחד מתוך ${UPGRADE_OPTIONS_PER_STAGE}`;

    const buttons = [arenaDom.upg1, arenaDom.upg2, arenaDom.upg3, arenaDom.upg4, arenaDom.upg5, arenaDom.upg6];
    buttons.forEach((button, index) => {
      const option = upgrades[index];
      if (!button) {
        return;
      }

      if (!option) {
        button.classList.add("hidden");
        return;
      }

      button.classList.remove("hidden");
      button.textContent = `${option.title} — ${option.desc}`;
    });

    arenaDom.upgrade.classList.remove("hidden");
  }

  function hideUpgradeSelection() {
    arenaDom.upgrade.classList.add("hidden");
  }

  function updateHud() {
    const player = state.player;

    arenaDom.score.textContent = Math.floor(state.score);
    arenaDom.health.textContent = Math.max(0, Math.floor(player.hp));
    arenaDom.wave.textContent = state.stage;

    const spreadBonus = player.tempSpread > 0 ? " +Spread" : "";
    arenaDom.weapon.textContent = `Plane Cannon x${player.shotCount}${spreadBonus}`;
    arenaDom.dash.textContent = player.dashCooldown <= 0 ? "Ready" : `${(player.dashCooldown / 1000).toFixed(1)}s`;
    arenaDom.pulse.textContent = player.pulseCooldown <= 0 ? "Ready" : `${(player.pulseCooldown / 1000).toFixed(1)}s`;
  }

  function stageGoalFor(stage) {
    return 10 + stage * 4;
  }

  function getEnemyStageScaling(stage) {
    const stageProgress = Math.max(0, stage - 1);
    return {
      hp: 1 + stageProgress * 0.4,
      speed: Math.min(1.22, 1 + stageProgress * 0.02),
      damage: 1 + stageProgress * 0.28,
      fireCooldown: 1,
      contactDamage: (18 + stage * 1.3) * (1 + stageProgress * 0.18),
    };
  }

  function getBossStageScaling(stage, bossTier) {
    const stageProgress = Math.max(0, stage - 1);
    const tierProgress = Math.max(0, bossTier - 1);
    return {
      hp: 1.5 + stageProgress * 0.55 + tierProgress * 1.0,
      damage: 1.3 + stageProgress * 0.32 + tierProgress * 0.55,
      fireRate: 1,
      bulletSpeed: 1,
      contactDamage: (34 + stage * 1.8) * (1 + stageProgress * 0.16 + tierProgress * 0.35),
      laserDamage: (16 + stage * 1.4) * (1 + stageProgress * 0.14 + tierProgress * 0.28),
    };
  }

  function isBossStage(stage) {
    return stage % 3 === 0;
  }

  function getBossVariantForStage(stage) {
    const cycleIndex = Math.max(0, Math.floor(stage / 3) - 1);
    return BOSS_VARIANTS[cycleIndex % BOSS_VARIANTS.length];
  }

  function getBossTier(stage) {
    return Math.max(1, Math.floor(stage / 3));
  }

  function spawnBoss() {
    const variant = getBossVariantForStage(state.stage);
    const bossTier = getBossTier(state.stage);
    const scaling = getBossStageScaling(state.stage, bossTier);
    const tierHpBoost = 1 + (bossTier - 1) * 0.28;
    const hp = (variant.baseHp + state.stage * variant.hpScale) * tierHpBoost * scaling.hp;
    state.boss = {
      x: WIDTH / 2,
      y: 92,
      radius: variant.radius,
      variant,
      tier: bossTier,
      damageScale: (1 + (bossTier - 1) * 0.24) * scaling.damage,
      fireRateScale: Math.max(0.25, Math.max(0.5, 1 - (bossTier - 1) * 0.08) * scaling.fireRate),
      bulletSpeedScale: scaling.bulletSpeed,
      contactDamage: scaling.contactDamage,
      laserTickDamage: scaling.laserDamage,
      hp,
      maxHp: hp,
      phase: 0,
      burstCooldown: 900,
      missileCooldown: 1300,
      jumpCooldown: 1800,
      laser: {
        mode: "idle",
        timer: 1800,
        angle: Math.PI / 2,
        sweepDir: 1,
      },
    };
    addParticles(state.boss.x, state.boss.y, variant.secondary, 28, 2.7);
  }

  function resetStageProgress() {
    state.isBossStage = isBossStage(state.stage);
    state.stageGoal = state.isBossStage ? 1 : stageGoalFor(state.stage);
    state.stageSpawned = 0;
    state.stageDefeated = 0;
    state.stageSpawnCooldown = 320;
    state.stageCompleted = false;
    state.enemies = [];
    state.enemyBullets = [];
    state.pickups = [];
    state.boss = null;
    state.bossContactTick = 0;
    state.bossLaserTick = 0;

    if (state.isBossStage) {
      spawnBoss();
    }
  }

  function resetGame() {
    state.running = true;
    state.stage = 1;
    state.score = 0;
    state.bullets = [];
    state.enemyBullets = [];
    state.particles = [];
    state.pickups = [];
    state.availableUpgrades = [];

    const player = state.player;
    player.x = WIDTH / 2;
    player.y = HEIGHT * 0.8;
    player.speed = 4.3;
    player.hp = 320;
    player.maxHp = 320;
    player.fireRate = 130;
    player.bulletDamage = 20;
    player.bulletSpeed = 11;
    player.shotCount = 1;
    player.spread = 0.11;
    player.fireCooldown = 0;
    player.invuln = 0;
    player.dashCooldown = 0;
    player.pulseCooldown = 0;
    player.dashPower = 13;
    player.dashCooldownBase = 2800;
    player.pulsePower = 90;
    player.pulseRadius = 145;
    player.pulseCooldownBase = 5200;
    player.pulseFlash = 0;
    player.shieldLayers = 0;
    player.tempRapid = 0;
    player.tempSpread = 0;
    player.tempPower = 0;

    initStars();
    initPlanetsForStage();
    resetStageProgress();
    hideOverlay();
    hideUpgradeSelection();
    updateHud();
  }

  function getAllowedEnemyTypes() {
    if (state.stage <= 2) return ["scout", "striker"];
    if (state.stage <= 4) return ["scout", "striker", "bomber"];
    if (state.stage <= 6) return ["scout", "striker", "bomber", "sniper"];
    return ["scout", "striker", "bomber", "sniper", "interceptor"];
  }

  function spawnEnemy() {
    const types = getAllowedEnemyTypes();
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const type = ENEMY_TYPES[typeKey];
    const seed = Math.random() * 9999;
    const scaling = getEnemyStageScaling(state.stage);
    const hp = type.hp(state.stage) * scaling.hp;
    const speed = type.speed(state.stage) * scaling.speed;

    state.enemies.push({
      type: typeKey,
      x: 60 + Math.random() * (WIDTH - 120),
      y: -40,
      radius: 16,
      hp,
      maxHp: hp,
      speed,
      fireCooldown: (450 + Math.random() * type.shootCooldown) * scaling.fireCooldown,
      wobbleSeed: seed,
      drift: (Math.random() - 0.5) * 0.7,
      phase: Math.random() * Math.PI * 2,
    });

    state.stageSpawned += 1;
  }

  function addParticles(x, y, color, amount, speed = 2) {
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const force = speed * (0.35 + Math.random() * 0.85);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force,
        life: 20 + Math.floor(Math.random() * 30),
        maxLife: 50,
        size: 1.2 + Math.random() * 2.7,
        color,
      });
    }
  }

  function spawnPickup(x, y) {
    if (Math.random() > 0.34) return;

    const pool = ["heal", "rapid", "multi", "power", "shield"];
    const type = pool[Math.floor(Math.random() * pool.length)];
    state.pickups.push({
      x,
      y,
      type,
      radius: 12,
      life: 12000,
      vy: 0.7,
    });
  }

  function firePlayer() {
    const player = state.player;
    if (!state.running || player.fireCooldown > 0) return;

    const rapidFactor = player.tempRapid > 0 ? 0.62 : 1;
    const shotCount = player.shotCount + (player.tempSpread > 0 ? 2 : 0);
    const total = clamp(shotCount, 1, 10);
    const baseAngle = aim.angle;
    const spreadArc = player.spread + (player.tempSpread > 0 ? 0.12 : 0);

    for (let i = 0; i < total; i += 1) {
      const t = total === 1 ? 0 : i / (total - 1) - 0.5;
      const angle = baseAngle + t * spreadArc;
      state.bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * player.bulletSpeed,
        vy: Math.sin(angle) * player.bulletSpeed,
        life: 80,
        damage: player.bulletDamage * (player.tempPower > 0 ? 1.4 : 1),
        radius: 3.3,
      });
    }

    player.fireCooldown = player.fireRate * rapidFactor;
    addParticles(player.x, player.y, "#a7ffd5", 5, 1.7);
  }

  function triggerDash() {
    const player = state.player;
    if (!state.running || player.dashCooldown > 0) return;

    const angle = aim.angle;
    player.x += Math.cos(angle) * player.dashPower * 8;
    player.y += Math.sin(angle) * player.dashPower * 8;
    player.x = clamp(player.x, 26, WIDTH - 26);
    player.y = clamp(player.y, 26, HEIGHT - 26);

    player.invuln = 250;
    player.dashCooldown = player.dashCooldownBase;
    addParticles(player.x, player.y, "#8de9ff", 20, 3.1);
  }

  function triggerPulse() {
    const player = state.player;
    if (!state.running || player.pulseCooldown > 0) return;

    player.pulseFlash = 150;
    player.pulseCooldown = player.pulseCooldownBase;

    state.enemies.forEach((enemy) => {
      const dist = distance(player.x, player.y, enemy.x, enemy.y);
      if (dist <= player.pulseRadius) {
        const pushX = (enemy.x - player.x) / Math.max(1, dist);
        const pushY = (enemy.y - player.y) / Math.max(1, dist);
        enemy.x += pushX * 85;
        enemy.y += pushY * 85;
        enemy.hp -= player.pulsePower;
      }
    });

    state.enemyBullets = state.enemyBullets.filter((bullet) => {
      const dist = distance(player.x, player.y, bullet.x, bullet.y);
      return dist > player.pulseRadius;
    });

    addParticles(player.x, player.y, "#95a9ff", 34, 3.3);
  }

  function fireEnemy(enemy) {
    const player = state.player;
    const type = enemy.type;
    const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const scaling = getEnemyStageScaling(state.stage);
    const damageScale = scaling.damage;
    const speedScale = Math.min(1.18, 1 + Math.max(0, state.stage - 1) * 0.008);

    if (type === "scout") {
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angleToPlayer) * 4.6 * speedScale,
        vy: Math.sin(angleToPlayer) * 4.6 * speedScale,
        life: 150,
        damage: 11 * damageScale,
        radius: 3,
        color: "#8cf0ff",
      });
    }

    if (type === "striker") {
      for (let i = -1; i <= 1; i += 2) {
        state.enemyBullets.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angleToPlayer + i * 0.12) * 4.2 * speedScale,
          vy: Math.sin(angleToPlayer + i * 0.12) * 4.2 * speedScale,
          life: 140,
          damage: 10 * damageScale,
          radius: 3,
          color: "#ffb38f",
        });
      }
    }

    if (type === "bomber") {
      for (let i = -1; i <= 1; i += 1) {
        const a = Math.PI / 2 + i * 0.35;
        state.enemyBullets.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(a) * 3 * speedScale,
          vy: Math.sin(a) * 3 * speedScale,
          life: 180,
          damage: 13 * damageScale,
          radius: 4,
          color: "#dab5ff",
        });
      }
    }

    if (type === "sniper") {
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angleToPlayer) * 6.2 * speedScale,
        vy: Math.sin(angleToPlayer) * 6.2 * speedScale,
        life: 180,
        damage: 18 * damageScale,
        radius: 3.6,
        color: "#fff0a6",
      });
    }

    if (type === "interceptor") {
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angleToPlayer) * 5 * speedScale,
        vy: Math.sin(angleToPlayer) * 5 * speedScale,
        life: 130,
        damage: 12 * damageScale,
        radius: 3,
        color: "#a5ffb6",
      });
    }
  }

  function fireBossBurst(boss) {
    const id = boss.variant.id;
    const damageScale = boss.damageScale;
    const bulletSpeedScale = boss.bulletSpeedScale || 1;

    if (id === "titan") {
      const total = 12;
      for (let index = 0; index < total; index += 1) {
        const angle = (Math.PI * 2 * index) / total + boss.phase * 0.25;
        state.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 3.4 * bulletSpeedScale,
          vy: Math.sin(angle) * 3.4 * bulletSpeedScale,
          life: 230,
          damage: 12 * damageScale,
          radius: 4,
          color: "#ffc999",
        });
      }
      return;
    }

    if (id === "seraph") {
      const total = 16;
      for (let index = 0; index < total; index += 1) {
        const angle = (Math.PI * 2 * index) / total + boss.phase * 0.38;
        state.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 3 * bulletSpeedScale,
          vy: Math.sin(angle) * 3 * bulletSpeedScale,
          life: 250,
          damage: 11 * damageScale,
          radius: 3.7,
          color: "#c9ddff",
        });
      }
      return;
    }

    const player = state.player;
    const base = Math.atan2(player.y - boss.y, player.x - boss.x);
    for (let i = -3; i <= 3; i += 1) {
      const angle = base + i * 0.11;
      state.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * 4 * bulletSpeedScale,
        vy: Math.sin(angle) * 4 * bulletSpeedScale,
        life: 190,
        damage: 13 * damageScale,
        radius: 4.2,
        color: "#ebccff",
      });
    }
  }

  function fireBossMissile(boss) {
    const player = state.player;
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const damageScale = boss.damageScale;
    const bulletSpeedScale = boss.bulletSpeedScale || 1;

    if (boss.variant.id === "seraph") {
      for (let side = -1; side <= 1; side += 1) {
        const offsetAngle = angle + side * 0.14;
        state.enemyBullets.push({
          x: boss.x + side * 18,
          y: boss.y + 16,
          vx: Math.cos(offsetAngle) * 5.8 * bulletSpeedScale,
          vy: Math.sin(offsetAngle) * 5.8 * bulletSpeedScale,
          life: 170,
          damage: 14 * damageScale,
          radius: 4,
          color: "#c0d6ff",
        });
      }
      return;
    }

    if (boss.variant.id === "wraith") {
      for (let i = -1; i <= 1; i += 1) {
        state.enemyBullets.push({
          x: boss.x + i * 16,
          y: boss.y + 18,
          vx: i * 0.9 * bulletSpeedScale,
          vy: 4.8 * bulletSpeedScale,
          life: 220,
          damage: 15 * damageScale,
          radius: 5,
          color: "#eac4ff",
        });
      }
      return;
    }

    for (let side = -1; side <= 1; side += 2) {
      const offsetAngle = angle + side * 0.08;
      state.enemyBullets.push({
        x: boss.x + side * 22,
        y: boss.y + 12,
        vx: Math.cos(offsetAngle) * 5.4 * bulletSpeedScale,
        vy: Math.sin(offsetAngle) * 5.4 * bulletSpeedScale,
        life: 180,
        damage: 16 * damageScale,
        radius: 4.5,
        color: "#ffde8a",
      });
    }
  }

  function updateBoss(dt, dtFactor) {
    const boss = state.boss;
    if (!boss) {
      return;
    }

    const player = state.player;

    boss.phase += 0.01 * dtFactor;

    if (boss.variant.id === "titan") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase * 1.6) * 260;
      boss.y = 98 + Math.sin(boss.phase * 2.8) * 20;
    } else if (boss.variant.id === "seraph") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase * 2.3) * 290;
      boss.y = 110 + Math.cos(boss.phase * 3.4) * 34;
    } else {
      boss.jumpCooldown -= dt;
      if (boss.jumpCooldown <= 0) {
        boss.x = 120 + Math.random() * (WIDTH - 240);
        boss.y = 76 + Math.random() * 90;
        boss.jumpCooldown = Math.max(1000, 1700 - state.stage * 16);
        addParticles(boss.x, boss.y, "#ebccff", 20, 2.5);
      }
    }

    boss.burstCooldown -= dt;
    if (boss.burstCooldown <= 0) {
      fireBossBurst(boss);
      const baseCooldown =
        boss.variant.id === "seraph" ? Math.max(420, 760 - state.stage * 12) : Math.max(560, 980 - state.stage * 18);
      boss.burstCooldown = baseCooldown * boss.fireRateScale;
    }

    boss.missileCooldown -= dt;
    if (boss.missileCooldown <= 0) {
      fireBossMissile(boss);
      const baseCooldown =
        boss.variant.id === "wraith" ? Math.max(640, 1180 - state.stage * 18) : Math.max(760, 1400 - state.stage * 24);
      boss.missileCooldown = baseCooldown * boss.fireRateScale;
    }

    boss.laser.timer -= dt;

    if (boss.laser.mode === "idle" && boss.laser.timer <= 0) {
      boss.laser.mode = "charge";
      boss.laser.timer = boss.variant.id === "wraith" ? 700 : 1100;
      boss.laser.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.laser.sweepDir = player.x >= boss.x ? 1 : -1;
    }

    if (boss.laser.mode === "charge" && boss.laser.timer <= 0) {
      boss.laser.mode = "fire";
      boss.laser.timer = boss.variant.id === "seraph" ? 1200 : 900;
      boss.laser.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    }

    if (boss.laser.mode === "fire" && boss.variant.id === "seraph") {
      boss.laser.angle += boss.laser.sweepDir * 0.014 * dtFactor;
    }

    if (boss.laser.mode === "fire" && boss.laser.timer <= 0) {
      boss.laser.mode = "idle";
      boss.laser.timer = boss.variant.id === "wraith" ? Math.max(1000, 1800 - state.stage * 24) : Math.max(1500, 2500 - state.stage * 40);
    }
  }

  function distanceToLaser(originX, originY, angle, pointX, pointY) {
    const lineX = Math.cos(angle);
    const lineY = Math.sin(angle);
    const relX = pointX - originX;
    const relY = pointY - originY;
    const proj = relX * lineX + relY * lineY;
    if (proj < 0) {
      return Infinity;
    }
    const perpX = relX - lineX * proj;
    const perpY = relY - lineY * proj;
    return Math.hypot(perpX, perpY);
  }

  function applyPickup(type) {
    const player = state.player;
    if (type === "heal") {
      player.hp = Math.min(player.maxHp, player.hp + 28);
    }
    if (type === "rapid") {
      player.tempRapid = 6000;
    }
    if (type === "multi") {
      player.tempSpread = 6000;
    }
    if (type === "power") {
      player.tempPower = 6000;
    }
    if (type === "shield") {
      player.shieldLayers = Math.min(player.shieldLayers + 1, 5);
    }
  }

  function buildUpgradeOptions() {
    const pool = [...UPGRADE_POOL];
    const picks = [];

    const boostPick = state.stage >= 6 && Math.random() < 0.8;

    if (boostPick) {
      const strongCandidates = pool.filter((upgrade) =>
        ["Final Form", "Storm Barrage", "Titan Core", "Fortress Hull", "Hyper Overdrive"].includes(upgrade.title)
      );

      if (strongCandidates.length > 0) {
        const selectedStrong = strongCandidates[Math.floor(Math.random() * strongCandidates.length)];
        picks.push(selectedStrong);
        pool.splice(pool.indexOf(selectedStrong), 1);
      }
    }

    if (state.stage >= 10) {
      const extraStrong = pool.filter((upgrade) =>
        ["Final Form", "Storm Barrage", "Titan Core", "Fortress Hull", "Hyper Overdrive", "Shock Pulse"].includes(
          upgrade.title
        )
      );

      if (extraStrong.length > 0 && picks.length < UPGRADE_OPTIONS_PER_STAGE) {
        const chosen = extraStrong[Math.floor(Math.random() * extraStrong.length)];
        picks.push(chosen);
        pool.splice(pool.indexOf(chosen), 1);
      }
    }

    while (picks.length < UPGRADE_OPTIONS_PER_STAGE && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }

    return picks;
  }

  function startNextStage() {
    state.stage += 1;
    state.running = true;
    hideUpgradeSelection();
    initPlanetsForStage();
    resetStageProgress();
    showOverlay(`Stage ${state.stage}`, `נכנסת ל-${getTheme().name}`);
    setTimeout(() => {
      hideOverlay();
    }, 900);
  }

  function completeStage() {
    if (state.stageCompleted) return;
    state.stageCompleted = true;
    const upgrades = buildUpgradeOptions();
    showUpgradeSelection(upgrades);
  }

  function playerTakeDamage(amount) {
    const player = state.player;
    if (player.invuln > 0 || !state.running) return;

    if (player.shieldLayers > 0) {
      player.shieldLayers -= 1;
      player.invuln = 220;
      addParticles(player.x, player.y, "#8fd6ff", 16, 2.5);
      return;
    }

    player.hp -= amount;
    player.invuln = 480;
    addParticles(player.x, player.y, "#ff6f88", 18, 2.8);

    if (player.hp <= 0) {
      state.running = false;
      showOverlay("Game Over", `ניקוד: ${Math.floor(state.score)} | הגעת לשלב ${state.stage}`);
    }
  }

  function update(dt) {
    const dtFactor = dt / 16.67;
    const player = state.player;

    if (player.fireCooldown > 0) player.fireCooldown -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.pulseCooldown > 0) player.pulseCooldown -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.pulseFlash > 0) player.pulseFlash -= dt;
    if (player.tempRapid > 0) player.tempRapid -= dt;
    if (player.tempSpread > 0) player.tempSpread -= dt;
    if (player.tempPower > 0) player.tempPower -= dt;

    state.stars.forEach((star) => {
      star.y += (0.12 + star.depth * 0.24) * dtFactor * (1 + state.stage * 0.02);
      if (star.y > HEIGHT + 4) {
        star.y = -3;
        star.x = Math.random() * WIDTH;
      }
    });

    if (!state.running) {
      updateHud();
      return;
    }

    let moveX = 0;
    let moveY = 0;
    if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
    if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;

    updateAutoAim();

    const norm = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / norm) * player.speed * dtFactor;
    player.y += (moveY / norm) * player.speed * dtFactor;
    player.x = clamp(player.x, 24, WIDTH - 24);
    player.y = clamp(player.y, 24, HEIGHT - 24);

    firePlayer();

    if (!state.isBossStage && state.stageSpawned < state.stageGoal) {
      state.stageSpawnCooldown -= dt;
      if (state.stageSpawnCooldown <= 0) {
        spawnEnemy();
        state.stageSpawnCooldown = Math.max(210, 780 - state.stage * 30);
      }
    }

    if (state.isBossStage) {
      updateBoss(dt, dtFactor);
    }

    state.bullets.forEach((bullet) => {
      bullet.x += bullet.vx * dtFactor;
      bullet.y += bullet.vy * dtFactor;
      bullet.life -= dtFactor;
    });

    state.enemyBullets.forEach((bullet) => {
      bullet.x += bullet.vx * dtFactor;
      bullet.y += bullet.vy * dtFactor;
      bullet.life -= dtFactor;
    });

    state.bullets = state.bullets.filter(
      (bullet) => bullet.life > 0 && bullet.x > -60 && bullet.x < WIDTH + 60 && bullet.y > -60 && bullet.y < HEIGHT + 60
    );

    state.enemyBullets = state.enemyBullets.filter(
      (bullet) => bullet.life > 0 && bullet.x > -60 && bullet.x < WIDTH + 60 && bullet.y > -60 && bullet.y < HEIGHT + 60
    );

    state.enemies.forEach((enemy) => {
      enemy.phase += 0.02 * dtFactor;
      const toPlayerX = player.x - enemy.x;
      const toPlayerY = player.y - enemy.y;
      const dist = Math.max(1, Math.hypot(toPlayerX, toPlayerY));

      let vx = (toPlayerX / dist) * enemy.speed;
      let vy = (toPlayerY / dist) * enemy.speed;

      if (enemy.type === "scout") {
        vx += Math.sin(enemy.phase + enemy.wobbleSeed) * 1.1;
      }

      if (enemy.type === "striker") {
        vy += Math.sin(enemy.phase * 2) * 0.9;
      }

      if (enemy.type === "bomber") {
        vy = Math.max(0.45, vy * 0.7);
      }

      if (enemy.type === "sniper") {
        const desired = 220;
        if (dist < desired) {
          vx = -(toPlayerX / dist) * enemy.speed;
          vy = -(toPlayerY / dist) * enemy.speed;
        }
      }

      if (enemy.type === "interceptor") {
        vx += Math.cos(enemy.phase * 4) * 1.6;
        vy += Math.sin(enemy.phase * 3) * 1.2;
      }

      enemy.x += vx * dtFactor;
      enemy.y += vy * dtFactor;

      enemy.x = clamp(enemy.x, 10, WIDTH - 10);
      enemy.y = clamp(enemy.y, -30, HEIGHT + 40);

      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0) {
        fireEnemy(enemy);
        const base = ENEMY_TYPES[enemy.type].shootCooldown;
        const scaling = getEnemyStageScaling(state.stage);
        enemy.fireCooldown = base * (0.78 + Math.random() * 0.45) * scaling.fireCooldown;
      }
    });

    for (const bullet of state.bullets) {
      for (const enemy of state.enemies) {
        if (distance(bullet.x, bullet.y, enemy.x, enemy.y) <= enemy.radius + bullet.radius) {
          enemy.hp -= bullet.damage;
          bullet.life = 0;
          addParticles(enemy.x, enemy.y, "#a8ffd4", 5, 1.6);
          break;
        }
      }

      if (state.boss && bullet.life > 0) {
        if (distance(bullet.x, bullet.y, state.boss.x, state.boss.y) <= state.boss.radius + bullet.radius) {
          state.boss.hp -= bullet.damage;
          bullet.life = 0;
          addParticles(state.boss.x, state.boss.y, "#ffd2a0", 4, 1.4);
        }
      }
    }

    let defeatedThisTick = 0;
    state.enemies = state.enemies.filter((enemy) => {
      if (enemy.hp <= 0) {
        defeatedThisTick += 1;
        state.stageDefeated += 1;
        state.score += ENEMY_TYPES[enemy.type].score + state.stage * 2;
        addParticles(enemy.x, enemy.y, ENEMY_TYPES[enemy.type].color, 16, 2.2);
        spawnPickup(enemy.x, enemy.y);
        return false;
      }
      return true;
    });

    if (defeatedThisTick > 0) {
      state.score += defeatedThisTick * 4;
    }

    if (state.boss && state.boss.hp <= 0) {
      state.score += 650 + state.stage * 40;
      addParticles(state.boss.x, state.boss.y, "#ffe099", 48, 3.5);
      state.boss = null;
      state.stageDefeated = state.stageGoal;
    }

    state.enemyBullets.forEach((bullet) => {
      if (distance(bullet.x, bullet.y, player.x, player.y) <= player.radius + bullet.radius) {
        bullet.life = 0;
        playerTakeDamage(bullet.damage);
      }
    });

    state.enemies.forEach((enemy) => {
      if (distance(enemy.x, enemy.y, player.x, player.y) <= enemy.radius + player.radius) {
        const scaling = getEnemyStageScaling(state.stage);
        playerTakeDamage(scaling.contactDamage);
        enemy.hp -= 30;
      }
    });

    if (state.boss) {
      if (distance(state.boss.x, state.boss.y, player.x, player.y) <= state.boss.radius + player.radius) {
        if (state.bossContactTick <= 0) {
          playerTakeDamage(state.boss.contactDamage || 28);
          state.bossContactTick = 200;
        }
      }

      if (state.boss.laser.mode === "fire") {
        const d = distanceToLaser(state.boss.x, state.boss.y, state.boss.laser.angle, player.x, player.y);
        if (d <= player.radius + 10 && state.bossLaserTick <= 0) {
          playerTakeDamage(state.boss.laserTickDamage || 14);
          state.bossLaserTick = 120;
        }
      }
    }

    if (state.bossContactTick > 0) {
      state.bossContactTick -= dt;
    }
    if (state.bossLaserTick > 0) {
      state.bossLaserTick -= dt;
    }

    state.pickups.forEach((pickup) => {
      pickup.y += pickup.vy * dtFactor;
      pickup.life -= dt;
    });

    state.pickups = state.pickups.filter((pickup) => {
      if (pickup.life <= 0) return false;

      if (distance(pickup.x, pickup.y, player.x, player.y) <= pickup.radius + player.radius) {
        applyPickup(pickup.type);
        addParticles(pickup.x, pickup.y, "#fff7b5", 14, 2.5);
        return false;
      }

      return pickup.y <= HEIGHT + 28;
    });

    state.particles = state.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dtFactor,
        y: particle.y + particle.vy * dtFactor,
        vx: particle.vx * 0.96,
        vy: particle.vy * 0.96,
        life: particle.life - dtFactor,
      }))
      .filter((particle) => particle.life > 0);

    const stageClear = state.isBossStage
      ? state.stageDefeated >= state.stageGoal && !state.boss
      : state.stageDefeated >= state.stageGoal && state.enemies.length === 0;

    if (stageClear && !state.stageCompleted) {
      completeStage();
    }

    updateHud();
  }

  function drawBackground() {
    const theme = getTheme();

    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = theme.haze;
    state.planets.forEach((planet) => {
      ctx.globalAlpha = planet.alpha;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = theme.starTint;
    state.stars.forEach((star) => {
      ctx.globalAlpha = 0.35 + star.depth * 0.3;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    const mountain = ctx.createLinearGradient(0, HEIGHT * 0.62, 0, HEIGHT);
    mountain.addColorStop(0, "rgba(5,10,18,0.05)");
    mountain.addColorStop(1, "rgba(0,0,0,0.32)");
    ctx.fillStyle = mountain;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT);
    for (let x = 0; x <= WIDTH; x += 40) {
      const y = HEIGHT * 0.74 + Math.sin((x + state.stage * 13) * 0.02) * 16 + Math.cos((x + state.stage * 5) * 0.035) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawPlayerPlane() {
    const player = state.player;
    const angle = aim.angle;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + Math.PI / 2);

    const alpha = player.invuln > 0 ? 0.65 + Math.sin(performance.now() * 0.03) * 0.2 : 1;
    ctx.globalAlpha = alpha;

    ctx.shadowColor = "rgba(120, 255, 170, 0.8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#7fffc2";

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(13, 12);
    ctx.lineTo(4, 8);
    ctx.lineTo(4, 24);
    ctx.lineTo(-4, 24);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#14342a";
    ctx.fillRect(-4, -6, 8, 18);

    const flame = 6 + Math.sin(performance.now() * 0.04) * 3;
    ctx.fillStyle = "#8de1ff";
    ctx.beginPath();
    ctx.moveTo(0, 23 + flame);
    ctx.lineTo(4, 17);
    ctx.lineTo(-4, 17);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();

    if (player.shieldLayers > 0) {
      ctx.strokeStyle = "rgba(141, 214, 255, 0.65)";
      ctx.lineWidth = 2;
      for (let i = 0; i < player.shieldLayers; i += 1) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 7 + i * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
    const barW = 56;
    const barH = 6;
    const barX = player.x - barW / 2;
    const barY = player.y - player.radius - 22;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#8cff1a";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(barX, barY, barW, barH);
  }

  function drawEnemyPlane(enemy) {
    const config = ENEMY_TYPES[enemy.type];
    const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.shadowColor = `${config.color}88`;
    ctx.shadowBlur = 10;
    ctx.fillStyle = config.color;

    if (enemy.type === "bomber") {
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 12);
      ctx.lineTo(10, 16);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-18, 12);
      ctx.closePath();
    } else if (enemy.type === "sniper") {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(12, 10);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 22);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-12, 10);
      ctx.closePath();
    } else if (enemy.type === "interceptor") {
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 6);
      ctx.lineTo(8, 8);
      ctx.lineTo(0, 20);
      ctx.lineTo(-8, 8);
      ctx.lineTo(-16, 6);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(13, 9);
      ctx.lineTo(4, 7);
      ctx.lineTo(0, 18);
      ctx.lineTo(-4, 7);
      ctx.lineTo(-13, 9);
      ctx.closePath();
    }

    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(-3, -4, 6, 10);
    ctx.restore();

    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 11, 32, 4);
    ctx.fillStyle = "#8cff1a";
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 11, 32 * hpRatio, 4);
  }

  function drawBoss() {
    const boss = state.boss;
    if (!boss) {
      return;
    }

    const variant = boss.variant;

    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);

    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.shadowColor = `${variant.primary}bb`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = variant.primary;
    ctx.beginPath();
    ctx.moveTo(0, -62);
    ctx.lineTo(38, 12);
    ctx.lineTo(22, 26);
    ctx.lineTo(22, 46);
    ctx.lineTo(-22, 46);
    ctx.lineTo(-22, 26);
    ctx.lineTo(-38, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#4a2715";
    ctx.fillRect(-10, -20, 20, 30);

    ctx.fillStyle = variant.secondary;
    ctx.fillRect(-24, 8, 48, 8);
    ctx.restore();

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(boss.x - 84, boss.y - boss.radius - 20, 168, 8);
    ctx.fillStyle = variant.secondary;
    ctx.fillRect(boss.x - 84, boss.y - boss.radius - 20, 168 * ratio, 8);

    if (boss.laser.mode === "charge" || boss.laser.mode === "fire") {
      const alpha = boss.laser.mode === "charge" ? 0.32 : 0.85;
      const width = boss.laser.mode === "charge" ? 8 : 14;
      const lineX = Math.cos(boss.laser.angle);
      const lineY = Math.sin(boss.laser.angle);

      ctx.strokeStyle = `${variant.laserColor}${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(boss.x + lineX * 1400, boss.y + lineY * 1400);
      ctx.stroke();
    }
  }

  function drawBullets() {
    state.bullets.forEach((bullet) => {
      ctx.fillStyle = "#fff3ad";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    state.enemyBullets.forEach((bullet) => {
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPickups() {
    state.pickups.forEach((pickup) => {
      const colors = {
        heal: "#7dff98",
        rapid: "#73f4ff",
        multi: "#ffd36d",
        power: "#ff9ec5",
        shield: "#a0bcff",
      };

      ctx.shadowColor = `${colors[pickup.type]}aa`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = colors[pickup.type];
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#0d1b15";
      ctx.font = "bold 10px Rubik";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const marks = { heal: "+", rapid: "R", multi: "M", power: "P", shield: "S" };
      ctx.fillText(marks[pickup.type], pickup.x, pickup.y + 0.5);
    });
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawPulse() {
    const player = state.player;
    if (player.pulseFlash <= 0) return;

    const alpha = player.pulseFlash / 150;
    const radius = player.pulseRadius - player.pulseFlash * 0.3;

    ctx.strokeStyle = `rgba(149,169,255,${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, Math.max(16, radius), 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawCrosshair() {
    const player = state.player;
    const centerX = player.x + aim.x * 70;
    const centerY = player.y + aim.y * 70;

    ctx.strokeStyle = "rgba(240,255,246,0.85)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(centerX - 9, centerY);
    ctx.lineTo(centerX + 9, centerY);
    ctx.moveTo(centerX, centerY - 9);
    ctx.lineTo(centerX, centerY + 9);
    ctx.stroke();

    ctx.strokeStyle = "rgba(140,255,210,0.35)";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
  }

  function drawStageBanner() {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 14px Rubik";
    ctx.textAlign = "left";
    const bossText = state.isBossStage ? " (Boss)" : "";
    const bossName = state.isBossStage && state.boss ? ` • ${state.boss.variant.name}` : "";
    ctx.fillText(`Stage ${state.stage}${bossText} — ${getTheme().name}${bossName}`, 16, 24);
  }

  function draw() {
    drawBackground();
    drawPulse();
    drawBullets();
    state.enemies.forEach(drawEnemyPlane);
    drawBoss();
    drawPlayerPlane();
    drawPickups();
    drawParticles();
    drawCrosshair();
    drawStageBanner();
  }

  function loop(now) {
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  function chooseUpgrade(slot) {
    const selected = state.availableUpgrades[slot];
    if (!selected) return;

    selected.apply(state.player);
    state.player.hp = state.player.maxHp;
    state.score += 30;
    startNextStage();
    updateHud();
  }

  function setFullscreenButtonLabel() {
    if (!arenaDom.fullscreenBtn) return;
    arenaDom.fullscreenBtn.textContent = document.fullscreenElement ? "יציאה ממסך מלא" : "מסך מלא";
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await fullscreenTarget.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setFullscreenButtonLabel();
    } catch {
      if (arenaDom.fullscreenBtn) {
        arenaDom.fullscreenBtn.textContent = "מסך מלא לא זמין";
      }
    }
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }

    keys.add(key);

    if (key === "shift") {
      event.preventDefault();
      triggerDash();
    }

    if (key === " ") {
      event.preventDefault();
      triggerPulse();
    }
  });

  window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
  });

  arenaDom.restartBtn.addEventListener("click", resetGame);
  arenaDom.overlayBtn.addEventListener("click", resetGame);
  arenaDom.upg1.addEventListener("click", () => chooseUpgrade(0));
  arenaDom.upg2.addEventListener("click", () => chooseUpgrade(1));
  arenaDom.upg3.addEventListener("click", () => chooseUpgrade(2));
  if (arenaDom.upg4) arenaDom.upg4.addEventListener("click", () => chooseUpgrade(3));
  if (arenaDom.upg5) arenaDom.upg5.addEventListener("click", () => chooseUpgrade(4));
  if (arenaDom.upg6) arenaDom.upg6.addEventListener("click", () => chooseUpgrade(5));

  if (arenaDom.fullscreenBtn) {
    arenaDom.fullscreenBtn.addEventListener("click", () => {
      void toggleFullscreen();
    });

    document.addEventListener("fullscreenchange", () => {
      setFullscreenButtonLabel();
    });
  }

  resetGame();
  requestAnimationFrame(loop);
}
