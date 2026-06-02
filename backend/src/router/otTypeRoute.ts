import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove } from "../middleware/roleGuard";
import { successResponse, errorResponse } from "../utils/response";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", async (_req, res) => {
  const data = await prisma.oTType.findMany().catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
router.post("/", hrAndAbove, async (req, res) => {
  const data = await prisma.oTType.create({ data: req.body }).catch(() => null);
  data ? successResponse(res, data, "Created", 201) : errorResponse(res);
});
export default router;
