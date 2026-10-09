import { Navigate } from "react-router-dom";
import {
  firstAllowedPage,
  getStoredRole,
  roleAccess,
} from "../data/roles";

function ProtectedRoute({ children, requiredPage }) {
  const token = localStorage.getItem("token");
  const role = getStoredRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!roleAccess[role]) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (requiredPage && !roleAccess[role]?.includes(requiredPage)) {
    return <Navigate to={firstAllowedPage(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;