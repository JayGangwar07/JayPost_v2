"use client"

import { Home, Bell } from "lucide-react"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default function BottomBar() {
  return (
    <div className="h-12 fixed bottom-0 left-0 right-0 bg-black text-white border-t border-neutral-800 flex justify-between items-center px-8 py-2 sm:hidden">

      {/* Home */}
      <Link href="/" className="text-gray-400 hover:text-white transition">
        <Home className="h-6 w-6" />
      </Link>

      {/* Notifications (centered) */}
      <Link
        href="/notifications"
        className="absolute left-1/2 -translate-x-1/2 text-gray-400 hover:text-white transition"
      >
        <Bell className="h-7 w-7" />
      </Link>

      {/* Clerk Profile */}
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-6 w-6",
            },
          }}
          afterSignOutUrl="/"
        />
      </div>
    </div>
  )
}
