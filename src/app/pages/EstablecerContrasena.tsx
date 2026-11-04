import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  AuthErrorBox,
  AuthField,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordProblem,
} from "../components/auth/AuthField";
import { authApi, authErrorMessage, type AccessLinkType } from "../services/authApi";

const LINK_TYPES: AccessLinkType[] = ["invite", "recovery", "magiclink", "signup", "email"];
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;

function readLink(params: URLSearchParams) {
  const tokenHash = params.get("token_hash") ?? "";
  const type = params.get("type") as AccessLinkType | null;
  if (!TOKEN_PATTERN.test(tokenHash) || !type || !LINK_TYPES.includes(type)) return null;
  return { tokenHash, type };
}

const cardClass = "w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm";
const primaryLinkClass = "mt-6 inline-flex rounded-md bg-[#5454E9] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3F3FD1]";

export function EstablecerContrasena() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [link] = useState(() => readLink(params));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!link) return;
    const problem = passwordProblem(password, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await authApi.setPassword(link.tokenHash, link.type, password);
      // El enlace ya se consumió: se quita de la barra de direcciones y del historial.
      navigate("/establecer-contrasena", { replace: true });
      setDone(true);
    } catch (requestError) {
      setError(authErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  const clearError = (update: (value: string) => void) => (value: string) => {
    update(value);
    setError("");
  };

  return (
    <main className="type-scale-exempt grid min-h-screen place-items-center bg-[#F8FAFC] p-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {done ? (
        <section className={`${cardClass} text-center`} aria-live="polite">
          <CheckCircle2 className="mx-auto text-[#16A34A]" size={38} aria-hidden="true" />
          <h1 className="mt-4 text-xl font-extrabold text-gray-900">Contraseña guardada</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Ya puedes iniciar sesión con tu correo institucional y la contraseña que acabas de definir.</p>
          <Link to="/login" replace className={primaryLinkClass}>Ir a iniciar sesión</Link>
        </section>
      ) : !link ? (
        <section className={`${cardClass} text-center`}>
          <AlertTriangle className="mx-auto text-[#E9683B]" size={38} aria-hidden="true" />
          <h1 className="mt-4 text-xl font-extrabold text-gray-900">Enlace incompleto</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600" role="alert">
            Abre el enlace completo que te entregó el administrador del MTE. Si ya lo usaste o venció, pídele uno nuevo.
          </p>
          <Link to="/login" replace className={primaryLinkClass}>Volver al acceso</Link>
        </section>
      ) : (
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5454E9]">MTE · Acceso</p>
          <h1 className="mt-2 text-2xl font-bold text-black">
            {link.type === "invite" ? "Crea tu contraseña" : "Define una nueva contraseña"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#717182]">
            El enlace sirve una sola vez. Después ingresarás con tu correo institucional y esta contraseña.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {error && <AuthErrorBox message={error} />}
            <AuthField
              id="new-password"
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={clearError(setPassword)}
              autoComplete="new-password"
              hint={`Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`}
              disabled={submitting}
              autoFocus
            />
            <AuthField
              id="confirm-password"
              label="Confirma la contraseña"
              type="password"
              value={confirmation}
              onChange={clearError(setConfirmation)}
              autoComplete="new-password"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#5454E9] disabled:cursor-wait disabled:bg-gray-500"
            >
              {submitting && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
