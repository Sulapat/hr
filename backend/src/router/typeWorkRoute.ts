import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware";
import { successResponse, errorResponse } from "../utils/response";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", async (_req, res) => {
  const data = await prisma.typeWork.findMany().catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
export default router;
