# PDGPROYEC-29 — SSO institucional

## Flujo

```text
Login → configuración pública → authorize + state + PKCE S256
      → /auth/callback → validación state/edad → exchange backend
      → bearer temporal → /auth/me → sesión MTE
```

## Controles

- Transacción en `sessionStorage`, máximo diez minutos y consumo único antes de usar la red.
- Challenge PKCE S256; verifier de 43 a 128 caracteres permitidos por RFC 7636.
- Redirect URI controlado por el backend; el cliente no puede suministrar uno durante el intercambio.
- Client secret opcional y solo backend; token URI y secreto no aparecen en `/config`.
- Bearer aceptado únicamente desde `sessionStorage`; los fallbacks históricos de `localStorage` fueron retirados.
- Token validado en `/auth/me`; el frontend no confía en claims decodificados localmente.
- Sesión con expiración y eliminación local explícita; no se solicitan ni conservan refresh tokens.

## Activación institucional pendiente

El administrador del proveedor debe registrar el client ID y el redirect exacto `<frontend>/auth/callback`, confirmar scopes y entregar endpoints/secret por variables seguras del despliegue. Hasta entonces `MTE_SSO_ENABLED=false` mantiene deshabilitado el botón y el modo mock sirve para desarrollo.
