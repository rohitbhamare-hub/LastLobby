import mongoose from "mongoose";

const playerRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameProfile",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxLength: 200,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster lookups when querying sent/received requests
playerRequestSchema.index({ sender: 1 });
playerRequestSchema.index({ receiver: 1 });
playerRequestSchema.index({ sender: 1, receiver: 1, gameProfile: 1, status: 1 });

export const PlayerRequest = mongoose.model("PlayerRequest", playerRequestSchema);
