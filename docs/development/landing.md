# Landing institucional

La ruta `/` reproduce la estructura de `01_landing_institucional_dark.html` y las
referencias visuales clara y oscura. Se adapta al stack existente: React, TypeScript,
CSS Modules y tokens semánticos. No utiliza el CDN de Tailwind, fuentes remotas,
scripts del mockup ni dependencias adicionales. El alcance de mercados está enfocado
exclusivamente en mercados de Estados Unidos (NYSE, NASDAQ y NYSE Arca en USD).

## Alcance actual

- Portada, mercados, ventajas, pasos, seguridad y pie institucional.
- Tema oscuro inicial, cambio a claro y persistencia de la preferencia pública en
  `acciones_ud_theme`. El script fijo del layout restaura el tema antes de pintar;
  el cambio sigue funcionando si el navegador bloquea localStorage.
- Navegación por anclas, menú móvil, búsqueda local por nombre/símbolo/bolsa,
  filtros combinados y estado sin resultados. Ctrl/Cmd + K enfoca la búsqueda.
- Los botones de cuenta, dashboard, portafolio y órdenes abren un diálogo
  «Próximamente». No crean sesiones, saldos, depósitos, órdenes ni colas.
- Datos de muestra identificados en el explorador y el pie. Los textos comerciales,
  porcentajes, calificaciones y garantías reproducen el diseño y deben validarse
  antes de habilitar el producto. El pie identifica el alcance de la vista previa.
- Tabla desplazable en móvil, controles etiquetados, foco visible, enlace para
  saltar al contenido, diálogo nativo con cierre Escape y movimiento reducido.

## Organización y conexión futura

`app/page.tsx` compone la entrada pública `features/landing/index.ts`.
`LandingPage.tsx` conserva las secciones informativas como componentes de servidor.
Las fronteras cliente se limitan a cabecera, explorador y acciones pendientes.

`data/market-preview.ts` contiene los valores fijos de las imágenes.
`model/market.types.ts` define **modelos de presentación**, no DTO de FastAPI.
`MarketExplorer` recibe `assets` por props: la futura capa de datos podrá sustituir
el origen sin acoplar la tabla al transporte. No se inventan endpoints, esquemas
de respuesta, servicios asíncronos ficticios ni temporizadores de cotizaciones.

Cuando exista el contrato aprobado:

1. Generar DTO desde OpenAPI y validar respuestas en un servicio que reciba
   `HttpPort`, según la arquitectura del repositorio.
2. Transformar DTO a modelos de vista; integrar consulta, carga, error y frescura
   con TanStack Query. Mantener los ejemplos fuera del flujo de datos real.
3. Reemplazar `UpcomingButton` por rutas o acciones de los módulos correspondientes.
4. Conectar estados de mercado y suscripciones únicamente con el protocolo WS
   acordado. Validar los textos comerciales y retirar las etiquetas de vista
   previa sólo cuando representen el funcionamiento real.

## Verificación

`npm run check`, `npm run build` y `npm run test:e2e` comprueban la base existente.
El E2E valida búsqueda, filtros, tema persistido, diálogo con Escape/foco, menú
móvil, ausencia de desbordamiento de página y ausencia de llamadas `/api/` o WS.
No requiere backend, credenciales ni variables de entorno.

## Actualización del HTML corregido

Se incorporó el carrusel público de cinco comisionistas antes del explorador,
con movimiento continuo, pausa manual/al pasar el cursor/al recibir foco,
navegación anterior/siguiente e indicadores. Se respeta movimiento reducido.
Las copias del bucle son inertes y están ocultas para lectores de pantalla.
Los perfiles ilustrativos están en `data/advisors-preview.ts`; las fotografías
locales de `public/advisors/` proceden de las URL de Unsplash del HTML suministrado.
Solicitar propuesta y ver directorio mantienen el aviso de función pendiente.
El menú público enlaza Comisionistas, Mercados Globales, Cómo Funciona y Seguridad.
