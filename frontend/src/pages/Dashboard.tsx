import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Calendar, Package } from "lucide-react";
import { reportApi } from "@/api/reportApi";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value ?? "-"}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportApi.getDashboard,
  });

  const stats = data?.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ภาพรวม</h1>
      {isLoading ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="พนักงานทั้งหมด" value={stats?.totalEmployees} icon={Users} color="bg-blue-500" />
          <StatCard title="รออนุมัติ OT" value={stats?.pendingOT} icon={Clock} color="bg-amber-500" />
          <StatCard title="รออนุมัติการลา" value={stats?.pendingLeave} icon={Calendar} color="bg-green-500" />
          <StatCard title="สินค้าสต็อกต่ำ" value={stats?.lowStock?.length} icon={Package} color="bg-red-500" />
        </div>
      )}

      {stats?.lowStock?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
          <h2 className="font-semibold text-red-600 mb-3">⚠️ สินค้าใกล้หมดสต็อก</h2>
          <div className="space-y-2">
            {stats.lowStock.map((s: any) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span>{s.item.name}</span>
                <span className="font-medium text-red-500">เหลือ {s.quantity} ชิ้น</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
