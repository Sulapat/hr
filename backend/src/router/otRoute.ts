import { Router } from "express";
import { getOTRequests, createOTRequest, approveOTRequest, deleteOTRequest } from "../controller/otController";
import { authenticate } from "../middleware/authMiddleware";
import { managerAndAbove } from "../middleware/roleGuard";

const router = Router();
router.use(authenticate);
router.get("/", getOTRequests);
router.post("/", createOTRequest);
router.patch("/:id/approve", managerAndAbove, approveOTRequest);
router.delete("/:id", deleteOTRequest);
export default router;
