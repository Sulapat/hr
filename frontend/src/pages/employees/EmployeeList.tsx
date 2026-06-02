import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Plus, Search, Eye, Edit2, Trash2,
  Shield, ChevronDown, UserCheck, X,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { userApi } from "@/api/userApi";
import { useRole } from "@/hooks/useRole";
import { useAuthStore } from "@/store/authStore";
import UserFormModal from "@/components/employees/UserFormModal";
import UserProfileModal from "@/components/employees/UserProfileModal";
import DeleteUserModal from "@/components/employees/DeleteUserModal";

// ─── Constants ───────────────────────────────────────────
type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; dot: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "text-purple-700", bg: "bg-purple-50 border-purple-200",  dot: "bg-purple-500" },
  HR_ADMIN:    { label: "HR Admin",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-500"   },
  MANAGER:     { label: "Manager",     color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200",  dot: "bg-indigo-500" },
  EMPLOYEE:    { label: "พนักงาน",     color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",      dot: "bg-gray-400"   },
};

const STAT_CARDS = [
  { role: null,          label: "ทั้งหมด",      icon: Users,     color: "from-blue-500 to-blue-600" },
  { role: "MANAGER",     label: "Manager",      icon: Shield,    color: "from-indigo-500 to-indigo-600" },
  { role: "HR_ADMIN",    label: "HR Admin",     icon: UserCheck, color: "from-cyan-500 to-cyan-600" },
  { role: "EMPLOYEE",    label: "พนักงาน",      icon: Users,     color: "from-slate-500 to-slate-600" },
];

// ─── Helpers ─────────────────────────────────────────────
const getInitials = (u: any) =>
  `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();

const formatDate = (d: string | null) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: th }) : "-";

// ─── Role Badge ──────────────────────────────────────────
const RoleBadge = ({ role }: { role: Role }) => {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.EMPLOYEE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Avatar ──────────────────────────────────────────────
const UserAvatar = ({ user }: { user: any }) => (
  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
    {user.avatar ? (
      <img
        src={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${user.avatar}`}
        alt={`${user.firstName} ${user.lastName}`}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-white text-xs font-bold">{getInitials(user)}</span>
    )}
  </div>
);

// ─── Skeleton row ────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-gray-50">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Main Page ───────────────────────────────────────────
export default function EmployeeListPage() {
  const { isSuperAdmin, isHRAdmin, isManager } = useRole();
  const { user: currentUser } = useAuthStore();

  const canEdit   = isHRAdmin;   // HR_ADMIN and above
  const canDelete = isSuperAdmin; // only SUPER_ADMIN

  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState<Role | "ALL">("ALL");
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const [modalCreate, setModalCreate]   = useState(false);
  const [editingUser, setEditingUser]   = useState<any>(null);
  const [viewingUser, setViewingUser]   = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);

  // ── Fetch ──
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.getAll().then((r) => r.data ?? r),
  });
  const users: any[] = data ?? [];

  // ── Filter ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchSearch =
        !q ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q) ||
        u.position?.name?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  // ── Stats ──
  const stats = STAT_CARDS.map((s) => ({
    ...s,
    count: s.role ? users.filter((u) => u.role === s.role).length : users.length,
  }));

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500 mt-0.5">บริหารบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModalCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้ใช้งาน
          </button>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{s.count}</span>
              </div>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, รหัสพนักงาน..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role filter */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition min-w-[140px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                {roleFilter === "ALL" ? "ทุก Role" : ROLE_CONFIG[roleFilter]?.label}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[160px]">
                {[{ value: "ALL", label: "ทุก Role" }, ...Object.entries(ROLE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setRoleFilter(o.value as any); setShowRoleMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${roleFilter === o.value ? "text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Result count */}
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            แสดง <span className="font-semibold text-gray-700">{filtered.length}</span> รายการ
            {roleFilter !== "ALL" && <span> · กรอง: {ROLE_CONFIG[roleFilter]?.label}</span>}
            {search && <span> · ค้นหา: "{search}"</span>}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["พนักงาน", "ตำแหน่ง / Role", "อีเมล", "สถานะ", "ผู้จัดการ", "วันเริ่มงาน", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">ไม่พบผู้ใช้งาน</p>
                    </td>
                  </tr>
                )
                : filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-50 hover:bg-blue-50/30 transition ${isSelf ? "bg-blue-50/20" : ""}`}
                    >
                      {/* Name + avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">คุณ</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{u.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Position + Role */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-700">{u.position?.name ?? "-"}</p>
                        <div className="mt-1">
                          <RoleBadge role={u.role} />
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-sm text-gray-600">{u.email}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {u.status ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            {u.status.name}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </td>

                      {/* Manager */}
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {u.manager
                          ? `${u.manager.firstName} ${u.manager.lastName}`
                          : <span className="text-gray-300">-</span>
                        }
                      </td>

                      {/* Start date */}
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {formatDate(u.startDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {/* View */}
                          <button
                            onClick={() => setViewingUser(u)}
                            title="ดูข้อมูล"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => setEditingUser(u)}
                              title="แก้ไข"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete — cannot delete self */}
                          {canDelete && !isSelf && (
                            <button
                              onClick={() => setDeletingUser(u)}
                              title="ลบ"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* OT Permission Note */}
        {(isManager || isHRAdmin || isSuperAdmin) && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">การอนุมัติ OT:</span> เฉพาะ Manager ขึ้นไปเท่านั้นที่อนุมัติได้ และ<span className="font-semibold"> ไม่สามารถอนุมัติ OT ของตัวเองได้</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modalCreate && (
        <UserFormModal onClose={() => setModalCreate(false)} />
      )}
      {editingUser && (
        <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
      {viewingUser && (
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
      {deletingUser && (
        <DeleteUserModal user={deletingUser} onClose={() => setDeletingUser(null)} />
      )}
    </div>
  );
}
