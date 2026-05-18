Analiza este proyecto y dime con que HUs cumple, con cuales parcialmente y con cuales NO: 

Épicas e Historias de Usuario Modulo de Seguimiento para Proyectos (MSP)

ÉPICA 0. Gestión de Catálogos del Sistema
Como administrador del sistema, quiero gestionar los catálogos base (periodos académicos y unidades de medida), para que los formularios del sistema tengan datos válidos y actualizados desde los que seleccionar.
HU 0.1. Gestionar Periodos Académicos
Como administrador, quiero crear, editar y activar/desactivar periodos académicos, para que los formularios de Objetivos, Key Results y vínculos de proyectos tengan opciones válidas de selección.
Criterios de aceptación:
La vista muestra la lista de periodos con columnas: Nombre, Fecha inicio, Fecha fin, Estado (badge: activo / cerrado / planificación).
El formulario de creación solicita: Nombre (ej. "2026-1", obligatorio y único), Fecha de inicio (obligatoria), Fecha de fin (obligatoria, posterior a inicio), Estado inicial.
Se puede crear, listar, editar y cambiar el estado de un periodo.
Solo se puede eliminar un periodo si no tiene registros vinculados. De lo contrario, solo se puede desactivar.
HU 0.2. Gestionar Unidades de Medida
Como administrador, quiero administrar el catálogo de unidades de medida, para que los formularios de Metas y Key Results ofrezcan unidades estandarizadas.
Criterios de aceptación:
La vista muestra la lista de unidades con columnas: Nombre, Tipo (numérica / porcentaje / booleana / otra), Descripción, Estado, Acciones.
El formulario de creación solicita: Nombre (obligatorio, único), Tipo, Descripción (opcional).
Se puede crear, listar, editar y activar/desactivar una unidad.
No se puede eliminar una unidad que esté en uso; solo se puede marcar como inactiva.

ÉPICA 1. Gestión de la Jerarquía Estratégica
Como directivo de la Escuela TDI, quiero registrar y estructurar la jerarquía estratégica completa (Apuestas, Metas, Objetivos y Key Results), para contar con una estrategia de desarrollo verificable.
HU 1.1. Registrar Apuesta Estratégica
Como director de la Escuela TDI, quiero registrar una Apuesta Estratégica, para definir las líneas de acción de largo plazo del portafolio institucional.
Criterios de aceptación:
El formulario solicita: Nombre (obligatorio, único), Descripción (obligatoria), Fecha de inicio (opcional) y Fecha de cierre (opcional).
Se puede crear, listar y consultar el detalle de una apuesta.
La apuesta expone un executionSummary con la cobertura operativa de sus objetivos y KRs vinculados.
HU 1.2. Registrar Meta Institucional
Como director de la Escuela TDI, quiero registrar una Meta Institucional, para capturar los enunciados del plan de desarrollo de la Universidad.
Criterios de aceptación:
El formulario solicita: Nombre (obligatorio), Descripción (obligatoria), Indicador de referencia (opcional), Valor esperado (decimal, obligatorio) y Unidad de medida (selector, obligatorio).
Los campos Fecha de inicio y Fecha de cierre son opcionales.
Se puede crear, listar y consultar el detalle de una meta.
En la ficha de detalle se pueden asociar o desasociar periodos académicos (GoalPeriod).
HU 1.3. Registrar Objetivo
Como director o jefe de departamento, quiero registrar Objetivos asociados a Key Results, para descomponer la estrategia en indicadores operacionales medibles.
Criterios de aceptación:
El formulario solicita: Nombre (obligatorio), Descripción (obligatoria), Departamento (selector, obligatorio) y Periodo académico (selector, obligatorio).
El campo estimatedWeight fue eliminado del modelo. El seguimiento cuantitativo se realiza mediante completionPercentage, que representa la cobertura operativa calculada a partir de los KRs.
Validación estricta: El formulario exige seleccionar obligatoriamente una Meta institucional Y una Apuesta estratégica.
Incluye una sección para definir al menos 1 Key Result con: nombre (obligatorio), descripción (obligatoria), valor base (numérico), valor objetivo (numérico, obligatorio) y unidad de medida (selector, obligatorio).
Se pueden agregar múltiples KRs desde el mismo formulario.
HU 1.4. Listar y Filtrar Objetivos
Como usuario del sistema, quiero ver la lista de Objetivos con sus KPIs de resumen, para monitorear el cumplimiento estratégico.
Criterios de aceptación:
La vista muestra tarjetas con: nombre, descripción, Apuesta vinculada, Meta vinculada, departamento, periodo y completionPercentage (cobertura operativa calculada de sus KRs).
Filtros disponibles: por apuesta estratégica, por meta institucional, por departamento, por periodo académico.
Cada tarjeta es expandible para ver los Key Results embebidos que contiene.
Alerta visual (lowCompletionAlert) para Objetivos cuya cobertura operativa es menor al 30%.
HU 1.5. Gestionar Key Results de un Objetivo
Como director, jefe de departamento o administrador, quiero agregar, editar y actualizar los Key Results de un Objetivo.
Criterios de aceptación:
Modal con la lista de KRs del Objetivo. Muestra: nombre, descripción, valor base, valor objetivo, valor actual y unidad.
El porcentaje de progreso real de un KR se calcula a partir de los proyectos finalizados vinculados a él, no a partir de un currentValue editable manualmente.
Se puede agregar, editar o eliminar un KR (solo si no tiene proyectos vinculados activos).
HU 1.6. Editar Objetivo
Como director, jefe de departamento o administrador, quiero editar la información básica de un Objetivo.
Criterios de aceptación:
Permite editar el nombre y la descripción del Objetivo.
El campo estimatedWeight fue eliminado y ya no forma parte del formulario de edición.
Los cambios se reflejan inmediatamente en el listado.
HU 1.7. Visualizar Jerarquía Estratégica Completa
Como usuario del sistema, quiero visualizar la jerarquía estratégica como un árbol interactivo.
Criterios de aceptación:
Nivel 1: Apuestas Estratégicas y Metas Institucionales como nodos raíz, cada uno exponiendo su executionSummary.
Nivel 2: Objetivos (mostrados bajo su Apuesta, con un badge que indica su Meta vinculada).
Nivel 3: Key Results (hijos del Objetivo).
Nivel 4: Proyectos (vinculados a cada Key Result).

ÉPICA 2. Gestión de Proyectos e Iniciativas
Como usuario autorizado, quiero registrar y hacer seguimiento a los proyectos del portafolio institucional.
HU 2.1. Registrar Nuevo Proyecto
Como usuario autorizado, quiero registrar un nuevo proyecto con información completa.
Criterios de aceptación:
Formulario con: Nombre, Descripción, Tipo de proyecto (grado, investigacion, extension, macroproyecto), Estado inicial, Periodo de inicio (formato "YYYY-N"), Periodo de fin y Tutores.
El MTE puede crear proyectos propios locales.
Permite la vinculación opcional inmediata a uno o varios Key Results con su peso de contribución.
HU 2.2. Listar y Filtrar Proyectos
Como usuario del sistema, quiero ver la lista de proyectos en formato tabular con filtros.
Criterios de aceptación:
Filtros: buscador de texto, estado, tipo, departamento y periodo.
Tabla con columnas: Proyecto, Tipo, Departamento, Tutores, Estado, Key Results vinculados, Avance global.
HU 2.3. Ver Ficha Completa del Proyecto
Como usuario del sistema, quiero ver la ficha detallada de un proyecto, su historial y KRs vinculados.
Criterios de aceptación:
Endpoint: GET /api/v1/projects/{id}/detail
3 secciones: Resumen del proyecto (KPIs y datos generales), Historial (timeline de avances registrados) y Key Results vinculados con cadena de contribución.
HU 2.4. Registrar Avance de Proyecto
Como usuario asignado, quiero registrar un avance en un proyecto indicando porcentaje y comentarios.
Criterios de aceptación:
Slider e input numérico (0–100) para avance global.
Comentario obligatorio y registro de hitos opcionales.
Cada avance queda registrado en el historial del proyecto.
HU 2.5. Gestionar Estado del Proyecto
Como administrador o directivo, quiero cambiar el estado de un proyecto.
Criterios de aceptación:
Estados posibles: borrador, activo, finalizado, suspendido, archivado.
Al marcar un proyecto como finalizado, el sistema recalcula automáticamente el progreso de los KRs vinculados.
Pendiente: implementar control fino de qué roles pueden ejecutar cada transición de estado.

ÉPICA 3. Vinculación Estratégica y Pesos de Contribución
Como jefe de departamento o director, quiero gestionar las vinculaciones entre Proyectos y Key Results, para calcular el impacto real sobre la estrategia.
HU 3.1. Vincular Proyecto a Key Result con Peso de Contribución
Como director o jefe, quiero vincular un proyecto a un KR especificando su peso de contribución (%).
Criterios de aceptación:
Se puede vincular desde el KR o desde el Proyecto.
Requiere ingresar un peso de contribución (0–100%) y el tipo de contribución (directa, indirecta, soporte).
Si la suma de pesos de todos los proyectos vinculados a un KR supera el 100%, el sistema muestra una advertencia ("Los pesos son declarativos"), pero permite guardar.
HU 3.2. Desvincular Proyecto de Key Result
Como director o jefe, quiero eliminar la vinculación entre un proyecto y un KR.
Criterios de aceptación:
Botón de desvinculación con modal de confirmación.
La desvinculación es lógica (active = false); el proyecto no se elimina del sistema, solo se desactiva el vínculo.
HU 3.3. Cadena de Contribución Proyecto → KR
Como usuario, quiero ver la cadena de contribución de un proyecto sobre sus KRs vinculados.
Criterios de aceptación:
Endpoint principal: GET /api/v1/projects/{id}/contribution-chain
Endpoint alias (compatibilidad): GET /api/v1/projects/{id}/impact-chain
El DTO expone appliedContribution por cada KR vinculado.

ÉPICA 4. Dashboard y Visualización de Impacto
Como directivo, quiero consultar tableros de control operativos con el estado del portafolio.
HU 4.1. Dashboard Principal con KPIs
Como usuario, quiero ver KPIs de resumen del periodo activo.
Criterios de aceptación:
Endpoint: GET /api/v1/dashboard/summary
KPIs: Proyectos Activos, Objetivos en Seguimiento, KRs en cobertura, Cobertura operativa del portafolio.
HU 4.2. Gráficos de Estado y Cobertura
Como directivo, quiero ver gráficos de distribución del portafolio.
Criterios de aceptación:
GET /api/v1/dashboard/projects/by-status → Gráfico circular de Proyectos por Estado.
GET /api/v1/dashboard/key-results/by-progress → Gráfico de barras de KRs por nivel de progreso.
GET /api/v1/dashboard/departments/summary → Gráfico radar de rendimiento por Departamento.
GET /api/v1/dashboard/strategic-bets/summary → Gráfico de cobertura por Apuesta Estratégica.

ÉPICA 5. Reportes y Análisis Comparativo
Como directivo, quiero generar reportes analíticos exportables por período, departamento y Objetivo.
HU 5.1. Reportes Consolidados
Como directivo, quiero consultar y exportar reportes de impacto estratégico.
Criterios de aceptación:
Vistas separadas para: Reporte General, Reporte por Departamento, Ranking de Objetivos por cobertura, y Comparativa entre 2 Periodos Académicos.
Implementación: primero retornar JSON estructurado, luego agregar exportadores a PDF y CSV conservando los filtros aplicados.

ÉPICA 6. Modo Presentación para Directivos
Como director, quiero un modo presentación tipo slideshow interactivo para mostrar el estado en reuniones.
HU 6.1. Modo Presentación Interactivo
Como director, quiero proyectar el Dashboard en formato de diapositivas.
Criterios de aceptación:
Visualización en pantalla completa (API Fullscreen).
Navegación por teclado (flechas / espacio).
Backend expone: GET /api/v1/presentation?period= con portada institucional, un slide por Apuesta Estratégica con su executionSummary, y slide de cierre.
Slides generados dinámicamente según los datos del periodo seleccionado.

ÉPICA 7. Integración de Acceso y Autenticación
HU 7.1. Autenticación vía SSO / Token Externo
Como usuario del sistema, quiero iniciar sesión mediante el sistema centralizado de la institución.
Criterios de aceptación:
El acceso al módulo se realiza mediante token/sesión compartida provista por el sistema externo via GET /auth/me.
Soporta modo mock (desarrollo local) y modo external (producción con SSO real).
El sistema captura el Rol y Departamento del usuario autenticado para definir su contexto de navegación.
HU 7.2. Control de Acceso por Rol
Como administrador, quiero que las vistas y operaciones se restrinjan según el rol recibido del sistema externo.
Criterios de aceptación:
Roles soportados: ADMIN, DECANO, DIRECTOR_ESCUELA, JEFE_DPTO, PROFESOR.
Pendiente: definir e implementar las reglas de autorización por operación (ej. solo ADMIN puede gestionar catálogos; solo DIRECTOR_ESCUELA y JEFE_DPTO pueden vincular proyectos a KRs).
En el frontend: ocultamiento y bloqueo de botones/vistas según permisos del rol activo.

ÉPICA 8. Auditoría y Trazabilidad
Como administrador, quiero un registro de auditoría de las acciones realizadas en el sistema.
HU 8.1. Log de Auditoría y Tendencias
Como usuario autorizado, quiero consultar el historial de cambios del sistema.
Criterios de aceptación:
Endpoint disponible: GET /api/v1/audit-logs
Registra los siguientes tipos de eventos: CREATE, UPDATE, STATUS_CHANGE, PROGRESS_REGISTERED, LINK_CREATED, LINK_REMOVED, EXTERNAL_SYNC.
Pendiente: vista en el frontend con filtros por tipo de evento, entidad y rango de fechas.
Pendiente: gráfico de línea de tendencia histórica de cobertura en la ficha detallada de cada Objetivo.

Apendice A. Tipos y Estados del Sistema
Estados de Apuesta Estratégica

Estado
Descripción
activa
Apuesta vigente y en seguimiento
inactiva
Apuesta archivada o fuera de vigencia


Estados de Meta Institucional (Goal)

Estado
Descripción
activa
Meta vigente en al menos un periodo (ver GoalPeriod)
inactiva
Meta archivada o concluida


Estados de OCP (ShortTermObjective)

Estado
Badge
Descripción
borrador
Gris
En definición, no activo
activo
Verde
En seguimiento
completado
Azul
Objetivos logrados


Estados de OKR

Estado
Badge
Descripción
borrador
Gris
En definición
activo
Verde
Vigente y en seguimiento
completado
Azul
Alcanzó sus metas
cancelado
Rojo
Descartado


Estados de Proyecto

Estado
Badge
Descripción
borrador
Gris
En formulación
activo
Verde
En ejecución con seguimiento
finalizado
Azul
Completado con cierre formal
suspendido
Naranja
Detenido temporalmente
archivado
Gris oscuro
Fuera de portafolio activo, reactivable


Tipos de Proyecto

Tipo
Color
Descripción
grado
Azul #5454E9
Trabajo de grado de estudiantes
investigacion
Verde #4CB979
Proyecto con grupos o semilleros
extension
Naranja #E9683B
Proyecto con impacto externo
macroproyecto
Violeta #7C3AED
Iniciativa interdisciplinar


Tipos de Contribución

Tipo
Descripción
directa
Contribuye directamente al logro del OKR
indirecta
Contribuye de forma complementaria
soporte
Apoya sin ser objetivo principal


Estados de Key Result

Estado
Descripción
normal
En progreso dentro de lo esperado
superado
Superó el objetivo establecido
en_riesgo
Por debajo del avance esperado


Apendice C. Paleta de Colores del Sistema

Color
Hex
Uso






Azul primario
#5454E9
Acción principal, OKRs, KPIs
Verde
#4CB979
Éxito, cumplimiento alto, activo
Amarillo
#E4EB60
Destacado, badges, modo presentación
Naranja
#E9683B
Riesgo, alerta, advertencia
Negro
#000000
Encabezados, fondos premium
Gris
#717182
Texto secundario, archivados


Analicé el repositorio como frontend React/Vite. Hallazgo base: no hay backend ni llamadas HTTP (fetch, /api/v1, /auth/me); casi todo funciona con mockData.ts y estado en memoria vía DataContext. Por eso, las HUs que exigen endpoints, persistencia, auditoría real o validaciones de servidor quedan como parciales o no cumplidas.

Cumple

HU	Veredicto	Evidencia
HU 2.4 Registrar Avance de Proyecto	Cumple frontend	FichaProyecto.tsx tiene modal con slider + input 0-100, comentario obligatorio, hitos opcionales, guarda en historial y actualiza avanceGlobal.
Cumple Parcialmente

HU	Veredicto	Qué sí tiene / qué falta
HU 1.1 Registrar Apuesta Estratégica	Parcial	Crea/lista apuestas. Faltan unicidad, detalle formal, fechas opcionales según HU, executionSummary, edición/cambio de estado en UI.
HU 1.2 Registrar Meta Institucional	Parcial	Crea/lista metas básicas. Faltan indicador, valor esperado, unidad, fechas y asociación/desasociación de periodos GoalPeriod.
HU 1.3 Registrar Objetivo	Parcial	Exige Apuesta y Meta, departamento, periodo y al menos un KR. Falta descripción del objetivo; los KRs no capturan nombre/descripción/base/objetivo/unidad en el formulario inicial, sino una sentencia y defaults.
HU 1.4 Listar y Filtrar Objetivos	Parcial	Lista tarjetas expandibles con KRs y KPIs. Faltan filtros por apuesta/meta/periodo, descripción, Apuesta/Meta visibles en tarjeta y alerta exacta <30%.
HU 1.5 Gestionar KRs	Parcial	Se pueden agregar/editar/eliminar KRs. Pero valorActual sigue editable y el progreso no se calcula desde proyectos finalizados; eliminación no bloquea KRs con proyectos activos.
HU 1.6 Editar Objetivo	Parcial	Permite editar el enunciado/nombre y no existe estimatedWeight. Falta descripción porque el modelo no la tiene.
HU 1.7 Jerarquía Estratégica Completa	Parcial	Hay árbol Apuestas/Metas → Objetivos → KRs → Proyectos. Falta executionSummary real y algunos badges/relaciones exactas de la HU.
HU 2.1 Registrar Nuevo Proyecto	Parcial	Formulario completo básico, tutores, tipo, estado, periodos y KR opcional. Falta vincular a varios KRs con peso; el modelo fuerza un solo krId.
HU 2.2 Listar y Filtrar Proyectos	Parcial	Tabla con proyecto, tipo, depto, tutores, estado, KR y avance; filtros por texto/estado/tipo/depto. Falta filtro por periodo.
HU 2.3 Ver Ficha Completa del Proyecto	Parcial	Existe ficha con resumen, historial y KR/contribución. Falta endpoint GET /api/v1/projects/{id}/detail.
HU 2.5 Gestionar Estado del Proyecto	Parcial	Permite estados solicitados. Falta recalcular automáticamente KRs al finalizar y control fino por rol.
HU 3.1 Vincular Proyecto a KR con Peso	Parcial	Hay vínculos proyecto-KR e impacto/tipo de contribución; también hay peso en vista de OKRs, pero no está integrado correctamente al KR ni exige todos los campos de la HU en un mismo flujo.
HU 3.2 Desvincular Proyecto de KR	Parcial	Hay confirmación y desvincula sin borrar proyecto. Falta desvinculación lógica active=false; actualmente limpia/elimina relación en memoria.
HU 4.1 Dashboard Principal con KPIs	Parcial	Dashboard con KPIs equivalentes. Falta endpoint GET /api/v1/dashboard/summary.
HU 4.2 Gráficos de Estado y Cobertura	Parcial	Hay gráficos/resúmenes visuales. Faltan endpoints y algunos gráficos exactos, como radar real por departamento y barras de KRs por nivel de progreso.
HU 5.1 Reportes Consolidados	Parcial	Hay tabs General, Departamentos, Ranking OKRs y Comparativo. Botones PDF/CSV parecen visuales; falta JSON/backend/exportación real con filtros.
HU 6.1 Modo Presentación	Parcial	Tiene slideshow, pantalla completa y teclado. Falta endpoint GET /api/v1/presentation?period= y filtro por periodo.
HU 7.1 Autenticación SSO / Token Externo	Parcial	Hay login mock, sesión en sessionStorage, rol y departamento. Falta /auth/me, modo external y SSO real.
HU 7.2 Control de Acceso por Rol	Parcial	Oculta rutas/botones por rol frontend. Roles no coinciden con la HU (ADMIN, DECANO, etc.) y no hay autorización robusta por operación.
No Cumple

HU	Veredicto	Motivo
HU 0.1 Gestionar Periodos Académicos	No	Solo hay constantes PERIODOS; no CRUD, estados, validaciones ni eliminación/desactivación.
HU 0.2 Gestionar Unidades de Medida	No	No existe catálogo de unidades; solo strings sueltos en KRs.
HU 3.3 Cadena de Contribución Proyecto → KR	No	No existen endpoints /contribution-chain ni /impact-chain, ni DTO appliedContribution.
HU 8.1 Log de Auditoría y Tendencias	No	No hay endpoint /api/v1/audit-logs ni registro real de eventos. Solo hay un snippet estático en Usuarios.
Resumen corto: el proyecto cubre bastante bien la experiencia visual/prototipo de jerarquía, proyectos, avance, dashboard, reportes y presentación. Pero como MSP completo todavía está lejos en catálogos, backend/API, persistencia, cálculo real de cobertura/contribución, auditoría y SSO/roles institucionales.





3:53 PM
Muy bien, quiero un plan detallado de lo que necesitarías hacer para desarrollar todo lo faltante
3:54 PM

Claro. Para completar lo faltante lo dividiría en fases, porque el proyecto actual es un prototipo frontend con datos mock y varias HUs requieren backend, persistencia, endpoints, reglas de negocio y autorización real.

Fase 0: Alinear Arquitectura

Definir stack backend y DB: por ejemplo NestJS/Express + PostgreSQL, o el backend institucional existente si ya existe.
Convertir mockData.ts en contratos reales: entidades, DTOs, enums y respuestas API.
Definir autenticación real: modo mock para local y modo external usando GET /auth/me.
Crear capa de servicios frontend para reemplazar DataContext en memoria por llamadas HTTP.
Mantener un fallback mock solo para desarrollo.
Fase 1: Modelo de Datos
Crear tablas/entidades para:

AcademicPeriod: nombre, fecha inicio, fecha fin, estado.
MeasurementUnit: nombre, tipo, descripción, estado.
StrategicBet: apuesta estratégica.
Goal: meta institucional.
GoalPeriod: asociación meta-periodo.
Objective: objetivo estratégico/operativo.
KeyResult: KR del objetivo.
Project: proyecto.
ProjectProgress: historial de avances.
ProjectKeyResultLink: vínculo proyecto-KR con peso, tipo, estado activo.
AuditLog: eventos del sistema.
UserContext o mapeo de usuario externo si se requiere cache local.
También habría que normalizar nombres: hoy el frontend usa OKR como “Objetivo”, pero la HU habla de Objetivo + Key Results. Conviene renombrar internamente para evitar confusión.

Fase 2: Catálogos
Implementar HU 0.1 y 0.2 completas:

CRUD de periodos académicos.
Validación de nombre único y fechas válidas.
Estados planificación, activo, cerrado.
Bloqueo de eliminación si hay registros vinculados.
CRUD de unidades de medida.
Tipos: numérica, porcentaje, booleana, otra.
Activar/desactivar unidades.
Reemplazar arrays hardcodeados PERIODOS y campos unidad libres por selects desde API.
Fase 3: Jerarquía Estratégica
Completar épica 1:

Apuestas:

Validar nombre único.
Hacer detalle.
Edición y cambio de estado.
Calcular executionSummary.
Metas:

Agregar indicador de referencia, valor esperado y unidad.
Fechas opcionales.
Asociación/desasociación con periodos (GoalPeriod).
Objetivos:

Agregar descripción al modelo.
Exigir apuesta, meta, departamento y periodo.
Eliminar definitivamente restos de estimatedWeight.
Calcular completionPercentage desde cobertura operativa de KRs.
KRs:

Separar nombre/descripción/base/objetivo/unidad.
Quitar edición manual de valorActual si la regla final dice que se calcula desde proyectos finalizados.
Bloquear eliminación si tiene proyectos activos vinculados.
Calcular progreso real según vínculos y avances/cierres.
Listado:

Filtros por apuesta, meta, departamento y periodo.
Mostrar apuesta/meta en cada tarjeta.
lowCompletionAlert para objetivos bajo 30%.
Fase 4: Proyectos e Iniciativas
Completar épica 2:

Permitir vinculación inicial a uno o varios KRs, no solo un krId.
Guardar peso de contribución y tipo de contribución por vínculo.
Agregar filtro por periodo en tabla.
Crear endpoint:
GET /api/v1/projects/{id}/detail
Registrar avances en backend:
porcentaje 0-100
comentario obligatorio
hitos opcionales
auditoría PROGRESS_REGISTERED
Estados:
implementar transiciones válidas.
recalcular progreso de KRs al marcar proyecto como finalizado.
aplicar reglas por rol.
Fase 5: Vinculación Estratégica
Completar épica 3:

Crear vínculo desde proyecto y desde KR.
Guardar:
projectId
keyResultId
contributionWeight
contributionType
active
Permitir suma mayor a 100% con advertencia: “Los pesos son declarativos”.
Cambiar desvinculación física por lógica: active=false.
Crear endpoints:
GET /api/v1/projects/{id}/contribution-chain
GET /api/v1/projects/{id}/impact-chain
Calcular appliedContribution por KR.
Fase 6: Dashboard y Visualización
Completar épica 4:

Backend:

GET /api/v1/dashboard/summary
GET /api/v1/dashboard/projects/by-status
GET /api/v1/dashboard/key-results/by-progress
GET /api/v1/dashboard/departments/summary
GET /api/v1/dashboard/strategic-bets/summary
Frontend:

reemplazar cálculos locales por respuestas API.
agregar selector de periodo activo.
asegurar que gráficas usen datos reales.
definir buckets de progreso para KRs.
Fase 7: Reportes
Completar épica 5:

Backend JSON estructurado para:
reporte general
reporte por departamento
ranking de objetivos por cobertura
comparativa entre dos periodos
Filtros:
periodo
departamento
objetivo
apuesta/meta si aplica
Exportadores:
CSV
PDF
Asegurar que exporten exactamente lo filtrado en pantalla.
Registrar auditoría de exportación si se decide auditar ese evento.
Fase 8: Modo Presentación
Completar épica 6:

Backend:
GET /api/v1/presentation?period=
Respuesta con:
portada institucional
un slide por apuesta estratégica
executionSummary
slide de cierre
Frontend:
selector de periodo.
consumir slides dinámicos desde API.
mantener fullscreen y navegación por teclado, que ya están encaminados.
Fase 9: Autenticación y Autorización
Completar épica 7:

Implementar GET /auth/me.
Soportar:
mock
external
Mapear roles exactos:
ADMIN
DECANO
DIRECTOR_ESCUELA
JEFE_DPTO
PROFESOR
Crear matriz de permisos por operación.
Aplicar autorización en backend, no solo ocultamiento frontend.
Ajustar frontend:
botones
rutas
acciones bloqueadas
mensajes de acceso restringido.
Fase 10: Auditoría y Trazabilidad
Completar épica 8:

Crear AuditLog.
Registrar eventos:
CREATE
UPDATE
STATUS_CHANGE
PROGRESS_REGISTERED
LINK_CREATED
LINK_REMOVED
EXTERNAL_SYNC
Endpoint:
GET /api/v1/audit-logs
Vista frontend:
filtros por tipo de evento
entidad
usuario
rango de fechas
Tendencia histórica de cobertura en detalle de objetivo.
Guardar snapshots o eventos suficientes para calcular tendencias reales.
Fase 11: Migración Frontend
Después de tener APIs:

Crear src/app/services/api.ts.
Reemplazar DataContext por hooks/servicios:
useProjects
useObjectives
useCatalogs
useDashboard
useReports
Manejar loading/error/empty states.
Mantener optimistic updates solo donde tenga sentido.
Normalizar formularios con validaciones consistentes.
Remover campos mock y hardcodeados.
Fase 12: Pruebas

Backend:

unit tests de cálculos.
integración de endpoints.
autorización por rol.
bloqueo de eliminación cuando hay vínculos.
Frontend:

pruebas de formularios.
permisos visibles/bloqueados.
flujos críticos: crear objetivo con KRs, crear proyecto, vincular, registrar avance, finalizar proyecto.
E2E:

login mock.
CRUD catálogos.
flujo estratégico completo.
reportes.
modo presentación.
Orden Recomendado

Backend + DB + autenticación mock/external.
Catálogos.
Jerarquía estratégica.
Proyectos y avances.
Vínculos y cálculos.
Dashboard.
Reportes.
Presentación.
Auditoría.
Hardening de permisos y pruebas E2E.
La parte más crítica es decidir y fijar el modelo de cálculo: cómo se deriva completionPercentage, cómo se calcula appliedContribution, qué pasa con pesos mayores a 100%, y cuándo un proyecto impacta un KR. Una vez eso esté claro, el resto se vuelve implementación bastante ordenada.


Informe Frontend

El backend ya está bastante listo para conectarse desde el frontend. Lo más importante: la API vive bajo /api/v1, responde JSON, usa fechas ISO (YYYY-MM-DD) e instantes ISO, y en desarrollo puede correr sin token real si MTE_AUTH_MODE=mock.

Referencias clave:
application.yml
SecurityConfig.java
ProjectDtos.java
StrategyDtos.java

Configuración Base

Localmente:

VITE_API_BASE_URL=http://localhost:8081/api/v1
En Render, cuando el backend esté desplegado:

VITE_API_BASE_URL=https://TU-BACKEND.onrender.com/api/v1
En el backend hay que configurar CORS con la URL del frontend:

MTE_CORS_ALLOWED_ORIGINS=http://localhost:5173,https://TU-FRONTEND.onrender.com
Si el frontend usa Vite, esa variable debe empezar por VITE_. Si usa React CRA sería REACT_APP_API_BASE_URL. Si usa Angular, normalmente va en environment.ts.

Autenticación

Hoy hay dos modos:

MTE_AUTH_MODE=mock
En modo mock, el frontend puede llamar endpoints protegidos sin token real. El backend inyecta un usuario demo.

MTE_AUTH_MODE=external
En modo external, cada request protegida necesita:

Authorization: Bearer <token>
Endpoints públicos:

GET /api/v1/health
Swagger: /swagger-ui.html
OpenAPI: /v3/api-docs
Todo lo demás requiere autenticación desde la perspectiva de Spring Security, aunque en mock el backend la simula.

Recomendación frontend: crear un cliente HTTP centralizado con interceptor.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", Bearer ${token});
  }

  const response = await fetch(${API_BASE_URL}${path}, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw error ?? new Error(HTTP ${response.status});
  }

  if (response.status === 204) return null;
  return response.json();
}
Formato De Errores

Cuando falla una validación o regla de negocio, el backend responde algo así:

{
  "statusCode": 400,
  "message": "La solicitud tiene campos invalidos.",
  "details": ["name: must not be blank"],
  "timestamp": "2026-05-13T10:00:00Z",
  "path": "/api/v1/projects"
}
El frontend debería mostrar message como error principal y details como lista de errores específicos.

Enums Que Debe Conocer El Frontend

Proyectos:

type ProjectStatus = "BORRADOR" | "ACTIVO" | "FINALIZADO" | "SUSPENDIDO" | "ARCHIVADO";
type ProjectType = "GRADO" | "INVESTIGACION" | "EXTENSION" | "MACROPROYECTO";
type ProjectOrigin = "LOCAL" | "SYNCED";
type ProjectSyncStatus = "LOCAL_ONLY" | "SYNCED" | "SYNC_FAILED";
Catálogos:

type MeasurementUnitType = "NUMERICA" | "PORCENTAJE" | "BOOLEANA" | "OTRA";
type PeriodStatus = "ACTIVO" | "CERRADO" | "FUTURO";
Estrategia:

type ObjectiveStatus = "BORRADOR" | "ACTIVO" | "CERRADO";
type StrategicStatus = "ACTIVA" | "INACTIVA";
Auditoría:

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "PROGRESS_REGISTERED"
  | "LINK_CREATED"
  | "LINK_REMOVED"
  | "EXTERNAL_SYNC";
Endpoints Principales

Salud:

GET /health
Catálogos:

GET    /measurement-units
POST   /measurement-units
PUT    /measurement-units/{id}
PATCH  /measurement-units/{id}/active
DELETE /measurement-units/{id}

GET    /academic-periods
POST   /academic-periods
PUT    /academic-periods/{id}
PATCH  /academic-periods/{id}/status
DELETE /academic-periods/{id}

GET    /departments
Estrategia:

GET  /strategic-bets?period=2026-Q2
POST /strategic-bets
GET  /strategic-bets/{id}?period=2026-Q2

GET    /goals?period=2026-Q2
POST   /goals
GET    /goals/{id}?period=2026-Q2
POST   /goals/{id}/periods/{periodId}
DELETE /goals/{id}/periods/{periodId}

GET   /objectives?strategicBetId=&goalId=&departmentId=&periodId=
GET   /objectives/cards?strategicBetId=&goalId=&departmentId=&periodId=
POST  /objectives
GET   /objectives/{id}
PATCH /objectives/{id}
GET   /objectives/{id}/key-results
POST  /objectives/{id}/key-results

PUT    /key-results/{id}
PATCH  /key-results/{id}/current-value
DELETE /key-results/{id}

GET /strategic-hierarchy/tree?period=2026-Q2
Proyectos:

POST  /projects
GET   /projects?search=&status=&type=&departmentId=&period=
GET   /projects/{id}
GET   /projects/{id}/detail
PUT   /projects/{id}
PATCH /projects/{id}/status
POST  /projects/{id}/progress
GET   /projects/{id}/history
GET   /projects/{id}/contribution-chain
GET   /projects/{id}/impact-chain
POST  /projects/sync/trayectoria
Vínculos proyecto-KR:

POST   /project-key-result-links
GET    /project-key-result-links?projectId=&keyResultId=
DELETE /project-key-result-links/{id}
Dashboard:

GET /dashboard/summary?period=2026-Q2
GET /dashboard/projects/by-status?period=2026-Q2
GET /dashboard/key-results/by-progress?period=2026-Q2
GET /dashboard/departments/summary?period=2026-Q2
GET /dashboard/strategic-bets/summary?period=2026-Q2
Auditoría:

GET /audit-logs?action=&entityType=&entityId=
Payloads Más Importantes

Crear proyecto:

{
  "name": "Proyecto de permanencia estudiantil",
  "description": "Iniciativa para mejorar seguimiento académico.",
  "type": "INVESTIGACION",
  "departmentId": 1,
  "status": "ACTIVO",
  "startPeriod": "2026-Q1",
  "endPeriod": "2026-Q2",
  "startDate": "2026-01-15",
  "endDate": "2026-06-30",
  "tutors": ["Ana Pérez", "Carlos Ruiz"]
}
Registrar avance:

{
  "progressPercent": 65,
  "comment": "Se completó la fase de levantamiento de información.",
  "milestones": "Encuestas cerradas y base consolidada."
}
Vincular proyecto a KR:

{
  "projectId": 1,
  "keyResultId": 3,
  "contributionWeight": 50
}
Crear objetivo con KRs:

{
  "name": "Mejorar seguimiento de iniciativas estratégicas",
  "description": "Fortalecer trazabilidad y ejecución.",
  "departmentId": 1,
  "academicPeriodId": 1,
  "goalId": 1,
  "strategicBetId": 1,
  "keyResults": [
    {
      "description": "Implementar tablero de seguimiento",
      "metric": "Tableros publicados",
      "baseValue": 0,
      "targetValue": 1,
      "currentValue": 0,
      "measurementUnitId": 1
    }
  ]
}
Reglas De Negocio Que El Front Debe Reflejar

El progreso real de un KR no depende de currentValue. Depende de proyectos vinculados y finalizados.

No mostrar porcentaje global de cumplimiento para metas o apuestas estratégicas. Para esas vistas usar executionSummary.

Sí se puede mostrar Objective.completionPercentage, porque es cobertura operativa del objetivo.

Los periodos de proyecto aceptan estos formatos:

YYYY-Q1
YYYY-Q2
YYYY-Q3
YYYY-Q4
YYYY-1
YYYY-2
Ejemplo:

2026-Q2
2026-1
Si un vínculo supera 100% acumulado en un KR, el backend lo permite, pero responde overweightWarning=true. El frontend debería mostrar advertencia, no bloquear necesariamente.

Orden Recomendado Para Conectar Pantallas

Primero conectar catálogos:

/departments
/measurement-units
/academic-periods
Después formularios de estrategia:

apuestas
metas
objetivos con KRs
Luego proyectos:

listado
ficha /projects/{id}/detail
avances
cambios de estado
Después vínculos:

seleccionar proyecto
seleccionar KR
asignar contributionWeight
Finalmente dashboard:

resumen
gráficos por estado
departamentos
apuestas
Notas Para Render/Supabase

Backend en Render debería tener:

SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require
DB_USERNAME=...
DB_PASSWORD=...
MTE_CORS_ALLOWED_ORIGINS=https://TU-FRONTEND.onrender.com
MTE_AUTH_MODE=mock
Para demo en dos semanas, recomiendo dejar MTE_AUTH_MODE=mock inicialmente, conectar todo el frontend, y después activar external cuando Trayectoria Docente entregue token estable.

Pendientes Para Una Integración Más Cómoda

No hay paginación todavía: los listados devuelven arrays completos.

No hay endpoint /auth/me propio del MTE. En modo mock el usuario existe internamente, pero el frontend no tiene endpoint local para pedir “quién soy”. Sería útil agregarlo.

No hay control fino por rol aún. El frontend puede preparar menús por rol más adelante, pero hoy el backend todavía no fuerza esas reglas por endpoint.

El endpoint recomendado para cadena es /projects/{id}/contribution-chain; /impact-chain queda como alias heredado.

Show less
4:08 PM

Sí, con esta guía ya hay suficiente para planear una integración bastante concreta. Lo clave es que el frontend debe pasar de mockData.ts + DataContext en memoria a una capa API progresiva contra VITE_API_BASE_URL.

Objetivo Técnico
Conectar el cliente Vite/React al backend Spring bajo /api/v1, manteniendo modo demo funcional mientras el back termina de madurar. Haría una integración incremental: primero crear infraestructura API y tipos, luego reemplazar pantalla por pantalla los datos mock.

Fase 1: Infraestructura Base Frontend

Crear .env.example y usar:

VITE_API_BASE_URL=http://localhost:8081/api/v1
Crear cliente HTTP centralizado:

src/app/services/apiClient.ts
Manejo de Authorization: Bearer <token> si existe.
Manejo de 204.
Parseo estándar de errores:
message
details
statusCode
path
Crear tipos compartidos del frontend:

src/app/types/api.ts
Enums en formato backend: ACTIVO, BORRADOR, INVESTIGACION, etc.
DTOs para catálogos, estrategia, proyectos, vínculos, dashboard y auditoría.
Crear helpers de mapeo temporal:

Backend usa enums mayúscula.
Front actual usa valores minúscula: activo, grado, director, etc.
Para no romper toda la UI de golpe, usar adaptadores:
toProjectStatusLabel
toProjectTypeLabel
toBackendProjectPayload
fromBackendProject
Fase 2: Capa De Servicios
Crear servicios por dominio:

src/app/services/catalogsApi.ts

getDepartments
getMeasurementUnits
createMeasurementUnit
updateMeasurementUnit
setMeasurementUnitActive
deleteMeasurementUnit
getAcademicPeriods
createAcademicPeriod
updateAcademicPeriod
updateAcademicPeriodStatus
deleteAcademicPeriod
src/app/services/strategyApi.ts

apuestas
metas
objetivos
KRs
árbol estratégico
src/app/services/projectsApi.ts

listado
detalle
crear/editar
estado
avances
historial
cadena de contribución
src/app/services/linksApi.ts

crear vínculo proyecto-KR
listar vínculos
eliminar vínculo
src/app/services/dashboardApi.ts

KPIs
gráficos
src/app/services/auditApi.ts

logs
Fase 3: Estado Global
El DataContext actual mezcla datos mock, mutaciones y reglas. Lo reemplazaría gradualmente.

Opción recomendada para avanzar rápido:

Mantener DataContext como fachada.
Internamente, cambiar sus funciones para consumir API.
Si falla la API en desarrollo, opcionalmente caer a mockData.
Esto evita refactor masivo en todas las páginas desde el primer día.

Ejemplo conceptual:

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === "true";
Con eso se puede probar con back real y conservar demo estable.

Fase 4: Conectar Catálogos Primero
Pantallas nuevas o sección admin:

Crear pantalla Catálogos.

Agregar ruta:

/catalogos/periodos
/catalogos/unidades
o una sola /catalogos con tabs.
Implementar HU 0.1:

listar periodos
crear
editar
cambiar estado
eliminar
mostrar errores de negocio si el backend bloquea eliminación.
Implementar HU 0.2:

listar unidades
crear
editar
activar/desactivar
eliminar si backend lo permite.
Reemplazar constantes actuales:

PERIODOS
unidades libres en KRs
departamentos hardcodeados
por datos desde:

/departments
/measurement-units
/academic-periods
Fase 5: Estrategia
Conectar en este orden:

NuevaApuesta.tsx

POST /strategic-bets
Validar contra errores backend.
Ajustar regla: no mostrar cumplimiento global, usar executionSummary.
NuevaMeta.tsx

POST /goals
Agregar campos faltantes:
indicador de referencia
valor esperado
unidad de medida
fechas si el backend las expone
Agregar asociación de periodos:
POST /goals/{id}/periods/{periodId}
DELETE /goals/{id}/periods/{periodId}
NuevoOKR.tsx

Renombrar mentalmente como Objetivo.
Usar POST /objectives.
Ajustar payload:
name
description
departmentId
academicPeriodId
goalId
strategicBetId
keyResults[]
Cambiar KRs del formulario para capturar:
description
metric
baseValue
targetValue
currentValue si el backend lo exige para creación
measurementUnitId
OKRs.tsx

Conectar:
GET /objectives/cards
Filtros:
strategicBetId
goalId
departmentId
periodId
Mostrar completionPercentage, no cumplimiento inventado local.
Mostrar lowCompletionAlert si viene o calcular <30.
GestionKRs.tsx

GET /objectives/{id}/key-results
POST /objectives/{id}/key-results
PUT /key-results/{id}
DELETE /key-results/{id}
Muy importante: dejar de editar currentValue como progreso real si la regla del backend dice que el avance depende de proyectos finalizados.
JerarquiaEstrategica.tsx

Reemplazar árbol local por:
GET /strategic-hierarchy/tree?period=...
Fase 6: Proyectos

NuevoProyecto.tsx

Conectar POST /projects.
Cambiar payload a:
name
description
type
departmentId
status
startPeriod
endPeriod
startDate
endDate
tutors
Validar formatos de periodo:
YYYY-Q1
YYYY-Q2
YYYY-Q3
YYYY-Q4
YYYY-1
YYYY-2
Proyectos.tsx

Conectar:
GET /projects?search=&status=&type=&departmentId=&period=
Agregar filtro por periodo.
Adaptar enums mayúscula.
Conectar cambio de estado:
PATCH /projects/{id}/status
FichaProyecto.tsx

Conectar:
GET /projects/{id}/detail
GET /projects/{id}/history
POST /projects/{id}/progress
PATCH /projects/{id}/status
GET /projects/{id}/contribution-chain
Mantener alias:
/impact-chain solo como fallback si hiciera falta.
Mostrar cadena con appliedContribution.
Fase 7: Vínculos Proyecto-KR

Crear flujo común para vincular:

desde proyecto
desde KR
Conectar:

POST /project-key-result-links
GET /project-key-result-links?projectId=&keyResultId=
DELETE /project-key-result-links/{id}
Payload:

{
  "projectId": 1,
  "keyResultId": 3,
  "contributionWeight": 50
}
Si el backend responde overweightWarning=true:

mostrar advertencia.
no bloquear guardado.
texto sugerido: “Los pesos superan el 100%. Son declarativos.”
Ajustar modelo frontend actual:

Hoy parece haber mezcla entre impactoKR.porcentaje y vinculo.peso.
Deben separarse:
contributionWeight: peso declarado
appliedContribution: impacto calculado
progress: avance/progreso del proyecto o KR
Fase 8: Dashboard
Conectar Dashboard.tsx a:

GET /dashboard/summary?period=
GET /dashboard/projects/by-status?period=
GET /dashboard/key-results/by-progress?period=
GET /dashboard/departments/summary?period=
GET /dashboard/strategic-bets/summary?period=
Cambios clave:

Agregar selector de periodo.
Reemplazar cálculos locales desde mockData.
No mostrar cumplimiento global de apuestas/metas si el backend pide executionSummary.
Mantener Objective.completionPercentage como métrica válida.
Fase 9: Reportes
Reportes.tsx ahora es visual/local. Haría:

Crear servicios si el backend expone reportes más adelante.
Si todavía no hay endpoints de reportes, construirlos con endpoints existentes temporalmente.
Botones PDF/CSV:
hoy parecen decorativos.
implementar export CSV frontend primero.
PDF puede esperar o hacerse con librería dedicada.
Mantener filtros aplicados.
Fase 10: Presentación
PresentacionDashboard.tsx ya tiene fullscreen y teclado. Falta conectarla.

Consumir:

GET /presentation?period=...
aunque la guía no lo lista en endpoints principales, las HUs sí lo piden. Si no existe todavía, usar dashboard + strategic-bets como fuente temporal.
Agregar selector de periodo antes de iniciar presentación.

Generar slides desde datos API.

Usar executionSummary para apuestas.

Fase 11: Auditoría

Crear página o completar vista:

/auditoria
o sección dentro de admin.
Conectar:

GET /audit-logs?action=&entityType=&entityId=
Filtros:

acción
tipo de entidad
entidad
rango de fecha si el backend lo agrega luego
Mostrar:

acción
entidad
usuario
fecha
detalles
Fase 12: Autenticación
Como no hay /auth/me todavía:

En modo demo actual:

mantener login mock del frontend.
guardar usuario seleccionado localmente.
guardar token solo si existe.
En MTE_AUTH_MODE=mock:

requests pueden ir sin token.
el frontend puede seguir usando usuario local para menús.
En MTE_AUTH_MODE=external:

usar localStorage.accessToken.
enviar Authorization.
Cuando exista /auth/me:

reemplazar login mock por GET /auth/me.
poblar rol/departamento desde backend.
Fase 13: Control De Roles
Hoy el backend aún no tiene control fino. El frontend puede preparar la estructura:

Crear permissions.ts.

Mapear permisos por rol frontend actual.

Luego migrar a roles reales:

ADMIN
DECANO
DIRECTOR_ESCUELA
JEFE_DPTO
PROFESOR
Aplicar permisos en:

sidebar
botones crear/editar/eliminar
cambio de estado
gestión de catálogos
vínculos proyecto-KR
Orden Práctico De Implementación

apiClient.ts, tipos y .env.
Servicios de catálogos.
Pantalla de catálogos.
Conectar departamentos, periodos y unidades en formularios.
Conectar apuestas, metas y objetivos.
Conectar proyectos listado/crear/ficha.
Conectar avances e historial.
Conectar vínculos proyecto-KR.
Conectar dashboard.
Conectar jerarquía estratégica.
Conectar auditoría.
Pulir roles, errores, loading states y exports.
Riesgos A Resolver Temprano

El frontend actual usa OKR como Objetivo; el backend habla de Objective. Conviene adaptar nombres poco a poco.
El frontend actual usa IDs string (P1, KR1-1), el backend probablemente usa IDs numéricos.
Estados y tipos están en minúscula en frontend y mayúscula en backend.
El progreso de KR no debe depender de currentValue editable.
El vínculo actual no modela bien active, overweightWarning ni appliedContribution.
Mi recomendación: empezar con una integración híbrida. Primero conectamos catálogos y proyectos sin destruir los mocks; después cambiamos el DataContext por API real por dominio. Así puedes seguir desarrollando el back mientras el frontend avanza sin quedarse bloqueado.

# Estado 13/mayo/2026 5:15 pm

Este documento queda como fuente de verdad operativa para continuar el proyecto. El estado refleja lo implementado en el cliente hasta este corte, no implica aprobacion funcional final ni cobertura automatizada.

## Resumen ejecutivo

| Area | Estado | Detalle |
|---|---|---|
| Jerarquia estrategica | Parcial alto | Ya hay flujo para apuestas, metas, OKRs, KRs y vista de arbol. Faltan edicion/desactivacion formal de apuestas, auditoria y reglas completas de orfandad. |
| Proyectos y portafolio | Parcial alto | Ya hay creacion de proyectos, vinculacion a KR/OKR, registro de avances, portafolio con filtros y ficha completa. Faltan indicadores configurables por vinculo, Jira y reglas duras de ciclo de vida. |
| Dashboards y reportes | Pendiente | Existen vistas base, pero las HUs de dashboards especificos, filtros globales, comparativos y exportacion formal siguen pendientes. |
| Seguridad y roles | Parcial | Hay login mock y controles de UI por rol en varias vistas. Falta SSO, control transversal, auditoria y sincronizacion institucional. |
| Pruebas | Pendiente | No hay infraestructura de test ni coverage configurada. La verificacion actual es `npm run build`. |

## Estado por HU

| HU | Nombre | Estado | Evidencia / detalle importante | Pendiente principal |
|---|---|---|---|---|
| HU-1.1 | Registrar apuesta estrategica | Cubierta parcial alta | Hay formulario y flujo para crear apuestas estrategicas, con validaciones basicas y rol director/administrador. | Auditoria de creacion/modificacion y revision fina de criterios de periodo. |
| HU-1.2 | Editar y desactivar apuesta estrategica | Pendiente | No se ha implementado como HU formal. | Edicion completa, desactivacion, notificacion de OKRs huerfanos, bloqueo de eliminacion e historial. |
| HU-1.3 | Registrar meta institucional | Cubierta parcial alta | Hay formulario para crear metas y asociarlas a apuesta/meta estrategica dentro de la jerarquia. | Completar campos cuantitativos exigidos por HU y vinculacion multiple si aplica. |
| HU-1.4 | Registrar OKR | Cubierta parcial alta | Hay creacion de OKRs con KRs cuantificables, estado y vinculacion a meta/apuesta. | Validaciones completas de 2 a 5 KRs y confirmacion si se supera valor objetivo. |
| HU-1.5 | Actualizar avance de KRs | Cubierta parcial alta | Se agrego registro de avance de KR, historial por KR y recalculo de cumplimiento del OKR. | Reflejo completo en dashboards cuando estos existan y reglas finales de estado. |
| HU-1.6 | Definir rubrica de evaluacion de iniciativas | Pendiente | No existe modulo de rubricas. | Crear rubricas por OKR, criterios, pesos 100%, escalas y copia entre OKRs. |
| HU-1.7 | Evaluar aporte de proyecto a OKR | Pendiente | La ficha muestra impacto estimado/IA como aproximacion, pero no evaluacion con rubrica. | Evaluacion ponderada por criterio, version de rubrica, fecha y evaluador. |
| HU-1.8 | Visualizar jerarquia estrategica completa | Cubierta parcial alta | Hay vista de arbol apuesta -> meta -> OKR -> proyectos con navegacion y filtros base. | Pulir estados sin cobertura, fichas de cada nodo y filtros completos por periodo/estado. |
| HU-2.1 | Registrar proyecto o iniciativa | Cubierta parcial alta | Hay formulario de nuevo proyecto con datos base, departamento, tutores, periodos, tipo y vinculacion estrategica. | Validar tutor contra usuarios y reglas estrictas por departamento/rol. |
| HU-2.2 | Vincular proyecto a OKRs | Cubierta parcial media | Hay vinculacion operativa a KR y derivacion de OKR; se mantiene compatibilidad con `okrIds`. | La HU pide multiples OKRs activos; hoy el modelo principal sigue centrado en un `krId` primario. |
| HU-2.3 | Asignar indicadores de contribucion al proyecto | Pendiente | Los avances ya pueden guardar indicador, fecha de corte y valor, pero no hay configuracion formal de indicadores por vinculo proyecto-OKR. | CRUD de indicadores por vinculo, sugerencias desde KRs, valor base/objetivo y alerta si falta indicador. |
| HU-2.4 | Registrar avance periodico del proyecto | Cubierta parcial alta | La ficha permite registrar avance con fecha de corte, indicador, valor actual, observaciones, hitos e historial. | Calculo automatico por indicador y actualizacion completa de contribucion en dashboards. |
| HU-2.5 | Consultar portafolio de proyectos del departamento | Cubierta parcial alta | Portafolio con filtros por estado, tutor, OKR, periodo, departamento segun rol, avance, ultimo registro y alerta visual por mas de 4 semanas. | Afinar alcance de jefe/tutor en todas las acciones y exportacion si se reutiliza para escuela. |
| HU-2.6 | Consultar portafolio completo de la Escuela | Parcial | Director/administrador puede ver todos los departamentos y filtros principales. | Exportar PDF/CSV, metricas explicitas de proyectos por OKR y vista institucional formal. |
| HU-2.7 | Importar proyectos desde Jira | Pendiente | No hay integracion Jira. | OAuth/API token, busqueda, previsualizacion, mapeo y manejo de fallos. |
| HU-2.8 | Cambiar estado de un proyecto | Parcial | Existen acciones de estado desde portafolio/ficha. | Reglas validas de transicion, requisito de OKR+indicador para activar y cierre con cumplimiento final. |
| HU-2.9 | Ver ficha completa de un proyecto | Cubierta parcial alta | Ficha con datos generales, OKRs/KRs vinculados, indicadores derivados, historial, evaluacion de aporte estimada, permisos por rol y boton PDF visible. | Exportacion PDF real y evaluaciones con rubrica cuando exista HU-1.7. |
| HU-3.1 | Dashboard general de la Escuela | Pendiente | Hay dashboard base, pero no cumple la HU de consolidacion estrategica. | Total activos, cobertura OKR, cumplimiento por apuesta, sin avance reciente, filtro periodo y tiempo real. |
| HU-3.2 | Dashboard por OKR | Pendiente | No hay dashboard especifico por OKR con tendencia historica y proyectos ordenados por aporte. | Vista OKR con KRs, proyectos, aporte, tendencia y alertas. |
| HU-3.3 | Dashboard por apuesta estrategica | Pendiente | No hay dashboard por apuesta con cadena y aporte acumulado. | Cadena apuesta->metas->OKRs->proyectos, barras, contadores y modo presentacion. |
| HU-3.4 | Dashboard por departamento | Pendiente | No hay comparativo formal entre departamentos. | Filas por departamento, OKRs cubiertos, cumplimiento promedio, riesgos y navegacion al portafolio. |
| HU-3.5 | Filtros globales en dashboards | Pendiente | No existe sistema de filtros globales compartidos. | Periodo, departamento, estado, OKR, etiquetas visibles, persistencia de sesion y limpiar filtros. |
| HU-3.6 | Exportar reporte de impacto estrategico | Pendiente | Hay botones visuales de exportar/PDF, pero no generacion real. | PDF con filtros, fecha, identidad visual, graficos visibles y nombre automatico. |
| HU-3.7 | Historial comparativo entre periodos | Pendiente | No hay vista comparativa entre dos periodos. | Seleccion de periodos, columnas paralelas, diferencias y exportacion. |
| HU-4.1 | Autenticacion con credenciales institucionales | Pendiente | Existe login mock/local para prototipo. | SSO Google Workspace/OAuth, expiracion, intentos fallidos y redireccion por rol. |
| HU-4.2 | Gestionar usuarios y asignar roles | Parcial | Hay pantalla/base de usuarios y roles mock. | Crear/editar/desactivar completo, correo institucional, notificaciones y bloqueo real de inactivos. |
| HU-4.3 | Importar usuarios desde directorio institucional | Pendiente | No hay integracion con directorio institucional. | API directorio, busqueda, importacion masiva, deduplicacion y rol por defecto. |
| HU-4.4 | Control de visibilidad por departamento | Parcial | Aplicado en portafolio y ficha de proyecto; algunas vistas ya filtran por rol. | Hacerlo transversal en listas, fichas, dashboards, exportaciones y rutas fuera de alcance con 403. |
| HU-4.5 | Restriccion de acciones por rol | Parcial | Hay ocultamiento de botones/acciones en varias pantallas. | Matriz completa de permisos, bloqueo consistente de acciones y API/servicio con 403. |
| HU-4.6 | Registro de auditoria de acciones | Pendiente | No existe log de auditoria formal. | Registrar usuario, accion, entidad, fecha/hora, IP, filtros y exportacion CSV. |
| HU-4.7 | Sincronizacion de roles con sistema existente | Pendiente | No hay sincronizacion institucional. | Verificacion periodica, cambios de departamento, desactivacion automatica, conflictos y log. |

## Cobertura de pruebas por HU

Estado actual: no hay framework de pruebas ni herramienta de cobertura configurada. Por trazabilidad, todas las HUs quedan en 0% hasta que se agreguen tests automatizados.

| HU | Nombre | Unitarias | Componentes/UI | E2E | Cobertura total | Notas |
|---|---|---:|---:|---:|---:|---|
| HU-1.1 | Registrar apuesta estrategica | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.2 | Editar y desactivar apuesta estrategica | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.3 | Registrar meta institucional | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.4 | Registrar OKR | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.5 | Actualizar avance de KRs | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.6 | Definir rubrica de evaluacion de iniciativas | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.7 | Evaluar aporte de proyecto a OKR | 0% | 0% | 0% | 0% | Sin tests. |
| HU-1.8 | Visualizar jerarquia estrategica completa | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.1 | Registrar proyecto o iniciativa | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.2 | Vincular proyecto a OKRs | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.3 | Asignar indicadores de contribucion al proyecto | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.4 | Registrar avance periodico del proyecto | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.5 | Consultar portafolio de proyectos del departamento | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.6 | Consultar portafolio completo de la Escuela | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.7 | Importar proyectos desde Jira | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.8 | Cambiar estado de un proyecto | 0% | 0% | 0% | 0% | Sin tests. |
| HU-2.9 | Ver ficha completa de un proyecto | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.1 | Dashboard general de la Escuela | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.2 | Dashboard por OKR | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.3 | Dashboard por apuesta estrategica | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.4 | Dashboard por departamento | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.5 | Filtros globales en dashboards | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.6 | Exportar reporte de impacto estrategico | 0% | 0% | 0% | 0% | Sin tests. |
| HU-3.7 | Historial comparativo entre periodos | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.1 | Autenticacion con credenciales institucionales | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.2 | Gestionar usuarios y asignar roles | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.3 | Importar usuarios desde directorio institucional | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.4 | Control de visibilidad por departamento | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.5 | Restriccion de acciones por rol | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.6 | Registro de auditoria de acciones | 0% | 0% | 0% | 0% | Sin tests. |
| HU-4.7 | Sincronizacion de roles con sistema existente | 0% | 0% | 0% | 0% | Sin tests. |

## Verificacion tecnica del corte

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecutado correctamente con Vite. |
| Servidor local | OK | Responde en `http://127.0.0.1:5173`. |
| Test automatizados | No disponible | No existe script `test` ni dependencias de Vitest/Jest/Playwright/Cypress. |
| Coverage automatizado | No disponible | No existe script `coverage`; cobertura declarada en 0% por HU. |
| Advertencias conocidas | No bloqueante | Vite advierte chunk JS mayor a 500 kB. |

## HUs recomendadas para continuar

| Prioridad | HUs | Por que siguen |
|---|---|---|
| 1 | HU-2.3, HU-1.6, HU-1.7 | Cierran la brecha entre avance reportado y aporte evaluado con criterios. Son clave antes de dashboards serios. |
| 2 | HU-2.8, HU-2.6 | Endurecen portafolio, estados y visibilidad institucional. |
| 3 | HU-3.1 a HU-3.5 | Construyen la capa analitica una vez la data estrategica este mas completa. |
| 4 | HU-4.4, HU-4.5, HU-4.6 | Fortalecen permisos, seguridad funcional y trazabilidad. |

# Estado 17/mayo/2026

## Implementacion agregada en cliente

| HU | Estado actualizado | Evidencia |
|---|---|---|
| HU-1.6 Definir rubrica de evaluacion de iniciativas | Cubierta parcial alta frontend | Se agrego modelo de rubricas por Objetivo/OKR con criterios, pesos que deben sumar 100%, version, copia desde otro OKR y pantalla `/okrs/:okrId/rubrica`. |
| HU-1.7 Evaluar aporte de proyecto a OKR | Cubierta parcial alta frontend | La pantalla de rubrica permite evaluar proyectos vinculados con escala 0-5 por criterio, guarda evaluador, fecha, version de rubrica, observaciones, puntaje total y aporte ponderado. La ficha de proyecto muestra estas evaluaciones. |
| HU-2.3 Asignar indicadores de contribucion al proyecto | Cubierta parcial media frontend | La ficha de proyecto permite crear indicadores por vinculo proyecto-OKR/KR con base, actual, objetivo y unidad. El registro de avance puede asociarse a un indicador y actualiza su valor actual. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecutado correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Pendiente inmediato

| Area | Pendiente |
|---|---|
| Rubricas | Persistencia backend, control fino de permisos, historial completo por version y copia entre OKRs con confirmacion UX. |
| Evaluaciones | Flujo de re-evaluacion historica sin sobrescribir evaluaciones previas y reportes agregados por rubrica. |
| Indicadores | CRUD mas completo por vinculo, validacion de indicadores obligatorios antes de activar proyecto y representacion formal en dashboards. |

# Bloque 1 implementado - 17/mayo/2026

## HUs trabajadas

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-0.1 Gestionar periodos academicos | Cubierta parcial alta frontend | Se agrego catalogo de periodos con crear, editar, cerrar/eliminar segun uso y consumo desde formularios/filtros de OKRs, proyectos, jerarquia, reportes y ficha. |
| HU-0.2 Gestionar unidades de medida | Cubierta parcial alta frontend | Se agrego catalogo de unidades con crear, editar, activar/desactivar y proteccion cuando esta en uso. KRs, metas e indicadores usan selector desde catalogo. |
| Periodos/unidades hardcoded | Reducido | `PERIODOS` deja de alimentar las pantallas clave; se mantiene solo como constante legacy en mock data. |
| HU-1.2 Editar apuesta estrategica | Cubierta parcial media frontend | La jerarquia permite editar nombre, descripcion, area institucional, fechas y estado de una apuesta. |
| HU-1.2 Desactivar apuesta estrategica | Cubierta parcial media frontend | La jerarquia permite activar/desactivar apuestas y alerta cuando existen OKRs vinculados antes de desactivar. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecutado correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Pendiente posterior al bloque

| Area | Pendiente |
|---|---|
| Catalogos | Persistencia backend, auditoria, control de concurrencia y validaciones de fechas solapadas de periodos. |
| Apuestas | Historial/auditoria de cambios, bloqueo backend de eliminacion y notificaciones reales a responsables de OKRs vinculados. |

# Avances 17/05/2026

Segun el analisis realizado sobre el frontend, se identificaron las HUs que ya estaban completas o parcialmente completas, las que estaban incompletas y las que faltaban por implementar. El backend se esta trabajando en otro repositorio, por lo que este corte se enfoca unicamente en el estado funcional del cliente.

## Estado identificado

| Categoria | Resultado del analisis |
|---|---|
| HUs completas o parcialmente cubiertas | Existen flujos funcionales para registrar apuestas, metas, OKRs, KRs, proyectos, avances, portafolio, ficha de proyecto, jerarquia estrategica, roles basicos y gestion parcial de usuarios. Varias HUs estaban cubiertas a nivel frontend pero sin persistencia backend ni auditoria. |
| HUs incompletas | Se identificaron brechas en edicion/desactivacion de apuestas, catalogos de periodos/unidades, indicadores formales de contribucion, rubricas, evaluacion de aporte, reglas de estado, permisos transversales, dashboards y exportaciones reales. |
| HUs faltantes | Siguen pendientes integraciones institucionales, Jira, SSO, directorio de usuarios, auditoria formal, dashboards completos, filtros globales, reportes PDF reales, sincronizacion de roles y pruebas automatizadas. |

## Lo implementado en este avance

| Area / HU | Avance realizado |
|---|---|
| HU-0.1 Gestionar periodos academicos | Se agrego un catalogo frontend de periodos academicos con crear, editar, cerrar/eliminar segun uso y validacion de nombres duplicados. |
| HU-0.2 Gestionar unidades de medida | Se agrego un catalogo frontend de unidades de medida con crear, editar, activar/desactivar y proteccion cuando una unidad esta en uso. |
| Catalogos en navegacion | Se creo la pantalla `Catalogos` y se agrego acceso desde el sidebar para director y administrador. |
| Periodos en formularios y filtros | Se reemplazaron periodos quemados por datos del catalogo en formularios y filtros clave: nuevo OKR, nueva meta, nuevo proyecto, portafolio de proyectos, ficha de proyecto, reportes y jerarquia estrategica. |
| Unidades en KRs/metas/indicadores | Se reemplazo la captura libre de unidades por selectores desde catalogo en creacion/edicion de KRs, metas institucionales e indicadores de contribucion. |
| HU-1.2 Editar apuesta estrategica | Se agrego edicion directa de apuesta desde la vista de jerarquia: nombre, descripcion, area institucional, fechas y estado. |
| HU-1.2 Desactivar apuesta estrategica | Se agrego accion para activar/desactivar apuestas desde la jerarquia, con alerta cuando existen OKRs vinculados antes de desactivar. |
| Trazabilidad del avance | Se actualizo este documento con el bloque implementado y su verificacion tecnica. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene la advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistencia backend de catalogos, apuestas, rubricas, evaluaciones e indicadores. | HU-0.1, HU-0.2, HU-1.2, HU-1.6, HU-1.7, HU-2.3 |
| Alta | Endurecer indicadores de contribucion: CRUD completo por vinculo proyecto-OKR, validacion antes de activar proyecto y calculo mas formal de avance. | HU-2.3, HU-2.4, HU-2.8 |
| Alta | Completar reglas de cambio de estado de proyectos, incluyendo transiciones validas y requisitos para activar/cerrar. | HU-2.8 |
| Alta | Soportar de forma mas completa multiples OKRs por proyecto, no solo KR principal con compatibilidad `okrIds`. | HU-2.2 |
| Media | Completar portafolio institucional de Escuela con exportacion, metricas explicitas y permisos por rol. | HU-2.6 |
| Media | Construir dashboards: general, por OKR, por apuesta, por departamento y filtros globales. | HU-3.1, HU-3.2, HU-3.3, HU-3.4, HU-3.5 |
| Media | Implementar exportacion real de reportes PDF/CSV con filtros aplicados. | HU-3.6, HU-3.7 |
| Media | Completar restricciones transversales por rol y visibilidad por departamento en rutas, vistas, exportaciones y acciones. | HU-4.4, HU-4.5 |
| Baja / backend-integracion | SSO institucional, importacion de usuarios, sincronizacion de roles, auditoria formal e integracion con Jira. | HU-2.7, HU-4.1, HU-4.3, HU-4.6, HU-4.7 |
| Transversal | Agregar infraestructura de pruebas automatizadas y cobertura por HU. | Todas |

# Avances 17/05/2026 4:27 pm

## Bloque 2 implementado

En este segundo bloque se continuaron las HUs priorizadas despues del analisis inicial. El foco fue cerrar brechas funcionales del portafolio, indicadores, reglas de estado, dashboard general y filtros globales basicos del frontend.

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-2.2 Vincular proyecto a OKRs | Cubierta parcial alta frontend | El modal de vinculacion del portafolio ahora permite manejar multiples OKRs por proyecto, ajustar peso de contribucion, definir tipo de contribucion y seleccionar un KR principal opcional. |
| HU-2.3 Asignar indicadores de contribucion | Cubierta parcial alta frontend | La ficha del proyecto ahora permite crear, editar, actualizar y eliminar indicadores de contribucion por OKR/KR. Los indicadores se usan como requisito funcional para activar proyectos. |
| HU-2.6 Consultar portafolio completo de la Escuela | Cubierta parcial media frontend | El portafolio incluye tarjetas por departamento para director/administrador con proyectos activos, total de proyectos, riesgo y cobertura OKR. |
| HU-2.8 Cambiar estado de un proyecto | Cubierta parcial media frontend | Se agregaron reglas en `DataContext`: para activar se exige OKR/KR vinculado e indicadores por OKR; para finalizar se exige avance 100% o indicador cumplido; para archivar no se permite hacerlo directamente desde activo. |
| HU-3.1 Dashboard general de la Escuela | Cubierta parcial alta frontend | El dashboard fue reconstruido con KPIs dinamicos, semaforo por apuesta, resumen por departamento, indicadores cumplidos y tabla de proyectos sin avance reciente. |
| HU-3.5 Filtros globales en dashboards | Cubierta parcial media frontend | Se agrego `FiltersContext` con filtros compartidos por periodo, departamento, estado de proyecto y OKR, persistidos en `sessionStorage` y consumidos por dashboard y portafolio. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/context/FiltersContext.tsx` | Nuevo contexto de filtros globales con persistencia de sesion. |
| `src/app/App.tsx` | Se agrego `FiltersProvider` alrededor de las rutas. |
| `src/app/context/DataContext.tsx` | Se agregaron reglas de transicion de estado de proyecto y validaciones de activacion/finalizacion/archivo. |
| `src/app/pages/Proyectos.tsx` | Se mejoro vinculacion multiple proyecto-OKR, pesos, tipo de contribucion, filtros globales y tarjetas de vista Escuela. |
| `src/app/pages/FichaProyecto.tsx` | Se agrego edicion/actualizacion de indicadores de contribucion. |
| `src/app/pages/Dashboard.tsx` | Se reconstruyo el dashboard general para usar datos filtrados reales y filtros globales. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando despues del bloque 2

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistir en backend los filtros, vinculos proyecto-OKR, indicadores, reglas de estado y evaluaciones. | HU-2.2, HU-2.3, HU-2.8, HU-3.5 |
| Alta | Completar validaciones de estado con reglas finales del negocio, evidencias de cierre y auditoria de cambios. | HU-2.8, HU-4.6 |
| Media | Llevar los filtros globales a OKRs, jerarquia, reportes y dashboards especializados. | HU-3.2, HU-3.3, HU-3.4, HU-3.5 |
| Media | Implementar dashboard por OKR, por apuesta y por departamento con navegacion dedicada. | HU-3.2, HU-3.3, HU-3.4 |
| Media | Exportaciones reales PDF/CSV para dashboard, portafolio y reportes con filtros aplicados. | HU-2.6, HU-3.6, HU-3.7 |
| Media | Completar permisos transversales en rutas y acciones, no solo ocultamiento de botones. | HU-4.4, HU-4.5 |
| Baja / integracion | Integracion Jira, SSO institucional, directorio de usuarios, sincronizacion de roles y auditoria persistente. | HU-2.7, HU-4.1, HU-4.3, HU-4.6, HU-4.7 |
| Transversal | Agregar pruebas automatizadas unitarias, UI/E2E y coverage por HU. | Todas |

# Avances 18/05/2026 12:48 am

## Bloque 3 implementado

En este bloque se amplio la capa analitica del frontend. El objetivo fue avanzar las HUs de dashboards especializados y extender los filtros globales a vistas que todavia trabajaban con filtros locales.

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-3.2 Dashboard por OKR | Cubierta parcial alta frontend | Se agrego una vista analitica por OKR con selector de objetivo, cumplimiento, KRs, proyectos vinculados, indicadores y aporte evaluado promedio. |
| HU-3.3 Dashboard por apuesta estrategica | Cubierta parcial alta frontend | Se agrego una vista por apuesta con cumplimiento, metas vinculadas, OKRs, proyectos, riesgos y cadena apuesta -> metas -> OKRs -> proyectos. |
| HU-3.4 Dashboard por departamento | Cubierta parcial alta frontend | Se agrego una vista comparativa por departamento con OKRs, proyectos, activos, indicadores, cobertura OKR, cumplimiento y proyectos en riesgo. |
| HU-3.5 Filtros globales | Cubierta parcial alta frontend | Los filtros globales ahora se consumen tambien en OKRs, Jerarquia Estrategica, Reportes y la nueva vista de dashboards estrategicos. |
| Navegacion analitica | Implementada | Se agrego ruta `/dashboards` y opcion de sidebar "Dashboards" para director, administrador y jefe. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/pages/DashboardsEstrategicos.tsx` | Nueva pagina con dashboards por OKR, apuesta y departamento. |
| `src/app/routes.tsx` | Nueva ruta `/dashboards`. |
| `src/app/components/Sidebar.tsx` | Nueva opcion de navegacion "Dashboards". |
| `src/app/pages/OKRs.tsx` | Integracion de filtros globales de periodo, departamento y OKR. |
| `src/app/pages/JerarquiaEstrategica.tsx` | Integracion con filtros globales de periodo, departamento y OKR. |
| `src/app/pages/Reportes.tsx` | Reportes ahora calculan KPIs principales usando el alcance de filtros globales. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando despues del bloque 3

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistencia backend de dashboards, filtros guardados, evaluaciones, indicadores y vinculos. | HU-2.2, HU-2.3, HU-3.1, HU-3.5 |
| Alta | Profundizar dashboards con historico real por periodo y datos no ilustrativos. | HU-3.2, HU-3.3, HU-3.4, HU-3.7 |
| Media | Exportaciones reales PDF/CSV desde dashboards especializados con filtros aplicados. | HU-3.6, HU-3.7 |
| Media | Navegacion cruzada mas completa desde dashboards hacia OKRs, apuestas, departamentos y fichas de proyecto. | HU-3.2, HU-3.3, HU-3.4 |
| Media | Aplicar filtros globales a todos los reportes secundarios y modo presentacion. | HU-3.5 |
| Media | Completar permisos transversales de rutas y acciones con una matriz centralizada. | HU-4.4, HU-4.5 |
| Baja / integracion | Jira, SSO institucional, directorio, sincronizacion de roles y auditoria persistente. | HU-2.7, HU-4.1, HU-4.3, HU-4.6, HU-4.7 |
| Transversal | Agregar pruebas automatizadas y coverage por HU. | Todas |

---

# Avances 18/05/2026 1:02 a. m.

Segun mi analisis del frontend, ya se habia identificado que existen HUs completas, incompletas y faltantes: el frontend tenia avances solidos en jerarquia estrategica, OKRs, proyectos, dashboards base, filtros globales y reportes; seguian incompletas las HUs transversales de permisos centralizados, auditoria, gestion funcional de usuarios y exportaciones consistentes; y siguen faltando las piezas que dependen del backend, como persistencia real, SSO/directorio institucional, historicos reales, auditoria persistente de servidor e integraciones externas.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-4.4 Permisos por rol | Cubierta parcial alta frontend | Se agrego una matriz centralizada de permisos por rol y un wrapper de proteccion de rutas (`RequirePermission`) para dashboards, jerarquia, catalogos, OKRs, proyectos, reportes, usuarios, auditoria y modo presentacion. |
| HU-4.5 Control de acceso a rutas | Implementada en frontend | Las rutas sensibles ahora validan permisos antes de renderizar y muestran una pantalla de acceso restringido si el rol no aplica. |
| HU-4.6 Auditoria de acciones | Cubierta parcial frontend | Se agrego `AuditContext` con persistencia en `sessionStorage`, eventos mock iniciales y registro de acciones desde usuarios, dashboard, reportes y fichas de proyecto. |
| HU-4.7 Consulta de auditoria | Cubierta parcial frontend | Se creo la pagina `/auditoria` con filtros por modulo, resultado y busqueda, tabla de eventos y exportacion CSV. |
| Gestion de usuarios | Mejorada | La pantalla de usuarios ahora crea, edita, activa/desactiva y exporta usuarios en estado local, registrando cada accion en auditoria. |
| HU-3.6 Exportaciones CSV/PDF | Mejorada | Se centralizo el nombre de archivos, se agrego titulo temporal para impresion/PDF y se registran exportaciones en auditoria. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/security/permissions.ts` | Nueva matriz de permisos y helpers por rol. |
| `src/app/components/RequirePermission.tsx` | Nuevo wrapper para proteger rutas por permiso. |
| `src/app/components/AccessDenied.tsx` | Nueva pantalla de acceso restringido. |
| `src/app/context/AuditContext.tsx` | Nuevo contexto de auditoria con eventos mock y persistencia en sesion. |
| `src/app/pages/Auditoria.tsx` | Nueva vista de consulta/exportacion de auditoria. |
| `src/app/pages/Usuarios.tsx` | Gestion local funcional de usuarios, exportacion y auditoria. |
| `src/app/routes.tsx` | Rutas protegidas y nueva ruta `/auditoria`. |
| `src/app/components/Sidebar.tsx` | Nueva opcion de navegacion para Auditoria. |
| `src/app/pages/Dashboard.tsx`, `src/app/pages/Reportes.tsx`, `src/app/pages/FichaProyecto.tsx`, `src/app/pages/Proyectos.tsx` | Exportaciones conectadas a utilidades y/o auditoria; Proyectos ahora exporta CSV desde la vista filtrada. |
| `src/app/utils/exportUtils.ts` | Helpers de fecha/nombre de archivo y mejora de impresion/PDF. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando despues del bloque 4

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Conectar permisos, usuarios y auditoria con backend real, JWT/SSO y politicas del servidor. | HU-4.1, HU-4.3, HU-4.4, HU-4.6 |
| Alta | Persistir usuarios creados/editados, auditoria y configuraciones de permisos en base de datos. | HU-4.1, HU-4.6, HU-4.7 |
| Alta | Sustituir datos historicos ilustrativos por historico real por periodo en dashboards/reportes. | HU-3.2, HU-3.3, HU-3.4, HU-3.7 |
| Media | Completar exportaciones PDF con plantilla institucional real y descarga directa, no solo impresion del navegador. | HU-3.6 |
| Media | Agregar pruebas automatizadas de rutas protegidas, permisos, usuarios y auditoria. | HU-4.4, HU-4.5, HU-4.6 |
| Baja / integracion | Integrar directorio institucional para importacion/sincronizacion real de usuarios. | HU-4.1, HU-4.3 |

---

# Avances 18/05/2026 1:14 a. m.

Segun mi analisis del frontend, despues del bloque anterior quedaban HUs completas, incompletas y faltantes asi: permisos/auditoria/usuarios ya tenian una base funcional en frontend; dashboards y reportes seguian incompletos por usar historicos ilustrativos y exportaciones parciales; y siguen faltando las piezas dependientes del backend, especialmente persistencia real, SSO/directorio, auditoria de servidor e integraciones externas.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-3.7 Historico por periodo | Cubierta parcial frontend | Se agrego un helper reutilizable para calcular comparativos por periodo desde `periodosAcademicos`, OKRs, proyectos, evaluaciones e historico mock disponible. |
| HU-3.2 / HU-3.3 / HU-3.4 Dashboards especializados | Mejoradas | La vista `/dashboards` ahora exporta CSV/PDF por vista activa: OKR, apuesta o departamento. |
| HU-3.6 Exportaciones | Mejorada | `printPDF` agrega cabecera institucional temporal para impresion/PDF y conserva titulo del documento al terminar. |
| HU-3.5 Filtros globales | Mejorada | El modo presentacion ahora acota las apuestas mostradas usando filtros globales de periodo, departamento y OKR. |
| Navegacion cruzada | Mejorada | En dashboards especializados, los OKRs dentro de apuesta navegan a gestion de KRs y las filas de departamento actualizan el filtro global de departamento. |
| Reportes comparativos | Mejorados | Dashboard y Reportes reemplazan datos ilustrativos de comparativo/tendencia por calculos derivados del contexto y `historicoOKRs`. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/utils/analytics.ts` | Nuevo helper para construir comparativos por periodo y tendencias por apuesta. |
| `src/app/pages/Dashboard.tsx` | Comparativo por periodo ahora se calcula con datos del contexto e historico mock. |
| `src/app/pages/Reportes.tsx` | Tendencias y comparativo ahora usan helpers analiticos reutilizables. |
| `src/app/pages/DashboardsEstrategicos.tsx` | Exportacion CSV/PDF, auditoria de exportaciones y navegacion cruzada adicional. |
| `src/app/pages/PresentacionDashboard.tsx` | Modo presentacion respeta filtros globales para determinar las apuestas visibles. |
| `src/app/utils/exportUtils.ts` | Cabecera institucional de impresion/PDF y limpieza posterior. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando despues del bloque 5

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistir historicos reales por periodo desde backend en lugar de historico mock parcial. | HU-3.7 |
| Alta | Conectar usuarios, permisos y auditoria con backend, JWT/SSO y politicas de servidor. | HU-4.1, HU-4.3, HU-4.4, HU-4.6 |
| Media | Crear plantilla PDF real con paginacion/descarga directa, no solo `window.print`. | HU-3.6 |
| Media | Completar modo presentacion con metricas internas tambien filtradas, no solo la lista de apuestas visibles. | HU-3.5 |
| Media | Agregar pruebas automatizadas de analytics, exportaciones, permisos y rutas. | HU-3.6, HU-3.7, HU-4.4 |
| Baja / integracion | Integracion Jira/directorio institucional y sincronizacion automatica de usuarios. | HU-2.7, HU-4.1, HU-4.3 |

---

# Avances 18/05/2026 1:24 a. m.

Segun mi analisis del frontend, despues del bloque 5 quedaban completas o casi completas las HUs de dashboards, filtros globales, permisos y auditoria frontend; seguian incompletas las HUs de modo presentacion filtrado a profundidad, control de consistencia de datos y pruebas automatizadas; y siguen faltando por backend la persistencia real, SSO/directorio, historicos definitivos, auditoria de servidor e integraciones externas.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-3.5 Filtros globales en modo presentacion | Mejorada | `PresentacionDashboard` ahora construye un dataset filtrado y lo usa en portada, slides de apuesta y cierre; las metricas internas ya respetan periodo, departamento, OKR y estado de proyecto. |
| HU-3.2 / HU-3.3 / HU-3.4 Coherencia analitica | Mejorada | Las cifras de apuestas, OKRs, proyectos y metas en presentacion salen del contexto filtrado, no de arreglos estaticos globales. |
| Validacion de consistencia estrategica | Implementada en frontend | Se agrego un validador para detectar OKRs sin apuesta/meta valida, OKRs activos sin KRs, KRs sin proyectos, proyectos activos sin OKR/KR valido, proyectos sin avance reciente e indicadores faltantes. |
| Alertas operativas | Implementadas | El dashboard principal muestra un resumen de inconsistencias estrategicas con conteo de severidad alta/media y las primeras alertas accionables. |
| Preparacion para QA | Parcial | Las validaciones quedan centralizadas en `strategicValidation.ts`, listas para cubrir con pruebas automatizadas cuando se agregue framework de test. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/pages/PresentacionDashboard.tsx` | Refactor para usar dataset filtrado en portada, slides y cierre. |
| `src/app/utils/strategicValidation.ts` | Nuevo helper de validacion de consistencia estrategica. |
| `src/app/pages/Dashboard.tsx` | Nuevo panel de consistencia estrategica con severidades y alertas principales. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia conocida | No bloqueante | Vite mantiene advertencia de chunk JS mayor a 500 kB. |

## Lo que queda faltando despues del bloque 6

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Conectar validaciones con reglas de backend para que bloqueen o adviertan segun politicas reales. | HU-4.4, HU-4.6 |
| Alta | Persistir historicos, auditoria, usuarios y permisos reales en backend. | HU-3.7, HU-4.1, HU-4.6 |
| Media | Agregar framework de pruebas automatizadas y cubrir analytics, validaciones, permisos y rutas. | Todas |
| Media | Permitir exportar el reporte completo de inconsistencias estrategicas. | HU-3.6, HU-4.7 |
| Media | Optimizar bundle con code splitting para eliminar la advertencia de chunk grande. | Transversal |
| Baja / integracion | Integracion Jira/directorio institucional y sincronizacion automatica de usuarios. | HU-2.7, HU-4.1, HU-4.3 |

---

# Avances 18/05/2026 1:28 a. m.

Segun mi analisis del frontend, despues del bloque 6 quedaban completas o muy avanzadas las HUs de dashboards, filtros globales, permisos, auditoria y validaciones frontend; seguian incompletas la consulta completa/exportable de consistencia estrategica y la optimizacion del bundle; y siguen faltando por backend la persistencia real, SSO/directorio, reglas de servidor, historicos definitivos e integraciones externas.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| Reporte de consistencia estrategica | Implementado en frontend | Se creo la vista `/consistencia` con filtros por severidad, modulo y busqueda, tabla completa de hallazgos, navegacion hacia entidades y exportacion CSV. |
| HU-3.6 Exportaciones | Mejorada | El reporte completo de inconsistencias se puede exportar con los filtros aplicados. |
| HU-4.7 Auditoria | Mejorada | La exportacion de consistencia registra evento en auditoria. |
| Navegacion operativa | Mejorada | El panel de consistencia del Dashboard ahora tiene acceso directo a la vista completa. |
| Optimizacion transversal | Implementada | Las rutas principales pasan a `React.lazy` + `Suspense`, separando pantallas en chunks por ruta. |
| Performance de build | Mejorada | El bundle inicial baja a ~338 kB y desaparece la advertencia de chunk JS mayor a 500 kB. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/pages/Consistencia.tsx` | Nueva pagina de reporte completo de consistencia estrategica. |
| `src/app/components/RouteLoading.tsx` | Nuevo fallback visual para carga diferida de rutas. |
| `src/app/routes.tsx` | Refactor a lazy loading/code splitting por ruta, manteniendo proteccion por permisos. |
| `src/app/security/permissions.ts` | Nuevo permiso `consistencia.view`. |
| `src/app/components/Sidebar.tsx` | Nueva opcion de navegacion "Consistencia". |
| `src/app/components/Header.tsx` | Nuevo titulo/breadcrumb para `/consistencia`. |
| `src/app/pages/Dashboard.tsx` | Boton "Ver todo" hacia reporte completo de consistencia. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia de chunk grande | Resuelta | Ya no aparece advertencia de chunks mayores a 500 kB. |
| Bundle inicial | Mejorado | El chunk inicial queda alrededor de 338 kB; las paginas se dividen en chunks dedicados. |

## Lo que queda faltando despues del bloque 7

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Conectar reporte de consistencia con reglas del backend y severidades oficiales. | HU-4.4, HU-4.6 |
| Alta | Persistir historicos, auditoria, usuarios y permisos reales en backend. | HU-3.7, HU-4.1, HU-4.6 |
| Media | Agregar pruebas automatizadas de rutas lazy, permisos, validaciones y exportaciones. | Todas |
| Media | Mejorar navegacion desde hallazgos tipo KR hacia el OKR padre exacto. | HU-3.2, HU-4.7 |
| Baja / integracion | Integracion Jira/directorio institucional y sincronizacion automatica de usuarios. | HU-2.7, HU-4.1, HU-4.3 |

---

# Avances 18/05/2026 1:32 a. m.

Segun mi analisis del frontend, despues del bloque 7 quedaban avanzadas las HUs de consistencia, exportaciones, auditoria, dashboards y rendimiento; seguian incompletas la reutilizacion avanzada de filtros y la navegacion exacta desde algunos hallazgos de consistencia; y siguen faltando por backend persistencia real, reglas oficiales, SSO/directorio, historicos definitivos e integraciones externas.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-3.5 Filtros globales | Mejorada | Se agregaron presets de filtros globales persistidos en `localStorage`, con guardar, aplicar y eliminar. |
| Reutilizacion de vistas | Implementada en frontend | El Dashboard permite guardar combinaciones de periodo, departamento, estado de proyecto y OKR como vistas reutilizables. |
| HU-4.7 Consistencia / auditoria operativa | Mejorada | Los hallazgos de consistencia ahora incluyen `targetPath`, por lo que la vista `/consistencia` navega al destino exacto conocido. |
| Exportacion de consistencia | Mejorada | El CSV de consistencia ahora incluye la ruta sugerida para cada hallazgo. |
| Auditoria de presets | Parcial | Guardar un preset desde Dashboard registra evento informativo en auditoria. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/context/FiltersContext.tsx` | Presets de filtros persistidos y metodos `savePreset`, `applyPreset`, `deletePreset`. |
| `src/app/pages/Dashboard.tsx` | UI de presets de filtros y auditoria al guardar vistas. |
| `src/app/utils/strategicValidation.ts` | Hallazgos enriquecidos con ruta destino (`targetPath`). |
| `src/app/pages/Consistencia.tsx` | Navegacion usa `targetPath` y exporta la ruta en CSV. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia de chunk grande | OK | No reaparece la advertencia de chunks mayores a 500 kB. |

## Lo que queda faltando despues del bloque 8

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistir presets, usuarios, auditoria e historicos en backend real. | HU-3.5, HU-3.7, HU-4.1, HU-4.6 |
| Alta | Usar reglas oficiales del backend para consistencia y permisos. | HU-4.4, HU-4.6 |
| Media | Agregar pruebas automatizadas para filtros/presets, rutas lazy y validaciones. | Todas |
| Media | Aplicar UI de presets en otras vistas que consumen filtros globales, no solo Dashboard. | HU-3.5 |
| Baja / integracion | Integracion Jira/directorio institucional y sincronizacion automatica de usuarios. | HU-2.7, HU-4.1, HU-4.3 |

---

# Avances 18/05/2026 1:43 a. m.

Segun mi analisis del frontend, despues del bloque 8 quedaba completa la base de presets de filtros en Dashboard, pero seguia incompleta su reutilizacion en las demas vistas que consumen filtros globales; tambien quedaba pendiente mantener la auditoria de presets sin duplicar logica por pantalla. Lo que depende de backend sigue igual: persistencia real de presets, historicos, auditoria, usuarios, permisos y reglas oficiales.

## Lo implementado en este bloque

| HU / alcance | Estado actualizado | Evidencia frontend |
|---|---|---|
| HU-3.5 Presets de filtros globales | Mejorada | Se creo `FilterPresetsBar`, componente reutilizable para guardar, aplicar y eliminar presets. |
| Reutilizacion transversal | Implementada | Los presets ahora aparecen en Dashboard, Dashboards estrategicos, Reportes y Proyectos. |
| Sincronizacion de filtros locales | Mejorada | En Proyectos, al aplicar un preset tambien se sincronizan los estados locales de periodo, departamento, estado y OKR. |
| Auditoria de presets | Mejorada | La auditoria al guardar presets queda centralizada en el componente reutilizable. |
| Mantenibilidad frontend | Mejorada | Dashboard deja de tener logica propia duplicada para presets y usa el componente comun. |

## Archivos principales modificados

| Archivo | Cambio |
|---|---|
| `src/app/components/FilterPresetsBar.tsx` | Nuevo componente reutilizable de presets de filtros. |
| `src/app/pages/Dashboard.tsx` | Reemplazo de logica local por `FilterPresetsBar`. |
| `src/app/pages/DashboardsEstrategicos.tsx` | Integracion de presets y sincronizacion de OKR/departamento seleccionados. |
| `src/app/pages/Reportes.tsx` | Integracion de presets en la vista de reportes. |
| `src/app/pages/Proyectos.tsx` | Integracion de presets con sincronizacion de filtros locales. |

## Verificacion tecnica

| Verificacion | Resultado | Detalle |
|---|---|---|
| Build de produccion | OK | `npm run build` ejecuto correctamente con Vite. |
| Advertencia de chunk grande | OK | No reaparece la advertencia de chunks mayores a 500 kB. |

## Lo que queda faltando despues del bloque 9

| Prioridad | Pendiente | HUs relacionadas |
|---|---|---|
| Alta | Persistir presets y preferencias de usuario en backend real. | HU-3.5, HU-4.1 |
| Alta | Conectar auditoria de presets y filtros con auditoria de servidor. | HU-4.6, HU-4.7 |
| Media | Agregar pruebas automatizadas para presets, filtros globales y vistas con filtros locales. | HU-3.5 |
| Media | Permitir compartir presets entre usuarios/roles cuando exista backend. | HU-3.5, HU-4.4 |
| Baja / integracion | Integracion Jira/directorio institucional y sincronizacion automatica de usuarios. | HU-2.7, HU-4.1, HU-4.3 |
