import { api } from "./strategicApi";

export interface SsoConfig {
  enabled: boolean;
  providerName: string;
  authorizationUri?: string;
  clientId?: string;
  redirectUri?: string;
  scopes: string[];
}

export interface SsoTokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

interface SsoTransaction {
  state: string;
  codeVerifier: string;
  returnTo: string;
  startedAt: number;
}

const TRANSACTION_KEY = "mte_sso_transaction";
const MAX_TRANSACTION_AGE_MS = 10 * 60 * 1000;

export const ssoApi = {
  config: () => api<SsoConfig>("/auth/sso/config"),
  exchange: (code: string, codeVerifier: string) => api<SsoTokenResponse>("/auth/sso/exchange", {
    method: "POST",
    body: JSON.stringify({ code, codeVerifier }),
  }),
};

export async function createSsoAuthorizationUrl(config: SsoConfig, returnTo = "/dashboard") {
  assertSafeConfig(config);
  const codeVerifier = randomBase64Url(64);
  const state = randomBase64Url(32);
  const codeChallenge = await createPkceChallenge(codeVerifier);
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  const transaction: SsoTransaction = { state, codeVerifier, returnTo: safeReturnTo, startedAt: Date.now() };
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction));

  const authorizationUrl = new URL(config.authorizationUri!);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", config.clientId!);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri!);
  authorizationUrl.searchParams.set("scope", config.scopes.join(" "));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  return authorizationUrl.toString();
}

export function consumeSsoCallback(search: string, now = Date.now()) {
  const params = new URLSearchParams(search);
  const providerError = params.get("error");
  if (providerError) {
    sessionStorage.removeItem(TRANSACTION_KEY);
    throw new Error(providerError === "access_denied" ? "El inicio de sesión fue cancelado." : "El proveedor no pudo completar el inicio de sesión.");
  }

  const rawTransaction = sessionStorage.getItem(TRANSACTION_KEY);
  sessionStorage.removeItem(TRANSACTION_KEY);
  if (!rawTransaction) throw new Error("La solicitud SSO no existe o ya fue utilizada.");

  let transaction: SsoTransaction;
  try {
    transaction = JSON.parse(rawTransaction) as SsoTransaction;
  } catch {
    throw new Error("La solicitud SSO almacenada no es válida.");
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || state !== transaction.state) throw new Error("La respuesta SSO no coincide con la solicitud iniciada.");
  if (now - transaction.startedAt > MAX_TRANSACTION_AGE_MS || transaction.startedAt > now + 30_000) {
    throw new Error("La solicitud SSO expiró. Inicia sesión nuevamente.");
  }
  if (transaction.codeVerifier.length < 43 || transaction.codeVerifier.length > 128) {
    throw new Error("El verificador PKCE almacenado no es válido.");
  }

  return { code, codeVerifier: transaction.codeVerifier, returnTo: transaction.returnTo };
}

export async function createPkceChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

function assertSafeConfig(config: SsoConfig) {
  if (!config.enabled || !config.authorizationUri || !config.clientId || !config.redirectUri || !config.scopes.length) {
    throw new Error("El SSO institucional no está configurado.");
  }
  const authorizationUrl = new URL(config.authorizationUri);
  const redirectUrl = new URL(config.redirectUri);
  const secureAuthorization = authorizationUrl.protocol === "https:" || ["localhost", "127.0.0.1"].includes(authorizationUrl.hostname);
  if (!secureAuthorization) throw new Error("El proveedor SSO debe usar HTTPS.");
  if (redirectUrl.origin !== window.location.origin) throw new Error("La URL de retorno SSO no pertenece a esta aplicación.");
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
