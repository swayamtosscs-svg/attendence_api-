import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import {
  validateImageFile,
  saveProfilePicture,
  deleteProfilePicture
} from "@/lib/file-utils";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return errorResponse(validation.error || "Invalid file", { status: 400 });
    }

    // Get current user
    const user = await UserModel.findById(sessionUser.id);
    if (!user) {
      return errorResponse("User not found", { status: 404 });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      await deleteProfilePicture(user.profilePicture);
    }

    // Save new profile picture
    const profilePictureUrl = await saveProfilePicture(
      sessionUser.id,
      file
    );

    // Update user
    user.profilePicture = profilePictureUrl;
    await user.save();

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        profilePicture: user.profilePicture,
        message: "Profile picture uploaded successfully"
      }
    });
  } catch (error) {
    return handleApiError("users/upload-avatar", error);
  }
}

export async function DELETE() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const user = await UserModel.findById(sessionUser.id);
    if (!user) {
      return errorResponse("User not found", { status: 404 });
    }

    // Delete profile picture file if exists
    if (user.profilePicture) {
      await deleteProfilePicture(user.profilePicture);
    }

    // Remove profile picture from user
    user.profilePicture = undefined;
    await user.save();

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        message: "Profile picture deleted successfully"
      }
    });
  } catch (error) {
    return handleApiError("users/delete-avatar", error);
  }
}


