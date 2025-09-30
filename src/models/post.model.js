import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String },
    content: { type: String },
  },
  { timestamps: true }
);

export const Post =
  mongoose.models.Post || mongoose.model("Post", postSchema);
