# MTE - Modulo de Trazabilidad Estrategica

Este repositorio contiene el cliente web de **MTE - Modulo de Trazabilidad Estrategica**.

## Requisitos

- Node.js 18 o superior.
- npm.
- Navegadores de Playwright instalados para las pruebas e2e.

## Instalacion

```bash
npm install
```

En entornos limpios o de CI, tambien puedes usar:

```bash
npm ci
```

Si vas a correr pruebas end-to-end por primera vez, instala los navegadores de Playwright:

```bash
npx playwright install
```

## Correr el proyecto

Servidor de desarrollo:

```bash
npm run dev
```

Por defecto Vite levanta la aplicacion en:

```text
http://localhost:5173
```

### Correr local contra el backend de staging

Para levantar el frontend local conectado al backend desplegado en Render, usa:

```bash
npm run dev -- --host 127.0.0.1
```

Luego abre en el navegador:

```text
http://127.0.0.1:5173/
```

La configuracion local usa:

```text
VITE_API_URL=/api/v1
```

Vite reenvia las llamadas a `/api` hacia:

```text
https://pdg-mte-api-staging.onrender.com
```

Esto permite consumir el backend de staging desde el frontend local sin problemas de CORS.

Compilar para produccion:

```bash
npm run build
```

Compilar y verificar los presupuestos de rendimiento:

```bash
npm run build:verified
```

Previsualizar localmente el build generado:

```bash
npx vite preview
```

## Pruebas

Pruebas unitarias y de integracion en modo interactivo/watch:

```bash
npm test
```

Pruebas unitarias y de integracion una sola vez:

```bash
npm run test:run
```

Pruebas con cobertura:

```bash
npm run test:coverage
```

La cobertura usa Vitest con provider `v8`, genera reportes `text`, `json` y `html`, y guarda el reporte HTML en:

```text
coverage/index.html
```

El umbral configurado para statements, branches, functions y lines es de 90%.

Pruebas end-to-end con Playwright:

```bash
npm run test:e2e
```

Playwright levanta automaticamente el servidor con:

```bash
npm run dev -- --host 127.0.0.1
```

y prueba contra:

```text
http://127.0.0.1:5173
```

Reporte HTML de Playwright:

```text
playwright-report/index.html
```

## Inicio de sesión institucional

El cliente obtiene la configuración pública desde `GET /api/v1/auth/sso/config`; las URLs y credenciales del proveedor se configuran únicamente en el backend. El flujo usa Authorization Code + PKCE S256:

1. El navegador genera `state`, verificador y desafío PKCE de un solo uso.
2. El proveedor retorna a `/auth/callback`.
3. El backend intercambia el código con el redirect fijo configurado.
4. El cliente valida el bearer en `/api/v1/auth/me` antes de abrir la sesión.

El access token vive solo en `sessionStorage`, se elimina al cerrar sesión o expirar y nunca se acepta desde `localStorage`. MTE no almacena contraseñas ni refresh tokens. El acceso demo continúa disponible cuando el backend opera en `MTE_AUTH_MODE=mock`.

Ejecutar cobertura y pruebas e2e en secuencia:

```bash
npm run test:all
```

## Resumen de comandos

| Comando | Para que sirve |
| --- | --- |
| `npm install` | Instala dependencias. |
| `npm ci` | Instala dependencias reproducibles desde `package-lock.json`. |
| `npx playwright install` | Instala navegadores requeridos por Playwright. |
| `npm run dev` | Levanta el servidor de desarrollo. |
| `npm run build` | Genera el build de produccion en `dist/`. |
| `npm run build:verified` | Genera el build y valida presupuestos gzip. |
| `npx vite preview` | Sirve localmente el build generado. |
| `npm test` | Ejecuta Vitest en modo watch. |
| `npm run test:run` | Ejecuta Vitest una sola vez. |
| `npm run test:coverage` | Ejecuta Vitest con cobertura. |
| `npm run test:e2e` | Ejecuta pruebas e2e con Playwright. |
| `npm run test:all` | Ejecuta cobertura y luego pruebas e2e. |
