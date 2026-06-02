import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { otApi } from "@/api/otApi";

interface Props {
  editData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const computeNetHours = (start: string, end: string): number => {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startDate = new Date(2000, 0, 1, sh, sm);
  const endDate   = new Date(2000, 0, 1, eh, em);
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  let raw = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  // หักพัก: ถ้าครอบช่วงเที่ยง หัก 1 ชม.
  if (sh <= 12 && eh >= 13) raw -= 1;
  return Math.max(0, Math.round(raw * 100) / 100);
};

const formatHours = (h: number) => {
  if (!h) return "0 ชม.";
  const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins} นาที`;
  if (mins === 0) return `${hrs} ชม.`;
  return `${hrs} ชม. ${mins} นาที`;
};

export default function OTFormModal({ editData, onClose, onSuccess }: Props) {
  const isView = editData && editData.status !== "PENDING";

  const [form, setForm] = useState({
    date:      editData?.date?.slice(0, 10) ?? "",
    startTime: editData?.startTime ?? "",
    endTime:   editData?.endTime   ?? "",
    otTypeId:  editData?.otTypeId  ?? "",
    reason:    editData?.reason    ?? "",
  });

  const hours = computeNetHours(form.startTime, form.endTime);

  const { data: typesData } = useQuery({
    queryKey: ["ot-types"],
    queryFn: () => otApi.getTypes().then((r) => r.data),
  });

  // Auto detect ประเภทวัน
  useEffect(() => {
    if (!form.date || editData) return;
    const day = new Date(form.date).getDay();
    const types: any[] = typesData || [];
    if (day === 0 || day === 6) {
      const weekend = types.find((t) => t.name.includes("หยุด"));
      if (weekend) setForm((f) => ({ ...f, otTypeId: weekend.id }));
    } else {
      const weekday = types.find((t) => t.name.includes("ธรรมดา"));
      if (weekday) setForm((f) => ({ ...f, otTypeId: weekday.id }));
    }
  }, [form.date, typesData]);

  const mutation = useMutation({
    mutationFn: (data: any) => editData ? Promise.resolve() : otApi.create(data),
    onSuccess: () => {
      toast.success(editData ? "บันทึกแล้ว" : "ส่งคำขอ OT สำเร็จ");
      onSuccess();
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const handleSubmit = () => {
    if (!form.date || !form.startTime || !form.endTime) {
      toast.error("กรุณากรอกวันที่และเวลาให้ครบ"); return;
    }
    if (hours <= 0) { toast.error("เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น"); return; }
    mutation.mutate({ ...form, hours });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {isView ? "รายละเอียดคำขอ OT" : editData ? "แก้ไขคำขอ OT" : "ฟอร์มขอ OT"}
              </h2>
              <p className="text-xs text-gray-400">กรอกรายละเอียดการทำงานล่วงเวลา</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ทำ OT *</label>
              <input type="date" value={form.date} disabled={isView}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทวัน</label>
              <select value={form.otTypeId} disabled={isView}
                onChange={(e) => setForm((f) => ({ ...f, otTypeId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="">-- เลือก --</option>
                {(typesData || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} (×{t.multiplier})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่มต้น *</label>
              <input type="time" value={form.startTime} disabled={isView}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด *</label>
              <input type="time" value={form.endTime} disabled={isView}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
          </div>

          {/* Hours summary */}
          <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-blue-700">รวมชั่วโมง OT (หักพักเที่ยง)</span>
            <span className="font-bold text-blue-800 text-lg">{formatHours(hours)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดงาน *</label>
            <textarea rows={3} value={form.reason} disabled={isView}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="ระบุงานที่ต้องทำ OT..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50" />
          </div>
        </div>

        {/* Footer */}
        {!isView && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
              ยกเลิก
            </button>
            <button onClick={handleSubmit} disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {mutation.isPending ? "กำลังส่ง..." : "บันทึกคำขอ OT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
