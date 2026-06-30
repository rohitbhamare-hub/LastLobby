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
      trim: true,
    },

    gameUID: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: Number,
      default: 0,
    },

    rank: {
      type: String,
      trim: true,
      default: "",
    },

    region: {
      type: String,
      trim: true,
      default: "",
    },

    preferredRole: {
      type: String,
      trim: true,
      default: "",
    },

    playStyle: {
      type: String,
      trim: true,
      default: "",
    },

    languages: {
      type: [String],
      default: [],
    },

    playTime: {
      type: String,
      trim: true,
      default: "",
    },

    lookingForMode: {
      type: String,
      enum: ["Casual", "Tournament"],
      default: "Casual",
    },

    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot create duplicate profiles for the same game
gameProfileSchema.index({ user: 1, gameName: 1 }, { unique: true });

export const GameProfile = mongoose.model("GameProfile", gameProfileSchema);