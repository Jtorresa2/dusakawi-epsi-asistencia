-- =============================================
-- Migración Horarios v2 — FASE 1 módulo Horarios
-- =============================================
-- Idempotente. NO toca los 6 horarios existentes,
-- ni su horario_detalle, ni usuarios, ni borra nada.
-- Agrega columnas de modalidad/jornada, crea
-- asignaciones_horario y añade 2 horarios nuevos:
-- 'Call Center' y 'Operativo de Aseo' (SERIAL 7 y 8).

-- 1. Columnas nuevas en horarios
ALTER TABLE horarios
    ADD COLUMN IF NOT EXISTS modalidad                VARCHAR(20)  NOT NULL DEFAULT 'estricto',
    ADD COLUMN IF NOT EXISTS tipo_jornada             VARCHAR(20)  NOT NULL DEFAULT 'fija',
    ADD COLUMN IF NOT EXISTS descripcion              TEXT,
    ADD COLUMN IF NOT EXISTS horas_esperadas          DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS activo                   BOOLEAN      NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tolerancia_salida_minutos INTEGER      NOT NULL DEFAULT 0;

-- 1b. Columna es_por_defecto (FASE 3: único horario por defecto)
ALTER TABLE horarios
    ADD COLUMN IF NOT EXISTS es_por_defecto BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Tabla asignaciones_horario
CREATE TABLE IF NOT EXISTS asignaciones_horario (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    horario_id       INTEGER NOT NULL REFERENCES horarios(id),
    vigencia_desde   DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_hasta   DATE,
    motivo           VARCHAR(255),
    asignado_por     INTEGER REFERENCES usuarios(id),
    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Comentarios de documentación
COMMENT ON COLUMN horarios.modalidad
    IS 'Modalidad de cumplimiento: ''estricto'' (cumplir el horario exacto) | ''flexible'' (banda amplia / por horas)';
COMMENT ON COLUMN horarios.tipo_jornada
    IS 'Tipo de jornada: ''fija'' (horas predeterminadas) | ''por_horas'' (rotativo, cuenta horas trabajadas)';

-- 4. Defaults para los 6 horarios existentes (red de seguridad)
UPDATE horarios SET modalidad = 'estricto', tipo_jornada = 'fija'
 WHERE modalidad IS NULL OR tipo_jornada IS NULL;

-- 5. Horarios nuevos (SIN id fijo — el SERIAL asigna el siguiente, hoy 7 y 8)
INSERT INTO horarios (nombre, modalidad, tipo_jornada, horas_esperadas, descripcion)
SELECT 'Call Center', 'flexible', 'por_horas', 6.5,
       'Jornada por horas trabajadas (6h, 6.5h, nocturno 11h)'
WHERE NOT EXISTS (SELECT 1 FROM horarios WHERE nombre = 'Call Center');

INSERT INTO horarios (nombre, modalidad, tipo_jornada, horas_esperadas, descripcion)
SELECT 'Operativo de Aseo', 'estricto', 'fija', NULL,
       'Horario fijo 06:00-11:00 y 13:00-15:00'
WHERE NOT EXISTS (SELECT 1 FROM horarios WHERE nombre = 'Operativo de Aseo');

-- 6. Detalle para 'Operativo de Aseo' (Lunes a Viernes)
--    'Call Center' queda SIN detalle: es rotativo por horas.
--    NOTA: el Sábado se retiró porque el personal de aseo no trabaja ese día
--    (confirmado por el cliente, 2026-08-05).
INSERT INTO horario_detalle (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana, hora_entrada_tarde, hora_salida_tarde)
SELECT h.id, d.dia_semana, d.hora_entrada_manana, d.hora_salida_manana, d.hora_entrada_tarde, d.hora_salida_tarde
FROM (
    SELECT unnest(ARRAY['Lunes','Martes','Miércoles','Jueves','Viernes']) AS dia_semana,
           '06:00'::time AS hora_entrada_manana,
           '11:00'::time AS hora_salida_manana,
           '13:00'::time AS hora_entrada_tarde,
           '15:00'::time AS hora_salida_tarde
) d
JOIN horarios h ON h.nombre = 'Operativo de Aseo'
WHERE NOT EXISTS (
    SELECT 1 FROM horario_detalle hd
    WHERE hd.horario_id = h.id AND hd.dia_semana = d.dia_semana
);
