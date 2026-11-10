# Funcionalidades

`landing/` contiene la presentación institucional y sus interacciones locales.
Los datos ilustrativos están separados de los componentes; no hay servicios de
negocio ni contratos HTTP inventados. Ver [la guía de la landing](../../docs/development/landing.md).

Crear cada funcionalidad de negocio cuando exista
una tarea y un contrato revisado; consultar [la guía del equipo](../../docs/development/guide.md).
Cada módulo publica `index.ts` (seguro para cliente) y, sólo si lo necesita,
`server.ts` con `import 'server-only'`. No importar sus carpetas internas desde fuera.
