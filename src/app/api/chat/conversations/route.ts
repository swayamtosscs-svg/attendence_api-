import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(sessionUser.id);

    // Get all unique conversations for the current user
    // This finds the latest message in each conversation
    const conversations = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", sessionUser.id] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalMessages: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          userName: "$user.name",
          userEmail: "$user.email",
          userRole: "$user.role",
          userDepartment: "$user.department",
          lastMessage: {
            id: "$lastMessage._id",
            content: "$lastMessage.content",
            sender: "$lastMessage.sender",
            recipient: "$lastMessage.recipient",
            read: "$lastMessage.read",
            createdAt: "$lastMessage.createdAt"
          },
          unreadCount: 1,
          totalMessages: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    // Populate sender/recipient in lastMessage
    for (const conv of conversations) {
      const senderId =
        typeof conv.lastMessage.sender === "object" && conv.lastMessage.sender !== null
          ? conv.lastMessage.sender.toString()
          : conv.lastMessage.sender;
      const recipientId =
        typeof conv.lastMessage.recipient === "object" && conv.lastMessage.recipient !== null
          ? conv.lastMessage.recipient.toString()
          : conv.lastMessage.recipient;

      conv.lastMessage.sender = await UserModel.findById(senderId)
        .select("name email role department")
        .lean();
      conv.lastMessage.recipient = await UserModel.findById(recipientId)
        .select("name email role department")
        .lean();
    }

    return jsonResponse({
      success: true,
      data: conversations
    });
  } catch (error) {
    return handleApiError("chat/get-conversations", error);
  }
}

