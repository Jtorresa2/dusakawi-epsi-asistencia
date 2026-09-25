import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { calcularFestivosNacionales as calcularFestivos } from '@modules/festivos/application/services/festivos-nacionales';
import type { ActualizarFestivoData, CrearFestivoData, FestivoBasico, FestivoRow, ResultadoGenerarFestivos } from '@modules/festivos/domain/entities/festivo';
import type { FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

// SELECT idéntico al legacy: claves duplicadas (name, type, active) a propósito
// para conservar la forma exacta de la respuesta del backend original.
const SELECCION_FESTIVO = `
  SELECT
    id,
    name AS nombre,
    name,
    type AS tipo,
    type,
    TO_CHAR(date, 'YYYY-MM-DD') AS fecha,
    active AS activo,
    active
  FROM asistencia.holidays
`;

export class PrismaFestivoRepository implements FestivoRepository {
  async obtenerTodos(activo: boolean | null): Promise<FestivoRow[]> {
    const sql = Prisma.sql`
      ${Prisma.raw(SELECCION_FESTIVO)}
      WHERE 1=1
      ${activo !== null ? Prisma.sql`AND active = ${activo}` : Prisma.empty}
      ORDER BY date DESC
    `;
    return prisma.$queryRaw<FestivoRow[]>(sql);
  }

  async obtenerPorId(id: string): Promise<FestivoRow | null> {
    const rows = await prisma.$queryRaw<FestivoRow[]>`
      ${Prisma.raw(SELECCION_FESTIVO)}
      WHERE id = ${id}
    `;
    return rows[0] ?? null;
  }

  async crear(data: CrearFestivoData): Promise<{ id: string; fecha: string; nombre: string; tipo: string }> {
    const tipoValido = data.tipo || 'nacional';
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO asistencia.holidays (date, name, type, active)
      VALUES (${data.fecha}::date, ${data.nombre}, ${tipoValido}, true)
      RETURNING id
    `;
    return { id: rows[0]?.id ?? '', fecha: data.fecha, nombre: data.nombre, tipo: tipoValido };
  }

  async actualizar(id: string, data: ActualizarFestivoData): Promise<{ id: string }> {
    const sets: Prisma.Sql[] = [];
    if (data.fecha !== undefined) sets.push(Prisma.sql`date = ${data.fecha}::date`);
    if (data.nombre !== undefined) sets.push(Prisma.sql`name = ${data.nombre}`);
    if (data.tipo !== undefined) sets.push(Prisma.sql`type = ${data.tipo}`);
    if (data.activo !== undefined) sets.push(Prisma.sql`active = ${data.activo}`);

    if (sets.length > 0) {
      await prisma.$executeRaw`
        UPDATE asistencia.holidays SET ${Prisma.join(sets, ', ')} WHERE id = ${id}
      `;
    }

    return { id };
  }

  async eliminar(id: string): Promise<{ id: string }> {
    await prisma.$executeRaw`DELETE FROM asistencia.holidays WHERE id = ${id}`;
    return { id };
  }

  async verificar(fecha: string): Promise<FestivoBasico | null> {
    const rows = await prisma.$queryRaw<FestivoBasico[]>`
      SELECT id, name AS nombre, type AS tipo
      FROM asistencia.holidays
      WHERE date = ${fecha}::date AND active = TRUE
    `;
    return rows[0] ?? null;
  }

  async generarNacionales(year: number): Promise<ResultadoGenerarFestivos> {
    if (!year || year < 2000 || year > 2100) throw new Error('Año inválido');

    const lista = calcularFestivos(year);
    let insertados = 0;
    let existentes = 0;

    for (const festivo of lista) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM asistencia.holidays
        WHERE date = ${festivo.fecha}::date AND type = 'nacional'
      `;
      if (rows.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO asistencia.holidays (date, name, type, active)
          VALUES (${festivo.fecha}::date, ${festivo.nombre}, 'nacional', true)
        `;
        insertados++;
      } else {
        existentes++;
      }
    }

    return { insertados, existentes, total: lista.length, year };
  }
}