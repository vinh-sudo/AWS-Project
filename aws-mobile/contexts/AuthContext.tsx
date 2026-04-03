import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getRoleDefaultPath, type RoleDefaultPath } from "@/routes/role-based-route";
import authService, { subscribeSessionCleared } from "@/services/authService";

export type AuthUser = {
  employeeCode: string;
  role: string;
  fullName: string;
};

type LoginInput = {
  employeeCode: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<{ success: boolean; user?: AuthUser }>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasRole: (role?: string | null) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getDefaultPath: () => RoleDefaultPath;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      setIsLoading(true);
      try {
        const [savedUser, authed] = await Promise.all([
          authService.getCurrentUser(),
          authService.isAuthenticated(),
        ]);

        if (mounted && savedUser && authed) {
          setUser({
            employeeCode: savedUser.employeeCode,
            role: savedUser.role,
            fullName: savedUser.fullName,
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = subscribeSessionCleared((reason) => {
      if (!mounted) {
        return;
      }

      setUser(null);
      setIsLoading(false);

      if (reason === "expired" || reason === "unauthorized") {
        setError("Your session has expired. Please sign in again.");
      }
    });

    bootstrapAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ employeeCode, password }: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authService.login(employeeCode.trim(), password);

      const nextUser: AuthUser = {
        employeeCode: session.employeeCode,
        role: session.role,
        fullName: session.fullName,
      };

      setUser(nextUser);
      return { success: true, user: nextUser };
    } catch (loginError: any) {
      setError(loginError?.message ?? "Invalid employee code or password");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasRole = useCallback(
    (role?: string | null) => user?.role?.toUpperCase() === role?.toUpperCase(),
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => roles.some((role) => user?.role?.toUpperCase() === role?.toUpperCase()),
    [user],
  );

  const getDefaultPath = useCallback(() => getRoleDefaultPath(user?.role), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      login,
      logout,
      clearError,
      hasRole,
      hasAnyRole,
      getDefaultPath,
    }),
    [clearError, error, getDefaultPath, hasAnyRole, hasRole, isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
};
