import { Role } from "@prisma/client";

export const ROLES = Role;

// Role hierarchy: SUPER_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE
export const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 4,
  HR_ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export const hasRole = (userRole: Role, requiredRole: Role): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
