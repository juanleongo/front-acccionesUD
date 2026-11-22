# Estados de las bolsas en el dashboard

`MarketSessionSummary` sustituye el indicador fijo de NYSE/NASDAQ. La lista procede
de `GET /api/v1/markets`, sin una selección local de bolsas. Se reutilizan las
claves React Query del módulo de mercados y los endpoints existentes, sin cambios
en FastAPI ni en sus contratos.

El reloj `GET /api/v1/markets/clock?tz=America/New_York` aporta la fecha y hora de
referencia. Para cada bolsa se consulta `GET /api/v1/markets/{code}/status` con
esa fecha. Su booleano `open` indica si hay jornada de negociación; sólo se muestra
«Abierta» durante el intervalo `open_at <= ahora < close_at`. Esto respeta fines
de semana, festivos, cierres anticipados y excepciones que retorne la API.

La indicación corresponde a sesión regular, sin afirmar disponibilidad de
negociación extendida. Si una bolsa del catálogo no tiene un horario configurado,
si falla una consulta o si el reloj deja de confirmarse durante dos minutos, se
muestra «Sin confirmar». No se reutiliza un estado verde después de un error de
actualización ni se infiere el estado de todas las bolsas desde `is_open` global.

El reloj y los estados se actualizan cada minuto y al recuperar el foco. Un timer
local de 30 segundos interpola brevemente la referencia recibida para cambiar
de estado al cruzar la apertura, el cierre o la medianoche de Nueva York. No hay
mensajes ni spinners de actualización en segundo plano. Cada badge incluye texto
además del color y su título identifica la bolsa y el horario recibido.
