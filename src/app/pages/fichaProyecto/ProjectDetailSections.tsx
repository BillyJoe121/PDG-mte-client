import {
  DETAIL_BUTTON_CLASS,
  DETAIL_TABLE_CELL_CLASS,
  DetailEmpty,
  DetailField,
  DetailFields,
  DetailNotice,
  DetailSection,
  DetailTable,
} from "../../components/DetailModal";
import type { ImpactChain, ProjectDetailResponse, ProjectKeyResultLinkResponse } from "../../services/projectsApi";
import { PlannerLinkField } from "../../components/planner/PlannerLinkField";
import { ImpactTable, LinkedKeyResultsTable } from "./ProjectKeyResultTables";
import { ProgressBar, formatDate } from "./projectDetailShared";

const NO_CHAIN_TEXT = "No hay vínculos activos en la cadena de contribución.";

export function SummarySection({
  chain,
  detail,
  progressColor,
  project,
}: {
  chain?: ImpactChain | null;
  detail: ProjectDetailResponse;
  progressColor: string;
  project: ProjectDetailResponse["project"];
}) {
  const latestEntry = detail.history.length
    ? [...detail.history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  return (
    <>
      {detail.kpis.overweightWarning && (
        <div className="px-5 py-4">
          <DetailNotice>La suma de pesos asociados supera el 100%. Revisa los Key Results vinculados para ajustar la contribución declarada.</DetailNotice>
        </div>
      )}

      <DetailSection
        title="Avance global"
        action={<span className="text-xs text-gray-500">{latestEntry ? `Último registro: ${formatDate(latestEntry.createdAt)}` : "Sin registros de avance todavía."}</span>}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[17px] font-bold leading-none text-[#111827]">{project.globalProgress}%</span>
          <div className="min-w-0 flex-1">
            <ProgressBar value={project.globalProgress} color={progressColor} />
          </div>
        </div>
        <DetailFields>
          <DetailField label="Registros de avance">{detail.kpis.progressEntries}</DetailField>
          <DetailField label="KRs vinculados">{detail.kpis.linkedKeyResults}</DetailField>
          <DetailField label="Peso declarado">{detail.kpis.declaredContributionWeight}%</DetailField>
          {latestEntry && <DetailField label="Último comentario">{latestEntry.comment}</DetailField>}
          <PlannerLinkField plannerUrl={project.plannerUrl} />
        </DetailFields>
      </DetailSection>

      <DetailSection title="Vínculos con KRs" hint="Pesos declarados en la cadena de contribución activa.">
        {!chain || chain.impacts.length === 0 ? (
          <DetailEmpty>{NO_CHAIN_TEXT}</DetailEmpty>
        ) : (
          <ImpactTable impacts={chain.impacts.slice(0, 4)} />
        )}
      </DetailSection>
    </>
  );
}

export function HistorySection({ history }: { history: ProjectDetailResponse["history"] }) {
  return (
    <DetailSection title="Historial de avances">
      {history.length === 0 ? (
        <DetailEmpty>No hay registros de avance para esta iniciativa.</DetailEmpty>
      ) : (
        <DetailTable label="Historial de avances de la iniciativa" columns={["Fecha", "Avance", "Comentario", "Hitos"]}>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap font-bold`}>{formatDate(entry.createdAt)}</td>
              <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{entry.progressPercent}%</td>
              <td className={DETAIL_TABLE_CELL_CLASS}>{entry.comment}</td>
              <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-pre-line`}>{entry.milestones || "—"}</td>
            </tr>
          ))}
        </DetailTable>
      )}
    </DetailSection>
  );
}

export function KeyResultsSection({
  canManageLinks,
  chain,
  detail,
  onLink,
  onEditLink,
  onUnlink,
}: {
  canManageLinks: boolean;
  chain?: ImpactChain | null;
  detail: ProjectDetailResponse;
  onLink: () => void;
  onEditLink: (link: ProjectKeyResultLinkResponse) => void;
  onUnlink: (link: ProjectKeyResultLinkResponse) => void;
}) {
  return (
    <>
      <DetailSection
        title="Key Results vinculados"
        action={canManageLinks ? <button type="button" onClick={onLink} className={DETAIL_BUTTON_CLASS}>Vincular KR</button> : undefined}
      >
        {detail.linkedKeyResults.length === 0 ? (
          <DetailEmpty>Esta iniciativa aún no tiene Key Results vinculados.</DetailEmpty>
        ) : (
          <LinkedKeyResultsTable canManage={canManageLinks} chain={chain} links={detail.linkedKeyResults} onEditLink={onEditLink} onUnlink={onUnlink} />
        )}
      </DetailSection>

      <DetailSection title="Cadena de contribución">
        {!chain || chain.impacts.length === 0 ? (
          <DetailEmpty>{NO_CHAIN_TEXT}</DetailEmpty>
        ) : (
          <ImpactTable impacts={chain.impacts} />
        )}
      </DetailSection>
    </>
  );
}
