# Feature Specification: Integración Funcional del Sistema de Asistencia (Frankenstein Funcional)

**Feature Branch**: `001-frankenstein-functional-integration`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Has la refactorización del proyecto conforme lo plantea la constitución para lograr un sistema completamente funcional"

## Clarifications

### Session 2026-09-22
- Q: ¿Cómo se maneja la coexistencia entre el modelo de empleados y el de usuarios? → A: Unificación bajo la entidad `users` adaptando la capa de servicios backend para que `/api/empleados` opere sobre `users` y sus relaciones en el nuevo esquema, preservando compatibilidad con las pantallas del frontend sin duplicar entidades.
- Q: ¿Cómo se persiste y gestiona el módulo de horarios laborales y tolerancias? → A: Se incorporan las tablas complementarias `horarios` y `horario_detalle` en PostgreSQL para preservar la configuración por día de la semana y el cálculo fiel de retardos y asistencia.
- Q: ¿Qué estructura debe retornar la autenticación para sostener la sesión en el cliente? → A: Enriquecer la respuesta de `/api/auth/login` con `{ token, user }` (incluyendo id, nombre, email, rol y permisos) para garantizar compatibilidad directa con el flujo de sesión del frontend.
- Q: ¿Cómo se determinan las marcas de entrada y salida entre mañana y tarde? → A: Deducción secuencial automática por hora del día y marcas previas, asignando a `first_entry_time`, `first_departure_time`, `last_entry_time` o `last_departure_time` según corresponda sin exigir selección manual al usuario.
- Q: ¿Qué formatos de entrega deben cubrirse en el módulo de reportes? → A: Soporte completo dual, integrando tanto las consultas tabulares interactivas en pantalla (`/api/reportes`) como la generación de documentos oficiales membretados en PDF (`/api/pdf`) para auditoría y control interno.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación y Acceso Seguro de Empleados y Administradores (Priority: P1)

Como empleado o administrador de DUSAKAWI EPSI, quiero iniciar sesión de forma segura con mis credenciales institucionales para acceder a las funcionalidades del sistema según mi rol asignado (administrador, supervisor, empleado).

**Why this priority**: Es la puerta de entrada indispensable para toda la plataforma. Sin autenticación y control de acceso funcional, ningún usuario puede interactuar con el sistema.

**Independent Test**: Puede probarse de forma independiente intentando iniciar sesión con credenciales válidas e inválidas, verificando el acceso al menú correspondiente y la recuperación o cambio de contraseña del usuario.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con credenciales activas, **When** ingresa su usuario/correo y contraseña correcta en la pantalla de acceso, **Then** el sistema le permite ingresar, recibe el token y el contexto del usuario (nombre, rol y permisos), y muestra las opciones y vistas correspondientes a su nivel de acceso.
2. **Given** un usuario que ingresa credenciales erróneas, **When** intenta iniciar sesión, **Then** el sistema rechaza el intento y muestra un mensaje claro indicando que los datos son incorrectos.
3. **Given** un usuario autenticado, **When** solicita cambiar su contraseña personal proporcionando los datos requeridos, **Then** el sistema actualiza la clave y permite autenticarse posteriormente con la nueva credencial.

---

### User Story 2 - Registro y Control Diario de Asistencia (Priority: P1)

Como empleado de la institución, quiero registrar mis marcas de entrada y salida laboral diarias, y como supervisor o administrador, quiero monitorear dichos registros en tiempo real para asegurar el cumplimiento de la jornada laboral.

**Why this priority**: Es la función esencial del negocio de la aplicación: registrar con precisión la presencia del personal de la institución.

**Independent Test**: Puede probarse registrando la entrada y salida de un empleado en un día específico y verificando que la marca quede reflejada inmediatamente en el historial personal y en la vista de supervisión.

**Acceptance Scenarios**:

1. **Given** un empleado en su horario laboral matutino, **When** registra su marca de entrada, **Then** el sistema almacena la hora exacta en su primer ingreso matutino (`first_entry_time`) y confirma el registro exitoso.
2. **Given** un empleado que concluye su turno matutino o inicia/termina su jornada vespertina, **When** registra su marca, **Then** el sistema deduce y actualiza automáticamente la casilla correspondiente (`first_departure_time`, `last_entry_time` o `last_departure_time`).
3. **Given** un empleado autenticado, **When** consulta la sección "Mi Asistencia", **Then** el sistema le muestra el historial detallado de sus horas de entrada, salida y estado de asistencia del período seleccionado.

---

### User Story 3 - Gestión de Novedades, Incidencias y Justificaciones (Priority: P2)

Como empleado que experimenta una tardanza, ausencia justificada o permiso médico, quiero radicar una novedad o incidencia adjuntando soporte o justificación firmada, y como administrador o supervisor, quiero revisar, aprobar o rechazar dicha solicitud.

**Why this priority**: Permite regularizar inconsistencias de asistencia y mantener un registro auditado de permisos, licencias y justificaciones laborales.

**Independent Test**: Puede probarse creando una solicitud de incidencia con archivo adjunto por parte de un empleado, y luego aprobándola o rechazándola desde el panel administrativo con su debida justificación.

**Acceptance Scenarios**:

1. **Given** un empleado con una tardanza o permiso, **When** radica una incidencia especificando el tipo, descripción y adjunta el soporte correspondiente, **Then** el sistema registra la novedad en estado "Pendiente" y la notifica para revisión.
2. **Given** un supervisor o administrador revisando solicitudes pendientes, **When** evalúa una incidencia y decide aprobarla o rechazarla con una observación, **Then** el estado de la novedad se actualiza en el sistema y se refleja inmediatamente en el perfil del empleado.
3. **Given** un empleado autenticado, **When** consulta "Mis Solicitudes" o "Novedades", **Then** puede visualizar el estado actual, observaciones y respuesta de cada requerimiento enviado.

---

### User Story 4 - Administración de Estructura Organizacional, Empleados y Horarios (Priority: P2)

Como administrador del sistema, quiero gestionar la estructura de la entidad (pisos, áreas, cargos, tipos de documento), los perfiles de los empleados, la asignación de horarios laborales y el calendario de días festivos.

**Why this priority**: Provee los catálogos maestros y la configuración organizativa necesaria para que las reglas de asistencia y control de personal operen de manera coherente.

**Independent Test**: Puede probarse creando o editando un área, un cargo, asignándolo a un empleado, configurando un horario de trabajo y un día festivo, y validando que los datos persistan y estén disponibles en los formularios del sistema.

**Acceptance Scenarios**:

1. **Given** un administrador en el módulo de áreas o cargos, **When** registra una nueva área vinculada a un piso o un nuevo cargo, **Then** el sistema valida los campos obligatorios y lo añade al catálogo institucional.
2. **Given** un administrador gestionando empleados, **When** crea o actualiza los datos básicos, laborales y contractuales de un funcionario, **Then** la información queda vinculada con su área, cargo y tipo de documento correspondientes en la entidad unificada de usuarios.
3. **Given** un administrador en el módulo de festivos o configuración de horarios, **When** define un nuevo día no laboral o modifica la tolerancia de horario, **Then** el sistema aplica estas reglas al cómputo de asistencias del calendario laboral.

---

### User Story 5 - Generación de Reportes, Exportación de Documentos y Dashboard Operativo (Priority: P3)

Como directivo o administrador de talento humano, quiero visualizar los indicadores clave en un panel de control (asistencias del día, ausencias, incidencias pendientes), analizar tablas dinámicas de asistencia y generar reportes consolidados descargables en formato documental oficial para auditoría y toma de decisiones.

**Why this priority**: Facilita la supervisión global y la entrega de cuentas a la dirección de DUSAKAWI EPSI.

**Independent Test**: Puede probarse accediendo al panel principal para observar las métricas consolidadas del día, consultando las tablas de indicadores en pantalla y generando un reporte descargable en PDF con formato oficial por rango de fechas o por área.

**Acceptance Scenarios**:

1. **Given** un usuario con permisos administrativos, **When** ingresa al panel principal (dashboard), **Then** visualiza tarjetas con el resumen cuantitativo de presentes, ausentes, retardos e incidencias del día.
2. **Given** un administrador en el módulo de reportes, **When** filtra por fecha y área, **Then** el sistema muestra la tabla dinámica de indicadores de asistencia en pantalla con opción de exportación tabular.
3. **Given** un directivo que requiere el informe oficial consolidado de un período, **When** solicita la descarga documental, **Then** el sistema compila y genera un documento formal en formato PDF membretado listo para impresión y archivo institucional.

---

### Edge Cases

- **Marcas duplicadas o continuas**: Si un usuario intenta marcar entrada dos veces consecutivas en un intervalo de pocos segundos, el sistema debe registrar únicamente la primera y notificar que el registro ya fue procesado.
- **Registro en días festivos o no laborales**: Cuando un empleado marca asistencia en un día configurado como festivo institucional, el sistema debe registrar la marca etiquetándola como trabajo en día no hábil sin generar alertas de retardo indebidas.
- **Adjuntos de soporte de gran tamaño o formatos no admitidos**: Al radicar novedades, si el usuario intenta subir archivos que superan el límite establecido o en formatos no válidos, el sistema debe alertar antes del envío sin perder los datos del formulario.
- **Fallas de conexión durante la consulta de reportes**: Si la generación de un reporte extenso experimenta un tiempo de espera prolongado, el sistema debe informar al usuario amigablemente en lugar de congelar la pantalla.
- **Inconsistencia en datos de empleados antiguos**: Si existen registros históricos con campos opcionales no diligenciados, las vistas de visualización deben mostrar valores por defecto sin interrumpir la renderización.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE autenticar a los usuarios mediante credenciales válidas y retornar un token de acceso seguro junto con el contexto completo del usuario autenticado (identificador, nombre completo, correo, rol asignado y permisos), habilitando el control de acceso en la interfaz sin requerir peticiones adicionales.
- **FR-002**: El sistema DEBE permitir a los usuarios autenticados actualizar su contraseña personal siguiendo políticas básicas de seguridad.
- **FR-003**: El sistema DEBE registrar marcas de entrada y salida laboral asociadas al empleado deduciendo automáticamente la casilla horaria correspondiente (primer ingreso matutino, salida de mediodía, ingreso vespertino o salida definitiva) según la hora de captura y los registros preexistentes del día.
- **FR-004**: El sistema DEBE permitir a los empleados consultar su historial de marcaciones, retardos y ausencias personales.
- **FR-005**: El sistema DEBE permitir la creación y radicación de incidencias y novedades laborales, incluyendo tipo de justificación, descripción y archivo de soporte digital.
- **FR-006**: El sistema DEBE proveer a los supervisores/administradores una bandeja de revisión de incidencias con capacidad de aprobar, rechazar y asentar observaciones formales.
- **FR-007**: El sistema DEBE permitir la gestión completa (creación, edición, consulta y eliminación o desactivación) de pisos, áreas organizacionales y cargos institucionales.
- **FR-008**: El sistema DEBE gestionar a los empleados y usuarios de forma unificada bajo la entidad centralizada de usuarios, garantizando que tanto la gestión administrativa de usuarios como los servicios y vistas de empleados operen sobre el mismo registro y sus relaciones asociadas (identificación, cargo, área y rol).
- **FR-009**: El sistema DEBE gestionar el catálogo de tipos de documentos de identidad reconocidos por la entidad.
- **FR-010**: El sistema DEBE permitir la configuración de calendarios con festivos y jornadas especiales que afecten el cómputo de asistencia.
- **FR-011**: El sistema DEBE permitir parametrizar y persistir los horarios de trabajo detallados por día de la semana (turnos mañana y tarde) y los márgenes de tolerancia de entrada y salida, asegurando su aplicación directa al motor de cálculo de retardos y asistencias.
- **FR-012**: El sistema DEBE proveer un panel de control (dashboard) con estadísticas resumidas en tiempo real sobre asistencia, puntualidad y novedades pendientes.
- **FR-013**: El sistema DEBE generar consultas agregadas e indicadores de asistencia, retardos, incidencias y ausencias para visualización interactiva y tabular en pantalla por funcionario, por área y por rango de fechas.
- **FR-014**: El sistema DEBE permitir la exportación de reportes de asistencia y justificaciones tanto en formato tabular como en documentos oficiales membretados en PDF listos para archivo, auditoría y control interno institucional.
- **FR-015**: La interfaz de usuario DEBE consumir de forma transparente los servicios de negocio integrados sin requerir cambios en los flujos operativos existentes.

### Key Entities

- **Usuario / Empleado**: Representa a la persona vinculada a la institución de manera unificada. En el modelo de datos centralizado no existen entidades separadas para usuarios y empleados; todo funcionario registrado cuenta con identificación oficial (`document_details`), cargo institucional (`positions`), área de adscripción (`areas`) y, si aplica, credenciales de acceso al sistema (`username`, `password_hash`).
- **Detalle de Documento**: Información oficial de identidad del funcionario, incluyendo tipo de documento, número de identificación, fecha y lugar de expedición.
- **Registro de Asistencia**: Registro diario de jornada laboral que consigna la identificación del empleado, hora de primera entrada, última salida y marcas intermedias (`first_entry_time`, `first_departure_time`, `last_entry_time`, `last_departure_time`).
- **Incidencia / Novedad**: Registro formal de una situación que altera la jornada habitual (permiso, incapacidad, retardo, ausencia), con estado de aprobación, evidencia digital, motivo de rechazo y observaciones de revisión.
- **Área y Piso**: Unidades de la estructura física y organizacional donde laboran los funcionarios.
- **Cargo**: Posición o denominación funcional del empleado dentro de la entidad.
- **Festivo**: Día no laborable oficial o institucional registrado en el calendario laboral.
- **Configuración de Horario**: Entidad relacional compuesta por el horario maestro y su detalle por día de la semana (`horarios` y `horario_detalle`), estableciendo horas de entrada, horas de salida para jornadas de mañana y tarde, y minutos de tolerancia institucional.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los módulos operativos del sistema (autenticación, asistencia, novedades, empleados, estructura organizacional, festivos, horarios, dashboard y reportes) deben ser accesibles y operativos desde la interfaz de usuario.
- **SC-002**: Los empleados pueden registrar su marca de asistencia en menos de 5 segundos desde el momento en que acceden a la opción de marcación.
- **SC-003**: Los administradores pueden consultar el resumen diario de asistencia en el panel de control con un tiempo de carga inferior a 3 segundos en condiciones normales de uso.
- **SC-004**: Los reportes consolidados de asistencia por período y área pueden generarse y descargarse en formato documental en menos de 10 segundos para períodos de hasta un mes.
- **SC-005**: El índice de éxito en el registro de incidencias y carga de soportes justificados por parte de los usuarios debe ser de al menos el 95% al primer intento sin interrupciones del servicio.

## Assumptions

- Se mantiene el modelo y estructura de datos unificada ya establecida para la entidad en la base de datos centralizada, integrando las tablas complementarias indispensables de horarios para el cálculo de jornada laboral.
- Las vistas existentes de la interfaz de usuario ya cuentan con los formularios y elementos visuales necesarios, por lo que su diseño y lógica visual se preservan, sincronizando únicamente la comunicación con los servicios del sistema.
- Los módulos existentes que cubren funcionalidades no refactorizadas previamente (asistencias, novedades, festivos, reportes, horarios) se integran directamente asegurando su interoperabilidad con el núcleo refactorizado (autenticación, usuarios y estructura organizacional).
- No se requieren pruebas automatizadas adicionales según lo dictamina explícitamente el principio de gobernanza del proyecto, validándose la operatividad mediante verificación funcional directa de los flujos de usuario.
