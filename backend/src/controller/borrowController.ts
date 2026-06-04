import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

export const getBorrows = async (_req: Request, res: Response) => {
  try {
    const borrows = await prisma.borrow.findMany({
      include: { item: { include: { stocks: true } } },
      orderBy: { borrowDate: "desc" },
    });
    return successResponse(res, borrows);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const createBorrow = async (req: Request, res: Response) => {
  const { itemId, quantity, borrower, dueDate, note } = req.body;
  try {
    const stock = await prisma.stock.findUnique({ where: { itemId } });
    if (!stock || stock.quantity < parseInt(quantity)) {
      return errorResponse(res, "Insufficient stock", 400);
    }
    const [borrow] = await prisma.$transaction([
      prisma.borrow.create({
        data: {
          itemId,
          quantity: parseInt(quantity),
          borrower,
          dueDate: new Date(dueDate),
          note,
          status: "borrowing",
        },
        include: { item: { include: { stocks: true } } },
      }),
      prisma.stock.update({
        where: { itemId },
        data: { quantity: { decrement: parseInt(quantity) } },
      }),
    ]);
    return successResponse(res, borrow, "Borrow created", 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const returnBorrow = async (req: Request, res: Response) => {
  try {
    const borrow = await prisma.borrow.findUnique({ where: { id: req.params.id } });
    if (!borrow) return errorResponse(res, "Not found", 404);
    if (borrow.status === "returned") return errorResponse(res, "Already returned", 400);

    const [updated] = await prisma.$transaction([
      prisma.borrow.update({
        where: { id: req.params.id },
        data: { status: "returned", returnDate: new Date() },
        include: { item: { include: { stocks: true } } },
      }),
      prisma.stock.update({
        where: { itemId: borrow.itemId },
        data: { quantity: { increment: borrow.quantity } },
      }),
    ]);
    return successResponse(res, updated, "Returned successfully");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

