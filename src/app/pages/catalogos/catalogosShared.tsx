import { ApiError, type MeasurementUnitRequest, type MeasurementUnitType, type PeriodStatus, type AcademicPeriodRequest } from "../../services/catalogsApi";

export const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  black: "#000",
  gray: "#717182",
};

export type CatalogosTab = "periodos" | "unidades";

export type PeriodForm = AcademicPeriodRequest;
export type UnitForm = MeasurementUnitRequest;

export const periodStatusLabel: Record<PeriodStatus, string> = {
  ACTIVO: "Activo",
  CERRADO: "Cerrado",
  PLANIFICACION: "Planificacion",
};

export const unitTypeLabel: Record<MeasurementUnitType, string> = {
  NUMERICA: "Numerica",
  PORCENTAJE: "Porcentaje",
  BOOLEANA: "Booleana",
  OTRA: "Otra",
};

export const emptyPeriodForm: PeriodForm = {
  name: "",
  startDate: "",
  endDate: "",
  status: "PLANIFICACION",
};

export const emptyUnitForm: UnitForm = {
  name: "",
  type: "NUMERICA",
  description: "",
};

export function PeriodBadge({ status }: { status: PeriodStatus }) {
  const map: Record<PeriodStatus, { bg: string; color: string }> = {
    ACTIVO: { bg: "#ECFDF5", color: "#065F46" },
    CERRADO: { bg: "#F3F4F6", color: "#374151" },
    PLANIFICACION: { bg: "#EEF2FF", color: "#3730A3" },
  };
  const style = map[status];
  return (
    <span
      className="px-2 py-1 rounded"
      style={{ backgroundColor: style.bg, color: style.color, fontSize: "11px", fontWeight: 800 }}
    >
      {periodStatusLabel[status]}
    </span>
  );
}

export function UnitBadge({ active }: { active: boolean }) {
  return (
    <span
      className="px-2 py-1 rounded"
      style={{
        backgroundColor: active ? "#ECFDF5" : "#F3F4F6",
        color: active ? "#065F46" : "#6B7280",
        fontSize: "11px",
        fontWeight: 800,
      }}
    >
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrio un error inesperado.";
}
