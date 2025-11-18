import { connectDB } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import UserModel from "@/models/User";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }
    await connectDB();

    const user = await UserModel.findById(sessionUser.id).lean();
    if (!user) {
      return errorResponse("User not found", { status: 404 });
    }

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        status: user.status,
        profilePicture: user.profilePicture,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    return handleApiError("auth/me", error);
  }
}


