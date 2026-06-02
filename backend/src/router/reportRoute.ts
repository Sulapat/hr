import { Router } from "express";
import { getDashboard, getOTReport, getLeaveReport } from "../controller/reportController";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove } from "../middleware/roleGuard";

const router = Router();
router.use(authenticate);
router.get("/dashboard", getDashboard);
router.get("/ot", hrAndAbove, getOTReport);
router.get("/leave", hrAndAbove, getLeaveReport);
export default router;
