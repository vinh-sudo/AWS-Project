import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  logout as logoutAction,
  clearError,
} from "../redux";
import { getRoleDefaultPath } from "../utils/roleUtils";

/**
 * useAuth - Custom hook providing convenient access to authentication state and actions.
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading, error, logout, hasRole } = useAuth();
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const logout = useCallback(async () => {
    await dispatch(logoutAction());
    navigate("/login");
  }, [dispatch, navigate]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback(
    (role) => {
      return user?.role?.toUpperCase() === role?.toUpperCase();
    },
    [user],
  );

  const hasAnyRole = useCallback(
    (roles) => {
      return roles.some(
        (role) => user?.role?.toUpperCase() === role?.toUpperCase(),
      );
    },
    [user],
  );

  const getDefaultPath = useCallback(() => {
    return getRoleDefaultPath(user?.role);
  }, [user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    clearError: handleClearError,
    hasRole,
    hasAnyRole,
    getDefaultPath,
  };
};

export default useAuth;
