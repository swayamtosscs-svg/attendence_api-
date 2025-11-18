import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AttendanceModel from "@/models/Attendance";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));

    const match: Record<string, unknown> = {};

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date = { ...match.date, $gte: startDate };
      }
      if (endDate) {
        match.date = { ...match.date, $lte: endDate };
      }
    }

    if (userIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return errorResponse("Invalid user id", { status: 400 });
      }
      match.user = new mongoose.Types.ObjectId(userIdParam);
    } else if (sessionUser.role === "employee") {
      match.user = new mongoose.Types.ObjectId(sessionUser.id);
    } else if (sessionUser.role === "manager") {
      const managedUsers = await UserModel.find({ manager: sessionUser.id })
        .select("_id")
        .lean();
      match.user = {
        $in: [
          new mongoose.Types.ObjectId(sessionUser.id),
          ...managedUsers.map((user) => new mongoose.Types.ObjectId(user._id))
        ]
      };
    }

    const summary = await AttendanceModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$user",
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0]
            }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          },
          halfDays: {
            $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] }
          },
          onLeaveDays: {
            $sum: { $cond: [{ $eq: ["$status", "on-leave"] }, 1, 0] }
          },
          totalMinutes: { $sum: "$workDurationMinutes" }
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
          user: {
            id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            role: "$user.role",
            department: "$user.department"
          },
          presentDays: 1,
          absentDays: 1,
          halfDays: 1,
          onLeaveDays: 1,
          totalMinutes: { $ifNull: ["$totalMinutes", 0] }
        }
      }
    ]);

    return jsonResponse({ success: true, data: summary });
  } catch (error) {
    return handleApiError("attendance/summary", error);
  }
}


