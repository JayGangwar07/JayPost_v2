"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { User } from "@/models/user.model.js"
import { Follows } from "@/models/follows.model.js"
import { Notification } from "@/models/notification.model.js"
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

export async function getAllFollowers() {

  const userId = await getDbUserId()

  if (!userId) console.log("User Not Found")

  const followers = await Follows.aggregate([
    {
      $match: {
        following: userId
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "followers"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "usersFollowing"
      }
    },
  ])

  return followers
}

export async function getRandomUsers() {

  const userId = await getDbUserId()

  if (!userId) {
    console.log("User Not Found")
    return []
  }

  const followers = await getAllFollowers()

  let targetIds = []
  for (let i = 0; i < followers.length; i++) {
    targetIds.push(followers[i].follower)
  }

  const user = await User.aggregate([
    {
      $match: {
        $and: [
          { _id: { $ne: userId } },       // exclude yourself
          { _id: { $nin: targetIds } }    // exclude the ones you follow
        ]
      }
    },
    { $sample: { size: 3 } }
  ])

  return user
}

export async function toggleFollow(id: string) {

  try {
    // id = user to follow

    // Current User
    const userId = await getDbUserId()

    if (userId === id) return { success: false, message: "You cannot follow yourself" }


    if (userId == id) console.error("You can't follow yourself")

    const alreadyFollowing = await Follows.findOne({
      follower: userId,
      following: id
    })


    if (alreadyFollowing) {
      await Follows.deleteOne({
        follower: userId,
        following: id
      })
      return {
        success: true,
        unfollowed: true
      }
    }

    const follow = await Follows.create({
      follower: userId,
      following: id
    })

    const notification = await Notification.create({
      user: id,
      creator: userId,
      type: "FOLLOW"
    })
    
    if (!follow || !notification) throw new Error("Couldn't create follow or notification")

    console.log(follow, notification)

    return {
      success: true,
      followed: true
    }
  }

  catch (err) {
    console.error(err)
    return { success: false, error: "Something went wrong in toggleFollow()" }
  }

}