"use server"

import { User } from "@/models/user.model.js"
import { Post } from "@/models/post.model.js"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDbUserId } from "./user.action"
import { revalidatePath } from "next/cache"

export async function createPost(content, imageUrl) {

  try {
    const userId = await getDbUserId()

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
      err
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

    return posts

  }

  catch (err) {
    console.error(err)
    return {
      success: false
    }
  }

}