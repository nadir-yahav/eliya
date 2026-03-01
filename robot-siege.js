const dom = {
  canvas: document.getElementById("robotCanvas"),
  score: document.getElementById("rsScore"),
  health: document.getElementById("rsHealth"),
  stage: document.getElementById("rsStage"),
  weapon: document.getElementById("rsWeapon"),
  enemies: document.getElementById("rsEnemies"),
  classSelect: document.getElementById("rsClass"),
  dash: document.getElementById("rsDash"),
  shield: document.getElementById("rsShield"),
  ultimate: document.getElementById("rsUltimate"),
  bossBar: document.getElementById("rsBossBar"),
  bossName: document.getElementById("rsBossName"),
  bossHpText: document.getElementById("rsBossHpText"),
  bossHpFill: document.getElementById("rsBossHpFill"),
  fullscreenBtn: document.getElementById("rsFullscreenBtn"),
  restartBtn: document.getElementById("rsRestartBtn"),
  overlay: document.getElementById("rsOverlay"),
  overlayTitle: document.getElementById("rsOverlayTitle"),
  overlayText: document.getElementById("rsOverlayText"),
  overlayBtn: document.getElementById("rsOverlayBtn"),
};

if (!dom.canvas || typeof THREE === "undefined") {
  throw new Error("Three.js or canvas is missing");
}

const CLASS_PRESETS = {
  assault: { name: "Assault", maxHp: 120, speed: 10, fireRate: 0.2, damage: 18, color: 0x4fc3ff },
  guardian: { name: "Guardian", maxHp: 160, speed: 8, fireRate: 0.25, damage: 15, color: 0x8fa8ff },
  striker: { name: "Striker", maxHp: 95, speed: 12, fireRate: 0.14, damage: 20, color: 0x7affac },
};

const MECH_MODEL_PATHS = [
  "Animated Mech Pack - March 2021/Textured/glTF/George.gltf",
  "Animated Mech Pack - March 2021/Textured/glTF/Leela.gltf",
  "Animated Mech Pack - March 2021/Textured/glTF/Mike.gltf",
  "Animated Mech Pack - March 2021/Textured/glTF/Stan.gltf",
];

const CITY_MODEL_PATHS = {
  apartments: "assets/city-hq/polyhaven/models/modular_urban_apartments_facade/modular_urban_apartments_facade.gltf",
  streetLamp: "assets/city-hq/polyhaven/models/street_lamp_01/street_lamp_01.gltf",
  streetSeating: "assets/city-hq/polyhaven/models/modular_street_seating/modular_street_seating.gltf",
};

const ENEMY_HP_MULTIPLIER = 1.8;
const BOSS_STAGE_INTERVAL = 5;

const BOSS_ARCHETYPES = [
  {
    id: "juggernaut",
    name: "JUGGERNAUT",
    role: "tank",
    hpMul: 1.45,
    speedMul: 0.78,
    damageMul: 1.55,
    scale: 5.2,
    hitRadius: 6.8,
    intro: "JUGGERNAUT נכנס: גלי הדף קטלניים",
  },
  {
    id: "sniper",
    name: "PHASE SNIPER",
    role: "assault",
    hpMul: 1.18,
    speedMul: 1.02,
    damageMul: 1.45,
    scale: 4.5,
    hitRadius: 6.1,
    intro: "PHASE SNIPER נכנס: טלפורט וירי Burst",
  },
  {
    id: "summoner",
    name: "SWARM COMMANDER",
    role: "tank",
    hpMul: 1.3,
    speedMul: 0.86,
    damageMul: 1.35,
    scale: 4.9,
    hitRadius: 6.4,
    intro: "SWARM COMMANDER נכנס: מזמן דרואידים",
  },
];

const state = {
  running: true,
  score: 0,
  stage: 1,
  kills: 0,
  stageGoal: 8,
  keys: new Set(),
  screenMouse: new THREE.Vector2(0, 0),
  player: {
    hp: 120,
    maxHp: 120,
    speed: 10,
    fireRate: 0.2,
    damage: 18,
    classId: "assault",
    fireCooldown: 0,
    dashCooldown: 0,
    shieldCooldown: 0,
    shieldTime: 0,
    ultimateCooldown: 0,
    facing: new THREE.Vector3(0, 0, -1),
  },
  spawnTimer: 0,
  spawnInterval: 1.8,
  bossSpawned: false,
  bossDefeated: false,
  useTemplatePlayer: true,
  playerShootAnimTimer: 0,
  enemyTemplates: [],
  assetStatus: "loading",
  enemies: [],
  enemyBullets: [],
  bullets: [],
  explosions: [],
  gamepad: {
    previous: {
      shoot: false,
      dash: false,
      shield: false,
      ultimate: false,
    },
  },
  camera: {
    yaw: 0,
    pitch: 0.58,
    distance: 26,
    minPitch: 0.28,
    maxPitch: 1.12,
    minDistance: 16,
    maxDistance: 34,
    orbiting: false,
    lastMouseX: 0,
    lastMouseY: 0,
  },
};

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1116);
scene.fog = null;

const camera = new THREE.PerspectiveCamera(65, 16 / 9, 0.1, 300);
camera.position.set(0, 18, 20);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tempVec = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const GAMEPAD_DEADZONE = 0.18;

const audioState = {
  ctx: null,
  master: null,
  ambienceOsc: null,
  ambienceGain: null,
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function ensureAudio() {
  if (audioState.ctx) return true;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;

  audioState.ctx = new AudioCtx();
  audioState.master = audioState.ctx.createGain();
  audioState.master.gain.value = 0.16;
  audioState.master.connect(audioState.ctx.destination);

  audioState.ambienceOsc = audioState.ctx.createOscillator();
  audioState.ambienceGain = audioState.ctx.createGain();
  audioState.ambienceOsc.type = "triangle";
  audioState.ambienceOsc.frequency.value = 65;
  audioState.ambienceGain.gain.value = 0.018;
  audioState.ambienceOsc.connect(audioState.ambienceGain);
  audioState.ambienceGain.connect(audioState.master);
  audioState.ambienceOsc.start();
  return true;
}

function playSound(freq, duration, volume, type = "square") {
  if (!ensureAudio()) return;
  if (audioState.ctx.state === "suspended") {
    audioState.ctx.resume();
  }
  const now = audioState.ctx.currentTime;
  const osc = audioState.ctx.createOscillator();
  const gain = audioState.ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.72), now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(audioState.master);
  osc.start(now);
  osc.stop(now + duration + 0.015);
}

function playPlayerShotSound() {
  playSound(430, 0.08, 0.05, "square");
}

function playEnemyShotSound() {
  playSound(210, 0.12, 0.04, "sawtooth");
}

function playEnemyHitSound() {
  playSound(620, 0.06, 0.03, "triangle");
}

function playExplosionSound() {
  playSound(140, 0.22, 0.08, "sawtooth");
  playSound(85, 0.28, 0.06, "triangle");
}

const hemiLight = new THREE.HemisphereLight(0xc7e2ff, 0x406f38, 0.92);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff0d6, 1.15);
dirLight.position.set(36, 42, -18);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -120;
dirLight.shadow.camera.right = 120;
dirLight.shadow.camera.top = 120;
dirLight.shadow.camera.bottom = -120;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xc9dcff, 0.36);
fillLight.position.set(-26, 18, 30);
scene.add(fillLight);

function createRobot(color, isHero = false) {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: isHero ? 0.78 : 0.45,
    roughness: isHero ? 0.24 : 0.42,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.7, 1.6),
    bodyMaterial
  );
  body.position.y = 2.2;
  body.castShadow = true;

  const visorMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8e6ff,
    emissive: isHero ? 0x4fc3ff : 0x1e375f,
    emissiveIntensity: isHero ? 1.1 : 0.35,
    metalness: 0.6,
    roughness: 0.2,
  });

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.1, 1.2),
    visorMaterial
  );
  head.position.set(0, 3.9, 0);
  head.castShadow = true;

  const armMat = new THREE.MeshStandardMaterial({ color: 0x7f95b8, metalness: 0.35, roughness: 0.5 });
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.5), armMat);
  armL.position.set(-1.4, 2.2, 0);
  armL.castShadow = true;

  const armR = armL.clone();
  armR.position.x = 1.4;

  const legMat = new THREE.MeshStandardMaterial({ color: 0x6f85ad, metalness: 0.3, roughness: 0.54 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.5, 0.7), legMat);
  legL.position.set(-0.55, 0.75, 0);
  legL.castShadow = true;

  const legR = legL.clone();
  legR.position.x = 0.55;

  if (isHero) {
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0xa7ddff,
      emissive: 0x2f8fca,
      emissiveIntensity: 0.72,
      metalness: 0.8,
      roughness: 0.18,
    });
    const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.9), shoulderMat);
    shoulderL.position.set(-1.18, 3.05, 0);
    shoulderL.castShadow = true;
    const shoulderR = shoulderL.clone();
    shoulderR.position.x = 1.18;

    const chestCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x8de5ff,
      emissive: 0x42d7ff,
      emissiveIntensity: 1.3,
      metalness: 0.7,
      roughness: 0.12,
    });
    const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 18), chestCoreMaterial);
    chestCore.rotation.x = Math.PI / 2;
    chestCore.position.set(0, 2.35, 0.86);
    chestCore.castShadow = true;

    const crestMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8f0ff,
      emissive: 0x49b7ff,
      emissiveIntensity: 0.95,
      metalness: 0.72,
      roughness: 0.15,
    });
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.15), crestMaterial);
    crest.position.set(0, 4.62, 0.2);
    crest.castShadow = true;

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.06, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0x7dd4ff,
        emissive: 0x2db0ff,
        emissiveIntensity: 0.95,
        metalness: 0.55,
        roughness: 0.2,
      })
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.14;

    const backpackMaterial = new THREE.MeshStandardMaterial({
      color: 0x9ec8f4,
      emissive: 0x2f5da0,
      emissiveIntensity: 0.55,
      metalness: 0.8,
      roughness: 0.2,
    });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.45, 0.55), backpackMaterial);
    backpack.position.set(0, 2.5, -0.98);
    backpack.castShadow = true;

    const thrusterMaterial = new THREE.MeshStandardMaterial({
      color: 0x96e6ff,
      emissive: 0x2ad3ff,
      emissiveIntensity: 1,
      metalness: 0.7,
      roughness: 0.15,
    });
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.5, 14), thrusterMaterial);
    thrusterL.rotation.x = Math.PI / 2;
    thrusterL.position.set(-0.42, 2.1, -1.28);
    thrusterL.castShadow = true;
    const thrusterR = thrusterL.clone();
    thrusterR.position.x = 0.42;

    const jetGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x79e5ff, transparent: true, opacity: 0.75 });
    const jetGlowL = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.45, 12), jetGlowMaterial);
    jetGlowL.rotation.x = -Math.PI / 2;
    jetGlowL.position.set(-0.42, 2.1, -1.64);
    const jetGlowR = jetGlowL.clone();
    jetGlowR.position.x = 0.42;

    const faceStripMaterial = new THREE.MeshStandardMaterial({
      color: 0xbdf3ff,
      emissive: 0x3ad3ff,
      emissiveIntensity: 0.95,
      metalness: 0.68,
      roughness: 0.14,
    });
    const faceStrip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 0.04), faceStripMaterial);
    faceStrip.position.set(0, 4.05, 0.63);

    const kneeGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0x8ce6ff,
      emissive: 0x2ab7ff,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.2,
    });
    const kneeGlowL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), kneeGlowMaterial);
    kneeGlowL.position.set(-0.55, 1.1, 0.4);
    const kneeGlowR = kneeGlowL.clone();
    kneeGlowR.position.x = 0.55;

    group.add(
      shoulderL,
      shoulderR,
      chestCore,
      crest,
      baseRing,
      backpack,
      thrusterL,
      thrusterR,
      jetGlowL,
      jetGlowR,
      faceStrip,
      kneeGlowL,
      kneeGlowR
    );
    group.userData.heroVisuals = {
      visorMaterial,
      chestCoreMaterial,
      baseRingMaterial: baseRing.material,
      backpackMaterial,
      thrusterMaterial,
      jetGlowMaterial,
      faceStripMaterial,
      kneeGlowMaterial,
      jetGlowL,
      jetGlowR,
      shoulderL,
      shoulderR,
      armL,
      armR,
      legL,
      legR,
      crest,
      body,
    };
  }

  group.add(body, head, armL, armR, legL, legR);
  return group;
}

function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxSize = Math.max(size.x, size.y, size.z, 0.0001);
  const desired = 5.2;
  const scale = desired / maxSize;
  root.scale.setScalar(scale);

  const boxAfter = new THREE.Box3().setFromObject(root);
  const minY = boxAfter.min.y;
  root.position.y -= minY;

  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function loadEnemyTemplates() {
  if (typeof THREE.GLTFLoader === "undefined") {
    state.assetStatus = "fallback";
    return;
  }

  const loader = new THREE.GLTFLoader();
  let completed = 0;

  for (const path of MECH_MODEL_PATHS) {
    const encodedPath = encodeURI(path);
    loader.load(
      encodedPath,
      (gltf) => {
        const template = gltf.scene || gltf.scenes?.[0];
        if (template) {
          normalizeModel(template);
          state.enemyTemplates.push({ scene: template, animations: gltf.animations || [], path });
        }
        completed += 1;
        if (completed === MECH_MODEL_PATHS.length) {
          state.assetStatus = state.enemyTemplates.length > 0 ? "ready" : "fallback";
          if (state.assetStatus === "ready" && state.useTemplatePlayer && !playerMesh.userData.playerAnim) {
            const prevPos = playerMesh.position.clone();
            const prevRatio = state.player.hp / Math.max(1, state.player.maxHp);
            setClass(state.player.classId);
            playerMesh.position.copy(prevPos);
            state.player.hp = clamp(state.player.maxHp * prevRatio, 1, state.player.maxHp);
          }
        }
      },
      undefined,
      () => {
        completed += 1;
        if (completed === MECH_MODEL_PATHS.length) {
          state.assetStatus = state.enemyTemplates.length > 0 ? "ready" : "fallback";
        }
      }
    );
  }
}

function normalizeStaticModel(root, desiredMaxSize) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxSize = Math.max(size.x, size.y, size.z, 0.0001);
  const scale = desiredMaxSize / maxSize;
  root.scale.setScalar(scale);

  const boxAfter = new THREE.Box3().setFromObject(root);
  root.position.y -= boxAfter.min.y;

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
}

function addCityEnvironment() {
  const fallbackArena = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ color: 0x1f242c, roughness: 0.94, metalness: 0.05 })
  );
  fallbackArena.rotation.x = -Math.PI / 2;
  fallbackArena.receiveShadow = true;
  scene.add(fallbackArena);

  if (typeof THREE.GLTFLoader === "undefined") {
    return;
  }

  const loader = new THREE.GLTFLoader();
  const loadModel = (path) => new Promise((resolve, reject) => {
    loader.load(encodeURI(path), resolve, undefined, reject);
  });

  Promise.all([
    loadModel(CITY_MODEL_PATHS.apartments),
    loadModel(CITY_MODEL_PATHS.streetLamp),
    loadModel(CITY_MODEL_PATHS.streetSeating),
  ]).then(([apartmentsGltf, lampGltf, seatingGltf]) => {
    const apartmentsBase = apartmentsGltf.scene || apartmentsGltf.scenes?.[0];
    const lampBase = lampGltf.scene || lampGltf.scenes?.[0];
    const seatingBase = seatingGltf.scene || seatingGltf.scenes?.[0];
    if (!apartmentsBase || !lampBase || !seatingBase) {
      return;
    }

    normalizeStaticModel(apartmentsBase, 36);
    normalizeStaticModel(lampBase, 8.6);
    normalizeStaticModel(seatingBase, 11);

    const cityGroup = new THREE.Group();
    cityGroup.name = "cityEnvironment";

    const arenaBase = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0x20242c, roughness: 0.94, metalness: 0.05 })
    );
    arenaBase.rotation.x = -Math.PI / 2;
    arenaBase.receiveShadow = true;
    cityGroup.add(arenaBase);

    scene.remove(fallbackArena);

    const battleZone = new THREE.Mesh(
      new THREE.PlaneGeometry(86, 86),
      new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.91, metalness: 0.05 })
    );
    battleZone.rotation.x = -Math.PI / 2;
    battleZone.position.y = 0.02;
    battleZone.receiveShadow = true;
    cityGroup.add(battleZone);

    const place = (source, x, z, rotationY, scale = 1) => {
      const instance = source.clone(true);
      instance.position.set(x, 0, z);
      instance.rotation.y = rotationY;
      if (scale !== 1) {
        instance.scale.multiplyScalar(scale);
      }
      cityGroup.add(instance);
    };

    const apartmentLayout = [
      { x: -108, z: -58, r: Math.PI / 2 },
      { x: -108, z: 58, r: Math.PI / 2 },
      { x: 108, z: -58, r: -Math.PI / 2 },
      { x: 108, z: 58, r: -Math.PI / 2 },
      { x: -58, z: -108, r: 0 },
      { x: 58, z: -108, r: 0 },
      { x: -58, z: 108, r: Math.PI },
      { x: 58, z: 108, r: Math.PI },
    ];

    for (const slot of apartmentLayout) {
      place(apartmentsBase, slot.x, slot.z, slot.r, 1);
    }

    const lampLayout = [
      [-52, -52], [52, -52], [-52, 52], [52, 52],
      [-52, 0], [52, 0], [0, -52], [0, 52],
    ];
    for (const [x, z] of lampLayout) {
      place(lampBase, x, z, 0, 1);
    }

    const seatingLayout = [
      { x: -66, z: -34, r: Math.PI / 2 },
      { x: 66, z: -34, r: -Math.PI / 2 },
      { x: -34, z: 66, r: Math.PI },
      { x: 34, z: 66, r: Math.PI },
    ];
    for (const slot of seatingLayout) {
      place(seatingBase, slot.x, slot.z, slot.r, 1);
    }

    scene.add(cityGroup);
  }).catch(() => {
  });
}

function findClip(animations, candidates) {
  const normalized = candidates.map((name) => name.toLowerCase());
  for (const clip of animations) {
    const clipName = (clip.name || "").toLowerCase();
    if (normalized.includes(clipName)) {
      return clip;
    }
  }

  for (const candidate of normalized) {
    for (const clip of animations) {
      const clipName = (clip.name || "").toLowerCase();
      if (clipName.includes(candidate)) {
        return clip;
      }
    }
  }

  return null;
}

function createTemplatePlayerMesh() {
  if (state.enemyTemplates.length === 0) return null;

  let preferred = state.enemyTemplates.find((tpl) => (tpl.path || "").toLowerCase().includes("mike"));
  if (!preferred) preferred = state.enemyTemplates[0];
  if (!preferred) return null;

  const mesh = (THREE.SkeletonUtils && THREE.SkeletonUtils.clone)
    ? THREE.SkeletonUtils.clone(preferred.scene)
    : preferred.scene.clone(true);

  const playerScale = 4.2;
  mesh.scale.multiplyScalar(playerScale);
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const anim = {
    mixer: null,
    actions: {},
    current: null,
  };

  if (preferred.animations && preferred.animations.length > 0) {
    anim.mixer = new THREE.AnimationMixer(mesh);
    const idleClip = findClip(preferred.animations, ["Idle"]);
    const moveClip = findClip(preferred.animations, ["Run", "Run_Holding", "Walk", "Walk_Holding", "Run_Tall", "Walk_Tall"]);
    const shootClip = findClip(preferred.animations, ["Shoot", "Punch", "Kick"]);

    if (idleClip) anim.actions.idle = anim.mixer.clipAction(idleClip);
    if (moveClip) anim.actions.move = anim.mixer.clipAction(moveClip);
    if (shootClip) {
      anim.actions.shoot = anim.mixer.clipAction(shootClip);
      anim.actions.shoot.setLoop(THREE.LoopOnce, 1);
      anim.actions.shoot.clampWhenFinished = true;
      anim.actions.shoot.timeScale = 1.25;
    }

    if (anim.actions.idle) {
      anim.actions.idle.play();
      anim.current = "idle";
    }
  }

  return { mesh, anim };
}

function setPlayerAnimState(nextState, fadeDuration = 0.14) {
  const playerAnim = playerMesh.userData.playerAnim;
  if (!playerAnim || !playerAnim.mixer) return;
  if (playerAnim.current === nextState) return;
  const nextAction = playerAnim.actions[nextState];
  if (!nextAction) return;

  if (playerAnim.current && playerAnim.actions[playerAnim.current]) {
    playerAnim.actions[playerAnim.current].fadeOut(fadeDuration);
  }
  nextAction.reset().fadeIn(fadeDuration).play();
  playerAnim.current = nextState;
}

function triggerPlayerShootAnim() {
  const playerAnim = playerMesh.userData.playerAnim;
  if (!playerAnim || !playerAnim.mixer || !playerAnim.actions.shoot) return;
  playerAnim.actions.shoot.reset().play();
  state.playerShootAnimTimer = 0.22;
}

function buildEnemyActions(mesh, animations, role) {
  if (!animations || animations.length === 0) {
    return { mixer: null, actions: null };
  }

  const roleMoveCandidates = {
    scout: ["Run", "Run_Holding", "Run_Tall", "Walk", "Walk_Holding", "Walk_Tall"],
    tank: ["Walk_Tall", "Walk", "Walk_Holding", "Run_Tall", "Run"],
    assault: ["Walk", "Walk_Holding", "Run", "Run_Holding", "Walk_Tall"],
  };

  const mixer = new THREE.AnimationMixer(mesh);
  const idleClip = findClip(animations, ["Idle"]);
  const moveClip = findClip(animations, roleMoveCandidates[role] || roleMoveCandidates.assault);
  const shootClip = findClip(animations, ["Shoot", "Punch", "Kick"]);

  const actions = {};
  if (idleClip) {
    actions.idle = mixer.clipAction(idleClip);
  }
  if (moveClip) {
    actions.move = mixer.clipAction(moveClip);
  }
  if (shootClip) {
    actions.shoot = mixer.clipAction(shootClip);
  }

  if (actions.idle) {
    actions.idle.enabled = true;
    actions.idle.setLoop(THREE.LoopRepeat);
  }
  if (actions.move) {
    actions.move.enabled = true;
    actions.move.setLoop(THREE.LoopRepeat);
    actions.move.timeScale = role === "scout" ? 1.2 : role === "tank" ? 0.9 : 1;
  }
  if (actions.shoot) {
    actions.shoot.enabled = true;
    actions.shoot.setLoop(THREE.LoopOnce, 1);
    actions.shoot.clampWhenFinished = true;
    actions.shoot.timeScale = 1.4;
  }

  return { mixer, actions };
}

function setEnemyAnim(enemy, stateName, fadeDuration = 0.2) {
  if (!enemy.actions) return;
  if (enemy.animState === stateName) return;
  const nextAction = enemy.actions[stateName];
  if (!nextAction) return;

  if (enemy.animState && enemy.actions[enemy.animState]) {
    enemy.actions[enemy.animState].fadeOut(fadeDuration);
  }

  nextAction.reset().fadeIn(fadeDuration).play();
  enemy.animState = stateName;
}

function createEnemyVisual(role) {
  if (state.enemyTemplates.length === 0) {
    return { mesh: createRobot(0xff9262), mixer: null, actions: null };
  }

  const template = state.enemyTemplates[Math.floor(Math.random() * state.enemyTemplates.length)];
  const mesh = (THREE.SkeletonUtils && THREE.SkeletonUtils.clone)
    ? THREE.SkeletonUtils.clone(template.scene)
    : template.scene.clone(true);
  const animationBundle = buildEnemyActions(mesh, template.animations, role);
  return { mesh, mixer: animationBundle.mixer, actions: animationBundle.actions };
}

let playerMesh = createRobot(CLASS_PRESETS.assault.color, true);
playerMesh.position.set(0, 0, 0);
scene.add(playerMesh);

const shieldSphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.9, 20, 20),
  new THREE.MeshBasicMaterial({ color: 0x7ad8ff, transparent: true, opacity: 0.22 })
);
shieldSphere.visible = false;
playerMesh.add(shieldSphere);
shieldSphere.position.y = 2.2;

function resizeRenderer() {
  const w = dom.canvas.clientWidth || 960;
  const h = dom.canvas.clientHeight || 540;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distancePointToSegmentSq2D(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLenSq = abx * abx + abz * abz;
  if (abLenSq <= 0.000001) {
    const dx = px - ax;
    const dz = pz - az;
    return dx * dx + dz * dz;
  }

  let t = (apx * abx + apz * abz) / abLenSq;
  t = clamp(t, 0, 1);
  const cx = ax + abx * t;
  const cz = az + abz * t;
  const dx = px - cx;
  const dz = pz - cz;
  return dx * dx + dz * dz;
}

function setOverlay(show, title = "", text = "") {
  if (!dom.overlay) return;
  if (show) {
    dom.overlayTitle.textContent = title;
    dom.overlayText.textContent = text;
    dom.overlay.classList.remove("hidden");
  } else {
    dom.overlay.classList.add("hidden");
  }
}

function updateFullscreenButtonLabel() {
  if (!dom.fullscreenBtn) return;
  dom.fullscreenBtn.textContent = document.fullscreenElement ? "צא ממסך מלא" : "מסך מלא";
  document.body.classList.toggle("fullscreen-mode", Boolean(document.fullscreenElement));
  resizeRenderer();
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      const root = document.documentElement;
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    updateFullscreenButtonLabel();
  }
}

function setClass(classId) {
  const preset = CLASS_PRESETS[classId] || CLASS_PRESETS.assault;
  state.player.classId = classId;
  state.player.maxHp = preset.maxHp;
  state.player.hp = preset.maxHp;
  state.player.speed = preset.speed;
  state.player.fireRate = preset.fireRate;
  state.player.damage = preset.damage;

  scene.remove(playerMesh);
  const templatePlayer = state.useTemplatePlayer ? createTemplatePlayerMesh() : null;
  if (templatePlayer) {
    playerMesh = templatePlayer.mesh;
    playerMesh.userData.playerAnim = templatePlayer.anim;
    state.playerShootAnimTimer = 0;
  } else {
    playerMesh = createRobot(preset.color, true);
  }
  playerMesh.position.set(0, 0, 0);
  playerMesh.add(shieldSphere);
  shieldSphere.position.y = 2.2;
  scene.add(playerMesh);

  if (dom.weapon) {
    dom.weapon.textContent = `${preset.name} Blaster`;
  }
}

function updateHud() {
  const activeBoss = state.enemies.find((enemy) => enemy.isBoss);

  dom.score.textContent = `${Math.floor(state.score)}`;
  dom.health.textContent = `${Math.max(0, Math.floor(state.player.hp))}`;
  dom.stage.textContent = `${state.stage}`;
  dom.enemies.textContent = `${state.enemies.length}`;
  dom.dash.textContent = state.player.dashCooldown <= 0 ? "Ready" : `${state.player.dashCooldown.toFixed(1)}s`;

  if (state.player.shieldTime > 0) {
    dom.shield.textContent = `Active ${state.player.shieldTime.toFixed(1)}s`;
  } else {
    dom.shield.textContent = state.player.shieldCooldown <= 0 ? "Ready" : `${state.player.shieldCooldown.toFixed(1)}s`;
  }

  dom.ultimate.textContent = state.player.ultimateCooldown <= 0 ? "Ready" : `${state.player.ultimateCooldown.toFixed(1)}s`;

  if (dom.bossBar && dom.bossName && dom.bossHpText && dom.bossHpFill) {
    if (activeBoss) {
      const hpPercent = clamp((activeBoss.hp / Math.max(1, activeBoss.maxHp)) * 100, 0, 100);
      dom.bossBar.classList.remove("hidden");
      dom.bossName.textContent = activeBoss.bossName || "BOSS";
      dom.bossHpText.textContent = `${Math.ceil(hpPercent)}%`;
      dom.bossHpFill.style.width = `${hpPercent}%`;
    } else {
      dom.bossBar.classList.add("hidden");
    }
  }
}

function spawnEnemy() {
  let x = 0;
  let z = 0;
  const side = Math.floor(Math.random() * 4);
  const spread = 75;
  const border = 54 + Math.random() * 16;

  if (side === 0) {
    x = rand(-spread, spread);
    z = -border;
  } else if (side === 1) {
    x = border;
    z = rand(-spread, spread);
  } else if (side === 2) {
    x = rand(-spread, spread);
    z = border;
  } else {
    x = -border;
    z = rand(-spread, spread);
  }

  for (let tries = 0; tries < 8; tries += 1) {
    let tooClose = false;
    for (const enemy of state.enemies) {
      const dx = enemy.mesh.position.x - x;
      const dz = enemy.mesh.position.z - z;
      if (dx * dx + dz * dz < 100) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) break;
    x += rand(-8, 8);
    z += rand(-8, 8);
  }

  const typeRoll = Math.random();
  const role = typeRoll < 0.34 ? "scout" : typeRoll < 0.68 ? "assault" : "tank";
  const roleStats = {
    scout: { hpMul: 0.82, speedMul: 1.25, damageMul: 0.88 },
    assault: { hpMul: 1, speedMul: 1, damageMul: 1 },
    tank: { hpMul: 1.35, speedMul: 0.78, damageMul: 1.2 },
  };
  const stats = roleStats[role] || roleStats.assault;

  const enemyVisual = createEnemyVisual(role);
  const spawnScale = (0.82 + Math.random() * 0.2) * 3;
  const baseHitRadius = role === "tank" ? 2.2 : role === "scout" ? 1.5 : 1.8;
  const stagePowerMultiplier = Math.pow(1.1, Math.max(0, state.stage - 1));
  const baseHp = 37 * stats.hpMul * ENEMY_HP_MULTIPLIER;
  const baseDamage = 11.5 * stats.damageMul;
  const enemy = {
    hp: baseHp * stagePowerMultiplier,
    maxHp: baseHp * stagePowerMultiplier,
    speed: (3.5 + state.stage * 0.22) * stats.speedMul,
    damage: baseDamage * stagePowerMultiplier,
    shootCooldown: 1.2 + Math.random() * 0.9,
    role,
    mesh: enemyVisual.mesh,
    mixer: enemyVisual.mixer,
    actions: enemyVisual.actions,
    animState: null,
    shootAnimTimer: 0,
    hitRadius: baseHitRadius * spawnScale,
  };

  enemy.mesh.scale.multiplyScalar(spawnScale);
  enemy.mesh.position.set(x, 0, z);
  setEnemyAnim(enemy, "idle", 0.01);
  scene.add(enemy.mesh);
  state.enemies.push(enemy);
}

function nextSpawnDelay() {
  const base = Math.max(0.42, state.spawnInterval);
  return base * (0.55 + Math.random() * 1.25);
}

function isBossStage(stage) {
  return stage > 0 && stage % BOSS_STAGE_INTERVAL === 0;
}

function getBossArchetypeForStage(stage) {
  const bossIndex = Math.max(0, Math.floor(stage / BOSS_STAGE_INTERVAL) - 1);
  return BOSS_ARCHETYPES[bossIndex % BOSS_ARCHETYPES.length];
}

function spawnMinionNearBoss(boss) {
  const role = Math.random() > 0.5 ? "scout" : "assault";
  const roleStats = {
    scout: { hpMul: 0.82, speedMul: 1.25, damageMul: 0.88 },
    assault: { hpMul: 1, speedMul: 1, damageMul: 1 },
  };
  const stats = roleStats[role];

  const angle = Math.random() * Math.PI * 2;
  const radius = 5 + Math.random() * 4;
  const x = boss.mesh.position.x + Math.cos(angle) * radius;
  const z = boss.mesh.position.z + Math.sin(angle) * radius;

  const enemyVisual = createEnemyVisual(role);
  const spawnScale = (0.72 + Math.random() * 0.16) * 2.35;
  const baseHitRadius = role === "scout" ? 1.5 : 1.8;
  const stagePowerMultiplier = Math.pow(1.1, Math.max(0, state.stage - 1));
  const minionPower = 0.58;
  const baseHp = 37 * stats.hpMul * ENEMY_HP_MULTIPLIER;
  const baseDamage = 11.5 * stats.damageMul;

  const enemy = {
    hp: baseHp * stagePowerMultiplier * minionPower,
    maxHp: baseHp * stagePowerMultiplier * minionPower,
    speed: (3.5 + state.stage * 0.22) * stats.speedMul * 1.1,
    damage: baseDamage * stagePowerMultiplier * minionPower,
    shootCooldown: 0.8 + Math.random() * 0.7,
    role,
    mesh: enemyVisual.mesh,
    mixer: enemyVisual.mixer,
    actions: enemyVisual.actions,
    animState: null,
    shootAnimTimer: 0,
    hitRadius: baseHitRadius * spawnScale,
  };

  enemy.mesh.scale.multiplyScalar(spawnScale);
  enemy.mesh.position.set(clamp(x, -76, 76), 0, clamp(z, -76, 76));
  setEnemyAnim(enemy, "idle", 0.01);
  scene.add(enemy.mesh);
  state.enemies.push(enemy);
}

function spawnBoss() {
  const archetype = getBossArchetypeForStage(state.stage);
  const role = archetype.role;
  const stats = { hpMul: archetype.hpMul, speedMul: archetype.speedMul, damageMul: archetype.damageMul };
  const enemyVisual = createEnemyVisual(role);
  const spawnScale = archetype.scale;
  const stagePowerMultiplier = Math.pow(1.1, Math.max(0, state.stage - 1));
  const bossHp = 420 * stagePowerMultiplier * ENEMY_HP_MULTIPLIER * stats.hpMul;
  const bossDamage = 28 * stagePowerMultiplier * stats.damageMul;

  const boss = {
    hp: bossHp,
    maxHp: bossHp,
    speed: 2.6 * stats.speedMul,
    damage: bossDamage,
    shootCooldown: 0.75,
    role,
    isBoss: true,
    bossType: archetype.id,
    bossName: archetype.name,
    mesh: enemyVisual.mesh,
    mixer: enemyVisual.mixer,
    actions: enemyVisual.actions,
    animState: null,
    shootAnimTimer: 0,
    hitRadius: archetype.hitRadius,
    abilityCooldownA: 2.6,
    abilityCooldownB: 4.2,
    burstShots: 0,
  };

  boss.mesh.scale.multiplyScalar(spawnScale);
  const side = Math.floor(Math.random() * 4);
  if (side === 0) boss.mesh.position.set(rand(-35, 35), 0, -68);
  else if (side === 1) boss.mesh.position.set(68, 0, rand(-35, 35));
  else if (side === 2) boss.mesh.position.set(rand(-35, 35), 0, 68);
  else boss.mesh.position.set(-68, 0, rand(-35, 35));

  setEnemyAnim(boss, "idle", 0.01);
  scene.add(boss.mesh);
  state.enemies.push(boss);

  return archetype;
}

function spawnBullet(origin, direction, speed, damage, fromEnemy = false) {
  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: fromEnemy ? 0xff6f6f : 0x8ee8ff })
  );
  bulletMesh.position.copy(origin);
  scene.add(bulletMesh);

  const bullet = {
    mesh: bulletMesh,
    velocity: direction.clone().multiplyScalar(speed),
    damage,
    life: 2.6,
  };

  if (fromEnemy) {
    state.enemyBullets.push(bullet);
  } else {
    state.bullets.push(bullet);
  }
}

function spawnExplosion(position, radius = 2.4) {
  const explosion = {
    life: 0.72,
    maxLife: 0.72,
    sparks: [],
    shockwave: null,
    light: null,
  };

  const shockwave = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.58, 36),
    new THREE.MeshBasicMaterial({
      color: 0xffb15d,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  shockwave.position.copy(position);
  shockwave.position.y += 0.15;
  shockwave.rotation.x = -Math.PI / 2;
  shockwave.scale.setScalar(Math.max(1.15, radius * 0.72));
  scene.add(shockwave);
  explosion.shockwave = shockwave;

  const light = new THREE.PointLight(0xffb35e, 4.4, 24 + radius * 4.6, 2);
  light.position.copy(position);
  light.position.y += 1.3;
  scene.add(light);
  explosion.light = light;

  const sparkCount = Math.floor(30 + radius * 9);
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 + Math.random() * 0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color: Math.random() > 0.45 ? 0xffd27a : 0xff7f4a,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    );
    spark.position.copy(position);
    spark.position.y += 1.1;
    scene.add(spark);

    const angle = Math.random() * Math.PI * 2;
    const spread = (1 + Math.random() * 1.8) * radius;
    const up = 2.8 + Math.random() * 4.4;
    explosion.sparks.push({
      mesh: spark,
      vx: Math.cos(angle) * spread,
      vy: up,
      vz: Math.sin(angle) * spread,
      drag: 1.2 + Math.random() * 1.4,
    });
  }

  state.explosions.push(explosion);
  playExplosionSound();
}

function updateExplosions(delta) {
  for (let i = state.explosions.length - 1; i >= 0; i -= 1) {
    const explosion = state.explosions[i];
    explosion.life -= delta;
    const t = 1 - Math.max(0, explosion.life) / explosion.maxLife;

    if (explosion.shockwave) {
      const scale = 1 + t * 11;
      explosion.shockwave.scale.set(scale, scale, 1);
      explosion.shockwave.material.opacity = Math.max(0, 0.98 - t * 1.2);
    }

    if (explosion.light) {
      explosion.light.intensity = Math.max(0, 4.8 * (1 - t));
    }

    for (const spark of explosion.sparks) {
      spark.vy -= 7.8 * delta;
      spark.vx *= Math.max(0, 1 - spark.drag * delta * 0.35);
      spark.vz *= Math.max(0, 1 - spark.drag * delta * 0.35);
      spark.mesh.position.x += spark.vx * delta;
      spark.mesh.position.y += spark.vy * delta;
      spark.mesh.position.z += spark.vz * delta;
      spark.mesh.material.opacity = Math.max(0, 0.98 - t * 1.05);
      spark.mesh.scale.setScalar(1.15 - t * 0.75);
    }

    if (explosion.life <= 0) {
      if (explosion.shockwave) {
        scene.remove(explosion.shockwave);
      }
      if (explosion.light) {
        scene.remove(explosion.light);
      }
      for (const spark of explosion.sparks) {
        scene.remove(spark.mesh);
      }
      state.explosions.splice(i, 1);
    }
  }
}

function defeatEnemy(enemy, index, scoreReward) {
  if (enemy.mixer) {
    enemy.mixer.stopAllAction();
  }
  spawnExplosion(enemy.mesh.position, Math.max(3, (enemy.hitRadius || 2.2) * 0.95));
  scene.remove(enemy.mesh);
  state.enemies.splice(index, 1);
  state.kills += 1;
  state.score += enemy.isBoss ? Math.max(scoreReward, 340 + state.stage * 30) : scoreReward;
  if (enemy.isBoss) {
    state.bossDefeated = true;
  }
}

function firePlayer() {
  if (state.player.fireCooldown > 0 || !state.running) return;

  const origin = playerMesh.position.clone();
  origin.y = 2.6;
  const dir = state.player.facing.clone();
  dir.y = 0;
  dir.normalize();

  spawnBullet(origin, dir, 24, state.player.damage, false);
  playPlayerShotSound();
  triggerPlayerShootAnim();
  state.player.fireCooldown = state.player.fireRate;
}

function triggerDash() {
  if (state.player.dashCooldown > 0 || !state.running) return;
  const moveDir = getMoveDirection();
  if (moveDir.lengthSq() === 0) {
    moveDir.copy(state.player.facing);
  }
  moveDir.normalize();
  playerMesh.position.addScaledVector(moveDir, 7.5);
  playerMesh.position.x = clamp(playerMesh.position.x, -38, 38);
  playerMesh.position.z = clamp(playerMesh.position.z, -38, 38);
  state.player.dashCooldown = 4.0;
}

function triggerShield() {
  if (state.player.shieldCooldown > 0 || !state.running) return;
  state.player.shieldTime = 4.5;
  state.player.shieldCooldown = 9.0;
}

function triggerUltimate() {
  if (state.player.ultimateCooldown > 0 || !state.running) return;

  const center = playerMesh.position;
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const d = enemy.mesh.position.distanceTo(center);
    if (d <= 12) {
      enemy.hp -= 80 + state.stage * 4;
      if (enemy.hp <= 0) {
        defeatEnemy(enemy, i, 35);
      }
    }
  }

  state.player.ultimateCooldown = 15;
}

function applyDeadzone(value, deadzone = GAMEPAD_DEADZONE) {
  if (Math.abs(value) < deadzone) return 0;
  return (Math.abs(value) - deadzone) / (1 - deadzone) * Math.sign(value);
}

function getActiveGamepad() {
  if (!navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (pad && pad.connected) {
      return pad;
    }
  }
  return null;
}

function sampleGamepadInput(delta) {
  const input = {
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    hasAim: false,
    wantsShoot: false,
    wantsDash: false,
    wantsShield: false,
    wantsUltimate: false,
  };

  const pad = getActiveGamepad();
  if (!pad) {
    state.gamepad.previous.shoot = false;
    state.gamepad.previous.dash = false;
    state.gamepad.previous.shield = false;
    state.gamepad.previous.ultimate = false;
    return input;
  }

  const leftX = applyDeadzone(pad.axes[0] || 0);
  const leftY = applyDeadzone(pad.axes[1] || 0);
  const rightX = applyDeadzone(pad.axes[2] || 0);
  const rightY = applyDeadzone(pad.axes[3] || 0);
  const lt = pad.buttons[6]?.value || 0;
  const rt = pad.buttons[7]?.value || 0;

  input.moveX = leftX;
  input.moveY = leftY;

  const aimMode = lt > 0.35;
  if (aimMode && (Math.abs(rightX) > 0.01 || Math.abs(rightY) > 0.01)) {
    input.aimX = rightX;
    input.aimY = rightY;
    input.hasAim = true;
  } else if (!aimMode) {
    state.camera.yaw += rightX * delta * 2.3;
    state.camera.pitch = THREE.MathUtils.clamp(
      state.camera.pitch + rightY * delta * 1.8,
      state.camera.minPitch,
      state.camera.maxPitch
    );
  }

  const zoomOut = pad.buttons[4]?.pressed;
  const zoomIn = pad.buttons[5]?.pressed;
  if (zoomOut || zoomIn) {
    const zoomDir = (zoomOut ? 1 : 0) + (zoomIn ? -1 : 0);
    state.camera.distance = THREE.MathUtils.clamp(
      state.camera.distance + zoomDir * delta * 18,
      state.camera.minDistance,
      state.camera.maxDistance
    );
  }

  const shootHeld = rt > 0.55;
  const dashHeld = !!pad.buttons[0]?.pressed;
  const shieldHeld = !!pad.buttons[2]?.pressed;
  const ultimateHeld = !!pad.buttons[3]?.pressed;

  input.wantsShoot = shootHeld && !state.gamepad.previous.shoot;
  input.wantsDash = dashHeld && !state.gamepad.previous.dash;
  input.wantsShield = shieldHeld && !state.gamepad.previous.shield;
  input.wantsUltimate = ultimateHeld && !state.gamepad.previous.ultimate;

  state.gamepad.previous.shoot = shootHeld;
  state.gamepad.previous.dash = dashHeld;
  state.gamepad.previous.shield = shieldHeld;
  state.gamepad.previous.ultimate = ultimateHeld;

  return input;
}

function getMoveDirection(gamepadInput) {
  const dir = new THREE.Vector3();
  const forward = state.keys.has("KeyW") || state.keys.has("ArrowUp");
  const backward = state.keys.has("KeyS") || state.keys.has("ArrowDown");
  const left = state.keys.has("KeyA") || state.keys.has("ArrowLeft");
  const right = state.keys.has("KeyD") || state.keys.has("ArrowRight");

  const axisX = (right ? 1 : 0) - (left ? 1 : 0) + (gamepadInput?.moveX || 0);
  const axisY = (backward ? 1 : 0) - (forward ? 1 : 0) + (gamepadInput?.moveY || 0);

  if (Math.abs(axisX) < 0.001 && Math.abs(axisY) < 0.001) {
    return dir;
  }

  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  if (cameraForward.lengthSq() < 0.0001) {
    cameraForward.set(0, 0, -1);
  }
  cameraForward.normalize();
  cameraRight.set(-cameraForward.z, 0, cameraForward.x);

  dir.addScaledVector(cameraRight, axisX);
  dir.addScaledVector(cameraForward, -axisY);

  return dir;
}

function updateAimFromMouse() {
  raycaster.setFromCamera(state.screenMouse, camera);
  const hitPoint = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
    return;
  }

  tempVec.copy(hitPoint).sub(playerMesh.position);
  tempVec.y = 0;
  if (tempVec.lengthSq() <= 0.001) {
    return;
  }

  tempVec.normalize();
  state.player.facing.copy(tempVec);
  playerMesh.rotation.y = Math.atan2(tempVec.x, tempVec.z);
}

function updateAimFromGamepad(gamepadInput) {
  if (!gamepadInput.hasAim) return false;

  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  if (cameraForward.lengthSq() < 0.0001) {
    cameraForward.set(0, 0, -1);
  }
  cameraForward.normalize();
  cameraRight.set(-cameraForward.z, 0, cameraForward.x);

  tempVec.copy(cameraRight).multiplyScalar(gamepadInput.aimX);
  tempVec.addScaledVector(cameraForward, -gamepadInput.aimY);
  tempVec.y = 0;

  if (tempVec.lengthSq() <= 0.0001) return false;

  tempVec.normalize();
  state.player.facing.copy(tempVec);
  playerMesh.rotation.y = Math.atan2(tempVec.x, tempVec.z);
  return true;
}

function updatePlayer(delta) {
  const gamepadInput = sampleGamepadInput(delta);

  if (gamepadInput.wantsDash) {
    triggerDash();
  }
  if (gamepadInput.wantsShield) {
    triggerShield();
  }
  if (gamepadInput.wantsUltimate) {
    triggerUltimate();
  }

  const moveDir = getMoveDirection(gamepadInput);
  const moving = moveDir.lengthSq() > 0;
  if (moving) {
    moveDir.normalize();
    playerMesh.position.addScaledVector(moveDir, state.player.speed * delta);
  }

  playerMesh.position.x = clamp(playerMesh.position.x, -40, 40);
  playerMesh.position.z = clamp(playerMesh.position.z, -40, 40);

  const usedGamepadAim = updateAimFromGamepad(gamepadInput);
  if (!usedGamepadAim) {
    updateAimFromMouse();
  }

  if (gamepadInput.wantsShoot) {
    firePlayer();
  }

  const playerAnim = playerMesh.userData.playerAnim;
  if (playerAnim && playerAnim.mixer) {
    playerAnim.mixer.update(delta);
    state.playerShootAnimTimer = Math.max(0, state.playerShootAnimTimer - delta);
    if (state.playerShootAnimTimer <= 0) {
      setPlayerAnimState(moving ? "move" : "idle");
    }
  }

  state.player.fireCooldown = Math.max(0, state.player.fireCooldown - delta);
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - delta);
  state.player.shieldCooldown = Math.max(0, state.player.shieldCooldown - delta);
  state.player.ultimateCooldown = Math.max(0, state.player.ultimateCooldown - delta);
  state.player.shieldTime = Math.max(0, state.player.shieldTime - delta);

  shieldSphere.visible = state.player.shieldTime > 0;
  shieldSphere.material.opacity = 0.16 + Math.sin(performance.now() * 0.01) * 0.06;

  const heroVisuals = playerMesh.userData.heroVisuals;
  if (heroVisuals) {
    const t = performance.now() * 0.001;
    const pulse = 0.65 + Math.sin(t * 6) * 0.35;
    heroVisuals.visorMaterial.emissiveIntensity = 0.9 + pulse * 0.8;
    heroVisuals.chestCoreMaterial.emissiveIntensity = 1 + pulse * 1.2;
    heroVisuals.baseRingMaterial.emissiveIntensity = 0.6 + pulse * 0.8;
    heroVisuals.backpackMaterial.emissiveIntensity = 0.45 + pulse * 0.35;
    heroVisuals.thrusterMaterial.emissiveIntensity = 0.8 + pulse * 0.8;
    heroVisuals.faceStripMaterial.emissiveIntensity = 0.8 + pulse * 0.55;
    heroVisuals.kneeGlowMaterial.emissiveIntensity = 0.55 + pulse * 0.35;
    heroVisuals.jetGlowMaterial.opacity = 0.45 + pulse * 0.5;

    const moveAmp = moving ? 1 : 0.25;
    const swing = Math.sin(t * 9) * 0.28 * moveAmp;
    const bob = Math.sin(t * 9) * 0.06 * moveAmp;
    const shoulderTilt = Math.sin(t * 4) * 0.06;

    heroVisuals.armL.rotation.x = swing;
    heroVisuals.armR.rotation.x = -swing;
    heroVisuals.legL.rotation.x = -swing * 0.8;
    heroVisuals.legR.rotation.x = swing * 0.8;
    heroVisuals.shoulderL.rotation.z = 0.03 + shoulderTilt;
    heroVisuals.shoulderR.rotation.z = -0.03 - shoulderTilt;
    heroVisuals.crest.rotation.z = Math.sin(t * 3) * 0.05;
    heroVisuals.body.position.y = 2.2 + bob;
    heroVisuals.jetGlowL.scale.y = 0.85 + pulse * 0.45;
    heroVisuals.jetGlowR.scale.y = 0.85 + pulse * 0.45;
  }
}

function damagePlayer(amount) {
  if (!state.running) return;
  let damage = amount;
  if (state.player.shieldTime > 0) {
    damage *= 0.35;
  }
  state.player.hp -= damage;
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.running = false;
    setOverlay(true, "Game Over", `הפסדת. ניקוד סופי: ${Math.floor(state.score)}`);
  }
}

function updateEnemies(delta) {
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    if (enemy.mixer) {
      enemy.mixer.update(delta);
    }
    const toPlayer = tempVec.copy(playerMesh.position).sub(enemy.mesh.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist > 0.1) {
      toPlayer.normalize();
      enemy.mesh.position.addScaledVector(toPlayer, enemy.speed * delta);
      enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    const isMoving = dist > 2.4;
    enemy.shootAnimTimer = Math.max(0, enemy.shootAnimTimer - delta);
    if (enemy.shootAnimTimer <= 0) {
      setEnemyAnim(enemy, isMoving ? "move" : "idle");
    }

    if (dist < 2.2) {
      damagePlayer(enemy.damage * delta);
    }

    if (enemy.isBoss) {
      enemy.abilityCooldownA = Math.max(0, (enemy.abilityCooldownA ?? 0) - delta);
      enemy.abilityCooldownB = Math.max(0, (enemy.abilityCooldownB ?? 0) - delta);

      if (enemy.bossType === "juggernaut") {
        if (enemy.abilityCooldownA <= 0) {
          spawnExplosion(enemy.mesh.position, 4.2);
          const shockwaveRange = 12;
          if (dist <= shockwaveRange) {
            const falloff = 1 - dist / shockwaveRange;
            damagePlayer(enemy.damage * (0.32 + falloff * 0.28));
          }
          enemy.abilityCooldownA = 4.8;
        }
      } else if (enemy.bossType === "sniper") {
        if (enemy.abilityCooldownA <= 0 && dist < 55) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 18 + Math.random() * 12;
          enemy.mesh.position.set(
            clamp(playerMesh.position.x + Math.cos(angle) * radius, -74, 74),
            0,
            clamp(playerMesh.position.z + Math.sin(angle) * radius, -74, 74)
          );
          enemy.abilityCooldownA = 6.6;
          spawnExplosion(enemy.mesh.position, 2.4);
        }

        if (enemy.burstShots > 0 && enemy.shootCooldown <= 0 && dist < 34) {
          enemy.shootCooldown = 0.18;
        }
      } else if (enemy.bossType === "summoner") {
        if (enemy.abilityCooldownA <= 0) {
          spawnMinionNearBoss(enemy);
          spawnMinionNearBoss(enemy);
          enemy.abilityCooldownA = 7.8;
          spawnExplosion(enemy.mesh.position, 2.8);
        }

        if (enemy.abilityCooldownB <= 0 && dist <= 22) {
          damagePlayer(enemy.damage * 0.22);
          enemy.abilityCooldownB = 2.8;
        }
      }
    }

    enemy.shootCooldown -= delta;
    if (enemy.shootCooldown <= 0 && dist < 30) {
      const origin = enemy.mesh.position.clone();
      origin.y = 2.4;
      const shotDir = playerMesh.position.clone().sub(enemy.mesh.position).setY(0).normalize();
      spawnBullet(origin, shotDir, 13, enemy.damage, true);
      playEnemyShotSound();
      enemy.shootAnimTimer = 0.26;
      setEnemyAnim(enemy, "shoot", 0.08);
      if (enemy.isBoss && enemy.bossType === "sniper") {
        if (enemy.burstShots <= 0) {
          enemy.burstShots = 2;
          enemy.shootCooldown = 0.2;
        } else {
          enemy.burstShots -= 1;
          enemy.shootCooldown = enemy.burstShots > 0 ? 0.22 : 1.05 + Math.random() * 0.65;
        }
      } else {
        enemy.shootCooldown = enemy.isBoss ? 0.85 + Math.random() * 0.5 : 1.2 + Math.random() * 1.1;
      }
    }
  }
}

function updateBullets(array, delta, isEnemy) {
  const playerHitRadius = 1.9;

  for (let i = array.length - 1; i >= 0; i -= 1) {
    const bullet = array[i];
    const prevX = bullet.mesh.position.x;
    const prevZ = bullet.mesh.position.z;

    bullet.mesh.position.addScaledVector(bullet.velocity, delta);
    const nextX = bullet.mesh.position.x;
    const nextZ = bullet.mesh.position.z;
    bullet.life -= delta;

    if (bullet.life <= 0) {
      scene.remove(bullet.mesh);
      array.splice(i, 1);
      continue;
    }

    if (isEnemy) {
      const hitDistSq = distancePointToSegmentSq2D(
        playerMesh.position.x,
        playerMesh.position.z,
        prevX,
        prevZ,
        nextX,
        nextZ
      );
      if (hitDistSq <= playerHitRadius * playerHitRadius) {
        damagePlayer(bullet.damage);
        scene.remove(bullet.mesh);
        array.splice(i, 1);
      }
      continue;
    }

    let hit = false;
    for (let e = state.enemies.length - 1; e >= 0; e -= 1) {
      const enemy = state.enemies[e];
      const enemyHitRadius = Math.max(1.4, enemy.hitRadius || 2.2);
      const hitDistSq = distancePointToSegmentSq2D(
        enemy.mesh.position.x,
        enemy.mesh.position.z,
        prevX,
        prevZ,
        nextX,
        nextZ
      );
      if (hitDistSq <= enemyHitRadius * enemyHitRadius) {
        playEnemyHitSound();
        enemy.hp -= bullet.damage;
        hit = true;
        if (enemy.hp <= 0) {
          defeatEnemy(enemy, e, 20 + state.stage * 2);
        }
        break;
      }
    }

    if (hit) {
      scene.remove(bullet.mesh);
      array.splice(i, 1);
    }
  }
}

function advanceStageIfNeeded() {
  if (isBossStage(state.stage)) {
    if (!state.bossSpawned) {
      const archetype = spawnBoss();
      state.bossSpawned = true;
      state.bossDefeated = false;
      setOverlay(true, `BOSS STAGE ${state.stage}`, archetype?.intro || "בוס חזק מאוד נכנס לקרב!");
      setTimeout(() => {
        if (state.running) {
          setOverlay(false);
        }
      }, 1200);
    }

    if (!state.bossDefeated) return;

    state.stage += 1;
    state.kills = 0;
    state.stageGoal += 4;
    state.spawnInterval = Math.max(0.55, state.spawnInterval * 0.91);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 32);
    state.bossSpawned = false;
    state.bossDefeated = false;

    setOverlay(true, `Stage ${state.stage}`, "הבוס חוסל! גל חדש התחיל");
    setTimeout(() => {
      if (state.running) {
        setOverlay(false);
      }
    }, 1200);
    return;
  }

  if (state.kills < state.stageGoal) return;

  state.stage += 1;
  state.kills = 0;
  state.stageGoal += 4;
  state.spawnInterval = Math.max(0.55, state.spawnInterval * 0.91);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 22);
  state.bossSpawned = false;
  state.bossDefeated = false;

  setOverlay(true, isBossStage(state.stage) ? `Stage ${state.stage}` : `Stage ${state.stage}`, isBossStage(state.stage) ? "שלב בוס בקרוב" : "גל חדש התחיל");
  setTimeout(() => {
    if (state.running) {
      setOverlay(false);
    }
  }, 1000);
}

function updateCamera(delta) {
  const target = playerMesh.position;
  const horizontalDistance = Math.cos(state.camera.pitch) * state.camera.distance;
  const offsetX = Math.sin(state.camera.yaw) * horizontalDistance;
  const offsetZ = Math.cos(state.camera.yaw) * horizontalDistance;
  const offsetY = Math.sin(state.camera.pitch) * state.camera.distance + 4;
  const camTarget = new THREE.Vector3(target.x + offsetX, target.y + offsetY, target.z + offsetZ);
  camera.position.lerp(camTarget, 1 - Math.exp(-6 * delta));
  camera.lookAt(target.x, 2.2, target.z);
}

function clearEntities() {
  for (const enemy of state.enemies) {
    if (enemy.mixer) {
      enemy.mixer.stopAllAction();
    }
    scene.remove(enemy.mesh);
  }
  for (const bullet of state.bullets) {
    scene.remove(bullet.mesh);
  }
  for (const bullet of state.enemyBullets) {
    scene.remove(bullet.mesh);
  }
  for (const explosion of state.explosions) {
    if (explosion.shockwave) {
      scene.remove(explosion.shockwave);
    }
    if (explosion.light) {
      scene.remove(explosion.light);
    }
    for (const spark of explosion.sparks) {
      scene.remove(spark.mesh);
    }
  }
  state.enemies.length = 0;
  state.bullets.length = 0;
  state.enemyBullets.length = 0;
  state.explosions.length = 0;
}

function resetGame() {
  clearEntities();
  state.running = true;
  state.score = 0;
  state.stage = 1;
  state.kills = 0;
  state.stageGoal = 8;
  state.spawnInterval = 1.8;
  state.spawnTimer = nextSpawnDelay();
  state.bossSpawned = false;
  state.bossDefeated = false;

  setClass(state.player.classId);
  playerMesh.position.set(0, 0, 0);
  state.player.fireCooldown = 0;
  state.player.dashCooldown = 0;
  state.player.shieldCooldown = 0;
  state.player.shieldTime = 0;
  state.player.ultimateCooldown = 0;

  setOverlay(false);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.033, clock.getDelta());

  if (state.running) {
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(state.bullets, delta, false);
    updateBullets(state.enemyBullets, delta, true);

    if (!isBossStage(state.stage)) {
      state.spawnTimer -= delta;
      if (state.spawnTimer <= 0) {
        const maxEnemies = 6 + state.stage * 2;
        if (state.enemies.length < maxEnemies) {
          spawnEnemy();
        }
        state.spawnTimer = nextSpawnDelay();
      }
    }

    advanceStageIfNeeded();
  }

  updateExplosions(delta);

  updateCamera(delta);
  updateHud();
  renderer.render(scene, camera);
}

window.addEventListener("resize", resizeRenderer);

document.addEventListener("keydown", (event) => {
  state.keys.add(event.code);

  if (!event.repeat && (event.code === "Space" || event.code === "KeyF")) {
    firePlayer();
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    triggerDash();
  }
  if (event.code === "KeyE") {
    triggerShield();
  }
  if (event.code === "KeyQ") {
    triggerUltimate();
  }
});

document.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
});

document.addEventListener("mousemove", (event) => {
  const rect = dom.canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.screenMouse.set(x, y);

  if (!state.camera.orbiting) {
    return;
  }

  const deltaX = event.clientX - state.camera.lastMouseX;
  const deltaY = event.clientY - state.camera.lastMouseY;
  state.camera.lastMouseX = event.clientX;
  state.camera.lastMouseY = event.clientY;

  state.camera.yaw -= deltaX * 0.0055;
  state.camera.pitch = THREE.MathUtils.clamp(
    state.camera.pitch - deltaY * 0.004,
    state.camera.minPitch,
    state.camera.maxPitch
  );
});

document.addEventListener("mousedown", (event) => {
  ensureAudio();
  if (event.button === 0) {
    firePlayer();
  }
  if (event.button === 2) {
    state.camera.orbiting = true;
    state.camera.lastMouseX = event.clientX;
    state.camera.lastMouseY = event.clientY;
  }
});

document.addEventListener("mouseup", (event) => {
  if (event.button === 2) {
    state.camera.orbiting = false;
  }
});

dom.canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("wheel", (event) => {
  const rect = dom.canvas.getBoundingClientRect();
  const insideCanvas = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!insideCanvas) {
    return;
  }

  event.preventDefault();
  state.camera.distance = THREE.MathUtils.clamp(
    state.camera.distance + event.deltaY * 0.01,
    state.camera.minDistance,
    state.camera.maxDistance
  );
}, { passive: false });

window.addEventListener("blur", () => {
  state.camera.orbiting = false;
});

document.addEventListener("keydown", () => {
  ensureAudio();
}, { once: true });

if (dom.classSelect) {
  dom.classSelect.addEventListener("change", (event) => {
    setClass(event.target.value);
  });
}

if (dom.restartBtn) {
  dom.restartBtn.addEventListener("click", resetGame);
}

if (dom.fullscreenBtn) {
  dom.fullscreenBtn.addEventListener("click", toggleFullscreen);
}

document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

if (dom.overlayBtn) {
  dom.overlayBtn.addEventListener("click", resetGame);
}

setClass("assault");
resizeRenderer();
updateFullscreenButtonLabel();
state.spawnTimer = nextSpawnDelay();
loadEnemyTemplates();
addCityEnvironment();
setOverlay(true, "Robot Siege 3D", "עיר Poly Haven נטענה • שליטה ידנית מלאה • WASD/חצים לתנועה • עכבר לכיוון • קליק שמאלי/Space/F לירי • קליק ימני+גרירה למצלמה • שלט: סטיק שמאלי תנועה, סטיק ימני מצלמה, LT+סטיק ימני כיוון, RT ירי");
setTimeout(() => {
  if (state.running) {
    setOverlay(false);
  }
}, 1600);
animate();
