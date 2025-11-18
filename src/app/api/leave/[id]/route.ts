import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import LeaveRequestModel from "@/models/LeaveRequest";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { leaveDecisionSchema } from "@/lib/validators";

function ensureObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid identifier");
  }
  return new mongoose.Types.ObjectId(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const leaveId = ensureObjectId(params.id);
    await connectDB();

    const leave = await LeaveRequestModel.findById(leaveId)
      .populate("user", "name email role manager")
      .populate("manager", "name email role")
      .lean();

    if (!leave) {
      return errorResponse("Leave request not found", { status: 404 });
    }

    if (sessionUser.role === "employee") {
      if (leave.user._id.toString() !== sessionUser.id) {
        return errorResponse("Forbidden", { status: 403 });
      }
    } else if (sessionUser.role === "manager") {
      const userManager = leave.user.manager?.toString();
      if (
        leave.user._id.toString() !== sessionUser.id &&
        userManager !== sessionUser.id
      ) {
        return errorResponse("Forbidden", { status: 403 });
      }
    }

    return jsonResponse({ success: true, data: { ...leave, id: leave._id } });
  } catch (error) {
    return handleApiError("leave/get", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const leaveId = ensureObjectId(params.id);
    const body = await request.json();
    const parsed = leaveDecisionSchema.parse(body);

    await connectDB();

    const leave = await LeaveRequestModel.findById(leaveId);
    if (!leave) {
      return errorResponse("Leave request not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      leave.manager?.toString() !== sessionUser.id
    ) {
      const targetUser = await UserModel.findById(leave.user)
        .select("manager")
        .lean();
      if (targetUser?.manager?.toString() !== sessionUser.id) {
        return errorResponse("Forbidden", { status: 403 });
      }
    }

    leave.status = parsed.status;
    leave.reply = parsed.reply;
    leave.manager = sessionUser.id;

    await leave.save();

    return jsonResponse({
      success: true,
      data: {
        id: leave._id,
        status: leave.status,
        reply: leave.reply
      }
    });
  } catch (error) {
    return handleApiError("leave/update", error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const leaveId = ensureObjectId(params.id);

    await connectDB();
    const leave = await LeaveRequestModel.findById(leaveId);
    if (!leave) {
      return errorResponse("Leave request not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      leave.manager?.toString() !== sessionUser.id
    ) {
      return errorResponse("Forbidden", { status: 403 });
    }

    await leave.deleteOne();

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError("leave/delete", error);
  }
}


