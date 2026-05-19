import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { IcesiLogo } from "../components/IcesiLogo";
import { useAuth, Rol } from "../context/AuthContext";

const DEMO_USERS = [
  {
    id: "U1",
    nombre: "Hugo Arboleda",
    correo: "harboleda@icesi.edu.co",
    rol: "director" as Rol,
    departamento: "Dirección TDI",
    iniciales: "HA",
    descripcion: "Director Escuela TDI",
    color: "#5454E9",
  },
  {
    id: "U2",
    nombre: "Rocío Segovia",
    correo: "rsegovia@icesi.edu.co",
    rol: "jefe" as Rol,
    departamento: "DCSI",
    iniciales: "RS",
    descripcion: "Jefa de Departamento",
    color: "#4CB979",
  },
  {
    id: "U12",
    nombre: "Leonardo Bustamante",
    correo: "lbustamante@icesi.edu.co",
    rol: "tutor" as Rol,
    departamento: "DCSI",
    iniciales: "LB",
    descripcion: "Tutor de Proyectos",
    color: "#E9683B",
  },
  {
    id: "U10",
    nombre: "Sistemas MTE",
    correo: "mte-admin@icesi.edu.co",
    rol: "administrador" as Rol,
    departamento: "TI Institucional",
    iniciales: "AD",
    descripcion: "Administrador",
    color: "#000000",
  },
];

export function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = (demoUser: typeof DEMO_USERS[0]) => {
    login(demoUser);
    navigate("/dashboard");
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }
    const found = DEMO_USERS.find((u) => u.correo === correo);
    if (found && password.length >= 4) {
      login(found);
      navigate("/dashboard");
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
      {/* Left panel – minimal branded */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #5454E9 0%, #3D3DBF 100%)",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Soft blob accent */}
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: 480,
            height: 480,
            background: "#E4EB60",
            bottom: -160,
            right: -120,
          }}
        />

        {/* Top */}
        <div className="relative z-10">
          <IcesiLogo variant="white" size="lg" />
        </div>

        {/* Center */}
        <div className="relative z-10 max-w-md">
          <div
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <Sparkles size={12} color="#E4EB60" />
            <span
              style={{
                color: "#fff",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              Escuela TDI · Universidad ICESI
            </span>
          </div>

          <h2
            style={{
              color: "#FFFFFF",
              fontSize: "40px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            Trazabilidad estratégica para tus proyectos.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "15px",
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            Vincula iniciativas a OKRs institucionales y evidencia el
            impacto real de tu trabajo en una sola plataforma.
          </p>

          {/* Stats row */}
          <div className="flex gap-10 mt-12">
            {[
              { label: "Apuestas", value: "12" },
              { label: "OKRs activos", value: "38" },
              { label: "Proyectos", value: "147" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  style={{
                    color: "#fff",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: "11px",
                    marginTop: 6,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center justify-between">
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>
            © 2026 Universidad ICESI · Cali, Colombia
          </p>
          <div className="flex gap-1">
            {["#E4EB60", "#4CB979", "#E9683B"].map((c) => (
              <div
                key={c}
                style={{
                  width: 24,
                  height: 3,
                  backgroundColor: c,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

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
              Accede con tus credenciales institucionales ICESI.
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div style={{ flex: 1, height: 1, backgroundColor: "#F1F1F1" }} />
            <span
              style={{
                fontSize: "11px",
                color: "#9CA3AF",
                letterSpacing: "0.04em",
              }}
            >
              O CONTINÚA CON
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#F1F1F1" }} />
          </div>

          {/* SSO */}
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-colors"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#000",
              backgroundColor: "#fff",
              border: "1.5px solid #E5E7EB",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FAFAFA";
              e.currentTarget.style.borderColor = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google Workspace ICESI
          </button>

          {/* Demo access toggle */}
          <div className="mt-8">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: showDemo ? "#FAFAF0" : "transparent",
                border: `1px dashed ${showDemo ? "#E4EB60" : "#E5E7EB"}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#E4EB60",
                    boxShadow: "0 0 0 3px rgba(228,235,96,0.25)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#000",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Acceso rápido demo
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#717182" }}>
                {showDemo ? "Ocultar" : "Mostrar"}
              </span>
            </button>

            {showDemo && (
              <div className="mt-2 space-y-1.5">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleDemoLogin(u)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors group"
                    style={{ border: "1px solid transparent" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FAFAFA";
                      e.currentTarget.style.borderColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-md"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: u.color,
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {u.iniciales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#000",
                        }}
                      >
                        {u.nombre}
                      </p>
                      <p style={{ fontSize: "10px", color: "#717182" }}>
                        {u.descripcion} · {u.departamento}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      color="#9CA3AF"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p
            className="text-center mt-10"
            style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.02em" }}
          >
            Acceso restringido a usuarios ICESI · MTE v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
