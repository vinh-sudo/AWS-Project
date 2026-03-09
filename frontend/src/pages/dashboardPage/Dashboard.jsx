import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { getRoleDefaultPath } from "../../routes/RoleBasedRoute";

const Dashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const role = currentUser?.role?.toUpperCase();
    const targetPath = getRoleDefaultPath(role);
    if (targetPath && targetPath !== "/dashboard") {
      navigate(targetPath, { replace: true });
    }
  }, [currentUser, navigate]);

  // Fallback nếu không xác định được role - redirect về login
  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, navigate]);

  return null;
};

export default Dashboard;
