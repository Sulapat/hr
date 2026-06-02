import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { hasRole } from "../types/roles";
import { errorResponse } from "../utils/response";

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, "Unauthorized", 401);
    const allowed = roles.some((role) => hasRole(req.user!.role, role));
    if (!allowed) return errorResponse(res, "Forbidden: insufficient permissions", 403);
    return next();
  };
};

// Shortcuts
export const adminOnly = requireRole(Role.SUPER_ADMIN);
export const hrAndAbove = requireRole(Role.HR_ADMIN);
export const managerAndAbove = requireRole(Role.MANAGER);
