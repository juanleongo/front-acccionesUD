# Funcionalidades futuras

No hay módulos de negocio implementados. Crear cada funcionalidad cuando exista
una tarea y un contrato revisado; consultar [la guía del equipo](../../docs/development/guide.md).
Cada módulo publica `index.ts` (seguro para cliente) y, sólo si lo necesita,
`server.ts` con `import 'server-only'`. No importar sus carpetas internas desde fuera.
