import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import LeaveRequestModel from "@/models/LeaveRequest";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/current-user";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { leaveRequestSchema } from "@/lib/validators";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (sessionUser.role === "employee") {
      filter.user = sessionUser.id;
    } else if (sessionUser.role === "manager") {
      const managedUsers = await UserModel.find({ manager: sessionUser.id })
        .select("_id")
        .lean();
      filter.user = {
        $in: [sessionUser.id, ...managedUsers.map((user) => user._id.toString())]
      };
    }

    const leaveRequests = await LeaveRequestModel.find(filter)
      .populate("user", "name email role department")
      .populate("manager", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: leaveRequests.map((leave) => ({
        id: leave._id,
        user: leave.user,
        manager: leave.manager,
        startDate: leave.startDate,
        endDate: leave.endDate,
        type: leave.type,
        status: leave.status,
        reason: leave.reason,
        reply: leave.reply,
        createdAt: leave.createdAt
      }))
    });
  } catch (error) {
    return handleApiError("leave/list", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = leaveRequestSchema.parse(body);

    await connectDB();

    const manager =
      (await UserModel.findOne({ _id: sessionUser.id }).select("manager").lean())
        ?.manager ?? undefined;

    const leaveRequest = await LeaveRequestModel.create({
      user: sessionUser.id,
      manager,
      startDate: new Date(parsed.startDate),
      endDate: new Date(parsed.endDate),
      type: parsed.type,
      reason: parsed.reason
    });

    return jsonResponse(
      {
        success: true,
        data: {
          id: leaveRequest._id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          type: leaveRequest.type,
          status: leaveRequest.status
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("leave/create", error);
  }
}


