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
  - Actualmente opera con datos simulados en `trading-mock.ts`.
  - Endpoints a conectar:
    - `POST /api/v1/orders/preview` → obtiene `preview_id` y alimenta `PriceValidityTimer` (vigencia 5–10s).
    - `POST /api/v1/orders` → envía la orden con header `Idempotency-Key` y `preview_id`.
    - `GET /api/v1/orders` / `GET /api/v1/orders/{order_id}` → alimenta `ActiveOrdersTable`.
    - `DELETE /api/v1/orders/{order_id}` → botón cancelar orden abierta o encolada.
    - `POST /api/v1/orders/{order_id}/reauthorize` → flujo de `PriceSlippageAlertModal`.
- **Módulo 04 — Billetera Multi-Moneda (`src/features/wallet/`):**
  - Actualmente opera con datos simulados en `wallet-mock.ts`.
  - Endpoints a conectar:
    - `GET /api/v1/wallet/balance` → alimenta `BalanceSummaryCard` (manteniendo segregación entre `available_balance_usd` y `reserved_balance_usd`).
    - `POST /api/v1/wallet/deposit` → `DepositModal` (soporta COP, EUR, GBP, USD).
    - `POST /api/v1/wallet/withdraw` → `WithdrawalModal` (validando monto `<= available_balance_usd`).
    - `GET /api/v1/wallet/rates?base=USD` → `CurrencyConverterWidget`.
    - `GET /api/v1/wallet/transactions` → `TransactionLedgerTable`.

---

## 4. Accesibilidad y Compatibilidad con Pruebas E2E (Playwright)

- **Labels únicos:** No envuelvas botones (como el botón de mostrar contraseña) dentro de un `<label>` que ya apunta a un `<input>`, usa siempre `<label htmlFor="id">` separado del `<button>` y cuida que el `aria-label` del botón no colisione con el texto del `<label>`.
- **Semántica:** Usa `<Link>` para navegaciones de ruta y `<button type="button">` para acciones en pantalla.

---

## 5. Verificación Obligatoria Antes de Subir Cambios

Antes de hacer `git push`, ejecuta siempre en `front-acccionesUD/`:

```powershell
npm run format
npm run check
npm run build
```

`npm run check` valida Prettier, ESLint (`--max-warnings=0`), TypeScript estricto (`exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`), fronteras arquitectónicas (`check:boundaries`), consistencia OpenAPI y pruebas unitarias en Vitest.
