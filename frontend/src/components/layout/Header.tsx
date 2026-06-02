import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const { user } = useAuthStore();

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    HR_ADMIN: "HR Admin",
    MANAGER: "Manager",
    EMPLOYEE: "พนักงาน",
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-400">{roleLabel[user?.role ?? "EMPLOYEE"]}</p>
        </div>
        {user?.avatar ? (
          <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
            {user?.firstName?.[0]}
          </div>
        )}
      </div>
    </header>
  );
}
