import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { resetAuth } from "../../redux";
import { isTokenExpired, msUntilExpiry } from "../../utils/tokenUtils";

/**
 * Public paths that don't require authentication.
 * If the user is already on one of these, we skip the redirect.
 */
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/otp-verification",
  "/reset-password",
];

/** How often we poll when we can't compute a precise timer (ms). */
const POLL_INTERVAL = 60_000; // 1 minute

/**
 * AuthGuard – invisible component that monitors token expiration.
 *
 * Strategy:
 *  1. Read the refreshToken (or accessToken if no refresh token) from localStorage.
 *  2. Compute how many ms until it expires and schedule a timeout.
 *  3. When it fires, clear auth state and redirect to /login.
 *  4. Also runs on an interval as a safety net (handles system sleep / clock jumps).
 *
 * Place this component once inside <BrowserRouter> (it uses useNavigate).
 */
const AuthGuard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const isPublicPage = PUBLIC_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );

  /**
   * Force-logout the user: clear localStorage, reset Redux, redirect.
   */
  const forceLogout = useCallback(() => {
    // Avoid running on public pages
    if (PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))) {
      return;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    dispatch(resetAuth());
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  /**
   * Check tokens and schedule (or execute) logout.
   */
  const checkTokens = useCallback(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    // Not logged in – nothing to guard
    if (isAuthenticated !== "true" || (!accessToken && !refreshToken)) {
      return;
    }

    // Use refreshToken as the "session lifetime"; fall back to accessToken
    const tokenToWatch = refreshToken || accessToken;

    if (isTokenExpired(tokenToWatch, 5_000)) {
      // Already expired (or expires within 5 s) → logout now
      forceLogout();
      return;
    }

    // Schedule a precise timeout for when the token expires
    const remaining = msUntilExpiry(tokenToWatch);
    if (remaining > 0) {
      clearTimeout(timerRef.current);
      // Subtract a small buffer so we act slightly before expiry
      const delay = Math.max(remaining - 5_000, 0);
      timerRef.current = setTimeout(() => {
        forceLogout();
      }, delay);
    }
  }, [forceLogout]);

  useEffect(() => {
    if (isPublicPage) return;

    // Initial check
    checkTokens();

    // Safety-net interval (handles sleep/wake, manual localStorage edits, etc.)
    intervalRef.current = setInterval(() => {
      checkTokens();
    }, POLL_INTERVAL);

    // Re-check whenever another tab clears tokens
    const onStorageChange = (e) => {
      if (
        e.key === "accessToken" ||
        e.key === "refreshToken" ||
        e.key === "isAuthenticated"
      ) {
        checkTokens();
      }
    };
    window.addEventListener("storage", onStorageChange);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [isPublicPage, checkTokens]);

  // This component renders nothing
  return null;
};

export default AuthGuard;
