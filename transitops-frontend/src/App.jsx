import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Fuel from "./pages/Fuel";
import Login from "./pages/Login";
import Maintenance from "./pages/Maintenance";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Trips from "./pages/Trips";
import Vehicles from "./pages/Vehicles";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const token = localStorage.getItem("token");

  const protectedPage = (Page, requiredPage) => (
    <ProtectedRoute requiredPage={requiredPage}>
      <DashboardLayout>
        <Page />
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/" element={protectedPage(Dashboard, "dashboard")} />
        <Route path="/vehicles" element={protectedPage(Vehicles, "vehicles")} />
        <Route path="/drivers" element={protectedPage(Drivers, "drivers")} />
        <Route path="/trips" element={protectedPage(Trips, "trips")} />
        <Route path="/maintenance" element={protectedPage(Maintenance, "maintenance")} />
        <Route path="/fuel" element={protectedPage(Fuel, "fuel")} />
        <Route path="/reports" element={protectedPage(Reports, "reports")} />
        <Route path="/notifications" element={protectedPage(Notifications, "notifications")} />
        <Route path="/users" element={protectedPage(Users, "users")} />
        <Route path="/audit" element={protectedPage(AuditLogs, "audit")} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;