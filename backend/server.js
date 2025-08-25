// Simple Express + Socket.IO backend for Scrum Poker
// Splits server logic from the previous single-file prototype

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3000;

// ---------------------- In-memory State ----------------------
/**
 * rooms: {
 *   [code]: {
 *     deck: string[]
 *     deckName: string
 *     revealed: boolean
 *     topic: string
 *     ownerId: string
 *     users: Map<socketId, { name: string, vote: string|null }>
 *     createdAt: number
 *   }
 * }
 */
const rooms = new Map();

const DECKS = {
  Fibonacci: [
    "0",
    "1",
    "2",
    "3",
    "5",
    "8",
    "13",
    "21",
    "34",
    "55",
    "89",
    "☕️",
    "∞",
    "?",
  ],
  "T‑Shirt": ["XS", "S", "M", "L", "XL", "XXL", "☕️", "?"],
  "0–13": ["0", "1", "2", "3", "5", "8", "13", "☕️", "?"],
};

function shortCode(len = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++)
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  if (rooms.has(s)) return shortCode(len);
  return s;
}

function avgNumeric(votes) {
  const nums = votes.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 100) / 100;
}

function getPublicState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  const users = Array.from(room.users.entries()).map(([id, u]) => ({
    id,
    name: u.name,
    vote: room.revealed ? u.vote : u.vote ? "✔︎" : "",
    notes: u.notes || [], // always include notes
  }));

  if (room.revealed) {
    console.log("=== GET PUBLIC STATE DEBUG (REVEALED) ===");
    console.log("Users with notes:");
    users.forEach((u) => {
      console.log(`- ${u.name}:`, u.notes);
    });
    console.log("=======================================");
  }

  const votes = room.revealed ? users.map((u) => u.vote).filter(Boolean) : [];
  const stats =
    room.revealed && votes.length
      ? {
          count: votes.length,
          unique: [...new Set(votes)].length,
          average: avgNumeric(votes),
        }
      : { count: 0, unique: 0, average: null };
  return {
    code,
    deck: room.deck,
    deckName: room.deckName,
    revealed: room.revealed,
    topic: room.topic,
    ownerId: room.ownerId,
    users,
    stats,
    createdAt: room.createdAt,
  };
}

function emitState(code) {
  const state = getPublicState(code);
  if (state) io.to(code).emit("state", state);
}

// Save notes for current user
function saveNotes({ socket, code, notes }) {
  const room = rooms.get(code);
  if (!room) return;
  const u = room.users.get(socket.id);
  if (!u) return;
  if (!Array.isArray(notes) || notes.length > 50) return;
  u.notes = notes.map((s) => String(s).slice(0, 240)).slice(0, 50);

  console.log("=== SAVE NOTES DEBUG ===");
  console.log("User:", u.name);
  console.log("Notes saved:", u.notes);
  console.log("======================");

  emitState(code);
}

// ------------------------- Socket.IO -------------------------
io.on("connection", (socket) => {
  // Create room
  socket.on("createRoom", ({ name }) => {
    const cleanName = String(name || "")
      .trim()
      .slice(0, 24);
    if (!cleanName) {
      socket.emit("errorMsg", "Please enter your name.");
      return;
    }
    const code = shortCode();
    const room = {
      deck: DECKS["Fibonacci"],
      deckName: "Fibonacci",
      revealed: false,
      topic: "",
      ownerId: socket.id,
      users: new Map(),
      createdAt: Date.now(),
    };
    rooms.set(code, room);
    socket.join(code);
    room.users.set(socket.id, { name: cleanName, vote: null, notes: [] });
    socket.emit("roomCreated", { code });
    emitState(code);
  });

  // Join room
  socket.on("joinRoom", ({ code, name }) => {
    code = (code || "").toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      socket.emit("errorMsg", "Room not found.");
      return;
    }
    const cleanName = String(name || "")
      .trim()
      .slice(0, 24);
    if (!cleanName) {
      socket.emit("errorMsg", "Please enter your name.");
      return;
    }
    // Ensure name uniqueness within the room (case-insensitive)
    const nameTaken = Array.from(room.users.values()).some(
      (u) => (u.name || "").toLowerCase() === cleanName.toLowerCase()
    );
    if (nameTaken) {
      socket.emit(
        "errorMsg",
        "This name is already in use in this room. Choose a different name."
      );
      return;
    }
    socket.join(code);
    room.users.set(socket.id, { name: cleanName, vote: null, notes: [] });
    emitState(code);
  });

  // Set topic
  socket.on("setTopic", ({ code, topic }) => {
    const room = rooms.get(code);
    if (!room) return;
    if (room.ownerId !== socket.id) return; // only owner
    room.topic = String(topic || "").slice(0, 120);
    emitState(code);
  });

  // Change deck
  socket.on("setDeck", ({ code, deckName, custom }) => {
    const room = rooms.get(code);
    if (!room) return;
    if (room.ownerId !== socket.id) return; // only owner
    if (deckName && DECKS[deckName]) {
      room.deck = DECKS[deckName];
      room.deckName = deckName;
    } else if (custom && Array.isArray(custom) && custom.length) {
      room.deck = custom.map(String).slice(0, 24);
      room.deckName = "Custom";
    }
    // clear votes when deck changes
    for (const u of room.users.values()) u.vote = null;
    room.revealed = false;
    emitState(code);
  });

  // Cast vote
  socket.on("cast", ({ code, value }) => {
    const room = rooms.get(code);
    if (!room) return;
    const u = room.users.get(socket.id);
    if (!u) return;
    if (!room.deck.includes(String(value))) return; // invalid card
    u.vote = String(value);
    emitState(code);
  });

  // Clear own vote
  socket.on("clearVote", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    const u = room.users.get(socket.id);
    if (!u) return;
    u.vote = null;
    emitState(code);
  });

  // Save notes for current user
  socket.on("saveNotes", ({ code, notes }) =>
    saveNotes({ socket, code, notes })
  );

  // Reveal
  socket.on("reveal", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;

    if (room.ownerId !== socket.id) return;

    console.log("=== REVEAL DEBUG ===");
    console.log("Room code:", code);
    console.log("Room users with notes:");
    for (const [socketId, user] of room.users.entries()) {
      console.log(`- ${user.name} (${socketId}):`, user.notes || "no notes");
    }
    console.log("==================");

    room.revealed = true;
    emitState(code);
  });

  // Reset votes
  socket.on("reset", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    if (room.ownerId !== socket.id) return;
    for (const u of room.users.values()) {
      u.vote = null;
      u.notes = []; // Clear notes on reset
    }
    room.revealed = false;
    room.topic = ""; // Clear topic on reset
    emitState(code);
  });

  // Request sync
  socket.on("sync", ({ code }) => emitState(code));

  // Leave room (optional)
  socket.on("leaveRoom", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.users.delete(socket.id);
    socket.leave(code);
    if (room.users.size === 0) {
      rooms.delete(code);
    } else if (room.ownerId === socket.id) {
      // promote first user
      room.ownerId = room.users.keys().next().value;
    }
    if (rooms.has(code)) emitState(code);
  });

  socket.on("disconnect", () => {
    // Remove user from any rooms they were in
    for (const [code, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(code);
          continue;
        }
        if (room.ownerId === socket.id) {
          room.ownerId = room.users.keys().next().value;
        }
        emitState(code);
      }
    }
  });
});

// --------------------------- HTTP ----------------------------
app.get("/health", (_, res) => res.json({ ok: true }));

// Serve production build of frontend if available
const distPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(distPath));
// Catch-all to serve index.html for client-side routing without Express path patterns
app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  if (req.method !== "GET") return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) next();
  });
});

server.listen(PORT, () => {
  console.log(`Scrum Poker backend running at http://localhost:${PORT}`);
});
