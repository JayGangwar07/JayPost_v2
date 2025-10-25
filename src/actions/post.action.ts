"use server"

import { User } from "@/models/user.model.js"
import { Post } from "@/models/post.model.js"
import { Like } from "@/models/like.model.js"
import { Notification } from "@/models/notification.model.js"
import { Comment } from "@/models/comment.model.js"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDbUserId } from "./user.action"
import { revalidatePath } from "next/cache"
import mongoose from "mongoose"

export async function createPost(content, imageUrl) {
  
  console.log(imageUrl)

  try {
    const userId = await getDbUserId()
    if (!userId) return { success: false }

    const post = await Post.create({
      content,
      author: userId,
      image: imageUrl
    })

    revalidatePath("/")

    console.log("Post: ", post)

    return { success: true }

  }

  catch (err) {
    console.error("Post Creation Failed: ", err)
    return {
      success: false,
    }
  }

}

export async function getPosts() {

  try {

    const posts = await Post.aggregate([
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

    const safePosts = JSON.parse(JSON.stringify(posts));

    return safePosts;


  }

  catch (err) {
    console.error(err)
    return {
      success: false
    }
  }

}

export async function toggleLike(postId) {

  const userId = await getDbUserId()
  if (!userId) return

  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    const post = await Post.findOne({
      _id: postId
    })

    if (!post) throw new Error("Couldn't Find Error")

    const existingLike = await Like.findOne({
      post: postId,
      user: userId,
    })

    if (existingLike) {
      // Unlike

      await Like.deleteOne({
        post: postId,
        user: userId
      })

      return {
        success: true,
        unliked: true
      }

    }

    else {
      // Like

      await Like.create([{
        post: postId,
        user: userId
      }], { session })

      if (!post.author.equals(userId)) {
        await Notification.create([{
          user: post.author, // Reciever
          creator: userId, // Person who liked
          type: "LIKE",
          post: postId
        }], { session })
      }

      await session.commitTransaction()
      session.endSession()

      revalidatePath("/")


      return {
        success: true,
        liked: true
      }

    }

  }

  catch (err) {
    await session.abortTransaction()
    session.endSession()

    console.log("toggleLike error: ", err)
    return { success: false }
  }

}

export async function createComment(postId: string, content: string) {

  const userId = await getDbUserId()
  if (!userId) return

  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    const post = await Post.findById(postId).session(session)

    const createdComment = await Comment.create(
      [
        {
          content,
          author: userId,
          post: postId,
        },
      ],
      { session }
    );

    // Send notification 
    if (!post.author.equals(userId)) {

      await Notification.create(
        [
          {
            user: post.author, // receiver
            creator: userId,
            type: "COMMENT",
            comment: createdComment[0]._id,
          },
        ],
        { session }
      );

    }

    await session.commitTransaction()
    session.endSession()

    revalidatePath("/")

    return { success: true }

  }

  catch (err) {
    await session.abortTransaction()
    session.endSession()
    console.error("createComment error: ", err)
    return { success: false }
  }

}

export async function deletePost(postId: string) {

  try {

    const userId = await getDbUserId()

    if (!userId) return

    const post = await Post.findById(postId)

    if (!post) throw new Error("Post not found")

    console.log("UserId: ", userId)
    console.log("author: ", post.author)

    // if (userId.toString() !== post.author.toString()) throw new Error("Unauthorized")

    if (!post.author.equals(userId)) {
      throw new Error("Unauthorized");
    }

    await Post.findByIdAndDelete(postId)

    revalidatePath("/")

    return {
      success: true
    }

  }

  catch (err) {
    console.log("deletePost error: ", err)
    return {
      success: false,
      error: err
    }
  }

}