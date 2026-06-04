import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/response";

const prisma = new PrismaClient();

// Items
export const getItems = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.item.findMany({
      include: { stocks: true },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, items);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const item = await prisma.item.create({
      data: {
        ...req.body,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        stocks: { create: { quantity: 0 } },
      },
      include: { stocks: true },
    });
    return successResponse(res, item, "Item created", 201);
  } catch (err: any) {
    if (err.code === "P2002") return errorResponse(res, "Item code already exists", 409);
    console.error(err);
    return errorResponse(res);
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body,
      include: { stocks: true },
    });
    return successResponse(res, item, "Item updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    return successResponse(res, null, "Item deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

// Import (เพิ่มสต็อก)
export const importStock = async (req: Request, res: Response) => {
  const { itemId, quantity, note } = req.body;
  try {
    const [history] = await prisma.$transaction([
      prisma.importHistory.create({ data: { itemId, quantity: parseInt(quantity), note } }),
      prisma.stock.update({
        where: { itemId },
        data: { quantity: { increment: parseInt(quantity) } },
      }),
    ]);
    return successResponse(res, history, "Stock imported", 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

// Export (เบิกสต็อก)
export const exportStock = async (req: Request, res: Response) => {
  const { itemId, quantity, borrowedBy, note } = req.body;
  try {
    const stock = await prisma.stock.findUnique({ where: { itemId } });
    if (!stock || stock.quantity < parseInt(quantity)) {
      return errorResponse(res, "Insufficient stock", 400);
    }
    const [history] = await prisma.$transaction([
      prisma.exportHistory.create({ data: { itemId, quantity: parseInt(quantity), borrowedBy, note } }),
      prisma.stock.update({
        where: { itemId },
        data: { quantity: { decrement: parseInt(quantity) } },
      }),
    ]);
    return successResponse(res, history, "Stock exported", 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getImportHistory = async (_req: Request, res: Response) => {
  try {
    const history = await prisma.importHistory.findMany({
      include: { item: true },
      orderBy: { importedAt: "desc" },
    });
    return successResponse(res, history);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

export const getExportHistory = async (_req: Request, res: Response) => {
  try {
    const history = await prisma.exportHistory.findMany({
      include: { item: true },
      orderBy: { exportedAt: "desc" },
    });
    return successResponse(res, history);
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};

// Update Asset Status
export const updateItemStatus = async (req: Request, res: Response) => {
  const { assetStatus, note } = req.body;
  try {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { assetStatus },
      include: { stocks: true },
    });
    return successResponse(res, item, "Asset status updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res);
  }
};