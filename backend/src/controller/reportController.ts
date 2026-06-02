import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees,
      pendingOT,
      pendingLeave,
      otThisMonth,
      leaveThisMonth,
      lowStock,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.oTRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.oTRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.leaveRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.stock.findMany({
        where: { quantity: { lte: 5 } },
        include: { item: true },
        take: 5,
      }),
    ]);

    return successResponse(res, {
      totalEmployees,
      pendingOT,
      pendingLeave,
      otThisMonth,
      leaveThisMonth,
      lowStock,
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getOTReport = async (req: Request, res: Response) => {
  const { month, year } = req.query;
  try {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    const data = await prisma.oTRequest.findMany({
      where: { date: { gte: start, lte: end }, status: "APPROVED" },
      include: {
        user: { select: { firstName: true, lastName: true, employeeId: true } },
        otType: true,
      },
      orderBy: { date: "asc" },
    });
    return successResponse(res, data);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getLeaveReport = async (req: Request, res: Response) => {
  const { month, year } = req.query;
  try {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    const data = await prisma.leaveRequest.findMany({
      where: { startDate: { gte: start, lte: end }, status: "APPROVED" },
      include: {
        user: { select: { firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { startDate: "asc" },
    });
    return successResponse(res, data);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};
