export interface CargoListItemDto {
  id: string;
  nombre: string;
  name: string;
  descripcion: string;
  description: string;
  estado: 'activo' | 'inactivo';
  area_id: string | null;
  area: { id: string; nombre: string } | null;
  areas: string;
  empleados_count: number;
}