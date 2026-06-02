import { Trash2, AlertTriangle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userApi } from "@/api/userApi";

interface Props {
  user: any;
  onClose: () => void;
}

export default function DeleteUserModal({ user, onClose }: Props) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => userApi.delete(user.id),
    onSuccess: () => {
      toast.success("ลบผู้ใช้งานสำเร็จ");
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: () => toast.error("ไม่สามารถลบผู้ใช้งานได้"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">ยืนยันการลบผู้ใช้งาน</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 text-center">
            <p className="text-gray-600 text-sm mb-2">คุณต้องการลบผู้ใช้งาน</p>
            <p className="text-red-600 font-bold text-lg">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-gray-400 text-xs mt-1">รหัส: {user.employeeId}</p>
            <p className="text-gray-500 text-sm mt-3">
              การกระทำนี้<span className="font-semibold text-red-600"> ไม่สามารถเรียกคืนได้</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl transition"
            >
              <Trash2 className="w-4 h-4" />
              {mutation.isPending ? "กำลังลบ..." : "ลบผู้ใช้งาน"}
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
    </div>
  );
}
