import { X, CheckCircle, Clock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { otApi } from "@/api/otApi";

interface Props {
  ot: any;
  onClose: () => void;
  onSuccess: () => void;
  onReject: () => void;
}

const formatHours = (h: number) => {
  if (!h) return "0 ชม.";
  const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60);
  return mins === 0 ? `${hrs} ชม.` : `${hrs} ชม. ${mins} นาที`;
};

export default function OTApproveModal({ ot, onClose, onSuccess, onReject }: Props) {
  const mutation = useMutation({
    mutationFn: () => otApi.approve(ot.id, "APPROVED"),
    onSuccess: () => { toast.success("อนุมัติ OT สำเร็จ"); onSuccess(); },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-800">พิจารณาอนุมัติ OT</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">พนักงาน</p>
              <p className="font-semibold text-gray-800">{ot.user?.firstName} {ot.user?.lastName}</p>
            </div>
            <div>
              <p className="text-gray-400">วันที่ทำ OT</p>
              <p className="font-semibold text-gray-800">
                {ot.date ? format(new Date(ot.date), "dd/MM/yyyy", { locale: th }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">เวลา</p>
              <p className="font-semibold text-gray-800">{ot.startTime} – {ot.endTime}</p>
            </div>
            <div>
              <p className="text-gray-400">ชั่วโมง</p>
              <p className="font-semibold text-blue-700">{formatHours(ot.hours)}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-gray-400">รายละเอียดงาน</p>
            <p className="text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">{ot.reason || "-"}</p>
          </div>

          {/* Final approved hours box */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">ชั่วโมงที่อนุมัติ</span>
            </div>
            <span className="text-2xl font-bold text-green-800">{formatHours(ot.hours)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onReject}
            className="flex-1 py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition">
            ปฏิเสธ
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
            {mutation.isPending ? "กำลังบันทึก..." : "อนุมัติ OT"}
          </button>
        </div>
      </div>
    </div>
  );
}
