import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  contributionTypeLabel,
  type ImpactChain,
  type ProjectKeyResultLinkResponse,
} from "../../services/projectsApi";
import { COLORS } from "./projectDetailShared";

type ImpactItem = ImpactChain["impacts"][number];

/** Metas y Apuestas a las que aporta un KR dentro de la cadena de impacto. */
export function impactStrategyLabel(impact?: Pick<ImpactItem, "goalNames" | "strategicBetNames">) {
  if (!impact) return "";
  return [...(impact.goalNames ?? []), ...(impact.strategicBetNames ?? [])].filter(Boolean).join(", ");
}

interface LinkedKrCardProps {
  canManage: boolean;
  link: ProjectKeyResultLinkResponse;
  impact?: ImpactItem;
  onEditLink: () => void;
  onUnlink: () => void;
}

export function LinkedKrCard({ canManage, link, impact, onEditLink, onUnlink }: LinkedKrCardProps) {
  const navigate = useNavigate();
  const strategyLabel = impactStrategyLabel(impact);

  return (
    <article className="rounded-md p-4" style={{ border: `1px solid ${link.overweightWarning ? "#FBBF24" : COLORS.border}`, backgroundColor: link.overweightWarning ? "#FFFBEB" : "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {strategyLabel && (
            <div className="mb-3">
              <p style={{ fontSize: 10, fontWeight: 950, color: COLORS.orange, textTransform: "uppercase" }}>Metas y Apuestas</p>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.orange, lineHeight: 1.35, marginTop: 4 }}>{strategyLabel}</h3>
            </div>
          )}
          <div className={strategyLabel ? "pl-4 border-l-2 border-[#E5E7EB]" : ""}>
            <p style={{ fontSize: 10, fontWeight: 950, color: COLORS.blue, textTransform: "uppercase" }}>KR {link.keyResultId}</p>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.blue, lineHeight: 1.35, marginTop: 4 }}>{link.keyResultDescription}</h3>
          </div>
        </div>
        <span className="shrink-0 rounded px-2 py-1" style={{ backgroundColor: link.active ? "#ECFDF5" : "#F3F4F6", color: link.active ? "#065F46" : "#6B7280", fontSize: 10, fontWeight: 900 }}>
          {link.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Peso" value={`${link.contributionWeight}%`} />
        <MiniStat label="Tipo" value={contributionTypeLabel[link.contributionType]} />
        <MiniStat label="Total KR" value={`${link.totalWeightForKeyResult}%`} />
      </div>
      {link.overweightWarning && <p style={{ fontSize: 11, color: "#92400E", marginTop: 10, fontWeight: 850 }}>La suma actual para este KR es {link.totalWeightForKeyResult}%.</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => navigate(`/krs?keyResultId=${link.keyResultId}`)} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
          Ir al KR
        </button>
        {canManage && (
          <button onClick={onEditLink} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
            Gestionar peso
          </button>
        )}
        {canManage && (
          <button onClick={onUnlink} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: "1px solid #FED7AA", color: COLORS.orange, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
            Desvincular
          </button>
        )}
      </div>
    </article>
  );
}

export function ImpactCard({ impact, projectProgress }: { impact: ImpactItem; projectProgress: number }) {
  const strategyLabel = impactStrategyLabel(impact);
  return (
    <article className="rounded-md bg-[#F8FAFC] p-4" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge color={COLORS.green}>La iniciativa está en {projectProgress}%</Badge>
        <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 900 }}>x</span>
        <Badge color={COLORS.blue}>Aporta al KR {impact.contributionWeight}%</Badge>
        <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 900 }}>=</span>
        <Badge color={COLORS.orange}>Aporte aplicado {impact.appliedContribution}%</Badge>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{strategyLabel || "Sin Meta ni Apuesta"}</h3>
      <p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.45, marginTop: 6 }}>{impact.keyResultDescription}</p>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 10, fontWeight: 800 }}>
        Periodo {impact.period ?? "Sin periodo"} - {impact.projectCompleted ? "Iniciativa finalizada" : "Cuenta al finalizar"}
      </p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-2 py-2" style={{ border: `1px solid ${COLORS.border}` }}>
      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 11, color: COLORS.text, fontWeight: 900, marginTop: 3 }}>{value}</p>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="rounded px-2 py-1" style={{ backgroundColor: `${color}18`, color, fontSize: 10, fontWeight: 900 }}>
      {children}
    </span>
  );
}
