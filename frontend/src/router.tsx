import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore, AuthUser } from "@/store/authStore";

// ─── Protected Route ─────────────────────────────────────
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

// ─── Role Guard ──────────────────────────────────────────
interface RoleGuardProps {
  allowedRoles: AuthUser["role"][];
  children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const roleLevel: Record<AuthUser["role"], number> = {
    SUPER_ADMIN: 4, HR_ADMIN: 3, MANAGER: 2, EMPLOYEE: 1,
  };
  const minLevel = Math.min(...allowedRoles.map((r) => roleLevel[r]));
  if (roleLevel[user.role] < minLevel) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }
  return <>{children}</>;
};
