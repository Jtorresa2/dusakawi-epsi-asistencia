export interface CreateCargoCommandDto {
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
  area_id?: string | null;
  areaId?: string | null;
  estado?: string;
  active?: boolean;
}