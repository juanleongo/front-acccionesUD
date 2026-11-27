# Vistas preparadas para integrar capacidades del backend

Revisión del 27 de noviembre de 2026 sobre el código local de ambos repositorios.
Backend inspeccionado en lectura, con HEAD `069ecd1` y sus cambios locales
preexistentes. No se descargaron commits remotos ni se modificó el backend.

## Alcance y acceso a la revisión

Abrir `/vista-previa` en el frontend, por ejemplo
`http://localhost:3000/vista-previa` durante desarrollo. Es una ruta independiente,
sin enlaces nuevos en el dashboard ni formularios conectados a servicios reales.
Tiene `robots: noindex, nofollow`.

El encabezado identifica explícitamente los ejemplos y permite revisar carga,
vacío, error, permisos, los dos roles de comisiones y estados de suscripción.
Los botones de guardar/confirmar solo muestran un aviso de vista previa: **no
guardan, no generan códigos, no revocan sesiones y no cobran**. El cambio de tema
e idioma sí usa las preferencias visuales existentes del navegador.

Los ejemplos de nombres, fechas, planes e importes solo viven en
`src/features/account-workspace/preview-data.ts` y en el contenedor de revisión.
No deben usarse como `initialData`, `placeholderData`, fallback de errores ni
fuente de datos del dashboard real.

## Comparación con las vistas existentes

| Área del backend                          | Estado anterior del frontend                                                       | Diseño preparado                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mercado: listas, alertas y notificaciones | Había explorador, cotizaciones, gráficos y calendario; faltaba su espacio personal | Listas con logos, alta de lista/acción, alerta con condición/precio, pausar/reactivar/eliminar y bandeja de avisos                |
| Identidad: sesiones y recuperación        | Ya había acceso con MFA y presentación de códigos iniciales                        | Sesión actual/otros dispositivos, cierre individual o de las demás, confirmación para renovar códigos                             |
| Identidad: preferencias                   | Ya había perfil, KYC, intereses y nivel                                            | Canales por tipo de aviso, conexión Telegram, vista de portafolio y controles de órdenes                                          |
| Fondos: suscripciones                     | Ya había billetera, bancos, movimientos y conversión FX                            | Plan mensual/anual, revisión de pago, estados de suscripción, cancelar renovación, historial y detalle de pagos                   |
| Administración: comisiones propias        | Ya había gestión administrativa de comisiones/tarifas                              | Historial del inversionista y del comisionista, filtros compatibles con cada rol, distribución e importes históricos desconocidos |

No se duplicaron las vistas ya implementadas de M03, M05, M06, perfil editable
ni administración M07. Las capacidades anteriores de la tabla no se presentan
como commits recién publicados: son brechas entre la implementación local del
backend y las vistas existentes.

## Componentes y punto de integración

`src/features/account-workspace/index.ts` exporta los cinco componentes de
presentación, `ViewBoundary`, sus modelos y `WorkspaceCommand`. No importa datos
de ejemplo. `client.ts` exporta exclusivamente el contenedor de revisión.

Cada componente recibe datos por props y emite una intención con `onCommand`.
Ubicación prevista al integrar: seguimiento y alertas en Mercados; seguridad y
preferencias en Mi Perfil; Prémium en Billetera/cuenta; comisiones del usuario en
Portafolio y las del profesional dentro de su portal. La navegación de revisión
no debe convertirse en un selector de roles para usuarios reales.

Los comandos conservan importes como strings decimales. El adaptador futuro debe
validar respuestas con Zod y usar `browserHttp`; no se ha cambiado OpenAPI ni
añadido transporte HTTP. Los componentes no reconstruyen comisiones ni totales:
se reciben del servidor. `Amount` solo formatea la visualización.

El contenedor integrado debe manejar autenticación, permisos, consulta, estado de
mutación, errores de campos/409/422/503, invalidación y actualización de props.
Durante una mutación debe impedir envíos duplicados y conservar el borrador ante
errores. Las vistas de carga/error no deben poblarse con ejemplos. Los formularios
de preferencias toman su borrador inicial de props: montarlos después de la
consulta y usar una clave de identidad/versión cuando corresponda restablecerlos.

### Mercado: fuentes y reglas comprobadas

Fuentes backend: `market_data/adapters/inbound/http/routers/{watchlists,alerts,
notifications}.py`, `schemas/watchlists.py`, `domain/{watchlists,alerts}.py`.

| Intención                                    | Contrato futuro, con prefijo `/api/v1`                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Consultar listas                             | `GET /watchlists`, detalle `GET /watchlists/{id}`                                                     |
| `watchlist.create`                           | `POST /watchlists` con `{name}`                                                                       |
| `watchlist.add` / `.remove`                  | `POST /watchlists/{id}/items` con `{symbol}` / `DELETE /watchlists/{id}/items/{symbol}`               |
| Consultar/crear alertas                      | `GET /price-alerts`, `POST /price-alerts` con `{symbol, comparator, threshold}`                       |
| `alert.activate` / `.deactivate` / `.delete` | `POST /price-alerts/{id}/activate`, `POST /price-alerts/{id}/deactivate`, `DELETE /price-alerts/{id}` |
| Avisos                                       | `GET /notifications`                                                                                  |

Listas y alertas requieren Prémium y `watchlist:manage`. Máximo 20 listas, 50
símbolos por lista y nombre de 1–100 caracteres. `above` significa >= umbral;
`below`, <=; `crosses`, cruzar o alcanzar el umbral. Estados de alerta:
`active`, `inactive`, `triggered`. El aviso no ejecuta una orden.

No hay ruta para renombrar/eliminar listas ni para marcar notificaciones como
leídas: no se añadieron esas acciones. Las listas solo aportan símbolos; el
adaptador debe resolver nombre/bolsa a partir del catálogo real. El selector de
acciones recibe opciones: la búsqueda/paginación remota del catálogo corresponde
a la integración, no debe quedar limitada a los ejemplos.

### Identidad: fuentes y reglas comprobadas

Fuentes: `identity/adapters/inbound/http/routers/{sessions,users,preferences}.py`,
`schemas/{sessions,preferences}.py`, `identity/domain/preferences.py`.

| Intención                 | Contrato futuro, con prefijo `/api/v1`                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Consultar/revocar accesos | `GET /users/me/sessions`, `DELETE /users/me/sessions/{session_id}`, `POST /users/me/sessions/revoke-others` |
| `recovery.regenerate`     | `POST /users/me/mfa/recovery-codes`                                                                         |
| Canales                   | `GET/PUT /users/preferences/channels` con `{preferences:[{event_type, channel, enabled}]}`                  |
| Vista de portafolio       | `GET/PUT /users/preferences/portfolio`                                                                      |
| Controles de órdenes      | `GET/PUT /users/preferences/orders`                                                                         |
| Telegram                  | `PUT /users/me/telegram` con `{chat_id}`; `null` desconecta                                                 |

La API identifica la sesión actual con `current`; no deducirla del navegador o
IP. Las IP de ejemplo usan rangos reservados de documentación. Regenerar códigos
invalida los anteriores: después de una respuesta exitosa, reutilizar
`RecoveryCodesDisplay` desde la entrada pública de `features/login`; ya existe
su diseño de copia/descarga/confirmación. No inventar códigos ni almacenarlos en
logs. Esta revisión prepara la confirmación previa, no repite esa pantalla.

Los avisos `in_app` siempre están habilitados y no se pueden desactivar. SMS
requiere teléfono; Telegram requiere asociación de chat. Se muestran los 13
tipos definidos en el esquema de preferencias actual. Los canales requieren
`account:manage`; la disponibilidad del proveedor debe respetarse al conectar.
Los valores por defecto de presentación deben sustituirse por los del GET.

El límite diario de órdenes es entero de 1–1000; el umbral alto es positivo,
máximo 999999999.99 y hasta dos decimales. El umbral para ocultar posiciones
admite cero. Los campos decimales usan punto en el payload.

### Suscripciones: fuentes y reglas comprobadas

Fuentes: `wallet/adapters/inbound/http/routers/subscriptions.py`, `schemas.py`,
`application/subscription_service.py`, `domain/subscriptions.py`.

| Intención               | Contrato futuro, con prefijo `/api/v1`                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Catálogo                | `GET /subscriptions/plans`                                                                           |
| `subscription.checkout` | `POST /subscriptions/checkout` con `{plan}`; devuelve URL de Stripe                                  |
| Estado                  | `GET /subscriptions/me`                                                                              |
| `subscription.cancel`   | `POST /subscriptions/me/cancel` con `{reason}` de 1–500 caracteres                                   |
| Pagos                   | `GET /subscriptions/me/payments` con cursor/page_size; detalle `GET /subscriptions/me/payments/{id}` |

Los precios 12 USD/mes y 120 USD/año son ejemplos tomados del catálogo local,
no cotizaciones cargadas de Stripe. La integración debe recibirlos del GET y
revalidar disponibilidad al continuar. No se muestra un formulario de tarjeta.
La navegación a una URL de éxito **no concede Prémium**: esperar confirmación del
GET tras el webhook. `pending_checkout` se muestra como pendiente, nunca activo.
`active/trialing/past_due` impiden iniciar otro Checkout según el servicio actual.
Cancelar solicita `cancel_at_period_end`; conservar acceso durante el período,
sin un botón de reactivar renovación que la API no expone.

El detalle visual recibe el pago seleccionado; la integración puede consultar el
GET individual antes de abrirlo. La paginación debe conservar pila de cursores:
el backend aporta el siguiente, no índices de página ni uno anterior.

### Comisiones: fuentes y reglas comprobadas

Fuentes: `admin/adapters/inbound/http/{commissions_router,schemas}.py`,
`admin/application/commission_service.py`.

- Inversionista: `GET /api/v1/commissions`, requiere `from`, `to`; permite
  `symbol`, `cursor`, `page_size`.
- Comisionista: `GET /api/v1/broker/commissions`, requiere `from`, `to`; permite
  `investor_id`, `cursor`, `page_size`, limitado a clientes vinculados.
- Los filtros se envían al servidor; no se filtra solo la página local.
- El rol lo decide el contexto autenticado, **nunca** el selector de esta vista
  previa. El selector del ejemplo no concede permisos.
- `totals.complete=false` y `historical_terms_unknown` conservan importes nulos,
  muestran una explicación y no sustituyen valores ausentes por cero.
- La selección de clientes y la pila de cursores son responsabilidad del futuro
  contenedor. Los totales son del período, no sumas de la página visible.

## Verificación

`npm run check`, `npm run build` y la auditoría estática del proyecto son las
comprobaciones de calidad. `playwright.design.config.ts` añade pruebas enfocadas
de las nuevas vistas con `npx playwright test --config playwright.design.config.ts`.
Prueban estados, confirmaciones, límites de formularios, ausencia de peticiones
de negocio y distribución en los tres motores de navegador.

Esto prepara UI y contratos de presentación; no certifica la integración futura
con Stripe, Alpaca, Telegram ni sesiones reales.

Resultados finales de esta revisión:

- `npm run check`: formato, ESLint sin warnings, TypeScript, fronteras,
  contrato generado y 50 suites / 215 pruebas correctas.
- `npm run build`: compilación de producción correcta, incluida `/vista-previa`.
- Auditoría UX/UI estática: cero errores nuevos; permanecen 17 avisos
  informativos de `nowrap` ya existentes fuera de esta feature.
- Playwright: ejecución final con 15/15 escenarios correctos (12 de matriz
  visual/estados y 3 de formularios), en Chromium, Firefox y WebKit. Claro/oscuro,
  ES/EN, anchos 320, 390, 768, 1440 y 2560, y horizontal 844×390.
- La prueba de formularios comprueba confirmación de sesiones, validaciones,
  alerta de precio, suscripción/cancelación, detalle de pago, rol comisionista,
  calendarios y ausencia de escrituras HTTP. Los selectores de errores se limitan
  al contenido de la vista para excluir el anunciador de rutas de Next.
- Inspección visual con capturas de escritorio, móvil y diálogo; las capturas
  y trazas temporales están en `test-results/`, fuera de los assets del producto.

Se usaron respuestas ilustrativas aisladas y viewports emulados, no cuentas
reales ni dispositivos físicos. No se creó commit ni se hizo push.
