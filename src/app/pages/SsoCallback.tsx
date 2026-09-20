import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { authApi, normalizeAuthMe } from "../services/authApi";
import { consumeSsoCallback, ssoApi } from "../services/ssoApi";

export function SsoCallback() {
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    let active = true;
    async function completeLogin() {
      try {
        const callback = consumeSsoCallback(location.search);
        const token = await ssoApi.exchange(callback.code, callback.codeVerifier);
        if (token.tokenType !== "Bearer" || !token.accessToken) throw new Error("El proveedor no entregó una sesión válida.");
        sessionStorage.setItem("sgp_access_token", token.accessToken);
        const me = await authApi.me();
        if (!active) return;
        const expiresAt = Date.now() + Math.max(1, token.expiresIn) * 1000;
        login({ ...normalizeAuthMe(me), token: token.accessToken, expiresAt });
        navigate(callback.returnTo, { replace: true });
      } catch (callbackError) {
        sessionStorage.removeItem("sgp_access_token");
        if (active) setError(callbackError instanceof Error ? callbackError.message : "No fue posible completar el inicio de sesión.");
      }
    }
    void completeLogin();
    return () => { active = false; };
  }, [location.search, login, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FAFC] p-6">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm" aria-live="polite">
        {error ? (
          <>
            <AlertTriangle className="mx-auto text-[#E9683B]" size={38} aria-hidden="true" />
            <h1 className="mt-4 text-xl font-extrabold text-gray-900">No se pudo iniciar sesión</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600" role="alert">{error}</p>
            <Link to="/login" replace className="mt-6 inline-flex rounded-md bg-[#5454E9] px-4 py-2.5 text-sm font-bold text-white">Volver al acceso</Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-[#5454E9] motion-reduce:animate-none" size={38} aria-hidden="true" />
            <h1 className="mt-4 text-xl font-extrabold text-gray-900">Validando acceso institucional</h1>
            <p className="mt-3 text-sm text-gray-600">Estamos verificando tu identidad y permisos en MTE.</p>
          </>
        )}
      </section>
    </main>
  );
}
