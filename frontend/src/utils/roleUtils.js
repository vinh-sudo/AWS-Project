export const normalizeRole = (role) => {
  return role?.toUpperCase();
};

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
