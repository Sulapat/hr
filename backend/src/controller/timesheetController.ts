import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

const tsInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
    },
  },
  typeWork: true,
};

// ─── GET /api/timesheets ──────────────────────────────────
// Employee  : เห็นเฉพาะข้อมูลตัวเอง (userId จาก token เสมอ)
// Manager + : เห็นทุกคน กรอง userId ได้ผ่าน query
export const getTimesheets = async (req: Request, res: Response) => {
  const { userId, month, year } = req.query;

  try {
    const isEmployee = req.user!.role === Role.EMPLOYEE;

    // Employee บังคับใช้ id ตัวเอง, Manager เลือกได้
    const targetUserId = isEmployee
      ? req.user!.id
      : (userId as string | undefined) || undefined;

    const where: Record<string, unknown> = {};
    if (targetUserId) where.userId = targetUserId;

    if (month && year) {
      const m = Number(month);
      const y = Number(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      };
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

// ─── POST /api/timesheets ─────────────────────────────────
// Upsert โดยใช้ userId + date เป็น unique key
// แต่ละ record = 1 งาน ต่อวัน ไม่จำกัดจำนวน row
// *** หมายเหตุ: schema มี @@unique([userId, date]) ***
// *** ถ้าต้องการหลาย row ต่อวัน ให้ลบ unique constraint ออก ***
// *** และเปลี่ยน upsert → create ด้านล่าง ***
export const upsertTimesheet = async (req: Request, res: Response) => {
  const { date, workHours, typeWorkId, note } = req.body;

  if (!date) {
    return res.status(400).json({ success: false, message: "date is required" });
  }

  try {
    // ── Option A: หลาย row ต่อวัน (ใช้ create) ──────────────
    const timesheet = await prisma.timeSheet.create({
      data: {
        userId: req.user!.id,
        date: new Date(date),
        workHours: workHours ? parseFloat(workHours) : null,
        typeWorkId: typeWorkId || null,
        note: note || null,
      },
      include: tsInclude,
    });

    // ── Option B: 1 row ต่อวัน (ใช้ upsert) ─────────────────
    // const timesheet = await prisma.timeSheet.upsert({
    //   where: { userId_date: { userId: req.user!.id, date: new Date(date) } },
    //   create: {
    //     userId: req.user!.id,
    //     date: new Date(date),
    //     workHours: workHours ? parseFloat(workHours) : null,
    //     typeWorkId: typeWorkId || null,
    //     note: note || null,
    //   },
    //   update: {
    //     workHours: workHours ? parseFloat(workHours) : null,
    //     typeWorkId: typeWorkId || null,
    //     note: note || null,
    //   },
    //   include: tsInclude,
    // });

    return successResponse(res, timesheet, "Timesheet saved");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

// ─── PUT /api/timesheets/:id ──────────────────────────────
// แก้ไขรายการ — เฉพาะเจ้าของเท่านั้น
export const updateTimesheet = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workHours, typeWorkId, note } = req.body;

  try {
    // ตรวจสอบว่าเป็นเจ้าของรายการ
    const existing = await prisma.timeSheet.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updated = await prisma.timeSheet.update({
      where: { id },
      data: {
        workHours: workHours !== undefined ? parseFloat(workHours) : undefined,
        typeWorkId: typeWorkId !== undefined ? typeWorkId || null : undefined,
        note: note !== undefined ? note || null : undefined,
      },
      include: tsInclude,
    });

    return successResponse(res, updated, "Timesheet updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

// ─── DELETE /api/timesheets/:id ───────────────────────────
// ลบรายการ — เฉพาะเจ้าของเท่านั้น
export const deleteTimesheet = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // ตรวจสอบว่าเป็นเจ้าของรายการ
    const existing = await prisma.timeSheet.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await prisma.timeSheet.delete({ where: { id } });

    return successResponse(res, null, "Timesheet deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};