-- =====================================================================
-- Importacion de empleados del ERP como personas en asistencia.users
-- =====================================================================
-- Los 570 empleados del ERP son personas sujetas de asistencia, pero NO
-- son cuentas de acceso al portal. Esta importacion los da de alta en
-- asistencia.users con is_account = FALSE y sin credenciales, para que el
-- sistema de asistencia (attendances, horarios, reportes, seguimiento,
-- dashboard, PDF) pueda identificarlos.
--
-- users sigue siendo la tabla de personas: el nombre `usuario_id` de la
-- UI y el nombre `empleado_id` de los DTOs son cosmeticos.
--
-- El CARGO si viene del ERP (sc_empleado.cargo). Se normaliza con el
-- formato pedido: SOLO la primera letra en mayuscula, el resto en
-- minusculas. Ej: "AGENTE EDUCATIVO EN SALUD" -> "Agente educativo en salud".
-- No se quitan acentos: "Auxiliar de afiliación y registro" (7 personas) y
-- "Auxiliar de afiliacion y registro" (13) son cargos DISTINTOS y se
-- conservan asi. Los typos del ERP ("segumiento", "huerfanas", etc.) NO se
-- corrigen: son datos de origen.
--
-- El AREA no viene del ERP: la columna `areas` de sc_empleado esta vacia en
-- las 570 filas. Queda en NULL y la configura el usuario editando al empleado.
--
-- IDEMPOTENTE: se puede correr las veces que sea.
--   - Una persona ya importada (cedula existente en document_details) se omite.
--   - Un cargo ya existente en positions se reutiliza (uq_positions_name).
--
-- Uso:
--   psql -v preview=1 -f import-empleados-personas.sql   (solo calcula)
--   psql -v preview=0 -f import-empleados-personas.sql   (escribe)
-- =====================================================================

\set ON_ERROR_STOP on
\if :{?preview}
\else
  \set preview 1
\endif

BEGIN;

SET LOCAL search_path TO asistencia, public;

-- ---------------------------------------------------------------------
-- 1. Base: funcion del ERP + lugar de nacimiento y direccion.
--    El puente con sc_empleado es numero_identificacion (la cedula),
--    not consecutivo_empleado.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _imp_base ON COMMIT DROP AS
SELECT
  le.consecutivo_empleado,
  btrim(le.numero_identificacion)                                       AS numero_identificacion,
  initcap(lower(btrim(le.primer_nombre)))                               AS primer_nombre,
  NULLIF(initcap(lower(btrim(COALESCE(le.segundo_nombre, '')))), '')   AS segundo_nombre,
  initcap(lower(btrim(le.primer_apellido)))                             AS primer_apellido,
  NULLIF(initcap(lower(btrim(COALESCE(le.segundo_apellido, '')))), '') AS segundo_apellido,
  le.fecha_nacimiento,
  NULLIF(btrim(COALESCE(le.celular, '')), '')         AS celular,
  NULLIF(btrim(COALESCE(sce.lugar_nacimiento, '')), '') AS lugar_nacimiento,
  NULLIF(btrim(COALESCE(sce.direccion, '')), '')      AS direccion,
  NULLIF(lower(btrim(COALESCE(le.email, ''))), '')    AS email_norm,
  -- Cargo del ERP: se colapsan espacios internos y extremos. No se quitan
  -- acentos ni se corrigen typos: es el dato de origen.
  NULLIF(
    regexp_replace(btrim(COALESCE(le.cargo, '')), '\s+', ' ', 'g'),
    ''
  )                                                    AS cargo_original
FROM asistencia.listar_empleados() le
LEFT JOIN administrativo.sc_empleado sce
  ON sce.numero_identificacion = le.numero_identificacion;

-- ---------------------------------------------------------------------
-- 2. Normalizacion del cargo al formato pedido: solo la primera letra en
--    mayuscula. Se hace sobre el texto ya colapsado.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _imp_cargos ON COMMIT DROP AS
SELECT
  upper(left(cargo_original, 1)) || lower(substring(cargo_original from 2))
    AS cargo_normalizado,
  count(*)                              AS empleados,
  string_agg(DISTINCT cargo_original, ' | ') AS originales
FROM _imp_base
WHERE cargo_original IS NOT NULL
GROUP BY 1;

ALTER TABLE _imp_base
  ADD COLUMN cargo_norm TEXT;
UPDATE _imp_base b
   SET cargo_norm =
         upper(left(b.cargo_original, 1))
         || lower(substring(b.cargo_original from 2))
 WHERE b.cargo_original IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. Regla de email: vacio -> NULL. Repetido -> NULL para TODOS los
--    miembros del grupo (decidido: el usuario los completa a mano).
--
--    REGLA ADICIONAL: un email que YA existe en `users` (las 2 cuentas
--    Administrador y Talento) tambien se anula. Caso real: el empleado
--    JULIANA TORRES (cedula 1015995066) trae
--    TORRESAARONJULIANA@GMAIL.COM, que es el mismo email de la cuenta
--    Administrador. Son dos personas distintas, asi que la persona del ERP
--    entra con email NULL.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _imp_emp ON COMMIT DROP AS
SELECT
  b.*,
  CASE
    WHEN b.email_norm IS NULL THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM _imp_base o
      WHERE o.email_norm = b.email_norm
      HAVING count(*) > 1
    ) THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM users u WHERE lower(btrim(u.email)) = b.email_norm AND u.is_account = TRUE
    ) THEN NULL
    ELSE b.email_norm
  END AS email_final
FROM _imp_base b;

-- ---------------------------------------------------------------------
-- 4. Candidatas: empleados cuya cedula todavia no existe en
--    document_details. Ese es el criterio de idempotencia.
--    El UUID se pre-genera aqui para poder vincular la cedula sin depender
--    del orden de retorno del INSERT.
--
--    `_imp_cargo_id` resuelve el position_id de cada persona. Las 10
--    positions de prueba estan en Title Case ("Coordinador de Talento
--    Humano") y el formato pedido las genera en minuscula ("Coordinador de
--    talento humano"), asi que el match es case-INsensitive sobre `lower()`.
--    Se reutiliza la fila existente (no se crea un duplicado) y la cuenta de
--    Talento sigue apuntando a su position original.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _imp_nuevas ON COMMIT DROP AS
SELECT
  e.*,
  gen_random_uuid() AS new_id
FROM _imp_emp e
WHERE e.numero_identificacion IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM document_details dd
    WHERE dd.document_number = e.numero_identificacion
  );

-- ---------------------------------------------------------------------
-- 4b. Reusa una position existente si su nombre coincide ignorando mayusculas.
-- ---------------------------------------------------------------------
ALTER TABLE _imp_nuevas
  ADD COLUMN cargo_position_id UUID;

UPDATE _imp_nuevas n
   SET cargo_position_id = p.id
  FROM positions p
 WHERE n.cargo_norm IS NOT NULL
   AND lower(p.name) = lower(n.cargo_norm);

\if :preview
\else
-- ---------------------------------------------------------------------
-- 5. Catalogo de cargos: se crean solo los que no existen, comparando
--    case-insensitive. Si un cargo del ERP coincide con una de las 10
--    positions de prueba (p.ej. "Coordinador de Talento Humano"), se REUSA
--    esa fila y no se duplica.
--    description es NOT NULL: se guarda el nombre original del ERP como
--    trazabilidad de de donde salio el cargo.
-- ---------------------------------------------------------------------
INSERT INTO positions (name, description, active, area_id)
SELECT
  c.cargo_normalizado,
  'Importado del ERP: ' || c.originales,
  TRUE,
  NULL
FROM _imp_cargos c
WHERE NOT EXISTS (
  SELECT 1 FROM positions p WHERE lower(p.name) = lower(c.cargo_normalizado)
)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. Insercion de las personas. Lo que no se conoce queda NULL:
--    credenciales y area.
-- ---------------------------------------------------------------------
WITH ins AS (
  INSERT INTO users (
    id,
    first_name,
    middle_name,
    first_surname,
    second_surname,
    date_of_birth,
    place_of_birth,
    address,
    phone,
    position_id,
    area_id,
    schedule_id,
    username,
    password_hash,
    email,
    is_account,
    active,
    password_reset_required
  )
  SELECT
    n.new_id,
    n.primer_nombre,
    n.segundo_nombre,
    n.primer_apellido,
    n.segundo_apellido,
    n.fecha_nacimiento,
    n.lugar_nacimiento,
    n.direccion,
    n.celular,
    COALESCE(
      n.cargo_position_id,
      (SELECT p2.id FROM positions p2
        WHERE lower(p2.name) = lower(n.cargo_norm))
    ),   -- position_id: cargo normalizado del ERP (puede reusar una existente)
    NULL,   -- area_id:     lo configura el usuario editando al empleado
    NULL,   -- schedule_id: sin horario hasta que se asigne
    NULL,   -- username:    no es cuenta
    NULL,   -- password_hash: no es cuenta
    n.email_final,
    FALSE,  -- is_account: persona, no cuenta
    TRUE,
    FALSE   -- password_reset_required: sin password no hay nada que resetear
  FROM _imp_nuevas n
  RETURNING id
)
-- Vincula la cedula al id pre-generado: la correspondencia es exacta,
-- no depende del orden de las filas.
-- document_type_id se resuelve de document_types por nombre real.
SELECT count(*) AS inserted_people
FROM ins;

WITH ins_docs AS (
  INSERT INTO document_details (
    document_type_id,
    user_id,
    document_number,
    issue_date,
    place_of_issue
  )
  SELECT
    -- Se busca por UUID de codigo Unicode (U&'...') y no por el literal
    -- acentuado: asi el script funciona aunque el cliente psql no envie el
    -- archivo como UTF-8 y los acentos no se pierdan al comparar.
    (SELECT id FROM document_types
      WHERE name = U&'C\00E9dula de Ciudadan\00EDa'),
    n.new_id,
    n.numero_identificacion,
    NULL,  -- issue_date:     no viene del ERP, no se inventa
    NULL   -- place_of_issue: no viene del ERP, no se inventa
  FROM _imp_nuevas n
  ON CONFLICT DO NOTHING
  RETURNING user_id
)
SELECT count(*) AS inserted_documents FROM ins_docs;
\endif

-- ---------------------------------------------------------------------
-- 7. Reporte.
-- ---------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM _imp_emp)                          AS leidos_erp,
  (SELECT count(*) FROM _imp_nuevas)                      AS a_insertar,
  (SELECT count(*) FROM _imp_emp) - (SELECT count(*) FROM _imp_nuevas) AS ya_existian,
  (SELECT count(*) FROM _imp_emp WHERE email_norm IS NULL) AS email_vacio,
(SELECT count(*) FROM _imp_emp
      WHERE email_norm IS NOT NULL
        AND email_final IS NULL
        AND NOT EXISTS (SELECT 1 FROM _imp_base o
                         WHERE o.email_norm = _imp_emp.email_norm
                         HAVING count(*) > 1)
        AND NOT EXISTS (SELECT 1 FROM users u
                         WHERE lower(btrim(u.email)) = _imp_emp.email_norm
                           AND u.is_account = TRUE)
  )                                                      AS email_ya_usado_por_cuenta,
  (SELECT count(*) FROM _imp_emp
     WHERE email_norm IS NOT NULL AND email_final IS NULL) AS email_repetido,
  (SELECT count(*) FROM _imp_emp
     WHERE lugar_nacimiento IS NULL)                       AS sin_lugar_nacimiento,
  (SELECT count(*) FROM _imp_emp
     WHERE direccion IS NULL)                              AS sin_direccion;

-- ---------------------------------------------------------------------
-- 8. Cargos: cuantos se crearian y cuantos quedan sin position_id.
-- ---------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM _imp_cargos)                       AS cargos_erp,
  (SELECT count(*) FROM _imp_cargos c
     WHERE EXISTS (SELECT 1 FROM positions p
                    WHERE lower(p.name) = lower(c.cargo_normalizado))
  )                                                      AS ya_existian_en_positions,
  (SELECT count(*) FROM _imp_cargos c
     WHERE NOT EXISTS (SELECT 1 FROM positions p
                        WHERE lower(p.name) = lower(c.cargo_normalizado))
  )                                                      AS nuevos_a_crear,
  (SELECT count(*) FROM _imp_nuevas n
     WHERE n.cargo_norm IS NOT NULL
       AND n.cargo_position_id IS NULL)                    AS cargos_por_resolver,
  (SELECT count(*) FROM _imp_nuevas
     WHERE cargo_norm IS NULL)                             AS personas_sin_cargo;

-- ---------------------------------------------------------------------
-- 9. Detalle de los emails que quedaron en NULL por estar repetidos:
--    el usuario los completa a mano.
-- ---------------------------------------------------------------------
SELECT
  n.consecutivo_empleado,
  n.numero_identificacion,
  n.primer_nombre,
  n.primer_apellido,
  n.email_norm,
  CASE
    WHEN EXISTS (SELECT 1 FROM _imp_base o
                  WHERE o.email_norm = n.email_norm
                  HAVING count(*) > 1)
      THEN 'repetido entre empleados'
    ELSE 'ya usado por una cuenta'
  END AS motivo
FROM _imp_emp n
WHERE n.email_norm IS NOT NULL
  AND n.email_final IS NULL
ORDER BY n.email_norm, n.consecutivo_empleado;

\if :preview
-- Preview: no hay nada que confirmar, se descarta.
ROLLBACK;
\echo 'PREVIEW: no se escribio nada. Correr con -v preview=0 para aplicar.'
\else
COMMIT;
\echo 'Aplicado.'
\endif