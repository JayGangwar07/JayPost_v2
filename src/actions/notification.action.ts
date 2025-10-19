"use server"

import { getDbUserId } from "./user.action"
import { Notification } from "@/models/notification.model"
import db from "@/lib/db"

await db()

export async function getNotifications() {

  // Steps:-
  // get reciever _id
  // aggregate and get all notifications

  // _id of reciever
  const userId = await getDbUserId()
  if (!userId) return

  const notifications = await Notification.aggregate([
    {
      $match: {
        user: userId
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator"
      }
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "post"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "comment"
      }
    },
    {
      $sort: { createdAt: -1 }
    },
  ])

  //console.log(notifications)

  return JSON.parse(JSON.stringify(notifications))


}


export async function markNotificationsAsRead(notificationIds) {

  try {
    if (notificationIds?.length === 0) return

    await Notification.updateMany(
      {
        _id: {
          $in: notificationIds
        }
      },
      {
        $set: {
          read: true
        }
      }
    )



    return { success: true }

  }

  catch (err) {
    console.error(err)
    throw new Error("Couldn't mark notifications as read")
  }

}