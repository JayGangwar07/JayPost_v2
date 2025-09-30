import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

likeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like =
  mongoose.models.Like || mongoose.model("Like", likeSchema);
