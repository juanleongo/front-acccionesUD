# Integración del perfil y administración M07

Los cambios de esta integración pertenecen al frontend. Los contratos de M07 se verificaron en los routers y esquemas de `backend/src/acciones_ud/admin/adapters/inbound/http/`; no se modificó el backend. El servidor conectado debe desplegar esos endpoints y conceder los permisos correspondientes.

## Pantallas

- Indicadores: `GET /api/v1/admin/kpis`, período requerido, corte de datos y cifras parciales.
- Comisiones: ejecuciones paginadas, totales del período y distribución por bolsa/comisionista.
- Tarifas: matriz vigente, historial, creación de versiones y cancelación de versiones futuras. La creación usa la última versión real para el control de concurrencia.
- Pausas: consulta, programación y levantamiento de pausas globales o por bolsa.
- Cumplimiento: restricciones y levantamientos con evidencia, señales atípicas y reportes por usuario.
- Auditoría: eventos consolidados y trazabilidad de una orden.
- Bolsas: horario configurado, excepciones, tarifas, pausas e historial de cambios de horario.

Las escrituras de tarifas, pausas y restricciones requieren motivo, código de autenticación y una revisión con consentimiento antes de enviar. Un fallo HTTP conserva la revisión y no produce un éxito local. Los formularios de horario anteriores también propagan errores del servidor; las excepciones usan el identificador devuelto por la API.

Las consultas usan el transporte HTTP compartido y Zod. Los filtros se envían como parámetros `query`, y los cursores solo proceden de la respuesta del servidor. No se generan usuarios, acreditaciones o cifras de demostración durante la carga.

## Perfil

`PATCH /api/v1/users/me` envía únicamente nombres, apellidos, teléfono y país modificados. Los nombres se normalizan antes del envío. Se respeta el bloqueo de KYC tanto por estado conocido como por `PROFILE_KYC_LOCKED`. Esta operación no es una edición de la identidad en Alpaca después de iniciar KYC.

Los intereses disponibles se consultan con `GET /api/v1/auth/interest-options`, incluido en los rewrites de Next. La respuesta de usuario admite el objeto `associated_broker` de la versión nueva del backend.

## Compra con presupuesto total

La API de órdenes recibe `qty`, no `notional`. La calculadora permite elegir entre un presupuesto que incluye la comisión y un monto destinado a acciones al que se suma la comisión del servidor. Prepara una compra simple, límite y de vigencia diaria:

1. Comprueba si el instrumento permite fracciones.
2. Consulta la vista previa de una acción para obtener la referencia del servidor. Deriva automáticamente un precio válido de protección; no se pide un precio máximo al usuario.
3. Divide el presupuesto total entre ese costo; redondea hacia abajo a nueve decimales o a acciones enteras.
4. Verifica la cantidad calculada con otra vista previa antes de aplicarla al formulario.
5. Vuelve a comprobar el presupuesto en la revisión y antes del envío: contra el total si incluye comisión, o contra el valor de las acciones si se suma aparte. Si los costos cambian, actualiza la vista previa y requiere otra confirmación. Cambiar de opción o editar el monto invalida el cálculo aplicado anterior.

El total es una estimación, no una orden monetaria nativa ni una garantía de gastar exactamente el presupuesto. Una orden límite puede quedar pendiente o ejecutarse parcialmente. El backend no ofrece un límite monetario atómico con versión de comisión bloqueada entre la última consulta y el envío.

Actualizar una cotización confirma la consulta y distingue su hora de la fecha del precio. Si la bolsa está cerrada, se explica que se muestra la última referencia disponible. La sesión se calcula con el horario de la bolsa del instrumento y el reloj del servidor; el indicador diario de jornada no se interpreta como apertura actual. Una referencia servida desde respaldo conserva su aviso aunque la sesión esté cerrada.

Mientras se compra por monto, se ocultan los parámetros manuales y la estimación automática independiente. La revisión aparece tras calcular; el modo por cantidad tampoco consulta estimaciones hasta que el usuario modifica los parámetros financieros.

## Verificación

Las pruebas cubren cálculos y redondeos, normalización/bloqueo del perfil, parámetros del transporte, confirmaciones administrativas y fallos de concurrencia. Playwright comprueba producción con respuestas controladas, ES/EN, claro/oscuro y anchos de 320 a 2560 px. No se ejecutan operaciones financieras ni administrativas contra cuentas reales durante estas pruebas.
