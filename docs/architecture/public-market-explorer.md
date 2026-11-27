# Explorador público de mercados

La portada utiliza `PublicMarketTable`, compartida con Mercados. Consume `GET /api/v1/public/market-explorer` a través del transporte central y valida con Zod. Next reenvía explícitamente esta ruta pública al origen configurado en `next.config.ts`. El cliente permite 15 segundos, por encima del límite de 12 segundos del servicio. El backend conserva la integración Alpaca existente; esta migración no cambia sus contratos.

## Tabla y filtros

Símbolo, empresa, bolsa, último precio USD, variación respecto al cierre anterior, instante de cotización, feed, demora, antigüedad y clasificación negociable/solo consulta. Búsqueda por nombre o símbolo, filtro por bolsa y paginación del servidor (seis instrumentos por página). La consulta cambia con cada filtro aplicado y no muestra filas del filtro anterior mientras carga. Refresco cada 30 segundos en pestaña activa, con caché compartida por consulta.

En portada los símbolos llevan al login. En Mercados seleccionan el instrumento del gráfico. La selección de bolsa conserva su etiqueta durante carga/error. Un error de refresco mantiene los últimos datos recibidos con un aviso; los errores iniciales tienen reintento; precios ausentes se muestran como no disponibles. Los avatares usan iniciales, sin descargar marcas de terceros.

No hay widgets, URLs de gráficos ni dependencias de TradingView. Los gráficos y herramientas están en Mercados. El precio puede tener demora y depende del feed autorizado de Alpaca; el refresco de la página no elimina esa demora.

## Alcance de información

La API pública actual no entrega volumen, capitalización, P/B, BPA, empleados ni ratings técnicos. La tabla no crea columnas vacías para esos campos. Volumen existe en otros contratos de cotización e histórico, pero exponerlo en esta tabla exigiría ampliar el contrato público. Los fundamentales requieren una fuente adicional; un rating técnico propio requeriría fórmula y cobertura definidas.

## Verificación

Pruebas de búsqueda, filtro, paginación, fuente, estado de error y ES/EN; verificación visual de tabla con scroll interno a 320, 390, 1440 y 2560 px. Los precios de prueba pertenecen exclusivamente a fixtures.

Prueba de integración real (requiere backend configurado): `RUN_LIVE_MARKETS=1` y Playwright `tests/e2e/public-market-live.spec.ts`. Las peticiones de ambas tablas pasan por Next sin interceptar la ruta pública; las vistas protegidas se aíslan sin crear sesiones de usuario. `tests/market-rewrites.test.ts` protege la configuración de reenvío.

## Logos y alcance de búsqueda

El componente compartido `AssetLogo` utiliza los archivos locales ya atribuidos en `brand-assets.md` para AAPL, NVDA, TSLA, SPY, JPM y XOM. Los demás símbolos solicitan una imagen por ticker a LogoAPI.sh, sin clave. Si falla, solicitan la imagen pública por símbolo a Financial Modeling Prep y, como siguiente respaldo, consultan el endpoint público del backend, que protege las credenciales de Alpaca, valida el formato y aplica caché. Una imagen no disponible muestra las iniciales; nunca se asigna el logo de una empresa a un ETF derivado solo por parecerse su símbolo. Los logos de Alpaca dependen de cobertura y habilitación del servicio, por lo que no se garantiza el catálogo completo. Los intentos son finitos y las iniciales siguen visibles mientras carga la imagen. La secuencia se reinicia al cambiar de símbolo o bolsa. El servicio externo tiene cobertura parcial; no se garantiza que todos los instrumentos tengan un logo.

La tabla de Mercados inicia con todas las bolsas, independientemente de la bolsa elegida para el gráfico. Conserva sus propios filtros al cambiar de instrumento. Si una búsqueda con bolsa específica no encuentra resultados, identifica el alcance y permite buscar en todas las bolsas. La búsqueda por NVIDIA devuelve NVDA en NASDAQ; AMEX lo excluye correctamente.

## Actualización y estado de las cotizaciones

La tabla consulta cada 30 segundos mientras está activa y vuelve a consultar al recuperar el foco o la conexión. «Última consulta» muestra `retrieved_at` del backend; la hora de cada fila conserva `as_of` del proveedor. No se cambia una fecha ni un precio por el mero hecho de pulsar Actualizar. El endpoint conserva su caché acotada de 30 segundos.

Con `market_open=false` y precio/fecha disponibles se presenta «Última disponible» y un aviso de mercado cerrado. Esto no convierte la cotización en reciente ni en un cierre oficial; la fecha real permanece visible y los flags del proveedor se conservan. Con sesión abierta o estado desconocido, `is_stale=true` sigue mostrando «Sin cotización reciente». Un nuevo resultado con `is_stale=false` actualiza ese estado. Datos sin precio/fecha se distinguen como «Sin cotización». La cobertura y los retrasos del feed no se deducen de animaciones o del intervalo de consulta.

Las filas usan superficies separadas, bordes redondeados, variaciones con color e icono, avisos estructurados y transiciones de entrada/hover. Los efectos respetan `prefers-reduced-motion` y el resaltado del precio solo se reinicia cuando cambia el valor, no en cada consulta.
