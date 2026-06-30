import mongoose from "mongoose";

const teamRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["JoinRequest", "Invitation"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
teamRequestSchema.index({ team: 1 });
teamRequestSchema.index({ user: 1 });
teamRequestSchema.index({ team: 1, user: 1, type: 1, status: 1 });

export const TeamRequest = mongoose.model("TeamRequest", teamRequestSchema);
