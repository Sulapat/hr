import api from "./axios";

// ═══════════════════════════════════════════════════════════════
// 🔧 MOCKUP SECTION — ลบบล็อกนี้ทั้งหมดออกตอนเชื่อม phpMyAdmin จริง
// ═══════════════════════════════════════════════════════════════
const USE_MOCK = true; // ← เปลี่ยนเป็น false เพื่อใช้ API จริง

let _mockItems: any[] = [
  { id: "1",  code: "IT-001", name: "โน้ตบุ๊ก Dell XPS 15",       category: "อุปกรณ์ IT",          unit: "เครื่อง", minStock: 3,  assetStatus: "active",      stocks: [{ id: "s1",  itemId: "1",  quantity: 8,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "2",  code: "IT-002", name: 'จอมอนิเตอร์ LG 27"',          category: "อุปกรณ์ IT",          unit: "จอ",     minStock: 2,  assetStatus: "active",      stocks: [{ id: "s2",  itemId: "2",  quantity: 5,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "3",  code: "IT-003", name: "เมาส์ Logitech MX",           category: "อุปกรณ์ IT",          unit: "ตัว",    minStock: 5,  assetStatus: "active",      stocks: [{ id: "s3",  itemId: "3",  quantity: 2,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "4",  code: "IT-004", name: "คีย์บอร์ด Keychron K2",       category: "อุปกรณ์ IT",          unit: "ตัว",    minStock: 3,  assetStatus: "maintenance", stocks: [{ id: "s4",  itemId: "4",  quantity: 0,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "5",  code: "FN-001", name: "เก้าอี้สำนักงาน Ergotrend",   category: "เฟอร์นิเจอร์",        unit: "ตัว",    minStock: 2,  assetStatus: "active",      stocks: [{ id: "s5",  itemId: "5",  quantity: 12, updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "6",  code: "FN-002", name: "โต๊ะ Standing Desk",          category: "เฟอร์นิเจอร์",        unit: "ตัว",    minStock: 2,  assetStatus: "active",      stocks: [{ id: "s6",  itemId: "6",  quantity: 4,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "7",  code: "OF-001", name: "กระดาษ A4 Double A",          category: "เครื่องใช้สำนักงาน", unit: "รีม",    minStock: 5,  assetStatus: "active",      stocks: [{ id: "s7",  itemId: "7",  quantity: 20, updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "8",  code: "OF-002", name: "หมึกปริ้นเตอร์ Canon",        category: "เครื่องใช้สำนักงาน", unit: "ชุด",    minStock: 4,  assetStatus: "active",      stocks: [{ id: "s8",  itemId: "8",  quantity: 3,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "9",  code: "OF-003", name: "แฟ้มเอกสาร",                  category: "เครื่องใช้สำนักงาน", unit: "อัน",    minStock: 10, assetStatus: "active",      stocks: [{ id: "s9",  itemId: "9",  quantity: 15, updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "10", code: "IT-005", name: "สาย HDMI",                    category: "อุปกรณ์ IT",          unit: "เส้น",   minStock: 3,  assetStatus: "damaged",     stocks: [{ id: "s10", itemId: "10", quantity: 7,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "11", code: "VH-001", name: "รถยนต์ Toyota Camry",         category: "ยานพาหนะ",            unit: "คัน",    minStock: 1,  assetStatus: "active",      stocks: [{ id: "s11", itemId: "11", quantity: 1,  updatedAt: "" }], createdAt: "", updatedAt: "" },
  { id: "12", code: "OF-004", name: "เครื่องถ่ายเอกสาร Sharp",    category: "เครื่องใช้สำนักงาน", unit: "เครื่อง",minStock: 1,  assetStatus: "retired",     stocks: [{ id: "s12", itemId: "12", quantity: 1,  updatedAt: "" }], createdAt: "", updatedAt: "" },
];

let _mockImportHist: any[] = [
  { id: "ih1", itemId: "1",  item: _mockItems[0],  quantity: 5, importedBy: "สมชาย ใจดี",    note: "สั่งซื้อประจำไตรมาส", importedAt: "2025-06-02T09:00:00Z" },
  { id: "ih2", itemId: "7",  item: _mockItems[6],  quantity: 10, importedBy: "สุดา พงษ์ดี",  note: "",                    importedAt: "2025-06-01T10:00:00Z" },
  { id: "ih3", itemId: "3",  item: _mockItems[2],  quantity: 3, importedBy: "วิชัย มงคล",    note: "ทดแทนของเก่า",        importedAt: "2025-05-30T11:00:00Z" },
  { id: "ih4", itemId: "8",  item: _mockItems[7],  quantity: 2, importedBy: "สมชาย ใจดี",    note: "",                    importedAt: "2025-05-28T13:00:00Z" },
];

let _mockExportHist: any[] = [
  { id: "eh1", itemId: "1",  item: _mockItems[0],  quantity: 1, borrowedBy: "พิมพ์ใจ สวัสดี", note: "WFH",      exportedAt: "2025-06-02T08:00:00Z" },
  { id: "eh2", itemId: "2",  item: _mockItems[1],  quantity: 1, borrowedBy: "ธนา รักดี",       note: "",         exportedAt: "2025-06-01T09:00:00Z" },
  { id: "eh3", itemId: "9",  item: _mockItems[8],  quantity: 5, borrowedBy: "นภา ศรีสวัสดิ์",  note: "",         exportedAt: "2025-05-31T14:00:00Z" },
  { id: "eh4", itemId: "7",  item: _mockItems[6],  quantity: 3, borrowedBy: "อรุณ ภูมิดี",     note: "ฝ่ายบัญชี",exportedAt: "2025-05-27T10:00:00Z" },
];

let _mockIdCounter = 100;
function _mockDelay<T>(data: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(data), 150));
}
// ═══════════════════════════════════════════════════════════════
// 🔧 END MOCKUP SECTION
// ═══════════════════════════════════════════════════════════════

export const stockApi = {
  // ── Items ──────────────────────────────────────────────────
  getItems: () =>
    USE_MOCK
      ? _mockDelay([..._mockItems]) // 🔧 MOCK
      : api.get("/api/items").then((r) => r.data),

  createItem: (data: FormData) => {
    if (USE_MOCK) { // 🔧 MOCK
      const newId = String(++_mockIdCounter);
      const newItem = {
        id: newId,
        code: data.get("code") as string,
        name: data.get("name") as string,
        description: (data.get("description") as string) || undefined,
        unit: (data.get("unit") as string) || undefined,
        category: (data.get("category") as string) || undefined,
        minStock: parseInt(data.get("minStock") as string) || 0,
        stocks: [{ id: "s" + newId, itemId: newId, quantity: 0, updatedAt: "" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      _mockItems.push(newItem);
      return _mockDelay(newItem);
    }
    return api.post("/api/items", data).then((r) => r.data);
  },

  updateItem: (id: string, data: any) => {
    if (USE_MOCK) { // 🔧 MOCK
      _mockItems = _mockItems.map((i) => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i);
      return _mockDelay(_mockItems.find((i) => i.id === id));
    }
    return api.patch(`/api/items/${id}`, data).then((r) => r.data);
  },

  deleteItem: (id: string) => {
    if (USE_MOCK) { // 🔧 MOCK
      _mockItems = _mockItems.filter((i) => i.id !== id);
      return _mockDelay({ success: true });
    }
    return api.delete(`/api/items/${id}`).then((r) => r.data);
  },

  updateItemStatus: (id: string, assetStatus: string, note?: string) => {
    if (USE_MOCK) { // 🔧 MOCK
      _mockItems = _mockItems.map((i) =>
        i.id === id ? { ...i, assetStatus, updatedAt: new Date().toISOString() } : i
      );
      return _mockDelay(_mockItems.find((i) => i.id === id));
    }
    return api.patch(`/api/items/${id}/status`, { assetStatus, note }).then((r) => r.data);
  },

  // ── Stock import / export ──────────────────────────────────
  import: (data: { itemId: string; quantity: number; note?: string }) => {
    if (USE_MOCK) { // 🔧 MOCK
      const item = _mockItems.find((i) => i.id === data.itemId);
      if (item) {
        item.stocks[0].quantity += data.quantity;
        item.updatedAt = new Date().toISOString();
        const histEntry = {
          id: "ih" + (++_mockIdCounter),
          itemId: data.itemId,
          item: { ...item },
          quantity: data.quantity,
          note: data.note,
          importedAt: new Date().toISOString(),
        };
        _mockImportHist.unshift(histEntry);
      }
      return _mockDelay({ success: true });
    }
    return api.post("/api/stock/import", data).then((r) => r.data);
  },

  export: (data: { itemId: string; quantity: number; borrowedBy?: string; note?: string }) => {
    if (USE_MOCK) { // 🔧 MOCK
      const item = _mockItems.find((i) => i.id === data.itemId);
      if (item) {
        item.stocks[0].quantity -= data.quantity;
        item.updatedAt = new Date().toISOString();
        const histEntry = {
          id: "eh" + (++_mockIdCounter),
          itemId: data.itemId,
          item: { ...item },
          quantity: data.quantity,
          borrowedBy: data.borrowedBy,
          note: data.note,
          exportedAt: new Date().toISOString(),
        };
        _mockExportHist.unshift(histEntry);
      }
      return _mockDelay({ success: true });
    }
    return api.post("/api/stock/export", data).then((r) => r.data);
  },

  getImportHistory: () =>
    USE_MOCK
      ? _mockDelay([..._mockImportHist]) // 🔧 MOCK
      : api.get("/api/stock/import-history").then((r) => r.data),

  getExportHistory: () =>
    USE_MOCK
      ? _mockDelay([..._mockExportHist]) // 🔧 MOCK
      : api.get("/api/stock/export-history").then((r) => r.data),

  // ── Borrows (ready for when backend is available) ──────────
  getBorrows: () => api.get("/api/borrows").then((r) => r.data),
  createBorrow: (data: {
    itemId: string;
    quantity: number;
    borrower: string;
    dueDate: string;
    note?: string;
  }) => api.post("/api/borrows", data).then((r) => r.data),
  returnBorrow: (id: string) => api.patch(`/api/borrows/${id}/return`).then((r) => r.data),
};