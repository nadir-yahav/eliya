const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8080);
const MODE_CONFIG = {
  "1v1": { teamSize: 1, rewardCoins: 50, mapScale: 1 },
  "2v2": { teamSize: 2, rewardCoins: 100, mapScale: 1 },
  "3v3": { teamSize: 3, rewardCoins: 100, mapScale: 2 },
  "4v4": { teamSize: 4, rewardCoins: 100, mapScale: 2 },
};
const MATCH_TARGET_POINTS = 5;

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map();
const queueByMode = new Map(Object.keys(MODE_CONFIG).map((mode) => [mode, []]));
const matches = new Map();

function safeSend(socket, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcastUsers() {
  const users = Array.from(clients.values()).map((client) => ({ id: client.id, name: client.name }));
  for (const client of clients.values()) {
    safeSend(client.socket, { type: "users", users });
  }
}

function removeFromAllQueues(clientId) {
  for (const [mode, queued] of queueByMode.entries()) {
    const next = queued.filter((entry) => entry.id !== clientId);
    queueByMode.set(mode, next);
  }
}

function sendQueueStatus(client, mode, queueing) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG["1v1"];
  const waiting = (queueByMode.get(mode) || []).length;
  safeSend(client.socket, {
    type: "queueStatus",
    queueing,
    mode,
    waiting,
    needed: config.teamSize * 2,
  });
}

function createSpawns(modeConfig) {
  const worldW = 960 * modeConfig.mapScale;
  const worldH = 540 * modeConfig.mapScale;
  const teamSize = modeConfig.teamSize;

  const team1 = [];
  const team2 = [];
  for (let i = 0; i < teamSize; i += 1) {
    const offsetY = worldH * 0.18 + i * ((worldH * 0.64) / Math.max(1, teamSize - 1));
    team1.push({ x: worldW * 0.2, y: offsetY });
    team2.push({ x: worldW * 0.8, y: offsetY });
  }
  return { team1, team2 };
}

function applySpawnsToPlayers(match) {
  const config = MODE_CONFIG[match.mode] || MODE_CONFIG["1v1"];
  const { team1, team2 } = createSpawns(config);
  let t1 = 0;
  let t2 = 0;
  match.players.forEach((player) => {
    if (player.team === 1) {
      const spawn = team1[t1++] || team1[0];
      player.spawnX = spawn.x;
      player.spawnY = spawn.y;
    } else {
      const spawn = team2[t2++] || team2[0];
      player.spawnX = spawn.x;
      player.spawnY = spawn.y;
    }
    player.alive = true;
  });
}

function tryStartMatch(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) return;

  const queue = queueByMode.get(mode) || [];
  const needed = config.teamSize * 2;
  if (queue.length < needed) return;

  const selected = queue.slice(0, needed);
  queueByMode.set(mode, queue.slice(needed));

  const liveSelected = selected
    .map((entry) => clients.get(entry.id))
    .filter(Boolean)
    .slice(0, needed);
  if (liveSelected.length < needed) {
    liveSelected.forEach((client) => {
      queueByMode.get(mode).push({ id: client.id, planeId: entryPlane(client.id, selected) });
    });
    return;
  }

  const matchId = crypto.randomUUID();
  const { team1, team2 } = createSpawns(config);
  const players = [];

  for (let i = 0; i < liveSelected.length; i += 1) {
    const client = liveSelected[i];
    const team = i < config.teamSize ? 1 : 2;
    const teamIndex = team === 1 ? i : i - config.teamSize;
    const spawn = team === 1 ? team1[teamIndex] : team2[teamIndex];
    const queuedInfo = selected.find((entry) => entry.id === client.id);
    players.push({
      id: client.id,
      name: client.name,
      team,
      planeId: Math.max(1, Math.min(1000, Number(queuedInfo?.planeId) || 1)),
      spawnX: spawn.x,
      spawnY: spawn.y,
      alive: true,
    });
  }

  matches.set(matchId, {
    id: matchId,
    mode,
    rewardCoins: config.rewardCoins,
    mapScale: config.mapScale,
    targetPoints: MATCH_TARGET_POINTS,
    teamScores: { 1: 0, 2: 0 },
    players,
    ended: false,
  });

  players.forEach((player) => {
    const client = clients.get(player.id);
    if (!client) return;
    client.matchId = matchId;
    safeSend(client.socket, {
      type: "matchStart",
      matchId,
      mode,
      rewardCoins: config.rewardCoins,
      mapScale: config.mapScale,
      targetPoints: MATCH_TARGET_POINTS,
      teamScores: { 1: 0, 2: 0 },
      players,
    });
  });
}

function entryPlane(clientId, entries) {
  const entry = entries.find((item) => item.id === clientId);
  return entry ? entry.planeId : 1;
}

function relayToMatch(match, senderId, payload) {
  for (const player of match.players) {
    if (player.id === senderId) continue;
    const client = clients.get(player.id);
    if (!client) continue;
    safeSend(client.socket, payload);
  }
}

function markPlayerDown(match, playerId) {
  const player = match.players.find((entry) => entry.id === playerId);
  if (!player || !player.alive) return;
  player.alive = false;

  const team1Alive = match.players.some((entry) => entry.team === 1 && entry.alive);
  const team2Alive = match.players.some((entry) => entry.team === 2 && entry.alive);

  if (!team1Alive || !team2Alive) {
    const winnerTeam = team1Alive ? 1 : 2;
    handleRoundWin(match, winnerTeam, "team-eliminated");
  }
}

function handleRoundWin(match, winnerTeam, reason) {
  if (!match || match.ended) return;
  match.teamScores[winnerTeam] = (match.teamScores[winnerTeam] || 0) + 1;

  if ((match.teamScores[winnerTeam] || 0) >= match.targetPoints) {
    finalizeMatch(match, winnerTeam, reason || "score-limit");
    return;
  }

  applySpawnsToPlayers(match);
  for (const player of match.players) {
    const client = clients.get(player.id);
    if (!client) continue;
    safeSend(client.socket, {
      type: "roundUpdate",
      matchId: match.id,
      roundWinner: winnerTeam,
      teamScores: match.teamScores,
      players: match.players,
    });
  }
}

function finalizeMatch(match, winnerTeam, reason) {
  if (!match || match.ended) return;
  match.ended = true;

  match.players.forEach((player) => {
    const client = clients.get(player.id);
    if (!client) return;
    client.matchId = null;
    safeSend(client.socket, {
      type: "matchResult",
      matchId: match.id,
      winnerTeam,
      reason,
      teamScores: match.teamScores,
      targetPoints: match.targetPoints,
    });
  });

  matches.delete(match.id);
}

wss.on("connection", (socket) => {
  const id = crypto.randomUUID();
  const client = {
    id,
    socket,
    name: `Pilot-${Math.floor(Math.random() * 900 + 100)}`,
    matchId: null,
  };
  clients.set(id, client);

  safeSend(socket, { type: "welcome", id, name: client.name });
  broadcastUsers();

  socket.on("message", (raw) => {
    let message = null;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!message || typeof message !== "object") return;

    if (message.type === "hello") {
      const nextName = String(message.name || "").trim().slice(0, 24);
      if (nextName) client.name = nextName;
      safeSend(client.socket, { type: "welcome", id: client.id, name: client.name });
      broadcastUsers();
      return;
    }

    if (message.type === "queueJoin") {
      const mode = MODE_CONFIG[message.mode] ? message.mode : "1v1";
      const planeId = Math.max(1, Math.min(1000, Number(message.planeId) || 1));
      removeFromAllQueues(client.id);
      queueByMode.get(mode).push({ id: client.id, planeId });
      sendQueueStatus(client, mode, true);
      tryStartMatch(mode);
      return;
    }

    if (message.type === "queueLeave") {
      removeFromAllQueues(client.id);
      safeSend(client.socket, { type: "queueStatus", queueing: false, mode: "", waiting: 0, needed: 0 });
      return;
    }

    const matchId = String(message.matchId || client.matchId || "");
    const match = matches.get(matchId);
    if (!match) return;

    if (message.type === "matchSync") {
      relayToMatch(match, client.id, {
        type: "matchSync",
        matchId,
        playerId: client.id,
        x: Number(message.x) || 0,
        y: Number(message.y) || 0,
        angle: Number(message.angle) || 0,
        hp: Number(message.hp) || 0,
        alive: Boolean(message.alive),
      });
      return;
    }

    if (message.type === "matchFire") {
      relayToMatch(match, client.id, {
        type: "matchFire",
        matchId,
        playerId: client.id,
        x: Number(message.x) || 0,
        y: Number(message.y) || 0,
        angle: Number(message.angle) || 0,
        damage: Number(message.damage) || 10,
      });
      return;
    }

    if (message.type === "matchHit") {
      const targetId = String(message.targetId || "");
      relayToMatch(match, client.id, {
        type: "matchHit",
        matchId,
        targetId,
        damage: Number(message.damage) || 0,
      });
      return;
    }

    if (message.type === "playerDown") {
      const playerId = String(message.playerId || client.id);
      relayToMatch(match, client.id, { type: "playerDown", matchId, playerId });
      markPlayerDown(match, playerId);
      return;
    }

    if (message.type === "matchResult") {
      const winnerTeam = Number(message.winnerTeam) || 1;
      handleRoundWin(match, winnerTeam, String(message.reason || "finished"));
    }
  });

  socket.on("close", () => {
    removeFromAllQueues(id);

    if (client.matchId) {
      const match = matches.get(client.matchId);
      if (match && !match.ended) {
        const disconnectedPlayer = match.players.find((entry) => entry.id === id);
        const winnerTeam = disconnectedPlayer ? (disconnectedPlayer.team === 1 ? 2 : 1) : 1;
        finalizeMatch(match, winnerTeam, "opponent-disconnected");
      }
    }

    clients.delete(id);
    broadcastUsers();
  });
});

console.log(`Halo Arena multiplayer server running on ws://localhost:${PORT}`);
