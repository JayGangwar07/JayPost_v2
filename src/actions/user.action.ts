"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { User } from "@/models/user.model.js"
import db from "@/lib/db.ts"

db()

export async function syncUser() {
  try {
    const { userId } = await auth()

    const user = await currentUser()

    if (!userId || !user) return;


    const existingUser = await User.findOne({
      $or: [
        { clerkId: userId },
        { email: user.emailAddresses[0].emailAddress }
      ]
    })


    console.log(existingUser)

    if (existingUser) return existingUser

    const createdUser = await User.create({
      clerkId: userId,
      name: `${user.firstName || ""} ${user.lastName || ""}`,
      username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
      email: user.emailAddresses[0].emailAddress,
      image: user.imageUrl,
    })

    return createdUser

  }
  catch (err) {
    console.log("Error in syncUser: ", err)
  }
}

export async function getUserByClerkId(clerkId: string) {

  const user = await currentUser()

  const result = await User.aggregate([
    {
      $match: {
        $or: [
          { clerkId },
          { email: user.emailAddresses[0].emailAddress }
        ]
      },
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
    {
      $project: {
        username: 1,
        email: 1,
        name: 1,
        bio: 1,
        image: 1,
        location: 1,
        website: 1,
        followers: 1,
        following: 1,
        posts: 1,
      },
    },
  ]);

  return result[0] || null;
}


export async function getDbUserId() {
  
  const { userId: clerkId } = await auth()

  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId)

  if (!user) throw new Error("User not found")

  return user._id;
}
