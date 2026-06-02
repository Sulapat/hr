import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

const userInclude = {
  position: true,
  company: true,
  status: true,
  manager: { select: { id: true, firstName: true, lastName: true } },
};

// ── Strip password from user object ──────────────────────
const omitPassword = <T extends { password?: any }>(user: T): Omit<T, "password"> => {
  const { password, ...rest } = user;
  return rest;
};

// ── Convert "YYYY-MM-DD" -> full ISO DateTime for Prisma ─
// Prisma DateTime ต้องการ ISO-8601 เต็มรูปแบบ เช่น "2026-01-01T00:00:00.000Z"
const toDateTime = (val: any): Date | undefined => {
  if (!val) return undefined;
  const iso = typeof val === "string" && val.length === 10
    ? val + "T00:00:00.000Z"
    : val;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
};

// ── Sanitize request body: parse dates, strip empties ────
const sanitizeBody = (body: any) => {
  const result: any = { ...body };
  // แปลง date string เป็น DateTime
  if ("startDate" in result) result.startDate = toDateTime(result.startDate) ?? null;
  if ("birthDate" in result) result.birthDate = toDateTime(result.birthDate) ?? null;
  // ลบ field ที่เป็น empty string (FK fields)
  if (!result.positionId) delete result.positionId;
  if (!result.statusId)   delete result.statusId;
  if (!result.managerId)  delete result.managerId;
  if (!result.companyId)  delete result.companyId;
  return result;
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, users.map(omitPassword));
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: userInclude,
    });
    if (!user) return errorResponse(res, "User not found", 404);
    return successResponse(res, omitPassword(user));
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { password, ...rawRest } = req.body;
  try {
    const hashed = await bcrypt.hash(password || "Password@123", 10);
    const rest = sanitizeBody(rawRest);
    const user = await prisma.user.create({
      data: { ...rest, password: hashed },
      include: userInclude,
    });
    return successResponse(res, omitPassword(user), "User created", 201);
  } catch (err: any) {
    if (err.code === "P2002") return errorResponse(res, "Email or Employee ID already exists", 409);
    console.error(err);
    return errorResponse(res);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { password, ...rawRest } = req.body;
  try {
    const data: any = sanitizeBody(rawRest);
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: userInclude,
    });
    return successResponse(res, omitPassword(user), "User updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return successResponse(res, null, "User deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!req.file) return errorResponse(res, "No file uploaded", 400);
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { avatar: avatarUrl },
    });
    return successResponse(res, { avatarUrl }, "Avatar uploaded");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};