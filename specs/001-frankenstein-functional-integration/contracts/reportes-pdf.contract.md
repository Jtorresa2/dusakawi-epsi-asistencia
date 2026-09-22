# API Contract: Reportes e Informes Oficiales PDF

**Seguridad**: Rutas protegidas mediante `Authorization: Bearer <token>`

---

## 1. Indicadores y Tendencias del Dashboard

- **GET** `/api/reportes/indicadores`: Retorna métricas numéricas agregadas del día (`total_empleados`, `presentes_hoy`, `ausentes_hoy`, `tardanzas_hoy`, `incidencias_pendientes`).
- **GET** `/api/reportes/tendencia`: Retorna serie temporal de asistencia de los últimos 7 días.

---

## 2. Consultas Tabulares Filtradas

- **GET** `/api/reportes/asistencia?fecha_desde=...&fecha_hasta=...&area=...`: Lista de asistencia detallada para visualización en tabla del frontend.
- **GET** `/api/reportes/incidencias`: Consolidado de incidencias radicadas y su estado de aprobación.
- **GET** `/api/reportes/tardanzas`: Lista de registros con retraso y minutos acumulados.
- **GET** `/api/reportes/ausencias`: Registros de inasistencia por período.

---

## 3. Generación y Descarga de Documentos PDF

- **GET** `/api/pdf/asistencia?fecha_desde=...&fecha_hasta=...&area_id=...`:
  - Retorna un `Content-Type: application/pdf` con el reporte oficial de asistencias formateado con logotipo institucional, encabezados formales y líneas de firma.
- **GET** `/api/pdf/empleado/:id?mes=...&anio=...`:
  - Genera el certificado de asistencia mensual del empleado en formato PDF.
