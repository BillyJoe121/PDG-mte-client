export const ACCESS_TOKEN_KEY = "sgp_access_token";

export function getSessionAccessToken() {
  try {
    const storageHost = typeof window === "undefined" ? globalThis : window;
    return storageHost.sessionStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Se emite cuando la API rechaza el token guardado (vencido, revocado o cuenta desactivada). */
export const SESSION_REJECTED_EVENT = "mte:session-rejected";

export function notifySessionRejected() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_REJECTED_EVENT));
}
