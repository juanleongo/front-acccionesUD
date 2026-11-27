# Responsive: cobertura y verificación

La aplicación conserva los tokens de color y la tipografía Plus Jakarta Sans. Los ajustes se aplican a los componentes compartidos y a la distribución de cada módulo, sin modificar el backend ni sus contratos.

## Cobertura

| Área           | Vistas y estados recorridos                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Portada        | Hero, comisionistas, explorador con resultados, dispositivos, seguridad y footer                                                                                                                                         |
| Acceso         | Inversionista/comisionista, administrador, enrolamiento QR, MFA existente, código alternativo, diez códigos de recuperación y sesión finalizada                                                                          |
| Registro       | Todos los pasos de inversionista y comisionista, preferencias, firma, identidad, nacimiento, ubicación, actividad financiera, acuerdos y términos                                                                        |
| Dashboard      | Resumen, navegación lateral y perfil                                                                                                                                                                                     |
| Mercados       | Selector de bolsa e instrumento, gráficos de línea, área y velas, controles y calendario                                                                                                                                 |
| Órdenes        | Mercado, límite, stop, stop limit, trailing stop, compra por monto, posiciones y detalle de orden con ejecuciones                                                                                                        |
| Portafolio     | Posiciones, distribución, estadísticas, riesgo, ejecuciones, reportes y resumen de reporte                                                                                                                               |
| Billetera      | Depósito, conversión COP/USD, vinculación bancaria, retiro e historial con movimientos                                                                                                                                   |
| Comisionistas  | Cuatro pestañas del inversionista; perfil público, reseñas, consentimiento, propuestas y chat; cinco pestañas del portal profesional y cartera/órdenes del cliente                                                       |
| Mi perfil      | Datos y seguridad, intereses/nivel y estado KYC; formularios KYC completos también se recorren en registro                                                                                                               |
| Administración | Las doce secciones; usuarios y solicitudes con registros, roles, horarios, creación de administrador, comisiones, versiones de tarifas, pausas, restricciones, reportes, auditoría, custodia y confirmación de operación |
| Errores        | Página inexistente, sesión finalizada y estados vacíos de consultas                                                                                                                                                      |

## Matriz reproducible

- Chromium, Firefox y WebKit.
- Español e inglés; modo claro y oscuro.
- Anchos de 320, 390, 768, 1440 y 2560 píxeles.
- Vista horizontal de 844 × 390 y diálogos en pantallas de poca altura.
- Comprobación del ancho del documento, controles fuera de pantalla, calendarios y menús abiertos, Escape y acceso a la última acción de los diálogos mediante desplazamiento.
- Datos de prueba con nombres, referencias y textos largos; los mocks siguen los esquemas que consume el frontend. No se envían operaciones a cuentas reales.

Los fixtures viven en `tests/fixtures/responsive.ts`; las comprobaciones compartidas, en `tests/fixtures/responsive-layout.ts`. Las pruebas están en `responsive-workspaces.spec.ts`, `responsive-onboarding.spec.ts` y `locations.spec.ts` (catálogo real de regiones y ciudades del frontend).

```powershell
npm run build
npm run test:responsive
```

Para repetir solamente un navegador:

```powershell
npm run test:responsive -- --project=webkit
```

El servidor de pruebas utiliza el puerto 3015 y se cierra al terminar. El informe queda en `playwright-report/responsive/index.html`; las capturas y trazas, en `test-results/responsive/`.

## Cambios de comportamiento visual

- Los calendarios se posicionan dentro del área visible y se recolocan al desplazar, redimensionar o cambiar su contenido. En móvil se presentan abajo y permiten desplazamiento interno.
- Los menús de selección se mantienen dentro de pantalla y pueden abrirse en diálogos y contenedores con desplazamiento. Escape cierra el menú antes que el diálogo que lo contiene.
- Las tablas administrativas, de órdenes, de ejecuciones y de inversiones del cliente muestran registros con etiquetas en móvil. Las tablas comparativas que mantienen columnas usan su propio desplazamiento horizontal.
- Administración ofrece un selector de sección en móvil/tablet, conservando la navegación lateral en escritorio.
- Registro presenta el paso actual de forma compacta en móvil. La ciudad permanece deshabilitada hasta disponer de sus opciones.
- El país utiliza el selector compartido: conserva las banderas y el código ISO del formulario, y permite buscar por nombre o código sin salir del área visible.
- Mi perfil utiliza una cabecera compacta, pestañas desplazables y cierre accesible durante el desplazamiento.
- Al abrir Mi perfil desde el menú móvil, el menú se cierra y el foco vuelve al botón de navegación al cerrar el diálogo.
- Los campos editables tienen un tamaño de letra legible en móvil; los diálogos disponen de altura máxima y desplazamiento interno.
- El acceso espera a que React esté preparado antes de habilitar los campos y el cambio de perfil. Esto evita perder una edición inmediata durante la hidratación, caso detectado en WebKit.

## Alcance de la prueba

La matriz verifica interfaz y comportamiento en navegadores automatizados con tamaños de dispositivo emulados. No sustituye una prueba en teléfonos físicos ni certifica la disponibilidad de Alpaca o de los servicios externos. La configuración prueba un build de producción para separar los resultados de los tiempos de compilación del servidor de desarrollo.

## Resultado de la revisión — 27 de noviembre de 2026

- `npm run check`: correcto; 50 archivos de pruebas y 215 pruebas unitarias pasadas, con formato, lint, tipos, fronteras y contratos consistentes.
- `npm run build`: correcto para todas las rutas.
- Matriz general: 96 escenarios revisados. Pasaron 95 en la ejecución completa; el caso de detalle de orden en WebKit se estabilizó esperando el desplazamiento completo del botón y pasó sus tres repeticiones posteriores.
- Menú móvil y retorno del foco: 12 de 12 combinaciones pasadas.
- País, registros completos y catálogo de ubicaciones después de unificar el selector: 39 de 39 pruebas pasadas. Este lote vuelve a recorrer 24 registros ya incluidos en la matriz general.
- Cobertura consolidada: 123 escenarios distintos, comprobados por lotes. Auditoría estática sin errores ni advertencias críticas; los avisos informativos de `nowrap` corresponden a textos ocultos, cifras, badges y regiones con desplazamiento revisadas.
