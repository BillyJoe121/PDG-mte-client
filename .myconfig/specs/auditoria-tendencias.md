# Spec: HU 8.1 Log de Auditoría y Tendencias

## Objetivo

Permitir que un administrador consulte la trazabilidad real de las operaciones del MTE, identifique tendencias de actividad y revise qué cambió, quién lo cambió y cuándo.

## Alcance y supuestos

- El backend y la tabla `audit_log` son la fuente de verdad; la pantalla no usa datos mock ni `sessionStorage`.
- Solo `admin` consulta el módulo. `user` recibe denegación en frontend y HTTP 403 en backend.
- La tendencia representa cantidad de eventos por día dentro del rango y filtros activos.
- El rango inicial comprende los últimos 30 días, incluido el día actual.
- No se cambia el esquema: acción, entidad, actor, snapshots y fecha ya están persistidos.
- Los roles institucionales heredados continúan normalizándose mediante el RBAC existente.

## Contrato observable

- `GET /api/v1/audit-logs` filtra por acción, tipo/id de entidad, actor y fechas.
- `GET /api/v1/audit-logs/summary` aplica los mismos filtros y devuelve total, conteos por acción, entidad y actor, más una serie diaria sin huecos.
- La pantalla presenta carga, error con reintento, vacío, filtros, KPIs, tendencia, distribuciones, tabla y detalle antes/después.
- La exportación CSV contiene únicamente los eventos visibles.
- Las eliminaciones de catálogos permitidas quedan auditadas como `DELETE`.

## Seguridad y límites

- Siempre: autorización backend, rangos de fecha válidos, snapshots como texto no ejecutable y consultas acotadas al rango solicitado.
- No incluir secretos, tokens ni credenciales en snapshots.
- No añadir dependencias ni migraciones destructivas.
- No eliminar el contexto de auditoría local utilizado por otras pantallas hasta migrar sus mutaciones mock a backend.

## Pruebas

- Backend unitario: filtros de actor, desglose y serie diaria con días en cero.
- Backend E2E: contrato de resumen y acceso `admin`/`user`.
- Frontend servicio: serialización de filtros y contrato.
- Frontend componente: carga real, tendencias, filtros, detalle, error y vacío.
- Regresión: suites completas, build y Chromium.

## Criterios de éxito

- Un administrador puede responder qué cambió, sobre qué entidad, por quién y en qué momento.
- Los filtros afectan consistentemente el listado, KPIs y tendencias.
- La página no muestra seeds locales como si fueran eventos reales.
- Los estados de fallo no se confunden con una auditoría vacía.
