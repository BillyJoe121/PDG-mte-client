import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router";

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <ShieldAlert size={48} color="#E9683B" className="mb-4" />
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#000" }}>Acceso restringido</h2>
      <p style={{ fontSize: "13px", color: "#717182", marginTop: 8, maxWidth: 420 }}>
        Tu rol no tiene permisos para abrir este modulo. Puedes volver al dashboard principal.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-5 rounded-lg px-4 py-2 hover:opacity-90"
        style={{ backgroundColor: "#5454E9", color: "#fff", fontSize: "12px", fontWeight: 800 }}
      >
        Ir al dashboard
      </button>
    </div>
  );
}

