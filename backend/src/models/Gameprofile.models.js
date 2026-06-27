import mongoose from "mongoose";

const gameProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gameName: {
      type: String,
      required: true,
    },

    gameUID: {
      type: String,
      required: true,
    },

    level: {
      type: Number,
    },

    rank: {
      type: String,
    },

    region: {
      type: String,
    },

    language: {
      type: [String],
      default: [],
    },

    playStyle: {
      type: String,
    },

    availability: {
      type: String,
    },

    isLookingForPlayers: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const GameProfile = mongoose.model("GameProfile",gameProfileSchema);