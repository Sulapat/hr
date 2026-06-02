import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./router";
import { useAuthStore } from "./store/authStore";

// Pages
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";

// Layout
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// Lazy imports (add as you build each page)
import EmployeeListPage from "./pages/employees/EmployeeList";
import OTListPage from "./pages/ot/OTList";
import LeaveListPage from "./pages/leave/LeaveList";
import TimesheetPage from "./pages/timesheet/Timesheet";
import StockPage from "./pages/stock/Stock";
import ReportPage from "./pages/reports/Report";

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/ot" element={<OTListPage />} />
            <Route path="/leave" element={<LeaveListPage />} />
            <Route path="/timesheet" element={<TimesheetPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/reports" element={<ReportPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
