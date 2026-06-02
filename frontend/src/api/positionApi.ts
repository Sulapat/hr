import api from "./axios";

export const positionApi = {
  getAll: () => api.get("/api/positions").then((r) => r.data),
  create: (data: { name: string }) => api.post("/api/positions", data).then((r) => r.data),
  update: (id: string, data: { name: string }) =>
    api.patch(`/api/positions/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/positions/${id}`).then((r) => r.data),
};
