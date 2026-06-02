import { Router } from "express";
import { getLeaveRequests, createLeaveRequest, approveLeaveRequest } from "../controller/leaveController";
import { authenticate } from "../middleware/authMiddleware";
import { managerAndAbove } from "../middleware/roleGuard";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
router.use(authenticate);
router.get("/", getLeaveRequests);
router.post("/", upload.single("attachment"), createLeaveRequest);
router.patch("/:id/approve", managerAndAbove, approveLeaveRequest);
export default router;
