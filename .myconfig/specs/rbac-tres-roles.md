# Spec: RBAC de tres roles

## Matriz canónica

- `admin`: administra todos los módulos, catálogos, usuarios, auditoría e integraciones.
- `manager`: gestiona jerarquía, Objetivos, KRs e iniciativas; consulta reportes y consistencia.
- `contributor`: consulta dashboard, jerarquía, Objetivos/KRs e iniciativas; registra avance operativo de iniciativas activas.

## Compatibilidad

El proveedor puede seguir enviando denominaciones institucionales. El backend normaliza administrador a `ADMIN`; decano, director, jefe y el antiguo `USER` a `MANAGER`; profesor y tutor a `CONTRIBUTOR`. `/auth/me` devuelve el rol normalizado y capacidades explícitas.

## Seguridad

La autorización decisiva se ejecuta en Spring Security. El cliente utiliza las capacidades publicadas para ocultar controles y proteger rutas, pero no se considera una frontera de seguridad. Registrar avance es un permiso distinto de crear, editar, cambiar estado o vincular una iniciativa.
