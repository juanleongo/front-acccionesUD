# Guía de Diseño, Arquitectura y Desarrollo Frontend — Acciones UD

> **Nota para Agentes de IA y Desarrolladores:**  
> Lee y respeta estrictamente estas convenciones al modificar o conectar componentes en `front-acccionesUD`. El diseño visual ya está estandarizado y el proyecto cuenta con validaciones estrictas de arquitectura, tipado y estilo en CI.

---

## 1. Sistema de Diseño, Colores y Temas (Claro / Oscuro)

El proyecto soporta **Modo Oscuro por defecto (`:root`)** y **Modo Claro (`:root[data-theme='light']`)**, definidos en `src/styles/tokens.css`.

### Regla de Oro de Estilos

- **NUNCA hardcodees colores de fondo, texto o bordes** (como `#ffffff`, `#000000`, `#111827`). Usa siempre las variables CSS de `tokens.css` para que el cambio de tema Claro/Oscuro funcione automáticamente en toda la aplicación.
- Usa **CSS Modules** (`<feature>.module.css`) dentro de cada carpeta de `src/features/`.
- Tipografía oficial: `'Plus Jakarta Sans'` (`var(--font-family-body)`).

### Paleta Oficial de Tokens (`src/styles/tokens.css`)

| Propósito                     | Variable CSS             | Valor Oscuro (Default)    | Valor Claro (`data-theme='light'`) |
| :---------------------------- | :----------------------- | :------------------------ | :--------------------------------- |
| Fondo principal de página     | `--color-background`     | `#0c0e13`                 | `#ffffff`                          |
| Superficie / Tarjetas base    | `--color-surface`        | `#0e1118`                 | `#ffffff`                          |
| Tarjetas elevadas / Paneles   | `--color-surface-raised` | `#10131b`                 | `#fafbfd`                          |
| Fondo de inputs y controles   | `--color-control`        | `#181c24`                 | `#ffffff`                          |
| Texto principal               | `--color-text`           | `#e2e2ea`                 | `#141d30`                          |
| Texto secundario / Subtítulos | `--color-text-muted`     | `#b9baca`                 | `#52627b`                          |
| Texto sutil / Metadatos       | `--color-text-subtle`    | `#9395a7`                 | `#63748d`                          |
| Color primario / Enlaces      | `--color-primary`        | `#bdc2ff`                 | `#2563eb`                          |
| Botón primario (CTA)          | `--color-button`         | `#384bff`                 | `#2563eb`                          |
| Acento institucional          | `--color-accent`         | `#b4d72d`                 | `#0db985`                          |
| Borde estándar                | `--color-border`         | `#222630`                 | `#edf0f5`                          |
| Borde sutil (filas de tabla)  | `--color-border-subtle`  | `#ffffff08`               | `#f7f9fc`                          |
| Éxito / Positivo / Compra     | `--color-success`        | `#34d399`                 | `#00845f`                          |
| Fondo de éxito / Badge        | `--color-success-bg`     | `#10b98118`               | `#d1fae5`                          |
| Advertencia / Reservado       | `--color-warning`        | `#f4ba25`                 | `#996000`                          |
| Fondo advertencia             | `--color-warning-bg`     | `#f59e0b15`               | `#fff6e5`                          |
| Borde advertencia             | `--color-warning-border` | `#f59e0b40`               | `#ffd28d`                          |
| Error / Alerta crítica        | `--color-error`          | `#a41925`                 | `#a41925`                          |
| Foco de accesibilidad         | `--color-focus`          | `#8592ff`                 | `#2563eb`                          |
| Radio de tarjetas             | `--radius-lg`            | `0.75rem`                 | `0.75rem`                          |
| Sombra de tarjetas            | `--shadow-card`          | `0 10px 30px -10px #0002` | `0 10px 30px -10px #0000000d`      |

> **Colores financieros semánticos permitidos:** Para variaciones de mercado, compras y ventas se utilizan `#10b981` (verde alcista / compra) y `#ef4444` (rojo bajista / venta).

---

## 2. Reglas de Arquitectura y Fronteras (`check:boundaries`)

El script `scripts/check-boundaries.mjs` valida el grafo de dependencias en cada CI. Debes respetar lo siguiente:

1. **Vertical Slice Architecture en `src/features/`:**
   - Cada módulo vive en su carpeta: `admin`, `auth`, `dashboard`, `landing`, `login`, `markets`, `registration`, `trading` (Módulo 03), `wallet` (Módulo 04).
   - **Importaciones externas:** Un módulo o página (`src/app/`) solo puede importar desde el `index.ts` (o `client.ts`) de una feature, nunca desde archivos internos de otra feature.
2. **Cliente vs Servidor (`'use client'`):**
   - Todo archivo que use hooks de React (`useState`, `useEffect`, `useQuery`) o APIs del navegador (`window`, `document`) debe comenzar obligatoriamente con `'use client';`.
3. **Transporte HTTP Centralizado:**
   - **Prohibido usar `fetch()` directamente** en componentes o features. Toda petición HTTP al backend debe pasar por `browserHttp.request(...)` (`@/lib/api/client`) y validar la respuesta con esquemas **Zod**.
4. **Variables de Entorno:**
   - **Prohibido acceder a `process.env`** fuera de `src/lib/config/server.ts`.
5. **Iconografía:**
   - Reutiliza siempre `<Icon name="..." />` de `@/components/ui/Icon` antes de agregar SVGs sueltos.

---

## 3. Reglas de Negocio y Guía de Integración API (Módulos 03 y 04)

- **Mercado exclusivo:** Todo el simulador opera sobre bolsas de **Estados Unidos (NYSE, NASDAQ, NYSE Arca)** en **USD** y bajo horario **America/New_York (ET)**.
- **Módulo 03 — Motor de Órdenes (`src/features/trading/`):**
  - Conectado en `trading-api.ts` (`OrderForm`, `TradingTerminal`, `ActiveOrdersTable`, `OrderDetails` + subcomponentes modulares en `components/` y etiquetas en `trading-labels.ts`).
  - Endpoints conectados:
    - `GET /api/v1/instruments/search` → selector de instrumentos tradables en `InstrumentSelector`.
    - `GET /api/v1/portfolio/positions` → tabla de posiciones disponibles y reservadas en `PositionsCard`.
    - `POST /api/v1/orders/preview` → previsualización de costos, mercado abierto/cerrado y autorización adicional (MFA TOTP o monto elevado) en `OrderPreviewCard`.
    - `POST /api/v1/orders` → envío con header `Idempotency-Key`.
    - `GET /api/v1/orders` y `GET /api/v1/orders/{id}` → historial paginado con filtros en `ActiveOrdersTable` y panel `OrderDetails`.
    - `POST /api/v1/orders/{id}/cancel|reauthorization|resubmit|resume` → cancelación, reautorización de precio, corrección y reanudación.
- **Módulo 04 — Billetera y Fondos (`src/features/wallet/`):**
  - Conectado en `wallet-api.ts` (`WalletDashboard`, `BalanceSummaryCard`, `FundingPanel`, `LinkBankAccordion`, `TransactionLedgerTable` y `wallet-labels.ts`).
  - Endpoints conectados:
    - `GET /api/v1/wallet/balances` → alimenta `BalanceSummaryCard` manteniendo segregación entre `cash_withdrawable` y efectivo no retirable.
    - `GET /api/v1/wallet/bank-relationships` y `POST /api/v1/wallet/bank-relationships` → consulta y vinculación de cuentas bancarias de prueba en `FundingPanel` y `LinkBankAccordion`.
    - `POST /api/v1/wallet/deposits` y `POST /api/v1/wallet/withdrawals` → solicitudes de depósito y retiro ACH con `Idempotency-Key` y validación de saldo retirable.
    - `GET /api/v1/wallet/transfers` → historial de depósitos y retiros en `TransactionLedgerTable`.
- **Módulo 05 — Portafolio y Seguimiento de Activos (`src/features/portfolio/`):**
  - Implementado en `PortfolioDashboard.tsx`, `portfolio-api.ts` y `portfolio-mock.ts`.
  - Endpoints conectados:
    - `GET /api/v1/portfolio/positions` → Posiciones en vivo (tabla, tarjetas y barras de peso %), valor de mercado, costo base y P&L no realizado.
    - `PUT /api/v1/users/preferences/portfolio` → Persistencia de preferencia visual (`table`, `cards`, `chart`).
    - `GET /api/v1/portfolio/statistics?from=&to=` → Volumen negociado y distribución porcentual por sector, mercado e instrumento.
    - `GET /api/v1/portfolio/risk-profile` → Modelo cuantitativo de riesgo F/C/E/T (Frecuencia, Concentración, Exposición, Tamaño relativo) y clasificación (`conservative`, `moderate`, `aggressive`).
    - `GET /api/v1/portfolio/executions` → Libro mayor de ejecuciones y comisiones (2%).
    - `POST /api/v1/portfolio/reports` y `GET /api/v1/portfolio/reports` → Generador y visor de reportes auditables.
- **Módulo 06 — Comisionistas, Vínculos, Propuestas y Portal Broker (`src/features/brokers/`):**
  - Implementado en `BrokersHub.tsx`, `brokers-api.ts` y `brokers-mock.ts` con selector de rol (**Vista Inversionista** y **Portal Comisionista**).
  - Endpoints conectados:
    - `GET /api/v1/brokers`, `GET /api/v1/brokers/suggestions`, `GET /api/v1/brokers/{id}/reputation`, `GET /api/v1/brokers/{id}/reviews`, `PUT /api/v1/brokers/{id}/rating` → Directorio público, reputación y calificaciones 1–5 estrellas.
    - `GET /api/v1/broker-links/current`, `POST /api/v1/broker-links`, `POST /api/v1/broker-links/{id}/trading-authorization`, `POST /api/v1/broker-links/{id}/trading-authorization/revoke`, `PUT /api/v1/broker-links/{id}/order-review`, `POST /api/v1/broker-links/{id}/end` → Gestión integral del vínculo y permisos del asesor.
    - `GET /api/v1/proposals`, `POST /api/v1/proposals/{id}/decision`, `GET/POST /api/v1/proposals/{id}/messages` → Bandeja de propuestas de inversión, firma con código 2FA TOTP e hilo de chat.
    - `GET /api/v1/broker/link-requests`, `POST /api/v1/broker/link-requests/{id}/accept|decline`, `GET /api/v1/broker/clients`, `POST /api/v1/broker/proposals`, `PUT /api/v1/brokers/me/profile` → Portal del comisionista.

---

## 4. Reglas Estrictas de UX/UI, Responsive, Tablas, Formularios, Accesibilidad y E2E

- **Full Responsive real (320 px en móvil mínimo hasta 27"+ / `>= 2560 px` en PC):**
  - En monitores grandes (`27"` / ultra-wide), usar contenedores centrados con `max-width` proporcionados (`78rem`–`96rem`) y grids fluidos (`auto-fit` / `minmax`) para evitar líneas infinitas o huecos deformes.
  - En móvil mínimo (`320px`–`375px`), garantizar `scrollWidth <= clientWidth`: sin `white-space: nowrap` en títulos/textos largos, sin `min-width` rígidos que desborden, botones y barras de filtro con `flex-wrap: wrap` y `min-width: 0` en columnas grid/flex.
- **Tablas y filtros ligados a contratos reales de la API:**
  - Envolver tablas en contenedores con scroll horizontal fluido (`overflow-x: auto`) y tipografía tabular (`font-variant-numeric: tabular-nums`) en montos, precios, cantidades y fechas.
  - **Regla de filtros en tablas:** Agregar barra o controles de filtro (`CustomSelect` + inputs con tokens) **siempre que la API/contrato soporte query params o retorne campos filtrables útiles**. **Si el endpoint aún no expone o soporta filtros reales, esperar al backend y NO renderizar cabeceras ni controles de filtro vacíos/decorativos.**
- **Tarjetas, modales y tipografía unificada (cero diseño plano o texto sin estilos):**
  - **Tarjetas:** Prohibido usar bloques planos sin contraste visual. Usar `--color-surface` / `--color-surface-raised`, borde definido (`--color-border` / `--color-border-strong`), `--shadow-card`, radios uniformes (`--radius-lg`), encabezados estructurados y badges semánticos de estado.
  - **Modales:** Backdrop con blur, tarjeta centrada con ancho fluido (`min(calc(100vw - 2rem), ...)`), borde destacado, sombra elevada, cierre accesible (`Esc` + botón claro), cuerpo legible y footer jerarquizado.
  - **Tipografía:** Prohibido dejar títulos, subtítulos, metadatos, etiquetas, estados vacíos o mensajes de error como texto HTML básico sin clases de diseño (`--font-family-body`, jerarquía de pesos `700`/`800`, `--color-text` / `--color-text-muted` / `--color-text-subtle`).
  - **Escala oficial de `z-index` (evitar choques):** Tarjetas `1–10`, cabeceras/sidebars `20–40`, menús desplegables (`CustomSelect`, combobox) `70`, modales `90`, overlay de sesión cerrada `9999`. Toda cabecera `sticky` debe mantenerse `<= 40` para nunca tapar menús abiertos.
  - **Mejora continua:** Siempre que se detecte un bloque visual pobre, desalineado o mejorable en el módulo que se edita, elevarlo al estándar del sistema respetando contratos de API y pruebas.
- **Formularios sin validación nativa del navegador (`noValidate`):** Todo `<form>` (que no sea `method="dialog"`) debe incluir `noValidate` y mostrar errores de validación con alertas/banners estilizados propios usando tokens de `src/styles/tokens.css`. **Prohibido** mostrar globos o tooltips nativos del navegador.
- **Listas desplegables estilizadas (`CustomSelect` obligatorio):** Toda lista desplegable visible debe implementarse con `@/components/ui/CustomSelect` (que sincroniza un `<select>` oculto solo para accesibilidad, formularios y pruebas E2E/unitarias). **Prohibido** mostrar `<select>` nativos sin estilos del sistema Claro/Oscuro.
- **Tema inicial sin parpadeo (FOUC) y bilingüe (`ES / EN`):** `src/app/layout.tsx` ejecuta un script síncrono previo al primer renderizado para aplicar `acciones_ud_theme` (`data-theme`) y `acciones_ud_locale` (`lang` y `data-locale`) desde `localStorage` antes de pintar. Todo texto visible o accesible nuevo debe integrarse con `useLocale()` (`tx`, `intl`).
- **Labels únicos y semántica:** Usar `<label htmlFor="id">` separado de botones internos (como mostrar contraseña) y separado de `<CustomSelect>`. Usar `<Link>` para rutas y `<button type="button">` para acciones (evitando `<div onClick>`).
- **Imágenes y activos:** Todo `<Image>` externo debe usar `unoptimized` o dominio declarado en `next.config.ts` (`images.remotePatterns`), o servirse desde `public/` con fallback de iniciales (como `BrokerAvatar`).

---

## 5. Verificación Obligatoria Antes de Subir Cambios

Antes de hacer `git push`, ejecuta siempre en `front-acccionesUD/`:

```powershell
npm run format
npm run check
npm run build
```

`npm run check` valida Prettier, ESLint (`--max-warnings=0`), TypeScript estricto (`exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`), fronteras arquitectónicas (`check:boundaries`), consistencia OpenAPI y pruebas unitarias en Vitest.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
