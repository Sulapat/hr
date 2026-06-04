import { Router } from "express";
import {
  getTimesheets,
  upsertTimesheet,
  updateTimesheet,
  deleteTimesheet,
} from "../controller/timesheetController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.get("/", getTimesheets);       // GET  /api/timesheets
router.post("/", upsertTimesheet);    // POST /api/timesheets
router.put("/:id", updateTimesheet);  // PUT  /api/timesheets/:id
router.delete("/:id", deleteTimesheet); // DELETE /api/timesheets/:id

export default router;