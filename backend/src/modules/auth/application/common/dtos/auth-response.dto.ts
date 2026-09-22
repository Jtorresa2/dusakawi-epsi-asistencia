export interface AuthResposeDto {
  readonly token: string;
  readonly user?: {
    id: string;
    username: string;
    nombre: string;
    email: string;
    rol: string;
    area_id?: string;
    cargo_id?: string;
  };
  readonly password_reset_required?: boolean;
}
