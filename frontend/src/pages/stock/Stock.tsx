import { useEffect, useState, useMemo, useRef } from "react";
import { stockApi } from "../../api/stockApi";

// ─── Types ────────────────────────────────────────────────
interface StockRecord {
  id: string;
  itemId: string;
  quantity: number;
  updatedAt: string;
}

type AssetStatus = "active" | "maintenance" | "damaged" | "retired";

interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
  minStock: number;
  imageUrl?: string;
  assetStatus?: AssetStatus;
  createdAt: string;
  updatedAt: string;
  stocks: StockRecord[];
}

interface ImportHistory {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  importedBy?: string;
  note?: string;
  importedAt: string;
}

interface ExportHistory {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  borrowedBy?: string;
  note?: string;
  exportedAt: string;
}

interface BorrowRecord {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  borrower: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "borrowing" | "overdue" | "returned";
  note?: string;
}

type Tab = "items" | "borrow" | "scan" | "import-hist" | "export-hist" | "export-report";
type StatusFilter = "" | "ok" | "warn" | "low";
type BorrowStatusFilter = "" | "borrowing" | "overdue" | "returned";

// ─── Helpers ──────────────────────────────────────────────
function getQty(item: Item): number {
  return item.stocks?.[0]?.quantity ?? 0;
}

function getStatus(item: Item): { key: "ok" | "warn" | "low"; text: string; cls: string } {
  const qty = getQty(item);
  if (qty === 0) return { key: "low", text: "หมดสต็อก", cls: "b-low" };
  if (qty <= item.minStock) return { key: "warn", text: "ใกล้หมด", cls: "b-warn" };
  return { key: "ok", text: "ปกติ", cls: "b-ok" };
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function catIcon(cat?: string): string {
  const map: Record<string, string> = {
    "อุปกรณ์ IT": "",
    "เฟอร์นิเจอร์": "",
    "เครื่องใช้สำนักงาน": "",
    "ยานพาหนะ": "",
  };
  return map[cat ?? ""] ?? "";
}

const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; cls: string; icon: string; desc: string }> = {
  active:      { label: "ใช้งานได้ปกติ", cls: "b-ok",   icon: "", desc: "พร้อมใช้งาน" },
  maintenance: { label: "ส่งซ่อม",        cls: "b-warn",   icon: "", desc: "อยู่ระหว่างซ่อมบำรุง" },
  damaged:     { label: "เสียหาย",        cls: "b-low",   icon: "", desc: "ชำรุดเสียหาย ไม่สามารถใช้งานได้" },
  retired:     { label: "ตัดจำหน่าย",     cls: "b-gray",   icon: "", desc: "ปลดระวางแล้ว" },
};

function getAssetStatus(item: Item) {
  return ASSET_STATUS_CONFIG[item.assetStatus ?? "active"];
}

// ─── Badge ────────────────────────────────────────────────
function Badge({ cls, text }: { cls: string; text: string }) {
  const styles: Record<string, React.CSSProperties> = {
    "b-ok": { background: "#EAF3DE", color: "#3B6D11" },
    "b-warn": { background: "#FAEEDA", color: "#854F0B" },
    "b-low": { background: "#FCEBEB", color: "#A32D2D" },
    "b-blue": { background: "#E6F1FB", color: "#0C447C" },
    "b-gray": { background: "#F1EFE8", color: "#5F5E5A" },
    "b-purple": { background: "#EEEDFE", color: "#3C3489" },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500, ...styles[cls] }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {text}
    </span>
  );
}

// ─── Modal: Import ────────────────────────────────────────
function ImportModal({ items, onClose, onSuccess }: { items: Item[]; onClose: () => void; onSuccess: () => void }) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!itemId || quantity < 1) { setError("กรุณาเลือกสินทรัพย์และระบุจำนวน"); return; }
    setLoading(true); setError("");
    try { await stockApi.import({ itemId, quantity, note }); onSuccess(); onClose(); }
    catch { setError("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    finally { setLoading(false); }
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>นำเข้าสต็อก</p>
        <div style={formRow}>
          <label style={formLabel}>สินทรัพย์</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} style={inputStyle}>
            <option value="">-- เลือกสินทรัพย์ --</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code}) · เหลือ {getQty(i)} {i.unit}</option>)}
          </select>
        </div>
        <div style={formRow}>
          <label style={formLabel}>จำนวน</label>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} style={inputStyle} />
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมายเหตุ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="แหล่งที่มา / วัตถุประสงค์..." style={{ ...inputStyle, height: 64, resize: "vertical" }} />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>{loading ? "กำลังบันทึก..." : "✓ บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Export/Withdraw ───────────────────────────────
function ExportModal({ items, onClose, onSuccess }: { items: Item[]; onClose: () => void; onSuccess: () => void }) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [borrowedBy, setBorrowedBy] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItem = items.find((i) => i.id === itemId);
  const maxQty = selectedItem ? getQty(selectedItem) : 0;

  async function handleSubmit() {
    if (!itemId || quantity < 1) { setError("กรุณาเลือกสินทรัพย์และระบุจำนวน"); return; }
    if (quantity > maxQty) { setError(`สต็อกไม่เพียงพอ (เหลือ ${maxQty})`); return; }
    setLoading(true); setError("");
    try { await stockApi.export({ itemId, quantity, borrowedBy, note }); onSuccess(); onClose(); }
    catch { setError("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    finally { setLoading(false); }
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>เบิกสต็อก</p>
        <div style={formRow}>
          <label style={formLabel}>สินทรัพย์</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} style={inputStyle}>
            <option value="">-- เลือกสินทรัพย์ --</option>
            {items.filter((i) => getQty(i) > 0).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code}) · เหลือ {getQty(i)} {i.unit}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={formRow}>
            <label style={formLabel}>จำนวน</label>
            <input type="number" min={1} max={maxQty} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} style={inputStyle} />
          </div>
          <div style={formRow}>
            <label style={formLabel}>ผู้รับ / เบิกโดย</label>
            <input type="text" value={borrowedBy} onChange={(e) => setBorrowedBy(e.target.value)} placeholder="ชื่อพนักงาน" style={inputStyle} />
          </div>
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมายเหตุ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="วัตถุประสงค์การเบิก..." style={{ ...inputStyle, height: 64, resize: "vertical" }} />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>{loading ? "กำลังบันทึก..." : "✓ บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Borrow ────────────────────────────────────────
function BorrowModal({
  items,
  preItemId,
  onClose,
  onSuccess,
}: {
  items: Item[];
  preItemId?: string;
  onClose: () => void;
  onSuccess: (record: BorrowRecord) => void;
}) {
  const today = new Date();
  const defaultDue = new Date(today);
  defaultDue.setDate(defaultDue.getDate() + 14);
  const defaultDueStr = defaultDue.toISOString().split("T")[0];

  const [itemId, setItemId] = useState(preItemId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [borrower, setBorrower] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueStr);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!itemId || !borrower || !dueDate) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    const item = items.find((i) => i.id === itemId);
    const newId = "BR-" + String(Date.now()).slice(-4);
    const record: BorrowRecord = {
      id: newId, itemId, item, quantity, borrower,
      borrowDate: today.toISOString().split("T")[0],
      dueDate, status: "borrowing", note,
    };
    onSuccess(record);
    onClose();
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>บันทึกการยืมสินทรัพย์</p>
        <div style={formRow}>
          <label style={formLabel}>สินทรัพย์</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} style={inputStyle}>
            <option value="">-- เลือกสินทรัพย์ --</option>
            {items.filter((i) => getQty(i) > 0).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code}) · เหลือ {getQty(i)} {i.unit}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={formRow}>
            <label style={formLabel}>จำนวน</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} style={inputStyle} />
          </div>
          <div style={formRow}>
            <label style={formLabel}>กำหนดคืน</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={formRow}>
          <label style={formLabel}>ผู้ยืม</label>
          <input type="text" value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="ชื่อพนักงาน" style={inputStyle} />
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมายเหตุ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="วัตถุประสงค์การยืม..." style={{ ...inputStyle, height: 64, resize: "vertical" }} />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary}>✓ บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Add/Edit Item ─────────────────────────────────
function ItemModal({ item, onClose, onSuccess }: { item?: Item | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!item;
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [minStock, setMinStock] = useState(item?.minStock ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!code || !name) { setError("กรุณากรอกรหัสและชื่อสินทรัพย์"); return; }
    setLoading(true); setError("");
    try {
      if (isEdit) {
        await stockApi.updateItem(item!.id, { name, description, unit, minStock, category });
      } else {
        const fd = new FormData();
        fd.append("code", code); fd.append("name", name);
        if (description) fd.append("description", description);
        if (unit) fd.append("unit", unit);
        if (category) fd.append("category", category);
        fd.append("minStock", String(minStock));
        await stockApi.createItem(fd);
      }
      onSuccess(); onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally { setLoading(false); }
  }

  const categories = ["อุปกรณ์ IT", "เฟอร์นิเจอร์", "เครื่องใช้สำนักงาน", "ยานพาหนะ"];

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>{isEdit ? "แก้ไขสินทรัพย์" : "เพิ่มสินทรัพย์ใหม่"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={formRow}>
            <label style={formLabel}>รหัสสินทรัพย์ *</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น IT-001" disabled={isEdit} style={{ ...inputStyle, ...(isEdit ? { opacity: 0.6 } : {}) }} />
          </div>
          <div style={formRow}>
            <label style={formLabel}>หน่วย</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="เช่น ชิ้น, เครื่อง" style={inputStyle} />
          </div>
        </div>
        <div style={formRow}>
          <label style={formLabel}>ชื่อสินทรัพย์ *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินทรัพย์" style={inputStyle} />
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมวดหมู่</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            <option value="">-- เลือกหมวดหมู่ --</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={formRow}>
          <label style={formLabel}>รายละเอียด</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." style={{ ...inputStyle, height: 60, resize: "vertical" }} />
        </div>
        <div style={formRow}>
          <label style={formLabel}>สต็อกขั้นต่ำ (แจ้งเตือน)</label>
          <input type="number" min={0} value={minStock} onChange={(e) => setMinStock(parseInt(e.target.value) || 0)} style={{ ...inputStyle, maxWidth: 120 }} />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>{loading ? "กำลังบันทึก..." : "✓ บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function StockPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [importHist, setImportHist] = useState<ImportHistory[]>([]);
  const [exportHist, setExportHist] = useState<ExportHistory[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [searchQ, setSearchQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowPreItem, setBorrowPreItem] = useState<string | undefined>(undefined);
  const [editItem, setEditItem] = useState<Item | null | undefined>(undefined);

  const [histSearch, setHistSearch] = useState("");
  const [borrowSearch, setBorrowSearch] = useState("");
  const [borrowStatusFilter, setBorrowStatusFilter] = useState<BorrowStatusFilter>("");

  // Scan tab
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<Item | null>(null);
  const [scanNotFound, setScanNotFound] = useState("");
  const [scanAction, setScanAction] = useState<"import" | "export" | "borrow" | "maintain" | "status" | null>(null);
  const [scanQty, setScanQty] = useState(1);
  const [scanWho, setScanWho] = useState("");
  const [scanNewStatus, setScanNewStatus] = useState<AssetStatus>("active");
  const [scanStatusNote, setScanStatusNote] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const [i, ih, eh, b] = await Promise.all([
        stockApi.getItems(),
        stockApi.getImportHistory(),
        stockApi.getExportHistory(),
        stockApi.getBorrows(),
      ]);
      setItems(i);
      setImportHist(ih);
      setExportHist(eh);
      setBorrows(b);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // 🔧 MOCKUP: sync borrows กลับหลัง fetchAll (เพราะ mock items อาจ reset)
  // ตอนใช้ API จริง ลบ useEffect นี้ออก แล้ว uncomment stockApi.getBorrows() ใน fetchAll ข้างบน
  const _borrowsRef = useRef(borrows);
  useEffect(() => { _borrowsRef.current = borrows; }, [borrows]);

  useEffect(() => { fetchAll(); }, []);

  // Stats
  const stats = useMemo(() => {
    let ok = 0, warn = 0, low = 0;
    items.forEach((i) => {
      const s = getStatus(i);
      if (s.key === "ok") ok++;
      else if (s.key === "warn") warn++;
      else low++;
    });
    const borrowing = borrows.filter((b) => b.status !== "returned").length;
    return { total: items.length, ok, warn, low, borrowing };
  }, [items, borrows]);

  const alertItems = useMemo(() => items.filter((i) => getStatus(i).key !== "ok"), [items]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQ.toLowerCase();
    return items.filter((i) => {
      const s = getStatus(i);
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q);
      const matchCat = !catFilter || i.category === catFilter;
      const matchS = !statusFilter || s.key === statusFilter;
      return matchQ && matchCat && matchS;
    });
  }, [items, searchQ, catFilter, statusFilter]);

  // Borrowed qty per item
  function getBorrowedQty(itemId: string): number {
    return borrows.filter((b) => b.itemId === itemId && b.status !== "returned").reduce((s, b) => s + b.quantity, 0);
  }

  // Filtered borrow
  const filteredBorrows = useMemo(() => {
    const q = borrowSearch.toLowerCase();
    return borrows.filter((b) => {
      const item = items.find((i) => i.id === b.itemId);
      const matchQ = !q || b.borrower.toLowerCase().includes(q) || (item && item.name.toLowerCase().includes(q));
      const matchS = !borrowStatusFilter || b.status === borrowStatusFilter;
      return matchQ && matchS;
    });
  }, [borrows, borrowSearch, borrowStatusFilter, items]);

  // Filtered histories
  const filteredImport = useMemo(() => {
    const q = histSearch.toLowerCase();
    return importHist.filter((h) => !q || h.item?.name?.toLowerCase().includes(q) || h.item?.code?.toLowerCase().includes(q));
  }, [importHist, histSearch]);

  const filteredExport = useMemo(() => {
    const q = histSearch.toLowerCase();
    return exportHist.filter((h) => !q || h.item?.name?.toLowerCase().includes(q) || h.item?.code?.toLowerCase().includes(q) || h.borrowedBy?.toLowerCase().includes(q));
  }, [exportHist, histSearch]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`ยืนยันการลบ "${name}"?`)) return;
    try { await stockApi.deleteItem(id); fetchAll(); }
    catch { alert("ไม่สามารถลบได้ กรุณาตรวจสอบอีกครั้ง"); }
  }

  function handleReturnBorrow(bid: string) {
    const b = borrows.find((x) => x.id === bid);
    if (!b) return;
    const item = items.find((i) => i.id === b.itemId);
    if (!window.confirm(`ยืนยันการคืน "${item?.name ?? ""}"?`)) return;
    setBorrows((prev) => prev.map((x) => x.id === bid ? { ...x, status: "returned", returnDate: new Date().toISOString().split("T")[0] } : x));
  }

  // Scan
  function handleScan() {
    const code = scanCode.trim().toUpperCase();
    const item = items.find((i) => i.code.toUpperCase() === code);
    setScanResult(null); setScanNotFound(""); setScanAction(null); setScanQty(1); setScanWho("");
    if (!item) { setScanNotFound(code); return; }
    setScanResult(item);
  }

  async function confirmScanAction() {
    if (!scanResult || !scanAction) return;
    const labels: Record<string, string> = { import: "นำเข้า", export: "เบิก", borrow: "ยืม", maintain: "ส่งซ่อม", status: "อัพเดทสถานะ" };
    try {
      if (scanAction === "import") {
        await stockApi.import({ itemId: scanResult.id, quantity: scanQty, note: scanWho || undefined });
        await fetchAll();
      } else if (scanAction === "export") {
        await stockApi.export({ itemId: scanResult.id, quantity: scanQty, borrowedBy: scanWho || undefined });
        await fetchAll();
      } else if (scanAction === "borrow") {
        openBorrowModal(scanResult.id);
      } else if (scanAction === "status") {
        await stockApi.updateItemStatus(scanResult.id, scanNewStatus, scanStatusNote || undefined);
        await fetchAll();
        alert(`อัพเดทสถานะสำเร็จ!\nสินทรัพย์: ${scanResult.name}\nสถานะใหม่: ${ASSET_STATUS_CONFIG[scanNewStatus].label}`);
      } else {
        // maintain — 🔧 MOCKUP: แค่แจ้งเตือน ยังไม่มี API
        alert(`ส่งซ่อม "${scanResult.name}" จำนวน ${scanQty} ${scanResult.unit} — (mockup)`);
      }
      if (scanAction !== "borrow" && scanAction !== "status") {
        alert(`บันทึกสำเร็จ!\nการดำเนินการ: ${labels[scanAction]}\nสินทรัพย์: ${scanResult.name}\nจำนวน: ${scanQty} ${scanResult.unit}`);
      }
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setScanCode(""); setScanResult(null); setScanAction(null); setScanQty(1); setScanWho("");
    setScanNewStatus("active"); setScanStatusNote("");
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === "scan") setTimeout(() => barcodeInputRef.current?.focus(), 50);
  }

  function openBorrowModal(preItemId?: string) {
    setBorrowPreItem(preItemId);
    setShowBorrowModal(true);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "items", label: "สินทรัพย์" },
    { key: "borrow", label: "ยืม-คืน" },
    { key: "scan", label: "สแกนบาร์โค้ด" },
    { key: "import-hist", label: "ประวัตินำเข้า" },
    { key: "export-hist", label: "ประวัติเบิก" },
    { key: "export-report", label: "Export รายงาน" },
  ];

  return (
    <div style={{ padding: "1.5rem 0" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>ระบบสต็อกสินทรัพย์</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btnOutline} onClick={() => switchTab("export-report")}>📥 Export รายงาน</button>
          <button style={btnOutline} onClick={() => openBorrowModal()}>🔄 ยืม-คืน</button>
          <button style={btnPrimary} onClick={() => switchTab("scan")}>🔍 สแกน</button>
        </div>
      </div>

      {/* Alert Bar */}
      {alertItems.length > 0 && (
        <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: 8, padding: "10px 14px", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: "#854F0B", fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 13, color: "#633806", flex: 1 }}>
            แจ้งเตือน: สินทรัพย์ใกล้หมด/หมดสต็อก —{" "}
            <strong>{alertItems.map((i) => i.name).join(", ")}</strong>{" "}
            <button style={{ ...btnOutline, height: 26, padding: "0 10px", fontSize: 12, marginLeft: 8 }}
              onClick={() => { switchTab("items"); setStatusFilter("warn"); }}>ดูรายการ</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { label: "สินทรัพย์ทั้งหมด", value: stats.total, color: "var(--color-text-primary)" },
          { label: "ปกติ", value: stats.ok, color: "#3B6D11" },
          { label: "ใกล้หมด", value: stats.warn, color: "#854F0B" },
          { label: "หมดสต็อก", value: stats.low, color: "#A32D2D" },
          { label: "กำลังถูกยืม", value: stats.borrowing, color: "#0C447C" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: ".875rem 1rem" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #e2e8f0", marginBottom: "1.25rem", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            padding: "8px 14px", fontSize: 14, cursor: "pointer",
            color: activeTab === t.key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: "2px solid " + (activeTab === t.key ? "var(--color-text-primary)" : "transparent"),
            fontWeight: activeTab === t.key ? 500 : 400,
            background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid",
            borderBottomColor: activeTab === t.key ? "var(--color-text-primary)" : "transparent",
            marginBottom: -0.5, whiteSpace: "nowrap", transition: "color .15s",
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>กำลังโหลด...</div>}

      {/* ── Tab: Items ── */}
      {!loading && activeTab === "items" && (
        <div>
          <div style={panelStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
                <input type="text" placeholder="ค้นหาชื่อหรือรหัส..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 34, width: "100%" }} />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={selectStyle}>
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={selectStyle}>
                <option value="">ทุกสถานะ</option>
                <option value="ok">ปกติ</option>
                <option value="warn">ใกล้หมด</option>
                <option value="low">หมดสต็อก</option>
              </select>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={thStyle("90px")}>รหัส</th>
                  <th style={thStyle()}>ชื่อสินทรัพย์</th>
                  <th style={thStyle("110px")}>หมวดหมู่</th>
                  <th style={thStyle("80px", "right")}>คงเหลือ</th>
                  <th style={thStyle("60px", "right")}>ยืม</th>
                  <th style={thStyle("90px")}>สต็อก</th>
                  <th style={thStyle("110px")}>สภาพ</th>
                  <th style={thStyle("64px")}></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>ไม่พบรายการ</td></tr>
                ) : filteredItems.map((item) => {
                  const s = getStatus(item);
                  const qty = getQty(item);
                  const bq = getBorrowedQty(item.id);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12 }}>{item.code}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {item.name}
                        {item.description && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 400, marginTop: 1 }}>{item.description}</div>}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--color-text-secondary)", fontSize: 13 }}>{item.category || "—"}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{qty} <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{item.unit}</span></td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        {bq > 0 ? <Badge cls="b-blue" text={String(bq)} /> : <span style={{ color: "var(--color-text-tertiary)" }}>—</span>}
                      </td>
                      <td style={tdStyle}><Badge cls={s.cls} text={s.text} /></td>
                      <td style={tdStyle}><Badge cls={getAssetStatus(item).cls} text={getAssetStatus(item).label} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 2 }}>
                          <button title="แก้ไข" onClick={() => setEditItem(item)} style={{ ...iconBtn, color: "#000000" }}>✎</button>
                          <button title="ลบ" onClick={() => handleDelete(item.id, item.name)} style={{ ...iconBtn, color: "#000000" }}>🛇</button>
                        </div>
                      </td>
                    </tr> 
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button style={btnPrimary} onClick={() => setEditItem(null)}>+ เพิ่มสินทรัพย์</button>
          </div>
        </div>
      )}

      {/* ── Tab: Borrow ── */}
      {!loading && activeTab === "borrow" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
              <input type="text" placeholder="ค้นหาผู้ยืม / สินทรัพย์..." value={borrowSearch} onChange={(e) => setBorrowSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 34, width: "100%" }} />
            </div>
            <select value={borrowStatusFilter} onChange={(e) => setBorrowStatusFilter(e.target.value as BorrowStatusFilter)} style={selectStyle}>
              <option value="">ทุกสถานะ</option>
              <option value="borrowing">กำลังยืม</option>
              <option value="overdue">เกินกำหนด</option>
              <option value="returned">คืนแล้ว</option>
            </select>
            <button style={btnPrimary} onClick={() => openBorrowModal()}>+ บันทึกการยืม</button>
          </div>
          <div style={panelStyle}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={thStyle("100px")}>รหัสการยืม</th>
                  <th style={thStyle()}>สินทรัพย์</th>
                  <th style={thStyle("120px")}>ผู้ยืม</th>
                  <th style={thStyle("70px", "right")}>จำนวน</th>
                  <th style={thStyle("90px")}>วันยืม</th>
                  <th style={thStyle("90px")}>กำหนดคืน</th>
                  <th style={thStyle("100px")}>สถานะ</th>
                  <th style={thStyle("70px")}></th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrows.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>ไม่มีรายการ</td></tr>
                ) : filteredBorrows.map((b) => {
                  const item = items.find((i) => i.id === b.itemId);
                  const over = b.status === "overdue" || (b.status === "borrowing" && isOverdue(b.dueDate));
                  const statusBadge: Record<BorrowRecord["status"], JSX.Element> = {
                    borrowing: <Badge cls="b-blue" text="กำลังยืม" />,
                    overdue: <Badge cls="b-low" text="เกินกำหนด" />,
                    returned: <Badge cls="b-ok" text="คืนแล้ว" />,
                  };
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0", background: over ? "#FCEBEB" : undefined }}
                      onMouseEnter={(e) => !over && (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = over ? "#FCEBEB" : "")}>
                      <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12 }}>{b.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{item?.name ?? "—"}</td>
                      <td style={tdStyle}>{b.borrower}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{b.quantity} {item?.unit ?? ""}</td>
                      <td style={{ ...tdStyle, fontSize: 13 }}>{fmtDate(b.borrowDate)}</td>
                      <td style={{ ...tdStyle, fontSize: 13, ...(over ? { color: "#A32D2D", fontWeight: 500 } : {}) }}>{fmtDate(b.dueDate)}</td>
                      <td style={tdStyle}>{statusBadge[b.status]}</td>
                      <td style={tdStyle}>
                        {b.status !== "returned" && (
                          <button style={{ ...btnOutline, height: 26, padding: "0 10px", fontSize: 12 }} onClick={() => handleReturnBorrow(b.id)}>คืน</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Scan ── */}
      {!loading && activeTab === "scan" && (
        <div style={panelStyle}>
          <div style={{ padding: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>สแกนบาร์โค้ดสินทรัพย์</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>รองรับเครื่องสแกน USB / Bluetooth</p>
            <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "1.5rem 1rem", margin: "1rem 0", cursor: "pointer" }}
              onClick={() => barcodeInputRef.current?.focus()}>
              <div style={{ fontSize: 36, color: "var(--color-text-secondary)" }}></div>
              <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 6 }}>คลิกเพื่อสแกนหรือพิมพ์รหัส</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={barcodeInputRef} type="text" value={scanCode} onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="เช่น IT-001, FN-001"
                style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-mono)", letterSpacing: 1 }} />
              <button style={btnPrimary} onClick={handleScan}>ค้นหา</button>
            </div>
            {scanNotFound && (
              <div style={{ marginTop: "1rem", padding: "10px 14px", borderRadius: 6, background: "#FCEBEB", color: "#A32D2D", fontSize: 13, textAlign: "left" }}>
                ไม่พบรหัส "{scanNotFound}"
              </div>
            )}
            {scanResult && (
              <div style={{ marginTop: "1rem", textAlign: "left", background: "#f8fafc", borderRadius: 10, padding: "1rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {catIcon(scanResult.category)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>{scanResult.name}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{scanResult.code} · {scanResult.category}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13, marginBottom: 12 }}>
                  <div><span style={{ color: "var(--color-text-secondary)" }}>คงเหลือ: </span><span style={{ fontWeight: 500 }}>{getQty(scanResult)} {scanResult.unit}</span></div>
                  <div><span style={{ color: "var(--color-text-secondary)" }}>สต็อก: </span><Badge cls={getStatus(scanResult).cls} text={getStatus(scanResult).text} /></div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>สภาพสินทรัพย์: </span>
                    <Badge cls={getAssetStatus(scanResult).cls} text={`${getAssetStatus(scanResult).icon} ${getAssetStatus(scanResult).label}`} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: scanAction ? 12 : 0 }}>
                  {(["import", "export", "borrow", "status"] as const).map((a) => {
                    const labels = { import: "นำเข้า", export: "เบิก", borrow: "ยืม", status: "อัพเดทสถานะ" };
                    return (
                      <button key={a} style={scanAction === a ? btnPrimary : btnOutline} onClick={() => setScanAction(a)}>
                        {labels[a]}
                      </button>
                    );
                  })}
                </div>
                {scanAction && scanAction !== "status" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
                    <input type="number" min={1} value={scanQty} onChange={(e) => setScanQty(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 72 }} />
                    <input type="text" value={scanWho} onChange={(e) => setScanWho(e.target.value)}
                      placeholder={scanAction === "borrow" ? "ชื่อผู้ยืม" : "ชื่อผู้รับ/หมายเหตุ"}
                      style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
                    <button style={btnPrimary} onClick={confirmScanAction}>✓ ยืนยัน</button>
                  </div>
                )}
                {scanAction === "status" && (
                  <div style={{ marginTop: 12, background: "#f1f5f9", borderRadius: 8, padding: "1rem", border: "1px solid #e2e8f0" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>เลือกสถานะสินทรัพย์ใหม่</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {(Object.entries(ASSET_STATUS_CONFIG) as [AssetStatus, typeof ASSET_STATUS_CONFIG[AssetStatus]][]).map(([key, cfg]) => (
                        <button key={key} onClick={() => setScanNewStatus(key)}
                          style={{
                            padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                            border: scanNewStatus === key ? "2px solid var(--color-text-primary)" : "1.5px solid #e2e8f0",
                            background: scanNewStatus === key ? "#f8fafc" : "#fff",
                            transition: "all .15s",
                          }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{cfg.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{cfg.label}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{cfg.desc}</div>
                        </button>
                      ))}
                    </div>
                    <div style={formRow}>
                      <label style={formLabel}>หมายเหตุ (ไม่บังคับ)</label>
                      <input type="text" value={scanStatusNote} onChange={(e) => setScanStatusNote(e.target.value)}
                        placeholder="เช่น ส่งซ่อมศูนย์บริการ, ชำรุดจากน้ำท่วม..."
                        style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button style={btnOutline} onClick={() => setScanAction(null)}>ยกเลิก</button>
                      <button style={btnPrimary} onClick={confirmScanAction}>✓ บันทึกสถานะ</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Import History ── */}
      {!loading && activeTab === "import-hist" && (
        <div style={panelStyle}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
            <input type="text" placeholder="ค้นหา..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 300 }} />
          </div>
          <div style={{ padding: "1rem 1.25rem" }}>
            {filteredImport.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>ไม่มีประวัติ</div>
            ) : filteredImport.map((h) => (
              <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EAF3DE", color: "#3B6D11", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>↓</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{h.item?.name ?? "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {h.item?.code}{h.importedBy ? " · โดย " + h.importedBy : ""} · {fmtDate(h.importedAt)}{h.note ? " · " + h.note : ""}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#3B6D11", whiteSpace: "nowrap" }}>+{h.quantity} {h.item?.unit ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Export History ── */}
      {!loading && activeTab === "export-hist" && (
        <div style={panelStyle}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
            <input type="text" placeholder="ค้นหา..." value={histSearch} onChange={(e) => setHistSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 300 }} />
          </div>
          <div style={{ padding: "1rem 1.25rem" }}>
            {filteredExport.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>ไม่มีประวัติ</div>
            ) : filteredExport.map((h) => (
              <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FAEEDA", color: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>↑</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{h.item?.name ?? "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {h.item?.code}{h.borrowedBy ? " · โดย " + h.borrowedBy : ""} · {fmtDate(h.exportedAt)}{h.note ? " · " + h.note : ""}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#A32D2D", whiteSpace: "nowrap" }}>-{h.quantity} {h.item?.unit ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Export Report ── */}
      {!loading && activeTab === "export-report" && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>เลือกรูปแบบรายงาน</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: "1.25rem" }}>
            {[
              { type: "stock-summary", name: "สรุปสต็อกทั้งหมด", desc: "รายการสินทรัพย์พร้อมจำนวนคงเหลือ · Excel" },
              { type: "low-stock", name: "รายการสต็อกต่ำ", desc: "สินทรัพย์ที่ต้องสั่งซื้อเพิ่ม · Excel" },
              { type: "import-hist", name: "ประวัติการนำเข้า", desc: "รายการรับสินทรัพย์เข้าสต็อก · PDF" },
              { type: "export-hist", name: "ประวัติการเบิก", desc: "รายการเบิก-จ่ายสินทรัพย์ · PDF" },
              { type: "borrow-report",  name: "รายงานการยืม", desc: "รายการยืม-คืนพร้อมสถานะ · PDF" },
              { type: "full-report", name: "รายงานรวมทั้งหมด", desc: "สรุปภาพรวมทุกส่วน · PDF" },
            ].map((r) => (
              <div key={r.type} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem", cursor: "pointer", transition: "background .1s" }}
                onClick={() => alert(`Export "${r.name}" สำเร็จ!\n\n(mockup — เมื่อเชื่อมต่อ API จริง ระบบจะดาวน์โหลดไฟล์อัตโนมัติ)`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                <div style={{ fontSize: 28, color: "var(--color-text-secondary)", marginBottom: 8 }}></div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 6, padding: "1rem", fontSize: 13, color: "var(--color-text-secondary)" }}>
            ℹ️ เมื่อเชื่อมต่อ Database จริง ระบบจะดาวน์โหลดไฟล์อัตโนมัติ ตอนนี้เป็น mockup
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showImportModal && <ImportModal items={items} onClose={() => setShowImportModal(false)} onSuccess={fetchAll} />}
      {showExportModal && <ExportModal items={items} onClose={() => setShowExportModal(false)} onSuccess={fetchAll} />}
      {showBorrowModal && (
        <BorrowModal items={items} preItemId={borrowPreItem}
          onClose={() => { setShowBorrowModal(false); setBorrowPreItem(undefined); }}
          onSuccess={(record) => {
            setBorrows((prev) => [record, ...prev]); /* 🔧 MOCKUP: ลบบรรทัดนี้ออกตอนใช้ API จริง */
            fetchAll(); /* รีเฟรช items (สต็อกคงเหลือ) */
            switchTab("borrow");
          }} />
      )}
      {editItem !== undefined && (
        <ItemModal item={editItem} onClose={() => setEditItem(undefined)} onSuccess={fetchAll} />
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "0 14px", height: 34,
  background: "var(--color-text-primary)", color: "var(--color-background-primary)",
  border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer",
};
const btnOutline: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "0 12px", height: 34,
  background: "#ffffff", color: "var(--color-text-primary)",
  border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  height: 36, padding: "0 10px",
  borderRadius: 6, border: "1px solid #e2e8f0",
  background: "#ffffff", color: "var(--color-text-primary)",
  fontSize: 14, width: "100%", boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = {
  height: 36, padding: "0 8px",
  borderRadius: 6, border: "1px solid #e2e8f0",
  background: "#ffffff", color: "var(--color-text-primary)",
  fontSize: 14, cursor: "pointer",
};
const panelStyle: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #e2e8f0",
  borderRadius: 10, overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const thStyle = (width?: string, align?: string): React.CSSProperties => ({
  textAlign: (align as any) ?? "left", padding: "10px 12px",
  fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
  borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
  width: width ?? "auto",
});
const tdStyle: React.CSSProperties = {
  padding: "9px 10px", color: "var(--color-text-primary)",
  verticalAlign: "middle", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--color-text-secondary)", padding: 4,
  borderRadius: 6, fontSize: 14, display: "inline-flex", alignItems: "center",
};
const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: "1.5rem",
};
const modalBox: React.CSSProperties = {
  background: "#ffffff", borderRadius: 10, border: "1.5px solid #e2e8f0",
  padding: "1.5rem", width: "100%", maxWidth: 440,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};
const modalTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 500, marginBottom: "1rem",
  color: "var(--color-text-primary)",
};
const formRow: React.CSSProperties = { marginBottom: 12 };
const formLabel: React.CSSProperties = {
  fontSize: 13, color: "var(--color-text-secondary)",
  marginBottom: 4, display: "block",
};
const modalActions: React.CSSProperties = {
  display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem",
};