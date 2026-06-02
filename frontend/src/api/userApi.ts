import api from "./axios";

export const userApi = {
  getAll: () => api.get("/api/users").then((r) => r.data),
  getById: (id: string) => api.get(`/api/users/${id}`).then((r) => r.data),
  create: (data: any) => api.post("/api/users", data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/api/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/users/${id}`).then((r) => r.data),
  uploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post(`/api/users/${id}/avatar`, form).then((r) => r.data);
  },
};
