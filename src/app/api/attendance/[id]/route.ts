import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AttendanceModel from "@/models/Attendance";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { assertRole } from "@/lib/permissions";
import { attendanceUpdateSchema } from "@/lib/validators";

function ensureObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid identifier");
  }
  return new mongoose.Types.ObjectId(id);
}

async function ensurePermission(
  sessionUserRole: string,
  sessionUserId: string,
  targetUserId: string
) {
  if (sessionUserRole === "admin") {
    return true;
  }

  if (sessionUserRole === "employee") {
    return sessionUserId === targetUserId;
  }

  if (sessionUserRole === "manager") {
    if (sessionUserId === targetUserId) {
      return true;
    }
    const targetUser = await UserModel.findById(targetUserId)
      .select("manager")
      .lean();
    return targetUser?.manager?.toString() === sessionUserId;
  }

  return false;
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

    const attendanceId = ensureObjectId(params.id);

    await connectDB();
    const attendance = await AttendanceModel.findById(attendanceId)
      .populate("user", "name email role manager")
      .lean();

    if (!attendance) {
      return errorResponse("Attendance record not found", { status: 404 });
    }

    const permitted = await ensurePermission(
      sessionUser.role,
      sessionUser.id,
      attendance.user._id.toString()
    );

    if (!permitted) {
      return errorResponse("Forbidden", { status: 403 });
    }

    return jsonResponse({
      success: true,
      data: {
        id: attendance._id,
        user: attendance.user,
        date: attendance.date,
        checkInAt: attendance.checkInAt,
        checkOutAt: attendance.checkOutAt,
        workDurationMinutes: attendance.workDurationMinutes,
        status: attendance.status,
        notes: attendance.notes,
        lateByMinutes: attendance.lateByMinutes
      }
    });
  } catch (error) {
    return handleApiError("attendance/get", error);
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

    const attendanceId = ensureObjectId(params.id);
    const body = await request.json();
    const parsed = attendanceUpdateSchema.parse(body);

    await connectDB();
    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return errorResponse("Attendance record not found", { status: 404 });
    }

    const permitted = await ensurePermission(
      sessionUser.role,
      sessionUser.id,
      attendance.user.toString()
    );

    if (!permitted) {
      return errorResponse("Forbidden", { status: 403 });
    }

    if (parsed.date !== undefined) {
      const date = new Date(parsed.date);
      date.setHours(0, 0, 0, 0);
      attendance.date = date;
    }
    if (parsed.checkInAt !== undefined) {
      attendance.checkInAt = new Date(parsed.checkInAt);
    }
    if (parsed.checkOutAt !== undefined) {
      attendance.checkOutAt = new Date(parsed.checkOutAt);
    }
    if (parsed.status !== undefined) {
      attendance.status = parsed.status;
    }
    if (parsed.notes !== undefined) {
      attendance.notes = parsed.notes;
    }

    await attendance.save();

    return jsonResponse({
      success: true,
      data: {
        id: attendance._id,
        date: attendance.date,
        checkInAt: attendance.checkInAt,
        checkOutAt: attendance.checkOutAt,
        status: attendance.status,
        notes: attendance.notes
      }
    });
  } catch (error) {
    return handleApiError("attendance/update", error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const attendanceId = ensureObjectId(params.id);

    await connectDB();
    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return errorResponse("Attendance record not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      attendance.user.toString() !== sessionUser.id
    ) {
      const targetUser = await UserModel.findById(attendance.user)
        .select("manager")
        .lean();
      if (targetUser?.manager?.toString() !== sessionUser.id) {
        return errorResponse("Forbidden", { status: 403 });
      }
    }

    await attendance.deleteOne();

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError("attendance/delete", error);
  }
}

