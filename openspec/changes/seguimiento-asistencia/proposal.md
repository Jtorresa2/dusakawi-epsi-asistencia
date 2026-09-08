# Proposal: Seguimiento de Asistencia

## Intent

Crear una vista operacional de solo lectura ("Seguimiento") que muestre situaciones detectadas en la asistencia que requieren revisión humana: jornadas abiertas, ausencias de día completo sin novedad justificativa, y faltas de marcación por tramo (mañana/tarde). NO es un módulo de corrección — solo visibilidad para que Talento Humano decida si abrir una Incidencia formal.

## Scope

### In Scope
- Nuevo endpoint `GET /api/seguimiento` con filtros (fecha, rango, área, piso, situación)
- Nueva página `SeguimientoAsistenciaPage.jsx` siguiendo patrón visual de `IncidenciasPage.jsx`
- Detección de 3 situaciones operativas derivadas de datos existentes:
  1. **Jornada abierta** — `asistencia.marcacion_estado = 'abierta'` (tramo abierto o no iniciado)
  2. **Ausencia de día completo** — `asistencia.estado = 'ausente'` SIN novedad aprobada que cubra el día
  3. **Falta de marcación** — tramo específico sin entrada (mañana o tarde) SIN novedad aprobada que lo justifique
- Export Excel + PDF siguiendo mismo patrón que IncidenciasPage
- Acciones permitidas: Ver detalle, Ver asistencia, Ver en Incidencias (solo si ya existe incidencia formal)

### Out of Scope
- Registrar/corregir marcaciones (solo mecanismo autorizado: biométrico/QR/GPS)
- Cerrar jornadas manualmente
- Aprobar/rechazar situaciones (eso vive en Incidencias)
- Auto-crear incidencias `ausencia_dia_completo`, `ausencia_mañana`, `ausencia_tarde`
- Nuevo estado `incompleta` / `cerrada` en asistencia
- Nueva tabla o campos en BD

## Capabilities

### New Capabilities
- `seguimiento-asistencia`: Vista operacional de situaciones detectadas que requieren revisión

### Modified Capabilities
- None — reutiliza `asistencia`, `novedades`, `incidencias` existentes sin cambios en sus requisitos

## Approach

**Backend**: Nuevo `seguimientoController.js` + `seguimientoRoutes.js` con endpoint `GET /api/seguimiento` que:
1. Consulta `asistencia` en rango de fechas con joins a `usuarios`, `areas`, `horarios`, `horario_detalle`
2. Para cada registro, deriva la situación:
   - Si `marcacion_estado = 'abierta'` → "Jornada abierta"
   - Si `estado = 'ausente'` Y no existe novedad aprobada (`estado='aprobado'`) que cubra la fecha → "Ausencia de día completo"
   - Si mañana cerrada (`entrada + salida_manana` existen) PERO `entrada_tarde` es NULL Y no hay novedad aprobada tipo `tarde`/`dia_completo`/`horas` solapando tarde → "Falta de marcación — Tarde"
   - Si `entrada` es NULL (sin ninguna marca) → "Falta de marcación — Mañana" (cubierto por ausencia día completo si no hay novedad)
3. Verifica existencia de incidencia formal vinculada (misma `usuario_id`, `fecha`, tipos `falla_biometrica`, `salida_no_registrada`, `tardanza`, `ausencia_tarde`) para acción "Ver en Incidencias"
4. Filtros: fecha/fecha_desde/fecha_hasta, area, piso, situacion (abierta|ausente|falta_marcacion), busqueda (empleado/cedula)

**Frontend**: `SeguimientoAsistenciaPage.jsx` con:
- Stat cards: Total, Jornadas abiertas, Ausencias día completo, Faltas de marcación
- Tabla con columnas: Empleado, Área/Piso, Fecha, Situación, Tramo (si aplica), Jornada (abierta/completa), Incidencia vinculada (sí/no + link), Acciones
- Filtros inline igual a IncidenciasPage (fecha, tipo situación, área, búsqueda, más filtros)
- Export Excel/PDF botón con menú (igual patrón IncidenciasPage)
- Click en fila → modal detalle (ver marcas, horario esperado, novedades del día, incidencias vinculadas)
- Acciones: Ver detalle (modal), Ver asistencia (navega a AsistenciaPage filtrado), Ver en Incidencias (solo si existe, navega a IncidenciaExpedientePage)

**Data Sources & Reuse Strategy**:
- `asistencia` — fuente principal (timestamps, estado, marcacion_estado)
- `novedades` — filtro de justificación (solo `estado='aprobado'`, tipos `dia_completo`, `tarde`, `horas` solapando tarde, `manana`)
- `incidencias` — lookup de vinculación existente (NO auto-crear)
- `horarios` + `horario_detalle` — horas esperadas por tramo para UI
- `usuarios` + `areas` — datos de empleado y filtros

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/controllers/seguimientoController.js` | New | Lógica de detección de situaciones y endpoint |
| `backend/src/routes/seguimientoRoutes.js` | New | Rutas del endpoint |
| `backend/src/index.js` | Modified | Registro de nuevas rutas |
| `frontend/src/features/seguimiento/` | New | Feature completa (api, pages, components) |
| `frontend/src/App.jsx` | Modified | Nueva ruta `/seguimiento` |
| `frontend/src/features/incidencias/pages/IncidenciasPage.jsx` | Reference | Patrón visual/funcional a replicar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Confusión entre Seguimiento e Incidencias (usuarios intentan "corregir" desde Seguimiento) | High | UI clara: sin botones de edición, tooltips explicativos, copia literal "Solo lectura — Use Incidencias para gestión formal" |
| Falsos positivos en "Falta de marcación" por horarios flexibles/por_horas | Medium | Excluir modalidades `flexible`/`por_horas` de detección de falta de marcación; solo jornadas `estricto`/`fija` |
| Performance en rangos grandes (mes completo) | Low | Índices existentes en `asistencia(usuario_id, fecha)`, paginación en frontend, límite 500 filas |
| Doble conteo: ausencia día completo + falta marcación mañana | Medium | Lógica exclusiva: si `estado='ausente'` → solo "Ausencia de día completo"; "Falta de marcación" solo para jornadas CON al menos una marca |

## Rollback Plan

1. Eliminar rutas en `backend/src/index.js`
2. Borrar `seguimientoController.js`, `seguimientoRoutes.js`
3. Borrar `frontend/src/features/seguimiento/`
4. Quitar ruta en `App.jsx`
5. Sin migraciones de BD (no hay cambios de esquema)

## Dependencies

- Ninguna externa nueva
- Reutiliza `pdfTemplate.js` para generación PDF (mismo patrón Incidencias)
- Reutiliza `xlsx` para Excel (ya en deps)

## Success Criteria

- [ ] Endpoint responde < 500ms para rango 30 días / 500 empleados
- [ ] UI idéntica a IncidenciasPage en colores, tipografía, espaciado, comportamiento de filtros/export
- [ ] Cero falsos positivos en horario `flexible`/`por_horas`
- [ ] "Ver en Incidencias" solo habilitado cuando existe incidencia formal vinculada
- [ ] Export Excel/PDF incluye mismas columnas que tabla visible + situación + tramo
- [ ] Sin regresiones en AsistenciaPage, IncidenciasPage, novedades, marcaciones