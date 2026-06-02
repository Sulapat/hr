import { Router } from "express";
import { getItems, createItem, updateItem, deleteItem } from "../controller/stockController";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove } from "../middleware/roleGuard";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
router.use(authenticate);
router.get("/", getItems);
router.post("/", hrAndAbove, upload.single("image"), createItem);
router.patch("/:id", hrAndAbove, updateItem);
router.delete("/:id", hrAndAbove, deleteItem);
export default router;
