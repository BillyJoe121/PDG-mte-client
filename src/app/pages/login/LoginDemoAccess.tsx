import { ArrowRight } from "lucide-react";
import { DEMO_USERS, type DemoUser } from "./loginDemoUsers";

interface LoginDemoAccessProps {
  showDemo: boolean;
  onToggle: () => void;
  onSelect: (demoUser: DemoUser) => void;
}

/** Demo access toggle and quick-access account list. */
export function LoginDemoAccess({ showDemo, onToggle, onSelect }: LoginDemoAccessProps) {
  return (
    <div className="mb-8">
      <button
        onClick={onToggle}
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
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors group"
              style={{
                border: "1px solid transparent",
              }}
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
  );
}
