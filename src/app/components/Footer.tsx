import { IcesiLogo } from "./IcesiLogo";

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: "#5454E9", flexShrink: 0 }}
      className="px-8 py-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Logo + info */}
        <div className="flex items-center gap-4">
          <IcesiLogo variant="white" size="sm" />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 16 }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "11px", fontWeight: 600 }}>
              MTE · Modulo de Trazabilidad Estrategica
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px" }}>
              Escuela TDI · Facultad de Ingeniería, Diseño y Ciencias Aplicadas
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          {["Soporte TI", "Políticas de uso", "Manual de usuario"].map((link) => (
            <a
              key={link}
              href="#"
              style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", textDecoration: "none" }}
              className="hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Version */}
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>
            v1.0.0 · © 2026 Universidad ICESI
          </p>
        </div>
      </div>
    </footer>
  );
}
