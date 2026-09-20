export const ACCESS_TOKEN_KEY = "sgp_access_token";

export function getSessionAccessToken() {
  try {
    const storageHost = typeof window === "undefined" ? globalThis : window;
    return storageHost.sessionStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}
