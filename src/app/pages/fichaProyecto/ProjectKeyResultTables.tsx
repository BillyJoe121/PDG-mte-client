import { ExternalLink, Unlink } from "lucide-react";
import { useNavigate } from "react-router";
import { DETAIL_TABLE_CELL_CLASS, DetailBadge, DetailIconButton, DetailTable } from "../../components/DetailModal";
import { StrategyLinkNames } from "../../components/StrategyLinkNames";
import type { ImpactChain, ProjectKeyResultLinkResponse } from "../../services/projectsApi";

type ImpactItem = ImpactChain["impacts"][number];

const LINKED_COLUMNS = ["Key Result", "Metas y apuestas", "Estado", "Acciones"];
const IMPACT_COLUMNS = ["Metas y apuestas", "Key Result", "Periodo", "Iniciativa"];

function impactStrategyNames(impact?: Pick<ImpactItem, "goalNames" | "strategicBetNames">) {
  return impact ? [...(impact.goalNames ?? []), ...(impact.strategicBetNames ?? [])] : [];
}

/** Metas y Apuestas a las que aporta un KR dentro de la cadena de impacto. */
export function impactStrategyLabel(impact?: Pick<ImpactItem, "goalNames" | "strategicBetNames">) {
  return impactStrategyNames(impact).filter(Boolean).join(", ");
}

interface LinkedKeyResultsTableProps {
  canManage: boolean;
  chain?: ImpactChain | null;
  links: ProjectKeyResultLinkResponse[];
  onUnlink: (link: ProjectKeyResultLinkResponse) => void;
}

export function LinkedKeyResultsTable({ canManage, chain, links, onUnlink }: LinkedKeyResultsTableProps) {
  const navigate = useNavigate();

  return (
    <DetailTable label="Key Results vinculados a la iniciativa" columns={LINKED_COLUMNS}>
      {links.map((link) => (
        <tr key={link.id}>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[180px]`}>
            <span className="block text-[9px] font-extrabold uppercase tracking-wide text-gray-500">KR {link.keyResultId}</span>
            <span className="mt-0.5 block font-bold">{link.keyResultDescription}</span>
          </td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[140px]`}><StrategyLinkNames names={impactStrategyNames(chain?.impacts.find((impact) => impact.linkId === link.id))} empty="—" /></td>
          <td className={DETAIL_TABLE_CELL_CLASS}><DetailBadge>{link.active ? "Activo" : "Inactivo"}</DetailBadge></td>
          <td className={DETAIL_TABLE_CELL_CLASS}>
            <div className="flex gap-1">
              <DetailIconButton label="Ir al KR" onClick={() => navigate(`/krs?keyResultId=${link.keyResultId}`)}>
                <ExternalLink size={13} aria-hidden="true" />
              </DetailIconButton>
              {canManage && (
                <DetailIconButton label="Desvincular" onClick={() => onUnlink(link)}>
                  <Unlink size={13} aria-hidden="true" />
                </DetailIconButton>
              )}
            </div>
          </td>
        </tr>
      ))}
    </DetailTable>
  );
}

export function ImpactTable({ impacts }: { impacts: ImpactItem[] }) {
  return (
    <DetailTable label="Cadena de contribución de la iniciativa" columns={IMPACT_COLUMNS}>
      {impacts.map((impact) => (
        <tr key={impact.linkId}>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[160px]`}><StrategyLinkNames names={impactStrategyNames(impact)} empty="Sin Meta ni Apuesta" /></td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[160px]`}>{impact.keyResultDescription}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{impact.period ?? "Sin periodo"}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{impact.projectCompleted ? "Finalizada" : "En curso"}</td>
        </tr>
      ))}
    </DetailTable>
  );
}
