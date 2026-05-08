import mongoose from "mongoose";

const runnerSchema = new mongoose.Schema({
  selectionId: String,
  name: String,
  status: { type: String, default: "ACTIVE" },
  result: { type: String, enum: ["WINNER", "LOSER", null], default: null }
}, { _id: false });

const marketSchema = new mongoose.Schema({
  marketId: { type: String, unique: true, index: true, required: true },
  eventName: String,
  marketName: String,
  status: { type: String, enum: ["OPEN", "SUSPENDED", "CLOSED", "SETTLED"], default: "OPEN" },
  startTime: Date,
  runners: [runnerSchema],
  version: { type: Number, default: 0 }
}, { timestamps: true });

export interface IRunner {
  selectionId: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  result: "WINNER" | "LOSER" | null;
}

export interface IMarket extends mongoose.Document {
  marketId: string;
  eventName: string;
  marketName: string;
  status: "OPEN" | "SUSPENDED" | "CLOSED" | "SETTLED";
  startTime: Date;
  runners: IRunner[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const Market = mongoose.model<IMarket>("Market", marketSchema);
