"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDB() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deceit-online';
    try {
        await mongoose_1.default.connect(mongoURI, {
            serverSelectionTimeoutMS: 3000, // Timeout fast if offline local Mongo is not active
        });
        console.log(`[DB] Connected to MongoDB: ${mongoURI}`);
    }
    catch (err) {
        console.warn(`[DB] Could not connect to MongoDB (${mongoURI}). Running with in-memory state only.`);
    }
}
