import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeSsoCallback, createPkceChallenge, createSsoAuthorizationUrl } from "./ssoApi";

describe("SSO PKCE flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("crypto", webcrypto);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("generates the RFC 7636 S256 challenge", async () => {
    await expect(createPkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
      .resolves.toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("builds an authorization request with state and S256 PKCE", async () => {
    const value = await createSsoAuthorizationUrl({
      enabled: true,
      providerName: "ICESI",
      authorizationUri: "https://identity.example/authorize",
      clientId: "mte-client",
      redirectUri: `${window.location.origin}/auth/callback`,
      scopes: ["openid", "profile", "email"],
    });
    const url = new URL(value);
    const transaction = JSON.parse(sessionStorage.getItem("mte_sso_transaction") ?? "{}");

    expect(url.origin).toBe("https://identity.example");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe(transaction.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toHaveLength(43);
    expect(transaction.codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  it("consumes a matching callback once", () => {
    sessionStorage.setItem("mte_sso_transaction", JSON.stringify({
      state: "expected-state",
      codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
      returnTo: "/dashboard",
      startedAt: 1_000,
    }));

    expect(consumeSsoCallback("?code=single-use-code&state=expected-state", 2_000)).toEqual({
      code: "single-use-code",
      codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
      returnTo: "/dashboard",
    });
    expect(() => consumeSsoCallback("?code=single-use-code&state=expected-state", 2_000)).toThrow(/no existe|utilizada/i);
  });

  it("rejects state mismatch and expired transactions", () => {
    const transaction = {
      state: "expected-state",
      codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
      returnTo: "/dashboard",
      startedAt: 1_000,
    };
    sessionStorage.setItem("mte_sso_transaction", JSON.stringify(transaction));
    expect(() => consumeSsoCallback("?code=code&state=attacker-state", 2_000)).toThrow(/no coincide/i);

    sessionStorage.setItem("mte_sso_transaction", JSON.stringify(transaction));
    expect(() => consumeSsoCallback("?code=code&state=expected-state", 700_001)).toThrow(/expiró/i);
  });
});
