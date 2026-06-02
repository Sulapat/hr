import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleGuard";
import { successResponse, errorResponse } from "../utils/response";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", async (_req, res) => {
  const data = await prisma.company.findMany().catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
router.post("/", adminOnly, async (req, res) => {
  const data = await prisma.company.create({ data: req.body }).catch(() => null);
  data ? successResponse(res, data, "Created", 201) : errorResponse(res);
});
router.patch("/:id", adminOnly, async (req, res) => {
  const data = await prisma.company.update({ where: { id: req.params.id }, data: req.body }).catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
export default router;
