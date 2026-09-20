# Registro de rendimiento

| Fecha | Hipótesis | Línea base → resultado | Veredicto |
|---|---|---|---|
| 2026-09-16 | Separar el shell protegido reduce la descarga del acceso público. | Entrada 130.63 → 104.28 kB gzip (Vite). | Conservada: mejora de 20.2%. |
| 2026-09-16 | Posponer Recharts evita descargar 106.39 kB antes de que el usuario llegue a las gráficas. | Solicitud inicial presente → ausente en viewport 320 × 720; aparece al hacer scroll. | Conservada: prueba E2E reproducible. |
| 2026-09-16 | Acotar variantes de filtros evita crecimiento de memoria en sesiones largas. | Caché sin límite → máximo de 80 entradas. | Conservada: prueba automatizada con 120 variantes. |

Ejecutar `npm run build:verified` para reconstruir y comprobar los presupuestos vigentes.
