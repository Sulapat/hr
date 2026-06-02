import { create } from "zustand";

export interface AuthUser {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  avatar?: string;
  position?: { name: string };
  company?: { name: string };
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: AuthUser["role"]) => boolean;
}

const roleLevel: Record<AuthUser["role"], number> = {
  SUPER_ADMIN: 4,
  HR_ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token && !!get().user,
  hasRole: (role) => {
    const userRole = get().user?.role;
    if (!userRole) return false;
    return roleLevel[userRole] >= roleLevel[role];
  },
}));
