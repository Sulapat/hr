import { Router } from "express";
import { getTimesheets, upsertTimesheet, deleteTimesheet } from "../controller/timesheetController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticate);
router.get("/", getTimesheets);
router.post("/", upsertTimesheet);
router.delete("/:id", deleteTimesheet);
export default router;
