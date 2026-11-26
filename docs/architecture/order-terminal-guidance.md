# Precio y estimación antes de enviar órdenes

La terminal consulta `GET /api/v1/instruments/{symbol}/quote` con el símbolo
seleccionado. Muestra la última operación, bid/ask, fecha del proveedor y avisos
`is_delayed` / `is_stale`. Sin precio o moneda USD confirmados se muestra «—»,
sin sustituir datos ausentes por cero ni por cotizaciones de otro instrumento.
La consulta se cancela al cambiar de símbolo y se actualiza cada 15 segundos
en primer plano. El precio mostrado no garantiza ejecución.

`OrderEstimateCard` reutiliza `POST /api/v1/orders/preview` como consulta de
cálculo, sin enviar órdenes ni autorizaciones. Espera 450 ms y cancela la espera
o la petición si cambia el borrador; no consulta parámetros inválidos. Los
resultados se separan por todos los campos de la orden, se actualizan cada
30 segundos en primer plano y no conservan importes de otro borrador. El timeout
automático es de 15 segundos; la vista previa explícita mantiene sus 60 segundos.

La comisión procede del servidor: no se fija un porcentaje en el frontend.
Según la implementación actual de `OrderService.preview` y `estimated_amount`,
el importe de compra ya incluye comisión y el importe de venta todavía no la
descuenta. `OrderCostBreakdown` presenta esa diferencia y evita duplicar la comisión.
El producto de cantidad por precio base usa cadenas decimales y BigInt. En órdenes
límite / stop-limit la base es el límite, y en stop el precio de activación.

Las estimaciones nunca activan el estado de confirmación. El botón «Consultar
vista previa» vuelve a consultar al servidor; solo «Confirmar y enviar orden»
crea una orden, conservando la clave de idempotencia y las verificaciones actuales.
Las claves de caché y las consultas automáticas excluyen confirmación, autorización
de monto elevado y TOTP. Al completar un envío se detiene la estimación hasta
que el usuario cambia los datos.

Se añaden ayudas ES/EN para cantidad (acciones frente a dólares), mercado,
límite de compra/venta, stop, stop-limit, trailing stop, bracket y programación.
No se añade compra por importe: el contrato actual envía `qty`.
No se modificó el backend.
