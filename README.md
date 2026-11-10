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

### Correr local contra la API

Con la API corriendo en `http://localhost:8081`, el frontend la usa sin configuracion extra. Para evitar CORS o apuntar a otra API, define en `.env.local` (ignorado por Git):

```text
VITE_API_URL=/api/v1
VITE_API_PROXY_TARGET=https://<url-api>
```

Vite reenvia entonces las llamadas a `/api` hacia `VITE_API_PROXY_TARGET` (por defecto `http://localhost:8081`).

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

Verificacion de tipos (TypeScript en modo estricto, sin generar archivos; cubre `src/` y `tests/`):

```bash
npm run typecheck
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

### Integracion continua

`.github/workflows/ci.yml` corre `npm ci`, `npm run typecheck`, `npm run test:run`, las pruebas e2e (`npx playwright install --with-deps chromium` y `npm run test:e2e`) y `npm run build` con Node 24 en Ubuntu 24.04, en cada push y pull request a `develop`. El runner esta fijado en 24.04 porque Playwright 1.60 no tiene Chromium para Ubuntu 26.04. Si todo pasa en un push a `develop`, el job `deploy` llama al webhook de Coolify (ver [Despliegue en Coolify](#despliegue-en-coolify)); si algo falla, no se despliega.

## Inicio de sesión

El acceso es con correo institucional y contraseña. Las cuentas y contraseñas las administra la API del MTE; el cliente no habla con ningún otro servicio:

1. `/login` envía correo y contraseña a `POST /api/v1/auth/login` y recibe un access token.
2. El cliente valida ese token en `GET /api/v1/auth/me` y solo entonces abre la sesión con el rol y las capacidades que devuelve.
3. "Cerrar sesión" llama a `POST /api/v1/auth/logout` y borra la sesión local aunque la API no responda.
4. "Cambiar contraseña" (menú lateral) usa `POST /api/v1/auth/password` y pide la contraseña actual.

No hay registro abierto ni correo de recuperación. Un administrador genera desde **Usuarios** un enlace de acceso de un solo uso (`POST /api/v1/directory-users/{id}/access-link`) y se lo entrega a la persona por un canal institucional. El enlace abre `/establecer-contrasena`, que envía el token a `POST /api/v1/auth/set-password` y lo quita de la barra de direcciones al terminar. Sirve tanto para el primer ingreso como para restablecer una contraseña olvidada.

Las contraseñas tienen de 10 caracteres a 72 bytes (una tilde o una ñ ocupan dos). El access token vive solo en `sessionStorage`, se elimina al cerrar sesión o al vencer y nunca se acepta desde `localStorage`. Un rol que el cliente no reconoce se trata como visitante (solo lectura).

Ejecutar cobertura y pruebas e2e en secuencia:

```bash
npm run test:all
```

## Despliegue en Coolify

El sitio se publica como contenedor en el servidor Coolify de la universidad. El `Dockerfile` compila con Node 24 y sirve `dist/` con nginx (`nginx.conf`): las rutas del cliente, como `/establecer-contrasena?token_hash=...&type=...`, responden con `index.html`, los archivos de `assets/` se cachean y `index.html` no. `/healthz` es el health check del contenedor.

La direccion de la API se fija al compilar, con el argumento de build `VITE_API_URL` (obligatorio):

```bash
docker build --build-arg VITE_API_URL=https://<url-api>/api/v1 -t mte-client .
docker run --rm -p 8080:80 mte-client
```

En Coolify:

1. Nuevo recurso > Application desde el repositorio, rama `develop`, Build Pack "Dockerfile", puerto expuesto `80`.
2. En Environment Variables, `VITE_API_URL=https://<url-api>/api/v1` marcada como "Build Variable".
3. Dominio del sitio en Domains. Ese mismo origen va en `MTE_CORS_ALLOWED_ORIGINS` de la API, y `<dominio>/establecer-contrasena` en `MTE_ACCESS_LINK_URL`.
4. Desactivar "Auto Deploy" y copiar el Deploy Webhook. En GitHub (Settings > Secrets and variables > Actions) crear `COOLIFY_WEBHOOK` con esa URL y `COOLIFY_TOKEN` con un token de API de Coolify. Sin `COOLIFY_WEBHOOK`, CI no despliega.

Si GitHub no alcanza el servidor de la universidad, el job `deploy` falla y se despliega a mano con "Redeploy" en Coolify despues de ver CI en verde. La guia completa, con la API y la base, esta en `docs/despliegue-coolify.md` del repositorio de la API.

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
| `npm run typecheck` | Verifica los tipos con TypeScript (`tsconfig.json`). |
| `npm test` | Ejecuta Vitest en modo watch. |
| `npm run test:run` | Ejecuta Vitest una sola vez. |
| `npm run test:coverage` | Ejecuta Vitest con cobertura. |
| `npm run test:e2e` | Ejecuta pruebas e2e con Playwright. |
| `npm run test:all` | Ejecuta cobertura y luego pruebas e2e. |
