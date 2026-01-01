import Image from "next/image";
import styles from "./page.module.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Button } from "../components/ui/button.tsx"
import ModeToggle from "../components/ModeToggle.tsx"
import { currentUser } from "@clerk/nextjs/server"
import db from "@/lib/db"
import CreatePost from "@/components/CreatePost"
import WhoToFollow from "@/components/WhoToFollow"
import { getPosts } from "@/actions/post.action"
import PostCard from "@/components/PostCard.tsx"
import { getDbUserId } from "@/actions/user.action"

export default async function Home() {

  await db()

  const user = await currentUser()
  const posts = await getPosts()

  const dbUserId = (await getDbUserId())?.toString()


  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="lg:grid-cols-6 space-y-1">

        {user ? <CreatePost /> : null}

        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            dbUserId={dbUserId}
            image={post.image}
          />
        ))}

      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow />
      </div>

    </div>
  );
}
