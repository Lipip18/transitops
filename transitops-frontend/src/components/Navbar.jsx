import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { roles } from "../data/roles";
import "../styles/navbar.css";

const titles = {
  "/": "Operations Dashboard",
  "/vehicles": "Vehicle Registry",
  "/drivers": "Driver Management",
  "/trips": "Trip Management",
  "/maintenance": "Maintenance",
  "/fuel": "Fuel & Expenses",
  "/reports": "Reports & Analytics",
  "/notifications": "Notifications",
  "/users": "User Management",
  "/audit": "Audit Logs",
};

function Navbar() {
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const roleMeta = roles.find((r) => r.id === user.role);
  const initials = (user.name || "TO")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">
        <h2>{titles[location.pathname] || "TransitOps"}</h2>
        {roleMeta && <span className="navbar-role-pill">{roleMeta.label}</span>}
      </div>

      <div className="nav-right">
        <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="theme-btn"
          onClick={() => navigate("/notifications")}
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="nav-user">
          <span className="nav-avatar">{initials}</span>
          <div className="nav-user-meta">
            <span className="nav-user-name">{user.name || "Guest"}</span>
            <span className="nav-user-role">{roleMeta ? roleMeta.label : "—"}</span>
          </div>
        </div>

        <button className="theme-btn logout-btn" onClick={logout} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
