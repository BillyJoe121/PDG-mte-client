import { DEPARTAMENTOS } from "../../data/mockData";
import type { Department } from "../../services/strategicApi";
import type { ContributionType } from "../../services/projectsApi";

export const COLORS = {
  blue: "#5454E9",
  purple: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: "DIRECTA", label: "Directa" },
  { value: "INDIRECTA", label: "Indirecta" },
  { value: "SOPORTE", label: "Soporte" },
];

export const fallbackDepartments: Department[] = DEPARTAMENTOS.map((name, index) => ({ id: index + 1, name }));
