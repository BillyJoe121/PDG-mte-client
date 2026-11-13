# Documentación Detallada de Endpoints - API PDG MTE

Este documento contiene un catálogo completo y detallado de **TODOS** los endpoints expuestos por la API de **PDG MTE**. Proporciona información sobre cada una de las acciones CRUD (Create, Read, Update, Delete), los parámetros que aceptan, las estructuras de datos que manejan y los permisos/roles necesarios para ejecutarlas.

---

## 🛠️ Resumen de Roles y Permisos
Los endpoints que requieren autenticación esperan un access token emitido por `POST /api/v1/auth/login` (cuentas administradas por la propia API) y controlan el acceso por rol (`@PreAuthorize`). Los roles del MTE son:
- **`ADMIN`**: administración de la plataforma (usuarios, catálogos, auditoría) además de la gestión estratégica.
- **`MANAGER`**: gestión estratégica (metas, apuestas, KRs, proyectos y reportes).
- **`CONTRIBUTOR`**: consulta y registro de avance en sus proyectos.
- **`VISITOR`**: solo lectura (tablero, estrategia, proyectos y presentación).

---

## 📋 Catálogo de Módulos y Endpoints

A continuación se detalla cada controlador de la aplicación.

```mermaid
graph TD
    A[MTE API Client] --> B(Security / Auth)
    A --> C(Dashboard / Analytics)
    A --> D(Strategy / OKRs)
    A --> E(Project Management)
    A --> F(Catalog / Parámetros)
    A --> G(People / Profesores & Roles)
    A --> H(Reports & Exports)
    A --> I(Audit Logs)
```

---

### 1. 🔑 Autenticación y Contexto (`AuthContextController`)
Gestiona la información del usuario autenticado actualmente y sus capacidades en el sistema.

* **Base URL:** `/api/v1/auth`

| Método | Ruta | Descripción | Acceso (PreAuthorize) |
|:---|:---|:---|:---|
| **`POST`** | `/api/v1/auth/login` | Inicia sesión con `{email, password}`; responde `{accessToken, tokenType, expiresIn, expiresAt}`. Bloquea la cuenta 15 minutos tras 5 intentos fallidos. | Público |
| **`POST`** | `/api/v1/auth/set-password` | Define la contraseña con el enlace de acceso: `{tokenHash, type, password}` (de 10 caracteres a 72 bytes). Responde 204. | Público |
| **`POST`** | `/api/v1/auth/logout` | Cierra la sesión: la API revoca el token, que desde entonces recibe 401. Responde 204. | Autenticado |
| **`POST`** | `/api/v1/auth/password` | Cambia la contraseña: `{currentPassword, newPassword}`. Responde 204. | Autenticado |
| **`GET`** | `/api/v1/auth/me` | Obtiene el contexto detallado, roles y capacidades del usuario logueado. | Autenticado |
| **`POST`** | `/api/v1/directory-users/{id}/access-link` | Genera un enlace de acceso de un solo uso: `{professorId, email, url, accountCreated}`. El MTE no envía correos. | `ADMIN` |

#### Detalles:
* **`GET /api/v1/auth/me`**
  * **Respuesta (`AuthMeResponse`):**
    ```json
    {
      "userContext": {
        "externalUserId": "Long",
        "username": "String",
        "email": "String",
        "roles": ["String"],
        "permissions": ["String"],
        "externalProfessorId": "Long",
        "professorName": "String",
        "departmentName": "String"
      },
      "supportedRoles": ["String"],
      "capabilities": ["String"]
    }
    ```

---

### 2. 📊 Tablero de Control (`DashboardController`)
Proporciona métricas agregadas y resúmenes de ejecución para la interfaz principal.

* **Base URL:** `/api/v1/dashboard`
* **Acceso General:** Requiere roles `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` o `PROFESOR`.

| Método | Ruta | Descripción | Parámetros Query |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/dashboard/summary` | Resumen global de ejecución del periodo (metas, KRs, proyectos). | `period` (String, opcional) |
| **`GET`** | `/api/v1/dashboard/projects/by-status` | Conteo de proyectos agrupados por su estado actual. | `period` (String, opcional) |
| **`GET`** | `/api/v1/dashboard/key-results/by-progress` | Agrupación de resultados clave por niveles de avance (buckets). | `period` (String, opcional) |
| **`GET`** | `/api/v1/dashboard/departments/summary` | Porcentaje de ejecución consolidado por departamento. | `period` (String, opcional) |
| **`GET`** | `/api/v1/dashboard/strategic-bets/summary` | Resumen de ejecución para cada apuesta estratégica. | `period` (String, opcional) |

---

### 3. 🎯 Dirección Estratégica (Mundos, Apuestas, Metas y KRs)

Gestiona la jerarquía de planeación estratégica en la institución. Se compone de varios controladores:

#### A. Mundos (`WorldController`)
Los entornos o ejes transversales de la planeación.
* **Base URL:** `/api/v1/worlds`

| Método | Ruta | Descripción | Acceso |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/worlds` | Lista todos los mundos registrados. | Autenticado |
| **`POST`** | `/api/v1/worlds` | Crea un nuevo mundo. | `ADMIN` |
| **`PUT`** | `/api/v1/worlds/{id}` | Actualiza un mundo por su ID. | `ADMIN` |
| **`DELETE`** | `/api/v1/worlds/{id}` | Elimina un mundo por su ID. | `ADMIN` |

* **Cuerpo de Solicitud (`WorldRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "description": "String"
  }
  ```

---

#### B. Apuestas Estratégicas (`StrategicBetController`)
Líneas de acción estratégicas institucionales.
* **Base URL:** `/api/v1/strategic-bets`

| Método | Ruta | Descripción | Acceso |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/strategic-bets` | Lista apuestas. Filtra opcionalmente por periodo académico. | Autenticado |
| **`POST`** | `/api/v1/strategic-bets` | Crea una apuesta estratégica. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` |
| **`GET`** | `/api/v1/strategic-bets/{id}` | Obtiene los detalles de una apuesta estratégica por su ID. | Autenticado |

* **Cuerpo de Solicitud (`StrategicBetRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "description": "String (Requerido)",
    "worldId": "Long",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }
  ```

---

#### C. Metas Globales (`GoalController`)
Metas macro de la facultad o institución a las que se vinculan KRs.
* **Base URL:** `/api/v1/goals`

| Método | Ruta | Descripción | Acceso |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/goals` | Lista todas las metas. Filtra opcionalmente por periodo académico. | Autenticado |
| **`POST`** | `/api/v1/goals` | Crea una meta macro. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` |
| **`GET`** | `/api/v1/goals/{id}` | Obtiene una meta específica por ID. | Autenticado |
| **`POST`** | `/api/v1/goals/{id}/periods/{periodId}` | Asocia un periodo académico a una meta. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` |
| **`DELETE`** | `/api/v1/goals/{id}/periods/{periodId}` | Desasocia un periodo académico de una meta. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` |

* **Cuerpo de Solicitud (`GoalRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "description": "String (Requerido)",
    "referenceIndicator": "String",
    "expectedValue": "BigDecimal (>= 0.00, Requerido)",
    "measurementUnitId": "Long (Requerido)",
    "worldId": "Long",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }
  ```

---

#### D. Resultados Clave (`KeyResultController`)
Indicadores cuantificables (KRs) vinculados N:M a Metas y Apuestas (al menos una de cualquiera). Desde la migración V10 ya no existe el nivel Objetivo.
* **Base URL:** `/api/v1/key-results`

| Método | Ruta | Descripción | Acceso |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/key-results` | Lista KRs. Filtros opcionales `goalId`, `strategicBetId`, `periodId`. Por defecto excluye los archivados; `includeArchived=true` los incluye. | Autenticado |
| **`POST`** | `/api/v1/key-results` | Crea un KR vinculado a Metas y/o Apuestas. | `ADMIN`, `MANAGER` |
| **`GET`** | `/api/v1/key-results/{id}` | Obtiene un KR. | Autenticado |
| **`PUT`** | `/api/v1/key-results/{id}` | Actualiza completamente la configuración de un KR. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |
| **`PATCH`** | `/api/v1/key-results/{id}/active` | Archiva (`active=false`) o restaura (`active=true`) un KR. Archivar devuelve 409 si el KR está cerrado o tiene iniciativas vinculadas activas. | `ADMIN`, `MANAGER` |
| **`GET`** | `/api/v1/key-results/{id}/progress-records` | Historial de avances manuales del KR, del más reciente al más antiguo (fecha, autor, valor y porcentaje anterior y actual). | Autenticado |

* **Cuerpo de Solicitud (`KeyResultRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "description": "String (Requerido)",
    "metric": "String (Requerido)",
    "baseValue": "BigDecimal (Requerido)",
    "targetValue": "BigDecimal (Requerido)",
    "measurementUnitId": "Long (Requerido)",
    "academicPeriodId": "Long (Requerido)",
    "goalIds": ["Long"],
    "strategicBetIds": ["Long"],
    "plannerUrl": "String (Opcional, https de Microsoft; vacío o null lo quita)"
  }
  ```
  `goalIds` y `strategicBetIds` no pueden ir vacíos a la vez (400). La respuesta (`KeyResultResponse`) incluye `plannerUrl`, `archived` y `archivedAt`. Un KR archivado no admite cambios, avances ni nuevos vínculos (409).

---

#### E. Árbol de Jerarquía Estratégica (`StrategicHierarchyController`)
* **Base URL:** `/api/v1/strategic-hierarchy`

| Método | Ruta | Descripción | Parámetros Query |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/strategic-hierarchy/tree` | Obtiene la estructura jerárquica en forma de árbol (Apuesta/Meta -> KR -> Proyecto) para visualización gráfica. | `period` (String, opcional) |

---

### 4. 📂 Proyectos e Integración (`ProjectController` & `ProjectKeyResultLinkController`)
Administra los proyectos académicos, su progreso y su vinculación con los Resultados Clave (KRs).

#### A. Proyectos (`ProjectController`)
* **Base URL:** `/api/v1/projects`

| Método | Ruta | Descripción | Acceso / Parámetros |
|:---|:---|:---|:---|
| **`POST`** | `/api/v1/projects` | Crea un proyecto académico (puede asociarlo inmediatamente a KRs). | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO`, `PROFESOR` |
| **`GET`** | `/api/v1/projects` | Filtra y lista proyectos. | `search`, `status`, `type`, `departmentId`, `period` (opcionales) |
| **`GET`** | `/api/v1/projects/{id}` | Obtiene los datos básicos del proyecto. | Autenticado |
| **`GET`** | `/api/v1/projects/{id}/detail` | Obtiene el detalle de avance, KPIs, historial y aportes del proyecto. | Autenticado |
| **`PUT`** | `/api/v1/projects/{id}` | Actualiza campos del proyecto. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |
| **`PATCH`** | `/api/v1/projects/{id}/status` | Cambia el estado del proyecto (Ej: *APPROVED*, *IN_PROGRESS*, *COMPLETED*). | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` |
| **`POST`** | `/api/v1/projects/{id}/progress` | Registra una nueva entrada de avance / progreso porcentual. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO`, `PROFESOR` |
| **`GET`** | `/api/v1/projects/{id}/history` | Lista la bitácora de avances reportados. | Autenticado |
| **`GET`** | `/api/v1/projects/{id}/impact-chain` | Muestra la cadena de impacto (a qué KRs, Metas y Apuestas está vinculado). | Autenticado |
| **`GET`** | `/api/v1/projects/{id}/contribution-chain`| Equivalente a `/impact-chain` para análisis de contribución. | Autenticado |
| **`GET`** | `/api/v1/projects/{id}/teachers` | Lista los docentes asignados al proyecto. | Autenticado |
| **`POST`** | `/api/v1/projects/{id}/teachers` | Asigna un docente con un rol y fecha de ingreso al proyecto. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |
| **`DELETE`** | `/api/v1/projects/{id}/teachers/{tId}/roles/{rId}` | Retira a un docente de un rol específico dentro del proyecto. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |
| **`POST`** | `/api/v1/projects/sync/trayectoria` | Sincroniza proyectos externos del sistema Trayectoria (Lenovo/Icesi). | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` (Requiere Header `Authorization`) |

* **Estructura para Registrar Progreso (`ProjectProgressRequest`):**
  ```json
  {
    "progressPercent": "BigDecimal (0.00 a 100.00, Requerido)",
    "comment": "String (Requerido)",
    "milestones": "String (Opcional)"
  }
  ```

---

#### B. Enlaces Proyecto-KR (`ProjectKeyResultLinkController`)
Crea y remueve el vínculo entre un proyecto y un resultado clave. El vínculo no tiene peso ni tipo de contribución.
* **Base URL:** `/api/v1/project-key-result-links`

| Método | Ruta | Descripción | Acceso / Parámetros |
|:---|:---|:---|:---|
| **`POST`** | `/api/v1/project-key-result-links` | Vincula un proyecto a un KR. | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |
| **`GET`** | `/api/v1/project-key-result-links` | Lista los enlaces existentes. Filtra por `projectId` o `keyResultId`. | Autenticado |
| **`DELETE`** | `/api/v1/project-key-result-links/{id}`| Elimina la vinculación del proyecto con el KR (desvinculación). | `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA`, `JEFE_DPTO` |

* **Cuerpo de Solicitud (`ProjectKeyResultLinkRequest`):**
  ```json
  {
    "projectId": "Long (Requerido)",
    "keyResultId": "Long (Requerido)"
  }
  ```

---

### 5. 👥 Personas, Profesores y Estructura Organizacional (`PeopleController`)
Permite administrar los cargos académicos, roles de proyectos y la planta docente.

* **Base URL:** `/api/v1` *(Nota: Esta ruta cuelga directamente de `/api/v1`)*

#### A. Roles en Proyectos (`/roles`)
Los roles que asumen los profesores dentro de los proyectos (ej. Líder, Investigador, Tutor).
* **Endpoints:**
  - `GET /api/v1/roles` (Autenticado) - Lista los roles.
  - `POST /api/v1/roles` (`ADMIN`) - Crea un rol.
  - `PUT /api/v1/roles/{id}` (`ADMIN`) - Actualiza un rol.
  - `DELETE /api/v1/roles/{id}` (`ADMIN`) - Elimina un rol (204 No Content).

* **Estructura del Cuerpo (`RoleRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "description": "String"
  }
  ```

#### B. Cargos Académicos (`/positions`)
Cargos como "Decano", "Jefe de Departamento", "Director de Escuela".
* **Endpoints:**
  - `GET /api/v1/positions` (Autenticado) - Lista cargos.
  - `POST /api/v1/positions` (`ADMIN`) - Crea un cargo.
  - `PUT /api/v1/positions/{id}` (`ADMIN`) - Actualiza un cargo.
  - `DELETE /api/v1/positions/{id}` (`ADMIN`) - Elimina un cargo.

#### C. Profesores / Docentes (`/professors`)
Gestión de la base de datos de profesores.
* **Endpoints:**
  - `GET /api/v1/professors` (Autenticado) - Lista profesores (permite filtrar por query `departmentId`).
  - `POST /api/v1/professors` (`ADMIN`) - Registra un profesor.
  - `PUT /api/v1/professors/{id}` (`ADMIN`) - Modifica datos de un profesor.
  - `DELETE /api/v1/professors/{id}` (`ADMIN`) - Elimina a un profesor de la base de datos.
  - `GET /api/v1/professors/{id}/positions` (Autenticado) - Lista los cargos activos de un profesor.
  - `POST /api/v1/professors/{id}/positions` (`ADMIN`) - Asigna un cargo a un profesor.
  - `DELETE /api/v1/professors/{id}/positions/{positionId}` (`ADMIN`) - Retira un cargo a un profesor.

* **Cuerpo de Registro de Profesor (`ProfessorRequest`):**
  ```json
  {
    "name": "String (Requerido)",
    "email": "String (Email válido, Requerido)",
    "departmentId": "Long (Requerido)"
  }
  ```

---

### 6. 🗂️ Catálogos Paramétricos (`CatalogController`)
Catálogos base necesarios para la configuración de las metas, KR y organización de la facultad.

* **Base URL:** `/api/v1` *(Nota: Esta ruta cuelga directamente de `/api/v1`)*

#### A. Unidades de Medida (`/measurement-units`)
Unidades para medir metas e indicadores (ej. "Porcentaje", "Cantidad de Publicaciones", "Pesos").
* **Endpoints:**
  - `GET /api/v1/measurement-units` (Autenticado) - Lista unidades.
  - `POST /api/v1/measurement-units` (`ADMIN`) - Crea unidad.
  - `PUT /api/v1/measurement-units/{id}` (`ADMIN`) - Modifica unidad.
  - `PATCH /api/v1/measurement-units/{id}/active` (`ADMIN`) - Habilita/Inhabilita unidad.
  - `DELETE /api/v1/measurement-units/{id}` (`ADMIN`) - Elimina unidad.

#### B. Periodos Académicos (`/academic-periods`)
Gestión de años y semestres/trimestres (ej: "2026-1", "2026-Q2").
* **Endpoints:**
  - `GET /api/v1/academic-periods` (Autenticado) - Lista periodos.
  - `POST /api/v1/academic-periods` (`ADMIN`) - Crea periodo.
  - `PUT /api/v1/academic-periods/{id}` (`ADMIN`) - Actualiza periodo.
  - `PATCH /api/v1/academic-periods/{id}/status` (`ADMIN`) - Cambia estado del periodo (*OPEN*, *CLOSED*, *LOCKED*).
  - `PATCH /api/v1/academic-periods/{id}/active` (`ADMIN`) - Habilita/Inhabilita periodo.
  - `DELETE /api/v1/academic-periods/{id}` (`ADMIN`) - Elimina periodo.

#### C. Escuelas Académicas (`/schools`)
Escuelas que agrupan departamentos (ej: "Escuela de Ciencias de la Educación").
* **Endpoints:**
  - `GET /api/v1/schools` (Autenticado) - Lista escuelas.
  - `POST /api/v1/schools` (`ADMIN`) - Crea escuela.
  - `PUT /api/v1/schools/{id}` (`ADMIN`) - Modifica escuela.
  - `DELETE /api/v1/schools/{id}` (`ADMIN`) - Elimina escuela.

#### D. Departamentos (`/departments`)
Departamentos académicos (ej: "Departamento de TIC").
* **Endpoints:**
  - `GET /api/v1/departments` (Autenticado) - Lista departamentos.
  - `POST /api/v1/departments` (`ADMIN`) - Crea departamento.
  - `PUT /api/v1/departments/{id}` (`ADMIN`) - Modifica departamento.
  - `DELETE /api/v1/departments/{id}` (`ADMIN`) - Elimina departamento.

---

### 7. 📄 Generación de Reportes y Exportación (`ReportController`)
Generación de consolidados e informes de avance en múltiples formatos.

* **Base URL:** `/api/v1/reports`
* **Acceso General:** Requiere roles `ADMIN`, `DECANO`, `DIRECTOR_ESCUELA` o `JEFE_DPTO`.

| Método | Ruta | Descripción | Parámetros Query |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/reports/general` | Reporte general consolidado de cumplimiento. | `period`, `departmentId` (opcionales) |
| **`GET`** | `/api/v1/reports/departments` | Obtiene un consolidado detallado clasificado por departamento académico. | `period` (opcional) |
| **`GET`** | `/api/v1/reports/key-results/ranking` | Ranking de KRs basado en su nivel de cumplimiento. | `period`, `departmentId` (opcionales) |
| **`GET`** | `/api/v1/reports/period-comparison`| Compara el rendimiento de la facultad entre dos periodos diferentes. | `basePeriod` (req), `comparePeriod` (req), `departmentId` (opcionales) |
| **`GET`** | `/api/v1/reports` | Reporte de datos crudos unificados para grids de información. | `period`, `departmentId` (opcionales) |
| **`GET`** | `/api/v1/reports/export.csv` | Exporta el reporte consolidado en formato plano **CSV** (descarga). | `period`, `departmentId` (opcionales) |
| **`GET`** | `/api/v1/reports/export.pdf` | Exporta el reporte estructurado en formato **PDF** imprimible. | `period`, `departmentId` (opcionales) |

---

### 8. 🔍 Logs de Auditoría (`AuditController`)
Mantiene un registro histórico de todas las acciones de mutación (creación, edición, eliminación) ejecutadas en el sistema para control de calidad.

* **Base URL:** `/api/v1/audit-logs`
* **Acceso General:** Exclusivo para el rol `ADMIN`.

| Método | Ruta | Descripción | Parámetros Query (Opcionales) |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/audit-logs` | Lista detallada de logs registrados en base de datos. | `action`, `entityType`, `entityId`, `from` (Instant ISO), `to` (Instant ISO) |
| **`GET`** | `/api/v1/audit-logs/summary` | Estadísticas resumidas (cantidad de eventos por entidad, etc.). | `action`, `entityType`, `entityId`, `from` (Instant ISO), `to` (Instant ISO) |

---

### 9. 🏥 Estado del Servicio (`HealthController`)
Módulo de diagnóstico rápido de disponibilidad de la API.

* **Base URL:** `/api/v1/health`

| Método | Ruta | Descripción | Acceso |
|:---|:---|:---|:---|
| **`GET`** | `/api/v1/health` | Devuelve el estado de ejecución ("status": "UP") y timestamp actual. | Público |
