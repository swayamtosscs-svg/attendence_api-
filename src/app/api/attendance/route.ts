import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AttendanceModel from "@/models/Attendance";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { attendanceManualEntrySchema, attendanceQuerySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = attendanceQuerySchema.parse(searchParams);

    const filter: Record<string, unknown> = {};

    if (parsed.status) {
      filter.status = parsed.status;
    }

    if (parsed.startDate || parsed.endDate) {
      filter.date = {};
      if (parsed.startDate) {
        filter.date = {
          ...filter.date,
          $gte: new Date(parsed.startDate)
        };
      }
      if (parsed.endDate) {
        filter.date = {
          ...filter.date,
          $lte: new Date(parsed.endDate)
        };
      }
    }

    let allowedUserIds: string[] = [];

    if (sessionUser.role === "employee") {
      allowedUserIds = [sessionUser.id];
    } else if (sessionUser.role === "manager") {
      const managedUsers = await UserModel.find({ manager: sessionUser.id })
        .select("_id")
        .lean();
      allowedUserIds = [
        sessionUser.id,
        ...managedUsers.map((u) => u._id.toString())
      ];
    }

    if (sessionUser.role !== "admin") {
      filter.user = {
        $in: parsed.userId
          ? allowedUserIds.includes(parsed.userId)
            ? [parsed.userId]
            : []
          : allowedUserIds
      };
    } else if (parsed.userId) {
      if (!mongoose.Types.ObjectId.isValid(parsed.userId)) {
        return errorResponse("Invalid user id", { status: 400 });
      }
      filter.user = parsed.userId;
    }

    const records = await AttendanceModel.find(filter)
      .populate("user", "name email role department designation")
      .sort({ date: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: records.map((record) => ({
        id: record._id,
        user: record.user,
        date: record.date,
        checkInAt: record.checkInAt,
        checkOutAt: record.checkOutAt,
        workDurationMinutes: record.workDurationMinutes,
        status: record.status,
        notes: record.notes,
        lateByMinutes: record.lateByMinutes
      }))
    });
  } catch (error) {
    return handleApiError("attendance/list", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const body = await request.json();
    const parsed = attendanceManualEntrySchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(parsed.userId)) {
      return errorResponse("Invalid user id", { status: 400 });
    }

    await connectDB();

    const targetUser = await UserModel.findById(parsed.userId);
    if (!targetUser) {
      return errorResponse("Target user not found", { status: 404 });
    }

    if (
      sessionUser.role === "manager" &&
      targetUser.manager?.toString() !== sessionUser.id
    ) {
      return errorResponse("Forbidden", { status: 403 });
    }

    const date = new Date(parsed.date);
    date.setHours(0, 0, 0, 0);

    const attendance =
      (await AttendanceModel.findOne({
        user: parsed.userId,
        date
      })) ?? new AttendanceModel({ user: parsed.userId, date });

    attendance.checkInAt = new Date(parsed.checkInAt);
    attendance.checkOutAt = parsed.checkOutAt
      ? new Date(parsed.checkOutAt)
      : undefined;
    attendance.status = parsed.status ?? "present";
    attendance.notes = parsed.notes;

    await attendance.save();

    return jsonResponse({
      success: true,
      data: {
        id: attendance._id,
        user: attendance.user,
        date: attendance.date,
        checkInAt: attendance.checkInAt,
        checkOutAt: attendance.checkOutAt,
        status: attendance.status,
        notes: attendance.notes
      }
    });
  } catch (error) {
    return handleApiError("attendance/manual", error);
  }
}


