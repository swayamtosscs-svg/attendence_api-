import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import MessageModel from "@/models/Message";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    await connectDB();

    const filter: Record<string, unknown> = {
      recipient: sessionUser.id,
      read: false
    };

    // Mark all messages from a specific user as read
    if (userIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return errorResponse("Invalid user id", { status: 400 });
      }
      filter.sender = userIdParam;
    }

    const result = await MessageModel.updateMany(filter, {
      $set: { read: true, readAt: new Date() }
    });

    return jsonResponse({
      success: true,
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (error) {
    return handleApiError("chat/mark-all-read", error);
  }
}


