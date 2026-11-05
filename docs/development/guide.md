# Guía de desarrollo

## Comenzar una funcionalidad

Confirmar alcance y contrato con backend antes de crear código. Trabajar en una
rama de tarea, instalar con `npm ci` y comprobar la base con `npm run check`.
Sólo al existir una funcionalidad real crear `src/features/<nombre>/`. No copiar
carpetas vacías por anticipación. La ruta de `app/` debe componer la entrada pública,
no extraer hooks o servicios internos del módulo.

Ejemplo **documental**, no módulo implementado:

```text
features/<nombre>/
  components/ExamplePanel.tsx
  components/ExamplePanel.module.css
  hooks/use-example.ts
  api/example.api.ts
  model/example.types.ts
  model/example.schemas.ts
  model/example.mapper.ts
  query-keys.ts
  index.ts
  server.ts                 # sólo si hay capacidades exclusivas de servidor
```

Componentes de negocio permanecen en su funcionalidad. UI agnóstica del negocio
puede promoverse a `components/ui/` después de comprobar su reutilización. Utilidades
y contratos técnicos compartidos van en `lib/`, no en otro módulo de negocio.

## Entradas públicas y entorno

`index.ts` expone sólo tipos y componentes seguros para el cliente; preferir
exports explícitos. Un módulo que necesite cookies o entorno servidor usa otra
entrada `server.ts`, empezando por `import 'server-only'`. No reexportarla desde
`index.ts`. El archivo `client.ts`/`*.client.ts` usa `import 'client-only'`, o
`use client` cuando define una frontera React. Los componentes interactivos llevan
`use client`; mantener esa frontera tan pequeña como permita la funcionalidad.

Ejemplo de entrada:

```ts
export { ExamplePanel } from './components/ExamplePanel';
export type { ExampleView } from './model/example.types';
```

Entre módulos usar entradas públicas justificadas, sin ciclos; preferir composición
en `app/`. `lib/` y `components/` nunca importan `features/` o `app/`. Tampoco
importar `@/features/otro/api/...` mediante alias o rutas relativas. El verificador
resuelve ambos. Los tipos exclusivos de transporte no deben arrastrar un adaptador
servidor a un barrel cliente: extraer contratos puros a un archivo compartido.

## HTTP y contratos

El servicio de una funcionalidad recibe un `HttpPort` y valida datos desde `unknown`.
En navegador se inyecta `browserHttp` desde `@/lib/api/client`; en código servidor
se crea `createServerHttp()` desde `@/lib/api/server`. No usar `fetch`, construir
URLs internas ni acceder a cookies en componentes. No importar `fetch-transport`:
es implementación privada de los adaptadores.

Ejemplo técnico de uso (ruta suministrada por el contrato futuro, no endpoint real):

```ts
import type { HttpPort } from '@/lib/api';
import type { z } from 'zod';

export function readValidated<T>(
  http: HttpPort,
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
) {
  return http.request({ path, response: 'json', parse: schema.parse, signal });
}
```

Para respuestas sin cuerpo pedir `response: 'empty'`; para POST/PUT/PATCH indicar
`method` y `body`. Los query params van en `query`, nunca concatenados a `path`.
En frontend no calcular autorización ni inventar contratos. Exportar OpenAPI real,
generar DTO y validar campos críticos con Zod; transformar DTO a modelos de vista
mediante funciones puras. El puerto no hace retries. Tratar `ApiError.kind` y status
en la funcionalidad; no mostrar cuerpos HTML ni registrar datos sensibles.

## Consultas y mutaciones

Los hooks de cada funcionalidad definen keys, queryFn y staleTime. Pasar siempre el
`signal` de TanStack Query al servicio. Utilizar keys con `sessionEpoch` y `accountId`
para datos privados; normalizar filtros. Sólo lecturas idempotentes deben entrar en
`useQuery`. Las mutaciones tienen retry desactivado y no se ponen en cola offline.
Si una lectura no es reintentable, especificar `retry: false` en ella.

No duplicar snapshots en Context ni persistir caché financiera. Las futuras sesiones
deben limpiar caché y suscripciones explícitamente. No usar updates optimistas para
importes ni llamar `resumePausedMutations` o introducir plugins de persistencia.

## Nombres, estilos y pruebas

- Carpetas en kebab-case; componentes React en PascalCase (`ExamplePanel.tsx`).
- Hooks `use-example.ts` exportan `useExample`; funciones/variables camelCase;
  tipos, interfaces y esquemas de modelo con nombres descriptivos.
- Servicios `*.api.ts`, tipos `*.types.ts`, esquemas `*.schemas.ts`, mappers
  `*.mapper.ts`; adaptadores por entorno `client.ts` y `server.ts`.
- Pruebas `*.test.ts(x)` cerca del código. E2E `tests/e2e/*.spec.ts`.
- `import type` para tipos; alias `@/` entre áreas y relativos cortos dentro del
  módulo. Evitar barrels indiscriminados y desactivar reglas globalmente.
- CSS Modules por componente y tokens semánticos. Globales sólo reset/base/tokens.
  Breakpoints 30/48/64 rem: repetir el literal en @media con comentario del token;
  las variables CSS no funcionan como condición de media query.
- HTML semántico, encabezados ordenados, etiquetas, navegación por teclado, foco
  visible, contraste y errores que no dependan sólo del color. Preferir rem y
  respetar reducción de movimiento; revisar WCAG 2.2 AA en cada flujo real.

Vitest usa Node por defecto. Para componentes añadir `// @vitest-environment jsdom`
y Testing Library; consultar por rol/nombre accesible. MSW se inicia por suite con
`onUnhandledFrame: 'error'`, resetea handlers entre pruebas y se cierra al terminar.
Cubrir límites observables: HTTP fallido, JSON/esquema inválido, cancelación, timeout
y ausencia de reintentos de transporte. Los marcadores server-only/client-only sólo
se mockean en la prueba específica del adaptador, nunca en producción.

Las pruebas del grafo comprueban casos permitidos y prohibidos en directorios
temporales. Añadir un caso negativo cuando se cambie una regla, no sólo validar que
el repositorio actual pasa. Playwright usa el build real en Chromium, Firefox y WebKit.
No presentar mocks como evidencia de integración con FastAPI.

## Antes de una Pull Request

```sh
npm ci
npm run check
npm run build
npm run test:e2e
```

Instalar previamente los navegadores Playwright. Si cambia OpenAPI, generar tipos
y versionar ambos archivos; `api:check` rechazará diferencias. Revisar el diff por
secretos, alcance, APIs públicas y cambios de entorno. Actualizar ADR si cambia una
decisión y documentar dependencias pendientes. No declarar pruebas no ejecutadas.
