import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connection';
import { registerRoomHandlers } from './socket/roomHandler';
import { registerGameHandlers } from './socket/gameHandler';
import { RoomManager } from './socket/RoomManager';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

import { MatchHistoryModel } from './db/models/MatchHistory';
import { UserModel } from './db/models/User';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'deceit-online-server' });
});

// Recent match history endpoint
app.get('/api/history', async (req, res) => {
  try {
    const history = await MatchHistoryModel.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch match history' });
  }
});

// User statistics endpoint
app.get('/api/stats/:username', async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user stats' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topPlayers = await UserModel.find()
      .sort({ 'stats.gamesPlayed': -1 })
      .limit(10);
    res.json({ success: true, leaderboard: topPlayers });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Register Socket.IO Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
});

// Start Phase Timer Ticker
RoomManager.getInstance().startPhaseTicker(io);

async function main() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  DECEIT SERVER RUNNING ON http://localhost:${PORT}`);
    console.log(`  Allowed Client Origin: ${CLIENT_ORIGIN}`);
    console.log(`====================================================`);
  });
}

main().catch((err) => {
  console.error('[Server Error]', err);
});
