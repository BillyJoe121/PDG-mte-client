import { getSessionAccessToken } from "./authToken";
import type { ApiResponseDto } from "../contracts/v2/common/ApiResponseDto";
import type { StrategicCycleDto, StrategicCycleWriteDto } from "../contracts/v2/strategy/StrategicCycleDto";
import type { MetricDefinitionDto, MetricDefinitionWriteDto } from "../contracts/v2/strategy/MetricDefinitionDto";

const configuredBase = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";
const base = configuredBase.replace(/\/$/, "").replace(/\/v[12]$/, "/v2");
const messages: Record<string, string> = {
  FINAL_SNAPSHOT_STALE: "La definición, medición o avance cambió después de la revisión final. Genera y aprueba un nuevo corte antes de cerrar.",
  CYCLE_SCOPE_INCOMPLETE: "Revisa los KRs del ciclo: todos los activos deben estar formulados, activados y asociados a una escuela antes del cierre.",
  RETROSPECTIVE_REQUIRED: "Completa logros, causas, aprendizajes y continuidad de la retrospectiva.",
  INVALID_REPORT_SELECTION: "Selecciona los informes finales que sustentan el cierre, sin repetirlos.",
  CYCLE_ALREADY_CLOSED: "El ciclo ya fue cerrado. Actualiza para consultar su retrospectiva y capturas.",
  INVALID_APPROVAL_MATRIX: "Completa reglas distintas por estado y ciclo, roles aprobadores y autoaprobación según la decisión institucional.",
  APPROVAL_REQUIRED: "Este cambio requiere el flujo de solicitudes. Consulta las solicitudes de cambio del KR.",
  SELF_APPROVAL_FORBIDDEN: "La matriz exige que solicite y apruebe una persona distinta.",
  POLICY_CHANGED: "La matriz cambió. Cancela la solicitud anterior y registra otra con la decisión vigente.",
  REQUEST_ALREADY_DECIDED: "Esta solicitud ya tiene una decisión. Actualiza para consultarla.",
  SAME_DEFINITION: "La propuesta coincide con la definición vigente.",
  CHECK_IN_NOT_FOUND: "El check-in no existe o no pertenece a este KR.",
  INVALID_REPORT_FORMAT: "Indica una plantilla y selecciona sus secciones obligatorias sin duplicados.",
  INVALID_REPORT_RECIPIENTS: "Indica entre 1 y 100 destinatarios distintos, de hasta 255 caracteres cada uno.",
  INVALID_PAGINATION: "La página solicitada no es válida. Actualiza la consulta.",
  CUT_EMPTY: "No hay KRs activos del ciclo en esta Escuela para capturar.",
  CONSISTENCY_TOO_LARGE: "El ámbito supera 1000 KRs, 1000 iniciativas o 2000 referencias. Filtra por departamento para completar la revisión.",
  BRANCH_INCOMPLETE: "Las cuatro ramas deben entregar resultados completos antes de generar el informe final.",
  IDEMPOTENCY_CONFLICT: "Esta solicitud ya fue registrada con otro contenido. Actualiza las versiones antes de continuar.",
  DEPARTMENT_SCOPE_NOT_CAPTURED: "Revalida el corte para capturar sus departamentos antes de abrir las ramas.",
  DEPARTMENT_ENTRY_CHANGED: "Hay una observación departamental más reciente. Actualiza las entregas y revísala antes de confirmar.",
  DEPARTMENT_ALREADY_SUBMITTED: "Esta observación ya fue entregada. Consulta el resultado registrado.",
  SNAPSHOT_UNAVAILABLE: "La captura no está disponible o tiene un formato incompatible.",
  SNAPSHOT_SCOPE_UNAVAILABLE: "Este corte antiguo no capturó departamentos suficientes para aplicar tu ámbito o filtro. Requiere conciliación histórica.",
  CUT_NOT_READY: "Revisa los KRs activos de la Escuela: ficha, valores, responsable, unidad y mínimos de vínculos deben ser válidos.",
  CUT_NOT_VALIDATED: "Valida el corte antes de abrir sus ramas.",
  CUT_VALIDATION_STALE: "La política cambió después de la validación. Revalida el corte antes de abrir sus ramas.",
  SNAPSHOT_TOO_LARGE: "La captura supera su límite: 1000 KRs, 1000 iniciativas o 2000 referencias de tareas.",
  ALREADY_CONSOLIDATED: "Este corte ya tiene sus cuatro ramas. Actualiza para consultarlas.",
  BRANCH_NOT_OPEN: "La rama ya fue revisada o cerrada. Consulta su historial actualizado.",
  INVALID_SITUATION: "Revisa el título, descripción, severidad y destino de las situaciones.",
  POLICY_UNSET: "Falta registrar la política institucional requerida. Consulta Políticas institucionales.",
  APPROVED_REVIEW_REQUIRED: "FIN exige la última revisión aprobada de la versión vigente. Actualiza el informe y sus revisiones.",
  EVIDENCE_REQUIRED: "Añade al menos un enlace de soporte para la revisión.",
  COMMENT_REQUIRED: "Añade el comentario de la revisión.",
  INVALID_POLICY: "La política registrada tiene un formato inválido. Administración debe revisar la decisión.",
  INVALID_POLICY_MINIMUMS: "Indica ambos mínimos como enteros entre 0 y 100.",
  POLICY_CONFIRMATION_REQUIRED: "Confirma que los mínimos corresponden a una decisión institucional aprobada.",
  POLICY_MINIMUM_NOT_MET: "La desvinculación dejaría al KR por debajo de los mínimos institucionales vigentes.",
  KR_NOT_READY: "El KR aún tiene requisitos pendientes. Revisa su ficha y los requisitos de activación.",
  KR_DEFINITION_INCOMPLETE: "Completa la ficha, valores, responsable activo y ciclo antes de activar el KR.",
  INVALID_TRANSITION: "La transición no es válida para el estado actual. Actualiza la información.",
  RESOLUTION_EVIDENCE_REQUIRED: "Añade una referencia de evidencia para resolver o cerrar la situación.",
  CORRECTIVE_ORIGIN_REQUIRED: "Las acciones correctivas requieren una situación de monitoreo departamental.",
  CORRECTIVE_ACTIONS_PENDING: "Completa o cancela con motivo las acciones correctivas pendientes antes de resolver la situación.",
  INVALID_CORRECTIVE_ACTION: "Selecciona un responsable y una fecha límite que no sea anterior a hoy.",
  CONFIRMATION_REQUIRED: "Confirma la operación antes de continuar.",
  INVALID_TYPE: "Selecciona un tipo de KR válido.", SAME_TYPE: "El KR ya tiene ese tipo.",
  DUPLICATE_LINK: "Este vínculo ya está vigente.", SAME_RESPONSIBLE: "Este profesor ya es el responsable vigente.",
  POLICY_REVIEW_REQUIRED: "La desvinculación de un KR activo requiere evaluar los mínimos institucionales aprobados. Esa operación aún no está habilitada.",
  INVALID_EXECUTION_DATE: "Indica una fecha de ejecución que no sea futura.", SUMMARY_REQUIRED: "Describe el trabajo realizado.",
  INVALID_EVIDENCE: "Selecciona un tipo válido y un título de hasta 255 caracteres.",
  INVALID_EVIDENCE_URL: "Usa un enlace completo http:// o https:// sin credenciales en la dirección.",
  INVALID_EVIDENCE_HASH: "El SHA-256 debe contener exactamente 64 caracteres hexadecimales.",
  INVALID_DATE_RANGE: "La fecha final debe ser igual o posterior al inicio.", INVALID_CADENCE: "La cadencia debe ser un número entero positivo.",
  INVALID_FREQUENCY: "Indica una frecuencia de medición positiva.", INVALID_PERIOD: "Uno de los periodos ya no está activo. Actualiza la pantalla.",
  INVALID_UNIT: "Selecciona una unidad de medida activa.", DUPLICATE_NAME: "Ya existe un registro con ese nombre.",
  VERSION_CONFLICT: "Otra persona modificó el registro. Actualiza y revisa los cambios antes de guardar.",
  FINAL_REVIEW_REQUIRED: "El cierre requiere la revisión final del ciclo.", CYCLE_CLOSED: "El ciclo está cerrado y no admite cambios.",
  ACTIVE_DEPENDENTS: "Hay KRs activos que utilizan esta ficha. No se puede desactivar.",
  SOURCE_REQUIRED: "La fuente de medición es obligatoria.", NAME_REQUIRED: "El nombre es obligatorio.",
  OUT_OF_SCOPE: "El registro no está disponible en tu ámbito.", INVALID_PROGRESS: "El avance debe estar entre 0 y 100.",
  INVALID_RESPONSIBLE: "Selecciona un responsable activo del departamento.", INACTIVE_RESOURCE: "El registro está inactivo o cerrado.",
  PROFILE_REQUIRED: "Tu sesión no está vinculada a un profesor activo. Solicita la vinculación a administración.",
  INVALID_METRIC: "Selecciona una ficha métrica activa y con unidad activa.", INVALID_CYCLE: "Selecciona un ciclo que no esté cerrado.",
  INVALID_METRIC_VALUE: "Revisa los valores: deben respetar el rango y la precisión de la unidad de medida.",
  REASON_REQUIRED: "Indica el motivo del cambio.", VERSION_REQUIRED: "Falta la versión del registro. Actualiza antes de guardar.",
  IDEMPOTENCY_KEY_REUSED: "La solicitud cambió desde el intento anterior. Vuelve a enviar el formulario.",
};
export class V2ApiError extends Error {
  constructor(public status: number, public code: string, public traceId?: string) {
    super(messages[code] ?? (status === 403 ? "No tienes permiso para esta operación." : status === 401 ? "La sesión venció. Vuelve a iniciar sesión." : status === 404 ? "El recurso no está disponible." : "No se pudo completar la operación. Intenta nuevamente."));
  }
}
async function v2Response<T>(path: string, options: RequestInit, decode: (response: Response) => Promise<T>): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getSessionAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15000);
  try {
    const response = await fetch(`${base}${path}`, { ...options, headers, cache: "no-store", credentials: "omit", signal: options.signal ?? timeout.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new V2ApiError(response.status, body.error ?? body.message ?? "REQUEST_FAILED", body.traceId);
    }
    return await decode(response);
  } catch (error) {
    if (error instanceof V2ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("La consulta tardó demasiado. Puedes volver a intentar.");
    throw new Error("No hay conexión con el servidor. Revisa la conexión y vuelve a intentar.");
  } finally { clearTimeout(timer); }
}
export const v2Request = <T>(path: string, options: RequestInit = {}) => v2Response<T>(path,options,async response => { const body: ApiResponseDto<T> = await response.json();return body.data; });
export const v2Download = (path: string) => v2Response<Blob>(path,{},response=>response.blob());
export const governanceApi = {
  cycles: () => v2Request<StrategicCycleDto[]>("/cycles"),
  saveCycle: (body: StrategicCycleWriteDto & { version?: number }, id?: number) => v2Request<StrategicCycleDto>(id ? `/cycles/${id}` : "/cycles", { method: id ? "PUT" : "POST", body: JSON.stringify(body) }),
  metrics: () => v2Request<MetricDefinitionDto[]>("/metric-definitions"),
  saveMetric: (body: MetricDefinitionWriteDto & { version?: number }, id?: number) => v2Request<MetricDefinitionDto>(id ? `/metric-definitions/${id}` : "/metric-definitions", { method: id ? "PUT" : "POST", body: JSON.stringify(body) }),
};
