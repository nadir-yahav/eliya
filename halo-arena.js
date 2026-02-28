const arenaDom = {
  canvas: document.getElementById("arenaCanvas"),
  score: document.getElementById("haScore"),
  health: document.getElementById("haHealth"),
  wave: document.getElementById("haWave"),
  weapon: document.getElementById("haWeapon"),
  dash: document.getElementById("haDash"),
  pulse: document.getElementById("haPulse"),
  musicBtn: document.getElementById("haMusicBtn"),
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
  planeDock: document.getElementById("haPlaneDock"),
  planeList: document.getElementById("haPlaneList"),
  planeActive: document.getElementById("haPlaneActive"),
  coins: document.getElementById("haCoins"),
  touchDash: document.getElementById("haTouchDash"),
  touchPulse: document.getElementById("haTouchPulse"),
};

if (arenaDom.canvas) {
  const ctx = arenaDom.canvas.getContext("2d", { alpha: true });
  arenaDom.canvas.classList.add("arena-canvas");
  const WIDTH = arenaDom.canvas.width;
  const HEIGHT = arenaDom.canvas.height;
  const fullscreenTarget = arenaDom.canvas.closest(".game-shell") || arenaDom.canvas;

  const keys = new Set();
  const aim = { x: 0, y: -1, angle: -Math.PI / 2 };
  const gamepadInput = {
    moveX: 0,
    moveY: 0,
    dashPressed: false,
    pulsePressed: false,
    upgradeLeftPressed: false,
    upgradeRightPressed: false,
    upgradeConfirmPressed: false,
    upgradeRepeatDirection: 0,
    upgradeRepeatAt: 0,
  };
  const touchInput = { active: false, pointerId: null, targetX: 0, targetY: 0 };

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
    {
      id: "vortex",
      name: "Vortex Leviathan",
      primary: "#8dffe4",
      secondary: "#d9fff7",
      laserColor: "rgba(132,255,226,",
      radius: 58,
      baseHp: 960,
      hpScale: 145,
    },
    {
      id: "inferno",
      name: "Inferno Behemoth",
      primary: "#ff8a66",
      secondary: "#ffe2d6",
      laserColor: "rgba(255,118,88,",
      radius: 60,
      baseHp: 1020,
      hpScale: 155,
    },
    {
      id: "aegis",
      name: "Aegis Nullframe",
      primary: "#b5c3ff",
      secondary: "#f0f4ff",
      laserColor: "rgba(176,196,255,",
      radius: 57,
      baseHp: 1000,
      hpScale: 152,
    },
  ];

  // מערכת רמות שדרוגים
  const UPGRADE_TIERS = [
    {
      name: "ירוק",
      color: "#2ecc40",
      chance: 0.17,
      power: 1.05,
      health: 1.05,
    },
    {
      name: "כחול",
      color: "#3498db",
      chance: 0.18,
      power: 1.12,
      health: 1.12,
    },
    {
      name: "סגול",
      color: "#9b59b6",
      chance: 0.15,
      power: 1.18,
      health: 1.18,
    },
    {
      name: "אדום",
      color: "#e74c3c",
      chance: 0.14,
      power: 1.25,
      health: 1.25,
    },
    {
      name: "אגדי",
      color: "#f1c40f",
      chance: 0.10,
      power: 1.35,
      health: 1.35,
    },
    {
      name: "צהוב",
      color: "#ffff00",
      chance: 0.15,
      power: 1.75,
      health: 1.70,
    },
    {
      name: "קשת",
      color: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)",
      chance: 0.10,
      power: 2.20,
      health: 2.10,
    },
    {
      name: "שחור-לבן",
      color: "linear-gradient(90deg, #000000, #ffffff)",
      chance: 0.01,
      power: 3.60,
      health: 3.20,
    },
  ];

  const UPGRADE_OPTIONS_PER_STAGE = 6;
  const MAX_PLANES = 1000;
  const PLANE_PROGRESS_KEY = "haloArenaPlaneProgressV2";
  const CREATOR_MODE_KEY = "haloArenaCreatorModeV2";
  const CREATOR_ACCESS_CODE = "HALO-CREATOR-ONLY-2026";
  const SERVANT_RESPAWN_MS = 3000;
  const SERVANT_BURST_SHOTS = 3;
  const SERVANT_BURST_INTERVAL_MS = 90;
  const PLANE_ARCHETYPES = [
    { name: "Assault", damage: 1.08, fireRate: 0.95, speed: 1.03, dash: 1.05, pulsePower: 1.05, pulseRadius: 1.03, shots: 0, damageReduction: 0.02, regen: 0.2 },
    { name: "Guardian", damage: 1.04, fireRate: 0.98, speed: 1.01, dash: 1.03, pulsePower: 1.06, pulseRadius: 1.08, shots: 0, damageReduction: 0.05, regen: 0.8 },
    { name: "Striker", damage: 1.06, fireRate: 0.96, speed: 1.08, dash: 1.12, pulsePower: 1.02, pulseRadius: 1.01, shots: 0, damageReduction: 0.01, regen: 0.2 },
    { name: "Nova", damage: 1.05, fireRate: 0.97, speed: 1.02, dash: 1.04, pulsePower: 1.14, pulseRadius: 1.12, shots: 1, damageReduction: 0.02, regen: 0.3 },
    { name: "Storm", damage: 1.12, fireRate: 0.93, speed: 1.05, dash: 1.06, pulsePower: 1.08, pulseRadius: 1.04, shots: 1, damageReduction: 0.01, regen: 0.1 },
  ];

  function buildPlaneCatalog() {
    return Array.from({ length: MAX_PLANES }, (_, index) => {
      const id = index + 1;
      const archetype = PLANE_ARCHETYPES[index % PLANE_ARCHETYPES.length];
      const hue = (index * 31) % 360;
      const tierBoost = 1 + id * 0.012;
      return {
        id,
        name: `מטוס ${id}`,
        title: `Type-${id} ${archetype.name}`,
        primary: `hsl(${hue}, 92%, 62%)`,
        secondary: `hsl(${(hue + 48) % 360}, 95%, 72%)`,
        glow: `hsla(${hue}, 100%, 75%, 0.75)`,
        damageMult: archetype.damage * tierBoost,
        fireRateMult: Math.max(0.45, archetype.fireRate - id * 0.0036),
        speedMult: archetype.speed + id * 0.006,
        dashMult: archetype.dash + id * 0.008,
        dashCooldownMult: Math.max(0.45, 1 - id * 0.003),
        pulsePowerMult: archetype.pulsePower + id * 0.007,
        pulseRadiusMult: archetype.pulseRadius + id * 0.003,
        shotBonus: Math.min(5, archetype.shots + Math.floor(id / 25)),
        damageReduction: Math.min(0.38, archetype.damageReduction + id * 0.0025),
        regenPerSecond: archetype.regen + id * 0.05,
        wingScale: 1 + id * 0.005,
        startHpBonus: 14 + id * 4,
        startShieldLayers: Math.min(5, Math.floor(id / 20)),
        startRapidMs: Math.floor(id / 10) * 500,
        startSpreadMs: id >= 30 ? Math.floor((id - 20) / 10) * 450 : 0,
        startPowerMs: id >= 40 ? Math.floor((id - 30) / 10) * 500 : 0,
      };
    });
  }

  function getUnlockedPlaneCountForStage(stage) {
    const completedStages = Math.max(0, stage - 1);
    return Math.min(MAX_PLANES, 1 + completedStages);
  }

  function loadPlaneProgress() {
    try {
      const raw = localStorage.getItem(PLANE_PROGRESS_KEY);
      if (!raw) {
        return { unlockedPlaneCount: 1, activePlaneId: 1, creatorMode: false, coins: 0 };
      }

      const parsed = JSON.parse(raw);
      const creatorMode = parsed.creatorMode === true;
      const unlockedPlaneCount = creatorMode
        ? MAX_PLANES
        : clamp(Number(parsed.unlockedPlaneCount) || 1, 1, MAX_PLANES);
      const activePlaneId = creatorMode
        ? clamp(Number(parsed.activePlaneId) || MAX_PLANES, 1, MAX_PLANES)
        : clamp(Number(parsed.activePlaneId) || unlockedPlaneCount, 1, unlockedPlaneCount);
      const coins = Math.max(0, Number(parsed.coins) || 0);
      return { unlockedPlaneCount, activePlaneId, creatorMode, coins };
    } catch {
      return { unlockedPlaneCount: 1, activePlaneId: 1, creatorMode: false, coins: 0 };
    }
  }

  function savePlaneProgress() {
    try {
      localStorage.setItem(
        PLANE_PROGRESS_KEY,
        JSON.stringify({
          unlockedPlaneCount: state.unlockedPlaneCount,
          activePlaneId: state.activePlaneId,
          creatorMode: state.creatorMode,
          coins: state.coins,
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  // שדרוגים עם tier קבוע
  const UPGRADE_POOL = [
      // --- שדרוגים חדשים וחזקים במיוחד ---
      {
        title: "Godlike Barrage",
        desc: "פי 4 קליעים, נזק פי 4",
        tier: UPGRADE_TIERS[4], // אגדי
        apply: (player, tier) => {
          player.shotCount = Math.min(player.shotCount * 4, 20);
          player.bulletDamage *= 4 * tier.power;
          player.maxHp = Math.floor(player.maxHp * tier.health);
        },
      },
      {
        title: "Immortal Shield",
        desc: "פי 4 שכבות מגן, חיים פי 4",
        tier: UPGRADE_TIERS[4],
        apply: (player, tier) => {
          player.shieldLayers = Math.min(player.shieldLayers * 4, 20);
          player.maxHp *= 4;
          player.hp = player.maxHp;
        },
      },
      {
        title: "Ultra Pulse",
        desc: "Pulse פי 4 חזק ומהיר",
        tier: UPGRADE_TIERS[4],
        apply: (player, tier) => {
          player.pulsePower *= 4;
          player.pulseRadius *= 1.3;
          player.pulseCooldownBase *= 0.25;
        },
      },
      {
        title: "Dash God",
        desc: "Dash פי 4 חזק ומהיר",
        tier: UPGRADE_TIERS[4],
        apply: (player, tier) => {
          player.dashPower *= 4;
          player.dashCooldownBase *= 0.25;
        },
      },
      {
        title: "Speed Demon",
        desc: "מהירות פי 4",
        tier: UPGRADE_TIERS[4],
        apply: (player, tier) => {
          player.speed *= 4;
        },
      },
      {
        title: "Bullet Storm",
        desc: "פי 2 קליעים, פי 2 נזק",
        tier: UPGRADE_TIERS[3],
        apply: (player, tier) => {
          player.shotCount = Math.min(player.shotCount * 2, 14);
          player.bulletDamage *= 2 * tier.power;
        },
      },
      {
        title: "Titanic Health",
        desc: "חיים פי 2",
        tier: UPGRADE_TIERS[3],
        apply: (player, tier) => {
          player.maxHp *= 2;
          player.hp = player.maxHp;
        },
      },
      {
        title: "Pulse Nova",
        desc: "Pulse פי 2 חזק ומהיר",
        tier: UPGRADE_TIERS[3],
        apply: (player, tier) => {
          player.pulsePower *= 2;
          player.pulseRadius *= 1.15;
          player.pulseCooldownBase *= 0.5;
        },
      },
      {
        title: "Dash Master",
        desc: "Dash פי 2 חזק ומהיר",
        tier: UPGRADE_TIERS[3],
        apply: (player, tier) => {
          player.dashPower *= 2;
          player.dashCooldownBase *= 0.5;
        },
      },
      {
        title: "Speed Burst",
        desc: "מהירות פי 2",
        tier: UPGRADE_TIERS[3],
        apply: (player, tier) => {
          player.speed *= 2;
        },
      },
      {
        title: "Rapid Regen",
        desc: "ריפוי אוטומטי מהיר מאוד",
        tier: UPGRADE_TIERS[2],
        apply: (player, tier) => {
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
        },
      },
      {
        title: "Shield Overload",
        desc: "פי 3 שכבות מגן",
        tier: UPGRADE_TIERS[2],
        apply: (player, tier) => {
          player.shieldLayers = Math.min(player.shieldLayers * 3, 30);
        },
      },
      {
        title: "Pulse Chain",
        desc: "Pulse פוגע פעמיים",
        tier: UPGRADE_TIERS[2],
        apply: (player, tier) => {
          player.pulsePower *= 2;
        },
      },
      {
        title: "Dash Chain",
        desc: "Dash פועל פעמיים ברצף",
        tier: UPGRADE_TIERS[2],
        apply: (player, tier) => {
          player.dashPower *= 2;
        },
      },
      {
        title: "Speed Chain",
        desc: "מהירות מוכפלת",
        tier: UPGRADE_TIERS[2],
        apply: (player, tier) => {
          player.speed *= 2;
        },
      },
      {
        title: "Bullet Chain",
        desc: "פי 2 קליעים",
        tier: UPGRADE_TIERS[1],
        apply: (player, tier) => {
          player.shotCount = Math.min(player.shotCount * 2, 20);
        },
      },
      {
        title: "Health Chain",
        desc: "חיים מוכפלים",
        tier: UPGRADE_TIERS[1],
        apply: (player, tier) => {
          player.maxHp *= 2;
          player.hp = player.maxHp;
        },
      },
      {
        title: "Pulse Quick",
        desc: "Pulse פי 2 מהיר",
        tier: UPGRADE_TIERS[1],
        apply: (player, tier) => {
          player.pulseCooldownBase *= 0.5;
        },
      },
      {
        title: "Dash Quick",
        desc: "Dash פי 2 מהיר",
        tier: UPGRADE_TIERS[1],
        apply: (player, tier) => {
          player.dashCooldownBase *= 0.5;
        },
      },
      {
        title: "Speed Quick",
        desc: "מהירות פי 2",
        tier: UPGRADE_TIERS[1],
        apply: (player, tier) => {
          player.speed *= 2;
        },
      },
      {
        title: "Bullet Quick",
        desc: "קליעים מהירים פי 2",
        tier: UPGRADE_TIERS[0],
        apply: (player, tier) => {
          player.bulletSpeed *= 2;
        },
      },
      {
        title: "Health Quick",
        desc: "ריפוי מיידי 50%",
        tier: UPGRADE_TIERS[0],
        apply: (player, tier) => {
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
        },
      },
    {
      title: "Rapid Cannon",
      desc: "יורה מהר יותר ב־20%",
      tier: UPGRADE_TIERS[0], // ירוק
      apply: (player, tier) => {
        player.fireRate *= 0.8;
        player.bulletDamage *= tier.power;
        player.maxHp = Math.floor(player.maxHp * tier.health);
      },
    },
    {
      title: "Twin Cannons",
      desc: "+2 קליעים לכל ירייה",
      tier: UPGRADE_TIERS[1], // כחול
      apply: (player, tier) => {
        player.shotCount = Math.min(player.shotCount + 2, 12);
        player.bulletDamage *= tier.power;
        player.maxHp = Math.floor(player.maxHp * tier.health);
      },
    },
    {
      title: "Armor Plating",
      desc: "+45 חיים מקסימליים וריפוי חזק",
      tier: UPGRADE_TIERS[2], // סגול
      apply: (player, tier) => {
        player.maxHp += 45;
        player.hp = Math.min(player.maxHp, player.hp + 80);
        player.bulletDamage *= tier.power;
        player.maxHp = Math.floor(player.maxHp * tier.health);
      },
    },
    {
      title: "High Caliber",
      desc: "נזק קליעים +35%",
      tier: UPGRADE_TIERS[3], // אדום
      apply: (player, tier) => {
        player.bulletDamage *= 1.35;
        player.bulletDamage *= tier.power;
        player.maxHp = Math.floor(player.maxHp * tier.health);
      },
    },
    {
      title: "Ion Engines",
      desc: "מהירות תנועה +20%",
      tier: UPGRADE_TIERS[4], // אגדי
      apply: (player, tier) => {
        player.speed *= 1.2;
        player.bulletDamage *= tier.power;
        player.maxHp = Math.floor(player.maxHp * tier.health);
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

  const initialPlaneProgress = loadPlaneProgress();

  const state = {
    running: true,
    stage: 1,
    score: 0,
    coins: initialPlaneProgress.coins,
    stars: [],
    skyTraffic: [],
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
    planes: buildPlaneCatalog(),
    creatorMode: initialPlaneProgress.creatorMode,
    unlockedPlaneCount: initialPlaneProgress.unlockedPlaneCount,
    activePlaneId: initialPlaneProgress.activePlaneId,
    servants: [],
    availableUpgrades: [],
    selectedUpgradeSlot: -1,
    upgradeAutoPickTimer: null,
    musicEnabled: false,
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
  let musicContext = null;
  let musicMasterGain = null;
  let musicNodes = null;
  let musicSequencerTimer = null;
  let musicStep = 0;
  let musicAudio = null;
  let musicRotateTimer = null;
  let musicUsingSynthFallback = false;
  let realMusicErrorCount = 0;
  const resolvedTrackUrlCache = new Map();
  let sfxContext = null;
  let sfxMasterGain = null;
  let lastPlayerShotSfx = 0;
  const REAL_MUSIC_PLAYLIST = [
    "https://pixabay.com/music/electronic-retro-arcade-game-music-487316/",
    "https://pixabay.com/music/video-games-game-gaming-video-game-music-471936/",
    "https://pixabay.com/music/video-games-gaming-game-video-game-music-474671/",
    "https://pixabay.com/music/video-games-chiptune-video-game-games-music-457939/",
    "https://pixabay.com/music/upbeat-retro-arcade-game-music-297305/",
    "https://pixabay.com/music/upbeat-game-minecraft-gaming-background-music-402451/",
  ];
  const BOSS_STAGE_TRACK_URL = "https://pixabay.com/music/electronic-retro-arcade-game-music-487316/";
  const BOSS_STAGE_TRACK_INDEX = Math.max(0, REAL_MUSIC_PLAYLIST.indexOf(BOSS_STAGE_TRACK_URL));

  function showUpgradeSelection(upgrades) {
    state.running = false;
    hideOverlay();
    if (state.upgradeAutoPickTimer) {
      clearTimeout(state.upgradeAutoPickTimer);
      state.upgradeAutoPickTimer = null;
    }
    state.availableUpgrades = upgrades;
    const availableSlots = state.availableUpgrades
      .map((upgrade, index) => (upgrade ? index : -1))
      .filter((index) => index >= 0);
    state.selectedUpgradeSlot = availableSlots.length > 0 ? availableSlots[0] : -1;
    arenaDom.upgradeText.textContent = `עברת שלב, כל הכבוד! 🎉 שלב ${state.stage} הושלם — בחר שדרוג אחד מתוך ${UPGRADE_OPTIONS_PER_STAGE}`;

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
      button.textContent = `${option.title} — ${option.desc} [${option.tier.name}]`;
      if (option.tier.name === "קשת") {
        button.style.background = "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)";
        button.style.color = "#fff";
      } else {
        button.style.background = option.tier.color;
        button.style.color = "#fff";
      }
      button.classList.add("upgrade-btn");
    });

    updateUpgradeSelectionVisual();
    updateTouchActionLabels();

    arenaDom.upgrade.classList.remove("hidden");

    state.upgradeAutoPickTimer = setTimeout(() => {
      if (state.running || arenaDom.upgrade.classList.contains("hidden")) {
        return;
      }

      const availableSlots = state.availableUpgrades
        .map((upgrade, index) => (upgrade ? index : -1))
        .filter((index) => index >= 0);

      if (availableSlots.length === 0) {
        startNextStage();
        return;
      }

      const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      chooseUpgrade(randomSlot);
    }, 10000);
  }

  function hideUpgradeSelection() {
    if (state.upgradeAutoPickTimer) {
      clearTimeout(state.upgradeAutoPickTimer);
      state.upgradeAutoPickTimer = null;
    }
    state.selectedUpgradeSlot = -1;
    updateUpgradeSelectionVisual();
    arenaDom.upgrade.classList.add("hidden");
    updateTouchActionLabels();
  }

  function isUpgradeOverlayVisible() {
    return Boolean(arenaDom.upgrade && !arenaDom.upgrade.classList.contains("hidden"));
  }

  function updateTouchActionLabels() {
    if (!arenaDom.touchDash || !arenaDom.touchPulse) return;
    if (isUpgradeOverlayVisible()) {
      arenaDom.touchDash.textContent = "שדרוג הבא";
      arenaDom.touchPulse.textContent = "בחר שדרוג";
    } else {
      arenaDom.touchDash.textContent = "Dash";
      arenaDom.touchPulse.textContent = "Pulse";
    }
  }

  function getUpgradeButtons() {
    return [arenaDom.upg1, arenaDom.upg2, arenaDom.upg3, arenaDom.upg4, arenaDom.upg5, arenaDom.upg6];
  }

  function getAvailableUpgradeSlots() {
    return state.availableUpgrades
      .map((upgrade, index) => (upgrade ? index : -1))
      .filter((index) => index >= 0);
  }

  function updateUpgradeSelectionVisual() {
    const buttons = getUpgradeButtons();
    buttons.forEach((button, index) => {
      if (!button || button.classList.contains("hidden")) return;
      if (index === state.selectedUpgradeSlot) {
        button.style.outline = "3px solid #ffffff";
        button.style.outlineOffset = "2px";
        button.style.filter = "brightness(1.18)";
      } else {
        button.style.outline = "none";
        button.style.outlineOffset = "0";
        button.style.filter = "brightness(1)";
      }
    });
  }

  function moveUpgradeSelection(direction) {
    const availableSlots = getAvailableUpgradeSlots();
    if (availableSlots.length === 0) return;

    const currentIndex = availableSlots.indexOf(state.selectedUpgradeSlot);
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeCurrentIndex + direction + availableSlots.length) % availableSlots.length;
    state.selectedUpgradeSlot = availableSlots[nextIndex];
    updateUpgradeSelectionVisual();
  }

  function confirmSelectedUpgrade() {
    if (state.selectedUpgradeSlot < 0) return;
    chooseUpgrade(state.selectedUpgradeSlot);
  }

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

  function readGamepadInput() {
    gamepadInput.moveX = 0;
    gamepadInput.moveY = 0;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads || []).find((item) => item && item.connected);
    if (!pad) {
      gamepadInput.dashPressed = false;
      gamepadInput.pulsePressed = false;
      gamepadInput.upgradeLeftPressed = false;
      gamepadInput.upgradeRightPressed = false;
      gamepadInput.upgradeConfirmPressed = false;
      gamepadInput.upgradeRepeatDirection = 0;
      return;
    }

    const deadzone = 0.18;
    const axisX = pad.axes[0] || 0;
    const axisY = pad.axes[1] || 0;

    const upgradeVisible = isUpgradeOverlayVisible();
    if (upgradeVisible) {
      const nowMs = performance.now();
      const horizontalAxis = pad.axes[0] || 0;
      const leftNow = Boolean(pad.buttons[14]?.pressed || pad.buttons[4]?.pressed || horizontalAxis <= -0.6);
      const rightNow = Boolean(pad.buttons[15]?.pressed || pad.buttons[5]?.pressed || horizontalAxis >= 0.6);
      const confirmNow = Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);

      let direction = 0;
      if (leftNow && !rightNow) direction = -1;
      if (rightNow && !leftNow) direction = 1;

      if (direction !== 0) {
        if (gamepadInput.upgradeRepeatDirection !== direction) {
          moveUpgradeSelection(direction);
          gamepadInput.upgradeRepeatDirection = direction;
          gamepadInput.upgradeRepeatAt = nowMs + 260;
        } else if (nowMs >= gamepadInput.upgradeRepeatAt) {
          moveUpgradeSelection(direction);
          gamepadInput.upgradeRepeatAt = nowMs + 140;
        }
      } else {
        gamepadInput.upgradeRepeatDirection = 0;
      }

      if (leftNow && !gamepadInput.upgradeLeftPressed) {
        moveUpgradeSelection(-1);
      }
      if (rightNow && !gamepadInput.upgradeRightPressed) {
        moveUpgradeSelection(1);
      }
      if (confirmNow && !gamepadInput.upgradeConfirmPressed) {
        confirmSelectedUpgrade();
      }

      gamepadInput.upgradeLeftPressed = leftNow;
      gamepadInput.upgradeRightPressed = rightNow;
      gamepadInput.upgradeConfirmPressed = confirmNow;
      gamepadInput.dashPressed = false;
      gamepadInput.pulsePressed = false;
      gamepadInput.moveX = 0;
      gamepadInput.moveY = 0;
      return;
    }

    gamepadInput.upgradeLeftPressed = false;
    gamepadInput.upgradeRightPressed = false;
    gamepadInput.upgradeConfirmPressed = false;
    gamepadInput.upgradeRepeatDirection = 0;
    gamepadInput.moveX = Math.abs(axisX) > deadzone ? axisX : 0;
    gamepadInput.moveY = Math.abs(axisY) > deadzone ? axisY : 0;

    const dashNow = Boolean(pad.buttons[1]?.pressed || pad.buttons[5]?.pressed);
    const pulseNow = Boolean(pad.buttons[0]?.pressed || pad.buttons[4]?.pressed);

    if (dashNow && !gamepadInput.dashPressed) {
      triggerDash();
    }
    if (pulseNow && !gamepadInput.pulsePressed) {
      triggerPulse();
    }

    gamepadInput.dashPressed = dashNow;
    gamepadInput.pulsePressed = pulseNow;
  }

  function setAimVector(x, y) {
    const length = Math.hypot(x, y) || 1;
    aim.x = x / length;
    aim.y = y / length;
    aim.angle = Math.atan2(aim.y, aim.x);
  }

  function getSmallServantCount() {
    return Math.min(10, Math.max(0, Math.floor(state.activePlaneId / 10)));
  }

  function getBigServantCount() {
    return Math.min(10, Math.max(0, Math.floor(state.activePlaneId / 100)));
  }

  function getServantCount() {
    return getSmallServantCount() + getBigServantCount();
  }

  function getServantMaxHp(servant) {
    if (servant?.isBig) {
      return Math.max(30, state.player.maxHp * 3);
    }
    return Math.max(20, state.player.maxHp * 0.5);
  }

  function syncServantFleet() {
    const targetCount = getServantCount();
    const smallServantCount = getSmallServantCount();
    const bigServantCount = getBigServantCount();

    if (state.servants.length > targetCount) {
      state.servants = state.servants.slice(0, targetCount);
    }

    while (state.servants.length < targetCount) {
      state.servants.push({
        hp: 1,
        maxHp: 1,
        alive: true,
        respawnTimer: 0,
        fireCooldown: 0,
        burstShotsLeft: 0,
        burstDelay: 0,
        isBig: false,
      });
    }

    state.servants.forEach((servant, index) => {
      servant.isBig = index >= smallServantCount && index < smallServantCount + bigServantCount;
      servant.maxHp = getServantMaxHp(servant);
      if (servant.alive) {
        servant.hp = Math.min(servant.hp, servant.maxHp);
      }
    });
  }

  function killServant(servant) {
    if (!servant.alive) return;
    servant.alive = false;
    servant.hp = 0;
    servant.respawnTimer = SERVANT_RESPAWN_MS;
    servant.fireCooldown = 0;
    servant.burstShotsLeft = 0;
    servant.burstDelay = 0;
  }

  function damageServant(servant, amount) {
    if (!servant || !servant.alive) return;
    servant.hp -= amount;
    if (servant.hp <= 0) {
      killServant(servant);
    }
  }

  function getServantOrbitPoint(index, total, now = performance.now()) {
    const player = state.player;
    const servantState = state.servants[index];
    const safeTotal = Math.max(1, total);

    if (!servantState) {
      const fallbackAngle = now * 0.0024 + (Math.PI * 2 * index) / safeTotal;
      const fallbackRadius = 140;
      return {
        x: player.x + Math.cos(fallbackAngle) * fallbackRadius,
        y: player.y + Math.sin(fallbackAngle) * fallbackRadius,
        angle: fallbackAngle,
      };
    }

    let orbitAngle;
    let orbitRadius;

    if (servantState.isBig) {
      const bigIndices = state.servants
        .map((servant, servantIndex) => ({ servant, servantIndex }))
        .filter(({ servant }) => servant.isBig)
        .map(({ servantIndex }) => servantIndex);
      const bigCount = Math.max(1, bigIndices.length);
      const bigOrder = Math.max(0, bigIndices.indexOf(index));
      const orbitBase = 175;
      const orbitWave = 18;
      orbitRadius = orbitBase + Math.sin(now * 0.0018 + bigOrder * 0.7) * orbitWave;
      orbitAngle = now * 0.0019 + (Math.PI * 2 * bigOrder) / bigCount;
    } else {
      const smallIndices = state.servants
        .map((servant, servantIndex) => ({ servant, servantIndex }))
        .filter(({ servant }) => !servant.isBig)
        .map(({ servantIndex }) => servantIndex);
      const smallCount = Math.max(1, smallIndices.length);
      const smallOrder = Math.max(0, smallIndices.indexOf(index));
      const wobble = Math.sin(now * 0.0016 + smallOrder * 0.45) * 0.06;
      orbitAngle = now * 0.0022 + (Math.PI * 2 * smallOrder) / smallCount + wobble;
      const orbitBase = 82;
      const orbitWave = 8;
      orbitRadius = orbitBase + Math.sin(now * 0.0019 + smallOrder * 0.6) * orbitWave;
    }

    return {
      x: player.x + Math.cos(orbitAngle) * orbitRadius,
      y: player.y + Math.sin(orbitAngle) * orbitRadius,
      angle: orbitAngle,
    };
  }

  function fireServantBullet(index, total, angle, servantState) {
    const player = state.player;
    const plane = getActivePlane();
    const now = performance.now();
    const servant = getServantOrbitPoint(index, total, now);
    const damageMultiplier = servantState?.isBig ? 3 : 0.5;
    const servantDamage = player.bulletDamage * (player.tempPower > 0 ? 1.4 : 1) * plane.damageMult * damageMultiplier;
    let targetAngle = angle;

    const targets = state.enemies.map((enemy) => ({ x: enemy.x, y: enemy.y }));
    if (state.boss) {
      targets.push({ x: state.boss.x, y: state.boss.y });
    }

    if (targets.length > 0) {
      let nearest = targets[0];
      let nearestDistance = Infinity;
      targets.forEach((target) => {
        const dist = distance(servant.x, servant.y, target.x, target.y);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearest = target;
        }
      });
      targetAngle = Math.atan2(nearest.y - servant.y, nearest.x - servant.x);
    }

    const servantShotCount = servantState?.isBig ? 10 : 1;
    const servantSpreadArc = servantState?.isBig ? 0.28 : 0;
    for (let bulletIndex = 0; bulletIndex < servantShotCount; bulletIndex += 1) {
      const t = servantShotCount === 1 ? 0 : bulletIndex / (servantShotCount - 1) - 0.5;
      const shotAngle = targetAngle + t * servantSpreadArc;
      state.bullets.push({
        x: servant.x,
        y: servant.y,
        vx: Math.cos(shotAngle) * player.bulletSpeed,
        vy: Math.sin(shotAngle) * player.bulletSpeed,
        life: 72,
        damage: servantDamage,
        radius: 2.3,
      });
    }
  }

  function updateServants(dt) {
    syncServantFleet();

    const servantCount = state.servants.length;
    const baseAngle = aim.angle;

    state.servants.forEach((servant, index) => {
      if (servant.alive) {
        if (servant.fireCooldown > 0) {
          servant.fireCooldown -= dt;
        }

        if (servant.burstDelay > 0) {
          servant.burstDelay -= dt;
        }

        if (state.running && servant.burstShotsLeft > 0 && servant.burstDelay <= 0) {
          const servantAngle = baseAngle + (index - (servantCount - 1) / 2) * 0.01;
          fireServantBullet(index, servantCount, servantAngle, servant);
          servant.burstShotsLeft -= 1;
          if (servant.burstShotsLeft > 0) {
            servant.burstDelay = SERVANT_BURST_INTERVAL_MS;
          }
        }
        return;
      }

      servant.respawnTimer -= dt;
      if (servant.respawnTimer <= 0) {
        servant.alive = true;
        servant.maxHp = getServantMaxHp(servant);
        servant.hp = servant.maxHp;
        servant.fireCooldown = 0;
        servant.burstShotsLeft = 0;
        servant.burstDelay = 0;
      }
    });
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

  function initSkyTraffic() {
    state.skyTraffic = [];
    for (let i = 0; i < 22; i += 1) {
      state.skyTraffic.push({
        x: Math.random() * (WIDTH + 220) - 110,
        y: Math.random() * (HEIGHT * 0.7),
        speed: 0.6 + Math.random() * 2.2,
        size: 6 + Math.random() * 16,
        alpha: 0.08 + Math.random() * 0.2,
        hueShift: Math.random() * 60,
      });
    }
  }

  function updateSkyTraffic(dtFactor) {
    state.skyTraffic.forEach((craft) => {
      craft.x -= craft.speed * dtFactor;
      if (craft.x < -140) {
        craft.x = WIDTH + 140 + Math.random() * 160;
        craft.y = Math.random() * (HEIGHT * 0.72);
      }
    });
  }

  function setMusicButtonLabel() {
    if (!arenaDom.musicBtn) return;
    arenaDom.musicBtn.textContent = state.musicEnabled ? "♪ מוזיקה: פועל" : "♪ מוזיקה: כבוי";
  }

  function pickRandomTrackIndex(excludeCurrent = true) {
    if (REAL_MUSIC_PLAYLIST.length <= 1) return 0;
    let next = Math.floor(Math.random() * REAL_MUSIC_PLAYLIST.length);
    if (excludeCurrent) {
      let guard = 0;
      while (next === musicStep && guard < 10) {
        next = Math.floor(Math.random() * REAL_MUSIC_PLAYLIST.length);
        guard += 1;
      }
    }
    return next;
  }

  async function resolvePlayableTrackSource(trackUrl) {
    if (!trackUrl) return null;
    if (/\.mp3(\?|$)/i.test(trackUrl)) {
      return trackUrl;
    }

    if (resolvedTrackUrlCache.has(trackUrl)) {
      return resolvedTrackUrlCache.get(trackUrl);
    }

    if (trackUrl.includes("pixabay.com/music/")) {
      try {
        const response = await fetch(trackUrl);
        const html = await response.text();
        const normalizedHtml = html.replace(/\\\//g, "/");
        const match = normalizedHtml.match(/https?:\/\/cdn\.pixabay\.com\/download\/audio\/[^"'\s]+?\.mp3[^"'\s]*/i);
        if (match && match[0]) {
          const resolved = match[0].replace(/&amp;/g, "&");
          resolvedTrackUrlCache.set(trackUrl, resolved);
          return resolved;
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  async function playRealTrackByIndex(index) {
    if (!musicAudio) return;
    const normalizedIndex = clamp(index, 0, REAL_MUSIC_PLAYLIST.length - 1);
    musicStep = normalizedIndex;
    const trackUrl = REAL_MUSIC_PLAYLIST[normalizedIndex];
    const playable = await resolvePlayableTrackSource(trackUrl);
    if (!playable) {
      realMusicErrorCount += 1;
      if (realMusicErrorCount >= REAL_MUSIC_PLAYLIST.length + 1) {
        await enableSynthMusicFallback();
      }
      return;
    }
    musicAudio.src = playable;
    if (state.musicEnabled) {
      const playPromise = musicAudio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(async () => {
          realMusicErrorCount += 1;
          if (realMusicErrorCount >= REAL_MUSIC_PLAYLIST.length + 1) {
            await enableSynthMusicFallback();
          }
        });
      }
    }
  }

  async function playNextRealTrack(excludeCurrent = true) {
    if (!musicAudio) return;
    const nextIndex = pickRandomTrackIndex(excludeCurrent);
    await playRealTrackByIndex(nextIndex);
  }

  async function enableSynthMusicFallback() {
    if (musicUsingSynthFallback) return;
    await setupSpaceMusic();
    if (!musicContext) return;
    musicUsingSynthFallback = true;
    await musicContext.resume();
    startMusicSequencer();
  }

  async function disableSynthMusicFallback() {
    if (!musicUsingSynthFallback) return;
    stopMusicSequencer();
    if (musicContext) {
      await musicContext.suspend();
    }
    musicUsingSynthFallback = false;
  }

  function startMusicRotation() {
    if (musicRotateTimer) return;
    musicRotateTimer = setInterval(() => {
      if (!state.musicEnabled) return;
      if (state.isBossStage) {
        if (musicStep !== BOSS_STAGE_TRACK_INDEX) {
          void playRealTrackByIndex(BOSS_STAGE_TRACK_INDEX);
        }
        return;
      }
      void playNextRealTrack(true);
    }, 65000);
  }

  function stopMusicRotation() {
    if (!musicRotateTimer) return;
    clearInterval(musicRotateTimer);
    musicRotateTimer = null;
  }

  function setupRealMusicPlayer() {
    if (musicAudio) {
      return;
    }

    musicStep = pickRandomTrackIndex(false);
    musicAudio = new Audio();
    musicAudio.preload = "auto";
    musicAudio.crossOrigin = "anonymous";
    musicAudio.volume = 0.72;
    musicAudio.addEventListener("ended", () => {
      realMusicErrorCount = 0;
      void playNextRealTrack(true);
    });
    musicAudio.addEventListener("canplay", () => {
      realMusicErrorCount = 0;
      void disableSynthMusicFallback();
    });
    musicAudio.addEventListener("playing", () => {
      realMusicErrorCount = 0;
      void disableSynthMusicFallback();
    });
    musicAudio.addEventListener("error", async () => {
      realMusicErrorCount += 1;
      if (realMusicErrorCount >= REAL_MUSIC_PLAYLIST.length + 1) {
        await enableSynthMusicFallback();
        return;
      }
      void playNextRealTrack(true);
    });
  }

  async function setupSpaceMusic() {
    if (musicContext) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    musicContext = new AudioContextCtor();
    musicMasterGain = musicContext.createGain();
    musicMasterGain.gain.value = 0.24;
    musicMasterGain.connect(musicContext.destination);

    const engineOsc = musicContext.createOscillator();
    engineOsc.type = "sawtooth";
    engineOsc.frequency.value = 54;
    const engineFilter = musicContext.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 240;
    const engineGain = musicContext.createGain();
    engineGain.gain.value = 0.04;

    const padOscA = musicContext.createOscillator();
    padOscA.type = "triangle";
    padOscA.frequency.value = 164.81;
    const padOscB = musicContext.createOscillator();
    padOscB.type = "sine";
    padOscB.frequency.value = 246.94;
    const padFilter = musicContext.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 680;
    const padGain = musicContext.createGain();
    padGain.gain.value = 0.03;

    const leadOsc = musicContext.createOscillator();
    leadOsc.type = "square";
    leadOsc.frequency.value = 329.63;
    const leadFilter = musicContext.createBiquadFilter();
    leadFilter.type = "bandpass";
    leadFilter.frequency.value = 980;
    const leadGain = musicContext.createGain();
    leadGain.gain.value = 0.02;

    const rumbleOsc = musicContext.createOscillator();
    rumbleOsc.type = "triangle";
    rumbleOsc.frequency.value = 41.2;
    const rumbleFilter = musicContext.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 170;
    const rumbleGain = musicContext.createGain();
    rumbleGain.gain.value = 0.02;

    const lfo = musicContext.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = musicContext.createGain();
    lfoGain.gain.value = 0.025;

    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(musicMasterGain);

    padOscA.connect(padFilter);
    padOscB.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(musicMasterGain);

    leadOsc.connect(leadFilter);
    leadFilter.connect(leadGain);
    leadGain.connect(musicMasterGain);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(musicMasterGain);

    engineOsc.start();
    padOscA.start();
    padOscB.start();
    leadOsc.start();
    rumbleOsc.start();
    lfo.start();

    musicNodes = {
      engineOsc,
      padOscA,
      padOscB,
      leadOsc,
      rumbleOsc,
      lfo,
      engineFilter,
      padFilter,
      leadFilter,
      rumbleFilter,
      engineGain,
      padGain,
      leadGain,
      rumbleGain,
    };
  }

  function startMusicSequencer() {
    if (!musicContext || !musicNodes || musicSequencerTimer) return;

    const progression = [
      [92.5, 138.59, 185],
      [98, 146.83, 196],
      [110, 164.81, 220],
      [123.47, 185, 246.94],
    ];
    const bossProgression = [
      [87.31, 130.81, 196],
      [98, 146.83, 220],
      [110, 174.61, 246.94],
      [123.47, 185, 277.18],
    ];
    const leadLine = [293.66, 349.23, 392, 440, 392, 349.23, 329.63, 261.63];
    const leadBossLine = [392, 440, 523.25, 587.33, 659.25, 587.33, 523.25, 440];

    musicSequencerTimer = setInterval(() => {
      if (!state.musicEnabled || !musicNodes || !musicContext) {
        return;
      }

      const isBossMoment = state.isBossStage;
      const stageIntensity = clamp((state.stage - 1) / 40, 0, 1);
      const chordSet = isBossMoment ? bossProgression : progression;
      const chord = chordSet[musicStep % chordSet.length];
      const t = musicContext.currentTime;

      musicNodes.engineOsc.frequency.setTargetAtTime(chord[0] * (0.46 + stageIntensity * 0.11), t, 0.08);
      musicNodes.padOscA.frequency.setTargetAtTime(chord[1], t, 0.14);
      musicNodes.padOscB.frequency.setTargetAtTime(chord[2], t, 0.16);
      const leadSet = isBossMoment ? leadBossLine : leadLine;
      const leadFreq = leadSet[musicStep % leadSet.length];
      musicNodes.leadOsc.frequency.setTargetAtTime(leadFreq, t, 0.06);

      musicNodes.engineFilter.frequency.setTargetAtTime(230 + (musicStep % 4) * 95 + stageIntensity * 120, t, 0.1);
      musicNodes.padFilter.frequency.setTargetAtTime(640 + (musicStep % 4) * 140 + stageIntensity * 160, t, 0.12);
      musicNodes.leadFilter.frequency.setTargetAtTime((isBossMoment ? 1350 : 980) + (musicStep % 3) * 120, t, 0.09);
      musicNodes.rumbleFilter.frequency.setTargetAtTime(180 + stageIntensity * 90 + (isBossMoment ? 80 : 0), t, 0.1);

      const pulse = (musicStep % 2) === 0 ? 0.14 : 0.08;
      const bossBoost = isBossMoment ? 1.35 : 1;
      musicNodes.engineGain.gain.setTargetAtTime(pulse * bossBoost, t, 0.03);
      musicNodes.padGain.gain.setTargetAtTime((0.07 + stageIntensity * 0.02) * bossBoost, t, 0.05);
      musicNodes.leadGain.gain.setTargetAtTime((0.06 + (musicStep % 4 === 0 ? 0.03 : 0)) * bossBoost, t, 0.04);
      musicNodes.rumbleGain.gain.setTargetAtTime((0.05 + stageIntensity * 0.04) * bossBoost, t, 0.06);
      musicMasterGain.gain.setTargetAtTime(0.34 + stageIntensity * 0.06 + (isBossMoment ? 0.07 : 0), t, 0.05);

      musicStep += 1;
    }, 220);
  }

  function stopMusicSequencer() {
    if (!musicSequencerTimer) return;
    clearInterval(musicSequencerTimer);
    musicSequencerTimer = null;
  }

  function setupSfxAudio() {
    if (sfxContext) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    sfxContext = new AudioContextCtor();
    sfxMasterGain = sfxContext.createGain();
    sfxMasterGain.gain.value = 0.34;
    sfxMasterGain.connect(sfxContext.destination);
  }

  function playMainShotSfx(totalShots, rapidFactor) {
    setupSfxAudio();
    if (!sfxContext || !sfxMasterGain) return;

    if (sfxContext.state === "suspended") {
      void sfxContext.resume().catch(() => {});
    }

    const nowMs = performance.now();
    if (nowMs - lastPlayerShotSfx < 55) {
      return;
    }
    lastPlayerShotSfx = nowMs;

    const now = sfxContext.currentTime;
    const toneOsc = sfxContext.createOscillator();
    toneOsc.type = "square";
    const tailOsc = sfxContext.createOscillator();
    tailOsc.type = "triangle";

    const highPass = sfxContext.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 520;

    const bodyGain = sfxContext.createGain();
    const totalFactor = clamp(totalShots / 4, 0.8, 1.8);
    const rapidBoost = clamp(1.25 - rapidFactor * 0.4, 0.9, 1.25);
    const peak = 0.13 * totalFactor * rapidBoost;
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    toneOsc.frequency.setValueAtTime(960, now);
    toneOsc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
    tailOsc.frequency.setValueAtTime(580, now);
    tailOsc.frequency.exponentialRampToValueAtTime(210, now + 0.12);

    toneOsc.connect(highPass);
    tailOsc.connect(highPass);
    highPass.connect(bodyGain);
    bodyGain.connect(sfxMasterGain);

    toneOsc.start(now);
    tailOsc.start(now);
    toneOsc.stop(now + 0.13);
    tailOsc.stop(now + 0.14);
  }

  async function setMusicEnabled(enabled) {
    setupRealMusicPlayer();

    if (enabled) {
      state.musicEnabled = true;
      if (musicAudio) {
        void playNextRealTrack(false);
      }
      startMusicRotation();
    } else {
      stopMusicRotation();
      if (musicAudio) {
        musicAudio.pause();
      }
      await disableSynthMusicFallback();
      state.musicEnabled = false;
    }
    setMusicButtonLabel();
  }

  async function toggleMusic() {
    await setMusicEnabled(!state.musicEnabled);
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

  function getActivePlane() {
    return state.planes[Math.max(0, state.activePlaneId - 1)] || state.planes[0];
  }

  function enforceCreatorModePlanes() {
    if (!state.creatorMode) return;
    state.unlockedPlaneCount = MAX_PLANES;
    state.activePlaneId = clamp(state.activePlaneId || MAX_PLANES, 1, MAX_PLANES);
  }

  function renderPlaneDock() {
    if (!arenaDom.planeList || !arenaDom.planeActive) return;

    const activePlane = getActivePlane();
    const nextUnlock = Math.min(MAX_PLANES, state.unlockedPlaneCount + 1);
    arenaDom.planeActive.textContent = `מטוס פעיל: ${activePlane.id} • ${activePlane.title}`;

    const fragment = document.createDocumentFragment();
    for (let planeId = 1; planeId <= MAX_PLANES; planeId += 1) {
      const plane = state.planes[planeId - 1];
      const unlocked = planeId <= state.unlockedPlaneCount;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "plane-item";
      if (unlocked) {
        button.classList.add("unlocked");
      }
      if (planeId === state.activePlaneId) {
        button.classList.add("active");
      }
      button.dataset.planeId = String(planeId);
      if (unlocked) {
        button.textContent = `#${planeId} ${plane.title}`;
        button.disabled = false;
      } else {
        button.textContent = `🔒 #${planeId} | מחיר: ${planeId}🪙`;
        const canBuyNow = state.creatorMode || planeId === nextUnlock;
        button.disabled = !canBuyNow;
      }
      fragment.appendChild(button);
    }

    arenaDom.planeList.innerHTML = "";
    arenaDom.planeList.appendChild(fragment);

    const activeButton = arenaDom.planeList.querySelector(".plane-item.active");
    if (activeButton) {
      activeButton.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function syncPlaneUnlocks() {
    enforceCreatorModePlanes();
    if (state.creatorMode) {
      renderPlaneDock();
      return null;
    }

    if (state.activePlaneId > state.unlockedPlaneCount) {
      state.activePlaneId = state.unlockedPlaneCount;
      savePlaneProgress();
      renderPlaneDock();
    }

    return null;
  }

  function applyPlaneStartingLoadout() {
    const player = state.player;
    const plane = getActivePlane();

    player.hp = Math.min(player.maxHp, player.hp + plane.startHpBonus);
    player.shieldLayers = Math.max(player.shieldLayers, plane.startShieldLayers);
    player.tempRapid = Math.max(player.tempRapid, plane.startRapidMs);
    player.tempSpread = Math.max(player.tempSpread, plane.startSpreadMs);
    player.tempPower = Math.max(player.tempPower, plane.startPowerMs);
  }

  function updateHud() {
    const player = state.player;
    const plane = getActivePlane();

    arenaDom.score.textContent = Math.floor(state.score);
    arenaDom.health.textContent = Math.max(0, Math.floor(player.hp));
    arenaDom.wave.textContent = state.stage;
    if (arenaDom.coins) {
      arenaDom.coins.textContent = `🪙 מטבעות: ${Math.floor(state.coins)}`;
    }

    const spreadBonus = player.tempSpread > 0 ? " +Spread" : "";
    arenaDom.weapon.textContent = `P${plane.id} • Cannon x${player.shotCount + plane.shotBonus}${spreadBonus}`;
    arenaDom.dash.textContent = player.dashCooldown <= 0 ? "Ready" : `${(player.dashCooldown / 1000).toFixed(1)}s`;
    arenaDom.pulse.textContent = player.pulseCooldown <= 0 ? "Ready" : `${(player.pulseCooldown / 1000).toFixed(1)}s`;
  }

  function stageGoalFor(stage) {
    return 10 + stage * 4;
  }

  function getEnemyStageScaling(stage) {
    const stageProgress = Math.max(0, stage - 1);
    const stageMultiplier = 1.1 ** stageProgress;
    const smallEnemyDamageMultiplier = 0.35;
    return {
      hp: stageMultiplier,
      speed: 1,
      damage: stageMultiplier * smallEnemyDamageMultiplier,
      fireCooldown: 1,
      contactDamage: (18 + stage * 1.3) * stageMultiplier * smallEnemyDamageMultiplier,
    };
  }

  function getBossStageScaling(stage, bossTier) {
    const tierProgress = Math.max(0, bossTier - 1);
    const hpMultiplier = 3 ** tierProgress;
    const damageMultiplier = 2 ** tierProgress;
    return {
      hp: hpMultiplier,
      damage: damageMultiplier,
      fireRate: 1,
      bulletSpeed: 1,
      contactDamage: 34 * damageMultiplier,
      laserDamage: 16 * damageMultiplier,
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
    const hp = variant.baseHp * scaling.hp;
    state.boss = {
      x: WIDTH / 2,
      y: 92,
      radius: variant.radius,
      variant,
      tier: bossTier,
      damageScale: scaling.damage,
      fireRateScale: scaling.fireRate,
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
      if (state.musicEnabled && musicAudio) {
        void playRealTrackByIndex(BOSS_STAGE_TRACK_INDEX);
      }
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
    state.servants = [];
    enforceCreatorModePlanes();
    state.unlockedPlaneCount = state.creatorMode ? MAX_PLANES : clamp(state.unlockedPlaneCount, 1, MAX_PLANES);
    state.activePlaneId = clamp(state.activePlaneId, 1, state.unlockedPlaneCount);

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
    applyPlaneStartingLoadout();

    initStars();
    initSkyTraffic();
    initPlanetsForStage();
    resetStageProgress();
    hideOverlay();
    hideUpgradeSelection();
    renderPlaneDock();
    savePlaneProgress();
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
    const speed = type.speed(1) * scaling.speed;

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
    const plane = getActivePlane();

    const rapidFactor = (player.tempRapid > 0 ? 0.62 : 1) * plane.fireRateMult;
    const shotCount = player.shotCount + plane.shotBonus + (player.tempSpread > 0 ? 2 : 0);
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
        damage: player.bulletDamage * (player.tempPower > 0 ? 1.4 : 1) * plane.damageMult,
        radius: 3.3,
      });
    }

    playMainShotSfx(total, rapidFactor);

    const servantCount = state.servants.length;
    if (servantCount > 0) {
      for (let index = 0; index < servantCount; index += 1) {
        const servantState = state.servants[index];
        if (!servantState || !servantState.alive || servantState.fireCooldown > 0) {
          continue;
        }

        const servantAngle = baseAngle + (index - (servantCount - 1) / 2) * 0.01;
        fireServantBullet(index, servantCount, servantAngle, servantState);
        servantState.burstShotsLeft = SERVANT_BURST_SHOTS - 1;
        servantState.burstDelay = SERVANT_BURST_INTERVAL_MS;
        servantState.fireCooldown = player.fireRate * 2;
      }
    }

    player.fireCooldown = player.fireRate * rapidFactor;
    addParticles(player.x, player.y, "#a7ffd5", 5, 1.7);
  }

  function triggerDash() {
    const player = state.player;
    if (!state.running || player.dashCooldown > 0) return;
    const plane = getActivePlane();

    const angle = aim.angle;
    player.x += Math.cos(angle) * player.dashPower * 8 * plane.dashMult;
    player.y += Math.sin(angle) * player.dashPower * 8 * plane.dashMult;
    player.x = clamp(player.x, 26, WIDTH - 26);
    player.y = clamp(player.y, 26, HEIGHT - 26);

    player.invuln = 250;
    player.dashCooldown = player.dashCooldownBase * plane.dashCooldownMult;
    addParticles(player.x, player.y, "#8de9ff", 20, 3.1);
  }

  function triggerPulse() {
    const player = state.player;
    if (!state.running || player.pulseCooldown > 0) return;
    const plane = getActivePlane();
    const pulseRadius = player.pulseRadius * plane.pulseRadiusMult;
    const pulsePower = player.pulsePower * plane.pulsePowerMult;

    player.pulseFlash = 150;
    player.pulseCooldown = player.pulseCooldownBase;

    state.enemies.forEach((enemy) => {
      const dist = distance(player.x, player.y, enemy.x, enemy.y);
      if (dist <= pulseRadius) {
        const pushX = (enemy.x - player.x) / Math.max(1, dist);
        const pushY = (enemy.y - player.y) / Math.max(1, dist);
        enemy.x += pushX * 85;
        enemy.y += pushY * 85;
        enemy.hp -= pulsePower;
      }
    });

    state.enemyBullets = state.enemyBullets.filter((bullet) => {
      const dist = distance(player.x, player.y, bullet.x, bullet.y);
      return dist > pulseRadius;
    });

    addParticles(player.x, player.y, "#95a9ff", 34, 3.3);
  }

  function fireEnemy(enemy) {
    const player = state.player;
    const type = enemy.type;
    const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const scaling = getEnemyStageScaling(state.stage);
    const damageScale = scaling.damage;
    const speedScale = 1;

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
        boss.jumpCooldown = 1700;
        addParticles(boss.x, boss.y, "#ebccff", 20, 2.5);
      }
    }

    boss.burstCooldown -= dt;
    if (boss.burstCooldown <= 0) {
      fireBossBurst(boss);
      const baseCooldown = boss.variant.id === "seraph" ? 760 : 980;
      boss.burstCooldown = baseCooldown * boss.fireRateScale;
    }

    boss.missileCooldown -= dt;
    if (boss.missileCooldown <= 0) {
      fireBossMissile(boss);
      const baseCooldown = boss.variant.id === "wraith" ? 1180 : 1400;
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
      boss.laser.timer = boss.variant.id === "wraith" ? 1800 : 2500;
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

  // פונקציה חדשה: בוחר tier לפי סיכוי
  function pickUpgradeTier() {
    const rand = Math.random();
    let acc = 0;
    for (const tier of UPGRADE_TIERS) {
      acc += tier.chance;
      if (rand < acc) return tier;
    }
    return UPGRADE_TIERS[0];
  }

  function buildUpgradeOptions() {
    const pool = [...UPGRADE_POOL];
    const picks = [];
    while (picks.length < UPGRADE_OPTIONS_PER_STAGE && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      const upgrade = pool.splice(index, 1)[0];
      const tier = pickUpgradeTier();
      picks.push({ ...upgrade, tier });
    }
    return picks;
  }

  function startNextStage() {
    state.stage += 1;
    state.running = true;
    hideUpgradeSelection();
    initPlanetsForStage();
    resetStageProgress();
    applyPlaneStartingLoadout();
    syncPlaneUnlocks();
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
    const plane = getActivePlane();
    if (player.invuln > 0 || !state.running) return;

    if (player.shieldLayers > 0) {
      player.shieldLayers -= 1;
      player.invuln = 220;
      addParticles(player.x, player.y, "#8fd6ff", 16, 2.5);
      return;
    }

    player.hp -= amount * (1 - plane.damageReduction);
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
    const plane = getActivePlane();

    if (player.fireCooldown > 0) player.fireCooldown -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.pulseCooldown > 0) player.pulseCooldown -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.pulseFlash > 0) player.pulseFlash -= dt;
    if (player.tempRapid > 0) player.tempRapid -= dt;
    if (player.tempSpread > 0) player.tempSpread -= dt;
    if (player.tempPower > 0) player.tempPower -= dt;

    if (state.running && player.hp > 0) {
      player.hp = Math.min(player.maxHp, player.hp + plane.regenPerSecond * (dt / 1000));
    }

    state.stars.forEach((star) => {
      star.y += (0.12 + star.depth * 0.24) * dtFactor * (1 + state.stage * 0.02);
      if (star.y > HEIGHT + 4) {
        star.y = -3;
        star.x = Math.random() * WIDTH;
      }
    });
    updateSkyTraffic(dtFactor);

    if (!state.running) {
      updateHud();
      return;
    }

    readGamepadInput();

    let moveX = 0;
    let moveY = 0;
    if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
    if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;

    moveX += gamepadInput.moveX;
    moveY += gamepadInput.moveY;

    if (touchInput.active) {
      const dx = touchInput.targetX - player.x;
      const dy = touchInput.targetY - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        moveX += dx / dist;
        moveY += dy / dist;
      }
    }

    updateAutoAim();
    updateServants(dt);

    const norm = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / norm) * player.speed * plane.speedMult * dtFactor;
    player.y += (moveY / norm) * player.speed * plane.speedMult * dtFactor;
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
        state.coins += 1;
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
      state.coins += 5;
      addParticles(state.boss.x, state.boss.y, "#ffe099", 48, 3.5);
      state.boss = null;
      state.stageDefeated = state.stageGoal;
    }

    state.enemyBullets.forEach((bullet) => {
      if (bullet.life <= 0) return;

      const servantCount = state.servants.length;
      const now = performance.now();
      for (let index = 0; index < servantCount; index += 1) {
        const servant = state.servants[index];
        if (!servant || !servant.alive) continue;
        const orbit = getServantOrbitPoint(index, servantCount, now);
        const servantRadius = player.radius * 0.52;
        if (distance(bullet.x, bullet.y, orbit.x, orbit.y) <= servantRadius + bullet.radius) {
          bullet.life = 0;
          damageServant(servant, bullet.damage);
          addParticles(orbit.x, orbit.y, "#9bd9ff", 8, 2.1);
          return;
        }
      }

      if (distance(bullet.x, bullet.y, player.x, player.y) <= player.radius + bullet.radius) {
        bullet.life = 0;
        playerTakeDamage(bullet.damage);
      }
    });

    state.enemies.forEach((enemy) => {
      const servantCount = state.servants.length;
      const now = performance.now();
      for (let index = 0; index < servantCount; index += 1) {
        const servant = state.servants[index];
        if (!servant || !servant.alive) continue;
        const orbit = getServantOrbitPoint(index, servantCount, now);
        const servantRadius = player.radius * 0.52;
        if (distance(enemy.x, enemy.y, orbit.x, orbit.y) <= enemy.radius + servantRadius) {
          const scaling = getEnemyStageScaling(state.stage);
          damageServant(servant, scaling.contactDamage);
          enemy.hp -= 22;
          addParticles(orbit.x, orbit.y, "#8fd6ff", 6, 1.9);
        }
      }

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

        const servantCount = state.servants.length;
        const now = performance.now();
        for (let index = 0; index < servantCount; index += 1) {
          const servant = state.servants[index];
          if (!servant || !servant.alive) continue;
          const orbit = getServantOrbitPoint(index, servantCount, now);
          const ds = distanceToLaser(state.boss.x, state.boss.y, state.boss.laser.angle, orbit.x, orbit.y);
          if (ds <= player.radius * 0.52 + 8 && state.bossLaserTick <= 0) {
            damageServant(servant, (state.boss.laserTickDamage || 14) * 0.7);
            addParticles(orbit.x, orbit.y, "#b9b5ff", 7, 1.8);
          }
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

    state.skyTraffic.forEach((craft) => {
      const tint = 170 + craft.hueShift;
      ctx.globalAlpha = craft.alpha;
      ctx.fillStyle = `hsla(${tint}, 80%, 78%, 1)`;
      ctx.beginPath();
      ctx.moveTo(craft.x + craft.size, craft.y);
      ctx.lineTo(craft.x - craft.size * 0.7, craft.y + craft.size * 0.33);
      ctx.lineTo(craft.x - craft.size * 0.35, craft.y);
      ctx.lineTo(craft.x - craft.size * 0.7, craft.y - craft.size * 0.33);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(180,220,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(craft.x - craft.size * 0.9, craft.y);
      ctx.lineTo(craft.x - craft.size * 2.4, craft.y);
      ctx.stroke();
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
    const plane = getActivePlane();
    const wingSpan = 13 * plane.wingScale;
    const bodyTail = 24 + plane.id * 0.03;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + Math.PI / 2);

    const alpha = player.invuln > 0 ? 0.65 + Math.sin(performance.now() * 0.03) * 0.2 : 1;
    ctx.globalAlpha = alpha;

    ctx.shadowColor = plane.glow;
    ctx.shadowBlur = 10 + Math.min(18, plane.id * 0.18);
    ctx.fillStyle = plane.primary;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(wingSpan, 12);
    ctx.lineTo(4, 8);
    ctx.lineTo(4, bodyTail);
    ctx.lineTo(-4, bodyTail);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-wingSpan, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = plane.secondary;
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

  function drawPlaneServants() {
    const servantCount = state.servants.length;
    if (servantCount <= 0) return;

    const plane = getActivePlane();
    const maxPlane = state.planes[MAX_PLANES - 1];
    const bigServantScale = Math.max(1.2, maxPlane.wingScale * 0.45);
    const smallServantScale = 0.52;
    const now = performance.now();

    for (let index = 0; index < servantCount; index += 1) {
      const servantState = state.servants[index];
      if (!servantState) {
        continue;
      }

      const servant = getServantOrbitPoint(index, servantCount, now);
      const facing = aim.angle;

      if (!servantState.alive) {
        ctx.save();
        ctx.translate(servant.x, servant.y);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "600 8px Rubik";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${Math.ceil(servantState.respawnTimer / 1000)}`, 0, 0.5);
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.translate(servant.x, servant.y);
      ctx.rotate(facing + Math.PI / 2);
      const servantScale = servantState.isBig ? bigServantScale : smallServantScale;
      ctx.scale(servantScale, servantScale);

      ctx.shadowColor = servantState.isBig ? plane.glow : "rgba(180, 255, 215, 0.55)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = servantState.isBig ? plane.secondary : "#8de1ff";

      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(9, 10);
      ctx.lineTo(3, 7);
      ctx.lineTo(3, 18);
      ctx.lineTo(-3, 18);
      ctx.lineTo(-3, 7);
      ctx.lineTo(-9, 10);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(-2, -4, 4, 10);
      ctx.restore();
    }
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
    const now = performance.now();
    const bodyRadius = variant.radius;
    const pulse = 1 + Math.sin(now * 0.005) * 0.05;
    const wing = bodyRadius * 0.78;
    const tail = bodyRadius * 0.72;

    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);

    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.shadowColor = `${variant.primary}bb`;
    ctx.shadowBlur = 24;

    const hullGradient = ctx.createLinearGradient(0, -bodyRadius * 1.2, 0, bodyRadius * 0.9);
    hullGradient.addColorStop(0, variant.secondary);
    hullGradient.addColorStop(1, variant.primary);
    ctx.fillStyle = hullGradient;

    ctx.beginPath();
    ctx.moveTo(0, -bodyRadius * 1.18 * pulse);
    ctx.lineTo(wing, bodyRadius * 0.16);
    ctx.lineTo(bodyRadius * 0.45, bodyRadius * 0.55);
    ctx.lineTo(bodyRadius * 0.36, tail);
    ctx.lineTo(-bodyRadius * 0.36, tail);
    ctx.lineTo(-bodyRadius * 0.45, bodyRadius * 0.55);
    ctx.lineTo(-wing, bodyRadius * 0.16);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(8, 13, 26, 0.62)";
    ctx.fillRect(-bodyRadius * 0.16, -bodyRadius * 0.36, bodyRadius * 0.32, bodyRadius * 0.56);

    ctx.fillStyle = variant.secondary;
    ctx.fillRect(-bodyRadius * 0.45, bodyRadius * 0.16, bodyRadius * 0.9, bodyRadius * 0.12);

    ctx.strokeStyle = `${variant.secondary}cc`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -bodyRadius * 0.05, bodyRadius * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(boss.x - 90, boss.y - boss.radius - 22, 180, 8);
    ctx.fillStyle = variant.secondary;
    ctx.fillRect(boss.x - 90, boss.y - boss.radius - 22, 180 * ratio, 8);

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

  function drawBossTopHealthBar() {
    const boss = state.boss;
    if (!boss) return;

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    const barWidth = 440;
    const barHeight = 18;
    const x = (WIDTH - barWidth) / 2;
    const y = 18;

    ctx.save();
    ctx.fillStyle = "rgba(7,10,18,0.82)";
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y, barWidth, barHeight);

    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, boss.variant.primary);
    gradient.addColorStop(1, boss.variant.secondary);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * ratio, barHeight);

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 13px Rubik";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${boss.variant.name} • HP ${Math.max(0, Math.floor(boss.hp))} / ${Math.floor(boss.maxHp)}`, WIDTH / 2, y - 11);
    ctx.restore();
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
    const plane = getActivePlane();
    if (player.pulseFlash <= 0) return;

    const alpha = player.pulseFlash / 150;
    const radius = player.pulseRadius * plane.pulseRadiusMult - player.pulseFlash * 0.3;

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
    drawPlaneServants();
    drawPlayerPlane();
    drawPickups();
    drawParticles();
    drawCrosshair();
    drawStageBanner();
    drawBossTopHealthBar();
  }

  function loop(now) {
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  function chooseUpgrade(slot) {
    if (state.upgradeAutoPickTimer) {
      clearTimeout(state.upgradeAutoPickTimer);
      state.upgradeAutoPickTimer = null;
    }

    const selected = state.availableUpgrades[slot];
    if (!selected) return;

    // הצגת tier בצ'אט או overlay
    showOverlay(
      `שדרוג ${selected.title} (${selected.tier.name})`,
      `רמה: ${selected.tier.name} | צבע: ${selected.tier.color}`
    );
    // תיקון: מתחיל שלב חדש מיד, overlay ייסגר אוטומטית
    selected.apply(state.player, selected.tier);
    state.player.hp = state.player.maxHp;
    state.score += 30;
    startNextStage();
    updateHud();
    setTimeout(() => {
      hideOverlay();
    }, 900);
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

  function setCreatorMode(enabled) {
    state.creatorMode = Boolean(enabled);
    if (state.creatorMode) {
      state.unlockedPlaneCount = MAX_PLANES;
      state.activePlaneId = MAX_PLANES;
    }
    savePlaneProgress();
    resetGame();
  }

  window.activateHaloCreatorMode = (code) => {
    if (code !== CREATOR_ACCESS_CODE) {
      return false;
    }
    setCreatorMode(true);
    localStorage.setItem(CREATOR_MODE_KEY, "1");
    return true;
  };

  window.disableHaloCreatorMode = () => {
    setCreatorMode(false);
    localStorage.removeItem(CREATOR_MODE_KEY);
    return true;
  };

  if (localStorage.getItem(CREATOR_MODE_KEY) === "1") {
    state.creatorMode = true;
    enforceCreatorModePlanes();
  }

  setMusicButtonLabel();

  window.addEventListener(
    "pointerdown",
    () => {
      if (!state.musicEnabled) {
        void setMusicEnabled(true);
      }
    },
    { once: true }
  );

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "f") {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }

    keys.add(key);

    if (!state.musicEnabled && (key === "w" || key === "a" || key === "s" || key === "d" || key === "arrowup" || key === "arrowdown" || key === "arrowleft" || key === "arrowright")) {
      void setMusicEnabled(true);
    }

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

  arenaDom.canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    touchInput.active = true;
    touchInput.pointerId = event.pointerId;
    const rect = arenaDom.canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    touchInput.targetX = (event.clientX - rect.left) * scaleX;
    touchInput.targetY = (event.clientY - rect.top) * scaleY;
  });

  arenaDom.canvas.addEventListener("pointermove", (event) => {
    if (!touchInput.active || touchInput.pointerId !== event.pointerId) return;
    const rect = arenaDom.canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    touchInput.targetX = (event.clientX - rect.left) * scaleX;
    touchInput.targetY = (event.clientY - rect.top) * scaleY;
  });

  const releaseTouchMove = (event) => {
    if (touchInput.pointerId !== event.pointerId) return;
    touchInput.active = false;
    touchInput.pointerId = null;
  };
  arenaDom.canvas.addEventListener("pointerup", releaseTouchMove);
  arenaDom.canvas.addEventListener("pointercancel", releaseTouchMove);

  if (arenaDom.touchDash) {
    arenaDom.touchDash.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (isUpgradeOverlayVisible()) {
        moveUpgradeSelection(1);
        return;
      }
      triggerDash();
    });
  }
  if (arenaDom.touchPulse) {
    arenaDom.touchPulse.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (isUpgradeOverlayVisible()) {
        confirmSelectedUpgrade();
        return;
      }
      triggerPulse();
    });
  }

  arenaDom.restartBtn.addEventListener("click", resetGame);
  if (arenaDom.musicBtn) {
    arenaDom.musicBtn.addEventListener("click", () => {
      void toggleMusic();
    });
  }
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

  if (arenaDom.planeList) {
    arenaDom.planeList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-plane-id]");
      if (!button) return;

      const planeId = Number(button.dataset.planeId);
      if (!Number.isInteger(planeId) || planeId < 1 || planeId > MAX_PLANES) return;

      if (planeId > state.unlockedPlaneCount) {
        const nextUnlock = state.unlockedPlaneCount + 1;
        if (planeId !== nextUnlock) {
          showOverlay("קנייה לפי סדר", `קודם צריך לקנות מטוס ${nextUnlock}`);
          setTimeout(() => {
            hideOverlay();
          }, 900);
          return;
        }

        const cost = planeId;
        if (state.coins < cost) {
          showOverlay("אין מספיק מטבעות", `חסר לך ${cost - state.coins} מטבעות למטוס ${planeId}`);
          setTimeout(() => {
            hideOverlay();
          }, 900);
          return;
        }

        state.coins -= cost;
        state.unlockedPlaneCount = planeId;
      }

      const wasRunning = state.running;
      state.activePlaneId = planeId;
      savePlaneProgress();

      resetGame();

      if (wasRunning) {
        const plane = getActivePlane();
        showOverlay(`נבחר ${plane.name}`, `המשחק התחיל מחדש עם ${plane.title}`);
        setTimeout(() => {
          hideOverlay();
        }, 900);
      }
    });
  }

  updateTouchActionLabels();
  resetGame();
  requestAnimationFrame(loop);
}
