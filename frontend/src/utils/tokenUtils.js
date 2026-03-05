/**
 * JWT Token Utilities
 * Decode JWT tokens and check expiration without external libraries.
 */

/**
 * Decode a JWT token payload (base64url → JSON).
 * Returns null if the token is invalid.
 */
export function decodeToken(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad with '=' to make length a multiple of 4
    while (payload.length % 4 !== 0) {
      payload += "=";
    }

    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get the expiration time (in ms since epoch) of a JWT token.
 * Returns 0 if the token cannot be decoded.
 */
export function getTokenExpiration(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;
  return payload.exp * 1000; // JWT exp is in seconds
}

/**
 * Check whether a JWT token is expired (or will expire within `bufferMs`).
 * @param {string} token - JWT string
 * @param {number} bufferMs - Grace period in ms (default 30 s)
 */
export function isTokenExpired(token, bufferMs = 30_000) {
  const exp = getTokenExpiration(token);
  if (exp === 0) return true; // cannot determine → treat as expired
  return Date.now() + bufferMs >= exp;
}

/**
 * Return the number of milliseconds until the token expires.
 * Returns 0 if already expired or token is invalid.
 */
export function msUntilExpiry(token) {
  const exp = getTokenExpiration(token);
  if (exp === 0) return 0;
  const remaining = exp - Date.now();
  return remaining > 0 ? remaining : 0;
}
