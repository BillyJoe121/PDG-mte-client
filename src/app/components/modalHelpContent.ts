import type { ModalHelpContent } from "./ModalHelp";

/** Help shown by the help button of each modal: what can be done there and what each action causes. */
export const MODAL_HELP = {
  keyResultDetail: {
    purpose: "Consulta el Key Result, registra su avance y gestiona su estado. Solo ves las acciones que tu rol permite.",
    actions: [
      { label: "Ver en Meta / Ver en Apuesta", effect: "Abre la jerarquía filtrada en la Meta o Apuesta a la que pertenece este KR." },
      { label: "Vincular iniciativas", effect: "Elige qué iniciativas aportan a este KR. No cambia el avance por sí solo." },
      { label: "Activar KR", effect: "Pasa el KR de Borrador a Activo. Desde ese momento puede recibir avances." },
      { label: "Cerrar KR", effect: "Pasa el KR de Activo a Cerrado y lo cuenta como terminado, aunque no haya llegado al 100 %. Bloquea la edición y el registro de avance. No se puede reabrir desde la aplicación." },
      { label: "Editar KR", effect: "Cambia nombre, descripción, métrica, valores, unidad, periodo y vínculos con Metas y Apuestas." },
      { label: "Archivar", effect: "Oculta el KR del listado, la jerarquía y los reportes, y bloquea sus cambios. Conserva su estado (por ejemplo, Activo) y su historial. Solo se permite si no tiene iniciativas vinculadas." },
      { label: "Restaurar", effect: "Devuelve un KR archivado a los listados con el estado que tenía." },
      { label: "Registrar avance", effect: "Guarda un nuevo valor actual. Recalcula el porcentaje y queda en el historial." },
    ],
    note: "Cerrar es definitivo; archivar es reversible. Si solo quieres sacar el KR de la vista, archívalo.",
  },
  initiativeDetail: {
    purpose: "Consulta la iniciativa, su historial de avance y los Key Results a los que aporta. Solo ves las acciones que tu rol permite.",
    actions: [
      { label: "Resumen / Historial / Key Results", effect: "Cambian la sección que ves. No modifican nada." },
      { label: "Ver en Meta / Ver en Apuesta", effect: "Abre la jerarquía filtrada en la Meta o Apuesta relacionada." },
      { label: "Vincular KR", effect: "Asocia la iniciativa a un Key Result. El avance de la iniciativa no cambia el del KR." },
      { label: "Estado", effect: "Cambia el estado de la iniciativa. Finalizado no admite más cambios de estado; Suspendido se puede reactivar." },
      { label: "Responsables", effect: "Define quiénes responden por la iniciativa." },
      { label: "Editar iniciativa", effect: "Cambia nombre, descripción, tipo, departamento, periodos, fechas y tutores." },
      { label: "Registrar avance", effect: "Guarda un avance de la iniciativa; aparece en Historial. Solo está disponible cuando la iniciativa está Activa." },
    ],
  },
  keyResultCreate: {
    purpose: "Crea un Key Result nuevo. Los campos marcados son obligatorios.",
    actions: [
      { label: "Valor base y valor meta", effect: "Definen desde dónde parte el KR y a qué valor debe llegar; el avance se calcula entre ambos." },
      { label: "Metas y Apuestas", effect: "Ubican el KR en la jerarquía estratégica." },
      { label: "Guardar", effect: "Crea el KR. Después podrás vincularle iniciativas desde su detalle." },
      { label: "Cancelar", effect: "Cierra sin crear nada." },
    ],
  },
  initiativeCreate: {
    purpose: "Registra una iniciativa nueva y los Key Results a los que aporta.",
    actions: [
      { label: "Campos obligatorios", effect: "Nombre, descripción, departamento, tutores, periodo de inicio y al menos un Key Result." },
      { label: "Key Results", effect: "Cada vínculo indica a qué KR aporta la iniciativa." },
      { label: "Crear Iniciativa", effect: "Crea la iniciativa con sus vínculos." },
      { label: "Cancelar", effect: "Cierra sin crear nada." },
    ],
  },
  keyResultLink: {
    purpose: "Gestiona a qué Key Results aporta esta iniciativa.",
    actions: [
      { label: "Guardar vínculo", effect: "Crea el vínculo con el KR elegido." },
      { label: "Desvincular", effect: "Desactiva el vínculo después de confirmarlo. La iniciativa deja de aportar a ese KR." },
    ],
  },
  betForm: {
    purpose: "Crea o edita una Apuesta Estratégica.",
    actions: [
      { label: "Nombre y descripción", effect: "Obligatorios. Se muestran en la jerarquía y en los reportes." },
      { label: "Fecha inicio / Fecha cierre", effect: "Opcionales. La fecha de cierre no puede ser anterior a la de inicio." },
      { label: "Crear Apuesta / Guardar cambios", effect: "Guarda la Apuesta." },
      { label: "Cancelar", effect: "Cierra sin guardar." },
    ],
  },
  goalForm: {
    purpose: "Crea o edita una Meta Institucional.",
    actions: [
      { label: "Nombre y descripción", effect: "Obligatorios. Se muestran en la jerarquía y en los reportes." },
      { label: "Indicador, Valor y Unidad", effect: "Obligatorios. Describen qué mide la Meta y el valor esperado." },
      { label: "Crear Meta / Guardar cambios", effect: "Guarda la Meta." },
      { label: "Cancelar", effect: "Cierra sin guardar." },
    ],
  },
  archivedStrategy: {
    purpose: "Lista las Apuestas y Metas archivadas.",
    actions: [
      { label: "Restaurar", effect: "Devuelve el elemento a la jerarquía con sus relaciones e historial. Requiere permiso para gestionar la estrategia." },
    ],
  },
  userForm: {
    purpose: "Crea o edita un usuario.",
    actions: [
      { label: "Rol de acceso", effect: "Define qué pantallas y acciones tiene disponibles." },
      { label: "Departamento", effect: "Asocia al usuario con su unidad." },
      { label: "Guardar", effect: "Guarda los datos. Para que un usuario nuevo entre, genera su enlace de acceso desde el listado." },
      { label: "Cancelar", effect: "Cierra sin guardar." },
    ],
  },
  departmentForm: {
    purpose: "Crea o edita un departamento.",
    actions: [
      { label: "Nombre", effect: "Obligatorio. Es el que se ve en usuarios e iniciativas." },
      { label: "Descripción, Escuela, ID externo", effect: "Datos de referencia del departamento." },
      { label: "Guardar", effect: "Guarda el departamento." },
      { label: "Cancelar", effect: "Cierra sin guardar." },
    ],
  },
  changePassword: {
    purpose: "Cambia tu contraseña.",
    actions: [
      { label: "Contraseña actual", effect: "Confirma que eres tú." },
      { label: "Nueva contraseña y confirmación", effect: "Deben coincidir." },
      { label: "Guardar contraseña", effect: "Reemplaza la contraseña; la anterior deja de servir." },
    ],
  },
  accessLink: {
    purpose: "Muestra el enlace para que el usuario defina su contraseña.",
    actions: [
      { label: "Copiar", effect: "Copia el enlace al portapapeles para que lo envíes tú. El sistema no envía correos." },
    ],
    note: "El enlace sirve una sola vez y vence. Si caduca, genera otro desde el listado de usuarios.",
  },
  auditEvent: {
    purpose: "Muestra un evento del registro de auditoría. Es solo de consulta.",
    actions: [
      { label: "Estado anterior / Estado posterior", effect: "Muestran los datos antes y después del cambio." },
    ],
  },
  presentationDetail: {
    purpose: "Ficha técnica del elemento seleccionado. Es solo de consulta.",
    actions: [
      { label: "Exportar PDF", effect: "Descarga la ficha técnica en PDF." },
      { label: "Descargar CSV", effect: "Descarga los datos de la ficha en CSV." },
      { label: "Ir a la gestión detallada", effect: "Abre la pantalla de gestión donde se puede editar el elemento." },
      { label: "Cerrar", effect: "Vuelve a la presentación." },
    ],
  },
} satisfies Record<string, ModalHelpContent>;
