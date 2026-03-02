const WebSocket = require("ws");
const crypto = require("crypto");
const http = require("http");
const path = require("path");
const express = require("express");
const Stripe = require("stripe");

const PORT = Number(process.env.PORT || 8080);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const SHOP_PAYMENT_PROVIDER = String(process.env.SHOP_PAYMENT_PROVIDER || "stripe").toLowerCase();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const SHOP_ITEMS = {
  "plane-100": { id: "plane-100", name: "Plane #100", priceNis: 4 },
  "plane-500": { id: "plane-500", name: "Plane #500", priceNis: 7 },
  "plane-800": { id: "plane-800", name: "Plane #800", priceNis: 8 },
  "plane-1000": { id: "plane-1000", name: "Plane #1000", priceNis: 10 },
  "coins-50000": { id: "coins-50000", name: "50,000 Coins", priceNis: 5 },
  "coins-100000": { id: "coins-100000", name: "100,000 Coins", priceNis: 10 },
  "coins-500000": { id: "coins-500000", name: "500,000 Coins", priceNis: 15 },
  "coins-1000000": { id: "coins-1000000", name: "1,000,000 Coins", priceNis: 20 },
};

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname)));

app.get("/api/shop/config", (_req, res) => {
  const provider = SHOP_PAYMENT_PROVIDER === "google_play" ? "google_play" : "stripe";
  res.json({
    provider,
    enabled: provider === "google_play"
      ? true
      : Boolean(stripe && STRIPE_PUBLISHABLE_KEY),
    publishableKey: STRIPE_PUBLISHABLE_KEY || "",
  });
});

app.post("/api/shop/create-checkout-session", async (req, res) => {
  if (SHOP_PAYMENT_PROVIDER === "google_play") {
    res.status(409).json({ error: "Checkout session is disabled in google_play mode" });
    return;
  }

  if (!stripe || !STRIPE_PUBLISHABLE_KEY) {
    res.status(503).json({ error: "Shop is not configured" });
    return;
  }

  const shopItemId = String(req.body?.shopItemId || "");
  const firstName = String(req.body?.firstName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();

  if (firstName.length < 2) {
    res.status(400).json({ error: "Missing or invalid first name" });
    return;
  }
  if (!email.includes("@") || email.length < 5) {
    res.status(400).json({ error: "Missing or invalid email" });
    return;
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    res.status(400).json({ error: "Missing or invalid phone" });
    return;
  }

  const item = SHOP_ITEMS[shopItemId];
  if (!item) {
    res.status(400).json({ error: "Invalid shop item" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_creation: "always",
      customer_email: email,
      phone_number_collection: {
        enabled: true,
      },
      billing_address_collection: "required",
      custom_fields: [
        {
          key: "first_name",
          label: {
            type: "custom",
            custom: "First name",
          },
          type: "text",
          text: {
            minimum_length: 2,
            maximum_length: 40,
          },
          optional: false,
        },
      ],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "ils",
            unit_amount: Math.round(item.priceNis * 100),
            product_data: {
              name: item.name,
              description: `Halo Arena purchase: ${item.id}`,
            },
          },
        },
      ],
      metadata: {
        shopItemId: item.id,
        firstName,
        email,
        phone,
      },
      success_url: `${BASE_URL}/halo-arena.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/halo-arena.html?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to create checkout session" });
  }
});

app.post("/api/shop/verify-session", async (req, res) => {
  if (!stripe || !STRIPE_PUBLISHABLE_KEY) {
    res.status(503).json({ error: "Shop is not configured" });
    return;
  }

  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const shopItemId = String(session.metadata?.shopItemId || "");

    res.json({
      paid,
      sessionId,
      shopItemId,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Failed to verify session" });
  }
});

const server = http.createServer(app);
const MODE_CONFIG = {
  "1v1": { teamSize: 1, rewardCoins: 50, mapScale: 1 },
  "2v2": { teamSize: 2, rewardCoins: 100, mapScale: 1 },
  "3v3": { teamSize: 3, rewardCoins: 100, mapScale: 2 },
  "4v4": { teamSize: 4, rewardCoins: 100, mapScale: 2 },
};
const MATCH_TARGET_POINTS = 5;

const wss = new WebSocket.Server({ server });
const clients = new Map();
const queueByMode = new Map(Object.keys(MODE_CONFIG).map((mode) => [mode, []]));
const matches = new Map();
const invites = new Map();

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

function startMatchFromEntries(mode, selectedEntries) {
  const config = MODE_CONFIG[mode];
  if (!config) return false;

  const needed = config.teamSize * 2;
  if (!Array.isArray(selectedEntries) || selectedEntries.length < needed) {
    return false;
  }

  const liveSelected = selectedEntries
    .map((entry) => ({ client: clients.get(entry.id), planeId: entry.planeId }))
    .filter((entry) => entry.client)
    .slice(0, needed);

  if (liveSelected.length < needed) {
    return false;
  }

  liveSelected.forEach((entry) => removeFromAllQueues(entry.client.id));

  const matchId = crypto.randomUUID();
  const { team1, team2 } = createSpawns(config);
  const players = [];

  for (let i = 0; i < liveSelected.length; i += 1) {
    const { client, planeId } = liveSelected[i];
    const team = i < config.teamSize ? 1 : 2;
    const teamIndex = team === 1 ? i : i - config.teamSize;
    const spawn = team === 1 ? team1[teamIndex] : team2[teamIndex];

    players.push({
      id: client.id,
      name: client.name,
      team,
      planeId: Math.max(1, Math.min(1000, Number(planeId) || 1)),
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

  return true;
}

function entryPlane(clientId, entries) {
  const entry = entries.find((item) => item.id === clientId);
  return entry ? entry.planeId : 1;
}

function tryStartMatch(mode) {
  const config = MODE_CONFIG[mode];
  if (!config) return;

  const queue = queueByMode.get(mode) || [];
  const needed = config.teamSize * 2;
  if (queue.length < needed) return;

  const selected = queue.slice(0, needed);
  queueByMode.set(mode, queue.slice(needed));

  const ok = startMatchFromEntries(mode, selected);
  if (!ok) {
    selected.forEach((entry) => {
      if (clients.has(entry.id)) {
        queueByMode.get(mode).push(entry);
      }
    });
  }
}

function relayToMatch(match, senderId, payload) {
  for (const player of match.players) {
    if (senderId && player.id === senderId) continue;
    const client = clients.get(player.id);
    if (!client) continue;
    safeSend(client.socket, payload);
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

function inviteKey(fromId, toId) {
  return `${fromId}::${toId}`;
}

function clearInvitesForClient(clientId) {
  for (const [key, value] of invites.entries()) {
    if (value.fromId === clientId || value.toId === clientId) {
      invites.delete(key);
    }
  }
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

    if (message.type === "inviteByName") {
      if (client.matchId) {
        safeSend(client.socket, { type: "inviteError", message: "You are already in a match" });
        return;
      }

      const targetName = String(message.targetName || "").trim().toLowerCase();
      if (!targetName) {
        safeSend(client.socket, { type: "inviteError", message: "Target name is empty" });
        return;
      }

      const target = Array.from(clients.values()).find(
        (entry) => entry.id !== client.id && entry.name.trim().toLowerCase() === targetName
      );

      if (!target) {
        safeSend(client.socket, { type: "inviteError", message: "Player not found or not connected" });
        return;
      }

      if (target.matchId) {
        safeSend(client.socket, { type: "inviteError", message: "Player is already in a match" });
        return;
      }

      const planeId = Math.max(1, Math.min(1000, Number(message.planeId) || 1));
      invites.set(inviteKey(client.id, target.id), { fromId: client.id, toId: target.id, planeId });
      safeSend(target.socket, {
        type: "invite",
        fromId: client.id,
        fromName: client.name,
        planeId,
      });
      return;
    }

    if (message.type === "inviteResponse") {
      const fromId = String(message.fromId || "");
      const key = inviteKey(fromId, client.id);
      const invite = invites.get(key);
      if (!invite) {
        safeSend(client.socket, { type: "inviteError", message: "Invite expired" });
        return;
      }
      invites.delete(key);

      const inviter = clients.get(fromId);
      if (!inviter) {
        safeSend(client.socket, { type: "inviteError", message: "Inviter disconnected" });
        return;
      }

      if (!message.accepted) {
        safeSend(inviter.socket, { type: "inviteDeclined", byName: client.name });
        return;
      }

      if (inviter.matchId || client.matchId) {
        safeSend(client.socket, { type: "inviteError", message: "Cannot start invite match now" });
        safeSend(inviter.socket, { type: "inviteError", message: "Cannot start invite match now" });
        return;
      }

      const acceptPlane = Math.max(1, Math.min(1000, Number(message.planeId) || 1));
      const ok = startMatchFromEntries("1v1", [
        { id: inviter.id, planeId: invite.planeId },
        { id: client.id, planeId: acceptPlane },
      ]);

      if (!ok) {
        safeSend(client.socket, { type: "inviteError", message: "Failed to start match" });
        safeSend(inviter.socket, { type: "inviteError", message: "Failed to start match" });
      }
      return;
    }

    if (message.type === "queueJoin") {
      const mode = MODE_CONFIG[message.mode] ? message.mode : "1v1";
      const planeId = Math.max(1, Math.min(1000, Number(message.planeId) || 1));
      removeFromAllQueues(client.id);
  clearInvitesForClient(client.id);
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
  clearInvitesForClient(id);

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

server.listen(PORT, () => {
  console.log(`Halo Arena server running on ${BASE_URL}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Shop payment provider: ${SHOP_PAYMENT_PROVIDER}`);
  if (SHOP_PAYMENT_PROVIDER !== "google_play" && (!stripe || !STRIPE_PUBLISHABLE_KEY)) {
    console.log("Stripe shop is disabled. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to enable real payments.");
  }
});
