import {
  BarChart3,
  Car,
  ClipboardList,
  Fuel,
  Home,
  IdCard,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { getStoredRole, roleAccess, roles } from "../data/roles";
import "../styles/sidebar.css";

const menus = [
  { key: "dashboard", title: "Dashboard", icon: <Home size={18} />, path: "/dashboard" },
  { key: "vehicles", title: "Vehicles", icon: <Truck size={18} />, path: "/vehicles" },
  { key: "drivers", title: "Drivers", icon: <Users size={18} />, path: "/drivers" },
  { key: "trips", title: "Trips", icon: <Car size={18} />, path: "/trips" },
  { key: "maintenance", title: "Maintenance", icon: <Wrench size={18} />, path: "/maintenance" },
  { key: "fuel", title: "Fuel & Expenses", icon: <Fuel size={18} />, path: "/fuel" },
  { key: "reports", title: "Reports", icon: <BarChart3 size={18} />, path: "/reports" },
  { key: "notifications", title: "Notifications", icon: <ClipboardList size={18} />, path: "/notifications" },
  { key: "users", title: "Users", icon: <ShieldCheck size={18} />, path: "/users" },
  { key: "audit", title: "Audit Logs", icon: <ClipboardList size={18} />, path: "/audit" },
  { key: "profile", title: "Profile", icon: <IdCard size={18} />, path: "/profile" },
];

function Sidebar() {
  const role = getStoredRole();
  const roleMeta = roles.find((r) => r.id === role);
  const allowed = roleAccess[role] || [];
  const visibleMenus = menus.filter((m) => allowed.includes(m.key));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-dot" />
        <span className="sidebar-brand-text">TransitOps</span>
      </div>

      <nav className="sidebar-nav">
        {visibleMenus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end
            className={({ isActive }) => (isActive ? "menu active" : "menu")}
          >
            {menu.icon}
            <span>{menu.title}</span>
          </NavLink>
        ))}
      </nav>

      {roleMeta && (
        <div className="sidebar-role">
          <span className="sidebar-role-tag">{roleMeta.ticket}</span>
          <div>
            <p className="sidebar-role-label">{roleMeta.label}</p>
            <p className="sidebar-role-scope">Role-based access</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
