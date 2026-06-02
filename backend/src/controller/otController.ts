import { Request, Response } from "express";
import { PrismaClient, OTStatus, Role } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

const otInclude = {
  user: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
  otType: true,
  approval: { include: { approver: { select: { id: true, firstName: true, lastName: true } } } },
};

export const getOTRequests = async (req: Request, res: Response) => {
  try {
    const isEmployee = req.user!.role === Role.EMPLOYEE;
    const where = isEmployee ? { userId: req.user!.id } : {};
    const requests = await prisma.oTRequest.findMany({
      where,
      include: otInclude,
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, requests);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const createOTRequest = async (req: Request, res: Response) => {
  const { otTypeId, date, startTime, endTime, hours, reason } = req.body;
  try {
    const request = await prisma.oTRequest.create({
      data: {
        userId: req.user!.id,
        otTypeId,
        date: new Date(date),
        startTime,
        endTime,
        hours: parseFloat(hours),
        reason,
      },
      include: otInclude,
    });
    return successResponse(res, request, "OT request created", 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const approveOTRequest = async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const { id } = req.params;

  if (!Object.values(OTStatus).includes(status)) {
    return errorResponse(res, "Invalid status", 400);
  }

  try {
    // ── ดึง OT request เพื่อตรวจสอบก่อน ──
    const otRequest = await prisma.oTRequest.findUnique({ where: { id } });

    if (!otRequest) {
      return errorResponse(res, "OT request not found", 404);
    }

    // ── ป้องกันอนุมัติ OT ของตัวเอง ──
    if (otRequest.userId === req.user!.id) {
      return errorResponse(res, "ไม่สามารถอนุมัติ OT ของตัวเองได้", 403);
    }

    // ── ไม่สามารถเปลี่ยน status ที่ approved/rejected แล้ว (optional guard) ──
    // if (otRequest.status !== OTStatus.PENDING) {
    //   return errorResponse(res, "OT request has already been processed", 400);
    // }

    const [updated] = await prisma.$transaction([
      prisma.oTRequest.update({ where: { id }, data: { status } }),
      prisma.oTApproval.upsert({
        where: { otRequestId: id },
        create: { otRequestId: id, approverId: req.user!.id, status, note },
        update: { status, note, approvedAt: new Date() },
      }),
    ]);

    return successResponse(res, updated, `OT ${status.toLowerCase()}`);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const deleteOTRequest = async (req: Request, res: Response) => {
  try {
    const ot = await prisma.oTRequest.findUnique({ where: { id: req.params.id } });
    if (!ot) return errorResponse(res, "Not found", 404);
    if (ot.userId !== req.user!.id && req.user!.role === Role.EMPLOYEE) {
      return errorResponse(res, "Forbidden", 403);
    }
    if (ot.status !== OTStatus.PENDING) {
      return errorResponse(res, "Cannot delete approved/rejected request", 400);
    }
    await prisma.oTRequest.delete({ where: { id: req.params.id } });
    return successResponse(res, null, "OT request deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};
