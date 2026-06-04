import { useTimesheet } from "@/hooks/useTimesheet";

// ─── Helpers ──────────────────────────────────────────────
function toThaiDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function groupByDate(entries: ReturnType<typeof useTimesheet>["entries"]) {
  const map = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

// ─── Sub-components ───────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function BadgeType({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
      {name}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function TimesheetPage() {
  const {
    month, setMonth, year, setYear,
    selectedUserId, setSelectedUserId,
    entries, typeWorks, subordinates, loading,
    isManager, totalHours, uniqueDays,
    editTarget, editDate, editOpen, form, setForm,
    openAdd, openEdit, closeEdit, handleSave,
    deleteTarget, deleteOpen, openDelete, closeDelete, handleDelete,
  } = useTimesheet();

  const today = todayISO();
  const now = new Date();
  const grouped = groupByDate(entries);
  const sortedDates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i, 1).toLocaleDateString("th-TH", { month: "long" }),
  }));
  const yearOptions = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-medium text-gray-900 flex items-center gap-2">
          <span>📋</span> Timesheet
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y + 543}</option>
            ))}
          </select>
          {!isManager && (
            <button
              onClick={() => openAdd(today)}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
            >
              + เพิ่มงาน
            </button>
          )}
        </div>
      </div>

      {/* Manager: employee filter */}
      {isManager && (
        <div className="flex items-center gap-2 mb-5 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-700">ดูข้อมูลพนักงาน:</span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-3 py-1.5 bg-white text-blue-700"
          >
            <option value="">— ข้อมูลของฉัน —</option>
            {subordinates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.employeeId})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="งานทั้งหมด" value={entries.length} sub="รายการ / เดือนนี้" />
        <StatCard label="ชั่วโมงรวม" value={totalHours} sub="ชม. สะสม" />
        <StatCard label="วันที่บันทึก" value={uniqueDays} sub="วัน / เดือนนี้" />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">กำลังโหลด...</p>
      ) : sortedDates.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีรายการในเดือนนี้</p>
      ) : (
        sortedDates.map((dateKey) => {
          const dayEntries = grouped.get(dateKey)!;
          const isToday = dateKey === today;
          const dayHours = dayEntries.reduce((s, e) => s + (e.workHours ?? 0), 0);

          return (
            <div key={dateKey} className="mb-3">
              <div className={`flex items-center justify-between px-3.5 py-2 rounded-lg mb-1.5 ${
                isToday ? "bg-blue-50 border border-blue-200" : "bg-gray-100 border border-gray-200"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isToday ? "text-blue-700" : "text-gray-800"}`}>
                    {toThaiDate(dateKey)}
                  </span>
                  {isToday && (
                    <span className="text-xs font-medium bg-blue-700 text-white px-2 py-0.5 rounded-full">
                      วันนี้
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {dayHours} ชม. · {dayEntries.length} งาน
                </span>
              </div>

              {dayEntries.map((entry) => (
                <div key={entry.id}
                  className="ml-3 mb-1.5 flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 hover:border-gray-300 transition-colors"
                >
                  {isManager && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {entry.user.firstName} {entry.user.lastName}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
                    {entry.note ?? "—"}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                    🕐 {entry.workHours ?? 0} ชม.
                  </span>
                  {entry.typeWork && <BadgeType name={entry.typeWork.name} />}
                  {!isManager && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(entry)}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="แก้ไข">✏️</button>
                      <button onClick={() => openDelete(entry)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="ลบ">🗑️</button>
                    </div>
                  )}
                </div>
              ))}

              {isToday && !isManager && (
                <div className="ml-3 mt-1">
                  <button onClick={() => openAdd(today)}
                    className="text-xs text-gray-400 border border-dashed border-gray-300 px-3 py-1.5 rounded-lg hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    + เพิ่มงานวันนี้
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-5 w-[360px] shadow-sm">
            <h2 className="text-base font-medium text-gray-900 mb-4">
              {editTarget ? "แก้ไขรายการ" : "บันทึกงานวันนี้"}
            </h2>
            <div className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              📅 {toThaiDate(editDate!)}
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">รายละเอียดงานที่ทำ</label>
              <textarea rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 resize-none focus:outline-none focus:border-blue-400"
                placeholder="เช่น ประชุมทีม, เขียน Report, ตรวจสอบงาน ..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ชั่วโมงที่ใช้</label>
                <input type="number" min={0.5} max={24} step={0.5}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:border-blue-400"
                  value={form.workHours}
                  onChange={(e) => setForm({ ...form, workHours: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ประเภทงาน</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:border-blue-400"
                  value={form.typeWorkId}
                  onChange={(e) => setForm({ ...form, typeWorkId: e.target.value })}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {typeWorks.map((tw) => (
                    <option key={tw.id} value={tw.id}>{tw.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeEdit}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleSave}
                className="text-sm px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteOpen && deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-5 w-[340px] shadow-sm">
            <h2 className="text-base font-medium text-red-700 mb-1 flex items-center gap-2">
              🗑️ ยืนยันการลบ
            </h2>
            <p className="text-sm text-gray-500 mb-3">คุณต้องการลบรายการนี้ออกจากประวัติ?</p>
            <div className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2 mb-1">
              {deleteTarget.note ?? "—"}
            </div>
            <p className="text-xs text-gray-400 mb-5">การลบไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-end gap-2">
              <button onClick={closeDelete}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleDelete}
                className="text-sm px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 flex items-center gap-1.5">
                🗑️ ลบรายการนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}