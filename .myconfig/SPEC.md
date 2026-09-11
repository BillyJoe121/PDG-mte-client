# Spec: carga, rendimiento y modo presentación

## Objetivo

Entregar primero las historias de pantalla de carga, mejora de velocidad y modo presentación interactivo para usuarios institucionales autorizados. La aplicación debe comunicar trabajo real, mostrar contenido útil cuanto antes y convertir el contrato existente de presentación en una experiencia navegable para reuniones.

## Stack y comandos

- React 18, TypeScript, Vite 6, React Router 7, Vitest y Playwright.
- Desarrollo: `npm run dev`
- Pruebas unitarias: `npm run test:run`
- Cobertura: `npm run test:coverage`
- Build: `npm run build`
- E2E: `npm run test:e2e`

## Estructura relevante

- `src/app/components`: estados compartidos de interfaz.
- `src/app/pages`: dashboard y modo presentación.
- `src/app/services`: contratos HTTP y caché de pantallas.
- `src/styles`: estilos globales y adaptación a movimiento reducido.
- `src/**/*.test.tsx`: pruebas de comportamiento con Vitest y Testing Library.

## Convenciones

```tsx
if (loading) return <LoadingState label="Cargando presentación" />;
if (error) return <ErrorState message={error} onRetry={reload} />;
return <Presentation slides={slides} />;
```

- Componentes funcionales y estado en el propietario más cercano.
- HTML semántico, botones nativos y etiquetas accesibles.
- Animación breve y opcional; `prefers-reduced-motion` desactiva movimiento no esencial.
- No se introducen dependencias nuevas para estas historias.

## Estrategia de pruebas

- Pruebas de componente para estados de carga y navegación de diapositivas.
- Pruebas de servicio para garantizar que la presentación no solicite datos que no utiliza.
- Build de producción y comparación de tamaños antes/después.
- Verificación en navegador de carga, errores, teclado, pantalla completa y diseño adaptable.

## Límites

- Siempre: preservar permisos, cambios locales del usuario y contrato backend vigente.
- Consultar antes: cambiar DTOs, base de datos, autenticación o añadir dependencias.
- Nunca: añadir esperas artificiales, exponer datos mock como institucionales o usar el avance de Planner como avance del KR.

## Criterios de éxito

### Pantalla de carga

- El arranque y las rutas diferidas muestran un estado de carga de pantalla completa, legible y con `role="status"`.
- No existe temporizador mínimo; desaparece al terminar el trabajo real.
- El movimiento se reduce cuando el sistema lo solicita.

### Velocidad de carga

- El dashboard deja de bloquear su primer contenido por la consulta secundaria de tarjetas de objetivos.
- No se precargan en segundo plano todos los módulos ni los detalles de todos los proyectos al abrir el dashboard.
- El modo presentación solicita solo periodos y presentación, no metas ni tarjetas de objetivos sin uso.
- El build de producción no aumenta el JavaScript inicial respecto de la línea base registrada.

### Modo presentación

- Consume `/api/v1/presentation`, permite cambiar periodo y contempla carga, error, reintento y ausencia de diapositivas.
- Navega con botones y teclas configuradas por el backend; `Home`, `End` y `Escape` tienen comportamiento predecible.
- Puede entrar y salir de pantalla completa cuando el navegador lo permite y explica el fallo sin bloquear la presentación.
- Muestra contador, progreso, título, subtítulo y contenido resumido de cada diapositiva.
- Funciona con teclado, foco visible, movimiento reducido y anchos desde móvil hasta proyector.

## Preguntas abiertas

- La identidad visual definitiva para proyección puede ajustarse tras validación docente, sin cambiar el comportamiento definido aquí.
