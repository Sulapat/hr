import api from "./axios";

export const stockApi = {
  // ── Items ──────────────────────────────────────────────────
  getItems: () =>
    api.get("/api/items").then((r) => r.data.data ?? r.data),

  createItem: (data: FormData) =>
    api.post("/api/items", data).then((r) => r.data.data ?? r.data),

  updateItem: (id: string, data: any) =>
    api.patch(`/api/items/${id}`, data).then((r) => r.data.data ?? r.data),

  deleteItem: (id: string) =>
    api.delete(`/api/items/${id}`).then((r) => r.data),

  updateItemStatus: (id: string, assetStatus: string, note?: string) =>
    api.patch(`/api/items/${id}/status`, { assetStatus, note }).then((r) => r.data.data ?? r.data),

  // ── Stock import / export ──────────────────────────────────
  import: (data: { itemId: string; quantity: number; note?: string }) =>
    api.post("/api/stock/import", data).then((r) => r.data),

  export: (data: { itemId: string; quantity: number; borrowedBy?: string; note?: string }) =>
    api.post("/api/stock/export", data).then((r) => r.data),

  getImportHistory: () =>
    api.get("/api/stock/import-history").then((r) => r.data.data ?? r.data),

  getExportHistory: () =>
    api.get("/api/stock/export-history").then((r) => r.data.data ?? r.data),

  // ── Borrows ────────────────────────────────────────────────
  getBorrows: () =>
    api.get("/api/borrows").then((r) => r.data.data ?? r.data),

  createBorrow: (data: {
    itemId: string;
    quantity: number;
    borrower: string;
    dueDate: string;
    note?: string;
  }) => api.post("/api/borrows", data).then((r) => r.data),

  returnBorrow: (id: string) =>
    api.patch(`/api/borrows/${id}/return`).then((r) => r.data),
};