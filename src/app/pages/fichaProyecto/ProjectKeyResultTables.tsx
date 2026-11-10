import { ExternalLink, Scale, Unlink } from "lucide-react";
import { useNavigate } from "react-router";
import { DETAIL_TABLE_CELL_CLASS, DetailBadge, DetailIconButton, DetailTable } from "../../components/DetailModal";
import {
  contributionTypeLabel,
  type ImpactChain,
  type ProjectKeyResultLinkResponse,
} from "../../services/projectsApi";

type ImpactItem = ImpactChain["impacts"][number];

const LINKED_COLUMNS = ["Key Result", "Metas y apuestas", "Peso declarado", "Tipo", "Suma en el KR", "Estado", "Acciones"];
const IMPACT_COLUMNS = ["Metas y apuestas", "Key Result", "Peso", "Tipo", "Periodo", "Iniciativa"];

/** Metas y Apuestas a las que aporta un KR dentro de la cadena de impacto. */
export function impactStrategyLabel(impact?: Pick<ImpactItem, "goalNames" | "strategicBetNames">) {
  if (!impact) return "";
  return [...(impact.goalNames ?? []), ...(impact.strategicBetNames ?? [])].filter(Boolean).join(", ");
}

interface LinkedKeyResultsTableProps {
  canManage: boolean;
  chain?: ImpactChain | null;
  links: ProjectKeyResultLinkResponse[];
  onEditLink: (link: ProjectKeyResultLinkResponse) => void;
  onUnlink: (link: ProjectKeyResultLinkResponse) => void;
}

export function LinkedKeyResultsTable({ canManage, chain, links, onEditLink, onUnlink }: LinkedKeyResultsTableProps) {
  const navigate = useNavigate();

  return (
    <DetailTable label="Key Results vinculados a la iniciativa" columns={LINKED_COLUMNS}>
      {links.map((link) => (
        <tr key={link.id}>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[180px]`}>
            <span className="block text-[9px] font-extrabold uppercase tracking-wide text-gray-500">KR {link.keyResultId}</span>
            <span className="mt-0.5 block font-bold">{link.keyResultDescription}</span>
            {link.overweightWarning && (
              <span className="mt-1 block font-bold text-amber-800">Los pesos declarados para este KR suman {link.totalWeightForKeyResult}%, más de 100 %.</span>
            )}
          </td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[140px]`}>{impactStrategyLabel(chain?.impacts.find((impact) => impact.linkId === link.id)) || "—"}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{link.contributionWeight}%</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{contributionTypeLabel[link.contributionType]}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{link.totalWeightForKeyResult}%</td>
          <td className={DETAIL_TABLE_CELL_CLASS}><DetailBadge>{link.active ? "Activo" : "Inactivo"}</DetailBadge></td>
          <td className={DETAIL_TABLE_CELL_CLASS}>
            <div className="flex gap-1">
              <DetailIconButton label="Ir al KR" onClick={() => navigate(`/krs?keyResultId=${link.keyResultId}`)}>
                <ExternalLink size={13} aria-hidden="true" />
              </DetailIconButton>
              {canManage && (
                <>
                  <DetailIconButton label="Gestionar peso" onClick={() => onEditLink(link)}>
                    <Scale size={13} aria-hidden="true" />
                  </DetailIconButton>
                  <DetailIconButton label="Desvincular" onClick={() => onUnlink(link)}>
                    <Unlink size={13} aria-hidden="true" />
                  </DetailIconButton>
                </>
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
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[160px] font-bold`}>{impactStrategyLabel(impact) || "Sin Meta ni Apuesta"}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[160px]`}>{impact.keyResultDescription}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{impact.contributionWeight}%</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{contributionTypeLabel[impact.contributionType]}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{impact.period ?? "Sin periodo"}</td>
          <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{impact.projectCompleted ? "Finalizada" : "En curso"}</td>
        </tr>
      ))}
    </DetailTable>
  );
}
