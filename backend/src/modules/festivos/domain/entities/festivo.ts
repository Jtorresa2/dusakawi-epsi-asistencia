export interface FestivoRow {
  id: string;
  nombre: string;
  name: string;
  tipo: string;
  type: string;
  fecha: string;
  activo: boolean;
  active: boolean;
}

export interface FestivoBasico {
  id: string;
  nombre: string;
  tipo: string;
}

export interface CrearFestivoData {
  fecha: string;
  nombre: string;
  tipo?: string;
}

export interface ActualizarFestivoData {
  fecha?: string;
  nombre?: string;
  tipo?: string;
  activo?: boolean;
}

export interface ResultadoGenerarFestivos {
  insertados: number;
  existentes: number;
  total: number;
  year: number;
}