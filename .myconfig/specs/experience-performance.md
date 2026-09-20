# PDGPROYEC-69 — Experiencia, rendimiento y adaptación visual

## Decisiones implementadas

- El `Layout` protegido es una ruta diferida; el acceso público no paga el costo del shell institucional.
- `DeferredRender` usa `IntersectionObserver` con margen anticipado y reserva altura para cargar Recharts cerca del viewport sin introducir CLS.
- `RouteErrorBoundary` ofrece una salida recuperable si falla un chunk de ruta.
- `screenDataCache` aplica LRU con máximo de 80 entradas además del TTL y la deduplicación existentes.
- `npm run build:verified` construye y hace fallar el proceso si se exceden los presupuestos de entrada, CSS o gráficos.

## Medición

| Métrica | Antes | Después | Resultado |
|---|---:|---:|---|
| Entrada JS reportada por Vite | 130.63 kB gzip | 104.28 kB gzip | −20.2% |
| CSS global | 21.56 kB gzip | 21.59 kB gzip | Dentro de presupuesto |
| Gráfico de cobertura | 106.38 kB gzip, solicitado al renderizar | 106.39 kB gzip, solicitado cerca del viewport | Diferido sin regresión de tamaño |

La medición de presupuestos usa `gzipSync`, por lo que puede variar levemente frente al estimado mostrado por Vite. El límite se evalúa siempre con el mismo script.

## Verificación

- 195 pruebas unitarias/de integración frontend.
- 11 pruebas E2E Chromium.
- E2E móvil a 320 × 720: ancho del documento no supera el viewport y el chunk del gráfico no se solicita antes del scroll.
- Presupuestos actuales: entrada 101.83/120 kB, CSS 21.09/50 kB, gráficos 103.90/120 kB con la medición del guard.
