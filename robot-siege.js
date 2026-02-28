const dom = {
  canvas: document.getElementById("robotCanvas"),
  score: document.getElementById("rsScore"),
  health: document.getElementById("rsHealth"),
  stage: document.getElementById("rsStage"),
  weapon: document.getElementById("rsWeapon"),
  enemies: document.getElementById("rsEnemies"),
  restartBtn: document.getElementById("rsRestartBtn"),
  overlay: document.getElementById("rsOverlay"),
  overlayTitle: document.getElementById("rsOverlayTitle"),
  overlayText: document.getElementById("rsOverlayText"),
  overlayBtn: document.getElementById("rsOverlayBtn"),
};

if (!dom.canvas) {
  throw new Error("Missing robot canvas");
}

const ctx = dom.canvas.getContext("2d", { alpha: true });
const WIDTH = dom.canvas.width;
const HEIGHT = dom.canvas.height;

const keys = new Set();
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

const WEAPONS = [
  { name: "Pulse Pistol", fireRate: 260, speed: 11, damage: 16, spread: 0.02, pellets: 1, color: "#ffe48a" },
  { name: "Assault Core", fireRate: 140, speed: 13, damage: 13, spread: 0.03, pellets: 1, color: "#9ff3ff" },
  { name: "Scatter Cannon", fireRate: 520, speed: 10.5, damage: 10, spread: 0.27, pellets: 6, color: "#ffd4a1" },
  { name: "Pulse Cannon", fireRate: 320, speed: 12, damage: 24, spread: 0.05, pellets: 2, color: "#d3a2ff" },
  { name: "Omega Blaster", fireRate: 100, speed: 14, damage: 18, spread: 0.06, pellets: 2, color: "#9dffb5" },
];

const state = {
  running: true,
  score: 0,
  stage: 1,
  kills: 0,
  stageGoal: 10,
  enemiesSpawned: 0,
  stageCleared: false,
  player: {
    x: WIDTH / 2,
    y: HEIGHT * 0.76,
    radius: 18,
    speed: 4.9,
    hp: 100,
    maxHp: 100,
    fireCooldown: 0,
    weaponIndex: 0,
  },
  enemies: [],
  bullets: [],
  enemyBullets: [],
  particles: [],
  boss: null,
  spawnCooldown: 0,
  stageBannerTimer: 1200,
};

let lastTime = performance.now();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function isBossStage(stage) {
  return stage % 4 === 0;
}

function getWeaponForStage(stage) {
  return Math.min(WEAPONS.length - 1, Math.floor((stage - 1) / 2));
}

function updateHud() {
  dom.score.textContent = Math.floor(state.score);
  dom.health.textContent = Math.max(0, Math.floor(state.player.hp));
  dom.stage.textContent = state.stage;
  dom.weapon.textContent = WEAPONS[state.player.weaponIndex].name;
  dom.enemies.textContent = state.enemies.length + (state.boss ? 1 : 0);
}

function showOverlay(title, text) {
  dom.overlayTitle.textContent = title;
  dom.overlayText.textContent = text;
  dom.overlay.classList.remove("hidden");
}

function hideOverlay() {
  dom.overlay.classList.add("hidden");
}

function addParticles(x, y, color, count, speed = 2) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const force = rand(0.4, speed);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      life: rand(22, 55),
      maxLife: 55,
      size: rand(1.3, 3.5),
      color,
    });
  }
}

function spawnEnemy() {
  const stage = state.stage;
  const side = Math.floor(Math.random() * 4);
  const edgePadding = 40;

  let x = rand(edgePadding, WIDTH - edgePadding);
  let y = rand(edgePadding, HEIGHT - edgePadding);

  if (side === 0) y = -30;
  if (side === 1) x = WIDTH + 30;
  if (side === 2) y = HEIGHT + 30;
  if (side === 3) x = -30;

  const typeRoll = Math.random();
  let type = "scout";
  if (typeRoll > 0.72) type = "tank";
  if (typeRoll > 0.9) type = "sniper";

  const baseScale = 1 + (stage - 1) * 0.11;
  if (type === "scout") {
    state.enemies.push({
      type,
      x,
      y,
      radius: 14,
      speed: 1.6 + stage * 0.05,
      hp: 28 * baseScale,
      maxHp: 28 * baseScale,
      shootCooldown: rand(900, 1450),
      color: "#7ad9ff",
      score: 18,
      bulletSpeed: 6,
      bulletDamage: 9 * baseScale,
    });
  } else if (type === "tank") {
    state.enemies.push({
      type,
      x,
      y,
      radius: 20,
      speed: 0.9 + stage * 0.02,
      hp: 75 * baseScale,
      maxHp: 75 * baseScale,
      shootCooldown: rand(1200, 1800),
      color: "#ffab6f",
      score: 34,
      bulletSpeed: 5,
      bulletDamage: 13 * baseScale,
    });
  } else {
    state.enemies.push({
      type,
      x,
      y,
      radius: 16,
      speed: 1.2 + stage * 0.03,
      hp: 42 * baseScale,
      maxHp: 42 * baseScale,
      shootCooldown: rand(680, 1100),
      color: "#d2a3ff",
      score: 28,
      bulletSpeed: 8,
      bulletDamage: 11 * baseScale,
    });
  }

  state.enemiesSpawned += 1;
}

function spawnBoss() {
  const stageScale = 1 + state.stage * 0.16;
  const hp = 550 * stageScale;
  state.boss = {
    x: WIDTH / 2,
    y: 110,
    radius: 50,
    hp,
    maxHp: hp,
    speed: 1.4,
    shootCooldown: 980,
    burst: 0,
    name: "MECHA TYRANT",
  };
}

function firePlayer() {
  if (!state.running) return;
  const player = state.player;
  if (player.fireCooldown > 0) return;

  const weapon = WEAPONS[player.weaponIndex];
  const baseAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  for (let i = 0; i < weapon.pellets; i += 1) {
    const spread = (Math.random() - 0.5) * weapon.spread;
    const angle = baseAngle + spread;
    state.bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * weapon.speed,
      vy: Math.sin(angle) * weapon.speed,
      damage: weapon.damage,
      life: 74,
      radius: weapon.pellets > 1 ? 3.2 : 3.6,
      color: weapon.color,
    });
  }

  player.fireCooldown = weapon.fireRate;
  addParticles(player.x, player.y, weapon.color, 5, 1.8);
}

function fireEnemy(enemy, tx, ty) {
  const angle = Math.atan2(ty - enemy.y, tx - enemy.x);
  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * enemy.bulletSpeed,
    vy: Math.sin(angle) * enemy.bulletSpeed,
    damage: enemy.bulletDamage,
    life: 120,
    radius: enemy.type === "tank" ? 5.3 : 4,
    color: enemy.type === "tank" ? "#ff7f50" : "#ff6688",
  });
}

function takePlayerDamage(amount) {
  if (!state.running) return;
  state.player.hp -= amount;
  addParticles(state.player.x, state.player.y, "#ff7d7d", 12, 2.5);
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.running = false;
    showOverlay("הובסת", `ניקוד: ${Math.floor(state.score)} • הגעת לשלב ${state.stage}`);
  }
}

function resetStage() {
  state.stageGoal = isBossStage(state.stage) ? 1 : 10 + state.stage * 4;
  state.enemiesSpawned = 0;
  state.stageCleared = false;
  state.spawnCooldown = 500;
  state.player.weaponIndex = getWeaponForStage(state.stage);

  if (isBossStage(state.stage)) {
    spawnBoss();
  } else {
    state.boss = null;
  }

  state.stageBannerTimer = 1200;
}

function nextStage() {
  state.stage += 1;
  state.player.maxHp += 7;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 28);
  showOverlay("עברת שלב, כל הכבוד!", `שלב ${state.stage} התחיל • נשק: ${WEAPONS[getWeaponForStage(state.stage)].name}`);
  setTimeout(() => hideOverlay(), 850);
  resetStage();
}

function resetGame() {
  state.running = true;
  state.score = 0;
  state.stage = 1;
  state.kills = 0;
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.particles = [];
  state.player.x = WIDTH / 2;
  state.player.y = HEIGHT * 0.76;
  state.player.hp = 100;
  state.player.maxHp = 100;
  state.player.weaponIndex = 0;
  state.player.fireCooldown = 0;
  hideOverlay();
  resetStage();
  updateHud();
}

function updatePlayer(dt) {
  const p = state.player;
  let moveX = 0;
  let moveY = 0;

  if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
  if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
  if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
  if (keys.has("d") || keys.has("arrowright")) moveX += 1;

  const len = Math.hypot(moveX, moveY) || 1;
  const speed = p.speed * (dt / 16.67);
  p.x += (moveX / len) * speed;
  p.y += (moveY / len) * speed;

  p.x = clamp(p.x, p.radius + 8, WIDTH - p.radius - 8);
  p.y = clamp(p.y, p.radius + 8, HEIGHT - p.radius - 8);

  if (p.fireCooldown > 0) p.fireCooldown -= dt;
  if (mouse.down) {
    firePlayer();
  }
}

function updateEnemies(dt) {
  const player = state.player;

  if (!isBossStage(state.stage)) {
    if (state.enemiesSpawned < state.stageGoal && state.enemies.length < Math.min(16, 4 + state.stage)) {
      state.spawnCooldown -= dt;
      if (state.spawnCooldown <= 0) {
        spawnEnemy();
        state.spawnCooldown = rand(180, 540);
      }
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * (dt / 16.67);
    enemy.y += Math.sin(angle) * enemy.speed * (dt / 16.67);

    enemy.shootCooldown -= dt;
    if (enemy.shootCooldown <= 0) {
      fireEnemy(enemy, player.x, player.y);
      enemy.shootCooldown = enemy.type === "sniper" ? rand(700, 1200) : rand(1100, 1700);
    }

    if (distance(enemy.x, enemy.y, player.x, player.y) <= enemy.radius + player.radius) {
      takePlayerDamage(enemy.type === "tank" ? 14 : 9);
      enemy.hp = 0;
    }

    if (enemy.hp <= 0) {
      addParticles(enemy.x, enemy.y, enemy.color, 18, 3.2);
      state.score += enemy.score;
      state.kills += 1;
      state.enemies.splice(i, 1);
    }
  }

  if (state.boss) {
    const boss = state.boss;
    const bossAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    boss.x += Math.cos(bossAngle) * boss.speed * (dt / 16.67);
    boss.y += Math.sin(bossAngle) * boss.speed * (dt / 16.67);
    boss.x = clamp(boss.x, 80, WIDTH - 80);
    boss.y = clamp(boss.y, 60, HEIGHT * 0.56);

    boss.shootCooldown -= dt;
    if (boss.shootCooldown <= 0) {
      const spreadShots = 5;
      for (let s = 0; s < spreadShots; s += 1) {
        const t = spreadShots === 1 ? 0 : s / (spreadShots - 1) - 0.5;
        const shotAngle = bossAngle + t * 0.4;
        state.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(shotAngle) * 8,
          vy: Math.sin(shotAngle) * 8,
          damage: 13,
          life: 130,
          radius: 5,
          color: "#ff5a8f",
        });
      }
      boss.shootCooldown = 900;
    }

    if (distance(boss.x, boss.y, player.x, player.y) <= boss.radius + player.radius) {
      takePlayerDamage(22);
    }

    if (boss.hp <= 0) {
      addParticles(boss.x, boss.y, "#ffd6a8", 45, 4.1);
      state.score += 280;
      state.kills += 1;
      state.boss = null;
    }
  }
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    bullet.x += bullet.vx * (dt / 16.67);
    bullet.y += bullet.vy * (dt / 16.67);
    bullet.life -= dt;

    let hit = false;

    for (let e = state.enemies.length - 1; e >= 0; e -= 1) {
      const enemy = state.enemies[e];
      if (distance(bullet.x, bullet.y, enemy.x, enemy.y) <= enemy.radius + bullet.radius) {
        enemy.hp -= bullet.damage;
        hit = true;
        break;
      }
    }

    if (!hit && state.boss && distance(bullet.x, bullet.y, state.boss.x, state.boss.y) <= state.boss.radius + bullet.radius) {
      state.boss.hp -= bullet.damage;
      hit = true;
    }

    if (
      hit
      || bullet.life <= 0
      || bullet.x < -40
      || bullet.x > WIDTH + 40
      || bullet.y < -40
      || bullet.y > HEIGHT + 40
    ) {
      state.bullets.splice(i, 1);
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    bullet.x += bullet.vx * (dt / 16.67);
    bullet.y += bullet.vy * (dt / 16.67);
    bullet.life -= dt;

    if (distance(bullet.x, bullet.y, state.player.x, state.player.y) <= state.player.radius + bullet.radius) {
      takePlayerDamage(bullet.damage);
      state.enemyBullets.splice(i, 1);
      continue;
    }

    if (
      bullet.life <= 0
      || bullet.x < -40
      || bullet.x > WIDTH + 40
      || bullet.y < -40
      || bullet.y > HEIGHT + 40
    ) {
      state.enemyBullets.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.vx * (dt / 16.67);
    particle.y += particle.vy * (dt / 16.67);
    particle.life -= dt * 0.05;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function checkStageClear() {
  const stageDone = isBossStage(state.stage)
    ? !state.boss
    : state.enemiesSpawned >= state.stageGoal && state.enemies.length === 0;

  if (!stageDone || state.stageCleared || !state.running) {
    return;
  }

  state.stageCleared = true;
  nextStage();
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, "#101728");
  g.addColorStop(1, "#080d18");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(126,154,225,0.09)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const p = state.player;
  const angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);

  ctx.shadowColor = "#95ffe5aa";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#56d6ff";
  ctx.fillRect(-12, -14, 24, 28);

  ctx.fillStyle = "#d8f6ff";
  ctx.fillRect(-8, -24, 16, 10);

  ctx.fillStyle = "#2b385e";
  ctx.fillRect(-6, -22, 12, 6);

  ctx.fillStyle = "#7ef2ff";
  ctx.fillRect(8, -4, 14, 8);

  ctx.fillStyle = "#1d2740";
  ctx.beginPath();
  ctx.arc(-4, 18, 5, 0, Math.PI * 2);
  ctx.arc(4, 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawEnemy(enemy) {
  const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const enemyAngle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemyAngle);
  ctx.shadowColor = `${enemy.color}aa`;
  ctx.shadowBlur = 10;
  ctx.fillStyle = enemy.color;

  if (enemy.type === "tank") {
    ctx.fillRect(-enemy.radius, -enemy.radius * 0.9, enemy.radius * 2, enemy.radius * 1.8);
    ctx.fillStyle = "#303a4c";
    ctx.fillRect(-enemy.radius * 0.3, -enemy.radius * 1.05, enemy.radius * 1.3, enemy.radius * 0.35);
  } else {
    ctx.fillRect(-enemy.radius * 0.72, -enemy.radius * 0.72, enemy.radius * 1.44, enemy.radius * 1.44);
    ctx.fillStyle = enemy.type === "sniper" ? "#f6ccff" : "#d9f3ff";
    ctx.fillRect(-enemy.radius * 0.35, -enemy.radius * 1.02, enemy.radius * 0.7, enemy.radius * 0.42);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.radius * 0.3, -enemy.radius * 0.2, enemy.radius * 0.85, enemy.radius * 0.24);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#121826";
  ctx.fillRect(-enemy.radius * 0.3, -enemy.radius * 0.25, enemy.radius * 0.6, enemy.radius * 0.5);
  ctx.restore();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 11, enemy.radius * 2, 5);
  ctx.fillStyle = "#9dff85";
  ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 11, enemy.radius * 2 * hpRatio, 5);
}

function drawBoss() {
  if (!state.boss) return;
  const boss = state.boss;
  const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.05;

  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(angle);

  ctx.shadowColor = "#ff9ab6bb";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#ff6d9e";
  ctx.fillRect(-46, -44, 92, 88);

  ctx.fillStyle = "#ffd0dd";
  ctx.fillRect(-24, -64, 48, 22);

  ctx.fillStyle = "#1f233a";
  ctx.fillRect(-16, -58, 32, 11);

  ctx.fillStyle = "#ff94b4";
  ctx.fillRect(44, -10, 32, 14);
  ctx.fillRect(-76, -10, 32, 14);

  ctx.fillStyle = "#22283d";
  ctx.beginPath();
  ctx.arc(-18, 58, 13 * pulse, 0, Math.PI * 2);
  ctx.arc(18, 58, 13 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffe2c8";
  ctx.fillRect(-18, -20, 36, 40);
  ctx.restore();

  const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
  const barWidth = 420;
  const barX = (WIDTH - barWidth) / 2;
  const barY = 18;

  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, 22);

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(barX, barY, barWidth, 18);

  const g = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  g.addColorStop(0, "#ff5f6d");
  g.addColorStop(1, "#ffc371");
  ctx.fillStyle = g;
  ctx.fillRect(barX, barY, barWidth * ratio, 18);

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(barX, barY, barWidth, 18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 13px Rubik";
  ctx.textAlign = "center";
  ctx.fillText(`${boss.name} • HP ${Math.floor(Math.max(0, boss.hp))}/${Math.floor(boss.maxHp)}`, WIDTH / 2, 12);
}

function drawBullets() {
  state.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
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

function drawCrosshair() {
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(mouse.x - 8, mouse.y);
  ctx.lineTo(mouse.x + 8, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - 8);
  ctx.lineTo(mouse.x, mouse.y + 8);
  ctx.stroke();
}

function drawStageText() {
  if (state.stageBannerTimer <= 0) return;
  const alpha = clamp(state.stageBannerTimer / 1200, 0, 1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px Rubik";
  ctx.textAlign = "center";
  const text = isBossStage(state.stage) ? `Robot Quest • Stage ${state.stage} • BOSS` : `Robot Quest • Stage ${state.stage}`;
  ctx.fillText(text, WIDTH / 2, HEIGHT * 0.16);
  ctx.globalAlpha = 1;
}

function draw() {
  drawBackground();
  state.enemies.forEach(drawEnemy);
  drawBoss();
  drawBullets();
  drawParticles();
  drawPlayer();
  drawCrosshair();
  drawStageText();
}

function update(dt) {
  if (!state.running) {
    draw();
    updateHud();
    return;
  }

  state.stageBannerTimer = Math.max(0, state.stageBannerTimer - dt);
  updatePlayer(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateParticles(dt);
  checkStageClear();

  updateHud();
  draw();
}

function loop(now) {
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  update(dt);
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

dom.canvas.addEventListener("mousemove", (event) => {
  const rect = dom.canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  mouse.x = (event.clientX - rect.left) * scaleX;
  mouse.y = (event.clientY - rect.top) * scaleY;
});

dom.canvas.addEventListener("mousedown", () => {
  mouse.down = true;
});

window.addEventListener("mouseup", () => {
  mouse.down = false;
});

dom.canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  mouse.down = true;
  const touch = event.touches[0];
  if (!touch) return;
  const rect = dom.canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  mouse.x = (touch.clientX - rect.left) * scaleX;
  mouse.y = (touch.clientY - rect.top) * scaleY;
}, { passive: false });

dom.canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  if (!touch) return;
  const rect = dom.canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  mouse.x = (touch.clientX - rect.left) * scaleX;
  mouse.y = (touch.clientY - rect.top) * scaleY;
}, { passive: false });

window.addEventListener("touchend", () => {
  mouse.down = false;
}, { passive: true });

dom.restartBtn.addEventListener("click", resetGame);
dom.overlayBtn.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
