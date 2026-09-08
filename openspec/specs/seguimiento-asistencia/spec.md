# Seguimiento de Asistencia Specification

## Purpose

Read-only operational view ("Seguimiento") that surfaces detected attendance situations requiring human review: open jornadas, full-day absences without an approved novedad, and per-tramo missing punches. It provides visibility only; formal management happens in Incidencias.

## Requirements

### Requirement: Read-only operational view

The system MUST expose `seguimiento-asistencia` as a read-only view with no write operations.

#### Scenario: View is read-only

- GIVEN a user with access to Seguimiento
- WHEN they open the view
- THEN the UI MUST NOT expose any button to register punches, close jornadas, correct, approve, or reject
- AND the view MUST show the message "Solo lectura — Use Incidencias para gestión formal"

### Requirement: Situations detection

The system MUST derive and display only these situations: `jornada_abierta`, `ausencia_dia_completo`, `falta_marcacion`.

#### Scenario: Open jornada

- GIVEN an `asistencia` record with `marcacion_estado = 'abierta'`
- WHEN queried in range
- THEN the situation is `jornada_abierta` and the jornada stays open and shown

#### Scenario: Full-day absence without novedad

- GIVEN an `asistencia` record with `estado = 'ausente'`
- AND no approved novedad (`estado='aprobado'`) covering that date
- WHEN queried
- THEN the situation is `ausencia_dia_completo`
- AND it MUST NOT be double-counted as `falta_marcacion`

#### Scenario: Full-day absence with novedad

- GIVEN an `asistencia` record with `estado = 'ausente'`
- AND an approved novedad (permiso, incapacidad, vacaciones, licencia) covering the date
- WHEN queried
- THEN the absence is justified and MUST NOT be shown as a non-compliance

### Requirement: Per-tramo missing punch

The system MUST detect `falta_marcacion` per tramo (`Mañana`|`Tarde`) only for jornadas with at least one mark and strict/fixed schedules.

#### Scenario: Missing afternoon punch

- GIVEN a jornada with `entrada` and `salida_manana` present, `entrada_tarde` NULL
- AND schedule is `estricto`/`fija`
- AND no approved novedad covering the tarde
- THEN the situation is `falta_marcacion` with tramo `Tarde`

#### Scenario: Justified missing punch

- GIVEN an approved novedad of type `tarde`/`dia_completo`/`horas` covering the afternoon
- WHEN queried
- THEN no `falta_marcacion` is reported for that tramo

#### Scenario: Flexible schedule excluded

- GIVEN a jornada with schedule modality `flexible`/`por_horas`
- WHEN queried
- THEN no `falta_marcacion` is reported

### Requirement: State and marcacion constraints

The system MUST treat `marcacion_estado` only as `abierta`|`completa`.

#### Scenario: Only two states

- GIVEN an `asistencia` record
- THEN `marcacion_estado` MUST be one of `abierta`|`completa`
- AND the view MUST NOT introduce `incompleta`/`cerrada`

### Requirement: Incidencia linkage (no auto-create)

The system MUST look up existing formal incidencias (types `falla_biometrica`, `salida_no_registrada`, `tardanza`, `ausencia_tarde`) for the same `usuario_id` and `fecha`, and MUST NOT auto-create any incidencia.

#### Scenario: Existing incidencia

- GIVEN a formal incidencia exists for the user and date
- WHEN the record is shown
- THEN "Ver en Incidencias" is enabled and links to the incidencia

#### Scenario: No existing incidencia

- GIVEN no formal incidencia exists for the user and date
- WHEN the record is shown
- THEN "Ver en Incidencias" is disabled

### Requirement: Filters and export

The system SHOULD support filters (`fecha`/range, `area`, `piso`, `situacion`, search by employee/cedula) and MUST support export to Excel and PDF matching the visible table columns.

#### Scenario: Export

- GIVEN a filtered result set
- WHEN the user exports Excel or PDF
- THEN the export includes the visible columns plus situation and tramo

#### Scenario: Filter by situation

- GIVEN a filter by `situacion` (`abierta`|`ausente`|`falta_marcacion`)
- WHEN applied
- THEN only matching records are shown

### Requirement: Role access

The system MUST restrict Seguimiento to authorized roles (e.g., Talento Humano/admin), consistent with Incidencias access.

#### Scenario: Unauthorized role

- GIVEN a user without the required role
- WHEN they request Seguimiento
- THEN access is denied
