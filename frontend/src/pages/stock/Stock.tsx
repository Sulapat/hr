import { useEffect, useState, useMemo } from "react";
import { stockApi } from "../../api/stockApi";

// ─── Types ────────────────────────────────────────────────
interface StockRecord {
  id: string;
  itemId: string;
  quantity: number;
  updatedAt: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit?: string;
  minStock: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  stocks: StockRecord[];
}

interface ImportHistory {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
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

type Tab = "items" | "import-hist" | "export-hist";
type StatusFilter = "" | "ok" | "warn" | "low";

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

// ─── Badge Component ──────────────────────────────────────
function Badge({ cls, text }: { cls: string; text: string }) {
  const styles: Record<string, React.CSSProperties> = {
    "b-ok": { background: "#EAF3DE", color: "#3B6D11" },
    "b-warn": { background: "#FAEEDA", color: "#854F0B" },
    "b-low": { background: "#FCEBEB", color: "#A32D2D" },
    "b-blue": { background: "#E6F1FB", color: "#0C447C" },
    "b-gray": { background: "#F1EFE8", color: "#5F5E5A" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        ...styles[cls],
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      {text}
    </span>
  );
}

// ─── Modal: Import ────────────────────────────────────────
function ImportModal({
  items,
  onClose,
  onSuccess,
}: {
  items: Item[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!itemId || quantity < 1) { setError("กรุณาเลือกสินทรัพย์และระบุจำนวน"); return; }
    setLoading(true);
    setError("");
    try {
      await stockApi.import({ itemId, quantity, note });
      onSuccess();
      onClose();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>
          <span style={{ marginRight: 8 }}>📦</span>นำเข้าสต็อก
        </p>
        <div style={formRow}>
          <label style={formLabel}>สินทรัพย์</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} style={inputStyle}>
            <option value="">-- เลือกสินทรัพย์ --</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.code}) · เหลือ {getQty(i)} {i.unit}
              </option>
            ))}
          </select>
        </div>
        <div style={formRow}>
          <label style={formLabel}>จำนวน</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            style={inputStyle}
          />
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมายเหตุ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="แหล่งที่มา / วัตถุประสงค์..."
            style={{ ...inputStyle, height: 64, resize: "vertical" }}
          />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "✓ บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Export ────────────────────────────────────────
function ExportModal({
  items,
  onClose,
  onSuccess,
}: {
  items: Item[];
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    setLoading(true);
    setError("");
    try {
      await stockApi.export({ itemId, quantity, borrowedBy, note });
      onSuccess();
      onClose();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>
          <span style={{ marginRight: 8 }}>📤</span>เบิกสต็อก
        </p>
        <div style={formRow}>
          <label style={formLabel}>สินทรัพย์</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            style={inputStyle}
          >
            <option value="">-- เลือกสินทรัพย์ --</option>
            {items.filter((i) => getQty(i) > 0).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.code}) · เหลือ {getQty(i)} {i.unit}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={formRow}>
            <label style={formLabel}>จำนวน</label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
          </div>
          <div style={formRow}>
            <label style={formLabel}>ผู้รับ / เบิกโดย</label>
            <input
              type="text"
              value={borrowedBy}
              onChange={(e) => setBorrowedBy(e.target.value)}
              placeholder="ชื่อพนักงาน"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={formRow}>
          <label style={formLabel}>หมายเหตุ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="วัตถุประสงค์การเบิก..."
            style={{ ...inputStyle, height: 64, resize: "vertical" }}
          />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "✓ บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Add/Edit Item ─────────────────────────────────
function ItemModal({
  item,
  onClose,
  onSuccess,
}: {
  item?: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!item;
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [minStock, setMinStock] = useState(item?.minStock ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!code || !name) { setError("กรุณากรอกรหัสและชื่อสินทรัพย์"); return; }
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await stockApi.updateItem(item!.id, { name, description, unit, minStock });
      } else {
        const fd = new FormData();
        fd.append("code", code);
        fd.append("name", name);
        if (description) fd.append("description", description);
        if (unit) fd.append("unit", unit);
        fd.append("minStock", String(minStock));
        await stockApi.createItem(fd);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <p style={modalTitle}>{isEdit ? "✏️ แก้ไขสินทรัพย์" : "➕ เพิ่มสินทรัพย์ใหม่"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={formRow}>
            <label style={formLabel}>รหัสสินทรัพย์ *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="เช่น IT-001"
              disabled={isEdit}
              style={{ ...inputStyle, ...(isEdit ? { opacity: 0.6 } : {}) }}
            />
          </div>
          <div style={formRow}>
            <label style={formLabel}>หน่วย</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="เช่น ชิ้น, เครื่อง"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={formRow}>
          <label style={formLabel}>ชื่อสินทรัพย์ *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อสินทรัพย์"
            style={inputStyle}
          />
        </div>
        <div style={formRow}>
          <label style={formLabel}>รายละเอียด</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม..."
            style={{ ...inputStyle, height: 60, resize: "vertical" }}
          />
        </div>
        <div style={formRow}>
          <label style={formLabel}>สต็อกขั้นต่ำ (แจ้งเตือน)</label>
          <input
            type="number"
            min={0}
            value={minStock}
            onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, maxWidth: 120 }}
          />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={modalActions}>
          <button onClick={onClose} style={btnOutline} disabled={loading}>ยกเลิก</button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "✓ บันทึก"}
          </button>
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
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null | undefined>(undefined); // undefined = closed

  const [histSearch, setHistSearch] = useState("");

  async function fetchAll() {
    setLoading(true);
    try {
      const [i, ih, eh] = await Promise.all([
        stockApi.getItems(),
        stockApi.getImportHistory(),
        stockApi.getExportHistory(),
      ]);
      setItems(i);
      setImportHist(ih);
      setExportHist(eh);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
    return { total: items.length, ok, warn, low };
  }, [items]);

  const alertItems = useMemo(() => items.filter((i) => getStatus(i).key !== "ok"), [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQ.toLowerCase();
    return items.filter((i) => {
      const s = getStatus(i);
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q);
      const matchS = !statusFilter || s.key === statusFilter;
      return matchQ && matchS;
    });
  }, [items, searchQ, statusFilter]);

  // Filtered histories
  const filteredImport = useMemo(() => {
    const q = histSearch.toLowerCase();
    return importHist.filter(
      (h) => !q || h.item?.name?.toLowerCase().includes(q) || h.item?.code?.toLowerCase().includes(q)
    );
  }, [importHist, histSearch]);

  const filteredExport = useMemo(() => {
    const q = histSearch.toLowerCase();
    return exportHist.filter(
      (h) => !q || h.item?.name?.toLowerCase().includes(q) || h.item?.code?.toLowerCase().includes(q) || h.borrowedBy?.toLowerCase().includes(q)
    );
  }, [exportHist, histSearch]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`ยืนยันการลบ "${name}"?`)) return;
    try {
      await stockApi.deleteItem(id);
      fetchAll();
    } catch {
      alert("ไม่สามารถลบได้ กรุณาตรวจสอบอีกครั้ง");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "items", label: "สินทรัพย์" },
    { key: "import-hist", label: "ประวัตินำเข้า" },
    { key: "export-hist", label: "ประวัติเบิก" },
  ];

  return (
    <div style={{ padding: "1.5rem 0" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
          ระบบสต็อกสินทรัพย์
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btnOutline} onClick={() => setShowExportModal(true)}>
            📤 เบิกสต็อก
          </button>
          <button style={btnOutline} onClick={() => setShowImportModal(true)}>
            📦 นำเข้าสต็อก
          </button>
          <button style={btnPrimary} onClick={() => setEditItem(null)}>
            + เพิ่มสินทรัพย์
          </button>
        </div>
      </div>

      {/* Alert Bar */}
      {alertItems.length > 0 && (
        <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: 8, padding: "10px 14px", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: "#854F0B", fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 13, color: "#633806", flex: 1 }}>
            แจ้งเตือน: สินทรัพย์ใกล้หมด/หมดสต็อก —{" "}
            <strong>{alertItems.map((i) => i.name).join(", ")}</strong>{" "}
            <button
              style={{ ...btnOutline, height: 26, padding: "0 10px", fontSize: 12, marginLeft: 8 }}
              onClick={() => { setActiveTab("items"); setStatusFilter("warn"); }}
            >
              ดูรายการ
            </button>
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
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              cursor: "pointer",
              color: activeTab === t.key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: activeTab === t.key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
              fontWeight: activeTab === t.key ? 500 : 400,
              background: "none",
              border: "none",
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === t.key ? "var(--color-text-primary)" : "transparent",
              marginBottom: -0.5,
              whiteSpace: "nowrap",
              transition: "color .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>
          กำลังโหลด...
        </div>
      )}

      {/* Tab: Items */}
      {!loading && activeTab === "items" && (
        <div>
          <div style={panelStyle}>
            {/* Toolbar inside panel */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือรหัส..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 34, width: "100%" }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                style={selectStyle}
              >
                <option value="">ทุกสถานะ</option>
                <option value="ok">ปกติ</option>
                <option value="warn">ใกล้หมด</option>
                <option value="low">หมดสต็อก</option>
              </select>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={thStyle("80px")}>รหัส</th>
                  <th style={thStyle()}>ชื่อสินทรัพย์</th>
                  <th style={thStyle("80px")}>หน่วย</th>
                  <th style={thStyle("80px", "right")}>คงเหลือ</th>
                  <th style={thStyle("60px", "right")}>ขั้นต่ำ</th>
                  <th style={thStyle("100px")}>สถานะ</th>
                  <th style={thStyle("90px")}></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>
                      ไม่พบรายการ
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const s = getStatus(item);
                    const qty = getQty(item);
                    return (
                      <tr
                        key={item.id}
                        style={{ borderBottom: "1px solid #e2e8f0" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12 }}>{item.code}</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {item.name}
                          {item.description && (
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 400, marginTop: 1 }}>
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: "var(--color-text-secondary)", fontSize: 13 }}>{item.unit || "—"}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{qty}</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: "var(--color-text-secondary)", fontSize: 13 }}>{item.minStock}</td>
                        <td style={tdStyle}>
                          <Badge cls={s.cls} text={s.text} />
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 2 }}>
                            <button
                              title="นำเข้า"
                              onClick={() => { setShowImportModal(true); }}
                              style={iconBtn}
                            >📦</button>
                            <button
                              title="เบิก"
                              onClick={() => { setShowExportModal(true); }}
                              style={iconBtn}
                            >📤</button>
                            <button
                              title="แก้ไข"
                              onClick={() => setEditItem(item)}
                              style={iconBtn}
                            >✏️</button>
                            <button
                              title="ลบ"
                              onClick={() => handleDelete(item.id, item.name)}
                              style={{ ...iconBtn, color: "#A32D2D" }}
                            >🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Import History */}
      {!loading && activeTab === "import-hist" && (
        <div>
          <div style={panelStyle}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
              <input
                type="text"
                placeholder="ค้นหา..."
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                style={{ ...inputStyle, maxWidth: 300 }}
              />
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              {filteredImport.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>
                  ไม่มีประวัติ
                </div>
              ) : (
                filteredImport.map((h) => (
                  <div
                    key={h.id}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EAF3DE", color: "#3B6D11", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>
                      ↓
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {h.item?.name ?? "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {h.item?.code} · {fmtDate(h.importedAt)}{h.note ? " · " + h.note : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#3B6D11", whiteSpace: "nowrap" }}>
                      +{h.quantity} {h.item?.unit ?? ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Export History */}
      {!loading && activeTab === "export-hist" && (
        <div>
          <div style={panelStyle}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>
              <input
                type="text"
                placeholder="ค้นหา..."
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                style={{ ...inputStyle, maxWidth: 300 }}
              />
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              {filteredExport.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>
                  ไม่มีประวัติ
                </div>
              ) : (
                filteredExport.map((h) => (
                  <div
                    key={h.id}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FAEEDA", color: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>
                      ↑
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {h.item?.name ?? "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {h.item?.code}
                        {h.borrowedBy ? " · โดย " + h.borrowedBy : ""}
                        {" · "}{fmtDate(h.exportedAt)}
                        {h.note ? " · " + h.note : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#A32D2D", whiteSpace: "nowrap" }}>
                      -{h.quantity} {h.item?.unit ?? ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showImportModal && (
        <ImportModal items={items} onClose={() => setShowImportModal(false)} onSuccess={fetchAll} />
      )}
      {showExportModal && (
        <ExportModal items={items} onClose={() => setShowExportModal(false)} onSuccess={fetchAll} />
      )}
      {editItem !== undefined && (
        <ItemModal
          item={editItem}
          onClose={() => setEditItem(undefined)}
          onSuccess={fetchAll}
        />
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
  border: "1px solid #e2e8f0",
  borderRadius: 6, fontSize: 14, cursor: "pointer",
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
  background: "#ffffff",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10, overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const thStyle = (width?: string, align?: string): React.CSSProperties => ({
  textAlign: (align as any) ?? "left", padding: "10px 12px",
  fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
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
  background: "#ffffff",
  borderRadius: 10, border: "1.5px solid #e2e8f0",
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