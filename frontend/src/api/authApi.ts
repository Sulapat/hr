import api from "./axios";

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }).then((r) => r.data),
  getMe: () => api.get("/api/auth/me").then((r) => r.data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.patch("/api/auth/change-password", { oldPassword, newPassword }).then((r) => r.data),
};
