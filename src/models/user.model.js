import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    name: { type: String },
    bio: { type: String },
    image: { type: String },
    location: { type: String },
    website: { type: String },
    clerkId: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
