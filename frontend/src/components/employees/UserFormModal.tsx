import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Lock, Briefcase, Calendar, Shield, Building2, UserCheck, Eye, EyeOff, Hash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userApi } from "@/api/userApi";
import { positionApi } from "@/api/positionApi";
import { statusApi } from "@/api/statusApi";
import { useAuthStore } from "@/store/authStore";

// ─── Types ───────────────────────────────────────────────
type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "HR_ADMIN",    label: "HR Admin"    },
  { value: "MANAGER",     label: "Manager"     },
  { value: "EMPLOYEE",    label: "พนักงาน"     },
];

const roleLevel: Record<Role, number> = {
  SUPER_ADMIN: 4, HR_ADMIN: 3, MANAGER: 2, EMPLOYEE: 1,
};

interface Props {
  user?: any; // null = create mode
  onClose: () => void;
}

// ─── Field component ─────────────────────────────────────
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white placeholder-gray-400";
const selectCls = inputCls;

// ─── Main Component ──────────────────────────────────────
export default function UserFormModal({ user, onClose }: Props) {
  const isEdit = !!user;
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "EMPLOYEE" as Role,
    positionId: "",
    statusId: "",
    managerId: "",
    startDate: "",
    birthDate: "",
    companyId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill on edit
  useEffect(() => {
    if (user) {
      setForm({
        employeeId: user.employeeId ?? "",
        firstName:  user.firstName ?? "",
        lastName:   user.lastName ?? "",
        email:      user.email ?? "",
        phone:      user.phone ?? "",
        password:   "",
        role:       user.role ?? "EMPLOYEE",
        positionId: user.positionId ?? "",
        statusId:   user.statusId ?? "",
        managerId:  user.managerId ?? "",
        startDate:  user.startDate ? user.startDate.slice(0, 10) : "",
        birthDate:  user.birthDate ? user.birthDate.slice(0, 10) : "",
        companyId:  user.companyId ?? "",
      });
    }
  }, [user]);

  // Fetch positions, statuses, and users (for manager select)
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: () => positionApi.getAll().then((r) => r.data ?? r),
  });
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => statusApi.getAll().then((r) => r.data ?? r),
  });
  const { data: usersRaw } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.getAll().then((r) => r.data ?? r),
  });

  // Manager candidates: MANAGER and above (exclude self in edit mode)
  const managerCandidates = (usersRaw ?? []).filter(
    (u: any) => roleLevel[u.role as Role] >= roleLevel.MANAGER && u.id !== user?.id,
  );

  // Roles the current user is allowed to assign (can't assign higher than yourself)
  const allowedRoles = ROLE_OPTIONS.filter(
    (r) => roleLevel[r.value] <= roleLevel[currentUser?.role as Role ?? "EMPLOYEE"],
  );

  // ── Mutation ──
  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? userApi.update(user.id, data) : userApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มผู้ใช้งานสำเร็จ");
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "เกิดข้อผิดพลาด";
      toast.error(msg);
    },
  });

  // ── Validation ──
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.employeeId.trim()) e.employeeId = "กรุณาระบุรหัสพนักงาน";
    if (!form.firstName.trim())  e.firstName  = "กรุณาระบุชื่อ";
    if (!form.lastName.trim())   e.lastName   = "กรุณาระบุนามสกุล";
    if (!form.email.trim())      e.email      = "กรุณาระบุอีเมล";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!isEdit && !form.password) e.password = "กรุณาระบุรหัสผ่าน";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const onSubmit = () => {
    if (!validate()) return;
    const payload: any = { ...form };
    if (!payload.positionId) delete payload.positionId;
    if (!payload.statusId)   delete payload.statusId;
    if (!payload.managerId)  delete payload.managerId;
    if (!payload.companyId)  delete payload.companyId;
    if (!payload.startDate)  delete payload.startDate;
    if (!payload.birthDate)  delete payload.birthDate;
    if (!payload.password)   delete payload.password; // skip blank password on edit
    mutation.mutate(payload);
  };

  const errCls = (key: string) =>
    errors[key] ? "border-red-300 focus:ring-red-400" : "";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit ? `แก้ไขข้อมูลของ ${user.firstName} ${user.lastName}` : "กรอกข้อมูลบัญชีผู้ใช้งานใหม่"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Employee ID */}
            <Field label="รหัสพนักงาน" required>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                  placeholder="เช่น EMP001"
                  className={`${inputCls} pl-9 ${errCls("employeeId")}`}
                />
              </div>
              {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
            </Field>

            {/* Role */}
            <Field label="สิทธิ์การใช้งาน" required>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={form.role} onChange={(e) => set("role", e.target.value)} className={`${selectCls} pl-9`}>
                  {allowedRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* First Name */}
            <Field label="ชื่อ" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="ชื่อจริง"
                  className={`${inputCls} pl-9 ${errCls("firstName")}`}
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </Field>

            {/* Last Name */}
            <Field label="นามสกุล" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="นามสกุล"
                  className={`${inputCls} pl-9 ${errCls("lastName")}`}
                />
              </div>
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </Field>

            {/* Email */}
            <Field label="อีเมล" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="example@company.com"
                  className={`${inputCls} pl-9 ${errCls("email")}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </Field>

            {/* Phone */}
            <Field label="เบอร์โทร">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="0812345678"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            {/* Password */}
            <Field label={isEdit ? "รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)" : "รหัสผ่าน"} required={!isEdit}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={isEdit ? "เว้นว่างหากไม่ต้องการเปลี่ยน" : "กรอกรหัสผ่าน"}
                  className={`${inputCls} pl-9 pr-10 ${errCls("password")}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </Field>

            {/* Position */}
            <Field label="ตำแหน่งงาน">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={form.positionId} onChange={(e) => set("positionId", e.target.value)} className={`${selectCls} pl-9`}>
                  <option value="">-- เลือกตำแหน่ง --</option>
                  {positions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* Status */}
            <Field label="สถานะพนักงาน">
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={form.statusId} onChange={(e) => set("statusId", e.target.value)} className={`${selectCls} pl-9`}>
                  <option value="">-- เลือกสถานะ --</option>
                  {statuses.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* Manager — only for EMPLOYEE and MANAGER roles */}
            {(form.role === "EMPLOYEE" || form.role === "MANAGER") && (
              <Field label="ผู้จัดการ (สายงาน)">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)} className={`${selectCls} pl-9`}>
                    <option value="">-- ไม่มีผู้จัดการ --</option>
                    {managerCandidates.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ผู้จัดการที่ assigned จะเป็นผู้อนุมัติ OT และการลาของพนักงานคนนี้
                </p>
              </Field>
            )}

            {/* Start Date */}
            <Field label="วันเริ่มงาน">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            {/* Birth Date */}
            <Field label="วันเกิด">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

          </div>

          {/* Role permission info box */}
          {form.role === "EMPLOYEE" && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">พนักงาน</span> สามารถยื่นคำขอ OT ได้ แต่ <span className="font-semibold">ไม่สามารถอนุมัติ OT ของตัวเองหรือผู้อื่นได้</span> — ต้องให้ Manager ขึ้นไปเป็นผู้อนุมัติ
              </p>
            </div>
          )}
          {(form.role === "MANAGER" || form.role === "HR_ADMIN" || form.role === "SUPER_ADMIN") && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">
                <span className="font-semibold">{ROLE_OPTIONS.find(r => r.value === form.role)?.label}</span> สามารถอนุมัติ OT และการลาของลูกน้องได้ แต่<span className="font-semibold"> ไม่สามารถอนุมัติให้ตัวเองได้</span>
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-xl transition"
          >
            {mutation.isPending ? "กำลังบันทึก..." : isEdit ? "อัปเดตข้อมูล" : "เพิ่มผู้ใช้งาน"}
          </button>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
