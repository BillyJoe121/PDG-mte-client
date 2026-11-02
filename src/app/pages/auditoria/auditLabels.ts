import type { AuditAction } from "../../services/auditApi";

/** Every action the API can record, with the label shown in the audit screen. */
export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Creación",
  DELETE: "Eliminación",
  UPDATE: "Actualización",
  STATUS_CHANGE: "Cambio de estado",
  PROGRESS_REGISTERED: "Registro de avance",
  LINK_CREATED: "Vinculación",
  LINK_REMOVED: "Desvinculación",
  EXTERNAL_SYNC: "Sincronización externa",
  ACCOUNT_LOCKED: "Cuenta bloqueada",
  ACCESS_LINK_CREATED: "Enlace de acceso generado",
  PASSWORD_CHANGED: "Contraseña cambiada",
  PASSWORD_SET: "Contraseña establecida",
};

/** Every entity type the API records today, keyed by the exact string it stores. */
export const ENTITY_LABELS: Record<string, string> = {
  ACADEMIC_PERIOD: "Periodo académico",
  DEPARTMENT: "Departamento",
  DIRECTORY_USER: "Usuario del directorio",
  GOAL: "Meta institucional",
  KEY_RESULT: "Resultado clave",
  MEASUREMENT_UNIT: "Unidad de medida",
  POSITION: "Cargo",
  PROFESSOR: "Profesor",
  PROJECT: "Iniciativa",
  PROJECT_KEY_RESULT_LINK: "Vínculo iniciativa–KR",
  PROJECT_SYNC: "Sincronización de iniciativas",
  PROJECT_TEACHER: "Profesor de iniciativa",
  ROLE: "Rol",
  SCHOOL: "Escuela",
  STRATEGIC_BET: "Apuesta estratégica",
  TEACHER_POSITION: "Cargo de profesor",
  WORLD: "Mundo",
};

export const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value: value as AuditAction, label }));

export const ENTITY_OPTIONS = Object.entries(ENTITY_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));

const hasOwn = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key);

/** Label for an action; values the client does not know yet are shown as received. */
export function labelAction(value: string) {
  return hasOwn(ACTION_LABELS, value) ? ACTION_LABELS[value as AuditAction] : value;
}

/** Label for an entity type; values the client does not know yet are shown as received. */
export function labelEntity(value: string) {
  return hasOwn(ENTITY_LABELS, value) ? ENTITY_LABELS[value] : value;
}
