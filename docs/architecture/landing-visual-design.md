# Portada visual de acciones

La referencia de dirección visual es https://www.etoro.com/es/: fotografía humana,
jerarquía editorial, tarjetas con cifras grandes y una presentación de producto
adaptable a distintos dispositivos. La implementación conserva la identidad de
Acciones UD. No reutiliza fotografías, vídeos, código ni marcas de eToro.

## Componentes y comportamiento

- `Hero`: fotografía original estática, texto sobre un degradado de contraste y
  enlaces a login/registro. Se retiraron la etiqueta de dispositivos, la línea de
  bolsas, el control de movimiento y la franja de empresas a petición del usuario.
- `StockExperience`: presentación de acciones, análisis, seguridad y asesoría.
- `DeviceShowcase`: dispositivos dibujados con HTML/CSS y vistas ilustrativas sin
  saldos, rendimientos ni cotizaciones inventadas. Los controles destacan cada
  dispositivo; las ilustraciones tienen un nombre accesible y su contenido
  decorativo queda fuera del árbol de accesibilidad.
- `CommissionSection`: comisión de referencia del 2% y reparto 60/40, aclarando
  que el reparto no son cargos adicionales y que la vista previa confirma el costo.
- `SecuritySection`: panel con tarjetas de autorizaciones, historial y verificación
  de identidad. Evita repetir el 2FA ya explicado y prometer respaldo financiero.
- El carrusel de comisionistas aparece inmediatamente antes del explorador de
  mercados. La ilustración de dispositivos conserva su leyenda sin el texto
  «Sin instalación adicional».
- Se mantienen exploración de mercados, asesoría, registro y autenticación. El explorador actual usa la tabla propia de Alpaca; los gráficos ECharts viven en Mercados. No se
  alteran APIs, reglas de ejecución ni contratos del backend. El texto promocional
  se centra en acciones, sin categorías promocionales de ETFs o criptomonedas.

La imagen principal se sirve mediante Next Image con dimensiones reservadas y
preload; el WebP fuente mide 1672 × 941 y pesa 114.084 bytes. En móvil se solicita
resolución suficiente para el recorte vertical, evitando ampliar una miniatura.
En escritorio, la foto se encuadra desde arriba y se limita a 120rem de ancho
para conservar el rostro en monitores panorámicos. Un fundido lateral integra la
fotografía con el fondo. En móvil se mantiene
el encuadre vertical específico.
Los colores están centralizados en `tokens.css`. En claro, la fotografía se integra
con el navbar blanco mediante un degradado superior, con el fondo de página mediante
un fundido inferior y con el texto mediante un velo lateral. El título usa el azul
oscuro de `--color-text` y las etiquetas superficies claras. El énfasis del título
recupera el degradado original a 100 grados entre `--color-primary`,
`--color-gradient-mid` y `--color-accent`, aprobado por el cliente: azul a verde
en claro, con los colores correspondientes de oscuro. Se centraliza en
`--color-heading-gradient`. En colores forzados se usa texto del sistema sin
degradado. El móvil tiene un degradado vertical para mantener legibilidad.

Se eliminaron los estilos del hero y beneficios anteriores. Las funciones restantes
de `OverviewSections` conservan el recorrido y la sección de seguridad. Se quitaron
promesas no respaldadas de saldo automático de USD 100.000, activación inmediata
y registro en menos de tres minutos.

## Imagen original

Herramienta: `image_gen` integrado, sin claves API ni CLI. El PNG original se
conserva en el directorio de imágenes generadas de Codex. Se convirtió a WebP con
Sharp sin recorte, retoque semántico ni ampliación.

Archivo usado: `public/images/landing/market-life.webp`.

Prompt enviado:

> Use case: photorealistic-natural. Asset type: wide photographic background for the hero of Acciones UD, a Colombian university stock-market learning web platform. Generate a high-end editorial lifestyle photograph, landscape 16:9 (around 1920x1080 or wider). Scene: a young adult Colombian/Latina woman with natural dark curly hair and a relaxed thoughtful expression at a beautiful contemporary cafe beside a window, using a silver laptop and holding a smartphone naturally, with warm late afternoon light, subtle leafy Bogota urban setting outside, real skin texture and believable hands. She occupies the right half of the frame; the left half is an intentionally softly out-of-focus deep navy / charcoal cafe wall and window reflections, suitable for bright website headline overlay. Moody cinematic photography but human, calm, approachable and credible, a sophisticated balance of cool blue and warm amber, editorial 35mm lens. Medium wide shot shows upper body, laptop edge and a little table. All device screens turned away or softly out of focus, absolutely no visible text, app interface, tickers, numbers, company branding, logos, watermark, charts, money symbols, or neon effects. No text anywhere. This is a new original stock-market education campaign image, not a reproduction of another site's asset. Keep photo detailed and natural, with no diagram or fake UI.

## Verificación

Comprobar ES/EN y claro/oscuro en 320, 390, 768, 1440 y 2560 px, sin desbordamiento
de página, con navegación de teclado, colores forzados, movimiento reducido y
cambio de dispositivo. Las pruebas del explorador usan la tabla propia y respuestas controladas; las de
composición visual pueden bloquear el proveedor para aislar el diseño local.
La ilustración de dispositivos no representa valores de una cuenta autenticada.
