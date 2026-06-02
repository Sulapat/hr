import { Router } from "express";
import { getUsers, getUserById, createUser, updateUser, deleteUser, uploadAvatar } from "../controller/userController";
import { authenticate } from "../middleware/authMiddleware";
import { hrAndAbove, adminOnly } from "../middleware/roleGuard";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
router.use(authenticate);
router.get("/", hrAndAbove, getUsers);
router.get("/:id", getUsers);
router.post("/", hrAndAbove, createUser);
router.patch("/:id", hrAndAbove, updateUser);
router.delete("/:id", adminOnly, deleteUser);
router.post("/:id/avatar", upload.single("avatar"), uploadAvatar);
export default router;
