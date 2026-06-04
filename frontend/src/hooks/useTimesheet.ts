import { useEffect, useState } from "react";
import { useRole } from "@/hooks/useRole";
import { useAuthStore } from "@/store/authStore";

// ─── Types ────────────────────────────────────────────────
export interface TypeWork {
  id: string;
  name: string;
}

export interface TimesheetUser {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export interface TimesheetEntry {
  id: string;
  date: string;
  workHours: number | null;
  typeWorkId: string | null;
  typeWork: TypeWork | null;
  note: string | null;
  user: TimesheetUser;
}

export interface FormState {
  workHours: string;
  typeWorkId: string;
  note: string;
}

const EMPTY_FORM: FormState = { workHours: "1", typeWorkId: "", note: "" };

// ─── DEV ONLY: สลับ role ตอนเทส (ลบออกก่อน deploy) ──────
const DEV_ROLE_OVERRIDE: "manager" | "employee" | null = "manager";
//   null       → ใช้ role จริงจาก auth
//   "manager"  → บังคับเป็น manager
//   "employee" → บังคับเป็น employee

// ─── Safe JSON helper ─────────────────────────────────────
async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) {
    console.error(`[${res.status}] ${res.url} — empty response body`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    console.error(`[${res.status}] ${res.url} — invalid JSON:`, text.slice(0, 200));
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────
export function useTimesheet() {
  const { isEmployee } = useRole();
  const token = useAuthStore((s) => s.token);
  const isManager = DEV_ROLE_OVERRIDE
    ? DEV_ROLE_OVERRIDE === "manager"
    : !isEmployee;

  // แนบ Authorization header ทุก request อัตโนมัติ
  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedUserId, setSelectedUserId] = useState("");

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [typeWorks, setTypeWorks] = useState<TypeWork[]>([]);
  const [subordinates, setSubordinates] = useState<TimesheetUser[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Edit modal state ──
  const [editTarget, setEditTarget] = useState<TimesheetEntry | null>(null);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── Delete modal state ──
  const [deleteTarget, setDeleteTarget] = useState<TimesheetEntry | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ─── Fetchers ─────────────────────────────────────────────
  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (isManager && selectedUserId) params.set("userId", selectedUserId);

      const res = await authFetch(`/api/timesheets?${params}`);
      const json = await safeJson(res);
      setEntries(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTypeWorks() {
    const res = await authFetch("/api/type-works");
    const json = await safeJson(res);
    setTypeWorks(json?.data ?? []);
  }

  async function fetchSubordinates() {
    const res = await authFetch("/api/users/subordinates");
    const json = await safeJson(res);
    setSubordinates(json?.data ?? []);
  }

  useEffect(() => {
    fetchTypeWorks();
    if (isManager) fetchSubordinates();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [month, year, selectedUserId]);

  // ─── Edit handlers ────────────────────────────────────────
  function openAdd(dateStr: string) {
    setEditTarget(null);
    setEditDate(dateStr);
    setForm(EMPTY_FORM);
    setEditOpen(true);
  }

  function openEdit(entry: TimesheetEntry) {
    setEditTarget(entry);
    setEditDate(entry.date.slice(0, 10));
    setForm({
      workHours: String(entry.workHours ?? 1),
      typeWorkId: entry.typeWorkId ?? "",
      note: entry.note ?? "",
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  async function handleSave() {
    const payload = {
      date: editDate,
      workHours: form.workHours,
      typeWorkId: form.typeWorkId || null,
      note: form.note || null,
    };

    if (editTarget) {
      await authFetch(`/api/timesheets/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await authFetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditOpen(false);
    fetchEntries();
  }

  // ─── Delete handlers ──────────────────────────────────────
  function openDelete(entry: TimesheetEntry) {
    setDeleteTarget(entry);
    setDeleteOpen(true);
  }

  function closeDelete() {
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await authFetch(`/api/timesheets/${deleteTarget.id}`, { method: "DELETE" });
    closeDelete();
    fetchEntries();
  }

  // ─── Derived values ───────────────────────────────────────
  const totalHours = entries.reduce((s, e) => s + (e.workHours ?? 0), 0);
  const uniqueDays = new Set(entries.map((e) => e.date.slice(0, 10))).size;

  return {
    month, setMonth,
    year, setYear,
    selectedUserId, setSelectedUserId,

    entries,
    typeWorks,
    subordinates,
    loading,

    isManager,
    totalHours,
    uniqueDays,

    editTarget,
    editDate,
    editOpen,
    form, setForm,
    openAdd,
    openEdit,
    closeEdit,
    handleSave,

    deleteTarget,
    deleteOpen,
    openDelete,
    closeDelete,
    handleDelete,
  };
}