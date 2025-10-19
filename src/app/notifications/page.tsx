"use client"

import { useState, useEffect } from "react"
import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action"
import NotificationSkeleton from "@/components/NotificationSkeleton"
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import toast from "react-hot-toast"

type Notifications = Awaited<ReturnType<typeof getNotifications>>
type Notification = Notifications[number]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

export default function NotificationsPage() {

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)

        const unreadIds = data.filter(n => !n.read).map(n => n._id)
        if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds)
      }
      catch {
        toast.error("Couldn’t get notifications")
      }
      finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  if (isLoading) return <NotificationSkeleton />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <span className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.map((notification) => {
                const creator = notification.creator?.[0]
                const post = notification.post?.[0]
                const comment = notification.comment?.[0]

                return (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${!notification.read ? "bg-muted/50" : ""
                      }`}
                  >
                    <Avatar className="mt-1">
                      <AvatarImage src={creator?.image} />
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <span>
                          <span className="font-medium">
                            {creator?.name ?? creator?.username}
                          </span>{" "}
                          {notification.type === "FOLLOW"
                            ? "started following you"
                            : notification.type === "LIKE"
                              ? "liked your post"
                              : "commented on your post"}
                        </span>
                      </div>

                      {post && (notification.type === "LIKE" || notification.type === "COMMENT") && (
                        <div className="pl-6 space-y-2">
                          <div className="text-sm text-muted-foreground rounded-md p-2 bg-muted/30 mt-2">
                            <p>{post.content}</p>
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post content"
                                className="mt-2 rounded-md w-full max-w-[200px] h-auto object-cover"
                              />
                            )}
                          </div>

                          {notification.type === "COMMENT" && comment && (
                            <div className="text-sm p-2 bg-accent/50 rounded-md">
                              {comment.content}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground pl-6">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
