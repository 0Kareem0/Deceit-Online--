import mongoose, { Schema, Document } from 'mongoose';
import { Faction } from '@deceit/shared';

export interface IMatchPlayer {
  id: string;
  name: string;
  gender?: string;
  roleId: string;
  roleName: string;
  faction: Faction;
  isAlive: boolean;
  isBot?: boolean;
}

export interface IMatchHistory extends Document {
  roomId: string;
  winningFaction: Faction;
  winnerMessage: string;
  players: IMatchPlayer[];
  totalRounds: number;
  durationSeconds: number;
  createdAt: Date;
}

const MatchPlayerSchema = new Schema<IMatchPlayer>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String },
    roleId: { type: String, required: true },
    roleName: { type: String, required: true },
    faction: { type: String, required: true },
    isAlive: { type: Boolean, required: true },
    isBot: { type: Boolean, default: false },
  },
  { _id: false }
);

const MatchHistorySchema = new Schema<IMatchHistory>(
  {
    roomId: { type: String, required: true, index: true },
    winningFaction: { type: String, required: true },
    winnerMessage: { type: String, required: true },
    players: [MatchPlayerSchema],
    totalRounds: { type: Number, default: 1 },
    durationSeconds: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const MatchHistoryModel = mongoose.model<IMatchHistory>('MatchHistory', MatchHistorySchema);
