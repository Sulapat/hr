import { Router } from "express";
import { login, getMe, changePassword } from "../controller/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, changePassword);
export default router;
