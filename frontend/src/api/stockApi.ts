import api from "./axios";

export const stockApi = {
  getItems: () => api.get("/api/items").then((r) => r.data),
  createItem: (data: FormData) => api.post("/api/items", data).then((r) => r.data),
  updateItem: (id: string, data: any) => api.patch(`/api/items/${id}`, data).then((r) => r.data),
  deleteItem: (id: string) => api.delete(`/api/items/${id}`).then((r) => r.data),
  import: (data: any) => api.post("/api/stock/import", data).then((r) => r.data),
  export: (data: any) => api.post("/api/stock/export", data).then((r) => r.data),
  getImportHistory: () => api.get("/api/stock/import-history").then((r) => r.data),
  getExportHistory: () => api.get("/api/stock/export-history").then((r) => r.data),
};
