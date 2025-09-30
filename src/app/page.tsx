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
import db from "@/lib/db.ts"
import CreatePost from "@/components/CreatePost.tsx"

export default function Home() {

  db()

  const user = currentUser()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
      <div className="lg:grid-cols-6">
        {user ? <CreatePost /> : null}
      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        Who To Follow
      </div>

    </div>
  );
}
