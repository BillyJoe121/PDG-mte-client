import { ExternalLink } from "lucide-react";
import { DetailField } from "../DetailModal";
import { normalizePlannerUrl, validatePlannerUrl } from "../../services/plannerService";

/**
 * Planner row for the detail views: always shown. A valid link is a real anchor that shows the
 * address and opens it in a new tab; otherwise the row says there is none, or that the saved one is invalid.
 */
export function PlannerLinkField({ plannerUrl, tourId }: { plannerUrl?: string | null; tourId?: string }) {
  const url = normalizePlannerUrl(plannerUrl);
  const valid = url !== null && validatePlannerUrl(url) === null;
  return (
    <DetailField label="Enlace de Planner" tourId={tourId}>
      {valid ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir el plan en Microsoft Planner (se abre en una pestaña nueva): ${url}`}
          className="inline-flex max-w-full items-start gap-1.5 rounded font-bold text-[#5454E9] underline underline-offset-2 hover:text-[#3F3FC4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5454E9]"
          style={{ overflowWrap: "anywhere" }}
        >
          <ExternalLink size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{url}</span>
        </a>
      ) : url ? (
        <span className="text-gray-500">El enlace guardado no es un enlace válido de Planner.</span>
      ) : (
        <span className="text-gray-500">Sin enlace de Planner</span>
      )}
    </DetailField>
  );
}
