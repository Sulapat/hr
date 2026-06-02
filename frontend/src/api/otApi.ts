import api from "./axios";

export const otApi = {
  getAll: () => api.get("/api/ot").then((r) => r.data),
  create: (data: any) => api.post("/api/ot", data).then((r) => r.data),
  approve: (id: string, status: string, note?: string) =>
    api.patch(`/api/ot/${id}/approve`, { status, note }).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/ot/${id}`).then((r) => r.data),
  getTypes: () => api.get("/api/ot-types").then((r) => r.data),
};
