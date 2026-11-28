# Renovación automática de sesión

## Alcance y trazabilidad

Integración frontend del endpoint existente `POST /api/v1/auth/refresh`, dentro
de identidad, autenticación y sesiones (RF-02, RFP-03). No modifica el backend.

## Comportamiento

- Ante un HTTP 401 de una ruta privada `/api/v1/`, el cliente del navegador
  intenta renovar con las cookies HttpOnly, sin cuerpo ni tokens en JavaScript.
- Valida con Zod `access_expires_at` y `refresh_expires_at`. El proxy existente
  de Next.js permite que el navegador reciba las cookies rotadas.
- Comparte una renovación entre solicitudes concurrentes de la misma instancia
  del cliente. Un 401 tardío de la generación anterior solo necesita reintento.
- Repite la solicitud original una sola vez, conservando cuerpo y cabeceras,
  incluida `Idempotency-Key`.
- Un 401 de renovación o del reintento notifica sesión finalizada. Los errores
  de red, contrato y 503 no se convierten en expiración de sesión.
- Excluye rutas de autenticación, públicas y consultas externas de divisas.
  No cambia el transporte del servidor.
- Cancelar una solicitud en espera no cancela la renovación compartida.

## Validación

Pruebas unitarias de renovación, concurrencia, 401 tardío, reintento único,
idempotencia, exclusiones, errores recuperables y cancelación. Las pruebas del
dashboard incluyen rechazo explícito del endpoint de renovación para comprobar
el aviso de sesión finalizada.

## Límites

La coordinación cubre una instancia del cliente (una pestaña). No hay renovación
periódica ni coordinación entre pestañas. La renovación se intenta cuando una
consulta privada devuelve 401; no prolonga un refresh token vencido o revocado.
