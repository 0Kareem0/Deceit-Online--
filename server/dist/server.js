"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./db/connection");
const roomHandler_1 = require("./socket/roomHandler");
const gameHandler_1 = require("./socket/gameHandler");
const RoomManager_1 = require("./socket/RoomManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use((0, cors_1.default)({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: 'deceit-online-server' });
});
// Register Socket.IO Handlers
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    (0, roomHandler_1.registerRoomHandlers)(io, socket);
    (0, gameHandler_1.registerGameHandlers)(io, socket);
});
// Start Phase Timer Ticker
RoomManager_1.RoomManager.getInstance().startPhaseTicker(io);
async function main() {
    await (0, connection_1.connectDB)();
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
