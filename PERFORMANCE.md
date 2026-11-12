# Registro de rendimiento

| Fecha | Hipótesis | Línea base → resultado | Veredicto |
|---|---|---|---|
| 2026-09-16 | Separar el shell protegido reduce la descarga del acceso público. | Entrada 130.63 → 104.28 kB gzip (Vite). | Conservada: mejora de 20.2%. |
| 2026-09-16 | Posponer Recharts evita descargar 106.39 kB antes de que el usuario llegue a las gráficas. | Solicitud inicial presente → ausente en viewport 320 × 720; aparece al hacer scroll. | Conservada hasta el rediseño del dashboard, que dejó de usar Recharts; la prueba E2E ahora solo comprueba que no haya desborde horizontal. |
| 2026-09-16 | Acotar variantes de filtros evita crecimiento de memoria en sesiones largas. | Caché sin límite → máximo de 80 entradas. | Conservada: prueba automatizada con 120 variantes. |
| 2026-11-12 | La primera carga de cada pantalla espera a la API, que consultaba por fila (N+1). | Sentencias SQL por endpoint en la API: proyectos 287 → 9, consistencia 283 → 7, árbol de jerarquía 265 → 17, metas 195 → 13, apuestas 186 → 11, presentación 189 → 15, KR 154 → 8. | Conservada: `ScreenQueryBudgetE2ETest` en la API falla si alguna pantalla supera su presupuesto. |
| 2026-11-12 | Descargar en reposo el código de las pantallas principales evita esperar su chunk en la primera visita. | Chunk de la pantalla pedido al navegar → pedido en reposo tras iniciar sesión (Dashboard, Jerarquía, Proyectos, KR, Consistencia); se omite con ahorro de datos. | Conservada: `routePrefetch.test.ts`. |

Ejecutar `npm run build:verified` para reconstruir y comprobar los presupuestos vigentes.
