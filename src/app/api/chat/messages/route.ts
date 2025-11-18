import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { sendMessageSchema, getMessagesQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = getMessagesQuerySchema.parse(searchParams);

    const { userId, limit = 50, before } = parsed;

    // Get messages where user is sender or recipient
    const filter: Record<string, unknown> = {
      $or: [{ sender: sessionUser.id }, { recipient: sessionUser.id }]
    };

    // If userId provided, get conversation between current user and that user
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return errorResponse("Invalid user id", { status: 400 });
      }

      filter.$or = [
        { sender: sessionUser.id, recipient: userId },
        { sender: userId, recipient: sessionUser.id }
      ];
    }

    // Pagination: get messages before a certain date
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await MessageModel.find(filter)
      .populate("sender", "name email role department")
      .populate("recipient", "name email role department")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return jsonResponse({
      success: true,
      data: messages.map((msg) => ({
        id: msg._id,
        sender: msg.sender,
        recipient: msg.recipient,
        content: msg.content,
        read: msg.read,
        readAt: msg.readAt,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    return handleApiError("chat/get-messages", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(parsed.recipientId)) {
      return errorResponse("Invalid recipient id", { status: 400 });
    }

    // Don't allow sending message to self
    if (parsed.recipientId === sessionUser.id) {
      return errorResponse("Cannot send message to yourself", { status: 400 });
    }

    await connectDB();

    // Verify recipient exists
    const recipient = await UserModel.findById(parsed.recipientId);
    if (!recipient) {
      return errorResponse("Recipient not found", { status: 404 });
    }

    const message = await MessageModel.create({
      sender: sessionUser.id,
      recipient: parsed.recipientId,
      content: parsed.content.trim()
    });

    await message.populate("sender", "name email role department");
    await message.populate("recipient", "name email role department");

    return jsonResponse(
      {
        success: true,
        data: {
          id: message._id,
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          read: message.read,
          createdAt: message.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("chat/send-message", error);
  }
}


