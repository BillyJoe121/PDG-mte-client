# Endpoints a Resolver - Sincronización API PDG MTE

Este documento detalla las discrepancias actuales encontradas entre la documentación de la API del Backend (`api_endpoints_documentation.md`) y el código de implementación del Frontend. Se compone de dos categorías principales para facilitar la alineación entre ambos equipos.

---

## 1. ⚠️ Endpoints requeridos por el Frontend que el Backend NO ofrece
Estos métodos o rutas están implementados en el código de servicios y páginas del cliente, pero **no aparecen** registrados en el catálogo de endpoints de la API del backend:

*   **`PUT /api/v1/strategic-bets/{id}`**
    *   **Uso en Frontend:** Declarado en `strategicBetsApi.update` (`src/app/services/strategicApi.ts`), necesario para guardar los cambios de edición de una apuesta estratégica.
    *   **Estado en Backend:** No existe un endpoint para actualizar/editar apuestas en el `StrategicBetController` (solo se registran `GET` y `POST`).
*   **`PUT /api/v1/goals/{id}`**
    *   **Uso en Frontend:** Declarado en `goalsApi.update` (`src/app/services/strategicApi.ts`) y usado en `GestionMeta.tsx`, necesario para la edición de metas globales.
    *   **Estado en Backend:** No está definido un endpoint `PUT` en `GoalController` para actualizar los datos macro de la meta.
*   **`GET /api/v1/presentation`**
    *   **Uso en Frontend:** Declarado en `presentationApi.get` (`src/app/services/reportsApi.ts`) y consumido por la vista de presentación en `PresentacionDashboard.tsx`.
    *   **Estado en Backend:** No se encuentra documentado en la sección de reportes (`ReportController`) ni en ningún otro módulo del servidor.

---

## 2. 📋 Endpoints que el Backend ofrece y el Frontend AÚN NO utiliza
Estos endpoints están implementados y disponibles en el servidor, pero el cliente React los ignora o implementa su lógica de forma local/simulada (utilizando estados en memoria, contexts y mock data):

### A. Autenticación y Contexto (`AuthContextController`)
*   **`GET /api/v1/auth/me`**
    *   **Descripción:** Recupera la información del usuario autenticado actual, sus roles y capacidades.
    *   **Situación actual:** El frontend maneja la sesión de manera local mediante `sessionStorage` en su `AuthContext.tsx`.

### B. Módulo de Mundos Transversales (`WorldController`)
El cliente no maneja la entidad "Mundos" en su interfaz, por lo que no consume ninguno de estos endpoints:
*   **`GET /api/v1/worlds`**
*   **`POST /api/v1/worlds`**
*   **`PUT /api/v1/worlds/{id}`**
*   **`DELETE /api/v1/worlds/{id}`**

### C. Diagnóstico Detallado de Objetivos (`ObjectiveController`)
*   **`GET /api/v1/objectives/{id}/detail`**
    *   **Descripción:** Obtiene detalles de avance del objetivo junto a tendencias de cobertura.
    *   **Situación actual:** El frontend recupera los datos generales del objetivo y su tendencia de cumplimiento por separado.

### D. Operaciones con Docentes en Proyectos (`ProjectController`)
Aunque el backend permite gestionar la planta docente asignada y sus roles en los proyectos, el frontend no implementa estas llamadas:
*   **`GET /api/v1/projects/{id}/teachers`**
*   **`POST /api/v1/projects/{id}/teachers`**
*   **`DELETE /api/v1/projects/{id}/teachers/{tId}/roles/{rId}`**

### E. Planta Docente, Cargos y Roles Académicos (`PeopleController`)
El frontend cuenta con una pantalla de administración de usuarios (`Usuarios.tsx`), pero opera en memoria con una semilla local (`usuariosSeed`). Por ende, no consume:
*   **Roles:** `GET /api/v1/roles`, `POST /api/v1/roles`, `PUT /api/v1/roles/{id}`, `DELETE /api/v1/roles/{id}`
*   **Cargos:** `GET /api/v1/positions`, `POST /api/v1/positions`, `PUT /api/v1/positions/{id}`, `DELETE /api/v1/positions/{id}`
*   **Profesores:** `GET /api/v1/professors`, `POST /api/v1/professors`, `PUT /api/v1/professors/{id}`, `DELETE /api/v1/professors/{id}`, `GET /api/v1/professors/{id}/positions`, `POST /api/v1/professors/{id}/positions`, `DELETE /api/v1/professors/{id}/positions/{positionId}`

### F. Catálogos Organizacionales (`CatalogController`)
*   **Escuelas:** El frontend no maneja escuelas de forma dinámica, por lo que omite `GET /api/v1/schools`, `POST /api/v1/schools`, `PUT /api/v1/schools/{id}`, y `DELETE /api/v1/schools/{id}`.
*   **Mutaciones de Departamentos:** El cliente solo lista departamentos mediante `GET /api/v1/departments` (`departmentsApi.list`), pero no consume `POST /api/v1/departments`, `PUT /api/v1/departments/{id}`, ni `DELETE /api/v1/departments/{id}`.

### G. Logs de Auditoría (`AuditController`)
*   **`GET /api/v1/audit-logs`**
*   **`GET /api/v1/audit-logs/summary`**
    *   **Situación actual:** La pantalla `/auditoria` del frontend (`Auditoria.tsx`) opera con logs generados localmente por las acciones en curso del usuario y almacenados en un contexto React (`AuditContext.tsx`), sin comunicación real con la API del backend.

### H. Diagnóstico de Salud (`HealthController`)
*   **`GET /api/v1/health`**
    *   **Descripción:** Retorna la disponibilidad y estado del servicio de API. No consumido en la interfaz.
