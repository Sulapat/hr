import api from "./axios";

export const statusApi = {
  getAll: () => api.get("/api/statuses").then((r) => r.data),
  create: (data: { name: string }) => api.post("/api/statuses", data).then((r) => r.data),
};
