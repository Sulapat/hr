import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken } from "../utils/jwt";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return errorResponse(res, "Email and password are required", 400);
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { position: true, company: true, status: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errorResponse(res, "Invalid credentials", 401);
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password: _, ...safeUser } = user;
    return successResponse(res, { token, user: safeUser }, "Login successful");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { position: true, company: true, status: true },
    });
    if (!user) return errorResponse(res, "User not found", 404);
    const { password: _, ...safeUser } = user;
    return successResponse(res, safeUser);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return errorResponse(res, "Old password is incorrect", 400);
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return successResponse(res, null, "Password changed successfully");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};
