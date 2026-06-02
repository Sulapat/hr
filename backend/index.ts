import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

// Routes
import authRoutes from "./src/router/authRoute";
import userRoutes from "./src/router/userRoute";
import positionRoutes from "./src/router/positionRoute";
import statusRoutes from "./src/router/statusRoute";
import companyRoutes from "./src/router/companyRoute";
import otRoutes from "./src/router/otRoute";
import otApprovalRoutes from "./src/router/otApprovalRoute";
import otTypeRoutes from "./src/router/otTypeRoute";
import leaveRoutes from "./src/router/leaveRoute";
import leaveApprovalRoutes from "./src/router/leaveApprovalRoute";
import timesheetRoutes from "./src/router/timesheetRoute";
import typeWorkRoutes from "./src/router/typeWorkRoute";
import placeRoutes from "./src/router/placeRoute";
import itemRoutes from "./src/router/itemRoute";
import stockRoutes from "./src/router/stockRoute";
import reportRoutes from "./src/router/reportRoute";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ─────────────────────────────────────
let uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

// ─── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// Organization
app.use("/api/users", userRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/companies", companyRoutes);

// OT
app.use("/api/ot", otRoutes);
app.use("/api/ot-approvals", otApprovalRoutes);
app.use("/api/ot-types", otTypeRoutes);

// Leave
app.use("/api/leave", leaveRoutes);
app.use("/api/leave-approvals", leaveApprovalRoutes);

// TimeSheet
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/type-works", typeWorkRoutes);
app.use("/api/places", placeRoutes);

// Stock
app.use("/api/items", itemRoutes);
app.use("/api/stock", stockRoutes);

// Reports
app.use("/api/reports", reportRoutes);

// ─── Health check ───────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads served from: ${uploadDir}`);
});
