import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { otApi } from "@/api/otApi";

interface Props {
  ot: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OTRejectModal({ ot, onClose, onSuccess }: Props) {
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () => otApi.approve(ot.id, "REJECTED", note),
    onSuccess: () => { toast.success("ปฏิเสธคำขอ OT แล้ว"); onSuccess(); },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-semibold text-gray-800">ยืนยันการปฏิเสธ OT</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 text-center">
            ยืนยันปฏิเสธคำขอ OT ของ{" "}
            <span className="font-semibold text-gray-800">
              {ot.user?.firstName} {ot.user?.lastName}
            </span>{" "}
            วันที่{" "}
            <span className="font-semibold">
              {ot.date ? format(new Date(ot.date), "dd/MM/yyyy", { locale: th }) : "-"}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เหตุผลที่ปฏิเสธ (ไม่บังคับ)
            </label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุเหตุผล..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            ยกเลิก
          </button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
            {mutation.isPending ? "กำลังบันทึก..." : "ยืนยันปฏิเสธ"}
          </button>
        </div>
      </div>
    </div>
  );
}
