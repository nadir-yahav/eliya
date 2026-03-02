const arenaDom = {
  canvas: document.getElementById("arenaCanvas"),
  score: document.getElementById("haScore"),
  health: document.getElementById("haHealth"),
  wave: document.getElementById("haWave"),
  world: document.getElementById("haWorld"),
  weapon: document.getElementById("haWeapon"),
  dash: document.getElementById("haDash"),
  pulse: document.getElementById("haPulse"),
  musicBtn: document.getElementById("haMusicBtn"),
  fullscreenBtn: document.getElementById("haFullscreenBtn"),
  resetWorldsBtn: document.getElementById("haResetWorldsBtn"),
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
  upgradeSummary: document.getElementById("haUpgradeSummary"),
  coins: document.getElementById("haCoins"),
  touchDash: document.getElementById("haTouchDash"),
  touchPulse: document.getElementById("haTouchPulse"),
  mpPanel: document.getElementById("haMpPanel"),
  mpServer: document.getElementById("haMpServer"),
  mpName: document.getElementById("haMpName"),
  mpMode: document.getElementById("haMpMode"),
  mpConnect: document.getElementById("haMpConnect"),
  mpQueue: document.getElementById("haMpQueue"),
  mpStatus: document.getElementById("haMpStatus"),
  mpUsers: document.getElementById("haMpUsers"),
  mpInviteName: document.getElementById("haMpInviteName"),
  mpInviteSend: document.getElementById("haMpInviteSend"),
  mpIncoming: document.getElementById("haMpIncoming"),
  mpIncomingText: document.getElementById("haMpIncomingText"),
  mpAccept: document.getElementById("haMpAccept"),
  mpDecline: document.getElementById("haMpDecline"),
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
    upgradeUpPressed: false,
    upgradeDownPressed: false,
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
      movePattern: "wobble",
      attackPattern: "single",
    },
    striker: {
      label: "Striker",
      color: "#ff8b52",
      hp: (stage) => 42 + stage * 7,
      speed: (stage) => 1.3 + stage * 0.06,
      shootCooldown: 1200,
      score: 30,
      movePattern: "strikerWave",
      attackPattern: "split",
    },
    bomber: {
      label: "Bomber",
      color: "#c58aff",
      hp: (stage) => 78 + stage * 13,
      speed: (stage) => 0.9 + stage * 0.03,
      shootCooldown: 1700,
      score: 44,
      movePattern: "bomberGlide",
      attackPattern: "fanDown",
    },
    sniper: {
      label: "Sniper",
      color: "#ffe173",
      hp: (stage) => 50 + stage * 8,
      speed: (stage) => 1.1 + stage * 0.04,
      shootCooldown: 2100,
      score: 50,
      movePattern: "kite",
      attackPattern: "snipe",
    },
    interceptor: {
      label: "Interceptor",
      color: "#7eff93",
      hp: (stage) => 36 + stage * 6,
      speed: (stage) => 2.2 + stage * 0.09,
      shootCooldown: 1600,
      score: 38,
      movePattern: "zigzag",
      attackPattern: "dashShot",
    },
    sentinel: {
      label: "Sentinel",
      color: "#8ea8ff",
      hp: (stage) => 58 + stage * 9,
      speed: (stage) => 1.0 + stage * 0.035,
      shootCooldown: 1500,
      score: 46,
      movePattern: "strafe",
      attackPattern: "burst3",
    },
    phantom: {
      label: "Phantom",
      color: "#7cf4ff",
      hp: (stage) => 40 + stage * 7,
      speed: (stage) => 1.6 + stage * 0.06,
      shootCooldown: 1750,
      score: 42,
      movePattern: "teleport",
      attackPattern: "cross",
    },
    juggernaut: {
      label: "Juggernaut",
      color: "#ffb36d",
      hp: (stage) => 120 + stage * 16,
      speed: (stage) => 0.65 + stage * 0.02,
      shootCooldown: 2200,
      score: 70,
      movePattern: "bulwark",
      attackPattern: "slowOrb",
      radius: 20,
    },
    wasp: {
      label: "Wasp",
      color: "#fff07b",
      hp: (stage) => 28 + stage * 5,
      speed: (stage) => 2.45 + stage * 0.1,
      shootCooldown: 980,
      score: 36,
      movePattern: "swarm",
      attackPattern: "needle",
    },
    orbitron: {
      label: "Orbitron",
      color: "#a3ffdd",
      hp: (stage) => 54 + stage * 8,
      speed: (stage) => 1.35 + stage * 0.05,
      shootCooldown: 1650,
      score: 48,
      movePattern: "orbitRush",
      attackPattern: "spiral",
    },
    pyromancer: {
      label: "Pyromancer",
      color: "#ff7f69",
      hp: (stage) => 62 + stage * 10,
      speed: (stage) => 1.15 + stage * 0.045,
      shootCooldown: 1800,
      score: 52,
      movePattern: "sineWide",
      attackPattern: "arcRain",
    },
    cryodrone: {
      label: "Cryodrone",
      color: "#9ad5ff",
      hp: (stage) => 50 + stage * 8,
      speed: (stage) => 1.05 + stage * 0.04,
      shootCooldown: 1900,
      score: 45,
      movePattern: "hoverStall",
      attackPattern: "slowOrb",
    },
    spark: {
      label: "Spark",
      color: "#d2ff5e",
      hp: (stage) => 34 + stage * 6,
      speed: (stage) => 2.0 + stage * 0.08,
      shootCooldown: 1180,
      score: 39,
      movePattern: "weave",
      attackPattern: "chainBolt",
    },
    mortar: {
      label: "Mortar",
      color: "#d8a7ff",
      hp: (stage) => 74 + stage * 12,
      speed: (stage) => 0.8 + stage * 0.03,
      shootCooldown: 2100,
      score: 58,
      movePattern: "anchor",
      attackPattern: "lob",
    },
    raptor: {
      label: "Raptor",
      color: "#ff9a95",
      hp: (stage) => 46 + stage * 8,
      speed: (stage) => 1.9 + stage * 0.075,
      shootCooldown: 1280,
      score: 44,
      movePattern: "flank",
      attackPattern: "tripleWave",
    },
    mimic: {
      label: "Mimic",
      color: "#86ffd3",
      hp: (stage) => 52 + stage * 9,
      speed: (stage) => 1.4 + stage * 0.05,
      shootCooldown: 1700,
      score: 47,
      movePattern: "mimic",
      attackPattern: "mirror",
    },
    vortexling: {
      label: "Vortexling",
      color: "#8dffe4",
      hp: (stage) => 48 + stage * 8,
      speed: (stage) => 1.45 + stage * 0.055,
      shootCooldown: 1500,
      score: 49,
      movePattern: "spiralDive",
      attackPattern: "spiral",
    },
    harpoon: {
      label: "Harpoon",
      color: "#ffd4a8",
      hp: (stage) => 56 + stage * 9,
      speed: (stage) => 1.25 + stage * 0.045,
      shootCooldown: 1560,
      score: 50,
      movePattern: "backstep",
      attackPattern: "pierce",
    },
    quasar: {
      label: "Quasar",
      color: "#f1a6ff",
      hp: (stage) => 63 + stage * 10,
      speed: (stage) => 1.12 + stage * 0.042,
      shootCooldown: 1850,
      score: 57,
      movePattern: "pulse",
      attackPattern: "nova",
    },
    reaper: {
      label: "Reaper",
      color: "#ff7676",
      hp: (stage) => 68 + stage * 11,
      speed: (stage) => 1.38 + stage * 0.05,
      shootCooldown: 1450,
      score: 60,
      movePattern: "hunter",
      attackPattern: "burst5",
    },
    anchor: {
      label: "Anchor",
      color: "#7fb8ff",
      hp: (stage) => 84 + stage * 13,
      speed: (stage) => 0.78 + stage * 0.025,
      shootCooldown: 2050,
      score: 64,
      movePattern: "anchor",
      attackPattern: "mineDrop",
      radius: 18,
    },
    shard: {
      label: "Shard",
      color: "#9bf7ff",
      hp: (stage) => 42 + stage * 7,
      speed: (stage) => 1.85 + stage * 0.07,
      shootCooldown: 1220,
      score: 41,
      movePattern: "feint",
      attackPattern: "shotgun",
    },
    echo: {
      label: "Echo",
      color: "#d0c3ff",
      hp: (stage) => 52 + stage * 8,
      speed: (stage) => 1.32 + stage * 0.05,
      shootCooldown: 1620,
      score: 48,
      movePattern: "echo",
      attackPattern: "doubleTap",
    },
    tempest: {
      label: "Tempest",
      color: "#87f0ff",
      hp: (stage) => 60 + stage * 10,
      speed: (stage) => 1.5 + stage * 0.06,
      shootCooldown: 1360,
      score: 55,
      movePattern: "storm",
      attackPattern: "arcRain",
    },
    nullifier: {
      label: "Nullifier",
      color: "#c9e1ff",
      hp: (stage) => 66 + stage * 11,
      speed: (stage) => 1.08 + stage * 0.04,
      shootCooldown: 1760,
      score: 59,
      movePattern: "suppressor",
      attackPattern: "cross",
    },
  };

  const ENEMY_TYPE_SEQUENCE = Object.keys(ENEMY_TYPES);

  const BOSS_VARIANTS = [
    {
      id: "titan",
      name: "Titan Dreadnought",
      aiProfile: "titan",
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
      aiProfile: "seraph",
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
      aiProfile: "wraith",
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
      aiProfile: "vortex",
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
      aiProfile: "inferno",
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
      aiProfile: "aegis",
      primary: "#b5c3ff",
      secondary: "#f0f4ff",
      laserColor: "rgba(176,196,255,",
      radius: 57,
      baseHp: 1000,
      hpScale: 152,
    },
    {
      id: "hydra",
      name: "Hydra Tri-Core",
      aiProfile: "hydra",
      primary: "#8bffb3",
      secondary: "#dbffe6",
      laserColor: "rgba(130,255,170,",
      radius: 55,
      baseHp: 980,
      hpScale: 148,
    },
    {
      id: "nebula",
      name: "Nebula Prism",
      aiProfile: "nebula",
      primary: "#b6a1ff",
      secondary: "#ece5ff",
      laserColor: "rgba(181,153,255,",
      radius: 54,
      baseHp: 960,
      hpScale: 146,
    },
    {
      id: "onyx",
      name: "Onyx Overlord",
      aiProfile: "onyx",
      primary: "#ffd3a0",
      secondary: "#fff0dc",
      laserColor: "rgba(255,193,130,",
      radius: 61,
      baseHp: 1080,
      hpScale: 160,
    },
    {
      id: "zephyr",
      name: "Zephyr Cyclone",
      aiProfile: "zephyr",
      primary: "#9de5ff",
      secondary: "#e8f9ff",
      laserColor: "rgba(138,222,255,",
      radius: 53,
      baseHp: 940,
      hpScale: 144,
    },
    {
      id: "quantum",
      name: "Quantum Riftlord",
      aiProfile: "quantum",
      primary: "#f0a4ff",
      secondary: "#ffe7ff",
      laserColor: "rgba(239,145,255,",
      radius: 56,
      baseHp: 990,
      hpScale: 150,
    },
    {
      id: "omega",
      name: "Omega Annihilator",
      aiProfile: "omega",
      primary: "#ff9ca1",
      secondary: "#ffe4e6",
      laserColor: "rgba(255,128,136,",
      radius: 59,
      baseHp: 1040,
      hpScale: 156,
    },
    {
      id: "phantasm",
      name: "Phantasm Shade",
      aiProfile: "phantasm",
      primary: "#b4ffd9",
      secondary: "#ebfff5",
      laserColor: "rgba(140,255,214,",
      radius: 52,
      baseHp: 930,
      hpScale: 142,
    },
    {
      id: "colossus",
      name: "Colossus Prime",
      aiProfile: "colossus",
      primary: "#ffc27d",
      secondary: "#ffedd5",
      laserColor: "rgba(255,178,102,",
      radius: 62,
      baseHp: 1120,
      hpScale: 165,
    },
    {
      id: "ember",
      name: "Ember Tyrant",
      aiProfile: "ember",
      primary: "#ff8c66",
      secondary: "#ffe6dc",
      laserColor: "rgba(255,125,96,",
      radius: 58,
      baseHp: 1010,
      hpScale: 153,
    },
    {
      id: "mythic",
      name: "Mythic Starforged",
      aiProfile: "mythic",
      primary: "#b2c8ff",
      secondary: "#f0f5ff",
      laserColor: "rgba(175,198,255,",
      radius: 60,
      baseHp: 1060,
      hpScale: 158,
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
  const MAX_PLANE_SPEED_MULT = 2.45;
  const MAX_PLANE_DASH_MULT = 2.85;
  const MAX_EFFECTIVE_MOVE_SPEED = 13.5;
  const MAX_DASH_DISTANCE = 210;
  const BOSS_DEATH_DURATION_MS = 1700;
  const DUEL_WIN_COINS = 50;
  const MATCH_TARGET_POINTS = 5;
  const DUEL_MAX_HP = 220;
  const DUEL_SYNC_INTERVAL_MS = 70;
  const DUEL_BULLET_SPEED = 11.6;
  const DUEL_BULLET_LIFE = 86;
  const TEAM_MATCH_REWARD_COINS = 100;
  const STAGES_PER_WORLD = 10;
  const TOTAL_WORLDS = 10;
  const FINAL_STAGE = STAGES_PER_WORLD * TOTAL_WORLDS;
  const MATCH_MODE_CONFIG = {
    "1v1": { teamSize: 1, reward: DUEL_WIN_COINS, mapScale: 1 },
    "2v2": { teamSize: 2, reward: TEAM_MATCH_REWARD_COINS, mapScale: 1 },
    "3v3": { teamSize: 3, reward: TEAM_MATCH_REWARD_COINS, mapScale: 2 },
    "4v4": { teamSize: 4, reward: TEAM_MATCH_REWARD_COINS, mapScale: 2 },
  };
  const DEFAULT_MULTIPLAYER_WS_URL =
    localStorage.getItem("haloArenaWsUrl") ||
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8080`;
  const PLANE_PROGRESS_KEY = "haloArenaPlaneProgressV2";
  const WORLD_PROGRESS_KEY = "haloArenaWorldProgressV1";
  const CREATOR_MODE_KEY = "haloArenaCreatorModeV2";
  const CREATOR_ACCESS_CODE = "HALO-CREATOR-ONLY-2026";
  const PRIVATE_BOOST_KEY = "haloArenaPrivateBoostV1";
  const PRIVATE_BOOST_ACCESS_CODE = "HALO-PRIVATE-ME-2026";
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
      const accentHue = (hue + 72 + (id % 27) * 3) % 360;
      const trimHue = (hue + 180 + id * 2) % 360;
      const tierBoost = 1 + id * 0.012;
      return {
        id,
        name: `מטוס ${id}`,
        title: `Type-${id} ${archetype.name}`,
        primary: `hsl(${hue}, 92%, 62%)`,
        secondary: `hsl(${(hue + 48) % 360}, 95%, 72%)`,
        glow: `hsla(${hue}, 100%, 75%, 0.75)`,
        trim: `hsl(${trimHue}, 96%, 78%)`,
        canopy: `hsla(${accentHue}, 95%, 72%, 0.85)`,
        engine: `hsla(${(hue + 210) % 360}, 100%, 74%, 0.9)`,
        contrail: `hsla(${(accentHue + 20) % 360}, 95%, 74%, 0.52)`,
        visual: {
          wingType: id % 5,
          finType: Math.floor(id / 3) % 4,
          canopyType: Math.floor(id / 5) % 4,
          stripeType: Math.floor(id / 7) % 6,
          enginePods: 1 + (id % 3 === 0 ? 1 : 0) + (id % 11 === 0 ? 1 : 0),
          noseLength: 20 + (id % 8) * 1.6,
          wingDepth: 8 + (id % 6) * 1.2,
          wingInset: 2 + (id % 4),
          glowBoost: (id % 10) * 1.4,
          stripeAlpha: 0.28 + ((id * 17) % 38) / 100,
        },
        damageMult: archetype.damage * tierBoost,
        fireRateMult: Math.max(0.45, archetype.fireRate - id * 0.0036),
        speedMult: Math.min(MAX_PLANE_SPEED_MULT, archetype.speed + id * 0.006),
        dashMult: Math.min(MAX_PLANE_DASH_MULT, archetype.dash + id * 0.008),
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

  function loadWorldProgress() {
    try {
      const raw = localStorage.getItem(WORLD_PROGRESS_KEY);
      if (!raw) {
        return { highestWorldReached: 1 };
      }

      const parsed = JSON.parse(raw);
      const highestWorldReached = clamp(Number(parsed.highestWorldReached) || 1, 1, TOTAL_WORLDS);
      return { highestWorldReached };
    } catch {
      return { highestWorldReached: 1 };
    }
  }

  function saveWorldProgress() {
    try {
      localStorage.setItem(
        WORLD_PROGRESS_KEY,
        JSON.stringify({
          highestWorldReached: state.highestWorldReached,
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  function persistWorldProgress(stageToSave = state.stage) {
    const normalizedStage = clamp(Number(stageToSave) || 1, 1, FINAL_STAGE);
    const reachedWorld = getWorldForStage(normalizedStage);
    if (reachedWorld > state.highestWorldReached) {
      state.highestWorldReached = reachedWorld;
      saveWorldProgress();
    }
  }

  function resetWorldProgress() {
    const shouldReset = window.confirm("Do you want to reset worlds and stages progress?");
    if (!shouldReset) {
      return;
    }

    state.highestWorldReached = 1;
    state.stage = 1;
    state.chosenUpgrades = [];
    try {
      localStorage.setItem(
        WORLD_PROGRESS_KEY,
        JSON.stringify({
          highestWorldReached: 1,
        })
      );
    } catch {
      // ignore storage failures
    }

    showOverlay("Progress Reset", "Worlds and stages were reset.");
    setTimeout(() => {
      hideOverlay();
    }, 900);
    resetGame();
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
  const initialWorldProgress = loadWorldProgress();
  const initialPrivateBoostEnabled = (() => {
    try {
      return localStorage.getItem(PRIVATE_BOOST_KEY) === "1";
    } catch {
      return false;
    }
  })();

  const state = {
    running: true,
    stage: getFirstStageForWorld(initialWorldProgress.highestWorldReached),
    highestWorldReached: initialWorldProgress.highestWorldReached,
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
    pendingUpgrades: null,
    chosenUpgrades: [],
    selectedUpgradeSlot: -1,
    upgradeAutoPickTimer: null,
    multiplayer: {
      connected: false,
      socket: null,
      myId: null,
      name: "",
      serverUrl: DEFAULT_MULTIPLAYER_WS_URL,
      selectedMode: "1v1",
      queueing: false,
      users: [],
      incomingInvite: null,
      duel: null,
    },
    stageTransitionMs: 0,
    stageTransitionDuration: 0,
    stageTransitionTitle: "",
    stageTransitionSubtitle: "",
    gameCompleted: false,
    privateBoostEnabled: initialPrivateBoostEnabled,
    privateBoostUpgrades: [],
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

  function getUpgradeIcon(option) {
    const text = `${option?.title || ""} ${option?.desc || ""}`.toLowerCase();

    if (
      text.includes("speed") ||
      text.includes("מהירות") ||
      text.includes("ion") ||
      text.includes("dash") ||
      text.includes("blink") ||
      text.includes("thruster")
    ) {
      return "🏃";
    }

    if (
      text.includes("shield") ||
      text.includes("armor") ||
      text.includes("hull") ||
      text.includes("fortress")
    ) {
      return "🛡️";
    }

    if (
      text.includes("health") ||
      text.includes("hp") ||
      text.includes("regen") ||
      text.includes("repair") ||
      text.includes("vampire") ||
      text.includes("חיים") ||
      text.includes("ריפוי")
    ) {
      return "❤️";
    }

    if (
      text.includes("pulse") ||
      text.includes("shock") ||
      text.includes("arc")
    ) {
      return "⚡";
    }

    if (
      text.includes("bullet") ||
      text.includes("cannon") ||
      text.includes("shot") ||
      text.includes("barrage") ||
      text.includes("caliber") ||
      text.includes("ירי") ||
      text.includes("קליע")
    ) {
      return "🔫";
    }

    if (text.includes("final") || text.includes("god")) {
      return "👑";
    }

    return "🚀";
  }

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
    const isBossVictory = state.isBossStage;
    if (isBossVictory) {
      const bossTier = getBossTier(state.stage);
      const bossLabel = bossTier === 1 ? "אחד" : String(bossTier);
      arenaDom.upgradeText.textContent = `ניצחת את בוס ${bossLabel}! 🏆 בחר שדרוג אחד מתוך ${UPGRADE_OPTIONS_PER_STAGE}`;
    } else {
      arenaDom.upgradeText.textContent = `You passed the stage! 🎉 Stage ${state.stage} completed — choose one upgrade out of ${UPGRADE_OPTIONS_PER_STAGE}`;
    }

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
      button.innerHTML = "";
      const icon = document.createElement("span");
      icon.className = "upgrade-icon";
      icon.textContent = getUpgradeIcon(option);
      const label = document.createElement("span");
      label.className = "upgrade-label";
      label.textContent = `${option.title} — ${option.desc} [${option.tier.name}]`;
      button.appendChild(icon);
      button.appendChild(label);
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

  function easeOutCubic(t) {
    const clamped = clamp(t, 0, 1);
    return 1 - (1 - clamped) ** 3;
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
      gamepadInput.upgradeUpPressed = false;
      gamepadInput.upgradeDownPressed = false;
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
      const verticalAxis = pad.axes[1] || 0;
      const leftNow = Boolean(pad.buttons[14]?.pressed || pad.buttons[4]?.pressed || horizontalAxis <= -0.6);
      const rightNow = Boolean(pad.buttons[15]?.pressed || pad.buttons[5]?.pressed || horizontalAxis >= 0.6);
      const upNow = Boolean(pad.buttons[12]?.pressed || verticalAxis <= -0.6);
      const downNow = Boolean(pad.buttons[13]?.pressed || verticalAxis >= 0.6);
      const confirmNow = Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);

      let direction = 0;
      if (leftNow && !rightNow) direction = -1;
      else if (rightNow && !leftNow) direction = 1;
      else if (upNow && !downNow) direction = -3;
      else if (downNow && !upNow) direction = 3;

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

      if (confirmNow && !gamepadInput.upgradeConfirmPressed) {
        confirmSelectedUpgrade();
      }

      gamepadInput.upgradeLeftPressed = leftNow;
      gamepadInput.upgradeRightPressed = rightNow;
      gamepadInput.upgradeUpPressed = upNow;
      gamepadInput.upgradeDownPressed = downNow;
      gamepadInput.upgradeConfirmPressed = confirmNow;
      gamepadInput.dashPressed = false;
      gamepadInput.pulsePressed = false;
      gamepadInput.moveX = 0;
      gamepadInput.moveY = 0;
      return;
    }

    gamepadInput.upgradeLeftPressed = false;
    gamepadInput.upgradeRightPressed = false;
    gamepadInput.upgradeUpPressed = false;
    gamepadInput.upgradeDownPressed = false;
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
    if (state.boss && !state.boss.dying) {
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
    if (state.boss && !state.boss.dying) {
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
    return THEMES[(getWorldForStage(state.stage) - 1) % THEMES.length];
  }

  function getWorldForStage(stage) {
    const normalizedStage = Math.max(1, Number(stage) || 1);
    return Math.floor((normalizedStage - 1) / STAGES_PER_WORLD) + 1;
  }

  function getFirstStageForWorld(world) {
    const normalizedWorld = clamp(Number(world) || 1, 1, TOTAL_WORLDS);
    return (normalizedWorld - 1) * STAGES_PER_WORLD + 1;
  }

  function getStageInWorld(stage) {
    const normalizedStage = Math.max(1, Number(stage) || 1);
    return ((normalizedStage - 1) % STAGES_PER_WORLD) + 1;
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

  function triggerStageTransition(title, subtitle = "") {
    state.stageTransitionDuration = 1500;
    state.stageTransitionMs = state.stageTransitionDuration;
    state.stageTransitionTitle = title;
    state.stageTransitionSubtitle = subtitle;
  }

  function sanitizePlayerName(rawName) {
    return String(rawName || "").trim().replace(/\s+/g, " ").slice(0, 24) || `Pilot-${Math.floor(Math.random() * 900 + 100)}`;
  }

  function setMultiplayerStatus(text, isError = false) {
    if (!arenaDom.mpStatus) return;
    arenaDom.mpStatus.textContent = text;
    arenaDom.mpStatus.style.color = isError ? "#ff9ea3" : "#8de1ff";
  }

  function sendMultiplayerMessage(payload) {
    const socket = state.multiplayer.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(payload));
    return true;
  }

  function updateIncomingInviteUi() {
    if (!arenaDom.mpIncoming || !arenaDom.mpIncomingText) return;
    const invite = state.multiplayer.incomingInvite;
    if (!invite) {
      arenaDom.mpIncoming.classList.add("hidden");
      return;
    }
    arenaDom.mpIncoming.classList.remove("hidden");
    arenaDom.mpIncomingText.textContent = `${invite.fromName} invited you (Plane #${invite.planeId})`;
  }

  function renderMultiplayerUsers() {
    if (!arenaDom.mpUsers) return;
    const fragment = document.createDocumentFragment();
    const users = state.multiplayer.users.filter((user) => user.id && user.id !== state.multiplayer.myId);

    if (users.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mp-user";
      empty.innerHTML = '<span class="mp-user-name">No online players</span>';
      fragment.appendChild(empty);
    } else {
      users.forEach((user) => {
        const row = document.createElement("div");
        row.className = "mp-user";

        const name = document.createElement("span");
        name.className = "mp-user-name";
        name.textContent = user.name;
        row.appendChild(name);
        fragment.appendChild(row);
      });
    }

    arenaDom.mpUsers.innerHTML = "";
    arenaDom.mpUsers.appendChild(fragment);
  }

  function drawRemoteDuelPlane(x, y, angle, planeId, hpRatio) {
    const plane = state.planes[Math.max(0, Math.min(MAX_PLANES - 1, planeId - 1))] || state.planes[0];
    const wing = 12.5 * plane.wingScale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    const hull = ctx.createLinearGradient(0, -24, 0, 21);
    hull.addColorStop(0, plane.secondary);
    hull.addColorStop(1, plane.primary);
    ctx.fillStyle = hull;
    ctx.shadowColor = plane.glow;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(wing, 10);
    ctx.lineTo(4, 7);
    ctx.lineTo(4, 22);
    ctx.lineTo(-4, 22);
    ctx.lineTo(-4, 7);
    ctx.lineTo(-wing, 10);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = plane.canopy;
    ctx.beginPath();
    ctx.ellipse(0, -2, 3.8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const barW = 56;
    const barX = x - barW / 2;
    const barY = y - 30;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barW, 5);
    ctx.fillStyle = "#ff8768";
    ctx.fillRect(barX, barY, barW * clamp(hpRatio, 0, 1), 5);
  }

  function startDuelSession(payload) {
    const players = Array.isArray(payload.players) ? payload.players : [];
    const me = players.find((entry) => entry.id === state.multiplayer.myId);
    if (!me) return;

    const mode = MATCH_MODE_CONFIG[payload.mode] ? payload.mode : "1v1";
    const mapScale = Number(payload.mapScale) > 1 ? Number(payload.mapScale) : MATCH_MODE_CONFIG[mode].mapScale;

    const player = state.player;
    player.x = Number(me.spawnX) || WIDTH * 0.5;
    player.y = Number(me.spawnY) || HEIGHT * 0.7;
    player.maxHp = DUEL_MAX_HP;
    player.hp = DUEL_MAX_HP;
    player.fireCooldown = 0;
    player.invuln = 0;
    player.tempPower = 0;
    player.tempRapid = 0;
    player.tempSpread = 0;

    state.activePlaneId = clamp(Number(me.planeId) || state.activePlaneId, 1, state.unlockedPlaneCount);
    savePlaneProgress();
    renderPlaneDock();
    hideUpgradeSelection();
    hideOverlay();

    state.enemies = [];
    state.enemyBullets = [];
    state.bullets = [];
    state.pickups = [];
    state.boss = null;
    state.stageCompleted = false;
    state.pendingUpgrades = null;

    const others = players
      .filter((entry) => entry.id !== state.multiplayer.myId)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        team: Number(entry.team) || 1,
        planeId: Number(entry.planeId) || 1,
        x: Number(entry.spawnX) || WIDTH * 0.5,
        y: Number(entry.spawnY) || HEIGHT * 0.5,
        angle: Number(entry.angle) || -Math.PI / 2,
        hp: DUEL_MAX_HP,
        alive: true,
      }));

    state.multiplayer.duel = {
      active: true,
      ended: false,
      matchId: payload.matchId,
      mode,
      rewardCoins: Number(payload.rewardCoins) || MATCH_MODE_CONFIG[mode].reward,
      targetPoints: Number(payload.targetPoints) || MATCH_TARGET_POINTS,
      teamScores: {
        1: Number(payload.teamScores?.[1]) || 0,
        2: Number(payload.teamScores?.[2]) || 0,
      },
      mapScale,
      worldWidth: WIDTH * mapScale,
      worldHeight: HEIGHT * mapScale,
      myTeam: Number(me.team) || 1,
      localAlive: true,
      others,
      myBullets: [],
      enemyBullets: [],
      syncTimer: 0,
      fireRateMs: clamp(145 * getActivePlane().fireRateMult, 70, 220),
      damagePerShot: clamp(13 * getActivePlane().damageMult, 9, 44),
    };

    state.multiplayer.queueing = false;
    state.running = true;

    const firstEnemy = others.find((entry) => entry.team !== state.multiplayer.duel.myTeam) || others[0];
    if (firstEnemy) {
      setAimVector(firstEnemy.x - player.x, firstEnemy.y - player.y);
    }
    triggerStageTransition("MATCH START", `${mode.toUpperCase()} • Team ${state.multiplayer.duel.myTeam}`);
    setMultiplayerStatus(`Match started: ${mode.toUpperCase()}`);
  }

  function endDuelSession(winnerTeam, reason = "") {
    const duel = state.multiplayer.duel;
    if (!duel || duel.ended) return;
    duel.ended = true;
    duel.active = false;

    const iWon = Number(winnerTeam) === Number(duel.myTeam);
    if (iWon) {
      state.coins += duel.rewardCoins;
      savePlaneProgress();
      triggerStageTransition("YOU WIN", `You won ${duel.rewardCoins} coins!`);
      showOverlay("Victory", `You won ${duel.rewardCoins} coins!`);
    } else {
      triggerStageTransition("DEFEAT", reason || "Better luck next duel");
      showOverlay("Defeat", reason || "Your team lost this match.");
    }

    setTimeout(() => {
      hideOverlay();
      state.multiplayer.duel = null;
      resetGame();
    }, 1500);
  }

  function applyRoundReset(payload) {
    const duel = state.multiplayer.duel;
    if (!duel || duel.ended || payload.matchId !== duel.matchId) {
      return;
    }

    duel.teamScores[1] = Number(payload.teamScores?.[1]) || duel.teamScores[1] || 0;
    duel.teamScores[2] = Number(payload.teamScores?.[2]) || duel.teamScores[2] || 0;

    if (Array.isArray(payload.players)) {
      const me = payload.players.find((entry) => entry.id === state.multiplayer.myId);
      if (me) {
        state.player.x = Number(me.spawnX) || state.player.x;
        state.player.y = Number(me.spawnY) || state.player.y;
        state.player.hp = DUEL_MAX_HP;
        duel.localAlive = true;
      }

      duel.others.forEach((remote) => {
        const next = payload.players.find((entry) => entry.id === remote.id);
        if (!next) return;
        remote.x = Number(next.spawnX) || remote.x;
        remote.y = Number(next.spawnY) || remote.y;
        remote.hp = DUEL_MAX_HP;
        remote.alive = true;
      });
    }

    duel.myBullets = [];
    duel.enemyBullets = [];
    state.player.fireCooldown = 0;

    const roundWinner = Number(payload.roundWinner) || 0;
    triggerStageTransition(
      roundWinner === duel.myTeam ? "ROUND WIN" : "ROUND LOST",
      `Score ${duel.teamScores[duel.myTeam]}-${duel.teamScores[duel.myTeam === 1 ? 2 : 1]}`
    );
  }

  function connectMultiplayer() {
    if (state.multiplayer.connected || (state.multiplayer.socket && state.multiplayer.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const serverUrl = String(arenaDom.mpServer?.value || state.multiplayer.serverUrl || DEFAULT_MULTIPLAYER_WS_URL).trim();
    if (!/^wss?:\/\//i.test(serverUrl)) {
      setMultiplayerStatus("Server URL must start with ws:// or wss://", true);
      return;
    }
    state.multiplayer.serverUrl = serverUrl;
    localStorage.setItem("haloArenaWsUrl", serverUrl);
    if (arenaDom.mpServer) {
      arenaDom.mpServer.value = serverUrl;
    }

    const name = sanitizePlayerName(arenaDom.mpName?.value || "");
    state.multiplayer.name = name;
    if (arenaDom.mpName) {
      arenaDom.mpName.value = name;
    }

    setMultiplayerStatus(`Connecting to ${serverUrl} ...`);
    const socket = new WebSocket(serverUrl);
    state.multiplayer.socket = socket;

    socket.addEventListener("open", () => {
      state.multiplayer.connected = true;
      setMultiplayerStatus(`Connected as ${name}`);
      sendMultiplayerMessage({ type: "hello", name });
    });

    socket.addEventListener("close", () => {
      if (state.multiplayer.duel) {
        endDuelSession(-1, "Disconnected from server");
      }
      state.multiplayer.connected = false;
      state.multiplayer.socket = null;
      state.multiplayer.myId = null;
      state.multiplayer.queueing = false;
      state.multiplayer.users = [];
      state.multiplayer.incomingInvite = null;
      renderMultiplayerUsers();
      updateIncomingInviteUi();
      setMultiplayerStatus("Offline", true);
    });

    socket.addEventListener("error", () => {
      setMultiplayerStatus("Connection failed", true);
    });

    socket.addEventListener("message", (event) => {
      let message = null;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!message || typeof message !== "object") return;

      if (message.type === "welcome") {
        state.multiplayer.myId = message.id || null;
        return;
      }

      if (message.type === "users") {
        state.multiplayer.users = Array.isArray(message.users) ? message.users : [];
        renderMultiplayerUsers();
        return;
      }

      if (message.type === "invite") {
        state.multiplayer.incomingInvite = {
          fromId: message.fromId,
          fromName: message.fromName,
          planeId: message.planeId,
        };
        updateIncomingInviteUi();
        setMultiplayerStatus(`Invite from ${message.fromName}`);
        return;
      }

      if (message.type === "inviteDeclined") {
        setMultiplayerStatus(`${message.byName || "Player"} declined your invite`, true);
        return;
      }

      if (message.type === "inviteError") {
        setMultiplayerStatus(message.message || "Invite failed", true);
        return;
      }

      if (message.type === "queueStatus") {
        state.multiplayer.queueing = Boolean(message.queueing);
        const mode = String(message.mode || state.multiplayer.selectedMode || "1v1");
        const waiting = Number(message.waiting || 0);
        const needed = Number(message.needed || 0);
        setMultiplayerStatus(state.multiplayer.queueing ? `Queue ${mode.toUpperCase()}: ${waiting}/${needed}` : "Queue stopped");
        return;
      }

      if (message.type === "matchStart") {
        startDuelSession(message);
        return;
      }

      if (message.type === "roundUpdate") {
        applyRoundReset(message);
        return;
      }

      const duel = state.multiplayer.duel;
      if (!duel || message.matchId !== duel.matchId) {
        return;
      }

      if (message.type === "matchSync") {
        const remote = duel.others.find((entry) => entry.id === message.playerId);
        if (!remote) return;
        remote.x = clamp(Number(message.x) || remote.x, 24, duel.worldWidth - 24);
        remote.y = clamp(Number(message.y) || remote.y, 24, duel.worldHeight - 24);
        remote.angle = Number(message.angle) || remote.angle;
        remote.hp = clamp(Number(message.hp) || remote.hp, 0, DUEL_MAX_HP);
        remote.alive = Boolean(message.alive);
        return;
      }

      if (message.type === "matchFire") {
        if (message.playerId === state.multiplayer.myId) return;
        duel.enemyBullets.push({
          ownerId: message.playerId,
          x: Number(message.x) || 0,
          y: Number(message.y) || 0,
          vx: Math.cos(Number(message.angle) || 0) * DUEL_BULLET_SPEED,
          vy: Math.sin(Number(message.angle) || 0) * DUEL_BULLET_SPEED,
          life: DUEL_BULLET_LIFE,
          damage: clamp(Number(message.damage) || 12, 4, 50),
        });
        return;
      }

      if (message.type === "matchHit") {
        if (message.targetId === state.multiplayer.myId && duel.localAlive) {
          state.player.hp = clamp(state.player.hp - clamp(Number(message.damage) || 0, 0, 90), 0, DUEL_MAX_HP);
          if (state.player.hp <= 0) {
            duel.localAlive = false;
            sendMultiplayerMessage({
              type: "playerDown",
              matchId: duel.matchId,
              playerId: state.multiplayer.myId,
            });
          }
        } else {
          const remote = duel.others.find((entry) => entry.id === message.targetId);
          if (remote) {
            remote.hp = clamp(remote.hp - clamp(Number(message.damage) || 0, 0, 90), 0, DUEL_MAX_HP);
            if (remote.hp <= 0) {
              remote.alive = false;
            }
          }
        }
        return;
      }

      if (message.type === "playerDown") {
        if (message.playerId === state.multiplayer.myId) {
          duel.localAlive = false;
          state.player.hp = 0;
          return;
        }
        const remote = duel.others.find((entry) => entry.id === message.playerId);
        if (remote) {
          remote.alive = false;
          remote.hp = 0;
        }
        return;
      }

      if (message.type === "matchResult") {
        endDuelSession(Number(message.winnerTeam) || -1, message.reason || "Match finished");
      }
    });
  }

  function toggleMatchQueue() {
    if (!state.multiplayer.connected) {
      setMultiplayerStatus("Connect first", true);
      return;
    }
    if (state.multiplayer.duel) {
      setMultiplayerStatus("Match already active", true);
      return;
    }

    const selectedMode = arenaDom.mpMode?.value || "1v1";
    state.multiplayer.selectedMode = MATCH_MODE_CONFIG[selectedMode] ? selectedMode : "1v1";
    if (!state.multiplayer.queueing) {
      const plane = getActivePlane();
      sendMultiplayerMessage({
        type: "queueJoin",
        mode: state.multiplayer.selectedMode,
        planeId: plane.id,
      });
      state.multiplayer.queueing = true;
      setMultiplayerStatus(`Searching ${state.multiplayer.selectedMode.toUpperCase()}...`);
      return;
    }

    sendMultiplayerMessage({ type: "queueLeave" });
    state.multiplayer.queueing = false;
    setMultiplayerStatus("Queue cancelled");
  }

  function sendInviteByName() {
    if (!state.multiplayer.connected) {
      setMultiplayerStatus("Connect first", true);
      return;
    }
    if (state.multiplayer.duel) {
      setMultiplayerStatus("Cannot invite during a match", true);
      return;
    }

    const targetName = String(arenaDom.mpInviteName?.value || "").trim();
    if (!targetName) {
      setMultiplayerStatus("Write player name first", true);
      return;
    }

    const plane = getActivePlane();
    const sent = sendMultiplayerMessage({
      type: "inviteByName",
      targetName,
      planeId: plane.id,
    });

    if (sent) {
      setMultiplayerStatus(`Invite sent to ${targetName}`);
    }
  }

  function updateDuel(dt, dtFactor) {
    const duel = state.multiplayer.duel;
    if (!duel || duel.ended) {
      return;
    }

    const player = state.player;
    const plane = getActivePlane();
    player.fireCooldown -= dt;

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

    const norm = Math.hypot(moveX, moveY) || 1;
    if (duel.localAlive) {
      const duelSpeed = Math.min(MAX_EFFECTIVE_MOVE_SPEED, player.speed * plane.speedMult);
      player.x += (moveX / norm) * duelSpeed * dtFactor;
      player.y += (moveY / norm) * duelSpeed * dtFactor;
      player.x = clamp(player.x, 24, duel.worldWidth - 24);
      player.y = clamp(player.y, 24, duel.worldHeight - 24);
    }

    const aliveEnemies = duel.others.filter((entry) => entry.alive && entry.team !== duel.myTeam);
    if (aliveEnemies.length > 0 && duel.localAlive) {
      let nearest = aliveEnemies[0];
      let nearestDist = Infinity;
      aliveEnemies.forEach((enemy) => {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < nearestDist) {
          nearest = enemy;
          nearestDist = dist;
        }
      });
      setAimVector(nearest.x - player.x, nearest.y - player.y);
    }

    if (duel.localAlive && player.fireCooldown <= 0 && aliveEnemies.length > 0) {
      const shotAngle = aim.angle;
      duel.myBullets.push({
        ownerId: state.multiplayer.myId,
        x: player.x,
        y: player.y,
        vx: Math.cos(shotAngle) * DUEL_BULLET_SPEED,
        vy: Math.sin(shotAngle) * DUEL_BULLET_SPEED,
        life: DUEL_BULLET_LIFE,
        damage: duel.damagePerShot,
      });
      sendMultiplayerMessage({
        type: "matchFire",
        matchId: duel.matchId,
        playerId: state.multiplayer.myId,
        x: player.x,
        y: player.y,
        angle: shotAngle,
        damage: duel.damagePerShot,
      });
      player.fireCooldown = duel.fireRateMs;
    }

    duel.myBullets = duel.myBullets.filter((bullet) => {
      bullet.x += bullet.vx * dtFactor;
      bullet.y += bullet.vy * dtFactor;
      bullet.life -= dtFactor;
      if (bullet.life <= 0) return false;
      if (bullet.x < -40 || bullet.x > duel.worldWidth + 40 || bullet.y < -40 || bullet.y > duel.worldHeight + 40) return false;

      for (const remote of duel.others) {
        if (!remote.alive || remote.team === duel.myTeam) continue;
        if (distance(bullet.x, bullet.y, remote.x, remote.y) <= 18) {
          remote.hp = clamp(remote.hp - bullet.damage, 0, DUEL_MAX_HP);
          if (remote.hp <= 0) {
            remote.alive = false;
          }
          sendMultiplayerMessage({
            type: "matchHit",
            matchId: duel.matchId,
            targetId: remote.id,
            damage: bullet.damage,
          });
          return false;
        }
      }
      return true;
    });

    duel.enemyBullets = duel.enemyBullets.filter((bullet) => {
      bullet.x += bullet.vx * dtFactor;
      bullet.y += bullet.vy * dtFactor;
      bullet.life -= dtFactor;
      if (bullet.life <= 0) return false;
      if (bullet.x < -40 || bullet.x > duel.worldWidth + 40 || bullet.y < -40 || bullet.y > duel.worldHeight + 40) return false;
      const owner = duel.others.find((entry) => entry.id === bullet.ownerId);
      if (!owner || !owner.alive || owner.team === duel.myTeam) {
        return false;
      }
      if (duel.localAlive && distance(bullet.x, bullet.y, player.x, player.y) <= player.radius + 2) {
        player.hp = clamp(player.hp - bullet.damage, 0, DUEL_MAX_HP);
        if (player.hp <= 0) {
          duel.localAlive = false;
          sendMultiplayerMessage({
            type: "playerDown",
            matchId: duel.matchId,
            playerId: state.multiplayer.myId,
          });
        }
        return false;
      }
      return true;
    });

    duel.syncTimer -= dt;
    if (duel.syncTimer <= 0) {
      duel.syncTimer = DUEL_SYNC_INTERVAL_MS;
      sendMultiplayerMessage({
        type: "matchSync",
        matchId: duel.matchId,
        playerId: state.multiplayer.myId,
        x: player.x,
        y: player.y,
        hp: player.hp,
        angle: aim.angle,
        alive: duel.localAlive,
      });
    }

    const aliveTeammates = duel.others.filter((entry) => entry.team === duel.myTeam && entry.alive);
    const aliveOpponents = duel.others.filter((entry) => entry.team !== duel.myTeam && entry.alive);
    const myTeamAlive = duel.localAlive || aliveTeammates.length > 0;
    if (!myTeamAlive || aliveOpponents.length === 0) {
      // server decides round winners and score progression
    }
  }

  function drawDuelMode() {
    const duel = state.multiplayer.duel;
    if (!duel) return;

    const camX = clamp(state.player.x - WIDTH * 0.5, 0, Math.max(0, duel.worldWidth - WIDTH));
    const camY = clamp(state.player.y - HEIGHT * 0.5, 0, Math.max(0, duel.worldHeight - HEIGHT));

    ctx.save();
    ctx.translate(-camX, -camY);

    ctx.strokeStyle = "rgba(143, 219, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, duel.worldWidth - 4, duel.worldHeight - 4);

    duel.myBullets.forEach((bullet) => {
      ctx.fillStyle = "#96ffd9";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });

    duel.enemyBullets.forEach((bullet) => {
      ctx.fillStyle = "#ff9b8a";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });

    duel.others.forEach((remote) => {
      if (!remote.alive) return;
      drawRemoteDuelPlane(remote.x, remote.y, remote.angle, remote.planeId, remote.hp / DUEL_MAX_HP);
      ctx.fillStyle = remote.team === duel.myTeam ? "rgba(115, 255, 166, 0.92)" : "rgba(255, 158, 138, 0.92)";
      ctx.font = "600 10px Rubik";
      ctx.textAlign = "center";
      ctx.fillText(remote.name, remote.x, remote.y - 38);
    });

    if (duel.localAlive) {
      drawPlayerPlane();
      drawCrosshair();
    } else {
      ctx.fillStyle = "rgba(255,90,90,0.55)";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const allyAlive = (duel.localAlive ? 1 : 0) + duel.others.filter((entry) => entry.team === duel.myTeam && entry.alive).length;
    const enemyAlive = duel.others.filter((entry) => entry.team !== duel.myTeam && entry.alive).length;
    const myScore = duel.teamScores[duel.myTeam] || 0;
    const enemyTeam = duel.myTeam === 1 ? 2 : 1;
    const enemyScore = duel.teamScores[enemyTeam] || 0;

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 14px Rubik";
    ctx.textAlign = "left";
    ctx.fillText(`MATCH ${duel.mode.toUpperCase()} • Team ${duel.myTeam}`, 16, 22);
    ctx.font = "600 12px Rubik";
    ctx.fillText(`Allies alive: ${allyAlive} | Enemies alive: ${enemyAlive}`, 16, 40);
    ctx.textAlign = "center";
    ctx.font = "800 18px Rubik";
    ctx.fillStyle = "rgba(225,245,255,0.96)";
    ctx.fillText(`TEAM ${duel.myTeam}: ${myScore}   |   TEAM ${enemyTeam}: ${enemyScore}   (First to ${duel.targetPoints})`, WIDTH * 0.5, 24);

    const leftX = 16;
    const rightX = WIDTH - 216;
    const topY = 48;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(leftX, topY, 200, 10);
    ctx.fillRect(rightX, topY, 200, 10);
    ctx.fillStyle = "#89ff80";
    ctx.fillRect(leftX, topY, 200 * clamp(state.player.hp / DUEL_MAX_HP, 0, 1), 10);

    const enemyAvgHp = (() => {
      const enemies = duel.others.filter((entry) => entry.team !== duel.myTeam && entry.alive);
      if (enemies.length === 0) return 0;
      return enemies.reduce((sum, entry) => sum + entry.hp, 0) / (enemies.length * DUEL_MAX_HP);
    })();

    ctx.fillStyle = "#ff8d74";
    ctx.fillRect(rightX, topY, 200 * clamp(enemyAvgHp, 0, 1), 10);
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
    arenaDom.planeActive.textContent = `מטוס פעיל: #${activePlane.id} • ${activePlane.title}`;

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
        const rapid = `${Math.round((1 / plane.fireRateMult) * 100)}% ROF`;
        const power = `${Math.round(plane.damageMult * 100)}% DMG`;
        const speed = `${Math.round(plane.speedMult * 100)}% SPD`;
        const hp = `${320 + plane.startHpBonus} HP`;
        const swatch = `linear-gradient(120deg, ${plane.primary}, ${plane.secondary})`;
        const glow = plane.glow.replace("0.75", "0.9");
        button.innerHTML = `
          <span class="plane-item-top">
            <span class="plane-item-id">#${planeId}</span>
            <span class="plane-item-type">${plane.title}</span>
          </span>
          <span class="plane-item-preview" style="--plane-fill:${swatch};--plane-glow:${glow};--plane-trim:${plane.trim};--plane-canopy:${plane.canopy};"></span>
          <span class="plane-item-stats">
            <span class="plane-stat">${hp}</span>
            <span class="plane-stat">${power}</span>
            <span class="plane-stat">${rapid}</span>
            <span class="plane-stat">${speed}</span>
          </span>
        `;
        button.disabled = false;
      } else {
        button.innerHTML = `
          <span class="plane-item-top">
            <span class="plane-item-id">#${planeId}</span>
            <span class="plane-item-type">LOCKED</span>
          </span>
          <span class="plane-item-locked">🔒 מחיר: ${planeId}🪙</span>
        `;
        const canBuyNow = state.creatorMode || planeId === nextUnlock;
        button.disabled = !canBuyNow;
      }
      fragment.appendChild(button);
    }

    arenaDom.planeList.innerHTML = "";
    arenaDom.planeList.appendChild(fragment);

    if (arenaDom.upgradeSummary) {
      arenaDom.upgradeSummary.innerHTML = "";
      state.chosenUpgrades.forEach((upgrade) => {
        const iconBadge = document.createElement("span");
        iconBadge.className = "upgrade-summary-icon";
        iconBadge.textContent = getUpgradeIcon(upgrade);
        iconBadge.title = `${upgrade.title || "Upgrade"}`;
        arenaDom.upgradeSummary.appendChild(iconBadge);
      });
    }

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
    const duel = state.multiplayer.duel;
    const world = getWorldForStage(state.stage);

    arenaDom.score.textContent = Math.floor(state.score);
    arenaDom.health.textContent = Math.max(0, Math.floor(player.hp));
    arenaDom.wave.textContent = duel ? duel.mode.toUpperCase() : state.stage;
    if (arenaDom.world) {
      arenaDom.world.textContent = duel ? "Duel" : `${world}/${TOTAL_WORLDS}`;
    }
    if (arenaDom.coins) {
      arenaDom.coins.textContent = `🪙 מטבעות: ${Math.floor(state.coins)}`;
    }

    const spreadBonus = player.tempSpread > 0 ? " +Spread" : "";
    arenaDom.weapon.textContent = duel
      ? `P${plane.id} • Duel Cannon`
      : `P${plane.id} • Cannon x${player.shotCount + plane.shotBonus}${spreadBonus}`;
    arenaDom.dash.textContent = player.dashCooldown <= 0 ? "Ready" : `${(player.dashCooldown / 1000).toFixed(1)}s`;
    arenaDom.pulse.textContent = player.pulseCooldown <= 0 ? "Ready" : `${(player.pulseCooldown / 1000).toFixed(1)}s`;
  }

  function stageGoalFor(stage) {
    return 10 + stage * 4;
  }

  function getEnemyStageScaling(stage) {
    const stageProgress = Math.max(0, stage - 1);
    const hpMultiplier = 1.2 ** stageProgress;
    const damageMultiplier = 1.2 ** stageProgress;
    const speedMultiplier = 1.01 ** stageProgress;
    const smallEnemyDamageMultiplier = 0.35;
    return {
      hp: hpMultiplier,
      speed: speedMultiplier,
      damage: damageMultiplier * smallEnemyDamageMultiplier,
      fireCooldown: 1,
      contactDamage: (18 + stage * 1.3) * damageMultiplier * smallEnemyDamageMultiplier,
    };
  }

  function getBossStageScaling(stage, bossTier) {
    const bossProgress = Math.max(0, bossTier - 1);
    const hpMultiplier = 2 ** bossProgress;
    const damageMultiplier = 1.5 ** bossProgress;
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
    const hp = variant.baseHp * scaling.hp * 3;
    state.boss = {
      x: WIDTH / 2,
      y: 92,
      radius: variant.radius,
      variant,
      aiProfile: variant.aiProfile || "titan",
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
      dashCooldown: 1600,
      summonCooldown: 2400,
      phaseShiftCooldown: 2300,
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
    state.gameCompleted = false;
    state.stage = state.privateBoostEnabled ? getFirstStageForWorld(9) : 1;
    state.score = 0;
    state.bullets = [];
    state.enemyBullets = [];
    state.particles = [];
    state.pickups = [];
    state.availableUpgrades = [];
    state.pendingUpgrades = null;
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

    if (state.privateBoostEnabled) {
      if (!Array.isArray(state.privateBoostUpgrades) || state.privateBoostUpgrades.length !== 100) {
        state.privateBoostUpgrades = buildPrivateBoostUpgrades();
      }
      state.chosenUpgrades = [...state.privateBoostUpgrades];
      applyUpgradeSetToPlayer(player, state.chosenUpgrades);
      state.highestWorldReached = Math.max(state.highestWorldReached, 9);
      saveWorldProgress();
    } else if (state.chosenUpgrades.length > 0) {
      applyUpgradeSetToPlayer(player, state.chosenUpgrades);
    }

    applyPlaneStartingLoadout();

    initStars();
    initSkyTraffic();
    initPlanetsForStage();
    resetStageProgress();
    hideOverlay();
    hideUpgradeSelection();
    triggerStageTransition(
      `STAGE ${state.stage} • WORLD ${getWorldForStage(state.stage)}`,
      `${getTheme().name} • ${getStageInWorld(state.stage)}/${STAGES_PER_WORLD}`
    );
    renderPlaneDock();
    savePlaneProgress();
    updateHud();
  }

  function completeGame() {
    if (state.gameCompleted) {
      return;
    }

    state.gameCompleted = true;
    state.running = false;
    state.pendingUpgrades = null;
    state.availableUpgrades = [];
    hideUpgradeSelection();

    state.unlockedPlaneCount = MAX_PLANES;
    state.activePlaneId = clamp(state.activePlaneId, 1, state.unlockedPlaneCount);
    persistWorldProgress(FINAL_STAGE);
    savePlaneProgress();
    renderPlaneDock();

    triggerStageTransition("YOU FINISHED THE GAME", "ALL PLANES UNLOCKED");
    showOverlay(
      "YOU FINISHED THE GAME",
      "You completed all 10 worlds! You unlocked all planes in the game."
    );
    updateHud();
  }

  function getAllowedEnemyTypes() {
    const unlockedCount = Math.min(
      ENEMY_TYPE_SEQUENCE.length,
      2 + Math.floor((Math.max(1, state.stage) - 1) / 2)
    );
    return ENEMY_TYPE_SEQUENCE.slice(0, Math.max(2, unlockedCount));
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
      radius: type.radius || 16,
      hp,
      maxHp: hp,
      speed,
      fireCooldown: (450 + Math.random() * type.shootCooldown) * scaling.fireCooldown,
      wobbleSeed: seed,
      drift: (Math.random() - 0.5) * 0.7,
      phase: Math.random() * Math.PI * 2,
      teleportCooldown: 850 + Math.random() * 900,
      dashCooldown: 900 + Math.random() * 800,
      pulseTimer: 0,
      mirrorSign: Math.random() > 0.5 ? 1 : -1,
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
    const dashDistance = Math.min(MAX_DASH_DISTANCE, player.dashPower * 8 * plane.dashMult);
    player.x += Math.cos(angle) * dashDistance;
    player.y += Math.sin(angle) * dashDistance;
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
    const config = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.scout;
    const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const scaling = getEnemyStageScaling(state.stage);
    const damageScale = scaling.damage;
    const speedScale = 1 + Math.min(0.3, (state.stage - 1) * 0.0035);
    const bulletColor = config.color;

    const pushBullet = (angle, speed, damage, radius, life = 170, extra = {}) => {
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed * speedScale,
        vy: Math.sin(angle) * speed * speedScale,
        life,
        damage: damage * damageScale,
        radius,
        color: bulletColor,
        ...extra,
      });
    };

    switch (config.attackPattern) {
      case "single":
        pushBullet(angleToPlayer, 4.6, 11, 3, 150);
        break;
      case "split":
        pushBullet(angleToPlayer - 0.12, 4.2, 10, 3, 140);
        pushBullet(angleToPlayer + 0.12, 4.2, 10, 3, 140);
        break;
      case "fanDown":
        for (let i = -1; i <= 1; i += 1) {
          pushBullet(Math.PI / 2 + i * 0.35, 3, 13, 4, 180);
        }
        break;
      case "snipe":
        pushBullet(angleToPlayer, 6.2, 18, 3.6, 190);
        break;
      case "dashShot":
        pushBullet(angleToPlayer, 5, 12, 3, 130);
        break;
      case "burst3":
        for (let i = -1; i <= 1; i += 1) {
          pushBullet(angleToPlayer + i * 0.08, 4.4, 11, 3.2, 165);
        }
        break;
      case "cross":
        for (let i = 0; i < 4; i += 1) {
          pushBullet(i * (Math.PI / 2), 3.7, 12, 3.4, 180);
        }
        break;
      case "spiral":
        pushBullet(enemy.phase * 0.8, 4, 11, 3.1, 190);
        pushBullet(enemy.phase * 0.8 + Math.PI, 4, 11, 3.1, 190);
        break;
      case "slowOrb":
        pushBullet(angleToPlayer, 2.5, 16, 5.2, 250);
        break;
      case "needle":
        pushBullet(angleToPlayer, 6.8, 9, 2.4, 120);
        break;
      case "arcRain":
        for (let i = -2; i <= 2; i += 1) {
          pushBullet(angleToPlayer + i * 0.17, 3.8, 12, 3.5, 185);
        }
        break;
      case "chainBolt":
        pushBullet(angleToPlayer, 4.9, 10, 3, 145);
        pushBullet(angleToPlayer + 0.22 * enemy.mirrorSign, 4.9, 10, 3, 145);
        break;
      case "lob":
        pushBullet(Math.PI / 2, 2.4, 17, 5.3, 240, { vy: 3.6 * speedScale });
        break;
      case "tripleWave":
        for (let i = -1; i <= 1; i += 1) {
          pushBullet(angleToPlayer + i * 0.22, 4.3, 11, 3.2, 165);
        }
        break;
      case "mirror":
        pushBullet(angleToPlayer, 4.2, 12, 3.4, 170);
        pushBullet(Math.PI - angleToPlayer, 4.2, 12, 3.4, 170);
        break;
      case "pierce":
        pushBullet(angleToPlayer, 6.1, 14, 3.1, 210);
        break;
      case "nova":
        for (let i = 0; i < 8; i += 1) {
          pushBullet((Math.PI * 2 * i) / 8, 3.5, 10, 3.1, 180);
        }
        break;
      case "burst5":
        for (let i = -2; i <= 2; i += 1) {
          pushBullet(angleToPlayer + i * 0.09, 4.8, 11, 3.1, 165);
        }
        break;
      case "mineDrop":
        pushBullet(Math.PI / 2, 1.5, 15, 5.5, 260, { vx: enemy.drift * 0.8 });
        break;
      case "shotgun":
        for (let i = -3; i <= 3; i += 1) {
          pushBullet(angleToPlayer + i * 0.12, 3.9, 9, 2.9, 145);
        }
        break;
      case "doubleTap":
        pushBullet(angleToPlayer - 0.04, 4.7, 11, 3, 155);
        pushBullet(angleToPlayer + 0.04, 4.7, 11, 3, 155);
        break;
      default:
        pushBullet(angleToPlayer, 4.5, 11, 3.1, 160);
        break;
    }
  }

  function fireBossBurst(boss) {
    const profile = boss.aiProfile;
    const damageScale = boss.damageScale;
    const bulletSpeedScale = boss.bulletSpeedScale || 1;

    const push = (angle, speed, damage, radius, life = 210) => {
      state.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed * bulletSpeedScale,
        vy: Math.sin(angle) * speed * bulletSpeedScale,
        life,
        damage: damage * damageScale,
        radius,
        color: boss.variant.secondary,
      });
    };

    if (profile === "titan" || profile === "colossus") {
      const total = profile === "colossus" ? 14 : 12;
      for (let index = 0; index < total; index += 1) {
        const angle = (Math.PI * 2 * index) / total + boss.phase * 0.25;
        push(angle, 3.4, 12, 4, 230);
      }
      return;
    }

    if (profile === "seraph" || profile === "nebula") {
      const total = profile === "nebula" ? 20 : 16;
      for (let index = 0; index < total; index += 1) {
        const angle = (Math.PI * 2 * index) / total + boss.phase * 0.38;
        push(angle, 3, 11, 3.7, 250);
      }
      return;
    }

    if (profile === "hydra") {
      for (let arm = -1; arm <= 1; arm += 1) {
        const base = Math.atan2(state.player.y - boss.y, state.player.x - boss.x) + arm * 0.3;
        for (let i = -1; i <= 1; i += 1) {
          push(base + i * 0.1, 4.2, 12, 3.9, 200);
        }
      }
      return;
    }

    if (profile === "omega" || profile === "mythic") {
      for (let i = 0; i < 2; i += 1) {
        for (let ring = 0; ring < 10; ring += 1) {
          const angle = (Math.PI * 2 * ring) / 10 + boss.phase * (0.2 + i * 0.06) + i * 0.16;
          push(angle, 3.6 + i * 0.55, 12 + i * 1.5, 3.8, 220);
        }
      }
      return;
    }

    const player = state.player;
    const base = Math.atan2(player.y - boss.y, player.x - boss.x);
    const spread = profile === "zephyr" ? 0.15 : 0.11;
    const shots = profile === "vortex" || profile === "quantum" ? 9 : 7;
    const half = Math.floor(shots / 2);
    for (let i = -half; i <= half; i += 1) {
      push(base + i * spread, 4, 13, 4.2, 190);
    }
  }

  function fireBossMissile(boss) {
    const player = state.player;
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const damageScale = boss.damageScale;
    const bulletSpeedScale = boss.bulletSpeedScale || 1;
    const profile = boss.aiProfile;

    if (profile === "seraph" || profile === "zephyr") {
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

    if (profile === "wraith" || profile === "phantasm") {
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

    if (profile === "inferno" || profile === "ember") {
      for (let i = -2; i <= 2; i += 1) {
        const a = angle + i * 0.2;
        state.enemyBullets.push({
          x: boss.x,
          y: boss.y + 8,
          vx: Math.cos(a) * 4.2 * bulletSpeedScale,
          vy: Math.sin(a) * 4.2 * bulletSpeedScale,
          life: 200,
          damage: 15 * damageScale,
          radius: 4.1,
          color: "#ffb98f",
        });
      }
      return;
    }

    if (profile === "aegis" || profile === "onyx") {
      for (let ring = 0; ring < 6; ring += 1) {
        const a = boss.phase * 0.5 + (Math.PI * 2 * ring) / 6;
        state.enemyBullets.push({
          x: boss.x + Math.cos(a) * 28,
          y: boss.y + Math.sin(a) * 28,
          vx: Math.cos(a) * 2.8 * bulletSpeedScale,
          vy: Math.sin(a) * 2.8 * bulletSpeedScale,
          life: 220,
          damage: 14 * damageScale,
          radius: 4.8,
          color: "#d9e8ff",
        });
      }
      return;
    }

    if (profile === "quantum") {
      for (let i = 0; i < 2; i += 1) {
        const shift = i === 0 ? 0.18 : -0.18;
        state.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle + shift) * 6.4 * bulletSpeedScale,
          vy: Math.sin(angle + shift) * 6.4 * bulletSpeedScale,
          life: 170,
          damage: 17 * damageScale,
          radius: 3.7,
          color: "#efb7ff",
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

    if (boss.dying) {
      boss.phase += 0.025 * dtFactor;
      boss.deathTimer -= dt;
      const deathProgress = clamp(1 - boss.deathTimer / Math.max(1, boss.deathDuration), 0, 1);
      const burstCount = 1 + Math.floor(deathProgress * 5);
      for (let burst = 0; burst < burstCount; burst += 1) {
        if (Math.random() < 0.42) {
          const ring = boss.radius * (0.25 + Math.random() * (0.65 + deathProgress * 0.25));
          const theta = Math.random() * Math.PI * 2;
          addParticles(
            boss.x + Math.cos(theta) * ring,
            boss.y + Math.sin(theta) * ring,
            Math.random() < 0.5 ? boss.variant.secondary : "#ffe3a6",
            3 + Math.floor(Math.random() * 4),
            1.6 + deathProgress * 1.8
          );
        }
      }

      if (boss.deathTimer <= 0) {
        addParticles(boss.x, boss.y, "#fff2bf", 52, 4.1);
        state.boss = null;
        state.stageDefeated = state.stageGoal;
      }
      return;
    }

    const player = state.player;
    const profile = boss.aiProfile;

    boss.phase += 0.01 * dtFactor;

    if (profile === "titan" || profile === "colossus") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase * 1.6) * 260;
      boss.y = 98 + Math.sin(boss.phase * 2.8) * 20;
    } else if (profile === "seraph" || profile === "zephyr" || profile === "nebula") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase * 2.3) * 290;
      boss.y = 110 + Math.cos(boss.phase * 3.4) * 34;
    } else if (profile === "vortex" || profile === "mythic") {
      const orbitRadius = 170 + Math.sin(boss.phase * 0.7) * 50;
      boss.x = WIDTH / 2 + Math.cos(boss.phase * 1.6) * orbitRadius;
      boss.y = 120 + Math.sin(boss.phase * 1.9) * 55;
    } else if (profile === "inferno" || profile === "ember" || profile === "omega") {
      boss.dashCooldown -= dt;
      if (boss.dashCooldown <= 0) {
        const a = Math.atan2(player.y - boss.y, player.x - boss.x);
        boss.x = clamp(boss.x + Math.cos(a) * 180, 90, WIDTH - 90);
        boss.y = clamp(boss.y + Math.sin(a) * 120, 60, HEIGHT * 0.55);
        boss.dashCooldown = 1400;
        addParticles(boss.x, boss.y, boss.variant.primary, 18, 2.6);
      }
      boss.y += Math.sin(boss.phase * 2.1) * 0.9;
    } else if (profile === "aegis" || profile === "onyx") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase) * 90;
      boss.y = 96 + Math.cos(boss.phase * 2.1) * 14;
    } else if (profile === "hydra") {
      boss.x = WIDTH / 2 + Math.sin(boss.phase * 1.3) * 220;
      boss.y = 94 + Math.sin(boss.phase * 4.2) * 22;
      boss.summonCooldown -= dt;
      if (boss.summonCooldown <= 0 && state.enemies.length < 10) {
        const spawnType = ["wasp", "spark", "raptor", "vortexling"][Math.floor(Math.random() * 4)];
        const scaling = getEnemyStageScaling(state.stage);
        const spawnConfig = ENEMY_TYPES[spawnType];
        const hp = spawnConfig.hp(state.stage) * scaling.hp * 0.5;
        state.enemies.push({
          type: spawnType,
          x: clamp(boss.x + (Math.random() - 0.5) * 140, 20, WIDTH - 20),
          y: boss.y + 20,
          radius: spawnConfig.radius || 14,
          hp,
          maxHp: hp,
          speed: spawnConfig.speed(state.stage) * scaling.speed,
          fireCooldown: 300 + Math.random() * spawnConfig.shootCooldown,
          wobbleSeed: Math.random() * 9999,
          drift: (Math.random() - 0.5) * 0.7,
          phase: Math.random() * Math.PI * 2,
          teleportCooldown: 1200,
          dashCooldown: 1200,
          pulseTimer: 0,
          mirrorSign: Math.random() > 0.5 ? 1 : -1,
        });
        boss.summonCooldown = 3200;
      }
    } else if (profile === "quantum" || profile === "phantasm" || profile === "wraith") {
      boss.phaseShiftCooldown -= dt;
      if (boss.phaseShiftCooldown <= 0) {
        boss.x = 120 + Math.random() * (WIDTH - 240);
        boss.y = 76 + Math.random() * 90;
        boss.phaseShiftCooldown = profile === "quantum" ? 900 : 1450;
        addParticles(boss.x, boss.y, boss.variant.secondary, 22, 2.6);
      }
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
      const baseCooldown = profile === "seraph" || profile === "zephyr" ? 760 : profile === "omega" ? 680 : 980;
      boss.burstCooldown = baseCooldown * boss.fireRateScale;
    }

    boss.missileCooldown -= dt;
    if (boss.missileCooldown <= 0) {
      fireBossMissile(boss);
      const baseCooldown = profile === "wraith" || profile === "quantum" ? 1080 : profile === "hydra" ? 1000 : 1400;
      boss.missileCooldown = baseCooldown * boss.fireRateScale;
    }

    boss.laser.timer -= dt;

    if (boss.laser.mode === "idle" && boss.laser.timer <= 0) {
      boss.laser.mode = "charge";
      boss.laser.timer = profile === "wraith" || profile === "quantum" ? 700 : 1100;
      boss.laser.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.laser.sweepDir = player.x >= boss.x ? 1 : -1;
    }

    if (boss.laser.mode === "charge" && boss.laser.timer <= 0) {
      boss.laser.mode = "fire";
      boss.laser.timer = profile === "seraph" || profile === "zephyr" ? 1200 : 900;
      boss.laser.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    }

    if (boss.laser.mode === "fire" && (profile === "seraph" || profile === "zephyr" || profile === "nebula")) {
      boss.laser.angle += boss.laser.sweepDir * 0.014 * dtFactor;
    }

    if (boss.laser.mode === "fire" && boss.laser.timer <= 0) {
      boss.laser.mode = "idle";
      boss.laser.timer = profile === "wraith" || profile === "quantum" ? 1800 : 2500;
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

  function applyUpgradeSetToPlayer(player, upgrades) {
    if (!Array.isArray(upgrades) || upgrades.length === 0) return;
    upgrades.forEach((upgrade) => {
      if (upgrade && typeof upgrade.apply === "function") {
        upgrade.apply(player, upgrade.tier);
      }
    });
  }

  function buildPrivateBoostUpgrades() {
    const pool = [...UPGRADE_POOL];
    if (pool.length === 0) return [];

    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    const picks = [];
    while (picks.length < 100) {
      const base = pool[picks.length % pool.length];
      picks.push({ ...base, tier: base.tier || pickUpgradeTier() });
    }
    return picks;
  }

  function startNextStage() {
    const previousWorld = getWorldForStage(state.stage);
    state.stage += 1;
    persistWorldProgress(state.stage);
    state.running = true;
    state.pendingUpgrades = null;
    hideUpgradeSelection();
    initPlanetsForStage();
    resetStageProgress();
    applyPlaneStartingLoadout();
    syncPlaneUnlocks();
    const world = getWorldForStage(state.stage);
    const stageInWorld = getStageInWorld(state.stage);
    if (world > previousWorld) {
      triggerStageTransition(
        "NEW WORLD",
        `WORLD ${world} • ${getTheme().name}`
      );
      return;
    }

    triggerStageTransition(
      `STAGE ${state.stage} • WORLD ${world}`,
      `${getTheme().name} • ${stageInWorld}/${STAGES_PER_WORLD}`
    );
  }

  function completeStage() {
    if (state.stageCompleted) return;
    state.stageCompleted = true;

    if (state.stage >= FINAL_STAGE) {
      completeGame();
      return;
    }

    const upgrades = buildUpgradeOptions();
    state.running = false;
    state.pendingUpgrades = upgrades;
    const subtitle = state.isBossStage
      ? `Boss ${getBossTier(state.stage)} Defeated`
      : `Stage ${state.stage} Cleared`;
    triggerStageTransition("YOU WIN", subtitle);
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

    readGamepadInput();

    if (player.fireCooldown > 0) player.fireCooldown -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.pulseCooldown > 0) player.pulseCooldown -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.pulseFlash > 0) player.pulseFlash -= dt;
    if (player.tempRapid > 0) player.tempRapid -= dt;
    if (player.tempSpread > 0) player.tempSpread -= dt;
    if (player.tempPower > 0) player.tempPower -= dt;
    if (state.stageTransitionMs > 0) {
      state.stageTransitionMs = Math.max(0, state.stageTransitionMs - dt);
    }

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

    if (state.multiplayer.duel && state.multiplayer.duel.active) {
      updateDuel(dt, dtFactor);
      updateHud();
      return;
    }

    if (!state.running) {
      if (state.pendingUpgrades && state.stageTransitionMs <= 0) {
        const queuedUpgrades = state.pendingUpgrades;
        state.pendingUpgrades = null;
        showUpgradeSelection(queuedUpgrades);
      }
      updateHud();
      return;
    }

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
    const effectiveMoveSpeed = Math.min(MAX_EFFECTIVE_MOVE_SPEED, player.speed * plane.speedMult);
    player.x += (moveX / norm) * effectiveMoveSpeed * dtFactor;
    player.y += (moveY / norm) * effectiveMoveSpeed * dtFactor;
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
      const config = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.scout;
      enemy.phase += 0.02 * dtFactor;
      const toPlayerX = player.x - enemy.x;
      const toPlayerY = player.y - enemy.y;
      const dist = Math.max(1, Math.hypot(toPlayerX, toPlayerY));

      let vx = (toPlayerX / dist) * enemy.speed;
      let vy = (toPlayerY / dist) * enemy.speed;

      switch (config.movePattern) {
        case "wobble":
          vx += Math.sin(enemy.phase + enemy.wobbleSeed) * 1.1;
          break;
        case "strikerWave":
          vy += Math.sin(enemy.phase * 2) * 0.9;
          break;
        case "bomberGlide":
          vy = Math.max(0.45, vy * 0.7);
          break;
        case "kite": {
          const desired = 220;
          if (dist < desired) {
            vx = -(toPlayerX / dist) * enemy.speed;
            vy = -(toPlayerY / dist) * enemy.speed;
          }
          break;
        }
        case "zigzag":
          vx += Math.cos(enemy.phase * 4) * 1.6;
          vy += Math.sin(enemy.phase * 3) * 1.2;
          break;
        case "strafe":
          vx += Math.cos(enemy.phase * 1.8) * 1.25;
          break;
        case "teleport":
          enemy.teleportCooldown -= dt;
          if (enemy.teleportCooldown <= 0) {
            enemy.x = clamp(player.x + (Math.random() - 0.5) * 260, 20, WIDTH - 20);
            enemy.y = clamp(player.y - 70 - Math.random() * 120, -10, HEIGHT * 0.6);
            enemy.teleportCooldown = 900 + Math.random() * 1100;
            addParticles(enemy.x, enemy.y, config.color, 10, 1.7);
          }
          break;
        case "bulwark":
          vx *= 0.5;
          vy *= 0.42;
          break;
        case "swarm":
          vx += Math.cos(enemy.phase * 5.2) * 2;
          vy += Math.sin(enemy.phase * 4.3) * 1.6;
          break;
        case "orbitRush": {
          const orbitAngle = enemy.phase * 1.8;
          vx = Math.cos(orbitAngle) * enemy.speed + (toPlayerX / dist) * enemy.speed * 0.45;
          vy = Math.sin(orbitAngle) * enemy.speed + (toPlayerY / dist) * enemy.speed * 0.45;
          break;
        }
        case "sineWide":
          vx += Math.sin(enemy.phase * 1.4) * 1.8;
          vy += 0.35;
          break;
        case "hoverStall":
          if (dist < 180) {
            vx *= 0.35;
            vy *= 0.35;
          }
          vy += Math.sin(enemy.phase * 2.2) * 0.6;
          break;
        case "weave":
          vx += Math.sin(enemy.phase * 3.4) * 1.4;
          vy += Math.cos(enemy.phase * 2.7) * 1.1;
          break;
        case "anchor":
          vx *= 0.45;
          vy = Math.max(-0.2, vy * 0.2);
          break;
        case "flank":
          vx += (player.x > enemy.x ? -1 : 1) * 1.8;
          break;
        case "mimic":
          vx = (aim.x || 0) * enemy.speed * 1.15 + (toPlayerX / dist) * enemy.speed * 0.35;
          vy = (aim.y || 1) * enemy.speed * 1.15 + (toPlayerY / dist) * enemy.speed * 0.35;
          break;
        case "spiralDive": {
          const spin = enemy.phase * 3.2;
          vx = Math.cos(spin) * enemy.speed * 1.15;
          vy = Math.sin(spin) * enemy.speed * 0.9 + 0.7;
          break;
        }
        case "backstep":
          if (dist < 170) {
            vx = -(toPlayerX / dist) * enemy.speed * 1.2;
            vy = -(toPlayerY / dist) * enemy.speed * 1.2;
          }
          break;
        case "pulse":
          enemy.pulseTimer += dt;
          if (enemy.pulseTimer > 1200) {
            enemy.pulseTimer = 0;
            vx *= 2.2;
            vy *= 2.2;
          }
          break;
        case "hunter":
          vx *= 1.2;
          vy *= 1.2;
          break;
        case "feint":
          if (Math.sin(enemy.phase * 2.2) > 0.55) {
            vx = -(toPlayerX / dist) * enemy.speed * 0.9;
          }
          break;
        case "echo":
          vx += Math.sin(enemy.phase + enemy.wobbleSeed) * 0.9;
          vy += Math.sin(enemy.phase * 3.6) * 0.8;
          break;
        case "storm":
          vx += Math.cos(enemy.phase * 5.4) * 1.9;
          vy += Math.sin(enemy.phase * 4.9) * 1.5;
          break;
        case "suppressor":
          vx *= 0.75;
          vy *= 0.72;
          break;
        default:
          break;
      }

      enemy.x += vx * dtFactor;
      enemy.y += vy * dtFactor;

      enemy.x = clamp(enemy.x, 10, WIDTH - 10);
      enemy.y = clamp(enemy.y, -30, HEIGHT + 40);

      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0) {
        fireEnemy(enemy);
        const base = config.shootCooldown;
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

      if (state.boss && !state.boss.dying && bullet.life > 0) {
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

    if (state.boss && !state.boss.dying && state.boss.hp <= 0) {
      state.score += 650 + state.stage * 40;
      state.coins += 5;
      addParticles(state.boss.x, state.boss.y, "#ffe099", 48, 3.5);
      state.enemyBullets = [];
      state.boss.hp = 0;
      state.boss.dying = true;
      state.boss.deathDuration = BOSS_DEATH_DURATION_MS;
      state.boss.deathTimer = BOSS_DEATH_DURATION_MS;
      state.boss.laser.mode = "idle";
      state.boss.laser.timer = 99999;
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

    if (state.boss && !state.boss.dying) {
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
    const visual = plane.visual;
    const wingSpan = 13 * plane.wingScale;
    const bodyTail = 23 + plane.id * 0.03;
    const now = performance.now();
    const thrusterPulse = 1 + Math.sin(now * 0.02 + plane.id * 0.09) * 0.26;
    const glowPulse = 1 + Math.sin(now * 0.012 + plane.id * 0.13) * 0.18;
    const wingFront = wingSpan * (0.62 + visual.wingType * 0.07);
    const wingRear = wingSpan * (0.88 + visual.wingDepth * 0.018);
    const noseLen = visual.noseLength;
    const wingInset = visual.wingInset;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + Math.PI / 2);

    const alpha = player.invuln > 0 ? 0.65 + Math.sin(performance.now() * 0.03) * 0.2 : 1;
    ctx.globalAlpha = alpha;

    ctx.shadowColor = plane.glow;
    ctx.shadowBlur = 10 + Math.min(20, plane.id * 0.16) + visual.glowBoost * glowPulse;

    const hullGradient = ctx.createLinearGradient(0, -noseLen, 0, bodyTail + 4);
    hullGradient.addColorStop(0, plane.secondary);
    hullGradient.addColorStop(0.38, plane.primary);
    hullGradient.addColorStop(1, "#0b111d");
    ctx.fillStyle = hullGradient;

    ctx.beginPath();
    ctx.moveTo(0, -noseLen);
    ctx.lineTo(wingFront, 4 + visual.wingType * 1.2);
    ctx.lineTo(wingRear, 9 + visual.wingDepth * 0.6);
    ctx.lineTo(wingInset + 3, 8);
    ctx.lineTo(4, bodyTail);
    ctx.lineTo(-4, bodyTail);
    ctx.lineTo(-(wingInset + 3), 8);
    ctx.lineTo(-wingRear, 9 + visual.wingDepth * 0.6);
    ctx.lineTo(-wingFront, 4 + visual.wingType * 1.2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = plane.trim;
    if (visual.finType === 0) {
      ctx.fillRect(-4, -8, 8, 22);
    } else if (visual.finType === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(6, 12);
      ctx.lineTo(0, 18);
      ctx.lineTo(-6, 12);
      ctx.closePath();
      ctx.fill();
    } else if (visual.finType === 2) {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 3);
      ctx.lineTo(5, 20);
      ctx.lineTo(-5, 20);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-3.2, -10, 6.4, 24);
      ctx.fillRect(-8.5, 2, 17, 4.4);
    }

    ctx.fillStyle = plane.canopy;
    if (visual.canopyType === 0) {
      ctx.beginPath();
      ctx.ellipse(0, -2, 3.8, 8.6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (visual.canopyType === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(5, -1);
      ctx.lineTo(3.5, 7);
      ctx.lineTo(-3.5, 7);
      ctx.lineTo(-5, -1);
      ctx.closePath();
      ctx.fill();
    } else if (visual.canopyType === 2) {
      ctx.beginPath();
      ctx.roundRect(-4.4, -10, 8.8, 16, 3.3);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(4.5, -3);
      ctx.lineTo(4.5, 8);
      ctx.lineTo(-4.5, 8);
      ctx.lineTo(-4.5, -3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = Math.min(1, alpha * visual.stripeAlpha + 0.15);
    ctx.fillStyle = plane.secondary;
    if (visual.stripeType === 0) {
      ctx.fillRect(-1.2, -noseLen + 4, 2.4, bodyTail + noseLen - 10);
    } else if (visual.stripeType === 1) {
      ctx.fillRect(-wingRear + 3, 10, wingRear * 2 - 6, 2.8);
      ctx.fillRect(-wingRear + 8, 15, wingRear * 2 - 16, 2.2);
    } else if (visual.stripeType === 2) {
      ctx.beginPath();
      ctx.moveTo(-6, -5);
      ctx.lineTo(0, -14);
      ctx.lineTo(6, -5);
      ctx.lineTo(3, 8);
      ctx.lineTo(-3, 8);
      ctx.closePath();
      ctx.fill();
    } else if (visual.stripeType === 3) {
      ctx.fillRect(-8, 2, 16, 3);
      ctx.fillRect(-6.5, 8, 13, 2.5);
      ctx.fillRect(-4.5, 13, 9, 2.2);
    } else if (visual.stripeType === 4) {
      ctx.beginPath();
      ctx.arc(0, 2, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 11.5, 3.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-2.1, -8, 4.2, 20);
      ctx.fillRect(-wingFront + 4, 8, 5, 2.5);
      ctx.fillRect(wingFront - 9, 8, 5, 2.5);
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = plane.engine;
    const enginePods = Math.min(3, visual.enginePods);
    const podSpacing = 6;
    for (let podIndex = 0; podIndex < enginePods; podIndex += 1) {
      const centerOffset = (podIndex - (enginePods - 1) / 2) * podSpacing;
      const flame = (6 + Math.sin(now * 0.05 + podIndex * 1.4) * 2.4) * thrusterPulse;
      ctx.beginPath();
      ctx.moveTo(centerOffset, 24 + flame);
      ctx.lineTo(centerOffset + 2.8, 16.5);
      ctx.lineTo(centerOffset - 2.8, 16.5);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = Math.max(0.22, alpha * 0.45);
      ctx.fillStyle = plane.contrail;
      ctx.beginPath();
      ctx.ellipse(centerOffset, 29 + flame * 0.8, 2.5, 7.5 + flame * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = plane.engine;
    }

    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -noseLen + 3);
    ctx.lineTo(0, -noseLen + 9);
    ctx.stroke();

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
      ctx.fillStyle = servantState.isBig ? plane.secondary : plane.canopy;

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
      ctx.fillStyle = servantState.isBig ? plane.trim : plane.engine;
      ctx.fillRect(-2, -4, 4, 10);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = plane.contrail;
      ctx.beginPath();
      ctx.ellipse(0, 20, 2.6, 5.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemyPlane(enemy) {
    const config = ENEMY_TYPES[enemy.type];
    const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    const hpRatio = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(angle + Math.PI / 2);

    const hullGradient = ctx.createLinearGradient(0, -24, 0, 22);
    hullGradient.addColorStop(0, "#ffffff");
    hullGradient.addColorStop(0.26, config.color);
    hullGradient.addColorStop(1, "#101620");

    ctx.shadowColor = `${config.color}cc`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = hullGradient;

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
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, -2, 4.2, 8.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(172, 238, 255, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, -4.2, 2.3, 4.9, 0, 0, Math.PI * 2);
    ctx.fill();

    const thrusterGlow = 0.75 + Math.sin(performance.now() * 0.02 + enemy.phase) * 0.25;
    ctx.shadowColor = "rgba(130,230,255,0.9)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(120,220,255,${0.65 + thrusterGlow * 0.25})`;
    ctx.fillRect(-3.2, 18.4, 2.4, 8.8 * thrusterGlow);
    ctx.fillRect(0.8, 18.4, 2.4, 8.8 * thrusterGlow);

    ctx.shadowBlur = 0;

    ctx.restore();

    const barWidth = 36;
    const barHeight = 5;
    const barX = enemy.x - barWidth / 2;
    const barY = enemy.y - enemy.radius - 13;
    const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    hpGradient.addColorStop(0, "#ff6f6f");
    hpGradient.addColorStop(0.45, "#ffd66b");
    hpGradient.addColorStop(1, "#8cff8b");

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = hpGradient;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  function drawBoss() {
    const boss = state.boss;
    if (!boss) {
      return;
    }

    const variant = boss.variant;
    const now = performance.now();
    const bodyRadius = variant.radius;

    if (boss.dying) {
      const deathProgress = clamp(1 - boss.deathTimer / Math.max(1, boss.deathDuration), 0, 1);
      const fade = 1 - deathProgress;
      const coreRadius = bodyRadius * (1 + deathProgress * 0.7);

      ctx.save();
      ctx.globalAlpha = fade;
      const blast = ctx.createRadialGradient(
        boss.x,
        boss.y,
        bodyRadius * 0.15,
        boss.x,
        boss.y,
        bodyRadius * (1.6 + deathProgress * 1.4)
      );
      blast.addColorStop(0, "rgba(255,255,255,0.98)");
      blast.addColorStop(0.28, "rgba(255,224,168,0.85)");
      blast.addColorStop(0.62, "rgba(255,148,96,0.52)");
      blast.addColorStop(1, "rgba(255,120,90,0)");
      ctx.fillStyle = blast;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, bodyRadius * (1.4 + deathProgress * 1.2), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255,235,180,${0.8 * fade})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, coreRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,245,215,${0.88 * fade})`;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, bodyRadius * (0.3 + deathProgress * 0.24), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const pulse = 1 + Math.sin(now * 0.005) * 0.05;
    const glowPulse = 0.72 + Math.sin(now * 0.008) * 0.28;
    const wingPulse = 0.68 + Math.sin(now * 0.011 + boss.phase) * 0.32;
    const tierGlow = 1 + (boss.tier - 1) * 0.1;
    const wing = bodyRadius * 0.78;
    const tail = bodyRadius * 0.72;

    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);

    const auraRadius = bodyRadius * (1.22 + (boss.tier - 1) * 0.04);
    const auraGradient = ctx.createRadialGradient(
      boss.x,
      boss.y,
      bodyRadius * 0.35,
      boss.x,
      boss.y,
      auraRadius
    );
    auraGradient.addColorStop(0, `${variant.secondary}44`);
    auraGradient.addColorStop(0.6, `${variant.primary}1f`);
    auraGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, auraRadius * (0.96 + wingPulse * 0.07), 0, Math.PI * 2);
    ctx.fill();

    const haloAlpha = 0.24 + glowPulse * 0.16;
    ctx.strokeStyle = `rgba(255,255,255,${haloAlpha})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, bodyRadius * (1.02 + wingPulse * 0.06), 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.shadowColor = `${variant.primary}bb`;
    ctx.shadowBlur = 30 * tierGlow;

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

    ctx.globalAlpha = 0.2 + wingPulse * 0.14;
    ctx.fillStyle = `${variant.secondary}`;
    ctx.beginPath();
    ctx.moveTo(0, -bodyRadius * 0.95);
    ctx.lineTo(wing * 1.06, bodyRadius * 0.04);
    ctx.lineTo(wing * 0.38, bodyRadius * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -bodyRadius * 0.95);
    ctx.lineTo(-wing * 1.06, bodyRadius * 0.04);
    ctx.lineTo(-wing * 0.38, bodyRadius * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    const edgeGradient = ctx.createLinearGradient(-wing, 0, wing, 0);
    edgeGradient.addColorStop(0, "rgba(255,255,255,0.15)");
    edgeGradient.addColorStop(0.5, `${variant.secondary}cc`);
    edgeGradient.addColorStop(1, "rgba(255,255,255,0.15)");
    ctx.strokeStyle = edgeGradient;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.shadowColor = `${variant.secondary}aa`;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = `${variant.secondary}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -bodyRadius * 0.02, bodyRadius * (0.42 + boss.tier * 0.015), 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(20,28,44,${0.45 + wingPulse * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(0, -bodyRadius * 0.95);
    ctx.lineTo(bodyRadius * 0.16, -bodyRadius * 0.45);
    ctx.lineTo(0, -bodyRadius * 0.28);
    ctx.lineTo(-bodyRadius * 0.16, -bodyRadius * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = `rgba(255,210,160,${0.6 + glowPulse * 0.25})`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = `rgba(255,198,132,${0.58 + glowPulse * 0.28})`;
    ctx.fillRect(-bodyRadius * 0.21, bodyRadius * 0.72, bodyRadius * 0.11, bodyRadius * 0.24 * glowPulse);
    ctx.fillRect(bodyRadius * 0.1, bodyRadius * 0.72, bodyRadius * 0.11, bodyRadius * 0.24 * glowPulse);

    ctx.shadowColor = `rgba(120,225,255,${0.45 + glowPulse * 0.25})`;
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(120,215,255,${0.45 + glowPulse * 0.22})`;
    ctx.fillRect(-bodyRadius * 0.06, bodyRadius * 0.68, bodyRadius * 0.12, bodyRadius * 0.2 * glowPulse);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(8, 13, 26, 0.62)";
    ctx.fillRect(-bodyRadius * 0.16, -bodyRadius * 0.36, bodyRadius * 0.32, bodyRadius * 0.56);

    ctx.fillStyle = `rgba(255,255,255,${0.62 + wingPulse * 0.22})`;
    ctx.fillRect(-bodyRadius * 0.45, bodyRadius * 0.16, bodyRadius * 0.9, bodyRadius * 0.12);

    ctx.strokeStyle = `${variant.secondary}cc`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -bodyRadius * 0.05, bodyRadius * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "700 11px Rubik";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`T${boss.tier}`, 0, -bodyRadius * 0.04);

    ctx.globalAlpha = 0.55 + glowPulse * 0.18;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.arc(0, -bodyRadius * 0.98, bodyRadius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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
    if (!boss || boss.dying) return;

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
    const world = getWorldForStage(state.stage);
    const stageInWorld = getStageInWorld(state.stage);
    const partyBadge = state.gameCompleted ? "🎉 " : "";
    const bossText = state.isBossStage ? " (Boss)" : "";
    const bossName = state.isBossStage && state.boss ? ` • ${state.boss.variant.name}` : "";
    ctx.fillText(
      `${partyBadge}World ${world}/${TOTAL_WORLDS} • Stage ${state.stage} (${stageInWorld}/${STAGES_PER_WORLD})${bossText} — ${getTheme().name}${bossName}`,
      16,
      24
    );
  }

  function drawStageTransition() {
    if (state.stageTransitionMs <= 0 || state.stageTransitionDuration <= 0) {
      return;
    }

    const titleText = String(state.stageTransitionTitle || "");
    const isFlightTransition = /^STAGE\s|^NEW WORLD/.test(titleText);
    const progress = 1 - state.stageTransitionMs / state.stageTransitionDuration;
    const fadeIn = clamp(progress / 0.25, 0, 1);
    const fadeOut = clamp((1 - progress) / 0.28, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const sweep = easeOutCubic(clamp(progress, 0, 1));
    const lineY = HEIGHT * (0.18 + 0.64 * sweep);

    ctx.save();
    ctx.globalAlpha = alpha;

    const vignette = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.45, 20, WIDTH * 0.5, HEIGHT * 0.45, WIDTH * 0.75);
    vignette.addColorStop(0, "rgba(110,150,255,0.08)");
    vignette.addColorStop(1, "rgba(10,14,24,0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const lineGradient = ctx.createLinearGradient(0, lineY, WIDTH, lineY);
    lineGradient.addColorStop(0, "rgba(121,215,255,0)");
    lineGradient.addColorStop(0.2, "rgba(121,215,255,0.6)");
    lineGradient.addColorStop(0.5, "rgba(255,255,255,0.95)");
    lineGradient.addColorStop(0.8, "rgba(121,215,255,0.6)");
    lineGradient.addColorStop(1, "rgba(121,215,255,0)");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(WIDTH, lineY);
    ctx.stroke();

    ctx.shadowColor = "rgba(140,220,255,0.8)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.font = "800 42px Rubik";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.stageTransitionTitle || `STAGE ${state.stage}`, WIDTH * 0.5, HEIGHT * 0.44);

    ctx.shadowBlur = 0;
    if (state.stageTransitionSubtitle) {
      ctx.fillStyle = "rgba(190,225,255,0.9)";
      ctx.font = "600 16px Rubik";
      ctx.fillText(state.stageTransitionSubtitle, WIDTH * 0.5, HEIGHT * 0.49);
    }

    if (isFlightTransition) {
      const flightProgress = easeOutCubic(clamp(progress, 0, 1));
      const shipX = -120 + (WIDTH + 240) * flightProgress;
      const shipY = HEIGHT * 0.66 + Math.sin(progress * Math.PI * 2.6) * 22;

      const gateX = WIDTH * 0.86;
      const gateY = HEIGHT * 0.63;
      const gateR = 22 + Math.sin(progress * Math.PI * 3.5) * 3;

      ctx.strokeStyle = `rgba(165,235,255,${0.55 * alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gateX, gateY, gateR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(140,210,255,${0.2 * alpha})`;
      ctx.beginPath();
      ctx.arc(gateX, gateY, gateR * 0.7, 0, Math.PI * 2);
      ctx.fill();

      for (let index = 0; index < 10; index += 1) {
        const trailT = index / 10;
        const streakX = shipX - 20 - trailT * 220;
        const streakY = shipY + (index % 2 === 0 ? -1 : 1) * (6 + trailT * 10);
        const streakAlpha = (0.45 - trailT * 0.34) * alpha;
        ctx.strokeStyle = `rgba(145,225,255,${Math.max(0, streakAlpha)})`;
        ctx.lineWidth = Math.max(1, 3 - trailT * 2.1);
        ctx.beginPath();
        ctx.moveTo(streakX, streakY);
        ctx.lineTo(streakX - 40, streakY);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(0.06);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.18;
      ctx.scale(scale, scale);

      ctx.shadowColor = "rgba(140, 240, 255, 0.8)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(236, 250, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-16, -11);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-16, 11);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(125, 230, 255, 0.88)";
      ctx.fillRect(-20, -3, 10, 6);

      ctx.fillStyle = "rgba(255, 210, 140, 0.9)";
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-36, -4);
      ctx.lineTo(-36, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    const shardAlpha = alpha * (1 - Math.abs(0.5 - progress) * 1.1);
    ctx.globalAlpha = shardAlpha;
    ctx.fillStyle = "rgba(135, 230, 255, 0.8)";
    for (let i = 0; i < 14; i += 1) {
      const t = (i + 1) / 15;
      const dir = i % 2 === 0 ? -1 : 1;
      const px = WIDTH * 0.5 + dir * (60 + 280 * t * sweep);
      const py = HEIGHT * 0.44 + (i % 3 - 1) * 16 + Math.sin((progress * 8 + i) * 1.7) * 8;
      const size = 4 + (i % 4);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(progress * 10 + i);
      ctx.fillRect(-size * 0.5, -size * 0.5, size, size * 0.36);
      ctx.restore();
    }

    ctx.restore();
  }

  function draw() {
    if (state.multiplayer.duel && state.multiplayer.duel.active) {
      drawBackground();
      drawDuelMode();
      drawStageTransition();
      return;
    }

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
    drawStageTransition();
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
    state.chosenUpgrades.push(selected);
    renderPlaneDock();
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

  function setPrivateBoostMode(enabled) {
    state.privateBoostEnabled = Boolean(enabled);
    if (state.privateBoostEnabled) {
      state.highestWorldReached = Math.max(state.highestWorldReached, 9);
      saveWorldProgress();
      try {
        localStorage.setItem(PRIVATE_BOOST_KEY, "1");
      } catch {
        // ignore storage failures
      }
    } else {
      state.privateBoostUpgrades = [];
      state.chosenUpgrades = [];
      try {
        localStorage.removeItem(PRIVATE_BOOST_KEY);
      } catch {
        // ignore storage failures
      }
    }

    showOverlay(
      "Private Mode Updated",
      "Changes will apply after you reset."
    );
    setTimeout(() => {
      hideOverlay();
    }, 1100);
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

  window.enableHaloPrivateBoost = (code) => {
    if (code !== PRIVATE_BOOST_ACCESS_CODE) {
      return false;
    }
    setPrivateBoostMode(true);
    return true;
  };

  window.disableHaloPrivateBoost = () => {
    setPrivateBoostMode(false);
    return true;
  };

  if (localStorage.getItem(CREATOR_MODE_KEY) === "1") {
    state.creatorMode = true;
    enforceCreatorModePlanes();
  }

  function isTypingInField() {
    const element = document.activeElement;
    if (!element) return false;
    const tagName = String(element.tagName || "").toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select" || element.isContentEditable;
  }

  function setupPanelToggle(panelElement, storageKey, panelLabel) {
    if (!panelElement) return;

    const heading = panelElement.querySelector("h3");
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "panel-toggle-btn";

    const applyCollapsedState = (collapsed) => {
      panelElement.classList.toggle("panel-collapsed", collapsed);
      toggleButton.textContent = collapsed ? "פתח" : "סגור";
      const action = collapsed ? "פתח" : "סגור";
      toggleButton.title = `${action} ${panelLabel}`;
      toggleButton.setAttribute("aria-label", `${action} ${panelLabel}`);
      toggleButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };

    let isCollapsed = false;
    try {
      isCollapsed = localStorage.getItem(storageKey) === "1";
    } catch {
      isCollapsed = false;
    }

    applyCollapsedState(isCollapsed);

    toggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const collapsedNow = !panelElement.classList.contains("panel-collapsed");
      applyCollapsedState(collapsedNow);
      try {
        localStorage.setItem(storageKey, collapsedNow ? "1" : "0");
      } catch {
        // ignore storage failures
      }
    });

    if (heading) {
      heading.insertAdjacentElement("afterend", toggleButton);
    } else {
      panelElement.prepend(toggleButton);
    }
  }

  setMusicButtonLabel();
  if (arenaDom.musicBtn) {
    arenaDom.musicBtn.classList.add("hidden");
  }

  setupPanelToggle(arenaDom.planeDock, "haloArenaPlaneDockCollapsedV1", "טבלת המטוסים");
  setupPanelToggle(arenaDom.mpPanel, "haloArenaBattlePanelCollapsedV1", "טבלת הקרבות");

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (isTypingInField()) {
      return;
    }

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
    if (isTypingInField()) {
      return;
    }
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

  arenaDom.restartBtn.addEventListener("click", () => {
    if (state.multiplayer.duel) {
      setMultiplayerStatus("Cannot restart during duel", true);
      return;
    }
    resetGame();
  });
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

  if (arenaDom.resetWorldsBtn) {
    arenaDom.resetWorldsBtn.addEventListener("click", () => {
      resetWorldProgress();
    });
  }

  if (arenaDom.planeList) {
    arenaDom.planeList.addEventListener("click", (event) => {
      if (state.multiplayer.duel) {
        setMultiplayerStatus("You cannot switch plane during duel", true);
        return;
      }

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

  if (arenaDom.mpConnect) {
    arenaDom.mpConnect.addEventListener("click", () => {
      connectMultiplayer();
    });
  }

  if (arenaDom.mpName) {
    arenaDom.mpName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        connectMultiplayer();
      }
    });
  }

  if (arenaDom.mpServer) {
    arenaDom.mpServer.value = state.multiplayer.serverUrl;
    arenaDom.mpServer.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        connectMultiplayer();
      }
    });
  }

  if (arenaDom.mpMode) {
    arenaDom.mpMode.addEventListener("change", () => {
      state.multiplayer.selectedMode = arenaDom.mpMode.value;
    });
  }

  if (arenaDom.mpQueue) {
    arenaDom.mpQueue.addEventListener("click", () => {
      toggleMatchQueue();
    });
  }

  if (arenaDom.mpInviteSend) {
    arenaDom.mpInviteSend.addEventListener("click", () => {
      sendInviteByName();
    });
  }

  if (arenaDom.mpInviteName) {
    arenaDom.mpInviteName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendInviteByName();
      }
    });
  }

  if (arenaDom.mpAccept) {
    arenaDom.mpAccept.addEventListener("click", () => {
      const invite = state.multiplayer.incomingInvite;
      if (!invite) return;
      const plane = getActivePlane();
      sendMultiplayerMessage({
        type: "inviteResponse",
        fromId: invite.fromId,
        accepted: true,
        planeId: plane.id,
      });
      state.multiplayer.incomingInvite = null;
      updateIncomingInviteUi();
      setMultiplayerStatus(`Accepted invite from ${invite.fromName}`);
    });
  }

  if (arenaDom.mpDecline) {
    arenaDom.mpDecline.addEventListener("click", () => {
      const invite = state.multiplayer.incomingInvite;
      if (!invite) return;
      sendMultiplayerMessage({
        type: "inviteResponse",
        fromId: invite.fromId,
        accepted: false,
      });
      state.multiplayer.incomingInvite = null;
      updateIncomingInviteUi();
      setMultiplayerStatus(`Declined invite from ${invite.fromName}`);
    });
  }

  updateTouchActionLabels();
  setMultiplayerStatus("Offline");
  updateIncomingInviteUi();
  renderMultiplayerUsers();
  resetGame();
  requestAnimationFrame(loop);
}
