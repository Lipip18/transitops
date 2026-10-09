export const roles = [
  {
    id: "Fleet Manager",
    label: "Fleet Manager",
    ticket: "FM",
    summary: "Oversees fleet assets, maintenance, vehicle lifecycle and operational efficiency.",
    landing: "/",
    accent: "amber",
  },
  {
    id: "Driver",
    label: "Driver",
    ticket: "DR",
    summary: "Creates trips, assigns vehicles and drivers, and monitors active deliveries.",
    landing: "/trips",
    accent: "teal",
  },
  {
    id: "Safety Officer",
    label: "Safety Officer",
    ticket: "SO",
    summary: "Ensures driver compliance, tracks license validity and monitors safety scores.",
    landing: "/drivers",
    accent: "red",
  },
  {
    id: "Financial Analyst",
    label: "Financial Analyst",
    ticket: "FA",
    summary: "Reviews operational expenses, fuel consumption, maintenance costs and profitability.",
    landing: "/reports",
    accent: "slate",
  },
  {
    id: "Admin",
    label: "Admin",
    ticket: "AD",
    summary: "Manages TransitOps user accounts and administrative access.",
    landing: "/",
    accent: "slate",
  },
];

// Which sidebar sections each role is permitted to see (RBAC per spec 3.1).
export const roleAccess = {
  "Fleet Manager": ["dashboard", "vehicles", "drivers", "trips", "maintenance", "fuel", "reports", "notifications", "users", "audit"],
  Driver: ["trips", "notifications"],
  "Safety Officer": ["drivers", "notifications"],
  "Financial Analyst": ["fuel", "reports", "notifications"],
  Admin: ["dashboard", "notifications", "users", "audit"],
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getStoredRole = () => readStoredUser().role;

export const hasRole = (...allowedRoles) =>
  allowedRoles.includes(getStoredRole());

export const pageForMenu = {
  dashboard: "/",
  vehicles: "/vehicles",
  drivers: "/drivers",
  trips: "/trips",
  maintenance: "/maintenance",
  fuel: "/fuel",
  reports: "/reports",
  notifications: "/notifications",
  users: "/users",
  audit: "/audit",
};

export const firstAllowedPage = (role) =>
  pageForMenu[roleAccess[role]?.[0]] || "/login";
