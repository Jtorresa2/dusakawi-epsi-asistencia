export interface EmpleadoRow {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  empleado: string;
  correo: string;
  email: string | null;
  telefono: string;
  phone: string | null;
  fecha_nacimiento: string | null;
  cargo_id: string | null;
  cargo: string;
  area_id: string | null;
  area: string;
  piso: string;
  foto_url: string;
  activo: number;
  estado: string;
  schedule_id: string | null;
  horario: string;
}

export interface EmpleadoFiltros {
  area?: string;
  cargo?: string;
}

export interface CrearEmpleadoData {
  cedula?: string;
  nombre: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  cargo_id?: string;
  area_id?: string;
}

export interface ActualizarEmpleadoData {
  nombre?: string;
  apellido?: string;
  correo?: string;
  email?: string;
  telefono?: string;
  phone?: string;
  fecha_nacimiento?: string;
  cargo_id?: string;
  area_id?: string;
  schedule_id?: string;
  activo?: number | boolean;
  foto_url?: string;
  cedula?: string;
}