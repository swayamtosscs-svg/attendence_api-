import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validators";

function canManageUser(sessionUserRole: string, targetRole: string): boolean {
  if (sessionUserRole === "admin") {
    return true;
  }
  if (sessionUserRole === "manager") {
    return targetRole === "employee";
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user id", { status: 400 });
    }

    if (
      sessionUser.role !== "admin" &&
      sessionUser.id !== id &&
      sessionUser.role !== "manager"
    ) {
      return errorResponse("Forbidden", { status: 403 });
    }

    const user = await UserModel.findById(id)
      .select("-passwordHash")
      .lean();

    if (!user) {
      return errorResponse("User not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      sessionUser.id !== user.manager?.toString() &&
      sessionUser.id !== user._id.toString()
    ) {
      return errorResponse("Forbidden", { status: 403 });
    }

    return jsonResponse({ success: true, data: { ...user, id: user._id } });
  } catch (error) {
    return handleApiError("users/get", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user id", { status: 400 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.parse(body);

    await connectDB();

    const user = await UserModel.findById(id);
    if (!user) {
      return errorResponse("User not found", { status: 404 });
    }

    const canManage = canManageUser(sessionUser.role, user.role);
    const isSelfUpdate = sessionUser.id === id;

    if (!canManage && !isSelfUpdate) {
      return errorResponse("Forbidden", { status: 403 });
    }

    if (!isSelfUpdate && !canManage) {
      return errorResponse("Forbidden", { status: 403 });
    }

    if (parsed.name) user.name = parsed.name;
    if (parsed.role && canManage) user.role = parsed.role;
    if (parsed.department !== undefined) user.department = parsed.department;
    if (parsed.designation !== undefined)
      user.designation = parsed.designation;
    if (parsed.status && canManage) user.status = parsed.status;
    if (parsed.managerId !== undefined && canManage) {
      user.manager = parsed.managerId
        ? new mongoose.Types.ObjectId(parsed.managerId)
        : undefined;
    }

    await user.save();

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
        manager: user.manager,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    return handleApiError("users/update", error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin"]);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user id", { status: 400 });
    }

    await connectDB();
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      return errorResponse("User not found", { status: 404 });
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError("users/delete", error);
  }
}


