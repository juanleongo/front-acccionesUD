# Acciones UD — Frontend

Infraestructura inicial de la plataforma. Aplicación Next.js independiente de
FastAPI, preparada para desarrollo modular colaborativo. La única ruta es `/`,
una verificación de arranque. No incluye autenticación, módulos financieros,
integraciones reales ni servicios de negocio simulados.

## Requisitos y stack fijado

| Herramienta                            | Versión                  |
| -------------------------------------- | ------------------------ |
| Node.js LTS / npm                      | 24.15.0 / 11.12.1        |
| Next.js / React y React DOM            | 16.4.5 / 19.3.1          |
| TypeScript                             | 5.9.3                    |
| TanStack Query / Zod                   | 5.106.0 / 4.6.7          |
| ESLint / eslint-config-next / Prettier | 9.39.5 / 16.4.5 / 3.9.10 |
| Vitest / jsdom                         | 5.1.0 / 30.1.3           |
| React Testing Library / jest-dom       | 16.3.3 / 7.0.1           |
| MSW / Playwright                       | 3.0.3 / 1.64.1           |
| openapi-typescript                     | 7.13.0                   |

Fetch nativo, CSS Modules y variables CSS. Todas las dependencias directas tienen
versión exacta; `package-lock.json` fija las transitivas. `.npmrc` exige versiones
de runtime compatibles con `engines` y guarda versiones exactas. Sólo npm; no Yarn,
pnpm ni Bun. [ADR](docs/architecture/decisions.md) explica las decisiones de
compatibilidad de TypeScript/ESLint y el override de seguridad de minimatch.

Node 24 pertenece a una línea LTS del [calendario oficial](https://github.com/nodejs/Release),
y supera el mínimo Node 20.9 de [Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16).
Actualizar las versiones en una PR con lockfile y toda la verificación.

## Inicio rápido

```sh
git clone <URL-del-repositorio>
cd front-acccionesUD
# Con nvm/nvm-windows: instalar y seleccionar Node 24.15.0.
npm install --global npm@11.12.1
npm ci
npm run dev
```

Abrir [localhost:3000](http://localhost:3000). No es necesario arrancar FastAPI,
configurar credenciales ni copiar un archivo de entorno para esta página.

Si se desarrolla código servidor que utilice el transporte, copiar `.env.example`
a `.env.local` (`Copy-Item .env.example .env.local` en PowerShell) y configurar
`API_INTERNAL_ORIGIN` con el origen fijo de FastAPI. Sólo se valida cuando se crea
el adaptador servidor. No admite rutas, credenciales, query o fragmento. Ninguna
variable pública ni secreta se necesita para este bootstrap; nunca poner secretos
en `NEXT_PUBLIC_*`, archivos versionados o props de componentes cliente.

## Comandos

| Comando                                   | Uso                                                           |
| ----------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                             | Desarrollo Next.js                                            |
| `npm run build`                           | Build de producción sin backend                               |
| `npm run start`                           | Servir el build de producción                                 |
| `npm run lint`                            | Next, React, hooks, TypeScript e imports                      |
| `npm run typecheck`                       | Generar tipos de rutas y comprobar TS estricto                |
| `npm run test` / `npm run test:watch`     | Pruebas unitarias/infraestructura, una vez o en watch         |
| `npm run test:e2e`                        | Smoke contra build de producción en tres motores              |
| `npm run check:boundaries`                | Grafo AST: capas, módulos, entornos y ciclos                  |
| `npm run api:generate`                    | Generar DTO desde contrato real; falla si falta               |
| `npm run api:check`                       | Comparar generación; declara pendiente si aún no hay contrato |
| `npm run format` / `npm run format:check` | Aplicar o verificar Prettier                                  |
| `npm run check`                           | Formato, lint, tipos, fronteras, OpenAPI y pruebas unitarias  |

## Pruebas y build

```sh
npm run check
npm run build
npm exec -- playwright install chromium firefox webkit
npm run test:e2e
```

En Linux, instalar navegadores y dependencias con
`npm exec -- playwright install --with-deps chromium firefox webkit`.
Playwright levanta y cierra `next start` en el puerto 3000; debe estar libre.
`check` no instala navegadores ni incluye build/E2E: CI ejecuta ambos después.
Los fixtures HTTP son respuestas técnicas aisladas, no contratos financieros.
MSW no se carga en producción. Los reportes E2E fallidos quedan en
`playwright-report/` y `test-results/`, excluidos de Git.

## Organización

```text
contracts/                  # OpenAPI real pendiente e instrucciones
docs/architecture/          # Responsabilidades, seguridad y ADR FE-01 a FE-09
docs/development/           # Guía de equipo y despliegue
scripts/                    # Verificador AST/grafo y generación OpenAPI
src/app/                    # Layout, proveedor global y página mínima
src/features/               # Sólo README; sin módulos funcionales
src/components/             # Sólo README; UI reutilizable futura
src/lib/api/                # Puerto, adaptadores Fetch, errores y políticas Query
src/lib/config/             # Esquema y acceso perezoso a entorno servidor
src/lib/realtime/           # Contratos técnicos; sin conexiones
src/styles/                 # Tokens y estilos globales
tests/                      # Setup, fixtures técnicos, pruebas de grafo y E2E
.github/workflows/ci.yml    # Instalación reproducible y controles
```

Antes de una funcionalidad, leer [la arquitectura](docs/architecture/overview.md)
y [la guía del equipo](docs/development/guide.md). Para despliegue Node.js consultar
[operación y build](docs/development/deployment.md). OpenAPI y WS siguen pendientes
de contratos aprobados; ver [contracts](contracts/README.md) y
[decisiones y dependencias](docs/architecture/decisions.md).

Resultados ejecutados y limitación local de Firefox: [registro de verificación](docs/development/verification.md).
