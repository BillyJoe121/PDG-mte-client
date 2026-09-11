# Spec: catálogos y RBAC de dos roles

## Objetivo

Completar la gestión de periodos académicos y unidades de medida, y simplificar el control de acceso de MTE a dos roles: `admin` y `user`.

## Matriz de autorización

- `admin`: consulta y administra todos los módulos, catálogos y usuarios.
- `user`: consulta dashboard, jerarquía, reportes y presentación; crea y edita Objetivos y KRs.
- `user` no administra apuestas, metas, catálogos, proyectos, usuarios, auditoría ni consistencia.
- Los roles heredados de sesiones o del proveedor externo se normalizan: administrador → `admin`; cualquier rol institucional conocido no administrador → `user`.
- La protección debe existir en rutas y controles del frontend, y en cada operación privilegiada del backend.

## Historias incluidas

### HU 0.1 Gestionar periodos académicos

El administrador lista, crea y edita periodos con nombre, fechas y estado; puede activar, cerrar o eliminar un periodo sin uso. Duplicados, fechas inválidas y eliminaciones de periodos utilizados muestran errores comprensibles.

### HU 0.2 Gestionar unidades de medida

El administrador lista, crea y edita unidades con nombre, tipo y descripción; puede activar/inactivar o eliminar una unidad sin uso. Duplicados y eliminaciones de unidades utilizadas muestran errores comprensibles.

### HU 7.2 Control de acceso por rol

La aplicación utiliza únicamente `admin` y `user`. La navegación, las acciones y el backend aplican la matriz anterior y responden con acceso denegado ante navegación o llamadas forzadas.

## Stack y comandos

- Frontend: React, TypeScript, Vite, Vitest y Playwright.
- Backend: Java 17, Spring Boot/Security, Maven y JUnit.
- Frontend: `npm run test:run`, `npm run build`, `npm run test:e2e`.
- Backend: `./mvnw test` y `./mvnw verify` cuando el wrapper esté disponible; en Windows `mvnw.cmd`.

## Pruebas

- Unitarias de normalización y matriz de permisos en ambos lados.
- Componente de catálogos: carga, CRUD, validación y acceso restringido.
- Seguridad backend: `user` gestiona Objetivos/KRs y recibe 403 en operaciones administrativas.
- E2E: navegación visible y acceso forzado para ambos roles.

## Límites

- Siempre: autorización en backend, mínimo privilegio, compatibilidad transitoria con roles antiguos y preservación del trabajo local.
- No requiere: migración de tablas; los roles de autenticación vienen del contexto externo y no corresponden a la entidad de roles de profesores en proyectos.
- Nunca: confiar únicamente en botones ocultos o aceptar un rol enviado por el cliente como autoridad.

## Criterios de éxito

- `/auth/me` publica solo `ADMIN` y `USER` como roles soportados.
- El frontend solo modela `admin` y `user`, incluidas sesiones, demos y gestión visual de usuarios.
- `user` puede crear/editar Objetivos y KRs, y consultar reportes.
- `user` no puede mutar catálogos ni otros recursos administrativos, incluso llamando directamente a la API.
- `admin` conserva todas las capacidades.
- Catálogos cubre carga, vacío, error, validación, alta, edición, estado y eliminación protegida.
- Suites y builds aplicables pasan sin eliminar pruebas.
