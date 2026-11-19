# Build, primera carga y operación

## Flujo de entrega

Usar Node 24.15.0 y npm 11.12.1, fijados en `.nvmrc`, `engines` y
`packageManager`. Construir e instalar para la plataforma de destino; no copiar
`node_modules` de Windows a Linux. El build se hace **antes** de recibir tráfico.
El proceso de producción ejecuta `next start`, nunca `next dev` ni un build por visita.

```sh
npm ci
npm run check
npm run build:measure
npm run test:production
npm run start -- --hostname 0.0.0.0
```

`npm run build` sigue disponible. `build:measure` ejecuta el mismo build y registra
duración y código de salida en `test-results/build-timing.json`.

Para medir sin la caché de compilación de Next:

```sh
npm run build:measure -- --cold
```

Este comando aparta `.next/cache`, construye y elimina sólo el respaldo de esa
caché si tiene éxito. Si falla, lo conserva para inspección. No borra código,
dependencias ni `.next/dev`. No ejecutarlo simultáneamente con otro build o con
un servidor de producción que esté usando ese artefacto. No es una instalación
fría completa: las cachés del sistema operativo y de npm siguen disponibles.
Comparar mediciones en el mismo runner, con las mismas versiones y recursos.

## Artefacto y configuración

El proyecto usa un servidor Node, no una exportación estática. La base operativa
actual es desplegar la revisión probada junto con `.next/`, `public/` y las
dependencias de producción (`npm ci --omit=dev`). Conservar `next.config.ts` y
`src/lib/config/schema.ts`, que la configuración importa. `country-state-city`
es una dependencia de runtime: debe estar instalada en el servidor. No publicar
código fuente ni `node_modules` mediante el servidor de archivos estáticos.

`API_INTERNAL_ORIGIN` debe estar definida **antes del build** cuando se utilizan
los rewrites de `next.config.ts`. Su destino queda en el artefacto compilado;
cambiar sólo la variable al arrancar no cambia esos rewrites. Usar un hostname
interno estable o reconstruir por entorno. Nunca introducir secretos en variables
`NEXT_PUBLIC_*`. La compilación no consulta FastAPI ni descarga fuentes.

Alternativa de infraestructura: gateway del mismo origen con `/api/v1/*` hacia
FastAPI. En ese caso el gateway debe conservar `/api/catalog/*` y `/api/health`
en Next. Configurar y probar `/ws/*` con Upgrade cuando se use WebSocket.

```text
Navegador -- HTTPS --> Gateway
                      |-- páginas, /_next/*, /api/catalog/*, /api/health --> Next
                      |-- /api/v1/* --> FastAPI (o rewrites de Next)
                      |-- /ws/* --> FastAPI, con Upgrade
```

No cachear respuestas privadas de cuentas, autenticación ni API de negocio.
Mantener las políticas de caché de los assets con hash de Next. El catálogo de
ubicaciones es público y admite caché HTTP de un día; React Query reutiliza sus
resultados durante un día dentro de la sesión.

## Primera carga y tamaño de JavaScript

El catálogo mundial de `country-state-city` se consulta exclusivamente en
`/api/catalog/locations`. El cliente solicita regiones por país y ciudades por
región al llegar al paso de identidad. No se envían ciudades del mundo completo,
coordenadas ni otros campos innecesarios. El servidor usa el paquete fijado en el
lockfile, sin dependencia de un proveedor externo de ubicaciones.

Mientras llegan los datos se muestra `LoadingState`; un error permite reintentar.
Los campos requeridos siguen vacíos hasta seleccionar datos reales. El contrato
KYC mantiene nombres de región y ciudad. El resto de consultas conserva el timeout
HTTP centralizado de 10 segundos y la política existente de reintentos; no sustituir
errores o cargas por saldos, usuarios o series de demostración.

## Controles automáticos y salud

`npm run test:production` inicia un proceso **nuevo** de `next start` en un puerto
local libre, sin reutilizar desarrollo, y comprueba:

- Readiness en menos de 30 segundos mediante `GET /api/health`.
- Respuesta HTML 200 de las siete rutas principales y disponibilidad de sus JS/CSS.
- Catálogo local de ubicaciones y rechazo de parámetros inválidos.
- Ningún chunk JavaScript de producción mayor de **1 MB sin comprimir**. Es una
  barrera contra regresiones grandes, no una medición de Core Web Vitals.

El informe `test-results/production-smoke.json` incluye tiempo de arranque,
primera respuesta por ruta y tamaño del mayor chunk. El comando termina su propio
servidor. No mide hidratación, experiencia móvil, latencia pública ni integración
autenticada con FastAPI; esas verificaciones siguen siendo necesarias en staging.

`/api/health` indica disponibilidad del proceso frontend y devuelve `no-store`.
No certifica que FastAPI, la base de datos o los proveedores externos estén sanos.
El balanceador debe esperar readiness antes de enviar tráfico. Configurar probes
independientes del backend y comprobar el flujo de login, KYC, mercados y órdenes
con cuentas de prueba antes de promover una versión.

CI ejecuta calidad, build medido, smoke de producción y Playwright. Conserva
`.next/cache` con claves por plataforma, versión de Node, lockfile y código, y
publica los informes de diagnóstico durante siete días. La caché acelera builds;
no sustituye el build ni constituye el artefacto desplegable.

Promover el mismo artefacto probado, conservar la versión anterior para rollback
y mantener disponibles sus assets durante el cambio para pestañas ya abiertas.
No reemplazar `.next` en el directorio de un proceso que está sirviendo tráfico;
usar directorios/versiones separados y cambiar el tráfico cuando la nueva esté lista.
La compatibilidad con el contrato del backend se valida antes de la promoción.

Referencias: [producción en Next.js](https://nextjs.org/docs/app/guides/production-checklist)
y [caché de builds en CI](https://nextjs.org/docs/app/guides/ci-build-caching).
