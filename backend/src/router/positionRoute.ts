import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove } from "../middleware/roleGuard";
import { successResponse, errorResponse } from "../utils/response";

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate);
router.get("/", async (_req, res) => {
  const data = await prisma.position.findMany().catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
router.post("/", hrAndAbove, async (req, res) => {
  const data = await prisma.position.create({ data: req.body }).catch(() => null);
  data ? successResponse(res, data, "Created", 201) : errorResponse(res);
});
router.patch("/:id", hrAndAbove, async (req, res) => {
  const data = await prisma.position.update({ where: { id: req.params.id }, data: req.body }).catch(() => null);
  data ? successResponse(res, data) : errorResponse(res);
});
router.delete("/:id", hrAndAbove, async (req, res) => {
  await prisma.position.delete({ where: { id: req.params.id } }).catch(() => null);
  successResponse(res, null, "Deleted");
});
export default router;
