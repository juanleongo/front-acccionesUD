# Build, CI y operación

## Instalación reproducible

Utilizar Node 24.15.0 y npm 11.12.1 como indican `.nvmrc`, `engines` y
`packageManager`. En nvm-windows ejecutar `nvm install 24.15.0` y `nvm use 24.15.0`;
en otros sistemas nvm puede leer `.nvmrc`. Instalar npm 11.12.1 si difiere.
`npm ci` valida lockfile e instala el árbol exacto, sin modificarlo. `npm install`
se reserva para cambios deliberados de dependencias. No usar `--legacy-peer-deps`.

El pipeline GitHub Actions usa esas versiones y ejecuta `npm ci`, `npm run check`,
build y Playwright en tres motores. No requiere secretos ni backend. Los artefactos
de pruebas fallidas se conservan 7 días. El control OpenAPI es condicional **sólo**
por ausencia del contrato real; al incorporarlo se vuelve obligatorio automáticamente.

## Producción Node.js

```sh
npm ci
npm run check
npm run build
npm run start -- --hostname 0.0.0.0
```

El build no descarga fuentes ni consume FastAPI. Empaquetar `.next/`, `package.json`,
`package-lock.json`, `next.config.ts`, `node_modules/` de la instalación de producción
y `public/` cuando exista. Construir e instalar para la misma plataforma de destino
(no copiar node_modules de Windows a Linux). Puede usarse una etapa de build con
dependencias de desarrollo y una de runtime con `npm ci --omit=dev`. Mantener Node/npm
fijados y probar `next start` sobre el artefacto final. `PORT` lo gestiona Next.js.
No es una exportación estática: el runtime de servidor se conserva para RSC futuros.

`API_INTERNAL_ORIGIN` será configuración privada del runtime cuando se consuman
lecturas servidor. Debe suministrarla el despliegue, nunca una solicitud entrante.
El adaptador rechaza credenciales, paths, query y redirecciones; el origen permitido
es el configurado. La aplicación inicial compila y arranca sin esa variable.

## Gateway futuro

```text
Navegador -- HTTPS mismo origen --> Gateway
                                  |-- páginas / assets --> Next.js Node
                                  |-- /api/* -----------> FastAPI
                                  |-- /ws/* (Upgrade) --> FastAPI
Next.js -- origen interno fijo -------------------------> FastAPI
```

Configurar TLS, soporte WSS/Upgrade y timeouts con infraestructura. No cachear
HTML/RSC/API privados; usar private/no-store en las respuestas correspondientes y
políticas equivalentes en gateway. No habilitar CORS amplio para suplir el origen
único. No crear una segunda API de negocio en Route Handlers.

Promover un artefacto probado e inmutable y conservar el anterior para rollback.
La compatibilidad de contrato con el backend desplegado debe revisarse antes de
promoción. Las pruebas actuales son de infraestructura: autenticación, permisos,
CSRF, WS e integración deberán validarse cuando existan sus contratos e implementaciones.
