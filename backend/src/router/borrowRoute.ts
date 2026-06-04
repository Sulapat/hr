import { Router } from "express";
import { getBorrows, createBorrow, returnBorrow } from "../controller/borrowController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticate);
router.get("/", getBorrows);
router.post("/", createBorrow);
router.patch("/:id/return", returnBorrow);
export default router;