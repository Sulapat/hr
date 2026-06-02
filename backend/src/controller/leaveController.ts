import { Request, Response } from "express";
import { PrismaClient, LeaveStatus, Role } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

const leaveInclude = {
  user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
  approval: { include: { approver: { select: { id: true, firstName: true, lastName: true } } } },
};

export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const isEmployee = req.user!.role === Role.EMPLOYEE;
    const where = isEmployee ? { userId: req.user!.id } : {};
    const requests = await prisma.leaveRequest.findMany({
      where,
      include: leaveInclude,
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, requests);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  const { leaveType, startDate, endDate, days, reason } = req.body;
  try {
    const request = await prisma.leaveRequest.create({
      data: {
        userId: req.user!.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseFloat(days),
        reason,
        attachment: req.file ? `/uploads/${req.file.filename}` : undefined,
      },
      include: leaveInclude,
    });
    return successResponse(res, request, "Leave request created", 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const approveLeaveRequest = async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const { id } = req.params;
  if (!Object.values(LeaveStatus).includes(status)) {
    return errorResponse(res, "Invalid status", 400);
  }
  try {
    const [leaveRequest] = await prisma.$transaction([
      prisma.leaveRequest.update({ where: { id }, data: { status } }),
      prisma.leaveApproval.upsert({
        where: { leaveRequestId: id },
        create: { leaveRequestId: id, approverId: req.user!.id, status, note },
        update: { status, note, approvedAt: new Date() },
      }),
    ]);
    return successResponse(res, leaveRequest, `Leave ${status.toLowerCase()}`);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};
