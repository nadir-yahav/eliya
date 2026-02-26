const TILE = 40;
const BASE_MAP_TEMPLATE = [
  "##############",
  "#o..........o#",
  "#.####.##.##.#",
  "#............#",
  "#.##.######..#",
  "#....#....#..#",
  "####.#.##.#.##",
  "#............#",
  "#.##.######.##",
  "#............#",
  "#..##.##.##..#",
  "#o..........o#",
  "##############",
];

const MAP_SCALE_X = 10;
const MAP_SCALE_Y = 10;
const MIN_GHOSTS = 1;
const MAX_GHOSTS = 1000;

const DIFFICULTY_SETTINGS = {
  easy: {
    ghosts: 40,
    pacmanStepFrames: 6,
    ghostSpeedLevel: 4,
    powerTicks: 90,
  },
  medium: {
    ghosts: 103,
    pacmanStepFrames: 7,
    ghostSpeedLevel: 5,
    powerTicks: 70,
  },
  hard: {
    ghosts: 140,
    pacmanStepFrames: 8,
    ghostSpeedLevel: 8,
    powerTicks: 55,
  },
};

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const GHOST_COLORS = ["#ff4f6b", "#66dbff", "#ff8c3a", "#d88bff", "#66ffa8", "#ffe86c"];

const dom = {
  canvas: document.getElementById("gameCanvas"),
  score: document.getElementById("score"),
  lives: document.getElementById("lives"),
  pellets: document.getElementById("pellets"),
  restartBtn: document.getElementById("restartBtn"),
  difficultySelect: document.getElementById("difficultySelect"),
  ghostCountInput: document.getElementById("ghostCountInput"),
  ghostSpeedInput: document.getElementById("ghostSpeedInput"),
  ghostSpeedValue: document.getElementById("ghostSpeedValue"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  overlayBtn: document.getElementById("overlayBtn"),
};

const ctx = dom.canvas.getContext("2d");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function speedLevelToStepInterval(speedLevel) {
  return clamp(11 - speedLevel, 1, 10);
}

function cloneSettings(settings) {
  return {
    ghosts: settings.ghosts,
    pacmanStepFrames: settings.pacmanStepFrames,
    ghostSpeedLevel: settings.ghostSpeedLevel,
    powerTicks: settings.powerTicks,
  };
}

class GameState {
  constructor() {
    this.currentDifficulty = "medium";
    this.activeSettings = cloneSettings(DIFFICULTY_SETTINGS[this.currentDifficulty]);

    this.pacmanStart = { x: 1, y: 1 };
    this.map = [];
    this.pelletsLeft = 0;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.powerModeTicks = 0;
    this.stepCounter = 0;
    this.particles = [];

    this.pacman = {
      x: this.pacmanStart.x,
      y: this.pacmanStart.y,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      mouth: 0,
    };

    this.ghostStarts = [];
    this.ghosts = [];

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.powerModeTicks = 0;
    this.stepCounter = 0;
    this.particles = [];

    this.buildMap();
    this.setupGhosts();
    this.resetPositions();
    this.updateHud();
    this.hideOverlay();
  }

  setDifficulty(level) {
    this.currentDifficulty = level;
    this.activeSettings = cloneSettings(DIFFICULTY_SETTINGS[level]);
  }

  setGhostCount(value) {
    this.activeSettings.ghosts = clamp(Number(value) || 1, MIN_GHOSTS, MAX_GHOSTS);
  }

  setGhostSpeedLevel(value) {
    this.activeSettings.ghostSpeedLevel = clamp(Number(value) || 1, 1, 10);
  }

  getGhostMoveInterval() {
    return speedLevelToStepInterval(this.activeSettings.ghostSpeedLevel);
  }

  getLogicStepMs() {
    return (1000 / 60) * this.activeSettings.pacmanStepFrames;
  }

  buildMap() {
    const baseRows = BASE_MAP_TEMPLATE.length;
    const baseCols = BASE_MAP_TEMPLATE[0].length;

    this.map = [];
    for (let tileY = 0; tileY < MAP_SCALE_Y; tileY += 1) {
      for (let y = 0; y < baseRows; y += 1) {
        let row = "";
        for (let tileX = 0; tileX < MAP_SCALE_X; tileX += 1) {
          row += BASE_MAP_TEMPLATE[y];
        }
        this.map.push(row.split(""));
      }
    }

    for (let seamX = baseCols; seamX < this.map[0].length; seamX += baseCols) {
      for (let y = 2; y < this.map.length - 2; y += 6) {
        this.map[y][seamX - 1] = ".";
        this.map[y][seamX] = ".";
      }
    }

    for (let seamY = baseRows; seamY < this.map.length; seamY += baseRows) {
      for (let x = 2; x < this.map[0].length - 2; x += 6) {
        this.map[seamY - 1][x] = ".";
        this.map[seamY][x] = ".";
      }
    }

    this.pelletsLeft = 0;
    for (let y = 0; y < this.map.length; y += 1) {
      for (let x = 0; x < this.map[y].length; x += 1) {
        if (this.map[y][x] === "." || this.map[y][x] === "o") {
          this.pelletsLeft += 1;
        }
      }
    }
  }

  setupGhosts() {
    const walkable = [];
    for (let y = 0; y < this.map.length; y += 1) {
      for (let x = 0; x < this.map[y].length; x += 1) {
        if (this.map[y][x] !== "#" && !(x === this.pacmanStart.x && y === this.pacmanStart.y)) {
          walkable.push({ x, y });
        }
      }
    }

    const totalGhosts = clamp(this.activeSettings.ghosts, MIN_GHOSTS, MAX_GHOSTS);
    const stride = Math.max(1, Math.floor(walkable.length / totalGhosts));
    const offset = 17;

    this.ghostStarts = [];
    for (let index = 0; index < totalGhosts; index += 1) {
      const pointIndex = (offset + index * stride) % walkable.length;
      const point = walkable[pointIndex];
      this.ghostStarts.push({
        x: point.x,
        y: point.y,
        color: GHOST_COLORS[index % GHOST_COLORS.length],
      });
    }

    this.ghosts = this.ghostStarts.map((ghost) => ({
      ...ghost,
      dir: { x: 0, y: 0 },
      stepDelay: 0,
    }));
  }

  resetPositions() {
    this.pacman.x = this.pacmanStart.x;
    this.pacman.y = this.pacmanStart.y;
    this.pacman.dir = { x: 0, y: 0 };
    this.pacman.nextDir = { x: 0, y: 0 };

    this.ghosts.forEach((ghost, index) => {
      ghost.x = this.ghostStarts[index].x;
      ghost.y = this.ghostStarts[index].y;
      ghost.dir = { x: 0, y: 0 };
      ghost.stepDelay = Math.floor(Math.random() * 10);
    });
  }

  updateHud() {
    dom.score.textContent = this.score;
    dom.lives.textContent = this.lives;
    dom.pellets.textContent = this.pelletsLeft;
  }

  spawnParticles(tileX, tileY, color, count, speed = 2) {
    const centerX = tileX * TILE + TILE / 2;
    const centerY = tileY * TILE + TILE / 2;

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.75);

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 20 + Math.floor(Math.random() * 24),
        maxLife: 44,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  updateParticles() {
    this.particles = this.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.95,
        vy: particle.vy * 0.95,
        life: particle.life - 1,
      }))
      .filter((particle) => particle.life > 0);
  }

  showOverlay(title, text) {
    dom.overlayTitle.textContent = title;
    dom.overlayText.textContent = text;
    dom.overlay.classList.remove("hidden");
  }

  hideOverlay() {
    dom.overlay.classList.add("hidden");
  }

  endGame(isWin) {
    this.gameOver = true;
    this.showOverlay(isWin ? "ניצחת!" : "המשחק נגמר", isWin ? "אספת את כל הנקודות." : "הרוחות תפסו אותך.");
  }

  tileAt(x, y) {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
      return "#";
    }
    return this.map[y][x];
  }

  isWall(x, y) {
    return this.tileAt(x, y) === "#";
  }

  canMove(entity, direction) {
    return !this.isWall(entity.x + direction.x, entity.y + direction.y);
  }

  getAvailableDirs(entity) {
    const candidates = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    return candidates.filter((dir) => this.canMove(entity, dir));
  }

  movePacman() {
    if (this.canMove(this.pacman, this.pacman.nextDir)) {
      this.pacman.dir = { ...this.pacman.nextDir };
    }

    if (!this.canMove(this.pacman, this.pacman.dir)) {
      return;
    }

    this.pacman.x += this.pacman.dir.x;
    this.pacman.y += this.pacman.dir.y;
    this.pacman.mouth = (this.pacman.mouth + 0.18) % (Math.PI / 2);

    const tile = this.map[this.pacman.y][this.pacman.x];

    if (tile === ".") {
      this.map[this.pacman.y][this.pacman.x] = " ";
      this.score += 10;
      this.pelletsLeft -= 1;
      this.spawnParticles(this.pacman.x, this.pacman.y, "#ffdca8", 8, 1.8);
      this.updateHud();
    }

    if (tile === "o") {
      this.map[this.pacman.y][this.pacman.x] = " ";
      this.score += 50;
      this.pelletsLeft -= 1;
      this.powerModeTicks = this.activeSettings.powerTicks;
      this.spawnParticles(this.pacman.x, this.pacman.y, "#ffffff", 16, 2.4);
      this.updateHud();
    }

    if (this.pelletsLeft <= 0) {
      this.endGame(true);
    }
  }

  moveGhosts() {
    this.ghosts.forEach((ghost) => {
      if (ghost.stepDelay > 0) {
        ghost.stepDelay -= 1;
        return;
      }

      const options = this.getAvailableDirs(ghost);
      const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };
      const filtered = options.filter((option) => !(option.x === opposite.x && option.y === opposite.y));
      const available = filtered.length > 0 ? filtered : options;

      if (available.length > 0) {
        if (this.powerModeTicks <= 0) {
          available.sort((a, b) => {
            const distA = Math.abs(this.pacman.x - (ghost.x + a.x)) + Math.abs(this.pacman.y - (ghost.y + a.y));
            const distB = Math.abs(this.pacman.x - (ghost.x + b.x)) + Math.abs(this.pacman.y - (ghost.y + b.y));
            return distA - distB;
          });
          ghost.dir = available[0];
        } else {
          available.sort((a, b) => {
            const distA = Math.abs(this.pacman.x - (ghost.x + a.x)) + Math.abs(this.pacman.y - (ghost.y + a.y));
            const distB = Math.abs(this.pacman.x - (ghost.x + b.x)) + Math.abs(this.pacman.y - (ghost.y + b.y));
            return distB - distA;
          });
          ghost.dir = available[0];
        }
      }

      if (this.canMove(ghost, ghost.dir)) {
        ghost.x += ghost.dir.x;
        ghost.y += ghost.dir.y;
      }
    });
  }

  resetGhost(ghost, ghostIndex) {
    ghost.x = this.ghostStarts[ghostIndex].x;
    ghost.y = this.ghostStarts[ghostIndex].y;
    ghost.dir = { x: 0, y: 0 };
    ghost.stepDelay = 12 + Math.floor(Math.random() * 10);
  }

  onPacmanHit() {
    this.lives -= 1;
    this.powerModeTicks = 0;
    this.spawnParticles(this.pacman.x, this.pacman.y, "#ff5678", 28, 3.2);
    this.updateHud();

    if (this.lives <= 0) {
      this.endGame(false);
      return;
    }

    this.resetPositions();
  }

  handleCollisions() {
    this.ghosts.forEach((ghost, index) => {
      if (this.gameOver || ghost.x !== this.pacman.x || ghost.y !== this.pacman.y) {
        return;
      }

      if (this.powerModeTicks > 0) {
        this.score += 200;
        this.spawnParticles(ghost.x, ghost.y, "#86c8ff", 20, 2.6);
        this.resetGhost(ghost, index);
        this.updateHud();
      } else {
        this.onPacmanHit();
      }
    });
  }

  updateStep() {
    if (this.gameOver) {
      return;
    }

    this.stepCounter += 1;
    if (this.powerModeTicks > 0) {
      this.powerModeTicks -= 1;
    }

    this.movePacman();
    this.handleCollisions();

    if (this.stepCounter % this.getGhostMoveInterval() === 0) {
      this.moveGhosts();
    }

    this.handleCollisions();

    this.updateParticles();
  }
}

class Renderer {
  constructor(state, context, canvas) {
    this.state = state;
    this.ctx = context;
    this.canvas = canvas;
    this.frameCounter = 0;
  }

  getCamera() {
    const worldWidth = this.state.map[0].length * TILE;
    const worldHeight = this.state.map.length * TILE;
    const centerX = this.state.pacman.x * TILE + TILE / 2;
    const centerY = this.state.pacman.y * TILE + TILE / 2;

    const rawX = centerX - this.canvas.width / 2;
    const rawY = centerY - this.canvas.height / 2;

    return {
      x: Math.max(0, Math.min(rawX, worldWidth - this.canvas.width)),
      y: Math.max(0, Math.min(rawY, worldHeight - this.canvas.height)),
    };
  }

  drawMap(camera) {
    const rows = this.state.map.length;
    const cols = this.state.map[0].length;
    const startCol = Math.max(0, Math.floor(camera.x / TILE));
    const endCol = Math.min(cols - 1, Math.ceil((camera.x + this.canvas.width) / TILE));
    const startRow = Math.max(0, Math.floor(camera.y / TILE));
    const endRow = Math.min(rows - 1, Math.ceil((camera.y + this.canvas.height) / TILE));

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawNeonBackdrop();

    for (let y = startRow; y <= endRow; y += 1) {
      for (let x = startCol; x <= endCol; x += 1) {
        const tile = this.state.map[y][x];
        const px = x * TILE - camera.x;
        const py = y * TILE - camera.y;

        if (tile === "#") {
          this.ctx.shadowColor = "rgba(41, 105, 255, 0.6)";
          this.ctx.shadowBlur = 8;
          this.ctx.fillStyle = "#1f49d8";
          this.ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          this.ctx.shadowBlur = 0;
        }

        if (tile === ".") {
          this.ctx.fillStyle = "#ffdca8";
          this.ctx.beginPath();
          this.ctx.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2);
          this.ctx.fill();
        }

        if (tile === "o") {
          this.ctx.fillStyle = "#ffffff";
          this.ctx.beginPath();
          this.ctx.arc(px + TILE / 2, py + TILE / 2, 8, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  drawNeonBackdrop() {
    const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    g.addColorStop(0, "#050b1e");
    g.addColorStop(1, "#02050f");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = "rgba(58, 92, 200, 0.13)";
    this.ctx.lineWidth = 1;

    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + 0.5, 0);
      this.ctx.lineTo(x + 0.5, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + 0.5);
      this.ctx.lineTo(this.canvas.width, y + 0.5);
      this.ctx.stroke();
    }
  }

  drawPacman(camera) {
    const { pacman } = this.state;
    const centerX = pacman.x * TILE + TILE / 2 - camera.x;
    const centerY = pacman.y * TILE + TILE / 2 - camera.y;
    const radius = TILE * 0.35;
    const mouth = 0.16 + Math.abs(Math.sin(pacman.mouth)) * 0.32;

    let angle = 0;
    if (pacman.dir.x === 1) angle = 0;
    if (pacman.dir.x === -1) angle = Math.PI;
    if (pacman.dir.y === -1) angle = -Math.PI / 2;
    if (pacman.dir.y === 1) angle = Math.PI / 2;

    this.ctx.shadowColor = "rgba(255, 226, 59, 0.8)";
    this.ctx.shadowBlur = 14;
    this.ctx.fillStyle = "#ffe23b";
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, radius, angle + mouth, angle + Math.PI * 2 - mouth);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  drawGhost(ghost, camera) {
    const x = ghost.x * TILE - camera.x;
    const y = ghost.y * TILE - camera.y;
    const w = TILE;
    const h = TILE;

    const isFrightened = this.state.powerModeTicks > 0;
    const blink = this.state.powerModeTicks < 18 && this.frameCounter % 14 < 7;
    const wobble = Math.sin((this.frameCounter + ghost.x * 3 + ghost.y * 5) * 0.12) * 2.2;
    const bodyTop = y + h * 0.18 + wobble;
    const bodyBottom = y + h * 0.83 + wobble;
    const left = x + w * 0.16;
    const right = x + w * 0.84;
    const baseColor = isFrightened ? (blink ? "#ffffff" : "#2f7cff") : ghost.color;

    this.ctx.shadowColor = "rgba(122, 164, 255, 0.5)";
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = baseColor;
    this.ctx.beginPath();
    this.ctx.moveTo(left, bodyBottom);
    this.ctx.lineTo(left, bodyTop + 6);
    this.ctx.quadraticCurveTo(x + w / 2, y - 2 + wobble, right, bodyTop + 6);

    const wave = 4;
    for (let i = 0; i < 4; i += 1) {
      const segX = left + (i * (right - left)) / 4;
      const nextX = left + ((i + 1) * (right - left)) / 4;
      const crest = i % 2 === 0 ? wave : -wave;
      this.ctx.quadraticCurveTo((segX + nextX) / 2, bodyBottom + crest, nextX, bodyBottom);
    }

    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    const eyeDirX = this.state.pacman.x - ghost.x;
    const eyeDirY = this.state.pacman.y - ghost.y;
    const eyeNorm = Math.max(1, Math.hypot(eyeDirX, eyeDirY));
    const pupilOffsetX = (eyeDirX / eyeNorm) * 1.8;
    const pupilOffsetY = (eyeDirY / eyeNorm) * 1.8;

    const eyeY = y + h * 0.5 + wobble;
    const leftEyeX = x + w * 0.4;
    const rightEyeX = x + w * 0.6;

    this.ctx.fillStyle = "white";
    this.ctx.beginPath();
    this.ctx.arc(leftEyeX, eyeY, 4, 0, Math.PI * 2);
    this.ctx.arc(rightEyeX, eyeY, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#0b1e44";
    this.ctx.beginPath();
    this.ctx.arc(leftEyeX + pupilOffsetX, eyeY + pupilOffsetY, 2, 0, Math.PI * 2);
    this.ctx.arc(rightEyeX + pupilOffsetX, eyeY + pupilOffsetY, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawParticles(camera) {
    this.state.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x - camera.x, particle.y - camera.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  drawMiniMap(camera) {
    const mapRows = this.state.map.length;
    const mapCols = this.state.map[0].length;
    const minimapWidth = 180;
    const minimapHeight = 136;
    const margin = 10;
    const posX = this.canvas.width - minimapWidth - margin;
    const posY = this.canvas.height - minimapHeight - margin;
    const scaleX = minimapWidth / mapCols;
    const scaleY = minimapHeight / mapRows;

    this.ctx.fillStyle = "rgba(3, 10, 27, 0.8)";
    this.ctx.fillRect(posX, posY, minimapWidth, minimapHeight);
    this.ctx.strokeStyle = "rgba(255,255,255,0.25)";
    this.ctx.strokeRect(posX, posY, minimapWidth, minimapHeight);

    for (let y = 0; y < mapRows; y += 2) {
      for (let x = 0; x < mapCols; x += 2) {
        if (this.state.map[y][x] === "#") {
          this.ctx.fillStyle = "rgba(60, 116, 255, 0.45)";
          this.ctx.fillRect(posX + x * scaleX, posY + y * scaleY, Math.max(1, scaleX * 2), Math.max(1, scaleY * 2));
        }
      }
    }

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    this.state.ghosts.forEach((ghost) => {
      this.ctx.fillRect(posX + ghost.x * scaleX, posY + ghost.y * scaleY, 1.5, 1.5);
    });

    this.ctx.fillStyle = "#ffe23b";
    this.ctx.beginPath();
    this.ctx.arc(posX + this.state.pacman.x * scaleX, posY + this.state.pacman.y * scaleY, 2.8, 0, Math.PI * 2);
    this.ctx.fill();

    const cameraTileX = camera.x / TILE;
    const cameraTileY = camera.y / TILE;
    const cameraTileW = this.canvas.width / TILE;
    const cameraTileH = this.canvas.height / TILE;
    this.ctx.strokeStyle = "rgba(255, 226, 59, 0.9)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      posX + cameraTileX * scaleX,
      posY + cameraTileY * scaleY,
      cameraTileW * scaleX,
      cameraTileH * scaleY
    );
  }

  draw() {
    this.frameCounter += 1;
    const camera = this.getCamera();
    this.drawMap(camera);
    this.drawPacman(camera);

    const viewPadding = TILE;
    const minX = camera.x - viewPadding;
    const maxX = camera.x + this.canvas.width + viewPadding;
    const minY = camera.y - viewPadding;
    const maxY = camera.y + this.canvas.height + viewPadding;

    this.state.ghosts.forEach((ghost) => {
      const ghostPx = ghost.x * TILE;
      const ghostPy = ghost.y * TILE;
      if (ghostPx >= minX && ghostPx <= maxX && ghostPy >= minY && ghostPy <= maxY) {
        this.drawGhost(ghost, camera);
      }
    });

    this.drawParticles(camera);
    this.drawMiniMap(camera);
  }
}

class InputController {
  constructor(state) {
    this.state = state;
    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      const input = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = DIRECTIONS[input];
      if (!direction) {
        return;
      }

      event.preventDefault();
      this.state.pacman.nextDir = direction;
    });
  }
}

class GameEngine {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.maxStepsPerFrame = 5;
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  restart() {
    this.accumulator = 0;
    this.state.reset();
  }

  loop(now) {
    if (!this.running) {
      return;
    }

    const delta = now - this.lastTime;
    this.lastTime = now;
    this.accumulator += Math.min(delta, 100);

    const logicStepMs = this.state.getLogicStepMs();
    let steps = 0;

    while (this.accumulator >= logicStepMs && steps < this.maxStepsPerFrame) {
      this.state.updateStep();
      this.accumulator -= logicStepMs;
      steps += 1;
    }

    this.renderer.draw();
    requestAnimationFrame((time) => this.loop(time));
  }
}

const gameState = new GameState();
const renderer = new Renderer(gameState, ctx, dom.canvas);
new InputController(gameState);
const engine = new GameEngine(gameState, renderer);

function syncCustomControls() {
  dom.difficultySelect.value = gameState.currentDifficulty;
  dom.ghostCountInput.value = gameState.activeSettings.ghosts;
  dom.ghostSpeedInput.value = gameState.activeSettings.ghostSpeedLevel;
  dom.ghostSpeedValue.textContent = gameState.activeSettings.ghostSpeedLevel;
}

function restartGame() {
  engine.restart();
}

dom.difficultySelect.addEventListener("change", () => {
  const level = dom.difficultySelect.value;
  gameState.setDifficulty(level);
  syncCustomControls();
  restartGame();
});

dom.ghostCountInput.addEventListener("change", () => {
  const safeValue = clamp(Number(dom.ghostCountInput.value) || 1, MIN_GHOSTS, MAX_GHOSTS);
  dom.ghostCountInput.value = safeValue;
  gameState.setGhostCount(safeValue);
  restartGame();
});

dom.ghostSpeedInput.addEventListener("input", () => {
  const speedLevel = clamp(Number(dom.ghostSpeedInput.value) || 1, 1, 10);
  gameState.setGhostSpeedLevel(speedLevel);
  dom.ghostSpeedValue.textContent = speedLevel;
});

dom.ghostSpeedInput.addEventListener("change", () => {
  restartGame();
});

dom.restartBtn.addEventListener("click", restartGame);
dom.overlayBtn.addEventListener("click", restartGame);

syncCustomControls();
engine.start();
