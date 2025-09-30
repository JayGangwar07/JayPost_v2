import mongoose from "mongoose";

const followsSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

followsSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follows =
  mongoose.models.Follows || mongoose.model("Follows", followsSchema);
