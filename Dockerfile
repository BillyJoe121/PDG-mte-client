# syntax=docker/dockerfile:1

FROM node:24.21.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Public API address, fixed into the bundle at build time (for example
# https://mte-api.example.edu/api/v1). Vite gives this variable priority over .env files.
ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "Build argument VITE_API_URL is required" >&2 && exit 1)
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# The Content-Security-Policy only allows API calls to the origin of VITE_API_URL.
RUN API_ORIGIN=$(printf '%s' "$VITE_API_URL" | sed -E 's#^(https?://[^/]+).*$#\1#') \
    && printf '%s' "$API_ORIGIN" | grep -Eq '^https?://[^/]+$' \
    || (echo "VITE_API_URL must start with http:// or https://" >&2 && exit 1) \
    && sed "s#__API_ORIGIN__#$API_ORIGIN#" nginx-security-headers.conf > /app/security-headers.conf

FROM nginxinc/nginx-unprivileged:1.28.2-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
