# Premium frontend — RF-10 a RF-12 y RF-26

Implementación frontend basada en el spec aprobado wallet-mod-04 y los contratos de market_data. No modifica backend, migraciones ni credenciales.

## Contratos integrados

- GET /api/v1/subscriptions/plans: catálogo mensual/anual y precios del servidor.
- POST /api/v1/subscriptions/checkout: contratación con confirmación y navegación a Stripe Checkout. Sin reintentos automáticos.
- GET /api/v1/subscriptions/me: suscripción, último pago y próxima fecha de cobro.
- POST /api/v1/subscriptions/me/cancel: motivo obligatorio, cancelación al finalizar período.
- GET /api/v1/subscriptions/me/payments y /{id}: historial por cursor de 10 registros y detalle.
- GET/POST /api/v1/watchlists, GET /{id}, POST /{id}/items, DELETE /{id}/items/{symbol}.
- GET/POST /api/v1/price-alerts, POST /{id}/activate y /deactivate, DELETE /{id}.
- GET /api/v1/users/me: autorización premium real y rol actual.

## Reglas

El webhook de Stripe es servidor a servidor: no se invoca ni simula desde el navegador. Las rutas de retorno /subscription/success y /subscription/cancel consultan el estado real, sin inferir acceso premium por la URL. La confirmación se consulta durante un tiempo limitado, con actualización manual posterior.

No se agregan operaciones no disponibles (reactivación de suscripción, cambio de plan activo, borrar/renombrar listas, devolución de pagos). La asignación administrativa de premium ya existe en el módulo admin y no se expone a inversionistas. Las listas y alertas se consultan solo después de confirmar is_premium.

Precios y estados proceden de APIs, con validación Zod, transporte centralizado, estados vacíos/errores y aislamiento de caché por usuario. Estilos con tokens, ES/EN y controles CustomSelect.
