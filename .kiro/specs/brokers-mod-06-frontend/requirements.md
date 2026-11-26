# MOD-06: integración frontend de comisionistas

## Alcance y trazabilidad

Implementa los contratos aprobados en el spec `brokers-mod-06` del backend, sin modificarlo.

- RF-13, RF-22, RF-23: directorio paginado, sugerencias, perfil público, reputación y reseñas.
- RF-13, RF-14, RF-15, RFP-09: solicitud con consentimiento explícito, cancelación, cierre con motivo, historial por período/estado, autorización de trading separada y revocable.
- RF-16 a RF-21: propuestas por rol, creación, modificación versionada, retiro, firma MFA del inversionista, decisión del broker con evidencia, mensajes y versiones/decisiones auditables.
- RFP-04, RFP-05: portal restringido por rol, solicitudes y clientes vinculados, posiciones y órdenes de un cliente.
- Integración MOD-03: revisión, aprobación y devolución de órdenes con comentario.

## Diseño

Las consultas usan TanStack Query con claves por usuario, rol, recurso y filtros. Las mutaciones no se reintentan automáticamente y bloquean envíos simultáneos. Solo se muestra éxito tras respuesta válida del servidor. El transporte central `browserHttp` valida las respuestas con Zod. El código MFA no se persiste.

Las propuestas se aceptan con la versión obtenida del detalle; aceptar no equivale a ejecutar. La creación de la orden corresponde a la aprobación posterior del broker y a los permisos comprobados en el backend. Las cotizaciones estimadas proceden de la API; no se usan precios de ejemplo para mercado.

Los historiales, el directorio, las órdenes de clientes, las reseñas y los mensajes usan cursores del backend. Los filtros de fecha requieren ambos extremos. Los errores se muestran con opción de reintentar, sin recurrir a datos ficticios.

Se conservan tokens de temas, CSS Modules, controles CustomSelect, textos ES/EN y confirmaciones accesibles. Se retira la galería ficticia del panel de comisionistas. Los fixtures permanecen únicamente para pruebas.

## Exclusiones

La liquidación/pago de comisiones y certificados ficticios se retiran del módulo. El spec del backend excluye esta capacidad de MOD-06. No se ejecutan migraciones ni cambios de esquema. No se crean operaciones reales durante la validación.

## Verificación

Pruebas de contrato/interfaz: consultas paginadas, filtros por fechas, consentimiento obligatorio, vínculo pendiente, versión y MFA enviados, errores sin éxito ficticio, separación de roles y persistencia del perfil.

Revisión visual con respuestas interceptadas de prueba en navegador: directorio y diálogo a 320 px sin desbordamiento horizontal; escritorio a 1440 px. La prueba visual no acredita disponibilidad de una base de datos real ni transacciones reales.

Comandos de validación: `npm run check` y `npm run build`.
