<!-- 
Sync Impact Report:
- Version change: 1.0.0 → 2.0.0 (MAJOR: Complete change of paradigm to Frankenstein Funcional)
- List of modified principles:
  - I. Library-First → I. Objetivo: "Frankenstein Funcional"
  - II. CLI Interface → II. Prioridad del Código Nuevo (TypeScript)
  - III. Test-First (NON-NEGOTIABLE) → III. Adaptación a Nueva Base de Datos
  - IV. Integration Testing → IV. Rescate y Coexistencia Híbrida TS/JS
  - V. Observability... → V. Cero Tests y Modificaciones Estrictas
- Added sections: Directrices para el Frontend
- Removed sections: Sections 2 & 3 replaced by context-specific instructions.
- Templates requiring updates (⚠ pending):
  - .specify/templates/plan-template.md (Remove testing steps, update constitution gates)
  - .specify/templates/spec-template.md (Remove testing sections, update to Frankenstein approach)
  - .specify/templates/tasks-template.md (Remove TDD and testing phases)
-->
# DUSAKAWI EPSI Asistencia Constitution

## Core Principles

### I. Objetivo: "Frankenstein Funcional"
No se debe continuar la refactorización profunda iniciada. El objetivo fundamental y único ahora es crear un sistema 100% operativo de inmediato, fusionando el código que ya se alcanzó a refactorizar con el código legacy existente. Toda decisión técnica debe subordinarse a tener la aplicación en producción lo antes posible.

### II. Prioridad del Código Nuevo (TypeScript)
El código que ya fue refactorizado (TypeScript) se considera la "fuente de la verdad" para esos módulos. Debe mantenerse intacto y reemplazar siempre a su contraparte en el código antiguo.

### III. Adaptación Estricta al Nuevo Esquema de Base de Datos
El esquema de PostgreSQL (montado en Docker) definido durante la refactorización se mantendrá para todo el sistema. El código antiguo (JavaScript) debe ser modificado SÓLO en sus sentencias SQL/ORM para que apunten de forma correcta y funcional al nuevo esquema de base de datos.

### IV. Rescate y Coexistencia Híbrida TS/JS
Los módulos que no se alcanzaron a refactorizar (ej. correos, cambio de contraseña, archivos) deben integrarse directamente como código antiguo (JS) al flujo actual. La configuración de Node.js, Express, tsconfig, package.json y el bundler/runner MUST estar ajustada para permitir la ejecución híbrida de archivos `.js` y `.ts` sin ninguna fricción.

### V. Cero Tests y Modificaciones Estrictas (RESTRICCIÓN NO NEGOCIABLE)
Está terminantemente prohibido escribir, configurar, o arreglar cualquier tipo de test (unitario, integración, e2e). El testing queda completamente ignorado. Asimismo, NO se debe intentar "mejorar", limpiar, o refactorizar el código antiguo que se está integrando, a menos que sea estrictamente necesario para que interactúe con la nueva BD o con el código TS.

## Directrices para el Frontend (React + Vite)
El frontend permanece completamente en JavaScript y no requiere refactorización de la lógica de UI. La tarea principal en el frontend es exclusivamente actualizar la capa de servicios y peticiones (fetch/axios) utilizando los endpoints existentes como guía, para que consuma correctamente los endpoints del backend híbrido resultante.

## Governance
El cumplimiento estricto de este enfoque "Frankenstein" prevalece sobre cualquier buena práctica de arquitectura limpia o purista. 
- **Enmiendas:** Cualquier desviación de este enfoque, como intentar refactorizar un módulo JS a TS, requerirá autorización administrativa y actualización de este documento.
- **Versioning:** Seguiremos Semantic Versioning (MAJOR.MINOR.PATCH) para la constitución.
- **Compliance Review:** Todas las revisiones de código deben centrarse únicamente en la operatividad de la integración, la conexión correcta a BD y garantizar que no se haya añadido código de test ni refactorizaciones cosméticas.

**Version**: 2.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
