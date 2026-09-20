# PDGPROYEC-67 — Directorio institucional

## Alcance

- La página de Usuarios consulta y modifica datos persistentes mediante `/api/v1/directory-users`.
- Solo quien tenga la capacidad `usuarios.manage` puede acceder a las operaciones de administración.
- Los usuarios se filtran por texto, departamento, rol y estado, y se pueden exportar a CSV.
- Los roles editables son Administrador, Gestor estratégico y Colaborador.
- Desactivar conserva la persona y sus relaciones; eliminar exige que no existan cargos docentes ni responsabilidades de iniciativas.
- Los departamentos se administran en la misma pantalla y conservan su relación opcional con una escuela.

## Integridad

- El correo se normaliza en minúsculas y debe ser único.
- El backend valida los identificadores de departamento y escuela y registra auditoría de las mutaciones.
- El catálogo de responsables de iniciativas y el directorio de usuarios comparten la entidad institucional `Professor`.

## Verificación

- Pruebas E2E backend cubren alta, búsqueda, edición, desactivación, borrado, duplicados, roles inválidos y departamentos.
- Pruebas del cliente cubren serialización de filtros y métodos HTTP del servicio.
- La suite integral valida 208 pruebas backend y 191 frontend, además del build de producción.
