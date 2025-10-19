"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { getDbUserId } from "./user.action"
import { User } from "@/models/user.model"
import { Post } from "@/models/post.model"
import { Like } from "@/models/like.model"
import { Follows } from "@/models/follows.model"
import db from "@/lib/db"

await db()

export async function getProfileByUsername(username) {

  const userId = await getDbUserId()

  const result = await User.aggregate([
    {
      $match: {
        _id: userId
      }
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "following",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "follower",
        as: "following",
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "author",
        as: "posts",
      },
    },
    {
      $addFields: {
        _count: {
          followers: { $size: "$followers" },
          following: { $size: "$following" },
          posts: { $size: "$posts" },
        },
      },
    },
  ])

  return JSON.parse(JSON.stringify(result))
}

export async function getUserPosts(userId) {

  const result = await Post.aggregate([
    {
      $match: {
        author: userId
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "post",
        as: "comments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author"
            }
          },
          {
            $sort: {
              "createdAt": 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likes"
      }
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" },
        likesCount: { $size: "$likes" }
      }
    },
    {
      $sort: {
        "createdAt": -1
      }
    }
  ])

  return JSON.parse(JSON.stringify(result))
}

export async function getUserLikedPosts(userId) {

  const result = await Like.aggregate([
    {
      $match: {
        user: userId
      }
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "posts"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "post",
        as: "comments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author"
            }
          },
          {
            $sort: {
              "createdAt": 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likes"
      }
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" },
        likesCount: { $size: "$likes" }
      }
    },
    {
      $sort: {
        "createdAt": -1
      }
    }
  ])

  return JSON.parse(JSON.stringify(result))
}

export async function updateProfile(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { name, bio, location, website },
      { new: true }
    ).lean();

    if (!user) throw new Error("User not found");

    revalidatePath("/profile");
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getDbUserId();
    if (!currentUserId) return false;

    const follow = await Follows.findOne({
      followerId: currentUserId,
      followingId: userId,
    }).lean();

    return !!follow;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}
