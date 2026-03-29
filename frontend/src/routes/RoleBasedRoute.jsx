import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../redux";

const normalizeRole = (role) => {
  const normalized = role?.toUpperCase();
  if (normalized === "PRODUCTION_PLANNER") {
    return "MANAGER";
  }
  return normalized;
};

/**
 * RoleBasedRoute - Restricts access to specific roles.
 * If the user is authenticated but doesn't have the required role,
 * they are redirected to their own dashboard.
 *
 * @param {string[]} allowedRoles - Array of allowed role strings (e.g. ["ADMIN", "MANAGER"])
 * @param {React.ReactNode} children - The protected content
 */
const RoleBasedRoute = ({ allowedRoles, children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user?.role);

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    normalizeRole(role),
  );

  if (!normalizedAllowedRoles.includes(userRole)) {
    // Redirect to the user's own dashboard based on their role
    const redirectPath = getRoleDefaultPath(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

/**
 * Returns the default path for a given role.
 */
export const getRoleDefaultPath = (role) => {
  switch (normalizeRole(role)) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "LINE_LEADER":
      return "/leader/progress";
    default:
      return "/dashboard";
  }
};

export default RoleBasedRoute;
