import type {
  ActualizarFestivoData,
  CrearFestivoData,
  FestivoBasico,
  FestivoRow,
  ResultadoGenerarFestivos,
} from '@modules/festivos/domain/entities/festivo';

export interface FestivoCreado {
  id: string;
  fecha: string;
  nombre: string;
  tipo: string;
}

export interface FestivoActualizado {
  id: string;
}

export interface FestivoEliminado {
  id: string;
}

export interface FestivoRepository {
  obtenerTodos(activo: boolean | null): Promise<FestivoRow[]>;
  obtenerPorId(id: string): Promise<FestivoRow | null>;
  crear(data: CrearFestivoData): Promise<FestivoCreado>;
  actualizar(id: string, data: ActualizarFestivoData): Promise<FestivoActualizado>;
  eliminar(id: string): Promise<FestivoEliminado>;
  verificar(fecha: string): Promise<FestivoBasico | null>;
  generarNacionales(year: number): Promise<ResultadoGenerarFestivos>;
}