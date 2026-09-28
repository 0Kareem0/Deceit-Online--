import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStats {
  gamesPlayed: number;
  kingdomWins: number;
  shadowWins: number;
  neutralWins: number;
}

export interface IUser extends Document {
  username: string;
  name: string;
  gender: string;
  stats: IUserStats;
  createdAt: Date;
  updatedAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>(
  {
    gamesPlayed: { type: Number, default: 0 },
    kingdomWins: { type: Number, default: 0 },
    shadowWins: { type: Number, default: 0 },
    neutralWins: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    gender: { type: String, default: 'male' },
    stats: { type: UserStatsSchema, default: () => ({ gamesPlayed: 0, kingdomWins: 0, shadowWins: 0, neutralWins: 0 }) },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
