import type { KeyResultStatus } from "../../services/strategicApi";

/** Order in which key result statuses are listed across the dashboard. */
export const KEY_RESULT_STATUS_ORDER: KeyResultStatus[] = ["BORRADOR", "ACTIVO", "CERRADO"];

export const keyResultStatusLabel: Record<KeyResultStatus, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activos",
  CERRADO: "Cerrados",
};

export const keyResultStatusColor: Record<KeyResultStatus, string> = {
  BORRADOR: "#717182",
  ACTIVO: "#5454E9",
  CERRADO: "#4CB979",
};

/** Count fields returned per department, bet or goal, keyed by the status they count. */
export const keyResultStatusCountField = {
  BORRADOR: "draftKeyResults",
  ACTIVO: "activeKeyResults",
  CERRADO: "closedKeyResults",
} as const satisfies Record<KeyResultStatus, string>;

export type KeyResultStatusCountKey = (typeof keyResultStatusCountField)[KeyResultStatus];
