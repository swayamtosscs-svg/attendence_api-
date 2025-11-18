import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import MessageModel from "@/models/Message";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid message id", { status: 400 });
    }

    await connectDB();

    const message = await MessageModel.findById(id);

    if (!message) {
      return errorResponse("Message not found", { status: 404 });
    }

    // Only recipient can mark message as read
    if (message.recipient.toString() !== sessionUser.id) {
      return errorResponse("Forbidden", { status: 403 });
    }

    // Mark as read if not already read
    if (!message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }

    await message.populate("sender", "name email role department");
    await message.populate("recipient", "name email role department");

    return jsonResponse({
      success: true,
      data: {
        id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        read: message.read,
        readAt: message.readAt,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    return handleApiError("chat/mark-read", error);
  }
}


