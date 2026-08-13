-- Fija usuarios.horario_id como espejo derivado de asignaciones_horario.
-- La asignación vigente = vigencia_desde <= CURRENT_DATE AND (vigencia_hasta IS NULL OR vigencia_hasta > CURRENT_DATE),
-- tomando la más reciente (vigencia_desde DESC, id DESC).
-- NOTA: se usa > y no >= para que una asignación cerrada hoy (vigencia_hasta = CURRENT_DATE,
-- típico de desasignar) deje horario_id = NULL el mismo día, preservando el comportamiento
-- del código original que hacía UPDATE usuarios SET horario_id = NULL tras desasignar.

CREATE OR REPLACE FUNCTION sync_usuarios_horario_cache() RETURNS TRIGGER AS $$
DECLARE
  uid INTEGER;
BEGIN
  uid := COALESCE(NEW.usuario_id, OLD.usuario_id);
  UPDATE usuarios u
  SET horario_id = (
    SELECT a.horario_id
    FROM asignaciones_horario a
    WHERE a.usuario_id = uid
      AND a.vigencia_desde <= CURRENT_DATE
      AND (a.vigencia_hasta IS NULL OR a.vigencia_hasta > CURRENT_DATE)
    ORDER BY a.vigencia_desde DESC, a.id DESC
    LIMIT 1
  )
  WHERE u.id = uid;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_usuarios_horario_cache ON asignaciones_horario;
CREATE TRIGGER trg_sync_usuarios_horario_cache
AFTER INSERT OR UPDATE OR DELETE ON asignaciones_horario
FOR EACH ROW EXECUTE FUNCTION sync_usuarios_horario_cache();

-- Backfill: corrige cualquier desincronización existente.
UPDATE usuarios u SET horario_id = (
  SELECT a.horario_id
  FROM asignaciones_horario a
  WHERE a.usuario_id = u.id
    AND a.vigencia_desde <= CURRENT_DATE
    AND (a.vigencia_hasta IS NULL OR a.vigencia_hasta > CURRENT_DATE)
  ORDER BY a.vigencia_desde DESC, a.id DESC
  LIMIT 1
);
