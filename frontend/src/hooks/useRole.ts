import { useAuthStore, AuthUser } from "@/store/authStore";

export const useRole = () => {
  const { user, hasRole } = useAuthStore();
  return {
    role: user?.role,
    isSuperAdmin: hasRole("SUPER_ADMIN"),
    isHRAdmin: hasRole("HR_ADMIN"),
    isManager: hasRole("MANAGER"),
    isEmployee: user?.role === "EMPLOYEE",
    hasRole,
  };
};
