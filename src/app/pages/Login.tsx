import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { IcesiLogo } from "../components/IcesiLogo";
import { AuthErrorBox, AuthField } from "../components/auth/AuthField";
import { useAuth } from "../context/AuthContext";
import { authApi, authErrorMessage, normalizeAuthMe, sessionExpiry } from "../services/authApi";
import { LoginBrandPanel } from "./login/LoginBrandPanel";

export function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = correo.trim();
    if (!email || !password) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const session = await authApi.login(email, password);
      const me = await authApi.me(session.accessToken);
      login({
        ...normalizeAuthMe(me, { correo: email }),
        token: session.accessToken,
        expiresAt: sessionExpiry(session),
      });
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      setError(authErrorMessage(loginError));
      setSubmitting(false);
    }
  };

  const clearError = (update: (value: string) => void) => (value: string) => {
    update(value);
    setError("");
  };

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <LoginBrandPanel />

      <div className="relative flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="absolute left-6 top-6 lg:hidden">
          <div className="inline-flex items-center rounded-md bg-[#5454E9] px-4 py-2.5">
            <IcesiLogo variant="white" size="sm" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#5454E9]">MTE · Bienvenido</p>
            <h1 className="mb-2 text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-black">Inicia sesión</h1>
            <p className="text-sm leading-normal text-[#717182]">
              Ingresa con tu correo institucional y tu contraseña del MTE.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && <AuthErrorBox message={error} />}

            <AuthField
              id="login-email"
              label="Correo institucional"
              type="email"
              value={correo}
              onChange={clearError(setCorreo)}
              autoComplete="username"
              placeholder="usuario@icesi.edu.co"
              disabled={submitting}
            />
            <AuthField
              id="login-password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={clearError(setPassword)}
              autoComplete="current-password"
              disabled={submitting}
            />

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-[13px] font-semibold tracking-[0.01em] text-white transition-colors duration-150 hover:bg-[#5454E9] disabled:cursor-wait disabled:bg-gray-500"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                <>
                  Ingresar al MTE
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-[#717182]">
            ¿Es tu primer ingreso o olvidaste tu contraseña? Pide a un administrador del MTE tu enlace de acceso.
          </p>

          <p className="mt-10 text-center text-[10px] tracking-[0.02em] text-[#9CA3AF]">
            Acceso restringido a usuarios ICESI · MTE v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
