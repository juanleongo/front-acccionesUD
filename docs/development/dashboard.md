# Dashboard principal

Ruta: `/dashboard`. Es el destino previsto tras completar el inicio de sesión o
el registro. Actualmente permite acceso directo como vista previa; no hay guardas,
redirecciones de autenticación ni sesiones simuladas. La landing permanece en `/`.

`src/features/dashboard/index.ts` publica el componente de la ruta. `DashboardView`
define el modelo visual recibido por props; `dashboardPreview` reúne los datos del
HTML de referencia, incluidos el usuario, los saldos y las cotizaciones. No son
contratos de API ni datos de una cuenta real. Las cifras, el mes de marzo, la
identificación de los instrumentos y las condiciones comerciales se conservan
como contenido ilustrativo y deberán validarse al integrar datos reales.

El menú se puede contraer en escritorio y abrir en móvil. Se comparte la
preferencia de tema `acciones_ud_theme` con la landing. Las operaciones, módulos
pendientes, perfil y cierre de sesión abren avisos sin modificar datos ni sesión.

Cuando estén disponibles los contratos, conectar el modelo mediante un mapper y
servicios basados en `HttpPort`/TanStack Query; añadir estados de carga/error y
la variante inicial de una cuenta nueva con los valores autorizados por backend.
Después, incorporar protección de ruta y redirección a `/dashboard` desde los
flujos reales de login/registro. No usar los saldos del mockup para inicializar
cuentas. Los controles de sesión y permisos deben depender del backend.

Verificación: `npm run check`, `npm run build` y `npm run test:e2e`. El E2E del
dashboard comprueba navegación directa, temas, aviso de inversión, foco, menú
adaptable, ausencia de desbordamiento de página y ausencia de tráfico API/WS.
