import { DetailField } from "../DetailModal";
import { normalizePlannerUrl, validatePlannerUrl } from "../../services/plannerService";
import { PlannerButton } from "./PlannerButton";

/** Planner row for the detail views: always shown, with an empty state when there is no valid link. */
export function PlannerLinkField({ plannerUrl }: { plannerUrl?: string | null }) {
  const url = normalizePlannerUrl(plannerUrl);
  const valid = url !== null && validatePlannerUrl(url) === null;
  return (
    <DetailField label="Enlace de Planner">
      {valid ? (
        <PlannerButton plannerUrl={url} variant="outline" />
      ) : (
        <span className="text-gray-500">Sin enlace de Planner</span>
      )}
    </DetailField>
  );
}
