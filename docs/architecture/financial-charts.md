# Gráficos financieros

El coordinador `src/features/markets/PriceChart.tsx` conserva TanStack Query, el catálogo paginado, filtros, intervalos y períodos. La clave histórica contiene símbolo, período e intervalo; el tipo visual no participa en ella. Cambiar de representación reutiliza las barras ya recibidas. Un filtro nuevo no presenta barras del instrumento anterior mientras espera la respuesta.

## Motor y ciclo de vida

`chart/FinancialChart.tsx` presenta controles, lectura contextual y viewport. `use-financial-chart.ts` crea una instancia de Lightweight Charts 5.3.0 por montaje y mantiene una sola serie activa: CandlestickSeries, LineSeries o AreaSeries mediante addSeries. Al cambiar de modalidad elimina la serie anterior, aplica setData y restaura el rango lógico. Los cambios de tema e idioma aplican opciones sin recrear el gráfico; autoSize usa ResizeObserver nativo. Cada desmontaje elimina la instancia, suscripciones, observer y frame pendiente. React StrictMode puede montar/desmontar dos veces en desarrollo.

No se usa update porque el contrato consultado es histórico, no un stream incremental. No hay un segundo motor SVG. No se modifica el backend ni Alpaca.

## Fidelidad de datos

`history.ts` valida números finitos y rangos OHLC, conserva volumen si se recibe, ordena y deduplica timestamps. Duplicados contradictorios provocan error; no se corrigen precios. `chart-data.ts` normaliza los tiempos para la biblioteca sin rellenar sesiones ausentes. Las barras diarias usan fechas de sesión: medianoche UTC representa una fecha sin hora; otros timestamps se resuelven en America/New_York. Intradía conserva el instante UTC y formatea ejes/cursor con Intl en Nueva York, incluyendo DST, sin sumar offsets fijos.

No hay metadatos de tick size en el contrato histórico. precision/minMove se derivan de la máxima precisión significativa OHLC recibida, con mínimo 2 y máximo 8 decimales (límite previo de la aplicación). El texto contextual conserva hasta 8 decimales. No se supone que todos los instrumentos negocien en centavos.

Línea y área utilizan exclusivamente close y conexiones lineales, sin interpolación curva. El color corresponde al signo del cambio entre primer y último cierre del período consultado; es neutral con un solo punto, primer cierre cero o cambio cero. No clasifica cada fluctuación local. La variación del cursor compara el cierre señalado con la observación anterior y omite porcentaje si la base es cero. Los márgenes verticales y autoscale son nativos.

## Ventana histórica

La vista inicial contiene hasta 60 observaciones recientes. El selector modifica el rango lógico real; después de zoom manual muestra Zoom (N) cuando la cantidad no coincide con un preset. Anteriores/siguientes mueven la ventana, sin recortar el dataset ni solicitar páginas del catálogo. Ajustar muestra el histórico recibido, Más recientes conserva el ancho actual, Restablecer vuelve a 60 y reactiva autoescala. La rueda, el arrastre y el gesto táctil son nativos. Las flechas de teclado inspeccionan barras y desplazan la ventana si es necesario.

El último cierre se identifica como histórico; no se simulan ticks. Se conserva la atribución pública de TradingView y su enlace oficial.

## Verificación

Las pruebas unitarias cubren normalización, fechas DST, precisión, duplicados, reutilización de consultas y ciclo de vida. `tests/e2e/financial-chart.spec.ts` usa respuestas HTTP controladas para verificar las tres series, ventanas, zoom, arrastre, períodos, paginación, datos escasos y extremos, y responsive. Estas respuestas son exclusivamente fixtures de prueba, nunca datos de producción. No constituyen una verificación de la disponibilidad o latencia de una cuenta Alpaca real.

API oficial: https://tradingview.github.io/lightweight-charts/docs/ (v5.3).
