# Plan: HU 8.1 Log de Auditoría y Tendencias

1. Fijar en pruebas el contrato de filtros, agregaciones y tendencia temporal.
2. Extender el resumen backend y completar eventos de eliminación faltantes.
3. Crear el cliente HTTP tipado de auditoría.
4. Reemplazar la pantalla mock por una vista conectada con filtros, analítica y detalle.
5. Verificar permisos, regresión, build y flujo real en Chromium.
6. Actualizar Graphify y registrar evidencia.

## Riesgo

Medio-alto: consulta datos persistidos y expone snapshots operativos, aunque no modifica el esquema. Se preservan el RBAC y los cambios locales existentes.
