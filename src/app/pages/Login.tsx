import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { IcesiLogo } from "../components/IcesiLogo";
import { useAuth } from "../context/AuthContext";
import { createSsoAuthorizationUrl, ssoApi, type SsoConfig } from "../services/ssoApi";
import { DEMO_USERS, type DemoUser } from "./login/loginDemoUsers";
import { LoginBrandPanel } from "./login/LoginBrandPanel";
import { LoginDemoAccess } from "./login/LoginDemoAccess";

export function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null);
  const [ssoStarting, setSsoStarting] = useState(false);
  const [ssoMessage, setSsoMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    ssoApi.config()
      .then((config) => { if (active) setSsoConfig(config); })
      .catch(() => { if (active) setSsoConfig({ enabled: false, providerName: "ICESI", scopes: [] }); });
    return () => { active = false; };
  }, []);

  const beginInstitutionalLogin = async () => {
    if (!ssoConfig?.enabled) return;
    setSsoStarting(true);
    setSsoMessage("");
    try {
      const authorizationUrl = await createSsoAuthorizationUrl(ssoConfig);
      window.location.assign(authorizationUrl);
    } catch (startError) {
      setSsoMessage(startError instanceof Error ? startError.message : "No se pudo iniciar el acceso institucional.");
      setSsoStarting(false);
    }
  };

  const authenticateDemoUser = (demoUser: DemoUser) => {
    setError("");
    login(demoUser);
    navigate("/dashboard");
  };

  const handleDemoLogin = (demoUser: DemoUser) => {
    authenticateDemoUser(demoUser);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }
    const found = DEMO_USERS.find((u) => u.correo === correo);
    if (found && password.length >= 4) {
      authenticateDemoUser(found);
    } else {
      setError("Credenciales inválidas. Usa un correo de la lista de demo.");
    }
  };

  const inputBorder = (field: string) =>
    `1.5px solid ${focusField === field ? "#5454E9" : "#E5E7EB"}`;

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#FFFFFF", fontFamily: "Montserrat, sans-serif" }}
    >
      <LoginBrandPanel />

      {/* Right panel – Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <div
            className="inline-flex items-center px-4 py-2.5 rounded-md"
            style={{ backgroundColor: "#5454E9" }}
          >
            <IcesiLogo variant="white" size="sm" />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-5 rounded-xl border border-[#DDE3FF] bg-[#F7F8FF] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#5454E9]">Acceso institucional seguro</p>
            <p className="mt-2 text-xs leading-5 text-gray-600">
              {ssoConfig === null
                ? "Consultando el proveedor de identidad…"
                : ssoConfig.enabled
                  ? `Continúa con ${ssoConfig.providerName}; MTE no recibe ni almacena tu contraseña.`
                  : "El SSO no está configurado en este entorno. El acceso demo permanece disponible para desarrollo."}
            </p>
            <button
              type="button"
              onClick={() => void beginInstitutionalLogin()}
              disabled={!ssoConfig?.enabled || ssoStarting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5454E9] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {ssoStarting ? "Redirigiendo…" : `Continuar con ${ssoConfig?.providerName ?? "ICESI"}`}
              {!ssoStarting && <ArrowRight size={15} aria-hidden="true" />}
            </button>
            {ssoMessage && <p className="mt-3 text-xs font-semibold text-red-700" role="alert">{ssoMessage}</p>}
          </div>

          <LoginDemoAccess
            showDemo={showDemo}
            onToggle={() => setShowDemo(!showDemo)}
            onSelect={handleDemoLogin}
          />

          {!showDemo && (
            <>
          <div className="mb-10">
            <p
              style={{
                color: "#5454E9",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              MTE · Bienvenido
            </p>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#000000",
                marginBottom: 8,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Inicia sesión
            </h1>
            <p style={{ color: "#717182", fontSize: "14px", lineHeight: 1.5 }}>
              Usa el acceso institucional o, en desarrollo, una cuenta demo autorizada.
            </p>
          </div>

          {/* Manual form */}
          <form onSubmit={handleManualLogin} className="space-y-5">
            {error && (
              <div
                className="px-4 py-3 rounded-md flex items-start gap-2"
                style={{
                  backgroundColor: "#FEF3F2",
                  border: "1px solid #FECACA",
                  color: "#991B1B",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 600 }}>•</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#000",
                  display: "block",
                  marginBottom: 8,
                  letterSpacing: "0.01em",
                }}
              >
                Correo institucional
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  setError("");
                }}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                placeholder="usuario@icesi.edu.co"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: inputBorder("email"),
                  borderRadius: 8,
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow:
                    focusField === "email"
                      ? "0 0 0 4px rgba(84,84,233,0.12)"
                      : "none",
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#000",
                    letterSpacing: "0.01em",
                  }}
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  style={{
                    fontSize: "11px",
                    color: "#5454E9",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 14px",
                    border: inputBorder("password"),
                    borderRadius: 8,
                    fontSize: "13px",
                    outline: "none",
                    backgroundColor: "#fff",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow:
                      focusField === "password"
                        ? "0 0 0 4px rgba(84,84,233,0.12)"
                        : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#717182" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                style={{ accentColor: "#5454E9", width: 14, height: 14 }}
              />
              <span style={{ fontSize: "12px", color: "#717182" }}>
                Mantener sesión iniciada
              </span>
            </label>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg group"
              style={{
                backgroundColor: "#000000",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                transition: "background-color 0.15s, transform 0.05s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#5454E9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#000000")
              }
            >
              Ingresar al MTE
              <ArrowRight
                size={15}
                style={{ transition: "transform 0.15s" }}
                className="group-hover:translate-x-0.5"
              />
            </button>
          </form>

          <p
            className="text-center mt-10"
            style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.02em" }}
          >
            Acceso restringido a usuarios ICESI · MTE v1.0.0
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
