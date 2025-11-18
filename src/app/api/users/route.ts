import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { handleApiError } from "@/lib/api-response";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getSessionUser } from "@/lib/current-user";
import { assertRole } from "@/lib/permissions";
import { registerUserSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const query =
      sessionUser.role === "manager"
        ? { manager: sessionUser.id }
        : {};

    const users = await UserModel.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({
      success: true,
      data: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        status: user.status,
        manager: user.manager,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    return handleApiError("users/list", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    assertRole(sessionUser, ["admin", "manager"]);

    const body = await request.json();
    const parsed = registerUserSchema.parse(body);

    await connectDB();
    const existingUser = await UserModel.findOne({ email: parsed.email });

    if (existingUser) {
      return errorResponse("Email already registered", { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.password);

    const user = await UserModel.create({
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role:
        sessionUser.role === "manager" && parsed.role === "admin"
          ? "employee"
          : parsed.role,
      department: parsed.department,
      designation: parsed.designation,
      manager: parsed.managerId ?? (sessionUser.role === "manager"
        ? sessionUser.id
        : parsed.managerId)
    });

    return jsonResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        manager: user.manager
      }
    }, { status: 201 });
  } catch (error) {
    return handleApiError("users/create", error);
  }
}



