# Registro de decisiones FE-01 a FE-09

Fecha de adopción del bootstrap: 2026-11-05. Responsable: equipo frontend Acciones UD
(implementación inicial; revisión de equipo pendiente). Referencia: especificación
v1.0 del 2026-11-02. La solicitud de bootstrap autoriza el stack y alcance técnico;
no convierte los contratos propuestos en decisiones aprobadas por backend.

## FE-01 — Aplicación y runtime

Estado: adoptada para esta entrega. Next.js App Router, React y TypeScript estricto,
una aplicación en la raíz y FastAPI independiente. Node 24.15.0 LTS y npm 11.12.1
fijados a las versiones disponibles y verificadas en el entorno. `npm ci` y lockfile
son obligatorios. TypeScript 5.9.3 conserva compatibilidad con typescript-eslint
(su peer admite versiones inferiores a 6.1); no se selecciona TS 7 por ser más nuevo.

## FE-02 — Funcionalidades y límites

Estado: adoptada. Entradas públicas por funcionalidad, sin módulos de negocio iniciales.
Se usa un verificador AST/grafo con TypeScript ya instalado, en lugar de otra
dependencia. CI rechaza imports internos, capas invertidas, ciclos y fugas de entorno.
Consecuencia: nuevas formas de resolución/importación deben extender el verificador
y sus pruebas; el build de Next.js sigue siendo necesario.

## FE-03 — HTTP y eventos

Estado: transporte HTTP adoptado; protocolo WS pendiente. `HttpPort`, Fetch y parsers
son infraestructura real y aislada. WS sólo publica contratos técnicos genéricos.
No crear endpoints, mensajes o adaptadores falsos. Timeout de 10 s y correlación
`X-Request-ID` son propuestas bootstrap, ajustables tras acuerdo con backend.

## FE-04 — Propiedad del estado

Estado: adoptada. TanStack Query para remoto; React para local. Clientes aislados,
sin persistencia; GC 2 min; mutaciones sin retry ni cola offline. Dos reintentos
para lecturas transitorias; 429 respeta Retry-After hasta 30 s o requiere acción
explícita. El límite y frescura por recurso son decisiones iniciales medibles.
Separación por sessionEpoch/accountId documentada, aún sin sesión implementada.

## FE-05 — Origen único y sesión

Estado: topología adoptada; sesión/CSRF pendientes de backend. Navegador usa origen
público; servidor sólo origen interno de entorno validado. No hay cookies reenviadas
ni permisos falsos. Gateway deberá garantizar HTTPS, WSS y no-store privado.

## FE-06 — Mutaciones financieras

Estado: principio conservado, implementación fuera de alcance. No se actualizarán
importes de forma optimista ni se equiparará aceptación con ejecución. El bootstrap
sólo deshabilita retries/pausa automática de mutaciones; no contiene órdenes,
idempotencia de negocio, registros de comandos ni reconciliación simulada.

## FE-07 — Contratos y validación

Estado: herramienta adoptada, OpenAPI pendiente. Exportación real versionada,
generación reproducible, comparación automática y Zod en fronteras críticas.
`api:generate` falla si no hay contrato; `api:check` declara la dependencia pendiente
y exige consistencia cuando el archivo aparezca. Los tipos no sustituyen validación.

## FE-08 — Estilos y accesibilidad

Estado: adoptada. CSS Modules, variables CSS y HTML semántico, sin framework visual.
Tokens semánticos y foco visible; breakpoints documentados con literales en @media,
pues CSS no permite var() en esas condiciones. WCAG 2.2 AA es objetivo para cada
flujo futuro; el smoke inicial no certifica conformidad de funcionalidades inexistentes.

## FE-09 — Calidad y entrega

Estado: adoptada. Vitest, Testing Library, MSW de pruebas y Playwright en tres motores;
CI ejecuta formato, lint, tipos, grafo, OpenAPI, pruebas, build y smoke de producción.
Prettier se justifica para formato común. ESLint 9.39.5 se conserva por el peer de
eslint-plugin-react incluido por Next (no admite aún ESLint 10), aunque npm avisa
fin de soporte de esa línea: revisar actualización conjunta cuando sea compatible.
Override específico de minimatch 11.0.4 en typescript-estree corrige el aviso
GHSA-g3hv-75wg-m249; revisar y retirar cuando upstream lo incorpore. Lint y pruebas
verifican compatibilidad del override; no se aplicó `npm audit fix --force`.

## Dependencias de coordinación

Backend: OpenAPI aprobado; formato problem y correlación; cookie/rotación/CSRF;
autorización por recurso; protocolo WS, replay y snapshot; semántica de comandos y
DTO. Infraestructura: gateway HTTPS/WSS, allowlist del origen interno, cabeceras y
cachés privadas. Equipo: revisión de ADR, actualización periódica del runtime y
herramientas, y criterios de accesibilidad/rendimiento en funcionalidades reales.

---

## Registro de Decisiones Recientes (FE-10 a FE-14 · 2026-11-16)

### FE-10 — Rediseño del flujo de Registro y KYC (+18 años, Pasaporte, Acuerdos)

- Se reemplazó el `<select>` nativo por `CustomSelect` acotado dentro de la ventana y buscador en listas largas (departamentos y ciudades), y el selector de país usa banderas reales (`flagcdn`) ordenadas estáticamente en `countries.ts` para evitar desajustes de hidratación SSR/Cliente.
- Se reemplazó `<input type="date">` por un calendario personalizado que bloquea edades menores a 18 años (`validateBirthDateAge`), eliminó los códigos técnicos tipo `COL_NIT`/`USA_SSN` de las etiquetas visibles adaptándolas al país seleccionado, y habilitó formato alfanumérico cuando se elige **Pasaporte** (`[A-Za-z0-9-]{4,25}`).
- Se agregaron 3 tarjetas horizontales de contratos KYC con lectura modal completa en español antes de firmar.

### FE-11 — Flujo 2FA QR limpio y Códigos de Recuperación persistentes

- En `TotpQrCode.tsx` se muestra únicamente el código QR SVG (`otpauth_uri`) y un botón centrado de copiado seguro sin exponer texto largo de la clave.
- `RecoveryCodesProvider` persiste temporalmente en `sessionStorage` para que los códigos de emergencia no se pierdan al hacer clic accidental fuera del componente hasta que el usuario los copie/descargue y pulse el botón de confirmación.

### FE-12 — Separación de Dashboard vs. Mercados en Vivo y Scroll al Top

- Se removió `<Markets />` del resumen principal del Dashboard; ahora vive exclusivamente en su vista `Mercados en Vivo` (y `/markets`).
- Cada cambio de módulo en `Dashboard.tsx` ejecuta `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- En `PriceChart.tsx`, el filtro alfabético e instrumento se mantienen alineados en fila, `Anterior/Siguiente` recorre secuencialmente toda la lista visible (con paginación por lotes si excede 50 resultados), y se añadieron barras de progreso animadas durante cargas de API.

### FE-13 — Conexión de Saldo Real, Ordenes y Trámite KYC desde el Dashboard

- `Dashboard.tsx` y `OrderForm.tsx` consultan `GET /api/v1/wallet/balances`, `GET /api/v1/kyc/status` y `POST /api/v1/orders/preview` (`available_buying_power`) para reflejar el poder de compra y estado real de la cuenta del usuario. Si `POST /api/v1/orders` responde `403/409/422` (p. ej. sin KYC o sin fondos), se muestra el error real en pantalla en lugar de ocultarlo con un fallback silencioso.
- El modal `Mi Perfil & KYC` incorpora una pestaña interactiva de **Trámite KYC** para radicar o reenviar `POST /api/v1/kyc/account` desde el propio Dashboard.

### FE-14 — Brechas / Cambios Requeridos en Backend

1. **Validación alfanumérica explícita por tipo de documento (`POST /api/v1/kyc/account`)**: Actualmente `tax_id` es `str` genérico; agregar validación por tipo (`PASSPORT` alfanumérico, `COL_NIT` numérico) y verificar compatibilidad de `PASSPORT` con Colombia ante Alpaca Sandbox.
2. **Validación de mayoría de edad (+18 años) en Backend**: Reforzar `KycService.submit` para rechazar edades `< 18` años en servidor además de fechas futuras.
3. **Catálogo de Intereses en `PUT /api/v1/users/me/interests`**: `InterestCatalogRepository.known_interests()` solo acepta códigos de `markets` o `instruments.sector` (causando HTTP `422` con nuestros sectores temáticos del registro). Unificar catálogo o aceptar los 10 sectores oficiales del onboarding.
4. **Edición de Perfil Personal (`PATCH /api/v1/users/me`)**: Habilitar endpoint para actualizar `first_names`, `last_names`, `phone` y `country` desde `Mi Perfil & KYC`.
5. **Directorio Público de Comisionistas (`GET /api/v1/brokers`)**: Exponer un listado de comisionistas activos aprobados por el SysAdmin para reemplazar los asesores estáticos del frontend y enlazar asesorías reales.
6. **Sincronización automática de saldo tras órdenes simuladas**: Confirmar recálculo de `buying_power` y `positions` (`GET /api/v1/portfolio` o similar) para la pestaña **Portafolio** y la tabla **Tus Inversiones Activas** del Dashboard.
