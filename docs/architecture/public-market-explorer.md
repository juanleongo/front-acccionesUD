# Explorador público de mercados

La portada utiliza dos vistas oficiales alojadas por TradingView. El navegador carga
`https://www.tradingview-widget.com/embed-widget/screener/` con el mercado
`america`, la barra de filtros y la vista de empresas de mayor capitalización.
La vista «Buscar y analizar» carga `/embed-widget/advanced-chart/` y habilita
`allow_symbol_change` para consultar empresas y símbolos mediante el buscador
del gráfico. El Screener filtra por bolsa, sector, tipo de instrumento y otras
características; su filtro Ticker no es un buscador de empresas. Sólo se monta
una vista a la vez.

No necesita endpoints públicos añadidos a FastAPI, credenciales de Alpaca ni una
clave de API en el navegador. El backend no se modifica para esta integración.

## Integración y límites

El adaptador `tradingview.ts` genera exclusivamente una URL del proveedor con las
opciones del widget oficial. El documento externo queda aislado en un iframe con
título accesible; conserva sus propios filtros, logos, controles y marca. Las
acciones y tablas internas del proveedor no se copian ni se consultan mediante
una API no documentada. Las cotizaciones estadounidenses pueden tener demora.

Se aplica el tema claro/oscuro y el idioma ES/EN al documento del proveedor.
La cabecera, el marco y las acciones externas utilizan los tokens de Acciones UD;
el contenido del iframe conserva los estilos y las opciones de TradingView.
Los enlaces de símbolos se configuran para abrir `/login` de Acciones UD; la
atribución externa continúa apuntando a TradingView.

La carga comienza al acercarse la sección al área visible, reservando su altura
para evitar saltos. La tabla conserva un ancho legible y desplazamiento horizontal
en su contenedor, también accesible por teclado; el gráfico usa el ancho del móvil.
El indicador circular termina cuando carga el documento
externo; TradingView gestiona posteriormente la carga de sus datos. Un fallo de
carga o una espera de 25 segundos muestra un mensaje con recarga y acceso directo
al proveedor. No se sustituyen errores por precios de ejemplo.

## Verificación

Las pruebas unitarias comprueban configuración, acceso mediante login, cambio de
idioma/tema, timeout y recarga. La comprobación visual con Chrome debe cargar el
widget real, buscar una acción mediante el buscador del gráfico y verificar logos,
filtros y ausencia de desbordamiento en móvil y escritorio. Bloquear las rutas
`/api/v1/public/*` durante esta comprobación confirma la independencia del backend.

Referencias oficiales:

- https://www.tradingview.com/widget-docs/widgets/screeners/screener/
- https://www.tradingview.com/widget-docs/faq/general/
- https://www.tradingview.com/widget-docs/faq/data/
- https://www.tradingview.com/widget-docs/markets/north-america/
