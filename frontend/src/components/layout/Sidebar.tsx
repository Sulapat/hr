import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, Calendar,
  ClipboardList, Package, BarChart2, Settings, LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRole } from "@/hooks/useRole";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "ภาพรวม", minRole: "EMPLOYEE" },
  { to: "/employees", icon: Users, label: "พนักงาน", minRole: "HR_ADMIN" },
  { to: "/ot", icon: Clock, label: "ขอ OT", minRole: "EMPLOYEE" },
  { to: "/leave", icon: Calendar, label: "ใบลา", minRole: "EMPLOYEE" },
  { to: "/timesheet", icon: ClipboardList, label: "TimeSheet", minRole: "EMPLOYEE" },
  { to: "/stock", icon: Package, label: "Inventory", minRole: "HR_ADMIN" },
  { to: "/reports", icon: BarChart2, label: "รายงาน", minRole: "HR_ADMIN" },
  { to: "/settings", icon: Settings, label: "ตั้งค่า", minRole: "SUPER_ADMIN" },
];

const roleLevel: Record<string, number> = {
  SUPER_ADMIN: 4, HR_ADMIN: 3, MANAGER: 2, EMPLOYEE: 1,
};

export default function Sidebar() {
  const { logout } = useAuthStore();
  const { role } = useRole();

  const filtered = navItems.filter(
    (item) => roleLevel[role ?? "EMPLOYEE"] >= roleLevel[item.minRole]
  );

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-blue-600">HR System</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
