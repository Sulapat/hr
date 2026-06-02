import api from "./axios";

export const leaveApi = {
  getAll: () => api.get("/api/leave").then((r) => r.data),
  create: (data: FormData) => api.post("/api/leave", data).then((r) => r.data),
  approve: (id: string, status: string, note?: string) =>
    api.patch(`/api/leave/${id}/approve`, { status, note }).then((r) => r.data),
};
