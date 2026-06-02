import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

const tsInclude = {
  user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
  typeWork: true,
  place: true,
};

export const getTimesheets = async (req: Request, res: Response) => {
  const { userId, month, year } = req.query;
  try {
    const isEmployee = req.user!.role === Role.EMPLOYEE;
    const targetUser = isEmployee ? req.user!.id : (userId as string | undefined);
    const where: any = {};
    if (targetUser) where.userId = targetUser;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);
      where.date = { gte: start, lte: end };
    }
    const timesheets = await prisma.timeSheet.findMany({
      where,
      include: tsInclude,
      orderBy: { date: "desc" },
    });
    return successResponse(res, timesheets);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const upsertTimesheet = async (req: Request, res: Response) => {
  const { date, checkIn, checkOut, workHours, typeWorkId, placeId, note } = req.body;
  try {
    const timesheet = await prisma.timeSheet.upsert({
      where: { userId_date: { userId: req.user!.id, date: new Date(date) } },
      create: {
        userId: req.user!.id,
        date: new Date(date),
        checkIn,
        checkOut,
        workHours: workHours ? parseFloat(workHours) : undefined,
        typeWorkId,
        placeId,
        note,
      },
      update: { checkIn, checkOut, workHours: workHours ? parseFloat(workHours) : undefined, typeWorkId, placeId, note },
      include: tsInclude,
    });
    return successResponse(res, timesheet, "Timesheet saved");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    await prisma.timeSheet.delete({ where: { id: req.params.id } });
    return successResponse(res, null, "Timesheet deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};
