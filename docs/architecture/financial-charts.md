# Gráficos financieros propios

El módulo Mercados representa históricos de Alpaca con Apache ECharts, instalado localmente. No carga iframes, scripts, datos ni bibliotecas de TradingView. El motor se importa de forma diferida y registra solamente velas, líneas, barras, ejes, tooltip y zoom. Los gráficos y las previsualizaciones de dibujo se generan localmente.

## Datos y ventanas

`PriceChart.tsx` conserva las consultas de catálogo e histórico. Cambiar entre velas, línea y área, activar volumen o un indicador reutiliza las mismas barras. La API existente entrega OHLCV y paginación; el frontend ordena, valida y rechaza duplicados contradictorios. Las fechas diarias conservan la sesión; intradía se presenta en America/New_York con DST. No se rellenan huecos de negociación.

La ventana inicial muestra hasta 60 barras. Zoom, arrastre, selector de cantidad, navegación, ajuste y restablecimiento actúan sobre el rango real. El motor conserva su instancia al cambiar de tipo, tema o indicador y libera listeners, observer y canvas al desmontarse.

## Herramientas

SMA 20, EMA 20, Bollinger 20/2, RSI 14 de Wilder y MACD 12/26/9 se calculan sobre cierres del histórico recibido. Las observaciones insuficientes permanecen vacías. Un indicador activo por vez; volumen opcional en panel separado. El cálculo no constituye una réplica de ratings propietarios de otros proveedores.

Nivel horizontal (un clic), segmento de tendencia y medición de diferencia/precio/porcentaje (dos clics o arrastre), área rectangular (dos puntos) y área poligonal (tres o más clics, Enter o primer vértice para cerrar). Una capa SVG propia mantiene coordenadas de barra/precio y se reproyecta con las API públicas de ECharts al hacer zoom, desplazar o redimensionar.

En modo Cursor, pulsar un trazo o el interior de un área selecciona ese objeto. Arrastrar sus puntos modifica sus extremos/vértices; arrastrar el cuerpo desplaza el objeto conservando su geometría y limitándolo al histórico disponible. La barra de edición ofrece seis colores adaptados al tema, grosor, trazo, texto, opacidad de áreas y eliminación individual. Los puntos seleccionados muestran sus fechas y precios. Esc cancela o deselecciona; Supr elimina la selección. Deshacer/rehacer conserva hasta 50 estados (Ctrl+Z / Ctrl+Mayús+Z cuando el gráfico tiene foco). El teclado de campos de texto conserva su comportamiento habitual.

Al dibujar se impide el arrastre del gráfico, se marca el primer punto y se previsualiza el trazo. Al completar se selecciona el dibujo y se vuelve al cursor. La descarga PNG compone canvas y capa SVG. Pantalla completa usa la API del navegador. Los dibujos se limitan al instrumento/período actual; no se guardan en la cuenta ni en el navegador. El tooltip y las fechas del cursor se formatean según idioma y sesión, sin exponer timestamps Unix ni nombres internos de OHLC.

El gráfico es histórico, no un stream OHLCV. El stream actual de precios no basta para reconstruir el volumen de cada vela. Actualización continua, reconexión y recuperación de huecos quedan como trabajo de integración independiente; no se simulan ticks.

## Verificación

Pruebas de cálculos, fidelidad de datos y ciclo de vida; E2E con respuestas controladas para las tres representaciones, zoom, navegación, casos extremos, indicadores, dibujos y responsive. Los fixtures solo se usan en pruebas.

Licencia Apache ECharts: Apache-2.0. Conservar LICENSE y NOTICE del paquete distribuido. Documentación: https://echarts.apache.org/handbook/en/basics/import/.
