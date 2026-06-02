import api from "./axios";

export const reportApi = {
  getDashboard: () => api.get("/api/reports/dashboard").then((r) => r.data),
  getOTReport: (month: number, year: number) =>
    api.get(`/api/reports/ot?month=${month}&year=${year}`).then((r) => r.data),
  getLeaveReport: (month: number, year: number) =>
    api.get(`/api/reports/leave?month=${month}&year=${year}`).then((r) => r.data),
};
