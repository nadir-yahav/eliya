const forzaDom = {
  canvas: document.getElementById("forzaCanvas"),
  score: document.getElementById("fsScore"),
  speed: document.getElementById("fsSpeed"),
  best: document.getElementById("fsBest"),
  restartBtn: document.getElementById("fsRestartBtn"),
  overlay: document.getElementById("fsOverlay"),
  overlayTitle: document.getElementById("fsOverlayTitle"),
  overlayText: document.getElementById("fsOverlayText"),
  overlayBtn: document.getElementById("fsOverlayBtn"),
};

if (forzaDom.canvas) {
  const ctx = forzaDom.canvas.getContext("2d");
  const WIDTH = forzaDom.canvas.width;
  const HEIGHT = forzaDom.canvas.height;
  const ROAD_WIDTH = 420;
  const LANE_COUNT = 3;
  const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
  const ROAD_X = (WIDTH - ROAD_WIDTH) / 2;

  const player = {
    lane: 1,
    x: ROAD_X + LANE_WIDTH * 1 + LANE_WIDTH / 2,
    y: HEIGHT - 95,
    width: 56,
    height: 92,
    targetX: 0,
  };

  const state = {
    score: 0,
    best: Number(localStorage.getItem("forzaSprintBest") || 0),
    speed: 5.2,
    speedScale: 1,
    enemyCars: [],
    running: true,
    roadOffset: 0,
    lastSpawn: 0,
  };

  let leftPressed = false;
  let rightPressed = false;
  let lastTime = performance.now();

  function updateHud() {
    forzaDom.score.textContent = Math.floor(state.score);
    forzaDom.speed.textContent = `${state.speedScale.toFixed(1)}x`;
    forzaDom.best.textContent = Math.floor(state.best);
  }

  function showOverlay(title, text) {
    forzaDom.overlayTitle.textContent = title;
    forzaDom.overlayText.textContent = text;
    forzaDom.overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    forzaDom.overlay.classList.add("hidden");
  }

  function resetGame() {
    state.score = 0;
    state.speed = 5.2;
    state.speedScale = 1;
    state.enemyCars = [];
    state.running = true;
    state.roadOffset = 0;
    state.lastSpawn = 0;

    player.lane = 1;
    player.x = ROAD_X + LANE_WIDTH * 1 + LANE_WIDTH / 2;
    player.targetX = player.x;

    hideOverlay();
    updateHud();
  }

  function spawnEnemy() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = ROAD_X + lane * LANE_WIDTH + LANE_WIDTH / 2;
    const colorPalette = ["#ff4f6b", "#53c8ff", "#ffcc31", "#8d6bff", "#ff8a2f"];

    const tooClose = state.enemyCars.some((car) => car.lane === lane && car.y < 180);
    if (tooClose) {
      return;
    }

    state.enemyCars.push({
      lane,
      x,
      y: -120,
      width: 56,
      height: 92,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    });
  }

  function movePlayer() {
    if (leftPressed && !rightPressed) {
      player.lane = Math.max(0, player.lane - 1);
      leftPressed = false;
    }

    if (rightPressed && !leftPressed) {
      player.lane = Math.min(LANE_COUNT - 1, player.lane + 1);
      rightPressed = false;
    }

    player.targetX = ROAD_X + player.lane * LANE_WIDTH + LANE_WIDTH / 2;
    player.x += (player.targetX - player.x) * 0.2;
  }

  function hitTest(carA, carB) {
    return !(
      carA.x + carA.width / 2 < carB.x - carB.width / 2 ||
      carA.x - carA.width / 2 > carB.x + carB.width / 2 ||
      carA.y + carA.height / 2 < carB.y - carB.height / 2 ||
      carA.y - carA.height / 2 > carB.y + carB.height / 2
    );
  }

  function endGame() {
    state.running = false;
    state.best = Math.max(state.best, Math.floor(state.score));
    localStorage.setItem("forzaSprintBest", String(state.best));
    updateHud();
    showOverlay("Crash!", `הניקוד שלך: ${Math.floor(state.score)} | שיא: ${Math.floor(state.best)}`);
  }

  function update(dt) {
    if (!state.running) {
      return;
    }

    const dtFactor = dt / 16.67;

    state.speed += 0.0008 * dt;
    state.speedScale = state.speed / 5.2;
    state.score += state.speed * 0.16 * dtFactor;
    state.roadOffset += state.speed * dtFactor;
    state.lastSpawn += dt;

    movePlayer();

    const spawnDelay = Math.max(360, 950 - state.speed * 55);
    if (state.lastSpawn >= spawnDelay) {
      spawnEnemy();
      state.lastSpawn = 0;
    }

    state.enemyCars.forEach((car) => {
      car.y += state.speed * 1.35 * dtFactor;
    });

    state.enemyCars = state.enemyCars.filter((car) => car.y < HEIGHT + 130);

    const playerBox = {
      x: player.x,
      y: player.y,
      width: player.width * 0.82,
      height: player.height * 0.86,
    };

    for (const car of state.enemyCars) {
      const enemyBox = {
        x: car.x,
        y: car.y,
        width: car.width * 0.82,
        height: car.height * 0.86,
      };

      if (hitTest(playerBox, enemyBox)) {
        endGame();
        break;
      }
    }

    updateHud();
  }

  function drawRoad() {
    ctx.fillStyle = "#071911";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const shoulderWidth = 24;
    ctx.fillStyle = "#1d2d25";
    ctx.fillRect(ROAD_X - shoulderWidth, 0, shoulderWidth, HEIGHT);
    ctx.fillRect(ROAD_X + ROAD_WIDTH, 0, shoulderWidth, HEIGHT);

    ctx.fillStyle = "#172720";
    ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    for (let lane = 1; lane < LANE_COUNT; lane += 1) {
      const laneX = ROAD_X + lane * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(laneX, 0);
      ctx.lineTo(laneX, HEIGHT);
      ctx.stroke();
    }

    const stripeHeight = 28;
    const stripeGap = 26;
    ctx.fillStyle = "#dfe6dc";
    for (let lane = 1; lane < LANE_COUNT; lane += 1) {
      const laneX = ROAD_X + lane * LANE_WIDTH - 4;
      const startY = -(state.roadOffset % (stripeHeight + stripeGap));
      for (let y = startY; y < HEIGHT + stripeHeight; y += stripeHeight + stripeGap) {
        ctx.fillRect(laneX, y, 8, stripeHeight);
      }
    }
  }

  function drawCar(car, isPlayer = false) {
    const halfW = car.width / 2;
    const halfH = car.height / 2;

    ctx.save();
    ctx.translate(car.x, car.y);

    ctx.fillStyle = isPlayer ? "#8cff1a" : car.color;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, car.width, car.height, 12);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(-halfW + 8, -halfH + 12, car.width - 16, car.height - 24);

    ctx.fillStyle = "#d9f7ff";
    ctx.fillRect(-halfW + 12, -halfH + 8, car.width - 24, 16);
    ctx.fillRect(-halfW + 12, halfH - 24, car.width - 24, 14);

    ctx.fillStyle = "#0b120f";
    ctx.fillRect(-halfW - 4, -halfH + 14, 8, 18);
    ctx.fillRect(halfW - 4, -halfH + 14, 8, 18);
    ctx.fillRect(-halfW - 4, halfH - 32, 8, 18);
    ctx.fillRect(halfW - 4, halfH - 32, 8, 18);

    ctx.restore();
  }

  function draw() {
    drawRoad();

    state.enemyCars.forEach((car) => drawCar(car, false));
    drawCar(player, true);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(ROAD_X - 2, 0, 2, HEIGHT);
    ctx.fillRect(ROAD_X + ROAD_WIDTH, 0, 2, HEIGHT);
  }

  function loop(now) {
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      leftPressed = true;
    }

    if (key === "arrowright" || key === "d") {
      event.preventDefault();
      rightPressed = true;
    }
  });

  forzaDom.restartBtn.addEventListener("click", resetGame);
  forzaDom.overlayBtn.addEventListener("click", resetGame);

  if (typeof ctx.roundRect !== "function") {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  resetGame();
  requestAnimationFrame(loop);
}
