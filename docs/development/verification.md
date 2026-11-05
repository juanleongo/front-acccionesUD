# Verificación del bootstrap

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

## Limitación del host Windows

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
