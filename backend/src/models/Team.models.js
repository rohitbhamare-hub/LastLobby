import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    game: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },
    teamType: {
      type: String,
      enum: ["Casual", "Tournament"],
      default: "Casual",
    },
    maxMembers: {
      type: Number,
      default: 5,
      min: 2,
    },
    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Leader", "Co-Leader", "Member"],
          default: "Member",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
teamSchema.index({ game: 1 });

export const Team = mongoose.model("Team", teamSchema);
