# Contrato OpenAPI pendiente

FastAPI todavía no suministra un contrato aprobado. **No existe `openapi.json` ni
`generated.ts` a propósito**: la aplicación compila sin DTO de negocio.

Cuando backend entregue el contrato real:

1. Revisar rutas, seguridad, errores, nullable, fechas, decimales y compatibilidad.
2. Exportar y versionar aquí `openapi.json`; no descargarlo de un backend activo en CI.
3. Ejecutar `npm run api:generate` con las versiones fijadas.
4. Versionar `src/lib/api/generated.ts` junto al contrato. Nunca editarlo a mano.
5. Ejecutar `npm run api:check` y añadir parsers Zod y pruebas de los DTO críticos.

`api:generate` falla explícitamente si falta el contrato. `api:check` informa la
dependencia pendiente mientras faltan ambos archivos; si existe el contrato, exige
generación idéntica. Si hay tipos generados sin contrato, también falla. Este control
forma parte de `npm run check` y CI, por lo que se activa sin editar el pipeline.

La generación usa la API de openapi-typescript y compara texto normalizado a LF,
sin depender de Git, shell ni servicios externos. El contrato debe ser autocontenido
o usar referencias locales versionadas; no referencias HTTP no reproducibles.
