import { X, User, Mail, Phone, Briefcase, Calendar, Shield, Building2, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Props {
  user: any;
  onClose: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "text-purple-700", bg: "bg-purple-100" },
  HR_ADMIN:    { label: "HR Admin",    color: "text-blue-700",   bg: "bg-blue-100"   },
  MANAGER:     { label: "Manager",     color: "text-indigo-700", bg: "bg-indigo-100" },
  EMPLOYEE:    { label: "พนักงาน",     color: "text-gray-700",   bg: "bg-gray-100"   },
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
    </div>
  </div>
);

export default function UserProfileModal({ user, onClose }: Props) {
  const role = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.EMPLOYEE;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const formatDate = (d: string | null) =>
    d ? format(new Date(d), "dd MMMM yyyy", { locale: th }) : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-6 pb-14 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-lg">ข้อมูลผู้ใช้งาน</h2>
          <p className="text-blue-200 text-sm">รหัส: {user.employeeId}</p>
        </div>

        {/* Avatar overlap */}
        <div className="relative px-6 -mt-10 mb-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}${user.avatar}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">{initials}</span>
              )}
            </div>
            <div className="mb-1">
              <h3 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${role.bg} ${role.color}`}>
                <Shield className="w-3 h-3" />
                {role.label}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl px-4 py-1 divide-y divide-gray-50">
            <InfoRow icon={Mail}      label="อีเมล"     value={user.email} />
            <InfoRow icon={Phone}     label="เบอร์โทร"  value={user.phone} />
            <InfoRow icon={Briefcase} label="ตำแหน่ง"  value={user.position?.name} />
            <InfoRow icon={Building2} label="บริษัท"    value={user.company?.name} />
            <InfoRow icon={UserCheck} label="สถานะ"     value={user.status?.name} />
            <InfoRow
              icon={User}
              label="ผู้จัดการ"
              value={user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : null}
            />
            <InfoRow icon={Calendar} label="วันเริ่มงาน"   value={formatDate(user.startDate)} />
            <InfoRow icon={Calendar} label="วันเกิด"       value={formatDate(user.birthDate)} />
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
