ÉPICA 1: Gestión de la jerarquía estratégica
Como directivo de la Escuela TDI, quiero registrar y estructurar las apuestas estratégicas, las metas de la Universidad, y los OKRs de la Facultad y la Escuela, para contar con una estrategia de desarrollo de proyectos verificable que sirva de base para la trazabilidad institucional.
ÉPICA 2: Gestión de proyectos e iniciativas
Como jefe del DCSI, quiero registrar los proyectos e iniciativas del Departamento y vincularlos explícitamente a los OKRs de la Escuela, para que cada proyecto tenga una trazabilidad formal hacia la estrategia de la Universidad.
ÉPICA 3: Visualización de impacto estratégico
Como director de la Escuela TDI o jefe de Departamento, quiero consultar tableros de control y generar reportes que muestren el avance e impacto agregado de los proyectos frente a los OKRs y en general a la estrategia de la Universidad, para poder divulgar y hacer seguimiento con evidencia objetiva de la contribución de la Escuela a la estrategia institucional.
ÉPICA 4: Control de acceso y roles institucionales
Como administrador del sistema, quiero gestionar usuarios con roles diferenciados (director de la Escuela o jefe de Departamento o Profesor), para que cada actor acceda únicamente a la información y acciones correspondientes a su nivel institucional.













HUs:
HU-1.1 — Registrar apuesta estratégica
Como director de la Escuela TDI,
quiero crear una apuesta estratégica con nombre, descripción, periodo de vigencia y área institucional a la que pertenece,
para establecer el nodo raíz de la cadena de trazabilidad institucional.
Criterios de aceptación:
El sistema permite crear una apuesta con: nombre (obligatorio), descripción, fecha de inicio y fecha de cierre, y estado (activa/inactiva)
Una apuesta no puede guardarse sin nombre y periodo de vigencia
El sistema muestra lista de apuestas ordenadas por estado y periodo
Solo usuarios con rol Director pueden crear o editar apuestas estratégicas
El sistema registra fecha y usuario de creación/modificación

HU-1.2 — Editar y desactivar apuesta estratégica
Como director de la Escuela TDI,
quiero editar los datos de una apuesta estratégica o marcarla como inactiva,
para mantener actualizada la jerarquía cuando la estrategia institucional cambia de periodo.
Criterios de aceptación:
El sistema permite editar todos los campos de una apuesta existente
Al desactivar una apuesta, los OKRs vinculados quedan en estado "huérfano" y el sistema lo notifica
No es posible eliminar una apuesta que tenga OKRs o proyectos vinculados; solo desactivarla
El historial de cambios queda registrado con fecha y usuario

HU-1.3 — Registrar meta institucional
Como director de la Escuela TDI,
quiero crear metas institucionales de la Universidad y vincularlas a una apuesta estratégica,
para descomponer la apuesta en compromisos concretos y medibles de la Facultad.
Criterios de aceptación:
Una meta tiene: nombre, descripción, métrica de referencia (indicador cuantitativo), valor esperado, unidad de medida y periodo
Cada meta debe estar vinculada a al menos una apuesta estratégica para poder guardarse
El sistema permite vincular una meta a múltiples apuestas si aplica
Las metas se listan filtradas por apuesta estratégica

HU-1.4 — Registrar OKR
Como director de la Escuela TDI o jefe de Departamento,
quiero crear un OKR con su objetivo cualitativo y sus resultados clave cuantificables, vinculándolo a una meta institucional,
para operacionalizar los compromisos estratégicos en objetivos medibles del periodo académico.
Criterios de aceptación:
Un OKR tiene: objetivo (cualitativo, texto), entre 2 y 5 resultados clave (KR), cada KR con métrica, valor base, valor objetivo y unidad de medida
El OKR debe estar vinculado a al menos una meta institucional
El sistema calcula automáticamente el % de cumplimiento del OKR como promedio del avance de sus KRs
El OKR tiene estado: borrador, activo, completado, cancelado
El sistema valida que los KRs tengan valores numéricos coherentes (valor actual no puede superar el objetivo sin confirmación)

HU-1.5 — Actualizar avance de resultados clave (KRs)
Como jefe de Departamento,
quiero registrar el avance periódico de cada resultado clave de un OKR,
para mantener actualizado el porcentaje de cumplimiento del OKR durante el ciclo académico.
Criterios de aceptación:
El sistema permite ingresar el valor actual de cada KR en cualquier momento del periodo
Al guardar un nuevo valor, el sistema recalcula automáticamente el % de cumplimiento del OKR
El sistema conserva el historial de valores registrados con fecha y usuario para cada KR
El % de cumplimiento se refleja automáticamente en los dashboards vinculados
Si el valor actual supera el objetivo, el sistema lo marca como "superado" (no como error)

HU-1.6 — Definir rúbrica de evaluación de iniciativas
Como director de la Escuela TDI,
quiero configurar una rúbrica de evaluación por OKR que defina los criterios y pesos con los que se medirá el aporte de cada proyecto vinculado,
para que la contribución de las iniciativas no sea solo declarativa sino evaluable con criterios explícitos y verificables.
Criterios de aceptación:
La rúbrica se asocia a un OKR específico y contiene entre 1 y 6 criterios de evaluación
Cada criterio tiene: nombre, descripción, peso porcentual (la suma de pesos debe ser 100%)
Cada criterio tiene una escala de valoración configurable (ej: 0-1-2-3 o 0%-25%-50%-75%-100%)
El sistema no permite guardar una rúbrica si los pesos no suman 100%
La rúbrica es reutilizable: puede copiarse de un OKR a otro del mismo periodo

HU-1.7 — Evaluar el aporte de un proyecto a un OKR
Como jefe de Departamento,
quiero registrar la evaluación del aporte de un proyecto a cada OKR al que está vinculado, usando la rúbrica definida,
para obtener un puntaje objetivo que refleje cuánto contribuyó ese proyecto al OKR en el periodo.
Criterios de aceptación:
La evaluación solo puede realizarse sobre proyectos en estado "activo" o "finalizado"
El sistema presenta la rúbrica del OKR y permite asignar un valor a cada criterio
El sistema calcula automáticamente el puntaje total ponderado del aporte del proyecto
El puntaje queda registrado con fecha, evaluador y versión de la rúbrica utilizada
El resultado de la evaluación se refleja en el dashboard de impacto del OKR correspondiente

HU-1.8 — Visualizar la jerarquía estratégica completa
Como cualquier usuario autenticado,
quiero ver una vista de árbol navegable con la cadena completa apuesta → meta → OKR → proyectos vinculados,
para comprender de un vistazo cómo se articula la estrategia institucional y dónde encaja cada proyecto.
Criterios de aceptación:
La vista de árbol es expandible y colapsable por nivel
Cada nodo muestra: nombre, estado y % de cumplimiento o avance según corresponda
El usuario puede hacer clic en cualquier nodo para ver su ficha completa
La vista se puede filtrar por periodo académico y por estado
Los nodos sin proyectos vinculados se destacan visualmente como "sin cobertura"


HU-2.1 — Registrar proyecto o iniciativa
Como jefe de Departamento,
quiero crear un proyecto con su información básica y vincularlo al departamento que lo ejecuta,
para registrarlo formalmente en el portafolio del Departamento con trazabilidad institucional desde su creación.
Criterios de aceptación:
Un proyecto tiene: nombre, descripción, tipo (proyecto de grado / investigación / extensión / macroproyecto), departamento responsable, tutor(es) asignado(s), fecha de inicio, fecha estimada de cierre y estado
Solo el jefe del departamento responsable puede crear proyectos en su departamento
El director puede crear proyectos en cualquier departamento
El proyecto queda en estado "borrador" hasta que se le vincule al menos un OKR
El sistema valida que el tutor asignado exista como usuario registrado

HU-2.2 — Vincular proyecto a OKRs
Como jefe de Departamento,
quiero vincular un proyecto a uno o más OKRs activos del periodo,
para establecer formalmente su contribución a los objetivos estratégicos y habilitar su trazabilidad.
Criterios de aceptación:
El sistema permite vincular un proyecto a múltiples OKRs
Solo se pueden vincular OKRs en estado "activo"
Al vincular, el sistema solicita que se declare el tipo de contribución esperada (directa / indirecta / soporte)
Un proyecto sin al menos un OKR vinculado no puede cambiar a estado "activo"
La vinculación queda registrada con fecha y usuario que la realizó

HU-2.3 — Asignar indicadores de contribución al proyecto
Como jefe de Departamento,
quiero asignar indicadores específicos de contribución a cada proyecto,
para contar con métricas cuantificables que evidencien el aporte del proyecto al OKR durante el periodo.
Criterios de aceptación:
Los indicadores se asignan a nivel de vínculo proyecto-OKR
Cada indicador tiene: nombre, descripción, unidad de medida, valor base y valor objetivo
El sistema sugiere indicadores basados en los KRs del OKR vinculado
Un proyecto puede tener indicadores distintos para cada OKR al que está vinculado
El sistema alerta si un proyecto activo no tiene ningún indicador asignado

HU-2.4 — Registrar avance periódico del proyecto
Como tutor o jefe de Departamento,
quiero registrar el avance del proyecto contra sus indicadores de contribución en cada corte del periodo,
para mantener actualizado el estado de contribución estratégica a lo largo del ciclo académico.
Criterios de aceptación:
El avance se registra por indicador con: valor actual, fecha de corte y observaciones opcionales
El sistema calcula automáticamente el % de avance de cada indicador
El historial de avances queda almacenado y es consultable por fecha
El tutor solo puede registrar avance en los proyectos que tiene asignados
Al registrar avance, el % de contribución del proyecto al OKR se actualiza automáticamente en los dashboards

HU-2.5 — Consultar portafolio de proyectos del departamento
Como jefe de Departamento,
quiero ver todos los proyectos activos de mi departamento con su estado, OKRs vinculados y % de avance,
para evaluar el estado del portafolio y tomar decisiones de seguimiento.
Criterios de aceptación:
El jefe solo ve los proyectos de su departamento
La vista muestra: nombre del proyecto, tutor, estado, OKRs vinculados, % de avance global y fecha de último registro
Se puede filtrar por estado, tutor, OKR vinculado y periodo académico
La vista puede ordenarse por % de avance ascendente para identificar proyectos rezagados
El sistema marca visualmente los proyectos que no han registrado avance en más de 4 semanas

HU-2.6 — Consultar portafolio completo de la Escuela
Como director de la Escuela TDI,
quiero ver todos los proyectos activos de todos los departamentos con sus métricas de avance e impacto,
para tener visibilidad completa del portafolio institucional sin restricción por departamento.
Criterios de aceptación:
El director ve proyectos de todos los departamentos en una sola vista
La vista incluye filtros por departamento, OKR, periodo, tutor y estado
El sistema indica cuántos proyectos soportan cada OKR activo
El director puede acceder a la ficha completa de cualquier proyecto desde esta vista
La vista exporta a PDF o CSV con los filtros aplicados

HU-2.7 — Importar proyectos desde Jira
Como jefe de Departamento,
quiero importar la información básica de un proyecto existente en Jira al SGM,
para no duplicar el registro manual y mantener la coherencia con el sistema de gestión operativa ya en uso en el DCSI.
Criterios de aceptación:
El sistema se conecta a Jira mediante la API oficial (OAuth o API token)
El usuario puede buscar un proyecto de Jira por nombre o clave y previsualizar sus datos antes de importar
Los campos mapeados son: nombre, descripción, fecha de inicio, fecha estimada de cierre y estado
Los campos no mapeables (OKRs, indicadores) quedan pendientes de completar manualmente tras la importación
Si la conexión con Jira falla, el sistema muestra un mensaje claro y permite el registro manual como alternativa

HU-2.8 — Cambiar estado de un proyecto
Como jefe de Departamento,
quiero cambiar el estado de un proyecto (borrador → activo → finalizado → suspendido),
para reflejar el ciclo de vida real del proyecto en el portafolio y que los dashboards muestren información precisa.
Criterios de aceptación:
Las transiciones de estado válidas son: borrador → activo, activo → finalizado, activo → suspendido, suspendido → activo
Para pasar a "activo", el proyecto debe tener al menos un OKR vinculado y un indicador asignado
Al finalizar un proyecto, el sistema solicita un registro de cierre con % de cumplimiento final de cada indicador
Los proyectos finalizados o suspendidos no desaparecen del portafolio; quedan visibles con su estado
Solo el jefe del departamento responsable o el director pueden cambiar el estado

HU-2.9 — Ver ficha completa de un proyecto
Como tutor, jefe de Departamento o director,
quiero consultar la ficha completa de un proyecto con toda su información estratégica, avances históricos y evaluaciones,
para tener en un solo lugar toda la evidencia del trabajo realizado y su contribución institucional.
Criterios de aceptación:
La ficha muestra: datos generales, OKRs vinculados con % de cumplimiento, indicadores con historial de avance, evaluaciones de aporte y estado actual
El tutor solo puede ver la ficha de sus proyectos asignados
El jefe solo ve fichas de proyectos de su departamento
El director puede ver cualquier ficha
La ficha tiene botón de exportación a PDF con todos los datos visibles


HU-3.1 — Dashboard general de la Escuela
Como director de la Escuela TDI,
quiero ver un dashboard general que consolide el estado del portafolio completo con métricas de impacto por apuesta estratégica,
para tener una visión institucional en un único punto y poder presentarla a instancias superiores.
Criterios de aceptación:
El dashboard muestra: total de proyectos activos, % de OKRs con cobertura de proyectos, % promedio de cumplimiento por apuesta, proyectos sin avance reciente
Cada apuesta estratégica tiene un indicador visual de cumplimiento (semáforo o barra de progreso)
El dashboard tiene filtro por periodo académico
Los datos se actualizan en tiempo real al registrar avances en proyectos
El dashboard es responsive y funciona correctamente en pantalla completa para presentaciones

HU-3.2 — Dashboard por OKR
Como jefe de Departamento,
quiero ver un dashboard específico para cada OKR que muestre los proyectos que lo soportan y el cumplimiento de sus resultados clave,
para evaluar si el OKR está siendo alcanzado y qué proyectos están contribuyendo efectivamente.
Criterios de aceptación:
El dashboard muestra: objetivo del OKR, lista de KRs con valor actual vs. objetivo, % de cumplimiento global, lista de proyectos vinculados con su % de aporte y estado
El jefe solo ve OKRs de su departamento; el director ve todos
Se muestra la tendencia de cumplimiento del OKR (gráfico de línea histórico por corte)
Los proyectos vinculados se ordenan por % de contribución descendente
Se alerta visualmente si el OKR tiene menos del 30% de cumplimiento a más del 50% del periodo

HU-3.3 — Dashboard por apuesta estratégica
Como director de la Escuela TDI,
quiero ver un dashboard por apuesta que muestre los OKRs vinculados, los proyectos asociados y el aporte acumulado,
para presentar con evidencia trazable la contribución de la Escuela a cada apuesta institucional.
Criterios de aceptación:
El dashboard muestra la cadena completa: apuesta → metas → OKRs → proyectos con métricas en cada nivel
Incluye gráfico de barras con el % de cumplimiento de cada OKR de la apuesta
Incluye contador de proyectos activos, finalizados y en riesgo por apuesta
El % de contribución de la Escuela a la apuesta se calcula como promedio ponderado del cumplimiento de sus OKRs
El dashboard tiene un modo "presentación" que oculta los controles de navegación

HU-3.4 — Dashboard por departamento
Como director de la Escuela TDI,
quiero comparar el aporte de cada departamento a los OKRs de la Escuela en un mismo dashboard,
para identificar departamentos con alta contribución y aquellos que requieren atención o reorientación.
Criterios de aceptación:
El dashboard muestra una fila por departamento con: cantidad de proyectos activos, OKRs cubiertos, % de cumplimiento promedio y proyectos en riesgo
Permite seleccionar un OKR específico y ver el aporte desagregado por departamento
El director puede hacer clic en un departamento para navegar a su portafolio completo
El dashboard tiene filtro por periodo académico para comparar entre ciclos

HU-3.5 — Filtros globales en dashboards
Como director o jefe de Departamento,
quiero filtrar cualquier dashboard por periodo académico, departamento, estado del proyecto y OKR específico,
para hacer análisis focalizados y comparar el impacto entre ciclos o unidades.
Criterios de aceptación:
Todos los dashboards comparten los mismos filtros globales: periodo, departamento (solo para director), estado, OKR
Al aplicar un filtro, todos los indicadores y gráficos del dashboard se actualizan simultáneamente
Los filtros seleccionados son visibles como etiquetas en la parte superior del dashboard
El estado de los filtros se conserva al navegar entre secciones durante la misma sesión
Existe la opción "limpiar filtros" que restablece la vista completa

HU-3.6 — Exportar reporte de impacto estratégico
Como director o jefe de Departamento,
quiero exportar el contenido de cualquier dashboard en formato PDF con los filtros aplicados,
para presentarlo formalmente a instancias directivas sin necesidad de acceder al sistema en el momento.
Criterios de aceptación:
El PDF exportado incluye: título del reporte, filtros aplicados, fecha de generación, todos los indicadores y gráficos visibles en pantalla
El PDF tiene la identidad visual institucional (logo, nombre de la Escuela)
La exportación tarda menos de 10 segundos para dashboards con hasta 100 proyectos
El nombre del archivo incluye el tipo de reporte, periodo y fecha de generación automáticamente
El PDF es legible en tamaño carta sin recortes de contenido

HU-3.7 — Historial comparativo entre periodos
Como director de la Escuela TDI,
quiero comparar el cumplimiento de OKRs y el aporte de proyectos entre dos periodos académicos distintos,
para identificar tendencias de mejora o deterioro en la contribución estratégica de la Escuela.
Criterios de aceptación:
El sistema permite seleccionar dos periodos académicos para comparar
La vista muestra en columnas paralelas: % de cumplimiento de OKRs, cantidad de proyectos activos y promedio de aporte por periodo
Las diferencias positivas se destacan en verde y las negativas en rojo
El historial comparativo está disponible desde que el SGM tiene datos de al menos dos periodos registrados
La vista comparativa es exportable a PDF

HU-4.1 — Autenticación con credenciales institucionales
Como cualquier usuario de la Escuela TDI,
quiero autenticarme en el SGM usando mi cuenta institucional de la Universidad ICESI,
para acceder al sistema sin necesidad de gestionar credenciales adicionales y garantizar que el acceso es seguro.
Criterios de aceptación:
El sistema implementa autenticación mediante SSO (Single Sign-On) con el proveedor de identidad institucional (Google Workspace ICESI u OAuth 2.0)
Si el SSO no está disponible, existe un flujo de autenticación con correo institucional y contraseña como respaldo
La sesión expira después de 8 horas de inactividad
Los intentos fallidos de acceso quedan registrados en el log de seguridad
El sistema redirige al usuario a su vista principal según su rol inmediatamente tras autenticarse

HU-4.2 — Gestionar usuarios y asignar roles
Como administrador del sistema,
quiero crear, editar y desactivar usuarios asignándoles un rol institucional y un departamento,
para controlar quién puede acceder al SGM y qué acciones puede realizar dentro del sistema.
Criterios de aceptación:
Los roles disponibles son: Administrador, Director de Escuela, Jefe de Departamento y Profesor/Tutor
Cada usuario tiene: nombre, correo institucional, rol, departamento asignado (obligatorio para Jefe y Tutor) y estado (activo/inactivo)
Un usuario desactivado no puede iniciar sesión pero su historial de acciones se conserva
El administrador puede cambiar el rol de un usuario existente en cualquier momento
El sistema envía una notificación por correo al usuario cuando su cuenta es creada o su rol cambia

HU-4.3 — Importar usuarios desde el directorio institucional
Como administrador del sistema,
quiero importar usuarios desde el directorio institucional de la Universidad (Active Directory o Google Workspace),
para no tener que registrar manualmente a todos los miembros de la Escuela TDI y mantener la coherencia con los sistemas existentes.
Criterios de aceptación:
El sistema se conecta a la API del directorio institucional para buscar usuarios por nombre, correo o departamento
El administrador puede seleccionar uno o varios usuarios del directorio para importar
Al importar, el sistema asigna el rol "Tutor" por defecto; el administrador lo puede cambiar antes de confirmar
Si el usuario ya existe en el SGM, el sistema lo detecta y ofrece actualizar sus datos sin duplicar
La importación masiva admite hasta 50 usuarios en una sola operación

HU-4.4 — Control de visibilidad por departamento
Como sistema,
quiero restringir automáticamente la visibilidad de proyectos, OKRs y dashboards según el departamento del usuario,
para que cada jefe de Departamento acceda únicamente a la información de su unidad y el director vea todo.
Criterios de aceptación:
El Jefe de Departamento ve únicamente proyectos, OKRs y métricas de su departamento
El Director de Escuela ve información de todos los departamentos sin restricción
El Tutor ve únicamente los proyectos a los que está asignado como tutor
Las restricciones aplican a todas las vistas: listas, fichas, dashboards y exportaciones
Si un usuario intenta acceder a una URL de un recurso fuera de su alcance, el sistema devuelve un error 403 con mensaje claro

HU-4.5 — Restricción de acciones por rol
Como sistema,
quiero restringir las acciones de creación, edición y eliminación según el rol del usuario autenticado,
para garantizar la integridad de la información estratégica institucional.
Criterios de aceptación:
Acción
Administrador
Director
Jefe Depto.
Tutor
Crear/editar apuestas estratégicas
✅
✅
❌
❌
Crear/editar OKRs
✅
✅
✅ (su depto.)
❌
Crear/editar proyectos
✅
✅
✅ (su depto.)
❌
Registrar avance de proyectos
✅
✅
✅
✅ (sus proyectos)
Ver dashboards
✅
✅ (todo)
✅ (su depto.)
✅ (sus proyectos)
Exportar reportes
✅
✅
✅
❌
Gestionar usuarios
✅
❌
❌
❌


Los botones de acciones no permitidas no se muestran en la interfaz (no solo se deshabilitan)
Cualquier intento de acción no autorizada vía API devuelve un error 403

HU-4.6 — Registro de auditoría de acciones
Como administrador del sistema,
quiero consultar un log de auditoría con las acciones realizadas por cada usuario,
para tener trazabilidad de quién creó, editó o eliminó información estratégica en el sistema.
Criterios de aceptación:
El log registra: usuario, acción realizada, entidad afectada (tipo y nombre), fecha y hora, y dirección IP
Las acciones auditadas incluyen: creación, edición, eliminación, cambio de estado, exportación y cambio de rol
El log es consultable con filtros por usuario, tipo de acción, entidad y rango de fechas
El log no es editable ni eliminable por ningún rol, incluido el administrador
El log es exportable a CSV para revisiones externas

HU-4.7 — Sincronización de roles con el sistema existente
Como administrador del sistema,
quiero que los roles y departamentos del SGM puedan sincronizarse con la estructura organizacional registrada en los sistemas institucionales existentes (directorio ICESI),
para que los cambios de cargo o adscripción departamental se reflejen en el SGM sin requerir actualización manual.
Criterios de aceptación:
El sistema verifica periódicamente (cada 24 horas) si hubo cambios en el directorio institucional para los usuarios registrados en el SGM
Si un usuario cambia de departamento en el directorio, el sistema notifica al administrador para que confirme el cambio en el SGM
Si un usuario sale de la institución (cuenta desactivada en el directorio), el SGM lo desactiva automáticamente
El administrador puede desactivar la sincronización automática y gestionar todo manualmente si lo prefiere
El sistema mantiene un log de sincronizaciones con resultado (exitosa / con conflictos / fallida)


