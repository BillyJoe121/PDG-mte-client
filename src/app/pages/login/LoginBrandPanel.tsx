import { IcesiLogo } from "../../components/IcesiLogo";

/** Left panel – minimal branded (desktop only). */
export function LoginBrandPanel() {
  return (
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
          Trazabilidad estratégica para tus iniciativas.
        </h2>
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
  );
}
