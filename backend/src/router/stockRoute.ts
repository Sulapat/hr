import { Router } from "express";
import { importStock, exportStock, getImportHistory, getExportHistory } from "../controller/stockController";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove } from "../middleware/roleGuard";

const router = Router();
router.use(authenticate);
router.post("/import", hrAndAbove, importStock);
router.post("/export", exportStock);
router.get("/import-history", getImportHistory);
router.get("/export-history", getExportHistory);
export default router;
