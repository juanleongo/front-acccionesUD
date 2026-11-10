# Verificación

## Landing institucional — 2026-11-09

- `npm run check`: formato, ESLint, TypeScript, fronteras y 41 pruebas unitarias
  aprobadas. OpenAPI continúa pendiente del contrato real.
- `npm run build`: correcto, landing `/` prerenderizada sin backend.
- `npm run test:e2e`: 3/3 aprobados, Chromium, Firefox y WebKit contra producción.
  Incluye tema persistido, filtros/búsqueda, resultados vacíos, diálogo y retorno
  de foco, menú móvil, ausencia de peticiones API y conexiones WS.
- Capturas de tema claro/oscuro a 1440 px y móvil a 320 px inspeccionadas.
- Comprobación adicional del ancho de página/cabecera en Chromium a 320, 375,
  480, 768, 1024, 1100, 1180, 1280 y 1440 px: sin desbordamiento horizontal.
- Se instalaron los navegadores de Playwright de la versión fijada. Firefox
  arrancó correctamente en esta ejecución; la limitación histórica siguiente
  no se reprodujo. CI remoto no ejecutado.

## Registro histórico del bootstrap

Ejecución local en Windows, Node 24.15.0 y npm 11.12.1, 2026-11-05.

| Control                         | Resultado observado                                               |
| ------------------------------- | ----------------------------------------------------------------- |
| `npm ci`                        | Correcto, instalación desde lockfile                              |
| `npm run check`                 | Correcto: formato, lint, TS estricto, fronteras, ciclos y pruebas |
| Vitest                          | 41 pruebas aprobadas en 6 archivos                                |
| `npm run build`                 | Correcto, página `/` prerenderizada                               |
| Playwright Chromium             | Smoke aprobado contra producción                                  |
| Playwright WebKit               | Smoke aprobado contra producción                                  |
| Playwright Firefox              | No pudo iniciar el ejecutable; falla antes de cargar la app       |
| `npm run api:generate`          | Código de salida 1 esperado: falta contrato real                  |
| `npm run api:check`             | Dependencia pendiente explícita; comparación preparada            |
| Auditoría npm de la instalación | 0 vulnerabilidades reportadas                                     |
| GitHub Actions                  | Workflow creado; no ejecutado remotamente en esta entrega         |

### Limitación del host Windows observada el 2026-11-05

Playwright informa `browserType.launch: spawn UNKNOWN` para Firefox. La ejecución
directa de `firefox.exe --version` también falla. El registro de Windows, proveedor
`SideBySide`, indica que no encuentra el ensamblado dependiente `mozglue` aunque
`mozglue.dll` está presente. Reinstalar Firefox de Playwright 1.64.1 no resolvió el
problema. Una prueba diagnóstica con Playwright 1.58.2 produjo el mismo error; se
conservó 1.64.1 en el proyecto, sin una degradación que no solucionaba el fallo.

No se omitió Firefox, no se modificó su binario y no se marcó el test como exitoso.
`npm run test:e2e` sigue ejecutando los tres proyectos y falla mientras el host no
pueda iniciar Firefox. CI configura los tres motores en Linux; su resultado remoto
debe confirmarse al subir el repositorio. La validación completa de los tres motores
queda pendiente de reparar el runtime de Firefox de este host o de ejecutar CI.

Para repetir tras resolver el entorno:

```sh
npm exec -- playwright install --force firefox
npm run build
npm run test:e2e
```

Para aislar un motor durante el diagnóstico:
`npm run test:e2e -- --project=firefox`. No eliminarlo del pipeline para obtener verde.
