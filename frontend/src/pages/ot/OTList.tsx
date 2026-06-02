import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Check, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { otApi } from "@/api/otApi";
import { useRole } from "@/hooks/useRole";
import OTFormModal from "./OTFormModal";
import OTApproveModal from "./OTApproveModal";
import OTRejectModal from "./OTRejectModal";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "รอพิจารณา",  color: "text-amber-700", bg: "bg-amber-50" },
  APPROVED: { label: "อนุมัติแล้ว", color: "text-green-700", bg: "bg-green-50" },
  REJECTED: { label: "ไม่อนุมัติ",  color: "text-red-700",   bg: "bg-red-50"   },
};

const formatHours = (h: number | null) => {
  if (!h) return "0 ชม.";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins} นาที`;
  if (mins === 0) return `${hrs} ชม.`;
  return `${hrs} ชม. ${mins} นาที`;
};

const formatDate = (d: string) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: th }) : "-";

export default function OTListPage() {
  const queryClient = useQueryClient();
  const { isManager, isEmployee } = useRole();

  const [showForm, setShowForm]       = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject]   = useState(false);
  const [selectedOT, setSelectedOT]   = useState<any>(null);
  const [editingOT, setEditingOT]     = useState<any>(null);
  const [tab, setTab]                 = useState<"all" | "pending">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["ot"],
    queryFn: () => otApi.getAll().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => otApi.delete(id),
    onSuccess: () => {
      toast.success("ลบคำขอ OT แล้ว");
      queryClient.invalidateQueries({ queryKey: ["ot"] });
    },
  });

  const rows: any[] = data || [];
  const pendingRows = rows.filter((r) => r.status === "PENDING");
  const displayRows = tab === "pending" ? pendingRows : rows;

  const openApprove = (row: any) => { setSelectedOT(row); setShowApprove(true); };
  const openReject  = (row: any) => { setSelectedOT(row); setShowReject(true); };
  const openEdit    = (row: any) => { setEditingOT(row);  setShowForm(true); };
  const openNew     = ()         => { setEditingOT(null); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ระบบ OT</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการคำขอการทำงานล่วงเวลา</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> ขอ OT ใหม่
        </button>
      </div>

      {isManager && (
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all",     label: "รายการทั้งหมด" },
            { key: "pending", label: `รออนุมัติ (${pendingRows.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === t.key ? "bg-white shadow text-blue-600" : "text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
        ) : displayRows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>ไม่มีรายการ OT</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  {!isEmployee && <th className="px-4 py-3 text-left">พนักงาน</th>}
                  <th className="px-4 py-3 text-left">วันที่ทำ OT</th>
                  <th className="px-4 py-3 text-center">เวลา</th>
                  <th className="px-4 py-3 text-center">ชั่วโมง</th>
                  <th className="px-4 py-3 text-left">รายละเอียด</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayRows.map((row, i) => {
                  const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      {!isEmployee && (
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.user?.firstName} {row.user?.lastName}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-700">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {row.startTime} – {row.endTime}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-700">
                        {formatHours(row.hours)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                        {row.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {isManager && row.status === "PENDING" && (
                            <>
                              <button onClick={() => openApprove(row)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="อนุมัติ">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => openReject(row)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="ปฏิเสธ">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition" title="ดูรายละเอียด">
                            <Eye className="w-4 h-4" />
                          </button>
                          {row.status === "PENDING" && isEmployee && (
                            <button
                              onClick={() => { if (confirm("ลบคำขอ OT นี้?")) deleteMutation.mutate(row.id); }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition"
                              title="ลบ"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <OTFormModal editData={editingOT} onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["ot"] }); }} />
      )}
      {showApprove && selectedOT && (
        <OTApproveModal ot={selectedOT} onClose={() => setShowApprove(false)}
          onSuccess={() => { setShowApprove(false); queryClient.invalidateQueries({ queryKey: ["ot"] }); }}
          onReject={() => { setShowApprove(false); setShowReject(true); }} />
      )}
      {showReject && selectedOT && (
        <OTRejectModal ot={selectedOT} onClose={() => setShowReject(false)}
          onSuccess={() => { setShowReject(false); queryClient.invalidateQueries({ queryKey: ["ot"] }); }} />
      )}
    </div>
  );
}
