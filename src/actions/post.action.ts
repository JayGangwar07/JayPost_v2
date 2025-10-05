"use server"

import { User } from "@/models/user.model.js"
import { Post } from "@/models/post.model.js"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDbUserId } from "./user.action"
import { revalidatePath } from "next/cache"

export async function createPost(content, imageUrl) {

  /*const { userId } = await auth()
  
  const user = await currentUser()
  
  if (!userId || !user) throw new Error("post.action.ts: User Not Found")
  
  const dbUser = await User.findOne({
    $or: [
      { clerkId: userId },
      { email: user.emailAddresses[0].emailAddress }
    ]
  })
  
  if (!dbUser) throw new Error("postaction: User not found")
  
  const post = await Post.create({
    content,
    image: imageUrl,
    author: dbUser._id
  })
  
  console.log(post)*/

  try {
    const userId = await getDbUserId()

    const post = await Post.create({
      content,
      author: userId,
      image: imageUrl
    })

    revalidatePath("/")

    console.log("Post: ", post)

    return {success: true}

  }

  catch (err) {
    console.error("Post Creation Failed: ", err)
    return {
      success: false,
      err
    }
  }

}