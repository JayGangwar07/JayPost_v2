"use server"

import { User } from "@/models/user.model.js"
import { Post } from "@/models/post.model.js"
import { auth, currentUser } from "@clerk/nextjs/server"

export async function createPost(content, imageUrl) {

  const { userId } = await auth()

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
  
  console.log(post)

  return {
  _id: post._id.toString(),
  content: post.content,
  image: post.image,
  author: post.author.toString(),
  createdAt: post.createdAt?.toISOString(),
  updatedAt: post.updatedAt?.toISOString(),
}


}