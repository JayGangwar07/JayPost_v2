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

  const user = await User.aggregate([
    {
      $match: {
        clerkId
      }
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "following",
        as: "followers"
      }
    },
    {
      $lookup: {
        from: "follows",
        localField: "_id",
        foreignField: "followers",
        as: "following"
      }
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "author",
        as: "posts"
      }
    },
  ])

  console.log(user)

  return user

}

export async function getDbUserId() {

  const { userId: clerkId } = await auth

  if (!clerkId) throw new Error("Unauthorized")

  const user = await getUserByClerkId(clerkId)

  if (!user) throw new Error("User not found")

  return user._id

}